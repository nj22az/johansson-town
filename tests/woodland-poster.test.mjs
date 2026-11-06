import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildHarbourNoticeboard,FLYER_PLACE,NOTICEBOARD} from '../src/world/harbour-noticeboard.js';
import {addSakuraFlyer} from '../src/world/sakura-flyers.js';
import {WOODLAND_POSTER,addWoodlandPoster} from '../src/world/woodland-poster.js';
import {FLYER_ITEM} from '../src/commerce/sakura-flyer.js';
import {createActivities} from '../activities.js';
import {installDOM,Element} from './fixtures.mjs';
import {coplanarOverlaps} from '../tools/z-fighting.mjs';

/** A small DOM/history fixture exercises the real Activities action and cleanup. */
function viewerDOM(href='https://nj22az.github.io/johansson-town/',{asyncHistory=false,origin=new URL(href).origin}={}){
 const dom=installDOM(),frames=[],events=new Map(),docEvents=new Map(),made=document.createElement;
 globalThis.location={href,origin};
 const emit=(kind,event)=>{for(const fn of [...(events.get(kind)||[])])fn(event);};
 window.addEventListener=(kind,fn)=>{if(!events.has(kind))events.set(kind,new Set());events.get(kind).add(fn);};
 window.removeEventListener=(kind,fn)=>events.get(kind)?.delete(fn);
 document.addEventListener=(kind,fn)=>{if(!docEvents.has(kind))docEvents.set(kind,[]);docEvents.get(kind).push(fn);};
 document.createElement=tag=>{
  const el=made(tag);el.tagName=tag.toUpperCase();
  if(tag==='iframe'){
   el.contentWindow={};el.attributes=new Map();
   el.setAttribute=(name,value)=>el.attributes.set(name,value);
   el.getAttribute=name=>el.attributes.get(name);
   el.remove=()=>{el.removed=true;const body=document.querySelector('#activityBody');body.children=body.children.filter(child=>child!==el);};
   frames.push(el);
  }
  return el;
 };
 const entries=[{world:'retained'}],pendingBack=[];let index=0,backCalls=0;
 const traverseBack=()=>{if(index>0){index--;emit('popstate',{state:entries[index]});}};
 window.history={
  get state(){return entries[index];},
  pushState(state,_title,url){assert.equal(url,href);entries.splice(index+1);entries.push(state);index++;},
  back(){backCalls++;if(asyncHistory)pendingBack.push(new Promise(resolve=>setTimeout(()=>{traverseBack();resolve();},0)));else traverseBack();}
 };
 const acts=createActivities({say(){},onWeather(){},onTime(){}});
 const open=()=>{acts.action('harbour-notice-board');dom.button('Look');return frames.at(-1);};
 const message=(frame,type,overrides={})=>emit('message',{
  source:frame.contentWindow,origin,
  data:{type,token:new URL(frame.src).searchParams.get('token')},...overrides
 });
 return {...dom,acts,frames,events,docEvents,open,message,history:window.history,get backCalls(){return backCalls;},async settleHistory(){while(pendingBack.length)await Promise.all(pendingBack.splice(0));}};
}

test('the woodland sheet and Thuan’s flyer sit in their drawn places on the remade board and stay pickable',()=>{
 installDOM();
 const root=new THREE.Group(),board=buildHarbourNoticeboard();
 root.add(board.object);
 const flyer=addSakuraFlyer(root,{position:FLYER_PLACE.position,width:FLYER_PLACE.width}),registered=[],actions=[];
 const poster=addWoodlandPoster(root,{register:(o,label,fn)=>{o.userData.hit={label,fn};registered.push(o);},onAction:(...args)=>actions.push(args)});
 root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(poster.getObjectByName('Woodland poster paper')),flyerBox=new THREE.Box3().setFromObject(flyer.getObjectByName('Thuan’s English shop flyer'));
 const u=x=>Math.round((x-5.5)*10000)/10,v=y=>Math.round(y*10000)/10,S=NOTICEBOARD.sight;
 // JW-NB-003: the 800 x 560 woodland sheet centred U -247.5 V 1530, inside the left door's sight opening
 assert.deepEqual([u(box.min.x),u(box.max.x),v(box.min.y),v(box.max.y)],[-647.5,152.5,1250,1810]);
 assert.ok(u(box.min.x)>=S.left.u[0]&&u(box.max.x)<=S.left.u[1]&&v(box.min.y)>=S.left.v[0]&&v(box.max.y)<=S.left.v[1]);
 // the A3 flyer space at U 465, the 900:1280 sheet contain-fitted: full 420 mm height, inside the right door's opening
 assert.equal(v(flyerBox.max.y)-v(flyerBox.min.y),420);assert.equal(Math.round(u(flyerBox.min.x)+u(flyerBox.max.x)),930);
 assert.ok(u(flyerBox.min.x)>=S.right.u[0]&&u(flyerBox.max.x)<=S.right.u[1]);
 // both papers lie between the pinboard face and the acrylic, in front of the cut-away board
 const D=z=>Math.round((z+33.2)*10000)/10;
 assert.ok(D(box.min.z)>NOTICEBOARD.backingFront&&D(box.max.z)<NOTICEBOARD.acrylic[0]);
 const print=poster.getObjectByName('Johansson woodland poster print');
 assert.equal(print.geometry.parameters.width/print.geometry.parameters.height,1.5);
 assert.deepEqual([print.geometry.parameters.width,print.geometry.parameters.height].map(x=>Math.round(x*1000)),[780,520]);
 assert.equal(print.material.type,'MeshBasicMaterial');assert.equal(print.material.toneMapped,false);
 assert.equal(registered[0],poster);assert.equal(poster.userData.hit.label,WOODLAND_POSTER.prompt);
 poster.userData.hit.fn();assert.deepEqual(actions,[['harbour-notice-board']]);
 // a click on the glazing goes through to the paper behind it
 const ray=new THREE.Raycaster(new THREE.Vector3(5.5-.2475,1.53,-32),new THREE.Vector3(0,0,-1));
 const first=ray.intersectObjects(root.children,true)[0];
 let o=first.object;while(o&&!o.userData.hit)o=o.parent;
 assert.equal(o,poster,'the first thing a click meets is the woodland print, not the acrylic');
 assert.equal(board.collider.w,1.55,'The closed plan envelope stays 1550 x 260');assert.equal(board.collider.d,.26);
});

test('the remade board: drawn envelope, hood fall, posts on their two grades, nothing flashing',()=>{
 installDOM();
 const root=new THREE.Group(),board=buildHarbourNoticeboard();root.add(board.object);
 addSakuraFlyer(root,{position:FLYER_PLACE.position,width:FLYER_PLACE.width});addWoodlandPoster(root);
 root.updateMatrixWorld(true);
 const b=new THREE.Box3().setFromObject(board.object);
 const mmR=x=>Math.round(x*10000)/10;
 assert.deepEqual([mmR(b.min.x-5.5),mmR(b.max.x-5.5)],[-775,775],'the hood is the widest part');
 assert.deepEqual([mmR(b.min.z+33.2),mmR(b.max.z+33.2)],[-130,130],'within the 260 mm plan depth');
 assert.equal(mmR(b.max.y),2180,'hood rear top');
 const post=side=>new THREE.Box3().setFromObject(board.object.getObjectByName(`Noticeboard ${side} post`));
 assert.equal(mmR(post('left').min.y),35);assert.equal(mmR(post('right').min.y),15);
 assert.equal(mmR(post('left').max.y),2100);
 const hood=new THREE.Box3().setFromObject(board.object.getObjectByName('Noticeboard hood sheet'));
 assert.equal(mmR(hood.max.y)-mmR(hood.min.y),32,'30 mm fall plus the 2 mm sheet');
 assert.ok(board.object.getObjectByName('Noticeboard header plate · みなと掲示板 / MINATO NOTICEBOARD'));
 assert.deepEqual(coplanarOverlaps(root,{tolerance:.002,minArea:.0004}),[],'no two faces on one plane');
 assert.equal(board.object.getObjectByName('Noticeboard left acrylic').raycast(),undefined);
});

test('one board menu offers Look and retains the existing free shop flyer without creating a viewer',()=>{
 const dom=viewerDOM();dom.acts.action('harbour-notice-board');
 assert.deepEqual(dom.labels(),['Look','Read Thuan’s flyer','Close']);
 assert.equal(dom.acts.viewerActive,false);assert.equal(dom.frames.length,0);
 const image=document.querySelector('#activityBody').children.find(el=>el.tagName==='IMG');
 assert.equal(image.src,WOODLAND_POSTER.image);
 dom.button('Read Thuan’s flyer');assert.match(document.querySelector('#activityTitle').textContent,/Sakura Shop/);
 assert.ok(dom.has('Take a free copy'));assert.ok(dom.has('About the board'));
 dom.button('Take a free copy');assert.deepEqual(dom.acts.state.inventory,[FLYER_ITEM]);
 assert.equal(dom.has('Take a free copy'),false);assert.equal(dom.frames.length,0);
 dom.acts.close();assert.equal(dom.acts.paused,false);
});

test('Look opens only the local embedded viewer; messages require the current source, origin and token',()=>{
 const dom=viewerDOM(),opener=new Element();opener.focus();
 const frame=dom.open(),url=new URL(frame.src),token=url.searchParams.get('token');
 assert.equal(url.pathname,'/johansson-town/diorama/woodland/index.html');
 assert.equal(url.origin,new URL(location.href).origin);assert.equal(url.searchParams.get('embedded'),'1');assert.ok(token);
 assert.equal(dom.frames.length,1);assert.equal(dom.acts.paused,true);assert.equal(dom.acts.viewerActive,true);
 assert.equal(dom.history.state.world,'retained');assert.equal(dom.history.state.johanssonDiorama,token);
 assert.ok(document.querySelector('#activity').classList.contains('woodland-view'));
 for(const override of [
  {source:{}},{origin:'https://example.invalid'},
  {data:{type:'johansson-diorama-close',token:'wrong'}}
 ])dom.message(frame,'johansson-diorama-close',override);
 assert.equal(dom.acts.viewerActive,true,'Other frames/pages and stale tokens cannot close World’s view');
 dom.message(frame,'johansson-diorama-ready');assert.equal(frame.getAttribute('aria-busy'),'false');
 dom.message(frame,'johansson-diorama-close');
 assert.equal(dom.acts.viewerActive,false);assert.equal(dom.acts.paused,false);assert.equal(frame.removed,true);
 assert.equal(dom.events.get('message').size,0);assert.equal(dom.events.get('popstate').size,0);
 assert.deepEqual(dom.history.state,{world:'retained'});assert.equal(dom.backCalls,1);
 assert.equal(document.activeElement,opener,'Closing returns focus to the original game control');
});

test('browser Back closes the diorama once and repeated opens leave no frames or listeners running',()=>{
 const dom=viewerDOM();
 const first=dom.open();dom.history.back();
 assert.equal(first.removed,true);assert.equal(dom.acts.viewerActive,false);assert.equal(dom.acts.paused,false);
 assert.equal(dom.backCalls,1,'The popstate close must not call Back for a second time');
 const second=dom.open();dom.acts.close();
 assert.equal(second.removed,true);assert.equal(dom.backCalls,2);assert.equal(dom.frames.length,2);
 assert.ok(dom.frames.every(frame=>frame.removed));
 assert.equal(dom.events.get('message').size,0);assert.equal(dom.events.get('popstate').size,0);
});

test('a quick reopen survives the previous viewer’s asynchronous Back and still supports browser Back',async()=>{
 const dom=viewerDOM(undefined,{asyncHistory:true}),first=dom.open();
 const firstToken=new URL(first.src).searchParams.get('token');
 dom.acts.close();
 assert.equal(first.removed,true);assert.equal(dom.history.state.johanssonDiorama,firstToken,'Back has not traversed yet');
 const second=dom.open(),secondToken=new URL(second.src).searchParams.get('token');
 assert.notEqual(secondToken,firstToken);assert.equal(dom.acts.viewerActive,true);
 assert.equal(dom.history.state.johanssonDiorama,firstToken,'The next marker waits for the pending traversal');
 dom.message(first,'johansson-diorama-close');assert.equal(dom.acts.viewerActive,true);
 await dom.settleHistory();
 assert.equal(dom.acts.viewerActive,true);assert.equal(second.removed,undefined);
 assert.equal(dom.history.state.johanssonDiorama,secondToken);assert.equal(dom.backCalls,1);
 assert.equal(dom.events.get('message').size,1);assert.equal(dom.events.get('popstate').size,1);
 dom.history.back();await dom.settleHistory();
 assert.equal(second.removed,true);assert.equal(dom.acts.paused,false);assert.equal(dom.backCalls,2);
 assert.deepEqual(dom.history.state,{world:'retained'});
 assert.equal(dom.events.get('message').size,0);assert.equal(dom.events.get('popstate').size,0);
});

test('a replacement activity destroys the viewer and survives delayed messages and history traversal',async()=>{
 const dom=viewerDOM(undefined,{asyncHistory:true}),frame=dom.open();
 dom.acts.menu('Town notes','The next activity',[['Close',dom.acts.close]]);
 assert.equal(frame.removed,true);assert.equal(dom.acts.viewerActive,false);assert.equal(dom.acts.paused,true);
 assert.equal(document.querySelector('#activity').classList.contains('woodland-view'),false);
 dom.message(frame,'johansson-diorama-close');
 assert.equal(document.querySelector('#activityTitle').textContent,'Town notes');assert.equal(dom.acts.paused,true);
 await dom.settleHistory();
 assert.equal(document.querySelector('#activityTitle').textContent,'Town notes');assert.equal(dom.acts.paused,true);
 assert.equal(dom.events.get('message').size,0);assert.equal(dom.events.get('popstate').size,0);
 dom.acts.close();assert.equal(dom.backCalls,1);
});

test('Escape leaves the viewer through normal modal cleanup',()=>{
 const dom=viewerDOM(),frame=dom.open();let prevented=false;
 dom.docEvents.get('keydown').at(-1)({code:'Escape',preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(frame.removed,true);assert.equal(dom.acts.paused,false);
 assert.equal(dom.acts.viewerActive,false);assert.equal(dom.backCalls,1);
});

test('the same relative viewer works on the offline desktop origin',()=>{
 const dom=viewerDOM('johansson://world/johansson-town/?desktop=1'),frame=dom.open();
 assert.ok(frame.src.startsWith('johansson://world/johansson-town/diorama/woodland/index.html?'));
 dom.message(frame,'johansson-diorama-ready');assert.equal(frame.getAttribute('aria-busy'),'false');
 dom.message(frame,'johansson-diorama-close');assert.equal(frame.removed,true);assert.equal(dom.acts.paused,false);
});

test('the registered desktop document origin takes precedence over the URL parser’s opaque origin',()=>{
 const href='johansson://world/johansson-town/?desktop=1';
 assert.equal(new URL(href).origin,'null');
 const dom=viewerDOM(href,{origin:'johansson://world'}),frame=dom.open();
 dom.message(frame,'johansson-diorama-ready',{origin:'null'});assert.equal(frame.getAttribute('aria-busy'),'true');
 dom.message(frame,'johansson-diorama-ready');assert.equal(frame.getAttribute('aria-busy'),'false');
 dom.message(frame,'johansson-diorama-close');assert.equal(frame.removed,true);assert.equal(dom.acts.paused,false);
});

test('fish auction reuses the supported cabinet with prices in its glazing and posts on the shed floor',async()=>{
 installDOM();
 const {buildAuctionBoard,AUCTION_BOARD:N}=await import('../src/world/auction-board.js');
 const {GROUND_LAYER}=await import('../src/world/ground-layers.js');
 const {EAST_QUAY}=await import('../src/world/okinawa/layout.js');
 const {object:g,collider:c}=buildAuctionBoard();g.updateMatrixWorld(true);
 for(const side of ['left','right']){
  const post=new THREE.Box3().setFromObject(g.getObjectByName(`Noticeboard ${side} post`));
  assert.ok(Math.abs(post.min.y-(GROUND_LAYER.apron+.1-.005))<1e-6);
 }
 assert.equal(c.yaw,-Math.PI/2);assert.equal(c.id,'auction-price-board');
 const box=new THREE.Box3().setFromObject(g);
 assert.ok(box.max.x<EAST_QUAY.shed.maxX,'whole assembly stays on the auction floor');
 assert.ok(box.min.x>EAST_QUAY.shed.minX+7.06,'clear of the catch collider');
 for(const [name,side] of [['Auction prices','left'],['Auction hours','right']]){
  const paper=g.getObjectByName(name),{width,height}=paper.geometry.parameters,s=N.sight[side];
  assert.ok(paper.position.x-width/2>=s.u[0]/1000&&paper.position.x+width/2<=s.u[1]/1000);
  assert.ok(paper.position.y-height/2>=s.v[0]/1000&&paper.position.y+height/2<=s.v[1]/1000);
 }
 assert.deepEqual(coplanarOverlaps(g,{tolerance:.002,minArea:.0004}),[]);
});
