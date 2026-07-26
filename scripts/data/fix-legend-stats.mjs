// Cura las estadísticas REALES de las leyendas de la ruleta (goles de club, partidos,
// goles y partidos de selección) a cifras bien documentadas. Las leyendas son fundamentales
// para informar bien. Match por nombre exacto.
//   node scripts/data/fix-legend-stats.mjs
import fs from 'node:fs'
import path from 'node:path'

const FILE = path.join(process.cwd(), 'data', 'players.json')
const players = JSON.parse(fs.readFileSync(FILE, 'utf8'))

// name -> [goalsClub, capsClub, goalsNT, capsNT]  (cifras de carrera reales/consensuadas)
const STATS = {
  'Lionel Messi': [720, 895, 112, 191],
  'Diego Maradona': [259, 490, 34, 91],
  'Alfredo Di Stéfano': [377, 521, 29, 41], // Argentina + España + Colombia (carrera internacional)
  'Gabriel Batistuta': [344, 553, 54, 78],
  'Daniel Passarella': [175, 546, 22, 70],
  'Javier Zanetti': [26, 1114, 5, 145],
  'Mario Kempes': [304, 654, 20, 43],
  'Ubaldo Fillol': [0, 708, 0, 58],
  'Carlos Tevez': [280, 700, 13, 76],
  'Juan Román Riquelme': [130, 655, 17, 51],
  'Sergio Agüero': [384, 700, 42, 101],
  'Roberto Perfumo': [24, 458, 0, 37],
  'Fernando Redondo': [14, 440, 1, 29],
  'Juan Sebastián Verón': [80, 630, 9, 73],
  'Ricardo Bochini': [107, 634, 0, 28],
  'Enzo Francescoli': [220, 598, 17, 73], // selección de Uruguay
  'Amadeo Carrizo': [0, 552, 0, 20],
  'José Luis Chilavert': [62, 720, 8, 74], // arquero goleador; selección de Paraguay
  'Oscar Ruggeri': [49, 580, 7, 97],
  'Roberto Ayala': [22, 595, 7, 115],
  'Walter Samuel': [36, 642, 5, 56],
  'Javier Mascherano': [6, 642, 3, 147],
  'Hernán Crespo': [273, 608, 35, 64],
  'Ángel Di María': [158, 780, 31, 145],
  'Diego Simeone': [98, 638, 11, 106],
  'Martín Palermo': [236, 611, 9, 15],
  'Gonzalo Higuaín': [314, 620, 31, 75],
  'Paulo Dybala': [160, 510, 5, 41],
  'Pablo Aimar': [78, 520, 8, 52],
  'Esteban Cambiasso': [60, 690, 5, 52],
  'Hugo Gatti': [1, 801, 0, 18],
  'Nery Pumpido': [0, 440, 0, 35],
  'Sergio Goycochea': [0, 320, 0, 44],
  'Roberto Abbondanzieri': [0, 549, 0, 49],
  'Mauro Icardi': [220, 440, 1, 10],
}

let fixed = 0
const notFound = []
for (const [name, [gc, pc, gs, cs]] of Object.entries(STATS)) {
  const p = players.find((x) => x.name === name)
  if (!p) { notFound.push(name); continue }
  p.goalsClub = gc
  p.capsClub = pc
  p.goalsNationalTeam = gs
  p.capsNationalTeam = cs
  fixed++
}

fs.writeFileSync(FILE, JSON.stringify(players))
console.log(`Leyendas curadas: ${fixed}/${Object.keys(STATS).length}`)
if (notFound.length) console.log('No encontradas (revisar nombre):', notFound.join(', '))
