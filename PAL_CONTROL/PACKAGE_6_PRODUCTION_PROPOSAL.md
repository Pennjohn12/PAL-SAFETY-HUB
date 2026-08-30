# Package 6 Exact Production Proposal

Status: **Prepared for review; not authorized or deployed**
Prepared: **2026-08-30, America/New_York**
Target project: **`pal-safety-hub`**
Source branch: **`codex/security-package-6-sensitive-vault`**

## Outcome

Package 6 will make new certification and payroll/identity uploads follow the already tested fail-closed lifecycle: private upload, exact-generation hashing, automatic malware scan, locked manual review for non-clean results, purpose-bound Office access for clean certifications, separate payroll entitlement, different-person approval for Social Security-card and driver-license downloads, five-minute generation-bound links, tamper-evident audit, retention/legal-hold enforcement, and internal entitled-reviewer notifications.

Employees, foremen, and supervisors do not move files between folders or learn a new security workflow. They upload in the existing intake screen. Office users see simple pending, available, or needs-review states. Security routing remains server-side.

## Verified Production baseline

- Production contains no Package 6 vault Functions or scanner runtime.
- Production Artifact Registry contains Cloud Functions-managed `gcf-artifacts` repositories in `us-central1` and `us-east1`; no dedicated malware-scanner repository exists.
- The Production Container Scanning API is currently disabled. The `us-central1/gcf-artifacts` repository reports `SCANNING_DISABLED` because that API is not enabled; `us-east1/gcf-artifacts` is empty.
- Current Production Package 5 uploads remain private and locked pending Package 6. Existing/legacy files are not silently migrated, scanned, deleted, or made downloadable.

## Exact image promotion choice

Production will **not** pull its runtime image from Staging. PAL will create a Production-owned private `us-east1/malware-scanner` Artifact Registry repository and copy only accepted Staging digest:

`sha256:e0de7bbb029eb9d342bd56b9e215fab33d39f27eb3fe23f42728ed920cedd7cb`

The promotion uses the preinstalled Docker client and signed-in PAL administrator without a downloaded credential key or cross-project runtime grant. The exact mechanism is:

```text
gcloud auth configure-docker us-east1-docker.pkg.dev --quiet
docker pull us-east1-docker.pkg.dev/pal-safety-hub-staging/malware-scanner/malware-scanner@sha256:e0de7bbb029eb9d342bd56b9e215fab33d39f27eb3fe23f42728ed920cedd7cb
docker tag <exact-source-reference> us-east1-docker.pkg.dev/pal-safety-hub/malware-scanner/malware-scanner:pal-package6-prod-1
docker push us-east1-docker.pkg.dev/pal-safety-hub/malware-scanner/malware-scanner:pal-package6-prod-1
gcloud artifacts docker images describe us-east1-docker.pkg.dev/pal-safety-hub/malware-scanner/malware-scanner:pal-package6-prod-1 --format="value(image_summary.digest)"
```

The source reference must be inspected locally before tagging, and the destination command must return exactly `sha256:e0de7bbb029eb9d342bd56b9e215fab33d39f27eb3fe23f42728ed920cedd7cb`. Cloud Run deploys the destination by digest, never by mutable tag. No rebuild is allowed; a digest mismatch stops the action and the mismatched image is not deployed or rescanned again without a new decision.

Before enabling the Production Container Scanning API, both Production `gcf-artifacts` repositories must be explicitly set to repository-level scanning disabled. Then the dedicated Production malware-scanner repository is set to allow scanning and the project API is enabled. Pushing the new digest into that scan-active repository is expected to create one automatic `$0.26` scan. Digest-specific Artifact Analysis must reach finished-success and explicitly show zero vulnerability occurrences and zero malicious-package occurrences. A missing, pending, timed-out, or zero-result-without-completion response blocks runtime deployment just like a finding. The accepted gate remains: no CRITICAL/HIGH, no fix-available MEDIUM without a documented exception, and no malicious-package finding.

## Exact Production resources

All resources are Production-only, keyless, private, and located in `us-east1` unless a Function is explicitly fixed to `us-central1` by the existing application code.

- Private Artifact Registry repository: `malware-scanner`.
- Four uniform-bucket-level-access buckets with public-access prevention:
  - `pal-safety-hub-clamav-unscanned`
  - `pal-safety-hub-clamav-clean`
  - `pal-safety-hub-clamav-quarantine`
  - `pal-safety-hub-clamav-cvd`
- Dedicated zero-key scanner identity: `pal-prod-malware-scanner@pal-safety-hub.iam.gserviceaccount.com`.
- Dedicated zero-key vault/authorized-download identity: `pal-prod-vault-download@pal-safety-hub.iam.gserviceaccount.com`.
- Dedicated zero-key definition updater/Scheduler identity: `pal-prod-clamav-updater@pal-safety-hub.iam.gserviceaccount.com`.
- Private Cloud Run scanner: `pal-prod-malware-scanner`, exactly 1 CPU, 4 GiB, min 0, max 1, concurrency 1, accepted digest only, no `allUsers` binding.
- One isolated-unscanned finalize Eventarc trigger.
- Definition mirror/update job and schedule, with signature freshness monitoring and fail-closed stale-definition behavior.
- Initial-scan retry schedule every ten minutes, initially PAUSED until direct smoke verification succeeds.
- Sensitive-vault retention schedule every sixty minutes.

The existing Firebase Storage bucket keeps its current access mode and public protections. No broad scanner access is granted to it. `finalizePublicIntakeUploadV2` is moved from the shared default runtime to the dedicated vault identity so Package 6 does not rely on the Firebase Admin SDK service account's broad Storage role.

## Exact IAM plan

| Principal | Resource scope | Before | Exact grant | Purpose | Persistence / rollback |
|---|---|---|---|---|---|
| Signed-in PAL administrator | Staging `malware-scanner` source repo; Production destination repo | Existing owner-equivalent access; no new grant | No new IAM | One-time exact-digest Docker pull/tag/push | Existing access unchanged |
| `service-461653262208@serverless-robot-prod.iam.gserviceaccount.com` | Production `malware-scanner` repo | Repo absent | `roles/artifactregistry.reader` only if same-project automatic service-agent access is insufficient | Pull accepted digest for Cloud Run | Persistent while scanner exists; remove on scanner rollback if explicitly granted |
| `pal-prod-vault-download@pal-safety-hub.iam.gserviceaccount.com` | Project | Identity absent | `roles/datastore.user`, `roles/logging.logWriter` | Server-only records/transactions and bounded logs | Persistent; remove on Package 6 rollback |
| Same vault identity | Itself | Identity absent | `roles/iam.serviceAccountTokenCreator` on itself | Keyless V4 signed URLs | Persistent; remove on rollback |
| Same vault identity | Existing Production Firebase Storage bucket | No dedicated grant | `roles/storage.objectViewer` | Verify/hash exact source generation and authorize exact clean download | Persistent operational grant; remove on rollback |
| Same vault identity | `pal-safety-hub-clamav-unscanned` | Bucket absent | `roles/storage.objectCreator` and `roles/storage.objectViewer` | Create and re-read authoritative scan envelope/generation | **Persistent operational grant during activation**, not temporary; remove on rollback |
| `pal-prod-malware-scanner@pal-safety-hub.iam.gserviceaccount.com` | Project | Identity absent | `roles/logging.logWriter`, `roles/monitoring.metricWriter`, `roles/eventarc.eventReceiver` | Private scanner telemetry and finalized-object trigger receipt | Persistent; remove on rollback |
| Same scanner identity | Unscanned, clean, and quarantine buckets | Buckets absent | `roles/storage.objectAdmin` on each exact bucket | Read/remove input and write/move operational evidence | Persistent; remove on rollback |
| Same scanner identity | CVD bucket | Bucket absent | `roles/storage.objectViewer` | Read antivirus definitions only | Persistent; remove on rollback |
| Same scanner identity | Exact scanner Cloud Run service | Service absent | `roles/run.invoker` | Eventarc delivery to private scanner | Persistent while trigger active; remove/disable trigger on rollback |
| Same scanner identity | Exact two private callback services | Services absent | `roles/run.invoker` | Authenticated false-positive and initial-result evidence | Added only after health gate; remove first on rollback |
| `pal-prod-clamav-updater@pal-safety-hub.iam.gserviceaccount.com` | Project | Identity absent | `roles/logging.logWriter` | Definition-update logs | Persistent; remove on rollback |
| Same updater identity | CVD bucket | Bucket absent | `roles/storage.objectAdmin` | Replace definition objects only | Persistent while update job retained; remove on rollback |
| Same updater identity | Exact definition-update Cloud Run job | Job absent | `roles/run.invoker` | Scheduler invocation | Persistent; pause schedule/remove grant on rollback |
| `service-461653262208@gs-project-accounts.iam.gserviceaccount.com` | Project Pub/Sub | Existing Google-managed Storage service agent | `roles/pubsub.publisher` only if Eventarc creation verifies it missing | Publish finalized-object events | Persistent only while trigger exists; remove explicit grant on rollback |
| `service-461653262208@gcp-sa-eventarc.iam.gserviceaccount.com` | Project | Existing/created Google-managed agent | Google-managed `roles/eventarc.serviceAgent`; no custom broad role | Eventarc control plane | Preserve Google-managed role; delete/disable only PAL trigger on rollback |
| Google Scheduler service agent plus exact vault/updater OIDC identities | Exact retry, retention, and definition targets | Targets absent | `roles/run.invoker` only on each exact generated service/job | Scheduled private invocation | Persistent while schedule exists; pause schedules and remove explicit target grants on rollback |

Before mutation, export project/repository/bucket/service IAM, service accounts/key counts, Functions and revisions, Scheduler jobs/states, Eventarc triggers, Hosting versions, Firestore/Storage rules, and relevant API states. After each grant, compare the policy to this table; any extra principal or broader role stops the release.

## Exact application deployment

Deploy the tested `functions-public-intake` source and only these Package 6 affected actions in `us-central1`:

1. `finalizePublicIntakeUploadV2` — update existing Package 5 finalization to enqueue the exact object generation.
2. `getSensitiveIntakeVaultV1`.
3. `requestIntakeCertificationDownloadV1`.
4. `requestSensitiveIntakeDownloadV1`.
5. `approveSensitiveIntakeDownloadV1`.
6. `listSensitiveVaultApprovalsV1`.
7. `requestSensitiveFalsePositiveReviewV1`.
8. `recordSensitiveFalsePositiveRescanV1` — private callback.
9. `approveSensitiveFalsePositiveReviewV1`.
10. `recordInitialScanResultV1` — private callback.
11. `retryPendingInitialScansV1` — scheduled, initially PAUSED.
12. `enforceSensitiveVaultRetentionV1` — scheduled with `PAL_SENSITIVE_VAULT_RETENTION_MODE=disabled`; it returns before any Production record query or deletion.

Deploy the tested Production Firestore rules that deny browser access to server-only vault, approval, audit-event, and audit-head collections. Keep Storage browser access denied. Deploy only the tested Production Hosting client files needed for the protected Office queue/status/download interface and public upload status wording. Hosting must continue excluding `functions*/**`, `scanner/**`, governance files, and backend source.

Production configuration will contain only non-secret identifiers: Production vault service-account email and isolated scanner bucket name. No password, API key, private key, or secret is created, stored, copied, or rotated.

## Release sequence and stop conditions

1. Reverify exact Git commit, clean tracked worktree, Production Hosting/functions/rules baseline, billing settings, and zero real-data test use.
2. Explicitly disable repository scanning on both Production `gcf-artifacts` repositories.
3. Create the Production scanner repository and isolated buckets; verify region, UBLA, public-access prevention, empty contents, and no public IAM.
4. Promote the accepted digest without rebuild, enable only dedicated-repository scanning, incur one expected `$0.26` scan, and stop on any provenance or finding mismatch.
5. Create the three zero-key identities and apply only the IAM table above; inventory every before/after binding and verify zero user-managed keys.
6. Deploy the private scanner at min 0/max 1/concurrency 1 with callback IAM absent and retry PAUSED. Verify exact digest, startup/health, private anonymous 403, and no unexpected traffic.
7. Deploy focused Functions/rules/Hosting. Verify callback anonymous 403, callable anonymous 401, backend-source probes 404, and normal Production domains/routes.
8. Add scanner-only callback Invoker. The vault identity's isolated-unscanned viewer/objectCreator access is an operational Production grant for authoritative generation/metadata handling, not a temporary test grant; run only unmistakably synthetic PAL fixtures and temporary synthetic accounts.
9. Require the full certification clean release, identity clean/different-person release, encrypted/manual-review denial, callback mismatch denial, retry recovery/idempotency, audit/redaction, disabled-retention no-access/no-delete evidence, UI status, and cleanup matrix.
10. Enable retry only after a direct exact-envelope/callback path passes. Retention remains explicitly disabled; enabling it would access and potentially delete Production records and therefore requires a later exact authorization, legal/HR confirmation, and non-destructive inventory plan. No real deletion is authorized by the initial deployment.
11. Remove every temporary account/object/document; preserve required append-only synthetic audit evidence separately labeled synthetic.

Stop and roll back if any digest, IAM, anonymous-access, scanner-result, audit, cleanup, budget, or Production-route check differs from this proposal. No test may use or enumerate real PAL employee or onboarding records.

## User and compatibility impact

- New uploads remain in the same intake screens; security processing is automatic.
- Clean certification files become purpose-bound Office downloads.
- Clean payroll/identity files require the separate entitled-reviewer boundary; Social Security-card and driver-license downloads require a different Admin.
- Pending, failed, timeout, unsupported, encrypted, or suspicious files remain locked. Users see a simple waiting/review message, not backend details.
- Existing files remain legacy/unscanned and unavailable through the new clean-release path. No bulk migration or deletion is included.
- In-progress Package 5 uploads already recorded as pending remain fail closed. A separate metadata-first migration/requeue plan is required before any old object is scanned.

## Cost and monitoring

- Known existing Staging charge: `$10.40`; unchanged by Production work.
- Expected one-time Production Artifact Analysis scan: approximately `$0.26` for the one promoted digest.
- Function-container automatic scanning: disabled on both Production `gcf-artifacts` repositories, matching approved Staging Option A. This saves unpredictable per-deployment scan charges but loses Google's automatic Function-container vulnerability signal. Compensating controls are production dependency audits, syntax checks, 99 PAL regressions, focused source review, exact lockfile deployment, and post-deploy behavior checks.
- Scanner runtime: scale to zero, max one instance. Low-volume recurring compute/storage/logging/scheduler cost is usage-dependent; the prior isolated measurement was small, but it is not a guaranteed cap.
- Create a dedicated `$5` Production Package 6 budget alert/monitoring threshold before runtime activation. A budget alert is not a hard cap. If incremental Package 6 estimated/posting cost reaches `$5` before PAL reviews it, pause retry, definition-update, and retention schedules; disable the Eventarc trigger; remove both callback Invoker grants; route the new scanner service to zero/no serving traffic; and leave every file locked. A new Production scanner has no prior revision, so rollback never refers to a nonexistent revision.
- Review Billing by SKU after 24, 48, and 72 hours for delayed image-scan, Cloud Run, Storage, Scheduler, Eventarc, Logging, and Function charges. No additional image push is allowed without a new action-time cost approval.

## Rollback

Rollback is fail closed and does not delete real objects:

- Pause retry, definition-update, and retention schedules; verify retention mode remained disabled and no Production record was inspected or deleted.
- Disable the new Eventarc trigger, remove both scanner callback Invoker grants, and route the new scanner service to zero/no serving traffic. Leave queued files locked.
- Remove the operational isolated-unscanned viewer/objectCreator grant from the vault identity only as part of full rollback after finalizer rollback; it is not temporary during normal activation.
- Route scanner traffic to zero and retain the accepted image/repository for evidence; do not delete it during emergency rollback.
- Restore Hosting version `15e075bfbef3dad8` and the pre-Package-6 client/rules/finalizer from tested Package 5 source commit `7cbe1c8e866aebf8fd7b0c61bb55b22ec710764c` (governance activation commit `bf3c393e61ef53f55c1d173643a7f9192732dbc3`). Restore the exact `firestore.rules`, `storage.rules`, and `finalizePublicIntakeUploadV2` blobs from that tested commit; do not substitute `origin/main`.
- Remove or disable only newly deployed Package 6 Functions after verifying Package 5 endpoints remain healthy.
- Leave all new/pending files private and locked. Do not reopen anonymous direct uploads and do not downgrade Package 5 authorization.
- Verify both Production domains, representative app routes, all Package 5 Functions, Firestore/Storage denials, callback 403, Scheduler state, IAM, and audit preservation.
- Repository scanning rollback, if stronger Function-image coverage is later chosen: apply `--allow-vulnerability-scanning` to Production `gcf-artifacts` in both `us-central1` and `us-east1`, verify `SCANNING_ACTIVE`, and accept future per-digest charges.

The pre-mutation checkpoint must record full commit hashes; Hosting release/version; every Production Function generation/runtime/service account/revision; Firestore and Storage rule text/hash; all relevant Cloud Run services/jobs; Eventarc triggers; Scheduler states; repository scan policies/API state; bucket locations/access prevention/IAM; service-account key counts; and both Production domains/routes. Rollback is not considered complete until this entire inventory is restored or an explicitly documented new state is independently verified.

## Approval boundary

This proposal does not authorize or perform any Production change. The exact tested commit will be recorded after this governance document and the new fail-safe retention gate pass PAL tests and independent Control Room review. John must then explicitly approve this exact Production deployment, including the one expected `$0.26` scan, new Production resources/identities/IAM, Function/rules/Hosting changes, synthetic Production smoke test, retention disabled/no real-data access, no legacy migration, accepted lack of Function-container automatic scanning, `$5` stop threshold, and fail-closed rollback.
