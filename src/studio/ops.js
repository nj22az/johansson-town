/**
 * Johansson Studio's steps ("ops"): every change the iPad, the page's agent API (WebMCP) or Claude makes is a list of
 * these inside one change file. One table of names and JSON Schemas serves all of them: rules.js checks a change
 * against it, and the Node server turns the same schemas into its tool inputs with zod's fromJSONSchema.
 *
 * Every step carries `was`, what it expects to find. If the current value is `was`, the step applies; if it is already
 * the new value, nothing happens; anything else is a conflict, reported field by field and never overwritten.
 */
export const CHANGE_FORMAT='johansson-studio-change';
export const CHANGE_VERSION=1;
export const ID_PATTERN='^[a-z][a-z0-9-]{1,39}$';
export const SHA256_PATTERN='^[0-9a-f]{64}$';
export const CHANGE_ID_PATTERN='^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}(-[0-9]{2})?Z-[a-z0-9][a-z0-9-]{0,39}$';
/** A field of a recipe, as a dotted path ("outfit.hat"); looks.js says which paths a look may set. */
const PATH_PATTERN='^[a-z][a-zA-Z]*(\\.[a-z][a-zA-Z]*)?$';
/** A field of a product, as a dotted path ("label", "brand.ink", "pack.back.ingredients"); rules.js PRODUCT_FIELDS lists them. */
const PRODUCT_PATH='^[a-z][a-zA-Z]*(\\.[a-z][a-zA-Z]*){0,2}$';

const text=(max,min=1)=>({type:'string',minLength:min,maxLength:max});
const fields=(min=1)=>({type:'object',minProperties:min,maxProperties:80,propertyNames:{pattern:PATH_PATTERN},additionalProperties:{type:['string','number','boolean']}});
const step=(op,properties,required)=>({type:'object',additionalProperties:false,required:['op',...required],properties:{op:{const:op},...properties}});
const resident={type:'string',minLength:1,maxLength:40};
const id={type:'string',pattern:ID_PATTERN};
const sha={type:'string',pattern:SHA256_PATTERN};

/**
 * The steps. `target` is the data file a step changes (looks.json or products.json); `ready` is false for a step whose
 * data has not moved into data/studio yet, which rules.js refuses in plain words.
 */
export const OPS=Object.freeze({
 'look.set':{target:'looks',ready:true,summary:'Change some fields of a resident\'s look (their published Studio look, laid over how World draws them).',
  schema:step('look.set',{name:resident,set:fields(),was:fields(),note:text(300,0)},['name','set','was'])},
 'look.reset':{target:'looks',ready:true,summary:'Take a resident\'s published look away, so World draws them as before. `was` is the look being removed.',
  schema:step('look.reset',{name:resident,was:fields(0)},['name','was'])},
 'character.create':{target:'looks',ready:true,summary:'Add a Studio-only character (World does not place them yet).',
  schema:step('character.create',{id,character:{type:'object',additionalProperties:false,required:['name','recipe','card'],properties:{
   name:text(24),recipe:{type:'object'},card:{type:'object',additionalProperties:false,required:['role','why'],properties:{role:text(60),why:text(300)}}}}},['id','character'])},
 'character.set':{target:'looks',ready:true,summary:'Change some fields of a Studio-only character\'s recipe.',
  schema:step('character.set',{id,set:fields(),was:fields()},['id','set','was'])},
 'character.delete':{target:'looks',ready:true,summary:'Delete a Studio-only character. `was` is the sha256 of the record being deleted. Residents of World are never deleted.',
  schema:step('character.delete',{id,was:sha},['id','was'])},
 'product.update':{target:'products',ready:true,summary:'Change fields of a product by path ("label", "price", "brand.ink", "purpose.why", "shelf" …). Never its id, its inventoryName (old saves keep it) or its atlas cells. A designed label names its baked picture in the change\'s files.',
  schema:step('product.update',{id,set:{type:'object',minProperties:1,maxProperties:20,propertyNames:{pattern:PRODUCT_PATH}},was:{type:'object',maxProperties:20,propertyNames:{pattern:PRODUCT_PATH}},note:text(300,0)},['id','set','was'])},
 'product.add':{target:'products',ready:true,summary:'Add a flavour to a line (place.mode "flavour", product {name, hue}: one more cell in the atlas, no shelf of its own), or a new line (a whole product record) that shares a line\'s shelf (share), takes the place of a line it retires (replace), or stands on free shelf (free). Its cells are given when it is applied.',
  schema:step('product.add',{product:{type:'object',minProperties:1,maxProperties:40},place:{type:'object',additionalProperties:false,required:['mode'],properties:{mode:{enum:['flavour','free','share','replace']},target:id,why:text(300,0)}}},['product','place'])},
 'product.retire':{target:'products',ready:true,summary:'Take a product off sale: its record moves to the retired list (old saves still know it, its id is never used again) and its shelf goes to shelfTo, a line beside it. Refused while World\'s code still names it. `was` is the sha256 of the record being retired.',
  schema:step('product.retire',{id,why:text(300),shelfTo:id,was:sha},['id','why','was'])},
});
export const OP_NAMES=Object.freeze(Object.keys(OPS));

/** A picture carried in a change file: its sha256 and its bytes as base64. */
export const FILE_NAME_PATTERN='^[a-z][a-z0-9-]{1,39}(\\.[a-z0-9-]{1,20})?\\.(png|jpg|jpeg|webp)$';

/** The change file around the steps. Each step is checked against its own schema above. */
export const CHANGE_SCHEMA=Object.freeze({type:'object',additionalProperties:false,required:['format','version','id','made','by','note','ops'],properties:{
 format:{const:CHANGE_FORMAT},version:{const:CHANGE_VERSION},
 id:{type:'string',pattern:CHANGE_ID_PATTERN},
 made:{type:'string',pattern:'^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(:[0-9]{2}(\\.[0-9]{1,3})?)?(Z|[+-][0-9]{2}:[0-9]{2})$'},
 by:{enum:['ipad','claude']},
 note:text(500),
 base:{type:'object',additionalProperties:false,properties:{looks:sha,products:sha}},
 ops:{type:'array',minItems:1,maxItems:50,items:{type:'object',required:['op'],properties:{op:{type:'string'}}}},
 files:{type:'object',maxProperties:12,propertyNames:{pattern:FILE_NAME_PATTERN},additionalProperties:{type:'object',additionalProperties:false,required:['sha256','data'],
  properties:{sha256:sha,data:{type:'string',pattern:'^[A-Za-z0-9+/]*={0,2}$'}}}},
}});
