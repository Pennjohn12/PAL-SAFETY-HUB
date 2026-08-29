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

## Rollback principle

Rollback must never copy newly separated sensitive data back into ordinary intake records or make quarantine objects browser-readable. If the scanner or release service fails, the safe state is continued quarantine and unavailable downloads. Any emergency compatibility rollback requires a separately approved data-handling plan and must preserve vault/audit records.
