/**
 * Sakura's wall band, from drawing set SK-WB-001..003 revision A (24 October 2026; docs/qa/sakura-wall-band/). The owner:
 * "The banner is not good, I think it needs cad specific as it's ugly there."
 *
 * Planed timber boards round the top of the shop-floor walls, signwritten by hand, one composition for each wall so no
 * word is repeated or cut at an edge. Millimetres throughout. Each run is read from inside the shop, left to right:
 * `u` runs along it from its left end; the lettering is laid out on that. A text's `w` is the width it may take (the
 * drawing's lettering measures inside it; a browser's rounded font is fitted to it, never wider).
 *
 * Heights: the boards 2560..2780 on a 10 mm bead (2550); a 30 mm cap above them (top 2810) stays 10 mm under the ceiling
 * beams' bottom (SAKURA_SHELL.ceiling 2980 - 160 = 2820), which the old band (2560..2860) ran into on the back wall at
 * every beam. Sakura's stripe hangs under the bead, 2482..2548 (sakura-surfaces.js, from SAKURA_BAND.y0). Nothing else on
 * the walls may reach above 2470: the Eisa poster and the cigarette rack, which reached into the old stripe, are lowered.
 *
 * The words are what Sakura is and sells (storefront.js, products-data.js, sakura-layout.js): the name and its crest
 * over the cold cabinet, what is under each board along the side walls.
 */
export const SAKURA_BAND_DESIGN=Object.freeze({
 revision:'A',
 board:Object.freeze({y0:2560,y1:2780,thick:15,batten:45,face:60,stock:3000,joint:3}),
 cap:Object.freeze({y0:2780,y1:2810,project:18}),
 bead:Object.freeze({y0:2550,y1:2560,project:8}),
 // The stripe is painted on its own rail, a board on the same battens, so it is no longer a strip hung in the air
 stripe:Object.freeze({y0:2482,y1:2548,paint:4}),
 wallClear:2470,
 beamBottom:2820,
 colours:Object.freeze({board:'#d9b27a',grain:'#b98a52',cap:'#7c5230',ink:'#3a2414',red:'#b8332c',cream:'#fff6e6'}),
 runs:Object.freeze([
  // West wall, over the open chiller (rice balls, bento, bread). Seen facing west: left is the window end (z 3.2).
  Object.freeze({id:'west',wall:'x',at:-6.8,from:3.2,to:-2.42,yaw:Math.PI/2,
   items:Object.freeze([
    Object.freeze({kind:'text',text:'Rice balls · Bento · Fresh bread',u:2810,size:115,w:2000}),
    Object.freeze({kind:'leaf',u:1300}),Object.freeze({kind:'leaf',u:4320}),
   ])}),
  // The back wall, over the cold cabinet (x -2.2..2.99): the name and the crest, centred on the cabinet.
  Object.freeze({id:'back',wall:'z',at:-3.93,from:-4.02,to:4.56,yaw:0,
   items:Object.freeze([
    Object.freeze({kind:'text',text:'Groceries · Daily goods',u:1640,size:100,w:1350}),
    Object.freeze({kind:'crest',u:3680,size:190}),
    Object.freeze({kind:'title',text:'Sakura Shop',u:4420,size:160,w:1100}),
    Object.freeze({kind:'crest',u:5160,size:190}),
    Object.freeze({kind:'text',text:'Since 1963',u:7200,size:100,w:700}),
   ])}),
  // East wall, behind the till (the medicine shelf, the till cabinet). Seen facing east: left is the back (z -1.1).
  Object.freeze({id:'east',wall:'x',at:6.8,from:-1.1,to:3.52,yaw:-Math.PI/2,
   items:Object.freeze([
    Object.freeze({kind:'text',text:'Medicine · Batteries · Stationery',u:2310,size:105,w:1950}),
   ])}),
 ]),
});

/** A run's length in millimetres. */
export const runLength=r=>Math.round(Math.abs(r.to-r.from)*1000);
/** How far along the run an item reaches either side of its centre, in mm. */
export const itemHalf=it=>(it.w??it.size??150)/2;
/** Board lengths: the fewest boards no longer than stock, as even as they can be, every joint moved to the nearer edge
 * of any lettering it would cross (with 40 mm to spare), so no word or crest is split by a joint. */
export function boards(r,stock=SAKURA_BAND_DESIGN.board.stock){
 const L=runLength(r),spans=r.items.map(it=>[it.u-itemHalf(it)-40,it.u+itemHalf(it)+40]);
 for(let n=Math.ceil(L/stock);n<=Math.ceil(L/stock)+3;n++){
  const joints=[];
  for(let i=1;i<n;i++){
   let j=Math.round(L*i/n);
   for(const [a,b] of spans)if(j>a&&j<b)j=Math.round(j-a<b-j?a:b);
   joints.push(j);
  }
  const edges=[0,...joints,L],out=edges.slice(1).map((e,i)=>[edges[i],e]);
  if(out.every(([a,b])=>b-a<=stock&&b-a>=400))return out;
 }
 throw new Error(`sakura-band: no board layout clears the lettering on ${r.id}`);
}
/** A point `u` mm along a run, in room coordinates, on the boards' face. */
export function alongRun(r,u){
 const t=r.from+(Math.sign(r.to-r.from))*u/1000;
 return r.wall==='x'?{x:r.at,z:t}:{x:t,z:r.at};
}
