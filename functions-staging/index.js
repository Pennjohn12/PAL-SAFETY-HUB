const { onCall } = require("firebase-functions/v2/https");

exports.stagingEnvironmentHealth = onCall({
  region: "us-east1",
  cors: true,
  enforceAppCheck: false,
  timeoutSeconds: 10,
  memory: "256MiB",
  maxInstances: 1
}, async () => ({
  ok: true,
  environment: "staging",
  syntheticDataOnly: true
}));
