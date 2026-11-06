import * as THREE from '../../../vendor/three.module.js';
import {buildHalo} from '../../world/halloween-props.js';

/**
 * Johansson Studio's Lathe maker: a turned shape built from a few numbers, so it is saved as data (its parameters)
 * and builds the same mesh wherever it is opened: in Studio's "Make model" on the iPad, in World, and in the desktop
 * Studio, which serves World's src and can import this file (briefs/NEXT.md §5, the code recipe: "drawings are saved
 * as the same recipe, so they can be refined later").
 *
 * A shape is a side profile (a few control points, [height fraction, radius in metres], joined by a smooth curve that
 * never overshoots them) spun round y, with:
 *   bulge   metres added at the middle of the height, fading to nothing at the ends;
 *   ribs    count, depth (a fraction of the radius) and waveform (round, pleat, flute, facet), running round the shape
 *           (a vase's flutes, a tub's staves) or up it (a chōchin's bamboo hoops);
 *   twist   degrees the ribs turn from the foot to the top;
 *   sides   0 for round, 3 to 12 for a flat-sided shape (an andon's four paper sides);
 *   wall    thickness in metres: 0 is a sheet (paper), more is a printable shell;
 *   ends    each end closed or open (a lantern is open at both, a vase at its top);
 *   trim    a ring (an open end) or a plate (a closed end) at the ends: a chōchin's lacquered rings, an andon's base;
 *   bands   hoops round the middle (a bucket's or a tub's);
 *   colours body and trim, from World's palettes (LATHE_PALETTE);
 *   glow    0 to 1 for the lamps: lit the way World lights its lanterns (world/halloween-props.js: the paper drawn
 *           unlit, brightest at its middle, and a soft halo round it);
 *   detail  the resolution, capped by the phone budget of the asset's kind (modeller/rules.json).
 * The frame is World's asset frame: metres, y up, the foot on the floor at y = 0, the front facing +z.
 */
export const LATHE_VERSION=1;
export const WAVES=Object.freeze(['round','pleat','flute','facet']);

/** Colours, each from where World already uses it, so a turned thing sits in the town's palette. */
export const LATHE_PALETTE=Object.freeze([
 ['washi','#fff2d8','the bandai andon’s paper (world/interiors/onsen-lobby.js)'],
 ['lantern red','#d8342c','the residents’ cloth red (avatars/recipe.js PALETTE.cloth), an izakaya’s akachōchin'],
 ['pumpkin orange','#e8742a','the cloth orange (recipe.js), the cord reel’s drum (halloween-props.js)'],
 ['sun yellow','#f4d23c','the cloth yellow (recipe.js)'],
 ['lacquer black','#2a2522','the pumpkin lantern’s cap (halloween-props.js)'],
 ['dark wood','#6b4a2e','Umi-no-yu’s dark wood (world/interiors/onsen.js)'],
 ['bandai wood','#4a2f1c','the bandai’s dark wood, the andon’s base (world/interiors/onsen-lobby.js)'],
 ['hinoki','#c79f6e','Umi-no-yu’s pale wood (onsen.js)'],
 ['bamboo','#c2a466','the uchiwa rack’s bamboo (world/interiors/onsen-props.js)'],
 ['tin','#a9b3b6','the fish cart’s tin (world/roadside-props.js)'],
 ['aluminium','#c9cdd0','a can’s rims (halloween-props.js J-Coffee can)'],
 ['copper','#b0703c','the copper of the cloth brown, warmed (recipe.js #9a6a42)'],
 ['bottle green','#344e3b','the izakaya’s kept sake bottle (world/interiors/izakaya-devices.js)'],
 ['sea blue','#3fa0c8','the cloth sky blue (recipe.js), the massage chair’s vinyl'],
 ['indigo','#27304d','the cloth indigo (recipe.js)'],
 ['celadon','#8fbf4a','the cloth green (recipe.js)'],
 ['porcelain','#f4f1ea','the cloth white (recipe.js)'],
 ['stoneware','#9a6a42','the cloth brown (recipe.js)'],
 ['slate','#6d7478','the cloth grey (recipe.js)'],
].map(([name,hex,from])=>Object.freeze({name,hex,from})));

const P=(y,r)=>[y,r];
/**
 * The families, each with what it is for, its kind (rules.json: the phone budget it gets) and presets. A preset's
 * purpose is only a suggestion of who it is for: the card's own words are the creator's.
 */
export const LATHE_FAMILIES=Object.freeze({
 chochin:{name:'Chōchin paper lantern',kind:'prop',lamp:true,hangs:true,role:'lamp',
  about:'Washi paper on bamboo hoops, lacquered rings top and bottom, a bulb or a candle inside: open at both ends, it hangs.',
  base:{height:.42,profile:[P(0,.075),P(.18,.135),P(.5,.155),P(.82,.135),P(1,.075)],bulge:0,ribs:{count:24,depth:.05,wave:'pleat',along:'height'},twist:0,sides:0,wall:0,
   bottom:'open',top:'open',trim:{height:.03,flare:.006,ends:'both'},bands:{count:0,width:.012},colours:{body:'#fff2d8',trim:'#2a2522'},glow:1,detail:3},
  presets:[
   {id:'akachochin',name:'Akachōchin (izakaya red lantern)',set:{colours:{body:'#d8342c',trim:'#2a2522'},height:.5,profile:[P(0,.09),P(.2,.16),P(.5,.18),P(.8,.16),P(1,.09)]}},
   {id:'festival',name:'Festival lantern (white washi)',set:{}},
   {id:'porch',name:'Small porch lantern',set:{height:.26,profile:[P(0,.05),P(.25,.085),P(.5,.095),P(.75,.085),P(1,.05)],ribs:{count:16,depth:.05,wave:'pleat',along:'height'},trim:{height:.022,flare:.005,ends:'both'}}},
  ]},
 andon:{name:'Andon paper lamp',kind:'prop',lamp:true,hangs:false,role:'lamp',
  about:'A paper lamp that stands: paper on a wooden frame round a bulb, on a base board, open at the top.',
  base:{height:.3,profile:[P(0,.08),P(.5,.08),P(1,.08)],bulge:0,ribs:{count:0,depth:0,wave:'round',along:'around'},twist:0,sides:4,wall:0,
   bottom:'closed',top:'open',trim:{height:.03,flare:.02,ends:'both'},bands:{count:0,width:.012},colours:{body:'#fff2d8',trim:'#4a2f1c'},glow:.8,detail:2},
  presets:[
   {id:'bandai',name:'Bandai andon (Umi-no-yu’s counter)',set:{}},
   {id:'round',name:'Round andon',set:{sides:0,profile:[P(0,.09),P(.5,.1),P(1,.085)],ribs:{count:8,depth:.04,wave:'pleat',along:'around'}}},
   {id:'floor',name:'Floor andon',set:{height:.62,profile:[P(0,.13),P(.5,.13),P(1,.13)],trim:{height:.04,flare:.025,ends:'both'}},kind:'furniture'},
  ]},
 vase:{name:'Vase',kind:'prop',lamp:false,hangs:false,role:'container',
  about:'A vessel turned on a wheel: a foot, a belly and a neck, closed at the foot, open at the mouth.',
  base:{height:.26,profile:[P(0,.045),P(.3,.075),P(.65,.06),P(.85,.032),P(1,.04)],bulge:0,ribs:{count:0,depth:0,wave:'round',along:'around'},twist:0,sides:0,wall:.004,
   bottom:'closed',top:'open',trim:{height:0,flare:0,ends:'none'},bands:{count:0,width:.01},colours:{body:'#8fbf4a',trim:'#f4f1ea'},glow:0,detail:3},
  presets:[
   {id:'ikebana',name:'Ikebana vase',set:{}},
   {id:'fluted',name:'Fluted vase',set:{ribs:{count:12,depth:.08,wave:'flute',along:'around'},colours:{body:'#f4f1ea',trim:'#f4f1ea'}}},
   {id:'twisted',name:'Twisted vase',set:{ribs:{count:8,depth:.12,wave:'round',along:'around'},twist:90,colours:{body:'#3fa0c8',trim:'#f4f1ea'}}},
  ]},
 bottle:{name:'Bottle or can',kind:'prop',lamp:false,hangs:false,role:'body',
  about:'A closed vessel: a can, a bottle, a jar. Solid, so it prints as one piece.',
  base:{height:.122,profile:[P(0,.028),P(.05,.033),P(.9,.033),P(1,.028)],bulge:0,ribs:{count:0,depth:0,wave:'round',along:'around'},twist:0,sides:0,wall:0,
   bottom:'closed',top:'closed',trim:{height:0,flare:0,ends:'none'},bands:{count:0,width:.01},colours:{body:'#c9cdd0',trim:'#c9cdd0'},glow:0,detail:3},
  presets:[
   {id:'can',name:'350 ml can (66 × 122 mm)',set:{}},
   {id:'isshobin',name:'Isshōbin sake bottle (1.8 l)',set:{height:.395,profile:[P(0,.05),P(.6,.05),P(.75,.032),P(.85,.016),P(1,.016)],colours:{body:'#344e3b',trim:'#344e3b'}}},
   {id:'jar',name:'Pickle jar',set:{height:.16,profile:[P(0,.055),P(.1,.062),P(.85,.062),P(.9,.05),P(1,.05)],colours:{body:'#9a6a42',trim:'#9a6a42'}}},
  ]},
 bucket:{name:'Bucket',kind:'prop',lamp:false,hangs:false,role:'container',
  about:'An open pail: a closed bottom, straight or flared sides, hoops round it.',
  base:{height:.27,profile:[P(0,.11),P(1,.145)],bulge:0,ribs:{count:0,depth:0,wave:'round',along:'around'},twist:0,sides:0,wall:.003,
   bottom:'closed',top:'open',trim:{height:.012,flare:.004,ends:'top'},bands:{count:2,width:.012},colours:{body:'#a9b3b6',trim:'#6d7478'},glow:0,detail:3},
  presets:[
   {id:'tin',name:'Tin bucket',set:{}},
   {id:'oke',name:'Wooden bucket (oke)',set:{ribs:{count:18,depth:0,wave:'facet',along:'around'},wall:.01,colours:{body:'#c79f6e',trim:'#b0703c'}}},
   {id:'pail',name:'Sweets pail',set:{height:.18,profile:[P(0,.09),P(1,.11)],bands:{count:0,width:.01},colours:{body:'#e8742a',trim:'#2a2522'}}},
  ]},
 tub:{name:'Wooden onsen tub',kind:'prop',lamp:false,hangs:false,role:'container',
  about:'A hinoki wash tub (oke) for the wash area: staves, a thick floor and two copper hoops.',
  base:{height:.12,profile:[P(0,.1),P(1,.11)],bulge:0,ribs:{count:16,depth:0,wave:'facet',along:'around'},twist:0,sides:0,wall:.012,
   bottom:'closed',top:'open',trim:{height:0,flare:0,ends:'none'},bands:{count:2,width:.012},colours:{body:'#c79f6e',trim:'#b0703c'},glow:0,detail:3},
  presets:[
   {id:'wash',name:'Hinoki wash tub',set:{}},
   {id:'tenoke',name:'Hand pail (tenoke)',set:{height:.16,profile:[P(0,.075),P(1,.08)],ribs:{count:12,depth:0,wave:'facet',along:'around'}}},
   {id:'half',name:'Half-barrel soaking tub',set:{height:.62,profile:[P(0,.42),P(.5,.45),P(1,.44)],ribs:{count:28,depth:0,wave:'facet',along:'around'},wall:.03,bands:{count:2,width:.03}},kind:'furniture'},
  ]},
});

/** Resolution: columns round and rows up, per detail level (1 coarse … 6 fine). */
const DETAIL=[null,[12,6],[16,10],[24,14],[32,20],[48,28],[64,40]];
export const DETAIL_LEVELS=6;

const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const num=(v,d)=>typeof v==='number'&&Number.isFinite(v)?v:d;
const hex=(v,d)=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v)?v.toLowerCase():d;

/** Parameters made whole and safe (anything missing from the family's base, every number in its range). */
export function normalizeLathe(input={}){
 const family=Object.hasOwn(LATHE_FAMILIES,input.family)?input.family:'chochin',F=LATHE_FAMILIES[family],b=F.base;
 const height=clamp(num(input.height,b.height),.02,3);
 let profile=Array.isArray(input.profile)&&input.profile.length>=2&&input.profile.length<=8?input.profile:b.profile;
 profile=profile.map(p=>[clamp(num(p?.[0],0),0,1),clamp(num(p?.[1],.05),.003,1.5)]).sort((a,c)=>a[0]-c[0]);
 profile[0][0]=0;profile[profile.length-1][0]=1;
 for(let i=1;i<profile.length;i++)if(profile[i][0]<=profile[i-1][0])profile[i][0]=Math.min(1,profile[i-1][0]+1e-3);
 const ribsIn=input.ribs||{},ribs={count:Math.round(clamp(num(ribsIn.count,b.ribs.count),0,64)),depth:clamp(num(ribsIn.depth,b.ribs.depth),0,.35),
  wave:WAVES.includes(ribsIn.wave)?ribsIn.wave:b.ribs.wave,along:ribsIn.along==='height'||ribsIn.along==='around'?ribsIn.along:b.ribs.along};
 const trimIn=input.trim||{},trim={height:clamp(num(trimIn.height,b.trim.height),0,.2),flare:clamp(num(trimIn.flare,b.trim.flare),0,.1),
  ends:['both','top','bottom','none'].includes(trimIn.ends)?trimIn.ends:b.trim.ends};
 const bandsIn=input.bands||{},bands={count:Math.round(clamp(num(bandsIn.count,b.bands.count),0,6)),width:clamp(num(bandsIn.width,b.bands.width),.003,.08)};
 const sides=Math.round(num(input.sides,b.sides));
 return {maker:'lathe',version:LATHE_VERSION,family,height,profile,bulge:clamp(num(input.bulge,b.bulge),-.3,.3),ribs,
  twist:clamp(num(input.twist,b.twist),-360,360),sides:sides>=3&&sides<=12?sides:0,wall:clamp(num(input.wall,b.wall),0,.05),
  bottom:input.bottom==='open'||input.bottom==='closed'?input.bottom:b.bottom,top:input.top==='open'||input.top==='closed'?input.top:b.top,
  trim,bands,colours:{body:hex(input.colours?.body,b.colours.body),trim:hex(input.colours?.trim,b.colours.trim)},
  glow:F.lamp?clamp(num(input.glow,b.glow),0,1):0,detail:Math.round(clamp(num(input.detail,b.detail),1,DETAIL_LEVELS))};
}

/** A family's preset as parameters (its base with the preset's changes). */
export function latheParamsFor(family,presetId=null){
 const F=LATHE_FAMILIES[family]||LATHE_FAMILIES.chochin,preset=F.presets.find(p=>p.id===presetId)||F.presets[0];
 const base=structuredClone(F.base),set=structuredClone(preset?.set||{});
 return normalizeLathe({...base,...set,ribs:{...base.ribs,...set.ribs},trim:{...base.trim,...set.trim},bands:{...base.bands,...set.bands},colours:{...base.colours,...set.colours},family});
}
/** The kind a family's preset is (an andon for the floor is furniture, not a prop). */
export const latheKind=(family,presetId)=>LATHE_FAMILIES[family]?.presets.find(p=>p.id===presetId)?.kind||LATHE_FAMILIES[family]?.kind||'prop';

/** Fritsch–Carlson monotone cubic through the profile: the radius at a height fraction, never overshooting a point. */
export function profileCurve(points){
 const n=points.length,x=points.map(p=>p[0]),y=points.map(p=>p[1]),d=[],m=new Array(n).fill(0);
 for(let i=0;i<n-1;i++)d.push((y[i+1]-y[i])/Math.max(1e-9,x[i+1]-x[i]));
 m[0]=d[0];m[n-1]=d[n-2];
 for(let i=1;i<n-1;i++)m[i]=d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2;
 for(let i=0;i<n-1;i++){if(d[i]===0){m[i]=m[i+1]=0;continue;}const a=m[i]/d[i],b=m[i+1]/d[i],s=a*a+b*b;if(s>9){const t=3/Math.sqrt(s);m[i]=t*a*d[i];m[i+1]=t*b*d[i];}}
 return v=>{
  if(v<=0)return y[0];if(v>=1)return y[n-1];
  let i=0;while(i<n-2&&v>x[i+1])i++;
  const h=x[i+1]-x[i],t=(v-x[i])/h,t2=t*t,t3=t2*t;
  return (2*t3-3*t2+1)*y[i]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*y[i+1]+(t3-t2)*h*m[i+1];
 };
}

/** A wave across one rib, 1 at the rib's ridge and 0 in its valley, for t in [0, 1). */
function wave(kind,t){
 t-=Math.floor(t);
 if(kind==='pleat')return Math.abs(2*t-1);                       // folded paper: sharp ridges and valleys
 if(kind==='flute')return 1-Math.sqrt(Math.max(0,1-(2*t-1)**2));  // fluting: round grooves between sharp edges
 return (1+Math.cos(2*Math.PI*t))/2;                              // round lobes
}

/** Columns round and rows up for these parameters (what the triangle count follows). */
export function latheGrid(p){
 let [cols,rows]=DETAIL[p.detail];
 const steps=k=>Math.max(1,Math.round(cols/k));
 if(p.sides)cols=p.sides*2*Math.max(1,Math.round(cols/(p.sides*2)));          // a corner on a column
 if(p.ribs.count&&p.ribs.along==='around'){
  const per=p.ribs.wave==='facet'?2:p.ribs.wave==='pleat'?2*Math.max(1,Math.round(steps(p.ribs.count)/2)):Math.max(4,steps(p.ribs.count));
  cols=p.ribs.count*Math.max(per,2);
  if(p.sides)cols=Math.max(cols,p.sides*2);
 }
 if(p.ribs.count&&p.ribs.along==='height'&&p.ribs.depth>0){const per=p.ribs.wave==='pleat'?2:4;rows=Math.max(rows,p.ribs.count*per);}
 return {cols:Math.min(cols,512),rows:Math.min(rows,512)};
}

/** The outer radius at column i (of cols) and height fraction v, and its angle. */
function outer(p,curve,cols,i,v){
 const t0=i/cols,theta0=t0*Math.PI*2;
 let r=curve(v)+p.bulge*Math.sin(Math.PI*v);
 if(p.sides){const seg=Math.PI*2/p.sides,local=theta0-seg*Math.round(theta0/seg);r/=Math.cos(local);}
 const R=p.ribs;
 if(R.count&&R.along==='around'){
  if(R.wave==='facet'){const seg=Math.PI*2/R.count,local=theta0-seg*(Math.floor(theta0/seg)+.5);r*=Math.cos(seg/2)/Math.cos(local);}
  else if(R.depth>0)r*=1-R.depth*(1-wave(R.wave,t0*R.count));
 }
 if(R.count&&R.along==='height'&&R.depth>0)r*=1-R.depth*(1-wave(R.wave,v*R.count));
 return {r:Math.max(.0005,r),theta:theta0+p.twist*Math.PI/180*v};
}

/**
 * The body as triangles: its outer surface, and with a wall its inner surface, the rims of its open ends and the
 * floors of its closed ones (one closed solid then); without a wall, closed ends are capped (a solid) and open ones
 * left open (a sheet). Indexed, wound to face out. Returns {positions, indices, glowT (0 at the middle … 1 at the ends,
 * for a lit lamp's shading), grid}.
 */
export function latheBody(input){
 const p=normalizeLathe(input),curve=profileCurve(p.profile),H=p.height,{cols,rows}=latheGrid(p);
 const pos=[],shade=[],idx=[];
 const vertex=(x,y,z,s)=>{pos.push(x,y,z);shade.push(s);return pos.length/3-1;};
 const ring=(v,y,offset)=>{const out=[];for(let i=0;i<cols;i++){const o=outer(p,curve,cols,i,v),r=Math.max(.0005,o.r-offset);out.push(vertex(r*Math.sin(o.theta),y,r*Math.cos(o.theta),Math.abs(2*v-1)));}return out;};
 // outer surface, rows from the foot up
 const outerRows=[];for(let j=0;j<=rows;j++)outerRows.push(ring(j/rows,H*j/rows,0));
 const quad=(a,b,c,d)=>{idx.push(a,b,c,a,c,d);};
 const band=(lo,hi,out)=>{for(let i=0;i<cols;i++){const k=(i+1)%cols;if(out)quad(lo[i],lo[k],hi[k],hi[i]);else quad(lo[i],hi[i],hi[k],lo[k]);}};
 for(let j=0;j<rows;j++)band(outerRows[j],outerRows[j+1],true);
 // a disc over a ring, facing up or down
 const disc=(ringIds,y,up,s)=>{const c=vertex(0,y,0,s);for(let i=0;i<cols;i++){const k=(i+1)%cols;if(up)idx.push(c,ringIds[i],ringIds[k]);else idx.push(c,ringIds[k],ringIds[i]);}};
 const wall=p.wall,bottomClosed=p.bottom==='closed',topClosed=p.top==='closed';
 if(wall>0){
  // the inner surface follows the outer, `wall` in from it, between the floors of the closed ends
  const y0=bottomClosed?Math.min(wall,H*.45):0,y1=topClosed?H-Math.min(wall,H*.45):H;
  const innerRows=[];for(let j=0;j<=rows;j++){const y=y0+(y1-y0)*j/rows;innerRows.push(ring(y/H,y,wall));}
  for(let j=0;j<rows;j++)band(innerRows[j],innerRows[j+1],false);
  if(bottomClosed){disc(outerRows[0],0,false,1);disc(innerRows[0],y0,true,1);}else band(innerRows[0],outerRows[0],true);
  if(topClosed){disc(outerRows[rows],H,true,1);disc(innerRows[rows],y1,false,1);}else band(outerRows[rows],innerRows[rows],true);
 }else{
  if(bottomClosed)disc(outerRows[0],0,false,1);
  if(topClosed)disc(outerRows[rows],H,true,1);
 }
 return {params:p,positions:new Float32Array(pos),indices:new Uint32Array(idx),glowT:new Float32Array(shade),grid:{cols,rows}};
}

/**
 * A ring (or, closed, a plate) round the shape at heights y0…y1: its outside `flare` out from the body's outline, its
 * inside `into` in from it (embedded in the body). Same columns and sides as the body, no ribs or twist (a lacquered
 * ring, a hoop, a base board is smooth).
 */
function ringSolid(p,curve,cols,y0,y1,flare,into,plate){
 const pos=[],idx=[],H=p.height,plain={...p,ribs:{...p.ribs,count:p.ribs.wave==='facet'&&p.ribs.along==='around'?p.ribs.count:0},twist:0};
 const at=(v,off)=>{const out=[];for(let i=0;i<cols;i++){
  // the hoop goes round the ribs' ridges, not their valleys
  const o=outer(plain,curve,cols,i,v),r=Math.max(.0006,o.r+off);pos.push(r*Math.sin(o.theta),v*H,r*Math.cos(o.theta));out.push(pos.length/3-1);}return out;};
 const vy=y=>clamp(y/H,0,1),lo=vy(y0),hi=vy(y1);
 const oLo=at(lo,flare),oHi=at(hi,flare);
 const quad=(a,b,c,d)=>idx.push(a,b,c,a,c,d);
 for(let i=0;i<cols;i++){const k=(i+1)%cols;quad(oLo[i],oLo[k],oHi[k],oHi[i]);}
 const fixY=(ids,y)=>{for(const id of ids)pos[id*3+1]=y;};fixY(oLo,y0);fixY(oHi,y1);
 if(plate){
  const disc=(ids,y,up)=>{pos.push(0,y,0);const c=pos.length/3-1;for(let i=0;i<cols;i++){const k=(i+1)%cols;if(up)idx.push(c,ids[i],ids[k]);else idx.push(c,ids[k],ids[i]);}};
  disc(oLo,y0,false);disc(oHi,y1,true);
 }else{
  const iLo=at(lo,-into),iHi=at(hi,-into);fixY(iLo,y0);fixY(iHi,y1);
  for(let i=0;i<cols;i++){const k=(i+1)%cols;quad(iLo[i],iHi[i],iHi[k],iLo[k]);quad(iLo[k],oLo[k],oLo[i],iLo[i]);quad(oHi[i],oHi[k],iHi[k],iHi[i]);}
 }
 return {positions:pos,indices:idx};
}

/** The trims and bands as one set of triangles (each a closed ring or plate). */
export function latheTrims(input){
 const p=normalizeLathe(input),curve=profileCurve(p.profile),{cols}=latheGrid(p),H=p.height,pieces=[];
 // set into the body, half its wall (a sheet: 3 mm), and at least a millimetre proud of it, so no edge of a ring is an
 // edge of the body: each stays a closed solid of its own
 const into=p.wall>0?p.wall*.5:.003,flare=Math.max(p.trim.flare,.001);
 const T=p.trim;
 if(T.height>0&&T.ends!=='none'){
  const h=Math.min(T.height,H/3);
  if(T.ends==='both'||T.ends==='bottom')pieces.push(ringSolid(p,curve,cols,0,h,flare,into,p.bottom==='closed'));
  if(T.ends==='both'||T.ends==='top')pieces.push(ringSolid(p,curve,cols,H-h,H,flare,into,p.top==='closed'));
 }
 const B=p.bands;
 for(let k=0;k<B.count;k++){
  const v=B.count===1?.5:.18+.64*k/(B.count-1),w=Math.min(B.width,H/6),y=v*H;
  pieces.push(ringSolid(p,curve,cols,Math.max(0,y-w/2),Math.min(H,y+w/2),.003,into,false));
 }
 const positions=[],indices=[];
 for(const piece of pieces){const base=positions.length/3;positions.push(...piece.positions);for(const i of piece.indices)indices.push(base+i);}
 return {positions:new Float32Array(positions),indices:new Uint32Array(indices)};
}

/** How many triangles these parameters make (the body, the trims and bands). */
export function latheTriangles(input){
 const b=latheBody(input),t=latheTrims(input);return (b.indices.length+t.indices.length)/3;
}

/**
 * The finest detail level (1…6) that keeps these parameters within `budget` triangles, never finer than asked: what
 * the resolution control may go up to. {detail, triangles, capped}.
 */
export function capDetail(input,budget){
 const p=normalizeLathe(input);
 for(let d=p.detail;d>=1;d--){const n=latheTriangles({...p,detail:d});if(n<=budget)return {detail:d,triangles:n,capped:d<p.detail};}
 return {detail:1,triangles:latheTriangles({...p,detail:1}),capped:p.detail>1};
}

const colour=hexText=>new THREE.Color(hexText);

/**
 * The model as a three.js group, in World's asset frame, named `name`: the body (a part with the family's role: the
 * lamp, the container or the body), the trims and bands (the part "Rims", role decoration) and, for a lit lamp, its
 * halo (a sprite: light, not shape). Materials are World's: MeshStandardMaterial that World's cel pass draws in its
 * look, a lit lamp's paper unlit with its bright middle (world/halloween-props.js lights its lanterns the same way). A
 * sheet without a wall is drawn from both sides. Anchors: `hang` at the top (lanterns), `mouth` at an open top.
 */
export function buildLathe(input,{name='Lathe model'}={}){
 const p=normalizeLathe(input),F=LATHE_FAMILIES[p.family],root=new THREE.Group();root.name=name;root.userData.asset=name;
 const body=latheBody(p),geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(body.positions,3));geometry.setIndex(new THREE.BufferAttribute(body.indices,1));
 geometry.computeVertexNormals();
 const sheet=p.wall===0&&(p.top==='open'||p.bottom==='open'),lit=F.lamp&&p.glow>0;
 let material;
 if(lit){
  // brightest at its middle where the bulb is, a deeper tone to its ends (halloween-props.js glowShade)
  const base=colour(p.colours.body),warm=new THREE.Color('#fff1c9'),k=p.glow,mid=base.clone().lerp(warm,.18*k),edge=base.clone().multiplyScalar(.6+.2*k),c=new Float32Array(body.glowT.length*3),C=new THREE.Color();
  for(let i=0;i<body.glowT.length;i++){C.copy(mid).lerp(edge,body.glowT[i]**2);c[i*3]=C.r;c[i*3+1]=C.g;c[i*3+2]=C.b;}
  geometry.setAttribute('color',new THREE.BufferAttribute(c,3));
  material=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false,side:sheet?THREE.DoubleSide:THREE.FrontSide});material.name='glow';
 }else{
  material=new THREE.MeshStandardMaterial({color:colour(p.colours.body),roughness:F.role==='lamp'?.9:.7,side:sheet?THREE.DoubleSide:THREE.FrontSide});material.name='matte';
 }
 const bodyName={lamp:'Lantern paper',container:F.name,body:F.name}[F.role]||F.name;
 const bodyPart=new THREE.Group();bodyPart.name=bodyName;Object.assign(bodyPart.userData,{part:bodyName,role:F.role});
 const mesh=new THREE.Mesh(geometry,material);mesh.name=bodyName;bodyPart.add(mesh);root.add(bodyPart);
 const trims=latheTrims(p);
 if(trims.indices.length){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(trims.positions,3));g.setIndex(new THREE.BufferAttribute(trims.indices,1));g.computeVertexNormals();
  const part=new THREE.Group();part.name='Rims';Object.assign(part.userData,{part:'Rims',role:'decoration'});
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:colour(p.colours.trim),roughness:.5,metalness:/^#(a9b3b6|c9cdd0|b0703c|6d7478)$/.test(p.colours.trim)?.4:0}));m.name='Rims';m.material.name='matte';
  part.add(m);root.add(part);
 }
 if(lit){
  const r=Math.max(...p.profile.map(q=>q[1]))+Math.max(0,p.bulge);
  const halo=buildHalo(Math.max(r*5,p.height*1.6),.95*Math.pow(p.glow,.85));halo.position.set(0,p.height/2,0);root.add(halo);
 }
 const anchors={};
 if(F.hangs)anchors.hang=[0,+p.height.toFixed(4),0];
 if(p.top==='open'&&!F.hangs)anchors.mouth=[0,+p.height.toFixed(4),0];
 root.userData.lathe=p;root.userData.anchors=anchors;
 root.traverse(o=>{if(o.isMesh){o.castShadow=!o.material.isMeshBasicMaterial;o.receiveShadow=true;}});
 return root;
}
