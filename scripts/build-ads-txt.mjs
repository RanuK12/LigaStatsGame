/**
 * Escribe public/ads.txt con el editor de AdSense, o lo borra si no hay ninguno configurado.
 *
 * ads.txt es la lista pública de quién tiene permiso para vender la publicidad de este dominio.
 * Sin ese archivo una parte de los compradores no puja —les consta que el inventario podría ser
 * robado— y AdSense lo marca como "ganancias en riesgo". Es una línea de texto y es plata.
 *
 * Se genera en vez de estar escrito a mano porque el identificador vive en una variable de
 * entorno: un ads.txt con el pub id de otro es peor que no tener ninguno.
 */

import { writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const SALIDA = join(process.cwd(), 'public', 'ads.txt')
const cliente = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ''

// El identificador viaja como `ca-pub-1234...` en el script de AdSense y como `pub-1234...` en
// ads.txt. Es el mismo número con otro prefijo.
const pub = cliente.replace(/^ca-/, '')

if (!/^pub-\d{10,}$/.test(pub)) {
  if (existsSync(SALIDA)) unlinkSync(SALIDA)
  console.log('ads.txt: sin NEXT_PUBLIC_ADSENSE_CLIENT válido, no se escribe nada')
  process.exit(0)
}

// f08c47fec0942fa0 es el identificador de certificación de Google, igual para todos los
// editores: sale de la documentación de AdSense, no se inventa.
writeFileSync(SALIDA, `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, 'utf8')
console.log(`ads.txt: escrito para ${pub}`)
