import * as THREE from '../../vendor/three.module.js';
import {faceLayout,eyesOf} from './face.js';
import {faceObjectPoint} from './face-objects.js';
import {celFrom} from '../render/cel.js';

/**
 * Rigged cartoon eyes (the creator, 25 October 2026: "We are not looking for uncanny valley we want rigged cartoon eyes";
 * and the cosy-anime critique: eyes nearly flush with the face, the iris sliding on them, a thicker curved upper lash
 * line, two highlights, a blink drawn as the lash line pulled down into a closed curve). On for everyone since the
 * creator saw them ("I think it looks better already", 25 October 2026); `?eyes3d=0` shows the painted eyes, to compare
 * (jojo 3d/cast/avatars-cad/HANDOFF.md).
 *
 * One shallow curved disc per eye on the head bone, laid over the head where the painter draws the eye (the head's own
 * projection, face-objects.js), a millimetre off the skin and a few at the middle of the eye. Its fragment shader draws
 * the eye in the painter's own units (face.js drawEye: the same sizes, lids and highlights per eye style) and nothing
 * else: the rest of the disc is clear and the eye's edge is blended onto the skin, so brows, the nose and the town's ink
 * (which reads depth) are exactly as they were. Gaze and blink are numbers on the material (no repaint of the face): the
 * iris slides, the lids close smoothly. The eyes the painter keeps (symbols, spirals, pain, a squint) hide the discs and
 * are painted as before.
 */

/** The eye states drawn by the discs; any other (stars, hearts, spirals, pain …) stays the painter's. */
export const EYES_3D_STATES=Object.freeze(['open','side','wide','worry','shock','angry','sad','shy','smiling','content','closed','happy','daze','dry']);
const DRAWN=new Set(EYES_3D_STATES);

/** Whether this page has the rigged eyes: yes, unless it asks for the painted ones (`?eyes3d=0`). */
export function eyes3dOn(){
 try{return new URLSearchParams(globalThis.location?.search||'').get('eyes3d')!=='0';}catch{return true;}
}

/** Whether the discs draw these eyes (style from the recipe, eyes from the expression), rather than the painter. */
export function eyesShow(style,eyes){return style!=='squint'&&DRAWN.has(eyes);}

// The painter's dark ovals ([half width, half height] of the oval, face.js drawEye) and its white eyes ([rx, ry, iris]).
const DARK={round:[9,12],gentle:[9,9],lashes:[9,12],sleepy:[9,6],bright:[10,13.5],tired:[9,11],starry:[9,12],dot:[6,9],inkoval:[6,9],narrow:[12,4.2]};
const WHITE={sparkle:[13,15,10],doe:[12.5,15,8.6],cat:[12,9,7.4],heavy:[12,12,7.4],almond:[11.5,9.5,7.4],droopy:[11.5,13.5,7.4]};
// Catchlight size against the painter's 1.8 (dot 2.2, bright 3); none for an ink oval or a narrow slit, as painted.
const SHINE={dot:1.22,bright:1.67,inkoval:0,narrow:0};

/** The numbers the shader reads, in this order (uEye[i]). */
export const EYE_PARAMS=Object.freeze(['kind','rx','ry','topAmp','botAmp','pTop','pBot','corner','off',
 'cut','slant','smile','arch','closed','irx','iry','iy','pupil','highlight','star','lash','flick','lower','lidLine',
 'bright','tired','lashes','tear','dryLine','ovalX','ovalY','gainX','gainY','lookX','lookY','blinkA','blinkB',
 'follow','still','depth','caruncle','squeeze','crow','lidShadow','warmIris']);

/**
 * The eye of this style in this state, in the painter's units (x to the outer corner, y up, both before the eye's size,
 * width and tilt). kind 0: a white with an iris and pupil; kind 1: a dark oval. The lids: `cut` lowers the upper lid flat
 * (0 none, .5 to the middle), `slant` tips it (+ down to the nose: cross; - down to the outside: sad), `smile` lifts the
 * lower lid, `closed` shuts both onto the closed line (`arch` 0: the ∪ of a shut eye, 1: the ∩ of a happy one).
 */
export function eyeShape(style,eyes,own=null){
 const s={kind:0,rx:11.5,ry:13.5,topAmp:13.5,botAmp:13.5,pTop:.5,pBot:.5,corner:0,off:0,cut:0,slant:0,smile:0,arch:0,closed:0,
  irx:7.4,iry:7.4,iy:-1,pupil:.5,highlight:1,star:0,lash:3.4,flick:3,lower:1,lidLine:0,bright:0,tired:0,lashes:0,tear:0,dryLine:0,
  ovalX:0,ovalY:0,gainX:4,gainY:3,follow:0,still:0,depth:0,caruncle:0,squeeze:0,crow:0,lidShadow:0,warmIris:0};
 const dark=DARK[style];
 if(dark){
  Object.assign(s,{kind:1,rx:dark[0],ry:dark[1],topAmp:dark[1],botAmp:dark[1],irx:0,iry:0,iy:0,lash:3.2,flick:0,lower:0,gainX:2,gainY:2,
   highlight:SHINE[style]??1,star:style==='starry'?1:0,bright:style==='bright'?1:0,tired:style==='tired'?1:0,lashes:style==='lashes'?1:0});
 }else{
  // (own: a body that brings its own eye, {rx, ry, iris} and its lashes {lash, flick, lashes}, as Pixar Thuan does: pixar.js)
  const [rx,ry,ir]=own?[own.rx,own.ry,own.iris]:WHITE[style]||[11.5,13.5,7.4];
  Object.assign(s,{rx,ry,topAmp:ry,botAmp:ry,irx:ir,iry:ir});
  if(own)for(const k of ['lash','flick','lashes'])if(Number.isFinite(own[k]))s[k]=own[k];
  // A modelled face's eye (own) is a wet ball in a socket: the lids follow the gaze a third of the way, the light's
  // highlight stays where the light is while the iris slides under it, and the iris lies under the cornea, so it shifts
  // against the eye's surface as the head turns (parallax) rather than lying on it like a sticker.
  // (and it travels further in its socket, with the pink of the inner corner, the caruncle, showing). The upper lid lays a
  // warm shadow over the top quarter of the eye, the iris with the white (the cartoon's cool shade under the lid is
  // drawn on the white alone), and the iris warms round the pupil inside a darker rim (the creator's brief, 26 October).
  if(own)Object.assign(s,{follow:.32,still:1,depth:2.4,caruncle:.8,gainX:5.5,gainY:4,lidShadow:1,warmIris:1});
  // Almond and cat eyes come to points (the painter's two quadratic curves); a cat's outer corner lifts.
  if(style==='almond'||style==='cat'||own?.shape==='almond')Object.assign(s,{topAmp:.75*ry,botAmp:.65*ry,pTop:1,pBot:1});
  // (a body's own almond eye, Pixar Thao's: its outer corner lifted a little, the owner's "a bit more almond shaped")
  if(own?.shape==='almond'&&Number.isFinite(own.corner))Object.assign(s,{corner:own.corner,off:own.corner*.3});
  // (a clone's eye reshaped by its recipe (pixar-face.js): its own lid line and slant, and an outer corner lifted on a round eye too)
  if(own){for(const k of ['cut','slant'])if(Number.isFinite(own[k]))s[k]=own[k];
   if(own.shape!=='almond'&&Number.isFinite(own.corner))Object.assign(s,{corner:own.corner,off:own.corner*.3});}
 if(style==='cat')Object.assign(s,{corner:3,off:1,flick:7});
  if(style==='heavy')Object.assign(s,{cut:.41,lash:4});   // the lid's line where the painter draws it, a third of the way up
  if(style==='droopy')Object.assign(s,{cut:.21,slant:-.43});
 }
 // The big reaction eyes are the same for every style, as painted: wide whites, a coloured iris (shock: a dot of a pupil).
 const big=own?{wide:[own.rx*1.06,own.ry*1.4,own.iris*.97,own.iris*.97,.46],worry:[own.rx*1.03,own.ry*1.22,own.iris,own.iris,.52],
  shock:[own.rx*1.08,own.ry*1.45,own.iris*.9,own.iris*.9,.2]}[eyes]
  :{wide:[15,19,8.7,11.8,.62],worry:[13,16,7.5,9.9,.62],shock:[14,18,3.2,3.2,1]}[eyes];
 if(big){
  // (a modelled face's eye opens wider in its own socket: the lids part, the corners stay, its own lashes frame it)
  const [rx,ry,irx,iry,pupil]=big;
  Object.assign(s,{kind:0,rx,ry,topAmp:ry,botAmp:ry,pTop:.5,pBot:.5,corner:0,off:0,cut:0,slant:0,irx,iry,iy:0,pupil,lash:own?.lash??3.4,flick:own?.flick??3,lower:1,
   highlight:eyes==='shock'&&!own?0:1,star:0,bright:0,tired:0,gainX:own?5:3,gainY:own?3.6:3});
 }
 const darkKind=s.kind===1;
 if(eyes==='angry')Object.assign(s,darkKind?{cut:.25,slant:.5,highlight:0}:{cut:.2375,slant:.475});
 if(eyes==='sad')Object.assign(s,darkKind?{cut:.25,slant:-.5,highlight:0,tear:1}:{cut:.225,slant:-.45,tear:1});
 if(eyes==='shy')Object.assign(s,darkKind?{cut:.33,highlight:0}:{cut:.45});
 if(eyes==='smiling')s.smile=.26;
 if(eyes==='closed'||eyes==='content')s.closed=1;
 if(eyes==='happy')Object.assign(s,{closed:1,arch:1});
 // Dazed and deadpan: the upper lid down to the middle, a dark pupil under it, the lid line drawn wide (and, deadpan,
 // a line under the eye), whatever the eyes are like open.
 if(eyes==='daze'||eyes==='dry'){
  const daze=eyes==='daze';
  Object.assign(s,{kind:1,rx:8,ry:9,topAmp:9,botAmp:9,pTop:.5,pBot:.5,corner:0,off:0,irx:0,iry:0,highlight:0,star:0,bright:0,tired:0,lashes:0,
   cut:daze?.444:.389,slant:daze?.14:0,lash:3.6,flick:0,lower:0,lidLine:13,ovalX:daze?3:0,ovalY:daze?-1:-3,dryLine:daze?0:1,gainX:2,gainY:0});
 }
 return s;
}

const VERTEX_HEAD='attribute vec3 eyeLocal;\nvarying vec3 vEye;\n';
const FRAGMENT_HEAD=`varying vec3 vEye;
uniform float uEye[${EYE_PARAMS.length}];
uniform vec3 uEyeInk,uEyeWhite,uEyeLidShade,uEyeLower,uEyeTear,uEyeIris;
${EYE_PARAMS.map((name,i)=>`#define E_${name} uEye[${i}]`).join('\n')}
vec2 eyeRest(float x){
 float t=clamp(x/E_rx,-1.,1.),q=max(0.,1.-t*t),s=E_corner*t+E_off;
 return vec2(E_topAmp*pow(q,E_pTop)+s,-E_botAmp*pow(q,E_pBot)+s);
}
// The upper and lower lid lines at x, for a closure c (0 open, 1 shut).
vec2 eyeLids(float x,float c){
 float ry=E_ry,t=clamp(x/E_rx,-1.,1.),k=mix(.4*ry*(t*t-1.),.62*ry-.95*ry*t*t,E_arch);
 vec2 r=E_kind<.5?eyeRest(x):vec2(ry+3.,-ry-3.);
 float top=mix(r.x,k,c),bot=mix(r.y,k,c);
 if(E_cut>0.||E_slant!=0.)top=min(top,ry*(1.-2.*E_cut)+E_slant*ry*x/E_rx);
 bot=max(bot,-ry+E_smile*ry*1.3*max(0.,1.-t*t));
 return vec2(top,bot);
}
float eyeCover(float d,float w){return smoothstep(-w,w,d);}
// Paint colour c over what is drawn so far (premultiplied), covering k of the pixel.
void eyeOver(inout vec4 acc,vec3 c,float k){acc=vec4(c*k+acc.rgb*(1.-k),k+acc.a*(1.-k));}
float eyeSegment(vec2 p,vec2 a,vec2 b,float r0,float r1){
 vec2 ab=b-a;float h=clamp(dot(p-a,ab)/dot(ab,ab),0.,1.);return mix(r0,r1,h)-length(p-a-ab*h);
}
float eyeEllipse(vec2 p,vec2 c,vec2 r){
 vec2 q=(p-c)/r;float e=length(q),g=length(q/r)/max(e,1e-4);return (1.-e)/max(g,1e-4);
}
// How far the iris, E_depth under the eye's surface, is seen shifted from the surface at this point (eye units), from
// where the camera is: the eye's frame from the derivatives of its units and of the view position (vp: vViewPosition).
vec2 eyeParallax(vec3 vp){
 if(E_depth<=0.)return vec2(0.);
 vec2 p=vEye.xy,px=dFdx(p),py=dFdy(p);vec3 fx=dFdx(-vp),fy=dFdy(-vp);
 float det=px.x*py.y-px.y*py.x;if(abs(det)<1e-9)return vec2(0.);
 vec3 tu=(fx*py.y-fy*px.y)/det,tv=(fy*px.x-fx*py.x)/det,V=normalize(vp),N=normalize(cross(tu,tv));
 if(dot(N,V)<0.)N=-N;
 float vn=max(dot(V,N),.3);vec3 vt=V-vn*N;
 return clamp(vec2(dot(vt,normalize(tu)),dot(vt,normalize(tv)))*E_depth/vn,-4.,4.);
}
vec4 eyesPaint(vec2 deep){
 vec2 p=vEye.xy;float side=vEye.z,w=.8*max(length(fwidth(p)),1e-3);
 float c=max(E_closed,side<0.?E_blinkA:E_blinkB),h=.3;
 vec2 look=vec2(E_lookX*side,-E_lookY);
 // A fleshy lid follows the eye (E_follow): the upper lid rides up into the brow and droops over the iris, the lower a little.
 vec2 follow=E_follow*(1.-c)*look.y*vec2(look.y<0.?.75:.5,.35)*E_ry;
 vec2 L0=eyeLids(p.x-h,c)+follow,L=eyeLids(p.x,c)+follow,L2=eyeLids(p.x+h,c)+follow,sl=(L2-L0)/(2.*h);
 float dTop=(L.x-p.y)/sqrt(1.+sl.x*sl.x),dBot=(p.y-L.y)/sqrt(1.+sl.y*sl.y);
 vec4 col=vec4(0.);
 // Under the eye: a soft warm line on the outer third of the lower lid, a tired bag, a tear.
 if(E_lower>0.){
  float x=p.x/E_rx,band=min(p.y-(L.y-1.2),(L.y+.15)-p.y)/sqrt(1.+sl.y*sl.y);
  eyeOver(col,uEyeLower,.7*(1.-c)*eyeCover(band,w)*smoothstep(.2,.45,x)*smoothstep(.98,.8,x));
 }
 if(E_tired>0.){vec2 bc=vec2(0.,-.2*E_ry);float ring=.9-abs(length(p-bc)-10.);eyeOver(col,uEyeInk,.45*eyeCover(ring,w)*step(p.y,bc.y-5.9));}
 if(E_tear>0.)eyeOver(col,uEyeTear,.7*eyeCover(eyeSegment(p,vec2(-4.,-E_ry),vec2(-5.,-E_ry-8.),1.1,1.1),w));
 if(E_dryLine>0.)eyeOver(col,uEyeInk,eyeCover(eyeSegment(p,vec2(-9.,-12.),vec2(9.,-12.),1.,1.),w));
 // The open eye.
 vec3 inside;float open;
 if(E_kind<.5){
  open=min(min(dTop,dBot),E_rx-abs(p.x));
  vec2 ic=vec2(look.x*E_gainX,E_iy+look.y*E_gainY),ir=vec2(E_irx,E_iry);
  // The white, shaded under the upper lid as a drawn eye is.
  inside=mix(uEyeWhite,uEyeLidShade,.55*(1.-E_lidShadow)*smoothstep(L.x-E_ry*.5,L.x,p.y));
  inside=mix(inside,vec3(.95,.72,.72),E_caruncle*.75*smoothstep(-.62,-.92,p.x/E_rx));
  if(ir.x>0.){
   // (the iris under the cornea: seen at the point deep away, eyeParallax)
   vec2 q=p-deep;
   float di=length((q-ic)/ir),g=clamp((q.y-ic.y)/ir.y*.5+.5,0.,1.);
   vec3 iris=mix(uEyeIris*1.3+.05,uEyeIris*.5,smoothstep(.15,.95,g));
   iris=mix(iris,uEyeIris*.4,smoothstep(.8,.97,di));
   iris=mix(iris,uEyeIris*.45+vec3(.3,.19,.06),E_warmIris*.55*(1.-smoothstep(E_pupil,E_pupil+.3,di)));
   iris=mix(iris,uEyeInk*.7,E_warmIris*.45*smoothstep(.84,1.,di));
   iris=mix(iris,uEyeInk*.55,eyeCover((E_pupil-di)*min(ir.x,ir.y),w));
   inside=mix(inside,iris,eyeCover(eyeEllipse(q,ic,ir),w));
   if(E_lidShadow>0.)inside*=mix(vec3(1.),vec3(.8,.65,.6),E_lidShadow*smoothstep(L.x-E_ry*.5,L.x-.3,p.y));
   if(E_highlight>0.){
    // the highlights are on the eye's wet surface: with E_still they stay where the light is and the iris slides under them
    float r=min(ir.x,ir.y);vec2 hc=mix(ic,vec2(0.,E_iy),E_still);
    inside=mix(inside,vec3(1.),eyeCover(.3*r-length(p-hc-vec2(.38*ir.x*side,.4*ir.y)),w));
    inside=mix(inside,vec3(1.),eyeCover(.14*r-length(p-hc-vec2(-.35*ir.x*side,-.45*ir.y)),w));
   }
  }
 }else{
  vec2 oc=vec2(E_ovalX+look.x*E_gainX,E_ovalY+look.y*E_gainY);
  open=min(min(dTop,dBot),eyeEllipse(p,oc,vec2(E_rx,E_ry)));
  // A dark oval with a little of the eye's colour low in it.
  inside=mix(uEyeInk,uEyeIris*1.2+.04,.55*smoothstep(.1,-.9,(p.y-oc.y)/E_ry));
  if(E_highlight>0.){
   vec2 hc=oc+vec2(2.*side,.35*E_ry),d=abs(p-hc);
   float big=E_star>0.?(pow(4.,.6)-pow(d.x,.6)-pow(d.y,.6))*2.:1.8*E_highlight-length(p-hc);
   inside=mix(inside,vec3(1.),eyeCover(big,w));
   inside=mix(inside,vec3(1.),eyeCover(1.2-length(p-oc-vec2(-2.5*side,-.4*E_ry)),w));
  }
 }
 eyeOver(col,inside,eyeCover(open,w));
 // Crow's feet (E_crow: an older face's smile, its cheeks up): three fine creases fanning out from the outer corner.
 if(E_crow>0.){vec2 a=vec2(E_rx*1.06,-.15*E_ry);float k=0.;
  for(int i=0;i<3;i++){float an=(float(i)-1.)*.42-.12;vec2 b=a+vec2(cos(an),sin(an))*(3.8-abs(float(i)-1.)*.8);k=max(k,eyeCover(eyeSegment(p,a+(b-a)*.12,b,.42,.16),w));}
  eyeOver(col,mix(uEyeLidShade,uEyeInk,.55),.8*clamp(E_crow,0.,1.)*k);}
 // Squeezed shut (E_squeeze: pain, a sneeze): the creases fanning out from the outer corner of the shut eye, a ">".
 if(E_squeeze>0.&&c>.5){vec2 a=vec2(E_rx*.98,-.4*E_ry);
  float k=max(eyeCover(eyeSegment(p,a,a+vec2(4.2,3.4),.9,.45),w),eyeCover(eyeSegment(p,a,a+vec2(4.4,-2.2),.9,.45),w));
  eyeOver(col,uEyeInk,.9*min(E_squeeze,1.)*smoothstep(.5,.9,c)*k);}
 // The upper lash line along the lid: thin at the inner corner, thick to the outer one (a dark oval has a line only
 // where a lid has come down over it, or, dazed and deadpan, the wide lid line).
 float th=E_kind<.5?E_lash*mix(.4,1.,smoothstep(-1.,-.25,p.x/E_rx)):E_lash;
 float lash=(th*.5-abs(p.y-(L.x+th*.5-.3)))/sqrt(1.+sl.x*sl.x);
 if(E_lidLine>0.)lash=min(lash,E_lidLine-abs(p.x));
 else if(E_kind<.5)lash=min(lash,E_rx-abs(p.x));
 else{
  vec2 oc=vec2(E_ovalX+look.x*E_gainX,E_ovalY+look.y*E_gainY);float u=(p.x-oc.x)/E_rx;
  lash=min(lash,(E_rx-abs(p.x-oc.x)));
  lash=min(lash,(oc.y+E_ry*sqrt(max(0.,1.-u*u))-L.x-.2)*1.5);
 }
 eyeOver(col,uEyeInk,eyeCover(lash,w));
 // The flick at the outer corner, and the painted lashes of a lashes eye.
 if(E_flick>0.){
  vec2 a=vec2(E_rx-1.5,eyeLids(E_rx-1.5,c).x+follow.x+th*.35);
  eyeOver(col,uEyeInk,eyeCover(eyeSegment(p,a,a+vec2(E_flick,E_flick*.6),th*.5,.35),w));
 }
 if(E_lashes>0.)for(int i=0;i<2;i++){float f=float(i);eyeOver(col,uEyeInk,(1.-c)*eyeCover(eyeSegment(p,vec2(5.,5.+3.*f),vec2(11.+2.*f,8.+4.*f),1.4,1.4),w));}
 if(E_bright>0.){float e=eyeEllipse(p,vec2(0.,2.),vec2(12.,E_ry+3.));eyeOver(col,uEyeInk,.22*eyeCover(.5-abs(e),w)*step(2.+(E_ry+3.)*.37,p.y));}
 return vec4(col.rgb/max(col.a,1e-4),col.a);
}
`;

// One set of colours for everyone, in the working colour space (the painter's hex values).
const COLOURS={uEyeInk:'#2b2623',uEyeWhite:'#fbfaf6',uEyeLidShade:'#d6d0de',uEyeLower:'#8f5f4c',uEyeTear:'#78b4e6'};
const shared=Object.fromEntries(Object.entries(COLOURS).map(([k,v])=>[k,{value:new THREE.Color(v)}]));

// The disc's extent in the painter's units, for every state it draws: inner corner, outer corner (the flick), below, above.
const EXTENT={inner:17,outer:22,below:21,above:24};
const GRID=[10,12];

/**
 * The eyes for this recipe on its head (measure `m`). Returns the mesh (to add to the head bone), `update(faceState)`
 * (true while the discs draw the eyes) and `dispose()`.
 */
export function buildEyes3d(recipe,m){
 const L=faceLayout(recipe),rest=eyeShape(recipe.eyes.style,'open');
 const pos=[],nrm=[],local=[],index=[];
 const toward=new THREE.Vector3(0,.4,.92).normalize(),a=new THREE.Vector3(),b=new THREE.Vector3(),n=new THREE.Vector3();
 for(const side of [-1,1]){
  const cx=128+side*L.spread,cy=L.eyeY,S=L.eyeS,W=L.eyeW,angle=-side*L.eyeTilt,cos=Math.cos(angle),sin=Math.sin(angle);
  // Never past the middle of the face, where the other eye's disc begins.
  const inner=Math.min(EXTENT.inner,(L.spread-1.5)/(S*W)),start=pos.length/3;
  const canvasAt=(x,y)=>{const X=x*side*S*W,Y=-y*S;return [cx+cos*X-sin*Y,cy+sin*X+cos*Y];};
  for(let j=0;j<=GRID[1];j++)for(let i=0;i<=GRID[0];i++){
   const x=-inner+(inner+EXTENT.outer)*i/GRID[0],y=-EXTENT.below+(EXTENT.below+EXTENT.above)*j/GRID[1];
   const [u,v]=canvasAt(x,y);
   // A millimetre off the skin (clear of the head's facets), a few more over the middle of the eye: a shallow dome.
   const dome=Math.max(0,1-(x/(rest.rx+3))**2-(y/(rest.ry+3))**2);
   const p=faceObjectPoint(m,u,v,.004+.012*dome);pos.push(p.x,p.y,p.z);
   // The face's own normal there, leaned toward the light as the head's is, so the disc shades as the skin under it.
   a.copy(faceObjectPoint(m,u+1,v)).sub(faceObjectPoint(m,u-1,v));b.copy(faceObjectPoint(m,u,v+1)).sub(faceObjectPoint(m,u,v-1));
   n.crossVectors(b,a).normalize();n.lerp(toward,THREE.MathUtils.smoothstep(n.z,-.35,.45)*.7).normalize();nrm.push(n.x,n.y,n.z);
   local.push(x,y,side);
  }
  const row=GRID[0]+1;
  for(let j=0;j<GRID[1];j++)for(let i=0;i<GRID[0];i++){
   const k=start+j*row+i;
   // Wound to face out of the head whichever eye it is (the left eye's grid runs mirrored on the canvas).
   if(side>0)index.push(k,k+1,k+row,k+1,k+row+1,k+row);else index.push(k,k+row,k+1,k+1,k+row,k+row+1);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3));
 geometry.setAttribute('eyeLocal',new THREE.Float32BufferAttribute(local,3));
 geometry.setIndex(index);geometry.computeBoundingSphere();
 return rigEyes(geometry,{iris:recipe.eyes.colour,style:recipe.eyes.style});
}

/**
 * The eye shader on a disc mesh (position, normal and `eyeLocal`: x toward the outer corner and y up in the painter's
 * units, then the side, -1 or 1), and its controller. `style` is the painter's eye style; `own` an eye of the body's
 * own ({rx, ry, iris, lash?, flick?, lashes?}, eyeShape); `cel` false for a smoothly lit body, true (the town's ramp) for
 * every head the town draws, the cartoon's and a Pixar body's (pixar.js). `make(geometry, material)` makes the mesh (a
 * skinned one for a skinned face); `stand` names drawn eyes to stand in for the ones only the painter draws (a face with
 * no painted eyes under it: {star: 'wide', …}; a wink is the open eyes with her left one shut).
 */
export function rigEyes(geometry,{iris,style,own=null,cel=true,make=(g,m)=>new THREE.Mesh(g,m),stand=null,nearer=0}){
 // Lit as the face is (build.js buildHead: cel, high-key, a little self-lit, a floor on dim light). Blended onto the skin
 // and writing no depth: the ink, which reads depth, and the Looks' normals (look-buffers.js) see the head as it was.
 const params=new Float32Array(EYE_PARAMS.length),uniforms={...shared,uEye:{value:params},uEyeIris:{value:new THREE.Color(iris)}};
 const source=new THREE.MeshStandardMaterial({roughness:.82,emissive:0xffffff,emissiveIntensity:.05,transparent:true,depthWrite:false});
 const material=cel?celFrom(source,{bands:'soft3'}):source,base=material.onBeforeCompile,baseKey=material.customProgramCacheKey.bind(material);
 material.name='Shimanchu eyes';
 material.onBeforeCompile=(shader,renderer)=>{base.call(material,shader,renderer);
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=VERTEX_HEAD+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n vEye = eyeLocal;');
  // (a modelled face's discs drawn `nearer` the camera than they lie: its cheeks rise under them; pixar.js)
  if(nearer)shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>\n gl_Position = projectionMatrix * ( mvPosition + vec4( 0., 0., ${nearer.toFixed(4)}, 0. ) );`);
  shader.fragmentShader=FRAGMENT_HEAD+shader.fragmentShader
   .replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor = eyesPaint( eyeParallax( vViewPosition ) );\n if ( diffuseColor.a < 0.004 ) discard;')
   .replace('#include <emissivemap_fragment>','totalEmissiveRadiance *= diffuseColor.rgb;')
   .replace('#include <opaque_fragment>','outgoingLight = max( outgoingLight, diffuseColor.rgb * 0.5 );\n#include <opaque_fragment>');
 };
 material.customProgramCacheKey=cel?()=>baseKey()+':eyes3d-v5:'+nearer:()=>'eyes3d-v4:smooth:'+nearer;
 // First of the see-through things, so glasses' lenses (and a painted beard) are drawn over the eyes, not under them.
 const mesh=make(geometry,material);mesh.name='Shimanchu eyes';mesh.castShadow=false;mesh.receiveShadow=true;mesh.visible=false;mesh.renderOrder=-1;
 const shapes=new Map();
 const eyes3d={mesh,showing:false,
  /** Follow a face state ({expression, blink, look, gaze, blinkLeft, blinkRight}); true while the discs draw the eyes. */
  update(state){
   let {eyes,look}=eyesOf(state),wink=false;
   if(state.eyesAs)eyes=state.eyesAs;   // a body's own acting can draw a feeling with another eye (face-acting.js)
   if(stand&&!eyesShow(style,eyes)){wink=eyes==='wink';eyes=stand[eyes]||'open';}
   const show=eyesShow(style,eyes);
   mesh.visible=eyes3d.showing=show;
   if(!show)return false;
   if(!shapes.has(eyes))shapes.set(eyes,eyeShape(style,eyes,own));
   const s=shapes.get(eyes),blink=THREE.MathUtils.clamp(+state.blink||0,0,1);
   EYE_PARAMS.forEach((name,i)=>{params[i]=s[name]??0;});
   params[EYE_PARAMS.indexOf('lookX')]=THREE.MathUtils.clamp(+look[0]||0,-1,1);params[EYE_PARAMS.indexOf('lookY')]=THREE.MathUtils.clamp(+look[1]||0,-1,1);
   // A captured blink (a performance's own, per eye) is that eye's; otherwise both blink together.
   params[EYE_PARAMS.indexOf('blinkA')]=Number.isFinite(state.blinkLeft)?THREE.MathUtils.clamp(state.blinkLeft,0,1):blink;
   params[EYE_PARAMS.indexOf('blinkB')]=wink?1:Number.isFinite(state.blinkRight)?THREE.MathUtils.clamp(state.blinkRight,0,1):blink;
   return true;
  },
  dispose(){geometry.dispose();material.dispose();source.dispose();},
  /** The shader's parameters as last drawn (EYE_PARAMS order), for a body that acts on them after update (pixar.js). */
  params,
 };
 return eyes3d;
}
