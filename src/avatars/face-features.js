import * as THREE from '../../vendor/three.module.js';
import {celFrom} from '../render/cel.js';
import {pixarSkin} from './pixar-skin.js';
import {moodOf} from './face.js';

/**
 * Brows and a mouth that move, for a modelled face (pixar.js; the creator, 26 October 2026: "I think you need to rig the
 * nose and eyebrows and mouth too"). The studio paints a face's own brows and mouth out of its texture and lays a shallow
 * decal over each place (jojo `3d/cast/game_thuan.py`); these shaders draw them there, in the feature's own units (her
 * eye's: x outward, y up), from her own measures (the card), shaped by the feeling World's painter uses for every face
 * (face.js moodOf): brows that rise, pinch and drop, a mouth that smiles, frowns, opens, rounds into an O and talks.
 * Drawn on the town's ramp (cel.js), blended onto the skin, writing no depth, as the rigged eyes are (eyes3d.js).
 */

const HEAD='attribute vec3 featureLocal;\nvarying vec3 vFeature;\n';

const BROWS=`varying vec3 vFeature;
uniform float uBrowShapeL[8],uBrowShapeR[8];
uniform vec4 uBrowL,uBrowR,uBrowL2,uBrowR2;
uniform vec3 uBrowInk;
uniform float uBrowLines,uBrowTaper,uBrowBushy;
float B[8];
float browLine(float x){return B[2]*x*x+B[3]*x+B[4];}
float browHalf(float x){return max(.25,B[5]*x*x+B[6]*x+B[7]);}
// A brow: its own painted arc (x0 inner .. x1 outer, its middle line and half thickness: each side its own, not mirrored),
// lifted (lift), turned at the inner end (tilt: + down, a frown; - up, a worry), arched and pinched toward the nose, as
// uBrowL/R say for each side; and (uBrowL2/R2) its outer end lifted on its own (outer), the turn made a straight line
// rather than a curve at the inner end (straight: an evil brow's V), and the inner end bunched thicker (bunch: a hard
// frown pushes the brow's hair together). browInside: how far p is inside it (its units; < 0 outside), its middle line.
float browY(float s,vec4 e,vec4 f){
 float xr=B[0]+s*(B[1]-B[0]),drop=mix((1.-s)*(1.-s),1.-s,f.y);
 return browLine(xr)+e.x-e.y*drop+e.y*.3*s*s*(1.-f.y)+f.x*s*s+e.z*4.*s*(1.-s);
}
// (uBrowTaper, a body's own: the outer end thinning to a tail)
float browHalfAt(float s,vec4 f){return browHalf(B[0]+s*(B[1]-B[0]))*(1.+f.z*(1.-s)*(1.-s))*(1.-uBrowTaper*smoothstep(.55,1.,s));}
float browInside(vec2 p,vec4 e,vec4 f,out float y){
 float x0=B[0],x1=B[1],inner=x0-e.w,s=clamp((p.x-inner)/(x1-inner),0.,1.);
 y=browY(s,e,f);
 // (round ends)
 if(p.x<inner)return browHalfAt(0.,f)-length(p-vec2(inner,browY(0.,e,f)));
 if(p.x>x1)return browHalfAt(1.,f)-length(p-vec2(x1,browY(1.,e,f)));
 return browHalfAt(s,f)-abs(p.y-y);
}
vec4 browsPaint(){
 vec2 p=vFeature.xy;bool left=vFeature.z>0.;vec4 e=left?uBrowL:uBrowR,f=left?uBrowL2:uBrowR2;
 for(int i=0;i<8;i++)B[i]=left?uBrowShapeL[i]:uBrowShapeR[i];
 float x0=B[0],x1=B[1],w=.8*max(length(fwidth(p)),1e-3),inner=x0-e.w;
 float s=clamp((p.x-inner)/(x1-inner),0.,1.),xr=x0+s*(x1-x0),y,ys;
 float d=browInside(p,e,f,y);
 // (uBrowBushy, a body's own: a bushy brow's edge in tufts, hairs standing out of its top and its ends, a grain along it)
 float grain=1.;
 if(uBrowBushy>0.){
  // (laid along the brow itself (xr: where along it, p.y-y: how far off its middle line), so the tufts travel with it as it
  // lifts and knits while he talks, not through a pattern fixed on the skin; the top's longer tufts eased in, no step)
  float q=p.y-y;
  float tuft=.5+.5*sin(xr*2.6+1.7*sin(xr*1.1));tuft*=.65+.35*sin(xr*6.3+q*1.9+1.3);
  d+=uBrowBushy*(1.05*tuft-.35)*smoothstep(-2.2,-.2,d)*mix(.55,1.,smoothstep(-.6,.6,q));
  grain=1.-uBrowBushy*.16*(.5+.5*sin(xr*7.1+q*2.4))*(.5+.5*sin(xr*3.3-1.));
 }
 // A brow has volume: the hairs catch the light along its top and darken toward its underside, and it lays a soft
 // warm shadow on the skin under it (the brow seen as hair on a brow ridge, not ink on the skin).
 float v=clamp((p.y-y)/browHalfAt(s,f),-1.,1.);
 vec3 hair=mix(uBrowInk*.72,uBrowInk*1.22+.03,smoothstep(-.9,.75,v));
 hair+=(uBrowInk*.6+.05)*.35*smoothstep(.2,.55,v)*smoothstep(1.,.7,v);
 vec4 col=vec4(hair*grain,.96*smoothstep(-w,w,d));
 float dropped=browInside(p+vec2(0.,1.15),e,f,ys)+.45;
 float shade=.2*smoothstep(-1.4,1.,dropped)*step(p.y,y);
 col=vec4((col.rgb*col.a+vec3(.46,.27,.21)*shade*(1.-col.a))/max(col.a+shade*(1.-col.a),1e-4),col.a+shade*(1.-col.a));
 // An older face's lines (uBrowLines, a body's own): two or three across the forehead as the brow rises, following its
 // arch, and short creases above the nose where the brows knit (frown and pinch).
 if(uBrowLines>0.&&col.a<.9){
  float up=smoothstep(2.5,8.,e.x)*uBrowLines,k=0.;
  for(int i=1;i<=3;i++){
   float fi=float(i),y0=browLine(xr)+e.x*.45+browHalf(xr)+2.2+fi*2.6+e.z*1.5*s*(1.-s),len=smoothstep(x0+2.,x0+5.,p.x)*smoothstep(x1-3.-fi,x1-6.-fi,p.x);
   k=max(k,len*smoothstep(.32,.08,abs(p.y-y0))*(fi<3.?1.:smoothstep(5.,9.,e.x)));
  }
  float knit=smoothstep(2.5,7.,e.y)*smoothstep(.8,2.5,e.w)*uBrowLines,xi=inner-1.4;
  float crease=max(smoothstep(.3,.08,abs(p.x-xi-.25*(p.y-browLine(x0)))),0.)*smoothstep(browLine(x0)+e.x-e.y-1.,browLine(x0)+e.x-e.y+1.,p.y)
   *smoothstep(browLine(x0)+e.x-e.y+6.,browLine(x0)+e.x-e.y+3.,p.y);
  vec3 lineCol=uBrowInk*.55+vec3(.42,.24,.18)*.45;
  col=mix(vec4(lineCol,.42*max(up*k,knit*crease)),col,col.a);
 }
 return col;
}
`;

const MOUTH=`varying vec3 vFeature;
uniform float uMouthRest[16];
uniform float uMouth[16];
uniform vec3 uLip,uLipLow,uLipInk,uMouthIn,uTeeth,uTongue;
uniform float uMouthLines;
uniform float uSeam;   // the line between the lips, this many times its usual thickness (a comic's firmer mouth: 2 for the Pixar bodies)
float mouthPoly(int o,float x){return (((uMouthRest[o]*x+uMouthRest[o+1])*x+uMouthRest[o+2])*x+uMouthRest[o+3])*x+uMouthRest[o+4];}
void mouthOver(inout vec4 acc,vec3 c,float k){acc=vec4(c*k+acc.rgb*(1.-k),k+acc.a*(1.-k));}
#define M_smile uMouth[0]
#define M_width uMouth[1]
#define M_open uMouth[2]
#define M_round uMouth[3]
#define M_teeth uMouth[4]
#define M_tongue uMouth[5]
#define M_asym uMouth[6]
#define M_pucker uMouth[7]
#define M_wobble uMouth[8]
#define M_shift uMouth[9]
#define M_box uMouth[10]
#define M_upper uMouth[11]
#define M_lowTeeth uMouth[12]
#define M_thin uMouth[13]
#define M_pout uMouth[14]
float mouthHalf(){return uMouthRest[0]*M_width*(1.-.42*M_round)*(1.-.4*M_pucker);}
// The mouth's opening at x: its top and bottom edges (one line, the line between the lips, when it is shut). Her own
// line at rest, the corners up (smile) or down, her left corner further (asym), a wobble; open, the opening's profile
// across: pointed at the corners for a grin, an ellipse for an O, a box for a yell or a grimace (box); upper: how much of
// it lies above the line (a grin opens downward, a snarl lifts the upper lip).
vec2 mouthEdges(float x){
 float W=mouthHalf(),t=clamp(x/W,-1.,1.),xr=t*uMouthRest[0],edge=max(1.-t*t,0.);
 float line=mouthPoly(1,xr)*(1.-.5*clamp(M_open/8.,0.,1.))+M_smile*t*t+M_asym*max(t,0.)*max(t,0.)+M_wobble*.6*sin(t*9.)*edge;
 float prof=mix(pow(edge,mix(.8,.5,M_round)),pow(max(1.-pow(abs(t),5.),0.),.2),M_box)*sqrt(smoothstep(1.,.88,abs(t)));
 float g=M_open*prof;
 return vec2(line+g*M_upper,line-g*(1.-M_upper));
}
// The lips' thickness at x: hers as painted while the mouth is shut, smoothed and thinned as it opens and stretches;
// pressed thin (thin), the lower pushed out in a pout, both fuller in a pucker.
vec2 mouthLips(float x){
 float W=mouthHalf(),t=clamp(x/W,-1.,1.),xr=t*uMouthRest[0],edge=max(1.-t*t,0.),o=max(clamp(M_open/3.,0.,1.),clamp(M_pucker,0.,1.)),s=pow(edge,mix(.35,.55,clamp(M_pucker,0.,1.)));
 float up=mix(max(mouthPoly(6,xr),0.),max(mouthPoly(6,0.),0.)*s,o),lo=mix(max(mouthPoly(11,xr),0.),max(mouthPoly(11,0.),0.)*s,o);
 float wide=clamp(M_open/10.,0.,1.),stretch=clamp(M_width-1.,0.,.4),taper=mix(1.,smoothstep(1.,.55,abs(t)),o);
 float bud=mix(1.,.55,clamp(M_pucker,0.,1.));   // a pucker is small all round: its lips shrink with its width
 up*=(1.-.45*wide)*(1.-.2*clamp(M_smile/3.,0.,1.))*(1.+.35*M_pucker)*(1.-.6*M_thin)*(1.-.8*stretch)*bud;
 lo*=(1.-.3*wide)*(1.+.3*M_pucker)*(1.-.5*M_thin)*(1.+.6*M_pout)*(1.-.6*stretch)*bud;
 return vec2(up,lo)*taper;
}
// Her mouth as painted, then the feeling's shape: the corners up or down, wider or narrower, open (with the upper and
// the lower teeth and the tongue), an O, a box, a smirk, a pucker, a pout, pressed lips or a wobble.
vec4 mouthPaint(){
 vec2 p=vFeature.xy-vec2(M_shift,0.);float w=.8*max(length(fwidth(p)),1e-3),h=.3;
 vec2 E0=mouthEdges(p.x-h),E=mouthEdges(p.x),E2=mouthEdges(p.x+h),sl=(E2-E0)/(2.*h);
 float dTop=(E.x-p.y)/sqrt(1.+sl.x*sl.x),dBot=(p.y-E.y)/sqrt(1.+sl.y*sl.y),inside=min(dTop,dBot);
 float W=mouthHalf(),t=clamp(p.x/W,-1.,1.),ends=W-abs(p.x),g=E.x-E.y,mid=(E.x+E.y)*.5;
 vec2 lips=mouthLips(p.x);
 vec4 col=vec4(0.);
 // the lips, round the opening (or either side of the line): the upper a shade darker, the lower fuller with a little
 // light on it
 // (the lips' bands are measured straight up and down from the opening's edges, so they thin where the edges turn
 // steep, round an O's sides, rather than bulging there)
 float vTop=E.x-p.y,vBot=p.y-E.y;
 float kUp=smoothstep(-w,w,min(lips.x+vTop,ends+.2))*step(mid,p.y);
 mouthOver(col,uLip*.92,kUp);
 float lowAt=clamp(-vBot/max(lips.y,.01),0.,1.),lowLight=smoothstep(.2,.55,lowAt)*(1.-smoothstep(.55,.95,lowAt));
 float kLo=smoothstep(-w,w,min(lips.y+vBot,ends+.2))*step(p.y,mid);
 mouthOver(col,mix(uLipLow,uLipLow*1.12+.04,lowLight*.6),kLo);
 // the open mouth: deep and dark at the back, warmer toward the lips, a shadow along its rim; the upper teeth, each its
 // own, under the upper lip, the lower ones above the lower lip; the tongue low in it, lighter in the middle
 if(g>.05&&ends>-w){
  float gap=min(inside,ends),back=smoothstep(0.,max(g*.45,.5),gap);
  vec3 c=mix(uMouthIn*1.5,uMouthIn*.5,back);
  float tg=1.-length((p-vec2(0.,E.y+g*.04))/vec2(W*.55+.01,max(g*.42,.01)));
  c=mix(c,mix(uTongue*.78,uTongue*1.08,smoothstep(0.,.5,tg)),clamp(M_tongue,0.,1.)*smoothstep(-.05,.05,tg));
  // (the teeth only along the opening's flatter middle, where they would show: an O shows a few at the top)
  float reach=mix(.95,.55,clamp(M_round,0.,1.)),fade=smoothstep(reach,reach-.22,abs(t)),gaps=abs(fract(p.x/(W*.26)+.5)-.5)*W*.26;
  float tu=min(g*.3,2.2)*clamp(M_teeth,0.,1.),tl=min(g*.22,1.7)*clamp(M_lowTeeth,0.,1.);
  float upT=tu-vTop,loT=tl-vBot;
  vec3 enamel=mix(uTeeth*.8,uTeeth,smoothstep(0.,tu*.6+.01,upT));
  enamel=mix(uTeeth*.68,enamel,smoothstep(.04,.28,gaps));
  c=mix(c,enamel,fade*step(.01,tu)*smoothstep(-w,w,upT));
  vec3 lowEn=mix(uTeeth*.7,uTeeth*.9,smoothstep(0.,tl*.6+.01,loT));
  lowEn=mix(uTeeth*.6,lowEn,smoothstep(.04,.28,gaps));
  c=mix(c,lowEn,fade*step(.01,tl)*smoothstep(-w,w,loT));
  c*=mix(.7,1.,smoothstep(0.,.8,inside));
  mouthOver(col,c,smoothstep(-w,w,gap));
 }
 // the line between the lips, shut or nearly (darker and firmer pressed), and the creases past the corners: up and out
 // when she smiles (deeper on a smirk's side), down when the corners drop
 float closed=1.-smoothstep(.4,2.,g);
 float lineLen=mix(1.,smoothstep(.9,.35,abs(t)),clamp(M_pucker,0.,1.));   // (a pucker's lips meet only in the middle)
 mouthOver(col,uLipInk*(1.-.3*M_thin),min(1.,.85*uSeam)*closed*lineLen*smoothstep(-w,w,min(uSeam*(.42+.3*M_thin)-abs(p.y-mid),ends+.6)));
 for(int i=0;i<2;i++){
  float sx=i==0?-1.:1.,lift=M_smile+(sx>0.?M_asym:0.),k2=clamp(lift/2.6,0.,1.),k3=clamp(-lift/2.6-.4,0.,1.);
  vec2 a=vec2(sx*(W-.3),mouthEdges(sx*W).x);
  if(k2>0.){vec2 b=a+vec2(sx*1.1,1.3*k2+.2),ab=b-a;float q=clamp(dot(p-a,ab)/dot(ab,ab),0.,1.),r=mix(.34,.12,q)-length(p-a-ab*q);
   mouthOver(col,uLipInk,.6*k2*smoothstep(-w,w,r));}
  if(k3>0.){vec2 b=a+vec2(sx*.7,-1.5*k3-.2),ab=b-a;float q=clamp(dot(p-a,ab)/dot(ab,ab),0.,1.),r=mix(.3,.1,q)-length(p-a-ab*q);
   mouthOver(col,uLipInk,.5*k3*smoothstep(-w,w,r));}
  // An older face's smile lines (uMouthLines, a body's own): from beside the nose out round the cheek and in again
  // under the corner, deepening as the corners rise (a smile, a grin, a laugh: the cheeks push up into them). A soft
  // shadow on the lip's side of the fold, a fine crease in it; a trace at rest.
  if(uMouthLines>0.){
   float k4=uMouthLines*(.2+.8*clamp(lift/2.6,0.,1.)),R=12.;vec2 c=vec2(sx*(W-9.),2.5),q=p-c;
   float along=smoothstep(-4.8,-2.,p.y)*smoothstep(10.6,7.5,p.y)*step(0.,q.x*sx),off=length(q)-R;
   float fold=smoothstep(-1.8,0.,off)*smoothstep(.5,0.,off),crease=mix(.3,.12,clamp(abs(p.y-2.5)/7.,0.,1.))-abs(off);
   mouthOver(col,uLip*.6,.2*k4*along*fold);
   mouthOver(col,mix(uLipInk,uLip*.55,.5),.34*k4*along*smoothstep(-w,w,crease));
  }
 }
 return vec4(col.rgb/max(col.a,1e-4),col.a);
}
`;

/** The material for one decal: the town's ramp, see-through round the feature, writing no depth (eyes3d.js rigEyes); lit
 *  as the skin it lies on is where it paints skin-coloured lips (pixar-skin.js), so they do not go cooler than the face. */
function featureMaterial(name,shaderHead,paint,uniforms){
 const source=new THREE.MeshStandardMaterial({roughness:.75,emissive:0xffffff,emissiveIntensity:.05,transparent:true,depthWrite:false});
 const material=pixarSkin(celFrom(source,{bands:'soft3'}),{rim:false}),base=material.onBeforeCompile,baseKey=material.customProgramCacheKey.bind(material);
 material.name=name;
 material.onBeforeCompile=(shader,renderer)=>{base.call(material,shader,renderer);Object.assign(shader.uniforms,uniforms);
  // (drawn a few millimetres nearer the camera than it lies: the skin under it moves with the cheeks and the nose, and
  // between its vertices the face can bulge through a flat decal, which would cut the feature into jags)
  shader.vertexShader=HEAD+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n vFeature = featureLocal;')
   .replace('#include <project_vertex>','#include <project_vertex>\n gl_Position = projectionMatrix * ( mvPosition + vec4( 0., 0., 0.0028, 0. ) );');
  shader.fragmentShader=shaderHead+shader.fragmentShader
   .replace('#include <color_fragment>',`#include <color_fragment>\n diffuseColor = ${paint}();\n if ( diffuseColor.a < 0.004 ) discard;`)
   .replace('#include <emissivemap_fragment>','totalEmissiveRadiance *= diffuseColor.rgb;')
   .replace('#include <opaque_fragment>','outgoingLight = max( outgoingLight, diffuseColor.rgb * 0.5 );\n#include <opaque_fragment>');};
 material.customProgramCacheKey=()=>baseKey()+':'+name+'-v8';
 return {material,dispose(){material.dispose();source.dispose();}};
}

const colour=hex=>new THREE.Color(hex);

/** Brows on their decal, each its own ({left, right}: x0, x1, line, half; colour). `make(geometry, material)` makes the mesh
 *  (a skinned one for a skinned face); `lines` (0..1) draws an older face's forehead lines and frown creases; `taper`
 *  (0..1) thins the outer end to a tail. */
export function rigBrows(geometry,brows,{make=(g,m)=>new THREE.Mesh(g,m),lines=0,taper=0,bushy=0}={}){
 const shape=b=>new Float32Array([b.x0,b.x1,...b.line,...b.half]);
 const uniforms={uBrowShapeL:{value:shape(brows.left)},uBrowShapeR:{value:shape(brows.right)},uBrowL:{value:new THREE.Vector4()},uBrowR:{value:new THREE.Vector4()},
  uBrowL2:{value:new THREE.Vector4()},uBrowR2:{value:new THREE.Vector4()},uBrowInk:{value:colour(brows.colour)},uBrowLines:{value:lines},uBrowTaper:{value:taper},uBrowBushy:{value:bushy}};
 const {material,dispose}=featureMaterial('Shimanchu brows',BROWS,'browsPaint',uniforms);
 const mesh=make(geometry,material);mesh.name='Shimanchu brows';mesh.castShadow=false;mesh.receiveShadow=true;mesh.renderOrder=-1;
 return {mesh,uniforms,
  /** Each side's [lift, tilt, arch, pinch, outer, straight, bunch] in the brow's units (BROW_KEYS; the last three 0 if left
   *  out). */
  set(left,right){for(const [b,u,u2] of [[left,uniforms.uBrowL,uniforms.uBrowL2],[right,uniforms.uBrowR,uniforms.uBrowR2]]){
   u.value.set(b[0],b[1],b[2],b[3]);u2.value.set(b[4]||0,b[5]||0,b[6]||0,0);}},
  dispose};
}

/** A mouth on its decal; `lines` (0..1) draws an older face's smile lines. */
export function rigMouth(geometry,mouth,{make=(g,m)=>new THREE.Mesh(g,m),lines=0,seam=1}={}){
 const rest=new Float32Array([mouth.half,...mouth.line,...mouth.upper,...mouth.lower]),params=new Float32Array(16);
 const uniforms={uMouthRest:{value:rest},uMouth:{value:params},uLip:{value:colour(mouth.lip)},uLipLow:{value:colour(mouth.lowerLip)},
  uLipInk:{value:colour(mouth.ink).multiplyScalar(.62)},uMouthIn:{value:colour('#4a151b')},uTeeth:{value:colour('#f4efe6')},uTongue:{value:colour('#d96b70')},uMouthLines:{value:lines},uSeam:{value:seam}};
 const {material,dispose}=featureMaterial('Shimanchu mouth',MOUTH,'mouthPaint',uniforms);
 const mesh=make(geometry,material);mesh.name='Shimanchu mouth';mesh.castShadow=false;mesh.receiveShadow=true;mesh.renderOrder=-1;
 return {mesh,uniforms,
  /** The mouth (MOUTH_KEYS), in the mouth's units (open: the opening's height). */
  set(m){MOUTH_KEYS.forEach((k,i)=>{params[i]=m[k]??DEFAULT_MOUTH[k];});},
  dispose};
}

// Each of the painter's mouths (face.js MOOD) as a modelled face's mouth: corners (smile, + up), width, open (units), round
// (an O), box (a yell, a grimace), upper (the share of the opening above the line), teeth and lowTeeth, tongue, asym (her
// left corner up: a smirk), pucker, pout, thin (pressed), wobble, shift (to one side).
const MOUTHS=Object.freeze({
 rest:{},
 smile:{smile:1.6,width:1.05},soft:{smile:.7},
 grin:{smile:2.6,width:1.12,open:3.6,upper:.2,teeth:1},laugh:{smile:2.6,width:1.14,open:9,upper:.18,teeth:1,tongue:.8},
 wide:{smile:2.2,width:1.14,open:1.6,upper:.25,teeth:.6},
 frown:{smile:-3,width:.9,pout:.4},flat:{smile:-1.2,width:.96,thin:.4},wobble:{smile:-1.3,width:.92,wobble:1},
 small:{smile:.4,width:.72},hmm:{smile:-.4,width:.82,asym:1.4},smirk:{smile:.6,asym:2.6},
 snarl:{smile:-2.2,open:1.8,upper:.7,teeth:1,asym:-1,thin:.4},teeth:{smile:-1.2,width:1.14,open:2.6,box:.9,upper:.5,teeth:1,lowTeeth:1},
 gritted:{smile:-1.2,width:1.14,open:2.2,box:1,upper:.5,teeth:1,lowTeeth:1},
 o:{open:7,round:1,width:.62,upper:.38},jawdrop:{open:12,round:.6,width:.82,upper:.32,teeth:.8,lowTeeth:.3},
 wail:{smile:-1.8,width:1.04,open:10,box:.6,upper:.4,teeth:.8,tongue:.5},yawn:{open:10,round:.75,width:.72,upper:.4,tongue:.4},
 pucker:{pucker:1,round:.85,width:.55,open:.4,pout:.4},kiss:{pucker:1,round:.85,width:.55,pout:.4},bleh:{smile:1,open:3,upper:.5,tongue:1},
 drool:{smile:.8,open:1,upper:.4},
});
export const MOUTH_KEYS=Object.freeze(['smile','width','open','round','teeth','tongue','asym','pucker','wobble','shift','box','upper','lowTeeth','thin','pout']);
const DEFAULT_MOUTH=Object.freeze({smile:0,width:1,open:0,round:0,teeth:0,tongue:0,asym:0,pucker:0,wobble:0,shift:0,box:0,upper:.3,lowTeeth:0,thin:0,pout:0});
// Never twins (the creator's critique, 26 October 2026): each feeling's own lean, one side against the other. brow: added
// to [lift, tilt] of her left and her right brow; mouth: added to the mouth (shift: the mouth drawn to one side).
const LEAN=Object.freeze({
 angry:{left:[.2,-.15],right:[-.5,.3],mouth:{asym:.4}},grumpy:{left:[0,0],right:[-.6,.35],mouth:{asym:.6,shift:.8}},
 fuming:{right:[-.5,.3],mouth:{asym:.5}},raging:{right:[-.4,.3]},focus:{right:[-.4,.2]},scheme:{left:[.8,0],mouth:{asym:.8}},
 sad:{left:[.3,0],mouth:{shift:-.6}},worried:{left:[.5,-.2],mouth:{shift:-1,asym:-.3}},shy:{right:[.4,0],mouth:{shift:1.1}},
 embarrassed:{left:[.4,0],mouth:{shift:.9}},dismay:{left:[.4,0],mouth:{shift:-.8}},
 surprised:{left:[.7,0]},shock:{left:[.6,0],mouth:{shift:.4}},scared:{left:[.6,-.2],mouth:{shift:-.5}},excited:{left:[.5,0]},
 thinking:{left:[2.2,0],right:[-.6,.3],mouth:{shift:1.4}},hmm:{left:[2.2,0]},smile:{left:[.25,0],mouth:{asym:.25}},
 happy:{right:[.3,0],mouth:{asym:.3}},laugh:{left:[.4,0],mouth:{shift:.5}},
});

/**
 * What the face's features do in a face state ({expression, talk, blinkLeft, blinkRight}): the brows' [lift, tilt, arch,
 * pinch, outer, straight, bunch] each side (BROW_KEYS), the mouth, and how far the cheeks rise, the nose scrunches and the jaw drops (pixar.js moves those
 * bones). `acting`, a character's own performance (face-acting.js), plays a feeling its own way: its brows, mouth, cheeks,
 * nose and jaw replace the painter's where it says; `base`, the body's own mouth under every feeling's. Pure, for tests.
 */
export function featuresOf(state={},acting=null,base=null){
 const mood=moodOf(state.expression),talk=THREE.MathUtils.clamp(+state.talk||0,0,1),act=acting?.[state.expression]||null;
 const mouth={...DEFAULT_MOUTH,...(base||{}),...(act?.mouth||MOUTHS[mood.mouth||'rest']||MOUTHS.rest)};
 // Talking opens a vowel over whatever the mouth is doing (the jaw comes with it), a little narrower.
 mouth.open=Math.min(14,mouth.open+talk*4.2);mouth.width*=1-.08*talk;mouth.teeth=Math.max(mouth.teeth,.45*talk);
 // The brows: the painter's lift and angle (its canvas units) in hers; a smug brow up on her left; the wink's side down.
 const lift=(mood.browLift||0)*.32,tilt=(mood.brow||0)*2.1,pinch=Math.max(0,mood.brow||0)*1.4;
 const winkL=mood.eyes==='wink'||state.blinkLeft>.5&&!(state.blinkRight>.5),winkR=state.blinkRight>.5&&!(state.blinkLeft>.5);
 let left=[lift+(mood.oneBrow?mood.oneBrow*.32:0),tilt,(mood.browLift||0)>8?.6:0,pinch],right=[lift,tilt,(mood.browLift||0)>8?.6:0,pinch];
 // Pain: the brows knitted down and together, the nose wrinkled, the cheeks pushed up under squeezed eyes, teeth clenched.
 const pain=mood.eyes==='pain';
 if(pain)for(const b of [left,right]){b[0]=-1;b[1]=2.8;b[3]=2.4;}
 const lean=act?null:LEAN[state.expression];
 if(lean){for(const [b,d] of [[left,lean.left],[right,lean.right]])if(d){b[0]+=d[0];b[1]+=d[1];}
  for(const [k,v] of Object.entries(lean.mouth||{}))mouth[k]+=v;}
 if(act?.brows){left=[...act.brows.left];right=[...act.brows.right];}
 // a wink (or one eye shut by a performance) pulls that brow down
 if(winkL&&!(act?.brows&&mood.eyes==='wink')){left[0]-=1.6;left[1]+=.8;}
 if(winkR){right[0]-=1.6;right[1]+=.8;}
 // The cheeks rise with a smile (and on a wink's side, and in pain), the nose scrunches with anger, pain and a big laugh.
 const smile=THREE.MathUtils.clamp(mouth.smile/2.6,0,1),happyEyes=['happy','smiling','content'].includes(mood.eyes)?.6:0;
 const cheeks=act?.cheeks?[...act.cheeks]:[Math.max(smile,happyEyes,pain?.8:0)+(winkL?.7:0),Math.max(smile,happyEyes,pain?.8:0)+(winkR?.7:0)].map(v=>Math.min(1,v));
 const scrunch=act?.scrunch??Math.min(1,Math.max(0,(mood.brow||0)/1.6)+(pain?.9:0)+(['laugh','gritted','teeth','snarl'].includes(mood.mouth)?.5:0));
 // A captured performance (acting.js applyActorFrame) lifts the brows and the corners of the mouth on top.
 const browBy=(+state.actingBrow||0)*3.8,smileBy=(+state.actingSmile||0)*2.2;
 if(browBy){left[0]+=browBy;right[0]+=browBy;}
 if(smileBy)mouth.smile+=smileBy;
 // The jaw drops with the mouth: the chin comes down and back, lengthening the face.
 const jaw=Math.min(1,act?.jaw!=null?Math.max(act.jaw,talk*.42):mouth.open/10);
 // (every feeling's brows as all seven numbers, BROW_KEYS: those a feeling leaves out are 0, so springs and mixes line up)
 const f={brows:{left:fullBrow(left),right:fullBrow(right)},mouth,cheeks,scrunch,jaw};
 // ...and plays the feeling at its strength (performance.js): part of the way from her resting face
 const strength=THREE.MathUtils.clamp(state.expressionStrength??1,0,1);
 if(strength<1&&state.expression!=='neutral')return mixFeatures(featuresOf({...state,expression:'neutral',expressionStrength:1},acting,base),f,strength);
 return f;
}

/** A brow's numbers, in order: [lift, tilt, arch, pinch] (the painter's four) and [outer, straight, bunch] (an evil brow's:
 *  the outer end up on its own, the turn a straight line, the inner end bunched thicker). */
export const BROW_KEYS=Object.freeze(['lift','tilt','arch','pinch','outer','straight','bunch']);
const fullBrow=b=>BROW_KEYS.map((k,i)=>+b[i]||0);

/** a + (b - a) k, through the features' arrays and objects. */
export function mixFeatures(a,b,k){
 if(typeof b==='number')return a+(b-a)*k;
 if(Array.isArray(b))return b.map((v,i)=>mixFeatures(a[i],v,k));
 return Object.fromEntries(Object.entries(b).map(([n,v])=>[n,mixFeatures(a[n],v,k)]));
}
