import * as THREE from '../../vendor/three.module.js';
import {buildHarbourNoticeboard,NOTICEBOARD} from './harbour-noticeboard.js';
import {EAST_QUAY} from './okinawa/layout.js';
import {GROUND_LAYER} from './ground-layers.js';
import {fascia,poster} from './okinawa/signs.js';

const S=EAST_QUAY.shed,floor=GROUND_LAYER.apron+.1;
/** Same JW-NB cabinet, hood and 80 mm posts as the harbour board. It faces west into the shed,
 * clear of the catch and columns, leaving the ice-plant lane behind it open. Heights are world datum. */
export const AUCTION_BOARD=Object.freeze({
 ...NOTICEBOARD,origin:[S.maxX-.3,0,(S.minZ+S.maxZ)/2],yaw:-Math.PI/2,
 posts:{...NOTICEBOARD.posts,grade:{left:floor*1000,right:floor*1000}},
 woodland:{paper:[560,780],print:[560,780],centre:[-247.5,1490]},
 flyer:{sheet:[297,420],aspect:256/360,centre:[465,1530]},
});

export function buildAuctionBoard(){
 const N=AUCTION_BOARD,board=buildHarbourNoticeboard({spec:N,
  headerMap:fascia({jp:'Fish auction',en:'MINATO FISHERIES',bg:'#4e6858',accent:'#4e6858'})});
 board.object.name='Minato fish auction noticeboard';board.collider.id='auction-price-board';
 board.collider.height=2.18;
 const notices=[
  {name:'Auction prices',place:N.woodland,width:.56,height:.78,texture:poster({title:"Today's auction",lines:['Maguro ¥2,800','Gurukun ¥900','Irabuchā ¥1,200','Sēika ¥1,500'],bg:'#2c3a33',ink:'#f2efe4',band:'#8a3b2e'})},
  {name:'Auction hours',place:N.flyer,width:.42*N.flyer.aspect,height:.42,texture:poster({title:'Fish auction',lines:['Boats in by 05:00','Auction at 06:00','Floor washed by 07:00']})},
 ];
 for(const {name,place,width,height,texture} of notices){
  const sheet=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));
  sheet.name=name;sheet.position.set(place.centre[0]/1000,place.centre[1]/1000,(N.backingFront+.5)/1000);
  board.object.add(sheet);
 }
 return board;
}
