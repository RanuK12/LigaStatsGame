import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import equipos from '@/data/derived/equipos.json'
import CompartirEquipo from '@/components/CompartirEquipo'

type Equipo = (typeof equipos)[number]

const buscar = (slug: string): Equipo | undefined => equipos.find((e) => e.slug === slug)

// Con output: 'export' esto es lo que hace que las 36 páginas se escriban en el build.
export function generateStaticParams() {
  return equipos.map((e) => ({ slug: e.slug }))
}

/** El texto que se lee en Google, y que tiene que ganarle al clic de otro resultado. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const e = buscar(slug)
  if (!e) return {}

  const titulo = `${e.club} ${e.season}: el plantel completo`
  const desc = e.hito
    ? `${e.hito} Los ${e.plantel.length} jugadores del ${e.club} ${e.season}, uno por uno.`
    : `El plantel del ${e.club} ${e.season}, jugador por jugador.`

  return {
    title: `${titulo} | Gambeta`,
    description: desc,
    alternates: { canonical: `/equipos/${e.slug}/` },
    openGraph: {
      title: titulo,
      description: desc,
      images: ['/social/og.png'],
    },
  }
}

const NOMBRE_POS: Record<string, string> = {
  GK: 'Arquero',
  CB: 'Defensor central',
  LB: 'Lateral izquierdo',
  RB: 'Lateral derecho',
  CDM: 'Volante central',
  CM: 'Mediocampista',
  CAM: 'Enganche',
  LM: 'Volante izquierdo',
  RM: 'Volante derecho',
  LW: 'Extremo izquierdo',
  RW: 'Extremo derecho',
  CF: 'Segundo delantero',
  ST: 'Delantero',
}

export default async function EquipoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = buscar(slug)
  if (!e) notFound()

  // Los otros equipos del mismo club: es la navegación que un hincha quiere y, de paso, lo que
  // hace que Google llegue a las 36 páginas y no solo a la que rankeó.
  const delMismoClub = equipos.filter((o) => o.clubId === e.clubId && o.slug !== e.slug)
  const idx = equipos.findIndex((o) => o.slug === e.slug)
  const vecinos = [equipos[idx - 1], equipos[idx + 1]].filter(Boolean)

  // Le dice a Google que esto es un equipo deportivo con un plantel, no un texto suelto.
  const datos = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: `${e.club} ${e.season}`,
    sport: 'Fútbol',
    url: `https://gambetafutbol.games/equipos/${e.slug}/`,
    ...(e.estadio && { location: { '@type': 'Place', name: e.estadio } }),
    athlete: e.plantel.map((p) => ({ '@type': 'Person', name: p.name })),
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }} />

      <article className="mx-auto max-w-3xl">
        <nav className="font-sport text-[11px] font-bold uppercase tracking-widest text-slate-500">
          <Link href="/equipos/" className="transition-colors hover:text-[#74ACDF]">
            Equipos históricos
          </Link>
          <span className="mx-2">·</span>
          <span className="text-slate-400">{e.club}</span>
        </nav>

        <header className="mt-5">
          <div
            className="h-1.5 w-24 rounded-full"
            style={{ background: `linear-gradient(90deg, ${e.colores[0]}, ${e.colores[1]})` }}
          />
          <h1 className="mt-4 font-display text-4xl font-black uppercase leading-tight tracking-tight text-white md:text-5xl">
            {e.club} {e.season}
          </h1>
          {e.hito && (
            <p className="mt-3 font-sans text-lg leading-relaxed text-[#F6C750]">{e.hito}</p>
          )}
          <p className="mt-3 font-sans text-[13px] leading-relaxed text-slate-400">
            {e.apodo && <>Apodo: <strong className="text-slate-300">{e.apodo}</strong>. </>}
            {e.estadio && <>Estadio: <strong className="text-slate-300">{e.estadio}</strong>. </>}
            {e.ciudad && <>{e.ciudad}. </>}
            {e.plantel.length} jugadores registrados, con un promedio de{' '}
            <strong className="text-white">{e.ovrPromedio}</strong> de valoración.
          </p>
        </header>

        {/* El botón arriba, antes del plantel: el que llegó buscando "Vélez 1994" ya vio lo que
            vino a ver en el título, y este es el momento en que se le ofrece jugar. */}
        <div className="mt-7 rounded-2xl border border-[#74ACDF]/25 bg-gradient-to-r from-[#74ACDF]/[0.08] to-transparent p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <p className="font-sans text-[13px] leading-relaxed text-slate-300">
            Este plantel está en el bombo del draft. Podés armar tu once con estos jugadores y
            simular el torneo.
          </p>
          <Link
            href={`/draft?mode=clasico&club=${e.clubId}&utm_source=google_seo&utm_medium=organic&utm_campaign=equipo_${e.slug}`}
            className="btn-primary mt-4 block whitespace-nowrap px-7 py-3 text-center font-sport text-[11px] font-black uppercase sm:mt-0"
          >
            Jugar gratis con este equipo
          </Link>
        </div>

        <section className="mt-9">
          <h2 className="font-display text-2xl font-black uppercase text-white">El plantel</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            {e.plantel.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 ${i % 2 ? 'bg-white/[0.02]' : ''}`}
              >
                <span className="w-6 shrink-0 font-sport text-[11px] font-bold text-slate-600">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-sans text-[15px] font-semibold text-white">{p.name}</span>
                  {p.legendary && <span className="ml-1.5 text-[#F6C750]">★</span>}
                  <span className="ml-2 font-sport text-[11px] uppercase tracking-wider text-slate-500">
                    {NOMBRE_POS[p.position] ?? p.position}
                  </span>
                </span>
                {p.nationality && p.nationality !== 'Argentina' && (
                  <span className="hidden shrink-0 font-sans text-[11px] text-slate-500 sm:inline">
                    {p.nationality}
                  </span>
                )}
                <span className="w-8 shrink-0 text-right font-display text-lg font-black text-[#74ACDF]">
                  {p.rating}
                </span>
              </div>
            ))}
          </div>
          {e.figura && (
            <p className="mt-3 font-sans text-[12px] text-slate-500">
              La figura del plantel es <strong className="text-slate-300">{e.figura.name}</strong>,
              con {e.figura.rating} de valoración.
            </p>
          )}
        </section>

        {delMismoClub.length > 0 && (
          <section className="mt-10">
            <h2 className="font-sport text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
              Otros equipos de {e.club}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {delMismoClub.map((o) => (
                <Link
                  key={o.slug}
                  href={`/equipos/${o.slug}/`}
                  className="rounded-xl border border-white/10 px-4 py-2 font-sport text-[12px] font-bold text-slate-300 transition-colors hover:border-[#74ACDF]/40 hover:text-white"
                >
                  {o.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Compartir la página, no el resultado de una partida: al que le mandan "el plantel del
            Vélez del 94" le llega algo que se puede leer sin jugar, y ahí adentro está el juego. */}
        <CompartirEquipo label={e.label} hito={e.hito} slug={e.slug} />

        <nav className="mt-10 flex flex-wrap gap-3 border-t border-white/5 pt-6">
          {vecinos.map((o) => (
            <Link
              key={o.slug}
              href={`/equipos/${o.slug}/`}
              className="font-sport text-[12px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-[#74ACDF]"
            >
              {o.label} →
            </Link>
          ))}
        </nav>
      </article>
    </div>
  )
}
