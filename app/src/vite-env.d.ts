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
  login: (payload: { email: string; password: string }) => Promise<PublicUser>
  register: (payload: {
    name: string
    email: string
    password: string
    passwordConfirm: string
  }) => Promise<PublicUser>
  logout: () => Promise<null>

  listUsers: () => Promise<PublicUser[]>
  setUserRole: (payload: { userId: string; role: UserRole }) => Promise<PublicUser[]>
  getWhitelist: () => Promise<string[]>
  setWhitelist: (emails: string[]) => Promise<string[]>
  addWhitelist: (email: string) => Promise<string[]>
  removeWhitelist: (email: string) => Promise<string[]>
  getAdminSettings: () => Promise<{ yandexToken: string; hasPendingChanges: boolean }>
  setYandexToken: (token: string) => Promise<{ yandexToken: string; hasPendingChanges: boolean }>

  getSyncStatus: () => Promise<SyncStatus>
  pullSync: () => Promise<SyncStatus>
  pushSync: () => Promise<SyncStatus>
  onSyncStatus: (callback: (status: SyncStatus) => void) => () => void
}

declare global {
  interface Window {
    spravochnik: SpravochnikApi
  }
}

export {}
