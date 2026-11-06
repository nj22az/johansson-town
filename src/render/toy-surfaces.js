import * as THREE from '../../vendor/three.module.js';

/**
 * Painted ground, in place of photographs.
 *
 * The town's crazy paving and lawn were photographed surfaces: dark, contrasty and
 * busy, which read as a real street rather than a toy town. These are drawn instead —
 * soft stones with pale grout, and an even lawn with a faint mown weave — so the
 * ground is a bright, calm floor for the residents, the way a life-sim island is.
 * Both tile seamlessly and are generated once, then shared.
 */
const cache=new Map();
const hash=(x,y,s=0)=>{const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n);};

function finish(key,data,size){
 const map=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
 map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;
 map.anisotropy=8;map.userData.sharedAsset=true;map.needsUpdate=true;
 cache.set(key,map);return map;
}

/**
 * Footway pavers, the way a 1990s Japanese town relaid its pavements: small
 * interlocking concrete blocks in a running bond, mostly pale grey with the odd
 * warmer block, each with a soft bevel and a fine joint. This replaces the crazy
 * paving, whose stones read about a metre across at street level and made the ground
 * the loudest thing in every shot (docs/AMPLIFY-AUDIT.md, §1). Near-neutral, so the
 * material colour sets the tone. At the usual 3 m repeat a block is 30 x 15 cm.
 */
export function paintedPaving(size=256){
 if(cache.has('paving'))return cache.get('paving');
 const cols=10,rows=20,data=new Uint8Array(size*size*4);
 const tints=[[232,231,226],[226,225,221],[238,236,231],[229,226,220],[236,226,218]];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const v=y/size*rows,row=Math.floor(v),u=x/size*cols+(row%2?.5:0),col=Math.floor(u)%cols;
  const fu=u-Math.floor(u),fv=v-row;
  const edge=Math.min(fu,1-fu,(fv)*.5,(1-fv)*.5);
  const joint=1-THREE.MathUtils.smoothstep(edge,.02,.045);
  const tone=hash(col,row,3),c=tints[tone>.92?4:Math.floor(tone*4)];
  const bevel=.95+.05*THREE.MathUtils.smoothstep(edge,.03,.12);
  const speck=(hash(x,y,9)-.5)*5;
  const i=(y*size+x)*4;
  for(let k=0;k<3;k++)data[i+k]=Math.round(THREE.MathUtils.clamp(THREE.MathUtils.lerp(c[k]*bevel+speck,150,joint*.55),0,255));
  data[i+3]=255;
 }
 return finish('paving',data,size);
}

/**
 * Lawn: near white, so the material's tint sets the green, with broad soft patches and
 * a faint diagonal mowing weave rather than photographed blades and bare earth.
 */
export function paintedTurf(size=256){
 if(cache.has('turf'))return cache.get('turf');
 const data=new Uint8Array(size*size*4);
 const smooth=(x,y,f,s)=>{
  const X=x*f,Y=y*f,ix=Math.floor(X),iy=Math.floor(Y);let a=X-ix,b=Y-iy;a=a*a*(3-2*a);b=b*b*(3-2*b);
  const h=(i,j)=>hash(((i%f)+f)%f,((j%f)+f)%f,s);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(ix,iy),h(ix+1,iy),a),THREE.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),a),b);
 };
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;
  const patch=smooth(u,v,4,1)*.6+smooth(u,v,8,2)*.4;
  const weave=Math.sin((u+v)*Math.PI*8)*.5+.5;
  const blade=hash(x,y,5);
  const light=196+patch*20+weave*7+(blade>.93?10:0)-(blade<.05?9:0);
  const i=(y*size+x)*4;
  data[i]=Math.round(light*.97);data[i+1]=Math.round(Math.min(255,light));data[i+2]=Math.round(light*.9);data[i+3]=255;
 }
 return finish('turf',data,size);
}

/**
 * Asphalt, painted: a calm blue-grey with fine aggregate speckle and a few soft
 * darker patches where the road has been dug up and made good, which every Japanese
 * street of the 1990s had. Mid-light rather than near-black, so the ramp still has
 * room to put a shadow on it and the cel line reads against it. Near-neutral, so the
 * material colour sets the final grey.
 */
export function paintedAsphalt(size=256){
 if(cache.has('asphalt'))return cache.get('asphalt');
 const data=new Uint8Array(size*size*4);
 const smooth=(x,y,f,s)=>{
  const X=x*f,Y=y*f,ix=Math.floor(X),iy=Math.floor(Y);let a=X-ix,b=Y-iy;a=a*a*(3-2*a);b=b*b*(3-2*b);
  const h=(i,j)=>hash(((i%f)+f)%f,((j%f)+f)%f,s);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(ix,iy),h(ix+1,iy),a),THREE.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),a),b);
 };
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;
  const patch=smooth(u,v,3,4);
  // A made-good patch: a hard-edged darker rectangle-ish blob, as painted.
  const repair=patch>.78?-14:0;
  const grain=hash(x,y,7),speck=grain>.9?16:grain<.06?-12:0;
  const light=204+smooth(u,v,6,5)*10+repair+speck;
  const i=(y*size+x)*4;
  data[i]=Math.round(light*.97);data[i+1]=Math.round(light*.98);data[i+2]=Math.round(Math.min(255,light*1.02));data[i+3]=255;
 }
 return finish('asphalt',data,size);
}

/**
 * Poured concrete, painted: pale and even, with the saw-cut joints of 2 m bays, a few
 * hairline cracks and the faint mottling of salt spray. It replaces a photographed
 * concrete that read as a real quay under a drawn town. Near-white, so the material
 * colour sets the grey. At a 2 m repeat one tile is one bay.
 */
export function paintedConcrete(size=256){
 if(cache.has('concrete'))return cache.get('concrete');
 const data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;
  const edge=Math.min(u,1-u,v,1-v),joint=1-THREE.MathUtils.smoothstep(edge,.004,.012);
  const mottle=(Math.sin(u*9.1+Math.sin(v*5.3)*1.7)+Math.sin(v*7.7+u*3.1))*2.2;
  const crack=Math.abs(v-.62-Math.sin(u*14)*.03)<.0035&&u>.18&&u<.55?-28:0;
  const speck=(hash(x,y,11)-.5)*7;
  const light=236+mottle+speck+crack-joint*48;
  const i=(y*size+x)*4;
  data[i]=data[i+1]=Math.round(THREE.MathUtils.clamp(light,0,255));data[i+2]=Math.round(THREE.MathUtils.clamp(light-2,0,255));data[i+3]=255;
 }
 return finish('concrete',data,size);
}

/**
 * Crushed stone and coral, raked, painted: near-white grit with darker and paler grains and the soft streaks a rake
 * leaves, for the ground generator's loose classes (world/ground-build.js: Nishi-machi's coral yards, Kitahama's coral
 * pads, the school's rolled paths, the grove's gravel). Near-neutral, so the rulebook's colour sets the tone
 * (world/ground-standard.js). Tiles seamlessly; at a 2 m repeat a grain is a centimetre or two.
 */
export function paintedGrit(size=256){
 if(cache.has('grit'))return cache.get('grit');
 const data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;
  const rake=Math.sin((v+Math.sin(u*Math.PI*2)*.015)*Math.PI*36)*2.2;
  const g=hash(x,y,13),grain=g>.94?-26:g>.88?-12:g<.05?9:0;
  const mottle=(Math.sin(u*Math.PI*4+Math.cos(v*Math.PI*2)*1.3)+Math.sin(v*Math.PI*6))*2.4;
  const light=228+rake+grain+mottle+(hash(x>>1,y>>1,17)-.5)*8;
  const i=(y*size+x)*4;
  data[i]=Math.round(THREE.MathUtils.clamp(light,0,255));data[i+1]=Math.round(THREE.MathUtils.clamp(light-1,0,255));data[i+2]=Math.round(THREE.MathUtils.clamp(light-4,0,255));data[i+3]=255;
 }
 return finish('grit',data,size);
}
