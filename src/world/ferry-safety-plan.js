import {FERRY_SHIP,FERRY_HEIGHTS,FERRY_GA,FERRY_SAFETY} from './ferry-ship.js';
import {keelY,bulwarkTop,halfBreadth} from './ferry-model.js';
/**
 * The fire control and safety plan (the creator, 2026-10-12: "There needs to be a safety plan posted as well, on the
 * vessel"): what is where for a fire or an abandonment, drawn once from the ship's data and posted aboard (the lower
 * lobby, the saloon, the crew corridor, the control booth; ferry-interior.js) and bound in the design book (sheet 6,
 * tools/ferry-drawings.mjs). It draws with a pen so the same plan goes onto a canvas in the game and into an SVG.
 *
 * The symbols follow the IMO signs a passenger knows: extinguishers and hydrants red, lifesaving orange, muster
 * stations and escapes green, fixed fire systems and fire doors red outlines, blue for the control stations.
 */
const L=FERRY_SHIP.length,HALF=L/2,T=FERRY_SHIP.draft,H=FERRY_HEIGHTS;
const at=(kind,deck,z,x,label='')=>Object.freeze({kind,deck,z,x,label});
const centre=(id)=>{const s=FERRY_GA.find(s=>s.id===id);return s?[(s.z[0]+s.z[1])/2,(s.x[0]+s.x[1])/2]:[HALF,0];};
/** Every item of the plan: where it is in the ship's frame (z forward of the transom, x to port). */
export const FERRY_SAFETY_ITEMS=Object.freeze([
 // Extinguishers: four on the car deck (at the casings and the bow houses), four on the passenger deck, two in the engine room, CO₂ at the electrics.
 at('extinguisher','car',9.6,3.0),at('extinguisher','car',11.2,-3.0),at('extinguisher','car',27,3.2),at('extinguisher','car',27,-3.2),
 at('extinguisher','passenger',9.5,2.4),at('extinguisher','passenger',16,2.6),at('extinguisher','passenger',16,-2.6),at('extinguisher','passenger',4.5,-1.5),
 at('extinguisher','hold',9.6,3.0),at('extinguisher','hold',11.2,-2.2),at('extinguisher','hold',14.3,1.0),at('extinguisher','hold',19.3,.9),
 at('co2-ext','bridge',21.5,0,'wheelhouse'),at('co2-ext','bridge',14.6,-2.0,'galley'),at('co2-ext','bridge',7.6,1.9,'EG room'),at('co2-ext','car',28.5,-3.0,'bow house S'),
 // Hydrants: the fire main's (ferry-piping.js 8.6): the car deck's four (ferry-model.js FERRY_DECK_FITTINGS: aft on the
 // casings' faces by the hose boxes, forward on the bulwark at the walkways), passenger deck either side, the engine room's.
 at('hydrant','car',15.8,2.65),at('hydrant','car',15.8,-2.65),at('hydrant','car',24,3.95),at('hydrant','car',24,-3.95),at('hydrant','passenger',12,2.9),at('hydrant','passenger',12,-2.9),at('hydrant','hold',13.7,3.75),
 // Fixed systems: CO₂ for the engine room from the CO₂ room; the fire detection panel in the wheelhouse; the fire pumps.
 at('co2-room','bridge',...centre('co2-room'),'CO₂ room'),at('fire-panel','bridge',21.9,-2.3,'detection panel'),at('fire-pump','hold',11.8,-3.7,'fire pumps'),at('eg','bridge',...centre('eg-room'),'emergency generator'),
 at('fuel-cutoff','bridge',8.3,-2.5,'fuel quick-closing valves · stop of pumps and fans'),at('co2-release','bridge',8.3,-1.6,'CO₂ release'),
 // Fire doors: the lobby's two sliding doors onto the lanes.
 at('fire-door','car',12.0,2.2),at('fire-door','car',12.0,-2.2),at('wt-door','hold',14.0,0,'WT door Fr 28'),
 // Lifesaving: five liferafts, the rescue boat, eight lifebuoys, the lifejacket lockers, the pyrotechnics in the wheelhouse.
 at('liferaft','passenger',4.5,2.6),at('liferaft','passenger',11,3.3),at('liferaft','passenger',17,3.3),at('liferaft','passenger',11,-3.3),at('liferaft','passenger',17,-3.3),
 at('rescue-boat','passenger',3.2,-1.2,'rescue boat'),
 at('lifebuoy','passenger',7,3.9),at('lifebuoy','passenger',14,3.9),at('lifebuoy','passenger',20,3.9),at('lifebuoy','passenger',22,3.9),at('lifebuoy','passenger',7,-3.9),at('lifebuoy','passenger',14,-3.9),at('lifebuoy','passenger',20,-3.9),at('lifebuoy','passenger',22,-3.9),
 at('lifejackets','passenger',19,0,'saloon lockers'),at('lifejackets','passenger',13.5,0,'carpet room'),at('lifejackets','passenger',9,-1.5,'lobby'),at('lifejackets','bridge',12,1.8,'crew cabins'),
 at('pyro','bridge',21,1.0,'rockets · flares · EPIRB · SART'),
 // Muster stations A (the saloon) and B (the open deck), and the escapes.
 at('muster','passenger',...centre('saloon'),'A'),at('muster','passenger',...centre('open-deck'),'B'),
 at('escape','car',6.5,2.6,'stair P'),at('escape','car',6.5,-2.6,'stair S'),at('escape','hold',8.7,2.9,'ladder'),at('escape','hold',8.6,-3.6,'escape trunk'),at('escape','hold',18.7,-3.6,'escape trunk'),at('escape','passenger',8.5,0,'to open deck'),
 // Control stations.
 at('control','bridge',...centre('wheelhouse'),'bridge'),at('control','hold',9.7,-3.2,'engine control booth'),
]);
export const FERRY_SAFETY_LEGEND=Object.freeze([
 ['extinguisher','Portable extinguisher (powder)'],['co2-ext','CO₂ extinguisher'],['hydrant','Fire hydrant and hose'],['co2-room','Fixed CO₂ (engine room)'],['co2-release','CO₂ release cabinet'],
 ['fire-panel','Fire detection panel'],['fire-pump','Fire pumps'],['fuel-cutoff','Remote stops: fuel, pumps, fans'],['eg','Emergency generator'],['fire-door','Fire door (self-closing)'],['wt-door','Watertight sliding door (remote close)'],
 ['liferaft','Liferaft, 25 persons'],['rescue-boat','Rescue boat, 6 persons'],['lifebuoy','Lifebuoy'],['lifejackets','Lifejackets'],['pyro','Pyrotechnics, EPIRB, SART'],['muster','Muster station A / B'],['escape','Escape route'],['control','Control station'],
]);
export const SAFETY_DECKS=Object.freeze([['bridge','BRIDGE DECK'],['passenger','PASSENGER DECK'],['car','CAR DECK'],['hold','HOLD · MACHINERY SPACES']]);
const COLOUR={fire:'#c2412f',life:'#e07b2a',green:'#2f8f4f',blue:'#2f5e9a',ink:'#1d2326',paper:'#f6f3ea',deck:'#eef1ee'};
/**
 * Draws the plan with `pen`: rect(x,y,w,h,{fill,stroke,width,dash}), circle(cx,cy,r,o), line(x1,y1,x2,y2,o), path(points,o),
 * text(x,y,s,{size,bold,align,colour}), into a box w × h at (0,0). `here` is the posting's deck and position, marked
 * YOU ARE HERE; null for the book's sheet. Returns nothing; the caller frames it.
 */
export function drawSafetyPlan(pen,w,h,here=null){
 const marginL=w*.03,plansTop=h*.3,plansH=h*.66,rowH=plansH/4,B=FERRY_SHIP.beam;
 const S=Math.min(w*.6/L,rowH*.86/B),planW=L*S,x0=marginL;      // px per metre: the four deck plans must stack in the height
 pen.rect(0,0,w,h,{fill:COLOUR.paper});
 pen.text(x0,h*.045,'FIRE CONTROL AND SAFETY PLAN · 防火設備・救命設備配置図',{size:h*.028,bold:true});
 pen.text(x0,h*.075,`${FERRY_SHIP.name.toUpperCase()} みなと丸 · ${FERRY_SAFETY.persons} persons · muster: A the saloon, B the open deck · alarm: ${FERRY_SAFETY.muster.alarm}`,{size:h*.016});
 // The profile, small, at the top: the decks as lines so the reader finds their deck.
 const PS=S*.55,py0=h*.265,px=z=>x0+z*PS,py=y=>py0-y*PS;
 const zs=Array.from({length:40},(_,i)=>i*L/39);
 pen.path(zs.map(z=>[px(z),py(keelY(z-HALF)+T)]),{stroke:COLOUR.ink,width:1.2});pen.path(zs.map(z=>[px(z),py(bulwarkTop(z-HALF)+T)]),{stroke:COLOUR.ink,width:1.2});
 pen.line(px(0),py(keelY(-HALF)+T),px(0),py(bulwarkTop(-HALF)+T),{stroke:COLOUR.ink,width:1.2});pen.line(px(L),py(keelY(HALF)+T),px(L),py(bulwarkTop(HALF)+T),{stroke:COLOUR.ink,width:1.2});
 pen.rect(px(6),py(H.compassDeck),(23-6)*PS,(H.compassDeck-H.passengerDeck)*PS,{stroke:COLOUR.ink,width:.8,fill:COLOUR.deck});pen.rect(px(3),py(H.passengerDeck),17*PS,(H.passengerDeck-H.carDeck)*PS,{stroke:COLOUR.ink,width:.8,fill:COLOUR.deck});
 for(const [name,y] of [['car deck',H.carDeck],['passenger deck',H.passengerDeck],['bridge deck',H.bridgeDeck]]){pen.line(px(0),py(y),px(L),py(y),{stroke:'#9aa3a6',width:.6,dash:[3,3]});pen.text(px(L)+4,py(y)+3,name,{size:h*.012});}
 pen.text(px(0),py(H.mastTop)-h*.01,'PROFILE · stern to the left',{size:h*.012,colour:'#4a5457'});
 pen.line(px(-.5),py(T),px(L+.5),py(T),{stroke:COLOUR.blue,width:.8,dash:[6,3]});
 // The deck plans, stacked: bridge, passenger, car, hold; port up.
 SAFETY_DECKS.forEach(([deck,title],i)=>{
  const oy=plansTop+i*rowH,cx=z=>x0+z*S,cy=x=>oy+rowH*.55-x*S;
  pen.text(cx(0),oy+rowH*.06,title,{size:h*.014,bold:true});
  const outline=zs.map(z=>[cx(z),cy(halfBreadth(z-HALF))]).concat(zs.slice().reverse().map(z=>[cx(z),cy(-halfBreadth(z-HALF))]));outline.push(outline[0]);
  pen.path(outline,{stroke:COLOUR.ink,width:1,fill:'#ffffff'});
  for(const s of FERRY_GA.filter(s=>s.deck===deck)){const [z0,z1]=s.z,[xa,xb]=s.x;pen.rect(cx(z0),cy(xb),(z1-z0)*S,(xb-xa)*S,{stroke:'#7d8586',width:.5,fill:COLOUR.deck});
   const label=s.id.replace(/-/g,' ');if((z1-z0)*S>label.length*h*.0062+4&&(xb-xa)*S>h*.014)pen.text(cx(z0)+2,cy(xb)+h*.011,label,{size:h*.0095,colour:'#4a5457'});}
  for(const it of FERRY_SAFETY_ITEMS.filter(it=>it.deck===deck))symbol(pen,it,cx(it.z),cy(it.x),Math.max(4,S*.55),h);
  if(here&&here.deck===deck){const hx=cx(here.z),hy=cy(here.x);pen.circle(hx,hy,S*.7,{stroke:COLOUR.blue,width:2});pen.circle(hx,hy,S*.2,{fill:COLOUR.blue});pen.text(hx+S*.8,hy+h*.006,'YOU ARE HERE · 現在地',{size:h*.014,bold:true,colour:COLOUR.blue});}
 });
 // The legend to the right.
 const lx=x0+planW+w*.06,ly0=h*.2,lh=(h*.76)/FERRY_SAFETY_LEGEND.length;
 pen.text(lx,h*.17,'LEGEND · 凡例',{size:h*.018,bold:true});
 FERRY_SAFETY_LEGEND.forEach(([kind,label],i)=>{const y=ly0+i*lh;symbol(pen,{kind,label:''},lx+8,y,Math.min(7,lh*.32),h);pen.text(lx+22,y+h*.006,label,{size:h*.014});});
 pen.text(lx,h*.985,'Posted under the Ship Safety Law · kept with the muster list · Johansson Shipyard drawing JS-127-06',{size:h*.011,colour:'#4a5457'});
}
function symbol(pen,it,x,y,r,h){
 const K=it.kind,txt=(s,c='#fff')=>pen.text(x,y+r*.42,s,{size:r*1.2,bold:true,align:'center',colour:c});
 switch(K){
  case 'extinguisher':pen.rect(x-r,y-r,2*r,2*r,{fill:COLOUR.fire});txt('E');break;
  case 'co2-ext':pen.rect(x-r,y-r,2*r,2*r,{fill:COLOUR.fire});txt('C');break;
  case 'hydrant':pen.circle(x,y,r,{fill:COLOUR.fire});txt('H');break;
  case 'co2-room':pen.rect(x-r*1.4,y-r,2.8*r,2*r,{fill:'#fff',stroke:COLOUR.fire,width:1.5});txt('CO₂',COLOUR.fire);break;
  case 'co2-release':pen.rect(x-r,y-r,2*r,2*r,{fill:'#fff',stroke:COLOUR.fire,width:1.5});txt('R',COLOUR.fire);break;
  case 'fire-panel':pen.rect(x-r,y-r,2*r,2*r,{fill:'#fff',stroke:COLOUR.fire,width:1.5});txt('P',COLOUR.fire);break;
  case 'fire-pump':pen.circle(x,y,r,{fill:'#fff',stroke:COLOUR.fire,width:1.5});txt('FP',COLOUR.fire);break;
  case 'fuel-cutoff':pen.rect(x-r,y-r,2*r,2*r,{fill:'#fff',stroke:COLOUR.fire,width:1.5});txt('S',COLOUR.fire);break;
  case 'eg':pen.rect(x-r,y-r,2*r,2*r,{fill:'#fff',stroke:COLOUR.blue,width:1.5});txt('EG',COLOUR.blue);break;
  case 'fire-door':pen.line(x,y-r*1.3,x,y+r*1.3,{stroke:COLOUR.fire,width:2.5});break;
  case 'wt-door':pen.rect(x-r*.35,y-r*1.3,r*.7,r*2.6,{fill:COLOUR.blue});pen.line(x-r*1.2,y,x+r*1.2,y,{stroke:COLOUR.blue,width:1.2});break;
  case 'liferaft':pen.rect(x-r,y-r,2*r,2*r,{fill:COLOUR.life});txt('25');break;
  case 'rescue-boat':pen.path([[x-r*1.4,y-r*.6],[x+r*1.4,y-r*.6],[x+r*.8,y+r*.7],[x-r*.8,y+r*.7],[x-r*1.4,y-r*.6]],{fill:COLOUR.life});break;
  case 'lifebuoy':pen.circle(x,y,r*.8,{stroke:COLOUR.life,width:r*.7});break;
  case 'lifejackets':pen.rect(x-r,y-r,2*r,2*r,{fill:COLOUR.life});txt('LJ');break;
  case 'pyro':pen.rect(x-r,y-r,2*r,2*r,{fill:COLOUR.life});txt('P');break;
  case 'muster':pen.rect(x-r*1.2,y-r*1.2,2.4*r,2.4*r,{fill:COLOUR.green});txt(it.label||'M');break;
  case 'escape':pen.path([[x-r*1.3,y],[x+r*1.3,y]],{stroke:COLOUR.green,width:r*.5});pen.path([[x+r*.4,y-r*.8],[x+r*1.4,y],[x+r*.4,y+r*.8]],{stroke:COLOUR.green,width:r*.5});break;
  case 'control':pen.rect(x-r,y-r,2*r,2*r,{fill:COLOUR.blue});txt('C');break;
 }
 if(it.label&&K==='control'&&r>4)pen.text(x+r*1.5,y+h*.004,it.label,{size:h*.0095,colour:'#4a5457'});
}
/** A pen that draws on a canvas 2D context. */
export function canvasPen(ctx){
 const stroke=(o)=>{if(o.stroke){ctx.strokeStyle=o.stroke;ctx.lineWidth=o.width||1;ctx.setLineDash(o.dash||[]);ctx.stroke();}};
 return {
  rect(x,y,w,h,o={}){ctx.beginPath();ctx.rect(x,y,w,h);if(o.fill){ctx.fillStyle=o.fill;ctx.fill();}stroke(o);},
  circle(cx,cy,r,o={}){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);if(o.fill){ctx.fillStyle=o.fill;ctx.fill();}stroke(o);},
  line(x1,y1,x2,y2,o={}){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);stroke(o);},
  path(pts,o={}){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));if(o.fill){ctx.fillStyle=o.fill;ctx.fill();}stroke(o);},
  text(x,y,s,o={}){ctx.fillStyle=o.colour||COLOUR.ink;ctx.font=(o.bold?'bold ':'')+Math.max(6,o.size||10)+'px Helvetica, Arial, sans-serif';ctx.textAlign=o.align||'left';ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);},
 };
}
/** A pen that writes SVG elements into `out` (an array of strings). */
export function svgPen(out){
 const r2=n=>Math.round(n*100)/100,esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
 const st=o=>`fill="${o.fill||'none'}" stroke="${o.stroke||'none'}" stroke-width="${o.width||1}"${o.dash?` stroke-dasharray="${o.dash.join(' ')}"`:''}`;
 return {
  rect(x,y,w,h,o={}){out.push(`<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" ${st(o)}/>`);},
  circle(cx,cy,r,o={}){out.push(`<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" ${st(o)}/>`);},
  line(x1,y1,x2,y2,o={}){out.push(`<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" ${st(o)}/>`);},
  path(pts,o={}){out.push(`<path d="M${pts.map(p=>p.map(r2).join(',')).join(' L')}" ${st(o)}/>`);},
  text(x,y,s,o={}){out.push(`<text x="${r2(x)}" y="${r2(y)}" font-size="${r2(o.size||10)}"${o.bold?' font-weight="bold"':''} fill="${o.colour||COLOUR.ink}"${o.align==='center'?' text-anchor="middle"':''}>${esc(s)}</text>`);},
 };
}
