import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Modo Carrera | Gambeta',
  description: 'Creá tu jugador a los 16 y viví 15 temporadas: titularidad, lesiones, ofertas de Europa, el Mundial y el retiro.',
}

export default function CarreraLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
