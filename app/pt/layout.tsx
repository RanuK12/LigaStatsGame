import type { Metadata } from "next"
import LangDelDocumento from "@/components/LangDelDocumento"

/**
 * El sitio en portugués de Brasil.
 *
 * El layout raíz escribe `<html lang="es-AR">` y desde un layout anidado no se puede cambiar esa
 * etiqueta, así que la corrige `LangDelDocumento` al montar. Lo que sí se define acá es la ficha
 * que leen Google y las redes, que es lo que decide si esta versión existe para el buscador.
 */
export const metadata: Metadata = {
  title: "Gambeta ⚽ | O Jogo do Futebol Argentino e Simulador de Draft",
  description: "Monte seu onze ideal com elencos reais do futebol argentino, jogue o desafio diário com o mesmo sorteio de todo mundo, viva a carreira de um craque e dispute o ranking. De graça, no navegador.",
  alternates: {
    canonical: "/pt",
    languages: { es: "/", en: "/en", "pt-BR": "/pt" },
  },
  openGraph: {
    title: "Gambeta ⚽ O Jogo do Futebol Argentino",
    description: "Monte seu onze ideal, viva sua carreira e dispute o ranking.",
    url: "https://gambetafutbol.games/pt",
    locale: "pt_BR",
  },
}

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LangDelDocumento lang="pt-BR" />
      {children}
    </>
  )
}
