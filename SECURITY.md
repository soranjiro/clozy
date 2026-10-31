# Security policy

Please report potential vulnerabilities **privately**, preferably using GitHub's private vulnerability reporting for this repository when enabled. Do not publish personal wardrobe photos or backup exports in an issue.

The app has no backend, server-side account system, trackers or analytics. An optional WebAuthn passkey lock verifies ES256 assertions locally (fresh challenge, exact origin, RP ID hash, user presence/verification and signature). It is a UI guard, **not** an encryption or authoritative authentication boundary: a user controlling browser storage, scripts or developer tools can bypass it. Passkey metadata is not exported in wardrobe backups. Losing a passkey has no application-managed recovery path; keep secure backups and use your OS passkey recovery/sync facilities. Local browser data and exported backups are **not encrypted**. A compromised/shared device or malicious extension can access local data. For full threat model and mitigations see [docs/security.md](docs/security.md).

Security fixes should include a regression test; dependency updates are checked by CI and Dependabot. Supported branch: `main`.
