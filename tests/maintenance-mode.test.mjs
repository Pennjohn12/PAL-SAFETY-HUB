import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("maintenance/index.html", "utf8");
const firestoreRules = fs.readFileSync("firestore.maintenance.rules", "utf8");
const storageRules = fs.readFileSync("storage.maintenance.rules", "utf8");
const functions = fs.readFileSync("functions-maintenance/index.js", "utf8");
const productionConfig = JSON.parse(fs.readFileSync("firebase.maintenance.production.json", "utf8"));
const stagingConfig = JSON.parse(fs.readFileSync("firebase.maintenance.staging.json", "utf8"));

const interactiveFunctions = [
  "closeDailyAccessSession",
  "createDailyAccessSession",
  "finalizePublicIntakeUpload",
  "generateSafetyDraft",
  "getIntegrationHealth",
  "getMyEmployeeCenter",
  "sendAppEmail",
  "sendAppText",
  "submitDailyAccess",
  "submitEmployeeFieldForm",
  "updateDailyAccessSubmission",
  "updateTextDeliveryStatus"
];

test("maintenance Hosting serves one non-interactive page for every route", () => {
  for (const config of [productionConfig, stagingConfig]) {
    assert.equal(config.hosting.public, "maintenance");
    assert.deepEqual(config.hosting.rewrites, [{ source: "**", destination: "/index.html" }]);
    const headers = Object.fromEntries(config.hosting.headers[0].headers.map(row => [row.key, row.value]));
    assert.equal(headers["Cache-Control"], "no-store, max-age=0");
    assert.equal(headers["X-Frame-Options"], "DENY");
    assert.match(headers["Content-Security-Policy"], /default-src 'none'/);
    assert.match(headers["X-Robots-Tag"], /noindex/);
  }
  assert.match(page, /security maintenance/i);
  assert.match(page, /Sign-in, employee records, project tools, uploads, intake links, signatures, and field submissions are temporarily unavailable/);
  assert.doesNotMatch(page, /firebase|script\s+src|<form/i);
});

test("maintenance Firestore and Storage rules deny every client operation", () => {
  assert.match(firestoreRules, /match \/\{document=\*\*\}[\s\S]*allow read, write: if false/);
  assert.match(storageRules, /match \/\{object=\*\*\}[\s\S]*allow read, write: if false/);
  assert.doesNotMatch(firestoreRules, /if true/);
  assert.doesNotMatch(storageRules, /if true/);
});

test("maintenance backend covers every currently inventoried interactive endpoint", () => {
  for (const name of interactiveFunctions) {
    assert.match(functions, new RegExp(`exports\\.${name}\\s*=`));
  }
  assert.match(functions, /status\(503\)/);
  assert.match(functions, /Retry-After/);
  assert.doesNotMatch(functions, /firebase-admin|defineSecret|process\.env/);
});

test("scheduled integrations are replaced with paused no-op handlers", () => {
  assert.match(functions, /exports\.monitorIntegrationHealth\s*=\s*pausedSchedule/);
  assert.match(functions, /exports\.sendWeeklyCertWatch\s*=\s*pausedSchedule/);
  assert.match(functions, /maintenance: true, skipped: true/);
});

test("Production maintenance configuration targets only the PAL app site", () => {
  assert.equal(productionConfig.hosting.site, "pal-safety-hub");
  assert.equal(productionConfig.functions, undefined);
  assert.equal(stagingConfig.hosting.site, "pal-safety-hub-staging");
  assert.equal(stagingConfig.functions.source, "functions-maintenance");
});
