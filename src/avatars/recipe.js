/**
 * Shimanchu (島人, islander): the town's avatars.
 *
 * Every person in the town is a recipe: a few hundred bytes saying what their face,
 * hair, body and clothes are. The recipe is all that is stored or shared; the body is
 * built from it (build.js), the face is painted from it (face.js) and it is animated
 * the same way for everyone (animate.js), so the whole cast shares one look -- round
 * heads, stubby limbs, drawn-on faces -- whether it is Thuan, Johansson or the postman.
 *
 * Everything here is original to this town: the part shapes, the palettes, the names.
 */

import {HEAD_FORMS} from './head-profile.js';
import {INK_NOSES,FACE_MARKS,PAINTED_MOUSTACHES,PAINTED_BEARDS} from './face.js';
/** Skin, hair, eyes and cloth. Chosen to sit well under the town's cel grade. */
export const PALETTE=Object.freeze({
 skin:Object.freeze(['#f7dcc4','#f1cfae','#e8bf98','#dca97e','#c98d62','#b27449','#8f5a38','#6b4029','#e8bd9e']),
 hair:Object.freeze(['#1c1714','#3a2618','#5a3a22','#8a5a2e','#c08a4a','#e0c078','#9a9a96','#d8d6d0','#b8412e','#3d4f8a']),
 eyes:Object.freeze(['#2a1d16','#5a3a22','#3d6a8a','#4a7a4a','#6a5a8a','#1c1c24']),
 cloth:Object.freeze(['#f4f1ea','#d8342c','#e8742a','#f4d23c','#8fbf4a','#2a8a5a','#3fa0c8','#2f5f9e','#27304d','#8a4ab8','#e98aa6','#9a6a42','#6d7478','#2b2b2b','#c8b48a','#7fb0d8']),
 lips:Object.freeze(['#b8544a','#a8433e','#cc3d52','#e06a7a','#d8342c','#8a3a3a']),
});

/**
 * Life stage. It sets height and how big the head is against the body, so a ten-year-
 * old reads as a child and a grandmother as older at a glance, the way Tomodachi and
 * Animal Crossing read age from proportion before anything else (docs/AMPLIFY-AUDIT.md,
 * C1). Adult is the old single scale, unchanged.
 */
export const AGES=Object.freeze(['child','teen','adult','elder']);
/** The life stage for an age in years. */
export const ageClass=years=>!Number.isFinite(+years)?'adult':years<13?'child':years<19?'teen':years>=65?'elder':'adult';

export const PARTS=Object.freeze({
 silhouette:Object.freeze(['neutral','feminine','masculine']),
 head:HEAD_FORMS,
 hair:Object.freeze(['crop','sidepart','bob','long','ponytail','sweptponytail','braids','longbraids','bun','spiky','perm','buzz','afro','horseshoe','bald','pixie','shoulder','curtains','slick','mullet','topknot','pigtails','twinbuns','longfringe']),
 eyes:Object.freeze(['round','dot','almond','sleepy','lashes','narrow','sparkle','gentle','doe','cat','droopy','heavy','bright','tired','squint','starry','inkoval']),
 brows:Object.freeze(['straight','arched','thick','thin','worried','bushy','angled','short','rounded','tapered','feathered','maro','none']),
 nose:Object.freeze(['button','dot','line','wide','hook','pointed','snub','bulb','ridge',...Object.keys(INK_NOSES),'none']),   // then the ink noses (face.js)
 mouth:Object.freeze(['smile','flat','grin','small','wide','smirk','pout','cat','teeth','open','lopsided','tongue','buck','soft']),
 glasses:Object.freeze(['none','round','square','sun','half']),
 // Moustache and beard are worn together or apart, as in any face maker; `facial` is
 // every style either can be, the single name older recipes gave.
 moustache:Object.freeze(['none','moustache','walrus','handlebar','pencil',...Object.keys(PAINTED_MOUSTACHES)]),
 // The painted beards (face.js PAINTED_BEARDS), a layer of their own under the moustache and the 3D beard.
 paint:Object.freeze(['none',...Object.keys(PAINTED_BEARDS)]),
 beard:Object.freeze(['none','stubble','beard','goatee','chinstrap']),
 facial:Object.freeze(['none','moustache','walrus','handlebar','pencil','stubble','beard','goatee','chinstrap']),
 top:Object.freeze(['tank','tee','kariyushi','polo','contrastpolo','blouse','jacket','apron','smock','sailor','sailorlong','police','hoodie','cardigan','overalls','sundress','festival','lighthouse','lantern','reef',
  // The wardrobe plan's batch 2 (2026-10-11): painted on the body every top already has (garment.js).
  'shirt','vest','knitvest','gymtee','baseball',
  // Cute everyday wear (the creator, 2026-10-14: "characters need to … have cute clothes"), painted the same way.
  'raglan','pinafore','stripedvest']),
 bottom:Object.freeze(['underwear','shorts','trousers','skirt','longskirt','widepants','cropped','culottes','pleatedskirt']),
 footwear:Object.freeze(['barefoot','sneakers','sandals','shoes','boots']),
 hat:Object.freeze(['none','cap','captain','police','helmet','straw','headband','kerchief','beanie','beret','bucket','ribbon','squid','teapot','sunflower','paperboat','mountain',
  // Hats that are models from World's asset catalogue (hat-assets.js), sold at Sakura Shōten: appended, so no saved id moves.
  'trucker',
  // A hair slide at the temple, worn with the hair out like the bow (not a hat over it).
  'hairclip']),
 // What is worn on a belt (police-data.js DUTY_BELT): the police officer's duty belt and its kit. Chosen on purpose in the
 // maker, never dealt by the dice.
 belt:Object.freeze(['none','duty']),
 earrings:Object.freeze(['none','studs','hoops']),
 neckwear:Object.freeze(['none','pendant','scarf']),
});

/** The prints a top can carry (garment.js), in the order the maker offers them. */
export const PATTERNS=Object.freeze(['none','flowers','stripes','dots']);
/** The patterns a bottom can carry: plaid on a skirt, stripes down trousers (build.js), in the order the maker offers them. */
export const BOTTOM_PATTERNS=Object.freeze(['none','plaid','stripes']);
/** Bottoms that are skirts: they hang from the waist as cloth on springs (build.js, springs.js), not as two legs. */
export const DRESS_BOTTOMS=Object.freeze(['skirt','longskirt','pleatedskirt']);
/**
 * Tops that carry a number (`outfit.number`, 1–99; 0 is none): the maker shows its number stepper only for these. The
 * Seagulls jersey wears it on the back.
 */
export const NUMBERED_TOPS=Object.freeze(['baseball']);
/**
 * What the dice deal (randomRecipe): everyday clothes an islander might be wearing on any street, never a uniform, a
 * costume or somebody's work clothes, so a stranger is never dressed as the police officer or a festival steward.
 */
export const DICE=Object.freeze({
 tops:Object.freeze(['tee','kariyushi','polo','contrastpolo','blouse','jacket']),
 skirtsAndWide:Object.freeze(['skirt','longskirt','widepants','cropped','culottes','pleatedskirt']),
 trousers:Object.freeze(['shorts','trousers']),
 bottomColours:Object.freeze(['#27304d','#6d7478','#c8b48a','#2b2b2b','#9a6a42','#2f5f9e']),
 shoes:Object.freeze(['#6d4a32','#2b2b2b','#f4f1ea','#d8342c']),
 footwear:Object.freeze(['sneakers','sandals','shoes','boots']),
});

const clamp=(v,lo=0,hi=1)=>Math.min(hi,Math.max(lo,Number.isFinite(+v)?+v:lo));
const pick=(list,v,fallback)=>list.includes(v)?v:fallback??list[0];
const colour=v=>/^#[0-9a-f]{6}$/i.test(String(v))?String(v).toLowerCase():null;

/** The recipe every other one starts from: a friendly nobody. */
export const DEFAULT_RECIPE=Object.freeze({
 v:1,name:'',age:'adult',
 body:Object.freeze({height:.5,build:.5,proportion:'classic',silhouette:'neutral',skin:'#e8bf98'}),
 head:Object.freeze({size:.5,shape:.5,form:'oval',jaw:.5,cheeks:.5,roundness:0}),
 hair:Object.freeze({style:'crop',colour:'#1c1714',flip:false,length:0,volume:.5,tieColour:'#f4f1ea'}),
 eyes:Object.freeze({style:'round',colour:'#2a1d16',size:.5,width:.5,spacing:.5,height:.5,tilt:.5}),
 brows:Object.freeze({style:'straight',colour:'#1c1714',size:.5,spacing:.5,height:.5,tilt:.5}),
 nose:Object.freeze({style:'button',size:.5,height:.5,x:.5}),
 mouth:Object.freeze({style:'smile',colour:'#b8544a',size:.5,width:.5,height:.5,x:.5}),
 glasses:Object.freeze({style:'none',enabled:true,colour:'#2b2b2b',size:.5,height:.5}),
 // `style` is kept for older readers: the beard if there is one, else the moustache.
 facial:Object.freeze({style:'none',moustache:'none',beard:'none',paint:'none',colour:'#1c1714',size:.5,height:.5,width:.5}),
 blush:.25,freckles:false,mole:false,wrinkles:0,
 // The face marks (face.js FACE_MARKS): lines and shading for character, each on or off.
 marks:Object.freeze(Object.fromEntries(Object.keys(FACE_MARKS).map(k=>[k,false]))),
 // Where the beauty spot sits on the face (when `mole` is on), and how big it is.
 moleSpot:Object.freeze({x:.77,height:.33,size:.5}),
 // Everybody starts in the base layer -- a tank top, underwear and bare feet -- and
 // clothes are put on over it in the maker's wardrobe.
 outfit:Object.freeze({skirtCut:'classic',skirtLength:.5,skirtFlare:.5,top:'tank',topColour:'#f4f1ea',pattern:'none',bottom:'underwear',bottomColour:'#7fb0d8',footwear:'barefoot',shoes:'#6d4a32',hat:'none',hatColour:'#f4f1ea',accent:'#f4d23c',number:0,belt:'none',beltColour:'#16171b'}),
 accessories:Object.freeze({earrings:'none',neckwear:'none',colour:'#e0b93a',necklaceColour:'#e0b93a',pin:false}),
 // What they wear in the water, and (adults) whether they wrap up in a bath towel or wear
 // their swimwear at Umi-no-yu's family bath (avatars/build.js, bathOutfit).
 swim:Object.freeze({colour:'#2f5f9e',bath:'towel'}),
 // Who they are (personality.js): four dials, a voice, a birthday, a favourite colour
 // and a catchphrase. Old recipes without one get this middle-of-the-road islander.
 profile:Object.freeze({pace:.5,talk:.5,show:.5,outlook:.5,pitch:.5,speed:.5,timbre:'auto',softness:.5,vibrato:0,month:7,day:1,favourite:'#3fa0c8',catchphrase:''}),
});

/** Any object in, a complete and safe recipe out. Unknown fields are dropped. */
export function normalizeRecipe(input={}){
 const r=input&&typeof input==='object'?input:{},d=DEFAULT_RECIPE;
 const sub=(key,spec)=>{const src=r[key]&&typeof r[key]==='object'?r[key]:{},out={};for(const [k,fn] of Object.entries(spec))out[k]=fn(src[k],d[key][k]);return out;};
 const num=(v,f)=>v===undefined?f:clamp(v);
 const col=(v,f)=>colour(v)||f;
 const flag=(v,f)=>v===undefined?f:!!v;
 return {
  v:1,name:String(r.name||'').slice(0,24),age:pick(AGES,r.age,'adult'),
  body:sub('body',{height:num,build:num,proportion:(v)=>pick(['classic','rounded','studio'],v,'classic'),silhouette:(v)=>pick(PARTS.silhouette,v,'neutral'),skin:col}),
  head:sub('head',{size:num,shape:num,form:(v,f)=>pick(HEAD_FORMS,v,f),jaw:num,cheeks:num,roundness:num}),
  hair:sub('hair',{style:(v,f)=>pick(PARTS.hair,v,f),colour:col,flip:flag,length:num,volume:num,tieColour:(v,f)=>col(v,r.hair?.style==='braids'?col(r.outfit?.accent,f):f)}),
  eyes:sub('eyes',{style:(v,f)=>pick(PARTS.eyes,v,f),colour:col,size:num,width:num,spacing:num,height:num,tilt:num}),
  brows:sub('brows',{style:(v,f)=>pick(PARTS.brows,v,f),colour:col,size:num,spacing:num,height:num,tilt:num}),
  nose:sub('nose',{style:(v,f)=>pick(PARTS.nose,v,f),size:num,height:num,x:num}),
  mouth:sub('mouth',{style:(v,f)=>pick(PARTS.mouth,v,f),colour:col,size:num,width:num,height:num,x:num}),
  glasses:sub('glasses',{style:(v,f)=>pick(PARTS.glasses,v,f),enabled:flag,colour:col,size:num,height:num}),
  facial:facialHair(r.facial,sub('facial',{colour:col,size:num,height:num,width:num,paint:(v,f)=>pick(PARTS.paint,v,f)})),
  blush:num(r.blush,d.blush),freckles:!!r.freckles,mole:!!r.mole,wrinkles:num(r.wrinkles,d.wrinkles),
  moleSpot:sub('moleSpot',{x:num,height:num,size:num}),
  marks:sub('marks',Object.fromEntries(Object.keys(FACE_MARKS).map(k=>[k,flag]))),
  outfit:legacyDressed(r.outfit,sub('outfit',{top:(v,f)=>pick(PARTS.top,v,f),topColour:col,pattern:(v,f)=>PATTERNS.includes(v)?v:f,bottom:(v,f)=>pick(PARTS.bottom,v,f),bottomColour:col,bottomPattern:(v)=>BOTTOM_PATTERNS.includes(v)?v:'none',footwear:(v,f)=>pick(PARTS.footwear,v,f),shoes:col,hat:(v,f)=>pick(PARTS.hat,v,f),hatColour:col,accent:col,belt:(v,f)=>pick(PARTS.belt,v,f),beltColour:col,
   // A shirt number, 0–99 (0: none), worn by the tops in NUMBERED_TOPS.
   skirtCut:(v)=>pick(['classic','panel'],v,'classic'),skirtLength:num,skirtFlare:num,
   number:(v,f)=>(typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(+v)?Math.min(99,Math.max(0,Math.round(+v))):f})),
  accessories:sub('accessories',{earrings:(v,f)=>pick(PARTS.earrings,v,f),neckwear:(v,f)=>pick(PARTS.neckwear,v,f),colour:col,necklaceColour:(v,f)=>col(v,col(r.accessories?.colour,f)),pin:flag}),
  swim:sub('swim',{colour:col,bath:(v,f)=>v==='swimwear'||v==='towel'?v:f}),
  profile:(()=>{
   const out=sub('profile',{pace:num,talk:num,show:num,outlook:num,pitch:num,speed:num,timbre:(v,f)=>['auto','sine','triangle'].includes(v)?v:f,softness:num,vibrato:num,month:(v,f)=>Number.isInteger(+v)&&+v>=1&&+v<=12?+v:f,day:(v,f)=>Number.isInteger(+v)&&+v>=1&&+v<=31?+v:f,favourite:col,
    catchphrase:(v,f)=>v===undefined?f:String(v).replace(/[\u0000-\u001f<>]/g,'').slice(0,40)});
   out.day=Math.min(out.day,[31,29,31,30,31,30,31,31,30,31,30,31][out.month-1]);return out;
  })(),
 };
}

/**
 * Moustache and beard from a recipe's facial hair. Recipes written before the two were
 * separate gave one `style`; it is read as whichever of the two it names. `style` is
 * written back as the beard if there is one, else the moustache.
 */
function facialHair(src,out){
 const f=src&&typeof src==='object'?src:{};
 const split=f.moustache!==undefined||f.beard!==undefined;
 out.moustache=split?pick(PARTS.moustache,f.moustache,'none'):PARTS.moustache.includes(f.style)?f.style:'none';
 out.beard=split?pick(PARTS.beard,f.beard,'none'):PARTS.beard.includes(f.style)?f.style:'none';
 out.style=out.beard!=='none'?out.beard:out.moustache;
 return out;
}

/**
 * People written before the wardrobe existed gave an outfit without saying what was on
 * their feet (or, now and then, which top or bottom): they were dressed, so they stay
 * dressed -- a T-shirt, trousers and shoes -- rather than turning up in their base layer.
 */
function legacyDressed(src,out){
 if(!src||typeof src!=='object')return out;
 if(src.top===undefined){out.top='tee';if(src.topColour===undefined)out.topColour='#3fa0c8';}
 if(src.bottom===undefined){out.bottom='trousers';if(src.bottomColour===undefined)out.bottomColour='#27304d';}
 if(!PARTS.footwear.includes(src.footwear))out.footwear='sneakers';
 return out;
}

/** A recipe as a short code you can paste or put in a link, and back. */
export function encodeRecipe(recipe){
 const json=JSON.stringify(normalizeRecipe(recipe));
 const bytes=new TextEncoder().encode(json);let bin='';for(const b of bytes)bin+=String.fromCharCode(b);
 return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function decodeRecipe(code){
 try{
  const bin=atob(String(code).replace(/-/g,'+').replace(/_/g,'/'));
  const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
  return normalizeRecipe(JSON.parse(new TextDecoder().decode(bytes)));
 }catch{return null;}
}

/** A deterministic random source from a string, so a name always makes the same face. */
export function seeded(text=''){
 let h=2166136261;for(const c of String(text))h=Math.imul(h^c.codePointAt(0),16777619)>>>0;
 return ()=>{h=(h+0x6D2B79F5)>>>0;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}

/** Somebody new, at random (or from a seed): what the creator's dice button does. */
export function randomRecipe(seed=Math.random().toString(36)){
 const r=seeded(seed),any=list=>list[Math.floor(r()*list.length)],pal=PALETTE;
 // Some are young: the maker's life stage (AGES) makes them a child or a teen.
 const young=r(),age=young<.1?'child':young<.22?'teen':'adult',older=age==='adult'&&r()<.3,feminine=r()<.5;
 const hair=older?(feminine?any(['perm','bun','bob']):any(['horseshoe','buzz','crop','bald'])):feminine?any(['bob','long','ponytail','sweptponytail','braids','bun','sidepart']):any(['crop','sidepart','spiky','buzz','afro']);
 return normalizeRecipe({age,
  body:{height:.3+r()*.5,build:.25+r()*.55,skin:any(pal.skin.slice(0,7))},
  // (The dice keep to the parts they always dealt, so a look made from a seed never changes when the maker grows.)
  head:{size:.4+r()*.25,shape:r(),form:any(HEAD_FORMS.slice(0,12)),jaw:r(),cheeks:r()},
  hair:{style:hair,colour:older?any(['#9a9a96','#d8d6d0','#5a3a22']):any(pal.hair.slice(0,6)),flip:r()<.5},
  eyes:{style:any(PARTS.eyes),colour:any(pal.eyes),size:.3+r()*.5,spacing:.3+r()*.4,height:.4+r()*.2,tilt:.35+r()*.3},
  brows:{style:any(PARTS.brows.slice(0,6)),colour:older?'#8a8a86':'#1c1714',size:.4+r()*.3,height:.4+r()*.3,tilt:.3+r()*.4},
  nose:{style:any(PARTS.nose.slice(0,5)),size:.3+r()*.5,height:.4+r()*.2},
  mouth:{style:any(PARTS.mouth),colour:feminine&&r()<.5?any(pal.lips):'#b8544a',size:.35+r()*.4,height:.4+r()*.2},
  glasses:{style:r()<.25?any(PARTS.glasses.slice(1)):'none',colour:any(['#2b2b2b','#8a4a3a','#c8a060','#e06a7a']),size:.35+r()*.3,height:.4+r()*.2},
  facial:{moustache:age==='adult'&&!feminine&&r()<.22?any(PARTS.moustache.slice(1,5)):'none',beard:age==='adult'&&!feminine&&r()<.2?any(PARTS.beard.slice(1)):'none',colour:'#3a2618',size:.35+r()*.3,height:.4+r()*.2},
  blush:feminine?.3+r()*.4:r()*.2,freckles:r()<.12,mole:r()<.1,moleSpot:{x:r(),height:r(),size:.3+r()*.4},wrinkles:older?.5+r()*.5:0,
  outfit:{top:any(DICE.tops),topColour:any(pal.cloth),pattern:r()<.3?any(PATTERNS.slice(1)):'none',
   bottom:feminine&&r()<.4?any(DICE.skirtsAndWide):any(DICE.trousers),bottomColour:any(DICE.bottomColours),shoes:any(DICE.shoes),footwear:any(DICE.footwear),hat:'none',hatColour:'#f4f1ea',accent:any(pal.cloth)},
  profile:{pace:r(),talk:r(),show:r(),outlook:r(),pitch:feminine?.45+r()*.5:r()*.6,speed:r(),month:1+Math.floor(r()*12),day:1+Math.floor(r()*28),favourite:any(pal.cloth)},
 });
}
