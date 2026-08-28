# Staging Authorization Evidence

Verified: **2026-08-28, America/New_York**  
Firebase project: `pal-safety-hub-staging`  
Data boundary: synthetic identities and synthetic records only

## Live Firestore Rules Playground results

| Test | Identity | Resource | Expected | Result |
|---|---|---|---|---|
| Anonymous profile read | Anonymous | Synthetic Employee profile | Deny | **Denied** |
| Verified own-profile read | Synthetic Employee; verified-email claim | Own profile | Allow | **Allowed** |
| Verified cross-user profile read | Synthetic Employee; verified-email claim | Synthetic Foreman profile | Deny | **Denied** |
| Unverified own-profile read | Synthetic Employee; unverified-email claim | Own profile | Deny | **Denied** |
| Synthetic project read | Synthetic Employee; verified-email claim | `staging-test-project-001` | Deny during bootstrap | **Denied** |
| Profile update | Synthetic Employee; verified-email claim | Own profile | Deny | **Denied** |
| Profile delete | Synthetic Employee; verified-email claim | Own profile | Deny | **Denied** |

## Live Storage Rules Playground results

| Test | Identity | Resource | Expected | Result |
|---|---|---|---|---|
| Anonymous file read | Anonymous | `/test-only/blocked.txt` | Deny | **Denied** |
| Authenticated file read | Synthetic Admin; verified-email claim | `/test-only/blocked.txt` | Deny | **Denied** |
| Authenticated upload/create | Synthetic Admin; verified-email claim | `/test-only/blocked.txt` | Deny | **Denied** |

## What these results establish

- Public clients cannot read the synthetic profiles or Staging files.
- A verified signed-in identity can read only its matching profile.
- Email verification is enforced by the current Staging profile-read rule.
- A user cannot update or delete their profile through client rules.
- Privileged-looking profile labels do not currently unlock project or Storage access.
- Staging project access and all Storage access remain deliberately closed until narrower role and file controls are designed and tested.

## Verification limitations

- The Firebase console Rules Playground evaluates individual operations; it does not replace an automated emulator suite.
- The current workstation has no Java runtime, so the Firebase Local Emulator Suite could not be run here without installing additional software.
- Collection-query behavior, complete create payloads, multi-document reads, transactions, Functions authorization, disabled-session revocation, and complete workflow behavior still require automated or isolated end-to-end tests.
- The synthetic accounts were created with random passwords that were not retained. Rules Playground claims were used for these rule simulations; interactive password login was not tested.
- No Production rule, account, permission, configuration, or data was changed or tested.

## Synthetic project-membership rule checkpoint

On 2026-08-28, a narrow Staging-only project rule was compiled and released. It permits a single-document read only when the requester has a verified email, an active synthetic Staging profile, and a UID explicitly present in one of the five role fixture fields on the synthetic project. Project lists, creates, updates, and deletes remain denied.

- Static authorization assertion: **Passed**.
- Firebase rule compilation and release: **Passed**.
- Live Rules Playground membership simulation: **Inconclusive**. The simulator remained in a loading state and returned neither allow nor deny; no console error was exposed.
- Safety interpretation: do not treat synthetic project membership as live-verified until an emulator-backed or successful live simulation is captured.
