import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Récords | Gambeta',
  description: 'Los máximos goleadores y los mejores puntajes del fútbol argentino, de 2015 a hoy.',
}

export default function RecordsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
