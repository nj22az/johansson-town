import json,numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
M=json.loads((ROOT/'building_manifest.json').read_text())
def dist(a,b,c,d):
 a,b,c,d=map(lambda x:np.array(x,float),[a,b,c,d]);u=b-a;v=d-c;w=a-c;A=u@u;B=u@v;C=v@v;D=u@w;E=v@w;den=A*C-B*B
 # Clamp iterative coordinate minimisation, with four endpoint candidates to cover parallel cases.
 pairs=[]
 if den>1e-8:
  s=(B*E-C*D)/den;t=(A*E-B*D)/den
  if 0<=s<=1 and 0<=t<=1:pairs.append((s,t))
 for s in [0,1]:pairs.append((s,np.clip((E+B*s)/C,0,1)))
 for t in [0,1]:pairs.append((np.clip((B*t-D)/A,0,1),t))
 return min(np.linalg.norm(w+s*u-t*v) for s,t in pairs)
cl=[]
for i,r in enumerate(M['routes']):
 for q in M['routes'][i+1:]:
  if r['system']==q['system'] or {r['system'],q['system']}=={'sanitary','vent'}:continue
  # hot/cold terminate at shared fixture and manifold physical sockets represented by logical centre.
  for j,(a,b) in enumerate(zip(r['points_mm'],r['points_mm'][1:])):
   for k,(c,d) in enumerate(zip(q['points_mm'],q['points_mm'][1:])):
    dd=dist(a,b,c,d);lim=(r['visual_diameter_mm']+q['visual_diameter_mm'])/2
    if dd<lim-0.01:cl.append([r['id'],j,q['id'],k,round(dd,1),lim])
(ROOT/'Cross_System_Clearance.json').write_text(json.dumps(cl,indent=2));print('Cross-system collisions',len(cl));print(json.dumps(cl[:60],indent=2))
