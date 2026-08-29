import Link from 'next/link'
import ligasData from '@/data/derived/ligas.json'
import { MAX_SEASONS } from '@/lib/career-engine'
import AdSlot from '@/components/AdSlot'
import AdAncla from '@/components/AdAncla'

const CLUBES = (ligasData as { clubes: unknown[] }).clubes.length
const LIGAS = (ligasData as { ligas: unknown[] }).ligas.length
const PAISES = (ligasData as { paises: { nombre: string }[] }).paises.map((p) => p.nombre)

const PASOS = [
  {
    titulo: 'Nacés a los 16 y elegís dónde',
    texto: `Nombre, puesto y club. Podés arrancar en un grande o en el Torneo Federal A y subir a fuerza de goles, con ${CLUBES} clubes de ${PAISES.length} países disponibles.`,
  },
  {
    titulo: 'Cada temporada te pone en una encrucijada',
    texto: 'El técnico no te pone, te llega una oferta de un club más chico donde sí jugás, te lesionás en marzo, el vestuario se parte. Elegís y la carrera cambia.',
  },
  {
    titulo: 'Los números te siguen',
    texto: 'Goles, asistencias, títulos, convocatorias a la Selección y el cariño del hincha del club donde te quedaste. La idolatría se construye quedándose, no cambiando de camiseta.',
  },
  {
    titulo: 'Europa, el Mundial y el retiro',
    texto: `Si rendís, te compran. Si seguís rindiendo, jugás el Mundial. A las ${MAX_SEASONS} temporadas te retirás y el juego te dice a qué leyenda real se pareció tu carrera.`,
  },
  {
    titulo: 'La ficha final se descarga',
    texto: 'Al retirarte queda una ficha con todo lo que hiciste, en PDF o en imagen, para guardarla o mandarla al grupo.',
  },
]

const PREGUNTAS = [
  {
    q: '¿Hay que descargar o instalar algo?',
    a: 'No. Es un simulador de carrera que corre en el navegador, en la computadora y en el teléfono.',
  },
  {
    q: '¿Se puede dejar por la mitad y seguir después?',
    a: 'Sí. La carrera se guarda en tu navegador y al volver te ofrece continuarla. Si creás una cuenta, además queda tu puntaje en el ranking.',
  },
  {
    q: '¿Cuánto dura una carrera entera?',
    a: `${MAX_SEASONS} temporadas. Se puede jugar de a ratos: cada temporada son un par de minutos.`,
  },
  {
    q: '¿Se puede empezar en el Ascenso?',
    a: `Sí, y es la partida más linda: arrancás en el Torneo Federal A y tenés que ascender. Hay ${LIGAS} ligas cargadas entre ${PAISES.slice(0, -1).join(', ')} y ${PAISES[PAISES.length - 1]}.`,
  },
  {
    q: '¿Es gratis?',
    a: 'Sí, entero. Se banca con publicidad y donaciones: nada de lo que decide tu carrera se compra.',
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

export default function SimuladorCarrera() {
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
          Simulador de carrera de futbolista
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-sans text-[15px] leading-relaxed text-slate-300">
          Empezás a los 16 en el club que elijas y jugás {MAX_SEASONS} temporadas: te ganás el
          puesto, te lesionás, te putean, te compran, volvés. Al final te retirás y ves qué clase
          de carrera te tocó vivir.
        </p>
        <Link
          href="/carrera/"
          className="btn-primary mt-6 inline-block rounded-2xl px-8 py-4 font-sport text-xs font-black uppercase tracking-widest"
        >
          Empezar mi carrera ⚽
        </Link>
      </header>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">Cómo es una carrera</h2>
        <ol className="mt-5 space-y-4">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="card-gradient rounded-2xl border border-white/5 p-5">
              <h3 className="font-display text-base font-black uppercase text-white">
                <span className="text-[#74ACDF]">{i + 1}.</span> {p.titulo}
              </h3>
              <p className="mt-1.5 font-sans text-[14px] leading-relaxed text-slate-300">{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">
          Por qué no es el mismo simulador de siempre
        </h2>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-slate-300">
          Los clubes son reales y el ascenso también: si te va bien en el Federal A, subís de
          categoría de verdad y cambia quién te quiere comprar. Y el que se queda en su club diez
          temporadas termina siendo ídolo, con todo lo que eso significa cuando llega la oferta de
          afuera.
        </p>
        <p className="mt-3 font-sans text-[14px] leading-relaxed text-slate-300">
          Si preferís las partidas de cinco minutos, está el{' '}
          <Link href="/draft/" className="text-[#74ACDF] underline underline-offset-2 hover:text-white">
            draft con planteles reales
          </Link>{' '}
          y el{' '}
          <Link href="/dt/" className="text-[#74ACDF] underline underline-offset-2 hover:text-white">
            modo DT
          </Link>
          , que es la misma historia desde el banco.
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
          href="/carrera/"
          className="btn-primary inline-block rounded-2xl px-8 py-4 font-sport text-xs font-black uppercase tracking-widest"
        >
          Jugar la carrera ⚽
        </Link>
        <p className="mt-3 font-sport text-[11px] uppercase tracking-wider text-slate-500">
          <Link href="/juegos-como-copero/" className="transition-colors hover:text-[#74ACDF]">
            Juegos como Copero
          </Link>{' '}
          ·{' '}
          <Link href="/juegos-de-futbol-argentino/" className="transition-colors hover:text-[#74ACDF]">
            Todos los modos
          </Link>
        </p>
      </div>

      <AdSlot />
      <AdAncla />
    </div>
  )
}
