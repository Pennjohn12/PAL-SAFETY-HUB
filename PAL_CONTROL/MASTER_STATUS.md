# PAL Safety Hub Master Status

Last verified: **2026-08-30, America/New_York**

## Current Production status

- Status: **Online; Package 5 secure public-upload controls are active.**
- Production URL: `https://pal-safety-hub.web.app/`
- Custom PAL URL: `https://pal.jobsiteresources.com/`
- Firebase project: `pal-safety-hub`
- Current Production security build: `7cbe1c8e866aebf8fd7b0c61bb55b22ec710764c` on `codex/security-package-5-upload-authorization`.
- Pre-maintenance Production Hosting version: `d9ef60e643ff9f11`
- Pre-maintenance Production release time: `2026-08-28T18:01:25.005Z`
- Deployment identity: `jvpanettiere@gmail.com`
- Evidence: live `index.html`, `projects.html`, Firebase client configuration, `manifest.json`, and `sw.js` matched the Git blobs at the Production commit.
- Firestore and Storage rule text was compared read-only in the Firebase console on 2026-08-29 and matched the checked-in rules after line-ending normalization. Deployed Function source equivalence remains unverified.
- Package 3 maintenance activation began at approximately 8:39 PM America/New_York on 2026-08-28 with John's explicit approval. Its 10:39 PM rollback deadline was missed because the scheduled safeguard did not execute. Corrective rollback completed at approximately 12:23 AM on 2026-08-29: normal Hosting and rules were restored from commit `4b2e54e`, all 12 recorded invoker bindings were restored, and both exact Scheduler jobs were enabled. The failure and corrective evidence are recorded in `PRODUCTION_MAINTENANCE_RUNBOOK.md`.

## Current source and Git checkpoint

- Repository: `https://github.com/Pennjohn12/PAL-SAFETY-HUB`
- Authoritative source branch: `main`
- Current Source Commit: `4b2e54e214eebe7615a36ddf6b2c7e7e394199be`
- Subject: `Route Employee Center history through east region`
- Local `main`: safely fast-forwarded to the same commit on 2026-08-28.
- Governance refresh branch: `codex/pal-governance-refresh`, based directly on the source commit above.
- Preserved local QA fixtures: five clearly marked `PAL_QA_*_NOT_REAL.pdf` files under `tests/fixtures/`; untracked and not altered.

## Staging/Test status

- Package 6 corrected initial-scan image `sha256:e0de7bbb029eb9d342bd56b9e215fab33d39f27eb3fe23f42728ed920cedd7cb` passed its image-security gate and the separated first-scan lifecycle in isolated Staging. Certification clean/release, payroll/identity clean/two-person release, encrypted-file locked manual review, and automatic recovery from `scan-queue-failed` all passed. A second forced recovery left the terminal result and single audit event unchanged. All temporary data was cleaned and Staging was rolled back to `pal-staging-malware-scanner-00010-p6g`; temporary callback/viewer access is absent and retry is PAUSED. Production and real data remain prohibited.
- Package 6 cost reconciliation found 40 posted Container Images Scanned units / `$10.40`, versus nine explicitly approved scanner-candidate units / `$2.34`. Current inventory has 10 dedicated scanner digests and 36 Cloud Functions-managed digests, confirming the cost boundary was broader than assumed. All discretionary Staging builds, deployments, scans, and runtime tests are stopped pending John's approval of an exact repository-scoped cost-control policy. This is a billing-control issue, not a security breach; Production remains unchanged.
- John approved repository-scoped cost control. Staging `gcf-artifacts` in `us-central1` and `us-east1` now verify `SCANNING_DISABLED`; dedicated `us-east1/malware-scanner` verifies `SCANNING_ACTIVE`. This prevents ordinary Staging Function deployments from silently entering the paid scan scope while preserving the required paid gate for each new scanner digest. The loss of automatic Function-container scanning is recorded as the accepted security tradeoff. No Production setting changed.

- GitHub branch `staging` exists but is stale and is not an environment boundary.
- Dedicated Firebase project `pal-safety-hub-staging` is configured separately from Production.
- Staging Hosting, Auth, Firestore/PITR, hardened bootstrap Firestore rules, closed empty Storage, environment routing, and a visible synthetic-data warning are established.
- One isolated synthetic-data-only health Function is active; it contains no Production integrations or secrets and anonymous invocation was denied.
- Six synthetic Staging Authentication identities and matching Firestore profiles now cover Employee, Foreman, Supervisor, Office, Admin, and disabled-user cases; no credentials are stored in source. One unmistakably fake Staging project references only those synthetic identities.
- Live Rules Playground checks passed the current bootstrap boundary: own verified profile allowed; anonymous, cross-user, unverified-email, project, profile-mutation, and all tested Storage access denied.
- Read-only Auth settings review found email-enumeration protection enabled and narrow default Staging domains; MFA, blocking functions, and Auth activity logging require an Identity Platform upgrade.
- Staging password policy is now enforced at 12 characters with uppercase, lowercase, numeric, special-character, and forced-upgrade requirements. Self-sign-up remains enabled for testing. The console did not accept the approved self-delete restriction, so self-delete remains enabled and tracked as a gap.
- Staging integration allowlist is currently limited to the single synthetic health Function; email, SMS, AI, schedules, Production Function code, and provider credentials remain absent.
- A narrow synthetic project-member read rule compiled and deployed to Staging; lists and all project writes remain denied. Its earlier live Rules Playground simulation was inconclusive, but the same authorization path passed local Firebase emulator behavior tests.
- Status: **Established for controlled synthetic security work. Do not use real PAL data and do not perform write-based application testing against Production.**

## Demo status

- No isolated Demo Firebase environment was verified.
- Status: **Not established.**

## Completed / verified features

Present in current source and covered by current automated checks where noted:

- PAL public/PWA experience and signed-in role dashboards.
- Project operations, reports, field forms, tickets/signatures, documents, and offline form queue.
- Employee onboarding, orientation, payroll-waiver, certification, and Good To Work flows.
- My PAL Employee Center with authenticated form access, submission, history, safe inspection reuse, and fixed return paths.
- Foreman operations and daily access workflows.
- Email, SMS, AI, integration-health, onboarding, daily-access, and Employee Center callable Functions in source.
- Firestore and Storage rules, audit model, archive protections, and backup-export support in source.
- Production Hosting availability and source match at the commit recorded above.

## Testing / QA baseline

- Automated tests: **54 passed, 0 failed** on 2026-08-28.
- Staging Firebase emulator authorization tests: **10 passed, 0 failed** on 2026-08-28. The added tests safely reproduced and regression-tested repairs for registration/profile and synthetic-marker incompatibilities without creating live credentials.
- Package 3 maintenance tests: **5 static, 6 deny-all rule-emulator, and 12 endpoint-emulator tests passed** on 2026-08-29. Staging activation and rollback also passed.
- Package 4 public-intake tests: **63 core/static and 5 synthetic emulator tests passed** on 2026-08-29. Staging and Production Hosting and four token-enforcing Functions are verified; Production direct intake reads/writes are closed.
- Package 5 secure-upload tests: **68 core/static and 10 synthetic emulator tests passed** on 2026-08-29. Staging and Production grant issuance, quarantine/finalization, hardened Storage rules, and hourly cleanup are active. The Production cleanup job also passed a forced run.
- Test files: all current `tests/*.test.mjs` files.
- Functions JavaScript syntax: **passed** for `functions/index.js`.
- Production Hosting comparison: **passed** for five deploy-critical frontend files.
- Not yet verified in this checkpoint: full signed-in role-by-role Production smoke testing; deployed Functions source equivalence; deployed Firestore/Storage rules equivalence; backup restore exercise.

## Known issues / verification gaps

- Staging is established for synthetic security work; broad end-to-end workflow validation belongs to Package 14. Demo does not exist.
- Production releases lack a built-in visible Git commit identifier; current mapping required content hashing.
- Deployed Functions need a separate evidence-backed source revision comparison; Firestore and Storage rule text now matches source.
- Backup configuration is documented as active, but a current restore exercise is not verified here.
- Stale remote `staging` and `chore/pal-governance` branches must not overwrite current `main`.

## Active priorities

1. Execute the 15-package security hardening program recorded in `SECURITY_PROGRAM.md`.
2. Complete synthetic identities, hardened rules, and isolated workflow validation in the dedicated Staging project.
3. Repair the verified identity-linking, backend project-authorization, public-intake, upload, signature, and role-creation risks in `SECURITY_RISK_REGISTER.md`.
4. Add a release/build identifier tied to the Git commit.
5. Add automated rule tests and broader critical-workflow coverage.
6. Verify deployed Functions, rules, backup jobs, and recovery procedure.
7. Decide whether Demo requires its own isolated Firebase project.

## Security program status

- Package 1 of 15, Security inventory and risk register: **Passed PAL tests** on 2026-08-28 through read-only evidence review.
- Package 2 of 15, isolated Staging/Test environment: **Passed PAL tests** on 2026-08-28. The separate project has isolated Hosting, Auth, Firestore/PITR, hardened rules, closed Storage, a $5 monthly alert, environment guards, a visible test-data banner, one isolated health Function, synthetic identities/profiles/project data, 10 passing emulator tests, and a successful temporary-account live lifecycle with complete cleanup. MFA is tracked in Package 9, account/role lifecycle in Package 7, and broad workflow validation in Package 14.
- Package 3 of 15, controlled Production maintenance mode: **Passed PAL tests** on 2026-08-28. Layered Hosting, deny-all Firestore/Storage rules, Function invocation lockdown, schedule pause, communication, two-hour stop, and rollback controls are recorded in `PRODUCTION_MAINTENANCE_RUNBOOK.md`; Staging activation/rollback and Production activation verification passed.
- Package 4 of 15, secure public orientation/intake access: **Passed PAL tests / Production active** on 2026-08-29. Expiring packet-bound tokens, narrow server actions, direct Firestore denial, completion lockout, and legacy-link failure are verified. Existing ID-only links now require PAL Office replacement.
- Package 5 of 15, secure sensitive-upload authorization: **Passed PAL tests / Production active** on 2026-08-29. Single-file grants, packet/folder/type/size binding, replay denial, quarantine, limits, invalid-object removal, and cleanup are active. New files intentionally remain unavailable; malware scanning and controlled release are explicitly assigned to Package 6.
- Package 6 of 15, sensitive vault and safe release: **In progress / Production closed** on 2026-08-30. Existing release/audit, approval, retention, notification, false-positive, legacy, Office, certification-clean, payroll/identity-clean, encrypted-file manual-review, and retry-recovery/idempotency gates are credited in isolated Staging. Staging was safely rolled back with temporary access removed and retry PAUSED; all named synthetic records/objects/users were cleaned. Posted billing reconciliation and an exact Production proposal remain open. No Production or real-data action occurred.
- Packages independently verified: **0 of 15**.
- Sensitive-data boundary: no new SS cards, W-4s, full SSNs, driver licenses, payroll identity files, banking data, or medical/drug-testing records should be accepted through PAL during hardening.
- Package 3 proved the technical maintenance boundary and rollback, but the Production maintenance controls are no longer active.
- Detailed status: `SECURITY_PROGRAM.md`. Verified risks and gaps: `SECURITY_RISK_REGISTER.md`.

## Production authorization

No Production deployment is authorized by this document. John must explicitly approve each Production deployment.
