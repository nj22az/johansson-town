import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreSakura} from '../src/commerce/sakura-economy.js';
import {konbiniItem,defaultKonbini,restoreKonbini,addToBasket,removeFromBasket,basketLines,basketTotal,
 warmableInBasket,checkoutQuote,checkout,receiptText,tenderFor,STAMP_PER_YEN,CARD_STAMPS,WARMABLE,sakuraHoursOpen,SAKURA_AWAY_MESSAGE} from '../src/commerce/konbini.js';

/** A shopper standing in Sakura at 10:00 with a full shelf and money. */
const shopper=({yen=5000,stamps=0}={})=>{
 const state={yen,inventory:[],konbini:{...defaultKonbini(),stamps},sakura:restoreSakura()};
 return state;
};
const fill=state=>{for(const id of Object.keys(state.sakura.stock))state.sakura.stock[id].shelf=Math.max(state.sakura.stock[id].shelf,6);};

test('the basket takes what is on the shelf and refuses what is not',()=>{
 const state=shopper();fill(state);
 assert.equal(addToBasket(state,'tea').ok,true);
 assert.equal(addToBasket(state,konbiniItem('rice')).ok,true,'An item object works as well as an id');
 assert.deepEqual(basketLines(state).map(l=>l.id),['tea','rice']);
 assert.equal(basketTotal(state),konbiniItem('tea').cost+konbiniItem('rice').cost);
 addToBasket(state,'tea');
 assert.deepEqual(basketLines(state).map(l=>l.count),[2,1],'A second tea is a count, not a second line');
 assert.equal(addToBasket(state,'nothing-like-this').ok,false);
 // The shelf is the limit: you cannot basket more than she has.
 state.sakura.stock.soap.shelf=1;
 assert.equal(addToBasket(state,'soap').ok,true);
 const second=addToBasket(state,'soap');
 assert.equal(second.ok,false);
 assert.match(second.message,/sold out/);
 assert.equal(removeFromBasket(state,'soap'),true);
 assert.equal(removeFromBasket(state,'soap'),false,'Removing what is not there is not an error');
});

test('she offers to warm only what a microwave would take',()=>{
 const state=shopper();fill(state);
 addToBasket(state,'soap');addToBasket(state,'notebook');
 assert.deepEqual(warmableInBasket(state),[],'Soap is not offered warm');
 addToBasket(state,'rice');
 assert.deepEqual(warmableInBasket(state).map(l=>l.id),['rice']);
 for(const id of WARMABLE)assert.ok(konbiniItem(id),'Every warmable id is a real item: '+id);
});

test('the quote is the counter speaking before any money moves',()=>{
 const state=shopper();fill(state);
 for(let i=0;i<4;i++)addToBasket(state,'battery');   // 4 x 180 = 720
 const quote=checkoutQuote(state,{warm:false,bag:true});
 assert.equal(quote.total,720);
 assert.equal(quote.stampsEarned,Math.floor(720/STAMP_PER_YEN));
 assert.equal(quote.tendered,1000,'You would hand over a thousand-yen note');
 assert.equal(quote.change,280);
 // Nothing has been taken: asking is free.
 assert.equal(state.yen,5000);
 assert.equal(basketTotal(state),720);
 assert.equal(tenderFor(500),500);
 assert.equal(tenderFor(501),1000);
 assert.equal(tenderFor(12000),20000,'Beyond the biggest note it rounds up in ten-thousands');
});

test('checkout takes the money, the stock and the basket exactly once',()=>{
 const state=shopper();fill(state);
 const teaShelf=state.sakura.stock.tea.shelf;
 addToBasket(state,'tea');addToBasket(state,'tea');addToBasket(state,'rice');
 const total=basketTotal(state);
 const result=checkout(state,{warm:true,bag:true},600);
 assert.equal(result.ok,true);
 assert.equal(state.yen,5000-total,'Paid once, in full');
 assert.deepEqual(state.inventory,['Green tea','Green tea','Plum rice ball']);
 assert.equal(state.sakura.stock.tea.shelf,teaShelf-2,'Two teas left the shelf');
 assert.equal(basketTotal(state),0,'The basket is emptied');
 assert.equal(state.konbini.visits,1);
 assert.deepEqual(result.receipt.warmed,['Plum rice ball'],'Only the rice ball was warmed');
 assert.deepEqual([...state.konbini.tried].sort(),['rice','tea'],'Both are recorded as tried');
 // The shop ledger saw real sales, not a lump.
 const sales=state.sakura.journal.filter(row=>row.kind==='Sale');
 assert.equal(sales.length,3);
 assert.equal(sales.reduce((sum,row)=>sum+row.revenue,0),total);
 assert.equal(state.sakura.cash>0,true);
});

test('a checkout that cannot complete puts every item back',()=>{
 const state=shopper();fill(state);
 addToBasket(state,'tea');addToBasket(state,'rice');addToBasket(state,'soap');
 const before={tea:state.sakura.stock.tea.shelf,rice:state.sakura.stock.rice.shelf,soap:state.sakura.stock.soap.shelf};
 // The soap sells out between picking it up and reaching the counter.
 state.sakura.stock.soap.shelf=0;
 const result=checkout(state,{},600);
 assert.equal(result.ok,false);
 assert.match(result.message,/sold out/);
 assert.equal(state.yen,5000,'No money moved');
 assert.deepEqual(state.inventory,[],'Nothing entered the bag');
 assert.equal(state.sakura.stock.tea.shelf,before.tea,'The tea went back on the shelf');
 assert.equal(state.sakura.stock.rice.shelf,before.rice);
 assert.equal(basketTotal(state)>0,true,'The basket is still yours to put back');
});

test('checkout refuses while Thuan is away mid-hours but still works when she is at the counter',()=>{
 const away=shopper();fill(away);addToBasket(away,'tea');
 // Afternoon walk window (~14:10): hours open, clerk not available.
 assert.equal(sakuraHoursOpen(850),true);
 const refused=checkout(away,{},850,false);
 assert.equal(refused.ok,false);
 assert.equal(refused.message,SAKURA_AWAY_MESSAGE);
 assert.equal(away.yen,5000,'Away refusal must not take money');
 assert.equal(basketTotal(away)>0,true,'Basket stays until she returns');
 // Same minute with her present still rings through.
 const present=shopper();fill(present);addToBasket(present,'tea');
 const ok=checkout(present,{},850,true);
 assert.equal(ok.ok,true);
 assert.equal(present.yen<5000,true);
 // In the shop's hours the clerk away from the counter is the away message; at night the till is simply closed (sakura-rota.js).
 const afternoon=shopper();fill(afternoon);addToBasket(afternoon,'tea');
 assert.match(checkout(afternoon,{},900,false).message,/away from the counter/);
 const night=shopper();fill(night);addToBasket(night,'tea');
 assert.match(checkout(night,{},1300,false).message,/till is closed/);
});

test('the till keeps Sakura’s hours (9:00–20:00, then the restock; shut at night) and short money is refused',()=>{
 const shut=shopper();fill(shut);addToBasket(shut,'tea');
 assert.equal(checkout(shut,{},1300).ok,false,'shut at 21:40');assert.match(checkout(shut,{},1300).message,/9:00–20:30/);
 const restock=shopper();fill(restock);addToBasket(restock,'tea');assert.equal(checkout(restock,{},1210).ok,false,'the till is cashed up during the restock');
 const early=shopper();fill(early);addToBasket(early,'tea');assert.equal(checkout(early,{},300).ok,false,'shut at 05:00');
 const nine=shopper();fill(nine);addToBasket(nine,'tea');assert.equal(checkout(nine,{},540).ok,true,'open at 09:00');
 const broke=shopper({yen:50});fill(broke);addToBasket(broke,'battery');
 assert.match(checkout(broke,{},600).message,/enough yen/);
 assert.equal(broke.sakura.stock.battery.shelf>0,true,'and the battery stays on the shelf');
 const empty=shopper();
 assert.match(checkout(empty,{},600).message,/basket is empty/);
});

test('stamps accumulate across visits and a full card is spent at once',()=>{
 // One short of a card, then a visit that tips it over.
 const state=shopper({yen:99999,stamps:CARD_STAMPS-1});fill(state);
 for(let i=0;i<3;i++)addToBasket(state,'battery');   // 540 yen -> 1 stamp
 const result=checkout(state,{},600);
 assert.equal(result.ok,true);
 assert.equal(result.receipt.stampsEarned,1);
 assert.equal(result.receipt.gift,'Green tea','A filled card puts a tea on the counter');
 assert.equal(state.konbini.cards,1,'The card is counted and taken back');
 assert.equal(state.konbini.stamps,0,'and the next card starts empty');
 assert.ok(state.inventory.includes('Green tea'));
 // The giveaway is in the book as a giveaway, not a sale.
 const gift=state.sakura.journal.find(row=>row.kind==='Stamp card');
 assert.ok(gift&&gift.revenue===0&&gift.cost>0,'It earned nothing and cost her the goods');
 assert.equal(state.konbini.stamps<CARD_STAMPS,true);
});

test('a hand-edited save cannot mint stamps, items or a full card',()=>{
 assert.deepEqual(restoreKonbini(undefined),defaultKonbini());
 assert.deepEqual(restoreKonbini({basket:['tea','not-real','rice']}).basket,['tea','rice']);
 assert.deepEqual(restoreKonbini({tried:['tea','tea','nope']}).tried,['tea'],'Duplicates and inventions are dropped');
 assert.equal(restoreKonbini({stamps:1e9}).stamps,CARD_STAMPS-1,'Stamps cannot exceed a card');
 assert.equal(restoreKonbini({stamps:CARD_STAMPS}).stamps,CARD_STAMPS-1,'A stored card is never already full');
 assert.equal(restoreKonbini({visits:-5}).visits,0);
 assert.equal(restoreKonbini({ownBag:'yes'}).ownBag,false);
 assert.deepEqual(Object.keys(restoreKonbini({})),Object.keys(defaultKonbini()));
});

test('the receipt reads like something the till printed',()=>{
 const state=shopper();fill(state);
 addToBasket(state,'rice');addToBasket(state,'rice');addToBasket(state,'tea');
 const {receipt}=checkout(state,{warm:true,bag:false},610.5000000000337);
 const text=receiptText(receipt);
 assert.match(text,/SAKURA SHOP/);
 assert.match(text,/1997 · 10:10\n/,'Fractional simulation minutes print as a whole minute');
 assert.match(text,/Plum rice ball ×2/,'Two of a thing is one line');
 assert.match(text,/TOTAL/);
 assert.match(text,/CHANGE/);
 assert.match(text,/WARMED · Plum rice ball/);
 assert.match(text,/Decline bag · own bag/,'Declining a bag is noted, never charged');
 // No bag charge -- that came in 2020. This used to look for a stray '¥3', which the
 // receipt's tax line now legitimately prints; it asks for the thing itself instead.
 assert.doesNotMatch(text,/レジ袋|bag fee|bag charge/i,'Bags were free in 1997');
 assert.match(text,/Includes consumption tax 5%/,'The till shows the five per cent that came in that April');
 assert.match(text,/Thank you very much/);
 assert.equal(receiptText(null),'');
});

// ---- the ritual as the player meets it ------------------------------------------
import {installDOM} from './fixtures.mjs';
import {SAVE_KEY} from '../src/save.js';
import {STORE_ITEMS} from '../src/commerce/catalogue.js';

const counter=async()=>{
 globalThis.navigator??={vibrate(){}};const dom=installDOM();
 const {createActivities}=await import('../activities.js?konbini='+Math.random());
 let minutes=600;
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>minutes,
  getSocialContext:()=>({inside:'market',thuanAvailable:true})});
 for(const id of Object.keys(acts.state.sakura.stock))acts.state.sakura.stock[id].shelf=6;
 return {dom,acts,setMinutes:v=>{minutes=v;}};
};
const body=()=>document.querySelector('#activityBody').firstChild.textContent;
const title=()=>document.querySelector('#activityTitle').textContent;
const pick=(acts,dom,id)=>{const item=STORE_ITEMS.find(i=>i.id===id)||{id};
 acts.action('store-item',item.name,item);dom.button(`Into the basket · ¥${item.cost}`);};

test('the shelf fills a basket and the counter runs the whole exchange',async()=>{
 const {dom,acts}=await counter();
 const start=acts.state.yen;
 pick(acts,dom,'rice');pick(acts,dom,'tea');
 assert.equal(acts.state.yen,start,'Nothing is paid for at the shelf');
 acts.konbiniCounter();
 // Warming is offered because a rice ball is in the basket.
 assert.match(body(),/Would you like that warmed/,'She offers to warm it');
 dom.button('Yes, please');
 assert.match(body(),/Would you like a bag/,'then asks about a bag');
 dom.button('I have my own');
 assert.match(body(),/Total ¥230/,'then reads out the total');
 assert.match(body(),/Stamp card/,'and mentions the stamp card');
 dom.button('Pay ¥230 in cash');
 assert.match(body(),/Thank you very much/,'She thanks you first');
 dom.button('Look at the receipt');
 assert.match(body(),/Receipt|SAKURA SHOP/,'A receipt is printed');
 assert.match(body(),/WARMED · Plum rice ball/);
 assert.match(body(),/Decline bag/,'Declining the bag is on it');
 assert.equal(acts.state.yen,start-230);
 assert.deepEqual(acts.state.inventory.sort(),['Green tea','Plum rice ball']);
 assert.equal(acts.state.konbini.basket.length,0);
});

test('soap is never offered warm, and the basket can be put back',async()=>{
 const {dom,acts}=await counter();
 pick(acts,dom,'soap');
 acts.konbiniCounter();
 assert.doesNotMatch(body(),/Would you like that warmed/,'A bar of soap is not microwaved');
 assert.match(body(),/Would you like a bag/);
 dom.button('Put something back');
 assert.match(title(),/Basket · Basket/,'The basket opens for a rethink');
 assert.match(body(),/1 item\(s\) · ¥90/);
 dom.button('Put back Sakura soap');
 assert.match(body(),/empty/,'An emptied basket says so');
 assert.equal(acts.state.konbini.basket.length,0);
});

test('the passport records the visit, the card and the last receipt',async()=>{
 const {dom,acts}=await counter();
 pick(acts,dom,'tea');
 acts.konbiniCounter();dom.button('Yes, please');dom.button('Pay ¥120 in cash');
 acts.close();
 acts.inventory();
 dom.button('Konbini passport');
 assert.match(body(),/Visits: 1/);
 assert.match(body(),/Stamp card/);
 assert.match(body(),/Tried 1 of/);
 assert.match(body(),/Green tea/);
 dom.button('Last receipt');
 assert.match(body(),/Thank you very much/,'The kept receipt is still readable');
 // and it survives a reload
 acts.save();
 const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
 assert.equal(saved.konbini.visits,1);
 assert.deepEqual(saved.konbini.tried,['tea']);
});

test('Thuan stands clear of the shelves she is serving',async()=>{
 const {SAKURA_LAYOUT,SAKURA_SHELVES,CLERK_CLEARANCE}=await import('../src/world/interiors/sakura-layout.js');
 const {circleHitsRect}=await import('../physics.js');
 const hits=(x,z,r)=>SAKURA_LAYOUT.colliders.some(c=>circleHitsRect(x,z,r,c));
 /** The largest radius that still fits where she stands. */
 const room=(x,z)=>{let lo=0,hi=1.5;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(hits(x,z,mid))hi=mid;else lo=mid;}return lo;};
 const tight=[];
 for(const [id,shelf] of Object.entries(SAKURA_SHELVES)){
  const [x,,z]=shelf.stand;
  const clear=room(x,z);
  // Comfortably more than she takes up, so an apron and a pair of shoulders do not
  // end up inside the goods — which is visible from the pavement now.
  if(clear<CLERK_CLEARANCE+.12)tight.push(id+' '+clear.toFixed(3));
 }
 assert.deepEqual(tight,[],'Shelf stand points leave her inside the shelving');
 assert.ok(CLERK_CLEARANCE>=.3,'and she is not modelled thinner than she walks');
});

test('the shopfront is cut for the shop that is actually inside it',async()=>{
 const {SAKURA_LAYOUT,SAKURA_FRONT}=await import('../src/world/interiors/sakura-layout.js');
 const {bounds,frontZ}=SAKURA_LAYOUT;
 // The frontage stands for the interior on the street, and the interior is shown
 // through its window unscaled. Anything narrower or shallower than the room can only
 // show a shrunk copy of it, which is what it did.
 assert.ok(SAKURA_FRONT.width>=bounds.maxX-bounds.minX,'The frontage is narrower than the shop');
 assert.ok(SAKURA_FRONT.depth>=frontZ-bounds.minZ,'The frontage is shallower than the shop');
 // and not so much wider that the room rattles around inside it.
 assert.ok(SAKURA_FRONT.width-(bounds.maxX-bounds.minX)<1.2,'The frontage is a hangar');
 assert.ok(SAKURA_FRONT.depth-(frontZ-bounds.minZ)<1.2,'The frontage is a hangar');
});

test('the shop stands in a yard you can walk round, with a back to look at',async()=>{
 
 const {routeAt}=await import('../src/world/layout.js?west-yard');
 const {SAKURA_FRONT}=await import('../src/world/interiors/sakura-layout.js');
 const front=-7.45,centre=-28+1.2,half=SAKURA_FRONT.width/2;
 // Only the frontage used to meet walkable ground: the shop stood in an invisible box
 // and the one building the town is about could not be walked round.
 for(const [side,x,z] of [
  ['north',front-SAKURA_FRONT.depth/2,centre+half+1.4],
  ['south',front-SAKURA_FRONT.depth/2,centre-half-1.4],
  ['behind',front-SAKURA_FRONT.depth-1.6,centre],
  ['in front',front+1.2,centre],
 ])assert.ok(routeAt(x,z,.32),'You cannot stand '+side+' of the shop');
 // and the yard is closed by a wall rather than simply stopping: beyond it is the next
 // quarter, reached by the lanes through the wall, not more of the yard.
 // Since the island's compaction (17 October) the coastal walking circuit (island-plan.js COAST_WALK) runs through
 // Nishi-machi there, on its own paving, so the ground is Nishi-machi's whichever surface the route reports.
 const {nishiAt}=await import('../src/world/okinawa/layout.js');const {westYardAt}=await import('../src/world/west-yard.js');
 const behind=[front-SAKURA_FRONT.depth-9,centre];
 assert.ok(['nishi-machi','island-coast-walk'].includes(routeAt(...behind,.32)?.id),'Behind the yard wall is not walkable Nishi-machi');
 assert.ok(nishiAt(...behind,.32)&&!westYardAt(...behind,.32),'Behind the yard wall is not Nishi-machi');
 
});

test('Examine opens the 3D inspector with Buy · Talk · Put back and baskets on Buy',async()=>{
 globalThis.navigator??={vibrate(){}};installDOM();
 const {createInspector}=await import('../inspect-3d.js');
 const {createActivities}=await import('../activities.js?examine='+Math.random());
 const {STORE_ITEMS}=await import('../src/commerce/catalogue.js');
 const THREE=await import('../vendor/three.module.js');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
 let dpr=2;const renderer={getPixelRatio:()=>dpr,setPixelRatio:n=>dpr=n,render(){}};
 const inspector=createInspector({scene,camera,renderer,canvas:document.createElement('canvas'),onInspect(){},resetInput(){}});
 const openLabels=()=>{
  const caption=[...document.body.children].find(el=>el.id==='inspect-caption');
  assert.ok(caption&&!caption.hidden);
  const buttons=[...caption.children].flatMap(group=>group.children||[]);
  return {caption,labels:buttons.filter(b=>!b.hidden).map(b=>b.textContent),buttons};
 };
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>600,
  getSocialContext:()=>({inside:'market',thuanAvailable:true}),
  onInspectShopGood:item=>inspector.open(item)});
 for(const id of Object.keys(acts.state.sakura.stock))acts.state.sakura.stock[id].shelf=6;
 const item=STORE_ITEMS.find(i=>i.id==='coffee');
 acts.action('store-item',item.name,item);
 assert.equal(inspector.active,true);
 assert.equal(document.documentElement.classList.contains('inspecting'),true);
 let {caption,labels,buttons}=openLabels();
 assert.deepEqual(labels.slice(0,4),['↶','↷','−','+'],'Orbit controls lead');
 assert.deepEqual(labels.slice(4),['Buy','Talk to Thuan','Put back']);
 assert.equal(document.activeElement?.textContent,'Put back','Safe exit is focused');
 inspector.render(.016);
 assert.match(caption.children[0].textContent,/¥120/);
 assert.match(caption.children[0].textContent,/Harbour walk fuel/);
 buttons.find(b=>b.textContent==='Buy').onclick();
 assert.equal(inspector.active,false);
 assert.equal(acts.state.konbini.basket.includes('coffee'),true);
 assert.match(document.querySelector('#activityBody').firstChild.textContent,/basket/i);
 const actsAway=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>600,
  getSocialContext:()=>({inside:'market',thuanAvailable:false}),
  onInspectShopGood:item=>inspector.open(item)});
 for(const id of Object.keys(actsAway.state.sakura.stock))actsAway.state.sakura.stock[id].shelf=6;
 actsAway.action('store-item',item.name,item);
 ({labels}=openLabels());
 assert.ok(!labels.includes('Talk to Thuan'));
 assert.deepEqual(labels.slice(4),['Buy','Put back']);
 inspector.close();
});

test('the till backbar places impulse props behind Thuan without new SKUs',async()=>{
 const {SAKURA_BACKBAR,SAKURA_LAYOUT}=await import('../src/world/interiors/sakura-layout.js');
 assert.equal(SAKURA_BACKBAR.length,9);
 assert.deepEqual(SAKURA_BACKBAR.map(p=>p.id),['ferry-tickets','phone-cards','stamps','gum','matches','osusume','postcard-stand','radio','batteries']);
 for(const prop of SAKURA_BACKBAR){
  assert.ok(prop.x>SAKURA_LAYOUT.staff[0],'Props sit on the wall behind the clerk');
  assert.ok(prop.x<6.7,'and stay inside the east wall');
 }
 globalThis.navigator??={vibrate(){}};installDOM();globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
 const old=fetch;const {readFile}=await import('node:fs/promises');
 globalThis.fetch=async input=>String(input).startsWith('blob:')?old(input):new Response(await readFile(new URL('../assets/'+new URL(input).pathname.split('/assets/')[1],import.meta.url)));
 try{
  const THREE=await import('../vendor/three.module.js');
  const {buildSakuraInterior}=await import('../src/world/interiors/sakura-interior.js');
  const room=new THREE.Group(),hits=[],spots=new Map();
  buildSakuraInterior({room,reg:(o,label)=>{hits.push(label);spots.set(label,o.position.clone());},action(){},exit(){}});
  // The books live on Thuan's desk in the back office, behind the shop floor wall.
  const ledger=spots.get('Read Sakura sales ledger');
  assert.ok(ledger.z<-1.17&&ledger.x>4.6,'The ledger is in the back office, not on the counter: '+ledger.toArray());
  assert.ok(hits.includes('Buy hot snacks from the case'),'The counter has a hot case');
  let desk=0,hot=0;room.traverse(o=>{if(o.name==='Sakura small office')desk++;if(o.name==='Sakura hot case header')hot++;});
  assert.ok(desk&&hot,'Desk and hot-case header are built');
  assert.ok(hits.includes('Buy from the till counter'),'The till goods can be bought, not only looked at');
  assert.ok(hits.includes('Read Sakura sales ledger'),'Ledger kept');
  assert.ok(hits.includes('Ring service bell'),'Bell kept');
  let backbar=0;room.traverse(o=>{if(o.name&&(o.name.includes('backbar')||o.name==='Sakura postcard stand'||o.name==='Sakura backbar batteries'))backbar++;});
  assert.ok(backbar>=5,'Backbar meshes are in the room');
 }finally{globalThis.fetch=old;}
});
