import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {PROFILES} from '../src/people/profiles.js';
import {recipeFor} from '../src/avatars/cast.js';
import {TOPICS,TEMPERAMENTS,temperamentOf,writtenChat} from '../src/people/chat-lines.js';
import {chatPrompt,parseChat,createNeighbourWriter,describe} from '../src/people/town-mind.js';
import {createNeighbourChats,CHAT_REACH} from '../src/people/neighbour-chats.js';

const who=name=>{const p=PROFILES.find(q=>q.name===name);return {name,age:p.age,role:p.role,personality:p.personality,gossip:p.gossip,profile:recipeFor(name).profile};};
const seeded=(s=3)=>()=>((s=Math.imul(s^s>>>15,2246822507)+1>>>0)/4294967296);

test('every topic speaks in all four temperaments, briefly',()=>{
 assert.ok(TOPICS.length>=15);
 for(const t of TOPICS)for(const part of ['open','reply','close'])for(const k of TEMPERAMENTS){
  const line=t[part][k];assert.ok(line&&line.length<110,`${t.id}.${part}.${k}`);
 }
});

test('the town is a mix of temperaments, and a conversation sounds like its speakers',()=>{
 const kinds=new Set(PROFILES.map(p=>temperamentOf(recipeFor(p.name).profile)));
 assert.equal(kinds.size,4);
 const a=who('Masaru'),b=who('Tetsuo');assert.equal(temperamentOf(a.profile),'sunny');assert.equal(temperamentOf(b.profile),'dry');
 const chat=writtenChat(a,b,{random:()=>.9});
 const topic=TOPICS.find(t=>t.id===chat.topic);
 assert.deepEqual(chat.lines,[topic.open.sunny,topic.reply.dry,topic.close.sunny].map(s=>s.replace(/\{b\}/g,'Tetsuo')));
 assert.ok(!chat.lines.join(' ').includes('{'));
});

test('what they talk about follows the hour and the weather, and does not repeat',()=>{
 const a=who('Nhung'),b=who('Emi'),r=seeded(9);
 const night=new Set(),rain=new Set();
 for(let i=0;i<60;i++){night.add(writtenChat(a,b,{minutes:23*60,random:r}).topic);rain.add(writtenChat(a,b,{rain:true,random:r}).topic);}
 assert.ok(night.has('night'));assert.ok(!night.has('sunset'));assert.ok(rain.has('rain'));
 const avoid=TOPICS.filter(t=>t.id!=='fish').map(t=>t.id);
 assert.equal(writtenChat({...a,gossip:null},b,{avoid,random:()=>.1}).topic,'fish');
});

test('the model is told who each person is, and its answer is checked before anyone says it',()=>{
 const messages=chatPrompt(who('Masaru'),who('Tetsuo'),{minutes:17*60+40,rain:true,place:'the harbour street'});
 assert.match(messages[1].content,/Masaru, 51, .*Boisterous cook-at-heart\. Typhoon/);
 assert.match(messages[1].content,/Tetsuo, 40.*Quiet craftsman/);assert.match(messages[1].content,/17:40, in the rain/);
 assert.match(describe(who('Nhung')),/Nhung, 37, island doctor/);
 const ok=parseChat('Sure! {"lines":[{"who":"A","text":"Masaru: The squid is winning."},{"who":"B","text":"Let it."},{"who":"A","text":"\\"Never!\\""},{"who":"B","text":"Then bring a bigger pot."}]}','Masaru','Tetsuo');
 assert.deepEqual(ok,{speakers:[0,1,0,1],lines:['The squid is winning.','Let it.','Never!','Then bring a bigger pot.']});
 assert.equal(parseChat('{"lines":[{"who":"A","text":"As an AI I cannot"},{"who":"B","text":"Hi"}]}'),null);
 assert.equal(parseChat('{"lines":[{"who":"A","text":"*waves*"},{"who":"B","text":"Hi"}]}'),null);
 assert.equal(parseChat('{"lines":[{"who":"A","text":"Only me."}]}'),null);
 assert.equal(parseChat('not json at all'),null);
});

test('with the model running, pairs get conversations written ahead, and a chat uses one',async()=>{
 const calls=[];
 const mind={ready:true,complete:async messages=>{calls.push(messages);return JSON.stringify({lines:[{who:'A',text:'Chin fixed my radio. Now it only plays the weather.'},{who:'B',text:'Improvement.'},{who:'A',text:'It says rain. Forever.'},{who:'B',text:'Then it is accurate.'}]});}};
 const writer=createNeighbourWriter({mind,random:()=>.7});
 const scene=new THREE.Scene(),names=['Masaru','Tetsuo'];
 const world={people:names.map((name,i)=>{const g=new THREE.Group();g.userData.name=name;g.position.set(i*7,0,-4);scene.add(g);return {g,profile:PROFILES.find(p=>p.name===name)};})};
 const chats=createNeighbourChats({world,observer:()=>new THREE.Vector3(),writer,random:()=>.7});
 chats.update(2,1002);assert.equal(chats.current,null,'too far apart to chat yet');assert.equal(calls.length,1,'but near enough to write ahead');
 await new Promise(r=>setTimeout(r,0));assert.equal(writer.written,1);
 world.people[1].g.position.x=2;chats.update(1,1003);
 assert.equal(chats.current.topic,'llm');assert.equal(chats.current.text,'Chin fixed my radio. Now it only plays the weather.');
 assert.equal(chats.current.speaker.profile.name,'Masaru');
 chats.update(4.5,1007);assert.equal(chats.current.text,'Improvement.');assert.equal(chats.current.speaker.profile.name,'Tetsuo');
});

test('without the model nothing is fetched, and neighbours chat often, on varied subjects',()=>{
 let asked=0;const writer=createNeighbourWriter({mind:{ready:false,complete:async()=>{asked++;return null;}}});
 const scene=new THREE.Scene(),names=['Nhung','Hiroshi'];
 // Two metres apart: speakers stand 0.85–2.8 m from each other since the NPC social restoration of 25 October 2026
 // (briefs/HANDOFF-NPC-SOCIAL-2026-10-25.md, CHAT_REACH.apart 4.6 → 2.8). At the old 4 m they were out of reach.
 const world={people:names.map((name,i)=>{const g=new THREE.Group();g.userData.name=name;g.position.set(i*2,0,-4);scene.add(g);return {g,profile:PROFILES.find(p=>p.name===name)};})};
 const chats=createNeighbourChats({world,observer:()=>new THREE.Vector3(),writer,random:seeded(5)});
 const topics=[];let last=-1;
 for(let t=0;t<600;t+=.5){chats.update(.5,600+t/60);if(chats.count!==last&&chats.current){topics.push(chats.current.topic);last=chats.count;}}
 assert.equal(asked,0);
 assert.ok(topics.length>=12,`${topics.length} chats in ten minutes`);
 assert.ok(new Set(topics).size>=8,'varied: '+topics.join());
 assert.ok(CHAT_REACH.near<=.85&&CHAT_REACH.apart>=2.8&&CHAT_REACH.cooldown<45,'the reach the 25 October restoration records: 0.85–2.8 m');
});
