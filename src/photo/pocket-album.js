/**
 * The pocket camera's album: the photos Johansson takes with the camera he carries (src/photo/pocket-viewfinder.js).
 *
 * What we kept from the 1998 camera (briefs/retro-study.md): a photo is four shades, so two bits a pixel, and the
 * album keeps the shades, not an image: a 128x112 photo is 3,584 bytes, and thirty of them fit in the save beside
 * everything else. Thirty places, as the camera had; a full album asks you to choose a photo to let go of, it never
 * drops one by itself. The look (the palette) is applied when a photo is shown, so the same shades print green or grey.
 *
 * A photo: {id, w, h, shades (base64, 4 pixels a byte, first pixel in the high bits), palette, day (the town day,
 *           town-clock.js townDay), minutes (of that day),
 *           place: {id, title} | null, people: [names], note}
 * `people` and `place` are what was in the frame when the shutter went: the storyteller reads them (src/feed/).
 */
import {townDate} from '../town-clock.js';
import {pocketModelOfPhoto} from './pocket-models.js';

export const ALBUM_SLOTS=30;
export const PHOTO_W=128,PHOTO_H=112;
export const PALETTES=Object.freeze(['green','grey','rose']);
const MAX_PEOPLE=8,MAX_TEXT=80;

/** Shades (0–3, one a pixel) as base64, four pixels a byte. */
export function packShades(shades){
 const bytes=new Uint8Array(Math.ceil(shades.length/4));
 for(let i=0;i<shades.length;i++)bytes[i>>2]|=(shades[i]&3)<<(6-2*(i&3));
 let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(s);
}

/** The shades back from base64 (`count` pixels), or null when the text is not a photo of that size. */
export function unpackShades(text,count){
 let raw;try{raw=atob(String(text));}catch{return null;}
 if(raw.length!==Math.ceil(count/4))return null;
 const out=new Uint8Array(count);
 for(let i=0;i<count;i++)out[i]=(raw.charCodeAt(i>>2)>>(6-2*(i&3)))&3;
 return out;
}

const clean=(v,n=MAX_TEXT)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,n);

/** What is wrong with a photo, as sentences (none: it can be kept). */
export function photoProblems(p){
 if(!p||typeof p!=='object')return ['That is not a photo.'];
 const out=[];
 if(typeof p.id!=='string'||!/^ph\d{1,6}$/.test(p.id))out.push('The photo has no proper number.');
 if(p.w!==PHOTO_W||p.h!==PHOTO_H)out.push(`A pocket photo is ${PHOTO_W} by ${PHOTO_H} pixels.`);
 else if(!unpackShades(p.shades,PHOTO_W*PHOTO_H))out.push('The picture in the photo is damaged.');
 if(!PALETTES.includes(p.palette))out.push('The photo has no known print colour.');
 if(!Number.isInteger(p.day)||p.day<0||!Number.isFinite(p.minutes)||p.minutes<0||p.minutes>=1440)out.push('The photo has no proper date.');
 if(!Array.isArray(p.people)||p.people.length>MAX_PEOPLE||!p.people.every(n=>typeof n==='string'&&n.trim()))out.push('The photo lists the people in it wrongly.');
 if(p.place!=null&&!(typeof p.place?.id==='string'&&typeof p.place?.title==='string'&&(p.place.at==null||typeof p.place.at==='string')))out.push('The photo names its place wrongly.');
 return out;
}

/** A saved album, cleaned: only sound photos, each id once, at most ALBUM_SLOTS, oldest first. */
export function restoreAlbum(list){
 if(!Array.isArray(list))return [];
 const seen=new Set(),out=[];
 for(const p of list){
  if(photoProblems(p).length||seen.has(p.id))continue;
  seen.add(p.id);
  out.push({id:p.id,w:p.w,h:p.h,shades:p.shades,palette:p.palette,day:p.day,minutes:Math.floor(p.minutes),
   place:p.place?{id:clean(p.place.id,40),title:clean(p.place.title),...(p.place.at?{at:clean(p.place.at)}:{})}:null,people:p.people.map(n=>clean(n,40)),note:clean(p.note)});
  if(out.length===ALBUM_SLOTS)break;
 }
 return out;
}

/**
 * The next photo number: after every one in the album and after `taken` (how many were ever taken, kept in the save),
 * so a number let go of is never given again (the diary knows a photo's moment by its number).
 */
export const nextPhotoId=(album,taken=0)=>'ph'+(Math.max(Number.isInteger(taken)&&taken>0?taken:0,album.reduce((n,p)=>Math.max(n,+p.id.slice(2)||0),0))+1);
/** Everyone ever photographed (kept in the save, so letting a photo go does not make the next one "first" again). */
export function restoreSeen(list,album=[]){
 const out=[];for(const n of [...(Array.isArray(list)?list:[]),...album.flatMap(p=>p.people)])if(typeof n==='string'&&n.trim()&&!out.includes(n.trim().slice(0,40)))out.push(n.trim().slice(0,40));
 return out.slice(-300);
}

/**
 * Keeps a photo: {ok, album} with the photo last, or {ok:false, problems} (the album is never changed then). A full
 * album says so: the player chooses which photo to let go of.
 */
export function addPhoto(album,photo){
 if(album.length>=ALBUM_SLOTS)return {ok:false,problems:[`The album is full: ${ALBUM_SLOTS} photos. Let one go to keep a new one.`]};
 const p={...photo,id:photo.id||nextPhotoId(album),note:clean(photo.note)};
 const problems=photoProblems(p);if(problems.length)return {ok:false,problems};
 if(album.some(q=>q.id===p.id))return {ok:false,problems:['There is already a photo with that number.']};
 return {ok:true,album:[...album,p],photo:p};
}

export const removePhoto=(album,id)=>album.filter(p=>p.id!==id);

const clock=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(Math.floor(m%60)).padStart(2,'0')}`;
const names=list=>list.length<=1?list.join(''):list.slice(0,-1).join(', ')+' and '+list.at(-1);

const WEEKDAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
/** When, as the diary dates its pages: "Friday 3 January, 12:40". */
export function photoDate(p){const {month,day,weekday}=townDate(p.day*1440+p.minutes);return `${WEEKDAYS[weekday]} ${day} ${MONTHS[month-1]}, ${clock(p.minutes)}`;}
/** What the photo shows, in words: "Mrs Sato and Thuan · Sato Ramen · Friday 3 January, 12:40". */
export function photoCaption(p){
 const who=p.people.length?names(p.people):null,where=p.place?.title||null;
 return [who,where,photoDate(p)].filter(Boolean).join(' · ');
}

/** Every photo a resident is in, and every photo taken at a place: what the storyteller asks. */
export const photosOf=(album,name)=>album.filter(p=>p.people.includes(name));
export const photosAt=(album,placeId)=>album.filter(p=>p.place?.id===placeId);

const placeIn=title=>String(title).replace(/^The /,'the ');
/**
 * What keeping a photo adds to the town's memory (src/progression/diary.js): a moment in Johansson's own words for the
 * diary, about the people in it (`who`). The first photo ever of a resident is a discovery and carries the Evening
 * News's own sentence; later photos of them are small notes. `seen`: everyone photographed before this one.
 * Nothing is chosen at random: the words follow from who and where the photo shows.
 */
export function photoMoment(photo,{seen=[]}={}){
 // How the words meet the place: its own phrase ("on the main shopping street"), or "at" its name.
 const who=photo.people,where=photo.place?(photo.place.at||'at '+placeIn(photo.place.title)):null;
 const first=who.filter(n=>!seen.includes(n));
 // The camera by its name: the Pocket Gentleman or the Pocket Lady took it (its palette says which).
 const with_=`with my ${pocketModelOfPhoto(photo).name} camera`;
 let text=who.length?`Took a photo of ${names(who)}${where?' '+where:''} ${with_}.`:where?`Took a photo ${where} ${with_}.`:`Took a photo ${with_}.`;
 if(first.length)text+=` My first photo of ${names(first)}.`;
 const moment={id:'photo:'+photo.id,kind:first.length?'discovery':'note',text};
 if(who.length)moment.who=who.slice(0,4);
 if(first.length)moment.news=`${names(first)} ${first.length>1?'were':'was'} photographed by the mayor${where?' '+where:''} today. The mayor has a ${pocketModelOfPhoto(photo).name} camera.`;
 return moment;
}
