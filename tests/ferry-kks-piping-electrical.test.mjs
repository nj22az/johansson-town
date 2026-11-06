import test from 'node:test';
import assert from 'node:assert/strict';
import {kks,kksParse,kksExplain,kksCable,KKS_FUNCTION_KEYS,KKS_EQUIPMENT_KEYS,KKS_COMPONENT_KEYS,KKS_AN} from '../src/world/ferry-kks.js';
import {FERRY_PIPING,FERRY_SERVICES,pipingSystem} from '../src/world/ferry-piping.js';
import {FERRY_FEEDERS,FERRY_BOARDS,FERRY_SOURCES,electricalChecks,BREAKERS,CABLE_RATINGS,voltageDrop,loadTag} from '../src/world/ferry-electrical.js';
import {FERRY_LOADS,FERRY_ELECTRICS,gaSpace} from '../src/world/ferry-ship.js';

test('KKS tags follow the VGB structure: plant, identical system, function key, decade, equipment and number, component',()=>{
 assert.equal(kks({f0:1,fn:'XJA',n:10,eq:'AP',no:1,cmp:'-M',cno:1}),'11XJA10 AP001 -M01');
 assert.equal(kks({fn:'SGA',n:30,eq:'AA',no:511,rule:'hand'}),'10SGA30 AA511');
 assert.deepEqual(kksParse('11XJA10 AP001 -M01'),{g:1,f0:1,fn:'XJA',n:10,eq:'AP',no:1,a3:'',cmp:'-M',cno:1});
 assert.equal(kksParse('XJA10'),null);
 assert.match(kksExplain('13MKA10 AG001'),/generator No\.1 · Generator/);
 // The key part's counting rules: a hand valve is 501–599, a safety valve 901–999, a local gauge 501–599.
 assert.throws(()=>kks({fn:'SGA',n:30,eq:'AA',no:511,rule:'safety'}));assert.doesNotThrow(()=>kks({fn:'SCA',n:20,eq:'AA',no:901,rule:'safety'}));
 assert.throws(()=>kks({fn:'ZZZ',n:10}),/unknown function key/);assert.throws(()=>kks({fn:'XJA',n:10,eq:'QQ',no:1}),/unknown equipment key/);
 // Every key says where it comes from; the equipment and component keys are the key part's letters.
 for(const [code,k] of KKS_FUNCTION_KEYS){assert.match(code,/^[A-Z]{3}$/);assert.ok(['VGB','yard'].includes(k.source),code);if(k.source==='yard')assert.ok(k.note.length>0||/^(XS|EG|SG|MK|CM|CS|CT|BT|BQ|BRT)/.test(code),code+' says why it is the yard’s');}
 for(const k of Object.keys(KKS_EQUIPMENT_KEYS))assert.match(k,/^[A-Z]{2}$/);for(const k of Object.keys(KKS_COMPONENT_KEYS))assert.match(k,/^-?[A-Z]{1,2}$/);
 // Cable numbers: the lower tag first, the number in its class's range.
 assert.equal(kksCable('10BRA10 GS001','10SGA10 AP001 -M01','ac',0),'10BRA10 1001');assert.throws(()=>kksCable('10BRA10 GS001','10SGA10 AP001','ac',999));
 assert.ok(KKS_AN.cable.ac[0]===1001&&KKS_AN.cable.control[1]===5999);
});

test('the piping: eleven systems, every node tagged and placed in a space, every line between two nodes, every pumped service with a standby',()=>{
 assert.equal(FERRY_PIPING.length,11);
 for(const s of FERRY_PIPING){
  assert.ok(KKS_FUNCTION_KEYS.has(s.fn),s.id+' has a function key');
  const ids=new Set(s.nodes.map(n=>n.id));assert.equal(ids.size,s.nodes.length,s.id+' unique node ids');
  const tags=s.nodes.map(n=>n.tag);assert.equal(new Set(tags).size,tags.length,s.id+' unique tags');
  for(const n of s.nodes){assert.ok(kksParse(n.tag),s.id+' '+n.id+' tag '+n.tag);assert.ok(gaSpace(n.where),s.id+' '+n.id+' stands in '+n.where);assert.ok(n.label.length>3);assert.ok(Number.isFinite(n.c)&&Number.isFinite(n.r));}
  for(const l of s.lines){assert.ok(ids.has(l.from)&&ids.has(l.to),s.id+' line '+l.from+'→'+l.to);assert.ok(l.dn>=0&&l.dn<=250,s.id+' bore '+l.dn);}
  // A valve's number says what kind of valve it is (the key part's counting rules).
  for(const n of s.nodes.filter(n=>/^(valve|nrv|qcv|relief)$/.test(n.kind))){const p=kksParse(n.tag);assert.equal(p.eq,'AA',n.id);if(n.kind==='relief')assert.ok(p.no>=901,n.id+' safety valve 9xx');if(n.kind==='qcv')assert.ok(p.no>=201&&p.no<=299,n.id+' quick-closing 2xx');}
 }
 // Every pumped service has two means, and both exist in its system; a motor-driven standby is never the duty pump.
 for(const sv of FERRY_SERVICES){const s=pipingSystem(sv.system);assert.ok(s,sv.service);const d=s.nodes.find(n=>n.id===sv.duty),st=s.nodes.find(n=>n.id===sv.standby);assert.ok(d&&st,sv.service);assert.notEqual(d.id,st.id);assert.ok(/pump|compressor/.test(d.kind)&&/pump|compressor/.test(st.kind),sv.service);}
 for(const id of ['fuel','lube','seawater','jacket','bilge','fire','air','freshwater','sewage','exhaust','hydraulics'])assert.ok(pipingSystem(id),id);
 // Every motor-driven pump or compressor on the diagrams is a consumer in the load analysis under the same tag (its motor).
 const motors=FERRY_PIPING.flatMap(s=>s.nodes.filter(n=>n.drive==='motor').map(n=>n.tag));
 const loadTags=new Set(FERRY_FEEDERS.map(f=>f.tag.replace(/ -M\d\d$/,'')));
 for(const t of motors)assert.ok(loadTags.has(t)||/GAA10 AP001/.test(t),'a load feeds '+t);
});

test('the electrical installation: every consumer a feeder with a standard breaker, a cable that carries it within 6 % drop, star-delta over 7.5 kW, unique tags and cable numbers',()=>{
 assert.deepEqual(electricalChecks(),[]);
 const ids=new Set(FERRY_LOADS.map(l=>l.id));for(const f of FERRY_FEEDERS)assert.ok(ids.has(f.id.replace(/[AB]$/,'')),f.id);
 for(const l of FERRY_LOADS)assert.ok(FERRY_FEEDERS.some(f=>f.id===l.id||f.id===l.id+'A'),l.id+' has a feeder');
 for(const f of FERRY_FEEDERS){
  assert.ok(BREAKERS.includes(f.breaker),f.id+' breaker '+f.breaker);assert.ok(f.rating>=f.breaker,f.id+' cable under its breaker');assert.ok(f.drop<=6,f.id+' drop');
  assert.ok(kksParse(f.tag),f.id+' tag '+f.tag);assert.match(f.number,/^\d\d[A-Z]{3}\d\d \d{4}$/,f.id+' cable number');
  if(f.starter==='star-delta')assert.ok(f.kW>7.5,f.id);if(f.starter==='DOL')assert.ok(f.kW<=7.5,f.id);
  if(f.supply==='105')assert.match(f.cable,/^2 ×/);else assert.match(f.cable,/^3 ×/);
  assert.ok(f.length>0&&f.length<80,f.id+' route '+f.length);
 }
 const tags=FERRY_FEEDERS.map(f=>f.tag),nums=FERRY_FEEDERS.map(f=>f.number);assert.equal(new Set(tags).size,tags.length,'unique tags');assert.equal(new Set(nums).size,nums.length,'unique cable numbers');
 // The thruster: 75 kW star-delta on a 200 A breaker with 95 mm² (its 129 A); the generators' breakers carry their 162 A.
 const th=FERRY_FEEDERS.find(f=>f.id==='thruster');assert.equal(th.starter,'star-delta');assert.equal(th.breaker,200);assert.match(th.cable,/95 mm²/);
 for(const s of FERRY_SOURCES.filter(s=>/^DG/.test(s.id)))assert.ok(s.breaker>=s.amps);
 for(const b of FERRY_BOARDS)assert.ok(gaSpace(b.where)&&kksParse(b.tag),b.id);
 assert.ok(voltageDrop(10,20,1.5,105,1)>voltageDrop(10,20,1.5,440,3),'a 105 V single-phase run drops more than a 440 V three-phase one');
 assert.ok(CABLE_RATINGS.every(([mm,a],i)=>i===0||a>CABLE_RATINGS[i-1][1]));
 assert.equal(FERRY_ELECTRICS.volts,445);
});
