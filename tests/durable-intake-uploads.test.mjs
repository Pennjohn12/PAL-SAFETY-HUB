import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const functionsSource = readFileSync(new URL('../functions-public-intake/index.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../projects.html', import.meta.url), 'utf8');
const firestoreRules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const storageRules = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');

assert.match(functionsSource, /exports\.finalizePublicIntakeUploadV2 = onCall/, 'token-bound backend finalizer must be deployed as a callable function');
assert.match(functionsSource, /file\.getMetadata\(\)/, 'backend must verify the stored object before attaching it');
assert.match(functionsSource, /item\?\.path !== path/, 'backend must replace duplicate file paths idempotently');
assert.match(functionsSource, /CLOSED_STATUSES/, 'approved and archived packets must reject employee file changes');
assert.match(appSource, /uploadBytesResumable\(/, 'intake uploads must use resumable transfer');
assert.match(appSource, /finalizePublicIntakeUploadV2Callable\(/, 'each upload must be confirmed by the token-bound backend');
assert.match(appSource, /stableNewHireUploadName\(/, 'retrying the same file must use a stable path');
assert.match(functionsSource, /update\.certUploadNotes = notes/, 'cert notes must save in the backend transaction');
assert.match(functionsSource, /update\.payrollIdNotes = notes/, 'payroll notes must save in the backend transaction');
assert.match(functionsSource, /UPLOAD_EXTENSIONS/, 'backend must verify file extensions against content types');
assert.match(functionsSource, /CERT_LABELS/, 'backend must allow only known certification categories');
assert.doesNotMatch(appSource, /submitPublicNewHireIntake/, 'obsolete direct public uploader must remain removed');
assert.doesNotMatch(appSource, /publicUploads/, 'obsolete public upload folder must remain removed from the app');
assert.doesNotMatch(storageRules, /'publicUploads'/, 'obsolete public upload folder must not remain writable');
assert.doesNotMatch(firestoreRules, /'certFiles'/, 'public Firestore rules must not permit direct attachment of uploaded files');
assert.doesNotMatch(firestoreRules, /'payrollIdFiles'/, 'public Firestore rules must not permit direct attachment of payroll files');
assert.match(appSource, /async function confirmPublicIntakeUpload\(payload, maxAttempts = 3\)/, 'packet confirmation should retry transient failures automatically');
assert.match(appSource, /publicIntakeUploadInProgress/, 'active uploads should be protected from accidental refresh');
assert.match(appSource, /event\.returnValue = ''/, 'refreshing during an active upload should trigger a browser warning');
assert.match(appSource, /input\.value = ''/, 'successful upload selections should be cleared to prevent accidental repeats');
assert.match(appSource, /Connection slow — still retrying certification/, 'stalled certification uploads should reassure the employee that retry is active');
assert.match(appSource, /Keep this page open/, 'slow upload guidance should prevent accidental interruption');

console.log('Durable intake upload regression checks passed.');
