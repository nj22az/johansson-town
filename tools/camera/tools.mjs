const object=(properties={},required=[])=>({type:'object',properties,required,additionalProperties:false});
const text={type:'string',minLength:1,maxLength:300};
const unit={type:'number',minimum:0,maximum:1};
const signed={type:'number',minimum:-1,maximum:1};
const confirm={type:'boolean',description:'True only when the user has requested this save, export or session close.'};
const discard={type:'boolean',description:'Explicitly discard an existing unsaved edit before opening another image.'};
const edit=object({
 layers:{type:'array',minItems:1,maxItems:3,items:object({look:text,amount:unit},['look','amount'])},
 adjust:object(Object.fromEntries(['light','contrast','colour','warmth','pattern','detail'].map(key=>[key,signed]))),
 enhance:unit,paper:text,frame:text,
 crop:object(Object.fromEntries(['x','y','w','h'].map(key=>[key,unit])),['x','y','w','h']),
});
export const TOOLS=[
 {name:'camera_open',description:'Open a local Johansson Pocket Camera session from this checkout. Uses an isolated temporary album, not the user\'s phone or browser. No hardware-camera access. Export before closing.',input:object({headless:{type:'boolean'}}),method:'open'},
 {name:'camera_state',description:'Read the current mode, recipe, WebGL status and recent page errors. Does not return image bytes.',input:object(),method:'state',readOnly:true},
 {name:'camera_catalog',description:'List the app\'s actual Looks, frames, paper textures and adjustment names. Use their IDs for edits.',input:object(),method:'catalog',readOnly:true},
 {name:'camera_import',description:'Open a user-approved PNG, JPEG or WebP for editing. Supply a file under CAMERA_MCP_INPUT_DIR or padded base64 bytes, never a URL. Does not save the image.',input:object({path:text,data:{type:'string',minLength:16,maxLength:27962028},name:text,discard}),method:'importImage'},
 {name:'camera_edit',description:'Edit the open photo with the actual app controls: mix Looks, adjust, crop, Enhance, frame and paper. The original source remains intact. All choices are validated before applying.',input:object({edit},['edit']),method:'edit'},
 {name:'camera_preview',description:'Return an image of the current editor preview to the connected AI. Use only for a photo the user has approved for AI inspection. This is not a full-resolution export.',input:object(),method:'previewImage'},
 {name:'camera_save',description:'Save a NEW COPY with the app\'s renderer and JPEG compression into the temporary session album. Never overwrites an existing saved photo. User-requested action only.',input:object({confirm},['confirm']),method:'save'},
 {name:'camera_album',description:'List metadata and recipes for up to 200 photos in this temporary MCP session album. No access to phone Photos or a personal browser album.',input:object(),method:'album',readOnly:true},
 {name:'camera_open_photo',description:'Open a saved session photo using the app\'s original-source re-edit flow. Subsequent saves create a new copy.',input:object({id:text,discard},['id']),method:'openPhoto'},
 {name:'camera_export',description:'Write the selected session photo\'s exact saved bytes to a uniquely named local temporary file. Returns its path and SHA-256; never invokes Share, uploads or overwrites a file.',input:object({id:text,confirm},['id','confirm']),method:'exportPhoto'},
 {name:'camera_close',description:'Close this isolated browser and discard its temporary album. First export any photos to retain. Existing exported files are not removed.',input:object({confirm},['confirm']),method:'close',destructive:true},
];
export async function callTool(name,args,session){
 const tool=TOOLS.find(tool=>tool.name===name);if(!tool)throw Error('Unknown Camera tool.');
 if(name==='camera_close'&&args.confirm!==true)throw Error('Export photos first, then pass confirm:true to close the temporary session.');
 return session[tool.method](name==='camera_edit'?args.edit:args);
}
