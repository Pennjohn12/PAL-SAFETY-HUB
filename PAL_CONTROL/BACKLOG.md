# PAL Safety Hub Current Priorities and Backlog

Items are based on repository/production inspection as of 2026-08-25. Priority changes require the PAL owner; completion requires evidence.

## P0 — Governance and production safety

- [ ] **Create dedicated Staging Firebase project.** Separate Auth, Firestore, Storage, Functions, secrets, integrations, and Hosting from production; seed synthetic data only.
- [ ] **Prove deployed commit.** Add a release/build identifier visible to admins or in a public version file and record it after every deployment.
- [ ] **Run production baseline audit.** Role-by-role read-only/minimal-write smoke test and compare deployed rules/functions/hosting to GitHub `main`.
- [ ] **Verify backups and recovery.** Confirm scheduled Firestore backups, Storage retention/versioning, owners, alerts, and a documented restore exercise.

## P1 — Release reliability

- [ ] Add automated checks for HTML/JavaScript syntax, security-rule tests, and critical public/auth workflows.
- [ ] Add protected-branch/PR requirements for `main` and require passing checks before merge.
- [ ] Define release approvers and credential/billing owners.
- [ ] Add staging/sandbox controls for email, SMS, and AI so test calls cannot reach real recipients or production quotas.
- [ ] Inventory active custom domains and document DNS/renewal ownership.

## P2 — Verification and maintainability

- [ ] Break up remaining large inline application code into tested modules incrementally without changing behavior.
- [ ] Expand automated coverage for orientation restart/completion, public intake, project membership, daily access, employee records, tickets/signatures, and offline outbox behavior.
- [ ] Add a controlled data-migration framework with dry-run, counts, logging, and rollback guidance.
- [ ] Review safety/compliance copy and emergency contacts with a qualified PAL safety owner and date the approval.

## Proposed — owner decision needed

- [ ] Create a separate Demo Firebase project with sanitized scripted data and no real integrations.
- [ ] Decide whether Demo resets automatically and whether it is public or access-controlled.
- [ ] Decide whether `pal.jobsiteresources.com` is the permanent production domain and who owns renewal/DNS.

## Backlog rules

- Do not add an item merely because an old chat mentioned it.
- Include a clear outcome, not a vague feature name.
- Remove duplicates and archive completed history in `CHANGE_LOG.md`.
