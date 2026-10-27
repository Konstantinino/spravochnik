-- Distinguish concurrent reorder sessions for the same user (web tab vs desktop app).
ALTER TABLE topic_order_locks
  ADD COLUMN IF NOT EXISTS client_id TEXT NOT NULL DEFAULT '';
