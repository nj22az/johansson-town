import * as THREE from '../../../vendor/three.module.js';

/**
 * Umi-no-yu's washing room, dressed as a sentō's arai-ba: the wet room you sit in after
 * changing and before you get anywhere near the bath.
 *
 * - Along the west wall, a long tiled ledge at knee height. Over each place, a pair of
 *   chrome push taps (karan: red cap hot, blue cap cold), a shower on its riser, and a
 *   mirror whose bottom strip carries an advertisement for a business in town, as old
 *   bathhouse mirrors do.
 * - Down the middle, an island of the same: a tiled partition with mirrors and taps on
 *   both faces, so people wash back to back.
 * - A low plastic stool and a yellow bucket at each place, a drain gutter behind the
 *   stools, and the spare stools and buckets stacked by the door.
 *
 * Every place is a seat (wash0..wash7) so you can sit down and wash anywhere.
 */
export const WASH=Object.freeze({
 wall:{x:-5,ledge:.32,z0:-1.55,z1:-4.3},
 island:{x:-1.6,half:.37,z0:-1.95,z1:-3.85},
 ledgeY:.5,
});
const WALL_PLACES=[-1.9,-2.6,-3.3,-4.0],ISLAND_PLACES=[-2.35,-3.45];

/** The washing places, as seats: [wall ×4, island west ×2, island east ×2]. */
export const WASH_SEATS=Object.freeze(Object.fromEntries([
 ...WALL_PLACES.map(z=>({position:[-4.25,0,z],stand:[-3.45,0,z],yaw:Math.PI/2})),
 ...ISLAND_PLACES.map(z=>({position:[WASH.island.x-WASH.island.half-.38,0,z],stand:[-3.05,0,z],yaw:-Math.PI/2})),
 ...ISLAND_PLACES.map(z=>({position:[WASH.island.x+WASH.island.half+.38,0,z],stand:[-.3,0,z],yaw:Math.PI/2})),
].map((s,i)=>['wash'+i,{id:'wash'+i,label:'Wash at the tap',...s,eyeY:.98,surfaceY:.26,front:.165,wash:true}])));

// The advertisements along the bottoms of the mirrors: businesses in town, in English.
const ADS=[
 ['Rainflower','Flowers and wreaths'],['Front-Row Press','The town paper · ¥80'],['Chin & Tetsuo','Radios mended'],
 ['Sakura Shoten','Open late · by the bus stop'],['Sakura Trading','Beer and awamori · we deliver'],['Sato Ramen','After your bath: a bowl'],
 ['Minato','Cold beer on the quay'],['Island Clinic','Mon–Fri 9–17 · Sat 9–12'],
];

function canvas(w,h,paint){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');if(!ctx)return null;paint(ctx,w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
/** Small square mosaic: a sentō's blue and white tiles. */
function mosaic(base,alt,grout='#d9dcd8'){
 return canvas(256,256,(ctx,w)=>{
  const n=16,s=w/n;ctx.fillStyle=grout;ctx.fillRect(0,0,w,w);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=(x*7+y*13+x*y)%9;ctx.fillStyle=k<2?alt:base;ctx.fillRect(x*s+1,y*s+1,s-2,s-2);}
 });
}
function mirrorTexture([name,line]){
 return canvas(256,320,(ctx,w,h)=>{
  const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#dfe9ec');g.addColorStop(.45,'#b8c8cd');g.addColorStop(.55,'#cfdde1');g.addColorStop(1,'#a7b8bd');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  // A soft streak of reflected light, and a little steam at the top.
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.moveTo(w*.15,0);ctx.lineTo(w*.32,0);ctx.lineTo(w*.12,h*.8);ctx.lineTo(0,h*.8);ctx.fill();
  const fog=ctx.createLinearGradient(0,0,0,h*.3);fog.addColorStop(0,'rgba(255,255,255,.55)');fog.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=fog;ctx.fillRect(0,0,w,h*.3);
  // The advertising strip, painted on the glass.
  ctx.fillStyle='#f6f1e4';ctx.fillRect(0,h*.8,w,h*.2);ctx.fillStyle='#c0392b';ctx.fillRect(0,h*.8,w,6);
  ctx.fillStyle='#24312c';ctx.textAlign='center';ctx.font='bold 26px sans-serif';ctx.fillText(name,w/2,h*.87);
  ctx.font='17px sans-serif';ctx.fillStyle='#4a524e';ctx.fillText(line,w/2,h*.95);
 });
}
function bucketTexture(){
 return canvas(256,64,(ctx,w,h)=>{ctx.fillStyle='#f4c430';ctx.fillRect(0,0,w,h);ctx.fillStyle='#2a5fa8';ctx.font='bold 22px sans-serif';ctx.textAlign='center';
  for(const x of [w*.25,w*.75])ctx.fillText('UMI-NO-YU',x,h*.62);});
}

/**
 * Builds the washing room into the onsen. `kit` carries the onsen's own helpers so the
 * room shares its colliders and seats: {room,box,cyl,rect,seat,mat}.
 */
export function buildWashArea({room,box,cyl,rect,seat,mat}){
 // No environment map indoors, so "chrome" is a bright, lightly metallic grey rather than a dark mirror.
 const chrome=mat(0xe2e6e8,.28,{metalness:.35});
 const tile=mosaic('#8fc3d9','#f1f4f2'),ledgeTile=mosaic('#e9eeec','#9cc8da');
 const ledgeMat=ledgeTile?new THREE.MeshStandardMaterial({map:ledgeTile,roughness:.35}):mat(0xe9eeec,.35);
 const sideMat=tile?new THREE.MeshStandardMaterial({map:tile,roughness:.35}):mat(0x8fc3d9,.35);
 if(ledgeTile)ledgeTile.wrapS=ledgeTile.wrapT=THREE.RepeatWrapping,ledgeTile.repeat.set(1,6);
 if(tile)tile.wrapS=tile.wrapT=THREE.RepeatWrapping,tile.repeat.set(6,1);
 const hot=mat(0xd8342c,.4),cold=mat(0x2f6fc0,.4),stoolMat=mat(0xf4ece4,.5),stoolPink=mat(0xf2b8c6,.5);
 const bucketMap=bucketTexture(),bucketMat=bucketMap?new THREE.MeshStandardMaterial({map:bucketMap,roughness:.45,side:THREE.DoubleSide}):mat(0xf4c430,.45,{side:THREE.DoubleSide});
 const bucketBottom=mat(0xe8b520,.45);
 const soaps=[mat(0x9ec7e3,.5),mat(0xe7a0b5,.5),mat(0xf3efe2,.5)];
 const W=WASH,ly=W.ledgeY;
 const mirrors=ADS.map(ad=>{const t=mirrorTexture(ad);return t?new THREE.MeshStandardMaterial({map:t,roughness:.15,metalness:.1}):mat(0xcfd8da,.08,{metalness:.6});});

 // One place: taps, shower, mirror, soap, stool and bucket. `face` is the direction the
 // washer looks (-1 towards -x, +1 towards +x); `wx` is the face of the wall or partition.
 let n=0;
 function place(wx,z,face,sx){
  const out=-face,k=n++;
  // Mirror, with its ad.
  const mirror=new THREE.Mesh(new THREE.PlaneGeometry(.5,.62),mirrors[k%mirrors.length]);
  mirror.position.set(wx+out*.024,1.2,z);mirror.rotation.y=out>0?Math.PI/2:-Math.PI/2;mirror.name='Wash mirror';room.add(mirror);
  box([.03,.66,.54],[wx+out*.004,1.2,z],chrome,'Mirror frame');
  // Karan: two push taps on a chrome bar, hot on the left as you sit.
  box([.05,.04,.3],[wx+out*.03,.72,z],chrome,'Karan bar');
  for(const [dz,cap] of [[-.09*face,hot],[.09*face,cold]]){
   const spout=cyl(.016,.11,[wx+out*.085,.7,z+dz],chrome,'Karan spout',10);spout.rotation.z=Math.PI/2;
   cyl(.024,.03,[wx+out*.08,.75,z+dz],cap,'Karan push cap',14);
  }
  // The shower on its riser, the head tilted at the stool.
  cyl(.012,.86,[wx+out*.03,ly+.55,z+.2*face],chrome,'Shower riser',8);
  const head=cyl(.04,.035,[wx+out*.08,ly+.95,z+.2*face],chrome,'Shower head',14);head.rotation.z=out*.9;
  // Soap and shampoo on the ledge.
  box([.08,.05,.05],[wx+out*.14,ly+.025,z-.17*face],soaps[k%3],'Soap');
  cyl(.03,.16,[wx+out*.14,ly+.08,z+.12*face],soaps[(k+1)%3],'Shampoo bottle',10);
  // The low stool, its seat dished, and the yellow bucket beside it.
  const stool=new THREE.Group();stool.name='Wash stool';stool.position.set(sx,0,z);room.add(stool);
  const seatTop=new THREE.Mesh(new THREE.CylinderGeometry(.165,.15,.04,20),k%3===1?stoolPink:stoolMat);seatTop.position.y=.24;stool.add(seatTop);
  for(const a of [0,1,2,3]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.035,.22,.035),k%3===1?stoolPink:stoolMat);leg.position.set(Math.cos(a*Math.PI/2+.78)*.11,.11,Math.sin(a*Math.PI/2+.78)*.11);stool.add(leg);}
  const bucket=new THREE.Group();bucket.name='Yellow bucket';bucket.position.set(sx+out*.06,0,z-.3*face);room.add(bucket);
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(.13,.11,.12,20,1,true),bucketMat);wall.position.y=.06;bucket.add(wall);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(.11,20),bucketBottom);floor.rotation.x=-Math.PI/2;floor.position.y=.006;bucket.add(floor);
  rect(sx,z,.3,.3,.3);
 }

 // ---- The wall ledge.
 const wz=(W.wall.z0+W.wall.z1)/2,wd=W.wall.z0-W.wall.z1,wx=W.wall.x+.02+W.wall.ledge;
 box([W.wall.ledge,ly,wd],[W.wall.x+.02+W.wall.ledge/2,ly/2,wz],sideMat,'Wash ledge');
 box([W.wall.ledge+.04,.04,wd+.02],[W.wall.x+.02+W.wall.ledge/2,ly,wz],ledgeMat,'Wash ledge top');
 rect(W.wall.x+.02+W.wall.ledge/2,wz,W.wall.ledge,wd,ly);
 const wallFace=W.wall.x+.07;
 for(const z of WALL_PLACES)place(wallFace,z,-1,-4.25);
 // A long mosaic band along the wall behind the taps, up to the mirrors.
 box([.02,.4,wd],[W.wall.x+.08,ly+.2,wz],sideMat,'Wash wall mosaic');
 void wx;

 // ---- The island: a partition with a ledge each side.
 const I=W.island,iz=(I.z0+I.z1)/2,id=I.z0-I.z1;
 box([.14,1.55,id],[I.x,.775,iz],sideMat,'Wash island partition');
 box([.18,.05,id+.04],[I.x,1.575,iz],ledgeMat,'Wash island cap');
 for(const side of [-1,1]){
  box([I.half-.07,ly,id],[I.x+side*(.07+(I.half-.07)/2),ly/2,iz],sideMat,'Wash island ledge');
  box([I.half-.05,.04,id+.02],[I.x+side*(.07+(I.half-.07)/2),ly,iz],ledgeMat,'Wash island ledge top');
  for(const z of ISLAND_PLACES)place(I.x+side*.07,z,-side,I.x+side*(I.half+.38));
 }
 rect(I.x,iz,I.half*2,id,1.55);

 // ---- The drain gutter behind the wall stools, and the stack by the door.
 const grate=mat(0x6f7476,.5,{metalness:.5});
 box([.12,.012,wd],[-3.85,.006,wz],mat(0x3c4244,.8),'Drain gutter');
 for(let z=W.wall.z1+.05;z<W.wall.z0;z+=.06)box([.12,.014,.012],[-3.85,.008,z],grate,'Drain grate bar');
 const stack=new THREE.Group();stack.name='Stacked stools and buckets';stack.position.set(-1.25,0,-1.55);room.add(stack);
 for(let i=0;i<5;i++){const s=new THREE.Mesh(new THREE.CylinderGeometry(.165,.15,.04,20),i%2?stoolPink:stoolMat);s.position.set(-.12,.24+i*.05,0);stack.add(s);
  const legs=new THREE.Mesh(new THREE.CylinderGeometry(.13,.14,.2,4,1,true),i%2?stoolPink:stoolMat);legs.position.set(-.12,.12+i*.05,0);if(i===0)stack.add(legs);}
 for(let i=0;i<6;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.13,.11,.12,20,1,true),bucketMat);b.position.set(.16,.06+i*.035,0);stack.add(b);}
 rect(-1.25,-1.55,.62,.36,.6);

 const seats=[];
 for(const s of Object.values(WASH_SEATS))seats.push(seat(s,'Washing place','You sit on the low stool, fill the yellow bucket from the red tap and the blue, and pour it over your shoulders. Soap, rinse, and again. In the mirror, under the steam: '+ADS[Number(s.id.slice(4))%ADS.length][0]+'. Nobody gets into the bath until they have done this.'));
 return {seats};
}
