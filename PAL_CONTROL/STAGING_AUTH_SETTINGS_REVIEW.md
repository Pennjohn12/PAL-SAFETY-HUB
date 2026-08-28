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

## Approved Staging changes applied

Verified after save on **2026-08-28**:

- Password policy enforcement changed from **Notify** to **Require**.
- Minimum password length changed from 6 to 12 characters.
- Uppercase, lowercase, numeric, and special characters are required.
- Force-upgrade-on-sign-in is enabled.
- Self-sign-up remains enabled as approved for controlled Staging testing.
- Authorized domains and Identity Platform/MFA configuration were not changed.

The approved attempt to disable self-service account deletion did not take effect. After a clean reload, the Firebase console control remained checked and the Save button remained unavailable. Self-delete therefore remains a verified open gap; it is not recorded as protected.

## Remaining treatment before Production decisions

1. Resolve and retest the self-service account-deletion restriction so users cannot bypass PAL archival and retention workflows.
2. Keep every self-created account unprivileged and unlinked until office approval.
3. Evaluate the Identity Platform upgrade in Staging so MFA, blocking functions, and activity logging can be tested before any Production recommendation.
4. Remove `localhost` from authorized domains only after local/emulator testing no longer needs it.

No Identity Platform upgrade, MFA change, provider change, sign-up change, or authorized-domain change was made. Production Authentication was not opened or modified.
