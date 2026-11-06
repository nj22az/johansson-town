// Johansson Studio's modeller as World keeps it (src/studio/modeller/, src/studio/prop-registry.js): the checks and
// rules are the desktop Studio's own (byte for byte when the studio repository is beside this one), the card checks
// say what the desktop's Python says, the STL is millimetres with z up and its watertight report is right, and every
// prop in the registry has its builder, its kind and a purpose with no real brand in it.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import * as THREE from '../vendor/three.module.js';
import {cardChecks,cardProblems,brandHits,slugify} from '../src/studio/modeller/card-checks.js';
import {runChecks} from '../src/studio/modeller/checks.js';
import {madeFromObject,standOnFloor} from '../src/studio/modeller/made.js';
import {trianglesOf,stlBytes,readStl,meshReport,printWords} from '../src/studio/modeller/stl.js';
import {assetFileName,glbJson,prepareForExport} from '../src/studio/modeller/export.js';
import {PROP_REGISTRY,propPurpose} from '../src/studio/prop-registry.js';
import {catalogIds} from '../src/catalog/catalog-cards.js';

const town=new URL('../',import.meta.url),rules=JSON.parse(await readFile(new URL('src/studio/modeller/rules.json',town),'utf8'));
const DESKTOP='/home/user/jojo/town-studio';
const desktop=await stat(DESKTOP+'/modeller/checks.js').then(()=>true,()=>false);

test('the checks and rules are the desktop Studio’s own',{skip:!desktop&&'the studio repository is not beside this one'},async()=>{
 for(const f of ['checks.js','rules.json'])
  assert.equal(await readFile(new URL('src/studio/modeller/'+f,town),'utf8'),await readFile(`${DESKTOP}/modeller/${f}`,'utf8'),`src/studio/modeller/${f} differs from the desktop's modeller/${f}: copy it again`);
 // look.js keeps the desktop's lights and ink
 const look=await readFile(new URL('src/studio/modeller/look.js',town),'utf8'),theirs=await readFile(`${DESKTOP}/modeller/look.js`,'utf8');
 for(const n of ['0xdbe7f2','0x6b5f8c','1.15','0x9db6e8','[26, 16, -22]','0xffdca8','2.6','thickness: 1.05','shadowTint: 0xe0dcf0'])assert.ok(theirs.includes(n),n);
 for(const n of ['0xdbe7f2','0x6b5f8c','1.15','0x9db6e8','[26,16,-22]','0xffdca8','2.6','thickness:1.05','shadowTint:0xe0dcf0'])assert.ok(look.includes(n),n);
});

test('the card checks say what the desktop’s Python says',{skip:!desktop&&'the studio repository is not beside this one'},async()=>{
 const broken={format:1,id:'Bad Id',name:'',kind:'boat',version:0,purpose:{for:'kids',why:'Sony made it',where:'here'},size:[1,0,1],model:'model.obj',
  colours:{x:'red'},colliders:[{x:0}],seats:[{id:'s'}],spots:[{id:'p',kind:'fly',position:[0,0,0]}],action:{kind:'jump'},anchors:{a:[1,2]},keepClear:[{min:[0,0,0],max:[0,1,1]}],budget:{triangles:1.5},tags:'x'};
 const cards=[...await Promise.all(catalogIds().map(async id=>[id,JSON.parse(await readFile(new URL(`assets/catalog/${id}/asset.json`,town),'utf8'))])),['bad-id',broken]];
 const script=`import json,sys;from pathlib import Path;sys.path.insert(0,'.');from townstudio import assets
cards=json.loads(sys.stdin.read());base=Path(${JSON.stringify(fileURLToPath(new URL('assets/catalog',town)))})
print(json.dumps({i:assets.card_checks(c,None,i,base=base) for i,c in cards}))`;
 const child=promisify(execFile)('python3',['-c',script],{cwd:DESKTOP});child.child.stdin.end(JSON.stringify(cards));
 const python=JSON.parse((await child).stdout);
 for(const [id,card] of cards){
  const ours=cardChecks(card,rules,{assetId:id,taken:Object.fromEntries(catalogIds().map(i=>[i,'catalogue:johansson-studio']))});
  // Python also checks that the model file is in the folder; World's copy has no folder to look in
  const theirs=python[id].map(c=>c.id==='card'?{...c,detail:c.detail.replace(/ ?model\.\w+ is missing from the folder\./,'').trim()||'Every field is there.',ok:c.ok||/^model\.\w+ is missing from the folder\.$/.test(c.detail)}:c);
  assert.deepEqual(ours.map(c=>[c.id,c.ok]),theirs.map(c=>[c.id,c.ok]),id);
  assert.deepEqual(ours.filter(c=>c.id!=='id').map(c=>c.detail.replace(/'/g,'')),theirs.filter(c=>c.id!=='id').map(c=>c.detail.replace(/'/g,'')),id);
 }
});

test('brand names are found as whole words, World’s own list too',()=>{
 assert.deepEqual(brandHits('A Sony radio and an Orion lager',rules,['orion']),['orion','sony']);
 assert.deepEqual(brandHits('sonya and the orionids',rules,['orion']),[]);
 assert.equal(slugify('Akachōchin (izakaya red lantern)'),'akachochin-izakaya-red-lantern');
 assert.deepEqual(cardProblems({},rules).length>5,true);
});

test('STL is millimetres with z up, and a closed box is watertight while an open one is not',()=>{
 const box=new THREE.Mesh(new THREE.BoxGeometry(.2,.1,.05).translate(0,.05,0),new THREE.MeshStandardMaterial());
 const root=new THREE.Group();root.add(box);
 const tris=trianglesOf(THREE,root),bytes=stlBytes(tris,{name:'box'}),back=readStl(bytes),r=meshReport(back.triangles,{weld:.01});
 assert.equal(bytes.length,84+12*50);assert.equal(r.triangles,12);assert.equal(r.watertight,true);assert.equal(r.shells,1);
 assert.deepEqual(r.max.map((v,i)=>Math.round(v-r.min[i])),[200,50,100],'x stays x, World’s depth (z) is y, its height (y) is z');
 assert.ok(Math.abs(r.min[2])<1e-6,'standing on z = 0');assert.ok(r.volume>0,'faces out');
 const open=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.2,12,1,true));const g=new THREE.Group();g.add(open);
 const o=meshReport(trianglesOf(THREE,g));assert.equal(o.watertight,false);assert.equal(o.openEdges,24);
 assert.match(printWords({...o,min:o.min.map(v=>v*1000),max:o.max.map(v=>v*1000)}),/^Not watertight: 24 open edges/);
});

test('a model is checked as the desktop checks it: on the floor, its size, its budget, its collider',()=>{
 const root=new THREE.Group();root.name='Crate';const m=new THREE.Mesh(new THREE.BoxGeometry(.4,.3,.3),new THREE.MeshStandardMaterial());m.position.y=.5;root.add(m);
 standOnFloor(THREE,m);
 const made=madeFromObject(THREE,root),card={kind:'prop',size:[.4,.3,.3],budget:{triangles:100,materials:1},colliders:'auto',seats:[],spots:[],keepClear:[]};
 const r=Object.fromEntries(runChecks(THREE,made,card,rules).checks.map(c=>[c.id,c]));
 for(const id of ['build','floor','size','budget','collider','seats','room'])assert.equal(r[id].ok,true,`${id}: ${r[id].detail}`);
 assert.match(r.size.detail,/below the knee of a 1.6 m resident/);
 assert.equal(assetFileName({id:'crate',version:3},'stl'),'crate.v3.stl');
 const ready=prepareForExport(root,'Crate');assert.deepEqual(ready.userData,{asset:'Crate'});
 assert.throws(()=>glbJson(new Uint8Array(24)),/Not a binary glTF/);
});

test('every prop in the registry names a builder World exports, a kind, its size and a purpose',async()=>{
 const ids=new Set();
 for(const e of PROP_REGISTRY){
  assert.ok(!ids.has(e.id),e.id);ids.add(e.id);assert.match(e.id,/^[a-z0-9][a-z0-9-]{1,47}$/);
  assert.ok(Object.hasOwn(rules.kinds,e.kind),e.id);assert.equal(e.size.length,3);assert.ok(Math.max(...e.size)<=rules.kinds[e.kind].max,e.id);
  const [file,fn]=e.source.split(' '),code=await readFile(new URL('src/'+file,town),'utf8');
  assert.match(code,new RegExp(`export function ${fn.replace(/\(.*$/,'')}\\(`),e.source);
  const p=await propPurpose(e.id);
  for(const k of ['for','why','where'])assert.ok(p[k].split(/\s+/).length>=rules.purposeWords,`${e.id} ${k}`);
  assert.deepEqual(brandHits([e.name,p.for,p.why,p.where,...e.tags].join(' '),rules,['orion']),[],e.id);
  assert.ok(!catalogIds().includes(e.id),`${e.id} is also a catalogue id`);
 }
});
