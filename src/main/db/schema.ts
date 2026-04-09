export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version   INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  mode           TEXT NOT NULL DEFAULT 'chat',
  system_prompt  TEXT,
  provider_id    TEXT,
  model          TEXT,
  workspace_path TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  content         TEXT NOT NULL,
  tool_use_id     TEXT,
  seq             INTEGER NOT NULL,
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, seq);

CREATE TABLE IF NOT EXISTS openrouter_models (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  description        TEXT,
  context_length     INTEGER,
  pricing_prompt     REAL,
  pricing_completion REAL,
  fetched_at         TEXT NOT NULL
);
`
