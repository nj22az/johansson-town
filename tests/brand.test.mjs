// Johansson World's brand (brand/brand.json) and the title that shows it say the same thing.
//
// The title is drawn by title-screen.css and line-ui.css. brand/ is the written record of what they draw: the ink,
// the green, the cream, the typeface and the wordmark's setting, for people and for other projects (Pocket Camera's
// title card). On 9 November 2026 that look was copied from older, overridden rules instead and came out wrong; this
// test keeps the record and the drawn title together, and keeps those older rules from coming back.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const brand=JSON.parse(read('brand/brand.json'));
const title=read('title-screen.css'),line=read('line-ui.css'),page=read('index.html');
// The declarations of the first rule whose selector is exactly `selector`.
const rule=(css,selector)=>{const at=css.indexOf(`${selector}{`);assert.ok(at>=0&&(at===0||/[}\n\s]/.test(css[at-1])),`${selector} has a rule`);return css.slice(at+selector.length+1,css.indexOf('}',at));};
const value=(declarations,property)=>{const found=declarations.split(';').map(d=>d.trim()).find(d=>d.startsWith(`${property}:`));assert.ok(found,`${property} is declared`);return found.slice(property.length+1).trim();};
const em=n=>String(n).replace(/^0\./,'.')+'em';

test('the title\'s colours are the brand\'s: ink, green and cream on #start, the interface green in line-ui.css', () => {
 const start=rule(title,'#start');
 for(const name of ['ink','green','cream'])assert.equal(value(start,brand.colours[name].token),brand.colours[name].hex,name);
 assert.equal(value(line.slice(line.indexOf(':root{')+6),brand.colours.interfaceGreen.token),brand.colours.interfaceGreen.hex);
 for(const colour of Object.values(brand.colours))assert.match(colour.hex,/^#[0-9a-f]{6}$/);
});

test('the wordmark is set as the brand says: ExtraBold, its sizes, tracking and line heights, ink over green', () => {
 for(const [part,selector,token] of [['main','#start .logo-main','--title-text'],['town','#start .logo-town','--title-green']]){
  const mark=brand.wordmark[part],declarations=rule(title,selector),font=value(declarations,'font');
  const [,weight,smallest,largest,lineHeight]=font.match(/^(\d+) clamp\((\d+)px,[\d.]+vw,(\d+)px\)\/([\d.]+) var\(--line-font\)$/)||[];
  assert.ok(weight,`${selector}: font is "${font}"`);
  assert.deepEqual([+weight,[+smallest,+largest],+lineHeight],[mark.weight,mark.size,mark.line],part);
  assert.equal(value(declarations,'letter-spacing'),em(mark.spacing),`${part} tracking`);
  assert.equal(value(declarations,'color'),`var(${token})`,`${part} colour`);
  assert.equal(brand.colours[mark.colour].token,token);
  assert.ok(page.includes(`<span class="logo-${part}">${mark.text}</span>`),`the page's wordmark says ${mark.text}`);
 }
 assert.equal(value(rule(title,'#start .title-logo'),'gap'),`${brand.wordmark.gap}px`);
});

test('the typeface is the brand\'s: LINE Seed JP after Figtree\'s ten long vowels, and Figtree declares nothing else', () => {
 assert.equal(value(line.slice(line.indexOf(':root{')+6),'--line-font'),brand.typeface.stack);
 assert.ok(brand.typeface.stack.startsWith(`Figtree,"${brand.typeface.family}"`));
 const face=line.slice(line.indexOf('@font-face{'),line.indexOf('}',line.indexOf('@font-face{')));
 assert.match(face,/font-family:"Figtree"/);
 assert.equal(value(face.slice(face.indexOf('{')+1),'unicode-range'),'U+100-101,U+112-113,U+12A-12B,U+14C-14D,U+16A-16B');
 const weights=page.match(/family=LINE\+Seed\+JP:wght@([\d;]+)/);
 assert.ok(weights,'the page loads LINE Seed JP');assert.deepEqual(weights[1].split(';').map(Number),brand.typeface.weights);
});

test('the outlines are the wordmark in the brand\'s two colours', () => {
 const svg=read(brand.wordmark.outlines);
 assert.match(svg,/aria-label="Johansson World"/);
 assert.deepEqual([...svg.matchAll(/fill="(#[0-9a-f]{6})"/g)].map(m=>m[1]),[brand.colours.ink.hex,brand.colours.green.hex]);
});

test('the older toy title is gone from the stylesheets, so nobody copies it again', () => {
 const landing=read('landing.css'),base=read('base.css');
 // Yellow and orange letters with an outline, WORLD in a tilted red box, letters dropping in one by one.
 for(const gone of ['--ts-sun','--ts-orange','letter-drop','pop-in','pop-flat','logo-bob','.logo-jp','.logo-small'])
  for(const [name,css] of [['landing.css',landing],['base.css',base],['title-screen.css',title]])assert.ok(!css.includes(gone),`${gone} is not in ${name}`);
 // The wordmark's look is declared once, in title-screen.css.
 for(const [name,css] of [['landing.css',landing],['base.css',base]])assert.ok(!/\.logo-(main|town)\b/.test(css),`${name} has no rule for the wordmark`);
});
