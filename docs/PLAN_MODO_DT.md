# Modo DT — el plan

Escrito el 2026-08-08. Es el cambio grande que sigue: hoy sos el jugador; en el modo DT sos el
que arma el equipo, lo dirige, lo vende y lo compra, y al que echan si no cumple.

---

## 1. Qué hay que no haya que escribir de nuevo

El motor de partidos **ya existe y está probado**. No hay que hacer uno nuevo.

| Pieza | Dónde | Qué aporta al DT |
|---|---|---|
| `simulateSeasonWithStats` | `lib/game-engine.ts` | Simula una liga entera con formación, tabla de posiciones y estadísticas por jugador (goles, asistencias, vallas, tarjetas). Es el corazón del modo DT. |
| `formations` | `lib/game-engine.ts` | Las formaciones y sus puestos. |
| `ALL_CLUBS`, `LIGAS`, `clubesDeLiga` | `lib/career-engine.ts` | 470 clubes, 19 ligas de 7 países, con fuerza y liga. |
| `nivelDeLiga`, `ligaVecina` | `lib/career-engine.ts` | Ascensos y descensos entre categorías, ya calibrados. |
| `marketValueFor` | `lib/career-engine.ts` | Valor de mercado por OVR y edad: es el precio del pase. |
| `TROPHY_META`, `trofeoDeCopaNacional` | `lib/career-engine.ts` | Los 20 trofeos dibujados y la copa de cada país. |
| `makeRng` | `lib/career-engine.ts` | RNG con semilla: la misma partida da el mismo resultado y se puede testear. |
| `data/squads.json` | 206 planteles | **24 planteles reales de 2026** (Boca 22 jugadores, River 23, Racing 20…). |
| `data/players.json` | 3.334 jugadores | Con OVR, puesto y club. |

Lo que hay que escribir es **lo que pasa entre temporada y temporada**: el objetivo que te pone
la dirigencia, el mercado de pases, la plata, y que te echen.

## 2. El alcance honesto de la v1

Los planteles reales cubren **24 clubes de la Liga Profesional 2026**. Los otros 446 clubes
tienen fuerza pero no tienen jugadores. Entonces:

- **v1: la Liga Profesional argentina, 24 clubes, planteles reales.** Es el corazón del juego y
  es lo único que se puede hacer sin inventar jugadores.
- El Ascenso y los otros seis países entran en la v2, cuando haya planteles. Se pueden generar
  desde `strength`, pero un plantel inventado en un juego que se vende como "cada jugador
  cruzado contra tres fuentes" rompe lo único que nos diferencia. **No se inventan jugadores.**

Esto hay que decirlo de entrada en la pantalla de elección: "por ahora, la Primera argentina".

## 3. El bucle

Una temporada es **una unidad completa**: empieza, termina, y deja algo para mostrar. Esto no
es un detalle de diseño, es la lección del modo carrera actual: 108 personas lo empiezan y 4 lo
terminan porque pide quince temporadas antes de darte algo (ver `PLAN_MARKETING_0808.md`).
El DT tiene que poder cerrar la primera temporada en cinco minutos.

```
Elegís club  →  la dirigencia te da un objetivo y un presupuesto
     ↓
Mercado de pases: vendés, comprás, subís pibes    (3–4 decisiones, no 30)
     ↓
Formación y una idea de juego                      (1 decisión)
     ↓
Se juega la temporada                              (simulateSeasonWithStats)
     ↓
Tabla, goleador, copa, continental                 ← LA PLACA PARA COMPARTIR
     ↓
¿Cumpliste?  →  seguís, y tu prestigio sube  |  te echan
     ↓
Si te echan: te llaman clubes según tu prestigio. Si seguís: temporada siguiente.
```

**El gancho del modo no es ganar la liga: es la escalera.** Empezás en el que te acepta, y si
te va bien te llama uno más grande. Es la misma mecánica que ya funciona en el modo jugador.

## 4. Lo que hay que escribir

### `lib/dt-engine.ts` (nuevo, ~400 líneas)

```ts
interface DTState {
  managerName: string
  clubId: string
  season: number            // 1..N
  prestigio: number         // 0-100: qué clubes te llaman
  objetivo: Objetivo        // lo que pide la dirigencia este año
  presupuesto: number       // millones para el mercado
  paciencia: number         // 0-100: baja con cada objetivo fallado
  plantel: string[]         // playerIds
  historia: TemporadaDT[]
  despedido?: boolean
}
```

Cuatro funciones y nada más:

1. **`objetivoDeTemporada(club, prestigio, rng)`** — la dirigencia mide contra los rivales de
   la liga, no contra un número absoluto: a Boca le piden salir campeón, a Aldosivi le piden no
   descender. Sale de la fuerza del club dentro de su liga, que es el mismo cálculo que ya usa
   el ascenso en `career-engine.ts`.

2. **`mercadoDePases(state, rng)`** — devuelve **tres o cuatro** movimientos posibles, no una
   base de datos: "Fulano de Lanús, 26 años, 78 OVR, 4,2 M", "te ofrecen 12 M por tu 9",
   "tenés un pibe de 19 en la reserva". El presupuesto sale de la fuerza del club y del año
   anterior. Precio con `marketValueFor`. **Que sea corto es la decisión de diseño más
   importante del modo**: un mercado de pases completo es lo que hace que la gente cierre la
   pestaña.

3. **`jugarTemporada(state, formacion, rng)`** — arma los rivales con
   `clubesDeLiga('ar-1')`, llama a `simulateSeasonWithStats` y devuelve tabla, goleador,
   copa nacional, plaza continental. Casi todo el trabajo lo hace código que ya existe.

4. **`evaluar(state, resultado)`** — cumplió/no cumplió. Si no cumplió, baja `paciencia`; si
   llega a cero, `despedido = true`. Si cumplió, sube `prestigio`. Con el prestigio nuevo,
   `clubesQueTeLlaman(prestigio)` devuelve dos o tres ofertas y la escalera sigue.

### `lib/dt-store.ts` (nuevo, ~120 líneas)
Igual que `career-store.ts`, con **guardado en el navegador**: el DT es largo por naturaleza y
sin "seguir donde quedaste" no hay segunda sesión. Esto es lo que le falta hoy al modo jugador.

### `app/dt/page.tsx` (nuevo)
Cuatro pantallas: elegir club · mercado · temporada corriendo · resultado. La ficha del
resultado reusa el estilo de `CareerTimelineCard` y `ShareBar`.

### Tests (`__tests__/dt-engine.test.ts`)
Con semilla fija, como los del modo carrera:
- A Boca le piden campeón; a Aldosivi, permanencia.
- Tres temporadas fallando el objetivo te echan; cumpliendo, no.
- El prestigio sube con títulos y hace que llamen clubes más fuertes.
- El presupuesto nunca queda negativo y no se puede fichar sin plata.
- Diez temporadas seguidas no rompen el plantel (sin duplicados, sin equipos de menos de 11).

## 5. En qué orden

| Paso | Qué se entrega | Cómo se comprueba |
|---|---|---|
| 1 | `dt-engine.ts` con las cuatro funciones y sus tests | `npm test` en verde, sin UI |
| 2 | Pantalla de elegir club + una temporada jugada + resultado | Se puede terminar una temporada en el navegador |
| 3 | Mercado de pases de 3–4 decisiones | El presupuesto y el plantel cambian y quedan válidos |
| 4 | Despido, prestigio y clubes que te llaman | Una partida de 5 temporadas con un despido en el medio |
| 5 | Placa para compartir + guardado | `compartido` sube y se puede cerrar y volver |

Criterio de éxito del modo: **una temporada completa en menos de cinco minutos, con una placa
al final**, y `dt_temporada_fin` midiendo dónde se abandona desde el día uno.

## 6. Lo que este modo NO va a tener (y por qué)

- **Partido a partido.** El motor simula la temporada entera; mostrar 38 fechas de a una es otro
  juego y multiplica el tiempo de sesión, que es justo lo que hoy hace que la gente abandone.
- **Entrenamientos, ojeadores, canteras con juveniles generados.** Es la clase de profundidad
  que suena bien y que en el embudo actual no la ve nadie: primero que 60 personas por mes
  terminen una temporada, después se agrega.
- **Planteles de los 470 clubes.** No se inventan jugadores.

## 7. La tensión que hay que tener presente

Los números de hoy dicen que el modo más profundo que tenemos —la carrera de jugador— lo
abandona el 96 %. Un modo DT es, por naturaleza, más largo y más profundo. Construirlo sin
resolver eso es agregar una segunda cosa que nadie termina.

Por eso el orden que propongo es: **el Frente 1 de `PLAN_MARKETING_0808.md` primero** (que la
carrera de jugador se pueda terminar, con guardado y con placa por temporada), y el DT después,
reusando ese guardado y esa placa que ya van a estar hechos y medidos. Si se prefiere arrancar
por el DT igual, se puede: pero entonces el guardado y la placa por temporada son parte del
paso 2 del DT, no un extra.
