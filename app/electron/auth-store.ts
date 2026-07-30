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
}

export interface SessionData {
  userId: string
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
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

export function resolveRoleForEmail(email: string): UserRole {
  if (normalizeEmail(email) === normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)) {
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

  // If bootstrap admin registers later but someone else was admin-only via role change, still force admin
  if (normalizeEmail(email) === normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)) {
    user.role = 'admin'
  }

  accounts.users.push(user)
  writeAccounts(accounts)
  writeSession(user.id)
  return toPublicUser(user)
}

export function loginUser(input: { email: string; password: string }): PublicUser {
  const email = normalizeEmail(input.email)
  const accounts = readAccounts()
  const user = accounts.users.find((u) => normalizeEmail(u.email) === email)
  if (!user || !verifyPassword(input.password, user.salt, user.passwordHash)) {
    throw new Error('Неверная почта или пароль')
  }
  writeSession(user.id)
  return toPublicUser(user)
}

export function writeSession(userId: string): void {
  const data: SessionData = { userId }
  fs.writeFileSync(sessionPath(), JSON.stringify(data, null, 2), 'utf8')
}

export function clearSession(): void {
  if (fs.existsSync(sessionPath())) fs.unlinkSync(sessionPath())
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
  const accounts = readAccounts()
  const user = accounts.users.find((u) => u.id === userId)
  if (!user) throw new Error('Пользователь не найден')

  if (
    normalizeEmail(user.email) === normalizeEmail(BOOTSTRAP_ADMIN_EMAIL) &&
    role !== 'admin'
  ) {
    throw new Error('Нельзя снять роль админа с основной учётной записи')
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
