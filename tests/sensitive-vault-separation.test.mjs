import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { initialScanEvidence, initialScanMetadata, isMatchingTerminalInitialScan,
  mayApplyInitialScan } = require('../functions-public-intake/initial-scan-policy.js');
const { enforceSensitiveVaultRetention } = require('../functions-public-intake/sensitive-vault-retention.js');

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

test('public upload finalization uses exactly one dedicated vault runtime identity', () => {
  const options = backend.match(/exports\.finalizePublicIntakeUploadV2 = onCall\((\{[\s\S]*?\}), async request =>/);
  assert.ok(options, 'finalizer options must be statically discoverable');
  assert.equal((options[1].match(/serviceAccount: VAULT_SERVICE_ACCOUNT/g) || []).length, 1);
});

test('both public upload folders enter an exact-object automatic first-scan envelope', () => {
  const identity = { path: 'quarantine/newHireIntakes/PAL-SYNTHETIC-123/certUploads/auth-12345678.pdf', generation: '123',
    size: 45, contentType: 'application/pdf', sha256: 'a'.repeat(64) };
  for (const folder of ['certUploads', 'payrollIdUploads']) {
    const metadata = initialScanMetadata({ authorizationId: 'auth-12345678', intakeId: 'PAL-SYNTHETIC-123', folder,
      name: 'training card.pdf', originalIdentity: identity });
    assert.equal(metadata.palInitialScanFolder, folder);
    assert.equal(metadata.palOriginalGeneration, '123');
    assert.match(metadata.palInitialScanObjectPath, /^initial-scans\/auth-12345678\//);
  }
  assert.match(backend, /await queueInitialScan\(authorizationId\)/);
  assert.match(backend, /exports\.retryPendingInitialScansV1 = onSchedule/);
});

test('trusted initial results are bucket path digest and pending-record bound', () => {
  const originalIdentity = { path: 'quarantine/newHireIntakes/PAL-SYNTHETIC-123/certUploads/auth-12345678.pdf', generation: '123',
    size: 45, contentType: 'application/pdf', sha256: 'a'.repeat(64) };
  const metadata = initialScanMetadata({ authorizationId: 'auth-12345678', intakeId: 'PAL-SYNTHETIC-123', folder: 'certUploads',
    name: 'training.pdf', originalIdentity });
  const evidence = initialScanEvidence({ result: 'clean', authorizationId: metadata.palInitialScanAuthorizationId,
    intakeId: metadata.palInitialScanIntakeId, folder: metadata.palInitialScanFolder,
    scanObjectPath: metadata.palInitialScanObjectPath, scanObjectGeneration: '999', sha256: 'a'.repeat(64),
    clamVersion: 'ClamAV synthetic', scannedAt: '2026-08-29T12:00:00.000Z', originalIdentity });
  assert.equal(mayApplyInitialScan({ authorization: { intakeId: evidence.intakeId, folder: evidence.folder,
    path: originalIdentity.path, scanObjectPath: evidence.scanObjectPath, scanObjectGeneration: '999', state: 'scan-queued' },
  record: { malwareScanStatus: 'pending', objectIdentity: originalIdentity }, evidence }), true);
  const recording = { intakeId: evidence.intakeId, folder: evidence.folder, path: originalIdentity.path,
    scanObjectPath: evidence.scanObjectPath, scanObjectGeneration: '999', state: 'scan-result-recording',
    scanResult: 'clean', scanResultObjectGeneration: '999' };
  assert.equal(mayApplyInitialScan({ authorization: recording,
    record: { malwareScanStatus: 'pending', objectIdentity: originalIdentity }, evidence }), true);
  assert.equal(mayApplyInitialScan({ authorization: { ...recording, scanResult: 'manual-review' },
    record: { malwareScanStatus: 'pending', objectIdentity: originalIdentity }, evidence }), false);
  assert.equal(mayApplyInitialScan({ authorization: { ...recording, scanResultObjectGeneration: '1000' },
    record: { malwareScanStatus: 'pending', objectIdentity: originalIdentity }, evidence }), false);
  assert.equal(mayApplyInitialScan({ authorization: { ...recording, scanObjectGeneration: '1000' },
    record: { malwareScanStatus: 'pending', objectIdentity: originalIdentity }, evidence }), false);
  assert.throws(() => initialScanEvidence({ result: 'clean', authorizationId: metadata.palInitialScanAuthorizationId,
    intakeId: metadata.palInitialScanIntakeId, folder: metadata.palInitialScanFolder,
    scanObjectPath: 'wrong/path', scanObjectGeneration: '999', sha256: 'a'.repeat(64), clamVersion: 'test',
    scannedAt: '2026-08-29T12:00:00.000Z', originalIdentity }));
  assert.throws(() => initialScanEvidence({ result: 'clean', authorizationId: metadata.palInitialScanAuthorizationId,
    intakeId: metadata.palInitialScanIntakeId, folder: metadata.palInitialScanFolder,
    scanObjectPath: metadata.palInitialScanObjectPath, scanObjectGeneration: '999', sha256: 'b'.repeat(64), clamVersion: 'test',
    scannedAt: '2026-08-29T12:00:00.000Z', originalIdentity }));
  assert.equal(isMatchingTerminalInitialScan({ authorization: { ...recording, state: 'scan-clean' },
    record: { objectIdentity: originalIdentity, initialScanEvidence: { result: 'clean', scanObjectPath: evidence.scanObjectPath,
      scanObjectGeneration: '999', objectIdentity: originalIdentity } }, evidence }), true);
  assert.equal(isMatchingTerminalInitialScan({ authorization: { ...recording, state: 'scan-clean', scanObjectGeneration: '1000' },
    record: { objectIdentity: originalIdentity, initialScanEvidence: { result: 'clean', scanObjectPath: evidence.scanObjectPath,
      scanObjectGeneration: '999', objectIdentity: originalIdentity } }, evidence }), false);
});

test('initial scan retries serialize result audit and stale queue transitions', () => {
  assert.match(backend, /async function writeInitialScanAuditOnce/);
  assert.match(backend, /scanResultAuditCompleted === true/);
  assert.match(backend, /scanResultAuditCompleted: true/);
  assert.match(backend, /initial-scan-audit-incomplete/);
  assert.match(backend, /async function markInitialScanStale/);
  assert.match(backend, /row\.state !== 'scan-queued'/);
  assert.match(backend, /invalid-scan-destination-generation/);
  assert.match(backend, /scanObjectGeneration,\s+scanQueuedAt/);
  assert.match(backend, /metadata:\s*\{\s*\.\.\.metadata\s*\}/);
  assert.match(backend, /!\/\^\\d\+\$\/\.test\(text\(row\.scanObjectGeneration, 80\)\)/);
  assert.match(backend, /queuedAt !== expected\.queuedAt/);
  assert.match(backend, /scanObjectGeneration, 80\) !== expected\.scanObjectGeneration/);
});

test('private scanner callback locks every non-clean first scan for manual review', () => {
  assert.match(backend, /exports\.recordInitialScanResultV1 = onRequest/);
  assert.match(backend, /invoker: 'private'/);
  assert.match(backend, /!\['clean', 'infected'\]\.includes\(reportedResult\)/);
  assert.match(backend, /scannerResult = reportedResult === 'clean' \? 'clean' : 'manual-review'/);
  assert.match(backend, /conflicting-terminal-scan-result/);
  assert.match(backend, /clamVersion: evidence\.clamVersion, scannerScannedAt: evidence\.scannedAt/);
  assert.match(backend, /securityStatus: evidence\.result === 'clean' \? 'verified-clean' : 'manual-review'/);
  const scannerPatch = fs.readFileSync(new URL('../scanner/clamav-v3.6.0/pal-hardening.patch', import.meta.url), 'utf8');
  assert.match(scannerPatch, /PAL_INITIAL_SCAN_CALLBACK_URL/);
  assert.match(scannerPatch, /palInitialScanAuthorizationId/);
  assert.match(scannerPatch, /scanObjectGeneration/);
  assert.match(scannerPatch, /requiresPalCallback/);
  assert.match(scannerPatch, /loadAuthoritativePalMetadata/);
  assert.match(scannerPatch, /await reportPalRescan/);
  assert.ok(scannerPatch.includes("sed -i 's/\\r$//' bootstrap.sh"));
  assert.match(scannerPatch, /bash -n bootstrap\.sh/);
});

test('clean certifications use a simple purpose-bound server download while identity stays separately entitled', () => {
  assert.match(backend, /exports\.requestIntakeCertificationDownloadV1 = onCall\(VAULT_RUNTIME/);
  assert.match(backend, /const actor = await officeActor\(request\.auth\)/);
  assert.match(backend, /This certification is not verified clean and available/);
  assert.match(firebaseClient, /requestIntakeCertificationDownloadV1Callable/);
  assert.match(projects, /security check in progress — no action needed/);
  assert.match(projects, /Open Protected File/);
  assert.match(backend, /exports\.requestSensitiveIntakeDownloadV1 = onCall\(VAULT_RUNTIME/);
  assert.match(backend, /requireVaultActor\(await officeActor\(request\.auth\)\)/);
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
  assert.match(backend, /PAL_SENSITIVE_VAULT_RETENTION_MODE/);
  assert.match(backend, /default: 'disabled'/);
  assert.match(retention, /retentionDecision\(record, now\)/);
  assert.match(retention, /sameObjectIdentity\(identity, \{ \.\.\.identity, path: record\.path \}\)/);
  assert.match(retention, /ifGenerationMatch: Number\(identity\.generation\)/);
  assert.match(retention, /action: 'retention-delete'/);
  assert.match(retention, /externalDelivery: false/);
  assert.match(backend, /exports\.enforceSensitiveVaultRetentionV1 = onSchedule/);
});

test('absent or disabled Production retention returns before any data dependency is used', async () => {
  const blocked = new Proxy({}, { get() { throw new Error('data dependency touched'); } });
  assert.deepEqual(await enforceSensitiveVaultRetention({ db: blocked, bucket: blocked }),
    { mode: 'disabled', inspected: 0, deleted: 0 });
  assert.deepEqual(await enforceSensitiveVaultRetention({ mode: 'disabled', db: blocked, bucket: blocked }),
    { mode: 'disabled', inspected: 0, deleted: 0 });
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

test('protected download failures stay locked and log only bounded diagnostic stages', () => {
  for (const stage of ['metadata', 'signing', 'audit']) {
    assert.match(backend, new RegExp(`stage: '${stage}'`));
  }
  assert.match(backend, /The protected file could not be verified\. It remains locked\./);
  assert.match(backend, /The protected file could not be authorized\. It remains locked\./);
  assert.match(backend, /The protected-file audit could not be recorded\. The file remains locked\./);
  assert.doesNotMatch(backend, /sensitive-vault-download-failed[^\n]+actorEmail/);
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
