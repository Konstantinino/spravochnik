-- Подразделы техподдержки привязаны к категории (party = раздел).
ALTER TABLE department_subsections ADD COLUMN IF NOT EXISTS party TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_department_subsections_dept_party
  ON department_subsections(department_id, party, sort_order);
