# IT security review guide

## Review scope

Begin with the source snapshot identified in [Security status](SECURITY_STATUS.md). Record the exact commit in the review report. This baseline can be assessed on its own, but is not the complete newer security implementation.

Source, rules, dependency manifests, and tests can be reviewed without cloud-console access, private credentials, real accounts, or employee data. Public-source access does not require collaborator write permissions.

Dynamic testing, live configuration inspection, account creation, permission changes, and deployment require a separate agreed scope. Repository access is not authorization for those actions.

## Suggested review order

1. Read the architecture and status documents to establish version and environment boundaries.
2. Trace registration, role assignment, account disablement, verification, and session handling.
3. Check cross-user, cross-employee, cross-project, and document-access authorization in both rules and backend code.
4. Inspect public or bearer-link workflows, input validation, and privileged server operations.
5. Review dependency manifests, secret handling, deployment configuration, logs, abuse controls, and retention behavior.
6. Compare tests with the security claims they actually exercise, including denial cases and partial failures.

Older implementation notes may describe historical role or bootstrap behavior. Treat them as evidence to investigate, not as approved current instructions. A finding in this baseline may already have a newer local correction; that correction still needs evidence before closing the finding.

## Reporting findings

Use the private channel agreed with the repository owner. Each finding should include:

- Reviewed commit and relevant file/component.
- Required access and prerequisites.
- Observed behavior, expected behavior, and practical impact.
- Safe reproduction using synthetic information, where appropriate.
- Suggested correction and verification needed.

Do not publish credentials, personal records, private URLs, or sensitive reproduction details in public issues. Separate demonstrated vulnerabilities from unverified concerns and unavailable evidence.

## Limits of a source-only review

Source alone cannot prove current IAM permissions, deployed rule bytes, service revisions, provider configuration, runtime secrets, backups, or monitoring. Request a separately scoped deployment inventory when those facts are necessary. Do not assume that a branch name or successful test means the same code is live.
