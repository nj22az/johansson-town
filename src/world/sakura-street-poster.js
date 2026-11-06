import * as THREE from '../../vendor/three.module.js';
import {assetURL} from '../assets.js';

/**
 * Sakura's street poster on another building (drawing SP-NK-001 rev D, docs/qa/sakura-street-poster/). The owner
 * (24 October 2026): "make the ads for Sakura Konbini make a poster we can put on the wall on another building", then
 * "Use another building maybe the ice cream shop".
 *
 * A large poster (1400 x 1980, B proportions; rev C's B1 made bigger at the owner's word: "can you make it bigger?") of
 * Thuan, pasted to a painted 18 mm board on the south wall of Nakamura / Blue Coral, the
 * ice-cream shop: the plain plaster side that faces down Main Street toward Sakura and the harbour, between its window
 * (x ≈ 10) and the back corner (x 13.4). "After the ice cream, a cold tea." Sakura is a short walk down Main Street
 * toward the harbour from here; NAGI ¥120 is the catalogue's price.
 *
 * The wall's face (z -14.150) and what stands on it are read from the town as the game builds it (raycast and
 * tools/street-poster-audit.mjs); the shop front, its flag and its door are on the other face (the open audit in
 * briefs/HANDOFF-NAKAMURA-EXTERIOR-AUDIT-2026-10-24.md) and are not touched.
 *
 * Earlier revisions, on the Harbour Warehouse: rev A sat behind the Fisheries Co-op's enamel sign; rev B on the north gable
 * faced only the narrow lane. Neither was published.
 */
export const SAKURA_STREET_POSTER=Object.freeze({
 revision:'D',
 asset:'graphics/advertising/sakura-street-poster.webp',
 paper:Object.freeze([1400,1980]),board:Object.freeze({w:1440,h:2020,t:18,colour:0x2f4a3c}),
 building:'Nakamura · Blue Coral',face:'south wall',
 centre:Object.freeze({x:11.92,y:1780}),
 wallFace:-14.15,normal:Object.freeze([0,0,-1]),
 // the south wall as built: from the shop front (x 5.7) to the back corner (x 13.4), plaster to the first floor
 wall:Object.freeze({from:5.7,to:13.4,window:Object.freeze([9.55,10.45]),firstFloor:3300}),
 why:'Seen walking up Main Street from Sakura and the harbour, at eye level, on the ice-cream shop’s plain side wall.',
});

/** The poster on its board, in its place. Returns the group (added to `parent`). */
export function addSakuraStreetPoster(parent,{load=url=>new THREE.TextureLoader().load(url)}={}){
 const P=SAKURA_STREET_POSTER,B=P.board,mm=v=>v/1000,out=P.normal[2];
 const g=new THREE.Group();g.name='Sakura street poster · Blue Coral';parent.add(g);
 const paint=new THREE.MeshStandardMaterial({color:B.colour,roughness:.8});
 const print=new THREE.MeshBasicMaterial({color:0xfff4de,toneMapped:false});
 if(globalThis.document?.baseURI){const t=load(assetURL(P.asset));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;print.map=t;print.color.set(0xffffff);}
 // the board on the plaster, its face toward the street below (-z); the paper pasted on it, a 16 mm painted margin
 const board=new THREE.Mesh(new THREE.BoxGeometry(mm(B.w),mm(B.h),mm(B.t)),paint);
 board.name='Sakura street poster board';board.position.set(P.centre.x,mm(P.centre.y),P.wallFace+out*mm(B.t)/2);g.add(board);
 const paper=new THREE.Mesh(new THREE.PlaneGeometry(mm(P.paper[0]),mm(P.paper[1])),print);
 // 3 mm proud of the board's face, beyond the town's 2 mm depth guard; turned to face -z
 paper.name='Sakura street poster print';paper.rotation.y=Math.PI;paper.position.set(P.centre.x,mm(P.centre.y),P.wallFace+out*(mm(B.t)+.003));g.add(paper);
 g.userData.poster=P;
 return g;
}
