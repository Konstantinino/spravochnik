import { query } from '../db/pool.js'

export const CLIENT_VERSION_HEADER = 'x-rest-info-client-version'

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

export function parseClientVersionHeader(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return '0.0.0'
  return trimmed.replace(/^v/i, '')
}

export async function getLatestAppReleaseVersion(): Promise<string | null> {
  const result = await query<{ version: string }>(
    `SELECT version FROM app_releases ORDER BY published_at DESC LIMIT 1`,
  )
  const version = result.rows[0]?.version?.trim()
  return version || null
}

export function normalizeVersionLabel(version: string): string {
  return version.trim().replace(/^v/i, '')
}

let cachedRequiredVersion: { value: string | null; expiresAt: number } | null = null
const REQUIRED_VERSION_CACHE_MS = 30_000

/** Минимальная версия клиента для записи на API (env или последний релиз). */
export async function requiredClientVersion(): Promise<string | null> {
  const envMin = process.env.MIN_CLIENT_VERSION?.trim()
  if (envMin) return normalizeVersionLabel(envMin)

  const now = Date.now()
  if (cachedRequiredVersion && cachedRequiredVersion.expiresAt > now) {
    return cachedRequiredVersion.value
  }
  const latest = await getLatestAppReleaseVersion()
  const value = latest ? normalizeVersionLabel(latest) : null
  cachedRequiredVersion = { value, expiresAt: now + REQUIRED_VERSION_CACHE_MS }
  return value
}
