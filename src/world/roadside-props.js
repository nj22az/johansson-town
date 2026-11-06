import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {fishById} from './okinawa/fish.js';

/**
 * Roadside life, built in code: a tea stop with a red-felt bench under a paper parasol,
 * and a fish seller's push cart. Original designs in the town's own toy style.
 *
 * What the old console towns taught (docs in /Volumes/Instron/*-LESSONS.md): a lived-in
 * street is a few cheap, recognisable things rather than one expensive one. So each prop
 * is a single merged mesh with its colours baked into the vertices -- one draw call, no
 * textures to load -- a few hundred triangles, and the light does the rest.
 */
const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,side:THREE.DoubleSide});

/** A part: a geometry, a colour and where it goes. */
function part(geometry,hex,{at=[0,0,0],rot=[0,0,0],scale=[1,1,1]}={}){
 const g=geometry.index?geometry.toNonIndexed():geometry;if(g!==geometry)geometry.dispose();
 g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(...scale)));
 const c=new THREE.Color(hex),n=g.attributes.position.count,colours=new Float32Array(n*3);
 for(let i=0;i<n;i++)colours.set([c.r,c.g,c.b],i*3);
 g.setAttribute('color',new THREE.BufferAttribute(colours,3));
 for(const key of Object.keys(g.attributes))if(!['position','normal','color'].includes(key))g.deleteAttribute(key);
 return g;
}
function merge(parts,name){
 const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.computeVertexNormals();g.computeBoundingSphere();
 const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.sharedAsset=false;
 return mesh;
}
const box=(w,h,d,hex,at)=>part(new THREE.BoxGeometry(w,h,d),hex,{at});
const cyl=(r0,r1,h,hex,at,seg=10,rot)=>part(new THREE.CylinderGeometry(r0,r1,h,seg),hex,{at,rot});
const ball=(r,hex,at,scale)=>part(new THREE.SphereGeometry(r,10,7),hex,{at,scale});

/**
 * A tea stop: a long bench (endai) covered in red felt, a big red paper parasol on a
 * bamboo pole beside it, a lacquer tray with two cups and a plate of sata andagi, and a
 * little standing board. Front is +z, where you sit facing the path.
 */
export function buildTeaStop(){
 const WOOD=0x7b5a3c,DARK=0x4a3324,FELT=0xc23a2e,PAPER=0xb8322b,BAMBOO=0xc9b37a,LACQUER=0x3a1e18,CUP=0xefe6d2;
 const parts=[];
 // The bench: a plank top on four square legs with stretchers, the felt laid over it.
 parts.push(box(1.9,.06,.62,WOOD,[0,.44,0]));
 for(const x of [-.82,.82])for(const z of [-.24,.24])parts.push(box(.07,.44,.07,DARK,[x,.22,z]));
 for(const z of [-.24,.24])parts.push(box(1.7,.05,.04,DARK,[0,.12,z]));
 parts.push(box(1.94,.012,.66,FELT,[0,.477,0]));parts.push(box(1.94,.11,.012,FELT,[0,.43,.33]));
 // The parasol: a shallow cone of red paper over a bamboo pole set into a stone weight.
 const pole=[-1.15,0,-.2];
 parts.push(cyl(.16,.2,.18,0x9c978b,[pole[0],.09,pole[2]],8));
 parts.push(cyl(.025,.025,2.55,BAMBOO,[pole[0],1.3,pole[2]],6));
 parts.push(part(new THREE.ConeGeometry(1.45,.42,22,1,true),PAPER,{at:[pole[0],2.36,pole[2]]}));
 parts.push(part(new THREE.ConeGeometry(1.4,.4,22,1,true),0x8f241f,{at:[pole[0],2.33,pole[2]]}));
 parts.push(cyl(.05,.05,.08,DARK,[pole[0],2.6,pole[2]],8));
 // A ring of ribs under the paper, the parasol's own.
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;parts.push(part(new THREE.CylinderGeometry(.008,.008,1.42,4),BAMBOO,{at:[pole[0]+Math.cos(a)*.7,2.27,pole[2]+Math.sin(a)*.7],rot:[0,-a,Math.PI/2-.29]}));}
 // On the felt: the tray, two cups, sata andagi.
 parts.push(box(.34,.025,.22,LACQUER,[.42,.49,.02]));
 for(const x of [.34,.5])parts.push(cyl(.035,.028,.06,CUP,[x,.53,-.02],10));
 parts.push(cyl(.075,.07,.012,CUP,[.45,.508,.08],12));
 for(const [dx,dz] of [[-.025,0],[.025,0],[0,.035]])parts.push(ball(.025,0xb06a2a,[.45+dx,.538,.08+dz]));
 // The board, propped on the bench end: written in code below (texture), its frame here.
 parts.push(box(.04,.56,.36,DARK,[1.02,.28,.18]));
 return merge(parts,'Tea stop');
}

/** The tea stop's little standing board: お茶 ¥100, drawn on a canvas. */
export function teaBoardTexture(){
 const c=typeof document!=='undefined'&&document.createElement?document.createElement('canvas'):null;
 if(!c?.getContext?.('2d'))return null;
 c.width=128;c.height=192;const ctx=c.getContext('2d');
 ctx.fillStyle='#f1e4c6';ctx.fillRect(0,0,128,192);ctx.strokeStyle='#5a3b26';ctx.lineWidth=8;ctx.strokeRect(4,4,120,184);
 ctx.fillStyle='#2a1a12';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font='bold 54px "Hiragino Mincho ProN","Noto Serif CJK JP",serif';ctx.fillText('お',64,46);ctx.fillText('茶',64,104);
 ctx.font='bold 22px sans-serif';ctx.fillText('¥100',64,160);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

/**
 * A fish seller's push cart: two big wheels, a long box of ice with the morning's catch
 * laid on it -- a row of gurukun, a gāra, an irabuchā and a mībai (bought at the auction at six, and the gāra he caught himself: okinawa/fish.js) -- a hanging scale, the
 * shafts he pushes by, and a cloth shade. Front (+z) is the end he pushes from.
 */
export function buildFishCart(){
 const WOOD=0x8a6a48,DARK=0x4b3a2c,ICE=0xdfeef2,TIN=0xa9b3b6,SHADE=0x2f6f8f;
 const parts=[];
 // The body: a shallow tray on a frame, tin-lined, full of ice.
 parts.push(box(.78,.24,1.3,WOOD,[0,.66,0]));
 parts.push(box(.7,.04,1.22,TIN,[0,.79,0]));
 parts.push(box(.66,.05,1.18,ICE,[0,.81,0]));
 // Wheels: rims with spokes, and the axle.
 for(const s of [-1,1]){
  parts.push(part(new THREE.TorusGeometry(.32,.035,6,16),DARK,{at:[s*.45,.36,-.15],rot:[0,Math.PI/2,0]}));
  for(let i=0;i<6;i++)parts.push(part(new THREE.CylinderGeometry(.012,.012,.62,4),WOOD,{at:[s*.45,.36,-.15],rot:[i/6*Math.PI,0,0]}));
  parts.push(cyl(.05,.05,.08,DARK,[s*.45,.36,-.15],8,[0,0,Math.PI/2]));
 }
 parts.push(cyl(.025,.025,.92,DARK,[0,.36,-.15],6,[0,0,Math.PI/2]));
 // A leg at the back so it stands level, and the shafts to push by.
 parts.push(box(.06,.55,.06,DARK,[0,.27,-.6]));
 for(const s of [-1,1])parts.push(box(.05,.05,.7,WOOD,[s*.3,.86,.95]));
 parts.push(cyl(.025,.025,.66,DARK,[0,.86,1.28],6,[0,0,Math.PI/2]));
 // The catch, laid head to tail on the ice.
 const fish=(len,hex,x,z,ry)=>{parts.push(ball(.5,hex,[x,.86,z],[len*.18,.05,len]));parts.push(part(new THREE.ConeGeometry(.045,.08,3),hex,{at:[x+Math.sin(ry)*len*.55,.86,z+Math.cos(ry)*len*.55],rot:[Math.PI/2,0,0]}));};
 const F=id=>fishById(id).colour;
 for(let i=0;i<4;i++)fish(.22,F('gurukun'),-.2+i*.13,-.34,0);
 fish(.28,F('gara'),.18,.1,0);fish(.26,F('irabucha'),-.12,.18,0);fish(.24,F('mibai'),.2,.42,0);
 // The scale on its post, and a cloth shade over it all.
 parts.push(box(.03,.75,.03,DARK,[.35,1.18,.55]));parts.push(cyl(.07,.07,.02,TIN,[.35,1.3,.62],10));
 for(const [x,z] of [[-.36,-.6],[.36,-.6],[-.36,.6],[.36,.6]])parts.push(box(.025,.85,.025,DARK,[x,1.2,z]));
 parts.push(box(.92,.02,1.42,SHADE,[0,1.62,0]));
 for(const z of [-.71,.71])parts.push(box(.92,.12,.01,0xf1efe6,[0,1.56,z]));
 return merge(parts,'Fish cart');
}

/**
 * Puts a tea stop down at (x, y, z) facing `ry`, with its board and the things you can do
 * there: buy a cup of tea (the town's ordinary 'buy' action) and sit a while.
 * @returns {THREE.Group}
 */
export function placeTeaStop(world,options,{x,y,z,ry=0}){
 const group=new THREE.Group();group.name='Tea stop';group.position.set(x,y,z);group.rotation.y=ry;
 group.add(buildTeaStop());
 const t=teaBoardTexture();
 if(t){const board=new THREE.Mesh(new THREE.PlaneGeometry(.3,.45),new THREE.MeshStandardMaterial({map:t,roughness:.9}));board.position.set(1.045,.3,.18);board.rotation.y=Math.PI/2;board.name='Tea stop board';group.add(board);}
 world.group.add(group);
 // The bench and the parasol stone block the way; walking round them is fine.
 const world2=(lx,lz)=>{const v=new THREE.Vector3(lx,0,lz).applyAxisAngle(new THREE.Vector3(0,1,0),ry);return [x+v.x,z+v.z];};
 {const [cx,cz]=world2(0,0);world.colliders.push({x:cx,z:cz,w:Math.abs(Math.cos(ry))*1.95+Math.abs(Math.sin(ry))*.66,d:Math.abs(Math.sin(ry))*1.95+Math.abs(Math.cos(ry))*.66,minY:y,height:.5,teaStop:true});}
 {const [px,pz]=world2(-1.15,-.2);world.colliders.push({x:px,z:pz,w:.4,d:.4,minY:y,height:2.6,teaStop:true});}
 const anchor=new THREE.Object3D();{const [ax,az]=world2(.2,.7);anchor.position.set(ax,y+1,az);}world.group.add(anchor);
 options.register?.(anchor,'Buy a cup of sencha · ¥100',()=>options.onAction?.('buy','Sencha at the tea stop',{cost:100,item:'Green tea',
  text:'A cup of sencha, poured from a brass kettle, and a sata andagi on the side because the lady at the stop says you look like you need one. The red felt is warm from the sun.'}));
 return group;
}
