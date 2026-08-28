# PAL Release Checklist

## Before any change

- [ ] Fetch GitHub; record current `origin/main` and Production commits.
- [ ] Confirm the working tree and preserve unrelated/untracked work.
- [ ] Verify the request is not already implemented.
- [ ] Create a named checkpoint/task branch from current `main`.
- [ ] Identify protected systems, data/schema effects, and rollback point.

## Staging gate

- [ ] Use the isolated Staging Firebase project and synthetic data only.
- [ ] Record the exact deployed commit and environment configuration.
- [ ] Run all automated tests and Functions syntax checks.
- [ ] Test affected roles, mobile/desktop behavior, failure paths, permissions, and persistence.
- [ ] Confirm test email/SMS cannot reach unintended real recipients.
- [ ] Record results and unresolved risks in the living records.

## Production gate

- [ ] Obtain John's explicit approval for this specific Production deployment.
- [ ] Confirm the exact commit and clean release checkout.
- [ ] Confirm rules, Functions, Hosting target, secrets, and migrations in scope.
- [ ] Confirm backup/recovery readiness and rollback target.
- [ ] Deploy only the approved components; never deploy incidental local files.
- [ ] Run focused Production smoke tests without deleting or corrupting real data.
- [ ] Record release time, deployer, commit, components, validation, and rollback point in `CHANGE_LOG.md`.

If any required evidence is missing, stop the release.
