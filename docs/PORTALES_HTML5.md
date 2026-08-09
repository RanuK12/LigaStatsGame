# Publicar Gambeta en portales de juegos HTML5

Es el canal de descubrimiento más grande que tenemos sin usar, y el único del plan que no
depende de que Google nos conozca. Medido el 8/8: el 100 % del tráfico de búsqueda es gente que
ya sabía el nombre. Un portal no te busca a vos, te muestra a quien entró a jugar cualquier cosa.

Lo que sigue es todo lo que hace falta preparado y comprobado, más los pasos que necesitan una
cuenta a nombre de Emilio.

---

## 1. Comprobado: el juego se puede embeber

| Requisito del portal | Estado |
|---|---|
| Corre en navegador, sin instalación | ✅ export estático de Next |
| Sin login obligatorio | ✅ la cuenta es opcional (solo para el ranking) |
| Se puede meter en un `<iframe>` | ✅ el sitio **no** manda `X-Frame-Options` ni `frame-ancestors` |
| Funciona con el almacenamiento bloqueado | ✅ los 12 archivos que usan `localStorage` están protegidos |
| Responsive en móvil | ✅ |
| Sin costo para el jugador | ✅ |

La última fila era el riesgo real: en un iframe de otro dominio Safari bloquea `localStorage` y
sin protección el juego se cae en vez de degradarse. Se revisó archivo por archivo el 8/8 y el
único que quedaba suelto (`lib/carrera-guardada.ts`, recién escrito) se arregló en el commit
`598cd56`. Con el acceso bloqueado se pierde el guardado de la carrera, la racha del reto y el
ELO local, pero **se juega igual**.

## 2. Los portales, por orden de retorno

| Portal | Por qué | Qué pide |
|---|---|---|
| **CrazyGames** | El más grande de habla hispana para juegos de navegador. Tiene sección de deportes y de "juegos .io" con mucho tráfico latino | Alta de desarrollador, el juego servido por HTTPS, 1 icono, capturas, descripción |
| **Poki** | Volumen enorme, muy curado. Suelen pedir métricas de retención antes de aceptar | Formulario de envío. Conviene mandarlo **después** de tener los números del reto diario |
| **itch.io** | Acepta a todo el mundo, no filtra. Sirve para tener presencia y un link con autoridad | Cuenta y subir un zip o apuntar a la URL |
| **GameDistribution** | Distribuye a miles de sitios chicos de golpe | Alta y aceptar su SDK de anuncios (**ojo**: hoy el juego no tiene publicidad; esto habría que decidirlo) |

Empezar por **itch.io** (entra seguro, sirve de prueba) y **CrazyGames** (es el que mueve la
aguja). Poki cuando el reto diario tenga un mes de datos.

## 3. La ficha, escrita

**Nombre:** Gambeta

**Descripción corta (una línea):**
> Armá tu 11 ideal con planteles reales del fútbol argentino y viví tu carrera desde el Ascenso.

**Descripción larga:**
> Gambeta es un juego de fútbol argentino que corre en el navegador, gratis y sin registro.
>
> Tirá la ruleta y te toca un plantel real: el Vélez del 94, el Boca de Bianchi, el River del 96.
> Elegís un jugador para cada puesto hasta completar los once y después simulás la temporada
> entera, con tabla de posiciones, goleadores y copas.
>
> En el modo carrera creás un pibe de 16 años y vivís quince temporadas: la pelea por la
> titularidad, las lesiones, los títulos, la primera oferta de Europa, el Mundial y el retiro.
> Podés empezar abajo del todo, en el Torneo Federal A, y subir peleándola: es el único juego con
> las cuatro categorías argentinas y con los ascensos y descensos de verdad. Hay 409 clubes de
> ocho países, cada uno con su liga, su copa nacional y su lugar en la Libertadores.
>
> Todos los datos son reales: 3.334 jugadores y 206 planteles, y cada jugador de los planteles
> históricos está cruzado contra tres fuentes antes de entrar. No hay ninguno inventado.
>
> Y hay un reto distinto por día, con el mismo bombo para todo el mundo, para comparar con tus
> amigos.

**Categoría:** Deportes · Simulación · Fútbol
**Etiquetas:** futbol, argentina, deportes, simulador, draft, gestión, cartas, multijugador
**Idioma:** español (es-AR)
**Controles:** mouse y pantalla táctil
**Edad:** apto todo público, sin violencia ni compras

## 3 bis. El paquete y las portadas, ya hechos

```
node scripts/data/build-bundle-itchio.mjs     # → data/reports/portales/gambeta-itchio.zip
node scripts/data/build-portada-portales.mjs  # → data/reports/portales/portada-*.png
```

**El zip de itch.io.** Ojo con esto, porque es lo que hace fracasar la primera subida: itch.io
exige `index.html` en la raíz del zip y **prohíbe las rutas absolutas** ("if you use an absolute
path … the request will fail"). CrazyGames dice lo mismo: *"Use only relative paths … Never use
absolute paths, as they will fail to load"*. El export de Next escribe todo como `/_next/...`,
así que **subir la carpeta `out/` tal cual da una pantalla en blanco**.

La salida son los archivos servidos desde afuera, que las dos plataformas contemplan: itch.io
permite cargar recursos externos por HTTPS y CrazyGames evalúa los *externally hosted/loaded
files* por el tiempo hasta empezar a jugar (≤ 20 s). El zip es un `index.html` de 1 kB con el
juego embebido desde gambetafutbol.games. Probado en un navegador real: carga y se juega.
De regalo, la versión del portal nunca queda vieja: se actualiza sola con cada despliegue.

Lo honesto: hay revisores de CrazyGames que prefieren un bundle propio antes que un envoltorio.
Si lo rechazan por eso, la alternativa es un build con `assetPrefix` relativo, que con
`trailingSlash: true` y rutas anidadas hay que armar aparte.

**Las tres portadas** salen con las medidas obligatorias de CrazyGames
(`docs.crazygames.com/requirements/game-covers`), verificadas en su documentación:

| Archivo | Medida | Para |
|---|---|---|
| `portada-apaisada-1920x1080.png` | 1920×1080 (16:9) | apaisada |
| `portada-vertical-800x1200.png` | 800×1200 (2:3) | vertical |
| `portada-cuadrada-800x800.png` | 800×800 (1:1) | cuadrada |

Respetan sus reglas: sin bordes, no son una captura del juego, el nombre va escrito arriba con
la tipografía del sitio, y las tres comparten la misma imagen para que se reconozca el juego
venga de donde venga.

## 4. Capturas

Se generan con el juego corriendo, no son maquetas:

```
npm run dev                          # en otra terminal
node scripts/capturas-secciones.mjs
```

Salen en `data/reports/capturas-secciones/` a 1200×675, que es la medida que piden casi todos.
Las que conviene mandar, en este orden: `draft`, `carrera`, `home`, `equipos`, `ranking`.

**El icono** es `public/logos/gambeta.svg`. CrazyGames pide PNG cuadrado; hay que exportarlo a
512×512 antes de subirlo.

## 4 bis. Estado al 2026-08-09

### itch.io — PUBLICADO ✅

**<https://gambeta-futbol.itch.io/gambeta>** · cuenta `Gambeta-Futbol` · estado PUBLISHED.

Subido el zip, marcado "This file will be played in the browser", mobile friendly y botón de
pantalla completa. Portada apaisada cargada. Probado con "Run game": el juego levanta dentro
del reproductor de itch.io.

En la declaración de IA se marcó **"Yes — This project contains the output of Generative AI"**,
porque este código lo escribimos con LLMs y la pregunta abarca el contenido "even if you
hand-edited it".

### CrazyGames — a un paso, frenado en la declaración

Envío en borrador: `developer.crazygames.com/games/b356b1b8-8b2c-4c31-afb9-f14507c34102`.

Hecho: motor **"Externally hosted (iframe)"** —una opción oficial de ellos, así que no hace
falta subir ningún bundle— apuntando a gambetafutbol.games, soporte móvil, orientación ambas,
y **el QA pasado**: el juego carga en su reproductor y el botón INGRESAR ya no aparece.

**Frenado en el paso 3.** Es un checklist que se firma: *"I confirm that these results are
correct. I understand that my submission will not be accepted if it does not comply with the
requirements or if I have marked any checks incorrectly."* Tres casillas no se pueden marcar
con honestidad todavía:

| Casilla | Por qué |
|---|---|
| **Complies to Gameplay requirements** | Su regla dice *"The game should not include cross-promotions for external or internal games/platforms"* y solo permite links al sitio del desarrollador *"as long they don't lead directly to a playable web version"*. Gambeta tiene botones de compartir a X, Facebook, WhatsApp e Instagram y una sección de donaciones, y su documentación no las contempla ni a favor ni en contra. Es una zona gris real |
| **Browser checks** | Probado en Chrome. Ellos piden Chrome **y Edge**, y avisan que lo desactivan en Safari si no anda bien |
| **Device checks: Mobile** | Probado a 390 px en un navegador de escritorio. No en un teléfono de verdad |

Si se decide que los botones de compartir y la donación también se ocultan embebido —el mismo
`useEmbebido()` que ya usa el login—, la primera casilla deja de ser gris. Es una decisión de
producto: la ShareBar es justo la palanca de crecimiento del `PLAN_MARKETING_0808.md`, aunque
para el que llega desde CrazyGames el link compartido llevaría a nuestro sitio igual.

## 5. Lo que falta y necesita a Emilio

Todo lo de arriba está hecho y probado. Lo que queda son los pasos que piden **crear una cuenta
y aceptar los términos**, que es una firma y por eso va con la mano de Emilio, no con la mía.

### itch.io — 5 minutos

1. Cuenta en <https://itch.io/register>.
2. <https://itch.io/game/new>
3. Título `Gambeta`, y en **Kind of project** elegir **HTML**.
4. Subir `data/reports/portales/gambeta-itchio.zip` y tildar **"This file will be played in the
   browser"**.
5. Pegar la descripción de la sección 3.
6. **Cover image**: `portada-apaisada-1920x1080.png`.
7. Capturas: las de la sección 4.
8. Publicar.

### CrazyGames — más largo, tiene revisión

1. Cuenta en <https://developer.crazygames.com/>.
2. **Submit my game** → el mismo zip y la misma ficha.
3. Las **tres portadas** son obligatorias: apaisada, vertical y cuadrada.
4. Piden además un **video de vista previa**. Es lo único que no puedo generar: hay que grabar
   la pantalla jugando un draft de punta a punta, unos 30 segundos.
5. Queda en revisión de su equipo de calidad.

### La decisión que es tuya

**GameDistribution** reparte el juego a miles de sitios chicos de golpe, pero su modelo es meter
**su SDK de anuncios**. Hoy Gambeta no tiene ni una publicidad y la página dice "gratis y sin
anuncios". Es más alcance a cambio de romper esa promesa: decisión de producto, no técnica.

## 6. Cómo se mide si sirvió

El tráfico de un portal llega como `Referral` en Analytics. Hoy son **13 sesiones en 28 días**.
Con un portal aceptado eso tiene que moverse en días, no en semanas. Si a las dos semanas de
estar publicado sigue abajo de 100, el problema es la ficha o la miniatura, no el canal.

Conviene además etiquetar el link que se le da a cada portal, para separarlos entre sí:

```
https://gambetafutbol.games/?utm_source=crazygames&utm_medium=portal&utm_campaign=alta
https://gambetafutbol.games/?utm_source=itchio&utm_medium=portal&utm_campaign=alta
```
