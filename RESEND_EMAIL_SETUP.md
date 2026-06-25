# PAL Safety Hub Resend Email Setup

Resend account status: created.

This file explains the safe setup path. Do not paste the Resend API key into `index.html`, `projects.html`, GitHub, screenshots, or chat.

## What Was Added

- Firebase Functions is now configured in `firebase.json`.
- A backend callable function named `sendAppEmail` was added in `functions/index.js`.
- The function only allows signed-in office/admin users to send email.
- The function reads the Resend API key from Firebase secret storage.
- The function tracks monthly email usage in Firestore under `usage/pal-YYYY-MM`.
- The default monthly email cap is 3,000 recipients/month unless changed in `integrationSettings/pal`.
- Email sends are logged to `integrationEmailLogs` and `auditLogs`.

## Resend Items Needed

In Resend:

1. Add and verify a sending domain when the production domain is ready.
2. Create an API key.
3. Save the sending email address you want, such as:

```text
PAL Safety Hub <notifications@jobsiteresources.com>
```

or, for PAL-specific sending later:

```text
PAL Safety Hub <notifications@pal.jobsiteresources.com>
```

## Firebase Secret Setup

When ready to deploy functions, set the secret in Firebase:

```bash
firebase functions:secrets:set RESEND_API_KEY
```

Paste the Resend key only into that Firebase prompt.

Optional sender settings can be set as backend environment variables later:

```bash
RESEND_FROM_EMAIL="PAL Safety Hub <notifications@jobsiteresources.com>"
RESEND_REPLY_TO="office@palcorp.com"
```

For the first test, the function has a fallback sender. For real production email, use a verified sending domain in Resend.

## Deploy Order

1. Install backend dependencies inside the `functions` folder.
2. Set the `RESEND_API_KEY` Firebase secret.
3. Deploy Firebase Functions.
4. Send a test email from a signed-in admin/office account.
5. Confirm the email appears in Resend logs.
6. Confirm the app records usage and audit log entries.

## Next Build Step

After the function is deployed and tested, the app can add buttons for:

- Send weekly cert report to office/safety.
- Send intake waiting-for-review notice.
- Send missing-info notice.
- Send approved/good-to-work notice.

Those buttons should call the backend `sendAppEmail` function instead of sending email directly from the browser.
