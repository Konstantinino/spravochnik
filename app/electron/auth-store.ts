import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import {
  ACCOUNTS_FILE,
  BOOTSTRAP_ADMIN_EMAIL,
  SESSION_FILE,
  SETTINGS_FILE,
  getUserDataRoot,
  type UserRole,
} from './paths'

export interface StoredUser {
  id: string
  name: string
  email: string
  passwordHash: string
  salt: string
  role: UserRole
  createdAt: string
}

export interface AccountsData {
  users: StoredUser[]
  whitelist: string[]
}

export interface SettingsData {
  yandexToken: string
  hasPendingChanges: boolean
}

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
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
    whitelist: [BOOTSTRAP_ADMIN_EMAIL],
  }
}

function defaultSettings(): SettingsData {
  return {
    yandexToken: '',
    hasPendingChanges: false,
  }
}

export function ensureAuthFiles(): void {
  if (!fs.existsSync(accountsPath())) {
    writeAccounts(defaultAccounts())
  } else {
    const data = readAccounts()
    const email = normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
    if (!data.whitelist.map(normalizeEmail).includes(email)) {
      data.whitelist.push(BOOTSTRAP_ADMIN_EMAIL)
      writeAccounts(data)
    }
  }
  if (!fs.existsSync(settingsPath())) {
    writeSettings(defaultSettings())
  }
}

export function readAccounts(): AccountsData {
  try {
    const raw = JSON.parse(fs.readFileSync(accountsPath(), 'utf8')) as AccountsData
    return {
      users: Array.isArray(raw.users) ? raw.users : [],
      whitelist: Array.isArray(raw.whitelist) ? raw.whitelist : [BOOTSTRAP_ADMIN_EMAIL],
    }
  } catch {
    return defaultAccounts()
  }
}

export function writeAccounts(data: AccountsData): void {
  fs.writeFileSync(accountsPath(), JSON.stringify(data, null, 2), 'utf8')
}

export function readSettings(): SettingsData {
  try {
    const raw = JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) as SettingsData
    return {
      yandexToken: typeof raw.yandexToken === 'string' ? raw.yandexToken : '',
      hasPendingChanges: Boolean(raw.hasPendingChanges),
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
  const isOwner = normalizeEmail(user.email) === normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isOwner,
  }
}

export function isOwnerEmail(email: string): boolean {
  return normalizeEmail(email) === normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
}

const ROLE_RANK: Record<UserRole, number> = { user: 0, editor: 1, admin: 2 }

/** Union users/whitelist from local + remote so registrations and role edits are not wiped by pull. */
export function mergeAccountsData(
  local: AccountsData,
  remote: AccountsData,
  options?: { preferLocalRoles?: boolean },
): AccountsData {
  const preferLocalRoles = Boolean(options?.preferLocalRoles)
  const byEmail = new Map<string, StoredUser>()

  for (const u of remote.users) {
    byEmail.set(normalizeEmail(u.email), { ...u, email: normalizeEmail(u.email) })
  }

  for (const u of local.users) {
    const key = normalizeEmail(u.email)
    const remoteUser = byEmail.get(key)
    if (!remoteUser) {
      byEmail.set(key, { ...u, email: key })
      continue
    }

    let role: UserRole
    if (isOwnerEmail(key)) {
      role = 'admin'
    } else if (preferLocalRoles) {
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
      createdAt: u.createdAt || remoteUser.createdAt,
    })
  }

  for (const [key, u] of byEmail) {
    if (isOwnerEmail(key)) u.role = 'admin'
    else if (u.role === 'admin') u.role = 'editor'
  }

  const whitelist = Array.from(
    new Set(
      [...local.whitelist, ...remote.whitelist]
        .map(normalizeEmail)
        .filter(Boolean),
    ),
  )
  if (!whitelist.includes(normalizeEmail(BOOTSTRAP_ADMIN_EMAIL))) {
    whitelist.push(normalizeEmail(BOOTSTRAP_ADMIN_EMAIL))
  }

  return {
    users: Array.from(byEmail.values()),
    whitelist,
  }
}

export function resolveRoleForEmail(email: string): UserRole {
  if (isOwnerEmail(email)) {
    return 'admin'
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
  const allowed = accounts.whitelist.map(normalizeEmail).includes(email)
  if (!allowed) {
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
    createdAt: new Date().toISOString(),
  }

  // Owner always stays admin
  if (isOwnerEmail(email)) {
    user.role = 'admin'
  }

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

export function updateUserRole(userId: string, role: UserRole): PublicUser[] {
  if (role === 'admin') {
    throw new Error('Роль админа закреплена за владельцем и не назначается вручную')
  }

  const accounts = readAccounts()
  const user = accounts.users.find((u) => u.id === userId)
  if (!user) throw new Error('Пользователь не найден')

  if (isOwnerEmail(user.email)) {
    throw new Error('Нельзя менять роль владельца')
  }

  user.role = role
  writeAccounts(accounts)
  return listUsersPublic()
}

export function getWhitelist(): string[] {
  return readAccounts().whitelist
}

export function setWhitelist(emails: string[]): string[] {
  const accounts = readAccounts()
  const cleaned = Array.from(
    new Set(
      emails
        .map((e) => e.trim())
        .filter(Boolean)
        .map((e) => e.toLowerCase()),
    ),
  )
  if (!cleaned.includes(normalizeEmail(BOOTSTRAP_ADMIN_EMAIL))) {
    cleaned.push(normalizeEmail(BOOTSTRAP_ADMIN_EMAIL))
  }
  accounts.whitelist = cleaned
  writeAccounts(accounts)
  return accounts.whitelist
}

export function addWhitelistEmail(email: string): string[] {
  const normalized = normalizeEmail(email)
  if (!normalized.includes('@')) throw new Error('Некорректная почта')
  const accounts = readAccounts()
  if (!accounts.whitelist.map(normalizeEmail).includes(normalized)) {
    accounts.whitelist.push(normalized)
    writeAccounts(accounts)
  }
  return accounts.whitelist
}

export function removeWhitelistEmail(email: string): string[] {
  const normalized = normalizeEmail(email)
  if (normalized === normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)) {
    throw new Error('Нельзя удалить почту основного админа из whitelist')
  }
  const accounts = readAccounts()
  accounts.whitelist = accounts.whitelist.filter((e) => normalizeEmail(e) !== normalized)
  writeAccounts(accounts)
  return accounts.whitelist
}

export function setYandexToken(token: string): SettingsData {
  const settings = readSettings()
  settings.yandexToken = token.trim()
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
