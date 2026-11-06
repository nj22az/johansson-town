from pathlib import Path
import json, math, struct, copy, csv, hashlib
import numpy as np
import ezdxf
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT
OLD=json.loads((ROOT/'source/RevisionE_Input.json').read_text())
M={'project':OLD['project'],'revision':'F - coordinated game production reference','schema_version':2,'purpose':'Johansson World game asset and systems simulation; not construction documentation','setting':'Fictional Okinawan island, circa 1995 (inherited house brief)','units':'mm','footprint_mm':[12000,10000],'levels_mm':OLD['levels_mm'],'coordinates':{'cad':'right handed X east, Y north, Z up; southwest external corner; finished G0 floor Z=0','gltf':'metres; (x,y,z) = (CAD X, CAD Z, -CAD Y)/1000','north':'CAD +Y','floor_top':'finished floor equals slab top; no 100 mm datum offset'},'wall_thickness_mm':OLD['wall_thickness_mm'],'rooms':{},'openings':copy.deepcopy(OLD['openings']),'geometry':[],'routes':[],'penetrations':[],'systems':{},'equipment':[],'design_holds':[],'exclusions':['No structural certification, real installation ratings, product selection, survey or regulatory approval.','Live Johansson World repository runtime acceptance is not performed; this delivery contains integration specifications and tested reference simulation.'],'roof':{'eaves_z_mm':5800,'ridge_z_mm':8000,'bounds_mm':[-400,-400,12400,10400],'ridge_xy_mm':[[5000,5000],[7000,5000]],'finish':'weathered red tile','structural_roof_deck_top_mm':5600},'stair':{'footprint_mm':[5100,3700,7100,6350],'risers_per_storey':16,'riser_mm':175,'tread_mm':250,'flight_width_mm':900,'landing_depth_mm':900,'centre_gap_mm':200,'rise_mm':2800,'walkway_clear_mm':1100,'guard_height_mm':1100,'collision':'continuous sloping proxy over tread noses; visual treads retain 175 mm risers','headroom_target_mm':2000}}
G=M['geometry']
def box(id,b,kind='wall',color=None,collide=True):
 G.append({'id':id,'kind':kind,'bounds_mm':list(b),'collision':collide,'color':color or {'wall':[197,185,159,255],'slab':[131,125,114,255],'stair':[180,160,123,255],'guard':[76,80,77,255],'equipment':[91,140,155,255],'site':[122,129,113,255]}.get(kind,[190,180,160,255])})
def split_rect(b,cut):
 # Subtract a rectangular penetration from a rectangular solid, retaining non-overlapping boxes.
 a=np.array(b[:3],float); z=np.array(b[3:],float); c=np.maximum(a,cut[:3]); d=np.minimum(z,cut[3:])
 if np.any(d-c<=0):return [b]
 out=[]; lo=a.copy(); hi=z.copy()
 for k in range(3):
  if c[k]>lo[k]: t=hi.copy();t[k]=c[k];out.append(list(lo)+list(t));lo[k]=c[k]
  if d[k]<hi[k]: t=lo.copy();t[k]=d[k];out.append(list(t)+list(hi));hi[k]=d[k]
 return out

def wall(id,b,openings):
 pieces=[b]
 for c in openings:pieces=[q for p in pieces for q in split_rect(p,c)]
 for i,p in enumerate(pieces):box(id+f'-{i:02}',p)
# Reconcile planning zones. Original room IDs survive; new corridors are explicit.
for lev,z in M['levels_mm'].items():
 oldrooms=OLD['rooms'][lev];rooms=[]
 for i,r in enumerate(oldrooms):
  name=r['name']; b=r['bounds_mm']; x0,y0,x1,y1=b
  if i in [0,1]: b=[200,200 if i==0 else 5060,4840,4940 if i==0 else 9800]
  elif i==2:b=[4960,3560 if lev=='G0' else 200,8240,9800 if lev=='G0' else 6440]
  elif name in ['Boiler and pumps','Bathroom']:b=[8360,200,11800,3440]
  elif name=='Sauna and shower':b=[8360,3560,11800,7040]
  elif name=='Thuan sewing studio':b=[8360,200,11800,4940]
  elif name=='Entry and genkan':b=[4960,200,8240,3440]
  elif name=='WC and utility':b=[8360,5060,11800,7040]
  elif name=='Covered terrace access':b=[8360,7160,11800,9800]
  elif name=='Study':b=[8360,3560,11800,7040]
  elif name in ['Storage','Linen and landing']:b=[4960,6560,11800,9800]
  poly=[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]]
  # North room spans central and east zones with a connecting door; express as two zones.
  zones=[b]
  if name in ['Storage','Linen and landing']:zones=[[4960,6560,8240,9800],[8360,7160,11800,9800]]
  rooms.append({'id':f'{lev}-ROOM-{i+1:02}','name':name,'zones_mm':zones,'bounds_mm':b,'level':lev,'floor_z_mm':z,'area_m2':round(sum((v[2]-v[0])*(v[3]-v[1]) for v in zones)/1e6,3)})
 M['rooms'][lev]=rooms
 # Exterior wall segments with real apertures
 for side in ['south','north','west','east']:
  b={'south':[0,0,z,12000,200,z+2620],'north':[0,9800,z,12000,10000,z+2620],'west':[0,200,z,200,9800,z+2620],'east':[11800,200,z,12000,9800,z+2620]}[side]
  cuts=[]
  for op in M['openings'][lev]:
   if op['side']!=side:continue
   s,e=op['start_mm'],op['end_mm'];lo,hi=z+op['sill_mm'],z+op['head_mm']
   cuts.append([s,-1,lo,e,10001,hi] if side in ['south','north'] else [-1,s,lo,12001,e,hi])
  wall(f'{lev}-EXT-{side}',b,cuts)
 # Internal door schedule creates actual 900 mm apertures.
 doors=[('WEST-S',4900,2300,3200,'x'),('WEST-N',4900,7500,8400,'x')]
 if lev=='G0':doors += [('EAST-S',8300,2300,3200,'x'),('EAST-M',8300,5800,6700,'x'),('EAST-N',8300,7900,8800,'x'),('ENTRY-HALL',3500,7300,8200,'y')]
 else:doors += [('EAST-S',8300,2300,3200,'x'),('EAST-M',8300,4500,5400,'x'),('EAST-N',8300,7900,8800,'x'),('HALL-N',6500,7300,8200,'y')]
 for name,pos,s,e,axis in doors:
  op={'id':f'D-{lev}-{name}','type':'door','axis':axis,'position_mm':pos,'start_mm':s,'end_mm':e,'sill_mm':0,'head_mm':2100,'clear_width_mm':900,'operation':'sliding; collision disabled only when open'}
  M['openings'][lev].append(op)
 walls=[('WEST',[4840,200,z,4960,9800,z+2620]),('EAST',[8240,200,z,8360,9800,z+2620]),('WEST-CROSS',[200,4940,z,4840,5060,z+2620])]
 if lev=='G0':walls += [('ENTRY',[4960,3440,z,8240,3560,z+2620]),('EAST-CROSS',[8360,4940,z,11800,5060,z+2620]),('EAST-NORTH',[8360,7040,z,11800,7160,z+2620])]
 else:walls += [('HALL-N',[4960,6440,z,8240,6560,z+2620]),('EAST-SOUTH',[8360,3440,z,11800,3560,z+2620]),('EAST-NORTH',[8360,7040,z,11800,7160,z+2620])]
 for name,b in walls:
  cuts=[]
  for dn,pos,s,e,axis in doors:
   cuts.append([pos-61,s,z,pos+61,e,z+2100] if axis=='x' else [s,pos-61,z,e,pos+61,z+2100])
  wall(f'{lev}-INT-{name}',b,cuts)
 # Basement slab has no hole. Upper floors share the stair opening.
 slab=[0,0,z-180,12000,10000,z]
 pieces=[slab] if lev=='B1' else split_rect(slab,[5100,3700,z-181,7100,6350,z+1])
 for i,p in enumerate(pieces):box(f'{lev}-SLAB-{i}',p,'slab')
# Nominal game foundation perimeter, below basement slab. No structural load claim.
for side,b in [('S',[-100,-100,-3280,12100,300,-2980]),('N',[-100,9700,-3280,12100,10100,-2980]),('W',[-100,300,-3280,300,9700,-2980]),('E',[11700,300,-3280,12100,9700,-2980])]:box('FOUNDATION-'+side,b,'slab')
# Solid roof deck is retained as ceiling, not a duplicate visual flat roof.
box('ROOF-DECK',[0,0,5420,12000,10000,5600],'slab')
for lev,z in [('B1',-2800),('G0',0)]:
 for i in range(7):
  box(f'ST-{lev}-A-{i+1:02}',[5100,3700+i*250,z+i*175,6000,3950+i*250,z+(i+1)*175],'stair')
 box(f'ST-{lev}-MID',[5100,5450,z+1300,7100,6350,z+1400],'stair')
 for i in range(7):
  y=5200-i*250
  box(f'ST-{lev}-B-{i+1:02}',[6200,y,z+1400+i*175,7100,y+250,z+1575+i*175],'stair')
 # Last riser is the upper floor edge; landing is floor outside the opening.
 for side,x in [('W',5090),('E',7110)]:
  for i in range(8):
   y=3700+i*250; h=z+(i+1)*175 if side=='W' else z+2800-i*175
   box(f'GUARD-{lev}-{side}-{i}',[x-15,y,h,x+15,y+30,h+1100],'guard')
 for i in range(11):box(f'GUARD-{lev}-MID-{i}',[5100+i*190,6330,z+1400,5125+i*190,6350,z+2500],'guard')
# Hipped tile roof closed volume, four surfaces, two hip ends, no overlay.
v=[[-400,-400,5800],[12400,-400,5800],[12400,10400,5800],[-400,10400,5800],[5000,5000,8000],[7000,5000,8000],[-400,-400,5680],[12400,-400,5680],[12400,10400,5680],[-400,10400,5680]]
f=[[0,1,5],[0,5,4],[1,2,5],[2,3,4],[2,4,5],[3,0,4],[6,8,7],[6,9,8],[0,6,7],[0,7,1],[1,7,8],[1,8,2],[2,8,9],[2,9,3],[3,9,6],[3,6,0]]
M['roof']['vertices_mm']=v;M['roof']['triangles']=f
# Basement sunken court, external stair and daylight well. Site surface excludes the court.
box('COURT-FLOOR',[8600,-1300,-2980,10000,0,-2800],'site')
for i in range(15):
 y=-1550-i*250
 box(f'EXT-STAIR-{i+1:02}',[8800,y,-2800+i*175,9800,y+250,-2800+(i+1)*175],'stair')
box('EXT-STAIR-TOP',[8600,-6250,-180,10000,-5050,0],'site')
for side,x in [('W',8550),('E',10050)]:box('COURT-RETAIN-'+side,[x-50,-5050,-3000,x+50,0,0],'site')
box('LIGHTWELL-BASE',[-1200,5800,-1950,0,7000,-1800],'site')
box('LIGHTWELL-S',[-1200,5700,-2000,0,5800,0],'site');box('LIGHTWELL-N',[-1200,7000,-2000,0,7100,0],'site');box('LIGHTWELL-W',[-1300,5700,-2000,-1200,7100,0],'site')
box('TERRACE',[7400,10000,-180,12000,12000,0],'site')
M['site']={'assumed_plot_mm':[-6000,-7000,18000,16000],'surveyed':False,'external_stair':{'risers':16,'riser_mm':175,'tread_mm':250,'clear_width_mm':1000,'bottom_landing_mm':[8600,-1300,10000,0],'top_landing_mm':[8600,-6250,10000,-5050],'guards':'1100 mm parapets represented by retaining walls plus guard extension'},'basement':'court drains to separate storm sump; overflow alarms disable basement entry on flood event','lightwell':'west window W-B1 served by drained open lightwell; window is daylight only','waterproofing':'game construction layers: 200 mm RC wall, external membrane, protection board and perimeter drain; dimensions nominal'}
for side,x in [('W',8550),('E',10050)]:box('EXT-GUARD-'+side,[x-40,-5050,0,x+40,0,1100],'guard')
# Upper stair-opening guards; leave the south arrival/entry edge open.
for lev,z in [('G0',0),('L1',2800)]:
 for i,y in enumerate(range(3700,6351,200)):
  for x in [5080,7120]:box(f'OPENING-GUARD-{lev}-{x}-{i}',[x-20,y,z,x+20,y+30,z+1100],'guard')
 for i,x in enumerate(range(5100,7101,200)):box(f'OPENING-GUARD-{lev}-N-{i}',[x,6340,z,x+30,6380,z+1100],'guard')
for side,b in [('W',[-1340,5700,0,-1260,7100,1100]),('S',[-1300,5660,0,0,5740,1100]),('N',[-1300,7060,0,0,7140,1100])]:box('LIGHTWELL-GUARD-'+side,b,'guard')
# Assumed grade is a yard surface, with actual voids around house, stairs and lightwell.
yard=[[-6000,-7000,-100,18000,16000,0]]
for cut in [[0,0,-101,12000,10000,1],[8500,-6300,-101,10100,0,1],[-1340,5660,-101,0,7140,1],[7400,10000,-101,12000,12000,1]]:yard=[q for p in yard for q in split_rect(p,cut)]
for i,b in enumerate(yard):box('YARD-'+str(i),b,'site')
# Game supply assumptions, deliberately not electrical installation specifications.
M['electrical_design']={'supply':'simulation only: single phase three wire 100/200 V, 60 Hz','main_budget_W':12000,'voltage_drop_limit_pct':3,'breaker_model':'instant trip on load above branch game budget; leakage trip event; no real cable/breaker sizing implied','earthing':'protective-earth continuity as a simulation state; no local earthing classification asserted','phase_balance':'assign 100 V circuits to L1/L2; 200 V loads across both','repair_gate':['isolate upstream','verify simulated dead state','repair','reset after fault cleared'],'main_diversity':0.6}
# Named spatial nodes replace schematic XY coordinates. All original functional IDs are retained.
E={'POLE':[-2500,-4000,5000],'METER':[12150,1000,1400],'MAIN':[8100,1000,1400],'G0_DB':[8100,1500,1400],'L1_DB':[8100,1500,4200],'B1_DB':[8100,1500,-1400],'LIGHT_G':[2500,2500,2350],'SOCKET_G':[2500,1200,350],'SEWING':[10200,2500,350],'LIGHT_L':[2500,2500,5150],'AC_L':[11300,4200,5150],'WORKSHOP':[3000,1800,-2450],'SAUNA':[10300,4500,-2000],'PUMP':[11100,1500,-2100],'LIGHT_B':[2500,7500,-450],'AC_G':[11300,4200,2350],'VENT':[10000,8000,-500],'HEATER_E':[10800,2200,-1800],'STORM_PUMP':[10250,-800,-2400]}
loads={'LIGHT_G':(180,100,'L1'),'SOCKET_G':(1500,100,'L2'),'SEWING':(300,100,'L1'),'LIGHT_L':(180,100,'L2'),'AC_L':(900,200,'both'),'WORKSHOP':(1500,100,'L1'),'SAUNA':(4500,200,'both'),'PUMP':(400,100,'L2'),'LIGHT_B':(180,100,'L2'),'AC_G':(900,200,'both'),'VENT':(180,100,'L1'),'HEATER_E':(250,100,'L2'),'STORM_PUMP':(350,100,'L1')}
edges=copy.deepcopy(OLD['systems']['electrical']['edges']);edges[0][2]='game supply: 100/200 V single phase three wire, 60 Hz'
for src,dst,c in [('B1_DB','LIGHT_B','C-B04'),('G0_DB','AC_G','C-G04'),('B1_DB','VENT','C-B05'),('B1_DB','HEATER_E','C-B06'),('B1_DB','STORM_PUMP','C-B07')]:edges.append([src,dst,c])
M['systems']['electrical']={'nodes_mm':E,'edges':edges,'loads':{k:{'rated_W':p,'V':u,'leg':leg,'game_trip_W':p*1.25,'current_A':round(p/u,3)} for k,(p,u,leg) in loads.items()}}
W={'ISLAND_WATER':[-3000,-6000,-800],'METER':[10900,-1000,-800],'SHUTOFF':[10900,800,-1800],'COLD_MANIFOLD':[10900,1500,-1800],'HEATER':[11100,2200,-1800],'KITCHEN':[4000,8000,800],'G0_WC':[10800,6000,600],'L1_BATH':[10800,2500,3400],'LAUNDRY':[10200,6000,600],'SAUNA_SHOWER':[10800,6000,-2000]}
M['systems']['water']={'nodes_mm':W,'edges':copy.deepcopy(OLD['systems']['water']['edges']),'supply_kPa':300,'available_flow_L_s':1.0,'design_simultaneous_flow_L_s':0.6,'heater':'fuel-fired sealed appliance; electric controls; 180 L simulation tank; relief and backflow state','temperature_C':{'cold':22,'storage':60,'mixed':40},'fixture_flow_L_s':{'KITCHEN':0.12,'G0_WC':0.10,'L1_BATH':0.20,'LAUNDRY':0.15,'SAUNA_SHOWER':0.15}}
D={'KITCHEN':[4000,8000,-250],'G0_WC':[10800,6000,-250],'L1_BATH':[10800,2500,2550],'LAUNDRY':[10200,6000,-250],'B1_SHOWER':[10800,6000,-2850],'B1_PUMP':[11300,6000,-3000],'SOIL_STACK':[11400,6000,-900],'INSPECTION':[14000,6000,-960],'SEWER_MAIN':[17500,6000,-1040],'RAINWATER':[12200,10200,5800],'STORM_DRAIN':[17000,11500,-950],'STORM_SUMP':[9700,-800,-3500],'COURT_DRAIN':[9700,-800,-2790],'LIGHTWELL_DRAIN':[-600,6400,-1790],'STORM_OUT':[17000,-2000,-600],'VENT_TOP':[11400,6000,8800]}
de=copy.deepcopy(OLD['systems']['drainage']['edges'])+[['LAUNDRY','SOIL_STACK','waste'],['STORM_SUMP','STORM_OUT','pumped storm; independent outfall'],['COURT_DRAIN','STORM_SUMP','gravity storm'],['LIGHTWELL_DRAIN','STORM_SUMP','gravity storm']]
M['systems']['drainage']={'nodes_mm':D,'edges':de,'sewer_assumed_invert_mm':-1040,'gravity_min_fall':0.02,'pump_design':{'B1_PUMP':{'flow_L_s':1.0,'head_m':4.0,'requires':'PUMP','check_valve':True},'STORM_SUMP':{'flow_L_s':5,'head_m':5,'requires':'STORM_PUMP','check_valve':True}},'storm_design':{'rain_mm_h':100,'roof_plan_m2':138.24,'runoff':1,'roof_flow_L_s':round(138.24*100/3600,3),'downpipes':2,'downpipe_game_capacity_L_s_each':3}}
H={'OUTDOOR_AIR':[12400,1500,1500],'B1_FRESH':[11000,1500,-450],'B1_EXHAUST':[11000,8000,-650],'SAUNA_EXHAUST':[11000,6000,-450],'SMOKING_EXHAUST':[2500,8000,-450],'G0_AC':[11500,4200,2350],'L1_AC':[11500,4200,5150],'OUTDOOR_UNITS':[13000,4200,1000],'B1_OUT':[12800,8000,1500],'SAUNA_OUT':[13000,6000,1500],'SMOKE_OUT':[-2200,8000,1500],'COND_G':[12900,4200,2100],'COND_L':[13100,4200,4900],'COND_OUT':[14500,4200,-500],'FLUE_TOP':[11100,2200,8500]}
he=[['OUTDOOR_AIR','B1_FRESH','filtered fresh air'],['B1_EXHAUST','B1_OUT','general extract'],['SAUNA_EXHAUST','SAUNA_OUT','independent wet extract'],['SMOKING_EXHAUST','SMOKE_OUT','independent smoke extract'],['G0_AC','OUTDOOR_UNITS','refrigerant'],['L1_AC','OUTDOOR_UNITS','refrigerant']]
M['systems']['hvac']={'nodes_mm':H,'edges':he,'fans_m3_h':{'B1_FRESH':400,'B1_EXHAUST':180,'SAUNA_EXHAUST':100,'SMOKING_EXHAUST':120},'cooling':{'G0_AC':{'capacity_kW':4,'design_zone_m2':50,'assumed_W_m2':80},'L1_AC':{'capacity_kW':4,'design_zone_m2':50,'assumed_W_m2':80}},'heat_balance':'game demand model only; local fans and operable windows serve other zones','smoking':'extract does not connect to general or sauna extract; door pressure state negative when fan enabled','condensate':'separate gravity routes to storm receptor with air-gap state','service_clearance_mm':600}
# Routes use explicit sizes for game visuals and reservation envelopes, not installation sizes.
def route(id,system,src,dst,points,diam=30,flow='supply',extra=None):
 r={'id':id,'system':system,'from':src,'to':dst,'points_mm':copy.deepcopy(points),'visual_diameter_mm':diam,'reservation_mm':diam+20,'flow':flow,'sizing_basis':'game reference envelope','length_mm':round(sum(math.dist(a,b) for a,b in zip(points,points[1:])),3)}
 if extra:r.update(extra)
 M['routes'].append(r)
def simple_route(system,nodes,a,b,diam,zlane,id=None,flow='supply'):
 p=nodes[a];q=nodes[b]
 # Star routing above room ceilings with differing service lanes. No path across stair opening.
 pts=[p,[p[0],p[1],zlane],[p[0],q[1],zlane],[q[0],q[1],zlane],q]
 pts=[x for i,x in enumerate(pts) if i==0 or x!=pts[i-1]]
 route(id or system.upper()+'-'+a+'-'+b,system,a,b,pts,diam,flow)
# One controlled luminaire in every named room; dry-room socket points by circuit group.
M['electrical_fixtures']=[]
E['SOCKET_L']=[3000,1200,3150];loads['SOCKET_L']=(1000,100,'L2');edges.append(['L1_DB','SOCKET_L','C-L03'])
M['systems']['electrical']['loads']['SOCKET_L']={'rated_W':1000,'V':100,'leg':'L2','game_trip_W':1250,'current_A':10}
for lev,rooms in M['rooms'].items():
 z=M['levels_mm'][lev]
 for room in rooms:
  bb=room['zones_mm'][0];x=(bb[0]+bb[2])/2;y=(bb[1]+bb[3])/2
  if room['name']=='Stair hall':x=7650;y=3000 if lev!='G0' else 9000
  node=room['id']+'-LIGHT';E[node]=[x,y,z+2350];group={'B1':'LIGHT_B','G0':'LIGHT_G','L1':'LIGHT_L'}[lev];edges.append([group,node,'room luminaire'])
  M['electrical_fixtures'].append({'id':node,'type':'ceiling luminaire','room_id':room['id'],'point_mm':E[node],'circuit':group,'allocated_W':round(180/len(rooms),2),'controls':'switch at room door; local toggle persists by fixture ID'})
  if room['name'] not in ['Stair hall','Boiler and pumps','Bathroom','Sauna and shower','WC and utility','Covered terrace access']:
   node=room['id']+'-SOCKET';E[node]=[bb[0]+350,bb[1]+700,z+350];group={'B1':'WORKSHOP','G0':'SOCKET_G','L1':'SOCKET_L'}[lev];edges.append([group,node,'dry-room receptacle'])
   M['electrical_fixtures'].append({'id':node,'type':'dry-room receptacle','room_id':room['id'],'point_mm':E[node],'circuit':group,'load_budget':'included in circuit group; not additive'})
for a,b,c in edges:
 if b.endswith(('-LIGHT','-SOCKET')):
  z=math.floor(E[b][2]/2800)*2800+2500;simple_route('electrical',E,a,b,20,z);continue
 if a=='POLE': pts=[E[a],[12150,-4000,5000],[12150,1000,5000],E[b]];route('ELECTRICAL-'+a+'-'+b,'electrical',a,b,pts,25)
 elif b=='STORM_PUMP':
  p=E[a];q=E[b];route('ELECTRICAL-'+a+'-'+b,'electrical',a,b,[p,[p[0],-200,-450],[q[0],-200,-450],[q[0],q[1],-450],q],25)
 elif b=='PUMP':
  p=E[a];q=E[b];route('ELECTRICAL-'+a+'-'+b,'electrical',a,b,[p,[p[0],500,-700],[q[0],500,-700],[q[0],q[1],-700],q],25)
 else:
  z=math.floor(E[b][2]/2800)*2800+2350 if b in loads else max(E[a][2],E[b][2])+950
  simple_route('electrical',E,a,b,25,z)
for a,b,c in M['systems']['water']['edges']:
 sys='potable_hot' if c=='hot' else 'potable_cold';diam=20 if b in W and b in M['systems']['water']['fixture_flow_L_s'] else 32
 if b=='METER':
  route('WATER-'+a+'-'+b+'-COLD',sys,a,b,[W[a],[10900,-6000,-800],W[b]],diam);continue
 if b=='SHUTOFF':z=-800
 elif b in ['COLD_MANIFOLD','HEATER']:z=-650 if sys=='potable_cold' else -750
 else:z=math.floor(W[b][2]/2800)*2800+(2200 if sys=='potable_cold' else 2100)
 simple_route(sys,W,a,b,diam,z,id='WATER-'+a+'-'+b+'-'+('HOT' if sys=='potable_hot' else 'COLD'))
# Sanitary gravity runs above the ceiling below each fixture; positive falls at every horizontal segment.
for a in ['KITCHEN','G0_WC','L1_BATH','LAUNDRY']:
 p=D[a];x,y,z=p;end=[11400,6000,z-abs(11400-x)*.02-abs(6000-y)*.02]
 pts=[p,[11400,y,z-abs(11400-x)*.02],end,[11400,6000,-900]]
 pts=[p for i,p in enumerate(pts) if i==0 or p!=pts[i-1]]
 route('DRAINAGE-'+a+'-SOIL_STACK','sanitary',a,'SOIL_STACK',pts,100 if a in ['G0_WC','L1_BATH'] else 50,'gravity')
route('DRAINAGE-B1_SHOWER-B1_PUMP','sanitary','B1_SHOWER','B1_PUMP',[D['B1_SHOWER'],[11300,6000,-2860],D['B1_PUMP']],50,'gravity')
route('DRAINAGE-B1_PUMP-SOIL_STACK','sanitary','B1_PUMP','SOIL_STACK',[D['B1_PUMP'],[11300,6000,-800],[11400,6000,-800],D['SOIL_STACK']],40,'pumped',{'requires':'PUMP','check_valve':True})
for a,b in [('SOIL_STACK','INSPECTION'),('INSPECTION','SEWER_MAIN')]:route('DRAINAGE-'+a+'-'+b,'sanitary',a,b,[D[a],D[b]],100,'gravity')
route('SANITARY-VENT','vent','SOIL_STACK','VENT_TOP',[D['SOIL_STACK'],D['VENT_TOP']],100,'vent')
for i,x in enumerate([-200,12200]):
 pts=[[x,10200,5800],[x,10200,-600],[x,11500,-626],[17000,11500,-950]]
 route('STORM-ROOF-'+str(i+1),'storm','RAINWATER','STORM_DRAIN',pts,100,'gravity',{'connected_gutter':'roof-north','endpoint_alias':i==0})
route('STORM-COURT-DRAIN','storm','COURT_DRAIN','STORM_SUMP',[D['COURT_DRAIN'],D['STORM_SUMP']],65,'gravity')
route('STORM-LIGHTWELL-DRAIN','storm','LIGHTWELL_DRAIN','STORM_SUMP',[D['LIGHTWELL_DRAIN'],[-1500,6400,-2100],[-1500,-6500,-2400],[9700,-6500,-2800],[9700,-800,-3100],D['STORM_SUMP']],65,'gravity')
route('DRAINAGE-STORM_SUMP-STORM_OUT','storm','STORM_SUMP','STORM_OUT',[D['STORM_SUMP'],[9700,-800,-300],[9700,-2000,-300],D['STORM_OUT']],65,'pumped',{'requires':'STORM_PUMP','check_valve':True})
for a,b,c in he:
 if c=='refrigerant':simple_route('refrigerant',H,a,b,40,H[a][2]+50,id='HVAC-'+a+'-'+b)
 else:
  p=H[a];q=H[b];pts=[p,[q[0],p[1],p[2]],[q[0],q[1],p[2]],q]
  if a=='SAUNA_EXHAUST':pts=[p,[p[0],5500,p[2]],[q[0],5500,p[2]],[q[0],q[1],p[2]],q];pts=[x for i,x in enumerate(pts) if i==0 or x!=pts[i-1]]
  route('HVAC-'+a+'-'+b,'hvac',a,b,pts,160,'air')
for a in ['G0_AC','L1_AC']:
 p=H[a].copy();p[1]+=200;z=p[2]-100
 pts=[p,[p[0],p[1],z],[14500,4200,z-60],H['COND_OUT']]
 route('CONDENSATE-'+a,'condensate',a,'COND_OUT',pts,25,'gravity')
route('HEATER-FLUE','flue','HEATER','FLUE_TOP',[W['HEATER'],H['FLUE_TOP']],100,'flue')
# Physical equipment ports separate distinct services sharing a logical fixture centre.
for r in M['routes']:
 if r['system']=='potable_hot':
  x=r['points_mm'][0][0]
  for p in r['points_mm']:
   if p[0]==x:p[0]+=150
  qx=W[r['to']][0]
  for p in r['points_mm']:
   if p[0]==qx:p[0]+=60
 elif r['system']=='potable_cold' and r['to']=='HEATER':
  for p in r['points_mm']:
   if p[0]==11100:p[0]-=150
 r['source_port_mm']=r['points_mm'][0]
 r['destination_port_mm']=r['points_mm'][-1]

# Deduplicate coincident polyline points; all remaining segments have length.
for r in M['routes']:
 r['points_mm']=[p for i,p in enumerate(r['points_mm']) if i==0 or p!=r['points_mm'][i-1]]
 r['length_mm']=round(sum(math.dist(a,b) for a,b in zip(r['points_mm'],r['points_mm'][1:])),3)
# Route reservations subtract holes from walls and slabs only, never stairs or guards.
# Each reservation is explicit and traceable; service geometry is still reviewed for route/route clashes.
original=list(G);new=[]
for el in original:
 if el['kind'] not in ['wall','slab'] and not el['id'].startswith(('COURT-','LIGHTWELL-','YARD-')):new.append(el);continue
 pieces=[el['bounds_mm']]
 for r in M['routes']:
  rad=r['reservation_mm']/2
  for i,(a,b) in enumerate(zip(r['points_mm'],r['points_mm'][1:])):
   lo=np.minimum(a,b)-rad;hi=np.maximum(a,b)+rad
   # Only reserve intersections that actually cut this solid.
   eb=el['bounds_mm'];c=np.maximum(lo,eb[:3]);d=np.minimum(hi,eb[3:])
   if np.all(d-c>0):
    pid=f'PEN-{len(M["penetrations"])+1:04}'
    M['penetrations'].append({'id':pid,'route_id':r['id'],'segment':i,'host_id':el['id'],'bounds_mm':list(lo)+list(hi),'purpose':'sealed sleeve or reserved shaft; game geometry only','seal':'wet service watertight / air and cable sealed','structural_review':'outside construction scope'})
    pieces=[q for p in pieces for q in split_rect(p,list(lo)+list(hi))]
 for i,p in enumerate(pieces):
  e=copy.deepcopy(el);e['id']=el['id']+(f'-P{i:03}' if len(pieces)>1 else '');e['bounds_mm']=p;new.append(e)
M['geometry']=G=new
# Equipment envelopes and accessible interaction positions, clear of stair.
for sys,nodes,names in [('electrical',E,['MAIN','G0_DB','L1_DB','B1_DB']),('water',W,['HEATER','COLD_MANIFOLD']),('drainage',D,['B1_PUMP','STORM_SUMP']),('hvac',H,['OUTDOOR_UNITS'])]:
 for n in names:
  x,y,z=nodes[n];size=150 if sys=='electrical' else 250
  b=[x-size,y-size,z-size,x+size,y+size,z+size]
  eq={'id':sys.upper()+'-EQ-'+n,'node':n,'system':sys,'bounds_mm':b,'interaction_mm':[x-800,y,z],'service_clearance_mm':600,'collision':False,'visual_only':'maintenance icon/envelope; appliance detail excluded from collision'}
  M['equipment'].append(eq);box(eq['id'],b,'equipment',collide=False)
M['navigation']={'coordinate_system':'CAD mm Z up','door_connections':[],'vertical_links':[],'capsule_radius_mm':250}
for lev,ops in M['openings'].items():
 z=M['levels_mm'][lev]
 for o in ops:
  if o['type']!='door':continue
  s=(o['start_mm']+o['end_mm'])/2
  if o.get('side') in ['south','north']:p=[s,100 if o['side']=='south' else 9900,z]
  elif o.get('side') in ['west','east']:p=[100 if o['side']=='west' else 11900,s,z]
  elif o['axis']=='x':p=[o['position_mm'],s,z]
  else:p=[s,o['position_mm'],z]
  M['navigation']['door_connections'].append({'id':o['id'],'point_mm':p,'clear_width_mm':o.get('clear_width_mm',o['end_mm']-o['start_mm']),'enabled_when':'door open and floor not flooded','level':lev})
for lev,z in [('B1',-2800),('G0',0)]:M['navigation']['vertical_links'].append({'id':'STAIR-'+lev,'path_mm':[[5550,3200,z],[5550,3700,z+175],[5550,5450,z+1400],[5550,5900,z+1400],[6650,5900,z+1400],[6650,5450,z+1575],[6650,3700,z+2800],[6650,3200,z+2800]],'bidirectional':True,'controller':'ramp proxies with step at ends'})
# Every inherited asset is mapped; obsolete HVAC dependencies are explicitly retired.
ids={r['id'] for rs in M['rooms'].values() for r in rs}|{r['id'] for r in M['routes']}
migration={}
for a in OLD['game_assets']:
 id=a['id']
 if id in ids:migration[id]={'action':'preserve','target':id}
 elif id.startswith('WATER-'):
  target=[r['id'] for r in M['routes'] if r['id'].startswith(id+'-')];migration[id]={'action':'alias','target':target[0] if target else None}
 elif id=='DRAINAGE-RAINWATER-STORM_DRAIN':migration[id]={'action':'alias','target':'STORM-ROOF-2'}
 elif id.startswith('HVAC-'):
  migration[id]={'action':'retire','target':None,'reason':'old shared extract topology replaced by independent extract circuits'}
 else:migration[id]={'action':'retire','target':None,'reason':'superseded conceptual edge'}
M['migration_from_E']=migration
M['integration']={'schema':2,'asset_prefix':'JH-','save_namespace':'johansson.house.v2','default_state':'all breakers and valves closed; no faults; fans off; doors closed','player_capsule':{'radius_mm':250,'standing_height_mm':1800,'max_step_mm':200,'slope_deg':40},'static_collision':'architecture boxes plus stair ramp proxies; exclude equipment envelopes, service lines, glass and door aperture cutters','doors':'separate dynamic collider, 900/1000 mm openings; restore door state by opening ID','streaming':'group B1/G0/L1/roof/site/services; room occlusion, exterior roof hide on indoor camera','performance':'budgets for reference asset: <=2000 nodes, <=50000 triangles; runtime FPS requires host testing','dependencies':{'pump':'PUMP circuit + check valve + clear discharge','storm_pump':'STORM_PUMP circuit + clear storm outfall','hot_water':'SHUTOFF + COLD_MANIFOLD + HEATER_E + fuel + heater healthy','cooling':'AC_G/AC_L circuits + unit healthy','ventilation':'VENT circuit + independent fan state'},'faults':['branch_trip','power_failure','open_conductor','leakage','water_shutoff','drain_blockage','pump_failure','fan_failure','condensate_blockage','flood'],'repair':'isolation verification precedes repair; restored power alone does not clear fault','time_step':'1 simulated second; limit dt to 60 s; tank and pump capacities bound accumulation','live_engine_status':'reference tests only; integrate according to source/reference_sim.py and Game_Integration.md'}
# Fixtures are independent pickable game objects; load budgets belong to circuit groups.
for fi in M['electrical_fixtures']:
 x,y,z=fi['point_mm'];w=120 if fi['type']=='ceiling luminaire' else 35
 box(fi['id'],[x-w,y-w,z-20,x+w,y+w,z+20],'fixture',[246,231,181,255] if fi['type']=='ceiling luminaire' else [228,224,210,255],False)
# Glass and door objects, separated from static architecture.
for lev,ops in M['openings'].items():
 z=M['levels_mm'][lev]
 for op in ops:
  s,e=op['start_mm'],op['end_mm'];lo=z+op['sill_mm'];hi=z+op['head_mm'];side=op.get('side')
  if side in ['south','north']: y=100 if side=='south' else 9900;b=[s,y-10,lo,e,y+10,hi]
  elif side in ['west','east']:x=100 if side=='west' else 11900;b=[x-10,s,lo,x+10,e,hi]
  elif op['axis']=='x':x=op['position_mm'];b=[x-10,s,lo,x+10,e,hi]
  else:y=op['position_mm'];b=[s,y-10,lo,e,y+10,hi]
  box(op['id'],b,'door' if op['type']=='door' else 'glass',[119,90,60,255] if op['type']=='door' else [135,186,207,90],False)
# Roof sleeve apertures: clip every roof triangle to a common XY grid, remove port cells,
# mirror the surface at the underside and close every external and sleeve boundary.
roofholes=[[11330,5930,11470,6070],[11030,2130,11170,2270]]
xs=sorted(set([-400,12400,5000,7000]+[q[k] for q in roofholes for k in [0,2]]))
ys=sorted(set([-400,10400,5000]+[q[k] for q in roofholes for k in [1,3]]))
def clip(poly,axis,edge,greater):
 out=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  aa=(a[axis]>=edge-1e-8) if greater else (a[axis]<=edge+1e-8)
  bb=(b[axis]>=edge-1e-8) if greater else (b[axis]<=edge+1e-8)
  if aa:out.append(a)
  if aa!=bb:
   t=(edge-a[axis])/(b[axis]-a[axis]);out.append([a[k]+t*(b[k]-a[k]) for k in range(3)])
 return out
rv=[];rf=[];rindex={}
def rid(p):
 key=tuple(round(q,6) for q in p)
 if key not in rindex:rindex[key]=len(rv);rv.append(list(key))
 return rindex[key]
for tri in f[:6]:
 for xa,xb in zip(xs,xs[1:]):
  for ya,yb in zip(ys,ys[1:]):
   if any(q[0]<(xa+xb)/2<q[2] and q[1]<(ya+yb)/2<q[3] for q in roofholes):continue
   poly=[v[k] for k in tri]
   for axis,e,gr in [(0,xa,True),(0,xb,False),(1,ya,True),(1,yb,False)]:
    if poly:poly=clip(poly,axis,e,gr)
   # Eliminate duplicate vertices after boundary clipping.
   pp=[]
   for p in poly:
    if not pp or math.dist(p,pp[-1])>1e-5:pp.append(p)
   if len(pp)>1 and math.dist(pp[0],pp[-1])<1e-5:pp.pop()
   if len(pp)<3:continue
   for k in range(1,len(pp)-1):
    vv=np.array([pp[0],pp[k],pp[k+1]])
    if np.linalg.norm(np.cross(vv[1]-vv[0],vv[2]-vv[0]))>1e-4:rf.append([rid(pp[0]),rid(pp[k]),rid(pp[k+1])])
topfaces=rf.copy();from collections import Counter
edgecount=Counter(tuple(sorted((a,b))) for tri in topfaces for a,b in zip(tri,tri[1:]+tri[:1]))
for tri in topfaces:rf.append([rid([rv[j][0],rv[j][1],5680]) for j in reversed(tri)])
for tri in topfaces:
 for a,b in zip(tri,tri[1:]+tri[:1]):
  if edgecount[tuple(sorted((a,b)))]==1:
   A=rid([rv[a][0],rv[a][1],5680]);B=rid([rv[b][0],rv[b][1],5680]);rf.extend([[a,A,B],[a,B,b]])
M['roof']['mesh_vertices_mm']=rv;M['roof']['mesh_triangles']=rf;M['roof']['sleeve_apertures_mm']=roofholes

M['handrails']=[]
for lev,z in [('B1',-2800),('G0',0)]:
 for x,za,zb in [(5090,z+1275,z+2500),(7110,z+3900,z+2675),(6100,z+1275,z+2500)]:
  M['handrails'].append({'id':f'RAIL-{lev}-{x}','a_mm':[x,3700,za],'b_mm':[x,5450,zb],'diameter_mm':40})
 M['handrails'].append({'id':'RAIL-'+lev+'-MID','a_mm':[5100,6340,z+2500],'b_mm':[7100,6340,z+2500],'diameter_mm':40})

for lev,z in [('G0',0),('L1',2800)]:
 for x in [5080,7120]:M['handrails'].append({'id':f'OPENING-RAIL-{lev}-{x}','a_mm':[x,3700,z+1100],'b_mm':[x,6350,z+1100],'diameter_mm':40})
 M['handrails'].append({'id':'OPENING-RAIL-'+lev+'-N','a_mm':[5100,6360,z+1100],'b_mm':[7100,6360,z+1100],'diameter_mm':40})
# Weather collars complete the two roof penetrations as separate cosmetic solids.
for k,(x,y) in enumerate([(11400,6000),(11100,2200)]):
 z=5800+2200*min((x+400)/5400,(12400-x)/5400,(y+400)/5400,(10400-y)/5400,1)
 for side,b in [('W',[x-100,y-100,z-80,x-70,y+100,z+100]),('E',[x+70,y-100,z-80,x+100,y+100,z+100]),('S',[x-70,y-100,z-80,x+70,y-70,z+100]),('N',[x-70,y+70,z-80,x+70,y+100,z+100])]:box(f'ROOF-BOOT-{k+1}-{side}',b,'roof_boot',[89,91,87,255],False)

# GLB writer with named nodes, native Y up and explicit materials. Closed box solids.
BOXF=np.array([[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]],dtype=np.uint32)
def vertices(b):
 x,y,z,X,Y,Z=b;return np.array([[x,y,z],[X,y,z],[X,Y,z],[x,Y,z],[x,y,Z],[X,y,Z],[X,Y,Z],[x,Y,Z]],float)
def glb(path,els,roof=False,routes=False):
 data=bytearray();views=[];acc=[];meshes=[];nodes=[];materials=[];colors={}
 def accessor(ar,typ):
  nonlocal data
  ar=np.ascontiguousarray(ar);off=len(data);data.extend(ar.tobytes());data.extend(b'\0'*((-len(data))%4));vi=len(views);views.append({'buffer':0,'byteOffset':off,'byteLength':ar.nbytes})
  ac={'bufferView':vi,'componentType':5126 if ar.dtype==np.float32 else 5125,'count':len(ar),'type':typ}
  if typ=='VEC3':ac.update(min=ar.min(axis=0).tolist(),max=ar.max(axis=0).tolist())
  acc.append(ac);return len(acc)-1
 def mesh(id,v,f,color,extras):
  v=np.array(v,float);v=np.stack([v[:,0],v[:,2],-v[:,1]],axis=1).astype(np.float32)/1000;f=np.asarray(f,np.uint32).reshape(-1)
  c=tuple(color)
  if c not in colors:
   colors[c]=len(materials);mat={'name':str(c),'pbrMetallicRoughness':{'baseColorFactor':[a/255 for a in c],'metallicFactor':0,'roughnessFactor':.85},'doubleSided':False}
   if c[3]<255:mat['alphaMode']='BLEND'
   materials.append(mat)
  mi=len(meshes);meshes.append({'name':id,'primitives':[{'attributes':{'POSITION':accessor(v,'VEC3')},'indices':accessor(f,'SCALAR'),'material':colors[c]}]});nodes.append({'name':id,'mesh':mi,'extras':extras})
 for e in els:mesh(e['id'],vertices(e['bounds_mm']),BOXF,e['color'],{'kind':e['kind'],'stable_id':e['id'],'collision':e['collision']})
 if roof:
  for rail in M['handrails']:
   a=np.array(rail['a_mm'],float);b=np.array(rail['b_mm'],float);d=b-a;d/=np.linalg.norm(d);n=np.cross(d,[0,0,1]);n/=np.linalg.norm(n);t=np.cross(d,n)
   ring=[20*(math.cos(k*math.pi/4)*n+math.sin(k*math.pi/4)*t) for k in range(8)];vs=[a+x for x in ring]+[b+x for x in ring]+[a,b];fs=[]
   for k in range(8):q=(k+1)%8;fs += [[k,q,k+8],[q,q+8,k+8],[16,q,k],[17,k+8,q+8]]
   mesh(rail['id'],vs,fs,[76,80,77,255],{'kind':'handrail','collision':False})
 if roof:mesh('ROOF-HIPPED',M['roof']['mesh_vertices_mm'],M['roof']['mesh_triangles'],[164,68,42,255],{'kind':'roof','collision':True,'stable_id':'ROOF-HIPPED'})
 if routes:
  palette={'electrical':[225,184,34,255],'potable_cold':[39,132,211,255],'potable_hot':[222,63,59,255],'sanitary':[115,86,57,255],'storm':[55,150,170,255],'hvac':[88,156,93,255]}
  for r in M['routes']:
   for i,(a,b) in enumerate(zip(r['points_mm'],r['points_mm'][1:])):
    # Oriented round tube with capped ends.
    a=np.array(a,float);b=np.array(b,float);d=b-a;d/=np.linalg.norm(d);n=np.cross(d,[0,0,1])
    if np.linalg.norm(n)<.1:n=np.cross(d,[0,1,0])
    n/=np.linalg.norm(n);t=np.cross(d,n);ring=[r['visual_diameter_mm']/2*(math.cos(k*math.pi/4)*n+math.sin(k*math.pi/4)*t) for k in range(8)]
    vs=[a+x for x in ring]+[b+x for x in ring]+[a,b];fs=[]
    for k in range(8):q=(k+1)%8;fs += [[k,q,k+8],[q,q+8,k+8],[16,q,k],[17,k+8,q+8]]
    mesh(r['id']+f'-SEG-{i:02}',vs,fs,palette.get(r['system'],[151,91,168,255]),{'kind':'service','route_id':r['id'],'collision':False})
 doc={'asset':{'version':'2.0','generator':'Johansson House coordinated exporter v2'},'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':meshes,'materials':materials,'buffers':[{'byteLength':len(data)}],'bufferViews':views,'accessors':acc,'extras':M['coordinates']}
 jb=json.dumps(doc,separators=(',',':')).encode();jb+=b' '*((-len(jb))%4)
 raw=struct.pack('<III',0x46546c67,2,12+8+len(jb)+8+len(data))+struct.pack('<II',len(jb),0x4e4f534a)+jb+struct.pack('<II',len(data),0x004e4942)+data;path.write_bytes(raw)
 return {'nodes':len(nodes),'triangles':sum(acc[m['primitives'][0]['indices']]['count']//3 for m in meshes),'bytes':len(raw)}
M['mesh_stats']={}
M['mesh_stats']['architecture']=glb(OUT/'Johansson_House_Architecture.glb',G,True)
M['mesh_stats']['services']=glb(OUT/'Johansson_House_Services.glb',[],False,True)
# Collision source boxes are exact architecture; stair proxies have separate polygon contract.
collision={'coordinate_system':'CAD millimetres Z up','solids':[{'id':e['id'],'bounds_mm':e['bounds_mm']} for e in G if e['collision'] and e['kind'] not in ['stair','guard']],'guards':[{'id':e['id'],'bounds_mm':e['bounds_mm']} for e in G if e['kind']=='guard'],'stair_proxies':[]}
for lev,z in [('B1',-2800),('G0',0)]:
 collision['stair_proxies'] += [{'id':'RAMP-'+lev+'-A','corners_mm':[[5100,3700,z+175],[6000,3700,z+175],[6000,5450,z+1400],[5100,5450,z+1400]]},{'id':'RAMP-'+lev+'-B','corners_mm':[[6200,3700,z+2800],[7100,3700,z+2800],[7100,5450,z+1575],[6200,5450,z+1575]]},{'id':'LANDING-'+lev,'bounds_mm':[5100,5450,z+1300,7100,6350,z+1400]}]
collision['external_stair_proxy']={'corners_mm':[[8800,-5050,0],[9800,-5050,0],[9800,-1300,-2625],[8800,-1300,-2625]],'bottom_landing_mm':[8600,-1300,-2800,10000,0,-2800]}
(OUT/'collision.json').write_text(json.dumps(collision,indent=2))
# Editable drawings derived directly from model. Plan units mm; no arbitrary schematic XY reused.
drawings=[]
def doc(name,title):
 d=ezdxf.new('R2010');d.units=4;m=d.modelspace();m.add_text('JOHANSSON HOUSE | REV F | '+title,dxfattribs={'height':180,'insert':(-1000,12500),'layer':'TITLE'});m.add_text('GAME PRODUCTION REFERENCE | millimetres | Z-up CAD | 13 Oct 2026',dxfattribs={'height':100,'insert':(-1000,12200),'layer':'TITLE'});drawings.append((name,d));return d,m
def rect(m,b,layer):m.add_lwpolyline([(b[0],b[1]),(b[2],b[1]),(b[2],b[3]),(b[0],b[3])],close=True,dxfattribs={'layer':layer})
for lev,z in M['levels_mm'].items():
 d,m=doc(f'A_{lev}_Coordinated.dxf',lev+' FLOOR PLAN')
 for e in G:
  b=e['bounds_mm']
  if e['kind']=='wall' and b[2]<=z+1000<b[5]:rect(m,[b[0],b[1],b[3],b[4]],'A-WALL')
 for r in M['rooms'][lev]:
  b=r['zones_mm'][0];m.add_text(r['id']+' '+r['name'],dxfattribs={'height':110,'insert':(b[0]+150,(b[1]+b[3])/2),'layer':'A-ROOM'});m.add_text(str(r['area_m2'])+' m2',dxfattribs={'height':90,'insert':(b[0]+150,(b[1]+b[3])/2-170),'layer':'A-ROOM'})
 for op in M['openings'][lev]:
  s,e=op['start_mm'],op['end_mm'];side=op.get('side');axis=op.get('axis');pos=op.get('position_mm')
  if side in ['south','north']:a,b=[s,0 if side=='south' else 10000],[e,0 if side=='south' else 10000]
  elif side in ['west','east']:a,b=[0 if side=='west' else 12000,s],[0 if side=='west' else 12000,e]
  elif axis=='x':a,b=[pos,s],[pos,e]
  else:a,b=[s,pos],[e,pos]
  m.add_line(a,b,dxfattribs={'layer':'A-OPENING'});m.add_text(op['id'],dxfattribs={'height':65,'insert':a,'layer':'A-TAGS'})
 rect(m,[5100,3700,7100,6350],'A-STAIR')
 for y in range(3700,5451,250):m.add_line((5100,y),(6000,y),dxfattribs={'layer':'A-STAIR'});m.add_line((6200,y),(7100,y),dxfattribs={'layer':'A-STAIR'})
 m.add_line((7100,3300),(8240,3300),dxfattribs={'layer':'A-DIM'});m.add_text('1100 clear side passage',dxfattribs={'height':85,'insert':(7100,3150),'layer':'A-DIM'})
 for a,b,text in [((0,-700),(12000,-700),'12000 overall'),((-700,0),(-700,10000),'10000 overall')]:m.add_line(a,b,dxfattribs={'layer':'A-DIM'});m.add_text(text,dxfattribs={'height':120,'insert':a,'layer':'A-DIM'})
 d.saveas(OUT/f'A_{lev}_Coordinated.dxf')
d,m=doc('A104_Roof.dxf','HIPPED ROOF PLAN')
m.add_lwpolyline([(v[i][0],v[i][1]) for i in [0,1,2,3]],close=True,dxfattribs={'layer':'A-ROOF'})
for a,b in [(0,4),(1,5),(2,5),(3,4),(4,5)]:m.add_line(v[a][:2],v[b][:2],dxfattribs={'layer':'A-HIP-RIDGE'})
for q in M['roof']['sleeve_apertures_mm']:rect(m,q,'A-ROOF-SLEEVE')
m.add_text('Eaves +5800 / ridge +8000 / overhang 400',dxfattribs={'height':140,'insert':(0,-900)});d.saveas(OUT/'A104_Roof.dxf')
d,m=doc('A201_Elevations.dxf','FOUR SYNCHRONISED ELEVATIONS')
for i,side in enumerate(['south','north','west','east']):
 off=(i%2)*15500; oy=-(i//2)*12000;axis=0 if side in ['south','north'] else 1
 for el in G:
  if el['kind'] not in ['wall','slab','door','glass']:continue
  b=el['bounds_mm'];boundary=(b[1]<201 if side=='south' else b[4]>9799 if side=='north' else b[0]<201 if side=='west' else b[3]>11799)
  if boundary:rect(m,[b[axis]+off,b[2]+oy,b[axis+3]+off,b[5]+oy],'A-ELEV')
 profile=[(-400,5800),(5000,8000),(7000,8000),(12400,5800)] if axis==0 else [(-400,5800),(5000,8000),(10400,5800)]
 m.add_lwpolyline([(x+off,y+oy) for x,y in profile],dxfattribs={'layer':'A-ROOF'})
 m.add_text(side.upper(),dxfattribs={'height':200,'insert':(off,-3500+oy)})
 for lev,z in M['levels_mm'].items():m.add_text(lev+' FFL '+str(z),dxfattribs={'height':110,'insert':(off-1500,z+oy)})
d.saveas(OUT/'A201_Elevations.dxf')
d,m=doc('A301_Sections.dxf','STAIR SECTION X=5550 / ROOM SECTION Y=2500')
for i,(axis,cut) in enumerate([(0,5550),(1,2500)]):
 off=i*15000;other=1-axis
 for el in G:
  b=el['bounds_mm']
  if b[axis]<=cut<=b[axis+3] and el['kind'] not in ['equipment','glass','door']:rect(m,[b[other]+off,b[2],b[other+3]+off,b[5]],'A-SECTION')
 distance=min(cut+400,(12400 if axis==0 else 10400)-cut,5400);extent=10400 if axis==0 else 12400;top=5800+2200*distance/5400;profile=[(-400,5800),(-400+distance,top),(extent-distance,top),(extent,5800)]
 m.add_lwpolyline([(x+off,y) for x,y in profile],dxfattribs={'layer':'A-ROOF-SECTION'})
 m.add_text(('STAIR' if i==0 else 'ROOM')+' SECTION; roof cut geometry',dxfattribs={'height':150,'insert':(off,-3600)})
d.saveas(OUT/'A301_Sections.dxf')
d,m=doc('C101_Site_Utilities.dxf','ASSUMED SITE / UTILITY CONNECTIONS')
rect(m,[-6000,-7000,18000,16000],'C-PLOT-ASSUMED');rect(m,[0,0,12000,10000],'C-HOUSE');rect(m,[8600,-6250,10000,0],'C-STAIR');rect(m,[-1300,5700,0,7100],'C-LIGHTWELL')
for r in M['routes']:
 if any(p[0]<0 or p[0]>12000 or p[1]<0 or p[1]>10000 for p in r['points_mm']):m.add_polyline3d(r['points_mm'],dxfattribs={'layer':'C-'+r['system'].upper()})
m.add_text('NOT SURVEYED; separate sewer and storm outfalls; garden stair accessible',dxfattribs={'height':150,'insert':(0,-6800)});d.saveas(OUT/'C101_Site_Utilities.dxf')
for sys in sorted(set(r['system'] for r in M['routes'])):
 name='R_'+sys+'_3D.dxf';d,m=doc(name,sys.upper()+' PHYSICAL ROUTES')
 for r in M['routes']:
  if r['system']==sys:m.add_polyline3d(r['points_mm'],dxfattribs={'layer':'R-'+sys.upper()});m.add_text(r['id']+' dia '+str(r['visual_diameter_mm']),dxfattribs={'height':80,'insert':r['points_mm'][0],'layer':'R-TAGS'})
 d.saveas(OUT/name)
# Schematics use a clearly distinct diagram grid and explicit label.
for sys,name in [('electrical','E101_One_Line.dxf'),('water','P101_Water.dxf'),('drainage','P102_Drainage.dxf'),('hvac','M101_HVAC.dxf')]:
 d,m=doc(name,sys.upper()+' FUNCTIONAL SCHEMATIC - NOT SPATIAL')
 nodes=list(M['systems'][sys]['nodes_mm']);pos={n:((i%5)*3000,10000-(i//5)*1800) for i,n in enumerate(nodes)}
 for n,p in pos.items():m.add_circle(p,120);m.add_text(n,dxfattribs={'height':100,'insert':(p[0]+180,p[1])})
 for a,b,c in M['systems'][sys]['edges']:m.add_line(pos[a],pos[b],dxfattribs={'layer':'S-CONNECTION'})
 d.saveas(OUT/name)
M['drawing_index']=[n for n,d in drawings]
M.update(json.loads((OUT/'source/Issue_Control.json').read_text()))
(OUT/'building_manifest.json').write_text(json.dumps(M,indent=2))
for filename,rows in [('Room_Schedule.csv',[r for rooms in M['rooms'].values() for r in rooms]),('Opening_Schedule.csv',[dict(o,level=lev) for lev,ops in M['openings'].items() for o in ops]),('Route_Schedule.csv',M['routes']),('Penetration_Schedule.csv',M['penetrations']),('Equipment_Schedule.csv',M['equipment'])]:
 keys=list(dict.fromkeys(k for r in rows for k in r))
 with (OUT/filename).open('w',newline='') as st:
  wr=csv.DictWriter(st,keys);wr.writeheader();wr.writerows({k:json.dumps(v) if isinstance(v,(list,dict)) else v for k,v in r.items()} for r in rows)
with (OUT/'Electrical_Load_Schedule.csv').open('w',newline='') as st:
 wr=csv.writer(st);wr.writerow(['id','W','V','leg','A','game_trip_W']);wr.writerows([k,v['rated_W'],v['V'],v['leg'],v['current_A'],v['game_trip_W']] for k,v in M['systems']['electrical']['loads'].items())
# PDF drawing book: no schematic coordinates masquerade as routes.
c=canvas.Canvas(str(OUT/'Architectural_and_Services_Drawings.pdf'),pagesize=(1190,842))
def page(title):
 c.setFillColor(HexColor('#162e3a'));c.rect(0,780,1190,62,fill=1,stroke=0);c.setFillColor(HexColor('#ffffff'));c.setFont('Helvetica-Bold',18);c.drawString(36,806,'JOHANSSON HOUSE | '+title);c.setFillColor(HexColor('#203844'));c.setFont('Helvetica',9);c.drawString(36,20,'REV F | 13 OCT 2026 | GAME PRODUCTION REFERENCE | CAD mm; model m | Unsurveyed site; no construction certification');c.drawRightString(1150,20,str(c.getPageNumber()))
def drawplan(lev,services=None):
 z=M['levels_mm'][lev];s=72/25.4/50;ox=210;oy=115
 def rr(b,col):c.setFillColor(HexColor(col));c.rect(ox+b[0]*s,oy+b[1]*s,(b[2]-b[0])*s,(b[3]-b[1])*s,fill=1,stroke=0)
 for el in G:
  b=el['bounds_mm']
  if el['kind']=='wall' and b[2]<=z+1000<b[5]:rr([b[0],b[1],b[3],b[4]],'#333d43')
 c.setStrokeColor(HexColor('#b48443'));c.setLineWidth(1)
 c.rect(ox+5100*s,oy+3700*s,2000*s,2650*s)
 for i in range(8):
  y=oy+(3700+i*250)*s;c.line(ox+5100*s,y,ox+6000*s,y);c.line(ox+6200*s,y,ox+7100*s,y)
 for r in M['rooms'][lev]:
  b=r['zones_mm'][0];x=ox+(b[0]+b[2])/2*s;y=oy+(b[1]+b[3])/2*s;c.setFillColor(HexColor('#162e3a'));c.setFont('Helvetica-Bold',9)
  if r['name']=='Stair hall':x=ox+7650*s;y=oy+(9000 if lev=='G0' else 3000)*s
  for n,line in enumerate(simpleSplit(r['name'],'Helvetica-Bold',9,150)):c.drawCentredString(x,y-n*12,line)
  c.setFont('Helvetica',8);c.drawCentredString(x,y-30,r['id']+' | '+str(r['area_m2'])+' m2')
 for op in M['openings'][lev]:
  a,e=op['start_mm'],op['end_mm'];side=op.get('side')
  if side in ['south','north']:p,q=(a,0 if side=='south' else 10000),(e,0 if side=='south' else 10000)
  elif side in ['west','east']:p,q=(0 if side=='west' else 12000,a),(0 if side=='west' else 12000,e)
  elif op['axis']=='x':p,q=(op['position_mm'],a),(op['position_mm'],e)
  else:p,q=(a,op['position_mm']),(e,op['position_mm'])
  c.setStrokeColor(HexColor('#36869c'));c.setLineWidth(2);c.line(ox+p[0]*s,oy+p[1]*s,ox+q[0]*s,oy+q[1]*s)
  c.setFillColor(HexColor('#162e3a'));c.setFont('Helvetica',5.7);c.saveState();c.translate(ox+(p[0]+q[0])/2*s,oy+(p[1]+q[1])/2*s)
  if p[0]==q[0]:c.rotate(90)
  c.drawCentredString(0,4,op['id']);c.restoreState()
 c.setFillColor(HexColor('#162e3a'));c.setFont('Helvetica',11);c.drawCentredString(ox+6000*s,oy-28,'12 000 mm overall');c.drawString(36,440,'10 000 mm');c.drawString(36,424,'overall')
 c.setFont('Helvetica',9);c.drawString(900,700,'FFL '+str(z)+' mm');c.drawString(900,680,'Walls: 200 / 120 mm');c.drawString(900,660,'Internal apertures: 900 mm');c.drawString(900,640,'Sliding doors: ID schedule');c.drawString(900,620,'Stair: 16 x 175 mm');c.drawString(900,600,'Treads 250; flights 900 mm');c.drawString(900,580,'Side passage: 1100 mm');c.drawString(900,560,'Scale 1:50 at full A3 size');c.drawString(900,540,'Use CAD for dimensions');c.drawString(900,520,'North: page up')
 if services:
  c.setFont('Helvetica',9);c.drawString(900,480,'Route colours:');
  for i,t in enumerate(['Gold: electrical','Blue/red: cold/hot','Brown: sanitary','Green: ventilation','Route IDs and Z: CSV/DXF']):c.drawString(900,460-i*18,t)
  palette={'electrical':'#bc981c','potable_cold':'#237fc2','potable_hot':'#ce4240','sanitary':'#815735','storm':'#358d98','hvac':'#4b9661'}
  c.saveState();clipper=c.beginPath();clipper.rect(ox-100*s,oy-200*s,12200*s,10400*s);c.clipPath(clipper,stroke=0,fill=0)
  for r in M['routes']:
   if r['system'] not in services:continue
   c.setStrokeColor(HexColor(palette.get(r['system'],'#805094')));c.setLineWidth(1)
   for a,b in zip(r['points_mm'],r['points_mm'][1:]):
    if min(a[2],b[2])<z+2800 and max(a[2],b[2])>=z-300:c.line(ox+a[0]*s,oy+a[1]*s,ox+b[0]*s,oy+b[1]*s)
  c.restoreState()
for lev in ['B1','G0','L1']:page(lev+' | COORDINATED PLAN');drawplan(lev);c.showPage()
# Roof drawing
page('A104 | HIPPED ROOF');s=.05;ox=180;oy=160;c.setStrokeColor(HexColor('#a64c33'))
for a,b in [(0,1),(1,2),(2,3),(3,0),(0,4),(1,5),(2,5),(3,4),(4,5)]:c.line(ox+v[a][0]*s,oy+v[a][1]*s,ox+v[b][0]*s,oy+v[b][1]*s)
for q in M['roof']['sleeve_apertures_mm']:c.rect(ox+q[0]*s,oy+q[1]*s,(q[2]-q[0])*s,(q[3]-q[1])*s)
c.setFont('Helvetica',12);c.drawString(920,690,'Eaves: +5800 mm');c.drawString(920,665,'Ridge: +8000 mm');c.drawString(920,640,'Overhang: 400 mm');c.drawString(920,615,'2 downpipes');c.drawString(920,590,'Roof plan: 138.24 m2');c.showPage()
# Four elevations at matching scale, labels and level lines.
page('A201 | ELEVATIONS')
for i,side in enumerate(['south','north','west','east']):
 axis=0 if side in ['south','north'] else 1;s=.033;ox=65+(i%2)*570;oy=490-(i//2)*365
 c.setFillColor(HexColor('#bdb39e'));c.rect(ox,oy-2800*s,(12000 if axis==0 else 10000)*s,8400*s,fill=1,stroke=1)
 c.setFillColor(HexColor('#aec5ce'))
 for lev,ops in M['openings'].items():
  for op in ops:
   if op.get('side')==side:c.rect(ox+op['start_mm']*s,oy+(M['levels_mm'][lev]+op['sill_mm'])*s,(op['end_mm']-op['start_mm'])*s,(op['head_mm']-op['sill_mm'])*s,fill=1,stroke=1)
 c.setStrokeColor(HexColor('#ad543d'))
 profile=[(-400,5800),(5000,8000),(7000,8000),(12400,5800)] if axis==0 else [(-400,5800),(5000,8000),(10400,5800)]
 p=c.beginPath();p.moveTo(ox+profile[0][0]*s,oy+profile[0][1]*s)
 for x,y in profile[1:]:p.lineTo(ox+x*s,oy+y*s)
 c.drawPath(p)
 c.setFillColor(HexColor('#162e3a'));c.setFont('Helvetica-Bold',11);c.drawString(ox,oy-2800*s-24,side.upper());c.setFont('Helvetica',8)
 for lev,z in M['levels_mm'].items():c.drawString(ox+410,oy+z*s,lev+' '+str(z))
c.showPage()
page('A301 | STAIR SECTION X = 5550');s=.052;ox=180;oy=260
for el in G:
 b=el['bounds_mm']
 if b[0]<=5550<=b[3] and el['kind'] not in ['glass','door','equipment','site']:
  c.setFillColor(HexColor('#b5a58d'));c.rect(ox+b[1]*s,oy+b[2]*s,(b[4]-b[1])*s,(b[5]-b[2])*s,fill=1,stroke=1)
c.setFillColor(HexColor('#162e3a'));c.setFont('Helvetica',11)
for lev,z in M['levels_mm'].items():c.drawString(850,oy+z*s,lev+' FFL '+str(z))
c.drawString(850,680,'Headroom target: 2000 mm');c.drawString(850,660,'Slabs: 180 mm');c.drawString(850,640,'Finished floors: -2800 / 0 / 2800');c.drawString(850,620,'Roof deck: +5420 to +5600');c.drawString(850,600,'Stair cut through west flight');c.setStrokeColor(HexColor('#a64c33'));path=c.beginPath();path.moveTo(ox-400*s,oy+5800*s);path.lineTo(ox+5000*s,oy+8000*s);path.lineTo(ox+10400*s,oy+5800*s);c.drawPath(path);c.showPage()
for lev in ['B1','G0','L1']:page(lev+' | SERVICE COORDINATION OVERLAY');drawplan(lev,['electrical','potable_cold','potable_hot','sanitary','hvac']);c.showPage()
page('C101 | BASEMENT COURT AND SITE');s=.033;ox=230;oy=260
c.setStrokeColor(HexColor('#263e48'));c.rect(ox,oy,12000*s,10000*s);c.rect(ox+8600*s,oy-6250*s,1400*s,6250*s);c.rect(ox-1300*s,oy+5700*s,1300*s,1400*s);c.rect(ox+7400*s,oy+10000*s,4600*s,2000*s)
c.setFont('Helvetica',12)
for i,t in enumerate(['Assumed plot; no survey','Garden stair: 16 x 175 / 250','Clear width: 1000 mm','Court landing: 1400 x 1300','Court and lightwell to storm sump','Sanitary lift pump is independent','Storm/sewer outlets remain separate','Window W-B1 serves lightwell','Waterproofing is a game assembly']):c.drawString(850,700-i*24,t)
c.showPage()
page('E101 | ELECTRICAL DISTRIBUTION AND GAME LOADS')
c.setFillColor(HexColor('#162e3a'));c.setFont('Helvetica-Bold',13);c.drawString(45,730,'POLE -> METER -> MAIN | game 100/200 V, 60 Hz | main demand budget 12 kW')
c.setFont('Helvetica',10);c.drawString(45,708,'Each branch has an isolation state and game trip threshold; installation cable and protection ratings are outside scope.')
for i,(board,label) in enumerate([('B1_DB','BASEMENT'),('G0_DB','GROUND'),('L1_DB','FIRST FLOOR')]):
 x=50+i*380;c.setStrokeColor(HexColor('#223d48'));c.rect(x,660,320,28);c.setFont('Helvetica-Bold',12);c.drawString(x+10,669,board+' | '+label)
 rows=[(b,loads[b]) for a,b,cc in edges if a==board and b in loads]
 for k,(b,(pw,u,leg)) in enumerate(rows):
  y=615-k*65;c.setFont('Helvetica-Bold',11);c.drawString(x+18,y,b);c.setFont('Helvetica',10);c.drawString(x+18,y-17,f'{pw} W / {u} V / leg {leg} / {pw/u:.2f} A');c.drawString(x+18,y-32,'Game trip budget: '+str(pw*1.25)+' W')
 c.setFont('Helvetica',9);c.drawString(x,105,'Room luminaires and sockets inherit branch state.')
c.setFont('Helvetica',10);c.drawString(45,60,'Connected and diversified demand calculations are recorded in Validation_Results.json; 19 room luminaires are distributed under the lighting groups.');c.showPage()
for title,system in [('P101 | POTABLE WATER','water'),('P102 | SANITARY AND STORM','drainage'),('M101 | AIR-CONDITIONING AND VENTILATION','hvac')]:
 page(title);c.setFont('Helvetica',11);c.setFillColor(HexColor('#162e3a'));c.drawString(45,733,'Functional connections below; physical route IDs, ports, sizes and coordinates are in the route schedule and 3D DXFs.')
 y=692
 for a,b,label in M['systems'][system]['edges']:
  c.setFillColor(HexColor('#edf1f2'));c.rect(45,y-10,1090,31,fill=1,stroke=0);c.setFillColor(HexColor('#162e3a'));c.setFont('Helvetica-Bold',10);c.drawString(60,y,a+'  ->  '+b);c.setFont('Helvetica',10);c.drawString(650,y,label);y-=39
 c.setFont('Helvetica',10)
 notes={'water':['Cold: 300 kPa source; 0.6 L/s simultaneous game demand. Heater: 180 L, 60 C storage; 40 C mixed.','Branch visual sizes 20 mm; trunk 32 mm. Values define simulation geometry, not an installation specification.'], 'drainage':['Sanitary gravity falls >=2%; B1 lift 1 L/s at 4 m game head; storm sump 5 L/s at 5 m.','Roof rain model: 100 mm/h over 138.24 m2 -> 3.84 L/s. Two downpipes provide 6 L/s game capacity.','Storm and sanitary outfalls remain independent; vent and soil stack are one continuous vented pipe.'], 'hvac':['Balanced target: 400 m3/h supply = 180 general + 100 sauna + 120 smoke extract.','G0 and L1 cooling each 4 kW for a 50 m2 selected zone at 80 W/m2. Fans and open windows serve other zones.','Extract ducts are independent; condensate drains to an air-gap storm receptor; sealed heater flue exits roof.']}[system]
 for i,t in enumerate(notes):c.drawString(45,105-i*20,t)
 c.showPage()
c.save()
print(json.dumps({'geometry_solids':len(G),'routes':len(M['routes']),'penetrations':len(M['penetrations']),'mesh':M['mesh_stats'],'drawings':len(drawings)},indent=2))
