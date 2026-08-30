import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';

const PROJECT = 'pal-safety-hub';
const API_KEY = 'AIzaSyCxV6nTIqaaSZCtKq74lx72IBgUwKwEa80';
const FIREBASE_BUCKET = 'pal-safety-hub.firebasestorage.app';
const REGION = 'us-central1';
const PREFIX = `PAL-SYNTHETIC-P6-PROD-${crypto.randomBytes(6).toString('hex')}`;
const CONFIRM = '--confirm-production-synthetic';
if (!process.argv.includes(CONFIRM)) throw new Error(`Refusing Production execution without ${CONFIRM}`);

const cleanPdf = Buffer.from(`%PDF-1.4\n% ${PREFIX} CLEAN TEST ONLY - NOT REAL\n%%EOF\n`);
const encryptedPdf = Buffer.from('JVBERi0xLjMKJeLjz9MKMSAwIG9iago8PAovUHJvZHVjZXIgPGZmNGExYmJmYjE+Ci9UaXRsZSA8ZGY3MjI3ZmI4NDBlYjRkMzcxZmJlYTE2NjdkM2Q5N2I0MDE5OTI2ZjVjM2E0Yzg1OTQzMmQ4YjJkNjA2ZDU5ZDZkN2RhYzk2YjEyNGQ5Pgo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0NvdW50IDEKL0tpZHMgWyA0IDAgUiBdCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKNCAwIG9iago8PAovVHlwZSAvUGFnZQovUmVzb3VyY2VzIDw8Cj4+Ci9NZWRpYUJveCBbIDAuMCAwLjAgNzIgNzIgXQovUGFyZW50IDIgMCBSCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9WIDIKL1IgMwovTGVuZ3RoIDEyOAovUCA0Mjk0OTY3MjkyCi9GaWx0ZXIgL1N0YW5kYXJkCi9PIDxlZjdjZjU1MTA5NWRhYTAxNDY0NTk3ZTZkZGNhNWY4NjdjYzllM2ZkYjE3NmQxZjNkNzQzNWY2MzRmMzA0OGNkPgovVSA8MWIzNjkwY2VjY2YxNzdjYzI2MDQzNjhlOGY2ZmE1YzgyOGJmNGU1ZTRlNzU4YTQxNjQwMDRlNTZmZmZhMDEwOD4KPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMTQ3IDAwMDAwIG4gCjAwMDAwMDAyMDYgMDAwMDAgbiAKMDAwMDAwMDI1NSAwMDAwMCBuIAowMDAwMDAwMzQ3IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAzIDAgUgovSW5mbyAxIDAgUgovSUQgWyA8MzEzNDM2MzIzNzM2NjIzMDY2NjIzNDMzMzIzNzM2MzMzNDM1NjYzNDMzNjM2MTMzNjY2NDM2MzMzMTM4NjQzMD4gPDMxMzQzNjMyMzczNjYyMzA2NjYyMzQzMzMyMzczNjMzMzQzNTY2MzQzMzYzNjEzMzY2NjQzNjMzMzEzODY0MzA+IF0KL0VuY3J5cHQgNSAwIFIKPj4Kc3RhcnR4cmVmCjU2MgolJUVPRgo=', 'base64');
const manifest = { runId: PREFIX, users: [], docs: [], objects: [], retainedAuditIntakeIds: [], assertions: [] };

function accessToken() {
  return execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
}
function fsValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(fsValue) } };
  if (value?.__timestamp) return { timestampValue: value.__timestamp };
  if (typeof value === 'object') return { mapValue: { fields: fsFields(value) } };
  throw new Error(`Unsupported Firestore value: ${typeof value}`);
}
function fsFields(object) { return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, fsValue(value)])); }
function fromFs(value = {}) {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFs);
  if ('mapValue' in value) return fromFields(value.mapValue.fields || {});
  return undefined;
}
function fromFields(fields = {}) { return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFs(value)])); }
async function jsonFetch(url, options = {}, expected = [200]) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!expected.includes(response.status)) throw new Error(`${response.status} ${url}: ${JSON.stringify(body).slice(0, 700)}`);
  return body;
}
async function putDoc(path, data) {
  manifest.docs.push(path);
  return jsonFetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: fsFields(data) })
  });
}
async function getDoc(path) {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}`, {
    headers: { Authorization: `Bearer ${accessToken()}` }
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore get ${path}: ${response.status} ${await response.text()}`);
  return fromFields((await response.json()).fields || {});
}
async function deleteDoc(path) {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${accessToken()}` }
  });
  if (![200, 404].includes(response.status)) throw new Error(`Firestore delete ${path}: ${response.status} ${await response.text()}`);
}
async function createUser(kind, role, sensitiveVaultAccess) {
  const email = `${PREFIX.toLowerCase()}-${kind}@example.invalid`;
  const password = `P6!${crypto.randomBytes(18).toString('base64url')}aZ9`;
  const result = await jsonFetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const user = { kind, uid: result.localId, email, idToken: result.idToken };
  manifest.users.push(user);
  await putDoc(`users/${user.uid}`, { name: `${PREFIX} ${kind}`, email, role, disabled: false, active: true, sensitiveVaultAccess, synthetic: true });
  return user;
}
async function deleteUser(user) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: user.idToken })
  });
  if (![200, 400].includes(response.status)) throw new Error(`Auth delete ${user.uid}: ${response.status} ${await response.text()}`);
}
async function call(name, data, idToken = '') {
  const response = await fetch(`https://${REGION}-${PROJECT}.cloudfunctions.net/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
    body: JSON.stringify({ data })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(`${name}: ${response.status} ${JSON.stringify(body).slice(0, 800)}`);
  return body.result;
}
async function expectDenied(label, operation) {
  try { await operation(); } catch (error) { manifest.assertions.push(`${label}:denied`); return; }
  throw new Error(`${label} unexpectedly succeeded`);
}
async function uploadCase({ intakeId, token, folder, label, bytes, fileName }) {
  const grant = await call('createPublicIntakeUploadV2', { intakeId, token, folder, name: fileName, type: label, contentType: 'application/pdf', size: bytes.length });
  manifest.docs.push(`publicIntakeUploadAuthorizations/${grant.authorizationId}`);
  manifest.objects.push({ bucket: FIREBASE_BUCKET, path: grant.path, generation: null });
  const uploaded = await fetch(grant.uploadUrl, { method: 'PUT', headers: {
    'Content-Type': 'application/pdf', 'Content-Length': String(bytes.length), 'Content-Range': `bytes 0-${bytes.length - 1}/${bytes.length}`
  }, body: bytes });
  if (![200, 201].includes(uploaded.status)) throw new Error(`Upload ${intakeId}: ${uploaded.status} ${await uploaded.text()}`);
  const finalized = await call('finalizePublicIntakeUploadV2', { intakeId, token, authorizationId: grant.authorizationId, grantToken: grant.grantToken, notes: `${PREFIX} test` });
  if (!['queued', 'retrying'].includes(finalized.scanQueueStatus)) throw new Error(`Unexpected queue state ${JSON.stringify(finalized)}`);
  return grant;
}
async function waitAuthorization(id, allowed, timeoutMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const row = await getDoc(`publicIntakeUploadAuthorizations/${id}`);
    if (allowed.includes(row?.state)) return row;
    if (row && ['rejected'].includes(row.state)) throw new Error(`Authorization ${id} terminal ${row.state}`);
    await new Promise(resolve => setTimeout(resolve, 4000));
  }
  throw new Error(`Timed out waiting for ${id} -> ${allowed.join(',')}`);
}
async function issueIntake(office, suffix) {
  const intakeId = `${PREFIX}-${suffix}`;
  await putDoc(`newHireIntakes/${intakeId}`, { name: `${PREFIX} ${suffix}`, email: `${suffix}@example.invalid`, status: 'New', archived: false, packetSubmitted: false, certFiles: [], synthetic: true });
  const link = await call('issuePublicIntakeAccessV2', { intakeId, days: 1 }, office.idToken);
  manifest.retainedAuditIntakeIds.push(intakeId);
  return { intakeId, token: link.token };
}
async function exactDownload(url, expected) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Signed download: ${response.status}`);
  const actual = Buffer.from(await response.arrayBuffer());
  if (!actual.equals(expected)) throw new Error(`Signed download bytes mismatch ${actual.length}/${expected.length}`);
}
async function deleteObject(bucket, path, generation = '') {
  const suffix = generation ? `?generation=${encodeURIComponent(generation)}` : '';
  const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(path)}${suffix}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${accessToken()}` }
  });
  if (![204, 404].includes(response.status)) throw new Error(`Storage delete ${bucket}/${path}: ${response.status} ${await response.text()}`);
}
async function cleanup() {
  const failures = [];
  for (const object of [...manifest.objects].reverse()) await deleteObject(object.bucket, object.path, object.generation).catch(error => failures.push(error.message));
  for (const path of [...new Set(manifest.docs)].reverse()) await deleteDoc(path).catch(error => failures.push(error.message));
  for (const user of [...manifest.users].reverse()) await deleteUser(user).catch(error => failures.push(error.message));
  if (failures.length) throw new Error(`Cleanup failures: ${failures.join(' | ')}`);
}

let passed = false;
try {
  if (execFileSync('gcloud', ['config', 'get-value', 'project'], { encoding: 'utf8' }).trim() !== PROJECT) throw new Error('Wrong gcloud project');
  const office = await createUser('office', 'office', true);
  const admin = await createUser('admin', 'admin', true);
  const unentitled = await createUser('unentitled', 'office', false);

  const cert = await issueIntake(office, 'CERT');
  const certGrant = await uploadCase({ ...cert, folder: 'certUploads', label: 'OSHA 30 / OSHA 10', bytes: cleanPdf, fileName: `${PREFIX}-cert.pdf` });
  const certAuth = await waitAuthorization(certGrant.authorizationId, ['scan-clean']);
  manifest.objects.push({ bucket: 'pal-safety-hub-clamav-unscanned', path: certAuth.scanObjectPath, generation: certAuth.scanObjectGeneration });
  manifest.objects.push({ bucket: 'pal-safety-hub-clamav-clean', path: certAuth.scanObjectPath, generation: null });
  const certDownload = await call('requestIntakeCertificationDownloadV1', { intakeId: cert.intakeId, path: certGrant.path, purpose: `${PREFIX} certification verification` }, office.idToken);
  await exactDownload(certDownload.url, cleanPdf);
  manifest.assertions.push('certification-clean-exact-download:passed');

  const identity = await issueIntake(office, 'IDENTITY');
  const identityGrant = await uploadCase({ ...identity, folder: 'payrollIdUploads', label: 'Driver License / Photo ID', bytes: cleanPdf, fileName: `${PREFIX}-identity.pdf` });
  manifest.docs.push(`sensitiveIntakeVaults/${identity.intakeId}`);
  const identityAuth = await waitAuthorization(identityGrant.authorizationId, ['scan-clean']);
  manifest.objects.push({ bucket: 'pal-safety-hub-clamav-unscanned', path: identityAuth.scanObjectPath, generation: identityAuth.scanObjectGeneration });
  manifest.objects.push({ bucket: 'pal-safety-hub-clamav-clean', path: identityAuth.scanObjectPath, generation: null });
  await expectDenied('non-entitled-vault', () => call('getSensitiveIntakeVaultV1', { intakeId: identity.intakeId, purpose: `${PREFIX} negative test` }, unentitled.idToken));
  const pending = await call('requestSensitiveIntakeDownloadV1', { intakeId: identity.intakeId, path: identityGrant.path, purpose: `${PREFIX} identity verification` }, office.idToken);
  if (pending.status !== 'approval-required') throw new Error(`Expected approval-required: ${JSON.stringify(pending)}`);
  manifest.docs.push(`sensitiveDownloadApprovals/${pending.approvalId}`);
  await expectDenied('requester-self-approval', () => call('approveSensitiveIntakeDownloadV1', { approvalId: pending.approvalId }, office.idToken));
  await call('approveSensitiveIntakeDownloadV1', { approvalId: pending.approvalId }, admin.idToken);
  const identityDownload = await call('requestSensitiveIntakeDownloadV1', { intakeId: identity.intakeId, path: identityGrant.path, purpose: `${PREFIX} identity verification` }, office.idToken);
  await exactDownload(identityDownload.url, cleanPdf);
  manifest.assertions.push('identity-two-person-exact-download:passed');

  const review = await issueIntake(office, 'MANUAL');
  const reviewGrant = await uploadCase({ ...review, folder: 'payrollIdUploads', label: 'Additional Payroll / ID Document', bytes: encryptedPdf, fileName: `${PREFIX}-encrypted.pdf` });
  manifest.docs.push(`sensitiveIntakeVaults/${review.intakeId}`);
  const reviewAuth = await waitAuthorization(reviewGrant.authorizationId, ['scan-manual-review']);
  manifest.objects.push({ bucket: 'pal-safety-hub-clamav-unscanned', path: reviewAuth.scanObjectPath, generation: reviewAuth.scanObjectGeneration });
  manifest.objects.push({ bucket: 'pal-safety-hub-clamav-quarantine', path: reviewAuth.scanObjectPath, generation: null });
  await expectDenied('manual-review-download', () => call('requestSensitiveIntakeDownloadV1', { intakeId: review.intakeId, path: reviewGrant.path, purpose: `${PREFIX} manual-review denial` }, office.idToken));
  manifest.assertions.push('encrypted-manual-review-locked:passed');
  passed = true;
  console.log(JSON.stringify({ status: 'PASS', runId: PREFIX, assertions: manifest.assertions, created: { users: manifest.users.length, docs: new Set(manifest.docs).size, objects: manifest.objects.length }, retainedAuditIntakeIds: manifest.retainedAuditIntakeIds }, null, 2));
} finally {
  await cleanup();
  console.log(JSON.stringify({ cleanup: 'COMPLETE', runId: PREFIX, users: manifest.users.length, docs: new Set(manifest.docs).size, objects: manifest.objects.length, passed }));
}
