ALTER TABLE departments ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS system_locked BOOLEAN NOT NULL DEFAULT false;

UPDATE departments SET sort_order = 10, system_locked = false WHERE id = 'support';
UPDATE departments SET sort_order = 20, system_locked = false WHERE id = 'lawyers';
UPDATE departments SET sort_order = 30, system_locked = false WHERE id = 'managers';
UPDATE departments SET sort_order = 40, system_locked = false WHERE id = 'spp';
UPDATE departments SET sort_order = 50, system_locked = false WHERE id = 'templates';

INSERT INTO departments (id, label, list_key, sort_order, system_locked) VALUES
  ('lost', 'Потерялись', 'questions', 9990, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  list_key = EXCLUDED.list_key,
  sort_order = EXCLUDED.sort_order,
  system_locked = EXCLUDED.system_locked;

INSERT INTO topic_id_counters (department_id, next_id) VALUES
  ('lost', 1)
ON CONFLICT (department_id) DO NOTHING;
