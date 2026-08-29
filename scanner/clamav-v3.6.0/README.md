# PAL hardened ClamAV scanner source overlay

This directory records PAL's reviewable remediation of Google's `docker-clamav-malware-scanner` v3.6.0 source at exact commit `0db019c9f09494215aa4485b71094e9b8d5ea90b`.

`pal-hardening.patch` pins all container inputs, removes unused or vulnerable runtime packages, updates affected dependencies, replaces the removed logging helper with direct structured Pino configuration, removes npm tooling from the final runtime image, and pins the build output tag.

Run `prepare-and-test.ps1` from this directory to clone the exact upstream revision into a new temporary folder, verify the revision, apply the checked-in patch, install the locked dependencies, audit runtime dependencies, compile, and run the scanner's 34 unit tests. The script does not authenticate to Google Cloud, push an image, create resources, deploy a service, or incur an Artifact Analysis charge.

The patched source is a candidate only. It is not approved for runtime until a new immutable image is built, independently scanned, meets the acceptance criteria in `PAL_CONTROL/SENSITIVE_VAULT_DESIGN.md`, and is explicitly approved for Staging measurement.
