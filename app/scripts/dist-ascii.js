/**
 * Builds the NSIS installer from an ASCII-only path.
 * NSIS fails when the project path contains non-ASCII characters (e.g. Cyrillic).
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const asciiRoot = 'C:\\spravochnik-build\\app'
const releaseSrc = path.join(asciiRoot, 'release')
const releaseDst = path.join(projectRoot, 'release')

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dst, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

console.log('Preparing ASCII build directory...')
fs.rmSync(asciiRoot, { recursive: true, force: true })
fs.mkdirSync(path.dirname(asciiRoot), { recursive: true })

const skip = new Set(['node_modules', 'release', 'dist', 'dist-electron', '.git'])
function mirror(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const from = path.join(src, entry.name)
    const to = path.join(dst, entry.name)
    if (entry.isDirectory()) mirror(from, to)
    else fs.copyFileSync(from, to)
  }
}

mirror(projectRoot, asciiRoot)

// Reuse existing node_modules via junction to save time/space
const nmSrc = path.join(projectRoot, 'node_modules')
const nmDst = path.join(asciiRoot, 'node_modules')
if (fs.existsSync(nmSrc) && !fs.existsSync(nmDst)) {
  fs.symlinkSync(nmSrc, nmDst, 'junction')
}

console.log('Building installer...')
execSync('npm run dist', { cwd: asciiRoot, stdio: 'inherit', shell: true })

console.log('Copying release artifacts back...')
fs.rmSync(releaseDst, { recursive: true, force: true })
copyDir(releaseSrc, releaseDst)
const version = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
).version
console.log('Done:', path.join(releaseDst, `REST-INFO-Setup-${version}.exe`))
