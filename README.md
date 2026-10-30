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
Vercel: import `soranjiro/clozy` as a project, set **Root Directory = repository root**, and use `vercel.json` (output: `apps/web/dist`). Connecting the Vercel project requires repository owner action. On Git integration, Vercel can deploy each merged commit automatically. GitHub Actions runs typecheck, unit tests, build, and dependency audit on PRs/pushes.

Cloudflare Pages alternative: build command `npm run build`, output `apps/web/dist`; the generated `_headers` file carries production security headers. Do not expose the development server publicly.

For product scope, acceptance criteria and non-goals: [requirements](docs/requirements.md). For DDD design: [architecture](docs/architecture.md). For privacy/security risks: [security](docs/security.md).

## Migration note
Legacy repositories are archived. No legacy credentials, JWTs, image files or databases are imported automatically.
