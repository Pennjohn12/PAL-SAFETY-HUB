import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../projects.html', import.meta.url), 'utf8');
const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
const functions = await readFile(new URL('../functions/index.js', import.meta.url), 'utf8');

test('office intake form provides a narrowly scoped existing-employee waiver', () => {
  assert.match(html, /id="nh-existing-payroll-bypass"/);
  assert.match(html, /Existing PAL employee — payroll and identity documents are already verified in the office/);
  assert.match(html, /Safety certifications and the full orientation are still required/);
});

test('waiver completes only W-4 and payroll identity checklist items', () => {
  assert.match(html, /w4: payrollBypass \|\| !!x\.w4Form\?\.completed/);
  assert.match(html, /payroll: payrollBypass \|\| !!\(x\.payrollIdUploadsCompleted/);
  assert.match(html, /certs: !!\(x\.certUploadsCompleted/);
  assert.doesNotMatch(html, /certs: payrollBypass/);
});

test('public employee experience hides waived controls but keeps certification uploads', () => {
  assert.match(html, /public-open-w4-btn/);
  assert.match(html, /id="public-payroll-upload-box"[\s\S]{0,120}<h4>Payroll \/ ID Documents<\/h4>/);
  assert.doesNotMatch(html, /id="public-payroll-upload-box"[\s\S]{0,120}<h4>Safety Certifications<\/h4>/);
  assert.match(html, /Current safety certifications are still required/);
  assert.match(html, /payrollButton\.style\.display = c\.payrollBypass \? 'none' : ''/);
  assert.doesNotMatch(html, /certButton\.style\.display = c\.payrollBypass/);
});

test('public Firestore updates cannot grant the office waiver', () => {
  assert.match(rules, /match \/newHireIntakes\/\{intakeId\}/);
  assert.doesNotMatch(rules, /existingEmployeePayrollDocsOnFile/);
  assert.doesNotMatch(rules, /payrollDocsVerifiedBy/);
});

test('waived payroll uploads are rejected by both the screen and backend', () => {
  assert.match(html, /function publicPayrollDocumentsBypassed\(\)/);
  assert.match(html, /if \(publicPayrollDocumentsBypassed\(\)\) return toast\('PAL office already verified your payroll and identity documents/);
  assert.match(functions, /folder === 'payrollIdUploads' && intake\.existingEmployeePayrollDocsOnFile === true/);
  assert.match(functions, /folder === 'payrollIdUploads' && current\.existingEmployeePayrollDocsOnFile === true/);
});

test('review modal actions resolve the selected intake inside module scope', () => {
  assert.match(html, /onclick="setCurrentNewHireStatus\('Good To Work'\)"/);
  assert.match(html, /onclick="setCurrentNewHireStatus\('Ready for Review'\)"/);
  assert.match(html, /onclick="setCurrentNewHireStatus\('Missing Info'\)"/);
  assert.match(html, /function setCurrentNewHireStatus\(status\) \{[\s\S]*setNewHireStatus\(currentNewHireReviewId, status\)/);
  assert.doesNotMatch(html, /onclick="setNewHireStatus\(currentNewHireReviewId/);
});
