import type { Metadata, Viewport } from 'next'
import { Archivo, Inter, Bebas_Neue } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import Header from '@/components/Header'

// Malvinas Sans: tipografía creada a raíz de la bandera de Malvinas. Guiño indirecto:
// solo cubre A-Z/0-9 (sin acentos), por eso se usa en el wordmark sin acentos.
const malvinas = localFont({
  src: './fonts/MalvinasSans-Regular.otf',
  variable: '--font-malvinas',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
})

const bebas = Bebas_Neue({
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
    <html lang="es" className={`${archivo.variable} ${inter.variable} ${bebas.variable} ${malvinas.variable}`}>
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

