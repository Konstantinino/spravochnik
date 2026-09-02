import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { exportForServer } from './export-for-server.js'

const defaultSource = path.join(
  process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'),
  'rest-info',
  'REST-INFO',
)

const sourceDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultSource
const destDir = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(process.cwd(), 'REST-INFO-export')

if (!fs.existsSync(sourceDir)) {
  console.error(`Source directory not found: ${sourceDir}`)
  process.exit(1)
}

const manifest = exportForServer(destDir, sourceDir)
console.log(`Export saved to: ${destDir}`)
console.log(JSON.stringify(manifest, null, 2))
