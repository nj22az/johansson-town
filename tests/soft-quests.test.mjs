import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 pickDailyQuests,ensureDailyQuests,form3NudgeAllowed,recordFormSale,townDay,stockholmDayKey,SOFT_QUEST_POOL
} from '../src/progression/soft-quests.js';

test('same dayKey yields the same 1–2 picks from the fixed pool',()=>{
 const a=pickDailyQuests('2026-09-19');
 const b=pickDailyQuests('2026-09-19');
 assert.deepEqual(a,b);
 assert.ok(a.length===1||a.length===2);
 assert.ok(a.every(id=>SOFT_QUEST_POOL.includes(id)));
});

test('day change yields a fresh roll; mid-day reload keeps picks',()=>{
 const dayA=pickDailyQuests('2026-03-01');
 const dayB=pickDailyQuests('2026-03-02');
 // Different calendar keys must not be forced equal; assert reload stability instead.
 const state={lastDayKey:'2026-03-01',dailyQuests:dayA,dailyDone:{notice:true}};
 ensureDailyQuests(state,new Date('2026-03-01T15:00:00+01:00'));
 assert.equal(state.lastDayKey,'2026-03-01');
 assert.deepEqual(state.dailyQuests,dayA);
 assert.equal(state.dailyDone.notice,true);
 ensureDailyQuests(state,new Date('2026-03-02T08:00:00+01:00'));
 assert.equal(state.lastDayKey,'2026-03-02');
 assert.deepEqual(state.dailyQuests,dayB);
 assert.deepEqual(state.dailyDone,{});
});

test('form3 nudge suppressed when sold_form_day === townDay; sold_model is not forever mute',()=>{
 const minutes=1440*3+600; // town day 3, mid-morning
 const state={
  lastDayKey:stockholmDayKey(),
  dailyQuests:['form3_sell'],
  dailyDone:{},
  story:{sold_model:true,sold_form_day:townDay(minutes)},
 };
 assert.equal(form3NudgeAllowed(state,minutes),false,'same diegetic day silences Form 3');
 assert.equal(form3NudgeAllowed(state,minutes+1440),true,'next diegetic day can nudge again if still picked');
 const fresh={dailyQuests:['form3_sell'],dailyDone:{},story:{sold_model:false,sold_form_day:-1}};
 assert.equal(form3NudgeAllowed(fresh,minutes),true);
 recordFormSale(fresh,minutes);
 assert.equal(fresh.story.sold_model,true);
 assert.equal(fresh.story.sold_form_day,townDay(minutes));
 assert.equal(form3NudgeAllowed(fresh,minutes),false);
});
