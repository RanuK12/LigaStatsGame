import type { Metadata } from 'next'

/**
 * La segunda intención verificada en el autocompletado de Google (ar, 29/8/2026): "simulador de
 * carrera de futbolista", "simulador de carrera de futbolista online", "juego simulador de
 * carrera futbolista".
 *
 * El modo carrera ya existe y está en /carrera/, pero esa URL no le habla al buscador: no dice
 * de qué se trata ni contesta ninguna pregunta. Esta página es la puerta; el juego sigue siendo
 * el mismo de siempre.
 */
export const metadata: Metadata = {
  title: 'Simulador de carrera de futbolista online y gratis | Gambeta',
  description:
    'Nacés a los 16 en el club que elijas, te ganás la titularidad, te lesionás, te compran de Europa, jugás el Mundial y te retirás con tu ficha. 15 temporadas, 409 clubes de 8 países, en el navegador y sin registro.',
  alternates: { canonical: '/simulador-carrera-futbolista/' },
  openGraph: {
    title: 'Simulador de carrera de futbolista, gratis y en el navegador',
    description:
      'De pibe del Ascenso a leyenda: 15 temporadas, lesiones, ofertas de Europa, Mundial y ficha final para compartir.',
    images: ['/social/og.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
