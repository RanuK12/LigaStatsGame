#!/usr/bin/env python3
"""Enrich players + build squads in one shot."""
import json, os, random
BASE = os.path.join(os.path.dirname(__file__),'..')
DATA = os.path.join(BASE,'data')
def pid(n):
    s=n.lower().replace(' ','-').replace('.','').replace("'","").replace(',','')
    for a,b in [('á','a'),('é','e'),('í','i'),('ó','o'),('ú','u'),('ñ','n')]: s=s.replace(a,b)
    return s

players = json.load(open(os.path.join(DATA,'players.json')))
existing_ids = {p['id'] for p in players}
clubs = json.load(open(os.path.join(DATA,'clubs.json')))

# Add legend players
L = []
def a(n,p,r,c,d,lg=False,caps=0,goals=0):
    i=pid(n)
    if i in existing_ids: return
    existing_ids.add(i)
    L.append({'id':i,'name':n,'fullName':n,'birthDate':'','position':p,'positions':[p],
        'nationality':'Argentina','height':0,'weight':0,'preferredFoot':'Derecho',
        'clubs':[{'id':c,'name':c.replace('-',' ').title(),'years':''} for c in (c if isinstance(c,list) else [c])],
        'capsNationalTeam':caps,'goalsNationalTeam':goals,'capsClub':0,'goalsClub':0,
        'assistsClub':0,'trophies':[],'image':'','marketValue':'','activeYears':'',
        'decade':d,'rating':r,'legendary':lg})

# Argentine legends
a("Diego Maradona","CAM",96,"argentina","1980s",True,91,34)
a("Lionel Messi","RW",98,"argentina","2020s",True,187,108)
a("Jorge Valdano","ST",88,"argentina","1980s",True,22,7)
a("Sergio Batista","CDM",87,"argentina","1980s",True,39,0)
a("Ricardo Bochini","CAM",89,"argentina","1980s",True,28,0)
a("Mario Kempes","ST",91,"argentina","1970s",True,43,20)
a("Leopoldo Luque","ST",86,"argentina","1970s",True,30,7)
a("Osvaldo Ardiles","CM",88,"argentina","1980s",True,51,8)
a("Daniel Passarella","CB",90,"argentina","1970s",True,70,8)
a("Nery Pumpido","GK",87,"argentina","1980s",True,18,0)
a("Claudio Borghi","CAM",86,"argentina","1980s",True,31,6)
a("Carlos Tapia","CM",85,"argentina","1980s",True,30,6)
a("Julio Olarticoechea","LB",84,"argentina","1980s",True,32,0)
a("Pedro Pasculli","ST",82,"argentina","1980s",True,4,1)
a("Roberto Perfumo","CB",89,"argentina","1970s",True,37,0)
a("Ren Houseman","RW",87,"argentina","1970s",True,55,13)
a("Francisco Sa","CB",86,"argentina","1970s",True,23,0)
a("Alfio Basile","CB",85,"argentina","1970s",True,8,0)
a("Javier Zanetti","RB",88,"argentina","1990s",True,143,5)
a("Gabriel Batistuta","ST",90,"argentina","1990s",True,78,56)
a("Juan Sebastian Veron","CAM",89,"argentina","1990s",True,73,9)
a("Claudio Lopez","ST",87,"argentina","1990s",True,55,10)
a("Hernan Crespo","ST",89,"argentina","1990s",True,64,35)
a("Ariel Ortega","CAM",86,"argentina","1990s",True,87,17)
a("Diego Simeone","CDM",88,"argentina","1990s",True,108,11)
a("Roberto Ayala","CB",87,"argentina","1990s",True,115,7)
a("Sergio Goycochea","GK",85,"argentina","1990s",True,44,0)
a("Marcelo Gallardo","CAM",87,"argentina","1990s",True,44,14)
a("Walter Samuel","CB",87,"argentina","2000s",True,56,4)
a("Esteban Cambiasso","CDM",88,"argentina","2000s",True,52,5)
a("Juan Roman Riquelme","CAM",91,"argentina","2000s",True,51,17)
a("Pablo Aimar","CAM",88,"argentina","2000s",True,52,8)
a("Roberto Abbondanzieri","GK",86,"argentina","2000s",True,16,0)
a("Carlos Tevez","ST",89,"argentina","2000s",True,76,13)
a("Javier Saviola","ST",87,"argentina","2000s",True,46,21)
a("Martin Demichelis","CB",85,"argentina","2000s",True,51,2)
a("Nicolas Burdisso","CB",84,"argentina","2000s",True,49,2)
a("Fabricio Coloccini","CB",84,"argentina","2000s",True,38,1)
a("Luciano Galletti","RW",83,"argentina","2000s",True,22,3)
a("Maxi Rodriguez","LW",85,"argentina","2000s",True,57,12)

# More Argentine players - current stars and 2010s/2020s
a("Sergio Aguero","ST",90,"argentina","2010s",True,101,41)
a("Gonzalo Higuain","ST",87,"argentina","2010s",True,75,31)
a("Angel Di Maria","LW",89,"argentina","2010s",True,129,28)
a("Sergio Romero","GK",85,"argentina","2010s",True,96,0)
a("Ezequiel Garay","CB",84,"argentina","2010s",True,33,0)
a("Pablo Zabaleta","RB",84,"argentina","2010s",True,58,0)
a("Marcos Rojo","CB",83,"argentina","2010s",True,68,3)
a("Lucas Biglia","CDM",84,"argentina","2010s",True,58,1)
a("Erik Lamela","RW",84,"argentina","2010s",True,25,3)
a("Nicolas Otamendi","CB",85,"argentina","2010s",True,119,6)
a("Ever Banega","CM",84,"argentina","2010s",True,65,6)
a("Javier Mascherano","CDM",87,"argentina","2010s",True,147,3)
a("Lautaro Martinez","ST",88,"argentina","2020s",True,52,23)
a("Julian Alvarez","ST",87,"argentina","2020s",True,38,13)
a("Emiliano Martinez","GK",87,"argentina","2020s",True,38,0)
a("Rodrigo De Paul","CM",85,"argentina","2020s",True,58,2)
a("Enzo Fernandez","CDM",86,"argentina","2020s",True,20,2)
a("Alexis Mac Allister","CM",85,"argentina","2020s",True,22,3)
a("Nahuel Molina","RB",84,"argentina","2020s",True,34,2)
a("Cristian Romero","CB",85,"argentina","2020s",True,20,0)
a("Lisandro Martinez","CB",85,"argentina","2020s",True,20,0)
a("Nicolas Tagliafico","LB",84,"argentina","2020s",True,40,1)
a("Lo Celso","CAM",84,"argentina","2020s",True,36,5)
a("Paulo Dybala","ST",86,"argentina","2010s",True,40,10)
a("Angel Correa","RW",84,"argentina","2010s",True,28,4)
a("Nicolas Gonzalez","LW",83,"argentina","2020s",True,18,2)
a("Thiago Almada","CAM",84,"argentina","2020s",True,12,2)
a("Valentin Carboni","LW",79,"argentina","2020s",False,3,0)
a("Exequiel Zeballos","LW",80,"argentina","2020s",False,5,0)

# Club legends (not national team but club icons)
a("Angel Labruna","ST",90,["river-plate"],"1940s",True)
a("Alfredo Di Stefano","ST",95,["river-plate"],"1940s",True)
a("Antonio Sastre","LW",85,["river-plate"],"1940s",True)
a("Rene Houseman","LW",87,["river-plate"],"1970s",True)
a("Norberto Alonso","CAM",89,["river-plate"],"1970s",True)
a("Ramon Diaz","ST",87,["river-plate"],"1980s",True)
a("Enzo Francescoli","CAM",91,["river-plate"],"1980s",True)
a("Claudio Borghi","CAM",88,["river-plate"],"1980s",True)
a("Gabriel Amato","ST",85,["river-plate"],"1990s",True)
a("Ariel Ortega","CAM",88,["river-plate"],"1990s",True)
a("Marcelo Gallardo","CAM",89,["river-plate"],"1990s",True)
a("Juan Pablo Angel","ST",85,["river-plate"],"1990s",True)
a("Fernando Cavenaghi","ST",84,["river-plate"],"2000s",True)
a("Radamel Falcao","ST",92,["river-plate"],"2000s",True)
a("Gonzalo Higuain","ST",87,["river-plate"],"2000s",True)
a("Erik Lamela","RW",85,["river-plate"],"2000s",True)
a("Teo Gutierrez","ST",85,["river-plate"],"2010s",True)
a("Ignacio Scocco","ST",84,["river-plate"],"2010s",True)
a("Santiago Solari","CM",83,["river-plate"],"1990s",True)

a("Antonio Rattin","CDM",88,["boca-juniors"],"1960s",True)
a("Roberto Mouzo","CB",85,["boca-juniors"],"1970s",True)
a("Carlos Veglio","CAM",84,["boca-juniors"],"1970s",True)
a("Diego Maradona","CAM",96,["boca-juniors"],"1980s",True)
a("Oscar Ruggeri","CB",87,["boca-juniors"],"1980s",True)
a("Carlos Tapia","CM",86,["boca-juniors"],"1980s",True)
a("Claudio Borghi","CAM",87,["boca-juniors"],"1980s",True)
a("Diego Latorre","ST",84,["boca-juniors"],"1990s",True)
a("Sergio Rios","ST",83,["boca-juniors"],"1990s",True)
a("Juan Roman Riquelme","CAM",92,["boca-juniors"],"1990s",True)
a("Martin Palermo","ST",85,["boca-juniors"],"2000s",True)
a("Carlos Tevez","ST",90,["boca-juniors"],"2000s",True)
a("Sebastian Battaglia","CDM",86,["boca-juniors"],"2000s",True)
a("Fabian Monzon","LB",83,["boca-juniors"],"2000s",True)
a("Juan Sanchez Miño","LB",82,["boca-juniors"],"2010s",False)
a("Dario Benedetto","ST",85,["boca-juniors"],"2010s",True)
a("Edwin Cardona","CAM",83,["boca-juniors"],"2010s",False)
a("Cristian Pavon","RW",84,["boca-juniors"],"2010s",False)

# Independiente legends
a("Luis Artime","ST",89,["independiente"],"1960s",True)
a("Ricardo Pavoni","LB",85,["independiente"],"1960s",True)
a("Miguel Antonio Raimondi","CB",84,["independiente"],"1960s",True)
a("Jose Omar Pastoriza","CAM",88,["independiente"],"1970s",True)
a("Ricardo Bochini","CAM",90,["independiente"],"1970s",True)
a("Daniel Bertoni","ST",87,["independiente"],"1970s",True)
a("Alejandro Sabella","CM",84,["independiente"],"1970s",True)
a("Enzo Francescoli","CAM",89,["independiente"],"1980s",True)
a("Oscar Ruggeri","CB",86,["independiente"],"1980s",True)
a("Sergio Merlini","LW",83,["independiente"],"1980s",True)
a("Antonio Alzamendi","ST",86,["independiente"],"1980s",True)
a("Claudio Borghi","CAM",87,["independiente"],"1980s",True)
a("Gabriel Calderon","CM",85,["independiente"],"1980s",True)
a("Walter Garay","CM",83,["independiente"],"1990s",False)
a("Francisco Ferraro","ST",82,["independiente"],"1990s",False)
a("Hugo Perez","CAM",84,["independiente"],"1990s",True)
a("Sergio Aguirre","GK",82,["independiente"],"1990s",False)
a("Gabriel Avalos","ST",84,["independiente"],"2020s",False)

# Racing legends
a("Alfredo Di Stefano","ST",93,["racing-club"],"1940s",True)
a("Ruben Díaz","CB",86,["racing-club"],"1960s",True)
a("Juan Carlos Cárdenas","ST",85,["racing-club"],"1970s",True)
a("Ubaldo Fillol","GK",84,["racing-club"],"1970s",True)
a("Miguel Angel Brindisi","CM",87,["racing-club"],"1980s",True)
a("Antonio Alzamendi","ST",86,["racing-club"],"1980s",True)
a("Osvaldo Boccoli","CDM",83,["racing-club"],"1980s",False)
a("Claudio García","ST",84,["racing-club"],"1990s",True)
a("Sergio Castillo","CM",82,["racing-club"],"1990s",False)
a("Marcelo Delgado","ST",85,["racing-club"],"1990s",True)
a("Eduardo Bustos Montoya","ST",83,["racing-club"],"1990s",False)
a("Luciano Galletti","RW",83,["racing-club"],"2000s",False)
a("Diego Milito","ST",89,["racing-club"],"2000s",True)
a("Gonzalo Bergessio","ST",83,["racing-club"],"2010s",False)
a("Lisandro Lopez","ST",86,["racing-club"],"2000s",True)
a("Rogelio Funes Mori","ST",82,["racing-club"],"2010s",False)
a("Carlos Alcaraz","CM",84,["racing-club"],"2020s",False)

# San Lorenzo legends
a("Jose Sanfilippo","ST",88,["san-lorenzo"],"1960s",True)
a("Rene Houseman","LW",86,["san-lorenzo"],"1970s",True)
a("Victorio Cocco","ST",84,["san-lorenzo"],"1970s",True)
a("Agustin Irusta","GK",83,["san-lorenzo"],"1970s",True)
a("Hector Scotta","ST",85,["san-lorenzo"],"1970s",True)
a("Roberto Telch","CDM",84,["san-lorenzo"],"1970s",True)
a("Carlos Veglio","CAM",83,["san-lorenzo"],"1970s",True)
a("Nene Cirqueira","ST",82,["san-lorenzo"],"1980s",False)
a("Juan Antonio Pizzi","ST",85,["san-lorenzo"],"1990s",True)
a("Sergio Villar","LB",82,["san-lorenzo"],"1990s",False)
a("Pablo Michelini","CAM",83,["san-lorenzo"],"1990s",False)
a("Leandro Romagnoli","CAM",84,["san-lorenzo"],"2000s",True)
a("Fernando Belluschi","CM",83,["san-lorenzo"],"2000s",False)
a("Mauro Matos","ST",82,["san-lorenzo"],"2010s",False)
a("Fabricio Coloccini","CB",84,["san-lorenzo"],"2010s",True)

# Velez, Estudiantes, Newells, Central legends
a("Carlos Bianchi","ST",89,["velez-sarsfield"],"1960s",True)
a("Oscar Ruggeri","CB",85,["velez-sarsfield"],"1980s",True)
a("Sergio Goycochea","GK",85,["velez-sarsfield"],"1990s",True)
a("Roberto Trotta","CB",84,["velez-sarsfield"],"1990s",True)
a("Mauricio Pellegrino","CB",84,["velez-sarsfield"],"1990s",True)
a("Cristian Bassedas","CM",83,["velez-sarsfield"],"1990s",False)
a("Florian Mychajlyszyn","ST",83,["velez-sarsfield"],"1990s",False)
a("Patricio Camps","CAM",85,["velez-sarsfield"],"1990s",True)
a("Juan Carlos Villamayor","CB",83,["velez-sarsfield"],"1990s",False)
a("Carlos Netto","CM",82,["velez-sarsfield"],"1990s",False)
a("Martin Herrera","GK",83,["velez-sarsfield"],"1990s",False)
a("Ricardo Alvarez","CM",82,["velez-sarsfield"],"2000s",False)
a("Lucas Pratto","ST",83,["velez-sarsfield"],"2010s",False)
a("Mauro Zárate","ST",84,["velez-sarsfield"],"2000s",True)
a("Santiago Silvera","LW",82,["velez-sarsfield"],"2000s",False)

a("Juan Ramón Verón","CAM",88,["estudiantes-lp"],"1960s",True)
a("Raúl Madero","ST",84,["estudiantes-lp"],"1960s",True)
a("Carlos Bilardo","CDM",85,["estudiantes-lp"],"1960s",True)
a("Oscar Malbernat","CB",84,["estudiantes-lp"],"1960s",True)
a("Eugenio Galak","GK",82,["estudiantes-lp"],"1960s",True)
a("Héctor de la Cruz","CM",83,["estudiantes-lp"],"1960s",True)
a("Mario Mendoza","ST",83,["estudiantes-lp"],"1970s",True)
a("Carlos Pachamé","CM",82,["estudiantes-lp"],"1970s",True)
a("Sergio Romero","GK",83,["estudiantes-lp"],"1990s",False)
a("José Luis Calderón","ST",84,["estudiantes-lp"],"1990s",True)
a("Juan Sebastián Verón","CAM",90,["estudiantes-lp"],"2000s",True)
a("Mauro Boselli","ST",85,["estudiantes-lp"],"2000s",True)
a("José Sosa","CM",84,["estudiantes-lp"],"2000s",True)
a("Diego Valeri","CAM",84,["estudiantes-lp"],"2000s",True)
a("Mateo Retegui","ST",85,["estudiantes-lp"],"2020s",False)

a("Héctor Yazalde","ST",87,["newells-old-boys"],"1970s",True)
a("Jorge Griffiths","CM",83,["newells-old-boys"],"1970s",True)
a("Roberto Sensini","CB",86,["newells-old-boys"],"1980s",True)
a("Gabriel Batistuta","ST",89,["newells-old-boys"],"1980s",True)
a("Diego Simeone","CM",88,["newells-old-boys"],"1980s",True)
a("Ariel Ortega","CAM",87,["newells-old-boys"],"1990s",True)
a("Marcelo Espina","CAM",84,["newells-old-boys"],"1990s",True)
a("Fernando Gamboa","CB",84,["newells-old-boys"],"1990s",True)
a("Cristian Montenegro","CM",82,["newells-old-boys"],"1990s",False)
a("Justo Giani","CM",83,["newells-old-boys"],"2000s",False)
a("Ignacio Scocco","ST",85,["newells-old-boys"],"2010s",True)
a("Maxi Rodriguez","LW",85,["newells-old-boys"],"2010s",True)
a("Walter Erviti","CM",83,["newells-old-boys"],"2010s",False)

a("Alexandr Mostovoi","CAM",85,["rosario-central"],"1990s",True)
a("Hugo Galloni","ST",84,["rosario-central"],"1980s",True)
a("Edgardo Bauza","CB",84,["rosario-central"],"1980s",True)
a("César Delgado","CAM",85,["rosario-central"],"1990s",True)
a("Marcelo Escudero","CM",83,["rosario-central"],"1990s",False)
a("Eduardo Coudet","CM",84,["rosario-central"],"2000s",True)
a("Giovanni Hernández","CAM",83,["rosario-central"],"2010s",False)
a("Lucas Gamba","ST",82,["rosario-central"],"2010s",False)
a("Marco Ruben","ST",84,["rosario-central"],"2010s",True)
a("Ignacio Fernandez","CM",83,["rosario-central"],"2010s",False)

# Huracan, Lanus, Banfield, Tigre, Argentinos legends
a("René Houseman","RW",87,["huracan"],"1970s",True)
a("Carlos Babington","CAM",86,["huracan"],"1970s",True)
a("Alfio Basile","CB",85,["huracan"],"1970s",True)
a("Ricardo Lavolpe","GK",84,["huracan"],"1970s",True)
a("Hugo Bargas","ST",83,["huracan"],"1970s",True)
a("Martín Buerba","CM",82,["huracan"],"1980s",False)
a("Sebastián Rozatti","ST",82,["huracan"],"1990s",False)
a("Cristian Tarragona","ST",83,["huracan"],"2010s",False)
a("Facundo Ansaldi","LW",82,["huracan"],"2010s",False)

a("Pedro Larraquy","ST",84,["lanus"],"1970s",True)
a("Carlos Bilardo","CM",85,["lanus"],"1960s",True)
a("Walter Erviti","CM",84,["lanus"],"2010s",True)
a("Lautaro Acosta","CAM",84,["lanus"],"2000s",True)
a("Santiago Silva","ST",83,["lanus"],"2010s",False)
a("Marcelo Melo","CM",82,["lanus"],"2000s",False)
a("Ismael Blanco","ST",84,["lanus"],"2000s",True)
a("Jose Sand","ST",85,["lanus"],"2000s",True)
a("Tomas Belmonte","CM",84,["lanus"],"2020s",False)

a("Oscar Acosta","ST",83,["banfield"],"1950s",True)
a("Francisco Sá","CB",85,["banfield"],"1970s",True)
a("Agustín Cejas","GK",83,["banfield"],"1970s",True)
a("Roberto Zurita","CM",82,["banfield"],"1980s",False)
a("Julio Barraza","CB",82,["banfield"],"2000s",False)
a("Santiago Solari","CM",84,["banfield"],"2000s",True)
a("Facundo Sanguinetti","GK",83,["banfield"],"2020s",False)

a("Ricardo Altamirano","LB",84,["tigre"],"1990s",True)
a("Francisco Pacheco","CM",82,["tigre"],"1990s",False)
a("Fernando Cavenaghi","ST",84,["tigre"],"2000s",True)
a("Martin Galmarini","CM",82,["tigre"],"2000s",False)
a("Ariel Broggia","ST",83,["tigre"],"2000s",False)
a("Ricardo Alvarez","CM",84,["tigre"],"2010s",True)
a("Carlos Luna","ST",84,["tigre"],"2010s",True)
a("Blas Giunta","CDM",82,["tigre"],"2000s",False)

a("Miguel Brindisi","CM",87,["argentinos-juniors"],"1970s",True)
a("Diego Maradona","CAM",95,["argentinos-juniors"],"1970s",True)
a("Pedro Pasculli","ST",83,["argentinos-juniors"],"1980s",True)
a("Federico Vilar","GK",83,["argentinos-juniors"],"2000s",True)
a("Gabriel Batistuta","ST",88,["argentinos-juniors"],"1980s",True)
a("Fabricio Coloccini","CB",83,["argentinos-juniors"],"2000s",True)
a("Lucas Barrios","ST",83,["argentinos-juniors"],"2000s",False)
a("Federico Redondo","CDM",82,["argentinos-juniors"],"2020s",False)

# Talleres, Belgrano, Union, Atletico Tucuman
a("Mario Kempes","ST",91,["talleres-cba"],"1970s",True)
a("Lautaro Sosa","CM",83,["talleres-cba"],"2010s",False)
a("Alan Franco","ST",84,["talleres-cba"],"2020s",False)
a("Guido Herrera","GK",84,["talleres-cba"],"2020s",False)
a("Mateo Retegui","ST",85,["talleres-cba"],"2010s",False)
a("Diego Valoyes","RW",82,["talleres-cba"],"2010s",False)
a("Ulises Ortegoza","CM",83,["talleres-cba"],"2020s",False)
a("Ramiro Enrique","ST",82,["talleres-cba"],"2020s",False)

a("Luciano Aguirre","ST",83,["belgrano"],"1990s",True)
a("Ruben Ramirez","CM",82,["belgrano"],"2000s",False)
a("Marcos Ferraris","CAM",82,["belgrano"],"2010s",False)
a("Luciano Viola","ST",83,["belgrano"],"2010s",False)
a("German Conti","CB",82,["belgrano"],"2010s",False)

a("Walter Jimenez","ST",83,["union-sf"],"1990s",False)
a("Santiago Garcia","ST",84,["union-sf"],"2010s",True)
a("Nery Leyes","CM",82,["union-sf"],"2010s",False)
a("Franco Troyansky","ST",83,["union-sf"],"2010s",False)
a("Jonathan Dellarossa","CAM",82,["union-sf"],"2020s",False)

a("Carlos Gillardi","GK",82,["atl-tucuman"],"1990s",False)
a("Ivan Moreno y Fabianesi","ST",83,["atl-tucuman"],"2010s",True)
a("Leandro Diaz","CAM",82,["atl-tucuman"],"2010s",False)
a("Joaquin Pereyra","CM",82,["atl-tucuman"],"2020s",False)
a("Francisco Gonzalez","CDM",82,["atl-tucuman"],"2020s",False)

# More current Liga players for smaller clubs
a("Fabricio Coloccini","CB",83,["defensa-y-justicia"],"2010s",False)
a("Domingo Blanco","CAM",83,["defensa-y-justicia"],"2020s",False)
a("Nicolas Fernandez","ST",82,["defensa-y-justicia"],"2020s",False)
a("Enzo Cabrera","LB",82,["defensa-y-justicia"],"2020s",False)
a("Lucas Barrios","ST",83,["defensa-y-justicia"],"2010s",False)
a("Aaron Molinas","CM",82,["defensa-y-justicia"],"2020s",False)

# Synthetic expansion to push the dataset beyond 1000 players while keeping
# positions, seasons, and ratings coherent across clubs/eras.
random.seed(42)
TARGET_TOTAL = 1050
EXTRA_FIRST_NAMES = [
    "Juan", "Carlos", "Martin", "Diego", "Gabriel", "Sergio", "Lucas", "Matias", "Nicolas", "Sebastian",
    "Eduardo", "Rodrigo", "Andres", "Pablo", "Fernando", "Cristian", "Roberto", "Hector", "Ricardo", "Oscar",
    "Miguel", "Alejandro", "Leonardo", "Enzo", "Lautaro", "Julian", "Thiago", "Agustin", "Facundo", "Emiliano",
    "Franco", "Gonzalo", "Mauricio", "Bruno", "Alan", "Damian", "German", "Ignacio", "Santiago", "Tomas",
    "Esteban", "Joaquin", "Mauro", "Kevin", "Alexis", "Nahuel", "Patricio", "Fabian", "Victor", "Raul",
    "Claudio", "Ariel", "Walter", "Leandro", "Jose", "Angel", "Federico", "Hernan", "Nestor", "Marcos",
]
EXTRA_LAST_NAMES = [
    "Gonzalez", "Rodriguez", "Lopez", "Martinez", "Fernandez", "Garcia", "Diaz", "Perez", "Sanchez", "Ramirez",
    "Torres", "Flores", "Acosta", "Romero", "Medina", "Herrera", "Gimenez", "Sosa", "Ruiz", "Morales",
    "Ortega", "Silva", "Mendoza", "Vargas", "Castro", "Rojas", "Alvarez", "Rios", "Molina", "Cruz",
    "Lorenzo", "Pereyra", "Moreno", "Rivero", "Franco", "Vera", "Ramos", "Benitez", "Acuna", "Vidal",
    "Campos", "Godoy", "Nunez", "Bustos", "Paz", "Cardozo", "Escobar", "Duarte", "Peralta", "Avalos",
    "Ibarra", "Guzman", "Caceres", "Zarate", "Blanco", "Ponce", "Arias", "Correa", "Valdez", "Ferreyra",
    "Barrios", "Garay", "Miranda", "Soria", "Lezcano", "Almiron", "Aquino", "Toledo", "Sanchez", "Paredes",
]
POSITION_WEIGHTS = ["GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CM", "CAM", "LW", "RW", "ST", "ST", "CF"]
POSITION_ALTERNATES = {
    "GK": ["GK"],
    "CB": ["CB", "LB", "RB"],
    "LB": ["LB", "CB"],
    "RB": ["RB", "CB"],
    "CDM": ["CDM", "CM"],
    "CM": ["CM", "CDM", "CAM"],
    "CAM": ["CAM", "CM"],
    "LW": ["LW", "LM", "ST"],
    "RW": ["RW", "RM", "ST"],
    "ST": ["ST", "CF"],
    "CF": ["CF", "ST"],
}
CLUB_BASE_RATING = {
    "river-plate": 78,
    "boca-juniors": 77,
    "independiente": 74,
    "racing-club": 74,
    "san-lorenzo": 73,
    "velez": 74,
    "estudiantes-lp": 73,
    "newells": 72,
    "rosario-central": 72,
    "argentinos-jrs": 71,
    "colon": 70,
    "lanus": 70,
    "banfield": 69,
    "gimnasia-lp": 68,
    "huracan": 68,
    "talleres-cba": 70,
    "belgrano": 67,
    "union-sf": 67,
    "atl-tucuman": 66,
    "defensa-y-justicia": 67,
    "tigre": 67,
    "instituto": 66,
    "godoy-cruz": 65,
    "quilmes": 65,
    "chacarita": 64,
    "ferro": 65,
    "platense": 64,
    "sarmiento-j": 63,
    "argentina": 90,
}
DECADE_BONUS = {
    "1940s": -6,
    "1950s": -5,
    "1960s": -3,
    "1970s": -1,
    "1980s": 0,
    "1990s": 2,
    "2000s": 3,
    "2010s": 4,
    "2020s": 5,
}
POSITION_BONUS = {
    "GK": -1,
    "CB": 0,
    "LB": 1,
    "RB": 1,
    "CDM": 0,
    "CM": 1,
    "CAM": 2,
    "LW": 2,
    "RW": 2,
    "ST": 3,
    "CF": 2,
}

def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))

def club_weight(club):
    return (
        CLUB_BASE_RATING.get(club['id'], 66)
        + club.get('titles', 0) * 0.4
        + club.get('Libertadores', 0) * 0.8
        + len(club.get('era', [])) * 0.2
    )

def build_birth_date(season_year):
    birth_year = season_year - random.randint(18, 27)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{birth_year}-{month:02d}-{day:02d}"

def build_active_years(season_year):
    start = max(1940, season_year - random.randint(4, 8))
    end = season_year + random.randint(2, 6)
    return f"{start}-{end}"

def build_positions(position):
    alt = POSITION_ALTERNATES.get(position, [position])
    return alt[:]

GK_FIRST_NAMES = [
    "Ubaldo", "Sergio", "Roberto", "Mariano", "Nereo", "Nahuel", "German", "Federico", "Augusto", "Gaston",
    "Julio", "Miguel", "Leonel", "Ivan", "Diego", "Hernan", "Lautaro", "Tomas", "Carlos", "Oscar",
]
GK_LAST_NAMES = [
    "Fillol", "Andujar", "Abbondanzieri", "Briante", "Champagne", "Marchesin", "Burián", "Lux", "Sessa", "Ibañez",
    "Sessa", "Ledesma", "Rossi", "Ortiz", "Benitez", "Carmona", "Lugo", "Paredes", "Ferrari", "Cejas",
]

def add_goalkeeper_for_club(club, era):
    season_year = int(era[:4]) if era[:4].isdigit() else 2000
    for _ in range(20):
        name = f"{random.choice(GK_FIRST_NAMES)} {random.choice(GK_LAST_NAMES)}"
        player_id = pid(name)
        if player_id in used_ids:
            continue

        used_ids.add(player_id)
        base_rating = CLUB_BASE_RATING.get(club['id'], 66)
        rating = clamp(base_rating + DECADE_BONUS.get(era, 0) - 1 + random.randint(-3, 3), 50, 99)
        L.append({
            'id': player_id,
            'name': name,
            'fullName': name,
            'birthDate': build_birth_date(season_year),
            'position': 'GK',
            'positions': ['GK'],
            'nationality': 'Argentina',
            'height': random.randint(182, 198),
            'weight': random.randint(75, 92),
            'preferredFoot': random.choice(['Derecho', 'Izquierdo']),
            'clubs': [{'id': club['id'], 'name': club['name'], 'years': str(season_year)}],
            'capsNationalTeam': 0,
            'goalsNationalTeam': 0,
            'capsClub': random.randint(25, 420),
            'goalsClub': 0,
            'assistsClub': 0,
            'trophies': [],
            'image': '',
            'marketValue': f"{random.randint(1, 25)}M€",
            'activeYears': build_active_years(season_year),
            'decade': era,
            'rating': rating,
            'legendary': rating >= 88,
        })
        return True

    return False

def add_club_cover_player(club, era, position):
    season_year = int(era[:4]) if era[:4].isdigit() else 2000
    for _ in range(20):
        first = random.choice(EXTRA_FIRST_NAMES)
        last = random.choice(EXTRA_LAST_NAMES)
        name = f"{first} {last}"
        player_id = pid(name)
        if player_id in used_ids:
            continue

        used_ids.add(player_id)
        base_rating = CLUB_BASE_RATING.get(club['id'], 66)
        rating = clamp(
            base_rating + DECADE_BONUS.get(era, 0) + POSITION_BONUS.get(position, 0) + random.randint(-3, 3),
            50,
            99,
        )
        goals_club = {
            'CB': random.randint(0, 12),
            'LB': random.randint(0, 10),
            'RB': random.randint(0, 10),
            'CDM': random.randint(0, 16),
            'CM': random.randint(3, 30),
            'CAM': random.randint(6, 40),
            'LW': random.randint(8, 60),
            'RW': random.randint(8, 60),
            'ST': random.randint(20, 120),
            'CF': random.randint(12, 90),
        }[position]
        assists_club = {
            'CB': random.randint(0, 6),
            'LB': random.randint(0, 12),
            'RB': random.randint(0, 12),
            'CDM': random.randint(0, 12),
            'CM': random.randint(2, 25),
            'CAM': random.randint(5, 35),
            'LW': random.randint(4, 45),
            'RW': random.randint(4, 45),
            'ST': random.randint(0, 18),
            'CF': random.randint(0, 15),
        }[position]

        L.append({
            'id': player_id,
            'name': name,
            'fullName': name,
            'birthDate': build_birth_date(season_year),
            'position': position,
            'positions': build_positions(position),
            'nationality': 'Argentina',
            'height': random.randint(168, 194),
            'weight': random.randint(65, 88),
            'preferredFoot': random.choice(['Derecho', 'Izquierdo']),
            'clubs': [{'id': club['id'], 'name': club['name'], 'years': str(season_year)}],
            'capsNationalTeam': 0,
            'goalsNationalTeam': 0,
            'capsClub': random.randint(30, 480),
            'goalsClub': goals_club,
            'assistsClub': assists_club,
            'trophies': [],
            'image': '',
            'marketValue': f"{random.randint(1, 40)}M€",
            'activeYears': build_active_years(season_year),
            'decade': era,
            'rating': rating,
            'legendary': rating >= 88,
        })
        return True

    return False

generated = 0
used_ids = {p['id'] for p in players}.union(existing_ids)

club_choices = [club for club in clubs if club.get('id') != 'argentina']
while len(players) + len(L) < TARGET_TOTAL:
    club = random.choices(club_choices, weights=[club_weight(club) for club in club_choices], k=1)[0]
    eras = club.get('era') or ['2000s']
    era = random.choice(eras)
    season_year = int(era[:4]) if era[:4].isdigit() else 2000
    position = random.choice(POSITION_WEIGHTS)
    first = random.choice(EXTRA_FIRST_NAMES)
    last = random.choice(EXTRA_LAST_NAMES)
    name = f"{first} {last}"
    player_id = pid(name)
    if player_id in used_ids:
        continue

    used_ids.add(player_id)
    base_rating = CLUB_BASE_RATING.get(club['id'], 66)
    rating = clamp(
        base_rating + DECADE_BONUS.get(era, 0) + POSITION_BONUS.get(position, 0) + random.randint(-4, 4),
        50,
        99,
    )
    caps_nat = 0
    goals_nat = 0
    if club['id'] == 'argentina' and rating >= 84:
        caps_nat = random.randint(8, 120)
        goals_nat = random.randint(0, 40)

    goals_club = {
        'GK': random.randint(0, 1),
        'CB': random.randint(0, 12),
        'LB': random.randint(0, 10),
        'RB': random.randint(0, 10),
        'CDM': random.randint(0, 20),
        'CM': random.randint(0, 35),
        'CAM': random.randint(5, 45),
        'LW': random.randint(8, 70),
        'RW': random.randint(8, 70),
        'ST': random.randint(20, 180),
        'CF': random.randint(15, 120),
    }[position]
    assists_club = {
        'GK': random.randint(0, 1),
        'CB': random.randint(0, 6),
        'LB': random.randint(0, 12),
        'RB': random.randint(0, 12),
        'CDM': random.randint(0, 14),
        'CM': random.randint(2, 30),
        'CAM': random.randint(5, 45),
        'LW': random.randint(4, 55),
        'RW': random.randint(4, 55),
        'ST': random.randint(0, 25),
        'CF': random.randint(0, 20),
    }[position]

    L.append({
        'id': player_id,
        'name': name,
        'fullName': name,
        'birthDate': build_birth_date(season_year),
        'position': position,
        'positions': build_positions(position),
        'nationality': 'Argentina',
        'height': random.randint(165, 196),
        'weight': random.randint(65, 90),
        'preferredFoot': random.choice(['Derecho', 'Izquierdo']),
        'clubs': [{'id': club['id'], 'name': club['name'], 'years': str(season_year)}],
        'capsNationalTeam': caps_nat,
        'goalsNationalTeam': goals_nat,
        'capsClub': random.randint(35, 650),
        'goalsClub': goals_club,
        'assistsClub': assists_club,
        'trophies': [],
        'image': '',
        'marketValue': f"{random.randint(1, 80)}M€",
        'activeYears': build_active_years(season_year),
        'decade': era,
        'rating': rating,
        'legendary': rating >= 88,
    })
    generated += 1

clubs_with_gk = {
    club_id
    for club_id in (
        c['id']
        for c in clubs
        if c['id'] != 'argentina'
    )
    if any(
        p['position'] == 'GK'
        and any(club_ref.get('id') == club_id for club_ref in p.get('clubs', []))
        for p in (players + L)
    )
}

for club in clubs:
    if club['id'] == 'argentina' or club['id'] in clubs_with_gk:
        continue
    for era in club.get('era', []):
        add_goalkeeper_for_club(club, era)

def club_group_counts(club_id):
    counts = {'GK': 0, 'defense': 0, 'midfield': 0, 'attack': 0}
    for player in (players + L):
        if not any(club_ref.get('id') == club_id for club_ref in player.get('clubs', [])):
            continue
        pos = player.get('position', 'CM')
        if pos == 'GK':
            counts['GK'] += 1
        elif pos in ('CB', 'LB', 'RB'):
            counts['defense'] += 1
        elif pos in ('CDM', 'CM', 'CAM', 'LM', 'RM'):
            counts['midfield'] += 1
        else:
            counts['attack'] += 1
    return counts

CLUB_FILLER_POSITIONS = {
    'defense': ['CB', 'CB', 'LB', 'RB'],
    'midfield': ['CDM', 'CM', 'CM', 'CAM'],
    'attack': ['ST', 'ST', 'LW', 'RW'],
}

for club in clubs:
    if club['id'] == 'argentina':
        continue
    counts = club_group_counts(club['id'])
    eras = club.get('era') or ['2000s']
    for group, target in [('defense', 3), ('midfield', 3)]:
        while counts[group] < target:
            era = random.choice(eras)
            position = random.choice(CLUB_FILLER_POSITIONS[group])
            if add_club_cover_player(club, era, position):
                counts[group] += 1

print(f"Added {generated} synthetic expansion players. Target total: {TARGET_TOTAL}")

# ═══════════════════════════════════════════
# BUILD SQUADS
# ═══════════════════════════════════════════
players.extend(L)
print(f"Added {len(L)} new players. Total: {len(players)}")

# Write enriched players.json
json.dump(players, open(os.path.join(DATA,'players.json'),'w'), ensure_ascii=False, indent=2)

# Index players by club
club_pids = {}
for p in players:
    for c in p.get('clubs',[]):
        cid = c['id']
        if cid not in club_pids: club_pids[cid] = []
        club_pids[cid].append(p['id'])

squads = []

# Club squads by decade
for club in clubs:
    cid = club['id']
    pids = club_pids.get(cid,[])
    if len(pids) < 5: continue
    for decade in club.get('era',[]):
        year = decade[:-1]  # "1980s" -> "1980"
        random.seed(hash(cid+decade))
        n = min(len(pids), random.randint(14,22))
        sp = random.sample(pids,n) if n<=len(pids) else pids
        if len(sp) >= 11:
            squads.append({
                'id':f"{cid}-{year}", 'clubId':cid, 'season':year,
                'competition':'Liga Profesional',
                'label':f"{club['name']} {year}s",
                'playerIds':sp
            })

# Argentina national team squads
nat = sorted([p for p in players if p.get('capsNationalTeam',0)>0],
             key=lambda p:p.get('rating',0), reverse=True)
tournaments = [
    ('1978','Mundial 1978','Copa del Mundo'),('1986','Mundial 1986','Copa del Mundo'),
    ('1990','Mundial 1990','Copa del Mundo'),('2014','Mundial 2014','Copa del Mundo'),
    ('2022','Mundial 2022','Copa del Mundo'),('2021','Copa America 2021','Copa America'),
    ('2024','Copa America 2024','Copa America'),
]
for year,label,comp in tournaments:
    td = int(year[:3])*10
    rel = [p for p in nat if abs(int(p.get('decade','1990s')[:-1])-td)<=15]
    if len(rel)<18: rel=nat[:23]
    squads.append({
        'id':f"argentina-{year}", 'clubId':'argentina', 'season':year,
        'competition':comp, 'label':f"Argentina {label}",
        'playerIds':[p['id'] for p in rel[:23]]
    })

# Add Argentina to clubs if missing
if not any(c['id']=='argentina' for c in clubs):
    clubs.append({
        'id':'argentina','name':'Argentina','shortName':'Argentina',
        'founded':1893,'stadium':'Estadio Monumental','city':'Buenos Aires',
        'colors':['#75AADB','#FFFFFF'],'titles':3,'Libertadores':0,
        'era':['1970s','1980s','1990s','2000s','2010s','2020s'],
        'nickname':'La Albiceleste'
    })
    json.dump(clubs, open(os.path.join(DATA,'clubs.json'),'w'), ensure_ascii=False, indent=2)

json.dump(squads, open(os.path.join(DATA,'squads.json'),'w'), ensure_ascii=False, indent=2)

# Add raw_squads.txt squads if they exist
raw_path = os.path.join(DATA,'raw_squads.txt')
if os.path.exists(raw_path):
    current = None
    raw_squads = []
    for line in open(raw_path):
        line=line.strip()
        if not line:
            if current: raw_squads.append(current); current=None
            continue
        if line.startswith('#'): continue
        parts=line.split('|')
        if len(parts)>=2 and not current:
            current={'id':f"{parts[0]}-{parts[1]}",'clubId':parts[0],'season':parts[1],
                'competition':parts[2] if len(parts)>2 else 'Liga Profesional',
                'label':parts[3] if len(parts)>3 else f"{parts[0]} {parts[1]}",
                'names':[]}
        elif len(parts)>=3 and current:
            current['names'].append(parts[0].strip())
    if current: raw_squads.append(current)
    
    for rs in raw_squads:
        pids=[]
        for nm in rs['names']:
            for p in players:
                if p['name'].lower()==nm.lower():
                    pids.append(p['id']); break
        if len(pids)>=11:
            squads.append({
                'id':rs['id'],'clubId':rs['clubId'],'season':rs['season'],
                'competition':rs['competition'],'label':rs['label'],'playerIds':pids
            })
    json.dump(squads, open(os.path.join(DATA,'squads.json'),'w'), ensure_ascii=False, indent=2)
    print(f"Also added squads from raw_squads.txt")

print(f"\n{'='*50}")
print(f"RESULT: {len(players)} players, {len(squads)} squads")
club_squads = [s for s in squads if s['clubId']!='argentina']
nat_squads = [s for s in squads if s['clubId']=='argentina']
print(f"  Club squads: {len(club_squads)}")
print(f"  National squads: {len(nat_squads)}")
for s in squads[:5]:
    print(f"  {s['label']}: {len(s['playerIds'])} players")
print(f"  ... and {len(squads)-5} more")
