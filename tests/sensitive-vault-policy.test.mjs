import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const policy = require('../functions-public-intake/sensitive-vault-policy.js');

const identity = Object.freeze({
  path: 'quarantine/newHireIntakes/PAL_SYNTHETIC_DO_NOT_USE/payrollIdUploads/fake.pdf',
  generation: '123456789',
  size: 9,
  contentType: 'application/pdf',
  sha256: 'a'.repeat(64)
});

test('scan states are explicit and unknown states fail closed', () => {
  assert.deepEqual(policy.SCAN_STATES, ['pending','scanning','clean','infected','unsupported','error','timeout','manual-review']);
  assert.throws(() => policy.nextScanState('pending', 'mystery'), /invalid-scan-state/);
});

test('scan transitions are idempotent and terminal results cannot be overwritten', () => {
  assert.equal(policy.nextScanState('pending', 'scanning'), 'scanning');
  assert.equal(policy.nextScanState('scanning', 'clean'), 'clean');
  assert.equal(policy.nextScanState('clean', 'clean'), 'clean');
  assert.throws(() => policy.nextScanState('clean', 'infected'), /terminal-scan-state/);
  assert.throws(() => policy.nextScanState('infected', 'scanning'), /terminal-scan-state/);
});

test('error timeout unsupported and manual review may retry only through scanning', () => {
  for (const state of ['error','timeout','unsupported','manual-review']) {
    assert.equal(policy.nextScanState(state, 'scanning'), 'scanning');
    assert.throws(() => policy.nextScanState(state, 'clean'), /invalid-scan-transition/);
  }
});

test('exact path generation size type and digest bind every scanner result', () => {
  assert.equal(policy.sameObjectIdentity(identity, { ...identity }), true);
  for (const changed of [
    { path: `${identity.path}.other` }, { generation: '987654321' }, { size: 10 },
    { contentType: 'image/png' }, { sha256: 'b'.repeat(64) }
  ]) assert.equal(policy.sameObjectIdentity(identity, { ...identity, ...changed }), false);
});

test('downloads fail closed before clean status or without entitlement purpose and exact object', () => {
  const base = { scanState: 'clean', recordedIdentity: identity, currentIdentity: identity, entitled: true, disabled: false, purpose: 'Payroll identity verification' };
  assert.equal(policy.mayAuthorizeDownload(base), true);
  assert.equal(policy.mayAuthorizeDownload({ ...base, scanState: 'pending' }), false);
  assert.equal(policy.mayAuthorizeDownload({ ...base, entitled: false }), false);
  assert.equal(policy.mayAuthorizeDownload({ ...base, disabled: true }), false);
  assert.equal(policy.mayAuthorizeDownload({ ...base, purpose: '' }), false);
  assert.equal(policy.mayAuthorizeDownload({ ...base, currentIdentity: { ...identity, generation: '2' } }), false);
});

test('scanner identity is exact and audit records mask email and exclude secrets', () => {
  assert.equal(policy.trustedScanner('scanner@pal-safety-hub.iam.gserviceaccount.com', 'scanner@pal-safety-hub.iam.gserviceaccount.com'), true);
  assert.equal(policy.trustedScanner('other@pal-safety-hub.iam.gserviceaccount.com', 'scanner@pal-safety-hub.iam.gserviceaccount.com'), false);
  const event = policy.auditEvent({ action: 'vault-download', actorUid: 'synthetic-office', actorEmail: 'synthetic.office@example.invalid', intakeId: 'PAL_SYNTHETIC_DO_NOT_USE', objectPath: identity.path, purpose: 'Payroll identity verification', decision: 'allowed', correlationId: 'synthetic-correlation', reason: 'verified clean' });
  assert.equal(event.actorEmailMasked, 'sy***@example.invalid');
  assert.equal(JSON.stringify(event).includes('token'), false);
  assert.equal(JSON.stringify(event).includes('signedUrl'), false);
});

test('audit chain is deterministic, linked, and rejects invalid predecessors', () => {
  const input = { action: 'vault-download', actorUid: 'synthetic-office', actorEmail: 'synthetic.office@example.invalid', intakeId: 'PAL_SYNTHETIC_DO_NOT_USE', objectPath: identity.path, purpose: 'Payroll identity verification', decision: 'allowed', correlationId: 'synthetic-correlation', reason: 'verified clean' };
  const first = policy.chainedAuditEvent(input, '', '2026-08-29T17:00:00.000Z');
  const repeated = policy.chainedAuditEvent(input, '', '2026-08-29T17:00:00.000Z');
  const second = policy.chainedAuditEvent({ ...input, correlationId: 'synthetic-second' }, first.eventHash, '2026-08-29T17:01:00.000Z');
  assert.match(first.eventHash, /^[a-f0-9]{64}$/);
  assert.equal(first.eventHash, repeated.eventHash);
  assert.equal(second.previousHash, first.eventHash);
  assert.notEqual(second.eventHash, first.eventHash);
  assert.throws(() => policy.chainedAuditEvent(input, 'not-a-hash', '2026-08-29T17:00:00.000Z'), /invalid-audit-chain/);
});

test('approved retention deletes only new eligible records after their exact window', () => {
  const now = Date.parse('2026-08-30T18:00:00.000Z');
  const identityRecord = { retentionPolicyVersion: 2, type: 'Driver License / Photo ID', malwareScanStatus: 'clean', identityVerifiedAt: '2026-08-29T17:59:59.999Z' };
  assert.equal(policy.retentionDecision(identityRecord, now).action, 'delete-object');
  assert.equal(policy.retentionDecision({ ...identityRecord, identityVerifiedAt: '2026-08-29T18:00:00.001Z' }, now).action, 'retain');
  const reviewRecord = { retentionPolicyVersion: 2, type: 'Social Security Card', malwareScanStatus: 'infected', manualReviewStartedAt: '2026-07-31T18:00:00.000Z' };
  assert.equal(policy.retentionDecision(reviewRecord, now).action, 'delete-object');
  assert.equal(policy.retentionDecision({ ...reviewRecord, manualReviewStartedAt: '2026-07-31T18:00:00.001Z' }, now).action, 'retain');
});

test('legal holds, legacy records, audit evidence, and incomplete records fail safe', () => {
  const eligible = { retentionPolicyVersion: 2, type: 'Social Security Card', malwareScanStatus: 'clean', identityVerifiedAt: '2020-01-01T00:00:00.000Z' };
  assert.equal(policy.retentionDecision({ ...eligible, legalHold: true }).reason, 'legal-or-hr-hold');
  assert.equal(policy.retentionDecision({ ...eligible, hrHold: true }).reason, 'legal-or-hr-hold');
  assert.equal(policy.retentionDecision({ ...eligible, retentionPolicyVersion: 1 }).reason, 'outside-approved-policy');
  assert.equal(policy.retentionDecision({ collection: 'sensitiveVaultAuditEvents' }).action, 'retain');
  assert.equal(policy.retentionDecision({ retentionPolicyVersion: 2, malwareScanStatus: 'clean' }).action, 'retain');
  assert.equal(policy.retentionDecision({ ...eligible, retentionState: 'deleted' }).reason, 'already-deleted');
});

test('in-app notification audience is limited to admins and entitled active reviewers', () => {
  assert.deepEqual(policy.notificationAudience([
    { uid: 'admin-1', role: 'admin' },
    { uid: 'reviewer-1', role: 'office', sensitiveVaultAccess: true },
    { uid: 'office-1', role: 'office' },
    { uid: 'disabled-admin', role: 'admin', disabled: true },
    { uid: 'reviewer-1', role: 'office', sensitiveVaultAccess: true }
  ]), ['admin-1', 'reviewer-1']);
});

test('false-positive approval requires a different Admin and a later trusted exact-object clean rescan', () => {
  const base = { requesterUid: 'reviewer-1', approverUid: 'admin-1', approverRole: 'admin', requestState: 'pending',
    purpose: 'Documented false-positive review justification', originalIdentity: identity, currentIdentity: identity,
    requestedAt: '2026-08-29T18:00:00.000Z', configuredScanner: 'scanner@example.invalid',
    rescanEvidence: { result: 'clean', scannerPrincipal: 'scanner@example.invalid', scannedAt: '2026-08-29T18:01:00.000Z', objectIdentity: identity } };
  assert.equal(policy.mayApproveFalsePositive(base), true);
  assert.equal(policy.mayApproveFalsePositive({ ...base, approverUid: 'reviewer-1' }), false);
  assert.equal(policy.mayApproveFalsePositive({ ...base, approverRole: 'office' }), false);
  assert.equal(policy.mayApproveFalsePositive({ ...base, rescanEvidence: { ...base.rescanEvidence, scannerPrincipal: 'other@example.invalid' } }), false);
  assert.equal(policy.mayApproveFalsePositive({ ...base, rescanEvidence: { ...base.rescanEvidence, scannedAt: '2026-08-29T17:59:00.000Z' } }), false);
  assert.equal(policy.mayApproveFalsePositive({ ...base, currentIdentity: { ...identity, generation: '2' } }), false);
});

test('a clean rescan cannot bypass required false-positive human approval', () => {
  const base = { scanState: 'clean', recordedIdentity: identity, currentIdentity: identity, entitled: true, disabled: false,
    purpose: 'Payroll identity verification', falsePositiveReviewRequired: true };
  assert.equal(policy.mayAuthorizeDownload({ ...base, falsePositiveApproved: false }), false);
  assert.equal(policy.mayAuthorizeDownload({ ...base, falsePositiveApproved: true }), true);
});
