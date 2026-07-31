import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Draft de Leyendas | Gambeta',
  description: 'Tirá la ruleta, armá tu 11 con planteles reales del fútbol argentino y simulá el torneo. Gratis y sin registro.',
}

export default function DraftLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
