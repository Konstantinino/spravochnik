#!/usr/bin/env node
/**
 * One-time pull of REST INFO folder from Yandex Disk into REST-INFO-export/.
 *
 * Usage:
 *   set YANDEX_TOKEN=your_oauth_token
 *   node scripts/pull-yandex-export.mjs
 *
 * Or: node scripts/pull-yandex-export.mjs <token>
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'REST-INFO-export')
const YANDEX_FOLDER = 'REST INFO'

const JSON_FILES = [
  'guide.json',
  'guide_lawyers.json',
  'guide_managers.json',
  'guide_spp.json',
  'templates.json',
  'accounts.json',
]

const token = process.env.YANDEX_TOKEN?.trim() || process.argv[2]?.trim()
if (!token) {
  console.error('Set YANDEX_TOKEN or pass token as first argument')
  process.exit(1)
}

function diskPath(relativePath) {
  return relativePath ? `disk:/${YANDEX_FOLDER}/${relativePath}` : `disk:/${YANDEX_FOLDER}`
}

async function yandexFetch(url, init = {}) {
  const headers = { ...(init.headers || {}), Authorization: `OAuth ${token}` }
  return fetch(url, { ...init, headers })
}

async function downloadFile(relativePath, destPath) {
  const encoded = encodeURIComponent(diskPath(relativePath))
  const meta = await yandexFetch(
    `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encoded}`,
  )
  if (meta.status === 404) {
    console.warn(`Skip (not found): ${relativePath}`)
    return false
  }
  if (!meta.ok) {
    throw new Error(`Download meta ${relativePath}: ${meta.status} ${await meta.text()}`)
  }
  const { href } = await meta.json()
  const fileRes = await fetch(href)
  if (!fileRes.ok) throw new Error(`Download ${relativePath}: HTTP ${fileRes.status}`)
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.writeFileSync(destPath, Buffer.from(await fileRes.arrayBuffer()))
  console.log(`OK ${relativePath}`)
  return true
}

async function listDir(relativeDir) {
  const encoded = encodeURIComponent(diskPath(relativeDir))
  const res = await yandexFetch(
    `https://cloud-api.yandex.net/v1/disk/resources?path=${encoded}&limit=1000`,
  )
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`List ${relativeDir}: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data?._embedded?.items ?? []
}

async function listMediaRecursive(relativeDir) {
  const items = await listDir(relativeDir)
  const files = []
  for (const item of items) {
    const child = relativeDir ? `${relativeDir}/${item.name}` : item.name
    if (item.type === 'file') files.push(child)
    else if (item.type === 'dir') files.push(...(await listMediaRecursive(child)))
  }
  return files
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

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true })
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('Checking Yandex Disk access…')
  const rootCheck = await yandexFetch(
    `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(diskPath())}`,
  )
  if (!rootCheck.ok) {
    throw new Error(`Cannot access folder "${YANDEX_FOLDER}": ${rootCheck.status} ${await rootCheck.text()}`)
  }

  for (const file of JSON_FILES) {
    await downloadFile(file, path.join(OUT_DIR, file))
  }

  console.log('Downloading media…')
  const mediaFiles = await listMediaRecursive('media')
  let mediaOk = 0
  for (const rel of mediaFiles) {
    const ok = await downloadFile(rel, path.join(OUT_DIR, ...rel.split('/')))
    if (ok) mediaOk += 1
  }

  const manifest = {
    exportedAt: new Date().toISOString(),
    source: 'yandex-disk',
    folder: YANDEX_FOLDER,
    topics: {
      support: countTopics(path.join(OUT_DIR, 'guide.json'), 'questions'),
      lawyers: countTopics(path.join(OUT_DIR, 'guide_lawyers.json'), 'questions'),
      managers: countTopics(path.join(OUT_DIR, 'guide_managers.json'), 'questions'),
      spp: countTopics(path.join(OUT_DIR, 'guide_spp.json'), 'questions'),
    },
    templates: countTopics(path.join(OUT_DIR, 'templates.json'), 'templates'),
    mediaFiles: mediaOk,
  }

  let users = 0
  let whitelist = 0
  try {
    const acc = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'accounts.json'), 'utf8'))
    users = Array.isArray(acc.users) ? acc.users.length : 0
    whitelist = Array.isArray(acc.whitelist) ? acc.whitelist.length : 0
  } catch {
    /* ignore */
  }
  manifest.users = users
  manifest.whitelist = whitelist

  fs.writeFileSync(path.join(OUT_DIR, 'export-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

  console.log('\nDone:', OUT_DIR)
  console.log(JSON.stringify(manifest, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
