/**
 * Manga effects for the town feed's comics, in English: marks over a head (!, ?!, ?, …),
 * sweat drops, anger veins, gloom lines, sparkles, hearts, sleep Zs, panel backgrounds (speed
 * lines aimed at the action, a gloomy screentone, a sparkle field) and sound effects lettered
 * across the panel. The storyteller chooses them (choosePanelFx) so a day's comic always looks
 * the same; comic.js draws them.
 */

/** What each expression may show over its head; the first that fits is most likely. */
export const FACE_FX=Object.freeze({
 surprised:['!','?!','shock'],angry:['vein','!'],grumpy:['vein','…'],worried:['sweat','gloom'],
 sad:['gloom','…'],shy:['sweat','blush'],sleep:['zzz'],thinking:['?','…'],happy:['sparkle','note'],
 laugh:['sparkle'],smile:['note'],content:[],neutral:['…'],
});
/** Poses with a sound of their own. */
export const POSE_SFX=Object.freeze({Tada:'TA-DA!',Clap:'CLAP CLAP',Cheer:'YAY!',Laugh:'HA HA HA',Point:'THERE!',Bow:'*BOW*',Crouch:'RUSTLE',Kachashi:'SWISH SWISH',HeelKick:'HOP!',Heart:'BA-DUMP',CheekRest:'TEHE',DoubleCheek:'KYAA!'});
/** Expressions with a sound of their own. */
export const FACE_SFX=Object.freeze({surprised:'GASP!',angry:'GRRR',sleep:'SNORE',worried:'GULP',shy:'BLUSH',grumpy:'HMPH',laugh:'PFFT'});
export const BACKGROUNDS=Object.freeze(['focus','gloom','sparkles']);

/**
 * Chooses a panel's effects from its actors (expressions and poses), the beat's own wishes
 * (beat.sfx, beat.bg) and where it falls in the strip. One face mark per actor at most, one
 * background and one sound effect per panel, so a strip stays readable.
 */
export function choosePanelFx(rng,actors,index,beat={}){
 const fx=actors.map(a=>{if(a.pose==='Heart')return 'heart';if(a.pose==='CheekRest'||a.pose==='DoubleCheek')return rng.chance(.6)?'sparkle':'heart';const options=FACE_FX[a.expression]||[];return options.length&&rng.chance(.8)?options[rng.int(Math.min(2,options.length))]:null;});
 const has=e=>actors.some(a=>a.expression===e);
 let bg=beat.bg||null;
 if(!bg&&(has('surprised')||has('angry'))&&rng.chance(index===2?.7:.35))bg='focus';
 if(!bg&&(has('sad')||has('worried'))&&rng.chance(.5))bg='gloom';
 if(!bg&&index===3&&(has('laugh')||has('happy'))&&rng.chance(.4))bg='sparkles';
 let sfx=beat.sfx||null;
 if(!sfx&&rng.chance(.3)){const options=actors.flatMap(a=>[POSE_SFX[a.pose],FACE_SFX[a.expression]]).filter(Boolean);if(options.length)sfx=rng.pick(options);}
 return {fx,bg,sfx};
}

const INK='#111';

/** A panel background drawn over the backdrop, behind the residents. */
export function drawBackground(ctx,kind,w,h,focus=[w/2,h*.45],seed=1){
 let s=seed;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
 if(kind==='focus'){
  // Speed lines: wedges from the panel edge towards the action, leaving a clear centre.
  ctx.save();ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(0,0,w,h);ctx.fillStyle=INK;
  const [cx,cy]=focus,R=Math.hypot(w,h);
  for(let a=0;a<Math.PI*2;a+=.045+r()*.05){
   const inner=Math.min(w,h)*(.3+r()*.16),spread=.006+r()*.01;
   ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);
   ctx.lineTo(cx+Math.cos(a-spread)*R,cy+Math.sin(a-spread)*R);ctx.lineTo(cx+Math.cos(a+spread)*R,cy+Math.sin(a+spread)*R);ctx.fill();
  }
  ctx.restore();
 }else if(kind==='gloom'){
  // A dark screentone falling from the top, with long vertical strokes.
  ctx.save();const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(30,34,52,.78)');g.addColorStop(.7,'rgba(30,34,52,.35)');g.addColorStop(1,'rgba(30,34,52,.1)');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(10,12,20,.55)';ctx.lineWidth=2;
  for(let x=6;x<w;x+=9+r()*7){const len=h*(.25+r()*.5);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,len);ctx.stroke();}
  ctx.restore();
 }else if(kind==='sparkles'){
  ctx.save();ctx.fillStyle='rgba(255,236,246,.6)';ctx.fillRect(0,0,w,h);
  for(let i=0;i<26;i++)star(ctx,r()*w,r()*h,6+r()*16,'#fff','rgba(240,150,190,.9)');
  ctx.restore();
 }
}

function star(ctx,x,y,size,fill,stroke){
 ctx.beginPath();
 for(let i=0;i<8;i++){const a=i*Math.PI/4,len=i%2?size*.28:size;ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);}
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=stroke;ctx.stroke();
}
function lettered(ctx,text,x,y,size,{fill="#fff",stroke=INK,angle=0,weight=800}={}){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.font=`${weight} ${size}px Figtree,"LINE Seed JP","Arial Black","Noto Sans JP",system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.lineJoin='round';ctx.lineWidth=size*.18;ctx.strokeStyle=stroke;ctx.strokeText(text,0,0);ctx.fillStyle=fill;ctx.fillText(text,0,0);ctx.restore();
}

/** A mark at a head: x,y is the top of the head, s the head's size on screen. */
export function drawFaceFx(ctx,kind,x,y,s,seed=1){
 if(!kind)return;
 const side=x+s*.62,top=y-s*.05;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 if(kind==='!'||kind==='?!'||kind==='?'){
  lettered(ctx,kind,side,top-s*.05,s*.62,{fill:kind==='?'?'#fff':'#ffde3b',angle:.18});
  if(kind!=='?')for(const a of [-.9,-.45,0]){ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(side+Math.cos(a-1.2)*s*.42,top+Math.sin(a-1.2)*s*.42);ctx.lineTo(side+Math.cos(a-1.2)*s*.6,top+Math.sin(a-1.2)*s*.6);ctx.stroke();}
 }else if(kind==='…'){
  for(let i=0;i<3;i++){ctx.fillStyle=INK;ctx.beginPath();ctx.arc(side-s*.2+i*s*.2,top+s*.05,s*.055,0,Math.PI*2);ctx.fill();}
 }else if(kind==='shock'){
  // Shock lines: short strokes bursting from around the head.
  ctx.strokeStyle=INK;ctx.lineWidth=5;
  for(const a of [-2.6,-2.1,-1.57,-1.05,-.5]){const cx=x,cy=y+s*.45;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*s*.72,cy+Math.sin(a)*s*.72);ctx.lineTo(cx+Math.cos(a)*s*.98,cy+Math.sin(a)*s*.98);ctx.stroke();}
 }else if(kind==='sweat'){
  // on the upper side of the skull, over its outline, clear of the face (never over an eye)
  const dx=x-s*.06,dy=y+s*.02,k=1.25;ctx.fillStyle='#bfe6ff';ctx.strokeStyle=INK;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(dx,dy-s*.2*k);ctx.bezierCurveTo(dx+s*.14*k,dy,dx+s*.12*k,dy+s*.14*k,dx,dy+s*.14*k);ctx.bezierCurveTo(dx-s*.12*k,dy+s*.14*k,dx-s*.14*k,dy,dx,dy-s*.2*k);ctx.fill();ctx.stroke();
  // a highlight on the drop, and small beads of sweat running down the skull (above the brows, never on an eye)
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.ellipse(dx-s*.045*k,dy+s*.02*k,s*.022*k,s*.05*k,-.25,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d8f1ff';ctx.lineWidth=2;
  for(const [bx,by,bs] of [[x+s*.1,y+s*.03,.05],[x+s*.25,y+s*.08,.04],[x+s*.02,y+s*.14,.035]]){
   ctx.beginPath();ctx.moveTo(bx,by-s*bs*1.4);ctx.bezierCurveTo(bx+s*bs*.9,by,bx+s*bs*.8,by+s*bs*.9,bx,by+s*bs*.9);ctx.bezierCurveTo(bx-s*bs*.8,by+s*bs*.9,bx-s*bs*.9,by,bx,by-s*bs*1.4);ctx.fill();ctx.stroke();}
 }else if(kind==='vein'){
  // The cross-shaped anger mark.
  const vx=side-s*.05,vy=top+s*.12,k=s*.13;ctx.strokeStyle='#d6232f';ctx.lineWidth=Math.max(4,s*.06);
  for(const [ax,ay] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ctx.beginPath();ctx.arc(vx+ax*k,vy+ay*k,k*.75,Math.atan2(-ay,-ax)-.9,Math.atan2(-ay,-ax)+.9);ctx.stroke();}
 }else if(kind==='gloom'){
  ctx.strokeStyle='rgba(40,50,110,.85)';ctx.lineWidth=3;
  for(let i=0;i<7;i++){const lx=x-s*.35+i*s*.12;ctx.beginPath();ctx.moveTo(lx,y+s*.05);ctx.lineTo(lx,y+s*(.32+(i%3)*.08));ctx.stroke();}
 }else if(kind==='blush'){
  ctx.strokeStyle='#e0506a';ctx.lineWidth=3;for(const off of [-.3,.3])for(let i=0;i<3;i++){const bx=x+off*s+i*s*.06-s*.06,by=y+s*.62;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-s*.04,by+s*.08);ctx.stroke();}
 }else if(kind==='sparkle'){
  star(ctx,side,top+s*.1,s*.2,'#fff7b0',INK);star(ctx,side+s*.25,top+s*.35,s*.12,'#fff7b0',INK);
 }else if(kind==='note'){
  ctx.fillStyle=INK;ctx.strokeStyle=INK;ctx.lineWidth=4;const nx=side,ny=top+s*.2;
  ctx.beginPath();ctx.ellipse(nx,ny,s*.08,s*.06,-.4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(nx+s*.07,ny);ctx.lineTo(nx+s*.07,ny-s*.3);ctx.lineTo(nx+s*.2,ny-s*.22);ctx.stroke();
 }else if(kind==='heart'){
  ctx.fillStyle='#ff6f91';ctx.strokeStyle=INK;ctx.lineWidth=3;const hx=side,hy=top+s*.1,k=s*.16;
  ctx.beginPath();ctx.moveTo(hx,hy+k);ctx.bezierCurveTo(hx-k*1.6,hy-k*.2,hx-k*.6,hy-k*1.3,hx,hy-k*.4);ctx.bezierCurveTo(hx+k*.6,hy-k*1.3,hx+k*1.6,hy-k*.2,hx,hy+k);ctx.fill();ctx.stroke();
 }else if(kind==='zzz'){
  [0,1,2].forEach(i=>lettered(ctx,'Z',side+i*s*.16,top+s*.2-i*s*.2,s*(.22+i*.08),{fill:'#fff',angle:-.2}));
 }
 ctx.restore();
}

/** A sound effect lettered big across the panel. */
export function drawSfx(ctx,text,w,h,seed=1,{avoid=null}={}){
 if(!text)return;
 // Sized to the panel and set in the open space beside the people, never over a face.
 ctx.save();ctx.font=`800 10px Figtree,"LINE Seed JP","Arial Black",sans-serif`;const per=ctx.measureText(text).width/10;ctx.restore();
 const size=Math.min(46,w*.075,(w*.38)/Math.max(1,per));
 let left=seed%2===0;
 if(avoid){const [a,b]=avoid;left=a>w-b;}
 const x=left?w*.06+per*size/2:w*.94-per*size/2;
 lettered(ctx,text,x,h*.86,size,{fill:'#fff',angle:left?-.12:.1});
}
