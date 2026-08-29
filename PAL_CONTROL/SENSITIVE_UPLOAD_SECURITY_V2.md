# Secure Sensitive Intake Upload Authorization

Last updated: **2026-08-29, America/New_York**

## Verified prior risk

Production Storage rules allowed an anonymous browser to upload under any `newHireIntakes/{intakeId}/certUploads` or `payrollIdUploads` path. The browser chose the object path and a later backend action only verified the object after it had already entered PAL Storage. Anyone who guessed or obtained a packet ID could therefore create arbitrary intake objects without proving possession of an active packet token.

## Package 5 control

- Direct public client writes to normal intake folders are removed. Office-authenticated legacy/administrative writes remain allowed.
- A public browser must first present the active Package 4 packet token to `createPublicIntakeUploadV2`.
- The backend issues a separate random one-file grant that expires after 15 minutes and is bound to one packet, approved folder, backend-chosen quarantine path, file label, extension, content type, and exact byte size.
- The browser receives a Google Cloud Storage resumable session created by the backend. It cannot select another PAL object path.
- Finalization requires the packet token, authorization ID, and separate grant secret. It rejects expiry, replay, cross-packet use, wrong folder/type/size, altered metadata, and incorrect file signatures.
- Invalid completed objects are removed. Successfully verified objects remain in `quarantine/newHireIntakes/...` and are inaccessible to every browser, including Office.
- Quarantined files are explicitly recorded as `malwareScanStatus: pending`, `securityStatus: quarantined`, and `downloadable: false`. PAL does not claim that extension/header validation proves a file is malware-free.
- The UI displays quarantined files as unavailable to open.
- Abuse limits are 25 MiB per file, 12 saved files per packet, 100 MiB saved bytes per packet, and 12 issued grants per packet per hour.
- An hourly backend cleanup expires unused grants and deletes any completed-but-unfinalized quarantine object. Cloud Storage manages abandoned incomplete resumable-session fragments separately.
- Grant documents record issuance, packet/folder/path/size/type scope, expiry, state, use, rejection, and cleanup. Cleanup emits a structured event. Complete immutable security auditing remains Package 12.

## Affected flows

- Public certification uploads in the new-hire/orientation packet.
- Public driver-license, union-card, Social Security-card, W-4, and other payroll/identity uploads.
- Public upload progress, confirmation, retry behavior, packet checklist, and Office review display.
- Authenticated Office upload paths outside the public intake flow remain unchanged.

## Compatibility and migration

- Current Package 4 secure intake links remain valid; users do not need a new link solely because of Package 5.
- A browser page already open when Production cuts over must be refreshed before uploading. A direct upload already in progress during the Storage-rule switch may fail and must be reselected after refresh.
- Existing finalized intake files and metadata remain in their existing paths and are not moved, rescanned, or reclassified by this package.
- Existing unfinalized/orphaned Production objects are not inventoried or deleted because that would require inspecting real Storage data and a separately reviewed cleanup plan.
- New successfully finalized files remain quarantined and unavailable for Office download until PAL implements and approves a malware scanning/release process. This is an intentional secure operating limitation, not a claim of a complete malware scanner.

## Test and Staging evidence

- Core/static suite: **68 of 68 passed**.
- Firebase Firestore/Storage/Functions emulator suite: **10 of 10 passed** with synthetic records and bytes only.
- Tested behavior includes direct normal/quarantine Storage denial, valid one-file grant, packet binding, folder/type/size rejection, separate grant secret, expiry, replay denial, stored metadata and magic-byte verification, invalid-object deletion, quarantine status, and expired-grant cleanup.
- Staging Hosting serves the grant-based client.
- Staging `createPublicIntakeUploadV2` and the updated finalizer are ACTIVE on Node.js 22 in `us-central1`; empty anonymous requests reach application validation and fail with 400/403.
- Staging `cleanupExpiredPublicIntakeUploadsV2` is ACTIVE and scheduled hourly. Staging Cloud Scheduler was enabled for this isolated control.
- No live end-to-end Staging upload session was created because no synthetic packet credential was retained for this task. The exact grant/storage/finalizer behavior passed against the Firebase emulators; live Staging verified deployment and authorization boundaries only.

## Production activation — approved and verified

John explicitly approved tested commit `7cbe1c8e866aebf8fd7b0c61bb55b22ec710764c` after acknowledging that new public uploads remain unavailable even to Office until the later scan/release control. The following activation completed on 2026-08-29:

1. Update the `public-intake-v2` Function codebase and create `createPublicIntakeUploadV2` plus hourly `cleanupExpiredPublicIntakeUploadsV2` in `us-central1`.
2. Verify the new public callable has Cloud Run public invocation while the scheduled cleanup remains non-public; verify empty anonymous application denials.
3. Deploy the grant-based Hosting client to site `pal-safety-hub`.
4. Deploy `storage.rules` closing anonymous writes to normal intake paths and denying all browser access to quarantine paths.
5. Verify both Firebase Hosting domains, active Function/schedule state, direct synthetic Storage denial, and normal non-upload application availability without opening real PAL records.

Verification confirmed all six Package 5 services ACTIVE on Node.js 22 in `us-central1`, both Production Hosting domains serving the secured upload client, anonymous access to the active Storage bucket denied, application-level empty create/finalize requests rejected, and the enabled hourly cleanup completing a forced Production run successfully. No real PAL record, account, credential, or file was used.

Production now has one hourly scheduled invocation and quarantine-object storage costs. Packet limits bound ordinary use, but finalized quarantined objects persist until the approved scan/release/retention process. That work is explicitly assigned to Package 6 with the sensitive payroll/identity vault.

## Rollback

Redeploy the pre-Package-5 Function codebase, Hosting, and Storage rules from the Package 4 tested commit, restore only the prior Function invoker/schedule state, and verify both domains and the old upload path. Remove the new scheduler job and new callable only as part of the exact rollback.

Rollback restores anonymous ID-based Storage writes and therefore restores the verified vulnerability. New quarantine records/objects created before rollback are not automatically moved or deleted; handling them requires a separate reviewed cleanup because they may contain sensitive data.
