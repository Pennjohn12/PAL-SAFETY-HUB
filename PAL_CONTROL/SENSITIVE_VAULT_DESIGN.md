# Package 6 — Sensitive Payroll/Identity Vault and Safe File Release

Last updated: **2026-08-29, America/New_York**

Status: **Design checkpoint / no Production authorization**

## Verified current risks

1. The public W-4 action stores the complete W-4 payload, including the full Social Security number, inside the ordinary `newHireIntakes` document. Every signed-in Office/Admin user permitted to read that intake receives the same sensitive fields as ordinary onboarding information.
2. Payroll/identity file metadata is stored beside ordinary certification metadata in the intake record. Package 5 correctly places new bytes in private quarantine, but no trusted malware scanner can mark an object clean and no controlled backend download/release path exists.
3. The Office review screen reads whole intake documents directly from Firestore and can render or locally export the full W-4. There is no separately granted sensitive-vault permission, purpose/reason capture, or server-attributed sensitive-read audit event.
4. Package 5 file-signature validation proves only that the bytes resemble the declared file format. It is not malware scanning and must never produce a `clean` decision.

## Proposed fail-closed architecture

- Ordinary onboarding state remains in `newHireIntakes/{intakeId}`. It may contain only completion markers and non-sensitive display summaries for W-4/payroll steps.
- Full W-4/SSN data and payroll/identity file records move to a server-only vault record keyed by intake ID. Firebase client rules deny all direct reads, lists, writes, and deletes to this vault.
- A PAL Office user may request sensitive information only through a backend action that verifies authentication, active account state, Office/Admin role, a separate sensitive-vault entitlement, and a stated business purpose.
- Each allowed and denied sensitive read/download creates a server-attributed append-only audit event containing actor UID, masked actor email, intake/object identifiers, purpose, decision, timestamp, and request correlation ID. The event must not contain SSNs, file contents, tokens, signed URLs, or other secrets.
- New uploads remain in the Package 5 quarantine path and remain unavailable to every browser until a trusted scanner service returns a verified clean result for the exact object generation, size, content type, and cryptographic digest.
- Scanner results use an explicit state machine: `pending`, `scanning`, `clean`, `infected`, `unsupported`, `error`, `timeout`, and `manual-review`. Unknown or conflicting states fail closed.
- A clean result does not create a permanent public URL. An authorized backend download action rechecks the entitlement and exact clean object metadata, records the access event, and issues a short-lived single-object download response or URL.
- Infected objects remain inaccessible and enter the approved quarantine-retention procedure. Error, timeout, unsupported, and suspicious metadata cases enter manual review and remain inaccessible.
- Scanner callbacks/jobs must authenticate as a dedicated scanner identity with no general Office role. Results are idempotent and can advance only the exact object generation from an expected state.
- Notifications contain only a packet reference and status; they never attach the document, expose a signed URL, or include SSN/identity content.

## Required synthetic tests

- Ordinary certification metadata never enters the payroll/identity vault, and payroll/identity data never enters ordinary certification paths.
- Public packet-token holders can save and resume their own W-4 without receiving any other packet's vault data.
- Employee, Foreman, Supervisor, ordinary Office without entitlement, disabled, anonymous, and cross-packet requests are denied.
- Entitled Office/Admin access requires a purpose and produces a server audit event; direct Firestore/Storage access remains denied.
- Clean, infected, unsupported, error, timeout, and manual-review outcomes are explicit and fail closed unless the exact object is verified clean.
- Scanner result replay, cross-object substitution, changed object generation, altered digest/size/type, duplicate delivery, and out-of-order delivery are denied or idempotent.
- No download is available before clean release. Short-lived download authorization is object-bound and not reusable after expiry.
- Quarantine retry, orphan cleanup, retention holds, false-positive escalation, and rollback retain evidence and never silently expose or delete a sensitive file.

## Decisions that require John before implementation can be completed

1. **Scanner/vendor and paid-service commitment.** Select an approved malware scanning service or approve a separately operated scanner. Review pricing, data location, subprocessors, retention, privacy terms, breach notice, service availability, file-size/type support, and whether PAL content trains any model. No credential or paid service may be created under the current authorization.
2. **Sensitive-vault access policy.** Decide whether access is Admin-only or separately granted to named Office payroll reviewers. Recommended: Admin plus explicitly entitled payroll reviewers; ordinary Office access denied.
3. **Access-purpose policy.** Approve required purposes such as payroll setup, identity verification, legal response, or documented correction, and decide whether a second-person approval is required for SS card/driver-license downloads.
4. **Retention policy.** Approve how long clean, infected, rejected, abandoned, and audit records remain; identify legal/HR hold exceptions; and decide whether sensitive identity images should be deleted after verification instead of retained.
5. **False-positive procedure.** Name the authorized reviewer, define escalation to the scanner/vendor, and prohibit browser release until a documented clean rescan or approved replacement file exists.
6. **Existing-data treatment.** Existing W-4 fields and files cannot be inspected, moved, rescanned, or deleted without a separately reviewed real-data migration and rollback plan.

## Staging boundary

Code can implement and test the vault authorization, state machine, metadata integrity, audit shape, and fail-closed download boundary using unmistakably synthetic records and a deterministic test scanner. Such a test scanner is not a real malware control and cannot satisfy the Package 6 Production finish line. Live scanner integration, credentials, vendor commitment, irreversible retention, real-data migration, and Production deployment remain separately approval-gated.

The first vendor-neutral implementation checkpoint adds pure policy enforcement for all eight scan states, retry/terminal transition rules, trusted-scanner identity matching, exact path/generation/size/type/SHA-256 binding, required access purpose, clean-only entitled download authorization, and masked secret-free audit records. This module has no network, credential, Storage, Firestore, vendor, or Production side effect.

## Rollback principle

Rollback must never copy newly separated sensitive data back into ordinary intake records or make quarantine objects browser-readable. If the scanner or release service fails, the safe state is continued quarantine and unavailable downloads. Any emergency compatibility rollback requires a separately approved data-handling plan and must preserve vault/audit records.
