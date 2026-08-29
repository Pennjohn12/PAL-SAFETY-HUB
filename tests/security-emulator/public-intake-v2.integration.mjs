import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import test, { after, before } from 'node:test';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes } from 'firebase/storage';

const require = createRequire(new URL('../../functions-public-intake/package.json', import.meta.url));
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const { getFirestore: getAdminFirestore, Timestamp: AdminTimestamp, FieldValue } = require('firebase-admin/firestore');
const { cleanupExpiredUploads } = require('./upload-cleanup');

const projectId = process.env.GCLOUD_PROJECT || 'pal-safety-hub-staging';
const functionUrl = name => `http://127.0.0.1:5006/${projectId}/us-central1/${name}`;
let env;
let adminApp;

function tokenHash(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
async function call(name, data) {
  const response = await fetch(functionUrl(name), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data }) });
  const body = await response.json();
  return { status: response.status, body };
}
async function saveGrantedObject(grant, bytes, contentType = grant.contentType) {
  const bucket = getStorage(adminApp).bucket();
  await bucket.file(grant.path).save(bytes, {
    resumable: false,
    metadata: { contentType, metadata: { palUploadAuthorization: grant.authorizationId, palSecurityStatus: 'quarantine' } }
  });
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

before(async () => {
  env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8086 }, storage: { host: '127.0.0.1', port: 9198 } });
  adminApp = initializeApp({ projectId, storageBucket: `${projectId}.firebasestorage.app` }, `public-intake-upload-${Date.now()}`);
});
after(async () => { await env?.cleanup(); if (adminApp) await deleteApp(adminApp); });

test('anonymous clients cannot directly read or update an intake by document ID', async () => {
  await seed('synthetic-direct-deny', 'direct-token');
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'newHireIntakes', 'synthetic-direct-deny')));
  await assertFails(updateDoc(doc(db, 'newHireIntakes', 'synthetic-direct-deny'), { name: 'blocked' }));
});

test('sensitive vault audit and approval records deny every browser directly', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'sensitiveIntakeVaults', 'PAL_SYNTHETIC_DO_NOT_USE')));
  await assertFails(setDoc(doc(db, 'sensitiveIntakeVaults', 'PAL_SYNTHETIC_DO_NOT_USE'), { ssn: '000-00-0000' }));
  await assertFails(getDoc(doc(db, 'sensitiveVaultAuditEvents', 'synthetic-event')));
  await assertFails(setDoc(doc(db, 'sensitiveDownloadApprovals', 'synthetic-approval'), { state: 'approved' }));
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

test('new W-4 payload is removed from the ordinary intake and stored in the server vault', async () => {
  const id = 'synthetic-w4-vault'; const token = 'synthetic-w4-token';
  await seed(id, token);
  const saved = await call('updatePublicIntakeV2', { intakeId: id, token, action: 'w4', payload: { completed: true, firstName: 'Synthetic', lastName: 'Worker', address: '100 Test Way', city: 'Testville', state: 'NY', zip: '00000', ssn: '000-00-0000', filingStatus: 'Single', signature: 'SYNTHETIC ONLY', dateSigned: '2026-08-29' } });
  assert.equal(saved.status, 200);
  const intake = (await getAdminFirestore(adminApp).collection('newHireIntakes').doc(id).get()).data();
  const vault = (await getAdminFirestore(adminApp).collection('sensitiveIntakeVaults').doc(id).get()).data();
  assert.equal(intake.w4Completed, true);
  assert.equal(Object.hasOwn(intake, 'w4Form'), false);
  assert.equal(vault.w4Form.ssn, '000-00-0000');
  assert.equal(saved.body.result.intake.w4Form.ssn, '000-00-0000');
});

test('link issuance is never anonymous', async () => {
  await seed('synthetic-issue', 'old-token');
  assert.notEqual((await call('issuePublicIntakeAccessV2', { intakeId: 'synthetic-issue' })).status, 200);
});

test('direct public Storage writes are denied even with a valid packet ID', async () => {
  const storage = env.unauthenticatedContext().storage(`${projectId}.appspot.com`);
  await assertFails(uploadBytes(storageRef(storage, 'newHireIntakes/synthetic-direct-deny/certUploads/guess.pdf'), new Uint8Array([0x25,0x50,0x44,0x46,0x2d]), { contentType: 'application/pdf' }));
  await assertFails(uploadBytes(storageRef(storage, 'quarantine/newHireIntakes/synthetic-direct-deny/certUploads/guess.pdf'), new Uint8Array([0x25,0x50,0x44,0x46,0x2d]), { contentType: 'application/pdf' }));
});

test('single-file grant is packet-bound, quarantined, and cannot be replayed', async () => {
  const id = 'synthetic-upload-valid'; const token = 'upload-valid-token';
  await seed(id, token);
  const created = await call('createPublicIntakeUploadV2', { intakeId: id, token, folder: 'certUploads', name: 'synthetic.pdf', type: 'OSHA 30 / OSHA 10', contentType: 'application/pdf', size: 9 });
  assert.equal(created.status, 200);
  const grant = created.body.result;
  assert.match(grant.uploadUrl, /^emulator:/);
  await saveGrantedObject(grant, Buffer.from('%PDF-1.7\n'));
  assert.notEqual((await call('finalizePublicIntakeUploadV2', { intakeId: 'synthetic-other-packet', token, authorizationId: grant.authorizationId, grantToken: grant.grantToken })).status, 200);
  const finalized = await call('finalizePublicIntakeUploadV2', { intakeId: id, token, authorizationId: grant.authorizationId, grantToken: grant.grantToken });
  assert.equal(finalized.status, 200);
  assert.equal(finalized.body.result.record.securityStatus, 'quarantined');
  assert.equal(finalized.body.result.record.downloadable, false);
  assert.notEqual((await call('finalizePublicIntakeUploadV2', { intakeId: id, token, authorizationId: grant.authorizationId, grantToken: grant.grantToken })).status, 200);
});

test('mismatched file signature is rejected and removed', async () => {
  const id = 'synthetic-upload-signature'; const token = 'upload-signature-token';
  await seed(id, token);
  const created = await call('createPublicIntakeUploadV2', { intakeId: id, token, folder: 'certUploads', name: 'synthetic.pdf', type: 'SST Card', contentType: 'application/pdf', size: 9 });
  assert.equal(created.status, 200);
  const grant = created.body.result;
  await saveGrantedObject(grant, Buffer.from('NOTPDF123'));
  assert.notEqual((await call('finalizePublicIntakeUploadV2', { intakeId: id, token, authorizationId: grant.authorizationId, grantToken: grant.grantToken })).status, 200);
  const [exists] = await getStorage(adminApp).bucket().file(grant.path).exists();
  assert.equal(exists, false);
});

test('expired grants and folder or size mismatches fail closed', async () => {
  const id = 'synthetic-upload-expired'; const token = 'upload-expired-token';
  await seed(id, token);
  assert.notEqual((await call('createPublicIntakeUploadV2', { intakeId: id, token, folder: 'wrong', name: 'synthetic.pdf', type: 'SST Card', contentType: 'application/pdf', size: 9 })).status, 200);
  assert.notEqual((await call('createPublicIntakeUploadV2', { intakeId: id, token, folder: 'certUploads', name: 'synthetic.pdf', type: 'SST Card', contentType: 'application/pdf', size: 30 * 1024 * 1024 })).status, 200);
  const created = await call('createPublicIntakeUploadV2', { intakeId: id, token, folder: 'certUploads', name: 'synthetic.pdf', type: 'SST Card', contentType: 'application/pdf', size: 9 });
  const grant = created.body.result;
  await saveGrantedObject(grant, Buffer.from('%PDF-1.7\n'));
  await env.withSecurityRulesDisabled(async context => updateDoc(doc(context.firestore(), 'publicIntakeUploadAuthorizations', grant.authorizationId), { expiresAt: Timestamp.fromMillis(Date.now() - 1000) }));
  assert.notEqual((await call('finalizePublicIntakeUploadV2', { intakeId: id, token, authorizationId: grant.authorizationId, grantToken: grant.grantToken })).status, 200);
});

test('scheduled cleanup removes abandoned completed objects for expired grants', async () => {
  const id = 'synthetic-upload-cleanup'; const token = 'upload-cleanup-token';
  await seed(id, token);
  const created = await call('createPublicIntakeUploadV2', { intakeId: id, token, folder: 'certUploads', name: 'synthetic.pdf', type: 'SST Card', contentType: 'application/pdf', size: 9 });
  const grant = created.body.result;
  await saveGrantedObject(grant, Buffer.from('%PDF-1.7\n'));
  await env.withSecurityRulesDisabled(async context => updateDoc(doc(context.firestore(), 'publicIntakeUploadAuthorizations', grant.authorizationId), { expiresAt: Timestamp.fromMillis(Date.now() - 1000) }));
  const removed = await cleanupExpiredUploads({ db: getAdminFirestore(adminApp), bucket: getStorage(adminApp).bucket(), Timestamp: AdminTimestamp, FieldValue });
  assert.ok(removed >= 1);
  const [exists] = await getStorage(adminApp).bucket().file(grant.path).exists();
  assert.equal(exists, false);
});
