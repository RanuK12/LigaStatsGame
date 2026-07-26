"use client"

import { useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

interface Props {
  color: string
  pattern: string // sash | stripes | hoops | plain
  number: number
  name: string
}

// Silueta de camiseta (mismo trazo que el SVG), en espacio centrado y a escala 3D.
const SC = 0.03
const CX = 50
const CY = 60
const PTS: [number, number][] = [
  [20, 20], [35, 10], [65, 10], [80, 20], [95, 35], [85, 50],
  [75, 42], [75, 110], [25, 110], [25, 42], [15, 50], [5, 35],
]

function jerseyShape(): THREE.Shape {
  const s = new THREE.Shape()
  PTS.forEach(([x, y], i) => {
    const X = (x - CX) * SC
    const Y = -(y - CY) * SC
    if (i === 0) s.moveTo(X, Y)
    else s.lineTo(X, Y)
  })
  s.closePath()
  return s
}

// Textura decal (transparente): patrón + dorsal + nombre, alineada a la silueta.
function buildDecal(pattern: string, number: number, name: string): THREE.CanvasTexture {
  const CW = 360
  const CH = 400
  const cv = document.createElement("canvas")
  cv.width = CW
  cv.height = CH
  const ctx = cv.getContext("2d")!
  const mx = (x: number) => ((x - 5) / 90) * CW
  const my = (y: number) => ((y - 10) / 100) * CH

  ctx.fillStyle = "rgba(255,255,255,0.92)"
  if (pattern === "stripes") {
    ctx.fillRect(mx(35), my(24), mx(45) - mx(35), my(108) - my(24))
    ctx.fillRect(mx(55), my(24), mx(65) - mx(55), my(108) - my(24))
  } else if (pattern === "hoops") {
    ctx.fillRect(mx(26), my(50), mx(74) - mx(26), my(70) - my(50))
  } else if (pattern === "sash") {
    ctx.save()
    ctx.translate(mx(48), my(66))
    ctx.rotate(Math.atan2(my(110) - my(20), mx(75) - mx(20)))
    const len = Math.hypot(mx(75) - mx(20), my(110) - my(20))
    ctx.fillRect(-len / 2, -22, len, 44)
    ctx.restore()
  }

  // Collar
  ctx.fillStyle = "#0b1020"
  ctx.beginPath()
  ctx.moveTo(mx(35), my(10))
  ctx.lineTo(mx(50), my(26))
  ctx.lineTo(mx(65), my(10))
  ctx.closePath()
  ctx.fill()

  // Dorsal
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.lineWidth = 10
  ctx.font = "900 150px Arial, sans-serif"
  ctx.strokeStyle = "#0b1020"
  ctx.fillStyle = "#ffffff"
  ctx.strokeText(String(number), mx(50), my(72))
  ctx.fillText(String(number), mx(50), my(72))

  // Nombre
  const nm = (name || "JUGADOR").toUpperCase().slice(0, 14)
  ctx.font = "800 30px Arial, sans-serif"
  ctx.lineWidth = 5
  ctx.strokeText(nm, mx(50), my(36))
  ctx.fillText(nm, mx(50), my(36))

  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

function JerseyMesh({ color, pattern, number, name }: Props) {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(jerseyShape(), {
      depth: 0.38,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3,
      steps: 1,
    })
    g.center()
    return g
  }, [])
  const decal = useMemo(() => buildDecal(pattern, number, name), [pattern, number, name])
  const w = (95 - 5) * SC
  const h = (110 - 10) * SC

  // La rotación la maneja OrbitControls (autoRotate) => giro fluido + arrastrable, sin jitter.
  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.15} />
      </mesh>
      {/* Decal frontal: polygonOffset + depthWrite=false eliminan el z-fighting (parpadeo). */}
      <mesh position={[0, 0, 0.3]} renderOrder={1}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={decal} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} roughness={0.5} />
      </mesh>
      {/* Dorso: mismo decal para que la espalda no quede vacía al girar */}
      <mesh position={[0, 0, -0.3]} rotation={[0, Math.PI, 0]} renderOrder={1}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={decal} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} roughness={0.5} />
      </mesh>
    </group>
  )
}

export default function Jersey3D(props: Props) {
  return (
    <Canvas camera={{ position: [0, 0, 5.2], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#74ACDF" />
      <JerseyMesh {...props} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={2.4}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  )
}
