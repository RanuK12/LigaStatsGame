/**
 * La previsualización de los links compartidos.
 *
 * El problema, medido el 2026-08-14: 13 personas compartieron en una semana y `/c/` recibió UNA
 * visita. Una de las causas está a la vista al pegar un link en WhatsApp: como el sitio es un
 * export estático, `/c/` y `/e/` sirven el MISMO título y la MISMA imagen para todas las carreras
 * y todos los equipos. El que recibe ve una tarjeta genérica que no dice nada de la persona que
 * se la mandó, y no la toca.
 *
 * Este Worker se pone adelante de esas dos rutas, lee el parámetro —que viaja en la query
 * justamente para que se pueda leer desde el borde— y reescribe las etiquetas og: con lo que hay
 * adentro. El HTML que sirve es el mismo del sitio: solo se cambian cuatro etiquetas del head, así
 * que el juego no se entera.
 *
 * La imagen sigue siendo estática por ahora, elegida según cómo terminó. Armar el PNG al vuelo
 * (satori + resvg en wasm) es la fase siguiente: el título y la descripción personalizados ya
 * cambian la tarjeta de gris a específica, que es el 80 % del efecto, y no requieren wasm.
 *
 * Despliegue: ver docs/CLOUDFLARE_PREVIEW.md.
 */

/** base64url → objeto. Devuelve null ante cualquier cosa rara: el parámetro lo edita cualquiera. */
function leerParametro(valor) {
  try {
    const b64 = valor.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

/** El titular de una carrera compartida (`/c/?c=`). Las claves son las de lib/career-link.ts. */
function carrera(d) {
  const nombre = d.n || 'Un crack'
  const leyenda = Array.isArray(d.ly) ? d.ly[0] : null
  const titulo = leyenda ? `${nombre} se pareció a ${leyenda}` : `La carrera de ${nombre}`
  const partes = []
  if (d.ts) partes.push(`${d.ts} temporadas`)
  if (d.o) partes.push(`${d.o} de OVR`)
  if (Array.isArray(d.t) && d.t.length) partes.push(`${d.t.length} títulos`)
  return {
    titulo,
    descripcion: `${partes.join(' · ')}. Creá la tuya en Gambeta, gratis y sin registrarte.`,
    imagen: '/social/og.png',
  }
}

/** El titular de un once compartido (`/e/?e=`). Las claves son las de lib/equipo-link.ts. */
function equipo(d) {
  const resultado = d.r || 'Un once'
  const torneo = d.t || 'Gambeta'
  const jugadores = Array.isArray(d.j) ? d.j : []
  // La figura del once: es lo que hace que la tarjeta diga algo y no sea un número.
  const figura = jugadores.reduce((mejor, j) => (!mejor || j[2] > mejor[2] ? j : mejor), null)
  const partes = [`${d.o || 0} de OVR`, d.f].filter(Boolean)
  if (figura) partes.push(`con ${figura[0]}`)
  return {
    titulo: `${resultado} en la ${torneo}`,
    descripcion: `${partes.join(' · ')}. Armá tu once en Gambeta, gratis y sin registrarte.`,
    imagen: '/social/og.png',
  }
}

class Etiquetas {
  constructor(meta, origen) {
    this.meta = meta
    this.origen = origen
  }
  element(el) {
    const prop = el.getAttribute('property') || el.getAttribute('name')
    if (prop === 'og:title' || prop === 'twitter:title') el.setAttribute('content', this.meta.titulo)
    if (prop === 'og:description' || prop === 'twitter:description') {
      el.setAttribute('content', this.meta.descripcion)
    }
    if (prop === 'og:image' || prop === 'twitter:image') {
      el.setAttribute('content', this.origen + this.meta.imagen)
    }
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const esCarrera = url.pathname === '/c/' || url.pathname === '/c'
    const esEquipo = url.pathname === '/e/' || url.pathname === '/e'
    const respuesta = await fetch(request)

    if (!esCarrera && !esEquipo) return respuesta

    const param = url.searchParams.get(esCarrera ? 'c' : 'e')
    const datos = param ? leerParametro(param) : null
    // Sin parámetro o con uno roto se sirve la página tal cual: la propia página ya sabe decir
    // "este link no anda".
    if (!datos) return respuesta

    const meta = esCarrera ? carrera(datos) : equipo(datos)
    return new HTMLRewriter()
      .on('meta', new Etiquetas(meta, url.origin))
      .transform(respuesta)
  },
}
