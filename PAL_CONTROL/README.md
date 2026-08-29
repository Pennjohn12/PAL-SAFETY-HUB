# PAL Control Room

This folder is the concise living record for PAL Safety Hub. Current verified Production state and current GitHub `main` outrank old chats, handoffs, recovery folders, proposals, and historical TODO lists.

## Start every PAL task here

1. Read `MASTER_STATUS.md` and `PROTECTED_SYSTEMS.md`.
2. Fetch GitHub and verify the current `origin/main` commit and working tree before editing.
3. Check whether the requested work already exists.
4. Create a checkpoint/task branch from current `main`.
5. Test significant changes in an isolated Staging environment using synthetic data.
6. Update these records from evidence, not assumptions.
7. Never deploy Production without John's explicit approval for that deployment.

## Records

- `MASTER_STATUS.md`: current Production, source, staging, demo, priorities, features, issues, and QA.
- `PROTECTED_SYSTEMS.md`: systems that must not be changed casually.
- `ENVIRONMENTS.md`: safe Production/Staging/Demo boundaries.
- `RELEASE_CHECKLIST.md`: staging and Production release gates.
- `CHANGE_LOG.md`: concise change, deployment, Git checkpoint, and verification history.
- `BACKLOG.md`: active evidence-based priorities only.
- `SECURITY_PROGRAM.md`: durable status of the 15 security hardening work packages.
- `SECURITY_RISK_REGISTER.md`: current security inventory, verified risks, controls, and verification gaps.
- `SECURITY_COST_LEDGER.md`: incremental security-program estimates, measured costs, alerts, and final reconciliation requirements.
- `TASK_START_TEMPLATE.md`: opening contract for module/task work.

Keep current facts in `MASTER_STATUS.md`, history in `CHANGE_LOG.md`, and future work in `BACKLOG.md`. Do not create growing narrative handoffs.
