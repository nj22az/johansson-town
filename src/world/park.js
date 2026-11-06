import * as THREE from '../../vendor/three.module.js';
import {benchSeat} from './seat-slots.js';
import {HARBOUR_BENCH_DIMENSIONS} from './harbour-bench-dimensions.js';
import {PARK,PARK_BENCH,parkBenchGeometry,TURF_TINT} from './park-layout.js';
import {HARBOUR_PARK_MAIN,HARBOUR_PARK_EXTENSION,HARBOUR_PARK_ENTRY,HARBOUR_POND,HARBOUR_CHERRY,HARBOUR_SHRINE,HARBOUR_PARK_SEATS,HARBOUR_PARK_PATHS} from './harbour-park-plan.js';
import {HARBOUR_PARK_BEDS,PARK_PLANTS,HARBOUR_POND_PADS,HARBOUR_SHADE_TREE,PARK_GUIDE_BOARD,plantInFlower,bedNow} from './harbour-park-garden.js';
import {onsenOpen} from './onsen-layout.js';
import {broadleaf} from './okinawa/trees.js';
import {signText} from './okinawa/signs.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {assetURL} from '../assets.js';
import {registerDetail} from './detail-stream.js';
import {createLightPools} from './light-pools.js';
import {lanternGlow} from '../render/dusk.js';
import {paintedTurf} from '../render/toy-surfaces.js';
import {createKit,paint,rng} from './okinawa/kit.js';
import {buildCherryTree,cherrySeason} from './cherry-tree.js';
import {TREE_REBUILD} from './tree-designs.js';
import {identityOf} from '../people/roster.js';
import {GROUND_LAYER} from './ground-layers.js';
export const PARK_TREE=Object.freeze([(HARBOUR_CHERRY[0]-PARK.x)/PARK.scale,(HARBOUR_CHERRY[1]-PARK.z)/PARK.scale]);
// The globe lamps: the gate walk, the quay walk, the shore walk's corner and the gajumaru's bench.
const LAMP_POSITIONS=Object.freeze([[7.8,-26.8],[17.7,-34.9],[29.8,-13.4],HARBOUR_SHADE_TREE.lamp]);
export const PARK_LAMPS=Object.freeze(LAMP_POSITIONS.map(([x,z])=>[(x-PARK.x)/PARK.scale,(z-PARK.z)/PARK.scale]));
let benchSource=null,benchPending=null;
/** Small original Blender prop; the lawn/tree remain the town's procedural geometry. */
export function preloadPark(){
 if(benchSource)return Promise.resolve(true);
 if(benchPending)return benchPending;
 if(typeof document==='undefined')return Promise.resolve(false);
 const controller=new AbortController();let timer;
 benchPending=Promise.race([
  fetch(assetURL('models/park/harbour-bench.glb?harbour-bench-1'),{signal:controller.signal}).then(response=>{
   if(!response.ok)throw Error('Harbour bench HTTP '+response.status);return response.arrayBuffer();
  }).then(data=>new GLTFLoader().parseAsync(data,'')),
  new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Harbour bench asset timeout'));},8000);})
 ]).then(gltf=>{benchSource=gltf.scene;benchSource.updateMatrixWorld(true);return true;})
  .catch(error=>{console.warn('Harbour bench unavailable; using its measured local fallback.',error.message);return false;})
  .finally(()=>{clearTimeout(timer);benchPending=null;});
 return benchPending;
}
function makeParkBench(g,shadows){
 const group=new THREE.Group();group.name='Harbour Park Blender bench';group.position.set(g.x,g.footY,g.z);group.rotation.y=Math.PI/2;group.scale.setScalar(g.scale);
 if(benchSource){const model=benchSource.clone(true);model.traverse(mesh=>{if(mesh.isMesh){mesh.castShadow=shadows;mesh.receiveShadow=true;mesh.userData.staticProp=true;}});group.add(model);return group;}
 const d=g.dimensions,kit=createKit({shadows}),legX=d.length/2-.14;
 for(const x of [-legX,legX]){
  for(const z of [-d.seatDepth/2+.055,d.seatDepth/2-.055])kit.box(.055,d.seatHeight-d.seatThickness,.055,x,(d.seatHeight-d.seatThickness)/2,z,0x303638);
  kit.box(.095,.035,d.footprintDepth,x,.0175,0,0x303638);
  kit.box(.05,d.backHeight+.025,.05,x,d.seatHeight+d.backHeight/2-.0125,d.backZ,0x303638);
 }
 const gap=.008,slat=(d.seatDepth-gap*3)/4;
 for(let i=0;i<4;i++)kit.box(d.length,d.seatThickness,slat,0,d.seatHeight-d.seatThickness/2,-d.seatDepth/2+slat/2+i*(slat+gap),0x9a6a42);
 for(let i=0;i<3;i++)kit.box(d.length,.1,.04,0,d.seatHeight+.2+i*.14,d.backZ,0x9a6a42);
 kit.finish(group,'Harbour Park measured bench fallback');group.traverse(mesh=>{if(mesh.isMesh)mesh.userData.staticProp=false;});return group;
}

export function parkFoliage(){let grass=null;if(typeof document!=='undefined'&&document.createElement){try{grass=paintedTurf();}catch{}}return {grass,bush:null};}

function turfGeometry(bounds,{pond=false}={}){
 const b=bounds,shape=new THREE.Shape();shape.moveTo(b.minX,-b.minZ);shape.lineTo(b.maxX,-b.minZ);shape.lineTo(b.maxX,-b.maxZ);shape.lineTo(b.minX,-b.maxZ);shape.closePath();
 if(pond){const p=HARBOUR_POND,hole=new THREE.Path();hole.absellipse(p.x,-p.z,p.rx,p.rz,0,Math.PI*2,true);shape.holes.push(hole);}
 const g=new THREE.ShapeGeometry(shape,64);g.rotateX(-Math.PI/2);g.translate(0,GROUND_LAYER.grass,0);
 const positions=g.attributes.position,uv=g.attributes.uv;
 for(let i=0;i<positions.count;i++)uv.setXY(i,positions.getX(i)/2.4,positions.getZ(i)/2.4);
 return g;
}

/** One level public park opposite Sakura, with the bathhouse visible across open ground. */
export function buildPark(world,options={}){
 const group=new THREE.Group();group.name='Harbour Park';world.group.add(group);const shadows=!!options.shadows;
 const material=new THREE.MeshStandardMaterial({color:TURF_TINT,map:parkFoliage().grass,roughness:1});
 const ground=new THREE.Mesh(turfGeometry(HARBOUR_PARK_MAIN,{pond:true}),material);ground.name='Harbour Park ground';ground.receiveShadow=true;group.add(ground);
 const extension=new THREE.Mesh(turfGeometry(HARBOUR_PARK_EXTENSION),material);extension.name='Harbour Park beach lawn';extension.receiveShadow=true;group.add(extension);
 // The walks are the town's ground now (ground-plan-coast.js): rolled crushed stone, edged where they meet the turf.
 const kit=createKit({shadows});
 // A prompt's text may be read when it is asked (the season, the hour): a function of the town's minutes.
 const now=()=>world.minutes??0;
 const anchor=(x,z,label,kind,title,text)=>{const a=new THREE.Object3D();a.position.set(x,1,z);group.add(a);options.register?.(a,label,()=>options.onAction?.(kind,title,typeof text==='function'?text(now()):text));return a;};
 const benchGeometry=parkBenchGeometry();let benchObject=makeParkBench(benchGeometry,shadows);group.add(benchObject);
 if(!benchSource)registerDetail(world,{id:'harbour-park-bench',requiredNearby:true,x:benchGeometry.x,z:benchGeometry.z,radius:40,priority:0,load:async()=>{
  if(!await preloadPark())return false;const object=makeParkBench(benchGeometry,shadows);group.add(object);benchObject.removeFromParent();benchObject=object;world.park.benchObject=object;world.park.benchSource='blender';return true;
 }});
 world.colliders.push({id:'harbour-park-bench',x:benchGeometry.x,z:benchGeometry.z,w:benchGeometry.width,d:benchGeometry.length,minY:benchGeometry.footY,height:benchGeometry.seatY+benchGeometry.top-benchGeometry.footY,park:true});
 const bench=anchor(PARK_BENCH.stand[0],PARK_BENCH.stand[2],'Sit under the harbour cherry','seat','Harbour Park bench','A quiet seat under the old cherry, with Sakura across the street and Umi-no-yu through the open park.');bench.userData.seat=benchSeat(PARK_BENCH,{length:HARBOUR_BENCH_DIMENSIONS.length,front:HARBOUR_BENCH_DIMENSIONS.seatDepth/2+HARBOUR_BENCH_DIMENSIONS.sitZ});
 // The second bench faces the pond; its stand is on the wide gravel circuit.
 const second=HARBOUR_PARK_SEATS[1],seatY=.46;
 kit.box(2.08,.08,.46,second.x,seatY-.04,second.z,0x946b43);
 kit.box(2.08,.42,.05,second.x,.78,second.z-.23,0x946b43);
 for(const dx of [-.82,.82])kit.box(.07,.42,.5,second.x+dx,.21,second.z,0x35494a);
 world.colliders.push({id:second.id,x:second.x,z:second.z,w:2.08,d:.52,height:.99,park:true});
 const pondBench=anchor(...second.stand,'Sit beside the garden pond','seat','Garden pond bench','The pond reflects the cherry and the bathhouse roof. The shore walk remains open beside you.');
 pondBench.userData.seat=benchSeat({position:[second.x,0,second.z+.08],stand:[second.stand[0],0,second.stand[1]],surfaceY:seatY,eyeY:1.21,yaw:second.yaw,pitch:0},{length:2.08,front:.15});
 // The harbour cherry is a kanhizakura: green in October, in flower late January to February (cherry-tree.js).
 const [tx,tz]=HARBOUR_CHERRY,cherry=buildCherryTree({scale:6.2,shadows});cherry.group.position.set(tx,0,tz);cherry.group.rotation.y=.6;group.add(cherry.group);
 const trees={blossom:cherry.meshes.blossom,leaf:cherry.meshes.leaf,cherry};
 world.colliders.push({id:'harbour-cherry',x:tx,z:tz,w:TREE_REBUILD?1.12:.48,d:TREE_REBUILD?1.12:.48,height:6.2,park:true});
 const dress=minutes=>cherry.dress(minutes);dress(0);
 for(const [x,z] of LAMP_POSITIONS){kit.cyl(.07,.1,.16,x,.08,z,0x8a8979,{segments:8});kit.cyl(.04,.05,2.55,x,1.4,z,0x35584c,{segments:8});kit.sphere(.16,x,2.77,z,0xfff4dc,{finish:'lamp'});world.colliders.push({id:'park-lamp',x,z,w:.2,d:.2,height:2.93,park:true});}
 const shrine=HARBOUR_SHRINE;kit.box(1.15,.15,.85,shrine.x,.075,shrine.z,0x8a897c);kit.box(.74,1.05,.54,shrine.x,.68,shrine.z,0x94604b);kit.box(1.1,.12,.8,shrine.x,1.3,shrine.z,0x4e665b);kit.box(.35,.55,.025,shrine.x,.65,shrine.z+.285,0x453e31);
 world.colliders.push({id:'garden-shrine',x:shrine.x,z:shrine.z,w:1.15,d:.85,height:1.36,park:true});
 anchor(...shrine.approach,'Visit the garden shrine','shrine','Garden shrine','A small island shrine in Harbour Park, kept beside the cherry and pond.');
 anchor(13.3,-29.8,'Look up into the harbour cherry','inspect','Harbour cherry',cherryText);
 // The guide board at the gate (PARK_GUIDE_BOARD), turned to face whoever comes in off the crossing: the park drawn as a map.
 const B=PARK_GUIDE;for(const side of [-1,1])kit.box(.08,1.9,.08,B.x+Math.cos(B.ry)*side*.5,.95,B.z-Math.sin(B.ry)*side*.5,0x68563e);
 kit.box(1.16,.06,.1,B.x,1.94,B.z,0x4e3d2b,{ry:B.ry});
 kit.sign(guideMap(),1.0,1.2,B.x,1.28,B.z,{ry:B.ry,name:'Harbour Park guide board',edge:0x4e3d2b});
 world.colliders.push({id:'park-guide-board',x:B.x,z:B.z,w:1.1,d:.24,yaw:B.ry,height:2,park:true});
 anchor(...B.read,'Read the park guide','read','Minato Harbour Park guide',guideText);
 // The beds (harbour-park-garden.js): what grows, who keeps it; the earth is laid with the walks (ground-plan-coast.js).
 const flowerKits=new Map();
 for(const bed of HARBOUR_PARK_BEDS){
  // One kit per flowering season (plants that flower in the same months share it): a season out of flower draws nothing.
  for(const [kind,x,z] of bed.plants){const key=PARK_PLANTS[kind].flowers.join(',');let f=flowerKits.get(key);if(!f)flowerKits.set(key,f={kit:createKit({shadows:false}),kinds:new Set()});f.kinds.add(kind);plant(kit,f.kit,kind,x,z);}
  const b=bed.bounds,[ax,az]=BED_LOOK[bed.id];
  anchor(ax,az,'Look at the '+bed.title.toLowerCase(),'inspect',bed.title,m=>bedText(bed,m));
 }
 const flowers=new Map();for(const {kit:f,kinds} of flowerKits.values()){const g=new THREE.Group(),first=[...kinds][0];g.name='Harbour Park flowers: '+[...kinds].map(k=>PARK_PLANTS[k].name).join(', ');group.add(g);f.finish(g,'Harbour Park flowers');flowers.set(first,g);}
 // The gajumaru on the beach lawn, its bench in the shade and a globe lamp beside it.
 const shade=shadeTree(kit,world);
 const third=HARBOUR_PARK_SEATS[2];slattedBench(kit,third);
 world.colliders.push({id:third.id,x:third.x,z:third.z,w:2.08,d:.52,height:.99,park:true});
 const shadeBench=anchor(...third.stand,'Sit under the gajumaru','seat','Gajumaru bench','The bench in the gajumaru’s shade, where the walk comes up off the beach. The bathhouse roof is across the lawn, and the sea wind comes through the hanging roots.');
 shadeBench.userData.seat=benchSeat({position:[third.x,0,third.z-.08],stand:[third.stand[0],0,third.stand[1]],surfaceY:.46,eyeY:1.21,yaw:third.yaw,pitch:0},{length:2.08,front:.15});
 anchor(shade.x,shade.z-2.1,'Look up into the gajumaru','inspect','Gajumaru',HARBOUR_SHADE_TREE.why);
 for(const [x,z] of LAMP_POSITIONS){kit.cyl(.07,.1,.16,x,.08,z,0x8a8979,{segments:8});kit.cyl(.04,.05,2.55,x,1.4,z,0x35584c,{segments:8});kit.sphere(.16,x,2.77,z,0xfff4dc,{finish:'lamp'});world.colliders.push({id:'park-lamp',x,z,w:.2,d:.2,height:2.93,park:true});}
 // The pond's edge is the pond's (its stones, reeds and lily pads, at the water): a kit of its own, never read as ground.
 const pondKit=createKit({shadows});pondEdge(pondKit,HARBOUR_POND);pondKit.finish(group,'Harbour Park pond edge');
 const {materials}=kit.finish(group,'Harbour Park furnishings');
 const p=HARBOUR_POND,water=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshStandardMaterial({color:0x587f76,roughness:.25,transparent:true,opacity:.88,depthWrite:false}));water.rotation.x=-Math.PI/2;water.scale.set(p.rx,p.rz,1);water.position.set(p.x,p.waterY,p.z);water.name='Harbour Park koi pond';group.add(water);
 const basin=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshStandardMaterial({color:0x586455,roughness:1}));basin.rotation.x=-Math.PI/2;basin.scale.set(p.rx,p.rz,1);basin.position.set(p.x,p.bedY+.012,p.z);basin.name='Harbour pond bed';group.add(basin);
 const pondView=anchor(30.3,-31,'Look into the koi pond','inspect','Garden pond','Koi turn under the lily pads: red and white, gold and black, and one old orange one that comes up for anyone. Grandmother Higa keeps them; the bathhouse is across the lawn.');pondView.name='harbour-pond-view';
 const koi=createKoi(group);let feedAsked=false,feedStart=-1e9;
 anchor(...KOI_FEED.stand,'Feed the koi','read','Feeding the koi',m=>{
  if(!onsenOpen(m))return 'The tin of fu is not on its post: Grandmother Higa takes it in when she shuts the bath at ten at night. The koi are down among the stones until morning.';
  feedAsked=true;return 'You take a pinch of fu from Grandmother Higa’s tin on the post and scatter it on the water. The koi come in a crowd, mouths open, the old orange one first. One pinch each, the tin says.';});
 // Kanhizakura petals, in the weeks it flowers only (cherry-tree.js CHERRY_SEASONS): they drift down and settle in the grass.
 const petals=createPetals(group,cherry);
 const pools=createLightPools(world.group,LAMP_POSITIONS.map(([x,z])=>({x,z,y:0,radius:2.5})));
 const season=minutes=>{dress(minutes);petals.mesh.visible=cherry.season==='bloom';for(const [kind,g] of flowers)g.visible=plantInFlower(kind,minutes);};
 (world.hourly||(world.hourly=[])).push(minutes=>{const glow=lanternGlow(minutes);pools.update(glow);if(materials.lamp)materials.lamp.emissiveIntensity=.1+glow*1.6;season(minutes);});
 season(now());
 const fish=koi.fish;
 world.park={group,bench,seat:PARK_BENCH,pondBench,shadeBench,loaded:true,pools,trees,fish,flowers,petals,benchObject,benchSource:benchSource?'blender':'procedural',benchDimensions:benchGeometry.dimensions,
  get feeding(){return feedAsked||feedStart>-1e9;},
  update(time=0){
   if(feedAsked){feedAsked=false;feedStart=time;}
   koi.update(time,feedStart);if(petals.mesh.visible)petals.update(time);
  }};
 world.park.update();return world.park;
}

/** The guide board at the gate: where it stands, which way it faces (towards the crossing), where it is read from. */
export const PARK_GUIDE=Object.freeze({x:6.6,z:-23.1,ry:-.52,read:Object.freeze([6.15,-22.2])});
/** Where each bed is looked at from: the strip of lawn between the bed and the walk. */
const BED_LOOK=Object.freeze({'entrance-bed':[10.2,-20.15],'main-street-border':[7.75,-30],'bath-screen':[25,-26.3]});
/** Where the koi are fed from (the pond circuit's west side) and where they gather, in the shallows clear of the stones. */
export const KOI_FEED=Object.freeze({stand:Object.freeze([21.95,-30.4]),at:Object.freeze([24.1,-30.4]),gather:2.5,stay:18,leave:3});
/** The pond's big stones, where the koi shelter: [x, z, radius]. */
export const POND_STONES=Object.freeze([[23.5,-31.5,.45],[27.8,-29.7,.35],[27.8,-32.5,.28]].map(Object.freeze));
const keeperName=id=>identityOf(id)?.avatar??id;

function cherryText(minutes){
 const lines={
  bloom:'The kanhizakura is in flower: deep pink bells hanging in clusters before the leaves, and petals coming down on the bench and the grass. Okinawa’s cherry flowers in the middle of the island winter, from late January through February.',
  leaf:'The harbour cherry is a kanhizakura, Okinawa’s own cherry. Now it is a green tree over the bench. It flowers in the middle of the island winter, late January into February: deep pink, before its leaves.',
  turning:'The harbour cherry’s leaves are thinning, yellow and red, and coming down. It stands bare into January, then flowers deep pink from late January.',
  bare:'Bare branches, the buds swelling. The kanhizakura flowers from late January, before its leaves come.',
 };
 return lines[cherrySeason(minutes)]||lines.leaf;
}
function guideText(){
 return 'Minato Harbour Park. Straight on from the gate is Umi-no-yu, the sea-water bath (10:00–22:00), with its footbath beside the porch: free for residents in the bath’s hours. '
  +'On the right of the gate, the dessert counter is closed pending a keeper; its bench remains a public seat. '
  +'On the left, the walk under the harbour cherry to the garden shrine, the koi pond and the quay. From the footbath the walk goes on to the beach and the gajumaru’s bench. '
  +'Grandmother Higa keeps the koi and the gettō by the bath, and Thuan the border along Main Street, with plants from Sakura. The entrance bed has no assigned keeper.';
}
function bedText(bed,minutes){
 const {flowering,leaf}=bedNow(bed,minutes),name=k=>PARK_PLANTS[k].name;
 const now=[flowering.length?'In flower: '+flowering.map(name).join(', ')+'.':'',leaf.length?'In leaf: '+leaf.map(name).join(', ')+'.':''].filter(Boolean).join(' ');
 return now+(bed.keeper?' Kept by '+keeperName(bed.keeper)+', at '+bed.tends+'. ':' No keeper is assigned. ')+bed.why;
}

/** The board's face: the park's name over a map of the park drawn from its plan, in Japanese, the map turned to the reader. */
function guideMap(){
 const P=HARBOUR_PARK_MAIN,E=HARBOUR_PARK_EXTENSION;
 return paint(400,480,(ctx,w,h)=>{
  ctx.fillStyle='#eee5cc';ctx.fillRect(0,0,w,h);ctx.fillStyle='#355d46';ctx.fillRect(0,0,w,74);
  ctx.fillStyle='#fff';ctx.font='bold 46px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';signText(ctx,PARK_GUIDE_BOARD.jp,w/2,39,w-30,46);
  // The reader faces into the park (towards the harbour), so the far end is at the top: up the board is −z, right is +x.
  const minX=P.minX,maxX=P.maxX,minZ=P.minZ,maxZ=E.maxZ,top=92,left=22,s=Math.min((w-44)/(maxX-minX),(h-top-54)/(maxZ-minZ));
  const X=x=>left+(x-minX)*s,Y=z=>top+(z-minZ)*s;
  ctx.fillStyle='#8fbf6a';ctx.fillRect(X(P.minX),Y(P.minZ),(P.maxX-P.minX)*s,(P.maxZ-P.minZ)*s);ctx.fillRect(X(E.minX),Y(E.minZ),(E.maxX-E.minX)*s,(E.maxZ-E.minZ)*s);
  ctx.strokeStyle='#d8c59a';ctx.lineCap='round';ctx.lineJoin='round';
  for(const r of HARBOUR_PARK_PATHS){ctx.lineWidth=r.width*s;ctx.beginPath();r.points.forEach(([x,z],i)=>i?ctx.lineTo(X(x),Y(z)):ctx.moveTo(X(x),Y(z)));ctx.stroke();}
  ctx.fillStyle='#5f93a8';ctx.beginPath();ctx.ellipse(X(HARBOUR_POND.x),Y(HARBOUR_POND.z),HARBOUR_POND.rx*s,HARBOUR_POND.rz*s,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#6b6f7a';ctx.fillRect(X(19.8),Y(-24.4),(30.5-19.8)*s,7.6*s);
  ctx.fillStyle='#a3532f';for(const b of HARBOUR_PARK_BEDS){const r=b.bounds;ctx.fillRect(X(r.minX),Y(r.minZ),(r.maxX-r.minX)*s,(r.maxZ-r.minZ)*s);}
  const label=(text,x,z,{colour='#2b2b2b',size=17}={})=>{ctx.font=`bold ${size}px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif`;ctx.lineWidth=4;ctx.strokeStyle='rgba(238,229,204,.9)';ctx.strokeText(text,X(x),Y(z));ctx.fillStyle=colour;ctx.fillText(text,X(x),Y(z));};
  ctx.fillStyle='#2f6f3a';for(const [x,z,r] of [[HARBOUR_CHERRY[0],HARBOUR_CHERRY[1],1.4],[HARBOUR_SHADE_TREE.x,HARBOUR_SHADE_TREE.z,2.2]]){ctx.beginPath();ctx.arc(X(x),Y(z),r*s,0,Math.PI*2);ctx.fill();}
  const G=PARK_GUIDE_BOARD;for(const l of G.labels)label(l.jp,l.at[0],l.at[1],l);
  // You are here.
  ctx.fillStyle='#c8322b';ctx.beginPath();ctx.arc(X(PARK_GUIDE.x),Y(PARK_GUIDE.z),7,0,Math.PI*2);ctx.fill();label(G.here.jp,PARK_GUIDE.x+2.6,PARK_GUIDE.z+1.2,{colour:'#c8322b',size:15});
  ctx.fillStyle='#2b2b2b';ctx.font='15px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
  G.notices.forEach((n,i)=>signText(ctx,n.jp,w/2,h-36+i*22,w-24,15));
 });
}

/** One plant of a bed: its leaves in the park's kit, its flowers in its kind's kit (shown only in its months). */
function plant(kit,flowers,kind,x,z){
 const r=rng(Math.round(x*97+z*31)),c=PARK_PLANTS[kind].colour,around=(n,rad,cy,spread=1.1,size=.07)=>{for(let i=0;i<n;i++){const a=r.next()*Math.PI*2,b=r.next()*spread;flowers.sphere(size,x+Math.cos(a)*Math.cos(b)*rad,cy+Math.sin(b)*rad,z+Math.sin(a)*Math.cos(b)*rad,c,{detail:0});}};
 if(kind==='hibiscus'){const s=.5;kit.sphere(s,x,s*.85,z,0x4b7a3f,{sy:.95});kit.sphere(s*.7,x+s*.4,s*.6,z-s*.2,0x55864a,{sy:.9});around(9,s*1.02,s*.85,1.1,.075);}
 else if(kind==='bougainvillea'){const s=.55;kit.sphere(s,x,s*.9,z,0x3f6f35,{sy:.85});kit.sphere(s*.75,x-s*.35,s*.75,z+s*.3,0x4a7d3c,{sy:.85});around(16,s*1.02,s*.9,1.2,.08);}
 else if(kind==='ixora'){const s=.36;kit.sphere(s,x,s*.8,z,0x3d6b36,{sy:.85});around(11,s*.98,s*.8,1.1,.05);}
 else if(kind==='lily'){
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+r.next()*.3;kit.box(.035,.4,.012,x+Math.cos(a)*.09,.22,z+Math.sin(a)*.09,0x5d8f3f,{ry:-a,rz:Math.cos(a)*.6,rx:Math.sin(a)*.6,finish:'thin'});}
  kit.cyl(.008,.01,.62,x,.33,z,0x5d8f3f,{segments:4});
  for(let i=0;i<3;i++){const a=i/3*Math.PI*2+.4;flowers.cyl(.055,.012,.15,x+Math.cos(a)*.06,.66,z+Math.sin(a)*.06,c,{segments:6,rz:Math.cos(a)*1.1,rx:-Math.sin(a)*1.1});}
 }
 else if(kind==='getto'){
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2+r.next()*.4,h=1.1+r.next()*.5;kit.box(.13,h,.02,x+Math.cos(a)*.16,h/2,z+Math.sin(a)*.16*.6,i%2?0x4f8a3e:0x5b9846,{ry:-a+Math.PI/2,rz:.18*Math.cos(a),rx:-.18*Math.sin(a),finish:'thin'});}
  for(let i=0;i<2;i++){const a=.8+i*2.6;for(let k=0;k<5;k++)flowers.sphere(.045,x+Math.cos(a)*.25,1.15-k*.06,z+Math.sin(a)*.12+k*.012,k%2?0xe6a0a8:c,{detail:0});}
 }
}

/** The gajumaru: a knot of trunks, a broad spreading crown and aerial roots, all within its collider. Returns its centre. */
function shadeTree(kit,world){
 const T=HARBOUR_SHADE_TREE,r=rng(11);
 if(TREE_REBUILD){world.colliders.push(broadleaf(kit,T.x,T.z,{h:T.height,form:'spread',seed:11,name:'gajumaru',rootLimit:.84}));return T;}
 world.colliders.push(broadleaf(kit,T.x,T.z,{h:T.height,form:'spread',seed:11,name:'gajumaru'}));
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2+r.next()*.5,rad=.45+r.next()*.25;kit.rod([T.x+Math.cos(a)*rad,0,T.z+Math.sin(a)*rad],[T.x+Math.cos(a)*.12,2.6,T.z+Math.sin(a)*.12],.12,0x6e5f4c,{segments:6});}
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2+r.next()*.3,rad=.62+r.next()*.22;kit.rod([T.x+Math.cos(a)*rad*.8,3.1,T.z+Math.sin(a)*rad*.8],[T.x+Math.cos(a)*rad,.02,T.z+Math.sin(a)*rad],.022,0x7a6a56,{segments:4});}
 world.colliders.push({id:'gajumaru-roots',x:T.x,z:T.z,w:1.9,d:1.9,height:3.2,park:true});
 return T;
}
/** A slatted park bench facing `seat.yaw` (0 faces −z, π faces +z), its back on the far side. */
function slattedBench(kit,seat){
 const back=seat.yaw===0?1:-1,{x,z}=seat,iron=0x35494a,wood=0x946b43;
 for(let i=0;i<4;i++)kit.box(2.08,.035,.1,x,.445,z+back*(-.18+i*.12),wood);
 for(let i=0;i<3;i++)kit.box(2.08,.08,.03,x,.6+i*.13,z+back*.235,wood);
 for(const dx of [-.82,.82]){kit.box(.06,.43,.5,x+dx,.215,z,iron);kit.box(.05,.45,.05,x+dx,.66,z+back*.275,iron);}
}

/** The koi: two instanced draws (bodies, markings), each fish following its own loop, gathering where they are fed. */
function createKoi(group){
 const p=HARBOUR_POND,F=KOI_FEED,N=6;
 const body=new THREE.SphereGeometry(.1,10,6).scale(.55,.4,2.2);
 const tail=new THREE.ConeGeometry(.075,.16,3).rotateX(-Math.PI/2).scale(.2,1,1).translate(0,0,-.27);
 const bodyGeometry=mergeGeometries([body.toNonIndexed(),tail.toNonIndexed()],false);
 const marks=new THREE.SphereGeometry(.1,8,5).scale(.42,.2,1.1).translate(0,.022,.05);
 const material=new THREE.MeshStandardMaterial({roughness:.45}),bodies=new THREE.InstancedMesh(bodyGeometry,material,N),patches=new THREE.InstancedMesh(marks,material,N);
 bodies.name='Harbour pond koi';patches.name='Harbour pond koi markings';
 // Kōhaku, ōgon, shōwa, yamabuki, chagoi and a second kōhaku: the colours an island pond keeps.
 const COLOURS=[[0xf1ece0,0xd23b25],[0xe9b84a,0xe9b84a],[0x2b2724,0xd84a2a],[0xf0c45a,0xf3d78a],[0x9a7350,0x84603e],[0xf1ece0,0xe0582c]];
 COLOURS.forEach(([b,m],i)=>{bodies.setColorAt(i,new THREE.Color(b));patches.setColorAt(i,new THREE.Color(m));});
 for(const m of [bodies,patches]){m.userData.dynamicProp=true;m.frustumCulled=false;m.castShadow=false;m.receiveShadow=false;group.add(m);}
 const fish=Array.from({length:N},()=>{const o=new THREE.Object3D();o.userData.dynamicProp=true;return o;});
 const loop=(i,t)=>{const a=t*(.08+i*.006)+i*1.05;return [p.x+Math.cos(a)*(1.1+i*.13),p.z+Math.sin(a)*(.6+i*.08)];};
 const gather=i=>{const a=i/N*Math.PI*2;return [F.at[0]+Math.cos(a)*.38,F.at[1]+Math.sin(a)*.3];};
 const smooth=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
 const at=(i,t,fed)=>{
  const s=t-fed,w=s<0?0:s<F.gather?smooth(s/F.gather):s<F.gather+F.stay?1:smooth(1-(s-F.gather-F.stay)/F.leave);
  const [lx,lz]=loop(i,t),[gx,gz]=gather(i),wob=Math.sin(t*1.7+i)*.06*w;
  return [lx+(gx-lx)*w+wob,lz+(gz-lz)*w];
 };
 function update(t,fed){
  for(let i=0;i<N;i++){
   const [x,z]=at(i,t,fed),[nx,nz]=at(i,t+.05,fed),o=fish[i];
   o.position.set(x,p.waterY-.07,z);if(Math.hypot(nx-x,nz-z)>1e-5)o.rotation.y=Math.atan2(nx-x,nz-z);
   o.updateMatrix();bodies.setMatrixAt(i,o.matrix);patches.setMatrixAt(i,o.matrix);
  }
  bodies.instanceMatrix.needsUpdate=patches.instanceMatrix.needsUpdate=true;
 }
 update(0,-1e9);
 return {fish,bodies,patches,update,at};
}

/**
 * The cherry's petals in its flowering weeks: each starts inside a cluster of the crown, drifts down on the sea wind,
 * lies a moment in the grass and shrinks away, so none appears or vanishes in the air. Paths that would cross the bench
 * or the trunk are left out.
 */
function createPetals(group,cherry){
 const N=36,T=11,[tx,tz]=HARBOUR_CHERRY,bench=HARBOUR_PARK_SEATS[0],out=[],r=rng(23);
 const cy=cherry.group.scale.y;
 const clear=(x,z)=>!(Math.abs(x-bench.x)<.45&&Math.abs(z-bench.z)<1.15)&&Math.hypot(x-tx,z-tz)>.45;
 const path=(q,u)=>{const fall=Math.min(1,u/.8);return [q.x+Math.sin(u*5+q.k)*.25+fall*.9,q.y0*(1-fall)+(GROUND_LAYER.grass+.006)*fall,q.z+Math.cos(u*4+q.k)*.2+fall*.5];};
 while(out.length<N){
  const a=r.next()*Math.PI*2,d=.6+r.next()*1.7,q={x:tx+Math.cos(a)*d,z:tz+Math.sin(a)*d,y0:cy*(.62+r.next()*.2),k:r.next()*6,phase:r.next()};
  let ok=true;for(let s=0;s<=20;s++){const [x,,z]=path(q,s/20);if(!clear(x,z)){ok=false;break;}}if(ok)out.push(q);
 }
 const geometry=new THREE.CircleGeometry(.028,5).rotateX(-Math.PI/2),mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color:0xf2a7c3,roughness:.8,side:THREE.DoubleSide}),N);
 mesh.name='Harbour cherry petals';mesh.userData.dynamicProp=true;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=false;group.add(mesh);
 const o=new THREE.Object3D();
 function update(time){
  out.forEach((q,i)=>{const u=(time/T+q.phase)%1,[x,y,z]=path(q,u),settle=u<.9?1:Math.max(0,1-(u-.9)/.1);
   o.position.set(x,y,z);o.rotation.set(u<.8?Math.sin(u*9+q.k)*.9:0,q.k,u<.8?Math.cos(u*7+q.k)*.9:0);o.scale.setScalar(settle);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});
  mesh.instanceMatrix.needsUpdate=true;
 }
 update(0);
 return {mesh,update,path:(i,u)=>path(out[i],u),count:N};
}

/**
 * The pond's edge: a ring of rounded stones half set into the turf, as a garden pond is laid, so the water never meets
 * the grass in a drawn line (they were 60 cm slabs 12 cm thick, which read as cut-out plates from the walk); two clumps of
 * reeds where the water is shallowest, at the ends of the oval; the lily pads (harbour-park-garden.js); and the three
 * big stones in the water where the koi shelter. Laid into one kit, so they share its draws. The ring is low enough to
 * step on; the reeds are walked through (their blades are too steep to stand on, walk-surface.js).
 */
export function pondEdge(kit,p){
 const tints=[0x9a9784,0xa8a491,0x8c8a79,0xb3ad98],count=46,I=new THREE.Matrix4();
 for(let i=0;i<count;i++){
  const a=(i+((i*7)%3)*.18)/count*Math.PI*2,x=p.x+Math.cos(a)*(p.rx+.08),z=p.z+Math.sin(a)*(p.rz+.08),h=.13+((i*3)%4)*.02;
  // Within the turf between the water and the circuit's setts (2.3 m from the pond's long axis), never on the walk.
  const w=Math.min(.2+((i*7)%5)*.035,p.rz+.27-Math.abs(z-p.z));
  const g=new THREE.IcosahedronGeometry(1,1);g.scale(w,h,w*.8);g.rotateY(-a+((i*13)%7)*.2);g.translate(x,GROUND_LAYER.grass-h*.35,z);kit.add(g,I,tints[i%tints.length]);g.dispose();
 }
 const blade=new THREE.ConeGeometry(.025,1,3,1,true).translate(0,.5,0);
 for(const [cx,cz,n] of [[p.x+p.rx-.55,p.z-.35,16],[p.x-p.rx+.6,p.z+.5,12]])for(let k=0;k<n;k++){
  const a=k*2.4,r=.08+(k%4)*.06,h=.55+((k*5)%7)*.07,lean=((k*3)%5-2)*.06;
  const g=blade.clone().scale(1,h,1).rotateZ(lean).rotateX(lean*.6).translate(cx+Math.cos(a)*r,p.waterY,cz+Math.sin(a)*r);kit.add(g,I,k%3?0x6f8f45:0x8a9a52);g.dispose();
  if(k%5===0)kit.cyl(.03,.03,.14,cx+Math.cos(a)*r+lean*h,p.waterY+h*.92,cz+Math.sin(a)*r,0x6a4a2c,{segments:5});
 }
 blade.dispose();
 // The lily pads float 12 mm over the water's surface, each a disc with its notch, turned its own way.
 for(const [x,z,r] of HARBOUR_POND_PADS){const g=new THREE.CircleGeometry(r,14,.3,Math.PI*2-.3).rotateX(-Math.PI/2).rotateY(x*3.1+z*1.7).translate(x,p.waterY+.012,z);kit.add(g,I,(Math.round(x*10)%2)?0x5f8f43:0x6d9c4a);g.dispose();}
 for(const [x,z,r] of POND_STONES){const g=new THREE.DodecahedronGeometry(r,0);g.scale(1.1,.7,.85);g.translate(x,-.04,z);kit.add(g,I,0x8a8b7b);g.dispose();}
}
