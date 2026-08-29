import fs from "node:fs";
import path from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { assertFails, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

const projectId = "pal-safety-hub-maintenance-emulator";
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: "127.0.0.1",
      port: 8085,
      rules: fs.readFileSync(path.join(repositoryRoot, "firestore.maintenance.rules"), "utf8")
    },
    storage: {
      host: "127.0.0.1",
      port: 9195,
      rules: fs.readFileSync(path.join(repositoryRoot, "storage.maintenance.rules"), "utf8")
    }
  });

  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "synthetic", "existing"), { test: true });
  });
});

after(async () => {
  await environment?.cleanup();
});

for (const [label, context] of [
  ["anonymous", () => environment.unauthenticatedContext()],
  ["employee", () => environment.authenticatedContext("synthetic-employee", { email: "pal.synthetic.employee@example.com", email_verified: true })],
  ["admin", () => environment.authenticatedContext("synthetic-admin", { email: "pal.synthetic.admin@example.com", email_verified: true, admin: true })]
]) {
  test(`${label} Firestore reads and writes are denied during maintenance`, async () => {
    const db = context().firestore();
    await assertFails(getDoc(doc(db, "synthetic", "existing")));
    await assertFails(setDoc(doc(db, "synthetic", `${label}-write`), { test: true }));
  });

  test(`${label} Storage reads and writes are denied during maintenance`, async () => {
    const storage = context().storage();
    await assertFails(getDownloadURL(ref(storage, `synthetic/${label}.txt`)));
    await assertFails(uploadString(ref(storage, `synthetic/${label}.txt`), "test only"));
  });
}
