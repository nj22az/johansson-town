import {isRetired} from '../src/people/roster.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {seeded,tellComic,tellRecipe,tellCourse,tellOverheard,dailyEdition} from '../src/feed/storyteller.js';
import {GENRES} from '../src/feed/stories.js';
import {FEED_PLACES,STORY_PLACES} from '../src/feed/places.js';
import {POSES,EXPRESSIONS} from '../src/photo/layout.js';
import {CAST_NAMES} from '../src/people/cast.js';
const root=new URL('../',import.meta.url);
const catalogue=JSON.parse(await readFile(new URL('guide/residents.json',root)));
const names=new Set(catalogue.map(r=>r.name));
const clean=(text,what)=>{
 assert.equal(typeof text,'string',what);assert.ok(text.length>1,what+' is empty');
 assert.doesNotMatch(text,/[{}\[\]]|undefined|null|\ba a\b|\ba an\b|\bthe the\b|\ba [aeiou]/i,what+': '+text);
 assert.doesNotMatch(text,/[぀-ヿ一-鿿]/,what+' is English (Japanese belongs in fillText): '+text);
};

test('every place’s regulars are the live cast, every resident is a regular somewhere, and the police station is a place',()=>{
 for(const place of FEED_PLACES)for(const name of place.regulars)assert.ok(CAST_NAMES.includes(name)&&!isRetired(name),name+' is a regular at '+place.id+' but not in the cast');
 const regulars=new Set(FEED_PLACES.flatMap(p=>p.regulars));
 for(const name of CAST_NAMES)assert.ok(regulars.has(name),name+' is a regular nowhere');
 assert.deepEqual(catalogue.map(r=>r.name).sort(),[...CAST_NAMES].sort(),'the guide is exactly the live cast');
 const station=FEED_PLACES.find(p=>p.id==='police-station');assert.equal(station.shot.room,'koban');assert.ok(station.regulars.includes('Officer Mori'));
 assert.ok(FEED_PLACES.find(p=>p.id==='port-hall').regulars.includes('Ms Ganaha'),'the port clerk’s counter is a place');
 // A place still waiting for its backdrops (captured:false) is never a story's set, so no comic is drawn on nothing.
 const pending=FEED_PLACES.filter(p=>p.captured===false).map(p=>p.id);
 for(const id of pending)assert.ok(!STORY_PLACES.some(p=>p.id===id));
 const month=Array.from({length:40},(_,i)=>dailyEdition(new Date(Date.UTC(2026,9,1+i)),catalogue)).flat();
 for(const post of month)assert.ok(!pending.includes(post.place),post.place+' has no backdrop yet and still hosts a story');
 for(const place of STORY_PLACES)for(const r of catalogue)assert.ok(tellComic(seeded('set'+place.id+r.name),catalogue,{place,who:r.name}).place===place.id);
});

test('every genre tells a whole story with every resident at every real place',()=>{
 for(const genre of GENRES)for(const place of STORY_PLACES)for(const r of catalogue){
  const story=tellComic(seeded(genre.id+place.id+r.name),catalogue,{genre:genre.id,place,who:r.name});
  assert.ok(story.panels.length>=4&&story.panels.length<=8,genre.id+' is four to eight panels');assert.equal(story.place,place.id);
  clean(story.title,genre.id+' title');
  assert.ok(story.cast.every(n=>names.has(n))&&new Set(story.cast).size===story.cast.length,'Cast are distinct residents');
  for(const panel of story.panels){
   if(!['','…','!'].includes(panel.line))clean(panel.line,genre.id+' at '+place.id);
   if(panel.say)assert.ok(story.cast.includes(panel.say),'Speaker is in the scene');
   for(const actor of panel.actors){assert.ok(POSES.includes(actor.pose),actor.pose);assert.ok(EXPRESSIONS.includes(actor.expression),actor.expression);}
  }
 }
});

test('answers only follow the questions they fit',()=>{
 for(const genre of GENRES)genre.beats.forEach((options,i)=>{
  const before=new Set(i?genre.beats[i-1].map(o=>o.tag).filter(Boolean):[]);
  for(const o of options)for(const tag of o.after||[])assert.ok(before.has(tag),genre.id+' beat '+(i+1)+' answers a tag the beat before never sets: '+tag);
  if(i)for(const tag of before)assert.ok(options.some(o=>!o.after||o.after.includes(tag)),genre.id+' has an answer for '+tag);
 });
});

test('recipes, courses and overheard lines are complete',()=>{
 for(let i=0;i<300;i++){
  const rng=seeded('posts'+i),recipe=tellRecipe(rng,catalogue),course=tellCourse(rng,catalogue),heard=tellOverheard(rng,catalogue);
  for(const t of [recipe.title,recipe.tip,...recipe.ingredients,...recipe.steps,course.title,course.exam,...course.lessons,heard.line])clean(t,'post');
  assert.ok(recipe.steps.length>=4&&course.lessons.length===3);
 }
});

test('a day always tells the same stories, and different days differ',()=>{
 const sunday=dailyEdition('2026-10-04',catalogue)[0];assert.ok(sunday.panels.length>=6,'Sunday is the big funny page');
 const a=dailyEdition('2026-10-05',catalogue),b=dailyEdition('2026-10-05',catalogue),c=dailyEdition('2026-10-06',catalogue);
 assert.deepEqual(a,b);assert.notDeepEqual(a,c);
 assert.ok(a.some(p=>p.type==='comic'),'Every edition has a comic');
 const week=Array.from({length:30},(_,i)=>dailyEdition(new Date(Date.UTC(2026,9,1+i)),catalogue)).flat();
 assert.ok(new Set(week.filter(p=>p.type==='comic').map(p=>p.genre)).size>=8,'A month uses most genres');
 assert.ok(new Set(week.flatMap(p=>p.cast)).size>=Math.min(20,catalogue.length-2),'A month features most of the town');
 for(const p of week)for(const name of p.cast)assert.ok(!isRetired(name),name+' is retired and tells no story');
});

test('every place has its backdrop from the game',async()=>{
 for(const place of STORY_PLACES){
  const data=await readFile(new URL('assets/images/feed/'+place.id+'.webp',root));
  assert.equal(data.subarray(0,4).toString(),'RIFF',place.id);assert.ok(data.length>8000,place.id+' has detail');
 }
});

test('panels change camera, and twist endings happen',async()=>{
 const {SHOTS}=await import('../src/feed/storyteller.js');
 const strips=Array.from({length:200},(_,i)=>tellComic(seeded('shots'+i),catalogue));
 for(const s of strips)for(const p of s.panels){assert.ok(SHOTS.includes(p.shot),p.shot);assert.ok(p.actors.some(a=>a.name===p.focus),'Close shots are on someone in the panel');}
 assert.ok(strips.some(s=>new Set(s.panels.map(p=>p.shot)).size>=3),'Strips vary the camera');
 assert.ok(strips.some(s=>s.cast.length===3),'A third resident sometimes walks in for the ending');
});

test('the Sunday page lays panels out in rows, establishing shots and stares across the page',async()=>{
 const {pageLayout}=await import('../src/feed/comic.js');
 const shots=['wide','medium','medium','close','eyes','low','high','medium'];
 const layout=pageLayout(shots.map(shot=>({shot})));
 assert.equal(layout.cells.length,shots.length);
 layout.cells.forEach((c,i)=>{assert.ok(c.x>=0&&c.x+c.w<=layout.width&&c.y+c.h<=layout.height,'Panel '+i+' is on the page');if(['wide','eyes'].includes(shots[i]))assert.ok(c.w>layout.width*.9,shots[i]+' spans the page');});
 for(let i=0;i<layout.cells.length;i++)for(let j=i+1;j<layout.cells.length;j++){const a=layout.cells[i],b=layout.cells[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'Panels '+i+' and '+j+' do not overlap');}
});

test('every place was captured from the game with depth, a camera and somewhere to stand',async()=>{
 const views=JSON.parse(await readFile(new URL('assets/images/feed/views.json',root)));
 for(const place of STORY_PLACES){
  const set=views[place.id];assert.ok(set?.wide&&set.push,place.id+' has its views');
  for(const [name,view] of Object.entries(set)){
   assert.equal(view.camera.position.length,3);assert.equal(view.camera.quaternion.length,4);assert.ok(view.camera.fov>10);
   for(const suffix of ['','-depth']){const data=await readFile(new URL(`assets/images/feed/${place.id}-${name}${suffix}.webp`,root));assert.equal(data.subarray(0,4).toString(),'RIFF');}
  }
  assert.ok(Object.values(set).reduce((n,v)=>n+v.spots.stand.length,0)>=2,place.id+' has open floor to stand on');
 }
});
