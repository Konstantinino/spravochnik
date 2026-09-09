export type SessionLogLevel = 'info' | 'warn' | 'error'

export interface SessionLogEntry {
  id: number
  at: string
  level: SessionLogLevel
  tag: string
  message: string
}

const MAX_ENTRIES = 300

let nextId = 1
const entries: SessionLogEntry[] = []
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

export function appendSessionLog(
  level: SessionLogLevel,
  tag: string,
  message: string,
): SessionLogEntry {
  const entry: SessionLogEntry = {
    id: nextId++,
    at: new Date().toISOString(),
    level,
    tag,
    message: message.trim(),
  }
  entries.push(entry)
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES)
  }
  notify()
  return entry
}

export function getSessionLogs(): SessionLogEntry[] {
  return [...entries]
}

export function clearSessionLogs(): void {
  entries.length = 0
  notify()
}

export function onSessionLog(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function formatSessionLogLine(entry: SessionLogEntry): string {
  const time = new Date(entry.at).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `[${time}] ${entry.level.toUpperCase()} ${entry.tag}: ${entry.message}`
}
