import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {CAST_NAMES} from '../src/people/cast.js';
import {ACTIVE_RESIDENT_NAMES} from '../src/people/residents.js';
import {NEIGHBOURS} from '../src/people/neighbours.js';
import {homeForResident,secondaryHomesFor} from '../src/people/island-households.js';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root));
test('published photo articles retain their real model portraits and canonical household data',async()=>{
 const catalogue=JSON.parse(await read('guide/residents.json'));
 for(const r of catalogue)assert.ok(CAST_NAMES.includes(r.name),r.name+' belongs to the canonical cast');
 assert.equal(new Set(catalogue.map(r=>r.name)).size,catalogue.length);
 for(const r of catalogue){
  const home=homeForResident(r.name);assert.equal(r.home.id,home.home,r.name+' has the canonical primary home');assert.equal(r.home.address,home.address);assert.deepEqual(r.home.residents,[...home.residents]);
  assert.deepEqual(r.secondaryHomes.map(h=>h.id),secondaryHomesFor(r.name).map(h=>h.home),r.name+' has every secondary residence');
  assert.ok(r.islandPersonality?.ambition&&r.islandPersonality?.habit&&r.islandPersonality?.traits?.length===3,r.name+' has an island personality');assert.doesNotMatch(r.backstory,/Nils|homage|real life|fictional character|creator of this town/);
  for(const field of ['role','place','bio','backstory'])assert.ok(r[field]?.length>0,r.name+' '+field);
  const a=r.article;assert.ok(a?.headline&&a.standfirst&&a.quote,r.name+' has a headline, standfirst and quote');
  assert.ok(a.body.length>=3&&a.body.every(p=>p.length>40),r.name+' has a real article');
  assert.ok(a.photos.length>=2,r.name+' has photo-shoot pictures');
  for(const p of a.photos){assert.ok(p.caption,r.name+' photo caption');const img=await read(p.file);assert.equal(img.subarray(0,4).toString(),'RIFF',p.file);assert.ok(img.length>2000,p.file+' has detail');}
  const data=await read(r.portrait);
  assert.equal(data.subarray(0,4).toString(),'RIFF',r.name+' is a WebP image');
  assert.ok(data.length>2000,r.name+' has rendered detail');
 }
 const context={window:{}};vm.runInNewContext((await read('resident-guide.js')).toString(),context);
 assert.deepEqual(JSON.parse(JSON.stringify(context.window.JOHANSSON_RESIDENT_GUIDE)),catalogue);
 const manifest=JSON.parse(await read('guide/portraits.json')),hash=createHash('sha256');
 for(const path of manifest.sourceFiles)hash.update(path+'\0').update(await read(path)).update('\0');
 assert.equal(manifest.sha256,hash.digest('hex'),'Portraits must be regenerated after avatar source changes');
 assert.equal(manifest.count,catalogue.length);
});
test('title opens first and keeps game launch and separate guide navigation',async()=>{
 const html=(await read('index.html')).toString();
 assert.match(html,/<section id="start">/);assert.doesNotMatch(html,/class="logo-jp"/);
 assert.match(html,/data-town-enter/);assert.match(html,/data-guide-close/);
 assert.ok(html.indexOf('resident-guide.js')<html.indexOf('landing.js'));
 assert.doesNotMatch(html,/fictional|playable demo|still being built/i);
 assert.doesNotMatch(html,/town-residents\.webp/);
});
