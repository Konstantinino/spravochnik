import { app, shell } from 'electron'
import { writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const GITHUB_OWNER = 'Konstantinino'
const GITHUB_REPO = 'spravochnik'
const SETUP_ASSET_RE = /^REST-INFO-Setup-.*\.exe$/i

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version: string | null
  downloadUrl: string | null
  error?: string
}

type UpdateListener = (info: UpdateInfo) => void

let lastInfo: UpdateInfo = {
  available: false,
  currentVersion: '0.0.0',
  version: null,
  downloadUrl: null,
}

const listeners = new Set<UpdateListener>()

export function onUpdateStatus(listener: UpdateListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getUpdateStatus(): UpdateInfo {
  return { ...lastInfo }
}

function emit(info: UpdateInfo): UpdateInfo {
  lastInfo = info
  for (const listener of listeners) listener(info)
  return info
}

/** Strip leading `v` and compare dotted numeric versions. Returns >0 if a>b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split(/[.+-]/).map((x) => parseInt(x, 10) || 0)
  const pb = b.replace(/^v/i, '').split(/[.+-]/).map((x) => parseInt(x, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da !== db) return da - db
  }
  return 0
}

interface GitHubAsset {
  name: string
  browser_download_url: string
}

interface GitHubRelease {
  tag_name: string
  name?: string
  prerelease?: boolean
  assets?: GitHubAsset[]
}

function findSetupAsset(assets: GitHubAsset[] | undefined): GitHubAsset | null {
  if (!assets?.length) return null
  return assets.find((a) => SETUP_ASSET_RE.test(a.name)) ?? null
}

export async function checkForUpdates(options?: {
  force?: boolean
}): Promise<UpdateInfo> {
  const currentVersion = app.getVersion()
  const base: UpdateInfo = {
    available: false,
    currentVersion,
    version: null,
    downloadUrl: null,
  }

  // In unpackaged/dev, skip remote check unless forced (avoids API noise).
  if (!app.isPackaged && !options?.force) {
    return emit(base)
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': `REST-INFO/${currentVersion}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    )

    if (res.status === 404) {
      return emit({ ...base, error: 'Релизы не найдены' })
    }
    if (!res.ok) {
      return emit({
        ...base,
        error: `GitHub API: ${res.status}`,
      })
    }

    const release = (await res.json()) as GitHubRelease
    const remoteVersion = (release.tag_name || release.name || '').trim()
    if (!remoteVersion) {
      return emit({ ...base, error: 'В релизе нет версии' })
    }

    const asset = findSetupAsset(release.assets)
    if (!asset) {
      return emit({
        ...base,
        version: remoteVersion.replace(/^v/i, ''),
        error: 'В релизе нет Setup.exe',
      })
    }

    const available = compareVersions(remoteVersion, currentVersion) > 0
    return emit({
      available,
      currentVersion,
      version: remoteVersion.replace(/^v/i, ''),
      downloadUrl: available ? asset.browser_download_url : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return emit({ ...base, error: message })
  }
}

export async function downloadUpdate(): Promise<{ ok: boolean; error?: string }> {
  const info = lastInfo
  if (!info.available || !info.downloadUrl) {
    return { ok: false, error: 'Обновление недоступно' }
  }

  try {
    const res = await fetch(info.downloadUrl, {
      headers: { 'User-Agent': `REST-INFO/${info.currentVersion}` },
      redirect: 'follow',
    })
    if (!res.ok) {
      return { ok: false, error: `Скачивание: HTTP ${res.status}` }
    }

    const fileName =
      info.downloadUrl.split('/').pop()?.split('?')[0] ||
      `REST-INFO-Setup-${info.version || 'update'}.exe`
    const dest = path.join(os.tmpdir(), fileName)
    const buffer = Buffer.from(await res.arrayBuffer())
    await writeFile(dest, buffer)

    const openError = await shell.openPath(dest)
    if (openError) {
      await shell.openExternal(info.downloadUrl)
      return { ok: true, error: openError }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    try {
      await shell.openExternal(info.downloadUrl)
      return { ok: true, error: message }
    } catch {
      return { ok: false, error: message }
    }
  }
}
