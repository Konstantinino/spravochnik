/// <reference types="vite/client" />

import type {
  GuideItem,
  DepartmentId,
  GuideFile,
  PublicUser,
  SyncStatus,
  UserRole,
} from './types'

export interface SpravochnikApi {
  getDepartments: () => Promise<{ id: DepartmentId; label: string; fileName: string }[]>
  loadGuide: (departmentId: DepartmentId) => Promise<GuideFile>
  saveItem: (payload: {
    departmentId: DepartmentId
    item: Omit<GuideItem, 'id'> & { id?: number }
  }) => Promise<GuideFile>
  updateItem: (payload: {
    departmentId: DepartmentId
    item: GuideItem
  }) => Promise<GuideFile>
  pickAndSaveImage: () => Promise<{ markdownPath: string; url: string } | null>
  resolveMediaUrl: (relativePath: string) => Promise<string>
  getDataPath: () => Promise<string>

  getCurrentUser: () => Promise<PublicUser | null>
  login: (payload: {
    email: string
    password: string
    rememberMe?: boolean
  }) => Promise<PublicUser>
  register: (payload: {
    name: string
    email: string
    password: string
    passwordConfirm: string
    rememberMe?: boolean
  }) => Promise<PublicUser>
  logout: () => Promise<null>

  listUsers: () => Promise<PublicUser[]>
  setUserRole: (payload: { userId: string; role: UserRole }) => Promise<PublicUser[]>
  getWhitelist: () => Promise<string[]>
  setWhitelist: (emails: string[]) => Promise<string[]>
  addWhitelist: (email: string) => Promise<string[]>
  removeWhitelist: (email: string) => Promise<string[]>
  getAdminSettings: () => Promise<{ hasPendingChanges: boolean; hasToken: boolean }>
  setYandexToken: (token: string) => Promise<{ hasToken: boolean; hasPendingChanges: boolean }>
  getTokenMasked: () => Promise<{ hasToken: boolean; masked: string }>
  hasYandexToken: () => Promise<{ hasToken: boolean }>

  getSyncStatus: () => Promise<SyncStatus>
  pullSync: () => Promise<SyncStatus>
  discardSync: () => Promise<SyncStatus>
  pushSync: () => Promise<SyncStatus>
  onSyncStatus: (callback: (status: SyncStatus) => void) => () => void

  deleteItem: (payload: { departmentId: DepartmentId; id: number }) => Promise<GuideFile>
}

declare global {
  interface Window {
    spravochnik: SpravochnikApi
  }
}

export {}
