-- Настраиваемые разделы техподдержки (party) и подраздел «Потерянные» в архиве.
CREATE TABLE IF NOT EXISTS support_topic_sections (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 10,
  system_locked BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO support_topic_sections (id, label, sort_order, system_locked) VALUES
  ('supplier', 'Поставщик', 10, true),
  ('customer', 'Заказчик', 20, true),
  ('errors', 'Ошибки', 30, true),
  ('additional', 'Администратор', 40, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE department_subsections ADD COLUMN IF NOT EXISTS is_archive_lost BOOLEAN NOT NULL DEFAULT false;

INSERT INTO department_subsections (id, department_id, label, sort_order, party, is_archive_lost)
VALUES ('support__archive__lost', 'support', 'Потерянные', 5, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  department_id = EXCLUDED.department_id,
  is_archive_lost = true;
