#!/usr/bin/env python3
"""Generate SVG logos for Argentine football clubs + AFA."""
import json, os
BASE = os.path.dirname(os.path.abspath(__file__))
CLUBS_DIR = os.path.join(BASE, '..', 'public', 'logos', 'clubs')
AFA_DIR = os.path.join(BASE, '..', 'public', 'logos', 'afa')
os.makedirs(CLUBS_DIR, exist_ok=True)
os.makedirs(AFA_DIR, exist_ok=True)

with open(os.path.join(BASE, '..', 'data', 'clubs.json')) as f:
    clubs = json.load(f)

def initials(name, short):
    if len(short) <= 3: return short.upper()
    words = name.split()
    if len(words) >= 2: return (words[0][0] + words[-1][0]).upper()
    return short[:2].upper()

def club_svg(c):
    name = c.get('name', c.get('id', '?'))
    short = c.get('shortName', name[:4])
    colors = c.get('colors', ['#334155', '#ffffff'])
    pri = colors[0] if len(colors) > 0 else '#334155'
    sec = colors[1] if len(colors) > 1 else '#ffffff'
    ini = initials(name, short)
    # Determine text color for contrast
    text_color = '#ffffff'
    if pri.upper() in ['#FFFFFF', '#FEDD00', '#FFFDE7', '#FFF8E1']:
        text_color = '#1a1a2e'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <clipPath id="clip-{c['id']}"><circle cx="60" cy="60" r="56"/></clipPath>
    <linearGradient id="bg-{c['id']}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{pri}"/>
      <stop offset="100%" stop-color="{sec}"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="{sec}" stroke="{pri}" stroke-width="3"/>
  <circle cx="60" cy="60" r="54" fill="url(#bg-{c['id']})"/>
  <text x="60" y="68" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="{text_color}">{ini}</text>
</svg>'''

# Generate club SVGs
count = 0
for c in clubs:
    svg = club_svg(c)
    path = os.path.join(CLUBS_DIR, f"{c['id']}.svg")
    with open(path, 'w') as f:
        f.write(svg)
    count += 1
print(f"Generated {count} club SVGs")

# AFA logo - light blue and white shield
afa_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" width="120" height="140">
  <defs><linearGradient id="afa-bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#75AADB"/><stop offset="50%" stop-color="#FFFFFF"/>
    <stop offset="50%" stop-color="#75AADB"/><stop offset="100%" stop-color="#FFFFFF"/>
  </linearGradient></defs>
  <path d="M60 5 L110 30 L110 90 Q110 130 60 138 Q10 130 10 90 L10 30 Z" fill="url(#afa-bg)" stroke="#1a1a2e" stroke-width="3"/>
  <path d="M60 5 L110 30 L110 90 Q110 130 60 138 Q10 130 10 90 L10 30 Z" fill="none" stroke="#FEDD00" stroke-width="2"/>
  <text x="60" y="85" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="bold" fill="#1a1a2e">AFA</text>
</svg>'''
with open(os.path.join(AFA_DIR, 'afa.svg'), 'w') as f:
    f.write(afa_svg)

# Liga Profesional - golden trophy style
liga_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect x="5" y="5" width="110" height="110" rx="16" fill="#1a1a3e"/>
  <rect x="8" y="8" width="104" height="104" rx="14" fill="none" stroke="#FEDD00" stroke-width="2"/>
  <path d="M40 35 Q60 20 80 35 L75 70 Q60 80 45 70 Z" fill="#FEDD00" opacity="0.9"/>
  <rect x="52" y="70" width="16" height="15" rx="2" fill="#FEDD00"/>
  <rect x="42" y="85" width="36" height="8" rx="3" fill="#FEDD00"/>
  <text x="60" y="108" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#FEDD00">LPF</text>
</svg>'''
with open(os.path.join(AFA_DIR, 'liga.svg'), 'w') as f:
    f.write(liga_svg)

print("Generated AFA + Liga SVGs")
print(f"Total: {count + 2} logos")
