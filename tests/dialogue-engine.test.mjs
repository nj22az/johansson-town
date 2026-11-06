import test from 'node:test';
import assert from 'node:assert/strict';
import {createDialogue,conditionMet,compare,printable,END_DIALOG_ID} from '../src/dialogue/dialogue-engine.js';

test('special characters name the player and mark pauses without printing',()=>{
 assert.deepEqual(printable('Hello, &.','Johansson'),{text:'Hello, Johansson.',pauses:{}});
 const stutter=printable('s|t|u|ck');
 assert.equal(stutter.text,'stuck','Pause marks never reach the screen');
 assert.deepEqual(stutter.pauses,{1:1,2:1,3:1});
 assert.deepEqual(printable('wait|||then').pauses,{4:3},'Repeated marks pause for longer');
 assert.deepEqual(printable('&, again, &.','Nils').text,'Nils, again, Nils.');
});

test('comparisons follow the ported operator names',()=>{
 for(const op of ['equal','equals','is','=='])assert.equal(compare('a',op,'a'),true);
 for(const op of ['not_equal','not','!='])assert.equal(compare('a',op,'b'),true);
 assert.equal(compare(2,'less',10),true,'Ordered comparisons are numeric, not lexical');
 assert.equal(compare(2,'greater',10),false);
 assert.equal(compare('a','sideways','b'),false,'An unknown operator is false, never a throw');
});

test('an unset flag reads as false so conditions can predate it',()=>{
 assert.equal(conditionMet('data met_thuan is true',{met_thuan:'true'}),true);
 assert.equal(conditionMet('data met_thuan is true',{}),false);
 assert.equal(conditionMet('data met_thuan is false',{}),true);
 assert.equal(conditionMet('data coins greater 3',{coins:5}),true);
 assert.equal(conditionMet('data coins greater 3',{coins:1}),false);
 assert.equal(conditionMet('nonsense',{}),false,'A malformed condition is false, never a throw');
 assert.equal(conditionMet('quest coins greater 3',{coins:5}),false,'Only the data source is understood');
});

const script={
 open:{name:'Thuan',voice:'shop',icon:'thuan',text:['One.','Two.'],next:'after'},
 after:{text:['Done.']},
 branch:{text:['Pick.'],choices:[
  {text:'Always',next:'after'},
  {text:'Only once you have met her',next:'after',show_only_if:'data met_thuan is true'}]},
 conditional:{text:['Where next?'],next:[
  {id:'first',if:'data a is true'},
  {id:'second',if:'data b is true'},
  'fallback']},
 first:{text:['first']},second:{text:['second']},fallback:{text:['fallback']}
};

test('a node reads its pages in order and then leaves for the next id',()=>{
 const d=createDialogue({script});
 const open=d.start('open');
 assert.equal(open.text,'One.');assert.equal(open.speaker,'Thuan');assert.equal(open.voice,'shop');
 assert.equal(open.page,0);assert.equal(open.pages,2);assert.equal(open.atLastPage,false);
 const second=d.advance();
 assert.equal(second.text,'Two.');assert.equal(second.atLastPage,true);
 assert.equal(d.advance().text,'Done.','Turning the last page moves to the next node');
 assert.equal(d.advance().done,true,'A node with no next ends the conversation');
 assert.equal(d.advance().done,true,'Advancing past the end stays ended');
});

test('choices appear only on a node\'s last page and are filtered by their condition',()=>{
 let flags={};
 const d=createDialogue({script,variables:()=>flags});
 assert.deepEqual(d.start('branch').choices.map(c=>c.text),['Always'],'A failing condition hides its choice');
 flags={met_thuan:'true'};
 const shown=d.start('branch');
 assert.deepEqual(shown.choices.map(c=>c.text),['Always','Only once you have met her']);
 assert.equal(d.advance().id,'branch','A node with choices waits rather than moving on');
 assert.equal(d.choose(1).text,'Done.');
 // A page that is not the last one keeps its choices to itself.
 const paged=createDialogue({script:{p:{text:['first','last'],choices:[{text:'ok',next:END_DIALOG_ID}]}}});
 assert.deepEqual(paged.start('p').choices,[],'Choices stay hidden until the last page');
 assert.deepEqual(paged.advance().choices.map(c=>c.text),['ok']);
});

test('a conditional next takes the last match and falls back to the trailing id',()=>{
 const run=flags=>createDialogue({script,variables:()=>flags}).start('conditional');
 const step=flags=>{const d=createDialogue({script,variables:()=>flags});d.start('conditional');return d.advance().text;};
 assert.equal(run({}).text,'Where next?');
 assert.equal(step({}),'fallback','No condition met falls through to the trailing string');
 assert.equal(step({a:'true'}),'first');
 assert.equal(step({b:'true'}),'second');
 assert.equal(step({a:'true',b:'true'}),'second','Later entries take precedence over earlier ones');
});

test('actions run on entering a node and on taking a choice',()=>{
 const done=[];
 const d=createDialogue({
  script:{
   start:{text:['Hello.'],action:['set met_thuan true','note Met Thuan'],choices:[
    {text:'Buy tea',next:'bought',action:['set bought true']},
    {text:'Leave',next:END_DIALOG_ID}]},
   bought:{text:['Thank you.'],action:['set till 1']}},
  execute:act=>done.push(act)});
 d.start('start');
 assert.deepEqual(done,['set met_thuan true','note Met Thuan'],'Node actions run once, on entry');
 d.advance();
 assert.deepEqual(done.length,2,'Waiting on a choice runs nothing further');
 d.choose(0);
 assert.deepEqual(done,['set met_thuan true','note Met Thuan','set bought true','set till 1'],
  'The choice runs before the node it leads to');
 const quiet=[];
 const leave=createDialogue({script:{a:{text:['x'],choices:[{text:'go',next:END_DIALOG_ID}]}},execute:a=>quiet.push(a)});
 leave.start('a');assert.equal(leave.choose(0).done,true);assert.deepEqual(quiet,[]);
});

test('missing ids and malformed nodes end the conversation instead of throwing',()=>{
 const d=createDialogue({script});
 assert.equal(d.start('does-not-exist').done,true);
 assert.equal(d.start(END_DIALOG_ID).done,true);
 assert.equal(d.choose(0).done,true,'Choosing with nothing open is harmless');
 const single=createDialogue({script:{a:{text:'Just a string.'}}});
 assert.equal(single.start('a').text,'Just a string.','A bare string is treated as one page');
 const gone=createDialogue({script:{a:{text:['x'],next:'nowhere'}}});
 gone.start('a');assert.equal(gone.advance().done,true,'A next pointing nowhere ends cleanly');
});

test('the player name reaches the rendered line',()=>{
 const d=createDialogue({script:{a:{text:['Evening, &.']}},playerName:'Johansson'});
 assert.equal(d.start('a').text,'Evening, Johansson.');
});
