# Staging Integration Boundary

Verified: **2026-08-28, America/New_York**

## Allowed Staging backend surface

- Exactly one deployed Function is listed: `stagingEnvironmentHealth` in `us-east1`.
- The Function returns only environment-health metadata and is capped at one instance.
- Its deployed configuration lists only Firebase-generated project/runtime variables.
- The isolated Staging source contains no email, SMS, AI, payroll, onboarding, scheduled-job, or Production integration code.
- The Staging Function source declares no provider secret.

## Denied-by-absence integrations

- No Resend/email Function is deployed.
- No Twilio/SMS Function is deployed.
- No AI Function is deployed.
- No scheduler Function is deployed.
- No Production function codebase is deployed to Staging.
- No PAL provider credential was copied or entered during Staging setup.

This is the current Staging integration allowlist: only the isolated health Function is allowed. Adding any provider integration requires a separate synthetic-only design, an explicit allowlist, narrow non-Production credentials, cost/abuse controls, and approval before deployment.
