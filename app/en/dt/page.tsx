"use client"

// Espejo de la página en español. El componente es el mismo: el idioma sale de la ruta
// (`usePathname` en lib/i18n.ts), así que no hace falta pasarle nada.
//
// Va con "use client" a propósito: sin eso el espejo es un módulo de servidor que
// reexporta un componente de cliente, y Next intenta serializarle los `searchParams` a
// esa frontera. Con `output: export` eso corta el build entero.
export { default } from "@/app/dt/page"
