import type { Player, Squad, FormationConfig, TournamentResult } from './types'
import { teamToStrength, simulateMatchGoals, distributeGoalsAmongPlayers } from './game-engine'
import { buildMatchChronicle } from './chronicle'

export interface ContinentalClub {
  id: string
  name: string
  country: string
  strength: { attack: number; midfield: number; defense: number; goalkeeper: number; chemistry: number; overall: number }
}

export const CONTINENTAL_CLUBS: ContinentalClub[] = [
  { id: 'flamengo', name: 'Flamengo', country: '🇧🇷 Brasil', strength: { attack: 84, midfield: 83, defense: 82, goalkeeper: 84, chemistry: 80, overall: 83 } },
  { id: 'palmeiras', name: 'Palmeiras', country: '🇧🇷 Brasil', strength: { attack: 83, midfield: 84, defense: 83, goalkeeper: 85, chemistry: 82, overall: 84 } },
  { id: 'river-plate', name: 'River Plate', country: '🇦🇷 Argentina', strength: { attack: 83, midfield: 82, defense: 82, goalkeeper: 83, chemistry: 80, overall: 83 } },
  { id: 'boca-juniors', name: 'Boca Juniors', country: '🇦🇷 Argentina', strength: { attack: 82, midfield: 81, defense: 83, goalkeeper: 82, chemistry: 80, overall: 82 } },
  { id: 'fluminense', name: 'Fluminense', country: '🇧🇷 Brasil', strength: { attack: 81, midfield: 82, defense: 80, goalkeeper: 82, chemistry: 78, overall: 81 } },
  { id: 'atletico-mineiro', name: 'Atlético Mineiro', country: '🇧🇷 Brasil', strength: { attack: 82, midfield: 81, defense: 80, goalkeeper: 81, chemistry: 78, overall: 81 } },
  { id: 'botafogo', name: 'Botafogo', country: '🇧🇷 Brasil', strength: { attack: 82, midfield: 82, defense: 81, goalkeeper: 82, chemistry: 80, overall: 82 } },
  { id: 'sao-paulo', name: 'São Paulo', country: '🇧🇷 Brasil', strength: { attack: 80, midfield: 80, defense: 80, goalkeeper: 81, chemistry: 76, overall: 80 } },
  { id: 'penarol', name: 'Peñarol', country: '🇺🇾 Uruguay', strength: { attack: 78, midfield: 78, defense: 79, goalkeeper: 79, chemistry: 78, overall: 79 } },
  { id: 'nacional-uru', name: 'Nacional', country: '🇺🇾 Uruguay', strength: { attack: 77, midfield: 77, defense: 78, goalkeeper: 78, chemistry: 76, overall: 77 } },
  { id: 'ldu-quito', name: 'LDU Quito', country: '🇪🇨 Ecuador', strength: { attack: 78, midfield: 78, defense: 77, goalkeeper: 79, chemistry: 76, overall: 78 } },
  { id: 'ind-del-valle', name: 'Independiente del Valle', country: '🇪🇨 Ecuador', strength: { attack: 79, midfield: 79, defense: 78, goalkeeper: 79, chemistry: 80, overall: 79 } },
  { id: 'colo-colo', name: 'Colo-Colo', country: '🇨🇱 Chile', strength: { attack: 76, midfield: 77, defense: 76, goalkeeper: 77, chemistry: 75, overall: 76 } },
  { id: 'racing-club', name: 'Racing Club', country: '🇦🇷 Argentina', strength: { attack: 81, midfield: 80, defense: 80, goalkeeper: 82, chemistry: 78, overall: 81 } },
  { id: 'olimpia', name: 'Olimpia', country: '🇵🇾 Paraguay', strength: { attack: 76, midfield: 76, defense: 77, goalkeeper: 77, chemistry: 75, overall: 76 } },
  { id: 'libertad', name: 'Libertad', country: '🇵🇾 Paraguay', strength: { attack: 76, midfield: 77, defense: 76, goalkeeper: 76, chemistry: 74, overall: 76 } },
]

/** Simulate Copa Libertadores / Sudamericana tournament */
export function simulateContinentalTournament(
  playerTeam: Player[],
  squad: Squad,
  formation: FormationConfig,
  teamScore: number,
  type: 'libertadores' | 'sudamericana' = 'libertadores'
): TournamentResult {
  const userStrength = teamToStrength(playerTeam, formation, 'copa')
  const title = type === 'libertadores' ? 'Copa Libertadores' : 'Copa Sudamericana'

  // Pick 15 opponents from continental clubs
  const opponents = CONTINENTAL_CLUBS
    .filter(c => c.name !== squad.label)
    .sort(() => Math.random() - 0.5)
    .slice(0, 7)

  const rounds = [
    { name: 'Fase de Grupos - Fecha 1', opp: opponents[0] },
    { name: 'Fase de Grupos - Fecha 2', opp: opponents[1] },
    { name: 'Fase de Grupos - Fecha 3', opp: opponents[2] },
    { name: 'Octavos de Final', opp: opponents[3] },
    { name: 'Cuartos de Final', opp: opponents[4] },
    { name: 'Semifinal', opp: opponents[5] },
    { name: 'Final Única', opp: opponents[6] },
  ]

  let eliminated = false
  let eliminatedRound = ''
  const roundMatches: import('./types').RoundMatch[] = []
  const chronicles: import('./chronicle').MatchChronicle[] = []
  const playerStatsMap: Record<string, import('./types').TournamentPlayerStats> = {}

  playerTeam.forEach(p => {
    playerStatsMap[p.id] = {
      playerId: p.id,
      playerName: p.name,
      position: p.position,
      rating: p.rating,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      matchesPlayed: 0,
    }
  })

  for (let i = 0; i < rounds.length; i++) {
    if (eliminated) break
    const r = rounds[i]
    const opp = r.opp

    const { homeGoals, awayGoals } = simulateMatchGoals(userStrength, opp.strength)
    const isPlayerHome = i % 2 === 0
    const myGoals = isPlayerHome ? homeGoals : awayGoals
    const oppGoals = isPlayerHome ? awayGoals : homeGoals

    const { goals, assists } = myGoals > 0
      ? distributeGoalsAmongPlayers(playerTeam, myGoals, formation)
      : { goals: {}, assists: {} }

    const { chronicle, discipline } = buildMatchChronicle({
      opponent: opp.name,
      isHome: isPlayerHome,
      myGoals,
      oppGoals,
      goalsByPlayer: goals,
      assistsByPlayer: assists,
      team: playerTeam,
      roundLabel: r.name,
    })

    chronicles.push(chronicle)

    playerTeam.forEach(p => {
      if (playerStatsMap[p.id]) {
        playerStatsMap[p.id].goals += (goals as Record<string, number>)[p.id] || 0
        playerStatsMap[p.id].assists += (assists as Record<string, number>)[p.id] || 0
        playerStatsMap[p.id].matchesPlayed += 1
        if (discipline.yellows.includes(p.id)) playerStatsMap[p.id].yellowCards += 1
        if (discipline.reds.includes(p.id)) playerStatsMap[p.id].redCards += 1
      }
    })

    roundMatches.push({
      round: r.name,
      matches: [
        {
          home: isPlayerHome ? squad.label : opp.name,
          away: isPlayerHome ? opp.name : squad.label,
          homeGoals,
          awayGoals,
          isPlayerHome,
        },
      ],
    })

    // Knockout logic for rounds starting at Octavos
    if (i >= 3) {
      if (myGoals < oppGoals) {
        eliminated = true
        eliminatedRound = r.name
      }
    }
  }

  const finalStats = Object.values(playerStatsMap)
  const isChampion = !eliminated

  return {
    type: 'copa',
    champion: isChampion ? squad.label : opponents[opponents.length - 1].name,
    isChampion,
    eliminated,
    eliminatedRound: eliminated ? eliminatedRound : undefined,
    playerStats: finalStats,
    topScorers: [...finalStats].sort((a, b) => b.goals - a.goals || b.assists - a.assists),
    topAssisters: [...finalStats].sort((a, b) => b.assists - a.assists || b.goals - a.goals),
    rounds: roundMatches,
    teamLabel: `${squad.label} (${title})`,
    formation: formation.id,
    teamScore,
    chronicle: chronicles,
  }
}
