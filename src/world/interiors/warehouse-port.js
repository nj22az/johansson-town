import * as THREE from '../../../vendor/three.module.js';

// Adapted from the supplied Okinawa warehouse reference to the western quay room.
// All detail is immobile and batched by the caller; no extra render loop or lights.
export function buildWarehousePortDetails({room,box,inspect,collider,wood,dark,steel,rope}){
 const sheet=new THREE.MeshStandardMaterial({color:0x89938d,roughness:.88,metalness:.18});
 for(const x of [-2.78,2.78])for(let z=-5;z<5.1;z+=.24)box([.025,3.1,.035],[x,1.75,z],sheet,'warehouse-wall-rib');
 // Braced ties and a short overhead rail, above the walking envelope.
 for(const z of [-3.8,-.8,2.2])for(const side of [-1,1]){
  const brace=box([2.8,.09,.09],[side*1.3,3.25,z],dark,'warehouse-truss-brace');brace.rotation.z=side*.18;
 }
 box([.12,.16,5.9],[.70,3.28,-.6],steel,'warehouse-hoist-rail');
 box([.32,.18,.36],[.70,3.10,-1.7],steel,'warehouse-hoist-trolley');
 box([.025,.54,.025],[.70,2.74,-1.7],steel,'warehouse-hoist-chain');
 const hook=new THREE.Mesh(new THREE.TorusGeometry(.09,.022,6,14,Math.PI*1.55),steel);
 hook.name='warehouse-cargo-hook';hook.position.set(.70,2.43,-1.7);hook.rotation.z=Math.PI;hook.userData.staticProp=true;hook.receiveShadow=true;room.add(hook);
 inspect([.7,1.4,-1.7],'Cargo hoist','A manual chain hoist runs along the overhead rail. Loads are kept out of the marked centre aisle.');
 // One atlas for all readable cargo faces; labels face into the aisle.
 const c=document.createElement('canvas');c.width=512;c.height=512;const ctx=c.getContext('2d');
 const labels=[['QUAY STORES',"Port warehouse",'#314d51'],['LUNCHEON MEAT',"Tinned Pork",'#21447b'],['BOTTLED BEER',"Bottled beer",'#903d32'],['DRIED KELP',"Kelp",'#466447']];
 labels.forEach(([a,b,colour],i)=>{const y=i*128;ctx.fillStyle='#d3bb87';ctx.fillRect(0,y,512,128);ctx.strokeStyle=colour;ctx.lineWidth=6;ctx.strokeRect(8,y+8,496,112);ctx.fillStyle=colour;ctx.textAlign='center';ctx.font='bold 30px sans-serif';ctx.fillText(a,256,y+49);ctx.font='24px sans-serif';ctx.fillText(b+' · WESTERN QUAY',256,y+87);});
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 const labelMat=new THREE.MeshStandardMaterial({map:texture,roughness:1});
 for(const side of [-1,1])for(const [i,z] of [-3.82,-3.08,-2.48,-1.02,-.28,.32].entries()){
  const geo=new THREE.PlaneGeometry(.47,.28),uv=geo.attributes.uv;
  for(let j=0;j<uv.count;j++)uv.setY(j,(uv.getY(j)+(3-i%4))/4);
  const face=new THREE.Mesh(geo,labelMat);face.position.set(side*1.955,1.31,z);face.rotation.y=-side*Math.PI/2;face.userData.staticProp=true;face.receiveShadow=true;room.add(face);
 }
 // Pallet and freight stay to the right of the entrance; safe central passage.
 for(const z of [1.65,2.75]){
  for(const dx of [-.31,.31])box([.09,.12,.85],[2.17+dx,.06,z],dark);
  for(let i=0;i<5;i++)box([.8,.04,.13],[2.17,.14,z-.34+i*.17],wood,'warehouse-pallet-plank');
 }
 box([.62,.48,.65],[2.17,.40,1.65],wood,'warehouse-pallet-cargo');
 collider(2.17,1.65,.85,.9,.64);
 const yellow=new THREE.MeshStandardMaterial({color:0xba9239,roughness:.65,metalness:.2});
 for(const x of [2.00,2.32])box([.10,.07,.85],[x,.19,2.7],yellow,'warehouse-jack-fork');
 box([.32,.26,.24],[2.16,.28,3.16],steel);
 const handle=box([.04,.75,.04],[2.16,.73,3.25],yellow);handle.rotation.x=-.15;
 box([.34,.045,.06],[2.16,1.12,3.30],steel,'warehouse-jack-handle');
 collider(2.16,2.95,.85,1.45,1.2);
 inspect([1.5,.9,2.7],'Pallet jack','The quay crew uses this hydraulic pallet jack for local deliveries. Park it beside the freight, clear of the exit.');
 // Small returnable bottles, drawn together with the other static metalwork.
 const glass=new THREE.MeshStandardMaterial({color:0x52432a,roughness:.5});
 for(let i=0;i<6;i++){
  box([.10,.22,.10],[2.1,.42,-3.8+i*.17],glass,'warehouse-returnable-bottle');
  box([.04,.08,.04],[2.1,.57,-3.8+i*.17],glass);
 }
 inspect([1.5,1.15,-2.7],'Island provisions','Tinned luncheon meat, dried kelp and returnable beer bottles are sorted here before delivery to the town shops.');
 // Paint strips rather than geometry spanning the route.
 const paint=new THREE.MeshStandardMaterial({color:0xc5ae65,roughness:1});
 for(const x of [-1.05,1.05])for(let z=-3.4;z<4;z+=.8)box([.045,.006,.38],[x,.005,z],paint,'warehouse-aisle-marking');
}
