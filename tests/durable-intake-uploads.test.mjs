import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const functionsSource = readFileSync(new URL('../functions-public-intake/index.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../projects.html', import.meta.url), 'utf8');
const firestoreRules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const storageRules = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');

assert.match(functionsSource, /exports\.createPublicIntakeUploadV2 = onCall/, 'backend must issue a narrow single-file upload grant');
assert.match(functionsSource, /exports\.finalizePublicIntakeUploadV2 = onCall/, 'token-bound backend finalizer must be deployed as a callable function');
assert.match(functionsSource, /file\.getMetadata\(\)/, 'backend must verify the stored object before attaching it');
assert.match(functionsSource, /grant\.path/, 'backend must use its own grant-bound quarantine path');
assert.match(functionsSource, /CLOSED_STATUSES/, 'approved and archived packets must reject employee file changes');
assert.match(appSource, /createPublicIntakeUploadV2Callable\(/, 'the browser must request a one-file backend grant before uploading');
assert.match(appSource, /request\.open\('PUT', uploadUrl\)/, 'the browser must upload only through the server-created resumable URL');
assert.match(appSource, /finalizePublicIntakeUploadV2Callable\(/, 'each upload must be confirmed by the token-bound backend');
assert.doesNotMatch(appSource, /newHireIntakes\/\$\{publicNewHireIntakeId\}\/\$\{folder\}/, 'the public browser must not choose a direct Storage path');
assert.match(functionsSource, /update\.certUploadNotes = notes/, 'cert notes must save in the backend transaction');
assert.match(functionsSource, /update\.payrollIdNotes = notes/, 'payroll notes must save in the backend transaction');
assert.match(storageRules, /allow write: if isOffice\(\) && isSafeUpload/, 'public intake Storage writes must require Office access');
assert.match(storageRules, /match \/quarantine\/newHireIntakes[\s\S]*?allow read, write, delete: if false/, 'quarantine must be closed to every browser');
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
