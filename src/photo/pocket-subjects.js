import * as THREE from '../../vendor/three.module.js';

/**
 * Who and where a pocket photo shows, decided when the shutter goes (src/photo/pocket-viewfinder.js). The camera keeps
 * only the middle of the view, cropped to its 128x112 frame, so a person is in the photo when:
 *   - they are in front of the lens and no further than FAR,
 *   - their head is inside that cropped frame,
 *   - they stand at least MIN_HEIGHT of the frame's height tall (a speck in the distance is not a portrait), and
 *   - nothing solid stands between the lens and their head (`blocked`, the game's own sight test).
 * The biggest come first, at most MAX_PEOPLE. The place is the room when inside; outdoors, the nearest named place
 * (a shop's door, a landmark, a named spot) within PLACE_NEAR, ahead of the lens unless very close. A place says how
 * the words meet it (`at`: "on the main shopping street", "at Sato Ramen"); without one it is "at" its name.
 */
export const FAR=18,MIN_HEIGHT=.14,MAX_PEOPLE=8,PLACE_NEAR=26,PLACE_CLOSE=8;
export const FRAME_ASPECT=128/112;

const head=new THREE.Vector3(),feet=new THREE.Vector3();
/**
 * How the words meet a place whose name is not a shop's own (a shop reads "at Sato Ramen"): his own rooms are "at home",
 * a room or a village is "in" it, a lane is "on" it. The diary and the Evening News share the phrase, so each reads
 * in both voices ("Took a photo of Thuan at home"; "photographed by the mayor at home").
 */
export const PLACE_PHRASES=Object.freeze({
 'mayor-home':'at home',school:'in the school classroom','community-kitchen':'in the Community Hall',
 dungeon:'in the Old Sea Cave','aoba-garden':'in the Aoba Traditional Garden',
 'harbour-park':'in Minato Harbour Park','rainflower-florist':'at the flower buckets by Sakura’s door','nakamura':'at Nakamura’s dessert counter',
 'rainflower-lane':'on Rainflower Shopping Lane',
});
const atPlace=p=>p.at?String(p.at):PLACE_PHRASES[p.id]||(p.title==='House to let'?'in the house to let':'at '+String(p.title).replace(/^The /,'the '));

/** Where a world point falls in the cropped frame: x, y in -1..1 inside it, or null behind the lens. */
export function inFrame(camera,point,screenAspect){
 const p=point.clone().project(camera);if(p.z<-1||p.z>1)return null;
 // The crop keeps the frame's aspect from the middle of the screen: on a wide screen its sides are cut.
 const sx=screenAspect>FRAME_ASPECT?screenAspect/FRAME_ASPECT:1,sy=screenAspect<FRAME_ASPECT?FRAME_ASPECT/screenAspect:1;
 return {x:p.x*sx,y:p.y*sy};
}

/**
 * Whether one person is in the photo, and why not: {name, inPhoto, why, distance, frame:{x,y}|null, tall}.
 * person: {name, position (feet, Vector3), head? (Vector3, the head as posed: seated people sit lower), height (m),
 * visible}; blocked(from, to) → true when something solid is between.
 */
export function explainPerson({camera,person:p,screenAspect,blocked=()=>false,eye=camera.getWorldPosition(new THREE.Vector3())}){
 const out={name:p.name,inPhoto:false,why:'',distance:null,frame:null,tall:null};
 if(!p.visible||!p.name){out.why='not shown';return out;}
 feet.copy(p.position);if(p.head)head.copy(p.head);else{head.copy(p.position);head.y+=(p.height||1.6)*.92;}
 out.distance=+eye.distanceTo(head).toFixed(2);if(out.distance>FAR){out.why='too far';return out;}
 const h=inFrame(camera,head,screenAspect),f=inFrame(camera,feet,screenAspect);
 out.frame=h&&{x:+h.x.toFixed(2),y:+h.y.toFixed(2)};
 if(!h){out.why='behind the lens';return out;}
 if(Math.abs(h.x)>1||Math.abs(h.y)>1){out.why='head outside the frame';return out;}
 out.tall=+(f?(h.y-f.y)/2:1).toFixed(3);if(out.tall<MIN_HEIGHT){out.why='too small in the frame';return out;}
 if(blocked(eye,head)){out.why='something between';return out;}
 out.inPhoto=true;return out;
}

/** The names in the photo, biggest first, at most MAX_PEOPLE (people as for explainPerson). */
export function peopleInPhoto({camera,people,screenAspect,blocked=()=>false}){
 const eye=camera.getWorldPosition(new THREE.Vector3());
 return people.map(person=>explainPerson({camera,person,screenAspect,blocked,eye})).filter(e=>e.inPhoto)
  .sort((a,b)=>b.tall-a.tall).slice(0,MAX_PEOPLE).map(e=>e.name);
}

/**
 * room: {id, title} when inside, else null; places: [{id, title, at?, x, z}]. Returns {id, title, at} or null.
 */
export function placeOfPhoto({room,places,camera}){
 if(room)return {id:String(room.id),title:String(room.title),at:atPlace(room)};
 const eye=camera.getWorldPosition(new THREE.Vector3()),ahead=camera.getWorldDirection(new THREE.Vector3());
 let best=null,bestD=Infinity;
 for(const p of places){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||!p.title)continue;
  const dx=p.x-eye.x,dz=p.z-eye.z,d=Math.hypot(dx,dz);
  if(d>PLACE_NEAR||d>=bestD)continue;
  if(d>PLACE_CLOSE&&dx*ahead.x+dz*ahead.z<=0)continue;   // behind the photographer, and not right beside him
  best=p;bestD=d;
 }
 return best?{id:String(best.id),title:String(best.title),at:atPlace(best)}:null;
}
