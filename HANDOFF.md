# LigaStatsGame — HANDOFF / Spec (objetivo: paridad con 7a0.org)

## Qué es
El "draft del fútbol argentino": el usuario recibe un plantel histórico (club + temporada), arma su 11
eligiendo jugadores por posición según la formación, y se simula el rendimiento. Inspirado en
**7a0.org / 38-0.app**, pero de la Superliga/Primera argentina (clubes, no selecciones del Mundial).

## Referencia: 7a0.org (lo que hay que igualar)
- Juego de draft: te toca una selección/plantel al azar, elegís 1 jugador por turno hasta 11, con
  restricción por posición/formación. Formaciones (4-3-3, 4-4-2, 3-5-2...).
- Modos: **Clásico** (muestra rating) vs **Almanaque** (oculta rating = prueba de memoria). Estilos
  defensivo/equilibrado/ofensivo. **Simulación** que calcula ataque/medio/defensa.
- Extras: multijugador, guía de estrategia, FAQ, 3 idiomas (ES/EN/PT).
- **DATOS (su mayor activo): 46 selecciones · 177 planteles · 4.009 jugadores (1970-2026)** con rating.

## Estado actual (auditado 2026-06-29)
- **Stack ya armado:** Next.js + TS + Tailwind (deploy Vercel). Zod schemas en `lib/types.ts`
  (Player con rating/posiciones/stats/trofeos/legendary, Squad, Club, Formation). Motor en
  `lib/game-engine.ts`. Páginas: `app/draft`, `app/ruleta`, `app/leaderboard`, `app/results`.
  6 modos definidos (clasico, almanaque, liga, reto-dia, ruleta, copa) — MÁS que 7a0.
- **El gap NO es estructura, es DATOS:**
  | | Hoy | 7a0 | objetivo |
  |---|---|---|---|
  | Jugadores | 285 | 4.009 | 1.500+ (calidad > cantidad) |
  | Planteles | 15 | 177 | 80+ |
  | Clubes | 28 | 46 | mantener + temporadas |
- Calidad: 281/285 jugadores con rating. La base es buena; falta VOLUMEN y cobertura histórica.

## BUGS / FALTANTES conocidos (reportados por Emilio 2026-06-29)
1. **Ruleta:** no se muestra visualmente al girar (la animación del spin no se ve / está rota).
2. **Stats de jugadores MAL:** los números/ratings no son correctos o no condicen.
3. **Restricción de posición ROTA:** al sortear un jugador lo podés poner en CUALQUIER posición aunque sea
   defensor. Tiene que respetar la posición/formación (un CB no va de ST). [es el bug más concreto a fixear]
4. **DB pobre:** casi no hay jugadores (285) — falta volumen (ver roadmap, es lo prioritario).
5. **Visual:** mucho por mejorar (UI/UX, pulido).
6. **Pelota oficial "ARGENTUM GAMBETA":** Emilio mandó la nueva pelota del fútbol argentino para
   incorporar como pelota/branding del juego (en la cancha del draft, loader, ícono). Usar la imagen que
   envió (si hace falta, pedírsela de nuevo) como asset visual. Va en la fase de pulido visual (L-P).

## Roadmap a paridad (DB primero — es lo que más mueve la aguja)
1. **Expandir la DB (lo crítico):** seedear/scrapear muchos más PLANTELES históricos por club y
   temporada (River, Boca, Independiente, Racing, San Lorenzo, Vélez, Estudiantes, Newell's, Central...
   + campañas memorables y Libertadores), cada uno con su 11/plantel y jugadores con rating, posición,
   stats y trofeos. Reusar `scripts/scrape-players.mjs` y el `playerSchema`/`squadSchema` (NO cambiar el
   modelo; sí poblarlo). Validar con Zod al cargar.
2. **Simulación pulida:** que el motor calcule ataque/medio/defensa con los ratings (como 7a0) y dé un
   resultado creíble y compartible.
3. **Modos Clásico vs Almanaque** afinados (ratingsVisible), estilos de juego, y reto del día.
4. **Pulido + multijugador + i18n (ES/EN/PT)** para paridad funcional/visual.

## Cliente final
Hincha del fútbol argentino que quiere un juego ADICTIVO y compartible, con MUCHOS equipos/jugadores
históricos y ratings que se sientan justos. Lo que más lo engancha = profundidad de datos + simulación
satisfactoria. Por eso la DB va primero.

## Reglas de trabajo
Cambios quirúrgicos sobre lo que YA existe (no rehacer el modelo ni el motor). Cada avance: que el
`next build` pase, datos validados por Zod, commit con tag [ranukita:<id>]. Sin inventar datos: ratings
y stats con criterio/fuente, no al azar.
