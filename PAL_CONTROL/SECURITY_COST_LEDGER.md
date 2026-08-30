# PAL Security Program Cost Ledger

Last updated: **2026-08-30, America/New_York**

This ledger records incremental cloud/service costs created specifically by the PAL security hardening program. Amounts shown as estimates are not invoices. Google Cloud budget alerts notify; they do not enforce a hard cap. Actual billed amounts must be reconciled against the billing report before the final security package is presented.

| Package | Environment | Resource / service | Cost control | Estimated incremental cost | Measured / billed cost | Status |
|---|---|---|---|---:|---:|---|
| 2 | Staging | Existing PAL Staging Firebase/Google Cloud project | Existing $5 monthly project alert | Usage dependent | Not yet reconciled | Active |
| 5 | Staging + Production | Hourly expired-upload cleanup invocation and quarantine storage | Packet/file limits; one hourly invocation | Low usage-dependent | Not yet reconciled | Active |
| 6 | Staging | Measurement-only ClamAV scanner: Cloud Run, Eventarc, four-hour Scheduler/update job, Artifact Registry/build, four synthetic buckets, logs/metrics | Min 0, max 1, concurrency 1; stop before estimated scanner-specific spend reaches $5; dedicated $5 alert requested | Measurement runtime/storage/operations estimated below $0.10 before free tier, plus scan charges; recurring scale-to-zero usage dependent | Aug. 1–29 billing report shows **$10.40** project subtotal, almost entirely Container Images Scanned; Cloud Run CPU/memory rows were offset to `$0.00` subtotal | Rolled back private Staging scanner; retry PAUSED; discretionary paid Staging activity stopped; no Production resource |
| 6 | Staging | Artifact Registry vulnerability scans for scanner and project container images | Console-disclosed price $0.26 per newly scanned image digest | Every replacement requires a new charge/approval record; automatic scanning must be scoped before more deployments | Billing report posts **40 × $0.26 = $10.40** under SKU `Container Images Scanned` (`BEA5-E1D1-4659`). Nine scanner-candidate scans / `$2.34` were explicitly approved; the posted total is 31 units / `$8.06` above that expectation | Automatic project-wide scanning also covered Cloud Functions container images; cost-containment policy decision required before more discretionary Staging builds/deployments |
| 6 | Staging | Hourly retention worker live test | Dedicated scale-to-zero identity; bounded 50 vaults and 250 reviewers per run | Below $0.01 estimated before free tier for two short forced runs and four tiny synthetic objects | Not yet SKU-reconciled | Active in Staging; exact deletion, hold, audit, notification, and cleanup paths passed |
| 6 | Production | Warm or other Production malware scanner | No authorization | Preliminary architecture estimate roughly $33–$90/month plus usage; configuration not approved | $0 | Not created |
| 6 | Production | One accepted malware-scanner image copied into the dedicated scan-active repository | One checksum-pinned `gcrane` copy of one literal digest; no rebuild/all-tags/fallback | Approximately $0.26 Artifact Analysis plus negligible same-region registry operations | One scan incurred; posting not yet reconciled | Accepted image `sha256:e0de7bbb...d7cb`; FINISHED_SUCCESS, zero vulnerability/malicious occurrences; runtime undeployed |

## 2026-08-30 Package 6 posted billing reconciliation

- The billing report for project `pal-safety-hub-staging`, Aug. 1–29, groups **40 units / $10.40** under service `Container Registry Vulnerability Scanning`, SKU `Container Images Scanned` (`BEA5-E1D1-4659`). The SKU had `$0.00` savings and a `$10.40` subtotal. Nearly all of it posted on Aug. 29.
- PAL explicitly approved nine scanner-candidate pushes/scans, expected at **9 × $0.26 = $2.34**. The posted project total is therefore **31 scan units / $8.06 above the approved-action expectation**. This is an unexpected cost-control variance, not a security breach or a Production-data event.
- Read-only inventory currently contains 10 unique digests in the dedicated `us-east1/malware-scanner` repository and 36 unique digests in the Cloud Functions-managed `us-central1/gcf-artifacts` repository; the empty `us-east1/gcf-artifacts` repository contains zero. Because the current inventory has 46 digests while billing has posted 40 scan units, repository timing/report lag prevents invoice-grade assignment of each billed unit. The inventory and Google's automatic-scanning behavior nevertheless establish that the earlier assumption—only approved scanner candidates would be charged—was unsafe; focused Function deployments could also create newly scanned container images.
- Cloud Run memory showed `$0.01` usage offset by `-$0.01`, and Cloud Run CPU showed `$0.03` offset by `-$0.03`, leaving `$0.00` subtotals. Other visible request, storage-operation, logging, and Firestore rows were `$0.00`. Taxes or later-posting adjustments remain billing-account time dependent.
- All discretionary Staging runtime/build/deploy/scan activity is stopped. Production remains unchanged and closed. Do not delete images, disable scanning, or alter repository policy until John approves an exact cost-containment option.
- Before Package 6 can advance, PAL must choose and approve a scoped cost control, such as disabling automatic scanning on Cloud Functions-managed repositories while retaining it for the dedicated scanner repository, or moving scanner-image analysis into a separate security-build project. The choice must preserve the accepted-image gate without silently scanning unrelated deployments.

### Approved repository-scoped control

- John approved Option A. At approximately 2026-08-30 02:41–02:42 America/New_York, repository-level vulnerability scanning was set to `DISABLED / SCANNING_DISABLED` on Staging `gcf-artifacts` in both `us-central1` and `us-east1`.
- The dedicated Staging `us-east1/malware-scanner` repository was explicitly retained at `INHERITED / SCANNING_ACTIVE`. The project-level Container Scanning API remains enabled, so each future dedicated scanner digest remains subject to the required image-security gate and `$0.26` charge.
- Expected forward cost: ordinary focused Cloud Functions image pushes should no longer create automatic vulnerability-scan charges; a newly pushed malware-scanner digest remains approximately `$0.26`. Existing `$10.40` posted charges are unaffected and later billing lag/adjustments must still be reviewed.
- Security tradeoff: Staging Cloud Functions container images no longer receive Google automatic container vulnerability scanning. Source/dependency audits, PAL tests, syntax checks, and exact deployment review remain required, but they are not equivalent to container-image scanning.
- Rollback: run `gcloud artifacts repositories update gcf-artifacts --project=pal-safety-hub-staging --location=us-central1 --allow-vulnerability-scanning` and the identical command with `--location=us-east1`, then verify `SCANNING_ACTIVE`. Do not perform the rollback without a new cost/security decision because new Function digests may be billed.
- No repository, image, Function, runtime, IAM binding, credential, Production resource, or real data was created, deleted, deployed, or accessed by this policy change.

## Earlier Package 6 reconciliation record

- Direct, action-time-authorized Artifact Analysis charges are mathematically reconciled at **9 × $0.26 = $2.34 incurred**. They may post later than the test date; the ledger does not misstate the earlier `$0.52` whole-project dashboard estimate as including them.
- The earlier dashboard estimate was **$9.36 for the whole Staging project**. It is superseded by the itemized `$10.40` Container Images Scanned result above and must not be treated as the final billed amount.
- Package 6 scanner measurement/runtime was bounded at min 0, max 1, concurrency 1 and was previously estimated below `$0.10` before free tier. Later false-positive regressions add only short scale-to-zero executions, tiny synthetic objects, Eventarc requests, Function calls, and logs; no new image scan was triggered.
- The approved-action ledger remains **$2.34**, but the authoritative posted project charge is now **$10.40**, creating the documented `$8.06` variance. Production cost remains `$0` because no Package 6 Production resource exists.
- The 2026-08-30 repeat lifecycle regression and corrected encrypted-PDF rerun did not build or scan another image and added no direct Artifact Analysis charge. They added only short bounded Staging scanner/Function/Storage/Eventarc/log usage. The prior detection conclusion was retracted because its fixture was not a valid exact/start-of-file EICAR control; the verified encrypted PDF was correctly locked for manual review. The nine-scan / `$2.34` direct-charge total is unchanged.
- The 2026-08-30 retry-recovery test briefly resumed only the Staging retry schedule, forced two bounded runs, then restored `PAUSED`. It built or scanned no image and added no direct Artifact Analysis charge; only small usage-dependent Scheduler, Function, scanner, Storage, Eventarc, and logging charges may post.
- The 2026-08-30 two-phase startup/integration run itself incurred no additional scan charge and failed closed at the workflow-specific intake-field check. John then separately approved the corrected image; build `f8dfaf77-f26d-4f75-a08e-ad01bc4596da` incurred the ninth `$0.26` scan, so the direct ledger is now **9 scans / $2.34**. The accepted digest remains undeployed.
- SKU-level reconciliation is now complete for the currently posted Aug. 1–29 project report. Final invoice-grade reconciliation remains time-gated for later-posting credits, taxes, and adjustments and must record billing-account scope.

## Required final breakdown

- Separate Staging, Production, and one-time build costs.
- Include Cloud Run CPU/memory/request time, Cloud Build, Artifact Registry, Storage capacity/operations, Eventarc, Scheduler, Logging/Monitoring, network egress, and taxes/discounts where the billing report exposes them.
- Record the date range and billing account/project scope used for every actual figure.
- Identify free-tier or credit effects separately so PAL can understand the normal cost after credits expire.
- Record every approved cost ceiling and every alert threshold, plus any overage or unexpected charge.
