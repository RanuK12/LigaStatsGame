# Plan de expansión — ascenso, base de datos y el link que falta

Auditoría de **potrerofutbol.ar** hecha el 2026-08-03 entrando al sitio con Chrome real
(WebFetch devuelve 403: Cloudflare). Todo lo que sigue está medido en el DOM o leído de su propia
guía, no recordado.

---

## 1. Qué es Potrero, en serio

**No es una empresa de juegos. Es una plataforma de datos de fútbol con un juego encima.**

Eso cambia la lectura de todo lo demás. Su navegación tiene **32 países y confederaciones** con
resultados en vivo, fixtures, tablas y estadísticas. El Ídolo es una pestaña de ese producto.

| | |
|---|---|
| Producto base | Resultados en vivo, fixtures, tablas, formaciones, goleadores, notificaciones |
| Apps | iOS y Android |
| Monetización | Publicidad + Premium USD 1,99/mes o 9,99/año + Cafecito + Ko-Fi |
| Juego | El Ídolo, **versión 2.2**, dentro del sitio y dentro de la app |

Cuando "ampliaron a ligas de otros países" no salieron a construir una base: **ya la tenían**. El
feed que alimenta los resultados en vivo es el mismo que alimenta el juego. Ese es su foso, y no
se cruza copiándoles la lista de países.

## 2. El Ídolo, medido

### Países y divisiones jugables

**26 países** en el selector de liga: Alemania, Argentina, Bolivia, Brasil, Chile, Colombia, Costa
Rica, Ecuador, El Salvador, Escocia, España, Estados Unidos, Francia, Guatemala, Honduras,
Inglaterra, Italia, México, Nicaragua, Países Bajos, Panamá, Paraguay, Perú, Portugal, Uruguay,
Venezuela.

**Argentina tiene cuatro divisiones jugables**, y esto es lo que preguntaste:

| División | Equipos en el selector |
|---|---|
| Liga Profesional | 37 |
| Primera Nacional | 37 |
| Primera B Metropolitana | 37 |
| Torneo Federal A | 38 |

Segunda división jugable solo en Argentina, Uruguay y las grandes de Europa. En el resto se debuta
directo en Primera, en un club chico.

### Mecánica

- **Dos puestos y nada más: la 9 y la 10.** No hay arqueros, ni centrales, ni volantes.
- **Cinco atributos**: Definición, Velocidad, Potencia, Liderazgo, Resistencia. Cada uno con un
  efecto concreto y declarado (la Velocidad mete más goles pero lesiona; la Resistencia estira la
  carrera).
- **Idolatría por club**, cinco niveles hasta la estatua. Saltar de club te aleja de Leyenda.
- **Eventos**: golpe duro / decisión difícil / pasan cosas. Más de 300, **localizados por país**
  (la semana del clásico en Montevideo no es la de Múnich).
- **Las finales no se simulan**: nueve minijuegos rotativos (penales, tiro libre, minuto 90, mano
  a mano, cabezazo, pizarra del DT, achique, corrida, jugada ensayada). Mundial y Mundial de
  Clubes son torneos enteros jugables.
- **Tienda**: patrimonio cosmético (auto, mansión, yate, isla) + staff con efecto permanente
  (kinesiólogo, preparador, representante) + compras de temporada.
- **Carrera del Día**: misma semilla para todo el mundo, ranking diario.
- **Ranking global** + ranking aparte para los "Pibes Maravilla" (0,1 % de las carreras).
- **Vitrina de copas** y **Logros**, que al completarse desbloquean el trofeo máximo.
- Sin registro. La carrera se guarda en el dispositivo.
- **ES / PT / EN.**

### Lo único que hay que copiarles ya

> "Al terminar, cada carrera genera **un link y una imagen** para compartir. **El que abre el link
> puede ver tu carrera completa.**"

Nosotros generamos una imagen que se descarga. Ellos generan una **URL**. La diferencia es toda:
una imagen es un callejón sin salida, un link es una puerta de entrada, se previsualiza en X y en
WhatsApp, y encima Google lo indexa.

Y al pie de su juego: *"¿Sugerencias o algo que quieras que sumemos? Escribinos por X
(@potrero_app) y lo agregamos."* El roadmap es público y lo escriben los jugadores.

---

## 3. Dónde estamos

Medido en el repo hoy: **35 clubes, 3.334 jugadores, 206 planteles, 36 equipos históricos,
48 URLs**.

### Lo que tenemos y ellos no

| | |
|---|---|
| **Jugadores reales con nombre** | 3.334. En El Ídolo el jugador sos vos y el resto no existe |
| **Once puestos** | Ellos tienen dos |
| **El draft / el bombo** | No tienen. Es la mecánica de 7A0, y la nuestra es con clubes argentinos |
| **36 planteles históricos** | Vélez 94, los Boca de Bianchi. Cruzados contra tres fuentes |
| **Torneo, Libertadores, versus, ruleta, récords** | Su juego es una sola cosa |
| **Leaderboard en Supabase** | **Vivo en producción** (verificado en los chunks desplegados) |

### Lo que nos falta

| | Estado |
|---|---|
| **Link compartible de la carrera** | No existe. Solo se descarga un PNG |
| **Ascenso argentino** | Cero. Solo Liga Profesional |
| **Otros países en el modo carrera** | 12 clubes europeos escritos a mano en `career-engine.ts` y 48 continentales |
| **Perfil, vitrina, logros** | No hay. El leaderboard guarda torneos de draft, **no carreras** |
| **EN / PT** | Pendiente (`docs/PLAN_I18N.md`) |
| **App** | No |

---

## 4. La lectura

Hay tres cuellos distintos y conviene no confundirlos.

1. **Adquisición.** Google es el 85 % del tráfico y el sitio tiene 48 páginas. Cada club nuevo con
   plantel es una página que hoy no existe en ningún lado: *"plantel Deportivo Morón 2026"* no
   tiene competencia. El ascenso no es solo una función del juego: **son ~86 páginas nuevas**.
2. **Viralidad.** La ficha se descargó 1 vez en dos días. No es que la ficha sea fea: es que no hay
   nada para pegar en un tweet más que un archivo.
3. **Retención.** 928 usuarios nuevos y 927 activos en 28 días. Nadie vuelve porque no hay nada
   que quede: ni perfil, ni vitrina, ni una carrera guardada que valga la pena continuar.

**No hay que copiarles los 26 países.** Ellos van a lo ancho porque el feed ya lo tenían. Nuestro
diferencial es la profundidad argentina: los jugadores reales con nombre, los 36 planteles
históricos y —lo que falta— el ascenso completo. Ese terreno ellos no lo pueden tomar, porque su
juego no tiene jugadores.

---

## 5. El plan, por orden de ejecución

### Fase 1 · El link de la carrera — **HECHO el 2026-08-03**

Lo más barato y lo de mayor palanca. Sin esto, todo lo demás mueve menos.

**La carrera viaja DENTRO del link, no en Supabase.** El plan original decía guardarla en una
tabla y mandar un id. Se descartó al implementarlo: el sitio es export estático, así que una
tabla agrega una dependencia de red para abrir un link, algo que moderar y un id que puede quedar
huérfano, a cambio de nada que se note. Codificada en base64url la carrera entera ocupa **707
caracteres** —medido, no estimado— y el link es autosuficiente: anda sin backend y sin cuenta.

- `lib/career-link.ts` — codifica y decodifica. El escudo no viaja: se arma del id al abrir.
- `app/c/` — página que lee el parámetro y muestra la carrera completa, con CTA a crear la tuya.
  Va **`noindex`**: todas las carreras comparten la ruta, así que lo único que Google podría
  guardar es la página vacía.
- El `destino` del ShareBar del final de carrera ahora es esa URL, con `utm_campaign=carrera`.
- Eventos nuevos: `carrera_link_visto` y `carrera_link_cta`.

**La previsualización arranca genérica** (título e imagen fijos): personalizarla necesita un
Worker de Cloudflare que arme el PNG al vuelo. Es la fase 1b, después de ver si el link se usa.

Verificado de punta a punta en el navegador con una carrera de 13 temporadas simulada con el
motor real, y con un link roto, que muestra el cartel en vez de romper la página.

Éxito: `compartido` arriba del 5 % de los que terminan una carrera.

### Fase 2 · El ascenso argentino (1 semana)

Es lo que pediste y es, además, el motor de tráfico.

**Los datos existen.** Verificado hoy contra Wikidata:

| División | Clubes en Wikidata | Jugadores con P54 |
|---|---|---|
| Primera Nacional | 41 | 3.299 |
| Primera B Metropolitana | 18 | — |
| Torneo Federal A | 27 | 791 |

**Con la trampa conocida**: `P54` sin fecha de fin incluye pases viejos que nadie cerró — Tigre da
196 jugadores "actuales". Se cruza igual que los históricos: `verificar-historicos.mjs` +
`cruzar-historicos.mjs` piden dos fuentes de tres (Wikidata, es.wikipedia, nuestra base). 33 de 39
clubes de Primera Nacional tienen 11 o más jugadores con el pase abierto; 24 tienen 18 o más.

Trabajo:

1. `scripts/data/build-ascenso.mjs`, calcado del pipeline de históricos. Un club entra solo si
   junta 16 jugadores con dos fuentes; el que no llega se lista y **no se completa a ojo**.
2. **OVR**: estos jugadores no están en el dataset FIFA. Fórmula de `recompute-ovr.mjs` con techo
   por división — Primera Nacional 72, B Metropolitana 68, Federal A 65. No se trata de acertar el
   número exacto de cada uno, sino de que el orden sea creíble y de que un equipo de la B no le
   gane a Boca.
3. **Escudos**: `download-club-crests.mjs` + `generate-club-svgs.mjs` para ~86 clubes.
4. **Páginas**: extender `/equipos/` con las divisiones. El sitio pasa de **48 a ~134 URLs**.
5. **En el juego**:
   - El bombo suma tier "ascenso", con probabilidad menor. Que salga Riestra no es lo mismo que
     que salga River, y eso es parte de la gracia.
   - El modo carrera arranca opcionalmente en la B, **con ascensos y descensos de verdad**. Es el
     gancho de El Ídolo —"de pibe del Ascenso a leyenda"— y en Argentina pega fuerte.

Éxito: `npm run audit:data` con health score igual o mejor, 86 clubes jugables, y las páginas
indexadas en Search Console a las dos semanas.

### Fase 3 · Retención (3-4 días)

Ellos tienen tres cosas que hacen volver y nosotros ninguna. Con Supabase ya vivo salen baratas.

- **Idolatría** — **HECHA el 2026-08-03** (`lib/career-idolatria.ts`). Cinco niveles hasta la
  estatua, calculados del historial y no guardados en el estado: la carrera ya sabe en qué club
  jugó cada año, y un campo nuevo sería una segunda fuente de verdad que se desincroniza. La
  racha cuenta temporadas **seguidas** y crece más que lineal, así que irse y volver no paga lo
  mismo que quedarse. Sale en el panel, en la ficha y en el subtítulo de lo que se comparte.
- **Perfil**: tus últimas carreras, tus mejores drafts, tu ELO.
- **Vitrina de copas**: todas las copas del juego, apagadas, que se van encendiendo. Es la razón
  por la que alguien juega la carrera número siete.
- **Logros**.
- **Ranking global de carreras**, no solo de torneos de draft. El leaderboard ya existe; falta el
  otro tipo de puntaje.

Éxito: usuarios recurrentes arriba del 15 % (hoy son ~0 %).

### Fase 4 · Otros países, uno por vez (después de medir la fase 2)

Solo si el ascenso demuestra que las páginas de club traen gente. Y en este orden, por afinidad y
por calidad de datos: **Uruguay** (el clásico rioplatense, liga chica, datos buenos), después
**Chile** y **Paraguay**, después **Brasil** —que solo tiene sentido junto con el PT del
`PLAN_I18N.md`—.

Uno por vez, midiendo. No 26 de golpe.

### Fase 5 · Ideas de ellos que valen la pena y son baratas

- **Tienda de staff con efecto real** (kinesiólogo, preparador, representante). Le da una decisión
  económica a la carrera, que hoy no tiene.
- **Eventos localizados**: la semana del clásico en Rosario no es la de Avellaneda. Nuestra base de
  clubes ya tiene los datos para eso.
- **El pedido público en X**: *"decinos qué querés que sumemos"*. Cuesta cero y convierte al
  jugador en parte del proyecto. Con el ascenso encima es un imán: cada hincha va a pedir su club.

---

## 6. Lo que NO vamos a hacer

- **No perseguir los 26 países.** Su ventaja ahí es estructural.
- **No copiarles los dos puestos.** Nuestros once puestos con jugadores reales son lo contrario de
  su juego, y es lo que nos hace distintos.
- **No hacer app** hasta que el sitio retenga. Una app que nadie abre es peor que ninguna.
- **No inventar datos del ascenso.** Un club con plantel a medias se deja afuera y se avisa.

## 7. Cómo sabemos si funcionó

| Métrica | Hoy | A las 4 semanas |
|---|---|---|
| URLs indexadas | 48 (pedidas), pocas indexadas | 120+ |
| Sesiones de Google | 324 / 2 días | +50 % |
| `compartido` | 3 usuarios | > 5 % de los que terminan |
| Usuarios recurrentes | ~0 % | > 15 % |
| Clubes jugables | 35 | 121 |
