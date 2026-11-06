import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {BUDGET} from '../edition.js';
import {createLightPools} from '../world/light-pools.js';
import {townAudio} from '../audio/town-audio.js?snappy=1';

/**
 * Tetsuo's electrical bench in the Dock Electrical & Repair Workshop (compact-shops.js, DOCK_WORKSHOP_ROOM, 8.4 × 7 m).
 *
 * The owner sent a three.js "3D Electrical Workshop Diorama" on 20 October 2026: "This should be used to enhance
 * Tetsuo's workshop". Its ideas, translated to a 1997 Okinawan small-town electrician's shop: a steel-legged bench with a
 * timber top and a raised instrument shelf, a green rubber mat, an analogue oscilloscope, a bench supply with moving-coil
 * meters, a soldering station, a handheld meter, a radio on the mat, a clamp lamp, a pegboard with parts drawers and wire
 * spools, the bench's isolating switch beside the distribution board, an exhaust fan, a floor rack of cable drums and a
 * boat battery, a swivel stool and twin-tube fluorescent fittings. Tetsuo is the town's electrician (electrical
 * maintenance since the consolidation; Chin does the mechanical work at the other bench): ship shore-power jobs, Umi-no-yu's
 * electrics, the town's radios and fans.
 *
 * Every piece is data here first (TETSUO_KIT): what it is, who uses it, why it is there and why it stands where it does,
 * so the room, the tests and the stories ask the same questions. Labels on the kit are Japanese where real kit had them;
 * every prompt and description is English.
 *
 * Editions (edition.js, the owner's ruling of 19 October 2026): on Linux (`machinery`) the bench works: the isolating
 * switch, the lamp, the scope's input, the supply's setting, the iron's heater, the drawer and the fan, with their
 * state in one small object (createBenchState) and a click from the town's own blip. On the web it is a display
 * piece, drawn as Linux draws it at work: the supply on, the scope holding a still trace, the lamp lit, the iron warm, and
 * every prompt reads what the thing is instead of working it.
 *
 * Light: no new lights. The room keeps its one point light and its sky light (compact-shops.js); the lamp shows as an
 * emissive bulb and a pool on the mat (light-pools.js), the tubes and pilot lamps as emissive surfaces. Animation is
 * cheap and runs only while the room is entered (the room's ownedUpdate): the scope and the meter's display are redrawn
 * only when what they show changes (a triggered scope's trace stands still), never more than five times a second.
 */

/**
 * Measured against the town's rooms and New Yokosuka (docs/research/new-yokosuka-lessons.md): its rooms' ceilings are
 * 2.4–3.1 m (ours 2.75 m), its counter and work tops 0.8–0.9 m, its narrowest public lane 0.9 m. A 1990s Japanese steel
 * work bench (作業台) is 1.8 or 2.4 m long, 0.75 m deep and 0.74–0.85 m high; Tetsuo works seated on a stool, so his is
 * the 0.85 m bench with a 0.3 m instrument shelf on posts, the scope's screen at a seated eye height of about 1.2 m.
 */
export const TETSUO_BENCH=Object.freeze({
 x:1.3,z:-3.13,width:2.4,depth:.7,top:.85,
 riser:Object.freeze({height:.3,depth:.3,thickness:.03}),
 mat:Object.freeze({x:1.35,z:-3.05,width:1.2,depth:.48}),
 aisle:.9,
 why:'Tetsuo’s half of the back wall, right of the door as you come in: the bench, the instrument shelf and the pegboard face the door, so a customer at the threshold sees his radio opened on the mat, and the isolating switch and the board are an arm’s reach from his stool along the east wall.',
});

/** The radio on the mat runs on four D cells; the supply stands in for them at fresh, tired and flat. */
export const PSU_STEPS=Object.freeze([
 Object.freeze({volts:6.0,amps:.09,cells:'four fresh cells (1.5 V each)',glow:1}),
 Object.freeze({volts:4.8,amps:.08,cells:'four tired cells (1.2 V each)',glow:.55}),
 Object.freeze({volts:3.6,amps:.06,cells:'four flat cells (0.9 V each, the end point)',glow:.2}),
]);

/** What the scope's probe is on (Okinawa Electric supplies 60 Hz, like the rest of western Japan). */
export const SCOPE_MODES=Object.freeze([
 Object.freeze({id:'if',wave:'am',reads:'CH1 0.1 V/DIV · 455 kHz IF',text:'the radio’s 455 kHz intermediate frequency, its envelope swelling with the station’s voice'}),
 Object.freeze({id:'cal',wave:'square',reads:'CH1 0.2 V/DIV · CAL 1 kHz',text:'the scope’s own 1 kHz calibrator, a square wave to set the probe by before anything else'}),
 Object.freeze({id:'ripple',wave:'ripple',reads:'CH1 0.5 V/DIV · 120 Hz RIPPLE',text:'the ripple on the radio’s mains supply after its rectifier, the humps that tell him the smoothing capacitor has dried'}),
 Object.freeze({id:'mains',wave:'sine',reads:'CH1 ×10 · 60 Hz MAINS',text:'Okinawa’s 60 Hz mains through the isolating transformer, a clean sine'}),
]);

const plain=o=>Object.freeze(o);
/**
 * The kit. `operates` names the state an item changes on Linux (null: read only); `where` is room coordinates of its
 * prompt; `owner` is who uses it. `jp` is the label the real thing carried.
 */
export const TETSUO_KIT=Object.freeze([
 plain({id:'bench',mesh:'Tetsuo’s electrical bench',en:'Electrical work bench',jp:'作業台',owner:'Tetsuo',operates:null,where:null,
  why:'Where every small job of the town’s comes apart: a steel frame bolted together, a laminated timber top he can scorch and sand, and a shelf on posts that keeps the instruments at eye height and the top clear for the work.',
  period:'Grey-green angle-steel bench of the 1980s, the kind every Japanese school workshop and electrical shop bought from the same catalogue.'}),
 plain({id:'mat',mesh:'Green rubber bench mat',en:'Rubber bench mat',jp:'導電マット',owner:'Tetsuo',operates:null,where:null,
  why:'Insulating and static-safe: nothing he sets down on it rolls, a dropped screw stays where it fell, and a chassis on it is not standing on bare timber.',
  period:'Green, as Japanese conductive bench mats were before the blue ones came in.'}),
 plain({id:'radio',mesh:'Radio cassette chassis on the mat',en:'Radio on the mat',jp:'修理票 佐藤様',owner:'Tetsuo',operates:null,where:[1.44,1.0,-2.95],
  why:'Mrs Sato’s kitchen radio cassette from Sato Ramen. It hums and drifts off the station, so the case is off and the chassis is on the mat, on the bench supply in place of its four D cells, the scope’s probe on the IF and the multimeter across the battery terminals. The old electrolytic capacitors are coming out.',
  period:'A brown paper-phenolic board on a steel tray: three IF cans with yellow, white and black cores, a tuning gang, a ferrite rod aerial and the dial lamp.'}),
 plain({id:'scope',mesh:'Oscilloscope',en:'Oscilloscope',jp:'オシロスコープ',owner:'Tetsuo',operates:'scope',where:[.68,1.2,-3.1],
  why:'To see a signal rather than guess at it: the radio’s IF, the hum on its supply, the town’s mains. He bought it second-hand from a closed Naha TV shop.',
  period:'An invented Hoshino Keiki HS-5020, 20 MHz and two channels, a green phosphor tube behind a graticule: the analogue scope of every 1980s repair shop.'}),
 plain({id:'psu',mesh:'Bench power supply',en:'Bench power supply',jp:'直流安定化電源',owner:'Tetsuo',operates:'psu',where:[1.82,1.2,-3.1],
  why:'Stands in for the radio’s batteries: he can give it fresh cells, tired cells or flat ones and hear where it starts to distort. The same supply charges the ferry’s emergency lamp packs.',
  period:'An invented Nan’yō Denshi PR-18, 0–18 V and 2 A, with two moving-coil meters, the voltage knob and the red current-limit knob.'}),
 plain({id:'iron',mesh:'Soldering station',en:'Soldering station',jp:'温調はんだごて',owner:'Tetsuo',operates:'iron',where:[.3,1.0,-2.95],
  why:'Temperature-controlled, so the radio’s board does not lift its copper. The iron rests in its coil holder beside the wet sponge; the wisp is flux burning off the tip.',
  period:'An invented Shirasagi SS-30, a cream base with a dial to 450 °C and a heater lamp that blinks as it holds temperature.'}),
 plain({id:'meter',mesh:'Handheld multimeter',en:'Handheld multimeter',jp:'デジタルテスター',owner:'Tetsuo',operates:null,where:null,
  why:'On its leads across the radio’s battery terminals, reading what the supply gives it. It runs on its own 9 V battery, so it reads even when the bench is switched off.',
  period:'An invented Hoshino Keiki DM-31: a yellow holster, a rotary range switch and a 3½-digit LCD.'}),
 plain({id:'lamp',mesh:'Clamp-on arm lamp',en:'Arm lamp',jp:'アームライト',owner:'Tetsuo',operates:'lamp',where:[2.5,1.0,-2.86],
  why:'Clamped to the bench’s front corner, its shade over the mat: the board’s small print and the solder joints need more light than the tubes give.',
  period:'A cream sprung arm lamp with a 60 W bulb, clamped on, as on every draughtsman’s and repairman’s desk of the period.'}),
 plain({id:'drawer',mesh:'Bench tool drawer',en:'Tool drawer',jp:'工具',owner:'Tetsuo',operates:'drawer',where:[2.2,.7,-2.72],
  why:'Under the right of the bench, where his right hand drops to it: pliers, side cutters, the crimper and the screwdrivers he uses on every job.',
  period:'A steel drawer on runners hung under the top, a chrome pull and a masking-tape label.'}),
 plain({id:'pegboard',mesh:'Pegboard',en:'Pegboard and parts drawers',jp:'部品',owner:'Tetsuo',operates:null,where:[1.06,1.4,-3.2],
  why:'Everything has a hook and a drawn outline, so a missing tool shows. The clear drawers hold the parts the town’s radios and fans eat: resistors, capacitors, transistors, fuses, terminals and screws; the two reels are hook-up wire and solder.',
  period:'Perforated hardboard on battens, and a plastic parts cabinet with handwritten drawer labels.'}),
 plain({id:'supply',mesh:'Bench isolating switch',en:'Bench isolating switch',jp:'作業台 電源',owner:'Tetsuo',operates:'supply',where:[3.95,1.2,-1.5],
  why:'Isolates the bench: the strip under the top, the instruments, the iron and the lamp. Before he puts a hand inside anything plugged into the bench he throws it down and hangs his tag on it. Isolate, lock and tag before proving dead.',
  period:'A grey steel switch box with a side lever, a 感電注意 (shock hazard) plate, and the Japanese pilot lamps: red lit for on, green lit for off.'}),
 plain({id:'board',mesh:'Distribution board',en:'Distribution board',jp:'分電盤',owner:'Tetsuo',operates:null,where:[3.95,1.2,-2.1],
  why:'The workshop’s own board: a 60 A main and six branches labelled on masking tape (lighting, bench, sockets, fan, the Form 3D printer, a spare). The yellow and black tape on the floor keeps its front clear.',
  period:'A cream steel cabinet with its conduit run on the wall surface, as small workshops were wired.'}),
 plain({id:'fan',mesh:'Exhaust fan',en:'Exhaust fan',jp:'換気扇',owner:'Tetsuo',operates:'fan',where:[3.35,1.4,-3.05],
  why:'Pulls the flux smoke and the summer heat out through the back wall. It is on its own branch, so it keeps running when the bench is isolated.',
  period:'A 25 cm wall exhaust fan with a pull cord, the same one every Japanese kitchen had.'}),
 plain({id:'rack',mesh:'Cable rack',en:'Cable rack',jp:'スチール棚',owner:'Tetsuo',operates:null,where:[3.8,.85,-2.95],
  why:'Stock for the jobs in town: a drum of grey VVF house cable for Umi-no-yu’s new circuits, coils of IV wire, enamelled copper for rewinding fan motors, and Kōji’s sabani battery on a trickle charge on the floor shelf. Tetsuo’s own radio sits on top for the weather and the late music.',
  period:'A light-grey bolted steel shelf, the drums on their sides so the cable pays off straight.'}),
 plain({id:'stool',mesh:'Swivel stool',en:'Swivel stool',jp:'丸椅子',owner:'Tetsuo',operates:null,where:null,
  why:'Tetsuo works sitting down. It is pushed in at the bench’s left end, in front of the scope, so the mat and the aisle stay clear when he stands.',
  period:'A round steel stool on a screw column with a green vinyl seat.'}),
 plain({id:'tubes',mesh:'Twin-tube fluorescent fitting',en:'Fluorescent fittings',jp:'蛍光灯',owner:'workshop',operates:null,where:null,
  why:'Two twin 40 W fittings on drop rods, one over each half of the room, with the arm lamp for the fine work on the mat. They are on the lighting branch, not the bench, so isolating the bench never puts him in the dark.',
  period:'Bare twin FL40 tubes under a white steel trough, the workshop light of the period.'}),
]);
export const KIT=Object.freeze(Object.fromEntries(TETSUO_KIT.map(k=>[k.id,k])));

/** The solids the bench adds, room coordinates, `w` along x and `d` along z (the room's collider adds nothing). */
export const TETSUO_COLLIDERS=Object.freeze([
 plain({id:'bench',x:1.3,z:-3.13,w:2.43,d:.73,height:.85}),
 plain({id:'stool',x:.8,z:-2.45,w:.42,d:.42,height:.62}),
 plain({id:'rack',x:3.37,z:-3.23,w:1.53,d:.53,height:1.25}),
 plain({id:'board',x:4.09,z:-1.9,w:.24,d:1.12,height:2.05}),
]);

/** One small object holds the bench's state. A web page keeps the display state and never changes it. */
export function createBenchState(){return {supply:true,lamp:true,iron:true,heat:1,scope:0,psu:0,drawer:false,fan:true};}

/** What the switches give: what is lit, what the scope and the meters show. Pure, for the room, the film and the tests. */
export function benchOutputs(state){
 const step=PSU_STEPS[state.psu]||PSU_STEPS[0],live=!!state.supply;
 return {
  lampLit:live&&state.lamp,scopeOn:live,psuOn:live,volts:live?step.volts:0,amps:live?step.amps:0,
  dialLamp:live?step.glow:0,meter:(live?step.volts:0).toFixed(2),ironTarget:live&&state.iron?1:0,
  pilot:live?'red':'green',tagged:!live,strip:live,fan:!!state.fan,mode:SCOPE_MODES[state.scope]||SCOPE_MODES[0],
 };
}

/** The prompt an item shows: what it does on Linux, what it is on the web. */
export function kitLabel(id,state,{machinery=BUDGET.machinery}={}){
 const k=KIT[id];if(!k)return null;
 if(!machinery||!k.operates)return k.id==='radio'?'Look at the radio on the mat':'Look at the '+k.en.toLowerCase();
 switch(k.operates){
  case 'supply':return state.supply?'Switch off the bench supply':'Switch on the bench supply';
  case 'lamp':return state.lamp?'Switch off the arm lamp':'Switch on the arm lamp';
  case 'iron':return state.iron?'Switch off the soldering iron':'Switch on the soldering iron';
  case 'scope':return 'Switch the oscilloscope’s input';
  case 'psu':return 'Set the bench supply';
  case 'drawer':return state.drawer?'Close the tool drawer':'Open the tool drawer';
  case 'fan':return state.fan?'Pull the fan cord: off':'Pull the fan cord: on';
 }
 return null;
}

/**
 * Works one item. On the web (`machinery` off) nothing changes and the answer is what the thing is. On Linux the state
 * changes and the answer is one short line of what happened.
 * @returns {{changed:boolean,text:string}}
 */
export function operateKit(state,id,{machinery=BUDGET.machinery}={}){
 const k=KIT[id];if(!k)return {changed:false,text:''};
 if(!machinery||!k.operates)return {changed:false,text:k.why+'\n\n'+k.period};
 const dead='Nothing: the bench supply is off.';
 switch(k.operates){
  case 'supply':state.supply=!state.supply;return {changed:true,text:state.supply?'Tag off, lever up: the red lamp lights and the bench is live.':'Lever down and the tag on: the green lamp lights and the bench is dead.'};
  case 'lamp':state.lamp=!state.lamp;return {changed:true,text:state.lamp?(state.supply?'The arm lamp lights the mat.':'Switched on, but the bench supply is off.'):'The arm lamp goes out.'};
  case 'iron':state.iron=!state.iron;return {changed:true,text:state.iron?(state.supply?'The heater lamp lights; the tip comes up to 350 °C.':'Switched on, but the bench supply is off.'):'The heater lamp goes out and the tip cools.'};
  case 'scope':if(!state.supply)return {changed:false,text:dead};state.scope=(state.scope+1)%SCOPE_MODES.length;return {changed:true,text:'Probe on '+SCOPE_MODES[state.scope].text+'.'};
  case 'psu':if(!state.supply)return {changed:false,text:dead};state.psu=(state.psu+1)%PSU_STEPS.length;{const s=PSU_STEPS[state.psu];return {changed:true,text:s.volts.toFixed(1)+' V: '+s.cells+'.'};}
  case 'drawer':state.drawer=!state.drawer;return {changed:true,text:state.drawer?'The drawer runs out on its rollers.':'The drawer slides shut.'};
  case 'fan':state.fan=!state.fan;return {changed:true,text:state.fan?'The fan spins up and the shutter opens.':'The fan runs down.'};
 }
 return {changed:false,text:''};
}

// ---- Drawing --------------------------------------------------------------------------------------------------------

/**
 * One canvas for every printed label in the room (maker's plates, tape, the warning plate): one texture, one material.
 * `area` keeps the labels to one rectangle of a canvas shared with other painting (chin-wall.js), in canvas pixels.
 */
export function createLabelAtlas(size=1024,{canvas=null,area=null}={}){
 if(!canvas){canvas=document.createElement('canvas');canvas.width=canvas.height=size;}
 const ctx=canvas.getContext('2d'),CW=canvas.width,CH=canvas.height,[ax,ay,aw,ah]=area||[0,0,CW,CH];
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
 let x=0,y=0,row=0;
 function label(lines,[w,h],{bg='#e9e4d4',fg='#2a2a28',bold=true,scale=900,border=null}={}){
  const pw=Math.min(aw,Math.ceil(w*scale)),ph=Math.min(ah/4,Math.ceil(h*scale));
  if(x+pw>aw){x=0;y+=row+2;row=0;}
  if(y+ph>ah)return null;
  const px=ax+x,py=ay+y;x+=pw+2;row=Math.max(row,ph);
  ctx.fillStyle=bg;ctx.fillRect(px,py,pw,ph);
  if(border){ctx.strokeStyle=border;ctx.lineWidth=Math.max(2,ph*.06);ctx.strokeRect(px+ph*.05,py+ph*.05,pw-ph*.1,ph-ph*.1);}
  ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
  const n=lines.length,fs=Math.floor(ph/(n+.35));ctx.font=(bold?'bold ':'')+fs+'px sans-serif';
  lines.forEach((t,i)=>ctx.fillText(t,px+pw/2,py+ph*(i+.5+.15)/(n+.3),pw*.94));
  const geometry=new THREE.PlaneGeometry(w,h),uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(px+uv.getX(i)*pw)/CW,1-(py+(1-uv.getY(i))*ph)/CH);
  texture.needsUpdate=true;
  return geometry;
 }
 return {texture,material,label};
}

/** Pegboard holes on a 25 mm pitch: one hole per tile, deterministic. */
function pegboardTexture(){
 const n=32,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const d=Math.hypot(x-n/2+.5,y-n/2+.5),hole=d<4.2,i=(y*n+x)*4;data[i]=hole?62:200;data[i+1]=hole?50:171;data[i+2]=hole?38:124;data[i+3]=255;}
 const t=new THREE.DataTexture(data,n,n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}

/** Yellow and black tape (トラテープ) as a border, 50 mm stripes at 45 degrees. */
function tigerTexture(){
 const n=64,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const yellow=Math.floor((x+y)/16)%2===0,i=(y*n+x)*4;data[i]=yellow?236:34;data[i+1]=yellow?190:32;data[i+2]=yellow?48:30;data[i+3]=255;}
 const t=new THREE.DataTexture(data,n,n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;
}

/** A round puff for the flux smoke, drawn as a flat disc. */
function puffTexture(){
 const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
 x.fillStyle='#ffffff';x.beginPath();x.arc(32,32,29,0,Math.PI*2);x.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

function drawScope(ctx,w,h,out){
 ctx.fillStyle=out.scopeOn?'#0c2418':'#1a211d';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle=out.scopeOn?'rgba(120,200,150,.32)':'rgba(120,140,130,.18)';ctx.lineWidth=1;
 for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(i*w/10,0);ctx.lineTo(i*w/10,h);ctx.stroke();}
 for(let i=0;i<=8;i++){ctx.beginPath();ctx.moveTo(0,i*h/8);ctx.lineTo(w,i*h/8);ctx.stroke();}
 if(!out.scopeOn)return;
 const wave=out.mode.wave,mid=h/2,amp=h*.3,level=Math.max(.2,out.dialLamp);
 const y=t=>{
  if(wave==='square')return mid-(Math.floor(t*4)%2?-1:1)*amp*.7;
  if(wave==='sine')return mid-Math.sin(t*Math.PI*2*2.5)*amp;
  if(wave==='ripple')return mid+amp*.6-Math.abs(Math.sin(t*Math.PI*5))*amp*1.1;
  return mid-Math.sin(t*Math.PI*2*38)*amp*level*(.55+.45*Math.sin(t*Math.PI*2*1.5));
 };
 for(const [width,colour] of [[6,'rgba(90,255,140,.22)'],[2,'#9dffb6']]){
  ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.beginPath();
  for(let i=0;i<=w;i+=wave==='am'?1:2){const t=i/w,v=y(t);if(i===0)ctx.moveTo(i,v);else ctx.lineTo(i,v);}
  ctx.stroke();
 }
 ctx.fillStyle='rgba(157,255,182,.85)';ctx.font='bold 13px monospace';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(out.mode.reads,6,4);
}

function drawLCD(ctx,w,h,out){
 ctx.fillStyle='#b7c2a2';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#1d221c';ctx.textAlign='right';ctx.textBaseline='middle';ctx.font='bold '+Math.floor(h*.62)+'px monospace';ctx.fillText(out.meter,w*.86,h*.56);
 ctx.font='bold '+Math.floor(h*.22)+'px sans-serif';ctx.textAlign='left';ctx.fillText('DC V',w*.05,h*.22);
}

/**
 * Builds the bench and its kit into the room.
 * @param {{room:THREE.Object3D,collider:Function,reg:Function,action:Function,budget?:object,sound?:Function}} options
 */
export function buildTetsuoBench({room,collider,reg,action,budget=BUDGET,sound=(f,v)=>townAudio.blip(f,'square',v)}){
 const machinery=!!budget.machinery,state=createBenchState(),B=TETSUO_BENCH,top=B.top;
 const group=new THREE.Group();group.name='Tetsuo’s electrical corner';room.add(group);
 const disposables=[],palette=new Map();
 const flat=(c,{metal=0,rough=.72}={})=>{const k=c+'/'+metal;if(!palette.has(k))palette.set(k,new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal}));return palette.get(k);};
 const glow=(c,e,i=0)=>new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:i,roughness:.5});
 const mesh=(name,geometry,material,pos,parent=group,rot)=>{const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(...pos);if(rot)m.rotation.set(...rot);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 const box=(name,size,pos,c,parent,rot)=>mesh(name,new THREE.BoxGeometry(...size),typeof c==='number'?flat(c):c,pos,parent,rot);
 const cyl=(name,r1,r2,h,pos,c,parent,rot,seg=14)=>mesh(name,new THREE.CylinderGeometry(r1,r2,h,seg),typeof c==='number'?flat(c):c,pos,parent,rot);
 const up=new THREE.Vector3(0,1,0);
 function wire(name,a,b,r,c,parent=group){const A=new THREE.Vector3(...a),Bv=new THREE.Vector3(...b),len=A.distanceTo(Bv);const m=cyl(name,r,r,len,[0,0,0],c,parent,null,6);m.position.copy(A).add(Bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(up,Bv.clone().sub(A).normalize());m.castShadow=false;return m;}
 const atlas=createLabelAtlas();disposables.push(atlas.texture,atlas.material);
 function plate(name,lines,size,pos,opts={},rotY=0,parent=group){const g=atlas.label(lines,size,opts);if(!g)return null;const m=new THREE.Mesh(g,atlas.material);m.name=name;m.position.set(...pos);m.rotation.y=rotY;parent.add(m);return m;}

 // ---- The bench: steel frame, timber top, instrument shelf -------------------------------------------------------
 const STEEL=0x8a9a8f,TIMBER=0xb98d5c,x0=B.x-B.width/2,x1=B.x+B.width/2,zb=B.z-B.depth/2,zf=B.z+B.depth/2;
 const bench=new THREE.Group();bench.name=KIT.bench.mesh;group.add(bench);
 box('Bench top (laminated timber)',[B.width,.04,B.depth],[B.x,top-.02,B.z],TIMBER,bench);
 for(const x of [x0+.04,x1-.04])for(const z of [zb+.04,zf-.04])box('Bench leg (steel)',[.045,top-.04,.045],[x,(top-.04)/2,z],STEEL,bench);
 for(const z of [zb+.04,zf-.04])box('Bench rail (steel)',[B.width-.06,.05,.035],[B.x,top-.065,z],STEEL,bench);
 for(const x of [x0+.04,x1-.04])box('Bench end rail (steel)',[.035,.05,B.depth-.06],[x,top-.065,B.z],STEEL,bench);
 box('Bench lower shelf (steel)',[B.width-.06,.025,.38],[B.x,.15,zb+.22],STEEL,bench);
 box('Box of spare valves and parts',[.42,.2,.3],[B.x-.55,.27,zb+.2],0xb59866,bench);
 const shelfY=top+B.riser.height,rz=zb+B.riser.depth/2;
 box('Instrument shelf',[B.width,B.riser.thickness,B.riser.depth],[B.x,shelfY-B.riser.thickness/2,rz],STEEL,bench);
 for(const x of [x0+.03,B.x,x1-.03])box('Instrument shelf post',[.035,B.riser.height-B.riser.thickness,.035],[x,top+(B.riser.height-B.riser.thickness)/2,zb+.05],STEEL,bench);
 collider(B.x,B.z,B.width+.03,B.depth+.03,top);

 // Power strip on the apron, a lit rocker per outlet (they glow while the bench is live).
 const strip=new THREE.Group();strip.name='Bench power strip';group.add(strip);
 box('Power strip body',[.44,.05,.045],[.62,top-.11,zf+.005],0xe7e2d2,strip);
 const rockers=glow(0xd8582f,0xff6a2a,0);
 for(let i=0;i<4;i++){box('Power strip outlet',[.045,.03,.004],[.46+i*.1,top-.105,zf+.029],0x3b3b38,strip);box('Power strip switch',[.022,.016,.008],[.5+i*.1,top-.105,zf+.031],rockers,strip);}

 // ---- The mat and the job on it ------------------------------------------------------------------------------------
 const M=B.mat,mat=new THREE.Group();mat.name=KIT.mat.mesh;group.add(mat);box('Rubber mat',[M.width,.006,M.depth],[M.x,top+.003,M.z],0x3f6f5a,mat);
 const radio=new THREE.Group();radio.name=KIT.radio.mesh;radio.position.set(1.42,top+.006,-3.0);radio.rotation.y=-.08;group.add(radio);
 box('Radio chassis tray',[.32,.02,.19],[0,.01,0],0xa9aeaa,radio);
 box('Radio circuit board (paper phenolic)',[.29,.006,.16],[0,.023,0],0xb8935a,radio);
 box('Radio tuning gang',[.06,.045,.045],[-.09,.048,-.03],0xc9ccc8,radio);
 [[0xe6c94a,.0],[0xf2efe6,.03],[0x2c2c2a,.06]].forEach(([c,dx],i)=>{box('Radio IF can',[.014,.016,.014],[.0+dx,.034,-.04],0xd5d8d4,radio);box('IF can core '+(i+1),[.008,.003,.008],[.0+dx,.0435,-.04],c,radio);});
 for(let i=0;i<4;i++)cyl('Radio electrolytic capacitor',.007,.007,.02,[.07+i*.022,.036,.035],i%2?0x2b3a63:0x1e1f22,radio,null,10);
 cyl('Radio ferrite rod aerial',.005,.005,.15,[0,.034,.065],0x3d3d3a,radio,[0,0,Math.PI/2],8);
 cyl('Aerial coil',.008,.008,.035,[-.03,.034,.065],0xb8733c,radio,[0,0,Math.PI/2],10);
 box('Radio output transformer',[.025,.022,.02],[.11,.037,-.04],0x585a55,radio);
 const dial=glow(0xffe4a8,0xffb84a,0);cyl('Radio dial lamp',.005,.005,.01,[-.13,.032,.05],dial,radio,null,8);
 cyl('Radio speaker (out of the case)',.055,.04,.03,[.0,.015,-.0],0x2a2a28,radio,null,18).position.set(.29,.015,-.02);
 box('Radio cabinet (open, beside the chassis)',[.3,.17,.075],[.98,top+.091,-3.2],0xd9cdb0,group,[0,.12,0]);
 box('Radio cabinet speaker grille',[.13,.11,.004],[.93,top+.1,-3.16],0x5b5249,group,[0,.12,0]);
 plate('Repair tag (Mrs Sato)',['修理票','佐藤様 ラジカセ','10/18 ハム・受信不良'],[.07,.05],[1.12,top+.0075,-2.88],{bg:'#f3edd6',fg:'#3a3a35',bold:false,scale:1400},0).rotation.set(-Math.PI/2,0,.25);

 // Handheld multimeter on its leads.
 const meter=new THREE.Group();meter.name=KIT.meter.mesh;meter.position.set(1.85,top+.006,-2.93);meter.rotation.y=.25;group.add(meter);
 box('Multimeter holster',[.088,.03,.165],[0,.015,0],0xe7c03a,meter);
 cyl('Multimeter range switch',.022,.022,.012,[0,.034,.03],0x1e1f22,meter,null,16);
 const lcdCanvas=document.createElement('canvas');lcdCanvas.width=128;lcdCanvas.height=56;const lcdCtx=lcdCanvas.getContext('2d');
 const lcdTexture=new THREE.CanvasTexture(lcdCanvas);lcdTexture.colorSpace=THREE.SRGBColorSpace;const lcdMat=new THREE.MeshBasicMaterial({map:lcdTexture,toneMapped:false});disposables.push(lcdTexture,lcdMat);
 mesh('Multimeter display',new THREE.PlaneGeometry(.066,.029),lcdMat,[0,.0305,-.045],meter,[-Math.PI/2,0,0]);
 plate('Multimeter maker',['HOSHINO DM-31'],[.06,.01],[0,.0305,-.013],{bg:'#e7c03a',fg:'#2a2a28',scale:1800},0,meter).rotation.x=-Math.PI/2;
 wire('Multimeter red lead',[1.87,top+.02,-3.0],[1.56,top+.03,-2.97],.0025,0xc8302c);wire('Multimeter black lead',[1.84,top+.02,-3.0],[1.55,top+.03,-3.03],.0025,0x1e1e1e);

 // ---- The instrument shelf: the scope, a can of contact cleaner, the supply and the workshop radio ------------------
 const scope=new THREE.Group();scope.name=KIT.scope.mesh;scope.position.set(.62,shelfY,zb+.15);group.add(scope);
 box('Oscilloscope case',[.36,.21,.28],[0,.105,0],0xa9b6b6,scope);
 box('Oscilloscope front panel',[.355,.2,.006],[0,.105,.142],0x5f6a6b,scope);
 box('Oscilloscope screen bezel',[.15,.125,.012],[-.085,.115,.146],0x1f2423,scope);
 const scopeCanvas=document.createElement('canvas');scopeCanvas.width=256;scopeCanvas.height=208;const scopeCtx=scopeCanvas.getContext('2d');
 const scopeTexture=new THREE.CanvasTexture(scopeCanvas);scopeTexture.colorSpace=THREE.SRGBColorSpace;const scopeMat=new THREE.MeshBasicMaterial({map:scopeTexture,toneMapped:false});disposables.push(scopeTexture,scopeMat);
 mesh('Oscilloscope CRT screen',new THREE.PlaneGeometry(.124,.1),scopeMat,[-.085,.115,.1525],scope);
 for(let i=0;i<6;i++)cyl('Oscilloscope knob',.011,.011,.014,[.03+(i%3)*.045,.165-Math.floor(i/3)*.06,.15],i===2?0xc8302c:0x2a2c2b,scope,[Math.PI/2,0,0],12);
 cyl('Oscilloscope BNC input',.008,.008,.016,[.075,.035,.152],0xd9dbd6,scope,[Math.PI/2,0,0],10);
 const scopePower=glow(0x5a1a14,0xff3b2a,0);box('Oscilloscope power lamp',[.008,.008,.004],[.145,.035,.146],scopePower,scope);
 plate('Oscilloscope maker',['HOSHINO KEIKI  HS-5020  20MHz'],[.16,.012],[-.085,.033,.1465],{bg:'#5f6a6b',fg:'#e8ece6',scale:1600},0,scope);
 wire('Scope probe lead',[.7,shelfY+.035,zb+.31],[1.36,top+.035,-2.98],.003,0x2a2c2b);
 cyl('Contact cleaner can',.024,.024,.17,[1.2,shelfY+.085,zb+.12],0xd9d4c7,group,null,12);cyl('Contact cleaner cap',.02,.02,.03,[1.2,shelfY+.185,zb+.12],0xc8302c,group,null,12);

 const psu=new THREE.Group();psu.name=KIT.psu.mesh;psu.position.set(1.82,shelfY,zb+.15);group.add(psu);
 box('Bench supply case',[.26,.15,.26],[0,.075,0],0xcfccbf,psu);box('Bench supply front panel',[.255,.145,.006],[0,.075,.132],0x55605c,psu);
 const needles=[];
 for(const [dx,unit] of [[-.06,'V'],[.06,'A']]){
  plate('Bench supply meter face '+unit,[unit],[.085,.06],[dx,.105,.1365],{bg:'#f4f0e2',fg:'#2a2a28',scale:900,border:'#2a2a28'},0,psu);
  const pivot=new THREE.Group();pivot.name='Bench supply '+unit+' needle';pivot.userData.live=true;pivot.position.set(dx,.08,.138);psu.add(pivot);
  box('Meter needle',[.0025,.045,.001],[0,.0225,0],0xc8302c,pivot);needles.push(pivot);
 }
 cyl('Bench supply voltage knob',.014,.014,.016,[-.07,.035,.14],0x2a2c2b,psu,[Math.PI/2,0,0],14);cyl('Bench supply current-limit knob',.012,.012,.016,[-.025,.035,.14],0xc8302c,psu,[Math.PI/2,0,0],14);
 cyl('Bench supply red terminal',.008,.008,.018,[.045,.032,.142],0xc8302c,psu,[Math.PI/2,0,0],10);cyl('Bench supply black terminal',.008,.008,.018,[.085,.032,.142],0x1e1e1e,psu,[Math.PI/2,0,0],10);
 const cvLamp=glow(0x1d4a26,0x46ff6a,0);box('Bench supply C.V. lamp',[.01,.008,.004],[.11,.06,.136],cvLamp,psu);
 plate('Bench supply maker',['NAN’YŌ DENSHI  PR-18  0–18V 2A'],[.2,.011],[0,.142,.1365],{bg:'#55605c',fg:'#eef0ea',scale:1600},0,psu);
 wire('Supply red lead',[1.865,shelfY+.032,zb+.3],[1.3,top+.035,-2.93],.003,0xc8302c);wire('Supply black lead',[1.905,shelfY+.032,zb+.3],[1.28,top+.035,-2.96],.003,0x1e1e1e);

 const shopRadio=new THREE.Group();shopRadio.name='Workshop radio';shopRadio.position.set(2.92,1.03,-3.3);group.add(shopRadio);
 box('Workshop radio case',[.24,.14,.08],[0,.07,0],0xd8c6a0,shopRadio);box('Workshop radio grille',[.11,.09,.004],[-.05,.07,.041],0x6a5a48,shopRadio);
 box('Workshop radio dial',[.08,.03,.004],[.06,.095,.041],0xf2e3b8,shopRadio);cyl('Workshop radio aerial',.003,.003,.32,[.1,.2,-.02],0xcfd2d0,shopRadio,[0,0,-.35],6);

 // ---- The soldering station -----------------------------------------------------------------------------------------
 const solder=new THREE.Group();solder.name=KIT.iron.mesh;solder.position.set(.36,top,-2.98);group.add(solder);
 box('Soldering station base',[.13,.09,.16],[0,.045,0],0xe6dfc9,solder);box('Soldering station panel',[.125,.07,.004],[0,.045,.081],0x3d4441,solder);
 cyl('Soldering station temperature dial',.02,.02,.012,[-.02,.045,.087],0xe6dfc9,solder,[Math.PI/2,0,0],16);
 const heater=glow(0x5a2a14,0xff7a2a,0);box('Soldering station heater lamp',[.01,.008,.004],[.04,.06,.084],heater,solder);
 plate('Soldering station maker',['SHIRASAGI SS-30'],[.1,.012],[0,.0815,.0835],{bg:'#3d4441',fg:'#f1ece0',scale:1600},0,solder);
 box('Iron holder foot',[.08,.012,.1],[.13,.006,.0],0x3a3d3c,solder);box('Tip-cleaning sponge',[.05,.012,.04],[.13,.018,.03],0xe6c84a,solder);
 const holder=cyl('Iron holder coil',.022,.016,.13,[.13,.075,-.025],0x9ea3a1,solder,[-.7,0,0],12);holder.material=flat(0x9ea3a1,{metal:.4,rough:.4});
 const iron=new THREE.Group();iron.name='Soldering iron';iron.userData.live=true;iron.position.set(.13,.075,-.025);iron.rotation.x=-.7;solder.add(iron);
 cyl('Soldering iron handle',.013,.011,.11,[0,.08,0],0x3c5a6a,iron,null,12);cyl('Soldering iron barrel',.0055,.0055,.08,[0,-.01,0],0xc9ccc8,iron,null,10);
 const tipMat=glow(0x8a7a6a,0xff6a1a,0);const tip=cyl('Soldering iron tip',.0045,.0008,.03,[0,-.065,0],tipMat,iron,null,10);
 wire('Soldering iron cord',[.36+.13,top+.15,-2.98-.02],[.36+.05,top+.03,-2.98-.07],.004,0x2a2a28);
 const puff=puffTexture();disposables.push(puff);const smoke=[];
 for(let i=0;i<3;i++){// Cartoon puffs: alpha-tested discs that swell and shrink as they rise (a soft fade reads as nothing through the grade).
  const m=new THREE.SpriteMaterial({map:puff,alphaTest:.5,color:0xd9dde0});disposables.push(m);const s=new THREE.Sprite(m);s.name='Flux smoke';s.scale.setScalar(.03);s.raycast=()=>{};group.add(s);smoke.push(s);}
 const tipWorld=new THREE.Vector3();
 /** The wisp: three puffs a third of a cycle apart, rising 20 cm from the holder's mouth every three seconds. */

 // ---- The clamp-on arm lamp: clamped to the front-right corner, its shade over the mat ------------------------------
 const lamp=new THREE.Group();lamp.name=KIT.lamp.mesh;group.add(lamp);
 const CREAM=0xe8e2cf,base=[x1-.06,top,zf-.06],elbow=[2.18,top+.62,zf-.14],head=[1.5,top+.42,-2.93];
 box('Lamp clamp',[.05,.07,.06],[base[0],top-.02,base[2]],0x6a6e6c,lamp);cyl('Lamp post',.012,.012,.16,[base[0],top+.08,base[2]],CREAM,lamp,null,10);
 for(const o of [-.012,.012]){wire('Lamp arm',[base[0],top+.16,base[2]+o],[elbow[0],elbow[1],elbow[2]+o],.006,CREAM,lamp);wire('Lamp forearm',[elbow[0],elbow[1],elbow[2]+o],[head[0]+.05,head[1]+.05,head[2]+o],.006,CREAM,lamp);}
 cyl('Lamp elbow spring',.012,.012,.05,elbow,0x9ea3a1,lamp,[Math.PI/2,0,0],10);
 const shadeMat=new THREE.MeshStandardMaterial({color:CREAM,roughness:.55,side:THREE.DoubleSide});
 const shade=mesh('Lamp shade',new THREE.CylinderGeometry(.03,.075,.1,18,1,true),shadeMat,head,lamp,[.15,0,-.18]);
 const bulbMat=glow(0xfff4d6,0xffe2a8,0);mesh('Lamp bulb',new THREE.SphereGeometry(.028,12,8),bulbMat,[head[0]+.01,head[1]-.02,head[2]],lamp);
 const pools=createLightPools(group,[{x:head[0]-.03,y:top+.007-.06,z:head[2]-.05,radius:.32}],{color:0xfff0cc,strength:.42});pools.group.name='Arm lamp pool on the mat';pools.group.userData.live=true;

 // ---- The tool drawer under the right of the bench ------------------------------------------------------------------
 const DX=2.15,DW=.5;box('Drawer housing side',[.01,.1,.5],[DX-DW/2-.005,top-.1,zf-.27],STEEL,bench);box('Drawer housing side',[.01,.1,.5],[DX+DW/2+.005,top-.1,zf-.27],STEEL,bench);
 const drawer=new THREE.Group();drawer.name=KIT.drawer.mesh;drawer.userData.live=true;drawer.position.set(DX,top-.105,zf-.27);group.add(drawer);
 box('Drawer bottom',[DW-.01,.008,.48],[0,-.04,0],0x7f8c84,drawer);for(const s of [-1,1])box('Drawer side',[.008,.07,.48],[s*(DW/2-.01),-.005,0],0x7f8c84,drawer);box('Drawer back',[DW-.01,.07,.008],[0,-.005,-.235],0x7f8c84,drawer);
 box('Drawer front',[DW+.01,.09,.015],[0,0,.245],0x9aa79f,drawer);box('Drawer pull',[.12,.012,.02],[0,.01,.262],flat(0xd6d8d4,{metal:.6,rough:.3}),drawer);
 plate('Drawer label',['工具'],[.05,.02],[-.17,.012,.2535],{bg:'#efe2b6',fg:'#2a2a28',scale:1200},0,drawer);
 box('Pliers in the drawer',[.03,.012,.16],[-.12,-.03,.08],0xc8302c,drawer);box('Side cutters in the drawer',[.03,.012,.13],[-.06,-.03,.1],0x2b5aa0,drawer);
 box('Crimper in the drawer',[.035,.014,.2],[.03,-.03,.05],0xe6c84a,drawer);for(let i=0;i<4;i++)box('Screwdriver in the drawer',[.016,.016,.18],[.12+i*.025,-.028,.04],[0xc8302c,0xe6c84a,0x2b5aa0,0x3f6f5a][i],drawer);

 // ---- Pegboard, parts drawers and wire reels on the back wall ------------------------------------------------------
 const peg=pegboardTexture();disposables.push(peg);peg.repeat.set(B.width/.025,.76/.025);
 const pegMat=new THREE.MeshStandardMaterial({map:peg,roughness:.9});
 const pegboard=new THREE.Group();pegboard.name=KIT.pegboard.mesh;pegboard.userData.wall=true;group.add(pegboard);
 mesh('Pegboard (perforated hardboard)',new THREE.BoxGeometry(B.width-.04,.76,.012),pegMat,[B.x,1.86,-3.488],pegboard);
 const tools=[['Long-nose pliers',.03,.17,0xc8302c],['Side cutters',.03,.13,0x2b5aa0],['Wire strippers',.035,.18,0xe6c84a],['Crimping tool',.04,.22,0x2a2c2b],['Adjustable spanner',.035,.2,0xb7bcb9]];
 tools.forEach(([n,w,h,c],i)=>{const x=.25+i*.13;box(n+' outline',[w+.02,h+.02,.002],[x,1.93,-3.481],0x8f7653,pegboard);box(n,[w,h,.015],[x,1.93,-3.473],c,pegboard);});
 for(let i=0;i<6;i++){const x=1.38+i*.05;box('Screwdriver handle',[.022,.08,.022],[x,2.0,-3.47],[0xc8302c,0xe6c84a,0x2b5aa0,0xc8302c,0xe6c84a,0x2b5aa0][i],pegboard);box('Screwdriver shaft',[.006,.1,.006],[x,1.91,-3.47],0xc9ccc8,pegboard);}
 // The reels turn on one rod across two pegboard brackets, so wire and solder pay off straight down to the bench.
 for(const x of [1.78,2.32])box('Reel rod bracket',[.012,.012,.09],[x,2.06,-3.437],0x9ea3a1,pegboard);cyl('Reel rod',.005,.005,.56,[2.05,2.06,-3.4],0xc9ccc8,pegboard,[0,0,Math.PI/2],6);
 for(const [x,c,n] of [[1.92,0xc8302c,'Hook-up wire reel'],[2.07,0x2b5aa0,'Hook-up wire reel'],[2.2,0xc9ccc8,'Solder reel']]){cyl(n,.042,.042,.07,[x,2.06,-3.4],c,pegboard,[0,0,Math.PI/2],16);for(const s of [-1,1])cyl(n+' flange',.05,.05,.006,[x+s*.038,2.06,-3.4],0x4a4f4c,pegboard,[0,0,Math.PI/2],16);}
 const parts=new THREE.Group();parts.name='Parts drawers';pegboard.add(parts);
 box('Parts cabinet',[.4,.5,.15],[1.05,1.8,-3.405],0xd8d4c6,parts);
 const partLabels=['抵抗','コンデンサ','電解コン','トランジスタ','ダイオード','IC','ヒューズ','端子','ネジ','ワッシャ','結束バンド','ランプ','ボリューム','スイッチ','ベルト'];
 partLabels.forEach((t,i)=>{const cx=1.05+(i%3-1)*.125,cy=1.99-Math.floor(i/3)*.095;box('Parts drawer',[.115,.085,.012],[cx,cy,-3.326],0xe8f0ee,parts);plate('Parts drawer label',[t],[.07,.018],[cx,cy+.018,-3.3195],{bg:'#fbf6e6',fg:'#2a2a28',bold:false,scale:1400},0,parts);});

 // ---- The bench isolating switch and the distribution board on the east wall ----------------------------------------
 const WX=4.2,board=new THREE.Group();board.name=KIT.board.mesh;board.userData.wall=true;group.add(board);
 box('Distribution board cabinet',[.11,.48,.38],[WX-.055,1.75,-2.25],0xe2ddca,board);
 box('Distribution board cover',[.006,.44,.34],[WX-.113,1.75,-2.25],0xd6d0bb,board);
 box('Main breaker',[.02,.13,.09],[WX-.12,1.88,-2.25],0x3d4441,board);plate('Main breaker label',['主幹 60A'],[.08,.02],[WX-.117,1.97,-2.25],{bg:'#f6f2e4',scale:1400},-Math.PI/2,board);
 ['照明','作業台','コンセント','換気扇','3Dプリンタ','予備'].forEach((t,i)=>{const z=-2.39+i*.055;box('Branch breaker',[.02,.07,.045],[WX-.12,1.7,z],0x3d4441,board);box('Branch breaker toggle',[.012,.02,.014],[WX-.132,1.71,z],0xf0ede4,board);plate('Branch label (masking tape)',[t],[.05,.016],[WX-.117,1.62,z],{bg:'#efe2b6',fg:'#2a2a28',bold:false,scale:1600},-Math.PI/2,board);});
 plate('Board notice',['分電盤前に','物を置かないこと'],[.18,.07],[WX-.003,1.42,-2.25],{bg:'#fbf8ee',fg:'#24324a',scale:1000},-Math.PI/2,board);
 plate('Electrical safety checklist',['WORK SAFE','1 ISOLATE  2 LOCK & TAG','3 PROVE DEAD  4 TEST'],[.2,.12],[WX-.003,1.42,-2.66],{bg:'#fbf8ee',fg:'#24324a',scale:900},-Math.PI/2,board);
 const sw=new THREE.Group();sw.name=KIT.supply.mesh;sw.userData.wall=true;group.add(sw);
 box('Isolating switch box',[.16,.32,.22],[WX-.08,1.45,-1.62],0x8c9696,sw);
 plate('Shock hazard plate',['感電注意'],[.12,.045],[WX-.162,1.47,-1.62],{bg:'#f2c230',fg:'#1e1e1e',scale:900,border:'#1e1e1e'},-Math.PI/2,sw);
 plate('Switch label',['作業台 電源 3φ200V / 1φ100V'],[.18,.022],[WX-.162,1.36,-1.62],{bg:'#f6f2e4',scale:1300},-Math.PI/2,sw);
 const pilotOn=glow(0x5a1a14,0xff3b2a,0),pilotOff=glow(0x1d4a26,0x46ff6a,0);
 cyl('Pilot lamp (red, on)',.016,.016,.02,[WX-.17,1.585,-1.67],pilotOn,sw,[0,0,Math.PI/2],12);cyl('Pilot lamp (green, off)',.016,.016,.02,[WX-.17,1.585,-1.57],pilotOff,sw,[0,0,Math.PI/2],12);
 plate('Pilot lamp label',['入      切'],[.12,.02],[WX-.162,1.545,-1.62],{bg:'#8c9696',fg:'#f6f2e4',scale:1300},-Math.PI/2,sw);
 const lever=new THREE.Group();lever.name='Isolating switch lever';lever.userData.live=true;lever.position.set(WX-.09,1.45,-1.505);sw.add(lever);
 box('Lever boss',[.05,.05,.02],[0,0,0],0x5b6264,lever);box('Lever arm',[.022,.17,.016],[0,.085,.006],0x5b6264,lever);box('Lever grip',[.03,.06,.03],[0,.17,.006],0x1e1e1e,lever);
 // Hung from the lock hole at the lever's foot while the lever is down: it hangs straight, whatever the lever does.
 const tag=new THREE.Group();tag.name='Lock-out tag';tag.userData.live=true;tag.position.set(WX-.172,1.33,-1.49);sw.add(tag);
 box('Padlock',[.018,.04,.035],[0,-.02,0],0xc8302c,tag);box('Padlock shackle',[.006,.03,.02],[0,.012,0],0xc9ccc8,tag);plate('Lock-out tag card',['操作禁止','作業中 知念'],[.07,.1],[-.012,-.1,0],{bg:'#d23a2e',fg:'#ffffff',scale:1000},-Math.PI/2,tag);
 // Conduit on the wall surface from the board and the switch up to the ceiling and back along the walls to the bench.
 for(const [a,b] of [[[WX-.03,1.99,-2.25],[WX-.03,2.68,-2.25]],[[WX-.03,1.61,-1.66],[WX-.03,2.68,-1.66]],[[WX-.03,2.68,-1.66],[WX-.03,2.68,-3.47]],[[WX-.03,2.68,-3.47],[2.3,2.68,-3.47]],[[2.3,2.68,-3.47],[2.3,2.34,-3.47]]])wire('Steel conduit',a,b,.011,0x9aa19d,board);
 box('Conduit junction box',[.09,.09,.04],[2.3,2.3,-3.46],0x9aa19d,board);
 const tiger=tigerTexture();disposables.push(tiger);
 const keep=new THREE.Group();keep.name='Keep-clear tape in front of the board';group.add(keep);
 for(const [w,d,x,z] of [[.8,.05,3.8,-2.48],[.8,.05,3.8,-1.32],[.05,1.11,3.425,-1.9]]){const t=tiger.clone();t.needsUpdate=true;t.repeat.set(w/.1,d/.1);disposables.push(t);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({map:t,roughness:.8}));m.name='Floor tape';m.rotation.x=-Math.PI/2;m.position.set(x,.004,z);m.receiveShadow=true;keep.add(m);}
 collider(4.09,-1.9,.24,1.12,2.05);

 // ---- The exhaust fan above the rack ------------------------------------------------------------------------------
 const fan=new THREE.Group();fan.name=KIT.fan.mesh;fan.userData.wall=true;fan.position.set(3.37,2.1,-3.47);group.add(fan);
 box('Exhaust fan frame',[.38,.38,.05],[0,0,.0],0xece6d4,fan);cyl('Exhaust fan opening',.15,.15,.012,[0,0,.022],0x2c302e,fan,[Math.PI/2,0,0],20);
 const blades=new THREE.Group();blades.name='Exhaust fan blades';blades.userData.live=true;blades.position.set(0,0,.035);fan.add(blades);
 for(let i=0;i<3;i++){const arm=new THREE.Group();arm.rotation.z=i*Math.PI*2/3;blades.add(arm);box('Exhaust fan blade',[.05,.13,.006],[0,.07,0],0xd9d4c4,arm,[0,.35,0]);}
 cyl('Exhaust fan hub',.025,.025,.02,[0,0,.04],0xb8b2a2,fan,[Math.PI/2,0,0],12);
 for(let i=0;i<5;i++)box('Exhaust fan guard bar',[.3,.006,.006],[0,-.12+i*.06,.05],0xd6d0bc,fan);
 wire('Fan pull cord',[3.52,1.93,-3.43],[3.52,1.6,-3.43],.0015,0xf0ede4);cyl('Fan cord knob',.01,.01,.025,[3.52,1.59,-3.43],0xe6c84a,group,null,8);

 // ---- The floor rack in the back-right corner ----------------------------------------------------------------------
 const rack=new THREE.Group();rack.name=KIT.rack.mesh;group.add(rack);
 const RX=3.37,RZ=-3.23,RW=1.5,RD=.5,RACK=0xb9c0bd;
 for(const sx of [-1,1])for(const sz of [-1,1])box('Rack post (angle steel)',[.035,1.22,.035],[RX+sx*(RW/2-.02),.61,RZ+sz*(RD/2-.02)],RACK,rack);
 for(const y of [.08,.55,1.02])box('Rack shelf',[RW,.02,RD],[RX,y,RZ],RACK,rack);
 const drum=new THREE.Group();drum.name='VVF cable drum';drum.position.set(RX-.4,.56+.19,RZ);drum.rotation.z=Math.PI/2;rack.add(drum);
 cyl('Drum flange',.19,.19,.02,[0,.12,0],0xa57b4f,drum,null,20);cyl('Drum flange',.19,.19,.02,[0,-.12,0],0xa57b4f,drum,null,20);cyl('VVF cable on the drum',.15,.15,.22,[0,0,0],0x9ea2a0,drum,null,20);
 plate('Drum label',['VVF 2.0-2C 100m'],[.12,.03],[RX-.4,.75,RZ+.191],{bg:'#f6f2e4',scale:1300},0,rack);
 [[0xc8302c,.0],[0xf0ede4,.06],[0x1e1e1e,.12]].forEach(([c,dy])=>cyl('IV wire coil',.11,.11,.05,[RX+.25,.585+dy,RZ+.02],c,rack,null,18));
 cyl('Enamelled copper wire bobbin',.06,.06,.1,[RX+.45,1.08,RZ],0xb87333,rack,null,16);cyl('Enamelled copper wire bobbin',.05,.05,.09,[RX+.3,1.075,RZ+.05],0xc0803f,rack,null,16);
 cyl('Steel tie-wire coil',.1,.1,.04,[RX+.05,1.05,RZ],0x7c8582,rack,null,18);
 box('Boat battery case',[.34,.22,.18],[RX-.35,.2,RZ],0x1f2224,rack);box('Battery terminal (positive)',[.025,.025,.025],[RX-.45,.325,RZ],0xc8302c,rack);box('Battery terminal (negative)',[.025,.025,.025],[RX-.25,.325,RZ],0x2a2a28,rack);
 plate('Battery tag',['12V  コウジ サバニ'],[.12,.03],[RX-.35,.2,RZ+.091],{bg:'#f6f2e4',scale:1300},0,rack);
 box('Trickle charger',[.18,.1,.14],[RX+.1,.14,RZ],0xc7c3b6,rack);const charge=glow(0x4a3a14,0xffb02a,0);box('Charger lamp',[.012,.012,.004],[RX+.15,.16,RZ+.071],charge,rack);
 wire('Charger lead',[RX+.02,.17,RZ+.05],[RX-.45,.34,RZ],.004,0xc8302c,rack);
 collider(RX,RZ,RW+.03,RD+.03,1.25);

 // ---- The swivel stool ---------------------------------------------------------------------------------------------
 const stool=new THREE.Group();stool.name=KIT.stool.mesh;stool.position.set(.8,0,-2.45);group.add(stool);
 cyl('Stool base',.2,.22,.03,[0,.015,0],0x6a6e6c,stool,null,18);cyl('Stool screw column',.022,.022,.52,[0,.29,0],0x9ea3a1,stool,null,10);
 const seat=new THREE.Group();seat.name='Stool seat';seat.position.y=.58;stool.add(seat);
 cyl('Stool seat (green vinyl)',.17,.17,.06,[0,0,0],0x3d6a54,seat,null,20);box('Stool seat seam',[.33,.004,.01],[0,.031,0],0x2f523f,seat);
 collider(.8,-2.45,.42,.42,.62);

 // ---- Twin-tube fluorescent fittings over the room (the arm lamp lights the mat) ----------------------------------------
 const tube=glow(0xf6f8f2,0xf2f7ff,1.15);
 for(const [x,z] of [[-2.1,0],[2.1,0]]){
  const f=new THREE.Group();f.name=KIT.tubes.mesh;f.userData.wall=true;f.position.set(x,2.48,z);group.add(f);
  box('Fitting trough',[1.28,.045,.17],[0,.02,0],0xeeeeea,f);for(const s of [-1,1]){cyl('FL40 tube',.016,.016,1.2,[0,-.02,s*.045],tube,f,[0,0,Math.PI/2],10);box('Tube end cap',[.03,.03,.03],[s*.615,-.02,0],0xd9d6cc,f);box('Drop rod',[.012,.26,.012],[s*.5,.17,0],0xc9ccc8,f);}
 }

 // ---- One draw per material: every part that never moves is merged (the named groups stay, empty, for the tests and
 // the film); what moves or changes (the lever, the tag, the drawer, the fan's blades, the needles, the iron) stays live.
 bake();

 // ---- Prompts ------------------------------------------------------------------------------------------------------
 const anchors=new Map();
 const say=(title,text)=>action('inspect',title,text);
 for(const k of TETSUO_KIT){
  if(!k.where)continue;
  const o=new THREE.Object3D();o.name='Prompt: '+k.en;o.position.set(...k.where);o.userData.workers=['Tetsuo'];o.userData.reach=2;o.userData.facing=.8;o.userData.tetsuoKit=k.id;group.add(o);
  reg(o,kitLabel(k.id,state,{machinery}),()=>{
   const r=operateKit(state,k.id,{machinery});
   if(!r.changed){say(k.en,r.text);return;}
   sound?.(k.operates==='supply'?180:880,.05);apply();relabel();
  },true);
  anchors.set(k.id,o);
 }
 function relabel(){for(const [id,o] of anchors)if(o.userData.hit)o.userData.hit.label=kitLabel(id,state,{machinery});}

 function bake(){
  group.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert(),flats=new Set(palette.values()),batches=new Map(),drop=[];
  group.traverse(o=>{if(o.isMesh)for(let p=o;p&&p!==group;p=p.parent)if(p.userData.wall)o.castShadow=false;});
  const meshes=[];group.traverse(o=>{if(!o.isMesh)return;for(let p=o;p&&p!==group;p=p.parent)if(p.userData.live)return;meshes.push(o);});
  // A material drawn once (a screen, the shade) keeps its own named mesh; merging it would save nothing.
  const uses=new Map();for(const o of meshes)uses.set(o.material,(uses.get(o.material)||0)+1);
  for(const o of meshes){
   // Things on the walls and the ceiling cast no shadow: at this shadow map's size they only smear the plaster.
   let wall=false;for(let p=o;p&&p!==group;p=p.parent)if(p.userData.wall)wall=true;
   const m=o.material,kind=flats.has(m)?(m.metalness>0?'metal':'matte'):null,key=(kind||m.uuid)+(wall?'/wall':'');
   if(wall)o.castShadow=false;
   if(!kind&&uses.get(m)<2)continue;
   const g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
   if(kind){g.deleteAttribute('uv');const n=g.attributes.position.count,rgb=new Float32Array(n*3);for(let i=0;i<n;i++)m.color.toArray(rgb,i*3);g.setAttribute('color',new THREE.BufferAttribute(rgb,3));}
   if(!batches.has(key))batches.set(key,{kind,wall,material:m,parts:[]});batches.get(key).parts.push(g);drop.push(o);
  }
  for(const o of drop){o.parent.remove(o);o.geometry.dispose();}
  for(const [key,b] of batches){
   const material=b.kind?new THREE.MeshStandardMaterial({vertexColors:true,roughness:b.kind==='metal'?.4:.72,metalness:b.kind==='metal'?.4:0}):b.material;
   const merged=new THREE.Mesh(mergeGeometries(b.parts,false),material);b.parts.forEach(g=>g.dispose());
   merged.name='Tetsuo’s corner, merged '+(b.kind||material.name||key.slice(0,8));merged.castShadow=!b.wall&&!material.isMeshBasicMaterial&&!material.transparent;merged.receiveShadow=true;group.add(merged);
  }
  const still=new Set();group.traverse(o=>{if(o.isMesh)still.add(o.material);});for(const m of flats)if(!still.has(m))m.dispose();
 }

 // ---- State to picture ---------------------------------------------------------------------------------------------
 let drawn='',redraw=0,fanSpeed=state.fan&&machinery?1:0,leverAngle=null,drawerOpen=0,time=0;
 function screens(force=false){
  const out=benchOutputs(state),key=[out.scopeOn,out.mode.id,out.meter,out.dialLamp].join('|');
  if(!force&&key===drawn)return;drawn=key;
  drawScope(scopeCtx,scopeCanvas.width,scopeCanvas.height,out);scopeTexture.needsUpdate=true;
  drawLCD(lcdCtx,lcdCanvas.width,lcdCanvas.height,out);lcdTexture.needsUpdate=true;
 }
 function apply(){
  const out=benchOutputs(state);
  pilotOn.emissiveIntensity=out.pilot==='red'?2.2:0;pilotOff.emissiveIntensity=out.pilot==='green'?2.2:0;tag.visible=out.tagged;
  rockers.emissiveIntensity=out.strip?.9:0;scopePower.emissiveIntensity=out.scopeOn?2:0;cvLamp.emissiveIntensity=out.psuOn?2:0;
  bulbMat.emissiveIntensity=out.lampLit?2.4:0;pools.update(out.lampLit?1:0);
  dial.emissiveIntensity=out.dialLamp*2.2;charge.emissiveIntensity=1.6;
  needles[0].rotation.z=.9-out.volts/18*1.8;needles[1].rotation.z=.9-out.amps/2*1.8*4;
  screens();
 }
 function tick(dt){
  time+=dt;const out=benchOutputs(state);
  // The tip heats in about four seconds and cools in eight; the heater lamp blinks as it holds temperature.
  const target=out.ironTarget;state.heat+=Math.sign(target-state.heat)*Math.min(Math.abs(target-state.heat),dt*(target>state.heat?.25:.125));
  tipMat.emissiveIntensity=Math.max(0,state.heat-.25)*2.6;heater.emissiveIntensity=target?(state.heat<.98||Math.sin(time*2.4)>-.2?1.8:0):0;
  tip.getWorldPosition(tipWorld);room.worldToLocal(tipWorld);
  const wisp=Math.max(0,(state.heat-.6)/.4);
  smoke.forEach((s,i)=>{const p=(time*.33+i/3)%1;s.visible=wisp>0;// The tip rests down in the holder's coil, so the wisp shows from the coil's mouth up.
   s.position.set(tipWorld.x+Math.sin((time+i)*1.7)*.012*p+p*.02,tipWorld.y+.09+p*.2,tipWorld.z-.09+p*.02);s.scale.setScalar(wisp*(.006+.026*Math.sin(p*Math.PI)));});
  // Moving parts (Linux only: on the web nothing is operated and nothing moves but the wisp).
  if(machinery){
   fanSpeed+=((state.fan?1:0)-fanSpeed)*Math.min(1,dt*.8);blades.rotation.z-=fanSpeed*dt*22;
   const want=state.supply?.55:2.55;leverAngle=leverAngle===null?want:leverAngle+(want-leverAngle)*Math.min(1,dt*14);lever.rotation.z=leverAngle;
   drawerOpen+=((state.drawer?.24:0)-drawerOpen)*Math.min(1,dt*9);drawer.position.z=zf-.27+drawerOpen;
    }
  if((redraw-=dt)<=0){redraw=.2;screens();}
 }
 lever.rotation.z=.55;
 apply();screens(true);tick(0);

 return {
  group,state,anchors,edition:machinery?'linux':'web',colliders:TETSUO_COLLIDERS,
  /** For the audit and the film: put the bench in a state and show it at once. */
  set(next={}){Object.assign(state,next);if(next.supply!==undefined||next.iron!==undefined)state.heat=benchOutputs(state).ironTarget;apply();relabel();screens(true);if(next.drawer!==undefined){drawerOpen=state.drawer?.24:0;drawer.position.z=zf-.27+drawerOpen;}if(next.supply!==undefined){leverAngle=state.supply?.55:2.55;lever.rotation.z=leverAngle;}},
  tick,update:dt=>tick(dt),
  operate(id){const fn=anchors.get(id)?.userData.hit?.fn;fn?.();return state;},
  dispose(){pools.group.parent?.remove(pools.group);pools.material.dispose();for(const d of disposables)d.dispose?.();for(const s of smoke)s.parent?.remove(s);},
 };
}
