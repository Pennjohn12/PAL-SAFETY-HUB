import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const fixture = JSON.parse(
  fs.readFileSync("tests/security/staging-auth-identities.json", "utf8"),
);

test("Staging authentication matrix uses six synthetic reserved-domain identities", () => {
  assert.equal(fixture.projectId, "pal-safety-hub-staging");
  assert.equal(fixture.credentialsStored, false);
  assert.equal(fixture.firestoreProfilesCreated, true);
  assert.deepEqual(
    fixture.identities.map(({ roleFixture }) => roleFixture),
    ["employee", "foreman", "supervisor", "office", "admin", "disabled"],
  );
  assert.equal(new Set(fixture.identities.map(({ uid }) => uid)).size, 6);
  assert.equal(new Set(fixture.identities.map(({ email }) => email)).size, 6);
  assert.ok(fixture.identities.every(({ email }) => email.endsWith("@example.com")));
  assert.equal(
    fixture.identities.find(({ roleFixture }) => roleFixture === "disabled")
      .authDisabled,
    true,
  );
});

test("Staging project fixture is unmistakably synthetic", () => {
  assert.equal(fixture.syntheticProject.environment, "staging");
  assert.equal(fixture.syntheticProject.synthetic, "true");
  assert.match(fixture.syntheticProject.name, /STAGING TEST/);
  assert.match(fixture.syntheticProject.name, /NOT REAL/);
  assert.match(fixture.syntheticProject.documentId, /^staging-test-/);
  assert.match(fixture.syntheticProject.jobNumber, /^STAGING-TEST-/);
});

test("Staging authentication fixture contains no passwords or tokens", () => {
  const serialized = JSON.stringify(fixture).toLowerCase();
  assert.doesNotMatch(serialized, /password|idtoken|refreshtoken|apikey|secret/);
});
