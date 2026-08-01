import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('spravochnik', {
  getDepartments: () => ipcRenderer.invoke('get-departments'),
  loadGuide: (departmentId: string) => ipcRenderer.invoke('load-guide', departmentId),
  saveItem: (payload: unknown) => ipcRenderer.invoke('save-item', payload),
  updateItem: (payload: unknown) => ipcRenderer.invoke('update-item', payload),
  pickAndSaveImage: () => ipcRenderer.invoke('pick-and-save-image'),
  resolveMediaUrl: (relativePath: string) =>
    ipcRenderer.invoke('resolve-media-url', relativePath),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),

  getCurrentUser: () => ipcRenderer.invoke('auth:current-user'),
  login: (payload: unknown) => ipcRenderer.invoke('auth:login', payload),
  register: (payload: unknown) => ipcRenderer.invoke('auth:register', payload),
  logout: () => ipcRenderer.invoke('auth:logout'),

  listUsers: () => ipcRenderer.invoke('admin:list-users'),
  setUserRole: (payload: unknown) => ipcRenderer.invoke('admin:set-role', payload),
  getWhitelist: () => ipcRenderer.invoke('admin:get-whitelist'),
  setWhitelist: (emails: string[]) => ipcRenderer.invoke('admin:set-whitelist', emails),
  addWhitelist: (email: string) => ipcRenderer.invoke('admin:add-whitelist', email),
  removeWhitelist: (email: string) => ipcRenderer.invoke('admin:remove-whitelist', email),
  getAdminSettings: () => ipcRenderer.invoke('admin:get-settings'),

  setYandexToken: (token: string) => ipcRenderer.invoke('sync:set-token', token),
  getTokenMasked: () => ipcRenderer.invoke('sync:get-token-masked'),
  hasYandexToken: () => ipcRenderer.invoke('sync:has-token'),

  getSyncStatus: () => ipcRenderer.invoke('sync:status'),
  pullSync: () => ipcRenderer.invoke('sync:pull'),
  discardSync: () => ipcRenderer.invoke('sync:discard'),
  pushSync: () => ipcRenderer.invoke('sync:push'),
  onSyncStatus: (callback: (status: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: unknown) => callback(status)
    ipcRenderer.on('sync:status-changed', listener)
    return () => ipcRenderer.removeListener('sync:status-changed', listener)
  },

  deleteItem: (payload: unknown) => ipcRenderer.invoke('delete-item', payload),
})
