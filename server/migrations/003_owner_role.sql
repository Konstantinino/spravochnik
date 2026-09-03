ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'editor', 'admin', 'owner'));

CREATE UNIQUE INDEX IF NOT EXISTS users_single_owner ON users ((true)) WHERE role = 'owner';
