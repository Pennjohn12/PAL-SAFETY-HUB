'use strict';

const { normalizeObjectIdentity, sameObjectIdentity } = require('./sensitive-vault-policy');

function bounded(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function safeName(value) {
  return bounded(value, 180).replace(/[^A-Za-z0-9._-]+/g, '_') || 'upload.bin';
}

function initialScanPath(authorizationId, name) {
  const id = bounded(authorizationId, 180);
  if (!/^[A-Za-z0-9_-]{8,180}$/.test(id)) throw new Error('invalid-scan-authorization');
  return `initial-scans/${id}/${safeName(name)}`;
}

function initialScanMetadata({ authorizationId, intakeId, folder, name, originalIdentity }) {
  const identity = normalizeObjectIdentity(originalIdentity);
  const normalizedFolder = bounded(folder, 40);
  if (!['certUploads', 'payrollIdUploads'].includes(normalizedFolder)) throw new Error('invalid-scan-folder');
  const scanObjectPath = initialScanPath(authorizationId, name);
  return Object.freeze({
    palInitialScanAuthorizationId: bounded(authorizationId, 180),
    palInitialScanIntakeId: bounded(intakeId, 180),
    palInitialScanFolder: normalizedFolder,
    palOriginalPath: identity.path,
    palOriginalGeneration: identity.generation,
    palOriginalSize: String(identity.size),
    palOriginalContentType: identity.contentType,
    palOriginalSha256: identity.sha256,
    palInitialScanObjectPath: scanObjectPath
  });
}

function initialScanEvidence({ result, authorizationId, intakeId, folder, scanObjectPath, scanObjectGeneration, sha256, originalIdentity }) {
  const normalizedResult = bounded(result, 40).toLowerCase();
  const normalizedAuthorizationId = bounded(authorizationId, 180);
  const normalizedIntakeId = bounded(intakeId, 180);
  const normalizedFolder = bounded(folder, 40);
  const normalizedScanObjectPath = bounded(scanObjectPath, 1024);
  const normalizedScanGeneration = bounded(scanObjectGeneration, 80);
  if (!['clean', 'manual-review'].includes(normalizedResult) || !normalizedAuthorizationId || !normalizedIntakeId
      || !['certUploads', 'payrollIdUploads'].includes(normalizedFolder)
      || !/^initial-scans\//.test(normalizedScanObjectPath) || !/^\d+$/.test(normalizedScanGeneration)) {
    throw new Error('invalid-scan-envelope');
  }
  const normalizedIdentity = normalizeObjectIdentity(originalIdentity);
  const actualSha256 = bounded(sha256, 64).toLowerCase();
  if (actualSha256 !== normalizedIdentity.sha256) {
    throw new Error('scan-output-identity-mismatch');
  }
  return Object.freeze({ authorizationId: normalizedAuthorizationId, intakeId: normalizedIntakeId, folder: normalizedFolder,
    scanObjectPath: normalizedScanObjectPath, result: normalizedResult, outputGeneration: normalizedScanGeneration,
    originalIdentity: normalizedIdentity });
}

function mayApplyInitialScan({ authorization, record, evidence }) {
  if (!authorization || !record || !evidence) return false;
  if (authorization.intakeId !== evidence.intakeId || authorization.folder !== evidence.folder
      || authorization.path !== evidence.originalIdentity.path || authorization.scanObjectPath !== evidence.scanObjectPath) return false;
  if (!['scan-queued', 'scan-result-recording'].includes(authorization.state)) return false;
  if (authorization.state === 'scan-result-recording'
      && (authorization.scanResult !== evidence.result
        || bounded(authorization.scanResultObjectGeneration, 80) !== evidence.outputGeneration)) return false;
  if (!['pending', 'scanning'].includes(record.malwareScanStatus)) return false;
  return sameObjectIdentity(record.objectIdentity, evidence.originalIdentity);
}

module.exports = { initialScanEvidence, initialScanMetadata, initialScanPath, mayApplyInitialScan };
