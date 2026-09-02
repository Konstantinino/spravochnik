/**
 * Reset user password on the server (dev / recovery).
 * Usage: DATABASE_URL=... npx tsx src/reset-password.ts <email> <new-password>
 */
import { getPool } from './db/pool.js'
import { generateSalt, hashPassword, normalizeEmail } from './lib/auth-utils.js'
import { runMigrations } from './migrate.js'

async function main(): Promise<void> {
  const email = normalizeEmail(process.argv[2] ?? '')
  const password = process.argv[3] ?? ''

  if (!email.includes('@')) {
    console.error('Usage: npx tsx src/reset-password.ts <email> <new-password>')
    process.exit(1)
  }
  if (password.length < 6) {
    console.error('Password must be at least 6 characters')
    process.exit(1)
  }

  await runMigrations()
  const pool = getPool()
  const salt = generateSalt()
  const passwordHash = hashPassword(password, salt)

  const result = await pool.query(
    `UPDATE users SET password_hash = $1, salt = $2 WHERE email = $3 RETURNING id, name, email, role`,
    [passwordHash, salt, email],
  )

  if (!result.rowCount) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  const user = result.rows[0]
  console.log(`Password updated for ${user.email} (${user.name}, role: ${user.role})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
