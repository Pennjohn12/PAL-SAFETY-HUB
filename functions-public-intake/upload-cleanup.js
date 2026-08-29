async function cleanupExpiredUploads({ db, bucket, Timestamp, FieldValue, limit = 50 }) {
  const expired = await db.collection('publicIntakeUploadAuthorizations').where('expiresAt', '<=', Timestamp.now()).limit(limit).get();
  let removed = 0;
  for (const snap of expired.docs) {
    const grant = snap.data() || {};
    if (grant.state !== 'issued') continue;
    if (grant.path) await bucket.file(grant.path).delete({ ignoreNotFound: true }).catch(() => {});
    await snap.ref.update({ state: 'expired', expiredAt: FieldValue.serverTimestamp() });
    removed += 1;
  }
  return removed;
}

module.exports = { cleanupExpiredUploads };
