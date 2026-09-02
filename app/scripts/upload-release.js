#!/usr/bin/env node
/**
 * Upload REST INFO installer to server and register release.
 * Usage: node upload-release.js <path-to-Setup.exe> [serverUrl] [adminToken]
 *
 * Or set RESTINFO_SERVER_URL and RESTINFO_ADMIN_TOKEN env vars.
 */
import fs from 'node:fs'
import path from 'node:path'

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
const version = versionMatch ? versionMatch[1] : process.env.RESTINFO_VERSION || '0.0.0'

async function main() {
  const buffer = fs.readFileSync(setupPath)
  const form = new FormData()
  form.append('file', new Blob([buffer]), fileName)
  form.append('relativePath', `updates/${fileName}`)

  const uploadRes = await fetch(`${serverUrl}/media/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: form,
  })

  if (!uploadRes.ok) {
    console.error('Media upload failed:', await uploadRes.text())
    process.exit(1)
  }

  const releaseRes = await fetch(`${serverUrl}/admin/releases`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
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

  console.log(`Release ${version} uploaded: ${fileName}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
