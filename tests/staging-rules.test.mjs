import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const firestoreRules = fs.readFileSync("firestore.staging.rules", "utf8");
const storageRules = fs.readFileSync("storage.staging.rules", "utf8");

test("Staging Firestore denies public and cross-user access", () => {
  assert.match(firestoreRules, /allow list: if false/);
  assert.match(firestoreRules, /request\.auth\.uid == userId/);
  assert.match(firestoreRules, /match \/\{document=\*\*\}[\s\S]*allow read, write: if false/);
});

test("Staging self-registration cannot grant privileged roles", () => {
  assert.match(firestoreRules, /request\.auth\.token\.email_verified == true/);
  assert.match(firestoreRules, /request\.resource\.data\.role == 'employee'/);
  assert.match(firestoreRules, /request\.resource\.data\.accessLevel == 'employee'/);
  assert.match(firestoreRules, /request\.resource\.data\.admin == false/);
  assert.match(firestoreRules, /request\.resource\.data\.isAdmin == false/);
  assert.match(firestoreRules, /allow update, delete: if false/);
});

test("Staging Storage remains completely closed", () => {
  assert.match(storageRules, /allow read, write: if false/);
  assert.doesNotMatch(storageRules, /allow\s+(read|write):\s*if\s+true/);
});
