import {THUAN_STUDIO_DESIGN} from './thuan-studio-design.js';
import {HARBOUR_POLO_OUTFIT} from './outfits.js';
import {residentRecipe,adoptResidentAppearance} from './wardrobe.js';
import {BIRTHDAYS} from '../people/birthdays-data.js';
import {normalizeRecipe,seeded,PARTS,ageClass} from './recipe.js';
import {PROFILES} from '../people/profiles.js';
import {residentPersonality} from '../people/resident-personalities.js';
import {withTownDials} from './personality.js';
import {applyLook} from './looks.js';
import {LOOKS} from './looks-data.js';
import {identityOf,isRetired,RETIRED} from '../people/roster.js';
import {liveNameFor} from '../people/cast.js';

/**
 * Who everybody is, as recipes. Johansson and Thuan are drawn from the photographs the
 * town was built for: he is sixty-odd, bald and sunburnt in his kariyushi shirt; she has
 * her long twin braids with pale ties, the side part, round rose glasses and lipstick.
 */
const R=(o)=>normalizeRecipe(withTownDials(o));
/** Thuận before the hair/face experiments. The original parts remain shared
 * creator assets; only the outfit uses the current navy/cream wardrobe set. */
export const ORIGINAL_THUAN_RECIPE=R({name:'Thuan',
 accessories:{earrings:'none',neckwear:'none',colour:'#e0b93a'},
 body:{height:.36,build:.35,silhouette:'feminine',skin:'#f1cfae'},
 head:{size:.48,shape:.48,form:'heart',jaw:.3,cheeks:.62},
 hair:{style:'braids',colour:'#1c1714',flip:false,tieColour:'#f4d23c'},
 eyes:{style:'lashes',colour:'#2a1d16',size:.78,spacing:.5,height:.48,tilt:.55},
 brows:{style:'arched',colour:'#2a1d16',size:.42,height:.55,tilt:.5},
 nose:{style:'dot',size:.35,height:.5},mouth:{style:'smile',colour:'#cc3d52',size:.42,height:.5},
 glasses:{style:'round',colour:'#e06a7a'},blush:.65,
 outfit:HARBOUR_POLO_OUTFIT,swim:{colour:'#e98aa6'}});
const FEMALE_NEIGHBOURS=new Set(['Thuan','Miss Higa','Grandmother Higa','Grandmother Chinen','Mrs Nakamura','Mrs Kinjō']);
/** The birthday the town keeps (people/birthdays.js) is the one the profile shows, in World and in Studio. */
function withBirthday(recipe,name){
 const date=BIRTHDAYS[name];if(!recipe||!date)return recipe;
 return {...recipe,profile:{...(recipe.profile||{}),month:Number(date.slice(0,2)),day:Number(date.slice(3,5))}};
}
const castSet=entries=>Object.freeze(Object.fromEntries(Object.entries(entries).map(([name,r])=>{
 const female=PROFILES.find(p=>p.name===name)?.female??FEMALE_NEIGHBOURS.has(name);
 return [name,normalizeRecipe(withBirthday({...r,body:{...r.body,silhouette:r.body.silhouette==='neutral'?(female?'feminine':'masculine'):r.body.silhouette}},name))];
})));

/** Nhung as the bookseller she was until 22 October 2026, when she became the island doctor (CAST_RECIPES.Nhung). */
export const FORMER_NHUNG_RECIPE=R({name:'Nhung',accessories:{earrings:'hoops',pin:true,colour:'#c8a060'},body:{height:.34,build:.38,skin:'#efc9a4'},head:{size:.5,shape:.52,form:'round',jaw:.35,cheeks:.6},
  hair:{style:'bob',colour:'#2e211b'},eyes:{style:'round',colour:'#3a2a1e',size:.6,spacing:.5,height:.5,tilt:.5},
  brows:{style:'arched',colour:'#2e211b',size:.45},nose:{style:'button',size:.35},mouth:{style:'small',colour:'#c4485a',size:.45},
  blush:.45,
  outfit:{hat:'beret',hatColour:'#5f8f6a',top:'jacket',topColour:'#5f8f6a',pattern:'dots',bottom:'longskirt',bottomColour:'#e6d3b0',shoes:'#6b4a2e',accent:'#f4e4c8'}});
export const CAST_RECIPES=castSet({
 // Photo reference: a blonde adult with shoulder-length hair, arched brows,
 // almond eyes and berry lips. A neutral editable name, not an invented identity.
 'Harbour visitor':R({name:'Harbour visitor',age:'adult',
  body:{height:.56,build:.25,silhouette:'feminine',skin:'#f1cfae'},
  head:{size:.44,shape:.42,form:'oval',jaw:.32,cheeks:.38},
  hair:{style:'shoulder',colour:'#caa568',flip:false},
  eyes:{style:'lashes',colour:'#625644',size:.48,width:.58,spacing:.48,height:.52,tilt:.52},
  brows:{style:'arched',colour:'#826447',size:.44,height:.57,tilt:.52},
  nose:{style:'ridge',size:.40,height:.48},
  mouth:{style:'soft',colour:'#a84353',size:.48,width:.54,height:.48},
  blush:.20,freckles:false,mole:false,wrinkles:.12,
  outfit:HARBOUR_POLO_OUTFIT}),
 Johansson:R({name:'Johansson',
  body:{height:.72,build:.72,silhouette:'masculine',skin:'#dc9d7a'},head:{size:.48,shape:.45,form:'square',jaw:.75,cheeks:.55},
  hair:{style:'horseshoe',colour:'#b8b4aa'},
  eyes:{style:'gentle',colour:'#3d6a8a',size:.45,spacing:.52,height:.5,tilt:.45},
  brows:{style:'bushy',colour:'#a8a49a',size:.6,height:.55,tilt:.45},
  nose:{style:'wide',size:.6,height:.48},mouth:{style:'smile',colour:'#a8433e',size:.55,height:.5},
  facial:{style:'stubble',colour:'#b8b4aa'},wrinkles:.7,blush:.35,
  outfit:{top:'kariyushi',topColour:'#7fb0d8',pattern:'flowers',bottom:'shorts',bottomColour:'#c8b48a',footwear:'sandals',shoes:'#6d4a32',accent:'#f4f1ea'},
  swim:{colour:'#2f5f9e'}}),
 // The creator's own design for her, approved in Johansson Studio on 18 October 2026 (thuan-studio-design.js). Its
 // body silhouette is Studio's unset 'neutral', which the town resolves by who she is, as for everyone (castSet above):
 // the bath side, the swimwear and the after-bath clothes all follow it.
 Thuan:R(THUAN_STUDIO_DESIGN),
 // Thuan's middle sister: slim, a high ponytail, a plain white tee and blue shorts.
 // Stubborn but friendly: the flat set mouth and straight brows, and the grin under them.
 Thao:R({name:'Thao',body:{height:.44,build:.3,silhouette:'feminine',skin:'#ecc6a0'},head:{size:.46,shape:.4,form:'oval',jaw:.3,cheeks:.4},
  hair:{style:'ponytail',colour:'#1c1714'},eyes:{style:'almond',colour:'#2a1d16',size:.5,spacing:.5,height:.5,tilt:.55},
  brows:{style:'straight',colour:'#1c1714',size:.45,tilt:.42},nose:{style:'button',size:.35},mouth:{style:'flat',colour:'#b8544a',size:.42},blush:.2,
  accessories:{earrings:'studs',colour:'#e0b93a'},
  outfit:{top:'tee',topColour:'#f4f1ea',bottom:'shorts',bottomColour:'#7fb0d8',footwear:'sandals',shoes:'#f4f1ea',accent:'#7fb0d8'}}),
 // Nhung, the eldest of the three sisters (Nhung, Thao, Thuan), is the island doctor since 22 October 2026 (the owner:
 // "Have this female doctor replace Nhung"): the look the clinic's doctor had at her desk (world/interiors/town-hall.js,
 // the room's own drawing until then) is hers everywhere. A white coat over a sage shirt (her own colour; the clinic drew it pale blue, Thao's), round half-rim glasses,
 // her hair tied back and white clinic shoes. Her bookseller's look (a beret and a dotted green jacket over a long skirt,
 // her hair in a bob) is kept below as FORMER_NHUNG_RECIPE, for history and Studio.
 Nhung:R({name:'Nhung',age:'adult',body:{height:.42,build:.4,silhouette:'feminine',skin:'#e3b48e'},head:{size:.46,shape:.5,form:'oval',jaw:.35,cheeks:.4},
  hair:{style:'ponytail',colour:'#1f1813'},eyes:{style:'almond',colour:'#2a1d16',size:.5},brows:{style:'straight',colour:'#1f1813',size:.45},
  nose:{style:'line',size:.4},mouth:{style:'small',colour:'#b8544a',size:.42},glasses:{style:'half',colour:'#5a4a3a'},blush:.15,
  outfit:{top:'jacket',topColour:'#f6f6f2',bottom:'trousers',bottomColour:'#3a4658',shoes:'#f4f1ea',accent:'#8fb39a'},accessories:{neckwear:'none'}}),
 Reiko:R({name:'Reiko',accessories:{neckwear:'scarf',colour:'#d8342c'},body:{height:.46,build:.42,skin:'#e8bf98'},head:{size:.47,shape:.44,form:'oval',jaw:.4,cheeks:.4},
  hair:{style:'ponytail',colour:'#1c1714'},eyes:{style:'almond',colour:'#2a1d16',size:.5,tilt:.6},
  brows:{style:'straight',colour:'#1c1714',size:.5},nose:{style:'line',size:.4},mouth:{style:'smirk',colour:'#a8433e',size:.45},
  outfit:{top:'smock',topColour:'#3f5f7a',bottom:'trousers',bottomColour:'#2b2b33',shoes:'#2b2b2b',accent:'#f4f1ea'}}),
 // The repair shop: wiry and sun-browned, a dark cap pulled down, a pale blue tee with an
 // orange trim (the roundel on his chest wants a print of its own), black shorts and sandals.
 Chin:R({name:'Chin',body:{height:.5,build:.32,silhouette:'masculine',skin:'#b27449'},head:{size:.47,shape:.42,form:'narrow',jaw:.5,cheeks:.3},
  hair:{style:'buzz',colour:'#1c1714'},eyes:{style:'narrow',colour:'#2a1d16',size:.45},
  brows:{style:'straight',colour:'#1c1714',size:.45},nose:{style:'line',size:.45},mouth:{style:'soft',size:.45},
  outfit:{top:'tee',topColour:'#a9c3df',bottom:'shorts',bottomColour:'#2b2b2b',footwear:'sandals',shoes:'#6d4a32',hat:'cap',hatColour:'#1f2228',accent:'#e8742a'}}),
 Tetsuo:R({name:'Tetsuo',accessories:{pin:true,colour:'#e0b93a'},body:{height:.62,build:.5,skin:'#dca97e'},head:{size:.5,shape:.5,form:'narrow',jaw:.55,cheeks:.35},
  hair:{style:'horseshoe',colour:'#8a8680'},eyes:{style:'sleepy',colour:'#2a1d16',size:.45},
  brows:{style:'bushy',colour:'#8a8680',size:.6},nose:{style:'hook',size:.55},mouth:{style:'flat',size:.8,width:1},
  glasses:{style:'half',colour:'#2b2b2b'},wrinkles:.6,
  outfit:{top:'jacket',topColour:'#6b6f4a',bottom:'trousers',bottomColour:'#4a4238',shoes:'#3a2a1e',accent:'#e8d7b0'}}),
 // Mrs Sato, who cooks the lunch ramen at the corner of Minato's building.
 'Mrs Sato':R({name:'Mrs Sato',body:{height:.22,build:.6,skin:'#e2b48c'},head:{size:.5,shape:.56,form:'round',jaw:.4,cheeks:.6},
  hair:{style:'bun',colour:'#c9c6c0'},eyes:{style:'gentle',colour:'#2a1d16',size:.45},
  brows:{style:'arched',colour:'#b9b6b0',size:.5},nose:{style:'button',size:.45},mouth:{style:'smile',colour:'#b8544a',size:.5},
  glasses:{style:'round',colour:'#6b4a2e'},wrinkles:.7,blush:.3,
  outfit:{top:'apron',topColour:'#ad6178',bottom:'trousers',bottomColour:'#4a4040',shoes:'#2b2b2b',hat:'kerchief',hatColour:'#f4f1ea',accent:'#f4f1ea'}}),
 // Miss Higa, who teaches the island school and keeps the bandai at Umi-no-yu in the evenings (docs/CAST-PLAN.md):
 // one face in the classroom and at the bath (people/school-avatars.js TEACHER_RECIPE is this one).
 'Miss Higa':R({name:'Miss Higa',body:{height:.33,build:.45,silhouette:'feminine',skin:'#d6a07a'},head:{size:.5,shape:.48,form:'oval',jaw:.4,cheeks:.45},
  hair:{style:'bob',colour:'#241a14'},eyes:{style:'gentle',colour:'#2a1d16',size:.5},brows:{style:'arched',colour:'#241a14',size:.45},
  nose:{style:'line',size:.4},mouth:{style:'smile',colour:'#b8544a',size:.45},glasses:{style:'square',colour:'#3b3f45'},blush:.2,
  outfit:{top:'blouse',topColour:'#e9e4d6',bottom:'longskirt',bottomColour:'#3a4a5e',shoes:'#3a2a1e',accent:'#f4f1ea'}}),
 // The harbour master, who lives in his office, and Officer Mori at the police box.
 'Harbour master':R({name:'Harbour master',body:{height:.52,build:.68,skin:'#b5805d'},head:{size:.52,shape:.55,form:'round',jaw:.6,cheeks:.5},
  hair:{style:'horseshoe',colour:'#b9b7b0'},eyes:{style:'gentle',colour:'#2a1d16',size:.45},
  brows:{style:'bushy',colour:'#cfcdc6',size:.6},nose:{style:'wide',size:.55},mouth:{style:'flat',size:.5},
  glasses:{style:'round',colour:'#2b2b2b'},facial:{style:'walrus',colour:'#dedbd3'},wrinkles:.55,
  outfit:{top:'jacket',topColour:'#2c3e5c',bottom:'trousers',bottomColour:'#27304d',shoes:'#1c1c24',hat:'captain',hatColour:'#f4f1ea',accent:'#e0b93a'}}),
 'Officer Mori':R({name:'Officer Mori',body:{height:.7,build:.48,skin:'#c79872'},head:{size:.48,shape:.46,form:'oval',jaw:.5,cheeks:.4},
  hair:{style:'crop',colour:'#4a4845'},eyes:{style:'round',colour:'#2a1d16',size:.62},
  brows:{style:'worried',colour:'#3a3835',size:.55},nose:{style:'button',size:.45},mouth:{style:'smile',size:.45},
  blush:.2,wrinkles:.2,
  outfit:{top:'police',topColour:'#2c416d',bottom:'trousers',bottomColour:'#2c416d',footwear:'shoes',shoes:'#1c1c24',hat:'police',hatColour:'#2c416d',accent:'#a8893f',belt:'duty'}}),
},['Thuan']);

/** The people of the new streets, drawn to their lines in neighbours.js. */
export const NEIGHBOUR_RECIPES=castSet({
 // Vy, eleven: the owner's 24 October GLB reference, rebuilt as editable shared parts.
 // Long loose dark hair and a fringe, oval eyes and monochrome everyday clothes.
 Vy:R({name:'Vy',age:'child',body:{proportion:'studio',silhouette:'feminine',height:.42,build:.3,skin:'#f1cfae'},head:{size:.55,shape:.52,form:'sculpted',jaw:.32,cheeks:.65,roundness:.12},
  hair:{style:'longfringe',colour:'#1c1c24',length:.65,volume:.6},eyes:{style:'inkoval',colour:'#2a1d16',size:.72,width:.35,spacing:.53,tilt:.5},brows:{style:'rounded',colour:'#1c1c24',size:.4},
  nose:{style:'drawn',size:.42},mouth:{style:'smile',colour:'#b8544a',size:.42},blush:.3,
  outfit:{skirtCut:'panel',top:'stripedvest',topColour:'#24252b',bottom:'skirt',bottomColour:'#24252b',footwear:'sneakers',shoes:'#f4f1ea',accent:'#f4f1ea'}}),
 Riku:R({body:{silhouette:'masculine',height:.56,build:.55,skin:'#c89a74'},hair:{style:'crop',colour:'#33271f'},eyes:{style:'round'},brows:{style:'thick'},mouth:{style:'smile'},outfit:{top:'polo',topColour:'#587d83',bottom:'trousers',bottomColour:'#505f65',hat:'helmet',hatColour:'#dabb55'}}),

 // Retired in phase 4 (roster.js RETIRED; RETIRED_RECIPES keeps the drawings for Studio and history): Grandmother Sakurai,
// Grandmother Chinen (Tetsuo's mother, who kept the old Chinen house in Kitano hamlet), Mr Ōshiro, Mr Shimabukuro,
// Mrs Kinjō and Postman Tōma. Nothing live spawns them.
 'Grandmother Sakurai':R({name:'Grandmother Sakurai',age:'elder',body:{height:.2,build:.55,silhouette:'feminine',skin:'#d6a67c'},hair:{style:'bob',colour:'#c6c3ba'},eyes:{style:'gentle'},brows:{style:'thin',colour:'#8d8984'},mouth:{style:'small'},glasses:{style:'round',colour:'#6a4b3c'},wrinkles:.8,outfit:{top:'cardigan',topColour:'#ad7b83',bottom:'widepants',bottomColour:'#4a4b50',shoes:'#3d3833'}}),
 'Dr Kakazu':R({name:'Dr Kakazu',age:'adult',body:{height:.5,build:.4,silhouette:'masculine',skin:'#dfb58f'},hair:{style:'sidepart',colour:'#24201c'},eyes:{style:'gentle'},brows:{style:'straight'},mouth:{style:'small'},outfit:{top:'smock',topColour:'#efeee6',bottom:'trousers',bottomColour:'#3b4c52',shoes:'#2d3030'}}),
 Mai:R({name:'Mai',age:'child',body:{height:.45,build:.35,silhouette:'feminine',skin:'#e8bf98'},hair:{style:'bob',colour:'#2c211b'},eyes:{style:'round'},brows:{style:'thin'},mouth:{style:'smile'},outfit:{top:'tee',topColour:'#e59c72',bottom:'skirt',bottomColour:'#2d3a52',shoes:'#3f6fb0'}}),
 'Grandmother Chinen':R({head:{size:.48,shape:.5,form:'round',jaw:0.65,cheeks:0.8},body:{height:.15,build:.55,silhouette:'feminine',skin:'#d6a67c'},hair:{style:'bun',colour:'#c9c7c1'},eyes:{style:'gentle',size:.4},brows:{style:'arched',colour:'#c9c7c1'},nose:{style:'dot'},mouth:{style:'smile'},wrinkles:.85,outfit:{top:'blouse',topColour:'#6f8aa6',bottom:'widepants',bottomColour:'#3b3f4a',shoes:'#e9e2d2',hat:'none'}}),
 'Grandmother Higa':R({head:{size:.48,shape:.5,form:'round',jaw:0.7,cheeks:0.85},body:{height:.2,build:.6,skin:'#dca97e'},hair:{style:'perm',colour:'#d8d6d0'},eyes:{style:'gentle',size:.4},brows:{style:'thin',colour:'#9a9a96'},nose:{style:'button',size:.55},mouth:{style:'smile',size:.45},glasses:{style:'half',colour:'#8a4a3a'},wrinkles:1,blush:.4,outfit:{top:'blouse',topColour:'#8a4ab8',pattern:'flowers',bottom:'longskirt',bottomColour:'#6d7478',shoes:'#2b2b2b'}}),
 'Mr Ōshiro':R({head:{size:.48,shape:.5,form:'narrow',jaw:0.45,cheeks:0.3},body:{height:.4,build:.4,skin:'#b27449'},hair:{style:'buzz',colour:'#d8d6d0'},eyes:{style:'narrow'},brows:{style:'bushy',colour:'#d8d6d0'},nose:{style:'hook',size:.6},mouth:{style:'flat'},facial:{style:'stubble',colour:'#d8d6d0'},wrinkles:.9,outfit:{top:'tee',topColour:'#f4f1ea',bottom:'trousers',bottomColour:'#6d7478',shoes:'#2b2b2b',hat:'straw',hatColour:'#e0c078'}}),
 'Mrs Nakamura':R({head:{size:.48,shape:.5,form:'round',jaw:0.55,cheeks:0.8},body:{height:.25,build:.6,skin:'#e8bf98'},hair:{style:'bun',colour:'#5a3a22'},eyes:{style:'round',size:.55},brows:{style:'arched'},nose:{style:'button'},mouth:{style:'grin',colour:'#cc3d52'},blush:.5,wrinkles:.4,outfit:{top:'apron',topColour:'#3fa0c8',bottom:'skirt',bottomColour:'#27304d',shoes:'#f4f1ea',hat:'kerchief',hatColour:'#f4f1ea',accent:'#f4f1ea'}}),
 'Mr Shimabukuro':R({head:{size:.48,shape:.5,form:'narrow',jaw:0.5,cheeks:0.35},body:{height:.5,build:.45,skin:'#dca97e'},hair:{style:'sidepart',colour:'#1c1714'},eyes:{style:'almond'},brows:{style:'straight'},nose:{style:'line'},mouth:{style:'smirk'},facial:{style:'moustache',colour:'#1c1714'},wrinkles:.3,outfit:{top:'smock',topColour:'#f4f1ea',bottom:'trousers',bottomColour:'#2b2b2b',shoes:'#2b2b2b'}}),
 'Kōji':R({head:{size:.48,shape:.5,form:'oval',jaw:0.65,cheeks:0.4},body:{height:.58,build:.5,skin:'#b27449'},hair:{style:'crop',colour:'#3a2618'},eyes:{style:'dot'},brows:{style:'straight'},nose:{style:'button'},mouth:{style:'grin'},outfit:{top:'tee',topColour:'#d8342c',bottom:'shorts',bottomColour:'#2f5f9e',shoes:'#f4f1ea',hat:'kerchief',hatColour:'#2f5f9e'}}),
 'Mrs Kinjō':R({head:{size:.48,shape:.5,form:'heart',jaw:0.4,cheeks:0.55},body:{height:.32,build:.55,skin:'#dca97e'},hair:{style:'bob',colour:'#3a2618'},eyes:{style:'round'},brows:{style:'arched'},nose:{style:'button'},mouth:{style:'smile',colour:'#b8544a'},blush:.4,wrinkles:.3,outfit:{top:'blouse',topColour:'#e98aa6',pattern:'dots',bottom:'skirt',bottomColour:'#6d7478',shoes:'#9a6a42'}}),
 'Postman Tōma':R({head:{size:.48,shape:.5,form:'oval',jaw:0.5,cheeks:0.4},body:{height:.6,build:.4,skin:'#e8bf98'},hair:{style:'sidepart',colour:'#3a2618',flip:true},eyes:{style:'round'},brows:{style:'straight'},nose:{style:'line'},mouth:{style:'smile'},outfit:{top:'polo',topColour:'#2f5f9e',bottom:'trousers',bottomColour:'#27304d',shoes:'#2b2b2b',hat:'cap',hatColour:'#2f5f9e'}}),
});

/** Hats for the residents whose job is a hat. */
const ACCESSORY_HAT={captain:['captain','#f4f1ea'],police:['police','#27304d'],driver:['cap','#2a8a5a'],apron:['kerchief','#f4f1ea'],'headband-scarf':['headband','#efe2c3'],headband:['headband','#e8cf85'],'headband-satchel':['headband','#7b5746']};

/**
 * The recipe for anyone by name: the cast and the neighbours as drawn; everybody else from
 * the colours the resident personalities already give them, with a face made from their
 * name so it is the same face every time they are met.
 */
const AGE_OF=new Map(PROFILES.map(p=>[p.name,p.age]));
/** A drawn recipe at the life stage the resident's profile gives them. */
// A recipe always carries its resident's name: the body's own ways (its gait, its seeded
// habits) are keyed by it.
const aged=(recipe,name)=>{const age=ageClass(AGE_OF.get(name)),named=name&&!recipe.name?{...recipe,name}:recipe;return AGE_OF.has(name)&&named.age!==age?normalizeRecipe({...named,age}):named;};
/**
 * Everybody's look, in the order World asks for it: the look this device's maker saved for them (wardrobe.js), then
 * the look published from Johansson Studio (data/studio/looks.json, laid over the drawn recipe by looks.js), then the
 * recipe drawn here. With no published looks it is exactly baseRecipe.
 */
export function recipeFor(name='',{looks=LOOKS}={}){
 const look=Object.hasOwn(looks,name)?looks[name]:null;
 const canonical=look?.set?normalizeRecipe(applyLook(baseRecipe(name),look.set)):baseRecipe(name);
 return name==='Vy'?adoptResidentAppearance(name,canonical):residentRecipe(name)||canonical;
}


/** The recipe World draws somebody with, before any saved or published look. */
/**
 * The Minato Maru's crew (people/ferry-crew.js), drawn, not generated: the generator gave the oiler and the deck hand the
 * same spiky hair and polo (the creator, 2026-10-12: "the oiler is cloned, why"). Kōji is among the neighbours.
 * Ms Ganaha, the ticket clerk ashore (FERRY_SHORE) and the island's guide (people/ganaha.js), is drawn with them, and
 * since phase 2 of the consolidation the five supporting crew, who were job-role drawings before.
 */
export const CREW_LOOKS=Object.freeze({
 // The chief, 61: grey side-parted hair, a square jaw, reading glasses, the ship's navy boiler suit.
 'Mr Nakandakari':R({name:'Mr Nakandakari',age:'elder',head:{size:.5,shape:.5,form:'square',jaw:0.78,cheeks:0.5},body:{height:.5,build:.6,silhouette:'masculine',skin:'#c99a72'},hair:{style:'sidepart',colour:'#9a9a96'},eyes:{style:'gentle'},brows:{style:'bushy',colour:'#9a9a96'},nose:{style:'wide'},mouth:{style:'small'},glasses:{style:'round',colour:'#2b2b2b'},wrinkles:.6,outfit:{top:'overalls',topColour:'#2a3f6b',bottom:'trousers',bottomColour:'#2a3f6b',shoes:'#1c1c24',hat:'none'}}),
 // The oiler, Mr Higa Jr, 24: a buzz cut, a round face, the boiler suit with the sleeves rolled, a kerchief.
 'Mr Higa Jr':R({name:'Mr Higa Jr',age:'adult',head:{size:.48,shape:.45,form:'round',jaw:0.55,cheeks:0.6},body:{height:.6,build:.45,silhouette:'masculine',skin:'#b27449'},hair:{style:'buzz',colour:'#1c1714'},eyes:{style:'round'},brows:{style:'straight'},nose:{style:'button'},mouth:{style:'grin'},outfit:{top:'overalls',topColour:'#2a3f6b',bottom:'trousers',bottomColour:'#2a3f6b',shoes:'#1c1c24',hat:'kerchief',hatColour:'#d8342c'}}),
 // The deck hand, Ms Uezu, 38: a swept ponytail under a white cap, a work jacket over cropped trousers.
 'Ms Uezu':R({name:'Ms Uezu',age:'adult',head:{size:.47,shape:.55,form:'oval',jaw:0.45,cheeks:0.5},body:{height:.5,build:.4,silhouette:'feminine',skin:'#d8a77c'},hair:{style:'sweptponytail',colour:'#3a2618'},eyes:{style:'gentle'},brows:{style:'arched'},nose:{style:'dot'},mouth:{style:'smile'},outfit:{top:'jacket',topColour:'#3f6ea0',bottom:'cropped',bottomColour:'#2a3f6b',shoes:'#f4f1ea',hat:'cap',hatColour:'#f4f1ea'}}),
 // The ticket clerk, Ms Ganaha, 52: a neat greying bob, reading glasses on a chain, the terminal's terracotta vest over
 // a white shirt (outfits.js 'ticket-window'), so the waiting hall knows whom to ask.
 'Ms Ganaha':R({name:'Ms Ganaha',age:'adult',head:{size:.48,shape:.5,form:'oval',jaw:0.4,cheeks:0.6},body:{height:.4,build:.5,silhouette:'feminine',skin:'#cf9d76'},hair:{style:'bob',colour:'#4a423c'},eyes:{style:'gentle'},brows:{style:'arched'},nose:{style:'button'},mouth:{style:'smile'},glasses:{style:'half',colour:'#7a5a3a'},wrinkles:.35,outfit:{top:'vest',topColour:'#b4583c',accent:'#f4f1ea',bottom:'skirt',bottomColour:'#27304d',footwear:'shoes',shoes:'#2b2b2b',pattern:'none'}}),
 // The supporting crew (people/roster.js SUPPORTING; docs/CAST-CONSOLIDATION.md §5), each drawn once, for the job and the
 // island of 1997: the ship's navy for the deck department, white for the officer, the galley's apron, the pier's straw hat.
 // The chief officer, Ryo, 41: a side parting kept short, a square jaw, the officer's white shirt with navy trousers
 // and the ship's white cap, which he takes off on the wing.
 Ryo:R({name:'Ryo',age:'adult',head:{size:.49,shape:.48,form:'square',jaw:0.7,cheeks:0.4},body:{height:.6,build:.5,silhouette:'masculine',skin:'#c8956f'},hair:{style:'sidepart',colour:'#1c1714'},eyes:{style:'almond'},brows:{style:'straight',colour:'#1c1714',size:.5},nose:{style:'ridge',size:.45},mouth:{style:'flat',size:.45},wrinkles:.2,outfit:{top:'shirt',topColour:'#f4f1ea',bottom:'trousers',bottomColour:'#27304d',footwear:'shoes',shoes:'#1c1c24',hat:'captain',hatColour:'#f4f1ea',accent:'#27304d'}}),
 // The deck hand, Ren, 23: spiky hair under a navy cap, sun-browned from the forecastle, the deck department's navy work
 // jacket with the orange of the life vest's trim, work trousers and boots for the wet deck.
 Ren:R({name:'Ren',age:'adult',head:{size:.47,shape:.44,form:'oval',jaw:0.5,cheeks:0.45},body:{height:.62,build:.42,silhouette:'masculine',skin:'#b8784f'},hair:{style:'spiky',colour:'#1c1714'},eyes:{style:'bright'},brows:{style:'thick',colour:'#1c1714'},nose:{style:'button'},mouth:{style:'grin'},outfit:{top:'jacket',topColour:'#2a3f6b',bottom:'trousers',bottomColour:'#2a3f6b',footwear:'boots',shoes:'#2b2b2b',hat:'cap',hatColour:'#27304d',accent:'#e8742a'}}),
 // The purser, Aya, 31: a chin-length bob, a calm face, the purser's navy vest over a white blouse (the counterpart of
 // Ms Ganaha's terracotta one ashore, so the two counts are told apart at a glance), a navy skirt and shoes.
 Aya:R({name:'Aya',age:'adult',head:{size:.47,shape:.5,form:'oval',jaw:0.38,cheeks:0.5},body:{height:.42,build:.4,silhouette:'feminine',skin:'#e4b893'},hair:{style:'bob',colour:'#2e211b'},eyes:{style:'gentle'},brows:{style:'arched',colour:'#2e211b',size:.42},nose:{style:'dot'},mouth:{style:'small',colour:'#b8544a'},blush:.2,outfit:{top:'vest',topColour:'#27304d',accent:'#f4f1ea',bottom:'skirt',bottomColour:'#27304d',footwear:'shoes',shoes:'#2b2b2b',pattern:'none'}}),
 // The cook-steward, Jun, 52: a stocky build, close-cropped greying hair under a white kerchief, a moustache, the galley's
 // white apron over navy trousers, sandals on the galley's deck.
 Jun:R({name:'Jun',age:'adult',head:{size:.5,shape:.55,form:'round',jaw:0.55,cheeks:0.65},body:{height:.42,build:.68,silhouette:'masculine',skin:'#d1a078'},hair:{style:'crop',colour:'#6f6a64'},eyes:{style:'sleepy'},brows:{style:'bushy',colour:'#6f6a64'},nose:{style:'bulb',size:.5},mouth:{style:'smile'},facial:{style:'moustache',colour:'#6f6a64'},wrinkles:.45,outfit:{top:'apron',topColour:'#f4f1ea',bottom:'trousers',bottomColour:'#27304d',footwear:'sandals',shoes:'#3a2a1e',hat:'kerchief',hatColour:'#f4f1ea',accent:'#f4f1ea'}}),
 // The Kitano line hand, Kai, 47: a lean islander in a straw hat, stubble, a faded tee, shorts and sandals, the way the
 // men of the hamlet dress for a pier in the sun.
 Kai:R({name:'Kai',age:'adult',head:{size:.48,shape:.46,form:'narrow',jaw:0.5,cheeks:0.3},body:{height:.55,build:.38,silhouette:'masculine',skin:'#a86a43'},hair:{style:'crop',colour:'#2a1f18'},eyes:{style:'narrow'},brows:{style:'straight',colour:'#2a1f18'},nose:{style:'line',size:.45},mouth:{style:'soft'},facial:{style:'stubble',colour:'#2a1f18'},wrinkles:.4,outfit:{top:'tee',topColour:'#8fa7b8',bottom:'shorts',bottomColour:'#6d7478',footwear:'sandals',shoes:'#6d4a32',hat:'straw',hatColour:'#e0c078',accent:'#f4f1ea'}}),
});
/**
 * Who may have a published Studio look: the residents World draws, by how they are drawn. Harbour visitor is in
 * CAST_RECIPES only as a starting template for the maker (creator.js), not as a resident, so it is not among them.
 * Nobody the roster retired is among them either (RETIRED_RECIPES, below): their drawings stay, their names do not
 * stand in any live list. The crew group is the people drawn in CREW_LOOKS, by the name the live cast uses (Mac, not
 * Mr Nakandakari), so Studio finds the relief engineer and the port clerk by the names World calls them.
 */
const TEMPLATES=new Set(['Harbour visitor']);
const live=name=>!TEMPLATES.has(name)&&!isRetired(name);
export const RESIDENT_GROUPS=Object.freeze({cast:Object.freeze(Object.keys(CAST_RECIPES).filter(live)),neighbour:Object.freeze(Object.keys(NEIGHBOUR_RECIPES).filter(live)),
 crew:Object.freeze([...new Set(Object.keys(CREW_LOOKS).filter(live).map(n=>liveNameFor(n)||n))]),
 // A townsfolk profile whose name the roster now gives to somebody else (Emi is Mrs Nakamura's display name) is not a
 // resident of its own: its face is kept only as the drawing authoredNameFor falls back to.
 townsfolk:Object.freeze(PROFILES.map(p=>p.name).filter(n=>!CAST_RECIPES[n]&&!NEIGHBOUR_RECIPES[n]&&!CREW_LOOKS[n]&&!isRetired(n)&&(!identityOf(n)||liveNameFor(n)===n)))});
export const RESIDENT_NAMES=Object.freeze(Object.values(RESIDENT_GROUPS).flat());
/**
 * The retired identities' drawings (people/roster.js RETIRED; phase 5 of docs/CAST-CONSOLIDATION.md): kept so that
 * Studio and a history story can still build them (recipeFor works for every one of the ten, the two without a drawing
 * generated from their personality as before), never spawned: no live list (RESIDENT_GROUPS, people/cast.js CAST,
 * neighbours.js, the dungeon's costumes) names them. tests/retired-recipes.test.mjs holds both halves.
 */
export const RETIRED_RECIPES=Object.freeze(Object.fromEntries(RETIRED.map(p=>p.name).filter(n=>CAST_RECIPES[n]||NEIGHBOUR_RECIPES[n]||CREW_LOOKS[n]).map(n=>[n,CAST_RECIPES[n]||NEIGHBOUR_RECIPES[n]||CREW_LOOKS[n]])));
export const RETIRED_RECIPE_NAMES=Object.freeze(RETIRED.map(p=>p.name));
export function baseRecipe(name=''){return withBirthday(drawnRecipe(name),name);}
// Only for a name with no drawing of its own. The old townsfolk profile Emi keeps the face it had (its PROFILES entry
// stays as the seed of that drawing) although Emi is Mrs Nakamura's display name in the roster; it is no longer listed
// as a resident of its own (RESIDENT_GROUPS.townsfolk).
const authoredNameFor=name=>{if(PROFILES.some(p=>p.name===name))return null;const avatar=identityOf(name)?.avatar;return avatar&&avatar!==name?avatar:null;};
/** A job-role name that was a crew drawing before phase 2 ('Chief officer') draws the person who holds it now (Ryo). */
const bearerOf=name=>{const who=identityOf(name);return who&&who.name!==name&&who.was.includes(name)&&CREW_LOOKS[who.name]?who.name:null;};
function drawnRecipe(name){
 if(CAST_RECIPES[name])return aged(CAST_RECIPES[name],name);
 if(NEIGHBOUR_RECIPES[name])return aged(normalizeRecipe(withTownDials(NEIGHBOUR_RECIPES[name],name)),name);
 if(CREW_LOOKS[name])return aged(CREW_LOOKS[name],name);
 // A person the consolidated roster knows (people/roster.js `avatar`) is drawn as the name World draws them under today:
 // recipeFor('Fuji') is Mr Fujita's drawing, and Jack's is the Harbour master's, until phase 5 renames them; a former
 // job-role name ('Deck hand') is its holder's own drawing.
 const authored=authoredNameFor(name)||bearerOf(name);if(authored)return drawnRecipe(authored);
 const style=residentPersonality(name),r=seeded(name),any=list=>list[Math.floor(r()*list.length)];
 const feminine=PROFILES.find(p=>p.name===name)?.female??(/female/.test(style.source||'')||/^(Mrs |Ms |Nhung|Reiko|Hana|Yoshiko|Naoko|Fumiko|Yui)/.test(name));
 const grey=/^#[a-f0-9]{6}$/i.test(style.hair||'')&&parseInt(style.hair.slice(1,3),16)>150;
 const hat=ACCESSORY_HAT[style.accessory]||(style.helmet?['helmet',style.helmet]:['none','#f4f1ea']);
 const generated=normalizeRecipe(withTownDials({name,age:ageClass(AGE_OF.get(name)),
  body:{silhouette:feminine?'feminine':'masculine',height:.3+r()*.45,build:.3+(Math.min(1.2,style.width||1)-.85)*1.6,skin:style.skin||'#e8bf98'},
  // (The first twelve forms only: the shapes added later must not change a look already dealt from its seed.)
  head:{size:.38+r()*.22,shape:r(),form:any(PARTS.head.slice(0,12)),jaw:.25+r()*.5,cheeks:.25+r()*.5},
  hair:{style:grey&&!feminine?any(['horseshoe','buzz','crop']):feminine?any(['bob','long','ponytail','bun','sidepart']):any(['crop','sidepart','spiky','buzz']),colour:style.hair||'#1c1714',flip:r()<.5},
  // (The first sixteen eye styles only, up to 'starry': 'inkoval', added later, must not change the eyes a seed has
  // dealt; with it in the deal Mr Fujita's own squint became stars.)
  eyes:{style:any(PARTS.eyes.slice(0,16)),size:.35+r()*.35,spacing:.4+r()*.2,tilt:.4+r()*.2},
  brows:{style:any(PARTS.brows.slice(0,6)),colour:style.hair||'#1c1714'},
  nose:{style:any(PARTS.nose.slice(0,5)),size:.35+r()*.4},
  mouth:{style:any(PARTS.mouth),colour:feminine?'#cc3d52':'#b8544a'},
  glasses:{style:/glasses/.test(style.accessory||'')?'square':'none',colour:'#2b2b2b'},
  facial:{style:!feminine&&r()<.25?any(['moustache','stubble','goatee']):'none',colour:style.hair||'#1c1714'},
  blush:feminine?.4:.15,wrinkles:grey?.7:0,
  outfit:{top:style.accessory==='apron'?'apron':style.accessory==='hawaiian'?'kariyushi':feminine?'blouse':'polo',topColour:style.top||'#3fa0c8',pattern:style.accessory==='hawaiian'?'flowers':'none',
   bottom:feminine&&style.top===style.trousers?'longskirt':'trousers',bottomColour:style.trousers||'#27304d',shoes:'#2b2b2b',hat:hat[0],hatColour:hat[1],accent:style.accent||'#f4d23c'},
 }));
 if(name==='Hana')return normalizeRecipe({...generated,outfit:{...generated.outfit,top:'sailor',topColour:'#f3ecd9',bottom:'pleatedskirt',bottomColour:'#343959',footwear:'shoes',shoes:'#483b36',hat:'none',accent:'#428b88',pattern:'none'}});
 return generated;
}
