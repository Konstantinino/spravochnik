import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPool } from './db/pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, '../migrations')
  const pool = getPool()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const id = file.replace(/\.sql$/, '')
    const existing = await pool.query('SELECT id FROM schema_migrations WHERE id = $1', [id])
    if (existing.rowCount && existing.rowCount > 0) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    await pool.query('BEGIN')
    try {
      await pool.query(sql)
      await pool.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id])
      await pool.query('COMMIT')
      console.log(`Migration applied: ${file}`)
    } catch (err) {
      await pool.query('ROLLBACK')
      throw err
    }
  }
}
