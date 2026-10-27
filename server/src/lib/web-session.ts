import type { CookieOptions, Response } from 'express'

export const SESSION_COOKIE = 'rest_info_session'

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
