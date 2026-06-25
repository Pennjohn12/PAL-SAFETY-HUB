const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { Resend } = require('resend');

admin.initializeApp();

const db = admin.firestore();
const resendApiKey = defineSecret('RESEND_API_KEY');

const BOOTSTRAP_ADMIN_EMAILS = new Set([
  'jvpanettiere@gmail.com',
  'jvpanettiere@outlook.com',
  'adilorenzo@palcorp.com',
  'jpanettiere@palcorp.com',
  'john.panettiere@palcorp.com',
  'pennj@palcorp.com'
]);

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRecipients(value) {
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(list.map(cleanEmail).filter(Boolean))].slice(0, 25);
}

function currentUsageId(date = new Date()) {
  return `pal-${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function getUserProfile(uid) {
  if (!uid) return {};
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? snap.data() || {} : {};
}

async function assertOfficeAccess(auth) {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in before sending email.');
  }
  const email = cleanEmail(auth.token?.email);
  const profile = await getUserProfile(auth.uid);
  const role = String(profile.role || '').toLowerCase();
  const accessLevel = String(profile.accessLevel || '').toLowerCase();
  const adminAccess = BOOTSTRAP_ADMIN_EMAILS.has(email)
    || profile.admin === true
    || profile.isAdmin === true
    || ['admin', 'administrator', 'owner'].includes(role)
    || ['admin', 'owner'].includes(accessLevel);
  const officeAccess = adminAccess
    || ['office', 'project manager', 'project_manager'].includes(role)
    || accessLevel === 'office';
  if (!officeAccess) {
    throw new HttpsError('permission-denied', 'Only office/admin can send app email.');
  }
  return { email, profile, adminAccess, officeAccess };
}

async function getEmailLimit() {
  const snap = await db.collection('integrationSettings').doc('pal').get();
  const data = snap.exists ? snap.data() || {} : {};
  const limit = Number(data.emailMonthlyLimit || 3000);
  return Number.isFinite(limit) && limit > 0 ? limit : 3000;
}

async function checkEmailUsage(count) {
  const usageId = currentUsageId();
  const usageRef = db.collection('usage').doc(usageId);
  const monthlyLimit = await getEmailLimit();
  const snap = await usageRef.get();
  const data = snap.exists ? snap.data() || {} : {};
  const used = Number(data.emailSent || 0);
  if (used + count > monthlyLimit) {
    throw new HttpsError('resource-exhausted', 'Monthly email limit reached.');
  }
  return { usageId, monthlyLimit };
}

async function recordEmailUsage(usageId, count, monthlyLimit) {
  await db.collection('usage').doc(usageId).set({
    month: usageId,
    emailSent: admin.firestore.FieldValue.increment(count),
    emailMonthlyLimit: monthlyLimit,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

async function logEmailEvent(payload) {
  await db.collection('auditLogs').add({
    action: 'email.sent',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    actorUid: payload.actorUid || '',
    actorEmail: payload.actorEmail || '',
    feature: payload.feature || 'manual',
    recipientCount: payload.recipientCount || 0,
    subject: payload.subject || '',
    provider: 'resend',
    providerId: payload.providerId || '',
    usageId: payload.usageId || ''
  });
}

exports.sendAppEmail = onCall({
  region: 'us-central1',
  secrets: [resendApiKey],
  enforceAppCheck: false
}, async request => {
  const access = await assertOfficeAccess(request.auth);
  const recipients = normalizeRecipients(request.data?.to);
  const subject = String(request.data?.subject || '').trim().slice(0, 160);
  const html = String(request.data?.html || '').trim();
  const text = String(request.data?.text || '').trim();
  const feature = String(request.data?.feature || 'manual').trim().slice(0, 80);

  if (!recipients.length) {
    throw new HttpsError('invalid-argument', 'At least one recipient is required.');
  }
  if (!subject) {
    throw new HttpsError('invalid-argument', 'Email subject is required.');
  }
  if (!html && !text) {
    throw new HttpsError('invalid-argument', 'Email body is required.');
  }

  const { usageId, monthlyLimit } = await checkEmailUsage(recipients.length);
  const resend = new Resend(resendApiKey.value());
  const from = process.env.RESEND_FROM_EMAIL || 'PAL Safety Hub <onboarding@resend.dev>';
  const replyTo = process.env.RESEND_REPLY_TO || access.email || undefined;

  const result = await resend.emails.send({
    from,
    to: recipients,
    subject,
    html: html || undefined,
    text: text || undefined,
    replyTo
  });

  if (result.error) {
    throw new HttpsError('internal', result.error.message || 'Email provider failed.');
  }

  await recordEmailUsage(usageId, recipients.length, monthlyLimit);

  await db.collection('integrationEmailLogs').add({
    provider: 'resend',
    providerId: result.data?.id || '',
    feature,
    to: recipients,
    subject,
    sentByUid: request.auth.uid,
    sentByEmail: access.email,
    usageId,
    sentAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await logEmailEvent({
    actorUid: request.auth.uid,
    actorEmail: access.email,
    feature,
    recipientCount: recipients.length,
    subject,
    providerId: result.data?.id || '',
    usageId
  });

  return {
    ok: true,
    providerId: result.data?.id || '',
    recipientCount: recipients.length,
    usageId
  };
});
