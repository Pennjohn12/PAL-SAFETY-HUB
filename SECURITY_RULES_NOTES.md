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
