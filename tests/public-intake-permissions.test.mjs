import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const projects = readFileSync(new URL('../projects.html', import.meta.url), 'utf8');

const helper = rules.match(/function publicIntakeStatusUpdateAllowed\(\) \{([\s\S]*?)\n    \}/)?.[1] || '';

assert.ok(helper, 'public intake status helper must exist');
assert.match(helper, /resource\.data\.status != 'Archived'/, 'archived packets must remain closed');
assert.match(helper, /'Missing Info'/, 'returned packets must be repairable');
assert.doesNotMatch(
  helper.match(/request\.resource\.data\.status in \[([\s\S]*?)\]/)?.[1] || '',
  /'Good To Work'/,
  'public users must never approve themselves'
);
assert.match(projects, /newHireUploadErrorMessage\(error, label, stage = 'upload'\)/, 'upload errors must identify their stage');
assert.match(projects, /reached PAL secure storage, but the intake packet could not be updated/, 'packet-save failures must not masquerade as upload failures');

console.log('Public intake permission regression checks passed.');
