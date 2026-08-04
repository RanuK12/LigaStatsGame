# Lanzamiento: 7 países, 16 categorías, 378 clubes

Capturas y textos para el anuncio. Generado el 2026-08-04.

Las capturas salen de la página real corriendo (`npm run dev` + Playwright), no de una maqueta.
Para regenerarlas hay que levantar el sitio y correr el script que quedó en el historial de la
sesión; si se rehacen, **el viewport tiene que ser alto** (3200 px): si el contenedor no entra,
Playwright scrollea y el fondo fijo del sitio tapa todo, y la captura sale negra.

| Archivo | Qué muestra |
|---|---|
| `1-paises.png` | El selector con los siete países |
| `2-brasil.png` | La Série A con Palmeiras, Flamengo, Corinthians |
| `3-ascenso.png` | La Primera B Metropolitana |
| `4-evento.png` | El modal de decisión de temporada |
| `5-final.png` | La ficha final, ya con su cruz de cerrar |

## Los números, para no inventarlos

- **7 países**: Argentina, Uruguay, Chile, Colombia, Perú, Paraguay, Brasil
- **16 categorías**, **378 clubes**
- **84 clubes del ascenso argentino** (Primera Nacional, Primera B Metropolitana, Federal A)
- Cada país con su copa nacional y sus plazas a la Libertadores

## Los tweets

Van de a uno, no todos el mismo día. El orden es el de abajo: primero el anuncio, después el
ángulo local, y las respuestas a lo que la gente conteste.

---

**1 · El anuncio** (con `1-paises.png`)

> El modo carrera de Gambeta ya no es solo argentino.
>
> 🇦🇷 🇺🇾 🇨🇱 🇨🇴 🇵🇪 🇵🇾 🇧🇷
> 7 países · 16 categorías · 378 clubes
>
> Elegís dónde debutar y te la bancás.
>
> gambetafutbol.games/carrera/

---

**2 · El ascenso, que es el ángulo que nadie más tiene** (con `3-ascenso.png`)

> Ahora podés empezar tu carrera en la B.
>
> Primera Nacional, Primera B Metropolitana y Federal A: 84 clubes del Ascenso argentino.
>
> Se sube peleándola. Y se puede bajar.
>
> gambetafutbol.games/carrera/

---

**3 · Brasil** (con `2-brasil.png`)

> Debutar en el Ascenso argentino y terminar en el Maracaná.
>
> La Série A entera en el modo carrera: Palmeiras, Flamengo, Corinthians, Grêmio.
>
> Cada liga con su formato real y sus plazas a la Libertadores.

---

**4 · La pregunta que hace que contesten**

> Una sola pregunta: ¿en qué club debutarías?
>
> Ahora se puede elegir entre 378, de siete países y cuatro categorías.
>
> El mío sería en la B, para subir con el club. 👇

---

**5 · Las decisiones** (con `4-evento.png`)

> Cada temporada te para el partido y te hace elegir.
>
> El plan de pretemporada. La oferta rara. Los que te esperan afuera del vestuario.
>
> Ninguna opción sale gratis.

---

**6 · Para el que ya jugó**

> Si jugaste una carrera en Gambeta hace unos días, volvé a probar: es otro juego.
>
> Se puede arrancar en el Ascenso, ascender de categoría, jugar en siete países, y la ficha
> final ahora se comparte con un link que abre tu carrera entera.

## Lo que NO conviene decir

- **"378 clubes" como si fueran planteles.** Son clubes con su fuerza, su categoría y su
  escudo, para el modo carrera. Los planteles con jugadores reales siguen siendo los
  argentinos del draft. Si alguien pregunta, se contesta eso y ya.
- **Los escudos son generados**, no los oficiales. Nadie preguntó todavía, pero si preguntan,
  se dice.
