import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {normalizeRecipe,DEFAULT_RECIPE,PARTS,AGES} from '../src/avatars/recipe.js';
import {recipeFor} from '../src/avatars/cast.js';
import {buildAvatar,buildHatProp,measure,BONES} from '../src/avatars/build.js';
import {ASSET_HATS,readHatGlb,provideHatModel,hatModelLoaded,hatTuck,bandHeight,assetHatPieces} from '../src/avatars/hat-assets.js';
import {entryFor,ISLAND_HEX} from '../src/avatars/wardrobe-catalogue.js';
import {catalogCard} from '../src/catalog/catalog.js';
import {JOHANSSON_TRUCKER} from '../src/commerce/sakura-caps.js';
import {SUPPLIERS} from '../src/commerce/merchandising.js';
import {SAKURA_LAYOUT} from '../src/world/interiors/sakura-layout.js';
import {shapeHeadPoint} from '../src/avatars/head-profile.js';

installDOM();
const glb=await readFile(new URL('../assets/catalog/johansson-trucker/model.glb',import.meta.url));
// Who lives here: the cast (src/people/cast.js), the one list of the island's people.
const {CAST_NAMES}=await import('../src/people/cast.js');const residents=new Set(CAST_NAMES);
const HEAD=BONES.indexOf('head');
const wearing=(r,hat='trucker',hatColour='#27304d',accent='#f4f1ea')=>normalizeRecipe({...r,outfit:{...(r.outfit||DEFAULT_RECIPE.outfit),hat,hatColour,accent}});
/** The hat's range of a body: its vertices, as built (bind pose), and their skinning. */
function hatRange(avatar){
 const g=avatar.body.geometry,full=g.attributes.position.count;
 avatar.setHat(false);const start=g.drawRange.count;avatar.setHat(true);
 return {g,start,count:full-start};
}

test('the cap is World’s catalogue asset: a real GLB, its card, its fit, within a phone’s budget',()=>{
 const card=catalogCard('johansson-trucker');
 assert.equal(card.kind,'prop');assert.ok(card.measured.triangles<=3000&&card.measured.materials<=4,'a few thousand triangles, four materials, one small texture');
 const model=readHatGlb(glb);
 assert.deepEqual([...new Set(model.meshes.map(m=>m.material))].sort(),['accent','front','mesh','trim']);
 assert.deepEqual(model.wear.tint,{front:'hatColour',mesh:'accent',accent:'accent'});assert.deepEqual(model.wear.seeThrough,['mesh']);
 assert.ok(model.meshes.find(m=>m.material==='mesh').uv,'the mesh carries the knit’s coordinates');
 // The head it was built on is the town's default adult, as the card's anchors say.
 const m=measure(DEFAULT_RECIPE),[sx,sy,sz]=model.wear.head.radii;
 assert.ok(Math.abs(sx-m.Rh*m.headSX)<1e-4&&Math.abs(sy-m.Rh*m.headSY)<1e-4&&Math.abs(sz-m.Rh*.98)<1e-4);
 assert.ok(Math.abs(card.anchors['head-top'][1]-card.anchors['head-centre'][1]-sy)<2e-4);
 assert.equal(ASSET_HATS.trucker.asset,card.id);
 // A trucker's crown stands up off the head: the front's top is well above the head's (a baseball cap's is not).
 assert.ok(card.anchors['crown-top'][1]-card.anchors['head-centre'][1]>1.15*sy);
});

test('old recipes do not change: the cap is a new id, and a procedural cap is built as before',()=>{
 // Appended after the older hats (later hats, such as the hair clip, come after it), so no saved id moves.
 assert.equal(PARTS.hat.indexOf('trucker'),PARTS.hat.indexOf('mountain')+1,'appended, so no saved id moves');
 assert.equal(normalizeRecipe({outfit:{hat:'cap'}}).outfit.hat,'cap');
 const before=buildAvatar(wearing(recipeFor('Kōji'),'cap'),{shadows:false}),a=before.body.geometry.attributes.position.array.slice();before.dispose();
 // Until its model is in hand the trucker is worn as its stand-in, never as a bare head.
 assert.equal(hatModelLoaded('trucker'),false);
 const standIn=buildAvatar(wearing(recipeFor('Kōji')),{shadows:false});
 assert.equal(standIn.body.geometry.attributes.position.count,a.length/3,'the stand-in is the procedural cap');standIn.dispose();
 provideHatModel('johansson-trucker',glb);
 const after=buildAvatar(wearing(recipeFor('Kōji'),'cap'),{shadows:false});
 assert.deepEqual(after.body.geometry.attributes.position.array,a,'a cap recipe is drawn exactly as before');after.dispose();
});

test('worn, it is the model: bound to the head bone, the front in hatColour, the mesh and J in the accent, the mesh see-through',()=>{
 provideHatModel('johansson-trucker',glb);
 const r=wearing(recipeFor('Kōji'),'trucker','#2f4f8e','#f4f1ea'),a=buildAvatar(r,{shadows:false}),{g,start,count}=hatRange(a);
 const model=readHatGlb(glb),solid=model.meshes.filter(x=>x.material!=='mesh').reduce((n,x)=>n+x.index.length/3,0),clear=model.meshes.filter(x=>x.material==='mesh').reduce((n,x)=>n+x.index.length/3,0);
 assert.equal(count,solid*3,'every solid triangle of the model, and nothing else, is the hat range of the body');
 const S=g.attributes.skinIndex,W=g.attributes.skinWeight,C=g.attributes.color;
 for(let i=start;i<start+count;i++){assert.equal(S.getX(i),HEAD);assert.equal(W.getX(i),1);}
 const colours=new Set();for(let i=start;i<start+count;i++)colours.add(new THREE.Color(C.getX(i),C.getY(i),C.getZ(i)).getHexString());
 assert.ok(colours.has(new THREE.Color('#2f4f8e').getHexString()),'the front in hatColour');
 assert.ok(colours.has(new THREE.Color('#f4f1ea').getHexString()),'the undervisor, rope and J in the accent');
 assert.ok(colours.has(new THREE.Color('#c9a54a').getHexString()),'the gold outline');
 // The mesh is the hat's see-through layer: on the body's skeleton, bound to the head, transparent, hidden with the hat
 // and with the body (swimwear).
 const layer=a.body.children.find(o=>o.userData.hatLayer);
 assert.ok(layer?.isSkinnedMesh&&layer.skeleton===a.body.skeleton);
 assert.equal(layer.geometry.attributes.position.count,clear*3);
 assert.ok(layer.material.transparent&&!layer.material.depthWrite);
 const LS=layer.geometry.attributes.skinIndex;for(let i=0;i<LS.count;i++)assert.equal(LS.getX(i),HEAD);
 a.setHat(false);assert.equal(a.hatOn,false);assert.equal(layer.visible,false);a.setHat(true);assert.equal(a.hatOn,true);assert.equal(layer.visible,true);
 a.wear('swim');assert.equal(a.body.visible,false,'the mesh goes with the body it hangs on');a.wear('clothes');
 a.dispose();
 const prop=buildHatProp(r,{mode:'stand'});assert.equal(prop.geometry.attributes.position.count,solid*3,'the hat on its own is the same model');
 assert.equal(prop.children.filter(o=>o.userData.hatLayer).length,1,'with its mesh');prop.geometry.dispose();prop.children[0].userData.dispose();
});

test('it fits every head: on the head, ears below the band, the hair pressed in under it, nothing through it',()=>{
 provideHatModel('johansson-trucker',glb);
 const model=readHatGlb(glb),wear=model.wear,unit=new THREE.Vector3();
 const heads=[];
 for(const age of AGES)for(const proportion of ['classic','rounded'])for(const size of [0,.5,1])for(const form of ['oval','narrow','wide','heart'])
  heads.push({...DEFAULT_RECIPE,age,body:{...DEFAULT_RECIPE.body,proportion},head:{...DEFAULT_RECIPE.head,size,form}});
 for(const base of heads){
  const r=wearing(base),m=measure(r),S=[m.headSX*m.Rh,m.headSY*m.Rh,m.Rh*.98];
  const pieces=assetHatPieces(r,m);assert.ok(pieces?.length);
  // The sweatband sits on the head: no point of the cap is inside the head (its surface along that direction, shaped by
  // the head's profile as the cap is), and the band's inside is within 7% of it at the front, on the forehead.
  let inner=Infinity;const dir=new THREE.Vector3();
  for(const p of pieces){const P=p.geometry.attributes.position;for(let i=0;i<P.count;i++){
   unit.set(P.getX(i)/S[0],(P.getY(i)-m.headCentre)/S[1],P.getZ(i)/S[2]);dir.copy(unit).normalize();shapeHeadPoint(dir,m.profile);
   inner=Math.min(inner,unit.length()/dir.length());}p.geometry.dispose();}
  assert.ok(inner>1.0,`${base.age} ${base.head.form} ${base.head.size}: nothing inside the head (${inner.toFixed(3)})`);
  assert.ok(inner<1.07,`${base.age} ${base.head.form}: the band sits on the head, no gap (${inner.toFixed(3)})`);
 }
 // Ears below the band (build.js ears): an ear's top is 0.12 head radii above the centre, behind the side (azimuth 93°);
 // the braids' larger ears 0.195, a little ahead of it (85°).
 assert.ok(bandHeight(wear,93*Math.PI/180)>.12+.06,'the band clears the ears');
 assert.ok(bandHeight(wear,85*Math.PI/180)>.195+.04,'and the braids’ larger ears');
 assert.ok(bandHeight(wear,0)>.35,'the forehead and the brows show under the band');
});

test('the hair goes under the cap for every style, and out of the snapback’s opening above the strap',()=>{
 provideHatModel('johansson-trucker',glb);
 for(const style of PARTS.hair){
  const r=wearing({...DEFAULT_RECIPE,hair:{...DEFAULT_RECIPE.hair,style}}),m=measure(r),S=[m.headSX*m.Rh,m.headSY*m.Rh,m.Rh*.98];
  const tuck=hatTuck(r),a=buildAvatar(r,{shadows:false}),{g,start}=hatRange(a),P=g.attributes.position,S0=g.attributes.skinIndex;
  // Every hair vertex above the band (outside the opening) is inside the sweatband: tuck(…, far) is the limit there.
  for(let i=0;i<start;i++){
   if(S0.getX(i)!==HEAD)continue;
   const x=P.getX(i)/S[0],y=(P.getY(i)-m.headCentre)/S[1],z=P.getZ(i)/S[2],rr=Math.hypot(x,y,z);
   assert.ok(rr<=tuck(x,y,z,10)+1e-4,`${style}: hair at (${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}) r ${rr.toFixed(3)} is under the cap`);
  }
  a.dispose();
 }
 const r=wearing(DEFAULT_RECIPE),tuck=hatTuck(r);
 assert.equal(tuck(0,.25,-1.1,1.13),1.13,'above the strap, in the opening, the hair is left out');
 assert.ok(tuck(0,.12,-1.1,1.11)<1.07,'behind the strap it is pressed in');
 assert.ok(tuck(.8,.6,.2,1.1)<1.07,'under the crown it is pressed in');
});

test('it is in the wardrobe: a label, who wears it and why, colourways that set the front and the mesh',()=>{
 const e=entryFor('hat','trucker');
 assert.equal(e.label,'Johansson trucker');assert.ok(e.supplier.includes('Sakura'));
 assert.deepEqual(e.colourways.map(w=>[w.colours['outfit.hatColour'],w.colours['outfit.accent']]),JOHANSSON_TRUCKER.colourways.map(w=>[w.hatColour,w.accent]));
 for(const w of e.colourways)for(const v of Object.values(w.colours))assert.ok(ISLAND_HEX.has(v));
});

test('Sakura stocks it: a 1997 price, real buyers and reasons, its supplier and maker, a stand out of everyone’s way',()=>{
 const c=JOHANSSON_TRUCKER;
 assert.ok(Number.isInteger(c.price)&&c.price>=10&&c.price<=5000,'whole yen, within a konbini’s range');
 assert.ok(c.purpose.for.length&&c.purpose.for.every(n=>residents.has(n)),'bought by people who live here: '+c.purpose.for.join(', '));
 assert.ok(c.purpose.why.length>40&&c.purpose.placed.length>40);
 assert.ok(SUPPLIERS[c.supplier],'Sakura Trading supplies it');assert.match(c.maker.name,/^Johansson /,'a Johansson company makes it');
 assert.equal(catalogCard(c.asset).id,c.asset);assert.ok(PARTS.hat.includes(c.hat));
 // The stand shows the same cap at the shop display's level of detail: the same frame and head, a third of the triangles.
 const shown=catalogCard(c.displayAsset),worn=catalogCard(c.asset);
 assert.ok(shown.measured.triangles*2<=worn.measured.triangles,'the display copy is light: '+shown.measured.triangles);
 assert.deepEqual(shown.anchors['head-centre'],worn.anchors['head-centre']);assert.deepEqual(shown.colours,worn.colours);
 assert.ok(Math.abs(shown.measured.size[0]-worn.measured.size[0])<.01&&Math.abs(shown.measured.size[2]-worn.measured.size[2])<.01,'the same cap');
 assert.ok(c.colourways.every(w=>ISLAND_HEX.has(w.hatColour)&&ISLAND_HEX.has(w.accent))&&c.stock.flatMap(s=>s.caps).every(n=>c.colourways.some(w=>w.name===n)));
 assert.ok(c.price>1800&&c.priceWhy.includes('1997'),'a premium cap, priced with its reasons');
 // The stand's box is in the shop's colliders, overlaps no other fitting, and leaves the walk to the counter 0.9 m.
 const box=c.stand.collider,mine=SAKURA_LAYOUT.colliders.filter(o=>o.x===box.x&&o.z===box.z&&o.w===box.w);
 assert.equal(mine.length,1);
 const overlap=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.z-b.z)<(a.d+b.d)/2;
 for(const o of SAKURA_LAYOUT.colliders)if(o!==mine[0])assert.ok(!overlap(o,box),'clear of '+JSON.stringify(o));
 const counter=SAKURA_LAYOUT.colliders.find(o=>o.x===4.8&&o.z===1.97);
 assert.ok(counter.x-counter.w/2-(box.x+box.w/2)>=.9,'0.9 m to the counter');
 for(const g of SAKURA_LAYOUT.guestStands)assert.ok(Math.hypot(Math.max(0,Math.abs(g[0]-box.x)-box.w/2),Math.max(0,Math.abs(g[2]-box.z)-box.d/2))>=.35,'the evening guests have room');
 // The card is Japanese, the words a player reads are English.
 assert.match(c.jp.brand+c.jp.line,/[゠-ヿ]/);assert.doesNotMatch(c.name,/[぀-ヿ一-鿿]/);
});
