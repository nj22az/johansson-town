import test from 'node:test';
import assert from 'node:assert/strict';
import {splitTitle,stepSelection} from '../src/dialogue/dialogue-box.js';
import {giftableItems,takeGift,giftReaction} from '../src/people/thuan-gifts.js';
import {restoreStory} from '../src/dialogue/town-dialogue.js';
import {installDOM} from './fixtures.mjs';
import {SAVE_KEY} from '../src/save.js';

test('the name tag is the speaker, with the place beside it',()=>{
 assert.deepEqual(splitTitle('Thuan · Heart of Sakura'),{speaker:'Thuan',place:'Heart of Sakura'});
 assert.deepEqual(splitTitle('Nhung'),{speaker:'Nhung',place:''});
 assert.deepEqual(splitTitle('Thuan · Counter · Evening'),{speaker:'Thuan',place:'Counter · Evening'});
});

test('the reply selection wraps round the list in both directions',()=>{
 assert.equal(stepSelection(0,1,3),1);
 assert.equal(stepSelection(2,1,3),0,'down from the last comes back to the first');
 assert.equal(stepSelection(0,-1,3),2,'up from the first goes to the last');
 assert.equal(stepSelection(-1,1,3),0);
 assert.equal(stepSelection(0,1,0),-1,'no replies, no selection');
});

test('anything in the bag can be a present except the rubbish and the book page',()=>{
 const bag=['Green tea','Returnable glass bottle','Taman','Green tea','Waterlogged page · Kings of Ben…','Bundle of empty cans'];
 assert.deepEqual(giftableItems(bag),['Green tea','Taman'],'each offered once, in order');
 assert.equal(takeGift(bag,'Green tea'),true);
 assert.equal(bag.filter(i=>i==='Green tea').length,1,'only one is given away');
 assert.equal(takeGift(bag,'Ice'),false,'nothing to give, nothing taken');
});

test('she is delighted by a present, and shy about a second one the same day',()=>{
 const first=giftReaction('Taman');
 assert.equal(first.mood,'happy');assert.match(first.text,/taman/i);
 assert.equal(giftReaction('Green tea').mood,'happy');
 assert.equal(giftReaction('A mystery',{giftsToday:0}).mood,'happy');
 const second=giftReaction('Green tea',{giftsToday:1});
 assert.equal(second.mood,'shy');assert.match(second.text,/spoiling/);
});

test('presents are remembered in the story flags across a reload',()=>{
 const story=restoreStory({gifts_given:3,gifts_today:1,gift_day:12,gifts_given_extra:5});
 assert.equal(story.gifts_given,3);assert.equal(story.gifts_today,1);assert.equal(story.gift_day,12);
 assert.equal(story.gifts_given_extra,undefined,'unknown keys are dropped');
 assert.equal(restoreStory({}).gift_day,-1);
});

test('giving Thuan a fish: she takes it, beams, and a second present makes her shy',async()=>{
 const dom=installDOM({[SAVE_KEY]:JSON.stringify({yen:500,inventory:['Taman','Green tea']})});
 const moods=[],feelings=[];
 window.__JOHANSSON_CHARACTER_CONTROL__={gesture(){},setExpression:(name,mood)=>moods.push(mood),feel:(name,mood,s)=>feelings.push([mood,s])};
 const {createActivities}=await import('../activities.js?gifts=1');
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>2*1440+700});
 acts.action('resident','Thuan');
 dom.button('Give her a present');
 assert.deepEqual(dom.labels(),['Taman','Green tea','Never mind']);
 dom.button('Taman');
 assert.match(document.querySelector('#activityBody').children[0].textContent,/taman/i);
 assert.equal(moods.at(-1),'happy','Her face lights up on the line');
 assert.deepEqual(feelings.at(-1),['happy',10],'and stays happy a while after');
 assert.ok(!acts.state.inventory.includes('Taman'),'The fish is hers now');
 assert.equal(acts.state.story.gifts_given,1);
 dom.button('Back to Thuan');dom.button('Give her a present');dom.button('Green tea');
 assert.equal(moods.at(-1),'shy','Two in a day is spoiling her');
 assert.equal(acts.state.story.gifts_today,2);
 acts.close();
 assert.equal(moods.at(-1),null,'Closing releases the pinned face');
 delete window.__JOHANSSON_CHARACTER_CONTROL__;
});

test('Johansson says what you pick, unless it is something you do rather than say',async()=>{
 const {spokenLine,speakerColour,readingBeat,playerLineTime}=await import('../src/dialogue/dialogue-box.js');
 assert.equal(spokenLine('How is Thuan?'),'How is Thuan?');
 assert.equal(spokenLine('I like your hair'),'I like your hair.','A plain label becomes a sentence');
 assert.equal(spokenLine('Talk with Thuan'),'Got a minute, Thuan?','Menu labels become what he would actually say');
 assert.equal(spokenLine('Pay ¥230 in cash'),'Here you are.');
 for(const silent of ['Go on','Look at the receipt','Back to Thuan','Read the shop ledger','Put something back'])assert.equal(spokenLine(silent),null,silent+' is done, not said');
 assert.equal(spokenLine('Sea bream','I brought you this — sea bream.'),'I brought you this — sea bream.','A button may carry its own line');
 assert.equal(spokenLine('Anything',''),null,'or none');
 assert.equal(speakerColour('Johansson'),'#ffffff','Johansson speaks in white');
 assert.equal(speakerColour('Thuan'),'#ffd56b');
 assert.equal(speakerColour('Someone new'),speakerColour('Someone new'),'Anyone else keeps one colour');
 assert.ok(readingBeat('short')<readingBeat('x'.repeat(80))&&readingBeat('x'.repeat(900))<=1600,'Longer lines get a longer beat, within reason');
 assert.ok(playerLineTime('Hi.')>=1200&&playerLineTime('x'.repeat(900))<=3200);
});
