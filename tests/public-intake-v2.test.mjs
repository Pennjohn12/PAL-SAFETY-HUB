import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const functions = fs.readFileSync('functions-public-intake/index.js', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const app = fs.readFileSync('projects.html', 'utf8');

test('public intake document IDs no longer grant direct Firestore access', () => {
  const block = rules.match(/match \/newHireIntakes\/\{intakeId\} \{([\s\S]*?)\n    \}/)?.[1] || '';
  assert.match(block, /allow get: if isOffice\(\)/);
  assert.match(block, /allow create, update: if isOffice\(\)/);
  assert.doesNotMatch(block, /\|\| true/);
});

test('public links use separately hashed expiring packet-bound tokens', () => {
  assert.match(functions, /crypto\.randomBytes\(32\)\.toString\('base64url'\)/);
  assert.match(functions, /tokenHash: hashToken\(token\)/);
  assert.match(functions, /expiresAt/);
  assert.match(functions, /timingSafeEqual/);
  assert.match(app, /searchParams\.set\('access'/);
});

test('public browser reads and writes route through narrow callables', () => {
  assert.match(app, /getPublicIntakeV2Callable/);
  assert.match(app, /updatePublicIntakeV2Callable/);
  assert.match(app, /savePublicIntakeAction\('orientation'/);
  assert.match(app, /savePublicIntakeAction\('drug'/);
  assert.match(app, /savePublicIntakeAction\('safety'/);
  assert.match(app, /savePublicIntakeAction\('w4'/);
  assert.doesNotMatch(app, /getDoc\(doc\(db, 'newHireIntakes', publicNewHireIntakeId\)/);
});

test('completed, archived, revoked, and expired packets fail closed', () => {
  assert.match(functions, /intake\.packetSubmitted === true/);
  assert.match(functions, /CLOSED_STATUSES\.has\(intake\.status\)/);
  assert.match(functions, /access\.revokedAt/);
  assert.match(functions, /expires <= Date\.now\(\)/);
  assert.match(functions, /'publicAccess\.revokedAt': FieldValue\.serverTimestamp\(\)/);
});
