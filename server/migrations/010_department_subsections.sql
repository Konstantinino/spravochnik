CREATE TABLE IF NOT EXISTS department_subsections (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_department_subsections_dept
  ON department_subsections(department_id, sort_order);

ALTER TABLE topics ADD COLUMN IF NOT EXISTS subsection_id TEXT
  REFERENCES department_subsections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_topics_subsection
  ON topics(department_id, subsection_id);
