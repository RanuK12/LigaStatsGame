#!/usr/bin/env python3
"""Escudos que se ven la mitad de chicos que el resto: les sobra margen transparente.

    python3 scripts/data/normalizar-escudos.py             # informa, no toca nada
    python3 scripts/data/normalizar-escudos.py --escribir   # recorta y guarda

El problema, medido: siete escudos —Aldosivi, Arsenal, Barracas Central, Central Córdoba,
Colón, Independiente Rivadavia y Riestra— vienen en archivos de 240x240 donde el dibujo ocupa
el 44,6% y el resto es transparente. La mediana de los otros 96 es 99,7%. Como en todo el sitio
los escudos van en una caja fija con `object-contain`, esos siete se dibujan a la mitad de
tamaño y arrimados a una esquina de su casilla.

No es CSS: la caja mide 36x36 en los 103. Es el archivo.

Se recorta el margen y se vuelve a centrar en un lienzo cuadrado de 256 px. El recorte crudo
queda en 123 px de lado, y eso es poco donde el escudo se muestra grande —el cartel del plantel
del draft lo dibuja a 110 px, que en una pantalla 2x pide 220—, así que se reescala. Ablanda un
poco, sí; renderizarse a la mitad de tamaño se nota mucho más.

En Python porque PIL ya está instalado; sharp no es dependencia del proyecto y no vale sumar
una para esto.
"""
import sys
from pathlib import Path

from PIL import Image

DIR = Path(__file__).resolve().parents[2] / "public" / "logos" / "clubs"
ESCRIBIR = "--escribir" in sys.argv

# Por debajo de esto el escudo se ve claramente más chico que sus vecinos. Los que están entre
# 60 y 80% no se notan en una lista, así que no se tocan: reprocesar una imagen siempre pierde.
MINIMO = 0.60
# Un respiro alrededor, para que no quede pegado al borde de su círculo.
MARGEN = 0.03
# El lado final. Los sanos son de 512 o 256; con 256 alcanza para el uso más grande que hay.
LADO = 256


def ocupacion(im: Image.Image):
    """Cuánto del archivo ocupa el dibujo, y dónde está."""
    caja = im.getbbox()
    if not caja:
        return 0.0, None
    ancho, alto = im.size
    return ((caja[2] - caja[0]) / ancho + (caja[3] - caja[1]) / alto) / 2, caja


def main() -> int:
    tocados = []
    for ruta in sorted(DIR.glob("*.png")):
        im = Image.open(ruta).convert("RGBA")
        ocupa, caja = ocupacion(im)
        if caja is None or ocupa >= MINIMO:
            continue

        recortado = im.crop(caja)
        lado = int(round(max(recortado.size) * (1 + MARGEN * 2)))
        lienzo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
        lienzo.paste(
            recortado,
            ((lado - recortado.width) // 2, (lado - recortado.height) // 2),
            recortado,
        )
        if lado != LADO:
            lienzo = lienzo.resize((LADO, LADO), Image.LANCZOS)
        tocados.append((ruta.name, f"{im.width}x{im.height} ({ocupa * 100:.0f}%)", f"{LADO}x{LADO}"))
        if ESCRIBIR:
            lienzo.save(ruta)

    if not tocados:
        print("Todos los escudos llenan su archivo. Nada que hacer.")
        return 0

    print(f"{len(tocados)} escudos con margen transparente de más:\n")
    for nombre, antes, despues in tocados:
        print(f"  {nombre:<30} {antes:<18} → {despues} (94%)")
    print("\nGuardados." if ESCRIBIR else "\nCorré con --escribir para guardarlos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
