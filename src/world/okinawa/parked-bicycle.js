import * as THREE from '../../../vendor/three.module.js';

/**
 * A parked bicycle, the town's one model for every bicycle that stands somewhere (the playable commuter of
 * world/bicycle.js is Studio's). The owner, 20 October 2026, on his phone: "Bikes clip through objects; the bicycles
 * should look better."
 *
 * What a bicycle on a 1990s Okinawan street is: a steel frame (the diamond of a commuter or a police bicycle, or the
 * dropped tube of a mamachari, which a woman in a skirt or an old man can step through), 26-inch wheels with spokes and
 * black tyres, a sprung saddle, swept-back city bars with black grips, chromed mudguards, a chain guard, a block lamp
 * on the fork, a rear carrier, the horseshoe lock on the back wheel, and the two-legged centre stand (両立スタンド)
 * that holds it upright on its own, both feet on the ground, which is how every bicycle in Japan is parked. A wire
 * basket on the front where the owner carries shopping; a box on the carrier for the police.
 *
 * Built in the kit's frame with the front along local +x and the width along z, as the old prop was. Sizes are a
 * 26-inch city bicycle's (wheel 0.66 m, wheelbase 1.04 m, bars 0.58 m, length 1.74 m); `size` scales the whole bicycle
 * for a child's. About 1,700 triangles, merged by the kit with the street around it.
 *
 * Every bicycle is placed with who rides it and why it stands where it does, and returns its collider, which the
 * caller adds to the town's solids: tests/bicycle-placement.test.mjs builds the town and checks that no bicycle
 * stands in another solid or another bicycle.
 */
export const PARKED_BICYCLE=Object.freeze({
 wheel:.33,wheelbase:1.04,
 /** Its footprint in the local frame, front along +x: the rear mudguard's tail to the basket's nose, bar end to bar end. */
 footprint:Object.freeze({minX:-.9,maxX:.89,minZ:-.31,maxZ:.31}),
 height:1.1,
});

const STEEL=0xc4c9ca,RUBBER=0x242527,SADDLE=0x2b2826,BASKET=0xaeb3b5,LAMP=0xf0e6c4,REFLECTOR=0xc8302a;
const geometryCache=new Map();
const shared=(key,make)=>{if(!geometryCache.has(key))geometryCache.set(key,make());return geometryCache.get(key);};
const m4=(x,y,z,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,rz)),new THREE.Vector3(sx,sy,sz));

/**
 * @param kit the street's kit (okinawa/kit.js)
 * @param {number} x
 * @param {number} z
 * @param {object} o
 * @param {number} [o.ry] heading of the front, as the kit turns things
 * @param {number} [o.colour] the frame's paint
 * @param {'diamond'|'step'} [o.frame] diamond (a commuter's, a man's, the police's) or step-through (a mamachari)
 * @param {boolean} [o.basket] the front wire basket
 * @param {boolean} [o.box] the lockable box on the carrier (the police bicycle's forms)
 * @param {boolean} [o.tag] a lost-property tag on the handlebar
 * @param {number} [o.size] 1 for a grown-up's 26-inch, about .75 for a child's
 * @param {string} [o.id] what the collider is called
 * @param {string} [o.owner] whose it is
 * @param {string} [o.why] why it stands here
 * @returns the bicycle's collider (the kit's rect, turned with it), with `bicycle`, `owner` and `why`
 */
export function bicycle(kit,x,z,{ry=0,colour=0x3d6f8f,frame='diamond',basket=true,box=false,tag=false,size=1,id='bicycle',owner='',why=''}={}){
 const s=size,R=PARKED_BICYCLE.wheel*s,xr=-PARKED_BICYCLE.wheelbase/2*s,xf=PARKED_BICYCLE.wheelbase/2*s;
 const p=(a,b,c=0)=>[a*s,b*s,c*s];
 kit.at(x,z,ry,()=>{
  const rod=(a,b,r,hex,segments=5,finish='matte')=>kit.rod(a,b,r*s,hex,{segments,finish});
  // ── Wheels: tyre, chromed rim, hub, eight spokes laced alternately to each flange. ──
  const tyre=shared('tyre',()=>new THREE.TorusGeometry(1,.075,5,16)),rim=shared('rim',()=>new THREE.TorusGeometry(1,.035,3,16));
  for(const ax of [xr,xf]){
   kit.add(tyre,m4(ax,R,0,0,R-.025*s,R-.025*s,R-.025*s),RUBBER);
   kit.add(rim,m4(ax,R,0,0,R-.058*s,R-.058*s,R-.058*s),STEEL,'metal');
   kit.cyl(.028*s,.028*s,.11*s,ax,R,0,STEEL,{segments:6,rx:Math.PI/2,finish:'metal'});
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2+(ax>0?.3:0),k=R-.06*s;kit.rod([ax,R,(i%2?.022:-.022)*s],[ax+Math.cos(a)*k,R+Math.sin(a)*k,0],.0035*s,STEEL,{segments:3});}
  }
  // ── Mudguards: chromed, wide and flat, following the tyre a hand's width out. ──
  // Front: from in front of the lamp over the top to behind the fork; rear: from over the seat stays round the back
  // and down to the reflector.
  const guardFront=shared('guard-front',()=>new THREE.TorusGeometry(1,.03,3,10,1.8).scale(1,1,2.4)),guardRear=shared('guard-rear',()=>new THREE.TorusGeometry(1,.03,3,12,2.3).scale(1,1,2.4));
  kit.add(guardFront,m4(xf,R,0,.25,R+.035*s,R+.035*s,s),STEEL,'metal');
  kit.add(guardRear,m4(xr,R,0,1.3,R+.035*s,R+.035*s,s),STEEL,'metal');
  kit.box(.025*s,.05*s,.04*s,xr-(R+.04*s)*Math.cos(.35),R-(R+.04*s)*Math.sin(.35),0,REFLECTOR,{rz:.35,finish:'gloss'});
  // ── The frame. ──
  const bb=p(-.05,.30),seat=p(-.20,.80),headTop=p(.34,.86),headBottom=p(.385,.70);
  rod(headBottom,headTop,.028,colour,6,'gloss');
  rod(bb,seat,.022,colour,5,'gloss');
  if(frame==='step'){
   // The mamachari's dropped twin-loop tube: low through the middle, so you step through instead of over.
   const low=p(.12,.38),mid=p(.29,.55);rod(bb,low,.024,colour,5,'gloss');rod(low,mid,.024,colour,5,'gloss');rod(mid,headBottom,.024,colour,5,'gloss');
  }else{
   rod(seat,headTop,.021,colour,5,'gloss');rod(bb,headBottom,.025,colour,5,'gloss');
  }
  for(const side of [-1,1]){
   rod([...p(-.2,.8,side*.025)],[xr,R,side*.055*s],.012,colour,4,'gloss');   // seat stays
   rod([...p(-.05,.3,side*.03)],[xr,R,side*.055*s],.013,colour,4,'gloss');   // chain stays
   rod([...p(.39,.68,side*.045)],[xf,R,side*.05*s],.014,colour,4,'gloss');   // the fork's blades
  }
  rod(p(.385,.70,-.045),p(.385,.70,.045),.02,colour,5,'gloss');               // fork crown
  // ── Drive: the chainring under its guard, the cranks and pedals. ──
  kit.cyl(.1*s,.1*s,.012*s,bb[0],bb[1],.06*s,0x8e9496,{segments:12,rx:Math.PI/2,finish:'metal'});
  kit.box(.5*s,.065*s,.01*s,(bb[0]+xr)/2+.03*s,(bb[1]+R)/2+.03*s,.085*s,0x2b2d30,{rz:Math.atan2(R-bb[1],xr-bb[0])+Math.PI,finish:'gloss'});
  for(const side of [-1,1]){
   const a=side>0?-.6:Math.PI-.6,end=[bb[0]+Math.cos(a)*.16*s,bb[1]+Math.sin(a)*.16*s,side*.1*s];
   rod([bb[0],bb[1],side*.08*s],end,.012,0x9aa0a2,4,'metal');
   kit.box(.1*s,.022*s,.07*s,end[0],end[1],side*.14*s,RUBBER);
  }
  // ── Saddle on its post, the stem and the swept-back bars with their grips and bell. ──
  rod(seat,p(-.235,.935),.014,STEEL,5,'metal');
  kit.sphere(.135*s,-.25*s,.965*s,0,SADDLE,{sx:1,sy:.32,sz:.62});
  for(const side of [-1,1])kit.cyl(.016*s,.016*s,.06*s,-.31*s,.92*s,side*.045*s,0x6f7477,{segments:5,finish:'metal'});
  rod(headTop,p(.33,1.0),.016,STEEL,5,'metal');
  for(const side of [-1,1]){
   rod(p(.33,1.0,0),p(.27,1.02,side*.17),.012,STEEL,5,'metal');
   rod(p(.27,1.02,side*.17),p(.16,1.0,side*.25),.012,STEEL,5,'metal');
   rod(p(.16,1.0,side*.25),p(.05,.99,side*.29),.018,RUBBER,6);
  }
  kit.cyl(.022*s,.026*s,.02*s,.24*s,1.04*s,-.15*s,0xd8dcdc,{segments:8,finish:'metal'});
  // ── The block lamp on the fork crown, and the horseshoe lock on the seat stays. ──
  kit.cyl(.042*s,.042*s,.1*s,.45*s,.73*s,0,0x2b2d2f,{segments:8,rz:Math.PI/2});
  kit.cyl(.04*s,.04*s,.012*s,.505*s,.73*s,0,LAMP,{segments:8,rz:Math.PI/2,finish:'gloss'});
  kit.box(.05*s,.05*s,.13*s,xr+.1*s,R+.2*s,0,0xa8adaf,{rz:.5,finish:'metal'});
  // ── The rear carrier, its stays, and the reflector on its tail. ──
  const cy=.80*s;
  for(const side of [-1,1]){
   rod(p(-.28,.80,side*.085),p(-.78,.80,side*.085),.008,STEEL,4,'metal');
   rod(p(-.74,.80,side*.085),[xr,R,side*.06*s],.007,STEEL,4,'metal');
   rod(p(-.28,.80,side*.085),p(-.2,.78,side*.03),.007,STEEL,4,'metal');
  }
  for(const cx of [-.4,-.55,-.7])rod(p(cx,.80,-.085),p(cx,.80,.085),.007,STEEL,4,'metal');
  kit.box(.02*s,.05*s,.08*s,-.79*s,cy-.03*s,0,REFLECTOR,{finish:'gloss'});
  // ── The centre stand: two legs from the rear axle to the ground, a foot bar between them. ──
  for(const side of [-1,1])rod([xr+.02*s,R-.02*s,side*.065*s],[xr-.1*s,0,side*.17*s],.011,0x8a9092,4,'metal');
  rod([xr-.1*s,.01*s,-.17*s],[xr-.1*s,.01*s,.17*s],.01,0x8a9092,4,'metal');
  // ── The front basket: a steel wire basket on the bars, with a stay down to the axle. ──
  if(basket){
   const bx=.62*s,by=.86*s,bw=.28*s,bh=.24*s,bd=.36*s;
   kit.box(bw,.01*s,bd,bx,by-bh/2,0,BASKET,{finish:'metal'});
   for(const side of [-1,1]){kit.box(bw,bh,.008*s,bx,by,side*bd/2,BASKET,{finish:'metal'});kit.box(.008*s,bh,bd,bx+side*bw/2,by,0,BASKET,{finish:'metal'});}
   for(const y of [by+bh/2])for(const side of [-1,1]){kit.box(bw+.02*s,.012*s,.012*s,bx,y,side*(bd/2+.006*s),0x8f9496,{finish:'metal'});kit.box(.012*s,.012*s,bd+.02*s,bx+side*(bw/2+.006*s),y,0,0x8f9496,{finish:'metal'});}
   for(const side of [-1,1])rod([xf,R,side*.05*s],[bx-bw/2,by-bh/2,side*.1*s],.007,STEEL,4,'metal');
   rod(p(.34,.95),[bx-bw/2,by+.05*s,0],.01,STEEL,4,'metal');
  }
  if(box){
   kit.box(.36*s,.26*s,.3*s,-.53*s,cy+.14*s,0,0xf2f1ea,{finish:'gloss'});
   kit.box(.37*s,.03*s,.31*s,-.53*s,cy+.27*s,0,0xdedcd2,{finish:'gloss'});
   kit.box(.04*s,.05*s,.012*s,-.53*s,cy+.18*s,.156*s,0x5b6064,{finish:'metal'});
  }
  if(tag)kit.box(.05*s,.08*s,.004*s,.2*s,.94*s,.2*s,0xf3e7b0);
 });
 const F=PARKED_BICYCLE.footprint;let rect;
 kit.at(x,z,ry,()=>{rect=kit.rect(F.minX*s,F.maxX*s,F.minZ*s,F.maxZ*s,PARKED_BICYCLE.height*s,id);});
 return Object.assign(rect,{bicycle:true,owner,why});
}
