import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installDOM,Element} from './fixtures.mjs';

test('WebMCP reports locked walking directions and only travels after unlock',async()=>{
 installDOM();globalThis.CSS={escape:s=>s};window.__JOHANSSON_RUNNING__=true;document.querySelector('#hud').classList.remove('hidden');
 document.modelContext={registerTool(){}};
 const button=new Element(),label=new Element();button.dataset={id:'izakaya',travel:'locked'};label.textContent='Minato Izakaya';button.querySelector=()=>label;
 let marked=0,moved=0;button.click=()=>{if(button.dataset.travel==='ready')moved++;else marked++;};
 const query=document.querySelector;document.querySelector=s=>{
  // This fixture represents the legacy directory: new search/filter/shortcut
  // selectors must be absent, as they are in an actual older page.
  if(s==='.menu-places'||s.includes('.town-search')||s.includes('[data-town-filter=')||s.includes('[data-shortcut='))return null;
  return s.includes('[data-id=')?button:query(s);
 };
 document.querySelectorAll=s=>s.includes('#directoryGrid')?[button]:[];
 document.querySelector('#directoryButton').click=()=>document.querySelector('#directory').classList.remove('hidden');
 await import('../webmcp.js');const api=window.__JOHANSSON_AGENT_API__;
 let result=JSON.parse(await api.travel({destination:'izakaya'}));assert.equal(result.ok,false);assert.match(result.error,/locked/);assert.equal(marked,1);assert.equal(moved,0);
 button.dataset.travel='ready';result=JSON.parse(await api.travel({destination:'izakaya'}));assert.equal(result.ok,true);assert.equal(moved,1);
 // An interior prompt remains in the DOM after leaving; agents must only see it
 // while the game's real visibility state says it can be used.
 const prompt=document.querySelector('#prompt');prompt.textContent='Read new-release card';prompt.classList.remove('on');
 window.__JOHANSSON_AGENT_CONTEXT__=()=>({destinations:{market:'Sakura Konbini',frontrow:'Front Row Books'},controlsAllowed:false});
 let state=api.getState();assert.equal(state.nearbyAction,'');assert.deepEqual(state.knownDestinations,{market:'Sakura Konbini',frontrow:'Front Row Books'});assert.equal(state.controls.move,false);
 for(const [method,args]of[['move',{direction:'forward'}],['look',{direction:'left'}],['jump',{}],['interact',{}]])assert.equal(JSON.parse(await api[method](args)).ok,false,`${method} must report the actual modal lock`);
 prompt.classList.add('on');window.__JOHANSSON_AGENT_CONTEXT__=()=>({destinations:{market:'Sakura Konbini'},controlsAllowed:true});
 state=api.getState();assert.equal(state.nearbyAction,'Read new-release card');assert.equal(state.controls.move,true);
 result=JSON.parse(await api.travel({destination:'Minato Izakaya'}));assert.equal(result.ok,false);assert.equal(result.error,'Unknown destination.');
 const bag=new Element();bag.classList.remove('hidden');bag.textContent='Nikuman bun';let selected=0;bag.click=()=>selected++;
 const hidden=new Element();hidden.textContent='Hidden snack';
 document.querySelector('#activity').classList.remove('hidden');
 document.querySelectorAll=selector=>selector.includes('#activity .bag-tile')?[bag,hidden]:[];
 assert.deepEqual(api.getState().activity.actions,[{index:0,label:'Nikuman bun'}]);
 assert.equal(JSON.parse(await api.chooseAction({label:'Nikuman bun'})).ok,true);assert.equal(selected,1);
 assert.equal(JSON.parse(await api.chooseAction({label:'Hidden snack'})).ok,false);assert.equal(selected,1);
});
