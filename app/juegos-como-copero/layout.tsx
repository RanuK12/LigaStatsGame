import type { Metadata } from 'next'

/**
 * La consulta que la gente escribe cuando ya jugó a otro y quiere más.
 *
 * Medido en el autocompletado de Google (ar, 29/8/2026), que solo sugiere lo que la gente
 * efectivamente tipea: "juegos como copero", "juegos como copero y potrero", "juegos como copero
 * y el idolo", "juegos de futbol como copero". Es la intención más caliente que existe para
 * nosotros —el que la escribe YA quiere exactamente esto— y no la contesta nadie: los que
 * rankean son notas de portales, no un juego.
 *
 * Es lo contrario de las 36 páginas de equipos históricos, que salieron 46 impresiones y 0 clics
 * en seis días: ahí competíamos contra Wikipedia por una intención informativa que no era
 * nuestra. Acá la intención es jugar, que es lo único que sabemos hacer.
 */
export const metadata: Metadata = {
  title: 'Juegos como Copero y El Ídolo: draft y carrera del fútbol argentino | Gambeta',
  description:
    'Si te gustaron los juegos de carrera de futbolista, Gambeta suma el draft con planteles reales del fútbol argentino, el Ascenso jugable, modo DT y reto diario. Gratis, en el navegador y sin registro.',
  alternates: { canonical: '/juegos-como-copero/' },
  openGraph: {
    title: 'Juegos como Copero y El Ídolo, en el navegador',
    description:
      'Draft con planteles reales de 1994 a hoy, carrera desde el Federal A, modo DT y reto diario. Gratis y sin registro.',
    images: ['/social/og.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
