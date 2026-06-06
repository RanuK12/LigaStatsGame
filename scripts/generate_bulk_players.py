#!/usr/bin/env python3
"""Generate 3000+ realistic Argentine football players for LigaStatsGame.
Uses known player names from Argentine football history + procedural generation.
Merges with existing players.json (keeps real scraped data).
"""
import json, os, random, hashlib

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, '..', 'data')

# Known Argentine players by decade (name, position, peak_rating, clubs)
LEGENDS = [
    ("Diego Maradona","CAM",98,["boca-juniors","napoli","sevilla","newells-old-boys"]),
    ("Lionel Messi","RW",99,["barcelona","psg","inter-miami","argentina"]),
    ("Alfredo Di Stefano","ST",97,["river-plate","real-madrid"]),
    ("Gabriel Batistuta","ST",92,["river-plate","fiorentina","roma"]),
    ("Juan Roman Riquelme","CAM",91,["boca-juniors","villarreal","argentina"]),
    ("Enzo Francescoli","ST",90,["river-plate","marseille","torino"]),
    ("Mario Kempes","ST",93,["estudiantes-lp","valencia","hellenic"]),
    ("Daniel Passarella","CB",92,["river-plate","fiorentina","inter"]),
    ("Roberto Ayala","CB",88,["river-plate","napoli","valencia","argentina"]),
    ("Hector Zapatilla","CM",86,["independiente","river-plate"]),
    ("Antonio Angelillo","ST",89,["river-plate","inter","milan"]),
    ("Amadeo Carrizo","GK",89,["river-plate","racing-club"]),
    ("Ubaldo Fillol","LB",87,["river-plate","argentina"]),
    ("Norberto Alonso","CAM",88,["river-plate","marseille","argentina"]),
    ("Ramon Diaz","ST",85,["river-plate","napoli","fiorentina","monaco"]),
    ("Enzo Perez","CM",82,["estudiantes-lp","benfica","river-plate","argentina"]),
    ("Carlos Tevez","ST",89,["boca-juniors","corinthians","manchester-united","manchester-city","juventus","shanghai"]),
    ("Javier Zanetti","RB",90,["banfield","inter","argentina"]),
    ("Esteban Cambiasso","CDM",88,["river-plate","real-madrid","inter","leicester"]),
    ("Walter Samuel","CB",88,["newells-old-boys","roma","real-madrid","inter"]),
    ("Roberto De La Serna","CM",84,["river-plate","boca-juniors","argentina"]),
    ("Santiago Solari","LM",83,["river-plate","atletico-madrid","real-madrid","argentina"]),
    ("Pablo Aimar","CAM",87,["river-plate","valencia","benfica","argentina"]),
    ("Juan Pablo Sorin","LB",85,["river-plate","juventus","paris-saint-germain","villarreal","argentina"]),
    ("Cristian Gonzalez","ST",80,["river-plate","psv","argentina"]),
    ("Ezequiel Lavezzi","LW",84,["san-lorenzo","napoli","psg","argentina"]),
    ("Angel Di Maria","LW",90,["benfica","real-madrid","manchester-united","psg","juventus","argentina"]),
    ("Sergio Aguero","ST",91,["atletico-madrid","manchester-city","barcelona","argentina"]),
    ("Gonzalo Higuain","ST",88,["river-plate","real-madrid","napoli","juventus","inter","argentina"]),
    ("Mauro Icardi","ST",86,["sampdoria","inter","paris-saint-germain","argentina"]),
    ("Radamel Falcao","ST",91,["river-plate","porto","atletico-madrid","manchester-united","chelsea","galatasaray","argentina"]),
    ("Miguel Borja","ST",81,["atletico-nacional","palmeiras","corinthians","river-plate","argentina"]),
    ("Lautaro Martinez","ST",88,["racing-club","inter","argentina"]),
    ("Julian Alvarez","ST",88,["river-plate","manchester-city","argentina"]),
    ("Emiliano Martinez","GK",87,["argentina","oxford-united","wolverhampton","sheffield-united","aston-villa"]),
    ("Franco Armani","GK",82,["river-plate","argentina"]),
    ("Nery Pumpido","GK",88,["san-lorenzo","river-plate","veron","argentina"]),
    ("Sergio Goycochea","GK",86,["racing-club","river-plate","inter","argentina"]),
    ("Sergio Romero","GK",84,["sampa","az","manchester-united","venezia","boca-juniors","argentina"]),
    ("Oscar Ustari","GK",80,["argentina","gimnasia-lp","pachuca","sociedad","san-lorenzo"]),
    ("Roberto Bonano","GK",80,["river-plate","barcelona","real-sociedad","argentina"]),