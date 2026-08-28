import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const functions = fs.readFileSync(new URL('../functions/index.js', import.meta.url), 'utf8');

test('Save to Files uses a direct browser download with visible errors', () => {
  assert.match(home, /async function saveCurrentPageToFiles\(\)/);
  const saveFunction = home.slice(home.indexOf('async function saveCurrentPageToFiles()'), home.indexOf('function syncJobNumber'));
  assert.doesNotMatch(saveFunction, /saveActiveFormSilently/);
  assert.match(home, /a\.download = `\$\{title\}\.html`/);
  assert.match(home, /Could not save the file\. Try Print \/ PDF instead\./);
});

test('all named controls on the active document are collected for submission', () => {
  assert.match(home, /active\.querySelectorAll\('input\[name\], select\[name\], textarea\[name\]'\)/);
  assert.match(home, /control\.type === 'radio'/);
  assert.match(home, /control\.type === 'checkbox'/);
});

test('employee forms submit through an authenticated server path', () => {
  assert.match(home, /submitEmployeeFieldFormCallable/);
  assert.match(functions, /exports\.submitEmployeeFieldForm = onCall/);
  assert.match(functions, /if \(!request\.auth\?\.uid\) throw new HttpsError\('unauthenticated'/);
  assert.match(functions, /No PAL project matched that project name or job number/);
});

test('harness identity fields remain editable and distinguish manufacturer from manufacture date', () => {
  assert.match(home, /<label>Manufacturer Name<\/label><input type="text" name="manufacturer_name"/);
  assert.match(home, /<label>Date of Manufacture<\/label><input type="date" name="date_manufacture"/);
  assert.match(home, /<label>System Number<\/label><input type="text" name="system_number"/);
  assert.match(home, /<label>Model \/ Serial Number<\/label><input type="text" name="model_serial"/);
});
