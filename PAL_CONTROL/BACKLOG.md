# Active Priorities and Backlog

Only evidence-based, current work belongs here. Completed history moves to `CHANGE_LOG.md`.

## P0 — Environment and release safety

- [ ] Execute Packages 5-15 in `SECURITY_PROGRAM.md`; Packages 1-4 passed PAL tests.
- [x] Create the dedicated Firebase Staging project and seed synthetic data. Package 2 passed PAL tests on 2026-08-28.
- [ ] Close verified critical/high identity-linking, backend project-authorization, public-intake, upload, and signature risks before broader use.
- [x] Replace public intake document-ID access with expiring packet-bound tokens and narrow server actions. Package 4 passed PAL tests; Production cutover remains separately gated.
- [x] Decide, explicitly authorize, activate, verify, and roll back controlled Production maintenance lockdown. Package 3 passed PAL tests; the rollback deadline miss is documented and requires a stronger execution safeguard before reuse.
- [ ] Replace reminder-only rollback timing with an actively monitored, confirmed execution mechanism before the next time-bounded Production maintenance window.
- [ ] Add a release identifier that exposes the deployed Git commit.
- [ ] Verify deployed Functions, Firestore rules, and Storage rules against source.
- [ ] Confirm backup jobs and complete a documented recovery exercise.

## P1 — Quality gates

- [x] Add the initial automated Firebase rule suite; 10 Staging authorization cases pass. Broader workflow coverage remains in Package 14.
- [ ] Require reviewed, passing changes before updating `main`.
- [ ] Establish staging recipient allowlists and cost caps for email, SMS, and AI.
- [ ] Record domain, DNS, billing, credential, and release ownership.

## Owner decisions

- [ ] Decide whether to create a separate Demo Firebase project.
- [ ] Approve the formal record-retention schedule before any irreversible retention lock.

Do not add or implement an item solely because an old chat or TODO mentions it.
