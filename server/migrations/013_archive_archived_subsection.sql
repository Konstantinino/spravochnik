-- Подраздел «Архивированные» в архиве техподдержки (ручная архивация тем).
ALTER TABLE department_subsections ADD COLUMN IF NOT EXISTS is_archive_archived BOOLEAN NOT NULL DEFAULT false;

INSERT INTO department_subsections (id, department_id, label, sort_order, party, is_archive_lost, is_archive_archived)
VALUES ('support__archive__archived', 'support', 'Архивированные', 3, NULL, false, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  department_id = EXCLUDED.department_id,
  sort_order = EXCLUDED.sort_order,
  is_archive_archived = true;

UPDATE topics
   SET subsection_id = 'support__archive__archived'
 WHERE department_id = 'support'
   AND archived = true
   AND deleted_at IS NULL
   AND (subsection_id IS NULL OR subsection_id <> 'support__archive__lost');
