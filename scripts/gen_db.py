#!/usr/bin/env python3
"""Combine seeds + generate fill = 250+ players."""
import json,random,os
random.seed(42)
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","data")
CLIDS=["river-plate","boca-juniors","independiente","racing","san-lorenzo","velez","estudiantes-lp","newells","rosario-central","huracan","argentinos-jrs","lanus","banfield","talleres-cba","gimnasia-lp","godeoy-cruz","colon","arsenal","tigre","belgrano","instituto","union-sf","central-cba","platense","sarmiento-j","barracas-central","defensa-y-justicia","riestra","patronato"]
CLN={"river-plate":"River Plate","boca-juniors":"Boca Juniors","independiente":"Independiente","racing":"Racing Club","san-lorenzo":"San Lorenzo","velez":"Vélez Sarsfield","estudiantes-lp":"Estudiantes","newells":"Newell's","rosario-central":"Rosario Central","huracan":"Huracán","argentinos-jrs":"Argentinos Juniors","lanus":"Lanús","banfield":"Banfield","talleres-cba":"Talleres","gimnasia-lp":"Gimnasia LP","godeoy-cruz":"Godoy Cruz","colon":"Colón","arsenal":"Arsenal","tigre":"Tigre","belgrano":"Belgrano","instituto":"Instituto","union-sf":"Unión","central-cba":"Central Córdoba","platense":"Platense","sarmiento-j":"Sarmiento","barracas-central":"Barracas Central","defensa-y-justicia":"Defensa y Justicia","riestra":"Riestra","patronato":"Patronato"}
POS=["GK","CB","CB","LB","RB","CM","CM","CAM","LW","RW","ST"]
FN=["Carlos","Juan","Martín","Gabriel","Diego","Pablo","Sergio","Fernando","Leonardo","Andrés","Nicolás","Matías","Lucas","Rodrigo","Ezequiel","Gonzalo","Mauricio","Roberto","Alejandro","Santiago","Tomás","Franco","Agustín","Kevin","Facundo","Lautaro","Thiago","Emiliano","Julián","Maximiliano","Enzo","Bruno","Rafael","Cristian","Marcelo","Oscar","Raúl","Claudio","Héctor","Daniel","Ricardo","Jorge","Alberto","Luis","Hugo","Néstor","Adrián","Ignacio"]
LN=["López","García","Rodríguez","Martínez","Álvarez","Romero","Díaz","Fernández","Torres","Acuña","Sosa","Herrera","Giménez","Medina","Ruiz","Silva","Pereira","Mora","Castillo","Vargas","Ríos","Córdoba","Peralta","Miranda","Aguirre","Toledo","Domínguez","Bustos","Luna","Camacho","Benítez","Paz","Hernández","Moreno","Vega","Rojas","Nieves","Zárate"]
def pid(n):
    return n.lower().replace(" ","-").replace("\u00e1","a").replace("\u00e9","e").replace("\u00ed","i").replace("\u00f3","o").replace("\u00fa","u").replace("\u00f1","n").replace(".","")

# Load seeds
seeds=[]
for fn in ["seed_river_boca_indep.json","seed_clubs2.json","seed_clubs3.json","seed_clubs4.json"]:
    fp=os.path.join(D,fn)
    if os.path.exists(fp):
        seeds.extend(json.load(open(fp)))

players=[]
used=set()
for s in seeds:
    cid,cn,pos,nm,nc,ng,cc,cg,ast,leg=s
    foot=random.choice(["Derecho","Derecho","Derecho","Izquierdo"])
    dec="1970s" if any(x in nm for x in ["Fillol","Passarella","Kempes"]) else "1980s" if any(x in nm for x in ["Francescoli","Bochini","Díaz","Alzamendi"]) else "1990s" if leg else "2000s"
    by=1948 if dec=="1970s" else 1958 if dec=="1980s" else 1972 if dec=="1990s" else 1985
    players.append({"id":pid(nm),"name":nm,"fullName":nm,"birthDate":f"{by+random.randint(0,10)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}","position":pos,"positions":[pos],"nationality":"Argentina","height":random.randint(165,192),"weight":random.randint(65,88),"preferredFoot":foot,"clubs":[{"id":cid,"name":cn,"years":"2010-2020"}],"capsNationalTeam":nc,"goalsNationalTeam":ng,"capsClub":cc,"goalsClub":cg,"assistsClub":ast,"trophies":[],"image":"","marketValue":f"{min(80,max(1,int(cg*0.2+cc*0.04)))}M\u20ac","activeYears":f"{by+18}-{by+random.randint(28,38)}","decade":dec,"rating":min(99,max(35,int(cc*0.08+cg*0.18+nc*0.12+(12 if leg else 0)+random.uniform(-2,3)))),"legendary":bool(leg)})
    used.add(nm)

# Count per club
cc2={}
for p in players:
    for c in p["clubs"]:
        cc2[c["id"]]=cc2.get(c["id"],0)+1

# Generate fill
for cid in CLIDS:
    need=max(0,9-cc2.get(cid,0))
    cn=CLN[cid]
    for i in range(need):
        nm=f"{random.choice(FN)} {random.choice(LN)}"
        while nm in used:
            nm=f"{random.choice(FN)} {random.choice(LN)}"
        used.add(nm)
        pos=random.choice(POS)
        foot=random.choice(["Derecho","Derecho","Derecho","Izquierdo"])
        nc,ng=random.randint(0,15),random.randint(0,5) if pos!="GK" else 0
        cc3,cg,ast=random.randint(120,400),random.randint(5,85) if pos in ["ST","CF","LW","RW","CAM"] else random.randint(0,25),random.randint(5,35)
        by=random.randint(1988,2003)
        players.append({"id":pid(nm),"name":nm,"fullName":nm,"birthDate":f"{by}-{random.randint(1,12):02d}-{random.randint(1,28):02d}","position":pos,"positions":[pos],"nationality":"Argentina","height":random.randint(165,192),"weight":random.randint(65,88),"preferredFoot":foot,"clubs":[{"id":cid,"name":cn,"years":"2010-2020"}],"capsNationalTeam":nc,"goalsNationalTeam":ng,"capsClub":cc3,"goalsClub":cg,"assistsClub":ast,"trophies":[],"image":"","marketValue":f"{min(80,max(1,int(cg*0.2+cc3*0.04)))}M\u20ac","activeYears":f"{by+18}-{by+random.randint(28,38)}","decade":"2000s","rating":min(99,max(35,int(cc3*0.08+cg*0.18+nc*0.12)+random.uniform(-2,3))),"legendary":False})

# Add some Argentine stars who played abroad but started in Liga
extra=[("Lionel Messi","RW","boca-juniors","Boca Juniors",190,108,800,670,300,True),
("Sergio Agüero","ST","arsenal","Arsenal",101,41,500,350,120,True),
("Ángel Di María","LW","rosario-central","Rosario Central",126,28,450,120,80,True),
("Javier Zanetti","RB","independiente","Independiente",143,5,600,20,40,True),
("Esteban Cambiasso","CM","racing","Racing Club",98,11,450,68,35,True),
("Javier Saviola","ST","river-plate","River Plate",51,12,350,140,30,True),
("Pablo Aimar","CAM","river-plate","River Plate",52,8,380,65,40,True),
("Carlos Tévez","ST","boca-juniors","Boca Juniors",76,13,450,125,45,True)]
for nm,pos,cid,cn,nc,ng,cc,cg,ast,leg in extra:
    if nm not in used:
        by=1985
        players.append({"id":pid(nm),"name":nm,"fullName":nm,"birthDate":f"{by}-{random.randint(1,12):02d}-{random.randint(1,28):02d}","position":pos,"positions":[pos],"nationality":"Argentina","height":random.randint(170,188),"weight":random.randint(68,82),"preferredFoot":"Derecho","clubs":[{"id":cid,"name":cn,"years":"2000-2010"}],"capsNationalTeam":nc,"goalsNationalTeam":ng,"capsClub":cc,"goalsClub":cg,"assistsClub":ast,"trophies":[],"image":"","marketValue":f"{min(99,max(10,int(cg*0.15)))}M\u20ac","activeYears":"2000-2022","decade":"2000s","rating":min(99,max(50,int(cc*0.08+cg*0.2+nc*0.15+15+random.uniform(-2,3)))),"legendary":True})
        used.add(nm)

# Shuffle and output
random.shuffle(players)
with open(os.path.join(D,"players.json"),"w") as f:
    json.dump(players,f,ensure_ascii=False,indent=2)
print(f"Generated {len(players)} players")
leg=sum(1 for p in players if p["legendary"])
print(f"Legendary: {leg}")
pos_counts={}
for p in players:
    pos_counts[p["position"]]=pos_counts.get(p["position"],0)+1
print(f"By position: {pos_counts}")
cc3={}
for p in players:
    for c in p["clubs"]:
        cc3[c["name"]]=cc3.get(c["name"],0)+1
top=sorted(cc3.items(),key=lambda x:-x[1])[:10]
print(f"Top clubs: {dict(top)}")