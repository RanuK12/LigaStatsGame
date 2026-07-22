import type { Metadata, Viewport } from 'next'
import { Outfit, Plus_Jakarta_Sans, Staatliches } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-display',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const staatliches = Staatliches({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bandera',
})

export const metadata: Metadata = {
  title: 'Draft Tres Estrellas ⭐️⭐️⭐️ | El Juego del Fútbol Argentino',
  description: 'Armá tu 11 ideal de la historia del fútbol argentino. Elegí planteles reales, simulá partidos y compartí tu resultado.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Draft Tres Estrellas ⭐️⭐️⭐️',
    description: 'El juego del fútbol argentino',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#020813',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} ${plusJakarta.variable} ${staatliches.variable}`}>
      <head>
        <link rel="icon" href="/LigaStatsGame/logos/afa.png" />
      </head>
      <body className="bg-[#020813] text-white min-h-screen antialiased font-sans">
        <Header />
        <main className="w-full">
          {children}
        </main>
      </body>
    </html>
  )
}

