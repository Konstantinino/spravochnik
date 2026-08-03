import { app, shell } from 'electron'
import fs from 'node:fs'
import { writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { APP_UPDATE_FILE, YANDEX_FOLDER, getUserDataRoot, getSeedDataDir } from './paths'
import { readSettings } from './auth-store'

const GITHUB_OWNER = 'Konstantinino'
const GITHUB_REPO = 'spravochnik'
const SETUP_ASSET_RE = /^REST-INFO-Setup-.*\.exe$/i

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version: string | null
  downloadUrl: string | null
  /** Relative path on Yandex Disk, e.g. updates/REST-INFO-Setup-1.1.2.exe */
  remoteSetupPath?: string | null
  error?: string
  source?: 'yandex' | 'local' | 'github' | null
}

interface UpdateManifest {
  version?: string
  downloadUrl?: string
  remoteSetupPath?: string
  notes?: string
}

type UpdateListener = (info: UpdateInfo) => void

let lastInfo: UpdateInfo = {
  available: false,
  currentVersion: '0.0.0',
  version: null,
  downloadUrl: null,
  remoteSetupPath: null,
  source: null,
}

const listeners = new Set<UpdateListener>()

export function onUpdateStatus(listener: UpdateListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getUpdateStatus(): UpdateInfo {
  return { ...lastInfo }
}

function emit(info: UpdateInfo): UpdateInfo {
  lastInfo = info
  for (const listener of listeners) listener(info)
  return info
}

/** Strip leading `v` and compare dotted numeric versions. Returns >0 if a>b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split(/[.+-]/).map((x) => parseInt(x, 10) || 0)
  const pb = b.replace(/^v/i, '').split(/[.+-]/).map((x) => parseInt(x, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da !== db) return da - db
  }
  return 0
}

function folderPath(fileName?: string): string {
  if (!fileName) return `disk:/${YANDEX_FOLDER}`
  return `disk:/${YANDEX_FOLDER}/${fileName}`
}

async function yandexFetch(token: string, url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `OAuth ${token}`)
  return fetch(url, { ...init, headers })
}

function parseManifest(raw: unknown): UpdateManifest | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as UpdateManifest
  if (!o.version || typeof o.version !== 'string') return null
  return {
    version: o.version.trim().replace(/^v/i, ''),
    downloadUrl: typeof o.downloadUrl === 'string' ? o.downloadUrl : undefined,
    remoteSetupPath: typeof o.remoteSetupPath === 'string' ? o.remoteSetupPath : undefined,
    notes: typeof o.notes === 'string' ? o.notes : undefined,
  }
}

function readLocalManifest(): UpdateManifest | null {
  const candidates = [
    path.join(getUserDataRoot(), APP_UPDATE_FILE),
    path.join(getSeedDataDir(), APP_UPDATE_FILE),
  ]
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue
      const parsed = parseManifest(JSON.parse(fs.readFileSync(p, 'utf8')))
      if (parsed) return parsed
    } catch {
      /* ignore */
    }
  }
  return null
}

async function fetchYandexManifest(token: string): Promise<UpdateManifest | null> {
  const encoded = encodeURIComponent(folderPath(APP_UPDATE_FILE))
  const meta = await yandexFetch(
    token,
    `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encoded}`,
  )
  if (meta.status === 404 || !meta.ok) return null
  const { href } = (await meta.json()) as { href: string }
  const fileRes = await fetch(href)
  if (!fileRes.ok) return null
  const text = await fileRes.text()
  try {
    return parseManifest(JSON.parse(text))
  } catch {
    return null
  }
}

interface GitHubAsset {
  name: string
  browser_download_url: string
}

interface GitHubRelease {
  tag_name: string
  name?: string
  assets?: GitHubAsset[]
}

async function fetchGitHubManifest(): Promise<UpdateManifest | null> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': `REST-INFO/${app.getVersion()}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )
  if (!res.ok) return null
  const release = (await res.json()) as GitHubRelease
  const version = (release.tag_name || release.name || '').trim().replace(/^v/i, '')
  if (!version) return null
  const asset = release.assets?.find((a) => SETUP_ASSET_RE.test(a.name))
  if (!asset) return null
  return {
    version,
    downloadUrl: asset.browser_download_url,
    remoteSetupPath: `updates/${asset.name}`,
  }
}

function infoFromManifest(
  currentVersion: string,
  manifest: UpdateManifest,
  source: UpdateInfo['source'],
): UpdateInfo {
  const available = compareVersions(manifest.version!, currentVersion) > 0
  return {
    available,
    currentVersion,
    version: manifest.version!,
    downloadUrl: available ? manifest.downloadUrl ?? null : null,
    remoteSetupPath: available ? manifest.remoteSetupPath ?? null : null,
    source,
  }
}

/**
 * Prefer Yandex Disk manifest (works when GitHub is blocked), then local copy, then GitHub API.
 */
export async function checkForUpdates(options?: {
  force?: boolean
}): Promise<UpdateInfo> {
  const currentVersion = app.getVersion()
  const base: UpdateInfo = {
    available: false,
    currentVersion,
    version: null,
    downloadUrl: null,
    remoteSetupPath: null,
    source: null,
  }

  if (!app.isPackaged && !options?.force) {
    return emit(base)
  }

  const errors: string[] = []

  try {
    const token = readSettings().yandexToken
    if (token) {
      const fromDisk = await fetchYandexManifest(token)
      if (fromDisk) {
        const info = infoFromManifest(currentVersion, fromDisk, 'yandex')
        if (info.available && (info.downloadUrl || info.remoteSetupPath)) {
          return emit(info)
        }
        if (!info.available) return emit(info)
      }
    }
  } catch (e) {
    errors.push(`Я.Диск: ${e instanceof Error ? e.message : String(e)}`)
  }

  try {
    const local = readLocalManifest()
    if (local) {
      const info = infoFromManifest(currentVersion, local, 'local')
      if (info.available && (info.downloadUrl || info.remoteSetupPath)) {
        return emit(info)
      }
    }
  } catch (e) {
    errors.push(`local: ${e instanceof Error ? e.message : String(e)}`)
  }

  try {
    const fromGh = await fetchGitHubManifest()
    if (fromGh) {
      return emit(infoFromManifest(currentVersion, fromGh, 'github'))
    }
    errors.push('GitHub: релиз или Setup не найден')
  } catch (e) {
    errors.push(`GitHub: ${e instanceof Error ? e.message : String(e)}`)
  }

  return emit({
    ...base,
    error: errors.length ? errors.join('; ') : 'Не удалось проверить обновления',
  })
}

async function downloadFromYandex(token: string, remotePath: string, dest: string): Promise<void> {
  const encoded = encodeURIComponent(folderPath(remotePath))
  const meta = await yandexFetch(
    token,
    `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encoded}`,
  )
  if (!meta.ok) {
    const text = await meta.text()
    throw new Error(`Скачивание с Диска: ${text || meta.status}`)
  }
  const { href } = (await meta.json()) as { href: string }
  const fileRes = await fetch(href)
  if (!fileRes.ok) throw new Error(`Не удалось скачать установщик с Диска`)
  const buffer = Buffer.from(await fileRes.arrayBuffer())
  await writeFile(dest, buffer)
}

async function downloadFromUrl(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: { 'User-Agent': `REST-INFO/${app.getVersion()}` },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Скачивание: HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buffer)
}

export async function downloadUpdate(): Promise<{ ok: boolean; error?: string }> {
  const info = lastInfo
  if (!info.available || (!info.downloadUrl && !info.remoteSetupPath)) {
    return { ok: false, error: 'Обновление недоступно' }
  }

  const fileName =
    info.remoteSetupPath?.split('/').pop() ||
    info.downloadUrl?.split('/').pop()?.split('?')[0] ||
    `REST-INFO-Setup-${info.version || 'update'}.exe`
  const dest = path.join(os.tmpdir(), fileName)

  try {
    const token = readSettings().yandexToken
    let gotFile = false
    if (token && info.remoteSetupPath) {
      try {
        await downloadFromYandex(token, info.remoteSetupPath, dest)
        gotFile = true
      } catch {
        /* fall through to URL */
      }
    }
    if (!gotFile && info.downloadUrl) {
      await downloadFromUrl(info.downloadUrl, dest)
      gotFile = true
    }
    if (!gotFile) {
      return { ok: false, error: 'Нет источника для скачивания Setup' }
    }

    const openError = await shell.openPath(dest)
    if (openError) {
      if (info.downloadUrl) await shell.openExternal(info.downloadUrl)
      return { ok: true, error: openError }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    try {
      if (info.downloadUrl) {
        await shell.openExternal(info.downloadUrl)
        return { ok: true, error: message }
      }
    } catch {
      /* ignore */
    }
    return { ok: false, error: message }
  }
}

/** Ensure local app-update.json exists (from seed) for push to Disk. */
export function ensureLocalUpdateManifest(): void {
  const dest = path.join(getUserDataRoot(), APP_UPDATE_FILE)
  const seed = path.join(getSeedDataDir(), APP_UPDATE_FILE)
  try {
    if (!fs.existsSync(seed)) return
    const seedData = fs.readFileSync(seed, 'utf8')
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, seedData, 'utf8')
      return
    }
    const local = parseManifest(JSON.parse(fs.readFileSync(dest, 'utf8')))
    const fromSeed = parseManifest(JSON.parse(seedData))
    if (fromSeed && (!local || compareVersions(fromSeed.version!, local.version!) > 0)) {
      fs.writeFileSync(dest, seedData, 'utf8')
    }
  } catch {
    /* ignore */
  }
}
