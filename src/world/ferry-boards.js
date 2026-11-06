/**
 * The Minato Maru's painted boards, drawn on a 2D canvas: her name board on the bridge front and the lane-signal boards
 * on the bow houses. ferry-model.js paints them onto her; tools/ferry-exterior-cad.mjs redraws and measures them with this
 * same code. No DOM here: each painter takes a canvas context.
 *
 * 3 November 2026 (docs/minato-maru/exterior, problems 2 and 3): the two names were centred on fixed points and ran into
 * each other ("みなと丸MINATO MARU"), and the truck sign sat across a lane divider, reading as a stray "L" from the quay.
 */

/** The name board: みなと丸 and MINATO MARU side by side in her teal on white, laid out from their measured widths. */
export const NAME_BOARD=Object.freeze({
 jp:'みなと丸',en:'MINATO MARU',
 jpFont:'"Hiragino Sans","Noto Sans JP",sans-serif',enFont:'sans-serif',jpSize:54,enSize:36,
 /** The space between the names, and the clear margin inside the board's teal border, in canvas pixels. */
 gap:30,margin:34,
 teal:'#24585c',white:'#f4f1e8',
});

/**
 * Where the two names go on a board `w` pixels wide starting at `x`, given `measure(text, fontSize, family)` (their
 * widths at that size). The pair is centred; when it would not fit inside the margins both names shrink together.
 */
export function nameBoardLayout(x,w,measure){
 const B=NAME_BOARD,jp=measure(B.jp,B.jpSize,B.jpFont),en=measure(B.en,B.enSize,B.enFont);
 const room=w-2*B.margin,need=jp+B.gap+en,k=Math.min(1,room/need),start=x+w/2-need*k/2;
 return {scale:k,jp:Object.freeze({x:start,width:jp*k,size:B.jpSize*k}),en:Object.freeze({x:start+(jp+B.gap)*k,width:en*k,size:B.enSize*k}),gap:B.gap*k};
}

/** Paints the name board into the cell [bx, by, bw, bh] of a canvas context. */
export function paintNameBoard(x,[bx,by,bw,bh]){
 const B=NAME_BOARD;
 x.fillStyle=B.white;x.fillRect(bx+6,by+10,bw-12,bh-20);x.strokeStyle=B.teal;x.lineWidth=8;x.strokeRect(bx+12,by+16,bw-24,bh-32);
 const measure=(s,size,family)=>{x.font=`bold ${size}px ${family}`;const m=x.measureText?.(s);return m&&Number.isFinite(m.width)?m.width:[...s].length*size*.62;};
 const L=nameBoardLayout(bx,bw,measure);
 x.fillStyle=B.teal;x.textAlign='left';x.textBaseline='middle';
 x.font=`bold ${L.jp.size}px ${B.jpFont}`;x.fillText(B.jp,L.jp.x,by+bh*.5);
 x.font=`bold ${L.en.size}px ${B.enFont}`;x.fillText(B.en,L.en.x,by+bh*.5);
 return L;
}

/**
 * The lane-signal board, 512 × 368 pixels a face: three lanes (lane 2, the truck's centre lane, lane 1 as seen from aft;
 * reversed on the face to the quay), an arrow ahead in each, the dividers midway between the lanes, the lane numbers in
 * the outer lanes and a truck under the centre lane's shortened arrow, clear of both dividers.
 */
export function laneBoardLayout(){
 const lanes=[90,256,422];
 const dividers=[(lanes[0]+lanes[1])/2,(lanes[1]+lanes[2])/2].map(c=>Object.freeze([c-3,c+3]));
 const t=lanes[1];
 const truck=Object.freeze({
  box:Object.freeze([t-58,214,74,52]),cab:Object.freeze([t+20,230,38,36]),window:Object.freeze([t+36,236,16,13]),chassis:Object.freeze([t-58,266,116,8]),
  wheels:Object.freeze([[t-40,281],[t-14,281],[t+38,281]].map(Object.freeze)),wheel:13,hub:5,
 });
 const xs=[truck.box[0],truck.cab[0]+truck.cab[2],truck.chassis[0]+truck.chassis[2],...truck.wheels.flatMap(([cx])=>[cx-truck.wheel,cx+truck.wheel])];
 return Object.freeze({width:512,height:368,lanes:Object.freeze(lanes),dividers:Object.freeze(dividers),truck,
  truckSpan:Object.freeze([Math.min(...xs),Math.max(...xs)]),truckArrowFoot:200,arrowFoot:280});
}

/** Paints both faces of the lane boards, one over the other (the face to the deck on top, the face to the quay below). */
export function paintLaneBoards(x){
 const G=laneBoardLayout(),blue='#1f4f9e',white='#f4f1e8';
 for(const reversed of [false,true]){x.save();x.translate(0,reversed?G.height:0);
  x.fillStyle=blue;x.fillRect(0,0,G.width,G.height);x.strokeStyle=white;x.lineWidth=8;x.strokeRect(10,10,G.width-20,G.height-20);
  x.fillStyle=white;for(const [a,b] of G.dividers)x.fillRect(a,24,b-a,320);
  const lanes=reversed?['1','truck','2']:['2','truck','1'];
  lanes.forEach((l,i)=>{const cx=G.lanes[i],foot=l==='truck'?G.truckArrowFoot:G.arrowFoot;
   x.fillStyle=white;x.fillRect(cx-10,80,20,foot-80);x.beginPath();x.moveTo(cx-38,92);x.lineTo(cx,30);x.lineTo(cx+38,92);x.fill();
   if(l==='truck'){const T=G.truck;x.fillRect(...T.box);x.fillRect(...T.cab);x.fillRect(...T.chassis);
    x.fillStyle=blue;x.fillRect(...T.window);
    for(const [wx,wy] of T.wheels){x.fillStyle=white;x.beginPath();x.arc(wx,wy,T.wheel,0,Math.PI*2);x.fill();x.fillStyle=blue;x.beginPath();x.arc(wx,wy,T.hub,0,Math.PI*2);x.fill();}}
   else{x.font='bold 96px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(l,cx+(i===0?-48:48),300);}});
  x.restore();}
 return G;
}
