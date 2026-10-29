import type { CookieOptions, Request, Response } from 'express'

export const SESSION_COOKIE = 'rest_info_session'

/** Browser SPA: httpOnly session cookie. Electron uses Bearer only — never both for API writes. */
export function requestHasWebSessionCookie(req: Request): boolean {
  if (req.headers.authorization?.startsWith('Bearer ')) return false
  const cookies = req.cookies as Record<string, string | undefined> | undefined
  if (cookies?.[SESSION_COOKIE]) return true
  const raw = req.headers.cookie
  if (!raw) return false
  const prefix = `${SESSION_COOKIE}=`
  for (const part of raw.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) return true
  }
  return false
}

export function sessionCookieOptions(): CookieOptions {
  const secure = process.env.COOKIE_SECURE !== 'false'
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions())
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE !== 'false',
  })
}
