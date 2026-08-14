"use client"

import { usePathname } from "next/navigation"
import en from "@/i18n/en.json"
import pt from "@/i18n/pt.json"

/**
 * Los tres idiomas, con el español como base y no como una traducción más.
 *
 * Dos decisiones que explican todo lo demás:
 *
 * 1. **El español se queda en la raíz.** `/draft/` sigue siendo `/draft/`, no `/es/draft/`. El
 *    87 % del tráfico entra por búsquedas de marca a esas URLs y hay links compartidos dando
 *    vueltas desde hace meses: mudarlas a `/es/` sería tirar lo único que hoy funciona para
 *    ganar simetría. El inglés y el portugués cuelgan de `/en/` y `/pt/`.
 *
 * 2. **El español es el fallback, escrito en el lugar donde se usa.** Se llama
 *    `t("home.jugar", "ARMÁ TU 11")`: si falta la clave en el diccionario, sale el español y no
 *    una clave cruda en pantalla. Es lo que permite traducir de a poco sin romper nada, en un
 *    sitio con ~124 cadenas repartidas en 36 componentes.
 *
 * Lo que NO pasa por acá, y está anotado en docs/PLAN_I18N.md: la narrativa generada (crónicas de
 * partido, dilemas de la carrera, historias de retiro). Son miles de plantillas con tono
 * rioplatense que hay que reescribir, no traducir, y se hace en su propia tanda.
 */

export const LOCALES = ["es", "en", "pt"] as const
export type Locale = (typeof LOCALES)[number]

export const NOMBRES: Record<Locale, { label: string; bandera: string; htmlLang: string }> = {
  es: { label: "ES", bandera: "🇦🇷", htmlLang: "es-AR" },
  en: { label: "EN", bandera: "🇬🇧", htmlLang: "en" },
  pt: { label: "PT", bandera: "🇧🇷", htmlLang: "pt-BR" },
}

const DICCIONARIOS: Record<Locale, Record<string, string>> = {
  es: {},
  en: en as Record<string, string>,
  pt: pt as Record<string, string>,
}

/** El idioma sale del primer segmento de la ruta. Sin prefijo conocido, es español. */
export function localeDeRuta(pathname: string): Locale {
  const primero = pathname.split("/").filter(Boolean)[0]
  return (LOCALES as readonly string[]).includes(primero || "") ? (primero as Locale) : "es"
}

/** La ruta sin el prefijo de idioma: `/en/draft/` → `/draft/`. */
export function rutaSinLocale(pathname: string): string {
  const l = localeDeRuta(pathname)
  if (l === "es") return pathname || "/"
  const resto = pathname.slice(`/${l}`.length)
  return resto || "/"
}

/** La misma página en otro idioma: `/draft/` + `pt` → `/pt/draft/`. */
export function conLocale(pathname: string, locale: Locale): string {
  const base = rutaSinLocale(pathname)
  if (locale === "es") return base
  return base === "/" ? `/${locale}` : `/${locale}${base}`
}

export function useLocale(): Locale {
  return localeDeRuta(usePathname() || "/")
}

/**
 * El traductor. `t(clave, textoEnEspañol)`.
 *
 * El segundo argumento no es un default de emergencia: es el texto real en español, escrito ahí
 * mismo, que es lo que se ve en el sitio en castellano. Así el código sigue siendo legible en el
 * idioma en el que se piensa el juego.
 */
export function useT(): (clave: string, es: string) => string {
  const locale = useLocale()
  const dicc = DICCIONARIOS[locale]
  return (clave, es) => dicc[clave] || es
}

/** Un href interno, con el idioma puesto. Los externos y los anclas pasan de largo. */
export function useRuta(): (href: string) => string {
  const locale = useLocale()
  return (href) => {
    if (locale === "es") return href
    if (!href.startsWith("/")) return href
    return `/${locale}${href}`
  }
}

/** El locale que entiende `Intl`: números y fechas. Hoy hay `'es-AR'` escrito a mano en varios lados. */
export function useLocaleIntl(): string {
  return NOMBRES[useLocale()].htmlLang
}

/**
 * Los puestos, en el idioma de quien mira.
 *
 * Las siglas de la cancha son distintas en cada idioma —DC en castellano, ST en inglés, ATA en
 * portugués— y son de las cosas que más se leen del juego: están en cada slot de la formación,
 * en cada carta y en el buscador.
 *
 * `corto` es la sigla; `largo`, el nombre entero del puesto que va abajo del slot vacío.
 */
export function usePuesto(): { corto: (codigo: string, es: string) => string; largo: (codigo: string, es: string) => string } {
  const t = useT()
  return {
    corto: (codigo, es) => t(`pos.${codigo}`, es),
    largo: (codigo, es) => t(`posLargo.${codigo}`, es),
  }
}

/**
 * El reto del día y los rangos del ranking, que viven en `lib/` y no en un componente.
 *
 * Los textos siguen escritos en castellano donde se definen —ahí es donde se entienden y se
 * editan— y acá se traducen por id. Si falta la traducción, sale el castellano, que es la misma
 * regla que el resto del sitio.
 */
export function useReto(): (id: string, campo: "titulo" | "regla", es: string) => string {
  const t = useT()
  return (id, campo, es) => t(`reto.${id}.${campo}`, es)
}

export function useRango(): (nombre: string) => string {
  const t = useT()
  return (nombre) => t(`rango.${nombre}`, nombre)
}
