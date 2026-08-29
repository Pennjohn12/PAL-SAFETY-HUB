# Secure Public Orientation and Intake Access

Last updated: **2026-08-29, America/New_York**

## Verified prior risk

The public orientation/intake URL previously used the Firestore document ID as its only access credential. Anyone who obtained or guessed that ID could read and update the intake directly from the browser. Missing or invalid IDs could also fall back to a blank writable packet. This was a verified authorization vulnerability, not only a recommendation.

## Package 4 control

- Public links now require both the packet ID and a separate cryptographically random access token.
- Only a SHA-256 hash of the token is stored with the packet. The plaintext token exists only in the newly issued URL.
- Tokens are bound to one packet, expire after 14 days by default, may not exceed 30 days, and are replaced when PAL Office issues another link.
- Link issuance requires an authenticated active Office or Admin profile.
- Public reads and updates pass through four narrow server actions; direct public Firestore access to `newHireIntakes` is denied.
- The server accepts only the named intake sections and approved fields. Client attempts to write roles, archival state, authorization fields, or unrelated records are discarded.
- Completed, archived, revoked, expired, guessed, cross-packet, and replayed access fails closed.
- Final submission revokes the token in the same transaction and cannot be replayed.
- Missing and legacy ID-only links show a replacement-link message and do not create a temporary packet.

## Affected public flows

- Single orientation/intake link creation and copy.
- Bulk orientation text link creation.
- Public packet resume, basic details, orientation, drug consent, safety agreement, W-4, upload confirmation, and final submission.
- Office review and signed-in intake editing remain authenticated PAL workflows.

## Compatibility and migration

Existing ID-only links are intentionally incompatible and will fail closed after the Production cutover. PAL Office must issue a new secure link for each active intake that still needs access. Issuing a new link invalidates any previously issued secure link for that packet. Data already saved in an intake remains in place; unsaved browser-only entries cannot be migrated. Completed or archived packets cannot receive a new public link.

No bulk Production migration and no inspection of real intake records is included in Package 4. Any action that changes real Production intake records requires separate explicit authorization.

## Test evidence

- Core/static suite: **63 of 63 passed** on 2026-08-29.
- Firebase emulator security suite: **5 of 5 passed** using synthetic packets only.
- Verified cases: direct anonymous Firestore read/update denial; valid packet-bound token; guessed and cross-packet denial; expired and revoked denial; narrow allowed update; completed submission and replay denial; anonymous link-issuance denial.
- Staging Hosting serves the V2 client and the legacy-link replacement behavior.
- Staging Function deployment and live endpoint evidence are recorded in the final Package 4 checkpoint.

## Known boundaries assigned to later packages

- Package 5 must replace the remaining raw browser-to-Storage upload path with single-purpose, file-bound upload authorization. Package 4 validates the upload metadata finalization but does not claim that Storage upload abuse is solved.
- Package 6 must separate SSNs, W-4 data, IDs, payroll, and other identity data into a more restricted vault.
- Package 11 must add App Check, rate limits, and broader abuse resistance.
- Package 12 must add the complete immutable security audit trail and alerts.

## Production activation

John explicitly approved the exact tested commit and acknowledged the legacy-link replacement impact. Production activation completed at approximately **1:07 AM America/New_York on 2026-08-29** in this order:

1. Deploy the four new `public-intake-v2` callable Functions in `us-central1`.
2. Verify their active state and anonymous authorization behavior.
3. Deploy the tested Hosting client to site `pal-safety-hub`.
4. Deploy the tested `firestore.rules` that removes direct public intake reads and writes.
5. Verify both Production domains, legacy-link failure, authenticated Office behavior, and synthetic endpoint denial without opening real PAL records.

The four V2 Functions are ACTIVE on Node.js 22 in `us-central1` and publicly invokable at the Cloud Run boundary so their application authorization can operate. Empty anonymous calls return the intended 401/403 application denials. Both Firebase Hosting domains serve the V2 client, an ID-only synthetic URL visibly fails closed, and an anonymous synthetic Firestore document read is denied with 403. No real PAL record was opened or changed.

The cutover affects every existing public orientation/intake link. PAL Office must issue replacement links from the authenticated Office screen when an active intake needs access.

## Rollback

Redeploy the pre-Package-4 Hosting and Firestore rules from the verified pre-change commit, then verify both domains and the prior public behavior. The four V2 Functions may remain deployed but unused or be removed only as an explicitly approved follow-up. Token-hash metadata written by later Office link issuance is inert after rollback and does not overwrite existing intake content.

Rollback restores the older ID-only behavior and therefore restores the verified vulnerability; it is an emergency compatibility action, not the preferred steady state.
