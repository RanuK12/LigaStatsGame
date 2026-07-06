import fs from 'node:fs'
import path from 'node:path'
import {
  normalizePlayers,
  normalizeSquads,
  normalizeClubs,
} from './shared-normalizers.mjs'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'data')
const CURATED_DIR = path.join(DATA_DIR, 'curated')

function readJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(fileName, data) {
  const filePath = path.join(CURATED_DIR, fileName)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  return filePath
}

fs.mkdirSync(CURATED_DIR, { recursive: true })

const players = normalizePlayers(readJson('players.json'))
const squads = normalizeSquads(readJson('squads.json'))
const clubs = normalizeClubs(readJson('clubs.json'))

const playersPath = writeJson('players.normalized.json', players)
const squadsPath = writeJson('squads.normalized.json', squads)
const clubsPath = writeJson('clubs.normalized.json', clubs)

console.log('Normalized dataset written:')
console.log(`- ${path.relative(ROOT, playersPath)}`)
console.log(`- ${path.relative(ROOT, squadsPath)}`)
console.log(`- ${path.relative(ROOT, clubsPath)}`)
