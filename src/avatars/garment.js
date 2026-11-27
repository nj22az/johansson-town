import * as THREE from '../../vendor/three.module.js';
import {hemSpec} from './springs.js';
import {POLICE_UNIFORM} from './police-data.js';

/**
 * The shirt, painted.
 *
 * Collars, plackets, buttons, pockets and prints used to be little pieces of geometry
 * stuck on the torso -- white triangles, grey balls, flowers half sunk into the cloth --
 * each with its own ink outline. Close up it read as clutter. A Tomodachi Life Mii wears
 * one smooth garment with its details drawn on: a collar is a shape with a line round
 * it, a button is a dot. So the torso keeps its vertex colour (the cloth, which the ink
 * outline follows) and a texture laid round it by angle and height draws the details
 * over it. Transparent texels leave the cloth as it is.
 *
 * The texture: u runs once round the body, 0.5 at the front (+z) and the seam at the
 * back; v carries the torso from just below the hips (t=T0) to the top of the neck
 * (t=T1). Below it, a band carries the sleeves (both share it: u runs round the arm,
 * 0.5 at its front, v down from the shoulder to the hem or cuff). The strip at the very
 * bottom is left empty for every other part of the body to sample.
 */
export const GARMENT=Object.freeze({width:512,height:352,V0:.3,T0:-.1,T1:1.05,SLEEVE:Object.freeze({v0:.06,v1:.28})});
/** Where every part that is not the torso samples: the empty strip. */
export const PLAIN_UV=Object.freeze([.5,.02]);

/** The torso's UV at a model-space point, from the lathe's angle and the torso height. */
export function torsoUV(p,m){
 const u=.5+Math.atan2(p.x/(m.width/2),p.z/(m.depth/2))/(Math.PI*2);
 const t=(p.y-m.hipY)/m.torso;
 return [u,GARMENT.V0+(1-GARMENT.V0)*THREE.MathUtils.clamp((t-GARMENT.T0)/(GARMENT.T1-GARMENT.T0),0,1)];
}

/** A sleeve's UV at a model-space point: round the arm from a (shoulder) to b (hem). */
export function sleeveUV(p,a,b,side){
 const ax=b[0]-a[0],ay=b[1]-a[1],az=b[2]-a[2],len=Math.hypot(ax,ay,az)||1;
 const rx=p.x-a[0],ry=p.y-a[1],rz=p.z-a[2],t=THREE.MathUtils.clamp((rx*ax+ry*ay+rz*az)/(len*len),0,1);
 // The arm hangs down, so round it is the x-z plane; the front (+z) is u = 0.5 either side.
 const u=.5+Math.atan2(rx*side,rz)/(Math.PI*2),S=GARMENT.SLEEVE;
 return [u,S.v1-(S.v1-S.v0)*t];
}

const shade=(hex,f)=>'#'+new THREE.Color(hex).multiplyScalar(f).getHexString();
const lighten=(hex,f)=>'#'+new THREE.Color(hex).lerp(new THREE.Color('#ffffff'),f).getHexString();
/** What is worn under an open top (recipe outfit.under): the white ribbed tank top, its scoop neck's lowest point (a
 *  fraction of the torso's height) and how far out its straps' inner edges are (a fraction of the open neck's top). */
export const UNDER=Object.freeze({tank:Object.freeze({colour:'#f2efe6',scoop:.865,strap:.8})});
/**
 * The island shirt (the kariyushi, an aloha shirt), shaped as a garment before anything is printed on it (the owner's
 * brief of 27 November 2026, for Johansson: "Shape the shirt before painting the flowers"). Lengths in metres at k=1.
 *
 * `collar`: a low, open camp collar, one piece of cloth: "a narrow band wraps around the nape and folds forwards into two
 * short points, leaving a small V of white undershirt below the throat". It is drawn on the chart of collarChart: α the
 * angle round the torso (0 the front, π the back; the wearer's left is α > 0) and s how far down the body from where the
 * neck goes into it, negative up the neck.
 *  - `stand`: how far its fold stands up the neck at the back and at the sides; it comes down to nothing at the V, so the
 *    fold runs down into the V's corners (`vee`, α) and in profile the neck shows well below the jaw;
 *  - `fall`: how far the band lies down over the shoulders and the back from the neck;
 *  - `point`, `foot`, `centre`: [α, s] of each short point, the foot of its lower edge by the top button, and the V's
 *    bottom; the point's upper edge runs from the V's corner, so each leaf is one shape with one point (no notch);
 *  - `gap`: its inside clear of the neck; `clear`: its underside clear of the shirt it lies on, `spring` more at the fall's
 *    edge, which springs a little off the back as folded cloth does; `thick`: the cloth.
 * `body`: the shirt below the chest falls free of the torso, "with a little air at the waist": from `top` (a share of the
 *  torso above the hip joint, where it leaves the chest) it hangs straight down from the widest of the body above, `gap`
 *  clear of it and easing out to its hem by `easeZ` in front and behind and `easeX` at the sides (the arms hang there);
 *  `hem` is its hem's height above the hip joint, nearly level, at the upper hip, untucked, so the shorts show; `turn`
 *  the hem's turned edge, `lining` how far up its inside is drawn (a share of the torso), `swing` where its lower part
 *  starts to swing on the hem quarters (a share of the torso; springs.js).
 */
export const KARIYUSHI=Object.freeze({
 collar:Object.freeze({gap:.006,clear:.004,spring:.004,thick:.006,stand:Object.freeze({back:.018,side:.011}),rise:.9,fall:.036,
  vee:.36,point:Object.freeze([.66,.1]),foot:Object.freeze([.13,.112]),centre:Object.freeze([.03,.112])}),
 body:Object.freeze({top:.56,gap:.003,easeX:.005,easeZ:.018,hem:.015,turn:.006,lining:.3,swing:.2}),
});
/**
 * The chart the collar is drawn on (KARIYUSHI.collar). Each α is one upright half-plane through the body's axis, the
 * torso lathe's own meridian (so α is torsoUV's angle: u = 0.5 + α/2π); in it the neck and the torso are one line, s
 * metres along it from the neck's foot, the corner there rounded off as cloth spans it rather than followed into it.
 *  at(α,s,lift): the point `lift` metres out from that line, [x,y,z] in the body's space;
 *  t(α,s): the line's height there, as a share of the torso (for painting).
 */
const charts=new Map();
export function collarChart(m,radiusAt,{steps=144,ds=.0015,round=.012}={}){
 // (one body's chart, made once: the painter and the builder both read it)
 const key=[m.width,m.depth,m.torso,m.neckR,m.hipY,m.k,steps,ds,round,...Array.from({length:33},(_,i)=>radiusAt(.4+i*.02))].map(v=>v.toFixed(5)).join();
 if(charts.has(key))return charts.get(key);
 if(charts.size>64)charts.clear();
 const W=m.width/2,D=m.depth/2,T=m.torso,up=.05*m.k,R=Math.round(round*m.k/ds),lines=[];
 for(let i=0;i<steps;i++){
  const a=i/steps*Math.PI*2,ex=W*Math.sin(a),ez=D*Math.cos(a),E=Math.hypot(ex,ez);
  // where this meridian leaves the neck
  let t=1.04;while(t>.4&&radiusAt(t)*E<m.neckR)t-=.0005;
  const ySeam=m.hipY+t*T,raw=[];
  for(let y=ySeam+up;y>ySeam;y-=ds)raw.push([m.neckR,y]);
  // (down the body as far as the collar's leaves reach, and a hand more)
  for(let u=t;u>t-.3;u-=.001)raw.push([radiusAt(u)*E,m.hipY+u*T]);
  // evenly along it, ds apart
  const even=[raw[0]];let carry=0;
  for(let j=1;j<raw.length;j++){const [r0,y0]=raw[j-1],[r1,y1]=raw[j],l=Math.hypot(r1-r0,y1-y0);let at=ds-carry;
   while(at<=l){even.push([r0+(r1-r0)*at/l,y0+(y1-y0)*at/l]);at+=ds;}carry=l-(at-ds);}
  const seam=Math.round(up/ds);
  // the corner at the neck's foot spanned: averaged over `round` either side of it, nothing changed further off
  const line=even.map((p,j)=>{const w=1-THREE.MathUtils.smoothstep(Math.abs(j-seam),R,R*2);if(w<=0)return p;
   let r=0,y=0,n=0;for(let q=Math.max(0,j-R);q<=Math.min(even.length-1,j+R);q++){r+=even[q][0];y+=even[q][1];n++;}
   return [p[0]+(r/n-p[0])*w,p[1]+(y/n-p[1])*w];});
  // out from it: the line turned a quarter (it runs down the body)
  const normal=line.map((p,j)=>{const a0=line[Math.max(0,j-1)],a1=line[Math.min(line.length-1,j+1)],dr=a1[0]-a0[0],dy=a1[1]-a0[1],l=Math.hypot(dr,dy)||1;return [-dy/l,dr/l];});
  lines.push({dir:[ex/E,ez/E],line,normal,seam});
 }
 const sample=(L,s,lift)=>{const f=THREE.MathUtils.clamp(L.seam+s/ds,0,L.line.length-1.001),j=Math.floor(f),w=f-j,p=L.line[j],q=L.line[j+1],n=L.normal[j],o=L.normal[j+1];
  const r=p[0]+(q[0]-p[0])*w+lift*(n[0]+(o[0]-n[0])*w),y=p[1]+(q[1]-p[1])*w+lift*(n[1]+(o[1]-n[1])*w);return [r*L.dir[0],y,r*L.dir[1]];};
 const pick=(a,fn)=>{const f=(((a/(Math.PI*2))%1+1)%1)*steps,i=Math.floor(f)%steps,w=f-Math.floor(f),A=fn(lines[i]),B=fn(lines[(i+1)%steps]);return A.map((v,k)=>v+(B[k]-v)*w);};
 const chart={at:(a,s,lift=0)=>pick(a,L=>sample(L,s,lift)),t:(a,s)=>(pick(a,L=>sample(L,s,0))[1]-m.hipY)/T};
 charts.set(key,chart);return chart;
}
/**
 * The camp collar as a strip on the chart (KARIYUSHI.collar): its inner edge and its outer edge, as [α, s] pairs of equal
 * length, α from 0 to 2π (the back at π), each pair one line across the cloth. The inner edge runs up the V's edge on the
 * wearer's left, along the fold round the back and down the other V's edge; the outer edge, from the same V bottom, out
 * along the leaf's lower edge to its point, back up its upper edge until it meets the fall's edge, round the back and
 * down the other leaf to the other V bottom. Pairs no further apart along either edge than about `step` metres (α
 * counted at `R` metres a radian); the corners (the point, the foot) are pairs of their own.
 */
export function collarStrip(m,{step=.011,R=.14}={}){
 const C=KARIYUSHI.collar,k=m.k,TAU=Math.PI*2,S=THREE.MathUtils.smoothstep,Rk=R*k,bend=1.05;
 const stand=a=>{const f=Math.min(a,TAU-a);return k*S(f,C.vee,C.vee+C.rise)*THREE.MathUtils.lerp(C.stand.side,C.stand.back,S(f,Math.PI/2,Math.PI));};
 const P=[C.point[0],C.point[1]*k],F=[C.foot[0],C.foot[1]*k],N=[C.centre[0],C.centre[1]*k],A=[C.vee,0],fall=C.fall*k;
 // where the point's upper edge, from the V's corner, comes out from under the fall's edge
 const X=[A[0]+(P[0]-A[0])*fall/P[1],fall];
 const lerp=(p,q,f)=>[p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f],dist=(p,q)=>Math.hypot((q[0]-p[0])*Rk,q[1]-p[1]),count=l=>Math.max(1,Math.ceil(l/(step*k)));
 const inner=[],outer=[];
 // the leaf: the V's edge from its bottom to its corner, against the lower edge, the point and the upper edge to X
 const legs=[[N,F],[F,P],[P,X]],lengths=legs.map(([p,q])=>dist(p,q)),total=lengths.reduce((a,b)=>a+b,0);let done=0;
 legs.forEach(([p,q],i)=>{const n=count(Math.max(lengths[i],dist(N,A)*lengths[i]/total));for(let j=0;j<n;j++){outer.push(lerp(p,q,j/n));inner.push(lerp(N,A,(done+lengths[i]*j/n)/total));}done+=lengths[i];});
 // from the V's corner and X, the fold and the fall's edge together to where the band is whole, then round the back
 const turnN=count((bend-C.vee)*Rk);for(let j=0;j<turnN;j++){const a=C.vee+(bend-C.vee)*j/turnN;inner.push([a,-stand(a)]);outer.push([X[0]+(bend-X[0])*j/turnN,fall]);}
 const backN=count((Math.PI-bend)*Rk);for(let j=0;j<=backN;j++){const a=bend+(Math.PI-bend)*j/backN;inner.push([a,-stand(a)]);outer.push([a,fall]);}
 // and the other side, mirrored (the middle of the back, α = π, once)
 const half=inner.length,mirror=([a,s])=>[TAU-a,s];
 for(let j=half-2;j>=0;j--){inner.push(mirror(inner[j]));outer.push(mirror(outer[j]));}
 return {inner,outer};
}
/** The collar's outline (collarStrip), closed, as [α, s]: its inner edge, then its outer edge back. */
export function collarOutline(m){const {inner,outer}=collarStrip(m);return [...inner,...outer.slice(1,-1).reverse()];}
const COLLARED=['contrastpolo','polo','blouse','kariyushi','jacket','smock','cardigan','shirt','vest','knitvest','baseball'];
/**
 * Tops worn over a shirt (a vest, a knitted vest): the body is the top, and the shirt under it shows at the neck and is
 * the sleeves, the shoulders and the underarms, in the accent colour (build.js addBody).
 */
export const SHIRT_SLEEVES=Object.freeze(['vest','knitvest','stripedvest']);
/**
 * Tops whose sleeves (with the shoulder caps and the underarms) are their own cloth in the accent colour: the raglan tee,
 * whose sleeves run up to the neck in a contrasting colour (build.js addBody).
 */
export const ACCENT_SLEEVES=Object.freeze(['raglan']);
/** Tops whose arm under a short sleeve is an undershirt in the accent colour, not skin (the Seagulls jersey). */
export const UNDERSHIRT_ARMS=Object.freeze(['baseball']);
/** Long-sleeved tops whose sleeve ends before the wrist, as a fraction of the arm from shoulder to wrist. */
export const SLEEVE_END=Object.freeze({festival:.66});
/** Lettering on cloth: a rounded gothic for a sewn name patch, a script for a team's name, a heavy face for a number. */
const GOTHIC='"Hiragino Maru Gothic ProN","Yu Gothic","Noto Sans CJK JP","Noto Sans",system-ui,sans-serif';
const SCRIPT='Georgia,"Times New Roman","Noto Serif",serif';
const NUMERALS='"Arial Black","Helvetica Neue",Arial,"Noto Sans",sans-serif';
/** The team's name across the Seagulls jersey's chest: our own lettering, not any real club's. */
export const JERSEY_LETTERING='Minato';
/**
 * The name on a PE shirt's patch: the wearer's name as it fits the patch. A long name is set smaller, down to 60%, and
 * then cut: after its last whole word that fits ("Higa Kenta" → "Higa"), or, for one long word, at a character (never in
 * the middle of one). Pure: `measure(text)` is the width at full size, in the patch's units, and `width` the room.
 * Returns {text, scale}.
 */
export function patchName(name,measure,width,min=.6){
 const text=String(name||'').trim(),w=text?measure(text):0;
 if(!text||w<=width)return {text,scale:1};
 if(w*min<=width)return {text,scale:width/w};
 const chars=Array.from(text);while(chars.length>1&&measure(chars.join(''))*min>width)chars.pop();
 const next=Array.from(text)[chars.length],space=chars.lastIndexOf(' ');
 const kept=next!==' '&&space>0?chars.slice(0,space):chars;
 return {text:kept.join('').trim(),scale:min};
}

/**
 * Paints a top's details onto ctx. Pure drawing from the recipe and the body's
 * measurements; returns the list of what was drawn, for tests and the studio.
 */
export function paintGarment(ctx,recipe,m,radiusAt){
 const {width:TW,height:TH,V0,T0,T1}=GARMENT,o=recipe.outfit,top=o.topColour,top0=top,marks=[];
 ctx.clearRect(0,0,TW,TH);
 const W=m.width,D=m.depth;
 const Y=t=>(1-(V0+(1-V0)*(t-T0)/(T1-T0)))*TH;
 // The angle round the lathe at which the cloth is x metres across from the centre line.
 const theta=(x,t)=>Math.asin(THREE.MathUtils.clamp(x/(W/2*Math.max(.05,radiusAt(t))),-1,1));
 const X=(x,t,back=false)=>{const a=theta(x,t);return (.5+(back?Math.PI-a:a)/(Math.PI*2))*TW;};
 const pxPerY=(1-V0)*TH/((T1-T0)*m.torso);
 const pxPerX=(a,t)=>TW/(Math.PI*2)/(Math.max(.05,radiusAt(t))*Math.hypot(W/2*Math.cos(a),D/2*Math.sin(a)));
 const ink=shade(top,.5),line=Math.max(1.5,TW/300);
 // The back straddles the seam at u=1: draw it once each side.
 const wrapped=(back,fn)=>{fn();if(back){ctx.save();ctx.translate(-TW,0);fn();ctx.restore();}};
 const poly=(pts,fill,{stroke=ink,back=false,width=line}={})=>wrapped(back,()=>{
  ctx.beginPath();pts.forEach(([x,t],i)=>{const px=X(x,t,back),py=Y(t);i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();}
 });
 const path=(pts,stroke,width=line,back=false)=>{ctx.beginPath();pts.forEach(([x,t],i)=>{const px=X(x,t,back),py=Y(t);i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();};
 // A round thing of radius r metres at x,t on the front, kept round on the curved cloth.
 const dotAt=(x,t,r,fill,stroke=null)=>{
  const a=theta(x,t);ctx.beginPath();ctx.ellipse(X(x,t),Y(t),r*pxPerX(a,t),r*pxPerY,0,0,Math.PI*2);
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line*.8;ctx.stroke();}
 };
 const buttons=(ts,r,fill)=>{for(const t of ts)dotAt(0,t,r*m.k,fill,shade(fill,.6));marks.push('buttons:'+ts.length);};
 /**
  * Words on the cloth, centred at x,t (on the back when `back`), letters `h` metres tall and kept upright and in proportion
  * on the curved cloth. `fit` (metres) is the room across: a patch's name is set smaller and then cut (patchName).
  * `font` is [style and weight, family].
  */
 const words=(text,x,t,h,{fill,stroke=null,strokeW=0,font:[weight,family],back=false,fit=Infinity})=>{
  ctx.save();ctx.font=`${weight} 100px ${family}`;
  const unit=h/72,{text:shown,scale}=patchName(text,s=>ctx.measureText(s).width*unit,fit);
  if(shown){
   const a=theta(x,t),sx=pxPerX(a,t)*unit*scale,sy=pxPerY*unit*scale;
   wrapped(back,()=>{ctx.save();ctx.translate(X(x,t,back),Y(t));ctx.scale(sx,sy);ctx.textAlign='center';ctx.textBaseline='middle';
    if(stroke){ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.lineWidth=strokeW/(unit*scale);ctx.strokeText(shown,0,0);}
    ctx.fillStyle=fill;ctx.fillText(shown,0,0);ctx.restore();});
  }
  ctx.restore();return shown;
 };
 // An island shirt is worn out over the shorts, so its cloth (and print) runs down to its own hem (springs.js).
 const out=o.top==='kariyushi'||o.top==='police'?hemSpec(recipe,m):null;
 const k=m.k,neck=.92,hem=out?Math.max(GARMENT.T0+.02,(out.waist-out.length-m.hipY)/m.torso+.01):.15;

 // Stripes and prints first, so collars and pockets sit over them.
 if(o.pattern==='stripes'&&!['tank','overalls','sundress'].includes(o.top)){
  const band=m.torso*.12*pxPerY,from=Y(1.0),to=Y(hem);
  ctx.fillStyle='#f4f1ea';for(let y=to-band;y>from;y-=band*2)ctx.fillRect(0,Math.max(from,y-band),TW,Math.min(band,y-from));
  marks.push('stripes');
 }
 // A checked shirt: pale bands across and down, a fine line of the accent through each.
 if(o.pattern==='check'&&!['tank','overalls','sundress'].includes(o.top)){
  const band=m.torso*.085*pxPerY,from=Y(1.0),to=Y(hem),step=band*2.3;
  ctx.save();ctx.globalAlpha=.5;ctx.fillStyle='#f4f1ea';
  for(let y=to-band;y>from;y-=step)ctx.fillRect(0,Math.max(from,y-band),TW,Math.min(band,y-from));
  for(let x=step*.25;x<TW;x+=step)ctx.fillRect(x,from,band,to-from);
  ctx.globalAlpha=.55;ctx.fillStyle=o.accent;
  for(let y=to-band*1.5;y>from;y-=step)ctx.fillRect(0,y,TW,Math.max(1,band*.14));
  for(let x=step*.25+band*.43;x<TW;x+=step)ctx.fillRect(x,from,Math.max(1,band*.14),to-from);
  ctx.restore();marks.push('check');
 }
 if(o.pattern==='flowers'||o.pattern==='dots'){
  const flowers=o.pattern==='flowers',big=o.top==='kariyushi';
  const r=k*(flowers?(big?.05:.036):.016),petal=flowers?'#f8f6ef':o.accent,centre='#f4c83c';
  // A half-drop repeat, as printed cloth is, with a little play so it is not a grid.
  const cols=flowers?(big?7:8):14,rows=flowers?(big?4:5):9,spots=[];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const j=Math.abs(Math.sin(row*12.9898+col*78.233)*43758.5453)%1;
   spots.push([((col+(row%2)*.5+j*.18)/cols)*Math.PI*2-Math.PI,hem+.07+(row+.5+j*.15)/rows*(neck-hem-.1),row*cols+col]);
  }
  for(const [a,t,i] of spots){
   // Leave the button line clear on a shirt that opens down the front.
   if(COLLARED.includes(o.top)&&Math.abs(a)<.2)continue;
   const cx=(.5+a/(Math.PI*2))*TW,cy=Y(t),sx=r*pxPerX(a,t),sy=r*pxPerY;
   for(const off of [0,-TW,TW]){
    ctx.save();ctx.translate(cx+off,cy);ctx.scale(sx,sy);ctx.rotate(i*.7);
    if(flowers){
     ctx.fillStyle=petal;for(let p=0;p<5;p++){ctx.beginPath();ctx.ellipse(Math.cos(p*1.2566)*.5,Math.sin(p*1.2566)*.5,.42,.42,0,0,Math.PI*2);ctx.fill();}
     ctx.fillStyle=centre;ctx.beginPath();ctx.arc(0,0,.28,0,Math.PI*2);ctx.fill();
    }else{ctx.fillStyle=petal;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();}
    ctx.restore();
   }
  }
  marks.push(o.pattern);
 }

 // The neckline: a rib round a crew neck, the opening of a shirt.
 const rib=(colour=shade(top,.86))=>{ctx.fillStyle=colour;ctx.fillRect(0,Y(1.03),TW,Y(.985)-Y(1.03));ctx.strokeStyle=ink;ctx.lineWidth=line*.8;ctx.beginPath();ctx.moveTo(0,Y(.985));ctx.lineTo(TW,Y(.985));ctx.stroke();marks.push('neckline');};
 // A pair of folded collar points either side of the front, out from the neck.
 const collar=(fill,{drop=.84,spread=.115,round=false}={})=>{
  for(const s of [-1,1]){
   if(round){
    const pts=[];for(let i=0;i<=10;i++){const a=i/10*Math.PI;pts.push([s*(.012+Math.sin(a)*spread*.62)*k,1.0-(1-Math.cos(a))*.5*(1-drop)*1.2]);}
    pts.push([s*.012*k,1.0]);poly(pts,fill);
   }else poly([[s*.008*k,.99],[s*spread*k,1.0],[s*spread*.9*k,.95],[s*.03*k,drop]],fill);
  }
  // Round the back of the neck the collar is a band.
  ctx.fillStyle=fill;ctx.fillRect(0,Y(1.035),TW,Y(.975)-Y(1.035));
  ctx.fillRect(X(-.012*k,.99),Y(1.035),X(.012*k,.99)-X(-.012*k,.99),Y(.985)-Y(1.035));
  ctx.strokeStyle=ink;ctx.lineWidth=line*.8;ctx.beginPath();ctx.moveTo(0,Y(.975));ctx.lineTo(X(-spread*k,1.0),Y(.975));ctx.moveTo(X(spread*k,1.0),Y(.975));ctx.lineTo(TW,Y(.975));ctx.stroke();
  marks.push('collar');
 };
 const placket=(from,to,w=.022)=>{poly([[-w*k,from],[w*k,from],[w*k,to],[-w*k,to]],null,{width:line*.8});marks.push('placket');};
 const pocket=(x,t,w,h,fill=null)=>{poly([[x-w/2,t+h/2],[x+w/2,t+h/2],[x+w/2,t-h/2],[x-w/2,t-h/2]],fill,{width:line*.8});path([[x-w/2,t+h/2-.035],[x+w/2,t+h/2-.035]],ink,line*.6);marks.push('pocket');};
 const hemRound=()=>{ctx.strokeStyle=shade(top,.72);ctx.lineWidth=line*.7;ctx.beginPath();ctx.moveTo(0,Y(hem+.035));ctx.lineTo(TW,Y(hem+.035));ctx.stroke();};

 switch(o.top){
  case 'tee':rib();hemRound();break;
  case 'hoodie':{
   rib(shade(top,.9));
   // The kangaroo pocket and the drawstrings.
   const pw=W*.36,pt=.36;poly([[-pw,pt+.13],[pw,pt+.13],[pw*1.12,pt-.12],[-pw*1.12,pt-.12]],shade(top,.93));
   for(const s of [-1,1]){path([[s*.024*k,.97],[s*.03*k,.74]],o.accent,line*1.6);dotAt(s*.03*k,.73,.007*k,o.accent);}
   marks.push('pocket','drawstrings');hemRound();break;
  }
  case 'contrastpolo':
   poly([[-.024*k,.99],[.024*k,.99],[.024*k,.78],[-.024*k,.78]],o.accent);
   buttons([.9,.82],.0075,shade(o.accent,.85));marks.push('contrast placket','modelled collar');hemRound();break;
  case 'polo':collar(lighten(top,.12));placket(.97,.78);buttons([.9,.82],.0075,lighten(top,.5));hemRound();break;
  // The placket starts under the collar, where its two rounded halves meet, so the collar is one clean shape.
  case 'blouse':collar('#f8f6ef',{drop:.88,spread:.1,round:true});placket(.852,hem+.04,.018);buttons([.85,.69,.53,.37],.007,'#f8f6ef');break;
  case 'smock':collar('#f8f6ef',{drop:.88,spread:.1,round:true});pocket(0,.42,W*.5,.16,shade(top,.94));hemRound();break;
  case 'kariyushi':{
   // The camp collar itself is cloth, modelled round the neck and on the chest (build.js alohaCollar), drawn on the same
   // chart (collarChart). Here: the V it opens over, and its toon shadow, a hard-edged darker shape just below its edge
   // all the way round, so it lifts off the shirt instead of lying on it like a sticker.
   const skin=recipe.body.skin,fx=(f,t)=>f*W/2*radiusAt(t),C=KARIYUSHI.collar;
   const chart=collarChart(m,radiusAt),ua=a=>(.5+(a>Math.PI?a-Math.PI*2:a)/(Math.PI*2))*TW;
   const chartPoly=(pts,fill,back)=>wrapped(back,()=>{ctx.beginPath();pts.forEach(([a,s],i)=>{const px=ua(a)+(back&&a>Math.PI?TW:0),py=Y(chart.t(a,s));i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();});
   chartPoly(collarOutline(m).map(([a,s])=>[a,s+.013*k]),shade(top,.8),true);
   // the open neck: from where the collar's fold comes down the front of the neck, along the V's edges to the top button
   const neckF=Math.sin(C.vee),vBottom=chart.t(C.centre[0],C.centre[1]*k),vee=[];
   for(let i=0;i<=8;i++){const a=C.vee+(C.centre[0]-C.vee)*i/8,s=C.centre[1]*k*i/8;vee.push([a*1.08,chart.t(a,s)]);}
   const vPoly=[...vee.map(([a,t])=>[-Math.sin(a)*W/2*radiusAt(t),t]).reverse(),[-fx(neckF*1.08,1.03),1.03],[fx(neckF*1.08,1.03),1.03],...vee.map(([a,t])=>[Math.sin(a)*W/2*radiusAt(t),t])];
   poly(vPoly,skin,{stroke:null});
   marks.push('open neck','collar shadow');
   // A few clean curls of chest hair in the open collar (recipe.marks.chesthair).
   if(recipe.marks?.chesthair)wrapped(false,()=>{ctx.strokeStyle=shade(skin,.36);ctx.lineWidth=line*1.1;ctx.lineCap='round';
    for(const [f,t,turn] of [[0,.795,1],[-.085,.835,-1],[.085,.835,1],[-.17,.878,1],[0,.872,-1],[.17,.878,-1],[-.09,.915,-1],[.1,.918,1]]){
     const x=X(fx(f,t),t),y=Y(t),u=TW*.0105;ctx.beginPath();ctx.moveTo(x-u,y-u*.5);ctx.quadraticCurveTo(x,y+u*1.1*turn,x+u,y-u*.5*turn);ctx.stroke();}
    marks.push('chest hair');});
   // A white ribbed tank top worn under it (outfit.under 'tank'; the owner, 27 November 2026, of Johansson: "He should be
   // wearing a 'wife beater' tank top under his shirt"): in the V, its scoop neck between its straps, a little chest hair
   // above it, the cloth ribbed down from it, a bound edge. Clipped to the V: the shirt covers the rest.
   if(o.under==='tank')wrapped(false,()=>{
    const T=UNDER.tank,white=T.colour,u=[],strap=neckF*1.08*T.strap;
    for(let i=0;i<=28;i++){const f=-strap+2*strap*i/28,t=T.scoop+(1.035-T.scoop)*Math.pow(Math.abs(f)/strap,1.8);u.push([Math.sign(f)*fx(Math.abs(f),t),t]);}
    ctx.save();ctx.beginPath();vPoly.forEach(([x,t],i)=>{const px=X(x,t),py=Y(t);i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.closePath();ctx.clip();
    const outer=t=>fx(.75,t);
    poly([...u,[outer(1.035),1.035],[outer(.66),.66],[-outer(.66),.66],[-outer(1.035),1.035]],white,{stroke:null});
    // the ribs: fine lines down the cloth from its edge, a shade darker
    for(let f=-.6;f<=.6001;f+=.045){const top=Math.min(1.035,T.scoop+(1.035-T.scoop)*Math.pow(Math.min(1,Math.abs(f)/strap),1.8))-.012;
     path([[Math.sign(f)*fx(Math.abs(f),top),top],[Math.sign(f)*fx(Math.abs(f),.68),.68]],shade(white,.9),line*.45);}
    // the bound neck: its edge, and the binding's stitch just below it
    path(u.map(([x,t])=>[x,t-.008]),shade(white,.9),line*2.4);path(u,shade(white,.5),line*1.25);path(u.map(([x,t])=>[x,t-.017]),shade(white,.78),line*.55);
    ctx.restore();marks.push('tank top under');
   });
   // A centred placket from the V's bottom to the hem. The top button, just under the V, is a wooden one; the rest are
   // shell, a hand's width apart down to the hem.
   placket(vBottom,hem+.03,.02);buttons([vBottom-.03],.011,'#9a6a42');
   const shell=[];for(let t=vBottom-.165;t>hem+.06;t-=.135)shell.push(t);buttons(shell,.0085,'#f8f6ef');
   // The small patch pocket on the wearer's left chest (+x: the viewer's right from the front), below the collar's point.
   pocket(W*.24,.665,W*.18,.13,top);hemRound();break;
  }
  case 'jacket':{
   // Notched lapels over a white shirt, two buttons, flap pockets.
   poly([[-.06*k,1.0],[.06*k,1.0],[0,.66]],'#f4f1ea',{stroke:null});
   for(const s of [-1,1])poly([[s*.01*k,1.0],[s*.12*k,.99],[s*.13*k,.86],[s*.09*k,.84],[s*.1*k,.78],[s*.012*k,.62]],shade(top,.88));
   path([[0,.62],[0,hem]],ink,line*.8);buttons([.52,.4],.009,shade(top,.7));
   for(const s of [-1,1])path([[s*W*.16,.32],[s*W*.36,.32]],ink,line);marks.push('lapels','pocket');break;
  }
  case 'cardigan':{
   // Open down the front over a pale top, with ribbed bands and buttons.
   poly([[-.05*k,1.0],[.05*k,1.0],[.02*k,.7],[-.02*k,.7]],lighten(top,.7),{stroke:null});
   for(const s of [-1,1])poly([[s*.012*k,1.0],[s*.06*k,1.0],[s*.035*k,.7],[s*.035*k,hem],[s*.008*k,hem],[s*.008*k,.7]],o.accent,{width:line*.8});
   buttons([.62,.5,.38,.26],.008,shade(o.accent,.8));ctx.fillStyle=o.accent;ctx.fillRect(0,Y(hem+.05),TW,Y(hem)-Y(hem+.05));marks.push('bands');break;
  }
  case 'festival':{
   // A happi coat: its collar band runs round the back of the neck and straight down both fronts, the two bands side by
   // side to the hem with the coat's opening a clean line between them; a little of the chest shows at the throat, where
   // the bands part round the neck. A sash over it at the waist.
   poly([[-.05*k,1.0],[.05*k,1.0],[0,.86]],recipe.body.skin,{stroke:null});
   ctx.fillStyle=o.accent;ctx.fillRect(0,Y(1.035),TW,Y(.975)-Y(1.035));
   for(const s of [-1,1])poly([[s*.05*k,1.0],[s*.1*k,1.0],[s*.048*k,.84],[s*.048*k,hem],[0,hem],[0,.86]],o.accent);
   path([[0,.86],[0,hem]],ink,line);
   ctx.fillStyle=shade(o.accent,.85);ctx.fillRect(0,Y(.4),TW,Y(.3)-Y(.4));
   ctx.strokeStyle=ink;ctx.lineWidth=line*.8;ctx.beginPath();ctx.moveTo(0,Y(.4));ctx.lineTo(TW,Y(.4));ctx.moveTo(0,Y(.3));ctx.lineTo(TW,Y(.3));ctx.stroke();
   marks.push('bands','sash');break;
  }
  case 'sailorlong':
  case 'sailor':{
   // A square collar at the back, its points tied in a V at the front with a scarf.
   const c=o.accent,w=lighten(c,.85);
   wrapped(true,()=>{
    ctx.fillStyle=c;ctx.fillRect(X(-W*.3,.75,true),Y(1.03),X(W*.3,.75,true)-X(-W*.3,.75,true),Y(.72)-Y(1.03));
    ctx.strokeStyle=w;ctx.lineWidth=line*1.4;ctx.strokeRect(X(-W*.26,.75,true),Y(1.0),X(W*.26,.75,true)-X(-W*.26,.75,true),Y(.76)-Y(1.0));
   });
   for(const s of [-1,1]){poly([[s*.012*k,1.0],[s*.16*k,1.0],[s*.03*k,.66],[s*.0*k,.66]],c);path([[s*.13*k,.985],[s*.02*k,.69]],w,line*1.2);}
   poly([[-.045*k,.7],[.045*k,.7],[0,.56]],'#d8342c');marks.push('collar','scarf');break;
  }
  // The 1994 police jacket (police-data.js): its lapels, buttons, straps and badges are modelled (police-uniform.js);
  // here the white shirt and the indigo-grey tie in the V, the front edge, the breast pockets with their pleat and flap,
  // the flapped slots at the waist the holster and the baton come out of, and the side vents behind.
  case 'police':{
   const J=POLICE_UNIFORM.jacket,L=J.lapel,fx=(f,t)=>f*W/2*radiusAt(t),neck=L[0],foot=L.at(-1);
   poly([[-fx(neck[0],1.0),1.02],[fx(neck[0],1.0),1.02],[0,foot[1]]],J.shirt,{stroke:null});
   // The shirt's collar points in the V only: round the back of the neck the jacket's collar covers it.
   for(const sd of [-1,1])poly([[sd*.008*k,.99],[sd*.085*k,1.0],[sd*.075*k,.95],[sd*.026*k,.9]],J.shirt);
   poly([[-.017*k,.985],[.017*k,.985],[.021*k,.94],[-.021*k,.94]],J.tie,{width:line*.7});
   poly([[-.016*k,.94],[.016*k,.94],[.024*k,foot[1]+.03],[-.024*k,foot[1]+.03]],J.tie,{width:line*.7});
   path([[.004*k,foot[1]],[.004*k,hem]],ink,line*.9);
   const P=J.pockets;
   for(const s of [-1,1]){
    const cx=s*fx(P.f,P.t),w=fx(P.w,P.t),top=P.t+P.h/2,bot=P.t-P.h/2;
    poly([[cx-w/2,top],[cx+w/2,top],[cx+w/2,bot],[cx-w/2,bot]],shade(top0,.95),{width:line*.8});
    path([[cx,top-P.flap],[cx,bot+.01]],shade(top0,.7),line*.6);
    poly([[cx-w/2-.002*k,top+.008],[cx+w/2+.002*k,top+.008],[cx+w/2,top-P.flap],[cx-w/2,top-P.flap]],shade(top0,.9),{width:line*.8});
   }
   const S=J.slots;
   for(const s of [-1,1]){const xa=fx(Math.sin(S.at-S.w/2),S.t),xb=fx(Math.sin(Math.min(Math.PI/2-.01,S.at+S.w/2)),S.t);
    poly([[s*xa,S.t+S.h/2],[s*xb,S.t+S.h/2],[s*xb,S.t-S.h/2],[s*xa,S.t-S.h/2]],shade(top0,.9),{width:line*.8});}
   for(const s of [-1,1])path([[s*W*.26,hem],[s*W*.26,hem+.16]],ink,line*.8,true);
   marks.push('shirt and tie','pockets','slots','vents');hemRound();break;
  }
  case 'overalls':{
   // The bib, its straps and their buttons, in the trousers' cloth.
   const b=o.bottomColour,bw=W*.3,bt=.74;
   poly([[-bw,bt],[bw,bt],[bw*1.05,hem],[-bw*1.05,hem]],b);
   pocket(0,.58,bw*.9,.14,shade(b,.94));
   for(const s of [-1,1]){
    poly([[s*bw*.95,bt],[s*bw*.55,bt],[s*W*.18,1.0],[s*W*.32,1.0]],b,{width:line*.8});
    poly([[s*W*.32,1.0],[s*W*.18,1.0],[-s*W*.1,.5],[-s*W*.25,.5]],b,{back:true,width:line*.8});
    dotAt(s*bw*.75,bt-.03,.012*k,'#e2b84a',shade('#e2b84a',.6));
   }
   marks.push('bib','straps');break;
  }
  case 'sundress':for(const s of [-1,1]){poly([[s*W*.3,.8],[s*W*.18,.8],[s*W*.16,1.02],[s*W*.28,1.02]],top,{width:line*.8});poly([[s*W*.3,.8],[s*W*.18,.8],[s*W*.16,1.02],[s*W*.28,1.02]],top,{back:true,width:line*.8});}ctx.fillStyle=shade(top,.7);ctx.fillRect(0,Y(.795),TW,line*.8);marks.push('straps');break;
  case 'apron':collar('#f8f6ef',{drop:.88,spread:.1,round:true});break;
  // The island's office and school shirt: a point collar open at the throat, the placket starting under the collar where
  // its points meet, and a breast pocket on the wearer's left with a pen in it, in the accent colour.
  case 'shirt':{
   poly([[-.042*k,1.0],[.042*k,1.0],[0,.835]],recipe.body.skin,{stroke:null});
   collar(top,{drop:.83,spread:.12});placket(.835,hem+.03,.02);buttons([.76,.6,.44,.28],.0068,lighten(top,.55));
   const px=W*.22,pt=.66,ph=.13;
   poly([[px-.004*k,pt+ph/2+.06],[px+.004*k,pt+ph/2+.06],[px+.004*k,pt],[px-.004*k,pt]],o.accent,{width:line*.6});
   pocket(px,pt,W*.2,ph,top);path([[px+.0015*k,pt+ph/2+.045],[px+.0015*k,pt+ph/2-.025]],shade(o.accent,.7),line*.9);
   marks.push('pen');break;
  }
  // A vest over a shirt: the shirt (the accent colour) shows in the V, with its collar round the neck; four buttons, two
  // welt pockets. The shirt's sleeves are the arms (SHIRT_SLEEVES).
  case 'stripedvest':{
   // Open sleeveless vest over a Breton tee; the shirt and sleeves share the accent.
   const w=W*.32;
   poly([[-w,1.04],[w,1.04],[w*.95,hem],[-w*.95,hem]],o.accent,{stroke:null});
   for(let t=.24;t<1;t+=.13)poly([[-w,t],[w,t],[w,t+.035],[-w,t+.035]],top,{stroke:null});
   for(const s of [-1,1])path([[s*w,1.02],[s*w*.95,hem]],shade(top,.55),line);
   marks.push('striped undershirt','open vest');hemRound();break;
  }
  case 'vest':{
   const shirt=o.accent;
   poly([[-.088*k,1.0],[.088*k,1.0],[0,.6]],shirt);path([[0,.84],[0,.6]],shade(shirt,.6),line*.7);
   collar(lighten(shirt,.04),{drop:.86,spread:.095});
   path([[0,.6],[0,hem]],ink,line*.8);buttons([.54,.43,.32,.21],.0085,lighten(top,.38));
   for(const sx of [-1,1])path([[sx*W*.13,.3],[sx*W*.27,.3]],ink,line*.9);
   marks.push('shirt V','welt pockets');hemRound();break;
  }
  // A knitted vest: the same V over the shirt, edged in rib, a ribbed hem, no buttons.
  case 'knitvest':{
   const shirt=o.accent,ribC=shade(top,.86),ribLine=shade(top,.74);
   poly([[-.078*k,1.0],[.078*k,1.0],[0,.66]],shirt,{stroke:null});
   collar(lighten(shirt,.04),{drop:.88,spread:.09});
   for(const sx of [-1,1]){
    poly([[sx*.078*k,1.0],[sx*.118*k,1.0],[0,.6],[0,.66]],ribC);
    for(let i=1;i<12;i++){const f=i/12,t0=1.0-(1.0-.66)*f,t1=1.0-(1.0-.6)*f;path([[sx*.078*k*(1-f),t0],[sx*.118*k*(1-f),t1]],ribLine,line*.5);}
   }
   ctx.fillStyle=ribC;ctx.fillRect(0,Y(hem+.075),TW,Y(hem)-Y(hem+.075));
   ctx.strokeStyle=ribLine;ctx.lineWidth=line*.5;for(let x=0;x<TW;x+=TW/96){ctx.beginPath();ctx.moveTo(x,Y(hem+.075));ctx.lineTo(x,Y(hem));ctx.stroke();}
   ctx.strokeStyle=ink;ctx.lineWidth=line*.8;ctx.beginPath();ctx.moveTo(0,Y(hem+.075));ctx.lineTo(TW,Y(hem+.075));ctx.stroke();
   marks.push('rib');break;
  }
  // The PE shirt: neck rib and sleeve hems in the class colour (the accent), and a white patch sewn on the chest with the
  // wearer's name, how teachers tell the children apart. An empty name leaves the patch blank.
  case 'gymtee':{
   rib(o.accent);hemRound();
   // About 18 by 9 cm on a grown-up, the chest's width, as a sewn-on zekken is.
   const pw=W*.3,pt=.64,ph=.2;
   poly([[-pw,pt+ph/2],[pw,pt+ph/2],[pw,pt-ph/2],[-pw,pt-ph/2]],'#fbf9f3',{width:line*.8});
   const shown=words(recipe.name,0,pt,ph*m.torso*.42,{fill:'#2b2623',font:['800',GOTHIC],fit:pw*2*.9});
   marks.push('name patch',shown?'name:'+shown:'blank patch');break;
  }
  // The Minato Seagulls' jersey: a V neck over the undershirt (the accent colour, which is also the piping), a piped
  // placket with five buttons, our own "Minato" lettering across the chest and the number on the back.
  case 'baseball':{
   const pipe=o.accent;
   poly([[-.062*k,1.0],[.062*k,1.0],[0,.8]],pipe);
   for(const sx of [-1,1]){path([[sx*.062*k,1.0],[0,.8]],pipe,line*2.2);path([[sx*.02*k,.8],[sx*.02*k,hem]],pipe,line*1.4);}
   for(const t of [.72,.6,.48,.36,.24])dotAt(0,t,.0065*k,shade(top,.82),shade(top,.55));
   // The lettering is sewn on over the placket, edged in the cloth's white so the piping never cuts through a letter.
   words(JERSEY_LETTERING,0,.6,.13*m.torso,{fill:pipe,stroke:'#f8f6ef',strokeW:.006*k,font:['italic 900',SCRIPT],fit:W*.66});
   if(o.number>0)words(String(o.number),0,.56,.34*m.torso,{fill:pipe,stroke:shade(pipe,.6),strokeW:.004*k,font:['900',NUMERALS],back:true});
   marks.push('V neck','piping','lettering',o.number>0?'number:'+o.number:'no number');break;
  }
  // The raglan tee: the body in the top colour; the sleeves (ACCENT_SLEEVES), their seams running from the underarm up to
  // the neck in front and behind, and the neck band in the accent; a little heart printed on the chest, our own.
  case 'raglan':{
   const sleeve=o.accent,seam=shade(sleeve,.6),side=t=>W/2*radiusAt(t)*.999;
   for(const back of [false,true])for(const s of [-1,1]){
    poly([[s*.085*k,1.05],[s*side(1.05),1.05],[s*side(.72),.72],[s*side(.84)*.8,.86]],sleeve,{stroke:null,back});
    wrapped(back,()=>path([[s*.085*k,1.035],[s*side(.84)*.8,.86],[s*side(.72),.72]],seam,line*.9,back));
   }
   rib(sleeve);hemRound();
   // The heart: about 7 cm across on a grown-up, in the accent, edged in its ink, with a little shine on one lobe.
   const r=.036*k,ht=.66,a=theta(0,ht);
   ctx.save();ctx.translate(X(0,ht),Y(ht));ctx.scale(r*pxPerX(a,ht),r*pxPerY);
   ctx.beginPath();ctx.moveTo(0,.95);ctx.bezierCurveTo(-.3,.68,-1.05,.2,-1.05,-.32);ctx.bezierCurveTo(-1.05,-.92,-.32,-1.08,0,-.5);
   ctx.bezierCurveTo(.32,-1.08,1.05,-.92,1.05,-.32);ctx.bezierCurveTo(1.05,.2,.3,.68,0,.95);ctx.closePath();
   ctx.fillStyle=sleeve;ctx.fill();ctx.lineWidth=.13;ctx.lineJoin='round';ctx.strokeStyle=seam;ctx.stroke();
   ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.ellipse(-.5,-.42,.17,.12,-.6,0,Math.PI*2);ctx.fill();
   ctx.restore();
   marks.push('raglan seams','heart');break;
  }
  // A pinafore over a T-shirt: the tee (the top colour) shows at the neck and is the sleeves; the pinafore's bib, its waist
  // and its wide straps (crossed behind) are the skirt's cloth (the bottom colour), with a button at each strap in the
  // accent and a patch pocket on the bib.
  case 'pinafore':{
   const b=o.bottomColour,bw=W*.3,bt=.74,waistT=.3;
   rib();
   ctx.fillStyle=b;ctx.fillRect(0,Y(waistT),TW,Y(GARMENT.T0)-Y(waistT));
   ctx.strokeStyle=shade(b,.5);ctx.lineWidth=line*.8;ctx.beginPath();ctx.moveTo(0,Y(waistT));ctx.lineTo(TW,Y(waistT));ctx.stroke();
   poly([[-bw,bt],[bw,bt],[bw*1.06,waistT],[-bw*1.06,waistT]],b,{stroke:shade(b,.5)});
   pocket(0,.5,bw*.8,.13,shade(b,.94));
   for(const s of [-1,1]){
    poly([[s*bw*.98,bt],[s*bw*.5,bt],[s*W*.16,1.0],[s*W*.33,1.0]],b,{stroke:shade(b,.5),width:line*.8});
    poly([[s*W*.33,1.0],[s*W*.16,1.0],[-s*W*.12,waistT],[-s*W*.3,waistT]],b,{stroke:shade(b,.5),back:true,width:line*.8});
    dotAt(s*bw*.74,bt-.035,.011*k,o.accent,shade(o.accent,.6));
   }
   marks.push('bib','straps','pocket');break;
  }
  // After the bath (outfits.js AFTERBATH): a house dress's round neck, bound in a paler bias tape; a running vest is
  // its own shell over the bare body (build.js runningShirt), so nothing is drawn for it.
  case 'housedress':rib(lighten(top,.45));break;
 }

 // The sleeves' band: the print carried on round the arm, and a hem or a cuff.
 {const S=GARMENT.SLEEVE,yTop=(1-S.v1)*TH,yBot=(1-S.v0)*TH,h=yBot-yTop,col=o.top,long=SLEEVED_LONG.includes(col);
  const sleeveCirc=Math.PI*2*m.armR*(long?1.04:1.2),sleeveLen=long?m.upper+m.fore:m.upper*.6;
  const pxU=TW/sleeveCirc,pxV=h/sleeveLen;
  // A sleeve that ends before the wrist (SLEEVE_END): its print and its cuff stop there, the arm below it is bare.
  const end=long&&SLEEVE_END[col]?yTop+h*SLEEVE_END[col]:yBot;
  // Over a shirt (SHIRT_SLEEVES) the sleeves are the shirt's: plain, in the accent colour, with the shirt's own hem.
  // A raglan's sleeves (ACCENT_SLEEVES) are plain cloth in the accent the same way.
  const shirtSleeve=SHIRT_SLEEVES.includes(col)||ACCENT_SLEEVES.includes(col),cloth=shirtSleeve?o.accent:o.topColour;
  ctx.save();ctx.beginPath();ctx.rect(0,yTop,TW,end-yTop);ctx.clip();
  if(col==='stripedvest'){ctx.fillStyle=o.topColour;const step=h/9;for(let y=yTop+step*.5;y<end;y+=step)ctx.fillRect(0,y,TW,Math.min(step*.22,end-y));marks.push('striped sleeves');}
  if(o.pattern==='stripes'&&!shirtSleeve){ctx.fillStyle='#f4f1ea';const band=m.torso*.12*pxV;for(let y=yTop+band;y<end;y+=band*2)ctx.fillRect(0,y,TW,Math.min(band,end-y));}
  if(o.pattern==='check'&&!shirtSleeve){
   const band=m.torso*.085*pxV,step=band*2.3;ctx.save();ctx.globalAlpha=.5;ctx.fillStyle='#f4f1ea';
   for(let y=yTop+band;y<end;y+=step)ctx.fillRect(0,y,TW,Math.min(band,end-y));for(let x=step*.25;x<TW;x+=step)ctx.fillRect(x,yTop,band,end-yTop);
   ctx.globalAlpha=.55;ctx.fillStyle=o.accent;
   for(let y=yTop+band*1.43;y<end;y+=step)ctx.fillRect(0,y,TW,Math.max(1,band*.14));for(let x=step*.25+band*.43;x<TW;x+=step)ctx.fillRect(x,yTop,Math.max(1,band*.14),end-yTop);
   ctx.restore();
  }
  if((o.pattern==='flowers'||o.pattern==='dots')&&!shirtSleeve){
   const flowers=o.pattern==='flowers',r=m.k*(flowers?(col==='kariyushi'?.05:.036):.016),petal=flowers?'#f8f6ef':o.accent;
   const cols=flowers?4:8,rows=Math.max(1,Math.round(sleeveLen/(r*4)));
   for(let row=0;row<rows;row++)for(let c=0;c<cols;c++){
    const cx=((c+(row%2)*.5+.25)/cols)*TW,cy=yTop+(row+.5)/rows*h*.82;
    for(const off of [0,-TW,TW]){ctx.save();ctx.translate(cx+off,cy);ctx.scale(r*pxU,r*pxV);ctx.rotate(row*1.3+c);
     if(flowers){ctx.fillStyle=petal;for(let k=0;k<5;k++){ctx.beginPath();ctx.ellipse(Math.cos(k*1.2566)*.5,Math.sin(k*1.2566)*.5,.42,.42,0,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#f4c83c';ctx.beginPath();ctx.arc(0,0,.28,0,Math.PI*2);ctx.fill();}
     else{ctx.fillStyle=petal;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();}
     ctx.restore();}
   }
  }
  ctx.restore();
  // The hem of a short sleeve, or the cuff of a long one: a band and a line above it. A PE shirt's and a jersey's are
  // in the accent colour (the class colour, the piping).
  if(!['tank','sundress','running'].includes(col)){
   const bandH=Math.max(3,(long?.03:.018)*m.k*pxV),ink=shade(cloth,.5);
   ctx.fillStyle=['contrastpolo','gymtee','baseball'].includes(col)?o.accent:col==='kariyushi'?lighten(cloth,.22):shade(cloth,.86);ctx.fillRect(0,end-bandH,TW,bandH);
   ctx.fillStyle=ink;ctx.fillRect(0,end-bandH-1.2,TW,1.2);
   marks.push(long?'cuffs':'sleeve-hems');
  }
 }
 return marks;
}
/** Tops whose sleeves run to the wrist (build.js longSleeve). */
export const SLEEVED_LONG=Object.freeze(['stripedvest','jacket','smock','sailorlong','police','hoodie','cardigan','festival','lighthouse','lantern','reef']);
