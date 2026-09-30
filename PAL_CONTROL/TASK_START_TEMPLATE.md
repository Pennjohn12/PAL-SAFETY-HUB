# PAL Task Start Template

Use this at the beginning of every future PAL task chat.

## Copy/paste task contract

> Treat the current production PAL app and current GitHub `main` as authoritative. Old chats and handoffs are reference only. First refresh and inspect the repository, then read `PAL_CONTROL/MASTER_STATUS.md` and `PAL_CONTROL/PROTECTED_SYSTEMS.md`. Do not deploy, modify production data, change security rules, or alter protected systems unless this task explicitly requires it and the release checklist is satisfied.
>
> Objective: [one concrete outcome]
>
> In scope: [specific screens/files/workflows]
>
> Out of scope: [what must remain untouched]
>
> Acceptance checks: [observable pass conditions]
>
> Environment: develop on a named task branch and test in the dedicated Staging Firebase project with synthetic data. Record the baseline commit, tests, resulting commit, and any status/backlog changes in `PAL_CONTROL`.

## Required start-of-task evidence

- Current `origin/main` commit and last relevant commits.
- Clean/dirty working-tree state and preservation plan for existing changes.
- Current production URL/config relevant to the task.
- Protected systems touched, if any.
- Test plan and rollback checkpoint.

## Required closeout

- What changed and what did not.
- Tests and staging verification with results.
- Commit/PR and release status.
- Production impact and rollback point.
- Updates to Master Status, Change Log, and Backlog when warranted.
