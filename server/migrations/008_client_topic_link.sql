-- Admin (party additional) topic link to client-facing topic
ALTER TABLE topics ADD COLUMN IF NOT EXISTS client_topic_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_topics_client_link
  ON topics (department_id, client_topic_id)
  WHERE client_topic_id IS NOT NULL AND deleted_at IS NULL;
