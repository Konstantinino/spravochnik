#!/usr/bin/env node
/**
 * Restore REST INFO folder on Yandex Disk from a local backup.
 *
 * Source: REST-INFO-export/ OR copied %AppData%\rest-info\REST-INFO\ from another PC.
 *
 * Usage:
 *   set YANDEX_TOKEN=your_oauth_token
 *   node scripts/push-yandex-restore.mjs [path-to-backup-folder]
 *
 * Dry run (list only, no upload):
 *   node scripts/push-yandex-restore.mjs --dry-run [path]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DEFAULT_SRC = path.join(ROOT, 'REST-INFO-export')
const YANDEX_FOLDER = 'REST INFO'

const JSON_FILES = [
  'guide.json',
  'guide_lawyers.json',
  'guide_managers.json',
  'guide_spp.json',
  'templates.json',
  'accounts.json',
]

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const jsonOnly = args.includes('--json-only')
const mediaOnly = args.includes('--media-only')
const srcArg = args.filter((a) => a !== '--dry-run' && a !== '--json-only' && a !== '--media-only')[0]
const SRC = path.resolve(srcArg || DEFAULT_SRC)

const token = process.env.YANDEX_TOKEN?.trim() || process.argv.find((a) => a.startsWith('y0_'))
if (!token && !dryRun) {
  console.error('Set YANDEX_TOKEN or pass token as argument')
  process.exit(1)
}

function diskPath(relativePath) {
  return relativePath ? `disk:/${YANDEX_FOLDER}/${relativePath}` : `disk:/${YANDEX_FOLDER}`
}

async function yandexFetch(url, init = {}) {
  const headers = { ...(init.headers || {}), Authorization: `OAuth ${token}` }
  return fetch(url, { ...init, headers })
}

async function ensureDir(remoteDir) {
  const parts = remoteDir.split('/').filter(Boolean)
  let current = ''
  for (const part of parts) {
    current = current ? `${current}/${part}` : part
    const encoded = encodeURIComponent(diskPath(current))
    const res = await yandexFetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encoded}`)
    if (res.status === 404) {
      const create = await yandexFetch(
        `https://cloud-api.yandex.net/v1/disk/resources?path=${encoded}`,
        { method: 'PUT' },
      )
      if (!create.ok && create.status !== 409) {
        throw new Error(`mkdir ${current}: ${create.status} ${await create.text()}`)
      }
    }
  }
}

async function uploadFile(remoteName, localPath) {
  const parent = remoteName.split('/').slice(0, -1).join('/')
  if (parent) await ensureDir(parent)
  const encoded = encodeURIComponent(diskPath(remoteName))
  const meta = await yandexFetch(
    `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encoded}&overwrite=true`,
  )
  if (!meta.ok) throw new Error(`upload meta ${remoteName}: ${meta.status} ${await meta.text()}`)
  const { href } = await meta.json()
  const body = fs.readFileSync(localPath)
  const put = await fetch(href, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  if (!put.ok && put.status !== 201 && put.status !== 202) {
    throw new Error(`upload put ${remoteName}: ${put.status}`)
  }
  console.log(`OK ${remoteName} (${body.length} bytes)`)
}

function listMediaFiles(dir, prefix = 'media') {
  const abs = path.join(dir, prefix)
  if (!fs.existsSync(abs)) return []
  const out = []
  function walk(relDir) {
    for (const name of fs.readdirSync(relDir)) {
      const full = path.join(relDir, name)
      const rel = path.relative(dir, full).split(path.sep).join('/')
      if (fs.statSync(full).isDirectory()) walk(full)
      else out.push(rel)
    }
  }
  walk(abs)
  return out
}

function countTopics(filePath, listKey) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const items = data[listKey]
    return Array.isArray(items) ? items.length : 0
  } catch {
    return 0
  }
}

function resolveJsonPath(name) {
  const direct = path.join(SRC, name)
  if (fs.existsSync(direct)) return direct
  const syncBase = path.join(SRC, '.sync-base', name)
  if (fs.existsSync(syncBase)) return syncBase
  return null
}

async function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error(`Source folder not found: ${SRC}`)
  }

  console.log('Source:', SRC)
  console.log('Target: Yandex Disk / REST INFO')
  if (dryRun) console.log('DRY RUN — upload skipped\n')

  const summary = {
    support: countTopics(resolveJsonPath('guide.json') || '', 'questions'),
    lawyers: countTopics(resolveJsonPath('guide_lawyers.json') || '', 'questions'),
    managers: countTopics(resolveJsonPath('guide_managers.json') || '', 'questions'),
    spp: countTopics(resolveJsonPath('guide_spp.json') || '', 'questions'),
    templates: countTopics(resolveJsonPath('templates.json') || '', 'templates'),
    media: listMediaFiles(SRC).length,
  }
  console.log('Backup contents:', summary)

  if (summary.support < 50 && summary.media < 10) {
    console.warn('\n⚠ Backup looks incomplete (few topics/media). Prefer data from another PC if available.\n')
  }

  const toUpload = []
  if (!mediaOnly) {
    for (const file of JSON_FILES) {
      const local = resolveJsonPath(file)
      if (!local) {
        console.warn(`Skip (missing): ${file}`)
        continue
      }
      toUpload.push({ remote: file, local })
    }
  } else {
    console.log('Media only — JSON skipped')
  }
  if (!jsonOnly) {
    for (const rel of listMediaFiles(SRC)) {
      toUpload.push({ remote: rel, local: path.join(SRC, ...rel.split('/')) })
    }
  } else if (!mediaOnly) {
    console.log('JSON only — media skipped')
  }

  console.log(`\nFiles to upload: ${toUpload.length}`)
  if (dryRun) {
    toUpload.forEach(({ remote }) => console.log(' ', remote))
    return
  }

  if (!token) throw new Error('YANDEX_TOKEN required for upload')

  const rootCheck = await yandexFetch(
    `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(diskPath())}`,
  )
  if (!rootCheck.ok) {
    throw new Error(`Cannot access "${YANDEX_FOLDER}": ${rootCheck.status} ${await rootCheck.text()}`)
  }

  await ensureDir('')
  let ok = 0
  for (const { remote, local } of toUpload) {
    await uploadFile(remote, local)
    ok += 1
  }
  console.log(`\nDone. Uploaded ${ok} files to Yandex Disk / ${YANDEX_FOLDER}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
