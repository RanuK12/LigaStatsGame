import Link from 'next/link'
import playersData from '@/data/players.json'
import squadsData from '@/data/squads.json'
import ligasData from '@/data/derived/ligas.json'
import equiposData from '@/data/derived/equipos.json'
import AdSlot from '@/components/AdSlot'
import AdAncla from '@/components/AdAncla'

const JUGADORES = (playersData as unknown[]).length
const PLANTELES = (squadsData as unknown[]).length
const HISTORICOS = (equiposData as unknown[]).length
const CLUBES = (ligasData as { clubes: unknown[] }).clubes.length
const PAISES = (ligasData as { paises: unknown[] }).paises.length

/**
 * Lo que se dice de los otros juegos es lo que se puede comprobar entrando a jugarlos, y está
 * fechado. Nada de "el nuestro es mejor": el que busca esto ya jugó a uno y sabe lo que le gustó.
 * Lo único que hace falta es contarle qué hay acá que allá no encontró.
 */
const PREGUNTAS = [
  {
    q: '¿Gambeta es lo mismo que Copero o El Ídolo?',
    a: 'No. Los dos son juegos de carrera de futbolista y no tienen relación con nosotros. Gambeta tiene modo carrera, pero su parte central es otra: un draft en el que te sortean planteles reales del fútbol argentino y armás tu once eligiendo un jugador por puesto.',
  },
  {
    q: '¿Hay que descargar algo o registrarse?',
    a: 'Ni una cosa ni la otra. Corre en el navegador, en la computadora y en el teléfono. La cuenta es opcional y solo sirve para que tu puntaje entre en el ranking global.',
  },
  {
    q: '¿Es gratis?',
    a: 'Sí, entero. Se banca con publicidad y donaciones: no hay nada pago adentro del juego ni ventajas que se compren.',
  },
  {
    q: '¿Tiene modo carrera?',
    a: `Sí: nacés a los 16, elegís club, te ganás la titularidad, te lesionás, te llega la oferta de Europa, jugás el Mundial y te retirás con una ficha final descargable. Se puede arrancar desde el Torneo Federal A y subir, con ${CLUBES} clubes de ${PAISES} países.`,
  },
  {
    q: '¿Cuánto dura una partida?',
    a: 'Un draft son cinco minutos: te sortean once planteles, elegís once jugadores y simulás el torneo. Una carrera entera son quince temporadas y se puede dejar por la mitad, que queda guardada.',
  },
]

const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PREGUNTAS.map((p) => ({
    '@type': 'Question',
    name: p.q,
    acceptedAnswer: { '@type': 'Answer', text: p.a },
  })),
}

const DIFERENCIAS = [
  {
    titulo: 'El bombo es de planteles reales',
    texto: `No sale un jugador al azar de una lista: sale un plantel entero —el Vélez del 94, el Boca de Bianchi, el Racing del 2001— y elegís uno de ahí. Son ${PLANTELES} planteles y ${JUGADORES.toLocaleString('es-AR')} jugadores de 1994 a hoy, con ${HISTORICOS} equipos históricos cargados jugador por jugador.`,
  },
  {
    titulo: 'El Ascenso se juega',
    texto: `La carrera puede empezar en el Torneo Federal A y subir hasta la Primera, con ${CLUBES} clubes de ${PAISES} países. No es un adorno: los ascensos y descensos cambian a qué club te compran.`,
  },
  {
    titulo: 'Modo DT',
    texto: 'Además de jugar, se dirige: armás el plantel, elegís la táctica y te la tenés que aguantar si los resultados no vienen.',
  },
  {
    titulo: 'Reto diario con el mismo bombo para todos',
    texto: 'Un reto por día con una regla —solo Boca y River, solo cordobeses, solo zurdos— y el mismo sorteo para todo el mundo. El resultado sale en cuadraditos para pegar en un grupo sin spoilear a nadie.',
  },
  {
    titulo: 'Ranking ELO de verdad',
    texto: 'Los torneos suman y restan puntos. La tabla es global y el reto diario tiene la suya.',
  },
]

export default function JuegosComoCopero() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />

      <header className="text-center">
        <p className="font-sport text-[11px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
          Gratis · en el navegador · sin registro
        </p>
        <h1 className="mt-3 font-display text-3xl font-black uppercase leading-tight text-white md:text-5xl">
          Juegos como Copero y El Ídolo
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-sans text-[15px] leading-relaxed text-slate-300">
          Si te enganchaste con los juegos de carrera de futbolista y buscás otro para seguir,
          Gambeta es un juego argentino del mismo palo con una vuelta más: además de la carrera,
          está el <strong className="text-white">draft con planteles reales</strong> del fútbol
          argentino. Partidas de cinco minutos, resultado distinto cada vez y algo para compartir
          al final.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/draft/"
            className="btn-primary inline-block rounded-2xl px-8 py-4 font-sport text-xs font-black uppercase tracking-widest"
          >
            Jugar el draft ⚽
          </Link>
          <Link
            href="/carrera/"
            className="btn-secondary inline-block rounded-2xl px-8 py-4 font-sport text-xs font-black uppercase tracking-widest"
          >
            Empezar una carrera
          </Link>
        </div>
      </header>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">
          Qué vas a encontrar acá que allá no
        </h2>
        <div className="mt-5 space-y-4">
          {DIFERENCIAS.map((d) => (
            <div key={d.titulo} className="card-gradient rounded-2xl border border-white/5 p-5">
              <h3 className="font-display text-base font-black uppercase text-white">{d.titulo}</h3>
              <p className="mt-1.5 font-sans text-[14px] leading-relaxed text-slate-300">{d.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">
          Los tres tipos de juego que hay dando vueltas
        </h2>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-slate-400">
          Se parecen en que son cortos, gratis y de navegador, pero no juegan a lo mismo. Esto es
          lo que hace cada uno, a agosto de 2026.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-left font-sans text-[13px]">
            <thead>
              <tr className="border-b border-white/10 font-sport text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">De qué va</th>
                <th className="py-2">Ejemplos</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="py-3 pr-3 font-bold text-white">Carrera de futbolista</td>
                <td className="py-3 pr-3">
                  Nacés jugador y vivís tu carrera a fuerza de decisiones. Se comparte la ficha del
                  retiro.
                </td>
                <td className="py-3">Copero, El Ídolo</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-3 font-bold text-white">Draft de selecciones</td>
                <td className="py-3 pr-3">
                  Te sortean selecciones del Mundial y armás un once eligiendo un jugador de cada
                  una.
                </td>
                <td className="py-3">7a0</td>
              </tr>
              <tr>
                <td className="py-3 pr-3 font-bold text-white">Gambeta</td>
                <td className="py-3 pr-3">
                  Draft con planteles de clubes argentinos, más carrera, modo DT, reto diario y
                  ranking. Todo en el mismo lugar.
                </td>
                <td className="py-3">Este</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-sans text-[12px] leading-relaxed text-slate-500">
          Copero, El Ídolo y 7a0 son juegos de otra gente y no tienen ninguna relación con Gambeta.
          Los nombramos porque es lo que se busca; si algo de esto cambió, se corrige.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">Preguntas</h2>
        <dl className="mt-4 space-y-4">
          {PREGUNTAS.map((p) => (
            <div key={p.q}>
              <dt className="font-display text-base font-black text-white">{p.q}</dt>
              <dd className="mt-1 font-sans text-[14px] leading-relaxed text-slate-300">{p.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 text-center">
        <Link
          href="/draft/"
          className="btn-primary inline-block rounded-2xl px-8 py-4 font-sport text-xs font-black uppercase tracking-widest"
        >
          Armar mi 11 ⚽
        </Link>
        <p className="mt-3 font-sport text-[11px] uppercase tracking-wider text-slate-500">
          <Link href="/juegos-de-futbol-argentino/" className="transition-colors hover:text-[#74ACDF]">
            Todos los modos
          </Link>{' '}
          ·{' '}
          <Link href="/simulador-carrera-futbolista/" className="transition-colors hover:text-[#74ACDF]">
            Simulador de carrera
          </Link>
        </p>
      </div>

      <AdSlot />
      <AdAncla />
    </div>
  )
}
