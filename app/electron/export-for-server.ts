import fs from 'node:fs'
import path from 'node:path'
import {
  ACCOUNTS_FILE,
  DATA_FILES,
  getUserDataRoot,
} from './paths'
import { readAccounts } from './auth-store'

const GUIDE_LIST_KEY: Record<string, 'questions' | 'templates'> = {
  'guide.json': 'questions',
  'guide_lawyers.json': 'questions',
  'guide_managers.json': 'questions',
  'guide_spp.json': 'questions',
  'templates.json': 'templates',
}

export interface ExportManifest {
  exportedAt: string
  sourceRoot: string
  topics: Record<string, number>
  templates: number
  users: number
  whitelist: number
  mediaFiles: number
  warnings: string[]
}

function countItems(filePath: string, listKey: 'questions' | 'templates'): number {
  try {
    if (!fs.existsSync(filePath)) return 0
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>
    const items = data[listKey]
    return Array.isArray(items) ? items.length : 0
  } catch {
    return 0
  }
}

function pickBestGuideSource(fileName: string, root: string): { path: string; count: number } {
  const listKey = GUIDE_LIST_KEY[fileName] ?? 'questions'
  const localPath = path.join(root, fileName)
  const basePath = path.join(root, '.sync-base', fileName)
  const localCount = countItems(localPath, listKey)
  const baseCount = countItems(basePath, listKey)
  if (baseCount > localCount) {
    return { path: basePath, count: baseCount }
  }
  return { path: localPath, count: localCount }
}

function copyFileSafe(src: string, dest: string): boolean {
  if (!fs.existsSync(src)) return false
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
  return true
}

function copyMediaTree(src: string, dest: string): number {
  if (!fs.existsSync(src)) return 0
  fs.mkdirSync(dest, { recursive: true })
  let count = 0
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      count += copyMediaTree(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
      count += 1
    }
  }
  return count
}

/** Package local REST INFO data for server import (docker import-from-json). */
export function exportForServer(destDir: string, sourceRoot?: string): ExportManifest {
  const warnings: string[] = []
  const resolvedDest = path.resolve(destDir)
  const root = sourceRoot ? path.resolve(sourceRoot) : getUserDataRoot()
  fs.mkdirSync(resolvedDest, { recursive: true })

  const manifest: ExportManifest = {
    exportedAt: new Date().toISOString(),
    sourceRoot: root,
    topics: {},
    templates: 0,
    users: 0,
    whitelist: 0,
    mediaFiles: 0,
    warnings,
  }

  for (const fileName of DATA_FILES) {
    const { path: src, count } = pickBestGuideSource(fileName, root)
    if (!copyFileSafe(src, path.join(resolvedDest, fileName))) {
      warnings.push(`Файл не найден: ${fileName}`)
      continue
    }
    if (fileName === 'templates.json') {
      manifest.templates = count
    } else {
      const dept = fileName.replace(/^guide_?/, '').replace(/\.json$/, '') || 'support'
      manifest.topics[dept === 'guide' ? 'support' : dept] = count
    }
    if (src.includes('.sync-base')) {
      warnings.push(`${fileName}: взята более полная копия из .sync-base (${count} записей)`)
    }
  }

  const accountsPath = path.join(root, ACCOUNTS_FILE)
  let accounts = readAccounts()
  if (sourceRoot) {
    if (!fs.existsSync(accountsPath)) {
      warnings.push('accounts.json не найден в исходной папке')
    } else {
      accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8')) as typeof accounts
    }
  }

  const importAccounts = {
    users: accounts.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      salt: u.salt,
      role: u.role,
      createdAt: u.createdAt,
    })),
    whitelist: accounts.whitelist,
    removedEmails: accounts.removedEmails ?? [],
  }

  const usersWithoutPassword = importAccounts.users.filter((u) => !u.passwordHash || !u.salt)
  if (usersWithoutPassword.length > 0) {
    warnings.push(
      `${usersWithoutPassword.length} пользователей без пароля в локальном кэше — на сервере им нужно будет задать пароль или зарегистрироваться заново`,
    )
  }

  fs.writeFileSync(
    path.join(resolvedDest, ACCOUNTS_FILE),
    JSON.stringify(importAccounts, null, 2),
    'utf8',
  )
  manifest.users = importAccounts.users.length
  manifest.whitelist = importAccounts.whitelist.length

  if (manifest.users === 0) {
    warnings.push(
      'В accounts.json нет пользователей — скачайте accounts.json из папки REST INFO на Яндекс.Диске или экспортируйте из приложения (с токеном Диска)',
    )
  }

  manifest.mediaFiles = copyMediaTree(path.join(root, 'media'), path.join(resolvedDest, 'media'))
  if (manifest.mediaFiles === 0) {
    warnings.push(
      'Папка media пуста — изображения нужно скопировать с Яндекс.Диска (REST INFO/media) или с другого ПК',
    )
  }

  fs.writeFileSync(
    path.join(resolvedDest, 'export-manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  )

  return manifest
}
