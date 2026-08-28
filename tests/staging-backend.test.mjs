import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync("functions-staging/index.js", "utf8");
const pkg = JSON.parse(fs.readFileSync("functions-staging/package.json", "utf8"));
const deploy = JSON.parse(fs.readFileSync("firebase.staging.backend.json", "utf8"));

test("Staging bootstrap backend is isolated from Production integrations", () => {
  assert.match(source, /environment: "staging"/);
  assert.match(source, /syntheticDataOnly: true/);
  assert.doesNotMatch(source, /defineSecret|RESEND|TWILIO|OPENAI|pal-safety-hub(?!-staging)/i);
  assert.equal(pkg.engines.node, "22");
  assert.equal(deploy.functions[0].source, "functions-staging");
  assert.equal(deploy.functions[0].codebase, "staging-bootstrap");
});
