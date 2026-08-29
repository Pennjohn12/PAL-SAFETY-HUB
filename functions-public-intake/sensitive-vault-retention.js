'use strict';

const crypto = require('crypto');
const { notificationAudience, retentionDecision, sameObjectIdentity } = require('./sensitive-vault-policy');

function notificationId(intakeId, record) {
  return crypto.createHash('sha256').update(`${intakeId}\n${record.path}\n${record.malwareScanStatus}`).digest('hex');
}

async function processSensitiveVaultRetention({ db, bucket, FieldValue, now = Date.now(), limit = 50, writeAudit }) {
  const vaults = await db.collection('sensitiveIntakeVaults').limit(limit).get();
  const users = await db.collection('users').limit(250).get();
  const recipients = notificationAudience(users.docs.map(doc => ({ uid: doc.id, ...(doc.data() || {}) })));
  const result = { inspected: 0, deleted: 0, held: 0, notifications: 0 };

  for (const vaultSnap of vaults.docs) {
    const records = Array.isArray(vaultSnap.data()?.payrollIdFiles) ? vaultSnap.data().payrollIdFiles : [];
    for (const record of records) {
      result.inspected += 1;
      const decision = retentionDecision(record, now);
      if (decision.reason === 'legal-or-hr-hold') result.held += 1;

      const reviewState = ['infected', 'error', 'timeout', 'unsupported', 'manual-review'].includes(record?.malwareScanStatus);
      if (reviewState && record.retentionPolicyVersion === 2 && record.retentionState !== 'deleted' && recipients.length) {
        const ref = db.collection('sensitiveVaultNotifications').doc(notificationId(vaultSnap.id, record));
        const existing = await ref.get();
        if (!existing.exists) {
          await ref.create({ version: 1, intakeId: vaultSnap.id, objectPath: record.path, scanState: record.malwareScanStatus,
            recipientUids: recipients, state: 'unread', createdAt: FieldValue.serverTimestamp(), externalDelivery: false });
          result.notifications += 1;
        }
      }

      if (decision.action !== 'delete-object') continue;
      const identity = record.objectIdentity || {};
      if (!sameObjectIdentity(identity, { ...identity, path: record.path })) continue;
      await writeAudit({ action: 'retention-delete', actorUid: 'pal-retention-worker', actorEmail: '', intakeId: vaultSnap.id,
        objectPath: record.path, purpose: 'Approved sensitive-file retention enforcement', decision: 'allowed',
        correlationId: crypto.randomUUID(), reason: decision.reason });
      await bucket.file(record.path).delete({ preconditionOpts: { ifGenerationMatch: Number(identity.generation) } });
      await db.runTransaction(async transaction => {
        const fresh = await transaction.get(vaultSnap.ref);
        const files = Array.isArray(fresh.data()?.payrollIdFiles) ? fresh.data().payrollIdFiles : [];
        const updated = files.map(item => sameObjectIdentity(item?.objectIdentity, identity)
          ? { ...item, downloadable: false, retentionState: 'deleted', deletedAt: new Date(now).toISOString() }
          : item);
        transaction.update(vaultSnap.ref, { payrollIdFiles: updated, updatedAt: FieldValue.serverTimestamp() });
      });
      result.deleted += 1;
    }
  }
  return result;
}

module.exports = { notificationId, processSensitiveVaultRetention };
