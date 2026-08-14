# Portugués con leyendas brasileñas — qué cuesta de verdad

Escrito el 2026-08-14 después de medir la base, no de estimar.

## Por qué está sobre la mesa

7a0 (7a0.com.br) salió en portugués, inglés y español y llegó a 11,5 millones de visitas con la
misma mecánica de draft que tenemos nosotros, pero con selecciones y Mundiales. Brasil es el
mercado adyacente grande y ese juego ya probó que el formato prende ahí. Copero, solo en español,
igual capturó 13,4 % de España y 8,3 % de México: el idioma abre mercado aunque el contenido sea
local.

## Lo que hay hoy en la base, contado

| Dato | Número |
|---|---|
| Jugadores en `data/players.json` | 3.334 |
| De ellos, argentinos | 2.665 |
| Brasileños | **0** |
| Jugadores históricos en `data/players_historical.json` | 2.496 |
| De ellos, brasileños | **0** |
| Brasileños en `data/fifa-index.json` (la fuente de OVR) | 2.267 |
| De esos, que jugaban en el Brasileirão | **prácticamente ninguno**: están en ligas europeas |
| Ligas de Brasil en `data/derived/ligas.json` | sí, `br-1` ya existe para el modo carrera |

Traducido: **el modo carrera ya puede transcurrir en Brasil** —la liga está cargada, con fuerza 95,
la más alta de Latam— pero **el draft no tiene un solo plantel brasileño**, y el draft es el modo
que se comparte y el que nos diferencia.

## Por qué esto no es "traducir la interfaz"

Traducir los textos sin planteles brasileños deja un juego en portugués sobre fútbol argentino.
Eso no le sirve a nadie en Brasil y encima nos pone a competir con 7a0 en su cancha con menos
contenido que él. El trabajo de verdad son los datos, y es el mismo que se hizo para Argentina:
scraping, cruce de fuentes, OVR y auditoría plantel por plantel.

## Las tres fases, en orden

**1. La infraestructura de idioma (1 a 2 días).**
Hoy no hay ninguna: los textos están escritos en el JSX. Está planteado en `docs/PLAN_I18N.md`.
Es condición para las otras dos, y sirve igual para el inglés.

**2. El Brasileirão actual (3 a 5 días).**
El mismo camino que las siete ligas de `data/derived/ligas.json`, que salieron de Wikidata: clubes,
escudos, planteles por temporada, y OVR cruzado contra `fifa-index`. Con esto el draft brasileño
existe, aunque sin leyendas.

**3. Las leyendas brasileñas (1 a 2 semanas).**
Es lo que hace que valga la pena: Pelé, Zico, Sócrates, Romário, el Santos del 62, el Flamengo del
81. `players_historical.json` no tiene ni uno, así que hay que armar la fuente entera, que es
exactamente lo que más tiempo llevó del lado argentino.

## La recomendación, aunque la decisión sea de Emilio

Hacerlo **después** de que el canal argentino muestre señal, no antes. Tres motivos medidos:

1. Gambeta tiene 426 usuarios por semana. El problema no es que falte mercado: es que en el
   mercado donde el contenido ya es bueno no nos conoce nadie.
2. 7a0 viene cayendo 51 % mes contra mes. Entrar a Brasil ahora es entrar a una ola que está
   bajando, con menos contenido que el que ya está ahí.
3. Las tres fases suman entre dos y cuatro semanas de trabajo de datos. En ese tiempo, las mismas
   horas puestas en el canal argentino tocan un mercado donde ya somos la mejor versión del
   producto.

Lo que sí conviene adelantar, porque es barato y no depende de nada: **la fase 1**. Con la
infraestructura de idioma lista, el día que se decida Brasil o Estados Unidos el trabajo que queda
es de datos y no de refactor.
