import fs from 'node:fs'
import path from 'node:path'
import {
  normalizePosition,
  isValidPosition,
  normalizePlayers,
  normalizeClubs,
  normalizeSquads,
} from './shared-normalizers.mjs'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'data')

function readJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function classifyPosition(pos) {
  const normalized = normalizePosition(pos)

  if (normalized === 'GK') return 'gk'
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(normalized)) return 'def'
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(normalized)) return 'mid'
  if (['LW', 'RW', 'ST', 'CF'].includes(normalized)) return 'att'

  return 'unknown'
}

function audit() {
  const rawPlayers = readJson('players.json')
  const rawSquads = readJson('squads.json')
  const rawClubs = readJson('clubs.json')

  const players = normalizePlayers(rawPlayers)
  const squads = normalizeSquads(rawSquads)
  const clubs = normalizeClubs(rawClubs)

  const playerById = new Map(players.map((player) => [player.id, player]))
  const clubById = new Map(clubs.map((club) => [club.id, club]))

  const report = {
    totals: {
      clubs: clubs.length,
      players: players.length,
      squads: squads.length,
    },
    players: {
      duplicatedIds: [],
      missingName: [],
      missingRating: [],
      invalidRating: [],
      missingPosition: [],
      invalidPosition: [],
      missingClubs: [],
    },
    squads: {
      missingClub: [],
      lessThan11: [],
      brokenPlayerRefs: [],
      withoutGoalkeeper: [],
      withoutEnoughDefenders: [],
      withoutEnoughMidfielders: [],
      withoutAttackers: [],
      duplicatedPlayerRefs: [],
    },
    coverage: {
      playersWithRating: 0,
      playersWithClubs: 0,
      playersWithValidPosition: 0,
      squadsPlayable: 0,
      squadsByClub: {},
      playersByClub: {},
      playersByDecade: {},
      playersByPosition: {},
    },
    summary: {
      healthScore: 100,
      criticalIssues: 0,
      warnings: 0,
      recommendations: [],
    },
  }

  const seenPlayerIds = new Set()

  for (const player of rawPlayers) {
    if (!player.id) continue

    if (seenPlayerIds.has(player.id)) {
      report.players.duplicatedIds.push(player.id)
    }

    seenPlayerIds.add(player.id)

    if (!player.name) {
      report.players.missingName.push(player.id)
    }

    if (typeof player.rating !== 'number') {
      report.players.missingRating.push(`${player.id} - ${player.name}`)
    } else if (player.rating < 40 || player.rating > 99) {
      report.players.invalidRating.push(`${player.id} - ${player.name} (${player.rating})`)
    }

    const normalizedPosition = normalizePosition(player.position)

    if (!player.position) {
      report.players.missingPosition.push(`${player.id} - ${player.name}`)
    } else if (!isValidPosition(normalizedPosition)) {
      report.players.invalidPosition.push(`${player.id} - ${player.name} (${player.position})`)
    }

    if (!Array.isArray(player.clubs) || player.clubs.length === 0) {
      report.players.missingClubs.push(`${player.id} - ${player.name}`)
    }

    if (typeof player.rating === 'number') {
      report.coverage.playersWithRating += 1
    }

    if (Array.isArray(player.clubs) && player.clubs.length > 0) {
      report.coverage.playersWithClubs += 1
      for (const club of player.clubs) {
        if (club && club.id) {
          report.coverage.playersByClub[club.id] = (report.coverage.playersByClub[club.id] || 0) + 1
        }
      }
    }

    if (player.position && isValidPosition(normalizedPosition)) {
      report.coverage.playersWithValidPosition += 1
      report.coverage.playersByPosition[normalizedPosition] = (report.coverage.playersByPosition[normalizedPosition] || 0) + 1
    }

    if (player.decade) {
      report.coverage.playersByDecade[player.decade] = (report.coverage.playersByDecade[player.decade] || 0) + 1
    }
  }

  for (const squad of squads) {
    if (!clubById.has(squad.clubId)) {
      report.squads.missingClub.push(`${squad.id} - ${squad.label} (${squad.clubId})`)
    }

    if (!Array.isArray(squad.playerIds) || squad.playerIds.length < 11) {
      report.squads.lessThan11.push(`${squad.id} - ${squad.label} (${squad.playerIds?.length || 0})`)
    }

    const seenRefs = new Set()
    const duplicatedRefs = []

    for (const playerId of squad.playerIds || []) {
      if (seenRefs.has(playerId)) {
        duplicatedRefs.push(playerId)
      }

      seenRefs.add(playerId)

      if (!playerById.has(playerId)) {
        report.squads.brokenPlayerRefs.push(`${squad.id} - ${squad.label}: ${playerId}`)
      }
    }

    if (duplicatedRefs.length > 0) {
      report.squads.duplicatedPlayerRefs.push(`${squad.id} - ${squad.label}: ${duplicatedRefs.join(', ')}`)
    }

    const squadPlayers = (squad.playerIds || [])
      .map((id) => playerById.get(id))
      .filter(Boolean)

    const counts = squadPlayers.reduce((acc, player) => {
      const group = classifyPosition(player.position)
      acc[group] = (acc[group] || 0) + 1
      return acc
    }, {})

    if (!counts.gk) {
      report.squads.withoutGoalkeeper.push(`${squad.id} - ${squad.label}`)
    }

    if ((counts.def || 0) < 3) {
      report.squads.withoutEnoughDefenders.push(`${squad.id} - ${squad.label} (${counts.def || 0})`)
    }

    if ((counts.mid || 0) < 3) {
      report.squads.withoutEnoughMidfielders.push(`${squad.id} - ${squad.label} (${counts.mid || 0})`)
    }

    if ((counts.att || 0) < 1) {
      report.squads.withoutAttackers.push(`${squad.id} - ${squad.label}`)
    }

    const brokenRefsForSquad = report.squads.brokenPlayerRefs.filter((entry) => entry.startsWith(`${squad.id} - ${squad.label}:`))
    const isPlayable = squad.playerIds.length >= 11 && clubById.has(squad.clubId) && counts.gk && (counts.def || 0) >= 3 && (counts.mid || 0) >= 3 && (counts.att || 0) >= 1 && brokenRefsForSquad.length === 0
    if (isPlayable) {
      report.coverage.squadsPlayable += 1
    }

    report.coverage.squadsByClub[squad.clubId] = (report.coverage.squadsByClub[squad.clubId] || 0) + 1
  }

  const criticalIssues =
    report.squads.missingClub.length +
    report.squads.lessThan11.length +
    report.squads.brokenPlayerRefs.length +
    report.squads.withoutGoalkeeper.length +
    report.players.invalidRating.length +
    report.players.invalidPosition.length

  const warnings =
    report.players.missingRating.length +
    report.players.missingClubs.length +
    report.squads.withoutEnoughDefenders.length +
    report.squads.withoutEnoughMidfielders.length +
    report.squads.withoutAttackers.length +
    report.players.duplicatedIds.length +
    report.players.missingName.length

  let healthScore = 100
  if (report.totals.players < 1000) healthScore -= 20
  if (report.totals.squads < 50) healthScore -= 20
  if (report.players.missingRating.length > 0) healthScore -= 10
  if (report.players.invalidPosition.length > 0) healthScore -= 10
  if (report.squads.brokenPlayerRefs.length > 0) healthScore -= 10
  if (report.squads.withoutGoalkeeper.length > 0) healthScore -= 10
  if (report.squads.withoutEnoughDefenders.length > 0 || report.squads.withoutEnoughMidfielders.length > 0 || report.squads.withoutAttackers.length > 0) healthScore -= 5
  healthScore = Math.max(0, healthScore)

  report.summary.healthScore = healthScore
  report.summary.criticalIssues = criticalIssues
  report.summary.warnings = warnings
  report.summary.recommendations = [
    report.totals.players < 1000 ? 'Expand the player pool with curated historical squads.' : null,
    report.totals.squads < 50 ? 'Add more historical squads to improve matchups and coverage.' : null,
    report.players.missingRating.length > 0 ? 'Normalize missing ratings with fallback values during ingestion.' : null,
    report.players.invalidPosition.length > 0 ? 'Normalize positions before publishing curated data.' : null,
    report.squads.brokenPlayerRefs.length > 0 ? 'Repair squad references to existing player IDs.' : null,
    report.squads.withoutGoalkeeper.length > 0 ? 'Ensure every squad has at least one goalkeeper.' : null,
    report.squads.withoutEnoughDefenders.length > 0 || report.squads.withoutEnoughMidfielders.length > 0 || report.squads.withoutAttackers.length > 0 ? 'Review squad balance and add missing positional coverage.' : null,
  ].filter(Boolean)

  return report
}

function printSection(title, items, limit = 20) {
  console.log(`\n## ${title}: ${items.length}`)

  for (const item of items.slice(0, limit)) {
    console.log(`- ${item}`)
  }

  if (items.length > limit) {
    console.log(`... +${items.length - limit} más`)
  }
}

function printCountMap(title, counts, limit = 15) {
  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  console.log(`\n## ${title}`)

  if (entries.length === 0) {
    console.log('- Sin datos')
    return
  }

  for (const [key, value] of entries.slice(0, limit)) {
    console.log(`- ${key}: ${value}`)
  }

  if (entries.length > limit) {
    console.log(`... +${entries.length - limit} más`)
  }
}

const report = audit()

console.log('\n# LigaStatsGame Dataset Audit')
console.log(`\nClubs: ${report.totals.clubs}`)
console.log(`Players: ${report.totals.players}`)
console.log(`Squads: ${report.totals.squads}`)

printSection('Player duplicated IDs', report.players.duplicatedIds)
printSection('Players missing name', report.players.missingName)
printSection('Players missing rating', report.players.missingRating)
printSection('Players invalid rating', report.players.invalidRating)
printSection('Players missing position', report.players.missingPosition)
printSection('Players invalid position', report.players.invalidPosition)
printSection('Players missing clubs', report.players.missingClubs)

printSection('Squads missing club', report.squads.missingClub)
printSection('Squads with less than 11 players', report.squads.lessThan11)
printSection('Squads with broken player refs', report.squads.brokenPlayerRefs)
printSection('Squads without goalkeeper', report.squads.withoutGoalkeeper)
printSection('Squads without enough defenders', report.squads.withoutEnoughDefenders)
printSection('Squads without enough midfielders', report.squads.withoutEnoughMidfielders)
printSection('Squads without attackers', report.squads.withoutAttackers)
printSection('Squads with duplicated player refs', report.squads.duplicatedPlayerRefs)

console.log('\n## Health Score')
console.log(`- Score: ${report.summary.healthScore}`)
console.log(`- Critical issues: ${report.summary.criticalIssues}`)
console.log(`- Warnings: ${report.summary.warnings}`)

console.log('\n## Coverage')
console.log(`- Players with rating: ${report.coverage.playersWithRating}`)
console.log(`- Players with clubs: ${report.coverage.playersWithClubs}`)
console.log(`- Players with valid position: ${report.coverage.playersWithValidPosition}`)
console.log(`- Playable squads: ${report.coverage.squadsPlayable}`)
printCountMap('Players by club', report.coverage.playersByClub)
printCountMap('Players by decade', report.coverage.playersByDecade)

const outputDir = path.join(ROOT, 'data', 'reports')
fs.mkdirSync(outputDir, { recursive: true })

const outputPath = path.join(outputDir, 'dataset-audit.json')
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))

const markdownPath = path.join(outputDir, 'dataset-audit.md')
const markdown = [
  '# LigaStatsGame Dataset Audit',
  '',
  '## Totals',
  `- Clubs: ${report.totals.clubs}`,
  `- Players: ${report.totals.players}`,
  `- Squads: ${report.totals.squads}`,
  '',
  '## Health Score',
  `- Score: ${report.summary.healthScore}`,
  `- Critical issues: ${report.summary.criticalIssues}`,
  `- Warnings: ${report.summary.warnings}`,
  '',
  '## Critical Issues',
  `- Missing club: ${report.squads.missingClub.length}`,
  `- Less than 11 players: ${report.squads.lessThan11.length}`,
  `- Broken player refs: ${report.squads.brokenPlayerRefs.length}`,
  `- Without goalkeeper: ${report.squads.withoutGoalkeeper.length}`,
  `- Invalid rating: ${report.players.invalidRating.length}`,
  `- Invalid position: ${report.players.invalidPosition.length}`,
  '',
  '## Coverage',
  `- Players with rating: ${report.coverage.playersWithRating}`,
  `- Players with clubs: ${report.coverage.playersWithClubs}`,
  `- Players with valid position: ${report.coverage.playersWithValidPosition}`,
  `- Playable squads: ${report.coverage.squadsPlayable}`,
  '',
  '## Players by club',
  ...Object.entries(report.coverage.playersByClub)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([clubId, count]) => `- ${clubId}: ${count}`),
  '',
  '## Players by decade',
  ...Object.entries(report.coverage.playersByDecade)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([decade, count]) => `- ${decade}: ${count}`),
  '',
  '## Top Recommendations',
  ...report.summary.recommendations.map((recommendation) => `- ${recommendation}`),
  '',
  '## Player Problems',
  `- Missing rating: ${report.players.missingRating.length}`,
  `- Missing clubs: ${report.players.missingClubs.length}`,
  `- Invalid position: ${report.players.invalidPosition.length}`,
  `- Missing name: ${report.players.missingName.length}`,
  '',
  '## Squad Problems',
  `- Missing club: ${report.squads.missingClub.length}`,
  `- Less than 11 players: ${report.squads.lessThan11.length}`,
  `- Broken player refs: ${report.squads.brokenPlayerRefs.length}`,
  `- Without goalkeeper: ${report.squads.withoutGoalkeeper.length}`,
  `- Without enough defenders: ${report.squads.withoutEnoughDefenders.length}`,
  `- Without enough midfielders: ${report.squads.withoutEnoughMidfielders.length}`,
  `- Without attackers: ${report.squads.withoutAttackers.length}`,
].join('\n')

fs.writeFileSync(markdownPath, `${markdown}\n`)

console.log(`\nAudit JSON saved to ${path.relative(ROOT, outputPath)}\n`)
console.log(`Audit Markdown saved to ${path.relative(ROOT, markdownPath)}\n`)