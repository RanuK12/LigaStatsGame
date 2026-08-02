import type { Metadata, Viewport } from 'next'
import { Sora, Space_Grotesk, Inter, Bebas_Neue, Kanit } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import Header from '@/components/Header'
import AuthModal from '@/components/AuthModal'
import UserProfileModal from '@/components/UserProfileModal'
import Analytics from '@/components/Analytics'

// Sora: tipografía moderna, geométrica y premium para títulos y displays
const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
})

// Space Grotesk: font deportivo/tecnológico ultra-moderno para números y badges
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sport',
})

// Inter: lectura limpia e impecable en cuerpo de texto
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
})

// Kanit: display deportivo/gaming moderno para los grandes títulos de impacto
const kanit = Kanit({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-impact',
})

// Malvinas Sans: tipografía creada a raíz de la bandera de Malvinas
const malvinas = localFont({
  src: './fonts/MalvinasSans-Regular.otf',
  variable: '--font-malvinas',
  display: 'swap',
})

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bandera',
})

export const metadata: Metadata = {
  // Sin metadataBase, Next escribe og:image y canonical como rutas relativas, y ni WhatsApp ni X
  // ni Facebook resuelven una ruta relativa: la ignoran y el link sale pelado.
  metadataBase: new URL('https://gambetafutbol.games'),
  title: 'Gambeta ⚽ | El Juego del Fútbol Argentino',
  description: 'Armá tu 11 ideal, viví tu carrera de crack y competí por el ranking. El juego del fútbol argentino con planteles reales de toda la historia.',
  manifest: '/manifest.json',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Gambeta ⚽ El Juego del Fútbol Argentino',
    description: 'Armá tu 11 ideal, viví tu carrera y competí por el ranking.',
    type: 'website',
    url: 'https://gambetafutbol.games',
    siteName: 'Gambeta',
    locale: 'es_AR',
    // Esta placa no existía. Cada link compartido en WhatsApp salía como una línea de texto gris,
    // que es parte de por qué compartir no traía a nadie: solo el 0,9 % comparte, y lo que
    // mandaba no daba ganas de tocar.
    images: [{ url: '/social/og.png', width: 1200, height: 630, alt: 'Gambeta, el juego del fútbol argentino' }],
  },
  twitter: {
    // `summary` muestra una miniatura al costado; `summary_large_image` ocupa el ancho del tweet.
    card: 'summary_large_image',
    title: 'Gambeta ⚽ El Juego del Fútbol Argentino',
    description: 'Armá tu 11 ideal, viví tu carrera y competí por el ranking.',
    images: ['/social/og.png'],
  },
}

/**
 * Lo que Google necesita para entender que esto es un juego y no un blog.
 *
 * La búsqueda de Google es el 85 % del tráfico (324 de 381 sesiones en dos días) y era el único
 * canal del que no le dábamos ni una señal estructurada.
 */
const DATOS_ESTRUCTURADOS = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://gambetafutbol.games/#sitio',
      url: 'https://gambetafutbol.games',
      name: 'Gambeta',
      inLanguage: 'es-AR',
      publisher: { '@id': 'https://gambetafutbol.games/#editor' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://gambetafutbol.games/#editor',
      name: 'Ranuk IT Solutions',
      url: 'https://ranuk.dev',
    },
    {
      '@type': 'VideoGame',
      name: 'Gambeta',
      url: 'https://gambetafutbol.games',
      description:
        'Juego de fútbol argentino: armá tu 11 con planteles reales de 1994 a hoy, simulá el torneo y viví una carrera de 15 temporadas.',
      inLanguage: 'es-AR',
      genre: ['Deportes', 'Simulación', 'Fútbol'],
      gamePlatform: 'Navegador web',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Cualquiera con navegador',
      image: 'https://gambetafutbol.games/social/og.png',
      author: { '@id': 'https://gambetafutbol.games/#editor' },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'ARS', availability: 'https://schema.org/InStock' },
    },
  ],
}

export const viewport: Viewport = {
  themeColor: '#020813',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${sora.variable} ${spaceGrotesk.variable} ${inter.variable} ${bebas.variable} ${malvinas.variable} ${kanit.variable}`}
    >
      <head>
        <link rel="icon" href="/logos/gambeta.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(DATOS_ESTRUCTURADOS) }}
        />
      </head>
      <body className="bg-[#020813] text-white min-h-screen antialiased font-sans">
        <Header />
        <main className="w-full">{children}</main>
        <AuthModal />
        <UserProfileModal />
        <Analytics />
      </body>
    </html>
  )
}
