import type { Metadata } from 'next'

/**
 * La puerta en portugués, con las consultas medidas en el autocompletado de Google (pt-BR,
 * 29/8/2026): "monte seu time de futebol", "monte seu time dos sonhos futebol", "monte seu time
 * de lendas", "jogo de montar time de futebol online" y "jogos como 7a0" —el draft brasileño de
 * selecciones, que es el que todos conocen ahí—.
 *
 * Igual que en inglés, acá NO se promociona el modo carrera: sus dilemas siguen escritos en
 * castellano dentro de `lib/` y mandar tráfico a esa pantalla es mandarlo a rebotar.
 */
export const metadata: Metadata = {
  title: 'Monte Seu Time de Futebol: Draft com Elencos Reais | Gambeta',
  description:
    'Jogo grátis de montar time no navegador: a roleta sorteia elencos reais do futebol argentino, você escolhe um jogador por posição, monta seu XI e simula a temporada. Sem baixar nada, sem cadastro e com desafio diário igual para todo mundo.',
  alternates: {
    canonical: '/pt/monte-seu-time/',
    languages: {
      es: '/juegos-de-futbol-argentino/',
      en: '/en/football-draft-game/',
      'pt-BR': '/pt/monte-seu-time/',
    },
  },
  openGraph: {
    title: 'Monte Seu Time de Futebol: Draft com Elencos Reais',
    description:
      'A roleta sorteia elencos reais, você escolhe um jogador por posição e simula a temporada. Grátis, no navegador.',
    locale: 'pt_BR',
    images: ['/social/og.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
