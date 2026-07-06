import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'data')

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), 'utf8'))
}

function writeJson(fileName, data) {
  fs.writeFileSync(path.join(DATA_DIR, fileName), `${JSON.stringify(data, null, 1)}\n`)
}

function normalizeSeason(season) {
  const year = Number.parseInt(String(season), 10)
  return Number.isFinite(year) ? year : null
}

function buildRangeYears(years) {
  const sorted = years.map(normalizeSeason).filter((year) => year !== null).sort((a, b) => a - b)
  if (sorted.length === 0) return ''
  if (sorted.length === 1) return String(sorted[0])
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return first === last ? String(first) : `${first}-${last}`
}

function inferDecadeFromYears(yearsText) {
  const match = String(yearsText).match(/\b(18|19|20)\d{2}\b/)
  if (!match) return ''
  const year = Number.parseInt(match[0], 10)
  if (!Number.isFinite(year)) return ''
  return `${Math.floor(year / 10) * 10}s`
}

function inferDecadeFromBirthDate(birthDate) {
  const match = String(birthDate).match(/^\d{4}/)
  if (!match) return ''
  const year = Number.parseInt(match[0], 10)
  if (!Number.isFinite(year)) return ''
  return `${Math.floor(year / 10) * 10}s`
}

const players = readJson('players.json')
const squads = readJson('squads.json')
const clubs = readJson('clubs.json')

const clubById = new Map(clubs.map((club) => [club.id, club]))
const playerById = new Map(players.map((player, index) => [player.id, { player, index }]))
const seasonsByPlayer = new Map()

const ratingOverrides = {
  'maradona-diego-1960': 98,
  'messi-lionel-1987': 99,
  'batistuta-gabriel-1969': 92,
  'di-maria-angel-1988': 90,
}

let updatedPlayers = 0

for (const squad of squads) {
  const club = clubById.get(squad.clubId)
  if (!club || !Array.isArray(squad.playerIds)) continue

  for (const playerId of squad.playerIds) {
    const entry = playerById.get(playerId)
    if (!entry) continue

    const { player } = entry
    const clubsList = Array.isArray(player.clubs) ? player.clubs : []
    const alreadyHasClub = clubsList.some((clubEntry) => clubEntry && clubEntry.id === club.id)

    if (!alreadyHasClub) {
      clubsList.push({
        id: club.id,
        name: club.name,
        years: String(squad.season || ''),
      })
      player.clubs = clubsList
      updatedPlayers += 1
    }

    if (!seasonsByPlayer.has(playerId)) {
      seasonsByPlayer.set(playerId, [])
    }
    seasonsByPlayer.get(playerId).push(squad.season)
  }
}

for (const { player } of playerById.values()) {
  const overrideRating = ratingOverrides[player.id]
  if (typeof overrideRating === 'number') {
    player.rating = overrideRating
    player.legendary = true
  }

  if (!Array.isArray(player.clubs) || player.clubs.length === 0) {
    continue
  }

  const clubYears = player.clubs
    .map((clubEntry) => clubEntry && clubEntry.years)
    .filter(Boolean)
  const inferredRange = buildRangeYears(clubYears)

  if ((!player.activeYears || player.activeYears === 'N/D') && inferredRange) {
    player.activeYears = inferredRange
  }

  if (!player.decade || player.decade === 'N/D') {
    const decade = inferDecadeFromBirthDate(player.birthDate) || inferDecadeFromYears(player.activeYears || inferredRange)
    if (decade) {
      player.decade = decade
    }
  }
}

for (const [playerId, seasons] of seasonsByPlayer.entries()) {
  const entry = playerById.get(playerId)
  if (!entry) continue

  const { player } = entry
  const years = buildRangeYears(seasons)
  if (years && (!player.activeYears || player.activeYears === 'N/D')) {
    player.activeYears = years
  }

  if ((!player.decade || player.decade === 'N/D') && years) {
    const decade = inferDecadeFromBirthDate(player.birthDate) || inferDecadeFromYears(years)
    if (decade) {
      player.decade = decade
    }
  }
}

const enrichedPlayers = players
  .map((player) => playerById.get(player.id)?.player || player)

writeJson('players.json', enrichedPlayers)

const filledRatings = Object.keys(ratingOverrides).filter((playerId) => playerById.has(playerId)).length

console.log('Player dataset curated:')
console.log(`- Clubs backfilled: ${updatedPlayers}`)
console.log(`- Manual ratings set: ${filledRatings}`)
console.log(`- Players written: ${enrichedPlayers.length}`)