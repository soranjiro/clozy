# Security and privacy baseline

## Threat model
Assets: item names, photos, wear dates, exported backups. Attackers: a malicious web page/script, someone sharing the same device/browser profile, supply-chain dependency compromise, malicious image/backup. Trust boundaries: file input -> browser codec -> local DB; backup JSON -> validator -> local DB; compiled application -> hosting provider.

## Mitigations in v1
- Static app: no user data sent to a backend; no account, session cookie, API key, or exposed server secret.
- Narrow production CSP / Referrer-Policy / X-Content-Type-Options / HSTS / Permissions-Policy / frame restrictions via `vercel.json`; equivalent Cloudflare `_headers`.
- No dangerouslySetInnerHTML, third-party scripts, remote assets, user-supplied outbound links.
- Photos: reject SVG and other non-allowlisted formats, max upload bytes, decode and re-encode to canvas WebP/JPEG with dimensions capped; binary data never HTML-rendered. No EXIF retained.
- Backup: size limit, exact supported version, validation of every entity/date/category and relationships, image type allowlist, UUID/size bounds, user confirmation before atomic replace.
- No dangerous collection of passwords. Data is unencrypted locally; no assertion of end-to-end encryption.
- Dependency review via npm audit (high and critical fail), GitHub Dependabot, CI least-privilege permissions, pinned Actions major versions.

## Risks and follow-ups
- Device compromise, malicious extensions and shared browser profiles can see local data.
- Backups are plaintext; share/store them securely. Add optional password-protected export in a future issue if needed.
- A browser can evict IndexedDB; users must export backups. Storage persistence API is best-effort and requires UI explanation.
- Static deployments need CSP/header verification at the actual hosting origin. Vercel project binding and domain/HTTPS verification are manual owner actions.
- Multi-tab simultaneous updates can cause stale UI; follow-up cross-tab notification and uniqueness constraints.
- Add Playwright axe-core audit and image/backup fuzz/property testing; add vulnerability disclosure process.

## Incident response
If a dependency advisory affects deployed code, upgrade, run CI, redeploy and publish a short notice. Never put credentials, access tokens or user backups in issues or logs.
