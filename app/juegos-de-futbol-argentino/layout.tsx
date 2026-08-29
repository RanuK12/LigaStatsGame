import type { Metadata } from 'next'

/**
 * La única puerta de entrada que no depende de que ya te sepas el nombre.
 *
 * Medido el 8/8 en Search Console: las diez consultas que traen tráfico son las diez la marca
 * ("gambeta juego" 191 clics, "gambeta" 65). Cero clics de consultas genéricas. Google no nos
 * trae gente nueva, nos devuelve la que alguien ya nos mandó, y por eso el tráfico sube cuando
 * publicamos y se desinfla solo.
 *
 * Esta página va a la intención de JUGAR —"juegos de fútbol argentino", "sin descargar",
 * "gratis"— con lo único que no tiene ningún competidor: el Ascenso jugable y siete países.
 * Pelear "juegos de futbol gratis" a secas contra Poki y CrazyGames con un dominio nuevo no se
 * gana; el largo con apellido argentino, sí.
 */
export const metadata: Metadata = {
  title: 'Juegos de fútbol argentino gratis, sin descargar | Gambeta',
  description:
    'Cinco juegos de fútbol argentino en el navegador: armá tu 11 con planteles reales, viví tu carrera desde el Federal A, simulá torneos y competí en el ranking. Gratis, sin registro y sin descargar nada.',
  // Las tres puertas de entrada, una por idioma. No son traducciones literales entre sí —cada
  // una va a las consultas que se tipean en su mercado, medidas en el autocompletado de Google—
  // pero cumplen la misma función, así que se declaran como equivalentes.
  alternates: {
    canonical: '/juegos-de-futbol-argentino/',
    languages: {
      es: '/juegos-de-futbol-argentino/',
      en: '/en/football-draft-game/',
      'pt-BR': '/pt/monte-seu-time/',
    },
  },
  openGraph: {
    title: 'Juegos de fútbol argentino gratis, sin descargar',
    description:
      'Draft con planteles reales, modo carrera desde el Ascenso, torneos y ranking. En el navegador, gratis y sin registro.',
    images: ['/social/og.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
