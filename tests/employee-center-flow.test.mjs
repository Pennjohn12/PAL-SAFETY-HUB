import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const projects = fs.readFileSync(new URL('../projects.html', import.meta.url), 'utf8');
const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const functions = fs.readFileSync(new URL('../functions/index.js', import.meta.url), 'utf8');

test('employee accounts route into My PAL instead of being blocked at login', () => {
  assert.match(projects, /showView\('view-employee-center'\);\s*loadMyEmployeeCenter\(true\)/);
  assert.doesNotMatch(projects, /This account is Employee \/ Intake Only/);
});

test('signed-in dashboards no longer link to the retired public PAL Home', () => {
  const dashboard = projects.slice(projects.indexOf('<div class="view" id="view-projects">'));
  assert.doesNotMatch(dashboard, />PAL Home</);
  assert.match(dashboard, />My Dashboard</);
});

test('My PAL launches every approved existing PAL safety form', () => {
  for (const id of ['harness-checklist','scissor-lift-inspection','scaffold-checklist','incident-report','decon-setup-checklist','ppe-inspection-checklist','respirator-checklist','demolition-safety-checklist']) {
    assert.match(projects, new RegExp("\\['" + id.replaceAll('-', '\\-') + "'"));
    assert.match(home, new RegExp('id="' + id + '"'));
  }
});

test('safety form buttons render even when employee records fail to load', () => {
  const formGridMarkup = projects.slice(projects.indexOf('id="employee-center-form-grid"'), projects.indexOf('id="employee-center-reuse-list"'));
  assert.match(formGridMarkup, /openEmployeePalForm\('harness-checklist'\)/);
  assert.match(formGridMarkup, /openEmployeePalForm\('scissor-lift-inspection'\)/);
  assert.match(projects, /window\.loadMyEmployeeCenter = async function[\s\S]*?renderEmployeeCenterFormButtons\(\);[\s\S]*?try \{/);
  assert.doesNotMatch(projects, /Choose the project this form belongs to first/);
  assert.match(projects, /Enter the project or PAL job number inside the form before submitting/);
});

test('employees can open a blank form before choosing a project', () => {
  const launcher = projects.slice(projects.indexOf('window.openEmployeePalForm'), projects.indexOf('async function loadUserProfile'));
  assert.match(launcher, /palProjectForm=1&employeeCenter=1&form=/);
  assert.doesNotMatch(launcher, /employee-center-project-select/);
  assert.doesNotMatch(launcher, /projectId=/);
});

test('employee project assignments grant project-member access', () => {
  assert.match(projects, /toggleEmployeeAssignment[\s\S]*?memberEmails: assign \? arrayUnion\(employeeEmail\) : arrayRemove\(employeeEmail\)/);
  assert.match(functions, /employee\?\.assignedProjectIds/);
});

test('employee form routes have a fixed safe return to My PAL', () => {
  assert.match(home, /employeeCenter.*projects\.html\?employeeCenter=1&tab=forms/s);
  assert.match(home, /projects\.html\?employeeCenter=1&tab=history/);
  assert.doesNotMatch(home, /const returnUrl = params\.get\('return'\)/);
});

test('employee center data is authenticated and does not mutate records', () => {
  assert.match(functions, /exports\.getMyEmployeeCenter = onCall/);
  assert.match(functions, /if \(!request\.auth\?\.uid\) throw new HttpsError\('unauthenticated'/);
  const body = functions.slice(functions.indexOf('exports.getMyEmployeeCenter'), functions.indexOf('exports.updateTextDeliveryStatus'));
  assert.doesNotMatch(body, /(?:doc|collection)\([^\n]+\)\.(?:set|update|delete)\(/);
});
