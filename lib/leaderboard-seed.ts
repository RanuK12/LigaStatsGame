import type { GameScore } from './scores'

/**
 * Rivales de la casa: el ranking arranca con diez DTs de Gambeta para que la tabla tenga
 * contra quién medirse desde el primer partido. Van marcados como `seed` y la tabla los
 * muestra como tales — no se hacen pasar por jugadores reales.
 */
export interface SeedRival extends GameScore {
  seed: true
  lema: string
}

const rival = (
  username: string,
  lema: string,
  elo: number,
  pts: number,
  pos: number,
  rating: number,
): SeedRival => ({
  id: `seed-${username.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  username,
  club: 'gambeta',
  clubName: 'Gambeta FC',
  rating,
  players: 11,
  pts,
  pos,
  elo,
  date: '2026-01-01T00:00:00.000Z',
  seed: true,
  lema,
})

export const SEED_RIVALS: SeedRival[] = [
  rival('El Bocha del Potrero', 'Pase al vacío y a cobrar', 1782, 138, 1, 88),
  rival('Bilardista Serial', 'Resultadismo con la 5 bien puesta', 1704, 126, 1, 86),
  rival('Caño y Sombrero', 'Si no humilla, no cuenta', 1655, 118, 2, 85),
  rival('Doña Rosa DT', 'La táctica se explica en la sobremesa', 1588, 104, 3, 84),
  rival('El 5 que Corta', 'Primero el equipo, después la gambeta', 1521, 92, 4, 82),
  rival('Menottista Fiel', 'Se juega lindo o no se juega', 1470, 81, 5, 81),
  rival('Pipa de Barrio', 'Nueve de área, de los que no existen más', 1408, 70, 7, 80),
  rival('Tribuna Visitante', 'Aguanta los 90 y los penales', 1342, 58, 9, 78),
  rival('Gambeta de Baldosa', 'Se crió en el asfalto y en el barro', 1276, 44, 12, 77),
  rival('Wing de Ascenso', 'Corre la banda hasta que se acabe la cancha', 1198, 31, 15, 75),
]
