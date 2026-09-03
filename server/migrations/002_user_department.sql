ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department_id TEXT NOT NULL DEFAULT 'support'
  REFERENCES departments(id);

ALTER TABLE whitelist
  ADD COLUMN IF NOT EXISTS department_id TEXT NOT NULL DEFAULT 'support'
  REFERENCES departments(id);

UPDATE users SET department_id = 'support' WHERE department_id IS NULL OR department_id = 'templates';
UPDATE whitelist SET department_id = 'support' WHERE department_id IS NULL OR department_id = 'templates';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_department_work_only'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_department_work_only
      CHECK (department_id IN ('support', 'lawyers', 'managers', 'spp'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whitelist_department_work_only'
  ) THEN
    ALTER TABLE whitelist ADD CONSTRAINT whitelist_department_work_only
      CHECK (department_id IN ('support', 'lawyers', 'managers', 'spp'));
  END IF;
END $$;
