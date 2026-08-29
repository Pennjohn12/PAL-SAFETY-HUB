import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const backend = fs.readFileSync('functions-public-intake/index.js', 'utf8');
const app = fs.readFileSync('projects.html', 'utf8');
const rules = fs.readFileSync('storage.rules', 'utf8');

test('public browsers cannot write normal or quarantine intake paths directly', () => {
  const normal = rules.match(/match \/newHireIntakes\/\{intakeId\}\/\{folder\}\/\{fileName\} \{([\s\S]*?)\n    \}/)?.[1] || '';
  const quarantine = rules.match(/match \/quarantine\/newHireIntakes\/\{intakeId\}\/\{folder\}\/\{fileName\} \{([\s\S]*?)\n    \}/)?.[1] || '';
  assert.match(normal, /allow write: if isOffice\(\)/);
  assert.doesNotMatch(normal, /certUploads|payrollIdUploads/);
  assert.match(quarantine, /allow read, write, delete: if false/);
});

test('one-file grants bind packet folder path type size expiry and a separate secret', () => {
  assert.match(backend, /UPLOAD_GRANT_MINUTES = 15/);
  assert.match(backend, /grantTokenHash: hashToken\(grantToken\)/);
  assert.match(backend, /quarantine\/newHireIntakes\/\$\{spec\.intakeId\}\/\$\{spec\.folder\}\/\$\{authorizationRef\.id\}/);
  assert.match(backend, /contentType: spec\.contentType, size: spec\.size/);
  assert.match(backend, /grant\.intakeId !== intakeId/);
  assert.match(backend, /grantExpires <= Date\.now\(\)/);
  assert.match(backend, /currentGrant\.state !== 'issued' \|\| currentGrant\.usedAt/);
});

test('server enforces abuse limits and verifies the stored object and signature', () => {
  assert.match(backend, /MAX_PACKET_UPLOAD_BYTES = 100 \* 1024 \* 1024/);
  assert.match(backend, /MAX_PACKET_FILES = 12/);
  assert.match(backend, /MAX_GRANTS_PER_HOUR = 12/);
  assert.match(backend, /file\.getMetadata\(\)/);
  assert.match(backend, /fileSignatureMatches\(prefix, storedType\)/);
  assert.match(backend, /file\.delete\(\{ ignoreNotFound: true \}\)/);
});

test('accepted files remain inaccessible quarantine and are never described as malware-cleared', () => {
  assert.match(backend, /securityStatus: 'quarantined', malwareScanStatus: 'pending', downloadable: false/);
  assert.match(app, /secured in quarantine — not available to open/);
  assert.doesNotMatch(backend, /malwareScanStatus: 'clean'/);
});

test('expired grants and abandoned completed objects have bounded cleanup', () => {
  assert.match(backend, /exports\.cleanupExpiredPublicIntakeUploadsV2 = onSchedule/);
  assert.match(backend, /schedule: 'every 60 minutes'/);
  assert.match(backend, /cleanupExpiredUploads\(\{ db, bucket: admin\.storage\(\)\.bucket\(\), Timestamp, FieldValue \}\)/);
});
