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
    titulo: 'Gire a roleta',
    texto: `Não sai um jogador solto: sai um elenco inteiro — Boca 2001, River 1996, Vélez 1994. São ${PLANTELES} elencos reais, de 1994 até hoje.`,
  },
  {
    titulo: 'Escolha um jogador para a posição',
    texto: 'Só aparecem os que realmente jogam ali. Zagueiro não vira centroavante porque você quis.',
  },
  {
    titulo: 'Onze escolhas, onze elencos',
    texto: 'A formação é sua: 4-3-3, 4-4-2, 3-5-2. O entrosamento conta, então um time de estranhos pontua menos que um que se encaixa.',
  },
  {
    titulo: 'Simule a temporada',
    texto: 'Seu XI joga um campeonato inteiro, jogo a jogo, com tabela, artilheiros e assistências. No fim você vê onde terminou.',
  },
]

const PREGUNTAS = [
  {
    q: 'É grátis?',
    a: 'É, inteiro. Se banca com publicidade e doações: não existe nada pago dentro do jogo nem vantagem que se compre.',
  },
  {
    q: 'Preciso baixar ou instalar alguma coisa?',
    a: 'Não. Roda no navegador, no computador e no celular, sem instalar nada.',
  },
  {
    q: 'Preciso criar conta?',
    a: 'Não. A conta só serve para o seu ELO entrar no ranking global; o resto joga igual sem ela e o progresso fica salvo no seu navegador.',
  },
  {
    q: 'Os jogadores são reais?',
    a: `São. ${JUGADORES.toLocaleString('pt-BR')} jogadores reais do futebol argentino, incluindo Maradona, Riquelme, Batistuta, Verón, Tevez, Mascherano e Bochini. Os ${HISTORICOS} elencos históricos são conferidos em três fontes antes de entrar.`,
  },
  {
    q: 'Quanto dura uma partida?',
    a: 'Uns cinco minutos: onze giros, onze escolhas e a simulação. A maioria joga várias seguidas.',
  },
  {
    q: 'Tem desafio diário?',
    a: 'Todo dia, e o sorteio é o mesmo para todo mundo, com uma regra própria. O resultado sai em quadradinhos coloridos para colar no grupo sem dar spoiler.',
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

export default function MonteSeuTime() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />

      <header className="text-center">
        <p className="font-sport text-[11px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
          Grátis · no navegador · sem cadastro
        </p>
        <h1 className="mt-3 font-display text-3xl font-black uppercase leading-tight text-white md:text-5xl">
          Monte seu time de futebol
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-sans text-[15px] leading-relaxed text-slate-300">
          Os jogos de draft que você conhece sorteiam <strong className="text-white">seleções</strong>.
          Aqui a roleta sorteia <strong className="text-white">elencos de clubes</strong> do futebol
          argentino: cai o Boca 2001 ou o River 1996 e você escolhe um jogador para cada posição
          até fechar o seu XI. Depois simula a temporada e vê onde terminou.
        </p>
        <Link
          href="/pt/draft/"
          className="btn-primary mt-6 inline-block rounded-2xl px-8 py-4 font-sport text-xs font-black uppercase tracking-widest"
        >
          Montar meu time ⚽
        </Link>
      </header>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">Como funciona o draft</h2>
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
          Por que os elencos mudam tudo
        </h2>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-slate-300">
          A Argentina é a liga de Maradona, Riquelme, Batistuta, Verón, Tevez e Mascherano, e quase
          todo mundo conhece os jogadores sem nunca ter visto os times de onde eles saíram. Aqui os
          times estão: {HISTORICOS} elencos históricos, jogador por jogador, de 1994 até hoje.
        </p>
        <p className="mt-3 font-sans text-[14px] leading-relaxed text-slate-300">
          É também o que faz um draft ser diferente do outro. Você não escolhe de uma lista com os
          melhores do mundo: escolhe entre quem estava naquele clube naquela temporada, e é aí que
          moram as boas decisões.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">
          Desafio diário e ranking
        </h2>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-slate-300">
          Um desafio por dia, o mesmo sorteio para todo mundo e uma regra própria. Terminou, o
          resultado vira quadradinhos coloridos para colar em qualquer grupo sem dar spoiler. Os
          campeonatos mexem no seu ELO e o ranking é global.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/pt/daily/"
            className="btn-secondary inline-block rounded-2xl px-6 py-3 font-sport text-[11px] font-black uppercase tracking-widest"
          >
            Desafio de hoje
          </Link>
          <Link
            href="/pt/leaderboard/"
            className="btn-secondary inline-block rounded-2xl px-6 py-3 font-sport text-[11px] font-black uppercase tracking-widest"
          >
            Ranking
          </Link>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-black uppercase text-white">Perguntas</h2>
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
          href="/pt/draft/"
          className="btn-primary inline-block rounded-2xl px-8 py-4 font-sport text-xs font-black uppercase tracking-widest"
        >
          Jogar o draft ⚽
        </Link>
        <p className="mt-3 font-sport text-[11px] uppercase tracking-wider text-slate-500">
          <Link href="/pt/como-jugar/" className="transition-colors hover:text-[#74ACDF]">
            Como jogar
          </Link>{' '}
          ·{' '}
          <Link href="/pt/records/" className="transition-colors hover:text-[#74ACDF]">
            Recordes
          </Link>
        </p>
      </div>

      <AdSlot />
      <AdAncla />
    </div>
  )
}
