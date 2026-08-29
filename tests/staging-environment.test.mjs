import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const environmentSource = fs.readFileSync("assets/js/config/pal-environment.js", "utf8");
const firebaseSource = fs.readFileSync("assets/js/config/pal-firebase.js", "utf8");
const stagingConfig = JSON.parse(fs.readFileSync("firebase.staging.json", "utf8"));

test("Production Firebase is limited to recognized Production hosts", () => {
  assert.match(environmentSource, /pal\.jobsiteresources\.com/);
  assert.match(environmentSource, /pal-safety-hub\.web\.app/);
  assert.match(environmentSource, /PAL_ENVIRONMENT === "blocked"/);
  assert.match(environmentSource, /blocked an unrecognized host/);
});

test("Staging and local development use the isolated Staging project", () => {
  assert.match(environmentSource, /pal-safety-hub-staging\.web\.app/);
  assert.match(environmentSource, /"localhost"/);
  assert.match(firebaseSource, /PAL_IS_STAGING \? stagingFirebaseConfig : productionFirebaseConfig/);
  assert.match(firebaseSource, /projectId: "pal-safety-hub-staging"/);
});

test("Staging has a persistent synthetic-data warning and safe hosting headers", () => {
  assert.match(environmentSource, /STAGING — TEST DATA ONLY/);
  assert.equal(stagingConfig.hosting.site, "pal-safety-hub-staging");
  const headers = stagingConfig.hosting.headers.flatMap(entry => entry.headers);
  assert.ok(headers.some(header => header.key === "Cache-Control" && header.value.includes("no-store")));
  assert.ok(headers.some(header => header.key === "X-Robots-Tag" && header.value.includes("noindex")));
  assert.ok(stagingConfig.hosting.ignore.includes("functions*/**"));
  assert.ok(stagingConfig.hosting.ignore.includes("scanner/**"));
});
