import type { CareerCardData } from '@/components/pitch/CareerCardView'
import { NIVELES } from './career-idolatria'

/**
 * El link de la carrera terminada.
 *
 * Es lo único que El Ídolo (potrerofutbol.ar) tiene y nosotros no: al retirarse dan una URL que
 * el que la abre puede ver entera. Nosotros dábamos un PNG para descargar, que es un callejón
 * sin salida: no se previsualiza, no se clickea y no lo indexa nadie.
 *
 * La carrera viaja DENTRO del link, no en una base de datos. El sitio es export estático en
 * GitHub Pages: una tabla en Supabase agregaría una dependencia de red para abrir un link, algo
 * que moderar y un id que puede quedar huérfano, a cambio de nada que se note. Acá el link es
 * autosuficiente: funciona sin backend, sin cuenta y sin que se caiga nada.
 *
 * Va en un parámetro de query y no en el hash a propósito: cuando la previsualización
 * personalizada se haga con un Worker, el Worker puede leer la query y no puede leer el hash.
 */

export interface CarreraCompartida {
  /** Lo que dibuja la ficha. */
  card: CareerCardData
  temporadas: number
  /** La leyenda con la que se comparó, que es el titular. */
  leyenda?: { nombre: string; parecido: number }
  /** La historia del retiro. */
  pie?: string
}

const VERSION = '1'

/** El escudo del nivel de idolatría, a partir de su nombre. */
function imagenDeNivel(nombre: string): string | undefined {
  const n = NIVELES.find((x) => x.nombre === nombre)
  return n?.imagen
}

/** base64url: el base64 común lleva `+`, `/` y `=`, que en una URL hay que escapar. */
function aBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * El escudo NO viaja: se arma del id al abrir. Mandar la ruta de cada logo era repetir
 * `/logos/clubs/` una vez por club para nada.
 */
function comprimir(c: CarreraCompartida): unknown {
  const d = c.card
  return {
    v: VERSION,
    n: d.playerName,
    d: d.number,
    p: d.position,
    o: d.overall,
    m: d.marketValue,
    f: d.nationalityFlag,
    pj: d.matchesPlayed,
    g: d.goals,
    a: d.assists,
    vi: d.cleanSheets || undefined,
    pa: d.penaltiesSaved || undefined,
    c: d.clubs.map((x) => [x.id, x.name]),
    t: d.trophies.map((x) => [x.id, x.name, x.icon, x.count]),
    jp: d.jerseyPattern,
    jc: d.jerseyColor,
    id: d.idolatria ? [d.idolatria.nivel, d.idolatria.icono, d.idolatria.clubName] : undefined,
    ts: c.temporadas,
    ly: c.leyenda ? [c.leyenda.nombre, c.leyenda.parecido] : undefined,
    pi: c.pie,
  }
}

export function encodeCarrera(c: CarreraCompartida): string {
  const json = JSON.stringify(comprimir(c))
  return aBase64Url(new TextEncoder().encode(json))
}

/**
 * Devuelve `null` ante cualquier cosa rara en vez de tirar: el parámetro viene de una URL que
 * cualquiera puede editar, y una carrera rota tiene que mostrar "este link no anda", no romper
 * la página.
 */
export function decodeCarrera(param: string): CarreraCompartida | null {
  try {
    const o = JSON.parse(new TextDecoder().decode(deBase64Url(param))) as Record<string, any>
    if (o?.v !== VERSION || typeof o.n !== 'string') return null

    const card: CareerCardData = {
      playerName: o.n,
      number: Number(o.d) || 10,
      position: String(o.p || 'CM'),
      overall: Number(o.o) || 0,
      marketValue: String(o.m || ''),
      nationalityFlag: o.f,
      matchesPlayed: Number(o.pj) || 0,
      goals: Number(o.g) || 0,
      assists: Number(o.a) || 0,
      cleanSheets: o.vi,
      penaltiesSaved: o.pa,
      clubs: (o.c || []).map(([id, name]: [string, string]) => ({
        id,
        name,
        logoUrl: `/logos/clubs/${id}.png`,
      })),
      trophies: (o.t || []).map(([id, name, icon, count]: [string, string, string, number]) => ({
        id,
        name,
        icon,
        count,
      })),
      jerseyPattern: o.jp,
      jerseyColor: o.jc,
      // La imagen del nivel NO viaja en el link: se arma del nombre. Un link viejo, de antes
      // de los escudos, sigue abriendo con su emoji.
      idolatria: o.id
        ? { nivel: o.id[0], icono: o.id[1], clubName: o.id[2], imagen: imagenDeNivel(o.id[0]) }
        : undefined,
    }

    return {
      card,
      temporadas: Number(o.ts) || 0,
      leyenda: o.ly ? { nombre: o.ly[0], parecido: Number(o.ly[1]) } : undefined,
      pie: o.pi,
    }
  } catch {
    return null
  }
}

export const BASE_URL = 'https://gambetafutbol.games'

export function urlDeCarrera(c: CarreraCompartida): string {
  return `${BASE_URL}/c/?c=${encodeCarrera(c)}`
}
