import * as THREE from '../../vendor/three.module.js';
import {buildAvatar} from '../avatars/build.js';
import {recipeFor} from '../avatars/cast.js';
import {COSTUMES,buildCostumeHead} from './costumes.js';

/**
 * A townsperson playing pretend: their own avatar from the creator -- their face, hair,
 * clothes and build, exactly as in town -- with the animal's hood over the head in place of
 * any hat, paws over the hands and a tail at the back. Not a suit: it has to be plain who is
 * in there. Thuan's Storage brings the night's boss up the sea-cave hole like this
 * (thuans-storage/src/game.js), and moves the bones to make them behave like the animal.
 */
const TAILS={crocodile:'long',donkey:'tuft',bear:'stub',gorilla:null,tanuki:'bushy',fox:'bushy',shark:'fin',owl:null,octopus:null,seagull:'feathers'};

export function buildPretend(who,{faceSize=256,shadows=true}={}){
 const look=COSTUMES[who];if(!look)throw Error('No costume for '+who);
 const avatar=buildAvatar(recipeFor(who),{shadows,faceSize});
 avatar.setHat(false);
 // Facing +z, as the hood is built and as the stockroom's bosses face (the town turns avatars round).
 avatar.root.rotation.y=0;
 const m=avatar.measure,{bones}=avatar;
 const hood=buildCostumeHead(look.animal,{R:m.Rh,cy:m.headCentre-m.headY,sx:m.headSX,sy:m.headSY,colour:look.colour,belly:look.belly});
 bones.head.add(hood);
 const fur=new THREE.MeshStandardMaterial({color:look.colour,roughness:.85}),pale=new THREE.MeshStandardMaterial({color:look.belly,roughness:.85});
 // Paws: a furry mitt over each hand, a pale pad on the palm.
 const paws=[bones.handL,bones.handR].map(hand=>{
  const paw=new THREE.Group();paw.name='Pretend paw';
  // Bigger than the hand it covers, so it reads as a mitt from across the stockroom.
  const mitt=new THREE.Mesh(new THREE.SphereGeometry(m.hand*1.3,14,10),fur);mitt.scale.set(1,1.2,1);mitt.position.y=-m.hand*.7;paw.add(mitt);
  const pad=new THREE.Mesh(new THREE.SphereGeometry(m.hand*.6,10,8),pale);pad.position.set(0,-m.hand*.8,m.hand*1.05);pad.scale.z=.45;paw.add(pad);
  hand.add(paw);return paw;
 });
 // The tail, from the small of the back.
 const kind=TAILS[look.animal];let tail=null;
 if(kind){
  tail=new THREE.Group();tail.name='Pretend tail';tail.position.set(0,0,-m.Rh*.9);
  // A costume tail hangs: down the back of the legs to the floor, so lying flat it lies flat behind.
  if(kind==='long'){for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.ConeGeometry(m.Rh*(.55-i*.1),m.Rh*1.1,8),fur);s.rotation.x=Math.PI+.22;s.position.set(0,-m.Rh*(.3+i*.8),-m.Rh*(.3+i*.18));tail.add(s);}}
  else if(kind==='tuft'){const rope=new THREE.Mesh(new THREE.CylinderGeometry(m.Rh*.06,m.Rh*.06,m.Rh*2.2,6),fur);rope.rotation.x=.5;rope.position.set(0,-m.Rh*1,-m.Rh*.45);tail.add(rope);const tuft=new THREE.Mesh(new THREE.SphereGeometry(m.Rh*.22,8,6),new THREE.MeshStandardMaterial({color:'#2a2522',roughness:.9}));tuft.position.set(0,-m.Rh*1.95,-m.Rh*.95);tuft.scale.y=1.6;tail.add(tuft);}
  else if(kind==='stub'){tail.add(new THREE.Mesh(new THREE.SphereGeometry(m.Rh*.35,10,8),fur));}
  else if(kind==='bushy'){const b=new THREE.Mesh(new THREE.SphereGeometry(m.Rh*.5,12,8),fur);b.scale.set(.7,.7,1.8);b.position.set(0,m.Rh*.2,-m.Rh*.8);b.rotation.x=.6;tail.add(b);}
  else if(kind==='fin'){const f=new THREE.Mesh(new THREE.ConeGeometry(m.Rh*.4,m.Rh*1.2,3),fur);f.rotation.x=-Math.PI/2;f.position.z=-m.Rh*.5;f.scale.x=.3;tail.add(f);}
  else{for(const s of [-1,0,1]){const f=new THREE.Mesh(new THREE.ConeGeometry(m.Rh*.12,m.Rh*.9,5),pale);f.rotation.set(-Math.PI/2-.4,0,s*.3);f.position.set(s*m.Rh*.15,0,-m.Rh*.4);tail.add(f);}}
  bones.hips.add(tail);
 }
 avatar.root.traverse(o=>{if(o.isMesh){o.castShadow=shadows;o.frustumCulled=false;}});
 return {avatar,root:avatar.root,bones,hood,paws,tail,look,height:avatar.height,
  /** Their face, as the animal moment needs it: 'angry' charging, 'surprised' seeing stars. */
  face(expression='smile'){avatar.paintFace({expression});},
  dispose(){avatar.dispose();fur.dispose();pale.dispose();}};
}
