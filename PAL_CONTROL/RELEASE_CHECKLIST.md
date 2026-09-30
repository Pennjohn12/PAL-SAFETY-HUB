# PAL Safety Hub Release and Deployment Checklist

No production deployment is allowed until every applicable required item passes. Record evidence in the PR or change-log entry.

## 1. Scope and checkpoint

- [ ] One release objective is documented with acceptance checks.
- [ ] Work branch is based on the latest `origin/main`.
- [ ] Working tree is understood; unrelated user changes are preserved.
- [ ] Pre-change commit is recorded as the rollback checkpoint.
- [ ] Files and systems touched are compared with `PROTECTED_SYSTEMS.md`.
- [ ] Data migration, security-rule, Function, or integration effects are explicitly documented.

## 2. Automated and local checks

- [ ] Syntax/static checks pass for changed JavaScript and Functions.
- [ ] Relevant automated tests pass.
- [ ] New behavior has regression coverage where practical.
- [ ] Internal notes, secrets, exports, backups, and private files are excluded from Hosting.
- [ ] Firebase configuration targets the intended non-production environment during testing.
- [ ] No real employee, project, signature, certification, or production integration data is used.

## 3. Staging/Test gate

- [ ] Deploy only to the dedicated staging Firebase project.
- [ ] Confirm visible staging banner and environment identity.
- [ ] Smoke test public home, sign-in, orientation/intake, office, foreman, employee records, projects, forms, uploads, and ticket/signature paths as applicable.
- [ ] Test authorization denial as well as successful access for affected roles.
- [ ] Test mobile viewport and offline/reconnect behavior when applicable.
- [ ] Confirm audit records, emails, texts, and AI calls remain in staging/sandbox services.
- [ ] Obtain owner/reviewer acceptance and record it.

## 4. Production readiness

- [ ] PR/change reviewed and merged to `main`.
- [ ] Exact production candidate commit is recorded.
- [ ] Backup/export requirement is assessed; current recovery point is confirmed for data/rules changes.
- [ ] Rules are reviewed before Hosting/Functions when permissions or schemas changed.
- [ ] Release window and release approver are recorded.
- [ ] Rollback steps and responsible person are identified.

## 5. Production deployment

- [ ] Confirm Firebase CLI project is exactly `pal-safety-hub` immediately before deploy.
- [ ] Deploy only the intended targets; do not use an unscoped deploy by habit.
- [ ] Record deploy command, timestamp, operator, Firebase release/version, and Git commit.
- [ ] Run the targeted production smoke test without creating or altering unnecessary real data.
- [ ] Check logs/errors and integration usage immediately after release.

## 6. Closeout

- [ ] Update `MASTER_STATUS.md` only with verified facts.
- [ ] Add a `CHANGE_LOG.md` entry with tests, deployment, commit, and rollback point.
- [ ] Update `BACKLOG.md` and remove stale/duplicate items.
- [ ] Confirm no test accounts/data/files were left in production.
- [ ] If rollback occurred, document cause and open a corrective task.
