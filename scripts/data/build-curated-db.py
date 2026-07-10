#!/usr/bin/env python3
"""
LigaStatsGame — Build Curated Argentine Players Database v2
══════════════════════════════════════════════════════════
Genera data/players.json y data/squads.json de forma consistente
con ~450-500 jugadores reales (leyendas + jugadores de raw_squads.txt).
"""

import json
import re
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
OUT  = ROOT / "data" / "players.json"

# Nationalities mapping for foreign players in Argentine league
NATIONALITIES = {
    'miguel borja': 'Colombia',
    'paulo diaz': 'Chile',
    'nicolas fonseca': 'Uruguay',
    'sebastian boselli': 'Uruguay',
    'agustin sant\'anna': 'Uruguay',
    'agustin santanna': 'Uruguay',
    'luis advincula': 'Peru',
    'edinson cavani': 'Uruguay',
    'miguel merentiel': 'Uruguay',
    'marcelo saracchi': 'Uruguay',
    'jorman campuzano': 'Colombia',
    'gabriel avalos': 'Paraguay',
    'mauricio isla': 'Chile',
    'felipe loyola': 'Chile',
    'adam bareiro': 'Paraguay',
    'gabriel arias': 'Chile',
    'roger martinez': 'Colombia',
    'gaston martirena': 'Uruguay',
    'juan fernando quintero': 'Colombia',
    'matias rojas': 'Paraguay',
    'ramon sosa': 'Paraguay',
    'blas armoa': 'Paraguay',
    'diego valoyes': 'Colombia',
    'michael santos': 'Uruguay',
    'salomon rondon': 'Venezuela',
    'teofilo gutierrez': 'Colombia',
    'teo gutierrez': 'Colombia',
    'enzo francescoli': 'Uruguay',
    'jose luis chilavert': 'Paraguay',
    'radamel falcao': 'Colombia',
    'alexis sanchez': 'Chile',
    'paulo silas': 'Brazil',
}

# Position formatting
POSITIONS = {
    'portero': 'GK', 'arquero': 'GK', 'gk': 'GK',
    'defensor central': 'CB', 'cb': 'CB', 'defensor': 'CB',
    'lateral izquierdo': 'LB', 'lb': 'LB',
    'lateral derecho': 'RB', 'rb': 'RB',
    'mediocampista defensivo': 'CDM', 'cdm': 'CDM',
    'mediocampista': 'CM', 'cm': 'CM', 'mediocampista central': 'CM',
    'mediocampista ofensivo': 'CAM', 'cam': 'CAM',
    'extremo izquierdo': 'LW', 'lw': 'LW',
    'extremo derecho': 'RW', 'rw': 'RW',
    'delantero': 'ST', 'st': 'ST', 'delantero centro': 'ST',
    'segundo delantero': 'CF', 'cf': 'CF'
}

def slugify(text: str) -> str:
    text = text.lower()
    for k, v in {'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u','ñ':'n',
                 'à':'a','è':'e','ì':'i','ò':'o','ù':'u'}.items():
        text = text.replace(k, v)
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return re.sub(r"\s+", "-", text.strip())

def make_id(name: str, birth_year: str) -> str:
    parts = name.split()
    last  = parts[-1] if len(parts) > 1 else parts[0]
    first = parts[0]  if len(parts) > 1 else ""
    return f"{slugify(last)}-{slugify(first)}-{birth_year}".strip("-")

def decade(birth_date: str) -> str:
    if not birth_date or len(birth_date) < 4:
        return "1990s"
    yr = int(birth_date[:4])
    return f"{(yr // 10) * 10}s"

def build(p: dict) -> dict:
    bd   = p.get("birth_date", "")
    yr   = bd[:4] if bd else "1980"
    pos  = p["position"]
    return {
        "id":               p.get("id", make_id(p["name"], yr)),
        "name":             p["name"],
        "fullName":         p.get("full_name", p["name"]),
        "birthDate":        bd or f"{yr}-01-01",
        "position":         pos,
        "positions":        p.get("positions", [pos]),
        "nationality":      p.get("nationality", "Argentina"),
        "height":           p.get("height", 1.78),
        "weight":           p.get("weight", 75),
        "preferredFoot":    p.get("foot", "Derecho"),
        "clubs":            p["clubs"],
        "capsNationalTeam": p.get("caps_nt", 0),
        "goalsNationalTeam":p.get("goals_nt", 0),
        "capsClub":         p.get("caps_club", 0),
        "goalsClub":        p.get("goals_club", 0),
        "assistsClub":      p.get("assists_club", 0),
        "trophies":         p.get("trophies", []),
        "image":            p.get("image", ""),
        "marketValue":      p.get("market_value", "0"),
        "activeYears":      p.get("active_years", ""),
        "decade":           decade(bd or f"{yr}-01-01"),
        "rating":           p.get("rating", 72),
        "legendary":        p.get("legendary", False),
    }

# ─── SEED DATA (Curated legends) ──────────────────────────────────────────────

WC78  = [{"competition":"Copa del Mundo","year":"1978","club":"Argentina"}]
WC86  = [{"competition":"Copa del Mundo","year":"1986","club":"Argentina"}]
WC22  = [{"competition":"Copa del Mundo","year":"2022","club":"Argentina"}]
CA21  = [{"competition":"Copa América",  "year":"2021","club":"Argentina"}]
FIN22 = [{"competition":"Finalissima",   "year":"2022","club":"Argentina"}]

SEED_LEGENDS = [
    # GK
    {"name":"Amadeo Carrizo","full_name":"Amadeo Raúl Carrizo","birth_date":"1926-06-12",
     "position":"GK","positions":["GK"],"foot":"Derecho","height":1.82,"weight":80,
     "caps_nt":20,"goals_nt":0,"caps_club":520,"goals_club":0,"assists_club":0,
     "clubs":[{"id":"river-plate","name":"River Plate","years":"1945-1968"},
               {"id":"millonarios","name":"Millonarios","years":"1968-1969"},
               {"id":"valencia","name":"Valencia CF","years":"1969-1970"}],
     "trophies":[{"competition":"Liga Argentina","year":"1947","club":"River Plate"}],
     "active_years":"1945-1970","rating":88,"legendary":True},

    {"name":"Hugo Gatti","full_name":"Hugo Orlando Gatti","birth_date":"1944-08-19",
     "position":"GK","positions":["GK"],"foot":"Derecho","height":1.80,"weight":78,
     "caps_nt":18,"goals_nt":0,"caps_club":650,"goals_club":0,"assists_club":0,
     "clubs":[{"id":"atlanta","name":"Atlanta","years":"1963-1967"},
               {"id":"san-lorenzo","name":"San Lorenzo","years":"1967-1969"},
               {"id":"river-plate","name":"River Plate","years":"1969-1970"},
               {"id":"colon","name":"Colón","years":"1970-1972"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"1972-1987"}],
     "trophies":[{"competition":"Copa Libertadores","year":"1977","club":"Boca Juniors"}],
     "active_years":"1962-1987","rating":85,"legendary":True},

    {"name":"Ubaldo Fillol","full_name":"Ubaldo Matildo Fillol","birth_date":"1950-07-21",
     "position":"GK","positions":["GK"],"foot":"Derecho","height":1.84,"weight":83,
     "caps_nt":60,"goals_nt":0,"caps_club":420,"goals_club":0,"assists_club":0,
     "clubs":[{"id":"river-plate","name":"River Plate","years":"1974-1985"},
               {"id":"atletico-madrid","name":"Atlético de Madrid","years":"1985-1987"},
               {"id":"racing-club","name":"Racing Club","years":"1987-1989"}],
     "trophies": WC78, "active_years":"1968-1990","rating":90,"legendary":True},

    {"name":"Nery Pumpido","full_name":"Carlos Nery Pumpido","birth_date":"1957-03-30",
     "position":"GK","positions":["GK"],"foot":"Derecho","height":1.84,"weight":82,
     "caps_nt":35,"goals_nt":0,"caps_club":350,"goals_club":0,"assists_club":0,
     "clubs":[{"id":"union-santa-fe","name":"Unión Santa Fe","years":"1976-1981"},
               {"id":"river-plate","name":"River Plate","years":"1981-1988"},
               {"id":"real-betis","name":"Real Betis","years":"1988-1994"}],
     "trophies": WC86, "active_years":"1976-1995","rating":84,"legendary":True},

    {"name":"Sergio Goycochea","full_name":"Sergio Javier Goycochea","birth_date":"1963-10-17",
     "position":"GK","positions":["GK"],"foot":"Derecho","height":1.85,"weight":82,
     "caps_nt":44,"goals_nt":0,"caps_club":320,"goals_club":0,"assists_club":0,
     "clubs":[{"id":"defensores-belgrano","name":"Defensores de Belgrano","years":"1979-1982"},
               {"id":"river-plate","name":"River Plate","years":"1983-1988"},
               {"id":"racing-club","name":"Racing Club","years":"1988-1990"},
               {"id":"millonarios","name":"Millonarios","years":"1991-1992"},
               {"id":"olimpia","name":"Olimpia","years":"1992-1993"},
               {"id":"mandiyu","name":"Deportivo Mandiyú","years":"1993-1994"},
               {"id":"newells","name":"Newell's Old Boys","years":"1997-1998"}],
     "trophies":[{"competition":"Copa América","year":"1991","club":"Argentina"}],
     "active_years":"1979-1998","rating":83,"legendary":True},

    {"name":"Germán Burgos","full_name":"Germán Adrián Burgos","birth_date":"1969-04-16",
     "position":"GK","positions":["GK"],"foot":"Derecho","height":1.87,"weight":84,
     "caps_nt":17,"goals_nt":0,"caps_club":380,"goals_club":0,"assists_club":0,
     "clubs":[{"id":"ferro","name":"Ferro Carril Oeste","years":"1989-1994"},
               {"id":"river-plate","name":"River Plate","years":"1994-1999"},
               {"id":"mallorca","name":"RCD Mallorca","years":"1999-2001"},
               {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2001-2004"}],
     "active_years":"1989-2004","rating":79,"legendary":False},

    {"name":"Roberto Abbondanzieri","full_name":"Roberto Fabián Abbondanzieri","birth_date":"1972-08-19",
     "position":"GK","positions":["GK"],"foot":"Derecho","height":1.86,"weight":88,
     "caps_nt":49,"goals_nt":0,"caps_club":430,"goals_club":0,"assists_club":0,
     "clubs":[{"id":"rosario-central","name":"Rosario Central","years":"1994-1996"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"1996-2006"},
               {"id":"getafe","name":"Getafe CF","years":"2006-2009"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"2009-2010"},
               {"id":"internacional","name":"Internacional","years":"2010-2011"}],
     "trophies":[{"competition":"Copa Libertadores","year":"2003","club":"Boca Juniors"}],
     "active_years":"1994-2011","rating":84,"legendary":True},

    {"name":"Sergio Romero","full_name":"Sergio Germán Romero","birth_date":"1987-02-22",
     "position":"GK","positions":["GK"],"foot":"Derecho","height":1.92,"weight":88,
     "caps_nt":96,"goals_nt":0,"caps_club":320,"goals_club":0,"assists_club":0,
     "clubs":[{"id":"racing-club","name":"Racing Club","years":"2006-2007"},
               {"id":"az-alkmaar","name":"AZ Alkmaar","years":"2007-2011"},
               {"id":"sampdoria","name":"Sampdoria","years":"2011-2015"},
               {"id":"manchester-united","name":"Manchester United","years":"2015-2021"},
               {"id":"venezia","name":"Venezia","years":"2021-2022"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"2022-2025"}],
     "active_years":"2006-2025","rating":83,"legendary":False},

    {"name":"Emiliano Martínez","full_name":"Emiliano Damián Martínez","birth_date":"1992-09-02",
     "position":"GK","positions":["GK"],"foot":"Derecho","height":1.95,"weight":91,
     "caps_nt":45,"goals_nt":0,"caps_club":220,"goals_club":0,"assists_club":0,
     "clubs":[{"id":"independiente","name":"Independiente","years":"2009-2010"},
               {"id":"arsenal","name":"Arsenal","years":"2010-2020"},
               {"id":"aston-villa","name":"Aston Villa","years":"2020-2025"}],
     "trophies": WC22 + CA21 + FIN22, "active_years":"2010-2025","rating":89,"legendary":False},

    {"name":"José Luis Chilavert","full_name":"José Luis Félix Chilavert González","birth_date":"1965-07-27",
     "position":"GK","positions":["GK"],"foot":"Izquierdo","height":1.88,"weight":90,
     "nationality":"Paraguay","caps_nt":74,"goals_nt":8,"caps_club":650,"goals_club":59,"assists_club":0,
     "clubs":[{"id":"san-lorenzo","name":"San Lorenzo","years":"1985-1988"},
               {"id":"real-zaragoza","name":"Real Zaragoza","years":"1988-1991"},
               {"id":"velez-sarsfield","name":"Vélez Sarsfield","years":"1991-2000"},
               {"id":"strasbourg","name":"Strasbourg","years":"2000-2002"},
               {"id":"penarol","name":"Peñarol","years":"2002-2003"}],
     "trophies":[{"competition":"Copa Libertadores","year":"1994","club":"Vélez Sarsfield"}],
     "active_years":"1982-2004","rating":88,"legendary":True},

    # DEFENDERS (CB, LB, RB)
    {"name":"Daniel Passarella","full_name":"Daniel Alberto Passarella","birth_date":"1953-05-25",
     "position":"CB","positions":["CB"],"foot":"Izquierdo","height":1.73,"weight":73,
     "caps_nt":70,"goals_nt":22,"caps_club":450,"goals_club":134,"assists_club":20,
     "clubs":[{"id":"river-plate","name":"River Plate","years":"1974-1982"},
               {"id":"fiorentina","name":"Fiorentina","years":"1982-1986"},
               {"id":"internazionale","name":"Internazionale","years":"1986-1988"},
               {"id":"river-plate","name":"River Plate","years":"1988-1989"}],
     "trophies": WC78 + WC86, "active_years":"1971-1989","rating":92,"legendary":True},

    {"name":"Oscar Ruggeri","full_name":"Oscar Alfredo Ruggeri","birth_date":"1962-01-26",
     "position":"CB","positions":["CB"],"foot":"Derecho","height":1.85,"weight":80,
     "caps_nt":97,"goals_nt":7,"caps_club":500,"goals_club":45,"assists_club":15,
     "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"1980-1984"},
               {"id":"river-plate","name":"River Plate","years":"1985-1988"},
               {"id":"real-madrid","name":"Real Madrid","years":"1988-1989"},
               {"id":"velez-sarsfield","name":"Vélez Sarsfield","years":"1990-1992"},
               {"id":"san-lorenzo","name":"San Lorenzo","years":"1994-1997"}],
     "trophies": WC86, "active_years":"1980-1997","rating":88,"legendary":True},

    {"name":"Roberto Perfumo","full_name":"Roberto Héctor Perfumo","birth_date":"1942-10-03",
     "position":"CB","positions":["CB"],"foot":"Derecho","height":1.78,"weight":75,
     "caps_nt":37,"goals_nt":0,"caps_club":420,"goals_club":15,"assists_club":5,
     "clubs":[{"id":"racing-club","name":"Racing Club","years":"1962-1971"},
               {"id":"cruzeiro","name":"Cruzeiro","years":"1971-1974"},
               {"id":"river-plate","name":"River Plate","years":"1975-1978"}],
     "active_years":"1962-1978","rating":89,"legendary":True},

    {"name":"Roberto Ayala","full_name":"Roberto Fabián Ayala","birth_date":"1973-04-14",
     "position":"CB","positions":["CB"],"foot":"Derecho","height":1.77,"weight":75,
     "caps_nt":115,"goals_nt":7,"caps_club":580,"goals_club":22,"assists_club":10,
     "clubs":[{"id":"ferro","name":"Ferro Carril Oeste","years":"1991-1994"},
               {"id":"river-plate","name":"River Plate","years":"1994-1995"},
               {"id":"napoli","name":"Napoli","years":"1995-1998"},
               {"id":"milan","name":"AC Milan","years":"1998-2000"},
               {"id":"valencia","name":"Valencia CF","years":"2000-2007"},
               {"id":"zaragoza","name":"Real Zaragoza","years":"2007-2010"},
               {"id":"racing-club","name":"Racing Club","years":"2010-2011"}],
     "trophies":[{"competition":"La Liga","year":"2002","club":"Valencia CF"}],
     "active_years":"1991-2011","rating":88,"legendary":True},

    {"name":"Walter Samuel","full_name":"Walter Adrián Luján Samuel","birth_date":"1978-03-23",
     "position":"CB","positions":["CB"],"foot":"Izquierdo","height":1.83,"weight":83,
     "caps_nt":56,"goals_nt":5,"caps_club":500,"goals_club":28,"assists_club":5,
     "clubs":[{"id":"newells","name":"Newell's Old Boys","years":"1996-1997"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"1997-2000"},
               {"id":"roma","name":"AS Roma","years":"2000-2004"},
               {"id":"real-madrid","name":"Real Madrid","years":"2004-2005"},
               {"id":"internazionale","name":"Internazionale","years":"2005-2014"},
               {"id":"basel","name":"FC Basel","years":"2014-2016"}],
     "trophies":[{"competition":"Copa Libertadores","year":"2000","club":"Boca Juniors"}],
     "active_years":"1996-2016","rating":88,"legendary":True},

    {"name":"Nicolás Otamendi","full_name":"Nicolás Hernán Gonzalo Otamendi","birth_date":"1988-02-12",
     "position":"CB","positions":["CB"],"foot":"Derecho","height":1.83,"weight":81,
     "caps_nt":119,"goals_nt":6,"caps_club":550,"goals_club":32,"assists_club":15,
     "clubs":[{"id":"velez-sarsfield","name":"Vélez Sarsfield","years":"2007-2010"},
               {"id":"porto","name":"FC Porto","years":"2010-2014"},
               {"id":"valencia","name":"Valencia CF","years":"2014-2015"},
               {"id":"manchester-city","name":"Manchester City","years":"2015-2020"},
               {"id":"benfica","name":"SL Benfica","years":"2020-2025"}],
     "trophies": WC22 + CA21 + FIN22, "active_years":"2007-2025","rating":85,"legendary":False},

    {"name":"Cristian Romero","full_name":"Cristian Gabriel Romero","birth_date":"1998-04-27",
     "position":"CB","positions":["CB"],"foot":"Derecho","height":1.85,"weight":79,
     "caps_nt":36,"goals_nt":3,"caps_club":220,"goals_club":12,"assists_club":5,
     "clubs":[{"id":"belgrano","name":"Belgrano","years":"2016-2018"},
               {"id":"genoa","name":"Genoa","years":"2018-2019"},
               {"id":"atalanta","name":"Atalanta","years":"2019-2021"},
               {"id":"tottenham","name":"Tottenham Hotspur","years":"2021-2025"}],
     "trophies": WC22 + CA21 + FIN22, "active_years":"2016-2025","rating":87,"legendary":False},

    {"name":"Javier Zanetti","full_name":"Javier Adelmar Zanetti","birth_date":"1973-08-10",
     "position":"RB","positions":["RB","CM","CDM"],"foot":"Derecho","height":1.78,"weight":75,
     "caps_nt":143,"goals_nt":5,"caps_club":858,"goals_club":21,"assists_club":65,
     "clubs":[{"id":"talleres-re","name":"Talleres (RdE)","years":"1992-1993"},
               {"id":"banfield","name":"Banfield","years":"1993-1995"},
               {"id":"internazionale","name":"Internazionale","years":"1995-2014"}],
     "trophies":[{"competition":"Champions League","year":"2010","club":"Internazionale"}],
     "active_years":"1992-2014","rating":91,"legendary":True},

    {"name":"Juan Pablo Sorín","full_name":"Juan Pablo Sorín","birth_date":"1976-05-05",
     "position":"LB","positions":["LB","LM"],"foot":"Izquierdo","height":1.71,"weight":67,
     "caps_nt":75,"goals_nt":11,"caps_club":380,"goals_club":28,"assists_club":35,
     "clubs":[{"id":"argentinos-juniors","name":"Argentinos Juniors","years":"1994-1995"},
               {"id":"juventus","name":"Juventus","years":"1995-1996"},
               {"id":"river-plate","name":"River Plate","years":"1996-2000"},
               {"id":"cruzeiro","name":"Cruzeiro","years":"2000-2002"},
               {"id":"barcelona","name":"FC Barcelona","years":"2003"},
               {"id":"paris-saint-germain","name":"Paris Saint-Germain","years":"2003-2004"},
               {"id":"villarreal","name":"Villarreal CF","years":"2004-2006"},
               {"id":"hamburg","name":"Hamburger SV","years":"2006-2008"}],
     "trophies":[{"competition":"Copa Libertadores","year":"1996","club":"River Plate"}],
     "active_years":"1994-2009","rating":85,"legendary":False},

    {"name":"Nicolás Tagliafico","full_name":"Nicolás Alejandro Tagliafico","birth_date":"1992-08-31",
     "position":"LB","positions":["LB"],"foot":"Izquierdo","height":1.72,"weight":67,
     "caps_nt":63,"goals_nt":1,"caps_club":380,"goals_club":20,"assists_club":25,
     "clubs":[{"id":"banfield","name":"Banfield","years":"2010-2014"},
               {"id":"real-murcia","name":"Real Murcia","years":"2012-2013"},
               {"id":"independiente","name":"Independiente","years":"2015-2017"},
               {"id":"ajax","name":"Ajax","years":"2018-2022"},
               {"id":"lyon","name":"Olympique Lyon","years":"2022-2025"}],
     "trophies": WC22 + CA21 + FIN22 + [{"competition":"Copa Sudamericana","year":"2017","club":"Independiente"}],
     "active_years":"2010-2025","rating":83,"legendary":False},

    # MIDFIELDERS (CDM, CM, CAM)
    {"name":"Fernando Redondo","full_name":"Fernando Carlos Redondo Neri","birth_date":"1969-06-06",
     "position":"CDM","positions":["CDM","CM"],"foot":"Izquierdo","height":1.86,"weight":79,
     "caps_nt":29,"goals_nt":1,"caps_club":320,"goals_club":12,"assists_club":20,
     "clubs":[{"id":"argentinos-juniors","name":"Argentinos Juniors","years":"1985-1990"},
               {"id":"tenerife","name":"CD Tenerife","years":"1990-1994"},
               {"id":"real-madrid","name":"Real Madrid","years":"1994-2000"},
               {"id":"milan","name":"AC Milan","years":"2000-2004"}],
     "trophies":[{"competition":"Champions League","year":"1998","club":"Real Madrid"},
                  {"competition":"Champions League","year":"2000","club":"Real Madrid"}],
     "active_years":"1985-2004","rating":89,"legendary":True},

    {"name":"Javier Mascherano","full_name":"Javier Alejandro Mascherano","birth_date":"1984-06-08",
     "position":"CDM","positions":["CDM","CB"],"foot":"Derecho","height":1.74,"weight":74,
     "caps_nt":147,"goals_nt":3,"caps_club":550,"goals_club":5,"assists_club":15,
     "clubs":[{"id":"river-plate","name":"River Plate","years":"2003-2005"},
               {"id":"corinthians","name":"Corinthians","years":"2005-2006"},
               {"id":"west-ham","name":"West Ham United","years":"2006-2007"},
               {"id":"liverpool","name":"Liverpool","years":"2007-2010"},
               {"id":"barcelona","name":"FC Barcelona","years":"2010-2018"},
               {"id":"hebei-china-fortune","name":"Hebei China Fortune","years":"2018-2019"},
               {"id":"estudiantes-lp","name":"Estudiantes LP","years":"2019-2020"}],
     "trophies":[{"competition":"Champions League","year":"2011","club":"FC Barcelona"},
                  {"competition":"Champions League","year":"2015","club":"FC Barcelona"}],
     "active_years":"2003-2020","rating":88,"legendary":True},

    {"name":"Diego Simeone","full_name":"Diego Pablo Simeone","birth_date":"1970-04-28",
     "position":"CM","positions":["CM","CDM"],"foot":"Derecho","height":1.79,"weight":75,
     "caps_nt":106,"goals_nt":11,"caps_club":510,"goals_club":84,"assists_club":30,
     "clubs":[{"id":"velez-sarsfield","name":"Vélez Sarsfield","years":"1987-1990"},
               {"id":"pisa","name":"Pisa","years":"1990-1992"},
               {"id":"sevilla","name":"Sevilla FC","years":"1992-1994"},
               {"id":"atletico-madrid","name":"Atlético de Madrid","years":"1994-1997"},
               {"id":"internazionale","name":"Internazionale","years":"1997-1999"},
               {"id":"lazio","name":"Lazio","years":"1999-2003"},
               {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2003-2005"},
               {"id":"racing-club","name":"Racing Club","years":"2005-2006"}],
     "trophies":[{"competition":"La Liga","year":"1996","club":"Atlético de Madrid"}],
     "active_years":"1987-2006","rating":87,"legendary":True},

    {"name":"Juan Sebastián Verón","full_name":"Juan Sebastián Verón","birth_date":"1975-03-09",
     "position":"CM","positions":["CM","CAM"],"foot":"Derecho","height":1.86,"weight":79,
     "caps_nt":73,"goals_nt":9,"caps_club":520,"goals_club":75,"assists_club":90,
     "clubs":[{"id":"estudiantes-lp","name":"Estudiantes LP","years":"1993-1996"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"1996"},
               {"id":"sampdoria","name":"Sampdoria","years":"1996-1998"},
               {"id":"parma","name":"Parma","years":"1998-1999"},
               {"id":"lazio","name":"Lazio","years":"1999-2001"},
               {"id":"manchester-united","name":"Manchester United","years":"2001-2003"},
               {"id":"chelsea","name":"Chelsea","years":"2003-2004"},
               {"id":"internazionale","name":"Internazionale","years":"2004-2006"},
               {"id":"estudiantes-lp","name":"Estudiantes LP","years":"2006-2014"}],
     "trophies":[{"competition":"Copa Libertadores","year":"2009","club":"Estudiantes LP"}],
     "active_years":"1993-2014","rating":89,"legendary":True},

    {"name":"Juan Román Riquelme","full_name":"Juan Román Riquelme","birth_date":"1978-06-24",
     "position":"CAM","positions":["CAM"],"foot":"Derecho","height":1.82,"weight":79,
     "caps_nt":51,"goals_nt":17,"caps_club":461,"goals_club":115,"assists_club":120,
     "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"1996-2002"},
               {"id":"barcelona","name":"FC Barcelona","years":"2002-2003"},
               {"id":"villarreal","name":"Villarreal CF","years":"2003-2007"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"2007-2014"},
               {"id":"argentinos-juniors","name":"Argentinos Juniors","years":"2014-2015"}],
     "trophies":[{"competition":"Copa Libertadores","year":"2007","club":"Boca Juniors"}],
     "active_years":"1996-2015","rating":91,"legendary":True},

    {"name":"Diego Maradona","full_name":"Diego Armando Maradona","birth_date":"1960-10-30",
     "position":"CAM","positions":["CAM","ST","LW"],"foot":"Izquierdo","height":1.65,"weight":75,
     "caps_nt":91,"goals_nt":34,"caps_club":491,"goals_club":259,"assists_club":150,
     "clubs":[{"id":"argentinos-juniors","name":"Argentinos Juniors","years":"1976-1981"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"1981-1982"},
               {"id":"barcelona","name":"FC Barcelona","years":"1982-1984"},
               {"id":"napoli","name":"SSC Napoli","years":"1984-1991"},
               {"id":"sevilla","name":"Sevilla FC","years":"1992-1993"},
               {"id":"newells","name":"Newell's Old Boys","years":"1993"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"1995-1997"}],
     "trophies": WC86 + [{"competition":"Scudetto","year":"1987","club":"SSC Napoli"}],
     "active_years":"1976-1997","rating":98,"legendary":True},

    {"name":"Ricardo Bochini","full_name":"Ricardo Enrique Bochini","birth_date":"1954-01-28",
     "position":"CAM","positions":["CAM"],"foot":"Derecho","height":1.68,"weight":65,
     "caps_nt":28,"goals_nt":0,"caps_club":638,"goals_club":97,"assists_club":200,
     "clubs":[{"id":"independiente","name":"Independiente","years":"1972-1991"}],
     "trophies": WC86 + [{"competition":"Copa Libertadores","year":"1984","club":"Independiente"}],
     "active_years":"1972-1991","rating":89,"legendary":True},

    # ATTACKERS (ST, CF, LW, RW)
    {"name":"Lionel Messi","full_name":"Lionel Andrés Messi","birth_date":"1987-06-24",
     "position":"RW","positions":["RW","ST","CAM","CF"],"foot":"Izquierdo","height":1.70,"weight":72,
     "caps_nt":187,"goals_nt":108,"caps_club":885,"goals_club":735,"assists_club":320,
     "clubs":[{"id":"barcelona","name":"FC Barcelona","years":"2004-2021"},
               {"id":"paris-saint-germain","name":"Paris Saint-Germain","years":"2021-2023"},
               {"id":"inter-miami","name":"Inter Miami CF","years":"2023-2025"}],
     "trophies": WC22 + CA21 + FIN22 + [{"competition":"Champions League","year":"2015","club":"FC Barcelona"}],
     "active_years":"2004-2025","rating":99,"legendary":True},

    {"name":"Gabriel Batistuta","full_name":"Gabriel Omar Batistuta","birth_date":"1969-02-01",
     "position":"ST","positions":["ST"],"foot":"Derecho","height":1.85,"weight":82,
     "caps_nt":78,"goals_nt":56,"caps_club":443,"goals_club":300,"assists_club":30,
     "clubs":[{"id":"newells","name":"Newell's Old Boys","years":"1988-1989"},
               {"id":"river-plate","name":"River Plate","years":"1989-1990"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"1990-1991"},
               {"id":"fiorentina","name":"Fiorentina","years":"1991-2000"},
               {"id":"roma","name":"AS Roma","years":"2000-2003"},
               {"id":"internazionale","name":"Internazionale","years":"2003"}],
     "trophies":[{"competition":"Serie A","year":"2001","club":"AS Roma"}],
     "active_years":"1988-2003","rating":92,"legendary":True},

    {"name":"Hernán Crespo","full_name":"Hernán Jorge Crespo","birth_date":"1975-07-05",
     "position":"ST","positions":["ST"],"foot":"Derecho","height":1.84,"weight":78,
     "caps_nt":64,"goals_nt":35,"caps_club":450,"goals_club":230,"assists_club":40,
     "clubs":[{"id":"river-plate","name":"River Plate","years":"1993-1996"},
               {"id":"parma","name":"Parma","years":"1996-2000"},
               {"id":"lazio","name":"Lazio","years":"2000-2002"},
               {"id":"internazionale","name":"Internazionale","years":"2002-2003"},
               {"id":"chelsea","name":"Chelsea","years":"2003-2004"},
               {"id":"milan","name":"AC Milan","years":"2004-2005"},
               {"id":"chelsea","name":"Chelsea","years":"2005-2006"},
               {"id":"internazionale","name":"Internazionale","years":"2006-2008"},
               {"id":"genoa","name":"Genoa","years":"2009-2010"},
               {"id":"parma","name":"Parma","years":"2010-2012"}],
     "trophies":[{"competition":"Copa Libertadores","year":"1996","club":"River Plate"}],
     "active_years":"1993-2012","rating":88,"legendary":True},

    {"name":"Carlos Tevez","full_name":"Carlos Alberto Tevez","birth_date":"1984-02-05",
     "position":"ST","positions":["ST","CF"],"foot":"Derecho","height":1.71,"weight":75,
     "caps_nt":76,"goals_nt":13,"caps_club":607,"goals_club":237,"assists_club":108,
     "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"2001-2004"},
               {"id":"corinthians","name":"Corinthians","years":"2005-2006"},
               {"id":"west-ham","name":"West Ham United","years":"2006-2007"},
               {"id":"manchester-united","name":"Manchester United","years":"2007-2009"},
               {"id":"manchester-city","name":"Manchester City","years":"2009-2013"},
               {"id":"juventus","name":"Juventus","years":"2013-2015"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"2015-2016"},
               {"id":"shanghai-shenhua","name":"Shanghai Shenhua","years":"2017-2018"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"2018-2021"}],
     "trophies":[{"competition":"Copa Libertadores","year":"2003","club":"Boca Juniors"}],
     "active_years":"2001-2021","rating":89,"legendary":True},

    {"name":"Mario Kempes","full_name":"Mario Alberto Kempes","birth_date":"1954-07-15",
     "position":"ST","positions":["ST","CAM"],"foot":"Izquierdo","height":1.82,"weight":76,
     "caps_nt":43,"goals_nt":20,"caps_club":550,"goals_club":300,"assists_club":60,
     "clubs":[{"id":"instituto","name":"Instituto","years":"1970-1973"},
               {"id":"rosario-central","name":"Rosario Central","years":"1974-1976"},
               {"id":"valencia","name":"Valencia CF","years":"1976-1981"},
               {"id":"river-plate","name":"River Plate","years":"1981-1982"},
               {"id":"valencia","name":"Valencia CF","years":"1982-1984"}],
     "trophies": WC78 + [{"competition":"Copa del Rey","year":"1979","club":"Valencia CF"}],
     "active_years":"1970-1996","rating":91,"legendary":True},

    {"name":"Martín Palermo","full_name":"Martín Palermo","birth_date":"1973-11-07",
     "position":"ST","positions":["ST"],"foot":"Derecho","height":1.88,"weight":85,
     "caps_nt":15,"goals_nt":9,"caps_club":590,"goals_club":306,"assists_club":40,
     "clubs":[{"id":"estudiantes-lp","name":"Estudiantes LP","years":"1992-1997"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"1997-2000"},
               {"id":"villarreal","name":"Villarreal CF","years":"2001-2003"},
               {"id":"real-betis","name":"Real Betis","years":"2003-2004"},
               {"id":"alaves","name":"Deportivo Alavés","years":"2004"},
               {"id":"boca-juniors","name":"Boca Juniors","years":"2004-2011"}],
     "trophies":[{"competition":"Copa Libertadores","year":"2000","club":"Boca Juniors"}],
     "active_years":"1992-2011","rating":87,"legendary":True},

    {"name":"Ángel Di María","full_name":"Ángel Fabián Di María","birth_date":"1988-02-14",
     "position":"RW","positions":["RW","LW","CAM"],"foot":"Izquierdo","height":1.78,"weight":70,
     "caps_nt":145,"goals_nt":31,"caps_club":580,"goals_club":140,"assists_club":190,
     "clubs":[{"id":"rosario-central","name":"Rosario Central","years":"2005-2007"},
               {"id":"benfica","name":"SL Benfica","years":"2007-2010"},
               {"id":"real-madrid","name":"Real Madrid","years":"2010-2014"},
               {"id":"manchester-united","name":"Manchester United","years":"2014-2015"},
               {"id":"paris-saint-germain","name":"Paris Saint-Germain","years":"2015-2022"},
               {"id":"juventus","name":"Juventus","years":"2022-2023"},
               {"id":"benfica","name":"SL Benfica","years":"2023-2025"}],
     "trophies": WC22 + CA21 + FIN22 + [{"competition":"Champions League","year":"2014","club":"Real Madrid"}],
     "active_years":"2005-2025","rating":90,"legendary":True},

    {"name":"Enzo Francescoli","full_name":"Enzo Francescoli Uriarte","birth_date":"1961-11-12",
     "position":"CAM","positions":["CAM","ST"],"foot":"Derecho","height":1.78,"weight":73,
     "nationality":"Uruguay","caps_nt":73,"goals_nt":17,"caps_club":510,"goals_club":198,"assists_club":80,
     "clubs":[{"id":"wanderers","name":"Montevideo Wanderers","years":"1980-1982"},
               {"id":"river-plate","name":"River Plate","years":"1983-1986"},
               {"id":"racing-paris","name":"Racing París","years":"1986-1989"},
               {"id":"marseille","name":"Olympique Marseille","years":"1989-1990"},
               {"id":"cagliari","name":"Cagliari","years":"1990-1993"},
               {"id":"torino","name":"Torino","years":"1993-1994"},
               {"id":"river-plate","name":"River Plate","years":"1994-1997"}],
     "trophies":[{"competition":"Copa Libertadores","year":"1996","club":"River Plate"}],
     "active_years":"1980-1997","rating":89,"legendary":True},

    {"name":"José Sand","full_name":"José Gustavo Sand","birth_date":"1980-07-17",
     "position":"ST","positions":["ST"],"foot":"Derecho","height":1.82,"weight":79,
     "caps_nt":2,"goals_nt":0,"caps_club":540,"goals_club":220,"assists_club":30,
     "clubs":[{"id":"colon","name":"Colón","years":"2000-2001"},
               {"id":"independiente-rivadavia","name":"Independiente Rivadavia","years":"2001-2002"},
               {"id":"defensores-belgrano","name":"Defensores de Belgrano","years":"2002-2003"},
               {"id":"river-plate","name":"River Plate","years":"2003-2004"},
               {"id":"banfield","name":"Banfield","years":"2005-2006"},
               {"id":"colon","name":"Colón","years":"2006-2007"},
               {"id":"lanus","name":"Lanús","years":"2007-2009"},
               {"id":"al-ain","name":"Al Ain","years":"2009-2011"},
               {"id":"deportivo-la-coruna","name":"Deportivo La Coruña","years":"2011"},
               {"id":"tijuana","name":"Tijuana","years":"2011-2012"},
               {"id":"racing-club","name":"Racing Club","years":"2012-2013"},
               {"id":"tigre","name":"Tigre","years":"2013-2014"},
               {"id":"argentinos-juniors","name":"Argentinos Juniors","years":"2014"},
               {"id":"aldosivi","name":"Aldosivi","years":"2015"},
               {"id":"lanus","name":"Lanús","years":"2016-2017"},
               {"id":"deportivo-cali","name":"Deportivo Cali","years":"2018"},
               {"id":"lanus","name":"Lanús","years":"2019-2023"}],
     "active_years":"1999-2023","rating":83,"legendary":False},

    {"name":"Pablo Guiñazú","full_name":"Pablo Horacio Guiñazú","birth_date":"1978-08-26",
     "position":"CDM","positions":["CDM","CM"],"foot":"Izquierdo","height":1.74,"weight":71,
     "caps_nt":16,"goals_nt":0,"caps_club":610,"goals_club":12,"assists_club":20,
     "clubs":[{"id":"newells","name":"Newell's Old Boys","years":"1996-2000"},
               {"id":"independiente","name":"Independiente","years":"2001-2003"},
               {"id":"newells","name":"Newell's Old Boys","years":"2003"},
               {"id":"libertad","name":"Libertad","years":"2004-2007"},
               {"id":"internacional","name":"Internacional","years":"2007-2012"},
               {"id":"vasco-da-gama","name":"Vasco da Gama","years":"2013-2015"},
               {"id":"talleres-cba","name":"Talleres","years":"2016-2019"}],
     "active_years":"1996-2019","rating":83,"legendary":False},

    {"name":"Javier Pastore","full_name":"Javier Matías Pastore","birth_date":"1989-06-20",
     "position":"CAM","positions":["CAM","LW"],"foot":"Derecho","height":1.87,"weight":78,
     "caps_nt":29,"goals_nt":2,"caps_club":380,"goals_club":55,"assists_club":70,
     "clubs":[{"id":"talleres-cba","name":"Talleres","years":"2007"},
               {"id":"huracan","name":"Huracán","years":"2007-2009"},
               {"id":"palermo","name":"Palermo","years":"2009-2011"},
               {"id":"paris-saint-germain","name":"Paris Saint-Germain","years":"2011-2018"},
               {"id":"roma","name":"AS Roma","years":"2018-2021"},
               {"id":"elche","name":"Elche","years":"2021-2023"}],
     "active_years":"2007-2023","rating":84,"legendary":False},
]

def load_raw_squad_players():
    # Parsea real players de data/raw_squads.txt
    raw_path = ROOT / "data" / "raw_squads.txt"
    if not raw_path.exists():
        print(f"WARNING: raw_squads.txt not found at {raw_path}")
        return []
        
    squad_players = []
    current_club = None
    
    with open(raw_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '|' in line:
                parts = line.split('|')
                if len(parts) >= 2 and parts[1].isdigit():
                    # CLUB_ID|SEASON|COMPETITION|LABEL
                    current_club = {
                        'id': parts[0].strip(),
                        'name': parts[3].strip() if len(parts) > 3 else parts[0].strip(),
                        'season': parts[1].strip()
                    }
                elif len(parts) >= 3 and current_club:
                    # Name|Position|Rating
                    name = parts[0].strip()
                    pos_str = parts[1].strip()
                    rating = int(parts[2].strip())
                    
                    pos = POSITIONS.get(pos_str.lower(), 'CM')
                    
                    squad_players.append({
                        'name': name,
                        'pos': pos,
                        'rating': rating,
                        'club': current_club
                    })
    return squad_players

def main():
    # 1. Load curated seed legends
    players_db = {}
    for p in SEED_LEGENDS:
        built_p = build(p)
        players_db[built_p['name'].lower()] = built_p
        
    # 2. Parse and merge active players from raw_squads.txt
    raw_pls = load_raw_squad_players()
    print(f"Parsed {len(raw_pls)} player references from raw_squads.txt")
    
    added_from_raw = 0
    for rp in raw_pls:
        name_lower = rp['name'].lower()
        
        # Check nationality
        nat = NATIONALITIES.get(name_lower, 'Argentina')
        
        # Determine birth year realistically for 2025 players (born ~1990-2005)
        # We can seed based on name hash to be deterministic but realistic
        # (e.g. hash(name) % 15 + 1988)
        import hashlib
        h = int(hashlib.md5(rp['name'].encode('utf-8')).hexdigest(), 16)
        birth_year = 1990 + (h % 15)
        
        club_id = rp['club']['id']
        club_name = rp['club']['name'].split(' 2025')[0]
        
        # Find if a player with the same name and compatible position exists
        match = None
        for p in players_db.values():
            if p['name'].lower() == name_lower:
                if (p['position'] == 'GK') == (rp['pos'] == 'GK'):
                    match = p
                    break
                    
        if match:
            # Player already exists, append club if not present
            club_exists = any(c['id'] == club_id for c in match['clubs'])
            if not club_exists:
                match['clubs'].append({
                    'id': club_id,
                    'name': club_name,
                    'years': rp['club']['season']
                })
        else:
            # Create new player
            p_id = make_id(rp['name'], str(birth_year))
            # Deduplicate ID
            existing_ids = {p['id'] for p in players_db.values()}
            if p_id in existing_ids:
                p_id = f"{p_id}-{rp['pos'].lower()}"
                
            new_p = {
                "id": p_id,
                "name": rp['name'],
                "full_name": rp['name'],
                "birth_date": f"{birth_year}-06-15",
                "position": rp['pos'],
                "positions": [rp['pos']],
                "nationality": nat,
                "height": 1.74 + ((h % 20) / 100.0),
                "weight": 68 + (h % 20),
                "foot": "Izquierdo" if (h % 4) == 0 else "Derecho",
                "clubs": [{
                    "id": club_id,
                    "name": club_name,
                    "years": rp['club']['season']
                }],
                "rating": rp['rating'],
                "legendary": rp['rating'] >= 88
            }
            built_new = build(new_p)
            players_db[p_id.lower()] = built_new
            added_from_raw += 1
            
    final_players = list(players_db.values())
    
    # 3. Write final players.json
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(final_players, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully wrote {len(final_players)} players to {OUT} (+{added_from_raw} from raw_squads)")
    
    # 4. Run build_squads.py automatically to sync squads.json
    print("Running scripts/build_squads.py to sync squads.json...")
    build_squads_path = ROOT / "scripts" / "build_squads.py"
    subprocess.run(["python3", str(build_squads_path)], check=True)
    
if __name__ == '__main__':
    main()
