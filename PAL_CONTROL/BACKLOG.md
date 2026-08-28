# Active Priorities and Backlog

Only evidence-based, current work belongs here. Completed history moves to `CHANGE_LOG.md`.

## P0 — Environment and release safety

- [ ] Execute Packages 2-15 in `SECURITY_PROGRAM.md`; Package 1 inventory/risk register passed internal PAL review on 2026-08-28.
- [ ] Create the dedicated Firebase Staging project and seed synthetic data.
- [ ] Close verified critical/high identity-linking, backend project-authorization, public-intake, upload, and signature risks before broader use.
- [ ] Decide and explicitly authorize the exact Production maintenance-lockdown behavior; the current no-submission instruction is not a technical control.
- [ ] Add a release identifier that exposes the deployed Git commit.
- [ ] Verify deployed Functions, Firestore rules, and Storage rules against source.
- [ ] Confirm backup jobs and complete a documented recovery exercise.

## P1 — Quality gates

- [ ] Add automated Firebase rules tests and critical integration tests.
- [ ] Require reviewed, passing changes before updating `main`.
- [ ] Establish staging recipient allowlists and cost caps for email, SMS, and AI.
- [ ] Record domain, DNS, billing, credential, and release ownership.

## Owner decisions

- [ ] Decide whether to create a separate Demo Firebase project.
- [ ] Approve the formal record-retention schedule before any irreversible retention lock.

Do not add or implement an item solely because an old chat or TODO mentions it.
