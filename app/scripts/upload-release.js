#!/usr/bin/env node
/**
 * Upload REST INFO installer to server and register release.
 * Also uploads latest.yml and .blockmap for electron-updater (if present).
 *
 * Usage: node upload-release.js <path-to-Setup.exe> [serverUrl] [adminToken]
 *
 * Or set RESTINFO_SERVER_URL and RESTINFO_ADMIN_TOKEN env vars.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CLIENT_VERSION_HEADER = 'x-rest-info-client-version'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readAppPackageVersion() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'),
    )
    return String(pkg.version ?? '').trim() || null
  } catch {
    return null
  }
}

const setupPath = process.argv[2]
const serverUrl = (process.argv[3] || process.env.RESTINFO_SERVER_URL || '').replace(/\/+$/, '')
const adminToken = process.argv[4] || process.env.RESTINFO_ADMIN_TOKEN || ''

if (!setupPath || !fs.existsSync(setupPath)) {
  console.error('Usage: node upload-release.js <Setup.exe> [serverUrl] [adminToken]')
  process.exit(1)
}

if (!serverUrl || !adminToken) {
  console.error('Set serverUrl and adminToken (args or RESTINFO_SERVER_URL / RESTINFO_ADMIN_TOKEN)')
  process.exit(1)
}

const fileName = path.basename(setupPath)
const versionMatch = fileName.match(/Setup-([\d.]+)\.exe/i)
const version = versionMatch
  ? versionMatch[1]
  : process.env.RESTINFO_VERSION || readAppPackageVersion() || '0.0.0'
const releaseDir = path.dirname(path.resolve(setupPath))
/** Сервер отклоняет запись без заголовка (0.0.0). Для публикации — версия Setup или app/package.json. */
const clientVersionHeader = versionMatch?.[1] || readAppPackageVersion() || version

function uploadHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${adminToken}`,
    [CLIENT_VERSION_HEADER]: clientVersionHeader,
    ...extra,
  }
}

async function uploadUpdateFile(relativeName, localPath) {
  const buffer = fs.readFileSync(localPath)
  const form = new FormData()
  form.append('relativePath', `updates/${relativeName}`)
  form.append('file', new Blob([buffer]), relativeName)

  const uploadRes = await fetch(`${serverUrl}/media/upload`, {
    method: 'POST',
    headers: uploadHeaders(),
    body: form,
  })

  if (!uploadRes.ok) {
    throw new Error(`Upload ${relativeName} failed: ${await uploadRes.text()}`)
  }
  console.log(`Uploaded: ${relativeName}`)
}

async function main() {
  const blockmap = fileName.replace(/\.exe$/i, '.exe.blockmap')
  const latestYml = path.join(releaseDir, 'latest.yml')
  if (!fs.existsSync(latestYml)) {
    console.error(
      'Missing latest.yml next to Setup (electron-builder creates it with dist:ascii). Auto-update will not work without it.',
    )
    process.exit(1)
  }

  await uploadUpdateFile(fileName, setupPath)

  const blockmapPath = path.join(releaseDir, blockmap)
  if (!fs.existsSync(blockmapPath)) {
    console.error(
      `Missing ${blockmap} next to Setup (electron-builder creates it with dist:ascii).`,
    )
    process.exit(1)
  }

  await uploadUpdateFile(blockmap, blockmapPath)

  // Upload manifest last so clients never see a new version before the .exe is complete.
  await uploadUpdateFile('latest.yml', latestYml)

  const releaseRes = await fetch(`${serverUrl}/admin/releases`, {
    method: 'POST',
    headers: uploadHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      version,
      setupFilename: fileName,
      notes: process.env.RESTINFO_RELEASE_NOTES || '',
    }),
  })

  if (!releaseRes.ok) {
    console.error('Release register failed:', await releaseRes.text())
    process.exit(1)
  }

  console.log(
    `Release ${version} on server: ${fileName}, ${blockmap}, latest.yml (+ app_releases)`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
