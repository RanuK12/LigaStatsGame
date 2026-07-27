# Plan: Gambeta en español, inglés y portugués

**Estado: pendiente.** Escrito el 2026-07-27 para hacerlo más adelante. Hoy todo el sitio está
en español rioplatense y así se queda hasta que se ejecute este plan.

## Por qué

El juego ya funciona y el contenido es del fútbol argentino, pero la arquitectura no depende
del idioma. Abrirlo a inglés y portugués multiplica el alcance sin tocar el motor:

- **Portugués** es el vecino natural: Brasil sigue la Libertadores y conoce a los clubes
  argentinos. Es el mercado más grande y más cercano.
- **Inglés** es el idioma en el que el proyecto se muestra como pieza técnica (LinkedIn, X,
  portfolio) y donde llega el público que sigue el fútbol sudamericano desde afuera.

## Qué hay que traducir (inventario real del repo)

| Tipo | Dónde | Volumen |
|---|---|---|
| UI de páginas | `app/*/page.tsx` (10 páginas) | ~124 cadenas con texto |
| UI de componentes | `components/**` (36 archivos) | incluido arriba |
| Narrativa de partidos | `lib/chronicle.ts` | plantillas de relato |
| Narrativa de carrera | `lib/career-engine.ts` | dilemas, crónicas, historias de retiro, highlights |
| Retos diarios | `lib/daily-challenge.ts` | 14 retos con título y regla |
| Ranking | `lib/ranking.ts`, `lib/leaderboard-seed.ts` | tiers + 10 DTs de la casa con lema |
| Exportables | `lib/pdf.ts`, `lib/career-pdf.ts`, `lib/story-card.ts`, `lib/share-card.ts` | textos dibujados a canvas/PDF |
| Compartir | `components/ShareBar.tsx` | mensajes predefinidos por resultado |
| SEO / metadata | `app/layout.tsx` | title, description, OG |
| Agenda | `lib/live-scores.ts` | nombres de ligas en español |

Lo que **no** se traduce: nombres de jugadores, clubes y estadios (son propios), y los datos de
`data/` en general.

## Enfoque técnico

El sitio es `output: 'export'` (estático, GitHub Pages), así que no hay middleware ni
negociación de idioma en servidor. El camino que funciona con esa restricción:

### 1. Segmento de ruta `[locale]`

```
app/
  [locale]/
    layout.tsx        ← define <html lang>, metadata por idioma
    page.tsx
    draft/page.tsx
    carrera/page.tsx
    ...
```

Con `generateStaticParams()` devolviendo `['es', 'en', 'pt']`, Next genera las tres versiones en
build. Quedan `/es/`, `/en/`, `/pt/`.

- La raíz `/` redirige por JS al idioma del navegador (`navigator.language`) con memoria en
  `localStorage`, cayendo a `/es/` por defecto. En export estático la redirección va en el
  cliente, no en el server.
- **Los links internos tienen que llevar el locale.** Conviene un `<Link>` propio que lo
  anteponga, para no tener que revisar cada `href` a mano.

### 2. Diccionarios, sin librería pesada

Para este tamaño no hace falta `next-intl`. Alcanza con:

```
i18n/
  es.json
  en.json
  pt.json
  index.ts   ← getDict(locale), tipado desde es.json (así el compilador avisa si falta una clave)
```

Tipar `en.json` y `pt.json` contra las claves de `es.json` hace que TypeScript marque cualquier
traducción faltante en `npm run typecheck`. Es la red de seguridad más barata.

### 3. Lo que no es texto plano

- **Narrativa generada** (crónicas, historias de retiro, dilemas): son plantillas con variables.
  Se mueven a los diccionarios como arrays de plantillas y se eligen igual que ahora. Ojo con el
  orden de las palabras: en inglés el club va después del verbo, así que no sirve concatenar.
- **Canvas y PDF** (`story-card.ts`, `share-card.ts`, `pdf.ts`, `career-pdf.ts`): reciben el
  diccionario como parámetro. Hay que revisar los anchos: "V. INVICTAS" mide distinto que
  "CLEAN SHEETS" y las cajas están medidas a ojo.
- **Números y fechas**: usar `Intl.NumberFormat` y `toLocaleDateString` con el locale actual. Hoy
  hay `'es-AR'` escrito a mano en la agenda y en el PDF del draft.
- **Ligas de la agenda** (`lib/live-scores.ts`): el nombre visible sale de nuestra tabla, así que
  se traduce ahí. ESPN ya devuelve los datos en inglés.

### 4. Selector de idioma

Chip en el header (🇦🇷 ES · 🇬🇧 EN · 🇧🇷 PT) que cambia el segmento de la URL manteniendo la
página actual y guarda la elección. Diseño chico, al lado del botón de ingresar.

### 5. SEO

- `<html lang>` por idioma.
- `alternate` / `hreflang` entre las tres versiones en el `layout.tsx` de cada locale.
- `sitemap.xml` con las tres.
- Metadata (title/description/OG) traducida.

## Fases

| Fase | Qué | Esfuerzo |
|---|---|---|
| **1. Andamiaje** | `[locale]`, diccionarios, `Link` con locale, selector, redirección de `/` | 1 día |
| **2. UI** | Las ~124 cadenas de páginas y componentes a `es.json` y traducidas a EN/PT | 1 día |
| **3. Narrativa** | Crónicas, dilemas, retiros, retos diarios, DTs de la casa | 1-2 días (es lo más largo: hay que **reescribir**, no traducir literal — el tono rioplatense no se traslada) |
| **4. Exportables** | Canvas, PDFs, mensajes de compartir, y revisar que los textos entren en las cajas | medio día |
| **5. SEO + QA** | hreflang, sitemap, y recorrer los tres idiomas página por página | medio día |

## Riesgos a tener en cuenta

- **El tono.** "Armá tu equipo soñado" o "La Cábala (Anti-Mufa)" no tienen traducción literal que
  funcione. En inglés y portugués hay que **reescribir con la misma energía**, no traducir. Es la
  parte que más tiempo lleva y la que decide si el juego se siente bien o suena a robot.
- **Textos más largos.** El portugués y el inglés estiran las cadenas; los botones y las cajas del
  canvas están ajustados. Hay que revisar cada pantalla, no confiar en que entra.
- **Tamaño del bundle.** Tres diccionarios embebidos son unos pocos KB, no es problema, pero
  conviene importar solo el del locale activo.
- **Rutas ya publicadas.** Si alguien compartió `gambetafutbol.games/draft/`, esa URL tiene que
  seguir funcionando: dejar redirección desde las rutas viejas a `/es/...`.

## Criterio de terminado

- Las tres versiones se recorren enteras sin una sola cadena en español fuera de `/es/`.
- Los PDFs y las imágenes de compartir salen en el idioma elegido, sin texto cortado.
- `npm run typecheck` falla si falta una clave en algún diccionario.
- El selector recuerda la elección y `/` manda al idioma del navegador.
