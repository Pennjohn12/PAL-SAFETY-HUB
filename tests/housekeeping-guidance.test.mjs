import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { HOUSEKEEPING_GUIDANCE, housekeepingPromptGuidance } = require('../functions/approved-safety-guidance.js');

assert.equal(HOUSEKEEPING_GUIDANCE.topic, 'Housekeeping');
assert.equal(HOUSEKEEPING_GUIDANCE.variations.length, 4);

const approvedText = JSON.stringify(HOUSEKEEPING_GUIDANCE).toLowerCase();
for (const requiredLanguage of ['wet, oily, muddy', 'cords, hoses', 'emergency egress', 'stack them securely', 'clean as you go']) {
  assert.equal(approvedText.includes(requiredLanguage), true, `Missing approved Housekeeping language: ${requiredLanguage}`);
}

const prompt = housekeepingPromptGuidance();
assert.equal(prompt.includes('choose two distinct'), true);
assert.equal(prompt.includes('Vary the two choices across drafts'), true);

const projectsSource = await readFile(new URL('../projects.html', import.meta.url), 'utf8');
assert.equal(projectsSource.includes('const housekeepingVariations = ['), true);
assert.equal(projectsSource.includes('housekeepingHash'), true);
assert.equal(projectsSource.includes('Clean as you go instead of waiting until the end of the shift.'), true);

console.log('Housekeeping guidance tests passed.');
