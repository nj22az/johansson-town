import * as THREE from '../../vendor/three.module.js';
import {HOUSE_FLOORS,HOUSE_SITE,HOUSE_WALLS,HOUSE_SLABS,HOUSE_OPENINGS,HOUSE_ROOF,HOUSE_EQUIPMENT,HOUSE_GUARDS} from './johansson-house.js';
import {JOHANSSON_HOUSE_CAD as CAD} from './johansson-house-cad.js';
import {OKINAWA_COLOURS,shisa} from './okinawa/houses.js';

/**
 * Johansson's house built with the Okinawan kit (okinawa/kit.js), from the house's data (johansson-house.js, the
 * creator's Final Rev F): the outside, as it stands in Kitano hamlet. The kit's current frame is the house's: centred on
 * its plan, the front (the drawings' south face, with the genkan's door) looking along +z, y up from the yard, which is
 * level with the ground floor (Rev F). The drawings' frame is x east and y north from the south-west corner, z up from
 * the ground floor, so a drawn point (x, y, z) is local (x − 6, z, 5 − y).
 *
 * The concrete walls are the drawn walls, cut where the drawings cut them; the windows are aluminium sliding sashes
 * (引き違い) with glass that shows a room behind it, as every window in the town does; the roof is the drawn hipped roof
 * of red tile, as the drawings' mesh, its hips and ridge pointed in lime the Okinawan way.
 */
const C=OKINAWA_COLOURS;
export const HOUSE_COLOURS=Object.freeze({
 wall:0xf0e8d6,band:0xdcd4c3,sash:0xc3c8c9,glass:C.glass,door:0x5a3f2c,steel:0x6f777a,
 stone:0xcfc6b0,soffit:0xe6ddc9,tile:C.roof,lime:C.lime,unit:0xe9e9e4,
});
const K=HOUSE_COLOURS;
/** A drawn point to the kit's frame. */
export const houseLocal=(x,y,z)=>[x-6,z-HOUSE_SITE.grade,5-y];

/** A box between two drawn corners. */
function drawnBlock(kit,min,max,hex,finish='matte'){
 const [x0,y0,z0]=houseLocal(min[0],max[1],min[2]),[x1,y1,z1]=houseLocal(max[0],min[1],max[2]);
 kit.block(x0,x1,y0,y1,z0,z1,hex,finish);
}

/**
 * The outside of the house. `solid(rect)` takes the kit's colliders; returns nothing else. Built inside the house's
 * frame (see above).
 */
export function buildHouseExterior(kit,solid){
 // The walls above the yard: every outside wall, sill and head of the ground and upper floors, as drawn.
 for(const w of HOUSE_WALLS.filter(w=>w.level!=='B1'&&/-EXT-/.test(w.id)))drawnBlock(kit,w.min,w.max,K.wall);
 // The slabs' edges between the storeys and under the roof: a band round the house.
 for(const b of HOUSE_SLABS.filter(q=>q.level==='L1'||q.kind==='deck')){
  const z0=b.min[2],z1=b.max[2];
  for(const [a,c] of [[[0,0],[12,.2]],[[0,9.8],[12,10]],[[0,.2],[.2,9.8]],[[11.8,.2],[12,9.8]]]){
   const lo=[Math.max(a[0],b.min[0]),Math.max(a[1],b.min[1]),z0],hi=[Math.min(c[0],b.max[0]),Math.min(c[1],b.max[1]),z1];
   if(hi[0]-lo[0]>1e-6&&hi[1]-lo[1]>1e-6)drawnBlock(kit,lo,hi,K.band);
  }
 }
 for(const o of HOUSE_OPENINGS.filter(o=>o.level!=='B1'))opening(kit,o);
 roof(kit);
 frontDoor(kit);
 outdoorUnits(kit,solid);
 court(kit,solid);
 lightwell(kit,solid);
 // The house is one solid to walk round, from the court's floor to the ridge.
 drawnSolid(kit,solid,[0,0,HOUSE_SITE.court.floor-.2],[12,10,HOUSE_ROOF.ridge],'johansson-house');
}

/** A collider over a drawn box (its height from the drawn z, below the yard too). */
function drawnSolid(kit,solid,min,max,id){
 const [x0,,z0]=houseLocal(min[0],max[1],0),[x1,,z1]=houseLocal(max[0],min[1],0),c=kit.rect(x0,x1,z0,z1,max[2]-min[2],id);
 c.minY=(c.minY??0)+min[2]-HOUSE_SITE.grade;solid(c);
}
const site=id=>HOUSE_SITE.boxes.find(b=>b.id===id);
const guard=id=>HOUSE_GUARDS.find(g=>g.id===id);
/** The B1 outside wall the drawings cut where a pit meets the house, and the ground floor slab's edge over it. */
function basementFace(kit,x0,x1,y0,y1){
 for(const w of HOUSE_WALLS.filter(q=>q.level==='B1'&&/-EXT-/.test(q.id)&&q.max[0]>x0&&q.min[0]<x1&&q.max[1]>y0&&q.min[1]<y1))
  drawnBlock(kit,[Math.max(w.min[0],x0),Math.max(w.min[1],y0),w.min[2]],[Math.min(w.max[0],x1),Math.min(w.max[1],y1),w.max[2]],K.wall);
 drawnBlock(kit,[x0,y0,HOUSE_FLOORS.B1.soffit],[x1,y1,HOUSE_FLOORS.G0.floor],K.band);
}

/**
 * The court outside the basement's door (D-BEXT), as drawn: its floor 2.8 m under the yard, the retaining walls either
 * side with their 1.1 m parapets over the yard, the storm sump's grating, and the garden stair up to the yard's top
 * landing, 16 risers of 175 mm on 250 mm goings, 1 000 mm clear. The flight is cast on fill between the walls; its
 * 1 000 mm walking width is kept by a cheek upstand either side over the 200 mm the drawings leave between it and the
 * walls.
 */
function court(kit,solid){
 const C=HOUSE_SITE.court,X=HOUSE_SITE.gardenStair,floor=C.floor,cut=-3;
 for(const id of ['COURT-RETAIN-W','COURT-RETAIN-E']){
  const w=site(id),g=guard(id==='COURT-RETAIN-W'?'EXT-GUARD-W':'EXT-GUARD-E');
  drawnBlock(kit,w.min,w.max,K.wall);drawnBlock(kit,g.min,g.max,K.wall);
  // The parapet's coping.
  drawnBlock(kit,[g.min[0]-.02,g.min[1],g.max[2]],[g.max[0]+.02,g.max[1],g.max[2]+.04],K.band);
  drawnSolid(kit,solid,[Math.min(w.min[0],g.min[0]),w.min[1],w.min[2]],[Math.max(w.max[0],g.max[0]),w.max[1],g.max[2]],'johansson-court-wall');
 }
 const f=site('COURT-FLOOR');drawnBlock(kit,f.min,[f.max[0],f.max[1],f.max[2]-.01],K.stone);
 drawnBlock(kit,[f.min[0],f.min[1],f.max[2]-.01],[f.max[0],f.max[1],f.max[2]],0xb9b2a0);
 // The storm sump's grating over its pit, where the court drains.
 const [sx0,sy0,sx1,sy1]=[9.45,-1.05,9.95,-.55];
 drawnBlock(kit,[sx0,sy0,floor],[sx1,sy1,floor+.012],K.steel,'metal');
 for(let x=sx0+.05;x<sx1-.02;x+=.06)drawnBlock(kit,[x,sy0+.02,floor+.012],[x+.012,sy1-.02,floor+.016],0x4a4f52,'metal');
 // The flight: each step cast down to the fill, the full width between the walls; the cheeks over the 200 mm each side.
 const [wx0,wx1]=[site('COURT-RETAIN-W').max[0],site('COURT-RETAIN-E').min[0]];
 for(const t of X.treads){
  drawnBlock(kit,[wx0,t.min[1],cut],[wx1,t.max[1],t.max[2]-.03],K.stone);
  drawnBlock(kit,[t.min[0],t.min[1],t.max[2]-.03],[t.max[0],t.max[1],t.max[2]],0xd9d1bf);
  for(const [a,b] of [[wx0,t.min[0]],[t.max[0],wx1]])drawnBlock(kit,[a,t.min[1],t.max[2]-.03],[b,t.max[1],t.max[2]+.15],K.band);
 }
 // The cheeks as colliders, beside the flight from its foot to the yard.
 const [ty0,ty1]=[Math.min(...X.treads.map(t=>t.min[1])),Math.max(...X.treads.map(t=>t.max[1]))],[tx0,tx1]=[Math.min(...X.treads.map(t=>t.min[0])),Math.max(...X.treads.map(t=>t.max[0]))];
 drawnSolid(kit,solid,[wx0,ty0,cut],[tx0,ty1,.15],'johansson-court-cheek');drawnSolid(kit,solid,[tx1,ty0,cut],[wx1,ty1,.15],'johansson-court-cheek');
 // The top landing, paved, level with the yard.
 const top=site('EXT-STAIR-TOP');drawnBlock(kit,[top.min[0],top.min[1],top.max[2]],[top.max[0],top.max[1],top.max[2]+.01],0xd9d1bf);
 // The house's wall over the court, with D-BEXT: a steel door, shut, in its frame, and a light over it.
 basementFace(kit,wx0,wx1,0,.2);
 const o=HOUSE_OPENINGS.find(q=>q.id==='D-BEXT');
 drawnBlock(kit,[o.from,.05,o.sill],[o.to,.1,o.head],K.steel,'metal');
 for(const e of [o.from,o.to-.06])drawnBlock(kit,[e,-.02,o.sill],[e+.06,.05,o.head],K.steel);
 drawnBlock(kit,[o.from,-.02,o.head-.06],[o.to,.05,o.head],K.steel);
 const [hx,hy,hz]=houseLocal(o.to-.18,.02,o.sill+1);kit.box(.12,.03,.05,hx,hy,hz,0xc9cdd0,{finish:'metal'});
 const [lx,ly,lz]=houseLocal((o.from+o.to)/2,-.08,o.head+.3);kit.box(.2,.14,.12,lx,ly,lz,0xf3e7c4,{finish:'lamp'});
}

/**
 * The lightwell outside the club's window (W-B1), as drawn: three walls and a drained floor 1.8 m under the yard, guards
 * 1.1 m round it, open to the sky so the window has the day.
 */
function lightwell(kit,solid){
 const W=HOUSE_SITE.lightwell;
 for(const w of W.walls)drawnBlock(kit,w.min,w.max,K.wall);
 const base=site('LIGHTWELL-BASE');drawnBlock(kit,base.min,base.max,K.stone);
 const [dx,dy]=[-.6,6.4];drawnBlock(kit,[dx-.12,dy-.12,base.max[2]],[dx+.12,dy+.12,base.max[2]+.012],K.steel,'metal');
 for(const id of ['LIGHTWELL-GUARD-W','LIGHTWELL-GUARD-S','LIGHTWELL-GUARD-N']){
  const g=guard(id);drawnBlock(kit,g.min,g.max,K.wall);drawnBlock(kit,[g.min[0]-.02,g.min[1]-.02,g.max[2]],[g.max[0]+.02,g.max[1]+.02,g.max[2]+.04],K.band);
 }
 drawnSolid(kit,solid,[Math.min(...W.walls.map(w=>w.min[0]))-.05,Math.min(...W.walls.map(w=>w.min[1]))-.05,base.min[2]],[0,Math.max(...W.walls.map(w=>w.max[1]))+.05,1.1],'johansson-lightwell');
 // The house's wall over the well, with W-B1's sashes from outside.
 basementFace(kit,0,.2,W.y[0],W.y[1]);
 const o=HOUSE_OPENINGS.find(q=>q.id==='W-B1');opening(kit,o);
}

/** A window's sashes and glass, or a door's leaf, set in a drawn opening. */
function opening(kit,o){
 const out=o.side==='south'?[0,-1]:o.side==='north'?[0,1]:o.side==='west'?[-1,0]:[1,0];
 const alongX=o.side==='south'||o.side==='north',face=o.face;
 // The frame stands 70 mm in from the outside face.
 const inset=.07*(o.side==='south'||o.side==='west'?1:-1),plane=face+inset;
 const at=(s,z,depth,w,h,hex,finish)=>{
  const mid=[alongX?s:plane,alongX?plane:s];
  const [lx,ly,lz]=houseLocal(mid[0],mid[1],z);
  kit.box(alongX?w:depth,h,alongX?depth:w,lx,ly,lz,hex,{finish});
 };
 const w=o.to-o.from,h=o.head-o.sill,mid=(o.from+o.to)/2,zm=(o.sill+o.head)/2;
 if(o.type==='window'){
  // Outer frame, two sliding sashes meeting at the middle, the glass behind their rails, and a sill flashing.
  for(const s of [o.from+.025,o.to-.025])at(s,zm,.07,.05,h,K.sash);
  for(const z of [o.sill+.025,o.head-.025])at(mid,z,.07,w,.05,K.sash);
  at(mid,zm,.02,w-.08,h-.08,K.glass,'window');
  at(mid,zm,.08,.05,h-.08,K.sash);
  for(const z of [o.sill+.06,o.head-.06])at(mid,z,.08,w-.08,.035,K.sash);
  const [lx,ly,lz]=houseLocal(alongX?mid:face+out[0]*.03,alongX?face+out[1]*.03:mid,o.sill-.015);
  kit.box(alongX?w+.06:.1,.03,alongX?.1:w+.06,lx,ly,lz,K.sash);
  return;
 }
 if(o.id==='D-TERRACE'){
  // The terrace door: an aluminium-framed glazed door, a kick panel at its foot.
  for(const s of [o.from+.03,o.to-.03])at(s,zm,.07,.06,h,K.sash);
  at(mid,o.head-.03,.07,w,.06,K.sash);
  at(mid,o.sill+.25,.05,w-.12,.5,K.sash);
  at(mid,(o.sill+.5+o.head-.06)/2,.02,w-.12,o.head-.06-(o.sill+.5),K.glass,'window');
  return;
 }
 // D-ENTRY's leaf is frontDoor's.
}

/** The front door: a timber leaf in a frame, with the letter slot that feeds the box inside and a lever handle. */
function frontDoor(kit){
 const o=HOUSE_OPENINGS.find(o=>o.id==='D-ENTRY'),sill=o.sill,mid=(o.from+o.to)/2,w=o.to-o.from,h=o.head-sill,face=.07;
 const at=(x,z,wd,ht,d,hex,finish)=>{const [lx,ly,lz]=houseLocal(x,face,z);kit.box(wd,ht,d,lx,ly,lz,hex,{finish});};
 for(const x of [o.from+.03,o.to-.03])at(x,sill+h/2,.06,h,.09,K.door);
 at(mid,o.head-.03,w,.06,.09,K.door);
 at(mid,sill+(h-.06)/2,w-.1,h-.06,.05,K.door,'gloss');
 // Two raised panels, the letter slot between them (its flap brass), the lever and the lock.
 for(const z of [sill+.55,sill+1.55])at(mid,z,w-.32,.62,.065,0x6a4c36);
 at(mid,sill+1.05,.3,.05,.07,0xb8913f,'metal');
 const hx=o.to-.16;at(hx,sill+1.0,.04,.04,.12,0xc9cdd0,'metal');at(hx-.06,sill+1.0,.14,.025,.03,0xc9cdd0,'metal');at(hx,sill+1.12,.035,.06,.08,0xc9cdd0,'metal');
 // The threshold stone, level with the yard and the genkan, and a light beside the door.
 drawnBlock(kit,[o.from-.05,-.35,sill-.1],[o.to+.05,0,sill+.005],K.stone);
 const [lx,ly,lz]=houseLocal(o.from-.35,-.08,1.95);
 kit.box(.14,.2,.12,lx,ly,lz,0xf3e7c4,{finish:'lamp'});kit.box(.17,.04,.15,lx,ly+.12,lz,0x3a3632);
}

/**
 * The roof as drawn: the hipped shell of red tile (the drawings' mesh, eaves +5 800, ridge +8 000, overhang 400, its
 * underside +5 680), the hips and the ridge pointed in lime, the two sleeves' weather collars (the vent and the flue
 * that go through them are the services', not built yet: RF5) capped, and a shisa on the ridge looking down the path.
 */
function roof(kit){
 // The tiles over the top and the eaves' edges; the soffit under the overhang, plastered.
 const R=HOUSE_ROOF,tiles=[],soffit=[];
 for(const [a,b,c] of R.triangles){
  const [A,B,Cc]=[a,b,c].map(i=>R.vertices[i]),u=[B[0]-A[0],B[1]-A[1]],w=[Cc[0]-A[0],Cc[1]-A[1]];
  (u[0]*w[1]-u[1]*w[0]<0?soffit:tiles).push(...[A,B,Cc].flatMap(p=>houseLocal(...p)));
 }
 for(const [list,hex,finish] of [[tiles,K.tile,'tile'],[soffit,K.soffit,'matte']]){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(list,3));g.computeVertexNormals();
  kit.add(g,new THREE.Matrix4(),hex,finish);g.dispose();
 }
 // Lime pointing along the hips and the ridge.
 const [bx0,by0,bx1,by1]=R.bounds,[[rx0,ry0],[rx1,ry1]]=R.ridgeLine,e=R.eaves+.03,top=R.ridge+.04;
 const P=(x,y,z)=>houseLocal(x,y,z);
 kit.rod(P(rx0,ry0,top),P(rx1,ry1,top),.1,K.lime,{segments:6});
 for(const [x,y,r] of [[bx0,by0,0],[bx0,by1,0],[bx1,by0,1],[bx1,by1,1]])kit.rod(P(x,y,e),P(r?rx1:rx0,r?ry1:ry0,top),.07,K.lime,{segments:5});
 // The collars round the sleeves, as drawn, and a lead cap on each until its pipe goes through.
 for(const b of CAD.roofBoots)drawnBlock(kit,b.min,b.max,0x59615a);
 for(const [x0,y0,x1,y1] of R.sleeves){const z=Math.max(...CAD.roofBoots.filter(b=>b.min[0]>=x0-.04&&b.max[0]<=x1+.04&&b.min[1]>=y0-.04&&b.max[1]<=y1+.04).map(b=>b.max[2]));drawnBlock(kit,[x0-.03,y0-.03,z],[x1+.03,y1+.03,z+.02],0x59615a,'metal');}
 const [sx,sy,sz]=P((rx0+rx1)/2,ry0-.2,top+.04);
 shisa(kit,sx,sy,sz,0,1.3);
}

/**
 * The outdoor units of the two cooling zones (HVAC-EQ-OUTDOOR_UNITS, beside the east wall), on a galvanised stand,
 * one over the other: Johansson Reiki's, their plates on the side.
 */
function outdoorUnits(kit,solid){
 const e=HOUSE_EQUIPMENT.find(q=>q.id==='HVAC-EQ-OUTDOOR_UNITS'),[x0,y0]=e.min,[x1,y1]=e.max,cx=(x0+x1)/2,cy=(y0+y1)/2;
 const L=.8,D=.3;
 for(const [z0,z1] of [[.15,.7],[.76,1.31]]){
  drawnBlock(kit,[cx-D/2,cy-L/2,z0],[cx+D/2,cy+L/2,z1],K.unit);
  // The fan's grille on the face away from the wall, and the maker's plate.
  const [gx,gy,gz]=houseLocal(cx+D/2+.005,cy-.08,(z0+z1)/2);kit.cyl(.21,.21,.01,gx,gy,gz,0x4a4f52,{rz:Math.PI/2,segments:16});
  drawnBlock(kit,[cx+D/2,cy+.25,z1-.12],[cx+D/2+.004,cy+.36,z1-.06],0xb8bcbf,'metal');
 }
 for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]])drawnBlock(kit,[cx+dx*D/2-.02,cy+dy*(L/2-.05)-.02,0],[cx+dx*D/2+.02,cy+dy*(L/2-.05)+.02,1.33],K.steel,'metal');
 const [a0,,c0]=houseLocal(cx-D/2-.05,cy+L/2+.05,0),[a1,,c1]=houseLocal(cx+D/2+.05,cy-L/2-.05,0);
 solid(kit.rect(a0,a1,c0,c1,1.35,'johansson-house-outdoor-units'));
}
