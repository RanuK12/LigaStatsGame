# ¿Sabías que? — datos curiosos del fútbol argentino

Plan, no implementación. Escrito el 2026-07-31 después de cerrar los equipos históricos.

## Por qué

Hoy Gambeta engancha 3 minutos y no da razón de volver. El reto diario es la razón *de mañana*;
esto es la razón *de quedarse*: contenido de fútbol que se lee solo, que se comparte y que
además es lo que Google indexa. La base ya tiene 3.347 jugadores, 209 planteles y 39 hitos
históricos verificados. El dato ya está: falta contarlo.

## La regla que no se rompe

**Ningún dato se inventa.** Cada uno de dos tipos, y nada más:

1. **Derivado** — calculado en tiempo de build desde `data/players.json` y `data/squads.json`.
   Si el dato cambia, el texto cambia solo. Ejemplos reales que ya salen de la base de hoy:
   - "Clemente Rodríguez y Sebastián Battaglia están en 7 planteles históricos cada uno: nadie
     aparece en más."
   - "El Arsenal 2007 campeón de la Sudamericana es el plantel histórico más numeroso: 41
     jugadores."
   - "De los 39 planteles históricos, 7 son de Boca. El que más."
   - "Hay 35 leyendas en el juego y 7 son arqueros: una de cada cinco."

   Los cuatro salieron de correr la consulta sobre la base, no de la memoria: los primeros que
   escribí a ojo para este plan estaban mal, y ese es exactamente el error que la sección no se
   puede permitir.
2. **Curado con fuente** — escrito a mano en `data/curiosidades.json`, con campo `fuente`
   obligatorio (URL de Wikipedia). Sin `fuente`, el dato no compila: un test lo bloquea, igual
   que `verify_content` bloquea los stubs.

Un dato sin respaldo es peor que no tener la sección: es la única forma de perder la confianza
que da haber cruzado tres fuentes para los planteles.

## La mecánica: "Tirá el dato"

Nada de una lista scrolleable. La misma gramática que el resto del juego: se **tira** y **sale**.

- Botón grande: un dado con la textura de pelota. Al tocarlo rueda 700 ms y **cae en una carta**
  que se da vuelta, con el mismo `PackReveal` que ya usa la ruleta (`components/roulette/`).
- La carta tiene **rareza**, y de ahí sale el gancho:
  | Rareza | Qué es | Cómo se ve |
  |---|---|---|
  | Común | dato de club o de temporada | borde gris |
  | Insólito | récord, rareza estadística | borde celeste, destello |
  | Leyenda | hito histórico verificado | borde dorado, rayos, sonido |
- **Un dato no se repite** hasta que salieron todos los de su rareza (el mismo mecanismo de
  `clubesUsados` del bombo, que ya existe y ya está testeado).
- **Tres tiros gratis por día.** El cuarto se desbloquea completando el reto diario. Es la
  primera vez que dos sistemas del juego se alimentan entre sí.

## Imágenes: las que ya tenemos

Nada de pedir arte nuevo. Cada carta usa, en este orden de preferencia:

1. la foto del jugador (`player.image`, ya cargada para las leyendas);
2. el escudo del club (`/logos/clubs/<id>.png`, 35 clubes + los 48 continentales nuevos);
3. el fondo de época: degradado por década (los 90 en VHS, los 2000 en azul, los 2020 en neón),
   generado con CSS, sin un solo archivo extra.

## Un día como hoy

La portada del home muestra **la efeméride del día**, no un dato al azar: "Un día como hoy, en
2000, Boca era campeón de América". Sale de los `hito` de los planteles históricos y de los
`trophies` de los jugadores, cruzando el día y el mes. Es contenido diario **sin generarlo**, y
es exactamente el material que la cuenta de X necesita todos los días.

## Compartir

Cada carta se comparte como **imagen**, con `lib/share-card.ts` que ya existe. El texto lleva la
mención a @GambetafutbolAR y ningún hashtag, igual que el resto (§2.2 del plan de crecimiento).
Un dato curioso con imagen es lo que mejor circula en X sin pedirle nada a nadie.

## SEO: la parte que rinde a los tres meses

Cada dato de rareza *leyenda* genera además una página estática `/datos/<slug>`, con su fuente
enlazada y links a los planteles que menciona. Son decenas de páginas de fútbol argentino real,
escritas una vez. Es la Fase 3 del plan de crecimiento, alimentada por este trabajo.

## Cómo se construye (orden, con verificación por paso)

1. `scripts/data/build-curiosidades.mjs` → genera las derivadas y valida que cada curada tenga
   `fuente`. Corre en `prebuild`, junto a `build-public-data.mjs`. **Verificación**: un test que
   falla si algún dato no tiene ni cálculo ni fuente.
2. `lib/curiosidades.ts` → selección con anti-repetición y rareza. **Verificación**: test de que
   40 tiros no repiten hasta agotar el mazo, igual que el test del bombo.
3. `components/DatoCard.tsx` + `app/datos/page.tsx` → el dado, la carta y el compartir.
   **Verificación**: `npm run dev` y tirar 10 veces en mobile.
4. Efeméride en el home, debajo del reto diario. **Verificación**: forzar la fecha y ver que sale
   el hito correcto.
5. Páginas `/datos/<slug>` y sitemap. **Verificación**: Search Console las indexa.

## Lo que hace que sea adictivo y no un adorno

- Se **tira**, no se lee: la incertidumbre es el gancho, no el dato.
- Tiene **rareza**, entonces hay algo que perseguir.
- Los tiros se **agotan** y se ganan jugando: le da valor al reto diario.
- Las cartas se **coleccionan**: es el mismo mazo que va a usar el álbum de figuritas (§1.4 del
  plan de crecimiento). Estas dos funciones son la misma función, y conviene construirlas juntas.
