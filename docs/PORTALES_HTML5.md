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

## 5. Lo que falta y necesita a Emilio

Estos pasos piden una cuenta y aceptar términos, así que no los puedo hacer yo:

1. Crear cuenta de desarrollador en **itch.io** y en **CrazyGames**.
2. Subir la ficha de arriba con las capturas.
3. Decidir el punto de **GameDistribution**: su modelo es con anuncios y hoy el juego no tiene
   ninguno. Es una decisión de producto, no técnica.
4. Un video de 30 segundos. Es opcional en itch.io y **recomendado** en CrazyGames: se puede
   grabar una partida de draft de punta a punta con la pantalla.

## 6. Cómo se mide si sirvió

El tráfico de un portal llega como `Referral` en Analytics. Hoy son **13 sesiones en 28 días**.
Con un portal aceptado eso tiene que moverse en días, no en semanas. Si a las dos semanas de
estar publicado sigue abajo de 100, el problema es la ficha o la miniatura, no el canal.

Conviene además etiquetar el link que se le da a cada portal, para separarlos entre sí:

```
https://gambetafutbol.games/?utm_source=crazygames&utm_medium=portal&utm_campaign=alta
https://gambetafutbol.games/?utm_source=itchio&utm_medium=portal&utm_campaign=alta
```
