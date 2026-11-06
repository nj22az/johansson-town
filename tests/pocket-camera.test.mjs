import test from 'node:test';
import assert from 'node:assert/strict';
import {POCKET_MATRIX,POCKET_PALETTES,POCKET_LEVELS,pocketSize,pocketThresholds,luma,expose,ditherLuma,paint} from '../src/photo/pocket-camera.js';
import {FILMS,filmCSS,applyFilm} from '../src/photo/sets.js';

test('the dither cell is a 4x4 Bayer matrix, in the order the camera cartridge fills it',()=>{
 assert.deepEqual([...POCKET_MATRIX].sort((a,b)=>a-b),[...Array(16).keys()],'each rank once');
 const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],transposed=bayer.map((_,i)=>bayer[(i%4)*4+Math.floor(i/4)]);
 assert.deepEqual([...POCKET_MATRIX],transposed);
 // Neighbouring ranks sit far apart: 0 and 1 are on opposite corners of a 2x2 block's diagonal.
 assert.equal(POCKET_MATRIX.indexOf(0),0);assert.equal(POCKET_MATRIX.indexOf(1),10);
});
test('three threshold planes ramp from one tone level to the next in sixteen steps',()=>{
 const t=pocketThresholds([0,64,128,192]);
 for(let plane=0;plane<3;plane++){
  const values=Array.from({length:16},(_,cell)=>t[cell*3+plane]).sort((a,b)=>a-b);
  assert.equal(values[0],plane*64);assert.equal(values[15],plane*64+60);
  values.forEach((v,i)=>assert.equal(v,plane*64+i*4));
 }
 for(let cell=0;cell<16;cell++)assert.ok(t[cell*3]<t[cell*3+1]&&t[cell*3+1]<t[cell*3+2],'planes stay in order in every cell');
});
test('flat greys dither to the right mix of shades; black and white stay solid',()=>{
 const w=16,h=16,flat=v=>new Float32Array(w*h).fill(v),count=(s,k)=>s.filter(x=>x===k).length;
 assert.equal(count(ditherLuma(flat(0),w,h),0),w*h);assert.equal(count(ditherLuma(flat(255),w,h),3),w*h);
 const [a,b,c,d]=POCKET_LEVELS,mid=a+(b-a)*7.5/16,shades=ditherLuma(flat(mid),w,h);
 assert.equal(count(shades,0)+count(shades,1),w*h,'a grey between two levels uses only those two shades');
 assert.equal(count(shades,1),w*h/2,'7.5 steps of 16 up the ramp: half of each');
 assert.ok(ditherLuma(flat((c+d)/2),w,h).every(s=>s===2||s===3));
 // Brighter in, never darker out: the dither is monotone for every pixel.
 let previous=ditherLuma(flat(0),w,h);for(let v=4;v<=255;v+=4){const next=ditherLuma(flat(v),w,h);assert.ok(next.every((s,i)=>s>=previous[i]));previous=next;}
});
test('edges are sharpened before the dither, and turning that off leaves a flat field flat',()=>{
 const w=8,h=4,l=new Float32Array(w*h).map((_,i)=>i%w<4?70:150);
 const sharp=ditherLuma(l,w,h,{edge:.6}),soft=ditherLuma(l,w,h,{edge:0});
 assert.ok(sharp[3]<=soft[3]&&sharp[4]>=soft[4],'the dark side darkens and the light side lightens at the edge');
 assert.deepEqual(ditherLuma(new Float32Array(16).fill(90),4,4,{edge:.6}),ditherLuma(new Float32Array(16).fill(90),4,4,{edge:0}));
});
test('pictures keep their shape at camera size, and the films are offered',()=>{
 assert.deepEqual(pocketSize(128/112),{w:128,h:112});assert.deepEqual(pocketSize(1),{w:112,h:112});assert.deepEqual(pocketSize(3/4),{w:112,h:149});assert.deepEqual(pocketSize(NaN),{w:112,h:112});
 assert.deepEqual([...luma(new Uint8ClampedArray([255,255,255,255,0,0,0,255]))].map(Math.round),[255,0]);
 for(const p of Object.values(POCKET_PALETTES)){assert.equal(p.length,4);const y=p.map(([r,g,b])=>.299*r+.587*g+.114*b);assert.ok(y.every((v,i)=>!i||v>y[i-1]),'darkest first');}
 assert.deepEqual([...paint(Uint8Array.of(0,3),POCKET_PALETTES.grey)],[...POCKET_PALETTES.grey[0],255,...POCKET_PALETTES.grey[3],255]);
 for(const id of ['pocket','pocketGrey','pocketLady']){assert.ok(FILMS[id].pocket in POCKET_PALETTES);assert.equal(filmCSS(id),'none','no CSS filter: the preview canvas shows it');const px=Uint8ClampedArray.of(10,20,30,255);assert.deepEqual([...applyFilm(px,id)],[10,20,30,255]);}
});
test('automatic exposure spreads a pale or dim picture over the tones, but leaves a flat one calm',()=>{
 const pastel=Float32Array.from({length:1000},(_,i)=>200+(i%50));expose(pastel);
 assert.ok(Math.min(...pastel)<60&&Math.max(...pastel)>200,'a pale set uses dark and light shades');
 const dim=Float32Array.from({length:1000},(_,i)=>10+(i%60));expose(dim);assert.ok(Math.max(...dim)>190);
 const flat=Float32Array.from({length:1000},(_,i)=>120+(i%4));expose(flat);assert.ok(Math.max(...flat)-Math.min(...flat)<=3*4+1e-6,'capped gain');
 const order=Float32Array.of(5,90,30,250);expose(order);assert.ok(order[0]<=order[2]&&order[2]<=order[1]&&order[1]<=order[3],'order is kept');
 assert.equal(expose(new Float32Array(0)).length,0);
});
