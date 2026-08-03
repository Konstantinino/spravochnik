import fs from 'node:fs'
import path from 'node:path'
import {
  ACCOUNTS_FILE,
  DATA_FILES,
  YANDEX_FOLDER,
  getUserDataRoot,
} from './paths'
import {
  readSettings,
  setPendingChanges,
  writeAccounts,
  writeSettings,
  readAccounts,
  mergeAccountsData,
  type AccountsData,
} from './auth-store'
import { clearPendingMedia, readPendingMedia } from './pending-media'

export type SyncStatusCode =
  | 'idle'
  | 'no_token'
  | 'connecting'
  | 'syncing'
  | 'uploading'
  | 'up_to_date'
  | 'pending'
  | 'error'

export interface SyncStatus {
  code: SyncStatusCode
  label: string
  detail?: string
  hasPendingChanges: boolean
}

type StatusListener = (status: SyncStatus) => void

const listeners = new Set<StatusListener>()
let currentStatus: SyncStatus = {
  code: 'idle',
  label: 'Готово',
  hasPendingChanges: false,
}

function emit(partial: Partial<SyncStatus> & Pick<SyncStatus, 'code' | 'label'>): SyncStatus {
  const settings = readSettings()
  currentStatus = {
    ...currentStatus,
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

async function listRemoteMedia(token: string): Promise<string[]> {
  return listRemoteMediaRecursive(token, 'media')
}

/** Returns paths relative to userData root, e.g. media/a.jpg or media/12/images/b.png */
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
      // Don't overwrite local pending guide edits on pull if pending — still pull accounts carefully
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

      await downloadRemoteFile(settings.yandexToken, fileName, dest)
    }

    // Pull settings token is local-only — never overwrite local token from remote settings file
    // Optionally download remote settings without token? Skip SETTINGS_FILE for safety.

    await ensureRemoteMediaFolder(settings.yandexToken)
    await pullAllRemoteMedia(settings.yandexToken)

    const latest = readSettings()
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

export async function pushToYandex(): Promise<SyncStatus> {
  const settings = readSettings()
  if (!settings.yandexToken) {
    return emit({
      code: 'no_token',
      label: 'Нет токена Диска',
      detail: 'Укажите токен на экране входа (шестерёнка)',
    })
  }

  try {
    emit({ code: 'uploading', label: 'Отправка…' })
    await ensureRemoteFolder(settings.yandexToken)
    await ensureRemoteMediaFolder(settings.yandexToken)

    const root = getUserDataRoot()
    for (const fileName of SYNC_JSON_FILES) {
      await uploadLocalFile(settings.yandexToken, fileName, path.join(root, fileName))
    }

    await uploadPendingMedia(settings.yandexToken)

    setPendingChanges(false)
    return emit({ code: 'up_to_date', label: 'Актуально' })
  } catch (e) {
    return emit({
      code: 'error',
      label: 'Ошибка отправки',
      detail: e instanceof Error ? e.message : String(e),
    })
  }
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
    // Nothing on Disk yet — keep local
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
  return pullFromYandex({ force: true })
}

export function refreshStatusFromSettings(): SyncStatus {
  const settings = readSettings()
  if (!settings.yandexToken) {
    return emit({ code: 'no_token', label: 'Нет токена Диска' })
  }
  if (settings.hasPendingChanges) {
    return emit({ code: 'pending', label: 'Есть локальные изменения' })
  }
  return emit({ code: currentStatus.code === 'error' ? 'error' : 'up_to_date', label: currentStatus.code === 'error' ? currentStatus.label : 'Актуально' })
}

/** Merge remote accounts if we skipped — used after push/pull helpers */
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
