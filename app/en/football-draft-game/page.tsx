import Link from 'next/link'
import playersData from '@/data/players.json'
import squadsData from '@/data/squads.json'
import equiposData from '@/data/derived/equipos.json'
import AdSlot from '@/components/AdSlot'
import AdAncla from '@/components/AdAncla'

const JUGADORES = (playersData as unknown[]).length
const PLANTELES = (squadsData as unknown[]).length
const HISTORICOS = (equiposData as unknown[]).length

const PASOS = [
  {
    titulo: 'Spin the wheel',
    texto: `You get a whole squad, not a random name: Boca 2001, River 1996, Vélez 1994. ${PLANTELES} real squads from 1994 to today are in the pool.`,
  },
  {
    titulo: 'Pick one player for the position',
    texto: 'Only players who can actually play there show up. A centre-back is not going up front because you feel like it.',
  },
  {
    titulo: 'Eleven picks, eleven squads',
    texto: 'Formation is yours: 4-3-3, 4-4-2, 3-5-2. Chemistry counts, so a side full of strangers rates worse than one that fits.',
  },
  {
    titulo: 'Simulate the season',
    texto: 'Your XI plays a full league or a cup, match by match, with a table, scorers and assists. Then you find out where you finished.',
  },
]

const PREGUNTAS = [
  {
    q: 'Is it free?',
    a: 'Yes, all of it. It runs on ads and donations: nothing inside the game is paid and nothing that decides a match can be bought.',
  },
  {
    q: 'Do I have to download or install anything?',
    a: 'No. It is a browser football game: it works on a laptop, a school Chromebook or a phone, with no install and nothing to unblock.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. An account only makes your ELO count in the global ranking; everything else plays the same without it and your progress is saved in your browser.',
  },
  {
    q: 'Are the players real?',
    a: `Yes. ${JUGADORES.toLocaleString('en-US')} real players from Argentine football, including Maradona, Riquelme, Batistuta, Verón, Tevez, Mascherano and Bochini. The ${HISTORICOS} historic squads are checked against three sources before they go in.`,
  },
  {
    q: 'How long does a game take?',
    a: 'About five minutes: eleven spins, eleven picks and the simulation. Most people play several in a row.',
  },
  {
    q: 'Is there a daily challenge?',
    a: 'Every day, and everyone gets the exact same draw with a rule of its own. Your result comes out as coloured blocks you can paste into a group chat without spoiling anything.',
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

/**
 * La página en inglés se escribe, no se traduce: el ángulo que engancha afuera es otro.
 *
 * Los juegos de draft que ya conoce el mundo reparten SELECCIONES del Mundial. El nuestro reparte
 * planteles de clubes, que es lo que no tiene ninguno, y encima de una liga que afuera se conoce
 * por sus jugadores y no por sus equipos. Eso es lo que hay que contar primero.
 */
export default function FootballDraftGame() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />

      <header className="text-center">
        <p className="font-sport text-[11px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
          Free · in your browser · no sign-up
        </p>
        <h1 className="mt-3 font-display text-3xl font-black uppercase leading-tight text-white md:text-5xl">
          Football draft game
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-sans text-[15px] leading-relaxed text-slate-300">
          Most draft games hand you national teams. This one hands you{' '}
          <strong className="text-white">real club squads</strong> from Argentine football: the
          wheel spins, you get Boca 2001 or River 1996, and you pick one player for each position
          until your XI is done. Then you simulate the season and see where you finish.
        </p>
        <Link
          href="/en/draft/"
          className="btn-primary mt-6 inline-block rounded-2xl px-8 py-4 font-sport text-xs font-black uppercase tracking-widest"
        >
          Build my XI ⚽
        </Link>
      </header>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">How a draft works</h2>
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
          Why the squads matter
        </h2>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-slate-300">
          Argentina is the league that raised Maradona, Riquelme, Batistuta, Verón, Tevez and
          Mascherano, and half the world knows the players without ever having seen the teams they
          came from. Here you get the teams: {HISTORICOS} historic squads, player by player, from
          1994 to today.
        </p>
        <p className="mt-3 font-sans text-[14px] leading-relaxed text-slate-300">
          That is also what makes two drafts different. You are not choosing from one big list of
          the best players alive — you are choosing from whoever happened to be at that club that
          season, which is where the good decisions are.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">
          The daily challenge and the ranking
        </h2>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-slate-300">
          One challenge a day, the same draw for everybody, with a rule of its own. Finish it and
          your result comes out as coloured blocks that you can paste anywhere without spoiling
          which players you got. Tournaments move your ELO, and the ranking is global.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/en/daily/"
            className="btn-secondary inline-block rounded-2xl px-6 py-3 font-sport text-[11px] font-black uppercase tracking-widest"
          >
            Today&apos;s challenge
          </Link>
          <Link
            href="/en/leaderboard/"
            className="btn-secondary inline-block rounded-2xl px-6 py-3 font-sport text-[11px] font-black uppercase tracking-widest"
          >
            Ranking
          </Link>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">Questions</h2>
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
          href="/en/draft/"
          className="btn-primary inline-block rounded-2xl px-8 py-4 font-sport text-xs font-black uppercase tracking-widest"
        >
          Play the draft ⚽
        </Link>
        <p className="mt-3 font-sport text-[11px] uppercase tracking-wider text-slate-500">
          <Link href="/en/como-jugar/" className="transition-colors hover:text-[#74ACDF]">
            How to play
          </Link>{' '}
          ·{' '}
          <Link href="/en/records/" className="transition-colors hover:text-[#74ACDF]">
            Records
          </Link>
        </p>
      </div>

      <AdSlot />
      <AdAncla />
    </div>
  )
}
