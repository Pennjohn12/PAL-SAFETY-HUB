import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../projects.html', import.meta.url), 'utf8');

test('Good To Work creates or updates an employee record before approval', () => {
  assert.match(html, /async function moveApprovedIntakeToEmployees\(intake\)/);
  assert.match(html, /payload\.employeeId = await moveApprovedIntakeToEmployees\(intake\)/);
  assert.match(html, /await setDoc\(doc\(db, 'employees', employeeId\), employeeData, \{ merge: true \}\)/);
  assert.match(html, /payload\.movedToEmployeesAt = serverTimestamp\(\)/);
});

test('employee promotion is idempotent and preserves intake certifications', () => {
  assert.match(html, /const employeeId = existing\?\.id \|\| `intake-\$\{intake\.id\}`/);
  assert.match(html, /sourceIntakeId: intake\.id/);
  assert.match(html, /filter\(cert => !currentKeys\.has\(cert\.sourceKey\)\)/);
  assert.match(html, /onboardingIntakeIds: arrayUnion\(intake\.id\)/);
});

test('existing-employee waiver counts as completed payroll in onboarding progress', () => {
  assert.match(html, /label: 'Payroll\/ID', done: !!\(x\.existingEmployeePayrollDocsOnFile \|\| x\.payrollIdUploadsCompleted/);
});
