import * as THREE from '../../vendor/three.module.js';
import {createKit,GRID} from './okinawa/kit.js';
import {MAIN_ROAD} from './main-road.js';
import {buildShopDoor} from './shop-door.js';
import {BOOKSHOP_WORKSHOP_PLOT} from './bookshop-workshop-layout.js';
import {businessId} from './businesses.js';

import {GROUND_LAYER} from './ground-layers.js';
import {MAIN_STREET_GROUND} from './ground-plan.js';
import {wallAd,WALL_ADS} from './okinawa/signs.js';
import {rng} from './okinawa/kit.js';

/** West-facing business row: the bookshop, press and workshop share one shell.
 * The interior dimensions fit this building and the lane beside Minato stays open.
 */

/** Front faces sit here, a hand's width clear of the west kerb. */
export const WEST_FRONT=-7.8;

export const WEST_SHOPS=Object.freeze({
 frontrow:BOOKSHOP_WORKSHOP_PLOT,
});

/**
 * Where a west-pavement shop's door lands, for anything that needs to know before the
 * building is built -- its staff's working day, the escort that walks you to it.
 */
export function westShopDoor(id){
 const plot=WEST_SHOPS[businessId(id)];
 return plot?[MAIN_ROAD.pavementWest+.65,plot.z]:null;
}

/**
 * @param {object} options
 * @param {THREE.Object3D} options.parent
 * @param {object} options.site the business, which is given its door and frontage here
 * @param {Array} options.colliders the town's collider list
 * @returns {{group:THREE.Group,update:(dt:number,bodies:Array)=>void}|null}
 */
export function buildWestShop({parent,site,register,enter,label,colliders,shadows=false}){
 const plot=WEST_SHOPS[site.id];if(!plot)return null;
 const {z,width,depth}=plot,half=width/2,back=WEST_FRONT-depth;
 const group=new THREE.Group();group.name='west-shop:'+site.id;parent.add(group);
 // Small front fittings are separate meshes in flat painted colours; the shell is kit.
 const paints=new Map(),paint=c=>{if(!paints.has(c))paints.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.85}));return paints.get(c);};
 const solid=(size,pos,colour)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(...size),paint(colour));
  m.position.set(...pos);m.castShadow=!!shadows;m.receiveShadow=true;m.userData.staticProp=true;group.add(m);return m;
 };
 // A 1990s Okinawan concrete shop-house pair on the town grid (okinawa/kit.js GRID):
 // a 3.0 m shop storey with the books on the left and the workshop on the right of
 // one central door, a 2.7 m storey of aluminium windows above, and a flat roof with
 // its parapet, black water tank, aerial and the rebar left for a third floor. It
 // replaces a cedar-plank gable that read as a mountain lodge (docs/AMPLIFY-AUDIT.md,
 // B3). The footprint, door, displays and colliders are where they were.
 const G=GRID.storey.shop,U=GRID.storey.home,H=G+U,HEIGHT=H,DOOR=1.6,SHOPFRONT=2.63;
 const wall=0xe6dcc4,plinth=0xb3ad9f,trim=0x3f7f86,alu=0xb8bec0,frame=0x8e9699,slab=0xc8c2b5,tank=0x2b2d2f,steel=0x8e979a;
 group.userData.buildingStyle='okinawa-shop-house';
 const kit=createKit({shadows});
 // The passage between the bookshop and Minato, over the two buildings' aprons (step 3 of the ground plan relays them
 // together). It stops at Main Street's back strip (ground-plan.js), which runs on across its mouth.
 const passageTo=MAIN_STREET_GROUND.backWest,passageFrom=back-1;
 // (Relaid by step 3: the west yard's plan lays the passage, ground-plan-quarters.js.)
 void passageTo;void passageFrom;
 kit.block(back-.24,WEST_FRONT+.02,0,.3,z-half-.24,z+half+.24,plinth);
 kit.block(back-.22,back,0,H,z-half-.22,z+half+.22,wall);
 for(const side of [-1,1]){
  const [z0,z1]=side<0?[z-half-.22,z-half]:[z+half,z+half+.22];
  kit.block(back-.22,WEST_FRONT,0,H,z0,z1,wall);
  // The corner pier, flush with the shopfront, closes the frontage to the side wall.
  kit.block(WEST_FRONT-.3,WEST_FRONT,0,H,side<0?z-half:z+half-.3,side<0?z-half+.3:z+half,wall);
 }
 // Upper storey front, the fascia band over the shop, and a concrete hood above it.
 kit.block(WEST_FRONT-.22,WEST_FRONT,SHOPFRONT+.12,H,z-half,z+half,wall);
 kit.block(WEST_FRONT,WEST_FRONT+.06,SHOPFRONT+.1,G+.5,z-half+.3,z+half-.3,trim);
 kit.block(WEST_FRONT,WEST_FRONT+GRID.eave.canopy,G+.5,G+.62,z-half,z+half,slab);
 kit.block(WEST_FRONT-.05,WEST_FRONT+.05,SHOPFRONT,SHOPFRONT+.12,z-half+.3,z+half-.3,frame,'metal');
 // Upstairs: four aluminium sliders, a sill under each, an air conditioner and its stain.
 for(const wz of [z-half*.62,z-half*.2,z+half*.2,z+half*.62]){
  kit.box(.06,1.12,GRID.window.small+.4,WEST_FRONT+.03,G+1.55,wz,alu,{finish:'metal'});
  kit.box(.05,1.0,GRID.window.small+.26,WEST_FRONT+.05,G+1.55,wz,0x5d7a84,{finish:'window'});
  kit.box(.06,1.0,.04,WEST_FRONT+.07,G+1.55,wz,alu,{finish:'metal'});
  kit.box(.18,.07,GRID.window.small+.5,WEST_FRONT+.08,G+.95,wz,slab);
 }
 kit.box(.26,.5,.72,WEST_FRONT+.14,G+1.0,z+half-.75,0xe2e0d8);
 kit.box(.02,1.4,.16,WEST_FRONT+.01,G+.2,z+half-.75,0xa9a397);
 // Roof: parapet ring and coping, the tank on its frame, an aerial, rebar stubs.
 for(const [x0,x1,z0,z1] of [[back-.22,WEST_FRONT,z-half-.22,z-half-.08],[back-.22,WEST_FRONT,z+half+.08,z+half+.22],[back-.22,back-.08,z-half-.22,z+half+.22],[WEST_FRONT-.14,WEST_FRONT,z-half-.22,z+half+.22]])
  kit.block(x0,x1,H,H+GRID.parapet,z0,z1,wall);
 kit.block(WEST_FRONT-.18,WEST_FRONT+.04,H+GRID.parapet,H+GRID.parapet+.08,z-half-.22,z+half+.22,trim);
 kit.block(back,WEST_FRONT-.01,H-.05,H+.02,z-half,z+half,slab);
 const tx=back+depth*.32,tz=z-half*.45;
 for(const [dx,dz] of [[-.45,-.45],[.45,-.45],[.45,.45],[-.45,.45]])kit.box(.07,.9,.07,tx+dx,H+.45,tz+dz,steel,{finish:'metal'});
 kit.box(1.1,.08,1.1,tx,H+.94,tz,steel,{finish:'metal'});
 kit.cyl(.6,.6,1.25,tx,H+1.6,tz,tank,{segments:14,finish:'gloss'});
 kit.rod([back+depth*.7,H,z+half*.5],[back+depth*.7,H+2.4,z+half*.5],.025,steel);
 for(const y of [H+1.9,H+2.25])kit.rod([back+depth*.7,y,z+half*.5-.55],[back+depth*.7,y,z+half*.5+.55],.015,steel);
 for(const [dx,dz] of [[.3,.3],[.3,1.2],[1.2,.3],[1.2,1.2]])kit.rod([back+dx,H,z+half-dz],[back+dx,H+.55,z+half-dz],.018,0x7a4a32);
 // Rust from the parapet fixings and mould under the coping: the island's two tells.
 for(const wz of [z-half+.7,z+half-1.4])kit.box(.02,1.1,.05,WEST_FRONT+.012,H-.4,wz,0x9d8f78);
 kit.box(.02,.25,width-.6,WEST_FRONT+.004,H-.12,z,0xbdb4a2);
 northGable(kit,{x0:back-.22,x1:WEST_FRONT,zf:z+half+.22,H,wall,colliders});
 kit.finish(group,'west-shop shell:'+site.id);
 // The shopfront: two display windows either side of one door, in aluminium.
 for(const side of [-1,1]){
  const outer=z+side*(half-.3),inner=z+side*(DOOR/2+.14),run=Math.abs(outer-inner),bay=(outer+inner)/2;
  // Inside the corner pier (the shell's, above) by a centimetre: the two in one plane flashed on a phone.
  solid([.2,SHOPFRONT,.28],[WEST_FRONT-.11,SHOPFRONT/2,z+side*(half-.15)],wall).name='Corner pier infill';
  solid([.16,.66,run],[WEST_FRONT-.08,.35,bay],wall).name='Display window apron';
  const recess=solid([.08,1.94,run],[WEST_FRONT-.12,1.65,bay],0x302c24);recess.name='Display window recess';
  for(const y of [.68,SHOPFRONT])solid([.24,.10,run+.12],[WEST_FRONT+.01,y,bay],alu).name='Display window rail';
  for(const zz of [inner,outer])solid([.24,2.0,.10],[WEST_FRONT+.01,1.65,zz],alu).name='Display window stile';
  if(side<0||site.bookshop){
   for(const y of [.92,1.70]){
    solid([.18,.06,run-.18],[WEST_FRONT+.01,y,bay],trim).name='Book display shelf';
    for(let i=0;i<9;i++)solid([.10,.36+(i%3)*.04,.17],[WEST_FRONT+.035,y+.23,bay-run/2+.25+i*(run-.5)/9],[0x884934,0x52655e,0xa18b57][i%3]).name='Book in street display';
   }
  }else{
   solid([.18,.08,run-.18],[WEST_FRONT+.01,1.06,bay],trim).name='Workshop display shelf';
   solid([.10,.46,.78],[WEST_FRONT+.035,1.33,bay-.55],0x654635).name='Restored radio display';
   for(let i=0;i<5;i++)solid([.025,.26,.04],[WEST_FRONT+.10,1.34,bay-.83+i*.10],0xc1a576).name='Radio display grille';
   solid([.10,.24,.38],[WEST_FRONT+.035,1.22,bay+.50],0xa99260).name='Workshop pattern display';
  }
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(run-.13,1.82),new THREE.MeshStandardMaterial({color:0x91a79d,roughness:.3,transparent:true,opacity:.24,depthWrite:false}));
  pane.name=side<0?'Bookshop display glass':'Workshop display glass';pane.rotation.y=Math.PI/2;pane.position.set(WEST_FRONT+.12,1.65,bay);pane.userData.clearWindow=true;group.add(pane);
  solid([.08,1.90,.05],[WEST_FRONT+.15,1.65,bay],alu).name='Window mullion';
 }
 const doorway=new THREE.Group();doorway.position.set(WEST_FRONT-.16,0,z);doorway.rotation.y=Math.PI/2;group.add(doorway);
 const door=buildShopDoor(doorway,{name:site.id+'-west-door',width:DOOR,shadows});
 label(site.jp,site.title.toUpperCase(),[WEST_FRONT+.08,G+.12,z],Math.min(width*.8,6.4),.52,Math.PI/2,'#f4ecd6','#2f4f52');

 // Walls stop you; the doorway does not.
 const cheek=(width-DOOR)/2-.1;
 for(const side of [-1,1])colliders.push({id:'west-shop:'+site.id+(side<0?':south':':north'),
  x:(WEST_FRONT+back)/2,z:z+side*(DOOR/2+cheek/2+.05),w:depth,d:cheek,height:HEIGHT});
 colliders.push({id:'west-shop:'+site.id+':back',x:back,z,w:.4,d:width,height:HEIGHT});

 // The door point, on the pavement, and the way in.
 const doorPoint=[MAIN_ROAD.pavementWest+.65,0,z];
 site.x=WEST_FRONT;site.z=z;
 site.door=[...doorPoint];site.exitPosition=[...doorPoint];site.entryFacing=Math.PI/2;
 site.approachPosition=[doorPoint[0]+.55,0,z];
 site.streetFrontage={position:[WEST_FRONT,0,z],yaw:Math.PI/2};
 const entrance=new THREE.Object3D();entrance.name=site.id+'-west-entrance';
 entrance.position.set(doorPoint[0],1.25,z);parent.add(entrance);
 register?.(entrance,'Enter '+site.title,()=>enter(site));
 return {id:site.id,group,entrance,update:door.update};
}

/**
 * The north gable, the wall you see coming down Main Street from the bus (it was a blank cream slab): what a 1990s
 * concrete shop-house carries on its side wall, each thing for a reason.
 *   - a painted advert, sign-writer's work on the one wall the whole street sees (an invented brand, WALL_ADS);
 *   - the upstairs air conditioner's outdoor unit on its block, its pipes boxed up the wall to the press room;
 *   - the electricity meter at reading height by the street end, where the meter reader can get at it;
 *   - the downpipe from the roof, which drains the water tank's overflow too;
 *   - creeping fig at the back corner, which every shaded concrete wall on the island grows.
 */
function northGable(kit,{x0,x1,zf,H,wall,colliders}){
 const ivory=0xe8e4d8,grey=0x9aa0a4;
 if(typeof document!=='undefined'&&document.createElement)try{
  kit.sign(wallAd(WALL_ADS[2],7),2.4,3.2,(x0+x1)/2+.6,3.85,zf+.03,{depth:.02,edge:wall,name:'painted wall advert sign'});
 }catch{}
 // The air conditioner on two blocks, its pipes in a cover up to the upstairs room.
 const ax=x0+1.3;kit.box(.8,.12,.3,ax,.06,zf+.17,0xb3ad9f);kit.box(.76,.56,.26,ax,.4,zf+.17,0xe2e0d8);
 kit.cyl(.17,.17,.02,ax-.12,.42,zf+.31,0x6d7477,{segments:14,rx:Math.PI/2});
 kit.box(.12,3.7,.08,ax+.5,2.3,zf+.05,ivory);kit.box(.5,.12,.08,ax+.3,.55,zf+.05,ivory);kit.box(.12,.12,.12,ax+.5,4.15,zf+.07,ivory);
 colliders?.push({id:'frontrow-aircon',x:ax,z:zf+.17,w:.82,d:.32,height:.7});
 // The meter and its conduit, by the street corner.
 const mx=x1-1.1;kit.box(.32,.42,.12,mx,1.7,zf+.06,grey,{finish:'metal'});kit.box(.2,.14,.02,mx,1.75,zf+.125,0xd9e2e0,{finish:'window'});
 kit.rod([mx,1.92,zf+.05],[mx,H-.2,zf+.05],.02,0x3c4448);
 // The downpipe at the front corner, with its shoe.
 const dx=x1-.25;kit.rod([dx,H+.05,zf+.08],[dx,.2,zf+.08],.045,0x8e9699);kit.box(.12,.1,.22,dx,.13,zf+.16,0x8e9699);
 // Creeping fig, flat to the wall, thickest at the foot of the back corner.
 const r=rng(91);
 for(let i=0;i<34;i++){const t=r.next(),x=x0+.25+r.next()*1.1*(1.2-t),y=.2+t*3.1;kit.sphere(.16+r.next()*.1,x,y,zf+.03,r.pick([0x3f6b3a,0x4f7d3e,0x5c8a45]),{sz:.22,detail:0});}
}
