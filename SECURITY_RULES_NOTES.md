# PAL Safety Hub Security Rules Notes

## What was added

- `firebase.json` connects this repo to Firestore, Storage, and Hosting rules.
- `firestore.rules` adds role-based access for users, projects, reports, field forms, employees, onboarding packets, and audit logs.
- `storage.rules` limits project, employee, JHA, and onboarding uploads by role, folder, file type, and file size.

## Important before deploy

These rules are a hardening foundation, but the current app still has a few areas to review before a strict production rollout:

1. Project records now save `memberUids`, `memberEmails`, `foremanUids`, and `foremanEmails`. Foreman/supervisor project lists now query only assigned projects, and Firestore/Storage project access is locked to project members. Before deploying strict rules, office/admin should open the project list once so older projects can backfill access-list fields.
2. User profile records now save to `/users/{auth.uid}` so Firebase rules can reliably read each person's role. Before deploying strict rules, confirm any older office/admin profile records have been opened/migrated or manually copied to the user's uid document.
3. GC ticket signature links now use `/publicTicketSignatures/{token}`. Public signers can submit only to that request record; PAL signed-in project members sync the signed result back into the project ticket. GC signature links expire after 7 days and must be recreated after expiration. A future Cloud Function would make this even stronger by applying the signature server-side immediately.
4. Audit logs now write to `/auditLogs` for important app actions such as access changes, project creation/notes, uploads, employee/certification changes, intake approvals, tickets, and GC signature link activity. The app can create audit entries only for the signed-in user, office/admin can read them, and entries cannot be edited or deleted from the app.
5. Employee records and employee certification files are protected from permanent app deletion. The app archives employees/certs from active views and logs that action, while Firestore/Storage rules block client-side deletion of employee records and certification files.
6. Project and safety records now follow the same retention posture. Client-side deletion is blocked for projects, project daily reports, project field forms, project Storage files, daily report attachments, and new-hire intake uploads. Any future cleanup should be handled as an intentional admin/backend retention process, not a normal app action.
7. Firebase Hosting now excludes internal notes/draft orientation assets from public deployment, adds browser safety headers, and uses no-store caching for app shell files so security patches are less likely to be hidden behind old cached pages. The service worker cache version was bumped so installed devices refresh to the current build.
8. The app now has field-friendly connection warnings. Projects/intake pages show an offline banner, major cloud saves/uploads/submissions stop before trying to run offline, and the public form home page warns users that project/cloud submission needs internet even if local form saving still works.
9. Foreman project field forms now have a first offline outbox. Daily safety sheets, AI safety sheets, foreman daily reports, daily payroll, weekly payroll, and expense reports can be saved on the device while offline, then automatically submitted to the project when the device is back online and the user is signed in. File/photo uploads still require internet and should be handled in a future IndexedDB upload queue if needed.
10. Admin-only Backup Export now provides an immediate manual recovery/reference snapshot. It exports Firestore record data, nested project field forms/reports, access records, audit records, and file URLs/metadata to a dated JSON file. This does not replace Google Cloud backup/retention for actual uploaded file contents.
11. A backup and retention runbook now documents the production storage plan: scheduled Firestore backups, Google Cloud Storage retention/versioning, monthly admin checks, quarterly recovery tests, and the limits of the manual export.
12. A production deployment plan now uses JobsiteResources as the working platform name, with `pal.jobsiteresources.com` as the target PAL app domain and future companies separated under their own subdomains.

## Role assignment plan

- Admin bootstrap emails are the only accounts that can initially become admin automatically.
- Office/Admin access should be assigned by an existing admin using the User Access screen, by pre-authorizing an email in `/userAccessGrants/{email}`, or by editing the user's `/users/{auth.uid}` profile record.
- Employee / Intake Only access can be self-created. Foreman, supervisor, office, and admin access should be assigned or pre-authorized by admin.
- Avoid name-based admin access. Email/account identity is safer than display name.

## Deploy commands

After review in Firebase:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

Hosting deploy is separate:

```bash
firebase deploy --only hosting
```
