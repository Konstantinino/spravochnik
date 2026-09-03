import fs from 'node:fs'
import path from 'node:path'
import { PENDING_OPERATIONS_FILE, getUserDataRoot } from './paths'

export type OperationType =
  | 'create_topic'
  | 'update_topic'
  | 'delete_topic'
  | 'set_user_role'
  | 'delete_user'
  | 'transfer_ownership'
  | 'update_user'
  | 'set_whitelist'
  | 'add_whitelist'
  | 'remove_whitelist'
  | 'register_user'

export interface PendingOperation {
  id: string
  type: OperationType
  departmentId?: string
  payload: Record<string, unknown>
  createdAt: string
  /** Expected server version for update_topic conflicts */
  expectedVersion?: number
}

export interface PendingOperationsData {
  operations: PendingOperation[]
}

function opsPath(): string {
  return path.join(getUserDataRoot(), PENDING_OPERATIONS_FILE)
}

export function readPendingOperations(): PendingOperationsData {
  try {
    const raw = JSON.parse(fs.readFileSync(opsPath(), 'utf8')) as PendingOperationsData
    return { operations: Array.isArray(raw.operations) ? raw.operations : [] }
  } catch {
    return { operations: [] }
  }
}

export function writePendingOperations(data: PendingOperationsData): void {
  fs.writeFileSync(opsPath(), JSON.stringify(data, null, 2), 'utf8')
}

export function clearPendingOperations(): void {
  writePendingOperations({ operations: [] })
}

export function queueOperation(op: Omit<PendingOperation, 'id' | 'createdAt'>): void {
  const data = readPendingOperations()
  data.operations.push({
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  })
  writePendingOperations(data)
}

export function removeOperation(id: string): void {
  const data = readPendingOperations()
  data.operations = data.operations.filter((o) => o.id !== id)
  writePendingOperations(data)
}

export function hasPendingOperations(): boolean {
  return readPendingOperations().operations.length > 0
}
