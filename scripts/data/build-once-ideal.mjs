// El once ideal histórico del fútbol argentino, armado desde la base y no a dedo.
//
// Es la vidriera del draft en la portada: el que llega ve el equipo que se puede armar jugando.
// Por eso se genera y no se escribe a mano: si mañana entra una leyenda nueva o se recalibra un
// OVR, el once se actualiza solo y nadie tiene que acordarse de tocar un componente.
//
// Cómo se elige:
//   · La formación es 4-3-3, que es la que deja poner a los dos extremos históricos y al 10.
//   · Cada puesto se llena con el mejor por valoración que juegue ahí de verdad.
//   · Un jugador entra una sola vez: si el mejor extremo derecho ya está de titular en otro
//     puesto, se toma el siguiente.
//   · Los puestos sin leyenda propia (el lateral izquierdo no tiene ninguna en la base) se
//     llenan con el mejor de la posición, aunque no esté marcado como leyenda.
//
//   node scripts/data/build-once-ideal.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'data')

const todos = JSON.parse(fs.readFileSync(path.join(DATA, 'players.json'), 'utf8'))
const squads = JSON.parse(fs.readFileSync(path.join(DATA, 'squads.json'), 'utf8'))
const clubs = JSON.parse(fs.readFileSync(path.join(DATA, 'clubs.json'), 'utf8'))

// Es el once ideal del fútbol ARGENTINO: un italiano no entra por más que tenga 83.
// Y tiene que ser alguien que el juego use de verdad —una leyenda o alguien que está en algún
// plantel—, porque en la base quedan fichas sueltas que no se pueden jugar: así se coló un
// juvenil de Banfield al que el cruce con FIFA le había pegado la ficha de Lorenzo Insigne.
const enAlgunPlantel = new Set(squads.flatMap((s) => s.playerIds))
// La carrera también habilita: Caniggia no está marcado como leyenda ni juega en un plantel del
// juego, pero 50 partidos con la selección son una carrera, y una ficha suelta sin un solo dato
// no lo es.
const carreraDeVerdad = (p) => (p.capsNationalTeam || 0) >= 20 || (p.goalsClub || 0) >= 50
const players = todos.filter(
  (p) => p.nationality === 'Argentina' && (p.legendary || enAlgunPlantel.has(p.id) || carreraDeVerdad(p)),
)
const clubPorId = new Map(clubs.map((c) => [c.id, c]))

// 4-3-3, con las coordenadas de la cancha del juego (lib/game-engine.ts).
const FORMACION = [
  { pos: 'GK', x: 50, y: 92, etiqueta: 'Arquero' },
  { pos: 'LB', x: 12, y: 72, etiqueta: 'Lateral izquierdo' },
  { pos: 'CB', x: 37, y: 72, etiqueta: 'Zaguero' },
  { pos: 'CB', x: 63, y: 72, etiqueta: 'Zaguero' },
  { pos: 'RB', x: 88, y: 72, etiqueta: 'Lateral derecho' },
  { pos: 'CDM', x: 22, y: 48, etiqueta: 'Cinco' },
  { pos: 'CM', x: 50, y: 48, etiqueta: 'Volante' },
  { pos: 'CAM', x: 78, y: 48, etiqueta: 'Enganche' },
  { pos: 'LW', x: 15, y: 24, etiqueta: 'Extremo izquierdo' },
  { pos: 'ST', x: 50, y: 16, etiqueta: 'Delantero' },
  { pos: 'RW', x: 85, y: 24, etiqueta: 'Extremo derecho' },
]

// Puestos que puede cubrir cada uno sin desnaturalizarlo: un CF juega de 9, un CAM de volante.
const EQUIVALENTES = {
  GK: ['GK'],
  LB: ['LB', 'LWB'],
  CB: ['CB'],
  RB: ['RB', 'RWB'],
  CDM: ['CDM', 'CM'],
  CM: ['CM', 'CAM', 'CDM'],
  CAM: ['CAM', 'CM'],
  LW: ['LW', 'LM'],
  RW: ['RW', 'RM'],
  ST: ['ST', 'CF'],
}

const usados = new Set()
const once = []

for (const slot of FORMACION) {
  const candidatos = players
    .filter((p) => !usados.has(p.id) && EQUIVALENTES[slot.pos].includes(p.position))
    // Primero los que de verdad son de ese puesto, después los que lo cubren.
    .sort((a, b) =>
      (b.position === slot.pos ? 1 : 0) - (a.position === slot.pos ? 1 : 0) ||
      (b.legendary ? 1 : 0) - (a.legendary ? 1 : 0) ||
      b.rating - a.rating ||
      // A igual valoración gana el de más partidos en la selección: es el desempate que
      // distingue al histórico del jugador de paso.
      (b.capsNationalTeam || 0) - (a.capsNationalTeam || 0),
    )
  const elegido = candidatos[0]
  if (!elegido) throw new Error(`sin candidato para ${slot.pos}`)
  usados.add(elegido.id)

  // El club con el que se lo identifica es en el que más tiempo estuvo, no el primero: Fillol
  // debutó en Quilmes y es de River, y Passarella salió de Sarmiento y es de River.
  // La selección no es un club: sin sacarla, Maradona, Messi y Batistuta figuraban en
  // "Argentina", que en una carta de club se lee como un error.
  const esSeleccion = (c) => /^(argentina|seleccion|selección)/i.test(c.id || '') || /^(argentina|selección)/i.test(c.name || '')
  const club = [...(elegido.clubs || [])]
    .filter((c) => !esSeleccion(c))
    .map((c) => {
      const m = String(c.years || '').match(/(\d{4})\s*[-–]?\s*(\d{4})?/)
      return { ...c, temporadas: m ? (Number(m[2] || m[1]) - Number(m[1]) + 1) : 0 }
    })
    .sort((a, b) => b.temporadas - a.temporadas)[0]
  once.push({
    id: elegido.id,
    nombre: elegido.name,
    puesto: slot.pos,
    etiqueta: slot.etiqueta,
    x: slot.x,
    y: slot.y,
    ovr: elegido.rating,
    leyenda: !!elegido.legendary,
    clubId: club?.id || null,
    club: club?.name || (club?.id ? clubPorId.get(club.id)?.name : null) || null,
    decada: elegido.decade || null,
  })
}

const ovr = Math.round(once.reduce((a, p) => a + p.ovr, 0) / once.length)
const salida = {
  generado: new Date().toISOString().slice(0, 10),
  formacion: '4-3-3',
  ovr,
  // De dónde salió, para que se pueda auditar de un vistazo.
  fuente: `los ${players.length} argentinos jugables de la base, por valoración y puesto`,
  once,
}

const destino = path.join(DATA, 'derived', 'once-ideal.json')
fs.writeFileSync(destino, JSON.stringify(salida, null, 2))

console.log(`Once ideal (${salida.formacion}) · OVR ${ovr}\n`)
for (const p of once) {
  console.log(`  ${p.puesto.padEnd(4)} ${String(p.ovr).padStart(3)}  ${p.nombre}${p.leyenda ? ' ★' : ''}  ${p.club || ''}`)
}
console.log(`\n${destino}`)
