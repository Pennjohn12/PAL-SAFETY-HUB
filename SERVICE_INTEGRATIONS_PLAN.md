# PAL Safety Hub Paid Service Integrations Plan

This phase covers the paid services that make the app feel fully production-ready:

- Automatic emails.
- Text message links/alerts.
- AI-assisted safety and daily report drafting.
- Monthly usage caps so costs do not surprise the owner.

## Recommended Starting Stack

### Email

Recommended provider: Resend or SendGrid.

Current direction: Resend account created. Firebase Functions scaffold added for secure backend sending.

Recommended first use cases:

- Weekly expired/expiring certification report to office/safety.
- New hire intake waiting-for-review notification.
- New hire approved / missing-info notification.
- Optional project summary email to supervisors.

Starting cap:

- 2,000 to 3,000 emails/month included.
- Admin warning at 80%.
- Stop automated emails at 100% unless admin overrides.

Reason:

- Email is low-cost and very useful for the office.
- It should be added before SMS because it is less expensive and less compliance-heavy.

### Text Messaging

Recommended provider: Twilio.

Recommended first use cases:

- Send new-hire intake link.
- Send missing-info correction link.
- Send urgent project/document reminder only when office/admin chooses it.

Starting cap:

- 1,000 SMS segments/month included.
- Admin warning at 75%.
- Hard stop at 100% unless admin raises the limit.

Important:

- Text messages are charged by segment, not just by the visible message.
- Long messages can count as multiple segments.
- Carrier fees and business registration rules can apply.
- Foremen manually sending a copied link from their own phone should not count against app SMS usage.

### AI Assistance

Recommended provider: OpenAI API.

Recommended first use cases:

- AI Daily Safety Sheet.
- AI Daily Report.
- JHA draft assistance later.
- Safety email/report wording assistance later.

Starting cap:

- 500 AI generations/month included for PAL.
- Admin warning at 75%.
- Hard stop at 100% unless admin raises the limit.

Recommended model approach:

- Use a mini model for normal safety sheet/report drafting.
- Reserve larger models for more complex future workflows.
- Track each generation by user, project, date, feature, and estimated token usage.

## Security Rules For Integrations

Never put provider secrets in the browser app.

Do not store these in `index.html`, `projects.html`, or any public JavaScript:

- OpenAI API key.
- Twilio account SID/auth token.
- Resend/SendGrid API key.

Correct production setup:

- Frontend app writes a request or calls a protected Firebase Cloud Function.
- Firebase Cloud Function checks the signed-in user and role.
- Function checks company monthly usage cap.
- Function calls the paid provider.
- Function records success/failure and usage.

## Suggested Firestore Structure

```text
companies/{companyId}/integrationSettings
companies/{companyId}/usage/{yyyyMM}
companies/{companyId}/notificationJobs/{jobId}
companies/{companyId}/aiRequests/{requestId}
```

For the current PAL-only version, this can start as:

```text
integrationSettings/pal
usage/pal-YYYY-MM
notificationJobs/{jobId}
aiRequests/{requestId}
```

Later, when JobsiteResources supports more companies, move toward the company-based structure.

## Monthly Usage Defaults

Suggested PAL launch limits:

| Service | Included Monthly Usage | Warning | Hard Stop |
| --- | ---: | ---: | ---: |
| Email | 3,000 emails | 80% | 100% |
| SMS | 1,000 SMS segments | 75% | 100% |
| AI | 500 generations | 75% | 100% |

## Admin Settings Needed

Add an admin-only settings screen for:

- Email provider status.
- SMS provider status.
- AI provider status.
- Monthly caps.
- Current monthly usage.
- Default office/safety recipients.
- Weekly certification report schedule.
- Notification sender name.

## Build Order

1. Add admin-only integration settings and usage display.
2. Add backend Cloud Functions shell with no secrets committed to the repo. Done for Resend email.
3. Add email sending first. Backend scaffold done; app buttons and deployed secret are next.
4. Add weekly certification email automation.
5. Add SMS sending for new-hire intake links.
6. Add OpenAI backend endpoint for AI safety/daily report generation.
7. Add usage caps and audit logs around all paid calls.

## Production Rule

Paid services should not be directly connected from the public app. They should only run through Firebase backend code with role checks, usage limits, audit logs, and provider keys stored as backend secrets.
