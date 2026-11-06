import * as THREE from '../../vendor/three.module.js';
import {shapeHeadPoint} from './head-profile.js';

/**
 * Hats that are models from World's asset catalogue, worn by anyone (the creator, 2026-10-14: "he should be wearing a 3d
 * asset, you should be able to buy a nice hat in the Konbini and wear it"). The first is Johansson's trucker cap
 * (assets/catalog/johansson-trucker/: built in Blender by its source/build-johansson-trucker.py, checked and published by
 * Johansson Studio; the creator, the same day: "I want the hat look like a premium product, for now make it a trucker Cap
 * with the J logo on it").
 *
 * How it works:
 *  - A recipe names the hat (`outfit.hat: 'trucker'`). ASSET_HATS says which catalogue asset that is, and which of
 *    build.js's own hats stands in for it while the model is not in hand (never a bare head).
 *  - Somebody fetches the model once (World: src/catalog/hat-models.js; a test or a tool: the file from disk; the film:
 *    its own copy) and hands its bytes to provideHatModel(). The GLB is read here, without GLTFLoader, so this file runs
 *    wherever build.js runs (Node, World, Studio, the film's copy of the avatars) and a body is built in one go.
 *  - build.js asks assetHatPieces(recipe, m) for the hat's pieces, fitted to this head, and binds them to the head bone
 *    like every other part, as the last range of the body: the hat comes off (setHat) and goes on a hook
 *    (buildHatProp) as every hat does, and follows the head in every move.
 *  - The fit: the model records the head it was built on (extras `wear.head`: its centre and radii, the town's default
 *    adult). A point's place on that head, in head radii, is carried to the same place on the wearer's head (their radii,
 *    and the shape of their head: head-profile.js), so it sits the same on a child, a big round head or a narrow one.
 *  - The hair: under the crown it is pressed in to the cap's sweatband (`wear.tuck`), above the band line all round,
 *    except in the snapback's opening above the strap, where it shows (and a ponytail comes through). hatTuck() gives
 *    build.js that rule.
 *  - The colours: the model says which recipe colour each material takes (`wear.tint`: the trucker's foam front and
 *    bill the wearer's `hatColour`, its mesh, undervisor, piping, rope and J the `accent`), its vertex colour a shade of
 *    it; the other materials carry their own colours (the sweatband, the straps, the gold outline, the woven label).
 *  - See-through parts (`wear.seeThrough`: the trucker's mesh) are not part of the body: assetHatPieces() returns them
 *    apart, with their texture coordinates, and build.js draws them as the hat's see-through layer (bound to the head,
 *    hidden with the hat), in the knit of weaveTexture(), so the hair and head show faintly through.
 */

/** Recipe hat id → its catalogue asset, and the hat build.js draws until the model is in hand. */
export const ASSET_HATS=Object.freeze({
 trucker:Object.freeze({asset:'johansson-trucker',standIn:'cap',name:'Johansson trucker cap'}),
});
export const isAssetHat=id=>Object.hasOwn(ASSET_HATS,id);
/** The catalogue ids of every asset hat (what a page fetches before it builds people). */
export const assetHatIds=()=>[...new Set(Object.values(ASSET_HATS).map(h=>h.asset))];

const models=new Map();
/** True once the model of a hat (a recipe hat id or a catalogue id) is in hand. */
export function hatModelLoaded(id){const asset=ASSET_HATS[id]?.asset??id;return models.has(asset);}
/**
 * The parsed model of a catalogue hat, or null: {asset, wear, meshes:[{name, material, ink, inkAt, position, colour, uv,
 * index}]}. `ink` is the node's (extras), `inkAt` each vertex's (its colour's alpha: 0 where the outline must not stand).
 */
export const hatModel=id=>models.get(ASSET_HATS[id]?.asset??id)||null;

// ---- Reading the GLB ----------------------------------------------------------------------------------------------
const COMPONENTS={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const ARRAYS={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
const NORMALIZE={5120:127,5121:255,5122:32767,5123:65535};

function readAccessor(json,bin,index){
 const a=json.accessors[index],view=json.bufferViews[a.bufferView],Type=ARRAYS[a.componentType],n=COMPONENTS[a.type];
 if(!Type||!n)throw new Error(`hat model: accessor ${index} has a type this reader does not know`);
 if(a.sparse)throw new Error('hat model: sparse accessors are not read');
 const size=Type.BYTES_PER_ELEMENT,stride=view.byteStride||size*n,start=bin.byteOffset+(view.byteOffset||0)+(a.byteOffset||0);
 const out=new Float32Array(a.count*n),dv=new DataView(bin.buffer);
 const get={5120:'getInt8',5121:'getUint8',5122:'getInt16',5123:'getUint16',5125:'getUint32',5126:'getFloat32'}[a.componentType];
 const scale=a.normalized?1/NORMALIZE[a.componentType]:1;
 for(let i=0;i<a.count;i++)for(let k=0;k<n;k++)out[i*n+k]=dv[get](start+i*stride+k*size,true)*scale;
 return {array:out,itemSize:n,count:a.count};
}
const extrasOf=o=>{const e=o?.extras;return e&&typeof e==='object'?e:{};};
const parseMaybe=v=>{if(typeof v!=='string')return v;try{return JSON.parse(v);}catch{return v;}};

/**
 * Reads a binary glTF (Blender's, or the one Johansson Studio exports from it with three's GLTFExporter) into what a hat
 * needs: every triangle mesh in the file's frame (its nodes' transforms applied), its material's name, its vertex
 * colours, whether World inks it (node extras `ink`, 1 when it does not say), and the `wear` record from the node that
 * carries it. Strict: anything it does not read (no positions, no triangles, a missing `wear`) throws.
 */
export function readHatGlb(bytes){
 const data=bytes instanceof ArrayBuffer?new Uint8Array(bytes):new Uint8Array(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const dv=new DataView(data.buffer,data.byteOffset,data.byteLength);
 if(dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2)throw new Error('hat model: not a binary glTF 2.0');
 let at=12,json=null,bin=null;
 while(at<dv.byteLength){
  const length=dv.getUint32(at,true),type=dv.getUint32(at+4,true),chunk=new Uint8Array(data.buffer,data.byteOffset+at+8,length);
  if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(chunk));else if(type===0x004e4942)bin=chunk;
  at+=8+length;
 }
 if(!json||!bin)throw new Error('hat model: no JSON or no binary chunk');
 const meshes=[];let wear=null,asset=null;
 const visit=(index,parent)=>{
  const node=json.nodes[index],extras=extrasOf(node),local=new THREE.Matrix4();
  if(node.matrix)local.fromArray(node.matrix);
  else local.compose(new THREE.Vector3(...(node.translation||[0,0,0])),new THREE.Quaternion(...(node.rotation||[0,0,0,1])),new THREE.Vector3(...(node.scale||[1,1,1])));
  const world=parent.clone().multiply(local);
  if(extras.wear&&!wear){wear=parseMaybe(extras.wear);asset=extras.asset||extras.name||node.name;}
  if(node.mesh!==undefined)for(const prim of json.meshes[node.mesh].primitives){
   if((prim.mode??4)!==4)throw new Error('hat model: only triangles are read');
   const P=readAccessor(json,bin,prim.attributes.POSITION),C=prim.attributes.COLOR_0!==undefined?readAccessor(json,bin,prim.attributes.COLOR_0):null;
   const position=new Float32Array(P.count*3),v=new THREE.Vector3();
   for(let i=0;i<P.count;i++){v.fromArray(P.array,i*3).applyMatrix4(world);v.toArray(position,i*3);}
   const colour=new Float32Array(P.count*3),ink=new Float32Array(P.count).fill(1);
   for(let i=0;i<P.count;i++){for(let k=0;k<3;k++)colour[i*3+k]=C?C.array[i*C.itemSize+k]:1;if(C?.itemSize===4)ink[i]=C.array[i*4+3];}
   const T=prim.attributes.TEXCOORD_0!==undefined?readAccessor(json,bin,prim.attributes.TEXCOORD_0):null;
   const index=prim.indices!==undefined?Uint32Array.from(readAccessor(json,bin,prim.indices).array):Uint32Array.from({length:P.count},(_,i)=>i);
   const material=prim.material!==undefined?json.materials[prim.material].name||'':'';
   meshes.push({name:extras.name||node.name||'',material,ink:extras.ink===undefined?1:+extras.ink,inkAt:ink,position,colour,uv:T?Float32Array.from(T.array):null,index});
  }
  for(const child of node.children||[])visit(child,world);
 };
 const scene=json.scenes[json.scene??0];
 for(const root of scene.nodes)visit(root,new THREE.Matrix4());
 if(!wear?.head?.radii||!wear?.band||!wear?.tuck)throw new Error('hat model: no `wear` record (the head it was built on, its band, its tuck)');
 if(!meshes.length)throw new Error('hat model: no meshes');
 return {asset,wear,meshes};
}

/** Takes a hat's model (the GLB's bytes, fetched or read by whoever has it) for a catalogue id. Returns the parsed model. */
export function provideHatModel(assetId,bytes){
 if(!Object.values(ASSET_HATS).some(h=>h.asset===assetId))throw new Error(`${JSON.stringify(assetId)} is not a hat in ASSET_HATS`);
 const model=readHatGlb(bytes);
 models.set(assetId,Object.freeze(model));
 return model;
}

// ---- The band, the opening and the tuck, from the model's `wear` record --------------------------------------------
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const smooth=(e0,e1,x)=>{const t=Math.min(1,Math.max(0,(x-e0)/(e1-e0)));return t*t*(3-2*t);};
/**
 * The band's bottom edge (head radii above the head's centre) at azimuth phi (0 the front, +π/2 the wearer's left): in
 * front it follows the bill's curve from the forehead down to the temples, behind them it settles over the ears to the
 * nape. The same curve the build script cut the crown to (build-johansson-trucker.py band_y).
 */
export function bandHeight(wear,phi){
 const {front,side,back,billRoot,arch}=wear.band,a=Math.abs(wrap(phi));
 if(a<=billRoot)return front-arch*(Math.sin(a)/Math.sin(billRoot))**2;
 const f=(a-billRoot)/(Math.PI-billRoot),m0=-arch*2*Math.cos(billRoot)/Math.sin(billRoot)*(Math.PI-billRoot)/(side-back);
 return back+(side-back)*((2*f**3-3*f**2+1)+(f**3-2*f**2+f)*m0);
}

/**
 * The hair rule under an asset hat, or null (not an asset hat, or its model is not in hand: the stand-in's own rule
 * applies). A function of a hair point in head radii (x, y, z, its distance r from the head's centre) that returns how far
 * out it may be: pressed in to the sweatband above the band line (ramping in over the last 0.08 below it, so the hair is
 * held by the band rather than cut), left alone below it and in the snapback's opening above the strap.
 */
export function hatTuck(recipe){
 const model=hatModel(recipe?.outfit?.hat);
 if(!isAssetHat(recipe?.outfit?.hat)||!model)return null;
 const w=model.wear,{radius,front,frontFrom,frontTo}=w.tuck,o=w.opening;
 return (x,y,z,r)=>{
  const phi=Math.atan2(x,z),band=bandHeight(w,phi);
  if(o){const d=Math.abs(wrap(phi-Math.PI))/o.halfWidth;if(d<1&&y>band+o.strapHeight&&y<band+o.height*Math.sqrt(1-d*d))return r;}
  const limit=radius+(front-radius)*smooth(frontFrom,frontTo,Math.cos(phi)),hold=smooth(band-.08,band,y);
  return r>limit?r-(r-limit)*hold:r;
 };
}

// ---- Wearing it ------------------------------------------------------------------------------------------------------
const key=(r,g,b)=>`${Math.round(r*4096)},${Math.round(g*4096)},${Math.round(b*4096)}`;
/** Which recipe colour a material takes (the model's `wear.tint`; a model without one: its `cloth` takes hatColour). */
const tintOf=(wear,material)=>(wear.tint||{cloth:'hatColour'})[material]||null;
/**
 * The hat's pieces on this head, or null when its model is not in hand: [{geometry (non-indexed, positions in the body's
 * model space, normals; a see-through piece also its `uv`), colour (THREE.Color, linear), ink (0 or 1), name, seeThrough}],
 * one piece per mesh and colour, for build.js to paint and bind to the head bone. `m` is build.js measure(recipe).
 */
export function assetHatPieces(recipe,m){
 const model=hatModel(recipe.outfit.hat);
 if(!isAssetHat(recipe.outfit.hat)||!model)return null;
 const {centre,radii}=model.wear.head,R=m.Rh,S=[m.headSX*R,m.headSY*R,R*.98],clear=new Set(model.wear.seeThrough||[]);
 const u=new THREE.Vector3(),pieces=[];
 for(const mesh of model.meshes){
  // Carried onto this head: the place on the head it was built on, in head radii, shaped as this head is.
  const P=mesh.position,count=P.length/3,out=new Float32Array(P.length);
  for(let i=0;i<count;i++){
   u.set((P[i*3]-centre[0])/radii[0],(P[i*3+1]-centre[1])/radii[1],(P[i*3+2]-centre[2])/radii[2]);
   shapeHeadPoint(u,m.profile);
   out[i*3]=u.x*S[0];out[i*3+1]=m.headCentre+u.y*S[1];out[i*3+2]=u.z*S[2];
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(out,3));
  if(mesh.uv)g.setAttribute('uv',new THREE.BufferAttribute(mesh.uv,2));
  g.setIndex(new THREE.BufferAttribute(mesh.index,1));g.computeVertexNormals();
  const flat=g.toNonIndexed();g.dispose();
  const tint=tintOf(model.wear,mesh.material),base=tint?new THREE.Color(recipe.outfit[tint]):null,seeThrough=clear.has(mesh.material);
  // One piece per colour: a triangle takes its first corner's colour (the model's colours are per face).
  const groups=new Map(),I=mesh.index,C=mesh.colour;
  for(let t=0;t<I.length/3;t++){
   const c=I[t*3],k=key(C[c*3],C[c*3+1],C[c*3+2]);
   if(!groups.has(k))groups.set(k,{shade:[C[c*3],C[c*3+1],C[c*3+2]],tris:[]});
   groups.get(k).tris.push(t);
  }
  for(const {shade,tris} of groups.values()){
   const piece=new THREE.BufferGeometry();
   for(const [name,size] of [['position',3],['normal',3],...(seeThrough&&mesh.uv?[['uv',2]]:[])]){
    const from=flat.attributes[name].array,to=new Float32Array(tris.length*3*size);
    tris.forEach((t,j)=>to.set(from.subarray(t*3*size,(t+1)*3*size),j*3*size));
    piece.setAttribute(name,new THREE.BufferAttribute(to,size));
   }
   const own=new THREE.Color(shade[0],shade[1],shade[2]),colour=base?base.clone().multiply(own):own;
   // How much ink each corner carries: the node's, times the vertex's own (its colour's alpha).
   const inkCorners=new Float32Array(tris.length*3);tris.forEach((t,j)=>{for(let k=0;k<3;k++)inkCorners[j*3+k]=mesh.inkAt[I[t*3+k]];});
   pieces.push({geometry:piece,colour,ink:mesh.ink&&!seeThrough?1:0,inkCorners,name:mesh.name,seeThrough,weave:seeThrough?model.wear.weave||null:null});
  }
  flat.dispose();
 }
 return pieces;
}

/**
 * The knit of a see-through part (the model's `wear.weave`: round holes on a tile, `tile` metres of it): a white tile
 * whose alpha is the threads, repeated by the part's texture coordinates; one per page. Null where there is no canvas
 * (Node): the layer is then a plain, half-clear cloth.
 */
let weaveCache=null;
export function weaveTexture(weave){
 if(weaveCache)return weaveCache;
 if(typeof document==='undefined')return null;
 const size=weave?.size||64,c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext?.('2d');
 if(!ctx?.createImageData)return null;
 const img=ctx.createImageData(size,size),holes=weave?.holes||[[.25,.25],[.75,.75]],r=weave?.radius||.17;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const uu=(x+.5)/size,vv=(y+.5)/size;
  const d=Math.min(...holes.map(([hu,hv])=>Math.hypot(((uu-hu+1.5)%1)-.5,((vv-hv+1.5)%1)-.5)));
  const a=Math.min(1,Math.max(0,(d-r)*size/1.5+.5)),i=(y*size+x)*4;
  img.data[i]=img.data[i+1]=img.data[i+2]=255;img.data[i+3]=Math.round(a*255);
 }
 ctx.putImageData(img,0,0);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 return weaveCache=t;
}
