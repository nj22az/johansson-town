import test from 'node:test';
import assert from 'node:assert/strict';
import {ALBUM_SLOTS,PHOTO_W,PHOTO_H,packShades,unpackShades,photoProblems,restoreAlbum,addPhoto,removePhoto,nextPhotoId,photoCaption,photosOf,photosAt} from '../src/photo/pocket-album.js';

const N=PHOTO_W*PHOTO_H;
const shades=seed=>Uint8Array.from({length:N},(_,i)=>(i*7+seed*3+(i>>5))&3);
const photo=(over={})=>({w:PHOTO_W,h:PHOTO_H,shades:packShades(shades(1)),palette:'green',day:2,minutes:12*60+40,place:{id:'ramen',title:'Sato Ramen'},people:['Mrs Sato','Thuan'],note:'',...over});

test('a photo is two bits a pixel: 3,584 bytes for 128x112, and comes back exactly',()=>{
 const s=shades(5),text=packShades(s);
 assert.equal(atob(text).length,N/4);
 assert.equal(N/4,3584);
 assert.deepEqual(unpackShades(text,N),s);
 assert.equal(unpackShades(text,N+4),null,'the wrong size is not a photo');
 assert.equal(unpackShades('not base64!',N),null);
});

test('thirty photos fit: a full album is about 143 KB in the save',()=>{
 let album=[];for(let i=0;i<ALBUM_SLOTS;i++)album=addPhoto(album,photo({shades:packShades(shades(i))})).album;
 assert.equal(album.length,30);
 const size=JSON.stringify(album).length;
 assert.ok(size<150000,`${size} characters`);
});

test('a full album refuses in words and is not changed; letting one go makes room',()=>{
 let album=[];for(let i=0;i<ALBUM_SLOTS;i++)album=addPhoto(album,photo()).album;
 const r=addPhoto(album,photo());
 assert.equal(r.ok,false);assert.match(r.problems[0],/album is full: 30 photos/);
 assert.equal(album.length,30);
 album=removePhoto(album,'ph7');assert.equal(album.length,29);
 const kept=addPhoto(album,photo());assert.equal(kept.ok,true);assert.equal(kept.photo.id,'ph31','numbers are never reused');
});

test('a damaged photo is refused, and a saved album keeps only sound photos, once each',()=>{
 assert.match(photoProblems(photo())[0],/number/);
 assert.match(photoProblems({...photo({w:160}),id:'ph1'})[0],/128 by 112/);
 assert.match(photoProblems({...photo({shades:'AAAA'}),id:'ph1'})[0],/damaged/);
 assert.match(photoProblems({...photo({palette:'pink'}),id:'ph1'})[0],/print colour/);
 assert.match(photoProblems({...photo({minutes:2000}),id:'ph1'})[0],/date/);
 assert.match(photoProblems({...photo({people:['']}),id:'ph1'})[0],/people/);
 const good={...photo(),id:'ph1'},album=restoreAlbum([good,{...good},{...photo(),id:'ph2',w:1},null,'x',{...photo(),id:'ph3',people:['Thuan\u0007']}]);
 assert.deepEqual(album.map(p=>p.id),['ph1','ph3']);
 assert.deepEqual(album[1].people,['Thuan'],'control characters are cleaned');
 assert.deepEqual(restoreAlbum('nonsense'),[]);
 assert.equal(nextPhotoId(album),'ph4');
});

test('a caption says who, where and when; the storyteller can ask by person and by place',()=>{
 // Day 2 is Saturday 3 January 1970 on the device calendar (the owner, 26 October 2026; johansson-town/AGENTS.md); the old
 // projection into 1997 made it a Friday.
 const p=addPhoto([],photo()).photo;
 assert.equal(photoCaption(p),'Mrs Sato and Thuan · Sato Ramen · Saturday 3 January, 12:40');
 assert.equal(photoCaption({...p,people:[],place:null}),'Saturday 3 January, 12:40');
 assert.equal(photoCaption({...p,people:['A','B','C']}),'A, B and C · Sato Ramen · Saturday 3 January, 12:40');
 const album=[p,addPhoto([p],photo({people:['Thuan'],place:{id:'pier',title:'The pier'}})).photo];
 assert.deepEqual(photosOf(album,'Thuan').map(x=>x.id),['ph1','ph2']);
 assert.deepEqual(photosOf(album,'Mrs Sato').map(x=>x.id),['ph1']);
 assert.deepEqual(photosAt(album,'pier').map(x=>x.id),['ph2']);
});

test('a kept photo becomes a moment: the first of a resident is news, later ones are notes',async()=>{
 const {photoMoment}=await import('../src/photo/pocket-album.js');
 const first=addPhoto([],photo()).photo;
 const m=photoMoment(first,{seen:[]});
 assert.equal(m.id,'photo:ph1');assert.equal(m.kind,'discovery');assert.deepEqual(m.who,['Mrs Sato','Thuan']);
 assert.equal(m.text,'Took a photo of Mrs Sato and Thuan at Sato Ramen with my Pocket Gentleman camera. My first photo of Mrs Sato and Thuan.');
 assert.equal(m.news,'Mrs Sato and Thuan were photographed by the mayor at Sato Ramen today. The mayor has a Pocket Gentleman camera.');
 const seen=['Mrs Sato','Thuan'];
 const again=photoMoment({...first,id:'ph2',people:['Thuan']},{seen});
 assert.equal(again.kind,'note');assert.equal(again.news,undefined);
 assert.equal(again.text,'Took a photo of Thuan at Sato Ramen with my Pocket Gentleman camera.');
 const place=photoMoment({...first,id:'ph3',people:[],place:{id:'pier',title:'The pier'}},{seen});
 assert.equal(place.text,'Took a photo at the pier with my Pocket Gentleman camera.');assert.equal(place.who,undefined);
 const street=photoMoment({...first,id:'ph6',people:['Tōma'],place:{id:'photo-main',title:'Main shopping street',at:'on the main shopping street'}},{seen});
 assert.equal(street.text,'Took a photo of Tōma on the main shopping street with my Pocket Gentleman camera. My first photo of Tōma.');
 assert.equal(street.news,'Tōma was photographed by the mayor on the main shopping street today. The mayor has a Pocket Gentleman camera.');
 assert.equal(photoMoment({...first,id:'ph4',people:[],place:null},{seen}).text,'Took a photo with my Pocket Gentleman camera.');
 const newcomer=photoMoment({...first,id:'ph5',people:['Thuan','Reiko']},{seen});
 assert.equal(newcomer.news,'Reiko was photographed by the mayor at Sato Ramen today. The mayor has a Pocket Gentleman camera.');
});

test('the camera is a fictional model: the Pocket Gentleman, or the pink Pocket Lady for a feminine look',async()=>{
 const {POCKET_MODELS,pocketModelFor,pocketModelOfPhoto}=await import('../src/photo/pocket-models.js');
 const {POCKET_PALETTES}=await import('../src/photo/pocket-camera.js');
 const {photoMoment}=await import('../src/photo/pocket-album.js');
 assert.equal(pocketModelFor({body:{silhouette:'feminine'}}).name,'Pocket Lady');
 assert.equal(pocketModelFor({body:{silhouette:'masculine'}}).name,'Pocket Gentleman');
 assert.equal(pocketModelFor({body:{silhouette:'neutral'}}).name,'Pocket Gentleman');
 assert.equal(pocketModelFor(null).name,'Pocket Gentleman','Johansson, before any look is chosen');
 for(const m of Object.values(POCKET_MODELS))assert.ok(POCKET_PALETTES[m.palette],m.name+' has its screen shades');
 // A photo says which camera took it, in the diary and the news.
 const lady=addPhoto([],photo({palette:'rose'})).photo;
 assert.equal(pocketModelOfPhoto(lady).name,'Pocket Lady');
 const m=photoMoment(lady,{seen:[]});
 assert.match(m.text,/with my Pocket Lady camera\./);assert.match(m.news,/The mayor has a Pocket Lady camera\.$/);
 assert.equal(pocketModelOfPhoto({palette:'grey'}).name,'Pocket Gentleman');
 // No real product is named anywhere a player reads.
 for(const text of [m.text,m.news,...Object.values(POCKET_MODELS).map(x=>x.name)])assert.doesNotMatch(text,/game ?boy|nintendo|pocket camera/i);
});
