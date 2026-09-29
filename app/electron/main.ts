import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  protocol,
  net,
  screen,
  shell,
} from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'
import {
  DATA_FILES,
  getDepartments,
  departmentById,
  getMediaDir,
  getSeedDataDir,
  getUserDataRoot,
  isWorkDepartmentId,
  normalizeWorkDepartmentId,
  parseUserRole,
  STAFF_ROLES,
  CONTENT_EDITOR_ROLES,
  canEditDepartment,
  canManageTopicSectionsForDepartment,
  type DepartmentId,
  type UserRole,
  type WorkDepartmentId,
} from './paths'
import {
  cleanupTopicFileOrphans,
  cleanupTopicImageOrphans,
  migrateDraftFilesToTopic,
  migrateDraftImagesToTopic,
  removeLocalTopicMedia,
  saveFileForOwner,
  saveImageFileForOwner,
  saveNativeImageForOwner,
  type ImageOwner,
  type TopicMediaRow,
  resolveImageStorageRef,
} from './topic-media'
import type { SavedWindowBounds } from './auth-store'
import {
  addWhitelistEmail,
  clearSession,
  ensureAuthFiles,
  getCurrentUser,
  getRegistrationDepartment,
  getWhitelist,
  listUsersPublic,
  loginUser,
  readSettings,
  writeSettings,
  registerUser,
  saveWindowBounds,
  removeWhitelistEmail,
  requireRole,
  setWhitelist,
  setYandexToken,
  setServerUrl,
  setAuthToken,
  readAccounts,
  writeAccounts,
  updateUserRole,
  updateUserProfile,
  deleteUser,
  transferOwnership,
  getOwnerEmail,
  writeSession,
  clearEphemeralSessionOnStartup,
  type PublicUser,
  type WhitelistEntry,
} from './auth-store'
import {
  discardLocalChanges,
  getSyncStatus,
  markLocalChange,
  markOfflinePending,
  onSyncStatus,
  peekAndPullRemoteChanges,
  pullFromYandex,
  pushAccountsFile,
  pushToYandex,
  refreshStatusFromSettings,
  showSyncLoadingIfOnline,
  resolveSyncConflicts,
  tryPushTopicOnline,
  tryPushReorderOnline,
  ensureTopicMediaDownloaded,
  ensureMediaFilesDownloaded,
} from './sync-backend'
import { queueOperation } from './pending-operations'
import {
  isServerReachable,
  lockTopic,
  unlockTopic,
  renewTopicLock,
  lockTopicOrder,
  unlockTopicOrder,
  renewTopicOrderLock,
  fetchDepartmentTopics,
  fetchSupportPhones,
  saveSupportPhonesOnServer,
  serverFetch,
  serverLogin,
  serverRegister,
  ServerApiError,
  validateServerUrl,
  createDepartmentOnServer,
  createSubsectionOnServer,
  type AdminSubsectionDto,
  deleteDepartmentOnServer,
  deleteSubsectionOnServer,
  fetchAdminDepartments,
  updateDepartmentOnServer,
  updateSubsectionOnServer,
} from './server-api'
import { mergeDepartmentPatch } from './departments-store'
import {
  getSubsectionsForDepartment,
  mergeSubsectionPatch,
  mergeSubsectionsLists,
  readStoredSubsections,
  removeSubsectionLocal,
  writeStoredSubsections,
  type StoredSubsection,
} from './subsections-store'
import {
  applySupportSectionsFromSync,
  mergeSupportSectionPatch,
  readStoredSupportSections,
  removeSupportSectionLocal,
  type StoredSupportSection,
} from './support-sections-store'
import {
  ARCHIVE_ARCHIVED_SUBSECTION_ID,
  ARCHIVE_LOST_SUBSECTION_ID,
  applySupportArchiveSubsectionToRow,
  clearGuideTopicSubsectionId,
  moveGuideTopicsToArchiveLost,
} from '../src/lib/archiveLost'
import {
  createSupportSectionOnServer,
  deleteSupportSectionOnServer,
  fetchAdminSupportSections,
  updateSupportSectionOnServer,
} from './server-api'
import {
  checkForUpdates,
  downloadLatestRelease,
  downloadUpdate,
  ensureLocalUpdateManifest,
  fetchLatestRelease,
  getUpdateStatus,
  installUpdate,
  onUpdateStatus,
  startUpdateCheckInterval,
} from './updates'
import { downloadMediaImage } from './media-download'
import { normalizeSupportPhones } from '../src/lib/supportPhones'
import {
  migrateLegacyLocalMedia,
  normalizeMediaDepartmentId,
  resolveExistingMediaAbsolutePath,
} from './media-layout'
import { queueMediaUpload } from './pending-media'
import { reconcileHasChildren } from './guide-data'
import {
  appendSessionLog,
  clearSessionLogs,
  getSessionLogs,
  onSessionLog,
} from './session-log'

// Must match build.appId — same AppUserModelID as desktop shortcut (WinShell::SetLnkAUMI).
if (process.platform === 'win32') {
  app.setAppUserModelId('ru.rest.info')
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'spravochnik',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
])

const SUPPORT_PARTY_VALUES = ['supplier', 'customer', 'errors', 'additional'] as const
type SupportPartyValue = (typeof SUPPORT_PARTY_VALUES)[number]

function normalizeSupportPartyId(value: unknown, fallback = 'supplier'): string {
  if (typeof value !== 'string' || !value.trim()) return fallback
  const id = value.trim()
  if (SUPPORT_PARTY_VALUES.includes(id as SupportPartyValue)) return id
  if (readStoredSupportSections().some((s) => s.id === id)) return id
  return fallback
}

function ensureArchiveLostSubsectionLocal(): void {
  const list = readStoredSubsections()
  if (list.some((s) => s.id === ARCHIVE_LOST_SUBSECTION_ID)) return
  mergeSubsectionPatch({
    id: ARCHIVE_LOST_SUBSECTION_ID,
    departmentId: 'support',
    label: 'Потерянные',
    sortOrder: 5,
    party: null,
    isArchiveLost: true,
  })
}

function ensureArchiveArchivedSubsectionLocal(): void {
  const list = readStoredSubsections()
  if (list.some((s) => s.id === ARCHIVE_ARCHIVED_SUBSECTION_ID)) return
  mergeSubsectionPatch({
    id: ARCHIVE_ARCHIVED_SUBSECTION_ID,
    departmentId: 'support',
    label: 'Архивированные',
    sortOrder: 3,
    party: null,
    isArchiveArchived: true,
  })
}

function archiveSupportTopicsLocally(match: (row: Record<string, unknown>) => boolean): number {
  const dept = departmentById('support')
  const data = readGuideFile(dept.fileName) as Record<string, unknown>
  const listKey = dept.listKey
  const list = (data[listKey] as Array<Record<string, unknown>>) || []
  ensureArchiveLostSubsectionLocal()
  const moved = moveGuideTopicsToArchiveLost(list, match)
  if (moved > 0) {
    data[listKey] = list
    writeGuideFile(dept.fileName, data)
  }
  return moved
}

function clearSupportSubsectionLocally(subsectionId: string): number {
  const dept = departmentById('support')
  const data = readGuideFile(dept.fileName) as Record<string, unknown>
  const listKey = dept.listKey
  const list = (data[listKey] as Array<Record<string, unknown>>) || []
  const cleared = clearGuideTopicSubsectionId(
    list,
    (row) => String(row.subsection_id ?? '').trim() === subsectionId,
  )
  if (cleared > 0) {
    data[listKey] = list
    writeGuideFile(dept.fileName, data)
    markLocalChange()
  }
  return cleared
}

function rootSubsectionsForTopic(
  departmentId: string,
  party: string | undefined,
): StoredSubsection[] {
  const all = getSubsectionsForDepartment(departmentId)
  if (departmentId === 'support') {
    const p = normalizeSupportPartyId(party)
    return all.filter((s) => (s.party ?? null) === p)
  }
  return all.filter((s) => !s.party)
}

function normalizeClientTopicId(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function applyClientTopicLink(
  target: Record<string, unknown>,
  party: string,
  clientTopicId: unknown,
): void {
  if (party !== 'additional') {
    delete target.client_topic_id
    return
  }
  if (clientTopicId === undefined) return
  const id = normalizeClientTopicId(clientTopicId)
  if (id == null) delete target.client_topic_id
  else target.client_topic_id = id
}

function ensureDataReady(): void {
  const root = getUserDataRoot()
  const media = getMediaDir()
  fs.mkdirSync(root, { recursive: true })
  fs.mkdirSync(media, { recursive: true })

  const seedDir = getSeedDataDir()
  for (const fileName of DATA_FILES) {
    const target = path.join(root, fileName)
    if (!fs.existsSync(target)) {
      const source = path.join(seedDir, fileName)
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, target)
      } else {
        const isTemplates = fileName === 'templates.json'
        const empty = isTemplates ? { templates: [] } : { questions: [] }
        fs.writeFileSync(target, JSON.stringify(empty, null, 2), 'utf8')
      }
    }
  }
  ensureAuthFiles()
  ensureLocalUpdateManifest()
  migrateLegacyLocalMedia()
}

function requireEditDepartment(departmentId: DepartmentId): void {
  const user = getCurrentUser()
  requireRole(user, CONTENT_EDITOR_ROLES)
  if (!canEditDepartment(user!.role, user!.departmentId, departmentId)) {
    throw new Error('Редактор может изменять только свой отдел')
  }
}

function requireManageTopicSections(departmentId: string): void {
  const user = getCurrentUser()
  requireRole(user, STAFF_ROLES)
  const isOwner = Boolean(user!.isOwner) || user!.role === 'owner'
  if (
    !canManageTopicSectionsForDepartment(user!.role, user!.departmentId, departmentId, {
      isOwner,
    })
  ) {
    throw new Error('Администратор может настраивать разделы только своего отдела')
  }
}

function roleFromServerUser(user: Record<string, unknown>): UserRole {
  if (user.isOwner || user.role === 'owner') return 'owner'
  return parseUserRole(user.role)
}

function cacheServerUser(user: Record<string, unknown>): void {
  const accounts = readAccounts()
  const email = String(user.email ?? '').toLowerCase()
  const incomingDept = user.departmentId ?? user.department_id
  const departmentId = isWorkDepartmentId(incomingDept)
    ? incomingDept
    : incomingDept != null && String(incomingDept).trim()
      ? normalizeWorkDepartmentId(incomingDept)
      : undefined
  const existing = accounts.users.find((u) => u.email.toLowerCase() === email)
  if (!existing) {
    accounts.users.push({
      id: String(user.id),
      name: String(user.name ?? ''),
      email,
      passwordHash: '',
      salt: '',
      role: roleFromServerUser(user),
      departmentId: departmentId ?? 'support',
      createdAt: new Date().toISOString(),
    })
    writeAccounts(accounts)
  } else {
    const previousId = existing.id
    const nextId = String(user.id ?? existing.id)
    existing.id = nextId
    existing.name = String(user.name ?? existing.name)
    existing.role = roleFromServerUser(user)
    if (departmentId) existing.departmentId = departmentId
    writeAccounts(accounts)
    // Keep session valid when server UUID replaces a local id
    if (previousId && nextId && previousId !== nextId) {
      try {
        const sessionFile = path.join(getUserDataRoot(), 'session.json')
        if (fs.existsSync(sessionFile)) {
          const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8')) as {
            userId?: string
            persist?: boolean
          }
          if (session.userId === previousId) {
            writeSession(nextId, session.persist !== false)
          }
        }
      } catch {
        /* ignore */
      }
    }
  }
}

function publicUsersFromServer(users: Record<string, unknown>[]): PublicUser[] {
  if (!Array.isArray(users)) return []
  for (const user of users) {
    cacheServerUser(user)
  }
  return users.map((user) => ({
    id: String(user.id),
    name: String(user.name),
    email: String(user.email),
    role: roleFromServerUser(user),
    departmentId: normalizeWorkDepartmentId(user.departmentId ?? user.department_id),
    ...(user.isOwner || user.role === 'owner' ? { isOwner: true } : {}),
  }))
}

async function fetchAdminUsersFromServer(): Promise<PublicUser[] | null> {
  const settings = readSettings()
  if (!settings.serverUrl.trim() || !settings.authToken.trim()) return null
  if (!(await isServerReachable())) return null
  const data = await serverFetch<{ users: Record<string, unknown>[] }>('/admin/users')
  return publicUsersFromServer(data.users)
}

function readGuideFile(fileName: string): unknown {
  const filePath = path.join(getUserDataRoot(), fileName)
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw)
}

function writeGuideFile(fileName: string, data: unknown): void {
  const filePath = path.join(getUserDataRoot(), fileName)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

/** Подставить разделы из subsection_id тем, если их ещё нет в subsections.json */
function inferSubsectionsFromLocalGuides(existing: StoredSubsection[]): StoredSubsection[] {
  const byId = new Map(existing.map((s) => [s.id, s]))
  const out = [...existing]
  for (const dept of getDepartments()) {
    if (dept.listKey !== 'questions') continue
    let data: Record<string, unknown>
    try {
      data = readGuideFile(dept.fileName) as Record<string, unknown>
    } catch {
      continue
    }
    const list = (data[dept.listKey] as Array<Record<string, unknown>>) ?? []
    for (const row of list) {
      const sid = typeof row.subsection_id === 'string' ? row.subsection_id.trim() : ''
      if (!sid || byId.has(sid)) continue
      const inferred: StoredSubsection = {
        id: sid,
        departmentId: dept.id,
        label: sid,
        sortOrder: 9990,
        ...(dept.id === 'support'
          ? { party: normalizeSupportPartyId(row.party) }
          : { party: null }),
      }
      byId.set(sid, inferred)
      out.push(inferred)
    }
  }
  return out.sort(
    (a, b) =>
      a.departmentId.localeCompare(b.departmentId) ||
      a.sortOrder - b.sortOrder ||
      a.id.localeCompare(b.id),
  )
}

async function refreshDeptTopicOrderFromServer(
  departmentId: DepartmentId,
): Promise<Record<string, unknown>> {
  const dept = departmentById(departmentId)
  const settings = readSettings()
  const data = readGuideFile(dept.fileName) as Record<string, unknown>

  if (!settings.serverUrl.trim()) {
    return data
  }

  const remote = await fetchDepartmentTopics(departmentId)
  const listKey = dept.listKey
  const local = (data[listKey] as Array<Record<string, unknown>>) || []
  const remoteList = (remote[listKey] as Array<Record<string, unknown>>) || []
  const sortById = new Map<number, number | null | undefined>()
  for (const item of remoteList) {
    sortById.set(Number(item.id), item.sort_index as number | null | undefined)
  }
  for (const item of local) {
    const id = Number(item.id)
    if (!sortById.has(id)) continue
    item.sort_index = sortById.get(id) ?? null
  }
  writeGuideFile(dept.fileName, data)
  return data
}

const WINDOW_MIN_WIDTH = 1000
const WINDOW_MIN_HEIGHT = 700
const WINDOW_DEFAULT_WIDTH = 1200
const WINDOW_DEFAULT_HEIGHT = 800

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return !(
    a.x + a.width <= b.x ||
    a.x >= b.x + b.width ||
    a.y + a.height <= b.y ||
    a.y >= b.y + b.height
  )
}

function isWindowBoundsVisible(bounds: SavedWindowBounds): boolean {
  const rect = {
    x: bounds.x,
    y: bounds.y,
    width: Math.max(WINDOW_MIN_WIDTH, bounds.width),
    height: Math.max(WINDOW_MIN_HEIGHT, bounds.height),
  }
  return screen.getAllDisplays().some((display) => rectsOverlap(rect, display.workArea))
}

function loadSavedWindowBounds(): { bounds: SavedWindowBounds; place: boolean } | null {
  const saved = readSettings().windowBounds
  if (!saved) return null
  const bounds: SavedWindowBounds = {
    width: Math.max(WINDOW_MIN_WIDTH, Math.round(saved.width)),
    height: Math.max(WINDOW_MIN_HEIGHT, Math.round(saved.height)),
    x: Math.round(saved.x),
    y: Math.round(saved.y),
    isMaximized: Boolean(saved.isMaximized),
  }
  return { bounds, place: isWindowBoundsVisible(bounds) }
}

function persistWindowBounds(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  const isMaximized = win.isMaximized()
  const bounds = isMaximized ? win.getNormalBounds() : win.getBounds()
  saveWindowBounds({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized,
  })
}

function attachWindowBoundsPersistence(win: BrowserWindow): void {
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      persistWindowBounds(win)
    }, 300)
  }

  win.on('resize', scheduleSave)
  win.on('move', scheduleSave)
  win.on('maximize', scheduleSave)
  win.on('unmaximize', scheduleSave)
  win.on('close', () => {
    if (saveTimer) clearTimeout(saveTimer)
    persistWindowBounds(win)
  })
}

function attachWindowsInputFixes(win: BrowserWindow): void {
  if (process.platform !== 'win32') return
  // Alt+Shift (language switch) must not activate the hidden menu bar and blur the editor.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'Alt') {
      event.preventDefault()
    }
  })
}

function createWindow(): void {
  const savedWindow = loadSavedWindowBounds()
  const savedBounds = savedWindow?.bounds
  const win = new BrowserWindow({
    width: savedBounds?.width ?? WINDOW_DEFAULT_WIDTH,
    height: savedBounds?.height ?? WINDOW_DEFAULT_HEIGHT,
    x: savedWindow?.place ? savedBounds!.x : undefined,
    y: savedWindow?.place ? savedBounds!.y : undefined,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    title: 'REST INFO',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (savedBounds?.isMaximized) {
    win.maximize()
  }

  win.setMenuBarVisibility(false)
  attachWindowsInputFixes(win)
  attachWindowBoundsPersistence(win)
  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  win.webContents.on('context-menu', (_event, params) => {
    const linkURL = params.linkURL?.trim()
    if (!linkURL || !/^https?:\/\//i.test(linkURL)) return

    Menu.buildFromTemplate([
      {
        label: 'Открыть в браузере',
        click: () => {
          void shell.openExternal(linkURL)
        },
      },
      {
        label: 'Копировать адрес ссылки',
        click: () => {
          clipboard.writeText(linkURL)
        },
      },
    ]).popup({ window: win })
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('get-departments', () =>
    getDepartments().map(({ id, label, fileName, listKey }) => ({
      id,
      label,
      fileName,
      listKey,
    })),
  )

  ipcMain.handle('get-subsections', async () => {
    let list = readStoredSubsections()
    const settings = readSettings()
    if (settings.serverUrl.trim() && settings.authToken.trim()) {
      try {
        if (await isServerReachable()) {
          const fromServer: StoredSubsection[] = []
          for (const dept of await fetchAdminDepartments()) {
            for (const sub of dept.subsections ?? []) {
              fromServer.push({
                id: sub.id,
                departmentId: sub.departmentId,
                label: sub.label,
                sortOrder: sub.sortOrder,
                party:
                  typeof sub.party === 'string' && sub.party.trim()
                    ? sub.party.trim()
                    : null,
                isArchiveLost: Boolean(sub.isArchiveLost) || sub.id === ARCHIVE_LOST_SUBSECTION_ID,
                isArchiveArchived:
                  Boolean(sub.isArchiveArchived) || sub.id === ARCHIVE_ARCHIVED_SUBSECTION_ID,
              })
            }
          }
          if (fromServer.length > 0) {
            list = mergeSubsectionsLists(list, fromServer)
            writeStoredSubsections(list)
          }
        }
      } catch (err) {
        appendSessionLog(
          'warn',
          'subsections',
          err instanceof Error ? err.message : 'Не удалось загрузить разделы тем с сервера',
        )
      }
    }
    return inferSubsectionsFromLocalGuides(list)
  })

  ipcMain.handle('get-support-sections', async () => {
    let list = readStoredSupportSections()
    const settings = readSettings()
    if (settings.serverUrl.trim() && settings.authToken.trim()) {
      try {
        if (await isServerReachable()) {
          const fromServer = await fetchAdminSupportSections()
          if (fromServer.length > 0) {
            applySupportSectionsFromSync(fromServer)
            list = readStoredSupportSections()
          }
        }
      } catch (err) {
        appendSessionLog(
          'warn',
          'support-sections',
          err instanceof Error ? err.message : 'Не удалось загрузить разделы с сервера',
        )
      }
    }
    return list
  })

  ipcMain.handle('get-data-path', () => getUserDataRoot())

  ipcMain.handle('auth:current-user', () => getCurrentUser())
  ipcMain.handle(
    'auth:login',
    async (_e, payload: { email: string; password: string; rememberMe?: boolean }) => {
      const settings = readSettings()
      if (settings.serverUrl.trim()) {
        const { token, user } = await serverLogin(payload.email, payload.password)
        setAuthToken(token)
        cacheServerUser(user)
        writeSession(String(user.id), Boolean(payload.rememberMe))
        appendSessionLog('info', 'auth', `Вход: ${String(user.email)}`)
        void pullFromYandex()
        return {
          id: String(user.id),
          name: String(user.name),
          email: String(user.email),
          role: parseUserRole(user.role),
          departmentId: normalizeWorkDepartmentId(user.departmentId ?? user.department_id),
          isOwner: Boolean(user.isOwner) || user.role === 'owner',
        }
      }
      const user = loginUser(payload)
      return user
    },
  )
  ipcMain.handle(
    'auth:register',
    async (
      _e,
      payload: {
        name: string
        email: string
        password: string
        passwordConfirm: string
        rememberMe?: boolean
      },
    ) => {
      if (payload.password !== payload.passwordConfirm) {
        throw new Error('Пароли не совпадают')
      }
      const settings = readSettings()
      if (settings.serverUrl.trim()) {
        const { token, user } = await serverRegister({
          name: payload.name,
          email: payload.email,
          password: payload.password,
        })
        setAuthToken(token)
        cacheServerUser(user)
        writeSession(String(user.id), Boolean(payload.rememberMe))
        void pullFromYandex()
        return {
          id: String(user.id),
          name: String(user.name),
          email: String(user.email),
          role: parseUserRole(user.role),
          departmentId: normalizeWorkDepartmentId(user.departmentId ?? user.department_id),
          isOwner: Boolean(user.isOwner) || user.role === 'owner',
        }
      }
      const user = registerUser(payload)
      writeSession(user.id, Boolean(payload.rememberMe))
      markLocalChange()
      void pushAccountsFile()
      return user
    },
  )
  ipcMain.handle('auth:logout', () => {
    clearSession()
    return null
  })
  ipcMain.handle('sync:has-token', () => {
    const s = readSettings()
    const hasServer = Boolean(s.serverUrl.trim() && s.authToken.trim())
    const hasYandex = Boolean(s.yandexToken?.trim())
    return { hasToken: hasServer || hasYandex }
  })
  ipcMain.handle('sync:has-server', () => {
    const s = readSettings()
    return { hasServer: Boolean(s.serverUrl.trim()) }
  })
  ipcMain.handle('sync:get-server-url', () => {
    const s = readSettings()
    return { serverUrl: s.serverUrl }
  })
  ipcMain.handle('sync:set-server-url', async (_e, url: string) => {
    const normalized = await validateServerUrl(url)
    const s = setServerUrl(normalized)
    refreshStatusFromSettings()
    return { serverUrl: s.serverUrl }
  })

  ipcMain.handle('admin:list-users', async () => {
    requireRole(getCurrentUser(), STAFF_ROLES)
    try {
      const fromServer = await fetchAdminUsersFromServer()
      if (fromServer) return fromServer
    } catch {
      /* fallback to local */
    }
    return listUsersPublic()
  })
  ipcMain.handle('admin:set-role', async (_e, payload: { userId: string; role: UserRole }) => {
    const actor = getCurrentUser()
    requireRole(actor, STAFF_ROLES)
    const settings = readSettings()
    const role = parseUserRole(payload.role)

    if (settings.serverUrl.trim() && settings.authToken.trim()) {
      const online = await isServerReachable()
      if (online) {
        const data = await serverFetch<{ users: Record<string, unknown>[] }>(
          `/admin/users/${payload.userId}/role`,
          {
            method: 'PUT',
            body: JSON.stringify({ role }),
          },
        )
        return publicUsersFromServer(data.users)
      }
      const users = updateUserRole(payload.userId, role, actor)
      queueOperation({
        type: 'set_user_role',
        payload: { userId: payload.userId, role },
      })
      markOfflinePending()
      return users
    }

    const users = updateUserRole(payload.userId, role, actor)
    markLocalChange()
    await pushAccountsFile()
    return users
  })
  ipcMain.handle(
    'admin:transfer-ownership',
    async (_e, payload: { userId: string }) => {
      const actor = getCurrentUser()
      requireRole(actor, STAFF_ROLES)
      const settings = readSettings()
      const successorId = String(payload.userId ?? '').trim()

      if (settings.serverUrl.trim() && settings.authToken.trim()) {
        const online = await isServerReachable()
        if (online) {
          const data = await serverFetch<{ users: Record<string, unknown>[] }>(
            '/admin/transfer-ownership',
            {
              method: 'POST',
              body: JSON.stringify({ userId: successorId }),
            },
          )
          const users = publicUsersFromServer(data.users)
          const me = users.find((u) => u.id === actor?.id)
          if (me) cacheServerUser(me as unknown as Record<string, unknown>)
          return users
        }
        const users = transferOwnership(successorId, actor)
        queueOperation({
          type: 'transfer_ownership',
          payload: { userId: successorId },
        })
        markOfflinePending()
        return users
      }

      const users = transferOwnership(successorId, actor)
      markLocalChange()
      await pushAccountsFile()
      return users
    },
  )
  ipcMain.handle(
    'admin:update-user',
    async (
      _e,
      payload: {
        userId: string
        name: string
        password?: string
        departmentId?: WorkDepartmentId
      },
    ) => {
      const actor = getCurrentUser()
      requireRole(actor, STAFF_ROLES)
      const settings = readSettings()
      const trimmedName = payload.name.trim()
      const password = payload.password?.trim() ?? ''
      const departmentId =
        payload.departmentId !== undefined
          ? normalizeWorkDepartmentId(payload.departmentId)
          : undefined

      const localBefore = readAccounts().users.find((u) => u.id === payload.userId)
      const emailHint = localBefore?.email

      async function putUser(userId: string) {
        const body: { name: string; password?: string; departmentId?: WorkDepartmentId } = {
          name: trimmedName,
        }
        if (password) body.password = password
        if (departmentId !== undefined) body.departmentId = departmentId
        return serverFetch<{ users: Record<string, unknown>[]; whitelist?: WhitelistEntry[] }>(
          `/admin/users/${userId}`,
          {
            method: 'PUT',
            body: JSON.stringify(body),
          },
        )
      }

      if (settings.serverUrl.trim() && settings.authToken.trim()) {
        const online = await isServerReachable()
        if (online) {
          let data: { users: Record<string, unknown>[]; whitelist?: WhitelistEntry[] }
          try {
            data = await putUser(payload.userId)
          } catch (err) {
            // Local short ids may not match server UUIDs — resolve by email and retry
            if (
              err instanceof ServerApiError &&
              err.status === 404 &&
              emailHint
            ) {
              const fromServer = await fetchAdminUsersFromServer()
              const match = fromServer?.find(
                (u) => u.email.toLowerCase() === emailHint.toLowerCase(),
              )
              if (!match) throw err
              data = await putUser(match.id)
            } else {
              throw err
            }
          }

          const usersFromServer = publicUsersFromServer(data.users)
          const resolved =
            usersFromServer.find((u) => u.id === payload.userId) ??
            usersFromServer.find(
              (u) => emailHint && u.email.toLowerCase() === emailHint.toLowerCase(),
            )
          try {
            updateUserProfile(resolved?.id ?? payload.userId, {
              name: trimmedName,
              ...(password ? { password } : {}),
              ...(departmentId !== undefined ? { departmentId } : {}),
              ...(emailHint ? { email: emailHint } : {}),
            })
          } catch {
            if (emailHint && departmentId !== undefined) {
              addWhitelistEmail(emailHint, departmentId)
            }
          }
          if (Array.isArray(data.whitelist)) {
            setWhitelist(data.whitelist)
          } else if (departmentId !== undefined) {
            const email = resolved?.email ?? emailHint
            if (email) addWhitelistEmail(email, departmentId)
          }
          return { users: listUsersPublic(), whitelist: getWhitelist() }
        }

        const users = updateUserProfile(payload.userId, {
          name: trimmedName,
          ...(password ? { password } : {}),
          ...(departmentId !== undefined ? { departmentId } : {}),
        }, actor)
        queueOperation({
          type: 'update_user',
          payload: {
            userId: payload.userId,
            name: trimmedName,
            ...(password ? { password } : {}),
            ...(departmentId !== undefined ? { departmentId } : {}),
          },
        })
        markOfflinePending()
        return { users, whitelist: getWhitelist() }
      }

      const users = updateUserProfile(payload.userId, {
        name: trimmedName,
        ...(password ? { password } : {}),
        ...(departmentId !== undefined ? { departmentId } : {}),
      }, actor)
      markLocalChange()
      await pushAccountsFile()
      return { users, whitelist: getWhitelist() }
    },
  )
  ipcMain.handle(
    'admin:delete-user',
    async (_e, payload: string | { userId: string; successorId?: string }) => {
      const actor = getCurrentUser()
      requireRole(actor, STAFF_ROLES)
      const userId = typeof payload === 'string' ? payload : payload.userId
      const successorId = typeof payload === 'string' ? undefined : payload.successorId
      const settings = readSettings()

      if (settings.serverUrl.trim() && settings.authToken.trim()) {
        const online = await isServerReachable()
        if (online) {
          const data = await serverFetch<{ users: Record<string, unknown>[] }>(
            `/admin/users/${userId}`,
            {
              method: 'DELETE',
              body: JSON.stringify(successorId ? { successorId } : {}),
            },
          )
          const users = publicUsersFromServer(data.users)
          if (actor?.id === userId) {
            clearSession()
          }
          return users
        }
        const users = deleteUser(userId, successorId, actor)
        queueOperation({
          type: 'delete_user',
          payload: { userId, ...(successorId ? { successorId } : {}) },
        })
        markOfflinePending()
        return users
      }

      const users = deleteUser(userId, successorId, actor)
      markLocalChange()
      await pushAccountsFile()
      return users
    },
  )
  ipcMain.handle('admin:get-whitelist', async () => {
    requireRole(getCurrentUser(), STAFF_ROLES)
    const settings = readSettings()
    if (settings.serverUrl.trim() && settings.authToken.trim()) {
      try {
        const online = await isServerReachable()
        if (online) {
          const data = await serverFetch<{ whitelist?: WhitelistEntry[] }>('/admin/whitelist')
          const list = Array.isArray(data.whitelist) ? data.whitelist : []
          setWhitelist(list)
          return getWhitelist()
        }
      } catch {
        /* fallback local */
      }
    }
    return getWhitelist()
  })
  ipcMain.handle('admin:set-whitelist', async (_e, emails: Array<string | WhitelistEntry>) => {
    requireRole(getCurrentUser(), STAFF_ROLES)
    const list = setWhitelist(emails)
    markLocalChange()
    await pushAccountsFile()
    return list
  })
  ipcMain.handle(
    'admin:add-whitelist',
    async (_e, payload: string | { email: string; departmentId?: WorkDepartmentId }) => {
      requireRole(getCurrentUser(), STAFF_ROLES)
      const email = typeof payload === 'string' ? payload : payload.email
      const departmentId = normalizeWorkDepartmentId(
        typeof payload === 'string' ? 'support' : payload.departmentId,
      )
      const settings = readSettings()
      if (settings.serverUrl.trim() && settings.authToken.trim()) {
        const online = await isServerReachable()
        if (online) {
          const data = await serverFetch<{ whitelist: WhitelistEntry[] }>('/admin/whitelist', {
            method: 'POST',
            body: JSON.stringify({ email, departmentId }),
          })
          setWhitelist(data.whitelist)
          return data.whitelist
        }
        const list = addWhitelistEmail(email, departmentId)
        queueOperation({
          type: 'add_whitelist',
          payload: { email, departmentId },
        })
        markOfflinePending()
        return list
      }
      const list = addWhitelistEmail(email, departmentId)
      markLocalChange()
      await pushAccountsFile()
      return list
    },
  )
  ipcMain.handle('admin:remove-whitelist', async (_e, email: string) => {
    requireRole(getCurrentUser(), STAFF_ROLES)
    const settings = readSettings()
    if (settings.serverUrl.trim() && settings.authToken.trim()) {
      const online = await isServerReachable()
      if (online) {
        const data = await serverFetch<{ whitelist: WhitelistEntry[] }>(
          `/admin/whitelist/${encodeURIComponent(email)}`,
          { method: 'DELETE' },
        )
        setWhitelist(data.whitelist)
        return data.whitelist
      }
      const list = removeWhitelistEmail(email)
      queueOperation({
        type: 'remove_whitelist',
        payload: { email },
      })
      markOfflinePending()
      return list
    }
    const list = removeWhitelistEmail(email)
    markLocalChange()
    await pushAccountsFile()
    return list
  })
  ipcMain.handle('auth:registration-department', async (_e, email: string) => {
    const settings = readSettings()
    if (settings.serverUrl.trim()) {
      try {
        const online = await isServerReachable()
        if (online) {
          const data = await serverFetch<{ departmentId: WorkDepartmentId; label: string }>(
            `/auth/registration-department?email=${encodeURIComponent(email)}`,
            { skipAuth: true },
          )
          return data
        }
      } catch (err) {
        if (err instanceof ServerApiError && err.status === 404) return null
        /* fallback local */
      }
    }
    return getRegistrationDepartment(email)
  })
  ipcMain.handle('admin:get-settings', () => {
    requireRole(getCurrentUser(), STAFF_ROLES)
    const s = readSettings()
    return {
      hasPendingChanges: s.hasPendingChanges,
      hasToken: Boolean(s.authToken?.trim() || s.yandexToken?.trim()),
      hasServer: Boolean(s.serverUrl.trim()),
      serverUrl: s.serverUrl,
      ownerEmail: getOwnerEmail(),
    }
  })

  ipcMain.handle('admin:storage-stats', async () => {
    requireRole(getCurrentUser(), ['owner'])
    const settings = readSettings()
    if (!settings.serverUrl.trim()) {
      throw new Error('URL сервера не указан')
    }
    const online = await isServerReachable()
    if (!online) {
      throw new Error('Нет связи с сервером')
    }
    return serverFetch('/admin/storage-stats')
  })

  ipcMain.handle('admin:list-departments', async () => {
    requireRole(getCurrentUser(), STAFF_ROLES)
    const localList = () =>
      getDepartments()
        .filter((d) => d.id !== 'lost')
        .map((d, index) => ({
          id: d.id,
          label: d.label,
          listKey: d.listKey,
          sortOrder: (index + 1) * 10,
          systemLocked: d.id === 'templates',
        }))

    const settings = readSettings()
    if (settings.serverUrl.trim() && settings.authToken.trim()) {
      try {
        const online = await isServerReachable()
        if (online) {
          const fromServer = await fetchAdminDepartments()
          if (fromServer.length > 0) return fromServer
        }
      } catch (err) {
        appendSessionLog(
          'warn',
          'admin/departments',
          err instanceof Error ? err.message : 'Не удалось загрузить разделы с сервера',
        )
      }
    }
    return localList()
  })

  ipcMain.handle(
    'admin:create-department',
    async (_e, payload: { id: string; label: string }) => {
      requireRole(getCurrentUser(), STAFF_ROLES)
      const settings = readSettings()
      if (!settings.serverUrl.trim() || !settings.authToken.trim()) {
        throw new Error('Нужен вход на сервер с URL и токеном (не только локальный режим)')
      }
      const created = await createDepartmentOnServer(payload)
      mergeDepartmentPatch(created)
      try {
        await pullFromYandex({ force: true })
      } catch (err) {
        appendSessionLog(
          'warn',
          'admin/departments',
          `Раздел создан на сервере, но синхронизация не завершилась: ${
            err instanceof Error ? err.message : String(err)
          }`,
        )
      }
      return created
    },
  )

  ipcMain.handle(
    'admin:update-department',
    async (_e, payload: { id: string; label: string }) => {
      requireRole(getCurrentUser(), STAFF_ROLES)
      const updated = await updateDepartmentOnServer(payload.id, { label: payload.label })
      mergeDepartmentPatch(updated)
      return updated
    },
  )

  ipcMain.handle(
    'admin:create-subsection',
    async (_e, payload: { departmentId: string; label: string; party?: string | null }) => {
      requireManageTopicSections(payload.departmentId)
      const label = payload.label.trim()
      if (!label) throw new Error('Укажите название')
      const settings = readSettings()
      const localFallback = (): StoredSubsection => {
        const base = `${payload.departmentId}__${label
          .toLowerCase()
          .replace(/[^a-z0-9а-яё]+/gi, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 40) || 'part'}`
        let id = base
        const existing = readStoredSubsections()
        let n = 2
        while (existing.some((s) => s.id === id)) {
          id = `${base}_${n}`
          n += 1
        }
        const sortOrder =
          Math.max(0, ...existing.filter((s) => s.departmentId === payload.departmentId).map((s) => s.sortOrder)) +
          10
        return {
          id,
          departmentId: payload.departmentId,
          label,
          sortOrder,
          party:
            payload.departmentId === 'support' && typeof payload.party === 'string'
              ? payload.party.trim()
              : null,
        }
      }

      if (!settings.serverUrl.trim()) {
        const row = localFallback()
        mergeSubsectionPatch(row)
        markLocalChange()
        return row
      }

      let created: AdminSubsectionDto
      try {
        created = await createSubsectionOnServer(payload.departmentId, {
          label,
          party: payload.party ?? null,
        })
      } catch (err) {
        appendSessionLog(
          'warn',
          'admin/subsections',
          err instanceof Error ? err.message : 'Создание на сервере не удалось, сохранено локально',
        )
        const row = localFallback()
        mergeSubsectionPatch(row)
        markLocalChange()
        return row
      }
      const merged = mergeSubsectionPatch({
        ...created,
        party: created.party ?? payload.party ?? null,
        isArchiveLost: created.isArchiveLost ?? false,
      })
      try {
        await pullFromYandex({ force: true })
      } catch {
        /* subsection already local */
      }
      return merged.find((s) => s.id === created.id) ?? created
    },
  )

  ipcMain.handle(
    'admin:update-subsection',
    async (_e, payload: { id: string; label: string }) => {
      requireRole(getCurrentUser(), STAFF_ROLES)
      const existing = readStoredSubsections().find((s) => s.id === payload.id)
      if (existing) requireManageTopicSections(existing.departmentId)
      const updated = await updateSubsectionOnServer(payload.id, { label: payload.label })
      mergeSubsectionPatch(updated)
      return updated
    },
  )

  ipcMain.handle('admin:delete-subsection', async (_e, id: string) => {
    requireRole(getCurrentUser(), STAFF_ROLES)
    const existing = readStoredSubsections().find((s) => s.id === id)
    if (existing) requireManageTopicSections(existing.departmentId)
    if (existing?.isArchiveLost) {
      throw new Error('Системный подраздел «Потерянные» нельзя удалить')
    }
    if (existing?.isArchiveArchived) {
      throw new Error('Системный подраздел «Архивированные» нельзя удалить')
    }
    const settings = readSettings()
    if (existing?.departmentId === 'support') {
      if (settings.serverUrl.trim()) {
        await deleteSubsectionOnServer(id)
      }
      clearSupportSubsectionLocally(id)
    } else if (settings.serverUrl.trim()) {
      await deleteSubsectionOnServer(id)
    } else {
      archiveSupportTopicsLocally(
        (row) => String(row.subsection_id ?? '').trim() === id,
      )
    }
    removeSubsectionLocal(id)
    try {
      await pullFromYandex({ force: true })
    } catch {
      /* ok */
    }
    return { ok: true }
  })

  ipcMain.handle('admin:create-support-section', async (_e, payload: { label: string }) => {
    requireManageTopicSections('support')
    const label = payload.label.trim()
    if (!label) throw new Error('Укажите название раздела')
    const settings = readSettings()
    const localFallback = (): StoredSupportSection => {
      const base = label
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/gi, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40) || 'section'
      const existing = readStoredSupportSections()
      let id = base
      let n = 2
      while (existing.some((s) => s.id === id)) {
        id = `${base}_${n}`
        n += 1
      }
      const sortOrder = Math.max(0, ...existing.map((s) => s.sortOrder)) + 10
      return { id, label, sortOrder, systemLocked: false }
    }

    if (!settings.serverUrl.trim()) {
      const row = localFallback()
      mergeSupportSectionPatch(row)
      markLocalChange()
      return row
    }

    try {
      const created = await createSupportSectionOnServer({ label })
      mergeSupportSectionPatch(created)
      try {
        await pullFromYandex({ force: true })
      } catch {
        /* ok */
      }
      return created
    } catch (err) {
      appendSessionLog(
        'warn',
        'admin/support-sections',
        err instanceof Error ? err.message : 'Создание на сервере не удалось, сохранено локально',
      )
      const row = localFallback()
      mergeSupportSectionPatch(row)
      markLocalChange()
      return row
    }
  })

  ipcMain.handle(
    'admin:update-support-section',
    async (_e, payload: { id: string; label: string }) => {
      requireManageTopicSections('support')
      const updated = await updateSupportSectionOnServer(payload.id, { label: payload.label })
      mergeSupportSectionPatch(updated)
      return updated
    },
  )

  ipcMain.handle('admin:delete-support-section', async (_e, id: string) => {
    requireManageTopicSections('support')
    if (id === 'all' || id === 'archive') {
      throw new Error('Этот раздел нельзя удалить')
    }
    const settings = readSettings()
    const partyMatch = (row: Record<string, unknown>) =>
      String(row.party ?? '').trim() === id
    let deletedOnServer = false
    if (settings.serverUrl.trim()) {
      try {
        await deleteSupportSectionOnServer(id)
        deletedOnServer = true
      } catch (err) {
        const missing =
          err instanceof ServerApiError &&
          (err.status === 404 || /не найден/i.test(err.message))
        if (!missing) throw err
        appendSessionLog(
          'warn',
          'admin/support-sections',
          'Раздел не найден на сервере — удалён только локально',
        )
      }
    }
    if (!deletedOnServer) {
      archiveSupportTopicsLocally(partyMatch)
      markLocalChange()
    }
    const subs = readStoredSubsections().filter((s) => s.party === id)
    for (const sub of subs) {
      if (!sub.isArchiveLost) removeSubsectionLocal(sub.id)
    }
    removeSupportSectionLocal(id)
    try {
      await pullFromYandex({ force: true })
    } catch {
      /* ok */
    }
    return { ok: true }
  })

  ipcMain.handle('admin:delete-department', async (_e, id: string) => {
    requireRole(getCurrentUser(), STAFF_ROLES)
    const result = await deleteDepartmentOnServer(id)
    try {
      await pullFromYandex({ force: true })
    } catch (err) {
      appendSessionLog(
        'warn',
        'admin/departments',
        `Раздел удалён на сервере, но синхронизация не завершилась: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
    return result
  })

  // Token is set before login so whitelist/accounts can sync from Disk first
  ipcMain.handle('sync:set-token', (_e, token: string) => {
    const s = setYandexToken(token)
    refreshStatusFromSettings()
    void pullFromYandex()
    return { hasToken: Boolean(s.yandexToken), hasPendingChanges: s.hasPendingChanges }
  })
  ipcMain.handle('sync:get-token-masked', () => {
    const s = readSettings()
    const t = s.yandexToken
    if (!t) return { hasToken: false, masked: '' }
    const masked = t.length <= 8 ? '••••••••' : `${t.slice(0, 4)}…${t.slice(-4)}`
    return { hasToken: true, masked }
  })

  ipcMain.handle('sync:status', () => getSyncStatus())
  ipcMain.handle('sync:pull', async () => pullFromYandex())
  ipcMain.handle('sync:pull-full', async () => {
    appendSessionLog('info', 'sync', 'Полная синхронизация с сервера (темы, фото, файлы)…')
    return pullFromYandex({ force: true, clearPending: true })
  })
  ipcMain.handle('sync:discard', async () => {
    const user = getCurrentUser()
    requireRole(user, CONTENT_EDITOR_ROLES)
    return discardLocalChanges()
  })
  ipcMain.handle('sync:push', async () => {
    const user = getCurrentUser()
    requireRole(user, CONTENT_EDITOR_ROLES)
    return pushToYandex()
  })
  ipcMain.handle('sync:resolve-conflicts', async (_event, resolutions: unknown) => {
    const user = getCurrentUser()
    requireRole(user, CONTENT_EDITOR_ROLES)
    return resolveSyncConflicts(
      Array.isArray(resolutions)
        ? (resolutions as { fileName: string; id: number; choice: 'local' | 'remote' }[])
        : [],
    )
  })

  ipcMain.handle(
    'sync:lock-topic',
    async (_e, payload: { departmentId: DepartmentId; topicId: number }) => {
      try {
        requireEditDepartment(payload.departmentId)
        await lockTopic(payload.departmentId, payload.topicId)
        return { ok: true as const }
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : 'Тема редактируется другим пользователем',
        }
      }
    },
  )
  ipcMain.handle(
    'sync:unlock-topic',
    async (_e, payload: { departmentId: DepartmentId; topicId: number }) => {
      requireEditDepartment(payload.departmentId)
      await unlockTopic(payload.departmentId, payload.topicId)
      return { ok: true }
    },
  )
  ipcMain.handle(
    'sync:renew-lock',
    async (_e, payload: { departmentId: DepartmentId; topicId: number }) => {
      requireEditDepartment(payload.departmentId)
      await renewTopicLock(payload.departmentId, payload.topicId)
      return { ok: true }
    },
  )

  ipcMain.handle(
    'sync:lock-topic-order',
    async (_e, payload: { departmentId: DepartmentId }) => {
      try {
        requireEditDepartment(payload.departmentId)
        const settings = readSettings()
        if (!settings.serverUrl.trim()) return { ok: true as const }
        await lockTopicOrder(payload.departmentId)
        return { ok: true as const }
      } catch (e) {
        if (e instanceof ServerApiError && e.status === 423) {
          const body = e.body as { lockedByName?: string }
          const name = body?.lockedByName?.trim()
          return {
            ok: false as const,
            lockedByName: name,
            error: name
              ? `Порядок уже редактирует: ${name}`
              : 'Порядок уже редактируется другим пользователем',
          }
        }
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : 'Не удалось заблокировать порядок',
        }
      }
    },
  )

  ipcMain.handle(
    'sync:unlock-topic-order',
    async (_e, payload: { departmentId: DepartmentId }) => {
      requireEditDepartment(payload.departmentId)
      const settings = readSettings()
      if (!settings.serverUrl.trim()) return { ok: true }
      await unlockTopicOrder(payload.departmentId).catch(() => undefined)
      return { ok: true }
    },
  )

  ipcMain.handle(
    'sync:renew-topic-order-lock',
    async (_e, payload: { departmentId: DepartmentId }) => {
      requireEditDepartment(payload.departmentId)
      const settings = readSettings()
      if (!settings.serverUrl.trim()) return { ok: true }
      await renewTopicOrderLock(payload.departmentId)
      return { ok: true }
    },
  )

  ipcMain.handle('prepare-topic-reorder', async (_e, departmentId: DepartmentId) => {
    requireEditDepartment(departmentId)
    let guide: Record<string, unknown>
    try {
      guide = await refreshDeptTopicOrderFromServer(departmentId)
    } catch (e) {
      const dept = departmentById(departmentId)
      guide = readGuideFile(dept.fileName) as Record<string, unknown>
      return {
        ok: false as const,
        guide,
        error: e instanceof Error ? e.message : 'Не удалось загрузить порядок с сервера',
      }
    }

    const settings = readSettings()
    if (!settings.serverUrl.trim()) {
      return { ok: true as const, guide }
    }

    try {
      await lockTopicOrder(departmentId)
      return { ok: true as const, guide }
    } catch (e) {
      if (e instanceof ServerApiError && e.status === 423) {
        const body = e.body as { lockedByName?: string }
        const name = body?.lockedByName?.trim()
        return {
          ok: false as const,
          guide,
          lockedByName: name,
          error: name
            ? `Порядок уже редактирует: ${name}`
            : 'Порядок уже редактируется другим пользователем',
        }
      }
      return {
        ok: false as const,
        guide,
        error: e instanceof Error ? e.message : 'Не удалось начать редактирование порядка',
      }
    }
  })

  ipcMain.handle('load-guide', (_event, departmentId: DepartmentId) => {
    const dept = departmentById(departmentId)
    const data = readGuideFile(dept.fileName) as Record<string, unknown>
    const listKey = dept.listKey
    const list = (data[listKey] as Array<{
      id: number
      parent_id?: number | null
      has_children?: boolean
      archived?: boolean
    }>) ?? []
    const reconciled = reconcileHasChildren(list)
    const changed = reconciled.some(
      (item, index) => item.has_children !== list[index]?.has_children,
    )
    if (changed) {
      data[listKey] = reconciled
      writeGuideFile(dept.fileName, data)
    }
    return data
  })

  ipcMain.handle(
    'save-item',
    async (
      _event,
      payload: {
        departmentId: DepartmentId
        draftId?: string
        item: {
          id?: number
          question: string
          answer: string
          parent_id?: number | null
          client_topic_id?: number | null
          has_children?: boolean
          party?: SupportPartyValue
          subsection_id?: string | null
          photos?: string[]
          documents?: { file_id: string; file_name: string }[]
          image_display?: Record<string, number>
        }
      },
    ) => {
      requireEditDepartment(payload.departmentId)
      const dept = departmentById(payload.departmentId)
      const data = readGuideFile(dept.fileName) as Record<string, unknown>
      const listKey = dept.listKey
      const list = (data[listKey] as Array<Record<string, unknown>>) || []

      const maxId = list.reduce((max, item) => {
        const id = typeof item.id === 'number' ? item.id : 0
        return Math.max(max, id)
      }, 0)

      const newId = payload.item.id ?? maxId + 1
      if (payload.draftId) {
        migrateDraftImagesToTopic(payload.draftId, newId, payload.departmentId)
        migrateDraftFilesToTopic(payload.draftId, newId, payload.departmentId)
      }

      const newItem: Record<string, unknown> = {
        id: newId,
        question: payload.item.question,
        answer: payload.item.answer,
        parent_id: payload.item.parent_id ?? null,
        has_children: payload.item.has_children ?? false,
        photos: payload.item.photos ?? [],
        documents: payload.item.documents ?? [],
        ...(payload.item.image_display &&
        typeof payload.item.image_display === 'object' &&
        Object.keys(payload.item.image_display).length > 0
          ? { image_display: payload.item.image_display }
          : {}),
        ...(payload.departmentId === 'support'
          ? { party: normalizeSupportPartyId(payload.item.party) }
          : {}),
      }
      if (payload.departmentId === 'support') {
        applyClientTopicLink(
          newItem,
          normalizeSupportPartyId(payload.item.party),
          payload.item.client_topic_id,
        )
      }

      const topicParty =
        payload.departmentId === 'support'
          ? normalizeSupportPartyId(payload.item.party)
          : undefined
      const deptSubs = rootSubsectionsForTopic(payload.departmentId, topicParty)
      const pickSubMsg =
        payload.departmentId === 'support' ? 'Выберите подраздел' : 'Выберите раздел'
      if (deptSubs.length > 0 && newItem.parent_id == null) {
        const subId =
          typeof payload.item.subsection_id === 'string' ? payload.item.subsection_id.trim() : ''
        if (!subId || !deptSubs.some((s) => s.id === subId)) {
          throw new Error(pickSubMsg)
        }
        newItem.subsection_id = subId
      } else if (newItem.parent_id != null && deptSubs.length > 0) {
        const parent = list.find((item) => item.id === newItem.parent_id)
        if (parent?.subsection_id) newItem.subsection_id = parent.subsection_id
      }

      list.push(newItem)

      if (newItem.parent_id != null) {
        const parent = list.find((item) => item.id === newItem.parent_id)
        if (parent) parent.has_children = true
      }

      try {
        cleanupTopicImageOrphans(
          payload.departmentId,
          newId,
          String(newItem.answer ?? ''),
          Array.isArray(newItem.photos) ? newItem.photos : undefined,
          list as TopicMediaRow[],
        )
        cleanupTopicFileOrphans(
          payload.departmentId,
          newId,
          String(newItem.answer ?? ''),
          Array.isArray(newItem.documents) ? newItem.documents : undefined,
          list as TopicMediaRow[],
        )
      } catch (err) {
        console.error('media orphan cleanup failed', err)
      }

      data[listKey] = list
      writeGuideFile(dept.fileName, data)

      const settings = readSettings()
      if (settings.serverUrl.trim()) {
        const result = await tryPushTopicOnline('create', payload.departmentId, newItem)
        if (result.ok) return readGuideFile(dept.fileName)
        if (result.offline) {
          queueOperation({
            type: 'create_topic',
            departmentId: payload.departmentId,
            payload: newItem,
          })
          markOfflinePending()
          return data
        }
        if (result.conflict) {
          throw new Error(`Конфликт: тема уже изменена на сервере (${result.conflict.title})`)
        }
      } else {
        markLocalChange()
      }
      return data
    },
  )

  ipcMain.handle(
    'update-item',
    async (
      _event,
      payload: {
        departmentId: DepartmentId
        item: {
          id: number
          question: string
          answer: string
          parent_id?: number | null
          client_topic_id?: number | null
          has_children?: boolean
          party?: SupportPartyValue
          subsection_id?: string | null
          archived?: boolean
          photos?: string[]
          documents?: { file_id: string; file_name: string }[]
          image_display?: Record<string, number>
        }
      },
    ) => {
      requireEditDepartment(payload.departmentId)
      const dept = departmentById(payload.departmentId)
      const data = readGuideFile(dept.fileName) as Record<string, unknown>
      const listKey = dept.listKey
      const list = (data[listKey] as Array<Record<string, unknown>>) || []
      const idx = list.findIndex((item) => item.id === payload.item.id)
      if (idx < 0) throw new Error('Тема не найдена')

      const oldParentId =
        typeof list[idx].parent_id === 'number' ? (list[idx].parent_id as number) : null
      const newParentId =
        payload.item.parent_id === undefined
          ? oldParentId
          : payload.item.parent_id == null
            ? null
            : payload.item.parent_id

      if (newParentId != null) {
        if (newParentId === payload.item.id) {
          throw new Error('Тема не может быть подтемой самой себя')
        }
        const parentExists = list.some((item) => item.id === newParentId)
        if (!parentExists) throw new Error('Родительская тема не найдена')

        // Cycle check: parent cannot be a descendant of this item
        const byParent = new Map<number, number[]>()
        for (const row of list) {
          const pid = typeof row.parent_id === 'number' ? row.parent_id : null
          const id = typeof row.id === 'number' ? row.id : null
          if (pid == null || id == null) continue
          const arr = byParent.get(pid) ?? []
          arr.push(id)
          byParent.set(pid, arr)
        }
        const stack = [...(byParent.get(payload.item.id) ?? [])]
        const descendants = new Set<number>()
        while (stack.length) {
          const id = stack.pop()!
          if (descendants.has(id)) continue
          descendants.add(id)
          for (const child of byParent.get(id) ?? []) stack.push(child)
        }
        if (descendants.has(newParentId)) {
          throw new Error('Нельзя переместить тему внутрь её собственной подтемы')
        }
      }

      const topicParty =
        payload.departmentId === 'support'
          ? normalizeSupportPartyId(payload.item.party, normalizeSupportPartyId(list[idx].party))
          : undefined
      const deptSubs = rootSubsectionsForTopic(payload.departmentId, topicParty)
      const pickSubMsg =
        payload.departmentId === 'support' ? 'Выберите подраздел' : 'Выберите раздел'
      let nextSubsectionId: string | undefined
      if (deptSubs.length > 0) {
        if (newParentId == null) {
          const subId =
            payload.item.subsection_id !== undefined
              ? String(payload.item.subsection_id ?? '').trim()
              : String(list[idx].subsection_id ?? '').trim()
          if (!subId || !deptSubs.some((s) => s.id === subId)) {
            throw new Error(pickSubMsg)
          }
          nextSubsectionId = subId
        } else {
          const parent = list.find((item) => item.id === newParentId)
          if (typeof parent?.subsection_id === 'string' && parent.subsection_id.trim()) {
            nextSubsectionId = parent.subsection_id.trim()
          }
        }
      } else if (payload.item.subsection_id) {
        nextSubsectionId = String(payload.item.subsection_id).trim()
      }

      list[idx] = {
        ...list[idx],
        question: payload.item.question,
        answer: payload.item.answer,
        parent_id: newParentId,
        has_children: payload.item.has_children ?? list[idx].has_children ?? false,
        photos: payload.item.photos ?? list[idx].photos ?? [],
        documents: payload.item.documents ?? list[idx].documents ?? [],
        ...(payload.departmentId === 'support'
          ? {
              party: normalizeSupportPartyId(payload.item.party, normalizeSupportPartyId(list[idx].party)),
            }
          : {}),
      }
      if (nextSubsectionId) list[idx].subsection_id = nextSubsectionId
      else if (deptSubs.length > 0 && newParentId != null && !list[idx].subsection_id) {
        delete list[idx].subsection_id
      }
      if (payload.departmentId === 'support') {
        applyClientTopicLink(
          list[idx],
          normalizeSupportPartyId(payload.item.party, normalizeSupportPartyId(list[idx].party)),
          payload.item.client_topic_id,
        )
      }

      const oldArchived = Boolean(list[idx].archived)
      const nextArchived =
        payload.item.archived !== undefined ? Boolean(payload.item.archived) : oldArchived
      if (payload.departmentId === 'support') {
        ensureArchiveArchivedSubsectionLocal()
        ensureArchiveLostSubsectionLocal()
        applySupportArchiveSubsectionToRow(list[idx], nextArchived, oldArchived)
      } else if (nextArchived) {
        list[idx].archived = true
      } else {
        delete list[idx].archived
      }

      function collectDescendants(rootId: number): number[] {
        const byParent = new Map<number, number[]>()
        for (const row of list) {
          const pid = typeof row.parent_id === 'number' ? row.parent_id : null
          const id = typeof row.id === 'number' ? row.id : null
          if (pid == null || id == null) continue
          const arr = byParent.get(pid) ?? []
          arr.push(id)
          byParent.set(pid, arr)
        }
        const stack = [...(byParent.get(rootId) ?? [])]
        const seen = new Set<number>()
        while (stack.length) {
          const id = stack.pop()!
          if (seen.has(id)) continue
          seen.add(id)
          for (const child of byParent.get(id) ?? []) stack.push(child)
        }
        return [...seen]
      }

      if (nextArchived !== oldArchived) {
        for (const id of collectDescendants(payload.item.id)) {
          const row = list.find((r) => r.id === id)
          if (!row) continue
          if (payload.departmentId === 'support') {
            applySupportArchiveSubsectionToRow(row, nextArchived, oldArchived)
          } else if (nextArchived) {
            row.archived = true
          } else {
            delete row.archived
          }
        }
      }

      if (payload.item.image_display !== undefined) {
        const map = payload.item.image_display
        if (map && typeof map === 'object' && Object.keys(map).length > 0) {
          list[idx].image_display = map
        } else {
          delete list[idx].image_display
        }
      }

      const reconciled = reconcileHasChildren(
        list as Array<{
          id: number
          parent_id?: number | null
          has_children?: boolean
          archived?: boolean
        }>,
      )
      data[listKey] = reconciled

      const savedItem = list[idx]

      try {
        await ensureTopicMediaDownloaded(
          payload.departmentId,
          savedItem as Record<string, unknown>,
        )
      } catch (err) {
        console.error('ensure topic media before save failed', err)
      }

      try {
        cleanupTopicImageOrphans(
          payload.departmentId,
          payload.item.id,
          String(savedItem.answer ?? ''),
          Array.isArray(savedItem.photos) ? savedItem.photos : undefined,
          list as TopicMediaRow[],
        )
        cleanupTopicFileOrphans(
          payload.departmentId,
          payload.item.id,
          String(savedItem.answer ?? ''),
          Array.isArray(savedItem.documents) ? savedItem.documents : undefined,
          list as TopicMediaRow[],
        )
      } catch (err) {
        console.error('media orphan cleanup failed', err)
      }

      writeGuideFile(dept.fileName, data)

      const settings = readSettings()
      if (settings.serverUrl.trim()) {
        const result = await tryPushTopicOnline(
          'update',
          payload.departmentId,
          savedItem as Record<string, unknown>,
        )
        if (result.ok) return readGuideFile(dept.fileName)
        if (result.offline) {
          queueOperation({
            type: 'update_topic',
            departmentId: payload.departmentId,
            payload: list[idx] as Record<string, unknown>,
          })
          markOfflinePending()
          return data
        }
        if (result.conflict) {
          throw new Error(`Конфликт: тема уже изменена на сервере (${result.conflict.title})`)
        }
      } else {
        markLocalChange()
      }
      return data
    },
  )

  ipcMain.handle(
    'reorder-topics',
    async (
      _event,
      payload: {
        departmentId: DepartmentId
        items: Array<{ id: number; sort_index: number }>
      },
    ) => {
      requireEditDepartment(payload.departmentId)
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        throw new Error('Некорректный порядок тем')
      }

      const dept = departmentById(payload.departmentId)
      const data = readGuideFile(dept.fileName) as Record<string, unknown>
      const listKey = dept.listKey
      const list = (data[listKey] as Array<Record<string, unknown>>) || []
      const indexById = new Map(payload.items.map((entry) => [entry.id, entry.sort_index]))

      for (const item of list) {
        const id = item.id as number
        const sortIndex = indexById.get(id)
        if (sortIndex === undefined) continue
        item.sort_index = sortIndex
      }

      data[listKey] = list

      const settings = readSettings()
      if (settings.serverUrl.trim()) {
        try {
          const result = await tryPushReorderOnline(payload.departmentId, payload.items)
          if (!result.ok) {
            throw new Error('Нет связи с сервером. Порядок не сохранён на сервере.')
          }
        } catch (err) {
          console.error('reorder-topics push failed', err)
          if (err instanceof ServerApiError && err.status === 423) {
            throw new Error(err.message || 'Порядок тем редактируется другим пользователем')
          }
          if (err instanceof Error) throw err
          throw new Error('Не удалось сохранить порядок на сервере')
        }
      } else {
        markLocalChange()
      }

      writeGuideFile(dept.fileName, data)
      return data
    },
  )

  ipcMain.handle(
    'delete-item',
    async (
      _event,
      payload: {
        departmentId: DepartmentId
        id: number
      },
    ) => {
      requireRole(getCurrentUser(), STAFF_ROLES)
      const dept = departmentById(payload.departmentId)
      const data = readGuideFile(dept.fileName) as Record<string, unknown>
      const listKey = dept.listKey
      const list = (data[listKey] as Array<Record<string, unknown>>) || []
      const target = list.find((item) => item.id === payload.id)
      if (!target) throw new Error('Тема не найдена')

      const toRemove = new Set<number>()
      const collect = (id: number) => {
        toRemove.add(id)
        for (const item of list) {
          if (item.parent_id === id && typeof item.id === 'number') {
            collect(item.id)
          }
        }
      }
      collect(payload.id)

      const next = list.filter((item) => typeof item.id !== 'number' || !toRemove.has(item.id))

      data[listKey] = reconcileHasChildren(
        next as Array<{
          id: number
          parent_id?: number | null
          has_children?: boolean
          archived?: boolean
        }>,
      )
      writeGuideFile(dept.fileName, data)
      removeLocalTopicMedia(payload.departmentId, [...toRemove])

      const settings = readSettings()
      if (settings.serverUrl.trim()) {
        const result = await tryPushTopicOnline('delete', payload.departmentId, {
          id: payload.id,
        })
        if (result.ok) return readGuideFile(dept.fileName)
        if (result.offline) {
          queueOperation({
            type: 'delete_topic',
            departmentId: payload.departmentId,
            payload: { id: payload.id },
          })
          markOfflinePending()
          return data
        }
      } else {
        markLocalChange()
      }
      return data
    },
  )

  function resolveImageOwner(payload: {
    topicId?: number
    draftId?: string
    departmentId?: DepartmentId
  }): ImageOwner {
    const departmentId = normalizeMediaDepartmentId(payload.departmentId)
    if (typeof payload.topicId === 'number' && Number.isFinite(payload.topicId)) {
      return { kind: 'topic', topicId: payload.topicId, departmentId }
    }
    if (payload.draftId && String(payload.draftId).trim()) {
      return { kind: 'draft', draftId: String(payload.draftId).trim(), departmentId }
    }
    throw new Error('Укажите topicId или draftId')
  }

  ipcMain.handle(
    'save-topic-image',
    async (
      event,
      payload: { topicId?: number; draftId?: string; departmentId?: DepartmentId },
    ) => {
      requireEditDepartment(normalizeMediaDepartmentId(payload.departmentId))
      const owner = resolveImageOwner(payload ?? {})
      const win = BrowserWindow.fromWebContents(event.sender)
      const options = {
        title: 'Выберите фото',
        properties: ['openFile' as const],
        filters: [
          { name: 'Изображения', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] },
        ],
      }
      const result = win
        ? await dialog.showOpenDialog(win, options)
        : await dialog.showOpenDialog(options)

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      return saveImageFileForOwner(owner, result.filePaths[0])
    },
  )

  ipcMain.handle(
    'save-topic-image-clipboard',
    (_event, payload: { topicId?: number; draftId?: string; departmentId?: DepartmentId }) => {
      requireEditDepartment(normalizeMediaDepartmentId(payload.departmentId))
      const owner = resolveImageOwner(payload ?? {})
      const image = clipboard.readImage()
      return saveNativeImageForOwner(owner, image)
    },
  )

  ipcMain.handle(
    'save-topic-file',
    async (
      event,
      payload: { topicId?: number; draftId?: string; departmentId?: DepartmentId },
    ) => {
      requireEditDepartment(normalizeMediaDepartmentId(payload.departmentId))
      const owner = resolveImageOwner(payload ?? {})
      const win = BrowserWindow.fromWebContents(event.sender)
      const options = {
        title: 'Выберите файл (до 10 МБ)',
        properties: ['openFile' as const],
        filters: [
          {
            name: 'Документы',
            extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv', 'odt', 'ods'],
          },
          { name: 'Архивы', extensions: ['zip', 'rar', '7z'] },
          { name: 'Все файлы', extensions: ['*'] },
        ],
      }
      const result = win
        ? await dialog.showOpenDialog(win, options)
        : await dialog.showOpenDialog(options)

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      return saveFileForOwner(owner, result.filePaths[0])
    },
  )

  // Legacy flat media pick — keep for compatibility; prefer save-topic-image
  ipcMain.handle('pick-and-save-image', async (event) => {
    requireEditDepartment('support')
    const win = BrowserWindow.fromWebContents(event.sender)
    const options = {
      title: 'Выберите фото',
      properties: ['openFile' as const],
      filters: [
        { name: 'Изображения', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] },
      ],
    }
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const sourcePath = result.filePaths[0]
    const ext = path.extname(sourcePath).toLowerCase() || '.jpg'
    const fileName = `${randomUUID()}${ext}`
    const destDir = path.join(getMediaDir(), 'support')
    fs.mkdirSync(destDir, { recursive: true })
    const destPath = path.join(destDir, fileName)
    fs.copyFileSync(sourcePath, destPath)
    const markdownPath = `media/support/${fileName}`
    queueMediaUpload(markdownPath)
    return {
      markdownPath,
      url: `spravochnik://${markdownPath}`,
    }
  })

  ipcMain.handle(
    'resolve-image-storage-ref',
    (
      _event,
      payload: { departmentId: DepartmentId; ref: string; contextTopicId: number },
    ) => {
      const dept = departmentById(payload.departmentId)
      const data = readGuideFile(dept.fileName) as Record<string, unknown>
      const list = (data[dept.listKey] as TopicMediaRow[]) ?? []
      return resolveImageStorageRef(
        payload.departmentId,
        payload.ref,
        payload.contextTopicId,
        list,
      )
    },
  )

  ipcMain.handle(
    'ensure-topic-media',
    async (
      _event,
      payload: { departmentId: DepartmentId; topic: Record<string, unknown> },
    ) => {
      await ensureTopicMediaDownloaded(payload.departmentId, payload.topic)
    },
  )

  ipcMain.handle(
    'ensure-media-files',
    async (
      _event,
      payload: { departmentId: DepartmentId; relativePaths: string[] },
    ) => {
      await ensureMediaFilesDownloaded(payload.departmentId, payload.relativePaths ?? [])
    },
  )

  ipcMain.handle(
    'resolve-media-url',
    (_event, relativePath: string, topicId?: number, departmentId?: DepartmentId) => {
    const cleaned = relativePath.replace(/^\/+/, '').replace(/\\/g, '/')
    const dept = normalizeMediaDepartmentId(departmentId)
    if (
      (cleaned.startsWith('images/') || cleaned.startsWith('files/')) &&
      typeof topicId === 'number'
    ) {
      return `spravochnik://media/${dept}/${topicId}/${cleaned}`
    }
    if (cleaned.startsWith('media/')) {
      return `spravochnik://${cleaned}`
    }
    return ''
  },
  )

  ipcMain.handle('media:download', (_event, resolvedSrc: string, suggestedName?: string) =>
    downloadMediaImage(resolvedSrc, suggestedName),
  )

  ipcMain.handle('media:open', async (_event, resolvedSrc: string) => {
    if (!resolvedSrc || typeof resolvedSrc !== 'string') {
      return { ok: false, error: 'Пустой адрес файла' }
    }
    try {
      const url = new URL(resolvedSrc)
      const relative = path.posix.join(url.hostname, url.pathname.replace(/^\/+/, ''))
      if (!relative.startsWith('media/')) {
        return { ok: false, error: 'Недопустимый путь' }
      }
      const filePath = resolveExistingMediaAbsolutePath(relative)
      if (!filePath) {
        return { ok: false, error: 'Файл не найден' }
      }
      const err = await shell.openPath(filePath)
      if (err) return { ok: false, error: err }
      return { ok: true }
    } catch {
      return { ok: false, error: 'Не удалось открыть файл' }
    }
  })

  ipcMain.handle('updates:status', () => getUpdateStatus())
  ipcMain.handle('updates:check', () => checkForUpdates())
  ipcMain.handle('updates:download', () => downloadUpdate())
  ipcMain.handle('updates:install', async () => {
    const sync = getSyncStatus()
    if (sync.hasPendingChanges) {
      return {
        ok: false,
        error: 'Сначала синхронизируйте локальные изменения',
      } as const
    }
    return installUpdate()
  })
  ipcMain.handle('updates:latest', () => fetchLatestRelease())
  ipcMain.handle('updates:download-latest', () => downloadLatestRelease())

  // Forward sync status to all windows
  onSyncStatus((status) => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('sync:status-changed', status)
    }
  })

  onUpdateStatus((info) => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('updates:status-changed', info)
    }
  })

  ipcMain.handle('app:focus-window', () => {
    const win =
      BrowserWindow.getFocusedWindow() ??
      BrowserWindow.getAllWindows().find((w) => !w.isDestroyed())
    if (!win) return false
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
    win.webContents.focus()
    return true
  })

  function cacheSupportPhones(phones: unknown) {
    const normalized = normalizeSupportPhones(phones)
    const s = readSettings()
    writeSettings({ ...s, supportPhones: normalized })
    return normalized
  }

  function broadcastSupportPhonesChanged(): void {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('support-phones:changed')
    }
  }

  ipcMain.handle('support-phones:get', async () => {
    const settings = readSettings()
    if (settings.serverUrl.trim() && settings.authToken.trim() && (await isServerReachable())) {
      try {
        const phones = await fetchSupportPhones()
        return cacheSupportPhones(phones)
      } catch {
        /* use local cache */
      }
    }
    return normalizeSupportPhones(settings.supportPhones)
  })

  ipcMain.handle('support-phones:set', async (_event, payload: { phones: unknown }) => {
    requireRole(getCurrentUser(), STAFF_ROLES)
    let phones = normalizeSupportPhones(payload.phones)
    const settings = readSettings()
    if (settings.serverUrl.trim() && settings.authToken.trim()) {
      const online = await isServerReachable()
      if (!online) {
        throw new Error('Нет связи с сервером — телефоны не сохранены')
      }
      phones = await saveSupportPhonesOnServer(phones)
    }
    cacheSupportPhones(phones)
    broadcastSupportPhonesChanged()
    return phones
  })

  ipcMain.handle('session-log:get', () => getSessionLogs())
  ipcMain.handle('session-log:clear', () => {
    clearSessionLogs()
    return getSessionLogs()
  })

  onSessionLog(() => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('session-log:changed')
    }
  })
}

app.whenReady().then(() => {
  ensureDataReady()
  clearEphemeralSessionOnStartup()
  showSyncLoadingIfOnline()
  appendSessionLog('info', 'app', `Запуск REST INFO ${app.getVersion()}`)

  protocol.handle('spravochnik', (request) => {
    try {
      const url = new URL(request.url)
      const relative = path.posix.join(url.hostname, url.pathname.replace(/^\/+/, ''))
      if (!relative.startsWith('media/')) {
        return new Response('Not found', { status: 404 })
      }
      const filePath = resolveExistingMediaAbsolutePath(relative)
      if (!filePath) {
        return new Response('Not found', { status: 404 })
      }
      return net.fetch(pathToFileURL(filePath).toString())
    } catch {
      return new Response('Bad request', { status: 400 })
    }
  })

  registerIpc()
  createWindow()

  // Background sync after UI is up
  setTimeout(() => {
    void pullFromYandex()
  }, 800)

  setInterval(() => {
    void peekAndPullRemoteChanges()
  }, 60_000)

  app.on('browser-window-focus', () => {
    void peekAndPullRemoteChanges()
  })

  startUpdateCheckInterval()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
