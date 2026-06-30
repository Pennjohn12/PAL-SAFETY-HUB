const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { Resend } = require('resend');

admin.initializeApp();

const db = admin.firestore();
const resendApiKey = defineSecret('RESEND_API_KEY');
const openaiApiKey = defineSecret('OPENAI_API_KEY');

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
        instructions: `You draft PAL Environmental Services daily construction safety meetings. Use only the facts supplied by the user. Never invent tasks, locations, equipment, certifications, measurements, incidents, completed inspections, regulations, or OSHA citations. Connect each task to its stated location. Select two distinct, highest-priority hazards supported by the input and give specific, actionable controls using the hierarchy of controls where practical. Include stop-work and supervisor-escalation language when conditions are unsafe or unclear. Write professional field-ready text that is detailed but easy to read aloud. This is an editable draft and must be reviewed by the competent foreman before use.`,
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
                foreman: { type: 'string' }, tasks_locations: { type: 'string' },
                items_discussed: { type: 'string' }, hazard1: { type: 'string' },
                control1: { type: 'string' }, hazard2: { type: 'string' },
                control2: { type: 'string' }, inspection_hazards: { type: 'string' }
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
      actorUid: request.auth.uid, actorEmail: access.email, usageId: usage.usageId,
      inputTokens: Number(result.usage?.input_tokens || 0),
      outputTokens: Number(result.usage?.output_tokens || 0),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true, draft, usageId: usage.usageId };
  } catch (error) {
    await releaseAiGeneration(usage.usageId).catch(refundError => console.error('AI usage refund failed', refundError));
    console.error('Safety draft generation failed', error);
    throw new HttpsError('internal', 'The AI draft could not be generated. Try again shortly.');
  }
});

exports.sendCertWatchDemo = onSchedule({
  region: 'us-central1',
  schedule: '0 9 30 6 *',
  timeZone: 'America/New_York',
  secrets: [resendApiKey],
  retryCount: 0,
  timeoutSeconds: 60,
  memory: '256MiB'
}, async event => {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(event.scheduleTime ? new Date(event.scheduleTime) : new Date());
  const datePart = type => dateParts.find(part => part.type === type)?.value || '';
  const localDate = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
  if (localDate !== '2026-06-30') return;

  const runId = 'cert-watch-demo-2026-06-30-0900-et';
  const runRef = db.collection('automationRuns').doc(runId);
  let claimed = false;
  await db.runTransaction(async transaction => {
    const run = await transaction.get(runRef);
    if (run.exists) return;
    transaction.create(runRef, {
      type: 'certification-watch-demo', status: 'sending', scheduledFor: '2026-06-30T09:00:00-04:00',
      recipient: 'rblake@palcorp.com', createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    claimed = true;
  });
  if (!claimed) return;

  try {
    const employeeSnap = await db.collection('employees').get();
    const report = buildScheduledCertWatch(employeeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })), localDate);
    const { usageId, monthlyLimit } = await checkEmailUsage(1);
    const resend = new Resend(resendApiKey.value());
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'PAL Safety Hub <notifications@jobsiteresources.com>',
      to: ['rblake@palcorp.com'],
      subject: 'PAL Certification Watch - Expired and 30-Day Certs',
      text: report.text
    });
    if (result.error) throw new Error(result.error.message || 'Email provider failed.');
    await recordEmailUsage(usageId, 1, monthlyLimit);
    await db.collection('integrationEmailLogs').add({
      provider: 'resend', providerId: result.data?.id || '', feature: 'certification-watch-demo',
      to: ['rblake@palcorp.com'], subject: 'PAL Certification Watch - Expired and 30-Day Certs',
      sentByUid: 'system', sentByEmail: 'automation@jobsiteresources.com', usageId,
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await runRef.set({
      status: 'sent', providerId: result.data?.id || '', expiredCount: report.expiredCount,
      soonCount: report.soonCount, sentAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    await logEmailEvent({
      actorUid: 'system', actorEmail: 'automation@jobsiteresources.com',
      feature: 'certification-watch-demo', recipientCount: 1,
      subject: 'PAL Certification Watch - Expired and 30-Day Certs',
      providerId: result.data?.id || '', usageId
    });
  } catch (error) {
    await runRef.set({
      status: 'failed', error: cleanText(error?.message, 300),
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.error('Certification watch demo failed', error);
    throw error;
  }
});
