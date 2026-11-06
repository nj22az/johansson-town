// Run with CODEX_PRIMARY_RUNTIME_NODE_MODULES set and CREATOR_CHROME pointing to Chromium.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:process.env.CREATOR_CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
// Each size is tried on its own and every failure is reported at the end, so one size's failure never hides another's.
// 820×1180 and 744×1133 are an iPad Air and an iPad mini held upright, 1180×820 the creator's iPad on its side.
const SIZES=(process.env.CREATOR_SIZES?JSON.parse(process.env.CREATOR_SIZES):[[320,568],[390,844],[844,390],[1280,800],[1180,820],[820,1180],[744,1133],[320,360]]);
const failures=[];
const tabName=id=>({body:'Body',head:'Face',hair:'Hair',eyes:'Eyes',brows:'Brows',nose:'Nose',mouth:'Mouth',extras:'Glasses & beard',outfits:'Outfits',top:'Top',bottom:'Bottoms',shoes:'Shoes',accessories:'Accessories',hat:'Hats & bows'})[id];
try{
 for(const [width,height] of SIZES)try{
  const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.env.CREATOR_LOCAL_FILES)await page.route('http://127.0.0.1:5173/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   try{const file=new URL('..'+path,import.meta.url);await route.fulfill({body:await readFile(file),contentType:path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html'});}
   catch{await route.fulfill({status:404,body:'Not found'});}
  });
  await page.route('**/creator-review.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/tomodachi-ui.css"></head><body><button id="opener">Open</button></body></html>'}));
  await page.goto('http://127.0.0.1:5173/creator-review.html');
  await page.evaluate(async()=>{document.querySelector('#opener').focus();const {openCreator}=await import('/src/avatars/creator.js');window.maker=openCreator({onSave:r=>window.saved=r});});
  // The category menu stands in for the tab rail only where the rail is hidden (the rail now shows at every size).
  const mobile=await page.getByRole('combobox',{name:'Appearance category',exact:true}).isVisible();
  const original=await page.evaluate(()=>JSON.stringify(window.maker.recipe));
  await page.getByRole('combobox',{name:'Preview angle',exact:true}).selectOption('back');
  assert.equal(await page.getByRole('combobox',{name:'Preview angle',exact:true}).inputValue(),'back');
  await page.getByRole('combobox',{name:'Preview angle',exact:true}).selectOption('front');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.maker.recipe)),original);
  for(const id of ['body','head','hair','eyes','brows','nose','mouth','extras','outfits','top','bottom','shoes','hat','accessories']){
   if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption(id);else await page.getByRole('tab',{name:tabName(id),exact:true}).click();
   const bounds=await page.evaluate(()=>{const root=document.querySelector('.shm'),body=document.querySelector('.shm-body'),save=document.querySelector('.shm-foot button:last-child');return {overflow:root.scrollWidth>innerWidth,body:body.clientHeight,bottom:save.getBoundingClientRect().bottom};});
   assert.equal(bounds.overflow,false);assert.ok(bounds.body>=90,id+" "+width+"x"+height+" "+JSON.stringify(bounds));assert.ok(bounds.bottom<=height);
   // The wardrobe's pictures keep the room: at least one whole row of tiles shows over the colour tray (a phone held
   // upright and every iPad; the short landscape sizes scroll).
   if(height>=740&&['top','bottom','hat','accessories'].includes(id)){
    const row=await page.evaluate(()=>{const body=document.querySelector('.shm-body'),grid=body.querySelector('.shm-grid'),b=body.getBoundingClientRect(),tray=document.querySelector('.shm-palette:not([hidden])')?.getBoundingClientRect(),bottom=Math.min(b.bottom,tray?tray.top:Infinity);
     return {tiles:[...grid.querySelectorAll(':scope>button')].filter(t=>{const r=t.getBoundingClientRect();return r.top>=b.top-1&&r.bottom<=bottom+1;}).length,gridTop:Math.round(grid.getBoundingClientRect().top-b.top),room:Math.round(bottom-b.top)};});
    assert.ok(row.tiles>=3,`${id} ${width}x${height}: a whole row of pictures shows ${JSON.stringify(row)}`);
   }
  }
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('head');else await page.getByRole('tab',{name:'Face',exact:true}).click();
  await page.getByRole('tab',{name:'Style',exact:true}).click();assert.equal(await page.locator('.shm-face-forms button').count(),12);
  await page.getByRole('button',{name:'Pear',exact:true}).click();assert.equal(await page.evaluate(()=>maker.recipe.head.form),'pear');assert.equal(await page.getByRole('button',{name:'Pear',exact:true}).getAttribute('aria-pressed'),'true');
  const skinBefore=await page.evaluate(()=>maker.recipe.body.skin);await page.locator('.shm-palette:not([hidden]) button').last().click();assert.notEqual(await page.evaluate(()=>maker.recipe.body.skin),skinBefore);await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await page.evaluate(()=>maker.recipe.body.skin),skinBefore);assert.equal(await page.evaluate(()=>maker.recipe.head.form),'pear');
  await page.screenshot({path:'/tmp/face-form-creator-'+width+'x'+height+'.png'});
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('eyes');else await page.getByRole('tab',{name:'Eyes',exact:true}).click();
  await page.getByRole('tab',{name:'Adjust',exact:true}).click();
  const sizeBefore=await page.evaluate(()=>window.maker.recipe.eyes.size);await page.getByRole('button',{name:'Bigger',exact:true}).click();assert.ok((await page.evaluate(()=>window.maker.recipe.eyes.size))>sizeBefore);
  const eyeBefore=await page.evaluate(()=>window.maker.recipe.eyes.height);await page.getByRole('button',{name:'Move up',exact:true}).click();assert.ok((await page.evaluate(()=>window.maker.recipe.eyes.height))>eyeBefore);
  await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await page.evaluate(()=>window.maker.recipe.eyes.height),eyeBefore);
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('hat');else await page.getByRole('tab',{name:'Hats & bows',exact:true}).click();
  await page.getByRole('button',{name:'Beanie',exact:true}).click();assert.equal(await page.evaluate(()=>window.maker.recipe.outfit.hat),'beanie');
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('accessories');else await page.getByRole('tab',{name:'Accessories',exact:true}).click();
  await page.getByRole('button',{name:'Hoops',exact:true}).click();assert.equal(await page.evaluate(()=>window.maker.recipe.accessories.earrings),'hoops');
  // The wardrobe: clothes come off down to the base layer, and go back on one at a time.
  // The shirt number shows only for a numbered top (the Seagulls jersey), steps and can be typed, and comes off with it all.
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('top');else await page.getByRole('tab',{name:'Top',exact:true}).click();
  assert.equal(await page.getByRole('spinbutton',{name:'Shirt number',exact:true}).isVisible(),false,'no number on a top that carries none');
  await page.getByRole('button',{name:'All',exact:true}).click();await page.getByRole('button',{name:'Seagulls jersey',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>[maker.recipe.outfit.top,maker.recipe.outfit.topColour,maker.recipe.outfit.accent]),['baseball','#f4f1ea','#27304d'],'it goes on in its own colours');
  await page.getByRole('spinbutton',{name:'Shirt number',exact:true}).waitFor();
  await page.getByRole('button',{name:'Higher shirt number',exact:true}).click();assert.equal(await page.evaluate(()=>maker.recipe.outfit.number),1);
  await page.getByRole('spinbutton',{name:'Shirt number',exact:true}).fill('18');await page.getByRole('spinbutton',{name:'Shirt number',exact:true}).press('Enter');
  assert.equal(await page.evaluate(()=>maker.recipe.outfit.number),18);
  await page.getByRole('button',{name:'Take all off',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>{const o=window.maker.recipe.outfit;return [o.top,o.bottom,o.footwear,window.maker.recipe.accessories.earrings,o.number];}),['tank','underwear','barefoot','none',0]);
  assert.equal(await page.getByRole('spinbutton',{name:'Shirt number',exact:true}).isVisible(),false,'the number goes with the jersey');
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('shoes');else await page.getByRole('tab',{name:'Shoes',exact:true}).click();
  await page.getByRole('button',{name:'Sandals',exact:true}).click();assert.equal(await page.evaluate(()=>window.maker.recipe.outfit.footwear),'sandals');
  // The island's sets and costumes have their own tab.
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('outfits');else await page.getByRole('tab',{name:'Outfits',exact:true}).click();
  const preset=page.getByRole('button',{name:'Harbour Sunday jacket',exact:true});await preset.click();
  assert.deepEqual(await page.evaluate(()=>[maker.recipe.outfit.top,maker.recipe.outfit.bottom]),['jacket','trousers']);
  await page.waitForTimeout(1800);assert.equal(await preset.locator('canvas').count(),1);
  const painted=await preset.locator('canvas').evaluate(c=>{const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return p.some((v,i)=>i%4===3&&v>0);});assert.ok(painted,'Outfit preview must contain rendered pixels');
  await page.screenshot({path:'/tmp/island-wardrobe-creator-'+width+'x'+height+'.png'});
  // The wardrobe at scale: one search across its tabs (accents ignored), who wears the chosen item and why, its colourways.
  await page.getByLabel('Search the wardrobe',{exact:true}).fill('Koji');
  await page.getByRole('button',{name:'Morning boats',exact:true}).waitFor();await page.getByRole('button',{name:'Haarii crew',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>[maker.recipe.outfit.top,maker.recipe.outfit.footwear,maker.recipe.outfit.hat]),['tee','barefoot','headband']);
  assert.match(await page.locator('.shm-worn').last().textContent(),/^Worn by Kōji, Daichi and Kenta rowing for Minato/);
  await page.getByLabel('Search the wardrobe',{exact:true}).fill('');await page.getByRole('radio',{name:'Kitahama',exact:true}).waitFor();
  await page.getByRole('radio',{name:'Kitahama',exact:true}).check();assert.equal(await page.evaluate(()=>maker.recipe.outfit.topColour),'#4f7a4f');
  assert.equal(await page.getByRole('button',{name:'Haarii crew',exact:true}).getAttribute('aria-pressed'),'true','a set in its second colourway is still that set');
  // Tapping the set worn again keeps its colourway.
  await page.getByRole('button',{name:'Haarii crew',exact:true}).click();assert.equal(await page.evaluate(()=>maker.recipe.outfit.topColour),'#4f7a4f');
  // Who wears it and why sits right under the row of the set tapped, in view.
  const info=await page.evaluate(()=>{const box=document.querySelector('.shm-grid>.shm-worn-box'),b=document.querySelector('.shm-body').getBoundingClientRect(),r=box?.getBoundingClientRect();return box&&{inGrid:true,inView:r.top>=b.top-1&&r.top<b.bottom};});
  assert.deepEqual(info,{inGrid:true,inView:true});
  // Category chips: the Outfits tab opens on the category of the set being worn.
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('top');else await page.getByRole('tab',{name:'Top',exact:true}).click();
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('outfits');else await page.getByRole('tab',{name:'Outfits',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Festival',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.getByRole('button',{name:'Harbour Sunday jacket',exact:true}).count(),0,'an Everyday set is not under Festival');
  // The chip pressed is in view, even when the row scrolls (it is centred once laid out, in the next frame).
  await page.waitForFunction(()=>{const row=document.querySelector('.shm-categories'),on=row?.querySelector('[aria-pressed=true]'),a=row?.getBoundingClientRect(),b=on?.getBoundingClientRect();return !!b&&b.left>=a.left-1&&b.right<=a.right+1;},null,{timeout:15000}).catch(()=>{});
  assert.ok(await page.evaluate(()=>{const row=document.querySelector('.shm-categories'),on=row.querySelector('[aria-pressed=true]'),a=row.getBoundingClientRect(),b=on.getBoundingClientRect();return b.left>=a.left-1&&b.right<=a.right+1;}),'the pressed chip shows');
  // A chip chosen from the keyboard keeps the focus on the chips (its row is drawn again).
  await page.getByRole('button',{name:'All',exact:true}).focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'All');assert.equal(await page.getByRole('button',{name:'All',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.getByRole('button',{name:'Harbour Sunday jacket',exact:true}).count(),1);
  // A set's own hat comes off with it: the crew's headband does not stay on for the Sunday jacket.
  await page.getByRole('button',{name:'Harbour Sunday jacket',exact:true}).click();assert.equal(await page.evaluate(()=>maker.recipe.outfit.hat),'none');
  await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await page.evaluate(()=>maker.recipe.outfit.hat),'headband');
  // Escape clears the search, and a second Escape in the empty search keeps the maker open.
  await page.getByLabel('Search the wardrobe',{exact:true}).fill('rain');await page.waitForFunction(()=>/ found\.$/.test(document.querySelector('.shm-found')?.textContent||''));
  assert.equal(await page.locator('.shm-found').getAttribute('role'),'status','the count is said, not only shown');
  await page.getByLabel('Search the wardrobe',{exact:true}).press('Escape');assert.equal(await page.getByLabel('Search the wardrobe',{exact:true}).inputValue(),'');
  await page.getByLabel('Search the wardrobe',{exact:true}).press('Escape');assert.equal(await page.locator('.shm').count(),1,'the maker is still open');
  // The top's colour page offers the island palette, so the colourway's green shows pressed.
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('top');else await page.getByRole('tab',{name:'Top',exact:true}).click();
  await page.getByRole('tab',{name:'Colour',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Colour Fukugi green',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('tab',{name:'Style',exact:true}).click();
  // The figure stays in its frame, clear of the menus.
  const frame=await page.evaluate(()=>{const s=document.querySelector('.shm-stage').getBoundingClientRect(),c=document.querySelector('.shm-stage canvas').getBoundingClientRect(),p=document.querySelector('.shm-panel').getBoundingClientRect();return {inside:c.width<=s.width+1&&c.height<=s.height+1,clear:s.left>=p.right-1||s.right<=p.left+1||s.top>=p.bottom-1||s.bottom<=p.top+1};});
  assert.deepEqual(frame,{inside:true,clear:true});
  await page.getByLabel('Name',{exact:true}).fill('Test islander');
  const before=await page.evaluate(()=>JSON.stringify(window.maker.recipe));
  await page.getByRole('button',{name:'Randomise appearance'}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.maker.recipe)),before);
  if(mobile)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption('body');else await page.getByRole('tab',{name:'Body',exact:true}).click();
  await page.getByRole('tab',{name:'Style',exact:true}).click();await page.getByRole('button',{name:'Rounded',exact:true}).click();assert.equal(await page.evaluate(()=>maker.recipe.body.proportion),'rounded');
  await page.getByLabel('Preview pose').selectOption('Wave');
  await page.getByRole('button',{name:'Share',exact:true}).click();await page.getByLabel('Import an islander').fill('http://[invalid?avatar=bad');
  await page.getByRole('button',{name:'Try the pasted one'}).click();assert.ok(await page.getByRole('button',{name:'That code did not work'}).isVisible());
  await page.keyboard.press('Escape');assert.ok(await page.locator('.shm').isVisible());assert.equal(await page.locator('.shm-share').count(),0);
  await page.getByRole('button',{name:'Share',exact:true}).click();const code=await page.getByLabel('Share link or code').inputValue();await page.getByLabel('Import an islander').fill(code);await page.getByRole('button',{name:'Try the pasted one'}).click();
  if(!mobile){await page.getByRole('tab',{name:'Hats & bows',exact:true}).focus();await page.keyboard.press('Home');assert.equal(await page.getByRole('tab',{name:'Body',exact:true}).getAttribute('aria-selected'),'true');}
  // Who they are: the dials give a personality, and the birthday is kept.
  await page.getByRole('button',{name:'Step 3: Who are they?'}).click();
  for(const dial of ['Pace','Talk','Feelings','Outlook'])await page.getByRole('button',{name:dial+' 8 of 8',exact:true}).click();
  assert.equal(await page.locator('.shm-type strong').textContent(),'Typhoon');assert.match(await page.locator('.shm-type').textContent(),/Planning three outings/);await page.screenshot({path:'/tmp/island-personality-creator-'+width+'x'+height+'.png'});
  await page.getByLabel('Birthday month').selectOption('2');await page.getByLabel('Birthday day').selectOption('29');
  await page.getByLabel('Catchphrase').fill('Haisai!');
  const profile=await page.evaluate(()=>window.maker.recipe.profile);assert.equal(profile.month,2);assert.equal(profile.day,29);assert.equal(profile.catchphrase,'Haisai!');
  await page.getByRole('button',{name:'Next',exact:true}).click();
  assert.match(await page.locator('.shm-bubble').textContent({timeout:4000}).catch(()=>''),/^|Hey/);
  await page.getByRole('button',{name:'Save and play'}).click();assert.equal(await page.evaluate(()=>window.saved.name),'Test islander');assert.equal(await page.evaluate(()=>window.saved.body.proportion),'rounded');assert.equal(await page.evaluate(()=>window.saved.profile.catchphrase),'Haisai!');assert.equal(await page.locator('.shm').count(),0);assert.equal(await page.evaluate(()=>document.activeElement.id),'opener');assert.deepEqual(errors,[]);
  console.log(`Creator interactions and layout passed: ${width}x${height}`);await page.close();
 }catch(error){failures.push(`${width}x${height}: ${error.message}`);console.log(`Creator FAILED at ${width}x${height}: ${error.message}`);}
}finally{await browser.close();}
assert.deepEqual(failures,[],'every size passes');
