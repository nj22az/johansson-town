import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {installDOM} from './fixtures.mjs';

/**
 * Sakura's customer restroom (the owner, 26 November 2026): "The toilet and faucet needs to be more realistic can you
 * draw it in cad then redraw it in blender? And the door should be closed by default"; "make the room more cute,
 * remember a Japanese cute girl has decorated it"; "Add cute stickers on the wall and floor, maybe use stickers from
 * pocket camera to keep consistency". Drawing SK-401 (art/sakura-restroom/).
 */
installDOM();globalThis.self=globalThis;
const THREE=await import('../vendor/three.module.js');
const {RESTROOM,RESTROOM_FIXTURES,RESTROOM_DOOR,restroomDoorSwing,RESTROOM_SLIPPERS,RESTROOM_DECOR,RESTROOM_STICKERS,buildSakuraRestroom}=await import('../src/world/interiors/sakura-restroom.js');
const {SAKURA_LAYOUT}=await import('../src/world/interiors/sakura-layout.js');
const {buildSakuraShell}=await import('../src/world/interiors/sakura-shell.js');
const root=new URL('../',import.meta.url);
const file=p=>new URL(p,root);

/** The model's JSON chunk, and each node's box in its fixture's frame (metres), read straight from the GLB. */
function readGLB(path){
 const b=readFileSync(file(path)),len=b.readUInt32LE(12),json=JSON.parse(b.subarray(20,20+len).toString());
 const nodes=new Map(json.nodes.map((n,i)=>[n.name,{...n,i}]));
 const tri=m=>m.primitives.reduce((s,p)=>s+json.accessors[p.indices].count/3,0);
 const box=name=>{const lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
  const walk=(n,off)=>{const t=n.translation||[0,0,0],o=off.map((v,i)=>v+t[i]);
   if(n.mesh!==undefined)for(const p of json.meshes[n.mesh].primitives){const a=json.accessors[p.attributes.POSITION];for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],a.min[i]+o[i]);hi[i]=Math.max(hi[i],a.max[i]+o[i]);}}
   for(const c of n.children||[])walk(json.nodes[c],o);};
  walk(nodes.get(name),[0,0,0]);return {lo,hi};};
 return {json,nodes,triangles:json.meshes.reduce((s,m)=>s+tri(m),0),box,materials:json.materials.map(m=>m.name)};
}

test('the sanitary ware is the drawn model: CAD solids, redrawn in Blender, with the parts that move',()=>{
 const spec=JSON.parse(readFileSync(file('art/sakura-restroom/spec.json'),'utf8')),parts=JSON.parse(readFileSync(file('art/sakura-restroom/cad/parts.json'),'utf8'));
 assert.equal(spec.drawing,RESTROOM_FIXTURES.drawing);assert.equal(parts.interference,'none over 1 mm³');
 for(const f of ['art/sakura-restroom/cad/toilet.step','art/sakura-restroom/cad/washbasin.step','art/sakura-restroom/cad/SK-401-sanitary-ware.svg','art/sakura-restroom/cad/SK-401-sanitary-ware.dxf','art/sakura-restroom/sakura-restroom-fixtures.blend'])assert.ok(existsSync(file(f)),f);
 const glb=readGLB('assets/'+RESTROOM_FIXTURES.model);
 for(const name of ['Toilet','Washbasin','Bowl','Seat','ToiletLid','Tank','TankLid','Water','ToiletChrome','FlushLever','Basin','Pedestal','BasinChrome','TapHandle'])assert.ok(glb.nodes.has(name),name);
 for(const m of ['Porcelain','Chrome','CoverPink','Water','IndexBlue'])assert.ok(glb.materials.includes(m),m);
 assert.ok(glb.triangles>12000&&glb.triangles<22000,`a phone's budget: ${glb.triangles} triangles`);
 // The lever turns about its own spindle on the tank's side; the tap's head about its own stem.
 const lever=glb.nodes.get('FlushLever').translation,T=spec.toilet;
 assert.deepEqual(lever.map(v=>+v.toFixed(3)),[-T.lever.pivot[0]/1000,T.lever.pivot[2]/1000,T.lever.pivot[1]/1000]);
 assert.ok(glb.nodes.get('TapHandle').translation[1]>.9);
});

test('the fixtures are a real toilet and basin in size, and stand inside their colliders and the room',()=>{
 const glb=readGLB('assets/'+RESTROOM_FIXTURES.model),F=RESTROOM_FIXTURES;
 const t=glb.box('Toilet'),b=glb.box('Washbasin'),size=x=>x.hi.map((v,i)=>+(v-x.lo[i]).toFixed(3));
 // Fixture frame: x across, y up, z out from the wall.
 const [tw,th,td]=size(t),[bw,bh,bd]=size(b);
 assert.ok(tw>.4&&tw<.48&&td>.74&&td<.78&&th>.93&&th<1.0,`toilet ${tw} x ${td} x ${th}`);
 assert.ok(Math.abs(bw-.5)<.005&&Math.abs(bd-.43)<.005&&bh>.94&&bh<.98,`basin ${bw} x ${bd} x ${bh}`);
 assert.ok(Math.abs(t.lo[1])<.001&&Math.abs(b.lo[1])<.001&&t.lo[2]>=-.0001&&b.lo[2]>=-.0001,'on the floor, in front of the wall');
 const rects=SAKURA_LAYOUT.colliders,inside=(x0,x1,z0,z1)=>rects.some(r=>{const w=r.w??r.width,d=r.d??r.depth,x=r.x,z=r.z;return x-w/2<=x0+.07&&x+w/2>=x1-.07&&z-d/2<=z0+.07&&z+d/2>=z1-.07;});
 // The toilet faces +x: its depth runs along x, its width along z.
 assert.ok(inside(F.toilet.x,F.toilet.x+td,F.toilet.z-tw/2,F.toilet.z+tw/2),'the toilet has a collider');
 assert.ok(inside(F.washbasin.x-bw/2,F.washbasin.x+bw/2,F.washbasin.z,F.washbasin.z+bd),'the basin has a collider');
 assert.ok(F.toilet.x+td<RESTROOM.maxX&&F.washbasin.x+bw/2<RESTROOM.maxX&&F.washbasin.z+bd<RESTROOM.maxZ);
 assert.ok(F.washbasin.height<RESTROOM.mirror.y-.37,'the tap is under the glass shelf');
});

test('without the model there are plain stand-ins, never an empty room; the shell no longer draws a box toilet',async()=>{
 const room=new THREE.Group(),restroom=buildSakuraRestroom(room,{});
 assert.equal(await restroom.ready,false);
 assert.ok(room.getObjectByName('Restroom plain fixtures'));assert.ok(room.getObjectByName('Plain toilet bowl'));
 const shell=buildSakuraShell();
 assert.equal(shell.getObjectByName('sakura-toilet'),undefined);
});

test('the door is shut until somebody comes to it, opens into the room and shuts behind them',()=>{
 const room=new THREE.Group(),{door}=buildSakuraRestroom(room,{}),D=RESTROOM_DOOR;
 assert.equal(door.angle,D.closed);assert.equal(door.pivot.rotation.y,D.closed);
 const run=(points,seconds=3)=>{for(let i=0;i<seconds*30;i++)door.update(1/30,points);};
 // Shut, the leaf fills the doorway in the east wall (z -3.66..-2.78), inside the wall's thickness (x -4.08..-3.96).
 door.pivot.updateMatrixWorld(true);
 const leaf=new THREE.Box3().setFromObject(room.getObjectByName('Sakura restroom door leaf'));
 assert.ok(leaf.min.x>-4.08&&leaf.max.x<-3.96,'in the wall');assert.ok(leaf.min.z>-3.66&&leaf.max.z<-2.78&&leaf.max.z-leaf.min.z>.86,'fills the doorway');
 assert.ok(leaf.max.y<2.2&&leaf.max.y>2.18&&leaf.min.y>0,'under the head, off the floor');
 run([[2.2,1.2]]);assert.equal(door.angle,D.closed,'a customer at the till does not open it');
 run([[-3.3,-3.2]]);assert.equal(door.angle,D.open,'open for somebody at the door');assert.equal(door.occupied,false);
 door.pivot.updateMatrixWorld(true);
 const open=new THREE.Box3().setFromObject(room.getObjectByName('Sakura restroom door leaf'));
 assert.ok(open.max.z<=-2.78&&open.min.z>RESTROOM.minZ&&open.max.x<=-4.07,'it stands open inside the room, clear of the jamb');
 run([[-5.75,-3.25]]);assert.equal(door.angle,D.closed,'shut behind somebody at the toilet');assert.equal(door.occupied,true,'and it says so');
 run([]);assert.equal(door.occupied,false);
});

test('nothing that stands on the floor is in the door\'s swing',()=>{
 const S=restroomDoorSwing,clear=(x,z)=>Math.hypot(x-S.x,z-S.z)>S.radius+.01;
 const P=RESTROOM_SLIPPERS;
 for(const dx of [-P.length/2,P.length/2])for(const dz of [-.12,.12])assert.ok(clear(P.x+dx,P.z+dz),'slippers');
 const F=RESTROOM_FIXTURES;
 for(const x of [F.washbasin.x-.25,F.washbasin.x+.25])for(const z of [F.washbasin.z,F.washbasin.z+.43])assert.ok(clear(x,z),'basin');
 const mat=RESTROOM_DECOR.find(d=>d.id==='mat');assert.ok(clear(mat.x1,mat.z-mat.halfWidth)&&clear(mat.x1,mat.z+mat.halfWidth),'mat');
});

test('Thuan\'s room: every piece has who and why, the mat is cut round the foot, the stickers are the Pocket Camera\'s Friends',()=>{
 for(const d of [...RESTROOM_DECOR,...RESTROOM_STICKERS])assert.ok(d.who==='Thuan'&&d.why.length>30&&d.what,d.id);
 assert.ok(RESTROOM_DECOR.some(d=>d.id==='covers')&&RESTROOM_DECOR.some(d=>d.id==='mat'));
 assert.ok(RESTROOM_STICKERS.some(s=>s.on==='floor')&&RESTROOM_STICKERS.some(s=>['west','north','south'].includes(s.on)),'on the wall and on the floor');
 const R=RESTROOM,room=new THREE.Group();buildSakuraRestroom(room,{});room.updateMatrixWorld(true);
 for(const s of RESTROOM_STICKERS){
  const png=readFileSync(file(`assets/graphics/sakura-restroom/stickers/${s.id}.webp`));assert.equal(png.subarray(8,12).toString(),'WEBP',s.id);
  const m=room.getObjectByName('Restroom sticker '+s.id);assert.ok(m,s.id);
  const b=new THREE.Box3().setFromObject(m);
  if(s.on!=='door')assert.ok(b.min.x>=R.minX&&b.max.x<=R.maxX&&b.min.z>=R.minZ&&b.max.z<=R.maxZ,s.id+' is in the room');
  if(['west','north','south'].includes(s.on))assert.ok(b.max.y<1.35,s.id+' is on the tiles');
  if(s.on==='floor')assert.ok(b.max.y<.01,s.id+' is on the floor');
 }
 // The camera's own sheet, when the Office site is beside the Town.
 const sheet=new URL('../../nj22az.github.io/camera/stickers/cute.json',import.meta.url);
 if(existsSync(sheet)){const ids=JSON.parse(readFileSync(sheet,'utf8')).stickers.map(s=>s.id);for(const s of RESTROOM_STICKERS)assert.ok(ids.includes('cute/'+s.id),s.id);}
});
