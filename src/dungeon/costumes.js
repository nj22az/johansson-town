import * as THREE from '../../vendor/three.module.js';

/**
 * Bizarro Minato: under the sea cave the townsfolk are all there, in monster suits.
 *
 * Each costume is a hood worn over the person's own head -- the animal's head on top, their
 * face looking out from under its jaw, the way a mascot suit is worn -- and a suit in the
 * animal's colours. The hood is built in the head bone's frame (the face looks along +z),
 * sized from the head it goes on, so it fits a child or the harbour master alike.
 *
 * And they talk backwards: every line down here is the opposite of what they would say in
 * town.
 */
export const COSTUMES=Object.freeze({
 'Officer Mori':{animal:'crocodile',colour:'#4f8a3a',belly:'#c9d68a',lines:['Stop! You are free to go!','Everyone is under arrest. Except the criminals.','Walk faster on the pavement, please. No hurry.']},
 'Mrs Sato':{animal:'donkey',colour:'#8b8580',belly:'#e8e0cf',lines:['Hee-haw! No ramen today — only ramen!','The broth is cold and the stools are sold out.','Lunch is served at midnight, as always.']},
 Thuan:{animal:'tanuki',colour:'#8a6440',belly:'#e3cfa8',lines:['Welcome to Sakura, we are closed forever! See you tomorrow!','Everything is free. That will be ¥800.','The plant manages me now.']},
 Thao:{animal:'octopus',colour:'#d9607f',belly:'#f2b0c0',lines:['Last orders! Doors open in an hour.','Eight arms and not one beer.','Sit down, you are standing up.']},
 'Harbour master':{animal:'seagull',colour:'#f2f0ea',belly:'#b9bec2',lines:['All ships must sink on time.','The tide is out, so it is in.','Permission to leave port: denied, go ahead.']},
 Chin:{animal:'shark',colour:'#5f7f95',belly:'#e8eef0',lines:['Beat my score and I will lose it for you, bro.','Star Port is a boat, bro. Everybody knows.','Nobody swims faster backwards than me.']},
 Nhung:{animal:'owl',colour:'#8a6a4a',belly:'#e8d8b8',lines:['Shh! This is the loud section.','All our books are blank this week.','Who? Who? Not me. Who?']},
 Tetsuo:{animal:'bear',colour:'#5a3d2b',belly:'#b58a64',lines:['I only break radios now.','Grr. Welcome. Grr.','Every clock in the shop is right twice a year.']},
});
/**
 * The suits of the retired (people/roster.js RETIRED): Reiko's fox and the Bus driver's gorilla stay buildable for a
 * history story, out of COSTUMES so the dungeon (dungeon.js, which spawns every COSTUMED name) never dresses them.
 */
export const RETIRED_COSTUMES=Object.freeze({
 Reiko:{animal:'fox',colour:'#d9782e',belly:'#f4efe6',lines:['Tomorrow’s news: nothing happened yesterday.','Read all about it, or do not.','The evening paper comes out in the morning.']},
 'Bus driver':{animal:'gorilla',colour:'#2e2a28',belly:'#7d7068',lines:['Hoo hoo! Doors opening! Doors closing! Doors opening!','Next stop: this one. Last stop: also this one.','Please stand clear of the bananas. Fares are free, exact change only.']},
});
export const COSTUMED=Object.freeze(Object.keys(COSTUMES));

/** A townsperson's recipe with the suit on: the animal's colours head to foot, no hat. */
export function costumeRecipe(recipe,name){
 const c=COSTUMES[name]||RETIRED_COSTUMES[name];if(!c)return recipe;
 return {...recipe,outfit:{...recipe.outfit,top:'jacket',topColour:c.colour,pattern:'none',bottom:'trousers',bottomColour:c.colour,shoes:c.belly,hat:'none',accent:c.belly}};
}

/**
 * The hood, as a group for the head bone.
 * @param {string} animal
 * @param {{R:number,cy:number,sx?:number,sy?:number,colour:string,belly:string}} fit
 *   R the head's radius, cy the head's centre above the bone, sx/sy its stretch.
 */
export function buildCostumeHead(animal,{R=.14,cy=.14,sx=1,sy=1,colour='#777777',belly='#dddddd'}={}){
 const group=new THREE.Group();group.name='Costume · '+animal;
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.8}));return mats.get(c);};
 const fur=mat(colour),pale=mat(belly),white=mat('#f7f5ef'),black=mat('#141112'),pink=mat('#d4707e');
 const add=(geometry,material,[x,y,z],[rx,ry,rz]=[0,0,0],[kx,ky,kz]=[1,1,1])=>{const m=new THREE.Mesh(geometry,material);m.position.set(x*R,cy+y*R,z*R);m.rotation.set(rx,ry,rz);m.scale.set(kx,ky,kz);group.add(m);return m;};
 const ball=(r,material,pos,scale)=>add(new THREE.SphereGeometry(r*R,14,10),material,pos,[0,0,0],scale);
 const cone=(r,h,material,pos,rot,seg=10)=>add(new THREE.ConeGeometry(r*R,h*R,seg),material,pos,rot);
 // The hood: a cap over the crown and forehead, and flaps down the sides and back, open
 // in front so the face shows.
 const K=1.2;
 add(new THREE.SphereGeometry(R,22,12,0,Math.PI*2,0,Math.PI*.44),fur,[0,0,0],[0,0,0],[sx*K,sy*K,K]);
 add(new THREE.SphereGeometry(R,22,12,Math.PI/2+1.05,Math.PI*2-2.1,Math.PI*.4,Math.PI*.5),fur,[0,0,0],[0,0,0],[sx*K,sy*K,K]);
 const eyes=(y,z,spread=.36,size=.16)=>{for(const s of [-1,1]){ball(size,white,[s*spread,y,z]);ball(size*.5,black,[s*spread,y+.02,z+size*.75]);}};
 switch(animal){
  case 'crocodile':{
   // A long flat snout out over the face, a row of teeth along it, eyes up on bumps.
   add(new THREE.BoxGeometry(.95*R,.32*R,1.5*R),fur,[0,.42,1.05]);
   add(new THREE.BoxGeometry(.85*R,.1*R,1.35*R),pale,[0,.24,1.08]);
   for(let i=0;i<7;i++)for(const s of [-1,1])cone(.05,.14,white,[s*.4,.13,.5+i*.2],[Math.PI,0,0],4);
   // Eyes up on big bumps, yellow with slit pupils: what says crocodile when it faces you.
   for(const s of [-1,1]){ball(.07,black,[s*.22,.6,1.72]);ball(.3,fur,[s*.36,1.02,.42]);ball(.2,mat('#e8d24a'),[s*.36,1.1,.58]);add(new THREE.BoxGeometry(.05*R,.26*R,.04*R),black,[s*.36,1.1,.77]);}
   for(let i=0;i<5;i++)cone(.09,.2,fur,[0,1.12-i*.02,.1-i*.3],[0,0,0],4);
   break;}
  case 'donkey':{
   // A long pale muzzle, tall ears and a dark mane down the back of the hood.
   ball(.46,pale,[0,.38,.95],[.9,.7,1.25]);
   for(const s of [-1,1]){ball(.07,black,[s*.17,.35,1.48]);
    // Long, and standing up: they are what makes it a donkey from across a room.
    const ear=cone(.24,1.7,fur,[s*.5,1.75,-.05],[0,0,s*-.3]);ear.scale.z=.55;
    cone(.13,1.25,pink,[s*.48,1.7,.04],[0,0,s*-.3]).scale.z=.4;}
   eyes(.72,.78,.42,.14);
   for(let i=0;i<6;i++)add(new THREE.BoxGeometry(.14*R,.32*R,.22*R),black,[0,1.12-i*.12,-.25-i*.2],[-.4-i*.18,0,0]);
   break;}
  case 'tanuki':{
   ball(.3,pale,[0,.36,.95],[1,.75,1]);ball(.09,black,[0,.44,1.22]);
   for(const s of [-1,1]){ball(.26,black,[s*.66,1.02,-.05],[1,1,.5]);ball(.2,black,[s*.32,.64,.9],[1.2,.8,.5]);}
   eyes(.66,.98,.32,.12);
   break;}
  case 'octopus':{
   // A tall soft dome, big eyes, and eight arms hanging round the shoulders.
   ball(1.05,fur,[0,.75,-.15],[sx*1.05,1.35,1.1]);
   eyes(.72,.82,.38,.2);
   for(let i=0;i<8;i++){
    const a=Math.PI*.35+i*(Math.PI*1.3/7),x=Math.cos(a)*1.05,z=-Math.sin(a)*.9-.1;
    const arm=add(new THREE.CylinderGeometry(.13*R,.05*R,1.6*R,8),fur,[x,-.75,z],[Math.sin(a)*.35,0,Math.cos(a)*-.35]);
    for(let k=0;k<3;k++){const s=new THREE.Mesh(new THREE.SphereGeometry(.05*R,6,4),pale);s.position.set(0,(-.2-k*.35)*R,.1*R);arm.add(s);}
   }
   break;}
  case 'seagull':{
   const beak=cone(.2,.75,mat('#e8b53a'),[0,.35,1.3],[Math.PI/2,0,0]);beak.scale.x=.8;
   ball(.1,mat('#d9483a'),[0,.24,1.55]);eyes(.6,.88,.42,.12);
   for(let i=0;i<3;i++)cone(.08,.35,pale,[0,1.2,-.3-i*.15],[-.6-i*.3,0,0],5);
   break;}
  case 'shark':{
   // A dorsal fin on top, a snout over the face and a row of teeth under it.
   const fin=new THREE.Shape();fin.moveTo(0,0);fin.lineTo(-.6*R,0);fin.quadraticCurveTo(-.2*R,.5*R,.25*R,1.0*R);fin.lineTo(0,0);
   const f=new THREE.Mesh(new THREE.ExtrudeGeometry(fin,{depth:.12*R,bevelEnabled:false}),fur);f.rotation.y=Math.PI/2;f.position.set(-.06*R,cy+1.05*R,.15*R);group.add(f);
   ball(.6,fur,[0,.45,.9],[1.1,.55,1.2]);add(new THREE.BoxGeometry(1.1*R,.12*R,.7*R),pale,[0,.2,1.05]);
   for(let i=0;i<8;i++)cone(.055,.16,white,[-.42+i*.12,.1,1.35],[Math.PI,0,0],4);
   for(const s of [-1,1]){ball(.09,black,[s*.62,.58,.72]);}
   break;}
  case 'owl':{
   for(const s of [-1,1]){cone(.16,.55,fur,[s*.55,1.3,0],[0,0,s*-.35],5);ball(.34,pale,[s*.32,.62,.85],[1,1,.35]);ball(.17,mat('#e8a22a'),[s*.32,.64,.95]);ball(.08,black,[s*.32,.65,1.05]);}
   cone(.12,.35,mat('#d9902a'),[0,.35,1.02],[Math.PI*.6,0,0],6);
   break;}
  case 'fox':{
   const snout=cone(.3,.9,pale,[0,.38,1.28],[Math.PI/2,0,0]);snout.scale.set(1,1,.7);ball(.09,black,[0,.4,1.73]);
   for(const s of [-1,1]){cone(.26,.75,fur,[s*.5,1.3,0],[0,0,s*-.3],4);cone(.14,.45,pale,[s*.48,1.26,.07],[0,0,s*-.3],4);}
   eyes(.66,.9,.38,.12);
   break;}
  case 'gorilla':{
   // A heavy brow over the face, a grey leathery muzzle, small ears and a crest: the
   // bus driver, knuckles first.
   add(new THREE.BoxGeometry(1.5*R,.28*R,.5*R),fur,[0,.98,.82],[-.2,0,0]);
   ball(.42,pale,[0,.36,.98],[1.25,.75,.7]);
   for(const s of [-1,1]){ball(.07,black,[s*.16,.46,1.25]);ball(.2,pale,[s*.98,.62,0],[.5,1,.8]);}
   ball(.62,fur,[0,1.25,-.25],[.85,.7,1.1]);
   eyes(.75,.98,.3,.1);
   break;}
  case 'bear':{
   ball(.34,pale,[0,.34,1.02],[1.1,.8,.9]);ball(.12,black,[0,.44,1.3]);
   for(const s of [-1,1]){ball(.28,fur,[s*.68,1.05,-.05],[1,1,.6]);ball(.16,pale,[s*.68,1.05,.05],[1,1,.4]);}
   eyes(.66,.95,.34,.11);
   break;}
 }
 return group;
}

/** A line of bizarro talk from somebody, picked by a number that changes each time. */
export function bizarroLine(name,n=0){
 const lines=COSTUMES[name]?.lines||['Goodbye! I mean hello!'];
 return lines[((n%lines.length)+lines.length)%lines.length];
}
