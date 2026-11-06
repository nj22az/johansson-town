/**
 * A label as Johansson Studio designs it: a few layers on the 2:1 wrap of a pack, drawn by one renderer
 * (src/commerce/label-art.js drawLabel) on the iPad, in headless Studio and in previews. World never draws a spec: it
 * shows the picture Studio baked from it (labels/<id>.r<n>.webp), so every device shows exactly the label the creator
 * approved, whatever fonts it has.
 *
 *   {v:1, base:"paper"|"painted", layers:[…]}   at most 24 layers, drawn in order
 *
 * Coordinates run from 0 to 1 across the wrap and down it: x 0.5 is the middle of the front (on a can, the front is
 * roughly x 0.3 to 0.7; the rest runs round the sides), y 0 the top. Sizes are fractions of the label's height.
 * A colour is a brand token ("paper", "ink", "accent") or #rrggbb. base "painted" keeps the painting underneath (a
 * painted label's own cell) and draws the layers on top; base "paper" starts from the brand's paper.
 *
 *   band     {y, h, colour}                         a band across the whole wrap, from y down h
 *   stripe   {x, w, colour}                         a band down the whole wrap, from x across w
 *   shape    {shape, x, y, w, h, colour, line?, angle?}   circle, ring, roundel (a starburst flash), diamond or
 *                                                   rounded (a rounded rectangle), centred on x, y
 *   symbol   {symbol, x, y, size, colour}           one of the brands' emblems (gull, wave, flower, star, leaf, rice, sun)
 *   text     {text, font, x, y, size, colour, weight?, align?, outline?, maxWidth?}
 *                                                   gothic, maru or mincho; anchored at x, y (centre, left or right)
 *   art      {art, x, y, size}                      one of the packs' illustrations (packaging-art.js), centred
 *   picture  {file, x, y, w, h, words}              a picture (labels/<id>-picture.r<n>.webp), centred on x, y; `words`
 *                                                   is every word printed on it, which the brand check reads
 *
 * Every layer may also have `opacity` (0 to 1). Nothing here touches the DOM, so the page, the tools and the tests
 * share it.
 */
export const LABEL_SPEC_VERSION=1;
export const MAX_LAYERS=24;
export const FONTS=Object.freeze(['gothic','maru','mincho']);
export const SYMBOLS=Object.freeze(['gull','wave','flower','star','leaf','rice','sun']);
export const SHAPES=Object.freeze(['circle','ring','roundel','diamond','rounded']);
export const ARTS=Object.freeze(['chips','crackers','biscuit','chocolate','candy','curry','noodles','soup','tuna','peaches','soy','rice','bun','bread',
 'tea','coffee','beer','cola','soda','water','orange','milk','yogurt','pudding','bento','sandwich','soap','detergent','tissues','toothpaste','battery','notebook','postcard']);
export const TOKENS=Object.freeze(['paper','ink','accent']);
export const LAYER_TYPES=Object.freeze(['band','stripe','shape','symbol','text','art','picture']);
/** A picture a label keeps: labels/<product id>-picture.r<n>.webp. */
export const PICTURE_FILE=/^[a-z][a-z0-9-]{1,30}-picture\.r[1-9][0-9]{0,3}\.webp$/;
export const TEXT_MAX=60,WORDS_MAX=40;

const problem=(where,rule,sentence)=>({where,rule,sentence});
const quote=v=>typeof v==='string'?`"${v.slice(0,40)}"`:JSON.stringify(v);
const isColour=v=>typeof v==='string'&&(TOKENS.includes(v)||/^#[0-9a-fA-F]{6}$/.test(v));
/** Fields each layer type has: [name, kind, required, min, max, default]. */
const FIELDS={
 band:[['y','num',true,0,1],['h','num',true,.005,1],['colour','colour',true]],
 stripe:[['x','num',true,0,1],['w','num',true,.0025,1],['colour','colour',true]],
 shape:[['shape','word',true,SHAPES],['x','num',true,-.5,1.5],['y','num',true,-.5,1.5],['w','num',true,.01,1.5],['h','num',true,.01,1.5],['colour','colour',true],['line','colour',false],['angle','num',false,-180,180]],
 symbol:[['symbol','word',true,SYMBOLS],['x','num',true,-.5,1.5],['y','num',true,-.5,1.5],['size','num',true,.02,1],['colour','colour',true]],
 text:[['text','text',true],['font','word',true,FONTS],['x','num',true,-.5,1.5],['y','num',true,-.5,1.5],['size','num',true,.02,.6],['colour','colour',true],
  ['weight','word',false,['bold','normal']],['align','word',false,['center','left','right']],['outline','colour',false],['maxWidth','num',false,.02,1]],
 art:[['art','word',true,ARTS],['x','num',true,-.5,1.5],['y','num',true,-.5,1.5],['size','num',true,.05,1.2]],
 picture:[['file','file',true],['x','num',true,-.5,1.5],['y','num',true,-.5,1.5],['w','num',true,.02,1.5],['h','num',true,.02,1.5],['words','words',true]],
};

/** Words from outside, made safe: NFKC, trimmed, no control characters, no "<", at most `max` characters. */
export function cleanWords(value,{where,max=TEXT_MAX,label='The text'}){
 if(typeof value!=='string')return {text:'',problems:[problem(where,'text',`${label} must be words.`)]};
 const text=value.normalize('NFKC').trim(),out=[];
 if(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(text))out.push(problem(where,'text',`${label} has an invisible control character in it; type it again.`));
 if(text.includes('<'))out.push(problem(where,'text',`${label} may not contain "<".`));
 if([...text].length>max)out.push(problem(where,'text',`${label} is ${[...text].length} characters long; keep it to ${max}.`));
 if(!text)out.push(problem(where,'text',`${label} is empty.`));
 return {text,problems:out};
}

/**
 * A label spec checked and made safe: unknown fields and layer types refused, words from the fixed lists, colours as
 * tokens or #rrggbb (stored lower case), numbers clamped to their ranges (each clamp reported), texts cleaned.
 * `pictures(file)` says whether a picture file may be used (the tools pass the files that exist or arrive with the
 * change). Returns {spec, problems, clamped}: use the spec only when there are no problems.
 */
export function normalizeLabelSpec(spec,{where='label.spec',pictures=null}={}){
 const problems=[],clamped=[];
 if(!spec||typeof spec!=='object'||Array.isArray(spec))return {spec:null,clamped,problems:[problem(where,'type','A label design must be {v:1, base, layers}.')]};
 for(const key of Object.keys(spec))if(!['v','base','layers'].includes(key))problems.push(problem(`${where}.${key}`,'unknown-key',`A label design has no field ${quote(key)}.`));
 if(spec.v!==LABEL_SPEC_VERSION)problems.push(problem(`${where}.v`,'version',`A label design is version 1 (v:1), not ${quote(spec.v)}.`));
 if(!['paper','painted'].includes(spec.base))problems.push(problem(`${where}.base`,'value',`base is "paper" (start from the brand's paper) or "painted" (keep the painting underneath), not ${quote(spec.base)}.`));
 const layers=Array.isArray(spec.layers)?spec.layers:[];
 if(!Array.isArray(spec.layers))problems.push(problem(`${where}.layers`,'type','layers must be a list.'));
 if(layers.length>MAX_LAYERS)problems.push(problem(`${where}.layers`,'limit',`A label has at most ${MAX_LAYERS} layers; this one has ${layers.length}.`));
 const out=layers.slice(0,MAX_LAYERS).map((layer,i)=>{
  const at=`${where}.layers[${i}]`;
  if(!layer||typeof layer!=='object'||Array.isArray(layer)){problems.push(problem(at,'type',`${at} is not a layer.`));return null;}
  const fields=Object.hasOwn(FIELDS,layer.type)?FIELDS[layer.type]:null;
  if(!fields){problems.push(problem(`${at}.type`,'unknown-layer',`${quote(layer.type)} is not a kind of layer; the kinds are ${LAYER_TYPES.join(', ')}.`));return null;}
  const known=new Set(['type','opacity',...fields.map(f=>f[0])]),clean={type:layer.type};
  for(const key of Object.keys(layer))if(!known.has(key))problems.push(problem(`${at}.${key}`,'unknown-key',`A ${layer.type} layer has no field ${quote(key)}.`));
  for(const [name,kind,required,a,b] of [...fields,['opacity','num',false,0,1]]){
   const value=layer[name],here=`${at}.${name}`;
   if(value===undefined){if(required)problems.push(problem(here,'missing',`A ${layer.type} layer needs ${name}.`));continue;}
   if(kind==='num'){
    if(typeof value!=='number'||!Number.isFinite(value)){problems.push(problem(here,'number',`${name} is a number, not ${quote(value)}.`));continue;}
    const used=Math.min(b,Math.max(a,value));if(used!==value)clamped.push({where:here,given:value,used});clean[name]=Math.round(used*1e4)/1e4;
   }else if(kind==='word'){
    if(!a.includes(value))problems.push(problem(here,'unknown-word',`${quote(value)} is not a choice for ${name}; choose one of: ${a.join(', ')}.`));else clean[name]=value;
   }else if(kind==='colour'){
    if(!isColour(value))problems.push(problem(here,'colour',`${name} is a brand colour (${TOKENS.join(', ')}) or a colour written #rrggbb, not ${quote(value)}.`));else clean[name]=value.toLowerCase();
   }else if(kind==='text'){
    const r=cleanWords(value,{where:here,label:'A label text'});problems.push(...r.problems);clean[name]=r.text;
   }else if(kind==='file'){
    if(typeof value!=='string'||!(PICTURE_FILE.test(value)||pictures?.(value)))problems.push(problem(here,'picture',`${quote(value)} is not a picture this label can use.`));
    else if(pictures&&!pictures(value))problems.push(problem(here,'picture',`There is no picture ${quote(value)}; send it with product_label_picture.`));
    else clean[name]=value;
   }else if(kind==='words'){
    if(!Array.isArray(value)){problems.push(problem(here,'words','words lists every word printed on the picture (an empty list if there are none).'));continue;}
    if(value.length>WORDS_MAX)problems.push(problem(here,'limit',`A picture lists at most ${WORDS_MAX} words.`));
    clean[name]=value.slice(0,WORDS_MAX).map((w,k)=>{const r=cleanWords(w,{where:`${here}[${k}]`,label:'A word on the picture'});problems.push(...r.problems);return r.text;});
   }
  }
  return clean;
 }).filter(Boolean);
 return {spec:problems.length?null:{v:LABEL_SPEC_VERSION,base:spec.base,layers:out},problems,clamped};
}

/** Every word a label prints: its texts and the words on its pictures (what the brand check reads). */
export const labelWords=spec=>(spec?.layers||[]).flatMap(l=>l.type==='text'?[l.text]:l.type==='picture'?l.words||[]:[]);
/** The pictures a label uses. */
export const labelPictures=spec=>(spec?.layers||[]).filter(l=>l.type==='picture').map(l=>l.file);

/**
 * "Redraw from brand": a label in the drawn style from a product's own brand and pack: the brand's band with its
 * emblem and name, the line in big letters, the illustration in a window, the flash and the net weight, with the
 * brand name again round the sides for a round pack.
 */
export function brandSpec(product){
 const {brand,pack}=product,round=['bottle','can','cup','foil-cup'].includes(pack.shape),same=(a,b)=>String(a||'').replace(/\s/g,'').toLowerCase()===String(b||'').replace(/\s/g,'').toLowerCase();
 const layers=[
  {type:'band',y:0,h:.22,colour:'ink'},{type:'band',y:.22,h:.025,colour:'accent'},{type:'band',y:.945,h:.055,colour:'accent'},
  {type:'symbol',symbol:brand.symbol,x:.29,y:.11,size:.13,colour:'paper'},
  {type:'text',text:brand.name,font:'gothic',x:.5,y:.11,size:.13,colour:'paper',weight:'bold',align:'center',maxWidth:.26},
  {type:'text',text:brand.line,font:'maru',x:.5,y:.34,size:.1,colour:'ink',weight:'bold',align:'center',outline:'#ffffff',maxWidth:.42},
  {type:'shape',shape:'rounded',x:.5,y:.64,w:.3,h:.5,colour:'#fffaf0'},
  {type:'art',art:ARTS.includes(pack.art)?pack.art:ARTS.includes(product.id)?product.id:'tea',x:.5,y:.64,size:.46},
 ];
 if(brand.jp&&!same(brand.jp,brand.name))layers.push({type:'text',text:brand.jp,font:'maru',x:.5,y:.185,size:.05,colour:'paper',weight:'bold',align:'center',maxWidth:.26});
 if(pack.flash)layers.push({type:'shape',shape:'roundel',x:.33,y:.52,w:.13,h:.26,colour:'accent'},{type:'text',text:pack.flash,font:'maru',x:.33,y:.52,size:.055,colour:'#ffffff',weight:'bold',align:'center',maxWidth:.1});
 if(pack.net)layers.push({type:'text',text:'Net '+pack.net,font:'gothic',x:.68,y:.9,size:.045,colour:'ink',weight:'bold',align:'right',maxWidth:.2});
 if(round)for(const x of [.12,.88])layers.push({type:'text',text:brand.name,font:'gothic',x,y:.5,size:.09,colour:'ink',weight:'bold',align:'center',maxWidth:.2});
 return {v:LABEL_SPEC_VERSION,base:'paper',layers};
}
