# PAL Change and Deployment Log

Newest entries go first. Git history remains the detailed code record.

## 2026-08-29 — Package 6 Staging scanner experiment and cost tracking approved

- John approved the exact measurement-only Staging scanner resources and requested a complete cost breakdown when the security program is finished.
- Added `SECURITY_COST_LEDGER.md` to track estimated and measured incremental costs, billing scope, alerts, free-tier effects, and final reconciliation.
- Approval is limited to the recorded us-east1, keyless, synthetic-only, min-0/max-1/concurrency-1 experiment with a $5 alert and stop boundary. No Production scanner, minimum instance, real file, credential key, or higher ceiling is authorized.
- Enabled the approved Staging APIs, created the keyless scanner service account, and created exactly the three approved isolated `us-east1` buckets. No credential key was created.
- Paused before scanner deployment because safely writing rejected objects requires a fourth isolated quarantine bucket; broad access to or a storage-mode change on the existing Firebase bucket was not applied. Recorded the pre-creation console cost baseline of `$0.00` estimated August charges.

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
