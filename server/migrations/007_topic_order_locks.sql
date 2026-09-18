-- Department-level lock while editor reorders topics (one lock per department)
CREATE TABLE IF NOT EXISTS topic_order_locks (
  department_id TEXT PRIMARY KEY,
  locked_by UUID NOT NULL REFERENCES users(id),
  locked_by_name TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
