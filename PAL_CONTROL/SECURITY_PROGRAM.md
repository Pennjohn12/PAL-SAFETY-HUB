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
| 2 | Isolated Staging/Test environment | Not started | Separate Firebase project, Auth, Firestore, Storage, Functions, Hosting, secrets, budgets, alerts, synthetic fixtures, and visible staging banner are verified. No Production data is copied. |
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
- Independently verified: **0 of 15** packages.
- Production security deployment authorized: **No**.
- Isolated Staging available: **No**.
- Sensitive-data operating boundary: PAL has stated that no one will submit information during the hardening work. This is an operating instruction, not a technically enforced Production lockdown.

## Sequencing

The default sequence is Package 2 (Staging), then an explicitly authorized Package 3 lockdown decision, followed by Packages 4 through 10 for the known access and privacy risks. Packages 11 through 15 add abuse resistance, evidence, recovery, broad validation, and independent assurance. Cross-module or Production-impacting work must be coordinated through **00 — PAL CONTROL ROOM**.
