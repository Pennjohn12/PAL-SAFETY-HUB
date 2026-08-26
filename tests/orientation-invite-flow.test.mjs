import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../projects.html', import.meta.url), 'utf8');
const functions = await readFile(new URL('../functions/index.js', import.meta.url), 'utf8');

test('My Operations exposes a simple multi-number orientation sender', () => {
  assert.match(html, /<h3>Send Orientation Link<\/h3>/);
  assert.match(html, /Array\.from\(\{ length: 5 \}/);
  assert.match(html, /onclick="addOrientationInviteRow\(\)"/);
  assert.match(html, /data-orientation-invite-phone/);
});

test('each recipient receives a unique tracked intake link', () => {
  assert.match(html, /await addDoc\(collection\(db, 'newHireIntakes'\), intakeData\)/);
  assert.match(html, /\?intake=\$\{intakeId\}/);
  assert.match(html, /feature: 'orientation-only'/);
  assert.match(html, /source: 'operations-orientation-invite'/);
});

test('bulk sender validates numbers, blocks duplicates, and safely retries failed texts', () => {
  assert.match(html, /validOrientationInvitePhone/);
  assert.match(html, /Remove duplicate phone numbers before sending/);
  assert.match(html, /dataset\.orientationIntakeId/);
  assert.match(html, /filter\(item => item\.input\?\.value\.trim\(\) && !item\.input\.disabled\)/);
});

test('Twilio supports an orientation-specific message', () => {
  assert.match(functions, /\['new-hire-intake', 'orientation-only'\]\.includes\(feature\)/);
  assert.match(functions, /Please complete your required PAL safety orientation/);
});
