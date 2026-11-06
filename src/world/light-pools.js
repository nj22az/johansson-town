import * as THREE from '../../vendor/three.module.js';

/**
 * Warm pools of lamplight on the ground, and the halo round a lit lamp head, for lamps that
 * cannot afford a real light.
 *
 * Outdoors the town keeps to emissive lamp heads (a PointLight costs every toon material in
 * view), which left the ground under the lamps as dark as anywhere else. A pool is one
 * additive disc with a soft radial falloff, laid a few centimetres over the ground and
 * faded in with the lamps. A halo is one additive sprite at the head, so the lamp reads as
 * lit from the far end of the street. Neither is a light: nothing else is shaded by them,
 * and by day both groups are hidden and cost nothing.
 */
let texture=null;
function poolTexture(){
 if(texture)return texture;
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const d=Math.hypot(x-size/2+.5,y-size/2+.5)/(size/2),a=Math.max(0,1-d);
  const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*a*a*(3-2*a));
 }
 texture=new THREE.DataTexture(data,size,size);texture.needsUpdate=true;texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
}

let halo=null;
function haloTexture(){
 if(halo)return halo;
 const size=64,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const d=Math.min(1,Math.hypot(x-size/2+.5,y-size/2+.5)/(size/2)),a=Math.pow(1-d,2.4);
  const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*a);
 }
 halo=new THREE.DataTexture(data,size,size);halo.needsUpdate=true;halo.colorSpace=THREE.SRGBColorSpace;halo.magFilter=halo.minFilter=THREE.LinearFilter;
 return halo;
}

/**
 * @param {THREE.Object3D} parent
 * @param {{x:number,y:number,z:number,radius?:number}[]} spots ground points, world units of `parent`
 * @param {{color?:number,strength?:number}} [options]
 */
export function createLightPools(parent,spots,{color=0xffc68a,strength=.5}={}){
 const material=new THREE.MeshBasicMaterial({map:poolTexture(),color,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:false});
 const group=new THREE.Group();group.name='Lamp light pools';
 for(const spot of spots){
  const pool=new THREE.Mesh(new THREE.CircleGeometry(spot.radius??2.4,32),material);
  pool.rotation.x=-Math.PI/2;pool.position.set(spot.x,spot.y+.06,spot.z);pool.renderOrder=3;pool.name='Lamp light pool';
  pool.userData.lightPool=true;pool.raycast=()=>{};pool.userData.dynamicProp=true;pool.castShadow=pool.receiveShadow=false;
  group.add(pool);
 }
 group.visible=false;parent.add(group);
 return {group,material,update(glow){const g=Math.max(0,Math.min(1,glow||0));material.opacity=g*strength;group.visible=g>.02;}};
}

/**
 * @param {THREE.Object3D} parent
 * @param {{x:number,y:number,z:number,size?:number}[]} heads lamp-head centres, world units of `parent`
 * @param {{color?:number,strength?:number}} [options]
 */
export function createLampHalos(parent,heads,{color=0xffc48a,strength=.8}={}){
 const material=new THREE.SpriteMaterial({map:haloTexture(),color,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 const group=new THREE.Group();group.name='Lamp halos';
 for(const head of heads){
  const sprite=new THREE.Sprite(material);
  const size=head.size??1.3;sprite.scale.set(size,size,1);sprite.position.set(head.x,head.y,head.z);sprite.renderOrder=3;sprite.name='Lamp halo';
  sprite.userData.lampHalo=true;sprite.raycast=()=>{};sprite.userData.dynamicProp=true;
  group.add(sprite);
 }
 group.visible=false;parent.add(group);
 return {group,material,update(glow){const g=Math.max(0,Math.min(1,glow||0));material.opacity=g*strength;group.visible=g>.02;}};
}

/**
 * The pool and the halo of each lamp in one call, faded together.
 * @param {THREE.Object3D} parent
 * @param {{head:{x:number,y:number,z:number},ground:{x:number,y:number,z:number},radius?:number,size?:number}[]} lamps
 * @param {{pool?:object,halo?:object}} [options] passed on to createLightPools / createLampHalos
 */
export function createLampGlow(parent,lamps,{pool={},halo={}}={}){
 const pools=createLightPools(parent,lamps.map(l=>({...l.ground,radius:l.radius})),pool);
 const halos=createLampHalos(parent,lamps.map(l=>({...l.head,size:l.size})),halo);
 return {pools,halos,update(glow){pools.update(glow);halos.update(glow);}};
}
