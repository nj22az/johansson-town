import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {FURNITURE_HEIGHTS} from '../furniture-standards.js';

const guestbookBaseY=FURNITURE_HEIGHTS.table+.004;

export const MINATO_MEMORIES=Object.freeze([
 {id:'guestbook',label:'Open the old guestbook',position:[-4.82,FURNITURE_HEIGHTS.table+.08,4.86],title:'The guestbook',text:'Under a coffee ring: “First lantern night. Four things make a house: a window, a song, a good meal and someone who remembers.” A drawing points from the window to the radio, then to the kitchen recipe.',choice:'Read the first lantern-night entry'},
 {id:'window',label:'Look out of the street window',position:[-3.9,1.65,6.13],title:'The window seat',text:'A ferry ticket is tucked into the sash. On the back: “We waited for the last boat here, and stayed for another song.” The real street carries on outside the glass.',choice:'Read the ticket in the sash'},
 {id:'radio',label:'Tune the old kitchen radio',position:[-.4,2.58,-5.70],title:'The old radio',text:'A pencil mark on the dial is labelled “Lantern night”. Beside it: “If the music goes quiet, someone always starts singing.”',choice:'Read the station note'},
 {id:'recipe',label:'Read the handwritten kitchen recipe',position:[5.65,1.55,-6.16],title:'The house recipe',text:'A grease-marked card: soy, mirin, a little sugar; turn the skewers, keep the last warm plate for whoever misses the ferry. Beneath it: “The first meal we cooked here.”',choice:'Read the old sauce recipe'},
]);
const key=id=>'minato-memory:'+id;
export const MINATO_MEMORY_STORY='Minato · First Lantern Night: the ferry-ticket bookmark, the pencilled radio station, the first meal and the guestbook belong to the same evening. The house is made by the people who keep returning. Recipe: soy, mirin, a little sugar; turn the skewers, keep the last warm plate for a late arrival.';
export const MINATO_RECIPE_CARD='Minato house recipe card';
const CARD=MINATO_RECIPE_CARD;

/** A quiet room discovery: four physical objects, a saved story and a recipe card. */
export function createMinatoMemories({state,show,save=()=>{},close=()=>{},onCurtain=()=>{}}){
 state.inspectedIds??=[];state.notes??=[];state.inventory??=[];
 const seen=id=>state.inspectedIds.includes(key(id));
 const checklist=()=>MINATO_MEMORIES.map(m=>(seen(m.id)?'✓ ':'○ ')+m.title.replace(/^The /,'')).join('\n');
 const marker=id=>{if(!seen(id))state.inspectedIds=[key(id),...state.inspectedIds].slice(0,100);};
 const collectCard=()=>{
  if(seen('collected'))return;
  if(state.inventory.includes(CARD)){marker('collected');return;}
  if(state.inventory.length>=100)return;
  state.inventory.push(CARD);marker('collected');
 };
 const discover=id=>{
  marker(id);
  if(MINATO_MEMORIES.every(m=>seen(m.id))&&!seen('complete')){
   marker('complete');
   state.notes=[...state.notes.filter(n=>n!==MINATO_MEMORY_STORY),MINATO_MEMORY_STORY].slice(-100);
   collectCard();
  }save();
 };
 function open(id){
  const item=MINATO_MEMORIES.find(m=>m.id===id);if(!item)return;
  const actions=[[item.choice,()=>{discover(id);open(id);}]];
  if(id==='window')actions.push(['Slide the curtains open',()=>{onCurtain(true);close();}],['Draw the curtains',()=>{onCurtain(false);close();}]);
  if(id==='radio')actions.push(['Tune to harbour music',()=>{state.radioStation=1;save();discover(id);show('Harbour music','The dial settles on the old music station. The room feels ready for another evening.',[['Back to the radio',()=>open(id)],['Keep listening',close]]);}]);
  if(seen('complete')){
   if(!seen('collected'))actions.push(['Take the recipe card',()=>{collectCard();save();open(id);}]);
   actions.push(['Read the recipe card',()=>show(CARD,MINATO_MEMORY_STORY,[['Keep exploring',close]])]);
  }
  actions.push(['Keep exploring',close]);
  show(item.title,item.text+'\n\nFirst Lantern Night · '+MINATO_MEMORIES.filter(m=>seen(m.id)).length+'/4 memories\n'+checklist()+(seen('complete')?(seen('collected')?'\nRecipe card saved in your bag and field book.':'\nStory saved in your field book. Make room in your bag, then take the recipe card.'):''),actions);
 }
 return {open,seen,snapshot:()=>({found:MINATO_MEMORIES.filter(m=>seen(m.id)).map(m=>m.id),complete:seen('complete')})};
}

export function buildIzakayaExploration(room,{anchor,exploration}){
 const group=new THREE.Group();group.name='Minato windows door and discoveries';room.add(group);
 const parts=[],print=[];const colour=(g,hex)=>{const c=new THREE.Color(hex).toArray(),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3)a.set(c,i);g.setAttribute('color',new THREE.BufferAttribute(a,3));g.deleteAttribute('uv');return g;};
 const box=(w,h,d,x,y,z,c)=>parts.push(colour(new THREE.BoxGeometry(w,h,d).translate(x,y,z),c));
 const steel=0xa8a193,wood=0x654b35;
 // The front, as a 1970s izakaya had it: four sliding koshi-do across the 3.64 m opening,
 // each a timber frame with a waist-high kick board and glass above, the glass crossed by
 // fine vertical kumiko so the street shows through in strips. In the evening the middle
 // pair stand slid behind the outer pair, leaving a 1.8 m entrance under the noren; the
 // street beyond is the real street (shop-street-view.js), not a picture of it.
 const glass=new THREE.MeshBasicMaterial({color:0xd8e5db,transparent:true,opacity:.07,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true});
 const leaf=(x,z)=>{
  const w=.91,h=2.2,t=.035;
  for(const dx of [-w/2+.025,w/2-.025])box(.05,h,t,x+dx,.06+h/2,z,wood);
  box(w,.05,t,x,.085,z,wood);box(w,.06,t,x,.06+h-.03,z,wood);
  // Kick board, then the glazing rail, then kumiko at 7.5 cm centres up to the head.
  box(w-.1,.42,.018,x,.31,z,0x5a4230);box(w-.1,.045,t,x,.545,z,wood);
  for(let i=1;i<12;i++)box(.012,h-.6,.02,x-w/2+.05+i*(w-.1)/12,.57+(h-.6)/2,z+.006,0x4a3626);
  box(w-.1,.025,.02,x,1.42,z+.006,0x4a3626);
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(w-.1,h-.62),glass);pane.position.set(x,.57+(h-.62)/2,z);group.add(pane);
  box(.03,.14,.02,x+(x<0?.38:-.38),1.05,z-.03,steel);
 };
 // Outer leaves in their own track, the slid-open middle pair just inside them.
 for(const side of [-1,1]){leaf(side*1.365,6.2);leaf(side*1.365,6.145);}
 // Two-groove sill and head track, and a granite step down to the tataki outside.
 box(3.67,.035,.13,0,.0175,6.175,0x8d8e82);box(3.67,.07,.13,0,2.295,6.175,wood);
 box(3.7,.08,.32,0,.04,6.36,0x9a958a);
 // The window needs no lattice of its own: the street front's koshi stands outside the glass.
 const pane=new THREE.Mesh(new THREE.PlaneGeometry(2.15,1.055),new THREE.MeshBasicMaterial({color:0xd8e5db,transparent:true,opacity:.065,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true}));pane.position.set(-3.9,1.72,6.259);group.add(pane);
 box(2.33,.045,.15,-3.9,1.125,6.21,wood);box(.038,.09,.026,-3.84,1.67,6.218,steel);
 const curtains=new THREE.Group();curtains.name='Minato sliding window curtains';group.add(curtains);
 for(const side of [-1,1]){
  const g=new THREE.PlaneGeometry(1.10,.70,18,3),a=g.attributes.position;
  for(let i=0;i<a.count;i++)a.setZ(i,Math.sin((a.getX(i)+.55)*Math.PI*18)*.015);g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xc1b18d,roughness:.95,side:THREE.DoubleSide,forceSinglePass:true}));m.position.set(-3.9+side*.55,1.66,6.205);m.userData.side=side;curtains.add(m);
  const loops=[];for(let i=0;i<6;i++)loops.push(new THREE.TorusGeometry(.025,.0018,4,12).translate(-.48+i*.192,.375,0));
  const hooks=new THREE.Mesh(mergeGeometries(loops),new THREE.MeshStandardMaterial({color:0xaaa18a,roughness:.45,metalness:.5}));hooks.name='Curtain suspension rings';m.add(hooks);loops.forEach(g=>g.dispose());
 }
 box(2.35,.018,.018,-3.9,2.065,6.204,steel);
 const curtainOpen=on=>curtains.children.forEach(m=>{m.position.x=-3.9+m.userData.side*(on?.94:.55);m.scale.x=on?.325:1;});
 curtainOpen(true);
 // Physical guestbook, ferry-ticket bookmark and grease-marked recipe sheet.
 box(.15,.025,.20,-4.82,guestbookBaseY+.0125,4.86,0x4a4937);box(.138,.006,.18,-4.82,guestbookBaseY+.025+.003,4.86,0xe5dbc0);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#e5dbc0';ctx.fillRect(0,0,512,256);ctx.fillStyle='#5a4938';ctx.textAlign='center';
 ctx.font='700 22px serif';ctx.fillText('FIRST LANTERN NIGHT',128,32);ctx.font='italic 16px serif';['A window. A song.','A good meal.','Someone who remembers.'].forEach((s,i)=>ctx.fillText(s,128,84+i*32));
 ctx.fillStyle='#936b43';ctx.font='700 25px serif';ctx.fillText('HOUSE TARE',384,36);ctx.fillStyle='#5a4938';ctx.font='italic 18px serif';['Soy · mirin · a little sugar','Turn the skewers','Keep one warm plate','for a late arrival'].forEach((s,i)=>ctx.fillText(s,384,90+i*31));
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const page=new THREE.PlaneGeometry(.137,.18).rotateX(-Math.PI/2).translate(-4.82,guestbookBaseY+.025+.006+.0005,4.86);for(let i=0;i<page.attributes.uv.count;i++)page.attributes.uv.setX(i,page.attributes.uv.getX(i)*.5);print.push(page);
 const recipe=new THREE.PlaneGeometry(.26,.34).translate(5.65,1.55,-6.16);for(let i=0;i<recipe.attributes.uv.count;i++)recipe.attributes.uv.setX(i,.5+recipe.attributes.uv.getX(i)*.5);print.push(recipe);
 box(.07,.008,.038,-3.84,1.145,6.205,0xe7cda0);box(.028,.018,.008,5.65,1.72,-6.153,steel);
 const solids=new THREE.Mesh(mergeGeometries(parts),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72}));solids.name='Minato door joinery and discovery objects';group.add(solids);parts.forEach(g=>g.dispose());
 const papers=new THREE.Mesh(mergeGeometries(print),new THREE.MeshStandardMaterial({map:texture,roughness:.93}));papers.name='Minato memory guestbook and recipe';group.add(papers);print.forEach(g=>g.dispose());
 let memories=null;
 if(exploration){memories=createMinatoMemories({...exploration,onCurtain:curtainOpen});for(const m of MINATO_MEMORIES)anchor(m.position,m.label,()=>memories.open(m.id));}
 group.userData.discoveryIds=MINATO_MEMORIES.map(m=>m.id);
 return {group,memories,update:()=>{},dispose:()=>{}};
}
