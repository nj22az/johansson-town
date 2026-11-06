import {TourClient} from './tour-client.mjs';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const tour=new TourClient(process.env.TOWN_TOUR_OUTPUT||'interior-complete'),coverage=[];
try{
 await tour.connect();await tour.call('start_session',{spawn:'sakura-bench',time:'12:00'});await tour.call('press_control',{control:'forward',durationMs:300});
 await tour.shot('start');
 const only=process.argv.slice(2);const sites=tour.state.sites.filter(s=>(!only.length||only.includes(s.id))&&!['market','frontrow','izakaya','ramen','office'].includes(s.id));
 while(sites.length){const p=tour.state.game.player;sites.sort((a,b)=>Math.hypot(a.door[0]-p[0],a.door[2]-p[2])-Math.hypot(b.door[0]-p[0],b.door[2]-p[2]));const site=sites.shift();console.log('Entering '+site.id);let enter=await tour.enter(site);if(!enter.entered&&tour.state.game.room){const other=tour.state.game.room;coverage.push({id:other,note:'Entered a nearby actual doorway while approaching '+site.id,exploration:await tour.exploreRoom(other)});enter=await tour.enter(site);}let result={id:site.id,title:site.title,enter};if(enter.entered)result.exploration=await tour.exploreRoom(site.id);else await tour.shot(site.id+'-access-failure');coverage.push(result);await writeFile(resolve(tour.output,'coverage.json'),JSON.stringify(coverage,null,2));console.log(JSON.stringify({completed:site.id,entered:enter.entered,returned:result.exploration?.returned,remaining:sites.length}));if(tour.state.game.room){console.log('Stopping: current room remains open, no teleport exit.');break;}}
}finally{await writeFile(resolve(tour.output,'coverage.json'),JSON.stringify(coverage,null,2));await tour.close();}
