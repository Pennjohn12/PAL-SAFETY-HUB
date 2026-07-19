# PAL Safety Hub Proposal

Prepared for PAL Environmental Services

Prepared by John Panettiere

## Executive Summary

PAL Safety Hub is a custom-built digital safety, onboarding, project documentation, and field operations application designed specifically around PAL Environmental Services' real office and field workflows.

The goal of the app is to give PAL one organized system for employee onboarding, safety paperwork, certifications, project records, JHAs, tickets, photos, field forms, payroll-related documents, and long-term document access. Instead of important information being spread across paper binders, text messages, emails, phones, and separate folders, PAL Safety Hub keeps records connected to the correct employee, project, or safety document.

This proposal outlines a 45-day field trial, a one-time onboarding/setup fee, and an ongoing monthly support/admin fee.

## Proposed Trial Period

PAL Safety Hub will be available for a 45-day trial period so PAL can test the app in real field and office conditions before making a final purchasing decision.

During the trial, PAL can test the app with a limited group of office staff, safety personnel, supervisors, foremen, and field employees. The suggested starting point is a controlled pilot on one or two active projects, such as JFK Terminal 1 or another project selected by PAL.

The purpose of the trial is to:

- Allow PAL office and safety personnel to review the app workflow.
- Allow foremen/supervisors to test daily field use.
- Confirm the onboarding, project, JHA, ticket, and safety-document process.
- Identify any final adjustments before full company rollout.
- Confirm whether the app provides enough value for PAL to move forward.

At the end of the 45-day trial, PAL will have the option to move forward with the paid setup and monthly support agreement.

## Pricing

### One-Time Setup and Onboarding Fee

**$5,000 one-time onboarding/setup fee**

This includes:

- Initial PAL app configuration.
- Admin, office, supervisor, and foreman access setup.
- Project/workflow setup assistance.
- Support during the transition from trial to active use.
- Initial training and walkthroughs for office, safety, supervisors, and selected foremen.
- Field support during the early rollout period.
- Final workflow adjustments based on PAL feedback.

### Monthly Support and Administration

**$500 per month ongoing support/admin fee**

This includes:

- Ongoing app oversight.
- Help with user/access issues.
- Assistance with field or office workflow problems.
- Support for onboarding, projects, tickets, JHAs, forms, and employee records.
- Troubleshooting app issues.
- Light app adjustments and improvements as needed.
- Monitoring connected services and app functionality.
- Availability to help PAL office, safety, supervisors, or foremen with app-related questions.

Third-party service costs are not included in the monthly support fee. These may include Firebase/Google Cloud, Twilio text messaging, OpenAI usage, Resend email usage, domain costs, storage increases, or other paid services added later. Those costs can be reviewed with PAL and either billed separately or handled directly by PAL.

## App Features

### Project Management

PAL Safety Hub includes a project access area where project-specific records are organized in one location. Each project can hold:

- Daily safety reports.
- Daily reports.
- JHAs and crew signatures.
- Checklists.
- Payroll and expense documents.
- Photos.
- Tickets.
- Uploaded documents.
- Project notes and history.

Projects can be searched and filtered, making it easier to find records by project, foreman, date, or document type.

### Foreman and Supervisor Tools

The app provides foremen and supervisors with quick access to common field forms and safety documents, including:

- Daily safety sheets.
- Daily reports.
- Daily payroll.
- Weekly payroll.
- Expense reports.
- Extra work tickets.
- JHAs.
- Checklists.
- Other PAL field forms.

Forms are designed to work across laptop, iPad, iPhone, Android, and desktop where possible.

### Employee Onboarding and Workforce Records

The onboarding/workforce area helps PAL manage new-hire intake and employee records. Features include:

- New-hire intake request creation.
- Orientation video access.
- English, Spanish, and Polish orientation video support.
- Orientation acknowledgement and knowledge checks.
- Employee document uploads.
- Missing-information review.
- Good-to-work approval tracking.
- Employee certification tracking.
- Expired and expiring certification visibility.

### JHA Management

The JHA section gives PAL a cleaner way to manage Job Hazard Analyses:

- Previous JHA storage.
- Upload new JHAs.
- Create new JHAs.
- Office/admin control over JHA editing.
- Foreman/crew signature access without full document editing access.
- Signed JHAs saved back to the correct project.

### Tickets and Signatures

The ticket feature allows field users to create extra work tickets and save them to the correct project. Tickets can include:

- Labor.
- Materials.
- Equipment.
- Notes.
- PAL signature.
- GC/contractor signature.
- Secure signature link for outside review/signoff.

### Photos and Documents

The app allows project photos and uploaded documents to be stored by project, helping PAL maintain a more complete project history.

### Email, Text, and AI Features

The app has been prepared for production service integrations:

- Weekly certification email reports.
- Email notifications through a backend email provider.
- Twilio text message readiness for intake links and future alerts.
- OpenAI-assisted drafting for safety sheets and daily reports.
- Usage tracking and monthly caps for paid services.

Text messaging is subject to Twilio approval and carrier compliance requirements.

## Security and Access Control

PAL Safety Hub has been built with role-based access and backend security in mind.

Security features include:

- Admin, office, foreman/supervisor, field, and public intake access levels.
- Firebase Authentication for protected access.
- Firestore security rules.
- Storage security rules.
- Backend-only handling of provider API keys.
- No public exposure of OpenAI, Twilio, Resend, or other provider secrets.
- Activity/audit logging for important app actions.
- Protected project and employee records.
- Public links limited to specific workflows, such as intake or ticket signature review.
- Separation between normal users and admin-only tools.

Important records are not intended to be permanently deleted by normal app users. The app is designed around controlled access, archiving, and long-term record protection.

## Long-Term Storage and Records

The app is designed to support long-term storage of important company records, including:

- Safety documents.
- Employee orientation records.
- Certifications.
- JHAs.
- Project documents.
- Tickets.
- Photos.
- Uploaded files.

Firebase and Google Cloud services are used for app hosting, database records, and file storage. A backup and retention plan has also been drafted, including:

- Manual admin backup exports.
- Recovery/retention planning.
- Notes for scheduled cloud backups.
- Long-term record retention guidance.
- Recommendation for PAL to approve an official retention policy.

Before any permanent deletion or purge policy is ever added, PAL should approve a written retention schedule for each record type.

## Work Completed To Date

Significant design, development, testing, and hardening work has already gone into the app, including:

- Project dashboard and project document workflows.
- Foreman tools and field forms.
- Daily safety sheet print/save/project submission flow.
- JHA management and signature flow.
- Extra work ticket creation and GC signature link flow.
- Employee onboarding intake flow.
- Orientation video module.
- Workforce and employee record sections.
- Certification tracking and email preview/reporting.
- Admin user access controls.
- Activity logging.
- Backup export and verification tools.
- Firebase security rules.
- Storage rules.
- Production hosting setup.
- Jobsite Resources public website setup.
- Resend email integration.
- OpenAI backend integration.
- Twilio SMS setup work and carrier approval process.
- Mobile/tablet/desktop layout improvements.
- Print, save-to-file, and field usability improvements.

The app has been shaped around actual PAL field and office needs rather than built as a generic software template.

## Recommended Rollout

A controlled pilot is recommended before full company rollout.

Suggested pilot:

- One fireproofing project, such as JFK Terminal 1.
- One smaller demolition project if PAL wants to test a second workflow.
- A small group of foremen/supervisors and field employees.
- Office and safety review of all submitted records.
- Weekly feedback during the 45-day trial.

This approach gives PAL real-world testing without forcing the entire company to change overnight.

## Trial to Purchase Decision

At the end of the 45-day trial, PAL may choose to:

1. Move forward with the app under the proposed pricing.
2. Request additional changes before moving forward.
3. End the trial without purchasing.

If PAL moves forward, the proposed cost is:

- **$5,000 one-time setup/onboarding fee**
- **$500/month ongoing support and administration**

Third-party usage costs are separate unless otherwise agreed in writing.

## Closing

PAL Safety Hub is designed to improve how PAL manages safety paperwork, employee records, project documentation, field forms, JHAs, tickets, certifications, photos, and long-term records.

The app gives PAL a stronger documentation process, cleaner project history, better field-office communication, and a more organized way to protect important company records.

The recommended next step is a 45-day controlled pilot with selected PAL users and projects, followed by a decision on full adoption.
