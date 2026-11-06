"""Deterministic Johansson House reference logic. Game simulation, not real electrical work."""
import copy, json
class House:
 def __init__(self,manifest):
  self.m=manifest;self.s={'schema':2,'power':True,'breakers':{k:True for k in manifest['systems']['electrical']['nodes_mm']},'valves':{'SHUTOFF':True,'COLD_MANIFOLD':True},'fixture_switches':{f['id']:True for f in manifest['electrical_fixtures'] if f['type']=='ceiling luminaire'},'earth_ok':{k:True for k in manifest['systems']['electrical']['loads']},'draw_W':{k:0 for k in manifest['systems']['electrical']['loads']},'faults':{},'fuel':True,'heater':True,'fans':{k:False for k in ['B1_FRESH','B1_EXHAUST','SAUNA_EXHAUST','SMOKING_EXHAUST']},'doors':{o['id']:False for ops in manifest['openings'].values() for o in ops if o['type']=='door'},'isolated':[],'verified':[],'sump_L':0.,'storm_L':0.,'tank_L':180.,'alarm':False}
 def powered(self,node):
  if not self.s['power']:return False
  parents={b:a for a,b,_ in self.m['systems']['electrical']['edges']}
  seen=set()
  while True:
   if node in seen:raise ValueError('cyclic electrical graph')
   seen.add(node)
   if not self.s['breakers'].get(node,True) or self.s['faults'].get(node):return False
   if node not in parents:return node=='POLE'
   node=parents[node]
 def light(self,node):return self.powered(node) and self.s['fixture_switches'][node]
 def trip(self,node):self.s['breakers'][node]=False
 def inject(self,node,fault):
  self.s['faults'][node]=fault
  if fault in ['leakage','earth_fault']:self.trip(node)
  if fault=='earth_fault':self.s['earth_ok'][node]=False
 def energise(self,node,watts):
  budget=self.m['systems']['electrical']['loads'][node]['game_trip_W']
  if watts<0:raise ValueError('negative demand')
  self.s['draw_W'][node]=watts
  if watts>budget:self.trip(node)
  self.enforce_main_budget()
  return self.powered(node)
 def enforce_main_budget(self):
  if sum(w for k,w in self.s['draw_W'].items() if self.powered(k))>self.m['electrical_design']['main_budget_W']:self.trip('MAIN')
 def isolate(self,node):
  self.trip(node)
  if node not in self.s['isolated']:self.s['isolated'].append(node)
 def verify_dead(self,node):
  if node not in self.s['isolated'] or self.powered(node):raise ValueError('isolate before verification')
  if node not in self.s['verified']:self.s['verified'].append(node)
 def repair(self,node):
  if node not in self.s['verified'] or self.powered(node):raise ValueError('verified isolation required')
  if self.s['faults'].get(node)=='earth_fault':self.s['earth_ok'][node]=True
  self.s['faults'].pop(node,None);self.s['verified'].remove(node)
 def reset(self,node):
  if self.s['faults'].get(node):return False
  self.s['breakers'][node]=True
  self.enforce_main_budget()
  self.s['isolated']=[x for x in self.s['isolated'] if x!=node];self.s['verified']=[x for x in self.s['verified'] if x!=node]
  return self.powered(node)
 def water(self,fixture,hot=False):
  if fixture not in self.m['systems']['water']['fixture_flow_L_s']:raise KeyError(fixture)
  if not all(self.s['valves'].values()) or self.s['faults'].get(fixture)=='water_leak':return False
  return not hot or (fixture in ['KITCHEN','L1_BATH','SAUNA_SHOWER'] and self.powered('HEATER_E') and self.s['fuel'] and self.s['heater'] and self.s['tank_L']>0)
 def drain_available(self,node):
  return not self.s['faults'].get(node) and not self.s['faults'].get('SEWER_MAIN') and not self.s['faults'].get('SOIL_STACK')
 def cooling(self,level):
  return self.powered('AC_'+level) and not self.s['faults'].get('HVAC_'+level) and not self.s['faults'].get('CONDENSATE_'+level)
 def ventilation(self):
  return {k:self.powered('VENT') and v and not self.s['faults'].get(k) for k,v in self.s['fans'].items()}
 def step(self,dt,shower_L_s=0,rain_L_s=0,hot_L_s=0):
  if not 0<dt<=60:raise ValueError('dt must be in (0,60]')
  if min(shower_L_s,rain_L_s,hot_L_s)<0:raise ValueError('negative flow')
  self.enforce_main_budget()
  if not self.water('SAUNA_SHOWER'):shower_L_s=0
  self.s['sump_L']+=shower_L_s*dt
  if self.powered('PUMP') and self.drain_available('B1_PUMP'):self.s['sump_L']=max(0,self.s['sump_L']-dt)
  self.s['storm_L']+=rain_L_s*dt
  if self.powered('STORM_PUMP') and not self.s['faults'].get('STORM_OUT'):self.s['storm_L']=max(0,self.s['storm_L']-5*dt)
  # Capacities limit volume; excess raises flood state instead of silently disappearing.
  self.s['alarm']=self.s['sump_L']>40 or self.s['storm_L']>150
  self.s['sump_L']=min(60,self.s['sump_L']);self.s['storm_L']=min(200,self.s['storm_L'])
  if self.water('KITCHEN',True):self.s['tank_L']=max(0,self.s['tank_L']-hot_L_s*dt)
  if self.s['heater'] and self.s['fuel'] and self.powered('HEATER_E') and all(self.s['valves'].values()):self.s['tank_L']=min(180,self.s['tank_L']+.05*dt)
  return copy.deepcopy(self.s)
 def save(self):return json.dumps(self.s,sort_keys=True)
 def load(self,data):
  s=json.loads(data)
  if s.get('schema')!=2:raise ValueError('explicit E migration required')
  if set(s)!=set(self.s):raise ValueError('invalid state fields')
  if set(s['doors'])!=set(self.s['doors']):raise ValueError('unknown door ID')
  if set(s['breakers'])!=set(self.s['breakers']):raise ValueError('unknown breaker ID')
  if not (0<=s['tank_L']<=180 and 0<=s['sump_L']<=60 and 0<=s['storm_L']<=200):raise ValueError('out of range volume')
  self.s=s
