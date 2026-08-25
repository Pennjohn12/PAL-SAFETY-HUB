# PAL Safety Hub Protected Systems — DO NOT CHANGE Casually

Changes to these systems require explicit task scope, impact review, staging verification, a rollback point, and release approval. “Cleanup,” visual redesign, or an old handoff is not sufficient authorization.

## Production and data

- Production Firebase project `pal-safety-hub`, Hosting sites, custom domains, aliases, billing, and IAM.
- Production Firestore documents, Storage objects, Auth users, Functions secrets, provider credentials, audit logs, backup/retention settings, and integration usage records.
- Never copy production personal data into Staging or Demo. Use synthetic records.
- Never bulk delete, rename, migrate, or rewrite production collections/files without a reviewed migration and recovery plan.

## Identity and authorization

- Admin bootstrap identities and authorized-email behavior.
- Role names, access grants, project membership/foreman assignment, public-link tokens, and backend authorization checks.
- `firestore.rules`, `storage.rules`, and any code that permits public intake/signature writes.
- Denial behavior is part of the security contract and must be tested.

## Employee and safety records

- Employee profiles, onboarding packets, certifications, orientation completion/quiz state, signatures, incident records, field forms, daily access records, and their attachments.
- Archive/retention behavior that blocks casual permanent deletion.
- Audit logging and actor/timestamp attribution.

## Project operations

- Project membership, daily reports, payroll/time records, expense reports, tickets, GC signatures, document/file paths, and project history.
- Foreman command center and office onboarding/employee-record workflows.
- Existing production URLs and public continuation/signature links.

## Integrations and safety content

- Email, SMS, and AI Functions; provider secrets; recipient routing; usage caps; and logs.
- Approved safety guidance, required training/policy text, emergency contact information, and compliance-related copy require a qualified PAL owner/safety reviewer.
- Service worker cache/version behavior because stale clients can conceal urgent fixes.

## Hosting exclusions

- Do not weaken exclusions for Markdown, office documents, drafts, maps, archives, backups, rules, Functions source, or internal notes without a deliberate public-content review.

## Allowed without special production approval

- Read-only inspection.
- Documentation-only work on a non-production branch.
- Local tests using synthetic data and no production credentials.
- Work in a dedicated staging project with test-only accounts/data, within the approved task scope.
