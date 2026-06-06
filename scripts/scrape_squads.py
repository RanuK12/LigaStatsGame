#!/usr/bin/env python3
"""
Scrape real squad data from Transfermarkt for Argentine clubs + national team.
Produces data/players.json and data/squads.json with squad-by-year model.
Supports current season + historical seasons via URL parameter.
"""
import json, re, sys, time, os, hashlib
import urllib.request, urllib.error
from html import unescape

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, '..', 'data')
CACHE_DIR = os.path.join(DATA_DIR, 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
}
RATE_LIMIT = 3.0  # seconds between requests

POS_MAP = {
    'Goalkeeper': 'GK', 'Centre-Back': 'CB', 'Left-Back': 'LB', 'Right-Back': 'RB',
    'Defensive Midfield': 'CDM', 'Central Midfield': 'CM', 'Attacking Midfield': 'CAM',
    'Left Winger': 'LW', 'Right Winger': 'RW', 'Centre-Forward': 'ST', 'Second Striker': 'CF',
}

# Club IDs on Transfermarkt
CLUBS = {
    'river-plate': ('River Plate', 132, 'Millonarios'),
    'boca-juniors': ('Boca Juniors', 189, 'Xeneizes'),
    'independiente': ('Independiente', 585, 'El Rojo'),
    'racing-club': ('Racing Club', 5, 'La Academia'),
    'san-lorenzo': ('San Lorenzo', 102, 'Cuervos'),
    'estudiantes-lp': ('Estudiantes LP', 113, 'Pincha'),
    'gimnasia-lp': ('Gimnasia LP', 108, 'El Lobo'),
    'newells-old-boys': ("Newell's Old Boys", 106, 'La Lepra'),
    'banfield': ('Banfield', 109, 'El Taladro'),
    'lanus': ('Lanús', 110, 'Granate'),
    'colon': ('Colón', 105, 'Sabalero'),
    'velez-sarsfield': ('Vélez Sarsfield', 101, 'El Fortín'),
    'defensa-y-justicia': ('Defensa y Justicia', 403, 'Halcón'),
    'argentinos-juniors': ('Argentinos Juniors', 62, 'Bichito'),
    'talleres-cba': ('Talleres', 115, 'Albiazul'),
    'belgrano': ('Belgrano', 114, 'Pirata'),
    'platense': ('Platense', 116, 'El Calma'),
    'sarmiento-j': ('Sarmiento', 406, 'Verde'),
    'barracas-central': ('Barracas Central', 409, 'Guapo'),
    'union-sf': ('Unión SF', 117, 'Tatengue'),
    'huracan': ('Huracán', 103, 'Globo'),
    'tigre': ('Tigre', 119, 'Matador'),
    'instituto-cba': ('Instituto', 107, 'Glorioso'),
    'godoy-cruz': ('Godoy Cruz', 120, 'Tomba'),
    'atl-tucuman': ('Atlético Tucumán', 104, 'Decano'),
    'central-cordoba-se': ('Central Córdoba SE', 410, 'Ferroviario'),
    'riestra': ('Riestra', 5548, 'Mi Bombonera'),
    'argentina': ('Argentina', None, 'La Albiceleste'),
}

# Selección Argentina tournaments
NATIONAL_TOURNAMENTS = [
    ('argentina', '1978', 'Mundial 1978', 'Copa del Mundo', 991),
    ('argentina', '1986', 'Mundial 1986', 'Copa del Mundo', 992),
    ('argentina', '1990', 'Mundial 1990', 'Copa del Mundo', 993),
    ('argentina', '1994', 'Mundial 1994', 'Copa del Mundo', 994),
    ('argentina', '1998', 'Mundial 1998', 'Copa del Mundo', 995),
    ('argentina', '2002', 'Mundial 2002', 'Copa del Mundo', 996),
    ('argentina', '2006', 'Mundial 2006', 'Copa del Mundo', 997),
    ('argentina', '2010', 'Mundial 2010', 'Copa del Mundo', 998),
    ('argentina', '2014', 'Mundial 2014', 'Copa del Mundo', 999),
    ('argentina', '2018', 'Mundial 2018', 'Copa del Mundo', 1000),
    ('argentina', '2022', 'Mundial 2022', 'Copa del Mundo', 1001),
    ('argentina', '2004', 'Copa América 2004', 'Copa América', 1002),
    ('argentina', '2007', 'Copa América 2007', 'Copa América', 1003),
    ('argentina', '2015', 'Copa América 2015', 'Copa América', 1004),
    ('argentina', '2016', 'Copa América Centenario', 'Copa América', 1005),
    ('argentina', '2019', 'Copa América 2019', 'Copa América', 1006),
    ('argentina', '2021', 'Copa América 2021', 'Copa América', 1007),
    ('argentina', '2024', 'Copa América 2024', 'Copa América', 1008),
]

def fetch(url, cache_key=None):
    """Fetch URL with caching, rate limiting, retries."""
    if cache_key:
        cache_path = os.path.join(CACHE_DIR, hashlib.md5(cache_key.encode()).hexdigest() + '.html')
        if os.path.exists(cache_path) and os.path.getmtime(cache_path) > time.time() - 86400 * 30:
            with open(cache_path, 'r', errors='ignore') as f:
                return f.read()
    
    time.sleep(RATE_LIMIT)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            resp = urllib.request.urlopen(req, timeout=15)
            html = resp.read().decode('utf-8', errors='ignore')
            if cache_key and len(html) > 1000:
                with open(cache_path, 'w') as f:
                    f.write(html)
            return html
        except Exception as e:
            if attempt < 2:
                time.sleep(5 * (attempt + 1))
            else:
                print(f"  FAIL: {e}", file=sys.stderr)
                return ''

def scrape_squad_page(html):
    """Parse a Transfermarkt squad page. Returns list of player dicts."""
    players = []
    
    # Find the main squad table rows
    # Transfermarkt uses table with class 'items'
    rows = re.findall(r'<tr[^>]*class="odd"[^>]*>(.*?)</tr>|<tr[^>]*class="even"[^>]*>(.*?)</tr>', html, re.DOTALL)
    if not rows:
        # Try alternative pattern
        rows_content = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL)
        rows = [(r, '') for r in rows_content if 'hauptlink' in r]