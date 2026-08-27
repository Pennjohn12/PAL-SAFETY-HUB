import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../projects.html', import.meta.url), 'utf8');
const functions = await readFile(new URL('../functions/index.js', import.meta.url), 'utf8');
const firebaseConfig = await readFile(new URL('../assets/js/config/pal-firebase.js', import.meta.url), 'utf8');

test('My Operations exposes a simple multi-number orientation sender', () => {
  assert.match(html, /<h3>Send Orientation Link<\/h3>/);
  assert.match(html, /Array\.from\(\{ length: 5 \}/);
  assert.match(html, /onclick="addOrientationInviteRow\(\)"/);
  assert.match(html, /data-orientation-invite-phone/);
});

test('each recipient receives a unique tracked intake link', () => {
  assert.match(html, /await addDoc\(collection\(db, 'newHireIntakes'\), intakeData\)/);
  assert.match(html, /buildPublicIntakeLink\(intakeId\)/);
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
  assert.match(functions, /PAL Environmental Services: Your required safety orientation is ready/);
});

test('orientation texts use the branded PAL domain instead of the generic hosting domain', () => {
  assert.match(firebaseConfig, /https:\/\/pal\.jobsiteresources\.com\/projects\.html/);
  assert.match(html, /buildPublicIntakeLink\(intakeId\)/);
  assert.match(html, /buildPublicIntakeLink\(docRef\.id\)/);
  assert.doesNotMatch(html, /intakeLink = `\$\{window\.location\.origin\}/);
});

test('orientation texts distinguish queue acceptance from carrier delivery', () => {
  assert.match(functions, /StatusCallback/);
  assert.match(functions, /exports\.updateTextDeliveryStatus = onRequest/);
  assert.match(functions, /callbackTokenHash/);
  assert.match(html, /watchOrientationTextDelivery/);
  assert.match(html, /Queued with Twilio—waiting for delivery confirmation/);
  assert.match(html, /Delivered to phone/);
  assert.doesNotMatch(html, /item\.status\.textContent = 'Sent successfully\.'/);
});

test('administrators can see masked carrier delivery results and Twilio error codes', () => {
  assert.match(functions, /recentSms/);
  assert.match(functions, /destinationLast4/);
  assert.match(functions, /errorCode/);
  assert.match(html, /Recent Text Delivery/);
  assert.match(html, /Twilio code/);
});

test('PAL dashboard reflects verified Twilio A2P registration', () => {
  assert.match(html, /A2P Brand approved and messaging campaign verified/);
  assert.match(html, /PAL number \(516\) 400-4507 is assigned to the verified A2P messaging service/);
  assert.doesNotMatch(html, /Twilio[^<]*(carrier approval is pending|waiting on carrier approval)/i);
});
