import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import {
  ACCOUNTS_FILE,
  BOOTSTRAP_ADMIN_EMAIL,
  DEPARTMENTS,
  SESSION_FILE,
  SETTINGS_FILE,
  getUserDataRoot,
  normalizeWorkDepartmentId,
  parseUserRole,
  isOwnerRole,
  isStaffRole,
  type UserRole,
  type WorkDepartmentId,
} from './paths'

export interface StoredUser {
  id: string
  name: string
  email: string
  passwordHash: string
  salt: string
  role: UserRole
  departmentId: WorkDepartmentId
  createdAt: string
}

export interface WhitelistEntry {
  email: string
  departmentId: WorkDepartmentId
}

export interface AccountsData {
  users: StoredUser[]
  whitelist: WhitelistEntry[]
  /** Emails removed by admin — survive merge so pull does not resurrect them. */
  removedEmails?: string[]
}

export interface SettingsData {
  /** @deprecated Yandex Disk OAuth token — use authToken + serverUrl */
  yandexToken?: string
  serverUrl: string
  authToken: string
  lastSyncAt: string | null
  lastGlobalVersion?: number | null
  hasPendingChanges: boolean
  offlineWarningShown?: boolean
}

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
  departmentId: WorkDepartmentId
  isOwner?: boolean
}

export interface SessionData {
  userId: string
  /** If false, session is cleared on next app start */
  persist: boolean
}

function accountsPath(): string {
  return path.join(getUserDataRoot(), ACCOUNTS_FILE)
}

function settingsPath(): string {
  return path.join(getUserDataRoot(), SETTINGS_FILE)
}

function sessionPath(): string {
  return path.join(getUserDataRoot(), SESSION_FILE)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex')
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const hash = hashPassword(password, salt)
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(expectedHash, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function defaultAccounts(): AccountsData {
  return {
    users: [],
    whitelist: [{ email: normalizeEmail(BOOTSTRAP_ADMIN_EMAIL), departmentId: 'support' }],
    removedEmails: [],
  }
}

function normalizeWhitelistRaw(raw: unknown): WhitelistEntry[] {
  const byEmail = new Map<string, WorkDepartmentId>()
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') {
        const email = normalizeEmail(item)
        if (email.includes('@')) byEmail.set(email, 'support')
        continue
      }
      if (item && typeof item === 'object' && 'email' in item) {
        const email = normalizeEmail(String((item as { email: unknown }).email ?? ''))
        if (!email.includes('@')) continue
        const dept = normalizeWorkDepartmentId(
          (item as { departmentId?: unknown; department_id?: unknown }).departmentId ??
            (item as { department_id?: unknown }).department_id,
        )
        byEmail.set(email, dept)
      }
    }
  }
  return Array.from(byEmail.entries())
    .map(([email, departmentId]) => ({ email, departmentId }))
    .sort((a, b) => a.email.localeCompare(b.email))
}

/** Normalize a stored user row from accounts.json (local cache). */
function normalizeStoredUser(raw: Partial<StoredUser> & Record<string, unknown>): StoredUser {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    email: normalizeEmail(String(raw.email ?? '')),
    passwordHash: String(raw.passwordHash ?? ''),
    salt: String(raw.salt ?? ''),
    role: parseUserRole(raw.role),
    departmentId: normalizeWorkDepartmentId(
      raw.departmentId ?? (raw as { department_id?: unknown }).department_id,
    ),
    createdAt: String(
      raw.createdAt ?? (raw as { created_at?: string }).created_at ?? new Date().toISOString(),
    ),
  }
}

function defaultSettings(): SettingsData {
  return {
    serverUrl: '',
    authToken: '',
    lastSyncAt: null,
    lastGlobalVersion: null,
    hasPendingChanges: false,
  }
}

export function ensureAuthFiles(): void {
  if (!fs.existsSync(accountsPath())) {
    writeAccounts(defaultAccounts())
  } else {
    const data = readAccounts()
    const email = normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
    if (!data.whitelist.some((e) => normalizeEmail(e.email) === email)) {
      data.whitelist.push({ email, departmentId: 'support' })
      writeAccounts(data)
    }
  }
  if (!fs.existsSync(settingsPath())) {
    writeSettings(defaultSettings())
  }
}

export function readAccounts(): AccountsData {
  try {
    const raw = JSON.parse(fs.readFileSync(accountsPath(), 'utf8')) as {
      users?: unknown[]
      whitelist?: unknown
      removedEmails?: unknown
    }
    return coerceAccountsData(raw)
  } catch {
    return defaultAccounts()
  }
}

function findOwner(users: StoredUser[]): StoredUser | undefined {
  return users.find((u) => isOwnerRole(u.role))
}

function ensureLocalOwner(data: AccountsData): void {
  const owners = data.users.filter((u) => isOwnerRole(u.role))
  if (owners.length === 0) {
    const bootstrap = data.users.find((u) => isOwnerEmail(u.email))
    if (bootstrap) bootstrap.role = 'owner'
  } else if (owners.length > 1) {
    const keep = [...owners].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
    for (const extra of owners) {
      if (extra.id !== keep.id) extra.role = 'admin'
    }
  }
  const owner = findOwner(data.users)
  const keepEmail = owner ? normalizeEmail(owner.email) : normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
  if (!data.whitelist.some((e) => normalizeEmail(e.email) === keepEmail)) {
    data.whitelist.push({
      email: keepEmail,
      departmentId: owner ? owner.departmentId : 'support',
    })
    data.whitelist.sort((a, b) => a.email.localeCompare(b.email))
  }
}

export function getOwnerEmail(): string {
  const owner = findOwner(readAccounts().users)
  return owner ? owner.email : normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
}

export function coerceAccountsData(raw: {
  users?: unknown
  whitelist?: unknown
  removedEmails?: unknown
}): AccountsData {
  const data: AccountsData = {
    users: Array.isArray(raw.users)
      ? raw.users.map((u) => normalizeStoredUser(u as Partial<StoredUser> & Record<string, unknown>))
      : [],
    whitelist: normalizeWhitelistRaw(raw.whitelist),
    removedEmails: Array.isArray(raw.removedEmails)
      ? raw.removedEmails.map((e) => normalizeEmail(String(e))).filter(Boolean)
      : [],
  }
  ensureLocalOwner(data)
  return data
}

export function writeAccounts(data: AccountsData): void {
  fs.writeFileSync(accountsPath(), JSON.stringify(data, null, 2), 'utf8')
}

export function readSettings(): SettingsData {
  try {
    const raw = JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) as SettingsData
    return {
      yandexToken: typeof raw.yandexToken === 'string' ? raw.yandexToken : '',
      serverUrl: typeof raw.serverUrl === 'string' ? raw.serverUrl : '',
      authToken: typeof raw.authToken === 'string' ? raw.authToken : '',
      lastSyncAt: typeof raw.lastSyncAt === 'string' ? raw.lastSyncAt : null,
      lastGlobalVersion:
        typeof raw.lastGlobalVersion === 'number' && Number.isFinite(raw.lastGlobalVersion)
          ? raw.lastGlobalVersion
          : null,
      hasPendingChanges: Boolean(raw.hasPendingChanges),
      offlineWarningShown: Boolean(raw.offlineWarningShown),
    }
  } catch {
    return defaultSettings()
  }
}

export function writeSettings(data: SettingsData): void {
  fs.writeFileSync(settingsPath(), JSON.stringify(data, null, 2), 'utf8')
}

export function setPendingChanges(value: boolean): void {
  const settings = readSettings()
  settings.hasPendingChanges = value
  writeSettings(settings)
}

export function toPublicUser(user: StoredUser): PublicUser {
  const isOwner = isOwnerRole(user.role)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: normalizeWorkDepartmentId(user.departmentId),
    ...(isOwner ? { isOwner: true } : {}),
  }
}

export function isOwnerEmail(email: string): boolean {
  return normalizeEmail(email) === normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
}

const ROLE_RANK: Record<UserRole, number> = { user: 0, editor: 1, admin: 2, owner: 3 }

/** Union users/whitelist from local + remote so registrations and role edits are not wiped by pull. */
export function mergeAccountsData(
  local: AccountsData,
  remote: AccountsData,
  options?: { preferLocalRoles?: boolean },
): AccountsData {
  const preferLocalRoles = Boolean(options?.preferLocalRoles)
  const removedEmails = Array.from(
    new Set(
      [...(local.removedEmails ?? []), ...(remote.removedEmails ?? [])]
        .map(normalizeEmail)
        .filter(Boolean),
    ),
  )
  const removed = new Set(removedEmails)
  const byEmail = new Map<string, StoredUser>()

  for (const u of remote.users) {
    const key = normalizeEmail(u.email)
    if (removed.has(key)) continue
    byEmail.set(key, { ...u, email: key })
  }

  for (const u of local.users) {
    const key = normalizeEmail(u.email)
    if (removed.has(key)) continue
    const remoteUser = byEmail.get(key)
    if (!remoteUser) {
      byEmail.set(key, { ...u, email: key })
      continue
    }

    let role: UserRole
    if (preferLocalRoles) {
      role = u.role
    } else if (ROLE_RANK[u.role] !== ROLE_RANK[remoteUser.role]) {
      // Keep the higher privilege so an admin role push isn't lost to an older remote copy
      role = ROLE_RANK[u.role] >= ROLE_RANK[remoteUser.role] ? u.role : remoteUser.role
    } else {
      role = remoteUser.role
    }

    // Prefer local credentials when the account exists locally (login must keep working)
    byEmail.set(key, {
      ...remoteUser,
      id: u.id || remoteUser.id,
      name: u.name || remoteUser.name,
      email: key,
      salt: u.salt || remoteUser.salt,
      passwordHash: u.passwordHash || remoteUser.passwordHash,
      role,
      departmentId: normalizeWorkDepartmentId(
        preferLocalRoles ? u.departmentId : remoteUser.departmentId || u.departmentId,
      ),
      createdAt: u.createdAt || remoteUser.createdAt,
    })
  }

  const wlByEmail = new Map<string, WorkDepartmentId>()
  for (const entry of [...remote.whitelist, ...local.whitelist]) {
    const email = normalizeEmail(entry.email)
    if (!email) continue
    wlByEmail.set(email, normalizeWorkDepartmentId(entry.departmentId))
  }
  const merged: AccountsData = {
    users: Array.from(byEmail.values()),
    whitelist: Array.from(wlByEmail.entries())
      .map(([email, departmentId]) => ({ email, departmentId }))
      .sort((a, b) => a.email.localeCompare(b.email)),
    removedEmails,
  }
  ensureLocalOwner(merged)
  return merged
}

export function resolveRoleForEmail(email: string): UserRole {
  if (isOwnerEmail(email) && !findOwner(readAccounts().users)) {
    return 'owner'
  }
  return 'user'
}

export function registerUser(input: {
  name: string
  email: string
  password: string
}): PublicUser {
  const name = input.name.trim()
  const email = normalizeEmail(input.email)
  const password = input.password

  if (!name) throw new Error('Укажите имя')
  if (!email || !email.includes('@')) throw new Error('Укажите корректную почту')
  if (password.length < 6) throw new Error('Пароль не короче 6 символов')

  const accounts = readAccounts()
  const wlEntry = accounts.whitelist.find((e) => normalizeEmail(e.email) === email)
  if (!wlEntry) {
    throw new Error('Эта почта не в списке разрешённых для регистрации')
  }
  if (accounts.users.some((u) => normalizeEmail(u.email) === email)) {
    throw new Error('Пользователь с такой почтой уже зарегистрирован')
  }

  const salt = randomBytes(16).toString('hex')
  const user: StoredUser = {
    id: createHash('sha1').update(`${email}-${Date.now()}`).digest('hex').slice(0, 12),
    name,
    email,
    salt,
    passwordHash: hashPassword(password, salt),
    role: resolveRoleForEmail(email),
    departmentId: normalizeWorkDepartmentId(wlEntry.departmentId),
    createdAt: new Date().toISOString(),
  }

  // Owner always stays owner when first registering the bootstrap email
  if (isOwnerEmail(email) && !findOwner(accounts.users.filter((u) => u.id !== user.id))) {
    user.role = 'owner'
  }

  accounts.removedEmails = (accounts.removedEmails ?? []).filter((e) => e !== email)
  accounts.users.push(user)
  writeAccounts(accounts)
  return toPublicUser(user)
}

export function loginUser(input: {
  email: string
  password: string
  rememberMe?: boolean
}): PublicUser {
  const email = normalizeEmail(input.email)
  const accounts = readAccounts()
  const user = accounts.users.find((u) => normalizeEmail(u.email) === email)
  if (!user || !verifyPassword(input.password, user.salt, user.passwordHash)) {
    throw new Error('Неверная почта или пароль')
  }
  writeSession(user.id, Boolean(input.rememberMe))
  return toPublicUser(user)
}

export function writeSession(userId: string, persist: boolean): void {
  const data: SessionData = { userId, persist }
  fs.writeFileSync(sessionPath(), JSON.stringify(data, null, 2), 'utf8')
}

export function clearSession(): void {
  if (fs.existsSync(sessionPath())) fs.unlinkSync(sessionPath())
}

/** Drop session from previous run if user did not check «Запомнить меня». */
export function clearEphemeralSessionOnStartup(): void {
  if (!fs.existsSync(sessionPath())) return
  try {
    const session = JSON.parse(fs.readFileSync(sessionPath(), 'utf8')) as SessionData
    // Legacy sessions without persist → keep (treat as remembered)
    if (session.persist === false) {
      clearSession()
    }
  } catch {
    clearSession()
  }
}

export function getCurrentUser(): PublicUser | null {
  if (!fs.existsSync(sessionPath())) return null
  try {
    const session = JSON.parse(fs.readFileSync(sessionPath(), 'utf8')) as SessionData
    const accounts = readAccounts()
    const user = accounts.users.find((u) => u.id === session.userId)
    return user ? toPublicUser(user) : null
  } catch {
    return null
  }
}

export function listUsersPublic(): PublicUser[] {
  return readAccounts().users.map(toPublicUser)
}

export function updateUserRole(
  userId: string,
  role: UserRole,
  actor?: PublicUser | null,
): PublicUser[] {
  if (role === 'owner') {
    throw new Error('Владение передаётся отдельным действием')
  }
  if (role !== 'user' && role !== 'editor' && role !== 'admin') {
    throw new Error('Недопустимая роль')
  }

  const accounts = readAccounts()
  const user = accounts.users.find((u) => u.id === userId)
  if (!user) throw new Error('Пользователь не найден')

  if (isOwnerRole(user.role)) {
    throw new Error('Нельзя менять роль владельца')
  }
  if (actor) {
    if (!isStaffRole(actor.role)) throw new Error('Недостаточно прав')
    if (role === 'admin' && !isOwnerRole(actor.role)) {
      throw new Error('Назначить админа может только владелец')
    }
    if (user.role === 'admin' && role !== 'admin' && !isOwnerRole(actor.role)) {
      throw new Error('Снять роль админа может только владелец')
    }
  }

  user.role = role
  writeAccounts(accounts)
  return listUsersPublic()
}

export function updateUserProfile(
  userId: string,
  input: { name?: string; password?: string; departmentId?: WorkDepartmentId; email?: string },
  actor?: PublicUser | null,
): PublicUser[] {
  const accounts = readAccounts()
  const emailHint = input.email ? normalizeEmail(input.email) : ''
  const user =
    accounts.users.find((u) => u.id === userId) ??
    (emailHint ? accounts.users.find((u) => normalizeEmail(u.email) === emailHint) : undefined)
  if (!user) throw new Error('Пользователь не найден')

  if (actor && isOwnerRole(user.role) && actor.id !== user.id) {
    throw new Error('Владельца может изменить только он сам')
  }

  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) throw new Error('Укажите имя')
    user.name = name
  }

  if (input.password !== undefined && input.password.length > 0) {
    if (input.password.length < 6) throw new Error('Пароль не короче 6 символов')
    const salt = randomBytes(16).toString('hex')
    user.salt = salt
    user.passwordHash = hashPassword(input.password, salt)
  }

  if (input.departmentId !== undefined) {
    user.departmentId = normalizeWorkDepartmentId(input.departmentId)
    const email = normalizeEmail(user.email)
    const wlIdx = accounts.whitelist.findIndex((e) => normalizeEmail(e.email) === email)
    if (wlIdx >= 0) {
      accounts.whitelist[wlIdx] = { email, departmentId: user.departmentId }
    } else {
      accounts.whitelist.push({ email, departmentId: user.departmentId })
    }
  }

  writeAccounts(accounts)
  return listUsersPublic()
}

export function transferOwnership(successorId: string, actor?: PublicUser | null): PublicUser[] {
  if (actor && !isOwnerRole(actor.role)) {
    throw new Error('Передать владение может только владелец')
  }
  const accounts = readAccounts()
  const owner = findOwner(accounts.users)
  if (!owner) throw new Error('Владелец не найден')
  if (actor && actor.id !== owner.id) {
    throw new Error('Передать владение может только владелец')
  }
  if (successorId === owner.id) {
    throw new Error('Нельзя передать владение самому себе')
  }
  const successor = accounts.users.find((u) => u.id === successorId)
  if (!successor) throw new Error('Пользователь для передачи владения не найден')

  owner.role = 'admin'
  successor.role = 'owner'
  const email = normalizeEmail(successor.email)
  const wlIdx = accounts.whitelist.findIndex((e) => normalizeEmail(e.email) === email)
  if (wlIdx < 0) {
    accounts.whitelist.push({ email, departmentId: successor.departmentId })
  }
  writeAccounts(accounts)
  return listUsersPublic()
}

export function deleteUser(userId: string, successorId?: string, actor?: PublicUser | null): PublicUser[] {
  const accounts = readAccounts()
  const user = accounts.users.find((u) => u.id === userId)
  if (!user) throw new Error('Пользователь не найден')

  if (isOwnerRole(user.role)) {
    if (actor && actor.id !== user.id) {
      throw new Error('Удалить владельца может только он сам')
    }
    if (!successorId) {
      throw new Error('Сначала назначьте другого пользователя владельцем')
    }
    transferOwnership(successorId, actor ?? toPublicUser(user))
    return deleteUser(userId, undefined, actor)
  }

  const email = normalizeEmail(user.email)
  accounts.users = accounts.users.filter((u) => u.id !== userId)
  const removed = new Set([...(accounts.removedEmails ?? []), email])
  accounts.removedEmails = Array.from(removed)
  writeAccounts(accounts)

  const session = (() => {
    try {
      if (!fs.existsSync(sessionPath())) return null
      return JSON.parse(fs.readFileSync(sessionPath(), 'utf8')) as SessionData
    } catch {
      return null
    }
  })()
  if (session?.userId === userId) {
    clearSession()
  }

  return listUsersPublic()
}

export function getWhitelist(): WhitelistEntry[] {
  return readAccounts().whitelist
}

export function setWhitelist(entries: unknown): WhitelistEntry[] {
  const accounts = readAccounts()
  accounts.whitelist = normalizeWhitelistRaw(entries)
  ensureLocalOwner(accounts)
  writeAccounts(accounts)
  return accounts.whitelist
}

export function addWhitelistEmail(
  email: string,
  departmentId?: WorkDepartmentId,
): WhitelistEntry[] {
  const normalized = normalizeEmail(email)
  if (!normalized.includes('@')) throw new Error('Некорректная почта')
  const dept = normalizeWorkDepartmentId(departmentId)
  const accounts = readAccounts()
  const idx = accounts.whitelist.findIndex((e) => normalizeEmail(e.email) === normalized)
  if (idx >= 0) {
    accounts.whitelist[idx] = { email: normalized, departmentId: dept }
  } else {
    accounts.whitelist.push({ email: normalized, departmentId: dept })
  }
  writeAccounts(accounts)
  return accounts.whitelist
}

export function removeWhitelistEmail(email: string): WhitelistEntry[] {
  const normalized = normalizeEmail(email)
  if (normalized === normalizeEmail(getOwnerEmail())) {
    throw new Error('Нельзя удалить почту владельца из whitelist')
  }
  const accounts = readAccounts()
  accounts.whitelist = accounts.whitelist.filter((e) => normalizeEmail(e.email) !== normalized)
  writeAccounts(accounts)
  return accounts.whitelist
}

export function getRegistrationDepartment(
  email: string,
): { departmentId: WorkDepartmentId; label: string } | null {
  const normalized = normalizeEmail(email)
  if (!normalized.includes('@')) return null
  const entry = readAccounts().whitelist.find((e) => normalizeEmail(e.email) === normalized)
  if (!entry) return null
  const label =
    DEPARTMENTS.find((d) => d.id === entry.departmentId)?.label ?? entry.departmentId
  return { departmentId: entry.departmentId, label }
}

export function setYandexToken(token: string): SettingsData {
  const settings = readSettings()
  settings.yandexToken = token.trim()
  writeSettings(settings)
  return settings
}

export function normalizeServerUrl(url: string): string {
  let normalized = url.trim().replace(/\/+$/, '')
  if (!normalized) return ''
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`
  }
  return normalized
}

export function setServerUrl(url: string): SettingsData {
  const settings = readSettings()
  settings.serverUrl = normalizeServerUrl(url)
  writeSettings(settings)
  return settings
}

export function setAuthToken(token: string): SettingsData {
  const settings = readSettings()
  settings.authToken = token.trim()
  writeSettings(settings)
  return settings
}

export function setLastSyncAt(iso: string | null): SettingsData {
  const settings = readSettings()
  settings.lastSyncAt = iso
  writeSettings(settings)
  return settings
}

export function requireRole(
  user: PublicUser | null,
  roles: UserRole[],
): asserts user is PublicUser {
  if (!user || !roles.includes(user.role)) {
    throw new Error('Недостаточно прав')
  }
}
