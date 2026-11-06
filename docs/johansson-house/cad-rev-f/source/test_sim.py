import json, unittest
from pathlib import Path
from reference_sim import House
class Contract(unittest.TestCase):
 def setUp(self):self.m=json.loads((Path(__file__).parents[1]/'building_manifest.json').read_text());self.h=House(self.m)
 def test_room_lights(self):
  node='G0-ROOM-01-LIGHT';self.assertTrue(self.h.light(node));self.h.s['fixture_switches'][node]=False;self.assertFalse(self.h.light(node))
 def test_main_demand_trip(self):
  for k,v in self.m['systems']['electrical']['loads'].items():self.h.energise(k,v['rated_W'])
  self.assertFalse(self.h.powered('MAIN'));self.assertFalse(self.h.reset('MAIN'))
 def test_earth_fault(self):
  self.h.inject('SEWING','earth_fault');self.assertFalse(self.h.s['earth_ok']['SEWING']);self.assertFalse(self.h.powered('SEWING'));self.h.isolate('SEWING');self.h.verify_dead('SEWING');self.h.repair('SEWING');self.assertTrue(self.h.s['earth_ok']['SEWING']);self.assertTrue(self.h.reset('SEWING'))
 def test_default_power(self):self.assertTrue(all(self.h.powered(k) for k in self.m['systems']['electrical']['loads']))
 def test_main_isolation(self):
  self.h.trip('MAIN');self.assertFalse(any(self.h.powered(k) for k in self.m['systems']['electrical']['loads']))
 def test_branch_isolation(self):
  self.h.trip('SEWING');self.assertFalse(self.h.powered('SEWING'));self.assertTrue(self.h.powered('LIGHT_G'))
 def test_board_isolation(self):
  self.h.trip('B1_DB');self.assertFalse(self.h.powered('PUMP'));self.assertTrue(self.h.powered('AC_L'))
 def test_power_loss(self):self.h.s['power']=False;self.assertFalse(self.h.powered('SAUNA'))
 def test_overload(self):self.assertFalse(self.h.energise('SEWING',500))
 def test_leakage_trip(self):self.h.inject('WORKSHOP','leakage');self.assertFalse(self.h.s['breakers']['WORKSHOP'])
 def test_reset_cannot_clear_fault(self):self.h.inject('SEWING','open_conductor');self.assertFalse(self.h.reset('SEWING'))
 def test_repair_gate(self):
  self.h.inject('SEWING','open_conductor')
  with self.assertRaises(ValueError):self.h.repair('SEWING')
  self.h.isolate('SEWING');self.h.verify_dead('SEWING');self.h.repair('SEWING');self.assertTrue(self.h.reset('SEWING'))
 def test_verify_needs_isolation(self):
  with self.assertRaises(ValueError):self.h.verify_dead('MAIN')
 def test_water_shutoff(self):self.h.s['valves']['SHUTOFF']=False;self.assertFalse(self.h.water('KITCHEN'));self.assertFalse(self.h.water('KITCHEN',True))
 def test_hot_dependencies(self):
  self.h.s['fuel']=False;self.assertFalse(self.h.water('KITCHEN',True));self.assertTrue(self.h.water('KITCHEN'))
 def test_heater_power(self):self.h.trip('HEATER_E');self.assertFalse(self.h.water('L1_BATH',True))
 def test_pump_loss_alarm(self):
  self.h.trip('PUMP')
  for i in range(10):self.h.step(60,shower_L_s=.15)
  self.assertTrue(self.h.s['alarm']);self.assertEqual(self.h.s['sump_L'],60)
 def test_working_pump(self):self.h.step(60,shower_L_s=.15);self.assertEqual(self.h.s['sump_L'],0)
 def test_sewer_blockage(self):self.h.inject('SEWER_MAIN','blockage');self.h.step(60,shower_L_s=.15);self.assertGreater(self.h.s['sump_L'],0)
 def test_storm_independence(self):self.h.trip('PUMP');self.h.step(60,rain_L_s=3.84);self.assertEqual(self.h.s['storm_L'],0)
 def test_storm_failure(self):self.h.trip('STORM_PUMP');self.h.step(60,rain_L_s=3.84);self.assertTrue(self.h.s['alarm'])
 def test_ventilation_independence(self):
  self.h.s['fans']['SMOKING_EXHAUST']=True;v=self.h.ventilation();self.assertTrue(v['SMOKING_EXHAUST']);self.assertFalse(v['SAUNA_EXHAUST'])
 def test_fan_failure(self):self.h.s['fans']['SMOKING_EXHAUST']=True;self.h.inject('SMOKING_EXHAUST','fan_failure');self.assertFalse(self.h.ventilation()['SMOKING_EXHAUST'])
 def test_condensate_interlock(self):self.h.inject('CONDENSATE_G','blockage');self.assertFalse(self.h.cooling('G'));self.assertTrue(self.h.cooling('L'))
 def test_save_reload(self):
  self.h.trip('SEWING');self.h.s['doors']['D-ENTRY']=True;self.h.s['tank_L']=110;s=self.h.save();n=House(self.m);n.load(s);self.assertEqual(n.save(),s)
 def test_invalid_schema(self):
  s=json.loads(self.h.save());s['schema']=1
  with self.assertRaises(ValueError):self.h.load(json.dumps(s))
 def test_unknown_door(self):
  s=json.loads(self.h.save());s['doors']['invalid']=True
  with self.assertRaises(ValueError):self.h.load(json.dumps(s))
 def test_volume_validation(self):
  s=json.loads(self.h.save());s['tank_L']=200
  with self.assertRaises(ValueError):self.h.load(json.dumps(s))
 def test_time_step(self):
  with self.assertRaises(ValueError):self.h.step(61)
 def test_no_negative_flow(self):
  with self.assertRaises(ValueError):self.h.step(1,rain_L_s=-1)
 def test_tank_bounds(self):
  for i in range(20):self.h.step(60,hot_L_s=1)
  self.assertGreaterEqual(self.h.s['tank_L'],0);self.assertLessEqual(self.h.s['tank_L'],180)
if __name__=='__main__':
 suite=unittest.defaultTestLoader.loadTestsFromTestCase(Contract);r=unittest.TextTestRunner(verbosity=2).run(suite)
 report={'tests_run':r.testsRun,'failures':len(r.failures),'errors':len(r.errors),'pass':r.wasSuccessful(),'scope':'reference simulation only'}
 (Path(__file__).parents[1]/'Simulation_Test_Results.json').write_text(json.dumps(report,indent=2))
 raise SystemExit(not r.wasSuccessful())
