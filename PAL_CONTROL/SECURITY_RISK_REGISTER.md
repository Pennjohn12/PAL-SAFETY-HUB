# PAL Security Inventory and Risk Register

Assessment date: **2026-08-28, America/New_York**  
Source baseline: `origin/main` at `4b2e54e214eebe7615a36ddf6b2c7e7e394199be`  
Production project: `pal-safety-hub`  
Assessment method: read-only source/configuration review, Firebase metadata inspection, live Hosting comparison/header inspection, dependency audit, and existing automated tests. No real employee data was opened and no destructive or exploit testing was performed.

## Security objective

PAL must protect employee identity, payroll, onboarding, safety, certification, project, signature, and operational records through verified identity, least privilege, narrow public access, protected files, trustworthy audit evidence, retention controls, tested recovery, and layered abuse resistance. No internet system can be guaranteed unbreakable; the target is a defensible, least-privilege system that limits exposure and produces evidence that controls work.

## Information inventory

| Classification | Examples | Required handling |
|---|---|---|
| Restricted identity/payroll | Full SSN, Social Security card, W-4, driver license/photo ID, payroll identity files, future banking data | Highest protection; minimize collection; separate from ordinary app records; payroll-only access; log every access; approved retention and secure deletion. |
| Restricted personnel/medical | Home address, date of birth, emergency contact, drug-testing, injury or medical information | Need-to-know access, purpose limitation, access evidence, retention controls, and no public-link exposure. |
| Confidential employee/safety | Certifications, signatures, onboarding state, orientation answers, inspection history, incident and safety forms | Verified employee or assigned staff access; project/employee binding; immutable history where required. |
| Confidential operations | Projects, job numbers, reports, tickets, pricing, photos, documents, payroll hours, foreman notes | Role and project membership; backend authorization; archive protection; auditable changes. |
| Security/administrative | User roles, access grants, audit records, integration settings, usage logs, backup metadata | Admin/Office least privilege; server-attributed changes; strong account protection. |
| Secrets | Email, SMS, AI provider credentials and privileged service credentials | Backend secret manager only; never copy into source, browser code, logs, or this register. |
| Public | Approved public website and intentionally shared, time-limited signing/intake views | Minimize disclosed fields; strong random token; expiration, revocation, replay protection, and rate controls. |

## System and trust-boundary inventory

- Browser/PWA: `index.html`, `projects.html`, service worker, and modular frontend JavaScript.
- Identity: Firebase Authentication with application profiles under `/users/{uid}` and email-based access grants.
- Structured records: Firestore, including users, projects, field forms, reports, employees, intakes, signature requests, daily access, integrations, and audit records.
- Files: Firebase Storage project, employee-certification, and public-intake paths.
- Privileged backend: Firebase Functions using the Admin SDK; these functions bypass client security rules and therefore require their own authorization checks.
- Public capabilities: intake document IDs, ticket-signature tokens, safety-signature tokens, and daily-access tokens.
- External providers: email, SMS, AI, Firebase/Google Cloud Hosting and backups; provider keys are referenced as backend secrets.
- Environments: Production exists; isolated Staging is now partially established with separate Firebase services and guarded frontend routing. Synthetic roles and complete workflow validation are pending. Demo does not exist.
- Recovery: current Firestore backups were listed as `READY`; restore execution and Storage recovery remain unverified.

## Verified protective controls

- HTTPS is active on the Firebase and custom PAL Production URLs.
- Firebase Authentication handles passwords; passwords are not stored by PAL application code.
- Firestore and Storage have default-deny catch-all rules.
- Project reads generally require Office access or explicit project membership.
- Employee records and employee-certification files require Office access in client rules.
- Provider credentials are declared as backend secrets; no credential values were inspected or copied.
- Public ticket, safety, and daily-access identifiers are generated with cryptographically secure randomness in the normal code paths and have expiration checks.
- Important retained project, safety, employee, certification, and intake records cannot normally be deleted by clients.
- Current Firestore backups exist and are reported ready.
- Live deploy-critical Hosting content matches current source after line-ending normalization.
- Existing automated suite passes 43 tests and Functions JavaScript syntax passes.

## Verified risks

| ID | Severity | Verified condition and impact | Evidence | Required treatment |
|---|---|---|---|---|
| PAL-SEC-001 | Critical | Employee Center links authenticated accounts to employee and intake records by email without requiring verified email ownership or an office-approved employee/account link. An unclaimed employee email could expose profile, certification/file URLs, projects, onboarding state, and history. | `functions/index.js` lines 592-685 | Package 8: require verified email plus explicit server-controlled employee link before returning private records. |
| PAL-SEC-002 | High | Any authenticated account can submit an allowed employee form to a project located by name/job number without proving project membership. The Admin SDK write bypasses Firestore rules. | `functions/index.js` lines 693-742 | Packages 8 and 10: require approved employee link and explicit project authorization on the backend; add cross-project denial tests. |
| PAL-SEC-003 | High | Anonymous Storage uploads are allowed under arbitrary public-intake IDs without proving that an open intake exists. Storage accepts broader content types than the backend finalizer. This permits storage/content abuse and bypasses intended validation. | `storage.rules` lines 73-111 | Package 5: server-authorized, expiring, file-bound uploads; narrow types; quotas; quarantine/scanning decision. |
| PAL-SEC-004 | High | Anyone holding an intake ID can read the complete intake document. Public updates are not expired and are blocked for archived records but not generally for completed/Good To Work records when status is unchanged. | `firestore.rules` lines 222-301 | Package 4: remove direct public document access; return only required fields through expiring, revocable backend capabilities; lock completed packets. |
| PAL-SEC-005 | High | Public signature updates permit replacement of the entire nested ticket or safety-data snapshot, not solely the intended signature fields. A link holder can change content associated with the signature. | `firestore.rules` lines 306-367 | Packages 4 and 10: server-side signature application, immutable signed content/hash, narrow input schema, replay and mutation tests. |
| PAL-SEC-006 | Medium | Profile-creation rules allow direct clients to self-create Foreman or Supervisor roles, contrary to the approved admin-assignment policy. The normal UI currently defaults ordinary registration to Employee, but rules are the enforcement boundary. | `firestore.rules` lines 94-116 | Package 7: self-registration creates only unverified Employee; privileged roles require server/admin approval and session revocation. |
| PAL-SEC-007 | Medium | Client-created audit entries bind only `actorUid`; claimed email, name, role, action, details, timestamp, and user-agent are client-controlled. Records are immutable but not trustworthy security evidence. | `firestore.rules` lines 429-449 | Package 12: create security-relevant audit events on trusted backend paths using authenticated/server-derived identity and timestamps. |
| PAL-SEC-008 | Medium | Callable functions currently disable App Check enforcement, increasing automated and unofficial-client abuse exposure. Public workflows require a deliberate exception/control design rather than blanket enforcement. | `functions/index.js` callable configurations | Package 11: endpoint-by-endpoint App Check, throttling, replay protection, quotas, alerts, and recovery design. |
| PAL-SEC-009 | Medium | Production lacks a Content Security Policy. The bare root URL also receives a one-hour cache policy and lacks the configured frame and permissions headers, while explicit HTML paths receive them. | Live response-header inspection and `firebase.json` | Package 11: deploy and verify a compatible CSP and consistent security/cache headers after Staging validation. |
| PAL-SEC-010 | Medium | Production dependency audit reports four high, two moderate, and one low transitive advisories. Exploitability in PAL's execution paths is not yet established. | `pnpm --dir functions audit --prod` on 2026-08-28 | Package 10/14: update in isolation, review breaking changes, retest Functions, and document residual advisories. |

## Verification gaps

These are not confirmed vulnerabilities until evidence establishes the condition.

- Checked-in Firestore and Storage rules have not been proven identical to the deployed Production revisions.
- Deployed Function source has not been mapped conclusively to the current Git commit. An older `us-central1` `submitEmployeeFieldForm` entry is reported with `UNKNOWN` state in addition to the active `us-east1` deployment; callability and removal status require safe verification.
- No Firebase Emulator rule suite verifies the complete anonymous/Employee/Foreman/Supervisor/Office/Admin and cross-project matrix.
- Isolated Staging infrastructure exists, but synthetic role fixtures and complete authorization/abuse tests are not yet established.
- Auth settings such as email verification enforcement, MFA enrollment, password policy, authorized domains, session revocation, and abuse protection require an explicit configuration audit.
- IAM roles, service-account privilege, API-key restrictions, billing alerts, log retention, and secret access policies require a Google Cloud configuration audit without revealing secret values.
- Storage object versioning, malware scanning, download logging, and retention/lifecycle enforcement are unverified.
- Firestore backups exist, but a restore exercise, recovery time/objectives, and Storage-file recovery are unverified.
- Historical public links, current user/role inventory, and existing sensitive-document exposure have not been inspected because this assessment did not access real PAL data.
- No independent penetration test or formal security review has been completed.

## Immediate operating controls pending implementation

- Do not accept new SS cards, W-4s, full SSNs, driver licenses, payroll identity files, banking data, or medical/drug-testing records through PAL until the relevant controls pass Staging tests and are explicitly approved for Production.
- Do not send those documents through ordinary email or retain them in personal camera rolls as a substitute. Use PAL's approved office/payroll process while the secure workflow is rebuilt.
- Do not share or reuse existing intake or signature links.
- Do not add users or elevate roles during the hardening program unless John explicitly authorizes the specific operational need and it is reviewed.
- Do not interpret the current “no one will submit information” instruction as a technical lockdown; existing accounts and links may remain reachable until Package 3 is explicitly authorized and implemented.

## Assessment conclusion

PAL has a meaningful security foundation, but the current handling of identity/payroll data and several backend/public authorization paths do not yet meet the intended high-assurance standard. The security program should proceed before broader use. Package 2 has established the isolated Staging foundation; synthetic roles, hardened rules, and full workflow testing must be completed before the known issues can be safely repaired and verified for Production.
