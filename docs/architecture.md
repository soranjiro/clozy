# Architecture — DDD modular monorepo

## Technology decision (ADR-001)
- **Vite 8 + React 19 + TypeScript 7**, built into static assets; avoid an unnecessary SSR/API attack surface.
- **npm workspaces** (no git submodules). Node >=22.12.
- Deploy static build `apps/web/dist` to Vercel (existing project can be reconnected) or another static host.
- IndexedDB with a thin repository adapter, no cookies/tokens/credentials; no third-party CDN or analytics.
- GitHub Actions for CI and security audit. Production deployment through the hosting provider's Git integration **requires owner configuration**; GitHub repo creation does not automatically connect Vercel.

## Bounded contexts
1. **Wardrobe**: Clothing aggregate, fields, category, invariant/validation; independent of React and storage.
2. **Wear journal**: WearEntry aggregate referencing Clothing ID, unique (clothing, local-date), calendar projection.
3. **Backup / local persistence**: Repository port in `@clozy/application`, IndexedDB adapter in `@clozy/storage` with an atomic restore strategy; image blobs separate from entities.
4. **Experience (apps/web)**: Accessible views and interactions, async workflow orchestration through application service, no business rules in JSX.

## Dependency direction
```
apps/web -> application -> domain
     |            ^
     +-> storage -+
```
Domain knows no browser, UI, database, or HTTP. Application coordinates repository ports and use cases. Storage implements the port. UI uses application service.

## Data model
- Clothing: id UUID, name, category enum, optional brand/color/size/notes, favorite, imageId?, createdAt/updatedAt UTC ISO.
- WearEntry: id UUID, clothingId UUID, date YYYY-MM-DD (local calendar), createdAt ISO.
- image store: key imageId, value processed webp/jpeg Blob.
- IndexedDB database `clozy-local`, schema version 1, object stores `clothing`, `wears`, `images`.
- Deletes cascade wear entries and the old image in a single IndexedDB readwrite transaction.
- Backups are versioned, validated, bounded, and restored in one multi-store transaction. Existing state is untouched on validation failure.

## Consistency and migration
- A single active browser profile is the consistency boundary. No concurrent network writers.
- UUIDs provide stable identity. Unique wear-entry key implemented by application guard and user-facing toggles; future compound unique index needed for multi-tab concurrency.
- Migrations occur by incrementing database version and adding upgrade logic, never silently deleting data.
- Cross-device sync, if introduced, requires a separate identity bounded context, owner-scoped server authorization, encrypted transport, conflict resolution, audit logging, and rate limiting (new ADR).

## Architectural constraints
- Modules must not import from apps/web.
- Browser storage is replaceable via Repository port.
- Domain validates all inputs, including import.
- No migration of archived credentials or JWTs.
