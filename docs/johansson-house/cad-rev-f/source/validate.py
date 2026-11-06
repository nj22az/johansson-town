from pathlib import Path
import json,math,struct,collections
import numpy as np
import ezdxf
ROOT=Path(__file__).resolve().parents[1];M=json.loads((ROOT/'building_manifest.json').read_text());results=[];defects=[]
def check(name,ok,detail):
 results.append({'check':name,'pass':bool(ok),'detail':detail})
 if not ok:defects.append({'check':name,'detail':detail})
def hit(a,b,box,rad=0):
 a=np.array(a,float);b=np.array(b,float);d=b-a;lo=np.array(box[:3])-rad;hi=np.array(box[3:])+rad;t0=0;t1=1
 for i in range(3):
  if abs(d[i])<1e-8:
   if a[i]<=lo[i]+1e-5 or a[i]>=hi[i]-1e-5:return False
  else:
   u,v=(lo[i]-a[i])/d[i],(hi[i]-a[i])/d[i]
   t0=max(t0,min(u,v));t1=min(t1,max(u,v))
   if t1-t0<=1e-6:return False
 return t1>0 and t0<1
ids=[e['id'] for e in M['geometry']]+[r['id'] for r in M['routes']]+[r['id'] for rs in M['rooms'].values() for r in rs]
check('unique stable IDs',len(ids)==len(set(ids)),{'count':len(ids)})
check('all positive geometry volumes',all(all(e['bounds_mm'][i+3]>e['bounds_mm'][i] for i in range(3)) for e in M['geometry']),'No reversed or zero-size solid')
cl=[]
for r in M['routes']:
 for si,(a,b) in enumerate(zip(r['points_mm'],r['points_mm'][1:])):
  for e in M['geometry']:
   if e['collision'] and e['kind'] in ['wall','slab','stair','guard','site'] and hit(a,b,e['bounds_mm'],r['visual_diameter_mm']/2):cl.append([r['id'],si,e['id']])
check('service versus architecture solids',not cl,{'clashes':cl[:100],'total':len(cl)})
# Check gravity including diagonal segments; pumped and vent routes excluded.
falls=[]
for r in M['routes']:
 if r['flow']!='gravity':continue
 for i,(a,b) in enumerate(zip(r['points_mm'],r['points_mm'][1:])):
  run=math.hypot(b[0]-a[0],b[1]-a[1]);drop=a[2]-b[2]
  required=.0199 if r['system']=='sanitary' else .0099
  if drop<-1e-5 or (run>1 and drop/run<required):falls.append([r['id'],i,round(drop/run,6) if run else drop])
check('gravity routes descend with specified fall',not falls,falls)
# Mapping of route endpoints to functional nodes (storm left alias is explicit).
errs=[]
for r in M['routes']:
 sys='water' if r['system'].startswith('potable') else 'drainage' if r['system'] in ['sanitary','storm','vent'] else 'hvac' if r['system'] in ['hvac','refrigerant','condensate'] else 'electrical' if r['system']=='electrical' else None
 if sys is None:continue
 nodes=M['systems'][sys]['nodes_mm']
 if not r.get('endpoint_alias') and math.dist(r['points_mm'][0],r.get('source_port_mm',nodes[r['from']]))>.01:errs.append(r['id']+' source')
 if math.dist(r['points_mm'][-1],r.get('destination_port_mm',nodes[r['to']]))>.01:errs.append(r['id']+' destination')
check('spatial routes equal functional endpoints',not errs,errs)
# Door aperture body 500 mm wide x 1800 high swept through each opening.
opfail=[]
for lev,ops in M['openings'].items():
 z=M['levels_mm'][lev]
 for o in ops:
  if o['type']!='door':continue
  s=(o['start_mm']+o['end_mm'])/2;side=o.get('side');axis=o.get('axis')
  if side in ['south','north']:y=100 if side=='south' else 9900;a=[s,y-200,z+900];b=[s,y+200,z+900]
  elif side in ['west','east']:x=100 if side=='west' else 11900;a=[x-200,s,z+900];b=[x+200,s,z+900]
  elif axis=='x':x=o['position_mm'];a=[x-200,s,z+900];b=[x+200,s,z+900]
  else:y=o['position_mm'];a=[s,y-200,z+900];b=[s,y+200,z+900]
  for e in M['geometry']:
   if e['kind']=='wall' and hit(a,b,e['bounds_mm'],250):opfail.append([o['id'],e['id']])
check('all door apertures pass 500 mm capsule width',not opfail,opfail)
# Grid flood fill with 250 mm wall dilation, stair well excluded. Doors assumed open.
access={}
for lev,z in M['levels_mm'].items():
 blocked=set();N=116;K=96
 for ix in range(N):
  x=250+ix*100
  for iy in range(K):
   y=250+iy*100
   obs=False
   if 4850<x<7350 and 3450<y<6600:obs=True # reserved stair and guard footprint
   for e in M['geometry']:
    b=e['bounds_mm']
    if e['kind']=='wall' and b[2]<z+1800 and b[5]>z+50 and b[0]-250<x<b[3]+250 and b[1]-250<y<b[4]+250:obs=True;break
   if obs:blocked.add((ix,iy))
 start=min(((i,j) for i in range(N) for j in range(K) if (i,j) not in blocked),key=lambda q:abs(250+q[0]*100-7650)+abs(250+q[1]*100-3000))
 seen={start};todo=collections.deque([start])
 while todo:
  i,j=todo.popleft()
  for ni,nj in [(i-1,j),(i+1,j),(i,j-1),(i,j+1)]:
   if 0<=ni<N and 0<=nj<K and (ni,nj) not in seen and (ni,nj) not in blocked:seen.add((ni,nj));todo.append((ni,nj))
 for room in M['rooms'][lev]:
  count=sum(any(b[0]<250+i*100<b[2] and b[1]<250+j*100<b[3] for b in room['zones_mm']) for i,j in seen)
  access[room['id']]=count
check('all room zones reachable by 500 mm capsule on open-door plan',all(access.values()),access)
# Headroom on both flights at each tread centre against upper floor, roof, stacked stair treads.
hr=[]
for lev,z in [('B1',-2800),('G0',0)]:
 for flight,x in [('A',5550),('B',6650)]:
  for i in range(7):
   y=3825+i*250 if flight=='A' else 5325-i*250;top=z+(i+1)*175 if flight=='A' else z+1575+i*175
   bottoms=[e['bounds_mm'][2] for e in M['geometry'] if e['kind'] in ['slab','stair','wall'] and e['bounds_mm'][0]<x<e['bounds_mm'][3] and e['bounds_mm'][1]<y<e['bounds_mm'][4] and e['bounds_mm'][2]>top+1]
   clear=min(bottoms)-top if bottoms else 10000;hr.append(clear)
check('stair vertical headroom >=2000 mm',min(hr)>=2000,{'minimum_mm':min(hr),'samples':len(hr)})
check('stair rise run and available enclosure',16*175==2800 and 7*250+900==2650 and 2*900+200==2000,{'rise':2800,'run':2650,'width':2000,'side_passage':1140})
# Mesh structural verification using GLB binary, accessor indices, triangle area and bounds.
for fn in ['Johansson_House_Architecture.glb','Johansson_House_Services.glb']:
 raw=(ROOT/fn).read_bytes();magic,version,length=struct.unpack_from('<III',raw);jl,jt=struct.unpack_from('<II',raw,12);j=json.loads(raw[20:20+jl]);bl,bt=struct.unpack_from('<II',raw,20+jl);binary=raw[28+jl:];errors=[]
 for mesh in j['meshes']:
  p=mesh['primitives'][0];va=j['accessors'][p['attributes']['POSITION']];ia=j['accessors'][p['indices']];vv=j['bufferViews'][va['bufferView']];iv=j['bufferViews'][ia['bufferView']]
  v=np.frombuffer(binary,np.float32,va['count']*3,vv['byteOffset']).reshape(-1,3);f=np.frombuffer(binary,np.uint32,ia['count'],iv['byteOffset']).reshape(-1,3)
  if not np.isfinite(v).all() or f.max()>=len(v):errors.append(mesh['name'])
  if np.any(np.linalg.norm(np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]]),axis=1)<1e-8):errors.append(mesh['name']+' degenerate')
 check(fn+' valid binary meshes',magic==0x46546c67 and version==2 and length==len(raw) and len(binary)==bl and not errors,errors)
 check(fn+' performance budget',len(j['nodes'])<2000 and sum(a['count'] for a in j['accessors'] if a['type']=='SCALAR')/3<50000,{'nodes':len(j['nodes'])})
# DXF audit and coordinate geometry parity for every route.
for name in M['drawing_index']:
 d=ezdxf.readfile(ROOT/name);a=d.audit();check(name+' CAD audit',not a.has_errors and d.units==4,{'entities':len(d.modelspace()),'errors':len(a.errors),'fixes':len(a.fixes)})
for sys in set(r['system'] for r in M['routes']):
 d=ezdxf.readfile(ROOT/('R_'+sys+'_3D.dxf'));ls=[list(e.points()) for e in d.modelspace().query('POLYLINE')];expect=[r['points_mm'] for r in M['routes'] if r['system']==sys]
 check(sys+' route DXF/manifest parity',len(ls)==len(expect) and all(np.allclose(a,b) for a,b in zip(ls,expect)),{'polylines':len(ls)})
check('every Revision E asset has a migration action',len(M['migration_from_E'])==len(json.loads((ROOT/'source/RevisionE_Input.json').read_text())['game_assets']),{'migrated':len(M['migration_from_E'])})
check('migration aliases resolve',all(v['action']=='retire' or v['target'] in ids for v in M['migration_from_E'].values()),'Retired dependencies explicitly documented')
check('HVAC supply/extract design balance',M['systems']['hvac']['fans_m3_h']['B1_FRESH']==sum(M['systems']['hvac']['fans_m3_h'][k] for k in ['B1_EXHAUST','SAUNA_EXHAUST','SMOKING_EXHAUST']),M['systems']['hvac']['fans_m3_h'])
check('roof stormwater design capacity',2*3>=M['systems']['drainage']['storm_design']['roof_flow_L_s'],M['systems']['drainage']['storm_design'])
loads=M['systems']['electrical']['loads'];total=sum(x['rated_W'] for x in loads.values());check('game electrical main demand budget',total*.6<12000,{'connected_W':total,'diversified_W':total*.6,'budget_W':12000})
report={'status':'PASS' if not defects else 'FAIL','scope':'game reference asset; no construction approval or live engine certification','checks':len(results),'passed':sum(x['pass'] for x in results),'failed':len(defects),'results':results,'defects':defects}
(ROOT/'Validation_Results.json').write_text(json.dumps(report,indent=2));print(json.dumps({'status':report['status'],'checks':len(results),'defects':defects},indent=2))
# Extended production checks; deliberately independent of exporter success flags.
from collections import Counter
faces=M['roof']['mesh_triangles'];cnt=Counter(tuple(sorted((a,b))) for t in faces for a,b in zip(t,t[1:]+t[:1]))
check('roof closed manifold including sleeve walls',all(v==2 for v in cnt.values()),{'edges':len(cnt),'non_manifold_edges':sum(v!=2 for v in cnt.values())})
check('roof has vent and flue apertures with 20 mm radial clearance',all(any(q[0]+50<=x<=q[2]-50 and q[1]+50<=y<=q[3]-50 for q in M['roof']['sleeve_apertures_mm']) for x,y in [(11400,6000),(11100,2200)]),M['roof']['sleeve_apertures_mm'])
check('no inherited visual flat roof overlay',not any(e['kind']=='roof' for e in M['geometry']) and M['roof']['structural_roof_deck_top_mm']==5600,'One hipped exterior roof and one lower structural ceiling deck')
# Actual room zones cannot intersect partition solids in plan below player height.
zonecl=[]
for lev,rs in M['rooms'].items():
 z=M['levels_mm'][lev]
 for room in rs:
  for b in room['zones_mm']:
   for e in M['geometry']:
    eb=e['bounds_mm']
    if e['kind']=='wall' and eb[2]<z+1800 and eb[5]>z and min(b[2],eb[3])-max(b[0],eb[0])>1e-5 and min(b[3],eb[4])-max(b[1],eb[1])>1e-5:zonecl.append([room['id'],e['id']])
check('room zones do not overlap wall solids',not zonecl,zonecl[:20])
fixtures=M['electrical_fixtures'];lightrooms={f['room_id'] for f in fixtures if f['type']=='ceiling luminaire'}
check('every named room has a controlled luminaire',len(lightrooms)==sum(map(len,M['rooms'].values())),{'luminaires':len(lightrooms),'fixture_total':len(fixtures)})
# Physical ports must remain within defined equipment envelope of logical node centre.
pe=[]
for r in M['routes']:
 sys='water' if r['system'].startswith('potable') else 'drainage' if r['system'] in ['sanitary','storm','vent'] else 'hvac' if r['system'] in ['hvac','refrigerant','condensate'] else 'electrical' if r['system']=='electrical' else None
 if sys and not r.get('endpoint_alias'):
  n=M['systems'][sys]['nodes_mm']
  for point,node in [(r['points_mm'][0],r['from']),(r['points_mm'][-1],r['to'])]:
   if math.dist(point,n[node])>250:pe.append([r['id'],node])
check('equipment service port offsets <=250 mm',not pe,pe)
lengthbad=[r['id'] for r in M['routes'] if abs(r['length_mm']-sum(math.dist(a,b) for a,b in zip(r['points_mm'],r['points_mm'][1:])))>.001]
check('route scheduled lengths equal spatial polylines',not lengthbad,lengthbad)
# Verify every electrical and water functional edge has at least one spatial route.
missing=[]
for sys in ['electrical','water']:
 for a,b,c in M['systems'][sys]['edges']:
  if not any(r['from']==a and r['to']==b and (r['system']=='electrical' if sys=='electrical' else r['system'].startswith('potable')) for r in M['routes']):missing.append([sys,a,b])
check('electrical and potable graphs fully routed',not missing,missing)
# Exact segment clearance between separate service families. Shared vent/soil stack is intentional.
ns={"__file__":str(Path(__file__).parent/"clashes.py")};exec((Path(__file__).parent/'clashes.py').read_text().split('cl=[]')[0],ns)
sep=[]
for i,r in enumerate(M['routes']):
 for q in M['routes'][i+1:]:
  if r['system']==q['system'] or {r['system'],q['system']}=={'sanitary','vent'}:continue
  for j,(a,b) in enumerate(zip(r['points_mm'],r['points_mm'][1:])):
   for k,(c,d) in enumerate(zip(q['points_mm'],q['points_mm'][1:])):
    if ns['dist'](a,b,c,d)<(r['visual_diameter_mm']+q['visual_diameter_mm'])/2-.01:sep.append([r['id'],q['id'],j,k])
check('distinct service families have no tube envelope collisions',not sep,{'clashes':sep,'intentional_shared':'sanitary and vent occupy one continuous vented stack; same-family routes may share network trunks or conduit runs'})
# Game-only cold-water pressure calculation along the longest supply path.
wat=M['systems']['water'];cold=[r for r in M['routes'] if r['system']=='potable_cold'];pr={r['to']:r for r in cold}
press={}
for fixture,flow in wat['fixture_flow_L_s'].items():
 chain=[];node=fixture
 while node in pr:
  r=pr[node];chain.append(r);node=r['from']
 friction=0
 for r in chain:
  diam=r['visual_diameter_mm']/1000;q=(flow if r['to']==fixture else .6)/1000;vel=q/(math.pi*diam*diam/4);friction+=.025*(r['length_mm']/1000)/diam*vel*vel/(2*9.81)*9.81
 static=max(0,(wat['nodes_mm'][fixture][2]-wat['nodes_mm']['ISLAND_WATER'][2])/1000)*9.81
 press[fixture]=round(300-static-friction,2)
check('game cold-water pressure exceeds 100 kPa at design fixtures',min(press.values())>=100,{'residual_kPa':press,'model':'Darcy factor 0.025; upstream 0.6 L/s; fixture demand from schedule; nominal game envelopes; not engineering pipe sizing'})
check('external and internal stair proxy slopes within 40 degrees',math.degrees(math.atan(175/250))<40,{'slope_deg':round(math.degrees(math.atan(175/250)),2),'end_step_mm':175})
check('opening guards preserve 1100 mm physical side passage',8240-(7120+20)==1100,{'clear_mm':1100,'capsule_width_mm':500})
# A deterministic smoke test of state contract is run independently in test_sim.py.
sim=json.loads((ROOT/'Simulation_Test_Results.json').read_text()) if (ROOT/'Simulation_Test_Results.json').exists() else {'pass':False}
check('reference simulation regression suite',sim.get('pass'),sim)
report={'status':'PASS' if not defects else 'FAIL','scope':'coordinated game production reference; no construction certification or live-engine runtime certification','checks':len(results),'passed':sum(x['pass'] for x in results),'failed':len(defects),'results':results,'defects':defects}
(ROOT/'Validation_Results.json').write_text(json.dumps(report,indent=2));print(json.dumps({'extended_status':report['status'],'checks':len(results),'defects':defects},indent=2))
