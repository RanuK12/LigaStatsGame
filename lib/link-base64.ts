/**
 * base64url para los links que llevan la partida adentro.
 *
 * El base64 común lleva `+`, `/` y `=`, que en una URL hay que escapar. Vive aparte porque lo
 * usan los dos links que se comparten: el de la carrera (`career-link`) y el del once
 * (`equipo-link`).
 */

export function aBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function deBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
