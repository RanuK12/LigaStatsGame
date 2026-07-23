#!/usr/bin/env python3
"""
recalibrate_ovr_contextual.py — Recalibración Contextual y Jerárquica Exacta de OVR
=====================================================================================
Ajusta la base de datos de jugadores y planteles de acuerdo a:
 1. La jerarquía del club (5 Grandes vs Tradicionales vs Modestos)
 2. El rendimiento histórico real del equipo en ese año (Campeones de Libertadores, Liga, Copa, Subcampeones, Descenso)
 3. El mérito individual del jugador (Goleadores, Leyendas, Selección, MVPs)
"""
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
PLAYERS_FILE = os.path.join(DATA_DIR, 'players.json')
SQUADS_FILE = os.path.join(DATA_DIR, 'squads.json')
CLUBS_FILE = os.path.join(DATA_DIR, 'clubs.json')

# ═══════════════════════════════════════════════════════════════
# 1. JERARQUÍA DE CLUBES (Exact squad clubIds)
# ═══════════════════════════════════════════════════════════════
BIG_FIVE = {'river-plate', 'boca-juniors', 'racing-club', 'independiente', 'san-lorenzo'}

TIER_2_CLUBS = {
    'velez', 'estudiantes-lp', 'rosario-central', 'newells', 'lanus', 'huracan',
    'argentinos-jrs', 'talleres-cba', 'belgrano', 'colon', 'union-sf', 'gimnasia-lp',
    'godoy-cruz', 'defensa-y-justicia', 'banfield', 'atl-tucuman'
}

TIER_3_CLUBS = {
    'tigre', 'platense', 'instituto', 'central-cordoba', 'barracas-central',
    'riestra', 'independiente-rivadavia', 'aldosivi', 'sarmiento-j', 'patronato', 'arsenal'
}

# ═══════════════════════════════════════════════════════════════
# 2. SEASONS DE EXCELENCIA HISTÓRICA (CAMPEONES & GRANDES TEMPORADAS)
# ═══════════════════════════════════════════════════════════════
HISTORICAL_SQUAD_TARGETS = {
    # River Plate
    ('river-plate', '2015'): 85,  # Campeón Libertadores & Recopa
    ('river-plate', '2018'): 87,  # Campeón Libertadores Madrid vs Boca
    ('river-plate', '2019'): 86,  # Finalista Libertadores, Campeón Copa Arg
    ('river-plate', '2021'): 85,  # Campeón Liga Profesional
    ('river-plate', '2023'): 84,  # Campeón Liga Profesional
    ('river-plate', '2024'): 84,
    ('river-plate', '2025'): 85,  # Plantel Gallardo 2025
    ('river-plate', '2026'): 85,

    # Boca Juniors
    ('boca-juniors', '2015'): 85,  # Campeón Primera División & Copa Arg
    ('boca-juniors', '2018'): 86,  # Finalista Libertadores & Campeón Superliga
    ('boca-juniors', '2020'): 84,  # Campeón Superliga
    ('boca-juniors', '2022'): 84,  # Campeón Liga & Copa LPF
    ('boca-juniors', '2025'): 84,
    ('boca-juniors', '2026'): 84,

    # Racing Club
    ('racing-club', '2014'): 83,  # Campeón Primera División
    ('racing-club', '2019'): 85,  # Campeón Superliga 2018/19 (Coudet, Licha López)
    ('racing-club', '2024'): 85,  # Campeón Copa Sudamericana 2024 (Maravilla Martínez, Costas)
    ('racing-club', '2025'): 83,
    ('racing-club', '2026'): 83,

    # Independiente
    ('independiente', '2017'): 84,  # Campeón Sudamericana Maracaná (Tagliafico, Barco)
    ('independiente', '2018'): 81,
    ('independiente', '2025'): 79,
    ('independiente', '2026'): 79,

    # San Lorenzo
    ('san-lorenzo', '2014'): 84,  # Campeón Libertadores
    ('san-lorenzo', '2015'): 82,  # Subcampeón Primera
    ('san-lorenzo', '2025'): 78,
    ('san-lorenzo', '2026'): 78,

    # Vélez Sarsfield
    ('velez', '2024'): 84,  # Campeón Liga Profesional 2024 (Aquino, Braian Romero)
    ('velez', '2025'): 80,
    ('velez', '2026'): 80,

    # Estudiantes LP
    ('estudiantes-lp', '2009'): 85,  # Campeón Libertadores
    ('estudiantes-lp', '2024'): 83,  # Campeón Copa LPF 2024 (Enzo Pérez, Ascacibar)
    ('estudiantes-lp', '2025'): 80,
    ('estudiantes-lp', '2026'): 80,

    # Rosario Central
    ('rosario-central', '2015'): 82,  # Subcampeón Copa Arg / Ruben
    ('rosario-central', '2016'): 82,  # Cuartos Libertadores / Lo Celso
    ('rosario-central', '2023'): 83,  # Campeón Copa LPF 2023 (Malcorra, Campaz)
    ('rosario-central', '2025'): 79,
    ('rosario-central', '2026'): 79,

    # Lanús
    ('lanus', '2016'): 84,  # Campeón Primera División 4-0
    ('lanus', '2017'): 83,  # Finalista Libertadores
    ('lanus', '2025'): 78,
    ('lanus', '2026'): 78,

    # Colón
    ('colon', '2021'): 83,  # Campeón Copa LPF 2021 (Pulga Rodríguez)
    ('colon', '2025'): 75,
    ('colon', '2026'): 75,

    # Defensa y Justicia
    ('defensa-y-justicia', '2020'): 83,  # Campeón Sudamericana & Recopa
    ('defensa-y-justicia', '2021'): 82,

    # Tigre
    ('tigre', '2019'): 81,  # Campeón Copa Superliga vs Boca (Montillo)

    # Talleres de Córdoba
    ('talleres-cba', '2021'): 81,  # Subcampeón Copa Arg & Liga
    ('talleres-cba', '2023'): 82,  # Subcampeón Liga (Garro, Valoyes, Santos)
    ('talleres-cba', '2025'): 79,
    ('talleres-cba', '2026'): 79,

    # Belgrano
    ('belgrano', '2022'): 78,  # Campeón Primera Nacional (Vegetti)
    ('belgrano', '2023'): 78,  # Clasificado Sudamericana (Passerini)
    ('belgrano', '2025'): 76,
    ('belgrano', '2026'): 76,

    # Huracán
    ('huracan', '2015'): 80,  # Finalista Sudamericana & Campeón Copa Arg
    ('huracan', '2024'): 79,
    ('huracan', '2025'): 77,
    ('huracan', '2026'): 77,

    # Modestos
    ('platense', '2023'): 78,  # Finalista Copa LPF
    ('platense', '2025'): 73,
    ('platense', '2026'): 73,
    ('aldosivi', '2025'): 70,
    ('aldosivi', '2026'): 70,
    ('riestra', '2025'): 70,
    ('riestra', '2026'): 70,
    ('barracas-central', '2025'): 71,
    ('barracas-central', '2026'): 71,
    ('sarmiento-j', '2025'): 71,
    ('sarmiento-j', '2026'): 71,
    ('central-cordoba', '2024'): 76,  # Subcampeón Copa Arg
    ('central-cordoba', '2025'): 71,
    ('central-cordoba', '2026'): 71,
    ('independiente-rivadavia', '2025'): 71,
    ('independiente-rivadavia', '2026'): 71,
}

# ═══════════════════════════════════════════════════════════════
# 3. JUGADORES CLAVE CON RATINGS ESPECÍFICOS E IMPROBABLES DE IGUALAR
# ═══════════════════════════════════════════════════════════════
PLAYER_OVERRIDES = {
    # Íconos Mundiales
    'messi-lionel': 98,
    'maradona-diego': 97,
    'batistuta-gabriel': 93,
    'daniel-passarella': 92,
    'javier-zanetti': 91,
    'juan-roman-riquelme': 91,
    'mario-kempes': 91,
    'ubaldo-fillol': 90,
    'di-maria-angel': 90,
    'roberto-perfumo': 89,
    'fernando-redondo': 89,
    'juan-sebastian-veron': 89,
    'ricardo-bochini': 89,
    'carlos-tevez': 89,
    'enzo-francescoli': 89,
    'amadeo-carrizo': 88,
    'emiliano-martinez': 89,
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

    # Figuras Consagradas
    'cristian-romero': 87,
    'nicolas-otamendi': 85,
    'juan-pablo-sorin': 85,
    'edinson-cavani': 85,
    'marcos-acuna': 84,
    'franco-armani': 84,
    'sergio-romero': 83,
    'nicolas-tagliafico': 83,
    'miguel-borja': 83,
    'juan-fernando-quintero': 84,
    'german-pezzella': 83,
    'miguel-merentiel': 83,
    'maravilla-martinez': 85,  # Adrian Martinez Racing 2024 goleador Sudamericana
    'braian-romero': 83,      # Velez 2024 goleador
    'claudio-aquino': 84,     # Velez 2024 MVP
    'lisandro-lopez': 85,     # Racing 2019 goleador
    'marco-ruben': 84,        # Central 2015 goleador
    'jose-sand': 84,          # Lanus 2016/2017 goleador
    'luis-rodriguez': 84,     # Pulga Rodriguez Colon 2021 MVP
    'pablo-perez': 80,
    'pablo-guinazu': 81,
    'gustavo-bou': 83,        # Racing 2014 goleador
    'diego-milito': 86,       # Racing 2014 ídolo
}

def get_player_base_rating(player):
    pid = player['id']

    # Exact override check
    for key, ovr in PLAYER_OVERRIDES.items():
        if key in pid:
            return ovr

    if player.get('legendary'):
        return max(player.get('rating', 85), 85)

    caps = player.get('capsNationalTeam', 0)
    intl_goals = player.get('goalsNationalTeam', 0)
    club_goals = player.get('goalsClub', 0)
    trophies = len(player.get('trophies', []))

    score = 70.0
    if caps >= 30: score += 5
    elif caps >= 10: score += 3
    elif caps >= 1: score += 1

    if intl_goals >= 5: score += 2
    if club_goals >= 80: score += 4
    elif club_goals >= 40: score += 2
    elif club_goals >= 15: score += 1

    if trophies >= 4: score += 3
    elif trophies >= 1: score += 1

    clubs = player.get('clubs', [])
    club_ids = [c.get('id', '') for c in clubs] if clubs else []

    if any(cid in BIG_FIVE for cid in club_ids):
        score += 3
    elif any(cid in TIER_2_CLUBS for cid in club_ids):
        score += 1.0
    else:
        score -= 2.0

    return round(score)

def recalibrate_all():
    with open(PLAYERS_FILE, 'r') as f:
        players = json.load(f)
    with open(SQUADS_FILE, 'r') as f:
        squads = json.load(f)

    pmap = {p['id']: p for p in players}

    # Step 1: Assign baseline rating
    player_ratings = {}
    for p in players:
        player_ratings[p['id']] = get_player_base_rating(p)

    # Step 2: Adjust player ratings based on Squad Target Context
    for sq in squads:
        club_id = sq.get('clubId', '')
        season = str(sq.get('season', ''))
        target_avg = HISTORICAL_SQUAD_TARGETS.get((club_id, season))

        if not target_avg:
            if club_id in BIG_FIVE:
                target_avg = 83 if season in ['2025', '2026'] else 82
            elif club_id in TIER_2_CLUBS:
                target_avg = 76 if season in ['2025', '2026'] else 75
            else:
                target_avg = 70 if season in ['2025', '2026'] else 69

        squad_pids = [pid for pid in sq['playerIds'] if pid in pmap]
        if not squad_pids:
            continue

        current_ratings = [player_ratings[pid] for pid in squad_pids]
        curr_avg = sum(current_ratings) / len(current_ratings)
        diff = target_avg - curr_avg

        for pid in squad_pids:
            p = pmap[pid]
            is_fixed = any(k in pid for k in PLAYER_OVERRIDES.keys()) or p.get('legendary')
            if not is_fixed:
                player_ratings[pid] = round(max(63, min(87, player_ratings[pid] + diff * 0.75)))

    # Step 3: Apply updated ratings back to player objects
    for p in players:
        new_r = player_ratings[p['id']]
        if 'messi-lionel' in p['id']: new_r = 98
        elif 'maradona-diego' in p['id']: new_r = 97
        elif 'batistuta-gabriel' in p['id']: new_r = 93
        elif p.get('legendary'): new_r = max(85, new_r)

        p['rating'] = new_r

    # Save
    with open(PLAYERS_FILE, 'w') as f:
        json.dump(players, f, indent=2, ensure_ascii=False)

    print("✅ Recalibración contextual exacta completada con éxito.")

if __name__ == '__main__':
    recalibrate_all()
