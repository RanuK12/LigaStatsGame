#!/usr/bin/env python3
"""
recalibrate_ovr.py — Recalibración de OVR Elevada (Piso 62+) para Draft Tres Estrellas
====================================================================================
Ajusta la base de jugadores para que prácticamente TODOS estén por encima de 60 OVR (piso 62),
manteniendo la competitividad alta y jerarquías realistas para fanatismo del fútbol argentino.
"""
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
PLAYERS_FILE = os.path.join(DATA_DIR, 'players.json')

BIG_CLUBS = {'river-plate', 'boca-juniors', 'racing', 'independiente', 'san-lorenzo'}
MED_CLUBS = {
    'velez', 'newells', 'rosario-central', 'estudiantes-lp', 'huracan',
    'gimnasia-lp', 'argentinos-jrs', 'lanus', 'banfield', 'talleres',
    'defensa-y-justicia', 'colon', 'union', 'belgrano', 'godoy-cruz',
    'atletico-tucuman'
}

POS_BONUS = {
    'GK': 2, 'CB': 1, 'ST': 1, 'CF': 1, 'CAM': 1,
    'CDM': 0, 'CM': 0, 'LW': 0, 'RW': 0,
    'LB': 0, 'RB': 0, 'LM': 0, 'RM': 0, 'LWB': 0, 'RWB': 0
}

KNOWN_RATINGS = {
    # Íconos Mundiales
    'messi-lionel': 98,
    'maradona-diego': 97,
    'batistuta-gabriel': 93,
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
    'nery-pumpido': 85,
    'roberto-abbondanzieri': 85,
    'sergio-goycochea': 84,
    # Estrellas de Selección & Élite
    'emiliano-martinez': 89,
    'cristian-romero': 87,
    'nicolas-otamendi': 85,
    'juan-pablo-sorin': 85,
    'javier-pastore': 84,
    'edinson-cavani': 85,
    'sergio-romero': 84,
    'nicolas-tagliafico': 84,
    'miguel-borja': 82,
    'marcos-acuna': 84,
    'franco-armani': 84,
    'juan-fernando-quintero': 83,
    'german-pezzella': 83,
    'miguel-merentiel': 83,
    'pol-fernandez': 81,
    'ever-banega': 83,
    'manuel-lanzini': 82,
    'ignacio-fernandez': 82,
    'lucas-pratto': 82,
    'exequiel-palacios': 83,
    'gonzalo-montiel': 82,
    'lucas-martinez-quarta': 81,
    # Figuras Consolidadas LPF
    'leonardo-ponzio': 79,
    'gonzalo-martinez': 82,
    'sebastian-driussi': 80,
    'lucas-alario': 81,
    'rodrigo-mora': 79,
    'javier-saviola': 84,
    'jonatan-maidana': 78,
    'camilo-mayada': 75,
    'matias-kranevitter': 79,
    'guido-rodriguez': 82,
    'eder-alvarez-balanta': 77,
    'emanuel-mammana': 76,
    'carlos-sanchez': 77,
    'augusto-solari': 76,
    'leonardo-pisculichi': 79,
    'jose-sand': 82,
    'pablo-guinazu': 81,
    'braian-romero': 80,
    'claudio-aquino': 81,
    'sebastian-blanco': 80,
    'ramon-abila': 80,
    'ezequiel-cerutti': 79,
    'adrian-martinez': 81,
    'enrique-bologna': 72,
}

def get_club_boost(player):
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
    boost = 0
    caps = player.get('capsNationalTeam', 0)
    intl_goals = player.get('goalsNationalTeam', 0)
    if caps >= 50: boost += 3
    elif caps >= 20: boost += 2
    elif caps >= 5: boost += 1

    if intl_goals >= 10: boost += 2
    elif intl_goals >= 3: boost += 1

    club_goals = player.get('goalsClub', 0)
    club_assists = player.get('assistsClub', 0)
    club_caps = player.get('capsClub', 0)

    if club_goals >= 100: boost += 3
    elif club_goals >= 50: boost += 2
    elif club_goals >= 20: boost += 1

    if club_assists >= 50: boost += 2
    elif club_assists >= 20: boost += 1

    if club_caps >= 300: boost += 2
    elif club_caps >= 150: boost += 1

    trophies = player.get('trophies', [])
    if len(trophies) >= 5: boost += 3
    elif len(trophies) >= 3: boost += 2
    elif len(trophies) >= 1: boost += 1

    return min(boost, 10)

def recalibrate_rating(player):
    pid = player['id']
    old_rating = player.get('rating', 60)
    is_legendary = player.get('legendary', False)

    for known_key, known_ovr in KNOWN_RATINGS.items():
        if known_key in pid:
            return known_ovr

    if is_legendary:
        return max(old_rating, 84)

    # Shift base rating floor to 63-65 for generic/base players
    pos = player.get('position', 'CM')
    pos_bonus = POS_BONUS.get(pos, 0)
    club_boost = get_club_boost(player)
    career_boost = get_career_boost(player)

    if old_rating <= 60:
        # Generic / reserve: 63 to 70 range
        base_new = 63 + (old_rating - 50) * 0.7 if old_rating >= 50 else 63
        new_rating = base_new + pos_bonus + club_boost * 0.8 + career_boost * 0.8
    elif old_rating <= 70:
        # Mid tier: 68 to 76 range
        base_new = 68 + (old_rating - 60) * 0.8
        new_rating = base_new + pos_bonus * 0.5 + club_boost * 0.5 + career_boost * 0.6
    elif old_rating <= 80:
        # Established starter / star: 75 to 83 range
        base_new = 75 + (old_rating - 70) * 0.8
        new_rating = base_new + career_boost * 0.4 + club_boost * 0.3
    else:
        new_rating = old_rating

    new_rating = max(62, min(90, round(new_rating)))
    if not is_legendary and new_rating > 88:
        new_rating = 88

    return new_rating

def main():
    with open(PLAYERS_FILE, 'r') as f:
        players = json.load(f)

    print(f"Total jugadores: {len(players)}")

    for p in players:
        if 'lionel-messi' in p['id'] or 'diego-armando-maradona' in p['id']:
            p['legendary'] = True

    changes = 0
    for p in players:
        old_r = p.get('rating', 60)
        new_r = recalibrate_rating(p)
        if new_r != old_r:
            changes += 1
            p['rating'] = new_r

    ratings = [p['rating'] for p in players]
    print(f"Modificados: {changes}")
    print(f"Rango final: {min(ratings)} - {max(ratings)}")
    print(f"Promedio: {sum(ratings)/len(ratings):.1f}")
    print(f"Mediana: {sorted(ratings)[len(ratings)//2]}")
    print(f"Jugadores < 60 OVR: {sum(1 for r in ratings if r < 60)}")
    print(f"Jugadores 60-64 OVR: {sum(1 for r in ratings if 60 <= r < 65)}")
    print(f"Jugadores 65-69 OVR: {sum(1 for r in ratings if 65 <= r < 70)}")
    print(f"Jugadores 70-74 OVR: {sum(1 for r in ratings if 70 <= r < 75)}")
    print(f"Jugadores 75-79 OVR: {sum(1 for r in ratings if 75 <= r < 80)}")
    print(f"Jugadores 80-84 OVR: {sum(1 for r in ratings if 80 <= r < 85)}")
    print(f"Jugadores 85+ OVR: {sum(1 for r in ratings if r >= 85)}")

    with open(PLAYERS_FILE, 'w') as f:
        json.dump(players, f, indent=2, ensure_ascii=False)

    print("✅ Actualizado players.json exitosamente.")

if __name__ == '__main__':
    main()
