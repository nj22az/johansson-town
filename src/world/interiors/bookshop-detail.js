import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';

/**
 * Front-Row Books, lined with books from the floor to the ceiling.
 *
 * Three walls are one run of timber bookcases each, in bays about 0.9 m wide with seven
 * shelves from a plinth to a cornice under the ceiling. Each shelf is packed the way a
 * second-hand shop's is: spines of every height and colour, a few leaning, a few laid
 * flat in a stack, and a cream card on each bay saying what is on it. A library ladder
 * hangs from a brass rail along the east wall for the top shelves.
 *
 * All the books in the room are one mesh, painted with vertex colour, so the walls of
 * spines cost a single draw call.
 */
export const BOOKCASES=Object.freeze({
 height:2.7,depth:.34,bay:.9,shelves:7,plinth:.12,
 // [wall, from, to, labels]: x runs along the back wall, z runs along the side walls.
 runs:[
  {wall:'back',at:-3.5,from:-4.2,to:4.2,labels:['Maps & Charts','Local Authors','Newspapers','Magazines','Ferry Reading','New in Paperback','Second-hand','Bargains · ¥100','Rare & Old']},
  {wall:'east',at:4.2,from:-3.16,to:3.0,labels:['Island History','Sea & Boats','Travel','Nature','Cookery','Children’s','Picture Books']},
  {wall:'west',at:-4.2,from:-3.16,to:1.5,labels:['Fiction','Mystery','Poetry','Classics','Essays']},
 ],
});

const SPINES=[0x72453d,0x3d6670,0xb5a66b,0x5a7148,0xcebb94,0x696085,0x8c2f2a,0x2f4a6b,0xd9c9a2,0x4b3a2c,0x9b6b3a,0x6d8a7a,0xe2d6bd,0x3a3a3a,0xa8452f];

function labelTexture(labels){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas'),w=256,h=48;c.width=w;c.height=h*labels.length;const x=c.getContext('2d');if(!x)return null;
 labels.forEach((t,i)=>{x.fillStyle='#f2e8d0';x.fillRect(0,i*h,w,h);x.strokeStyle='#8a6a44';x.lineWidth=3;x.strokeRect(2,i*h+2,w-4,h-4);x.fillStyle='#3b2f25';x.font='bold 24px Georgia, serif';x.textAlign='center';x.textBaseline='middle';x.fillText(t,w/2,i*h+h/2,w-16);});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export function addBookshopDetail({room,collider,reg,action}){
 const g=new THREE.Group();g.name='Front-Row bookshop: floor-to-ceiling shelves';room.add(g);
 const B=BOOKCASES,books=[],timber=[],dark=[],brass=[];
 let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const colour=new THREE.Color();
 // A box in the room's frame, painted for the books mesh.
 const book=(w,h,d,x,y,z,hex,tilt=0,yaw=0)=>{
  const geo=new THREE.BoxGeometry(w,h,d);if(tilt)geo.rotateZ(tilt);if(yaw)geo.rotateY(yaw);geo.translate(x,y,z);
  colour.set(hex);const n=geo.attributes.position.count,c=new Float32Array(n*3);
  // The page edges (top) a paper colour, the rest the cloth.
  const nrm=geo.attributes.normal;for(let i=0;i<n;i++){const top=nrm.getY(i)>.7;const k=top?new THREE.Color(0xe9dfc6):colour;c[i*3]=k.r;c[i*3+1]=k.g;c[i*3+2]=k.b;}
  geo.setAttribute('color',new THREE.BufferAttribute(c,3));books.push(geo);
 };
 const slab=(list,s,p)=>{const geo=new THREE.BoxGeometry(...s);geo.translate(...p);list.push(geo);};
 const shelfYs=Array.from({length:B.shelves},(_,i)=>B.plinth+i*(B.height-B.plinth-.14)/B.shelves);

 for(const run of B.runs){
  // Local frame: `u` along the wall, `v` out from it. Back wall: u=x, v=+z; east: u=z, v=-x; west: u=z, v=+x.
  const along=run.wall==='back'?'x':'z',out=run.wall==='east'?-1:1;
  const P=(u,v,y)=>along==='x'?[u,y,run.at+v]:[run.at+out*v,y,u];
  const S=(su,sv,sy)=>along==='x'?[su,sy,sv]:[sv,sy,su];
  const cards=[];
  const length=run.to-run.from,bays=Math.max(1,Math.round(length/B.bay)),bw=length/bays,D=B.depth,H=B.height;
  // Carcass: back panel, plinth, cornice, uprights, shelves.
  slab(dark,S(length,.03,H),P((run.from+run.to)/2,.015,H/2));
  slab(timber,S(length,D,B.plinth),P((run.from+run.to)/2,D/2,B.plinth/2));
  slab(timber,S(length+.04,D+.05,.1),P((run.from+run.to)/2,(D+.05)/2,H-.05));
  for(let b=0;b<=bays;b++)slab(timber,S(.035,D,H),P(run.from+b*bw,D/2,H/2));
  for(const y of shelfYs.slice(1))slab(timber,S(length,D-.02,.028),P((run.from+run.to)/2,D/2,y));
  // Books, shelf by shelf, bay by bay.
  for(let b=0;b<bays;b++){
   const u0=run.from+b*bw+.03,u1=run.from+(b+1)*bw-.03;
   for(let s=0;s<shelfYs.length;s++){
    const y0=shelfYs[s]+(s?.014:0),clear=(shelfYs[s+1]??H-.1)-y0-.03;
    let u=u0;
    // Now and then a short stack laid flat, the way spare copies sit on a shelf.
    const stackAt=rnd()<.35?u0+(u1-u0)*(.2+rnd()*.6):null;
    while(u<u1-.02){
     if(stackAt!==null&&Math.abs(u-stackAt)<.02){const sw=.2+rnd()*.06;for(let k=0;k<3+Math.floor(rnd()*3);k++){const t=.03+rnd()*.015;book(...S(sw,D*.7,t),...P(u+sw/2,D*.42,y0+k*.04+t/2),SPINES[Math.floor(rnd()*SPINES.length)]);}u+=sw+.01;continue;}
     const w=.018+rnd()*.035,h=Math.min(clear,clear*(.62+rnd()*.34)),d=D*(.62+rnd()*.25);
     if(u+w>u1)break;
     // The last book on a run sometimes leans on its neighbour.
     const lean=u+w+.06>u1&&rnd()<.5?(along==='x'?-1:1)*out*.22:0;
     book(...S(w,d,h),...P(u+w/2,d/2+.02,y0+h/2),SPINES[Math.floor(rnd()*SPINES.length)],along==='x'?lean:0,0);
     u+=w+.002;
    }
   }
   // The section card on the cornice.
   const label=run.labels[b%run.labels.length];
   cards.push([label,(u0+u1)/2]);
  }
  // Cards: one canvas per run, each card a slice of it.
  const tex=labelTexture(cards.map(([t])=>t));
  cards.forEach(([,u],i)=>{
   const mat=tex?new THREE.MeshStandardMaterial({map:tex,roughness:.9}):new THREE.MeshStandardMaterial({color:0xf2e8d0});
   const geo=new THREE.PlaneGeometry(.5,.09);
   if(tex){const uv=geo.attributes.uv,n=cards.length;for(let k=0;k<uv.count;k++)uv.setY(k,(n-1-i+uv.getY(k))/n);}
   const card=new THREE.Mesh(geo,mat);card.name='Section card: '+cards[i][0];
   card.position.set(...P(u,D+.031,H-.05));card.rotation.y=run.wall==='back'?0:run.wall==='east'?-Math.PI/2:Math.PI/2;g.add(card);
  });
  // The whole run is one solid for walking.
  const [cx,,cz]=P((run.from+run.to)/2,D/2,0),[sx,,sz]=S(length,D,0);collider(cx,cz,sx+.03,sz+.03,H);
 }

 // The library ladder on its brass rail along the east wall.
 const rail=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,6.1,10),new THREE.MeshStandardMaterial({color:0xc9a15a,roughness:.35,metalness:.6}));
 rail.rotation.x=Math.PI/2;rail.position.set(4.2-B.depth-.06,2.42,-.08);g.add(rail);
 for(const z of [-3.0,2.85])slab(brass,[.06,.04,.04],[4.2-B.depth-.03,2.42,z]);
 const ladder=new THREE.Group();ladder.name='Library ladder';ladder.position.set(4.2-B.depth-.06,2.42,.95);g.add(ladder);
 const lean=.26,len=2.5;
 const lad=new THREE.MeshStandardMaterial({color:0x7a5532,roughness:.7});
 for(const dz of [-.21,.21]){const s=new THREE.Mesh(new THREE.BoxGeometry(.045,len,.045),lad);s.position.set(-Math.sin(lean)*len/2,-Math.cos(lean)*len/2,dz);s.rotation.z=lean;ladder.add(s);}
 for(let k=1;k<9;k++){const t=k/9,r=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.42,8),lad);r.rotation.x=Math.PI/2;r.position.set(-Math.sin(lean)*len*t,-Math.cos(lean)*len*t,0);ladder.add(r);}
 const hook=new THREE.Mesh(new THREE.TorusGeometry(.03,.008,6,12,Math.PI),new THREE.MeshStandardMaterial({color:0xc9a15a,metalness:.6,roughness:.35}));hook.position.set(0,.02,0);ladder.add(hook);
 collider(4.2-B.depth-.06-Math.sin(lean)*len/2,.95,Math.sin(lean)*len+.1,.5,2.4);

 // Merge: all books one mesh, the carcass in two timbers.
 const add=(list,material,name)=>{if(!list.length)return;const m=new THREE.Mesh(mergeGeometries(list,false),material);m.name=name;m.receiveShadow=true;g.add(m);list.forEach(o=>o.dispose());};
 add(books,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88}),'Books');
 add(timber,new THREE.MeshStandardMaterial({color:0x8a6a45,roughness:.75}),'Bookcase timber');
 add(dark,new THREE.MeshStandardMaterial({color:0x4b3b2c,roughness:.8}),'Bookcase backs');
 add(brass,new THREE.MeshStandardMaterial({color:0xc9a15a,roughness:.35,metalness:.6}),'Ladder rail brackets');

 // Walls of spines drink the light: three warm pendants down the aisle, each a real lamp.
 const shade=new THREE.MeshStandardMaterial({color:0x2f4a3c,roughness:.6,side:THREE.DoubleSide}),bulb=new THREE.MeshStandardMaterial({color:0xfff1cf,emissive:0xffd68a,emissiveIntensity:1.6});
 for(const [x,z] of [[0,-2],[0,.4],[2.4,-1.4]]){
  const cord=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.45,6),shade);cord.position.set(x,2.52,z);g.add(cord);
  const cone=new THREE.Mesh(new THREE.ConeGeometry(.2,.16,20,1,true),shade);cone.position.set(x,2.24,z);g.add(cone);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.05,12,8),bulb);b.position.set(x,2.18,z);g.add(b);
  const light=new THREE.PointLight(0xffd9a0,1.6,6,2);light.position.set(x,2.1,z);g.add(light);
 }
 const browse=(pos,label,title,text)=>{const a=new THREE.Object3D();a.position.set(...pos);g.add(a);reg(a,label,()=>action('read',title,text),true);};
 browse([3.6,1,-.4],'Browse the collected editions','Front-Row collected editions','Island histories, sea guides, cookery and children’s books from the floor to the ceiling: the reading copies, which stayed when the stock for sale went to Sakura. Nhung’s recommendations are still on paper slips tucked into the spines; the ladder runs along the rail for the top shelves.');
 browse([-3.6,1,-1.2],'Browse fiction and poetry','Fiction, mystery and poetry','Paperbacks two deep, the poetry in thin spines you have to tilt your head to read. A slip in one of them, in Nhung’s hand: "Read the third poem first."');
 browse([.6,1,-2.9],'Look along the back wall','Maps, papers and second-hand','Old sea charts rolled on the top shelf, the island’s papers bound by year, and a bay of second-hand books at ¥100 each.');
 return g;
}
