# Package 6 Production synthetic regression manifest

Status: PREPARED ONLY — no synthetic resource created by this manifest.

## Fixed safety boundary

- Prefix every temporary identifier with one run ID: `PAL-SYNTHETIC-P6-PROD-<random-hex>`.
- Use only generated fake accounts on the reserved `example.invalid` domain and synthetic PDFs containing no PAL or person data.
- Address every Firestore document, Authentication user, and Storage object by its recorded exact ID/path. Do not list, open, migrate, or bulk-delete any existing PAL record or object.
- Keep initial-scan retry and retention PAUSED and code-disabled during direct-path testing. Retention enforcement/deletion is excluded.
- Stop on any unexpected IAM principal, duplicate resource, callback mismatch, real-data dependency, cost anomaly, or cleanup uncertainty.

## Planned temporary resources

The harness must write a local in-memory manifest before mutation and append each exact created identifier immediately:

- Three temporary Firebase Authentication users: synthetic requester/Office reviewer, different synthetic Admin approver, and synthetic non-entitled user.
- Three matching `users/<uid>` profiles using only fake names/emails and the minimum approved role/entitlement fields.
- Three `newHireIntakes/<run-id>-<case>` documents: clean certification, clean payroll/identity, and encrypted/manual-review.
- Corresponding `publicIntakeUploadAuthorizations/<generated-id>` documents created only through the deployed callable flow.
- At most one `sensitiveIntakeVaults/<intake-id>`, one `sensitiveDownloadApprovals/<generated-id>`, and one `sensitiveFalsePositiveReviews/<generated-id>` per case when the tested flow requires it.
- Exact generated Firebase quarantine paths plus exact derived `initial-scans/`, clean, and quarantine isolated-bucket paths.
- Correlated append-only synthetic audit events. These may remain only when clearly labeled with the run ID and required as permanent test evidence; all non-audit temporary state must be removed.

## Required direct-path assertions

- Certification: exact object/envelope scan reaches trusted clean; purpose-bound authorization returns the exact synthetic bytes.
- Payroll/identity: entitlement required; requester self-approval denied; different Admin approval succeeds; five-minute generation-bound release returns exact synthetic bytes.
- Independently verified encrypted PDF: scanner records locked manual review and download remains denied.
- Anonymous/wrong-principal and path/generation/size/type/SHA mismatch callbacks fail; duplicate callback is idempotent and conflicting terminal evidence fails.
- Audit chain/head and redaction pass; UI shows simple pending/available/review states; deployed backend-source probes remain 404.

## Exact cleanup and reconciliation

- Delete only Authentication UIDs recorded in the run manifest.
- Delete only exact non-audit Firestore document paths recorded in the manifest.
- Delete only exact Firebase/isolated Storage object names and generations recorded in the manifest.
- Verify every recorded temporary UID/doc/object is absent by exact lookup, not by collection/bucket enumeration.
- Reconcile counts: created = removed + explicitly retained labeled audit evidence. Any mismatch blocks completion.

## Immediate fail-closed rollback

1. PAUSE retry, retention, and definition schedules; keep retry/retention code modes disabled.
2. Delete/disable only Eventarc trigger `pal-prod-malware-scan` and confirm its notification/invocation path is absent.
3. Remove scanner Invoker from both private callbacks and scanner service; remove the scanner callback environment values if required.
4. Leave the private min-0 scanner with no invocation path so it eventually scales to zero; retain accepted image/repository evidence.
5. Keep all files locked. If application activation must be reversed, restore tested Package 5 source/rules and Hosting rollback version recorded in the approved activation delta.

No real-data cleanup, retention deletion, legacy migration, account deletion outside the exact synthetic manifest, or broad bucket/collection operation is permitted.
