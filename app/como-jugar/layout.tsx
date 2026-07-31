import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cómo jugar | Gambeta',
  description: 'Draft, torneo, modo carrera y ranking explicados en dos minutos. Gratis y sin registro.',
}

export default function ComoJugarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
