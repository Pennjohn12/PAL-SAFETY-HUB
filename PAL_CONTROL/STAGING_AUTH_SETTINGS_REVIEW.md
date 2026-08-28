# Staging Authentication Settings Review

Verified: **2026-08-28, America/New_York**  
Firebase project: `pal-safety-hub-staging`  
Method: read-only Firebase console inspection

## Verified protections

- Email enumeration protection is enabled.
- Only the Email/Password sign-in provider is enabled.
- Authorized domains are limited to `localhost` and the two default Staging Firebase Hosting domains.
- The disabled synthetic account is visibly disabled.
- Current Staging Firestore rules separately require an email-verified claim before a user can read their own profile.

## Verified configuration gaps

- Password policy is in **Notify** mode rather than **Require** mode.
- Minimum password length is six characters.
- Uppercase, lowercase, numeric, and special-character requirements are not enabled.
- Force-upgrade-on-sign-in is not enabled.
- Self-service account creation is enabled.
- Self-service account deletion is enabled.
- SMS multi-factor authentication is unavailable until the project is upgraded to Firebase Authentication with Identity Platform.
- Authentication blocking functions and user activity logging are also unavailable until that upgrade.
- The application-level email-verification flow and enforcement before general app entry have not yet been tested end to end.

## Recommended Staging treatment before Production decisions

1. Change Staging password enforcement to **Require**, with a minimum length of at least 12 and uppercase, lowercase, numeric, and special-character requirements.
2. Enable force-upgrade-on-sign-in for Staging test users after confirming the intended recovery workflow.
3. Disable self-service account deletion so users cannot bypass PAL archival and retention workflows.
4. Decide whether open self-sign-up is required. If retained, keep every new account unprivileged and unlinked until office approval.
5. Evaluate the Identity Platform upgrade in Staging so MFA, blocking functions, and activity logging can be tested before any Production recommendation.
6. Remove `localhost` from authorized domains only after local/emulator testing no longer needs it.

No setting was changed during this review. Any Identity Platform upgrade, password-policy enforcement, user-action restriction, or authorized-domain change requires a specific approved Staging change and validation plan.
