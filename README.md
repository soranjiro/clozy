# Clozy — あなたらしいクローゼット

A Japanese wardrobe manager with local-first storage and optional Cloudflare account-backed manual backups. Local use never requires an account.

## Run locally

Requires Node.js 22.12+ and npm 10+:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (use the hostname, not an IP address, for WebAuthn passkeys). Test and build:

```bash
npm run typecheck
npm test
npm run build
npm run preview
npx playwright install chromium        # once, for browser tests
npm run verify                        # typecheck, tests, build, browser smoke
```

## Features
- Clothes: add/edit/delete, JPEG/PNG/WebP photo with EXIF-stripping re-encode, category filters, search, favorites.
- Wear history: log outfits on a local calendar date; inspect usage statistics.
- Privacy: IndexedDB local storage, versioned JSON backup including photos, validated atomic restore, destructive confirmations.
- Optional account: Cloudflare Pages Functions, isolated D1 credentials/sessions, and private per-user R2 backup objects; revision-aware manual backup and restore. This is not automatic or bidirectional synchronization.
- Japanese-first accessible/responsive UI; no third-party scripts, fonts or tracking.
- Full-width/half-width normalized multi-term search, name/registration/update sorting, filter reset, searchable outfit picker and calendar jump to today.
- Optional local passkey app lock (Settings → パスキーを登録), explicit lock and automatic lock after one minute in the background. ES256 assertions verify challenge, origin, RP ID hash, user presence, user verification and signature.
- Unsaved-edit confirmation and readable error/retry states; multiline clothing notes.
- Register up to 20 clothes from multiple photos or one name per line, review categories, and retry failed rows without duplicating successful ones.
- Seasonal wardrobe and storage filters: archived clothes keep their photos/history and can be brought back for the next season. Legacy clothes default to all seasons.
- Local outfit candidates prioritize less-worn in-season, non-stored garments, with optional outerwear, alternatives, and atomic wear recording. Explicit rules, not AI/weather/color/TPO inference.
- Missing-category checklist and stored alternatives, user-saved HTTPS product links, explicit ZOZOTOWN search links. No ZOZO login, purchase-history sync or scraping.
- Unworn/archived counts, known purchase totals and cost-per-wear insights; purchase prices are optional.

## Data and privacy
By default, your data stays in **this browser profile**, unencrypted. Clearing browser data may delete it. When you deliberately use **cloud backup**, the browser uploads the versioned JSON snapshot (including encoded images) to a private Cloudflare R2 bucket under your signed-in account; it is not end-to-end encrypted. Downloading a backup replaces the current device's data after confirmation. The cloud backup size limit is 32 MiB; local JSON export remains available up to 75 MiB. Cross-device automatic sync and guaranteed offline support are not included. Cloud accounts presently use email/password without email verification, password reset, MFA, or rate-limiting on registration; keep a safe local export and use a unique strong password.

## Local passkey lock

The optional passkey lock remains local-only, **not a server-authenticated account credential**. Cloud accounts use separate server-side email/password authentication. Register a passkey in Settings over HTTPS (or localhost). Registration asks for an assertion to verify the key before saving its public key in this browser. Face/fingerprint/PIN verification is handled by your OS; Clozy receives no biometrics. Existing wardrobes are not forced through registration.

The app locks on reload, on explicit lock, and after at least one minute in the background. Unlocking is memory-only; there is no persistent login token. Passkey metadata is separate from wardrobe backups and deleting wardrobe data does not disable the lock. To disable it normally, verify the registered passkey in Settings. No account recovery is provided: keep a wardrobe backup and an OS-synced passkey or another OS-supported access method.

**This is an accidental-access UI guard, not an encryption/security boundary against someone controlling your browser.** IndexedDB and backups remain plaintext. Developer tools, modified JavaScript, extensions or deletion of local lock metadata can bypass it. Cloud account authentication is separate; the local passkey alone does not encrypt data or authenticate cloud sessions. Each preview/production origin has separate registration and data. Real authenticator/browser compatibility still needs device testing.

## Bounded local verification automation

```bash
npm run verify                         # typecheck → tests → build → browser smoke
npm run improve:watch                   # watch changes for up to 5 hours
npm run improve:watch -- --hours 1 --interval 10
```

The watcher checks once immediately, then only when source/configuration changes. It stops at the configured wall-clock deadline (maximum 5 hours) or with Ctrl+C. It does **not** call paid APIs, install packages, commit, push, deploy, or generate code. This is verification automation, not an autonomous AI improvement service and not detection of an AI provider's usage limit. It must run on your machine; sleep, termination or a closed environment can interrupt it. Existing CI still verifies pushes/PRs independently.

## Autonomous editing and production publication

Separate from the watcher, the explicitly opt-in controller actually launches Pi to edit code, independently verifies it, and publishes through PR → CI/CodeQL → protected squash merge → production CI/deployment → live smoke:

```bash
npm run improve:auto -- --publish --hours 5 --max-cycles 20 --provider PROVIDER --model MODEL
```

It uses your already-authenticated Pi model and **consumes that model's usage allowance**. No quota circumvention, alternate providers, billing activation or cloud provisioning. A separate worktree preserves the current checkout. Failures, usage limits, concurrent production changes, no meaningful work left or the five-hour deadline stop it. Source/docs-only changes are allowed; workers cannot change the controller, deployment workflow or dependency manifests through the publication gate. This is not an OS sandbox or a guarantee that AI-written code is defect-free.

See [autonomous improvement plan](docs/AUTOPILOT.md) for priorities, official integration research, limitations, logs/status and stopping instructions. Chromium browser tests include a virtual passkey authenticator; real OS/browser testing is still recommended. To test a deployed site with synthetic data in a fresh ephemeral browser context: `CLOZY_URL=https://clozy.pages.dev npm run test:browser`.

## Monorepo
```
apps/web               React + Vite UI
packages/domain        Wardrobe and Wear Journal entities and invariants
packages/application   Repository port, use cases, backup validation
packages/storage       IndexedDB adapter and image normalization
docs/                  Improvement plan, integration research and implementation notes
```

Module imports must follow `web -> application -> domain`; `storage` implements the application repository port. No submodules.

## Deployment

Cloudflare Pages is deployed through [GitHub Actions](.github/workflows/ci.yml), using the Direct Upload project `clozy`. The same-origin backend consists of Pages Functions under `functions/api/` with **separate production and preview** D1/R2 bindings in `wrangler.jsonc`. The workflow creates this project on first deployment with `main` as its production branch.

- Push/merge to `main`: deploy the verified build to production (`https://clozy.pages.dev`, once the project is created).
- Open/update a PR against `main`: deploy to a separate `pr-N` branch alias. Find the URL in the PR's deployment/environment link or the Actions job summary. Updates to the same PR keep the same alias.
- Typecheck, unit tests, build, Chromium browser smoke and dependency audit must pass before either deployment. The exact tested build artifact is uploaded; it is not rebuilt for deployment.
- There is no staging environment. Fork and Dependabot PRs run checks without deployment credentials or previews.
- `workflow_dispatch` on `main` can retry production deployment manually.

Required **repository Actions secrets** in `soranjiro/clozy`:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Target Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | API token scoped to that account with **Cloudflare Pages: Edit** |

Never commit token values. GitHub supplies `GITHUB_TOKEN` automatically for deployment links. Do not enable a second Cloudflare Git integration for this project: Actions owns deployment and verification.

The output directory is `apps/web/dist`; `_headers` carries security headers. Wardrobe data is stored per browser origin, so production and each PR preview have separate local data. Cloud production and preview storage are isolated. Preview URLs are publicly accessible. The archived `clozy` D1, `clothimage` R2 and `backend` Worker are untouched. Do not expose the development server publicly.

For implementation priorities and integration limitations: [improvement plan](docs/AUTOPILOT.md). For privacy/security risks: [security policy](SECURITY.md).

## Migration note
Legacy repositories are archived. No legacy credentials, JWTs, image files or databases are imported automatically.

## Cloud account lifecycle

- `docs/migrations/0001_cloud_accounts.sql` defines the isolated `clozy-v2` and `clozy-v2-preview` D1 schema. The Cloudflare Pages project binds `DB` and the private `BACKUPS` R2 bucket. Never attach the old database as a fallback.
- Sessions are random opaque HttpOnly Secure SameSite=Lax cookies, stored as SHA-256 digests; passwords use salted PBKDF2-SHA256. State-changing endpoints require a same-origin `Origin` header. Failed logins are throttled per email; add network-level anti-automation controls before wide public sign-ups.
- Registration/login and manual cloud backup are optional. Cloud backup revisions use conditional writes to prevent silent concurrent overwrites. Data is stored in a per-account, unlisted R2 object and exposed only through an authenticated same-origin endpoint.
- Account deletion also deletes its active sessions and currently referenced backup. Explicit logout does not clear this device's local wardrobe; clear it independently on shared devices.
- **Not yet supported:** email verification, password resets, MFA, automatic per-item sync, encrypted backups where Cloudflare cannot read their contents, self-service account recovery. Do not describe this as finished enterprise-grade identity infrastructure.
- Legacy `clozy.vercel.app` is not used by this repository. `vercel.json` was removed. Deleting the Vercel project itself requires checking its actual owner and integrations.
