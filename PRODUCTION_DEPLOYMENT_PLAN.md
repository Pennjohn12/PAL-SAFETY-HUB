# PAL Safety Hub Production Deployment Plan

Working platform name: JobsiteResources

Working domain plan:

- Main business/platform site: `jobsiteresources.com`
- PAL app: `pal.jobsiteresources.com`
- Future customer apps: `{company}.jobsiteresources.com`

This keeps PAL's app professional while leaving room for other companies later.

## Domain Purchase

Before Firebase can use the custom domain, the domain must be purchased through a registrar such as Cloudflare, Namecheap, GoDaddy, Squarespace, or another domain provider.

Recommended setup:

- Buy `jobsiteresources.com` if available.
- Keep domain ownership under the business owner account, not a temporary personal/dev account if possible.
- Turn on domain privacy if the registrar offers it.
- Turn on registrar account two-factor authentication.
- Save registrar login/recovery information in a secure company password manager.

## Firebase Hosting Structure

Recommended first production setup:

- Firebase Hosting serves PAL Safety Hub.
- Custom domain points `pal.jobsiteresources.com` to the Firebase Hosting site.
- `jobsiteresources.com` can later become a public-facing landing page for the platform/business.

Recommended future multi-company setup:

- Each company gets its own subdomain, such as `pal.jobsiteresources.com`.
- Each company must have separate company/team identifiers in the database.
- Long term, stronger separation may mean separate Firebase projects per company or strict tenant/company rules inside one Firebase project.
- No company should ever be able to query or open another company's projects, users, employees, documents, or files.

## Firebase Custom Domain Steps

After the domain is purchased:

1. Open Firebase Console.
2. Go to Hosting.
3. Add custom domain: `pal.jobsiteresources.com`.
4. Firebase will provide DNS records.
5. Add those DNS records in the domain registrar DNS settings.
6. Wait for Firebase to verify the domain and issue HTTPS.
7. Confirm `https://pal.jobsiteresources.com` opens the app.
8. Confirm sign-in, project access, file uploads, public intake links, and ticket signature links still work.

## Production Versus Testing

Recommended:

- Keep one production site that PAL actually uses.
- Use Firebase preview channels or a separate staging project for testing patches.
- Do not test risky changes directly on the live PAL app once PAL starts relying on it.

Simple first version:

- Production: `pal.jobsiteresources.com`
- Testing link: Firebase preview channel, used only by you/admin before changes go live.

Stronger later version:

- Production Firebase project: live PAL records.
- Staging Firebase project: testing data only.

## App Install Name

Keep the installed phone/iPad app name as:

- `PAL Safety Hub`

Reason:

- PAL employees should immediately recognize the app.
- JobsiteResources is the platform/business name.
- PAL Safety Hub is the customer-specific app name.

## Public File Safety

The current Firebase Hosting config already excludes internal notes, rules files, markdown docs, draft orientation files, and backup/deployment notes from public hosting.

Before every production deploy:

- Confirm `firebase.json` still ignores internal files.
- Confirm no private PDFs, drafts, zip files, notes, or backup files are sitting in the public deploy folder unless they are meant to be public.
- Confirm test/sample files are removed or clearly marked before live company use.

## Production Launch Checklist

Before PAL uses the live domain:

- Custom domain is active with HTTPS.
- Admin, office, foreman, employee/intake, and public ticket-signature flows are tested.
- Firebase security rules are deployed.
- Storage rules are deployed.
- Backup/retention runbook has been reviewed.
- Firestore scheduled backup plan is selected.
- Storage retention/versioning plan is selected.
- Admin access list is correct.
- Test/sample users and projects are removed or clearly marked as samples.
- Mobile testing passes on iPhone, iPad, Android, laptop, and desktop.

## DNS/Domain Notes To Save

Save this information once the domain is purchased:

- Registrar:
- Domain owner account:
- DNS manager:
- Firebase project connected:
- Production domain:
- Staging domain or preview method:
- Renewal date:
- Recovery email:
