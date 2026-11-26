// The flicker detector (tools/flicker-audit.mjs) that found the ferry's z-fighting and shadow acne on 26 November 2026:
// an edge that slides by a pixel is not flicker; a face that changes colour while nothing near it moves is.
import test from 'node:test';
import assert from 'node:assert/strict';
import {unstablePixels,FLICKER_VIEWS} from '../tools/flicker-audit.mjs';

const W=40,H=30;
const picture=paint=>{const d=new Uint8Array(W*H*4);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=paint(x,y),i=(y*W+x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255;}return d;};
const WHITE=[240,236,226],GREY=[120,118,130],YELLOW=[224,185,58];

test('an edge that slides by a pixel, as under a camera moved a fraction of a millimetre, is not flicker',()=>{
 const a=picture((x)=>x<20?WHITE:GREY),b=picture((x)=>x<21?WHITE:GREY);
 assert.equal(unstablePixels(a,b,W,H).count,0);
 assert.equal(unstablePixels(a,a,W,H).count,0);
});

test('stripes that change winner across a face, as two faces in one plane do, are flicker',()=>{
 // Saw-teeth of the backing through a stripe, at a different place in the second picture (the hazard stripes on the vinyl).
 const a=picture((x,y)=>y>=10&&y<20?((x+y*2)%9<3?GREY:YELLOW):WHITE),b=picture((x,y)=>y>=10&&y<20?((x+y*2+4)%9<3?GREY:YELLOW):WHITE);
 const {count,flags}=unstablePixels(a,b,W,H);
 assert.ok(count>20,'flipped pixels: '+count);
 for(let i=0;i<flags.length;i++)if(flags[i]){const y=Math.floor(i/W);assert.ok(y>=10&&y<20,'only in the striped face');}
});

test('the owner’s two photographs are among the views it walks',()=>{
 const ids=FLICKER_VIEWS.map(v=>v.id);
 for(const id of ['car-deck-engine-room-door','engine-room'])assert.ok(ids.includes(id),id);
 assert.equal(new Set(ids).size,ids.length,'view ids are unique');
});
