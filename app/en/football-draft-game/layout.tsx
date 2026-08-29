import type { Metadata } from 'next'

/**
 * La puerta en inglés, que hasta ahora no existía: `/en/` es un espejo del juego, pero ninguna de
 * sus URLs le dice al buscador de qué se trata.
 *
 * Las consultas salen del autocompletado de Google (en-US, 29/8/2026), que solo sugiere lo que la
 * gente efectivamente tipea: "football draft game" con sus variantes online / free / simulator /
 * "38 0", "soccer draft game" (+ unblocked, que es tráfico de escuela) y "build your xi" (+ game,
 * football, world cup).
 *
 * Y no es solo alcance: un visitante de Estados Unidos vale entre 15 y 28 dólares cada mil
 * vistas de aviso contra 1 a 3 de uno argentino. La misma pantalla, diez veces la plata.
 *
 * Acá NO se promociona el modo carrera a propósito: sus dilemas y crónicas siguen escritos en
 * castellano dentro de `lib/`, así que mandar tráfico en inglés a esa pantalla es mandarlo a
 * rebotar. Cuando se traduzca esa tanda, esta página suma la sección y se escribe la suya.
 */
export const metadata: Metadata = {
  title: 'Football Draft Game: Build Your XI From Real Squads | Gambeta',
  description:
    'A free football draft game in your browser: spin real club squads from Argentine football, pick one player per position, build your XI and simulate the season. No download, no sign-up, plus a daily challenge everyone plays with the same draw.',
  alternates: {
    canonical: '/en/football-draft-game/',
    languages: {
      es: '/juegos-de-futbol-argentino/',
      en: '/en/football-draft-game/',
      'pt-BR': '/pt/monte-seu-time/',
    },
  },
  openGraph: {
    title: 'Football Draft Game: Build Your XI From Real Squads',
    description:
      'Spin real club squads, pick one player per position, simulate the season. Free, in your browser, no sign-up.',
    locale: 'en_US',
    images: ['/social/og.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
