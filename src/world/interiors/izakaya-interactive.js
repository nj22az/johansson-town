import * as THREE from '../../../vendor/three.module.js';
import {buildIzakayaDevices,buildKeptBottleVisual} from './izakaya-devices.js';
import {MINATO_1997_POSTERS,KEEP_SHELF,BOTTLE_KEEP} from './izakaya-dressing.js';

/**
 * The things in Minato you can use.
 *
 * - The pink telephone on its shelf by the door (a 1997 izakaya's own public phone,
 *   ¥10 a call): the harbour office, the ferry desk, Sakura.
 * - The bottle keep: read whose bottles they are, or keep one of your own, which then
 *   stands on the shelf with your name on its tag.
 * - The laserdisc karaoke on its cabinet at the end of the koagari.
 * - The posters and the tanuki, each with something to say.
 *
 * The actions are handled in people/izakaya-play.js.
 */
export const PINK_PHONE=Object.freeze({x:3.42,y:.95,z:6.16});
export const KARAOKE=Object.freeze({x:5.86,z:5.2,w:.62,d:.48,h:.72});
const POSTER_LINES=Object.freeze({
 beer:['Umineko Beer · Summer 1997','The summer campaign is still up in October. Thao says she will take it down when the brewery rep brings the winter one, and the brewery rep says the same about her.'],
 enka:['Harbour Lights · Kayoko Shima','An enka evening at the harbour hall on Saturday the 25th. Mr Higa has two tickets and has not yet decided who the second one is for.'],
 police:['If you drink, don’t drive','The police station’s notice. Officer Mori put it up himself, then sat down under it with a beer. He walked home.'],
 karaoke:['Karaoke contest','Last Friday of the month, from nine. The prize is a bottle on the keep shelf with your name on it. Chin has won it three times running.'],
 baseball:['Minato Seagulls · autumn fixtures','Home to Aoba on the 25th. The Seagulls have not beaten Aoba since 1989, and the whole counter will tell you why.'],
});

function screenTexture(){
 const c=document.createElement('canvas');c.width=256;c.height=192;const x=c.getContext('2d');
 const g=x.createLinearGradient(0,0,0,192);g.addColorStop(0,'#1d2a6b');g.addColorStop(1,'#6b1d5a');x.fillStyle=g;x.fillRect(0,0,256,192);
 x.fillStyle='#ffe14d';x.font='900 30px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('KARAOKE',128,60);
 x.fillStyle='#ffffff';x.font='700 18px sans-serif';x.fillText('Insert ¥100 · pick a song',128,120);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export function buildIzakayaInteractive(room,{anchor,action,collider,layout={}}){
 const P=layout.phone||PINK_PHONE,K=layout.karaoke||KARAOKE;
 buildIzakayaDevices(room,P,K);
 // The CRT and player controls both face the clear approach from the entry.
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(.38,.25),new THREE.MeshBasicMaterial({map:screenTexture(),toneMapped:false}));
 screen.position.set(K.x-.009,(K.y||0)+K.h+.208,K.z-.208);screen.rotation.y=Math.PI;screen.name='Minato karaoke screen';room.add(screen);
 // The player's own bottle: hidden until they keep one (see setPlayerBottle).
 const S=layout.keepShelf||KEEP_SHELF,mine=buildKeptBottleVisual();
 // At the end of the top board, past the regulars'.
 mine.position.set(S.x+.11,S.levels.at(-1),S.z+S.width/2-.05);room.add(mine);
 if(collider){collider(K.x,K.z,K.w,K.d,1.1);collider(P.x,P.z,.4,.26,1.3);}
 if(anchor&&action){
  anchor([P.x,1.25,P.z-.6],'Use the pink telephone',()=>action('izakaya-phone'));
  anchor([S.x+.7,1.6,S.z],'Read the bottle-keep tags',()=>action('bottle-keep'));
  anchor([K.x-.55,1.0,K.z-.45],'Sing at the karaoke',()=>action('karaoke'));
  for(const [cell,x,y,z,yaw] of layout.posters||MINATO_1997_POSTERS){
   const n=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),[title,text]=POSTER_LINES[cell];
   anchor([x+n.x*.45,Math.min(1.75,y),z+n.z*.45],'Read the '+title.split(' · ')[0]+' poster',()=>action('inspect',title,text));
  }
  const T=layout.tanuki||{x:2.25,y:0,z:5.78};
  const scale=T.scale||1;
  anchor([T.x,(T.y||0)+.8*scale,T.z-.48*scale],'Pat the tanuki',()=>action('inspect','The tanuki','A potbellied tanuki in a straw hat, a sake flask in one paw and an unpaid bill in the other. Thao pats his belly on the way in every evening, for trade. So does Mr Fujita, once he has signed off, for luck.'));
 }
 return {
  /** Shows the player's own bottle, tagged, once they keep one at the counter. */
  setPlayerBottle(on){mine.visible=!!on;},
  regulars:BOTTLE_KEEP,
 };
}
