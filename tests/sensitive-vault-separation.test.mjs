import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const backend = fs.readFileSync(new URL('../functions-public-intake/index.js', import.meta.url), 'utf8');
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const retention = fs.readFileSync(new URL('../functions-public-intake/sensitive-vault-retention.js', import.meta.url), 'utf8');
const firebaseClient = fs.readFileSync(new URL('../assets/js/config/pal-firebase.js', import.meta.url), 'utf8');
const projects = fs.readFileSync(new URL('../projects.html', import.meta.url), 'utf8');

test('new W-4 writes separate full data from ordinary intake completion state', () => {
  assert.match(backend, /transaction\.set\(sensitiveRef, \{ w4Form: updatedW4Form/);
  assert.match(backend, /update = \{ w4Completed: true, w4Form: FieldValue\.delete\(\) \}/);
  assert.match(backend, /Existing records remain readable until separately approved migration/);
});

test('new payroll file metadata enters the sensitive vault while certifications remain ordinary', () => {
  assert.match(backend, /grant\.folder === 'certUploads' \? row : \(sensitiveSnap\?\.data\(\) \|\| \{\}\)/);
  assert.match(backend, /transaction\.set\(sensitiveRef, \{ payrollIdFiles: files/);
  assert.match(backend, /if \(grant\.folder === 'certUploads'\) update\[field\] = files/);
});

test('all sensitive vault audit and approval collections deny browser access', () => {
  for (const collection of ['sensitiveIntakeVaults','sensitiveVaultAuditEvents','sensitiveVaultAuditState','sensitiveDownloadApprovals','sensitiveVaultNotifications','sensitiveFalsePositiveReviews']) {
    const block = rules.match(new RegExp(`match \\/${collection}\\/\\{[^}]+\\} \\{([\\s\\S]*?)\\n    \\}`))?.[1] || '';
    assert.match(block, /allow read, write, delete: if false/);
  }
});

test('false-positive release requires request, trusted exact rescan, different Admin, and audit', () => {
  assert.match(backend, /exports\.requestSensitiveFalsePositiveReviewV1 = onCall\(VAULT_RUNTIME/);
  assert.match(backend, /exports\.recordSensitiveFalsePositiveRescanV1 = onRequest\(/);
  assert.match(backend, /invoker: 'private'/);
  assert.match(backend, /ifSourceGenerationMatch: Number\(currentIdentity\.generation\)/);
  assert.match(backend, /palFalsePositiveReviewId: ref\.id/);
  assert.match(backend, /sameObjectIdentity\(evidenceIdentity, review\.originalIdentity\)/);
  assert.match(backend, /exports\.approveSensitiveFalsePositiveReviewV1 = onCall\(VAULT_RUNTIME/);
  assert.match(backend, /mayApproveFalsePositive/);
  assert.match(backend, /actor\.role !== 'admin'/);
  assert.match(backend, /action: 'false-positive-review'/);
  assert.match(backend, /falsePositiveApproved: true/);
});

test('false-positive review exists before rescan object creation can trigger its callback', () => {
  const requestStart = backend.indexOf('exports.requestSensitiveFalsePositiveReviewV1');
  const callbackStart = backend.indexOf('exports.recordSensitiveFalsePositiveRescanV1');
  const requestBlock = backend.slice(requestStart, callbackStart);
  assert.ok(requestBlock.indexOf('await ref.create(') < requestBlock.indexOf('await source.copy('));
  assert.match(requestBlock, /state: 'copy-failed'/);
  assert.match(requestBlock, /The file remains locked/);
});

test('false-positive rescan labels use the Cloud Storage copy option shape', () => {
  const requestStart = backend.indexOf('exports.requestSensitiveFalsePositiveReviewV1');
  const callbackStart = backend.indexOf('exports.recordSensitiveFalsePositiveRescanV1');
  const requestBlock = backend.slice(requestStart, callbackStart);
  assert.match(requestBlock, /contentType: currentIdentity\.contentType,\s+cacheControl: 'private, no-store, max-age=0',\s+metadata: \{\s+palFalsePositiveReviewId/);
  assert.doesNotMatch(requestBlock, /metadata: \{\s+contentType: currentIdentity\.contentType/);
});

test('Office protected-vault UI uses purpose-bound callables and never direct sensitive file links', () => {
  assert.match(firebaseClient, /getSensitiveIntakeVaultV1Callable/);
  assert.match(firebaseClient, /requestSensitiveIntakeDownloadV1Callable/);
  assert.match(firebaseClient, /listSensitiveVaultApprovalsV1Callable/);
  assert.match(projects, /Required business purpose/);
  assert.match(projects, /requestSensitiveVaultDownload/);
  assert.match(projects, /Approve as Independent Admin/);
  assert.match(projects, /Sensitive payroll and identity files are intentionally excluded from printable\/exported packets/);
  const payrollBlock = projects.slice(projects.indexOf('<strong>Protected Payroll / Identity Vault</strong>'), projects.indexOf('function sensitiveVaultPurpose'));
  assert.doesNotMatch(payrollBlock, /newHireFileLinkHTML/);
  assert.doesNotMatch(payrollBlock, /getDownloadURL/);
});

test('pending sensitive approval queue is Admin-only, bounded, and audited', () => {
  const start = backend.indexOf('exports.listSensitiveVaultApprovalsV1');
  const end = backend.indexOf('exports.requestSensitiveFalsePositiveReviewV1');
  const block = backend.slice(start, end);
  assert.match(block, /actor\.role !== 'admin'/);
  assert.match(block, /where\('state', '==', 'pending'\)\.limit\(25\)/);
  assert.match(block, /action: 'approval-queue'/);
  assert.doesNotMatch(block, /requesterEmail/);
});

test('retention enforcement is generation-bound, hold-aware, audited, and server-only', () => {
  assert.match(retention, /retentionDecision\(record, now\)/);
  assert.match(retention, /sameObjectIdentity\(identity, \{ \.\.\.identity, path: record\.path \}\)/);
  assert.match(retention, /ifGenerationMatch: Number\(identity\.generation\)/);
  assert.match(retention, /action: 'retention-delete'/);
  assert.match(retention, /externalDelivery: false/);
  assert.match(backend, /exports\.enforceSensitiveVaultRetentionV1 = onSchedule/);
});

test('vault audit events are append-only and cryptographically chained', () => {
  assert.match(backend, /transaction\.create\(eventRef/);
  assert.match(backend, /collection\('sensitiveVaultAuditState'\)\.doc\('head'\)/);
  assert.match(backend, /previousHash/);
  assert.match(backend, /eventHash/);
});

test('vault reads require separate entitlement and business purpose with a server audit', () => {
  assert.match(backend, /actor\.role !== 'admin' && actor\.sensitiveVaultAccess !== true/);
  assert.match(backend, /exports\.getSensitiveIntakeVaultV1/);
  assert.match(backend, /validatePurpose\(request\.data\?\.purpose\)/);
  assert.match(backend, /action: 'vault-read'/);
});

test('identity downloads require a second actor and are clean-only short-lived and single-use', () => {
  assert.match(backend, /\['Social Security Card', 'Driver License \/ Photo ID'\]/);
  assert.match(backend, /row\.requesterUid === actor\.uid/);
  assert.match(backend, /mayAuthorizeDownload/);
  assert.match(backend, /expires: Date\.now\(\) \+ 5 \* 60000/);
  assert.match(backend, /state: 'consumed'/);
});

test('Staging vault functions use the dedicated keyless runtime identity', () => {
  const env = fs.readFileSync(new URL('../functions-public-intake/.env.pal-safety-hub-staging', import.meta.url), 'utf8');
  assert.match(env, /^PAL_VAULT_SERVICE_ACCOUNT=pal-staging-vault-download@pal-safety-hub-staging\.iam\.gserviceaccount\.com$/m);
  assert.match(env, /^PAL_TRUSTED_SCANNER_IDENTITY=pal-staging-malware-scanner@pal-safety-hub-staging\.iam\.gserviceaccount\.com$/m);
  assert.match(env, /^PAL_RESCAN_BUCKET=pal-safety-hub-staging-clamav-unscanned$/m);
  assert.match(backend, /defineString\('PAL_VAULT_SERVICE_ACCOUNT'/);
  assert.match(backend, /const VAULT_RUNTIME = Object\.freeze/);
  assert.match(backend, /serviceAccount: VAULT_SERVICE_ACCOUNT/);
  for (const name of ['getSensitiveIntakeVaultV1', 'requestSensitiveIntakeDownloadV1', 'approveSensitiveIntakeDownloadV1']) {
    assert.match(backend, new RegExp(`exports\\.${name} = onCall\\(VAULT_RUNTIME`));
  }
});
