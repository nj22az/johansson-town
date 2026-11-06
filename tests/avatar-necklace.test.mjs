import test from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,bodyVolume,measure,necklaceShape,NECKLACE} from '../src/avatars/build.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {normalizeRecipe,PARTS} from '../src/avatars/recipe.js';
installDOM();

const wearing=(top,extra={})=>normalizeRecipe({...CAST_RECIPES.Thuan,outfit:{...CAST_RECIPES.Thuan.outfit,top,pattern:'none'},...extra});
const points=shape=>shape.strands.flatMap(s=>s.points);

test('a pendant comes out from under a blouse collar: no band round the neck, nothing over the collar',()=>{
 // (Her 10 October look, a blouse with a pendant; her own design since 18 October wears a polo without one.)
 const r=wearing('blouse',{accessories:{...CAST_RECIPES.Thuan.accessories,neckwear:'pendant'}}),m=measure(r),shape=necklaceShape(r,m);
 assert.equal(r.outfit.top,'blouse');assert.equal(r.accessories.neckwear,'pendant');
 assert.equal(shape.strands.length,2,'two short drops, the rest of the chain under the collar');
 // The rounded collar's two halves meet at the front down to t = 1 - (1 - 0.88) * 1.2 (garment.js collar, drop .88).
 const collarFoot=1-(1-.88)*1.2;
 for(const p of points(shape)){
  const t=(p.y-m.hipY)/m.torso;
  assert.ok(t<=collarFoot,'the chain shows only below the collar: '+t.toFixed(3));
  assert.ok(p.z>0,'only at the front');
 }
 // Each drop starts in the narrow gap where the collar's halves meet and ends at the pendant, which hangs below it.
 for(const {points:[a,...rest]} of shape.strands){assert.ok(Math.abs(a.x)<=NECKLACE.under.blouse[0]*m.k+1e-3);assert.ok(Math.abs(rest.at(-1).x)<2e-3);}
 const lowest=Math.min(...points(shape).map(p=>p.y));
 assert.ok(shape.pendant.at.y<lowest,'the pendant hangs from the chain, below it');
});

test('on every top the necklace rests on the body (never inside it, never in the air) or is hidden under the collar or tie',()=>{
 for(const top of PARTS.top){
  const r=wearing(top),m=measure(r),shape=necklaceShape(r,m);
  if(NECKLACE.hidden.includes(top)){assert.equal(shape,null,top+' hides it');continue;}
  const vol=bodyVolume(r,m),rest=(NECKLACE.gap+NECKLACE.radius)*m.k;
  for(const p of points(shape)){
   const d=vol.sdf(p);
   assert.ok(d>shape.radius*.5&&d<rest+.004*m.k,top+': the chain rests on the body ('+(d*1000).toFixed(1)+' mm)');
   assert.ok(p.y<m.neckY+.012*m.k,top+': nothing stands up round the neck');
  }
  const d=vol.sdf(shape.pendant.at);assert.ok(d>0&&d<shape.pendant.size,top+': the pendant lies on the chest');
  assert.ok(shape.pendant.at.z>0&&Math.abs(shape.pendant.at.x)<1e-3,top+': the pendant hangs at the front, in the middle');
  const under=NECKLACE.under[top];
  // (The chain's middle rests a few millimetres off the sloping chest, so it stands a hair higher than where it was laid.)
  if(under)for(const p of points(shape))assert.ok((p.y-m.hipY)/m.torso<=under[1]+(NECKLACE.gap+NECKLACE.radius)*m.k/m.torso,top+': below where the collar meets');
  else{
   // An open neck: the whole chain shows, round the back of the neck and down to its lowest point at the front.
   assert.equal(shape.strands.length,1);assert.equal(shape.strands[0].closed,true);
   const ps=points(shape),low=ps.reduce((a,b)=>b.y<a.y?b:a);
   assert.ok(Math.min(...ps.map(p=>p.z))<0,top+': round the back of the neck');
   assert.ok(low.z>0&&Math.abs(low.x)<.01*m.k,top+': lowest at the front, in the middle');
  }
 }
});

test('the necklace is sized to the body, child to grown-up, and stays one part of the two-draw avatar',()=>{
 const adult=necklaceShape(wearing('tee')),child=necklaceShape(wearing('tee',{age:'child'}));
 const ka=measure(wearing('tee')).k,kc=measure(wearing('tee',{age:'child'})).k;
 assert.ok(Math.abs(child.radius/adult.radius-kc/ka)<1e-9);assert.ok(Math.abs(child.pendant.size/adult.pendant.size-kc/ka)<1e-9);
 for(const top of ['blouse','tee','police']){
  const a=buildAvatar(wearing(top),{shadows:false,faceSize:64});
  // The rigged eyes (eyes3d.js) are a draw of their own, on for everyone since the owner's word of 25 October 2026 ("I think
  // it looks better already": commit 4ad3b4e6, briefs/HANDOFF-AVATAR-EYES-2026-10-25.md); tests/eyes3d.test.mjs holds both
  // eyes to one draw. The body and the head are still the two draws counted here.
  let draws=0;a.root.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.outline&&!/Glasses|Sculpted/.test(o.name)&&o!==a.eyes3d?.mesh)draws++;});
  assert.equal(draws,2,top);for(const v of a.body.geometry.attributes.position.array)assert.ok(Number.isFinite(v));a.dispose();
 }
});
