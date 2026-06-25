# PAL Safety Hub Backup And Retention Runbook

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

## Required Production Backup Setup

Before PAL relies on this app for long-term company records, set up these cloud-side protections in Firebase/Google Cloud.

### Firestore Records

Turn on scheduled Firestore backups or managed exports.

Recommended production posture:

- Daily backup for recent recovery.
- Monthly backup for long-term record checkpoints.
- Store backups in a dedicated Google Cloud Storage backup bucket.
- Keep backup bucket access limited to owners/admins only.
- Test a restore into a separate test project before relying on it.

### Firebase Storage / Google Cloud Storage Files

Turn on bucket retention/version protection for uploaded files.

Recommended production posture:

- Enable object versioning for the Storage bucket that holds project and employee files.
- Add lifecycle rules only after the company decides the legal retention schedule.
- Consider a separate archive bucket for long-term copies.
- Restrict archive bucket access to admin/owner accounts.
- Do not allow normal app users to permanently delete files.

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

- Firestore scheduled backups are enabled.
- Storage file retention/versioning is enabled.
- Admin/owner access to backups is confirmed.
- A restore test has been completed.
- PAL has approved the retention schedule.
