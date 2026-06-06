#!/usr/bin/env python3
"""Bulk generate Argentine football players."""
import json,os,random;random.seed(42)
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data')
P=['GK','CB','CB','LB','RB','CDM','CM','CM','CAM','LW','RW','ST','ST','CF']
L=["Gonzalez","Rodriguez","Lopez","Martinez","Fernandez","Garcia","Diaz","Perez","Sanchez","Ramirez","Torres","Flores","Acosta","Romero","Medina","Herrera","Gimenez","Sosa","Ruiz","Morales","Ortega","Silva","Mendoza","Vargas","Castro","Rojas","Alvarez","Rios","Molina","Cruz","Lorenzo","Pereyra","Moreno","Rivero","Franco","Vera","Ramos","Benitez","Acuna","Vidal","Campos","Godoy","Nunez","Bustos","Paz","Cardozo","Escobar","Duarte","Peralta","Avalos","Ibarra","Guzman","Caceres","Zarate","Blanco","Ponce","Arias","Correa","Valdez","Ferreyra","Barrios","Garay","Domínguez","Miranda","Soria","Lezcano","Almiron","Aquino","Czornomaz","Toledo"]
F=["Juan","Carlos","Martin","Diego","Gabriel","Sergio","Lucas","Matias","Nicolas","Sebastian","Eduardo","Rodrigo","Andres","Pablo","Fernando","Cristian","Roberto","Hector","Ricardo","Oscar","Miguel","Alejandro","Leonardo","Enzo","Lautaro","Julian","Thiago","Agustin","Facundo","Emiliano","Franco","Gonzalo","Mauricio","Bruno","Alan","Damian","German","Ignacio","Santiago","Tomas","Esteban","Joaquin","Mauro","Kevin","Alexis","Nahuel","Patricio","Fabian"]
CL=[("river-plate","River Plate",1930,78),("boca-juniors","Boca Juniors",1930,77),("independiente","Independiente",1930,72),("racing-club","Racing Club",1930,73),("san-lorenzo","San Lorenzo",1930,71),("velez","Velez",1940,73),("estudiantes-lp","Estudiantes LP",1930,72),("gimnasia-lp","Gimnasia LP",1930,68),("newells","Newell's",1930,72),("rosario-central","Rosario Central",1930,71),("huracan","Huracan",1930,69),("argentinos-jrs","Argentinos Jrs",1930,70),("lanus","Lanus",1940,70),("banfield","Banfield",1930,69),("talleres-cba","Talleres",1930,71),("belgrano","Belgrano",1940,68),("platense","Platense",1930,67),("sarmiento-j","Sarmiento",1940,65),("union-sf","Union SF",1940,67),("tigre","Tigre",1930,67),("instituto","Instituto",1930,66),("godoy-cruz","Godoy Cruz",1950,65),("atl-tucuman","Atl. Tucuman",1940,66),("quilmes","Quilmes",1930,66),("chacarita","Chacarita",1930,65),("ferro","Ferro",1930,67),("defensa-y-justicia","Defensa y Justicia",1970,66),("argentina","Argentina",1930,90)]
DM={1930:-8,1940:-6,1950:-4,1960:-2,1970:0,1980:2,1990:4,2000:5,2010:6,2020:7}
PM={'GK':-2,'CB':0,'LB':1,'RB':1,'CDM':0,'CM':1,'CAM':3,'LW':2,'RW':2,'ST':3,'CF':2}
def pid(n):return n.lower().replace(' ','-').replace('.','').replace("'","").replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u').replace('ñ','n')
def gnat(c):return "Argentina" if c=="argentina" else random.choice(["Argentina"]*8+["Uruguay","Paraguay","Chile","Colombia","Brasil"])
# Load existing players
try:
    ep={p['id']:p for p in json.load(open(os.path.join(D,'players.json')))}
except:ep={}
players=dict(ep)
squads={}
for cid,cn,sy,base in CL:
    for yr in range(sy,2026):
        cnt=18 if cid=="argentina" else random.randint(18,28)
        pids=[]
        for _ in range(cnt):
            pos=random.choice(P);nm=random.choice(F)+" "+random.choice(L)
            _id=pid(nm)+"-"+str(random.randint(100,9999))
            dec=(yr//10)*10;mm=DM.get(dec,0)
            rat=max(50,min(99,base+mm+PM.get(pos,0)+random.randint(-5,3)))
            if _id not in players:
                players[_id]={"id":_id,"name":nm,"fullName":nm,"position":pos,
                "birthDate":f"{random.randint(1965,2005)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                "nationality":gnat(cid),"height":random.randint(165,195),"weight":random.randint(65,88),
                "preferredFoot":random.choice(["Derecho","Izquierdo"]),
                "clubs":[{"id":cid,"name":cn,"years":str(yr)}],
                "capsNationalTeam":random.randint(0,180) if cid=="argentina" else 0,
                "goalsNationalTeam":random.randint(0,70) if cid=="argentina" else 0,
                "capsClub":random.randint(50,600),"goalsClub":random.randint(0,150),
                "assistsClub":random.randint(0,80),"trophies":[],"image":"",
                "marketValue":f"{random.randint(1,80)}M\u20ac","activeYears":f"{yr-5}-{yr+2}",
                "decade":f"{(yr//10)*10}s","rating":rat,"legendary":rat>=90}
            else:
                ec=[c['id'] for c in players[_id].get('clubs',[])]
                if cid not in ec:players[_id]['clubs'].append({"id":cid,"name":cn,"years":str(yr)})
            pids.append(_id)
        sk=f"{cid}-{yr}"
        squads[sk]={"id":sk,"clubId":cid,"season":str(yr),"competition":"Liga Profesional",
        "label":f"{cn} {yr}","playerIds":pids}
plist=sorted(players.values(),key=lambda x:x.get('rating',50),reverse=True)
json.dump(plist,open(os.path.join(D,'players.json'),'w'),ensure_ascii=False,indent=1)
slist=[v for v in squads.values() if len(v['playerIds'])>=11]
json.dump(slist,open(os.path.join(D,'squads.json'),'w'),ensure_ascii=False,indent=1)
print(f"Players: {len(plist)} | Squads: {len(slist)}")
