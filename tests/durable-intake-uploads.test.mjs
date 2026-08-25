import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const functionsSource = readFileSync(new URL('../functions/index.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../projects.html', import.meta.url), 'utf8');

assert.match(functionsSource, /exports\.finalizePublicIntakeUpload = onCall/, 'backend finalizer must be deployed as a callable function');
assert.match(functionsSource, /file\.getMetadata\(\)/, 'backend must verify the stored object before attaching it');
assert.match(functionsSource, /item\.path !== path/, 'backend must replace duplicate file paths idempotently');
assert.match(functionsSource, /status === 'Good To Work'/, 'approved packets must reject employee file changes');
assert.match(functionsSource, /status === 'Archived'/, 'archived packets must reject employee file changes');
assert.match(appSource, /uploadBytesResumable\(/, 'intake uploads must use resumable transfer');
assert.match(appSource, /finalizePublicIntakeUploadCallable\(/, 'each upload must be confirmed by the backend');
assert.match(appSource, /stableNewHireUploadName\(/, 'retrying the same file must use a stable path');
assert.match(functionsSource, /update\.certUploadNotes = notes/, 'cert notes must save in the backend transaction');
assert.match(functionsSource, /update\.payrollIdNotes = notes/, 'payroll notes must save in the backend transaction');

console.log('Durable intake upload regression checks passed.');
