const admin = require('firebase-admin');
const crypto = require('crypto');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');

admin.initializeApp();
const db = getFirestore();
const REGION = 'us-central1';
const MAX_LINK_DAYS = 30;
const DEFAULT_LINK_DAYS = 14;
const CLOSED_STATUSES = new Set(['Archived', 'Good To Work']);
const UPLOAD_FOLDERS = new Set(['certUploads', 'payrollIdUploads']);
const UPLOAD_TYPES = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/i;
const CERT_LABELS = new Set(['OSHA 30 / OSHA 10', 'SST Card', 'Scaffold Certification', 'Lift Certification', 'Fire Watch / G60', 'Other Certification']);
const PAYROLL_LABELS = new Set(['Driver License / Photo ID', 'Union Book / Union Card', 'Social Security Card', 'W-4 / Payroll Form', 'Additional Payroll / ID Document']);
const UPLOAD_EXTENSIONS = new Map([['pdf','application/pdf'],['jpg','image/jpeg'],['jpeg','image/jpeg'],['png','image/png'],['webp','image/webp'],['heic','image/heic'],['heif','image/heif']]);

function text(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function safeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/.test(left) || !/^[a-f0-9]{64}$/.test(right)) return false;
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

async function officeActor(auth) {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized PAL Office account.');
  const snap = await db.collection('users').doc(auth.uid).get();
  const profile = snap.exists ? (snap.data() || {}) : {};
  const role = text(profile.role || profile.accessLevel, 40).toLowerCase();
  if (profile.disabled === true || !['office', 'admin'].includes(role)) {
    throw new HttpsError('permission-denied', 'PAL Office or Admin access is required.');
  }
  return { uid: auth.uid, email: text(auth.token?.email, 180) };
}

function accessState(intake, suppliedToken) {
  const access = intake.publicAccess || {};
  const suppliedHash = hashToken(text(suppliedToken, 200));
  if (!safeEqualHex(text(access.tokenHash, 64), suppliedHash)) return 'invalid';
  if (intake.archived === true || CLOSED_STATUSES.has(intake.status) || intake.packetSubmitted === true) return 'closed';
  if (access.revokedAt) return 'revoked';
  const expires = access.expiresAt?.toMillis?.() || 0;
  if (!expires || expires <= Date.now()) return 'expired';
  return 'active';
}

function requireActive(intake, token) {
  const state = accessState(intake, token);
  if (state !== 'active') {
    const message = state === 'expired' ? 'This PAL link expired. Ask PAL Office for a new link.'
      : state === 'closed' ? 'This PAL packet is complete or closed.'
      : state === 'revoked' ? 'This PAL link was replaced or revoked. Ask PAL Office for a new link.'
      : 'This PAL link is invalid.';
    throw new HttpsError(state === 'expired' ? 'deadline-exceeded' : 'permission-denied', message);
  }
}

function publicView(id, row) {
  const allowed = [
    'name','phone','email','trade','projectName','projectJobNumber','foreman','startDate','required','notes',
    'employeeNotes','status','existingEmployeePayrollDocsOnFile','emergencyContactName','emergencyContactPhone',
    'orientationForm','drugConsentForm','safetyAgreementForm','w4Form','certFiles','payrollIdFiles',
    'certUploadsCompleted','payrollIdUploadsCompleted','packetChecklist','packetSubmitted'
  ];
  const result = { id };
  for (const key of allowed) if (row[key] !== undefined) result[key] = row[key];
  return result;
}

function basicPayload(input = {}) {
  return {
    name: text(input.name, 160), phone: text(input.phone, 40), email: text(input.email, 180), trade: text(input.trade, 120),
    emergencyContactName: text(input.emergencyContactName, 160), emergencyContactPhone: text(input.emergencyContactPhone, 40),
    employeeNotes: text(input.employeeNotes, 2000), source: 'public-guided-intake'
  };
}

function formPayload(input, allowed, limits = {}) {
  if (!input || typeof input !== 'object' || input.completed !== true) throw new HttpsError('invalid-argument', 'The completed form is required.');
  const result = { completed: true };
  for (const key of allowed) {
    const value = input[key];
    if (Array.isArray(value)) result[key] = value.slice(0, limits[key] || 10).map(item => typeof item === 'boolean' ? item : text(item, 200));
    else if (typeof value === 'boolean' || typeof value === 'number') result[key] = value;
    else result[key] = text(value, limits[key] || 2000);
  }
  result.savedAt = new Date().toISOString();
  result.savedBy = 'public-intake-v2';
  return result;
}

function checklist(row) {
  const payrollBypass = row.existingEmployeePayrollDocsOnFile === true;
  return {
    orientation: row.orientationForm?.completed === true,
    drug: row.drugConsentForm?.completed === true,
    safety: row.safetyAgreementForm?.completed === true,
    w4: payrollBypass || row.w4Form?.completed === true,
    certs: row.certUploadsCompleted === true || (Array.isArray(row.certFiles) && row.certFiles.length > 0),
    payroll: payrollBypass || row.payrollIdUploadsCompleted === true || (Array.isArray(row.payrollIdFiles) && row.payrollIdFiles.length > 0),
    payrollBypass
  };
}

exports.issuePublicIntakeAccessV2 = onCall({ region: REGION, cors: true, timeoutSeconds: 30, memory: '256MiB', maxInstances: 10 }, async request => {
  const actor = await officeActor(request.auth);
  const intakeId = text(request.data?.intakeId, 180);
  if (!/^[A-Za-z0-9_-]{8,180}$/.test(intakeId)) throw new HttpsError('invalid-argument', 'A valid intake ID is required.');
  const ref = db.collection('newHireIntakes').doc(intakeId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'The intake packet was not found.');
  const row = snap.data() || {};
  if (row.archived === true || CLOSED_STATUSES.has(row.status) || row.packetSubmitted === true) throw new HttpsError('failed-precondition', 'Completed or archived packets cannot receive a public link.');
  const days = Math.max(1, Math.min(MAX_LINK_DAYS, Number(request.data?.days || DEFAULT_LINK_DAYS)));
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = Timestamp.fromMillis(Date.now() + days * 86400000);
  await ref.update({
    publicAccess: { version: 2, tokenHash: hashToken(token), issuedAt: FieldValue.serverTimestamp(), expiresAt, issuedBy: actor.uid, revokedAt: null },
    legacyPublicAccessDisabled: true,
    updatedAt: FieldValue.serverTimestamp()
  });
  return { intakeId, token, expiresAt: expiresAt.toDate().toISOString() };
});

exports.getPublicIntakeV2 = onCall({ region: REGION, cors: true, timeoutSeconds: 20, memory: '256MiB', maxInstances: 20 }, async request => {
  const intakeId = text(request.data?.intakeId, 180);
  const token = text(request.data?.token, 200);
  if (!intakeId || !token) throw new HttpsError('permission-denied', 'A valid PAL intake link is required.');
  const snap = await db.collection('newHireIntakes').doc(intakeId).get();
  if (!snap.exists) throw new HttpsError('permission-denied', 'This PAL link is invalid.');
  const row = snap.data() || {};
  requireActive(row, token);
  return { intake: publicView(intakeId, row), expiresAt: row.publicAccess.expiresAt.toDate().toISOString() };
});

exports.updatePublicIntakeV2 = onCall({ region: REGION, cors: true, timeoutSeconds: 30, memory: '256MiB', maxInstances: 20 }, async request => {
  const intakeId = text(request.data?.intakeId, 180);
  const token = text(request.data?.token, 200);
  const action = text(request.data?.action, 40);
  const payload = request.data?.payload || {};
  if (!intakeId || !token) throw new HttpsError('permission-denied', 'A valid PAL intake link is required.');
  const ref = db.collection('newHireIntakes').doc(intakeId);
  let result;
  await db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new HttpsError('permission-denied', 'This PAL link is invalid.');
    const row = snap.data() || {};
    requireActive(row, token);
    let update;
    if (action === 'basic') update = basicPayload(payload);
    else if (action === 'orientation') update = { orientationForm: formPayload(payload, ['employeeName','date','project','signature','dateSigned','orientationLanguage','orientationAnswers','orientationQuizAnswered','orientationAttempts','orientationScore','orientationModuleVersion','orientationCompletedAt'], { orientationAnswers: 5, orientationQuizAnswered: 5, orientationAttempts: 10 }) };
    else if (action === 'drug') update = { drugConsentForm: formPayload(payload, ['employeeName','date','project','consent','notes','signature','dateSigned']) };
    else if (action === 'safety') update = { safetyAgreementForm: formPayload(payload, ['employeeName','date','project','fallAcknowledgement','scaffoldAcknowledgement','notes','signature','dateSigned']) };
    else if (action === 'w4') {
      if (row.existingEmployeePayrollDocsOnFile === true) throw new HttpsError('failed-precondition', 'PAL Office already verified payroll documents for this packet.');
      update = { w4Form: formPayload(payload, ['firstName','lastName','address','city','state','zip','ssn','filingStatus','multipleJobs','childCredit','otherCredit','totalCredits','otherIncome','deductions','extraWithholding','notes','signature','dateSigned']) };
    } else if (action === 'submit') {
      const state = checklist(row);
      if (!state.orientation || !state.drug || !state.safety || !state.w4 || !state.certs || !state.payroll) throw new HttpsError('failed-precondition', 'Complete every required packet step before submitting.');
      update = { packetChecklist: state, packetSubmitted: true, packetSubmittedAt: FieldValue.serverTimestamp(), status: 'Ready for Review', 'publicAccess.revokedAt': FieldValue.serverTimestamp() };
    } else throw new HttpsError('invalid-argument', 'This intake update is not allowed.');
    update.updatedAt = FieldValue.serverTimestamp();
    transaction.update(ref, update);
    result = action === 'submit' ? { submitted: true } : { intake: publicView(intakeId, { ...row, ...update }) };
  });
  return result;
});

exports.finalizePublicIntakeUploadV2 = onCall({ region: REGION, cors: true, timeoutSeconds: 60, memory: '256MiB', maxInstances: 20 }, async request => {
  const intakeId = text(request.data?.intakeId, 180);
  const token = text(request.data?.token, 200);
  const folder = text(request.data?.folder, 40);
  const path = text(request.data?.path, 900);
  const name = text(request.data?.name, 240);
  const type = text(request.data?.type, 120);
  const expectedContentType = text(request.data?.contentType, 120).toLowerCase();
  const expectedSize = Number(request.data?.size || 0);
  const notes = text(request.data?.notes, 1200);
  if (!intakeId || !token || !UPLOAD_FOLDERS.has(folder)) throw new HttpsError('permission-denied', 'A valid PAL upload link is required.');
  const prefix = `newHireIntakes/${intakeId}/${folder}/`;
  const storedName = path.startsWith(prefix) ? path.slice(prefix.length) : '';
  const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  const labels = folder === 'certUploads' ? CERT_LABELS : PAYROLL_LABELS;
  if (!storedName || storedName.includes('/') || !labels.has(type) || UPLOAD_EXTENSIONS.get(extension) !== expectedContentType || !UPLOAD_TYPES.test(expectedContentType) || expectedSize <= 0 || expectedSize >= 25 * 1024 * 1024) {
    throw new HttpsError('invalid-argument', 'The uploaded file does not match this intake packet.');
  }
  const ref = db.collection('newHireIntakes').doc(intakeId);
  const initial = await ref.get();
  if (!initial.exists) throw new HttpsError('permission-denied', 'This PAL link is invalid.');
  requireActive(initial.data() || {}, token);
  const file = admin.storage().bucket().file(path);
  let metadata;
  try { [metadata] = await file.getMetadata(); } catch (_) { throw new HttpsError('not-found', 'The file did not finish reaching PAL secure storage.'); }
  const storedSize = Number(metadata?.size || 0);
  const storedType = text(metadata?.contentType, 120).toLowerCase();
  if (storedSize !== expectedSize || !UPLOAD_TYPES.test(storedType)) throw new HttpsError('failed-precondition', 'The saved file could not be verified.');
  const record = { type, name, path, uploadedAt: new Date().toISOString(), source: folder, size: storedSize, contentType: storedType };
  if (folder === 'certUploads' && request.data?.expirationDate) record.expirationDate = text(request.data.expirationDate, 20);
  let totalCount = 0;
  await db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    const row = snap.data() || {};
    requireActive(row, token);
    if (folder === 'payrollIdUploads' && row.existingEmployeePayrollDocsOnFile === true) throw new HttpsError('failed-precondition', 'PAL Office already verified payroll documents for this packet.');
    const field = folder === 'certUploads' ? 'certFiles' : 'payrollIdFiles';
    const files = Array.isArray(row[field]) ? row[field].filter(item => item?.path !== path) : [];
    files.push(record); totalCount = files.length;
    const update = { [field]: files, status: 'Ready for Review', updatedAt: FieldValue.serverTimestamp() };
    if (folder === 'certUploads') update.certUploadsCompleted = true;
    else { update.payrollIdUploadsCompleted = true; update.payrollIdUploadCount = totalCount; }
    if (folder === 'certUploads' && notes) update.certUploadNotes = notes;
    if (folder === 'payrollIdUploads' && notes) update.payrollIdNotes = notes;
    transaction.update(ref, update);
  });
  return { status: 'saved', path, totalCount, record };
});
