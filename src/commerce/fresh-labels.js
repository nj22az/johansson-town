/**
 * The printed faces of Sakura's fresh food and the morning paper: the few packs that have
 * no painted label in graphics/konbini. Drawn at any size, 2:1, so the shelf atlas
 * (store-advertising.js, 256×128) and the close-up (item-viewer.js, 1024×512) show the
 * same thing, only sharper in the hand.
 *
 * Each one is drawn the way the real thing reads in a 1997 konbini fridge: the bento is
 * its clear lid over the meal with the paper band at one end, the sandwich its cut face
 * through the window, the pudding its foil lid, the paper its front page.
 */
const GOTHIC='"Hiragino Kaku Gothic ProN","Noto Sans CJK JP","Yu Gothic",sans-serif';
const MINCHO='"Hiragino Mincho ProN","Noto Serif CJK JP","Yu Mincho",serif';
export const FRESH_LABELS=Object.freeze(['bento','sandwich','pudding','newspaper']);

const rnd=seed=>()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
function blob(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke();}}
function rounded(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function sheen(c,w,h){const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(255,255,255,.28)');g.addColorStop(.35,'rgba(255,255,255,0)');g.addColorStop(.62,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);}

function bento(c,w,h){
 const r=rnd(7),s=h/512;
 c.fillStyle='#1c1a18';c.fillRect(0,0,w,h);
 const ix=w*.035,iy=h*.07,iw=w*.74,ih=h*.86;
 c.fillStyle='#2a2522';rounded(c,ix,iy,iw,ih,18*s);c.fill();
 // Rice with an umeboshi and black sesame, the left third.
 const rw=iw*.38;c.fillStyle='#f4f0e4';rounded(c,ix+8*s,iy+8*s,rw,ih-16*s,12*s);c.fill();
 for(let i=0;i<900;i++){c.fillStyle=r()>.5?'#fffdf6':'#e4dcc8';const x=ix+12*s+r()*(rw-8*s),y=iy+12*s+r()*(ih-24*s);c.beginPath();c.ellipse(x,y,3.2*s,1.8*s,r()*3,0,7);c.fill();}
 for(let i=0;i<40;i++){c.fillStyle='#1a1410';c.beginPath();c.ellipse(ix+20*s+r()*(rw-30*s),iy+20*s+r()*(ih-40*s),2*s,1.1*s,r()*3,0,7);c.fill();}
 blob(c,ix+rw/2+8*s,iy+ih/2,24*s,22*s,'#b3203a');blob(c,ix+rw/2+2*s,iy+ih/2-7*s,7*s,5*s,'rgba(255,255,255,.35)');
 // The okazu: salmon, tamagoyaki, karaage, nimono, a green baran between, pickles.
 const ox=ix+rw+16*s,ow=iw-rw-24*s;
 c.fillStyle='#e9855b';rounded(c,ox,iy+10*s,ow*.55,ih*.34,10*s);c.fill();
 c.strokeStyle='#f7c4a4';c.lineWidth=3*s;for(let i=1;i<6;i++){c.beginPath();c.moveTo(ox+i*ow*.09,iy+14*s);c.quadraticCurveTo(ox+i*ow*.09+14*s,iy+ih*.2,ox+i*ow*.09,iy+ih*.34);c.stroke();}
 c.fillStyle='#d8d4c2';c.fillRect(ox,iy+ih*.30,ow*.55,8*s);
 for(let i=0;i<3;i++){const x=ox+ow*.6+i*ow*.13;c.fillStyle='#f6cf4a';rounded(c,x,iy+12*s,ow*.12,ih*.3,6*s);c.fill();c.strokeStyle='#d9a72c';c.lineWidth=2*s;for(let k=1;k<4;k++){c.beginPath();c.moveTo(x+4*s,iy+12*s+k*ih*.075);c.lineTo(x+ow*.12-4*s,iy+12*s+k*ih*.075);c.stroke();}}
 c.fillStyle='#3f8f3a';c.beginPath();c.moveTo(ox,iy+ih*.42);for(let i=0;i<=12;i++)c.lineTo(ox+i*ow/12,iy+ih*(.42+(i%2?.04:0)));c.lineTo(ox+ow,iy+ih*.47);c.lineTo(ox,iy+ih*.47);c.fill();
 for(let i=0;i<5;i++)blob(c,ox+ow*.12+i*ow*.11+(i%2)*6*s,iy+ih*.6+(i%2)*14*s,ow*.07,ih*.07,i%2?'#a8611f':'#bd7426','#7a3f10');
 blob(c,ox+ow*.7,iy+ih*.62,ow*.08,ih*.06,'#c96d2e');blob(c,ox+ow*.85,iy+ih*.6,ow*.06,ih*.05,'#e3b25a');blob(c,ox+ow*.78,iy+ih*.72,ow*.06,ih*.05,'#3a6a2c');
 c.fillStyle='#e9d64a';c.fillRect(ox,iy+ih*.82,ow*.45,ih*.1);c.fillStyle='#9a3c6a';c.fillRect(ox+ow*.5,iy+ih*.82,ow*.45,ih*.1);
 // The clear lid over it, and the paper band at the end.
 c.fillStyle='rgba(255,255,255,.07)';c.fillRect(ix,iy,iw,ih);sheen(c,iw+ix,h);
 const bx=w*.795,bw=w*.19;c.fillStyle='#f2e8d2';c.fillRect(bx,0,bw,h);c.fillStyle='#b5322a';c.fillRect(bx,0,bw,h*.13);c.fillRect(bx,h*.87,bw,h*.13);
 c.fillStyle='#fff3dc';c.font=`bold ${38*s}px ${GOTHIC}`;c.textAlign='center';c.textBaseline='middle';c.fillText('ミナトヤ',bx+bw/2,h*.065,bw*.9);
 c.fillStyle='#2c1e16';c.font=`bold ${54*s}px ${MINCHO}`;['幕','の','内'].forEach((ch,i)=>c.fillText(ch,bx+bw/2,h*(.24+i*.13),bw));
 c.font=`bold ${30*s}px ${GOTHIC}`;c.fillText('弁当',bx+bw/2,h*.64,bw);
 c.fillStyle='#b5322a';c.font=`bold ${40*s}px ${GOTHIC}`;c.fillText('¥480',bx+bw/2,h*.77,bw*.9);
 c.fillStyle='#fff3dc';c.font=`bold ${22*s}px ${GOTHIC}`;c.fillText('本日製造',bx+bw/2,h*.935,bw*.9);
}
function sandwich(c,w,h){
 const s=h/512;
 c.fillStyle='#f6f1e6';c.fillRect(0,0,w,h);
 c.fillStyle='#c8322a';c.fillRect(0,0,w,h*.17);c.fillStyle='#fff6e4';c.font=`bold ${54*s}px ${GOTHIC}`;c.textAlign='left';c.textBaseline='middle';c.fillText('たまごサンド',w*.04,h*.085,w*.6);
 c.textAlign='right';c.font=`bold ${34*s}px ${GOTHIC}`;c.fillText('KOMUGI',w*.96,h*.085,w*.34);
 // The window: three triangles of cut egg sandwich, the filling thick in the middle.
 const fill=[['#f7e3a0','#f1c94a'],['#f6dc8e','#7fb34a'],['#f7e3a0','#f1c94a']];
 fill.forEach(([a,b],i)=>{const x0=w*(.05+i*.215),bw=w*.2,y0=h*.24,y1=h*.92;
  c.fillStyle='#fbf3df';c.beginPath();c.moveTo(x0,y1);c.lineTo(x0+bw,y1);c.lineTo(x0+bw/2,y0);c.closePath();c.fill();
  c.fillStyle='#d9b06a';c.lineWidth=5*s;c.strokeStyle='#c99a52';c.stroke();
  const band=(t,col,th)=>{c.save();c.beginPath();c.moveTo(x0,y1);c.lineTo(x0+bw,y1);c.lineTo(x0+bw/2,y0);c.closePath();c.clip();c.fillStyle=col;c.fillRect(x0,y0+(y1-y0)*t,bw,th*s);c.restore();};
  band(.45,a,58);band(.62,b,26);band(.72,a,40);
 });
 c.fillStyle='rgba(255,255,255,.1)';c.fillRect(w*.03,h*.21,w*.66,h*.74);sheen(c,w*.7,h);
 c.fillStyle='#2c2420';c.textAlign='center';c.font=`bold ${40*s}px ${MINCHO}`;c.fillText('ふんわり玉子',w*.84,h*.34,w*.28);
 c.font=`${26*s}px ${GOTHIC}`;c.fillText('朝焼きパン使用',w*.84,h*.48,w*.28);
 c.fillStyle='#c8322a';rounded(c,w*.73,h*.58,w*.22,h*.22,14*s);c.fill();c.fillStyle='#fff';c.font=`bold ${56*s}px ${GOTHIC}`;c.fillText('¥230',w*.84,h*.69,w*.2);
 c.fillStyle='#2c2420';c.font=`${22*s}px ${GOTHIC}`;c.fillText('要冷蔵 10℃以下',w*.84,h*.88,w*.28);
}
function pudding(c,w,h){
 const s=h/512,g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#d9d2c0');g.addColorStop(.5,'#f4efe2');g.addColorStop(1,'#cfc6b0');c.fillStyle=g;c.fillRect(0,0,w,h);
 for(let i=0;i<w;i+=6*s){c.fillStyle=i%(12*s)<6*s?'rgba(255,255,255,.18)':'rgba(0,0,0,.03)';c.fillRect(i,0,3*s,h);}
 // The pudding on its plate, caramel running down.
 const cx=w*.3,cy=h*.6;blob(c,cx,cy+h*.22,w*.2,h*.07,'#f6f6f2','#cfcfc8');
 c.fillStyle='#f5d77a';c.beginPath();c.moveTo(cx-w*.13,cy+h*.2);c.lineTo(cx+w*.13,cy+h*.2);c.lineTo(cx+w*.1,cy-h*.18);c.lineTo(cx-w*.1,cy-h*.18);c.closePath();c.fill();
 c.fillStyle='#7a3410';c.beginPath();c.moveTo(cx-w*.1,cy-h*.18);c.lineTo(cx+w*.1,cy-h*.18);c.lineTo(cx+w*.104,cy-h*.1);c.quadraticCurveTo(cx+w*.06,cy-h*.02,cx+w*.04,cy-h*.1);c.quadraticCurveTo(cx,cy+h*.02,cx-w*.03,cy-h*.1);c.quadraticCurveTo(cx-w*.07,cy-h*.04,cx-w*.104,cy-h*.1);c.closePath();c.fill();
 blob(c,cx+w*.02,cy-h*.25,w*.03,h*.035,'#ffffff');blob(c,cx+w*.02,cy-h*.3,w*.014,h*.02,'#c8102e');
 c.fillStyle='#5a2a10';c.textAlign='left';c.textBaseline='middle';c.font=`bold ${84*s}px ${MINCHO}`;c.fillText('なめらか',w*.52,h*.3,w*.45);
 c.fillStyle='#c8322a';c.font=`bold ${108*s}px ${GOTHIC}`;c.fillText('プリン',w*.52,h*.55,w*.45);
 c.fillStyle='#5a2a10';c.font=`${28*s}px ${GOTHIC}`;c.fillText('ASAMORI 牧場たまご使用',w*.52,h*.75,w*.45);
 c.fillStyle='#c8322a';rounded(c,w*.52,h*.82,w*.2,h*.12,10*s);c.fill();c.fillStyle='#fff';c.font=`bold ${40*s}px ${GOTHIC}`;c.fillText('¥130',w*.545,h*.88,w*.16);
 sheen(c,w,h);
}
function newspaper(c,w,h){
 const s=h/512,r=rnd(11);
 c.fillStyle='#ece6d6';c.fillRect(0,0,w,h);
 c.fillStyle='#1d1b18';c.textAlign='left';c.textBaseline='middle';c.font=`bold ${78*s}px ${MINCHO}`;c.fillText('琉球海風新報',w*.03,h*.1,w*.6);
 c.fillStyle='#b5322a';c.fillRect(w*.66,h*.03,w*.31,h*.13);c.fillStyle='#fff';c.font=`bold ${28*s}px ${GOTHIC}`;c.fillText('1997年10月4日 土曜日',w*.675,h*.095,w*.29);
 c.fillStyle='#1d1b18';c.fillRect(w*.03,h*.19,w*.94,4*s);
 c.font=`bold ${64*s}px ${GOTHIC}`;c.fillText('台風20号 南へそれる',w*.03,h*.29,w*.6);
 c.font=`bold ${36*s}px ${MINCHO}`;c.fillText('港の連絡船、通常どおり運航',w*.03,h*.4,w*.6);
 // The photograph: the harbour under a grey sky.
 const px=w*.66,py=h*.24,pw=w*.31,ph=h*.36,g=c.createLinearGradient(0,py,0,py+ph);g.addColorStop(0,'#8a8a86');g.addColorStop(.55,'#b8b6ae');g.addColorStop(.56,'#5e6466');g.addColorStop(1,'#43494a');c.fillStyle=g;c.fillRect(px,py,pw,ph);
 c.fillStyle='#2a2a28';c.fillRect(px+pw*.1,py+ph*.42,pw*.35,ph*.12);c.fillRect(px+pw*.2,py+ph*.32,pw*.08,ph*.12);c.fillRect(px+pw*.6,py+ph*.47,pw*.3,ph*.06);
 for(let i=0;i<500;i++){c.fillStyle=`rgba(0,0,0,${r()*.12})`;c.fillRect(px+r()*pw,py+r()*ph,2*s,2*s);}
 // Columns of text: vertical rules of small type, as a 1997 front page reads from far off.
 c.fillStyle='#4a463e';for(let col=0;col<22;col++){const x=w*.04+col*w*.028;if(x>w*.62)break;for(let y=h*.47;y<h*.95;y+=13*s){if(r()>.08)c.fillRect(x,y,w*.016,8*s);}}
 for(let col=0;col<10;col++){const x=px+col*pw*.1;for(let y=h*.64;y<h*.95;y+=13*s){if(r()>.1)c.fillRect(x+2*s,y,pw*.06,8*s);}}
 c.fillStyle='#1d1b18';c.fillRect(w*.03,h*.96,w*.94,3*s);
}
const PAINTERS={bento,sandwich,pudding,newspaper};
/** Draws a fresh-food or newspaper face into `ctx` at (0,0), `w`×`h` (2:1). */
export function drawFreshLabel(ctx,id,w,h){const paint=PAINTERS[id];if(!paint)return false;ctx.save();paint(ctx,w,h);ctx.restore();return true;}
