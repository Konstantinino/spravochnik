/// <reference types="vite/client" />



import type {

  GuideItem,

  DepartmentId,

  GuideFile,

  PublicUser,

  SyncStatus,

  UpdateInfo,

  LatestReleaseInfo,

  UserRole,

  ConflictResolution,

} from './types'



export interface SpravochnikApi {

  getDepartments: () => Promise<{ id: DepartmentId; label: string; fileName: string }[]>

  loadGuide: (departmentId: DepartmentId) => Promise<GuideFile>

  saveItem: (payload: {

    departmentId: DepartmentId

    draftId?: string

    item: Omit<GuideItem, 'id'> & { id?: number }

  }) => Promise<GuideFile>

  updateItem: (payload: {

    departmentId: DepartmentId

    item: GuideItem

  }) => Promise<GuideFile>

  pickAndSaveImage: () => Promise<{ markdownPath: string; url: string } | null>

  saveTopicImage: (payload: {

    topicId?: number

    draftId?: string

  }) => Promise<{ markdownPath: string; url: string; relativeFsPath: string } | null>

  saveTopicImageFromClipboard: (payload: {

    topicId?: number

    draftId?: string

  }) => Promise<{ markdownPath: string; url: string; relativeFsPath: string } | null>

  resolveMediaUrl: (relativePath: string, topicId?: number) => Promise<string>

  downloadMediaImage: (resolvedSrc: string) => Promise<{

    ok: boolean

    error?: string

    canceled?: boolean

    path?: string

  }>

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

  updateUser: (payload: {
    userId: string
    name: string
    password?: string
  }) => Promise<PublicUser[]>

  deleteUser: (userId: string) => Promise<PublicUser[]>

  getWhitelist: () => Promise<string[]>

  setWhitelist: (emails: string[]) => Promise<string[]>

  addWhitelist: (email: string) => Promise<string[]>

  removeWhitelist: (email: string) => Promise<string[]>

  getAdminSettings: () => Promise<{

    hasPendingChanges: boolean

    hasToken: boolean

    hasServer: boolean

    serverUrl: string

    ownerEmail: string

  }>



  setServerUrl: (url: string) => Promise<{ serverUrl: string }>

  getServerUrl: () => Promise<{ serverUrl: string }>

  hasServer: () => Promise<{ hasServer: boolean }>

  /** @deprecated legacy Yandex Disk */

  setYandexToken: (token: string) => Promise<{ hasToken: boolean; hasPendingChanges: boolean }>

  getTokenMasked: () => Promise<{ hasToken: boolean; masked: string }>

  hasYandexToken: () => Promise<{ hasToken: boolean }>



  getSyncStatus: () => Promise<SyncStatus>

  pullSync: () => Promise<SyncStatus>

  discardSync: () => Promise<SyncStatus>

  pushSync: () => Promise<SyncStatus>

  resolveSyncConflicts: (resolutions: ConflictResolution[]) => Promise<SyncStatus>

  lockTopic: (payload: { departmentId: DepartmentId; topicId: number }) => Promise<{ ok: boolean }>

  unlockTopic: (payload: { departmentId: DepartmentId; topicId: number }) => Promise<{ ok: boolean }>

  renewTopicLock: (payload: {

    departmentId: DepartmentId

    topicId: number

  }) => Promise<{ ok: boolean }>

  onSyncStatus: (callback: (status: SyncStatus) => void) => () => void



  getUpdateStatus: () => Promise<UpdateInfo>

  checkForUpdates: () => Promise<UpdateInfo>

  downloadUpdate: () => Promise<{

    ok: boolean

    error?: string

    canceled?: boolean

    path?: string

  }>

  getLatestRelease: () => Promise<LatestReleaseInfo>

  downloadLatestRelease: () => Promise<{

    ok: boolean

    error?: string

    canceled?: boolean

    path?: string

  }>

  onUpdateStatus: (callback: (info: UpdateInfo) => void) => () => void



  deleteItem: (payload: { departmentId: DepartmentId; id: number }) => Promise<GuideFile>

}



declare global {

  interface Window {

    spravochnik: SpravochnikApi

  }

}



export {}

