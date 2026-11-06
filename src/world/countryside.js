import * as THREE from '../../vendor/three.module.js';
import {routeAt,groundHeight} from './layout.js';

/**
 * The island's countryside: what an Okinawan island outside the harbour town looked like
 * in 1997, in the open grass that used to be just grass.
 *
 *  - sugar cane (サトウキビ) in long fields on red earth, with field tracks between them;
 *  - a family's vegetable plots by Kitahama: cabbage, sweet potato and a gōya trellis;
 *  - a farmstead with a red-tile roof, a coral-stone wall, a water tank and a cattle pen,
 *    and its cows grazing;
 *  - turtleback tombs (亀甲墓) on the west coast, facing the sea;
 *  - a field shed and a scarecrow.
 *
 * Nothing is placed by hand alone: every field cell and building is checked against the
 * town's own ground map, the colliders and the trees, so nothing lands on a road, a
 * path, a garden or a house. Cane is walk-through (it is a toy island); buildings, tombs
 * and the pen fence are solid. Most of it is a few instanced meshes.
 */

/** Fields: [x0,z0,x1,z1,kind]. Cells that are not open grass are left out. */
export const FIELDS=Object.freeze([
 // Behind the park and the Kitahama houses, west of the lanes.
 [-38,70,-10,106,'cane'],
 [-6,80,16,104,'vegetables'],
 // The west of the uplands, below the trees.
 [-46,110,-6,156,'cane'],
 // The south band, between the woods and the coast road.
 [-30,226,30,252,'cane'],
 [38,232,92,252,'cane'],
 // East, inland of the coast road.
 [98,148,128,176,'cane'],
 [62,100,84,122,'vegetables'],
 // Fumoto's kitchen gardens, across the lower lane from the houses.
 [6,217,32,224,'vegetables'],
].map(Object.freeze));
/** Buildings and things that stand alone: [x,z,kind,yaw]. */
export const STEADS=Object.freeze([
 // The Ōshiro farmstead in the corner of its own cane, the pen beside the house.
 [-39,117,'farmhouse',0],[-28,118,'pen',0],[-29.5,110,'tank',0],[-19,113,'shed',0],
 [-46,172,'tomb',-Math.PI/2],[-47,183,'tomb',-Math.PI/2],[-45,194,'tomb',-Math.PI/2],
 [6,92,'trellis',0],[-20,108,'scarecrow',0],[108,180,'shed',Math.PI/2],
].map(Object.freeze));

const OPEN=new Set(['island-ground','island-uplands']);

export function buildCountryside({world,register=()=>{},onAction=()=>{},mobile=false}){
 const group=new THREE.Group();group.name='Island countryside';world.group.add(group);
 const mats=new Map(),mat=(c,extra={})=>{const k=c+JSON.stringify(extra);if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.9,...extra}));return mats.get(k);};
 const trees=world.islandTrees||[];
 const blockedBy=(x,z,pad)=>(world.colliders||[]).some(c=>c.id!=='countryside'&&Math.abs(c.x-x)<(c.w||0)/2+pad&&Math.abs(c.z-z)<(c.d||0)/2+pad);
 /** Open grass, clear of colliders and trees, with `pad` metres to spare all round. */
 const open=(x,z,pad=1)=>{
  for(const [dx,dz] of [[0,0],[pad,0],[-pad,0],[0,pad],[0,-pad]]){const r=routeAt(x+dx,z+dz);if(!r||r.id!=='building-circuit-oshiro-farmhouse'&&(r.surface!=='grass'||!OPEN.has(r.id)))return false;}
  if(blockedBy(x,z,pad))return false;
  return !trees.some(([tx,,tz])=>Math.hypot(tx-x,tz-z)<pad+2.4);
 };
 const solid=(x,z,w,d,h)=>world.colliders.push({id:'countryside',x,z,w,d,height:h});
 const anchor=(x,z,y,label,title,text)=>{const a=new THREE.Object3D();a.position.set(x,y,z);a.name=label;group.add(a);register(a,label,()=>onAction('inspect',title,text));};
 const placed={cane:0,crops:0,steads:[]},footprints=[];
 const inStead=(x,z,pad)=>footprints.some(([fx,fz,hw,hd])=>Math.abs(fx-x)<hw+pad&&Math.abs(fz-z)<hd+pad);

 // ---- The farmstead, the tombs, and the odd things in the fields.
 const cows=[];
 for(const [x,z,kind,yaw] of STEADS){
  const size={farmhouse:[9,8],pen:[7,6],tank:[2,2],shed:[3.2,2.6],tomb:[5,6],trellis:[4,1.6],scarecrow:[.8,.8]}[kind];
  const pad=Math.max(...size)/2+.4;
  if(!open(x,z,pad))continue;
  footprints.push([x,z,size[0]/2,size[1]/2]);
  const g=new THREE.Group();g.position.set(x,groundHeight(x,z),z);g.rotation.y=yaw;g.name='Countryside '+kind;group.add(g);
  // Farm buildings, tombs and fences stand still (the cows are built apart): batched draws.
  const add=(geo,c,px,py,pz,name)=>{const m=new THREE.Mesh(geo,typeof c==='number'?mat(c):c);m.position.set(px,py,pz);if(name)m.name=name;m.castShadow=true;m.receiveShadow=true;m.userData.staticProp=true;g.add(m);return m;};
  const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
  if(kind==='farmhouse'){
   add(B(6.4,2.6,5.2),0xe8dcc0,0,1.3,0,'Farmhouse');
   const roof=new THREE.ConeGeometry(5.1,1.7,4,1);roof.rotateY(Math.PI/4);roof.scale(1.18,1,1);add(roof,0xc4553a,0,3.45,0,'Red-tile roof');
   add(B(.9,1.9,.06),0x6d4a2c,1.4,.95,2.63,'Farmhouse door');add(B(1.4,.9,.06),0x9fc4d6,-1.4,1.5,2.63);
   // The coral-stone wall round the yard, open to the south.
   for(const [w,d,px,pz] of [[9,.4,0,-4],[.4,8,-4.5,0],[.4,8,4.5,0],[3,.4,-3,4],[3,.4,3,4]])add(B(w,1.1,d),0xd9cfb2,px,.55,pz,'Coral-stone wall');
   const shisa=add(new THREE.SphereGeometry(.18,10,8),0xd2804a,0,4.3,.4,'Shisa');shisa.scale.set(1,.9,1.2);
   solid(x,z,6.6,5.4,2.6);for(const [w,d,px,pz] of [[9,.4,0,-4],[.4,8,-4.5,0],[.4,8,4.5,0]]){const p=rot(px,pz,yaw);solid(x+p[0],z+p[1],yaw?d:w,yaw?w:d,1.1);}
   anchor(x,z+4.6,1.4,'Look at the farmhouse','The Ōshiro farm','Three generations under one red roof. The cane is theirs, and so are the cows; the grandmother keeps the vegetable plots by Kitahama and leaves cabbages on doorsteps.');
  }else if(kind==='pen'){
   for(const [w,d,px,pz] of [[7,.08,0,-3],[7,.08,0,3],[.08,6,-3.5,0],[.08,6,3.5,0]]){add(B(w,.08,d),0x8a6a46,px,.9,pz);add(B(w,.08,d),0x8a6a46,px,.5,pz);}
   for(const [px,pz] of [[-3.5,-3],[3.5,-3],[-3.5,3],[3.5,3],[0,-3],[0,3]])add(B(.12,1.1,.12),0x6d5238,px,.55,pz);
   add(B(1.6,.4,.6),0x7d8a8e,2.2,.2,-2.2,'Water trough');
   for(const [w,d,px,pz] of [[7,.2,0,-3],[7,.2,0,3],[.2,6,-3.5,0],[.2,6,3.5,0]])solid(x+px,z+pz,w,d,1.1);
   for(let i=0;i<3;i++){const cow=buildCow(mat,i);cow.position.set(-1.8+i*1.7,0,-.6+(i%2)*1.4);cow.rotation.y=i*1.9;g.add(cow);cows.push({cow,phase:i*2.1,base:cow.rotation.y});}
   anchor(x,z+3.6,1.2,'Look at the cows','Ōshiro’s cows','Three black-and-white cows and their opinions. Island beef goes to Ishigaki at two years old; these three are kept for the milk and the company.');
  }else if(kind==='tank'){
   add(new THREE.CylinderGeometry(.75,.75,1.4,16),0x2a8fcc,0,1.9,0,'Water tank');for(const [px,pz] of [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]])add(B(.1,1.2,.1),0x9aa3a0,px,.6,pz);solid(x,z,1.6,1.6,2.6);
  }else if(kind==='shed'){
   add(B(3,2.1,2.4),0x9a9a8e,0,1.05,0,'Field shed');add(B(3.3,.08,2.8),0x7d8a8e,0,2.15,0);add(B(.06,1.8,1.2),0x5f6a6c,1.53,.9,0);
   const p=rot(0,0,yaw);solid(x+p[0],z+p[1],yaw?2.5:3.1,yaw?3.1:2.5,2.2);
  }else if(kind==='tomb'){
   // A turtleback tomb: the shell, the stone front with its sealed door, the low wall
   // wings round the forecourt where the family eats at Shīmī.
   const shell=add(new THREE.SphereGeometry(2,18,10,0,Math.PI*2,0,Math.PI/2),0xcfc6ad,0,.9,-.6,'Turtleback tomb');shell.scale.set(1.15,.75,1.2);
   add(B(4.6,.9,4.6),0xc2b89c,0,.45,-.6);add(B(3.6,1.6,.3),0xd6cdb3,0,.8,1.75,'Tomb front');add(B(.9,.9,.08),0x7d7564,0,.6,1.92,'Sealed door');
   for(const s of [-1,1])add(B(.35,.7,2.0),0xc9bfa4,s*1.95,.35,2.8,'Forecourt wall');
   const p=rot(0,-.2,yaw);solid(x+p[0],z+p[1],5,5,1.8);
   placed.tombs=(placed.tombs||0)+1;
   if(placed.tombs===1)anchor(x-2.8,z,1.2,'Look at the turtleback tombs','Kamekōbaka · turtleback tombs','The family tombs, shaped like a turtle’s back -- or, the old people say, a mother’s womb. At Shīmī in April the families sweep the forecourt and eat a picnic there with the ancestors.');
  }else if(kind==='trellis'){
   for(const [px] of [[-1.9],[-.6],[.6],[1.9]])for(const pz of [-.7,.7])add(B(.08,1.9,.08),0x8a6a46,px,.95,pz);
   add(B(4,.05,1.6),0x8a6a46,0,1.9,0);
   const leaves=add(B(3.9,.35,1.5),new THREE.MeshStandardMaterial({color:0x4f8a3e,roughness:.95}),0,1.78,0,'Gōya trellis');void leaves;
   for(let i=0;i<9;i++){const goya=add(new THREE.CapsuleGeometry(.07,.28,4,8),0x5f9e3a,-1.7+i*.42,1.45,(i%2?.35:-.35),'Gōya');goya.rotation.z=.15*(i%3-1);}
   for(const s of [-1,1])add(B(4,1.5,.03),new THREE.MeshStandardMaterial({color:0x5f9a48,roughness:.95,transparent:true,opacity:.85,side:THREE.DoubleSide}),0,1.05,s*.8,'Green curtain');
   anchor(x,z+1.4,1.4,'Look at the gōya trellis','Gōya','Bitter melon climbing a net: warty, bright green, the length of your hand. Sliced thin and fried with egg, tofu and Spam, it is champurū.');
  }else if(kind==='scarecrow'){
   add(B(.08,1.8,.08),0x6d5238,0,.9,0);add(B(1.2,.08,.08),0x6d5238,0,1.45,0);add(B(.5,.6,.2),0x3f6a8a,0,1.35,0,'Scarecrow');
   add(new THREE.SphereGeometry(.17,10,8),0xe8dcc0,0,1.85,0);add(new THREE.ConeGeometry(.38,.22,12),0xd8b864,0,2.05,0,'Straw hat');

  }
  placed.steads.push(kind);
 }
 // ---- Fields. Red earth under every field; cane in rows, or beds of crops.
 const soil=mat(0x9c5a3c),track=mat(0xb07a52);
 const caneGeo=caneClump(),caneMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,side:THREE.DoubleSide});
 const cropGeo=new THREE.SphereGeometry(.32,7,5);cropGeo.scale(1,.55,1);
 const cane=[],crops=[],dummy=new THREE.Object3D();
 const cell=mobile?1.5:1.15;
 FIELDS.forEach(([x0,z0,x1,z1,kind],f)=>{
  const beds=[];
  // Cells of two metres: a cell is farmed if it is open, and the soil is laid per row run.
  for(let z=z0;z<z1;z+=2)for(let x=x0;x<x1;x+=2){if(open(x+1,z+1,1.2)&&!inStead(x+1,z+1,1.2))beds.push([x,z]);}
  if(!beds.length)return;
  const soilGeo=new THREE.BoxGeometry(2,.05,2),soilMesh=new THREE.InstancedMesh(soilGeo,soil,beds.length);soilMesh.name='Field earth';
  beds.forEach(([x,z],i)=>{dummy.position.set(x+1,groundHeight(x+1,z+1)+.03,z+1);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();soilMesh.setMatrixAt(i,dummy.matrix);});
  soilMesh.receiveShadow=true;group.add(soilMesh);
  for(const [x,z] of beds){
   if(kind==='cane'){for(let a=.3;a<2;a+=cell)for(let b=.3;b<2;b+=cell*.8){const h=hash(x+a,z+b,f);cane.push([x+a+h*.25,z+b,h]);}}
   else{for(let a=.35;a<2;a+=.65)for(let b=.5;b<2;b+=1){crops.push([x+a,z+b,hash(x+a,z+b,f)]);}}
  }
  // A field track along the field's north edge, where the farmer drives in.
  // Clip the entire track against roads and the compact shoreline, not only its midpoint.
  for(let x=x0;x<x1;x+=.7){const w=Math.min(.7,x1-x),cx=x+w/2,z=z0-.8;if(!open(cx,z,.8))continue;
   const t=new THREE.Mesh(new THREE.BoxGeometry(w,.04,1.4),track);t.position.set(cx,groundHeight(cx,z)+.02,z);t.name='Field track';t.userData.staticProp=true;group.add(t);}
  anchor((x0+x1)/2,z0+1,1.2,kind==='cane'?'Look at the sugar cane':'Look at the vegetable plots',kind==='cane'?'Sugar cane':'Vegetable plots',
   kind==='cane'?'Cane taller than you, planted in rows on the island’s red earth. It is cut by hand from January and taken on the ferry to the mill on the main island; the stalks you can buy at the shop are for chewing.':
   'Cabbage, beni-imo sweet potato with its purple leaves, spring onions, and a row of shima-rakkyō. Everybody on the island grows a little more than they can eat and gives the rest away.');
 });
 if(cane.length){
  const m=new THREE.InstancedMesh(caneGeo,caneMat,cane.length);m.name='Sugar cane';
  cane.forEach(([x,z,h],i)=>{dummy.position.set(x,groundHeight(x,z)+.04,z);dummy.rotation.set(0,h*6.28,0);dummy.scale.set(1,.85+h*.35,1);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});
  group.add(m);placed.cane=cane.length;
 }
 if(crops.length){
  const m=new THREE.InstancedMesh(cropGeo,mat(0xffffff),crops.length);m.name='Vegetables';
  const leaf=[new THREE.Color(0x9cc56a),new THREE.Color(0x6e8f3c),new THREE.Color(0x7a4a7a),new THREE.Color(0x4f8a3e)];
  crops.forEach(([x,z,h],i)=>{dummy.position.set(x,groundHeight(x,z)+.12,z);dummy.rotation.set(0,h*6,0);const s=.8+h*.5;dummy.scale.set(s,s,s);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,leaf[Math.floor(h*4)%4]);});
  group.add(m);placed.crops=crops.length;
 }

 world.countryside={group,placed};
 return {group,placed,update(time){for(const c of cows){const t=time*.25+c.phase;c.cow.rotation.y=c.base+Math.sin(t*.3)*.5;const head=c.cow.userData.head;if(head)head.rotation.x=.35+Math.max(0,Math.sin(t))*.45;}}};
}

/** A clump of cane: three stalks with a fan of leaves, coloured green to yellow-green. */
function caneClump(){
 const parts=[];const c1=new THREE.Color(0x7aa04a),c2=new THREE.Color(0xa9c25c),c3=new THREE.Color(0x58823a);
 const paint=(g,c)=>{const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;};
 for(let i=0;i<3;i++){const a=i*2.09,r=.1;const s=new THREE.CylinderGeometry(.03,.04,2.2,4,1,true);s.translate(Math.cos(a)*r,1.1,Math.sin(a)*r);parts.push(paint(s,c1).toNonIndexed());}
 for(let i=0;i<6;i++){const leaf=new THREE.PlaneGeometry(.16,1.3);leaf.translate(0,.65,0);leaf.rotateZ(.9);leaf.rotateY(i*1.05);leaf.translate(0,1.55+(i%3)*.25,0);parts.push(paint(leaf,i%2?c2:c3).toNonIndexed());}
 return mergeBuffers(parts);
}
function mergeBuffers(list){
 let n=0;for(const g of list)n+=g.attributes.position.count;
 const pos=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;
 for(const g of list){pos.set(g.attributes.position.array,o*3);col.set(g.attributes.color.array,o*3);o+=g.attributes.position.count;}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('color',new THREE.BufferAttribute(col,3));out.computeVertexNormals();return out;
}
function buildCow(mat,i){
 const g=new THREE.Group();g.name='Cow';
 const white=mat(0xf2efe6),black=mat(0x2b2b2b),pink=mat(0xe8a8a0);
 const body=new THREE.Mesh(new THREE.BoxGeometry(.7,.7,1.4),white);body.position.y=1.0;g.add(body);
 for(const [x,z,s] of [[.2,.2,.35],[-.2,-.35,.3],[.15,-.1,.25]]){const spot=new THREE.Mesh(new THREE.BoxGeometry(.04,s,s*1.2),black);spot.position.set(x>0?.36:-.36,1.05+(i%2)*.05,z);g.add(spot);}
 const head=new THREE.Group();head.position.set(0,1.15,.75);g.add(head);g.userData.head=head;
 const skull=new THREE.Mesh(new THREE.BoxGeometry(.4,.4,.5),white);skull.position.set(0,0,.2);head.add(skull);
 const nose=new THREE.Mesh(new THREE.BoxGeometry(.32,.2,.12),pink);nose.position.set(0,-.08,.48);head.add(nose);
 for(const s of [-1,1]){const horn=new THREE.Mesh(new THREE.ConeGeometry(.04,.16,6),mat(0xe8dcc0));horn.position.set(s*.16,.24,.12);head.add(horn);}
 for(const [x,z] of [[-.22,-.5],[.22,-.5],[-.22,.5],[.22,.5]]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.14,.7,.14),white);leg.position.set(x,.35,z);g.add(leg);}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 return g;
}
const rot=(x,z,yaw)=>[x*Math.cos(yaw)+z*Math.sin(yaw),-x*Math.sin(yaw)+z*Math.cos(yaw)];
const hash=(x,z,s=0)=>{const n=Math.sin(x*12.9898+z*78.233+s*37.719)*43758.5453;return n-Math.floor(n);};
