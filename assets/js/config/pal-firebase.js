import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

export const PAL_PUBLIC_PROJECTS_URL = "https://pal-safety-hub.web.app/projects.html";

export const PAL_ADMIN_EMAILS = [
  "jvpanettiere@gmail.com",
  "jvpanettiere@outlook.com",
  "adilorenzo@palcorp.com",
  "jpanettiere@palcorp.com",
  "john.panettiere@palcorp.com",
  "pennj@palcorp.com"
];

const firebaseConfig = {
  apiKey: "AIzaSyCxV6nTIqaaSZCtKq74lx72IBgUwKwEa80",
  authDomain: "pal-safety-hub.firebaseapp.com",
  projectId: "pal-safety-hub",
  storageBucket: "pal-safety-hub.firebasestorage.app",
  messagingSenderId: "461653262208",
  appId: "1:461653262208:web:fb88dc50ea0a2f68630b65"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const functions = getFunctions(app, "us-central1");

export const sendAppEmailCallable = httpsCallable(functions, "sendAppEmail");
export const sendAppTextCallable = httpsCallable(functions, "sendAppText");
export const generateSafetyDraftCallable = httpsCallable(functions, "generateSafetyDraft");
export const getIntegrationHealthCallable = httpsCallable(functions, "getIntegrationHealth");
