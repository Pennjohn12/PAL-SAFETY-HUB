# Controlled Production Maintenance Mode

Prepared and Staging-tested: **2026-08-29, America/New_York**  
Owner: **John Panettiere**  
Coordination: **00 — PAL CONTROL ROOM** and **06 — PAL SECURITY & ACCESS**

Production activated: **2026-08-28 at approximately 8:39 PM America/New_York**

Authorized window ends: **approximately 10:39 PM America/New_York unless John renews it**

## Purpose and authorization boundary

This mode temporarily prevents PAL Safety Hub from accepting, returning, changing, uploading, or sending PAL application data while security work is performed. It is not active merely because these files exist.

Production activation requires John's explicit approval of the exact action below, including the affected users and public flows, expected window, rollback, and tested Git commit. Never substitute a normal Hosting-only maintenance page for the complete control.

## Exact proposed Production behavior

- All visitors to `pal.jobsiteresources.com`, `pal-safety-hub.web.app`, and their old application routes receive one static maintenance page.
- Employee, Foreman, Supervisor, Office, and Admin application access is unavailable. There is no application-level bypass.
- Public intake, orientation, ticket-signature, safety-signature, daily-access, upload, and other shared links are unavailable.
- Firestore and Storage deny all client reads and writes, including authenticated Admin clients.
- All active interactive HTTPS/Callable Functions have public invocation removed at the Cloud Run IAM layer. Their code and secrets are not replaced or exposed.
- `monitorIntegrationHealth` and `sendWeeklyCertWatch` schedules are paused. No maintenance deployment rotates or copies provider secrets.
- Firebase Authentication remains configured, but the maintenance page contains no sign-in code and authenticated clients cannot reach PAL data.
- Emergency administrative access is limited to John's authenticated Firebase/Google Cloud console access. No real record is opened or changed as part of activation or verification.

## Affected active interactive endpoints

The 2026-08-29 read-only inventory found these active services:

| Region | Cloud Run service / Firebase function |
|---|---|
| `us-central1` | `closedailyaccesssession` / `closeDailyAccessSession` |
| `us-central1` | `createdailyaccesssession` / `createDailyAccessSession` |
| `us-central1` | `finalizepublicintakeupload` / `finalizePublicIntakeUpload` |
| `us-central1` | `generatesafetydraft` / `generateSafetyDraft` |
| `us-central1` | `getintegrationhealth` / `getIntegrationHealth` |
| `us-central1` | `sendappemail` / `sendAppEmail` |
| `us-central1` | `sendapptext` / `sendAppText` |
| `us-central1` | `submitdailyaccess` / `submitDailyAccess` |
| `us-central1` | `updatedailyaccesssubmission` / `updateDailyAccessSubmission` |
| `us-central1` | `updatetextdeliverystatus` / `updateTextDeliveryStatus` |
| `us-east1` | `getmyemployeecenter` / `getMyEmployeeCenter` |
| `us-east1` | `submitemployeefieldform` / `submitEmployeeFieldForm` |

The separately listed `us-central1/submitEmployeeFieldForm` metadata was `UNKNOWN`; an unauthenticated POST returned **404**, so it is not treated as an active endpoint. It must be rechecked immediately before activation.

## Expected maintenance window and stop conditions

- Planned duration: **up to two hours**, beginning only after John confirms activation.
- Restore service earlier when the authorized maintenance objective and verification finish.
- Begin rollback immediately if any active endpoint is omitted, a rollback reference cannot be captured, the maintenance page is not live on both PAL domains, client data access is not denied, or the two-hour limit is reached without renewed authorization.

## Pre-activation evidence gate

1. Confirm the tested Package 3 commit and clean tracked working tree.
2. Re-fetch `origin/main` and record any divergence.
3. Recheck both Production Hosting domains, active Functions/regions, schedule job identifiers, and Cloud Run public-invoker bindings.
4. Record the current Production Hosting release/version.
5. Confirm deployed Firestore and Storage rules still exactly match `firestore.rules` and `storage.rules`. They matched after line-ending normalization on 2026-08-29.
6. Confirm `firebase.maintenance.production.json` targets only Hosting site `pal-safety-hub` and the deny-all rules.
7. Confirm rollback commands/configuration and John's authenticated console access are available.
8. Record John's exact Production authorization in this runbook/change log and notify **00 — PAL CONTROL ROOM**.

## Activation sequence

1. Publish the approved maintenance notice to PAL users outside the app if anyone may attempt access.
2. Deploy `firebase.maintenance.production.json` to Production for Hosting, Firestore rules, and Storage rules only.
3. Remove `allUsers` and `allAuthenticatedUsers` invoker access, if present, from every active interactive Cloud Run service in the table. Do not change service accounts, secrets, or code.
4. Pause the Cloud Scheduler jobs backing `monitorIntegrationHealth` and `sendWeeklyCertWatch`; record their exact job IDs and prior states.
5. Verify both PAL domains and representative old/public routes serve identical maintenance content and safe headers.
6. Verify anonymous and synthetic-style authenticated client requests cannot read/write Firestore or Storage. Do not use real PAL identities or records.
7. Verify every active interactive endpoint returns platform denial and that scheduled jobs are paused.

## Rollback sequence

1. Re-add only the exact invoker principals removed during activation to the same 12 services.
2. Resume only the two Scheduler jobs that were active before maintenance.
3. Redeploy the verified pre-maintenance `firestore.rules` and `storage.rules` from the recorded commit.
4. Redeploy normal Production Hosting from the recorded pre-maintenance commit/configuration, or restore its recorded Hosting release.
5. Verify normal Hosting content on both domains, authenticated API availability without reading real records, expected public denial/validation behavior, Function inventory/regions, and restored schedule states.
6. If rollback validation fails, keep the maintenance page visible, re-close any uncertain endpoint, and escalate through **00 — PAL CONTROL ROOM**.

## Staging and local evidence

- Static maintenance controls: **5 of 5 passed**.
- Maintenance Firestore/Storage emulator matrix: **6 of 6 passed** for anonymous, Employee, and Admin reads/writes.
- Maintenance Functions emulator: **12 of 12 active interactive endpoints returned HTTP 503**, `Cache-Control: no-store`, `Retry-After: 3600`, and a generic unavailable response.
- Staging activation: root, project/intake, arbitrary old-link, and Firebaseapp daily-access routes returned identical maintenance content with no-store, no-index, frame denial, and restrictive CSP headers.
- Live anonymous Staging Firestore read during maintenance: **403 denied**.
- Rollback rehearsal: normal Staging rules, closed Storage, Hosting application, synthetic banner, and registration repair were restored. The normal 10-test Staging authorization suite passed after rollback.
- Production impact during testing: **None**.

## Production activation evidence

- John explicitly approved the exact activation after the affected behavior, security purpose, two-hour limit, and rollback boundary were explained in **06 — PAL SECURITY & ACCESS**.
- Activation used tested commit `139d6df13e039d7b9d9c033339030c300b966ad4` on branch `codex/security-package-3-maintenance`; tracked files were clean and the five untracked synthetic QA fixtures were preserved.
- Firebase deployed only maintenance Hosting plus deny-all Firestore and Storage rules through `firebase.maintenance.production.json`; no Function code, secret, Authentication setting, account, or PAL record was changed.
- Both `https://pal.jobsiteresources.com/` and `https://pal-safety-hub.web.app/`, plus representative intake, daily-access, and old-link paths, returned the same 1,916-byte maintenance page with HTTP 200, `Cache-Control: no-store, max-age=0`, and `X-Frame-Options: DENY`.
- Anonymous synthetic probes returned **403** from Firestore and **403 Permission denied** from the Production Storage bucket. No real collection, document, object, or identity was used.
- Public `allUsers` Cloud Run Invoker access was removed from all 12 active interactive services listed above. Independent unauthenticated POSTs returned platform denial: ten endpoints returned **403** and the two east-region endpoints returned **401**. No request reached application validation after final verification.
- Exact Scheduler jobs `firebase-schedule-monitorIntegrationHealth-us-central1` and `firebase-schedule-sendWeeklyCertWatch-us-central1` were **Enabled** before activation and verified **Paused** afterward.
- The stale `us-central1/submitEmployeeFieldForm` entry remains outside the active inventory; its pre-activation endpoint returned 404.
- Final Production verification completed at approximately **8:49 PM America/New_York**. The maintenance window must be rolled back or explicitly renewed before its two-hour stop time.

## Production rollback evidence

- The 10:30 PM rollback safeguard did not execute, and the approved 10:39 PM stop time was missed. This control failure was identified by a live check at **12:14 AM America/New_York on 2026-08-29**; Production was still serving the maintenance page. No claim of timely rollback is made.
- Corrective rollback began immediately under the previously approved runbook. Only the exact `allUsers` Cloud Run Invoker bindings removed during activation were restored to the same 12 interactive services.
- Only `firebase-schedule-monitorIntegrationHealth-us-central1` and `firebase-schedule-sendWeeklyCertWatch-us-central1` were resumed. Both were verified **Enabled** with their original schedules and next-run times.
- Normal Hosting, Firestore rules, and Storage rules were deployed from the exact recorded pre-maintenance commit `4b2e54e214eebe7615a36ddf6b2c7e7e394199be` using an isolated detached worktree. No newer branch application files were substituted.
- At approximately **12:23 AM America/New_York**, both Production domains and `projects.html` returned normal `PAL Safety Hub` content rather than the maintenance page. All 12 Cloud Run services showed **Public access**; synthetic empty requests reached the expected application-level validation/authentication boundary. The signature-status endpoint returned its expected application-level 403 while its Cloud Run service remained verified Public.
- Anonymous arbitrary synthetic Firestore and Storage reads remained denied with 403 under the restored normal rules. No real PAL identity, record, document, or file was used.
- The missed deadline is a verified operational-control failure. Future time-bounded Production work must not rely on a suggested reminder as the rollback mechanism; an actively monitored execution task or earlier manual rollback checkpoint is required.

## User communication

Activation notice:

> PAL Safety Hub is temporarily unavailable for scheduled security maintenance. Please do not use existing intake, signature, daily-access, or upload links and do not submit employee or project information until PAL confirms service has resumed. Expected availability will be restored within two hours unless PAL issues an updated notice.

Restoration notice:

> PAL Safety Hub maintenance is complete and normal access has been restored. You may sign in and use current PAL links again. If a page was already open during maintenance, refresh it before continuing.
