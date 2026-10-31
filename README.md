# Clozy — あなたらしいクローゼット

A privacy-first Japanese wardrobe manager rebuilt from the archived Clozy product. No account, API key or server-side database required.

## Run locally

Requires Node.js 22.12+ and npm 10+:

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173. Test and build:

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Features
- Clothes: add/edit/delete, JPEG/PNG/WebP photo with EXIF-stripping re-encode, category filters, search, favorites.
- Wear history: log outfits on a local calendar date; inspect usage statistics.
- Privacy: IndexedDB local storage, versioned JSON backup including photos, validated atomic restore, destructive confirmations.
- Japanese-first accessible/responsive UI; no third-party scripts, fonts or tracking.

## Data and privacy
Your data stays in **this browser profile**, but it is **not encrypted**. Clearing browser data may delete it. Backups are plaintext JSON; store them securely. The first visit requires loading static assets from the hosting provider. Cross-device sync, accounts and guaranteed offline support are not included.

## Monorepo
```
apps/web               React + Vite UI
packages/domain        Wardrobe and Wear Journal entities and invariants
packages/application   Repository port, use cases, backup validation
packages/storage       IndexedDB adapter and image normalization
docs/                  Requirements, DDD architecture, ADR, threat model
```

Module imports must follow `web -> application -> domain`; `storage` implements the application repository port. No submodules.

## Deployment

Cloudflare Pages is deployed through [GitHub Actions](.github/workflows/ci.yml), using the Direct Upload project `clozy`. The workflow creates this project on first deployment with `main` as its production branch.

- Push/merge to `main`: deploy the verified build to production (`https://clozy.pages.dev`, once the project is created).
- Open/update a PR against `main`: deploy to a separate `pr-N` branch alias. Find the URL in the PR's deployment/environment link or the Actions job summary. Updates to the same PR keep the same alias.
- Typecheck, tests, build and dependency audit must pass before either deployment. The exact tested build artifact is uploaded; it is not rebuilt for deployment.
- There is no staging environment. Fork and Dependabot PRs run checks without deployment credentials or previews.
- `workflow_dispatch` on `main` can retry production deployment manually.

Required **repository Actions secrets** in `soranjiro/clozy`:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Target Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | API token scoped to that account with **Cloudflare Pages: Edit** |

Never commit token values. GitHub supplies `GITHUB_TOKEN` automatically for deployment links. Do not enable a second Cloudflare Git integration for this project: Actions owns deployment and verification.

The output directory is `apps/web/dist`; `_headers` carries security headers. Wardrobe data is stored per browser origin, so production and each PR preview have separate local data. Preview URLs are publicly accessible. Do not expose the development server publicly.

For product scope, acceptance criteria and non-goals: [requirements](docs/requirements.md). For DDD design: [architecture](docs/architecture.md). For privacy/security risks: [security](docs/security.md).

## Migration note
Legacy repositories are archived. No legacy credentials, JWTs, image files or databases are imported automatically.
