import * as THREE from '../../vendor/three.module.js';
import {AUTHORED_SKIRT} from './authored-skirt-data.js';
import {skirtSpec,skirtRadiusAt} from './skirt-shape.js';

const SECTIONS=[[0,.13676,.12574],[.074,.14410,.12929],[.167,.15538,.13504],[.259,.16519,.14034],[.352,.17376,.14512],[.444,.18099,.14874],[.537,.18684,.15131],[.630,.19177,.15275],[.722,.19592,.15332],[.815,.19934,.15357],[1,.19934,.15357]];
function section(f){for(let i=1;i<SECTIONS.length;i++)if(f<=SECTIONS[i][0]){const a=SECTIONS[i-1],b=SECTIONS[i],t=THREE.MathUtils.clamp((f-a[0])/(b[0]-a[0]),0,1);return [THREE.MathUtils.lerp(a[1],b[1],t),THREE.MathUtils.lerp(a[2],b[2],t)];}return SECTIONS.at(-1).slice(1);}

/** Original Blender panel mesh fitted before skinning. Same topology for every
 * body; its short returns remain open rather than adding hidden full lining. */
export function authoredSkirtGeometry(m,bodyVolume=null){
 const spec=skirtSpec(m),positions=[],uv=[],indices=[];
 for(const part of AUTHORED_SKIRT){
  const offset=positions.length/3;
  for(let i=0;i<part.position.length;i+=3){
   const [x,y,z]=part.position.slice(i,i+3),f=THREE.MathUtils.clamp((-.105-y)/.27,0,1),[rx,rz]=section(f),r=skirtRadiusAt(spec,f);
   const p=new THREE.Vector3(x/rx*r,spec.waist+(y+.105)/.27*spec.length,(z-.0491)/rz*r*m.depth/m.width);
   // The broad pelvis and the narrow waist are different cross-sections. Fit
   // each upper vertex to the actual torso instead of scaling one oval globally.
   if(bodyVolume&&p.y>m.hipY-m.torso*.08&&bodyVolume.sdf(p)<.005*m.k){
    const radial=new THREE.Vector3(p.x,0,p.z).normalize();p.copy(bodyVolume.layOn(p,radial,.006*m.k));
   }
   positions.push(p.x,p.y,p.z);
  }
  uv.push(...part.uv);indices.push(...part.index.map(i=>i+offset));
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
 // glTF UV splits must not introduce visible hard seams after body fitting.
 const P=g.attributes.position,N=g.attributes.normal,sums=new Map(),keys=[];
 for(let i=0;i<P.count;i++){const key=[P.getX(i),P.getY(i),P.getZ(i)].map(v=>Math.round(v*1e6)).join(',');keys.push(key);const sum=sums.get(key)||new THREE.Vector3();sum.add(new THREE.Vector3().fromBufferAttribute(N,i));sums.set(key,sum);}
 for(let i=0;i<P.count;i++){const n=sums.get(keys[i]).normalize();N.setXYZ(i,n.x,n.y,n.z);}
 g.userData.keepUV=true;g.userData.skirtSpec=spec;return g;
}

let weave;
export function authoredSkirtMaterial(outfit={}){
 if(!weave){
  const size=64,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x*Math.PI/4,v=y*Math.PI/4,n=new THREE.Vector3(-.2*Math.cos(u)*(.55+.45*Math.sin(v)),-.2*Math.cos(v)*(.55-.45*Math.sin(u)),1).normalize(),i=(y*size+x)*4;data[i]=(n.x*.5+.5)*255;data[i+1]=(n.y*.5+.5)*255;data[i+2]=(n.z*.5+.5)*255;data[i+3]=255;}
  weave=new THREE.DataTexture(data,size,size);weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.generateMipmaps=true;weave.minFilter=THREE.LinearMipmapLinearFilter;weave.magFilter=THREE.LinearFilter;weave.needsUpdate=true;
 }
 let map=null;
 if(['plaid','stripes'].includes(outfit.bottomPattern)){
  const size=64,data=new Uint8Array(size*size*4),base=parseInt(outfit.bottomColour.slice(1),16),accent=parseInt(outfit.accent.slice(1),16);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const line=x%16<3||(outfit.bottomPattern==='plaid'&&y%16<3),c=line?accent:base,i=(y*size+x)*4;
   data[i]=c>>16;data[i+1]=(c>>8)&255;data[i+2]=c&255;data[i+3]=255;
  }
  map=new THREE.DataTexture(data,size,size);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(3,2);map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.needsUpdate=true;
 }
 return new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:!map,map,roughness:.78,metalness:0,sheen:.10,sheenColor:0x777777,sheenRoughness:.55,normalMap:weave,normalScale:new THREE.Vector2(.08,.08),side:THREE.DoubleSide});
}
