import { app, shell } from 'electron'
import fs from 'node:fs'
import { writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { APP_UPDATE_FILE, YANDEX_FOLDER, getUserDataRoot, getSeedDataDir } from './paths'
import { readSettings } from './auth-store'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version: string | null
  /** Relative path on Yandex Disk, e.g. updates/REST-INFO-Setup-1.1.4.exe */
  remoteSetupPath: string | null
  error?: string
  source?: 'yandex' | 'local' | null
}

interface UpdateManifest {
  version?: string
  remoteSetupPath?: string
  notes?: string
}

type UpdateListener = (info: UpdateInfo) => void

let lastInfo: UpdateInfo = {
  available: false,
  currentVersion: '0.0.0',
  version: null,
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
  const o = raw as UpdateManifest & { downloadUrl?: string }
  if (!o.version || typeof o.version !== 'string') return null
  let remoteSetupPath =
    typeof o.remoteSetupPath === 'string' ? o.remoteSetupPath.trim() : undefined
  // Legacy manifests may only have GitHub downloadUrl — ignore URL, derive Disk path from version
  if (!remoteSetupPath) {
    const ver = o.version.trim().replace(/^v/i, '')
    if (ver) remoteSetupPath = `updates/REST-INFO-Setup-${ver}.exe`
  }
  return {
    version: o.version.trim().replace(/^v/i, ''),
    remoteSetupPath,
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
    remoteSetupPath: available ? manifest.remoteSetupPath ?? null : null,
    source,
  }
}

/** Updates only via Yandex Disk (app-update.json + Setup in updates/). */
export async function checkForUpdates(options?: {
  force?: boolean
}): Promise<UpdateInfo> {
  const currentVersion = app.getVersion()
  const base: UpdateInfo = {
    available: false,
    currentVersion,
    version: null,
    remoteSetupPath: null,
    source: null,
  }

  if (!app.isPackaged && !options?.force) {
    return emit(base)
  }

  const errors: string[] = []
  const token = readSettings().yandexToken
  if (!token) {
    return emit({
      ...base,
      error: 'Нет токена Яндекс.Диска — обновления проверяются только через Диск',
    })
  }

  try {
    const fromDisk = await fetchYandexManifest(token)
    if (fromDisk?.remoteSetupPath) {
      const info = infoFromManifest(currentVersion, fromDisk, 'yandex')
      return emit(info)
    }
    if (fromDisk && !fromDisk.remoteSetupPath) {
      errors.push('В app-update.json нет remoteSetupPath')
    }
  } catch (e) {
    errors.push(`Я.Диск: ${e instanceof Error ? e.message : String(e)}`)
  }

  try {
    const local = readLocalManifest()
    if (local?.remoteSetupPath) {
      const info = infoFromManifest(currentVersion, local, 'local')
      if (info.available) return emit(info)
    }
  } catch (e) {
    errors.push(`local: ${e instanceof Error ? e.message : String(e)}`)
  }

  return emit({
    ...base,
    error: errors.length ? errors.join('; ') : 'Манифест обновлений на Диске не найден',
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
  if (!fileRes.ok) throw new Error('Не удалось скачать установщик с Диска')
  const buffer = Buffer.from(await fileRes.arrayBuffer())
  await writeFile(dest, buffer)
}

export async function downloadUpdate(): Promise<{ ok: boolean; error?: string }> {
  const info = lastInfo
  if (!info.available || !info.remoteSetupPath) {
    return { ok: false, error: 'Обновление недоступно' }
  }

  const token = readSettings().yandexToken
  if (!token) {
    return { ok: false, error: 'Нет токена Яндекс.Диска' }
  }

  const fileName =
    info.remoteSetupPath.split('/').pop() ||
    `REST-INFO-Setup-${info.version || 'update'}.exe`
  const dest = path.join(os.tmpdir(), fileName)

  try {
    await downloadFromYandex(token, info.remoteSetupPath, dest)
    const openError = await shell.openPath(dest)
    if (openError) return { ok: false, error: openError }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
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
