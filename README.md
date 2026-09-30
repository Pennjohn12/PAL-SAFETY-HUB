# PAL Safety Hub

PAL Safety Hub is a Firebase-backed web application supporting safety reporting, employee onboarding, project workflows, and document access.

## Start here

- [Architecture overview](ARCHITECTURE.md): components and security boundaries.
- [Security status](SECURITY_STATUS.md): what this snapshot does and does not demonstrate.
- [IT review guide](SECURITY_REVIEW.md): scope, priorities, and reporting guidance.

## Source version and ongoing security work

Prepared September 30, 2026 against public main commit [4b2e54e](https://github.com/Pennjohn12/PAL-SAFETY-HUB/commit/4b2e54e214eebe7615a36ddf6b2c7e7e394199be), dated August 28, 2026. These documentation changes do not deploy or modify the application.

Substantial security development after that baseline exists in separate development work and isolated Staging testing. It is not all represented by this snapshot. Some earlier changes were deployed separately, so describing every security change as prototype-only would also be inaccurate. A repository branch alone is not proof of what is running in Production.

The security program is ongoing. Local tests, emulator tests, synthetic Staging tests, and Production release are separate milestones. This source is available for technical review, not as a claim that all planned hardening is complete or independently certified.

## Repository map

| Location | Purpose |
| --- | --- |
| `index.html`, `projects.html` | Main browser pages and workflows |
| `assets/` | Shared browser assets and configuration |
| `functions/` | Server-side Firebase Functions |
| `firestore.rules`, `storage.rules` | Database and object-access rules |
| `firebase*.json`, `.firebaserc` | Hosting, service, and project configuration |
| `tests/` | Automated checks included in this snapshot |
| `tools/`, `outputs/` | Supporting tools and generated materials |
| `jobsiteresources-site/` | Related jobsite-resource site materials |

Orientation materials, proposals, and older implementation notes are supporting documents, not proof of current deployed controls. Verify the age and scope of role-assignment and deployment instructions before relying on them.

## Reviewing safely

Start with a source-only review; live account access is not required to read the code. Do not run deployment scripts, connect tests to live projects, or use real employee records as test data. Dynamic testing requires an agreed environment and synthetic test scope.

Report findings privately to the repository owner through the agreed review channel. Include the reviewed commit, component, impact, and evidence. Do not place credentials, personal data, or exploit details in public issues.

## Public configuration

This repository is public: source review does not require write access. Firebase browser configuration is designed for client applications; authorization must be enforced by backend controls and Security Rules, with appropriate API restrictions. See [Firebase API-key guidance](https://firebase.google.com/docs/projects/api-keys). Private credentials and sensitive records must not be included in review submissions.
