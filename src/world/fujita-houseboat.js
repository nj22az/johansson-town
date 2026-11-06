import {SHED_PIER} from './fujita-layout.js';
import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {assetURL} from '../assets.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {createLampGlow} from './light-pools.js';
// West of the working pier: the cargo ship uses the eastern side.
export const HOUSEBOAT=Object.freeze({x:-40.5,z:-56.5,deckY:.06,width:3.1,length:7.4,sternExtension:.6,
 gangway:{minX:-39.45,maxX:-38.25,minZ:-54.65,maxZ:-53.75},
 bedside:[.26,.06,-.55],bed:[-.63,.85,-.65],cover:{position:[-.63,.85,-1.2],width:.85,length:.95}});
// The camera treatment ends at the cabin door; the bow, gangway and pier keep the town camera.
export function houseboatCabinAt(x,z){return Math.abs(x-HOUSEBOAT.x)<1.2&&z>HOUSEBOAT.z-3.14&&z<HOUSEBOAT.z+.68;}
export function houseboatSurface(x,z,r=0){
 const B=HOUSEBOAT,G=B.gangway,inside=(a,b,c,d)=>x>=a+r&&x<=b-r&&z>=c+r&&z<=d-r;
 if(inside(-38.45,-36.25,-53.75,-49.3)||inside(SHED_PIER.minX,SHED_PIER.maxX,SHED_PIER.minZ,SHED_PIER.maxZ))return {id:'fujita-boardwalk',surface:'wood',y:.06};
 if(inside(G.minX,G.maxX,G.minZ,G.maxZ))return {id:'fujita-gangway',surface:'wood',y:B.deckY};
 if(inside(B.x-1.48,B.x+1.48,B.z-3.2-B.sternExtension,B.z+3.2))return {id:'fujita-houseboat',surface:'wood',y:B.deckY};
 return null;
}
export function createHouseboatModel(hull=null,{shadows=false}={}){
 const g=new THREE.Group();g.name='Shiosai — Mr Fujita’s houseboat';const materials=new Map();
 const mat=(color,extra={})=>{const key=JSON.stringify([color,extra]);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.86,...extra}));return materials.get(key);};
 const wood=mat(0x846449),trim=mat(0xeee1bd),blue=mat(0x294f64),metal=mat(0x66726f,{metalness:.25,roughness:.65}),glass=mat(0x8bb6bb,{transparent:true,opacity:.3,roughness:.25});
 const box=(name,size,at,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(...size),m);o.name=name;o.position.set(...at);o.castShadow=shadows;o.receiveShadow=true;g.add(o);return o;};
 if(hull){hull.scale.z*=7.4/6.8;hull.position.z-=.3;g.add(hull);}else box('Temporary hull',[3.05,.6,7.3],[0,-.39,-.3],blue.clone()).userData.temporaryHull=true;
 box('Deck',[3.12,.1,7.4],[0,.01,-.3],wood);
 // The caulked seams lie 3 mm over the deck: pulled forward by a polygon offset too, so they never flicker into it at range.
 for(let x=-1.4;x<1.5;x+=.22)box('Deck caulking',[.013,.005,7.25],[x,.063,-.3],mat(0x433a30,{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
 for(const side of [-1,1]){
  box('Cream rubbing strake',[.08,.12,6.8],[side*1.62,-.19,-.3],trim);
  // Tyres on her outboard (port) side only: to starboard she lies on the pier's fender piles (fujita-layout.js), and
  // tyres there stood inside the piles.
  if(side<0)for(const z of [-2.9,-1.3,.7,2.9]){const f=new THREE.Mesh(new THREE.TorusGeometry(.19,.07,6,12),mat(0x252a2b));f.name='Tyre fender';f.rotation.y=Math.PI/2;f.position.set(side*1.73,-.24,z);g.add(f);}
 }
 // Timber cabin. Windows have clear openings; the sliding door is parked open.
 for(const side of [-1,1]){
  const x=side*1.25;
  box('Cabin sill',[.08,.78,3.9],[x,.45,-1.25],wood);box('Cabin header',[.08,.48,3.9],[x,1.93,-1.25],wood);
  for(const z of [-3.15,-2.55,-1.85,-.45,.65])box('Window post',[.1,1.35,.12],[x,1.2,z],trim);
  for(const z of [-1.15,.1]){box('Cabin window',[.02,.87,z<0?1.25:.85],[x,1.25,z],glass);box('Window sill',[.13,.06,z<0?1.4:1],[x,.8,z],trim);}
 }
 box('Cabin stern wall',[2.55,2.12,.09],[0,1.12,-3.2],wood);box('Cabin front left',[1.3,2.12,.09],[-.61,1.12,.7],wood);
 box('Door lintel',[1.2,.24,.13],[.65,2.06,.7],trim).userData.houseboatRoof=true;box('Door jamb',[.09,1.86,.13],[1.23,1.04,.7],trim);
 // A deck bulb under the lintel, outside the door: the one warm light on the water at the end of the pier after dark
 // (tick's night), with its halo and its pool on the deck boards (light-pools.js).
 const bulb=box('Deck bulb',[.1,.13,.1],[.65,1.88,.86],mat(0xffe0a5,{emissive:0xffc77f,emissiveIntensity:0}));bulb.castShadow=false;bulb.userData.houseboatBulb=true;
 g.userData.deckGlow=createLampGlow(g,[{head:{x:.65,y:1.88,z:.86},ground:{x:.65,y:.06,z:1.35},radius:1.7,size:1}]);
 box('Open sliding door',[.95,1.82,.08],[-.52,1.01,.78],blue);box('Door frosted panel',[.78,.68,.015],[-.52,1.34,.828],glass);
 box('Houseboat cutaway roof',[2.85,.14,4.32],[0,2.24,-1.22],metal).userData.houseboatRoof=true;
 for(let x=-1.3;x<=1.3;x+=.15)box('Roof corrugation',[.025,.025,4.27],[x,2.32,-1.22],metal).userData.houseboatRoof=true;
 // A worn sofa is Fujita's usual sleeping place; the futon stays folded away.
 // Restrained cabin bounce on the furnishings, without another light or framebuffer.
 const olive=mat(0x777b49,{emissive:0x777b49,emissiveIntensity:.055}),fabric=mat(0x657d78,{emissive:0x657d78,emissiveIntensity:.04}),paper=mat(0xd8cfb6,{emissive:0xd8cfb6,emissiveIntensity:.025});
 box('Sofa timber base',[1.03,.27,2.25],[-.67,.27,-1.7],wood);
 box('Sofa back',[.16,.76,2.25],[-1.12,.72,-1.7],olive);
 for(const z of [-2.81,-.59])box('Sofa arm',[1.03,.46,.15],[-.67,.59,z],olive);
 for(const z of [-2.38,-1.7,-1.02])box('Worn sofa cushion',[.85,.18,.65],[-.62,.53,z],olive);
 // The sleeping avatar's head centre is at z=-1.925, with its back at y=.65.
 // The thin pillow settles into the .62 m seat and compresses slightly beneath his head.
 box('Creased sofa pillow',[.65,.08,.48],[-.61,.65,-1.925],paper);
 box('Blanket over sofa arm',[.75,.06,.36],[-.63,.85,-.59],fabric);
 box('Blanket hanging end',[.06,.38,.36],[-.22,.65,-.59],fabric);
 // Open towards the aisle (+X), within the old cupboard's footprint. No opaque front/body.
 box('Futon cupboard back',[.035,.85,.65],[-1.1825,.49,.13],wood);
 for(const z of [-.1775,.4375])box('Futon cupboard side',[.52,.85,.035],[-.94,.49,z],wood);
 box('Futon cupboard lower shelf',[.52,.04,.65],[-.94,.145,.13],wood);
 box('Futon cupboard quilt shelf',[.52,.04,.65],[-.94,.54,.13],wood);
 for(let i=0;i<3;i++)box('Folded futon',[.45,.11,.55],[-.94,.22+i*.12,.13],paper);
 box('Stored futon quilt',[.45,.13,.55],[-.94,.625,.13],fabric);
 box('Cupboard top',[.59,.06,.72],[-.94,.94,.13],wood);
 box('Radio',[.24,.16,.11],[-.94,1.05,.13],mat(0x403c34));
 // Keep the centre aisle and the sliding entrance free of floor clutter.
 box('Low cabin table',[.52,.06,.62],[.9,.46,-.87],wood);
 for(const x of [.71,1.09])for(const z of [-1.09,-.65])box('Table leg',[.05,.36,.05],[x,.25,z],wood);
 const newspaper=box('Newspaper',[.3,.012,.23],[.88,.499,-.95],paper);newspaper.rotation.y=.12;
 for(let i=0;i<3;i++)box('Newspaper columns',[.065,.002,.16],[.78+i*.085,.507,-.95],mat(0x403c34));
 box('Television remote',[.07,.03,.19],[.98,.51,-.68],mat(0x403c34));
 const can=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.15,8),trim);can.name='Evening beer can';can.position.set(.73,.565,-.73);g.add(can);
 for(let i=0;i<3;i++)box('Stacked nautical log',[.34,.055,.24],[.82,.1+i*.055,-1.31],mat([0x435c70,0x99624c,0x707c54][i]));
 // Short drying line above the sofa, away from the door and walking headroom.
 box('Indoor drying line',[.018,.018,1.65],[-.81,1.98,-1.8],wood);
 for(const [z,material] of [[-2.35,mat(0x435c70)],[-1.8,paper],[-1.25,olive]]){
  box('Drying hand towel',[.035,.32,.3],[-.81,1.81,z],material);
  for(const dz of [-.1,.1])box('Wooden clothes peg',[.05,.07,.025],[-.81,1.99,z+dz],wood);
 }
 for(const z of [-2.9,-2.35,-1.8,-1.25,-.7])box('Faded cabin lining',[.008,.54,.48],[-1.204,.47,z],paper);
 box('Galley cabinet',[.5,.75,.94],[.93,.44,-1.98],trim);box('Galley worktop',[.56,.06,1.02],[.93,.85,-1.98],metal);
 box('Sink',[.32,.025,.28],[.93,.888,-2.19],mat(0x39484b,{metalness:.4}));
 const tap=new THREE.Mesh(new THREE.TorusGeometry(.065,.012,6,12,Math.PI),metal);tap.name='Galley tap';tap.position.set(.96,.98,-2.4);g.add(tap);
 const stove=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.035,12),mat(0x242b2d));stove.position.set(.93,.9,-1.7);g.add(stove);
 const kettle=new THREE.Mesh(new THREE.SphereGeometry(.105,12,8),metal);kettle.scale.y=.85;kettle.position.set(.93,1,-1.7);g.add(kettle);
 box('Hanging hand towel',[.025,.33,.22],[.655,.6,-1.95],mat(0xf3e7cc));
 for(let i=0;i<4;i++)box('Paperback',[.08,.22,.14],[.73+i*.09,1.3,-2.48],mat([0x756647,0x435c70,0x99624c,0x707c54][i]));
 box('Bookshelf',[.65,.05,.22],[.91,1.17,-2.47],wood);
 const clock=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.04,20),trim);clock.rotation.x=Math.PI/2;clock.position.set(.28,1.72,-2.53);clock.name='Cabin clock';g.add(clock);
 for(const [w,h,x,y] of [[.015,.12,.28,1.76],[.1,.015,.31,1.72]])box('Clock hand',[w,h,.015],[x,y,-2.501],blue);
 box('Entrance mat',[.82,.025,.55],[.66,.08,1.08],mat(0x506e58));
 // The foredeck rail: stout timber posts, a mid rail and a broad capping rail to hold on to (it was a frame of cream
 // sticks). Round the bow and down the port side; to starboard the gangway comes aboard between the two gate posts.
 const rail=wood;
 for(const [x,z] of [[-1.48,1.2],[-1.48,2.2],[-1.48,3.2],[-.5,3.2],[.5,3.2],[1.48,3.2],[1.48,1.2]])box('Deck rail post',[.08,.7,.08],[x,.41,z],rail);
 box('Bow capping rail',[3.04,.045,.11],[0,.78,3.2],rail);box('Port capping rail',[.11,.045,1.89],[-1.48,.78,2.2],rail);
 box('Bow mid rail',[2.88,.06,.04],[0,.45,3.2],rail);box('Port mid rail',[.04,.06,1.92],[-1.48,.45,2.2],rail);
 for(const x of [-1.05,1.05])box('Mooring cleat',[.3,.07,.08],[x,.12,2.95],metal);
 // Her stern line's cleat, on the stern deck to starboard (port-shed.js leads the line to the pier's kerb cleat).
 box('Stern mooring cleat',[.08,.07,.3],[1.2,.1,-3.55],metal);
 // Her fresh water: a 200-litre poly tank, filled by hose from the quay tap each week, on a timber stand on the foredeck,
 // its hose run along the deck and in under the cabin front to the galley tap.
 {const tank=new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.5,14),blue);tank.name='Freshwater tank';tank.position.set(-.98,.36,2.55);g.add(tank);
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.05,12),mat(0xeee1bd));lid.name='Freshwater tank lid';lid.position.set(-.98,.635,2.55);g.add(lid);}
 box('Tank stand',[.5,.05,.5],[-.98,.085,2.55],wood);box('Tank tap',[.05,.05,.08],[-.98,.2,2.31],metal);
 box('Freshwater hose',[.035,.03,1.5],[-.98,.075,1.53],mat(0x403c34));
 box('Boot tray',[.5,.03,.3],[-.62,.1,1.15],blue);
 for(const x of [-.75,-.51])box('Boat slippers',[.16,.05,.25],[x,.145,1.15],trim);
 Object.assign(box('Cabin lamp',[.14,.08,.14],[.55,2.06,-.3],mat(0xffe0a5,{emissive:0xffc77f,emissiveIntensity:0})).userData,{houseboatLamp:true,houseboatRoof:true});
 box('Shiosai name board',[.025,.25,1.25],[-1.306,1.94,-1.02],blue);
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');
  if(ctx){ctx.fillStyle='#294f64';ctx.fillRect(0,0,512,128);ctx.fillStyle='#eee1bd';ctx.font='bold 58px serif';ctx.textAlign='center';ctx.fillText('SHIOSAI',256,87);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
   const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.18,.23),new THREE.MeshStandardMaterial({map:tex,roughness:.8}));sign.name='Shiosai lettering';sign.rotation.y=-Math.PI/2;sign.position.set(-1.323,1.94,-1.02);g.add(sign);}
 }
 const batches=new Map();
 for(const mesh of [...g.children]){
  if(!mesh.isMesh||mesh.material.transparent||mesh.material.map||mesh.userData.temporaryHull||mesh.userData.houseboatLamp||mesh.userData.houseboatBulb)continue;
  const key=mesh.material.uuid+(mesh.userData.houseboatRoof?'roof':'fixed');let batch=batches.get(key);
  if(!batch)batches.set(key,batch={material:mesh.material,roof:!!mesh.userData.houseboatRoof,parts:[],geometry:[]});
  mesh.updateMatrix();batch.geometry.push(mesh.geometry.clone().applyMatrix4(mesh.matrix));batch.parts.push(mesh.name);mesh.removeFromParent();mesh.geometry.dispose();
 }
 for(const batch of batches.values()){const geometry=mergeGeometries(batch.geometry,false);batch.geometry.forEach(o=>o.dispose());const mesh=new THREE.Mesh(geometry,batch.material);mesh.name=batch.roof?'Houseboat cutaway roof':'Houseboat fittings';mesh.userData.parts=batch.parts;mesh.userData.houseboatRoof=batch.roof;mesh.castShadow=shadows;mesh.receiveShadow=true;g.add(mesh);}
 return g;
}
export function buildFujitaHouseboat({parent,colliders,register,onAction,shadows=false}){
 const B=HOUSEBOAT,group=createHouseboatModel(null,{shadows});group.position.set(B.x,0,B.z);parent.add(group);
 // The boarding plank (ayumi-ita) across the gap from her deck edge (x −38.94) to the pier's (−38.55), flush with both:
 // the old one lay across the whole width of both decks at the same level, and flickered against them.
 const G=B.gangway,gangway=new THREE.Group();gangway.name='Houseboat wooden gangway';
 const material=new THREE.MeshStandardMaterial({color:0x896b4c,roughness:.94}),x0=B.x+1.56,x1=SHED_PIER.minX;
 const count=Math.round((G.maxZ-G.minZ)/.15),pitch=(G.maxZ-G.minZ)/count;
 for(let i=0;i<count;i++){const board=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,.045,pitch-.01),material);board.position.set((x0+x1)/2,B.deckY-.0225,G.minZ+(i+.5)*pitch);board.name='Gangway plank';board.receiveShadow=true;gangway.add(board);}
 for(const z of [G.minZ+.08,G.maxZ-.08]){const bearer=new THREE.Mesh(new THREE.BoxGeometry(x1-x0+.3,.08,.09),material);bearer.position.set((x0+x1)/2,B.deckY-.09,z);bearer.name='Gangway bearer';gangway.add(bearer);}
 gangway.userData.walkLevels=[{...G,y:B.deckY}];parent.add(gangway);
 group.userData.walkLevels=[{minX:B.x-1.48,maxX:B.x+1.48,minZ:B.z-3.2-B.sternExtension,maxZ:B.z+3.2,y:B.deckY}];
 // Her lines are drawn with the pier (port-shed.js), which knows where they are made fast.
 const solid=(x,z,w,d,height)=>colliders.push({x:B.x+x,z:B.z+z,w,d,height,houseboat:true});
 solid(-1.25,-1.25,.12,4,2.2);solid(1.25,-1.25,.12,4,2.2);solid(0,-3.2,2.55,.12,2.2);solid(-.61,.7,1.3,.12,2.2);solid(1.23,.7,.1,.12,2.2);solid(-.67,-1.7,1.03,2.4,.85);solid(-.94,.13,.59,.72,.97);solid(.9,-.87,.52,.62,.49);solid(.93,-1.98,.6,1.02,.95);solid(-1.48,2.2,.12,2.08,.82);solid(0,3.2,3.04,.12,.82);solid(-.98,2.55,.5,.5,.66);
 const at=new THREE.Object3D();at.position.set(.65,1,1.2);group.add(at);register(at,'Mr Fujita’s houseboat',()=>onAction('read','Shiosai — Mr Fujita’s houseboat','Mr Fujita rebuilt this little working boat into a home: a worn sofa, a folded futon, a kettle and a radio. He usually falls asleep on the sofa; the futon is stored beneath the radio. At half past eleven he switches off the shed television and comes aboard. The gangway must stay clear.'));
 let disposed=false,ready=Promise.resolve(false);
 if(typeof window!=='undefined'&&typeof window.fetch==='function')ready=fetch(assetURL('models/harbour/fujita-houseboat-hull.glb')).then(r=>{if(!r.ok)throw Error('Houseboat hull HTTP '+r.status);return r.arrayBuffer();}).then(data=>new GLTFLoader().parseAsync(data,'')).then(({scene})=>{
  if(disposed){scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});return false;}
  const fallback=group.getObjectByName('Temporary hull');fallback?.removeFromParent();fallback?.geometry.dispose();fallback?.material.dispose();scene.traverse(o=>{if(o.isMesh){o.castShadow=shadows;o.receiveShadow=true;}});scene.scale.z*=7.4/6.8;scene.position.z-=.3;group.add(scene);return true;
 }).catch(e=>{console.warn('Houseboat hull unavailable; using local hull.',e.message);return false;});
 const roofs=[],lamps=[],bulbs=[],deckGlow=group.userData.deckGlow;group.traverse(o=>{if(o.userData.houseboatRoof)roofs.push(o);if(o.userData.houseboatLamp)lamps.push(o);if(o.userData.houseboatBulb)bulbs.push(o);});
 /** @param {{sleeping?:boolean,player?:object,night?:number}} state night is 0–1 (dusk.js poolGlow): the deck bulb burns by it */
 return {group,gangway,ready,deckGlow,tick({sleeping=false,player=null,night=0}={}){const inside=player&&Math.abs(player.x-B.x)<1.5&&player.z>B.z-3.6&&player.z<B.z+1.3;for(const o of roofs)o.visible=!(sleeping||inside);for(const o of lamps)o.material.emissiveIntensity=sleeping?0:.7;
  const lit=Math.max(0,Math.min(1,night||0));for(const o of bulbs)o.material.emissiveIntensity=lit*1.4;deckGlow?.update(lit);},dispose(){disposed=true;}};
}
