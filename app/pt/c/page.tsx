// Espejo de la página en español. El componente es el mismo: el idioma sale de la ruta
// (`usePathname` en lib/i18n.ts), así que no hace falta pasarle nada.
// La metadata se reexporta para no perder el noindex ni la ficha de la página original.
export { default, metadata } from "@/app/c/page"
