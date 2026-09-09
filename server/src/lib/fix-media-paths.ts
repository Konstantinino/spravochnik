import fs from 'node:fs'
import path from 'node:path'
import { bumpGlobalVersion, query } from '../db/pool.js'
import { parseMediaRelativePath, resolveExistingMediaFile } from './media-layout.js'

export interface FixMediaPathsLine {
  kind: 'missing' | 'ambiguous' | 'delete-dup' | 'fix'
  from: string
  to?: string
  legacy?: boolean
  alternatives?: string[]
}

export interface FixMediaPathsResult {
  mode: 'dry-run' | 'apply'
  mediaDir: string
  dbRows: number
  filesOnDisk: number
  alreadyOk: number
  updated: number
  deletedDuplicate: number
  ambiguous: number
  missingOnDisk: number
  lines: FixMediaPathsLine[]
  applied: boolean
}

interface DiscoveredFile {
  relativePath: string
  basename: string
  departmentId: string | null
  topicId: number | null
}

interface DbRow {
  relative_path: string
  department_id: string | null
  topic_id: number | null
}

function discoverMediaFilesOnDisk(mediaDir: string): DiscoveredFile[] {
  const out: DiscoveredFile[] = []
  const seenPaths = new Set<string>()

  function consider(absPath: string): void {
    let stat: fs.Stats
    try {
      stat = fs.statSync(absPath)
    } catch {
      return
    }
    if (!stat.isFile()) return

    const relFromRoot = path.relative(mediaDir, absPath).replace(/\\/g, '/')
    const candidates = [
      relFromRoot.startsWith('media/') ? relFromRoot : `media/${relFromRoot}`,
      relFromRoot,
    ]

    for (const rel of candidates) {
      const normalized = rel.replace(/^\/+/, '')
      if (!normalized.startsWith('media/') || seenPaths.has(normalized)) continue
      const resolved = resolveExistingMediaFile(mediaDir, normalized)
      if (!resolved || path.resolve(resolved) !== path.resolve(absPath)) continue

      const parsed = parseMediaRelativePath(normalized)
      out.push({
        relativePath: normalized,
        basename: path.basename(normalized),
        departmentId: parsed.departmentId,
        topicId: parsed.topicId,
      })
      seenPaths.add(normalized)
      return
    }
  }

  function walk(dir: string): void {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'updates') continue
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(abs)
      else consider(abs)
    }
  }

  fs.mkdirSync(mediaDir, { recursive: true })
  walk(mediaDir)
  return out
}

function indexByBasename(files: DiscoveredFile[]): Map<string, DiscoveredFile[]> {
  const map = new Map<string, DiscoveredFile[]>()
  for (const file of files) {
    const list = map.get(file.basename) ?? []
    list.push(file)
    map.set(file.basename, list)
  }
  return map
}

function isLegacyFlatPath(relativePath: string): boolean {
  const n = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (n.match(/^media\/images\/[^/]+$/)) return true
  if (n.match(/^media\/files\/[^/]+$/)) return true
  if (n.match(/^media\/[^/]+\.(png|jpe?g|gif|webp|bmp|pdf|docx?|xlsx?|zip)$/i)) return true
  if (n.match(/^media\/\d+\/(images|files)\/[^/]+$/)) return true
  return false
}

export async function fixMediaPaths(options: {
  mediaDir: string
  apply?: boolean
}): Promise<FixMediaPathsResult> {
  const apply = Boolean(options.apply)
  const mediaDir = options.mediaDir
  const lines: FixMediaPathsLine[] = []

  const onDisk = discoverMediaFilesOnDisk(mediaDir)
  const byBasename = indexByBasename(onDisk)

  const dbResult = await query<DbRow>(
    `SELECT relative_path, department_id, topic_id
       FROM media_files
      WHERE deleted_at IS NULL
      ORDER BY relative_path`,
  )

  let alreadyOk = 0
  let updated = 0
  let deletedDuplicate = 0
  let ambiguous = 0
  let missingOnDisk = 0

  for (const row of dbResult.rows) {
    const rel = row.relative_path

    if (resolveExistingMediaFile(mediaDir, rel)) {
      alreadyOk++
      continue
    }

    const basename = path.basename(rel)
    const matches = byBasename.get(basename) ?? []

    if (matches.length === 0) {
      missingOnDisk++
      lines.push({ kind: 'missing', from: rel })
      continue
    }

    if (matches.length > 1) {
      ambiguous++
      lines.push({
        kind: 'ambiguous',
        from: rel,
        alternatives: matches.map((m) => m.relativePath),
      })
      continue
    }

    const target = matches[0]
    const targetExists = await query<{ n: string }>(
      `SELECT 1 AS n FROM media_files
        WHERE relative_path = $1 AND deleted_at IS NULL AND relative_path <> $2
        LIMIT 1`,
      [target.relativePath, rel],
    )

    if (targetExists.rowCount && targetExists.rowCount > 0) {
      deletedDuplicate++
      lines.push({ kind: 'delete-dup', from: rel, to: target.relativePath })
      if (apply) {
        await query(
          `UPDATE media_files SET deleted_at = NOW(), updated_at = NOW()
            WHERE relative_path = $1 AND deleted_at IS NULL`,
          [rel],
        )
      }
      continue
    }

    updated++
    lines.push({
      kind: 'fix',
      from: rel,
      to: target.relativePath,
      legacy: isLegacyFlatPath(rel),
    })

    if (apply) {
      await query(
        `UPDATE media_files
            SET relative_path = $1,
                department_id = COALESCE($2, department_id),
                topic_id = COALESCE($3, topic_id),
                updated_at = NOW()
          WHERE relative_path = $4 AND deleted_at IS NULL`,
        [target.relativePath, target.departmentId, target.topicId, rel],
      )
    }
  }

  let applied = false
  if (apply && (updated > 0 || deletedDuplicate > 0)) {
    await bumpGlobalVersion()
    applied = true
  }

  return {
    mode: apply ? 'apply' : 'dry-run',
    mediaDir,
    dbRows: dbResult.rowCount ?? 0,
    filesOnDisk: onDisk.length,
    alreadyOk,
    updated,
    deletedDuplicate,
    ambiguous,
    missingOnDisk,
    lines,
    applied,
  }
}
