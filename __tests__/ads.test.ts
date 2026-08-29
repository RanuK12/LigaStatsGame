import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * La publicidad no puede trabar el juego NUNCA.
 *
 * Los tres modos de fallar que importan, y que acá quedan cubiertos:
 *
 * 1. Un bloqueador se comió el script de AdSense: `adBreak` no existe. El botón tiene que
 *    contestar en el acto, no quedarse en "buscando...".
 * 2. AdSense cargó pero no contesta nunca. Ahí manda el reloj.
 * 3. El jugador cortó el video a la mitad: no hay premio, pero tampoco un juego trabado.
 *
 * Y la regla que cuida la plata del otro lado: el premio se da SOLO con el aviso mirado entero.
 */

type Ventana = { self: unknown; top: unknown; adBreak?: (p: any) => void; adsbygoogle?: unknown[] }

function ventana(propia = true): Ventana {
  const w: any = {}
  w.self = w
  w.top = propia ? w : {}
  return w
}

async function cargar(cliente: string | undefined, w: Ventana) {
  vi.resetModules()
  if (cliente === undefined) vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT', '')
  else vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT', cliente)
  ;(globalThis as any).window = w
  return await import('@/lib/ads')
}

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  vi.unstubAllEnvs()
  delete (globalThis as any).window
})

describe('cuándo se pide un aviso y cuándo no', () => {
  it('sin cliente de AdSense configurado, la publicidad no existe', async () => {
    const w = ventana()
    const ads = await cargar(undefined, w)
    expect(ads.adsHabilitados()).toBe(false)
    await expect(ads.verAvisoRecompensado('comodin')).resolves.toBe('sin-aviso')
  })

  it('adentro del reproductor de un portal no se pide ni un aviso', async () => {
    const w = ventana(false)
    let pedidos = 0
    w.adBreak = () => { pedidos++ }
    const ads = await cargar('ca-pub-123', w)
    expect(ads.adsHabilitados()).toBe(false)
    await expect(ads.verAvisoRecompensado('comodin')).resolves.toBe('sin-aviso')
    ads.verIntersticial('entre-drafts')
    expect(pedidos).toBe(0)
  })

  it('con un bloqueador de anuncios contesta en el acto, sin esperar el reloj', async () => {
    const w = ventana()
    const ads = await cargar('ca-pub-123', w)
    await expect(ads.verAvisoRecompensado('comodin')).resolves.toBe('sin-aviso')
  })
})

describe('el video recompensado', () => {
  it('mirado entero: el premio se otorga', async () => {
    const w = ventana()
    w.adBreak = (p: any) => {
      p.beforeReward(() => {})
      p.adViewed()
      p.adBreakDone({ breakStatus: 'viewed' })
    }
    const ads = await cargar('ca-pub-123', w)
    await expect(ads.verAvisoRecompensado('comodin')).resolves.toBe('visto')
  })

  it('cortado a la mitad: no hay premio', async () => {
    const w = ventana()
    w.adBreak = (p: any) => {
      p.beforeReward(() => {})
      p.adDismissed()
      p.adBreakDone({ breakStatus: 'dismissed' })
    }
    const ads = await cargar('ca-pub-123', w)
    await expect(ads.verAvisoRecompensado('comodin')).resolves.toBe('descartado')
  })

  it('sin inventario, AdSense avisa y el juego sigue', async () => {
    const w = ventana()
    w.adBreak = (p: any) => p.adBreakDone({ breakStatus: 'noAdPreloaded' })
    const ads = await cargar('ca-pub-123', w)
    await expect(ads.verAvisoRecompensado('comodin')).resolves.toBe('sin-aviso')
  })

  it('si AdSense no contesta nunca, corta el reloj', async () => {
    const w = ventana()
    w.adBreak = () => {}
    const ads = await cargar('ca-pub-123', w)
    vi.useFakeTimers()
    const promesa = ads.verAvisoRecompensado('comodin')
    await vi.advanceTimersByTimeAsync(8000)
    await expect(promesa).resolves.toBe('sin-aviso')
  })

  /** El caso que arruinaría el trato: un video largo mirado entero NO se corta por tiempo. */
  it('un video más largo que el reloj igual paga el premio', async () => {
    const w = ventana()
    let terminar: (() => void) | null = null
    w.adBreak = (p: any) => {
      p.beforeReward(() => {})
      terminar = () => { p.adViewed(); p.adBreakDone({ breakStatus: 'viewed' }) }
    }
    const ads = await cargar('ca-pub-123', w)
    vi.useFakeTimers()
    const promesa = ads.verAvisoRecompensado('comodin')
    await vi.advanceTimersByTimeAsync(30000)
    terminar!()
    await expect(promesa).resolves.toBe('visto')
  })
})

describe('el tope de intersticiales', () => {
  it('dos seguidos no: entre uno y otro tienen que pasar minutos', async () => {
    const w = ventana()
    const pedidos: string[] = []
    w.adBreak = (p: any) => pedidos.push(p.name)
    const ads = await cargar('ca-pub-123', w)

    ads.verIntersticial('entre-drafts')
    ads.verIntersticial('entre-drafts')
    expect(pedidos).toHaveLength(1)
  })

  it('el intersticial se pide como corte de nivel, que es lo que es', async () => {
    const w = ventana()
    const tipos: string[] = []
    w.adBreak = (p: any) => tipos.push(p.type)
    const ads = await cargar('ca-pub-123', w)
    ads.verIntersticial('entre-drafts')
    expect(tipos).toEqual(['next'])
  })
})
