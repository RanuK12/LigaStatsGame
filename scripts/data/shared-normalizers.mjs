const VALID_POSITIONS = new Set([
  'GK',
  'CB',
  'LB',
  'RB',
  'CDM',
  'CM',
  'CAM',
  'LW',
  'RW',
  'ST',
  'CF',
  'LM',
  'RM',
  'LWB',
  'RWB',
])

const POSITION_ALIASES = {
  Arquero: 'GK',
  Portero: 'GK',
  Goalkeeper: 'GK',
  Defensor: 'CB',
  Defensa: 'CB',
  'Defensa central': 'CB',
  'Marcador central': 'CB',
  'Centre-Back': 'CB',
  CentreBack: 'CB',
  'Lateral izquierdo': 'LB',
  'Left-Back': 'LB',
  LeftBack: 'LB',
  'Lateral derecho': 'RB',
  'Right-Back': 'RB',
  RightBack: 'RB',
  Mediocampista: 'CM',
  Volante: 'CM',
  'Central Midfield': 'CM',
  CentralMidfield: 'CM',
  'Volante central': 'CDM',
  'Volante defensivo': 'CDM',
  'Defensive Midfield': 'CDM',
  DefensiveMidfield: 'CDM',
  Enganche: 'CAM',
  Mediapunta: 'CAM',
  'Attacking Midfield': 'CAM',
  AttackingMidfield: 'CAM',
  Delantero: 'ST',
  Centrodelantero: 'ST',
  'Centre-Forward': 'ST',
  CentreForward: 'ST',
  Extremo: 'RW',
  'Extremo derecho': 'RW',
  'Right Winger': 'RW',
  RightWinger: 'RW',
  'Extremo izquierdo': 'LW',
  'Left Winger': 'LW',
  LeftWinger: 'LW',
  Puntero: 'RW',
  'Puntero derecho': 'RW',
  'Puntero izquierdo': 'LW',
  'Second Striker': 'CF',
  SecondStriker: 'CF',
}

function toStringValue(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function toNumberValue(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toArrayValue(value) {
  return Array.isArray(value) ? value : []
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))]
}

function normalizePosition(input) {
  if (typeof input !== 'string') return 'CM'

  const trimmed = input.trim()
  if (!trimmed) return 'CM'

  if (VALID_POSITIONS.has(trimmed)) return trimmed
  return POSITION_ALIASES[trimmed] || trimmed
}

function isValidPosition(position) {
  return VALID_POSITIONS.has(position)
}

function inferDecadeFromYears(activeYears, existingDecade) {
  if (typeof existingDecade === 'string' && /\d{4}s/.test(existingDecade)) {
    return existingDecade
  }

  if (typeof activeYears !== 'string') return 'N/D'

  const years = activeYears.match(/\b(18|19|20)\d{2}\b/g)
  if (!years || years.length === 0) return 'N/D'

  const firstYear = Number(years[0])
  if (!Number.isFinite(firstYear)) return 'N/D'

  const decadeStart = Math.floor(firstYear / 10) * 10
  return `${decadeStart}s`
}

function normalizePlayer(input) {
  const player = input && typeof input === 'object' ? input : {}
  const name = toStringValue(player.name, '')
  const fullName = toStringValue(player.fullName, name)
  const rawPositions = toArrayValue(player.positions).map((value) => normalizePosition(value))
  const filteredPositions = uniqueStrings(rawPositions.filter((value) => isValidPosition(value)))
  const positionCandidate = normalizePosition(player.position || filteredPositions[0] || 'CM')

  return {
    id: toStringValue(player.id, ''),
    name,
    fullName,
    birthDate: toStringValue(player.birthDate, ''),
    position: isValidPosition(positionCandidate) ? positionCandidate : 'CM',
    positions: filteredPositions.length > 0 ? filteredPositions : [isValidPosition(positionCandidate) ? positionCandidate : 'CM'],
    nationality: toStringValue(player.nationality, 'Argentina'),
    height: toNumberValue(player.height, 175),
    weight: toNumberValue(player.weight, 75),
    preferredFoot: toStringValue(player.preferredFoot, 'N/D'),
    clubs: toArrayValue(player.clubs)
      .filter((club) => club && typeof club.id === 'string' && typeof club.name === 'string')
      .map((club) => ({
        id: toStringValue(club.id, ''),
        name: toStringValue(club.name, ''),
        years: toStringValue(club.years, ''),
      })),
    capsNationalTeam: toNumberValue(player.capsNationalTeam, 0),
    goalsNationalTeam: toNumberValue(player.goalsNationalTeam, 0),
    capsClub: toNumberValue(player.capsClub, 0),
    goalsClub: toNumberValue(player.goalsClub, 0),
    assistsClub: toNumberValue(player.assistsClub, 0),
    trophies: toArrayValue(player.trophies)
      .filter((trophy) => trophy && typeof trophy.competition === 'string' && typeof trophy.year === 'string')
      .map((trophy) => ({
        competition: toStringValue(trophy.competition, ''),
        year: toStringValue(trophy.year, ''),
        club: toStringValue(trophy.club, ''),
      })),
    image: toStringValue(player.image, ''),
    marketValue: toStringValue(player.marketValue, 'N/D'),
    activeYears: toStringValue(player.activeYears, 'N/D'),
    decade: inferDecadeFromYears(player.activeYears, player.decade),
    rating: toNumberValue(player.rating, 70),
    legendary: Boolean(player.legendary),
  }
}

function normalizePlayers(input) {
  return toArrayValue(input)
    .filter((player) => player && typeof player.id === 'string' && typeof player.name === 'string')
    .map((player) => normalizePlayer(player))
}

function normalizeClub(input) {
  const club = input && typeof input === 'object' ? input : {}
  const name = toStringValue(club.name, '')
  const colors = uniqueStrings(toArrayValue(club.colors).map((color) => toStringValue(color, '')))
  const era = uniqueStrings(toArrayValue(club.era).map((item) => toStringValue(item, '')))

  return {
    id: toStringValue(club.id, ''),
    name,
    shortName: toStringValue(club.shortName, name),
    founded: toNumberValue(club.founded, 0),
    stadium: toStringValue(club.stadium, ''),
    city: toStringValue(club.city, ''),
    colors: colors.length > 0 ? colors : ['#FFFFFF'],
    titles: toNumberValue(club.titles, 0),
    Libertadores: toNumberValue(club.Libertadores, 0),
    era: era.length > 0 ? era : ['N/D'],
    nickname: toStringValue(club.nickname, name),
  }
}

function normalizeClubs(input) {
  return toArrayValue(input)
    .filter((club) => club && typeof club.id === 'string' && typeof club.name === 'string')
    .map((club) => normalizeClub(club))
}

function normalizeSquad(input) {
  const squad = input && typeof input === 'object' ? input : {}
  return {
    id: toStringValue(squad.id, ''),
    clubId: toStringValue(squad.clubId, ''),
    season: toStringValue(squad.season, ''),
    competition: toStringValue(squad.competition, ''),
    label: toStringValue(squad.label, ''),
    playerIds: toArrayValue(squad.playerIds).map((playerId) => toStringValue(playerId, '')).filter(Boolean),
  }
}

function normalizeSquads(input) {
  return toArrayValue(input)
    .filter((squad) => squad && typeof squad.id === 'string')
    .map((squad) => normalizeSquad(squad))
}

export {
  VALID_POSITIONS,
  POSITION_ALIASES,
  normalizePosition,
  isValidPosition,
  normalizePlayer,
  normalizePlayers,
  normalizeClub,
  normalizeClubs,
  normalizeSquad,
  normalizeSquads,
}
