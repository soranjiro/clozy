# Security policy

Please report potential vulnerabilities **privately**, preferably using GitHub's private vulnerability reporting for this repository when enabled. Do not publish personal wardrobe photos or backup exports in an issue.

The app has no backend, login system, trackers or analytics in v1. Local browser data and exported backups are **not encrypted**. A compromised/shared device or malicious extension can access local data. For full threat model and mitigations see [docs/security.md](docs/security.md).

Security fixes should include a regression test; dependency updates are checked by CI and Dependabot. Supported branch: `main`.
