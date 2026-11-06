import * as THREE from '../../../vendor/three.module.js';
import {GLTFLoader} from '../../../vendor/GLTFLoader.js';
import {assetURL} from '../../assets.js';
import {celFrom} from '../../render/cel.js';
const cache=new Map();
export const IKEA_FURNITURE=Object.freeze({lack:{width:.55,depth:.55,height:.45},ivar:{width:.8,depth:.5,height:.83}});
export function prepareFurniture(source,kind){
 const spec=IKEA_FURNITURE[kind],model=source.clone(true);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());
 // All variants keep the same footprint as their immediately usable fallback.
 const holder=new THREE.Group();holder.name='Town IKEA '+kind;holder.userData.sharedAsset=true;holder.add(model);model.position.sub(new THREE.Vector3(centre.x,bounds.min.y,centre.z));holder.scale.set(spec.width/size.x,spec.height/size.y,spec.depth/size.z);
 model.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(m=>celFrom(m)):celFrom(o.material);o.castShadow=o.receiveShadow=true;}});return holder;
}
function load(kind){if(!cache.has(kind))cache.set(kind,new GLTFLoader().loadAsync(assetURL('models/furniture/town-'+kind+'.glb')).then(g=>g.scene).catch(e=>{cache.delete(kind);throw e;}));return cache.get(kind);}
export function addIkeaFurniture({room,box,collider,reg,action,kind,x,z,yaw=0}){
 const s=IKEA_FURNITURE[kind],holder=new THREE.Group();holder.name='IKEA '+kind+' home furniture';holder.position.set(x,0,z);holder.rotation.y=yaw;room.add(holder);
 const fallback=new THREE.Group();holder.add(fallback);const part=(size,p,c)=>box(size,p,c,fallback,false);
 if(kind==='lack'){part([s.width,.04,s.depth],[0,s.height-.02,0],0xc9b99b);for(const dx of [-.22,.22])for(const dz of [-.22,.22])part([.055,s.height-.04,.055],[dx,(s.height-.04)/2,dz],0xc9b99b);}
 else{part([s.width,s.height,s.depth],[0,s.height/2,0],0x93704c);for(const dx of [-.2,.2])part([.39,.7,.035],[dx,.44,.265],0xab8459);}
 const rotated=Math.abs(Math.sin(yaw))>.5;collider(x,z,rotated?s.depth:s.width,rotated?s.width:s.depth,s.height);
 reg(holder,'Inspect '+(kind==='lack'?'side table':'pine cabinet'),()=>action('inspect',kind==='lack'?'A quiet corner':'Pine cabinet',kind==='lack'?'A sturdy little table, just the right height for a tea cup and the evening newspaper.':'Books, spare towels and letters are kept behind the pine doors. The passage beside the futon stays clear.'),true);
 if(typeof window!=='undefined')holder.userData.ready=load(kind).then(source=>{if(!holder.parent)return;holder.add(prepareFurniture(source,kind));fallback.visible=false;}).catch(()=>{});
 return holder;
}
