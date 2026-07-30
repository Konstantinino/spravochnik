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

const DATA_FILES = [
  'guide.json',
  'guide_lawyers.json',
  'guide_managers.json',
  'guide_spp.json',
  'templates.json',
] as const

type DepartmentId =
  | 'support'
  | 'lawyers'
  | 'managers'
  | 'spp'
  | 'templates'

const DEPARTMENTS: {
  id: DepartmentId
  label: string
  fileName: string
  listKey: 'questions' | 'templates'
}[] = [
  { id: 'support', label: 'Тех. поддержка', fileName: 'guide.json', listKey: 'questions' },
  { id: 'lawyers', label: 'Юристы', fileName: 'guide_lawyers.json', listKey: 'questions' },
  { id: 'managers', label: 'Менеджеры', fileName: 'guide_managers.json', listKey: 'questions' },
  { id: 'spp', label: 'СПП', fileName: 'guide_spp.json', listKey: 'questions' },
  { id: 'templates', label: 'Шаблоны', fileName: 'templates.json', listKey: 'templates' },
]

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

function getUserDataRoot(): string {
  return path.join(app.getPath('userData'), 'Spravochnik')
}

function getMediaDir(): string {
  return path.join(getUserDataRoot(), 'media')
}

function getSeedDataDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'data')
  }
  return path.join(__dirname, '../resources/data')
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
}

function departmentById(id: DepartmentId) {
  const dept = DEPARTMENTS.find((d) => d.id === id)
  if (!dept) throw new Error(`Неизвестный отдел: ${id}`)
  return dept
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
    title: 'Справочник',
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
      return data
    },
  )

  ipcMain.handle('pick-and-save-image', async (event) => {
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
}

app.whenReady().then(() => {
  ensureDataReady()

  protocol.handle('spravochnik', (request) => {
    try {
      const url = new URL(request.url)
      // spravochnik://media/filename.jpg  -> host=media, pathname=/filename.jpg
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
