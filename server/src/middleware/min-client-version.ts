import type { Request, Response, NextFunction } from 'express'
import {
  CLIENT_VERSION_HEADER,
  compareVersions,
  getLatestAppReleaseVersion,
  normalizeVersionLabel,
  parseClientVersionHeader,
} from '../lib/app-version.js'

let cachedMinVersion: { value: string | null; expiresAt: number } | null = null
const CACHE_MS = 30_000

async function requiredClientVersion(): Promise<string | null> {
  const envMin = process.env.MIN_CLIENT_VERSION?.trim()
  if (envMin) return normalizeVersionLabel(envMin)

  const now = Date.now()
  if (cachedMinVersion && cachedMinVersion.expiresAt > now) {
    return cachedMinVersion.value
  }
  const latest = await getLatestAppReleaseVersion()
  const value = latest ? normalizeVersionLabel(latest) : null
  cachedMinVersion = { value, expiresAt: now + CACHE_MS }
  return value
}

/** Reject writes from clients older than latest app_releases (or MIN_CLIENT_VERSION). */
export async function requireCurrentClientVersion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (process.env.SKIP_MIN_CLIENT_VERSION === '1') {
    next()
    return
  }

  try {
    const minVersion = await requiredClientVersion()
    if (!minVersion) {
      next()
      return
    }

    const clientVersion = parseClientVersionHeader(req.headers[CLIENT_VERSION_HEADER])
    if (compareVersions(clientVersion, minVersion) >= 0) {
      next()
      return
    }

    res.status(426).json({
      error: `Обновите REST INFO до версии ${minVersion} или новее. Старые версии не могут изменять данные на сервере.`,
      code: 'client_outdated',
      minVersion,
      clientVersion,
    })
  } catch (err) {
    next(err)
  }
}

export function blockWritesIfClientOutdated(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next()
    return
  }
  void requireCurrentClientVersion(req, res, next)
}
