# PAL Safety Hub Master Status

Last verified: 2026-08-25  
Repository: `https://github.com/Pennjohn12/PAL-SAFETY-HUB`  
Authoritative branch: `main`  
Verified GitHub baseline: `c6b6a2f` (`Restore foreman operations command center`)  
Production Firebase project: `pal-safety-hub`  
Verified production URL: `https://pal-safety-hub.web.app/` (HTTP 200 on 2026-08-25)  
Protected app URL in code: `https://pal-safety-hub.web.app/projects.html`

## Governance state

- Governance work is isolated on `chore/pal-governance`, based on current `origin/main`.
- No production deploy, Firebase data write, rules change, or production configuration change was made during setup.
- A dedicated staging Firebase project does not yet exist in the repository configuration.
- The current frontend Firebase configuration points directly to production. A Firebase Hosting preview channel alone would still use production Auth, Firestore, Storage, and Functions and therefore is not a safe staging environment.

## Verified implemented systems

These are present in current GitHub `main`; runtime workflows requiring sign-in or data mutation still need the release checklist before being called production-verified.

- Public PAL safety hub with multilingual content and mobile/PWA support.
- Employee safety/checklist area with field forms, including incident, scissor lift, scaffold, harness, decontamination, PPE, respirator, and demolition forms.
- New-hire intake and orientation flows, including end-of-video quiz/rewatch controls and public continuation links.
- Protected sign-in with admin, office, foreman/supervisor, and employee/intake access concepts.
- Project records, assignments, project history, tickets/signatures, reports, documents, and field-form workflows.
- Office onboarding controls and employee safety record center.
- Foreman operations command center and daily access workflow.
- Firestore and Storage security rules, audit-log model, archive/retention posture, and manual backup export.
- Firebase Functions for controlled email, SMS, AI safety drafting, integration health, and daily access operations.
- Automated Node tests for housekeeping guidance and safety-record utilities.

## Implemented but verification needed

- Full role-by-role smoke test against the live production app.
- Confirm the deployed production build corresponds to GitHub `main` commit `c6b6a2f`; hosting returned successfully, but no release-to-commit manifest currently proves the mapping.
- Confirm custom domain `pal.jobsiteresources.com`; it is documented as a target, not verified here as active.
- Confirm production rules/functions versions match the repository.
- Confirm scheduled Firestore backup, Storage retention/versioning, and recovery test status in Google Cloud.
- Confirm provider secrets, monthly caps, and delivery behavior for email/SMS/AI integrations.

## Current architecture

- Static HTML/CSS/JavaScript frontend served by Firebase Hosting.
- Firebase Authentication, Firestore, Storage, and callable Functions in `us-central1`.
- Firebase project aliases currently contain only production (`pal-safety-hub`).
- Primary app files are `index.html` and `projects.html`; supporting modules live under `assets/`.
- Security policy is enforced by `firestore.rules`, `storage.rules`, application role checks, backend authorization, and audit logs.

## Immediate decisions required

1. Create a dedicated Firebase project for staging with synthetic/test-only data.
2. Decide whether Demo will be a separate Firebase project or a sanitized, read-only tenant in a non-production project. Separate project is recommended.
3. Establish who may approve production releases and who owns Firebase billing/credentials.
4. Add a durable release identifier so every deployed build can be traced to a Git commit.

## Update rule

Keep this document short. Move history to `CHANGE_LOG.md`, work ideas to `BACKLOG.md`, and permanent safeguards to `PROTECTED_SYSTEMS.md`.
