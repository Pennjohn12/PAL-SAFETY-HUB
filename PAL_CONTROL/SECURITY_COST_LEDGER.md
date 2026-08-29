# PAL Security Program Cost Ledger

Last updated: **2026-08-29, America/New_York**

This ledger records incremental cloud/service costs created specifically by the PAL security hardening program. Amounts shown as estimates are not invoices. Google Cloud budget alerts notify; they do not enforce a hard cap. Actual billed amounts must be reconciled against the billing report before the final security package is presented.

| Package | Environment | Resource / service | Cost control | Estimated incremental cost | Measured / billed cost | Status |
|---|---|---|---|---:|---:|---|
| 2 | Staging | Existing PAL Staging Firebase/Google Cloud project | Existing $5 monthly project alert | Usage dependent | Not yet reconciled | Active |
| 5 | Staging + Production | Hourly expired-upload cleanup invocation and quarantine storage | Packet/file limits; one hourly invocation | Low usage-dependent | Not yet reconciled | Active |
| 6 | Staging | Measurement-only ClamAV scanner: Cloud Run, Eventarc, Scheduler, Artifact Registry/build, three synthetic buckets, logs/metrics | Approved min 0, max 1, concurrency 1; stop before estimated scanner-specific spend reaches $5; dedicated $5 alert requested | Target under $5 for controlled experiment | Console showed $0.00 estimated project charges for Aug. 1–29 immediately before creation; post-creation cost not yet available | Identity and three buckets created; runtime blocked pending isolated quarantine-bucket approval |
| 6 | Production | Warm or other Production malware scanner | No authorization | Preliminary architecture estimate roughly $33–$90/month plus usage; configuration not approved | $0 | Not created |

## Required final breakdown

- Separate Staging, Production, and one-time build costs.
- Include Cloud Run CPU/memory/request time, Cloud Build, Artifact Registry, Storage capacity/operations, Eventarc, Scheduler, Logging/Monitoring, network egress, and taxes/discounts where the billing report exposes them.
- Record the date range and billing account/project scope used for every actual figure.
- Identify free-tier or credit effects separately so PAL can understand the normal cost after credits expire.
- Record every approved cost ceiling and every alert threshold, plus any overage or unexpected charge.
