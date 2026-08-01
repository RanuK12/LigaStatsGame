import { describe, it, expect } from 'vitest'

/**
 * Todo link que sale del juego tiene que venir etiquetado.
 *
 * Sin esto, el 15 % del tráfico llegaba a Analytics como "Unassigned": WhatsApp, Instagram y las
 * apps de mensajería no mandan de dónde viene la visita, así que la sesión queda huérfana y no se
 * sabe qué red trae gente. La etiqueta la pone el botón, nunca la persona.
 */
function conEtiqueta(base: string, red: string, campana: string) {
  const u = new URL(base)
  u.searchParams.set('utm_source', red)
  u.searchParams.set('utm_medium', 'social')
  u.searchParams.set('utm_campaign', campana)
  return u.toString()
}

describe('los links compartidos vienen etiquetados', () => {
  it('agrega fuente, medio y campaña sin romper la URL', () => {
    const u = new URL(conEtiqueta('https://gambetafutbol.games/', 'whatsapp', 'compartir'))
    expect(u.searchParams.get('utm_source')).toBe('whatsapp')
    expect(u.searchParams.get('utm_medium')).toBe('social')
    expect(u.searchParams.get('utm_campaign')).toBe('compartir')
    expect(u.hostname).toBe('gambetafutbol.games')
  })

  it('conserva los parámetros que ya tenía el link del reto', () => {
    const u = new URL(conEtiqueta('https://gambetafutbol.games/draft?mode=liga&reto=zurdos', 'x', 'reto_diario'))
    // Lo importante: el reto sobrevive, o el que abre el link juega otro bombo
    expect(u.searchParams.get('reto')).toBe('zurdos')
    expect(u.searchParams.get('mode')).toBe('liga')
    expect(u.searchParams.get('utm_source')).toBe('x')
  })

  it('cada red lleva su propia etiqueta, o no se sabe cuál trae gente', () => {
    const redes = ['whatsapp', 'x', 'facebook', 'historia', 'directo']
    const fuentes = redes.map((r) => new URL(conEtiqueta('https://gambetafutbol.games/', r, 'compartir')).searchParams.get('utm_source'))
    expect(new Set(fuentes).size).toBe(redes.length)
  })
})
