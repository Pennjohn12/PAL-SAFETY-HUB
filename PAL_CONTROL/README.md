# PAL Safety Hub Control Center

This folder is the durable operating record for PAL Safety Hub. The current production app and the current GitHub `main` branch are authoritative. Old chats, proposals, and handoffs are background material only and must never override verified code or production behavior.

## Start here

1. Read `MASTER_STATUS.md` and `PROTECTED_SYSTEMS.md`.
2. Refresh GitHub and verify the branch is based on the latest `origin/main`.
3. Give the task one objective and define acceptance checks before editing.
4. Work on a named branch. Never develop directly on `main`.
5. Test with non-production data in the dedicated staging Firebase project when it exists.
6. Record the result in `CHANGE_LOG.md` and update status/backlog only when evidence supports it.
7. Use `RELEASE_CHECKLIST.md` before any production deployment.

## Authority order

1. Observed production behavior and production configuration.
2. Current GitHub `main` code and commit history.
3. This control center, updated from verified evidence.
4. Current task brief.
5. Old chats, proposals, and historical handoffs.

When two sources disagree, stop and resolve the discrepancy using the higher authority. Never make production data match an old handoff.

## Documents

- `MASTER_STATUS.md` — concise current state and evidence.
- `CHANGE_LOG.md` — meaningful changes, tests, releases, and rollbacks.
- `RELEASE_CHECKLIST.md` — staging and production release gates.
- `PROTECTED_SYSTEMS.md` — systems that require explicit review and must not be casually changed.
- `BACKLOG.md` — prioritized, evidence-based work.
- `ENVIRONMENTS.md` — Production, Staging/Test, and Demo separation.
- `TASK_START_TEMPLATE.md` — required opening contract for future PAL task chats.

## Status vocabulary

- **Verified complete**: present in current `main` and confirmed by a test or direct inspection.
- **Implemented, verification needed**: present in code but not fully exercised in the target environment.
- **Pending**: accepted work not yet implemented.
- **Proposed**: idea awaiting owner approval.
- **Blocked**: cannot safely proceed without a dependency or decision.

Do not use “complete” based solely on a chat statement.
