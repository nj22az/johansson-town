import {RISOGRAPH_GLSL,PENCIL_MANGA_GLSL,BRUSH_OIL_GLSL,RUBBER_STAMP_GLSL} from './print-media-shaders.js';
import {PENCIL_GLSL,WASH_GLSL,SURFACE_GLSL} from './illustration-modules.js';
/**
 * Looks: the whole town redrawn in another style, chosen under Settings in the Town book.
 *
 * Inspired by Super Mario Odyssey's Snapshot Mode as recreated by Daniel Ilett in
 * smo-shaders (MIT, https://github.com/daniel-ilett/smo-shaders): greyscale, sepia,
 * the hand-held and 16-bit pixel looks, the line drawing and the CRT. Manga and
 * Pencil crayon are this town's own, as are Miniature (tilt-shift), Woodblock
 * print (ukiyo-e), Watercolour and Oil painting (a Kuwahara filter). The shaders are written fresh for three.js;
 * Unity's HLSL does not port line for line.
 *
 * A look is one more full-screen pass at the very end of the ink pipeline
 * (ink-pipeline.js): it reads the finished, graded sRGB picture and the scene's depth,
 * and writes the screen. Natural adds no pass at all. Each look compiles the first
 * time it is chosen, never at startup. Only the 3D canvas is redrawn; menus, speech
 * and signs on the HUD stay as they are.
 *
 * Print patterns stay still; pencil strokes use rest/surface coordinates where available.
 * No pattern is driven by animation time.
 */

/** In the order the menu offers them. `css` is the stand-in where the town draws without the ink pipeline. */
export const LOOKS=Object.freeze({
 none:{label:'Natural',short:'Natural',hint:'The town as it is drawn.'},
 mono:{label:'Black & white',short:'B&W',hint:'Greyscale, a little punch in the contrast.',css:'grayscale(1) contrast(1.12)'},
 sepia:{label:'Sepia',short:'Sepia',hint:'An old brown photograph.',css:'sepia(.9) contrast(.95)'},
 pocket:{label:'Pocket Gentleman',short:'Pocket',hint:'Four greens and big pixels, like the hand-held camera.'},
 snes:{label:'16-bit',short:'16-bit',hint:'Chunky pixels and a short palette, like a cartridge game.'},
 lines:{label:'Line drawing',short:'Lines',hint:'Pencil outlines on white paper.'},
 crt:{label:'Old TV',short:'TV',hint:'A curved tube with scanlines.'},
 manga:{label:'Manga',short:'Manga',hint:'Black ink, screentone dots and hatching, as in a printed comic.'},
 crayon:{label:'Pencil crayon',short:'Crayon',hint:'Coloured pencil strokes on textured paper.'},
 tilt:{label:'Miniature',short:'Mini',hint:'Tilt-shift: the top and bottom go soft, and the island looks like a model.'},
 print:{label:'Woodblock print',short:'Print',hint:'Ukiyo-e: flat woodblock colours, bold outlines, a graded sky on paper.'},
 watercolour:{label:'Watercolour',short:'Paint',hint:'Soft washes that bleed and pool at their edges on rough paper.'},
 // 64 samples a pixel on a computer; phones and tablets draw the light version, 16 samples (lookFragment).
 flat:{label:'Cartoon',short:'Cartoon',hint:'Flat colours and thick outlines, like a TV cartoon.',flatten:0},
 oil:{label:'Oil painting',short:'Oil',hint:'Thick brushwork on canvas, with faces and lettering kept.'},
 sketchbook:{label:'Architectural sketchbook',short:'Sketch',hint:'Warm wash, broken pencil and porous graphite.'},
 riso:{label:'Risograph',short:'Riso',hint:'Experimental: coral and teal ink plates, grain and slight misregistration.',experimental:true},
 pencilManga:{label:'Pencil manga',short:'Pencil',hint:'Experimental: clean manga contours with broken graphite strokes in deep shadows.',experimental:true},
 brushOil:{label:'Heavy brush oil',short:'Brush',hint:'Experimental: broad directional paint dabs, with facial features and contours retained.',experimental:true},
 stamp:{label:'Rubber stamp',short:'Stamp',hint:'Experimental: worn burgundy ink, cut silhouettes and irregular pressure on warm paper.',experimental:true},
});

/** Where an earlier build saved the look. The owner (22 October 2026): every start is Natural, whatever was used last, so
 * the choice is not saved any more and an old saved one is removed (clearSavedLook). */
export const LOOK_KEY='johansson-town-look';
export const isLook=name=>Object.hasOwn(LOOKS,name);
const RETIRED_LOOKS=Object.freeze({storybook:'flat',sunday:'flat',gouache:'oil'});
export const retiredLook=name=>Object.hasOwn(RETIRED_LOOKS,name);
export const normalLook=name=>isLook(name)?name:retiredLook(name)?RETIRED_LOOKS[name]:'none';
/** How much of the town's photographic surface maps a look keeps (render/cel.js scaleFlatten): 1 unless it says. */
export const lookFlatten=name=>LOOKS[name]?.flatten??1;
export function clearSavedLook(storage){try{storage?.removeItem(LOOK_KEY);}catch{}}
/** The CSS filter for the canvas when there is no pipeline to run the look: only the colour looks have one. */
export const lookCSS=name=>LOOKS[name]?.css||'none';
/** Whether a look can show at all without the ink pipeline. */
export const lookNeedsPipeline=name=>name!=='none'&&!LOOKS[name]?.css;

// Shared by every look. tDiffuse is the graded sRGB picture; tDepth the scene's depth.
const COMMON=`
#include <packing>
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform mat4 uProjectionInverse;
uniform mat4 uCameraWorld;
uniform float uComic;
uniform float uFocusMode;
uniform float uFocusDistance;
uniform float uFocusRange;
uniform float uDepthPacked;
float readDepth(vec2 uv){vec4 d=texture2D(tDepth,uv);return uDepthPacked>.5?dot(d.rgb,vec3(65536.0,256.0,1.0))*(255.0/16777215.0):d.x;}
uniform vec2 uTexel;
uniform vec2 uResolution;
uniform float uNear,uFar,uSkyDepth;
varying vec2 vUv;

float luma(vec3 c){return dot(c,vec3(0.2126,0.7152,0.0722));}
float viewDepth(vec2 uv){
#ifdef HAS_DEPTH
 return -perspectiveDepthToViewZ(readDepth(uv),uNear,uFar);
#else
 return 1.0;
#endif
}
float distanceFade(vec2 uv,float near,float far){
#ifdef HAS_DEPTH
 return 1.0-smoothstep(near,far,viewDepth(uv));
#else
 return 1.0;
#endif
}
vec3 surfacePosition(vec2 uv){
#ifdef HAS_DEPTH
 vec4 p=uProjectionInverse*vec4(uv*2.0-1.0,readDepth(uv)*2.0-1.0,1.0);
 return (uCameraWorld*vec4(p.xyz/p.w,1.0)).xyz;
#else
 return vec3(uv*uResolution/1080.0,0.0);
#endif
}
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);
}
// Ordered dither thresholds without an array (GLSL ES 1.0 cannot index one by a variable).
float bayer2(vec2 a){a=floor(a);return fract(dot(a,vec2(0.5,a.y*0.75)));}
float bayer4(vec2 a){return bayer2(0.5*a)*0.25+bayer2(a);}
// How much of a device pixel at 1080 lines one pattern pixel is, so patterns keep their size on any screen.
float unit(){return max(1.0,uResolution.y/1080.0);}

// Outlines: the second difference of depth (silhouettes and creases, as the ink pass
// finds them) plus a luminance Sobel (painted detail, window frames, signs).
float edges(vec2 uv,float width,float detail){
 vec3 anchor=surfacePosition(uv);
 float pressure=0.78+0.44*noise(anchor.xy*3.7+anchor.z*0.23);
 vec2 t=uTexel*width*pressure;
 float dc=viewDepth(uv);
#ifdef HAS_DEPTH
 // The second difference of 1/depth, not of depth: 1/depth changes evenly across any flat surface in a perspective
 // view, so a road or a floor seen at a grazing angle gives exactly nothing however wide the line, while a silhouette
 // (the far side drops away) and a crease still do. Depth's own second difference grows on a grazing plane with the
 // square of the line's width, and its rounding then drew wavy stripes across the ground.
 float ic=1.0/dc;
 float sx=(1.0/viewDepth(uv-vec2(t.x,0.0))+1.0/viewDepth(uv+vec2(t.x,0.0))-2.0*ic)*dc;
 float sy=(1.0/viewDepth(uv+vec2(0.0,t.y))+1.0/viewDepth(uv-vec2(0.0,t.y))-2.0*ic)*dc;
 // Fixed-point depth still rounds a little, so a crease has to stand clear of that.
 float shape=smoothstep(0.012,0.03,max(0.0,-sx)+max(0.0,-sy));
#else
 float shape=0.0;
#endif
#ifdef HAS_NORMALS
 vec4 nc=texture2D(tNormal,uv);
 float bend=0.0;
 for(int k=0;k<4;k++){vec2 d=k==0?vec2(t.x,0.0):k==1?vec2(-t.x,0.0):k==2?vec2(0.0,t.y):vec2(0.0,-t.y);vec4 nn=texture2D(tNormal,uv+d);bend=max(bend,length(nc.rgb-nn.rgb)*min(nc.a,nn.a));}
 shape=max(shape,smoothstep(0.08,0.24,bend));
#endif
 // A Sobel on colour, not brightness alone: a light-blue collar on a light-blue shirt differs in hue far more than in
 // lightness. Close by it looks a little harder, so a figure's own lines (collar, pocket, cuffs) are drawn.
 vec3 tl=texture2D(tDiffuse,uv+vec2(-t.x,t.y)).rgb,tc=texture2D(tDiffuse,uv+vec2(0.0,t.y)).rgb,tr=texture2D(tDiffuse,uv+t).rgb;
 vec3 ml=texture2D(tDiffuse,uv-vec2(t.x,0.0)).rgb,mr=texture2D(tDiffuse,uv+vec2(t.x,0.0)).rgb;
 vec3 bl=texture2D(tDiffuse,uv-t).rgb,bc=texture2D(tDiffuse,uv-vec2(0.0,t.y)).rgb,br=texture2D(tDiffuse,uv+vec2(t.x,-t.y)).rgb;
 vec3 gx=(tr+2.0*mr+br)-(tl+2.0*ml+bl),gy=(tl+2.0*tc+tr)-(bl+2.0*bc+br);
 float g=length(vec2(length(gx),length(gy)))*0.577;
 float close=distanceFade(uv,4.0,14.0);
 float paint=smoothstep(mix(0.32,0.2,close),mix(0.62,0.42,close),g)*detail;
 float e=max(shape,paint);
 // Distance thins the lines out, so the horizon is not scribbled over.
 return e*distanceFade(uv,uSkyDepth*0.35,uSkyDepth);
}
`;

// Spot blacks, as an inker fills them: a small mark much darker than what is around it (an eye, a brow, a letter) is
// filled solid, close by. The rings are wider than such a mark and narrower than a dark doorway, so big dark areas are
// still only outlined rather than blotted out.
const SPOT=`
float spotBlack(vec2 uv,float u){
 // Three rings, because an eye seen close fills more of the screen than a ring can reach across: the mark counts as dark
 // against whichever ring sees round it.
 float c=luma(texture2D(tDiffuse,uv).rgb),best=0.0;
 for(int r=0;r<3;r++){
  float radius=r==0?6.0:r==1?14.0:28.0,ring=0.0;
  for(int k=0;k<8;k++){float a=float(k)*0.785398+float(r)*0.39;ring+=luma(texture2D(tDiffuse,uv+vec2(cos(a),sin(a))*uTexel*radius*u).rgb);}
  best=max(best,ring/8.0-c);
 }
 // Filled or not, rather than greyed: a half-tone fill read as a smudge. Only marks that are themselves dark.
 return smoothstep(0.13,0.22,best)*(1.0-smoothstep(0.30,0.46,c))*distanceFade(uv,6.0,16.0);
}
`;

const FRAGMENTS={
 mono:`
void main(){
 vec3 c=texture2D(tDiffuse,vUv).rgb;
 float l=clamp((dot(c,vec3(0.28,0.60,0.12))-0.5)*1.18+0.5,0.0,1.0);
 l=mix(l,l*l*(3.0-2.0*l),0.58);
 gl_FragColor=vec4(vec3(l),1.0);
}`,
 sepia:`
void main(){
 vec3 c=texture2D(tDiffuse,vUv).rgb;
 float l=clamp((luma(c)-0.48)*1.12+0.5,0.0,1.0);
 vec3 shadow=vec3(0.17,0.085,0.035),paper=vec3(0.985,0.945,0.835);
 gl_FragColor=vec4(mix(shadow,paper,smoothstep(0.015,0.99,l)),1.0);
}`,
 // The Pocket Gentleman's four greens (pocket-camera.js), over 144 lines, ordered dither.
 pocket:`
void main(){
 float px=max(2.0,floor(uResolution.y/144.0));
 vec2 cell=floor(vUv*uResolution/px);
 vec2 centre=(cell+0.5)*px/uResolution;
 float l=luma(texture2D(tDiffuse,centre).rgb);
 l=clamp((l-0.14)*1.4,0.0,1.0);
 float shade=floor(clamp(l*3.0+bayer4(cell)-0.5,0.0,3.0)+0.5);
 shade=mix(shade,0.0,step(.72,edges(centre,px,.85)));
 vec3 c=shade<0.5?vec3(24.0,48.0,32.0):shade<1.5?vec3(62.0,98.0,56.0):shade<2.5?vec3(130.0,158.0,76.0):vec3(200.0,212.0,138.0);
 gl_FragColor=vec4(c/255.0,1.0);
}`,
 // 256 lines, sixteen steps a channel, a light dither between them.
 snes:`
void main(){
 float px=max(2.0,floor(uResolution.y/240.0));
 vec2 cell=floor(vUv*uResolution/px);
 vec3 c=texture2D(tDiffuse,(cell+0.5)*px/uResolution).rgb;
 vec3 palette[16];
 palette[0]=vec3(.07,.09,.13);palette[1]=vec3(.21,.19,.27);palette[2]=vec3(.36,.25,.23);palette[3]=vec3(.57,.35,.27);
 palette[4]=vec3(.77,.52,.36);palette[5]=vec3(.94,.73,.51);palette[6]=vec3(1.0,.90,.69);palette[7]=vec3(.98,.98,.92);
 palette[8]=vec3(.18,.35,.32);palette[9]=vec3(.31,.53,.37);palette[10]=vec3(.57,.70,.43);palette[11]=vec3(.22,.35,.54);
 palette[12]=vec3(.42,.60,.70);palette[13]=vec3(.70,.78,.73);palette[14]=vec3(.68,.24,.24);palette[15]=vec3(.87,.64,.24);
 c+=vec3((bayer4(cell)-.5)*.075);
 vec3 ink=palette[0];float best=100.0;
 for(int i=0;i<16;i++){vec3 delta=(c-palette[i])*vec3(1.0,1.2,.9);float d=dot(delta,delta);if(d<best){best=d;ink=palette[i];}}
 c=ink;
 float boundary=edges((cell+.5)*px/uResolution,px,0.30);
 c=mix(c,palette[0],step(.82,boundary)*.8);
 gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);
}`,
 lines:`
void main(){
 float u=unit();
 vec2 p=vUv*uResolution/u;
 vec3 paper=vec3(0.985,0.975,0.95)-0.035*noise(p*0.45);
 float e=edges(vUv,1.2*u,0.8);
 // A touch of tone in the darkest places, so a dark doorway does not read as paper.
 float l=luma(texture2D(tDiffuse,vUv).rgb);
 float tone=(1.0-smoothstep(0.08,0.3,l))*0.22;
 gl_FragColor=vec4(mix(paper,vec3(0.17,0.17,0.2),clamp(max(max(e,tone),spotBlack(vUv,u)),0.0,1.0)),1.0);
}`,
 crt:`
void main(){
 vec2 q=vUv*2.0-1.0;
 q*=1.0+dot(q,q)*vec2(0.035,0.05);
 vec2 uv=q*0.5+0.5;
 if(any(lessThan(uv,vec2(0.0)))||any(greaterThan(uv,vec2(1.0)))){gl_FragColor=vec4(0.0,0.0,0.0,1.0);return;}
 float fringe=pow(length(q),2.0)*1.35*uTexel.x;
 vec3 c=vec3(texture2D(tDiffuse,uv+vec2(fringe,0.0)).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-vec2(fringe,0.0)).b);
 // A soft bleed of the neighbouring colour, as a tube smears.
 c=mix(c,texture2D(tDiffuse,uv+vec2(uTexel.x*2.0,0.0)).rgb,0.25);
 float lines=uResolution.y/max(2.0,floor(uResolution.y/270.0));
 float scan=0.78+0.22*cos(uv.y*lines*6.2831853);
 float slot=mod(floor(gl_FragCoord.x/max(1.0,unit())),3.0);
 vec3 mask=slot<0.5?vec3(1.0,0.86,0.86):slot<1.5?vec3(0.86,1.0,0.86):vec3(0.86,0.86,1.0);
 c*=scan*mask*1.12;
 // The tube's own vignette: the corners fall away.
 vec2 v=uv*(1.0-uv.yx);
 c*=pow(clamp(v.x*v.y*18.0,0.0,1.0),0.16);
 gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);
}`,
 // Printed-comic black and white: solid ink outlines, white highlights, a 45-degree
 // screentone in the mid tones that grows into hatching and then solid black.
 manga:`
float tone(vec2 p,float l){
 // Dots on a rotated grid, their radius from how dark it is; anti-aliased edges.
 vec2 r=mat2(0.7071,-0.7071,0.7071,0.7071)*p/6.0;
 float d=length(fract(r)-0.5);
 float radius=sqrt(clamp(1.0-l,0.0,1.0))*0.56419;
 return 1.0-smoothstep(radius-0.08,radius+0.08,d);
}
float hatch(vec2 p,vec2 dir,float spacing,float width){
 float s=abs(fract(dot(p,dir)/spacing)-0.5)*spacing;
 return 1.0-smoothstep(width-0.6,width+0.6,s);
}
void main(){
 float u=unit();
 vec2 p=vUv*uResolution/u;
 vec3 c=texture2D(tDiffuse,vUv).rgb;
#ifdef HAS_DEPTH
 // Flat graphic backdrops already contain their own ink. Threshold their fills once,
 // without outlining both sides of every speed ray or screening its paper.
 if(readDepth(vUv)>.999999){gl_FragColor=vec4(vec3(step(.35,luma(c))),1.0);return;}
#endif
 float l=clamp((luma(c)-0.5)*1.25+0.52,0.0,1.0);
 // Discrete printable tones: clean paper, 20%, 48%, 72%, then spot ink.
 float density=l>.80?0.0:l>.48?.20:l>.23?.48:l>.095?.72:1.0;
 float ink=density<.001?0.0:density>.99?1.0:tone(p,1.0-density);
 // Cross-hatching is reserved for the darkest screened tone, not skin and walls.
 if(l<.16&&l>.095)ink=max(ink,hatch(p,vec2(.7071,-.7071),9.0,.7));
#ifdef HAS_DEPTH
 if(viewDepth(vUv)>uSkyDepth)ink=min(ink,tone(p,.94));
#endif
 ink=max(ink,max(edges(vUv,1.5*u,1.0),spotBlack(vUv,u)));
 // One-bit pigment: tone coverage comes from the dots, never a grey wash below them.
 gl_FragColor=vec4(vec3(1.0-step(.5,ink)),1.0);
}`,
 // Coloured pencil on rough paper: the colour goes down in diagonal strokes that skip
 // the paper's tooth, a second layer crosses the darks, and a graphite outline.
 crayon:`
float strokes(vec2 p,vec2 dir,float spacing){
 float along=dot(p,vec2(-dir.y,dir.x));
 float across=dot(p,dir)+noise(vec2(along*0.02,dot(p,dir)*0.05))*4.0;
 float lane=floor(across/spacing);
 // Each stroke has its own pressure, and fades in and out along its length.
 float pressure=0.55+0.45*hash(vec2(lane,7.0));
 float body=1.0-abs(fract(across/spacing)-0.5)*2.0;
 float segment=floor(along/28.0+hash(vec2(lane,11.0)));
 float phase=fract(along/28.0+hash(vec2(lane,11.0)));
 float run=smoothstep(.03,.16,phase)*(1.0-smoothstep(.68,.94,phase));
 float wax=smoothstep(.17,.67,noise(p*2.4+hash(vec2(lane,segment))*7.0));
 return smoothstep(0.15,0.75,body)*pressure*run*mix(.22,1.0,wax);
}
void main(){
 float u=unit();
 vec2 p=vUv*uResolution/u;
 vec3 c=texture2D(tDiffuse,vUv).rgb;
 float l=luma(c);
 // Pencils are brighter and softer than paint: lift the colour towards pastel.
#ifdef HAS_DEPTH
 vec3 surface=surfacePosition(vUv);
 vec3 n=vec3(0.0,0.0,1.0);
#ifdef HAS_NORMALS
 n=abs((uCameraWorld*vec4(texture2D(tNormal,vUv).rgb*2.0-1.0,0.0)).xyz);
#endif
 p=(n.z>n.x&&n.z>n.y?surface.xy:n.y>n.x?surface.xz:surface.zy)*150.0;
#endif
 vec3 pigment=clamp(mix(vec3(l),c,1.18)*0.92+0.04,0.0,1.0);
 float tooth=noise(p*0.9)*0.6+noise(p*2.3)*0.4;
 vec3 paper=vec3(0.975,0.96,0.93)-0.05*tooth;
 float dark=1.0-l;
 float cover=strokes(p,vec2(.7071,.7071),4.0)*(1.0-smoothstep(.70,.75,l));
 cover=max(cover,strokes(p,vec2(.5,-.866),3.5)*(1.0-smoothstep(.38,.45,l)));
 // The pigment catches on the tooth's peaks first.
 cover*=smoothstep(0.15,0.65,tooth+cover*0.6);
 #ifdef SURFACE_STROKES
 float chroma=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));
 float wash=mix(.18,.86,smoothstep(.035,.18,chroma));
 cover=max(wash,1.0-smoothstep(.60,.94,l));
#else
 cover=clamp(cover*1.25,0.0,1.0)*(1.0-smoothstep(.76,.94,l));
#endif
 vec3 col=mix(paper,pigment*mix(vec3(1.0),paper,0.12),cover);
 // A little burnish where the darkest colour is pressed hard.
 col=mix(col,pigment*0.82,smoothstep(0.7,0.95,dark)*0.5);
 // Graphite lines, wobbling a little as a hand-drawn line does.
 vec2 wobble=(vec2(noise(p*0.05),noise(p*0.05+17.0))-0.5)*uTexel*2.5*u;
 float e=edges(vUv+wobble,1.3*u,0.7)*(0.55+0.45*noise(p*0.3));
 vec3 graphite=mix(vec3(.24,.23,.26),vec3(.192,.184,.208),uComic);
 col=mix(col,graphite,clamp(e,0.0,1.0)*mix(.85,1.0,uComic));
 gl_FragColor=vec4(col,1.0);
}`,
 // Tilt-shift: a sharp band across the middle and a growing blur above and below it, with the colour lifted a
 // little, as a photograph of a model railway. The blur is a golden-angle disc of 24 taps.
 tilt:`
void main(){
 float u=unit();
 vec3 c=texture2D(tDiffuse,vUv).rgb;
#ifdef HAS_DEPTH
 float centreDepth=viewDepth(vUv);
 float focus=uFocusDistance>0.0?uFocusDistance:viewDepth(vec2(.5));if(focus>uSkyDepth)focus=6.0;
 float radius=uFocusMode>.5?smoothstep(.07,.42,abs(vUv.y-.46))*16.0*u:smoothstep(0.0,max(.1,uFocusRange),abs(centreDepth-focus))*12.0*u;
#else
 // Legacy picture-only panels retain an explicit 2D tilt-shift approximation.
 float away=abs(vUv.y-0.46);
 float radius=smoothstep(0.07,0.42,away)*16.0*u;
#endif
 if(radius>0.4){
  vec3 sum=c;float n=1.0;
  for(int i=1;i<24;i++){
   float fi=float(i),r=sqrt(fi/24.0)*radius,a=fi*2.39996;
   vec2 sampleUV=vUv+vec2(cos(a),sin(a))*r*uTexel;
#ifdef HAS_DEPTH
   float weight=1.0-smoothstep(.15,.75,abs(viewDepth(sampleUV)-centreDepth));
#else
   float weight=1.0;
#endif
   sum+=texture2D(tDiffuse,sampleUV).rgb*weight;n+=weight;
  }
  c=sum/n;
 }
 float l=luma(c);
 c=mix(vec3(l),c,1.45);
 c=(c-0.5)*1.12+0.53;
 gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);
}`,
 // Ukiyo-e: every colour goes to the nearest of a woodblock printer's few inks, printed flat on cream paper with a
 // key-block outline; the sky becomes the printed gradient (bokashi) from Prussian blue to paper.
 print:`
vec3 inkFor(vec3 c){
 vec3 best=vec3(0.0);float d=1e9;
 vec3 inks[10];
 inks[0]=vec3(0.95,0.91,0.81);inks[1]=vec3(0.12,0.23,0.37);inks[2]=vec3(0.18,0.36,0.54);inks[3]=vec3(0.56,0.70,0.79);
 inks[4]=vec3(0.78,0.27,0.18);inks[5]=vec3(0.85,0.64,0.25);inks[6]=vec3(0.49,0.60,0.42);inks[7]=vec3(0.16,0.14,0.13);
 inks[8]=vec3(0.90,0.74,0.57);inks[9]=vec3(0.54,0.35,0.23);
 for(int i=0;i<10;i++){vec3 rgb=c-inks[i];vec3 e=vec3(dot(rgb,vec3(.25,.5,.25)),rgb.r-rgb.b,rgb.g-(rgb.r+rgb.b)*.5);float k=dot(e*vec3(2.0,.55,.7),e*vec3(2.0,.55,.7));if(k<d){d=k;best=inks[i];}}
 return best;
}
void main(){
 float u=unit();
 vec2 p=vUv*uResolution/u;
 vec3 c=texture2D(tDiffuse,vUv).rgb;
 // A little more colour first, so pale painted walls still find their ink.
 float l=luma(c);
 vec3 col=inkFor(clamp(mix(vec3(l),c,1.35),0.0,1.0));
 if(viewDepth(vUv)>uSkyDepth){
  float t=smoothstep(0.55,1.0,vUv.y);
  col=mix(vec3(0.93,0.89,0.79),vec3(0.17,0.33,0.52),t);
 }
 // Paper and wood grain show through the ink, stronger along the grain.
 float grain=noise(vec2(p.x*0.04,p.y*0.9))*0.6+noise(p*0.5)*0.4;
 col*=0.94+0.08*grain;
 float e=edges(vUv+vec2(.9,-.65)*uTexel*u,1.4*u,0.9);
 col=mix(col,vec3(0.13,0.11,0.10),clamp(e,0.0,1.0));
 gl_FragColor=vec4(col,1.0);
}`,
 // Watercolour: the colour is sampled a little off where it belongs (the wash wanders), lightened as a transparent
 // pigment, darkened where washes meet (the wet edge), and granulated by rough paper.
 watercolour:`
void main(){
 float u=unit();
 vec2 p=vUv*uResolution/u;
 // The wash wanders off the drawing, a few pixels and on two scales.
 vec2 wander=((vec2(noise(p*0.012),noise(p*0.012+31.0))-0.5)*6.0+(vec2(noise(p*0.06),noise(p*0.06+7.0))-0.5)*2.0)*uTexel*u;
 vec2 uv=vUv+wander;
 vec3 sum=vec3(0.0);
 for(int i=0;i<8;i++){float a=float(i)*0.785398;sum+=texture2D(tDiffuse,uv+vec2(cos(a),sin(a))*uTexel*3.0*u).rgb;}
 vec3 soft=sum/8.0;
 // Fewer, flatter tones: a painter mixes a handful of washes, not every shade.
 soft=floor(soft*6.0+0.5)/6.0*0.6+soft*0.4;
 vec3 paper=vec3(0.985,0.97,0.935);
 // Transparent pigment over paper, darker and lighter in blooms across each wash.
 float bloom=noise(p*0.008)*0.6+noise(p*0.03)*0.4;
 vec3 wash=mix(paper,soft,0.72+0.18*bloom);
 // Where washes meet, the pigment pools and dries to a darker rim.
 float edge=edges(uv,1.8*u,1.0);
 wash=mix(wash,soft*0.62,clamp(edge,0.0,1.0)*0.75);
 // Rough paper: pigment settles in the hollows (granulation).
 float tooth=noise(p*0.55)*0.55+noise(p*1.7)*0.45;
 wash*=0.88+0.16*tooth;
 // Some of the white of the paper is left unpainted in the lightest places.
 wash=mix(wash,paper,smoothstep(0.8,0.95,luma(soft))*0.7);
 gl_FragColor=vec4(clamp(wash,0.0,1.0),1.0);
}`,
 // Cartoon: the town's surface photographs are taken away before this pass (LOOKS.flat.flatten, render/cel.js), so
 // what arrives is cel-shaded flat colour. Here the last grain is smoothed out, the tones go to a few flat steps with
 // their hue kept, the colour is brightened, and thick, slightly wandering outlines are inked over it. Faces and
 // lettering are kept as in the oil painting.
 flat:`
void main(){
 float u=unit();
 vec2 p=vUv*uResolution/u;
 vec2 t=uTexel*1.7*u;
 vec3 m[4];vec3 s[4];
 for(int k=0;k<4;k++){m[k]=vec3(0.0);s[k]=vec3(0.0);}
 for(int j=0;j<=1;j++)for(int i=0;i<=1;i++){
  vec2 o=vec2(float(i)*2.0+0.5,float(j)*2.0+0.5);
  vec3 a=texture2D(tDiffuse,vUv+vec2(-o.x,-o.y)*t).rgb;m[0]+=a;s[0]+=a*a;
  vec3 b=texture2D(tDiffuse,vUv+vec2(o.x,-o.y)*t).rgb;m[1]+=b;s[1]+=b*b;
  vec3 c=texture2D(tDiffuse,vUv+o*t).rgb;m[2]+=c;s[2]+=c*c;
  vec3 d=texture2D(tDiffuse,vUv+vec2(-o.x,o.y)*t).rgb;m[3]+=d;s[3]+=d*d;
 }
 vec3 col=vec3(0.0);float best=1e9;
 for(int k=0;k<4;k++){
  vec3 mean=m[k]/4.0;vec3 v=abs(s[k]/4.0-mean*mean);
  float var=v.r+v.g+v.b;
  if(var<best){best=var;col=mean;}
 }
 vec3 orig=texture2D(tDiffuse,vUv).rgb;
 float depth=viewDepth(vUv),near=1.0-smoothstep(9.0,22.0,depth);
 // Far off, a fine pattern (brick paving) is already a faint moiré; picking the calmest corner would sharpen it into
 // wavy stripes, so from 8 m out the picture is kept as it is.
 col=mix(col,orig,smoothstep(8.0,20.0,depth));
 col=mix(col,orig,smoothstep(0.08,0.2,abs(luma(orig)-luma(col)))*near);
 // A few flat tones, hue kept: shading gradients become steps, as on a painted cel.
 float l=luma(col);
 vec3 hue=col/max(l,0.03);
 float steps=l<.32?.24:l<.68?.52:.86;
 // Step brightness only. Cap the common gain rather than clipping separate channels:
 // wood, grey walls and skin keep their hue instead of neon saturation bands.
 float stepped=mix(l,steps,.48*(1.0-smoothstep(8.0,20.0,depth)));
 col=hue*stepped;
 col/=max(1.0,max(col.r,max(col.g,col.b)));
 vec3 shadowTint=mix(vec3(.94,.93,.98),vec3(1.0),smoothstep(.25,.55,l));
 col*=shadowTint;
 // Thick ink, wandering a little as a brush pen does.
 vec2 wob=(vec2(noise(p*0.035),noise(p*0.035+9.0))-0.5)*uTexel*2.5*u;
 // Ink follows the shapes (depth); painted pattern (block walls, small print) gets only a light line.
 float e=max(edges(vUv+wob,2.4*u,0.35),spotBlack(vUv,u));
 // The thick ink is for what is near; further off the ink pass's own thin outline carries on, as a cartoon background
 // is drawn finer.
 e*=1.0-smoothstep(25.0,50.0,depth);
 col=mix(col,vec3(0.17,0.13,0.13),clamp(e*1.3,0.0,1.0));
 gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`,
 // Oil painting: a Kuwahara filter (each pixel takes the mean of whichever of its four neighbouring squares is
 // calmest), so areas flatten into strokes and edges stay crisp, on a canvas weave.
 oil:`
void main(){
 float u=unit();
 vec2 p=vUv*uResolution/u;
 vec2 t=uTexel*3.2*u;
 float xx=0.0,yy=0.0,xy=0.0;
 for(int k=0;k<5;k++){
  vec2 q=k==0?vUv:k==1?vUv+vec2(2.0*u*uTexel.x,0.0):k==2?vUv-vec2(2.0*u*uTexel.x,0.0):k==3?vUv+vec2(0.0,2.0*u*uTexel.y):vUv-vec2(0.0,2.0*u*uTexel.y);
  vec3 gx=texture2D(tDiffuse,q+vec2(uTexel.x*u,0.0)).rgb-texture2D(tDiffuse,q-vec2(uTexel.x*u,0.0)).rgb;
  vec3 gy=texture2D(tDiffuse,q+vec2(0.0,uTexel.y*u)).rgb-texture2D(tDiffuse,q-vec2(0.0,uTexel.y*u)).rgb;
  xx+=dot(gx,gx);yy+=dot(gy,gy);xy+=dot(gx,gy);
 }
 float trace=xx+yy,anisotropy=clamp(sqrt((xx-yy)*(xx-yy)+4.0*xy*xy)/max(trace,.00001),0.0,1.0);
 float angle=trace>.00001?.5*atan(2.0*xy,xx-yy)+1.570796:0.0;
 vec2 along=vec2(cos(angle),sin(angle)),across=vec2(-along.y,along.x);
 mat2 brush=mat2(along*mix(1.0,1.65,anisotropy),across*mix(1.0,.65,anisotropy));
 // A phone or tablet (LIGHT) takes 2x2 samples a square, spread over the same reach, instead of 4x4.
#ifdef LIGHT
 const int R=1;const float STEP=2.0;const float OFF=0.5;const float N=4.0;
#else
 const int R=4;const float STEP=1.0;const float OFF=0.0;const float N=25.0;
#endif
 vec3 m[4];vec3 s[4];
 for(int k=0;k<4;k++){m[k]=vec3(0.0);s[k]=vec3(0.0);}
 for(int j=0;j<=R;j++)for(int i=0;i<=R;i++){
  vec2 o=vec2(float(i)*STEP+OFF,float(j)*STEP+OFF);
  vec3 a=texture2D(tDiffuse,vUv+(brush*vec2(-o.x,-o.y))*t).rgb;m[0]+=a;s[0]+=a*a;
  vec3 b=texture2D(tDiffuse,vUv+(brush*vec2(o.x,-o.y))*t).rgb;m[1]+=b;s[1]+=b*b;
  vec3 c=texture2D(tDiffuse,vUv+(brush*o)*t).rgb;m[2]+=c;s[2]+=c*c;
  vec3 d=texture2D(tDiffuse,vUv+(brush*vec2(-o.x,o.y))*t).rgb;m[3]+=d;s[3]+=d*d;
 }
 vec3 col=vec3(0.0);float best=1e9;
 for(int k=0;k<4;k++){
  vec3 mean=m[k]/N;vec3 v=abs(s[k]/N-mean*mean);
  float var=v.r+v.g+v.b;
  if(var<best){best=var;col=mean;}
 }
 // A restrained light-catching ridge between clustered paint dabs, not the canvas grid.
 float ridge=clamp(length(fwidth(col))*3.0,0.0,1.0);
 col+=col*.05*ridge;
 // What a painter puts back last, as flat marks over the paint: anything small that is much darker than the stroke
 // painted over it (eyes, brows, a mouth, letters) as a thick dark mark, and anything much lighter (a highlight in an
 // eye, white letters on a dark sign) as a flat light one. The darks are taken from a small ring around the pixel, which
 // thickens each mark so a face reads from across the street. Close by only; further off it is all brushwork.
 float near=distanceFade(vUv,9.0,22.0);
 float base=luma(col),dark=0.0;
 for(int k=0;k<8;k++){
  float a=float(k)*0.785398;
  dark=max(dark,base-luma(texture2D(tDiffuse,vUv+vec2(cos(a),sin(a))*uTexel*1.25*u).rgb));
 }
 float light=luma(texture2D(tDiffuse,vUv).rgb)-base;
 dark=max(dark,base-luma(texture2D(tDiffuse,vUv).rgb));
 col=mix(col,vec3(0.97,0.95,0.9),smoothstep(0.1,0.22,light)*near);
 col=mix(col,vec3(0.16,0.12,0.11),smoothstep(0.1,0.22,dark)*near*0.9);
 col=mix(vec3(luma(col)),col,1.35);
 col=(col-0.5)*1.1+0.5;
 // Brush strokes: short diagonal marks catching the light, and the canvas weave under them.
 vec2 q=mat2(0.8,-0.6,0.6,0.8)*p;
 float stroke=noise(vec2(q.x*0.035,q.y*0.32));
 float weave=(sin(p.x*1.9)*sin(p.y*1.9))*0.5+0.5;
 float thinPaint=smoothstep(.65,.95,luma(col));
 col*=1.0+thinPaint*((stroke-.5)*.035+(weave-.5)*.016);
 gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`
};
FRAGMENTS.sketchbook=`${PENCIL_GLSL}${WASH_GLSL}${SURFACE_GLSL}
void main(){float u=unit();vec3 raw=texture2D(tDiffuse,vUv).rgb;float lum=luma(raw);vec2 p=illustrationCoord(vUv);
vec3 paint=wetEdge(paperWash(mix(vec3(lum),raw,.68),.86),vUv);
#ifndef SURFACE_STROKES
paint*=1.0-.32*pencilShade(p,lum);
#endif
// Strengthen comic colour only; the approved World sketch wash remains unchanged.
paint=mix(vec3(luma(paint)),paint,mix(1.0,1.25,uComic));
float graphite=max(edges(vUv,1.3*u,.45)*(.36+.38*noise(p*.7)),spotBlack(vUv,u));
vec3 pencil=mix(vec3(.24,.22,.23),vec3(.192,.176,.184),uComic);
paint=mix(paint,pencil,clamp(graphite,0.0,1.0));gl_FragColor=vec4(clamp(paint,0.0,1.0),1.0);}`;

FRAGMENTS.riso=RISOGRAPH_GLSL;
FRAGMENTS.pencilManga=`${PENCIL_GLSL}${SURFACE_GLSL}${PENCIL_MANGA_GLSL}`;
FRAGMENTS.brushOil=BRUSH_OIL_GLSL;
FRAGMENTS.stamp=RUBBER_STAMP_GLSL;

/** The full fragment shader for a look, or null for Natural. `light` asks for the version a phone or tablet can afford. */
export function lookFragment(name,{light=false,depth=true,normals=false,surfaceStrokes=false}={}){
 const body=FRAGMENTS[name];
 return body?(light?'#define LIGHT\n':'')+(surfaceStrokes?'#define SURFACE_STROKES\n':'')+(depth?'#define HAS_DEPTH\n':'')+(normals?'#define HAS_NORMALS\n':'')+COMMON+SPOT+body:null;
}

export const lookNormals=name=>['lines','manga','crayon','flat','print','sketchbook','riso','pencilManga','brushOil','stamp'].includes(name);
export const lookSurfaceStrokes=name=>['crayon','sketchbook'].includes(name);

/** Whether a look samples the scene's depth (and so must be fed the depth texture). */
export const lookUsesDepth=name=>/viewDepth|edges\(/.test(FRAGMENTS[name]||'');
