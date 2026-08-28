import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

const projectId = "pal-safety-hub-staging-emulator";
const employeeUid = "synthetic-employee";
const foremanUid = "synthetic-foreman";
const disabledUid = "synthetic-disabled";
const outsiderUid = "synthetic-outsider";
const bootstrapUid = "synthetic-bootstrap";
const appRegistrationUid = "synthetic-app-registration";
const projectDocId = "staging-test-project-001";

let environment;
const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function claims(uid, role, verified = true) {
  return {
    email: `pal.synthetic.${role}@example.com`,
    email_verified: verified,
  };
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: "127.0.0.1",
      port: 8085,
      rules: fs.readFileSync(
        path.join(repositoryRoot, "firestore.staging.rules"),
        "utf8",
      ),
    },
    storage: {
      host: "127.0.0.1",
      port: 9195,
      rules: fs.readFileSync(
        path.join(repositoryRoot, "storage.staging.rules"),
        "utf8",
      ),
    },
  });

  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const profiles = [
      [employeeUid, "employee", "test-only"],
      [foremanUid, "foreman", "test-only"],
      [disabledUid, "disabled", "disabled-test"],
      [outsiderUid, "employee", "test-only"],
    ];
    for (const [uid, role, status] of profiles) {
      await setDoc(doc(db, "users", uid), {
        uid,
        email: `pal.synthetic.${role}@example.com`,
        role,
        accessLevel: role,
        environment: "staging",
        synthetic: "true",
        status,
      });
    }
    await setDoc(doc(db, "projects", projectDocId), {
      name: "STAGING TEST — NOT REAL",
      environment: "staging",
      synthetic: "true",
      employeeUid,
      foremanUid,
      supervisorUid: bootstrapUid,
      officeUid: "synthetic-office",
      adminUid: "synthetic-admin",
    });
  });
});

after(async () => {
  await environment?.cleanup();
});

test("anonymous clients cannot read profiles or projects", async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "users", employeeUid)));
  await assertFails(getDoc(doc(db, "projects", projectDocId)));
});

test("verified users can read only their own profile", async () => {
  const db = environment
    .authenticatedContext(employeeUid, claims(employeeUid, "employee"))
    .firestore();
  await assertSucceeds(getDoc(doc(db, "users", employeeUid)));
  await assertFails(getDoc(doc(db, "users", foremanUid)));
  await assertFails(getDocs(collection(db, "users")));
});

test("unverified users cannot read their own profile", async () => {
  const db = environment
    .authenticatedContext(employeeUid, claims(employeeUid, "employee", false))
    .firestore();
  await assertFails(getDoc(doc(db, "users", employeeUid)));
});

test("unverified clients can create only the exact employee bootstrap shape", async () => {
  const db = environment
    .authenticatedContext(bootstrapUid, claims(bootstrapUid, "bootstrap", false))
    .firestore();
  await assertSucceeds(
    setDoc(doc(db, "users", bootstrapUid), {
      uid: bootstrapUid,
      email: "pal.synthetic.bootstrap@example.com",
      role: "employee",
      accessLevel: "employee",
      admin: false,
      isAdmin: false,
      disabled: false,
      environment: "staging",
      synthetic: true,
    }),
  );
  await assertFails(getDoc(doc(db, "users", bootstrapUid)));
});

test("Production-shaped registration payload remains rejected by the Staging profile rule", async () => {
  const db = environment
    .authenticatedContext(
      appRegistrationUid,
      claims(appRegistrationUid, "app-registration"),
    )
    .firestore();
  await assertFails(
    setDoc(doc(db, "users", appRegistrationUid), {
      uid: appRegistrationUid,
      email: "pal.synthetic.app-registration@example.com",
      name: "STAGING TEST USER",
      role: "employee",
      accessLevel: "employee",
      admin: false,
      disabled: false,
      accessGrantId: "",
      accessGrantAppliedAt: null,
      createdAt: "synthetic-timestamp",
    }),
  );
});

test("verified bootstrap profile can satisfy the project active-profile predicate", async () => {
  const db = environment
    .authenticatedContext(bootstrapUid, claims(bootstrapUid, "bootstrap"))
    .firestore();
  await assertSucceeds(getDoc(doc(db, "projects", projectDocId)));
});

test("explicit active members can read the synthetic project", async () => {
  for (const [uid, role] of [
    [employeeUid, "employee"],
    [foremanUid, "foreman"],
  ]) {
    const db = environment.authenticatedContext(uid, claims(uid, role)).firestore();
    const snapshot = await assertSucceeds(
      getDoc(doc(db, "projects", projectDocId)),
    );
    assert.equal(snapshot.data().environment, "staging");
  }
});

test("outsiders and disabled profiles cannot read the synthetic project", async () => {
  const outsiderDb = environment
    .authenticatedContext(outsiderUid, claims(outsiderUid, "employee"))
    .firestore();
  const disabledDb = environment
    .authenticatedContext(disabledUid, claims(disabledUid, "disabled"))
    .firestore();
  await assertFails(getDoc(doc(outsiderDb, "projects", projectDocId)));
  await assertFails(getDoc(doc(disabledDb, "projects", projectDocId)));
});

test("project listing and all tested client mutations remain denied", async () => {
  const db = environment
    .authenticatedContext(employeeUid, claims(employeeUid, "employee"))
    .firestore();
  await assertFails(getDocs(collection(db, "projects")));
  await assertFails(updateDoc(doc(db, "users", employeeUid), { role: "admin" }));
  await assertFails(deleteDoc(doc(db, "users", employeeUid)));
  await assertFails(setDoc(doc(db, "projects", "unauthorized"), { synthetic: "true" }));
});

test("Storage reads and uploads remain denied for anonymous and authenticated clients", async () => {
  const anonymousStorage = environment.unauthenticatedContext().storage();
  const authenticatedStorage = environment
    .authenticatedContext(employeeUid, claims(employeeUid, "employee"))
    .storage();
  await assertFails(getDownloadURL(ref(anonymousStorage, "test-only/blocked.txt")));
  await assertFails(
    getDownloadURL(ref(authenticatedStorage, "test-only/blocked.txt")),
  );
  await assertFails(
    uploadString(ref(authenticatedStorage, "test-only/blocked.txt"), "synthetic"),
  );
});
