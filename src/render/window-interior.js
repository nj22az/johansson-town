import * as THREE from '../../vendor/three.module.js';

/**
 * Window glass you can see a room through.
 *
 * Every pane in the town was an opaque grey-blue slab, so a street of houses read as a
 * street of boarded-up boxes. Modelling a room behind each of a few hundred windows is
 * not affordable on an iPad; drawing one in the glass is. This is interior mapping
 * (van Dongen, 2008): the fragment shader follows the view ray from the pane into an
 * imaginary box behind it and paints whichever face it reaches -- back wall, side
 * walls, floor or ceiling -- plus a piece of furniture standing in the middle of the
 * room, so the room moves with the camera like a real one.
 *
 * Each pane carries its own outline (winMin/winMax, world space) so the room is sized
 * to its window, not to a world grid that would cut through it. The outline also seeds
 * the room: wall colour, floor, furniture, and whether the curtains are open, drawn to
 * the sides, sheer, or (rarely) shut. At night most rooms have their light on.
 *
 * MeshBasicMaterial underneath, so the cel pass leaves it alone (cel.js skip) and fog,
 * colour space and the ink pass still apply.
 */
export const WINDOW_ROOM=Object.freeze({depth:3,storey:2.8,sill:.95});

const shared={glow:{value:0},daylight:{value:1},sky:{value:new THREE.Color(0xbcd4dc)}};
/**
 * Homes whose lights follow the people in them (world/home-lights.js). Each is a box in
 * world space and a level: 1 somebody is in and up, 0 nobody (or asleep), between for a
 * lamp left on. A pane inside a box takes its home's level; every other window in town
 * keeps the hashed one, so most of the town still looks lived-in on its own.
 */
export const HOME_LIGHT_SLOTS=24;
const homeA=Array.from({length:HOME_LIGHT_SLOTS},()=>new THREE.Vector4(0,0,0,-1)),homeB=Array.from({length:HOME_LIGHT_SLOTS},()=>new THREE.Vector4());
shared.homeA={value:homeA};shared.homeB={value:homeB};
/** Registers a home's box; returns its slot, or -1 when the table is full. */
export function registerHomeLight([minX,minY,minZ],[maxX,maxY,maxZ]){
 const slot=homeA.findIndex(v=>v.w<0);if(slot<0)return -1;
 homeA[slot].set(minX,minY,minZ,1);homeB[slot].set(maxX,maxY,maxZ,0);return slot;
}
/** A home's light: 0 dark .. 1 lit. */
export function setHomeLight(slot,level){if(slot>=0&&slot<HOME_LIGHT_SLOTS&&homeA[slot].w>=0)homeA[slot].w=Math.max(0,Math.min(1,level));}
export function homeLightLevel(slot){return homeA[slot]?.w;}
/** Frees every slot (a town rebuilt from scratch, or a test). */
export function clearHomeLights(){for(const v of homeA)v.set(0,0,0,-1);}
const materials=new Set();

/** Sets every window material's light: `glow` 0 by day to 1 at night (town-clock windowGlow). */
export function setWindowLight(glow){
 const g=Math.max(0,Math.min(1,glow||0));
 shared.glow.value=g;shared.daylight.value=1-g*.85;
 shared.sky.value.setRGB(.74-g*.6,.83-g*.62,.86-g*.55,THREE.SRGBColorSpace);
}

/** The interior window material. One is enough for the whole town; `options` are for tests. */
export function windowInteriorMaterial({name='window interior'}={}){
 const material=new THREE.MeshBasicMaterial({color:0xffffff});
 material.name=name;
 material.userData.windowInterior=true;
 material.onBeforeCompile=shader=>{
  shader.uniforms.uGlow=shared.glow;shader.uniforms.uDaylight=shared.daylight;shader.uniforms.uSky=shared.sky;shader.uniforms.uHomeA=shared.homeA;shader.uniforms.uHomeB=shared.homeB;
  shader.vertexShader=shader.vertexShader
   .replace('#include <common>',`#include <common>
attribute vec3 winMin;
attribute vec3 winMax;
varying vec3 vIWorld;
varying vec3 vINormal;
varying vec3 vWinMin;
varying vec3 vWinMax;`)
   .replace('#include <project_vertex>',`#include <project_vertex>
vec4 iWorld=vec4(transformed,1.0);
vec3 iNormal=normal;
#ifdef USE_INSTANCING
iWorld=instanceMatrix*iWorld;iNormal=mat3(instanceMatrix)*iNormal;
#endif
vIWorld=(modelMatrix*iWorld).xyz;
vINormal=normalize(mat3(modelMatrix)*iNormal);
vWinMin=(modelMatrix*vec4(winMin,1.0)).xyz;
vWinMax=(modelMatrix*vec4(winMax,1.0)).xyz;`);
  shader.fragmentShader=shader.fragmentShader
   .replace('#include <common>',`#include <common>
uniform float uGlow;
uniform float uDaylight;
uniform vec3 uSky;
uniform vec4 uHomeA[${HOME_LIGHT_SLOTS}];
uniform vec4 uHomeB[${HOME_LIGHT_SLOTS}];
varying vec3 vIWorld;
varying vec3 vINormal;
varying vec3 vWinMin;
varying vec3 vWinMax;
// A registered home's light level for a pane centred at p, or the fallback.
float homeLit(vec3 p,float fallback){
 for(int i=0;i<${HOME_LIGHT_SLOTS};i++){
  vec4 a=uHomeA[i];if(a.w<0.)continue;vec3 b=uHomeB[i].xyz;
  if(all(greaterThanEqual(p,a.xyz))&&all(lessThanEqual(p,b)))return a.w;
 }
 return fallback;
}
float wHash(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
vec3 wLin(vec3 c){return pow(c,vec3(2.2));}
vec3 wPick4(float h,vec3 a,vec3 b,vec3 c,vec3 d){return h<.25?a:h<.5?b:h<.75?c:d;}
vec3 windowRoom(){
 vec3 lo=min(vWinMin,vWinMax),hi=max(vWinMin,vWinMax),size=hi-lo,centre=(lo+hi)*.5;
 // The pane's thin side is the way it faces; the fragment's normal says which side is out.
 bool alongX=size.x<size.z;
 float out_=alongX?sign(vINormal.x):sign(vINormal.z);
 if(abs(alongX?vINormal.x:vINormal.z)<.5)return wLin(vec3(.36,.38,.38));
 vec3 V=normalize(vIWorld-cameraPosition);
 float pa=alongX?vIWorld.x:vIWorld.z,pt=alongX?vIWorld.z:vIWorld.x,va=alongX?V.x:V.z,vt=alongX?V.z:V.x;
 float tLo=alongX?lo.z:lo.x,tHi=alongX?hi.z:hi.x,width=tHi-tLo;
 // Panes sit on round numbers, and the outline arrives through interpolation a hair
 // either side of them, so the cell is offset well away from any boundary.
 vec3 cell=floor(centre*3.1+.437);
 float seed=wHash(cell+.5);
 float seed2=wHash(cell.zxy+7.1),seed3=wHash(cell.yzx+3.7);
 // The room: a little wider than its window, floor below the sill, a storey high.
 float margin=clamp(width*.35,.35,1.1),rA=tLo-margin,rB=tHi+margin;
 float floorY=lo.y-clamp(lo.y-floor(lo.y/${WINDOW_ROOM.storey.toFixed(2)})*${WINDOW_ROOM.storey.toFixed(2)},0.,${WINDOW_ROOM.sill.toFixed(2)});
 float ceilY=max(floorY+2.45,hi.y+.22);
 float depth=${WINDOW_ROOM.depth.toFixed(2)}*(.8+.4*seed2);
 // Where along the window this fragment is (0..1 across, 0..1 up), for the curtains.
 float gu=clamp((pt-tLo)/max(width,.01),0.,1.),gv=clamp((vIWorld.y-lo.y)/max(size.y,.01),0.,1.);
 float inward=-out_*va;
 // Daylight inside is dimmer than out; at night most rooms have the light on.
 float lit=homeLit(centre,step(.22,seed3));
 float night=uGlow;
 vec3 lamp=mix(vec3(1.),wLin(vec3(1.,.82,.58))*1.25,night)*lit;
 float level=mix(.62*uDaylight+.08,0.,night)+night*1.0;
 vec3 wall=wLin(wPick4(seed,vec3(.93,.89,.80),vec3(.86,.90,.84),vec3(.84,.87,.90),vec3(.92,.84,.76)));
 vec3 floorC=wLin(wPick4(seed2,vec3(.62,.46,.30),vec3(.78,.74,.52),vec3(.55,.40,.28),vec3(.72,.62,.45)));
 vec3 ceil=wLin(vec3(.95,.94,.90));
 vec3 furn=wLin(wPick4(fract(seed*7.3),vec3(.42,.30,.22),vec3(.30,.40,.52),vec3(.62,.34,.28),vec3(.35,.45,.33)));
 vec3 col=wall;
 float shade=1.;
 if(inward>.001){
  float tBack=depth/inward;
  float tSide=abs(vt)>1e-4?((vt>0.?rB:rA)-pt)/vt:1e5;
  float tY=abs(V.y)>1e-4?((V.y>0.?ceilY:floorY)-vIWorld.y)/V.y:1e5;
  float t=min(tBack,min(max(tSide,0.),max(tY,0.)));
  vec3 Q=vIWorld+V*t;
  float qt=alongX?Q.z:Q.x,h=Q.y-floorY,d=(alongX?Q.x:Q.z);d=abs(d-pa);
  float u=(qt-rA)/max(rB-rA,.01);
  if(t==tBack){
   col=wall;
   // A cabinet or a sofa back against the far wall, and a picture over it.
   float f0=.15+.3*seed2,f1=f0+.3+.25*seed;
   if(h<.55+.5*seed3&&u>f0&&u<f1)col=furn*.9;
   else if(h>1.35&&h<1.85&&u>f0+.08&&u<f0+.28)col=wLin(vec3(.80,.55,.42))*mix(.6,1.,seed);
   else if(h<.08)col=wall*.7;
  }else if(t==tY&&V.y<0.){
   col=floorC;
   float plank=smoothstep(.86,.94,fract(qt*2.5));col*=1.-.1*plank;
   if(seed2>.5&&abs(u-.5)<.3&&d>.5&&d<depth-.6)col=mix(col,wLin(vec3(.70,.25,.22)),.75);
  }else if(t==tY){
   col=ceil;
   float r=length(vec2(u-.5,(d/depth)-.45));
   if(r<.08)col=mix(col,vec3(1.6,1.5,1.3),night*lit+.2);
  }else{
   col=wall*.82;
  }
  // Light falls off into the room by day; a lamp fills it evenly at night.
  shade=mix(1.-.45*clamp(d/depth,0.,1.),.9,night);
  // Something standing in the middle of the room, so it has parallax: a table, a chair.
  float mid=depth*(.38+.2*seed);
  float tMid=mid/inward;
  if(tMid<t){
   vec3 M=vIWorld+V*tMid;float mu=((alongX?M.z:M.x)-rA)/max(rB-rA,.01),mh=M.y-floorY;
   float m0=.55-.3*seed3;
   if(mh<.72&&mh>.0&&mu>m0&&mu<m0+.32&&(mh>.66||abs(mu-m0-.03)<.025||abs(mu-m0-.29)<.025)){col=furn*.65;shade=mix(.8,.9,night);}
  }
 }
 col*=shade*level*mix(vec3(1.),lamp,night);
 // Curtains: open, drawn to the sides, sheer, or (now and then) shut. They hang just
 // inside the glass, so they light up from behind at night.
 float kind=fract(seed*13.7+seed3);
 vec3 cloth=wLin(wPick4(fract(seed2*5.1),vec3(.95,.93,.86),vec3(.86,.78,.62),vec3(.70,.80,.84),vec3(.88,.72,.70)));
 vec3 clothLit=cloth*(mix(.75*uDaylight+.1,0.,night)+night*(lit>0.?1.1:.12));
 float fold=.9+.1*sin(gu*90.);
 if(kind<.45){float edge=.12+.1*seed;if(gu<edge||gu>1.-edge)col=clothLit*fold;}
 else if(kind<.62){col=mix(col,clothLit,.55);}
 else if(kind<.68){col=clothLit*fold;}
 // Glass: the sky in it at a glancing angle, and one painted streak.
 float facing=abs(dot(V,vec3(alongX?out_:0.,0.,alongX?0.:out_)));
 float fres=.06+.5*pow(1.-facing,3.);
 float streak=step(.93,fract((gu*1.3+gv*.9)*1.5+seed))*.18*(1.-night);
 col=mix(col,wLin(uSky),clamp(fres*(1.-.6*night)+streak,0.,.85));
 return col;
}`)
   .replace('vec4 diffuseColor = vec4( diffuse, opacity );','vec4 diffuseColor = vec4( windowRoom(), opacity );');
 };
 material.customProgramCacheKey=()=>'window-interior-2';
 materials.add(material);
 return material;
}

const box=new THREE.Box3();
/**
 * Gives a pane geometry the outline the shader sizes its room by. `bounds` defaults to the
 * geometry's own box; pass the world box when the geometry is already in world space and
 * the mesh sits at the origin (the kit), or the local box otherwise -- the vertex shader
 * carries it through the model matrix either way.
 */
export function markPane(geometry,bounds=null){
 const b=bounds||(geometry.computeBoundingBox(),geometry.boundingBox);
 const n=geometry.attributes.position.count,lo=new Float32Array(n*3),hi=new Float32Array(n*3);
 for(let i=0;i<n;i++){lo.set([b.min.x,b.min.y,b.min.z],i*3);hi.set([b.max.x,b.max.y,b.max.z],i*3);}
 geometry.setAttribute('winMin',new THREE.BufferAttribute(lo,3));
 geometry.setAttribute('winMax',new THREE.BufferAttribute(hi,3));
 return geometry;
}

/** Turns an existing pane mesh into one you can see a room through. */
export function glazeWithRoom(mesh,material=sharedWindowMaterial()){
 const geometry=mesh.geometry.clone();
 markPane(geometry,box.setFromBufferAttribute(geometry.attributes.position));
 mesh.geometry=geometry;mesh.material=material;mesh.castShadow=false;
 mesh.userData.windowInterior=true;
 return mesh;
}

let one=null;
/** The town's one window material. */
export function sharedWindowMaterial(){return one??=windowInteriorMaterial({name:'window interior (town)'});}
