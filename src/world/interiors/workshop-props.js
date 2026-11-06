/** Static prop preload at the door. No editor/exporter code or per-frame work in World. */
import * as THREE from '../../../vendor/three.module.js';
import {GLTFLoader} from '../../../vendor/GLTFLoader.js';
import {WORKSHOP_PUBLICATION} from './workshop-publication.js';
const templates=new Map();let pending;
export const workshopPropsReady=()=>Object.keys(WORKSHOP_PUBLICATION.layout?.assets||{}).every(id=>templates.has(id));
export async function parseWorkshopProp(asset){
 const bytes=Uint8Array.from(atob(asset.glb),c=>c.charCodeAt(0)),parsed=await new GLTFLoader().parseAsync(bytes.buffer,''),content=parsed.scene,root=new THREE.Group();root.add(content);root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(content);if(box.isEmpty()||!box.min.toArray().concat(box.max.toArray()).every(Number.isFinite))throw Error('Invalid workshop prop bounds.');
 content.position.set(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2);root.updateMatrixWorld(true);return root;
}
export async function preloadWorkshopProps(){
 if(!pending)pending=Promise.all(Object.entries(WORKSHOP_PUBLICATION.layout?.assets||{}).map(async([id,a])=>{if(!templates.has(id))templates.set(id,await parseWorkshopProp(a));})).then(()=>true).catch(()=>{pending=null;return false;});
 return pending;
}
export function addPublishedWorkshopProps({room,collider,layout=WORKSHOP_PUBLICATION.layout}){
 const ids=new Set(Object.keys(layout?.assets||{}));
 for(const o of layout?.objects||[]){if(!o.visible||!ids.has(o.asset))continue;const template=templates.get(o.asset);if(!template)throw Error('Load the workshop props before entering.');const g=template.clone(true);g.name=o.name;g.position.fromArray(o.position);g.rotation.y=THREE.MathUtils.degToRad(o.rotation[1]);g.scale.setScalar(o.scale);g.userData.sharedAsset=true;g.userData.roomObject=o.id;room.add(g);const c=layout.colliders?.find(c=>c.owner===o.id);if(!c)throw Error('Published workshop prop lacks its checked collision shape.');collider(c.x,c.z,c.w,c.d,c.height,c.minY);}
}
