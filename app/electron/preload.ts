import { contextBridge, ipcRenderer } from 'electron'



contextBridge.exposeInMainWorld('spravochnik', {

  getDepartments: () => ipcRenderer.invoke('get-departments'),

  loadGuide: (departmentId: string) => ipcRenderer.invoke('load-guide', departmentId),

  saveItem: (payload: unknown) => ipcRenderer.invoke('save-item', payload),

  updateItem: (payload: unknown) => ipcRenderer.invoke('update-item', payload),

  pickAndSaveImage: () => ipcRenderer.invoke('pick-and-save-image'),

  saveTopicImage: (payload: unknown) => ipcRenderer.invoke('save-topic-image', payload),

  saveTopicImageFromClipboard: (payload: unknown) =>

    ipcRenderer.invoke('save-topic-image-clipboard', payload),

  resolveMediaUrl: (relativePath: string, topicId?: number) =>

    ipcRenderer.invoke('resolve-media-url', relativePath, topicId),

  downloadMediaImage: (resolvedSrc: string) => ipcRenderer.invoke('media:download', resolvedSrc),

  getDataPath: () => ipcRenderer.invoke('get-data-path'),



  getCurrentUser: () => ipcRenderer.invoke('auth:current-user'),

  login: (payload: unknown) => ipcRenderer.invoke('auth:login', payload),

  register: (payload: unknown) => ipcRenderer.invoke('auth:register', payload),

  logout: () => ipcRenderer.invoke('auth:logout'),



  listUsers: () => ipcRenderer.invoke('admin:list-users'),

  setUserRole: (payload: unknown) => ipcRenderer.invoke('admin:set-role', payload),

  updateUser: (payload: unknown) => ipcRenderer.invoke('admin:update-user', payload),

  deleteUser: (userId: string) => ipcRenderer.invoke('admin:delete-user', userId),

  getWhitelist: () => ipcRenderer.invoke('admin:get-whitelist'),

  setWhitelist: (emails: string[]) => ipcRenderer.invoke('admin:set-whitelist', emails),

  addWhitelist: (email: string) => ipcRenderer.invoke('admin:add-whitelist', email),

  removeWhitelist: (email: string) => ipcRenderer.invoke('admin:remove-whitelist', email),

  getAdminSettings: () => ipcRenderer.invoke('admin:get-settings'),



  setServerUrl: (url: string) => ipcRenderer.invoke('sync:set-server-url', url),

  getServerUrl: () => ipcRenderer.invoke('sync:get-server-url'),

  hasServer: () => ipcRenderer.invoke('sync:has-server'),

  setYandexToken: (token: string) => ipcRenderer.invoke('sync:set-token', token),

  getTokenMasked: () => ipcRenderer.invoke('sync:get-token-masked'),

  hasYandexToken: () => ipcRenderer.invoke('sync:has-token'),



  getSyncStatus: () => ipcRenderer.invoke('sync:status'),

  pullSync: () => ipcRenderer.invoke('sync:pull'),

  discardSync: () => ipcRenderer.invoke('sync:discard'),

  pushSync: () => ipcRenderer.invoke('sync:push'),

  resolveSyncConflicts: (resolutions: unknown) =>

    ipcRenderer.invoke('sync:resolve-conflicts', resolutions),

  lockTopic: (payload: unknown) => ipcRenderer.invoke('sync:lock-topic', payload),

  unlockTopic: (payload: unknown) => ipcRenderer.invoke('sync:unlock-topic', payload),

  renewTopicLock: (payload: unknown) => ipcRenderer.invoke('sync:renew-lock', payload),

  onSyncStatus: (callback: (status: unknown) => void) => {

    const listener = (_event: Electron.IpcRendererEvent, status: unknown) => callback(status)

    ipcRenderer.on('sync:status-changed', listener)

    return () => ipcRenderer.removeListener('sync:status-changed', listener)

  },



  getUpdateStatus: () => ipcRenderer.invoke('updates:status'),

  checkForUpdates: () => ipcRenderer.invoke('updates:check'),

  downloadUpdate: () => ipcRenderer.invoke('updates:download'),

  getLatestRelease: () => ipcRenderer.invoke('updates:latest'),

  downloadLatestRelease: () => ipcRenderer.invoke('updates:download-latest'),

  onUpdateStatus: (callback: (info: unknown) => void) => {

    const listener = (_event: Electron.IpcRendererEvent, info: unknown) => callback(info)

    ipcRenderer.on('updates:status-changed', listener)

    return () => ipcRenderer.removeListener('updates:status-changed', listener)

  },



  deleteItem: (payload: unknown) => ipcRenderer.invoke('delete-item', payload),

})

