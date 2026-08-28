# Protected Systems — DO NOT CHANGE Casually

Changes below require explicit task scope, a current Git checkpoint, impact review, Staging verification where feasible, a rollback plan, and Production approval when applicable.

## Production and real data

- Firebase project `pal-safety-hub`, its Hosting sites/domains, IAM, billing, secrets, quotas, and integrations.
- Real Firestore records, Storage objects, Auth users, employee/onboarding/payroll/project data, audit logs, and backups.
- Never copy real PAL data to Staging or Demo. Never bulk-delete, rename, migrate, or rewrite it without a reviewed migration and recovery plan.

## Identity and access

- Admin bootstrap identities, roles, access grants, project membership, public tokens, and backend authorization.
- `firestore.rules`, `storage.rules`, public intake/signature access, and denial behavior.

## Safety and employee records

- Orientation/quiz state, certifications, signatures, incident and field forms, inspections, daily access, onboarding packets, and attachments.
- Archive/retention protections, actor/timestamp attribution, and audit trails.

## Project operations and integrations

- Project assignments, reports, payroll/expenses, tickets, signatures, files, history, offline queues, and foreman operations.
- Email, SMS, and AI recipient routing, secrets, limits, delivery logs, and callable Functions.
- Approved safety/compliance language and emergency information.

## Client and hosting protections

- Production URLs and durable public links.
- Service-worker cache/version behavior.
- Hosting exclusions for internal notes, source, rules, drafts, office documents, archives, and backups.

Read-only inspection, documentation-only branches, and synthetic local/Staging tests are allowed when they stay within the requested scope.
