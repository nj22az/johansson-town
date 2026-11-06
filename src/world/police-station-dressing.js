import * as THREE from '../../vendor/three.module.js';
import {createKit,paint} from './okinawa/kit.js';
import {castMember} from '../people/cast.js';
import {stationNotices} from '../feed/police-notices.js';
import {POLICE_STATION as S} from './police-station-layout.js';

/** Each placement belongs to Mori's existing station, never to a new ground patch. Metres, world frame. */
export const STATION_DRESSING=Object.freeze([
 ['balcony',[7.6,3.75,22.45],'Mori','A small south-facing balcony off his room, with a painted iron guard for airing bedding.'],
 ['futon',[7.6,4.3,22.88],'Mori','His bedding airs after he comes home, only on dry mornings, and is put away by noon.'],
 ['towels',[8.65,4.7,22.55],'Mori','Two hand towels dry on the sheltered pole beside his room, clear of the bedding.'],
 ['curtains',[7.55,4.6,22.055],'Mori','Cotton curtains behind the upstairs window frames give the night officer privacy.'],
 ['hanabuku',[5.1,.8,21.75],'visitors and Mori','An open concrete screen shades the entrance corner without closing the door approach.'],
 ['emblem',[4.95,2.65,20.3],'Minato Police Station','The small gold Asahikage belongs to the canopy fascia, painted in its sign texture.'],
 ['entrance-canopy',[5.34,2.7,20.3],'visitors','A concrete rain hood with a visible cap and a complete enamel name sign, leaving the doorway legible from the street.'],
 ['entrance-nameplate',[5.655,1.68,21.38],'Minato Police Station','Four Japanese characters fill a compact vertical plate beside the door, with clear space under the lamp and canopy.'],
 ['door-pulls',[5.595,1.16,20.3],'visitors','A pair of aluminium pull handles stand clear of the glass, one on each sliding leaf, instead of an ambiguous cross-bar.'],
 ['notices',[5.61,1.48,18.25],'Mori and the neighbours','Safety notices and the storyteller’s actual belongings and Tama start stories at the street board.'],
 ['patrol-card',[5.57,1.55,16.2],'visitors','On patrol, ring the bell: shown only during Mori’s scheduled night round.'],
 ['counter-bell',[5.48,1.09,16.65],'visitors','The counter bell is within reach beneath the patrol card.'],
 ['police-bicycle',[7.1,.5,29.6],'Mori','His existing white patrol bicycle stays locked in its rack during the current walking patrol.'],
 ['aircon-brackets',[9.05,.13,22.18],'Mori and the duty office','Two steel wall brackets keep the existing outdoor unit off the yard.'],
 ['gas-hutch',[12.96,.7,19.6],'Mori','Two chained LP cylinders feed his upstairs kitchen, shaded in a ventilated service-side hutch.'],
 ['tank-stand',[11.2,6.56,15.4],'Mori and the station','A steel stand supports the existing roof tank for the island’s water interruptions.'],
 ['radio-mast',[11.7,8.2,21],'the duty desk','The existing mast connects the desk radio to Naha; no duplicate antenna.'],
 ['hibiscus-north',[5.28,.5,19.28],'Mori','His red hibiscus pot stands beside the board, outside the door approach.'],
 ['hibiscus-south',[5.28,.5,21.22],'Mori','The second matching pot marks home above the public desk, away from the car bay.'],
].map(([id,at,who,why])=>Object.freeze({id,at:Object.freeze(at),who,why})));

const minute=s=>{const [h,m]=s.split(':').map(Number);return h*60+m;};
/** Reads the real cast timetable, including the round spanning midnight. No second patrol clock. */
export function stationState(minutes,rain=false){
 const m=((minutes%1440)+1440)%1440,day=[...castMember('Officer Mori').day].sort((a,b)=>minute(a[0])-minute(b[0]));
 const slot=day.filter(s=>minute(s[0])<=m).at(-1)||day.at(-1);
 const patrol=slot[1]==='main-street'&&/patrol/.test(slot[2]);
 return {futon:!rain&&m>=8*60&&m<12*60,towels:!rain&&m>=8*60&&m<17*60,patrol};
}

const C={iron:0x6f7a72,slab:0xc9c3b4,white:0xf4f3ee,navy:0x27304d,cloth:0xd6cbb4,gas:0xa9b1b3,wood:0x9a7650};
export const STATION_SAFETY_POSTERS=Object.freeze([
 {id:'accidents',who:'Mori and road users',why:'The desk records yesterday’s incidents so the village can keep its quiet roads safe.',jp:'昨日の交通事故',jpDetail:'0件',en:'Yesterday’s traffic accidents: 0.',colour:'#fff4dc'},
 {id:'maritime',who:'the harbour’s crews',why:'The harbour is a short walk away; visitors see the reminder before boarding a boat.',jp:'海難防止月間',jpDetail:'救命胴衣を着用',en:'Maritime-accident prevention month: wear a lifejacket.',colour:'#e6eef8'},
 {id:'seatbelt',who:'drivers and passengers',why:'The patrol car leaves this yard; the reminder applies to every seat in every car.',jp:'シートベルト',jpDetail:'全席で着用',en:'Fasten seat belts in every seat.',colour:'#fff1c1'},
].map(Object.freeze));
const GOTHIC='"Noto Sans CJK JP","Yu Gothic",sans-serif';
export function stationNoticeTexture(){
 const notices=stationNotices();
 return paint(1024,576,(c,w,h)=>{
  c.fillStyle='#9a7650';c.fillRect(0,0,w,h);c.textAlign='center';c.textBaseline='middle';
  const sheets=[...STATION_SAFETY_POSTERS.map(n=>[n.jp,n.jpDetail,n.colour]),...notices.map(n=>[n.jp,n.jpDetail,'#eef4f6'])];
  sheets.forEach(([title,line,bg],i)=>{const x=18+i*200;c.fillStyle=bg;c.fillRect(x,28,188,420);c.fillStyle=i===0?'#b52a26':'#27304d';c.font=`bold 27px ${GOTHIC}`;c.fillText(title,x+94,88,174);c.font=`bold ${i===0?70:23}px ${GOTHIC}`;c.fillText(line,x+94,220,170);
   if(i===4){c.fillStyle='#e8a050';c.beginPath();c.ellipse(x+94,310,42,32,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x+56,292);c.lineTo(x+65,264);c.lineTo(x+80,286);c.moveTo(x+132,292);c.lineTo(x+123,264);c.lineTo(x+108,286);c.fill();}
  });c.fillStyle='#c8302a';c.fillRect(18,475,988,78);c.fillStyle='#fff';c.font=`bold 38px ${GOTHIC}`;c.fillText('事件・事故は110番',w/2,515);
 });
}

/** Static additions go into the station's own material batches. The three changing pieces have small separate kits. */
export function buildStationDressing(kit,group,world,{shadows=false}={}){
 const x0=6.35,x1=9.35,z0=S.maxZ+.08,z1=22.88;
 // Slab and guard. Rail is 83 cm clear of the wall; all contacts are honest joins, not facing overlays.
 kit.block(x0,x1,3.68,3.8,S.maxZ,z1+.06,C.slab);
 for(const x of [x0+.04,x1-.04])kit.box(.045,.94,.045,x,4.27,z1,C.iron,{finish:'metal'});
 for(const y of [3.91,4.74])kit.box(x1-x0,.04,.045,(x0+x1)/2,y,z1,C.iron,{finish:'metal'});
 for(let x=x0+.18;x<x1-.1;x+=.17)kit.box(.022,.78,.025,x,4.32,z1,C.iron,{finish:'metal'});
 for(const x of [x0,x1])kit.rod([x,4.74,z0],[x,4.74,z1],.022,C.iron);
 // Curtains are behind the glass in the town's existing window-interior material, never pasted onto its face.
 // Real open breeze blocks: four little bars per cell, no hole represented by a second wall-coloured plane.
 const sx=4.8,sz=21.88;
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const x=sx+col*.25,y=.04+row*.3;
  kit.box(.25,.045,.15,x+.125,y+.0225,sz,C.slab);kit.box(.25,.045,.15,x+.125,y+.2775,sz,C.slab);
  for(const dx of [.0225,.2275])kit.box(.045,.21,.15,x+dx,y+.15,sz,C.slab);
 }
 world.colliders.push({id:'station-hanabuku',x:sx+.375,z:sz,w:.75,d:.15,height:1.25});
 // Door pots on the existing concrete footway, small enough to leave the entrance and car route clear.
 for(const p of STATION_DRESSING.filter(p=>p.id.startsWith('hibiscus-'))){const [x,,z]=p.at,y=.04;
  kit.cyl(.18,.12,.3,x,y+.15,z,0xa06c50,{segments:10});kit.cyl(.15,.15,.025,x,y+.31,z,0x574734,{segments:10});
  for(const [dx,dz,h] of [[-.09,0,.62],[.06,-.06,.78],[.09,.07,.59]]){
   kit.rod([x,y+.3,z],[x+dx,y+h,z+dz],.012,C.iron);
   kit.sphere(.14,x+dx,y+h-.08,z+dz,0x4b7951,{sy:.8,detail:1});
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5;kit.sphere(.045,x+dx+Math.cos(a)*.055,y+h+.04,z+dz+Math.sin(a)*.055,0xc8302a,{sy:.5,detail:1});}
   kit.sphere(.022,x+dx,y+h+.06,z+dz,0xd9a441,{detail:1});
  }world.colliders.push({id:p.id,x,z,w:.38,d:.38,height:.95});
 }
 // Brackets under the existing cooler; the fan and box remain the town's own.
 for(const x of [8.77,9.33]){kit.rod([x,.13,22.02],[x,.13,22.34],.018,C.iron);kit.rod([x,.06,22.02],[x,.13,22.32],.014,C.iron);}
 // Back wall service hutch: cylinders, shoulder caps, valves, chain, roof, ventilated slats and kitchen riser.
 const gx=13.02,gz=19.6,base=.02;
 for(const dz of [-.22,.22]){kit.cyl(.17,.17,.85,gx,base+.425,gz+dz,C.gas,{segments:10,finish:'metal'});kit.sphere(.17,gx,base+.85,gz+dz,C.gas,{sy:.5,detail:1});kit.cyl(.04,.04,.12,gx,base+.97,gz+dz,C.iron,{segments:6});}
 kit.rod([gx+.17,.68,gz-.4],[gx+.17,.68,gz+.4],.014,C.iron);
 for(const x of [12.72,13.32])for(const z of [19.12,20.08])kit.box(.045,1.2,.045,x,.62,z,C.wood);
 kit.box(.72,.06,1.1,gx,1.27,gz,C.wood);
 for(let i=0;i<7;i++)kit.box(.025,1.05,.055,13.34,.61,19.2+i*.13,C.wood);
 for(const z of [19.1,20.1])for(let i=0;i<4;i++)kit.box(.055,1.05,.025,12.79+i*.15,.61,z,C.wood);
 kit.rod([12.7,1.1,gz],[12.7,4.2,gz],.02,C.iron);
 world.colliders.push({id:'station-gas-hutch',x:13.03,z:gz,w:.72,d:1.1,height:1.32});
 // Open steel stand for the existing tank, 40 cm high, with diagonal bracing.
 for(const x of [10.72,11.68])for(const z of [14.92,15.88])kit.box(.055,.4,.055,x,6.52,z,C.iron,{finish:'metal'});
 for(const z of [14.92,15.88])kit.rod([10.72,6.32,z],[11.68,6.72,z],.018,C.iron);
 // Counter bell, sheltered under the window ledge; no independent light source.
 kit.cyl(.065,.08,.04,5.48,1.06,16.65,C.iron,{segments:10,finish:'metal'});kit.sphere(.06,5.48,1.1,16.65,0xd9a441,{sy:.55,detail:1});
 const separate=(name,build)=>{const g=new THREE.Group();g.name=name;group.add(g);const k=createKit({shadows});build(k);k.finish(g,name);return g;};
 const futon=separate('Mori aired futon',k=>{k.box(1.04,.72,.08,7.55,4.35,22.96,C.cloth);k.box(1.04,.12,.26,7.55,4.75,22.86,C.cloth);k.box(1.04,.52,.07,7.55,4.45,22.7,C.cloth);for(const x of [7.15,7.95])k.box(.035,.61,.015,x,4.35,23.01,0x858f9a);});
 // Towel pole and hangers remain when the towels are in.
 for(const x of [8.75,9.15])kit.rod([x,3.8,22.5],[x,5.02,22.5],.016,C.iron);
 kit.rod([8.6,5.02,22.5],[9.25,5.02,22.5],.018,C.iron);
 const towels=separate('Mori drying towels',k=>{for(const x of [8.75,9.1])k.box(.23,.47,.04,x,4.77,22.5,C.white);});
 const card=separate('Mori patrol card',k=>k.sign(paint(1024,176,(c,w,h)=>{c.fillStyle='#f4f3ee';c.fillRect(0,0,w,h);c.fillStyle='#27304d';c.textAlign='center';c.textBaseline='middle';c.font=`bold 54px ${GOTHIC}`;c.fillText('パトロール中・ご用の方はベルへ',w/2,h/2,w-32);}),1.25,.22,5.57,1.55,16.2,{ry:-Math.PI/2,depth:.015,name:'Patrol notice',edge:C.navy}));
 let last=720,wet=false;
 const update=(minutes=last,rain=wet)=>{last=minutes;wet=!!rain;const state=stationState(last,wet);futon.visible=state.futon;towels.visible=state.towels;card.visible=state.patrol;return state;};
 group.userData.dressing=STATION_DRESSING;update();
 return {futon,towels,card,update,setRain(value){return update(last,value);}};
}
