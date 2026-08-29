import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const projects = readFileSync(new URL('../projects.html', import.meta.url), 'utf8');
const functions = readFileSync(new URL('../functions-public-intake/index.js', import.meta.url), 'utf8');

const intakeRules = rules.match(/match \/newHireIntakes\/\{intakeId\} \{([\s\S]*?)\n    \}/)?.[1] || '';

assert.match(intakeRules, /allow get: if isOffice\(\)/, 'public document reads must be closed');
assert.match(intakeRules, /allow create, update: if isOffice\(\)/, 'public document writes must be closed');
assert.match(functions, /requireActive\(row, token\)/, 'backend actions must validate the packet-bound token');
assert.match(functions, /packetSubmitted === true/, 'submitted packets must remain closed');
assert.match(projects, /newHireUploadErrorMessage\(error, label, stage = 'upload'\)/, 'upload errors must identify their stage');
assert.match(projects, /reached PAL secure storage, but the intake packet could not be updated/, 'packet-save failures must not masquerade as upload failures');

console.log('Public intake permission regression checks passed.');
