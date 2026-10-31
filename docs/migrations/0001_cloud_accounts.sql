-- Isolated Clozy v2 databases only; do not apply to archived clozy D1.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  salt TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS login_attempts (
  email TEXT PRIMARY KEY, failed INTEGER NOT NULL DEFAULT 0, blocked_until INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS backups (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL, revision INTEGER NOT NULL, bytes INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
