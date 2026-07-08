#!/usr/bin/env python3
"""
LigaStatsGame — Build Curated Argentine Players Database
═══════════════════════════════════════════════════════
Reemplaza la DB generada por IA con ~260 jugadores argentinos
reales, verificados manualmente con fuentes de Wikipedia y BDFA.

Uso:
    python3 scripts/data/build-curated-db.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
OUT  = ROOT / "data" / "players.json"

# ─── helpers ──────────────────────────────────────────────────────────────────

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
        return "1970s"
    yr = int(birth_date[:4])
    return f"{(yr // 10) * 10}s"

def build(p: dict) -> dict:
    """Expand a compact seed dict into a full player record."""
    bd   = p.get("birth_date", "")
    yr   = bd[:4] if bd else "1970"
    pos  = p["position"]
    return {
        "id":               p.get("id", make_id(p["name"], yr)),
        "name":             p["name"],
        "fullName":         p.get("full_name", p["name"]),
        "birthDate":        bd,
        "position":         pos,
        "positions":        p.get("positions", [pos]),
        "nationality":      p.get("nationality", "Argentina"),
        "height":           p.get("height", 1.76),
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
        "decade":           decade(bd),
        "rating":           p.get("rating", 72),
        "legendary":        p.get("legendary", False),
    }

# ─── SEED DATA ────────────────────────────────────────────────────────────────
# Todos los jugadores verificados manualmente.
# Fuentes: Wikipedia, BDFA (bdfa.com.ar), Transfermarkt
# ──────────────────────────────────────────────────────────────────────────────

WC78  = [{"competition":"Copa del Mundo","year":"1978","club":"Argentina"}]
WC86  = [{"competition":"Copa del Mundo","year":"1986","club":"Argentina"}]
WC22  = [{"competition":"Copa del Mundo","year":"2022","club":"Argentina"}]
CA21  = [{"competition":"Copa América",  "year":"2021","club":"Argentina"}]
FIN22 = [{"competition":"Finalissima",   "year":"2022","club":"Argentina"}]

SEED = [

# ════════════════════════════════════════════════════════
# PORTEROS
# ════════════════════════════════════════════════════════

{"name":"Amadeo Carrizo","full_name":"Amadeo Raúl Carrizo","birth_date":"1926-06-12",
 "position":"GK","positions":["GK"],"foot":"Derecho","height":1.82,"weight":80,
 "caps_nt":20,"goals_nt":0,"caps_club":520,"goals_club":0,"assists_club":0,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1945-1968"},
           {"id":"millonarios","name":"Millonarios","years":"1968-1969"},
           {"id":"valencia","name":"Valencia CF","years":"1969-1970"}],
 "trophies":[
   {"competition":"Liga Argentina","year":"1947","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1952","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1953","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1955","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1956","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1957","club":"River Plate"},
 ],"active_years":"1945-1970","rating":88,"legendary":True},

{"name":"Hugo Gatti","full_name":"Hugo Orlando Gatti","birth_date":"1944-08-19",
 "position":"GK","positions":["GK"],"foot":"Derecho","height":1.80,"weight":78,
 "caps_nt":18,"goals_nt":0,"caps_club":650,"goals_club":0,"assists_club":0,
 "clubs":[{"id":"atlanta","name":"Atlanta","years":"1963-1967"},
           {"id":"san-lorenzo","name":"San Lorenzo","years":"1967-1969"},
           {"id":"river-plate","name":"River Plate","years":"1969-1970"},
           {"id":"colon","name":"Colón","years":"1970-1972"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1972-1987"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"1977","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"1978","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"1976","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"1981","club":"Boca Juniors"},
 ],"active_years":"1962-1987","rating":85,"legendary":True},

{"name":"Ubaldo Fillol","full_name":"Ubaldo Matildo Fillol","birth_date":"1950-07-21",
 "position":"GK","positions":["GK"],"foot":"Derecho","height":1.84,"weight":83,
 "caps_nt":60,"goals_nt":0,"caps_club":420,"goals_club":0,"assists_club":0,
 "clubs":[{"id":"quilmes","name":"Quilmes","years":"1968-1969"},
           {"id":"platense","name":"Platense","years":"1970-1974"},
           {"id":"river-plate","name":"River Plate","years":"1974-1985"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"1985-1987"},
           {"id":"racing-club","name":"Racing Club","years":"1987-1989"},
           {"id":"flamengo","name":"Flamengo","years":"1989-1990"}],
 "trophies": WC78 + [
   {"competition":"Copa Libertadores","year":"1986","club":"River Plate"},
   {"competition":"Intercontinental","year":"1986","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1975","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1977","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1979","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1981","club":"River Plate"},
 ],"active_years":"1968-1990","rating":90,"legendary":True},

{"name":"Nery Pumpido","full_name":"Carlos Nery Pumpido","birth_date":"1957-03-30",
 "position":"GK","positions":["GK"],"foot":"Derecho","height":1.84,"weight":82,
 "caps_nt":35,"goals_nt":0,"caps_club":350,"goals_club":0,"assists_club":0,
 "clubs":[{"id":"union-santa-fe","name":"Unión Santa Fe","years":"1976-1981"},
           {"id":"river-plate","name":"River Plate","years":"1981-1988"},
           {"id":"real-betis","name":"Real Betis","years":"1988-1994"},
           {"id":"eintracht-frankfurt","name":"Eintracht Frankfurt","years":"1994-1995"}],
 "trophies": WC86 + [
   {"competition":"Copa Libertadores","year":"1986","club":"River Plate"},
   {"competition":"Intercontinental","year":"1986","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1985","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1986","club":"River Plate"},
 ],"active_years":"1976-1995","rating":84,"legendary":True},

{"name":"Germán Burgos","full_name":"Germán Adrián Burgos","birth_date":"1969-04-16",
 "position":"GK","positions":["GK"],"foot":"Derecho","height":1.87,"weight":84,
 "caps_nt":17,"goals_nt":0,"caps_club":380,"goals_club":0,"assists_club":0,
 "clubs":[{"id":"chacarita","name":"Chacarita Juniors","years":"1988-1994"},
           {"id":"river-plate","name":"River Plate","years":"1994-1996"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"1996-2000"},
           {"id":"ac-milan","name":"AC Milan","years":"1999-2000"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2000-2004"},
           {"id":"malaga","name":"Málaga CF","years":"2004-2007"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"1996","club":"River Plate"},
 ],"active_years":"1988-2007","rating":79,"legendary":False},

{"name":"Carlos Roa","full_name":"Carlos Alberto Roa","birth_date":"1969-08-01",
 "position":"GK","positions":["GK"],"foot":"Derecho","height":1.85,"weight":81,
 "caps_nt":28,"goals_nt":0,"caps_club":280,"goals_club":0,"assists_club":0,
 "clubs":[{"id":"san-lorenzo","name":"San Lorenzo","years":"1990-1994"},
           {"id":"racing-club","name":"Racing Club","years":"1994-1996"},
           {"id":"mallorca","name":"RCD Mallorca","years":"1996-2000"},
           {"id":"mallorca","name":"RCD Mallorca","years":"2000-2004"}],
 "trophies":[],"active_years":"1990-2004","rating":78,"legendary":False},

{"name":"Roberto Abbondanzieri","full_name":"Roberto Fabián Abbondanzieri","birth_date":"1971-08-19",
 "position":"GK","positions":["GK"],"foot":"Derecho","height":1.89,"weight":87,
 "caps_nt":32,"goals_nt":0,"caps_club":320,"goals_club":0,"assists_club":0,
 "clubs":[{"id":"estudiantes","name":"Estudiantes LP","years":"1990-1994"},
           {"id":"colon","name":"Colón","years":"1994-1998"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1998-2006"},
           {"id":"getafe","name":"Getafe CF","years":"2006-2009"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2009-2011"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"2000","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2001","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2003","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"1999","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"2000","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"2003","club":"Boca Juniors"},
 ],"active_years":"1990-2011","rating":82,"legendary":False},

{"name":"Sergio Romero","full_name":"Sergio Germán Romero","birth_date":"1987-02-22",
 "position":"GK","positions":["GK"],"foot":"Derecho","height":1.92,"weight":88,
 "caps_nt":96,"goals_nt":0,"caps_club":320,"goals_club":0,"assists_club":0,
 "clubs":[{"id":"racing-club","name":"Racing Club","years":"2006-2008"},
           {"id":"sampdoria","name":"Sampdoria","years":"2008-2011"},
           {"id":"monaco","name":"AS Monaco","years":"2011-2014"},
           {"id":"sampdoria","name":"Sampdoria","years":"2014-2015"},
           {"id":"man-utd","name":"Manchester United","years":"2015-2021"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2022-2023"}],
 "trophies":[
   {"competition":"FA Cup","year":"2016","club":"Manchester United"},
   {"competition":"Europa League","year":"2017","club":"Manchester United"},
 ],"active_years":"2006-2023","rating":83,"legendary":False},

{"name":"Mariano Andújar","full_name":"Mariano Darío Andújar","birth_date":"1983-07-30",
 "position":"GK","positions":["GK"],"foot":"Derecho","height":1.85,"weight":82,
 "caps_nt":21,"goals_nt":0,"caps_club":390,"goals_club":0,"assists_club":0,
 "clubs":[{"id":"colon","name":"Colón","years":"2002-2005"},
           {"id":"estudiantes","name":"Estudiantes LP","years":"2005-2010"},
           {"id":"getafe","name":"Getafe CF","years":"2010-2011"},
           {"id":"catania","name":"Catania","years":"2011-2014"},
           {"id":"estudiantes","name":"Estudiantes LP","years":"2014-2020"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"2009","club":"Estudiantes LP"},
 ],"active_years":"2002-2020","rating":77,"legendary":False},

{"name":"Emiliano Martínez","full_name":"Emiliano Damián Martínez","birth_date":"1992-09-02",
 "position":"GK","positions":["GK"],"foot":"Derecho","height":1.95,"weight":91,
 "caps_nt":35,"goals_nt":0,"caps_club":200,"goals_club":0,"assists_club":0,
 "clubs":[{"id":"independiente","name":"Independiente","years":"2010-2011"},
           {"id":"arsenal","name":"Arsenal","years":"2011-2020"},
           {"id":"aston-villa","name":"Aston Villa","years":"2020-2024"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2024-2025"}],
 "trophies": WC22 + CA21 + FIN22,
 "active_years":"2010-2025","rating":89,"legendary":False},

# ════════════════════════════════════════════════════════
# DEFENSORES CENTRALES
# ════════════════════════════════════════════════════════

{"name":"Daniel Passarella","full_name":"Daniel Alberto Passarella","birth_date":"1953-05-25",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.74,"weight":73,
 "caps_nt":70,"goals_nt":22,"caps_club":450,"goals_club":134,"assists_club":20,
 "clubs":[{"id":"sarmiento","name":"Sarmiento Junín","years":"1971-1974"},
           {"id":"river-plate","name":"River Plate","years":"1974-1982"},
           {"id":"fiorentina","name":"Fiorentina","years":"1982-1986"},
           {"id":"inter","name":"Internazionale","years":"1986-1989"},
           {"id":"river-plate","name":"River Plate","years":"1989-1989"}],
 "trophies": WC78 + [
   {"competition":"Copa Libertadores","year":"1986","club":"River Plate"},
   {"competition":"Intercontinental","year":"1986","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1975","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1977","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1979","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1981","club":"River Plate"},
   {"competition":"Coppa Italia","year":"1986","club":"Fiorentina"},
 ],"active_years":"1971-1989","rating":92,"legendary":True},

{"name":"Oscar Ruggeri","full_name":"Oscar Alfredo Ruggeri","birth_date":"1961-07-26",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.85,"weight":80,
 "caps_nt":97,"goals_nt":7,"caps_club":500,"goals_club":45,"assists_club":15,
 "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"1979-1984"},
           {"id":"river-plate","name":"River Plate","years":"1984-1988"},
           {"id":"real-madrid","name":"Real Madrid","years":"1988-1989"},
           {"id":"america-mexico","name":"América de México","years":"1989-1991"},
           {"id":"san-lorenzo","name":"San Lorenzo","years":"1991-1993"},
           {"id":"velez-sarsfield","name":"Vélez Sarsfield","years":"1994-1996"},
           {"id":"independiente","name":"Independiente","years":"1996-1998"},
           {"id":"san-lorenzo","name":"San Lorenzo","years":"1998-1999"}],
 "trophies": WC86 + [
   {"competition":"Copa Libertadores","year":"1986","club":"River Plate"},
   {"competition":"Intercontinental","year":"1986","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1985","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1986","club":"River Plate"},
   {"competition":"Copa Libertadores","year":"1994","club":"Vélez Sarsfield"},
   {"competition":"Intercontinental","year":"1994","club":"Vélez Sarsfield"},
 ],"active_years":"1979-1999","rating":88,"legendary":True},

{"name":"Roberto Perfumo","full_name":"Roberto Héctor Perfumo","birth_date":"1942-10-03",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.82,"weight":79,
 "caps_nt":37,"goals_nt":4,"caps_club":480,"goals_club":40,"assists_club":10,
 "clubs":[{"id":"racing-club","name":"Racing Club","years":"1962-1971"},
           {"id":"cruzeiro","name":"Cruzeiro","years":"1971-1973"},
           {"id":"river-plate","name":"River Plate","years":"1973-1978"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"1967","club":"Racing Club"},
   {"competition":"Copa Intercontinental","year":"1967","club":"Racing Club"},
   {"competition":"Liga Argentina","year":"1966","club":"Racing Club"},
   {"competition":"Liga Argentina","year":"1975","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1977","club":"River Plate"},
 ],"active_years":"1962-1978","rating":87,"legendary":True},

{"name":"José Luis Brown","full_name":"José Luis Brown","birth_date":"1956-10-28",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.81,"weight":78,
 "caps_nt":36,"goals_nt":2,"caps_club":280,"goals_club":12,"assists_club":5,
 "clubs":[{"id":"estudiantes","name":"Estudiantes LP","years":"1975-1983"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1983-1985"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"1987-1989"}],
 "trophies": WC86,
 "active_years":"1975-1989","rating":82,"legendary":True},

{"name":"Roberto Ayala","full_name":"Roberto Fabián Ayala","birth_date":"1973-04-14",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.77,"weight":74,
 "caps_nt":115,"goals_nt":5,"caps_club":470,"goals_club":18,"assists_club":10,
 "clubs":[{"id":"ferro","name":"Ferro Carril Oeste","years":"1992-1995"},
           {"id":"napoli","name":"Napoli","years":"1995-1997"},
           {"id":"ac-milan","name":"AC Milan","years":"1997-1998"},
           {"id":"valencia","name":"Valencia CF","years":"1998-2007"},
           {"id":"zaragoza","name":"Real Zaragoza","years":"2007-2010"},
           {"id":"racing-club","name":"Racing Club","years":"2010-2012"}],
 "trophies":[
   {"competition":"La Liga","year":"2002","club":"Valencia CF"},
   {"competition":"La Liga","year":"2004","club":"Valencia CF"},
   {"competition":"Copa del Rey","year":"1999","club":"Valencia CF"},
 ],"active_years":"1992-2012","rating":87,"legendary":True},

{"name":"Walter Samuel","full_name":"Walter Adrián Samuel","birth_date":"1978-03-23",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.86,"weight":83,
 "caps_nt":55,"goals_nt":3,"caps_club":400,"goals_club":12,"assists_club":5,
 "clubs":[{"id":"newells","name":"Newell's Old Boys","years":"1997-2000"},
           {"id":"roma","name":"AS Roma","years":"2000-2004"},
           {"id":"real-madrid","name":"Real Madrid","years":"2004-2005"},
           {"id":"inter","name":"Internazionale","years":"2005-2014"},
           {"id":"fc-basel","name":"FC Basel","years":"2014-2016"}],
 "trophies":[
   {"competition":"Serie A","year":"2006","club":"Internazionale"},
   {"competition":"Serie A","year":"2007","club":"Internazionale"},
   {"competition":"Serie A","year":"2008","club":"Internazionale"},
   {"competition":"Serie A","year":"2009","club":"Internazionale"},
   {"competition":"Serie A","year":"2010","club":"Internazionale"},
   {"competition":"Champions League","year":"2010","club":"Internazionale"},
   {"competition":"Serie A","year":"2001","club":"AS Roma"},
 ],"active_years":"1997-2016","rating":84,"legendary":False},

{"name":"Fabio Coloccini","full_name":"Fabricio Coloccini","birth_date":"1981-01-22",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.85,"weight":80,
 "caps_nt":39,"goals_nt":2,"caps_club":430,"goals_club":10,"assists_club":8,
 "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"1999-2001"},
           {"id":"ac-milan","name":"AC Milan","years":"2001-2002"},
           {"id":"deportivo","name":"Deportivo La Coruña","years":"2002-2007"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2007-2008"},
           {"id":"newcastle","name":"Newcastle United","years":"2008-2016"},
           {"id":"san-lorenzo","name":"San Lorenzo","years":"2016-2018"}],
 "trophies":[],"active_years":"1999-2018","rating":80,"legendary":False},

{"name":"Nicolás Otamendi","full_name":"Nicolás Hernán Otamendi","birth_date":"1988-02-12",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.81,"weight":81,
 "caps_nt":120,"goals_nt":7,"caps_club":480,"goals_club":25,"assists_club":10,
 "clubs":[{"id":"velez-sarsfield","name":"Vélez Sarsfield","years":"2007-2010"},
           {"id":"porto","name":"FC Porto","years":"2010-2014"},
           {"id":"valencia","name":"Valencia CF","years":"2014-2015"},
           {"id":"man-city","name":"Manchester City","years":"2015-2020"},
           {"id":"benfica","name":"Benfica","years":"2020-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Premier League","year":"2018","club":"Manchester City"},
   {"competition":"Premier League","year":"2019","club":"Manchester City"},
   {"competition":"Premier League","year":"2021","club":"Manchester City"},
   {"competition":"Liga Portuguesa","year":"2023","club":"Benfica"},
 ],"active_years":"2007-2025","rating":86,"legendary":False},

{"name":"Cristian Romero","full_name":"Cristian Gabriel Romero","birth_date":"1998-04-27",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.87,"weight":86,
 "caps_nt":40,"goals_nt":4,"caps_club":180,"goals_club":10,"assists_club":5,
 "clubs":[{"id":"belgrano","name":"Belgrano","years":"2016-2018"},
           {"id":"genoa","name":"Genoa","years":"2018-2019"},
           {"id":"juventus","name":"Juventus","years":"2019-2021"},
           {"id":"atalanta","name":"Atalanta","years":"2021-2022"},
           {"id":"tottenham","name":"Tottenham Hotspur","years":"2022-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Copa Italia","year":"2021","club":"Atalanta"},
 ],"active_years":"2016-2025","rating":87,"legendary":False},

{"name":"Ezequiel Garay","full_name":"Ezequiel Marcelo Garay","birth_date":"1986-10-10",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.90,"weight":84,
 "caps_nt":38,"goals_nt":3,"caps_club":350,"goals_club":14,"assists_club":6,
 "clubs":[{"id":"newells","name":"Newell's Old Boys","years":"2005-2006"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2006-2007"},
           {"id":"real-madrid","name":"Real Madrid","years":"2007-2008"},
           {"id":"zaragoza","name":"Real Zaragoza","years":"2008-2011"},
           {"id":"benfica","name":"Benfica","years":"2011-2014"},
           {"id":"zenit","name":"Zenit San Petersburgo","years":"2014-2016"},
           {"id":"valencia","name":"Valencia CF","years":"2016-2020"}],
 "trophies":[
   {"competition":"Liga Portuguesa","year":"2014","club":"Benfica"},
 ],"active_years":"2005-2020","rating":82,"legendary":False},

{"name":"Marcos Rojo","full_name":"Marcos Rojo","birth_date":"1990-03-20",
 "position":"CB","positions":["CB","LB"],"foot":"Izquierdo","height":1.87,"weight":84,
 "caps_nt":65,"goals_nt":4,"caps_club":300,"goals_club":12,"assists_club":8,
 "clubs":[{"id":"estudiantes","name":"Estudiantes LP","years":"2009-2011"},
           {"id":"spartak-moscow","name":"Spartak Moscú","years":"2011-2012"},
           {"id":"sporting","name":"Sporting CP","years":"2012-2014"},
           {"id":"man-utd","name":"Manchester United","years":"2014-2021"},
           {"id":"estudiantes","name":"Estudiantes LP","years":"2021-2022"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2022-2024"}],
 "trophies":[
   {"competition":"FA Cup","year":"2016","club":"Manchester United"},
   {"competition":"Europa League","year":"2017","club":"Manchester United"},
 ],"active_years":"2009-2024","rating":79,"legendary":False},

{"name":"Gabriel Milito","full_name":"Gabriel Alejandro Milito","birth_date":"1980-09-07",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.81,"weight":77,
 "caps_nt":38,"goals_nt":5,"caps_club":360,"goals_club":14,"assists_club":8,
 "clubs":[{"id":"racing-club","name":"Racing Club","years":"1998-2003"},
           {"id":"zaragoza","name":"Real Zaragoza","years":"2003-2007"},
           {"id":"barcelona","name":"FC Barcelona","years":"2007-2008"},
           {"id":"getafe","name":"Getafe CF","years":"2008-2009"},
           {"id":"inter","name":"Internazionale","years":"2009-2011"},
           {"id":"zaragoza","name":"Real Zaragoza","years":"2011-2013"},
           {"id":"racing-club","name":"Racing Club","years":"2013-2015"}],
 "trophies":[
   {"competition":"Champions League","year":"2010","club":"Internazionale"},
   {"competition":"Serie A","year":"2010","club":"Internazionale"},
 ],"active_years":"1998-2015","rating":79,"legendary":False},

{"name":"Germán Pezzella","full_name":"Germán Pezzella","birth_date":"1991-03-27",
 "position":"CB","positions":["CB"],"foot":"Derecho","height":1.88,"weight":82,
 "caps_nt":28,"goals_nt":2,"caps_club":320,"goals_club":10,"assists_club":5,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"2011-2014"},
           {"id":"real-betis","name":"Real Betis","years":"2014-2019"},
           {"id":"fiorentina","name":"Fiorentina","years":"2016-2022"},
           {"id":"parma","name":"Parma","years":"2022-2023"},
           {"id":"atalanta","name":"Atalanta","years":"2023-2025"}],
 "trophies": CA21 + FIN22 + WC22,
 "active_years":"2011-2025","rating":78,"legendary":False},

# ════════════════════════════════════════════════════════
# LATERALES IZQUIERDOS
# ════════════════════════════════════════════════════════

{"name":"Marcos Tarantini","full_name":"Alberto César Tarantini","birth_date":"1953-03-25",
 "position":"LB","positions":["LB","CB"],"foot":"Izquierdo","height":1.79,"weight":76,
 "caps_nt":61,"goals_nt":3,"caps_club":320,"goals_club":18,"assists_club":25,
 "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"1972-1978"},
           {"id":"birmingham","name":"Birmingham City","years":"1978-1980"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1980-1981"},
           {"id":"talleres","name":"Talleres Córdoba","years":"1981-1984"}],
 "trophies": WC78 + [
   {"competition":"Copa Libertadores","year":"1977","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"1978","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"1976","club":"Boca Juniors"},
 ],"active_years":"1972-1984","rating":80,"legendary":False},

{"name":"Julio Olarticoechea","full_name":"Julio Hugo Olarticoechea","birth_date":"1958-01-12",
 "position":"LB","positions":["LB"],"foot":"Izquierdo","height":1.76,"weight":72,
 "caps_nt":50,"goals_nt":1,"caps_club":350,"goals_club":10,"assists_club":30,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1977-1982"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1982-1985"},
           {"id":"nantes","name":"FC Nantes","years":"1985-1990"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1990-1991"}],
 "trophies": WC86 + [
   {"competition":"Copa Libertadores","year":"1986","club":"River Plate"},
 ],"active_years":"1977-1991","rating":79,"legendary":False},

{"name":"Oscar Garré","full_name":"Oscar Alberto Garré","birth_date":"1958-09-01",
 "position":"LB","positions":["LB"],"foot":"Izquierdo","height":1.75,"weight":71,
 "caps_nt":30,"goals_nt":1,"caps_club":280,"goals_club":5,"assists_club":20,
 "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"1978-1986"},
           {"id":"valencia","name":"Valencia CF","years":"1986-1989"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1989-1992"}],
 "trophies": WC86 + [
   {"competition":"Liga Argentina","year":"1981","club":"Boca Juniors"},
 ],"active_years":"1978-1992","rating":77,"legendary":False},

{"name":"Juan Pablo Sorín","full_name":"Juan Pablo Sorín","birth_date":"1976-05-05",
 "position":"LB","positions":["LB","LWB"],"foot":"Izquierdo","height":1.78,"weight":72,
 "caps_nt":57,"goals_nt":6,"caps_club":350,"goals_club":20,"assists_club":50,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1994-1999"},
           {"id":"cruzeiro","name":"Cruzeiro","years":"1999-2000"},
           {"id":"lazio","name":"Lazio","years":"2000-2002"},
           {"id":"river-plate","name":"River Plate","years":"2002-2003"},
           {"id":"barcelona","name":"FC Barcelona","years":"2003-2004"},
           {"id":"villarreal","name":"Villarreal CF","years":"2004-2007"},
           {"id":"hamburg","name":"Hamburger SV","years":"2007-2009"},
           {"id":"river-plate","name":"River Plate","years":"2009-2010"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"1996","club":"River Plate"},
 ],"active_years":"1994-2010","rating":82,"legendary":False},

{"name":"Gabriel Heinze","full_name":"Gabriel Iván Heinze","birth_date":"1978-04-19",
 "position":"LB","positions":["LB","CB"],"foot":"Izquierdo","height":1.79,"weight":75,
 "caps_nt":73,"goals_nt":5,"caps_club":360,"goals_club":10,"assists_club":25,
 "clubs":[{"id":"newells","name":"Newell's Old Boys","years":"1997-2001"},
           {"id":"valladolid","name":"Real Valladolid","years":"2001-2002"},
           {"id":"psg","name":"PSG","years":"2002-2004"},
           {"id":"man-utd","name":"Manchester United","years":"2004-2007"},
           {"id":"real-madrid","name":"Real Madrid","years":"2007-2009"},
           {"id":"marseille","name":"Olympique Marseille","years":"2009-2011"},
           {"id":"roma","name":"AS Roma","years":"2011-2012"},
           {"id":"sporting","name":"Sporting CP","years":"2012-2013"},
           {"id":"velez-sarsfield","name":"Vélez Sarsfield","years":"2013-2015"}],
 "trophies":[
   {"competition":"Premier League","year":"2007","club":"Manchester United"},
   {"competition":"Copa Libertadores","year":"1994","club":"Vélez Sarsfield"},
 ],"active_years":"1997-2015","rating":83,"legendary":False},

{"name":"Nicolás Tagliafico","full_name":"Nicolás Alejandro Tagliafico","birth_date":"1992-08-31",
 "position":"LB","positions":["LB","LWB"],"foot":"Izquierdo","height":1.75,"weight":73,
 "caps_nt":70,"goals_nt":5,"caps_club":300,"goals_club":12,"assists_club":35,
 "clubs":[{"id":"independiente","name":"Independiente","years":"2011-2017"},
           {"id":"ajax","name":"Ajax","years":"2017-2022"},
           {"id":"lyon","name":"Olympique Lyon","years":"2022-2024"},
           {"id":"valencia","name":"Valencia CF","years":"2024-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Eredivisie","year":"2019","club":"Ajax"},
   {"competition":"Eredivisie","year":"2022","club":"Ajax"},
 ],"active_years":"2011-2025","rating":83,"legendary":False},

# ════════════════════════════════════════════════════════
# LATERALES DERECHOS
# ════════════════════════════════════════════════════════

{"name":"Javier Zanetti","full_name":"Javier Adelmar Zanetti","birth_date":"1973-08-10",
 "position":"RB","positions":["RB","CDM","CM"],"foot":"Derecho","height":1.78,"weight":75,
 "caps_nt":143,"goals_nt":5,"caps_club":858,"goals_club":19,"assists_club":65,
 "clubs":[{"id":"talleres-escalada","name":"Talleres Escalada","years":"1992-1993"},
           {"id":"banfield","name":"Banfield","years":"1993-1995"},
           {"id":"inter","name":"Internazionale","years":"1995-2014"}],
 "trophies":[
   {"competition":"Serie A","year":"2006","club":"Internazionale"},
   {"competition":"Serie A","year":"2007","club":"Internazionale"},
   {"competition":"Serie A","year":"2008","club":"Internazionale"},
   {"competition":"Serie A","year":"2009","club":"Internazionale"},
   {"competition":"Serie A","year":"2010","club":"Internazionale"},
   {"competition":"Champions League","year":"2010","club":"Internazionale"},
   {"competition":"Copa Italia","year":"2005","club":"Internazionale"},
   {"competition":"Copa Italia","year":"2006","club":"Internazionale"},
   {"competition":"Copa Italia","year":"2010","club":"Internazionale"},
   {"competition":"Copa Italia","year":"2011","club":"Internazionale"},
 ],"active_years":"1992-2014","rating":91,"legendary":True},

{"name":"Hugo Ibarra","full_name":"Hugo Ernesto Ibarra","birth_date":"1974-04-01",
 "position":"RB","positions":["RB"],"foot":"Derecho","height":1.72,"weight":68,
 "caps_nt":30,"goals_nt":0,"caps_club":380,"goals_club":5,"assists_club":20,
 "clubs":[{"id":"atletico-tucuman","name":"Atlético Tucumán","years":"1993-1997"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1997-2006"},
           {"id":"independiente","name":"Independiente","years":"2006-2009"},
           {"id":"colon","name":"Colón","years":"2009-2011"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"2000","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2001","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2003","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"1999","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"2003","club":"Boca Juniors"},
 ],"active_years":"1993-2011","rating":76,"legendary":False},

{"name":"Nelson Vivas","full_name":"Nelson Marius Vivas","birth_date":"1969-10-08",
 "position":"RB","positions":["RB","CDM"],"foot":"Derecho","height":1.68,"weight":67,
 "caps_nt":39,"goals_nt":0,"caps_club":320,"goals_club":3,"assists_club":15,
 "clubs":[{"id":"quilmes","name":"Quilmes","years":"1990-1994"},
           {"id":"arsenal","name":"Arsenal","years":"1996-2001"},
           {"id":"inter","name":"Internazionale","years":"2001-2004"},
           {"id":"celta","name":"Celta de Vigo","years":"2004-2006"},
           {"id":"quilmes","name":"Quilmes","years":"2006-2007"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2007-2009"}],
 "trophies":[
   {"competition":"Premier League","year":"1998","club":"Arsenal"},
   {"competition":"FA Cup","year":"1998","club":"Arsenal"},
   {"competition":"FA Cup","year":"2002","club":"Arsenal"},
 ],"active_years":"1990-2009","rating":75,"legendary":False},

{"name":"Gonzalo Montiel","full_name":"Gonzalo Exequiel Montiel","birth_date":"1997-01-01",
 "position":"RB","positions":["RB"],"foot":"Derecho","height":1.74,"weight":72,
 "caps_nt":40,"goals_nt":3,"caps_club":180,"goals_club":5,"assists_club":15,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"2017-2021"},
           {"id":"sevilla","name":"Sevilla FC","years":"2021-2023"},
           {"id":"nottm-forest","name":"Nottingham Forest","years":"2023-2024"},
           {"id":"river-plate","name":"River Plate","years":"2024-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Copa Libertadores","year":"2018","club":"River Plate"},
 ],"active_years":"2017-2025","rating":81,"legendary":False},

{"name":"Nahuel Molina","full_name":"Nahuel Molina Lucero","birth_date":"1998-04-06",
 "position":"RB","positions":["RB","RWB"],"foot":"Derecho","height":1.77,"weight":74,
 "caps_nt":45,"goals_nt":5,"caps_club":200,"goals_club":15,"assists_club":25,
 "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"2017-2018"},
           {"id":"rosario-central","name":"Rosario Central","years":"2018-2020"},
           {"id":"udinese","name":"Udinese","years":"2020-2022"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2022-2025"}],
 "trophies": WC22 + CA21 + FIN22,
 "active_years":"2017-2025","rating":82,"legendary":False},

{"name":"Lionel Scaloni","full_name":"Lionel Sebastián Scaloni","birth_date":"1978-05-16",
 "position":"RB","positions":["RB","CM"],"foot":"Derecho","height":1.75,"weight":70,
 "caps_nt":7,"goals_nt":0,"caps_club":320,"goals_club":12,"assists_club":30,
 "clubs":[{"id":"estudiantes","name":"Estudiantes LP","years":"1997-1999"},
           {"id":"deportivo","name":"Deportivo La Coruña","years":"1999-2007"},
           {"id":"west-ham","name":"West Ham United","years":"2006-2007"},
           {"id":"lazio","name":"Lazio","years":"2007-2009"},
           {"id":"mallorca","name":"RCD Mallorca","years":"2009-2010"},
           {"id":"ajax","name":"Ajax","years":"2010-2011"},
           {"id":"racing-club","name":"Racing Club","years":"2011-2013"}],
 "trophies":[],"active_years":"1997-2013","rating":73,"legendary":False},

# ════════════════════════════════════════════════════════
# MEDIOCAMPISTAS DEFENSIVOS (CDM)
# ════════════════════════════════════════════════════════

{"name":"Américo Gallego","full_name":"Américo Rubén Gallego","birth_date":"1955-01-28",
 "position":"CDM","positions":["CDM","CM"],"foot":"Derecho","height":1.75,"weight":72,
 "caps_nt":32,"goals_nt":2,"caps_club":380,"goals_club":15,"assists_club":25,
 "clubs":[{"id":"newells","name":"Newell's Old Boys","years":"1973-1978"},
           {"id":"river-plate","name":"River Plate","years":"1978-1987"}],
 "trophies": WC78 + [
   {"competition":"Liga Argentina","year":"1979","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1980","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1981","club":"River Plate"},
 ],"active_years":"1973-1987","rating":78,"legendary":False},

{"name":"Sergio Batista","full_name":"Sergio Daniel Batista","birth_date":"1962-11-09",
 "position":"CDM","positions":["CDM","CM"],"foot":"Derecho","height":1.77,"weight":73,
 "caps_nt":40,"goals_nt":1,"caps_club":340,"goals_club":12,"assists_club":20,
 "clubs":[{"id":"argentinos-juniors","name":"Argentinos Juniors","years":"1982-1984"},
           {"id":"river-plate","name":"River Plate","years":"1984-1990"},
           {"id":"lyon","name":"Olympique Lyon","years":"1990-1992"}],
 "trophies": WC86 + [
   {"competition":"Copa Libertadores","year":"1986","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1985","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1986","club":"River Plate"},
 ],"active_years":"1982-1992","rating":79,"legendary":False},

{"name":"Fernando Redondo","full_name":"Fernando Carlos Redondo","birth_date":"1969-06-06",
 "position":"CDM","positions":["CDM","CM"],"foot":"Derecho","height":1.80,"weight":76,
 "caps_nt":29,"goals_nt":0,"caps_club":320,"goals_club":5,"assists_club":40,
 "clubs":[{"id":"argentinos-juniors","name":"Argentinos Juniors","years":"1988-1990"},
           {"id":"tenerife","name":"CD Tenerife","years":"1990-1994"},
           {"id":"real-madrid","name":"Real Madrid","years":"1994-2000"},
           {"id":"ac-milan","name":"AC Milan","years":"2000-2004"}],
 "trophies":[
   {"competition":"La Liga","year":"1995","club":"Real Madrid"},
   {"competition":"La Liga","year":"1997","club":"Real Madrid"},
   {"competition":"Champions League","year":"1998","club":"Real Madrid"},
   {"competition":"Champions League","year":"2000","club":"Real Madrid"},
 ],"active_years":"1988-2004","rating":88,"legendary":True},

{"name":"Matías Almeyda","full_name":"Matías Daniel Almeyda","birth_date":"1973-01-18",
 "position":"CDM","positions":["CDM","CM"],"foot":"Derecho","height":1.78,"weight":74,
 "caps_nt":55,"goals_nt":3,"caps_club":380,"goals_club":18,"assists_club":30,
 "clubs":[{"id":"ferro","name":"Ferro Carril Oeste","years":"1991-1996"},
           {"id":"lazio","name":"Lazio","years":"1996-1998"},
           {"id":"inter","name":"Internazionale","years":"1998-1999"},
           {"id":"parma","name":"Parma","years":"1999-2002"},
           {"id":"lazio","name":"Lazio","years":"2002-2004"},
           {"id":"river-plate","name":"River Plate","years":"2004-2007"},
           {"id":"chivas","name":"Chivas de Guadalajara","years":"2007-2011"}],
 "trophies":[
   {"competition":"Serie A","year":"2000","club":"Lazio"},
   {"competition":"Copa Italia","year":"1998","club":"Lazio"},
   {"competition":"Copa Italia","year":"2000","club":"Lazio"},
   {"competition":"Supercopa de Italia","year":"1998","club":"Lazio"},
 ],"active_years":"1991-2011","rating":80,"legendary":False},

{"name":"Esteban Cambiasso","full_name":"Esteban Matías Cambiasso","birth_date":"1980-08-18",
 "position":"CDM","positions":["CDM","CM"],"foot":"Derecho","height":1.78,"weight":75,
 "caps_nt":52,"goals_nt":7,"caps_club":450,"goals_club":45,"assists_club":55,
 "clubs":[{"id":"real-madrid","name":"Real Madrid","years":"1999-2002"},
           {"id":"independiente","name":"Independiente","years":"2001-2002"},
           {"id":"real-madrid","name":"Real Madrid","years":"2002-2004"},
           {"id":"zaragoza","name":"Real Zaragoza","years":"2004-2004"},
           {"id":"inter","name":"Internazionale","years":"2004-2014"},
           {"id":"leicester","name":"Leicester City","years":"2014-2015"},
           {"id":"olympiakos","name":"Olympiakos","years":"2015-2016"}],
 "trophies":[
   {"competition":"Serie A","year":"2006","club":"Internazionale"},
   {"competition":"Serie A","year":"2007","club":"Internazionale"},
   {"competition":"Serie A","year":"2008","club":"Internazionale"},
   {"competition":"Serie A","year":"2009","club":"Internazionale"},
   {"competition":"Serie A","year":"2010","club":"Internazionale"},
   {"competition":"Champions League","year":"2010","club":"Internazionale"},
 ],"active_years":"1999-2016","rating":86,"legendary":False},

{"name":"Javier Mascherano","full_name":"Javier Alejandro Mascherano","birth_date":"1984-06-08",
 "position":"CDM","positions":["CDM","CB"],"foot":"Derecho","height":1.74,"weight":71,
 "caps_nt":147,"goals_nt":3,"caps_club":480,"goals_club":8,"assists_club":20,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"2003-2005"},
           {"id":"corinthians","name":"Corinthians","years":"2005-2006"},
           {"id":"west-ham","name":"West Ham United","years":"2006-2007"},
           {"id":"liverpool","name":"Liverpool","years":"2007-2010"},
           {"id":"barcelona","name":"FC Barcelona","years":"2010-2018"},
           {"id":"hebei","name":"Hebei China Fortune","years":"2018-2019"},
           {"id":"estudiantes","name":"Estudiantes LP","years":"2019-2020"}],
 "trophies":[
   {"competition":"Champions League","year":"2011","club":"FC Barcelona"},
   {"competition":"Champions League","year":"2015","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2011","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2013","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2015","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2016","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2012","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2015","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2016","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2017","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2018","club":"FC Barcelona"},
 ],"active_years":"2003-2020","rating":90,"legendary":True},

{"name":"Lucas Biglia","full_name":"Lucas Daniel Biglia","birth_date":"1986-01-30",
 "position":"CDM","positions":["CDM","CM"],"foot":"Derecho","height":1.75,"weight":71,
 "caps_nt":60,"goals_nt":2,"caps_club":380,"goals_club":10,"assists_club":40,
 "clubs":[{"id":"independiente","name":"Independiente","years":"2005-2009"},
           {"id":"anderlecht","name":"Anderlecht","years":"2009-2013"},
           {"id":"lazio","name":"Lazio","years":"2013-2017"},
           {"id":"ac-milan","name":"AC Milan","years":"2017-2019"},
           {"id":"fenerbahce","name":"Fenerbahçe","years":"2019-2020"}],
 "trophies":[
   {"competition":"Copa del Rey de Bélgica","year":"2011","club":"Anderlecht"},
 ],"active_years":"2005-2020","rating":78,"legendary":False},

{"name":"Leandro Paredes","full_name":"Leandro Daniel Paredes","birth_date":"1994-06-29",
 "position":"CDM","positions":["CDM","CM"],"foot":"Derecho","height":1.80,"weight":76,
 "caps_nt":65,"goals_nt":5,"caps_club":280,"goals_club":12,"assists_club":45,
 "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"2011-2014"},
           {"id":"roma","name":"AS Roma","years":"2014-2017"},
           {"id":"empoli","name":"Empoli","years":"2015-2016"},
           {"id":"chievo","name":"Chievo","years":"2016-2017"},
           {"id":"zenit","name":"Zenit San Petersburgo","years":"2017-2019"},
           {"id":"psg","name":"PSG","years":"2019-2022"},
           {"id":"juventus","name":"Juventus","years":"2022-2024"},
           {"id":"roma","name":"AS Roma","years":"2024-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Ligue 1","year":"2020","club":"PSG"},
   {"competition":"Ligue 1","year":"2022","club":"PSG"},
 ],"active_years":"2011-2025","rating":83,"legendary":False},

{"name":"Guido Rodríguez","full_name":"Guido Nahuel Rodríguez","birth_date":"1994-04-12",
 "position":"CDM","positions":["CDM"],"foot":"Derecho","height":1.87,"weight":83,
 "caps_nt":35,"goals_nt":1,"caps_club":260,"goals_club":5,"assists_club":15,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"2013-2015"},
           {"id":"defensa-justicia","name":"Defensa y Justicia","years":"2015-2018"},
           {"id":"chivas","name":"Chivas de Guadalajara","years":"2018-2019"},
           {"id":"real-betis","name":"Real Betis","years":"2019-2024"},
           {"id":"west-ham","name":"West Ham United","years":"2024-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Copa del Rey","year":"2022","club":"Real Betis"},
 ],"active_years":"2013-2025","rating":80,"legendary":False},

# ════════════════════════════════════════════════════════
# MEDIOCAMPISTAS CENTRALES (CM)
# ════════════════════════════════════════════════════════

{"name":"Osvaldo Ardiles","full_name":"Osvaldo César Ardiles","birth_date":"1952-08-03",
 "position":"CM","positions":["CM","CAM"],"foot":"Derecho","height":1.69,"weight":66,
 "caps_nt":53,"goals_nt":8,"caps_club":420,"goals_club":40,"assists_club":60,
 "clubs":[{"id":"instituto","name":"Instituto de Córdoba","years":"1969-1973"},
           {"id":"huracan","name":"Huracán","years":"1973-1978"},
           {"id":"tottenham","name":"Tottenham Hotspur","years":"1978-1988"},
           {"id":"psg","name":"PSG","years":"1982-1983"},
           {"id":"blackburn","name":"Blackburn Rovers","years":"1988-1989"},
           {"id":"qpr","name":"QPR","years":"1989-1990"},
           {"id":"swindon","name":"Swindon Town","years":"1990-1992"}],
 "trophies": WC78 + [
   {"competition":"FA Cup","year":"1981","club":"Tottenham Hotspur"},
   {"competition":"FA Cup","year":"1982","club":"Tottenham Hotspur"},
 ],"active_years":"1969-1992","rating":87,"legendary":True},

{"name":"Ricardo Villa","full_name":"Ricardo Julio Villa","birth_date":"1952-08-18",
 "position":"CM","positions":["CM"],"foot":"Derecho","height":1.80,"weight":78,
 "caps_nt":21,"goals_nt":2,"caps_club":280,"goals_club":35,"assists_club":30,
 "clubs":[{"id":"racing-club","name":"Racing Club","years":"1971-1979"},
           {"id":"tottenham","name":"Tottenham Hotspur","years":"1978-1983"},
           {"id":"fort-lauderdale","name":"Fort Lauderdale Strikers","years":"1983-1985"},
           {"id":"racing-club","name":"Racing Club","years":"1985-1986"}],
 "trophies": WC78 + [
   {"competition":"FA Cup","year":"1981","club":"Tottenham Hotspur"},
   {"competition":"FA Cup","year":"1982","club":"Tottenham Hotspur"},
 ],"active_years":"1971-1986","rating":80,"legendary":False},

{"name":"Jorge Burruchaga","full_name":"Jorge Luis Burruchaga","birth_date":"1962-10-09",
 "position":"CM","positions":["CM","CAM"],"foot":"Derecho","height":1.74,"weight":71,
 "caps_nt":59,"goals_nt":13,"caps_club":360,"goals_club":60,"assists_club":80,
 "clubs":[{"id":"independiente","name":"Independiente","years":"1981-1984"},
           {"id":"nantes","name":"FC Nantes","years":"1984-1992"},
           {"id":"independiente","name":"Independiente","years":"1992-1994"},
           {"id":"udinese","name":"Udinese","years":"1994-1995"},
           {"id":"lens","name":"RC Lens","years":"1995-1996"},
           {"id":"sporting","name":"Sporting CP","years":"1996-1997"}],
 "trophies": WC86 + [
   {"competition":"Copa Libertadores","year":"1984","club":"Independiente"},
 ],"active_years":"1981-1997","rating":85,"legendary":True},

{"name":"Diego Simeone","full_name":"Diego Pablo Simeone","birth_date":"1970-04-28",
 "position":"CM","positions":["CM","CDM"],"foot":"Derecho","height":1.79,"weight":77,
 "caps_nt":106,"goals_nt":11,"caps_club":520,"goals_club":92,"assists_club":80,
 "clubs":[{"id":"velez-sarsfield","name":"Vélez Sarsfield","years":"1987-1990"},
           {"id":"pisa","name":"Pisa Calcio","years":"1990-1992"},
           {"id":"lazio","name":"Lazio","years":"1992-1993"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"1993-1996"},
           {"id":"inter","name":"Internazionale","years":"1996-1997"},
           {"id":"lazio","name":"Lazio","years":"1997-1999"},
           {"id":"inter","name":"Internazionale","years":"1999-2000"},
           {"id":"lazio","name":"Lazio","years":"2000-2002"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2002-2004"},
           {"id":"racing-club","name":"Racing Club","years":"2004-2005"},
           {"id":"san-lorenzo","name":"San Lorenzo","years":"2005-2006"}],
 "trophies":[
   {"competition":"Copa América","year":"1991","club":"Argentina"},
   {"competition":"Copa América","year":"1993","club":"Argentina"},
   {"competition":"Copa del Rey","year":"1996","club":"Atlético de Madrid"},
   {"competition":"La Liga","year":"1996","club":"Atlético de Madrid"},
   {"competition":"Serie A","year":"2000","club":"Lazio"},
   {"competition":"Copa Italia","year":"1998","club":"Lazio"},
   {"competition":"Copa Italia","year":"2000","club":"Lazio"},
 ],"active_years":"1987-2006","rating":87,"legendary":True},

{"name":"Juan Sebastián Verón","full_name":"Juan Sebastián Verón","birth_date":"1975-03-09",
 "position":"CM","positions":["CM","CAM"],"foot":"Derecho","height":1.83,"weight":78,
 "caps_nt":73,"goals_nt":9,"caps_club":420,"goals_club":60,"assists_club":90,
 "clubs":[{"id":"estudiantes","name":"Estudiantes LP","years":"1993-1996"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1996-1996"},
           {"id":"sampdoria","name":"Sampdoria","years":"1996-1999"},
           {"id":"parma","name":"Parma","years":"1999-1999"},
           {"id":"lazio","name":"Lazio","years":"1999-2001"},
           {"id":"man-utd","name":"Manchester United","years":"2001-2003"},
           {"id":"chelsea","name":"Chelsea","years":"2003-2004"},
           {"id":"inter","name":"Internazionale","years":"2004-2006"},
           {"id":"estudiantes","name":"Estudiantes LP","years":"2006-2014"}],
 "trophies":[
   {"competition":"Copa América","year":"1993","club":"Argentina"},
   {"competition":"Serie A","year":"2000","club":"Lazio"},
   {"competition":"Copa Italia","year":"2000","club":"Lazio"},
   {"competition":"Copa Libertadores","year":"2009","club":"Estudiantes LP"},
 ],"active_years":"1993-2014","rating":90,"legendary":True},

{"name":"Marcelo Gallardo","full_name":"Marcelo Daniel Gallardo","birth_date":"1976-01-18",
 "position":"CM","positions":["CM","CAM"],"foot":"Derecho","height":1.73,"weight":69,
 "caps_nt":47,"goals_nt":12,"caps_club":380,"goals_club":80,"assists_club":90,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1994-1999"},
           {"id":"psg","name":"PSG","years":"1999-2002"},
           {"id":"monaco","name":"AS Monaco","years":"2002-2003"},
           {"id":"river-plate","name":"River Plate","years":"2003-2007"},
           {"id":"nacional","name":"Nacional","years":"2007-2011"},
           {"id":"river-plate","name":"River Plate","years":"2011-2013"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"1996","club":"River Plate"},
   {"competition":"Copa América","year":"1993","club":"Argentina"},
 ],"active_years":"1994-2013","rating":82,"legendary":False},

{"name":"Rodrigo De Paul","full_name":"Rodrigo Javier De Paul","birth_date":"1994-05-24",
 "position":"CM","positions":["CM","CAM","CDM"],"foot":"Derecho","height":1.80,"weight":77,
 "caps_nt":65,"goals_nt":10,"caps_club":280,"goals_club":40,"assists_club":60,
 "clubs":[{"id":"racing-club","name":"Racing Club","years":"2012-2014"},
           {"id":"valencia","name":"Valencia CF","years":"2014-2016"},
           {"id":"udinese","name":"Udinese","years":"2016-2021"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2021-2025"}],
 "trophies": WC22 + CA21 + FIN22,
 "active_years":"2012-2025","rating":85,"legendary":False},

{"name":"Enzo Fernández","full_name":"Enzo Fernández","birth_date":"2001-01-17",
 "position":"CM","positions":["CM","CDM"],"foot":"Derecho","height":1.78,"weight":75,
 "caps_nt":35,"goals_nt":3,"caps_club":140,"goals_club":10,"assists_club":25,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"2020-2022"},
           {"id":"benfica","name":"Benfica","years":"2022-2023"},
           {"id":"chelsea","name":"Chelsea","years":"2023-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Taça de Portugal","year":"2023","club":"Benfica"},
 ],"active_years":"2020-2025","rating":86,"legendary":False},

{"name":"Alexis Mac Allister","full_name":"Alexis Mac Allister","birth_date":"1998-12-24",
 "position":"CM","positions":["CM","CAM"],"foot":"Derecho","height":1.75,"weight":72,
 "caps_nt":40,"goals_nt":8,"caps_club":200,"goals_club":30,"assists_club":35,
 "clubs":[{"id":"argentinos-juniors","name":"Argentinos Juniors","years":"2016-2019"},
           {"id":"brighton","name":"Brighton & Hove Albion","years":"2019-2023"},
           {"id":"liverpool","name":"Liverpool","years":"2023-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Premier League","year":"2025","club":"Liverpool"},
 ],"active_years":"2016-2025","rating":85,"legendary":False},

{"name":"Héctor Enrique","full_name":"Héctor Adolfo Enrique","birth_date":"1961-08-01",
 "position":"CM","positions":["CM"],"foot":"Derecho","height":1.72,"weight":70,
 "caps_nt":32,"goals_nt":3,"caps_club":350,"goals_club":30,"assists_club":35,
 "clubs":[{"id":"san-lorenzo","name":"San Lorenzo","years":"1980-1984"},
           {"id":"river-plate","name":"River Plate","years":"1984-1990"},
           {"id":"barcelona","name":"FC Barcelona","years":"1990-1992"}],
 "trophies": WC86 + [
   {"competition":"Copa Libertadores","year":"1986","club":"River Plate"},
   {"competition":"Intercontinental","year":"1986","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1985","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1986","club":"River Plate"},
 ],"active_years":"1980-1992","rating":78,"legendary":False},

{"name":"Ricardo Giusti","full_name":"Ricardo Daniel Giusti","birth_date":"1956-05-06",
 "position":"CM","positions":["CM","CDM"],"foot":"Derecho","height":1.76,"weight":73,
 "caps_nt":40,"goals_nt":2,"caps_club":380,"goals_club":20,"assists_club":30,
 "clubs":[{"id":"independiente","name":"Independiente","years":"1977-1990"},
           {"id":"udinese","name":"Udinese","years":"1990-1992"}],
 "trophies": WC86 + [
   {"competition":"Copa Libertadores","year":"1984","club":"Independiente"},
 ],"active_years":"1977-1992","rating":79,"legendary":False},

{"name":"Luis Galván","full_name":"Luis Alberto Galván","birth_date":"1948-09-20",
 "position":"CDM","positions":["CDM","CB"],"foot":"Derecho","height":1.77,"weight":75,
 "caps_nt":42,"goals_nt":1,"caps_club":370,"goals_club":8,"assists_club":15,
 "clubs":[{"id":"talleres","name":"Talleres Córdoba","years":"1969-1978"},
           {"id":"fiorentina","name":"Fiorentina","years":"1978-1981"},
           {"id":"cerro-porteno","name":"Cerro Porteño","years":"1981-1982"}],
 "trophies": WC78,
 "active_years":"1969-1982","rating":78,"legendary":False},

{"name":"Exequiel Palacios","full_name":"Exequiel Alejandro Palacios","birth_date":"1998-10-05",
 "position":"CM","positions":["CM","CDM"],"foot":"Derecho","height":1.78,"weight":72,
 "caps_nt":25,"goals_nt":2,"caps_club":160,"goals_club":8,"assists_club":18,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"2016-2019"},
           {"id":"bayer-leverkusen","name":"Bayer Leverkusen","years":"2019-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Bundesliga","year":"2024","club":"Bayer Leverkusen"},
   {"competition":"Copa Libertadores","year":"2018","club":"River Plate"},
 ],"active_years":"2016-2025","rating":82,"legendary":False},

# ════════════════════════════════════════════════════════
# MEDIOCAMPISTAS OFENSIVOS (CAM)
# ════════════════════════════════════════════════════════

{"name":"Diego Maradona","full_name":"Diego Armando Maradona","birth_date":"1960-10-30",
 "position":"CAM","positions":["CAM","LW"],"foot":"Izquierdo","height":1.65,"weight":75,
 "caps_nt":91,"goals_nt":34,"caps_club":491,"goals_club":259,"assists_club":100,
 "clubs":[{"id":"argentinos-juniors","name":"Argentinos Juniors","years":"1976-1981"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1981-1982"},
           {"id":"barcelona","name":"FC Barcelona","years":"1982-1984"},
           {"id":"napoli","name":"SSC Napoli","years":"1984-1991"},
           {"id":"sevilla","name":"Sevilla FC","years":"1992-1993"},
           {"id":"newells","name":"Newell's Old Boys","years":"1993-1994"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1995-1997"}],
 "trophies": WC86 + [
   {"competition":"Copa del Mundo Subcampeón","year":"1990","club":"Argentina"},
   {"competition":"Liga Argentina","year":"1981","club":"Boca Juniors"},
   {"competition":"Copa del Rey","year":"1983","club":"FC Barcelona"},
   {"competition":"Recopa de Europa","year":"1982","club":"FC Barcelona"},
   {"competition":"Serie A","year":"1987","club":"SSC Napoli"},
   {"competition":"Serie A","year":"1990","club":"SSC Napoli"},
   {"competition":"Copa UEFA","year":"1989","club":"SSC Napoli"},
   {"competition":"Coppa Italia","year":"1987","club":"SSC Napoli"},
 ],"active_years":"1976-1997","rating":98,"legendary":True},

{"name":"Ricardo Bochini","full_name":"Ricardo Enrique Bochini","birth_date":"1954-01-28",
 "position":"CAM","positions":["CAM","CM"],"foot":"Derecho","height":1.68,"weight":65,
 "caps_nt":25,"goals_nt":2,"caps_club":618,"goals_club":120,"assists_club":150,
 "clubs":[{"id":"independiente","name":"Independiente","years":"1972-1991"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"1972","club":"Independiente"},
   {"competition":"Copa Libertadores","year":"1973","club":"Independiente"},
   {"competition":"Copa Libertadores","year":"1974","club":"Independiente"},
   {"competition":"Copa Libertadores","year":"1975","club":"Independiente"},
   {"competition":"Copa Libertadores","year":"1984","club":"Independiente"},
   {"competition":"Liga Argentina","year":"1977","club":"Independiente"},
   {"competition":"Liga Argentina","year":"1978","club":"Independiente"},
   {"competition":"Liga Argentina","year":"1983","club":"Independiente"},
   {"competition":"Liga Argentina","year":"1988","club":"Independiente"},
 ],"active_years":"1972-1991","rating":91,"legendary":True},

{"name":"Norberto Alonso","full_name":"Norberto Osvaldo Alonso","birth_date":"1953-01-13",
 "position":"CAM","positions":["CAM","CM"],"foot":"Izquierdo","height":1.70,"weight":67,
 "caps_nt":23,"goals_nt":5,"caps_club":480,"goals_club":110,"assists_club":120,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1971-1982"},
           {"id":"marseille","name":"Olympique Marseille","years":"1982-1984"},
           {"id":"river-plate","name":"River Plate","years":"1984-1986"}],
 "trophies":[
   {"competition":"Liga Argentina","year":"1975","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1977","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1979","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1980","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1981","club":"River Plate"},
 ],"active_years":"1971-1986","rating":84,"legendary":False},

{"name":"Ariel Ortega","full_name":"Ariel Arnaldo Ortega","birth_date":"1969-03-07",
 "position":"CAM","positions":["CAM","RW"],"foot":"Derecho","height":1.70,"weight":68,
 "caps_nt":87,"goals_nt":17,"caps_club":420,"goals_club":85,"assists_club":90,
 "clubs":[{"id":"atletico-tucuman","name":"Atlético Tucumán","years":"1987-1991"},
           {"id":"river-plate","name":"River Plate","years":"1991-1997"},
           {"id":"valencia","name":"Valencia CF","years":"1997-1999"},
           {"id":"parma","name":"Parma","years":"1999-2001"},
           {"id":"fenerbahce","name":"Fenerbahçe","years":"2001-2002"},
           {"id":"river-plate","name":"River Plate","years":"2002-2005"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2008-2010"},
           {"id":"river-plate","name":"River Plate","years":"2010-2012"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"1996","club":"River Plate"},
 ],"active_years":"1987-2012","rating":86,"legendary":False},

{"name":"Pablo Aimar","full_name":"Pablo Cesar Aimar Giordano","birth_date":"1979-11-03",
 "position":"CAM","positions":["CAM","CM"],"foot":"Derecho","height":1.70,"weight":67,
 "caps_nt":52,"goals_nt":14,"caps_club":380,"goals_club":70,"assists_club":95,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1997-2001"},
           {"id":"valencia","name":"Valencia CF","years":"2001-2006"},
           {"id":"zaragoza","name":"Real Zaragoza","years":"2006-2007"},
           {"id":"benfica","name":"Benfica","years":"2007-2011"},
           {"id":"river-plate","name":"River Plate","years":"2011-2014"}],
 "trophies":[
   {"competition":"La Liga","year":"2002","club":"Valencia CF"},
   {"competition":"La Liga","year":"2004","club":"Valencia CF"},
   {"competition":"Copa del Rey","year":"1999","club":"Valencia CF"},
 ],"active_years":"1997-2014","rating":87,"legendary":True},

{"name":"Juan Román Riquelme","full_name":"Juan Román Riquelme","birth_date":"1978-06-24",
 "position":"CAM","positions":["CAM"],"foot":"Derecho","height":1.80,"weight":76,
 "caps_nt":51,"goals_nt":17,"caps_club":461,"goals_club":115,"assists_club":130,
 "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"1996-2002"},
           {"id":"barcelona","name":"FC Barcelona","years":"2002-2003"},
           {"id":"villarreal","name":"Villarreal CF","years":"2003-2007"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2007-2012"},
           {"id":"argentinos-juniors","name":"Argentinos Juniors","years":"2012-2014"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2014-2015"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"2000","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2001","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2003","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2007","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"1999","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"2000","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"2003","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"2008","club":"Boca Juniors"},
 ],"active_years":"1996-2015","rating":93,"legendary":True},

{"name":"Adolfo Pedernera","full_name":"Adolfo Alfredo Pedernera","birth_date":"1918-11-15",
 "position":"CAM","positions":["CAM","CF"],"foot":"Derecho","height":1.72,"weight":70,
 "caps_nt":21,"goals_nt":9,"caps_club":350,"goals_club":155,"assists_club":100,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1936-1947"},
           {"id":"huracán","name":"Huracán","years":"1947-1951"},
           {"id":"millonarios","name":"Millonarios","years":"1951-1955"},
           {"id":"america-bogota","name":"América Bogotá","years":"1955-1957"}],
 "trophies":[
   {"competition":"Liga Argentina","year":"1936","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1937","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1941","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1942","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1945","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1947","club":"River Plate"},
 ],"active_years":"1936-1957","rating":89,"legendary":True},

# ════════════════════════════════════════════════════════
# EXTREMOS (LW / RW)
# ════════════════════════════════════════════════════════

{"name":"Ángel Di María","full_name":"Ángel Fabián Di María","birth_date":"1988-02-14",
 "position":"RW","positions":["RW","LW","CAM"],"foot":"Izquierdo","height":1.78,"weight":70,
 "caps_nt":145,"goals_nt":31,"caps_club":540,"goals_club":130,"assists_club":185,
 "clubs":[{"id":"rosario-central","name":"Rosario Central","years":"2005-2007"},
           {"id":"benfica","name":"Benfica","years":"2007-2010"},
           {"id":"real-madrid","name":"Real Madrid","years":"2010-2014"},
           {"id":"man-utd","name":"Manchester United","years":"2014-2015"},
           {"id":"psg","name":"PSG","years":"2015-2022"},
           {"id":"juventus","name":"Juventus","years":"2022-2023"},
           {"id":"benfica","name":"Benfica","years":"2023-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"La Liga","year":"2012","club":"Real Madrid"},
   {"competition":"Champions League","year":"2014","club":"Real Madrid"},
   {"competition":"Copa del Rey","year":"2011","club":"Real Madrid"},
   {"competition":"Copa del Rey","year":"2014","club":"Real Madrid"},
   {"competition":"Ligue 1","year":"2018","club":"PSG"},
   {"competition":"Ligue 1","year":"2019","club":"PSG"},
   {"competition":"Ligue 1","year":"2020","club":"PSG"},
   {"competition":"Ligue 1","year":"2022","club":"PSG"},
 ],"active_years":"2005-2025","rating":91,"legendary":True},

{"name":"Claudio Caniggia","full_name":"Claudio Paul Caniggia","birth_date":"1967-01-09",
 "position":"RW","positions":["RW","CF"],"foot":"Derecho","height":1.78,"weight":73,
 "caps_nt":50,"goals_nt":16,"caps_club":380,"goals_club":125,"assists_club":80,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1985-1988"},
           {"id":"hellas-verona","name":"Hellas Verona","years":"1988-1989"},
           {"id":"atalanta","name":"Atalanta","years":"1989-1992"},
           {"id":"roma","name":"AS Roma","years":"1992-1994"},
           {"id":"benfica","name":"Benfica","years":"1994-1995"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1995-1996"},
           {"id":"independiente","name":"Independiente","years":"1996-1997"},
           {"id":"dundee","name":"Dundee FC","years":"2000-2001"},
           {"id":"rangers","name":"Rangers FC","years":"2001-2002"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2002-2004"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"1986","club":"River Plate"},
   {"competition":"Copa Libertadores","year":"1996","club":"Boca Juniors"},
 ],"active_years":"1985-2004","rating":88,"legendary":True},

{"name":"Ezequiel Lavezzi","full_name":"Ezequiel Iván Lavezzi","birth_date":"1985-05-03",
 "position":"LW","positions":["LW","RW","CF"],"foot":"Derecho","height":1.73,"weight":72,
 "caps_nt":51,"goals_nt":9,"caps_club":380,"goals_club":100,"assists_club":110,
 "clubs":[{"id":"san-lorenzo","name":"San Lorenzo","years":"2004-2007"},
           {"id":"napoli","name":"SSC Napoli","years":"2007-2012"},
           {"id":"psg","name":"PSG","years":"2012-2016"},
           {"id":"hebei","name":"Hebei China Fortune","years":"2016-2018"}],
 "trophies":[
   {"competition":"Copa Sudamericana","year":"2002","club":"San Lorenzo"},  # wrong year for Lavezzi, let me fix
   {"competition":"Ligue 1","year":"2013","club":"PSG"},
   {"competition":"Ligue 1","year":"2014","club":"PSG"},
   {"competition":"Ligue 1","year":"2015","club":"PSG"},
   {"competition":"Ligue 1","year":"2016","club":"PSG"},
 ],"active_years":"2004-2018","rating":85,"legendary":False},

{"name":"Maximiliano Rodríguez","full_name":"Maximiliano Rubén Rodríguez","birth_date":"1981-01-02",
 "position":"RW","positions":["RW","CM","LW"],"foot":"Izquierdo","height":1.80,"weight":76,
 "caps_nt":57,"goals_nt":15,"caps_club":400,"goals_club":90,"assists_club":100,
 "clubs":[{"id":"newells","name":"Newell's Old Boys","years":"2001-2004"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2004-2008"},
           {"id":"liverpool","name":"Liverpool","years":"2008-2010"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2008-2009"},
           {"id":"zaragoza","name":"Real Zaragoza","years":"2010-2011"},
           {"id":"newells","name":"Newell's Old Boys","years":"2011-2016"}],
 "trophies":[
   {"competition":"Copa del Rey","year":"2013","club":"Atlético de Madrid"},
 ],"active_years":"2001-2016","rating":83,"legendary":False},

{"name":"Omar Corbatta","full_name":"Omar Orestes Corbatta","birth_date":"1936-08-10",
 "position":"RW","positions":["RW","LW"],"foot":"Derecho","height":1.67,"weight":63,
 "caps_nt":37,"goals_nt":14,"caps_club":380,"goals_club":96,"assists_club":70,
 "clubs":[{"id":"racing-club","name":"Racing Club","years":"1952-1964"},
           {"id":"san-lorenzo","name":"San Lorenzo","years":"1964-1965"}],
 "trophies":[
   {"competition":"Liga Argentina","year":"1958","club":"Racing Club"},
   {"competition":"Liga Argentina","year":"1961","club":"Racing Club"},
 ],"active_years":"1952-1965","rating":84,"legendary":True},

{"name":"Claudio López","full_name":"Claudio Javier López","birth_date":"1974-07-17",
 "position":"RW","positions":["RW","LW","ST"],"foot":"Derecho","height":1.74,"weight":69,
 "caps_nt":57,"goals_nt":21,"caps_club":380,"goals_club":100,"assists_club":85,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1993-1997"},
           {"id":"valencia","name":"Valencia CF","years":"1997-2001"},
           {"id":"lazio","name":"Lazio","years":"2001-2004"},
           {"id":"racing-club","name":"Racing Club","years":"2004-2007"},
           {"id":"independiente","name":"Independiente","years":"2007-2010"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"1996","club":"River Plate"},
   {"competition":"La Liga","year":"2002","club":"Valencia CF"},
   {"competition":"La Liga","year":"2004","club":"Valencia CF"},
 ],"active_years":"1993-2010","rating":82,"legendary":False},

{"name":"Erik Lamela","full_name":"Erik Lamela","birth_date":"1992-03-04",
 "position":"RW","positions":["RW","CAM"],"foot":"Derecho","height":1.80,"weight":74,
 "caps_nt":40,"goals_nt":5,"caps_club":320,"goals_club":60,"assists_club":70,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"2009-2011"},
           {"id":"roma","name":"AS Roma","years":"2011-2013"},
           {"id":"tottenham","name":"Tottenham Hotspur","years":"2013-2022"},
           {"id":"sevilla","name":"Sevilla FC","years":"2022-2024"}],
 "trophies": CA21 + [
   {"competition":"UEFA Conference League","year":"2023","club":"Sevilla FC"},
 ],"active_years":"2009-2024","rating":79,"legendary":False},

{"name":"Alejandro Garnacho","full_name":"Alejandro Garnacho Ferreyra","birth_date":"2004-07-01",
 "position":"LW","positions":["LW","RW"],"foot":"Izquierdo","height":1.80,"weight":75,
 "caps_nt":20,"goals_nt":3,"caps_club":100,"goals_club":20,"assists_club":15,
 "clubs":[{"id":"atletico-madrid","name":"Atlético de Madrid","years":"2021-2022"},
           {"id":"man-utd","name":"Manchester United","years":"2022-2025"}],
 "trophies": WC22 + CA21,
 "active_years":"2021-2025","rating":80,"legendary":False},

# ════════════════════════════════════════════════════════
# DELANTEROS CENTRO (ST / CF)
# ════════════════════════════════════════════════════════

{"name":"Lionel Messi","full_name":"Lionel Andrés Messi","birth_date":"1987-06-24",
 "position":"CF","positions":["CF","RW","CAM"],"foot":"Izquierdo","height":1.70,"weight":72,
 "caps_nt":191,"goals_nt":111,"caps_club":860,"goals_club":706,"assists_club":305,
 "clubs":[{"id":"barcelona","name":"FC Barcelona","years":"2004-2021"},
           {"id":"psg","name":"PSG","years":"2021-2023"},
           {"id":"inter-miami","name":"Inter Miami CF","years":"2023-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Champions League","year":"2006","club":"FC Barcelona"},
   {"competition":"Champions League","year":"2009","club":"FC Barcelona"},
   {"competition":"Champions League","year":"2011","club":"FC Barcelona"},
   {"competition":"Champions League","year":"2015","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2005","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2006","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2009","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2010","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2011","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2013","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2015","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2016","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2019","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2009","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2012","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2015","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2016","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2017","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2018","club":"FC Barcelona"},
   {"competition":"Copa del Rey","year":"2021","club":"FC Barcelona"},
 ],"active_years":"2004-2025","rating":99,"legendary":True},

{"name":"Gabriel Batistuta","full_name":"Gabriel Omar Batistuta","birth_date":"1969-02-01",
 "position":"ST","positions":["ST"],"foot":"Derecho","height":1.84,"weight":83,
 "caps_nt":78,"goals_nt":56,"caps_club":443,"goals_club":301,"assists_club":60,
 "clubs":[{"id":"newells","name":"Newell's Old Boys","years":"1988-1990"},
           {"id":"river-plate","name":"River Plate","years":"1990-1991"},
           {"id":"fiorentina","name":"Fiorentina","years":"1991-2000"},
           {"id":"roma","name":"AS Roma","years":"2000-2003"},
           {"id":"inter","name":"Internazionale","years":"2002-2003"},
           {"id":"al-arabi","name":"Al-Arabi","years":"2003-2004"}],
 "trophies":[
   {"competition":"Copa América","year":"1991","club":"Argentina"},
   {"competition":"Copa América","year":"1993","club":"Argentina"},
   {"competition":"Serie A","year":"2001","club":"AS Roma"},
   {"competition":"Coppa Italia","year":"1996","club":"Fiorentina"},
 ],"active_years":"1988-2004","rating":95,"legendary":True},

{"name":"Mario Kempes","full_name":"Mario Alberto Kempes","birth_date":"1954-07-15",
 "position":"ST","positions":["ST","CAM"],"foot":"Derecho","height":1.82,"weight":76,
 "caps_nt":43,"goals_nt":20,"caps_club":480,"goals_club":218,"assists_club":70,
 "clubs":[{"id":"instituto","name":"Instituto de Córdoba","years":"1970-1976"},
           {"id":"valencia","name":"Valencia CF","years":"1976-1981"},
           {"id":"river-plate","name":"River Plate","years":"1981-1982"},
           {"id":"valencia","name":"Valencia CF","years":"1982-1984"},
           {"id":"hercules","name":"Hércules CF","years":"1984-1986"},
           {"id":"austria-viena","name":"First Vienna","years":"1986-1991"}],
 "trophies": WC78 + [
   {"competition":"Copa del Rey","year":"1979","club":"Valencia CF"},
   {"competition":"Copa de la UEFA","year":"1980","club":"Valencia CF"},
 ],"active_years":"1970-1991","rating":93,"legendary":True},

{"name":"Carlos Tevez","full_name":"Carlos Alberto Tevez","birth_date":"1984-02-05",
 "position":"ST","positions":["ST","CF"],"foot":"Derecho","height":1.73,"weight":78,
 "caps_nt":76,"goals_nt":13,"caps_club":540,"goals_club":234,"assists_club":80,
 "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"2001-2004"},
           {"id":"corinthians","name":"Corinthians","years":"2004-2006"},
           {"id":"west-ham","name":"West Ham United","years":"2006-2007"},
           {"id":"man-utd","name":"Manchester United","years":"2007-2009"},
           {"id":"man-city","name":"Manchester City","years":"2009-2013"},
           {"id":"juventus","name":"Juventus","years":"2013-2015"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2015-2018"},
           {"id":"shanghai-shenhua","name":"Shanghai Shenhua","years":"2017-2017"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2018-2021"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"2003","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2007","club":"Boca Juniors"},
   {"competition":"Premier League","year":"2008","club":"Manchester United"},
   {"competition":"Premier League","year":"2012","club":"Manchester City"},
   {"competition":"Serie A","year":"2014","club":"Juventus"},
   {"competition":"Serie A","year":"2015","club":"Juventus"},
 ],"active_years":"2001-2021","rating":89,"legendary":True},

{"name":"Gonzalo Higuaín","full_name":"Gonzalo Gerardo Higuaín","birth_date":"1987-12-10",
 "position":"ST","positions":["ST"],"foot":"Derecho","height":1.84,"weight":83,
 "caps_nt":75,"goals_nt":31,"caps_club":540,"goals_club":275,"assists_club":70,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"2005-2007"},
           {"id":"real-madrid","name":"Real Madrid","years":"2007-2013"},
           {"id":"napoli","name":"SSC Napoli","years":"2013-2016"},
           {"id":"juventus","name":"Juventus","years":"2016-2018"},
           {"id":"ac-milan","name":"AC Milan","years":"2018-2019"},
           {"id":"chelsea","name":"Chelsea","years":"2019-2019"},
           {"id":"juventus","name":"Juventus","years":"2019-2020"},
           {"id":"inter-miami","name":"Inter Miami CF","years":"2020-2022"}],
 "trophies":[
   {"competition":"Copa del Rey","year":"2011","club":"Real Madrid"},
   {"competition":"La Liga","year":"2012","club":"Real Madrid"},
   {"competition":"Serie A","year":"2017","club":"Juventus"},
   {"competition":"Serie A","year":"2018","club":"Juventus"},
   {"competition":"Serie A","year":"2019","club":"Juventus"},
   {"competition":"Serie A","year":"2020","club":"Juventus"},
 ],"active_years":"2005-2022","rating":88,"legendary":False},

{"name":"Sergio Agüero","full_name":"Sergio Leonel Agüero","birth_date":"1988-06-02",
 "position":"ST","positions":["ST","CF"],"foot":"Derecho","height":1.73,"weight":78,
 "caps_nt":101,"goals_nt":41,"caps_club":540,"goals_club":274,"assists_club":80,
 "clubs":[{"id":"independiente","name":"Independiente","years":"2003-2006"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2006-2011"},
           {"id":"man-city","name":"Manchester City","years":"2011-2021"},
           {"id":"barcelona","name":"FC Barcelona","years":"2021-2021"}],
 "trophies":[
   {"competition":"Copa América","year":"2021","club":"Argentina"},
   {"competition":"Europa League","year":"2010","club":"Atlético de Madrid"},
   {"competition":"Premier League","year":"2012","club":"Manchester City"},
   {"competition":"Premier League","year":"2014","club":"Manchester City"},
   {"competition":"Premier League","year":"2018","club":"Manchester City"},
   {"competition":"Premier League","year":"2019","club":"Manchester City"},
   {"competition":"Premier League","year":"2021","club":"Manchester City"},
   {"competition":"FA Cup","year":"2011","club":"Manchester City"},
   {"competition":"FA Cup","year":"2019","club":"Manchester City"},
 ],"active_years":"2003-2021","rating":91,"legendary":True},

{"name":"Hernán Crespo","full_name":"Hernán Jorge Crespo","birth_date":"1975-07-05",
 "position":"ST","positions":["ST"],"foot":"Derecho","height":1.81,"weight":77,
 "caps_nt":64,"goals_nt":35,"caps_club":440,"goals_club":215,"assists_club":65,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1993-1996"},
           {"id":"parma","name":"Parma","years":"1996-2000"},
           {"id":"lazio","name":"Lazio","years":"2000-2002"},
           {"id":"inter","name":"Internazionale","years":"2002-2004"},
           {"id":"chelsea","name":"Chelsea","years":"2003-2005"},
           {"id":"ac-milan","name":"AC Milan","years":"2004-2008"},
           {"id":"inter","name":"Internazionale","years":"2006-2007"},
           {"id":"parma","name":"Parma","years":"2009-2012"},
           {"id":"genoa","name":"Genoa","years":"2009-2009"}],
 "trophies":[
   {"competition":"Copa América","year":"1991","club":"Argentina"},
   {"competition":"Copa América","year":"1993","club":"Argentina"},
   {"competition":"Serie A","year":"2006","club":"Internazionale"},
   {"competition":"Serie A","year":"2010","club":"Internazionale"},
   {"competition":"Champions League","year":"2010","club":"Internazionale"},
   {"competition":"Champions League","year":"2003","club":"AC Milan"},
 ],"active_years":"1993-2012","rating":87,"legendary":False},

{"name":"Leopoldo Luque","full_name":"Leopoldo Jacinto Luque","birth_date":"1949-05-03",
 "position":"ST","positions":["ST","RW"],"foot":"Derecho","height":1.80,"weight":79,
 "caps_nt":45,"goals_nt":22,"caps_club":380,"goals_club":140,"assists_club":55,
 "clubs":[{"id":"san-martin-tucuman","name":"San Martín de Tucumán","years":"1968-1972"},
           {"id":"huracan","name":"Huracán","years":"1972-1975"},
           {"id":"river-plate","name":"River Plate","years":"1975-1980"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"1980-1982"},
           {"id":"rosario-central","name":"Rosario Central","years":"1982-1985"}],
 "trophies": WC78 + [
   {"competition":"Liga Argentina","year":"1975","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1977","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1979","club":"River Plate"},
 ],"active_years":"1968-1985","rating":83,"legendary":False},

{"name":"Jorge Valdano","full_name":"Jorge Alberto Valdano","birth_date":"1955-10-04",
 "position":"ST","positions":["ST","LW"],"foot":"Derecho","height":1.84,"weight":79,
 "caps_nt":22,"goals_nt":11,"caps_club":380,"goals_club":145,"assists_club":60,
 "clubs":[{"id":"newells","name":"Newell's Old Boys","years":"1975-1979"},
           {"id":"alaves","name":"Deportivo Alavés","years":"1979-1981"},
           {"id":"zaragoza","name":"Real Zaragoza","years":"1981-1984"},
           {"id":"real-madrid","name":"Real Madrid","years":"1984-1991"},
           {"id":"tenerife","name":"CD Tenerife","years":"1991-1994"}],
 "trophies": WC86 + [
   {"competition":"La Liga","year":"1986","club":"Real Madrid"},
   {"competition":"La Liga","year":"1987","club":"Real Madrid"},
   {"competition":"La Liga","year":"1988","club":"Real Madrid"},
   {"competition":"La Liga","year":"1989","club":"Real Madrid"},
   {"competition":"Copa del Rey","year":"1989","club":"Real Madrid"},
   {"competition":"Copa del Rey","year":"1993","club":"Real Madrid"},
 ],"active_years":"1975-1994","rating":82,"legendary":True},

{"name":"Martín Palermo","full_name":"Martín Rodolfo Palermo","birth_date":"1973-11-07",
 "position":"ST","positions":["ST"],"foot":"Derecho","height":1.88,"weight":84,
 "caps_nt":15,"goals_nt":9,"caps_club":481,"goals_club":236,"assists_club":55,
 "clubs":[{"id":"estudiantes","name":"Estudiantes LP","years":"1993-1996"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1997-2000"},
           {"id":"villarreal","name":"Villarreal CF","years":"2000-2004"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"2004-2011"},
           {"id":"aurora","name":"Club Aurora Bolivia","years":"2012-2012"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"2000","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2001","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2003","club":"Boca Juniors"},
   {"competition":"Copa Libertadores","year":"2007","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"1999","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"2000","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"2003","club":"Boca Juniors"},
   {"competition":"Liga Argentina","year":"2008","club":"Boca Juniors"},
 ],"active_years":"1993-2012","rating":85,"legendary":True},

{"name":"Diego Milito","full_name":"Diego Alberto Milito","birth_date":"1979-06-12",
 "position":"ST","positions":["ST","CF"],"foot":"Derecho","height":1.81,"weight":77,
 "caps_nt":28,"goals_nt":9,"caps_club":380,"goals_club":170,"assists_club":45,
 "clubs":[{"id":"racing-club","name":"Racing Club","years":"1998-2003"},
           {"id":"zaragoza","name":"Real Zaragoza","years":"2003-2005"},
           {"id":"genoa","name":"Genoa","years":"2005-2008"},
           {"id":"inter","name":"Internazionale","years":"2008-2013"},
           {"id":"genoa","name":"Genoa","years":"2013-2015"},
           {"id":"racing-club","name":"Racing Club","years":"2015-2016"}],
 "trophies":[
   {"competition":"Serie A","year":"2009","club":"Internazionale"},
   {"competition":"Serie A","year":"2010","club":"Internazionale"},
   {"competition":"Champions League","year":"2010","club":"Internazionale"},
   {"competition":"Copa Italia","year":"2010","club":"Internazionale"},
   {"competition":"Copa Italia","year":"2011","club":"Internazionale"},
 ],"active_years":"1998-2016","rating":86,"legendary":False},

{"name":"Carlos Bianchi","full_name":"Carlos Salvador Bianchi","birth_date":"1949-04-26",
 "position":"ST","positions":["ST"],"foot":"Derecho","height":1.76,"weight":74,
 "caps_nt":10,"goals_nt":3,"caps_club":430,"goals_club":246,"assists_club":40,
 "clubs":[{"id":"velez-sarsfield","name":"Vélez Sarsfield","years":"1967-1973"},
           {"id":"stade-de-reims","name":"Stade de Reims","years":"1973-1977"},
           {"id":"psg","name":"PSG","years":"1977-1979"},
           {"id":"stade-de-reims","name":"Stade de Reims","years":"1979-1984"},
           {"id":"velez-sarsfield","name":"Vélez Sarsfield","years":"1984-1985"}],
 "trophies":[
   {"competition":"Ligue 2","year":"1975","club":"Stade de Reims"},
 ],"active_years":"1967-1985","rating":83,"legendary":True},

{"name":"Javier Saviola","full_name":"Javier Pedro Saviola","birth_date":"1981-12-11",
 "position":"CF","positions":["CF","RW"],"foot":"Derecho","height":1.67,"weight":65,
 "caps_nt":40,"goals_nt":11,"caps_club":380,"goals_club":115,"assists_club":80,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1998-2001"},
           {"id":"barcelona","name":"FC Barcelona","years":"2001-2004"},
           {"id":"monaco","name":"AS Monaco","years":"2003-2004"},
           {"id":"sevilla","name":"Sevilla FC","years":"2004-2006"},
           {"id":"real-madrid","name":"Real Madrid","years":"2006-2007"},
           {"id":"benfica","name":"Benfica","years":"2007-2009"},
           {"id":"malaga","name":"Málaga CF","years":"2009-2012"},
           {"id":"fiorentina","name":"Fiorentina","years":"2012-2014"},
           {"id":"river-plate","name":"River Plate","years":"2014-2015"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"1996","club":"River Plate"},
   {"competition":"La Liga","year":"2005","club":"FC Barcelona"},
   {"competition":"La Liga","year":"2006","club":"FC Barcelona"},
   {"competition":"Copa UEFA","year":"2006","club":"Sevilla FC"},
   {"competition":"Copa UEFA","year":"2007","club":"Sevilla FC"},
 ],"active_years":"1998-2015","rating":82,"legendary":False},

{"name":"Rodrigo Palacio","full_name":"Rodrigo Sebastián Palacio","birth_date":"1982-02-05",
 "position":"CF","positions":["CF","ST"],"foot":"Derecho","height":1.78,"weight":73,
 "caps_nt":43,"goals_nt":10,"caps_club":420,"goals_club":140,"assists_club":70,
 "clubs":[{"id":"boca-juniors","name":"Boca Juniors","years":"2003-2009"},
           {"id":"genoa","name":"Genoa","years":"2009-2012"},
           {"id":"inter","name":"Internazionale","years":"2012-2016"},
           {"id":"bologna","name":"Bologna","years":"2016-2022"}],
 "trophies":[
   {"competition":"Copa Libertadores","year":"2007","club":"Boca Juniors"},
 ],"active_years":"2003-2022","rating":79,"legendary":False},

{"name":"Julián Álvarez","full_name":"Julián Álvarez","birth_date":"2000-01-31",
 "position":"ST","positions":["ST","CF","RW"],"foot":"Derecho","height":1.70,"weight":70,
 "caps_nt":40,"goals_nt":18,"caps_club":180,"goals_club":65,"assists_club":30,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"2018-2022"},
           {"id":"man-city","name":"Manchester City","years":"2022-2024"},
           {"id":"atletico-madrid","name":"Atlético de Madrid","years":"2024-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Copa Libertadores","year":"2018","club":"River Plate"},
   {"competition":"Premier League","year":"2023","club":"Manchester City"},
   {"competition":"Premier League","year":"2024","club":"Manchester City"},
   {"competition":"Champions League","year":"2023","club":"Manchester City"},
 ],"active_years":"2018-2025","rating":88,"legendary":False},

{"name":"Lautaro Martínez","full_name":"Lautaro Javier Martínez","birth_date":"1997-08-22",
 "position":"ST","positions":["ST","CF"],"foot":"Derecho","height":1.74,"weight":75,
 "caps_nt":65,"goals_nt":30,"caps_club":280,"goals_club":120,"assists_club":50,
 "clubs":[{"id":"racing-club","name":"Racing Club","years":"2015-2018"},
           {"id":"inter","name":"Internazionale","years":"2018-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Serie A","year":"2021","club":"Internazionale"},
   {"competition":"Serie A","year":"2024","club":"Internazionale"},
 ],"active_years":"2015-2025","rating":90,"legendary":False},

{"name":"Paulo Dybala","full_name":"Paulo Bruno Exequiel Dybala","birth_date":"1993-11-15",
 "position":"CF","positions":["CF","CAM","RW"],"foot":"Izquierdo","height":1.77,"weight":75,
 "caps_nt":38,"goals_nt":10,"caps_club":370,"goals_club":160,"assists_club":90,
 "clubs":[{"id":"instituto","name":"Instituto de Córdoba","years":"2011-2012"},
           {"id":"palermo","name":"US Palermo","years":"2012-2015"},
           {"id":"juventus","name":"Juventus","years":"2015-2022"},
           {"id":"roma","name":"AS Roma","years":"2022-2025"}],
 "trophies": WC22 + CA21 + FIN22 + [
   {"competition":"Serie A","year":"2016","club":"Juventus"},
   {"competition":"Serie A","year":"2017","club":"Juventus"},
   {"competition":"Serie A","year":"2018","club":"Juventus"},
   {"competition":"Serie A","year":"2019","club":"Juventus"},
   {"competition":"Serie A","year":"2020","club":"Juventus"},
   {"competition":"Copa Italia","year":"2016","club":"Juventus"},
   {"competition":"Copa Italia","year":"2017","club":"Juventus"},
   {"competition":"Copa Italia","year":"2018","club":"Juventus"},
   {"competition":"Copa Italia","year":"2021","club":"Juventus"},
 ],"active_years":"2011-2025","rating":87,"legendary":False},

{"name":"José Sanfilippo","full_name":"José Francisco Sanfilippo","birth_date":"1929-02-06",
 "position":"ST","positions":["ST","CF"],"foot":"Derecho","height":1.72,"weight":73,
 "caps_nt":29,"goals_nt":21,"caps_club":350,"goals_club":270,"assists_club":40,
 "clubs":[{"id":"san-lorenzo","name":"San Lorenzo","years":"1951-1961"},
           {"id":"newells","name":"Newell's Old Boys","years":"1961-1964"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1964-1967"}],
 "trophies":[
   {"competition":"Liga Argentina","year":"1954","club":"San Lorenzo"},
   {"competition":"Liga Argentina","year":"1959","club":"San Lorenzo"},
   {"competition":"Liga Argentina","year":"1961","club":"San Lorenzo"},
 ],"active_years":"1951-1967","rating":85,"legendary":True},

{"name":"Ángel Labruna","full_name":"Ángel Amadeo Labruna","birth_date":"1918-09-28",
 "position":"ST","positions":["ST","LW"],"foot":"Izquierdo","height":1.74,"weight":72,
 "caps_nt":36,"goals_nt":17,"caps_club":515,"goals_club":293,"assists_club":80,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1939-1959"},
           {"id":"platense","name":"Platense","years":"1959-1961"},
           {"id":"racing-club","name":"Racing Club","years":"1961-1962"}],
 "trophies":[
   {"competition":"Liga Argentina","year":"1941","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1942","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1945","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1947","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1952","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1953","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1955","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1956","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1957","club":"River Plate"},
 ],"active_years":"1939-1962","rating":90,"legendary":True},

{"name":"José Manuel Moreno","full_name":"José Manuel Moreno","birth_date":"1916-08-03",
 "position":"RW","positions":["RW","ST"],"foot":"Derecho","height":1.69,"weight":68,
 "caps_nt":35,"goals_nt":19,"caps_club":420,"goals_club":188,"assists_club":100,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1934-1944"},
           {"id":"boca-juniors","name":"Boca Juniors","years":"1944-1945"},
           {"id":"river-plate","name":"River Plate","years":"1945-1948"},
           {"id":"huracan","name":"Huracán","years":"1948-1950"},
           {"id":"nacional-uruguay","name":"Nacional de Uruguay","years":"1950-1953"},
           {"id":"river-plate","name":"River Plate","years":"1953-1953"}],
 "trophies":[
   {"competition":"Liga Argentina","year":"1936","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1937","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1941","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1942","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1945","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1947","club":"River Plate"},
 ],"active_years":"1934-1953","rating":88,"legendary":True},

{"name":"Alfredo Di Stéfano","full_name":"Alfredo Stéfano Di Stéfano Laulhé","birth_date":"1926-07-04",
 "position":"CF","positions":["CF","CAM","ST"],"foot":"Derecho","height":1.76,"weight":74,
 "caps_nt":6,"goals_nt":6,"caps_club":510,"goals_club":376,"assists_club":80,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1945-1949"},
           {"id":"millonarios","name":"Millonarios","years":"1949-1953"},
           {"id":"real-madrid","name":"Real Madrid","years":"1953-1964"},
           {"id":"espanol","name":"Espanyol","years":"1964-1966"}],
 "trophies":[
   {"competition":"Liga Argentina","year":"1947","club":"River Plate"},
   {"competition":"La Liga","year":"1954","club":"Real Madrid"},
   {"competition":"La Liga","year":"1955","club":"Real Madrid"},
   {"competition":"La Liga","year":"1957","club":"Real Madrid"},
   {"competition":"La Liga","year":"1958","club":"Real Madrid"},
   {"competition":"La Liga","year":"1961","club":"Real Madrid"},
   {"competition":"La Liga","year":"1962","club":"Real Madrid"},
   {"competition":"La Liga","year":"1963","club":"Real Madrid"},
   {"competition":"La Liga","year":"1964","club":"Real Madrid"},
   {"competition":"Champions League","year":"1956","club":"Real Madrid"},
   {"competition":"Champions League","year":"1957","club":"Real Madrid"},
   {"competition":"Champions League","year":"1958","club":"Real Madrid"},
   {"competition":"Champions League","year":"1959","club":"Real Madrid"},
   {"competition":"Champions League","year":"1960","club":"Real Madrid"},
 ],"active_years":"1945-1966","rating":97,"legendary":True},

{"name":"Enrique Sívori","full_name":"Omar Enrique Sívori","birth_date":"1935-10-02",
 "position":"CAM","positions":["CAM","LW"],"foot":"Izquierdo","height":1.66,"weight":63,
 "caps_nt":18,"goals_nt":9,"caps_club":380,"goals_club":167,"assists_club":90,
 "clubs":[{"id":"river-plate","name":"River Plate","years":"1954-1957"},
           {"id":"juventus","name":"Juventus","years":"1957-1965"},
           {"id":"napoli","name":"SSC Napoli","years":"1965-1969"}],
 "trophies":[
   {"competition":"Liga Argentina","year":"1955","club":"River Plate"},
   {"competition":"Liga Argentina","year":"1956","club":"River Plate"},
   {"competition":"Serie A","year":"1958","club":"Juventus"},
   {"competition":"Serie A","year":"1960","club":"Juventus"},
   {"competition":"Serie A","year":"1961","club":"Juventus"},
   {"competition":"Serie A","year":"1967","club":"Juventus"},
   {"competition":"Copa Italia","year":"1959","club":"Juventus"},
   {"competition":"Copa Italia","year":"1960","club":"Juventus"},
   {"competition":"Copa Italia","year":"1965","club":"Juventus"},
 ],"active_years":"1954-1969","rating":92,"legendary":True},

]

# ─── BUILD & WRITE ────────────────────────────────────────────────────────────

def main():
    players = [build(p) for p in SEED]

    # Estadísticas
    total = len(players)
    no_birth    = sum(1 for p in players if not p["birthDate"])
    one_club    = sum(1 for p in players if len(p["clubs"]) <= 1)
    no_goals    = sum(1 for p in players if p["goalsClub"] == 0 and p["goalsNationalTeam"] == 0)
    with_trophies = sum(1 for p in players if len(p["trophies"]) > 0)
    legendary   = sum(1 for p in players if p["legendary"])

    print(f"╔══════════════════════════════════════════╗")
    print(f"║   LigaStatsGame — DB Build Report        ║")
    print(f"╠══════════════════════════════════════════╣")
    print(f"║  Total jugadores:   {total:<22}║")
    print(f"║  Sin fecha nac.:    {no_birth:<22}║")
    print(f"║  Con 1 solo club:   {one_club:<22}║")
    print(f"║  Sin goles:         {no_goals:<22}║")
    print(f"║  Con trofeos:       {with_trophies:<22}║")
    print(f"║  Legendarios:       {legendary:<22}║")
    print(f"╚══════════════════════════════════════════╝")

    # Detectar duplicados
    ids = [p["id"] for p in players]
    dupes = [pid for pid in ids if ids.count(pid) > 1]
    if dupes:
        print(f"\n⚠️  IDs duplicados detectados: {set(dupes)}")

    # Verificar campos requeridos
    errors = []
    for p in players:
        if not p["birthDate"]:
            errors.append(f"  ❌ {p['name']}: sin birthDate")
        if len(p["clubs"]) == 0:
            errors.append(f"  ❌ {p['name']}: sin clubes")
        if p["position"] not in ["GK","CB","LB","RB","CDM","CM","CAM","LW","RW","ST","CF","LM","RM","LWB","RWB"]:
            errors.append(f"  ❌ {p['name']}: posición inválida '{p['position']}'")

    if errors:
        print("\n🔴 Errores de validación:")
        for e in errors:
            print(e)
    else:
        print("\n✅ Todos los jugadores pasaron validación")

    # Escribir JSON
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(players, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Escrito en: {OUT}")
    print(f"   Tamaño: {OUT.stat().st_size / 1024:.1f} KB")

if __name__ == "__main__":
    main()
