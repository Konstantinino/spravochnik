import { BrowserWindow, dialog, net } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { resolveExistingMediaAbsolutePath } from './media-layout'

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']

function localPathFromSpravochnikUrl(resolvedSrc: string): string | null {
  try {
    const url = new URL(resolvedSrc)
    const relative = path.posix.join(url.hostname, url.pathname.replace(/^\/+/, ''))
    if (!relative.startsWith('media/')) return null
    return resolveExistingMediaAbsolutePath(relative)
  } catch {
    return null
  }
}

function suggestedNameFromSrc(resolvedSrc: string, suggestedName?: string): string {
  const fromArg = suggestedName?.trim() ? path.basename(suggestedName.trim()) : ''
  if (fromArg && !fromArg.includes('..')) return fromArg
  if (resolvedSrc.startsWith('spravochnik://')) {
    const local = localPathFromSpravochnikUrl(resolvedSrc)
    if (local) return path.basename(local)
  }
  try {
    const url = new URL(resolvedSrc)
    const base = path.basename(url.pathname)
    if (base) return base
  } catch {
    /* ignore */
  }
  return 'file'
}

export async function downloadMediaImage(
  resolvedSrc: string,
  suggestedName?: string,
): Promise<{
  ok: boolean
  error?: string
  canceled?: boolean
  path?: string
}> {
  if (!resolvedSrc.trim()) {
    return { ok: false, error: 'Пустой адрес файла' }
  }

  const name = suggestedNameFromSrc(resolvedSrc, suggestedName)
  const ext = path.extname(name).slice(1).toLowerCase()
  const isImage = IMAGE_EXTENSIONS.includes(ext)
  const filters = isImage
    ? [
        {
          name: 'Изображения',
          extensions: Array.from(new Set([ext, ...IMAGE_EXTENSIONS].filter(Boolean))),
        },
      ]
    : ext
      ? [
          { name: 'Файл', extensions: [ext] },
          { name: 'Все файлы', extensions: ['*'] },
        ]
      : [{ name: 'Все файлы', extensions: ['*'] }]

  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
  const saveOptions = {
    title: isImage ? 'Куда сохранить изображение' : 'Куда сохранить файл',
    defaultPath: name,
    filters,
  }
  const save = win
    ? await dialog.showSaveDialog(win, saveOptions)
    : await dialog.showSaveDialog(saveOptions)
  if (save.canceled || !save.filePath) {
    return { ok: false, canceled: true }
  }

  try {
    if (resolvedSrc.startsWith('spravochnik://')) {
      const sourcePath = localPathFromSpravochnikUrl(resolvedSrc)
      if (!sourcePath || !fs.existsSync(sourcePath)) {
        return { ok: false, error: 'Файл не найден' }
      }
      fs.copyFileSync(sourcePath, save.filePath)
      return { ok: true, path: save.filePath }
    }

    if (/^https?:\/\//i.test(resolvedSrc)) {
      const res = await net.fetch(resolvedSrc)
      if (!res.ok) {
        return { ok: false, error: 'Не удалось скачать файл' }
      }
      const buffer = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(save.filePath, buffer)
      return { ok: true, path: save.filePath }
    }

    return { ok: false, error: 'Этот файл нельзя скачать' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
