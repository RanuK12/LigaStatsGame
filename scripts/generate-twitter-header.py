#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1500, 500
img = Image.new("RGBA", (W, H), (6, 13, 26, 255))
draw = ImageDraw.Draw(img)

# Fondo con degradado diagonal oscuro y elegante (estilo UI de Gambeta)
for y in range(H):
    r = int(6 + (14 - 6) * (y / H))
    g = int(13 + (26 - 13) * (y / H))
    b = int(26 + (50 - 26) * (y / H))
    draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

# Banda celeste y blanca en diagonal al costado
stripe_draw = ImageDraw.Draw(img)
for i in range(120):
    alpha = int(40 * (1 - i / 120))
    stripe_draw.rectangle([W - 400 + i * 3, 0, W - 350 + i * 3, H], fill=(116, 172, 223, alpha))

# Resplandor azul/celeste central (#74ACDF)
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
glow_draw.ellipse([W//2 - 400, H//2 - 250, W//2 + 400, H//2 + 250], fill=(116, 172, 223, 35))
glow = glow.filter(ImageFilter.GaussianBlur(80))
img.paste(glow, (0, 0), glow)

# Cargar fuentes del sistema
try:
    font_title = ImageFont.truetype("/System/Library/Fonts/Supplemental/Futura.ttc", 110, index=1)
    font_sub = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 34)
    font_pills = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 22)
    font_domain = ImageFont.truetype("/System/Library/Fonts/Supplemental/Futura.ttc", 28)
except Exception:
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_pills = ImageFont.load_default()
    font_domain = ImageFont.load_default()

# 1. Badge superior "OFICIAL"
badge_text = "⚽ GAMBETA · EL JUEGO #1 DEL FÚTBOL ARGENTINO"
draw.rectangle([100, 70, 620, 105], fill=(116, 172, 223, 40), outline=(116, 172, 223, 120), width=1)
draw.text((120, 77), badge_text, fill=(116, 172, 223), font=font_pills)

# 2. Título principal "GAMBETA" en blanco resplandeciente
# Sombra
draw.text((104, 134), "GAMBETA", fill=(0, 0, 0, 180), font=font_title)
# Texto
draw.text((100, 130), "GAMBETA", fill=(255, 255, 255), font=font_title)

# 3. Subtítulo en Dorado (#F6C750)
draw.text((100, 260), "ARMÁ TU 11 IDEAL · MODO CARRERA 15 AÑOS · RETO DIARIO", fill=(246, 199, 80), font=font_sub)

# 4. Tarjetas / Pills de modos de juego
pills = [
    ("🏆 Planteles Reales '94 a Hoy", (30, 58, 138)),
    ("🔥 Ruleta de Leyendas", (16, 185, 129)),
    ("📊 Probabilidades Reales", (217, 119, 6)),
    ("⚡ 100% Gratis en Navegador", (147, 51, 234)),
]

start_x = 100
start_y = 330
for label, col in pills:
    bbox = font_pills.getbbox(label)
    w_pill = bbox[2] - bbox[0] + 30
    draw.rounded_rectangle([start_x, start_y, start_x + w_pill, start_y + 42], radius=12, fill=(col[0], col[1], col[2], 60), outline=(col[0], col[1], col[2], 180), width=1)
    draw.text((start_x + 15, start_y + 9), label, fill=(255, 255, 255), font=font_pills)
    start_x += w_pill + 16

# 5. Dominio inferior derecho
draw.rectangle([100, 410, 480, 455], fill=(246, 199, 80, 255))
draw.text((120, 416), "🎮 gambetafutbol.games", fill=(6, 13, 26), font=font_domain)

# Guardar en public/social/ y ~/.ranukita/
out_public = "/Users/emilioranucoli/Desktop/Oficina_Ranuk/LigaStatsGame/public/social/gambeta_twitter_header.png"
out_home = os.path.expanduser("~/.ranukita/gambeta_twitter_header.png")

os.makedirs(os.path.dirname(out_public), exist_ok=True)
img.save(out_public, "PNG")
img.save(out_home, "PNG")

print(f"✅ Portada generada con éxito:\n - {out_public}\n - {out_home}")
