import Link from 'next/link'
import playersData from '@/data/players.json'
import squadsData from '@/data/squads.json'
import ligasData from '@/data/derived/ligas.json'
import equiposData from '@/data/derived/equipos.json'
import AdSlot from '@/components/AdSlot'
import AdAncla from '@/components/AdAncla'

/**
 * Los números salen del dataset en tiempo de build, no escritos a mano: si mañana entran veinte
 * clubes más, la página lo dice sola. Una cifra vieja en una landing es peor que no ponerla.
 */
const JUGADORES = (playersData as unknown[]).length
const PLANTELES = (squadsData as unknown[]).length
const HISTORICOS = (equiposData as unknown[]).length
const LIGAS = (ligasData as { ligas: unknown[] }).ligas.length
const CLUBES_CARRERA = (ligasData as { clubes: unknown[] }).clubes.length
const PAISES = (ligasData as { paises: { nombre: string }[] }).paises.map((p) => p.nombre)
// De la primera para abajo. El orden del archivo es el de carga, y listarlas con el Federal A
// en el medio hace que la frase se lea como si no supiéramos cómo funciona el ascenso.
const ORDEN_ARG = ['ar-1', 'ar-2', 'ar-3', 'ar-3f']
const LIGAS_ARG = (ligasData as { ligas: { id: string; pais: string; nombre: string }[] }).ligas
  .filter((l) => l.pais === 'Argentina')
  .sort((a, b) => ORDEN_ARG.indexOf(a.id) - ORDEN_ARG.indexOf(b.id))
  .map((l) => l.nombre)

const MODOS = [
  {
    href: '/draft/',
    nombre: 'Draft de leyendas',
    que: `Una ruleta te sortea un plantel real del fútbol argentino y elegís un jugador para cada puesto. Cuando tenés los once, simulás la temporada y ves dónde salís.`,
    detalle: `${PLANTELES} planteles y ${JUGADORES.toLocaleString('es-AR')} jugadores, de 1994 a hoy.`,
  },
  {
    href: '/carrera/',
    nombre: 'Modo carrera',
    que: 'Creás un pibe de 16 años, elegís en qué club debuta y vivís su carrera: titularidad, lesiones, títulos, la primera oferta de Europa, el Mundial y el retiro.',
    detalle: `${CLUBES_CARRERA} clubes de ${PAISES.length} países, y podés arrancar en el Torneo Federal A.`,
  },
  {
    href: '/daily/',
    nombre: 'Reto diario',
    que: 'Un reto por día con una regla distinta —solo Boca y River, solo cordobeses, solo zurdos— y el mismo bombo para todo el mundo. Se compara y se arma racha.',
    detalle: 'Cambia a la medianoche. El resultado se pega en un grupo sin spoilear.',
  },
  {
    href: '/equipos/',
    nombre: 'Equipos históricos',
    que: 'Los planteles que un hincha reconoce, jugador por jugador: el Vélez del 94, el Boca de Bianchi, el River del 96.',
    detalle: `${HISTORICOS} planteles, cada jugador cruzado contra tres fuentes.`,
  },
  {
    href: '/versus/',
    nombre: 'Versus',
    que: 'Dos jugadores cara a cara con sus números al lado, para terminar la discusión con un amigo.',
    detalle: 'También se juega en tiempo real contra otra persona.',
  },
]

export default function JuegosDeFutbolArgentino() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="text-center">
        <p className="font-sport text-[11px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
          Gratis · en el navegador · sin registro
        </p>
        <h1 className="mt-3 font-display text-3xl font-black uppercase leading-tight text-white md:text-5xl">
          Juegos de fútbol argentino, sin descargar nada
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-sans text-[15px] leading-relaxed text-slate-300">
          Cinco formas de jugar con el fútbol de acá, todas en la misma página y todas con datos
          reales: {JUGADORES.toLocaleString('es-AR')} jugadores, {PLANTELES} planteles y{' '}
          {LIGAS} ligas de {PAISES.length} países. No hay que instalar nada, no hay que crear una
          cuenta y no cuesta plata.
        </p>
        <Link
          href="/draft/"
          className="btn-primary mt-6 inline-block rounded-2xl px-8 py-4 font-sport text-xs font-black uppercase tracking-widest"
        >
          Jugar ahora ⚽
        </Link>
      </header>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl font-black uppercase text-white">Los cinco modos</h2>
        {MODOS.map((m) => (
          <article
            key={m.href}
            className="card-gradient rounded-3xl border border-white/10 p-5 md:p-6"
          >
            <h3 className="font-display text-xl font-black uppercase text-white">
              <Link href={m.href} className="transition-colors hover:text-[#74ACDF]">
                {m.nombre}
              </Link>
            </h3>
            <p className="mt-2 font-sans text-[14px] leading-relaxed text-slate-300">{m.que}</p>
            <p className="mt-2 font-sport text-[11px] uppercase tracking-wider text-slate-500">
              {m.detalle}
            </p>
          </article>
        ))}
      </section>

      {/* Lo que no tiene ningún otro. Es el único ángulo donde no competimos contra un portal
          gigante, y es el que trajo jugadores de Perú y Paraguay al agregar sus ligas. */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-black uppercase text-white">
          El único con el Ascenso
        </h2>
        <p className="mt-3 font-sans text-[15px] leading-relaxed text-slate-300">
          En casi todos los juegos de fútbol elegís entre los mismos veinte equipos grandes. Acá
          podés empezar abajo del todo —en el {LIGAS_ARG[LIGAS_ARG.length - 1]}— y subir
          peleándola, con ascensos y descensos de verdad. Están las {LIGAS_ARG.length} categorías
          argentinas, de la primera para abajo: {LIGAS_ARG.join(', ')}.
        </p>
        <p className="mt-3 font-sans text-[15px] leading-relaxed text-slate-300">
          Y no termina en Argentina: el modo carrera tiene {CLUBES_CARRERA} clubes de{' '}
          {PAISES.join(', ')}, cada uno con su primera y su segunda división, su copa nacional y
          su lugar en la Libertadores.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-black uppercase text-white">Preguntas</h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="font-display text-base font-black text-white">¿Hay que descargar algo?</dt>
            <dd className="mt-1 font-sans text-[14px] leading-relaxed text-slate-300">
              No. Corre en el navegador, en la computadora y en el teléfono.
            </dd>
          </div>
          <div>
            <dt className="font-display text-base font-black text-white">¿Hay que registrarse?</dt>
            <dd className="mt-1 font-sans text-[14px] leading-relaxed text-slate-300">
              No hace falta. La cuenta sirve solo si querés que tu ELO cuente en el ranking global;
              todo lo demás se juega igual sin ella, y la partida se guarda en tu navegador.
            </dd>
          </div>
          <div>
            <dt className="font-display text-base font-black text-white">¿Es gratis?</dt>
            <dd className="mt-1 font-sans text-[14px] leading-relaxed text-slate-300">
              Sí, entero y gratis. Se banca con publicidad y donaciones, sin nada pago adentro del juego.
            </dd>
          </div>
          <div>
            <dt className="font-display text-base font-black text-white">
              ¿De dónde salen los jugadores?
            </dt>
            <dd className="mt-1 font-sans text-[14px] leading-relaxed text-slate-300">
              De planteles reales. Cada jugador de los {HISTORICOS} planteles históricos está
              cruzado contra tres fuentes antes de entrar: no hay ninguno inventado.
            </dd>
          </div>
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
          <Link href="/como-jugar/" className="transition-colors hover:text-[#74ACDF]">
            Cómo se juega
          </Link>{' '}
          ·{' '}
          <Link href="/juegos-como-copero/" className="transition-colors hover:text-[#74ACDF]">
            Juegos como Copero
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
