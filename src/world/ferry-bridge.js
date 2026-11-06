import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {buildBridgeNavigationFeeder} from './ferry-bridge-lantern.js';
import {buildBridgeWipers} from './ferry-bridge-wipers.js';

// Equipment only: the shared interior remains the authority for floors and collisions.
// +z forward, +x port. Instruments face aft towards the operator, never through a solid hood.
export const bridgeHeading=yaw=>((180+yaw*180/Math.PI)%360+360)%360;
export const orderAngle=order=>order==='STOP'?0:(order.includes('ASTERN')?-1:1)*(order.includes('FULL')?.95:order.includes('HALF')?.65:.32);

export function buildFerryBridge(parent,kit,{floor,fore,aft}){
 const group=new THREE.Group();group.name='Minato Maru bridge equipment';group.position.set(0,floor,fore);parent.add(group);
 const navigationFeeder=buildBridgeNavigationFeeder(group);
 const DARK=0x252e30,CREAM=0xd8d2c0,GREEN=0x52796f,BRASS=0xb08a4a,WOOD=0x765032;
 const pos=p=>[p[0],p[1]+floor,p[2]+fore];
 const box=(size,p,hex)=>kit.box('paint',size,pos(p),hex);
 const bar=(a,b,r,hex)=>kit.bar('metal',pos(a),pos(b),r,hex,8);
 const materials=new Map();
 const mesh=(geo,hex,p,name,owner=group)=>{if(!materials.has(hex))materials.set(hex,new THREE.MeshStandardMaterial({color:hex,roughness:.65}));const m=new THREE.Mesh(geo,materials.get(hex));m.position.set(...p);m.name=name;owner.add(m);return m;};
 const screen=(name,w,h,p,rotX=0)=>{
  if(typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.round(512*h/w);const ctx=canvas.getContext('2d');
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}));m.name=name;m.position.set(...p);m.rotation.set(rotX,Math.PI,0);group.add(m);
  return {ctx,canvas,texture,mesh:m};
 };
 // Sea-green fascias, beige CRT housings and tactile knobs on the existing console.
 box([5.42,.06,.52],[0,1.015,-.4],GREEN);
 box([.7,.5,.43],[-.9,1.27,-.39],CREAM);
 const radar=screen('Bridge radar CRT',.46,.38,[-.95,1.28,-.612]);
 // Three separate plates form the hood; its aperture is genuinely open.
 box([.5,.035,.18],[-.95,1.49,-.7],DARK);
 for(const x of [-1.215,-.685])box([.03,.43,.18],[x,1.29,-.7],DARK);
 for(const y of [1.15,1.29,1.41])bar([-.59,y,-.612],[-.59,y,-.64],.025,DARK);
 box([.5,.3,.34],[2.4,1.19,-.43],CREAM);
 const sounder=screen('Bridge echo sounder CRT',.34,.2,[2.36,1.21,-.605]);
 const panel=screen('Bridge engine and heading repeater',.86,.22,[.68,1.17,-.565]);
 box([.91,.27,.12],[.68,1.17,-.5],DARK);
 // Bake parts that always move together into a single vertex-coloured draw call.
 const movingMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65});
 const batch=owner=>{const parts=[];for(const m of [...owner.children]){if(!m.isMesh)continue;m.updateMatrix();const g=m.geometry.toNonIndexed();g.applyMatrix4(m.matrix);const colour=m.material.color,values=[];for(let i=0;i<g.attributes.position.count;i++)values.push(colour.r,colour.g,colour.b);g.setAttribute('color',new THREE.Float32BufferAttribute(values,3));parts.push(g);owner.remove(m);m.geometry.dispose();}
  const m=new THREE.Mesh(mergeGeometries(parts,false),movingMaterial);owner.add(m);for(const g of parts)g.dispose();};
 const levers=[];
 for(const [x,id,label] of [[.2,'mainP','Port'],[.4,'mainS','Starboard']]){
  box([.14,.065,.3],[x,1.055,-.4],DARK);
  const pivot=new THREE.Group();pivot.position.set(x,1.09,-.4);pivot.name=label+' engine order lever';group.add(pivot);
  mesh(new THREE.CylinderGeometry(.012,.012,.23,8),0xb9bcb8,[0,.115,0],label+' lever shaft',pivot);
  const knob=mesh(new THREE.CylinderGeometry(.035,.035,.09,10),id==='mainP'?0xc2412f:0x333b3c,[0,.23,0],label+' lever grip',pivot);knob.rotation.z=Math.PI/2;batch(pivot);levers.push({pivot,id});
 }
 // A modest eight-spoke wheel: each spoke runs from the hub to the rim once.
 const wheel=new THREE.Group();wheel.name='Bridge eight-spoke helm';wheel.position.set(0,1.05,-1.57);group.add(wheel);
 mesh(new THREE.TorusGeometry(.29,.025,8,32),WOOD,[0,0,0],'Helm rim',wheel);
 const hub=mesh(new THREE.CylinderGeometry(.055,.055,.07,12),BRASS,[0,0,0],'Helm hub',wheel);hub.rotation.x=Math.PI/2;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const spoke=mesh(new THREE.CylinderGeometry(.013,.016,.31,8),WOOD,[Math.sin(a)*.185,Math.cos(a)*.185,0],'Helm spoke '+i,wheel);spoke.rotation.z=-a;}
 batch(wheel);
 // Compass periscope's aft-facing card, below the overhead tube already in the interior.
 const compass=screen('Bridge compass card',.14,.08,[0,1.55,-1.405]);
 const wiperRig=buildBridgeWipers(group),wipers=wiperRig.wipers;
 kit.add('metal',new THREE.TorusGeometry(.22,.018,8,32),0x7d8586,pos([2.36,1.47,-.09]));
 kit.cyl('metal',.035,.035,.05,pos([2.36,1.47,-.1]),DARK,[Math.PI/2,0,0],10);
 // Pedestal chair rather than the old solid cuboid; its existing collision envelope is retained.
 kit.cyl('metal',.08,.12,.68,pos([1,.34,-1.5]),DARK);
 box([.5,.1,.48],[1,.73,-1.5],0x4a3f36);box([.48,.42,.08],[1,.98,-1.72],0x4a3f36);
 for(const x of [.75,1.25]){bar([x,.76,-1.65],[x,.93,-1.65],.018,DARK);box([.055,.045,.34],[x,.95,-1.52],WOOD);}
 // The chart-table lamp's shade on its stem, and the paper chart on the chart table at the aft bulkhead (ferry-interior.js),
 // clear of the crew stair's well and of both wing doors (3 November 2026: they stood over the well, at the table's old place).
 kit.cyl('paint',.045,.14,.14,pos([-1.05,1.43,aft-fore+.15]),0x3a6654);
 const chart=screen('Minato to Kitano paper route sketch',.88,.54,[-1.475,.965,aft-fore+.36],Math.PI/2);
 if(chart){const {ctx:x,canvas:c}=chart,W=c.width,H=c.height;x.fillStyle='#e8e2cc';x.fillRect(0,0,W,H);x.strokeStyle='#aaa58e';x.lineWidth=1;
  for(let i=32;i<W;i+=48){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke();}for(let i=24;i<H;i+=48){x.beginPath();x.moveTo(0,i);x.lineTo(W,i);x.stroke();}
  x.fillStyle='#a9af91';for(const [cx,cy,rx,ry] of [[70,240,95,95],[430,65,95,48]]){x.beginPath();x.ellipse(cx,cy,rx,ry,-.3,0,Math.PI*2);x.fill();}
  x.strokeStyle='#9b4538';x.lineWidth=3;x.setLineDash([8,5]);x.beginPath();x.moveTo(120,235);x.lineTo(230,160);x.lineTo(370,110);x.stroke();x.setLineDash([]);
  x.fillStyle='#273537';x.font='bold 19px monospace';x.fillText('MINATO — KITANO-JIMA',24,28);x.font='15px monospace';x.fillText('ROUTE SKETCH · NOT TO SCALE',24,50);x.fillText('MINATO',25,H-12);x.fillText('KITANO',W-100,85);chart.texture.needsUpdate=true;}
 bar([-2.65,.984,aft-fore+.42],[-2.1,.984,aft-fore+.56],.012,BRASS);
 let elapsed=0,acc=1,lastHeading=-1,lastPlant='',readings=null;
 const text=(s,lines)=>{if(!s)return;const {ctx:x,canvas:c}=s;x.fillStyle='#062018';x.fillRect(0,0,c.width,c.height);x.fillStyle='#84d6a3';lines.forEach((l,i)=>{const size=Math.floor(c.height/(lines.length+1));x.font=`bold ${size}px monospace`;const width=x.measureText(l).width;if(width>c.width-20)x.font=`bold ${Math.floor(size*(c.width-20)/width)}px monospace`;x.fillText(l,10,(i+1)*c.height/(lines.length+.2));});s.texture.needsUpdate=true;};
 const readPlant=r=>{readings=r;for(const l of levers)l.pivot.rotation.x=orderAngle(r.telegraph[l.id]);};
 const update=(dt,{yaw=0,rain=false,powered=true}={})=>{
  elapsed+=Math.max(0,Math.min(dt, .1));acc+=dt;
  wiperRig.update(dt,{rain,powered});
  // CRT redraws are capped at 8 Hz; no new canvases, textures, or timers per frame.
  if(acc<.125)return;acc=0;
  const heading=bridgeHeading(yaw),h=String(Math.round(heading)%360).padStart(3,'0'),r=readings;
  const plantKey=JSON.stringify([powered,r?.telegraph,r?.engines,h]);
  if(plantKey!==lastPlant){lastPlant=plantKey;text(panel,powered?[`HDG ${h}°  PORT / STBD`,`${Math.round((r?.engines.mainP.rpm||0)*1000)} / ${Math.round((r?.engines.mainS.rpm||0)*1000)} RPM`,`${r?.telegraph.mainP||'STOP'} / ${r?.telegraph.mainS||'STOP'}`]:['POWER OFF']);}
  if(lastHeading!==h){lastHeading=h;text(compass,[h+'°']);}
  if(radar){const {ctx:x,canvas:c}=radar,W=c.width,H=c.height,cx=W/2,cy=H/2,R=Math.min(W,H)*.4;x.fillStyle='#061b12';x.fillRect(0,0,W,H);
   if(powered){x.strokeStyle='#28663e';x.lineWidth=2;for(const f of [.33,.66,1]){x.beginPath();x.arc(cx,cy,R*f,0,Math.PI*2);x.stroke();}x.beginPath();x.moveTo(cx,cy-R);x.lineTo(cx,cy+R);x.moveTo(cx-R,cy);x.lineTo(cx+R,cy);x.stroke();
    const a=elapsed*2.6-Math.PI/2;x.strokeStyle='#89e8a7';x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);x.stroke();x.fillStyle='#89e8a7';x.font='18px monospace';x.fillText('RADAR · DEMO',12,24);x.fillText('6 NM   HDG '+h,12,H-12);
   }radar.texture.needsUpdate=true;}
  // No invented depth or seabed: unavailable until bathymetry is connected.
  text(sounder,powered?['ECHO SOUNDER','DEPTH —.— m','NO DEPTH DATA']:['POWER OFF']);
 };
 update(0);return {group,readPlant,update,levers,wheel,wipers,wiperRig,radar,sounder,chart,navigationFeeder};
}
