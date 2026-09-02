import fs from 'node:fs'
import path from 'node:path'
import { getPool, bumpGlobalVersion, withTransaction } from './db/pool.js'
import { runMigrations } from './migrate.js'
import { ensureBootstrapWhitelist } from './routes/auth.js'
import { refreshHasChildren } from './lib/topics.js'

const DEPARTMENT_FILES: Record<string, string> = {
  support: 'guide.json',
  lawyers: 'guide_lawyers.json',
  managers: 'guide_managers.json',
  spp: 'guide_spp.json',
  templates: 'templates.json',
}

interface GuideItem {
  id: number
  question?: string
  answer?: string
  parent_id?: number | null
  has_children?: boolean
  party?: string
  archived?: boolean
  image_display?: Record<string, number>
  photos?: unknown[]
  documents?: unknown[]
}

interface AccountsData {
  users?: Array<{
    id: string
    name: string
    email: string
    passwordHash: string
    salt: string
    role: string
    createdAt: string
  }>
  whitelist?: string[]
  removedEmails?: string[]
}

async function copyMediaTree(src: string, dest: string, pool: ReturnType<typeof getPool>): Promise<void> {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyMediaTree(srcPath, destPath, pool)
    } else {
      fs.copyFileSync(srcPath, destPath)
      const relFromDest = path.relative(dest, destPath)
      const mediaRel = `media/${path.join(path.basename(src), relFromDest).replace(/\\/g, '/')}`
      const stat = fs.statSync(destPath)
      await pool.query(
        `INSERT INTO media_files (relative_path, size_bytes, updated_at)
         VALUES ($1, $2, NOW()) ON CONFLICT (relative_path) DO NOTHING`,
        [mediaRel.replace(/^media\/media\//, 'media/'), stat.size],
      )
    }
  }
}

async function importFromDir(dataDir: string, mediaDir?: string): Promise<void> {
  await runMigrations()
  await ensureBootstrapWhitelist()

  const pool = getPool()
  await pool.query(`SET client_encoding TO 'UTF8'`)
  const targetMedia = mediaDir ?? path.join(dataDir, 'media')
  const serverMedia = process.env.MEDIA_DIR ?? path.join(process.cwd(), 'data', 'media')
  fs.mkdirSync(serverMedia, { recursive: true })

  const accountsPath = path.join(dataDir, 'accounts.json')
  if (fs.existsSync(accountsPath)) {
    const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8')) as AccountsData
    for (const email of accounts.whitelist ?? []) {
      await pool.query(
        'INSERT INTO whitelist (email) VALUES ($1) ON CONFLICT DO NOTHING',
        [email.trim().toLowerCase()],
      )
    }
    for (const email of accounts.removedEmails ?? []) {
      await pool.query(
        'INSERT INTO removed_emails (email) VALUES ($1) ON CONFLICT DO NOTHING',
        [email.trim().toLowerCase()],
      )
    }
    let importedUsers = 0
    for (const u of accounts.users ?? []) {
      if (!u.passwordHash || !u.salt) {
        console.warn(`Skip user without password hash: ${u.email}`)
        continue
      }
      const createdAt =
        u.createdAt ??
        (u as { created_at?: string }).created_at ??
        new Date().toISOString()
      await pool.query(
        `INSERT INTO users (name, email, password_hash, salt, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET
           name = $1, password_hash = $3, salt = $4, role = $5`,
        [u.name, u.email.toLowerCase(), u.passwordHash, u.salt, u.role, createdAt],
      )
      importedUsers += 1
    }
    console.log(`Imported accounts: ${importedUsers} users, ${accounts.whitelist?.length ?? 0} whitelist`)
  }

  for (const [deptId, fileName] of Object.entries(DEPARTMENT_FILES)) {
    const filePath = path.join(dataDir, fileName)
    if (!fs.existsSync(filePath)) continue

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>
    const listKey = deptId === 'templates' ? 'templates' : 'questions'
    const items = (data[listKey] as GuideItem[]) ?? []
    let maxId = 0

    await withTransaction(async (client) => {
      for (const item of items) {
        if (typeof item.id !== 'number') continue
        maxId = Math.max(maxId, item.id)

        await client.query(
          `INSERT INTO topics (
             department_id, id, question, answer, parent_id, has_children, party,
             archived, image_display, photos, documents, version
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1)
           ON CONFLICT (department_id, id) DO UPDATE SET
             question = $3, answer = $4, parent_id = $5, has_children = $6, party = $7,
             archived = $8, image_display = $9, photos = $10, documents = $11,
             version = topics.version + 1, updated_at = NOW()`,
          [
            deptId,
            item.id,
            item.question ?? '',
            item.answer ?? '',
            item.parent_id ?? null,
            Boolean(item.has_children),
            item.party ?? null,
            Boolean(item.archived),
            item.image_display ? JSON.stringify(item.image_display) : null,
            JSON.stringify(item.photos ?? []),
            JSON.stringify(item.documents ?? []),
          ],
        )
      }

      await client.query(`UPDATE topic_id_counters SET next_id = $2 WHERE department_id = $1`, [
        deptId,
        maxId + 1,
      ])
      await refreshHasChildren(deptId, client)
    })

    console.log(`Imported ${items.length} topics for ${deptId}`)
  }

  if (fs.existsSync(targetMedia)) {
    await copyMediaTree(targetMedia, serverMedia, pool)
    console.log('Media copied')
  }

  await bumpGlobalVersion()
  console.log('Import complete')
}

const dataDir = process.argv[2]
if (!dataDir) {
  console.error('Usage: node import-from-json.js <data-directory> [media-directory]')
  process.exit(1)
}

importFromDir(path.resolve(dataDir), process.argv[3] ? path.resolve(process.argv[3]) : undefined)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
