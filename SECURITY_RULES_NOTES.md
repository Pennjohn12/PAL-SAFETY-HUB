# PAL Safety Hub Security Rules Notes

## What was added

- `firebase.json` connects this repo to Firestore, Storage, and Hosting rules.
- `firestore.rules` adds role-based access for users, projects, reports, field forms, employees, onboarding packets, and audit logs.
- `storage.rules` limits project, employee, JHA, and onboarding uploads by role, folder, file type, and file size.

## Important before deploy

These rules are a hardening foundation, but the current app still has two areas to tighten before a strict production rollout:

1. Project records now save `memberUids`, `memberEmails`, `foremanUids`, and `foremanEmails`, and office/admin views quietly backfill older project records. Project reads still allow signed-in staff during the transition because the app still loads all projects and filters in the browser. The next app patch should query only assigned projects, then Firestore project reads can be locked down per project.
2. User profile records now save to `/users/{auth.uid}` so Firebase rules can reliably read each person's role. Before deploying strict rules, confirm any older office/admin profile records have been opened/migrated or manually copied to the user's uid document.
3. GC ticket signature links should move away from unauthenticated direct project updates. The safer model is a dedicated public signature request record or a Cloud Function that validates the token and writes only the signature fields.

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
