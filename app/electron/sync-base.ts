import fs from 'node:fs'
import path from 'node:path'
import { DATA_FILES, getUserDataRoot } from './paths'

const BASE_DIR = '.sync-base'

function baseDir(): string {
  return path.join(getUserDataRoot(), BASE_DIR)
}

export function basePathFor(fileName: string): string {
  return path.join(baseDir(), fileName)
}

export function readBaseGuide(fileName: string): unknown | null {
  const p = basePathFor(fileName)
  try {
    if (!fs.existsSync(p)) return null
    return JSON.parse(fs.readFileSync(p, 'utf8')) as unknown
  } catch {
    return null
  }
}

export function writeBaseGuide(fileName: string, data: unknown): void {
  const dir = baseDir()
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(basePathFor(fileName), JSON.stringify(data, null, 2), 'utf8')
}

export function writeBaseFromLocalFile(fileName: string): void {
  const local = path.join(getUserDataRoot(), fileName)
  if (!fs.existsSync(local)) return
  try {
    const data = JSON.parse(fs.readFileSync(local, 'utf8')) as unknown
    writeBaseGuide(fileName, data)
  } catch {
    /* ignore */
  }
}

export function writeAllGuideBasesFromLocal(): void {
  for (const fileName of DATA_FILES) {
    writeBaseFromLocalFile(fileName)
  }
}
