"use client"

import { useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { ContactShadows, OrbitControls } from "@react-three/drei"
import * as THREE from "three"

interface Props {
  color: string
  pattern: string // solid | sash | stripes | hoops
  number: number
  name: string
}

// La silueta anterior eran doce puntos rectos: sin mangas, sin cintura y con los hombros en
// ángulo. Se veía plana porque lo era. Ahora el contorno se traza con curvas y tiene mangas de
// verdad, hombro caído, cintura y ruedo curvo, que es lo que hace que se lea como una camiseta.
const SC = 0.026
// El espacio de dibujo es 0-100 en X y 0-120 en Y, el mismo que usan los decals.
const CX = 50
const CY = 62

/**
 * El contorno se traza UNA sola vez y lo consumen los dos que lo necesitan: la geometría 3D y
 * el recorte del canvas del decal. Antes solo existía en 3D, así que el vivo del cuello y los
 * puños —dibujados sobre el borde— quedaban flotando fuera de la tela.
 */
function tracePath(
  m: (x: number, y: number) => void,
  l: (x: number, y: number) => void,
  q: (cx: number, cy: number, x: number, y: number) => void,
) {
  m(38, 10)
  q(32, 11, 27, 14) // hombro izquierdo
  l(6, 29) // caída de la manga
  q(2, 33, 3, 39)
  l(9, 55) // costado externo de la manga
  q(11, 60, 17, 59)
  l(29, 51) // puño, en diagonal como en una manga de verdad
  q(30, 64, 29, 78) // axila y cintura
  l(27, 112)
  q(50, 117, 73, 112) // ruedo curvo
  l(71, 78)
  q(70, 64, 71, 51)
  l(83, 59)
  q(89, 60, 91, 55)
  l(97, 39)
  q(98, 33, 94, 29)
  l(73, 14)
  q(68, 11, 62, 10) // hombro derecho
  q(50, 31, 38, 10) // escote en V, ancho y hondo
}

function jerseyShape(): THREE.Shape {
  const s = new THREE.Shape()
  const P = (x: number, y: number): [number, number] => [(x - CX) * SC, -(y - CY) * SC]
  tracePath(
    (x, y) => s.moveTo(...P(x, y)),
    (x, y) => s.lineTo(...P(x, y)),
    (cx, cy, x, y) => s.quadraticCurveTo(...P(cx, cy), ...P(x, y)),
  )
  s.closePath()
  return s
}

/** Tejido: un damero fino que va de bumpMap. Sin esto el material se ve de plástico. */
function fabricBump(): THREE.CanvasTexture {
  const N = 64
  const cv = document.createElement("canvas")
  cv.width = N
  cv.height = N
  const ctx = cv.getContext("2d")!
  ctx.fillStyle = "#808080"
  ctx.fillRect(0, 0, N, N)
  for (let y = 0; y < N; y += 4) {
    for (let x = 0; x < N; x += 4) {
      const impar = ((x >> 2) + (y >> 2)) % 2 === 0
      ctx.fillStyle = impar ? "#9a9a9a" : "#666666"
      ctx.fillRect(x, y, 4, 4)
    }
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(14, 16)
  return tex
}

const DW = 500
const DH = 600
const mx = (x: number) => (x / 100) * DW
const my = (y: number) => (y / 120) * DH

/** Aclara u oscurece un hex para sacar el color de vivos sin pedirle un segundo color al usuario. */
function shift(hex: string, amt: number): string {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.max(0, Math.min(255, Math.round(c + amt))),
  )
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

/** Luminancia relativa: decide si la tinta va oscura o clara para que se lea sobre cualquier color. */
function claro(hex: string): boolean {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16)
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6
}

/** Recorta todo lo que se dibuje después contra la silueta: nada puede salirse de la tela. */
function clipToJersey(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  tracePath(
    (x, y) => ctx.moveTo(mx(x), my(y)),
    (x, y) => ctx.lineTo(mx(x), my(y)),
    (cx, cy, x, y) => ctx.quadraticCurveTo(mx(cx), my(cy), mx(x), my(y)),
  )
  ctx.closePath()
  ctx.clip()
}

/** El patrón va en los dos lados, así que se dibuja aparte del resto del decal. */
function drawPattern(ctx: CanvasRenderingContext2D, pattern: string, tinta: string) {
  ctx.save()
  ctx.fillStyle = tinta
  if (pattern === "stripes") {
    for (const x of [30, 46, 62]) ctx.fillRect(mx(x), my(12), mx(8), my(115) - my(12))
  } else if (pattern === "hoops") {
    for (const y of [40, 66, 92]) ctx.fillRect(0, my(y), DW, my(14))
  } else if (pattern === "sash") {
    ctx.translate(mx(50), my(64))
    ctx.rotate(Math.atan2(my(112) - my(14), mx(78) - mx(20)))
    const len = Math.hypot(mx(78) - mx(20), my(112) - my(14))
    ctx.fillRect(-len / 2, -mx(9), len, mx(18))
  }
  ctx.restore()
}

/** Vivos del cuello y de los puños: el detalle que separa una camiseta de un cartel. */
function drawTrim(ctx: CanvasRenderingContext2D, tinta: string) {
  ctx.strokeStyle = tinta
  ctx.lineWidth = mx(6)
  ctx.lineCap = "butt"
  // Los vivos van sobre los mismos trazos del contorno. Como el trazo está centrado en el borde,
  // el clip se come la mitad de afuera y queda una cinta al ras, que es como se ve de verdad.
  ctx.beginPath()
  ctx.moveTo(mx(38), my(10))
  ctx.quadraticCurveTo(mx(50), my(31), mx(62), my(10))
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(mx(9), my(55))
  ctx.quadraticCurveTo(mx(11), my(60), mx(17), my(59))
  ctx.lineTo(mx(29), my(51))
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(mx(91), my(55))
  ctx.quadraticCurveTo(mx(89), my(60), mx(83), my(59))
  ctx.lineTo(mx(71), my(51))
  ctx.stroke()
}

/**
 * Sombra de volumen: los costados se van a oscuro y el centro queda limpio. Una extrusión sola
 * se ve como una plancha de cartón; esto es lo que hace que el pecho parezca curvo.
 */
function drawShading(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, DW, 0)
  g.addColorStop(0, "rgba(0,0,0,0.34)")
  g.addColorStop(0.24, "rgba(0,0,0,0)")
  g.addColorStop(0.62, "rgba(255,255,255,0.10)")
  g.addColorStop(0.82, "rgba(0,0,0,0)")
  g.addColorStop(1, "rgba(0,0,0,0.34)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, DW, DH)
  // Y un poco de sombra en el ruedo, que es donde la tela cae.
  const v = ctx.createLinearGradient(0, my(96), 0, DH)
  v.addColorStop(0, "rgba(0,0,0,0)")
  v.addColorStop(1, "rgba(0,0,0,0.26)")
  ctx.fillStyle = v
  ctx.fillRect(0, my(96), DW, DH - my(96))
}

/**
 * Texto con halo del color contrario. Sin esto el sponsor cae encima de la banda diagonal, que
 * es del mismo tono que la tinta, y no se lee nada.
 */
function conHalo(
  ctx: CanvasRenderingContext2D,
  txt: string,
  x: number,
  y: number,
  fill: string,
  halo: string,
  grosor: number,
) {
  ctx.strokeStyle = halo
  ctx.lineWidth = grosor
  ctx.lineJoin = "round"
  ctx.strokeText(txt, x, y)
  ctx.fillStyle = fill
  ctx.fillText(txt, x, y)
}

/** Frente: escudo al pecho, sponsor y el dorsal chico. Como una camiseta de verdad. */
function frontDecal(pattern: string, base: string, number: number): THREE.CanvasTexture {
  const cv = document.createElement("canvas")
  cv.width = DW
  cv.height = DH
  const ctx = cv.getContext("2d")!
  const tinta = claro(base) ? shift(base, -70) : shift(base, 80)
  const texto = claro(base) ? "#10151f" : "#ffffff"
  const halo = claro(base) ? "#ffffff" : "#10151f"

  clipToJersey(ctx)
  drawPattern(ctx, pattern, tinta)
  drawTrim(ctx, tinta)
  drawShading(ctx)

  // Escudo al pecho izquierdo
  ctx.save()
  ctx.translate(mx(34), my(40))
  ctx.fillStyle = texto
  ctx.strokeStyle = halo
  ctx.lineWidth = mx(1.2)
  ctx.beginPath()
  ctx.moveTo(0, -mx(7))
  ctx.lineTo(mx(6), -mx(3))
  ctx.lineTo(mx(6), mx(3))
  ctx.lineTo(0, mx(8))
  ctx.lineTo(-mx(6), mx(3))
  ctx.lineTo(-mx(6), -mx(3))
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = halo
  ctx.font = `900 ${mx(8)}px Arial, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("★", 0, mx(1))
  ctx.restore()

  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // Dorsal chico al pecho derecho
  ctx.font = `900 ${mx(13)}px Arial, sans-serif`
  conHalo(ctx, String(number), mx(66), my(40), texto, halo, mx(1.6))

  // Sponsor
  ctx.font = `900 ${mx(9)}px Impact, "Arial Black", sans-serif`
  conHalo(ctx, "GAMBETA", mx(50), my(68), texto, halo, mx(1.6))

  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 8
  return tex
}

/** Dorso: apellido arriba y el dorsal grande. Es la cara que la gente saca de captura. */
function backDecal(pattern: string, base: string, number: number, name: string): THREE.CanvasTexture {
  const cv = document.createElement("canvas")
  cv.width = DW
  cv.height = DH
  const ctx = cv.getContext("2d")!
  const tinta = claro(base) ? shift(base, -70) : shift(base, 80)
  const texto = claro(base) ? "#10151f" : "#ffffff"
  const halo = claro(base) ? "#ffffff" : "#10151f"

  clipToJersey(ctx)
  drawPattern(ctx, pattern, tinta)
  drawTrim(ctx, tinta)
  drawShading(ctx)

  // El apellido, no el nombre completo: en una camiseta va uno solo y así entra.
  const partes = (name || "JUGADOR").trim().toUpperCase().split(/\s+/)
  const apellido = (partes.length > 1 ? partes[partes.length - 1] : partes[0]).slice(0, 12)

  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  // El apellido encoge en vez de cortarse: "FERNÁNDEZ" no puede quedar en "FERNÁN".
  for (const prueba of [24, 21, 18, 15]) {
    ctx.font = `900 ${mx(prueba)}px Impact, "Arial Black", sans-serif`
    if (ctx.measureText(apellido).width <= mx(44)) break
  }
  conHalo(ctx, apellido, mx(50), my(44), texto, halo, mx(1.8))

  ctx.font = `900 ${mx(46)}px Impact, "Arial Black", sans-serif`
  conHalo(ctx, String(number), mx(50), my(78), texto, halo, mx(2.6))

  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 8
  return tex
}

function JerseyMesh({ color, pattern, number, name }: Props) {
  const { geo, centro, z } = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(jerseyShape(), {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.07,
      bevelSegments: 4,
      curveSegments: 24,
      steps: 1,
    })
    g.computeBoundingBox()
    const b = g.boundingBox!
    // NO se llama a g.center(): el bisel agranda la caja de la geometría unos milímetros por
    // lado, así que centrarla movía el cuerpo respecto del decal y el vivo del cuello quedaba
    // flotando sobre el hombro. Se centra el grupo entero y el decal se mide en las mismas
    // coordenadas de la silueta (0-100 x, 0-120 y) en las que está dibujado.
    return {
      geo: g,
      centro: [
        -(b.max.x + b.min.x) / 2,
        -(b.max.y + b.min.y) / 2,
        -(b.max.z + b.min.z) / 2,
      ] as [number, number, number],
      z: b.max.z + 0.002,
    }
  }, [])

  // El plano cubre exactamente el rectángulo 0-100 × 0-120 del espacio de dibujo.
  const DECAL_W = 100 * SC
  const DECAL_H = 120 * SC
  const DECAL_X = (50 - CX) * SC
  const DECAL_Y = -(60 - CY) * SC

  const bump = useMemo(() => fabricBump(), [])
  const frente = useMemo(() => frontDecal(pattern, color, number), [pattern, color, number])
  const dorso = useMemo(() => backDecal(pattern, color, number, name), [pattern, color, number, name])

  return (
    <group position={centro}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.82} metalness={0.04} bumpMap={bump} bumpScale={0.035} />
      </mesh>
      {/* polygonOffset + depthWrite=false evitan el z-fighting con el cuerpo. */}
      <mesh position={[DECAL_X, DECAL_Y, z]} renderOrder={1}>
        <planeGeometry args={[DECAL_W, DECAL_H]} />
        <meshStandardMaterial map={frente} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} roughness={0.8} bumpMap={bump} bumpScale={0.02} />
      </mesh>
      <mesh position={[DECAL_X, DECAL_Y, geo.boundingBox!.min.z - 0.002]} rotation={[0, Math.PI, 0]} renderOrder={1}>
        <planeGeometry args={[DECAL_W, DECAL_H]} />
        <meshStandardMaterial map={dorso} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} roughness={0.8} bumpMap={bump} bumpScale={0.02} />
      </mesh>
    </group>
  )
}

export default function Jersey3D(props: Props) {
  return (
    <Canvas camera={{ position: [0, 0, 5.6], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }} shadows>
      {/* Tres luces: clave cálida, relleno celeste y un contra que despega la silueta del fondo. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 6]} intensity={1.35} castShadow />
      <directionalLight position={[-5, 1, 2]} intensity={0.5} color="#74ACDF" />
      <directionalLight position={[0, 2, -6]} intensity={0.9} color="#ffffff" />
      <JerseyMesh {...props} />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.4} scale={5} blur={2.6} far={2.2} resolution={512} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={2.2}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  )
}
