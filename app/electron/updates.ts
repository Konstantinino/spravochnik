import { app, BrowserWindow, dialog, net, shell } from 'electron'
import fs from 'node:fs'
import { writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { autoUpdater } from 'electron-updater'
import { APP_UPDATE_FILE, getUserDataRoot, getSeedDataDir } from './paths'
import { readSettings } from './auth-store'
import { appendSessionLog } from './session-log'
import { serverFetch } from './server-api'

export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'not-available'
  | 'error'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version: string | null
  remoteSetupPath: string | null
  downloadUrl?: string | null
  error?: string
  source?: 'server' | null
  phase?: UpdatePhase
  progress?: number | null
  downloaded?: boolean
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

const CHECK_INTERVAL_MS = 60_000

let lastInfo: UpdateInfo = {
  available: false,
  currentVersion: '0.0.0',
  version: null,
  remoteSetupPath: null,
  downloadUrl: null,
  source: null,
  phase: 'idle',
  progress: null,
  downloaded: false,
}

const listeners = new Set<UpdateListener>()
let autoUpdaterReady = false
let checkTimer: ReturnType<typeof setInterval> | null = null
let configuredFeedUrl: string | null = null
let downloadArmed = false

function isNetworkOnline(): boolean {
  return net.isOnline()
}

function useAutoUpdater(): boolean {
  return app.isPackaged
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

function emit(partial: Partial<UpdateInfo>): UpdateInfo {
  lastInfo = { ...lastInfo, ...partial }
  for (const listener of listeners) listener(lastInfo)
  return lastInfo
}

export function onUpdateStatus(listener: UpdateListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getUpdateStatus(): UpdateInfo {
  return {
    ...lastInfo,
    currentVersion: app.getVersion(),
  }
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

function updatesFeedUrl(serverUrl: string): string {
  return `${serverUrl.replace(/\/+$/, '')}/app/updates/`
}

function electronUpdaterCacheDir(): string {
  const local =
    process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local')
  return path.join(local, app.getName())
}

async function clearPartialUpdateCache(): Promise<void> {
  if (!useAutoUpdater()) return
  if (lastInfo.downloaded) return
  try {
    const cacheRoot = electronUpdaterCacheDir()
    const pendingDir = path.join(cacheRoot, 'pending')
    if (fs.existsSync(pendingDir)) {
      fs.rmSync(pendingDir, { recursive: true, force: true })
    }
    if (fs.existsSync(cacheRoot)) {
      for (const entry of fs.readdirSync(cacheRoot)) {
        if (entry.startsWith('temp-')) {
          fs.rmSync(path.join(cacheRoot, entry), { force: true })
        }
      }
    }
    appendSessionLog('info', 'update', 'Кэш частичного обновления очищен')
  } catch (e) {
    appendSessionLog(
      'warn',
      'update',
      `Не удалось очистить кэш обновления: ${e instanceof Error ? e.message : String(e)}`,
    )
  }
}

function configureAutoUpdaterFeed(serverUrl: string): boolean {
  const feedUrl = updatesFeedUrl(serverUrl)
  if (configuredFeedUrl === feedUrl && autoUpdaterReady) return true
  try {
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl })
    configuredFeedUrl = feedUrl
    return true
  } catch (e) {
    appendSessionLog(
      'error',
      'update',
      `Feed URL: ${e instanceof Error ? e.message : String(e)}`,
    )
    return false
  }
}

function setupAutoUpdaterEvents(): void {
  if (autoUpdaterReady) return
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.autoRunAppAfterInstall = true

  autoUpdater.on('checking-for-update', () => {
    emit({
      phase: 'checking',
      error: undefined,
      currentVersion: app.getVersion(),
    })
  })

  autoUpdater.on('update-not-available', () => {
    downloadArmed = false
    emit({
      available: false,
      version: null,
      remoteSetupPath: null,
      downloadUrl: null,
      phase: 'not-available',
      progress: null,
      downloaded: false,
      error: undefined,
      source: 'server',
    })
  })

  autoUpdater.on('update-available', (info) => {
    const version = info.version?.replace(/^v/i, '') ?? null
    downloadArmed = true
    emit({
      available: true,
      version,
      remoteSetupPath: version ? `updates/REST-INFO-Setup-${version}.exe` : null,
      phase: 'downloading',
      progress: 0,
      downloaded: false,
      error: undefined,
      source: 'server',
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent)
    emit({
      available: true,
      phase: 'downloading',
      progress: percent,
      downloaded: false,
      source: 'server',
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    downloadArmed = false
    const version = info.version?.replace(/^v/i, '') ?? lastInfo.version
    emit({
      available: true,
      version,
      remoteSetupPath: version ? `updates/REST-INFO-Setup-${version}.exe` : null,
      phase: 'downloaded',
      progress: 100,
      downloaded: true,
      error: undefined,
      source: 'server',
    })
    appendSessionLog('info', 'update', `Обновление ${version ?? ''} скачано`.trim())
  })

  autoUpdater.on('error', (err) => {
    downloadArmed = false
    const detail = err instanceof Error ? err.message : String(err)
    appendSessionLog('error', 'update', detail)
    void clearPartialUpdateCache().finally(() => {
      emit({
        phase: 'error',
        progress: null,
        downloaded: false,
        error: detail,
      })
    })
  })

  autoUpdaterReady = true
}

async function checkForUpdatesAuto(): Promise<UpdateInfo> {
  const currentVersion = app.getVersion()
  const base: UpdateInfo = {
    ...lastInfo,
    currentVersion,
    source: 'server',
  }

  if (!isNetworkOnline()) {
    return emit({ ...base, phase: lastInfo.phase ?? 'idle' })
  }

  const settings = readSettings()
  if (!settings.serverUrl.trim()) {
    return emit({
      ...base,
      available: false,
      phase: 'idle',
      error: 'Укажите URL сервера на экране входа',
    })
  }

  setupAutoUpdaterEvents()
  if (!configureAutoUpdaterFeed(settings.serverUrl)) {
    return emit({
      ...base,
      phase: 'error',
      error: 'Не удалось настроить URL обновлений',
    })
  }

  if (downloadArmed && !lastInfo.downloaded) {
    await clearPartialUpdateCache()
    downloadArmed = false
  }

  try {
    await autoUpdater.checkForUpdates()
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    await clearPartialUpdateCache()
    return emit({
      ...base,
      phase: 'error',
      error: detail,
    })
  }

  return getUpdateStatus()
}

async function checkForUpdatesLegacy(options?: { force?: boolean }): Promise<UpdateInfo> {
  const currentVersion = app.getVersion()
  const base: UpdateInfo = {
    available: false,
    currentVersion,
    version: null,
    remoteSetupPath: null,
    downloadUrl: null,
    source: null,
    phase: 'idle',
    progress: null,
    downloaded: false,
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
    emit({ ...base, phase: 'checking' })
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
        phase: 'available',
        source: 'server',
      })
    }
    return emit({ ...base, phase: 'not-available', source: 'server' })
  } catch (e) {
    return emit({
      ...base,
      phase: 'error',
      error: `Сервер: ${e instanceof Error ? e.message : String(e)}`,
    })
  }
}

/** Check for updates — autoUpdater when packaged, legacy API in dev. */
export async function checkForUpdates(options?: {
  force?: boolean
}): Promise<UpdateInfo> {
  lastInfo = { ...lastInfo, currentVersion: app.getVersion() }
  if (useAutoUpdater()) {
    return checkForUpdatesAuto()
  }
  return checkForUpdatesLegacy(options)
}

export function startUpdateCheckInterval(): void {
  if (checkTimer) return
  void clearPartialUpdateCache().then(() => checkForUpdates())
  checkTimer = setInterval(() => {
    void checkForUpdates()
  }, CHECK_INTERVAL_MS)
}

export function stopUpdateCheckInterval(): void {
  if (checkTimer) {
    clearInterval(checkTimer)
    checkTimer = null
  }
}

const DOWNLOAD_WAIT_MS = 15 * 60 * 1000

function waitForUpdateDownloaded(timeoutMs = DOWNLOAD_WAIT_MS): Promise<void> {
  if (lastInfo.downloaded) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      off()
      reject(new Error('Превышено время ожидания загрузки обновления'))
    }, timeoutMs)

    const off = onUpdateStatus((info) => {
      if (info.downloaded) {
        clearTimeout(timer)
        off()
        resolve()
      } else if (info.phase === 'error') {
        clearTimeout(timer)
        off()
        reject(new Error(info.error ?? 'Ошибка загрузки обновления'))
      }
    })
  })
}

async function ensureUpdateDownloaded(): Promise<void> {
  if (lastInfo.downloaded) return

  const needsCheck =
    !lastInfo.available ||
    lastInfo.phase === 'idle' ||
    lastInfo.phase === 'not-available' ||
    lastInfo.phase === 'error'

  if (needsCheck) {
    emit({ phase: 'checking', error: undefined })
    await checkForUpdates({ force: true })
  }

  if (!lastInfo.available) {
    throw new Error(lastInfo.error ?? 'Обновление недоступно')
  }

  if (!lastInfo.downloaded && lastInfo.phase !== 'downloading') {
    emit({ phase: 'downloading', progress: lastInfo.progress ?? 0, downloaded: false })
    try {
      await autoUpdater.downloadUpdate()
    } catch (e) {
      const status = getUpdateStatus()
      if (!status.downloaded && status.phase !== 'downloading') {
        throw e instanceof Error ? e : new Error(String(e))
      }
    }
  }

  await waitForUpdateDownloaded()
}

export async function installUpdate(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!useAutoUpdater()) {
    return { ok: false, error: 'Установка доступна только в собранном приложении' }
  }
  if (!isNetworkOnline()) {
    return { ok: false, error: 'Нет подключения к сети' }
  }

  try {
    await ensureUpdateDownloaded()
    autoUpdater.quitAndInstall(false, true)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    }
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

/** Legacy IPC — manual save dialog (dev / fallback). */
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
