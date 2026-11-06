import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {Element} from './fixtures.mjs';
import {createLoadingProgress} from '../loading-progress.js';

test('a preview failure presents Retry immediately and cannot offer START',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const inline=html.slice(html.indexOf("import {createLoadingFacts}"),html.indexOf('</script>',html.indexOf("import {createLoadingFacts}")))
  .replace(/^import .*;$/gm,'')
  .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,'previewImport()');
 const elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 const document={getElementById:element,querySelectorAll:()=>[],activeElement:null,body:new Element(),addEventListener(){}};
 element('enter').disabled=true;element('fatal').querySelector('button').hidden=true;
 const window={};let reloaded=false;
 runInNewContext(inline,{window,document,navigator:{userAgent:'iPhone'},performance:{now:()=>0},
  matchMedia:()=>({matches:false}),setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},
  createLoadingProgress,createLoadingFacts:()=>({stop(){},start(){}}),createTitleMenu(){},unlockTownAudio(){},
  previewImport:async()=>{throw Error('Error creating WebGL context.');},console:{error(){},warn(){}},
  location:{reload(){reloaded=true;}}});
 await assert.rejects(window.__JOHANSSON_PREVIEW_PROMISE__,/WebGL/);
 assert.equal(element('fatal').classList.contains('hidden'),false,'The error is visible without pressing START');
 assert.match(element('fatal').querySelector('p').textContent,/3D graphics engine/);
 assert.equal(element('fatal').querySelector('button').hidden,false,'Retry remains available');
 assert.equal(element('enter').disabled,true,'A rejected preview cannot be entered');
 assert.equal(window.__JOHANSSON_BOOTING__,false);
 element('retry').listeners.click[0]();assert.equal(reloaded,true);
});
