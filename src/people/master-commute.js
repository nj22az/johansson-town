import {AIRPORT_FERRY_PORTS} from '../world/airport-ferry.js';
import {FERRY_DAY} from '../world/ferry-ship.js';
import {PORT_SHED} from '../world/fujita-layout.js';
import {FERRY_WORKING_DAY} from './ferry-crew.js';
import {createShoreWalker,worldPoint,setWorldPoint,distance,SHORE_SPEED} from './shore-walker.js';

/**
 * The master's walk between his shed and the gangway (docs/CAST-CONSOLIDATION.md §3, §9: Fujita is the master, sober on
 * watch; the shed, the set and the beer only after he signs off). His one body is the shed's (world/port-shed.js); the
 * crew controller (ferry-crew-aboard.js) draws him on the bridge while he is signed on and hides this body meanwhile.
 * This joins the two ends so he is never in two places and never appears from nowhere:
 *   06:00 up aboard Shiosai, to the shed, the kettle on (the shed's routine, fujita-routine.js);
 *   06:05 signs on (FERRY_WORKING_DAY.signOn): walks the pier and the quay to the gangway's foot;
 *   06:10 the generators go on and the bridge has him (the crew body); the shed body is hidden at the gangway;
 *   23:10 the shore power goes on after the last boat back from Kitano-jima and the bridge lets him go: this body
 *         steps off at the gangway and walks back to his chair; 23:15 he is signed off and the first bottle is poured (fujita-day.js FUJITA_DAY.start).
 * If she is not at Minato when he signs on (left overnight at Kitano-jima), he stays ashore and the bridge still has
 * him: the crew's single body is the rule, and the ship's day is the clock's. If she is away when he signs off, he
 * is back in his chair: he came over on her last run.
 */
const minute=m=>((m%1440)+1440)%1440;
export function createMasterCommute({shed,run,shoreColliders=[]}){
 const g=shed.fujita,S=PORT_SHED,walker=createShoreWalker(shoreColliders);
 const chair=[S.chair[0],S.y+.02,S.chair[1]-.08],p=AIRPORT_FERRY_PORTS.town,landing=[p.landing[0],p.height,p.landing[1]];
 // His own chair is crossed only by his getting up and sitting down; never a public walking opening.
 const exempt=c=>!!c.portShed&&Math.abs(c.x-S.chair[0])<.01&&Math.abs(c.z-S.chair[1])<.01;
 const b={g,route:[],index:0,search:null,blocked:null,goal:null,state:'ashore'};
 let state='ashore';
 const chairYaw=g.rotation.y;
 function leaveChair(){const u=g.userData;delete u.seatHeight;delete u.heldItem;delete u.heldPortion;delete u.chairBlend;delete u.hatOff;u.sleeping=false;u.sleepBlend=0;u.socialPose='Idle';u.tipsy=0;u.onWatch=true;g.rotation.set(0,g.rotation.y,0);}
 function update(dt,minutes){
  const u=g.userData,m=minute(minutes),aboard=!!u.aboardFerry,atMinato=run.berth==='town';
  if(state==='ashore'){
   if(aboard){state='aboard';leaveChair();}
   else if(m>=FERRY_WORKING_DAY.signOn&&m<FERRY_DAY.generators&&atMinato&&!u.ferryShoreTask&&shed.routine.state==='watching'){
    state='to-ship';leaveChair();walker.plan(b,landing,{margin:24,exempt});
   }
  }
  if(state==='to-ship'){
   if(walker.step(b,dt)){state='at-gangway';g.rotation.y=-Math.PI/2;}
   else if(b.blocked){b.blocked=null;state='to-shed';walker.plan(b,chair,{margin:24,exempt});}
  }
  if(state==='at-gangway'){
   if(aboard)state='aboard';
   // The bridge did not take him (she was away after all): back to the shed.
   else if(m>=FERRY_DAY.generators+3||m<FERRY_WORKING_DAY.signOn){state='to-shed';walker.plan(b,chair,{margin:24,exempt});}
  }
  if(state==='aboard'&&!aboard){
   // Signed off: down the gangway at Minato, or already back in his chair if she lies elsewhere.
   setWorldPoint(g,atMinato?landing:chair);g.visible=true;g.rotation.y=chairYaw;
   state=atMinato?'to-shed':'ashore';if(state==='to-shed')walker.plan(b,chair,{margin:24,exempt});else u.onWatch=false;
  }
  if(state==='to-shed'){
   if(b.blocked){b.blocked=null;setWorldPoint(g,chair);state='ashore';}
   else if(walker.step(b,dt))state='settling';
  }
  if(state==='settling'){
   // The last few centimetres straight to the chair's own point, at walking pace, so sitting down starts from it.
   const at=worldPoint(g),d=distance(at,chair),stride=Math.min(d,Math.min(Math.max(dt,0),.5)*SHORE_SPEED);
   if(d<=.005||stride>=d){setWorldPoint(g,chair);g.rotation.y=chairYaw;state='ashore';}
   else setWorldPoint(g,at.map((v,i)=>v+(chair[i]-v)*stride/d));
  }
  if(state==='ashore')u.onWatch=false;
  u.walking=state==='to-ship'||state==='to-shed'||state==='settling';
  if(state==='to-ship')u.activity='walking to the gangway to sign on';
  else if(state==='at-gangway')u.activity='at the gangway, signing on';
  else if(state==='to-shed'||state==='settling')u.activity='signed off, walking back to his shed';
  return state;
 }
 return {update,get state(){return state;},chair,landing};
}
