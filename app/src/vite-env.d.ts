/// <reference types="vite/client" />

import type { GuideItem, DepartmentId, GuideFile } from './types'

export interface SpravochnikApi {
  getDepartments: () => Promise<{ id: DepartmentId; label: string; fileName: string }[]>
  loadGuide: (departmentId: DepartmentId) => Promise<GuideFile>
  saveItem: (payload: {
    departmentId: DepartmentId
    item: Omit<GuideItem, 'id'> & { id?: number }
  }) => Promise<GuideFile>
  pickAndSaveImage: () => Promise<{ markdownPath: string; url: string } | null>
  resolveMediaUrl: (relativePath: string) => Promise<string>
  getDataPath: () => Promise<string>
}

declare global {
  interface Window {
    spravochnik: SpravochnikApi
  }
}

export {}
