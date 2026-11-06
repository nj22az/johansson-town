// Johansson Studio's Lathe maker (src/studio/makers/lathe.js): a design is its parameters, and the same parameters
// build the same mesh every time; every preset fits its kind's phone budget once its smoothness is capped; shapes
// with a wall or closed ends are watertight for printing and say so when they are not; a lit lamp glows the way World's
// lanterns do; the colours are World's.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {LATHE_FAMILIES,LATHE_PALETTE,latheParamsFor,latheKind,normalizeLathe,latheBody,latheTriangles,capDetail,buildLathe,profileCurve} from '../src/studio/makers/lathe.js';
import {trianglesOf,meshReport} from '../src/studio/modeller/stl.js';
import {madeFromObject} from '../src/studio/modeller/made.js';
import {runChecks} from '../src/studio/modeller/checks.js';
import {sha256} from '../src/studio/sha256.js';

const rules=JSON.parse(await readFile(new URL('../src/studio/modeller/rules.json',import.meta.url),'utf8'));
const presets=Object.entries(LATHE_FAMILIES).flatMap(([family,F])=>F.presets.map(p=>({family,preset:p.id,kind:latheKind(family,p.id)})));

test('six families, three presets each, and every colour is one World already uses',()=>{
 assert.deepEqual(Object.keys(LATHE_FAMILIES),['chochin','andon','vase','bottle','bucket','tub']);
 for(const F of Object.values(LATHE_FAMILIES))assert.equal(F.presets.length,3);
 for(const c of LATHE_PALETTE){assert.match(c.hex,/^#[0-9a-f]{6}$/);assert.match(c.from,/\.js/);}
 for(const {family,preset} of presets){const p=latheParamsFor(family,preset);for(const k of ['body','trim'])assert.ok(LATHE_PALETTE.some(c=>c.hex===p.colours[k]),`${family}/${preset} ${k} ${p.colours[k]}`);}
});

test('a design is data: the same parameters always build the same mesh, and a design survives JSON',()=>{
 for(const {family,preset} of presets){
  const p=latheParamsFor(family,preset),again=normalizeLathe(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(again,p);
  const a=latheBody(p),b=latheBody(again);assert.equal(sha256(new Uint8Array(a.positions.buffer)),sha256(new Uint8Array(b.positions.buffer)));
 }
 assert.deepEqual(normalizeLathe({family:'nonsense',height:-4,ribs:{count:900}}).family,'chochin');
 assert.equal(normalizeLathe({height:99}).height,3);
});

test('the profile curve passes through its points and never overshoots them',()=>{
 const pts=[[0,.1],[.3,.2],[.6,.05],[1,.08]],f=profileCurve(pts);
 for(const [v,r] of pts)assert.ok(Math.abs(f(v)-r)<1e-9);
 for(let v=0;v<=1;v+=.01)assert.ok(f(v)>=.05-1e-9&&f(v)<=.2+1e-9,`${v}: ${f(v)}`);
});

test('every preset, its smoothness capped by the phone budget, fits its kind and passes the model checks',()=>{
 for(const {family,preset,kind} of presets){
  const budget=rules.kinds[kind].triangles,cap=capDetail(latheParamsFor(family,preset),budget),p={...latheParamsFor(family,preset),detail:cap.detail};
  assert.ok(cap.triangles<=budget,`${family}/${preset}: ${cap.triangles} > ${budget}`);assert.equal(latheTriangles(p),cap.triangles);
  const root=buildLathe(p,{name:'Test'}),made=madeFromObject(THREE,root,{anchors:root.userData.anchors});
  const box=new THREE.Box3();for(const x of made.pieces)box.union(x.box);
  const card={kind,size:[box.max.x-box.min.x,box.max.y-box.min.y,box.max.z-box.min.z],budget:{triangles:budget,materials:rules.kinds[kind].materials},colliders:'auto',seats:[],spots:[],keepClear:[]};
  const failed=runChecks(THREE,made,card,rules).checks.filter(c=>!c.ok);
  assert.deepEqual(failed.map(c=>`${c.id}: ${c.detail}`),[],`${family}/${preset}`);
  assert.ok(Math.abs(box.min.y)<1e-9,'its foot is on the floor');
 }
});

test('closed shapes and shapes with a wall are watertight; a paper lantern is an open sheet and says so',()=>{
 const report=p=>meshReport(trianglesOf(THREE,buildLathe(p)));
 for(const [family,preset] of [['vase','ikebana'],['vase','fluted'],['vase','twisted'],['bottle','can'],['bottle','isshobin'],['bucket','tin'],['bucket','oke'],['tub','wash'],['tub','half']]){
  const r=report(latheParamsFor(family,preset));assert.equal(r.watertight,true,`${family}/${preset}`);assert.ok(r.volume>0,'faces out');
 }
 const paper=report(latheParamsFor('chochin','festival'));assert.equal(paper.watertight,false);assert.ok(paper.openEdges>0);
 const thick=report({...latheParamsFor('chochin','festival'),wall:.002});assert.equal(thick.watertight,true,'given a wall, the lantern prints');
 for(const sides of [0,4,6,8])for(const bottom of ['open','closed'])for(const top of ['open','closed']){
  const r=report({...latheParamsFor('vase','fluted'),sides,bottom,top,wall:.003,twist:45});assert.equal(r.watertight,true,`${sides} ${bottom} ${top}`);
 }
});

test('the 350 ml can measures 66 × 122 mm, and an andon is square with flat sides',()=>{
 const can=new THREE.Box3().setFromObject(buildLathe(latheParamsFor('bottle','can')));
 assert.deepEqual([can.max.x-can.min.x,can.max.y-can.min.y].map(v=>Math.round(v*1000)),[66,122]);
 const a=latheBody(latheParamsFor('andon','bandai')),xs=[];for(let i=0;i<a.positions.length;i+=3)if(a.positions[i+1]>.1&&a.positions[i+1]<.2)xs.push(Math.abs(a.positions[i+2]));
 assert.ok(Math.abs(Math.max(...xs)-.08)<1e-6,'its paper is 16 cm across, as the bandai andon in onsen-lobby.js');
});

test('a lit lamp glows as World lights its lanterns: unlit paper brightest at its middle, and a halo',()=>{
 const lit=buildLathe(latheParamsFor('chochin','akachochin')),paper=lit.getObjectByName('Lantern paper').children[0];
 assert.ok(paper.material.isMeshBasicMaterial&&paper.material.vertexColors);
 let halo=null;lit.traverse(o=>{if(o.userData.glowHalo)halo=o;});assert.ok(halo?.isSprite);
 const dark=buildLathe({...latheParamsFor('chochin','akachochin'),glow:0});let dh=null;dark.traverse(o=>{if(o.userData.glowHalo)dh=o;});
 assert.equal(dh,null);assert.ok(dark.getObjectByName('Lantern paper').children[0].material.isMeshStandardMaterial);
 assert.deepEqual(lit.userData.anchors.hang,[0,.5,0]);
 assert.deepEqual(madeFromObject(THREE,lit).parts.map(p=>[p.name,p.role]),[['Lantern paper','lamp'],['Rims','decoration']]);
});
