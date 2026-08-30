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
});
