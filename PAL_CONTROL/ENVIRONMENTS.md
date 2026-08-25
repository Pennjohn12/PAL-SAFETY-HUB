# PAL Safety Hub Environment Plan

## Required topology

| Environment | Purpose | Firebase/data boundary | Deployment source | Real integrations |
|---|---|---|---|---|
| Production | Actual PAL operations | Existing project `pal-safety-hub`; real PAL data | Approved commit on `main` only | Enabled with approved secrets/caps |
| Staging/Test | Development, QA, acceptance | New dedicated Firebase project; synthetic data and test users only | `staging` branch or approved PR commit | Sandbox/allowlist only |
| Demo | Sales/training/demonstration | Prefer separate Firebase project; sanitized scripted data only | Tagged approved demo build | Disabled or simulated |

## Why a Hosting preview channel is insufficient

The checked-in browser configuration initializes project `pal-safety-hub`. Deploying that code to a different URL without changing environment configuration would still read and write production Auth, Firestore, Storage, and Functions. Preview channels can help inspect static appearance, but they are not a safe application staging boundary.

## Staging implementation plan

1. PAL owner creates/owns a new Firebase project, recommended ID pattern `pal-safety-hub-staging` (final ID depends on availability).
2. Enable only required products and set billing/budgets/alerts deliberately.
3. Register a staging web app and staging Hosting site/domain.
4. Create environment-specific public Firebase configuration; never store secrets in frontend configuration.
5. Deploy equivalent Firestore/Storage rules and Functions with staging-only secrets.
6. Configure email/SMS recipient allowlists and AI caps; make the UI visibly say **STAGING**.
7. Seed synthetic projects, employees, certifications, forms, and role accounts. Do not export/copy production records.
8. Run `RELEASE_CHECKLIST.md` and record the initial staging baseline.

## Branch model

- `main`: production-ready history; production deploys only from a recorded commit here.
- `staging`: integration/acceptance branch deployed only to the dedicated staging project.
- `feat/*`, `fix/*`, `chore/*`: short-lived task branches based on current `main`, merged through review.
- Urgent fixes still branch from current `main`, test in Staging, and retain a rollback checkpoint.

The branch itself does not provide data isolation. Environment configuration and Firebase project boundaries do.

## Promotion flow

`task branch` → automated/local checks → PR/review → deploy exact commit to Staging → acceptance → merge/confirm exact commit on `main` → approved production deploy → smoke test and change-log entry.

## Demo rules

- No production credentials, data, links, phone numbers, email recipients, or secrets.
- Clearly marked DEMO on every page.
- Use disposable accounts and resettable scripted data.
- Do not use Demo as an informal staging environment.

## Current setup status

- Production project: confirmed in repository configuration.
- Staging branch: to be created from the governance baseline after governance changes are committed.
- Dedicated Staging Firebase project: blocked pending creation/ownership in Firebase Console and environment-specific identifiers.
- Demo environment: proposed, not created.
