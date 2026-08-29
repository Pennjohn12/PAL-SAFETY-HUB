# PAL Security Hardening Program

Last updated: **2026-08-29, America/New_York**

This is the durable status tracker for the PAL Safety Hub security program. A package is not complete merely because code exists: its finish line and required evidence must be satisfied. Production remains protected by the approval requirements in `PROTECTED_SYSTEMS.md` and `RELEASE_CHECKLIST.md`.

## Status definitions

- **Not started**: scope is known, but implementation has not begun.
- **In progress**: authorized work is underway; protections are not yet ready to rely on.
- **Passed PAL tests**: implementation and documented PAL tests passed in an isolated environment using synthetic data.
- **Independently verified**: an appropriately independent reviewer validated the control where external validation is applicable.

## Program status

| # | Work package | Status | Finish line / required evidence |
|---|---|---|---|
| 1 | Security inventory and risk register | Passed PAL tests | Current source, configuration, Production metadata, data classes, trust boundaries, controls, verified risks, and verification gaps are recorded in `SECURITY_RISK_REGISTER.md`. No destructive testing or real-data inspection is used. |
| 2 | Isolated Staging/Test environment | Passed PAL tests | Separate Firebase project, Auth, Firestore, Storage, Functions, Hosting, secrets, budgets, alerts, synthetic fixtures, and visible staging banner are verified. No Production data is copied. |
| 3 | Controlled Production maintenance mode | Passed PAL tests | John approved the exact lockdown; existing account and public-link behavior is inventoried; maintenance access, rollback, communication, and verification are documented and Production activation is verified. |
| 4 | Secure public orientation/intake access | Passed PAL tests | Public database reads/writes are replaced by narrow, expiring, server-controlled actions; completed and revoked packets cannot be reopened; tests cover guessed, expired, replayed, and cross-packet access. |
| 5 | Secure sensitive-upload authorization | Passed PAL tests | Uploads require expiring, single-purpose authorization bound to one packet, folder, file, size, and approved content type; abuse limits and malware-handling controls are tested. |
| 6 | Separate sensitive payroll/identity vault and safe file release | In progress | SSNs, W-4s, IDs, payroll, and future banking data are excluded from ordinary app records; least-privilege access, encryption design, retention, malware scanning, quarantine release, and access evidence are approved and tested. |
| 7 | Controlled account and role creation | Not started | Self-registration can create only an unverified, unlinked Employee account; Foreman, Supervisor, Office, Admin, disabled state, and role changes require authorized server/admin workflow and revocation tests. |
| 8 | Verified identity and employee linking | Not started | Email ownership is verified and an office-controlled link is required before private employee records, certifications, projects, onboarding, or history are returned. |
| 9 | MFA and privileged-account protection | Not started | MFA is enforced for Admin and Office accounts; recovery, lost-factor, role-change, disablement, and session-revocation procedures are tested. |
| 10 | End-to-end authorization hardening | Not started | Firestore, Storage, Functions, public links, project membership, files, archives, and backend Admin SDK paths pass role-by-role allow/deny tests. |
| 11 | App Check, throttling, and attack resistance | Not started | Appropriate endpoints enforce App Check; public endpoints have rate/replay/abuse controls; limits, monitoring, and legitimate-client recovery are tested. |
| 12 | Trusted security audit and alerting | Not started | Sensitive reads/downloads/writes, role changes, approvals, denials, and administrative actions are server-attributed, immutable, reviewable, and connected to defined alerts. |
| 13 | Retention, deletion, backup, and recovery | Not started | PAL approves retention rules; automated lifecycle controls, legal/HR exceptions, backups, versioning/PITR, restore exercise, recovery owners, and evidence are documented. |
| 14 | Security and workflow validation | Not started | Automated rule tests, backend authorization tests, manual abuse cases, role matrix, mobile/desktop flows, and complete synthetic orientation/onboarding tests pass in Staging. |
| 15 | PAL Security Package and independent review | Not started | Plain-English security overview, data-flow and access matrix, policies, test results, incident plan, recovery evidence, and independent penetration-test results are assembled and approved. |

## Current program position

- Completed: **5 of 15** packages at the PAL internal-assessment level.
- In progress: **Package 6**. Scanner, signed download, different-person approval, tamper-evident audit, retention/legal-hold/deletion, entitled notification, false-positive handling, and the purpose-bound Office workflow passed in isolated Staging. The bounded Admin queue, no-direct-link/export controls, Hosting source exclusions, and complete synthetic cleanup are verified; all 94/94 tests pass. The no-migration legacy-file plan remains controlling. Posted billing reconciliation and the exact Production proposal/approval remain open in `SENSITIVE_VAULT_DESIGN.md`; Production remains closed.
- Independently verified: **0 of 15** packages.
- Production security deployment authorized: **Package 4 and Package 5 exact cutovers were approved and completed; no further Production change is authorized**.
- Isolated Staging available: **Established for controlled synthetic security work; it is not approved for real PAL data**.
- Sensitive-data operating boundary: PAL has stated that no one will submit information during the hardening work. This is an operating instruction, not a technically enforced Production lockdown.

## Package 2 verified progress

- Firebase project `pal-safety-hub-staging` exists separately from Production.
- A Staging Firebase web app and default Hosting site exist.
- The Firestore API is enabled only on the Staging project.
- The default Staging Firestore database exists in `us-east1`, has deletion protection enabled, and began with closed rules.
- Repository aliases explicitly distinguish `production` and `staging`; the Production default was not changed.
- Billing is attached to Staging with a $5 monthly alert scoped only to the Staging project at 50%, 90%, and 100%; alerts do not enforce a hard spending cap.
- Firestore point-in-time recovery is enabled with seven-day version retention; database deletion protection remains enabled.
- Staging Authentication is initialized with email/password enabled; no synthetic or real users have been created yet.
- A separate `us-east1` Storage bucket exists with closed production-mode rules and no files.
- Staging Hosting is deployed with a permanent synthetic-data warning, no-store caching, no indexing, and frame blocking.
- Browser configuration selects Production only for recognized Production domains. Staging, localhost, and local files select Staging; unknown hosts are blocked.
- Secret Manager infrastructure is enabled but contains no PAL provider secret created by this work. Email, SMS, AI, and scheduled integrations remain absent.
- An isolated Node.js 22 Staging Functions codebase is deployed with one synthetic-data-only health function, `stagingEnvironmentHealth`. It has no provider secrets or Production integrations, is capped at one instance, and is the only listed Staging function.
- An anonymous HTTP invocation of the Staging health function returned `403 Forbidden`; public invocation is therefore not enabled. Authenticated app integration remains to be designed and tested before relying on this endpoint.
- The Staging Artifact Registry cleanup policy removes container images older than one day to limit buildup and cost.
- Staging-specific Firestore rules are deployed with public access denied, cross-user listing denied, verified-email-only employee bootstrap, and no client-controlled role elevation or profile updates.
- Staging Storage remains fully closed for reads and writes until Package 5 defines and validates narrow upload authorization.
- Six reserved-domain synthetic Authentication identities exist for Employee, Foreman, Supervisor, Office, Admin, and disabled-user test cases. The disabled fixture is verified disabled. No passwords or tokens are stored in the repository or governance records.
- Matching synthetic Firestore profiles now exist for all six Authentication fixtures. Each profile records only the fake UID/email, role/access level, environment, test label, and fixture metadata.
- Synthetic project `staging-test-project-001` is labeled `STAGING TEST — NOT REAL` and references only the fake Employee, Foreman, Supervisor, Office, and Admin UIDs. No PAL project or employee data was copied.
- Live Firestore Rules Playground checks verified anonymous denial, verified own-profile access, cross-user denial, unverified-email denial, project denial, profile-update denial, and profile-delete denial.
- Live Storage Rules Playground checks verified anonymous read denial, authenticated read denial, and authenticated upload/create denial. Detailed evidence and limitations are recorded in `STAGING_AUTHORIZATION_EVIDENCE.md`.
- Read-only Staging Authentication review verified email-enumeration protection and narrow default Staging domains, but also found a six-character notify-only password policy, self-sign-up and self-deletion enabled, and MFA/blocking/activity logging unavailable without an Identity Platform upgrade. Evidence is recorded in `STAGING_AUTH_SETTINGS_REVIEW.md`.
- Approved Staging password hardening is applied and verified: Require mode, 12-character minimum, uppercase/lowercase/numeric/special requirements, and force-upgrade-on-sign-in. Self-sign-up remains enabled for controlled tests. The attempt to disable self-delete did not take effect and remains an explicit gap.
- Staging's integration allowlist contains exactly one synthetic health Function. Email, SMS, AI, scheduled jobs, Production function code, and provider credentials remain absent, as recorded in `STAGING_INTEGRATION_BOUNDARY.md`.
- The core automated suite passes **54 of 54**, including Staging host isolation, banner/header checks, isolated backend configuration, static assertions for the Staging rule boundaries and synthetic project membership, and fixture checks that reject credentials/non-reserved email domains and require unmistakable test labeling. Firebase compiled and released the updated Firestore rule successfully.
- A separate Firebase Local Emulator Suite passes **10 of 10** authorization tests against the actual Staging rule files. It verifies explicit active project-member reads while denying outsiders, the disabled fixture, lists, mutations, and all tested Storage access. The earlier live Rules Playground membership simulation remained inconclusive, but the same allow path is now behaviorally verified in the emulator.
- Emulator tests first verified and then regression-tested repairs for two Staging workflow defects: registration now writes the constrained profile shape accepted by the rule, and Boolean synthetic bootstrap profiles can satisfy the verified-member predicate. Unverified accounts still cannot read profiles or project data, and no live credential was created or changed.
- The corrected rules and Staging-only registration path are deployed to `pal-safety-hub-staging`. Live Hosting verification passed HTTP, cache, frame, indexing, banner, and corrected-content checks.
- A live Staging lifecycle test created a temporary unverified reserved-domain account, created only its constrained Employee profile, verified the profile read was denied before email verification, and removed both the exact profile and account. No credential was printed or retained.
- Package 2 finish line: **Passed PAL tests on 2026-08-28**. MFA and privileged-account controls remain assigned to Package 9; controlled account deletion and role lifecycle remain assigned to Package 7; complete workflow validation remains assigned to Package 14.

## Sequencing

The default sequence is Package 2 (Staging), then an explicitly authorized Package 3 lockdown decision, followed by Packages 4 through 10 for the known access and privacy risks. Packages 11 through 15 add abuse resistance, evidence, recovery, broad validation, and independent assurance. Cross-module or Production-impacting work must be coordinated through **00 — PAL CONTROL ROOM**.

## Package 3 verified progress

- Control Room coordination is active and the dedicated branch is `codex/security-package-3-maintenance`.
- Production inventory identified two Hosting domains/site aliases, current public and signed-in Firestore/Storage paths, 12 active interactive Function endpoints, two scheduled Functions, and one stale central-region Function entry whose endpoint returned 404.
- Deployed Production Firestore and Storage rule text matched the checked-in rules after line-ending normalization on 2026-08-29. No Production data document was opened for this comparison.
- A static one-page maintenance site, deny-all Firestore/Storage rules, endpoint-coverage harness, exact affected-flow inventory, two-hour stop condition, user notices, and rollback runbook are recorded in `PRODUCTION_MAINTENANCE_RUNBOOK.md`.
- Automated evidence passes: 59 core/static checks, 6 maintenance rule emulator checks, and 12 maintenance endpoint emulator checks.
- Staging activation and rollback rehearsal passed. All tested old/public routes served identical maintenance content; anonymous Firestore access was denied; normal Staging Hosting/rules were restored; the 10-test normal Staging authorization suite passed afterward.
- Production activation passed on 2026-08-28: both Hosting domains and representative legacy/public routes serve the protected maintenance page; Firestore and Storage deny anonymous synthetic probes; all 12 active interactive Functions reject anonymous invocation at the platform boundary; and the two exact Scheduler jobs are paused.
- Package 3 finish line: **Passed PAL tests on 2026-08-28**. Production activation and technical rollback were verified, but the 10:39 PM deadline was missed and corrective rollback completed at approximately 12:23 AM on 2026-08-29. This operational-control failure is recorded and must be addressed before another time-bounded Production window.

## Package 4 verified progress

- The verified ID-only public-intake authorization vulnerability is replaced by a separate random, packet-bound token whose SHA-256 hash is stored server-side.
- Four narrow callable Functions issue, read, update, and finalize intake activity. Link issuance requires an active authenticated Office/Admin profile; public actions validate token, packet, expiry, revocation, archive, and completion state.
- Direct public Firestore reads and writes for `newHireIntakes` are removed. Missing and legacy links fail closed without creating a writable fallback packet.
- Tokens expire after 14 days by default, may not exceed 30 days, are replaced when reissued, and are revoked during final submission so completed packets cannot be replayed.
- Core/static tests pass **63 of 63** and the synthetic Firebase emulator suite passes **5 of 5**, covering direct access, guesses, cross-packet use, expiry, revocation, narrow writes, completion, replay, and anonymous issuance.
- Staging Hosting serves the V2 client and visibly rejects an ID-only synthetic link. All four Staging Functions are ACTIVE on Node.js 22; their Cloud Run invoker bindings permit request delivery, while empty anonymous calls are rejected by application authorization with 401/403 responses.
- No real PAL record, account, credential, or file was opened or modified. Staging Storage remains closed; the remaining raw upload authorization boundary belongs to Package 5.
- Existing Production ID-only links require replacement after cutover. No Production deployment or real-record migration is authorized. Exact behavior, migration, later-package boundaries, proposed deployment, and rollback are recorded in `PUBLIC_INTAKE_SECURITY_V2.md`.
- Package 4 finish line: **Passed PAL tests on 2026-08-29**. John approved the exact commit and acknowledged that existing ID-only links require replacement; the four Functions, Hosting client, and hardened Firestore rules are active in Production.

## Package 5 verified progress

- Direct anonymous intake Storage writes are removed in the tested rules. Public browsers must obtain a 15-minute, single-file backend grant bound to packet, folder, backend-selected quarantine path, label, extension, content type, and byte size.
- Finalization requires a separate grant secret and verifies token state, expiry, replay, binding, stored metadata, exact size/type, and file signature. Mismatches are rejected and their completed object is deleted.
- Accepted files remain browser-inaccessible quarantine with explicit pending-malware status; the system does not claim that file-signature checks are malware scanning.
- Abuse limits enforce 25 MiB per file, 12 files and 100 MiB saved data per packet, and 12 grants per packet per hour.
- Hourly cleanup expires unused grants and removes completed-but-unfinalized quarantine objects. Grant lifecycle records and structured cleanup logs provide limited operational evidence; Package 12 remains responsible for immutable audit coverage.
- Core/static tests pass **68 of 68** and the synthetic Firebase emulator suite passes **10 of 10**.
- Staging Hosting, five public V2 callables including the new grant issuer, and the non-public hourly cleanup Function are active. Empty live requests reach expected application denials. Staging Storage remains closed to clients.
- No real PAL record, account, credential, or file was opened or modified. Existing files are not migrated; new quarantined files remain unavailable until a later approved scanning/release control.
- John approved tested commit `7cbe1c8e866aebf8fd7b0c61bb55b22ec710764c` after explicitly acknowledging that new public uploads remain unavailable in quarantine until the later scan/release control.
- Production activation passed on 2026-08-29: five public application callables and the non-public scheduled cleanup are ACTIVE on Node.js 22 in `us-central1`; both Hosting domains serve the grant-based client; direct anonymous access to the active Storage bucket is denied; invalid empty create/finalize requests fail at application authorization; and the enabled hourly cleanup completed a forced Production run successfully.
- Package 5 finish line: **Passed PAL tests / Production active on 2026-08-29**. Malware scanning and controlled quarantine release are now explicitly assigned to Package 6 with the sensitive vault work.
