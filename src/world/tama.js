import * as THREE from '../../vendor/three.module.js';
import {groundHeight} from './layout.js';
/**
 * Tama, the cat from the quay (the owner, 27 November 2026: "I think you can make the cat"). The storyteller has told of
 * her for a while (feed/evening-news.js: she left the market with a whole squid; feed/places.js); now she lives there.
 *
 * A mike-neko (三毛猫), white with a ginger and a black patch, the cat every Japanese harbour has. Nobody owns her; the
 * fish market feeds her. Her day follows the quay's (nothing random): she waits at the fish counter while Kōji sells, sleeps
 * in the sun on the warm quay once the market is washed down, watches the boats come in from beside the bollard where
 * their lines are made fast, and sleeps under the auction's roof at night, out of the dew and the rain.
 *
 * Drawn in the World's look (the owner, 25 November 2026: the Kikkou style): one plain coloured body, flat cel bands from
 * the town's cel pass and its even ink line round her. Her patches are colours on the one body, never a second surface on
 * it (no z-fighting). She moves to the animation standard (docs/ANIMATION-STANDARD.md): her paws step where the stride
 * puts them (they do not slide), she eases into and out of every pose, stretches before she walks off (anticipation), and
 * her tail and head follow the body a beat late (overlap and follow-through).
 */

/** Her places on the quay, in town coordinates, measured clear of every fitting there (tests/tama.test.mjs). */
export const TAMA_SPOTS=Object.freeze({
 counter:Object.freeze({x:24.4,z:-39.85,yaw:-Math.PI*.62,pose:'sit',
  why:'Waits beside the fish counter, out of the customers’ way, for the scrap Kōji keeps for her: the market has fed her since she was a kitten.'}),
 sun:Object.freeze({x:31.0,z:-48.4,yaw:Math.PI*.15,pose:'sleep',
  why:'Asleep on the quay between the auction and the ice plant once the market is washed down: the concrete is warm, the sun is on it, and the forklift does not come this way.'}),
 boats:Object.freeze({x:38.6,z:-48.8,yaw:Math.PI,pose:'sit',
  why:'Watches the boats come in from beside the bollard where their lines are made fast: the afternoon boats bring the next day’s scraps.'}),
 roof:Object.freeze({x:24.5,z:-46.2,yaw:Math.PI*.5,pose:'sleep',
  why:'Curled up at night under the auction’s roof, between its columns and away from the tables, out of the dew and the rain.'}),
});

/** Her day: where she is from each town minute (06:30 the counter, 09:30 the sun, 15:30 the boats, 19:00 the roof). */
export const TAMA_DAY=Object.freeze([
 Object.freeze({from:6*60+30,spot:'counter'}),Object.freeze({from:9*60+30,spot:'sun'}),
 Object.freeze({from:15*60+30,spot:'boats'}),Object.freeze({from:19*60,spot:'roof'}),
]);

/** The ways between her places, along the open quay: round the auction's tables, past the ice plant's corner. */
export const TAMA_ROUTES=Object.freeze({
 'roof>counter':[[24.5,-46.2],[24.5,-48.3],[30.4,-48.3],[30.4,-39.7],[24.4,-39.85]],
 'counter>sun':[[24.4,-39.85],[30.4,-39.7],[30.4,-48.4],[31.0,-48.4]],
 'sun>boats':[[31.0,-48.4],[38.6,-48.8]],
 'boats>roof':[[38.6,-48.8],[24.5,-48.3],[24.5,-46.2]],
});

export const TAMA_GAIT=Object.freeze({speed:.55,stride:.24,turn:3.2,settle:.7,stretch:.9});

/** Where her day puts her at a town minute. */
export function tamaSpotAt(minutes){
 const m=((minutes%1440)+1440)%1440;let spot=TAMA_DAY[TAMA_DAY.length-1].spot;
 for(const d of TAMA_DAY)if(m>=d.from)spot=d.spot;
 return spot;
}

/** A leg's length at rest, hip to paw: it stretches or shortens to put the paw on the quay (squash and stretch). */
const LEG=.198;
const smooth=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
const lerp=(a,b,t)=>a+(b-a)*t;
const wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};

/** Her body's poses: how high the body stands, how far its front lifts, the legs' fold, the head's dip, the tail's curl. */
const POSES=Object.freeze({
 // height: the hips over the quay; pitch: the body's tilt (negative lifts her front); front, hind: the legs' angle forward
 // of upright in the world; head: the head's dip; tail: its root's droop (negative raises it); tailCurl: how far it wraps.
 walk:Object.freeze({height:.21,pitch:0,front:0,hind:0,head:.05,tail:-.9,tailCurl:.1,lie:0}),
 sit:Object.freeze({height:.107,pitch:-.45,front:.08,hind:.75,head:0,tail:.6,tailCurl:.35,lie:0}),
 sleep:Object.freeze({height:.09,pitch:0,front:1.3,hind:1.2,head:.9,tail:.4,tailCurl:.55,lie:1}),
 stretch:Object.freeze({height:.17,pitch:.32,front:.6,hind:-.25,head:-.2,tail:-.5,tailCurl:.05,lie:0}),
});
const blend=(a,b,t)=>Object.fromEntries(Object.keys(a).map(k=>[k,lerp(a[k],b[k],t)]));

function buildCat(){
 const root=new THREE.Group();root.name='Tama, the cat from the quay';root.userData.dynamicProp=true;
 const WHITE=new THREE.Color(0xf4efe4),GINGER=new THREE.Color(0xd9893f),BLACK=new THREE.Color(0x2b2622),PINK=new THREE.Color(0xe7a7a0);
 // One colour a point, from where it lies on her (her patches: ginger over the left shoulder and back, black on the right
 // haunch and her right ear, as a mike-neko's are).
 const paint=(geometry,at)=>{const p=geometry.attributes.position,c=new Float32Array(p.count*3),v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);at(v).toArray(c,i*3);}geometry.setAttribute('color',new THREE.BufferAttribute(c,3));return geometry;};
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});material.name='Tama';
 const mesh=(geometry,name)=>{const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=true;m.receiveShadow=true;return m;};
 const hips=new THREE.Group();hips.name='Tama hips';root.add(hips);
 // The body, from the hips forward: a long rounded loaf, its back patched.
 const torsoG=paint(new THREE.SphereGeometry(1,20,14).scale(.105,.1,.215).translate(0,.01,.15),v=>
  v.x>.02&&v.z>.12&&v.y>-.01?GINGER:v.x<-.03&&v.z<.12&&v.y>-.02?BLACK:WHITE);
 const torso=mesh(torsoG,'Tama body');hips.add(torso);
 // The shoulders: the head and front legs hang from them, so the front of her lifts as one when she sits.
 const shoulders=new THREE.Group();shoulders.position.set(0,.01,.3);hips.add(shoulders);
 const neck=new THREE.Group();neck.position.set(0,.06,.03);shoulders.add(neck);
 const head=new THREE.Group();head.position.set(0,.07,.04);neck.add(head);
 head.add(mesh(paint(new THREE.SphereGeometry(.082,18,14).scale(1.08,.94,1),v=>v.x>.03&&v.y>.0?GINGER:WHITE),'Tama head'));
 head.add(mesh(paint(new THREE.SphereGeometry(.04,12,10).scale(1.15,.8,.9).translate(0,-.03,.065),()=>WHITE),'Tama muzzle'));
 head.add(mesh(paint(new THREE.SphereGeometry(.011,8,6).translate(0,-.012,.098),()=>PINK),'Tama nose'));
 for(const s of [-1,1]){
  // The ears: a little cone each, its foot sunk into the head (no face shared with it).
  const ear=mesh(paint(new THREE.ConeGeometry(.032,.062,10).translate(0,.031,0),()=>s<0?BLACK:GINGER),'Tama ear');
  ear.position.set(s*.048,.058,.0);ear.rotation.set(-.15,0,-s*.32);ear.userData.side=s;head.add(ear);
  // The eyes: dark beads set into the face, closed to slits when she sleeps (scaled flat, not hidden).
  const eye=mesh(paint(new THREE.SphereGeometry(.012,10,8),()=>BLACK),'Tama eye');eye.position.set(s*.032,.012,.07);head.add(eye);
 }
 const legs=[];
 const leg=(x,y,z,front,name)=>{const pivot=new THREE.Group();pivot.position.set(x,y,z);
  const g=paint(new THREE.CapsuleGeometry(.024,LEG-.048,4,10).translate(0,-LEG/2,0),v=>v.y<-.16?WHITE:front||x>0?WHITE:BLACK);
  const m=mesh(g,name);pivot.add(m);legs.push({pivot,front,side:Math.sign(x)});return pivot;};
 shoulders.add(leg(-.055,-.02,0,true,'Tama front leg'),leg(.055,-.02,0,true,'Tama front leg'));
 hips.add(leg(-.06,-.01,.0,false,'Tama hind leg'),leg(.06,-.01,.0,false,'Tama hind leg'));
 // The tail: seven links, each turned from the last, so it bends along its length and its tip comes a beat behind.
 const tail=[];let parent=hips;
 for(let i=0;i<7;i++){const link=new THREE.Group();link.position.set(0,i?0:.03,i?-.05:-.06);parent.add(link);
  const r=.02-i*.0012;link.add(mesh(paint(new THREE.CapsuleGeometry(r,.035,3,8).rotateX(Math.PI/2).translate(0,0,-.025),()=>i>=5?BLACK:i>=2?GINGER:WHITE),'Tama tail'));
  tail.push(link);parent=link;}
 return {root,hips,torso,shoulders,neck,head,legs,tail,ears:head.children.filter(o=>o.userData.side),eyes:head.children.filter(o=>o.name==='Tama eye'),material};
}


/**
 * The Blåhaj look (the owner, 27 November 2026, of kuraneko1.github.io/blahaj-kikkou-3d: "I want the same style as the
 * shark"): her 3D body is drawn small, into a picture of its own 72 dots square, in the town's three flat tones, 24 times a
 * second as the shark is; the picture stands in the town facing the camera, its dots shown square and an ink line one dot
 * wide drawn round her outline. The body itself is on a layer of its own that only that picture's camera sees.
 */
export const TAMA_SPRITE=Object.freeze({dots:72,span:.84,fps:24,layer:30,ink:0x231d2b,forward:.45});
function pixelSprite(cat){
 const S=TAMA_SPRITE,target=new THREE.WebGLRenderTarget(S.dots,S.dots,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,generateMipmaps:false,depthBuffer:true});
 const lens=new THREE.OrthographicCamera(-S.span/2,S.span/2,S.span/2,-S.span/2,.05,8);lens.layers.set(S.layer);
 cat.root.traverse(o=>o.layers.set(S.layer));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:true,
  uniforms:{map:{value:target.texture},texel:{value:1/S.dots},ink:{value:new THREE.Color(S.ink)}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D map;uniform float texel;uniform vec3 ink;varying vec2 vUv;
   void main(){vec2 at=(floor(vUv/texel)+.5)*texel;vec4 c=texture2D(map,at);
    if(c.a<.5){float n=max(max(texture2D(map,at+vec2(texel,0.)).a,texture2D(map,at-vec2(texel,0.)).a),max(texture2D(map,at+vec2(0.,texel)).a,texture2D(map,at-vec2(0.,texel)).a));
     if(n<.5)discard;gl_FragColor=vec4(ink,1.);}else gl_FragColor=vec4(c.rgb,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 const card=new THREE.Mesh(new THREE.PlaneGeometry(S.span,S.span),material);card.name='Tama, drawn';card.frustumCulled=false;
 // (her own ink: the town's line is not drawn round the card)
 card.userData.outline=true;card.userData.dynamicProp=true;
 const centre=new THREE.Vector3(),look=new THREE.Vector3();let drawn=-1,lit=null;
 card.onBeforeRender=(renderer,scene,camera)=>{
  centre.set(0,.2,0).applyMatrix4(cat.root.matrixWorld);camera.getWorldDirection(look);
  // The card stands a little in front of her, toward the camera, so the quay under her paws does not cut it.
  const toward=Math.min(S.forward,camera.position.distanceTo(centre)*.5),d=camera.position.distanceTo(centre);
  card.position.copy(centre).addScaledVector(look,-toward);card.quaternion.copy(camera.quaternion);
  card.scale.setScalar((d-toward)/d);card.updateMatrixWorld(true);
  if(scene.overrideMaterial)return;
  const now=performance.now()/1000;if(now-drawn<1/S.fps)return;drawn=now;
  // The town's lights light her: they are let onto her layer once.
  if(lit!==scene){scene.traverse(o=>{if(o.isLight)o.layers.enable(S.layer);});lit=scene;}
  lens.position.copy(centre).addScaledVector(look,-3);lens.quaternion.copy(camera.quaternion);lens.updateMatrixWorld(true);
  const previous=renderer.getRenderTarget(),clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha(),bg=scene.background,fog=scene.fog,
   shadows=renderer.shadowMap.autoUpdate,auto=renderer.autoClear;
  try{scene.background=null;scene.fog=null;renderer.shadowMap.autoUpdate=false;renderer.autoClear=true;
   renderer.setRenderTarget(target);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(scene,lens);}
  finally{renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);scene.background=bg;scene.fog=fog;renderer.shadowMap.autoUpdate=shadows;renderer.autoClear=auto;}
 };
 return {card,target,lens};
}
/**
 * Tama in the town. `tick(dt, time, minutes)` each frame: where her day says she should be; if she is somewhere else she
 * stretches, walks there along her way and settles. A jump of the clock (a load, a catch-up) puts her where she would be.
 */
export function buildTama(world,{register,onAction}={}){
 const cat=buildCat();world.group.add(cat.root);
 const drawn=pixelSprite(cat);world.group.add(drawn.card);
 // Her shadow on the quay, as the shark has its own: a soft oval a few millimetres over the ground, drawn behind
 // everything at that depth (a polygon offset), never in the town's line.
 const shade=new THREE.Mesh(new THREE.CircleGeometry(1,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x1d2233,transparent:true,opacity:.28,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
 shade.name='Tama’s shadow';shade.userData.outline=true;shade.userData.dynamicProp=true;world.group.add(shade);
 const state={spot:null,route:null,leg:0,along:0,mode:'settled',since:0,yaw:0,x:0,z:0,stride:0,pose:{...POSES.sit},from:null,to:'sit',blend:1,tailSwing:new Array(7).fill(0),y:null};
 const place=spot=>{const s=TAMA_SPOTS[spot];Object.assign(state,{spot,route:null,mode:'settled',x:s.x,z:s.z,yaw:s.yaw,from:null,to:s.pose,blend:1});state.pose={...POSES[s.pose]};};
 const startWalk=spot=>{const route=TAMA_ROUTES[`${state.spot}>${spot}`];if(!route){place(spot);return;}
  Object.assign(state,{route:{to:spot,points:route},leg:0,along:0,mode:'stretch',since:0,from:{...state.pose},to:'stretch',blend:0});};
 register?.(cat.root,'Look at Tama',()=>onAction?.('inspect','Tama, the cat from the quay',
  `${TAMA_SPOTS[state.spot]?.why??'Tama is on her way across the quay.'} She is a mike-neko: white, with a ginger patch and a black one. Nobody owns her; the whole quay feeds her.`));

 function tick(dt,time,minutes){
  const want=tamaSpotAt(minutes??0),jump=state.minutes!=null&&Math.abs(wrap(((minutes??0)-state.minutes)/1440*Math.PI*2))/(Math.PI*2)*1440>5;
  state.minutes=minutes??0;
  // A jump of the clock (a load, a catch-up, the clock set) puts her where her day would have taken her by then.
  if(state.spot===null||dt>2||jump){place(want);return pose(time,0);}
  dt=Math.min(dt,.1);state.since+=dt;
  if(state.mode==='settled'&&want!==state.spot)startWalk(want);
  if(state.mode==='stretch'){
   // The stretch before she goes (anticipation): front paws forward, rump up, then off.
   state.blend=Math.min(1,state.blend+dt/(TAMA_GAIT.stretch*.5));
   if(state.since>=TAMA_GAIT.stretch){Object.assign(state,{mode:'walk',since:0,from:{...state.pose},to:'walk',blend:0});}
  }else if(state.mode==='walk'){
   state.blend=Math.min(1,state.blend+dt/.35);
   const pts=state.route.points;let step=TAMA_GAIT.speed*dt*smooth(Math.min(1,state.since/.4));
   while(step>0&&state.leg<pts.length-1){
    const [ax,az]=pts[state.leg],[bx,bz]=pts[state.leg+1],len=Math.hypot(bx-ax,bz-az),left=len-state.along,go=Math.min(step,left);
    state.along+=go;step-=go;state.stride+=go;
    const t=state.along/len;state.x=lerp(ax,bx,t);state.z=lerp(az,bz,t);
    const heading=Math.atan2(bx-ax,bz-az);state.yaw+=Math.max(-TAMA_GAIT.turn*dt,Math.min(TAMA_GAIT.turn*dt,wrap(heading-state.yaw)));
    if(state.along>=len-1e-6){state.leg++;state.along=0;}
   }
   if(state.leg>=pts.length-1){const s=TAMA_SPOTS[state.route.to];
    Object.assign(state,{spot:state.route.to,route:null,mode:'settling',since:0,from:{...state.pose},to:s.pose,blend:0});}
  }else if(state.mode==='settling'){
   const s=TAMA_SPOTS[state.spot];state.yaw+=Math.max(-TAMA_GAIT.turn*.5*dt,Math.min(TAMA_GAIT.turn*.5*dt,wrap(s.yaw-state.yaw)));
   state.blend=Math.min(1,state.blend+dt/TAMA_GAIT.settle);
   if(state.blend>=1&&Math.abs(wrap(s.yaw-state.yaw))<.01){state.yaw=state.yaw+wrap(s.yaw-state.yaw);state.mode='settled';}
  }
  if(state.from)state.pose=blend(state.from,POSES[state.to],smooth(state.blend));
  return pose(time,dt);
 }

 const P=new THREE.Vector3(),D=new THREE.Vector3(),E=new THREE.Vector3();
 function pose(time,dt){
  const p=state.pose,walking=state.mode==='walk';
  // How much she is walking, eased in and out over a third of a second: arriving, her stride settles, it does not stop dead.
  state.walkW=Math.max(0,Math.min(1,(state.walkW??0)+(walking?1:-1)*(dt||0)/.33));
  const w=smooth(state.walkW);
  // On the town's ground (the market's floor stands a step above the quay): she hops a step up or down, the height eased
  // over a fifth of a second on an arc, never jumped.
  const ground=groundHeight(state.x,state.z);
  if(state.y===null||!dt)state.y=ground;else state.y+=(ground-state.y)*Math.min(1,dt*10);
  const hop=Math.min(.06,Math.abs(ground-state.y)*.8);
  cat.root.position.set(state.x,state.y+hop,state.z);cat.root.rotation.y=state.yaw;
  shade.position.set(state.x,state.y+.004,state.z);shade.rotation.y=state.yaw;shade.scale.set(.13+.03*p.lie,1,.24-.04*(p.pitch<-.2?1:0));
  // The stride: one cycle per two strides walked, so a paw stays put on the quay while the body passes over it.
  const phase=state.stride/TAMA_GAIT.stride*Math.PI,amp=.5*w;
  const bob=Math.abs(Math.sin(phase))*.006*w;
  const breathe=Math.sin(time*(p.lie>.5?1.6:2.4))*(p.lie>.5?.012:.008);
  cat.hips.position.set(0,p.height+bob,0);cat.hips.rotation.x=p.pitch;
  cat.torso.scale.set(1+breathe,1+breathe,1);
  cat.shoulders.rotation.x=-p.pitch*.15;
  // Asleep, her head comes down onto her front paws.
  cat.neck.position.set(0,.06-.075*p.lie,.03+.04*p.lie);
  cat.neck.rotation.x=-p.pitch*.85+p.head*.5;
  cat.head.rotation.x=p.head*.5-bob*3;
  cat.root.updateMatrixWorld(true);
  // The legs: each at its pose's angle (diagonal pairs swinging as she walks), long enough to put its paw on the quay,
  // lifted only while it swings forward; folded short under her when she lies down.
  for(const l of cat.legs){const opposite=(l.front?1:-1)*l.side>0?0:Math.PI,pitch=l.front?p.pitch*.85:p.pitch;
   l.pivot.rotation.x=-pitch-(l.front?p.front:p.hind)+Math.sin(phase+opposite)*amp;
   l.pivot.rotation.z=l.side*p.lie*.2;l.pivot.scale.y=1;l.pivot.updateMatrixWorld(true);
   l.pivot.getWorldPosition(P);D.set(0,-1,0).transformDirection(l.pivot.matrixWorld);
   const lift=Math.max(0,Math.cos(phase+opposite))*.03*w;
   const reach=D.y<-.25?(P.y-state.y-lift)/-D.y:LEG*.55;
   l.pivot.scale.y=THREE.MathUtils.clamp(lerp(reach,LEG*.55,p.lie)/LEG,.5,1.45);}
  // Her ears flick now and then (every 6.5 s and 9 s, staggered), never both at once.
  for(const e of cat.ears){const s=e.userData.side,period=s<0?6.5:9,t=((time+(s<0?0:3.1))%period)/period;
   e.rotation.z=-s*.32+(t<.06?Math.sin(t/.06*Math.PI)*.45*s:0);}
  // Asleep, her eyes close to slits; awake she blinks slowly, as a content cat does at people she trusts.
  const blinkT=(time%7.3)/7.3,open=p.lie>.5?.15:blinkT>.95?.25+.75*Math.abs(Math.cos((blinkT-.95)/.05*Math.PI)):1;
  for(const e of cat.eyes)e.scale.set(1,open,1);
  // The tail: each link turned from the last; the swing travels down it, so its tip comes after its root (overlap). A
  // link that would go into the quay is lifted until it lies on it.
  // (its swing's speed and size, and its curl, change with the pose by degrees: a phase of its own, never a jump)
  const sway=lerp(lerp(.14,.06,p.lie),.25,w),down=smooth((p.tail+.2)/.4);
  state.tailPhase=(state.tailPhase??0)+dt*lerp(1.1,2.2,w);
  cat.tail.forEach((link,i)=>{
   link.rotation.x=i?lerp(p.tailCurl*.3,-p.tailCurl*.35,down):-p.tail;
   link.rotation.y=Math.sin(state.tailPhase-i*.55)*sway*(i/6+.2)+down*p.tailCurl*.5;
   link.updateMatrixWorld(true);const r=state.y+.02-i*.0012+.003;
   const endY=()=>{link.updateMatrixWorld(true);return E.set(0,0,-.05).applyMatrix4(link.matrixWorld).y;};
   if(endY()<r){let lo=link.rotation.x,hi=1.5;for(let k=0;k<10;k++){link.rotation.x=(lo+hi)/2;if(endY()<r)lo=link.rotation.x;else hi=link.rotation.x;}link.rotation.x=hi;link.updateMatrixWorld(true);}
  });
  return state;
 }
 return {cat,state,tick,place,sprite:drawn};
}
