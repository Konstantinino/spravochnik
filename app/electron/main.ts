import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  protocol,
  net,
  shell,
} from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'
import {
  DATA_FILES,
  DEPARTMENTS,
  departmentById,
  getMediaDir,
  getSeedDataDir,
  getUserDataRoot,
  isWorkDepartmentId,
  normalizeWorkDepartmentId,
  parseUserRole,
  STAFF_ROLES,
  CONTENT_EDITOR_ROLES,
  type DepartmentId,
  type UserRole,
  type WorkDepartmentId,
} from './paths'
import {
  cleanupTopicFileOrphans,
  cleanupTopicImageOrphans,
  migrateDraftFilesToTopic,
  migrateDraftImagesToTopic,
  saveFileForOwner,
  saveImageFileForOwner,
  saveNativeImageForOwner,
  type ImageOwner,
} from './topic-media'
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
  registerUser,
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
  pullFromYandex,
  pushAccountsFile,
  pushToYandex,
  refreshStatusFromSettings,
  resolveSyncConflicts,
  tryPushTopicOnline,
} from './sync-backend'
import { queueOperation } from './pending-operations'
import {
  isServerReachable,
  lockTopic,
  unlockTopic,
  renewTopicLock,
  serverFetch,
  serverLogin,
  serverRegister,
  ServerApiError,
} from './server-api'
import {
  checkForUpdates,
  downloadLatestRelease,
  downloadUpdate,
  ensureLocalUpdateManifest,
  fetchLatestRelease,
  getUpdateStatus,
  onUpdateStatus,
} from './updates'
import { downloadMediaImage } from './media-download'

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

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
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

  win.setMenuBarVisibility(false)
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
    DEPARTMENTS.map(({ id, label, fileName }) => ({ id, label, fileName })),
  )

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
  ipcMain.handle('sync:set-server-url', (_e, url: string) => {
    const s = setServerUrl(url)
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
        requireRole(getCurrentUser(), CONTENT_EDITOR_ROLES)
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
      requireRole(getCurrentUser(), CONTENT_EDITOR_ROLES)
      await unlockTopic(payload.departmentId, payload.topicId)
      return { ok: true }
    },
  )
  ipcMain.handle(
    'sync:renew-lock',
    async (_e, payload: { departmentId: DepartmentId; topicId: number }) => {
      requireRole(getCurrentUser(), CONTENT_EDITOR_ROLES)
      await renewTopicLock(payload.departmentId, payload.topicId)
      return { ok: true }
    },
  )

  ipcMain.handle('load-guide', (_event, departmentId: DepartmentId) => {
    const dept = departmentById(departmentId)
    return readGuideFile(dept.fileName)
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
          has_children?: boolean
          party?: 'supplier' | 'customer'
          photos?: string[]
          documents?: { file_id: string; file_name: string }[]
          image_display?: Record<string, number>
        }
      },
    ) => {
      requireRole(getCurrentUser(), CONTENT_EDITOR_ROLES)
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
        migrateDraftImagesToTopic(payload.draftId, newId)
        migrateDraftFilesToTopic(payload.draftId, newId)
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
          ? {
              party:
                payload.item.party === 'customer' || payload.item.party === 'supplier'
                  ? payload.item.party
                  : 'supplier',
            }
          : {}),
      }

      list.push(newItem)

      if (newItem.parent_id != null) {
        const parent = list.find((item) => item.id === newItem.parent_id)
        if (parent) parent.has_children = true
      }

      try {
        cleanupTopicImageOrphans(newId, String(newItem.answer ?? ''))
        cleanupTopicFileOrphans(newId, String(newItem.answer ?? ''))
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
          has_children?: boolean
          party?: 'supplier' | 'customer'
          archived?: boolean
          photos?: string[]
          documents?: { file_id: string; file_name: string }[]
          image_display?: Record<string, number>
        }
      },
    ) => {
      requireRole(getCurrentUser(), CONTENT_EDITOR_ROLES)
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
              party:
                payload.item.party === 'customer' || payload.item.party === 'supplier'
                  ? payload.item.party
                  : list[idx].party === 'customer'
                    ? 'customer'
                    : 'supplier',
            }
          : {}),
      }

      const oldArchived = Boolean(list[idx].archived)
      const nextArchived =
        payload.item.archived !== undefined ? Boolean(payload.item.archived) : oldArchived
      if (nextArchived) {
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
          if (nextArchived) row.archived = true
          else delete row.archived
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

      // Refresh has_children for all items after possible reparent
      for (const row of list) {
        const id = row.id
        if (typeof id !== 'number') continue
        row.has_children = list.some((child) => child.parent_id === id)
      }

      try {
        cleanupTopicImageOrphans(payload.item.id, String(payload.item.answer ?? ''))
        cleanupTopicFileOrphans(payload.item.id, String(payload.item.answer ?? ''))
      } catch (err) {
        console.error('media orphan cleanup failed', err)
      }

      data[listKey] = list
      writeGuideFile(dept.fileName, data)

      const settings = readSettings()
      if (settings.serverUrl.trim()) {
        const result = await tryPushTopicOnline(
          'update',
          payload.departmentId,
          list[idx] as Record<string, unknown>,
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

      const parentId = target.parent_id
      const next = list.filter((item) => typeof item.id !== 'number' || !toRemove.has(item.id))

      if (parentId != null) {
        const parent = next.find((item) => item.id === parentId)
        if (parent) {
          const stillHasChildren = next.some((item) => item.parent_id === parentId)
          parent.has_children = stillHasChildren
        }
      }

      data[listKey] = next
      writeGuideFile(dept.fileName, data)

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
  }): ImageOwner {
    if (typeof payload.topicId === 'number' && Number.isFinite(payload.topicId)) {
      return { kind: 'topic', topicId: payload.topicId }
    }
    if (payload.draftId && String(payload.draftId).trim()) {
      return { kind: 'draft', draftId: String(payload.draftId).trim() }
    }
    throw new Error('Укажите topicId или draftId')
  }

  ipcMain.handle(
    'save-topic-image',
    async (
      event,
      payload: { topicId?: number; draftId?: string },
    ) => {
      requireRole(getCurrentUser(), CONTENT_EDITOR_ROLES)
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
    (_event, payload: { topicId?: number; draftId?: string }) => {
      requireRole(getCurrentUser(), CONTENT_EDITOR_ROLES)
      const owner = resolveImageOwner(payload ?? {})
      const image = clipboard.readImage()
      return saveNativeImageForOwner(owner, image)
    },
  )

  ipcMain.handle(
    'save-topic-file',
    async (
      event,
      payload: { topicId?: number; draftId?: string },
    ) => {
      requireRole(getCurrentUser(), CONTENT_EDITOR_ROLES)
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
    requireRole(getCurrentUser(), CONTENT_EDITOR_ROLES)
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
    const destPath = path.join(getMediaDir(), fileName)
    fs.copyFileSync(sourcePath, destPath)

    const markdownPath = `media/${fileName}`
    return {
      markdownPath,
      url: `spravochnik://media/${fileName}`,
    }
  })

  ipcMain.handle('resolve-media-url', (_event, relativePath: string, topicId?: number) => {
    const cleaned = relativePath.replace(/^\/+/, '').replace(/\\/g, '/')
    if (
      (cleaned.startsWith('images/') || cleaned.startsWith('files/')) &&
      typeof topicId === 'number'
    ) {
      return `spravochnik://media/${topicId}/${cleaned}`
    }
    if (cleaned.startsWith('media/')) {
      return `spravochnik://${cleaned}`
    }
    return ''
  })

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
      const filePath = path.join(getUserDataRoot(), ...relative.split('/'))
      if (!fs.existsSync(filePath)) {
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
}

app.whenReady().then(() => {
  ensureDataReady()
  clearEphemeralSessionOnStartup()
  refreshStatusFromSettings()

  protocol.handle('spravochnik', (request) => {
    try {
      const url = new URL(request.url)
      const relative = path.posix.join(url.hostname, url.pathname.replace(/^\/+/, ''))
      if (!relative.startsWith('media/')) {
        return new Response('Not found', { status: 404 })
      }
      const filePath = path.join(getUserDataRoot(), ...relative.split('/'))
      if (!fs.existsSync(filePath)) {
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

  // Check GitHub Releases for a newer Setup (packaged builds only)
  setTimeout(() => {
    void checkForUpdates()
  }, 2000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
