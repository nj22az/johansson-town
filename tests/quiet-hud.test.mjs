import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createQuietHud,IDLE_MS} from '../src/ui/quiet-hud.js';

// A page with a clock and timers the test moves by hand.
function page(){
 let t=0,next=1;const timers=new Map(),listeners={},classes=new Set();
 const doc={documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)}},
  addEventListener:(type,fn)=>{(listeners[type]||=[]).push(fn);}};
 const hud=createQuietHud({doc,now:()=>t,schedule:(fn,ms)=>{const id=next++;timers.set(id,{fn,at:t+ms});return id;},cancel:id=>timers.delete(id)});
 const advance=ms=>{const end=t+ms;for(;;){const due=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;t=due[1].at;timers.delete(due[0]);due[1].fn();}t=end;};
 const fire=(type,e={})=>{for(const fn of listeners[type]||[])fn({clientX:0,clientY:0,...e});};
 return {hud,advance,fire,has:c=>classes.has(c),tick:ms=>{t+=ms;}};
}

test('the HUD fades after a few seconds without input, and any input brings it back',()=>{
 const p=page();
 p.advance(IDLE_MS-100);assert.equal(p.has('hud-idle'),false);
 p.advance(200);assert.equal(p.has('hud-idle'),true);assert.equal(p.hud.idle,true);
 p.fire('pointerdown');assert.equal(p.has('hud-idle'),false,'a touch wakes it');
 p.advance(IDLE_MS/2);p.fire('keydown',{code:'KeyW'});p.advance(IDLE_MS/2+100);
 assert.equal(p.has('hud-idle'),false,'a key restarts the wait');
 p.advance(IDLE_MS);assert.equal(p.has('hud-idle'),true);
 p.hud.wake();assert.equal(p.has('hud-idle'),false,'walking (reported by the game) wakes it');
 p.fire('wheel');p.hud.rest();assert.equal(p.has('hud-idle'),true,'rest() fades it at once');
 p.hud.hold(true);assert.equal(p.has('hud-idle'),false);p.advance(IDLE_MS*3);assert.equal(p.has('hud-idle'),false,'held awake for the audit');
 p.hud.hold(false);p.advance(IDLE_MS+1);assert.equal(p.has('hud-idle'),true);
});

test('photo mode hides the controls; a tap, H or Escape or a controller button brings them back, a drag does not',()=>{
 const p=page();
 p.hud.photo(true);assert.equal(p.has('hud-photo'),true);
 p.fire('pointerdown',{clientX:100,clientY:100});p.fire('pointermove',{clientX:180,clientY:120});p.fire('pointerup',{clientX:180,clientY:120});
 assert.equal(p.has('hud-photo'),true,'dragging to frame the picture keeps the screen clean');
 p.fire('pointerdown',{clientX:100,clientY:100});p.tick(600);p.fire('pointerup',{clientX:101,clientY:100});
 assert.equal(p.has('hud-photo'),true,'a long press is not a tap');
 p.fire('pointerdown',{clientX:100,clientY:100});p.tick(120);p.fire('pointerup',{clientX:103,clientY:101});
 assert.equal(p.has('hud-photo'),false,'a tap brings the controls back');
 p.hud.togglePhoto();assert.equal(p.hud.photoMode,true);p.fire('keydown',{code:'Escape'});assert.equal(p.hud.photoMode,false);
 p.hud.photo(true);p.hud.button();assert.equal(p.hud.photoMode,false);
 p.hud.photo(true);p.hud.wake();assert.equal(p.hud.photoMode,true,'walking and looking keep the clean view');
});

test('one set of HUD tokens, translucent and readable, with no run button over the picture',async()=>{
 const css=await readFile(new URL('../quiet-hud.css',import.meta.url),'utf8');
 const markup=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(markup,/href="\.\/quiet-hud\.css[^"]*">\s*(?:<link rel="modulepreload"|$)/m,'quiet-hud.css is the last stylesheet, so its tokens win');
 assert.match(markup,/id="cleanViewButton"/,'photo mode has its control in the town book');
 for(const token of ['--hud-surface','--hud-ink','--hud-accent','--hud-blur','--hud-fade','--hud-idle'])assert.match(css,new RegExp(token+':'),token);
 assert.match(css,/#run\{display:none!important\}/,'running is the stick pushed out, not a button');
 assert.match(css,/env\(safe-area-inset-top\)/);assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/prefers-reduced-motion/);
 // Text on the chip stays readable over the darkest and the brightest scene behind it.
 const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
 const lum=rgb=>{const [r,g,b]=rgb.map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b;};
 const ratio=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m);return (x+.05)/(y+.05);};
 const surface=css.match(/--hud-surface:rgb\((\d+) (\d+) (\d+) \/ (\.\d+)\)/),ink=hex(css.match(/--hud-ink:(#[0-9a-f]{6})/)[1]),accent=hex(css.match(/--hud-accent:(#[0-9a-f]{6})/)[1]);
 const [r,g,b,alpha]=surface.slice(1).map(Number);
 for(const behind of [[0,0,0],[255,255,255],[70,130,220]]){
  const chip=[r,g,b].map((v,i)=>Math.round(v*alpha+behind[i]*(1-alpha)));
  assert.ok(ratio(ink,chip)>=4.5,`text ${ratio(ink,chip).toFixed(2)}:1 over ${behind}`);
  assert.ok(ratio(accent,chip)>=3,`icon ${ratio(accent,chip).toFixed(2)}:1 over ${behind}`);
 }
});
