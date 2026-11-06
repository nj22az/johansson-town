import * as THREE from '../../vendor/three.module.js';
import {createBalloonPresenter,projectBalloonPerson,balloonViewport} from '../dialogue/world-balloon.js';
import {lineFeeling} from '../avatars/body-language.js';
import {recipeFor} from '../avatars/cast.js';
import {writtenChat} from './chat-lines.js';
import {residentPlan} from './social.js';
import {residentPersonality} from './resident-personalities.js';
import {rememberEncounter,connectionWeight,relationshipChat} from './relationships.js';

const EXCHANGES=[
 ['Nhung','Emi',['Did Tama agree to the apron?','He has asked for a larger salary.','Payment in sardines, presumably.']],
 ['Chin','Tetsuo',['Yo, bro! Fixed that crackling on your radio.','That was the music, Chin.','Totally improved it, then, dude.']],
 ['Mrs Sato','Fumiko',['You said you were only coming for tea.','I am. The rice ball is keeping it company.','I shall fetch a second cup.']],
 ['Harbour master','Mr Fujita',['How large was the fish today?','Larger than yesterday.','Your hands say that every day.']],
 ['Hana','Daichi',['Hold still. I am drawing you.','Is this my heroic side?','It is your only still side.']],
 ['Officer Mori','Nhung',['Nothing suspicious on my rounds.','What about the cat in the fish crate?','An ongoing investigation. Not for the paper.']],
 ['Kenta','Cold-storage kid',['I practised saying hello to Emi.','The freezer heard every word.','Was it convincing?']],
 ['Thao','Masaru',['Is this the catch of the day?','Small, but exceptionally brave.','I will need smaller plates.']],
 ['Thuan','Thao',['I promised my plants an early night.','Did they answer?','The fern looked disappointed.']],
 // The three sisters: Nhung the eldest, Thao in the middle (stubborn, and kind with it),
 // Thuan the youngest. A pair can have several exchanges; one is picked each time.
 ['Thao','Thuan',['Did you eat?','I had ice cream with Nhung.','That is not eating. Sit. Rice.']],
 ['Nhung','Thuan',['Your plaits are crooked again.','They are artistic.','Hold still. I am fixing your art.']],
 ['Thuan','Nhung',['Jan, ken... you always throw rock first!','I am the eldest. Rock is tradition.','Then paper is my tradition.']],
 ['Nhung','Thuan',['Ube, or the pink one?','Both. You are paying.','That is not how being the eldest works.']],
 ['Thuan','Nhung',['A customer asked if we are twins.','I hope you said I am the pretty one.','I said you are the loud one.']],
 ['Thao','Nhung',['You are on my good stool.','It has my name on it.','You wrote that there yourself.']],
 ['Nhung','Thao',['One more beer for Thuan?','No.','She walks home now, Thao.','Then she walks. Bed.']],
 ['Mr Tanabe','Fumiko',['A quiet evening is good for the soul.','So is a little gossip.','We shall call it local history.']]
];

export function clearChatLine(a,b,boxes){
 return !boxes.some(c=>{
  let lo=0,hi=1;
  for(const [axis,min,max] of [['x',c.x-c.w/2,c.x+c.w/2],['z',c.z-c.d/2,c.z+c.d/2],['y',c.minY??0,c.height??2.8]]){
   const d=b[axis]-a[axis];if(Math.abs(d)<1e-8){if(a[axis]<min||a[axis]>max)return false;continue;}
   const t1=(min-a[axis])/d,t2=(max-a[axis])/d;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return false;
  }return hi>.02&&lo<.98;
 });
}
const visible=g=>{if(g.userData.visualReady===false)return false;for(let p=g;p;p=p.parent)if(!p.visible)return false;return true;};
const place=p=>p.g.userData.inWorkplace|| (p.g.userData.inIzakaya?'izakaya':p.g.userData.inOnsen?'onsen':p.g.userData.inMarket?'market':p.g.userData.inRamen?'ramen':p.g.userData.inHome?'home':'street');

/** How long a line stays up: long enough to read, and a beat for the other to answer. */
export const lineSeconds=text=>Math.min(6,Math.max(2.6,1.5+String(text||'').length*.055));
/** Neighbours this far apart will stop for a chat, and this close to you you will see it. */
export const CHAT_REACH=Object.freeze({apart:2.8,near:.85,observer:14,cooldown:18,between:1.5});

// One local exchange at a time, near enough to the player to be overheard. The words
// come from the town's language model when the player has it running (town-mind.js),
// written ahead for pairs who are about to meet; otherwise from the written small talk,
// in each speaker's own temperament (chat-lines.js).
export function createNeighbourChats({world,observer,blocked=()=>false,state=()=>({}),onMemory=()=>{},writer=null,random=Math.random}){
 let clock=0,nextScan=2,active=null,sequence=0;const cooldown=new Map(),recent=new Map();
 const point=p=>{const v=p.g.getWorldPosition(new THREE.Vector3());v.y+=(p.profile.height||1.7)*.8;return v;};
 const signature=(p,minutes,rain)=>{const plan=residentPlan(p.profile,minutes,rain,state());return plan.place+'/'+plan.target?.join(',')+'/'+place(p);};
 const person=p=>({name:p.profile.name,age:p.profile.age,role:p.profile.role||p.spec?.role,personality:p.profile.personality,gossip:p.profile.gossip,profile:recipeFor(p.profile.name).profile});
 const pairKey=(a,b)=>[a.profile.name,b.profile.name].sort().join('|');
 function cancel(){if(active){for(const p of active.pair){delete p.g.userData.chat;delete p.g.userData.chatHold;if(p.g.userData.lookSource==='chat'){delete p.g.userData.lookTarget;delete p.g.userData.lookSource;}cooldown.set(p.profile.name,clock+CHAT_REACH.cooldown+random()*10);}active=null;}nextScan=clock+CHAT_REACH.between;}
 function eligible(p){
  const u=p.g.userData;
  return visible(p.g)&&!u.playerControlled&&!u.playerConversation&&!u.inVehicle&&!u.ferryPassenger&&!u.aboardFerry&&!u.ferryCrew&&!u.ferryShoreTask&&!u.onWatch&&!u.boarding&&!u.playing
   &&!u.sleeping&&!u.waking&&!u.roomTransition&&!u.shopping&&!u.serving&&!u.restocking&&!u.shopReach&&!u.usingTownObject
   &&(!u.mealState||u.mealState==='finished')&&(!u.indoors||place(p)!=='street')&&!(u.facePlayerUntil>performance.now())
   &&!(p.profile.name==='Chin'&&state().kenjiEscort==='walking')&&p.g.getWorldPosition(new THREE.Vector3()).distanceTo(observer())<CHAT_REACH.observer;
 }
 // A doorway or another controller may move a body during an exchange. Never keep
 // two people talking through one another, across rooms, or after they have parted.
 function withinReach(a,b){
  const pa=a.g.getWorldPosition(new THREE.Vector3()),pb=b.g.getWorldPosition(new THREE.Vector3()),d=Math.hypot(pa.x-pb.x,pa.z-pb.z);
  return a.g.parent===b.g.parent&&place(a)===place(b)&&Math.abs(pa.y-pb.y)<.65&&d>=CHAT_REACH.near&&d<=CHAT_REACH.apart;
 }
 function update(dt,minutes,rain=false){
  clock+=dt;
  if(active){
   if(active.pair.some((p,i)=>!eligible(p)||signature(p,minutes,rain)!==active.signatures[i])||!withinReach(...active.pair)||blocked(point(active.pair[0]),point(active.pair[1]))){cancel();return;}
   const elapsed=clock-active.start;
   let turn=active.ends.findIndex(t=>elapsed<t);if(turn<0){
    const [a,b]=active.pair.map(p=>p.profile.name);
    const changed=rememberEncounter(state(),a,b,{kind:active.relationshipKind,minutes,place:place(active.pair[0])});
    cancel();if(changed)onMemory();return;
   }
   const speaker=active.pair[active.speakers[turn]];active.speaker=speaker;active.text=active.lines[turn];active.turn=turn;
   // The speaker wears the feeling of the line; their personality decides the move.
   if(active.feltTurn!==turn){active.feltTurn=turn;const f=lineFeeling(active.text);speaker.g.userData.lineFeeling=f?{expression:f,until:performance.now()+4000}:null;}
   active.pair.forEach(p=>{const partner=active.pair.find(q=>q!==p);p.g.userData.chat={speaking:p===speaker,time:elapsed,partner:partner.g,greeting:elapsed<1.8};p.g.userData.chatHold=true;
    // They look at each other, wherever they are; standing, they turn to each other too.
    // (Someone sitting keeps their seat and turns only their head.)
    p.g.userData.lookTarget=point(partner).toArray();p.g.userData.lookSource='chat';
    const sitting=Number.isFinite(p.g.userData.seatHeight)||p.g.userData.chairBlend>.5;
    if(!sitting){const dx=partner.g.position.x-p.g.position.x,dz=partner.g.position.z-p.g.position.z,heading=Math.atan2(-dx,-dz),delta=Math.atan2(Math.sin(heading-p.g.rotation.y),Math.cos(heading-p.g.rotation.y));p.g.rotation.y+=delta*(1-Math.exp(-dt*5));}
   });return;
  }
  if(clock<nextScan)return;nextScan=clock+1;
  const people=[...world.people,...(world.homeNeighbours||[])].filter(eligible);let best=null,soon=null;
  for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
   const a=people[i],b=people[j],d=a.g.position.distanceTo(b.g.position);if(place(a)!==place(b)||d<CHAT_REACH.near)continue;
   // Further off, the model can start writing for them before they meet.
   if(d<12&&(!soon||d<soon.d))soon={a,b,d};
   if(!withinReach(a,b)||(cooldown.get(a.profile.name)||0)>clock||(cooldown.get(b.profile.name)||0)>clock||blocked(point(a),point(b)))continue;
   const written=EXCHANGES.filter(e=>[a.profile.name,b.profile.name].includes(e[0])&&[a.profile.name,b.profile.name].includes(e[1])),authored=written.length?written[Math.floor(random()*written.length)]:null;
   const ready=writer?.has?.(person(a),person(b));
   const score=d+(ready?-6:0)+(authored&&!recent.get(pairKey(a,b))?.includes('authored')?-4:0)-connectionWeight(state(),a.profile.name,b.profile.name);if(!best||score<best.score)best={a,b,authored,score};
  }
  const context={minutes,rain,place:placeName(people[0]||{g:{userData:{}}})};
  if(soon&&writer?.ready&&!writer.busy)writer.prepare(person(soon.a),person(soon.b),{...context,place:placeName(soon.a)});
  if(!best)return;
  let {a,b,authored}=best;
  const seen=recent.get(pairKey(a,b))||[];
  const interests=residentPersonality(a.profile.name).interests.filter(i=>residentPersonality(b.profile.name).interests.includes(i));
  let chat=relationshipChat(state(),a.profile.name,b.profile.name,{minutes,sharedInterests:interests});
  if(chat&&seen.includes(chat.topic))chat=null;
  chat??=writer?.take?.(person(a),person(b));
  if(!chat&&authored&&!seen.includes('authored')){if(a.profile.name!==authored[0])[a,b]=[b,a];chat={topic:'authored',lines:authored[2],speakers:authored[2].map((_,i)=>i%2)};}
  if(!chat){if(random()<.5)[a,b]=[b,a];chat=writtenChat(person(a),person(b),{minutes,rain,random,avoid:seen});}
  recent.set(pairKey(a,b),[...seen.slice(-6),chat.topic]);sequence++;
  let t=0;const ends=chat.lines.map(l=>t+=lineSeconds(l));
  const meal=[a,b].every(p=>p.g.userData.mealState==='finished')&&['izakaya','ramen'].includes(place(a));
  active={pair:[a,b],lines:chat.lines,speakers:chat.speakers,ends,topic:chat.topic,relationshipKind:chat.relationshipKind||(meal?'meal':'chat'),generated:!!chat.generated,start:clock,signatures:[signature(a,minutes,rain),signature(b,minutes,rain)],speaker:a,text:chat.lines[0]};
  update(0,minutes,rain);
 }
 return {update,cancel,get current(){return active;},get count(){return sequence;}};
}

const PLACE_NAMES={street:'the harbour street',izakaya:'the izakaya',onsen:'the bathhouse',market:'the market',ramen:'Mrs Sato’s ramen counter',home:'a neighbour’s home'};
const placeName=p=>PLACE_NAMES[place(p)]||'the '+String(place(p)).replace(/-/g,' ');

export function createChatBubble({camera,canvas,target,blocked=()=>false,project=null}){
 const bubble=document.createElement('div'),name=document.createElement('strong'),line=document.createElement('span');bubble.className='neighbour-chat';bubble.hidden=true;bubble.setAttribute('aria-hidden','true');bubble.append(name,line);document.body.append(bubble);
 const placement=createBalloonPresenter(bubble,{ambient:true});
 return {render(chat,dt=0){
  bubble.hidden=true;if(!chat||!visible(chat.speaker.g))return;
  const head=target(chat.speaker.g),eye=camera.getWorldPosition(new THREE.Vector3());if(head.distanceTo(eye)>12||blocked(eye,head))return;
  const p=head.clone().project(camera);if(p.z< -1||p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1)return;
  const rect=canvas.getBoundingClientRect?.()||{left:0,top:0,width:innerWidth,height:innerHeight};
  name.textContent=chat.speaker.profile.name;line.textContent=chat.text;bubble.hidden=false;
  const person=project?.(chat.speaker.g)||projectBalloonPerson(camera,rect,head,chat.speaker.g.getWorldPosition(new THREE.Vector3()));
  const others=(chat.pair||[]).filter(p=>p!==chat.speaker).map(p=>project?.(p.g)||projectBalloonPerson(camera,rect,target(p.g),p.g.getWorldPosition(new THREE.Vector3()))).filter(Boolean);
  const controls=[...document.querySelectorAll?.('#contextActions,#directoryButton,#waypoint,#stick,#movementActions')||[]].filter(e=>!e.hidden&&e.getClientRects?.().length&&globalThis.getComputedStyle?.(e).visibility!=='hidden').map(e=>({...e.getBoundingClientRect().toJSON(),weight:80}));
  bubble.balloonActors=[{name:chat.speaker.profile.name,...person},...others.map(p=>({...p}))].filter(p=>p.face);
  placement.place({person,obstacles:[...others.flatMap(p=>[p.face,p.body]),...controls],viewport:balloonViewport(rect,{top:56,element:bubble}),key:chat.speaker.profile.name,text:chat.text,line,dt,reduced:!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches});
 },hide(){bubble.hidden=true;placement.reset();}};
}
