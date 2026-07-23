#!/usr/bin/env python3
"""
recalibrate_ovr.py — Recalibración de OVR para Draft Tres Estrellas
=====================================================================
Redistribuye los ratings de los 4.095 jugadores para eliminar
la concentración artificial en el rango 50-55 y crear una curva
realista inspirada en FIFA/EA FC.
"""
import json
import os
import sys
from collections import Counter

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
PLAYERS_FILE = os.path.join(DATA_DIR, 'players.json')
SQUADS_FILE = os.path.join(DATA_DIR, 'squads.json')
CLUBS_FILE = os.path.join(DATA_DIR, 'clubs.json')

# ═══════════════════════════════════════════════════════════════
# RATING TIERS (FIFA-Inspired)
# ═══════════════════════════════════════════════════════════════
# Ícono Mundial:      93-98  (Messi, Maradona)
# Leyenda:            89-92  (Passarella, Riquelme, Zanetti)
# Élite Argentina:    84-88  (Mascherano, Crespo, Palermo)
# Figura de era:      78-83  (Armani, Borja, Quintero)
# Titular consolid:   72-77  (Titulares de primera línea)
# Titular rotación:   67-71  (Titulares medianos, suplentes grandes)
# Suplente/Juvenil:   60-66  (Banco, juveniles pocos partidos)
# Reserva:            55-59  (Relleno planteles históricos)
# Juvenil base:       50-54  (Datos mínimos)

# Clubes grandes (boost +3)
BIG_CLUBS = {
    'river-plate', 'boca-juniors', 'racing', 'independiente', 'san-lorenzo'
}
# Clubes medianos-grandes (boost +2)
MED_CLUBS = {
    'velez', 'newells', 'rosario-central', 'estudiantes-lp', 'huracan',
    'gimnasia-lp', 'argentinos-jrs', 'lanus', 'banfield', 'talleres',
    'defensa-y-justicia', 'colon', 'union', 'belgrano', 'godoy-cruz',
    'atletico-tucuman'
}

# Position bonus (certain positions tend to have higher OVR in FIFA)
POS_BONUS = {
    'GK': 2, 'CB': 1, 'ST': 1, 'CF': 1, 'CAM': 1,
    'CDM': 0, 'CM': 0, 'LW': 0, 'RW': 0,
    'LB': 0, 'RB': 0, 'LM': 0, 'RM': 0, 'LWB': 0, 'RWB': 0
}

# ═══════════════════════════════════════════════════════════════
# KNOWN PLAYERS WITH FIXED OVR (manually verified against FIFA/EA FC)
# ═══════════════════════════════════════════════════════════════
# Key: player ID substring -> target OVR
# These override the algorithm for well-known players
KNOWN_RATINGS = {
    # Íconos
    'lionel-messi': 98,
    'diego-armando-maradona': 97,
    # Leyendas Tier 1
    'gabriel-batistuta': 93,
    'daniel-passarella': 92,
    'javier-zanetti': 91,
    'juan-roman-riquelme': 91,
    'mario-kempes': 91,
    'ubaldo-fillol': 90,
    # Leyendas Tier 2
    'roberto-perfumo': 89,
    'fernando-redondo': 89,
    'juan-sebastian-veron': 89,
    'ricardo-bochini': 89,
    'carlos-tevez': 89,
    'enzo-francescoli': 89,
    # Leyendas Tier 3
    'amadeo-carrizo': 88,
    'jose-luis-chilavert': 88,
    'oscar-ruggeri': 88,
    'roberto-ayala': 88,
    'walter-samuel': 88,
    'javier-mascherano': 88,
    'hernan-crespo': 88,
    'diego-simeone': 87,
    'martin-palermo': 87,
    'hugo-gatti': 85,
    'nery-pumpido': 84,
    'roberto-abbondanzieri': 84,
    'sergio-goycochea': 83,
    # Estrellas modernas (EA FC 25 inspired)
    'emiliano-martinez': 89,
    'cristian-romero': 87,
    'nicolas-otamendi': 84,
    'juan-pablo-sorin': 85,
    'javier-pastore': 82,
    'edinson-cavani': 84,
    'sergio-romero': 82,
    'nicolas-tagliafico': 82,
    'miguel-borja': 80,
    'marcos-acuna': 82,
    'franco-armani': 82,
    'juan-fernando-quintero': 81,
    'german-pezzella': 81,
    'miguel-merentiel': 80,
    'pol-fernandez': 79,
    'ever-banega': 81,
    'manuel-lanzini': 80,
    'ignacio-fernandez': 80,
    'lucas-pratto': 79,
    'exequiel-palacios': 81,
    'gonzalo-montiel': 80,
    'lucas-martinez-quarta': 79,
    # Figuras históricas de planteles (River 2015, Boca campeón, etc.)
    'leonardo-ponzio': 76,
    'gonzalo-martinez': 80,
    'sebastian-driussi': 78,
    'lucas-alario': 79,
    'rodrigo-mora': 76,
    'javier-saviola': 82,
    'jonatan-maidana': 75,
    'camilo-mayada': 72,
    'matias-kranevitter': 76,
    'guido-rodriguez': 80,
    'eder-alvarez-balanta': 74,
    'emanuel-mammana': 73,
    'carlos-sanchez': 74,
    'augusto-solari': 73,
    'leonardo-pisculichi': 76,
    'jose-sand': 80,
    'pablo-guinazu': 79,
    'braian-romero': 78,
    'claudio-aquino': 79,
    'sebastian-blanco': 78,
    'ramon-abila': 78,
    'ezequiel-cerutti': 77,
    'adrian-martinez': 79,
    'enrique-bologna': 68,
}


def get_club_boost(player):
    """Determine club boost based on the player's club affiliations."""
    boost = 0
    for club in player.get('clubs', []):
        cid = club.get('id', '')
        if cid in BIG_CLUBS:
            boost = max(boost, 3)
        elif cid in MED_CLUBS:
            boost = max(boost, 2)
        else:
            boost = max(boost, 1)
    return boost


def get_career_boost(player):
    """Boost based on career stats — goals, caps, trophies."""
    boost = 0
    # International career
    caps = player.get('capsNationalTeam', 0)
    intl_goals = player.get('goalsNationalTeam', 0)
    if caps >= 50:
        boost += 3
    elif caps >= 20:
        boost += 2
    elif caps >= 5:
        boost += 1

    if intl_goals >= 10:
        boost += 2
    elif intl_goals >= 3:
        boost += 1

    # Club career
    club_goals = player.get('goalsClub', 0)
    club_assists = player.get('assistsClub', 0)
    club_caps = player.get('capsClub', 0)

    if club_goals >= 100:
        boost += 3
    elif club_goals >= 50:
        boost += 2
    elif club_goals >= 20:
        boost += 1

    if club_assists >= 50:
        boost += 2
    elif club_assists >= 20:
        boost += 1

    if club_caps >= 300:
        boost += 2
    elif club_caps >= 150:
        boost += 1

    # Trophies
    trophies = player.get('trophies', [])
    if len(trophies) >= 5:
        boost += 3
    elif len(trophies) >= 3:
        boost += 2
    elif len(trophies) >= 1:
        boost += 1

    return min(boost, 12)  # Cap total career boost


def recalibrate_rating(player):
    """Calculate new OVR for a player."""
    pid = player['id']
    old_rating = player.get('rating', 50)
    is_legendary = player.get('legendary', False)

    # Check if player has a known fixed rating
    for known_key, known_ovr in KNOWN_RATINGS.items():
        if known_key in pid:
            return known_ovr

    # Legends keep their current (already good) ratings
    if is_legendary:
        return old_rating

    # Players already rated 78+ were likely manually set — keep with minor adjustment
    if old_rating >= 78:
        return old_rating

    # For the mass of 50-77 rated players, apply formula
    pos = player.get('position', 'CM')
    pos_bonus = POS_BONUS.get(pos, 0)
    club_boost = get_club_boost(player)
    career_boost = get_career_boost(player)

    # Base recalibration: spread the 50-55 cluster across 55-72
    if old_rating <= 55:
        # These were the generic/auto-generated players
        # Base: 55 + career differentiation
        base_new = 55 + (old_rating - 50) * 1.5  # 50->55, 55->62.5
        new_rating = base_new + pos_bonus + club_boost * 0.6 + career_boost * 0.8
    elif old_rating <= 65:
        # Mid-tier players
        base_new = 60 + (old_rating - 55) * 1.2  # 55->60, 65->72
        new_rating = base_new + pos_bonus * 0.5 + club_boost * 0.4 + career_boost * 0.6
    elif old_rating <= 77:
        # Already decent players — minor adjustment
        new_rating = old_rating + career_boost * 0.3 + club_boost * 0.2
    else:
        new_rating = old_rating

    # Clamp to valid range
    new_rating = max(50, min(92, round(new_rating)))

    # Ensure non-legendary never exceeds 88
    if not is_legendary and new_rating > 88:
        new_rating = 88

    return new_rating


def main():
    print("=" * 60)
    print("  RECALIBRACIÓN DE OVR — Draft Tres Estrellas")
    print("=" * 60)

    with open(PLAYERS_FILE, 'r') as f:
        players = json.load(f)

    print(f"\nTotal jugadores: {len(players)}")

    # Pre-fix: Mark Messi and Maradona as legendary
    for p in players:
        if 'lionel-messi' in p['id'] or 'diego-armando-maradona' in p['id']:
            if not p.get('legendary', False):
                print(f"  → Marcando {p['name']} como legendary=true")
                p['legendary'] = True

    # Collect stats
    changes = []
    unchanged = 0

    for p in players:
        old_rating = p.get('rating', 50)
        new_rating = recalibrate_rating(p)

        if new_rating != old_rating:
            changes.append({
                'id': p['id'],
                'name': p['name'],
                'position': p['position'],
                'old': old_rating,
                'new': new_rating,
                'diff': new_rating - old_rating
            })
            p['rating'] = new_rating
        else:
            unchanged += 1

    # Sort changes by magnitude
    changes.sort(key=lambda c: -abs(c['diff']))

    print(f"\nJugadores modificados: {len(changes)}")
    print(f"Sin cambios: {unchanged}")

    # Show distribution before/after
    print("\n" + "=" * 60)
    print("  DISTRIBUCIÓN DE RATINGS")
    print("=" * 60)

    ratings = [p['rating'] for p in players]
    print(f"\n  Rango: {min(ratings)} - {max(ratings)}")
    print(f"  Promedio: {sum(ratings)/len(ratings):.1f}")
    print(f"  Mediana: {sorted(ratings)[len(ratings)//2]}")

    print("\n  Distribución por rango:")
    for bracket in range(50, 100, 5):
        count = sum(1 for r in ratings if bracket <= r < bracket + 5)
        bar = '█' * (count // 20)
        pct = count / len(ratings) * 100
        print(f"    {bracket:2d}-{bracket+4:2d}: {count:4d} ({pct:5.1f}%) {bar}")

    # Show biggest changes
    print("\n" + "=" * 60)
    print("  MAYORES CAMBIOS (Top 30)")
    print("=" * 60)
    for c in changes[:30]:
        arrow = "↑" if c['diff'] > 0 else "↓"
        print(f"  {c['name']:30s} {c['position']:4s}  {c['old']:3d} → {c['new']:3d}  ({arrow}{abs(c['diff']):+d})")

    # Verify legends are still top-tier
    print("\n" + "=" * 60)
    print("  LEYENDAS (verificación)")
    print("=" * 60)
    legends = sorted([p for p in players if p.get('legendary')], key=lambda x: -x['rating'])
    for l in legends:
        print(f"  {l['name']:30s} {l['position']:4s}  OVR={l['rating']}")

    # Save
    with open(PLAYERS_FILE, 'w') as f:
        json.dump(players, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Guardado en {PLAYERS_FILE}")
    print("=" * 60)


if __name__ == '__main__':
    main()
