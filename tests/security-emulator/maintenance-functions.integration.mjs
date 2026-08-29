import assert from "node:assert/strict";
import test from "node:test";

const projectId = "pal-safety-hub-maintenance-emulator";
const origin = `http://127.0.0.1:5005/${projectId}`;
const endpoints = [
  ["us-central1", "closeDailyAccessSession"],
  ["us-central1", "createDailyAccessSession"],
  ["us-central1", "finalizePublicIntakeUpload"],
  ["us-central1", "generateSafetyDraft"],
  ["us-central1", "getIntegrationHealth"],
  ["us-central1", "sendAppEmail"],
  ["us-central1", "sendAppText"],
  ["us-central1", "submitDailyAccess"],
  ["us-central1", "updateDailyAccessSubmission"],
  ["us-central1", "updateTextDeliveryStatus"],
  ["us-east1", "getMyEmployeeCenter"],
  ["us-east1", "submitEmployeeFieldForm"]
];

for (const [region, name] of endpoints) {
  test(`${region}/${name} returns a maintenance response`, async () => {
    const response = await fetch(`${origin}/${region}/${name}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: {} })
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("retry-after"), "3600");
    const body = await response.json();
    assert.equal(body.error?.status, "UNAVAILABLE");
  });
}
