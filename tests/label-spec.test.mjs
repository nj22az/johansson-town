import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeLabelSpec,brandSpec,labelWords,labelPictures,MAX_LAYERS,LAYER_TYPES,ARTS} from '../src/studio/label-spec.js';
import {PRODUCTS,PRODUCT_BY_ID} from '../src/commerce/products-data.js';
import {brandProblems} from '../src/studio/rules.js';

// A label design (src/studio/label-spec.js): what Studio and the tools accept, and the "Redraw from brand" design.
const brands=JSON.parse(await readFile(new URL('../data/studio/brand-rules.json',import.meta.url),'utf8'));
const spec=(layers,extra={})=>({v:1,base:'paper',layers,...extra});
const sentences=r=>r.problems.map(p=>p.sentence).join(' ');

test('a design of every kind of layer comes back cleaned: colours lower case, texts NFKC, numbers rounded',()=>{
 const r=normalizeLabelSpec(spec([
  {type:'band',y:0,h:.2,colour:'INK'.toLowerCase()},{type:'stripe',x:.1,w:.02,colour:'#AABBCC'},
  {type:'shape',shape:'roundel',x:.3,y:.5,w:.13,h:.26,colour:'accent',line:'#ffffff',angle:15},
  {type:'symbol',symbol:'gull',x:.5,y:.1,size:.14,colour:'paper'},
  {type:'text',text:'ＵＭＩＮＥＫＯ',font:'gothic',x:.5,y:.12,size:.13,colour:'paper',weight:'bold',align:'center',outline:'ink',maxWidth:.3},
  {type:'art',art:'beer',x:.5,y:.64,size:.46,opacity:.9},
  {type:'picture',file:'beer-picture.r1.webp',x:.5,y:.5,w:1,h:1,words:['Umineko','海猫']},
 ]));
 assert.equal(sentences(r),'');
 assert.equal(r.spec.layers[1].colour,'#aabbcc');assert.equal(r.spec.layers[4].text,'UMINEKO','full-width letters become plain ones');
 assert.deepEqual(labelWords(r.spec),['UMINEKO','Umineko','海猫']);assert.deepEqual(labelPictures(r.spec),['beer-picture.r1.webp']);
 assert.deepEqual([...LAYER_TYPES].sort(),[...new Set(r.spec.layers.map(l=>l.type))].sort(),'every kind of layer was tried');
});

test('numbers outside their range are clamped and reported, not refused',()=>{
 const r=normalizeLabelSpec(spec([{type:'text',text:'Big',font:'maru',x:2,y:.5,size:.9,colour:'ink'}]));
 assert.equal(sentences(r),'');assert.equal(r.spec.layers[0].x,1.5);assert.equal(r.spec.layers[0].size,.6);
 assert.deepEqual(r.clamped.map(c=>c.where.split('.').pop()),['x','size']);
});

test('refuses, in plain words, what a label cannot be',()=>{
 const cases=[
  [null,/must be \{v:1, base, layers\}/],
  [spec([],{v:2}),/version 1/],
  [spec([],{base:'gold'}),/base is "paper"/],
  [spec([],{extra:1}),/no field "extra"/],
  [spec(Array.from({length:MAX_LAYERS+1},()=>({type:'band',y:0,h:.1,colour:'ink'}))),/at most 24 layers/],
  [spec([{type:'hologram'}]),/"hologram" is not a kind of layer/],
  [spec([{type:'band',y:0,h:.1,colour:'red'}]),/brand colour .* or a colour written #rrggbb/],
  [spec([{type:'band',y:0,h:.1}]),/needs colour/],
  [spec([{type:'band',y:0,h:.1,colour:'ink',onclick:'x'}]),/no field "onclick"/],
  [spec([{type:'text',text:'Hi',font:'comic-sans',x:.5,y:.5,size:.1,colour:'ink'}]),/"comic-sans" is not a choice for font/],
  [spec([{type:'text',text:'<script>',font:'gothic',x:.5,y:.5,size:.1,colour:'ink'}]),/may not contain "<"/],
  [spec([{type:'text',text:'a\u0007b',font:'gothic',x:.5,y:.5,size:.1,colour:'ink'}]),/control character/],
  [spec([{type:'text',text:'x'.repeat(61),font:'gothic',x:.5,y:.5,size:.1,colour:'ink'}]),/keep it to 60/],
  [spec([{type:'symbol',symbol:'skull',x:.5,y:.5,size:.1,colour:'ink'}]),/not a choice for symbol/],
  [spec([{type:'art',art:'cigarettes',x:.5,y:.5,size:.4}]),/not a choice for art/],
  [spec([{type:'picture',file:'../../etc/passwd',x:.5,y:.5,w:1,h:1,words:[]}]),/not a picture this label can use/],
  [spec([{type:'picture',file:'beer-picture.r1.webp',x:.5,y:.5,w:1,h:1}]),/needs words/],
  [spec([{type:'text',text:'Hi',font:'gothic',x:'left',y:.5,size:.1,colour:'ink'}]),/x is a number/],
 ];
 for(const [given,expected] of cases)assert.match(sentences(normalizeLabelSpec(given)),expected,JSON.stringify(given)?.slice(0,80));
 // A picture the change carries is allowed only when the caller says so.
 const carried=spec([{type:'picture',file:'beer.photo.png',x:.5,y:.5,w:1,h:1,words:[]}]);
 assert.match(sentences(normalizeLabelSpec(carried)),/not a picture/);
 assert.equal(sentences(normalizeLabelSpec(carried,{pictures:f=>f==='beer.photo.png'})),'');
});

test('"Redraw from brand" gives every product a valid design in its own words, free of real brands',()=>{
 for(const p of PRODUCTS){
  const r=normalizeLabelSpec(brandSpec(p));
  assert.equal(sentences(r),'',p.id);assert.equal(r.clamped.length,0,p.id);
  assert.ok(labelWords(r.spec).includes(p.brand.name)&&labelWords(r.spec).includes(p.brand.line),p.id);
  for(const word of labelWords(r.spec))assert.deepEqual(brandProblems(word,'label',brands),[],`${p.id}: ${word}`);
 }
 const beer=brandSpec(PRODUCT_BY_ID.beer);
 assert.ok(beer.layers.some(l=>l.type==='art'&&l.art==='beer'));assert.ok(ARTS.includes('beer'));
 assert.equal(beer.layers.filter(l=>l.type==='text'&&l.text==='UMINEKO').length,3,'a can carries its name round its sides too');
});
