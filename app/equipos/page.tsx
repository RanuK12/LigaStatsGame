import type { Metadata } from 'next'
import Link from 'next/link'
import equipos from '@/data/derived/equipos.json'
import AdSlot from '@/components/AdSlot'
import AdAncla from '@/components/AdAncla'

export const metadata: Metadata = {
  title: 'Los mejores equipos del fútbol argentino, de 1994 a hoy | Gambeta',
  description:
    'El Vélez del 94, los Boca de Bianchi, el River del 96, el Estudiantes de Verón. Los planteles campeones del fútbol argentino, jugador por jugador.',
  alternates: { canonical: '/equipos/' },
  openGraph: { images: ['/social/og.png'] },
}

/**
 * El índice de los equipos históricos.
 *
 * Esta página y las 36 que cuelgan de ella existen por una razón medida: la búsqueda de Google es
 * el 85 % del tráfico y el sitio tenía once páginas, todas sobre el juego. Nadie busca "juego de
 * fútbol argentino"; se busca "Vélez 1994 plantel" o "Boca 2001 campeón de América".
 *
 * Es un componente de servidor a propósito: el HTML que se genera en el build ya trae los
 * nombres, así que Google no depende de ejecutar JavaScript para ver el contenido.
 */
export default function EquiposPage() {
  const porDecada = equipos.reduce<Record<string, typeof equipos>>((acc, e) => {
    const decada = `${String(e.season).slice(0, 3)}0`
    ;(acc[decada] ||= []).push(e)
    return acc
  }, {})
  const decadas = Object.keys(porDecada).sort()

  return (
    <div className="min-h-[calc(100vh-6rem)] px-4 py-10">
      <section className="mx-auto max-w-4xl text-center">
        <p className="font-sport text-[11px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
          Archivo histórico
        </p>
        <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
          Los mejores equipos del fútbol argentino
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-sans leading-relaxed text-slate-400">
          {equipos.length} planteles campeones, de {equipos[0]?.season} a{' '}
          {equipos[equipos.length - 1]?.season}. Cada uno con su plantel completo, jugador por
          jugador, y todos en el bombo del draft.
        </p>
      </section>

      {decadas.map((decada) => (
        <section key={decada} className="mx-auto mt-10 max-w-5xl">
          <h2 className="font-sport text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
            Los {decada.slice(2)}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {porDecada[decada].map((e) => (
              <Link
                key={e.slug}
                href={`/equipos/${e.slug}/`}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#74ACDF]/40 hover:bg-white/[0.06]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg font-black text-white group-hover:text-[#74ACDF]">
                    {e.label}
                  </span>
                  <span className="font-sport text-[11px] font-black text-[#F6C750]">
                    {e.ovrPromedio}
                  </span>
                </div>
                {e.hito && (
                  <p className="mt-1.5 line-clamp-2 font-sans text-[12px] leading-relaxed text-slate-400">
                    {e.hito}
                  </p>
                )}
                {e.figura && (
                  <p className="mt-2 font-sport text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {e.figura.name}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="mx-auto mt-12 max-w-2xl rounded-3xl border border-[#74ACDF]/25 bg-gradient-to-b from-[#74ACDF]/[0.08] to-transparent p-7 text-center">
        <h2 className="font-display text-2xl font-black uppercase text-white">
          Todos están en el bombo
        </h2>
        <p className="mx-auto mt-2 max-w-md font-sans text-[13px] leading-relaxed text-slate-300">
          En el draft te toca un plantel al azar y elegís un jugador. Uno de cada cuatro giros es
          un equipo histórico.
        </p>
        <Link
          href="/draft/"
          className="btn-primary mt-5 inline-block px-8 py-3 font-sport text-[11px] font-black uppercase"
        >
          Jugar gratis
        </Link>
      </section>

      <AdSlot />
      <AdAncla />
    </div>
  )
}
