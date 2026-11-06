import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {normalizeRecipe} from '../src/avatars/recipe.js';
import {buildAvatar,measure} from '../src/avatars/build.js';
import {hemSpec} from '../src/avatars/springs.js';
import {skirtSpec,tailoredSkirtGeometry} from '../src/avatars/skirt-shape.js';
import {installDOM} from './fixtures.mjs';
installDOM();

test('tailored skirt fits every life stage, silhouette and build without the old cone flare',()=>{
 for(const age of ['child','teen','adult','elder'])for(const silhouette of ['neutral','feminine','masculine'])for(const build of [0,1]){
  const r=normalizeRecipe({age,body:{silhouette,build},outfit:{bottom:'skirt'}}),m=measure(r),s=skirtSpec(m);
  assert.ok(s.waistR>m.hips/2,'waist encloses the actual pelvis');
  assert.ok(s.waistR-s.thickness>m.hips/2+.004*m.k,'lining clears the fitted body surface');
  assert.ok(s.hemR/s.waistR<1.18,'restrained flare rather than a cone');
  assert.ok(s.waist-s.length>m.hipY-m.thigh,'hem stays above the knee');
  assert.ok(s.waist-s.length<m.hipY-m.thigh*.5,'hem covers the upper thigh');
  assert.equal(hemSpec(r,m).length,s.length);assert.equal(hemSpec(r,m).rx,s.hemR);
 }
});

test('cloth is a watertight shell with outward normals, turned edges and open leg passages',()=>{
 const m=measure(normalizeRecipe({body:{silhouette:'feminine'}})),g=tailoredSkirtGeometry(m),P=g.attributes.position,N=g.attributes.normal,I=g.index,edges=new Map(),ids=new Map();
 const weld=i=>{const key=[P.getX(i),P.getY(i),P.getZ(i)].map(x=>Math.round(x*1e6)).join(',');if(!ids.has(key))ids.set(key,ids.size);return ids.get(key);};
 let out=0,inside=0,volume=0;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i<I.count;i+=3){const tri=[I.getX(i),I.getX(i+1),I.getX(i+2)];
  for(let j=0;j<3;j++){const x=weld(tri[j]),y=weld(tri[(j+1)%3]),key=x<y?x+':'+y:y+':'+x;edges.set(key,(edges.get(key)||0)+1);}
  a.fromBufferAttribute(P,tri[0]);b.fromBufferAttribute(P,tri[1]);c.fromBufferAttribute(P,tri[2]);volume+=a.dot(b.cross(c))/6;
 }
 assert.ok([...edges.values()].every(n=>n===2),'no open, overlapping or non-manifold seams');assert.ok(volume>0,'outward winding');
 for(let i=0;i<P.count;i++){assert.ok(Math.hypot(P.getX(i),P.getZ(i))>m.hips*.45,'no disk over the leg opening');const d=P.getX(i)*N.getX(i)+P.getZ(i)*N.getZ(i);if(d>.05)out++;if(d<-.05)inside++;}
 assert.ok(out>100&&inside>100,'outer cloth and inner lining have opposite normals');assert.ok(I.count/3<7000);g.dispose();
});

test('shared cloth fit uses the tailored length on children, adults and elders; other cuts retain their lengths',()=>{
 for(const age of ['child','adult','elder']){
  const r=normalizeRecipe({age,outfit:{top:'tee',bottom:'skirt'}}),a=buildAvatar(r,{faceSize:64,shadows:false});
  assert.equal(a.body.towelFit.refresh().uSkirt.value.y,skirtSpec(a.measure).length);
  for(const kind of ['longskirt','pleatedskirt']){const s=skirtSpec(a.measure,kind);assert.equal(s.length,kind==='longskirt'?a.measure.thigh+a.measure.shin*.85:a.measure.thigh*.9);}
  a.dispose();
 }
});
