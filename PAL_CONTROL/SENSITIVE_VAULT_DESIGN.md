# Package 6 — Sensitive Payroll/Identity Vault and Safe File Release

Last updated: **2026-08-29, America/New_York**

Status: **Design checkpoint / no Production authorization**

## Verified current risks

1. The public W-4 action stores the complete W-4 payload, including the full Social Security number, inside the ordinary `newHireIntakes` document. Every signed-in Office/Admin user permitted to read that intake receives the same sensitive fields as ordinary onboarding information.
2. Payroll/identity file metadata is stored beside ordinary certification metadata in the intake record. Package 5 correctly places new bytes in private quarantine, but no trusted malware scanner can mark an object clean and no controlled backend download/release path exists.
3. The Office review screen reads whole intake documents directly from Firestore and can render or locally export the full W-4. There is no separately granted sensitive-vault permission, purpose/reason capture, or server-attributed sensitive-read audit event.
4. Package 5 file-signature validation proves only that the bytes resemble the declared file format. It is not malware scanning and must never produce a `clean` decision.

## Proposed fail-closed architecture

- Ordinary onboarding state remains in `newHireIntakes/{intakeId}`. It may contain only completion markers and non-sensitive display summaries for W-4/payroll steps.
- Full W-4/SSN data and payroll/identity file records move to a server-only vault record keyed by intake ID. Firebase client rules deny all direct reads, lists, writes, and deletes to this vault.
- A PAL Office user may request sensitive information only through a backend action that verifies authentication, active account state, Office/Admin role, a separate sensitive-vault entitlement, and a stated business purpose.
- Each allowed and denied sensitive read/download creates a server-attributed append-only audit event containing actor UID, masked actor email, intake/object identifiers, purpose, decision, timestamp, and request correlation ID. The event must not contain SSNs, file contents, tokens, signed URLs, or other secrets.
- New uploads remain in the Package 5 quarantine path and remain unavailable to every browser until a trusted scanner service returns a verified clean result for the exact object generation, size, content type, and cryptographic digest.
- Scanner results use an explicit state machine: `pending`, `scanning`, `clean`, `infected`, `unsupported`, `error`, `timeout`, and `manual-review`. Unknown or conflicting states fail closed.
- A clean result does not create a permanent public URL. An authorized backend download action rechecks the entitlement and exact clean object metadata, records the access event, and issues a short-lived single-object download response or URL.
- Infected objects remain inaccessible and enter the approved quarantine-retention procedure. Error, timeout, unsupported, and suspicious metadata cases enter manual review and remain inaccessible.
- Scanner callbacks/jobs must authenticate as a dedicated scanner identity with no general Office role. Results are idempotent and can advance only the exact object generation from an expected state.
- Notifications contain only a packet reference and status; they never attach the document, expose a signed URL, or include SSN/identity content.

## Required synthetic tests

- Ordinary certification metadata never enters the payroll/identity vault, and payroll/identity data never enters ordinary certification paths.
- Public packet-token holders can save and resume their own W-4 without receiving any other packet's vault data.
- Employee, Foreman, Supervisor, ordinary Office without entitlement, disabled, anonymous, and cross-packet requests are denied.
- Entitled Office/Admin access requires a purpose and produces a server audit event; direct Firestore/Storage access remains denied.
- Clean, infected, unsupported, error, timeout, and manual-review outcomes are explicit and fail closed unless the exact object is verified clean.
- Scanner result replay, cross-object substitution, changed object generation, altered digest/size/type, duplicate delivery, and out-of-order delivery are denied or idempotent.
- No download is available before clean release. Short-lived download authorization is object-bound and not reusable after expiry.
- Quarantine retry, orphan cleanup, retention holds, false-positive escalation, and rollback retain evidence and never silently expose or delete a sensitive file.

## Approved PAL policy

John approved on 2026-08-29: Google Cloud-hosted ClamAV; Admin plus explicitly entitled payroll reviewers; mandatory stated purpose; two-person approval for Social Security-card and driver-license downloads; delete identity images after verification unless legally required; fail-closed manual review for infected/error/unsupported/timeout; and no existing-data migration without a separate plan.

This approval permits design and isolated Staging testing. It does not authorize Production, real-data access/migration, credentials, irreversible retention, or a materially recurring scanner cost without the recorded estimate and boundary review.

## Decisions that require John before implementation can be completed

1. **Scanner/vendor and paid-service commitment.** Select an approved malware scanning service or approve a separately operated scanner. Review pricing, data location, subprocessors, retention, privacy terms, breach notice, service availability, file-size/type support, and whether PAL content trains any model. No credential or paid service may be created under the current authorization.
2. **Sensitive-vault access policy.** Decide whether access is Admin-only or separately granted to named Office payroll reviewers. Recommended: Admin plus explicitly entitled payroll reviewers; ordinary Office access denied.
3. **Access-purpose policy.** Approve required purposes such as payroll setup, identity verification, legal response, or documented correction, and decide whether a second-person approval is required for SS card/driver-license downloads.
4. **Retention policy.** Approve how long clean, infected, rejected, abandoned, and audit records remain; identify legal/HR hold exceptions; and decide whether sensitive identity images should be deleted after verification instead of retained.
5. **False-positive procedure.** Name the authorized reviewer, define escalation to the scanner/vendor, and prohibit browser release until a documented clean rescan or approved replacement file exists.
6. **Existing-data treatment.** Existing W-4 fields and files cannot be inspected, moved, rescanned, or deleted without a separately reviewed real-data migration and rollback plan.

## Staging boundary

Code can implement and test the vault authorization, state machine, metadata integrity, audit shape, and fail-closed download boundary using unmistakably synthetic records and a deterministic test scanner. Such a test scanner is not a real malware control and cannot satisfy the Package 6 Production finish line. Live scanner integration, credentials, vendor commitment, irreversible retention, real-data migration, and Production deployment remain separately approval-gated.

The first vendor-neutral implementation checkpoint adds pure policy enforcement for all eight scan states, retry/terminal transition rules, trusted-scanner identity matching, exact path/generation/size/type/SHA-256 binding, required access purpose, clean-only entitled download authorization, and masked secret-free audit records. This module has no network, credential, Storage, Firestore, vendor, or Production side effect.

The second checkpoint separates new W-4 payloads and payroll/identity file records into `sensitiveIntakeVaults`, deletes newly saved W-4 payloads from ordinary intake records, and preserves existing-record compatibility without migrating real data. Direct browser access to vault, audit, and approval collections is denied. Three Staging backend actions require authentication and implement separately entitled vault reads, purpose-bound clean-only five-minute downloads, and a different second approver for SS-card/driver-license downloads. Approved download records are single-use. Staging lists all three services ACTIVE on Node.js 22 in `us-central1`; empty anonymous probes return 401.

Evidence: **79 of 79** core/static tests and **12 of 12** Firestore/Storage/Functions emulator tests pass. The emulator behaviorally proves that a synthetic full W-4 is returned only to its active packet action while the ordinary intake retains only `w4Completed` and the full synthetic payload is stored in the server vault.

## Scanner supply chain and cost boundary

The selected reference is Google's `GoogleCloudPlatform/docker-clamav-malware-scanner`, which uses the official `clamav/clamav` image, Cloud Run, Eventarc, separate unscanned/clean/quarantine buckets, and a Cloud Storage mirror for ClamAV signature updates. PAL must pin an reviewed repository commit and immutable container digests rather than deploy a floating branch or tag. Signature freshness, image vulnerability findings, build provenance, and rollback image digest must be monitored and recorded.

Google’s published deployment keeps one 1-vCPU/4-GiB scanner instance warm because cold start and signature-database downloads are substantial. Using published list rates, an always-running instance can be material (roughly **$33/month at request-based idle rates**, with active scans/build/storage/Eventarc extra; instance-based continuous CPU can approach **$90/month** before free-tier/discount effects). A scale-to-zero Staging experiment is cheaper but cannot yet be credited as a reliable Production scanner. No scanner service or credential has been created. John must approve the final measured configuration and recurring-cost cap before live Staging scanner infrastructure is created.

### Verified upstream pin for the proposed Staging experiment

- Upstream repository: `GoogleCloudPlatform/docker-clamav-malware-scanner`.
- Reviewed release: `v3.6.0`, exact Git commit `0db019c9f09494215aa4485b71094e9b8d5ea90b`.
- Runtime build inputs declared by that release and registry digests observed on 2026-08-29:
  - `node:24.15.0-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f`
  - `clamav/clamav:1.5.2_base@sha256:3aa0c6d6a966dc062899e070fb13f87485acf0cbb710fccaae9a848cd5f5b09a`
  - `gcr.io/google.com/cloudsdktool/google-cloud-cli:alpine@sha256:9309b9c14eaa55728e508d98e9971919ace5cb931582cacf9c7d040a077b5953`
- The upstream Cloud Build file currently tags its built output as `latest`; PAL must replace that with a commit-derived tag and record the resulting Artifact Registry digest before any deployment. All three base image references must also be rewritten to the reviewed digests so a future tag change cannot alter the build.
- ClamAV definitions are removed from the base image and supplied from a PAL-owned Cloud Storage mirror by pinned `cvdupdate` version `1.2.0`. Monitoring must alert when the mirror update fails, the definition timestamp exceeds 6 hours, a scan service is unhealthy, or infected/error/timeout results occur.

### Exact proposed measurement-only Staging scope — not yet authorized

- Region: `us-east1`, matching the verified Staging Storage location; no cross-region clean/quarantine movement.
- Dedicated service account with no key file and only object access to three new synthetic-only buckets plus metric/log writing and authenticated Eventarc/Scheduler invocation. It receives no Firebase Auth, general Firestore, Secret Manager, Production, or project-owner role.
- Three new regional Staging buckets: unscanned, clean, and ClamAV definition mirror. Existing Package 5 quarantine remains the fail-closed destination; no existing object is scanned or moved.
- Private Cloud Run service, authenticated invocation only, 1 vCPU, 4 GiB, request-based billing, minimum 0, maximum 1, concurrency 1 for measurement. One authenticated Eventarc trigger and one definition-update Scheduler job.
- Synthetic inputs only: a benign tiny PDF, a harmless deterministic test marker routed to the infected result by the test harness (not a live malware sample), an unsupported file, and forced error/timeout cases. No EICAR or other signature string will be written unless endpoint security handling is separately approved.
- Measurements required before any warm or Production decision: cold-start time, definition age, scan time for 1 MiB and 25 MiB synthetic files, peak memory, clean/infected/error/timeout routing, duplicate-event behavior, and complete resource cost for at least one controlled test window.
- Cost controls: maximum one instance and a dedicated **$5 monthly alert** scoped to the Staging scanner resources. Google budgets are alerts, not hard caps; the experiment must stop before estimated scanner-specific spend reaches $5. No minimum instance may be enabled without a new approval.
- Failure behavior: unavailable scanner, stale definitions, timeout, unsupported/encrypted file, digest/generation mismatch, duplicate event, or notification failure leaves the file inaccessible in quarantine/manual review. No failure path copies to clean or issues a download.

### 2026-08-29 Staging resource checkpoint

- Required Google Cloud APIs were enabled successfully in `pal-safety-hub-staging`.
- Created the keyless service account `pal-staging-malware-scanner` without generating or downloading any credential key.
- Created exactly the three approved `us-east1` buckets for unscanned objects, clean objects, and the ClamAV definition mirror. Verification confirmed uniform bucket-level access is `true` and public-access prevention is `enforced`; the scanner account has zero user-managed keys.
- The existing Firebase Storage bucket did not report uniform bucket-level access as enabled. Google Cloud requires uniform bucket-level access for bucket-level conditional IAM. Therefore the scanner was not granted broad access and the existing bucket was not changed.
- The scanner runtime, image build, Eventarc trigger, Scheduler job, and scan tests remain paused. A fourth isolated quarantine bucket is the recommended least-privilege resolution and requires explicit approval because the earlier authorization named exactly three new buckets.
- The Cloud console showed `$0.00` estimated Staging project charges for August 1–29 immediately before these resources were created. This is a baseline, not a guarantee of zero eventual billed cost.

### 2026-08-29 approved isolation and immutable-build checkpoint

- John explicitly approved a fourth isolated quarantine bucket under the existing synthetic-only, Staging-only, under-$5 experiment boundary. `pal-safety-hub-staging-clamav-quarantine` was created in `us-east1` with uniform bucket-level access and enforced public-access prevention. The existing Firebase Storage bucket remains unchanged.
- The scanner identity received object-only administration on the four isolated scanner buckets plus metric-writer, Eventarc-receiver, and Cloud Run-invoker roles. It did not receive Storage Admin or access to the existing Firebase bucket.
- The project default build identity has the broad Editor role and was not used. A second keyless `pal-staging-scanner-builder` identity was created with only source-bucket object read, scanner-repository write, and logging write. Verification found zero user-managed keys.
- Created the private `us-east1` Artifact Registry repository `malware-scanner`.
- Built reviewed upstream commit `0db019c9f09494215aa4485b71094e9b8d5ea90b` with the three recorded base-image digests and pinned build-tool digest `sha256:cf44459cd3e2cdca5e2c9546fbfa9444f007f288f53b8b76b52ffcb0a0e2c2e6`.
- Cloud Build `e6a0516d-38bf-4e2a-a8fc-5fa719b65cfc` succeeded in 3m15s. The 268.2 MB image is `us-east1-docker.pkg.dev/pal-safety-hub-staging/malware-scanner/malware-scanner@sha256:e8ee7cc0ba2b31394f0131fcabeecd3309b0c27afc93e5a26e67ec96b7fece6c`.
- At this build checkpoint, Artifact Registry vulnerability scanning was not yet enabled and the console disclosed a direct cost of `$0.26 per image`. The subsequent approved scan and its blocking results are recorded below. No scanner runtime, trigger, schedule, or scan test is credited yet.

### 2026-08-29 vulnerability-scan stop checkpoint

- John explicitly approved the disclosed `$0.26` charge for one private Staging image. Artifact Analysis automatic scanning was enabled.
- Google requires an image push after enabling scanning. A repeat of the exact pinned Cloud Build (`fd1d5ca2-04c0-4bcd-b5a3-e530a05fa85d`) succeeded and produced digest `sha256:36e6cbf11793c215521f528aee951ab1121e5551e1da6d5321502cd08861f134`.
- The repeated build did **not** reproduce the first digest (`sha256:e8ee7cc0ba2b31394f0131fcabeecd3309b0c27afc93e5a26e67ec96b7fece6c`). This proves that pinning the upstream commit and base images alone does not make the current upstream build bit-for-bit reproducible. Neither digest is approved for runtime deployment.
- Artifact Analysis reported 32 records for the second digest: **17 HIGH** (maximum CVSS 7.7, fixes available for all), **9 MEDIUM** (maximum CVSS 6.5, fixes available for all), and 6 records without a severity classification (five with fixes). No CRITICAL classification appeared.
- High findings include affected versions of `@grpc/grpc-js`, `protobufjs`, `tar`, `uuid`, `picomatch`, `brace-expansion`, `ip-address`, and `sigstore`. The scanner runtime remains undeployed until dependencies are remediated, the build is re-reviewed, a replacement image is scanned, and the findings meet PAL's acceptance policy.
- The first approved scan charge is recorded as incurred even though the cloud billing report had not posted it at verification time. A replacement image will trigger another disclosed `$0.26` scan and therefore requires a separate direct-cost approval before push.
- Expected performance is not yet verified. Scale-to-zero is expected to have a long cold start because the ClamAV database is hundreds of MiB; the official warm recommendation exists for this reason. PAL will not claim a latency or throughput target until the Staging measurements exist.

### 2026-08-29 dependency-remediation candidate

- The blocked image was not deployed and received no runtime trigger, schedule, or bucket access beyond the already documented identity boundary.
- PAL created a reviewable source overlay at `scanner/clamav-v3.6.0` against exact upstream commit `0db019c9f09494215aa4485b71094e9b8d5ea90b`. The preparation script verifies that commit before applying the patch and performs no Google Cloud authentication, push, deployment, or paid scan.
- The candidate pins the Node, ClamAV, Google Cloud CLI, and Cloud Build Docker inputs by digest; removes unused `eventid` and `@google-cloud/pino-logging-gcp-config`; updates Google Cloud Storage and monitoring-exporter dependencies; constrains the affected transitive UUID version; and removes npm tooling and its dependency tree from the final runtime layer.
- Local verification on Windows completed successfully: the TypeScript build passed, all **34 of 34** upstream scanner tests passed, and `npm audit --omit=dev` reported **0 known runtime dependency vulnerabilities**. The expected fatal log messages in the test output are assertions that malformed configuration and unavailable buckets fail closed; they were not test failures.
- This source audit does not prove that the resulting Linux container is vulnerability-free or bit-for-bit reproducible. A new immutable image must be built once, its digest recorded, and Artifact Analysis must scan that exact digest.
- PAL acceptance for the next candidate is: no CRITICAL or HIGH findings; no fix-available MEDIUM finding unless PAL documents a specific false-positive or non-exploitable exception; exact source/base/builder inputs and resulting digest recorded; zero credential keys; and no runtime deployment until the scan is reviewed. A new image push will incur another disclosed `$0.26` scan and requires John's separate action-time approval.

### 2026-08-29 hardened-image name-collision stop checkpoint

- John explicitly approved one additional `$0.26` scan. Cloud Build `7638a7ae-dd62-4578-a05b-512da21a4b52` succeeded in 2m46s using the dedicated keyless builder and the pinned builder digest. The resulting 214.7 MB image is `sha256:8151f03645b61edc7af9182fe8e91cc863b323f9175f91cc05b5cd700e720192`.
- Artifact Analysis completed with zero vulnerability findings but one CRITICAL malicious-package match: `MAL-2022-3299` / GitHub advisory `GHSA-vqx8-hw9w-5xp3`, package `gcs-malware-scanner`, all versions, no fix.
- This is a verified package-name collision rather than evidence that PAL installed the malicious npm artifact: Google's reviewed source declares its own root application with that name, while the advisory identifies an unrelated npm registry package and lists no source repository. PAL nevertheless applies its no-CRITICAL acceptance rule, so this image remains blocked and undeployed.
- The local source overlay now renames only the root application package and lockfile identity to `pal-clamav-scanner`. Fresh-clone verification again passed the TypeScript build, **34 of 34** tests, and `npm audit --omit=dev` with zero known runtime findings. Logs now identify the PAL package name.
- Clearing the scanner finding requires a different image digest and therefore another newly pushed image and disclosed `$0.26` scan. That next direct cost is not authorized. No runtime, trigger, schedule, new permission, credential, Production resource, or real data was used.

### 2026-08-29 accepted immutable scanner image

- John explicitly approved the third `$0.26` scan. The exact checked-in hardening patch had SHA-256 `b5432995d716a2411205b916c01cab097b0e4c412a607f7e75c157a7fbcd150d` in both the local repository and Cloud Shell before use.
- A fresh temporary clone verified upstream commit `0db019c9f09494215aa4485b71094e9b8d5ea90b`, applied the checksum-matched patch cleanly, and showed `pal-clamav-scanner` as the root package in `package.json` and both lockfile identity locations.
- Dedicated keyless-builder Cloud Build `c8ebdc20-40aa-44c6-af32-0bdfffacef74` succeeded in 2m29s using the pinned builder and base-image inputs. The resulting immutable image is `us-east1-docker.pkg.dev/pal-safety-hub-staging/malware-scanner/malware-scanner@sha256:945d6e425a7412fc3c0e89307d0e46f601554e4dce931be7be64ea575f075cef`.
- Artifact Analysis completed for that exact digest with **no findings**: no malicious packages and no Critical, High, Medium, Low, or unclassified vulnerabilities. The image satisfies PAL's recorded scanner-image acceptance criteria.
- Cumulative authorized Artifact Analysis direct charges are `$0.78` for three images, pending billing reconciliation. Cloud Build and storage usage remain usage-dependent and unposted.
- Acceptance of the image permits only the previously approved isolated, synthetic-only Staging runtime measurement. It does not authorize Production, real files, a minimum instance, a higher cost ceiling, broad Firebase-bucket access, or any credential key.

### 2026-08-29 pre-deployment startup compatibility stop

- Read-only review immediately before Staging deployment found that the accepted image removes npm from the final runtime layer, while inherited `bootstrap.sh` still invokes `npm run start-proxy` and `npm run start`. The image passes security scanning but cannot be credited as startable.
- Digest `sha256:945d6e425a7412fc3c0e89307d0e46f601554e4dce931be7be64ea575f075cef` remains undeployed. No Cloud Run service, Eventarc trigger, Scheduler job, permission, Production component, or real-data action occurred.
- The local overlay now invokes the compiled proxy and server directly with Node, preserving source-map support and eliminating the removed npm dependency. The preparation script also validates shell syntax and fails if the startup script reintroduces an npm invocation.
- Fresh-clone verification passed startup-script syntax/compatibility, TypeScript compilation, **34 of 34** scanner tests, and the production dependency audit with zero known findings.
- The functional repair changes the container digest. A fourth newly pushed image would incur another disclosed `$0.26` Artifact Analysis scan and requires John's separate action-time approval. Runtime deployment remains blocked until that exact digest passes the same acceptance criteria.

### 2026-08-29 accepted startup-fixed scanner image

- John explicitly approved the fourth `$0.26` scan. The local patch and uploaded Cloud Shell file both matched SHA-256 `973ae669e60d11d9417b4293bff184952dcc02ae2f7a9326b8b19606410e16df` before use.
- A fresh temporary clone verified upstream commit `0db019c9f09494215aa4485b71094e9b8d5ea90b`, applied the patch cleanly, passed `bootstrap.sh` shell syntax, showed both direct Node startup commands, confirmed no npm invocation remained, and passed the diff check before submission.
- Dedicated keyless-builder Cloud Build `d219450e-b573-41bd-825b-5ae4e17fbf3e` succeeded in 2m55s. The resulting immutable image is `us-east1-docker.pkg.dev/pal-safety-hub-staging/malware-scanner/malware-scanner@sha256:b50fae51da78641f066ea14cd3a9659d509f2b7d1e53d771552f549d24d934cd`.
- Artifact Analysis completed for that exact digest with **no findings**: no malicious packages and no vulnerabilities at any severity. The digest passes both PAL's image gate and source-level startup compatibility review.
- Cumulative authorized direct Artifact Analysis charges are `$1.04` for four scans, pending billing reconciliation. Build, Artifact Registry, and Storage usage remain usage-dependent and unposted.
- The image is authorized only for the previously approved private, min-0/max-1/concurrency-1, synthetic-only Staging measurement. Production, real data, minimum instances, broad Firebase-bucket access, credential keys, and a higher cost ceiling remain prohibited.

### 2026-08-29 isolated Staging scanner measurement

- John approved temporary installation and execution of pinned `cvdupdate` 1.2.0 in Cloud Shell. It populated only `pal-safety-hub-staging-clamav-cvd`, uploaded 15 definition/configuration objects totaling 154,162,681 bytes, and was then uninstalled with its newly installed helper packages. The permanent update path uses the same pinned utility inside the accepted image.
- Deployed private Cloud Run service `pal-staging-malware-scanner`, revision `pal-staging-malware-scanner-00001-pk7`, from exact accepted digest `sha256:b50fae51da78641f066ea14cd3a9659d509f2b7d1e53d771552f549d24d934cd`. Verified configuration is 1 vCPU, 4 GiB, request-based scale-to-zero (no minimum), maximum 1, concurrency 1, scanner service account, and no public IAM binding. An anonymous request returned platform HTTP 403.
- Created Eventarc trigger `pal-staging-malware-scan` for finalized objects in only `pal-safety-hub-staging-clamav-unscanned`. The scanner identity received bucket-metadata reader on that one isolated bucket because Eventarc must validate it; the Google-managed Storage service identity received Pub/Sub publisher as required for Storage CloudEvents. Neither identity received access to the Firebase Storage bucket or Production.
- Created Cloud Run job `pal-staging-cvd-update` from the same immutable digest with one 1-vCPU/1-GiB task, one retry, and ten-minute timeout. Manual execution `pal-staging-cvd-update-n5zfl` passed. Scheduler `pal-staging-cvd-update` is enabled every four hours UTC, within the six-hour freshness policy, and its forced run created successful execution `pal-staging-cvd-update-hzmz5` under the keyless scanner identity. The resulting `state.json` generation was updated at `2026-08-29T16:33:48Z`.
- Synthetic routing passed without real PAL data or an EICAR string. An 80-byte benign PDF moved from unscanned to clean. A harmless 239-byte password-protected ZIP moved to quarantine and never appeared in clean. A 1 MiB zero-filled synthetic object appeared in clean at `16:27:03Z`; a 25 MiB object submitted beginning `16:27:03Z` appeared in clean at `16:27:31Z`, approximately 28 seconds end-to-end including upload and event delivery. Two immediate generations of one object resolved to the latest `PAL-SYNTHETIC-GENERATION-B` content in clean with no residual unscanned object.
- Cold initialization loaded definitions and started ClamAV at `16:19:25Z`; the scanner application began at `16:19:45Z`, approximately 20 seconds after ClamAV initialization began. The first triggered request later returned HTTP 200. Peak-memory telemetry was not available from the command-line evidence and remains a verification gap; the enforced 4-GiB limit is verified.
- Retained state: the private scale-to-zero service, isolated Eventarc trigger, four-hour definition job/schedule, four protected synthetic buckets, accepted private image, keyless identities, 154 MB definition mirror, and clearly named synthetic test objects remain in Staging for review and follow-up. No Production resource, Firebase bucket, real record, credential key, or public scanner endpoint was changed.
- This checkpoint proves the isolated scanner runtime and basic clean/quarantine/idempotency paths. It does not yet prove forced timeout/error handling, peak memory, immutable audit integration, signed Office download/release, false-positive review, retention deletion/legal hold, notification behavior, existing-file migration, or Production readiness.

### 2026-08-29 Staging memory and failure-recovery evidence

- Cloud Monitoring returned 31 memory-utilization samples for the controlled scanner window. Peak observed mean utilization was `0.30773448944091797` at `2026-08-29T16:41:00Z`, approximately 30.8% or 1.23 GiB of the enforced 4-GiB limit.
- A reversible Staging-only timeout drill changed only the private scanner request timeout from 300 seconds to 1 second on revision `pal-staging-malware-scanner-00002-kfw`. A synthetic 25-MiB object produced two authenticated Eventarc HTTP 504 attempts. During failure it remained only in the isolated unscanned bucket and was absent from clean and quarantine, so no failed request made it releasable.
- The timeout was immediately restored to 300 seconds on revision `pal-staging-malware-scanner-00003-hbg`, preserving the same accepted image, 1-vCPU/4-GiB resources, maximum one instance, concurrency one, and private access. Eventarc retry then completed and moved the exact synthetic timeout object to clean with no residual unscanned object.
- An authenticated malformed synthetic CloudEvent referencing a nonexistent object returned HTTP 400 with `invalid request`; the object was absent from unscanned, clean, and quarantine. No secret or real file was used.
- Peak-memory, forced-timeout fail-closed behavior, timeout recovery, and malformed-request error handling are now evidenced. Remaining Package 6 gates are signed Office release/download integration, immutable audit, retention/legal hold/deletion, false-positive review, notifications, existing-file planning, billing reconciliation, and Production design/approval.

### 2026-08-29 tamper-evident vault-audit checkpoint

- Vault audit writes now use a Firestore transaction that creates a new event at a random immutable document ID and advances one server-only chain head. Each event contains a SHA-256 hash over a fixed canonical field order, ISO occurrence time, and the prior event hash.
- Concurrent audit writes serialize through the chain-head document. Invalid predecessor hashes and timestamps fail closed. The event body continues to mask actor email and excludes tokens, signed URLs, SSNs, and file content.
- Browser rules deny all reads, creates, updates, and deletes for both `sensitiveVaultAuditEvents` and the new `sensitiveVaultAuditState` collection. The chain provides tamper evidence; it does not claim protection against a fully privileged project administrator or replace external log export in Package 12.
- Local verification passes **81 of 81** core/static tests, Functions syntax, and the diff check. Staging deployment and live synthetic chain verification remain pending at this checkpoint; Production is not authorized.

### 2026-08-29 Staging audit deployment boundary

- Exact commit `acb318844a52ffae76652e9e9c16a3caabc8e443` was deployed only to the `public-intake-v2` Functions codebase in `pal-safety-hub-staging`. All nine functions in that codebase updated successfully; the three vault actions list ACTIVE as Node.js 22 V2 callables in `us-central1`.
- Empty anonymous calls to `getSensitiveIntakeVaultV1`, `requestSensitiveIntakeDownloadV1`, and `approveSensitiveIntakeDownloadV1` each returned HTTP 401 with the expected PAL Office authentication requirement. Anonymous Firestore REST reads of both `sensitiveVaultAuditEvents` and `sensitiveVaultAuditState` returned HTTP 403.
- No Hosting, Firestore rules, Storage rules, Production service, real record, secret, credential, or synthetic identity was created or changed. Production remains closed.
- This verifies deployment health and the unauthenticated/client-denial boundary. It does **not** yet credit live chained-event creation, head consistency, or concurrent-write serialization. The six existing synthetic identities have no stored credentials, and creating a new password, custom token, or other authentication credential was outside the authorization for this step. Those live tests remain pending specific credential authorization or an approved credential-free harness.

### 2026-08-29 live signed-download and audit-chain evidence

- John specifically approved two temporary synthetic Staging accounts and credentials. The harness generated credentials only in memory, printed or stored no password/token, used a harmless synthetic PDF, and refused to run if the Staging audit collection already contained events.
- Two simultaneous entitled vault reads passed. A synthetic driver-license record required approval by a different entitled reviewer; after approval, the requester received a five-minute generation-bound signed URL and downloaded the exact synthetic bytes.
- The first exact-object attempt correctly failed closed when the test upload lacked its recorded SHA-256 metadata. After the synthetic setup supplied the metadata, the signed-URL step exposed a missing `iam.serviceAccounts.signBlob` permission on the Staging runtime identity. The identity received only `roles/iam.serviceAccountTokenCreator` on itself, with no key file or broader Storage grant; after IAM propagation, the complete test passed.
- Four live events formed one valid SHA-256 chain with a matching head after two concurrent writes. Authenticated direct client audit reads returned HTTP 403. Audit inspection confirmed masked actor emails and no raw email, signed URL, token, password, or file content.
- Cleanup passed after every attempt: both temporary Authentication accounts, their user profiles, the synthetic vault record, approval record, audit events/head, and synthetic Storage object were removed. The temporary local and Cloud Shell harnesses were also removed.
- The Staging self-signing grant remains so signed downloads continue to work. It is attached to the current shared default Compute runtime identity; before Production, PAL should use a dedicated keyless vault-download identity so unrelated functions do not inherit signing capability. No Production permission or resource changed.

## Rollback principle

Rollback must never copy newly separated sensitive data back into ordinary intake records or make quarantine objects browser-readable. If the scanner or release service fails, the safe state is continued quarantine and unavailable downloads. Any emergency compatibility rollback requires a separately approved data-handling plan and must preserve vault/audit records.

### 2026-08-29 approved retention and notification policy checkpoint

John approved the following Package 6 policy for new records governed by retention-policy version 2. Existing files and records remain excluded until a separate migration plan is approved.

- Verified Social Security-card and driver-license images become eligible for object deletion 24 hours after recorded identity verification, unless a legal or HR hold exists.
- Infected, error, timeout, unsupported, manual-review, and disputed files remain locked for 30 days for manual review, then become eligible for object deletion unless held.
- A legal or HR hold always overrides deletion. Missing, malformed, legacy, or unversioned retention metadata fails safe to retention.
- Sensitive-vault audit events and the audit-chain head have no automatic deletion. PAL must establish its formal legal retention schedule before that changes.
- In-app notifications are limited to active Admins and active Office users with explicit sensitive-vault entitlement. External email and text notifications remain disabled until separately configured and approved.

The vendor-neutral policy core and tests implement these decisions without deleting an object, scheduling cleanup, sending an external message, touching existing data, or changing Production. The full suite passes 84/84, along with Functions/policy syntax and diff checks. Live Staging deletion and notification behavior remain uncredited until a safe synthetic implementation and rollback test pass.

### 2026-08-29 dedicated Staging vault identity checkpoint

- Created the keyless Staging-only identity `pal-staging-vault-download@pal-safety-hub-staging.iam.gserviceaccount.com` with zero user-managed keys.
- Granted only Firestore data access, log writing, object-viewer access on the existing Staging Firebase bucket, and self-signing on that identity. No scanner bucket, Production, credential-key, owner/editor, or broad Storage role was granted.
- Added a Staging project environment declaration so ordinary Firebase deployments assign all three vault functions to the dedicated identity. A verification deployment proved both Cloud Functions and the serving Cloud Run revisions use that identity and remain ACTIVE.
- Removed the obsolete self-signing grant from the shared default Compute identity after the durable assignment passed. Empty anonymous probes against all three vault functions still return the expected 401 application denial.
- The full 85-test suite, Functions/policy syntax, and diff check pass. A fresh authenticated synthetic signed-download regression is still required before this identity checkpoint is credited as fully equivalent to the prior shared-identity test.

The approved follow-up regression then created two temporary synthetic Staging reviewers with in-memory-only credentials and one unmistakably fake PDF. Both concurrent entitled reads passed; a different reviewer approved the identity-image request; the requester received a five-minute exact-generation URL and downloaded the exact synthetic bytes. Four audit events formed one complete linked chain, authenticated browser-style audit access returned 403, and the audit contained no raw email, token, password, signed URL, or file content. Cleanup removed both temporary accounts, profiles, vault/approval/audit records, chain head, and object. This credits the dedicated identity as functionally equivalent to the prior shared-identity test without leaving credentials or synthetic cloud data behind.

### 2026-08-29 live retention and notification evidence

- Implementation commit `480ecad3df63c4dbdef300f8dc555657f6d98b3b` adds the bounded hourly retention worker, exact-generation deletion precondition, hold/version fail-safe checks, tamper-evident deletion audit, idempotent internal notification records, and server-only notification rules. The full suite passes 86/86 with Functions/policy/worker syntax and diff checks.
- Pre-test inventory found zero Staging sensitive-vault records. The dedicated identity's access on the existing Staging Firebase bucket changed from object viewer to object user so it can delete only exact objects in that bucket; no project-wide Storage role or other bucket was added.
- The scheduled Function is ACTIVE on Node.js 22/us-central1 using the dedicated zero-key identity. Its first immediate forced invocation returned 403 during new-service IAM propagation; the harness failed closed, timed out, and removed every synthetic fixture. A later empty forced run returned 200 before the destructive test was retried.
- The approved live retry used four fake PDFs. Exactly the eligible verified identity image and eligible 31-day error object were generation-bound deleted; the legal-hold identity image and recent infected/manual-review image remained locked and present.
- Two tamper-evident retention-deletion audit events and two idempotent in-app notification records were verified. Notifications targeted the current active Admin/entitled-reviewer audience, with external delivery explicitly false.
- Cleanup removed the synthetic vault, remaining objects, synthetic reviewer, notifications, audit events, and chain head. Existing files, Production, and real PAL data were untouched. Live retention/legal-hold/deletion and internal notification behavior are credited for isolated Staging.

### 2026-08-29 approved false-positive policy checkpoint

John approved a fail-closed false-positive release policy: the requesting entitled reviewer and approving Admin must be different people; the justification is mandatory; a fresh clean rescan must occur after the request; scanner identity and path/generation/size/type/SHA-256 must match the same object; and permanent audit evidence is required. A clean rescan alone cannot make the object downloadable, and human approval without trusted rescan evidence cannot release it.

The predeployment implementation adds separate request/approval actions, a server-only review collection, exact-object trusted-rescan validation, Admin/different-person enforcement, audit events, and an additional download gate. The full suite passes 89/89 with Functions/policy syntax and diff checks. It is not deployed or credited live because the current isolated scanner does not write signed rescan evidence into the vault. Adding that trusted scanner-to-vault handoff requires a new immutable scanner image and another separately approved $0.26 vulnerability scan before Staging can honestly test the complete workflow.

### 2026-08-29 trusted-rescan scanner candidate

- John explicitly approved one additional `$0.26` Artifact Analysis scan. If incurred, this will be the fifth authorized direct scanner scan and raise the direct-scan ledger from `$1.04` to `$1.30`; the approval does not authorize a second replacement push, Production, real data, credentials, or a higher cost boundary.
- The candidate keeps ordinary scans unchanged. Only an object carrying the complete server-created false-positive metadata set is SHA-256 verified and reported to a private identity-authenticated callback. A digest mismatch, incomplete metadata, callback rejection, or callback timeout fails closed before the object moves to a clean or quarantine destination.
- The vault request action checks the original Firebase object identity and copies that exact generation into the isolated rescan bucket with review/path/generation/size/type/SHA-256 binding. The private callback accepts only clean/infected results, validates the same original identity, and records evidence under the configured trusted scanner identity. A different Admin and the existing policy gate are still required for release.
- Patch SHA-256 is `7d75bea8f5c50be29aaaaab7dd8e1c6963b72354d057ce318ce3c0be61cabc01`, based on upstream commit `0db019c9f09494215aa4485b71094e9b8d5ea90b`, with a unique `pal-hardened-rescan-1` image tag. A fresh isolated clone applied it, passed runtime dependency audit with zero findings, compiled, and passed all 36 scanner tests. The PAL repository suite remains 89/89 with Functions syntax passing.
- No image has been pushed or scanned at this checkpoint, so the additional `$0.26` has not yet been incurred. No Staging function, IAM binding, scanner revision, trigger, Production resource, real record, or credential changed.

### 2026-08-29 accepted trusted-rescan scanner image

- The dedicated keyless builder submitted the exact approved candidate as Cloud Build `2dec656e-9c6e-403f-8778-39bef3905120`. The build succeeded and produced immutable digest `sha256:ab00939cb01de07150d20ad643dab338feb19fb31f0033049ad4a6f18e457da5` under tag `pal-hardened-rescan-1`.
- Artifact Analysis reached `FINISHED_SUCCESS` for that exact digest with zero vulnerability findings at every severity and zero malicious-package findings. The image passes PAL's approved scanner-image acceptance gate.
- The fifth authorized `$0.26` direct scan is now incurred. Cumulative authorized direct Artifact Analysis charges are `$1.30`, pending billing reconciliation; Cloud Build, Registry, Storage, and runtime usage remain usage-dependent.
- This checkpoint accepts the immutable image for isolated synthetic Staging integration only. It does not deploy a scanner revision or Function, change IAM, test false-positive release, authorize Production, migrate existing files, or touch real PAL data.

### 2026-08-29 trusted-rescan Staging deployment boundary

- The temporary deployment install surfaced the new UUID advisory `GHSA-w5hq-g745-h8pq` through current Firebase/Google transitive dependencies. Commit `8382ca2` pins patched UUID `11.1.1` for npm and pnpm; npm and pnpm production audits then returned zero known vulnerabilities, Functions syntax passed, and the PAL suite remained 89/89.
- All three false-positive Functions are ACTIVE on Node.js 22/us-central1 with the dedicated zero-key vault identity. The result callback has no public invoker; an anonymous request returns platform 403. Both callable request/approval actions return application 401 to anonymous callers.
- The broad Firebase refresh created the three new actions and updated several existing actions, but the retention-worker refresh attempt reported a 403 because the Compute Engine API remains disabled. PAL did not enable that broader API. The existing retention worker and every inventoried public-intake/vault Function remain ACTIVE; a focused deployment confirmed the request action on the remediated source.
- The vault identity received only `roles/storage.objectCreator` on the isolated unscanned bucket. The scanner identity received only `roles/run.invoker` on the private callback service. No public member, credential key, Firebase-bucket scanner grant, or Production permission was added.
- Accepted digest `sha256:ab00939cb01de07150d20ad643dab338feb19fb31f0033049ad4a6f18e457da5` is serving as private Staging scanner revision `pal-staging-malware-scanner-00006-h4q` under the dedicated scanner identity. Its bounds are restored and verified at min 0, max 1, concurrency 1, with the private callback URL configured.
- This credits deployment health, least-privilege IAM, exact-image configuration, and anonymous fail-closed boundaries. Authenticated two-person false-positive review, scanner callback evidence, final clean release, permanent audit linkage, and complete cleanup remain unverified and require separately approved temporary synthetic accounts.

### 2026-08-29 authenticated false-positive regression — failed closed

- John approved two temporary synthetic Staging accounts and synthetic test data. Two runs used different synthetic reviewers, a harmless 67-byte fake PDF, and the isolated Staging resources only. Both cleanup paths completed; no Production or real PAL record was accessed.
- Run one showed the accepted scanner eventually classify and move the exact rescan object as clean, but the vault did not expose trusted rescan evidence within the four-minute observation window. Run two extended the fail-closed observation window to ten minutes and still did not receive trusted evidence. Retained scanner logs for run two showed health/self-check activity during that interval but no corresponding scan request, placing the observed failure before scanner processing rather than proving a callback rejection.
- Neither run reached human release, signed download, or audit-chain completion. The original vault object remained locked throughout, so the failure did not weaken confidentiality; it demonstrates that the event/callback lifecycle is not yet reliable enough for Production.
- Live false-positive credit is blocked. Correct the handoff lifecycle, then rerun the full same-person denial, different-person approval, exact five-minute generation-bound download, audit-chain/redaction, and complete-cleanup test before preparing any Production proposal.

### 2026-08-29 rescan lifecycle correction — predeployment

- Inspection found that the request action created the isolated rescan object before persisting its callback review record. Because object creation can immediately emit the scanner event, that ordering allowed a fast scanner/callback to arrive before its server-only review target existed.
- The request now creates the pending review first and only then copies the exact generation into the isolated rescan bucket. If copying fails, the review is marked `copy-failed`, the caller receives a locked/unavailable response, and no release path is opened.
- A new static regression enforces review-before-copy ordering and the fail-closed failure state. The full suite passes 90/90, Functions syntax passes, and the diff check passes.
- No Staging or Production deployment is credited here. Focused Staging deployment and the complete approved authenticated two-person synthetic regression remain required.

### 2026-08-29 focused retest and copy-metadata correction — predeployment

- The approved review-before-copy implementation was focus-deployed to Staging. `requestSensitiveFalsePositiveReviewV1` became ACTIVE at `2026-08-29T19:36:24Z` on the dedicated vault identity. The private callback address configured on the scanner exactly matched the ACTIVE callback Function URI; no IAM, image, scan charge, Production, credential, or real-data change occurred.
- A fresh two-account synthetic regression failed closed and completed cleanup. Retained evidence for review `mhOe3brRc2RB0WAGoU1O` showed Eventarc deliver the exact 67-byte object, the accepted scanner classify it CLEAN in 95 ms, move it from the isolated unscanned bucket to the isolated clean bucket, and safely ignore two duplicate deliveries. No approval or download occurred and the original vault object remained locked.
- No matching callback request was logged and the vault never received trusted evidence. The scanner moves only after its reporting helper resolves; that helper returns without a callback when the PAL review label is absent. Comparing the request implementation with the official Cloud Storage `CopyOptions` contract isolated the defect: `contentType`, `cacheControl`, and the custom PAL `metadata` map were incorrectly nested together under the `metadata` property. Custom PAL labels therefore were not presented in the shape the scanner expects.
- The local correction makes `contentType`, `cacheControl`, and `metadata` sibling copy options while preserving the exact source-generation precondition and review-before-copy ordering. A new regression rejects the former nested shape. The complete suite passes 91/91, Functions syntax passes, and the diff check passes.
- This correction is not deployed and live false-positive credit remains blocked. The next boundary is a focused Staging deployment of only `requestSensitiveFalsePositiveReviewV1`, followed by the full approved two-person synthetic scan, same-person denial, different-person approval, generation-bound five-minute download, audit-chain/redaction, and cleanup regression. Production remains closed.

### 2026-08-29 corrected false-positive release regression — passed in Staging

- John approved and PAL focus-deployed only the corrected request action. Firebase reported a successful update and complete deployment; no other Function, IAM binding, scanner image, scan charge, credential, Production component, or real record changed.
- A new isolated run reached trusted exact-object `clean` evidence, denied the requesting reviewer from approving their own exception, accepted approval from a different synthetic Admin, and returned the exact 67-byte object through the existing five-minute generation-bound signed download. Four correlated audit events were present, redaction checks passed, and all temporary accounts, records, review/approval documents, audit events, and bucket objects were removed.
- An initial post-release validation stopped only at offline hash recomputation. Inspection found the stored audit event deliberately has `actorEmailMasked` and no full `actorEmail`, but `auditEvent()` previously regenerated the mask only from the full-email input. This did not change or expose deployed audit data, but it prevented an independent verifier from reproducing a stored event hash.
- The local policy helper now accepts an existing mask only when it matches PAL's strict one- or two-character prefix plus `***@domain` format; a full email or malformed mask in that field becomes empty. Creation from a full actor email remains unchanged. Tests prove a stored event reproduces its original SHA-256 hash and that an unmasked value is rejected. The suite remains 91/91 with policy/Functions syntax and diff checks passing.
- After loading only the corrected verifier into the synthetic harness, the entire workflow returned PASS: two accounts, clean scanner result, same-person denial, different-Admin approval, exact 67-byte download, four valid audit events, prior anonymous callback 403, and complete cleanup. Live false-positive handling is credited in Staging. The verifier helper itself is local/predeployment; Production remains closed.

## Existing Production file treatment plan — no migration authorized

This plan closes the design question without inspecting or changing any real record. It does not authorize execution.

1. Package 6 Production activation, if later approved, applies only to new version-2 sensitive-vault records and newly uploaded objects. It must not label any existing object as scanned, clean, released, or retention-eligible.
2. Existing W-4 fields and payroll/identity files remain legacy records under their current access controls. Office must see an explicit `Legacy — not scanned by Package 6` status; the new signed-release path must fail closed for them.
3. PAL may continue normal business handling of a legacy record only through the pre-cutover workflow. Package 6 must not silently copy, move, hash, download, scan, delete, or rewrite it.
4. Any future migration requires a separate approved inventory based first on metadata only, a record count and storage estimate, legal/HR retention review, employee/privacy notice decision, rollback mapping, bounded synthetic rehearsal, per-batch reconciliation, and explicit authorization before reading file contents.
5. A migration batch must bind every source generation and digest, quarantine before scanning, release only after the same clean/authorization controls, preserve an immutable source-to-destination audit map, and leave the source untouched until PAL approves a separately tested deletion stage.
6. Migration failure leaves both the legacy source and any new copy inaccessible through the clean-release path. Partial copies are quarantined and reconciled; no automatic source deletion or broad retry is allowed.
7. Rollback of a future Package 6 Production activation disables only the new vault/release entry points and scanner trigger. It must not reopen anonymous uploads, expose quarantine, erase audit records, or reinterpret legacy files. Newly created vault objects remain locked pending a separate disposition decision.

The approved default is therefore **no existing-data migration**. This satisfies the Package 6 planning gate while keeping every real-data action separately approval-gated.

The stored-event verifier correction does not require a separate Staging runtime deployment: deployed writers already create the same masked fields and hashes, while the correction enables offline verification of those stored fields. It will remain part of the exact tested source for any later approved Production deployment.

## Office workflow gap and predeployment correction

Read-only Production inventory verified zero Package 6 Functions, scanner services, and Package 6 schedules. Current-client inspection also found that the Office onboarding modal did not invoke any Package 6 callable. Its older generic file renderer could not provide purpose-bound vault status, signed release, false-positive review, or a discoverable independent-approval workflow. Printable onboarding packets also had a payroll/ID file table, which is inappropriate for version-2 sensitive objects even if current separated records no longer populate that legacy field.

The local correction adds the missing end-user security boundary:

- Printable/exported packets contain no sensitive-file link or filename table; they direct authorized staff back to the protected vault.
- Office must enter a specific business purpose before loading vault metadata or requesting a download/review.
- Version-2 files display only fail-closed scan/review status. The browser never calls Storage download APIs for them; it receives a five-minute generation-bound URL only after the server authorizes the request.
- Social Security-card and driver-license requests continue to require a different Admin. A new Admin-only callable lists at most 25 pending download/false-positive approvals, returns no requester email, and creates a chained queue-access audit event. Direct Firestore access stays denied.
- Legacy payroll entries are labeled unscanned and cannot be opened through the protected release path. The no-migration policy is unchanged.
- False-positive controls remain locked until exact clean rescan evidence and a different Admin approval; early, expired, incomplete, and self-approval attempts fail closed in the existing endpoints.

Static regressions verify callable wiring, purpose prompts, no direct sensitive links, no sensitive printable table, Admin-only bounded queue access, and audit coverage. Functions/policy syntax, diff check, and the full suite pass 93/93.

### Office workflow Staging verification

With John's approval, Staging deployed only the new queue callable and Office client, followed by a focused protected-download diagnostic update. The synthetic UI regression verified required-purpose enforcement, non-entitled denial, no direct Storage link, clean non-identity authorization, the bounded Admin queue, different-person identity approval, approval consumption, and a five-minute requester authorization. The automated browser blocked the returned new-tab popup; exact-byte delivery remains credited from the earlier dedicated-identity backend regression rather than overstated as a browser download.

The first request failed closed because the synthetic fixture path was outside the mandatory `quarantine/newHireIntakes/...` namespace. Correcting only that fake fixture made the same flow pass, proving the path-binding policy operated as designed. Bounded diagnostics now distinguish metadata, signing, and audit failures without logging actor email, purpose, intake ID, object path, token, or signed URL.

Hosting packaging inspection also found and closed a source-exposure gap: every maintained Hosting configuration now excludes `functions*/**` and `scanner/**`. Representative live Staging requests for backend and scanner source return 404.

Cleanup verification returned zero temporary Auth accounts, profile/intake/vault documents, approvals/notifications, and synthetic objects. Append-only synthetic audit events remain intact. No Production, real data, IAM, scanner image, credential, or direct scan charge changed. All isolated Staging functional gates are now credited; posted billing reconciliation and an exact Production proposal/approval remain.

## Initial sensitive-upload scanner handoff blocker

The subsequent exact Production-proposal inspection found that the preceding final sentence was too broad. The current first-time upload lifecycle ends at `finalizePublicIntakeUploadV2`: the Firebase-quarantine object is validated and the vault record is stored with `malwareScanStatus: pending`, but no code copies that exact generation into the isolated scanner's unscanned bucket. The accepted scanner's trusted reporting path is deliberately limited to metadata-tagged false-positive rescans, so it does not update an ordinary initial upload record.

The observed behavior fails closed: the object remains private, `downloadable` remains false, and the release policy rejects `pending`. It is nevertheless a Production-blocking availability and lifecycle defect because a legitimate new sensitive upload can never become available to entitled Office staff.

The required correction must preserve these properties:

- validate and persist the authorization/vault target before any scanner event can arrive;
- bind the original Firebase path, generation, byte size, content type, and SHA-256;
- enqueue only the exact verified generation into the private isolated unscanned bucket with an idempotent destination key;
- accept clean/infected/error evidence only from the trusted scanner path and only for the matching pending record;
- keep the original Firebase object locked, use clean evidence only to authorize a later short-lived exact-generation download, and never use the isolated scanner copy as the Office download source;
- record queue, result, retry, and terminal decisions in the chained audit without secrets;
- safely retry a copy/callback interruption without duplicating release or overwriting a terminal result;
- leave legacy/existing objects untouched and require separate authorization for any real-data migration or deletion.

No Production proposal is ready until this first-scan path passes a complete synthetic Staging upload → validation → queue → scanner → result → Office release regression, including infected/error/timeout and retry behavior. A design that changes the accepted scanner image requires a newly pushed digest and separately approved `$0.26` Artifact Analysis scan; a design using new Eventarc/Function identities or bucket permissions requires exact Staging IAM/deployment approval. Production remains closed.
