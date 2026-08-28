# PAL Change and Deployment Log

Newest entries go first. Git history remains the detailed code record.

## 2026-08-28 — Security program Package 2 started

- Objective and scope: establish a Firebase Staging environment isolated from Production and restricted to synthetic data.
- Created Staging project `pal-safety-hub-staging`, its Firebase web app, and default Hosting site.
- Enabled the Firestore API for Staging and created the default database in `us-east1` with deletion protection and initially closed rules.
- Added explicit repository aliases for Production and Staging without changing the existing Production default.
- Billing-dependent controls remain incomplete: point-in-time recovery, Storage, Functions, budgets, and alerts.
- No Staging or Production deployment occurred. No Production configuration, secret, user, permission, or data was accessed or changed.
- Safety gate: do not deploy the current frontend to Staging until its Firebase configuration is isolated from Production and a visible staging banner is present.

## 2026-08-28 — Security program Package 1 baseline

- Objective and scope: create the durable 15-package security tracker and evidence-based security inventory/risk register; documentation only.
- Starting source/Production commit: `4b2e54e214eebe7615a36ddf6b2c7e7e394199be`.
- Branch: `codex/security-baseline-program`, created with the verified `main` commit plus the governance-baseline commit as its ancestry.
- Verified findings: one Critical, four High, and five Medium source/configuration risks; verification gaps are separately identified and are not presented as confirmed vulnerabilities.
- Evidence: current source/rules/functions, Firebase project/Hosting/Functions/backup metadata, live Hosting content and headers, dependency audit, and 43 passing automated tests.
- Data and Production impact: none. No real records were opened; no account, permission, rule, Function, Hosting, secret, or Production configuration was changed.
- Preserved local work: five untracked synthetic `PAL_QA_*_NOT_REAL.pdf` fixtures were not altered.
- Follow-up: Package 2 must establish isolated Staging before write-based authorization testing or security implementation.

## 2026-08-28 — Verified clean source/Production checkpoint

- Current Source Commit: `4b2e54e214eebe7615a36ddf6b2c7e7e394199be` — `Route Employee Center history through east region`.
- Current Production Commit: `4b2e54e214eebe7615a36ddf6b2c7e7e394199be`, established by exact live/source hashes for five deploy-critical Hosting files.
- Production Hosting version: `d9ef60e643ff9f11`; released `2026-08-28T18:01:25.005Z` by `jvpanettiere@gmail.com`.
- Local `main` safely fast-forwarded from `c6b6a2f` to `4b2e54e`; no tracked local changes existed.
- Preserved five untracked synthetic `tests/fixtures/PAL_QA_*_NOT_REAL.pdf` files without alteration.
- QA: all 43 current automated tests passed; `functions/index.js` syntax passed.
- Governance recreated from verified current evidence on `codex/pal-governance-refresh`.
- Production impact from this checkpoint task: none. No deploy, Firebase data write, rule change, secret change, or fixture deletion.
- Verification boundary: deployed Functions and rules were not independently mapped to a source revision.

## Entry template

### YYYY-MM-DD — Short title

- Objective and scope:
- Starting source/Production commits:
- Branch and resulting commit:
- Application/data/rules impact:
- Tests and Staging results:
- Production approval, deployment, and validation:
- Rollback point:
- Follow-up:
