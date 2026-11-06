import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sunPath,SUN_PATH,clock} from '../src/render/dusk.js';

const at=(h,m=0)=>h*60+m;
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,a.x*b.x+a.y*b.y+a.z*b.z)))*180/Math.PI;

test('the sun is in the east and low in the morning',()=>{
 for(const minutes of [at(6,30),at(7),at(7,30),at(8)]){
  const s=sunPath(minutes);
  assert.ok(s.x>.7,'east (+x) at '+minutes);
  assert.ok(s.elevation>=SUN_PATH.floor-1e-9&&s.elevation<=22,'low at '+minutes+': '+s.elevation);
  assert.ok(s.azimuth>85&&s.azimuth<125,'rising over the east beach: '+s.azimuth);
 }
});

test('the sun is high over the south at noon',()=>{
 const s=sunPath(at(12));
 assert.ok(s.elevation>48&&s.elevation<=SUN_PATH.noon,'October noon at 26°N: '+s.elevation);
 assert.ok(s.z<0&&Math.abs(s.x)<.2,'south (−z)');
});

test('the sun is in the west and low (8–12°) through the golden hour',()=>{
 for(const minutes of [at(17,30),at(17,40),at(18),at(18,30)]){
  const s=sunPath(minutes);
  assert.ok(s.x<-.8,'west (−x) at '+minutes);
  assert.ok(s.elevation>=8&&s.elevation<=12,'low at '+minutes+': '+s.elevation);
 }
 // Afternoon: already sinking toward the west, well below noon.
 const four=sunPath(at(16));assert.ok(four.x<-.3&&four.elevation<35&&four.elevation>15);
});

test('the night keeps the direction the key light always had, so the night look is unchanged',()=>{
 const old={x:-30,y:12,z:12},l=Math.hypot(old.x,old.y,old.z),moon={x:old.x/l,y:old.y/l,z:old.z/l};
 for(const minutes of [at(21),at(23),at(2),at(4,59)])assert.ok(angle(sunPath(minutes),moon)<1,'moon at '+minutes);
 assert.ok(angle(sunPath(at(20)),moon)<1,'at the moon by 20:00');
});

test('the sun never jumps: a steady drift, fastest in the dark hour before dawn',()=>{
 let previous=sunPath(0),worst=0,worstDay=0;
 for(let m=1;m<=1440;m++){const next=sunPath(m),d=angle(previous,next);worst=Math.max(worst,d);if(m>at(6)&&m<=at(20))worstDay=Math.max(worstDay,d);previous=next;}
 // The hour before sunrise carries the light from the moon's quarter over to the east, the fastest it ever moves
 // (a steady great-circle drift under four degrees a minute, with the sun at a tenth of its strength).
 assert.ok(worst<4,'worst step '+worst+'°');
 assert.ok(worstDay<1,'worst step in daylight and dusk '+worstDay+'°');
 for(const m of [at(5),at(6),at(18,30),at(20)])assert.ok(angle(sunPath(m-.001),sunPath(m+.001))<.05,'continuous at '+m);
 const s=sunPath(at(12));assert.ok(Math.abs(Math.hypot(s.x,s.y,s.z)-1)<1e-9,'unit vector');
});

test('the clock carries the direction and the game places the sun from it',async()=>{
 const c=clock(at(17,40));
 assert.deepEqual(c.sunDirection,sunPath(at(17,40)));
 const game=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 assert.match(game,/c\.sunDirection/);
 assert.doesNotMatch(game,/sun\.position\.set\(sx-30,12\+day\*25,sz\+12\)/,'the fixed sun offset is gone');
 assert.match(game,/bounce\.position\.set\(-d\.x\*30,16,-d\.z\*30\)/,'the bounce keeps opposite the sun');
 assert.match(game,/setRoadPaintLight\(c\.decal\)/,'road paint takes the night');
});
