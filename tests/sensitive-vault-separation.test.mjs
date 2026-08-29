import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const backend = fs.readFileSync(new URL('../functions-public-intake/index.js', import.meta.url), 'utf8');
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

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
  for (const collection of ['sensitiveIntakeVaults','sensitiveVaultAuditEvents','sensitiveDownloadApprovals']) {
    const block = rules.match(new RegExp(`match \\/${collection}\\/\\{[^}]+\\} \\{([\\s\\S]*?)\\n    \\}`))?.[1] || '';
    assert.match(block, /allow read, write, delete: if false/);
  }
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
