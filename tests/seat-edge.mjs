import * as THREE from '../vendor/three.module.js';

/**
 * A seat's top as its mesh has it (seat-slots.js `front`): from the sitter's mark along the way they face, how far ahead the
 * front edge of the top is (`front`), how far behind the back edge (`back`), and how thick the seat is under the mark
 * (`thick`; a floor cushion, solid to the floor, is as thick as it is high). Rays straight down find the top within 2 cm of
 * the seat's surfaceY; a gap of up to 5 cm (between slats) does not end it. Null when nothing is drawn under the mark (a
 * seat whose furniture is a GLB that only loads in a browser, or is streamed in later).
 */
export function seatEdge(root,seat){
 const ray=new THREE.Raycaster(),y=seat.surfaceY,[x,floor,z]=seat.position,fx=-Math.sin(seat.yaw||0),fz=-Math.cos(seat.yaw||0);
 const top=(px,pz)=>{ray.set(new THREE.Vector3(px,y+.025,pz),new THREE.Vector3(0,-1,0));ray.near=0;ray.far=.06;
  return ray.intersectObject(root,true).some(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.65&&Math.abs(h.point.y-y)<.02);};
 if(!top(x,z))return null;
 const edge=sign=>{let last=0,gap=0;for(let d=.005;d<.8;d+=.005){if(top(x+sign*fx*d,z+sign*fz*d)){last=d;gap=0;}else if((gap+=.005)>.05)break;}return last;};
 ray.set(new THREE.Vector3(x,floor+.002,z),new THREE.Vector3(0,1,0));ray.near=0;ray.far=y-floor;
 const under=ray.intersectObject(root,true).find(h=>h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y<-.65&&h.point.y<y-.005);
 return {front:edge(1),back:edge(-1),thick:under?y-under.point.y:y-floor};
}

/**
 * The rooms with chairs, stools, cushions and benches to sit on, built as World builds them (their furniture as drawn
 * without a browser): [{name, room, seats: [{label, seat}]}], a bench's places (seat-slots.js) each a seat of its own.
 */
export async function seatRooms(){
 const I=n=>import('../src/world/interiors/'+n+'.js');
 const box=room=>(size,pos,c,parent)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial());m.position.set(...pos);(parent||room).add(m);return m;};
 const home=(name,site)=>[name,async a=>(await I('resident-home')).buildResidentHome({...a,site,profile:{name:site.homeOwner,role:'r'},box:box(a.room)})];
 const builders=[
  ['the harbour office',async a=>{const m=await I('office-workplace');m.buildOfficeShell(a.room);m.buildOfficeWorkplace(a);}],
  ['the Johansson house',async a=>(await I('johansson-house-interior')).buildJohanssonHouse(a)],
  ['Minato and Sato Ramen',async a=>(await I('minato-compact-room')).buildCompactDiningRoom(a,{kind:'izakaya'})],
  ['domestic arrivals',async a=>(await I('airport-arrivals')).buildAirportArrivals(a)],
  ['the classroom',async a=>(await I('classroom')).buildClassroom(a)],
  ['Sakura’s office',async a=>(await I('sakura-office-room')).buildSakuraOfficeRoom(a)],
  ['the clinic',async a=>(await I('town-hall')).buildClinic(a)],
  ['Umi-no-yu',async a=>(await I('onsen')).buildOnsenInterior(a)],
  ['the ferry waiting hall',async a=>(await I('port-hall')).buildPortHall(a)],
  ['the police station',async a=>(await I('police-station')).buildPoliceStationInterior({...a,site:{id:'police-station'}})],
  ['a concrete family home',async a=>(await I('family-home')).buildFamilyHome({...a,kind:'concrete',residents:['Thuan','Thao'],household:{members:[{name:'A',purpose:'farmer'}]}})],
  ['a red-tile family home',async a=>(await I('family-home')).buildFamilyHome({...a,kind:'red-tile',residents:null,household:{members:[{name:'A',purpose:'farmer'}]}})],
  ['Tetsuo’s yard home',async a=>(await I('yard-home')).buildYardHomeInterior({...a,site:{id:'resident-home-kenji',homeOwner:'Tetsuo'}})],
  home('Thao, Chin and Vy’s home',{id:'resident-home-thuan',homeOwner:'Thao',homeOwners:['Thao','Chin','Vy'],plot:'kitahama-1',houseKind:'red-tile'}),
  home('a resident’s home',{id:'home-higa',homeOwner:'Miss Higa'}),
  ['Front-Row Books',async a=>{const {createIslandBusinesses}=await import('../src/world/businesses.js');return (await I('compact-shops')).buildCompactShop({...a,site:createIslandBusinesses().find(s=>s.id==='frontrow')});}],
 ];
 const out=[];
 for(const [name,build] of builders){
  // (a seat's record is written once its marker is registered, by some rooms after: read them once the room is built)
  const room=new THREE.Group(),labels=new Map(),seats=[];
  await build({room,reg:(object,label)=>labels.set(object,label),action(){},onReturn(){},exit(){},collider(){}});
  room.updateMatrixWorld(true);room.traverse(o=>{const s=o.userData.seat;if(s)seats.push(...(s.slots||[s]).map(slot=>({label:labels.get(o)||o.name,seat:{...s,...slot}})));});
  out.push({name,room,seats});
 }
 return out;
}
