-- Apply to v2 databases only. Keep previous users, sessions and backups intact.
CREATE TABLE IF NOT EXISTS firebase_backups (
 uid TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, revision INTEGER NOT NULL,
 bytes INTEGER NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS deleted_firebase_accounts (uid TEXT PRIMARY KEY, deleted_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS legacy_imports (
 id TEXT PRIMARY KEY, source_email TEXT NOT NULL UNIQUE, approved_email TEXT NOT NULL UNIQUE,
 uid TEXT UNIQUE, object_key TEXT NOT NULL UNIQUE, sha256 TEXT NOT NULL,
 bytes INTEGER NOT NULL, clothes INTEGER NOT NULL, wears INTEGER NOT NULL, images INTEGER NOT NULL,
 created_at TEXT NOT NULL, claimed_at TEXT
);
