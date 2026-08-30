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

The promotion must use the signed-in PAL administrator without a downloaded credential key. Source and destination digests must match byte-for-byte. A unique Production tag may point to the digest, but Cloud Run must deploy by digest, never by mutable tag. No rebuild is allowed in this action; a digest mismatch stops deployment.

Before enabling the Production Container Scanning API, both Production `gcf-artifacts` repositories must be explicitly set to repository-level scanning disabled. Then the dedicated Production malware-scanner repository is set to allow scanning and the project API is enabled. The promoted digest must pass the same gate: no CRITICAL/HIGH, no fix-available MEDIUM without a documented exception, and no malicious-package finding. Any finding stops the deployment.

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
- Private Cloud Run scanner: `pal-prod-malware-scanner`, exactly 1 CPU, 4 GiB, min 0, max 1, concurrency 1, accepted digest only, no `allUsers` binding.
- One isolated-unscanned finalize Eventarc trigger.
- Definition mirror/update job and schedule, with signature freshness monitoring and fail-closed stale-definition behavior.
- Initial-scan retry schedule every ten minutes, initially PAUSED until direct smoke verification succeeds.
- Sensitive-vault retention schedule every sixty minutes.

The existing Firebase Storage bucket keeps its current access mode and public protections. No broad scanner access is granted to it. The vault runtime receives only the exact Firestore/logging, Firebase-object verification/signing, isolated-unscanned object creation/metadata, and self-signing permissions required by tested code. The scanner receives only exact isolated-bucket object access, logs/metrics, and private callback invocation. The callback grants Cloud Run Invoker only to the exact scanner identity.

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
5. Create zero-key identities and exact least-privilege IAM; inventory every before/after binding.
6. Deploy the private scanner at min 0/max 1/concurrency 1 with callback IAM absent and retry PAUSED. Verify exact digest, startup/health, private anonymous 403, and no unexpected traffic.
7. Deploy focused Functions/rules/Hosting. Verify callback anonymous 403, callable anonymous 401, backend-source probes 404, and normal Production domains/routes.
8. Add scanner-only callback Invoker and exact isolated-unscanned viewer; run only unmistakably synthetic PAL fixtures and temporary synthetic accounts.
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
- Create a dedicated `$5` Production Package 6 budget alert/monitoring threshold before runtime activation. A budget alert is not a hard cap. If incremental Package 6 estimated/posting cost reaches `$5` before PAL reviews it, pause retry/definition schedules and scale scanner traffic to the rollback revision while leaving files locked.
- Review Billing by SKU after 24, 48, and 72 hours for delayed image-scan, Cloud Run, Storage, Scheduler, Eventarc, Logging, and Function charges. No additional image push is allowed without a new action-time cost approval.

## Rollback

Rollback is fail closed and does not delete real objects:

- Pause retry, definition-update, and retention schedules; verify retention mode remained disabled and no Production record was inspected or deleted.
- Remove scanner Invoker on both private callbacks and remove temporary isolated-unscanned viewer access.
- Route scanner traffic to zero and retain the accepted image/repository for evidence; do not delete it during emergency rollback.
- Restore the pre-Package-6 Hosting client, Firestore rules, and `finalizePublicIntakeUploadV2` from the recorded Package 5 Production checkpoint.
- Remove or disable only newly deployed Package 6 Functions after verifying Package 5 endpoints remain healthy.
- Leave all new/pending files private and locked. Do not reopen anonymous direct uploads and do not downgrade Package 5 authorization.
- Verify both Production domains, representative app routes, all Package 5 Functions, Firestore/Storage denials, callback 403, Scheduler state, IAM, and audit preservation.
- Repository scanning rollback, if stronger Function-image coverage is later chosen: apply `--allow-vulnerability-scanning` to Production `gcf-artifacts` in both `us-central1` and `us-east1`, verify `SCANNING_ACTIVE`, and accept future per-digest charges.

## Approval boundary

This proposal does not authorize or perform any Production change. The exact tested commit will be recorded after this governance document and the new fail-safe retention gate pass PAL tests and independent Control Room review. John must then explicitly approve this exact Production deployment, including the one expected `$0.26` scan, new Production resources/identities/IAM, Function/rules/Hosting changes, synthetic Production smoke test, retention disabled/no real-data access, no legacy migration, accepted lack of Function-container automatic scanning, `$5` stop threshold, and fail-closed rollback.
