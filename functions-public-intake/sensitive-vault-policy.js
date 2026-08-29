'use strict';

const crypto = require('crypto');

const SCAN_STATES = Object.freeze([
  'pending',
  'scanning',
  'clean',
  'infected',
  'unsupported',
  'error',
  'timeout',
  'manual-review'
]);

const RETRYABLE_STATES = new Set(['pending', 'unsupported', 'error', 'timeout', 'manual-review']);
const FINAL_STATES = new Set(['clean', 'infected']);
const IDENTITY_IMAGE_RETENTION_MS = 24 * 60 * 60 * 1000;
const REVIEW_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const POLICY_VERSION = 2;

function boundedText(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function normalizeObjectIdentity(value = {}) {
  const path = boundedText(value.path, 1024);
  const generation = boundedText(value.generation, 80);
  const contentType = boundedText(value.contentType, 160).toLowerCase();
  const size = Number(value.size);
  const sha256 = boundedText(value.sha256, 64).toLowerCase();
  if (!path.startsWith('quarantine/newHireIntakes/')
      || !/^\d+$/.test(generation)
      || !Number.isSafeInteger(size) || size <= 0
      || !/^[a-f0-9]{64}$/.test(sha256)
      || !/^(application\/pdf|image\/(jpeg|png|webp|heic|heif))$/.test(contentType)) {
    throw new Error('invalid-object-identity');
  }
  return Object.freeze({ path, generation, contentType, size, sha256 });
}

function sameObjectIdentity(left, right) {
  let a;
  let b;
  try {
    a = normalizeObjectIdentity(left);
    b = normalizeObjectIdentity(right);
  } catch (_) {
    return false;
  }
  const hashEqual = crypto.timingSafeEqual(Buffer.from(a.sha256, 'hex'), Buffer.from(b.sha256, 'hex'));
  return hashEqual && a.path === b.path && a.generation === b.generation
    && a.contentType === b.contentType && a.size === b.size;
}

function nextScanState(current, requested) {
  const from = boundedText(current, 40).toLowerCase();
  const to = boundedText(requested, 40).toLowerCase();
  if (!SCAN_STATES.includes(from) || !SCAN_STATES.includes(to)) throw new Error('invalid-scan-state');
  if (from === to) return from;
  if (RETRYABLE_STATES.has(from) && to === 'scanning') return to;
  if (from === 'scanning' && ['clean', 'infected', 'unsupported', 'error', 'timeout', 'manual-review'].includes(to)) return to;
  throw new Error(FINAL_STATES.has(from) ? 'terminal-scan-state' : 'invalid-scan-transition');
}

function trustedScanner(principal, configuredPrincipal) {
  const actual = boundedText(principal, 320).toLowerCase();
  const expected = boundedText(configuredPrincipal, 320).toLowerCase();
  return Boolean(actual && expected && actual === expected && expected.includes('@'));
}

function validatePurpose(value) {
  const purpose = boundedText(value, 240).replace(/[\r\n\t]+/g, ' ');
  if (purpose.length < 8) throw new Error('access-purpose-required');
  return purpose;
}

function mayAuthorizeDownload({ scanState, recordedIdentity, currentIdentity, entitled, disabled, purpose }) {
  if (scanState !== 'clean' || entitled !== true || disabled === true) return false;
  if (!sameObjectIdentity(recordedIdentity, currentIdentity)) return false;
  try { validatePurpose(purpose); } catch (_) { return false; }
  return true;
}

function retentionDecision(record = {}, nowValue = Date.now()) {
  const now = Number(nowValue);
  if (!Number.isFinite(now)) throw new Error('invalid-retention-time');
  if (record.legalHold === true || record.hrHold === true) return Object.freeze({ action: 'retain', reason: 'legal-or-hr-hold' });
  if (Number(record.retentionPolicyVersion) !== POLICY_VERSION) return Object.freeze({ action: 'retain', reason: 'outside-approved-policy' });

  const state = boundedText(record.malwareScanStatus, 40).toLowerCase();
  const verifiedAt = Date.parse(record.identityVerifiedAt || '');
  const reviewStartedAt = Date.parse(record.manualReviewStartedAt || record.scanCompletedAt || '');
  const identityImage = ['Social Security Card', 'Driver License / Photo ID'].includes(boundedText(record.type, 120));

  if (identityImage && state === 'clean' && Number.isFinite(verifiedAt)) {
    const deleteAfter = verifiedAt + IDENTITY_IMAGE_RETENTION_MS;
    return Object.freeze({ action: now >= deleteAfter ? 'delete-object' : 'retain', reason: 'verified-identity-image', deleteAfter });
  }
  if (['infected', 'error', 'timeout', 'unsupported', 'manual-review'].includes(state) && Number.isFinite(reviewStartedAt)) {
    const deleteAfter = reviewStartedAt + REVIEW_RETENTION_MS;
    return Object.freeze({ action: now >= deleteAfter ? 'delete-object' : 'retain', reason: 'manual-review-window', deleteAfter });
  }
  return Object.freeze({ action: 'retain', reason: 'not-eligible' });
}

function notificationAudience(profiles = []) {
  return [...new Set(profiles.filter(profile => profile && profile.disabled !== true)
    .filter(profile => boundedText(profile.role || profile.accessLevel, 40).toLowerCase() === 'admin' || profile.sensitiveVaultAccess === true)
    .map(profile => boundedText(profile.uid, 180)).filter(Boolean))].sort();
}

function auditEvent({ action, actorUid, actorEmail, intakeId, objectPath, purpose, decision, correlationId, reason }) {
  const allowedActions = new Set(['vault-read', 'vault-download', 'scan-result', 'manual-review']);
  const allowedDecisions = new Set(['allowed', 'denied', 'clean', 'infected', 'error', 'timeout', 'unsupported', 'manual-review']);
  const normalizedAction = boundedText(action, 40);
  const normalizedDecision = boundedText(decision, 40);
  if (!allowedActions.has(normalizedAction) || !allowedDecisions.has(normalizedDecision)) throw new Error('invalid-audit-event');
  const email = boundedText(actorEmail, 180).toLowerCase();
  const maskedEmail = email.includes('@') ? `${email.slice(0, 2)}***@${email.split('@').pop()}` : '';
  return Object.freeze({
    version: 1,
    action: normalizedAction,
    actorUid: boundedText(actorUid, 180),
    actorEmailMasked: maskedEmail,
    intakeId: boundedText(intakeId, 180),
    objectPath: boundedText(objectPath, 1024),
    purpose: purpose ? validatePurpose(purpose) : '',
    decision: normalizedDecision,
    correlationId: boundedText(correlationId, 180),
    reason: boundedText(reason, 240)
  });
}

function chainedAuditEvent(event, previousHash, occurredAt) {
  const prior = boundedText(previousHash, 64).toLowerCase();
  if (prior && !/^[a-f0-9]{64}$/.test(prior)) throw new Error('invalid-audit-chain');
  const timestamp = boundedText(occurredAt, 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp)) throw new Error('invalid-audit-time');
  const normalized = auditEvent(event);
  const canonical = JSON.stringify({
    version: normalized.version,
    action: normalized.action,
    actorUid: normalized.actorUid,
    actorEmailMasked: normalized.actorEmailMasked,
    intakeId: normalized.intakeId,
    objectPath: normalized.objectPath,
    purpose: normalized.purpose,
    decision: normalized.decision,
    correlationId: normalized.correlationId,
    reason: normalized.reason,
    occurredAt: timestamp,
    previousHash: prior
  });
  return Object.freeze({
    ...normalized,
    occurredAt: timestamp,
    previousHash: prior,
    eventHash: crypto.createHash('sha256').update(canonical, 'utf8').digest('hex')
  });
}

module.exports = {
  SCAN_STATES,
  auditEvent,
  chainedAuditEvent,
  mayAuthorizeDownload,
  notificationAudience,
  nextScanState,
  normalizeObjectIdentity,
  POLICY_VERSION,
  retentionDecision,
  sameObjectIdentity,
  trustedScanner,
  validatePurpose
};
