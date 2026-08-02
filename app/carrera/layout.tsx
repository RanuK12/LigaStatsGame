import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Modo Carrera | Gambeta',
  description: 'Creá tu jugador a los 16 y viví 15 temporadas: titularidad, lesiones, ofertas de Europa, el Mundial y el retiro.',
  alternates: { canonical: '/carrera/' },
  openGraph: { images: ['/social/og-carrera.png'] },
  twitter: { images: ['/social/og-carrera.png'] },
}

export default function CarreraLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
