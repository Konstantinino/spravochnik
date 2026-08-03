/**
 * Uploads app-update.json (+ optional Setup.exe) to Yandex Disk using local app token.
 * Usage: node scripts/upload-update-manifest.js [path-to-setup.exe]
 */
const fs = require('node:fs')
const path = require('node:path')

const YANDEX_FOLDER = 'REST INFO'
const APP_UPDATE_FILE = 'app-update.json'

function settingsPath() {
  return path.join(process.env.APPDATA || '', 'rest-info', 'REST-INFO', 'settings.json')
}

function folderPath(fileName) {
  return fileName ? `disk:/${YANDEX_FOLDER}/${fileName}` : `disk:/${YANDEX_FOLDER}`
}

async function yandexFetch(token, url, init = {}) {
  const headers = { ...(init.headers || {}), Authorization: `OAuth ${token}` }
  return fetch(url, { ...init, headers })
}

async function ensureDir(token, remoteDir) {
  const parts = remoteDir.split('/').filter(Boolean)
  let current = ''
  for (const part of parts) {
    current = current ? `${current}/${part}` : part
    const encoded = encodeURIComponent(folderPath(current))
    const res = await yandexFetch(
      token,
      `https://cloud-api.yandex.net/v1/disk/resources?path=${encoded}`,
    )
    if (res.status === 404) {
      const create = await yandexFetch(
        token,
        `https://cloud-api.yandex.net/v1/disk/resources?path=${encoded}`,
        { method: 'PUT' },
      )
      if (!create.ok && create.status !== 409) {
        throw new Error(`mkdir ${current}: ${create.status}`)
      }
    }
  }
}

async function uploadFile(token, remoteName, localPath) {
  if (!fs.existsSync(localPath)) throw new Error(`Missing file: ${localPath}`)
  const parent = remoteName.split('/').slice(0, -1).join('/')
  if (parent) await ensureDir(token, parent)
  const encoded = encodeURIComponent(folderPath(remoteName))
  const meta = await yandexFetch(
    token,
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
  console.log('Uploaded', remoteName, `(${body.length} bytes)`)
}

async function main() {
  const sp = settingsPath()
  if (!fs.existsSync(sp)) {
    console.error('No local settings.json — open the app once and save Yandex token')
    process.exit(1)
  }
  const settings = JSON.parse(fs.readFileSync(sp, 'utf8'))
  const token = settings.yandexToken
  if (!token) {
    console.error('No yandexToken in settings')
    process.exit(1)
  }

  const manifestLocal = path.join(__dirname, '..', 'resources', 'data', APP_UPDATE_FILE)
  await ensureDir(token, '')
  await uploadFile(token, APP_UPDATE_FILE, manifestLocal)

  const setupArg = process.argv[2]
  if (setupArg) {
    const setupPath = path.resolve(setupArg)
    const remote = `updates/${path.basename(setupPath)}`
    console.log('Uploading Setup (large)…')
    await uploadFile(token, remote, setupPath)
  }

  console.log('Done')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
