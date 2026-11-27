import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,measure,torsoRadius} from '../src/avatars/build.js';
import {ALOHA,GARMENT,PLAIN_UV,alohaLayout,sleeveBand,sleeveUV,shortSleeve} from '../src/avatars/garment.js';
import {recipeFor} from '../src/avatars/cast.js';
import {PATTERNS} from '../src/avatars/recipe.js';
installDOM();

/**
 * Johansson's aloha print, the owner's brief of 27 November 2026: "Give the floral print a deliberate rhythm ... Start with
 * one larger flower low on the wearer's right front and a smaller one diagonally opposite, below the left pocket. Let a
 * partial bloom turn out of sight at one sleeve edge. Leave a broad area of uninterrupted blue between groups ... In the
 * reference, the bright flowers at both shoulders form a line beneath the face. Break that line and move the visual weight
 * lower ... For [the lower back], try a loose, off-centre grouping with one flower readable from the rear gameplay camera."
 * Measured where each flower lies on his body at rest (garment.js alohaLayout, the painter's own placing).
 */
const johansson=()=>{const r=recipeFor('Johansson'),a=buildAvatar(r,{shadows:false});return {r,a,m:a.measure};};
function layout(){
 const r=recipeFor('Johansson'),m=measure(r),blooms=alohaLayout(m,torsoRadius(r,m),r.outfit.top),by=Object.fromEntries(blooms.map(b=>[b.id,b]));
 return {m,blooms,by,share:b=>(b.at.y-m.hipY)/m.torso};
}

test('Johansson wears the aloha print, laid out flower by flower; everyone else\'s flowers stay tiled',()=>{
 assert.equal(recipeFor('Johansson').outfit.pattern,'aloha');
 assert.equal(PATTERNS.at(-1),'aloha','appended: no saved look moves');
 const {a}=johansson();
 assert.ok(a.garment.marks.includes('aloha')&&a.garment.marks.includes('aloha sleeve'));
 assert.ok(!a.garment.marks.includes('flowers'));a.dispose();
 const other=buildAvatar({...recipeFor('Thuan'),outfit:{...recipeFor('Thuan').outfit,top:'kariyushi',pattern:'flowers'}},{shadows:false});
 assert.ok(other.garment.marks.includes('flowers')&&!other.garment.marks.includes('aloha'));other.dispose();
});

test('one blossom, five petals a little uneven, in warm cream with a golden eye',()=>{
 assert.equal(ALOHA.petals.length,5);
 const reach=ALOHA.petals.map(p=>p[1]);
 assert.ok(Math.max(...reach)-Math.min(...reach)>.05&&Math.max(...reach)-Math.min(...reach)<.2,'uneven, but only slightly');
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),[cr,cg,cb]=rgb(ALOHA.petal),[er,eg,eb]=rgb(ALOHA.eye);
 assert.ok(cr>cb&&cg>cb&&cb>.75&&cr>.9,'warm cream');assert.ok(er>eg&&eg>eb*2&&er>.85,'golden yellow');
 const sizes=ALOHA.blooms.map(b=>b.r),turns=new Set(ALOHA.blooms.map(b=>b.turn));
 assert.ok(Math.max(...sizes)/Math.min(...sizes)>2,'sizes vary');assert.equal(turns.size,ALOHA.blooms.length,'every one turned its own way');
 for(const b of ALOHA.blooms)assert.ok(b.why&&b.why.length>20,b.id+' says why it is there');
});

test('the larger flower is low on his right front, a smaller one diagonally opposite below his left pocket',()=>{
 const {m,by,share,blooms}=layout(),L=by.large,S=by.small;
 assert.ok(L.r===Math.max(...blooms.map(b=>b.r)),'the large one is the largest');
 assert.ok(L.at.x<0&&L.at.z>m.depth*.3,'on his right front (the viewer\'s left)');
 assert.ok(share(L)<.3,'low: in the lower third of his torso ('+share(L).toFixed(2)+')');
 // clear of the placket and above the hem's stitch line
 assert.ok(-L.at.x-L.r>.02*m.k+.005,'clear of the placket');
 assert.ok(L.at.y-L.r>m.hipY+m.torso*.075,'clear of the hem');
 assert.ok(S.at.x>0&&S.at.z>m.depth*.3&&S.r<L.r,'smaller, on his left front');
 // the pocket: x = 0.24 of the body's width across, from 0.6 to 0.73 of the torso up
 assert.ok(share(S)+S.r/m.torso<.6&&share(S)>share(L),'below his left pocket, and higher than the large one: a diagonal');
 assert.ok(Math.abs(S.at.x-m.width*.24)<.04,'under the pocket');
});

test('no line of flowers under his face: nothing across the shoulders, the weight low',()=>{
 const {m,blooms,share}=layout();
 // the band under the face, across both shoulders: the chest above the pocket's top and the shoulders, between the
 // shoulder joints
 for(const b of blooms)assert.ok(!(b.at.y>m.hipY+m.torso*.66&&Math.abs(b.at.x)<m.shoulderX),b.id+' is not in the band under his face');
 // at most one flower anywhere above the chest's middle, so none can pair up into a line
 assert.ok(blooms.filter(b=>share(b)>.6).length<=1);
 const mean=blooms.reduce((s,b)=>s+share(b)*b.r*b.r,0)/blooms.reduce((s,b)=>s+b.r*b.r,0);
 assert.ok(mean<.4,'the print\'s weight is low ('+mean.toFixed(2)+')');
});

test('a partial bloom turns out of sight at one sleeve\'s edge, cut by its hem; the other sleeve is plain',()=>{
 const {m,blooms,by}=layout(),s=by.sleeve;
 assert.equal(blooms.filter(b=>b.on.startsWith('sleeve')).length,1,'one sleeve only');
 assert.ok(s.along+s.r>s.length&&s.along<s.length,'its hem cuts it');
 // on the outside of the arm: at the sleeve's silhouette seen from the front, so part of it turns away
 const sv=shortSleeve(m,-1,true),axisX=sv.a0[0]+(sv.a1[0]-sv.a0[0])*s.along/s.length;
 assert.ok(s.at.x<axisX-sv.r0*.8,'on the outside of his right sleeve');
 assert.ok(Math.abs(s.at.z-sv.a0[2])<sv.r1*.5,'at the edge seen from the front, not on its face');
});

test('broad blue between the groups; the lower back has a loose, off-centre group with one readable flower',()=>{
 const {m,blooms,by,share}=layout();
 const group={large:'right',flank:'right',small:'left',bud:'left',sleeve:'sleeve',back:'back','back-low':'back','back-high':'back'};
 assert.deepEqual(Object.keys(group).sort(),blooms.map(b=>b.id).sort());
 for(const p of blooms)for(const q of blooms)if(group[p.id]!==group[q.id])
  assert.ok(p.at.distanceTo(q.at)-p.r-q.r>.07,p.id+' and '+q.id+' have broad blue between them ('+(p.at.distanceTo(q.at)-p.r-q.r).toFixed(3)+' m)');
 const back=blooms.filter(b=>group[b.id]==='back');
 assert.ok(back.length>=3&&back.every(b=>b.at.z<0&&share(b)<.55),'a group on the lower back');
 const mx=back.reduce((s,b)=>s+b.at.x,0)/back.length;assert.ok(Math.abs(mx)>.04,'off-centre ('+mx.toFixed(3)+')');
 // loose: not three in a row (the triangle they make has some area)
 const [A,B,C]=back.map(b=>b.at);const area=new THREE.Vector3().subVectors(B,A).cross(new THREE.Vector3().subVectors(C,A)).length()/2;
 assert.ok(area>.004,'not a row ('+area.toFixed(4)+' m²)');
 // readable from behind at the game's distance: big enough, and between his arms
 // (his arms hang with their inside edge about 0.18 m out at his waist)
 const R=by.back;assert.ok(R.r>=.06&&Math.abs(R.at.x)+R.r<m.shoulderX-m.armR*.7,'one big enough to read, clear of his arms');
 // nothing on the sides high up, where the underarm stretches
 for(const b of blooms)if(b.on==='body'){const a=Math.atan2(b.at.x,b.at.z);assert.ok(!(Math.abs(Math.abs(a)-Math.PI/2)<.45&&share(b)>.45),b.id+' is clear of the underarm');}
});

test('each sleeve has its own band of the texture; the underarm of a placed print is plain cloth',()=>{
 const L=sleeveBand(1),R=sleeveBand(-1);
 assert.ok(L.v0>R.v1&&GARMENT.V0>L.v1&&R.v0>.05&&PLAIN_UV[1]<.05,'apart, above the empty strip');
 assert.ok(Math.abs((L.v1-L.v0)-(R.v1-R.v0))<1e-9&&Math.abs((L.v1-L.v0)*GARMENT.height-.22*352)<1,'each as many texels as the one band had');
 const a=[.2,1,0],b=[.21,.88,0];
 for(const [side,B] of [[1,L],[-1,R]])for(const y of [.99,.94,.9]){const [,v]=sleeveUV({x:.25,y,z:.01},a,b,side);assert.ok(v>=B.v0-1e-9&&v<=B.v1+1e-9);}
 // the angle round the arm is taken round its axis: a point straight out from the axis at the hem is the arm's outside
 const [u]=sleeveUV({x:b[0]+.05,y:b[1],z:0},a,b,1);assert.ok(Math.abs(u-.75)<1e-6);
 // the gusset under an aloha shirt's arm is plain cloth, sampling the empty strip (under a tiled print it is printed):
 // the shirt's plain-sampling points, with the aloha print and with the tiled one, differ by the two gussets
 const plainShirt=pattern=>{const r=recipeFor('Johansson'),av=buildAvatar({...r,outfit:{...r.outfit,pattern}},{shadows:false}),g=av.body.geometry.attributes,c=new THREE.Color(r.outfit.topColour);let n=0;
  for(let i=0;i<g.position.count;i++)if(Math.abs(g.uv.getX(i)-PLAIN_UV[0])<1e-6&&Math.abs(g.uv.getY(i)-PLAIN_UV[1])<1e-6&&Math.abs(g.color.getX(i)-c.r)+Math.abs(g.color.getY(i)-c.g)+Math.abs(g.color.getZ(i)-c.b)<1e-4)n++;
  av.dispose();return n;};
 assert.ok(plainShirt('aloha')-plainShirt('flowers')>300,'both gussets plain under the aloha print');
});
