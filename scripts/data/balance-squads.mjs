import fs from 'node:fs'
import path from 'node:path'

import { normalizePosition } from './shared-normalizers.mjs'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'data')

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), 'utf8'))
}

function writeJson(fileName, data) {
  fs.writeFileSync(path.join(DATA_DIR, fileName), `${JSON.stringify(data, null, 1)}\n`)
}

const CLUB_ID_ALIASES = {
  'newells-old-boys': 'newells',
  'velez-sarsfield': 'velez',
  'argentinos-juniors': 'argentinos-jrs',
}

const POSITION_GROUPS = {
  goalkeeper: new Set(['GK']),
  defense: new Set(['CB', 'LB', 'RB', 'LWB', 'RWB']),
  midfield: new Set(['CDM', 'CM', 'CAM', 'LM', 'RM']),
  attack: new Set(['LW', 'RW', 'ST', 'CF']),
}

function groupForPosition(position) {
  const normalized = normalizePosition(position)
  for (const [group, positions] of Object.entries(POSITION_GROUPS)) {
    if (positions.has(normalized)) {
      return group
    }
  }
  return 'other'
}

function countGroups(players) {
  return players.reduce((counts, player) => {
    const group = groupForPosition(player.position)
    counts[group] = (counts[group] || 0) + 1
    return counts
  }, { goalkeeper: 0, defense: 0, midfield: 0, attack: 0, other: 0 })
}

function ratingOf(player) {
  return typeof player.rating === 'number' ? player.rating : 50
}

const players = readJson('players.json')
const squads = readJson('squads.json')
const clubs = readJson('clubs.json')

const clubById = new Map(clubs.map((club) => [club.id, club]))
const playerById = new Map(players.map((player) => [player.id, player]))

const playersByClub = new Map()

for (const player of players) {
  for (const club of player.clubs || []) {
    if (!playersByClub.has(club.id)) {
      playersByClub.set(club.id, [])
    }
    playersByClub.get(club.id).push(player)
  }
}

let clubIdFixes = 0
let addedPlayers = 0

const balancedSquads = squads.map((squad) => {
  const clubId = CLUB_ID_ALIASES[squad.clubId] || squad.clubId
  if (clubId !== squad.clubId) {
    clubIdFixes += 1
  }

  const club = clubById.get(clubId)
  const currentIds = new Set(squad.playerIds || [])
  const squadPlayers = (squad.playerIds || [])
    .map((playerId) => playerById.get(playerId))
    .filter(Boolean)

  if (!club || squadPlayers.length === 0) {
    return {
      ...squad,
      clubId,
      playerIds: squad.playerIds || [],
    }
  }

  const clubPlayers = (playersByClub.get(clubId) || [])
    .slice()
    .sort((a, b) => ratingOf(b) - ratingOf(a))

  const requirements = [
    { group: 'goalkeeper', needed: 1 },
    { group: 'defense', needed: 3 },
    { group: 'midfield', needed: 3 },
    { group: 'attack', needed: 1 },
  ]

  const counts = countGroups(squadPlayers)
  const additions = []

  for (const requirement of requirements) {
    while ((counts[requirement.group] || 0) < requirement.needed) {
      const candidate = clubPlayers.find((player) => !currentIds.has(player.id) && groupForPosition(player.position) === requirement.group)
        || clubPlayers.find((player) => !currentIds.has(player.id) && player.positions?.some((position) => POSITION_GROUPS[requirement.group].has(normalizePosition(position))))

      if (!candidate) break

      currentIds.add(candidate.id)
      additions.push(candidate.id)
      counts[groupForPosition(candidate.position)] += 1
      addedPlayers += 1
    }
  }

  return {
    ...squad,
    clubId,
    playerIds: [...(squad.playerIds || []), ...additions],
  }
})

writeJson('squads.json', balancedSquads)

console.log('Squads balanced:')
console.log(`- Club IDs fixed: ${clubIdFixes}`)
console.log(`- Players appended to squads: ${addedPlayers}`)
console.log(`- Squads written: ${balancedSquads.length}`)