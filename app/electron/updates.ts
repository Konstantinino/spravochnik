import { app, BrowserWindow, dialog, net, shell } from 'electron'
import fs from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { APP_UPDATE_FILE, getUserDataRoot, getSeedDataDir } from './paths'
import { readSettings } from './auth-store'
import { serverFetch } from './server-api'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version: string | null
  remoteSetupPath: string | null
  downloadUrl?: string | null
  error?: string
  source?: 'server' | null
}

export interface LatestReleaseInfo {
  version: string | null
  downloadUrl: string | null
  remoteSetupPath: string | null
  notes?: string | null
  error?: string
  source?: 'server' | null
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

function isNetworkOnline(): boolean {
  return net.isOnline()
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

function parseManifest(raw: unknown): UpdateManifest | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as UpdateManifest
  if (!o.version || typeof o.version !== 'string') return null
  let remoteSetupPath =
    typeof o.remoteSetupPath === 'string' ? o.remoteSetupPath.trim() : undefined
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

/** Check for updates via server API — only when online and serverUrl is configured. */
export async function checkForUpdates(options?: {
  force?: boolean
}): Promise<UpdateInfo> {
  const currentVersion = app.getVersion()
  const base: UpdateInfo = {
    available: false,
    currentVersion,
    version: null,
    remoteSetupPath: null,
    downloadUrl: null,
    source: null,
  }

  if (!app.isPackaged && !options?.force) {
    return emit(base)
  }

  if (!isNetworkOnline()) {
    return emit(base)
  }

  const settings = readSettings()
  if (!settings.serverUrl.trim()) {
    return emit({
      ...base,
      error: 'Укажите URL сервера на экране входа',
    })
  }

  try {
    const data = await serverFetch<{
      available: boolean
      version: string | null
      setupFilename?: string
      downloadUrl?: string
      notes?: string
    }>(`/app/update?currentVersion=${encodeURIComponent(currentVersion)}`, {
      skipAuth: true,
    })
    if (data.available && data.downloadUrl) {
      return emit({
        available: true,
        currentVersion,
        version: data.version,
        remoteSetupPath: data.setupFilename ?? null,
        downloadUrl: data.downloadUrl,
        source: 'server',
      })
    }
    return emit({ ...base, source: 'server' })
  } catch (e) {
    return emit({
      ...base,
      error: `Сервер: ${e instanceof Error ? e.message : String(e)}`,
    })
  }
}

async function saveInstallerFromSource(info: {
  version: string | null
  downloadUrl?: string | null
  remoteSetupPath?: string | null
}): Promise<{
  ok: boolean
  error?: string
  canceled?: boolean
  path?: string
}> {
  if (!isNetworkOnline()) {
    return { ok: false, error: 'Нет подключения к сети' }
  }
  if (!info.downloadUrl) {
    return { ok: false, error: 'Установщик недоступен на сервере' }
  }

  const fileName =
    info.remoteSetupPath?.split('/').pop() ||
    `REST-INFO-Setup-${info.version || 'latest'}.exe`

  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
  const saveOptions = {
    title: 'Куда сохранить установщик',
    defaultPath: fileName,
    filters: [{ name: 'Установщик REST INFO', extensions: ['exe'] }],
  }
  const save = win
    ? await dialog.showSaveDialog(win, saveOptions)
    : await dialog.showSaveDialog(saveOptions)
  if (save.canceled || !save.filePath) {
    return { ok: false, canceled: true }
  }

  const dest = save.filePath.endsWith('.exe') ? save.filePath : `${save.filePath}.exe`

  try {
    const res = await fetch(info.downloadUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    await writeFile(dest, buffer)

    const boxOptions = {
      type: 'info' as const,
      title: 'Установщик скачан',
      message: 'Файл сохранён',
      detail: dest,
      buttons: ['Открыть установщик', 'Показать в папке', 'Закрыть'],
      defaultId: 0,
      cancelId: 2,
    }
    const choice = win
      ? await dialog.showMessageBox(win, boxOptions)
      : await dialog.showMessageBox(boxOptions)
    if (choice.response === 0) {
      const openError = await shell.openPath(dest)
      if (openError) return { ok: true, path: dest, error: openError }
    } else if (choice.response === 1) {
      shell.showItemInFolder(dest)
    }
    return { ok: true, path: dest }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/** Latest published release on server (admin), regardless of current app version. */
export async function fetchLatestRelease(): Promise<LatestReleaseInfo> {
  const empty: LatestReleaseInfo = {
    version: null,
    downloadUrl: null,
    remoteSetupPath: null,
    source: null,
  }

  if (!isNetworkOnline()) {
    return { ...empty, error: 'Нет подключения к сети' }
  }

  const settings = readSettings()
  if (!settings.serverUrl.trim()) {
    return { ...empty, error: 'Укажите URL сервера на экране входа' }
  }

  try {
    const data = await serverFetch<{
      version: string | null
      setupFilename?: string
      downloadUrl?: string
      notes?: string
    }>(`/app/update?currentVersion=0.0.0`, { skipAuth: true })
    if (data.version && data.downloadUrl) {
      return {
        version: data.version,
        downloadUrl: data.downloadUrl,
        remoteSetupPath: data.setupFilename ?? null,
        notes: data.notes,
        source: 'server',
      }
    }
    return { ...empty, error: 'На сервере нет опубликованных версий' }
  } catch (e) {
    return {
      ...empty,
      error: `Сервер: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

export async function downloadLatestRelease(): Promise<{
  ok: boolean
  error?: string
  canceled?: boolean
  path?: string
}> {
  const latest = await fetchLatestRelease()
  if (!latest.downloadUrl) {
    return { ok: false, error: latest.error ?? 'Последняя версия недоступна' }
  }
  return saveInstallerFromSource(latest)
}

export async function downloadUpdate(): Promise<{
  ok: boolean
  error?: string
  canceled?: boolean
  path?: string
}> {
  const info = lastInfo
  if (!info.available || !info.downloadUrl) {
    return { ok: false, error: info.error ?? 'Обновление недоступно' }
  }
  return saveInstallerFromSource(info)
}

/** Seed local app-update.json from bundle (dev reference only). */
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
