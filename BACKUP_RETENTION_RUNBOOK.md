# PAL Safety Hub Backup And Retention Runbook

## BOOKMARK - PAL Retention Policy Approval Required

Before applying any irreversible Google Cloud retention lock, PAL management should approve a written retention schedule for each record category, including safety documents, JHAs, incident records, employee orientation/certifications, payroll/expenses, project photos, tickets, and general project files.

Status: **Pending PAL management/safety/accounting/legal review.**

Until that policy is approved, active records remain stored indefinitely through current app behavior, permanent deletion remains blocked in the normal app, and deleted Storage objects have a 90-day recovery window. Do not enable or lock a fixed-year bucket retention policy without written approval.

This app can hold safety records, employee records, project documents, photos, tickets, payroll forms, expense forms, JHAs, and onboarding records. Those records need two layers of protection:

1. App-side protection so users cannot casually delete important records.
2. Cloud-side backup and retention so PAL can recover records years later, even if a mistake, bad upload, account issue, or disaster happens.

## Current App Protection

- Project records, saved field forms, daily reports, project files, onboarding uploads, employee records, and certification files are blocked from normal client-side permanent deletion.
- Deleted or removed items should be treated as archived from the app view, not destroyed from the long-term record.
- Admin has a Backup Export tab that downloads a dated JSON snapshot of Firestore records and file links/metadata.
- Activity Log records major actions like access changes, project/file actions, employee changes, intake approvals, ticket signatures, and backup exports.

## What The Manual Backup Export Does

The admin Backup Export is useful for quick reference and emergency review.

It includes:

- Project records.
- Project field forms and daily reports.
- Employee and certification metadata.
- Onboarding intake records.
- User/access records.
- Recent audit/activity records.
- File names, file links, file paths, and metadata saved in Firestore.

It does not include:

- The actual uploaded PDF/image/file bytes stored in Firebase Storage or Google Cloud Storage.
- A full point-in-time restore system.
- A guaranteed 10 to 20 year archive by itself.

## Active Production Recovery Setup

The following cloud protections were enabled on July 1, 2026 for project `pal-safety-hub`.

### Firestore Records

- Point-in-time recovery is active with a seven-day recovery window.
- Daily backups are active and retained for 14 days.
- Weekly backups run on Monday and are retained for 98 days, the supported maximum.
- Backups contain Firestore data and index configurations, but not Firebase Security Rules or Storage file bytes.
- A controlled restore must be tested after the first backup is available.

### Firebase Storage / Google Cloud Storage Files

- Cloud Storage soft delete is active for `pal-safety-hub.firebasestorage.app` with a 90-day recovery window.
- Storage Security Rules block normal app users from permanently deleting uploaded files.
- Object versioning remains off because current uploads use distinct paths and indefinite noncurrent versions would add cost without an approved lifecycle policy.
- No locked bucket retention policy has been applied. PAL management/legal must approve the formal retention period before any irreversible lock is enabled.
- A separate archive project or bucket remains a future option for protection against complete project/account deletion.

### Retention Schedule

PAL should decide the official retention policy with management, safety, and legal/accounting input.

Suggested starting point:

- Safety documents, JHAs, daily safety sheets, incident-related files: keep indefinitely unless legal says otherwise.
- Employee orientation and certification records: keep indefinitely or at least as long as the company requires for compliance.
- Payroll and expense records: follow payroll/accounting retention requirements.
- Project photos, tickets, and project documents: keep for the life of the company unless storage cost or legal policy says otherwise.

## Monthly Admin Checklist

Once per month:

- Download an admin Backup Export JSON file.
- Confirm the file opens and contains current projects/employees.
- Confirm Google Cloud backup jobs are completing successfully.
- Confirm Storage file/version retention is still enabled.
- Confirm at least one recent file can be retrieved from Storage.
- Review Activity Log for unusual access or archive actions.
- Save the monthly backup export in a secure company location.

## Quarterly Recovery Test

Once per quarter:

- Pick one project.
- Confirm its saved safety forms, files, photos, tickets, and reports can be found.
- Pick one employee.
- Confirm their employee record and certification metadata can be found.
- Download one file from Storage.
- Confirm backup/restore instructions are still accurate.

## Production Rule

The app should not be treated as final production record storage until:

- Firestore scheduled backups and point-in-time recovery remain enabled.
- Storage soft delete remains enabled at 90 days.
- Admin/owner access to backups is confirmed.
- A restore test has been completed.
- PAL has approved the retention schedule.
