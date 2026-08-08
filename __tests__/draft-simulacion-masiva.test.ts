import { describe, it, expect } from 'vitest'
import { simulateSeasonWithStats, formations } from '../lib/game-engine'
import { plazaPorPuesto } from '../lib/ranking'

describe('Simulación Masiva de Drafts (Verificación de Asistencias y LPF)', () => {
  it('clasificación continental y descenso según reglas oficiales LPF', () => {
    // 1-4 Libertadores
    expect([1, 2, 3, 4].map(plazaPorPuesto)).toEqual(['libertadores', 'libertadores', 'libertadores', 'libertadores'])
    // 5-10 Sudamericana
    expect([5, 6, 7, 8, 9, 10].map(plazaPorPuesto)).toEqual(['sudamericana', 'sudamericana', 'sudamericana', 'sudamericana', 'sudamericana', 'sudamericana'])
    // 11-28 Sin plaza continental
    expect([11, 14, 26, 27, 28].map(plazaPorPuesto)).toEqual([null, null, null, null, null])
  })

  it('simulación de 100 ligas: asistencias de defensores centrales son realistas (CB < 2.0 asistencias por temporada)', () => {
    const f = formations['4-3-3']
    // `any[]`: al motor le alcanzan estos cinco campos, y escribir el Player entero (25 campos)
    // por cada uno de los once no haría más claro qué se está midiendo acá.
    const mockPlayers: any[] = [
      { id: 'p1', name: 'Arquero', position: 'GK', rating: 78, clubId: 'boca-juniors' },
      { id: 'p2', name: 'Ramiro Funes Mori', position: 'CB', rating: 80, clubId: 'river-plate' }, // Defensor Central
      { id: 'p3', name: 'Zaguero 2', position: 'CB', rating: 79, clubId: 'racing-club' },
      { id: 'p4', name: 'Lateral Izq', position: 'LB', rating: 81, clubId: 'independiente' },
      { id: 'p5', name: 'Lateral Der', position: 'RB', rating: 80, clubId: 'san-lorenzo' },
      { id: 'p6', name: 'Volante Central', position: 'CM', rating: 82, clubId: 'boca-juniors' },
      { id: 'p7', name: 'Enganche CAM', position: 'CAM', rating: 85, clubId: 'river-plate' },
      { id: 'p8', name: 'Volante Der', position: 'CM', rating: 80, clubId: 'racing-club' },
      { id: 'p9', name: 'Extremo Der', position: 'RW', rating: 84, clubId: 'boca-juniors' },
      { id: 'p10', name: 'Delantero Centro', position: 'ST', rating: 86, clubId: 'river-plate' },
      { id: 'p11', name: 'Extremo Izq', position: 'LW', rating: 83, clubId: 'independiente' },
    ]

    const mockSquad: any = {
      id: 'mi-11',
      label: 'Mi 11 de Prueba',
      clubId: 'boca-juniors',
      playerIds: mockPlayers.map(p => p.id),
    }

    const allSquads = [mockSquad]
    for (let i = 1; i <= 30; i++) {
      allSquads.push({
        id: `squad-${i}`,
        label: `Rival ${i}`,
        clubId: 'river-plate',
        playerIds: mockPlayers.map(p => p.id),
      })
    }

    let cbTotalAssists = 0
    let camTotalAssists = 0
    const NUM_SIMS = 100

    for (let sim = 0; sim < NUM_SIMS; sim++) {
      const res = simulateSeasonWithStats(mockPlayers, mockSquad, allSquads, mockPlayers, f, 82)
      const funesMoriStats = res.playerStats.find(p => p.playerId === 'p2')
      const camStats = res.playerStats.find(p => p.playerId === 'p7')

      if (funesMoriStats) cbTotalAssists += funesMoriStats.assists
      if (camStats) camTotalAssists += camStats.assists
    }

    const avgCbAssists = cbTotalAssists / NUM_SIMS
    const avgCamAssists = camTotalAssists / NUM_SIMS

    console.log(`📊 Promedio de asistencias en 100 temporadas: CB (Funes Mori) = ${avgCbAssists.toFixed(2)}, CAM = ${avgCamAssists.toFixed(2)}`)

    // Funes Mori (CB) debe promediar menos de 2.0 asistencias por temporada
    expect(avgCbAssists).toBeLessThan(2.0)
    // El Enganche / CAM debe tener significativamente más asistencias que el defensor central
    expect(avgCamAssists).toBeGreaterThan(avgCbAssists * 4)
  })
})
