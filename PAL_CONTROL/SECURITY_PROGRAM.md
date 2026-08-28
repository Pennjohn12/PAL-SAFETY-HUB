# PAL Security Hardening Program

Last updated: **2026-08-28, America/New_York**

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
| 2 | Isolated Staging/Test environment | In progress | Separate Firebase project, Auth, Firestore, Storage, Functions, Hosting, secrets, budgets, alerts, synthetic fixtures, and visible staging banner are verified. No Production data is copied. |
| 3 | Controlled Production maintenance mode | Not started | John approves the exact lockdown; existing account and public-link behavior is inventoried; maintenance access, rollback, communication, and verification are documented. |
| 4 | Secure public orientation/intake access | Not started | Public database reads/writes are replaced by narrow, expiring, server-controlled actions; completed and revoked packets cannot be reopened; tests cover guessed, expired, replayed, and cross-packet access. |
| 5 | Secure sensitive-upload authorization | Not started | Uploads require expiring, single-purpose authorization bound to one packet, folder, file, size, and approved content type; abuse limits and malware-handling controls are tested. |
| 6 | Separate sensitive payroll/identity vault | Not started | SSNs, W-4s, IDs, payroll, and future banking data are excluded from ordinary app records; least-privilege access, encryption design, retention, and access evidence are approved and tested. |
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

- Completed: **1 of 15** packages at the PAL internal-assessment level.
- In progress: **Package 2 — Isolated Staging/Test environment**.
- Independently verified: **0 of 15** packages.
- Production security deployment authorized: **No**.
- Isolated Staging available: **Partially established; safe foundation available, synthetic role fixtures and full workflow validation remain incomplete**.
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
- A separate Firebase Local Emulator Suite passes **7 of 7** authorization tests against the actual Staging rule files. It verifies explicit active project-member reads while denying outsiders, the disabled fixture, lists, mutations, and all tested Storage access. The earlier live Rules Playground membership simulation remained inconclusive, but the same allow path is now behaviorally verified in the emulator.
- Not complete: approved MFA/Identity Platform decision, self-delete restriction, and end-to-end role/workflow verification.

## Sequencing

The default sequence is Package 2 (Staging), then an explicitly authorized Package 3 lockdown decision, followed by Packages 4 through 10 for the known access and privacy risks. Packages 11 through 15 add abuse resistance, evidence, recovery, broad validation, and independent assurance. Cross-module or Production-impacting work must be coordinated through **00 — PAL CONTROL ROOM**.
