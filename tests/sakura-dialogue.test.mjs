import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installDOM} from './fixtures.mjs';
import {SAVE_KEY} from '../src/save.js';
import {SAKURA_SCRIPT,sakuraEntry} from '../src/dialogue/sakura-script.js';
import {restoreStory,defaultStory,countTalk,dialogueAction,dialogueVariables,STORY_FLAGS} from '../src/dialogue/town-dialogue.js';

const body=()=>document.querySelector('#activityBody').firstChild.textContent;
const labels=()=>document.querySelector('#activityActions').children.map(b=>b.textContent);
const press=label=>{const b=document.querySelector('#activityActions').children.find(x=>x.textContent===label);
 assert.ok(b,'Missing choice: '+label+' in '+JSON.stringify(labels()));b.onclick();};
// Choices belong to the end of a node, so read the earlier pages first.
const readOn=()=>{for(let i=0;i<8&&labels().join()==='Go on';i++)press('Go on');};

async function town(saved={}){
 const dom=installDOM(Object.keys(saved).length?{[SAVE_KEY]:JSON.stringify(saved)}:{});
 const {createActivities}=await import('../activities.js?dialogue='+Math.random());
 let minutes=600;
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>minutes,
  getSocialContext:()=>({inside:'market',thuanAvailable:true})});
 return {dom,acts,setMinutes:v=>{minutes=v;}};
}

test('the generated script mirrors its JSON source',async()=>{
 const json=JSON.parse(await readFile(new URL('../src/dialogue/sakura.json',import.meta.url),'utf8'));
 assert.deepEqual(SAKURA_SCRIPT,json,'sakura-script.js must be regenerated when the JSON changes');
 // Every id a node points at has to exist, or a conversation dead-ends mid-sentence.
 const ids=new Set([...Object.keys(json),'end']);
 for(const [id,node] of Object.entries(json)){
  for(const choice of node.choices||[])assert.ok(ids.has(choice.next),id+' choice leads nowhere: '+choice.next);
  for(const next of [].concat(node.next||[]))
   assert.ok(ids.has(typeof next==='string'?next:next.id),id+' next leads nowhere');
  assert.ok(Array.isArray(node.text)&&node.text.length,id+' has a line to say');
 }
});

test('only declared flags survive a load, with their declared type',()=>{
 assert.deepEqual(restoreStory(undefined),defaultStory());
 assert.deepEqual(restoreStory({met_thuan:true,talks_today:2}).met_thuan,true);
 assert.equal(restoreStory({met_thuan:'yes'}).met_thuan,false,'A flag that is not a boolean is refused');
 assert.equal(restoreStory({smuggled:true}).smuggled,undefined,'A save cannot invent new flags');
 assert.equal(restoreStory({talks_today:1e9}).talks_today,999,'A counter stays in range');
 assert.equal(restoreStory({talks_today:'many'}).talks_today,0);
 assert.deepEqual(Object.keys(restoreStory({})),Object.keys(STORY_FLAGS));
});

test('actions write known flags and refuse anything else',()=>{
 const story=defaultStory(),notes=[];
 const act=dialogueAction({story,note:n=>notes.push(n)});
 act('set met_thuan true');assert.equal(story.met_thuan,true);
 act('set met_thuan false');assert.equal(story.met_thuan,false);
 act('set talks_today 4');assert.equal(story.talks_today,4);
 act('note Met Thuan, who keeps Sakura.');assert.deepEqual(notes,['Met Thuan, who keeps Sakura.']);
 act('set stowaway true');assert.equal(story.stowaway,undefined,'An unknown key is ignored');
 for(const bad of ['','set','nonsense here','drop database'])act(bad);
 assert.deepEqual(Object.keys(story),Object.keys(STORY_FLAGS),'A malformed action changes nothing');
});

test('Thuan tires of being asked, and the count resets with the town day',()=>{
 const story={...defaultStory(),met_thuan:true};
 for(let i=1;i<=3;i++)assert.equal(countTalk(story,600),i);
 assert.match(sakuraEntry(dialogueVariables({story,minutes:600})),/^sakura_return/,'Three visits are still welcome');
 countTalk(story,600);
 assert.equal(sakuraEntry(dialogueVariables({story,minutes:600})),'sakura_bored','The fourth gets the short answer');
 countTalk(story,600+1440);
 assert.equal(story.talks_today,1,'A new town day starts the count again');
 assert.match(sakuraEntry(dialogueVariables({story,minutes:600+1440})),/^sakura_return/);
});

test('the first meeting introduces her by name, and she is only met once',async()=>{
 const {acts}=await town();
 acts.thuanStory();
 assert.match(body(),/Welcome.*Thuan/,'She gives her name in the shop phrase');
 assert.equal(acts.state.story.met_thuan,true,'Meeting her is remembered straight away');
 assert.ok(acts.state.notes.some(n=>n.includes('Met Thuan')));
 press('Go on');
 assert.match(body(),/till and the plants/,'The second page follows in the same node');
 press('Just looking.');
 acts.thuanStory();
 assert.doesNotMatch(body(),/トゥアンです/,'A return visit is greeted as one');
 assert.equal(acts.state.notes.filter(n=>n.includes('Met Thuan')).length,1,'The note is not repeated');
});

test('a gated choice stays hidden until the flag that unlocks it is set',async()=>{
 const {acts}=await town();
 acts.thuanStory();readOn();press('Just looking.');
 acts.thuanStory();readOn();
 assert.ok(!labels().includes('Your assistant manager looks strict.'),'The plant is not a subject yet');
 assert.ok(!labels().includes('There is a letter.'),'Nor is the letter');
 acts.close();
 acts.state.story.inspected_plant=true;acts.state.story.has_letter=true;
 acts.thuanStory();readOn();
 assert.ok(labels().includes('Your assistant manager looks strict.'),'Seeing the plant opens the subject');
 press('There is a letter.');
 assert.match(body(),/Nam Phước/,'She reads one line of the letter');
 assert.equal(acts.state.story.heard_nam_phuoc,true);
});

test('closing up is offered only in the last hour, and only once',async()=>{
 const {acts,setMinutes}=await town();
 acts.thuanStory();readOn();press('Just looking.');
 setMinutes(660);            // 11:00, mid morning
 acts.thuanStory();readOn();
 assert.ok(!labels().includes('Need a hand closing?'),'Help closing cannot be offered at 11:00');
 acts.close();
 setMinutes(1160);           // 19:20, the last hour
 acts.thuanStory();readOn();
 assert.match(body(),/Good work today/,'The last hour has its own greeting');
 press('Need a hand closing?');
 press('Go on');
 assert.equal(acts.state.story.helped_close,true);
 assert.ok(acts.state.notes.some(n=>n.includes('close Sakura')));
 acts.close();
 setMinutes(1160);
 acts.thuanStory();readOn();
 assert.ok(!labels().includes('Need a hand closing?'),'It is not offered twice');
});

test('the letter is remembered after hours, and the flags reach the save',async()=>{
 const {acts,setMinutes}=await town();
 // The letter is not something you raise on first meeting her; she offers it on a return.
 acts.thuanStory();readOn();press('Just looking.');
 acts.state.story.has_letter=true;
 acts.thuanStory();readOn();press('There is a letter.');
 acts.close();
 setMinutes(1260);           // 21:00, after close
 acts.thuanStory();
 assert.match(body(),/stool is not going anywhere/,'After hours she talks like a person');
 press('Go on');press('Go on');
 assert.match(body(),/write back on Sunday/,'Having heard the letter adds a line only then');
 assert.equal(acts.state.story.sat_after_close,true);
 acts.save();
 const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
 assert.equal(saved.story.heard_nam_phuoc,true,'Story flags are written to the save');
 assert.equal(saved.story.sat_after_close,true);
 assert.deepEqual(restoreStory(saved.story).met_thuan,true,'and read back on reload');
});

test('the unscripted conversation is offered but never starts on its own',async()=>{
 const {acts}=await town();
 acts.action('resident','Thuan');
 assert.ok(labels().includes('Ask her something'),'It sits beside her written topics');
 assert.ok(labels().includes('Talk with Thuan'),'and does not replace them');
 press('Ask her something');
 // Node has no WebGPU, which is the same answer an older phone gives.
 assert.match(body(),/672MB|cannot answer freely/,'The cost or the refusal is stated before anything downloads');
 assert.ok(labels().some(l=>/Download and start|Not now/.test(l)),'Downloading is a choice, not a consequence');
 press('Not now');
});
