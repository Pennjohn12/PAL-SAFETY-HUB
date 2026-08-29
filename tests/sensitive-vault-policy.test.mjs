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
