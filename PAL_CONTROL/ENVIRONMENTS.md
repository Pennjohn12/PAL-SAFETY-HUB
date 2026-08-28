# PAL Environment Plan

| Environment | Purpose | Data boundary | Source | Integrations |
|---|---|---|---|---|
| Production | Real PAL operations | Existing `pal-safety-hub`; real data | Explicitly approved commit from `main` | Approved live secrets and caps |
| Staging/Test | Development and acceptance | Separate Firebase project; synthetic data only | Reviewed task commit or refreshed `staging` branch | Sandbox or recipient allowlist |
| Demo | Training/sales | Prefer separate project; resettable synthetic data | Tagged approved demo build | Disabled or simulated |

## Safest Staging implementation

1. Create a PAL-owned Firebase project, recommended ID pattern `pal-safety-hub-staging` subject to availability.
2. Configure separate Auth, Firestore, Storage, Functions, Hosting, secrets, billing budgets, and alerts.
3. Add environment-specific public Firebase configuration and a prominent **STAGING — TEST DATA ONLY** banner.
4. Deploy equivalent rules and Functions using staging-only secrets.
5. Allowlist test email addresses and phone numbers; set low messaging and AI caps.
6. Seed synthetic projects, workers, onboarding records, certifications, forms, and role accounts. Never export Production records.
7. Run `RELEASE_CHECKLIST.md` and record the exact staging commit.

A Hosting preview channel alone is not safe: the current browser configuration would still connect to Production Firebase services.

## Promotion flow

Task branch → automated checks → review → exact commit to isolated Staging → acceptance → merge/current `main` verification → John's explicit Production approval → deploy exact commit → smoke test → change-log entry.
