#!/usr/bin/env python3
"""Historical TM Scraper for Argentine Primera División 1990-2025."""
import json,re,sys,time,os,hashlib,random,urllib.request,urllib.error
B=os.path.dirname(os.path.abspath(__file__))
D=os.path.join(B,'..','data'); C=os.path.join(D,'cache'); os.makedirs(C,exist_ok=True)
PM={'Goalkeeper':'GK','Centre-Back':'CB','Left-Back':'LB','Right-Back':'RB',
'Defensive Midfield':'CDM','Central Midfield':'CM','Attacking Midfield':'CAM',
'Left Winger':'LW','Right Winger':'RW','Centre-Forward':'ST','Second Striker':'CF'}
UA=['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36']
def sl(n):
 s=n.lower().replace(' ','-').replace('.','').replace("'",'')
 for a,b in [('á','a'),('é','e'),('í','i'),('ó','o'),('ú','u'),('ñ','n')]:s=s.replace(a,b)
 return s
def fet(url,ck):
 cp=os.path.join(C,hashlib.md5(ck.encode()).hexdigest()+'.html')
 if os.path.exists(cp)and os.path.getmtime(cp)>time.time()-86400*60:return open(cp,'r',errors='ignore').read()
 time.sleep(random.uniform(2.5,4.5))
 for i in range(3):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':random.choice(UA),'Accept':'text/html','Accept-Language':'es-AR,es;q=0.9','Referer':'https://www.transfermarkt.com/'})
   r=urllib.request.urlopen(req,timeout=20);h=r.read().decode('utf-8',errors='ignore')
   if len(h)>1000:open(cp,'w').write(h)
   return h
  except urllib.error.HTTPError as e:
   if e.code in(403,429):time.sleep(30+random.uniform(0,20))
   else:time.sleep(5*(i+1))
  except:time.sleep(5*(i+1))
 return ''
def ps(html):
 pl=[]
 for row in re.findall(r'<tr[^>]*>(.*?)</tr>',html,re.DOTALL):
  if 'hauptlink'not in row:continue
  nm=re.search(r'class="hauptlink"[^>]*>.*?<a[^>]*>([^<]+)</a>',row,re.DOTALL)
  if not nm:nm=re.search(r'class="hauptlink"[^>]*>\s*<a[^>]*title="([^"]+)"',row,re.DOTALL)
  if not nm:continue
  name=nm.group(1).strip()
  pos='CM'
  for tp,sh in PM.items():
   if tp.lower() in row.lower():pos=sh;break
  mv=''
  mvm=re.search(r'class="rechts[^"]*"[^>]*>\s*(?:<a[^>]*>)?\s*([\d,.]+[kmK])',row)
  if mvm:mv=mvm.group(1).strip()
  nat='Argentina'
  if 'flaggenrahmen' in row:
   fm=re.search(r'alt="([^"]+)"',row[re.search(r'flaggenrahmen',row).start():re.search(r'flaggenrahmen',row).start()+200])
   if fm:nat=fm.group(1)
  pl.append({'id':sl(name),'name':name,'pos':pos,'nat':nat,'mv':mv})
 return pl
def er(mv,pos):
 v=0
 if mv:
  ms=mv.lower().replace(',','.')
  try:
   if 'k' in ms:v=float(ms.replace('k',''))/1000
   elif 'm' in ms:v=float(ms.replace('m',''))
  except:pass
 b=90 if v>50 else 85 if v>20 else 80 if v>10 else 75 if v>5 else 70 if v>2 else 65 if v>1 else 60 if v>0.5 else 55 if v>0.1 else 52
 return max(50,min(99,b+{'GK':-2,'CB':0,'LB':1,'RB':1,'CDM':0,'CM':1,'CAM':2,'LW':2,'RW':2,'ST':3,'CF':2}.get(pos,0)+random.randint(-3,3)))

with open(os.path.join(B,'tm_clubs.json')) as f: CLUBS=json.load(f)
SY,EY=1990,2025
pf=os.path.join(D,'scrape_progress.json')
def lp():
 if os.path.exists(pf):return json.load(open(pf))
 return{'done':[],'players':{},'errs':0}
def sp(p):json.dump(p,open(pf,'w'))
prog=lp(); ap=prog['players']
tc=len(CLUBS); ty=EY-SY+1; tp=tc*ty; dc=len(prog['done'])
print(f"=== TM Historical Scraper ===")
print(f"Clubs:{tc} Years:{SY}-{EY} Pages:{tp} Done:{dc} Players:{len(ap)}")

for ci,(cs,cn,tm_id,nk,co) in enumerate(CLUBS):
 for yr in range(SY,EY+1):
  key=f"{cs}_{yr}"
  if key in prog['done']:continue
  url=f"https://www.transfermarkt.com/{cs}/kader/verein/{tm_id}/saison_id/{yr}/plus/1"
  print(f"[{dc+1}/{tp}] {cn} {yr}...",end=' ',flush=True)
  html=fet(url,key)
  if not html or len(html)<2000:
   print("SKIP");prog['errs']+=1;prog['done'].append(key);sp(prog);dc+=1;continue
  pls=ps(html); nc=0
  for p in pls:
   pid=p['id']
   if pid not in ap:
    ap[pid]={'id':pid,'name':p['name'],'position':p['pos'],'nationality':p['nat'],
    'marketValue':p['mv'],'clubs':[{'id':cs,'name':cn,'years':str(yr)}],'rating':er(p['mv'],p['pos'])}
    nc+=1
   else:
    ec=[c['id'] for c in ap[pid].get('clubs',[])]
    if cs not in ec:ap[pid]['clubs'].append({'id':cs,'name':cn,'years':str(yr)})
  print(f"{len(pls)} jugadores ({nc} nuevos)")
  prog['done'].append(key)
  if dc%10==0:sp(prog)
  dc+=1
# Save final
sp(prog)
# Write output files
players_list=sorted(ap.values(),key=lambda x:x.get('rating',50),reverse=True)
with open(os.path.join(D,'players_historical.json'),'w') as f:json.dump(players_list,f,ensure_ascii=False,indent=1)
# Build squads
squads={}
for p in players_list:
 for c in p.get('clubs',[]):
  for yr_str in c.get('years','').split(','):
   yr=yr_str.strip()
   if not yr:continue
   sk=f"{c['id']}_{yr}"
   if sk not in squads:squads[sk]={'clubId':c['id'],'clubName':c['name'],'season':yr,'playerIds':[]}
   if p['id'] not in squads[sk]['playerIds']:squads[sk]['playerIds'].append(p['id'])
squad_list=[]
for k,v in squads.items():
 if len(v['playerIds'])>=5:
  v['id']=k;v['label']=f"{v['clubName']} {v['season']}"
  v['competition']='Liga Profesional'
  squad_list.append(v)
with open(os.path.join(D,'squads_historical.json'),'w') as f:json.dump(squad_list,f,ensure_ascii=False,indent=1)
print(f"\n=== COMPLETADO ===")
print(f"Jugadores: {len(players_list)}")
print(f"Planteles: {len(squad_list)}")
print(f"Errores: {prog['errs']}")
print(f"Archivos: players_historical.json, squads_historical.json")
