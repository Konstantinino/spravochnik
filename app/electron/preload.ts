import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('spravochnik', {
  getDepartments: () => ipcRenderer.invoke('get-departments'),
  loadGuide: (departmentId: string) => ipcRenderer.invoke('load-guide', departmentId),
  saveItem: (payload: unknown) => ipcRenderer.invoke('save-item', payload),
  pickAndSaveImage: () => ipcRenderer.invoke('pick-and-save-image'),
  resolveMediaUrl: (relativePath: string) =>
    ipcRenderer.invoke('resolve-media-url', relativePath),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
})
