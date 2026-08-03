import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  ACCOUNTS_FILE,
  DATA_FILES,
  SYNC_LOCK_FILE,
  YANDEX_FOLDER,
  DEPARTMENTS,
  getUserDataRoot,
} from './paths'
import {
  readSettings,
  setPendingChanges,
  writeAccounts,
  writeSettings,
  readAccounts,
  mergeAccountsData,
  getCurrentUser,
  type AccountsData,
} from './auth-store'
import { clearPendingMedia, readPendingMedia } from './pending-media'
import {
  applyConflictResolutions,
  mergeGuideFile,
  type TopicConflict,
} from './guide-merge'
import { readBaseGuide, writeAllGuideBasesFromLocal, writeBaseGuide } from './sync-base'

export type SyncStatusCode =
  | 'idle'
  | 'no_token'
  | 'connecting'
  | 'syncing'
  | 'uploading'
  | 'up_to_date'
  | 'pending'
  | 'busy'
  | 'conflict'
  | 'error'

export interface SyncConflictInfo {
  fileName: string
  listKey: 'questions' | 'templates'
  id: number
  title: string
  localPreview: string
  remotePreview: string
}

export interface SyncStatus {
  code: SyncStatusCode
  label: string
  detail?: string
  hasPendingChanges: boolean
  retryAfterSec?: number
  lockBy?: string
  conflicts?: SyncConflictInfo[]
}

export interface ConflictResolution {
  fileName: string
  id: number
  choice: 'local' | 'remote'
}

type StatusListener = (status: SyncStatus) => void

const listeners = new Set<StatusListener>()
let currentStatus: SyncStatus = {
  code: 'idle',
  label: 'Готово',
  hasPendingChanges: false,
}

const LOCK_TTL_SEC = 90
const BUSY_RETRY_SEC = 20

interface SyncLockPayload {
  by: string
  since: number
  ttlSec: number
  lockId: string
}

let heldLockId: string | null = null
let pendingConflicts: TopicConflict[] = []
let pendingMergedByFile: Record<string, Record<string, unknown>> = {}

function emit(partial: Partial<SyncStatus> & Pick<SyncStatus, 'code' | 'label'>): SyncStatus {
  const settings = readSettings()
  currentStatus = {
    ...currentStatus,
    retryAfterSec: undefined,
    lockBy: undefined,
    conflicts: undefined,
    ...partial,
    hasPendingChanges: settings.hasPendingChanges,
  }
  for (const listener of listeners) listener(currentStatus)
  return currentStatus
}

export function onSyncStatus(listener: StatusListener): () => void {
  listeners.add(listener)
  listener(currentStatus)
  return () => listeners.delete(listener)
}

export function getSyncStatus(): SyncStatus {
  const settings = readSettings()
  return { ...currentStatus, hasPendingChanges: settings.hasPendingChanges }
}

function folderPath(fileName?: string): string {
  if (!fileName) return `disk:/${YANDEX_FOLDER}`
  return `disk:/${YANDEX_FOLDER}/${fileName}`
}

async function yandexFetch(
  token: string,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `OAuth ${token}`)
  return fetch(url, { ...init, headers })
}

async function ensureRemoteFolder(token: string): Promise<void> {
  const encoded = encodeURIComponent(folderPath())
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
      const text = await create.text()
      throw new Error(`Не удалось создать папку на Диске: ${text || create.status}`)
    }
  } else if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ошибка доступа к Яндекс.Диску: ${text || res.status}`)
  }
}

async function downloadRemoteFile(token: string, fileName: string, destPath: string): Promise<boolean> {
  const encoded = encodeURIComponent(folderPath(fileName))
  const meta = await yandexFetch(
    token,
    `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encoded}`,
  )
  if (meta.status === 404) return false
  if (!meta.ok) {
    const text = await meta.text()
    throw new Error(`Скачивание ${fileName}: ${text || meta.status}`)
  }
  const { href } = (await meta.json()) as { href: string }
  const fileRes = await fetch(href)
  if (!fileRes.ok) throw new Error(`Не удалось скачать ${fileName}`)
  const buf = Buffer.from(await fileRes.arrayBuffer())
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.writeFileSync(destPath, buf)
  return true
}

async function uploadLocalFile(token: string, fileName: string, localPath: string): Promise<void> {
  if (!fs.existsSync(localPath)) return
  const encoded = encodeURIComponent(folderPath(fileName))
  const meta = await yandexFetch(
    token,
    `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encoded}&overwrite=true`,
  )
  if (!meta.ok) {
    const text = await meta.text()
    throw new Error(`Загрузка ${fileName}: ${text || meta.status}`)
  }
  const { href } = (await meta.json()) as { href: string }
  const body = fs.readFileSync(localPath)
  const put = await fetch(href, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  if (!put.ok && put.status !== 201 && put.status !== 202) {
    throw new Error(`Ошибка отправки ${fileName}`)
  }
}

async function uploadJson(token: string, fileName: string, data: unknown): Promise<void> {
  const tmp = path.join(getUserDataRoot(), `.upload-${fileName}`)
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  try {
    await uploadLocalFile(token, fileName, tmp)
  } finally {
    try {
      fs.unlinkSync(tmp)
    } catch {
      /* ignore */
    }
  }
}

async function listRemoteMedia(token: string): Promise<string[]> {
  return listRemoteMediaRecursive(token, 'media')
}

async function listRemoteMediaRecursive(token: string, remoteDir: string): Promise<string[]> {
  const encoded = encodeURIComponent(folderPath(remoteDir))
  const res = await yandexFetch(
    token,
    `https://cloud-api.yandex.net/v1/disk/resources?path=${encoded}&limit=1000`,
  )
  if (res.status === 404) return []
  if (!res.ok) return []
  const data = (await res.json()) as {
    _embedded?: { items?: Array<{ name: string; type: string }> }
  }
  const out: string[] = []
  for (const item of data._embedded?.items ?? []) {
    const child = `${remoteDir}/${item.name}`
    if (item.type === 'file') {
      out.push(child)
    } else if (item.type === 'dir') {
      const nested = await listRemoteMediaRecursive(token, child)
      out.push(...nested)
    }
  }
  return out
}

async function ensureRemoteDir(token: string, remoteDir: string): Promise<void> {
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
        const text = await create.text()
        throw new Error(`Не удалось создать папку ${current}: ${text || create.status}`)
      }
    }
  }
}

async function ensureRemoteMediaFolder(token: string): Promise<void> {
  await ensureRemoteDir(token, 'media')
}

async function deleteRemoteFile(token: string, remotePath: string): Promise<void> {
  const encoded = encodeURIComponent(folderPath(remotePath))
  const res = await yandexFetch(
    token,
    `https://cloud-api.yandex.net/v1/disk/resources?path=${encoded}&permanently=true`,
    { method: 'DELETE' },
  )
  if (!res.ok && res.status !== 404) {
    const text = await res.text()
    throw new Error(`Удаление ${remotePath}: ${text || res.status}`)
  }
}

async function uploadPendingMedia(token: string): Promise<void> {
  const pending = readPendingMedia()
  const root = getUserDataRoot()
  for (const rel of pending.upload) {
    const localPath = path.join(root, ...rel.split('/'))
    if (!fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) continue
    const parentDir = rel.split('/').slice(0, -1).join('/')
    if (parentDir) await ensureRemoteDir(token, parentDir)
    await uploadLocalFile(token, rel, localPath)
  }
  for (const rel of pending.deleteRemote) {
    await deleteRemoteFile(token, rel)
  }
  clearPendingMedia()
}

async function pullAllRemoteMedia(token: string): Promise<void> {
  await ensureRemoteMediaFolder(token)
  const remoteFiles = await listRemoteMedia(token)
  const root = getUserDataRoot()
  for (const rel of remoteFiles) {
    const dest = path.join(root, ...rel.split('/'))
    if (!fs.existsSync(dest)) {
      await downloadRemoteFile(token, rel, dest)
    }
  }
}

function readLocalJson(fileName: string): Record<string, unknown> | null {
  const p = path.join(getUserDataRoot(), fileName)
  try {
    if (!fs.existsSync(p)) return null
    return JSON.parse(fs.readFileSync(p, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

function writeLocalJson(fileName: string, data: unknown): void {
  fs.writeFileSync(
    path.join(getUserDataRoot(), fileName),
    JSON.stringify(data, null, 2),
    'utf8',
  )
}

function previewText(topic: { question?: string; answer?: string }): string {
  const q = typeof topic.question === 'string' ? topic.question.trim() : ''
  const a = typeof topic.answer === 'string' ? topic.answer.trim().replace(/\s+/g, ' ') : ''
  const body = a.slice(0, 160)
  return [q, body].filter(Boolean).join(' — ') || '(пусто)'
}

function toConflictInfo(c: TopicConflict): SyncConflictInfo {
  return {
    fileName: c.fileName,
    listKey: c.listKey,
    id: c.id,
    title: c.title,
    localPreview: previewText(c.local),
    remotePreview: previewText(c.remote),
  }
}

function listKeyForFile(fileName: string): 'questions' | 'templates' {
  const dept = DEPARTMENTS.find((d) => d.fileName === fileName)
  return dept?.listKey ?? 'questions'
}

async function readRemoteLock(token: string): Promise<SyncLockPayload | null> {
  const tmp = path.join(getUserDataRoot(), `.${SYNC_LOCK_FILE}.tmp`)
  const ok = await downloadRemoteFile(token, SYNC_LOCK_FILE, tmp)
  if (!ok) return null
  try {
    const raw = JSON.parse(fs.readFileSync(tmp, 'utf8')) as SyncLockPayload
    if (!raw || typeof raw.lockId !== 'string' || typeof raw.since !== 'number') return null
    return {
      by: String(raw.by || 'другой пользователь'),
      since: raw.since,
      ttlSec: typeof raw.ttlSec === 'number' ? raw.ttlSec : LOCK_TTL_SEC,
      lockId: raw.lockId,
    }
  } catch {
    return null
  } finally {
    try {
      fs.unlinkSync(tmp)
    } catch {
      /* ignore */
    }
  }
}

function lockExpired(lock: SyncLockPayload): boolean {
  const ageMs = Date.now() - lock.since
  return ageMs > lock.ttlSec * 1000
}

async function acquireSyncLock(token: string): Promise<
  | { ok: true }
  | { ok: false; by: string; retryAfterSec: number }
> {
  const existing = await readRemoteLock(token)
  if (existing && !lockExpired(existing) && existing.lockId !== heldLockId) {
    const left = Math.ceil((existing.ttlSec * 1000 - (Date.now() - existing.since)) / 1000)
    return {
      ok: false,
      by: existing.by,
      retryAfterSec: Math.max(BUSY_RETRY_SEC, Math.min(left, BUSY_RETRY_SEC)),
    }
  }

  const user = getCurrentUser()
  const lockId = randomUUID()
  const payload: SyncLockPayload = {
    by: user?.email || user?.name || 'редактор',
    since: Date.now(),
    ttlSec: LOCK_TTL_SEC,
    lockId,
  }
  await uploadJson(token, SYNC_LOCK_FILE, payload)

  // Verify we won a possible race
  const verify = await readRemoteLock(token)
  if (!verify || verify.lockId !== lockId) {
    return {
      ok: false,
      by: verify?.by || 'другой пользователь',
      retryAfterSec: BUSY_RETRY_SEC,
    }
  }
  heldLockId = lockId
  return { ok: true }
}

async function releaseSyncLock(token: string): Promise<void> {
  try {
    const existing = await readRemoteLock(token)
    if (existing && heldLockId && existing.lockId !== heldLockId) return
    await deleteRemoteFile(token, SYNC_LOCK_FILE)
  } catch {
    /* ignore */
  } finally {
    heldLockId = null
  }
}

const SYNC_JSON_FILES = [...DATA_FILES, ACCOUNTS_FILE] as const

export async function pullFromYandex(options?: { force?: boolean }): Promise<SyncStatus> {
  const settings = readSettings()
  if (!settings.yandexToken) {
    return emit({
      code: 'no_token',
      label: 'Нет токена Диска',
      detail: 'Укажите токен на экране входа (шестерёнка)',
    })
  }

  try {
    emit({ code: 'connecting', label: 'Подключение…' })
    await ensureRemoteFolder(settings.yandexToken)
    emit({ code: 'syncing', label: 'Синхронизация…' })

    const root = getUserDataRoot()
    const force = Boolean(options?.force)
    for (const fileName of SYNC_JSON_FILES) {
      const dest = path.join(root, fileName)
      if (
        !force &&
        settings.hasPendingChanges &&
        DATA_FILES.includes(fileName as (typeof DATA_FILES)[number])
      ) {
        continue
      }

      if (fileName === ACCOUNTS_FILE) {
        await pullAndMergeAccounts(settings.yandexToken, force)
        continue
      }

      const downloaded = await downloadRemoteFile(settings.yandexToken, fileName, dest)
      if (downloaded && !readSettings().hasPendingChanges) {
        writeBaseFromDownloaded(fileName, dest)
      }
    }

    await ensureRemoteMediaFolder(settings.yandexToken)
    await pullAllRemoteMedia(settings.yandexToken)

    const latest = readSettings()
    if (!latest.hasPendingChanges) {
      writeAllGuideBasesFromLocal()
    }
    if (latest.hasPendingChanges) {
      return emit({ code: 'pending', label: 'Есть локальные изменения' })
    }
    return emit({ code: 'up_to_date', label: 'Актуально' })
  } catch (e) {
    return emit({
      code: 'error',
      label: 'Ошибка синхронизации',
      detail: e instanceof Error ? e.message : String(e),
    })
  }
}

function writeBaseFromDownloaded(fileName: string, dest: string): void {
  try {
    const data = JSON.parse(fs.readFileSync(dest, 'utf8')) as unknown
    writeBaseGuide(fileName, data)
  } catch {
    /* ignore */
  }
}

async function mergeGuidesWithRemote(token: string): Promise<{
  conflicts: TopicConflict[]
  mergedByFile: Record<string, Record<string, unknown>>
}> {
  const root = getUserDataRoot()
  const conflicts: TopicConflict[] = []
  const mergedByFile: Record<string, Record<string, unknown>> = {}

  for (const fileName of DATA_FILES) {
    const local = readLocalJson(fileName) ?? { [listKeyForFile(fileName)]: [] }
    const remoteTmp = path.join(root, `.${fileName}.remote`)
    const downloaded = await downloadRemoteFile(token, fileName, remoteTmp)
    let remote: Record<string, unknown> = { [listKeyForFile(fileName)]: [] }
    if (downloaded) {
      try {
        remote = JSON.parse(fs.readFileSync(remoteTmp, 'utf8')) as Record<string, unknown>
      } catch {
        remote = { [listKeyForFile(fileName)]: [] }
      }
    }
    try {
      fs.unlinkSync(remoteTmp)
    } catch {
      /* ignore */
    }

    const baseRaw = readBaseGuide(fileName)
    const base =
      baseRaw && typeof baseRaw === 'object'
        ? (baseRaw as Record<string, unknown>)
        : null

    const result = mergeGuideFile(fileName, base, local, remote)
    mergedByFile[fileName] = result.merged
    conflicts.push(...result.conflicts)
  }

  return { conflicts, mergedByFile }
}

export async function pushToYandex(): Promise<SyncStatus> {
  const settings = readSettings()
  if (!settings.yandexToken) {
    return emit({
      code: 'no_token',
      label: 'Нет токена Диска',
      detail: 'Укажите токен на экране входа (шестерёнка)',
    })
  }

  const token = settings.yandexToken
  let lockHeld = false

  try {
    emit({ code: 'connecting', label: 'Подключение…' })
    await ensureRemoteFolder(token)
    await ensureRemoteMediaFolder(token)

    emit({ code: 'syncing', label: 'Проверка блокировки…' })
    const lock = await acquireSyncLock(token)
    if (!lock.ok) {
      return emit({
        code: 'busy',
        label: 'Синхронизация временно занята',
        detail: `Сейчас синхронизирует: ${lock.by}. Повтор через ${lock.retryAfterSec} с`,
        retryAfterSec: lock.retryAfterSec,
        lockBy: lock.by,
      })
    }
    lockHeld = true

    emit({ code: 'syncing', label: 'Слияние изменений…' })
    const { conflicts, mergedByFile } = await mergeGuidesWithRemote(token)

    if (conflicts.length > 0) {
      pendingConflicts = conflicts
      pendingMergedByFile = mergedByFile
      // Keep merged placeholders on disk so UI can reload after resolve
      for (const [fileName, data] of Object.entries(mergedByFile)) {
        writeLocalJson(fileName, data)
      }
      await releaseSyncLock(token)
      lockHeld = false
      return emit({
        code: 'conflict',
        label: 'Конфликт изменений',
        detail: `Разные правки одной темы: ${conflicts.length}`,
        conflicts: conflicts.map(toConflictInfo),
      })
    }

    emit({ code: 'uploading', label: 'Отправка…' })
    for (const [fileName, data] of Object.entries(mergedByFile)) {
      writeLocalJson(fileName, data)
      await uploadLocalFile(token, fileName, path.join(getUserDataRoot(), fileName))
      writeBaseGuide(fileName, data)
    }

    // Accounts: merge then upload
    await pullAndMergeAccounts(token, false)
    await uploadLocalFile(token, ACCOUNTS_FILE, path.join(getUserDataRoot(), ACCOUNTS_FILE))

    await uploadPendingMedia(token)

    pendingConflicts = []
    pendingMergedByFile = {}
    setPendingChanges(false)
    await releaseSyncLock(token)
    lockHeld = false
    return emit({ code: 'up_to_date', label: 'Актуально' })
  } catch (e) {
    if (lockHeld) {
      try {
        await releaseSyncLock(token)
      } catch {
        /* ignore */
      }
    }
    return emit({
      code: 'error',
      label: 'Ошибка отправки',
      detail: e instanceof Error ? e.message : String(e),
    })
  }
}

/** Apply user choices for topic conflicts, then push again. */
export async function resolveSyncConflicts(
  resolutions: ConflictResolution[],
): Promise<SyncStatus> {
  if (pendingConflicts.length === 0) {
    return pushToYandex()
  }

  const byFile = new Map<string, ConflictResolution[]>()
  for (const r of resolutions) {
    const list = byFile.get(r.fileName) ?? []
    list.push(r)
    byFile.set(r.fileName, list)
  }

  for (const [fileName, fileResolutions] of byFile) {
    const conflicts = pendingConflicts.filter((c) => c.fileName === fileName)
    const listKey = conflicts[0]?.listKey ?? listKeyForFile(fileName)
    let file = pendingMergedByFile[fileName] ?? readLocalJson(fileName)
    if (!file) continue
    file = applyConflictResolutions(
      file,
      listKey,
      fileResolutions.map((r) => ({ id: r.id, choice: r.choice })),
      conflicts,
    )
    writeLocalJson(fileName, file)
    pendingMergedByFile[fileName] = file
  }

  // Drop resolved from pending list
  const resolvedKeys = new Set(resolutions.map((r) => `${r.fileName}:${r.id}`))
  pendingConflicts = pendingConflicts.filter((c) => !resolvedKeys.has(`${c.fileName}:${c.id}`))

  if (pendingConflicts.length > 0) {
    return emit({
      code: 'conflict',
      label: 'Конфликт изменений',
      detail: `Осталось конфликтов: ${pendingConflicts.length}`,
      conflicts: pendingConflicts.map(toConflictInfo),
    })
  }

  pendingConflicts = []
  return pushToYandex()
}

export function markLocalChange(): SyncStatus {
  setPendingChanges(true)
  return emit({ code: 'pending', label: 'Есть локальные изменения' })
}

/** Upload only accounts.json (registrations / roles / whitelist) without clearing guide pending. */
export async function pushAccountsFile(): Promise<boolean> {
  const settings = readSettings()
  if (!settings.yandexToken) return false
  try {
    await ensureRemoteFolder(settings.yandexToken)
    const localPath = path.join(getUserDataRoot(), ACCOUNTS_FILE)
    await uploadLocalFile(settings.yandexToken, ACCOUNTS_FILE, localPath)
    return true
  } catch {
    return false
  }
}

async function pullAndMergeAccounts(token: string, force: boolean): Promise<void> {
  const root = getUserDataRoot()
  const remoteTmp = path.join(root, `.${ACCOUNTS_FILE}.remote`)
  const local = readAccounts()
  const downloaded = await downloadRemoteFile(token, ACCOUNTS_FILE, remoteTmp)
  if (!downloaded) {
    return
  }

  try {
    const raw = JSON.parse(fs.readFileSync(remoteTmp, 'utf8')) as {
      users?: unknown
      whitelist?: unknown
    }
    const remote: AccountsData = {
      users: Array.isArray(raw.users) ? (raw.users as AccountsData['users']) : [],
      whitelist: Array.isArray(raw.whitelist) ? (raw.whitelist as string[]) : [],
    }
    const preferLocalRoles = !force && readSettings().hasPendingChanges
    const merged = mergeAccountsData(local, remote, { preferLocalRoles })
    writeAccounts(merged)
  } finally {
    try {
      fs.unlinkSync(remoteTmp)
    } catch {
      /* ignore */
    }
  }
}

/** Drop unsynced local guide edits by re-downloading from Disk. */
export async function discardLocalChanges(): Promise<SyncStatus> {
  const settings = readSettings()
  if (!settings.yandexToken) {
    return emit({
      code: 'no_token',
      label: 'Нет токена Диска',
      detail: 'Укажите токен на экране входа (шестерёнка)',
    })
  }
  setPendingChanges(false)
  pendingConflicts = []
  pendingMergedByFile = {}
  return pullFromYandex({ force: true })
}

export function refreshStatusFromSettings(): SyncStatus {
  const settings = readSettings()
  if (!settings.yandexToken) {
    return emit({ code: 'no_token', label: 'Нет токена Диска' })
  }
  if (currentStatus.code === 'conflict' && (currentStatus.conflicts?.length ?? 0) > 0) {
    return getSyncStatus()
  }
  if (settings.hasPendingChanges) {
    return emit({ code: 'pending', label: 'Есть локальные изменения' })
  }
  return emit({
    code: currentStatus.code === 'error' ? 'error' : 'up_to_date',
    label: currentStatus.code === 'error' ? currentStatus.label : 'Актуально',
  })
}

export function replaceAccountsFromFileIfExists(): void {
  // Kept for compatibility; pull now merges via pullAndMergeAccounts.
}

export function replaceSettingsPreservingToken(remotePath: string): void {
  if (!fs.existsSync(remotePath)) return
  try {
    const remote = JSON.parse(fs.readFileSync(remotePath, 'utf8')) as {
      hasPendingChanges?: boolean
    }
    const local = readSettings()
    writeSettings({
      yandexToken: local.yandexToken,
      hasPendingChanges: local.hasPendingChanges || Boolean(remote.hasPendingChanges),
    })
  } catch {
    /* ignore */
  }
}
