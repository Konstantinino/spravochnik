import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  protocol,
  net,
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
  type DepartmentId,
  type UserRole,
} from './paths'
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
  writeSession,
  clearEphemeralSessionOnStartup,
} from './auth-store'
import {
  discardLocalChanges,
  getSyncStatus,
  markLocalChange,
  onSyncStatus,
  pullFromYandex,
  pushToYandex,
  refreshStatusFromSettings,
} from './yandex-sync'

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
    (_e, payload: { email: string; password: string; rememberMe?: boolean }) =>
      loginUser(payload),
  )
  ipcMain.handle(
    'auth:register',
    (
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
  ipcMain.handle('admin:set-role', (_e, payload: { userId: string; role: UserRole }) => {
    requireRole(getCurrentUser(), ['admin'])
    const users = updateUserRole(payload.userId, payload.role)
    markLocalChange()
    return users
  })
  ipcMain.handle('admin:get-whitelist', () => {
    requireRole(getCurrentUser(), ['admin'])
    return getWhitelist()
  })
  ipcMain.handle('admin:set-whitelist', (_e, emails: string[]) => {
    requireRole(getCurrentUser(), ['admin'])
    const list = setWhitelist(emails)
    markLocalChange()
    return list
  })
  ipcMain.handle('admin:add-whitelist', (_e, email: string) => {
    requireRole(getCurrentUser(), ['admin'])
    const list = addWhitelistEmail(email)
    markLocalChange()
    return list
  })
  ipcMain.handle('admin:remove-whitelist', (_e, email: string) => {
    requireRole(getCurrentUser(), ['admin'])
    const list = removeWhitelistEmail(email)
    markLocalChange()
    return list
  })
  ipcMain.handle('admin:get-settings', () => {
    requireRole(getCurrentUser(), ['admin'])
    const s = readSettings()
    return { hasPendingChanges: s.hasPendingChanges, hasToken: Boolean(s.yandexToken) }
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
    requireRole(user, ['editor', 'admin'])
    return discardLocalChanges()
  })
  ipcMain.handle('sync:push', async () => {
    const user = getCurrentUser()
    requireRole(user, ['editor', 'admin'])
    return pushToYandex()
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
        item: {
          id?: number
          question: string
          answer: string
          parent_id?: number | null
          has_children?: boolean
          photos?: string[]
          documents?: { file_id: string; file_name: string }[]
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

      const newItem = {
        id: payload.item.id ?? maxId + 1,
        question: payload.item.question,
        answer: payload.item.answer,
        parent_id: payload.item.parent_id ?? null,
        has_children: payload.item.has_children ?? false,
        photos: payload.item.photos ?? [],
        documents: payload.item.documents ?? [],
      }

      list.push(newItem)

      if (newItem.parent_id != null) {
        const parent = list.find((item) => item.id === newItem.parent_id)
        if (parent) parent.has_children = true
      }

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
          photos?: string[]
          documents?: { file_id: string; file_name: string }[]
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

      list[idx] = {
        ...list[idx],
        question: payload.item.question,
        answer: payload.item.answer,
        parent_id: payload.item.parent_id ?? list[idx].parent_id ?? null,
        has_children: payload.item.has_children ?? list[idx].has_children ?? false,
        photos: payload.item.photos ?? list[idx].photos ?? [],
        documents: payload.item.documents ?? list[idx].documents ?? [],
      }

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

  ipcMain.handle('resolve-media-url', (_event, relativePath: string) => {
    const cleaned = relativePath.replace(/^\/+/, '').replace(/\\/g, '/')
    if (!cleaned.startsWith('media/')) {
      return ''
    }
    return `spravochnik://${cleaned}`
  })

  // Forward sync status to all windows
  onSyncStatus((status) => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('sync:status-changed', status)
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
