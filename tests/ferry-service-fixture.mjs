import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createFerryRun} from '../src/world/ferry.js';
import {createFerryWalk} from '../src/world/ferry-walk.js';
import {createFerryCrewAboard} from '../src/people/ferry-crew-aboard.js';
import {buildPortShed} from '../src/world/port-shed.js';
import {createIslandPlay} from '../src/island/play.js';
import {AIRPORT_FERRY_PORTS} from '../src/world/airport-ferry.js';
import {HARBOUR_OFFICE} from '../src/world/business-layout.js';

/**
 * Actual run, the master's own shed body, the harbour agent's street body for the shore lines, eight physical crew,
 * deck carry and island observer. No ready-task shortcut.
 */
export function ferryServiceFixture({minute=600,identity=null,state:saved=null}={}){
 installDOM();const group=new THREE.Group(),colliders=[],player=new THREE.Object3D(),camera=new THREE.PerspectiveCamera(),people=[];
 const shed=buildPortShed({parent:group,colliders,register(){},onAction(){}}),run=createFerryRun({parent:group,colliders});
 // The Harbour master, outside his office door on the quay, as the street would have him (people/residents.js).
 const agent=new THREE.Group();agent.name='Harbour master';agent.userData.name='Harbour master';agent.position.set(HARBOUR_OFFICE.door[0],0,HARBOUR_OFFICE.door[2]+.7);group.add(agent);people.push({profile:{name:'Harbour master'},g:agent});
 const state=saved||{yen:1000,inventory:['Saved keepsake'],island:{v:1,projects:[],treasury:43210,repair:false,flights:0,visits:0,journey:{location:'town',roundTrip:false,ticket:null,checked:false}}};
 let menu=null,minutes=minute,clock=0;const arrivals=[],anchors=[],timePasses=[];
 const activities={state,save(){},close(){menu=null;},menu(title,text,buttons){menu={title,text,buttons};}};
 const world={group,people,ferry:run,colliders};
 const walk=createFerryWalk(run),aboard=()=>{walk.update();const p=player.position,on=walk.floorAt(p.x,p.z,p.y,.3);return !!on&&walk.move(p.x,on.y,p.z,p.x,p.z,.32)?.ok===true;};
 const play=createIslandPlay({world,player,camera,activities,aboard,register:(o,label,fn)=>anchors.push({o,label,fn}),getMinutes:()=>minutes,getRain:()=>false,
  passTime:m=>{timePasses.push(m);minutes+=m;},place:(x,z,y=0)=>{arrivals.push({x,z,y});player.position.set(x,y,z);},enterNaha(){},leaveNaha(){}});
 const crew=createFerryCrewAboard({run,portShed:shed,shoreParent:group,shoreColliders:colliders,characters:{attach(){return null;}},register(){},onAction(){},playerIdentity:()=>identity,playerAboard:aboard,townBody:name=>people.find(p=>p.profile.name===name)?.g});
 run.update(.01,minutes,clock);crew.update(.01,minutes);
 const p=AIRPORT_FERRY_PORTS.town;player.position.set(p.landing[0],p.height,p.landing[1]);
 function tick(dt=.1){
  const count=Math.max(1,Math.ceil(dt/.1)),step=dt/count;
  for(let k=0;k<count;k++){
   const carry=aboard()?run.ferry.worldToLocal(player.position.clone()):null;
   minutes+=step/60;clock+=step;play.tick(step);crew.update(step,minutes);run.update(step,minutes,clock);world.traffic?.update(step,minutes);
   if(carry)player.position.copy(run.ferry.localToWorld(carry));
  }
 }
 const diagnostics=()=>({stage:run.operation?.stage,blocking:run.operation?.blocking,crew:crew.snapshot().filter(c=>c.blocked||c.state==='walking'),traffic:world.traffic?.snapshot()});
 function until(condition,{seconds=2400,step=.1}={}){for(let i=0;i<Math.ceil(seconds/step)&&!condition();i++)tick(step);if(!condition())throw new Error('Ferry condition did not complete: '+JSON.stringify(diagnostics()));}
 return {group,world,run,player,camera,state,play,crew,shed,agent,walk,arrivals,anchors,activities,timePasses,tick,until,aboard,
  choose(prefix){const fn=menu?.buttons.find(([label])=>label.startsWith(prefix))?.[1];if(!fn)throw new Error('Missing menu action '+prefix);fn();},
  chooseDeparture(){const fn=menu?.buttons.find(([label])=>/^Board|^Request departure/.test(label))?.[1];if(!fn)throw new Error('Missing departure action');fn();},
  complete(){until(()=>!play.active);},get minutes(){return minutes;},get menu(){return menu;},diagnostics};
}
