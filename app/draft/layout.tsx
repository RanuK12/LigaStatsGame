import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Draft de Leyendas | Gambeta',
  description: 'Tirá la ruleta, armá tu 11 con planteles reales del fútbol argentino y simulá el torneo. Gratis y sin registro.',
  alternates: { canonical: '/draft/' },
  openGraph: { images: ['/social/og-draft.png'] },
  twitter: { images: ['/social/og-draft.png'] },
}

export default function DraftLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
