import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,measure,torsoRadius} from '../src/avatars/build.js';
import {ALOHA,GARMENT,PLAIN_UV,alohaLayout,sleeveBand,sleeveUV,shortSleeve,shirtSurface,kariyushiHemY} from '../src/avatars/garment.js';
import {recipeFor} from '../src/avatars/cast.js';
import {PATTERNS} from '../src/avatars/recipe.js';
installDOM();

/**
 * Johansson's aloha print, the owner's brief of 27 November 2026: "Give the floral print a deliberate rhythm ... Start with
 * one larger flower low on the wearer's right front and a smaller one diagonally opposite, below the left pocket. Let a
 * partial bloom turn out of sight at one sleeve edge ... In the reference, the bright flowers at both shoulders form a line
 * beneath the face. Break that line and move the visual weight lower ... For [the lower back], try a loose, off-centre
 * grouping with one flower readable from the rear gameplay camera." Then the owner, the same day: "The shirt you may look
 * like a dress make it look more like a real Hawaii shirt": with eight flowers on broad blue it read as a plain tunic. So the
 * print is all over now, as a real aloha shirt's is (its "broad area of uninterrupted blue between groups" gave way): the
 * heroes where the brief put them, the print's largest flowers, smaller blossoms and tonal leaves all round them, dense low
 * and thinning toward the shoulders. Measured where each motif lies on his body at rest (garment.js alohaLayout, the
 * painter's own placing).
 */
const johansson=()=>{const r=recipeFor('Johansson'),a=buildAvatar(r,{shadows:false});return {r,a,m:a.measure};};
function layout(){
 const r=recipeFor('Johansson'),m=measure(r),radiusAt=torsoRadius(r,m),blooms=alohaLayout(m,radiusAt,r.outfit.top),by=Object.fromEntries(blooms.filter(b=>b.id).map(b=>[b.id,b]));
 return {r,m,radiusAt,blooms,leaves:blooms.leaves,by,share:b=>(b.at.y-m.hipY)/m.torso};
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
 // the leaves tonal: a deeper blue than the cloth, quieter against it than the cream is
 const sky=rgb(recipeFor('Johansson').outfit.topColour),leaf=rgb(ALOHA.leaf),petal=rgb(ALOHA.petal),lum=([r,g,b])=>.2126*r+.7152*g+.0722*b;
 assert.ok(leaf[2]>leaf[1]&&leaf[1]>leaf[0]&&lum(leaf)<lum(sky),'the leaves a deeper blue than the cloth');
 assert.ok(lum(petal)-lum(sky)>2*(lum(sky)-lum(leaf)),'the cream on the blue the strong contrast, the leaves quiet');
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

test('no line of flowers under his face: nothing bright across the shoulders, the weight low, the print thinning upward',()=>{
 const {m,blooms,share}=layout(),F=ALOHA.fill,body=blooms.filter(b=>b.on==='body');
 // no blossom across the shoulders under his face, front or back: only leaves above the yoke; and none on a sleeve's top
 for(const b of body)assert.ok(share(b)<=F.yoke+1e-9,'a blossom at '+share(b).toFixed(2)+' of the torso, above the yoke');
 for(const side of [1,-1]){const sv=shortSleeve(m,side,true),top=sv.a0[1]-(sv.a0[1]-sv.a1[1])*F.cap;
  for(const b of blooms.filter(b=>b.on===(side>0?'sleeveL':'sleeveR')))assert.ok(b.at.y<top+b.r,'a sleeve\'s blossom on its top');}
 // few and small near the shoulders, so none can pair up into a line: above the chest's middle at most three, none large
 const high=body.filter(b=>share(b)>.6);assert.ok(high.length<=3&&high.every(b=>b.r<.035*m.k),high.length+' blossoms high up');
 const mean=blooms.reduce((s,b)=>s+share(b)*b.r*b.r,0)/blooms.reduce((s,b)=>s+b.r*b.r,0);
 assert.ok(mean<.4,'the print\'s weight is low ('+mean.toFixed(2)+')');
 // denser low, sparser high: the cream the print round the heroes puts in each third of the shirt's height
 const cream=(lo,hi)=>body.filter(b=>!b.hero&&share(b)>=lo&&share(b)<hi).reduce((s,b)=>s+b.r*b.r,0);
 assert.ok(cream(0,.25)>cream(.25,.47)&&cream(.25,.47)>cream(.47,.7)&&cream(.47,.7)>0,'thinning upward, and some cream high up');
});

test('a partial bloom turns out of sight at one sleeve\'s edge, cut by its hem; both sleeves printed, never on the arm\'s inside',()=>{
 const {m,blooms,by}=layout(),s=by.sleeve;
 assert.equal(blooms.filter(b=>b.hero&&b.on.startsWith('sleeve')).length,1,'one sleeve has the hero');
 assert.ok(s.along+s.r>s.length&&s.along<s.length,'its hem cuts it');
 // on the outside of the arm: at the sleeve's silhouette seen from the front, so part of it turns away
 const sv=shortSleeve(m,-1,true),axisX=sv.a0[0]+(sv.a1[0]-sv.a0[0])*s.along/s.length;
 assert.ok(s.at.x<axisX-sv.r0*.8,'on the outside of his right sleeve');
 assert.ok(Math.abs(s.at.z-sv.a0[2])<sv.r1*.5,'at the edge seen from the front, not on its face');
 for(const side of [1,-1]){const on=blooms.filter(b=>!b.hero&&b.on===(side>0?'sleeveL':'sleeveR')),v=shortSleeve(m,side,true);
  assert.ok(on.length>=2,'the '+(side>0?'left':'right')+' sleeve printed');
  for(const b of on){assert.ok(b.r<s.r,'smaller than the hero');const f=(v.a0[1]-b.at.y)/(v.a0[1]-v.a1[1]),ax=v.a0[0]+(v.a1[0]-v.a0[0])*f;
   assert.ok((b.at.x-ax)*side>-THREE.MathUtils.lerp(v.r0,v.r1,f)*.4,'none on the inside of the arm, against his body');}}
});

test('an all-over print: blue between every two blossoms but no wide field without a motif; the lower back\'s loose, off-centre group with one readable flower',()=>{
 const {m,radiusAt,blooms,leaves,by,share}=layout();
 // the ground shows between the blossoms: no two touch
 for(const p of blooms)for(const q of blooms)if(p!==q&&p.on===q.on)assert.ok(p.at.distanceTo(q.at)-p.r-q.r>.015*m.k,'blue between two blossoms');
 // and no wide field of plain blue: every point of the body, hem to chest, all round, within 6 cm of a motif's edge (the
 // eight placed flowers left fields 29 cm from any of them)
 const surf=shirtSurface(m,radiusAt,true),motifs=[...blooms.filter(b=>b.on==='body').map(b=>[b.at,b.r]),...leaves.filter(l=>l.on==='body').map(l=>[l.at,l.r*.5])];
 let widest=0;for(let t=(kariyushiHemY(m)-m.hipY)/m.torso+.03;t<=.8;t+=.02)for(let a=-Math.PI;a<Math.PI;a+=.05){const p=surf(a,t);let d=Infinity;for(const [q,r] of motifs)d=Math.min(d,p.distanceTo(q)-r);widest=Math.max(widest,d);}
 assert.ok(widest<.06*m.k,'the widest bare field '+(widest*1000).toFixed(0)+' mm from a motif');
 // the heroes are the print's largest: the large one, the small one under the pocket, the back's readable one
 const fill=blooms.filter(b=>!b.hero);for(const id of ['large','small','back'])assert.ok(fill.every(b=>b.r<by[id].r),id+' larger than the print round it');
 const back=['back','back-low','back-high'].map(id=>by[id]);
 assert.ok(back.every(b=>b.at.z<0&&share(b)<.55),'a group on the lower back');
 const mx=back.reduce((s,b)=>s+b.at.x,0)/back.length;assert.ok(Math.abs(mx)>.04,'off-centre ('+mx.toFixed(3)+')');
 // loose: not three in a row (the triangle they make has some area)
 const [A,B,C]=back.map(b=>b.at);const area=new THREE.Vector3().subVectors(B,A).cross(new THREE.Vector3().subVectors(C,A)).length()/2;
 assert.ok(area>.004,'not a row ('+area.toFixed(4)+' m²)');
 // readable from behind at the game's distance: big enough, and between his arms
 // (his arms hang with their inside edge about 0.18 m out at his waist)
 const R=by.back;assert.ok(R.r>=.06&&Math.abs(R.at.x)+R.r<m.shoulderX-m.armR*.7,'one big enough to read, clear of his arms');
 // nothing on the sides high up, where the underarm stretches
 for(const b of blooms)if(b.on==='body'){const a=Math.atan2(b.at.x,b.at.z);assert.ok(!(Math.abs(Math.abs(a)-Math.PI/2)<.45&&share(b)>.45),'a blossom under the arm');}
});

test('the pocket is pattern-matched: the print runs on across it',()=>{
 const {a}=johansson();assert.ok(a.garment.marks.includes('pattern-matched pocket'));a.dispose();
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
