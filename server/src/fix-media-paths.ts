/**
 * Fix legacy media_files.relative_path values (CLI on server).
 *
 * Usage:
 *   node dist/fix-media-paths.js              # dry-run
 *   node dist/fix-media-paths.js --apply      # apply
 *
 * From Windows (after server update): app/scripts/fix-media-paths.js
 */
import path from 'node:path'
import { fixMediaPaths, type FixMediaPathsLine } from './lib/fix-media-paths.js'
import { runMigrations } from './migrate.js'

const MEDIA_DIR = process.env.MEDIA_DIR ?? path.join(process.cwd(), 'data', 'media')

function printLine(line: FixMediaPathsLine): void {
  if (line.kind === 'missing') {
    console.log(`  MISSING  ${line.from}`)
    return
  }
  if (line.kind === 'ambiguous') {
    console.log(`  AMBIGUOUS ${line.from}`)
    for (const alt of line.alternatives ?? []) console.log(`            → ${alt}`)
    return
  }
  if (line.kind === 'delete-dup') {
    console.log(`  DELETE-DUP ${line.from}`)
    console.log(`             (correct row already exists: ${line.to})`)
    return
  }
  const tag = line.legacy ? 'legacy' : 'broken'
  console.log(`  FIX ${tag}  ${line.from}`)
  console.log(`       → ${line.to}`)
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  console.log(`REST INFO — fix media paths [${apply ? 'APPLY' : 'DRY-RUN'}]`)
  console.log(`MEDIA_DIR: ${MEDIA_DIR}`)
  console.log('')

  await runMigrations()
  const result = await fixMediaPaths({ mediaDir: MEDIA_DIR, apply })

  console.log(`Files on disk (indexed): ${result.filesOnDisk}`)
  for (const line of result.lines) printLine(line)

  console.log('')
  console.log('Summary:')
  console.log(`  DB rows (active):     ${result.dbRows}`)
  console.log(`  Already OK:           ${result.alreadyOk}`)
  console.log(`  Would update path:    ${result.updated}`)
  console.log(`  Would delete dup:     ${result.deletedDuplicate}`)
  console.log(`  Ambiguous (manual):   ${result.ambiguous}`)
  console.log(`  Missing on disk:      ${result.missingOnDisk}`)

  if (result.applied) {
    console.log('')
    console.log('Done. global_version bumped — clients will pull updated media list on next sync.')
  } else if (!apply && (result.updated > 0 || result.deletedDuplicate > 0)) {
    console.log('')
    console.log('This was a preview. To apply fixes, run:')
    console.log('  node dist/fix-media-paths.js --apply')
  } else if (!apply) {
    console.log('')
    console.log('Nothing to fix.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
