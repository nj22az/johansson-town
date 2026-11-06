import {japaneseSign,signText} from './okinawa/signs.js';
import {benchSeat} from './seat-slots.js';
import {QUAY_BAYS} from './town-traffic.js';
import {buildDockWorkshop} from './dock-workshop.js';
import {buildHarbourOffice} from './harbour-office.js';
import {releaseAfterUpload} from '../render/canvas-release.js';
import {WEST_SHOPS,buildWestShop} from './west-shops.js';
import {buildIslandCoast} from './island-coast.js';
import {buildBoardwalk} from './boardwalk.js?snappy=1';
import {buildGround} from './ground-build.js';
import {GROUND_CLASSES} from './ground-standard.js';
import {mainStreetPlan,streetDrop,MAIN_STREET_GROUND,TACTILE} from './ground-plan.js';
import {harbourPlan,MAIN_QUAY_TOP} from './ground-plan-harbour.js';
import {buildWarehouse} from './warehouse.js';
import {BOARDWALK,BREAKWATER,OUTER_PIER} from './layout.js?snappy=1';
import {MINATO_BERTH,QUAY_FISHING_BOAT} from './minato-berth.js';
import {MAIN_ROAD,MAIN_SERVICE_COURT,MAIN_LOADING_APRON,MAIN_PARKING_LAYBY,SHOP_CROSSING_Z} from './main-road.js';
import {edgeLines,zebraCrossing,tactileStrip,roadSign,roadEndPosts,roadPaintMaterial} from './road-standards.js';
import {createLampGlow} from './light-pools.js';
import {buildStreetLamps,STREET_LAMP_PLACEMENTS} from './street-lamps.js';
import {createHarbourInstances} from '../render/harbour-instances.js';
import {addHorizon} from './horizon.js';
import {createHarbourBasin,tickOcean,setOceanWeather,SEA_LEVEL} from './ocean.js';
import {buildFishingBoat,createMooringLines} from './harbour-boats.js';
import {buildQuayDressing} from './quay-dressing.js';
import {buildStorefront} from './storefront.js?snappy=1';
import {buildThuanFlat} from './thuan-flat.js';
import {SAKURA_FRONT} from './interiors/sakura-layout.js';

import {buildFerryTerminal} from './ferry.js';
import {createMaterials} from '../render/materials.js?snappy=1';
import {lanternGlow, windowGlow, poolGlow} from '../render/dusk.js';
import * as THREE from '../../vendor/three.module.js';

// Johansson Town original harbour geometry, using the shared PBR surface maps.
// Static geometry is instanced by geometry/material; interaction anchors stay independent.
export function createTown({scene,sites,mobile,shadows=!mobile,maxAnisotropy=4,register,enter,onAction,getPlayerPosition,harbourCellSize=48,harbourBatching=true}) {
  const group=new THREE.Group();scene.add(group);
  const harbourShops=[],plantSites=[],details=[],shopDoors=[];
  const materials=new Map(),geometries=new Map(),batches=new Map(),colliders=[],lamps=[],lampLights=[],lampSpots=[],people=[],water=[],wetMeshes=[];

  const bands=new Uint8Array([
    38,38,38,255,
    92,92,92,255,
    154,154,154,255,
    214,214,214,255,
    255,255,255,255
  ]);
  const toonGradient=new THREE.DataTexture(bands,5,1,THREE.RGBAFormat);
  toonGradient.needsUpdate=true;toonGradient.magFilter=THREE.NearestFilter;toonGradient.minFilter=THREE.NearestFilter;toonGradient.generateMipmaps=false;
  const outlineMaterial=new THREE.MeshBasicMaterial({color:0x1c2729,side:THREE.BackSide});

  const pbr=createMaterials({mobile,anisotropy:maxAnisotropy});
  function material(color,map,glow=0){
    const key=`${color}/${map||''}/${glow}`;
    if(!materials.has(key)){
      let m;
      m=new THREE.MeshStandardMaterial({color,roughness:.87,emissive:glow?color:0,emissiveIntensity:glow,dithering:true});
      if(map){
        const kind=({road:'asphalt',wall:'concrete',wood:'timber',roof:'roof',paving:'paving'})[map];
        m=pbr.worldMaterial(kind,color,map==='wood'?2.4:map==='paving'?3:2);
        if(map==='road'){m.name='town-asphalt';m.roughness=.84;}
        m.emissive.set(glow?color:0);m.emissiveIntensity=glow;
      }
      materials.set(key,m);
    }
    return materials.get(key);
  }
  function shape(type,args,p,c,rotation=[0,0,0],map=null){
    const scalable=type==='box'||type==='cylinder'&&args[0]===args[1];
    const key=scalable?(type==='box'?'box:unit':'cylinder:unit/'+args[3]):type+args.join(',');
    if(!geometries.has(key))geometries.set(key,type==='box'?new THREE.BoxGeometry(1,1,1):type==='cylinder'?new THREE.CylinderGeometry(...(scalable?[1,1,1,args[3]]:args)):new THREE.SphereGeometry(...args));
    const mat=material(c,map),bk=key+mat.uuid;
    if(!batches.has(bk))batches.set(bk,{geo:geometries.get(key),mat,mutable:map==='road',matrices:[]});
    const obj=new THREE.Object3D();obj.position.set(...p);obj.rotation.set(...rotation);if(scalable)obj.scale.set(...(type==='box'?args:[args[0],args[2],args[0]]));obj.updateMatrix();batches.get(bk).matrices.push(obj.matrix.clone());
  }
  const box=(s,p,c=0xffffff,r=[0,0,0],map=null)=>shape('box',s,p,c,r,map);
  const cyl=(r,h,p,c=0x444b4b)=>shape('cylinder',[r,r,h,10],p,c);
  function beam(a,b,r=.025,c=0x303334){
    const d=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a));
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());
    const e=new THREE.Euler().setFromQuaternion(q);shape('cylinder',[r,r,d.length(),8],a.map((v,i)=>(v+b[i])/2),c,[e.x,e.y,e.z]);
  }
  function directMesh(geo,mat,parent=group,p=[0,0,0],r=[0,0,0],scale=[1,1,1],outline=false){
    const m=new THREE.Mesh(geo,mat);m.position.set(...p);m.rotation.set(...r);m.scale.set(...scale);m.castShadow=shadows;m.receiveShadow=shadows;parent.add(m);
    if(outline){const o=new THREE.Mesh(geo,outlineMaterial);o.position.copy(m.position);o.rotation.copy(m.rotation);o.scale.copy(m.scale).multiplyScalar(1.025);o.castShadow=false;o.receiveShadow=false;parent.add(o);}
    return m;
  }
  function directBox(size,p,c,parent=group,r=[0,0,0],outline=false,map=null){return directMesh(new THREE.BoxGeometry(...size),material(c,map),parent,p,r,[1,1,1],outline);}
  function directCyl(radius,height,p,c,parent=group,r=[0,0,0],outline=false,segments=12){return directMesh(new THREE.CylinderGeometry(radius,radius,height,segments),material(c),parent,p,r,[1,1,1],outline);}
  function directBeam(parent,a,b,r=.025,c=0x303334){
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=new THREE.Vector3().subVectors(bv,av);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()),e=new THREE.Euler().setFromQuaternion(q);
    return directMesh(new THREE.CylinderGeometry(r,r,d.length(),8),material(c),parent,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],[e.x,e.y,e.z]);
  }
  function label(text,sub,p,width,height,angle=0,bg='#e9dcc1',fg='#283d3e',glow=false,twoFaced=false){
    // The canvas takes the board's own proportions, so lettering is never stretched.
    const W=Math.max(256,Math.min(2048,Math.round(256*width/height)));
    const draw=ctx=>{ctx.fillStyle=bg;ctx.fillRect(0,0,W,256);ctx.strokeStyle=fg;ctx.lineWidth=8;ctx.strokeRect(12,12,W-24,232);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;ctx.font='800 136px "Yu Gothic",system-ui';signText(ctx,japaneseSign(text),W/2,104,W-68,136);ctx.font='700 32px system-ui';signText(ctx,sub,W/2,206,W-68,32);};
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=256;draw(canvas.getContext('2d'));
    const tex=releaseAfterUpload(new THREE.CanvasTexture(canvas),draw);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(maxAnisotropy,8);
    const mat=new THREE.MeshStandardMaterial({map:tex,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:glow?.55:.05});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);mesh.position.set(...p);mesh.rotation.y=angle;mesh.castShadow=false;mesh.receiveShadow=false;group.add(mesh);
    // A plain panel behind it. These used to be double-sided, so walking round one —
    // the bus-station board stands square across the tunnel road — showed the lettering
    // through the back of the sign, reversed.
    const back=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({color:new THREE.Color(bg).multiplyScalar(.78),roughness:.9}));
    back.position.set(p[0]-Math.sin(angle)*.012,p[1],p[2]-Math.cos(angle)*.012);
    back.rotation.y=angle+Math.PI;back.castShadow=false;back.receiveShadow=false;group.add(back);
    // A gate sign carries its name on both faces, each the right way round.
    if(twoFaced){back.material=mat;back.position.set(p[0]-Math.sin(angle)*.03,p[1],p[2]-Math.cos(angle)*.03);}
    return mesh;
  }
  function anchor(p,label,action){const a=new THREE.Object3D();a.position.set(...p);group.add(a);register(a,label,action);return a;}
  function obstacle(x,z,w,d){colliders.push({x,z,w,d});}
  function lantern(x,z){
    const lm=material(0xf0a65c,null,.12),m=new THREE.Mesh(new THREE.SphereGeometry(.25,12,10),lm);m.scale.set(.8,1.4,.8);m.position.set(x,2.55,z);m.castShadow=false;group.add(m);lamps.push(m);box([.26,.05,.26],[x,2.91,z],0x3c3430);
    if(shadows){const light=new THREE.PointLight(0xffb96e,0,8,2);light.position.set(x,2.55,z);group.add(light);lampLights.push(light);}
    // The pool on the quay under it and the halo round it (light-pools.js): what says "lit" from along the quay.
    lampSpots.push({head:{x,y:2.55,z},ground:{x,y:0,z},radius:3,size:1.6});
  }
  function glassPanel(x,y,z,w,h,angle){
    const mat=new THREE.MeshPhysicalMaterial({color:0x355662,roughness:.40,metalness:.02,clearcoat:.12,clearcoatRoughness:.18,emissive:0xdba978,emissiveIntensity:.16});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.y=angle;m.receiveShadow=false;m.castShadow=false;group.add(m);return m;
  }
  const shopGlass=[];
  function puddle(x,z,sx,sz,rot=0,y=-.031){
    const mat=new THREE.MeshPhysicalMaterial({color:0x263c43,roughness:.14,metalness:.08,transparent:true,opacity:.34,depthWrite:false});
    const m=new THREE.Mesh(new THREE.CircleGeometry(1,28),mat);m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.position.set(x,y,z);m.scale.set(sx,sz,1);m.visible=false;m.renderOrder=2;group.add(m);wetMeshes.push(m);
  }
  // Unlit paint, shared with every street and dimmed with the night (road-standards.js roadPaintMaterial).
  function roadMark(w,d,x,z,c=0xb7aa80){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),roadPaintMaterial(c));m.rotation.x=-Math.PI/2;m.position.set(x,.004,z);m.renderOrder=1;group.add(m);return m;
  }

  addHorizon(group);
  // The ground of Main Street and the harbour, laid from the rulebook (ground-standard.js) by one generator
  // (ground-build.js) from their plans (ground-plan.js, ground-plan-harbour.js): the carriageway a kerb under the
  // footways, kerbs dropped at the zebras, the bus stop and the lay-by's way out, the quays at their own level with their
  // copings. It replaced a slab, a kerb and a colour of their own in each of six modules (the owner, 21 October 2026).
  buildIslandCoast(group);
  const ground=buildGround(group,[mainStreetPlan(),harbourPlan({pier:OUTER_PIER,landing:MINATO_BERTH.landing})],{shadows});
  const roadTop=(x,z)=>GROUND_CLASSES.road.top+streetDrop(x,z);
  const boardwalk=buildBoardwalk(group,{heightAt:roadTop});
  const court=MAIN_SERVICE_COURT,loading=MAIN_LOADING_APRON,layby=MAIN_PARKING_LAYBY;
  for(const z of [layby.minZ+.25,layby.maxZ-.25]){const line=directBox([layby.maxX-layby.minX-.2,.012,.09],[(layby.minX+layby.maxX)/2+.1,roadTop(layby.minX+.5,z)+.006,z],0xd6c8a7,group);line.name='Lay-by bay marking';line.material=line.material.clone();Object.assign(line.material,{depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});line.raycast=()=>{};}

  // The lay-by (QUAY_BAYS[1]) carries its own end marks, drawn with its paving above.
  for(const [x,z] of QUAY_BAYS.slice(0,1))for(const dx of [-1.02,1.02]){const line=directBox([.09,.012,4.5],[x+dx,MAIN_QUAY_TOP+.006,z],0xd6c8a7,group);line.name='Working quay bay marking';line.material=line.material.clone();Object.assign(line.material,{depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});line.raycast=()=>{};}

  // Road paint to the 1997 standard (road-standards.js): solid white edge lines the
  // length of the street (the deck section draws its own to the same spec), and where the
  // road meets the lawn at its north end, 車止め posts rather than a crossing to nowhere.
  edgeLines(group,[[MAIN_ROAD.x,BOARDWALK.maxZ],[MAIN_ROAD.x,MAIN_ROAD.maxZ-.2]],{width:MAIN_ROAD.width,heightAt:(x,z)=>roadTop(x,z)-.03});
  [[-4.1,18.2,1.15,.45,.2],[-1.7,10,.8,.35,-.3]].forEach(v=>puddle(...v,roadTop(v[0],v[1])+.004));

  // Two perpendicular crossings define the short rectangular shopping blocks. Where
  // they fall on the timber boardwalk there is no traffic to stop and nothing to paint:
  // a zebra on deck boards reads as a mistake, so those are left as plain boards.
  // Both crossings: white zebra bars, kerbs dropped (see the kerbstones above), yellow
  // warning blocks at each end, and the blue crossing sign on the footway.
  for(const z of [SHOP_CROSSING_Z,-18]){
    zebraCrossing(group,{x0:MAIN_ROAD.west+.15,x1:MAIN_ROAD.east-.15,z,y:roadTop(MAIN_ROAD.x,z)});
    // The east sign stands on the footway behind the dropped kerb's ramp and its flare; at the shop crossing, whose east end lands
    // in Kitano Road's mouth, on the mouth's north corner (it stood in the side road's carriageway).
    const eastZ=z>MAIN_STREET_GROUND.mouth.z0&&z<MAIN_STREET_GROUND.mouth.z1?MAIN_STREET_GROUND.mouth.z1+.6:z-1.75;
    roadSign(group,'crossing',{x:MAIN_ROAD.pavementWest+.2,z:z+1.75,y:MAIN_STREET_GROUND.footway,ry:0,colliders});roadSign(group,'crossing',{x:MAIN_ROAD.east+1.2,z:eastZ,y:MAIN_STREET_GROUND.footway,ry:Math.PI,colliders});
  }
  // The yellow warning blocks at the top of each crossing's ramps, on the footway (ground-plan.js TACTILE).
  // Set into the footway (ground-plan.js leaves their bed open), their studs 6 mm proud of it.
  for(const t of TACTILE)tactileStrip(group,{...t,y:MAIN_STREET_GROUND.footway-.006});

  // Shopfronts — masonry and timber with glass where useful.
  sites.forEach((s,i)=>{
    if(s.industrialWorkshop){harbourShops.push(buildDockWorkshop({parent:group,site:s,register,enter,label,colliders}));return;}
    if(s.id==='office'){const office=buildHarbourOffice({parent:group,site:s,register,enter,label,shadows,onAction});harbourShops.push(office);colliders.push(office.collider,...office.colliders);return;}
    // The alley units are a recessed door in the side of the supplied night-market
    // kit. The island does not build that kit, so on this layout a shop that has a
    // west-pavement plot gets a building of its own instead of a door standing in the
    // open air. See west-shops.js.
    if(WEST_SHOPS[s.id]){
      const shop=buildWestShop({parent:group,site:s,register,enter,label,colliders,shadows});
      if(shop){harbourShops.push(shop);return;}
    }
    if(s.id==='market'){
      const front=-7.45;
      // Big enough for the shop that is actually inside it. The supplied interior is
      // 13.7m by 10.8m and the frontage that stood for it is 10 by 8.2, so the shop
      // seen through its own window had to be shrunk to fit and read as a model of
      // itself. The full-size frontage only fits where the shops either side of it are
      // switched off: on the street proper the izakaya is against its shoulder, which
      // is why this was never simply made bigger. The door moves to the middle with it,
      // where the interior's own door is.
      {
       const centre=s.z+1.2,span={width:SAKURA_FRONT.width,depth:SAKURA_FRONT.depth,doorX:0};
       const storefront=buildStorefront({parent:group,site:s,register,enter,label,span,placement:{x:front,z:centre,yaw:Math.PI/2,scale:1}});
       shopDoors.push(storefront.shopDoor);
       s.x=front;s.door=[front+1.95,0,centre];
       // Upstairs is Sakura's main office (thuan-flat.js), entered through the shop.
       buildThuanFlat(storefront,{sites,shopDoor:s.door});
       // Turned a quarter: the frontage runs along z and the shop runs back along -x.
       obstacle(front-span.depth/2,centre,span.depth,span.width);return;
      }
      shopDoors.push(buildStorefront({parent:group,site:s,register,enter,label,placement:{x:front,z:s.z,yaw:Math.PI/2,scale:1}}).shopDoor);
      s.x=front;s.door=[-5.5,0,s.z+2.5];
      obstacle(-11.65,s.z,8.2,10);return;
    }
    throw Error('No street frontage defined for '+s.id);
  });

  // Low deck lights remain at the southern quay, separate from the overhead grid.
  // The east one stands 1.25 m back from the kerb, on the footway side of the parking
  // lay-by (main-road.js), where the harbour master's car stands by the kerb.
  for(const [px,pz] of [[-7.2,-32],[2.05,-32]]){
   cyl(.10,.85,[px,.425,pz],0x3b4848);box([.22,.10,.22],[px,.9,pz],0xe7c080);obstacle(px,pz,.25,.25);
   // A 0.9 m deck light throws a pool round its foot, not a 14 m wash: at that reach the west one lit the whole of
   // Sakura's shutter beige at night. It is a pool decal, not a point light: the light cut a hard-edged disc at the
   // footway's kerb (the kerb's top face took it, the road beside it did not), and the pool lies over both.
   lampSpots.push({head:{x:px,y:.9,z:pz},ground:{x:px,y:0,z:pz},radius:2.2,size:.9});
  }
  // The shopping street is fed from the Main Street line (okinawa/quarters.js): a second
  // and third row of poles a few metres from it was clutter.
  for(const x of [-7.8,.8])cyl(.17,6.8,[x,3.4,18.7],0x416568);beam([-7.8,6.4,18.7],[.8,6.4,18.7],.11,0x416568);label("Johansson Shopping Street",'JOHANSSON SHOPPING STREET',[MAIN_ROAD.x,6.3,18.7],5.8,.9,0,'#2f5960','#f4ecd2',false,true);

  // Late-Shōwa street lamps: shopping street + quay approach. Emissive heads only
  // (no new PointLights); kept out of static batching so lanternGlow can update.
  // The Front-Row gable pole is measured against the island bookshop. The older
  // layouts put Front-Row's alley door 0.2 m from it, so they go without that pole.
  const streetLamps=buildStreetLamps({parent:group,colliders,shadows,mobile,
   placements:STREET_LAMP_PLACEMENTS});

  // Useful street furniture sits in the block recesses, clear of junctions.
  // The mid-street machine is gone: vending stays at Sakura, the onsen lane and the fish
  // quay, where a drink is a reason to stop (docs/AMPLIFY-AUDIT.md, decluttering).

  // Payphone sits fully on the west footway: narrowing Main Street to six metres
  // left it overhanging the kerb into the carriageway.
  box([1.1,2.5,1],[-7,1.25,27],0x457e73);box([.91,1.6,.91],[-7,1.55,27],0x648c87);box([.35,.65,.28],[-7,1.4,27.53],0x3d9c6c);label("Telephone",'TELEPHONE',[-7,2.4,27.55],1,.28);anchor([-7,1,28],'Use payphone',()=>onAction('phone'));obstacle(-7,27,1.1,1);
  // The island has no road out: its people come and go by the ferry from the outer pier,
  // and the terminal on the quay takes the bus station's part. Elsewhere, the bus.
  const busStation=buildFerryTerminal({parent:group,colliders,register,onAction,enter,label,shadows});

  // ----- Working harbour district -----
  // Quay is deliberately built as one elevated slab with chunky edge geometry; no coplanar white strips.
  // Its top sits just under the street (layout.js groundHeight 0 on the quay), 16 mm below
  // the road slab that crosses it so the two never share a plane. It stood 9.5 cm proud,
  // so everybody on the quay walked ankle-deep in the concrete.
  // The ferry's ramp lands on a steel plate let into it (minato-berth.js): the slab is cast round the
  // plate and recessed under it, so plate and concrete meet edge to edge, never one lying over the other.
  // The ferry's ramp lands on a steel plate let into the main quay (minato-berth.js), its top flush with the concrete
  // (ground-plan-harbour.js MAIN_QUAY_TOP): full width where the leaf touches down, narrower under the flap, and a steel
  // angle armouring the quay's edge in front of it. The quay's paving and its coping are the ground's (above).
  {const L=MINATO_BERTH.landing;
   const plate=(x0,x1,z0,z1,c=0x5e6566)=>{const m=directBox([x1-x0,L.thickness,z1-z0],[(x0+x1)/2,L.top-L.thickness/2,(z0+z1)/2],c,group);m.name='Ferry landing plate';m.castShadow=false;return m;};
   plate(L.minX,L.maxX,L.minZ,L.minZ+L.angle,0x7d8584);plate(L.minX,L.maxX,L.minZ+L.angle,L.flapFromZ);plate(L.flapMinX,L.maxX,L.flapFromZ,L.maxZ);}

  const sea=createHarbourBasin();sea.receiveShadow=false;group.add(sea);water.push(sea);

  const warehouseWorld={group,colliders};
  // The warehouse stands at the quay.
  const harbourWarehouse=buildWarehouse(warehouseWorld,{mobile,shadows,maxAnisotropy,register,onAction,enter,label});
  // The warehouse already has a fascia; a roadside panel hid its entrance from the quay.

  // A cast bollard bolted through a steel base plate on the kerb, the paint worn bright round its neck where the lines run.
  function bollard(x,z){
    directCyl(.22,.48,[x,.35,z],0x2f3c3f,group,[0,0,0],true,12);directCyl(.31,.12,[x,.61,z],0x2f3c3f);obstacle(x,z,.48,.48);
    box([.62,.04,.5],[x,.3,z],0x4c5355);box([.03,.03,.03],[x-.25,.335,z-.19],0x23292b);box([.03,.03,.03],[x+.25,.335,z+.19],0x23292b);
    const worn=directMesh(new THREE.TorusGeometry(.222,.018,6,18),material(0x8b8f8a),group,[x,.5,z],[Math.PI/2,0,0]);worn.castShadow=false;
  }
  // On the coping, as on any quay, not 1.2 m back from it where they closed the lane in front of the sheds.
  // (The one at x -10 moved 2.3 m west in 2026-10: the ferry's ramp landing is there now.)
  // (The one at x -5, beside the ramp's landing, went with the rest of what stood in the ramp's way: the creator, 2026-10-11.)
  [-15,MINATO_BERTH.quayBollard[0],5,10,15].forEach(x=>bollard(x,-49.3));

  function ropeCoil(x,z,scale=1){
    const rm=material(0xa38a62);for(let i=0;i<3;i++){const t=directMesh(new THREE.TorusGeometry(.35*scale+i*.07,.045*scale,6,20),rm,group,[x,.18+i*.035,z],[Math.PI/2,0,(i%2)*.25],[1,1,1],false);t.castShadow=false;}
  }
  // The bow line's coil, by the bollard the Minato Maru's starboard bow line goes to.
  ropeCoil(MINATO_BERTH.quayBollard[0]-.1,-48.55,.9);

  function crateStack(x,z,cols=2,rows=2){
    const colors=[0x4f6f76,0xa9854e,0x6f805e];
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const px=x+(c-(cols-1)/2)*.72,pz=z+(r%2)*.12;box([.62,.45,.72],[px,.32+r*.48,pz],colors[(r+c)%colors.length]);for(const sx of [-.25,.25])box([.04,.28,.76],[px+sx,.34+r*.48,pz],0x263537);}
    obstacle(x,z,cols*.78,.9);
  }
  // On the island the ferry's ticket booth stands where the west stack was.
  // On the island the ferry terminal stands where the second stack was.


  // The nets' drying frame that stood against the warehouse here was removed (the creator, 2026-10-11): it stood in the
  // drive up the ferry's ramp. Whether nets dry on this apron again is open.


  // Harbour office details: ice cabinet, drums, hand trolley and lamps.
  // The ice cabinet stands against the waiting hall's wall, not across the pavement (it left 1 m).
  directBox([1.15,1.55,.85],[8,.88,-39.1],0xd8d8cc,group,[0,0,0],true);label("Ice",'ICE',[8,1.85,-38.65],.78,.5,0,'#dde1d7','#37636a');obstacle(8,-39.1,1.2,.9);

  for(const [x,z] of [[-17.1,-48],[17.6,-47.6]]){cyl(.11,4,[x,2.1,z],0x4b5655);box([1.1,.1,.18],[x,3.8,z],0x4b5655);lantern(x,z);}

  // The quay's working dressing (quay-dressing.js): tyres hung on chains down the face (none at x −7 since 2026-10: the
  // ferry's ramp lands there), the scuppers through the kerb, the cargo staging bay, the fuel point, the fishing boat's
  // crates and net. The tyres used to sit inside the coping, their tops showing above it as black humps.
  const dressing=buildQuayDressing({parent:group,label,shadows});colliders.push(...dressing.colliders);dressing.puddles.forEach(v=>puddle(...v));

  // Rail only on far sides so the fishing position remains open and readable.
  // The west one stops short of the bollard by the ramp's landing.
  for(const [start,step,count] of [[-17,1.8,3],[8,2.25,4]])for(let i=0;i<count;i++){const x=start+i*step;cyl(.06,1,[x,.63,-49.05],0x4b5c60);if(i<count-1||start>0)beam([x,1.02,-49.05],[x+step,1.02,-49.05],.045,0x4b5c60);}
  // The quay's own board is gone too: it stood two and a half metres up on nothing at
  // all, in the middle of the one open view the town has of the water.
  anchor([0,1,-47.1],'Cast a fishing line',()=>onAction('fishing'));

  // The waiting hall supplies the east-side seating; this west bench leaves the roll-on lane clear.
  for(const x of [27]){box([1.8,.14,.6],[x,.62,18],0x8d7652,[0,0,0],'wood');for(const dx of [-.65,.65])box([.12,.6,.4],[x+dx,.31,18],0x465355);obstacle(x,18,1.9,.7);const seat=anchor([x,1,17.1],'Sit on the quay bench',()=>onAction('seat','Quay bench','A place to rest while the boats come and go.'));seat.userData.seat=benchSeat({id:'quay-bench',position:[x,0,18],stand:[x,0,17.1],surfaceY:.69,eyeY:1.39,yaw:0,pitch:0},{length:1.8,front:.3});}


  // The inshore fishing boat alongside the main quay east of the pier (minato-berth.js QUAY_FISHING_BOAT), starboard
  // side to, bow east: harbour-boats.js draws her to the ferry's finish. Her stern line leads aft to the bollard at x 10,
  // her forward spring from the bow aft to the one at x 15; both are re-laid each frame as she rises and rolls.
  const QB=QUAY_FISHING_BOAT,boat=buildFishingBoat({length:QB.length,beam:QB.beam,shadows,name:'Daigo Seiei Maru'});
  boat.position.set(QB.x,SEA_LEVEL,QB.z);boat.rotation.y=QB.yaw;boat.userData.dynamicProp=true;group.add(boat);
  const fishingLines=createMooringLines(group,2,{name:'Fishing boat mooring lines'}),fairleads=boat.userData.fairleads;
  const bollardHeads=QB.bollards.map(([x,z])=>new THREE.Vector3(x,.6,z)),lineFrom=new THREE.Vector3();
  const layFishingLines=()=>{boat.updateMatrixWorld();fairleads.forEach((f,i)=>{lineFrom.set(...f);boat.localToWorld(lineFrom);fishingLines.set(i,lineFrom,bollardHeads[i],.06);});};
  layFishingLines();

  // The breakwater and its beacons, 23 m further out since 2026-10 (it stood at z -83), so the basin
  // inside is 54 m deep: room for the bigger Minato Maru to swing (docs/FERRY-AUDIT.md §6, batch 3).
  box([68,2.1,4],[0,.18,BREAKWATER.z],0x727f7e);for(const x of [-27,27]){cyl(1,7,[x,3.5,BREAKWATER.z],0xc2c1b2);box([2.3,.7,2.3],[x,7,BREAKWATER.z],x<0?0xa0493f:0xd1cdbb);}

  // The harbour used to stand four placeholder residents here. The town replaces its
  // people with the street cast, so they are no longer built at all: removed from the
  // scene they still answered 'Talk to' from where they had stood.
  const cat=new THREE.Group();cat.position.set(-5.6,MAIN_STREET_GROUND.footway,-25);group.add(cat);
  const catLast=cat.position.clone();let catFacing=0,catResting=true;
  // Tama, a ginger shop cat: rounded body, pale chest and muzzle, four legs that walk
  // and a tail held up in a curl. It used to be a box with a ball on the end.
  const catPart=(geo,p,col,scale)=>{const m=new THREE.Mesh(geo,material(col));m.position.set(...p);if(scale)m.scale.set(...scale);m.castShadow=shadows;cat.add(m);return m;};
  const ginger=0xd0a471,cream=0xf0dcc0;
  catPart(new THREE.SphereGeometry(.13,12,8),[0,.21,.02],ginger,[1,.92,2.05]);
  catPart(new THREE.SphereGeometry(.1,10,8),[0,.25,-.18],cream,[1,1.05,1]);
  catPart(new THREE.SphereGeometry(.1,12,10),[0,.35,-.29],ginger,[1.1,.95,1]);
  catPart(new THREE.SphereGeometry(.045,8,6),[0,.325,-.38],cream,[1.2,.8,1]);
  catPart(new THREE.SphereGeometry(.012,6,4),[0,.34,-.425],0x6b4a45);
  for(const x of [-.04,.04])catPart(new THREE.SphereGeometry(.013,6,4),[x,.365,-.378],0x2d3230);
  for(const x of [-.055,.055]){const ear=catPart(new THREE.ConeGeometry(.038,.085,4),[x,.435,-.28],ginger);ear.rotation.z=-Math.sign(x)*.28;}
  const catLegs=[];
  for(const [x,z] of [[-.06,-.14],[.06,-.14],[-.06,.17],[.06,.17]]){
    const hip=new THREE.Group();hip.position.set(x,.18,z);cat.add(hip);
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.026,.022,.18,6),material(z<0?cream:ginger));leg.position.y=-.09;leg.castShadow=shadows;hip.add(leg);catLegs.push(hip);
  }
  const catTail=new THREE.Group();catTail.position.set(0,.25,.27);cat.add(catTail);
  const tailCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(0,.08,.07),new THREE.Vector3(0,.2,.08),new THREE.Vector3(0,.27,.02)]);
  const tail=new THREE.Mesh(new THREE.TubeGeometry(tailCurve,12,.02,6,false),material(ginger));tail.castShadow=shadows;catTail.add(tail);
  // The cat likes the shop doorway. Standing there it should not take the prompt from
  // the door you walked up to use, so it only wins when it is clearly the nearer thing.
  cat.userData.promptPenalty=1;
  register(cat,'Greet the cat',()=>onAction('cat'));

  for(const mesh of createHarbourInstances(batches.values(),{shadows,cellSize:harbourCellSize,consolidate:harbourBatching}))group.add(mesh);

  // Every quay lamp's pool and halo, faded with the heads (lanternGlow).
  const lampGlow=createLampGlow(group,lampSpots,{pool:{strength:.6}});

  let wet=false;const rainCount=mobile?260:600,positions=new Float32Array(rainCount*6);
  for(let i=0;i<rainCount;i++){const x=(Math.random()-.5)*32,y=Math.random()*16,z=(Math.random()-.5)*70;positions.set([x,y,z,x+.025,y+.65,z-.01],i*6);}
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xadc8ca,transparent:true,opacity:.36,depthWrite:false}));rain.visible=false;rain.name='Local rain streaks';rain.userData.dynamicProp=true;group.add(rain);

  return {
    group,colliders,people,cat,details,warehouse:harbourWarehouse,busStation,streetLamps,lampGlow,
    landmarks:[harbourWarehouse?.place,busStation.place].filter(Boolean),
    harbourShops,boardwalk,ground,plantSites,shopDoors:shopDoors.filter(Boolean),
    setRain(value){
      boardwalk.setRain(value);ground.setRain(value);
      wet=value;rain.visible=value;wetMeshes.forEach(m=>m.visible=value);setOceanWeather(value);
    },
    update(dt,time,day,minutes=1002){
      boat.rotation.z=Math.sin(time*.7)*.01;boat.position.y=SEA_LEVEL+Math.sin(time*.9)*.04;layFishingLines();
      tickOcean(time);
      const lantern=lanternGlow(minutes),glass=windowGlow(minutes),pool=poolGlow(minutes);
      for(const m of lamps){m.material.emissive.set(0xf0a65c);m.material.emissiveIntensity=.12+lantern*.82;}
      streetLamps.update(lantern,pool);lampGlow.update(pool);harbourWarehouse?.glow?.update(pool);
      lampLights.forEach((l,i)=>l.intensity=lantern*(l.userData.nightIntensity||6));
      shopGlass.forEach(m=>{m.material.emissiveIntensity=.035+glass*.31;m.material.roughness=wet?.18:.24;});
      wetMeshes.forEach((m,i)=>{if(wet)m.material.opacity=.28+Math.sin(time*.7+i)*.045;});
      const playerPos=getPlayerPosition?.(),now=performance.now();
      people.forEach(p=>{
        if(p.g.userData.scheduled)return;
        let desiredZ=p.z+Math.sin(time*.11+p.index)*2.2;if(playerPos){const dx=p.g.position.x-playerPos.x,dz=desiredZ-playerPos.z;if(dx*dx+dz*dz<.72*.72)desiredZ=p.g.position.z;}
        const beforeZ=p.g.position.z;
        p.g.position.z=THREE.MathUtils.damp(p.g.position.z,desiredZ,7,dt);
        const movedZ=p.g.position.z-beforeZ;
        if(p.g.userData.facePlayerUntil>now&&playerPos){p.g.lookAt(playerPos.x,p.g.position.y,playerPos.z);p.g.rotateY(Math.PI);}
        else if(Math.abs(movedZ)>1e-5){
          // Face the way they are actually going, and ease into it. This used to flip
          // between two fixed angles from the phase of the patrol, but the position is
          // damped and lags that phase, so at each end of the walk they turned round
          // before they stopped and spent a moment travelling backwards.
          const yaw=movedZ>0?Math.PI:0;
          const angle=Math.atan2(Math.sin(yaw-p.g.rotation.y),Math.cos(yaw-p.g.rotation.y));
          p.g.rotation.y+=angle*(1-Math.exp(-dt*6));
        }
        p.legs.forEach((l,i)=>l.rotation.x=Math.sin(time*3+i*Math.PI)*.22);p.arms.forEach((l,i)=>l.rotation.x=-Math.sin(time*3+i*Math.PI)*.16);
      });
      // The cat's heading belongs to whoever is walking it (people/schedules.js turns it
      // toward each place it visits). Overwriting it every frame with an absolute sway
      // meant it spent most of the day travelling sideways or backwards. Sway only when
      // it has actually stopped, and sway around where it is facing.
      const catMoved=Math.hypot(cat.position.x-catLast.x,cat.position.z-catLast.z);
      catLast.copy(cat.position);
      if(catMoved>1e-4){catResting=false;catFacing=cat.rotation.y;}
      else{if(!catResting){catResting=true;catFacing=cat.rotation.y;}cat.rotation.y=catFacing+Math.sin(time*.3)*.2;}
      // Diagonal pairs step together, as a cat's do; standing still they settle.
      catLegs.forEach((hip,i)=>{const swing=catResting?0:Math.sin(time*11+(i===0||i===3?0:Math.PI))*.45;hip.rotation.x=THREE.MathUtils.damp(hip.rotation.x,swing,14,dt);});
      catTail.rotation.z=Math.sin(time*(catResting?.9:2.4))*.22;
      if(wet){if(playerPos)rain.position.copy(playerPos);for(let i=0;i<rainCount;i++){positions[i*6+1]-=dt*12;if(positions[i*6+1]<0)positions[i*6+1]=16;positions[i*6+4]=positions[i*6+1]+.65;}rainGeo.attributes.position.needsUpdate=true;}
    }
  };
}
