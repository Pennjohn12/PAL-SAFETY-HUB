import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
import { PAL_ENVIRONMENT, PAL_IS_STAGING, assertKnownPalEnvironment } from "./pal-environment.js";

assertKnownPalEnvironment();

export { PAL_ENVIRONMENT, PAL_IS_STAGING };

export const PAL_PUBLIC_PROJECTS_URL = PAL_IS_STAGING
  ? "https://pal-safety-hub-staging.web.app/projects.html"
  : "https://pal.jobsiteresources.com/projects.html";

export const PAL_ADMIN_EMAILS = [
  "jvpanettiere@gmail.com",
  "jvpanettiere@outlook.com",
  "adilorenzo@palcorp.com",
  "jpanettiere@palcorp.com",
  "john.panettiere@palcorp.com",
  "pennj@palcorp.com"
];

const productionFirebaseConfig = {
  apiKey: "AIzaSyCxV6nTIqaaSZCtKq74lx72IBgUwKwEa80",
  authDomain: "pal-safety-hub.firebaseapp.com",
  projectId: "pal-safety-hub",
  storageBucket: "pal-safety-hub.firebasestorage.app",
  messagingSenderId: "461653262208",
  appId: "1:461653262208:web:fb88dc50ea0a2f68630b65"
};

const stagingFirebaseConfig = {
  apiKey: "AIzaSyB0LPD5BRZugX3cRlJAk_GDhtH3r853G5Q",
  authDomain: "pal-safety-hub-staging.firebaseapp.com",
  projectId: "pal-safety-hub-staging",
  storageBucket: "pal-safety-hub-staging.firebasestorage.app",
  messagingSenderId: "353920863212",
  appId: "1:353920863212:web:2e1c3043dc5a676b50cec9"
};

const firebaseConfig = PAL_IS_STAGING ? stagingFirebaseConfig : productionFirebaseConfig;

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const functions = getFunctions(app, "us-central1");
const eastFunctions = getFunctions(app, "us-east1");

export const sendAppEmailCallable = httpsCallable(functions, "sendAppEmail");
export const sendAppTextCallable = httpsCallable(functions, "sendAppText");
export const generateSafetyDraftCallable = httpsCallable(functions, "generateSafetyDraft");
export const getIntegrationHealthCallable = httpsCallable(functions, "getIntegrationHealth");
export const getMyEmployeeCenterCallable = httpsCallable(eastFunctions, "getMyEmployeeCenter");
export const submitEmployeeFieldFormCallable = httpsCallable(eastFunctions, "submitEmployeeFieldForm");
export const createDailyAccessSessionCallable = httpsCallable(functions, "createDailyAccessSession");
export const submitDailyAccessCallable = httpsCallable(functions, "submitDailyAccess");
export const updateDailyAccessSubmissionCallable = httpsCallable(functions, "updateDailyAccessSubmission");
export const closeDailyAccessSessionCallable = httpsCallable(functions, "closeDailyAccessSession");
export const finalizePublicIntakeUploadCallable = httpsCallable(functions, "finalizePublicIntakeUpload");
export const issuePublicIntakeAccessV2Callable = httpsCallable(functions, "issuePublicIntakeAccessV2");
export const getPublicIntakeV2Callable = httpsCallable(functions, "getPublicIntakeV2");
export const updatePublicIntakeV2Callable = httpsCallable(functions, "updatePublicIntakeV2");
export const createPublicIntakeUploadV2Callable = httpsCallable(functions, "createPublicIntakeUploadV2");
export const finalizePublicIntakeUploadV2Callable = httpsCallable(functions, "finalizePublicIntakeUploadV2");
