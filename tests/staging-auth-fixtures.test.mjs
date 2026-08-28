import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const fixture = JSON.parse(
  fs.readFileSync("tests/security/staging-auth-identities.json", "utf8"),
);

test("Staging authentication matrix uses six synthetic reserved-domain identities", () => {
  assert.equal(fixture.projectId, "pal-safety-hub-staging");
  assert.equal(fixture.credentialsStored, false);
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

test("Staging authentication fixture contains no passwords or tokens", () => {
  const serialized = JSON.stringify(fixture).toLowerCase();
  assert.doesNotMatch(serialized, /password|idtoken|refreshtoken|apikey|secret/);
});
