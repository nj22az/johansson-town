import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {assetURL} from '../assets.js';
import {rigEyes,EYE_PARAMS} from './eyes3d.js';
import {pixarSkin} from './pixar-skin.js';
import {rigBrows,rigMouth,featuresOf} from './face-features.js';
import {actingOf,springOf} from './face-acting.js';
import {recipeFace} from './pixar-face.js';
import {celFrom} from '../render/cel.js';

/**
 * Pixar bodies: a resident drawn as the studio's film model instead of the cartoon (the creator, 26 October 2026:
 * "see if you can implement Pixar Thuận into the game"; "Her eyes need to be rigged too"), and then, the same day, "Replace
 * her in the live game and studio now": on every World and Studio page, Thuan is her Pixar body. `?pixar=0` shows the
 * cartoon (to compare); `?pixar=thuan` names the bodies wanted. Everyone else stays the cartoon (AGENTS.md, the owner's
 * workflow of 24 October 2026: main keeps the cartoon until the Pixar world is complete; this resident by his word).
 *
 * The body is made in the studio repo (jojo `3d/cast/game_thuan.py`): her film model posed into World's rest (arms and
 * legs straight down), her weights on World's own bones, her painted eyes painted out, lightened for a phone. Here it is
 * worn by the avatar World builds anyway: the same bones, so every walk, sit, reach and gesture moves her; her card's
 * joints and measures replace the cartoon's (build.js), so feet, seats, hands and braids meet her own body; the cartoon's
 * meshes stay built and hidden. Her face is rigged: her eyes are World's rigged eyes (eyes3d.js) on discs laid over the
 * painted-out place, in her own size (they look about, blink, the lids follow the gaze, the iris lies under the cornea);
 * her brows and mouth are drawn on decals of their own (face-features.js), shaped by every feeling and by talking; her
 * jaw, nose and cheeks are bones that move her skin (the jaw opens with the mouth, the cheeks rise with a smile, the nose
 * scrunches in anger). Not drawn: the cartoon's other outfits (swimwear, the bath towel, the sailor and shopping outfits).
 *
 * Each body acts its feelings its own way (face-acting.js; the creator, 26 October 2026: "Thuans expressions need some work
 * too, she needs more personality when she is shocked and the different expressions, now she comes off as Generic"), and
 * its face gets from one feeling to the next on springs of the feeling's own timing (a shock pops and settles, sadness
 * sinks in). The same day, "Fix Johansson's blockers and bring him into the game": Pixar Johansson (jojo
 * `3d/cast/game_johansson.py`), the player's own body in the third person: clean-shaven and bald, his mouth drawn as hers
 * is, and an older face's lines (face-acting.js `lines`). Both are lit as skin (pixar-skin.js: the creator's rendering
 * brief of 26 October 2026).
 */

/** The Pixar bodies there are: resident name → their files under assets/ (the GLB and its card) and the GLB's version
 *  (the first characters of its SHA-256: a new export is fetched fresh, never an old one from a cache). */
export const PIXAR_BODIES=Object.freeze({Thuan:Object.freeze({path:'avatars/pixar/thuan',version:'a547eec1d7'}),
 Johansson:Object.freeze({path:'avatars/pixar/johansson',version:'5cb788b657'}),
 Thao:Object.freeze({path:'avatars/pixar/thao',version:'c41a269523'}),
 // (the clones of Meshy Johansson: jojo game_meshy.py tetsuo / fujita, the owner, 27 October 2026)
 Tetsuo:Object.freeze({path:'avatars/pixar/tetsuo',version:'87961f3990'}),
 // (the first of the residents cloned from their World look: jojo clone_recipe.py, the owner, 28 October 2026)
 Chin:Object.freeze({path:'avatars/pixar/chin',version:'35aa624f94'}),
 'Mr Fujita':Object.freeze({path:'avatars/pixar/fujita',version:'dd82ed6d9a'})});

/** Which residents this page draws as Pixar bodies: all there are, unless it asks for the cartoon (`?pixar=0`) or names them. */
export function pixarWanted(name,search=globalThis.location?.search||''){
 let q;try{q=new URLSearchParams(search).get('pixar');}catch{return true;}
 if(q==='0')return false;
 return q===null||q===''||q==='1'||q.toLowerCase().split(',').includes(String(name).toLowerCase());
}

const loaded=new Map();

/**
 * A body's clothes, each its own mesh over a body of its own (jojo `3d/cast/clothes_apart.py`; the creator, 26 October
 * 2026: "Make a nude rig with underwear for Johansson then rig the Hawaii shirt"): the shirt and the shorts on the body's
 * own bones and weights, and the trunk under them (`torso`) left out while they are worn, so nothing of him shows through
 * them. `?pixarClothes=0` on a page undresses every Pixar body (his boxer briefs), to look at the body under them.
 */
export const CLOTHES_PARTS=Object.freeze(['shirt','shorts']);
export function pixarDressed(search=globalThis.location?.search||''){return new URLSearchParams(search).get('pixarClothes')!=='0';}

/** The parsed body of one resident: its card and its meshes (geometry shared by every avatar that wears it). */
export function preparePixarBody(card,scene){
 const parts=[],features={};
 scene.updateMatrixWorld(true);
 scene.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  const joints=o.skeleton.bones.map(b=>b.name),name=o.material?.name||'';
  // (the model's morph targets by their names, gripL and gripR: the loader keeps the names in userData, the mesh's
  // dictionary is built from the attributes' names)
  const targetNames=o.userData?.targetNames||o.geometry.userData?.targetNames;
  if(targetNames&&o.geometry.morphAttributes?.position)o.geometry.morphAttributes.position.forEach((attr,i)=>{if(targetNames[i])attr.name=targetNames[i];});
  if(['eyes','brows','mouth'].includes(name))features[name]={geometry:o.geometry,joints};
  // (a rigged hairstyle is a part of its own, 'hair': Thao's bob, off her head so her face could be cleaned and put back
  // on bones that swing; the owner, 27 October 2026, "add it back as a rigged hairstyle")
  else parts.push({geometry:o.geometry,joints,kind:name.startsWith('hands')?'hands':name==='hair'?'hair':name==='glasses'||name==='shoes'||name==='lens'||name==='glint'?name:CLOTHES_PARTS.includes(name)||name==='torso'?name:'body',map:o.material?.map||null});
 });
 if(!parts.length||!features.eyes)throw new Error('Pixar body: expected a body and eyes in the model');
 const rest=Object.fromEntries(Object.entries(card.rest).map(([k,v])=>[k,v.slice()]));
 // World's measures for the body (build.js measure()), and its braids as the springs hang them (springs.js springRest).
 const measure={...card.measure,realHand:true,ownHair:card.hair?.style||null};   // (a hand of its own, fingers and all: grips close on a glass, consume.js drinkGrip)
 if(rest.braidL1)measure.braids=Object.fromEntries(['L','R'].map(s=>[s,[rest['braid'+s+'1'],rest['braid'+s+'2'],rest['braid'+s+'Tip']]]));
 return {name:card.name,card,rest,measure,parts,features,remapped:new Map()};
}

/**
 * Fetch and parse every Pixar body this page asks for, before the town builds its people. Never rejects, and never holds
 * the town up for long: a body not in hand after `timeout` ms is drawn as the cartoon (and the page carries on).
 */
export async function loadPixarBodies({search,timeout=20000}={}){
 const loader=new GLTFLoader(),names=Object.keys(PIXAR_BODIES).filter(n=>pixarWanted(n,search));
 const load=async name=>{
  if(loaded.has(name))return;
  try{
   const {path,version}=PIXAR_BODIES[name],v='?v='+version,card=await (await fetch(assetURL(path+'.json'+v))).json(),gltf=await loader.loadAsync(assetURL(path+'.glb'+v));
   loaded.set(name,preparePixarBody(card,gltf.scene));
  }catch(error){console.warn('Pixar body unavailable: '+name,error);}
 };
 // Each resident has a 2048² colour atlas (six bodies are about 97 MiB decoded,
 // before GPU copies and loader working buffers). Keep the complete models and
 // texture resolution, but do not fetch/parse/decode all six at once on startup.
 let next=0;
 const worker=async()=>{while(next<names.length)await load(names[next++]);};
 let timer;
 await Promise.race([Promise.all(Array.from({length:Math.min(2,names.length)},worker)),new Promise(resolve=>{timer=setTimeout(()=>{console.warn('Pixar bodies: not in hand after',timeout,'ms; drawing the cartoon');resolve();},timeout);})]);
 clearTimeout(timer);
 return [...loaded.keys()];
}

/** The Pixar body this recipe is drawn with on this page, or null (the cartoon). */
export function pixarBody(recipe){
 const name=recipe?.name;
 return name&&loaded.has(name)&&pixarWanted(name)?loaded.get(name):null;
}

/** For tests and tools: wear a body prepared elsewhere (node has no fetch of the assets). */
export function providePixarBody(body){loaded.set(body.name,body);}

// A geometry's skin indices in this skeleton's order (the model's joints are World's bone names), made once a body.
function inOrder(body,part,order){
 const key=order.join(',');
 if(!body.remapped.has(part))body.remapped.set(part,new Map());
 const cache=body.remapped.get(part);
 if(cache.has(key))return cache.get(key);
 const map=part.joints.map(n=>{const i=order.indexOf(n);if(i<0)throw new Error('Pixar body: no bone '+n);return i;});
 const g=part.geometry.clone(),src=part.geometry.attributes.skinIndex,idx=new Uint16Array(src.count*4);
 for(let i=0;i<src.count;i++)for(let c=0;c<4;c++)idx[i*4+c]=map[src.getComponent(i,c)];
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(idx,4));
 cache.set(key,g);return g;
}

// The town's high-key skin ramp (cel.js 'soft3': 172, 214, 255) blended rather than stepped: her face is modelled, not a
// ball, and stepped bands broke it into patches.
let ramp=null;
function smoothRamp(){
 if(ramp)return ramp;
 ramp=new THREE.DataTexture(new Uint8Array([172,172,172,255,214,214,214,255,255,255,255,255]),3,1,THREE.RGBAFormat);
 ramp.minFilter=ramp.magFilter=THREE.LinearFilter;ramp.generateMipmaps=false;ramp.needsUpdate=true;return ramp;
}

const _axis=new THREE.Vector3();
/** A card's mouth curves (the seam's line, the lips' thickness: polynomials in the eye's units across the mouth) if they
 * hold across the mouth's width; else a plain mouth of the same width (a gentle smile, thin lips). The studio fits the
 * curves to the painted lips, and Johansson's were a sliver under a moustache: the fit shot off past 5 units and his
 * mouth drew as a dot under the nose (the owner, 27 October 2026: "his mouth needs to show"). */
function saneMouth(m){
 const at=(c,x)=>c.reduce((y,k)=>y*x+k,0),half=m.half||18;
 const ok=['line','upper','lower'].every(k=>Array.isArray(m[k])&&[half*.5,half].every(x=>Math.abs(at(m[k],x)-at(m[k],0))<8));
 if(ok)return m;
 return {...m,line:[0,0,.003,0,.2],upper:[0,0,-.003,0,2.1],lower:[0,0,-.0045,0,2.9]};
}
/** A mouth's ink dark enough to read (luminance under .22), from the painted lips' colour, kept warm. */
function inkFor(hex){const c=new THREE.Color(hex),l=.299*c.r+.587*c.g+.114*c.b;if(l<=.22)return '#'+c.getHexString();const dark=new THREE.Color('#4a2420');return '#'+c.lerp(dark,THREE.MathUtils.clamp((l-.22)/.5,.6,.95)).getHexString();}
/** Lips a shade deeper than the skin they sit in, so they show in every look. */
function lipFor(hex){const c=new THREE.Color(hex);const hsl={};c.getHSL(hsl);return '#'+c.setHSL(hsl.h,Math.min(1,hsl.s*1.25+.08),hsl.l*.86).getHexString();}
/** The face's own bones (children of the head): the jaw (talking, an open mouth), the nose and the cheeks. */
const FACE_BONES=Object.freeze(['jaw','nose','cheekL','cheekR']);
/** How far each moves at full: the jaw's drop (radians), a cheek's rise (up, forward and out: the mid-face widens) and the
 *  nose's scrunch (metres, up and back). */
const FACE_REACH=Object.freeze({jaw:.22,cheek:[.005,.0016,.0012],nose:[.0018,-.0008]});
// Eyes only the painter draws, and what a face without painted eyes shows instead (eyes3d.js rigEyes `stand`).
const STAND_IN=Object.freeze({star:'wide',heart:'happy',spiral:'daze',pain:'happy',smug:'shy',droop:'shy',dreamy:'content',bawl:'sad',blank:'wide'});

const EYE_AT=Object.freeze(Object.fromEntries(EYE_PARAMS.map((n,i)=>[n,i])));
// What a body's acting does to the eye as drawn (face-acting.js eyes): scales of its size and iris, its lids.
const EYE_SCALE=Object.freeze({rx:'rx',ry:'ry',topAmp:'ry',botAmp:'ry',irx:'iris',iry:'iris'}),EYE_SET=Object.freeze(['pupil','cut','slant','smile','squeeze']);
// Where the face's numbers may go, a spring's overshoot included: the brows' [lift, tilt, arch, pinch] and the mouth.
// (face-features.js BROW_KEYS: lift, tilt, arch, pinch, outer, straight, bunch.) This is what Thuận's brow decal holds; a
// body whose decal the studio made wider gives its own (face-acting.js browRange: his evil brow's inner end comes down a
// long way). Shared, his wider range let her springs' overshoot cut her brows' inner ends flat.
export const BROW_RANGE=Object.freeze([[-3.2,11],[-9.5,10.6],[-1.6,3],[0,3.2],[-4,10],[0,1],[0,.8]]);
const FEATURE_RANGE=Object.freeze({open:[0,15],width:[.3,1.5],round:[0,1.2],box:[0,1.2],upper:[.05,.95],teeth:[0,1.2],lowTeeth:[0,1.2],
 tongue:[0,1.2],pucker:[0,1.2],thin:[0,1.2],pout:[0,1.5]});

/**
 * Springs for a face: every number of it moves toward its feeling's as a damped spring of the feeling's own timing
 * (face-acting.js: {f Hz, z}); under critical damping it overshoots and settles (a take), over it sinks in. A tree of
 * numbers (arrays and objects) in, the same tree out. `sp` null: there at once.
 */
function faceSprings(){
 const state=new Map();
 const step=(key,target,dt,sp)=>{
  let s=state.get(key);
  if(!s||!sp||dt>=.5){state.set(key,{x:target,v:0});return target;}
  const w=2*Math.PI*sp.f,n=Math.max(1,Math.ceil(dt*240)),h=dt/n;
  for(let i=0;i<n;i++){s.v+=(w*w*(target-s.x)-2*sp.z*w*s.v)*h;s.x+=s.v*h;}
  return s.x;
 };
 const walk=(key,value,dt,sp)=>typeof value==='number'?step(key,value,dt,sp)
  :Array.isArray(value)?value.map((v,i)=>walk(key+'.'+i,v,dt,sp))
  :Object.fromEntries(Object.entries(value).map(([k,v])=>[k,walk(key+'.'+k,v,dt,sp)]));
 return {settle:walk,forget(prefix){for(const k of [...state.keys()])if(k.startsWith(prefix))state.delete(k);}};
}

// A decal's own units, as the studio wrote them into its first UV (x/100, y/100; glTF turns v over), and its side: of the
// face's middle `mid` (between the eyes: a face is not always centred on the body's own middle).
function withLocal(g,name,mid=0){
 const P=g.attributes.position,UV=g.attributes.uv,n=P.count,local=new Float32Array(n*3);
 for(let i=0;i<n;i++){local[i*3]=UV.getX(i)*100;local[i*3+1]=(1-UV.getY(i))*100;local[i*3+2]=Math.sign(P.getX(i)-mid)||1;}
 g.setAttribute(name,new THREE.BufferAttribute(local,3));return g;
}

// The mouth's decal rides the jaw below the line between the lips and the head above it, smoothly by its own height (in
// its units): the export copies each point's jaw weight from the skin's nearest vertex, which is noisy, and an opening
// jaw then kinks the drawn lips at every vertex of the decal.
function smoothJaw(g,names){
 const head=names.indexOf('head'),jaw=names.indexOf('jaw'),UV=g.attributes.uv,n=UV.count;
 if(head<0||jaw<0)return g;
 const idx=new Uint16Array(n*4),w=new Float32Array(n*4);
 for(let i=0;i<n;i++){const y=(1-UV.getY(i))*100,k=THREE.MathUtils.smoothstep(-y,-1.5,3.5);idx[i*4]=head;idx[i*4+1]=jaw;w[i*4]=1-k;w[i*4+1]=k;}
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(idx,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(w,4));
 return g;
}

/** A finger bone's name: thumb, index, middle, ring or pinky, the side, the joint (1 at the knuckle or the thumb's root). */
const FINGER_NAME=/^(thumb|index|middle|ring|pinky)([LR])([123])$/;
/** How far each joint turns at a full grip (radians), per finger: the thumb's root a little, its two joints more; the
 *  fingers' three joints as a fist closes (the index least, so a held thing shows). */
// (the thumb folds well over: with little turn it stood straight up beside the jug like a hitch-hiker's; the owner,
// 27 October 2026, of that frame: "What's this?")
const GRIP_TURN=Object.freeze({thumb:[.95,.8,.55],index:[1.05,1.15,.8],middle:[1.2,1.3,.9],ring:[1.25,1.35,.95],pinky:[1.3,1.4,1.0]});

export function dressPixar(body,{root,bones,order,shadows=true,recipe=null}){
 const rest=body.rest,face={},fingers={};
 for(const name of FACE_BONES){if(!rest[name])continue;const b=new THREE.Bone();b.name=name;b.position.set(...rest[name]).sub(new THREE.Vector3(...rest.head));bones.head.add(b);face[name]=b;}
 // The finger bones (a body whose card has them: the studio's game_meshy.py finger_rig), children of the hand bone in
 // chains, each at its joint; they have no turn at rest, so their frame is the hand's and the card's bend axes apply
 // as they are.
 for(const name of Object.keys(rest).filter(n=>FINGER_NAME.test(n)).sort()){
  const [,finger,side,k]=name.match(FINGER_NAME),parentName=k==='1'?'hand'+side:finger+side+(k-1),parent=k==='1'?bones[parentName]:fingers[parentName];
  if(!parent)continue;
  const b=new THREE.Bone();b.name=name;b.position.set(...rest[name]).sub(new THREE.Vector3(...rest[parentName]));parent.add(b);fingers[name]=b;
 }
 const restOf=Object.fromEntries(Object.entries(face).map(([k,b])=>[k,b.position.clone()]));
 // The pose his skin was bound in (the card's `bind`: a turn per bone, Euler radians; the studio bakes his arms out
 // 35 degrees, the owner, 27 October 2026): the skeleton takes its inverses with those turns on, so a raised arm
 // stretches the armpit from there and not from arms-down; the bones then rest as World has them.
 const bind=body.card.bind||null;
 for(const [n,e] of Object.entries(bind||{}))bones[n]?.rotation.set(e[0],e[1],e[2]);
 root.updateMatrixWorld(true);
 const names=[...order,...Object.keys(face),...Object.keys(fingers)],skeleton=new THREE.Skeleton(names.map(n=>bones[n]||face[n]||fingers[n]));
 if(bind){for(const n of Object.keys(bind))bones[n]?.rotation.set(0,0,0);root.updateMatrixWorld(true);}
 // (bound with its own matrix given: three.js's bind() without one recalculates the skeleton's inverses from the bones as
 // they stand now, at rest, and would undo the bind pose above)
 const skinned=(g,m)=>{const mesh=new THREE.SkinnedMesh(g,m);mesh.frustumCulled=false;root.add(mesh);mesh.updateMatrixWorld(true);mesh.bind(skeleton,mesh.matrixWorld);return mesh;};
 // Shaded as every resident's face is (build.js buildHead): the town's high-key ramp, a little self-lit, so her pale skin
 // stays the pale skin of her film model and does not go brown in a shadow.
 const materials=[],meshes=body.parts.map(part=>{
  // (the hands and a pair of glasses (the clones' frames, jojo game_meshy.build_glasses) carry their colour per vertex)
  // (the glass in a clone's frames and the glint on it, drawn as the cartoon's glasses are (face-objects.js): faint glass
  // the eyes read through, a white stroke that catches the light; the owner, 28 October 2026, "Make the glasses full")
  if(part.kind==='lens'||part.kind==='glint'){
   const glass=part.kind==='lens'?new THREE.MeshStandardMaterial({color:'#dbeaf2',transparent:true,opacity:.12,roughness:.15,metalness:0,depthWrite:false,side:THREE.DoubleSide})
    :new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});
   glass.name='Pixar '+body.name+' · '+part.kind;materials.push(glass);
   const mesh=skinned(inOrder(body,part,names),glass);
   mesh.name='Pixar '+body.name+' · '+part.kind;mesh.castShadow=false;mesh.receiveShadow=false;mesh.renderOrder=1;mesh.userData.pixarPart=part.kind;return mesh;
  }
  // (a clone's modelled hair, Chin's, is coloured per vertex as the glasses are; Thao's bob carries its texture)
  const source=part.kind==='hands'||part.kind==='glasses'||part.kind==='shoes'||part.kind==='hair'&&!part.map?new THREE.MeshStandardMaterial({vertexColors:true,roughness:part.kind==='glasses'?.4:part.kind==='shoes'?.55:.82,emissive:0xffffff,emissiveIntensity:.05})
   :new THREE.MeshStandardMaterial({map:part.map,roughness:.82,emissive:0xffffff,emissiveMap:part.map,emissiveIntensity:.05});
  // (hair is not skin: the town's cel ramp alone, no warmth under it)
  const cel=celFrom(source,{bands:'soft3'}),material=part.kind==='hair'||part.kind==='glasses'||part.kind==='shoes'?cel:pixarSkin(cel,{head:{y:body.card.measure.neckY,x:rest.head[0],z:rest.head[2],r:body.card.measure.Rh}});source.dispose();material.gradientMap=smoothRamp();
  // (a clone's shoes lifted: the leather's brown, linear per vertex, went near black under the cel ramp and hid the sole and laces)
  if(part.kind==='shoes'&&material.color)material.color.setScalar(1.9);
  // (the clothes are one surface of cloth: their insides show, at the sleeves, the collar and the hems)
  if(CLOTHES_PARTS.includes(part.kind))material.side=THREE.DoubleSide;
  material.name='Pixar '+body.name+' · '+part.kind;materials.push(material);
  const mesh=skinned(inOrder(body,part,names),material);
  mesh.name='Pixar '+body.name+' · '+part.kind;mesh.castShadow=shadows;mesh.receiveShadow=true;mesh.userData.pixarPart=part.kind;return mesh;
 });
 const clothes=meshes.filter(m=>CLOTHES_PARTS.includes(m.userData.pixarPart)),torso=meshes.filter(m=>m.userData.pixarPart==='torso');
 // Dressed: the clothes drawn and the trunk under them not; undressed, the other way round (a body without clothes
 // drawn dressed is itself).
 const dress=on=>{const wear=!!on&&clothes.length>0;for(const m of clothes)m.visible=wear;for(const m of torso)m.visible=!wear||!clothes.length;return wear;};
 let dressed=dress(pixarDressed());
 // Her eye (the studio's measures of the painted one, her lashes) drawn as World draws every rigged eye, on the town's ramp.
 // (a clone's face reshaped by the resident's recipe, the avatar creator's eyes, brows and mouth: pixar-face.js)
 const look=body.card.face==='recipe'&&recipe?recipeFace(body.card,recipe):null;
 const F=body.features,E=body.card.eyes,mid=E.centres?(E.centres[0][0]+E.centres[1][0])/2:0;
 const eyes=rigEyes(withLocal(inOrder(body,F.eyes,names).clone(),'eyeLocal',mid),{iris:E.colour,style:'pixar',own:look?.eyes||{rx:E.rx,ry:E.ry,iris:E.iris,lash:E.lash,flick:E.flick,lashes:E.lashes,shape:E.shape,corner:E.corner},make:skinned,stand:STAND_IN,nearer:.0018});
 const browCard=look?look.brows:body.card.brows;
 const brows=F.brows&&browCard?rigBrows(withLocal(inOrder(body,F.brows,names).clone(),'featureLocal',mid),browCard,{make:skinned,lines:actingOf(body.name)?.lines||0,taper:actingOf(body.name)?.browTaper||look?.taper||0,bushy:actingOf(body.name)?.browBushy||look?.bushy||0}):null;
 // (the line between the lips in a dark ink whatever the painted lips were: the studio measured his as his own skin's
 // pink, and the seam vanished in the halftone looks and was faint in the plain one; the owner, 27 October 2026: "his
 // mouth needs to show in all shaders and even normal")
 const mouthCard=look?.mouth||body.card.mouth;
 const mouthStyle=mouthCard?{...saneMouth(mouthCard),ink:inkFor(body.card.mouth.ink),lip:lipFor(body.card.mouth.lip),lowerLip:lipFor(body.card.mouth.lowerLip||body.card.mouth.lip)}:null;
 const mouth=F.mouth&&mouthStyle?rigMouth(smoothJaw(withLocal(inOrder(body,F.mouth,names).clone(),'featureLocal',mid),names),mouthStyle,{make:skinned,lines:actingOf(body.name)?.lines||0,seam:2.2}):null;
 // (the features shaded on the same blended ramp as her skin: stepped bands cut a lip or an eye into two tones)
 for(const m of [eyes.mesh,brows?.mesh,mouth?.mesh])if(m?.material?.isMeshToonMaterial)m.material.gradientMap=smoothRamp();
 // Each body acts its feelings its own way (face-acting.js), and gets from one to the next on springs of the feeling's own
 // timing: a wall clock, as paintFace has no step.
 const acting=actingOf(body.name),feelings=acting?.feelings||null,springs=faceSprings();
 let last=0,kind=-1;
 // The eye as the feeling draws it, then as she acts it: its size and iris scaled, the lids set (and squeezed), where she
 // looks (unless she is made to look somewhere: gaze), and in fright the irises shivering.
 const actEyes=(state,act,dt,sp,now,cheeks)=>{
  const P=eyes.params,e=act?.eyes||{};
  if(P[EYE_AT.kind]!==kind){kind=P[EYE_AT.kind];springs.forget('eye.');}
  const want={};
  for(const [k,by] of Object.entries(EYE_SCALE))want[k]=P[EYE_AT[k]]*(e[by]??1);
  for(const k of EYE_SET)want[k]=e[k]??P[EYE_AT[k]];
  if(Number.isFinite(e.tear))want.tear=e.tear;
  const got=springs.settle('eye',want,dt,sp);
  // (the overshoot of a take stays inside the eye's disc: the studio laid it 21 units below the eye's middle and 24
  // above, room for the lid and lash lines round the widest eye)
  for(const [k,v] of Object.entries(got))P[EYE_AT[k]]=k==='irx'||k==='iry'?Math.max(1,v):k==='pupil'?THREE.MathUtils.clamp(v,.1,1)
   :k==='ry'||k==='botAmp'?Math.min(v,14.5):k==='topAmp'?Math.min(v,16.5):k==='rx'?Math.min(v,14.5):v;
  // (an older face's crow's feet as the cheeks rise: a body's acting says it has the lines)
  if(acting?.lines)P[EYE_AT.crow]=acting.lines*THREE.MathUtils.smoothstep((cheeks[0]+cheeks[1])/2,.35,.9);
  if(e.look&&!state.gaze){P[EYE_AT.lookX]=e.look[0];P[EYE_AT.lookY]=e.look[1];}
  if(e.tremble&&api.smooth){const t=now/1000;P[EYE_AT.lookX]+=e.tremble*Math.sin(t*69.1);P[EYE_AT.lookY]+=e.tremble*.6*Math.sin(t*81.7+1);}
 };
 // The lips, for a glass or a morsel brought to them (table-drink.js avatarMouth, consume.js): the mouth decal's centre
 // at the bind, kept in the head's frame (the cartoon's mouth is a point on its drawn head; his is where his mouth is)
 // (the decal as it is drawn: its skinned vertices' centre, measured the first time it is asked for, with the skeleton
 // in place. The unskinned box put Thao's lips 10 cm behind her face, and the jug's rim inside her head: the owner,
 // 27 October 2026, "Audit yourself")
 let lipsAt=null;
 const lipsNow=()=>{
  if(lipsAt||!mouth?.mesh)return lipsAt;const m=mouth.mesh,g=m.geometry,n=g.attributes.position.count;
  let top=m;while(top.parent)top=top.parent;top.updateMatrixWorld(true);m.skeleton?.update();
  // (at the line between the lips: the decal rides the head above it and the jaw below, so the line is where its jaw
  // weight crosses one half; the whole decal's centre sat a centimetre low, and a rim met the chin: the owner, "the beer
  // doesn't reach her mouth")
  const names=m.skeleton?.bones.map(b=>b.name)||[],jawAt=names.indexOf('jaw'),SI=g.attributes.skinIndex,SW=g.attributes.skinWeight;
  const jawW=i=>{if(jawAt<0||!SI)return .5;let w=0;for(let k=0;k<4;k++)if(SI.getComponent(i,k)===jawAt)w+=SW.getComponent(i,k);return w;};
  // (the middle of that line, where it crosses the face's centre: on the skin, not pushed out in front of it, where a
  // rim came to rest 4 cm before her mouth and the jug's near edge on her chin: the owner, "do you look at the
  // screenshots?")
  const band=[],all=new THREE.Vector3();
  for(let i=0;i<n;i++){const v=bones.head.worldToLocal(m.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(m.matrixWorld));all.add(v);const j=jawW(i);if(j>.04&&j<.96)band.push(v);}
  all.multiplyScalar(1/Math.max(1,n));
  const side=new THREE.Vector3(1,0,0).transformDirection(root.matrixWorld).transformDirection(bones.head.matrixWorld.clone().invert()).normalize();
  if(band.length>=4){const xs=band.map(v=>v.dot(side)).sort((a,b)=>a-b),mid=xs[xs.length>>1],span=xs[xs.length-1]-xs[0];
   const centre=band.filter(v=>Math.abs(v.dot(side)-mid)<Math.max(.004,span*.08));lipsAt=centre.reduce((a,v)=>a.add(v),new THREE.Vector3()).multiplyScalar(1/centre.length);}
  else lipsAt=all;
  return lipsAt;
 };
 const api={meshes:[...meshes,eyes.mesh,brows?.mesh,mouth?.mesh].filter(Boolean),eyes,brows,mouth,bones:face,smooth:true,acting,card:body.card,
  /** Where his lips are now (world), or null for a body without a rigged mouth. */
  mouthPoint(){const lips=lipsNow();if(!lips)return null;bones.head.updateWorldMatrix(true,false);return bones.head.localToWorld(lips.clone());},
  /** The same lips in the head bone's own frame (consume.js poses a drink or a morsel against them). */
  get lipsLocal(){const lips=lipsNow();return lips?lips.clone():null;},
  /** Close a hand round what it holds, 0 open to 1 a fist (the body's `gripL`/`gripR` morph targets, the studio's
   * game_meshy.py grip_keys: the fingers curled toward the palm). A body without them keeps its hands as sculpted. */
  grip(side,v,shape=null){
   v=THREE.MathUtils.clamp(v,0,1);
   const bend=body.card.fingers?.[side]?.bend;
   if(bend){
    // (finger bones: each joint turns about its bend axis, so far at a full grip; `shape` scales a finger's turn, e.g.
    // {thumb:.5,index:.6} for a can held lightly, or 0 for a finger that points)
    let any=false;
    for(const [name,b] of Object.entries(fingers)){const [,finger,s,k]=name.match(FINGER_NAME);if(s!==side)continue;
     const axis=bend[name];if(!axis)continue;const amount=v*GRIP_TURN[finger][k-1]*(shape?.[finger]??1);
     b.quaternion.setFromAxisAngle(_axis.set(axis[0],axis[1],axis[2]).normalize(),amount);any=true;}
    return any;
   }
   let any=false;for(const m of meshes){const i=m.morphTargetDictionary?.['grip'+side];if(i==null)continue;m.morphTargetInfluences[i]=v;any=true;}return any;},
  /** The finger bones by name (empty for a body without them). */
  get fingers(){return fingers;},
  /** Where a bar held in this hand lies, in the hand bone's own frame, with the fingers curled `v` of the way (`shape` as
   * grip): the hollow the four fingers make (their middle and last joints, their tips, and the knuckles pushed toward the
   * palm, averaged), with the bar's direction (the knuckle line) and how far the knuckles span along it. Null without
   * finger bones. table-drink.js puts a jug's handle there, so the jug is in the hand, not beside it. */
  holdPoint(side,v=1,shape=null){
   const bend=body.card.fingers?.[side]?.bend,curl=body.card.fingers?.[side]?.curl;if(!bend||!curl)return null;
   const pts=[],knuckles=[],cu=new THREE.Vector3(...curl).normalize();let bar=null;
   for(const finger of ['index','middle','ring','pinky']){
    const R=new THREE.Quaternion(),p=new THREE.Vector3(),chain=[];let last=null;
    for(let k=1;k<=3;k++){const b=fingers[finger+side+k];if(!b)break;p.add(b.position.clone().applyQuaternion(R));chain.push(p.clone());last=b;
     const ax=bend[finger+side+k];if(!ax)break;if(k===1&&finger==='middle')bar=new THREE.Vector3(...ax).normalize();
     R.multiply(new THREE.Quaternion().setFromAxisAngle(_axis.set(ax[0],ax[1],ax[2]).normalize(),v*GRIP_TURN[finger][k-1]*(shape?.[finger]??1)));}
    if(chain.length<3)continue;
    const tip=chain[2].clone().add(last.position.clone().multiplyScalar(.85).applyQuaternion(R));
    knuckles.push(chain[0]);pts.push(chain[1],chain[2],tip,chain[0].clone().addScaledVector(cu,.025));
   }
   if(!pts.length||!bar)return null;
   const centre=pts.reduce((a,q)=>a.add(q),new THREE.Vector3()).multiplyScalar(1/pts.length);
   const along=knuckles.map(k=>k.dot(bar)),span=Math.max(...along)-Math.min(...along);
   return {centre,bar,span,knuckles};
  },
  /** The seat of the body rounded out as it sits, 0 standing to 1 sat (the body's `seat` morph target, the studio's
   * game_meshy.py sculpt_seat: the owner, 27 October 2026, "the butt should come when he sits"). */
  seat(v){let any=false;for(const m of meshes){const i=m.morphTargetDictionary?.seat;if(i==null)continue;m.morphTargetInfluences[i]=THREE.MathUtils.clamp(v,0,1);any=true;}return any;},
  /** Dress or undress the body (its clothes on, the trunk under them left out; or the body in its underwear). */
  dress(on){dressed=dress(on);return dressed;},
  get dressed(){return dressed;},
  get clothes(){return clothes.map(m=>m.userData.pixarPart);},
  /** Follow the face: the eyes (gaze, blink, the feeling's lids), the brows, the mouth and the face's bones. */
  update(state){
   const act=feelings?.[state.expression]||null;
   eyes.update(act?.eyes?.as?{...state,eyesAs:act.eyes.as}:state);
   const now=globalThis.performance?.now?.()??0,dt=last?Math.min(.25,(now-last)/1000):1;last=now;
   const sp=api.smooth?springOf(acting,state.expression):null,target=featuresOf(state,feelings,acting?.mouth||look?.mouthBase);
   // while she talks her brows rise and fall with it, one side a beat behind the other
   const talk=+state.talk||0;
   if(acting?.talkBrows&&talk>0&&api.smooth){const t=now/1000,a=acting.talkBrows*talk;
    target.brows.left[0]+=a*(.5+.5*Math.sin(t*10.7));target.brows.right[0]+=.8*a*(.5+.5*Math.sin(t*10.7-.6));}
   const f=springs.settle('face',target,dt,sp);
   for(const [k,[lo,hi]] of Object.entries(FEATURE_RANGE))f.mouth[k]=THREE.MathUtils.clamp(f.mouth[k],lo,hi);
   // (a brow stays on its decal, the spring's overshoot included: the studio left it room to rise, drop and pinch)
   for(const b of [f.brows.left,f.brows.right])(acting?.browRange||BROW_RANGE).forEach(([lo,hi],i)=>{b[i]=THREE.MathUtils.clamp(b[i],lo,hi);});
   f.jaw=THREE.MathUtils.clamp(f.jaw,0,1.15);f.cheeks=f.cheeks.map(v=>THREE.MathUtils.clamp(v,0,1.2));f.scrunch=THREE.MathUtils.clamp(f.scrunch,0,1.2);
   if(eyes.showing)actEyes(state,act,dt,sp,now,f.cheeks);
   brows?.set(f.brows.left,f.brows.right);mouth?.set(f.mouth);
   if(face.jaw)face.jaw.rotation.x=f.jaw*FACE_REACH.jaw;
   for(const [i,s,x] of [[0,'L',1],[1,'R',-1]])if(face['cheek'+s])face['cheek'+s].position.copy(restOf['cheek'+s]).add(new THREE.Vector3(x*FACE_REACH.cheek[2]*f.cheeks[i],FACE_REACH.cheek[0]*f.cheeks[i],FACE_REACH.cheek[1]*f.cheeks[i]));
   if(face.nose)face.nose.position.copy(restOf.nose).add(new THREE.Vector3(0,FACE_REACH.nose[0]*f.scrunch,FACE_REACH.nose[1]*f.scrunch));
  },
  // (shown again, dressed as he was: the trunk under his clothes stays out while he wears them)
  set visible(on){for(const m of meshes)m.visible=on;if(on)dress(dressed);},
  dispose(){for(const m of materials)m.dispose();eyes.dispose();brows?.dispose();mouth?.dispose();},
 };
 return api;
}
