-- Departments (fixed seed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  list_key TEXT NOT NULL CHECK (list_key IN ('questions', 'templates'))
);

INSERT INTO departments (id, label, list_key) VALUES
  ('support', 'Тех. поддержка', 'questions'),
  ('lawyers', 'Юристы', 'questions'),
  ('managers', 'Менеджеры', 'questions'),
  ('spp', 'СПП', 'questions'),
  ('templates', 'Шаблоны', 'templates')
ON CONFLICT (id) DO NOTHING;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whitelist (
  email TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS removed_emails (
  email TEXT PRIMARY KEY
);

-- Topics
CREATE TABLE IF NOT EXISTS topics (
  department_id TEXT NOT NULL REFERENCES departments(id),
  id INTEGER NOT NULL,
  question TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  parent_id INTEGER,
  has_children BOOLEAN NOT NULL DEFAULT false,
  party TEXT CHECK (party IS NULL OR party IN ('supplier', 'customer')),
  archived BOOLEAN NOT NULL DEFAULT false,
  image_display JSONB,
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (department_id, id)
);

CREATE INDEX IF NOT EXISTS idx_topics_updated_at ON topics(updated_at);
CREATE INDEX IF NOT EXISTS idx_topics_deleted_at ON topics(deleted_at);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(department_id, parent_id);

-- Topic edit locks (when editor opens a topic)
CREATE TABLE IF NOT EXISTS topic_locks (
  department_id TEXT NOT NULL,
  topic_id INTEGER NOT NULL,
  locked_by UUID NOT NULL REFERENCES users(id),
  locked_by_name TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (department_id, topic_id)
);

-- Media metadata
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id INTEGER,
  department_id TEXT,
  relative_path TEXT NOT NULL UNIQUE,
  sha256 TEXT,
  size_bytes BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_media_updated_at ON media_files(updated_at);

-- Sync state
CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO sync_state (key, value) VALUES ('global_version', '0')
ON CONFLICT (key) DO NOTHING;

-- App releases
CREATE TABLE IF NOT EXISTS app_releases (
  version TEXT PRIMARY KEY,
  setup_filename TEXT NOT NULL,
  notes TEXT DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-department next id counter
CREATE TABLE IF NOT EXISTS topic_id_counters (
  department_id TEXT PRIMARY KEY REFERENCES departments(id),
  next_id INTEGER NOT NULL DEFAULT 1
);

INSERT INTO topic_id_counters (department_id, next_id) VALUES
  ('support', 1), ('lawyers', 1), ('managers', 1), ('spp', 1), ('templates', 1)
ON CONFLICT (department_id) DO NOTHING;
