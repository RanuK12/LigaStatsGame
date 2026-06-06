#!/usr/bin/env python3
"""Generate players.json + squads.json with squad-by-year model for LigaStatsGame."""
import json, os, hashlib

OUT = os.path.join(os.path.dirname(__file__), '..', 'data')

def pid(name):
    s = name.lower().replace(' ','-').replace('.','').replace("'","")
    for a,b in [('á','a'),('é','e'),('í','i'),('ó','o'),('ú','u'),('ñ','n')]:
        s = s.replace(a,b)
    return s

GK,CB,LB,RB,CDM,CM,CAM,LW,RW,ST,CF = 'GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST','CF'

# ═══════════════════════════════════════════════════════════
# DATA: squads by club/season
# Each entry: (name, pos, rating)
# ═══════════════════════════════════════════════════════════

SQUADS_RAW = {
# ── LIGA PROFESIONAL 2025 (all clubs) ──
"river-plate|2025|Liga Profesional": [
    ("Franco Armani",GK,78),("David Martínez",CB,71),("Paulo Díaz",CB,76),
    ("Milton Casco",LB,72),("Fabricio Bustos",RB,75),("Enzo Pérez",CDM,74),
    ("Rodrigo Aliendro",CM,72),("Ezequiel Barco",CAM,74),("Pablo Solari",RW,73),
    ("Miguel Borja",ST,77),("Adrián Martínez",GK,70),("Kevin Castaño",CM,69),
    ("Santiago Simón",CM,68),("Leandro Díaz",ST,72),("Facundo Colidio",ST,70),
    ("Lucas Beltrán",ST,71),("Nacho Fernández",CM,73),("Marcos Acuña",LB,76),
    ("Héctor Martínez",CB,72),("Agustín Palavecino",CAM,69),
],
"boca-juniors|2025|Liga Profesional": [
    ("Sergio Romero",GK,76),("Marcos Rojo",CB,74),("Nicolás Figal",CB,73),
    ("Luis Advíncula",RB,75),("Marcelo Saracchi",LB,72),("Jorge Figal",CB,68),
    ("Guillermo Fernández",CM,73),("Pol Fernández",CDM,74),("Alexis Mac Allister",CAM,70),
    ("Nicolás Valentini",CB,69),("Mauricio Benítez",CM,67),("Dario Benedetto",ST,75),
    ("Miguel Merentiel",ST,73),("Edinson Cavani",ST,78),("Lucas Janson",LW,70),
    ("Kevin Zenón",LW,71),("Jorman Campuzano",CDM,70),("Nahuel Molina",RB,77),
    ("Leandro Brey",GK,66),("Eduardo Salvio",RW,71),
],
"independiente|2025|Liga Profesional": [
    ("Rodrigo Rey",GK,74),("Joaquín Laso",CB,72),("Iván Marcone",CDM,73),
    ("Ailton",LB,70),("Lucas González",CM,71),("Dante Hidalgo",CB,68),
    ("Alexis Canelo",CAM,72),("Santiago Hidalgo",ST,69),("Lebrijeiro",ST,71),
    ("Fabián Bordagaray",RW,69),("Mauricio Isla",RB,75),("Raúl Lencina",GK,69),
    ("Lucas Barrientos",CM,68),("Nicolás Blanco",LW,67),("Andrés Roa",CAM,70),
    ("Fernando Ametrano",ST,66),("Joaquín Pereyra",CM,67),("Gabriel Ávalos",ST,72),
    ("Miguel Ángel Russo",CB,65),("Bautista Menna",LB,64),
],
"racing-club|2025|Liga Profesional": [
    ("Gabriel Arias",GK,76),("Marco Di Césare",CB,73),("Facundo Mura",RB,71),
    ("Emilio Martínez",LB,69),("Leonardo Godoy",RB,70),("Bruno Zuculini",CDM,73),
    ("Roger Martínez",CM,72),("Carlos Alcaraz",CM,71),("Ignacio Aliseda",CAM,73),
    ("Maximiliano Salas",LW,72),("Adolfo Gaich",ST,74),("Gastón Martirena",RW,68),
    ("Santiago Sosa",CDM,70),("Roberto de la Rosa",ST,71),("Andrés Ayala",CB,67),
    ("Iván Pillud",RB,72),("Juan Nardoni",CM,69),("Tomás Chancalay",ST,68),
    ("Matías Laba",CDM,70),("Nery Domínguez",GK,65),
],
"san-lorenzo|2025|Liga Profesional": [
    ("Óscar Ustari",GK,74),("Germán Conti",CB,72),("Emanuel Cecchini",CDM,71),
    ("Alejandro Molina",LB,68),("Agustín Giay",RB,67),("Ramiro González",CB,69),
    ("Elías Baez",CM,68),("Federico Gattoni",CB,70),("Ezequiel Cerutti",LW,71),
    ("Nicolás Blandi",ST,72),("Gabriel Rojas",LB,70),("Juan Ramírez",CAM,71),
    ("Diego Perea",ST,67),("Nazareno Colombo",CB,66),("Santiago Rolón",RB,66),
    ("Lucas Vegas",CM,69),("Fabián Cubero",CDM,68),("Agustín Bayo",RW,65),
    ("Lautaro López",GK,63),("Tomás Martínez",CAM,67),
],
"estudiantes-lp|2025|Liga Profesional": [
    ("Mariano Andújar",GK,73),("Román Colombia",CB,71),("David Ayala",CDM,72),
    ("Lucas Rodríguez",LB,69),("Fausto Espíndola",RB,68),("Zaid Romero",CB,67),
    ("Enzo Pérez",CM,70),("Mauricio Espíndola",CM,66),("Mateo Retegui",ST,76),
    ("José Sosa",CM,74),("Mauro Boselli",ST,74),("Juan Iglesias",RB,67),
    ("Agustín Rogel",CB,66),("Leandro Díaz",CAM,69),("Francisco Apaolaza",ST,65),
    ("Eduardo Domingo",LW,66),("Lucas González",CM,65),("Matías Godoy",GK,64),
    ("Benjamín Rollheiser",CAM,68),("Santiago Núñez",CB,63),
],
"gimnasia-lp|2025|Liga Profesional": [
    ("Agustín Indjet",GK,71),("Leonel Moral",CB,69),("Hugo Lópes",CDM,70),
    ("Santiago Mineiro",CM,68),("Tomás Sasso",RB,66),("Maximiliano Comba",CAM,71),
    ("Santiago Brambilla