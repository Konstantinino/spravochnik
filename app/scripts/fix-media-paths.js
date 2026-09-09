#!/usr/bin/env node
/**
 * One-time fix for legacy media paths on the server (same auth as upload-release.js).
 *
 * Usage:
 *   node scripts/fix-media-paths.js [serverUrl] [adminToken]       # preview
 *   node scripts/fix-media-paths.js --apply [serverUrl] [adminToken]
 *
 * Or set RESTINFO_SERVER_URL and RESTINFO_ADMIN_TOKEN.
 */
const args = process.argv.slice(2)
const apply = args.includes('--apply')
const positional = args.filter((a) => a !== '--apply')
const serverUrl = (positional[0] || process.env.RESTINFO_SERVER_URL || '').replace(/\/+$/, '')
const adminToken = positional[1] || process.env.RESTINFO_ADMIN_TOKEN || ''

if (!serverUrl || !adminToken) {
  console.error('Usage: node scripts/fix-media-paths.js [--apply] [serverUrl] [adminToken]')
  console.error('Or set RESTINFO_SERVER_URL and RESTINFO_ADMIN_TOKEN')
  process.exit(1)
}

function printLine(line) {
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

async function main() {
  console.log(`REST INFO — fix media paths [${apply ? 'APPLY' : 'DRY-RUN'}]`)
  console.log(`Server: ${serverUrl}`)
  console.log('')

  const res = await fetch(`${serverUrl}/admin/fix-media-paths`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apply }),
  })

  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    console.error(`HTTP ${res.status}: ${text}`)
    process.exit(1)
  }

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${data.error || text}`)
    process.exit(1)
  }

  console.log(`Files on disk (indexed): ${data.filesOnDisk}`)
  for (const line of data.lines ?? []) printLine(line)

  console.log('')
  console.log('Summary:')
  console.log(`  DB rows (active):     ${data.dbRows}`)
  console.log(`  Already OK:           ${data.alreadyOk}`)
  console.log(`  Would update path:    ${data.updated}`)
  console.log(`  Would delete dup:     ${data.deletedDuplicate}`)
  console.log(`  Ambiguous (manual):   ${data.ambiguous}`)
  console.log(`  Missing on disk:      ${data.missingOnDisk}`)

  if (data.applied) {
    console.log('')
    console.log('Done. Нажмите «Синхронизировать» в REST INFO — ошибки должны пропасть.')
  } else if (!apply && (data.updated > 0 || data.deletedDuplicate > 0)) {
    console.log('')
    console.log('Это был предпросмотр. Чтобы применить:')
    console.log('  node scripts/fix-media-paths.js --apply')
  } else if (!apply) {
    console.log('')
    console.log('Ничего исправлять не нужно.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
