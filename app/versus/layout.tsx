import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Versus | Gambeta',
  description: 'Armá tu 11 y enfrentalo contra el de otro. El mismo bombo para los dos.',
  alternates: { canonical: '/versus/' },
}

export default function VersusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
