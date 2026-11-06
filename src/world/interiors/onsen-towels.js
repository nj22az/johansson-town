import * as THREE from '../../../vendor/three.module.js';

/**
 * Towels at Umi-no-yu: white terry, matte, each one where somebody needs it.
 *
 * The bath's rule is no towels in the water, so a towel's day here is: rented at the
 * bandai (¥100 on the price board) or brought from home, hung on the rail by the bath
 * door going in, taken down to dry off before you step back onto the wood, and dropped in
 * the return basket on the way out. Rental towels carry a navy band so they come back.
 *
 * Every towel rests on something (`restsOn`) or hangs from the rail (`hangsFrom`); the
 * tests check both, and that nothing passes through the furniture it sits on.
 * Room frame as in onsen.js: street door at +z, sea at -z, metres, floor at y = 0.
 */
export const TOWEL_SHELF=Object.freeze({x:-2.55,z:1.9,w:.7,d:.3,h:.8,middle:.43,bottom:.06});
export const TOWEL_RAIL=Object.freeze({x0:.92,x1:1.68,y:1.22,z:-1.06,r:.012});
export const TOWEL_PRICE=100;

export const ONSEN_TOWELS=Object.freeze([
 Object.freeze({id:'rental-stacks',en:'Rental towels, ready on the shelf by the bandai',count:12,price:TOWEL_PRICE,
  for:'Visitors who came without one: ferry passengers, tourists who saw the poster, workers straight off the quay.',
  why:'On the customer side of the bandai, beside the noren, so you pick one up as you pay and walk straight through to change. The navy band says it belongs to the bath.'}),
 Object.freeze({id:'rental-reserve',en:'The evening’s second batch of rental towels',count:8,price:TOWEL_PRICE,
  for:'The after-ferry rush.',
  why:'On the middle shelf, so Miss Higa can refill the top without leaving the bandai while people are queueing.'}),
 Object.freeze({id:'return-basket',en:'Return basket for used rental towels',count:1,
  for:'Everyone leaving with a rental towel.',
  why:'On the bottom shelf by the noren, the last thing you pass on the way out; the basket goes to the laundry every morning.'}),
 Object.freeze({id:'rail',en:'Towel rail by the bath door',count:2,
  for:'Bathers going in.',
  why:'No towels in the water: you hang yours here on the way in and take it down to dry off before you step back onto the wooden floor.'}),
 Object.freeze({id:'bench',en:'The house towel on the changing-room bench',count:1,
  for:'Whoever comes out of the bath and finds they forgot one.',
  why:'Miss Higa leaves it folded at the far end of the bench, away from where people sit to change.'}),
]);

/** Terry: soft loops, no sheen. `band` adds the bath's navy stripe. */
function terry(band){
 const size=64,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,loop=((x*7+y*13)%5)*3+((x+y*3)%4)*2,v=y/size,striped=band&&v>.72&&v<.84;
  const [r,g,b]=striped?[46,62,104]:[236,233,224];
  data[i]=Math.max(0,r-loop);data[i+1]=Math.max(0,g-loop);data[i+2]=Math.max(0,b-loop);data[i+3]=255;
 }
 const t=new THREE.DataTexture(data,size,size);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
/** The card above the shelf: the price, the same as the board at the bandai. */
function rentalCard(){
 if(typeof document==='undefined'||!document.createElement)return null;
 const w=448,h=192,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext?.('2d');if(!ctx||!ctx.fillRect)return null;
 const font='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
 ctx.fillStyle='#fbf6ea';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#1f3558';ctx.lineWidth=6;ctx.strokeRect(5,5,w-10,h-10);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#1f3558';
 ctx.font=`bold 50px ${font}`;ctx.fillText('貸しタオル ¥100',w/2,h*.4);
 const en=`RENTAL TOWEL ¥${TOWEL_PRICE} · PAY AT THE BANDAI`;let s=24;do{ctx.font=`600 ${s}px ${font}`;}while(ctx.measureText(en).width>w-30&&--s>8);
 ctx.fillText(en,w/2,h*.76);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export function buildOnsenTowels({room,rect}){
 const group=new THREE.Group();group.name='Umi-no-yu towels';room.add(group);
 const plain=new THREE.MeshStandardMaterial({map:terry(false),roughness:1,metalness:0});
 const rental=new THREE.MeshStandardMaterial({map:terry(true),roughness:1,metalness:0});
 const wood=new THREE.MeshStandardMaterial({color:0xb08a5c,roughness:.7});
 const rattan=new THREE.MeshStandardMaterial({color:0xc9a36a,roughness:.9});
 const chrome=new THREE.MeshStandardMaterial({color:0xc8ccc8,roughness:.25,metalness:.85});
 const add=(geometry,material,x,y,z,name,parent=group)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=name;m.castShadow=m.receiveShadow=true;m.userData.staticProp=true;parent.add(m);return m;};
 const item=(id)=>{const g=new THREE.Group();g.name='Towel '+id;g.userData.towel=id;group.add(g);return g;};
 // A folded towel: its bottom sits exactly on `y`.
 const folded=(g,x,y,z,w,h,d,m,restsOn,yaw=0)=>{const t=add(new THREE.BoxGeometry(w,h,d),m,x,y+h/2,z,'Folded towel',g);t.rotation.y=yaw;t.userData.restsOn=restsOn;return t;};
 const stack=(id,x,y,z,n,restsOn)=>{const g=item(id),h=.04;for(let i=0;i<n;i++)folded(g,x+(i%2?.004:-.003),y+i*h,z+(i%3-1)*.003,.26,h,.2,rental,i?'Folded towel':restsOn);return g;};

 // ---- The towel shelf on the customer side of the bandai, against the lobby wall.
 const S=TOWEL_SHELF,shelf=new THREE.Group();shelf.name='Towel shelf';group.add(shelf);
 for(const s of [-1,1])add(new THREE.BoxGeometry(.02,S.h,S.d),wood,S.x+s*(S.w/2-.01),S.h/2,S.z,'Towel shelf side',shelf);
 add(new THREE.BoxGeometry(S.w,.025,S.d),wood,S.x,S.h-.0125,S.z,'Towel shelf top',shelf);
 add(new THREE.BoxGeometry(S.w-.04,.02,S.d-.01),wood,S.x,S.middle-.01,S.z,'Towel shelf middle',shelf);
 add(new THREE.BoxGeometry(S.w-.04,.02,S.d-.01),wood,S.x,S.bottom-.01,S.z,'Towel shelf bottom',shelf);
 add(new THREE.BoxGeometry(S.w-.04,S.bottom-.02,.02),wood,S.x,(S.bottom-.02)/2,S.z+S.d/2-.02,'Towel shelf plinth',shelf);
 add(new THREE.BoxGeometry(S.w-.04,S.h-.03,.01),wood,S.x,S.h/2,S.z-S.d/2+.005,'Towel shelf back',shelf);
 rect(S.x,S.z,S.w+.02,S.d+.02,S.h);
 stack('rental-stacks',S.x-.16,S.h,S.z+.005,6,'Towel shelf top');stack('rental-stacks',S.x+.16,S.h,S.z+.005,6,'Towel shelf top');
 stack('rental-reserve',S.x-.16,S.middle,S.z+.01,4,'Towel shelf middle');stack('rental-reserve',S.x+.16,S.middle,S.z+.01,4,'Towel shelf middle');
 // The return basket: open rattan, one used towel already in it.
 {const g=item('return-basket'),bw=.5,bh=.2,bd=.22,y=S.bottom,z=S.z+.02;
  add(new THREE.BoxGeometry(bw,.012,bd),rattan,S.x,y+.006,z,'Return basket',g);
  for(const s of [-1,1]){add(new THREE.BoxGeometry(.012,bh,bd),rattan,S.x+s*(bw/2-.006),y+bh/2,z,'Return basket',g);add(new THREE.BoxGeometry(bw,bh,.012),rattan,S.x,y+bh/2,z+s*(bd/2-.006),'Return basket',g);}
  g.children[0].userData.restsOn='Towel shelf bottom';
  folded(g,S.x-.04,y+.012,z,.3,.035,.15,rental,'Return basket',.1);}
 // Its price, on the wall above, matching the board at the bandai.
 const price=rentalCard();
 if(price){const p=add(new THREE.PlaneGeometry(.37,.16),new THREE.MeshStandardMaterial({map:price,roughness:.8}),S.x,1.12,1.6625,'Rental towel card');p.castShadow=false;}

 // ---- The rail by the bath door, two towels hung over it.
 const Rl=TOWEL_RAIL,rail=new THREE.Group();rail.name='Towel rail';group.add(rail);
 add(new THREE.CylinderGeometry(Rl.r,Rl.r,Rl.x1-Rl.x0,12).rotateZ(Math.PI/2),chrome,(Rl.x0+Rl.x1)/2,Rl.y,Rl.z,'Towel rail bar',rail);
 for(const x of [Rl.x0+.01,Rl.x1-.01])add(new THREE.BoxGeometry(.02,.04,Rl.z+1.14),chrome,x,Rl.y,(Rl.z-1.14)/2,'Towel rail bracket',rail);
 rect((Rl.x0+Rl.x1)/2,-1.09,Rl.x1-Rl.x0+.04,.1,Rl.y+.05);
 for(const x of [1.12,1.48]){const g=item('rail'),w=.32,r=.019;
  const roll=add(new THREE.CylinderGeometry(r,r,w,14).rotateZ(Math.PI/2),plain,x,Rl.y,Rl.z,'Hanging towel',g);
  const frontPanel=add(new THREE.BoxGeometry(w,.44,.012),plain,x,Rl.y-.22,Rl.z+.013,'Hanging towel',g);
  const back=add(new THREE.BoxGeometry(w,.34,.012),plain,x,Rl.y-.17,Rl.z-.013,'Hanging towel',g);
  for(const m of [roll,frontPanel,back])m.userData.hangsFrom='Towel rail bar';}

 // ---- The house towel at the far end of the changing-room bench (top at y 0.46).
 {const g=item('bench');folded(g,2.95,.46,.25,.32,.025,.24,plain,'Changing bench');folded(g,2.952,.485,.252,.32,.025,.24,plain,'Folded towel');}
 return {group};
}
