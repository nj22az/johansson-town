import {FUMOTO} from '../fumoto-layout.js';
import {fascia,poster,enamel} from './signs.js';
import {coralWall,fukugi,gajumaru,hibiscus,banana,OKINAWA_COLOURS as C} from './houses.js';
import {utilityPole,wiresBetween,serviceDrop,bicycle,gasBottles} from './props.js';
import {rng} from './kit.js';

/**
 * Fumoto, the farming hamlet at the foot of Mount Aoba (fumoto-layout.js): its walled
 * houses (empty and to let: nobody in the cast lives here, cast.js), the co-operative store (closed), the asagi square with the gajumaru and the well, the
 * ishiganto at the T-junctions, the fukugi windbreak along the back, and the pole line
 * that brings power up the main lane from the coastal road.
 *
 * Built in world coordinates at the hamlet's own level (the caller's kit frame is lifted
 * to FUMOTO.y). The lanes and the square's coral sand are walking routes, drawn by the
 * island landscape with the rest of the island's paths.
 *
 * @param {object} kit the quarter kit
 * @param {Function} solid collects colliders
 * @param {object} ctx anchor, inspect, onAction, vending, walledHouse
 */
export function buildFumoto(kit,solid,ctx){
 const {inspect,walledHouse}=ctx,F=FUMOTO,y=F.y;
 F.plots.forEach((p,i)=>walledHouse(kit,solid,p,{...ctx,seed:60+i,windbreak:(p.minX+p.maxX)/2<20?'west':'east'}));
 coOpStore(kit,solid,ctx);
 square(kit,solid,ctx);
 // Ishiganto (石敢當): evil spirits walk only straight ahead, so where a lane runs into a
 // wall the stone is set in it to stop them. The upper lane runs into the main lane
 // opposite the store's corner: a short coral wall there, and the stone in it.
 {const x=36.4,z=F.upperLane[1][1];
  solid(coralWall(kit,x,z-2,x,z+1.4,{height:1.3,seed:91}));
  kit.box(.07,.5,.34,x-.27,.85,z,0x9a958a,{ry:0});
  kit.sign(enamel({jp:'Ishigantō',en:'ISHIGANTŌ',bg:'#d8d2c2',ink:'#2b2b2b'}),.3,.46,x-.31,.85,z,{ry:-Math.PI/2,depth:.02,name:'ishiganto sign'});
  inspect(x-1,1,z,'Look at the stone in the wall','Ishigantō','A stone set in the wall where the lane runs into it. Majimun, the island’s wandering spirits, can only walk in straight lines; they hit the stone and break up, instead of walking on into somebody’s house. Every T-junction in an old hamlet has one.');}
 {const x=F.square.minX+.45,z=F.lowerLane[1][1];
  kit.box(.5,1.25,.34,x+.1,.62,z,0xd8cfb3,{finish:'coral'});
  kit.sign(enamel({jp:'Ishigantō',en:'ISHIGANTŌ',bg:'#d8d2c2',ink:'#2b2b2b'}),.3,.46,x-.17,.85,z,{ry:-Math.PI/2,depth:.02,name:'ishiganto sign'});
  solid(kit.rect(x-.15,x+.35,z-.2,z+.2,1.3,'ishiganto'));}
 // The goats of 4 Fumoto, in a pen of posts and rails on the strip behind the house (the house is empty;
 // the goats stay with it until the cast plan decides, docs/CAST-PLAN.md):
 // three Ryukyu goats (hīja), white and brown, with a hay rack and a water pan.
 {const x0=22.5,x1=28.5,z0=195,z1=197.4,post=0x6d5238,rail=0x8a6a46;
  for(const x of [x0,(x0+x1)/2,x1])for(const z of [z0,z1])kit.block(x-.06,x+.06,0,1.1,z-.06,z+.06,post);
  for(const z of [z0+1.9])for(const x of [x0,x1])kit.block(x-.06,x+.06,0,1.1,z-.06,z+.06,post);
  for(const y of [.45,.95]){for(const z of [z0,z1])kit.block(x0,x1,y-.04,y+.04,z-.03,z+.03,rail);for(const x of [x0,x1])kit.block(x-.03,x+.03,y-.04,y+.04,z0,z1,rail);}
  kit.block(x0+.4,x0+1.6,.5,1.1,z0+.15,z0+.45,0x9a7650);kit.block(x0+.45,x0+1.55,.6,1.05,z0+.18,z0+.42,0xc9b46a);
  kit.cyl(.35,.3,.12,x1-.8,.06,z1-.7,0x7d8a8e,{segments:12});
  const goat=(x,z,ry,coat,seed)=>kit.at(x,z,ry,()=>{
   kit.box(.36,.34,.78,0,.62,0,coat);kit.box(.2,.24,.3,0,.86,.46,coat,{rx:-.5});
   kit.box(.17,.17,.28,0,.95,.6,coat);kit.box(.12,.1,.12,0,.9,.76,0x3a3430);
   for(const s of [-1,1]){kit.box(.04,.16,.04,s*.06,1.1,.52,0x8a7d68,{rx:-.6});kit.box(.12,.04,.07,s*.13,.97,.55,coat);}
   kit.box(.05,.14,.05,0,.8,.72,0xe6e0d2);kit.box(.06,.16,.06,0,.75,-.4,coat,{rx:.7});
   for(const [lx,lz] of [[-.12,-.28],[.12,-.28],[-.12,.28],[.12,.28]])kit.box(.07,.46,.07,lx,.23,lz,seed%2?0x5a4a3a:coat);
  });
  goat(x0+2.2,z0+1.6,.4,0xf1ede4,1);goat(x0+4.4,z0+2.4,-2.2,0x8a5a34,2);goat(x1-1,z0+1.2,1.6,0xf1ede4,3);
  solid([kit.rect(x0-.1,x1+.1,z0-.1,z0+.1,1.1,'goat pen'),kit.rect(x0-.1,x1+.1,z1-.1,z1+.1,1.1,'goat pen'),kit.rect(x0-.1,x0+.1,z0,z1,1.1,'goat pen'),kit.rect(x1-.1,x1+.1,z0,z1,1.1,'goat pen')]);
  inspect((x0+x1)/2,1,z0-.9,'Look at the goats','Hīja, the goats','Three island goats, two white and one brown, who eat the cane tops and the hibiscus. The house they belong to is empty; the board on its gate says to ask at the town hall, and whoever takes the house takes the goats.');}
 // The fukugi row behind the hamlet, against the north wind of the winter monsoon.
 for(let x=F.plots[0].minX;x<=F.plots[1].maxX;x+=2.3)solid(fukugi(kit,x,F.plots[0].minZ-3.5,{h:5.6+((x*7)%3)*.4,seed:700+Math.round(x)}));
 // The hamlet's name stone at the foot of the main lane, where it leaves the cane.
 {const x=F.mainLane[1][0]+2.2,z=F.bounds.maxZ-4.5;
  kit.box(.9,1.5,.55,x,.75,z,0xe2dccb,{finish:'coral'});kit.box(1,.12,.62,x,1.56,z,0xd6cfbd,{finish:'coral'});
  kit.sign(fascia({jp:'Fumoto',en:'FUMOTO'}),.86,.2,x,1.15,z+.29,{depth:.02,name:'hamlet name sign'});
  solid(kit.rect(x-.5,x+.5,z-.32,z+.32,1.6,'hamlet stone'));
  inspect(x,1.2,z+1,'Read the hamlet stone','Fumoto','Fumoto, “the foot of the mountain”: four houses, the co-op store and the well, between the cane and Mount Aoba. Nobody lives here now; the fields are still here and the houses are to let. The lane goes on up past Aoba Radio to the utaki at the top.');}
 // Power: up the main lane from the coastal road on the lane's east verge, then along the
 // two cross lanes, with a drop to every house and the store.
 const poles=[],pole=(x,z,o={})=>{const p=utilityPole(kit,x,z,o);solid(p.collider);poles.push(p);return p;};
 const up=[...F.lanePoles].reverse().map(([x,z],i)=>pole(x,z,{face:Math.PI/2,transformer:i===2,lamp:i===2||i===4,seed:900+i*3}));
 for(let i=1;i<up.length;i++)wiresBetween(kit,up[i-1],up[i]);
 // The feeder up the trail from the Rainflower circuit (town-power.js joins its first pole).
 const feed=F.feeder.slice(0,-1).map(([x,z],i)=>pole(x,z,{face:Math.PI/2,transformer:false,tel:false,seed:940+i*3}));
 for(let i=1;i<feed.length;i++)wiresBetween(kit,feed[i-1],feed[i]);wiresBetween(kit,feed.at(-1),up.at(-1));
 const upper=pole(4,F.upperLane[0][1]-F.laneWidth/2+.25,{face:0,transformer:false,lamp:true,seed:921});
 const lower=pole(4,F.lowerLane[0][1]-F.laneWidth/2-2.75,{face:0,transformer:false,lamp:true,seed:924});
 wiresBetween(kit,up.at(-1),upper,{sag:.55});wiresBetween(kit,up.at(-2),lower,{sag:.55});
 for(const p of F.plots){const near=p.maxZ<F.upperLane[0][1]?upper:lower,x=(p.minX+p.maxX)/2;serviceDrop(kit,near,[x+1.5,y+2.6,p.minZ+3.2]);}
 serviceDrop(kit,up.at(-2),[F.store.minX+.4,y+2.9,F.store.maxZ-1]);
}

/**
 * The kyōdō baiten: a single-storey concrete store the hamlet built together in 1968 and
 * owns in shares, one family one share. A flat roof with the water tank, a porch under the
 * roof slab, aluminium sliding doors, and the things a village store also is: the post
 * box, the telephone, the bench, the drinks machine.
 */
function coOpStore(kit,solid,{inspect,anchor,onAction,vending}){
 const S=FUMOTO.store,cx=(S.minX+S.maxX)/2,cz=(S.minZ+S.maxZ)/2,W=(S.maxZ-S.minZ)/2,D=(S.maxX-S.minX)/2;
 const cream=0xebe3cc,trim=0x3f7f86,metal=0xb8bec0,porch=D-1.5,r=rng(77);
 kit.at(cx,cz,-Math.PI/2,()=>{
  // The shell: back and sides, and the room behind the glass.
  kit.block(-W-.05,W+.05,0,.22,-D-.05,porch,0xb3ad9f);
  kit.block(-W,W,.22,3,-D,porch-1.4,cream,'plaster');
  for(const s of [-1,1])kit.block(s<0?-W:W-.2,s<0?-W+.2:W,.22,3,porch-1.4,porch,cream,'plaster');
  kit.block(-W+.2,W-.2,.22,.27,porch-1.4,porch,0x9d9486);
  kit.block(-W+.2,W-.2,.27,2.6,porch-1.43,porch-1.38,0xefe6d2,'glow');
  kit.block(-W+.2,W-.2,2.6,3,porch-1.4,porch,0xd8d2c4,'glow');
  // Shelves on the back wall, stocked; the counter at the north end with the till.
  for(let level=0;level<4;level++){
   kit.block(-W+.4,W-1.9,.45+level*.5,.48+level*.5,porch-1.38,porch-1.05,0x8a6a46);
   for(let x=-W+.5;x<W-2;x+=.16+r.next()*.1)kit.box(.12,.16+r.next()*.14,.18,x,.56+level*.5,porch-1.2,r.pick([0xd9b04a,0x5f8fb8,0xc0543e,0x6ea05a,0xe8e2d0,0xf0ece0]),{finish:'glow'});
  }
  kit.block(W-1.6,W-.3,.27,1.05,porch-1.3,porch-.7,0x7a5a3c);kit.box(.4,.22,.3,W-.9,1.17,porch-1,0x5a5f62);
  // The front: a band of wall over four aluminium sliding doors, the middle two open.
  kit.block(-W,W,2.3,3,porch-.12,porch,cream,'plaster');
  const leaf=(x0,x1,z)=>{
   kit.block(x0,x1,.27,.6,z-.03,z+.03,metal,'metal');
   kit.block(x0,x1,2.24,2.3,z-.03,z+.03,metal,'metal');
   for(const x of [x0,x1])kit.block(x-.03,x+.03,.27,2.3,z-.03,z+.03,metal,'metal');
   kit.block(x0+.03,x1-.03,.6,2.24,z-.01,z+.01,C.glass,'window');
  };
  const pane=(2*W-.4)/4,x0=-W+.2;
  leaf(x0,x0+pane,porch-.06);leaf(x0+pane*.55,x0+pane*1.55,porch-.13);
  leaf(x0+pane*2.45,x0+pane*3.45,porch-.13);leaf(x0+pane*3,x0+pane*4,porch-.06);
  kit.block(-W+.2,W-.2,.22,.25,porch-.2,porch,0x8e9699,'metal');
  // The roof slab over the porch, its two columns, the parapet, and the tank on top.
  kit.block(-W-.2,W+.2,3,3.24,-D-.1,D+.1,0xd6d0c0);
  for(const s of [-1,1])kit.block(s*(W-.05)-.13,s*(W-.05)+.13,.05,3,D-.25,D+.01,cream,'plaster');
  for(const [a,b,c,d] of [[-W-.2,W+.2,-D-.1,-D+.05],[-W-.2,W+.2,D-.05,D+.1],[-W-.2,-W-.05,-D-.1,D+.1],[W+.05,W+.2,-D-.1,D+.1]])kit.block(a,b,3.24,3.62,c,d,cream,'plaster');
  kit.block(-W-.24,W+.24,3.62,3.68,D-.02,D+.14,trim);
  kit.cyl(.55,.55,1.2,-W*.45,4.35,-D*.45,0x2f7fb0,{segments:12,finish:'gloss'});
  kit.box(1.1,.6,1.1,-W*.45,3.55,-D*.45,C.steel,{finish:'metal'});
  kit.sign(fascia({jp:'Fumoto Co-op Store',en:'FUMOTO CO-OP STORE',bg:'#f3ead2',accent:'#2f7f86'}),2*W-.6,.62,0,3.3,D+.13,{name:'shop fascia'});
  // The porch: a concrete pad, a wooden bench under the window, the round red post box at
  // the corner and the telephone on its shelf by the door.
  kit.block(-W,W,0,.04,porch,D,0xc9c4b6);
  kit.block(-W+.5,-.95,.42,.48,porch+.25,porch+.65,0x9a7650);
  for(const x of [-W+.7,-1.15])kit.block(x-.05,x+.05,0,.42,porch+.3,porch+.6,0x6d5238);
  kit.cyl(.22,.22,1.02,W+.55,.51,D-.35,0xc8322b,{segments:14,finish:'gloss'});
  kit.sphere(.22,W+.55,1.02,D-.35,0xc8322b,{sy:.55,finish:'gloss'});
  kit.box(.2,.03,.03,W+.55,.86,D-.13,0x2b2b2b);
  kit.block(-.95,-.55,1.05,1.09,porch+.02,porch+.32,0x7a5a3c);
  kit.box(.22,.16,.2,-.75,1.17,porch+.17,0xd9506a,{finish:'gloss'});
  kit.sign(enamel({jp:'Telephone',en:'TELEPHONE',bg:'#f1e6c8',ink:'#2f6f3a'}),.42,.2,-.75,1.55,porch+.02,{depth:.02,name:'telephone sign'});
  // Empty bottle crates for the Higa van, and the gas bottles round the side.
  for(const [x,h] of [[W-.55,0],[W-.55,.3],[W-1.05,0]])kit.box(.45,.28,.36,x,.18+h,porch+.35,0xd9a03a);
  solid(gasBottles(kit,-W-.3,-D+1.2,{ry:Math.PI/2}));
  solid(bicycle(kit,-W-.6,porch+.2,{ry:-.3,colour:0x2f6f8a,id:'fumoto-co-op-bicycle',owner:'the Fumoto co-op store',why:'The co-op’s delivery bicycle, by the porch, for the cane farmers’ orders up the lane.'}));
 });
 solid([kit.rect(S.minX+1.5,S.maxX,S.minZ,S.maxZ,3.7,'co-op store')]);
 solid([{id:'co-op bench',x:S.minX+1.05,z:cz-(W+.45)/2,w:.5,d:2.3,height:.5},{id:'post box',x:S.minX+.35,z:S.maxZ+.55,w:.5,d:.5,height:1.2}]);
 for(const z of [S.minZ+.05,S.maxZ-.05])solid([{id:'porch column',x:S.minX+.12,z,w:.3,d:.3,height:3}]);
 vending(S.minX+2.4,S.maxZ+.65,0);
 inspect(S.minX+.1,1.2,(S.minZ+S.maxZ)/2+1.3,'Read the co-op store’s doors','Fumoto Co-op Store','The shop is shut. The hamlet built it in 1968, one share per family, and it closed when the families left. A notice on the glass says to buy your groceries at Sakura Shōten in Minato. The telephone by the door and the round red post box are still there.');
 // Closed (cast.js PLACES 'fumoto-co-op'): nobody keeps it, so the door says so instead of selling.
 anchor(S.minX-.8,1,(S.minZ+S.maxZ)/2,'Try the co-op store’s door',()=>onAction?.('read','Fumoto Co-op Store · closed','The door is locked and the counter inside is bare. Nobody keeps the store now: Fumoto stays as fields. For groceries, go to Sakura Shōten in Minato.'));
}

/**
 * The asagi square: open coral sand by the main lane, the old gajumaru, the hamlet's well,
 * a stone bench under the tree, and the notice board.
 */
function square(kit,solid,{inspect}){
 const F=FUMOTO,[bx,bz]=F.banyan,[wx,wz]=F.well,[sx,sz]=F.bench;
 solid(gajumaru(kit,bx,bz,{seed:77,size:1.45}));
 // The well: a round curb of coral stone, half its timber lid off, a frame and pulley over
 // it with the bucket, and the concrete wash basin where the vegetables are rinsed.
 kit.cyl(.95,1,.75,wx,.375,wz,0xe2dccb,{segments:16,finish:'coral'});
 kit.cyl(.7,.7,.02,wx,.72,wz,0x1f2a2c,{segments:14});
 kit.block(wx-.95,wx+.02,.75,.8,wz-.9,wz+.9,0x7a5a3c);
 for(const s of [-1,1])kit.block(wx-.06,wx+.06,.75,2.35,wz+s*.98-.06,wz+s*.98+.06,0x6d5238);
 kit.block(wx-.07,wx+.07,2.28,2.4,wz-1.1,wz+1.1,0x6d5238);
 kit.cyl(.12,.12,.06,wx,2.2,wz,0x5a5f62,{segments:10,rx:Math.PI/2});
 kit.rod([wx,2.2,wz],[wx+.35,1.1,wz],.006,0xd8cfb3);
 kit.cyl(.14,.11,.24,wx+.35,.97,wz,0x8a6a46,{segments:10});
 kit.block(wx+1.15,wx+2.1,0,.55,wz-.45,wz+.45,0xc9c4b6);kit.block(wx+1.25,wx+2,.4,.56,wz-.35,wz+.35,0x7d8a8e);
 solid([kit.rect(wx-1.05,wx+1.05,wz-1.1,wz+1.1,1,'village well'),kit.rect(wx+1.1,wx+2.15,wz-.5,wz+.5,.6,'well basin')]);
 inspect(wx-1.5,1,wz,'Look into the well','Mura-gā, the village well','The hamlet’s well, older than any of its houses. Water came from here until the island main reached Fumoto in 1972, and the first water of the new year was drawn from it for the gods. Nobody lives here to clean it now, and its lid is half off.');
 // A long bench of two coral slabs on stone feet, facing the tree.
 for(const dx of [-1,1])kit.block(sx+dx*1.1-.18,sx+dx*1.1+.18,0,.38,sz-.18,sz+.18,0xd8cfb3,'coral');
 kit.block(sx-1.6,sx+1.6,.38,.5,sz-.26,sz+.26,0xe2dccb,'coral');
 solid([kit.rect(sx-1.65,sx+1.65,sz-.3,sz+.3,.5,'square bench')]);
 inspect(sx,1,sz+.9,'Sit a while under the gajumaru','The asagi square','The open ground every hamlet keeps: for the harvest dance, the tug of war at the old new year, and the hot evenings, when somebody brought a sanshin out to the bench under the gajumaru. The houses round it are empty now, and the square is quiet.');
 // The notice board on the square's lane side, facing the lane.
 {const x=F.square.minX+.35,z=F.notices[1]+5;
  for(const dz of [-.9,.9])kit.block(x-.05,x+.05,0,1.9,z+dz-.05,z+dz+.05,0x6d5238);
  kit.block(x-.03,x+.03,.9,1.9,z-1,z+1,0x8a6a46);kit.block(x-.12,x+.12,1.9,1.98,z-1.1,z+1.1,0x5d4431);
  const notes=[poster({title:'To let',lines:['1–4 Fumoto','ask at the','town hall'],band:'#3f7f86'}),poster({title:'Store closed',lines:['for groceries:','Sakura Shōten','Minato']}),poster({title:'Well',lines:['not for','drinking','town water only']})];
  notes.forEach((t,i)=>kit.sign(t,.5,.7,x-.05,1.4,z-.62+i*.62,{ry:-Math.PI/2,depth:.01,name:'notice sign'}));
  solid([kit.rect(x-.12,x+.12,z-1.1,z+1.1,2,'notice board')]);
  inspect(x-.8,1.3,z,'Read the hamlet notices','Fumoto notices','TO LET: 1 to 4 Fumoto, red tile and concrete, with their yards; ask at the town hall. STORE CLOSED: for groceries, go to Sakura Shōten in Minato. WELL: not for drinking; use the town water.');}
 hibiscus(kit,F.square.maxX-.8,F.square.minZ+1,{seed:82});banana(kit,F.square.maxX-.6,F.square.maxZ-1.2,{seed:83});
 solid([kit.rect(F.square.maxX-1.3,F.square.maxX-.1,F.square.maxZ-1.7,F.square.maxZ-.7,2,'banana')]);
}
