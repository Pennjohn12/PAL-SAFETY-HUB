# Architecture overview

This is a source-review map of the August 28, 2026 public-main baseline identified in [Security status](SECURITY_STATUS.md), not a verified live deployment inventory.

## Components and trust boundaries

| Component | Responsibility | Security review focus |
| --- | --- | --- |
| Browser application | Forms, navigation, user-facing workflows | Treat all browser input and client role decisions as untrusted |
| Firebase Hosting | Serves application files | Deployment contents, exclusions, headers, and exposed artifacts |
| Firebase Authentication | Account identity and sign-in | Verification, account lifecycle, session handling, and privileged-operation requirements |
| Firestore | Structured application records | Per-user and per-project authorization, field validation, and audit integrity |
| Cloud Storage | Uploaded files and documents | Object-level authorization, upload handling, sensitive-file access, and retention |
| Firebase Functions | Trusted server operations and integrations | Caller authorization, input validation, secrets, error handling, and abuse controls |
| Google Cloud IAM | Service and administrative authority | Least privilege, runtime identities, key management, and deployment access |

Browser requests may reach Firestore and Storage under Security Rules or call server functions. Server operations using the Admin SDK can bypass Security Rules; each such path needs its own authorization review. A secure browser screen is not sufficient evidence that the underlying operation is protected.

## Sensitive workflows

Review employee and applicant identity, onboarding responses, certifications, project assignments, uploaded documents, and any identity/payroll-related collection paths. The source review does not require opening real records or downloading uploaded files.

The ongoing hardening design separates identity, verified email, active account state, authorized role, employee linkage, project/object permission, and additional verification for designated privileged actions. These are design and review categories, not a statement that every layer is implemented in this older source snapshot.

## Environment separation

- Local development and emulators provide isolated source and behavioral checks.
- Staging provides separately scoped integration testing with synthetic identities.
- Production is a separately approved release target with its own inventory and rollback requirements.

Tests apply to the exact source and environment tested. Passing local or Staging checks does not establish Production activation. Review deployment instructions before executing them; this document authorizes no deployment, migration, or account operation.
