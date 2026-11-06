// The edition rule (src/edition.js; AGENTS.md, the owner's decision of 19 October 2026): the web budgets apply in a page
// without the desktop shell, and the Linux edition (window.johanssonDesktop) keeps the whole simulation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {editionOf,BUDGETS,WEB_PURSE} from '../src/edition.js';
import {createAttention} from '../src/people/attention.js';
import {webShelves,openingDay,restoreShopStock,SHOP_STOCK,takeShopStock} from '../src/commerce/shop-stock.js';
import {shortGreeting,SHORT_GREETING,SITUATIONS} from '../src/people/greetings.js';
import * as THREE from '../vendor/three.module.js';

test('a page without the desktop shell is the web edition; with it, Linux',()=>{
 assert.equal(editionOf({desktop:undefined,page:true,env:undefined}),'web');
 assert.equal(editionOf({desktop:{edition:'0.28'},page:true,env:undefined}),'linux');
 assert.equal(editionOf({desktop:true,page:true,env:undefined}),'linux');
 // Outside a page (node's suites) the full simulation runs unless asked otherwise.
 assert.equal(editionOf({desktop:undefined,page:false,env:undefined}),'linux');
 assert.equal(editionOf({desktop:undefined,page:false,env:'web'}),'web');
 assert.equal(editionOf({desktop:true,page:true,env:'web'}),'web');
});

test('Linux keeps every system; the web cuts only what is simulated, never what is drawn',()=>{
 const linux=BUDGETS.linux,web=BUDGETS.web;
 for(const key of ['residentsEverywhere','neighbourChats','conversations','trade','machinery','countedMoney','liveDocuments','pouring'])assert.equal(linux[key],true,'Linux keeps '+key);
 assert.equal(web.neighbourChats,true,'nearby residents converse on the web');
 for(const key of ['residentsEverywhere','conversations','trade','machinery','countedMoney','liveDocuments','pouring'])assert.equal(web[key],false,'the web cuts '+key);
 assert.ok(web.residentRadius>=30,'residents near the player live in full on the web');
 // Nothing in the budgets touches the look (the graphics ruling of 19 October: no device class drops it).
 for(const key of Object.keys(web))assert.doesNotMatch(key,/shadow|sample|hdr|ink|grade|dpr|resolution|stream/i);
});

test('attention: Linux attends everybody; the web attends the near and the seen',()=>{
 const camera=new THREE.PerspectiveCamera(60,1.6,.1,500);camera.position.set(0,1.7,0);camera.lookAt(0,1.7,-10);camera.updateMatrixWorld();
 const body=(x,z)=>{const g=new THREE.Group();g.position.set(x,0,z);return g;};
 const observer={x:0,z:0,inside:false};
 const linux=createAttention({camera,getObserver:()=>observer,budget:BUDGETS.linux});linux.update();
 assert.equal(linux.attends(body(0,200)),true);assert.equal(linux.attends(body(0,-200)),true);
 const web=createAttention({camera,getObserver:()=>observer,budget:BUDGETS.web});web.update();
 assert.equal(web.attends(body(3,4)),true,'near, behind or not');
 assert.equal(web.attends(body(0,30)),true,'behind but within the radius');
 assert.equal(web.attends(body(0,-120)),true,'far but in view');
 assert.equal(web.attends(body(0,120)),false,'far and behind the camera');
 observer.inside=true;web.update();
 assert.equal(web.attends(body(0,-120)),false,'indoors the street is reached by distance alone');
});

test('the web wallet is plenty; prices stay on the labels',()=>{
 assert.ok(WEB_PURSE>=Math.max(...SHOP_STOCK.map(s=>s.cost))*1000);
});

test('the web shelves: the player’s gap stays for the day and is full at the next opening',()=>{
 const state={sakura:{stock:restoreShopStock(null),shelvesDay:null}};
 const day2=2*1440;
 assert.equal(webShelves(state,day2+600),true);
 const before=state.sakura.stock.coffee.shelf;
 for(let i=0;i<before;i++)assert.ok(takeShopStock(state,'coffee'));
 assert.equal(state.sakura.stock.coffee.shelf,0);
 assert.equal(webShelves(state,day2+1100),false,'the same trading day');
 assert.equal(webShelves(state,day2+1440+300),false,'after midnight, before the shop opens');
 assert.equal(state.sakura.stock.coffee.shelf,0,'still the gap they left');
 assert.equal(openingDay(day2+1440+540),3);
 assert.equal(webShelves(state,day2+1440+540),true,'nine o’clock the next day');
 assert.equal(state.sakura.stock.coffee.shelf,before,'more coffee tomorrow');
 // The record is in the save: a reload the same day keeps the gap.
 const saved=JSON.parse(JSON.stringify(state));saved.sakura.stock.tea.shelf=3;
 assert.equal(webShelves(saved,day2+1440+700),false);assert.equal(saved.sakura.stock.tea.shelf,3);
});

test('the web greeting is one short line, for every temperament and moment',()=>{
 for(const speaker of ['Thuan','Thao','Mrs Sato','Tetsuo','Officer Mori'])for(const temper of ['sunny','dramatic','easy','dry'])
  for(const situation of [{hour:8},{hour:20,weather:'rain'},{weather:'typhoon'},{daysAway:40},{theirBirthday:true}])
   for(const day of [0,1,7]){const line=shortGreeting({speaker,temper,situation,day});assert.ok(line.text.length>0&&line.text.length<=SHORT_GREETING,speaker+' '+temper+' '+JSON.stringify(situation)+': '+line.text);assert.doesNotMatch(line.text,/\n|\{/);}
 assert.ok(SITUATIONS.length>3);
});
