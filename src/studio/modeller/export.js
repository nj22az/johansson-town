/**
 * What leaves Johansson Studio for World, the comics and a 3D printer, each named by the asset's id and version
 * (assetFileName): the GLB (World's look: its materials and vertex colours, real metres, y up), the STL (stl.js:
 * millimetres, z up), the hero PNG (look.js) and the asset card (asset.json). The GLB is written by World's own
 * GLTFExporter (tools/vendor/GLTFExporter.js, three r170 like vendor/three.module.js), as the desktop Studio's is
 * (jojo town-studio modeller/export.js), so a model made on the iPad loads in World exactly as one made on the desktop:
 * its root node is the asset (extras.asset = its name) at the file's origin, its parts are named nodes.
 */
/** userData World and the desktop read back from a GLB (extras): everything else (a lantern's setGlow, materials kept
 *  for a story) is code, not data, and stays behind. */
const KEEP=['asset','part','role','loose','note','name'];

/** asset-id.v3.glb, asset-id.v3.stl, asset-id.v3.png, asset-id.v3.asset.json */
export const assetFileName=(card,ext)=>`${card.id}.v${card.version}.${ext}`;

/** Readies a freshly built model for export: plain userData, the root named as the asset, no halos or lights. */
export function prepareForExport(object,name){
 object.name=name;
 object.traverse(o=>{
  const keep={};for(const k of KEEP)if(Object.hasOwn(o.userData||{},k)&&['string','boolean','number'].includes(typeof o.userData[k]))keep[k]=o.userData[k];
  o.userData=keep;
  if(o.isSprite||o.isLight||o.isPoints||o.isLine)o.visible=false;
 });
 object.userData.asset=name;
 object.position.set(0,0,0);object.quaternion.identity();object.scale.set(1,1,1);
 object.updateMatrixWorld(true);
 return object;
}

/** The GLB bytes of a freshly built model (prepareForExport first). */
export async function exportGlb(object){
 const {GLTFExporter}=await import('../../../tools/vendor/GLTFExporter.js');
 object.updateMatrixWorld(true);
 const data=await new GLTFExporter().parseAsync(object,{binary:true,onlyVisible:true});
 return new Uint8Array(data);
}

/** The JSON chunk of a GLB, to check what was written (the asset's node, its names, its extras). */
export function glbJson(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(view.getUint32(0,true)!==0x46546c67)throw Error('Not a binary glTF (GLB).');
 const length=view.getUint32(12,true);
 return JSON.parse(new TextDecoder().decode(new Uint8Array(bytes.buffer,bytes.byteOffset+20,length)));
}

/** Bytes as base64, in chunks (a GLB is too big for one String.fromCharCode). */
export function base64(bytes){
 let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));
 return btoa(s);
}
export function fromBase64(text){const raw=atob(text),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}

/**
 * The card as World gets it (the desktop's resolveCard): real colliders, anchors, parts, what was measured and the
 * checks it passed, and the model's file. `maker` (a lathe's parameters) is kept, so the asset can be opened again.
 */
export function resolveCard(card,made,result,checks,{checked=new Date().toISOString()}={}){
 const r=v=>+v.toFixed(4),{body,all}=result;
 return {...card,model:'model.glb',
  colliders:result.colliders.map(({auto,...c})=>c),
  anchors:{...card.anchors||{},...made.anchors||{}},
  parts:made.parts,
  measured:{size:[r(body.max.x-body.min.x),r(body.max.y-body.min.y),r(body.max.z-body.min.z)],
   body:{min:body.min.toArray().map(r),max:body.max.toArray().map(r)},all:{min:all.min.toArray().map(r),max:all.max.toArray().map(r)},
   triangles:made.stats.triangles,materials:made.stats.materials,meshes:made.stats.meshes},
  checks:checks.map(({id,ok,detail})=>({id,ok,detail})),checked};
}

/**
 * The package Studio hands over for World's draft (an iPad cannot push to git): the resolved card, its maker's
 * parameters, the GLB and the hero, each file with its sha256. The johansson-studio tools (asset_draft) check it and
 * keep it in data/studio/draft/assets/<id>/ until the creator says "update World".
 */
export const PACKAGE_FORMAT='johansson-studio-asset';
export function assetPackage({card,glb,hero,made='',by='ipad',sha}){
 const file=(bytes,type)=>({type,bytes:bytes.length,sha256:sha(bytes),data:base64(bytes)});
 return {format:PACKAGE_FORMAT,version:1,id:card.id,assetVersion:card.version,made:made||new Date().toISOString(),by,card,
  files:{'model.glb':file(glb,'model/gltf-binary'),...hero?{'hero.png':file(hero,'image/png')}:{}}};
}
