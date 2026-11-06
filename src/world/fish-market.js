import * as THREE from '../../vendor/three.module.js';
import {createKit,rng,trs,paint} from './okinawa/kit.js';
import {EAST_QUAY} from './okinawa/layout.js';
import {fishAt,fishById} from './okinawa/fish.js';
import {poster} from './okinawa/signs.js';
import {GROUND_LAYER} from './ground-layers.js';
import {rotaWeek} from '../people/ferry-crew.js';

/**
 * The fish market on the east quay: the auction floor's catch, the working shed, the co-op's sale counter, the roof's
 * water and the quay edge in front of it. The owner, 30 October 2026, on the survey of xiaoninemao/japanese-miniature-
 * scenes (docs/research/japanese-miniature-scenes.md): "Work accordingly to your recommendations", and "I like the sale
 * counter". Studied from its Morning Fish Market, never copied: the sizes are a real market's, the fish are fish.js's.
 *
 * Before this the catch was eighteen solid blue boxes with three spheres on each lid, set so close they ran together
 * into one sausage, no ice though the ice plant is next door, a grey box for a scale, and nowhere in town sold a fish.
 * Everything here says who it is for and why it stands where it does (FISH_MARKET_PIECES; CLAUDE.md, "Nothing is
 * random"), and the layout is data, so tests/fish-market.test.mjs can measure it.
 */

const S=EAST_QUAY.shed,Q=EAST_QUAY;
/** The top of the auction shed's painted floor: the apron and its 10 cm slab (quarters.js buildEastQuay). */
export const AUCTION_FLOOR=GROUND_LAYER.apron+.1;
const F=AUCTION_FLOOR;

/**
 * How each of the auction's fish lies on ice: its length (a market-sized fish), its body's depth for that length (a
 * fusilier is slender, a tuskfish deep), how many go to a co-op box, and which boat landed it, by how fish.js says it is
 * caught. The Daisan Minatomaru is "back from the reef with her hold iced" (quarters.js); Kōji fishes the reef from his
 * own sabani (cast.js); kachū come in on the bonito boats, pole and line (fish.js). Not the maguro or the sēika: the
 * shed's text says they went first.
 */
export const LAID=Object.freeze({
 gurukun:Object.freeze({length:.26,depth:.28,count:6,boat:'daisan'}),     // a drive-in net worked by divers over the reef
 irabucha:Object.freeze({length:.42,depth:.38,count:2,boat:'sabani'}),    // spear and net on the reef
 mibai:Object.freeze({length:.36,depth:.32,count:3,boat:'sabani'}),       // hand line and spear
 akajin:Object.freeze({length:.44,depth:.3,count:2,boat:'daisan'}),       // hand line over deep reef
 akamachi:Object.freeze({length:.4,depth:.32,count:2,boat:'daisan'}),     // a deep-drop line
 makubu:Object.freeze({length:.42,depth:.4,count:2,boat:'sabani'}),       // hand line and spear
 shichumachi:Object.freeze({length:.38,depth:.32,count:2,boat:'daisan'}), // a deep-drop line
 kachu:Object.freeze({length:.5,depth:.26,count:2,boat:'bonito'}),        // pole and line from bonito boats
});
export const LANDED_BY=Object.freeze({
 daisan:Object.freeze({name:'Daisan Minatomaru',why:'Back from the reef and the deep-drop lines with her hold iced; she lies at this quay.'}),
 sabani:Object.freeze({name:'Kōji’s sabani',why:'He fishes the reef from his own sabani, and sorts the catch here.'}),
 bonito:Object.freeze({name:'a bonito boat',why:'Kachū are caught pole and line from the bonito boats.'}),
});

/** A co-op fish box: the blue plastic container the auction lays a lot in, outside measurements, and its bed of ice. */
export const FISH_BOX=Object.freeze({w:.72,h:.26,d:.46,wall:.03,base:.03,lip:.02,ice:.17});

/**
 * Kōji's stack of empty boxes, which he sorts the catch into: behind the sale counter at the floor's landward west end,
 * where he stands to sort (people/neighbours.js, [23.4, -41.7]). It stood across the front between the columns until the
 * counter took that bay, 16 cm sunk in the floor and through the corner lot.
 */
export const SORTING_STACK=Object.freeze({x:Q.minX+2.62,z:-42,rows:1,cols:2,y:F});

/**
 * The co-op's sale counter (直売): where the town buys one fish, since Yonamine Fresh Fish closed and its plot went. It
 * sells what the buyers left at the morning's auction, by the kilo at the board's own prices (auction-board.js), so a
 * household pays what the restaurants paid. Kōji keeps it when the floor is washed (07:00, the board) until he goes to
 * the ice plant at nine (cast.js), on his weeks ashore: on his relief weeks he is the ferry's bosun (canonical-day.js).
 * It stands in the shed's landward west bay, its front on the shed's edge, so a customer stands on the walk from the
 * lawn gate; the two corner lots gave it the room.
 */
export const FISH_COUNTER=Object.freeze({
 x:22.25,z:-40.99,w:2.2,d:.62,top:.86,open:7*60,close:9*60,keeper:'Kōji',
 // The ice tray's rake towards the customer, radians (about 11°).
 rake:.2,
 sells:Object.freeze([
  Object.freeze({fish:'gurukun',kilo:900,count:8,item:'Gurukun (1 kg)',
   text:'A kilo of gurukun off the ice: four or five fish, red now, though they were blue in the sea. Kōji weighs them on the little scale and bags them with a scoop of ice. Fried whole, bones and all.'}),
  Object.freeze({fish:'irabucha',kilo:1200,count:2,item:'Irabuchā (1 kg)',
   text:'One blue parrotfish, about a kilo, for sashimi: blue skin, white flesh. Kōji weighs it and bags it with a scoop of ice.'}),
 ]),
});
/** Whether the counter is open: 07:00 to 09:00, while Kōji is ashore and at the auction (ferry-crew.js rotaWeek). */
export function fishCounterOpen(minutes){
 const m=((minutes%1440)+1440)%1440;
 return m>=FISH_COUNTER.open&&m<FISH_COUNTER.close&&rotaWeek(minutes)===0;
}

const rectOf=(x,z,w,d)=>({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
const overlap=(a,b)=>a.minX<b.maxX&&b.minX<a.maxX&&a.minZ<b.maxZ&&b.minZ<a.maxZ;
export const stackRect=()=>{const s=SORTING_STACK;return {minX:s.x-.35,maxX:s.x+s.cols*.66-.3,minZ:s.z-.25,maxZ:s.z+s.rows*.46-.2};};
export const counterRect=()=>rectOf(FISH_COUNTER.x,FISH_COUNTER.z,FISH_COUNTER.w,FISH_COUNTER.d);

/**
 * The lots on the auction floor: the old grid of three rows of six, a lot to a box, the auction's fish in turn. Where
 * the counter and Kōji's stack stand, no lot is laid.
 */
export const AUCTION_LOTS=Object.freeze((()=>{
 const crated=fishAt('auction').filter(f=>f.id!=='maguro'&&f.id!=='seika'),out=[];
 for(let row=0;row<3;row++)for(let k=0;k<6;k++){
  const x=S.minX+1.2+k*1.1,z=S.minZ+2+row*1.8,fish=crated[(row*6+k)%crated.length],box=rectOf(x,z,FISH_BOX.w,FISH_BOX.d);
  if(overlap(box,counterRect())||overlap(box,stackRect()))continue;
  out.push(Object.freeze({id:`lot-${row}-${k}`,x,z,fish:fish.id,count:LAID[fish.id].count,boat:LAID[fish.id].boat}));
 }
 return out;
})());

/** What the catch's collider covers: the two full rows to sea, and the landward row east of the counter. */
export function catchColliders(){
 const pad=.05,sets=[AUCTION_LOTS.filter(l=>l.z<-42),AUCTION_LOTS.filter(l=>l.z>=-42)];
 return sets.filter(s=>s.length).map(lots=>{
  const minX=Math.min(...lots.map(l=>l.x))-FISH_BOX.w/2-pad,maxX=Math.max(...lots.map(l=>l.x))+FISH_BOX.w/2+pad;
  const minZ=Math.min(...lots.map(l=>l.z))-FISH_BOX.d/2-pad,maxZ=Math.max(...lots.map(l=>l.z))+FISH_BOX.d/2+pad;
  return {id:'auction-catch',x:(minX+maxX)/2,z:(minZ+maxZ)/2,w:maxX-minX,d:maxZ-minZ,height:.5};
 });
}

/** The working shed's kit, each piece where its job is. Positions are world metres; footprints are what they stand on. */
export const SHED_KIT=Object.freeze({
 // The platform scale (台秤) the catch is weighed on as it comes up from the boats, on the seaward side by the board.
 scale:Object.freeze({x:28,z:-45.6,w:.62,d:.48,ry:-Math.PI/2,capacity:30}),
 // The stand-pipe and the hose reel the floor is washed with by seven, and the trench drain it is washed into.
 wash:Object.freeze({tap:[21.3,-46.35],reel:[21.9,-46.3],minX:21.12,maxX:22.14,minZ:-46.6,maxZ:-46.05}),
 drain:Object.freeze({minX:21.4,maxX:27.5,z:-45.75,width:.16}),
 damp:Object.freeze({minX:20.85,maxX:29.15,minZ:-46.75,maxZ:-45.2}),
 // Three pairs of white boots, upside down on the rack to drain: Kōji's, and the ice plant's men's.
 boots:Object.freeze({x:22.75,z:-46.42,w:.86,d:.4,pairs:3}),
 // The bell rung at six, on the seaward column at the board's end.
 bell:Object.freeze({x:28.84,y:1.72,z:S.minZ+.15}),
 // Lamps over the floor for the dark winter mornings: the boats are in by five and the bell goes at six.
 lamps:Object.freeze([22.9,25,27.1].map(x=>Object.freeze([x,(S.minZ+S.maxZ)/2]))),
 // White polystyrene boxes, packed and lidded for the buyers who take their lots away (fish.js: the izakaya; Mrs Sato,
 // who buys at the morning auction for Sato Ramen, cast.js), waiting in the landward east bay by the lane.
 packed:Object.freeze({x:28.32,stacks:Object.freeze([Object.freeze({z:-42.1,high:2,for:'the izakaya'}),Object.freeze({z:-41.55,high:1,for:'Sato Ramen'})])}),
});

/** The quay edge in front of the shed: tyres hung on ropes where no boat lies, and the spare line coiled by the bollard. */
export const QUAY_EDGE=Object.freeze({
 bollard:Object.freeze({x:39.5,z:Q.minZ+.35}),
 tyres:Object.freeze([38.2,39.65,41.1]),
 // Its rings are 0.2 m round and 0.022 thick; inland of the bollard, where the island's land runs east of it.
 coil:Object.freeze({x:40.05,z:-48.92,r:.22,y:GROUND_LAYER.lane}),
});

/** Who each piece is for and why it is there (CLAUDE.md, "Nothing is random"). */
export const FISH_MARKET_PIECES=Object.freeze([
 {id:'lots',who:'the buyers at the six o’clock auction',why:'The catch laid out a lot to a box on ice from the plant next door, so a buyer sees what each lot is; a slip in each box says whose catch it is.',where:'The floor’s grid between the columns.'},
 {id:'sorting-stack',who:'Kōji',why:'Empty boxes to sort the catch into by kind as it comes up.',where:'Behind the counter, beside where he stands to sort.'},
 {id:'scale',who:'Kōji and the boats',why:'Every lot is weighed before it is sold; the needle stands at nought on an empty platform.',where:'On the seaward side, where the boats unload, by the board.'},
 {id:'wash',who:'Kōji and the ice plant’s men',why:'The floor is hosed down by seven (the board) into the trench drain.',where:'The seaward west corner, by the drain.'},
 {id:'boots',who:'Kōji and the ice plant’s men',why:'White rubber boots for the wet floor, drained upside down.',where:'By the tap, where they are washed.'},
 {id:'bell',who:'the auctioneer',why:'The bell starts the auction at six.',where:'On the seaward column at the board’s end.'},
 {id:'lamps',who:'everybody on the floor before dawn',why:'The boats are in by five; in winter it is dark until after the bell.',where:'Hung from the ridge over the catch.'},
 {id:'packed',who:'the izakaya and Sato Ramen',why:'Lots bought to take away are packed on ice in lidded polystyrene boxes.',where:'In the landward east bay by the lane, out of the auction’s way.'},
 {id:'counter',who:'the town’s households',why:'The only place to buy one fish since Yonamine Fresh Fish closed; it sells what the buyers left, by the kilo at the board’s prices.',where:'The landward west bay, its front on the walk from the lawn gate.'},
 {id:'roof-water',who:'the floor and the walk beside it',why:'Gutters and downpipes take the rain off the roof to the drains instead of over the walk.',where:'Along both eaves, down the two columns at the lane end.'},
 {id:'tyres',who:'the boats that lie here',why:'Fenders on the quay face; each hangs on its rope from a ring in the kerb.',where:'Along the face east of the boats.'},
 {id:'coil',who:'the boats that lie here',why:'The spare mooring line, coiled by the bollard it is made fast to.',where:'Beside the bollard.'},
].map(Object.freeze));

const ICE=0xdfeef0,CHIP=[0xf3f8f8,0xcfe3e6],BOX=0x2f6fb8,BOX_LIP=0x3a7cc2,PAPER=0xf4f1e6,STEEL=0xb8c0c2,DARK=new THREE.Color(0x1c2a33),WHITE=new THREE.Color(0xffffff);
const OCTA=new THREE.OctahedronGeometry(1);
const TAIL=(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-1,0,-.5,-.62,0,0, 0,0,0,-.62,0,0,-1,0,.5],3));g.computeVertexNormals();return g;})();
const torus=new Map(),ring=(r,t)=>{const k=r+':'+t;if(!torus.has(k))torus.set(k,new THREE.TorusGeometry(r,t,5,14));return torus.get(k);};
const cone=new Map(),openCone=(top,bottom)=>{const k=top+':'+bottom;if(!cone.has(k))cone.set(k,new THREE.CylinderGeometry(top,bottom,1,14,1,true));return cone.get(k);};

/**
 * A fish lying on its side on ice, as a fishmonger lays it: head along local +x, back along +z, the upper flank to the
 * sky. A body, its darker back and paler belly, a forked tail, an eye. `x,y,z` is its middle on the ice's surface.
 */
export function drawFish(kit,x,y,z,id,{yaw=0,length}={}){
 const f=fishById(id),laid=LAID[id],L=length??laid.length,D=L*laid.depth,T=Math.max(.022,L*.1),base=new THREE.Color(f.colour);
 const back=base.clone().lerp(DARK,.35).getHex(),belly=base.clone().lerp(WHITE,.45).getHex();
 kit.at(x,z,yaw,()=>{
  kit.sphere(1,L*.1,0,0,f.colour,{sx:L*.4,sy:T/2,sz:D/2,finish:'gloss'});
  kit.sphere(1,L*.08,T*.22,D*.3,back,{sx:L*.34,sy:T*.32,sz:D*.18,detail:0,finish:'gloss'});
  kit.sphere(1,L*.1,T*.22,-D*.3,belly,{sx:L*.32,sy:T*.32,sz:D*.16,detail:0,finish:'gloss'});
  kit.add(TAIL,trs(-L*.28,0,0,0,0,0,L*.24,1,D*.9),back,'thin');
  kit.sphere(L*.04,L*.4,T*.38,D*.12,0xf4f1e6,{detail:0,finish:'gloss'});
  kit.sphere(L*.022,L*.405,T*.38+L*.025,D*.12,0x1c1f22,{detail:0,finish:'gloss'});
 },y+T/2+.002);
}

/**
 * Fish laid in a w×d bed of ice whose surface is at y: in rows across, heads to the left of whoever faces the bed's +z
 * side and bellies towards them (頭左・腹手前, how a Japanese fishmonger lays fish).
 */
function layFish(kit,id,count,x,y,z,w,d,seed){
 const r=rng(seed),L=LAID[id].length,cols=Math.max(1,Math.floor(w/(L+.04))),rows=Math.ceil(count/cols);
 for(let i=0;i<count;i++){
  const c=i%cols,row=Math.floor(i/cols),fx=x-w/2+w*(c+.5)/cols+(r.next()-.5)*.02,fz=z-d/2+d*(row+.5)/rows+(r.next()-.5)*.015;
  drawFish(kit,fx,y,fz,id,{yaw:Math.PI+(r.next()-.5)*.1});
 }
 for(let i=0;i<6;i++){
  const cx=x+(r.next()-.5)*(w-.06),cz=z+(r.next()-.5)*(d-.06);
  kit.add(OCTA,trs(cx,y+.006,cz,r.next()*3,r.next()*3,0,.028,.016,.024),CHIP[i%2],'gloss');
 }
}

/** A hollow co-op box on the floor at (x,z): its base, four walls under a lighter lip, a bed of ice and the lot's fish. */
export function fishBox(kit,lot,{y=F,seed=1}={}){
 const B=FISH_BOX,{x,z}=lot,inW=B.w-2*B.wall,inD=B.d-2*B.wall,wallH=B.h-B.base-B.lip;
 kit.box(B.w,B.base,B.d,x,y+B.base/2,z,BOX);
 for(const s of [-1,1]){
  kit.box(B.w,wallH,B.wall,x,y+B.base+wallH/2,z+s*(B.d-B.wall)/2,BOX);
  kit.box(B.wall,wallH,inD,x+s*(B.w-B.wall)/2,y+B.base+wallH/2,z,BOX);
  kit.box(B.w,B.lip,B.wall+.01,x,y+B.h-B.lip/2,z+s*(B.d-B.wall-.01)/2,BOX_LIP);
  kit.box(B.wall+.01,B.lip,inD-.02,x+s*(B.w-B.wall-.01)/2,y+B.h-B.lip/2,z,BOX_LIP);
 }
 const iceTop=y+B.base+B.ice;
 kit.box(inW-.004,B.ice,inD-.004,x,y+B.base+B.ice/2,z,ICE);
 layFish(kit,lot.fish,lot.count,x,iceTop,z,inW-.04,inD-.04,seed);
 // The lot's slip, tucked under the front lip on the ice: the boat and the kind, written at the quay.
 kit.box(.06,.09,.004,x-B.w/2+.12,iceTop+.04,z+(B.d-B.wall-.01)/2-(B.wall+.01)/2-.003,PAPER);
}

/** A dial face for a scale, painted: ticks round the circle, the needle at nought on an empty platform. */
function dialFace(capacity){
 return paint(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#f3eee0';ctx.beginPath();ctx.arc(w/2,h/2,124,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#354d59';ctx.fillStyle='#354d59';ctx.textAlign='center';ctx.textBaseline='middle';
  const step=capacity>10?1:.1,major=capacity>10?5:1;
  for(let v=0;v<capacity-1e-6;v+=step){
   const a=-Math.PI/2+v/capacity*Math.PI*2,big=Math.abs(v/major-Math.round(v/major))<1e-6;
   ctx.lineWidth=big?4:2;ctx.beginPath();ctx.moveTo(w/2+Math.cos(a)*(big?92:102),h/2+Math.sin(a)*(big?92:102));ctx.lineTo(w/2+Math.cos(a)*112,h/2+Math.sin(a)*112);ctx.stroke();
   if(big){ctx.font='bold 20px sans-serif';ctx.fillText(String(Math.round(v)),w/2+Math.cos(a)*74,h/2+Math.sin(a)*74);}
  }
  ctx.font='bold 22px sans-serif';ctx.fillText(capacity+' kg',w/2,h/2+42);
  ctx.strokeStyle='#a23a2a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(w/2,h/2+14);ctx.lineTo(w/2,h/2-104);ctx.stroke();
  ctx.fillStyle='#354d59';ctx.beginPath();ctx.arc(w/2,h/2,9,0,Math.PI*2);ctx.fill();
 });
}
function dial(group,kit,capacity,r,x,y,z,ry,name){
 const mesh=new THREE.Mesh(new THREE.CircleGeometry(r,28),new THREE.MeshStandardMaterial({map:dialFace(capacity),roughness:.6}));
 mesh.position.copy(kit.point(x,y,z));mesh.rotation.y=ry;mesh.name=name;group.add(mesh);return mesh;
}

/** The platform scale: a low steel platform, the column at its back and the dial on top, facing the floor. */
function platformScale(kit,group,solid){
 const s=SHED_KIT.scale;
 kit.at(s.x,s.z,s.ry,()=>{
  kit.box(s.w,.08,s.d,0,F+.04,0,0x5e6a70,{finish:'metal'});
  kit.box(s.w-.04,.025,s.d-.04,0,F+.0925,.01,STEEL,{finish:'metal'});
  kit.box(.07,.6,.07,0,F+.08+.3,-s.d/2+.05,0x5e6a70,{finish:'metal'});
  kit.cyl(.17,.17,.09,0,F+.84,-s.d/2+.05,0x2f6f8a,{segments:20,rx:Math.PI/2});
  dial(group,kit,s.capacity,.15,0,F+.84,-s.d/2+.05+.045+.004,s.ry,'auction scale dial');
  solid(kit.rect(-s.w/2-.02,s.w/2+.02,-s.d/2-.02,s.d/2+.02,1.1,'auction-scale'));
 });
}

/** The tap, the hose reel, the trench drain and the damp floor round it. */
function washCorner(kit,solid){
 const W=SHED_KIT.wash,D=SHED_KIT.drain,M=SHED_KIT.damp,galv=0x9aa3a6,[tx,tz]=W.tap,[rx,rz]=W.reel;
 kit.block(M.minX,M.maxX,F,F+.005,M.minZ,M.maxZ,0x4f7869);
 kit.box(D.maxX-D.minX,.008,D.width,(D.minX+D.maxX)/2,F+.009,D.z,0x3a3f42,{finish:'metal'});
 for(let x=D.minX+.1;x<D.maxX;x+=.25)kit.box(.02,.003,D.width-.02,x,F+.0145,D.z,0x2b2f30);
 kit.rod([tx,F,tz],[tx,.82,tz],.022,galv,{finish:'metal'});
 kit.box(.07,.05,.06,tx,.8,tz+.03,galv,{finish:'metal'});
 kit.rod([tx,.84,tz+.03],[tx+.06,.86,tz+.03],.01,0xc8102e);
 kit.at(rx,rz,0,()=>{
  kit.box(.34,.03,.3,0,F+.015,0,0x5e6a70,{finish:'metal'});
  for(const s of [-1,1]){kit.box(.02,.26,.06,s*.13,F+.16,0,0x5e6a70,{finish:'metal'});kit.cyl(.2,.2,.02,s*.115,F+.25,0,0xc8b04a,{segments:16,rz:Math.PI/2});}
  kit.cyl(.15,.15,.21,0,F+.25,0,0x3f7a4a,{segments:16,rz:Math.PI/2});
 });
 kit.wire([tx,.8,tz+.06],[rx-.1,F+.3,rz+.1],3.5,.018,0x3f7a4a);
 solid({id:'fish-market-wash',x:(W.minX+W.maxX)/2,z:(W.minZ+W.maxZ)/2,w:W.maxX-W.minX,d:W.maxZ-W.minZ,height:1});
}

/** The boot rack: two posts, a low rail with pegs, and three pairs of white boots upside down on them, toes to the floor. */
function bootRack(kit,solid){
 const b=SHED_KIT.boots,frame=0x5e6a70,boot=0xeeeeea;
 kit.at(b.x,b.z,0,()=>{
  for(const s of [-1,1])kit.rod([s*.4,F,0],[s*.4,F+.8,0],.02,frame,{finish:'metal'});
  kit.rod([-.4,F+.8,0],[.4,F+.8,0],.016,frame,{finish:'metal'});
  kit.rod([-.4,F+.34,0],[.4,F+.34,0],.016,frame,{finish:'metal'});
  const at=[-.31,-.18,-.06,.07,.19,.32];
  for(const x of at){
   kit.rod([x,F+.34,0],[x,F+.56,0],.012,frame,{finish:'metal'});
   kit.cyl(.055,.05,.3,x,F+.52,0,boot,{segments:10,finish:'gloss'});
   kit.box(.1,.07,.24,x,F+.705,.07,boot,{finish:'gloss'});
   kit.box(.1,.012,.24,x,F+.746,.07,0x9aa0a4);
  }
  solid(kit.rect(-b.w/2,b.w/2,-b.d/2+.04,b.d/2+.04,.9,'fish-market-boots'));
 });
}

/** The auction bell on its hook: a brass hand bell with a wooden handle. */
function bell(kit){
 const b=SHED_KIT.bell,col=S.maxX-.15-.11;
 kit.rod([col,b.y+.06,b.z],[b.x,b.y+.06,b.z],.01,0x3a3f42);
 kit.rod([b.x,b.y+.06,b.z],[b.x,b.y,b.z],.006,0x3a3f42);
 kit.rod([b.x,b.y,b.z],[b.x,b.y-.12,b.z],.012,0x8a6a4a);
 kit.cyl(.03,.055,.07,b.x,b.y-.155,b.z,0xc9a64a,{segments:14,finish:'metal'});
 kit.sphere(.012,b.x,b.y-.2,b.z,0x7a5a2a,{detail:0});
}

/** Enamel lamps hung from the ridge: a dark green shade, white inside, a bulb that lights at dusk. */
function lamps(kit){
 const ridge=S.height+.9;
 for(const [x,z] of SHED_KIT.lamps){
  kit.rod([x,ridge-.02,z],[x,3.42,z],.006,0x2b2b2b);
  kit.cyl(.03,.03,.06,x,3.4,z,0x2b2b2b,{segments:8});
  kit.add(openCone(.035,.2),trs(x,3.3,z,0,0,0,1,.14,1),0x2f5a4a,'matte');
  kit.add(openCone(.029,.19),trs(x,3.297,z,0,0,0,1,.13,1),0xf2efe4,'thin');
  kit.sphere(.045,x,3.27,z,0xfff0c8,{finish:'lamp'});
 }
}

/** Polystyrene boxes packed for the buyers: lidded, a paper slip on top for whose they are. */
function packedBoxes(kit,solid){
 const P=SHED_KIT.packed,h=.25,lid=.03;
 for(const s of P.stacks)for(let k=0;k<s.high;k++){
  const y=F+k*(h+lid);
  kit.box(.6,h,.4,P.x,y+h/2,s.z,0xf1efe8);
  kit.box(.6,lid,.4,P.x,y+h+lid/2,s.z,0xe6e3da);
  if(k===s.high-1)kit.box(.12,.004,.08,P.x+.1,y+h+lid+.002,s.z,0xf2df8a);
 }
 const zs=P.stacks.map(s=>s.z);
 solid({id:'packed-fish-boxes',x:P.x,z:(Math.min(...zs)+Math.max(...zs))/2,w:.64,d:Math.max(...zs)-Math.min(...zs)+.44,height:.62});
}

/** A price card on its stick: the fish's name in kana and its price a kilo, the way a fishmonger writes it. */
function priceCard(fish,kilo){
 return paint(128,96,(ctx,w,h)=>{
  ctx.fillStyle='#f6f2e6';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#a23a2a';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 26px sans-serif';ctx.fillText(fish.kana,w/2,30);
  ctx.fillStyle='#23313a';ctx.font='bold 22px sans-serif';ctx.fillText('1kg ¥'+kilo.toLocaleString('en-GB'),w/2,68);
 });
}

/**
 * The sale counter: a cabinet in the co-op's blue under a steel top; on it a sink with a gooseneck tap, an ice tray
 * divided for the two fish it sells, and a small dial scale facing the customer. Built into the quarter's kit; what is
 * only out while it is open (the fish and the price cards) is returned in its own group.
 */
function saleCounter(kit,group,solid){
 const C=FISH_COUNTER,top=F+C.top,tray={minX:-.52,maxX:.74,divide:.16,d:.5,wall:.02,h:.07};
 kit.at(C.x,C.z,0,()=>{
  kit.box(C.w,C.top-.04,C.d-.02,0,F+(C.top-.04)/2,-.01,0x2f6f8a);
  kit.box(C.w-.04,.05,.005,0,F+.62,C.d/2-.0175,0xeef3f1);
  kit.box(C.w+.04,.04,C.d+.02,0,top-.02,0,STEEL,{finish:'metal'});
  // The sink, at the west end: a steel tub with its gooseneck tap, for gutting and rinsing what a customer buys.
  const sx=-.83;
  kit.box(.5,.02,.42,sx,top+.01,0,STEEL,{finish:'metal'});
  for(const s of [-1,1]){kit.box(.5,.14,.02,sx,top+.09,s*.2,STEEL,{finish:'metal'});kit.box(.02,.14,.38,sx+s*.24,top+.09,0,STEEL,{finish:'metal'});}
  kit.rod([sx,top+.16,-.19],[sx,top+.36,-.19],.012,STEEL,{finish:'metal'});
  kit.rod([sx,top+.36,-.19],[sx,top+.38,-.1],.012,STEEL,{finish:'metal'});
  kit.rod([sx,top+.38,-.1],[sx,top+.3,-.04],.012,STEEL,{finish:'metal'});
  // The steel bar the raked tray's back rests on (the tray itself is below).
  const back=tray.d-.015;
  kit.box(tray.maxX-tray.minX,back*Math.sin(C.rake),.03,(tray.minX+tray.maxX)/2,top+back*Math.sin(C.rake)/2,tray.d/2-back*Math.cos(C.rake),STEEL,{finish:'metal'});
  // The little scale for one fish, its dial to the customer.
  kit.box(.24,.06,.24,.95,top+.03,-.02,0xeef3f1);
  kit.cyl(.12,.11,.015,.95,top+.068,.03,STEEL,{segments:16,finish:'metal'});
  kit.box(.04,.08,.04,.95,top+.1,-.12,0xeef3f1);
  kit.cyl(.09,.09,.05,.95,top+.21,-.12,0xeef3f1,{segments:18,rx:Math.PI/2});
  dial(group,kit,5,.08,.95,top+.21,-.12+.025+.004,0,'fish counter scale dial');
  solid(kit.rect(-C.w/2-.02,C.w/2+.02,-C.d/2,C.d/2,1.1,'fish-counter'));
 });
 // Its board on the front column beside it, where the walk from the lawn gate meets the shed: what it sells and when.
 const col=[S.minX+.15,S.maxZ-.15];
 kit.sign(poster({title:'鮮魚直売',lines:[...C.sells.map(s=>`${fishById(s.fish).name[0].toUpperCase()+fishById(s.fish).name.slice(1)} 1 kg ¥${s.kilo.toLocaleString('en-GB')}`),'Open 07:00–09:00'],bg:'#eef3f1',band:'#2f6f8a'}),
  .4,.56,col[0],1.75,col[1]+.11+.015,{depth:.03,name:'fish counter board'});
 // The ice tray, in two halves, raked towards the customer as a fishmonger's is, so the fish show their sides: it pivots
 // on its front edge, on the counter top, and its back rests on the bar. Built in the pivot's frame (z from the front).
 const pivot=new THREE.Group();pivot.name='Fish counter ice tray';pivot.position.set(C.x,top,C.z+tray.d/2);pivot.rotation.x=C.rake;group.add(pivot);
 const t=createKit(),tx=(tray.minX+tray.maxX)/2,tw=tray.maxX-tray.minX,mid=-tray.d/2,wallH=tray.h-tray.wall,wallY=tray.wall+wallH/2;
 t.box(tw,tray.wall,tray.d,tx,tray.wall/2,mid,STEEL,{finish:'metal'});
 for(const s of [-1,1]){t.box(tw,wallH,tray.wall,tx,wallY,mid+s*(tray.d-tray.wall)/2,STEEL,{finish:'metal'});t.box(tray.wall,wallH,tray.d-2*tray.wall,tx+s*(tw-tray.wall)/2,wallY,mid,STEEL,{finish:'metal'});}
 t.box(tw-2*tray.wall-.004,.05,tray.d-2*tray.wall-.004,tx,tray.wall+.025,mid,ICE);
 t.box(.012,.06,tray.d-2*tray.wall,tray.divide,tray.wall+.05,mid,STEEL,{finish:'metal'});
 t.finish(pivot,'Fish counter ice tray');
 // What is out only while the counter is open: the fish on the ice and their price cards.
 const wares=new THREE.Group();wares.name='Fish counter wares';
 const w=createKit(),iceTop=tray.wall+.05,halves=[[tray.minX+.03,tray.divide-.03],[tray.divide+.03,tray.maxX-.03]];
 C.sells.forEach((s,i)=>{
  const [a,b]=halves[i],fish=fishById(s.fish);
  layFish(w,s.fish,s.count,(a+b)/2,iceTop,mid,b-a-.02,tray.d-2*tray.wall-.06,40+i);
  // On a stick in the ice against the tray's back wall, behind the fish.
  const cx=b-.09,cz=-tray.d+tray.wall+.005;
  w.rod([cx,iceTop-.02,cz],[cx,iceTop+.2,cz],.004,0x8a6a4a);
  w.sign(priceCard(fish,s.kilo),.15,.1,cx,iceTop+.2,cz+.007,{depth:.004,edge:0xe6e1d2,name:`price card: ${fish.name}`});
 });
 w.finish(wares,'Fish counter wares');pivot.add(wares);
 return wares;
}

/**
 * Ribs down both slopes of the shed's corrugated roof, a ridge cap, gutters along both eaves and the downpipes that take
 * them down the two columns at the lane end. (The ribs used to be level bars across the roof, standing clear of it at the
 * eaves and buried in it at the ridge.)
 */
function roofWater(kit){
 const zc=(S.minZ+S.maxZ)/2,rise=.9,D=(S.maxZ-S.minZ)/2+.7,a=Math.atan2(rise,D),run=Math.hypot(rise,D),lift=.018,ridge=S.height+rise;
 for(let x=S.minX-.6;x<S.maxX+.7;x+=.45)for(const s of [-1,1]){
  kit.box(.04,.03,run,x,S.height+rise/2+Math.cos(a)*lift,zc+s*(D/2+Math.sin(a)*lift),0x6c8088,{rx:s*a});
 }
 kit.box(S.maxX-S.minX+1.4,.05,.2,(S.minX+S.maxX)/2,ridge+.045,zc,0x6c8088);
 // The downpipes run down the end columns' lane faces (a column is 0.22 m square, 0.15 m in from the shed's edge).
 const galv=0x9aa3a6,pipeX=S.maxX-.15+.11+.04,ends=[[zc+D+.03,S.maxZ-.15],[zc-D-.03,S.minZ+.15]];
 for(const [gz,cz] of ends){
  kit.box(S.maxX-S.minX+1.4,.08,.1,(S.minX+S.maxX)/2,S.height-.05,gz,galv,{finish:'metal'});
  kit.rod([S.maxX+.4,S.height-.09,gz],[pipeX,S.height-.5,cz],.04,galv,{finish:'metal'});
  kit.rod([pipeX,S.height-.5,cz],[pipeX,.3,cz],.04,galv,{finish:'metal'});
  kit.rod([pipeX,.3,cz],[pipeX+.15,.12,cz],.04,galv,{finish:'metal'});
 }
}

/** Tyres hung on the quay face on their ropes, and the spare line coiled by the bollard and made fast round it. */
function quayEdge(kit,solid){
 const E=QUAY_EDGE,face=Q.minZ-.45,kerb=Q.minZ-.25,rope=0xc6b791;
 for(const x of E.tyres){
  kit.add(ring(.22,.09),trs(x,-.33,face-.09),0x1f2124);
  kit.box(.12,.05,.12,x,.205,kerb,0x2b2f30);
  kit.rod([x,.235,kerb],[x,.215,face-.02],.018,rope);
  kit.rod([x,.215,face-.02],[x,-.04,face-.09],.018,rope);
 }
 const c=E.coil;
 // On the quay's paving, which is the lane layer (quarters.js AUCTION_VENDING stands on it too).
 const paving=c.y;
 [.2,.18,.2,.17].forEach((r,k)=>kit.add(ring(r,.022),trs(c.x,paving+.022+k*.04,c.z,Math.PI/2,0,0),rope));
 kit.add(ring(.19,.022),trs(E.bollard.x,.38,E.bollard.z,Math.PI/2,0,0),rope);
 kit.rod([c.x-.17,paving+.16,c.z],[E.bollard.x+.18,.38,E.bollard.z],.022,rope);
 solid({id:'rope-coil',x:c.x,z:c.z,w:c.r*2+.04,d:c.r*2+.04,height:.2});
}

/**
 * Builds it all into the quarter's kit (and the dials and the counter's wares into `group`). Returns the wares, so the
 * quarter can put them out while the counter is open.
 */
export function buildFishMarket(kit,solid,group){
 AUCTION_LOTS.forEach((lot,i)=>fishBox(kit,lot,{seed:100+i}));
 for(const c of catchColliders())solid(c);
 platformScale(kit,group,solid);
 washCorner(kit,solid);
 bootRack(kit,solid);
 bell(kit);
 lamps(kit);
 packedBoxes(kit,solid);
 roofWater(kit);
 quayEdge(kit,solid);
 return {wares:saleCounter(kit,group,solid)};
}
