import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {VENDING_PRODUCTS,RETIRED_VENDING,VENDING_BEER_HOURS,VENDING_BEER_STOCK,DRINKING_AGE,DRINKABLE,EMPTY_CAN,emptyFor,canColour,alcoholOf,
 beerOnSale,vendingRefusal,residentVendingChoice,vendingBuyersOf} from '../src/commerce/vending-catalogue.js';
import {VENDING_COLUMNS,VENDING_MACHINE,createVendingMachine} from '../src/world/vending.js';
import {LAGER_ALCOHOL,LIMIT} from '../src/people/drunk.js';
import {castMember,CAST} from '../src/people/cast.js';
import {PRODUCTS} from '../src/commerce/products-data.js';
import {SUPPLIERS} from '../src/commerce/merchandising.js';
installDOM();

/**
 * Beer in the drinks machines (the owner, 27 November 2026: "replace the generic teas and coffe we need the vending machine
 * to sell beer and you need to use Disney art style and draw them in Python"): the line-up and its reasons, the night's
 * stop and its source, nobody under twenty, the cans drawn in Python at the machine's and the hand's proportions, and the
 * teas and the coffee of old saves still drinking.
 */
const beers=VENDING_PRODUCTS.filter(p=>p.alcohol);
const words=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;

test('the line-up: beer where the teas and coffee were, every can with who presses it, why, and why it stands where it does',()=>{
 for(const id of ['harbour-tea','dockside-coffee','sanpin'])assert.ok(!VENDING_PRODUCTS.some(p=>p.id===id)&&RETIRED_VENDING.some(p=>p.id===id),id+' retired');
 assert.ok(beers.length>=3,'three beers');
 for(const keep of ['j-coffee','shikuwasa','ryukyu-cola','corn-soup'])assert.ok(VENDING_PRODUCTS.some(p=>p.id===keep),keep+' kept');
 for(const p of VENDING_PRODUCTS){
  assert.ok(Array.isArray(p.for)&&p.for.length,p.id+': who presses it');
  for(const name of p.for)assert.ok(castMember(name),`${p.id}: ${name} is a resident`);
  for(const k of ['who','why','placed'])assert.ok(words(p[k])>=6,`${p.id}: its ${k}`);
  // the town's own brands: no real brewer's or bottler's name, nobody else's characters
  assert.ok(!/orion|kirin|asahi|sapporo|suntory|yebisu|helios|disney|mickey|coca|pepsi/i.test([p.brand,p.subtitle,p.inventoryName,p.who,p.why,p.art?.mascot].join(' ')),p.id+': an own brand');
 }
 // the beer: Sakura's, in 350 ml and the 500 ml long can, at 1990s prices; the everyday can at Sakura's counter price
 const sakuraLager=PRODUCTS.find(p=>p.drink?.alcohol);
 assert.ok(beers.some(p=>p.size===350)&&beers.some(p=>p.size===500),'350 ml and 500 ml cans');
 for(const p of beers){assert.ok(p.price>=200&&p.price<=300,p.id+' at a 1990s can price: ¥'+p.price);assert.ok(p.abv>=4&&p.abv<=6,p.id+' a beer’s strength');}
 assert.equal(VENDING_PRODUCTS.find(p=>p.id==='kame-lager').price,sakuraLager.price,'the everyday can costs what Sakura asks for its lager');
 assert.equal(VENDING_PRODUCTS.find(p=>p.id==='kame-lager').alcohol,LAGER_ALCOHOL,'a 350 ml can of lager counts as Sakura’s does');
 assert.ok(VENDING_PRODUCTS.find(p=>p.id==='jugon-draft').alcohol>LAGER_ALCOHOL,'the long can counts for more');
 // the trade's rule: all the alcohol is Sakura's (merchandising.js), so the machines' beer is too
 assert.equal(VENDING_BEER_STOCK.supplier,'sakura');assert.ok(SUPPLIERS.sakura.alcohol.some(l=>/machine/.test(l)),'Sakura Trading supplies the machines’ beer');
 assert.ok(/1973/.test(VENDING_BEER_STOCK.why),'why it is Sakura’s: no licence for machines alone');
 // every beer named for grown-ups only; the children's own drinks are soft drinks
 for(const p of beers)for(const name of p.for)assert.ok(castMember(name).age===null||castMember(name).age>=DRINKING_AGE,`${p.id}: ${name} is of age`);
 for(const c of CAST.filter(c=>c.age!==null&&c.age<DRINKING_AGE))assert.ok(VENDING_PRODUCTS.filter(p=>p.for.includes(c.name)).every(p=>!p.alcohol),c.name+' is named only for soft drinks');
 assert.deepEqual(vendingBuyersOf('jugon-draft'),VENDING_PRODUCTS.find(p=>p.id==='jugon-draft').for);
 // the window: the beer the top row, at a grown-up's eye; the children's sodas the bottom row, at their hand
 assert.ok(VENDING_COLUMNS.filter(c=>c.beer).every(c=>c.row===0)&&VENDING_COLUMNS.filter(c=>c.row===0).every(c=>c.beer),'the top row is the beer');
 for(const id of ['shikuwasa','ryukyu-cola'])assert.ok(VENDING_COLUMNS.filter(c=>c.id===id).every(c=>c.row===1),id+' at a child’s height');
 for(const p of beers)assert.ok(VENDING_COLUMNS.filter(c=>c.id===p.id).every(c=>c.size===p.size),p.id+' in its own can’s columns');
 // a long-can column holds fewer, so the long can has more columns
 assert.ok(VENDING_MACHINE.columnCapacity[500]<VENDING_MACHINE.columnCapacity[350]);
 assert.ok(VENDING_COLUMNS.filter(c=>c.id==='jugon-draft').length>=VENDING_COLUMNS.filter(c=>c.id==='tako-black').length);
});

test('the long can stands in the window: the top row is tall enough for it, under the lit header',()=>{
 const g=createVendingMachine(),M=VENDING_MACHINE;
 for(const s of g.userData.samples.filter(s=>s.size===500)){const C=M.cans[500];assert.ok(s.y+C.height<s.top-.02,'the long can clear of the top of its window');}
 const [top]=M.bands;assert.ok(top.top<M.header.bottom-.02,'the window’s glass below the header’s bezel');
 assert.ok(M.header.top<M.size.height-.015,'the header inside the cabinet');
});

test('the night: no beer from 23:00 to 05:00, the soft drinks still sold; the rule has its source',()=>{
 assert.equal(VENDING_BEER_HOURS.stop,23*60);assert.equal(VENDING_BEER_HOURS.start,5*60);
 assert.ok(VENDING_BEER_HOURS.sources.some(s=>/nta\.go\.jp/.test(s)),'the National Tax Agency’s own account');
 for(const [m,on] of [[12*60,true],[22*60+59,true],[23*60,false],[23*60+30,false],[2*60,false],[4*60+59,false],[5*60,true],[1440*3+23*60+5,false],[1440*3+6*60,true]])
  assert.equal(beerOnSale(m),on,`beer at ${Math.floor(m%1440/60)}:${String(m%60).padStart(2,'0')}`);
 assert.equal(beerOnSale(12*60,{open:false}),false,'indoors, not while its hall is shut');
 const kame=VENDING_PRODUCTS.find(p=>p.id==='kame-lager'),soda=VENDING_PRODUCTS.find(p=>p.id==='shikuwasa');
 assert.match(vendingRefusal(kame,{minutes:23*60+30}),/^Sale stopped/);assert.equal(vendingRefusal(soda,{minutes:23*60+30}),null);assert.equal(vendingRefusal(kame,{minutes:21*60}),null);
 // the machine's beer buttons: lit by day, dark with 販売中止 by night (the lit atlas's own cells), the rest untouched
 const g=createVendingMachine(),beer=g.getObjectByName('Beer buttons'),lit=g.getObjectByName('Vending lit panels'),before=lit.geometry;
 const vAt=geo=>{const uv=geo.attributes.uv;let lo=1,hi=0;for(let i=0;i<uv.count;i++){lo=Math.min(lo,uv.getX(i));hi=Math.max(hi,uv.getX(i));}return [lo,hi];};
 assert.equal(beer.geometry.attributes.position.count,6*VENDING_COLUMNS.filter(c=>c.beer).length,'one lamp for each beer column');
 const day=vAt(beer.geometry);g.userData.beerOnSale(false);const night=vAt(beer.geometry);
 assert.ok(day[0]>=256/1024&&day[1]<=320/1024,'by day the cold lamp');assert.ok(night[0]>=896/1024&&night[1]<=960/1024,'by night 販売中止');
 assert.equal(beer.material,lit.material,'the same lit panel (a story dims them together)');assert.equal(lit.geometry,before);
 g.userData.beerOnSale(true);assert.deepEqual(vAt(beer.geometry),day);
 assert.ok(g.userData.parts.includes('Alcohol sticker'),'the sticker every alcohol machine carries: the warning, the stop hours, the seller');
});

test('the Port Terminal’s machine keeps the hours too: the hall never shuts, the beer stops at eleven',async()=>{
 const {buildPortHall}=await import('../src/world/interiors/port-hall.js');
 const room=new THREE.Group(),hall=buildPortHall({room,reg:(object,label,fn)=>{object.userData.hit={label,fn};},collider(){},action(){}});
 let machine=null;room.traverse(o=>{if(o.name==='Harbour vending machine')machine=o;});assert.ok(machine);
 hall.tick(0,23*60+20);assert.equal(machine.userData.beerSelling,false,'dark at 23:20');
 hall.tick(0,5*60+10);assert.equal(machine.userData.beerSelling,true,'lit again at 05:10');
});

test('the machine’s menu: the beer buttons dark at night and refused, the soft drinks sold; by day a beer is bought',async()=>{
 const {createActivities}=await import('../activities.js?snappy=1');
 const dom=installDOM();let minutes=23*60+30;const said=[];
 const acts=createActivities({say:s=>said.push(s),onWeather(){},onTime(){},getMinutes:()=>minutes});
 acts.state.yen=1000;acts.action('vending');
 assert.ok(dom.has('Kame · Island lager · not sold until 5:00')&&dom.has('Jugon · Big draft · not sold until 5:00'),'the beer stopped (in English; the lamps say 販売中止): '+dom.labels().join(' | '));
 dom.button('Kame · Island lager · not sold until 5:00');assert.equal(acts.state.yen,1000);assert.ok(!acts.state.inventory.includes('Kame lager'),'no beer at night');
 dom.button('Shikuwasa · Citrus soda · ¥120');assert.equal(acts.state.yen,880);assert.ok(acts.state.inventory.includes('Shikuwasa soda'),'the soda still sells');
 minutes=19*60;acts.action('vending');dom.button('Jugon · Big draft · ¥280');assert.equal(acts.state.yen,600);assert.ok(acts.state.inventory.includes('Jugon big draft'));
});

test('a resident at a machine: never a beer for a child; a grown-up’s beer in their own evening, counted as a bar’s',async()=>{
 for(const c of CAST.filter(c=>c.age!==null&&c.age<DRINKING_AGE))for(let m=0;m<1440;m+=30)for(const place of ['evening','stroll','park','work'])
  assert.ok(!residentVendingChoice({name:c.name,age:c.age,place,minutes:m}).alcohol,`${c.name} (${c.age}) at ${m}`);
 for(const p of beers)for(const name of p.for){const age=castMember(name).age;if(age===null)continue;
  assert.equal(residentVendingChoice({name,age,place:'evening',minutes:21*60}).id,p.for.includes(name)&&beers.find(b=>b.for.includes(name)).id,`${name}’s evening can`);
  assert.ok(!residentVendingChoice({name,age,place:'evening',minutes:23*60+15}).alcohol,`${name}: none after eleven`);
  assert.ok(!residentVendingChoice({name,age,place:'work',minutes:21*60}).alcohol,`${name}: none at work`);
  assert.ok(!residentVendingChoice({name,age,place:'evening',minutes:21*60,tipsy:LIMIT}).alcohol,`${name}: none past their limit`);}
 assert.ok(!residentVendingChoice({name:'Ryo',age:null,place:'evening',minutes:21*60}).alcohol,'no recorded age, no beer');
 // in the street: the machine's label, a grown-up and a child, each walked up to it in the evening
 const {createTownActivities}=await import('../src/people/town-activities.js');
 const {createResidentLedger}=await import('../src/people/resident-personalities.js');
 const machine=new THREE.Object3D();machine.position.set(0,1,0);machine.userData.hit={label:'Buy a drink',inside:false,fn:()=>{throw Error('a resident pressed the player’s button');}};
 const street=new THREE.Group();street.add(machine);
 for(const [name,beer] of [['Ryo',true],['Vy',false],['Riku',false]]){
  const state={},ledger=createResidentLedger(()=>state),activity=createTownActivities({getTargets:()=>[machine],collides:()=>false,ledger});
  const g=new THREE.Group();g.userData={name,hit:{inside:false}};g.position.set(2,0,0);street.add(g);const person={g,profile:{...castMember(name),name}},base={place:'evening',target:[2,0]};
  let use=null;for(let m=21*60;m<21*60+40&&!use?.drink;m+=1){activity.plan(person,base,m,false,.1);use=activity.stateFor(person);if(use?.target)g.position.set(use.target[0],0,use.target[1]);}
  assert.ok(use?.drink,name+' pressed a can');
  const bought=state.residentLife[name].purchases[0];
  assert.equal(!!use.drink.alcohol,beer,`${name}: ${use.drink.inventoryName}`);assert.equal(bought.cost,use.drink.price,'paid what it costs');
  assert.equal((g.userData.tipsy||0)>0,beer,'a beer counts toward the evening');
  activity.release(person,21*60+40);street.remove(g);
 }
});

test('old saves: the teas and the coffee bought before still drink, leave an empty and are printed as themselves',async()=>{
 const {createBoughtCan}=await import('../src/commerce/bought-can.js');
 const {bagCategory}=await import('../src/commerce/bag-catalogue.js');
 const colours={'Green tea':0x366451,'Canned coffee':0x784632,'Sanpin jasmine tea':0xc9a33a};
 for(const p of RETIRED_VENDING){
  assert.ok(DRINKABLE.has(p.inventoryName),p.inventoryName+' drinkable');assert.equal(emptyFor(p.inventoryName),EMPTY_CAN);
  assert.equal(canColour(p.inventoryName),colours[p.inventoryName]);assert.equal(alcoholOf(p.inventoryName),0,'no alcohol in tea');
  const can=createBoughtCan(p.inventoryName);assert.ok(can.getObjectByName('Printed can · '+p.brand),p.inventoryName+' in its own print');assert.ok(can.userData.sealed);
  assert.equal(bagCategory(p.inventoryName),'drinks','in the bag’s drinks');
 }
 assert.ok(createBoughtCan('Canned coffee').userData.rimHeight<createBoughtCan('Green tea').userData.rimHeight,'the coffee still its short 190 g can');
 // and the drink of a machine beer counts as Sakura's can does (game.js consume reads alcoholOf)
 assert.equal(alcoholOf('Umineko lager'),LAGER_ALCOHOL);for(const p of beers)assert.equal(alcoholOf(p.inventoryName),p.alcohol);
 assert.equal(alcoholOf('Shikuwasa soda'),0);
});

/** A WebP's pixel size from its header (VP8, VP8L or VP8X). */
function webpSize(buf){
 assert.equal(buf.toString('ascii',0,4),'RIFF');assert.equal(buf.toString('ascii',8,12),'WEBP');const kind=buf.toString('ascii',12,16);
 if(kind==='VP8X')return [1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)];
 if(kind==='VP8L'){const b=buf.readUInt32LE(21);return [1+(b&0x3fff),1+((b>>14)&0x3fff)];}
 return [buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];
}
test('the beer cans are drawn in Python, at the proportions the window’s can and the hand’s can wear them',async()=>{
 const script=readFileSync(new URL('../tools/draw-vending-cans.py',import.meta.url),'utf8');
 for(const p of beers){
  const file=new URL('../assets/'+p.art.file,import.meta.url);assert.ok(existsSync(file),p.art.file);
  assert.deepEqual(webpSize(readFileSync(file)),[p.art.width,p.art.height],p.id+': the file is the size the catalogue says');
  // once round the can, the printed band's height: pi d around, 0.86 of its height (vending.js sampleCan)
  const C=VENDING_MACHINE.cans[p.size],want=Math.PI*C.diameter/(.86*C.height);
  assert.ok(Math.abs(p.art.width/p.art.height-want)/want<.01,`${p.id}: its proportions ${(p.art.width/p.art.height).toFixed(3)}, the can's ${want.toFixed(3)}`);
  assert.ok(script.includes(`'${p.id}'`),p.id+' is drawn by the script');
  assert.ok(words(p.art.mascot)>=8,p.id+': its mascot described');
 }
 const poster=new URL('../assets/graphics/vending/beer-poster.webp',import.meta.url);assert.ok(existsSync(poster),'the side poster');
 // in his hand: the middle of the same drawing, at the same scale (no mascot stretched)
 const {createBoughtCan}=await import('../src/commerce/bought-can.js');
 for(const p of beers){const print=createBoughtCan(p.inventoryName).getObjectByName('Printed can · '+p.brand),uv=print.geometry.attributes.uv;let lo=1,hi=0;
  for(let i=0;i<uv.count;i++){lo=Math.min(lo,uv.getY(i));hi=Math.max(hi,uv.getY(i));}
  const share=.092/(.122*.86);assert.ok(Math.abs(hi-lo-share)<1e-6&&Math.abs(lo-(1-share)/2)<1e-6,`${p.id}: v ${lo.toFixed(3)}–${hi.toFixed(3)}`);}
});

test('a long can is opened and drunk as a can: the rim on his lip, never in his face',async()=>{
 const {buildAvatar}=await import('../src/avatars/build.js');const {recipeFor}=await import('../src/avatars/cast.js');
 const {createAvatarAnimator}=await import('../src/avatars/animate.js');const {lowerLip}=await import('../src/avatars/consume.js');
 const {CAN_PARTS,canRim}=await import('../src/avatars/drink-can.js');const {createBoughtCan}=await import('../src/commerce/bought-can.js');
 for(const who of ['Nils Johansson','Sverker']){
  const a=buildAvatar(recipeFor(who),{shadows:false}),holder=new THREE.Group();holder.add(a.root);
  const animator=createAvatarAnimator(a,{random:(()=>{let s=7;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};})()});
  const prop=createBoughtCan('Jugon big draft');a.bones.handR.add(prop);const state={heldProp:prop};
  for(let i=0;i<30;i++)animator.update(1/60,state);animator.play('DrinkCan');
  const lipLocal=lowerLip(a).lower;let rim=0,n=0,deep=0;
  const m=a.measure,ray=new THREE.Raycaster();
  for(let i=0;i<Math.round(CAN_PARTS.open[1]*60);i++){animator.update(1/60,state);holder.updateMatrixWorld(true);const c=animator.canCue;if(!c||c.w<.99)continue;
   if(c.lip>.99){rim=Math.max(rim,prop.localToWorld(canRim(prop)).distanceTo(a.bones.head.localToWorld(lipLocal.clone())));n++;}
   if(i%10)continue;
   // the long can's side and lid against his head: how far any of it goes in
   const centre=a.bones.head.localToWorld(new THREE.Vector3(0,m.headCentre-m.headY,0)),r=prop.userData.grip.radius,h=prop.userData.rimHeight;
   for(let j=0;j<=6;j++)for(let k=0;k<12;k++){const ang=k/12*Math.PI*2,p=prop.localToWorld(new THREE.Vector3(Math.cos(ang)*r*(j===6?.6:1),h*Math.min(j,5.8)/6,Math.sin(ang)*r*(j===6?.6:1)));
    const d=p.clone().sub(centre),len=d.length();if(len>m.Rh*1.6)continue;ray.set(centre,d.normalize());
    const out=ray.intersectObject(a.face.head,true).filter(x=>x.distance>=len);if(out.length&&out[0].distance-len>deep)deep=out[0].distance-len;}
  }
  assert.ok(n>100&&rim<.002,`${who}: the long can's rim on his lip over ${n} frames (${(rim*1000).toFixed(1)} mm)`);
  assert.ok(deep<.002,`${who}: the long can ${(deep*1000).toFixed(1)} mm into his face`);
  a.dispose?.();
 }
});
