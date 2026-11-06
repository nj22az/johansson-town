import * as THREE from '../../vendor/three.module.js';
import {applyCelShading} from '../render/cel.js';
import {townDate} from '../town-clock.js';
import {SAKURA_BOX,SAKURA_VENDING,crateTops} from './okinawa/old-town.js';
import {VENDING_MACHINE,vendingPoints,vendingToWorld} from './vending.js';
import {buildFujitaDream} from './fujita-dream.js';
import {placeAsset,assetPlacement} from '../catalog/catalog.js';
import {std,mesh,buildPumpkinLantern,buildJackOLantern,buildObake,buildDog,buildCordReel,buildJCoffeeCan,J_COFFEE_CAN} from './halloween-props.js';
export {buildPumpkinLantern,buildJackOLantern,buildObake,buildDog,buildCordReel};

/**
 * Halloween on Sakura Street, 1997 (the story "The Haunted Vending Machine", おばけ自販機).
 *
 * Okinawa has kept Halloween since the American bases came, and Minato Machi's shopkeepers hold a children's walk on
 * the last evening of October: paper pumpkin lanterns strung along Sakura Shōten's frontage, little cardboard ghosts
 * taped to the shutters, and the children walk the street in costume collecting sweets. Everything here has its reason:
 *
 *   lanterns     thirteen paper pumpkin lanterns (a 25 W bulb in each) on one string from the nobori pole by the drinks
 *                machine, along the awning's front edge, to the far end of the frontage: the walk's route
 *   ghosts       four cardboard obake (round, little arms, rosy cheeks) taped to the shutter at a child's eye height
 *   reel         the cord reel Kōji brought from his boat shed: 30 m of thin 0.75 mm² cord, still half coiled on its
 *                drum. The story's trouble: he plugged the reel into the machine's outdoor socket and the machine
 *                into the reel, so the machine's start surge goes through the thin coiled cord with the lanterns
 *   socket       the drinks machine's own outdoor socket (weatherproof, with its flip lid), on the corner pier south of
 *                the shutter; after the fix, beside it, a new outdoor socket with an RCD for the lanterns alone
 *   mist         cold air from the can chute meeting the warm, wet night: a low mist that creeps out on the pavement
 *   bats         six black-card paper bats (Johansson Studio's halloween-paper-bat, built in Blender) hung on cotton
 *                threads from the lantern string, in every other gap between the lanterns: Sakura has supplied the
 *                town's decorations since Mrs Kinjō retired. On the string, not the shutter: the shutter is up while
 *                the shop is open, lantern-time included
 *   sweets       a heap of twist-wrapped boiled sweets (halloween-sweets, Blender) on the middle stack of drinks crates,
 *                between the two crate pails, at a child's reach: the walk is for collecting sweets, and Sakura sells them
 *   story things the plastic jack-o'-lanterns ringed round the machine for the walk's photograph, a plush obake
 *                peeking from the crates, the séance's candle jars, Mrs Sato's salt cones (morijio), Thao's rice ball
 *                on a plate, Fujita's tin bucket, a can in the take-out pocket, and Kuro, the Tamashiros' black dog
 *
 * Hidden the rest of the year; up from 24 October, the lanterns lit after six in the evening. A story or a film stages
 * any moment of it with stage({...}), and then the clock leaves it alone.
 */
export const HALLOWEEN=Object.freeze({
 why:'The children’s Halloween walk on Sakura Street, the last evening of October, as Okinawa has kept it since the American bases came: lanterns, paper ghosts and costumes.',
 season:Object.freeze({from:'10-24',to:'10-31',litFrom:18*60}),
 // Sakura's drinks machine (old-town.js SAKURA_VENDING, vending.js): where it stands, its door's face (front), its top,
 // the middle of a can lying in its take-out pocket (chute) and where its cord leaves its back (cordExit), in the town
 machine:(()=>{const V=SAKURA_VENDING,P=vendingPoints({pad:true}),w=p=>Object.freeze(vendingToWorld(V,p));
  return Object.freeze({x:V.x,y:V.y,z:V.z,ry:V.ry,front:w([0,0,P.front])[0],padFront:w([0,0,P.padFront])[0],top:w([0,P.top,0])[1],width:VENDING_MACHINE.size.width,
   chute:w([P.takeOut.x,P.takeOut.y,P.takeOut.z]),cordExit:w([P.cordExit.x,P.cordExit.y,P.cordExit.z])});})(),
 socket:Object.freeze({at:Object.freeze([SAKURA_BOX.maxX+.01,.5,SAKURA_BOX.minZ+.18]),why:'The drinks machine’s own outdoor socket on the corner pier, between the corner’s downpipe and the shutter’s guide: the machine’s cord runs to it along the foot of the shutter. There all year (the machine lives on it); only Halloween’s reel takes its place.'}),
 rcd:Object.freeze({at:Object.freeze([SAKURA_BOX.maxX+.01,1.2,SAKURA_BOX.minZ+.18]),why:'After the fix: the lanterns’ own outdoor socket, with an RCD (earth-leakage breaker) and its test button, put in by Tetsuo.'}),
 // the street's ground here: the Main Street footway (harbour.js), whose top is the lane layer (ground-layers.js)
 ground:SAKURA_VENDING.y,
 // Sakura's corner paving (exterior-details.js: 0.55 m square, its top 65 mm up) at the frontage's south corner: the
 // cords cross over it, nothing stands in it
 cornerPaving:Object.freeze({minX:SAKURA_BOX.maxX+.095,maxX:SAKURA_BOX.maxX+.645,minZ:SAKURA_BOX.minZ+.075,maxZ:SAKURA_BOX.minZ+.625,top:.065}),
 // the low window sill along the frontage (exterior-details.js), which runs on under the socket to the corner pier: a cord
 // from the socket drops in front of it
 sill:Object.freeze({maxX:SAKURA_BOX.maxX+.19,bottom:.08,top:.20,minZ:SAKURA_BOX.minZ+.12}),
 reel:Object.freeze({at:Object.freeze([SAKURA_BOX.maxX+.42,SAKURA_VENDING.y,SAKURA_BOX.minZ+.8]),why:'Kōji’s cord reel from his boat shed, half coiled: the lanterns and the machine both plugged into it.'}),
 nobori:Object.freeze([SAKURA_BOX.maxX+.95,SAKURA_BOX.minZ+.45]),
 pools:Object.freeze([-32.4,-29.1,-25.6,-22.1]),   // the four shared lights of the lanterns' warm pools (z along the string)
 // The jack-o'-lantern pails on the frontage, each standing on something: the three-high stack of drinks crates and the
 // one-high one (old-town.js SAKURA_CRATES; the two-high stack between them holds the sweets), the bin's lid on its
 // opening (old-town.js: the lid's top 0.77 m, the opening's rim 0.782 m, 8 cm round), and the pavement at the nobori
 // pole's foot. [x, y, z] is where the pail's bottom stands, r its size, ry its turn.
 // The paper bats on the lantern string: one in every other gap between the lanterns (which hang 1 m apart from z −33.12),
 // each on its own length of cotton thread and turned a little as a thing on a thread turns, so the row is not a fence.
 bats:Object.freeze({asset:'halloween-paper-bat',z:Object.freeze([-32.62,-30.62,-28.62,-26.62,-24.62,-22.62]),
  thread:Object.freeze([.14,.2,.16,.22,.15,.19]),turn:Object.freeze([.25,-.2,.15,-.3,.2,-.1]),
  why:'Sakura’s black-card bats, hung between the paper pumpkins so the walk’s string reads as Halloween from down the street, lit or dark.'}),
 // The sweets: on the lid of the two-high stack of crates, between the pail on the three-high stack and the one on the
 // one-high stack, 58 cm up: a child's reach.
 sweets:(()=>{const [,middle]=crateTops();return Object.freeze({asset:'halloween-sweets',at:Object.freeze([middle.x,middle.top,middle.z]),ry:Math.PI/2,
  why:'The walk is for collecting sweets: Sakura’s twist-wrapped boiled sweets, heaped where a child in costume can reach them.'});})(),
 pails:(()=>{const [high,,low]=crateTops();return Object.freeze([
  Object.freeze({at:Object.freeze([high.x,high.top,high.z]),r:.15,ry:Math.PI/2,on:'the three-high stack of crates'}),
  Object.freeze({at:Object.freeze([low.x,low.top,low.z]),r:.12,ry:Math.PI/2+.3,on:'the one-high stack of crates'}),
  Object.freeze({at:Object.freeze([SAKURA_BOX.maxX+.4,.782,-29.4]),r:.13,ry:Math.PI/2-.2,on:'the bin’s lid, over its opening'}),
  Object.freeze({at:Object.freeze([SAKURA_BOX.maxX+.95+.12,SAKURA_VENDING.y,SAKURA_BOX.minZ+.45-.22]),r:.14,ry:Math.PI/2-.4,on:'the pavement at the nobori pole’s foot'}),
 ]);})(),
 poolIntensity:4,
 seance:Object.freeze({centre:Object.freeze([-5.75,-32.6]),radius:.72,candles:8}),
});

/**
 * The electrics, as numbers the story, the film and the tests share (the story's "Why it works"). 100 V; the
 * machine's cooling compressor draws 4 A running and about six times that for the moment it starts; thirteen 25 W
 * lantern bulbs; the reel's cord 30 m of 0.75 mm² copper, there and back. Incandescent light goes as about V^3.4.
 */
export const HALLOWEEN_ELECTRICS=Object.freeze({
 supply:100,compressorRun:VENDING_MACHINE.rating.amps,startTimes:6,lanterns:13,lanternWatts:25,cordLength:30,cordArea:.75,copper:.0172,coiledRating:6,relayDropout:.7,
});
export function lanternCurrent(E=HALLOWEEN_ELECTRICS){return E.lanterns*E.lanternWatts/E.supply;}
export function cordResistance(E=HALLOWEEN_ELECTRICS){return 2*E.cordLength*E.copper/E.cordArea;}
/** The voltage at the reel's outlets: the machine running, or starting (its surge), with the lanterns on. */
export function reelVolts(starting=false,E=HALLOWEEN_ELECTRICS){
 const machine=E.compressorRun*(starting?E.startTimes:1);
 return E.supply-(machine+lanternCurrent(E))*cordResistance(E);
}
/** How bright a lantern is at a voltage, against its full brightness at 100 V. */
export const lanternBrightness=(volts,E=HALLOWEEN_ELECTRICS)=>Math.pow(Math.max(0,volts)/E.supply,3.4);
/** The heat in the reel's cord while everything runs (W): coiled, it cannot get rid of it. */
export const cordHeat=(E=HALLOWEEN_ELECTRICS)=>Math.pow(E.compressorRun+lanternCurrent(E),2)*cordResistance(E);

/** A tube along points (a cord or a cable), radius r. floorAt(x,z): the height of what it lies on there (the footway,
 *  a paving slab), if anything: a cord rests on it, never sinks into it, wherever the curve between its points would sag. */
function cable(points,r,mat,floorAt=null){let curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 if(floorAt){const pts=curve.getSpacedPoints(Math.max(24,points.length*12));for(const p of pts)p.y=Math.max(p.y,floorAt(p.x,p.z)+r+.002);curve=new THREE.CatmullRomCurve3(pts);}
 return new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*8),r,6,false),mat);}

/** A weatherproof outdoor socket (屋外コンセント): a grey box with its flip lid, on a wall facing +x. rcd: the
 *  earth-leakage breaker's box above it with its test button. Origin at the box's back centre. */
function outdoorSocket({rcd=false}={}){
 const g=new THREE.Group();g.name=rcd?'Outdoor socket with RCD':'Outdoor socket';
 const grey=std(0xc9cbc6,{roughness:.5});
 mesh(g,new THREE.BoxGeometry(.06,.14,.11),grey,.03,0,0);
 mesh(g,new THREE.BoxGeometry(.012,.07,.1),std(0xb0b3ad,{roughness:.5}),.065,.045,0).rotation.z=-.25;
 for(const z of [-.012,.012])mesh(g,new THREE.BoxGeometry(.004,.02,.005),std(0x222222),.061,-.02,z);
 if(rcd){mesh(g,new THREE.BoxGeometry(.06,.12,.11),std(0xeceae4,{roughness:.5}),.03,.15,0);
  mesh(g,new THREE.BoxGeometry(.008,.02,.02),std(0xd8342c),.064,.17,.03);mesh(g,new THREE.BoxGeometry(.008,.03,.025),std(0x2b2f33),.064,.14,-.02);
  mesh(g,new THREE.PlaneGeometry(.07,.02),std(0x2f6fa8),.0605,.11,0).rotation.y=Math.PI/2;}
 return g;
}

/** Soft mist: flat discs of fading white, each a canvas-free radial fade in its vertex colours. */
function mistPuff(r){
 const geo=new THREE.CircleGeometry(r,24,0,Math.PI*2),P=geo.attributes.position,col=new Float32Array(P.count*4);
 for(let i=0;i<P.count;i++){const d=Math.hypot(P.getX(i),P.getY(i))/r;col.set([.78,.84,.92,.42*(1-d)*(1-d)],i*4);}
 geo.setAttribute('color',new THREE.BufferAttribute(col,4));geo.rotateX(-Math.PI/2);
 const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,opacity:1}));m.name='Mist';m.renderOrder=2;return m;
}

/**
 * The cold air out of the take-out pocket, for a lens at the pocket (the ground mist's flat discs are edge-on to it): a
 * stream of soft puffs that always face the camera, each on its way along one path in the machine's own frame (+z out of
 * its face): from the cold chute floor inside the pocket, out under the flap's bottom edge, over the flap lip, then
 * sinking down the face of the door to the pad and spreading there, as cold, wet air does. phase (0 … 1) moves every
 * puff along it, a loop, so a film can photograph it moving; each puff is its own seed's place across the pocket.
 */
const FADE=(()=>{const n=64,d=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const r=Math.hypot(x-n/2+.5,y-n/2+.5)/(n/2),a=Math.max(0,1-r);d.set([255,255,255,Math.round(255*a*a*(3-2*a))],(y*n+x)*4);}
 const t=new THREE.DataTexture(d,n,n,THREE.RGBAFormat);t.needsUpdate=true;return t;})();
export const POCKET_MIST=Object.freeze({puffs:40,why:'Cold air from the chute meeting the warm, wet night: it rolls out under the flap, curls over the lip and sinks down the door to the pad, where the ground mist gathers.'});
export function pocketMistPath(s,seed,P){
 // P: vendingPoints({pad:true}); s 0 … 1 along the way; returns [x, y, z, radius] in the machine's frame
 const u=seed*.8+.1,x=P.takeOut.x0+.04+(P.takeOut.x1-P.takeOut.x0-.08)*u,F=P.front,fl=P.takeOut.floor;
 const k=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t);
 if(s<.3){const t=sm(s/.3);return [x,fl+.025+.01*t,k(P.takeOut.back+.04,F+.025,t),k(.018,.032,t)];}   // along the chute floor and out under the flap
 if(s<.5){const t=(s-.3)/.2;return [x+(seed-.5)*.03*t,fl+.035+.025*Math.sin(Math.PI*t),k(F+.025,F+.08,t),k(.032,.045,t)];}   // curling up over the lip
 if(s<.75){const t=sm((s-.5)/.25);return [x+(seed-.5)*.1*t,k(fl+.03,.06,t),k(F+.08,P.padFront-.01,t),k(.045,.07,t)];}   // sinking down the door to the pad
 const t=sm((s-.75)/.25);return [x+(seed-.5)*(.1+.22*t),k(.06,.02,t),k(P.padFront-.01,P.padFront+.32,t),k(.07,.12,t)];   // over the pad's edge, spreading on the pavement
}

/**
 * Builds Halloween on Sakura Street into the town (hidden until the season or a story stages it) and returns its api:
 *   stage({show, glow, machine, cable, mist, pumpkins, peek, can, candles, riceBall, salt, bucket, dog})
 *     show      true / false
 *     glow      the lanterns, 0 dark … 1 at full 100 V (reelVolts and lanternBrightness give the story's levels)
 *     machine   the drinks machine's lit window and brand, 0 … 1 (it flickers dim when its compressor starts)
 *     cable     'reel' (Kōji's way: the reel in the socket, the machine and the lanterns in the reel) or 'fixed'
 *               (the machine back in its own socket, the lanterns on their own RCD socket by a proper cable)
 *     mist      0 … 1, the cold mist from the chute; pocketMist 0 … 1 the cold air rolling out of the take-out pocket
 *               itself (for a lens at the pocket), mistPhase 0 … 1 where it is on its way; flap -1 … 1 the take-out flap
 *               (+ pushed in, - stirred out: vending.js setFlap); pumpkins (the ring), deco (jack-o'-lanterns on the crates, the bin and the
 *               pole's foot; on by default), peek, can, candles, salt, bucket: true / false;
 *     bucket    true (with the night's free cans in it), 'empty' or false;
 *     dream     Fujita's dream of his pension (fujita-dream.js): 'dream', 'pop' (it bursts) or false;
 *     riceBall  'plate' or false; dog: false or {pose:'sit'|'eat'|'stand', at:[x,z], yaw}
 *   update(minutes) the season and the evening (until a stage pins it), state (the last stage).
 */
export function buildHalloween(world,{shadows=false}={}){
 const H=HALLOWEEN,M=H.machine,S=SAKURA_BOX;
 const group=new THREE.Group();group.name='Halloween on Sakura Street';group.visible=false;world.group.add(group);
 const add=(o,x,y,z,ry=0,parent=group)=>{o.position.set(x,y,z);o.rotation.y=ry;parent.add(o);return o;};
 // ---- the lantern string: from the nobori pole along the awning's front edge to the far end of the frontage
 const [nx,nz]=H.nobori,ties=[[nx,2.6,nz],[-6.1,2.42,-31.43],[-6.1,2.42,-26.0],[-6.1,2.42,-20.62]];
 const stringMat=std(0x2b2a28,{roughness:.6});
 const sagAt=z=>{for(let i=0;i<ties.length-1;i++){const a=ties[i],b=ties[i+1];if(z>=a[2]-1e-6&&z<=b[2]+1e-6){const t=(z-a[2])/(b[2]-a[2]);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-.12*Math.sin(Math.PI*t)];}}return [ties.at(-1)[0],ties.at(-1)[1]];};
 const strPts=[];for(let z=ties[0][2];z<=ties.at(-1)[2]+1e-6;z+=.25){const [x,y]=sagAt(z);strPts.push([x,y,z]);}
 const string=cable(strPts,.004,stringMat);string.name='Lantern string';group.add(string);
 const lanterns=[];
 for(let i=0;i<HALLOWEEN_ELECTRICS.lanterns;i++){const z=-33.12+i*1.0,[x,y]=sagAt(z);const l=add(buildPumpkinLantern(),x,y,z,Math.PI/2);l.name='Pumpkin lantern '+(i+1);lanterns.push(l);}
 // ---- where their light falls: a warm pool on the pavement, the shutter and the awning under the string. Four shared
 // lights along it (not one a lantern: a phone lights four cheaply), each following the lanterns' glow; none at dusk.
 const pools=new THREE.Group();pools.name='Lantern light';group.add(pools);
 for(const z of HALLOWEEN.pools){const [x,y]=sagAt(z),L=new THREE.PointLight(0xffa24a,0,4.5,2);L.position.set(x+.4,y-.8,z);L.name='Lantern pool';L.castShadow=false;pools.add(L);}
 // ---- the cardboard ghosts on the shutter, at a child's eye height
 for(const [z,y,s] of [[-30.45,1.32,.66],[-28.55,1.45,.6],[-24.9,1.3,.66],[-22.9,1.42,.6]]){const o=add(buildObake({h:s,flat:true}),S.maxX+.2,y,z,Math.PI/2);o.name='Cardboard ghost';}
 // ---- the sockets, the reel, the cords
 // the machine's own socket and its cord, there all year (outside the season's group): the cord leaves the machine's
 // back, runs down the 3 cm gap behind it and along the foot of the shutter, in front of its bottom rail, round the end
 // of the shutter's guide to the socket. Only Kōji's reel (the story's trouble) takes the machine's plug off it.
 const street=new THREE.Group();street.name='Sakura drinks machine power';world.group.add(street);
 const sock=add(outdoorSocket(),...H.socket.at,0,street);sock.name='Drinks machine outdoor socket';
 const rcd=add(outdoorSocket({rcd:true}),...H.rcd.at,0);rcd.name='Lantern socket with RCD';
 const reel=add(buildCordReel(),...H.reel.at,0);
 const cordMat=std(0x3d3f42,{roughness:.6}),orangeCable=std(0xe8742a,{roughness:.55});
 const [rx,,rz]=H.reel.at,[sx,sy,sz]=H.socket.at,[ex,ey,ez]=M.cordExit,G=H.ground,g=G+.006,C=H.cornerPaving,on=C.top+.009;
 // along the foot of the shutter: in front of its bottom rail (front +.24), behind the machine in its 3 cm gap, and over
 // the corner paving (not through it) to the socket, round the south end of the shutter's guide
 const L=H.sill,drop=[[sx+.07,sy-.03,sz],[L.maxX+.01,sy-.12,sz+.005],[L.maxX+.035,L.top+.015,sz+.02]];   // from the plug, out over the sill and down in front of it
 const floorAt=(x,z)=>x>C.minX-.008&&x<C.maxX+.008&&z>C.minZ-.008&&z<C.maxZ+.008?C.top:G;
 const gap=S.maxX+.255,curtainEnd=S.minZ+.3,cordIn=[[gap,g,M.z-M.width/2-.02],[ex-.002,G+.03,ez-.05],[ex,ey,ez]];
 const ownCord=cable([...drop,[gap-.004,on,curtainEnd-.08],[gap,on,C.maxZ-.004],[gap,g,C.maxZ+.1],...cordIn],.006,cordMat,floorAt);
 ownCord.name='Drinks machine cord';street.add(ownCord);
 const reelWay=new THREE.Group();reelWay.name='Kōji’s way: the reel';group.add(reelWay);
 reelWay.add(cable([...drop,[gap+.02,on,curtainEnd-.08],[rx-.1,on,C.maxZ-.04],[rx-.04,G+.12,rz-.06],[rx,G+.2,rz]],.006,cordMat,floorAt));   // the reel's plug in the machine's socket
 reelWay.add(cable([[rx+.11,G+.2,rz+.03],[rx+.2,G+.03,rz+.15],[rx+.03,g,M.z-M.width/2-.11],[gap+.005,g,M.z-M.width/2-.1],...cordIn],.005,cordMat,floorAt)); // the machine's cord into the reel
 reelWay.add(cable([[rx+.11,G+.2,rz-.03],[C.maxX+.08,g,C.maxZ-.04],[nx+.06,g,nz+.02],[nx+.06,.6,nz],[nx+.06,2.5,nz],[nx,2.6,nz]],.005,cordMat,floorAt));        // the lantern string's cord down the nobori pole
 for(let i=0;i<5;i++){const loop=mesh(reelWay,new THREE.TorusGeometry(.13+i*.012,.005,6,28),cordMat,rx+.41+i*.012,g+i*.004,rz+.05);loop.rotation.x=Math.PI/2;loop.name='Loose cord coil';}   // loose coils on the pavement, between the reel and the machine's pad
 const fixedWay=new THREE.Group();fixedWay.name='The fix: the lanterns’ own socket';group.add(fixedWay);
 // (the machine back in its own socket: the street's cord above, shown again)
 const [qx,qy,qz]=H.rcd.at;
 fixedWay.add(cable([[qx+.07,qy-.03,qz],[qx+.2,qy-.2,qz+.1],[nx+.06,1.0,nz-.04],[nx+.06,2.5,nz-.04],[nx,2.6,nz]],.008,orangeCable));            // a proper cable, fully run, up the pole
 // ---- the story's things
 const ring=new THREE.Group();ring.name='Jack-o’-lanterns round the machine';group.add(ring);
 for(let i=0;i<7;i++){const a=-1.15+i*2.3/6,r=.95;add(buildJackOLantern({r:i%2?.14:.17}),M.front+Math.cos(a)*r,G,M.z+Math.sin(a)*r,Math.PI/2-a*.6,ring);}
 const deco=new THREE.Group();deco.name='Jack-o’-lanterns on the frontage';group.add(deco);
 for(const {at:[x,y,z],r,ry} of H.pails)add(buildJackOLantern({r}),x,y,z,ry,deco);
 // ---- the Blender-built things from Johansson Studio's catalogue: placed (and their models fetched) the first time the
 // season shows, so the town does not download them the rest of the year. Their cel shading and shadows as the rest.
 const finish=copy=>{applyCelShading(copy);copy.traverse(o=>{if(o.isMesh){o.castShadow=shadows&&!o.material.transparent;o.receiveShadow=true;}});};
 const threadMat=std(0xe9e4d8,{roughness:.9});
 /** Where each bat's thread is tied on the string, and where the asset stands so its hang point is at the thread's end. */
 const batPlaces=H.bats.z.map((z,i)=>{
  const [sx,sy]=sagAt(z),yaw=Math.PI/2+H.bats.turn[i],card=assetPlacement(H.bats.asset).card,[w,h]=card.size;void w;
  const hang=card.anchors?.hang||[0,h,0],c=Math.cos(yaw),n=Math.sin(yaw),end=[sx,sy-H.bats.thread[i],z];
  return Object.freeze({tie:Object.freeze([sx,sy,z]),end:Object.freeze(end),yaw,at:Object.freeze([end[0]-(hang[0]*c+hang[2]*n),end[1]-hang[1],end[2]-(-hang[0]*n+hang[2]*c)])});});
 let placed=null;
 const placeCatalogue=()=>{
  if(placed)return;placed={bats:new THREE.Group(),assets:[]};placed.bats.name='Paper bats on the lantern string';group.add(placed.bats);
  // each bat's thread goes up with its bat (never a thread hanging from nothing if a model cannot be had)
  for(const b of batPlaces)placed.assets.push(placeAsset(H.bats.asset,{parent:placed.bats,x:b.at[0],y:b.at[1],z:b.at[2],yaw:b.yaw,
   onModel:copy=>{finish(copy);const thread=cable([b.tie,b.end],.0008,threadMat);thread.name='Bat thread';thread.castShadow=false;placed.bats.add(thread);}}));
  const [x,y,z]=H.sweets.at;placed.assets.push(placeAsset(H.sweets.asset,{parent:deco,x,y,z,yaw:H.sweets.ry,onModel:finish}));
 };
 const peek=add(buildObake({h:.36}),M.x+.12,M.top,M.z-.36,Math.PI/2);peek.name='Plush ghost peeking';peek.rotation.z=-.18;   // on top of the machine, leaning out over its front edge
 const can=new THREE.Group();can.name='A can in the take-out pocket';group.add(can);
 // the free can: a J-Coffee, lying on the pocket's floor behind the smoked flap (vending.js takeOut), across the machine
 {const c=buildJCoffeeCan();c.rotation.x=Math.PI/2;c.rotation.y=-Math.PI/2+.4;   // its name to the street, tipped up a little
 const [cx,cy,cz]=M.chute;c.position.set(cx,cy,cz-J_COFFEE_CAN.height/2);can.add(c);}
 const candles=new THREE.Group();candles.name='Séance candles';group.add(candles);
 const flame=new THREE.MeshBasicMaterial({color:0xffd27a});
 for(let i=0;i<H.seance.candles;i++){const a=i/H.seance.candles*Math.PI*2,x=H.seance.centre[0]+Math.cos(a)*H.seance.radius,z=H.seance.centre[1]+Math.sin(a)*H.seance.radius;
  mesh(candles,new THREE.CylinderGeometry(.035,.035,.09,12),std(0xdfeef0,{transparent:true,opacity:.55,roughness:.1}),x,.045,z);
  mesh(candles,new THREE.CylinderGeometry(.025,.025,.06,10),std(0xf6f1e4),x,.04,z);mesh(candles,new THREE.SphereGeometry(.012,8,6),flame,x,.085,z).scale.set(1,1.8,1);}
 const salt=new THREE.Group();salt.name='Morijio (salt cones)';group.add(salt);
 for(const dz of [-.75,.75]){mesh(salt,new THREE.CylinderGeometry(.06,.05,.015,16),std(0xf3f1ea),M.front+.12,.008,M.z+dz);mesh(salt,new THREE.ConeGeometry(.035,.07,16),std(0xffffff,{roughness:.95}),M.front+.12,.05,M.z+dz);}
 const riceBall=new THREE.Group();riceBall.name='Thao’s rice ball on a plate';group.add(riceBall);
 mesh(riceBall,new THREE.CylinderGeometry(.08,.065,.015,18),std(0xf3f1ea),M.front+.32,.008,M.z+.42);
 {const r=mesh(riceBall,new THREE.ConeGeometry(.055,.075,3),std(0xfbfaf4,{roughness:.95}),M.front+.32,.052,M.z+.42);r.rotation.y=Math.PI/2;r.scale.set(1,1,.55);
  mesh(riceBall,new THREE.BoxGeometry(.05,.035,.02),std(0x1e2a22),M.front+.32,.035,M.z+.43).rotation.y=Math.PI/2;}
 const bucket=new THREE.Group();bucket.name='Fujita’s bucket';group.add(bucket);
 const bx=M.front+.27;   // in front of the take-out pocket, just off the machine's pad (its lip is .12 out from the door)
 mesh(bucket,new THREE.CylinderGeometry(.13,.1,.22,18,1,true),std(0xa9aeb1,{metalness:.6,roughness:.35,side:THREE.DoubleSide}),bx,.11,M.z);
 mesh(bucket,new THREE.CircleGeometry(.1,18).rotateX(-Math.PI/2),std(0x8d9295),bx,.005,M.z);
 // the night's free cans in it: J-Coffee, two standing, one leaning on the rim with its name to the street
 const bucketCans=new THREE.Group();bucketCans.name='Free cans in the bucket';bucket.add(bucketCans);
 // the night's free cans in it (J-Coffee): five standing on the bottom, three standing on those, their tops and names
 // over the rim, and one leaning on the rim with its name to the street
 {const D=J_COFFEE_CAN.diameter,Hc=J_COFFEE_CAN.height,put=(x,y,z,ry,tilt=0)=>{const c=buildJCoffeeCan();c.position.set(bx+x,y,M.z+z);c.rotation.set(0,ry,tilt);bucketCans.add(c);return c;};
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;put(Math.cos(a)*.058,.006,Math.sin(a)*.058,-Math.PI/2+(i-2)*.45);}
  for(let i=0;i<3;i++){const a=(i+.5)/3*Math.PI*2;put(Math.cos(a)*.036,.006+Hc,Math.sin(a)*.036,-Math.PI/2+(i-1)*.4);}
  put(.07,.006+Hc+D/2*Math.sin(.5),-.02,-Math.PI/2,.5);}
 // (the séance's candles, the salt, the rice ball and the bucket stand on the footway)
 for(const o of [candles,salt,riceBall,bucket])o.position.y=G;
 const mist=new THREE.Group();mist.name='Mist from the can chute';mist.position.y=G;group.add(mist);
 for(const [dx,dz,r,y] of [[.12,0,.55,.06],[.45,.3,.7,.05],[.5,-.35,.65,.07],[.95,.05,.85,.04],[.3,.65,.55,.05],[.3,-.65,.55,.06],[1.4,.2,.8,.03],[1.3,-.5,.7,.035],[.08,0,.35,.2],[.1,.15,.3,.3],[.06,-.12,.28,.26]]){const p=mistPuff(r);p.position.set(M.front+dx,y,M.z+dz);mist.add(p);}
 const pocketMist=new THREE.Group();pocketMist.name='Cold air from the take-out pocket';group.add(pocketMist);
 const PM=vendingPoints({pad:true}),pmSeeds=Array.from({length:POCKET_MIST.puffs},(_,i)=>((i*.618034)%1));
 // (40 lighter, more opaque puffs: 22 paler ones read as a grey blur at night)
 const pmPuffs=pmSeeds.map(()=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:FADE,color:0xf0f5fa,transparent:true,depthWrite:false,opacity:0}));sp.name='Pocket mist';sp.renderOrder=3;sp.raycast=()=>{};pocketMist.add(sp);return sp;});   // (air: nothing to pick or bump into; a sprite cannot be raycast without a camera, and the town's rays have none)
 const placePocketMist=()=>{const k=THREE.MathUtils.clamp(state.pocketMist||0,0,1),ph=state.mistPhase||0;pocketMist.visible=k>0&&!!state.show;
  pmPuffs.forEach((sp,i)=>{const s=((ph+i/pmPuffs.length)%1+1)%1,[lx,ly,lz,r]=pocketMistPath(s,pmSeeds[i],PM),w=vendingToWorld(SAKURA_VENDING,[lx,ly,lz]);
   sp.position.set(w[0],w[1],w[2]);sp.scale.setScalar(r*2);sp.material.opacity=k*.72*Math.min(1,s/.1)*Math.min(1,(1-s)/.25);});};
 let dog=null,dream=null;
 // the drinks machine's own lit window and brand (the town's machine at Sakura): dimmed with its compressor's start.
 // Found afresh each time (the town may swap the machine's materials for its cel ones, or hydrate its model): every
 // unlit (basic) material is darkened from its own colour, every glowing one from its own glow.
 const machineObject=()=>{let m=null;world.group.traverse(o=>{if(!m&&o.name==='Harbour vending machine'&&Math.hypot(o.position.x-M.x,o.position.z-M.z)<.3)m=o;});return m;};
 const dimMachine=k=>{const mach=machineObject();if(!mach)return 0;let n=0;
  mach.traverse(o=>{if(!o.isMesh)return;for(const mat of [].concat(o.material)){if(!mat)continue;const u=mat.userData;
   if(mat.isMeshBasicMaterial){u.hwColour??=mat.color.getHex();mat.color.setHex(u.hwColour).multiplyScalar(k);n++;}
   else if(mat.emissive&&(u.hwGlow??=mat.emissiveIntensity)>0){mat.emissiveIntensity=u.hwGlow*k;n++;}}});
  return n;};
 applyCelShading(group);
 group.traverse(o=>{if(o.isMesh){o.castShadow=shadows&&!o.material.transparent;o.receiveShadow=true;}});
 let pinned=false;
 const state={show:false,glow:0,machine:1,cable:'reel',mist:0,pocketMist:0,mistPhase:0,flap:0,pumpkins:false,deco:true,peek:false,can:false,candles:false,riceBall:false,salt:false,bucket:false,dog:false,dream:false};
 const apply=()=>{
  group.visible=!!state.show;if(state.show)placeCatalogue();
  for(const l of lanterns)l.userData.lantern.setGlow(state.glow);
 const g=THREE.MathUtils.clamp(state.glow,0,1);for(const L of pools.children){L.intensity=H.poolIntensity*Math.pow(g,1.2);L.visible=g>0&&!!state.show;}
  reelWay.visible=state.cable==='reel';reel.visible=state.cable==='reel';fixedWay.visible=state.cable==='fixed';rcd.visible=state.cable==='fixed';
  ownCord.visible=!(state.show&&state.cable==='reel');   // the machine on its own socket, except while it is on Kōji's reel
  for(const p of mist.children)p.material.opacity=THREE.MathUtils.clamp(state.mist,0,1);mist.visible=state.mist>0;
  ring.visible=!!state.pumpkins;deco.visible=!!state.deco;peek.visible=!!state.peek;can.visible=!!state.can;candles.visible=!!state.candles;salt.visible=!!state.salt;
  riceBall.visible=state.riceBall==='plate';bucket.visible=!!state.bucket;bucketCans.visible=state.bucket!=='empty';
  if(dog){dog.removeFromParent();dog=null;}
  if(state.dog){const d=state.dog;dog=buildDog({pose:d.pose||'sit'});applyCelShading(dog);dog.position.set(d.at[0],H.ground,d.at[1]);dog.rotation.y=d.yaw??0;group.add(dog);}
  dimMachine(THREE.MathUtils.clamp(state.machine,0,1));
  placePocketMist();machineObject()?.userData.setFlap?.(state.flap||0);
  // Fujita's dream (fujita-dream.js), built the first time a story asks for it: 'dream', or 'pop' (it bursts)
  if(state.dream&&!dream){dream=buildFujitaDream();world.group.add(dream);}
  if(dream){dream.visible=!!state.dream&&!!state.show;if(state.dream)dream.userData.dream.set(state.dream);}
 };
 apply();
 const api={
  group,lanterns,state,batPlaces,
  stage(s={}){pinned=true;Object.assign(state,{show:true},s);apply();return state;},
  release(){pinned=false;},
  /** The season: up from 24 October, the lanterns lit after six (until a story pins a moment). */
  update(minutes){if(pinned||!(minutes>1440*365))return;const {key}=townDate(minutes),h=((minutes%1440)+1440)%1440,on=key>=H.season.from&&key<=H.season.to;
   state.show=on;state.glow=on&&h>=H.season.litFrom?lanternBrightness(reelVolts(false)):0;state.cable='reel';apply();},
 };
 (world.hourly??=[]).push(m=>api.update(m));
 return api;
}
