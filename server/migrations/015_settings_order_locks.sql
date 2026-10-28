-- Independent reorder locks for settings lists.
-- lock_key is "{kind}:{departmentId}", e.g. phones:support, emails:lawyers, sections:support.
-- A phones lock does not block emails, sections, or topic order.
CREATE TABLE IF NOT EXISTS settings_order_locks (
  lock_key TEXT PRIMARY KEY,
  locked_by UUID NOT NULL REFERENCES users(id),
  locked_by_name TEXT NOT NULL,
  client_id TEXT NOT NULL DEFAULT '',
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
