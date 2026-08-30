# PAL Security Program Cost Ledger

Last updated: **2026-08-29, America/New_York**

This ledger records incremental cloud/service costs created specifically by the PAL security hardening program. Amounts shown as estimates are not invoices. Google Cloud budget alerts notify; they do not enforce a hard cap. Actual billed amounts must be reconciled against the billing report before the final security package is presented.

| Package | Environment | Resource / service | Cost control | Estimated incremental cost | Measured / billed cost | Status |
|---|---|---|---|---:|---:|---|
| 2 | Staging | Existing PAL Staging Firebase/Google Cloud project | Existing $5 monthly project alert | Usage dependent | Not yet reconciled | Active |
| 5 | Staging + Production | Hourly expired-upload cleanup invocation and quarantine storage | Packet/file limits; one hourly invocation | Low usage-dependent | Not yet reconciled | Active |
| 6 | Staging | Measurement-only ClamAV scanner: Cloud Run, Eventarc, four-hour Scheduler/update job, Artifact Registry/build, four synthetic buckets, logs/metrics | Min 0, max 1, concurrency 1; stop before estimated scanner-specific spend reaches $5; dedicated $5 alert requested | Measurement runtime/storage/operations estimated below $0.10 before free tier, plus scan charges; recurring scale-to-zero usage dependent | Console dashboard showed **$0.52 whole-project estimated charges for Aug. 1–29** after testing, versus $0.00 before scanner resources. This is not yet SKU-reconciled or fully attributable to Package 6; 154,162,681-byte definition mirror and controlled executions remain active | Private Staging runtime active; synthetic clean, quarantine, size, duplicate, forced-schedule, failure-recovery, signed-download, and audit-chain tests passed; no Production resource |
| 6 | Staging | Artifact Registry vulnerability scans for scanner measurement images | Console-disclosed price $0.26 per newly pushed image | $0.26 per newly pushed image; every replacement requires a new charge/approval record | Eight scans authorized and incurred: $2.08 total; billing report not yet posted | First blocked by 17 high findings; second blocked by a critical name collision; third scanned clean but failed startup review; startup-fixed fourth, trusted-rescan fifth, authenticated initial-callback sixth, authoritative-metadata seventh, and CRLF-startup-corrected eighth images passed with no findings |
| 6 | Staging | Hourly retention worker live test | Dedicated scale-to-zero identity; bounded 50 vaults and 250 reviewers per run | Below $0.01 estimated before free tier for two short forced runs and four tiny synthetic objects | Not yet SKU-reconciled | Active in Staging; exact deletion, hold, audit, notification, and cleanup paths passed |
| 6 | Production | Warm or other Production malware scanner | No authorization | Preliminary architecture estimate roughly $33–$90/month plus usage; configuration not approved | $0 | Not created |

## 2026-08-29 Package 6 reconciliation checkpoint

- Direct, action-time-authorized Artifact Analysis charges are mathematically reconciled at **8 × $0.26 = $2.08 incurred**. They may post later than the test date; the ledger does not misstate the earlier `$0.52` whole-project dashboard estimate as including them.
- The last observed dashboard amount remains **$0.52 for the whole Staging project for Aug. 1–29**. Because it is project-wide and not broken down by SKU, it cannot yet be attributed fully to Package 6 or combined with `$2.08` as an invoice total.
- Package 6 scanner measurement/runtime was bounded at min 0, max 1, concurrency 1 and was previously estimated below `$0.10` before free tier. Later false-positive regressions add only short scale-to-zero executions, tiny synthetic objects, Eventarc requests, Function calls, and logs; no new image scan was triggered.
- The authoritative current security-program direct-charge ledger is therefore **$2.08 known/incurred plus small usage-dependent Staging charges not yet posted or SKU-reconciled**. Production cost remains `$0` because no Package 6 Production resource exists.
- The 2026-08-30 two-phase startup/integration run incurred **no additional Artifact Analysis scan charge**. It used only short scale-to-zero Staging runtime, Eventarc, Functions, Storage, Auth, Firestore, and logging operations; those usage-dependent amounts are not yet posted. The run failed closed at the initial-scan reporter's workflow-specific intake-field check and was rolled back, so the direct scan ledger remains **8 scans / $2.08**.
- Final invoice-grade reconciliation remains time-gated until Google Cloud posts itemized SKU charges/credits/taxes for the testing window. It must record the billing-account scope and must not infer an invoice total from the dashboard estimate.

## Required final breakdown

- Separate Staging, Production, and one-time build costs.
- Include Cloud Run CPU/memory/request time, Cloud Build, Artifact Registry, Storage capacity/operations, Eventarc, Scheduler, Logging/Monitoring, network egress, and taxes/discounts where the billing report exposes them.
- Record the date range and billing account/project scope used for every actual figure.
- Identify free-tier or credit effects separately so PAL can understand the normal cost after credits expire.
- Record every approved cost ceiling and every alert threshold, plus any overage or unexpected charge.
