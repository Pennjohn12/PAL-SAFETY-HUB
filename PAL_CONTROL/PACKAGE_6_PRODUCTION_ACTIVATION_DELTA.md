# Package 6 Remaining Production Activation Delta

Status: **Prepared for exact approval; not deployed**

Prepared: **2026-08-30, America/New_York**

Target: **`pal-safety-hub`**

Tested application commit: **`86449b355962437f51c353c88c972c5ea3e9d941`**

Accepted Production image: **`sha256:e0de7bbb029eb9d342bd56b9e215fab33d39f27eb3fe23f42728ed920cedd7cb`**

## Current fail-closed Production checkpoint

The Package 6 foundation and accepted image already exist. This delta does not repeat or re-authorize their creation. Production still serves Package 5, and new sensitive uploads remain private and locked.

- Hosting release: `sites/pal-safety-hub/releases/1787988514120000`; version `15e075bfbef3dad8`; released `2026-08-29T07:28:34.120Z`.
- Live Hosting SHA-256: `index.html` `458e83113123394d2a9eb5d31ff726c5807a7e2cf534dc2fe67ce244aa669c91`; `projects.html` `cb8be9d8cef4552aa8adc33b79115039476fd3ed3f25f0a0144eb9571406d7f6`; `assets/js/config/pal-firebase.js` `aa2650820ab9ebc5bb03262c0bd0d21fc864fdf1330ebf8ba029d09c3c5eaec5`; `manifest.json` `5639d91f12686f5084b845ec762bbe97bdd9e5573e9db552805822101740c809`; `sw.js` `617501221ed7c7827408f561bf7697dc7cd05659b8ecd47f45f33b4ee143a181`.
- Live canonical rules SHA-256: Firestore `d798204fd536fb2e986c5ab759410d7f44a87e9b392822b781c30b5a881234d1`; Storage `b3ccc2881d7c604a0d2a8307922ed4867fab5d5688376a9e047317fbebe6ae13`.
- Six Package 5 V2 public-intake services remain active on source hash `a97a14f4d47c9a11f21edd14a994a7424de50ab0`. Production has zero Package 6 functions.
- Existing Package 6 foundation: private scan-active `us-east1/malware-scanner` repository; the exact accepted Production-owned image above; four empty US-EAST1 buckets with uniform access and public-access prevention; three zero-key dedicated identities; approved narrow foundation IAM; Container Scanning retained only for the dedicated scanner repository. Both Production `gcf-artifacts` repositories remain explicitly scan-disabled.
- The scanner image is not deployed. There is no Package 6 scanner service, definition job, Eventarc trigger, retry/retention activation, callback invocation path, rules/client activation, real-data access, or legacy migration.

Immediately before mutation, re-export and hash this entire checkpoint: Hosting release/files, rules text, all Functions and service accounts/source hashes, Scheduler and Eventarc inventories, Cloud Run services/jobs, repository scan settings and accepted digest, API states, four bucket locations/access/IAM/object counts, project/resource IAM, and all three service-account key counts. Any unexplained difference stops activation.

## Remaining mutations only

### Runtime, jobs, triggers, and schedules

1. Deploy private `pal-prod-malware-scanner` in `us-east1` from only the accepted digest above: dedicated scanner identity, 1 CPU, 4 GiB, min 0, max 1, concurrency 1, no `allUsers`.
2. Create `pal-prod-cvd-update` from the same accepted digest: dedicated updater identity, 1 CPU, 1 GiB, one retry, 600-second timeout. Create its Scheduler at `0 */4 * * *`, initially PAUSED.
3. Create only the isolated-unscanned object-finalized Eventarc trigger, initially disabled or without a service-to-scanner invocation path.
4. Deploy the retry schedule every ten minutes, initially PAUSED.
5. Deploy the hourly retention schedule with `PAL_SENSITIVE_VAULT_RETENTION_MODE=disabled`. The absent/disabled code path returns before any Firestore or Storage query. It remains PAUSED during initial verification; enabling retention enforcement is not authorized.

### Remaining IAM

- Repository-scoped `roles/artifactregistry.reader` for `service-461653262208@serverless-robot-prod.iam.gserviceaccount.com` on `us-east1/malware-scanner`.
- Scanner identity: project `roles/logging.logWriter`, `roles/monitoring.metricWriter`, and `roles/eventarc.eventReceiver`; exact-bucket `roles/storage.objectAdmin` on unscanned/clean/quarantine; `roles/storage.objectViewer` on CVD; exact scanner-service `roles/run.invoker` only when Eventarc is enabled; exact two callback-service `roles/run.invoker` only after startup and application health gates pass.
- Vault identity: project `roles/datastore.user` and `roles/logging.logWriter`; self-scoped `roles/iam.serviceAccountTokenCreator`; exact Firebase bucket `roles/storage.objectUser`; isolated-unscanned `roles/storage.objectCreator` plus `roles/storage.objectViewer`; exact retry and retention service `roles/run.invoker` for their Scheduler targets.
- Updater identity: project `roles/logging.logWriter`; CVD-bucket `roles/storage.objectAdmin`; exact definition-job `roles/run.invoker`.
- Storage service agent `service-461653262208@gs-project-accounts.iam.gserviceaccount.com`: project `roles/pubsub.publisher` only if verified absent and required for the one Eventarc trigger.
- Preserve only Google-managed Eventarc and Scheduler service-agent roles. No public invoker, custom broad role, credential key, clean/quarantine viewer for the vault identity, or broad Firebase-bucket scanner access is authorized.

Every before/after IAM policy is captured. An extra principal, broader role, wrong resource, or nonzero user-managed key stops and rolls back.

### Application, rules, and Hosting

Focus-deploy from exact commit `86449b355962437f51c353c88c972c5ea3e9d941` only:

1. `finalizePublicIntakeUploadV2`
2. `getSensitiveIntakeVaultV1`
3. `requestIntakeCertificationDownloadV1`
4. `requestSensitiveIntakeDownloadV1`
5. `approveSensitiveIntakeDownloadV1`
6. `listSensitiveVaultApprovalsV1`
7. `requestSensitiveFalsePositiveReviewV1`
8. `recordSensitiveFalsePositiveRescanV1`
9. `approveSensitiveFalsePositiveReviewV1`
10. `recordInitialScanResultV1`
11. `retryPendingInitialScansV1`
12. `enforceSensitiveVaultRetentionV1`

Deploy only the tested Firestore/Storage rules and tested Hosting client for protected Office release/status and unchanged simple intake behavior. Hosting must exclude backend, scanner, governance, and source files. Production non-secret configuration uses the named Production identities/bucket and `PAL_SENSITIVE_VAULT_RETENTION_MODE=disabled`.

## Phased activation

### Phase 1 — startup without traffic or data access

- Deploy the exact scanner digest with callbacks absent, Eventarc invocation absent, retry PAUSED, definition schedule PAUSED, and retention PAUSED/disabled.
- Verify exact digest/config/identity/limits, healthy startup, fresh definitions, private anonymous 403, zero unexpected requests, no active instance after idle scale-down, and no real-data query.
- Deploy the focused Functions/rules/Hosting. Verify callables deny anonymous requests with 401, callbacks deny anonymous requests with 403, backend/scanner source paths return 404, both Production domains remain healthy, and the disabled retention action performs zero data dependency calls.
- Any mismatch triggers rollback before an invocation path is added.

### Phase 2 — narrow paths and synthetic regression

- Add scanner-only Invoker to the two private callbacks and the exact Eventarc-to-scanner path. Enable the definition update only after a direct definition-health run succeeds. Keep retry PAUSED until one direct exact-envelope/callback flow passes.
- Use only unmistakably named temporary synthetic accounts, records, and harmless fixtures. Do not list, query, open, or alter real PAL records or files.
- Verify: clean certification upload/scan/purpose-bound exact-byte Office release; clean payroll/identity upload/scan/entitlement/different-person approval/exact-byte five-minute release; verified encrypted PDF to locked manual review with download denial; callback path/generation/size/type/SHA mismatch denial; anonymous and wrong-principal denial; duplicate callback idempotency and conflicting terminal denial; forced queue failure followed by retry recovery; one-time approvals; tamper-evident linked/redacted audit; simple pending/available/review UI states; source 404; rules denials; and no retention query/delete.
- Enable retry only after the direct path passes. Remove temporary synthetic users, records, and objects; retain only clearly labeled append-only synthetic audit evidence required for verification. Reconcile all created-object/document/user counts.

## Cost boundary

No new image build, copy, or Artifact Analysis scan is included. Only low-volume usage charges for the bounded scanner, Functions, Storage, Eventarc, Scheduler, logging, and synthetic checks are expected. Incremental Package 6 Production usage must remain below the existing `$5` stop threshold. At or before `$5`, or on unexplained spend, pause all schedules, disable Eventarc, remove callback and scanner invocation paths, and leave files locked. Billing is reviewed after 24, 48, and 72 hours for delayed charges.

## Compatibility and data limits

Employees, foremen, and supervisors keep the same upload steps; routing and scanning are hidden backend protections. Office users receive simple statuses and guarded downloads. Existing/legacy objects are not enumerated, migrated, scanned, rewritten, released, or deleted. In-progress old uploads remain locked unless a later metadata-first migration is separately approved. No real PAL data is used for activation testing.

## Rollback

### Roll back to the current partial Package 6 foundation

- Pause retry, definition, and retention schedules; confirm retention stayed disabled.
- Disable/delete the new Eventarc trigger and remove both callback Invoker grants and every service-to-scanner invocation path.
- Leave the private min-0 scanner with no invocation path so it naturally scales to zero; confirm zero active instances. Retain the accepted image, repository, empty foundation buckets, identities, and already approved foundation IAM as evidence.
- Roll back only the new Functions/rules/Hosting mutations to the captured pre-mutation Package 5 state. Leave every queued/new file private and locked.

### Fully reverse application activation to Package 5

- Restore tested Package 5 source commit `7cbe1c8e866aebf8fd7b0c61bb55b22ec710764c`, governance activation commit `bf3c393e61ef53f55c1d173643a7f9192732dbc3`, Hosting version `15e075bfbef3dad8`, the captured live Firestore/Storage rules, and the Package 5 finalizer/service configuration.
- Remove/disable only Package 6 Functions after verifying all Package 5 endpoints and both domains. Remove operational Package 6 runtime IAM only after the finalizer is restored. Do not reopen anonymous uploads, delete real objects, or weaken Package 5 controls.
- Rollback is complete only after Hosting hashes, rule hashes, Package 5 function inventory/source hashes, callback 403, schedules, Eventarc, IAM, object privacy, and zero invocation paths match the checkpoint or a separately documented verified state.

## Exact authorization boundary

This document is preparation only and makes no Production change. Activation requires John's explicit approval of this exact delta commit after independent Control Room review. Approval covers only the remaining mutations and synthetic verification above. It does not authorize real-data access, legacy migration, retention enforcement/deletion, credentials, another image/build/scan, public invocation, broader IAM, or spend beyond the `$5` stop.
