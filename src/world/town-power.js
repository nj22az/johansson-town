import * as THREE from '../../vendor/three.module.js';
import {createKit} from './okinawa/kit.js';
import {utilityPole,takePowerPlan,drawPlannedPole,SPAN_WIRES,spanWire} from './okinawa/props.js';
import {sagCurve} from './okinawa/kit.js';
import {circleHitsRect} from '../../physics.js';
import {poster} from './okinawa/signs.js';
import {groundHeight} from './layout.js';
import {SCHOOL} from './school-layout.js';
/** A tree's collider is its trunk; its crown spreads well past it. */
const TREE=/fukugi|tree|gajumaru|banyan|palm|pine|crown/i;
/** One 6.6 kV radial network, with the diesel station as its source. */
export function buildTownPower(world,{register,onAction,shadows=false}={}){
 const nodes=[],spans=[];world.group.traverse(o=>{const n=o.userData.powerNetwork;if(n){nodes.push(...n.nodes);spans.push(...n.spans);}});
 const group=new THREE.Group();group.name='Minato power station outgoing feeders';world.group.add(group);const kit=createKit({shadows});
 const solid=c=>world.colliders.push(c);
 // Poles the quarters planned (props.js) join the network here, and are drawn below.
 const planned=takePowerPlan();if(planned)nodes.push(...planned.poles);
 const pole=(x,z,o={})=>{let p;kit.at(0,0,0,()=>{p=utilityPole(kit,x,z,{...o,h:10});solid(p.collider);},groundHeight(x,z));nodes.push(p);return p;};
 const strung=[];
 const link=(a,b,sag=.38)=>{strung.push({a,b,sag});spans.push({from:a.id,to:b.id});};
 for(const s of planned?.spans||[])link(s.a,s.b,s.sag);
 // The outgoing pole beside the cable riser at the power compound's north-west corner (23.34, 32.1, below), on the school
 // ground north of the fence: at (24, 34) it stood inside the school's east corridor column and in the passage beside it.
 const root=pole(23.34,32.75,{transformer:false});root.source=true;
 const nearest=(x,z)=>nodes.reduce((a,b)=>Math.hypot(b.x-x,b.z-z)<Math.hypot(a.x-x,a.z-z)?b:a);
 // Follow the terminal's northern verge; never put a feeder pole through a house.
 const west=nearest(-36.7,20),main=nearest(5,19.6);
 // The middle pole stands on the grass verge east of Well Lane's end: at x -15.5 it stood inside the rubbish cage there
 // (kitahama-quarter.js buildCorner).
 const connector=[west,...[[-39,28],[-13.5,28],[5.2,28]].map(p=>pole(...p,{tel:false})),main];
 for(let i=1;i<connector.length;i++)link(connector[i-1],connector[i]);link(root,connector.at(-2));
 // Aoba Radio, up the hill, is fed by buried cable: a line of poles up an empty slope
 // only cluttered the skyline. The coast feeder follows its landward verge, clear
 // of the Kitahama road centre. Rainflower joins the network at its new town frame.
 const coastal=[nearest(42.25,60),pole(44.7,70,{tel:false})];for(let i=1;i<coastal.length;i++)link(coastal[i-1],coastal[i]);
 // Join the remaining existing street circuits at their nearest poles, subdividing long spans.
 const connected=()=>{const set=new Set([root.id]);let changed=true;while(changed){changed=false;for(const s of spans)if(set.has(s.from)!==set.has(s.to)){set.add(s.from);set.add(s.to);changed=true;}}return set;};
 while(connected().size<nodes.length){const reached=connected();let pair=null,d=Infinity;for(const a of nodes.filter(n=>reached.has(n.id)))for(const b of nodes.filter(n=>!reached.has(n.id))){const m=Math.hypot(a.x-b.x,a.z-b.z);if(m<d){d=m;pair=[a,b];}}
  const [a,b]=pair,count=Math.ceil(d/30);let prior=a;for(let i=1;i<count;i++){const p=pole(a.x+(b.x-a.x)*i/count,a.z+(b.z-a.z)*i/count);link(prior,p);prior=p;}link(prior,b);
 }
 // Draw it: every pole, and every wire that keeps clear of buildings and trees. A wire
 // that would pass through a roof or a crown is left off rather than drawn through it.
 for(const p of planned?.poles||[])drawPlannedPole(kit,p);
 // What a wire could meet, each with its box, so a chord only tests the meshes its own box reaches: the flat ground
 // is never reached (scanning its 140k triangles for every chord was half the town's build). Moving things are left
 // out: the ferry waits out of service at the origin, under Main Street's wires, while the town is built.
 world.group.updateMatrixWorld(true);const wireMeshes=[];
 const collect=o=>{if(o.userData.dynamicProp)return;if(o.isMesh)wireMeshes.push({mesh:o,box:new THREE.Box3().setFromObject(o)});for(const c of o.children)collect(c);};collect(world.group);
 const wireRay=new THREE.Raycaster(),rayA=new THREE.Vector3(),rayB=new THREE.Vector3(),rayDir=new THREE.Vector3(),chordBox=new THREE.Box3(),reached=[];
 const blockers=world.colliders.filter(c=>c.id!=='utility-pole'),clipped=[],wires=[];
 const clear=(from,to,sag)=>{const curve=sagCurve(new THREE.Vector3(...from),new THREE.Vector3(...to),sag*Math.min(1.6,Math.hypot(to[0]-from[0],to[1]-from[1],to[2]-from[2])/14)),v=new THREE.Vector3();
  for(let t=.06;t<.95;t+=.04){curve.getPoint(t,v);for(const c of blockers){const pad=TREE.test(c.id||'')?1.4:.15;if(circleHitsRect(v.x,v.z,pad,c)&&v.y<(c.minY||0)+(c.height??3)+.4&&v.y>(c.minY||0)-.2)return false;}}
  // Chords follow the same public sag curve as the drawn line.
  const length=new THREE.Vector3(...from).distanceTo(new THREE.Vector3(...to)),start=1.4/Math.max(3.08,length);
  for(let t=start;t<1-start-1e-6;t+=.2){curve.getPoint(t,rayA);curve.getPoint(Math.min(1-start,t+.2),rayB);rayDir.subVectors(rayB,rayA);chordBox.makeEmpty().expandByPoint(rayA).expandByPoint(rayB);reached.length=0;for(const w of wireMeshes)if(w.box.intersectsBox(chordBox))reached.push(w.mesh);if(!reached.length)continue;wireRay.far=rayDir.length();wireRay.set(rayA,rayDir.normalize());if(wireRay.intersectObjects(reached,false).length)return false;}
  return true;};
 for(const {a,b,sag} of strung)for(const i of SPAN_WIRES){if(!a.anchors[i]||!b.anchors[i])continue;const w=spanWire(a,b,i,sag);if(clear(w[0],w[1],w[2])){kit.wire(...w);wires.push(w);}else clipped.push(a.id+'>'+b.id+'#'+i);}
 for(const {pole:p,to} of planned?.drops||[])if(p.anchors.at(-1).distanceTo(new THREE.Vector3(...to))<14&&clear(p.anchors.at(-1).toArray(),to,.25))kit.wire(p.anchors.at(-1).toArray(),to,.25,.014,0x2b2a30);
 // Protected outgoing cable and switching gear at the plant, rather than wires with loose ends.
 // Both on the power house's east wall, either side of its steel doors (school.js, 1.9 m wide at ph.door): they stood at
 // z 33.9 and 31, past the building's end (z 29.8), hung in the air over the yard.
 const ph=SCHOOL.powerHouse,SW=ph.minZ+.8,BOARD=ph.maxZ-.9;
 kit.box(.13,.85,.65,ph.maxX+.09,2.15,SW,0x71807d);
 kit.rod([ph.maxX+.15,1.75,SW],[ph.maxX+.15,.1,SW],.05,0x586965);
 kit.rod([23.34,.1,32.1],[23.34,8.9,32.1],.045,0x2b2a30);
 kit.rod([ph.maxX+.15,-.45,SW],[23.34,-.45,32.1],.065,0x2b2a30);
 kit.wire(new THREE.Vector3(23.34,8.9,32.1).toArray(),root.anchors[0].toArray(),.02,.025,0x2b2a30);
 kit.sign(poster({title:'港町発電所',lines:['MINATO POWER STATION','6.6 kV · 島内配電','Island distribution · 1997'],band:'#315c60',bg:'#e9e7d5'}),1.4,.85,ph.maxX+.08,2.35,BOARD,{ry:Math.PI/2,name:'Power distribution board'});
 kit.finish(group,'Island distribution equipment');
 const a=new THREE.Object3D();a.position.set(21,1.3,31);group.add(a);register?.(a,'Read the island power network',()=>onAction?.('read','Minato power station','The two diesel generators feed the island at 6,600 volts through a buried cable to the outgoing pole. The northern feeder serves the terminal and homes; the eastern feeder serves Kitahama and the eastern neighbourhood, and a buried cable runs up the hill to Aoba Radio. Pole transformers reduce the voltage for shops and houses. The station keeps a standby generator for storms.'));
 return {group,source:root.id,nodes,spans,wires,clipped,connected:connected().size};
}
