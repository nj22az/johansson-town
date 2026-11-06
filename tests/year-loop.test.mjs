import test from 'node:test';
import assert from 'node:assert/strict';
import {openYear,newYearDue,YEAR_KEEPS} from '../src/progression/year-loop.js';

const save={loopYear:2026,loops:0,yen:5400,inventory:['sata-andagi','fish:aji'],quest:3,fish:12,best:41,
 friendship:{Thuan:{points:420,talkDay:20365,giftDay:20365,giftsToday:2},Tetsuo:{points:60}},
 homeDecor:{wall:'harbour',items:[{id:'p1',kind:'plant',x:-2.5,z:.6,yaw:0}]},avatarRecipe:'abc',
 story:{chapter:4},sakura:{stock:{}},residentLife:{Reiko:{}},heardHappenings:['tug-of-war'],notes:['old note'],diary:[{day:1}],dailyDone:{a:1}};

test('within the same real year a save opens as it was',()=>{
 const {saved,turned}=openYear(save,new Date(2026,11,31,23,59));
 assert.equal(turned,false);assert.equal(saved,save);
});

test('a save from before the loop existed starts counting this year, losing nothing',()=>{
 const old={...save};delete old.loopYear;delete old.loops;
 const {saved,turned}=openYear(old,new Date(2026,9,7));
 assert.equal(turned,false);assert.equal(saved.loopYear,2026);assert.equal(saved.loops,0);assert.equal(saved.quest,3);
});

test('when the real year turns: friendships, bag, money and decorating stay; everything else starts over',()=>{
 assert.equal(newYearDue(save,new Date(2027,0,1,0,5)),true);
 const {saved,turned}=openYear(save,new Date(2027,0,1,0,5));
 assert.equal(turned,true);
 assert.equal(saved.loopYear,2027);assert.equal(saved.loops,1);
 assert.equal(saved.yen,5400);assert.deepEqual(saved.inventory,['sata-andagi','fish:aji']);
 assert.deepEqual(saved.homeDecor,save.homeDecor);assert.equal(saved.avatarRecipe,'abc');
 assert.deepEqual(saved.friendship,{Thuan:{points:420},Tetsuo:{points:60}},'friendship points stay; last year\'s day marks go');
 for(const gone of ['quest','fish','best','story','sakura','residentLife','heardHappenings','diary','dailyDone'])assert.equal(saved[gone],undefined,gone+' starts over');
 assert.match(saved.notes[0],/1 January 1997, again/);
 assert.notEqual(saved.friendship,save.friendship,'the old save is not changed in place');
 assert.equal(save.friendship.Thuan.talkDay,20365);
 for(const k of YEAR_KEEPS)assert.ok(typeof k==='string');
});

test('two years away is still one new start, counted once',()=>{
 const {saved}=openYear(save,new Date(2028,5,1));
 assert.equal(saved.loopYear,2028);assert.equal(saved.loops,1);
});
