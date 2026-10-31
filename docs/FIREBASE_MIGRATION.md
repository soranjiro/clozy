# Firebase Authentication and legacy migration

Firebase project: `clozy-6166b`. Authentication uses Firebase email/password, verified email, password reset, signed RS256 ID tokens, and a live Identity Toolkit account lookup on each cloud request. Deleted, disabled, unverified, revoked, anonymous, expired, forged and wrong-project identities fail closed. Neither the old session cookie nor a client-supplied email/UID authenticates a request. The local passkey remains an optional device UI lock.

Only public Web SDK configuration is exposed by `/api/firebase-config`; no service-account key is deployed. D1/R2 are bound only to the v2 environment; the production application cannot read the old D1/R2. `firebase_backups.uid` and R2 `users/<encoded UID>/` keys isolate data. Preview storage is separate from production.

## Applied migration (2026-11-01 JST)

The operator explicitly mapped one old account to the single pre-existing Clozy account. A Firebase identity with that destination email was created **unverified**, with no imported password. Its email must be verified before the server allows any cloud access. No other old account was imported into this UID.

| Data | Old source retained | Imported into selected UID |
| --- | ---: | ---: |
| Accounts | 3 | 1 |
| Clothes | 38 | 26 |
| Wear history | 119 | 99 |
| Referenced images | 35 | 24 |
| Unreferenced images | 16 | 0 (16 private archival copies) |

- Backup: 24,113,804 bytes, below the 32 MiB cloud limit.
- SHA-256: `407d29726233f4493b2f32260e8a0a2f18af848cbb3c4dcfe3a19b3ef633c43a`.
- Full backup parsed with the application's `parseBackup`; all 24 decoded image checksums matched.
- Deterministic UUIDs preserve clothing/history/image references. Invalid owners, cross-owner image prefixes, broken references and duplicate wear pairs abort the conversion.
- A private source snapshot excludes all password fields. The final source snapshot digest and source counts match the initial snapshot; no old data was written or deleted.
- Nonreferenced images are archived separately and are not attached to any garment or user wardrobe. The other accounts' referenced images remain in the original bucket.
- Original v2 `users`, `sessions`, `backups` tables remain untouched. They are not used to authenticate requests. Old authentication endpoints return 410.
- Previous R2 backup revisions and migration recovery artifacts are retained privately. Normal backup downloads use only the current UID's D1 pointer.

## First use of migrated account

In Settings → Account, enter the existing Clozy account email and choose password reset. Set a Firebase password, log in, and follow the email verification link. Log in again and choose “この端末に復元”. This replaces device data only after the existing confirmation; export any device-only changes first. The old password is not imported.

## Operations

Apply `0002_firebase.sql` only to the v2 production and preview D1 databases. `FIREBASE_PROJECT_ID` and `FIREBASE_WEB_CONFIG` are defined for both Wrangler environments. Provider configuration lives in `firebase.json`; deploy only `auth` to the existing project.

The temporary migration worker in `scripts/migration/worker.mjs` is **not** part of the Pages build. Deployment requires explicit `SOURCE_EMAIL`, `TARGET_EMAIL`, `TARGET_UID`, a random secret, old read-source and new destination bindings. Source code contains no old write/delete calls. The operator helper reads its secret from a private local file, refuses production website invocation, validates the downloaded backup, and requires that digest before committing. The temporary worker must be removed after verification. Private exports, auth fixtures and secrets must never be committed.

Rollback: retain the migration archives and original stores. Reverting the application alone re-enables the previous authentication implementation and requires a deliberate security decision; the new UID-based backup is not automatically linked to an old session. Never deploy the old database as a fallback.

## Verification

Vitest covers signed tokens, live account status, server-side backup references, deterministic migration, UID isolation and stale revisions. The existing browser smoke tests cover wardrobe editing, photos, wears, passkey and mobile layout. Preview API smoke checks invalid tokens and old cookies without creating users. `scripts/firebase-preview-test.mjs` exercises real signed Firebase tokens with disposable verified fixture accounts and removes those accounts after testing.
