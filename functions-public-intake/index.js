const admin = require('firebase-admin');
const crypto = require('crypto');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineString } = require('firebase-functions/params');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { cleanupExpiredUploads } = require('./upload-cleanup');
const { processSensitiveVaultRetention } = require('./sensitive-vault-retention');
const { chainedAuditEvent, mayApproveFalsePositive, mayAuthorizeDownload, normalizeObjectIdentity, sameObjectIdentity, validatePurpose } = require('./sensitive-vault-policy');

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
const UPLOAD_GRANT_MINUTES = 15;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_PACKET_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_PACKET_FILES = 12;
const MAX_GRANTS_PER_HOUR = 12;
const VAULT_SERVICE_ACCOUNT = defineString('PAL_VAULT_SERVICE_ACCOUNT');
const RESCAN_BUCKET = defineString('PAL_RESCAN_BUCKET');
const VAULT_RUNTIME = Object.freeze({ region: REGION, cors: true, timeoutSeconds: 30, memory: '256MiB', maxInstances: 10,
  serviceAccount: VAULT_SERVICE_ACCOUNT });

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

function safeFileName(value) {
  return text(value, 180).replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/[\r\n"]/g, '_') || 'PAL-upload';
}

function uploadRequest(data = {}) {
  const intakeId = text(data.intakeId, 180);
  const token = text(data.token, 200);
  const folder = text(data.folder, 40);
  const name = safeFileName(data.name);
  const label = text(data.type, 120);
  const contentType = text(data.contentType, 120).toLowerCase();
  const size = Number(data.size || 0);
  const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  const labels = folder === 'certUploads' ? CERT_LABELS : PAYROLL_LABELS;
  if (!intakeId || !token || !UPLOAD_FOLDERS.has(folder) || !labels.has(label)
      || UPLOAD_EXTENSIONS.get(extension) !== contentType || !UPLOAD_TYPES.test(contentType)
      || !Number.isSafeInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    throw new HttpsError('invalid-argument', 'This file is not allowed for the PAL intake packet.');
  }
  return { intakeId, token, folder, name, label, contentType, size, extension };
}

function fileSignatureMatches(buffer, contentType) {
  const bytes = Buffer.from(buffer || []);
  if (contentType === 'application/pdf') return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  if (contentType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (contentType === 'image/webp') return bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  if (contentType === 'image/heic' || contentType === 'image/heif') {
    const brand = bytes.length >= 12 ? bytes.subarray(8, 12).toString('ascii') : '';
    return bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp' && ['heic','heix','hevc','hevx','mif1','msf1'].includes(brand);
  }
  return false;
}

async function officeActor(auth) {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized PAL Office account.');
  const snap = await db.collection('users').doc(auth.uid).get();
  const profile = snap.exists ? (snap.data() || {}) : {};
  const role = text(profile.role || profile.accessLevel, 40).toLowerCase();
  if (profile.disabled === true || !['office', 'admin'].includes(role)) {
    throw new HttpsError('permission-denied', 'PAL Office or Admin access is required.');
  }
  return { uid: auth.uid, email: text(auth.token?.email, 180), role, sensitiveVaultAccess: profile.sensitiveVaultAccess === true };
}

function requireVaultActor(actor) {
  if (actor.role !== 'admin' && actor.sensitiveVaultAccess !== true) {
    throw new HttpsError('permission-denied', 'Separate PAL payroll-vault access is required.');
  }
  return actor;
}

function vaultRef(intakeId) { return db.collection('sensitiveIntakeVaults').doc(intakeId); }

async function writeVaultAudit(input) {
  const eventId = crypto.randomUUID();
  const occurredAt = new Date().toISOString();
  const headRef = db.collection('sensitiveVaultAuditState').doc('head');
  const eventRef = db.collection('sensitiveVaultAuditEvents').doc(eventId);
  await db.runTransaction(async transaction => {
    const head = await transaction.get(headRef);
    const previousHash = head.exists ? text(head.data()?.eventHash, 64) : '';
    const event = chainedAuditEvent(input, previousHash, occurredAt);
    transaction.create(eventRef, { ...event, occurredAtTimestamp: Timestamp.fromDate(new Date(occurredAt)) });
    transaction.set(headRef, { version: 1, eventId, eventHash: event.eventHash, updatedAt: FieldValue.serverTimestamp() });
  });
  return eventId;
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

function publicView(id, row, vault = {}) {
  const allowed = [
    'name','phone','email','trade','projectName','projectJobNumber','foreman','startDate','required','notes',
    'employeeNotes','status','existingEmployeePayrollDocsOnFile','emergencyContactName','emergencyContactPhone',
    'orientationForm','drugConsentForm','safetyAgreementForm','certFiles',
    'certUploadsCompleted','payrollIdUploadsCompleted','packetChecklist','packetSubmitted'
  ];
  const result = { id };
  for (const key of allowed) if (row[key] !== undefined) result[key] = row[key];
  if (vault.w4Form !== undefined) result.w4Form = vault.w4Form;
  else if (row.w4Form !== undefined) result.w4Form = row.w4Form; // Existing records remain readable until separately approved migration.
  if (vault.payrollIdFiles !== undefined) result.payrollIdFiles = vault.payrollIdFiles;
  else if (row.payrollIdFiles !== undefined) result.payrollIdFiles = row.payrollIdFiles;
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
    w4: payrollBypass || row.w4Completed === true || row.w4Form?.completed === true,
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
  const vaultSnap = await vaultRef(intakeId).get();
  return { intake: publicView(intakeId, row, vaultSnap.exists ? vaultSnap.data() : {}), expiresAt: row.publicAccess.expiresAt.toDate().toISOString() };
});

exports.updatePublicIntakeV2 = onCall({ region: REGION, cors: true, timeoutSeconds: 30, memory: '256MiB', maxInstances: 20 }, async request => {
  const intakeId = text(request.data?.intakeId, 180);
  const token = text(request.data?.token, 200);
  const action = text(request.data?.action, 40);
  const payload = request.data?.payload || {};
  if (!intakeId || !token) throw new HttpsError('permission-denied', 'A valid PAL intake link is required.');
  const ref = db.collection('newHireIntakes').doc(intakeId);
  let result;
  let updatedW4Form;
  await db.runTransaction(async transaction => {
    const sensitiveRef = vaultRef(intakeId);
    const [snap, sensitiveSnap] = await Promise.all([transaction.get(ref), transaction.get(sensitiveRef)]);
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
      updatedW4Form = formPayload(payload, ['firstName','lastName','address','city','state','zip','ssn','filingStatus','multipleJobs','childCredit','otherCredit','totalCredits','otherIncome','deductions','extraWithholding','notes','signature','dateSigned']);
      transaction.set(sensitiveRef, { w4Form: updatedW4Form, updatedAt: FieldValue.serverTimestamp(), version: 1 }, { merge: true });
      update = { w4Completed: true, w4Form: FieldValue.delete() };
    } else if (action === 'submit') {
      const state = checklist(row);
      if (!state.orientation || !state.drug || !state.safety || !state.w4 || !state.certs || !state.payroll) throw new HttpsError('failed-precondition', 'Complete every required packet step before submitting.');
      update = { packetChecklist: state, packetSubmitted: true, packetSubmittedAt: FieldValue.serverTimestamp(), status: 'Ready for Review', 'publicAccess.revokedAt': FieldValue.serverTimestamp() };
    } else throw new HttpsError('invalid-argument', 'This intake update is not allowed.');
    update.updatedAt = FieldValue.serverTimestamp();
    transaction.update(ref, update);
    const sensitive = sensitiveSnap.exists ? sensitiveSnap.data() : {};
    result = action === 'submit' ? { submitted: true } : { intake: publicView(intakeId, { ...row, ...update }, action === 'w4' ? { ...sensitive, w4Form: updatedW4Form } : sensitive) };
  });
  return result;
});

exports.createPublicIntakeUploadV2 = onCall({ region: REGION, cors: true, timeoutSeconds: 60, memory: '256MiB', maxInstances: 20 }, async request => {
  const spec = uploadRequest(request.data);
  const intakeRef = db.collection('newHireIntakes').doc(spec.intakeId);
  const authorizationRef = db.collection('publicIntakeUploadAuthorizations').doc();
  const grantToken = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const expiresAt = Timestamp.fromMillis(now + UPLOAD_GRANT_MINUTES * 60000);
  const path = `quarantine/newHireIntakes/${spec.intakeId}/${spec.folder}/${authorizationRef.id}.${spec.extension}`;
  await db.runTransaction(async transaction => {
    const snap = await transaction.get(intakeRef);
    if (!snap.exists) throw new HttpsError('permission-denied', 'This PAL link is invalid.');
    const row = snap.data() || {};
    requireActive(row, spec.token);
    if (spec.folder === 'payrollIdUploads' && row.existingEmployeePayrollDocsOnFile === true) throw new HttpsError('failed-precondition', 'PAL Office already verified payroll documents for this packet.');
    const existing = [...(Array.isArray(row.certFiles) ? row.certFiles : []), ...(Array.isArray(row.payrollIdFiles) ? row.payrollIdFiles : [])];
    const existingBytes = existing.reduce((sum, item) => sum + Math.max(0, Number(item?.size || 0)), 0);
    if (existing.length >= MAX_PACKET_FILES || existingBytes + spec.size > MAX_PACKET_UPLOAD_BYTES) throw new HttpsError('resource-exhausted', 'This packet reached its secure upload limit. Contact PAL Office.');
    const rate = row.publicUploadRate || {};
    const windowStart = rate.windowStart?.toMillis?.() || 0;
    const count = now - windowStart < 3600000 ? Number(rate.count || 0) : 0;
    if (count >= MAX_GRANTS_PER_HOUR) throw new HttpsError('resource-exhausted', 'Too many upload attempts. Wait and try again or contact PAL Office.');
    transaction.set(authorizationRef, {
      version: 2, intakeId: spec.intakeId, folder: spec.folder, path, name: spec.name, label: spec.label,
      contentType: spec.contentType, size: spec.size, grantTokenHash: hashToken(grantToken), state: 'issued',
      issuedAt: FieldValue.serverTimestamp(), expiresAt, usedAt: null, securityStatus: 'quarantine'
    });
    transaction.update(intakeRef, {
      publicUploadRate: { windowStart: Timestamp.fromMillis(count ? windowStart : now), count: count + 1 },
      updatedAt: FieldValue.serverTimestamp()
    });
  });
  let uploadUrl;
  if (process.env.FIREBASE_STORAGE_EMULATOR_HOST || process.env.STORAGE_EMULATOR_HOST) {
    uploadUrl = `emulator://public-intake-upload/${authorizationRef.id}`;
  } else {
    try {
      [uploadUrl] = await admin.storage().bucket().file(path).createResumableUpload({
        metadata: {
          contentType: spec.contentType,
          cacheControl: 'private, no-store, max-age=0',
          contentDisposition: `attachment; filename="${spec.name}"`,
          metadata: { palUploadAuthorization: authorizationRef.id, palSecurityStatus: 'quarantine' }
        },
        origin: '*'
      });
    } catch (error) {
      await authorizationRef.update({ state: 'failed', failedAt: FieldValue.serverTimestamp() }).catch(() => {});
      throw new HttpsError('unavailable', 'PAL secure upload could not start. Try again shortly.');
    }
  }
  return { authorizationId: authorizationRef.id, grantToken, uploadUrl, expiresAt: expiresAt.toDate().toISOString(), path, contentType: spec.contentType, size: spec.size };
});

exports.finalizePublicIntakeUploadV2 = onCall({ region: REGION, cors: true, timeoutSeconds: 60, memory: '256MiB', maxInstances: 20 }, async request => {
  const intakeId = text(request.data?.intakeId, 180);
  const token = text(request.data?.token, 200);
  const authorizationId = text(request.data?.authorizationId, 180);
  const grantToken = text(request.data?.grantToken, 200);
  const notes = text(request.data?.notes, 1200);
  if (!intakeId || !token || !/^[A-Za-z0-9_-]{8,180}$/.test(authorizationId) || !grantToken) throw new HttpsError('permission-denied', 'A valid PAL upload grant is required.');
  const intakeRef = db.collection('newHireIntakes').doc(intakeId);
  const authorizationRef = db.collection('publicIntakeUploadAuthorizations').doc(authorizationId);
  const [initialIntake, authorizationSnap] = await Promise.all([intakeRef.get(), authorizationRef.get()]);
  if (!initialIntake.exists || !authorizationSnap.exists) throw new HttpsError('permission-denied', 'This PAL upload grant is invalid.');
  requireActive(initialIntake.data() || {}, token);
  const grant = authorizationSnap.data() || {};
  const grantExpires = grant.expiresAt?.toMillis?.() || 0;
  if (grant.intakeId !== intakeId || grant.state !== 'issued' || grant.usedAt || grantExpires <= Date.now() || !safeEqualHex(text(grant.grantTokenHash, 64), hashToken(grantToken))) {
    throw new HttpsError('permission-denied', 'This PAL upload grant expired or was already used.');
  }
  const file = admin.storage().bucket().file(grant.path);
  let metadata;
  try { [metadata] = await file.getMetadata(); } catch (_) { throw new HttpsError('not-found', 'The file did not finish reaching PAL secure storage.'); }
  const storedSize = Number(metadata?.size || 0);
  const storedType = text(metadata?.contentType, 120).toLowerCase();
  const custom = metadata?.metadata || {};
  let prefix;
  try { [prefix] = await file.download({ start: 0, end: 31 }); } catch (_) { throw new HttpsError('failed-precondition', 'The uploaded file could not be inspected safely.'); }
  if (grant.path !== `quarantine/newHireIntakes/${intakeId}/${grant.folder}/${authorizationId}.${String(grant.name).split('.').pop().toLowerCase()}`
      || storedSize !== Number(grant.size) || storedType !== grant.contentType
      || custom.palUploadAuthorization !== authorizationId || custom.palSecurityStatus !== 'quarantine'
      || !fileSignatureMatches(prefix, storedType)) {
    await file.delete({ ignoreNotFound: true }).catch(() => {});
    await authorizationRef.update({ state: 'rejected', rejectedAt: FieldValue.serverTimestamp(), rejectionReason: 'verification-mismatch' }).catch(() => {});
    throw new HttpsError('failed-precondition', 'The uploaded file failed PAL security verification and was removed.');
  }
  const record = {
    type: grant.label, name: grant.name, path: grant.path, uploadedAt: new Date().toISOString(), source: grant.folder,
    size: storedSize, contentType: storedType, securityStatus: 'quarantined', malwareScanStatus: 'pending', downloadable: false
  };
  if (grant.folder === 'certUploads' && request.data?.expirationDate) record.expirationDate = text(request.data.expirationDate, 20);
  let totalCount = 0;
  await db.runTransaction(async transaction => {
    const [snap, authSnap] = await Promise.all([transaction.get(intakeRef), transaction.get(authorizationRef)]);
    const row = snap.data() || {};
    const currentGrant = authSnap.data() || {};
    requireActive(row, token);
    if (currentGrant.state !== 'issued' || currentGrant.usedAt || !safeEqualHex(text(currentGrant.grantTokenHash, 64), hashToken(grantToken))) throw new HttpsError('permission-denied', 'This PAL upload grant was already used.');
    if (grant.folder === 'payrollIdUploads' && row.existingEmployeePayrollDocsOnFile === true) throw new HttpsError('failed-precondition', 'PAL Office already verified payroll documents for this packet.');
    const sensitiveRef = vaultRef(intakeId);
    const sensitiveSnap = grant.folder === 'payrollIdUploads' ? await transaction.get(sensitiveRef) : null;
    const field = grant.folder === 'certUploads' ? 'certFiles' : 'payrollIdFiles';
    const source = grant.folder === 'certUploads' ? row : (sensitiveSnap?.data() || {});
    const files = Array.isArray(source[field]) ? source[field].filter(item => item?.path !== grant.path) : [];
    files.push(record); totalCount = files.length;
    const update = { status: 'Ready for Review', updatedAt: FieldValue.serverTimestamp() };
    if (grant.folder === 'certUploads') update[field] = files;
    else transaction.set(sensitiveRef, { payrollIdFiles: files, updatedAt: FieldValue.serverTimestamp(), version: 1 }, { merge: true });
    if (grant.folder === 'certUploads') update.certUploadsCompleted = true;
    else { update.payrollIdUploadsCompleted = true; update.payrollIdUploadCount = totalCount; }
    if (grant.folder === 'certUploads' && notes) update.certUploadNotes = notes;
    if (grant.folder === 'payrollIdUploads' && notes) update.payrollIdNotes = notes;
    transaction.update(intakeRef, update);
    transaction.update(authorizationRef, { state: 'quarantined', usedAt: FieldValue.serverTimestamp(), securityStatus: 'quarantined', malwareScanStatus: 'pending' });
  });
  return { status: 'quarantined', totalCount, record };
});

exports.getSensitiveIntakeVaultV1 = onCall(VAULT_RUNTIME, async request => {
  const actor = requireVaultActor(await officeActor(request.auth));
  const intakeId = text(request.data?.intakeId, 180);
  let purpose;
  try { purpose = validatePurpose(request.data?.purpose); } catch (_) { throw new HttpsError('invalid-argument', 'A business purpose is required.'); }
  const snap = await vaultRef(intakeId).get();
  await writeVaultAudit({ action: 'vault-read', actorUid: actor.uid, actorEmail: actor.email, intakeId, purpose, decision: snap.exists ? 'allowed' : 'denied', correlationId: crypto.randomUUID(), reason: snap.exists ? 'entitled-review' : 'vault-not-found' });
  if (!snap.exists) throw new HttpsError('not-found', 'The sensitive payroll vault record was not found.');
  return { vault: snap.data() };
});

exports.requestSensitiveIntakeDownloadV1 = onCall(VAULT_RUNTIME, async request => {
  const actor = requireVaultActor(await officeActor(request.auth));
  const intakeId = text(request.data?.intakeId, 180);
  const path = text(request.data?.path, 1024);
  let purpose;
  try { purpose = validatePurpose(request.data?.purpose); } catch (_) { throw new HttpsError('invalid-argument', 'A business purpose is required.'); }
  const snap = await vaultRef(intakeId).get();
  const files = Array.isArray(snap.data()?.payrollIdFiles) ? snap.data().payrollIdFiles : [];
  const record = files.find(item => item?.path === path);
  const sensitiveType = ['Social Security Card', 'Driver License / Photo ID'].includes(record?.type);
  if (!record) throw new HttpsError('not-found', 'The sensitive file was not found.');
  let approvalRef = null;
  if (sensitiveType) {
    const approvals = await db.collection('sensitiveDownloadApprovals').where('intakeId', '==', intakeId).where('path', '==', path).where('requesterUid', '==', actor.uid).where('state', '==', 'approved').limit(1).get();
    const approved = approvals.docs.find(item => (item.data()?.expiresAt?.toMillis?.() || 0) > Date.now());
    if (!approved) {
      const approval = await db.collection('sensitiveDownloadApprovals').add({ intakeId, path, requesterUid: actor.uid, purpose, state: 'pending', createdAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 3600000) });
      await writeVaultAudit({ action: 'vault-download', actorUid: actor.uid, actorEmail: actor.email, intakeId, objectPath: path, purpose, decision: 'denied', correlationId: approval.id, reason: 'second-approval-required' });
      return { status: 'approval-required', approvalId: approval.id };
    }
    approvalRef = approved.ref;
  }
  const file = admin.storage().bucket().file(path);
  const [metadata] = await file.getMetadata();
  const currentIdentity = normalizeObjectIdentity({ path, generation: metadata.generation, size: Number(metadata.size), contentType: metadata.contentType, sha256: metadata.metadata?.palSha256 });
  if (!mayAuthorizeDownload({ scanState: record.malwareScanStatus, recordedIdentity: record.objectIdentity, currentIdentity, entitled: true, disabled: false, purpose,
    falsePositiveReviewRequired: record.falsePositiveReviewRequired === true, falsePositiveApproved: record.falsePositiveApproved === true })) throw new HttpsError('failed-precondition', 'This file is not verified clean and available.');
  const [url] = await file.getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 5 * 60000, queryParams: { generation: currentIdentity.generation }, responseDisposition: `attachment; filename="${safeFileName(record.name)}"` });
  await writeVaultAudit({ action: 'vault-download', actorUid: actor.uid, actorEmail: actor.email, intakeId, objectPath: path, purpose, decision: 'allowed', correlationId: crypto.randomUUID(), reason: 'verified-clean' });
  if (approvalRef) await approvalRef.update({ state: 'consumed', consumedAt: FieldValue.serverTimestamp() });
  return { status: 'authorized', url, expiresAt: new Date(Date.now() + 5 * 60000).toISOString() };
});

exports.approveSensitiveIntakeDownloadV1 = onCall(VAULT_RUNTIME, async request => {
  const actor = requireVaultActor(await officeActor(request.auth));
  const approvalId = text(request.data?.approvalId, 180);
  const ref = db.collection('sensitiveDownloadApprovals').doc(approvalId);
  await db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    const row = snap.data() || {};
    if (!snap.exists || row.state !== 'pending' || row.requesterUid === actor.uid || (row.expiresAt?.toMillis?.() || 0) <= Date.now()) throw new HttpsError('failed-precondition', 'This approval request cannot be approved.');
    transaction.update(ref, { state: 'approved', approverUid: actor.uid, approvedAt: FieldValue.serverTimestamp() });
  });
  return { status: 'approved' };
});

exports.listSensitiveVaultApprovalsV1 = onCall(VAULT_RUNTIME, async request => {
  const actor = requireVaultActor(await officeActor(request.auth));
  if (actor.role !== 'admin') throw new HttpsError('permission-denied', 'Only an Admin can review pending sensitive-file approvals.');
  let purpose;
  try { purpose = validatePurpose(request.data?.purpose); } catch (_) { throw new HttpsError('invalid-argument', 'A business purpose is required.'); }
  const [downloads, falsePositives] = await Promise.all([
    db.collection('sensitiveDownloadApprovals').where('state', '==', 'pending').limit(25).get(),
    db.collection('sensitiveFalsePositiveReviews').where('state', '==', 'pending').limit(25).get()
  ]);
  const rows = [
    ...downloads.docs.map(item => ({ id: item.id, kind: 'download', intakeId: text(item.data()?.intakeId, 180),
      path: text(item.data()?.path, 1024), purpose: text(item.data()?.purpose, 500), requesterUid: text(item.data()?.requesterUid, 180),
      requestedAt: item.data()?.createdAt?.toDate?.().toISOString?.() || '', expiresAt: item.data()?.expiresAt?.toDate?.().toISOString?.() || '' })),
    ...falsePositives.docs.map(item => ({ id: item.id, kind: 'false-positive', intakeId: text(item.data()?.intakeId, 180),
      path: text(item.data()?.path, 1024), purpose: text(item.data()?.purpose, 500), requesterUid: text(item.data()?.requesterUid, 180),
      requestedAt: text(item.data()?.requestedAt, 40), expiresAt: '' }))
  ].filter(item => item.intakeId && item.path && item.requesterUid);
  await writeVaultAudit({ action: 'approval-queue', actorUid: actor.uid, actorEmail: actor.email, intakeId: 'approval-queue',
    purpose, decision: 'allowed', correlationId: crypto.randomUUID(), reason: `pending-items-${rows.length}` });
  return { approvals: rows };
});

exports.requestSensitiveFalsePositiveReviewV1 = onCall(VAULT_RUNTIME, async request => {
  const actor = requireVaultActor(await officeActor(request.auth));
  const intakeId = text(request.data?.intakeId, 180);
  const path = text(request.data?.path, 1024);
  let purpose;
  try { purpose = validatePurpose(request.data?.purpose); } catch (_) { throw new HttpsError('invalid-argument', 'A detailed false-positive justification is required.'); }
  const vault = await vaultRef(intakeId).get();
  const record = (Array.isArray(vault.data()?.payrollIdFiles) ? vault.data().payrollIdFiles : []).find(item => item?.path === path);
  if (!record || !['infected', 'manual-review', 'unsupported', 'error', 'timeout'].includes(record.malwareScanStatus)) throw new HttpsError('failed-precondition', 'Only a locked review file can enter false-positive review.');
  const source = admin.storage().bucket().file(path);
  const [metadata] = await source.getMetadata();
  const currentIdentity = normalizeObjectIdentity({ path, generation: metadata.generation, size: Number(metadata.size),
    contentType: metadata.contentType, sha256: metadata.metadata?.palSha256 });
  if (!record.objectIdentity || !sameObjectIdentity(currentIdentity, record.objectIdentity)) throw new HttpsError('failed-precondition', 'The locked file identity changed and cannot be reviewed.');
  const ref = db.collection('sensitiveFalsePositiveReviews').doc();
  const rescanPath = `false-positive-rescans/${ref.id}/${safeFileName(record.name)}`;
  const destination = admin.storage().bucket(RESCAN_BUCKET.value()).file(rescanPath);
  await ref.create({ version: 1, intakeId, path, requesterUid: actor.uid, purpose, state: 'pending', originalIdentity: currentIdentity,
    rescanObjectPath: rescanPath, requestedAt: new Date().toISOString(), createdAt: FieldValue.serverTimestamp() });
  try {
    // Persist the callback target before object creation can emit its finalize event.
    await source.copy(destination, {
      preconditionOpts: { ifSourceGenerationMatch: Number(currentIdentity.generation) },
      contentType: currentIdentity.contentType,
      cacheControl: 'private, no-store, max-age=0',
      metadata: {
        palFalsePositiveReviewId: ref.id, palOriginalIntakeId: intakeId, palOriginalPath: currentIdentity.path,
        palOriginalGeneration: currentIdentity.generation, palOriginalSize: String(currentIdentity.size),
        palOriginalContentType: currentIdentity.contentType, palOriginalSha256: currentIdentity.sha256, palRescanObjectPath: rescanPath
      }
    });
  } catch (_) {
    await ref.update({ state: 'copy-failed', failedAt: FieldValue.serverTimestamp() }).catch(() => {});
    throw new HttpsError('unavailable', 'The protected rescan could not be queued. The file remains locked.');
  }
  await writeVaultAudit({ action: 'false-positive-review', actorUid: actor.uid, actorEmail: actor.email, intakeId, objectPath: path,
    purpose, decision: 'manual-review', correlationId: ref.id, reason: 'fresh-clean-rescan-and-admin-required' });
  return { status: 'pending-rescan', reviewId: ref.id };
});

exports.recordSensitiveFalsePositiveRescanV1 = onRequest({ region: REGION, timeoutSeconds: 30, memory: '256MiB', maxInstances: 5,
  serviceAccount: VAULT_SERVICE_ACCOUNT, invoker: 'private' }, async (request, response) => {
  if (request.method !== 'POST') return response.status(405).json({ error: 'method-not-allowed' });
  const reviewId = text(request.body?.reviewId, 180);
  const rescanResult = text(request.body?.result, 40);
  const scannedAt = text(request.body?.scannedAt, 40);
  const reviewRef = db.collection('sensitiveFalsePositiveReviews').doc(reviewId);
  try {
    if (!reviewId || !['clean', 'infected'].includes(rescanResult) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(scannedAt)) throw new Error('invalid-evidence');
    await db.runTransaction(async transaction => {
      const reviewSnap = await transaction.get(reviewRef);
      const review = reviewSnap.data() || {};
      if (!reviewSnap.exists || review.state !== 'pending' || review.rescanObjectPath !== text(request.body?.rescanObjectPath, 1024)) throw new Error('invalid-review');
      const sensitiveRef = vaultRef(text(review.intakeId, 180));
      const vaultSnap = await transaction.get(sensitiveRef);
      const files = Array.isArray(vaultSnap.data()?.payrollIdFiles) ? vaultSnap.data().payrollIdFiles : [];
      const index = files.findIndex(item => item?.path === review.path);
      if (index < 0) throw new Error('missing-object');
      const evidenceIdentity = normalizeObjectIdentity(request.body?.originalIdentity);
      if (!sameObjectIdentity(evidenceIdentity, review.originalIdentity)
          || text(request.body?.sha256, 64) !== evidenceIdentity.sha256) throw new Error('identity-mismatch');
      files[index] = { ...files[index], falsePositiveReviewRequired: true, falsePositiveApproved: false, rescanEvidence: {
        result: rescanResult, scannerPrincipal: process.env.PAL_TRUSTED_SCANNER_IDENTITY,
        scannedAt, clamVersion: text(request.body?.clamVersion, 120), objectIdentity: evidenceIdentity } };
      transaction.update(sensitiveRef, { payrollIdFiles: files, updatedAt: FieldValue.serverTimestamp() });
      transaction.update(reviewRef, { rescanResult, rescanRecordedAt: FieldValue.serverTimestamp() });
    });
    return response.status(200).json({ status: 'recorded' });
  } catch (_) {
    return response.status(403).json({ error: 'rescan-evidence-rejected' });
  }
});

exports.approveSensitiveFalsePositiveReviewV1 = onCall(VAULT_RUNTIME, async request => {
  const actor = requireVaultActor(await officeActor(request.auth));
  if (actor.role !== 'admin') throw new HttpsError('permission-denied', 'An Admin must approve a false-positive release.');
  const reviewId = text(request.data?.reviewId, 180);
  const reviewRef = db.collection('sensitiveFalsePositiveReviews').doc(reviewId);
  let auditInput;
  await db.runTransaction(async transaction => {
    const reviewSnap = await transaction.get(reviewRef);
    const review = reviewSnap.data() || {};
    const sensitiveRef = vaultRef(text(review.intakeId, 180));
    const vaultSnap = await transaction.get(sensitiveRef);
    const files = Array.isArray(vaultSnap.data()?.payrollIdFiles) ? vaultSnap.data().payrollIdFiles : [];
    const index = files.findIndex(item => item?.path === review.path);
    const record = files[index];
    if (!reviewSnap.exists || index < 0 || !mayApproveFalsePositive({ requesterUid: review.requesterUid, approverUid: actor.uid,
      approverRole: actor.role, requestState: review.state, purpose: review.purpose, originalIdentity: review.originalIdentity,
      currentIdentity: record.objectIdentity, requestedAt: review.requestedAt, rescanEvidence: record.rescanEvidence,
      configuredScanner: process.env.PAL_TRUSTED_SCANNER_IDENTITY })) throw new HttpsError('failed-precondition', 'This file lacks the required independent clean rescan or approval separation.');
    files[index] = { ...record, malwareScanStatus: record.rescanEvidence.result, falsePositiveReviewRequired: true, falsePositiveApproved: true,
      falsePositiveReviewId: reviewId, falsePositiveApprovedAt: new Date().toISOString(), falsePositiveApprovedBy: actor.uid };
    transaction.update(sensitiveRef, { payrollIdFiles: files, updatedAt: FieldValue.serverTimestamp() });
    transaction.update(reviewRef, { state: 'approved', approverUid: actor.uid, approvedAt: FieldValue.serverTimestamp() });
    auditInput = { action: 'false-positive-review', actorUid: actor.uid, actorEmail: actor.email, intakeId: review.intakeId,
      objectPath: review.path, purpose: review.purpose, decision: 'allowed', correlationId: reviewId, reason: 'independent-clean-rescan-approved' };
  });
  await writeVaultAudit(auditInput);
  return { status: 'approved' };
});

exports.cleanupExpiredPublicIntakeUploadsV2 = onSchedule({ region: REGION, schedule: 'every 60 minutes', timeZone: 'America/New_York', timeoutSeconds: 300, memory: '256MiB', maxInstances: 1 }, async () => {
  const removed = await cleanupExpiredUploads({ db, bucket: admin.storage().bucket(), Timestamp, FieldValue });
  console.log(JSON.stringify({ event: 'public-intake-upload-cleanup', removed }));
});

exports.enforceSensitiveVaultRetentionV1 = onSchedule({ region: REGION, schedule: 'every 60 minutes', timeZone: 'America/New_York', timeoutSeconds: 300, memory: '256MiB', maxInstances: 1, serviceAccount: VAULT_SERVICE_ACCOUNT }, async () => {
  const result = await processSensitiveVaultRetention({ db, bucket: admin.storage().bucket(), FieldValue, writeAudit: writeVaultAudit });
  console.log(JSON.stringify({ event: 'sensitive-vault-retention', ...result }));
});
