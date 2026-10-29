import type { Request, Response, NextFunction } from 'express'
import {
  CLIENT_VERSION_HEADER,
  compareVersions,
  parseClientVersionHeader,
  requiredClientVersion,
} from '../lib/app-version.js'
import { requestHasWebSessionCookie } from '../lib/web-session.js'

/** Reject writes from desktop clients older than latest app_releases (or MIN_CLIENT_VERSION). Web SPA is exempt (single deploy, always current). */
export async function requireCurrentClientVersion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (process.env.SKIP_MIN_CLIENT_VERSION === '1') {
    next()
    return
  }

  if (requestHasWebSessionCookie(req)) {
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
