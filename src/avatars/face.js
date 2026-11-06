/**
 * Faces, painted. A face is flat shapes on the front of a round head -- which is what
 * makes a crowd of these read as one family -- so it is drawn on a canvas in a 256-unit
 * square and laid on the head as a texture (build.js). Every part is a small vector
 * drawing of our own; the recipe says which, where, how big and what colour, and the
 * state says what the face is doing right now: an expression, a blink, a word.
 *
 * Expressions: neutral, happy, laugh, smile, sad, angry, shy, surprised, worried,
 * thinking, grumpy, content, sleep, dizzy (knocked silly: spiral eyes), scheme (an evil grin), embarrassed (caught out:
 * red to the ears, a wobbly mouth); and pain, bliss, shock, dismay, calm, daze, dry, hope, focus, relieved (MOOD).
 */
const TAU=Math.PI*2;
/** Mouth colours that are just a mouth; anything else is lipstick. */
export const NATURAL_LIPS=Object.freeze(['#b8544a','#a8433e','#9a4a40']);

function shade(hex,k){
 const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));
 return '#'+[f(n>>16),f(n>>8&255),f(n&255)].map(v=>v.toString(16).padStart(2,'0')).join('');
}

/** How wide the mouth is drawn: the narrow half of the slider as it always was, the wide half reaching
 *  further (up to a big cartoon mouth), so nobody already made changes and a wide grin is possible. */
export const mouthWidth=w=>w<=.5?.65+w*.7:1+(w-.5)*1.4;

/** Where the parts sit, in canvas units, from the recipe's sliders. */
export function faceLayout(recipe){
 const e=recipe.eyes,b=recipe.brows,n=recipe.nose,m=recipe.mouth,g=recipe.glasses||{},f=recipe.facial||{},spot=recipe.moleSpot||{};
 const eyeY=104+(e.height-.5)*-56,spread=38+(e.spacing-.5)*36,eyeS=1.16+e.size*.8;
 return {
  eyeY,spread,eyeS,eyeW:.85+(e.width??.5)*.7,eyeTilt:(e.tilt-.5)*.85,
  browY:70+(b.height-.5)*-48,browSpread:spread+((b.spacing??.5)-.5)*32,browS:.75+b.size*.6,browTilt:(b.tilt-.5)*.85,
  noseY:134+(n.height-.5)*-48,noseX:128+((n.x??.5)-.5)*48,noseS:.7+n.size*.7,
  mouthY:160+(m.height-.5)*-54,mouthX:128+((m.x??.5)-.5)*56,mouthS:1+m.size*.8,mouthW:mouthWidth(m.width??.5),
  glassS:.7+(g.size??.5)*.6,glassY:eyeY+((g.height??.5)-.5)*-40,
  facialS:.7+(f.size??.5)*.6,facialDY:((f.height??.5)-.5)*-24,
  moleX:64+(spot.x??.77)*128,moleY:200-(spot.height??.33)*140,moleR:1.2+(spot.size??.5)*2.4,
 };
}

const MOOD=Object.freeze({
 neutral:{eyes:'open',brow:0,browLift:0,mouth:null,blush:0},
 smile:{eyes:'smiling',brow:0,browLift:3,mouth:'smile',blush:.15},
 content:{eyes:'content',brow:0,browLift:1,mouth:'smile',blush:.1},
 happy:{eyes:'happy',brow:0,browLift:10,mouth:'grin',blush:.4},
 excited:{eyes:'wide',brow:0,browLift:13,mouth:'grin',blush:.45},
 laugh:{eyes:'happy',brow:0,browLift:14,mouth:'laugh',blush:.55},
 sad:{eyes:'sad',brow:-1,browLift:3,mouth:'frown',blush:0},
 worried:{eyes:'worry',brow:-1.35,browLift:10,mouth:'wobble',blush:0},
 angry:{eyes:'angry',brow:1.4,browLift:-5,mouth:'snarl',blush:.15},
 grumpy:{eyes:'angry',brow:.6,browLift:-2,mouth:'frown',blush:0},
 shy:{eyes:'shy',brow:-.4,browLift:3,mouth:'small',blush:1},
 surprised:{eyes:'wide',brow:0,browLift:20,mouth:'o',blush:0},
 thinking:{eyes:'side',brow:.3,browLift:0,mouth:'hmm',blush:0},
 sleep:{eyes:'closed',brow:0,browLift:-1,mouth:'small',blush:0},
 dizzy:{eyes:'spiral',brow:-1,browLift:8,mouth:'wobble',blush:0},
 // the evil grin is wide and tall: it sits lower, so a long nose (Tetsuo's hook) never touches it
 scheme:{eyes:'angry',brow:1.7,browLift:-7,mouth:'grin',blush:0,mouthDY:12},
 embarrassed:{eyes:'shy',brow:-.9,browLift:7,mouth:'wobble',blush:1},
 // The faces Fujita's Back asks for (content/onsen-breaker/shot-plan.json marks): a back that has just gone (pain: the eyes
 // squeezed shut, the teeth gritted), the chair's rollers (bliss), the lights coming back (shock: tiny pupils in wide eyes),
 // "…Not now." (dismay), Tetsuo by torchlight (calm), dazed under a basket (daze), Nhung unimpressed (dry), the coin going
 // in (hope), switching off in the dark (focus), and the bath at last (relieved).
 pain:{eyes:'pain',brow:-1.3,browLift:2,mouth:'teeth',blush:0},
 bliss:{eyes:'closed',brow:-.6,browLift:8,mouth:'wide',blush:.6},
 shock:{eyes:'shock',brow:0,browLift:24,mouth:'o',blush:0,mouthDY:4},
 dismay:{eyes:'worry',brow:-1.5,browLift:6,mouth:'flat',blush:0},
 calm:{eyes:'open',brow:0,browLift:2,mouth:'soft',blush:0},
 daze:{eyes:'daze',brow:-.5,browLift:5,mouth:'wobble',blush:0},
 dry:{eyes:'dry',brow:.25,browLift:-3,mouth:'flat',blush:0},
 hope:{eyes:'open',brow:-.9,browLift:9,mouth:'small',blush:.2},
 focus:{eyes:'angry',brow:.5,browLift:-1,mouth:'flat',blush:0},
 relieved:{eyes:'content',brow:-.6,browLift:5,mouth:'soft',blush:.25},
 // The funny faces (the creator, 2026-10-11: "add more poses and funny expressions"), each one a gag a panel can be built
 // on, drawn in the town's own hand: symbol eyes, ink-line mouths and the cartoon marks (tears, sweat, the anger vein,
 // gloom lines) laid on the face (FX). EXPRESSION_INFO says what each is for.
 gobsmacked:{eyes:'shock',brow:0,browLift:26,mouth:'jawdrop',blush:0,mouthDY:-6},
 smug:{eyes:'smug',brow:.35,browLift:1,oneBrow:7,mouth:'smirk',blush:.2,look:[.75,.1]},
 bawling:{eyes:'bawl',brow:-1.4,browLift:9,mouth:'wail',blush:.3,fx:['waterfall']},
 starstruck:{eyes:'star',brow:0,browLift:14,mouth:'grin',blush:.6},
 sweatdrop:{eyes:'smiling',brow:-.8,browLift:6,mouth:'wobble',blush:0,fx:['sweat']},
 blank:{eyes:'blank',brow:0,browLift:8,mouth:'flat',blush:0,fx:['gloom']},
 pouting:{eyes:'open',brow:1.1,browLift:-1,mouth:'pucker',blush:.55,fx:['puff'],look:[-.5,0]},
 bleh:{eyes:'happy',brow:-.3,browLift:5,mouth:'bleh',blush:.3},
 drowsy:{eyes:'droop',brow:-.6,browLift:-2,mouth:'yawn',blush:0,look:[0,.6]},
 lovestruck:{eyes:'heart',brow:-.5,browLift:8,mouth:'smile',blush:.9},
 fuming:{eyes:'angry',brow:1.6,browLift:-6,mouth:'gritted',blush:0,fx:['flush','vein']},
 drooling:{eyes:'dreamy',brow:-.4,browLift:7,mouth:'drool',blush:.35,fx:['drool'],look:[.3,-.9]},
 wink:{eyes:'wink',brow:0,browLift:4,mouth:'grin',blush:.25},
 // Tempers (the creator, 2026-10-19: "pissed off and raging angry is funny, make some more of those; whatever fits Crayon
 // Shin-chan's world in expressions"): the all-out yell, the smile that is holding it in, the eyes gone to the ceiling.
 raging:{eyes:'angry',brow:1.9,browLift:-8,mouth:'wail',blush:.35,fx:['flush','vein'],mouthDY:4},
 seething:{eyes:'closed',brow:1.3,browLift:-4,mouth:'grin',blush:.25,fx:['vein','sweat']},
 eyeroll:{eyes:'open',brow:.45,browLift:3,mouth:'flat',blush:0,look:[.15,-.95]},
 // The moves and the pair poses (the creator, 2026-10-19: "And running and walking, and kissing and hugging and fighting"):
 // the panic run's fright (the brows up and worried over wide eyes with tiny pupils, the mouth open in a yell, a bead of
 // sweat: no face of the town was afraid; shock stares and dismay goes flat) and the kiss (the eyes closed, the lips
 // puckered out, a deep blush: pouting puckers too, but with an angry brow and the cheeks puffed).
 scared:{eyes:'shock',brow:-1.5,browLift:14,mouth:'wail',blush:0,fx:['sweat'],mouthDY:4},
 kiss:{eyes:'closed',brow:-.3,browLift:5,mouth:'pucker',blush:.9},
 // ...and the one kissed: eyes wide, red to the ears, a bead of sweat (embarrassed hides its eyes; shock and surprised do
 // not blush)
 flustered:{eyes:'wide',brow:-.5,browLift:12,mouth:'wobble',blush:1,fx:['sweat']},
});
export const EXPRESSION_NAMES=Object.freeze(Object.keys(MOOD));
/** What each funny face is for, in a line: for the Studio's lists, the photo studio and whoever writes a panel. */
export const EXPRESSION_INFO=Object.freeze({
 gobsmacked:'Jaw on the floor: news too big to take in.',
 smug:'Told you so: half-lidded, one brow up, a sideways look and a smirk.',
 bawling:'Waterfall tears: heartbreak played for laughs.',
 starstruck:'Stars for eyes: meeting a hero, seeing the prize.',
 sweatdrop:'The big drop of sweat when a plan quietly goes wrong.',
 blank:'White-eyed and speechless, gloom lines falling: the soul has left.',
 pouting:'Puffed cheeks and a pucker: a sulk that wants to be noticed.',
 bleh:'Tongue out, eyes squeezed: teasing, a raspberry.',
 drowsy:'Lids at half mast and a yawn: the long afternoon, the slow lecture.',
 lovestruck:'Heart eyes and a deep blush: smitten, or the perfect bowl of ramen.',
 fuming:'Gritted teeth, a red face and the anger mark: the last straw.',
 drooling:'Dreamy eyes and a drip at the corner of the mouth: the smell from the kitchen.',
 wink:'One eye shut and a grin: a secret shared with the reader.',
 raging:'The all-out yell: brows down, mouth wide, red to the ears and the anger mark.',
 seething:'Holding it in: eyes squeezed into a smile, the anger mark and a bead of sweat.',
 eyeroll:'Give me a break: the eyes rolled to the ceiling over a flat mouth.',
 scared:'Fright: brows up, tiny pupils in wide eyes, the mouth open in a yell and a bead of sweat; the panic run.',
 kiss:'The peck: eyes closed, lips puckered out and a deep blush.',
 flustered:'Kissed: eyes wide, mouth wobbling, red to the ears and a bead of sweat.',
});
/** A small face for each expression (the photo studio's chips), so every list shows the same faces. */
export const EXPRESSION_GLYPHS=Object.freeze({neutral:'•ᴗ•',happy:'◠ᴗ◠',laugh:'≧▽≦',smile:'•◡•',sad:'•︵•',angry:'>︿<',shy:'˶ᴗ˶',surprised:'⊙o⊙',worried:'•﹏•',
 thinking:'•_•',grumpy:'¬_¬',content:'˘ᴗ˘',sleep:'－ᴗ－',excited:'☆ᴗ☆',dizzy:'@_@',scheme:'¬ᴗ¬',embarrassed:'>﹏<;',pain:'>_<',bliss:'˘▽˘',shock:'°□°',
 dismay:'•_•;',calm:'•‿•',daze:'◔_◔',dry:'－_－',hope:'•̀ᴗ•́',focus:'•̀_•́',relieved:'˘◡˘',gobsmacked:'⊙Д⊙',smug:'¬‿¬',bawling:'ToT',starstruck:'★ᴗ★',
 sweatdrop:'^^;',blank:'○_○',pouting:'(•3•)',bleh:'^ڡ^',drowsy:'＝o＝',lovestruck:'♥ᴗ♥',fuming:'>д<',drooling:'¯﹃¯',wink:'•ᴗ<',raging:'>口<',seething:'^_^#',eyeroll:'◑_◑',scared:'°Д°;',kiss:'˘3˘',flustered:'⊙﹏⊙;'});

/** A feeling's face as the painter draws it (eyes, brow angle and lift, mouth, blush): for heads that draw their own
 *  brows and mouth (pixar.js's modelled faces). */
export function moodOf(expression){return MOOD[expression]||MOOD.neutral;}

/** What the eyes are doing in a face state, as drawFace reads it: the mood's eyes and where they look. */
export function eyesOf(state={}){
 const mood=MOOD[state.expression]||MOOD.neutral;
 return {eyes:mood.eyes,look:state.gaze||mood.look||state.look||[0,0]};
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} recipe normalized
 * @param {{expression?:string,blink?:number,talk?:number,look?:[number,number],gaze?:[number,number],size?:number,skipEyes?:boolean}} state
 *   `gaze` points the eyes even when the expression has a look of its own (a smirk at the camera for a sticker, a resident
 *   meeting the player's eye); `look` only applies where the expression has none.
 */
export function drawFace(ctx,recipe,state={}){
 const size=state.size||256,k=size/256;
 const baseMood=MOOD[state.expression]||MOOD.neutral;
 const mood={...baseMood,browLift:baseMood.browLift+(state.actingBrow||0)*12};
 if(state.actingSmile>.35&&['neutral','calm','content'].includes(state.expression))mood.mouth='smile';
 const L=faceLayout(recipe),skin=recipe.body.skin,line='#2b2623';
 ctx.canvas.__skin=skin;
 ctx.save();ctx.setTransform(k,0,0,k,0,0);
 ctx.fillStyle=skin;ctx.fillRect(0,0,256,256);
 ctx.lineCap='round';ctx.lineJoin='round';
 // Age, freckles, a mole: drawn first so the parts sit over them.
 if(recipe.wrinkles>.05){
  ctx.strokeStyle=shade(skin,.8);ctx.lineWidth=1.6;ctx.globalAlpha=Math.min(1,recipe.wrinkles);
  for(const s of [-1,1]){const x=128+s*(L.spread+16*L.eyeS);for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(x,L.eyeY-4+i*7);ctx.lineTo(x+s*8,L.eyeY-6+i*9);ctx.stroke();}
   ctx.beginPath();ctx.arc(128+s*22,L.mouthY-6,14,s>0?-.2:Math.PI-.6,s>0?.6:Math.PI+.2);ctx.stroke();}
  for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(104,L.browY-14-i*7);ctx.quadraticCurveTo(128,L.browY-18-i*7,152,L.browY-14-i*7);ctx.stroke();}
  ctx.globalAlpha=1;
 }
 if(recipe.freckles){ctx.fillStyle=shade(skin,.72);for(const s of [-1,1])for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(128+s*(L.spread+(i%3)*5-2),L.noseY-2+Math.floor(i/3)*6,1.5,0,TAU);ctx.fill();}}
 if(recipe.mole){ctx.fillStyle='#4a3024';ctx.beginPath();ctx.arc(L.moleX,L.moleY,L.moleR,0,TAU);ctx.fill();}
 // Blush: the recipe's own, and more when shy or pleased.
 const blush=Math.min(1,recipe.blush*.8+mood.blush);
 if(blush>.02){for(const s of [-1,1]){const x=128+s*(L.spread+8),y=L.noseY+2;const g=ctx.createRadialGradient(x,y,1,x,y,17);g.addColorStop(0,`rgba(236,110,120,${.55*blush})`);g.addColorStop(1,'rgba(236,110,120,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,18,12,0,0,TAU);ctx.fill();}
  }
 // The blush you can see across a room (the creator, 2026-10-14: "characters need to be able to blush"): a pink oval on
 // each cheek with four hatched strokes across it, stencil-drawn, when they are shy, embarrassed, smitten or laughing hard,
 // and always for someone given the "Blushing" mark.
 const flush=Math.max(mood.blush>=.5?Math.min(1,(mood.blush-.3)/.6):0,recipe.marks?.blushing?.8:0);
 if(flush>0)for(const s of [-1,1]){
  const x=128+s*(L.spread+8),y=L.noseY+5;
  ctx.fillStyle=`rgba(244,120,150,${.72*flush})`;ctx.beginPath();ctx.ellipse(x,y,21,10.5,0,0,TAU);ctx.fill();
  ctx.strokeStyle=`rgba(214,60,100,${.9*flush})`;ctx.lineWidth=3;ctx.lineCap='round';
  for(let i=0;i<5;i++){const hx=x-14+i*7;ctx.beginPath();ctx.moveTo(hx-3.2,y+6);ctx.lineTo(hx+3.2,y-6);ctx.stroke();}
 }
 drawFaceMarks(ctx,L,recipe);
 // The cartoon marks that go under the parts: a face going red, gloom lines, puffed-out cheeks.
 const fx=mood.fx||[];drawMarks(ctx,L,skin,fx.filter(f=>UNDER_MARKS.has(f)));
 // Eyes. Symbol eyes (stars, hearts, a wink...) are a drawing, not a lid: a blink leaves them be. Rigged eyes
 // (eyes3d.js) draw their own: skipEyes leaves them out of the canvas.
 const blink=Math.max(0,Math.min(1,state.blink||0));
 const eyesState=blink>.5&&!['happy','spiral',...SYMBOL_EYES].includes(mood.eyes)?'closed':mood.eyes;
 // A face that looks somewhere of its own (a sideways smirk, a drowsy look down) looks there, unless told where to gaze.
 const look=state.gaze||mood.look||state.look||[0,0];
 if(!state.skipEyes)for(const s of [-1,1]){const captured=s<0?state.blinkLeft:state.blinkRight;const eye=Number.isFinite(captured)?(captured>.5?'closed':mood.eyes):eyesState;drawEye(ctx,128+s*L.spread,L.eyeY,L.eyeS,s,recipe.eyes,eye,look,L.eyeTilt,L.eyeW);}
 // Brows (oneBrow: the viewer's right one goes up on its own, the smug brow).
 if(recipe.brows.style!=='none')for(const s of [-1,1])drawBrow(ctx,128+s*L.browSpread,L.browY-mood.browLift-(s>0?(mood.oneBrow||0)+(recipe.marks?.cocked?7:0):0),L.browS,s,recipe.brows,L.browTilt,mood.brow);
 drawNose(ctx,L.noseX,L.noseY,L.noseS,recipe.nose.style,skin,line);
 // A painted beard sits under the lips, a painted moustache over the top one. In 3D the beard is on its own shell round the
 // jaw (drawBeardShell), which reaches the chin's outline and the sideburns as the face's canvas cannot.
 if(!state.objects)drawFacialPaint(ctx,L,recipe.facial,'beard');
 drawMouth(ctx,L.mouthX,L.mouthY+(mood.mouthDY||0),L.mouthS,recipe.mouth,mood.mouth,state.talk||0,line,L.mouthW);
 drawFacialPaint(ctx,L,recipe.facial,'moustache');
 drawMarks(ctx,L,skin,fx.filter(f=>!UNDER_MARKS.has(f)),mood.mouthDY||0);
 if(!state.objects){drawFacialHair(ctx,L,recipe.facial);drawGlasses(ctx,L,recipe.glasses);}
 ctx.restore();
}

/** One eye, as drawFace draws it (also Pocket Camera's face stickers, camera/face-stamps.js). */
export function drawEye(ctx,x,y,s,side,eyes,state,look,tilt,width=1){
 // The funny faces' eyes: the person's own eye under a lid or with a twinkle, or a symbol in its place.
 if(FUNNY_EYES.has(state)){funnyEye(ctx,x,y,s,side,eyes,state,look,tilt,width);return;}
 const style=eyes.style,line='#2b2623';
 ctx.save();ctx.translate(x,y);ctx.rotate(side*tilt*-1);ctx.scale(s*width,s);
 ctx.strokeStyle=line;ctx.fillStyle=line;ctx.lineWidth=3.2;
 // Squinting eyes (Mr Fujita's) are drawn their own way for every feeling they show, so they stay his.
 if(style==='squint'&&SQUINT_STATES.has(state)){squintEye(ctx,side,state,look);ctx.restore();return;}
 // Pain: squeezed shut, the two eyes chevrons pointing at the nose (> <), whatever the eyes are like open.
 if(state==='pain'){ctx.lineWidth=4;const tip=-side*8;ctx.beginPath();ctx.moveTo(-tip,-8);ctx.lineTo(tip,0);ctx.lineTo(-tip,8);ctx.stroke();ctx.restore();return;}
 // Shock: wide whites with the pupils shrunk to dots.
 if(state==='shock'){
  ctx.fillStyle='#fbfaf6';ctx.beginPath();ctx.ellipse(0,0,14,18,0,0,TAU);ctx.fill();ctx.stroke();
  ctx.fillStyle=line;ctx.beginPath();ctx.arc(look[0]*3,look[1]*3,3.2,0,TAU);ctx.fill();ctx.restore();return;
 }
 // Dazed and deadpan: the upper lid down to the middle of the eye, the pupil showing under it (dazed: drifting up and out,
 // the lid drooping to the outside; deadpan: straight ahead under a level lid).
 if(state==='daze'||state==='dry'){
  const daze=state==='daze',lid=daze?-1:-2,px=daze?side*3+look[0]*2:look[0]*2,py=daze?1:3;
  ctx.save();ctx.beginPath();ctx.rect(-16,lid,32,20);ctx.clip();ctx.beginPath();ctx.ellipse(px,py,8,9,0,0,TAU);ctx.fill();ctx.restore();
  ctx.lineWidth=3.6;ctx.beginPath();ctx.moveTo(-13,lid-(daze?-side*2:0));ctx.lineTo(13,lid+(daze?-side*2:0));ctx.stroke();
  if(!daze){ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,12);ctx.lineTo(9,12);ctx.stroke();}
  ctx.restore();return;
 }
 // Big outlined reaction eyes stay readable across every authored eye style.
 if(state==='wide'||state==='worry'){
  const rx=state==='wide'?15:13,ry=state==='wide'?19:16;
  ctx.fillStyle='#fbfaf6';ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.fill();ctx.stroke();
  ctx.fillStyle=eyes.colour;ctx.beginPath();ctx.ellipse(look[0]*3,look[1]*3,rx*.58,ry*.62,0,0,TAU);ctx.fill();
  ctx.fillStyle=line;ctx.beginPath();ctx.ellipse(look[0]*3,look[1]*3,rx*.36,ry*.42,0,0,TAU);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(3,-5,3,0,TAU);ctx.fill();
  if(style==='lashes')for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(side*rx*.8,-9+i*5);ctx.lineTo(side*(rx+6),-12+i*6);ctx.stroke();}
  ctx.restore();return;
 }
 // Knocked silly: a spiral in a white eye, the cartoon daze, the same for every eye style.
 if(state==='spiral'){
  ctx.fillStyle='#fbfaf6';ctx.beginPath();ctx.ellipse(0,0,14,16,0,0,TAU);ctx.fill();ctx.stroke();
  ctx.lineWidth=2.4;ctx.beginPath();
  for(let i=0;i<=60;i++){const a=i/60*TAU*2.6,r=1+i/60*11;ctx.lineTo(side*Math.cos(a)*r,Math.sin(a)*r*1.1);}
  ctx.stroke();ctx.restore();return;
 }
 if(state==='closed'||state==='content'){
  ctx.beginPath();ctx.arc(0,state==='content'?-3:-6,11,Math.PI*.18,Math.PI*.82);ctx.stroke();
  if(style==='lashes'){ctx.beginPath();ctx.moveTo(side*9,2);ctx.lineTo(side*14,5);ctx.stroke();}
  ctx.restore();return;
 }
 if(state==='happy'){ctx.lineWidth=5.2;ctx.beginPath();ctx.moveTo(-13,4);ctx.quadraticCurveTo(0,-21,13,4);ctx.stroke();ctx.restore();return;}
 const wide=state==='wide'?1.3:1;
 const rx=(style==='narrow'?12:(style==='dot'||style==='inkoval')?6:style==='sparkle'?13:style==='doe'?12.5:style==='cat'||style==='heavy'?12:11.5)*wide,
  ry=(style==='narrow'?4.2:(style==='dot'||style==='inkoval')?9:style==='almond'?9.5:style==='cat'?9:style==='sparkle'?15:style==='doe'?15:style==='heavy'?12:13.5)*wide;
 // Simple dark ovals and drawn lids keep emotions readable at street scale.
 // Almond and sparkle eyes retain their authored iris shapes.
 if(['round','gentle','lashes','sleepy','bright','tired','starry'].includes(style)){
  const h=(style==='sleepy'?6:style==='gentle'?9:style==='bright'?13.5:style==='tired'?11:12)*wide;
  ctx.save();ctx.beginPath();ctx.ellipse(look[0]*2,look[1]*2,(style==='bright'?10:9)*wide,h,0,0,TAU);ctx.clip();ctx.fill();
  ctx.fillStyle=ctx.canvas.__skin;
  if(state==='angry'||state==='sad'){
   const direction=state==='angry'?-side:side;
   ctx.beginPath();ctx.moveTo(-14,-h-2);ctx.lineTo(14,-h-2);ctx.lineTo(direction*14,1);ctx.closePath();ctx.fill();
  }else if(state==='shy')ctx.fillRect(-14,-h-2,28,h*.7);
  else if(state==='smiling'){ctx.beginPath();ctx.ellipse(0,h+5,15,9,0,0,TAU);ctx.fill();}
  ctx.restore();
  // One restrained catchlight gives the simple oval eyes a livelier expression.
  if(!['angry','sad','shy'].includes(state)){
   const cx=look[0]*2+2,cy=-h*.35+look[1]*2;ctx.fillStyle='#fbfaf6';ctx.beginPath();
   if(style==='starry'){for(let i=0;i<8;i++){const a=i/8*TAU-Math.PI/2,r=i%2?1.3:4;ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}ctx.closePath();}
   else {ctx.globalAlpha=style==='bright'?.88:1;ctx.arc(cx,cy,style==='bright'?3:1.8,0,TAU);}
   ctx.fill();
   ctx.globalAlpha=1;
   if(style==='bright'){ctx.beginPath();ctx.arc(look[0]*2-2.5,h*.4+look[1]*2,1.3,0,TAU);ctx.fill();}
  }
  if(style==='bright'){ctx.strokeStyle='rgba(43,38,35,.22)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-2,12,h+3,0,Math.PI*1.12,Math.PI*1.88);ctx.stroke();ctx.strokeStyle=line;}
  // Tired eyes: a soft bag under each.
  if(style==='tired'){ctx.strokeStyle='rgba(43,38,35,.45)';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,h*.2,10,Math.PI*.2,Math.PI*.8);ctx.stroke();ctx.strokeStyle=line;}
  if(style==='lashes'){ctx.lineWidth=2.8;for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(side*5,-5-i*3);ctx.lineTo(side*(11+i*2),-8-i*4);ctx.stroke();}}
 }else if(style==='dot'||style==='inkoval'){
  ctx.beginPath();ctx.ellipse(look[0]*2,look[1]*2,rx,ry,0,0,TAU);ctx.fill();
  if(style==='dot'){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(2+look[0]*2,-3,2.2,0,TAU);ctx.fill();}
 }else if(style==='narrow'){
  ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.fill();
 }else if(style==='squint'){
  // Screwed-up, cheerful: a short thick arch.
  ctx.lineWidth=4.2;ctx.beginPath();ctx.moveTo(-11,3);ctx.quadraticCurveTo(0,-9,11,3);ctx.stroke();
 }else{
  // White, iris, pupil, a catchlight.
  ctx.fillStyle='#fbfaf6';ctx.beginPath();
  if(style==='almond'){ctx.moveTo(-rx,1);ctx.quadraticCurveTo(-2,-ry*1.5,rx,-1);ctx.quadraticCurveTo(0,ry*1.3,-rx,1);}
  // A cat's eye lifts at its outer corner.
  else if(style==='cat'){ctx.moveTo(-side*rx,2);ctx.quadraticCurveTo(0,-ry*1.5,side*rx,-4);ctx.quadraticCurveTo(0,ry*1.3,-side*rx,2);}
  else ctx.ellipse(0,0,rx,ry,0,0,TAU);
  ctx.fill();
  ctx.save();ctx.clip();
  const ir=style==='sparkle'?10:style==='doe'?8.6:7.4,ix=look[0]*4,iy=look[1]*3+(style==='gentle'?3:1);
  ctx.fillStyle=eyes.colour;ctx.beginPath();ctx.arc(ix,iy,ir,0,TAU);ctx.fill();
  ctx.fillStyle='#120c0a';ctx.beginPath();ctx.arc(ix,iy,ir*.5,0,TAU);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ix+ir*.38,iy-ir*.4,ir*.3,0,TAU);ctx.fill();
  if(style==='sparkle'){ctx.beginPath();ctx.arc(ix-ir*.35,iy+ir*.4,ir*.16,0,TAU);ctx.fill();}
  // Lids: what makes the eye sleepy, gentle, sad or cross.
  ctx.fillStyle=ctx.canvas.__skin||'#e8bf98';
  if(style==='sleepy'||state==='shy'){ctx.fillRect(-rx-2,-ry-2,rx*2+4,ry*.9);}
  if(style==='heavy'&&state!=='shy'){ctx.fillRect(-rx-2,-ry-2,rx*2+4,ry*.7);}
  if(style==='droopy'&&state!=='sad'){ctx.beginPath();ctx.moveTo(-rx-2,-ry-2);ctx.lineTo(rx+2,-ry-2);ctx.lineTo(side*rx+2*side,-ry*.15);ctx.closePath();ctx.fill();}
  if(state==='sad'){ctx.beginPath();ctx.moveTo(-rx-2,-ry-2);ctx.lineTo(rx+2,-ry-2);ctx.lineTo(side*rx+2*side,-ry*.1);ctx.closePath();ctx.fill();}
  if(state==='angry'){ctx.beginPath();ctx.moveTo(-rx-2,-ry-2);ctx.lineTo(rx+2,-ry-2);ctx.lineTo(-side*rx-2*side,-ry*.05);ctx.closePath();ctx.fill();}
  ctx.restore();
  ctx.lineWidth=2.4;ctx.beginPath();
  if(style==='almond'){ctx.moveTo(-rx,1);ctx.quadraticCurveTo(-2,-ry*1.5,rx,-1);ctx.stroke();}
  else if(style==='cat'){ctx.moveTo(-side*rx,2);ctx.quadraticCurveTo(0,-ry*1.5,side*rx,-4);ctx.lineTo(side*(rx+7),-9);ctx.stroke();}
  else if(style==='heavy'){ctx.lineWidth=3.6;ctx.beginPath();ctx.moveTo(-rx-1,-ry*.3);ctx.quadraticCurveTo(0,-ry*.48,rx+1,-ry*.3);ctx.stroke();}
  else{ctx.ellipse(0,0,rx,ry,0,Math.PI*1.05,Math.PI*1.95);ctx.stroke();}
  if(style==='doe'){ctx.lineWidth=1.8;for(let i=0;i<2;i++){const a=Math.PI/2-side*(.7+i*.35);ctx.beginPath();ctx.moveTo(Math.cos(a)*rx*.95,Math.sin(a)*ry*.95);ctx.lineTo(Math.cos(a)*(rx+4),Math.sin(a)*(ry+3));ctx.stroke();}}
  if(style==='gentle'){ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,ry*.3,rx*1.02,Math.PI*1.12,Math.PI*1.88);ctx.stroke();}
  if(style==='lashes'){ctx.lineWidth=2.2;for(let i=0;i<3;i++){const a=-Math.PI/2+side*(.55+i*.28);ctx.beginPath();ctx.moveTo(Math.cos(a)*rx*.95,Math.sin(a)*ry*.95);ctx.lineTo(Math.cos(a)*(rx+6),Math.sin(a)*(ry+5));ctx.stroke();}}
 }
 if(state==='sad'){ctx.strokeStyle='rgba(120,180,230,.7)';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(side*-4,ry);ctx.lineTo(side*-5,ry+8);ctx.stroke();}
 ctx.restore();
}

/**
 * A squint (Mr Fujita's screwed-up, cheerful eyes) following the feeling and still his: the short thick arch at rest;
 * smiling, the arch with a cheek pushed up under it; laughing, shut tight with laughter lines at the corners; sad, the arch
 * drooping to the outside; cross, a hard dash down to the nose; shy, a small low arch; thinking, a slit with the eye
 * showing at one end; surprised or worried, small round eyes popped open (worried under a slanted lid); shocked, the same
 * with pinpoint pupils.
 */
const SQUINT_STATES=new Set(['open','smiling','happy','sad','angry','shy','side','wide','worry','shock']);
function squintEye(ctx,side,state,look){
 const line='#2b2623';ctx.lineCap='round';
 const arch=(w,h,y=3)=>{ctx.beginPath();ctx.moveTo(-w,y);ctx.quadraticCurveTo(0,y-h,w,y);ctx.stroke();};
 if(state==='open'){ctx.lineWidth=4.2;arch(11,12);return;}
 if(state==='smiling'){ctx.lineWidth=4.2;arch(11,13,1);ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-8,10);ctx.quadraticCurveTo(0,6,8,10);ctx.stroke();return;}
 if(state==='happy'){ctx.lineWidth=5;arch(12,15,4);ctx.lineWidth=2;for(const dy of [-4,3]){ctx.beginPath();ctx.moveTo(side*14,dy);ctx.lineTo(side*19,dy+(dy<0?-3:3));ctx.stroke();}return;}
 if(state==='sad'){ctx.lineWidth=4;ctx.save();ctx.rotate(-side*.32);arch(10,8,4);ctx.restore();
  ctx.strokeStyle='rgba(120,180,230,.7)';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(side*-4,8);ctx.lineTo(side*-5,16);ctx.stroke();return;}
 if(state==='angry'){ctx.lineWidth=4.6;ctx.beginPath();ctx.moveTo(-side*-11,-3);ctx.lineTo(-side*11,4);ctx.stroke();return;}
 if(state==='shy'){ctx.lineWidth=3.6;arch(8,7,6);return;}
 if(state==='side'){ctx.lineWidth=3.6;ctx.beginPath();ctx.moveTo(-11,1);ctx.lineTo(11,1);ctx.stroke();const x=(look[0]>=0?1:-1)*6;ctx.beginPath();ctx.arc(x,2.5,3.4,0,TAU);ctx.fill();return;}
 // popped open: small round whites, the pupil a dot (pinpoint for shock), a lid slanted up to the nose when worried
 const rx=state==='shock'?9.5:8,ry=state==='shock'?11:9.5;
 ctx.fillStyle='#fbfaf6';ctx.lineWidth=2.8;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.fill();ctx.stroke();
 ctx.fillStyle=line;ctx.beginPath();ctx.arc(look[0]*2,look[1]*2,state==='shock'?2.2:3.6,0,TAU);ctx.fill();
 if(state==='worry'){ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(-side*-10,-ry-1);ctx.lineTo(-side*10,-ry-5);ctx.stroke();}
}

/** Symbol eyes (drawn instead of the eye, the same for every eye style, and kept through a blink), and the eyes that are
 * the person's own under a lid or with a twinkle (smug, droop, dreamy, the open half of a wink). */
const SYMBOL_EYES=Object.freeze(['star','heart','blank','bawl','wink']);
const FUNNY_EYES=new Set([...SYMBOL_EYES,'smug','droop','dreamy']);
const INK='#2b2623';
/** Where a point in an eye's own drawing space (as drawEye lays it out) lands on the face. */
const eyeSpace=(x,y,s,width,side,tilt)=>{const a=-side*tilt,c=Math.cos(a),n=Math.sin(a);return (px,py)=>[x+c*px*s*width-n*py*s,y+n*px*s*width+c*py*s];};
/** A four-pointed sparkle of radius r at (x,y). */
function sparkle(ctx,x,y,r,fill){ctx.fillStyle=fill;ctx.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU-Math.PI/2,q=i%2?r*.3:r;ctx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}ctx.closePath();ctx.fill();}
function funnyEye(ctx,x,y,s,side,eyes,state,look,tilt,width){
 const style=eyes.style,inSpace=fn=>{ctx.save();ctx.translate(x,y);ctx.rotate(side*tilt*-1);ctx.scale(s*width,s);ctx.strokeStyle=INK;ctx.fillStyle=INK;ctx.lineCap='round';ctx.lineJoin='round';fn();ctx.restore();};
 if(state==='wink'){
  // The viewer's right eye shut in a happy curve, a little sparkle beside it; the other one their own, open.
  if(side>0){drawEye(ctx,x,y,s,side,eyes,'happy',look,tilt,width);inSpace(()=>sparkle(ctx,side*21,-13,5.5,'#f6c945'));}
  else drawEye(ctx,x,y,s,side,eyes,'open',look,tilt,width);
  return;
 }
 if(state==='dreamy'){
  // Their own eye gazing up, brimming with two big sparkles (a squint stays a squint, smiling).
  drawEye(ctx,x,y,s,side,eyes,style==='squint'?'smiling':'open',look,tilt,width);
  if(style!=='squint')inSpace(()=>{sparkle(ctx,-3,-4,4.2,'#ffffff');ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(3.5,3.5,1.7,0,TAU);ctx.fill();});
  return;
 }
 if(state==='smug'||state==='droop'){
  // Their own eye under a heavy upper lid: level and half shut (smug), or lower and drooping to the outside (drowsy).
  const smug=state==='smug',inner=smug?-2:1,outer=smug?-2.5:6;
  if(style==='squint'){inSpace(()=>{ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-side*11,inner+3);ctx.lineTo(side*11,outer+3);ctx.stroke();});return;}
  const P=eyeSpace(x,y,s,width,side,tilt);
  ctx.save();ctx.beginPath();for(const [px,py] of [[-side*24,inner],[side*24,outer],[side*24,32],[-side*24,32]])ctx.lineTo(...P(px,py));ctx.closePath();ctx.clip();
  drawEye(ctx,x,y,s,side,eyes,'open',look,tilt,width);ctx.restore();
  inSpace(()=>{ctx.lineWidth=smug?3.2:3.6;ctx.beginPath();ctx.moveTo(-side*13,inner);ctx.quadraticCurveTo(0,(inner+outer)/2-1.5,side*13.5,outer+(smug?0:1));ctx.stroke();
   if(!smug){ctx.strokeStyle='rgba(43,38,35,.4)';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,4,11,Math.PI*.25,Math.PI*.75);ctx.stroke();}});
  return;
 }
 inSpace(()=>{
  if(state==='star'){
   ctx.fillStyle='#f6c945';ctx.lineWidth=2.6;ctx.beginPath();for(let i=0;i<10;i++){const a=i/10*TAU-Math.PI/2,r=i%2?6:14;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r+1);}ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#fffbe8';ctx.beginPath();ctx.arc(-3,-2,2.3,0,TAU);ctx.fill();
  }else if(state==='heart'){
   ctx.fillStyle='#e5484d';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,13);ctx.bezierCurveTo(-6,7,-15,1,-14,-6);ctx.bezierCurveTo(-13,-13,-3,-14,0,-6);ctx.bezierCurveTo(3,-14,13,-13,14,-6);ctx.bezierCurveTo(15,1,6,7,0,13);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#ffe3e3';ctx.beginPath();ctx.ellipse(-7,-6,2.6,1.8,-.6,0,TAU);ctx.fill();
  }else if(state==='blank'){
   ctx.fillStyle='#fbfaf6';ctx.lineWidth=2.8;ctx.beginPath();ctx.ellipse(0,0,12,14,0,0,TAU);ctx.fill();ctx.stroke();
  }else if(state==='bawl'){
   // Squeezed shut, the tears welling along the lid.
   ctx.lineWidth=4.6;ctx.beginPath();ctx.moveTo(-13,3);ctx.quadraticCurveTo(0,-8,13,3);ctx.stroke();
   ctx.fillStyle='rgba(150,205,240,.9)';ctx.beginPath();ctx.ellipse(0,6,10,3,0,0,TAU);ctx.fill();
   if(style==='lashes'){ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(side*12,1);ctx.lineTo(side*17,-2);ctx.stroke();}
  }
 });
}

/**
 * The cartoon marks a funny face lays on the skin. Under the parts: 'flush' (the face going red from the top), 'gloom'
 * (blue lines falling over the brow), 'puff' (cheeks blown out round the mouth). Over them: 'waterfall' (a stream of tears
 * from each eye down the cheeks), 'sweat' (the big drop at the temple), 'vein' (the popping anger mark), 'drool' (a drip
 * from the corner of the mouth). All in the face's 256-unit square, placed from the layout so they move with the parts.
 */
const UNDER_MARKS=new Set(['flush','gloom','puff']);
function drawMarks(ctx,L,skin,marks,mouthDY=0){
 if(!marks.length)return;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const mark of marks){
  if(mark==='flush'){
   const g=ctx.createRadialGradient(128,L.browY,8,128,L.browY,104);g.addColorStop(0,'rgba(214,58,48,.42)');g.addColorStop(.6,'rgba(214,58,48,.2)');g.addColorStop(1,'rgba(214,58,48,0)');
   ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
  }else if(mark==='gloom'){
   const g=ctx.createRadialGradient(128,-60,20,128,-60,L.eyeY+56);g.addColorStop(0,'rgba(84,92,170,.5)');g.addColorStop(1,'rgba(84,92,170,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,L.eyeY);
   ctx.strokeStyle='rgba(70,78,160,.6)';ctx.lineWidth=2.4;
   for(let i=0;i<7;i++){const x=89+i*13;ctx.beginPath();ctx.moveTo(x,6);ctx.lineTo(x,L.eyeY-20-(i%2)*8);ctx.stroke();}
  }else if(mark==='puff'){
   // Each cheek blown out round: a pale round with its edge drawn and a shine on it.
   for(const s of [-1,1]){const x=L.mouthX+s*(16*L.mouthS*L.mouthW+2),y=L.mouthY-6;
    ctx.fillStyle=shade(skin,1.04);ctx.beginPath();ctx.arc(x,y,15,0,TAU);ctx.fill();
    ctx.strokeStyle=shade(skin,.66);ctx.lineWidth=2.8;ctx.beginPath();ctx.arc(x,y,15,s>0?-1.1:Math.PI-1.1,s>0?1.1:Math.PI+1.1);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(x+s*4,y-7,4,2.4,s*.5,0,TAU);ctx.fill();}
  }else if(mark==='waterfall'){
   for(const s of [-1,1]){
    const x=128+s*L.spread,y=L.eyeY+6*L.eyeS,w=4.5*L.eyeS;
    ctx.fillStyle='rgba(150,205,240,.88)';ctx.strokeStyle='rgba(60,120,170,.75)';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(x-w,y);ctx.bezierCurveTo(x-w-2,y+40,x-w+3,y+90,x-w-3,256);ctx.lineTo(x+w+3,256);ctx.bezierCurveTo(x+w-3,y+90,x+w+2,y+40,x+w,y);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(x-1,y+6);ctx.bezierCurveTo(x-2,y+40,x,y+90,x-2,250);ctx.stroke();
   }
  }else if(mark==='sweat'){
   // The big drop, as tall as the eye, at the temple.
   const x=Math.min(212,128+L.spread+22*L.eyeS),y=Math.max(60,L.browY+2),k=1.5;
   ctx.fillStyle='#bfe6fb';ctx.strokeStyle='#4b86b0';ctx.lineWidth=2.4;
   ctx.beginPath();ctx.moveTo(x,y-15*k);ctx.bezierCurveTo(x+4*k,y-7*k,x+9*k,y-2*k,x+9*k,y+4*k);ctx.arc(x,y+4*k,9*k,0,Math.PI);ctx.bezierCurveTo(x-9*k,y-2*k,x-4*k,y-7*k,x,y-15*k);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(x-3.5*k,y+3*k,2*k,3.4*k,.3,0,TAU);ctx.fill();
  }else if(mark==='vein'){
   const x=Math.max(46,128-L.spread-22*L.eyeS),y=Math.max(52,L.browY-12);
   ctx.strokeStyle='#d8342c';ctx.lineWidth=4.2;
   for(const [dx,dy,a] of [[-1,-1,0],[1,-1,.5],[1,1,1],[-1,1,1.5]]){ctx.beginPath();ctx.arc(x+dx*10,y+dy*10,8,a*Math.PI,(a+.5)*Math.PI);ctx.stroke();}
  }else if(mark==='drool'){
   const x=L.mouthX+12*L.mouthS*L.mouthW,y=L.mouthY+mouthDY+4;
   ctx.fillStyle='rgba(200,232,248,.92)';ctx.strokeStyle='rgba(70,130,170,.8)';ctx.lineWidth=1.4;
   ctx.beginPath();ctx.moveTo(x-2.2,y);ctx.quadraticCurveTo(x-3,y+18,x-4.6,y+25);ctx.arc(x,y+26,4.8,Math.PI*1.05,Math.PI*1.95,true);ctx.quadraticCurveTo(x+3,y+18,x+2.2,y);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x-1.5,y+25,1.4,0,TAU);ctx.fill();
  }
 }
 ctx.restore();
}

/** One brow, as drawFace draws it (also Pocket Camera's face stickers, camera/face-stamps.js). */
export function drawBrow(ctx,x,y,s,side,brows,tilt,mood){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 // Positive mood tilts the inner end down (cross), negative lifts it (worried, sad). The inner end is toward the nose
 // (-side), and a positive canvas turn moves +x down: so the mood turns the brow by -side (it had the sign the wrong way
 // round, and every angry face wore worried brows; the creator, 2026-10-12: "Tetsuos eye brows look worried instead of evil").
 ctx.rotate(side*-tilt-side*mood*.48);
 const ink=shade(brows.colour,.68);ctx.strokeStyle=ink;ctx.fillStyle=ink;ctx.lineCap='round';
 const style=brows.style;
 const w=style==='thick'||style==='bushy'?7:style==='thin'?2.4:style==='short'?5.4:style==='feathered'?3:4.2;
 ctx.lineWidth=w;ctx.beginPath();
 if(style==='arched'){ctx.moveTo(-13,3);ctx.quadraticCurveTo(0,-7,13,2);}
 else if(style==='worried'){ctx.moveTo(-13,-3);ctx.quadraticCurveTo(0,0,13,3);}
 else if(style==='bushy'){ctx.moveTo(-14,2);ctx.quadraticCurveTo(0,-5,14,1);ctx.stroke();ctx.lineWidth=2;for(let i=-12;i<=12;i+=4){ctx.beginPath();ctx.moveTo(i,-2);ctx.lineTo(i+2*side,-7);ctx.stroke();}ctx.restore();return;}
 // The inner end of each brow is toward the nose: -side.
 else if(style==='angled'){ctx.moveTo(-side*13,3);ctx.lineTo(side*5,-5);ctx.lineTo(side*13,1);}
 else if(style==='short'){ctx.moveTo(-6,1);ctx.quadraticCurveTo(0,-2,6,1);}
 else if(style==='rounded'){ctx.arc(0,8,13,Math.PI*1.18,Math.PI*1.82);}
 else if(style==='tapered'){ctx.moveTo(-side*13,-4);ctx.quadraticCurveTo(0,-6,side*13,0);ctx.quadraticCurveTo(0,-1,-side*13,4);ctx.closePath();ctx.fill();ctx.restore();return;}
 else if(style==='maro'){ctx.ellipse(0,-3,6.5,4.2,0,0,TAU);ctx.fill();ctx.restore();return;}
 else if(style==='feathered'){ctx.moveTo(-13,1);ctx.quadraticCurveTo(0,-4,13,1);ctx.stroke();ctx.lineWidth=1.6;for(let i=-10;i<=10;i+=4){ctx.beginPath();ctx.moveTo(i,-1);ctx.lineTo(i+3*side,-5);ctx.stroke();}ctx.restore();return;}
 else{ctx.moveTo(-13,1);ctx.quadraticCurveTo(0,-3,13,1);}
 ctx.stroke();ctx.restore();
}

/**
 * The ink noses (the creator, 2026-10-14: "many different kind of noses needs to go in the avatar creator, they should look
 * like different characters ... don't copy Nintendo ... it should feel like something you could draw with a stencil"): each
 * is a few strokes of one pen, round at the ends, drawn on the face with nothing raised (build.js adds no bump for them).
 * The pen is a list of strokes; a stroke is moves in face units round the nose's point (y down): [x,y] a line to there,
 * [cx,cy,x,y] a curve through cx,cy to there, 'z' closing it; {dot:[x,y]} is a filled dot. The first point starts the stroke.
 */
export const INK_NOSES=Object.freeze({
 drawn:{label:'Drawn line',pen:[[[3,-17],[-4,-4,-3,2],[-1,5.5,5,4]]]},
 slash:{label:'Slash',pen:[[[3,-9],[-3,3]]]},
 bracket:{label:'Bracket',pen:[[[3,-8],[-5,-2,3,4]]]},
 corner:{label:'Corner',pen:[[[-1,-14],[-4,2],[4,2]]]},
 stub:{label:'Stub',pen:[[[0,-7],[-3,2],[3,2]]]},
 jhook:{label:'J hook',pen:[[[2,-15],[2,0],[2,4,-2,3]]]},
 chevron:{label:'Chevron',pen:[[[-4,-3],[0,2],[4,-3]]]},
 caret:{label:'Caret',pen:[[[-4,2],[0,-3],[4,2]]]},
 curve:{label:'Curve',pen:[[[-7,-1],[0,6,7,-1]]]},
 widecurve:{label:'Wide curve',pen:[[[-10,-2],[0,8,10,-2]]]},
 cup:{label:'Cup',pen:[[[-4,-4],[-4,4,0,4],[4,4,4,-4]]]},
 tallcup:{label:'Tall cup',pen:[[[-4,-12],[-4,0],[-4,5,0,5],[4,5,4,0],[4,-12]]]},
 bell:{label:'Bell',pen:[[[-3,-9],[-8,4,0,4],[8,4,3,-9]]]},
 twinlobe:{label:'Two lobes',pen:[[[-6,-1],[-6,4,-2,3],[0,5,2,3],[6,4,6,-1]]]},
 cloud:{label:'Cloud',pen:[[[-9,-1],[-9,4,-5,3],[-3,6.5,0,4],[3,6.5,5,3],[9,4,9,-1]]]},
 arch:{label:'Arch',pen:[[[-5,2],[0,-6,5,2]]]},
 hood:{label:'Hood',pen:[[[-4,3],[-4,-1],[0,-6.5,4,-1],[4,3]]]},
 profile:{label:'Profile',pen:[[[-2,-15],[-3,-2],[-8,4,-1,4],[4,4,4,1]]]},
 bridge:{label:'Bridge',pen:[[[-2,-14],[-2,1],[-4,3.5,-7,2]],[[2,-14],[2,1],[4,3.5,7,2]]]},
 ring:{label:'Ring',pen:[[[-5,0],[-5,-4,0,-4],[5,-4,5,0],[5,4,0,4],[-5,4,-5,0],'z']]},
 nostrils:{label:'Nostrils',pen:[{dot:[-3,1]},{dot:[3,1]}]},
 wedge:{label:'Wedge',pen:[[[0,-7],[-3.5,2],[3.5,2],'z']]},
 slope:{label:'Slope',pen:[[[0,-13],[1,-2,5,2],[0,3]]]},
});
function inkNose(ctx,pen,skin){
 ctx.scale(1.35,1.35);ctx.strokeStyle=shade(skin,.28);ctx.fillStyle=shade(skin,.28);ctx.lineWidth=2.6;ctx.lineCap='round';ctx.lineJoin='round';
 for(const stroke of pen){
  if(stroke.dot){ctx.beginPath();ctx.arc(stroke.dot[0],stroke.dot[1],2.1,0,TAU);ctx.fill();continue;}
  ctx.beginPath();stroke.forEach((m,i)=>{if(m==='z')ctx.closePath();else if(i===0)ctx.moveTo(m[0],m[1]);else if(m.length===2)ctx.lineTo(m[0],m[1]);else ctx.quadraticCurveTo(m[0],m[1],m[2],m[3]);});
  ctx.stroke();
 }
}
/**
 * Face marks (the creator, 2026-10-14: "I want to be able to give them more personality with lines stubble etc ... I want
 * you to be able to look at the characters and feel how they are"): lines and shading in the same pen as the ink noses,
 * each switched on by itself (recipe.marks), placed by the face's own layout so they follow the eyes, brows, nose and mouth.
 */
export const FACE_MARKS=Object.freeze({
 forehead:'Forehead lines',worry:'Worry lines',frown:'Frown lines',lids:'Heavy lids',bags:'Eye bags',crowsfeet:'Crow’s feet',
 smilelines:'Smile lines',cheeks:'Hollow cheeks',dimples:'Dimples',cleft:'Chin cleft',stubble:'Stubble shadow',rosy:'Rosy nose',
 cocked:'One brow up',blushing:'Blushing',   // a face is never quite symmetrical: the viewer's right brow sits higher, always
});
function drawFaceMarks(ctx,L,recipe){
 const m=recipe.marks||{},skin=recipe.body.skin,ink=shade(skin,.42);
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // Stubble first, under everything: a shadow of the beard's colour over the jaw and the upper lip, and a fine tooth to it.
 if(m.stubble){
  // Along the jaw: from below the cheekbones out to the edges of the face, round the chin, the mouth and the
  // upper lip's middle left clear; it fades towards the sides of the head, so it never stops on a hard edge.
  const hair=recipe.facial?.colour||recipe.hair?.colour||'#1c1714',top=L.noseY+4,chin=L.mouthY+60,lip=(L.noseY+L.mouthY)/2;
  const n=parseInt(hair.slice(1),16),rgba=a=>`rgba(${n>>16},${n>>8&255},${n&255},${a})`;
  ctx.save();ctx.beginPath();
  ctx.moveTo(20,top-14);ctx.quadraticCurveTo(70,top+2,96,top+12);ctx.quadraticCurveTo(110,lip-2,128,lip-4);ctx.quadraticCurveTo(146,lip-2,160,top+12);
  ctx.quadraticCurveTo(186,top+2,236,top-14);ctx.quadraticCurveTo(232,chin,128,chin+6);ctx.quadraticCurveTo(24,chin,20,top-14);ctx.closePath();
  ctx.moveTo(110,L.mouthY-3);ctx.quadraticCurveTo(128,L.mouthY-9,146,L.mouthY-3);ctx.quadraticCurveTo(128,L.mouthY+9,110,L.mouthY-3);ctx.closePath();
  const g=ctx.createLinearGradient(20,0,236,0);g.addColorStop(0,rgba(0));g.addColorStop(.18,rgba(.2));g.addColorStop(.82,rgba(.2));g.addColorStop(1,rgba(0));
  ctx.fillStyle=g;ctx.fill('evenodd');ctx.clip('evenodd');
  // Speckles scattered by a hash, so no rows or stripes show.
  const hash=k=>{const x=Math.sin(k*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  for(let i=0;i<620;i++){const x=24+hash(i)*208,y=top-12+hash(i+999)*(chin+16-top),edge=Math.min(x-20,236-x)/40;ctx.fillStyle=rgba(.4*Math.min(1,edge));ctx.fillRect(x,y,1.3,1.3);}
  ctx.restore();
 }
 ctx.strokeStyle=ink;ctx.lineWidth=3.2;   // a few bold lines read from across the street, many thin ones do not
 const line=(pts)=>{ctx.beginPath();pts.forEach((p,i)=>i?(p.length===2?ctx.lineTo(p[0],p[1]):ctx.quadraticCurveTo(p[0],p[1],p[2],p[3])):ctx.moveTo(p[0],p[1]));ctx.stroke();};
 const fy=L.browY-16;
 if(m.forehead)for(let i=0;i<2;i++){const y=fy-i*9,w=26-i*5;line([[128-w,y+1],[128,y-2,128+w,y+1]]);}
 if(m.worry)for(let i=0;i<2;i++){const y=fy-2-i*8;line([[100,y+3],[114,y-1,128,y-5-i]]);line([[156,y+3],[142,y-1,128,y-5-i]]);}
 if(m.frown)for(const s of [-1,1])line([[128+s*4,L.browY-6],[128+s*5.5,L.browY+3,128+s*4,L.browY+10]]);
 for(const s of [-1,1]){
  const ex=128+s*L.spread,er=11*L.eyeS*L.eyeW,eh=13*L.eyeS;
  if(m.lids)line([[ex-er,L.eyeY-eh*.75],[ex,L.eyeY-eh*1.25,ex+er,L.eyeY-eh*.75]]);
  if(m.bags){ctx.lineWidth=2.6;line([[ex-er*.8,L.eyeY+eh*.95],[ex,L.eyeY+eh*1.45,ex+er*.8,L.eyeY+eh*.95]]);ctx.lineWidth=3.2;}
  if(m.crowsfeet)for(const i of [-.6,.6])line([[ex+s*(er+3),L.eyeY+i*4],[ex+s*(er+10),L.eyeY+i*7]]);
  if(m.smilelines)line([[L.noseX+s*11,L.noseY+3],[L.noseX+s*21,(L.noseY+L.mouthY)/2+2,L.mouthX+s*(14*L.mouthS*L.mouthW+3),L.mouthY+1]]);
  if(m.cheeks)line([[128+s*(L.spread+10),L.noseY-2],[128+s*(L.spread+6),L.noseY+12,128+s*(L.spread+8),L.noseY+22]]);
  if(m.dimples)line([[L.mouthX+s*(14*L.mouthS*L.mouthW+6),L.mouthY-3],[L.mouthX+s*(14*L.mouthS*L.mouthW+9),L.mouthY+1,L.mouthX+s*(14*L.mouthS*L.mouthW+6),L.mouthY+5]]);
 }
 if(m.cleft)line([[128,L.mouthY+30],[129.5,L.mouthY+35,128,L.mouthY+40]]);
 if(m.rosy){const g=ctx.createRadialGradient(L.noseX,L.noseY+2,1,L.noseX,L.noseY+2,9);g.addColorStop(0,'rgba(226,96,96,.55)');g.addColorStop(1,'rgba(226,96,96,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(L.noseX,L.noseY+2,9,0,TAU);ctx.fill();}
 ctx.restore();
}

function drawNose(ctx,x,y,s,style,skin,line){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle=shade(skin,.62);ctx.fillStyle=shade(skin,.8);ctx.lineWidth=2.4;
 if(style==='button'){ctx.beginPath();ctx.ellipse(0,0,7,5.5,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.arc(-2,-2,2,0,TAU);ctx.fill();}
 else if(style==='dot'){ctx.fillStyle=shade(skin,.6);for(const sx of [-3,3]){ctx.beginPath();ctx.arc(sx,0,1.6,0,TAU);ctx.fill();}}
 else if(style==='line'){ctx.beginPath();ctx.moveTo(1,-12);ctx.quadraticCurveTo(-2,0,3,4);ctx.lineTo(-3,4);ctx.stroke();}
 else if(style==='wide'){ctx.beginPath();ctx.moveTo(-10,-2);ctx.quadraticCurveTo(-11,6,-3,5);ctx.moveTo(10,-2);ctx.quadraticCurveTo(11,6,3,5);ctx.stroke();ctx.beginPath();ctx.ellipse(0,1,6,4,0,0,TAU);ctx.fill();}
 else if(style==='hook'){ctx.beginPath();ctx.moveTo(-1,-16);ctx.quadraticCurveTo(8,2,1,6);ctx.lineTo(-4,4);ctx.stroke();}
 else if(style==='pointed'){ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(5,4);ctx.lineTo(-2,4);ctx.stroke();}
 else if(style==='snub'){ctx.beginPath();ctx.moveTo(-7,1);ctx.quadraticCurveTo(0,8,7,1);ctx.stroke();ctx.fillStyle=shade(skin,.6);for(const sx of [-3,3]){ctx.beginPath();ctx.arc(sx,1.5,1.4,0,TAU);ctx.fill();}}
 else if(style==='bulb'){ctx.beginPath();ctx.ellipse(0,1,9.5,7.5,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.arc(-3,-2,2.4,0,TAU);ctx.fill();}
 else if(INK_NOSES[style])inkNose(ctx,INK_NOSES[style].pen,skin);
 else if(style==='ridge'){ctx.beginPath();ctx.moveTo(-3,-15);ctx.quadraticCurveTo(-3.5,-1,-7,4);ctx.moveTo(3,-15);ctx.quadraticCurveTo(3.5,-1,7,4);ctx.stroke();ctx.fillStyle=shade(skin,.6);for(const sx of [-3,3]){ctx.beginPath();ctx.arc(sx,4,1.4,0,TAU);ctx.fill();}}
 ctx.restore();
}

function drawMouth(ctx,x,y,s,mouth,moodMouth,talk,line,width=1){
 ctx.save();ctx.translate(x,y);ctx.scale(s*width,s);
 const lips=mouth.colour,lipstick=!NATURAL_LIPS.includes(lips.toLowerCase());
 ctx.strokeStyle=lipstick?lips:line;ctx.lineWidth=lipstick?3.6:3.4;ctx.lineCap='round';
 const inside='#2b2623',tongue='#e07a80',teeth='#fbfaf6';
 const open=(w,h,curve=0)=>{
  ctx.fillStyle=inside;ctx.beginPath();ctx.moveTo(-w,0);ctx.quadraticCurveTo(0,-curve,w,0);ctx.quadraticCurveTo(0,h*2,-w,0);ctx.fill();
  ctx.save();ctx.clip();ctx.fillStyle=teeth;ctx.fillRect(-w,-h,w*2,h*.55+curve*.2);ctx.fillStyle=tongue;ctx.beginPath();ctx.ellipse(0,h*1.3,w*.55,h*.55,0,0,TAU);ctx.fill();ctx.restore();
  ctx.beginPath();ctx.moveTo(-w,0);ctx.quadraticCurveTo(0,-curve,w,0);ctx.quadraticCurveTo(0,h*2,-w,0);ctx.stroke();
 };
 const shape=talk>.5?'talk':moodMouth||mouth.style;
 ctx.beginPath();
 switch(shape){
  case 'talk':{const big=['grin','laugh','o','jawdrop','wail'].includes(moodMouth);open(big?19:12,(big?13:7)+talk*3,big?6:2);break;}
  case 'grin':open(24,15,5);break;
  case 'laugh':open(28,23,7);break;
  case 'o':ctx.fillStyle=inside;ctx.ellipse(0,3,13,20,0,0,TAU);ctx.fill();ctx.stroke();break;
  case 'frown':ctx.arc(0,12,13,Math.PI*1.2,Math.PI*1.8);ctx.stroke();break;
  case 'snarl':ctx.moveTo(-12,4);ctx.lineTo(-4,0);ctx.lineTo(4,0);ctx.lineTo(12,4);ctx.stroke();break;
  case 'wobble':ctx.moveTo(-14,1);ctx.quadraticCurveTo(0,5,14,1);ctx.moveTo(-14,-4);ctx.quadraticCurveTo(-10,1,-14,7);ctx.moveTo(14,-4);ctx.quadraticCurveTo(10,1,14,7);ctx.stroke();break;
  case 'hmm':ctx.moveTo(-8,2);ctx.lineTo(8,-1);ctx.stroke();break;
  case 'smile':ctx.moveTo(-16,-1);ctx.quadraticCurveTo(0,15,16,-1);ctx.stroke();break;
  case 'flat':ctx.moveTo(-11,1);ctx.lineTo(11,1);ctx.stroke();break;
  case 'small':ctx.arc(0,-3,6,Math.PI*.25,Math.PI*.75);ctx.stroke();break;
  case 'wide':ctx.arc(0,-10,18,Math.PI*.22,Math.PI*.78);ctx.stroke();break;
  case 'smirk':ctx.moveTo(-10,2);ctx.quadraticCurveTo(2,4,11,-4);ctx.stroke();break;
  case 'pout':ctx.fillStyle=lips;ctx.ellipse(0,1,6,4.5,0,0,TAU);ctx.fill();break;
  case 'cat':ctx.moveTo(-12,-2);ctx.quadraticCurveTo(-6,7,0,-1);ctx.quadraticCurveTo(6,7,12,-2);ctx.stroke();break;
  case 'teeth':ctx.fillStyle=teeth;if(ctx.roundRect)ctx.roundRect(-13,-4,26,9,4);else ctx.rect(-13,-4,26,9);ctx.fill();ctx.stroke();ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-12,.5);ctx.lineTo(12,.5);ctx.stroke();break;
  case 'open':open(10,6,1);break;
  case 'lopsided':ctx.moveTo(-14,3);ctx.quadraticCurveTo(-2,7,12,-6);ctx.stroke();break;
  case 'tongue':ctx.moveTo(-15,-1);ctx.quadraticCurveTo(0,13,15,-1);ctx.stroke();ctx.fillStyle=tongue;ctx.beginPath();ctx.ellipse(4,8,5,5.5,0,0,Math.PI);ctx.fill();ctx.lineWidth=2;ctx.stroke();break;
  case 'buck':ctx.moveTo(-14,-1);ctx.quadraticCurveTo(0,10,14,-1);ctx.stroke();ctx.fillStyle=teeth;ctx.lineWidth=1.6;for(const x of [-4.5,0]){ctx.beginPath();ctx.rect(x,4,4.5,5.5);ctx.fill();ctx.stroke();}break;
  case 'soft':ctx.moveTo(-9,0);ctx.quadraticCurveTo(0,7,9,0);ctx.stroke();break;
  // The funny faces' mouths.
  case 'jawdrop':{const path=()=>{ctx.beginPath();ctx.moveTo(-15,-3);ctx.quadraticCurveTo(0,-8,15,-3);ctx.lineTo(17,22);ctx.quadraticCurveTo(0,36,-17,22);ctx.closePath();};
   path();ctx.fillStyle=inside;ctx.fill();ctx.save();ctx.clip();ctx.fillStyle=teeth;ctx.fillRect(-18,-9,36,8);ctx.fillStyle=tongue;ctx.beginPath();ctx.ellipse(0,27,12,7,0,0,TAU);ctx.fill();ctx.restore();path();ctx.stroke();break;}
  case 'wail':{const path=()=>{ctx.beginPath();ctx.moveTo(-10,-3);ctx.quadraticCurveTo(0,-7,10,-3);ctx.quadraticCurveTo(21,13,15,19);ctx.quadraticCurveTo(0,25,-15,19);ctx.quadraticCurveTo(-21,13,-10,-3);ctx.closePath();};
   path();ctx.fillStyle=inside;ctx.fill();ctx.save();ctx.clip();ctx.fillStyle=teeth;ctx.fillRect(-12,-9,24,5.5);ctx.fillStyle=tongue;ctx.beginPath();ctx.ellipse(0,20,10,6,0,0,TAU);ctx.fill();ctx.restore();path();ctx.stroke();break;}
  case 'pucker':ctx.lineWidth*=1.15;ctx.moveTo(-4,-9);ctx.quadraticCurveTo(8,-9,7,-2);ctx.quadraticCurveTo(1,0,7,2);ctx.quadraticCurveTo(8,9,-4,9);ctx.stroke();break;
  case 'bleh':ctx.fillStyle=tongue;ctx.moveTo(-6.5,1);ctx.lineTo(6.5,1);ctx.lineTo(6.5,9);ctx.quadraticCurveTo(6.5,16,0,16);ctx.quadraticCurveTo(-6.5,16,-6.5,9);ctx.closePath();ctx.fill();
   ctx.save();ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(0,3.5);ctx.lineTo(0,10);ctx.stroke();ctx.restore();ctx.beginPath();ctx.moveTo(-14,-2);ctx.quadraticCurveTo(0,5,14,-2);ctx.stroke();break;
  case 'yawn':ctx.fillStyle=inside;ctx.ellipse(0,4,7,10,0,0,TAU);ctx.fill();ctx.save();ctx.clip();ctx.fillStyle=tongue;ctx.beginPath();ctx.ellipse(0,13,6,4,0,0,TAU);ctx.fill();ctx.restore();ctx.beginPath();ctx.ellipse(0,4,7,10,0,0,TAU);ctx.stroke();break;
  case 'gritted':{const path=()=>{ctx.beginPath();ctx.moveTo(-17,3);ctx.quadraticCurveTo(0,-9,17,3);ctx.quadraticCurveTo(0,12,-17,3);ctx.closePath();};
   path();ctx.fillStyle=teeth;ctx.fill();ctx.save();ctx.clip();ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-17,2);ctx.lineTo(17,2);for(let i=-2;i<=2;i++){ctx.moveTo(i*6,-8);ctx.lineTo(i*6,10);}ctx.stroke();ctx.restore();path();ctx.stroke();break;}
  case 'drool':open(13,8,2);break;
  default:ctx.arc(0,-8,13,Math.PI*.2,Math.PI*.8);ctx.stroke();
 }
 // Lipstick is worn as a colour, not just a line.
 if(lipstick&&['smile','small','wide','flat','smirk','wobble','soft','lopsided'].includes(shape)){ctx.fillStyle=lips;ctx.globalAlpha=.85;ctx.beginPath();ctx.ellipse(0,2,shape==='wide'?13:9,3.2,0,0,TAU);ctx.fill();ctx.globalAlpha=1;}
 ctx.restore();
}

/** Moustache and beard, from a normalized recipe or an older one that gave one `style`. */
const MOUSTACHES=['moustache','walrus','handlebar','pencil'];
/**
 * Facial hair painted on the skin (the creator, 2026-10-14: "enhance facial hair too"): a third layer under the 3D
 * moustache and beard (recipe.facial.paint), and moustaches that are painted rather than built (PAINTED_MOUSTACHES), so
 * they read in the game as they do in the maker. All in the whiskers' colour with a darker edge; the moustaches stretch
 * with facial.width, and everything follows the size and height sliders.
 */
export const PAINTED_MOUSTACHES=Object.freeze({chevron:'Chevron',toothbrush:'Toothbrush',horseshoe:'Horseshoe',fumanchu:'Fu Manchu',brush:'Brush',curled:'Curled'});
export const PAINTED_BEARDS=Object.freeze({full:'Full beard',circle:'Circle beard',chops:'Chops',mutton:'Mutton chops',anchor:'Anchor',soul:'Soul patch',scruff:'Scruffy beard',strip:'Chin strip'});
function drawFacialPaint(ctx,L,facial,layer='both'){
 const paint=layer==='moustache'?'none':facial.paint||'none',mous=layer==='beard'||!PAINTED_MOUSTACHES[facial.moustache]?'none':facial.moustache;
 if(paint==='none'&&mous==='none')return;
 const S=L.facialS??1,DY=L.facialDY??0,wk=.6+(facial.width??.5)*.8,col=facial.colour||'#1c1714',edge=shade(col,.7);
 const mw=14*L.mouthS*L.mouthW,mx=L.mouthX,my=L.mouthY;
 ctx.save();ctx.fillStyle=col;ctx.strokeStyle=edge;ctx.lineWidth=1.4;ctx.lineJoin='round';ctx.lineCap='round';
 const finish=(rule)=>{ctx.fill(rule);ctx.stroke();};
 if(paint!=='none'){
  ctx.save();ctx.translate(128,my+DY*.5);ctx.scale(S,S);ctx.translate(-128,-my);
  const top=L.noseY+6,chin=my+56,hole=()=>{ctx.moveTo(mx-mw-6,my);ctx.quadraticCurveTo(mx,my-12,mx+mw+6,my);ctx.quadraticCurveTo(mx,my+12,mx-mw-6,my);ctx.closePath();};
  ctx.beginPath();
  if(paint==='full'||paint==='scruff'){
   ctx.moveTo(58,top-8);ctx.quadraticCurveTo(84,top+4,100,top+10);ctx.quadraticCurveTo(114,(L.noseY+my)/2-2,128,(L.noseY+my)/2-4);ctx.quadraticCurveTo(142,(L.noseY+my)/2-2,156,top+10);ctx.quadraticCurveTo(172,top+4,198,top-8);
   if(paint==='scruff'){ctx.lineTo(196,chin-22);for(let i=0;i<=12;i++){const x=196-i*(136/12),y=chin-22+Math.sin(i/12*Math.PI)*24+(i%2?7:-1);ctx.lineTo(x,y);}ctx.lineTo(58,top-8);}
   else{ctx.quadraticCurveTo(200,chin-4,128,chin+4);ctx.quadraticCurveTo(56,chin-4,58,top-8);}
   ctx.closePath();hole();finish('evenodd');
  }else if(paint==='circle'){
   ctx.ellipse(mx,my+4,mw+15,27,0,0,TAU);ctx.closePath();hole();finish('evenodd');
  }else if(paint==='chops'||paint==='mutton'){
   for(const s of [-1,1]){const o=x=>128+s*x;ctx.moveTo(o(100),L.eyeY+2);ctx.lineTo(o(114),L.eyeY+2);ctx.quadraticCurveTo(o(112),my+2,o(paint==='mutton'?mw+8:104),my+12);
    ctx.lineTo(o(paint==='mutton'?mw+4:92),my+26);ctx.quadraticCurveTo(o(98),my+14,o(98),L.eyeY+14);ctx.closePath();}
   finish();
   if(paint==='mutton'){ctx.beginPath();ctx.moveTo(mx-mw-8,my+4);ctx.quadraticCurveTo(mx-10,my-16,mx,my-12);ctx.quadraticCurveTo(mx+10,my-16,mx+mw+8,my+4);ctx.quadraticCurveTo(mx,my-6,mx-mw-8,my+4);ctx.closePath();finish();}
  }else if(paint==='anchor'){
   ctx.moveTo(mx-mw-2,my+2);ctx.quadraticCurveTo(mx-mw+2,my+16,mx-4,my+40);ctx.lineTo(mx,my+46);ctx.lineTo(mx+4,my+40);ctx.quadraticCurveTo(mx+mw-2,my+16,mx+mw+2,my+2);
   ctx.quadraticCurveTo(mx,my+12,mx-mw-2,my+2);ctx.closePath();finish();
   ctx.beginPath();ctx.moveTo(mx-mw,my-7);ctx.quadraticCurveTo(mx,my-13,mx+mw,my-7);ctx.quadraticCurveTo(mx,my-9,mx-mw,my-7);ctx.closePath();finish();
  }else if(paint==='soul'){
   ctx.ellipse(mx,my+13,5,6.5,0,0,TAU);finish();
  }else if(paint==='strip'){
   ctx.lineWidth=8;ctx.strokeStyle=col;ctx.moveTo(24,L.eyeY+6);ctx.quadraticCurveTo(40,chin-2,128,chin);ctx.quadraticCurveTo(216,chin-2,232,L.eyeY+6);ctx.stroke();
  }
  ctx.restore();
 }
 if(mous!=='none'){
  // Moustaches sit low, their lower edge over the top lip, and half again as wide as they were (the creator's review).
  const y=my-5.5,n=parseInt(col.slice(1),16),light=(.3*(n>>16)+.59*(n>>8&255)+.11*(n&255))/255>.5;
  if(light){ctx.strokeStyle=shade(col,.45);ctx.lineWidth=1.8;}   // light hair (grey, blonde) keeps a darker edge
  ctx.save();ctx.translate(mx,y+DY);ctx.scale(S*wk*1.8,S*1.2);ctx.translate(-128,-y);ctx.beginPath();
  if(mous==='chevron'){ctx.moveTo(104,y+5);ctx.lineTo(128,y-7);ctx.lineTo(152,y+5);ctx.lineTo(147,y+9);ctx.lineTo(128,y);ctx.lineTo(109,y+9);ctx.closePath();finish();}
  else if(mous==='toothbrush'){ctx.moveTo(120,y-5);ctx.lineTo(136,y-5);ctx.lineTo(137,y+5);ctx.lineTo(119,y+5);ctx.closePath();finish();}
  else if(mous==='horseshoe'){
   // Full, with square-cut ends that run down past the mouth toward the jaw.
   const d=34;ctx.moveTo(105,y+1);ctx.quadraticCurveTo(128,y-13,151,y+1);ctx.lineTo(152,y+d);ctx.lineTo(143,y+d);ctx.lineTo(142.5,y+7);ctx.quadraticCurveTo(128,y,113.5,y+7);ctx.lineTo(113,y+d);ctx.lineTo(104,y+d);ctx.closePath();finish();}
  else if(mous==='fumanchu'){
   // Thick at the lip, tapering to fine points that hang down past the chin.
   for(const s of [-1,1]){const o=x=>128+s*x;ctx.moveTo(o(1.5),y-4);ctx.quadraticCurveTo(o(13),y-6,o(19),y+1);ctx.quadraticCurveTo(o(22),y+20,o(18),y+46);
    ctx.quadraticCurveTo(o(15),y+22,o(12),y+5);ctx.quadraticCurveTo(o(7),y+1,o(1.5),y+2);ctx.closePath();}
   finish();}
  else if(mous==='brush'){ctx.moveTo(102,y+4);ctx.quadraticCurveTo(128,y-14,154,y+4);for(let i=0;i<=8;i++){const x=154-i*6.5;ctx.lineTo(x,y+(i%2?5:9));}ctx.closePath();finish();}
  else if(mous==='curled'){
   // A full body over the lip whose ends roll up into curls.
   for(const s of [-1,1]){const o=x=>128+s*x;ctx.moveTo(o(0),y-4);ctx.quadraticCurveTo(o(13),y-8,o(21),y-1);ctx.quadraticCurveTo(o(27),y+2,o(30),y-4);
    ctx.quadraticCurveTo(o(31),y-11,o(26),y-11);ctx.quadraticCurveTo(o(23),y-10,o(24),y-7);ctx.quadraticCurveTo(o(27),y-6,o(26),y-3);ctx.quadraticCurveTo(o(21),y+5,o(12),y+4);ctx.quadraticCurveTo(o(5),y+3,o(0),y+3);ctx.closePath();}
   finish();}
  ctx.restore();
 }
 ctx.restore();
}
/**
 * The scruffy beard: a shadow of hair painted on its own shell round the lower head (build.js beardShell), sideburn to
 * sideburn and down to the chin's outline, which the face's canvas cannot reach. (Every other beard is built: beard-mesh.js.)
 * The shell's canvas is drawn in degrees: x is the angle round from the front (a, ±BEARD_SHELL.A, + toward the avatar's left
 * as on the face), y the angle down from the crown (θ, from BEARD_SHELL.T0 to the chin's point at 180). Seen from the front
 * the face's outline is a = ±90 and the chin's is θ = 180. The mouth is left open for every mouth the face makes.
 */
export const BEARD_SHELL=Object.freeze({A:100,T0:68});
export function drawBeardShell(ctx,recipe,state={}){
 const {A,T0}=BEARD_SHELL,W=ctx.canvas.width,H=ctx.canvas.height;
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
 if(recipe.facial.paint!=='scruff')return;
 const L=faceLayout(recipe),mood=MOOD[state.expression]||MOOD.neutral;
 // Face-canvas units to degrees: the face's canvas spans 1.9 rad across and .58π down, from θ = .28π.
 const DX=1.9/256*180/Math.PI,DYD=.58*180/256,T=fy=>50.4+fy*DYD;
 const aM=(L.mouthX-128)*DX,tM=T(L.mouthY+(mood.mouthDY||0)),tN=T(L.noseY),aw=14*L.mouthS*L.mouthW*DX;
 const open=state.talk>.5||['grin','laugh','o','jawdrop','wail','shout','gasp'].includes(mood.mouth);
 ctx.setTransform(W/(2*A),0,0,H/(180-T0),W/2,-T0*H/(180-T0));ctx.fillStyle=recipe.facial.colour||'#1c1714';
 ctx.beginPath();
 // Down the sideburns, across the cheeks to the mouth's corners, and down to the chin's outline; the mouth left open.
 const cheek=s=>{ctx.lineTo(s*66,85);ctx.lineTo(s*70,tN-2);ctx.quadraticCurveTo(s*64,tN+6,s*46,tN+6);ctx.quadraticCurveTo(aM+s*(aw+9),tN+7,aM+s*(aw+1.5),tM-2.2);};
 ctx.moveTo(-91,84);cheek(-1);ctx.lineTo(aM+aw+1.5,tM-2.2);
 ctx.quadraticCurveTo(aM+aw+9,tN+7,46,tN+6);ctx.quadraticCurveTo(64,tN+6,70,tN-2);ctx.lineTo(66,85);ctx.lineTo(91,84);
 ctx.lineTo(97,112);ctx.lineTo(99,150);ctx.lineTo(A,180);ctx.lineTo(-A,180);ctx.lineTo(-99,150);ctx.lineTo(-97,112);ctx.closePath();
 const x0=aM-aw-2.4,x1=aM+aw+2.4;ctx.moveTo(x0,tM);ctx.quadraticCurveTo(aM,tM-5.8,x1,tM);ctx.quadraticCurveTo(aM,tM+(open?13:8.2),x0,tM);ctx.closePath();
 // A shadow of hair rather than a shape: see-through, speckled, no edge.
 ctx.save();ctx.clip('evenodd');ctx.globalAlpha=.3;ctx.fillRect(-A,T0,2*A,180-T0);ctx.globalAlpha=.55;
 let h=2166136261;const rnd=()=>{h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);return ((h^=h>>>16)>>>0)/4294967296;};
 for(let i=0;i<1400;i++){const x=-A+rnd()*2*A,y=T0+rnd()*(180-T0);ctx.fillRect(x,y,.55,.55);}
 ctx.restore();ctx.setTransform(1,0,0,1,0,0);
}
function facialParts(facial){
 if(facial.moustache!==undefined||facial.beard!==undefined)return {moustache:facial.moustache||'none',beard:facial.beard||'none'};
 return {moustache:MOUSTACHES.includes(facial.style)?facial.style:'none',beard:facial.style&&facial.style!=='none'&&!MOUSTACHES.includes(facial.style)?facial.style:'none'};
}
function drawFacialHair(ctx,L,facial){
 const {moustache,beard}=facialParts(facial);
 if(moustache==='none'&&beard==='none')return;
 const S=L.facialS??1,DY=L.facialDY??0;
 ctx.save();ctx.fillStyle=facial.colour;ctx.strokeStyle=facial.colour;ctx.lineCap='round';
 // The beard first, sized about the mouth and moved with the moustache, which sits over it.
 if(beard!=='none'){
  ctx.save();ctx.translate(128,L.mouthY+DY*.5);ctx.scale(S,S);ctx.translate(-128,-L.mouthY);
  if(beard==='stubble'){ctx.globalAlpha=.35;for(let i=0;i<140;i++){const a=Math.PI*(.1+.8*(i%47)/46),r=46+(i*7%11);const x=128+Math.cos(a)*r*.95,yy=L.mouthY-26+Math.sin(a)*r*.8;if(yy>L.noseY+8){ctx.fillRect(x,yy,1.6,1.6);}}ctx.globalAlpha=1;}
  else if(beard==='beard'){ctx.beginPath();ctx.moveTo(84,L.noseY);ctx.quadraticCurveTo(90,L.mouthY+40,128,L.mouthY+42);ctx.quadraticCurveTo(166,L.mouthY+40,172,L.noseY);ctx.lineTo(160,L.noseY+4);ctx.quadraticCurveTo(150,L.mouthY+18,128,L.mouthY+16);ctx.quadraticCurveTo(106,L.mouthY+18,96,L.noseY+4);ctx.closePath();ctx.fill();}
  else if(beard==='goatee'){ctx.beginPath();ctx.ellipse(128,L.mouthY+18,9,11,0,0,TAU);ctx.fill();}
  else if(beard==='chinstrap'){ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(86,L.noseY+2);ctx.quadraticCurveTo(92,L.mouthY+38,128,L.mouthY+40);ctx.quadraticCurveTo(164,L.mouthY+38,170,L.noseY+2);ctx.stroke();}
  ctx.restore();
 }
 if(moustache!=='none'){
  const y=(L.noseY+L.mouthY)/2+2;
  ctx.save();ctx.translate(128,y+DY);ctx.scale(S,S);ctx.translate(-128,-y);
  if(moustache==='moustache'||moustache==='handlebar'){ctx.beginPath();ctx.moveTo(128,y-3);ctx.quadraticCurveTo(114,y-6,108,y+3);ctx.quadraticCurveTo(118,y+1,128,y+2);ctx.quadraticCurveTo(138,y+1,148,y+3);ctx.quadraticCurveTo(142,y-6,128,y-3);ctx.fill();}
  // A handlebar's ends curl up and round.
  if(moustache==='handlebar'){ctx.lineWidth=3;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(128+s*19,y+2);ctx.quadraticCurveTo(128+s*28,y+2,128+s*27,y-6);ctx.quadraticCurveTo(128+s*25,y-9,128+s*23,y-6);ctx.stroke();}}
  else if(moustache==='walrus'){ctx.beginPath();ctx.ellipse(128,y+1,24,8,0,0,TAU);ctx.fill();}
  else if(moustache==='pencil'){ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(113,y+1);ctx.quadraticCurveTo(128,y-3,143,y+1);ctx.stroke();}
  ctx.restore();
 }
 ctx.restore();
}

function drawGlasses(ctx,L,glasses){
 if(glasses.enabled===false)return;
 if(glasses.style==='none')return;
 ctx.save();ctx.strokeStyle=glasses.colour;ctx.lineWidth=3.2;
 const r=(15*L.eyeS+2)*(L.glassS??1),y=L.glassY??L.eyeY,rx=r*L.eyeW;
 for(const s of [-1,1]){
  const x=128+s*L.spread;ctx.beginPath();
  if(glasses.style==='round')ctx.ellipse(x,y,rx,r,0,0,TAU);
  else if(glasses.style==='half')ctx.ellipse(x,y-2,rx,r,0,Math.PI*.05,Math.PI*.95);
  else if(ctx.roundRect)ctx.roundRect(x-rx*1.1,y-r*.8,rx*2.2,r*1.6,6);else ctx.rect(x-rx*1.1,y-r*.8,rx*2.2,r*1.6);
  if(glasses.style==='sun'){ctx.fillStyle='rgba(30,34,40,.9)';ctx.fill();}
  ctx.stroke();
  if(glasses.style!=='sun'){ctx.save();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+r*.3,y-r*.55);ctx.lineTo(x+r*.6,y-r*.25);ctx.stroke();ctx.restore();}
 }
 ctx.beginPath();ctx.moveTo(128-L.spread+rx*(glasses.style==='round'||glasses.style==='half'?1:1.1),y-2);ctx.quadraticCurveTo(128,y-8,128+L.spread-rx*(glasses.style==='round'||glasses.style==='half'?1:1.1),y-2);ctx.stroke();
 ctx.restore();
}

/**
 * One feature on its own, centred and enlarged on a skin-coloured tile: the pictures in
 * the maker's part grids. Drawn with the same painters as the face, so a part looks in
 * the grid exactly as it will on the head.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} recipe normalized
 * @param {'eyes'|'brows'|'nose'|'mouth'|'glasses'|'facial'|'moustache'|'beard'} part
 * @param {number} [size] canvas size in pixels
 */
export function drawPart(ctx,recipe,part,size=ctx.canvas.width){
 const skin=recipe.body.skin,line='#2b2623';
 // A neutral layout, so every tile in a grid is framed alike whatever the sliders say.
 const flat={...recipe,eyes:{...recipe.eyes,height:.5,spacing:.5,size:.5,tilt:.5},brows:{...recipe.brows,height:.5,spacing:.5,size:.5,tilt:.5},
  nose:{...recipe.nose,height:.5,x:.5,size:.5},mouth:{...recipe.mouth,height:.5,x:.5,size:.5,width:.5},
  glasses:{...recipe.glasses,size:.5,height:.5},facial:{...recipe.facial,size:.5,height:.5}};
 // The moustache and beard grids each show their own half alone.
 const fp=facialParts(recipe.facial);
 const facial=part==='moustache'?{...flat.facial,moustache:fp.moustache,beard:'none'}:part==='beard'?{...flat.facial,moustache:'none',beard:fp.beard}:flat.facial;
 const shown=part==='moustache'?fp.moustache:part==='beard'?fp.beard:facial.beard!=='none'?facial.beard:fp.moustache;
 const L=faceLayout(flat);
 const focus={eyes:[128,L.eyeY,1.75],glasses:[128,L.eyeY,1.6],brows:[128,L.browY,2],nose:[128,L.noseY,3.4],mouth:[128,L.mouthY+2,2.7],facial:[128,(L.noseY+L.mouthY)/2+(['beard','chinstrap'].includes(shown)?18:shown==='goatee'?14:2),['beard','chinstrap'].includes(shown)?1.5:2.2]}[part==='moustache'||part==='beard'?'facial':part]||[128,128,1];
 const k=size/256;
 ctx.save();ctx.setTransform(k,0,0,k,0,0);
 ctx.canvas.__skin=skin;ctx.fillStyle=skin;ctx.fillRect(0,0,256,256);
 ctx.translate(128,128);ctx.scale(focus[2],focus[2]);ctx.translate(-focus[0],-focus[1]);
 ctx.lineCap='round';ctx.lineJoin='round';
 if(part==='eyes'||part==='glasses')for(const s of [-1,1])drawEye(ctx,128+s*L.spread,L.eyeY,L.eyeS,s,flat.eyes,'open',[0,0],L.eyeTilt,L.eyeW);
 if(part==='brows'&&recipe.brows.style!=='none')for(const s of [-1,1])drawBrow(ctx,128+s*L.browSpread,L.browY,L.browS,s,flat.brows,L.browTilt,0);
 if(part==='nose')drawNose(ctx,L.noseX,L.noseY,L.noseS,recipe.nose.style,skin,line);
 if(part==='mouth')drawMouth(ctx,L.mouthX,L.mouthY,L.mouthS,flat.mouth,null,0,line,L.mouthW);
 if(part==='facial'||part==='moustache'||part==='beard'||part==='paint'){drawFacialPaint(ctx,L,part==='paint'?{...facial,moustache:'none'}:part==='moustache'?{...facial,paint:'none'}:part==='beard'?{...facial,paint:'none'}:facial);drawMouth(ctx,L.mouthX,L.mouthY,L.mouthS,{...flat.mouth,style:'flat'},null,0,'rgba(43,38,35,.35)',L.mouthW);drawFacialHair(ctx,L,facial);}
 if(part==='glasses')drawGlasses(ctx,L,flat.glasses);
 ctx.restore();
 // "None" reads as an empty tile with a soft slash, the way a blank slot should.
 const empty=(part==='brows'&&recipe.brows.style==='none')||(part==='nose'&&recipe.nose.style==='none')||(part==='glasses'&&recipe.glasses.style==='none')||(['facial','moustache','beard'].includes(part)&&shown==='none');
 if(empty){ctx.save();ctx.strokeStyle='rgba(43,38,35,.25)';ctx.lineWidth=size*.04;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(size*.3,size*.7);ctx.lineTo(size*.7,size*.3);ctx.stroke();ctx.restore();}
}
