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
  BOOTSTRAP_ADMIN_EMAIL,
  type DepartmentId,
  type UserRole,
} from './paths'
import {
  cleanupTopicImageOrphans,
  migrateDraftImagesToTopic,
  saveImageFileForOwner,
  saveNativeImageForOwner,
  type ImageOwner,
} from './topic-media'
import {
  addWhitelistEmail,
  clearSession,
  ensureAuthFiles,
  getCurrentUser,
  getWhitelist,
  listUsersPublic,
  loginUser,
  readSettings,
  registerUser,
  removeWhitelistEmail,
  requireRole,
  setWhitelist,
  setYandexToken,
  updateUserRole,
  deleteUser,
  updateUserCredentials,
  writeSession,
  clearEphemeralSessionOnStartup,
} from './auth-store'
import {
  discardLocalChanges,
  getSyncStatus,
  markLocalChange,
  onSyncStatus,
  pullFromYandex,
  pushAccountsFile,
  pushToYandex,
  refreshStatusFromSettings,
  resolveSyncConflicts,
} from './yandex-sync'
import {
  checkForUpdates,
  downloadUpdate,
  ensureLocalUpdateManifest,
  getUpdateStatus,
  onUpdateStatus,
} from './updates'

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

function readGuideFile(fileName: string): unknown {
  const filePath = path.join(getUserDataRoot(), fileName)
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw)
}

function writeGuideFile(fileName: string, data: unknown): void {
  const filePath = path.join(getUserDataRoot(), fileName)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

let inAppBrowser: BrowserWindow | null = null

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

function openInAppBrowser(url: string): void {
  if (!isHttpUrl(url)) return

  if (inAppBrowser && !inAppBrowser.isDestroyed()) {
    inAppBrowser.focus()
    void inAppBrowser.loadURL(url)
    return
  }

  inAppBrowser = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    title: 'REST INFO',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  inAppBrowser.setMenuBarVisibility(false)
  inAppBrowser.on('closed', () => {
    inAppBrowser = null
  })
  void inAppBrowser.loadURL(url)
}

function windowStatePath(): string {
  return path.join(getUserDataRoot(), 'window-state.json')
}

function loadWindowState(): {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized?: boolean
} {
  const defaults = { width: 1200, height: 800 }
  try {
    if (!fs.existsSync(windowStatePath())) return defaults
    const raw = JSON.parse(fs.readFileSync(windowStatePath(), 'utf8')) as Record<
      string,
      unknown
    >
    const width =
      typeof raw.width === 'number' && raw.width >= 1000 ? raw.width : defaults.width
    const height =
      typeof raw.height === 'number' && raw.height >= 700 ? raw.height : defaults.height
    return {
      width,
      height,
      x: typeof raw.x === 'number' ? raw.x : undefined,
      y: typeof raw.y === 'number' ? raw.y : undefined,
      isMaximized: Boolean(raw.isMaximized),
    }
  } catch {
    return defaults
  }
}

function saveWindowState(win: BrowserWindow): void {
  try {
    const isMaximized = win.isMaximized()
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds()
    fs.writeFileSync(
      windowStatePath(),
      JSON.stringify(
        {
          width: bounds.width,
          height: bounds.height,
          x: bounds.x,
          y: bounds.y,
          isMaximized,
        },
        null,
        2,
      ),
      'utf8',
    )
  } catch {
    /* ignore */
  }
}

function createWindow(): void {
  Menu.setApplicationMenu(null)

  const state = loadWindowState()
  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
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
  if (state.isMaximized) win.maximize()
  win.once('ready-to-show', () => win.show())

  let saveTimer: ReturnType<typeof setTimeout> | null = null
  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveWindowState(win), 400)
  }
  win.on('resize', scheduleSave)
  win.on('move', scheduleSave)
  win.on('close', () => saveWindowState(win))

  const appOrigins = new Set<string>()
  const devServer = process.env.VITE_DEV_SERVER_URL
  if (devServer) {
    try {
      appOrigins.add(new URL(devServer).origin)
    } catch {
      /* ignore */
    }
  }

  function isAppNavigation(url: string): boolean {
    if (url.startsWith('file:')) return true
    if (url.startsWith('spravochnik:')) return true
    try {
      const origin = new URL(url).origin
      return appOrigins.has(origin)
    } catch {
      return false
    }
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) {
      openInAppBrowser(url)
    }
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (isAppNavigation(url)) return
    event.preventDefault()
    if (isHttpUrl(url)) openInAppBrowser(url)
  })

  win.webContents.on('context-menu', (_event, params) => {
    const linkURL = params.linkURL?.trim()
    if (!linkURL || !isHttpUrl(linkURL)) return

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

  if (devServer) {
    win.loadURL(devServer)
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
      const s = readSettings()
      if (s.yandexToken.trim()) {
        await pullFromYandex()
      }
      return loginUser(payload)
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
      const user = registerUser(payload)
      writeSession(user.id, Boolean(payload.rememberMe))
      // Accounts-only push — do not mark guide pending
      await pushAccountsFile()
      return user
    },
  )
  ipcMain.handle('auth:logout', () => {
    clearSession()
    return null
  })
  ipcMain.handle('sync:has-token', () => {
    const s = readSettings()
    return { hasToken: Boolean(s.yandexToken.trim()) }
  })

  ipcMain.handle('admin:list-users', () => {
    requireRole(getCurrentUser(), ['admin'])
    return listUsersPublic()
  })
  ipcMain.handle('admin:set-role', async (_e, payload: { userId: string; role: UserRole }) => {
    requireRole(getCurrentUser(), ['admin'])
    const users = updateUserRole(payload.userId, payload.role)
    await pushAccountsFile()
    return users
  })
  ipcMain.handle('admin:delete-user', async (_e, userId: string) => {
    requireRole(getCurrentUser(), ['admin'])
    const users = deleteUser(userId)
    await pushAccountsFile()
    return users
  })
  ipcMain.handle(
    'admin:update-user',
    async (_e, payload: { userId: string; email: string; password?: string }) => {
      requireRole(getCurrentUser(), ['admin'])
      const users = updateUserCredentials(payload.userId, {
        email: payload.email,
        password: payload.password,
      })
      await pushAccountsFile()
      return users
    },
  )
  ipcMain.handle('admin:get-whitelist', () => {
    requireRole(getCurrentUser(), ['admin'])
    return getWhitelist()
  })
  ipcMain.handle('admin:set-whitelist', async (_e, emails: string[]) => {
    requireRole(getCurrentUser(), ['admin'])
    const list = setWhitelist(emails)
    await pushAccountsFile()
    return list
  })
  ipcMain.handle('admin:add-whitelist', async (_e, email: string) => {
    requireRole(getCurrentUser(), ['admin'])
    const list = addWhitelistEmail(email)
    await pushAccountsFile()
    return list
  })
  ipcMain.handle('admin:remove-whitelist', async (_e, email: string) => {
    requireRole(getCurrentUser(), ['admin'])
    const list = removeWhitelistEmail(email)
    await pushAccountsFile()
    return list
  })
  ipcMain.handle('admin:get-settings', () => {
    requireRole(getCurrentUser(), ['admin'])
    const s = readSettings()
    return {
      hasPendingChanges: s.hasPendingChanges,
      hasToken: Boolean(s.yandexToken),
      ownerEmail: BOOTSTRAP_ADMIN_EMAIL,
    }
  })

  // Token is set before login so whitelist/accounts can sync from Disk first
  ipcMain.handle('sync:set-token', async (_e, token: string) => {
    const s = setYandexToken(token)
    refreshStatusFromSettings()
    await pullFromYandex()
    return { hasToken: Boolean(s.yandexToken), hasPendingChanges: readSettings().hasPendingChanges }
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
    requireRole(user, ['editor', 'admin'])
    return discardLocalChanges()
  })
  ipcMain.handle('sync:push', async () => {
    const user = getCurrentUser()
    requireRole(user, ['editor', 'admin'])
    return pushToYandex()
  })
  ipcMain.handle('sync:resolve-conflicts', async (_event, resolutions: unknown) => {
    const user = getCurrentUser()
    requireRole(user, ['editor', 'admin'])
    return resolveSyncConflicts(
      Array.isArray(resolutions)
        ? (resolutions as { fileName: string; id: number; choice: 'local' | 'remote' }[])
        : [],
    )
  })

  ipcMain.handle('load-guide', (_event, departmentId: DepartmentId) => {
    const dept = departmentById(departmentId)
    return readGuideFile(dept.fileName)
  })

  ipcMain.handle(
    'save-item',
    (
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
      requireRole(getCurrentUser(), ['editor', 'admin'])
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
      }

      const newItem = {
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

      cleanupTopicImageOrphans(newId, String(newItem.answer ?? ''))

      data[listKey] = list
      writeGuideFile(dept.fileName, data)
      markLocalChange()
      return data
    },
  )

  ipcMain.handle(
    'update-item',
    (
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
      requireRole(getCurrentUser(), ['editor', 'admin'])
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

      const oldParty =
        list[idx].party === 'customer'
          ? 'customer'
          : list[idx].party === 'supplier'
            ? 'supplier'
            : 'supplier'
      const nextParty =
        payload.departmentId === 'support'
          ? payload.item.party === 'customer' || payload.item.party === 'supplier'
            ? payload.item.party
            : oldParty
          : undefined

      const oldArchived = Boolean(list[idx].archived)
      const nextArchived =
        payload.item.archived !== undefined ? Boolean(payload.item.archived) : oldArchived

      list[idx] = {
        ...list[idx],
        question: payload.item.question,
        answer: payload.item.answer,
        parent_id: newParentId,
        has_children: payload.item.has_children ?? list[idx].has_children ?? false,
        photos: payload.item.photos ?? list[idx].photos ?? [],
        documents: payload.item.documents ?? list[idx].documents ?? [],
        ...(nextParty ? { party: nextParty } : {}),
        ...(nextArchived ? { archived: true } : {}),
      }
      if (!nextArchived) {
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

      // When a folder's party changes, move all descendants to the same party
      if (
        payload.departmentId === 'support' &&
        nextParty &&
        nextParty !== oldParty
      ) {
        for (const id of collectDescendants(payload.item.id)) {
          const row = list.find((r) => r.id === id)
          if (row) row.party = nextParty
        }
      }

      // Archive / unarchive cascades to subtopics
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

      cleanupTopicImageOrphans(payload.item.id, String(payload.item.answer ?? ''))

      data[listKey] = list
      writeGuideFile(dept.fileName, data)
      markLocalChange()
      return data
    },
  )

  ipcMain.handle(
    'delete-item',
    (
      _event,
      payload: {
        departmentId: DepartmentId
        id: number
      },
    ) => {
      requireRole(getCurrentUser(), ['admin'])
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
      markLocalChange()
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
      requireRole(getCurrentUser(), ['editor', 'admin'])
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
      requireRole(getCurrentUser(), ['editor', 'admin'])
      const owner = resolveImageOwner(payload ?? {})
      const image = clipboard.readImage()
      return saveNativeImageForOwner(owner, image)
    },
  )

  // Legacy flat media pick — keep for compatibility; prefer save-topic-image
  ipcMain.handle('pick-and-save-image', async (event) => {
    requireRole(getCurrentUser(), ['editor', 'admin'])
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
    if (cleaned.startsWith('images/') && typeof topicId === 'number') {
      return `spravochnik://media/${topicId}/${cleaned}`
    }
    if (cleaned.startsWith('media/')) {
      return `spravochnik://${cleaned}`
    }
    return ''
  })

  ipcMain.handle('updates:status', () => getUpdateStatus())
  ipcMain.handle('updates:check', () => checkForUpdates())
  ipcMain.handle('updates:download', () => downloadUpdate())

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

  // Pull from Disk on every launch so themes/accounts from other PCs appear
  void pullFromYandex()

  // Check Disk for a newer Setup (packaged builds only)
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
