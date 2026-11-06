import * as THREE from '../../../vendor/three.module.js';
import {ONSEN_PORCH} from './onsen-front.js';

/**
 * Umi-no-yu's air: the steam (湯けむり) off the rock bath, the lighter 湯気 over the indoor bath, and the evening haze in
 * the porch lamp at the street door. Atmosphere only: it lights nothing, collides with nothing and nobody stands in it.
 *
 * Every puff is a pure function of the clock (steamAt): its life, its birthplace each time round, its rise, sway and drift
 * come from a fixed hash of the puff and of which time round it is, never a dice roll, so the same moment always looks the
 * same in the game, the tests and every photograph. A puff is born small and clear at the water, thickens as it lifts
 * (vapour shows as it meets the cooler air), spreads and thins as it climbs, and is gone before it is born again
 * somewhere else: nothing pops. Each one catches the light of the lamps near it (its field's `lights`, read from the
 * room's own lights every frame, so a lamp that goes out takes its glow off the steam in the same frame).
 *
 * How it is drawn, cheaply enough for a phone: one draw per field (instanced camera-facing quads, three draws in all, 103
 * quads), a 128 px texture of four soft puffs, no light of its own. A billboard is flat, so where it cut through a face
 * or a rock it would leave a hard line. So each puff is drawn at one depth for its whole face: a billow at its far side
 * (`push`), so a head inside it hides it rather than being sliced by it; a low wisp at its near side (`over`), so a rim
 * rock inside it is veiled rather than sliced. A puff the camera is in (a lens at the water) fades away rather than
 * filling the lens (`near`). Puffs are born above the water, and thin out to nothing before they reach a wall, the eave,
 * a fence or the porch (`clear`), or, for a billow, the rim rocks (`rim`) (tests/onsen-steam.test.mjs).
 *
 * Room frame as in onsen.js: the sea at -z, the street at +z, metres, floor y 0.
 */
const plain=o=>Object.freeze(o);

export const ONSEN_STEAM=plain({
 fields:Object.freeze([
  plain({id:'rock',name:'Rock bath steam',jp:'湯けむり',over:'pool',
   // Two layers off the same water: billows that climb above the heads, and low wisps that curl along the surface.
   // inset: born this far in from the water's edge (x, z), clear of the rim rocks.
   layers:Object.freeze([
    plain({name:'billows',count:44,inset:Object.freeze([.55,.42]),life:12,rise:1.45,size:Object.freeze([.15,.52]),opacity:.4,sway:.14,stretch:1.3,turn:.5,thin:2,
     why:'The steam proper: it lifts off the water, gathers above the bathers’ heads and thins out towards the eave.'}),
    plain({name:'wisps',count:32,inset:Object.freeze([.35,.3]),life:7,rise:.3,size:Object.freeze([.1,.28]),opacity:.36,sway:.1,stretch:.55,turn:.2,fadeIn:.35,
     over:true,
     why:'Low wisps that curl along the surface between the bathers and over the rim rocks, the steam seen from the water (12b–d): they soften the rocks in the foreground of a low view. Drawn over what they touch (over), so a rock or a shoulder inside one is veiled, never cut; thin enough that a face behind one still reads.'}),
   ]),
   // Thick on a cool night, a few wisps on a warm afternoon; a night puff also spreads further before it fades.
   density:plain({day:.4,night:1}),spread:plain({night:.15}),
   breeze:plain({x:-.075,z:plain({day:.025,night:-.02}),gust:plain({amount:.35,period:19}),
    why:'The air moves along the shore from the harbour mouth, so the steam leans left as you look out to sea (12a); by day the sea breeze pushes it a little towards the building, at night the land breeze a little out to sea. The gusts come and go every twenty seconds or so, never so hard the steam runs backwards.'}),
   lights:Object.freeze([plain({name:'Bath hall glow',gain:1.4}),plain({name:'Stone lantern light',gain:2.2})]),
   ambient:plain({day:0xe6eaec,night:0x5a6378}),
   renderOrder:4,
   // Where it thins out rather than meet a surface (a billboard meeting a surface leaves a line): the rim rocks, the
   // building, the eave and its posts, the fences, the lantern and the fukugi (onsen.js). [x0, x1, y0, y1, z0, z1, what]
   rim:plain({band:.4,top:.55,why:'The rocks round the water, up to about half a metre: a billow thins out before it reaches them (a low wisp is drawn over them instead).'}),
   clear:Object.freeze([[-5,5,0,3,-4.46,-1,'the bath hall’s glass and walls'],[-2,2,2.5,2.7,-5.5,-4.4,'the eave'],[-1.97,-1.83,0,2.6,-5.52,-5.38,'the west eave post'],[1.83,1.97,0,2.6,-5.52,-5.38,'the east eave post'],
    [-6,-4.9,0,2.25,-9,-4.4,'the west fence'],[4.9,6,0,2.25,-9,-4.4,'the east fence'],[-5,5,0,1.1,-9.2,-8.88,'the low sea fence'],[-4.48,-3.92,0,1.1,-8.48,-7.92,'the stone lantern'],[3.3,5.1,1.5,3.6,-9.1,-7.3,'the fukugi']].map(b=>Object.freeze(b))),
   why:'Sea water at 42 degrees under the open sky. On a cool night the vapour meets air fifteen or twenty degrees colder and shows as a slow, thick steam that lifts off the water, gathers above the bathers’ heads and thins out towards the eave; on a warm afternoon it is a few wisps. It is lit by what lights the bathers: the bath hall’s warm glass behind them, and the stone lantern on the left, brighter where it passes the lamp.',
   period:'湯けむり over a rock bath at night: the picture on every 1980s onsen poster, travel-programme title card and hot-spring map symbol (♨) in Japan.'}),
  plain({id:'indoor',name:'Bath hall steam',jp:'湯気',over:'tub',
   // Kept off the east wall (the mural) and the ceiling: the wall side is inset further (wall).
   layers:Object.freeze([plain({name:'veil',count:18,inset:Object.freeze([.35,.3]),wall:.6,life:10,rise:1.1,size:Object.freeze([.15,.5]),opacity:.3,sway:.09,
    why:'A light veil off the tub, gone well under the ceiling.'})]),
   density:plain({day:.8,night:1}),spread:plain({night:0}),
   breeze:plain({x:-.02,z:-.012,gust:plain({amount:.2,period:23}),
    why:'Indoors the air barely moves: a slow draw towards the open glass door to the rock bath.'}),
   lights:Object.freeze([plain({name:'Bath hall light east',gain:2}),plain({name:'Bath hall light west',gain:2})]),
   ambient:plain({day:0xd6dbd9,night:0x2a2e36}),
   renderOrder:4,
   // The tiled walls, the glass, the ceiling and its beams, the spout. [x0, x1, y0, y1, z0, z1, what]
   clear:Object.freeze([[4.94,6,0,3,-4.4,-1.2,'the east wall and the mural'],[-5,5,2.68,3,-4.4,-1.2,'the ceiling and its beams'],[-5,5,0,3,-5,-4.37,'the glass to the rock bath'],
    [-5,5,0,3,-1.26,0,'the bath-door wall'],[4.5,4.9,.6,.9,-2.72,-2.38,'the spout stone']].map(b=>Object.freeze(b))),
   why:'The indoor bath at 42 degrees in a tiled hall that stays warm and damp: its 湯気 is a light veil off the water, lighter than the rock bath’s, enough to soften the mural and the spout without hiding the people in it.',
   period:'The 湯気 of every sentō and health-land bath hall: the steam the old bath posters drew rising off the tub in three wavy lines.'}),
  plain({id:'porch',name:'Porch haze',jp:'もや',over:'porch',
   layers:Object.freeze([plain({name:'haze',count:9,life:18,rise:.08,size:Object.freeze([.45,.7]),opacity:.17,sway:.1,
    why:'A few wide, faint, slow puffs in the air round the porch lamp, over the first stepping stones.'})]),
   // Only after the sun is down: from nothing at daylight .6 to all of it by daylight .15 (dusk.js daylight()).
   density:plain({day:0,night:1,from:.6,to:.15}),spread:plain({night:0}),
   breeze:plain({x:.045,z:0,gust:plain({amount:.25,period:29}),
    why:'The evening air drifts slowly along the street, past the door.'}),
   // The haze is only seen where the lamp lights it: its glow reaches a little further than the lamp's light on the step.
   lights:Object.freeze([plain({name:'Porch light',gain:.9,reach:2.6})]),
   ambient:plain({day:0x9aa6b8,night:0x1a2030}),
   renderOrder:2,
   // The street wall and the noren, the porch roof, beam and posts, the ground and the step. [x0, x1, y0, y1, z0, z1, what]
   clear:Object.freeze([[-5,5,-1,3,4.9,5.24,'the street wall, the door and the noren'],[-1.4,1.4,2.18,2.8,4.9,6.35,'the porch roof and beam'],
    [-1.08,-.92,-.35,2.3,5.92,6.08,'the west porch post'],[.92,1.08,-.35,2.3,5.92,6.08,'the east porch post'],[-5,5,-1,-.15,5.2,9,'the step and the ground']].map(b=>Object.freeze(b))),
   why:'After sunset a harbour street holds its damp (an Okinawan summer night runs at eighty or ninety per cent), and a lamp under the eave shows it as a soft glow: the porch light gets body, and whoever stands in the door is drawn against it (8a). Thin, never fog: it is only there where the lamp lights it.',
   period:'The milk-glass porch lamp on a humid evening, the opening shot of a hundred 1980s TV dramas set in a seaside town.'}),
 ]),
 /** Each puff is drawn at the depth of its far side, this share of its radius behind its centre. */
 push:.6,
 /** How far a puff's drawn surface reaches from its centre, in radii: the texture's edge (.95) with the depth push. */
 reach:1.13,
 /** A puff fades out over this many metres as the camera comes into it. */
 near:.45,
 why:'Atmosphere for the night bath (12a–d), the bath hall and the street door at dusk (8a): steam and haze as data, the same for the game, the tests and the film.'
});
/** How many puffs a field draws (all its layers). */
export const puffCount=field=>field.layers.reduce((n,l)=>n+l.count,0);

/**
 * A small integer hash in [0, 1): the same every time, never a dice roll (as onsen-night.js). `n` is which time round a
 * puff is (the clock in seconds over its life: hundreds of millions on the real clock), so it is multiplied in 32 bits.
 */
const hash=(i,s=0,n=0)=>{let h=(Math.imul(i,374761393)+Math.imul(s,668265263)+Math.imul(n|0,1442695041))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;h=Math.imul(h^(h>>>15),2246822519);h^=h>>>13;return (h>>>0)/4294967296;};
const clamp01=v=>v<0?0:v>1?1:v;
const smooth=(a,b,v)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};

/** Distance from a point to a box [x0, x1, y0, y1, z0, z1]. */
const toBox=(x,y,z,b)=>Math.hypot(Math.max(b[0]-x,0,x-b[1]),Math.max(b[2]-y,0,y-b[3]),Math.max(b[4]-z,0,z-b[5]));
/** How far a puff's drawn surface reaches from its centre (metres), whichever way the camera looks at it. */
export const puffReach=p=>ONSEN_STEAM.reach*p.r*Math.max(Math.sqrt(p.stretch),1/Math.sqrt(p.stretch));
/**
 * How close a puff is to anything it must not meet: its field's boxes (walls, the eave, the fences: what stands between
 * it and another space) and, over the pool, the rim rocks, unless it is drawn over what it touches (`over`).
 */
export function steamClearance(field,R,p){
 let d=Infinity;for(const b of field.clear??[])d=Math.min(d,toBox(p.x,p.y,p.z,b));
 if(field.rim&&!p.over){const P=R.pool,e=Math.hypot((p.x-P.x)/P.rx,(p.z-P.z)/P.rz),edge=Math.abs(e-1)*Math.min(P.rx,P.rz);
  d=Math.min(d,Math.hypot(Math.max(0,edge-field.rim.band),Math.max(0,p.y-field.rim.top)));}
 return d;
}

/** How thick a field is at a daylight (0 night … 1 noon). */
export function steamDensity(field,day){
 const D=field.density,k=D.from!==undefined?smooth(D.from,D.to,day):1-day;
 return D.day+(D.night-D.day)*k;
}

/** Where a layer's puffs are born, in the room's frame (R: onsen.js ONSEN_ROOM). */
export function steamSource(field,layer,R){
 if(field.over==='pool'){const P=R.pool;return {shape:'ellipse',x:P.x,z:P.z,rx:P.rx-layer.inset[0],rz:P.rz-layer.inset[1],water:P.water};}
 if(field.over==='tub'){const T=R.tub;
  // The tub's walls are .14 thick inside its outline; the east (wall) side keeps further off the room's wall.
  return {shape:'box',x0:T.minX+.14+layer.inset[0],x1:T.maxX-layer.wall,z0:T.minZ+.14+layer.inset[1],z1:T.maxZ-.14-layer.inset[1],water:T.water};}
 if(field.over==='porch'){const P=ONSEN_PORCH;
  // In the air round the lamp, over the first stepping stones: clear of the door, the noren and the porch roof.
  return {shape:'box',x0:-1.3,x1:1.3,z0:P.postZ-.1,z1:P.postZ+1.2,y0:.55,y1:1,ground:P.ground};}
 throw new Error('No steam source: '+field.over);
}

/**
 * The puffs of one field at a moment: a pure function of the clock (seconds) and the daylight.
 * Each: x, y, z (centre, room frame), r (radius, metres: its size is 2r × 2r, stretched by `stretch`, height over width,
 * keeping its area), alpha (0 … 1), spin (radians), tile (0 … 3, which puff shape), over (drawn in front of whatever is
 * inside it, rather than behind), layer (its layer's name).
 * @param {object} field one of ONSEN_STEAM.fields
 * @param {object} R the room (onsen.js ONSEN_ROOM)
 * @param {number} seconds town clock in seconds (minutes × 60)
 * @param {number} day daylight, 0 night … 1 noon
 */
export function steamAt(field,R,seconds,day){
 const night=1-day,dens=steamDensity(field,day),B=field.breeze,G=B.gust,w=2*Math.PI/G.period;
 const bz=typeof B.z==='number'?B.z:B.z.day*day+B.z.night*night,grow=1+field.spread.night*night,out=[];
 field.layers.forEach((layer,li)=>{
  const S=steamSource(field,layer,R),[r0,r1]=layer.size;
  for(let j=0;j<layer.count;j++){
   const i=j+li*1009,L=layer.life*(.8+.4*hash(i,1)),t=seconds/L+hash(i,2),n=Math.floor(t),u=t-n,age=u*L,h=k=>hash(i,k,n);
   // The air it has drifted through since it was born: the breeze with its gusts, integrated over its age.
   const wind=age+G.amount/w*(Math.sin(w*seconds)-Math.sin(w*(seconds-age)));
   const r=(r0+(r1-r0)*Math.pow(u,.7))*(.85+.3*h(7))*grow;
   let bx,bzz,y;
   if(S.shape==='ellipse'){const a=2*Math.PI*h(3),q=Math.sqrt(h(4));bx=S.x+S.rx*q*Math.cos(a);bzz=S.z+S.rz*q*Math.sin(a);}
   else{bx=S.x0+(S.x1-S.x0)*h(3);bzz=S.z0+(S.z1-S.z0)*h(4);}
   if(S.water!==undefined)
    // Off the water: never lower than its own size (so it never cuts the surface), rising fast, then slowing as it cools.
    y=S.water+.85*r*Math.sqrt(layer.stretch??1)+layer.rise*(1-Math.pow(1-u,1.6))*(.85+.3*h(8));
   else y=S.y0+(S.y1-S.y0)*h(8)+layer.rise*u;
   const x=bx+B.x*wind+layer.sway*u*Math.sin(2*Math.PI*(u*.8+h(5)));
   const z=bzz+bz*wind+layer.sway*.6*u*Math.cos(2*Math.PI*(u*.6+h(6)));
   // Clear at birth, thickest a fifth of the way up, thinning to nothing at the top; the haze fades in and out slowly.
   const shape=S.water!==undefined?smooth(0,layer.fadeIn??.22,u)*Math.pow(1-u,layer.thin??1.4):smooth(0,.3,u)*smooth(1,.7,u);
   // It thins out before it meets anything solid (clear, rim): fully there with a fifth of its reach to spare, gone at
   // two fifths of it, and slowly in between, so a puff rising clear of the rocks fades in rather than appearing.
   const stretch=layer.stretch??1,over=!!layer.over,body={x,y,z,r,stretch,over},room=steamClearance(field,R,body)/puffReach(body);
   const alpha=layer.opacity*dens*shape*(.7+.6*h(9))*smooth(.4,1.2,room);
   // Its shape: tall for a rising billow, long and low for a wisp on the water (stretch, height over width), turned
   // only a little either way (turn) so a wisp stays lying along the water; it turns slowly as it goes.
   const turn=layer.turn??Math.PI,spin=(h(10)-.5)*2*turn+(h(11)-.5)*.6*turn*u;
   out.push({x,y,z,r,alpha,spin,stretch,over,tile:Math.floor(h(12)*4),layer:layer.name});
  }
 });
 return out;
}

let atlas=null;
/**
 * Four soft puffs in a 2 × 2 atlas (128 px), each a cauliflower of round lumps (a big one in the middle, smaller ones
 * round its edge, so the outline is a cloud's and not a disc's), clear well inside every tile's edge.
 */
export function puffAtlas(){
 if(atlas)return atlas;
 const size=128,tile=64,data=new Uint8Array(size*size*4);
 for(let ty=0;ty<2;ty++)for(let tx=0;tx<2;tx++){const k=ty*2+tx,lumps=[[0,0,.13,1]];
  for(let j=0;j<6;j++){const a=2*Math.PI*(j/6+hash(k,30+j)*.12),d=.12+hash(k,40+j)*.1;lumps.push([Math.cos(a)*d,Math.sin(a)*d,.06+hash(k,50+j)*.05,.7+hash(k,60+j)*.3]);}
  for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){const u=(x+.5)/tile-.5,v=(y+.5)/tile-.5;
   let s=0;for(const [cx,cy,sg,w] of lumps)s+=w*Math.exp(-((u-cx)**2+(v-cy)**2)/(2*sg*sg));
   const a=(1-Math.exp(-1.2*s))*smooth(.5,.3,Math.hypot(u,v));
   const i=((ty*tile+y)*size+tx*tile+x)*4;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*clamp01(a));}}
 atlas=new THREE.DataTexture(data,size,size);atlas.needsUpdate=true;atlas.colorSpace=THREE.NoColorSpace;
 atlas.magFilter=THREE.LinearFilter;atlas.minFilter=THREE.LinearMipmapLinearFilter;atlas.generateMipmaps=true;
 return atlas;
}

const LAMPS=3;
const VERTEX=`
attribute vec4 puff;
attribute vec4 look;// opacity, spin, atlas tile, stretch (height over width; negative: drawn over what is inside it)
uniform vec3 eye;
uniform vec3 ambient;
uniform vec3 lampAt[${LAMPS}];
uniform vec3 lampColour[${LAMPS}];
uniform float lampReach[${LAMPS}];
uniform float push;
uniform float reach;
uniform float nearFade;
varying vec2 vUv;
varying vec3 vColour;
varying float vAlpha;
void main(){
 float r=puff.w;
 vec3 toEye=eye-puff.xyz;float dist=max(length(toEye),1e-3);
 // A puff the camera is in (or nearly) fades away rather than filling the lens.
 vAlpha=look.x*smoothstep(0.0,nearFade,dist-0.6*r);
 if(vAlpha<0.002){gl_Position=vec4(2.0,2.0,2.0,1.0);vUv=vec2(0.0);vColour=vec3(0.0);return;}
 // Lit by its lamps: brighter near them, and brighter still with the lamp behind it (steam scatters forwards).
 vec3 c=ambient,v=toEye/dist;
 for(int i=0;i<${LAMPS};i++){vec3 d=puff.xyz-lampAt[i];float l=max(length(d),1e-3);float fall=clamp(1.0-l/lampReach[i],0.0,1.0);
  float ahead=max(dot(d/l,v),0.0);c+=lampColour[i]*fall*fall/(1.0+l*l)*(0.7+0.6*ahead*ahead);}
 vColour=c;
 vec4 mv=modelViewMatrix*vec4(puff.xyz,1.0);
 float st=abs(look.w);
 // Drawn at one depth: its far side (a head inside it hides it rather than being cut by it), or for a low wisp its near
 // side, kept in front of the lens (a rock inside it is veiled rather than cut).
 vec4 back=mv;
 if(look.w<0.0)back.z=min(mv.z+reach*r*max(sqrt(st),inversesqrt(st)),-0.2);else back.z-=push*r;
 float s=sin(look.y),k=cos(look.y);
 vec2 q=position.xy*vec2(inversesqrt(st),sqrt(st));
 mv.xy+=vec2(k*q.x-s*q.y,s*q.x+k*q.y)*2.0*r;
 back.xy=mv.xy;
 vec4 clip=projectionMatrix*mv,far=projectionMatrix*back;
 clip.z=far.z/far.w*clip.w;
 gl_Position=clip;
 vUv=(vec2(mod(look.z,2.0),floor(look.z/2.0))+position.xy+0.5)*0.5;
}`;
const FRAGMENT=`
uniform sampler2D map;
varying vec2 vUv;
varying vec3 vColour;
varying float vAlpha;
void main(){
 float a=texture2D(map,vUv).a*vAlpha;
 if(a<0.003)discard;
 gl_FragColor=vec4(vColour,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

/**
 * Builds the steam and the haze. Call after the room's lights exist (onsen-electrics.js), since the steam is lit by them.
 * `update(dt, minutes, day)` moves it (the room's tick); `refresh()` re-reads the lamps without moving it (a frozen
 * photograph after a lamp is switched).
 * @param {{room:THREE.Object3D,R:object}} o
 */
export function buildOnsenSteam({room,R}){
 const group=new THREE.Group();group.name='Umi-no-yu steam';
 // It moves every frame: never baked into the room's static batches, never in a depth photograph.
 group.userData.dynamicProp=true;room.add(group);
 const quad=new THREE.PlaneGeometry(1,1),eye=new THREE.Vector3(0,1.5,0),world=new THREE.Vector3(),tmp=new THREE.Color();
 const fields=ONSEN_STEAM.fields.map(F=>{
  const g=new THREE.InstancedBufferGeometry();g.index=quad.index;g.setAttribute('position',quad.attributes.position);const count=puffCount(F);g.instanceCount=count;
  const puff=new THREE.InstancedBufferAttribute(new Float32Array(count*4),4),look=new THREE.InstancedBufferAttribute(new Float32Array(count*4),4);
  puff.setUsage(THREE.DynamicDrawUsage);look.setUsage(THREE.DynamicDrawUsage);g.setAttribute('puff',puff);g.setAttribute('look',look);
  // The lamps stay where they are hung: where each is in the room's frame is worked out once.
  const lamps=F.lights.map(l=>{const light=room.getObjectByName(l.name)??null,at=light?light.position.clone():null;
   for(let o=light?.parent;o&&o!==room;o=o.parent){o.updateMatrix();at.applyMatrix4(o.matrix);}
   return {spec:l,light,at};});
  const material=new THREE.ShaderMaterial({vertexShader:VERTEX,fragmentShader:FRAGMENT,transparent:true,depthWrite:false,fog:false,
   uniforms:{map:{value:puffAtlas()},eye:{value:eye},ambient:{value:new THREE.Color()},push:{value:ONSEN_STEAM.push},reach:{value:ONSEN_STEAM.reach},nearFade:{value:ONSEN_STEAM.near},
    lampAt:{value:Array.from({length:LAMPS},()=>new THREE.Vector3(0,-100,0))},lampColour:{value:Array.from({length:LAMPS},()=>new THREE.Color(0,0,0))},lampReach:{value:Array.from({length:LAMPS},()=>1)}}});
  material.name=F.name;
  const mesh=new THREE.Mesh(g,material);mesh.name=F.name;mesh.frustumCulled=false;mesh.renderOrder=F.renderOrder;mesh.castShadow=mesh.receiveShadow=false;mesh.raycast=()=>{};
  mesh.userData.steam=F.id;
  // Where the camera is, in the room's frame: the puffs are drawn far to near from it, and fade as it comes into one.
  mesh.onBeforeRender=(renderer,scene,camera)=>{eye.copy(room.worldToLocal(world.setFromMatrixPosition(camera.matrixWorld)));};
  group.add(mesh);
  return {F,mesh,puff,look,lamps,material,now:[]};
 });
 let clock=null,day=1;
 /** The lamps' light on the steam, as the room's own lights are now (a lamp out, or a breaker down, takes it off). */
 const light=()=>{for(const f of fields){const U=f.material.uniforms,A=f.F.ambient;
  U.ambient.value.set(A.night).lerp(tmp.set(A.day),day);
  f.lamps.forEach(({spec,light,at},k)=>{if(!light){U.lampColour.value[k].setRGB(0,0,0);return;}
   U.lampAt.value[k].copy(at);
   U.lampColour.value[k].copy(light.color).multiplyScalar(light.visible?light.intensity*spec.gain:0);
   U.lampReach.value[k]=spec.reach??(light.distance||5);});}};
 /** Puts each field's puffs into its buffers, far to near from the last camera. */
 const placedFrom=new THREE.Vector3(NaN,NaN,NaN);
 const place=()=>{placedFrom.copy(eye);for(const f of fields){const list=f.now,order=list.map((p,i)=>[i,-((p.x-eye.x)**2+(p.y-eye.y)**2+(p.z-eye.z)**2)]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
  order.forEach(([i],k)=>{const p=list[i];f.puff.setXYZW(k,p.x,p.y,p.z,p.r);f.look.setXYZW(k,p.alpha,p.spin,p.tile,p.over?-p.stretch:p.stretch);});
  f.puff.needsUpdate=f.look.needsUpdate=true;f.mesh.visible=list.some(p=>p.alpha>.002);}};
 /**
  * The steam's clock is the town's (minutes × 60): set from it whenever the clock is set (dt 0: entering, a photograph, a
  * jump), then carried on in real seconds, so on a fast clock the steam still drifts at the speed of air.
  */
 const update=(dt,minutes,daylight)=>{clock=dt>0&&clock!==null?clock+dt:minutes*60;day=daylight;
  for(const f of fields)f.now=steamAt(f.F,R,clock,day);light();place();};
 // Without the clock moving, only the lamps can have changed, or the camera (the order the puffs are drawn in).
 const refresh=()=>{light();if(!placedFrom.equals(eye))place();};
 return {group,update,refresh,fields:ONSEN_STEAM.fields,
  /** The steam's clock in seconds, and the puffs as they are now, by field id (for tests and the film). */
  get clock(){return clock;},
  puffs:id=>fields.find(f=>f.F.id===id)?.now.map(p=>({...p}))??null,
  lamps:id=>{const f=fields.find(x=>x.F.id===id);return f?f.material.uniforms.lampColour.value.slice(0,f.lamps.length).map(c=>c.clone()):null;},
  dispose(){for(const f of fields){f.mesh.geometry.dispose();f.material.dispose();}quad.dispose();}};
}
