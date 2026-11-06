import {KITAHAMA,KITAHAMA_LANES} from './kitahama-layout.js';

import {HARBOUR_PARK_MAIN,HARBOUR_PARK_EXTENSION,HARBOUR_POND,HARBOUR_PARK_ALIASES} from './harbour-park-plan.js';
import {townMapBounds} from './map-viewport.js';
import {airportWorld} from './airport-ground.js';
import {AIRPORT_OUTLINE_WORLD} from './airport-island.js';
import {TROPIC_PLACES} from './tropical-island.js';
import {COASTLINE} from './island-coast.js';
import {activeRoutes,MAP_BOUNDS,BOARDWALK} from './layout.js?snappy=1';
import {FOREST_EDGE} from './forest-edge.js';
import {MAIN_ROAD} from './main-road.js';
import {TUNNEL,HEADLAND,headlandHeight,CAVE_ACTIVE} from './coyote-tunnel.js';
import {BEACH,BEACH_EDGES,BEACH_DRY_EDGE_X} from './beach-layout.js';
// Small cached patches show the walkable headland beyond the original coastal slab.
const headlandPatches=[];
for(let z=HEADLAND.minZ;z<HEADLAND.maxZ;z+=4)for(let x=HEADLAND.minX;x<HEADLAND.maxX;x+=4)
 if((headlandHeight(x+2,z+2)??-2)>BEACH.waterY+.025)headlandPatches.push([x,z]);
import {mapPlan} from './okinawa/layout.js';

export function drawTownMap(ctx,w,h,{sites=[],landmarks=[],homes=[],people=[],player={x:0,z:0},yaw=0,visited=[],target=null,route=[],mode='local',showHomes=true}={}) {
 const b=townMapBounds({mode,player,target,route},MAP_BOUNDS),pad=24;
 const scale=Math.min((w-pad*2)/(b.maxX-b.minX),(h-pad*2)/(b.maxZ-b.minZ));
 const ox=(w-(b.maxX-b.minX)*scale)/2,oz=(h-(b.maxZ-b.minZ)*scale)/2;
 const px=x=>ox+(x-b.minX)*scale,pz=z=>h-oz-(z-b.minZ)*scale;
 const inView=(x,z)=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ;
 const rect=({minX,maxX,minZ,maxZ})=>ctx.fillRect(px(minX),pz(maxZ),(maxX-minX)*scale,(maxZ-minZ)*scale);
 const polygon=points=>{ctx.beginPath();points.forEach(([x,z],i)=>i?ctx.lineTo(px(x),pz(z)):ctx.moveTo(px(x),pz(z)));ctx.closePath();ctx.fill();};
 ctx.fillStyle='#a9cbd1';ctx.fillRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.rect(pad/2,pad/2,w-pad,h-pad);ctx.clip();
 ctx.fillStyle='#e6e5ca';polygon(COASTLINE);polygon(AIRPORT_OUTLINE_WORLD);
 ctx.fillStyle='#b5caa0';for(const [x,z]of headlandPatches)ctx.fillRect(px(x),pz(z+4),4*scale,4*scale);

 const [hx,hz]=airportWorld(...TROPIC_PLACES.lookout);ctx.beginPath();ctx.ellipse(px(hx),pz(hz),20*scale,20*scale,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#eddfb8';rect({minX:BEACH.profile[0][0],maxX:BEACH_DRY_EDGE_X,minZ:BEACH.open.minZ,maxZ:BEACH.open.maxZ});rect({minX:BEACH_EDGES.quayEdge,maxX:BEACH_DRY_EDGE_X,minZ:BEACH_EDGES.jettyNorth,maxZ:BEACH.open.minZ});
 ctx.fillStyle='#b1c997';rect(HARBOUR_PARK_MAIN);rect(HARBOUR_PARK_EXTENSION);
 const pond=HARBOUR_POND;ctx.fillStyle='#74aeb7';ctx.beginPath();ctx.ellipse(px(pond.x),pz(pond.z),pond.rx*scale,pond.rz*scale,0,0,Math.PI*2);ctx.fill();
 ctx.lineJoin='round';ctx.lineCap='round';
 const stroke=(points,width,colour)=>{ctx.strokeStyle=colour;ctx.lineWidth=Math.max(1.5,width*scale);ctx.beginPath();points.forEach(([x,z],i)=>i?ctx.lineTo(px(x),pz(z)):ctx.moveTo(px(x),pz(z)));ctx.stroke();};
 for(const r of activeRoutes()){
  const colour=r.surface==='asphalt'?'#999c96':r.surface==='wood'?'#bba17c':r.park?'#f4ebd6':'#c5baa0';
  if(r.segmentWidths){for(let i=1;i<r.points.length;i++)stroke([r.points[i-1],r.points[i]],r.segmentWidths[i-1]??r.width,colour);}
  else stroke(r.points,r.width,colour);
 }
 stroke([[BOARDWALK.x,BOARDWALK.minZ],[BOARDWALK.x,BOARDWALK.maxZ]],BOARDWALK.width,'#bba17c');
 stroke([[TUNNEL.x,MAIN_ROAD.maxZ],[TUNNEL.x,FOREST_EDGE.roadEndZ]],BOARDWALK.width,'#999c96');
 for(const access of BEACH.accesses)stroke([[access.fromX,access.z],[access.toX,access.z]],1,'#cab786');
 const plan=mapPlan(),r=([minX,maxX,minZ,maxZ])=>rect({minX,maxX,minZ,maxZ});
 ctx.fillStyle='#d7d9b9';plan.yards.forEach(r);ctx.fillStyle='#d4cbb5';plan.walks.forEach(r);ctx.fillStyle='#d4cbb5';KITAHAMA_LANES.forEach(rect);ctx.fillStyle='#b8b1a4';plan.buildings.forEach(r);[...KITAHAMA.plots,KITAHAMA.apartment].forEach(rect);
 ctx.fillStyle='#787f78';rect({minX:TUNNEL.x-TUNNEL.width/2,maxX:TUNNEL.x+TUNNEL.width/2,minZ:TUNNEL.z,maxZ:TUNNEL.z+TUNNEL.depth});
 // Draw the tested walking path over the actual lanes; never connect an unplanned
 // destination to the player with a line through buildings or across the water.
 if(route.length>1){stroke(route.map(p=>[p.x,p.z]),1.25,'#fffef8');stroke(route.map(p=>[p.x,p.z]),.65,'#166a72');}
 const labels=[];
 function label(text,x,z,{priority=false,colour='#274b49',size=13}={}){
  if(!inView(x,z))return;ctx.font=`${priority?'700':'600'} ${size}px sans-serif`;
  const width=Math.min(w-pad*2,ctx.measureText(text).width+12),height=size+9;
  let lx=Math.min(w-pad-width,Math.max(pad,px(x)+8)),ly=Math.min(h-pad-height,Math.max(pad+20,pz(z)-height-2));
  const box={x:lx,y:ly,w:width,h:height};
  if(!priority&&labels.some(a=>box.x<a.x+a.w+5&&box.x+box.w+5>a.x&&box.y<a.y+a.h+3&&box.y+box.h+3>a.y))return;
  labels.push(box);ctx.fillStyle=priority?'#fffdf2':'rgba(255,253,243,.88)';ctx.fillRect(lx,ly,width,height);ctx.fillStyle=colour;ctx.fillText(text,lx+6,ly+size+1,width-12);
 }
 const seen=new Set();const destinations=[...sites,...landmarks].filter(s=>{
  if(!Number.isFinite(s.x??s.side*11.8)||!Number.isFinite(s.z)||s.toLet||s.home||s.homeEntry||s.isResidence||s.familyHome||/^(home-|resident-home-)/.test(s.id)||s.id==='mayor-home')return false;
  const id=HARBOUR_PARK_ALIASES[s.id]||s.id;if(seen.has(id)||id!==s.id)return false;seen.add(id);return true;
 });
 for(const s of destinations){const x=s.x??s.side*11.8;if(!inView(x,s.z))continue;ctx.fillStyle=visited.includes(s.id)?'#9f6942':'#536b65';ctx.fillRect(px(x)-3,pz(s.z)-3,6,6);}
 if(showHomes)for(const home of homes){if(!inView(home.x,home.z))continue;ctx.fillStyle='#fffdf2';ctx.strokeStyle='#8e6254';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(px(home.x),pz(home.z),4.5,0,Math.PI*2);ctx.fill();ctx.stroke();}
 for(const p of people){
  const g=p.g;if(!g||g.userData.indoors||g.userData.hit?.inside||g.userData.playerControlled)continue;
  let visible=true;for(let parent=g;parent;parent=parent.parent)if(!parent.visible){visible=false;break;}if(!visible)continue;
  const q=g.getWorldPosition(g.position.clone());if(!inView(q.x,q.z))continue;ctx.fillStyle='#b87746';ctx.beginPath();ctx.arc(px(q.x),pz(q.z),2.5,0,Math.PI*2);ctx.fill();
 }
 if(target&&Number.isFinite(target.x)&&inView(target.x,target.z)){
  ctx.strokeStyle='#a8473e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(px(target.x),pz(target.z),8,0,Math.PI*2);ctx.stroke();
  label(target.address||target.title,target.x,target.z,{priority:true,colour:'#823f36',size:15});
 }
 if(inView(player.x,player.z)){ctx.save();ctx.translate(px(player.x),pz(player.z));ctx.rotate(Math.PI+yaw);ctx.fillStyle='#214e69';ctx.strokeStyle='#fffdf2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(5.5,6);ctx.lineTo(0,3);ctx.lineTo(-5.5,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 const named=new Map([['market','Sakura'],['harbour-park','Harbour Park'],['onsen','Umi-no-yu'],['nakamura','Nakamura / Blue Coral'],['ferry-terminal','Minato ferry'],['koban','Police station'],['warehouse','Harbour Warehouse']]);
 for(const s of destinations)if(named.has(s.id))label(named.get(s.id),s.x??s.side*11.8,s.z);
 if(showHomes&&scale>4)for(const home of homes)label(home.address||home.title,home.x,home.z,{size:12,colour:'#765246'});
 if(scale<5){label('Kitahama',9,52,{size:15});label('Nishi-machi',-35,-5);}
 ctx.restore();
 ctx.fillStyle='#214c50';ctx.font='700 16px sans-serif';ctx.fillText(mode==='world'?'Johansson World':'Minato · local walking map',pad,25);
 ctx.font='700 13px sans-serif';ctx.fillText('N ↑',w-pad-36,25);
 ctx.fillStyle='rgba(255,253,243,.93)';ctx.fillRect(pad-5,h-35,Math.min(w-pad*2+10,350),23);ctx.fillStyle='#31545a';ctx.font='12px sans-serif';ctx.fillText('▲ You   ○ Home   ■ Place   ━ Walking route',pad,h-19,w-pad*2);
 return {bounds:b,scale};
}
