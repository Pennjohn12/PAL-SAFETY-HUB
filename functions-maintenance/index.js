const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const unavailable = onRequest(
  { region: "us-central1", cors: true, timeoutSeconds: 15, memory: "256MiB", maxInstances: 2 },
  (_request, response) => {
    response.set("Cache-Control", "no-store");
    response.set("Retry-After", "3600");
    response.status(503).json({
      error: {
        status: "UNAVAILABLE",
        message: "PAL Safety Hub is temporarily unavailable for security maintenance."
      }
    });
  }
);

exports.closeDailyAccessSession = unavailable;
exports.createDailyAccessSession = unavailable;
exports.finalizePublicIntakeUpload = unavailable;
exports.generateSafetyDraft = unavailable;
exports.getIntegrationHealth = unavailable;
exports.sendAppEmail = unavailable;
exports.sendAppText = unavailable;
exports.submitDailyAccess = unavailable;
exports.updateDailyAccessSubmission = unavailable;
exports.updateTextDeliveryStatus = unavailable;

const eastUnavailable = onRequest(
  { region: "us-east1", cors: true, timeoutSeconds: 15, memory: "256MiB", maxInstances: 2 },
  (_request, response) => {
    response.set("Cache-Control", "no-store");
    response.set("Retry-After", "3600");
    response.status(503).json({
      error: {
        status: "UNAVAILABLE",
        message: "PAL Safety Hub is temporarily unavailable for security maintenance."
      }
    });
  }
);

exports.getMyEmployeeCenter = eastUnavailable;
exports.submitEmployeeFieldForm = eastUnavailable;

const pausedSchedule = onSchedule(
  { region: "us-central1", schedule: "0 0 1 1 *", timeZone: "America/New_York", timeoutSeconds: 15 },
  async () => ({ maintenance: true, skipped: true })
);

exports.monitorIntegrationHealth = pausedSchedule;
exports.sendWeeklyCertWatch = pausedSchedule;
