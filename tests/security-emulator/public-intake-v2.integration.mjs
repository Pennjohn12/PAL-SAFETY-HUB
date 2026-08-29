import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test, { after, before } from 'node:test';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';

const projectId = process.env.GCLOUD_PROJECT || 'pal-safety-hub-staging';
const functionUrl = name => `http://127.0.0.1:5006/${projectId}/us-central1/${name}`;
let env;

function tokenHash(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
async function call(name, data) {
  const response = await fetch(functionUrl(name), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data }) });
  const body = await response.json();
  return { status: response.status, body };
}
async function seed(id, token, overrides = {}) {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'newHireIntakes', id), {
      name: 'SYNTHETIC PACKAGE — NOT REAL', status: 'Pending', environment: 'staging', synthetic: true,
      publicAccess: { version: 2, tokenHash: tokenHash(token), expiresAt: Timestamp.fromMillis(Date.now() + 3600000), revokedAt: null },
      ...overrides
    });
  });
}

before(async () => { env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8086 } }); });
after(async () => { await env?.cleanup(); });

test('anonymous clients cannot directly read or update an intake by document ID', async () => {
  await seed('synthetic-direct-deny', 'direct-token');
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'newHireIntakes', 'synthetic-direct-deny')));
  await assertFails(updateDoc(doc(db, 'newHireIntakes', 'synthetic-direct-deny'), { name: 'blocked' }));
});

test('valid token is packet-bound while guessed and cross-packet tokens are denied', async () => {
  await seed('synthetic-packet-a', 'token-a');
  await seed('synthetic-packet-b', 'token-b');
  assert.equal((await call('getPublicIntakeV2', { intakeId: 'synthetic-packet-a', token: 'token-a' })).status, 200);
  assert.notEqual((await call('getPublicIntakeV2', { intakeId: 'synthetic-packet-a', token: 'guessed' })).status, 200);
  assert.notEqual((await call('getPublicIntakeV2', { intakeId: 'synthetic-packet-b', token: 'token-a' })).status, 200);
});

test('expired and revoked links fail closed', async () => {
  await seed('synthetic-expired', 'expired-token', { publicAccess: { version: 2, tokenHash: tokenHash('expired-token'), expiresAt: Timestamp.fromMillis(Date.now() - 1000), revokedAt: null } });
  await seed('synthetic-revoked', 'revoked-token', { publicAccess: { version: 2, tokenHash: tokenHash('revoked-token'), expiresAt: Timestamp.fromMillis(Date.now() + 3600000), revokedAt: Timestamp.now() } });
  assert.notEqual((await call('getPublicIntakeV2', { intakeId: 'synthetic-expired', token: 'expired-token' })).status, 200);
  assert.notEqual((await call('getPublicIntakeV2', { intakeId: 'synthetic-revoked', token: 'revoked-token' })).status, 200);
});

test('server allows a narrow update and submission permanently blocks replay', async () => {
  const id = 'synthetic-complete'; const token = 'complete-token';
  await seed(id, token, {
    orientationForm: { completed: true }, drugConsentForm: { completed: true }, safetyAgreementForm: { completed: true }, w4Form: { completed: true },
    certUploadsCompleted: true, payrollIdUploadsCompleted: true
  });
  const update = await call('updatePublicIntakeV2', { intakeId: id, token, action: 'basic', payload: { name: 'SYNTHETIC PERSON', role: 'admin', archived: false } });
  assert.equal(update.status, 200);
  assert.equal(update.body.result.intake.name, 'SYNTHETIC PERSON');
  assert.equal(update.body.result.intake.role, undefined);
  const submit = await call('updatePublicIntakeV2', { intakeId: id, token, action: 'submit', payload: {} });
  assert.equal(submit.status, 200);
  assert.equal(submit.body.result.submitted, true);
  assert.notEqual((await call('getPublicIntakeV2', { intakeId: id, token })).status, 200);
  assert.notEqual((await call('updatePublicIntakeV2', { intakeId: id, token, action: 'basic', payload: { name: 'replay' } })).status, 200);
});

test('link issuance is never anonymous', async () => {
  await seed('synthetic-issue', 'old-token');
  assert.notEqual((await call('issuePublicIntakeAccessV2', { intakeId: 'synthetic-issue' })).status, 200);
});
