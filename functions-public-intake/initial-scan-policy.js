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

function initialScanEvidence({ result, bucket, expectedBucket, name, generation, size, contentType, sha256, metadata }) {
  const normalizedResult = bounded(result, 40).toLowerCase();
  if (!['clean', 'infected', 'manual-review'].includes(normalizedResult) || bounded(bucket, 220) !== bounded(expectedBucket, 220)) {
    throw new Error('invalid-scan-result');
  }
  const authorizationId = bounded(metadata?.palInitialScanAuthorizationId, 180);
  const intakeId = bounded(metadata?.palInitialScanIntakeId, 180);
  const folder = bounded(metadata?.palInitialScanFolder, 40);
  const scanObjectPath = bounded(metadata?.palInitialScanObjectPath, 1024);
  if (!authorizationId || !intakeId || !['certUploads', 'payrollIdUploads'].includes(folder)
      || bounded(name, 1024) !== scanObjectPath || !/^initial-scans\//.test(scanObjectPath)) {
    throw new Error('invalid-scan-envelope');
  }
  const originalIdentity = normalizeObjectIdentity({
    path: metadata?.palOriginalPath,
    generation: metadata?.palOriginalGeneration,
    size: Number(metadata?.palOriginalSize),
    contentType: metadata?.palOriginalContentType,
    sha256: metadata?.palOriginalSha256
  });
  const actualSha256 = bounded(sha256, 64).toLowerCase();
  if (actualSha256 !== originalIdentity.sha256 || Number(size) !== originalIdentity.size
      || bounded(contentType, 160).toLowerCase() !== originalIdentity.contentType || !/^\d+$/.test(bounded(generation, 80))) {
    throw new Error('scan-output-identity-mismatch');
  }
  return Object.freeze({ authorizationId, intakeId, folder, scanObjectPath, result: normalizedResult,
    outputGeneration: bounded(generation, 80), originalIdentity });
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
