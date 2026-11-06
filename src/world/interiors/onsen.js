import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {benchSeat} from '../seat-slots.js';
import {buildAvatar} from '../../avatars/build.js';
import {createAvatarAnimator} from '../../avatars/animate.js';
import {recipeFor} from '../../avatars/cast.js';
import {daylight} from '../../render/dusk.js';
import {townCalendarAt} from '../../town-clock.js';
import {buildOnsenLobby,hinokiTexture,LOBBY,ONSEN_DOORWAYS} from './onsen-lobby.js';
import {buildWashArea,WASH_SEATS} from './onsen-wash.js';
import {buildOnsenElectrics,isPowered,isWorking,isLive,CHAIR_TIMER} from './onsen-electrics.js';
import {ONSEN_CHAIR,CHAIR} from './onsen-chair.js';
import {placeAsset} from '../../catalog/catalog.js';
import {buildOnsenTowels} from './onsen-towels.js';
import {ONSEN_SIGNS} from './onsen-signs.js';
import {buildOnsenFront,GENKAN_STEP} from './onsen-front.js';
import {buildOnsenProps} from './onsen-props.js';
import {buildOnsenNight,seaViewGeometry} from './onsen-night.js';
import {rockGeometry} from './onsen-rocks.js';
import {buildOnsenSteam} from './onsen-steam.js';

/**
 * Inside Umi-no-yu: past the bandai to two noren, the women's (女湯, crimson, west) and the
 * men's (男湯, indigo, east), each into its own changing room either side of a plaster
 * partition; through each side's own bath door to the washing places and the tiled indoor
 * bath, and out through the glass to the rock bath under the sky, with a bamboo fence kept
 * low on the sea side.
 *
 * Like every town bath of the period it is two baths in one building (ONSEN_DOORWAYS). The
 * washing room and the rock bath beyond the bath doors are, for now, shared the way a 1990s
 * health land shares its swimwear zone (水着ゾーン): bathers in swimsuits, trunks or a bath
 * wrap (湯あみ着・水着着用), families together. Splitting the washing room with a 2 m tiled
 * partition is the next batch. The board (behind the bandai), lamps and dryers are in
 * onsen-electrics.js; towels in onsen-towels.js. The pools are sunk below the floor: you walk
 * round them and get in by the seats.
 *
 * The front of the house (genkan, bandai, lobby, noren) is dressed in onsen-lobby.js; the street
 * doors, the shoes at the step and the umbrella stand are in onsen-front.js; the small things with a story
 * (the straw jar, the uchiwa rack, Miss Higa's rubber plant and her account book) in onsen-props.js.
 *
 * Room frame: the street door is at +z, the sea at -z. Metres, floor at y = 0.
 */
export const ONSEN_ROOM=Object.freeze({
 bounds:{minX:-4.85,maxX:4.85,minZ:-8.8,maxZ:4.85},
 spawn:[0,0,4.2],yaw:0,exit:[0,1.1,4.7],
 walls:{minX:-5,maxX:5,minZ:-9,maxZ:5,height:2.8},
 hall:{front:1.6,changing:-1.2,bath:-4.4},
 tub:{minX:1.1,maxX:4.85,minZ:-4.2,maxZ:-2.1,rim:.45,water:.4,floor:-.32},
 pool:{x:0,z:-6.7,rx:2.55,rz:1.45,water:.08,floor:-.46,rim:.34}
});
const R=ONSEN_ROOM;

/**
 * The walls and ceilings by name, as the room builds them (each wall mesh has userData.wall, each ceiling group
 * userData.ceiling): a film lifts one at a time (capture-room.mjs HIDE) for a camera that stands in a wall's line or looks
 * down into a room. `faces` is what the wall stands between; the ceilings are groups, the boards and their beams inside.
 */
export const ONSEN_WALLS=Object.freeze([
 ['Street wall west','the genkan and the street, west of the door'],['Street wall east','the genkan and the street, east of the door'],['Street door lintel','over the street door'],
 ['Lobby wall west','the lobby and the bandai (the board hangs on it)'],['Lobby wall east','the lobby and the milk cooler'],
 ['Women’s room wall west','the women’s changing room (the lockers)'],['Men’s room wall east','the men’s changing room (the baskets)'],
 ['Noren wall west','the lobby and the women’s changing room, west of the crimson noren'],['Noren wall east','the lobby and the men’s changing room, east of the indigo noren'],
 ['Noren wall lintel','over both noren'],['Noren wall stub','between the two noren (the clock)'],['Partition','the women’s and the men’s changing rooms'],
 ['Bath door wall west','the women’s changing room and the bath hall'],['Bath door wall east','the men’s changing room and the bath hall'],['Bath door lintel','over the two bath doors'],
 ['Bath hall wall west','the bath hall, west'],['Bath hall wall east','the bath hall, east'],
 ['Sea glass sill west','under the glass to the rock bath, west'],['Sea glass sill east','under the glass to the rock bath, east'],['Sea glass head','over the glass to the rock bath'],
].map(([name,faces])=>Object.freeze({name,faces})));
export const ONSEN_CEILINGS=Object.freeze([
 {name:'Lobby ceiling',x0:-5,x1:5,z0:R.hall.front,z1:5,beams:[[3.8,'Lobby ceiling beam street'],[2.1,'Lobby ceiling beam bandai']]},
 {name:'Women’s room ceiling',x0:-5,x1:0,z0:R.hall.changing,z1:R.hall.front,beams:[[.2,'Women’s room ceiling beam']]},
 {name:'Men’s room ceiling',x0:0,x1:5,z0:R.hall.changing,z1:R.hall.front,beams:[[.2,'Men’s room ceiling beam']]},
 {name:'Bath hall ceiling',x0:-5,x1:5,z0:R.hall.bath,z1:R.hall.changing,beams:[[-1.9,'Bath hall ceiling beam doors'],[-3.4,'Bath hall ceiling beam glass']]},
].map(c=>Object.freeze({...c,beams:Object.freeze(c.beams.map(b=>Object.freeze(b)))})));

/** The men's changing-room fan: where it stands (x, z), and how its head sweeps (radians either side of facing the street wall, rad/s of its clock). */
export const ONSEN_FAN=Object.freeze({at:Object.freeze([3.85,1.2]),sweep:.9,rate:.4});
const fanYaw=t=>Math.sin(t*ONSEN_FAN.rate)*ONSEN_FAN.sweep;

/** Seats: where you sit, and where your weight goes. `soak` seats put you in the water. */
export const ONSEN_SEATS=Object.freeze({
 // (`front`: how far ahead of the mark the seat's front edge is, seat-slots.js; the changing bench is 2.2 by .42, room for two)
 bench:benchSeat({id:'bench',label:'Sit on the changing-room bench',position:[2.1,0,.25],stand:[2.1,0,.95],eyeY:1.16,yaw:0,surfaceY:.46},{length:2.2,front:.21}),
 tatami:{id:'tatami',label:'Sit on the tatami',position:[LOBBY.koagari.x-.25,0,LOBBY.koagari.z+.5],stand:[LOBBY.koagari.x,0,3.55],eyeY:LOBBY.koagari.h+.8,yaw:Math.PI,surfaceY:LOBBY.koagari.h+.07,front:.29},
 // The coin massage chair's seat, from its card (onsen-chair.js): the mark 5 cm behind the seat's front edge, facing the lobby,
 // and the card's label: a ¥100 coin buys ten minutes from the seat (ONSEN_MASSAGE). World's id stays 'massage' (saved
 // scenes and the films know it by that).
 massage:(({position,stand,eyeY,yaw,surfaceY,label,front})=>({id:'massage',label,position,stand,eyeY,yaw,surfaceY,front}))(CHAIR.seat('seat')),
 ...WASH_SEATS,
 indoor:{id:'indoor',label:'Get into the indoor bath',position:[3.1,0,-3.35],stand:[3.1,0,-1.66],eyeY:R.tub.floor+.78,yaw:Math.PI,surfaceY:R.tub.floor+.04,soak:true},
 rock:{id:'rock',label:'Get into the rock bath',position:[.75,0,-6.45],stand:[.75,0,-4.75],eyeY:R.pool.floor+.82,yaw:0,surfaceY:R.pool.floor+.04,soak:true},
 rockBeside:{id:'rockBeside',label:'Get into the rock bath beside the rocks',position:[-.85,0,-6.55],stand:[-.6,0,-4.78],eyeY:R.pool.floor+.82,yaw:0,surfaceY:R.pool.floor+.04,soak:true},
 // Four more round the pool, so six can sit in a ring (ROCK_RING): everyone steps in at the low rocks by the door and
 // wades to their place, the sea-side two between the first two, the east and west two along the pool's long sides.
 ...Object.fromEntries([
  ['rockEast','Get into the rock bath on the east side',[1.9,-6.85],[.3,-4.78]],
  ['rockSeaEast','Get into the rock bath by the sea fence',[.45,-7.6],[0,-4.78]],
  ['rockSeaWest','Get into the rock bath by the sea fence, west',[-.55,-7.6],[-.1,-4.78]],
  ['rockWest','Get into the rock bath on the west side',[-2,-6.85],[-.4,-4.78]],
 ].map(([id,label,[x,z],[sx,sz]])=>[id,{id,label,position:[x,0,z],stand:[sx,0,sz],eyeY:R.pool.floor+.82,
  // Facing the middle of the ring (the camera's yaw: forward is (-sin, -cos)).
  yaw:Math.atan2(-(-.05-x),-(-7-z)),surfaceY:R.pool.floor+.04,soak:true}]))
});
/**
 * The coin massage chair in play: seated in it, a ¥100 coin (CHAIR_TIMER.coin) buys ten minutes on its coin timer, and the
 * LED counts them down while the rollers knead. With no power the coin does nothing and Higa-san hands it back, so nothing
 * is charged. A coin is spent once it is in: standing up early leaves the chair running to 0:00, as a real coin timer does.
 */
export const ONSEN_MASSAGE=Object.freeze({
 about:'A grey steel coin box on the right arm: ¥100 for ten minutes, a red running lamp and a four-digit red LED.',
 started:'You feed it a hundred-yen coin. The red lamp comes on and the rollers start up your back like a slow, well-meaning truck.',
 running:'The LED counts down the coin’s ten minutes while the rollers work slowly up and down your back.',
 circuitDown:'You feed it a hundred-yen coin and nothing happens. Its socket is on the changing-room circuit, and that breaker is down. Higa-san hands the coin back.',
 houseDark:'You feed it a hundred-yen coin and nothing happens: the whole house is dark. The supply breaker by the bandai has let go. Higa-san hands the coin back.',
});
/** What the room is built of from World's catalogue (src/catalog): the game fetches these before it opens the door. */
export const ONSEN_ASSETS=Object.freeze([ONSEN_CHAIR.asset]);
/** The six places round the rock bath, for a scene with everybody in the water (the story's last night). */
export const ROCK_RING=Object.freeze(['rock','rockEast','rockSeaEast','rockSeaWest','rockWest','rockBeside']);

function dataTexture(size,paint){
 const data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,[r,g,b,a=255]=paint(x/size,y/size);data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=a;}
 const t=new THREE.DataTexture(data,size,size);t.needsUpdate=true;t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;return t;
}
/** Square tiles with pale grout. */
const tileTexture=(r,g,b,grout=[214,218,214])=>dataTexture(64,(u,v)=>{const edge=Math.min(u%.5,v%.5)<.035;const n=((u*97+v*53)%1)*8;return edge?grout:[r+n,g+n,b+n];});
/** Rough stone flags. */
const flagTexture=()=>dataTexture(64,(u,v)=>{const edge=(u*3.1+Math.sin(v*9)*.06)%1<.04||(v*2.3+Math.sin(u*7)*.05)%1<.04;const n=Math.sin(u*41)*Math.cos(v*37)*10;return edge?[96,92,86]:[150+n,145+n,134+n];});
/** The view over the fence: sky above, the sea below the horizon. */
const seaTexture=()=>{const t=dataTexture(128,(u,v)=>{if(v>.46)return [120+60*(1-v),175+50*(1-v),215];const k=v/.46;return [40+30*k,110+40*k,150+30*k];});t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;};

function canvasSign(lines,{w=512,h=256,bg='#efe6cf',fg='#2b2520',size=64}={}){
 if(typeof document==='undefined'||!document.createElement)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext?.('2d');if(!ctx)return null;
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
 lines.forEach(([text,scale=1],i)=>{ctx.font=`bold ${Math.round(size*scale)}px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif`;ctx.fillText(text,w/2,h*(i+.7)/(lines.length+.4));});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

/**
 * @param {object} shared
 * @param {THREE.Group} shared.room
 * @param {(o:THREE.Object3D,label:string,fn:Function,near?:boolean)=>void} shared.reg
 * @param {(kind:string,...args:any[])=>void} shared.action
 * @param {()=>void} shared.exit
 * @param {()=>{name:string|null,x:number,z:number}[]} [shared.people] who is in the room and where (the player
 *   with no name): the street door opens for them, and the residents' shoes are at the step once they are past it.
 */
export function buildOnsenInterior({room,reg,action,exit,people=()=>[]}){
 room.name='Umi-no-yu interior';
 const colliders=[],mats=new Map(),animated=[];
 const mat=(color,rough=.8,extra={})=>{const key=color+':'+rough+JSON.stringify(Object.keys(extra));if(!mats.has(key)||Object.keys(extra).length){const m=new THREE.MeshStandardMaterial({color,roughness:rough,...extra});if(Object.keys(extra).length)return m;mats.set(key,m);}return mats.get(key);};
 const rect=(x,z,w,d,height=1)=>{const c={x,z,w,d,height,minY:0};colliders.push(c);return c;};
 const box=(size,pos,m,name='',parent=room)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(...size),m);b.position.set(...pos);b.castShadow=b.receiveShadow=true;b.name=name;b.userData.staticProp=true;parent.add(b);return b;};
 const cyl=(r,h,pos,m,name='',seg=16)=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),m);c.position.set(...pos);c.castShadow=true;c.name=name;room.add(c);return c;};
 // Prompts on the women's side (the plant, the dryers, their notice) are not offered through the partition: while the
 // player (a man) is in the men's changing room they are put away (tick), and back when he is anywhere else.
 const womenSide=[];
 const anchor=(pos,label,fn)=>{const o=new THREE.Object3D();o.position.set(...pos);room.add(o);reg(o,label,fn,true);
  if(pos[0]<-.05&&pos[2]<R.hall.front&&pos[2]>R.hall.changing-.05){o.userData.side='women';womenSide.push(o);}return o;};
 const seat=(spec,title,text)=>{const o=anchor([spec.position[0],.9,spec.position[2]],spec.label,()=>action('seat',title,typeof text==='function'?text():text));o.userData.seat={...spec,onsen:spec.id,pitch:spec.soak?-.05:0};return o;};
 // Its lamps stop at its walls (render/cel.js lampsStopAtWalls): the lobby's bulb does not shine on the women's side of
 // the noren wall, nor the bath lamps on the changing rooms' mirrors, nor the porch lamp on the inside of the street wall.
 // The noren is cloth and lets the lamp behind it glow through, and Miss Higa is the town's like everyone else: they keep
 // the town's light.
 const stopLamps=root=>{const keep=new Set();room.getObjectByName('Umi-no-yu attendant')?.traverse(o=>keep.add(o));
  root.traverse(o=>{if(!o.isMesh||keep.has(o)||o.name==='Noren'||o.userData.sharedAsset)return;
   for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.isMeshStandardMaterial)m.userData.lampsStopAtWalls=true;});};

 const wood=mat(0xc79f6e,.7),darkWood=mat(0x6b4a2e,.75),plaster=mat(0xeee6d3,.95),stone=mat(0x8c877c,.95);
 const tiles=new THREE.MeshStandardMaterial({map:tileTexture(120,150,160),roughness:.35});tiles.map.repeat.set(6,4);
 const wallTiles=new THREE.MeshStandardMaterial({map:tileTexture(214,222,220,[170,176,174]),roughness:.4});wallTiles.map.repeat.set(10,3);
 const flags=new THREE.MeshStandardMaterial({map:flagTexture(),roughness:.95});flags.map.repeat.set(3,2);
 const water=new THREE.MeshStandardMaterial({color:0x7fc3c6,roughness:.06,metalness:.05,transparent:true,opacity:.72,depthWrite:false});

 // ---- Floors: wood indoors, tiles in the bath hall, flags outside; holes where the baths are.
 const floorRect=(x0,x1,z0,z1,m,y=0)=>{const f=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),m);f.rotation.x=-Math.PI/2;f.position.set((x0+x1)/2,y,(z0+z1)/2);f.receiveShadow=true;f.name='Umi-no-yu floor';room.add(f);return f;};
 const hinoki=hinokiTexture([5,3]),floorWood=hinoki?new THREE.MeshStandardMaterial({map:hinoki,roughness:.55}):wood;
 // The genkan's stone ends where the agarikamachi turns (GENKAN_STEP.turn); east of it the lobby's hinoki runs on to the
 // street wall, its boards carrying straight on from the lobby's (the same texture coordinates), so the chair's corner is wood.
 const G=GENKAN_STEP.turn;
 floorRect(-5,G,3.6,5,stone);floorRect(-5,5,R.hall.changing,3.6,floorWood);
 {const f=floorRect(G,5,3.6,5,floorWood),uv=f.geometry.attributes.uv,p=f.geometry.attributes.position;
  for(let i=0;i<uv.count;i++){const x=f.position.x+p.getX(i),z=f.position.z-p.getY(i);uv.setXY(i,(x+5)/10,(3.6-z)/(3.6-R.hall.changing));}}
 floorRect(-5,R.tub.minX,R.hall.bath,R.hall.changing,tiles);floorRect(R.tub.minX,5,R.tub.maxZ,R.hall.changing,tiles);floorRect(R.tub.minX,5,R.hall.bath,R.tub.minZ,tiles);
 {const shape=new THREE.Shape();shape.moveTo(-5,-R.hall.bath);shape.lineTo(5,-R.hall.bath);shape.lineTo(5,-R.walls.minZ);shape.lineTo(-5,-R.walls.minZ);shape.closePath();
  const hole=new THREE.Path();hole.absellipse(R.pool.x,-R.pool.z,R.pool.rx,R.pool.rz,0,Math.PI*2,false);shape.holes.push(hole);
  const paving=new THREE.Mesh(new THREE.ShapeGeometry(shape,48),flags);paving.rotation.x=-Math.PI/2;paving.receiveShadow=true;paving.name='Rock bath paving';room.add(paving);}
 // The agarikamachi: the polished edge where the genkan stops and the wood floor starts. It runs from the west wall to
 // GENKAN_STEP.turn and turns there towards the street wall (GENKAN_STEP.turnWhy), in one L.
 {const S=GENKAN_STEP,h=S.width/2,street=4.905;// the street wainscot's face
  box([G+h+5,.05,S.width],[(G+h-5)/2,.025,S.z],darkWood,'Genkan step');
  box([S.width,.05,street-(S.z+h)],[G,.025,(S.z+h+street)/2],darkWood,'Genkan step');}
 // ---- Walls and ceilings. Every piece has its own name (ONSEN_WALLS), so a film can lift one wall or one room's ceiling at a
 // time (capture-room.mjs HIDE) for a shot that stands where the wall is, or looks down into the room from above.
 const wall=(name,x0,z0,x1,z1,h=R.walls.height,m=plaster,y=0)=>{const w=box([Math.max(.12,Math.abs(x1-x0)),h,Math.max(.12,Math.abs(z1-z0))],[(x0+x1)/2,y+h/2,(z0+z1)/2],m,name);w.userData.wall=true;return w;};
 wall('Street wall west',-5,5,-1,5);wall('Street wall east',1,5,5,5);wall('Street door lintel',-1,5,1,5,.6,plaster,2.2);
 // The side walls run in one line from the street to the bath doors, in two pieces: the lobby's and its changing room's.
 for(const [x,side] of [[-5,'west'],[5,'east']]){wall('Lobby wall '+side,x,R.hall.front,x,5);wall((side==='west'?'Women’s':'Men’s')+' room wall '+side,x,R.hall.changing,x,R.hall.front);
  wall('Bath hall wall '+side,x,R.hall.bath,x,R.hall.changing,R.walls.height,wallTiles);}
 wall('Noren wall west',-5,R.hall.front,-.9,R.hall.front);wall('Noren wall east',.9,R.hall.front,5,R.hall.front);wall('Noren wall lintel',-.9,R.hall.front,.9,R.hall.front,.55,plaster,2.25);
 // The men's and women's sides: a short wall between the two noren, and a plaster partition from it to the bath doors.
 const DW=ONSEN_DOORWAYS,PART=DW.men.x0-DW.women.x1;
 box([PART,2.25,.12],[0,1.125,R.hall.front],plaster,'Noren wall stub').userData.wall=true;
 box([PART,R.walls.height,R.hall.front-R.hall.changing],[0,R.walls.height/2,(R.hall.front+R.hall.changing)/2],plaster,'Partition').userData.wall=true;
 wall('Bath door wall west',-5,R.hall.changing,-.8,R.hall.changing);wall('Bath door wall east',.8,R.hall.changing,5,R.hall.changing);wall('Bath door lintel',-.8,R.hall.changing,.8,R.hall.changing,.6,plaster,2.2);
 // The bath hall's sea end is glass, so from the indoor bath you see the rocks outside.
 wall('Sea glass sill west',-5,R.hall.bath,-1,R.hall.bath,.5,wallTiles);wall('Sea glass sill east',1,R.hall.bath,5,R.hall.bath,.5,wallTiles);wall('Sea glass head',-5,R.hall.bath,5,R.hall.bath,.45,plaster,2.35);
 const glass=new THREE.MeshStandardMaterial({color:0xcfe3e6,roughness:.1,transparent:true,opacity:.22,depthWrite:false});
 for(const [x0,x1] of [[-5,-1],[1,5]])box([x1-x0,1.85,.03],[(x0+x1)/2,1.425,R.hall.bath],glass,'Umi-no-yu glass');
 for(const x of [-5,-3,-1,1,3,5])box([.08,1.85,.1],[x,1.425,R.hall.bath],darkWood,'Glass mullion');
 // Each side's bath door: a frosted leaf in its own half of the opening, slid open behind the tiled wall on the bath-hall
 // side, on a track over the doorway (so the doorway is clear to walk through and the leaf is not in anyone's way).
 {const frosted=new THREE.MeshStandardMaterial({color:0xe8efee,roughness:.5,transparent:true,opacity:.55}),z=R.hall.changing-.06-.03;
  for(const s of [-1,1]){const x=s*1.25,h=2.13;box([.82,h-.08,.02],[x,.005+h/2,z],frosted,'Frosted sliding door');
   // Its wooden frame: two stiles and two rails round the frosted glass, so it reads as a door against the plaster.
   for(const dx of [-.43,.43])box([.04,h,.035],[x+dx,.005+h/2,z],darkWood,'Bath door frame');for(const y of [.025,h-.015])box([.82,.04,.035],[x,.005+y,z],darkWood,'Bath door frame');
   box([1.67,.04,.05],[s*(.05+1.67/2),2.18,z-.005],darkWood,'Bath door track');}}
 // A ceiling for each room, with its beams: one name lifts the lid off one room (the lamps stay, hanging where they hang).
 const ceilingMat=mat(0xe9e0cc,.95);
 for(const C of ONSEN_CEILINGS){const g=new THREE.Group();g.name=C.name;g.userData.ceiling=true;room.add(g);
  const boards=new THREE.Mesh(new THREE.PlaneGeometry(C.x1-C.x0,C.z1-C.z0),ceilingMat);boards.rotation.x=Math.PI/2;boards.position.set((C.x0+C.x1)/2,R.walls.height,(C.z0+C.z1)/2);boards.name=C.name+' boards';boards.receiveShadow=true;g.add(boards);
  // A changing room's beam stops at the partition's face.
  const bx0=C.x0===0?PART/2:C.x0,bx1=C.x1===0?-PART/2:C.x1;
  for(const [z,name] of C.beams){const b=box([bx1-bx0,.1,.12],[(bx0+bx1)/2,R.walls.height-.05,z],darkWood,name,g);b.userData.beam=true;}}
 // Over the glass doorway to the rock bath, on the header facing the bath hall: the swimwear zone (ONSEN_SIGNS.swimZone).
 {const Z=ONSEN_SIGNS.swimZone,tex=canvasSign([[Z.lines[0],1],[Z.lines[1],.62],[Z.sub,.3]],{w:640,h:256,bg:'#f4f8f6',fg:'#1f5a7a',size:84});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(.9,.36),tex?new THREE.MeshStandardMaterial({map:tex,roughness:.8}):mat(0xf4f8f6,.8));sign.position.set(0,2.575,R.hall.bath+.065);sign.name='Swimwear zone sign';room.add(sign);
  box([.94,.4,.012],[0,2.575,R.hall.bath+.064-.006],darkWood,'Swimwear zone sign frame');
  reg(sign,'Read the sign over the rock-bath door',()=>action('inspect','Swimwear zone',
   'Over the glass door: swimwear zone, mixed bathing in swimwear. Both sides come out here to the same rock bath, the way a health land shares its outdoor pool: swimsuits, trunks or a bath wrap, families together, six round the water on a busy night.'),true);}
 // A short eave over the door to the rock bath.
 box([4,.08,1.1],[0,2.6,R.hall.bath-.55],darkWood,'Outdoor eave');
 for(const x of [-1.9,1.9])cyl(.06,2.6,[x,1.3,R.hall.bath-1.05],darkWood,'Eave post',8);
 rect(-1.9,R.hall.bath-1.05,.15,.15,2.6);rect(1.9,R.hall.bath-1.05,.15,.15,2.6);
 // Room walls as colliders (the doorways are left open).
 for(const [x0,x1,z] of [[-5,-.9,R.hall.front],[.9,5,R.hall.front],[-5,-.8,R.hall.changing],[.8,5,R.hall.changing],[-5,-1,R.hall.bath],[1,5,R.hall.bath]])rect((x0+x1)/2,z,x1-x0,.2,2.8);
 rect(0,R.hall.front,PART,.2,2.8);rect(0,(R.hall.front+R.hall.changing)/2,PART,R.hall.front-R.hall.changing,2.8);
 // Both sides' doorways are open to everyone, the player too (the creator, 2026-10-11: Johansson goes anywhere; nobody in
 // the game is ever unclothed). The residents still keep to their own side (indoor-residents.js, by ONSEN_DOORWAYS).

 // ---- Genkan and bandai.
 rect(-4.8,4.51,.4,1.05,1.4);
 box([.62,FURNITURE_HEIGHTS.serviceCounter-.05,1.7],[-3.85,(FURNITURE_HEIGHTS.serviceCounter-.05)/2,2.55],darkWood,'Bandai counter');box([.7,.05,1.78],[-3.85,FURNITURE_HEIGHTS.serviceCounter-.025,2.55],wood,'Bandai top');rect(-3.85,2.55,.66,1.74,FURNITURE_HEIGHTS.serviceCounter);
 box([.2,.12,.14],[-3.75,FURNITURE_HEIGHTS.serviceCounter+.06,2.2],mat(0xd9c9a0,.6),'Ticket tray');
 // Miss Higa, a Shimanchu like everyone else, up on the bandai's raised floor so she can
 // see over the counter -- which is the point of a bandai.
 box([.9,.35,1.4],[-4.45,.175,2.6],darkWood,'Bandai platform');
 box([.44,.4,.44],[-4.5,.55,2.6],wood,'Attendant stool');rect(-4.45,2.6,.9,1.4,1.2);
 const attendant=new THREE.Group();attendant.name='Umi-no-yu attendant';attendant.position.set(-4.5,.35,2.6);attendant.rotation.y=-Math.PI/2;room.add(attendant);
 // Her face is painted on a canvas, so without a page (the room tests) the stool is empty.
 const higa=typeof document!=='undefined'&&document.createElement?buildAvatar(recipeFor('Miss Higa'),{shadows:true,faceSize:256}):null,higaMotion=higa&&createAvatarAnimator(higa);if(higa)attendant.add(higa.root);
 anchor([-3.5,1.25,2.55],'Pay at the bandai · ¥300',()=>action('onsen-pay'));
 anchor([-3.5,1.25,3.1],'Talk to the attendant',()=>action('inspect','Umi-no-yu attendant',
  'Miss Higa teaches at the island school and keeps the bandai in the evenings and at weekends; her grandmother, who owns the house, has kept it in the afternoons for decades. She takes your coins without looking up from her account book. "Gentlemen through the indigo noren, ladies the crimson. Past the bath doors it is swimwear or a bath wrap, please: the washing room and the rock bath are for everybody. The rock bath is best after dark."'));
 // The price board on the counter's front, under the top (ONSEN_SIGNS.fee): read from the genkan while you count your
 // coins, and never between Miss Higa's face and the people she is talking to.
 const fee=canvasSign(ONSEN_SIGNS.fee.lines.map((text,i)=>[text,i?.5:1]),{w:384,h:192,bg:'#fbf6ea',size:60});
 if(fee){const s=new THREE.Mesh(new THREE.PlaneGeometry(.7,.35),new THREE.MeshStandardMaterial({map:fee,roughness:.8}));s.position.set(-3.53,.55,2.55);s.rotation.y=Math.PI/2;s.name='Fee sign';room.add(s);}
 // Coffee milk in the glass-fronted fridge, drunk standing, hand on hip.
 rect(4.6,2.3,.64,.62,1.6);
 anchor([4.2,1.1,2.3],'Buy coffee milk · ¥100',()=>action('onsen-milk'));
 // The coin massage chair, ¥100 for ten minutes: Johansson Studio's 'massage-chair' from World's catalogue, placed by id
 // (onsen-chair.js), its colliders from its card (the body over the old chair's footprint, and the leg rest in front of
 // it). Its seat is 0.44 m deep, from its front edge (MASSAGE_CHAIR.front, x 4.20) to the backrest's cushions (x 4.63): a
 // sitter's knees, a child's too, reach past the front edge, so the lower legs hang down in front of it, by the leg rest
 // (tests/onsen-seats.test.mjs). What lights, moves or is wired on it is the room's own (onsen-electrics.js).
 const chair=placeAsset(ONSEN_CHAIR.asset,{parent:room,x:ONSEN_CHAIR.x,z:ONSEN_CHAIR.z,yaw:ONSEN_CHAIR.yaw,omit:ONSEN_CHAIR.omit,
  // A model that arrives after the room was built (a host that does not wait for it: Johansson Studio) takes the room's
  // lamps-stop-at-walls like the rest of it (stopLamps), before anything draws it.
  onModel:copy=>stopLamps(copy)});
 for(const c of chair.colliders)colliders.push({...c});
 seat(ONSEN_SEATS.massage,'Massage chair',ONSEN_MASSAGE.about);
 // The coin from the seat (the game's seated menu, activities.js massageChair): what the timer shows, why a coin would come
 // back, and the coin going in.
 const CHAIR_LOAD='massage-chair',massage={coin:CHAIR_TIMER.coin,texts:ONSEN_MASSAGE,
  state:()=>({...power.chairTimer(),powered:isPowered(CHAIR_LOAD)}),
  refusal:()=>isPowered(CHAIR_LOAD)?null:isLive('main')?ONSEN_MASSAGE.circuitDown:ONSEN_MASSAGE.houseDark,
  start:()=>isPowered(CHAIR_LOAD)&&!power.isRunning(CHAIR_LOAD)&&power.switchOn(CHAIR_LOAD)};
 const clock=new THREE.Group();clock.position.set(0,2.45,R.hall.front+.08);room.add(clock);
 clock.add(new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.04,24).rotateX(Math.PI/2),mat(0xf6f1e6,.5)));
 const hands=[new THREE.Mesh(new THREE.BoxGeometry(.012,.13,.01),mat(0x222222)),new THREE.Mesh(new THREE.BoxGeometry(.008,.17,.01),mat(0x222222))];
 for(const h of hands){h.geometry.translate(0,h.geometry.parameters.height/2,0);h.position.z=.03;clock.add(h);}
 // The noren into the changing room.
 // Noren, getabako, milk cooler, the tatami corner and the rest: onsen-lobby.js.
 const lobby=buildOnsenLobby({room,R,box,cyl,rect,mat,anchor,seat,action,seats:ONSEN_SEATS});
 // The street doors, the porch beyond them, the shoes at the step and the umbrella stand.
 const front=buildOnsenFront({room,rect,anchor,action});
 // The straw jar on the milk cooler, the uchiwa rack by the tatami, the rubber plant by the bath door, the account book.
 const props=buildOnsenProps({room,rect,anchor,action});

 // ---- Changing room.
 for(let i=0;i<6;i++)for(let r=0;r<2;r++){const z=1.25-i*.42;box([.45,.9,.4],[-4.75,.45+r*.95,z],mat(0xb9b2a0,.45),'Locker');box([.02,.12,.08],[-4.52,.55+r*.95,z+.12],mat(0xc9a13c,.3),'Locker key');}
 rect(-4.75,-.1,.5,2.6,1.9);
 // The women's side keeps the lockers, the vanity and the scales; the men change at the rattan baskets on the east wall,
 // which is where the player (a man) changes.
 anchor([4.2,1.2,.2],'Change at the baskets',()=>action('onsen-change'));
 for(let r=0;r<3;r++){box([.5,.03,2.4],[4.72,.35+r*.55,.2],wood,'Basket shelf');for(let i=0;i<4;i++)box([.4,.22,.4],[4.68,.48+r*.55,-.7+i*.6],mat(0xc9a36a,.9),'Rattan basket');}
 rect(4.72,.2,.5,2.45,1.6);
 box([2.2,.08,.42],[2.1,.42,.25],wood,'Changing bench');for(const x of [1.15,3.05])box([.08,.38,.36],[x,.19,.25],darkWood,'Bench leg');
 rect(2.1,.25,2.25,.5,.45);seat(ONSEN_SEATS.bench,'Changing-room bench','You sit and let the heat come out of you. The fan turns its head towards you and away again.');
 box([2.9,.06,.45],[-2.95,.78,-.92],wood,'Dressing counter');box([2.9,.72,.4],[-2.95,.39,-.94],darkWood,'Dressing counter base');rect(-2.95,-.94,2.95,.5,.85);
 const mirror=new THREE.MeshStandardMaterial({color:0xcfd8da,roughness:.05,metalness:.9});
 for(const x of [-3.9,-2.95,-2])box([.7,.8,.02],[x,1.35,-1.12],mirror,'Mirror');
 box([.34,.06,.34],[-2.3,.03,1.1],mat(0xdedad0,.4),'Scales');
 const fan=new THREE.Group();fan.position.set(ONSEN_FAN.at[0],0,ONSEN_FAN.at[1]);fan.name='Changing-room fan';room.add(fan);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.1,8),mat(0xe6e2d8,.5));pole.position.y=.55;fan.add(pole);
 const fanHead=new THREE.Group();fanHead.position.y=1.12;fan.add(fanHead);
 fanHead.add(new THREE.Mesh(new THREE.TorusGeometry(.18,.01,6,24),mat(0x8fb3c6,.5)));const blades=new THREE.Mesh(new THREE.CircleGeometry(.16,5),mat(0x9fc6d8,.5,{side:THREE.DoubleSide,transparent:true,opacity:.7}));fanHead.add(blades);
 rect(3.85,1.2,.35,.35,1.3);
 // The rule past the bath doors, by each side's door: the washing room and the rock bath are shared, so adults wear a
 // bath wrap (yuamigi) or swimwear and children swimwear.
 const swim=(()=>{if(typeof document==='undefined'||!document.createElement)return null;const c=document.createElement('canvas');c.width=640;c.height=248;const ctx=c.getContext?.('2d');if(!ctx||!ctx.fillRect)return null;
  ctx.fillStyle='#fbf6ea';ctx.fillRect(0,0,640,248);ctx.fillStyle='#8a2f22';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 64px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';ctx.fillText('湯あみ着・水着着用',320,98);
  ctx.font='bold 25px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';ctx.fillText('BEYOND THIS DOOR · BATH WRAP OR SWIMWEAR',320,192);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 for(const [x,w,side] of [[1.6,.8,'men'],[-1.24,.6,'women']]){
  const swimSign=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.31/.8),swim?new THREE.MeshStandardMaterial({map:swim,roughness:.8}):plaster);swimSign.position.set(x,1.6,R.hall.changing+.07);swimSign.name='Bath door notice';swimSign.userData.side=side;room.add(swimSign);
  const read=side==='women'?(label,fn)=>anchor([x,1.6,R.hall.changing+.12],label,fn):(label,fn)=>reg(swimSign,label,fn,true);
  read('Read the notice by the bath door',()=>action('inspect',"Bath wrap or swimwear · Past the bath doors",
   'Men change on the indigo side, women on the crimson. Past the bath doors the washing room and the rock bath are for everybody, like a health land’s swimwear zone: grown-ups wear a yuamigi, the bath wrap, or swimwear; children wear swimwear. Wash before you get in. No towels in the bath: hang yours on the rail by the door. Rock bath until 22:00.'));}

 // ---- Bath hall: the washing places along the west wall, the indoor bath along the east.
 // The arai-ba, sentō-style: a tiled ledge of taps along the wall and an island down the middle (onsen-wash.js).
 buildWashArea({room,box,cyl,rect,seat,mat});
 // The indoor tub: tiled walls rising from a sunk floor, the rim a little above your knee.
 const T=R.tub,tw=T.maxX-T.minX,td=T.maxZ-T.minZ,tx=(T.minX+T.maxX)/2,tz=(T.minZ+T.maxZ)/2;
 box([tw,.04,td],[tx,T.floor-.02,tz],tiles,'Indoor bath floor');
 for(const [w,d,x,z] of [[tw,.14,tx,T.maxZ-.07],[tw,.14,tx,T.minZ+.07],[.14,td,T.minX+.07,tz]])box([w,T.rim-T.floor,d],[x,(T.rim+T.floor)/2,z],wallTiles,'Indoor bath wall');
 box([tw,.05,.2],[tx,T.rim,T.maxZ-.07],mat(0x6b4a2e,.6),'Indoor bath rim');box([.2,.05,td],[T.minX+.07,T.rim,tz],mat(0x6b4a2e,.6),'Indoor bath rim');
 const tubWater=new THREE.Mesh(new THREE.PlaneGeometry(tw-.28,td-.28,12,8),water);tubWater.rotation.x=-Math.PI/2;tubWater.position.set(tx+.07,T.water,tz);tubWater.name='Indoor bath water';tubWater.renderOrder=2;room.add(tubWater);
 rect(tx,tz,tw,td,.6);
 // The spout: hot water falling from a stone lip.
 box([.35,.25,.3],[4.7,.75,-2.55],stone,'Spout stone');
 const fall=new THREE.Mesh(new THREE.PlaneGeometry(.12,.38),new THREE.MeshStandardMaterial({color:0xd9eef0,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide}));fall.position.set(4.5,.58,-2.55);fall.name='Spout water';fall.rotation.y=Math.PI/2;room.add(fall);
 seat(ONSEN_SEATS.indoor,'Indoor bath','You lower yourself in a little at a time. 42 degrees. The heat goes into your knees first, then everywhere. Through the glass the steam rolls off the rock bath.');
 // The mural: the reef and the open sea, not Fuji.
 const mural=new THREE.Mesh(new THREE.PlaneGeometry(3.7,1.2),new THREE.MeshStandardMaterial({map:seaTexture(),roughness:.8}));mural.position.set(4.93,1.55,-2.95);mural.rotation.y=-Math.PI/2;room.add(mural);

 // ---- The rock bath outside.
 const P=R.pool;
 const poolFloor=new THREE.Mesh(new THREE.CircleGeometry(1,40),stone);poolFloor.scale.set(P.rx,P.rz,1);poolFloor.rotation.x=-Math.PI/2;poolFloor.position.set(P.x,P.floor,P.z);room.add(poolFloor);
 const poolWall=new THREE.Mesh(new THREE.CylinderGeometry(1,1,P.rim-P.floor,40,1,true),mat(0x6f6a60,.95,{side:THREE.DoubleSide}));poolWall.scale.set(P.rx,1,P.rz);poolWall.position.set(P.x,(P.rim+P.floor)/2,P.z);room.add(poolWall);
 const poolWater=new THREE.Mesh(new THREE.CircleGeometry(1,40,0,Math.PI*2),water);poolWater.scale.set(P.rx-.02,P.rz-.02,1);poolWater.rotation.x=-Math.PI/2;poolWater.position.set(P.x,P.water,P.z);poolWater.name='Rock bath water';poolWater.renderOrder=2;room.add(poolWater);
 // The ink draws its lines from the depth of the picture (render/ink-pipeline.js), and the water, being see-through, writes
 // none: the rocks' and the bathers' parts under it were inked through it as scribbles on the surface. This copy of the
 // surface writes depth and no colour, last of all (after the steam, which it must not cut), and out to the pool's wall,
 // so the ink sees the water as the surface it is: a line where a stone or a shoulder comes out of it, nothing below.
 {const surface=new THREE.Mesh(poolWater.geometry,new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true,transparent:true,fog:false}));
  surface.name='Rock bath water surface (ink)';surface.renderOrder=10;surface.scale.set((P.rx+.01)/(P.rx-.02),(P.rz+.01)/(P.rz-.02),1);
  surface.raycast=()=>{};surface.castShadow=surface.receiveShadow=false;surface.userData.inkSurface=true;poolWater.add(surface);}
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const rockMat=mat(0x77716a,.95),darkRock=mat(0x5b5750,.95);
 // Closed, smooth stones (onsen-rocks.js): the shape takes the same 240 draws from the sequence as it always did, so the
 // colour, turn and size of every rock after it are as they were.
 const rock=(x,z,s,y=0)=>{const g=rockGeometry(rnd,s);
  const m=new THREE.Mesh(g,rnd()>.5?rockMat:darkRock);m.scale.setScalar(s);m.position.set(x,y+s*.25,z);m.rotation.y=rnd()*6;m.castShadow=m.receiveShadow=true;m.name='Bath rock';room.add(m);return m;};
 for(let i=0;i<30;i++){const a=i/30*Math.PI*2,x=P.x+Math.cos(a)*(P.rx+.12),z=P.z+Math.sin(a)*(P.rz+.1);
  // Leave the step-in gap facing the door low.
  // Low along the sea side so the view from the water is over them, not into them.
  const sea=Math.sin(a)<-.2,door=Math.sin(a)>.6;rock(x,z,sea?.14+rnd()*.05:door?.2:.26+rnd()*.12,sea?-.04:.02);}
 rock(P.x+P.rx+.15,P.z+.2,.52,.05);rock(P.x-P.rx-.1,P.z-.3,.48,.05);
 rect(P.x,P.z,P.rx*2+.3,P.rz*2+.25,.5);
 seat(ONSEN_SEATS.rock,'Rock bath','You find the smooth step under the water and sit. The water is up to your chest and the night air is on your head. Over the low fence the harbour lights come and go in the steam.');
 seat(ONSEN_SEATS.rockBeside,'Rock bath','The other side of the rock bath, with your back to a warm boulder.');
 for(const id of ['rockEast','rockSeaEast','rockSeaWest','rockWest'])seat(ONSEN_SEATS[id],'Rock bath','You step in over the low rocks by the door and wade to a place on the far side. Everyone in the water faces everyone else; the steam does the talking.');
 // Bamboo fence, tall to the sides, low on the sea side; the sea and sky beyond it.
 const bamboo=new THREE.CylinderGeometry(.035,.035,1,8),bambooMat=mat(0x9c8a52,.7);
 const posts=[];for(const x of [-4.95,4.95])for(let z=R.hall.bath-.1;z>R.walls.minZ;z-=.075)posts.push([x,z,2.2]);
 for(let x=-4.95;x<=4.95;x+=.075)posts.push([x,R.walls.minZ+.05,1.05]);
 const fence=new THREE.InstancedMesh(bamboo,bambooMat,posts.length);const d=new THREE.Object3D();
 posts.forEach(([x,z,h],i)=>{d.position.set(x,h/2,z);d.scale.set(1,h,1);d.updateMatrix();fence.setMatrixAt(i,d.matrix);});fence.name='Takegaki fence';fence.castShadow=true;room.add(fence);
 for(const h of [.4,.9])box([10,.05,.05],[0,h,R.walls.minZ+.1],darkWood,'Fence rail');
 for(const x of [-4.95,4.95])for(const h of [.6,1.5])box([.05,.05,Math.abs(R.walls.minZ-R.hall.bath)],[x,h,(R.walls.minZ+R.hall.bath)/2],darkWood,'Fence rail');
 rect(-4.95,(R.walls.minZ+R.hall.bath)/2,.2,4.8,2.2);rect(4.95,(R.walls.minZ+R.hall.bath)/2,.2,4.8,2.2);rect(0,R.walls.minZ+.05,10,.2,1.1);
 // The painted sea and sky: flat where the harbour lights are, bending round behind the side fences and on up as sky, so
 // no edge of it shows from the water or the wide views (onsen-night.js ONSEN_SEA_VIEW).
 const seaMat=new THREE.MeshBasicMaterial({map:seaTexture(),fog:false});const sea=new THREE.Mesh(seaViewGeometry(),seaMat);sea.name='Umi-no-yu sea view';room.add(sea);
 // Stone lantern and a fukugi tree in the corner.
 box([.34,.5,.34],[-4.2,.25,-8.2],stone,'Lantern base');box([.5,.08,.5],[-4.2,.54,-8.2],stone,'Lantern ledge');
 // Its bulb is on the bath lights, behind a photocell (onsen-electrics.js 'garden-lantern').
 const lanternGlow=new THREE.MeshStandardMaterial({color:0xfff0c8,emissive:0xffc070,emissiveIntensity:1.4,roughness:.8});box([.3,.26,.3],[-4.2,.71,-8.2],lanternGlow,'Lantern light');
 const roof=new THREE.Mesh(new THREE.ConeGeometry(.42,.24,4),stone);roof.position.set(-4.2,.96,-8.2);roof.rotation.y=Math.PI/4;room.add(roof);rect(-4.2,-8.2,.55,.55,1.1);
 cyl(.14,2.6,[4.2,1.3,-8.2],mat(0x5d4a36,.9),'Fukugi trunk',10);
 for(const [dx,dy,dz,s] of [[0,2.8,0,1],[.4,2.4,.3,.75],[-.35,2.5,-.2,.8]]){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(s,1),mat(0x2f5a33,.85));c.position.set(4.2+dx,dy,-8.2+dz);c.scale.y=.8;c.castShadow=true;room.add(c);}
 rect(4.2,-8.2,.4,.4,2.6);

 // ---- Light: the house's bounce (its colour and share follow the lamps: onsen-electrics.js fill()), the lamps themselves
 // with their fittings and the stone lantern's bulb (onsen-electrics.js), the harbour across the water after dark
 // (onsen-night.js), and the room's own daylight.
 room.add(new THREE.HemisphereLight(0xfff1dc,0x8a7a68,1.25));
 const sun=new THREE.DirectionalLight(0xfff0dc,0);sun.position.set(3,8,-2);sun.target.position.set(0,0,-6.5);room.add(sun,sun.target);
 // The breaker board and what hangs off it (the lamp fixtures and their lights, the dryers), and the towels.
 // The board also sets the sun (day × 1.6), so a dead house keeps only the daylight's share of it.
 const harbour=buildOnsenNight({room});
 const power=buildOnsenElectrics({room,rect,anchor,action,sun,sunAtNoon:1.6,hall:R.hall});buildOnsenTowels({room,rect});
 // The steam off both baths and the evening haze at the street door (onsen-steam.js), lit by the lamps above.
 const steam=buildOnsenSteam({room,R});

 anchor([0,1.1,4.75],'Step outside',exit);
 // Every lamp in the house stops at its walls, the chair's materials with the rest (stopLamps).
 stopLamps(room);
 let time=0,fanTime=0;
 function tick(dt,minutes=720){
  time+=dt;
  const day=daylight(minutes),night=1-day,fanOn=isWorking('fan');
  if(fanOn)fanTime+=dt;
  const here=people();
  // The noren part for whoever passes, and the indigo one breathes in the fan's draught (onsen-lobby.js ONSEN_NOREN).
  lobby.tick(dt,minutes,day,townCalendarAt(minutes).weekday,{people:here,fan:{at:ONSEN_FAN.at,time:fanTime,on:fanOn,yawAt:fanYaw}});
  front.update(dt,minutes,here);front.light(day);
  const me=here.find(p=>p.name==null),inMen=!!me&&me.x>.05&&me.z<R.hall.front&&me.z>R.hall.changing;
  for(const o of womenSide)o.visible=!inMen;
  // The view over the fence darkens with the sky: at night a deep navy, so the harbour lights across the water carry.
  seaMat.color.setRGB(.13+.87*day,.15+.85*day,.22+.78*day);
  power.tick(day,dt);harbour.update(night);
  steam.update(dt,minutes,day);
  const k=time*1.3;tubWater.position.y=T.water+Math.sin(k)*.004;poolWater.position.y=P.water+Math.sin(k*.8+1)*.005;
  if(fanOn){fanHead.rotation.y=fanYaw(fanTime);blades.rotation.z+=dt*18;}
  const m=((minutes%1440)+1440)%1440;hands[0].rotation.z=-(m%720)/720*Math.PI*2;hands[1].rotation.z=-(m%60)/60*Math.PI*2;
  // Seated at the bandai; now and then she looks up from her account book. Until the town has a seated Read pose
  // she holds it up the way a seated person holds a glass (SitHold), one forearm up before her.
  higaMotion?.update(dt,{speed:0,seated:true,seatHeight:.4,pose:Math.floor(time/9)%3===2?'Sit':'SitHold',expression:'neutral'});
 }
 tick(0);
 /**
  * The story's state of the room's things, by name (the film and capture-room.mjs `onsen.props`):
  * - offering: 'none' | 'full' | 'empty' (Fujita's three coffee milks on the chair's arm);
  * - timer: '9:58' or seconds (the chair's coin timer held at a reading), null to let it run;
  * - dryers: {1: {at, aim} | null, …} (a dryer off the counter, its cord taut to its socket);
  * - noren: {part, breathe} (part: false for a photograph with nobody in it);
  * - signs: {reserved, hairRights, flyer} (page 5's paper war: his sign and their manifesto on the crimson noren, a flyer on her book).
  * Returns what is set now.
  */
 const stageProps=(o={})=>{
  if(o.offering!==undefined)props.stage({offering:o.offering});
  if(o.signs!==undefined){lobby.paperWar(o.signs);if(o.signs.flyer!==undefined)props.stage({flyer:o.signs.flyer});}
  if(o.timer!==undefined)power.chairTimer(o.timer);
  for(const [n,pose] of Object.entries(o.dryers??{}))power.holdDryer(+n,pose);
  if(o.noren!==undefined)lobby.noren.stage(o.noren);
  return {offering:props.offered,signs:{...lobby.paperWar(),flyer:props.stage().flyer},timer:power.chairTimer(),noren:lobby.noren.state};};
 const propsApi={stage:stageProps,get state(){return stageProps();}};
 const audit=typeof window!=='undefined'?window.__JOHANSSON_AUDIT__:null;
 if(audit)audit.onsenProps=propsApi;
 return {...ONSEN_ROOM,colliders,tick,seats:ONSEN_SEATS,doorways:ONSEN_DOORWAYS,power,townFill:power.townFill,tv:lobby.tv,streetDoor:front.door,genkan:front.genkan,
  noren:lobby.noren,props:propsApi,
  // The catalogue's things in the room (the chair): `ready` resolves true once their models are in place and take the
  // room's light, false if one cannot be had. The game fetches them before it opens the door (ONSEN_ASSETS); a host that
  // builds without waiting (Johansson Studio's Build scene) waits for this before it shades the room.
  chair,ready:chair.ready,massage,
  // Every frame, and for a frozen photograph (game.js audit render): what shows the room's state without time passing.
  realUpdate(){lobby.refresh(people());power.refresh();steam.refresh();},
  steam,
  dispose(){power.dispose();front.dispose();steam.dispose();chair.dispose();if(audit&&audit.onsenProps===propsApi)delete audit.onsenProps;}};
}
