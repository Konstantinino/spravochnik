/**
 * Sync backend router — defaults to server; set STORAGE_BACKEND=yandex for legacy Yandex Disk.
 */
import * as serverSync from './server-sync.js'

const backend = process.env.STORAGE_BACKEND === 'yandex' ? 'yandex' : 'server'

async function loadYandex() {
  return import('./yandex-sync')
}

export type {
  SyncStatus,
  SyncStatusCode,
  SyncConflictInfo,
  ConflictResolution,
} from './server-sync.js'

export const onSyncStatus = serverSync.onSyncStatus
export const getSyncStatus = serverSync.getSyncStatus
export const markLocalChange = serverSync.markLocalChange
export const markOfflinePending = serverSync.markOfflinePending
export const refreshStatusFromSettings = serverSync.refreshStatusFromSettings
export const tryPushTopicOnline = serverSync.tryPushTopicOnline

export async function pullFromYandex(options?: { force?: boolean }) {
  if (backend === 'yandex') {
    const y = await loadYandex()
    return y.pullFromYandex(options)
  }
  return serverSync.pullFromServer(options)
}

export async function pushToYandex() {
  if (backend === 'yandex') {
    const y = await loadYandex()
    return y.pushToYandex()
  }
  return serverSync.pushToServer()
}

export async function resolveSyncConflicts(
  resolutions: serverSync.ConflictResolution[],
) {
  if (backend === 'yandex') {
    const y = await loadYandex()
    return y.resolveSyncConflicts(resolutions)
  }
  return serverSync.resolveSyncConflicts(resolutions)
}

export async function pushAccountsFile() {
  if (backend === 'yandex') {
    const y = await loadYandex()
    return y.pushAccountsFile()
  }
  return serverSync.pushAccountsFile()
}

export async function discardLocalChanges() {
  if (backend === 'yandex') {
    const y = await loadYandex()
    return y.discardLocalChanges()
  }
  return serverSync.discardLocalChanges()
}
