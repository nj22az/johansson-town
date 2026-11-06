const obj=(properties,required=[])=>({type:'object',additionalProperties:false,properties,required});
export const SCENE_TOOLS=[{
 name:'scene_classroom_example',readOnly:true,description:'Four editable classroom scene snapshots: Vy rests, protests, overturns the desk and runs, then a taller, broader Studio-only teacher carries her back. Render each with scene_render. No writes or World changes.',input:obj({}),
 async run(){const [{classroomComic},{recipeFor}]=await Promise.all([import('../../../avatar-creator/classroom-comic.mjs'),import('../../src/avatars/cast.js')]);return {scenes:classroomComic(recipeFor)};}
},{name:'scene_render',readOnly:true,image:true,description:'Render a scene through the actual Studio Build scene workspace. Supports classroom furniture, exact camera, height, motion lines and liftedBy character contact. Returns normalized scene and measured hand contact errors. Saves preview only; never changes World.',
 input:obj({scene:{type:'object'},name:{type:'string',pattern:'^[a-z][a-z0-9-]{0,47}$',default:'scene'}},['scene']),
 async run({scene,name='scene'},ctx){
  if(JSON.stringify(scene).length>200000)throw Error('Scene exceeds 200 kB.');
  const page=await ctx.page(),result=await page.evaluate(async scene=>{
   const {createSceneWorkspace}=await import('/avatar-creator/scene.js');
   if(!window.__studioRenderWorkspace){window.__studioRenderWorkspace=createSceneWorkspace({getCharacter:()=>scene.actors?.[0]?.recipe||{},onEdit(){},onMode(){}});document.body.append(window.__studioRenderWorkspace.root);}
   return window.__studioRenderWorkspace.renderScene(scene);
  },scene);
  const bytes=Buffer.from(result.image.split(',')[1],'base64'),path=`output/studio-mcp/scenes/${name}.png`;await ctx.repo.write(path,bytes);
  return {image:bytes.toString('base64'),mimeType:'image/png',data:{path,scene:result.scene,contacts:result.contacts,framing:result.framing}};
 }
},{name:'comic_render',readOnly:true,image:true,description:'Rebuild one to four editable scene snapshots using Studio’s own panel capture and comic composition. Returns PNG, portable .studio.json project, hand-contact measurements and saved paths. No town data changes.',
 input:obj({scenes:{type:'array',minItems:1,maxItems:4,items:{type:'object'}},name:{type:'string',pattern:'^[a-z][a-z0-9-]{0,47}$',default:'comic'},layout:{enum:['grid','strip'],default:'strip'}},['scenes']),
 async run({scenes,name='comic',layout='strip'},ctx){
  if(JSON.stringify(scenes).length>800000)throw Error('Scenes exceed 800 kB.');
  // Initialise and validate the same workspace used by scene_render; no parallel rendering engine.
  await SCENE_TOOLS.find(t=>t.name==='scene_render').run({scene:scenes[0],name:name+'-first'},ctx);
  const page=await ctx.page(),result=await page.evaluate(({scenes,layout})=>window.__studioRenderWorkspace.renderComic(scenes,{layout}),{scenes,layout});
  const bytes=Buffer.from(result.image.split(',')[1],'base64'),path=`output/studio-mcp/scenes/${name}.png`,projectPath=`output/studio-mcp/scenes/${name}.studio.json`;
  await ctx.repo.write(path,bytes);await ctx.repo.write(projectPath,JSON.stringify(result.project));
  return {image:bytes.toString('base64'),mimeType:'image/png',data:{path,projectPath,panels:result.project.panels.length,contacts:result.contacts}};
 }
}];
