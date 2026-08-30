# PAL Change and Deployment Log

Newest entries go first. Git history remains the detailed code record.

## 2026-08-30 — Package 6 exact Production proposal prepared; Production remains closed

- Added `PACKAGE_6_PRODUCTION_PROPOSAL.md` with the exact image-promotion choice, Production resources, identities, repository scanning policy, twelve affected Function actions, rules/Hosting scope, synthetic-only release sequence, user impact, cost monitoring, stop conditions, and fail-closed rollback.
- The proposal chooses a Production-owned copy of accepted digest `sha256:e0de7bbb...` instead of a permanent cross-project runtime pull. Both Production Function repositories remain scan-disabled; only the dedicated Production scanner repository becomes scan-active. Expected direct image scan is one `$0.26` charge.
- Read-only Production inventory found two existing `gcf-artifacts` repositories (`us-central1` and `us-east1`), no malware-scanner repository, and Container Scanning API disabled. No Production mutation, credential, real-data access, deployment, or cost action occurred.
- This is proposal-only. The exact tested commit and independent review must be recorded before John is asked to approve the specific Production boundary.
- Added a code-level fail-safe retention mode. Unless `PAL_SENSITIVE_VAULT_RETENTION_MODE` is exactly `enforce`, the scheduled worker returns zero inspected/deleted before querying Production records. Staging retains its separately tested `enforce` configuration; the proposal fixes initial Production mode at `disabled`. Enabling Production deletion remains a later exact real-data/retention approval and is not bundled into Package 6 activation.
- Control Room review corrections now make `disabled` the code default, add the exact non-secret Production environment file, behaviorally prove absent/disabled mode never touches injected data dependencies, move finalization to the dedicated vault identity, enumerate every planned IAM principal/role/resource/rollback, specify no-rebuild Docker digest promotion and no-result scan denial, replace the nonexistent rollback-revision wording with zero-traffic/trigger/callback shutdown, and bind rollback to Package 5 commit `7cbe1c8e...` plus Hosting version `15e075bfbef3dad8`. Production remains untouched.

## 2026-08-30 — Option A repository-scoped scan-cost control activated in Staging

- John approved keeping automatic vulnerability scanning only for PAL's dedicated malware-scanner repository and disabling it on the two Staging Cloud Functions-managed repositories, acknowledging the loss of automatic Function-container vulnerability visibility.
- Staging `gcf-artifacts` in `us-central1` and `us-east1` now independently report `enablementConfig: DISABLED`, `enablementState: SCANNING_DISABLED`, and reason `Vulnerability scanning is disabled.` Dedicated `us-east1/malware-scanner` reports `enablementConfig: INHERITED` and `enablementState: SCANNING_ACTIVE`.
- The project scanning API remains enabled. Future new scanner digests remain paid and approval-gated; ordinary Function images should no longer be automatically billed for scanning. Existing `$10.40` posted charges are unchanged, and billing lag remains subject to later review.
- No image/repository deletion, IAM, Function, Hosting, scanner runtime, credential, Production, or real-data action occurred. Rollback is the exact repository-level `--allow-vulnerability-scanning` update on both `gcf-artifacts` locations followed by active-state verification.

## 2026-08-30 — Package 6 posted billing exposed project-wide scan-cost variance

- Read-only Billing Report review for Staging, Aug. 1–29, verified 40 units / `$10.40` under `Container Images Scanned` (SKU `BEA5-E1D1-4659`), with `$0.00` SKU savings. Cloud Run CPU/memory usage was offset to `$0.00` subtotal and other visible supporting-service rows were `$0.00`.
- Only nine scanner-candidate scans / `$2.34` were explicitly approved. The project therefore posted 31 scan units / `$8.06` above that expectation. Current read-only inventory contains 10 dedicated scanner digests and 36 Cloud Functions-managed digests; the 46-current-digest versus 40-posted-unit difference prevents exact per-digest billing attribution, but confirms that automatic scanning was not confined to the dedicated scanner repository.
- This is a verified cost-control/governance failure, not a confidentiality failure, malware bypass, or Production-data event. Production is unchanged. Staging remains rolled back, temporary callback/viewer access absent, and retry PAUSED.
- All discretionary Staging builds, deployments, scans, and runtime tests are stopped. Deleting images or changing automatic-scanning policy is a separate material action and was not performed. John must approve an exact repository-scoped or separate-project cost-control design before Package 6 resumes paid activity or prepares a Production proposal.

## 2026-08-30 — Package 6 initial-scan retry recovery passed in isolated Staging

- A temporary synthetic-only harness with local/Staging SHA-256 `41010b5feee6dea370fdb60c32048b9cf0e8175e04c9af31ea2dacb1d40dcde0` created one certification object and matching server-side record/authorization in locked `pending` / `scan-queue-failed` state. It did not create a browser user, credential, or real PAL record.
- Google Scheduler correctly refused a forced run while the retry job was PAUSED. That attempt created no trust and the harness cleaned its synthetic record/object. The job was then briefly resumed only in Staging under the already approved recovery boundary, forced for the test, and paused immediately after the completed run.
- Run `PAL-SYNTHETIC-RETRY-0ce7fb3a93fc` passed: the worker copied the exact bound source generation, the accepted private scanner returned clean, authorization advanced from locked pending to `scan-clean`, the record retained `downloadable: false`, and the trusted evidence retained the original SHA-256. Exactly one correlated scan-result audit event was recorded.
- A second forced worker execution left the same terminal state and audit-event ID unchanged, with the correlated audit count still exactly one. This proves terminal retry idempotency and prevents duplicate trust/audit creation.
- The harness cleaned the named authorization, intake, Firebase object, and any matching isolated unscanned/clean/quarantine object. Rollback restored 100% scanner traffic to `pal-staging-malware-scanner-00010-p6g`, callback IAM is empty, temporary objectViewer is removed while objectCreator remains, retry is `PAUSED`, and temporary Cloud Shell/local harness copies were removed. Production and real PAL data were unchanged.
- No image build or Artifact Analysis scan occurred; the direct ledger remains nine scans / `$2.34`. Only short scale-to-zero Staging runtime, Scheduler, Function, Storage, Eventarc, and logging usage was added.

## 2026-08-30 — Package 6 scanner-detection conclusion corrected; encrypted control passed

- The detection-blocker conclusion recorded in the preceding checkpoint is retracted. The purported corrected antivirus fixture was actually 69 bytes because it contained an extra `)`, and it was prefixed by a PDF header. It therefore did not satisfy the official exact-68-byte, start-of-file EICAR condition and could not establish a scanner failure. The unsupported result remains preserved below as history, but it is not credited as a vulnerability or Production blocker.
- A replacement 912-byte, password-encrypted, one-page synthetic PDF was created locally. Independent `pypdf` checks proved it was encrypted, unreadable without its synthetic password, readable after decryption, and structurally one page. Its local SHA-256 `ecefc9834eb1772c43ce5f5302386a860b90c353e531bb4d7c3e4a0d72bd4a8f` exactly matched the uploaded isolated-Staging object before testing.
- John approved continuation of the same isolated Staging regression. Accepted digest `sha256:e0de7bbb029eb9d342bd56b9e215fab33d39f27eb3fe23f42728ed920cedd7cb` temporarily served as private revision `pal-staging-malware-scanner-00015-qvl`; only scanner-to-callback Invoker and exact isolated-unscanned objectViewer were restored, and retry remained PAUSED.
- The first retry command again selected the first web configuration block and therefore supplied Production-audience tokens to Staging. Firebase rejected them with `401`; cleanup removed five documents, one object, and three temporary users. The selector was corrected to the explicitly named Staging configuration before protected testing continued.
- Final synthetic run `PAL-SYNTHETIC-P6-40f06bd9fc57` passed. Certification reached `scan-clean` and a purpose-bound exact 73-byte download; payroll/identity clean release enforced entitlement, requester self-approval denial, different-Admin approval, and an exact 73-byte download. The encrypted PDF reached `scan-manual-review`, remained non-downloadable, and produced ClamAV evidence `Heuristics.Encrypted.PDF FOUND` in 84 ms with encrypted-document alerting enabled. Anonymous callback access returned `403`; six correlated audit events passed redaction checks; Staging Hosting returned `200` and a backend-source probe returned `404`.
- The harness removed nine temporary documents, three objects, and three users. Rollback then restored 100% traffic to `pal-staging-malware-scanner-00010-p6g`, removed callback Invoker and temporary objectViewer while preserving objectCreator, and verified retry `PAUSED`. Temporary Cloud Shell fixture/log/harness copies were removed. Production and real PAL data were unchanged.
- No image build or Artifact Analysis scan occurred. The direct scan ledger remains nine scans / `$2.34`; only small unposted Staging runtime, Function, Storage, Eventarc, and logging usage was added. Package 6 remains **IN PROGRESS / Production closed** for remaining retry-recovery, posted-billing reconciliation, and exact Production-proposal gates; scanner detection is no longer the blocker.

## 2026-08-30 — Package 6 repeat lifecycle regression blocked on scanner detection

- John approved the exact isolated Staging runtime/IAM/regression boundary for accepted digest `sha256:e0de7bbb029eb9d342bd56b9e215fab33d39f27eb3fe23f42728ed920cedd7cb`. The private bounded scanner was installed with the previously approved scanner-only callback Invoker and exact isolated-unscanned viewer access; retry remained PAUSED during direct-path verification. Production and real PAL data were not touched.
- A first harness attempt used the Production Firebase web identifier against Staging. Firebase correctly rejected all three synthetic tokens as invalid for Staging; logs recorded `auth: INVALID`. The harness cleaned five documents, one object, and three temporary users. A corrected run proved all three temporary tokens were issued by `pal-safety-hub-staging`.
- Live synthetic evidence passed the certification exact-object first scan and purpose-bound exact-byte download, plus payroll/identity clean scan, non-entitled denial, requester self-approval denial, different-Admin approval, and generation-bound exact-byte download. The direct certification authorization reached `scan-clean` with bound numeric scanner-input generation and a once-only audit marker.
- The manual-review test then found a material scanner-detection blocker. After correcting an initially malformed harmless antivirus fixture, the standard synthetic antivirus test file was still reported `clean` and the authorization advanced to `verified-clean` instead of `scan-manual-review`. The harness timed out waiting for the required locked state and cleaned nine documents, three objects, and three temporary users. No synthetic file was downloaded after this incorrect classification and no real data was involved.
- Staging was restored fail closed: 100% scanner traffic returned to `pal-staging-malware-scanner-00010-p6g`; the initial-callback service has no Invoker binding; the temporary isolated-unscanned `objectViewer` grant was removed while the pre-existing objectCreator grant was preserved; retry is `PAUSED`; and the earlier direct synthetic authorization/intake and exact objects were removed and verified absent. Production is unchanged. Package 6 remains **IN PROGRESS / BLOCKED for Production** pending scanner engine/signature verification and a new clean/manual-review regression.
- No new image build or Artifact Analysis scan occurred. The direct scan ledger remains nine scans / `$2.34`; only small unposted Staging runtime, Function, Storage, Eventarc, and logging usage was added.

## 2026-08-30 — Package 6 corrected initial-scan image accepted, undeployed

- John approved exactly one dedicated-builder image push and one `$0.26` Artifact Analysis scan from reviewed commit `9b387eb`, pinned upstream `0db019c9f09494215aa4485b71094e9b8d5ea90b`, patch SHA-256 `a14d7836af49e4efc211f93da466164c425b421d311d8e17274a3129e458df07`, and unique tag `pal-initial-intake-field-1`.
- Dedicated keyless-builder Cloud Build `f8dfaf77-f26d-4f75-a08e-ad01bc4596da` succeeded and produced immutable digest `sha256:e0de7bbb029eb9d342bd56b9e215fab33d39f27eb3fe23f42728ed920cedd7cb`. The exact service account, tag, and digest were recorded from the completed build.
- Digest-specific package-vulnerability output contained only discovery/image summaries, zero finding paths, and zero occurrences. All-metadata output contained discovery/image/package summaries, zero vulnerability or malicious-package finding paths, and zero occurrences. The ninth scan is incurred; cumulative direct scan charges are `$2.34` pending invoice reconciliation.
- The image is accepted but **undeployed**. No runtime, IAM, Functions, Hosting, Production, credential, migration, or real-data change occurred. Repeat isolated Staging installation and regression remain separately approval-gated.

## 2026-08-30 — Package 6 initial-scan field mismatch isolated and corrected locally

- John approved the two-phase isolated Staging installation. Phase 1 deployed only accepted digest `sha256:5137ce2d9f744c428838fa67868c66fb180c342b3f9c21704150255b5b4b533b` to private bounded revision `pal-staging-malware-scanner-00011-mk8` with min 0, max 1, concurrency 1, callback Invoker absent, and retry PAUSED. The revision became healthy, served 100%, returned anonymous HTTP 403, and logged successful Bash, ClamAV, and application startup with no CRLF/startup errors.
- Phase 2 configured the private first-scan callback on revision `pal-staging-malware-scanner-00012-28s`, granted Invoker only to the dedicated scanner identity, and temporarily granted the dedicated vault runtime exact-bucket objectViewer on isolated unscanned storage. No output-bucket trigger or output-bucket viewer grant was created.
- A synthetic certification traversed the public grant, upload, finalization, isolated copy, Eventarc delivery, and ClamAV scan. ClamAV returned CLEAN, but the scanner rejected the callback with `PAL scan callback metadata is incomplete`; authorization remained `scan-queued`, the record remained pending/locked, and no signed release or download occurred. This is a fail-closed availability/integration blocker, not a confidentiality bypass.
- Rollback restored 100% traffic to prior serving revision `pal-staging-malware-scanner-00010-p6g`, whose environment contains only the established false-positive callback. The initial callback Invoker and temporary vault-runtime objectViewer both verify absent, retry verifies PAUSED, and only named `PAL-SYNTHETIC-P6-*` records/accounts/objects were removed. Production and real PAL data were unchanged.
- The initial Storage diagnosis was rechecked and corrected: `gcloud storage` reports custom labels as `custom_fields` and uses `content_type`/`cache_control`, not the field names initially inspected. Exact-generation CLI and Node Storage reads proved the copied object already carried the complete intended envelope. A temporary Function-side `setMetadata()` correction correctly failed with HTTP 403 under the narrow objectCreator/viewer permissions and was reverted; the original focused finalizer was redeployed.
- Source inspection isolated the true defect: the scanner's shared required-field list demanded false-positive-only `palOriginalIntakeId` even for an ordinary initial scan, whose server-created envelope correctly uses `palInitialScanIntakeId`. The local scanner correction separates the two workflow-specific intake requirements while preserving exact-generation lookup, digest/path binding, callback-before-move ordering, and fail-closed behavior. A fresh pinned-upstream preparation passed production audit=0, TypeScript build, and 41/41 scanner tests; PAL tests remain 99/99. No image, paid scan, IAM, runtime, Production, or real-data action is included.

## 2026-08-29 — Package 6 automatic first-scan candidate prepared locally

- Added a predeployment first-scan flow for both Package 5 upload folders. Finalization hashes and binds the exact Firebase object generation, persists the correct certification or sensitive-vault record first, and then automatically copies only that generation into the private scanner input using an idempotent authorization-derived path.
- Added separate clean/infected output-bucket handlers that re-hash the scanner output, validate bucket/path/generation/size/type/SHA-256 metadata against the pending record, serialize result recording, and keep every file non-downloadable until a later server authorization. A ten-minute worker automatically retries failed queue copies and stale results; employees do not move or resubmit files because of an internal interruption.
- Added a purpose-bound five-minute certification download callable for active Office/Admin users. It does not require sensitive-vault entitlement or two-person identity approval; payroll/identity files retain those stronger controls. The Office UI uses plain statuses: security check in progress, Office review required, or one protected Open button.
- This candidate uses the already accepted scanner image unchanged, so it requires no new image push or `$0.26` Artifact Analysis scan. It is local/predeployment only. Staging still requires exact approval for two new private bucket-result Eventarc Functions, one retry schedule, focused finalizer/certification-callable/client deployment, and narrow vault-identity object-viewer access on only the isolated clean/quarantine buckets.
- Functions and policy syntax pass; all 97/97 PAL tests pass. No cloud, IAM, Production, real-data, credential, or cost action occurred.

## 2026-08-29 — Package 6 initial-upload scanner handoff remains blocked

- Exact Production-proposal inspection found a verified integration gap after the Office workflow checkpoint: `finalizePublicIntakeUploadV2` validates and records both certification and payroll/identity uploads as `pending`, but it does not enqueue either exact Firebase-quarantine object into the isolated scanner.
- The accepted scanner image and private callback intentionally recognize only separately requested false-positive rescans. They do not record the first scan result for an ordinary new upload. Therefore a new Package 5 sensitive upload remains locked indefinitely rather than progressing from pending to a trusted clean/infected result.
- This is a fail-closed availability/integration gap, not a confidentiality bypass: the browser still cannot read the object, the vault download gate still requires exact clean evidence, and Production Package 6 remains absent.
- Certifications additionally lack a clean-file Office release callable while Storage remains browser-denied; the existing sensitive-vault release applies only to payroll/identity records. Package 6 cannot be proposed for Production until an idempotent exact-object first-scan queue, trusted result handoff, retry/recovery path, appropriately separated certification versus identity release, and complete synthetic upload-to-release regressions pass in Staging. No cloud, IAM, image, credential, Production, real-data, or cost action occurred in recording this blocker.

## 2026-08-29 — Package 6 Office vault workflow passed in Staging

- With John's approval, deployed only the new Admin approval-queue callable and Staging Hosting/client, then focus-updated the existing protected-download callable with bounded, non-sensitive failure-stage logging. No IAM, scanner image, credential, Production, real-data, or direct image-scan charge changed.
- Deployment review found that the broad Hosting root would otherwise package `functions-public-intake/**` and `scanner/**`. All maintained Hosting configurations now exclude every `functions*/**` tree and `scanner/**`; live Staging probes return 404 for representative backend and scanner source paths.
- Authenticated synthetic UI checks passed required-purpose enforcement, non-entitled denial, no direct Storage links, clean non-identity authorization, bounded Admin queue display, different-person identity approval, approval consumption, and the original requester's five-minute protected authorization. The automated browser blocked the resulting new-tab popup; the previously verified backend regression remains the exact-byte evidence.
- An initial request failed closed because the test object used a synthetic path outside the required `quarantine/newHireIntakes/...` namespace. After correcting only that synthetic fixture, authorization passed. This confirmed the path-binding control rather than exposing a product weakness.
- Cleanup was independently counted after execution: zero temporary Auth users, user profiles, intake/vault records, approval/notification records, or four synthetic objects remain. Append-only synthetic audit events were intentionally retained. Production remained unchanged.
- Functions/policy syntax and all 94/94 PAL tests pass. Direct image scans remain five / `$1.30`; small Staging runtime remains pending posted billing reconciliation.

## 2026-08-29 — Package 6 Office vault workflow prepared before Production proposal

- Current-source inspection found a verified Production-readiness gap: the protected backend had passed synthetic tests, but the Office review screen still used the older generic payroll-file presentation and had no purpose-bound vault status, protected download, false-positive request, or independent approval queue.
- Added a predeployment Office workflow that excludes sensitive files from printable packets, requires a stated business purpose, loads only server-authorized vault metadata, exposes downloads only through five-minute signed-release callables, supports locked false-positive requests, and clearly labels legacy entries unscanned/unavailable.
- Added an Admin-only, server-side, 25-item bounded approval queue for protected downloads and false-positive reviews. The queue returns no requester email, remains inaccessible through Firestore rules, and writes a chained `approval-queue` audit event. Existing approval endpoints still enforce different-person approval and fail closed on incomplete, expired, or self-approved requests.
- Functions/policy syntax, diff check, and all 93/93 PAL tests pass. This is local/predeployment only. Staging Hosting, the new queue callable, Production, IAM, scanner resources, real data, and cost were not changed.

## 2026-08-29 — Package 6 live false-positive release gate passed in Staging

- With John's exact approval, focus-deployed only corrected `requestSensitiveFalsePositiveReviewV1` to isolated Staging. Deployment completed successfully; no IAM, scanner image, scan charge, credential, Production, or real-data change occurred.
- The complete two-account synthetic workflow passed: exact-object rescan returned clean, the requester was denied self-approval, a different synthetic Admin approved, the five-minute generation-bound download returned the exact 67 bytes, four audit events validated, and all temporary accounts, records, and objects were removed.
- The first post-deployment run exposed a verifier-only problem after the protected release controls had succeeded: stored events contain only the masked actor email, while the shared helper attempted to mask that already-masked value again during independent recomputation. The local helper now accepts only the strict one- or two-character-plus-`***@domain` stored mask, rejects an unmasked email in that field, and reproduces the original hashes. The complete PAL suite remains 91/91 with syntax and diff checks passing.
- Live false-positive handling is now credited in Staging. The verifier correction is local/predeployment code and does not change the hashes or fields created by the deployed writer. Production remains closed. Direct image scans remain five / `$1.30`; small Staging runtime usage remains pending billing reconciliation.

## 2026-08-29 — Package 6 rescan metadata handoff defect isolated and corrected in code

- Focus-deployed the prior review-before-copy correction to Staging and reran the approved two-account synthetic workflow. The request action was ACTIVE on the dedicated vault identity; the run failed closed and completed full synthetic cleanup, with no approval or download.
- Retained logs proved Eventarc delivered the exact 67-byte object, the accepted scanner classified it CLEAN in 95 ms, moved it to the isolated clean bucket, and safely ignored duplicate deliveries. The configured callback URL exactly matched the ACTIVE private vault callback, but the callback received no request and the vault received no trusted evidence.
- Source inspection against the official Cloud Storage copy option shape found the cause: content type, cache control, and PAL security labels were nested inside the custom `metadata` value instead of being sibling copy options. The scanner therefore saw no false-positive review label and correctly treated the object as an ordinary scan.
- Corrected the copy-option shape and added a regression that rejects the invalid nesting. The complete PAL suite passes 91/91, Functions syntax passes, and the diff check passes. This correction is local/predeployment only; another focused Staging deployment and full authenticated synthetic regression require approval. Production and real data remain untouched. Direct image-scan cost remains five scans / `$1.30`.

## 2026-08-29 — Package 6 rescan lifecycle race corrected in code

- Reordered false-positive review creation so the private callback target exists before the isolated rescan object can emit its finalize event. A failed copy now records `copy-failed` and returns a locked/unavailable result rather than leaving a pending review.
- Added a regression that enforces review-before-copy ordering and fail-closed copy failure. The complete PAL suite passes 90/90, Functions syntax passes, and the diff check passes.
- This is predeployment evidence only. Staging still serves the prior implementation and live false-positive credit remains blocked until the focused deployment and full authenticated synthetic regression pass. Production and real data remain untouched.

## 2026-08-29 — Package 6 live false-positive regression failed closed

- Ran two approved authenticated, two-person synthetic Staging regressions against the private trusted-rescan workflow. Both created only temporary synthetic accounts, a harmless 67-byte fake PDF, and isolated test records; both cleanup routines completed and removed the accounts, records, and objects.
- The first run showed the scanner eventually classified and moved the exact rescan object as clean, but the vault did not observe trusted rescan evidence within the original four-minute client window. The second run extended that observation window to ten minutes and still received no trusted evidence; retained scanner logs for that interval showed health/self-check activity but no corresponding scan request. No human approval or download occurred.
- This is a verified reliability/security-availability gap in the scanner-to-vault handoff. The control failed closed—the sensitive object remained locked—but live false-positive completion is blocked until the event/callback lifecycle is corrected and the full two-person, exact-download, audit-chain, and cleanup regression passes.
- Production and real PAL data were untouched. Direct image-scan authorization remains five scans / `$1.30`; these runtime attempts add only small Staging usage pending billing reconciliation.

## 2026-08-29 — Package 6 trusted-rescan integration deployed to Staging

- Pinned patched UUID `11.1.1` after the temporary deploy audit found the new transitive advisory; both production audits are now clear and 89/89 PAL tests pass.
- Deployed three ACTIVE false-positive actions on the dedicated vault identity, private callback invocation, isolated-bucket object creation, and exact accepted scanner digest on private min-0/max-1/concurrency-1 revision `pal-staging-malware-scanner-00006-h4q`.
- Anonymous callables return 401 and the callback returns 403. Authenticated two-person synthetic release remains pending explicit temporary-account approval. Production and real data were untouched.

## 2026-08-29 — Package 6 trusted-rescan image accepted

- Dedicated keyless Cloud Build `2dec656e-9c6e-403f-8778-39bef3905120` produced immutable Staging candidate digest `sha256:ab00939cb01de07150d20ad643dab338feb19fb31f0033049ad4a6f18e457da5` from verified patch `7d75bea8f5c50be29aaaaab7dd8e1c6963b72354d057ce318ce3c0be61cabc01`.
- Artifact Analysis completed with zero vulnerabilities and zero malicious-package findings. The fifth approved `$0.26` scan brings the direct-scan ledger to `$1.30`, pending billing reconciliation.
- Image acceptance is Staging-only; no runtime, IAM, Production, existing-file, credential, or real-data change is credited.

## 2026-08-29 — Package 6 false-positive policy prepared, scanner handoff gated

- Encoded John's approved different-person reviewer/Admin policy, mandatory justification, later trusted clean rescan, exact-object binding, permanent audit, and clean-rescan-alone download denial.
- Added two server-only false-positive actions and tests; the full suite passes 89/89.
- Held deployment because the current scanner cannot yet produce trusted vault rescan evidence. A new immutable scanner image and separately approved $0.26 scan are required before live Staging credit. Production and real data were untouched.

## 2026-08-29 — Package 6 live retention and internal notification controls passed

- Deployed an hourly, bounded, dedicated-identity Staging retention worker with exact-generation deletion, policy-version gating, legal/HR-hold override, deletion audit, and internal-only authorized notifications.
- A first forced run encountered temporary new-service invocation propagation, failed closed, and cleaned all test data. After an empty 200 health run, the retry deleted exactly two eligible fake files while retaining legal-hold and recent-review files.
- Verified two deletion audits, two authorized in-app notification records, external delivery disabled, and complete cleanup. Full local suite passes 86/86. Production, existing files, and real data were untouched.

## 2026-08-29 — Package 6 dedicated Staging vault identity deployed

- Created a zero-key Staging-only vault runtime identity with narrow Firestore, logging, exact-bucket object-read, and self-signing access.
- Made the identity assignment durable in the three vault-function deployment declarations and verified all three Cloud Functions/Cloud Run services ACTIVE on that identity.
- Removed the shared default Compute identity's obsolete self-signing grant. Anonymous probes still fail closed with 401.
- With John's exact approval, repeated the temporary two-reviewer synthetic regression under the dedicated identity. Concurrent reads, different-person approval, exact fake-file signed download, four-event linked audit chain, client 403, and audit redaction passed; both accounts and every synthetic record/object were removed. Production and real data remained untouched.

## 2026-08-29 — Package 6 retention and notification policy encoded

- Recorded John's approval of the 24-hour verified identity-image window, 30-day locked manual-review window, legal/HR-hold override, indefinite audit retention pending a formal PAL schedule, and in-app-only entitled-reviewer notifications.
- Added a fail-safe policy core that excludes existing/unversioned records and never treats incomplete metadata as deletion authorization.
- Added exact-boundary, hold, legacy/audit safety, and notification-audience tests. The full suite passes 84/84; no object, record, account, credential, Staging resource, or Production component changed.

## 2026-08-29 — Package 6 live vault release and audit chain passed in Staging

- With John's specific approval, created two temporary synthetic Staging reviewers and one harmless synthetic PDF. Credentials existed only in memory and were not printed or saved.
- Verified concurrent entitled reads, different-person approval for identity media, a five-minute exact-object signed download, four linked audit events with matching head, masked/no-secret audit content, and authenticated client audit denial.
- The first attempts identified fail-closed missing-object-metadata behavior and the missing Staging runtime `signBlob` permission. Added only a self `roles/iam.serviceAccountTokenCreator` binding to the exact Staging runtime identity; no key or broad Storage access was added. A dedicated keyless identity remains required for Production least privilege.
- Cleanup removed both temporary accounts, profiles, vault/approval/audit records, object, and test harnesses. Production and real PAL data were untouched.

## 2026-08-29 — Package 6 audit chain deployed to isolated Staging

- Deployed exact commit `acb318844a52ffae76652e9e9c16a3caabc8e443` only to the `public-intake-v2` Functions codebase in `pal-safety-hub-staging`; all nine functions updated successfully.
- Verified the three Node.js 22 vault callables are active in `us-central1`. Empty anonymous calls returned HTTP 401, and anonymous Firestore reads of the audit-event and chain-head collections returned HTTP 403.
- No Hosting, rules, Production service, real data, secret, credential, or identity changed. Live authenticated chain/head/concurrency testing remains open because the existing synthetic accounts have no stored credentials and credential creation was not authorized for this step.

## 2026-08-29 — Package 6 tamper-evident vault audit prepared

- Replaced independent sensitive-vault audit inserts with transaction-created, SHA-256-linked events and a server-only chain head.
- Added browser-deny rules for the chain state and deterministic tests covering hash linkage, invalid predecessors, append-only event creation, and direct-access denial.
- Local verification passed 81/81 tests, Functions syntax, and diff check. No Staging deployment, Production change, credential, or real-data action is credited yet.

## 2026-08-29 — Package 6 scanner memory and failure recovery passed in Staging

- Cloud Monitoring measured peak scanner memory utilization at about 30.8%, approximately 1.23 GiB of the enforced 4-GiB limit.
- A reversible one-second timeout drill produced two Eventarc HTTP 504 results while the synthetic 25-MiB object remained unavailable in unscanned storage and absent from clean/quarantine.
- Restored the tested 300-second timeout on revision `pal-staging-malware-scanner-00003-hbg`; the retry then moved the exact object to clean and removed it from unscanned.
- An authenticated malformed synthetic event returned HTTP 400 and created no object in any scanner bucket. Production, Firebase Storage, real data, image digest, public access, scaling, and credentials were unchanged.

## 2026-08-29 — Package 6 isolated scanner measurement passed core Staging paths

- Populated the isolated CVD mirror with pinned `cvdupdate` 1.2.0, then removed the temporary Cloud Shell installation. The mirror contains 154,162,681 bytes and was refreshed successfully by the permanent image-based job.
- Deployed exact clean digest `sha256:b50fae51da78641f066ea14cd3a9659d509f2b7d1e53d771552f549d24d934cd` as a private scale-to-zero Staging service with 1 vCPU, 4 GiB, max 1, concurrency 1, no public IAM, and only four isolated-bucket access.
- Added the isolated Storage Eventarc trigger and an enabled four-hour definition-update schedule. Manual and forced-scheduler update executions both completed successfully under the keyless scanner identity.
- Synthetic tests passed: benign PDF to clean, encrypted archive to quarantine, 1 MiB and 25 MiB clean routing, latest-generation duplicate behavior, and anonymous HTTP 403. The 25 MiB path completed in about 28 seconds end-to-end; ClamAV initialization to application startup took about 20 seconds.
- Peak memory, forced timeout/error, Office release/download, immutable audit, retention/legal hold, false-positive review, notifications, migration, and Production remain uncredited. Production and the existing Firebase bucket were unchanged.

## 2026-08-29 — Package 6 startup-fixed image passed the full gate

- John approved the fourth `$0.26` scan; cumulative authorized scanner-analysis charges are `$1.04`, pending billing reconciliation.
- Matched patch SHA-256 `973ae669e60d11d9417b4293bff184952dcc02ae2f7a9326b8b19606410e16df` locally and in Cloud Shell, then verified the pinned upstream commit, patch application, startup syntax, direct Node commands, absence of npm startup calls, and clean diff.
- Dedicated keyless-builder Cloud Build `d219450e-b573-41bd-825b-5ae4e17fbf3e` succeeded and produced immutable digest `sha256:b50fae51da78641f066ea14cd3a9659d509f2b7d1e53d771552f549d24d934cd`.
- Artifact Analysis reported no malicious packages and no vulnerabilities at any severity. The exact digest passes the image and source-level startup gates.
- No runtime, trigger, schedule, permission, key, Production component, or real data was changed at this checkpoint.

## 2026-08-29 — Package 6 runtime startup incompatibility caught before deployment

- Pre-deployment review found the clean scanner image removed npm while its inherited startup script still called npm. The image remained undeployed and no Staging or Production runtime was affected.
- Updated the local source overlay to start both compiled Node programs directly and added reproducible startup-script syntax and npm-compatibility checks.
- Fresh-clone verification passed startup validation, TypeScript compilation, 34/34 tests, and the zero-finding production dependency audit.
- The repair requires a new image digest and a separately approved fourth `$0.26` scan. Cumulative authorized direct scans remain `$0.78`.

## 2026-08-29 — Package 6 immutable scanner image passed Artifact Analysis

- John approved the third `$0.26` scan; cumulative authorized scanner-analysis charges are `$0.78`, pending billing reconciliation.
- Verified the checked-in hardening patch by matching SHA-256 locally and in Cloud Shell before building a fresh clone of the pinned upstream commit.
- Keyless-builder Cloud Build `c8ebdc20-40aa-44c6-af32-0bdfffacef74` succeeded and produced immutable digest `sha256:945d6e425a7412fc3c0e89307d0e46f601554e4dce931be7be64ea575f075cef`.
- Artifact Analysis completed with no findings: no malicious packages and no vulnerabilities at any severity. The exact digest passes PAL's scanner-image gate.
- Production, real data, runtime deployment, triggers, schedules, minimum instances, broad Firebase-bucket access, and credential keys remained unchanged.

## 2026-08-29 — Package 6 hardened image blocked on package-name collision

- John approved one additional `$0.26` scan. Hardened Cloud Build `7638a7ae-dd62-4578-a05b-512da21a4b52` succeeded and produced immutable digest `sha256:8151f03645b61edc7af9182fe8e91cc863b323f9175f91cc05b5cd700e720192`.
- Artifact Analysis reported zero vulnerabilities and one CRITICAL malicious-package match against the root application name `gcs-malware-scanner`.
- Verified the advisory describes an unrelated npm-registry package while Google's reviewed source uses the same name for its local application. PAL still applied the no-CRITICAL policy and kept the image blocked.
- Renamed the local package identity to `pal-clamav-scanner`; a fresh-clone build, 34/34 tests, and the production dependency audit pass. No follow-up image or scan was created because another `$0.26` charge requires separate approval.
- Cumulative authorized scanner-analysis charge is now `$0.52`, pending billing reconciliation. No scanner runtime, trigger, schedule, Production component, credential key, or real data was used.

## 2026-08-29 — Package 6 scanner remediation candidate prepared

- Kept both vulnerable scanner images blocked and undeployed.
- Added a reproducible, commit-verifying PAL hardening overlay for the reviewed Google v3.6.0 scanner source.
- Removed unused vulnerable packages, updated affected runtime dependencies, pinned build inputs, and removed npm tooling from the runtime layer.
- Local verification passed the TypeScript build, all 34 upstream scanner tests, and a production dependency audit with zero known findings.
- No cloud resource, permission, image, trigger, schedule, credential, Production component, or paid scan was created. The next image push would incur a separately approval-gated `$0.26` scan.

## 2026-08-29 — Package 6 Staging scanner experiment and cost tracking approved

- John approved the exact measurement-only Staging scanner resources and requested a complete cost breakdown when the security program is finished.
- Added `SECURITY_COST_LEDGER.md` to track estimated and measured incremental costs, billing scope, alerts, free-tier effects, and final reconciliation.
- Approval is limited to the recorded us-east1, keyless, synthetic-only, min-0/max-1/concurrency-1 experiment with a $5 alert and stop boundary. No Production scanner, minimum instance, real file, credential key, or higher ceiling is authorized.
- Enabled the approved Staging APIs, created the keyless scanner service account, and created exactly the three approved isolated `us-east1` buckets. No credential key was created.
- Paused before scanner deployment because safely writing rejected objects requires a fourth isolated quarantine bucket; broad access to or a storage-mode change on the existing Firebase bucket was not applied. Recorded the pre-creation console cost baseline of `$0.00` estimated August charges.
- John approved and PAL created the fourth isolated Staging quarantine bucket with matching region and access protections; the existing Firebase bucket remains unchanged.
- Applied object-only scanner access to the four isolated buckets and created a separate keyless, narrowly scoped build identity rather than using the project's Editor-capable default identity.
- Built the pinned scanner source and base images successfully into immutable digest `sha256:e8ee7cc0ba2b31394f0131fcabeecd3309b0c27afc93e5a26e67ec96b7fece6c`. The build lasted 3m15s; runtime deployment remains pending.
- The console disclosed a `$0.26 per image` vulnerability-scanning charge. It remains disabled pending specific paid-action approval and is separately recorded in the cost ledger.
- John approved the `$0.26` scan. Artifact Analysis was enabled and an exact repeat build was pushed to initiate scanning.
- The repeat build succeeded but produced a different digest, proving the current upstream build is not bit-for-bit reproducible. The scanned replacement digest is `sha256:36e6cbf11793c215521f528aee951ab1121e5551e1da6d5321502cd08861f134`.
- The scan reported 17 HIGH findings (maximum CVSS 7.7), 9 MEDIUM findings (maximum CVSS 6.5), and 6 unclassified records. All high and medium findings have fixes. Scanner deployment is blocked pending remediation and a separately approved replacement-image scan.

## 2026-08-29 — Package 6 vault separation active in Staging

- John approved the seven recorded Package 6 policies; Production, real-data migration, credentials, irreversible retention, and material recurring scanner cost remain separately gated.
- New W-4 payloads and payroll/identity file records are separated from ordinary intake records into a client-denied server vault. Existing real records are not migrated or inspected.
- Added separately entitled, purpose-audited vault reads; clean-only five-minute downloads; and single-use two-person approval for SS-card/driver-license downloads. Unknown or non-clean scanner states remain unavailable.
- Staging Firestore rules and three Node.js 22/us-central1 vault actions are active. Empty anonymous calls return 401. Tests pass 79/79 core and 12/12 emulator cases with synthetic data.
- The Google Cloud/ClamAV supply-chain and preliminary recurring-cost boundary are documented. No scanner runtime, scanner identity, credential, real file, or Production component was created.

## 2026-08-29 — Package 6 verified design checkpoint

- Verified that full W-4/SSN data remains in ordinary intake documents and that Office review has no separate sensitive-vault entitlement or server-attributed sensitive-read event.
- Verified that Package 5 quarantine is fail-closed but has no trusted malware scanner or controlled clean-file release/download path.
- Recorded the proposed server-only vault, explicit scanner states, object-integrity binding, short-lived authorized downloads, append-only audit evidence, and failure-safe rollback in `SENSITIVE_VAULT_DESIGN.md`.
- No Production configuration, real record, file, account, credential, retention setting, or paid service was changed. Scanner/vendor, access, retention, false-positive, and existing-data policies remain explicit approval boundaries.

## 2026-08-29 — Package 5 Production activation verified

- John explicitly approved exact tested commit `7cbe1c8e866aebf8fd7b0c61bb55b22ec710764c` and acknowledged that new public uploads remain private and unavailable even to Office until a later scan/release control is completed.
- Deployed the grant-based Hosting client, hardened Storage rules, five public application callables, and the non-public hourly cleanup Function to Production. All six Package 5 services are ACTIVE on Node.js 22 in `us-central1`.
- Verification: both Firebase Hosting domains serve the Package 5 client; empty create/finalize calls reach and fail application validation with 400/403; anonymous access to the active Storage bucket returns 403; the cleanup endpoint returns 403 anonymously; and its enabled hourly Scheduler job completed a forced run successfully.
- No real PAL record, account, credential, or file was opened or changed. Existing files/orphans were not migrated, scanned, or deleted. Malware scanning and controlled quarantine release are explicitly assigned to Package 6 with the sensitive vault.

## 2026-08-29 — Security program Package 5 passed PAL tests

- Replaced the tested public upload design with 15-minute, single-file backend grants bound to packet, folder, backend-selected quarantine path, label, extension, content type, and exact size.
- Hardened the tested Storage rules so public browsers cannot write normal intake paths and no browser can read or write quarantine paths.
- Finalization verifies grant secret, expiry, replay, packet binding, metadata, size/type, and file signature; mismatches are removed. Accepted objects remain inaccessible quarantine with malware status explicitly pending.
- Added packet/hour abuse limits and hourly cleanup of expired grants plus completed-but-unfinalized quarantine objects.
- Tests: 68 of 68 core/static checks and 10 of 10 Firebase emulator security cases passed with synthetic records and bytes.
- Staging: grant-based Hosting, the new public grant callable, updated finalizer, and non-public hourly cleanup Function are active. Empty live calls reach expected application validation. No real data or retained credential was used.
- Production impact: none. Compatibility, quarantine limitation, cost, exact proposed components, and rollback are recorded in `SENSITIVE_UPLOAD_SECURITY_V2.md` and remain separately approval-gated.

## 2026-08-29 — Package 4 Production activation verified

- John explicitly approved exact tested commit `39d2e976c65b2f4d98f291ee88f6dbaa292b0fe4` and acknowledged that every existing ID-only intake link would fail closed and require replacement.
- Deployed four `public-intake-v2` callable Functions, the V2 Hosting client, and hardened Firestore rules to Production. The four services are ACTIVE on Node.js 22 in `us-central1` and have public invocation only so application-level packet-token and Office authorization can execute.
- Verification: anonymous empty calls return expected application denials (401 for Office-only issuance and 403 for public read/update/upload finalization); both Firebase Hosting domains serve V2 content; an ID-only synthetic link displays `PAL Intake Link Replaced`; anonymous synthetic intake-document REST access returns 403.
- No real PAL intake, employee, account, credential, or file was opened or changed. No bulk link migration was performed. PAL Office must issue replacement links as active intakes need access.
- Storage upload authorization remains Package 5; sensitive payroll/identity separation remains Package 6. The Package 4 rollback restores the known ID-only vulnerability and is for emergency use only.

## 2026-08-29 — Security program Package 4 passed PAL tests

- Replaced ID-only public orientation/intake access with random packet-bound tokens, server-side token hashes, expiry, revocation, completion lockout, and four narrow callable actions.
- Removed direct public Firestore reads/writes for intake records and removed the blank writable fallback for missing or legacy links.
- Tests: 63 of 63 core/static checks and 5 of 5 synthetic Firebase emulator attack cases passed.
- Staging: V2 Hosting is live; four Node.js 22 Functions are ACTIVE; only those four services received public Cloud Run invocation so their application-level token and Office authorization can execute. Empty anonymous requests are rejected with expected 401/403 responses, and a synthetic legacy link displays the replacement-link message.
- Build correction: approved build scripts only for the two Firebase dependency packages identified by the pnpm supply-chain policy and added the Functions Framework explicitly; Staging then built successfully. The us-central1 Artifact Registry cleanup policy retains images for one day.
- Compatibility: all existing ID-only links must be replaced after Production cutover; no bulk migration or real-record inspection was performed.
- Production impact: none. The exact Production components, compatibility impact, and rollback are recorded in `PUBLIC_INTAKE_SECURITY_V2.md` and remain separately approval-gated.

## 2026-08-29 — Package 3 corrective Production rollback

- The scheduled rollback safeguard did not execute. A live check at 12:14 AM found Production still in maintenance, after the approved 10:39 PM deadline. Corrective rollback began immediately under the documented authorization.
- Restored the exact `allUsers` Cloud Run Invoker bindings on the same 12 interactive services and resumed only the two recorded Firebase Scheduler jobs.
- Deployed normal Hosting, Firestore rules, and Storage rules from exact pre-maintenance commit `4b2e54e214eebe7615a36ddf6b2c7e7e394199be` in an isolated detached worktree.
- Verification at approximately 12:23 AM: both Production domains and `projects.html` served normal PAL Safety Hub content; all 12 services showed Public access; both schedules showed Enabled; synthetic empty endpoint requests reached expected application-level validation/authentication; anonymous arbitrary Firestore and Storage reads remained denied.
- No secret, account, Function code, real PAL identity, or real PAL record was read or changed. The missed deadline is recorded as an operational-control failure requiring a stronger actively monitored rollback mechanism before another timed Production window.

## 2026-08-28 — Package 3 Production maintenance activation verified

- John explicitly approved the exact controlled Production activation after its impact, security benefit, two-hour limit, and rollback were explained.
- Deployed maintenance Hosting and deny-all Firestore/Storage rules only; no Function code, secret, Authentication account, or PAL record was changed.
- Removed public Cloud Run Invoker access from all 12 active interactive Function services and paused only `firebase-schedule-monitorIntegrationHealth-us-central1` and `firebase-schedule-sendWeeklyCertWatch-us-central1`.
- Verification: both Production domains and representative old/public routes served the same protected maintenance page; anonymous synthetic Firestore and Storage probes returned 403; ten central endpoints returned 403 and two east endpoints returned 401 before application handling; both exact schedules showed Paused.
- Result: Package 3 **Passed PAL tests**. Production remains in the approved two-hour maintenance window ending at approximately 10:39 PM America/New_York unless John renews it; rollback remains defined in `PRODUCTION_MAINTENANCE_RUNBOOK.md`.

## 2026-08-29 — Package 3 Staging activation and rollback rehearsal

- Coordinated the Production-impacting package with **00 — PAL CONTROL ROOM** and created branch `codex/security-package-3-maintenance`.
- Inventoried Production Hosting, public/signed-in routes, Firestore/Storage paths, 12 active interactive Functions, two schedules, and one stale Function entry that returned 404. Deployed Firestore and Storage rule text matched source after line-ending normalization.
- Built a static maintenance page, deny-all client rules, a no-secret backend endpoint coverage harness, a Production-targeted configuration that does not deploy Function code, and `PRODUCTION_MAINTENANCE_RUNBOOK.md`.
- Tests: 59 core/static checks, 6 maintenance-rule emulator checks, and 12 maintenance-endpoint emulator checks passed.
- Staging activation: all tested root, intake/project, old-link, and daily-access routes served identical protected maintenance content; anonymous Firestore access returned 403.
- Rollback: normal Staging rules, Storage, and Hosting were restored; the normal Staging page and all 10 authorization emulator tests passed afterward.
- Production impact: none. Production maintenance activation remains gated on the final tested commit, current IAM/schedule metadata capture, Control Room report, and John's approval of the exact two-hour action in the runbook.

## 2026-08-28 — Security program Package 2 completed

- Result: **Passed PAL tests**. The isolated Staging project satisfies the Package 2 finish line for separate Firebase services, synthetic fixtures, environment guards, cost alerting, closed integrations/files, visible warnings, and authorization evidence.
- Live lifecycle evidence: one temporary reserved-domain unverified account created its exact constrained Employee profile; pre-verification reading was denied; the exact profile and account were then removed successfully. Its generated password was not printed or retained.
- Test evidence: 54 of 54 core checks and 10 of 10 Firebase emulator authorization tests passed; Staging Hosting returned HTTP 200 with no-store, frame-denial, and no-index protections.
- Production and data impact: none. No Production deployment/configuration and no real PAL data were used.
- Program position: 2 of 15 packages passed PAL tests. Package 3 requires a separately defined Production-maintenance decision coordinated through **00 — PAL CONTROL ROOM**.

## 2026-08-28 — Package 2 registration compatibility verification

- Added Firebase emulator coverage for the exact permitted employee bootstrap, the current app registration payload, and subsequent synthetic project access.
- Result: 10 of 10 emulator tests passed. The tests reproduced two Staging defects: the app registration payload is rejected by the profile-create rule, and the rule uses incompatible Boolean/string synthetic markers across profile creation and project authorization.
- Repair: the Staging website now sends only the constrained Employee bootstrap profile, unverified users remain unable to read it, and project authorization accepts both the new Boolean marker and existing string-marked fixtures while retaining verified-email and explicit-membership checks.
- Staging deployment: corrected Firestore rules and Hosting were released only to `pal-safety-hub-staging`. Live Hosting returned HTTP 200, no-store, frame denial, no-index, the Staging banner, and the corrected registration code.
- Data/credential impact: none. Tests were local and synthetic; no live account, password, token, Production rule, or Production data was created, read, or changed.
- Follow-up: complete isolated browser workflows when test credentials are specifically authorized, and resolve the MFA/Identity Platform and account self-delete decisions.

## 2026-08-28 — Security program Package 2 started

- Objective and scope: establish a Firebase Staging environment isolated from Production and restricted to synthetic data.
- Created Staging project `pal-safety-hub-staging`, its Firebase web app, and default Hosting site.
- Enabled the Firestore API for Staging and created the default database in `us-east1` with deletion protection and initially closed rules.
- Added explicit repository aliases for Production and Staging without changing the existing Production default.
- Billing-dependent controls remain incomplete: point-in-time recovery, Storage, Functions, budgets, and alerts.
- No Staging or Production deployment occurred. No Production configuration, secret, user, permission, or data was accessed or changed.
- Safety gate applied: Hosting was not deployed until its Firebase configuration was isolated from Production and a visible staging banner was present.

### Package 2 progress checkpoint

- Attached the authorized billing account to Staging only and created a $5 monthly alert at 50%, 90%, and 100% for billing admins and project owners. This alert does not cap spending.
- Enabled Firestore PITR with seven-day version retention; deletion protection remains enabled.
- Enabled email/password Authentication without creating users.
- Created an empty `us-east1` Storage bucket with deny-all production-mode rules.
- Added a domain-based environment guard: recognized Production domains use Production, Staging/local hosts use Staging, and unknown hosts are blocked.
- Deployed Hosting only to `https://pal-safety-hub-staging.web.app`; verified the visible **STAGING — TEST DATA ONLY** banner, HTTP 200, no-store caching, no-index header, and frame denial.
- Automated checks: 46 passed; Functions and environment-module syntax passed; Staging Hosting configuration parsed successfully.
- Enabled empty Secret Manager infrastructure but did not create or copy any provider secret.
- Attempted a selected non-integration Functions deployment; Firebase requested the declared email-provider secret while analyzing the shared source. The deployment was stopped, no secret was entered, and the verified Staging Functions list remained empty.
- Production impact: none. No Production deployment, rule, Function, account, secret, permission, or data change occurred.

## 2026-08-28 — Security program Package 1 baseline

- Objective and scope: create the durable 15-package security tracker and evidence-based security inventory/risk register; documentation only.
- Starting source/Production commit: `4b2e54e214eebe7615a36ddf6b2c7e7e394199be`.
- Branch: `codex/security-baseline-program`, created with the verified `main` commit plus the governance-baseline commit as its ancestry.
- Verified findings: one Critical, four High, and five Medium source/configuration risks; verification gaps are separately identified and are not presented as confirmed vulnerabilities.
- Evidence: current source/rules/functions, Firebase project/Hosting/Functions/backup metadata, live Hosting content and headers, dependency audit, and 43 passing automated tests.
- Data and Production impact: none. No real records were opened; no account, permission, rule, Function, Hosting, secret, or Production configuration was changed.
- Preserved local work: five untracked synthetic `PAL_QA_*_NOT_REAL.pdf` fixtures were not altered.
- Follow-up: Package 2 must establish isolated Staging before write-based authorization testing or security implementation.

## 2026-08-28 — Verified clean source/Production checkpoint

- Current Source Commit: `4b2e54e214eebe7615a36ddf6b2c7e7e394199be` — `Route Employee Center history through east region`.
- Current Production Commit: `4b2e54e214eebe7615a36ddf6b2c7e7e394199be`, established by exact live/source hashes for five deploy-critical Hosting files.
- Production Hosting version: `d9ef60e643ff9f11`; released `2026-08-28T18:01:25.005Z` by `jvpanettiere@gmail.com`.
- Local `main` safely fast-forwarded from `c6b6a2f` to `4b2e54e`; no tracked local changes existed.
- Preserved five untracked synthetic `tests/fixtures/PAL_QA_*_NOT_REAL.pdf` files without alteration.
- QA: all 43 current automated tests passed; `functions/index.js` syntax passed.
- Governance recreated from verified current evidence on `codex/pal-governance-refresh`.
- Production impact from this checkpoint task: none. No deploy, Firebase data write, rule change, secret change, or fixture deletion.
- Verification boundary: deployed Functions and rules were not independently mapped to a source revision.

### 2026-08-29 — Package 6 initial-scan concurrency correction

- Control Room review identified two local predeployment races: conflicting result evidence could enter an in-progress result state, and the timeout worker could overwrite an authorization advanced concurrently by a result event.
- The corrected source binds an in-progress retry to the identical result and output generation, commits the chained result audit with a durable once-only marker, requires that marker before finalization, and transactionally rechecks queue state/timestamp/path/generation before marking a scan stale.
- The existing scanner quarantine output is intentionally mapped to locked manual review because it can contain encrypted or otherwise non-clean files and does not provide a trustworthy ordinary first-scan malware classification. Errors/timeouts remain fail-closed without a trusted result event.
- Local validation: 99/99 tests, Functions syntax, and diff checks passed. No cloud, IAM, credential, image scan, Production, real-data, or direct-cost action occurred.
- Follow-up review found the isolated input generation was not persisted. The queue now reads and requires the numeric destination generation after copy or validated collision, stores it with every queue/requeue, and the stale transaction refuses an empty or mismatched generation. This remains local-only with 99/99 tests passing.
- After John approved the exact Staging installation boundary, the required pre-mutation IAM inventory found both clean/quarantine result buckets had additional inherited write-capable principals: project owners/editors and the Firebase Admin SDK service account with project-level Storage Admin, in addition to the intended scanner. Deployment stopped before mutation because clean-result authenticity is not exclusive. No Function, trigger, schedule, Hosting, IAM, Production, real-data, or cost action occurred.
- Local remediation replaces output-bucket result triggers with an identity-authenticated private first-scan callback from the scanner. Exact object/envelope checks, strict clean/infected protocol handling, conservative manual review, idempotency, and once-only audit remain server-side; callback failure leaves the file locked. Fresh pinned-upstream validation passed build, production audit=0, scanner 37/37, PAL 99/99, Functions syntax, and diff checks. No push, scan charge, cloud, IAM, Production, or real-data action; the next image scan is separately approval-gated at `$0.26`.
- Final callback binding now requires the queued scanner-input generation, validates and records ClamAV version/ISO scan time, and acknowledges terminal duplicates only when stored result/path/generation/original identities all match. Conflicts fail closed. A second fresh pinned-upstream build/audit/37 tests and PAL 99/99 passed; patch remains `8399f6cc...`. No cloud or cost action.

### 2026-08-29 — Authenticated first-scan image passed analysis

- John explicitly approved one corrected image using commit `89fbccef...`, upstream `0db019c9...`, patch `6eea59d6...`, and unique tag `pal-initial-callback-1`.
- Dedicated builder Cloud Build `fb24262a-fa0a-41dd-9332-97311b56c6fe` succeeded and produced immutable digest `sha256:0de3ddbb8fb983e066f8a4b3bec16dd4ed5b34df78e74c7ee9b24ed73b5ca4e8`.
- Artifact Analysis finished successfully with no vulnerability or malicious-package findings. The sixth `$0.26` scan is incurred; cumulative direct scans are `$1.56` pending billing reconciliation.
- The image remains undeployed. No runtime, callback Function, IAM, Hosting, Production, credential, or real-data action occurred.
- A final read-only query of that exact digest again returned `FINISHED_SUCCESS`; vulnerability and malicious-package finding sections were both absent, with explicit occurrence counts of zero for each. The scanner README was corrected to describe both private callback flows. No cloud mutation or additional charge occurred.

### 2026-08-29 — Initial-scan Staging integration blocked and rolled back

- John approved the exact synthetic Staging deployment/test boundary. Four focused Functions and the tested Staging client deployed; private scanner revision `pal-staging-malware-scanner-00007-9ll` used only accepted digest `sha256:0de3ddbb...`, and callback Invoker was granted only to the dedicated scanner identity. Anonymous callback and scanner probes returned `403`.
- The first synthetic certification stayed locked. The initial queue attempt exposed that Cloud Storage mutates supplied copy metadata; PAL now passes a fresh copy of the frozen security envelope and retains bounded stage-only diagnostics. Local Functions syntax, diff, and all 99 tests passed.
- Retry then proved the exact object and envelope reached isolated unscanned storage, but the vault identity required read-only generation lookup. A temporary, bucket-specific unscanned `objectViewer` grant allowed exact generation persistence; no clean/quarantine/Firebase-wide/Production grant was added.
- The scanner repeatedly classified the 41-byte synthetic PDF CLEAN but rejected its own callback preparation as `PAL scan callback metadata is incomplete`, even though read-only object inspection showed all ten required PAL envelope fields and the configured private callback URL. No callback was accepted, no scan-result audit was written, and the PAL record remained `scan-queued`/`pending` and unavailable.
- The approved rollback restored prior accepted scanner digest `sha256:ab00939c...` as revision `pal-staging-malware-scanner-00008-rkc`, removed the initial callback environment value and scanner Invoker binding, paused the new retry schedule, removed the temporary unscanned viewer grant, and deleted the named synthetic intake, authorization, and objects. Production and real PAL data were unchanged. Package 6 remains blocked pending a locally reviewed scanner metadata-retrieval correction and a separately approved new image/scan boundary.
- Local-only remediation now classifies callback-required objects from PAL-controlled path prefixes, then re-reads and validates the exact bucket object generation and bounded string-only PAL envelope immediately before callback, independently of mutable event metadata. Missing/mismatched evidence fails before file movement; ordinary paths stay unchanged. Focused tests plus the full scanner build/40 tests, PAL 99/99, production audit=0, and commit-range whitespace check pass. The exact checked-in patch SHA-256 is `f635b23a456284b59c2296a9aa657064ed97bdef2745ef4f09536ca9c9494fc8`; unique next tag is `pal-authoritative-metadata-1`. No push, scan charge, cloud permission, or deployment occurred.
- John approved exactly one dedicated-builder image push and `$0.26` Artifact Analysis scan from that checkpoint. Cloud Build `ebd3423f-9050-4da0-9ce1-507d9c4d2d74` succeeded and produced immutable digest `sha256:dca8aaa4128be626b655766374d4bf10a999d95cbf78e20669fbc1d28031d19d` under tag `pal-authoritative-metadata-1`. Digest-specific package-vulnerability output contained only discovery/image summaries with zero vulnerability findings; all-metadata output contained discovery/image/package summaries with no vulnerability or malicious-package occurrence section. The seventh `$0.26` scan is incurred, bringing the direct scan ledger to `$1.82` pending billing reconciliation. The image remains undeployed; no runtime, IAM, Function, Hosting, Production, credential, migration, or real-data action occurred.
- John approved the separately scoped Staging installation and synthetic regression. The four focused Functions and Staging Hosting deployed, and only scanner Invoker plus isolated-unscanned objectViewer were added. Candidate revision `pal-staging-malware-scanner-00009-mvq` failed its startup probe before traffic because `bootstrap.sh` contained CRLF bytes (`$'\r': command not found`). No scan callback or file release occurred. The approved rollback restored prior digest `sha256:ab00939c...` on serving revision `pal-staging-malware-scanner-00010-p6g`, removed both temporary permissions and the initial callback environment, and verified the retry Scheduler PAUSED. Production and real data were untouched.
- Local-only correction now normalizes CRLF from `bootstrap.sh` inside the Linux image and fails the image build unless the normalized script passes Bash syntax. Exact patch SHA-256 is `cb01e05bda922ea760bd6244c4ad616b29e078217d4cb3c8e64168457d699207`; candidate tag is `pal-authoritative-metadata-startup-1`. A fresh clone of pinned upstream passed patch verification, production audit=0, TypeScript build, 40/40 scanner tests, PAL 99/99, and diff check. No new image, scan charge, IAM, Staging runtime, Production, credential, or real-data action occurred for this correction.
- John approved exactly one replacement build/push and `$0.26` Artifact Analysis scan from the startup correction. Dedicated-builder Cloud Build `de2738dd-02db-4c9b-8880-20604bb2d897` succeeded and produced immutable digest `sha256:5137ce2d9f744c428838fa67868c66fb180c342b3f9c21704150255b5b4b533b` under tag `pal-authoritative-metadata-startup-1`. Digest-specific package-vulnerability output contained only discovery/image summaries; all-metadata output contained discovery/image/package summaries, with no vulnerability or malicious-package occurrence section. The eighth `$0.26` scan is incurred, bringing direct scan charges to `$2.08` pending reconciliation. The image remains undeployed; no runtime, IAM, Functions, Hosting, Staging installation, Production, credential, migration, or real-data action occurred under this approval.

## Entry template

### YYYY-MM-DD — Short title

- Objective and scope:
- Starting source/Production commits:
- Branch and resulting commit:
- Application/data/rules impact:
- Tests and Staging results:
- Production approval, deployment, and validation:
- Rollback point:
- Follow-up:
