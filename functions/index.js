const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { Resend } = require('resend');
const crypto = require('crypto');
const QRCode = require('qrcode');

admin.initializeApp();

const db = admin.firestore();
const resendApiKey = defineSecret('RESEND_API_KEY');
const openaiApiKey = defineSecret('OPENAI_API_KEY');
const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID');
const twilioApiKeySid = defineSecret('TWILIO_API_KEY_SID');
const twilioApiKeySecret = defineSecret('TWILIO_API_KEY_SECRET');
const TWILIO_FROM_NUMBER = '+15164004507';

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

async function assertAiAccess(auth) {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in before generating a safety draft.');
  }
  const email = cleanEmail(auth.token?.email);
  const profile = await getUserProfile(auth.uid);
  const role = String(profile.role || '').trim().toLowerCase();
  const accessLevel = String(profile.accessLevel || '').trim().toLowerCase();
  const permitted = BOOTSTRAP_ADMIN_EMAILS.has(email)
    || profile.admin === true
    || profile.isAdmin === true
    || ['admin', 'administrator', 'owner', 'office', 'project manager', 'project_manager',
      'foreman', 'supervisor', 'field'].includes(role)
    || ['admin', 'owner', 'office', 'foreman', 'supervisor', 'field'].includes(accessLevel);
  if (!permitted) {
    throw new HttpsError('permission-denied', 'Your account cannot generate project safety drafts.');
  }
  return { email, profile };
}

function cleanText(value, maxLength = 1200) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

async function recordIntegrationFailure(payload = {}) {
  await db.collection('integrationFailureLogs').add({
    service: cleanText(payload.service, 40) || 'unknown',
    feature: cleanText(payload.feature, 80) || 'unknown',
    code: cleanText(payload.code, 80),
    message: cleanText(payload.message, 300) || 'Provider request failed.',
    actorUid: cleanText(payload.actorUid, 160),
    actorEmail: cleanEmail(payload.actorEmail),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function getIntegrationHealthData() {
  const usageId = currentUsageId();
  const [usageSnap, settingsSnap, failuresSnap] = await Promise.all([
    db.collection('usage').doc(usageId).get(),
    db.collection('integrationSettings').doc('pal').get(),
    db.collection('integrationFailureLogs').orderBy('createdAt', 'desc').limit(12).get()
  ]);
  const usage = usageSnap.data() || {};
  const settings = settingsSnap.data() || {};
  const service = (key, used, configuredLimit, defaultLimit, warningPercent) => {
    const limit = Number(configuredLimit || defaultLimit);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : defaultLimit;
    const safeUsed = Math.max(0, Number(used || 0));
    const percent = Math.min(100, Math.round((safeUsed / safeLimit) * 100));
    return {
      key, used: safeUsed, limit: safeLimit, percent, warningPercent,
      state: safeUsed >= safeLimit ? 'limit' : (percent >= warningPercent ? 'warning' : 'healthy')
    };
  };
  return {
    usageId,
    services: [
      service('email', usage.emailSent, settings.emailMonthlyLimit || usage.emailMonthlyLimit, 3000, 80),
      service('sms', usage.smsSent, settings.smsMonthlyLimit || usage.smsMonthlyLimit, 1000, 75),
      service('ai', usage.aiGenerations, settings.aiMonthlyLimit || usage.aiMonthlyLimit, 500, 75)
    ],
    recentFailures: failuresSnap.docs.map(doc => {
      const row = doc.data() || {};
      return {
        id: doc.id, service: cleanText(row.service, 40), feature: cleanText(row.feature, 80),
        code: cleanText(row.code, 80), message: cleanText(row.message, 300),
        createdAt: row.createdAt?.toDate ? row.createdAt.toDate().toISOString() : ''
      };
    })
  };
}

function localDateInTimeZone(value, timeZone = 'America/New_York') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(value ? new Date(value) : new Date());
  const part = type => parts.find(item => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function getResponseOutputText(result) {
  if (typeof result?.output_text === 'string' && result.output_text.trim()) {
    return result.output_text.trim();
  }
  return (Array.isArray(result?.output) ? result.output : [])
    .flatMap(item => Array.isArray(item?.content) ? item.content : [])
    .filter(item => item?.type === 'output_text' && typeof item.text === 'string')
    .map(item => item.text)
    .join('\n')
    .trim();
}

function isUsableSafetyDraft(draft) {
  return draft && typeof draft === 'object'
    && cleanText(draft.tasks_locations, 20).length >= 10
    && cleanText(draft.hazard1, 20).length >= 5
    && cleanText(draft.control1, 20).length >= 10
    && cleanText(draft.hazard2, 20).length >= 5
    && cleanText(draft.control2, 20).length >= 10;
}

const PAL_SAFETY_DRAFT_INSTRUCTIONS = `You draft PAL Environmental Services daily construction safety meetings for competent-foreman review.

FACT CONTROL
- Use only facts supplied by the user. Never invent tasks, locations, equipment, certifications, measurements, incidents, completed inspections, permits, regulations, OSHA citations, or site conditions.
- Connect every task to its stated floor, room, elevation, work zone, or other supplied location. If a location or critical condition is missing, say it must be confirmed before work instead of guessing.
- Do not state that a permit, inspection, training, fit test, rescue plan, competent person, or protective system exists unless the input says so. State it as a required verification when relevant.

OUTPUT STANDARD
- Select two distinct highest-priority hazards supported by the work plan. Hazard labels must identify the exposure, task, and location; avoid labels such as "be careful," "PPE," or "general safety."
- Each matching control must contain 4 to 6 concise, actionable sentences, normally 80 to 160 words total. Put controls in the order the crew should apply them: eliminate/substitute, isolate or engineer, plan/coordinate, inspect, use PPE, then stop work/escalate.
- Name who must act when useful: operator, foreman, fire watch, competent person, or crew. Include a pre-task condition check and a clear stop-work trigger.
- Do not claim PPE alone eliminates a hazard. Do not use generic filler or repeat the same control under both hazards.

PAL HIGH-RISK GUIDANCE (apply only when supported by the supplied work)
- Falls, harnesses, aerial lifts, scaffolds, edges, or openings: identify the actual fall exposure; require inspection before use; protect openings/edges; maintain required access and housekeeping; use only approved anchorage/designated lift tie-off points and compatible connectors when tie-off is required; keep lift gates closed and feet on the platform floor; never tie to rails, piping, conduit, or unapproved points; stop work if the anchor, equipment condition, rescue method, or required protection is unclear.
- Ladders: apply PAL's Ladder Last hierarchy when access equipment is discussed: scaffold first, mechanical lift second, podium ladder third, and A-frame ladder only after safer options are not feasible. Require the correct inspected ladder on firm level footing, three points of contact, no standing above the permitted step, no overreaching, and removal from service if damaged.
- Hot work, torching, welding, or grinding: verify authorization/permit requirements, isolate combustibles, control sparks and slag, provide the correct extinguisher, assign and maintain fire watch when required, protect nearby workers, inspect the area after work, and stop if fire protection or ventilation is inadequate.
- Spray-applied fireproofing, SOFP, chemicals, dust, or respiratory exposure: verify the product/SDS and exposure controls, isolate the work zone, use ventilation and dust/overspray control, protect skin and eyes, and use respiratory protection only under the employer's respiratory program with required medical clearance, fit testing, training, and correct filters/cartridges.
- Mechanical lifts or mobile equipment: require authorized operators, pre-use inspection, manufacturer limits, stable travel/work surfaces, overhead and crush-zone checks, barricades/spotters where needed, controlled movement, and removal from service for defects.
- Material handling: plan the route, keep it clear, assess weight/shape, use carts or mechanical assistance, team-lift awkward loads, keep hands out of pinch points, lift with the legs while keeping the load close, and stop if the load cannot be controlled.
- Electrical or temporary power: inspect cords/tools, use required GFCI protection, keep connections dry and protected, avoid damaged equipment and energized exposure, maintain clearance, and remove defective equipment from service.
- Housekeeping: maintain clear walkways and egress, control cords/hoses and trip hazards, stack materials securely, remove debris throughout the shift, keep access to extinguishers/electrical panels clear, and correct changing conditions immediately.

Write professional field-ready text that is specific, thorough, and easy to read aloud. This is an editable draft; never imply that AI approval replaces review by PAL's competent foreman before the meeting, crew signatures, or work begins.`;

async function reserveAiGeneration() {
  const usageId = currentUsageId();
  const usageRef = db.collection('usage').doc(usageId);
  const settingsSnap = await db.collection('integrationSettings').doc('pal').get();
  const configuredLimit = Number(settingsSnap.data()?.aiMonthlyLimit || 500);
  const monthlyLimit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 500;
  await db.runTransaction(async transaction => {
    const usageSnap = await transaction.get(usageRef);
    const used = Number(usageSnap.data()?.aiGenerations || 0);
    if (used >= monthlyLimit) {
      throw new HttpsError('resource-exhausted', 'Monthly AI generation limit reached.');
    }
    transaction.set(usageRef, {
      month: usageId,
      aiGenerations: used + 1,
      aiMonthlyLimit: monthlyLimit,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
  return { usageId, monthlyLimit };
}

async function releaseAiGeneration(usageId) {
  const usageRef = db.collection('usage').doc(usageId);
  await db.runTransaction(async transaction => {
    const snap = await transaction.get(usageRef);
    const used = Number(snap.data()?.aiGenerations || 0);
    transaction.set(usageRef, {
      aiGenerations: Math.max(0, used - 1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
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

function normalizeUsPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const normalized = digits.length === 10 ? `+1${digits}` : (digits.length === 11 && digits.startsWith('1') ? `+${digits}` : '');
  if (!/^\+1[2-9]\d{9}$/.test(normalized)) {
    throw new HttpsError('invalid-argument', 'Enter a valid 10-digit U.S. mobile number.');
  }
  return normalized;
}

function validateIntakeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    const allowedHosts = new Set([
      'jobsiteresources.com', 'www.jobsiteresources.com', 'pal.jobsiteresources.com',
      'pal-safety-hub.web.app', 'pal-safety-hub.firebaseapp.com', 'pennjohn12.github.io'
    ]);
    if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname.toLowerCase()) || !url.searchParams.get('intake')) {
      throw new Error('Invalid intake URL');
    }
    return url.toString().slice(0, 600);
  } catch (_) {
    throw new HttpsError('invalid-argument', 'The intake link is invalid. Save the request again and retry.');
  }
}

async function reserveSmsMessage() {
  const usageId = currentUsageId();
  const usageRef = db.collection('usage').doc(usageId);
  const settingsSnap = await db.collection('integrationSettings').doc('pal').get();
  const configuredLimit = Number(settingsSnap.data()?.smsMonthlyLimit || 1000);
  const monthlyLimit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 1000;
  await db.runTransaction(async transaction => {
    const usageSnap = await transaction.get(usageRef);
    const used = Number(usageSnap.data()?.smsSent || 0);
    if (used >= monthlyLimit) {
      throw new HttpsError('resource-exhausted', 'Monthly text-message limit reached.');
    }
    transaction.set(usageRef, {
      month: usageId,
      smsSent: used + 1,
      smsMonthlyLimit: monthlyLimit,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
  return { usageId, monthlyLimit };
}

async function releaseSmsMessage(usageId) {
  const usageRef = db.collection('usage').doc(usageId);
  await db.runTransaction(async transaction => {
    const snap = await transaction.get(usageRef);
    const used = Number(snap.data()?.smsSent || 0);
    transaction.set(usageRef, {
      smsSent: Math.max(0, used - 1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
}

function isArchivedRecord(item = {}) {
  return item.archived === true
    || item.deleted === true
    || String(item.status || '').toLowerCase() === 'archived';
}

function buildScheduledCertWatch(employees, reportDate) {
  const reportTime = Date.parse(`${reportDate}T00:00:00Z`);
  const warnings = [];
  employees.filter(employee => !isArchivedRecord(employee)).forEach(employee => {
    const certifications = Array.isArray(employee.certifications) ? employee.certifications : [];
    certifications.filter(cert => !isArchivedRecord(cert)).forEach(cert => {
      const expirationDate = cleanText(cert.expirationDate, 20);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) return;
      const days = Math.round((Date.parse(`${expirationDate}T00:00:00Z`) - reportTime) / 86400000);
      if (days > 30) return;
      warnings.push({
        employeeName: cleanText(employee.name, 160) || 'Unnamed Employee',
        certTitle: cleanText(cert.title || cert.type, 160) || 'Certification',
        expirationDate,
        days
      });
    });
  });
  warnings.sort((a, b) => a.days - b.days || a.employeeName.localeCompare(b.employeeName));
  const expired = warnings.filter(item => item.days < 0);
  const soon = warnings.filter(item => item.days >= 0);
  const lines = [
    'PAL Certification Watch - Weekly Update', '',
    `Expired certifications: ${expired.length}`,
    `Expiring within 30 days: ${soon.length}`, ''
  ];
  if (!warnings.length) {
    lines.push('No expired certifications or certifications expiring within 30 days were found.');
  } else {
    lines.push('Please review the workers below and follow up with the supervisor/foreman before these employees continue work that requires the listed certification.', '');
    expired.forEach(item => lines.push(`EXPIRED - ${item.employeeName} - ${item.certTitle} - expired ${item.expirationDate}`));
    if (expired.length && soon.length) lines.push('');
    soon.forEach(item => lines.push(`30 DAY NOTICE - ${item.employeeName} - ${item.certTitle} - expires ${item.expirationDate} (${item.days} day${item.days === 1 ? '' : 's'} left)`));
  }
  lines.push('', 'Generated automatically from PAL Safety Hub. Office should verify records before forwarding.');
  return { text: lines.join('\n'), expiredCount: expired.length, soonCount: soon.length };
}

exports.sendAppEmail = onCall({
  region: 'us-central1',
  invoker: 'public',
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
  const from = process.env.RESEND_FROM_EMAIL || 'PAL Safety Hub <notifications@jobsiteresources.com>';
  const replyTo = process.env.RESEND_REPLY_TO || access.email || undefined;

  let result;
  try {
    result = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html: html || undefined,
      text: text || undefined,
      replyTo
    });
  } catch (error) {
    await recordIntegrationFailure({
      service: 'email', feature, code: error?.code, message: error?.message,
      actorUid: request.auth.uid, actorEmail: access.email
    }).catch(logError => console.error('Email failure logging failed', logError));
    throw new HttpsError('internal', 'The email provider could not be reached. Try again shortly.');
  }

  if (result.error) {
    await recordIntegrationFailure({
      service: 'email', feature, code: result.error.name, message: result.error.message,
      actorUid: request.auth.uid, actorEmail: access.email
    }).catch(logError => console.error('Email failure logging failed', logError));
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

exports.getIntegrationHealth = onCall({
  region: 'us-central1',
  invoker: 'public',
  enforceAppCheck: false,
  timeoutSeconds: 30,
  memory: '256MiB'
}, async request => {
  const access = await assertOfficeAccess(request.auth);
  if (!access.adminAccess) {
    throw new HttpsError('permission-denied', 'Only administrators can view integration health.');
  }
  return { ok: true, ...(await getIntegrationHealthData()) };
});

exports.sendAppText = onCall({
  region: 'us-central1',
  invoker: 'public',
  secrets: [twilioAccountSid, twilioApiKeySid, twilioApiKeySecret],
  enforceAppCheck: false,
  timeoutSeconds: 30,
  memory: '256MiB'
}, async request => {
  const access = await assertOfficeAccess(request.auth);
  const feature = cleanText(request.data?.feature, 80);
  if (feature !== 'new-hire-intake') {
    throw new HttpsError('invalid-argument', 'This text-message type is not supported.');
  }

  const to = normalizeUsPhone(request.data?.to);
  const intakeUrl = validateIntakeUrl(request.data?.intakeUrl);
  const employeeName = cleanText(request.data?.employeeName, 80);
  const projectName = cleanText(request.data?.projectName, 100) || 'your PAL jobsite';
  const greeting = employeeName ? `${employeeName}, please` : 'Please';
  const body = `PAL Safety Hub: ${greeting} complete your pre-site intake for ${projectName}: ${intakeUrl} Reply STOP to opt out.`;
  const usage = await reserveSmsMessage();

  try {
    const form = new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: body });
    const credentials = Buffer.from(`${twilioApiKeySid.value()}:${twilioApiKeySecret.value()}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid.value()}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });
    const result = await response.json();
    if (!response.ok) {
      console.error('Twilio send failed', response.status, result?.code, result?.message);
      const approvalPending = [30034, 30044, 21610].includes(Number(result?.code));
      throw new HttpsError(
        approvalPending ? 'failed-precondition' : 'internal',
        approvalPending
          ? 'Twilio carrier approval is still pending. Use Copy Text Message until approval is complete.'
          : 'The text could not be delivered. Check the phone number and try again.'
      );
    }

    await db.collection('integrationSmsLogs').add({
      provider: 'twilio', providerId: result.sid || '', feature, to,
      intakeId: cleanText(request.data?.intakeId, 160), projectName,
      sentByUid: request.auth.uid, sentByEmail: access.email,
      usageId: usage.usageId, status: result.status || 'queued',
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await db.collection('auditLogs').add({
      action: 'text.sent', createdAt: admin.firestore.FieldValue.serverTimestamp(),
      actorUid: request.auth.uid, actorEmail: access.email, feature,
      recipientCount: 1, provider: 'twilio', providerId: result.sid || '',
      usageId: usage.usageId
    });
    return { ok: true, providerId: result.sid || '', status: result.status || 'queued', usageId: usage.usageId };
  } catch (error) {
    await releaseSmsMessage(usage.usageId).catch(refundError => console.error('SMS usage refund failed', refundError));
    await recordIntegrationFailure({
      service: 'sms', feature, code: error?.code, message: error?.message,
      actorUid: request.auth.uid, actorEmail: access.email
    }).catch(logError => console.error('SMS failure logging failed', logError));
    if (error instanceof HttpsError) throw error;
    console.error('Text send failed', error);
    throw new HttpsError('internal', 'The text could not be sent. Try again shortly.');
  }
});

exports.generateSafetyDraft = onCall({
  region: 'us-central1',
  invoker: 'public',
  secrets: [openaiApiKey],
  enforceAppCheck: false,
  timeoutSeconds: 60,
  memory: '256MiB'
}, async request => {
  const access = await assertAiAccess(request.auth);
  const input = {
    projectName: cleanText(request.data?.projectName, 160),
    jobNumber: cleanText(request.data?.jobNumber, 80),
    date: cleanText(request.data?.date, 20),
    foreman: cleanText(request.data?.foreman, 120),
    workAreas: cleanText(request.data?.areas),
    equipment: cleanText(request.data?.equipment, 700),
    conditions: cleanText(request.data?.conditions, 700),
    safetyFocus: cleanText(request.data?.focus, 700),
    workPlan: cleanText(request.data?.notes, 2400)
  };
  if (!input.projectName || (!input.workAreas && !input.workPlan)) {
    throw new HttpsError('invalid-argument', 'Select a project and enter the work areas or work plan.');
  }

  const usage = await reserveAiGeneration();
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey.value()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        instructions: PAL_SAFETY_DRAFT_INSTRUCTIONS,
        input: `Create the safety meeting draft from this project information:\n${JSON.stringify(input)}`,
        text: {
          format: {
            type: 'json_schema',
            name: 'pal_daily_safety_draft',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                project_name: { type: 'string' }, date: { type: 'string' }, trade: { type: 'string' },
                foreman: { type: 'string' },
                tasks_locations: { type: 'string', description: 'Specific task-to-location plan using only supplied facts.' },
                items_discussed: { type: 'string', description: 'Short meeting agenda covering the planned work, coordination, and required pre-task verification.' },
                hazard1: { type: 'string', description: 'Highest-priority supported exposure tied to its task and location.' },
                control1: { type: 'string', description: 'Four to six ordered, concrete actions controlling hazard 1, including a stop-work trigger.' },
                hazard2: { type: 'string', description: 'Second distinct supported exposure tied to its task and location.' },
                control2: { type: 'string', description: 'Four to six ordered, concrete actions controlling hazard 2, including a stop-work trigger.' },
                inspection_hazards: { type: 'string', description: 'Additional changing-condition checks and escalation instructions; do not invent inspection results.' }
              },
              required: ['project_name', 'date', 'trade', 'foreman', 'tasks_locations',
                'items_discussed', 'hazard1', 'control1', 'hazard2', 'control2', 'inspection_hazards']
            }
          }
        }
      })
    });
    const result = await response.json();
    if (!response.ok) {
      console.error('OpenAI request failed', response.status, result?.error?.code || result?.error?.message);
      throw new Error('OpenAI request failed.');
    }
    const outputText = getResponseOutputText(result);
    if (!outputText) {
      console.error('OpenAI returned no text output', result?.status || 'unknown');
      throw new Error('OpenAI returned no text output.');
    }
    const draft = JSON.parse(outputText);
    if (!isUsableSafetyDraft(draft)) {
      console.error('OpenAI returned an incomplete safety draft');
      throw new Error('OpenAI returned an incomplete safety draft.');
    }
    await db.collection('integrationAiLogs').add({
      feature: 'daily-safety-draft', model: 'gpt-5.4-mini', projectName: input.projectName,
      promptVersion: 'pal-safety-v2',
      actorUid: request.auth.uid, actorEmail: access.email, usageId: usage.usageId,
      inputTokens: Number(result.usage?.input_tokens || 0),
      outputTokens: Number(result.usage?.output_tokens || 0),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true, draft, usageId: usage.usageId };
  } catch (error) {
    await releaseAiGeneration(usage.usageId).catch(refundError => console.error('AI usage refund failed', refundError));
    await recordIntegrationFailure({
      service: 'ai', feature: 'daily-safety-draft', code: error?.code, message: error?.message,
      actorUid: request.auth.uid, actorEmail: access.email
    }).catch(logError => console.error('AI failure logging failed', logError));
    console.error('Safety draft generation failed', error);
    throw new HttpsError('internal', 'The AI draft could not be generated. Try again shortly.');
  }
});

exports.sendWeeklyCertWatch = onSchedule({
  region: 'us-central1',
  schedule: '0 9 * * 1',
  timeZone: 'America/New_York',
  secrets: [resendApiKey],
  retryCount: 0,
  timeoutSeconds: 60,
  memory: '256MiB'
}, async event => {
  const localDate = localDateInTimeZone(event.scheduleTime);
  const settingsSnap = await db.collection('integrationSettings').doc('pal').get();
  const recipients = normalizeRecipients(settingsSnap.data()?.certWatchRecipients || ['rblake@palcorp.com']);
  if (!recipients.length) {
    console.warn('Weekly certification watch skipped because no recipients are configured.');
    return;
  }

  const runId = `cert-watch-weekly-${localDate}`;
  const runRef = db.collection('automationRuns').doc(runId);
  let claimed = false;
  await db.runTransaction(async transaction => {
    const run = await transaction.get(runRef);
    if (run.exists) return;
    transaction.create(runRef, {
      type: 'certification-watch-weekly', status: 'sending',
      scheduledFor: event.scheduleTime || '', recipients,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    claimed = true;
  });
  if (!claimed) return;

  try {
    const employeeSnap = await db.collection('employees').get();
    const report = buildScheduledCertWatch(employeeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })), localDate);
    const { usageId, monthlyLimit } = await checkEmailUsage(recipients.length);
    const resend = new Resend(resendApiKey.value());
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'PAL Safety Hub <notifications@jobsiteresources.com>',
      to: recipients,
      subject: 'PAL Certification Watch - Expired and 30-Day Certs',
      text: report.text
    });
    if (result.error) throw new Error(result.error.message || 'Email provider failed.');
    await recordEmailUsage(usageId, recipients.length, monthlyLimit);
    await db.collection('integrationEmailLogs').add({
      provider: 'resend', providerId: result.data?.id || '', feature: 'certification-watch-weekly',
      to: recipients, subject: 'PAL Certification Watch - Expired and 30-Day Certs',
      sentByUid: 'system', sentByEmail: 'automation@jobsiteresources.com', usageId,
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await runRef.set({
      status: 'sent', providerId: result.data?.id || '', expiredCount: report.expiredCount,
      soonCount: report.soonCount, sentAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    await logEmailEvent({
      actorUid: 'system', actorEmail: 'automation@jobsiteresources.com',
      feature: 'certification-watch-weekly', recipientCount: recipients.length,
      subject: 'PAL Certification Watch - Expired and 30-Day Certs',
      providerId: result.data?.id || '', usageId
    });
  } catch (error) {
    await recordIntegrationFailure({
      service: 'email', feature: 'certification-watch-weekly',
      code: error?.code, message: error?.message,
      actorUid: 'system', actorEmail: 'automation@jobsiteresources.com'
    }).catch(logError => console.error('Weekly certification failure logging failed', logError));
    await runRef.set({
      status: 'failed', error: cleanText(error?.message, 300),
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.error('Weekly certification watch failed', error);
    throw error;
  }
});

exports.monitorIntegrationHealth = onSchedule({
  region: 'us-central1',
  schedule: '0 8 * * *',
  timeZone: 'America/New_York',
  secrets: [resendApiKey],
  retryCount: 0,
  timeoutSeconds: 60,
  memory: '256MiB'
}, async event => {
  const health = await getIntegrationHealthData();
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const failures = health.recentFailures.filter(item => item.createdAt && Date.parse(item.createdAt) >= since);
  const warnings = health.services.filter(item => item.state !== 'healthy');
  if (!failures.length && !warnings.length) return;

  const localDate = localDateInTimeZone(event.scheduleTime);
  const runRef = db.collection('automationRuns').doc(`integration-health-alert-${localDate}`);
  let claimed = false;
  await db.runTransaction(async transaction => {
    const run = await transaction.get(runRef);
    if (run.exists) return;
    transaction.create(runRef, {
      type: 'integration-health-alert', status: 'sending',
      usageId: health.usageId, warningCount: warnings.length, failureCount: failures.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    claimed = true;
  });
  if (!claimed) return;

  const settingsSnap = await db.collection('integrationSettings').doc('pal').get();
  const recipients = normalizeRecipients(settingsSnap.data()?.ownerAlertRecipients || ['jvpanettiere@gmail.com']);
  if (!recipients.length) {
    await runRef.set({ status: 'skipped', reason: 'No owner alert recipients configured.' }, { merge: true });
    return;
  }

  const serviceLabel = { email: 'Email', sms: 'Text messaging', ai: 'AI generation' };
  const lines = ['PAL Safety Hub - Integration Health Alert', ''];
  warnings.forEach(item => lines.push(
    `${serviceLabel[item.key] || item.key}: ${item.used} of ${item.limit} used (${item.percent}%) - ${item.state === 'limit' ? 'LIMIT REACHED' : 'WARNING'}`
  ));
  if (warnings.length && failures.length) lines.push('');
  failures.forEach(item => lines.push(
    `${(serviceLabel[item.service] || item.service).toUpperCase()} FAILURE - ${item.feature} - ${item.message}`
  ));
  lines.push('', 'Open the admin Integrations tab for current usage and failure history. No provider pricing or credentials are included in this alert.');

  try {
    const { usageId, monthlyLimit } = await checkEmailUsage(recipients.length);
    const resend = new Resend(resendApiKey.value());
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'PAL Safety Hub <notifications@jobsiteresources.com>',
      to: recipients,
      subject: 'PAL Safety Hub - Integration Usage or Failure Alert',
      text: lines.join('\n')
    });
    if (result.error) throw new Error(result.error.message || 'Email provider failed.');
    await recordEmailUsage(usageId, recipients.length, monthlyLimit);
    await db.collection('integrationEmailLogs').add({
      provider: 'resend', providerId: result.data?.id || '', feature: 'integration-health-alert',
      to: recipients, subject: 'PAL Safety Hub - Integration Usage or Failure Alert',
      sentByUid: 'system', sentByEmail: 'automation@jobsiteresources.com', usageId,
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await runRef.set({
      status: 'sent', recipients, providerId: result.data?.id || '',
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    await recordIntegrationFailure({
      service: 'email', feature: 'integration-health-alert', code: error?.code,
      message: error?.message, actorUid: 'system', actorEmail: 'automation@jobsiteresources.com'
    }).catch(logError => console.error('Health alert failure logging failed', logError));
    await runRef.set({
      status: 'failed', error: cleanText(error?.message, 300),
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.error('Integration health alert failed', error);
  }
});

function validWorkDate(value) {
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function staffRole(profile = {}, email = '') {
  const role = String(profile.role || '').trim().toLowerCase();
  const accessLevel = String(profile.accessLevel || '').trim().toLowerCase();
  return BOOTSTRAP_ADMIN_EMAILS.has(cleanEmail(email))
    || profile.admin === true
    || profile.isAdmin === true
    || ['admin','administrator','owner','office','project manager','project_manager','foreman','supervisor','field'].includes(role)
    || ['admin','owner','office','foreman','supervisor','field'].includes(accessLevel);
}

function officeRole(profile = {}, email = '') {
  const role = String(profile.role || '').trim().toLowerCase();
  const accessLevel = String(profile.accessLevel || '').trim().toLowerCase();
  return BOOTSTRAP_ADMIN_EMAILS.has(cleanEmail(email))
    || profile.admin === true
    || profile.isAdmin === true
    || ['admin','administrator','owner','office','project manager','project_manager'].includes(role)
    || ['admin','owner','office'].includes(accessLevel);
}

async function assertDailyAccessProject(auth, projectId) {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Sign in before managing daily crew access.');
  const cleanProjectId = cleanText(projectId, 160);
  if (!cleanProjectId) throw new HttpsError('invalid-argument', 'Select a project.');
  const [profile, projectSnap] = await Promise.all([getUserProfile(auth.uid), db.collection('projects').doc(cleanProjectId).get()]);
  if (!projectSnap.exists) throw new HttpsError('not-found', 'The selected project was not found.');
  const email = cleanEmail(auth.token?.email);
  if (!staffRole(profile, email)) throw new HttpsError('permission-denied', 'This account cannot manage daily crew access.');
  const project = projectSnap.data() || {};
  const member = officeRole(profile, email)
    || project.createdBy === auth.uid
    || (Array.isArray(project.memberUids) && project.memberUids.includes(auth.uid))
    || (Array.isArray(project.memberEmails) && project.memberEmails.map(cleanEmail).includes(email))
    || (Array.isArray(project.foremanUids) && project.foremanUids.includes(auth.uid))
    || (Array.isArray(project.foremanEmails) && project.foremanEmails.map(cleanEmail).includes(email));
  if (!member) throw new HttpsError('permission-denied', 'This project is not assigned to your account.');
  return { profile, project:{ id:projectSnap.id, ...project }, email };
}

function formDate(form = {}) {
  return validWorkDate(form.documentData?.date || form.documentData?.reportDate || form.localSubmittedAt?.slice?.(0,10) || '');
}

function newestMatchingForm(forms, keys, workDate) {
  return forms.find(form => keys.includes(form.formKey) && formDate(form) === workDate) || null;
}

function dailyAccessEmployeeSummary(form) {
  const data = form?.documentData || {};
  if (['daily-safety-meeting','ai-daily-safety'].includes(form?.formKey)) {
    return [
      data.items_discussed ? `Items discussed: ${cleanText(data.items_discussed, 800)}` : '',
      data.tasks_locations ? `Tasks and locations: ${cleanText(data.tasks_locations, 800)}` : '',
      data.hazard1 ? `Hazard: ${cleanText(data.hazard1, 500)}` : '',
      data.control1 ? `Control: ${cleanText(data.control1, 500)}` : '',
      data.hazard2 ? `Hazard: ${cleanText(data.hazard2, 500)}` : '',
      data.control2 ? `Control: ${cleanText(data.control2, 500)}` : '',
      data.inspection_hazards ? `Additional hazards: ${cleanText(data.inspection_hazards, 500)}` : ''
    ].filter(Boolean).join('\n');
  }
  if (form?.formKey === 'weekly-toolbox-talk') {
    return [data.topic ? `Topic: ${cleanText(data.topic, 1200)}` : '', data.time ? `Meeting time: ${cleanText(data.time, 80)}` : ''].filter(Boolean).join('\n');
  }
  return 'Confirm your name, arrival time, union/local number, last four SSN digits, and typed signature. Your entry will be added to today’s master PAL Daily Payroll sheet.';
}

function dailyAccessExpiration(workDate) {
  const base = new Date(`${workDate}T12:00:00Z`);
  if (Number.isNaN(base.getTime())) return new Date(Date.now() + 36 * 60 * 60 * 1000);
  base.setUTCDate(base.getUTCDate() + 2);
  return base;
}

exports.createDailyAccessSession = onCall({ region:'us-central1', cors:true, timeoutSeconds:60, memory:'256MiB' }, async request => {
  const workDate = validWorkDate(request.data?.workDate);
  if (!workDate) throw new HttpsError('invalid-argument', 'Choose a valid work date.');
  const selected = request.data?.forms || {};
  if (!selected.safety && !selected.payroll && !selected.toolbox) throw new HttpsError('invalid-argument', 'Select at least one crew document.');
  const access = await assertDailyAccessProject(request.auth, request.data?.projectId);
  const formSnap = await db.collection('projects').doc(access.project.id).collection('fieldForms').orderBy('submittedAt', 'desc').limit(150).get();
  const fieldForms = formSnap.docs.map(row => ({ id:row.id, ...row.data() }));
  const forms = [];

  if (selected.safety) {
    const safety = newestMatchingForm(fieldForms, ['daily-safety-meeting','ai-daily-safety'], workDate);
    if (!safety) throw new HttpsError('failed-precondition', 'Fill out and submit the Daily Safety Meeting for this project and date before generating the crew link.');
    forms.push({ key:'safety', title:safety.formTitle || 'Daily Safety Meeting', shortLabel:'safety meeting', formId:safety.id, formKey:safety.formKey, employeeSummary:dailyAccessEmployeeSummary(safety) || 'Review the foreman’s daily safety meeting before signing.' });
  }

  if (selected.payroll) {
    let payroll = newestMatchingForm(fieldForms, ['daily-payroll'], workDate);
    if (!payroll) {
      const payrollRef = await db.collection('projects').doc(access.project.id).collection('fieldForms').add({
        formKey:'daily-payroll', formTitle:'Daily Payroll', projectId:access.project.id, projectName:access.project.name || '', jobNumber:access.project.jobNumber || '',
        localSubmittedAt:new Date().toISOString(), submittedAt:admin.firestore.FieldValue.serverTimestamp(), submittedBy:request.auth.uid,
        submittedByName:access.profile.name || request.auth.token?.name || access.email,
        documentData:{ date:workDate, jobNumber:access.project.jobNumber || '', foreman:access.profile.name || request.auth.token?.name || access.email, weekOf:'', address:access.project.location || '', printedName:'', dateSigned:'', signature:'', rows:[], totals:{ regularHours:0, overtimeHours:0, totalHours:0 }, dailyAccessMaster:true, notes:'Daily Payroll created for employee QR check-in.' }
      });
      payroll = { id:payrollRef.id, formKey:'daily-payroll', formTitle:'Daily Payroll', documentData:{ date:workDate } };
    }
    forms.push({ key:'payroll', title:'Daily Payroll', shortLabel:'payroll check-in', formId:payroll.id, formKey:'daily-payroll', employeeSummary:dailyAccessEmployeeSummary(payroll) });
  }

  if (selected.toolbox) {
    const toolbox = newestMatchingForm(fieldForms, ['weekly-toolbox-talk'], workDate);
    if (!toolbox) throw new HttpsError('failed-precondition', 'Fill out and submit the Toolbox Talk for this project and date before adding it to the crew link.');
    forms.push({ key:'toolbox', title:toolbox.formTitle || 'Weekly Toolbox Talk', shortLabel:'toolbox talk', formId:toolbox.id, formKey:toolbox.formKey, employeeSummary:dailyAccessEmployeeSummary(toolbox) || 'Review the toolbox talk before signing.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const link = `https://pal-safety-hub.web.app/projects.html?crewAccess=${encodeURIComponent(token)}`;
  const expiresAt = dailyAccessExpiration(workDate);
  const createdAtText = new Date().toISOString();
  await db.collection('dailyAccessSessions').doc(token).set({
    token, projectId:access.project.id, projectName:access.project.name || 'PAL Project', jobNumber:access.project.jobNumber || '', workDate,
    forms, status:'Active', createdBy:request.auth.uid, createdByName:access.profile.name || request.auth.token?.name || access.email,
    createdAt:admin.firestore.FieldValue.serverTimestamp(), createdAtText,
    expiresAt:admin.firestore.Timestamp.fromDate(expiresAt), expiresAtText:expiresAt.toISOString(), submissionCount:0, updatedAt:admin.firestore.FieldValue.serverTimestamp()
  });
  const qrDataUrl = await QRCode.toDataURL(link, { errorCorrectionLevel:'M', width:360, margin:2, color:{ dark:'#1b3a5c', light:'#ffffff' } });
  return { token, link, qrDataUrl, projectName:access.project.name || 'PAL Project', workDate, formTitles:forms.map(form => form.title), expiresAt:expiresAt.toISOString() };
});

function cleanTime(value) {
  const text = String(value || '').trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : '';
}

function confirmedKeys(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(item => cleanText(item, 40)).filter(Boolean))];
}

function hoursBetween(timeIn, timeOut) {
  const [inH,inM] = timeIn.split(':').map(Number);
  const [outH,outM] = timeOut.split(':').map(Number);
  const minutes = outH * 60 + outM - (inH * 60 + inM);
  if (minutes <= 0 || minutes > 18 * 60) throw new HttpsError('invalid-argument', 'Time out must be later than time in.');
  const total = Math.round((minutes / 60) * 100) / 100;
  const regular = Math.min(8, total);
  return { regular, overtime:Math.max(0, Math.round((total - regular) * 100) / 100), total };
}

exports.submitDailyAccess = onCall({ region:'us-central1', cors:true, timeoutSeconds:60, memory:'256MiB' }, async request => {
  const token = cleanText(request.data?.token, 120);
  const employeeName = cleanText(request.data?.employeeName, 120);
  const timeIn = cleanTime(request.data?.timeIn);
  const unionLocal = cleanText(request.data?.unionLocal, 80);
  const last4Ssn = String(request.data?.last4Ssn || '').trim();
  const signature = cleanText(request.data?.signature, 120);
  const confirmedFormKeys = confirmedKeys(request.data?.confirmedFormKeys);
  if (!token || !employeeName || !timeIn || !unionLocal || !/^\d{4}$/.test(last4Ssn) || !signature) throw new HttpsError('invalid-argument', 'Complete every employee check-in field.');
  const sessionRef = db.collection('dailyAccessSessions').doc(token);
  const confirmation = crypto.createHash('sha256').update(`${token}|${employeeName.toLowerCase()}|${last4Ssn}`).digest('hex').slice(0, 16);
  const submissionRef = sessionRef.collection('submissions').doc(confirmation);

  await db.runTransaction(async transaction => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists) throw new HttpsError('not-found', 'This crew access link is not available.');
    const session = sessionSnap.data() || {};
    if (session.status !== 'Active') throw new HttpsError('failed-precondition', 'This crew access link has been closed.');
    if (!session.expiresAt?.toDate || session.expiresAt.toDate().getTime() < Date.now()) throw new HttpsError('deadline-exceeded', 'This crew access link has expired.');
    const requiredKeys = (Array.isArray(session.forms) ? session.forms : []).map(form => form.key);
    if (requiredKeys.some(key => !confirmedFormKeys.includes(key))) throw new HttpsError('failed-precondition', 'Review and confirm every document before submitting.');
    const existing = await transaction.get(submissionRef);
    if (existing.exists) return;

    const formDocs = [];
    for (const form of session.forms || []) {
      const ref = db.collection('projects').doc(session.projectId).collection('fieldForms').doc(form.formId);
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new HttpsError('failed-precondition', `${form.title || 'A project form'} is no longer available.`);
      formDocs.push({ form, ref, data:snap.data() || {} });
    }
    const nowText = new Date().toISOString();
    for (const item of formDocs) {
      const documentData = { ...(item.data.documentData || {}) };
      if (item.form.key === 'safety') {
        const rows = Array.isArray(documentData.signIns) ? documentData.signIns.slice() : [];
        rows.push({ row:rows.length + 1, printName:employeeName, signature, signedAt:nowText, source:'daily-access', dailyAccessSubmissionId:confirmation });
        documentData.signIns = rows;
      }
      if (item.form.key === 'toolbox') {
        const rows = Array.isArray(documentData.rows) ? documentData.rows.slice() : [];
        rows.push({ row:rows.length + 1, printName:employeeName, signature, signedAt:nowText, source:'daily-access', dailyAccessSubmissionId:confirmation });
        documentData.rows = rows;
        documentData.personnelPresent = String(rows.filter(row => row.printName || row.signature).length);
      }
      if (item.form.key === 'payroll') {
        const rows = Array.isArray(documentData.rows) ? documentData.rows.slice() : [];
        rows.push({ row:rows.length + 1, workerName:employeeName, luNumber:unionLocal, ssnLast4:last4Ssn, role:'', timeIn, timeOut:'', regularHours:'', overtimeHours:'', totalHours:'', signature, source:'daily-access', dailyAccessSubmissionId:confirmation });
        documentData.rows = rows;
      }
      transaction.update(item.ref, { documentData, updatedAt:admin.firestore.FieldValue.serverTimestamp(), updatedBy:'daily-access', updatedByName:employeeName });
    }
    transaction.create(submissionRef, {
      confirmation, employeeName, timeIn, timeOut:'', unionLocal, last4Ssn, signature, confirmedFormKeys,
      projectId:session.projectId, projectName:session.projectName || '', workDate:session.workDate || '',
      submittedAt:admin.firestore.FieldValue.serverTimestamp(), submittedAtText:nowText, status:'Checked In', totalHours:'', regularHours:'', overtimeHours:''
    });
    transaction.update(sessionRef, { submissionCount:admin.firestore.FieldValue.increment(1), updatedAt:admin.firestore.FieldValue.serverTimestamp() });
  });
  return { confirmation, status:'saved' };
});

exports.updateDailyAccessSubmission = onCall({ region:'us-central1', cors:true, timeoutSeconds:60, memory:'256MiB' }, async request => {
  const token = cleanText(request.data?.token, 120);
  const submissionId = cleanText(request.data?.submissionId, 120);
  const timeIn = cleanTime(request.data?.timeIn);
  const timeOut = cleanTime(request.data?.timeOut);
  if (!token || !submissionId || !timeIn || !timeOut) throw new HttpsError('invalid-argument', 'Enter valid time in and time out values.');
  const sessionRef = db.collection('dailyAccessSessions').doc(token);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) throw new HttpsError('not-found', 'Daily access session not found.');
  const session = sessionSnap.data() || {};
  await assertDailyAccessProject(request.auth, session.projectId);
  const submissionRef = sessionRef.collection('submissions').doc(submissionId);
  const hours = hoursBetween(timeIn, timeOut);
  const payroll = (session.forms || []).find(form => form.key === 'payroll');
  await db.runTransaction(async transaction => {
    const submissionSnap = await transaction.get(submissionRef);
    if (!submissionSnap.exists) throw new HttpsError('not-found', 'Employee check-in not found.');
    let payrollRef = null;
    let payrollSnap = null;
    if (payroll?.formId) {
      payrollRef = db.collection('projects').doc(session.projectId).collection('fieldForms').doc(payroll.formId);
      payrollSnap = await transaction.get(payrollRef);
    }
    transaction.update(submissionRef, { timeIn, timeOut, regularHours:hours.regular.toFixed(2), overtimeHours:hours.overtime.toFixed(2), totalHours:hours.total.toFixed(2), status:'Checked Out', updatedAt:admin.firestore.FieldValue.serverTimestamp() });
    if (payrollRef && payrollSnap?.exists) {
      const form = payrollSnap.data() || {};
      const documentData = { ...(form.documentData || {}) };
      const rows = Array.isArray(documentData.rows) ? documentData.rows.slice() : [];
      const index = rows.findIndex(row => row.dailyAccessSubmissionId === submissionId);
      if (index >= 0) rows[index] = { ...rows[index], timeIn, timeOut, regularHours:hours.regular.toFixed(2), overtimeHours:hours.overtime.toFixed(2), totalHours:hours.total.toFixed(2) };
      documentData.rows = rows.map((row,index) => ({ ...row, row:index + 1 }));
      documentData.totals = rows.reduce((totals,row) => ({ regularHours:totals.regularHours + Number(row.regularHours || 0), overtimeHours:totals.overtimeHours + Number(row.overtimeHours || 0), totalHours:totals.totalHours + Number(row.totalHours || 0) }), { regularHours:0, overtimeHours:0, totalHours:0 });
      transaction.update(payrollRef, { documentData, updatedAt:admin.firestore.FieldValue.serverTimestamp(), updatedBy:request.auth.uid, updatedByName:request.auth.token?.name || request.auth.token?.email || '' });
    }
  });
  return { status:'updated', ...hours };
});

exports.closeDailyAccessSession = onCall({ region:'us-central1', cors:true, timeoutSeconds:30, memory:'256MiB' }, async request => {
  const token = cleanText(request.data?.token, 120);
  if (!token) throw new HttpsError('invalid-argument', 'Daily access token is required.');
  const ref = db.collection('dailyAccessSessions').doc(token);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Daily access session not found.');
  const session = snap.data() || {};
  await assertDailyAccessProject(request.auth, session.projectId);
  await ref.update({ status:'Closed', closedAt:admin.firestore.FieldValue.serverTimestamp(), closedBy:request.auth.uid, updatedAt:admin.firestore.FieldValue.serverTimestamp() });
  return { status:'Closed' };
});
