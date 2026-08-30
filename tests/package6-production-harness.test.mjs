import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../tools/package6-production-synthetic.mjs', import.meta.url), 'utf8');

test('Production synthetic harness uses create-only Firestore writes', () => {
  assert.match(source, /currentDocument\.exists=false/);
  assert.match(source, /Create-only synthetic document conflict/);
});

test('Production synthetic harness registers every isolated cleanup path before terminal wait', () => {
  const register = source.indexOf("for (const bucket of ['pal-safety-hub-clamav-unscanned', 'pal-safety-hub-clamav-clean', 'pal-safety-hub-clamav-quarantine'])");
  const wait = source.indexOf('waitAuthorization(certGrant.authorizationId');
  assert.ok(register > 0 && wait > register);
  assert.match(source, /authorization\?\.scanObjectPath !== expectedScanPath/);
  const vaultRegistration = source.indexOf("if (folder === 'payrollIdUploads') manifest.docs.push(`sensitiveIntakeVaults/${intakeId}`)");
  const finalize = source.indexOf("call('finalizePublicIntakeUploadV2'");
  assert.ok(vaultRegistration > 0 && finalize > vaultRegistration);
});

test('Production synthetic harness proves strict exact account deletion', () => {
  assert.match(source, /response\.status !== 200/);
  assert.match(source, /projects\/\$\{PROJECT\}\/accounts:delete/);
  assert.match(source, /projects\/\$\{PROJECT\}\/accounts:lookup/);
  assert.match(source, /localId: \[user\.uid\]/);
  assert.doesNotMatch(source, /\[200, 400\]\.includes\(response\.status\)/);
});

test('Production synthetic harness exactly verifies cleanup absence without list operations', () => {
  assert.match(source, /assertObjectAbsent\(object\.bucket, object\.path\)/);
  assert.match(source, /if \(row !== null\) failures\.push\('Exact synthetic document still exists'\)/);
  assert.match(source, /assertUserAbsent\(user\)/);
  assert.doesNotMatch(source, /accounts:query|listUsers|listDocuments|gcloud storage ls/);
});

test('Production synthetic harness failure messages do not serialize response bodies', () => {
  assert.doesNotMatch(source, /JSON\.stringify\(body\).*throw new Error/);
  assert.doesNotMatch(source, /await response\.text\(\).*throw new Error/);
  assert.doesNotMatch(source, /JSON\.stringify\(finalized\)|JSON\.stringify\(pending\)/);
});

test('Production synthetic harness accepts only exact callable denial statuses', () => {
  assert.match(source, /error instanceof CallableError/);
  assert.match(source, /error\.httpStatus !== expectedHttpStatus/);
  assert.match(source, /error\.firebaseStatus !== expectedFirebaseStatus/);
  assert.match(source, /'non-entitled-vault', 403, 'PERMISSION_DENIED'/);
  assert.match(source, /'requester-self-approval', 400, 'FAILED_PRECONDITION'/);
  assert.match(source, /'manual-review-download', 400, 'FAILED_PRECONDITION'/);
});

test('Production synthetic approval recovery query has all three equality filters', () => {
  assert.match(source, /collectionId: 'sensitiveDownloadApprovals'/);
  assert.match(source, /fieldPath: 'intakeId'.*query\.intakeId/s);
  assert.match(source, /fieldPath: 'requesterUid'.*query\.requesterUid/s);
  assert.match(source, /fieldPath: 'purpose'.*query\.purpose/s);
  assert.match(source, /manifest\.approvalQueries\.push\(\{ intakeId: identity\.intakeId, requesterUid: office\.uid, purpose: identityPurpose \}\)/);
});

test('Production synthetic cleanup repeats exact object removal after bounded quiescence', () => {
  assert.match(source, /setTimeout\(resolve, 45000\)/);
  assert.equal((source.match(/for \(const object of \[\.\.\.manifest\.objects\]\.reverse\(\)\) await deleteObject/g) || []).length, 2);
});
