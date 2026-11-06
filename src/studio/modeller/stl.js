/**
 * STL for 3D printing, from a model built in metres with y up (World's frame): binary STL in millimetres with z up, the
 * way slicers expect it (a point (x, y, z) in World is (x, -z, y) × 1000 in the file, so the front, +z in World, faces
 * -y, towards you in a slicer). Every visible mesh goes in; sprites, lines and hidden meshes do not.
 *
 * meshReport() says whether the triangles close up into solids a printer can fill: vertices are welded to 0.01 mm, then
 * every edge must be shared by exactly two triangles running opposite ways. Open edges are holes (an open lantern, a
 * paper sheet); an edge shared by more than two triangles, or two running the same way, is not a clean solid. Separate
 * closed shells (a can's rim on its body) are counted: a slicer prints overlapping closed shells as one.
 */
const WELD=1e-5;

/** Every visible mesh's triangles, in the object's own frame (metres, y up), as one flat Float32Array of xyz. */
export function trianglesOf(THREE,object){
 object.updateMatrixWorld(true);
 const inverse=new THREE.Matrix4().copy(object.matrixWorld).invert(),out=[],v=new THREE.Vector3();
 object.traverse(o=>{
  if(!o.isMesh)return;
  for(let p=o;p;p=p.parent){if(!p.visible)return;if(p===object)break;}
  const pos=o.geometry.attributes.position,idx=o.geometry.index,m=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld);
  const flip=m.determinant()<0,n=idx?idx.count:pos.count;
  for(let i=0;i+2<n;i+=3){
   const tri=[0,1,2].map(k=>idx?idx.getX(i+k):i+k);if(flip)tri.reverse();
   for(const k of tri){v.fromBufferAttribute(pos,k).applyMatrix4(m);out.push(v.x,v.y,v.z);}
  }
 });
 return new Float32Array(out);
}

/** Binary STL bytes of triangles (metres, y up): millimetres, z up. `name` goes in the 80-byte header. */
export function stlBytes(triangles,{name='Johansson Studio'}={}){
 const count=triangles.length/9,buffer=new ArrayBuffer(84+count*50),view=new DataView(buffer);
 const header=`${name} - Johansson Studio - millimetres, z up`.slice(0,80);
 for(let i=0;i<header.length;i++)view.setUint8(i,header.charCodeAt(i)&0x7f);
 view.setUint32(80,count,true);
 const p=new Float32Array(9);
 for(let t=0;t<count;t++){
  for(let k=0;k<3;k++){const x=triangles[t*9+k*3],y=triangles[t*9+k*3+1],z=triangles[t*9+k*3+2];p[k*3]=x*1000;p[k*3+1]=-z*1000;p[k*3+2]=y*1000;}
  const ux=p[3]-p[0],uy=p[4]-p[1],uz=p[5]-p[2],wx=p[6]-p[0],wy=p[7]-p[1],wz=p[8]-p[2];
  let nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
  const at=84+t*50;view.setFloat32(at,nx,true);view.setFloat32(at+4,ny,true);view.setFloat32(at+8,nz,true);
  for(let k=0;k<9;k++)view.setFloat32(at+12+k*4,p[k],true);
  view.setUint16(at+48,0,true);
 }
 return new Uint8Array(buffer);
}

/** Reads a binary STL back: {name, triangles (Float32Array of xyz in the file's units)}. */
export function readStl(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),count=view.getUint32(80,true);
 if(84+count*50!==bytes.byteLength)throw Error(`Not a binary STL: ${count} triangles need ${84+count*50} bytes, the file has ${bytes.byteLength}.`);
 const out=new Float32Array(count*9);
 for(let t=0;t<count;t++)for(let k=0;k<9;k++)out[t*9+k]=view.getFloat32(84+t*50+12+k*4,true);
 return {name:String.fromCharCode(...new Uint8Array(bytes.buffer,bytes.byteOffset,80)).replace(/\0+$/,'').trim(),triangles:out};
}

/**
 * Is it a printable solid? {triangles, vertices, shells, closedShells, openEdges, badEdges, watertight, volume (in the
 * units cubed, positive when the triangles face out), min, max}. `weld` is the distance under which two corners are
 * the same point (in the triangles' units).
 */
export function meshReport(triangles,{weld=WELD}={}){
 const count=triangles.length/9,key=new Map(),ids=new Int32Array(count*3);let vertices=0;
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<count*3;i++){
  const x=triangles[i*3],y=triangles[i*3+1],z=triangles[i*3+2];
  min[0]=Math.min(min[0],x);min[1]=Math.min(min[1],y);min[2]=Math.min(min[2],z);max[0]=Math.max(max[0],x);max[1]=Math.max(max[1],y);max[2]=Math.max(max[2],z);
  const k=Math.round(x/weld)+','+Math.round(y/weld)+','+Math.round(z/weld);
  let id=key.get(k);if(id===undefined){id=vertices++;key.set(k,id);}ids[i]=id;
 }
 // Directed edges: a clean solid has each edge once each way.
 const edges=new Map();let degenerate=0,volume=0;
 for(let t=0;t<count;t++){
  const a=ids[t*3],b=ids[t*3+1],c=ids[t*3+2];
  if(a===b||b===c||c===a){degenerate++;continue;}
  for(const [u,v] of [[a,b],[b,c],[c,a]]){const k=u<v?u+','+v:v+','+u,e=edges.get(k)||{f:0,r:0};if(u<v)e.f++;else e.r++;edges.set(k,e);}
  const o=t*9,[x1,y1,z1,x2,y2,z2,x3,y3,z3]=triangles.subarray(o,o+9);
  volume+=(x1*(y2*z3-z2*y3)-y1*(x2*z3-z2*x3)+z1*(x2*y3-y2*x3))/6;
 }
 let openEdges=0,badEdges=0;
 for(const e of edges.values()){if(e.f+e.r===1)openEdges++;else if(e.f!==1||e.r!==1)badEdges++;}
 // Shells: triangles joined through shared corners.
 const parent=new Int32Array(vertices).map((_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(let t=0;t<count;t++){const a=find(ids[t*3]),b=find(ids[t*3+1]),c=find(ids[t*3+2]);parent[b]=a;parent[find(c)]=a;}
 const shellOpen=new Map();
 for(let t=0;t<count;t++)shellOpen.set(find(ids[t*3]),false);
 for(const [k,e] of edges)if(e.f+e.r!==2||e.f!==1)shellOpen.set(find(Number(k.split(',')[0])),true);
 const shells=shellOpen.size,closedShells=[...shellOpen.values()].filter(v=>!v).length;
 return {triangles:count,vertices,shells,closedShells,openEdges,badEdges,degenerate,watertight:count>0&&!openEdges&&!badEdges,volume,min,max};
}

/** The report in plain words, for 3D printing. */
export function printWords(r,{units='mm'}={}){
 if(!r.triangles)return 'Nothing to print.';
 const size=r.max.map((v,i)=>v-r.min[i]).map(v=>Math.round(v*10)/10).join(' × ');
 if(r.watertight)return `Watertight: ${r.shells===1?'one closed solid':`${r.shells} closed solids (a slicer prints overlapping ones as one)`}, ${size} ${units}, ${r.triangles} triangles.`;
 const why=[];
 if(r.openEdges)why.push(`${r.openEdges} open edges (${r.shells-r.closedShells} of its ${r.shells} parts are open surfaces, like paper or an open end)`);
 if(r.badEdges)why.push(`${r.badEdges} edges shared by more than two faces`);
 return `Not watertight: ${why.join('; ')}. A slicer may refuse it or print the open parts badly; give it a wall thickness and close its ends where the shape allows. ${size} ${units}, ${r.triangles} triangles.`;
}
