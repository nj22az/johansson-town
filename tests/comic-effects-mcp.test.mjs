import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {CODE_ROOT} from '../tools/studio/repo.mjs';

// Optional browser acceptance: node --test tests/comic-effects-mcp.test.mjs (STUDIO_BROWSER_TEST=1).
test('MCP After effects exports, replaces text/assets and reopens the layered project',{skip:!process.env.STUDIO_BROWSER_TEST,timeout:180000},async()=>{
 const root=await mkdtemp(join(tmpdir(),'comic-effects-mcp-')),client=new Client({name:'comic-effects-test',version:'1'});
 try{
  await client.connect(new StdioClientTransport({command:process.execPath,args:['johansson-town/tools/studio/server.mjs'],cwd:CODE_ROOT,env:{...process.env,JOHANSSON_STUDIO_ROOT:root},stderr:'inherit'}));
  const call=async(name,args={})=>{const r=await client.callTool({name,arguments:args},{timeout:150000});assert.notEqual(r.isError,true,JSON.stringify(r.content));return {data:JSON.parse(r.content.find(c=>c.type==='text').text),image:r.content.find(c=>c.type==='image')};};
  const info=await call('comic_effects_info');assert.equal(info.data.looks.length,19);assert.ok(info.data.looks.some(l=>l.id==='sketchbook'));for(const id of ['storybook','sunday','gouache'])assert.ok(!info.data.looks.some(l=>l.id===id));
  const opened=await call('comic_after_effects',{name:'original'});assert.equal(opened.data.panels.length,3);assert.ok(opened.data.shareUrl.includes('#studio='));assert.ok(opened.image.data.length>10000);
  const actor=opened.data.panels[0].actors.find(a=>a.speech).id;
  const edited=await call('comic_after_effects',{projectFile:opened.data.projectPath,name:'edited',edits:[{panel:1,look:'manga',dialogue:[{actor,text:'These are replacement words!'}],assets:[{kind:'star',x:.7,y:.6,rotation:25},{kind:'text',text:'AFTER WORK',x:.4,y:.9}]},{panel:2,look:'sketchbook'}]});
  assert.equal(edited.data.panels[0].look,'manga');assert.equal(edited.data.panels[1].look,'sketchbook');assert.equal(edited.data.panels[0].actors.find(a=>a.id===actor).speech,'These are replacement words!');assert.equal(edited.data.panels[0].assets.length,2);
  assert.notEqual(opened.image.data,edited.image.data);
  const project=JSON.parse(await readFile(join(root,edited.data.projectPath),'utf8'));assert.equal(project.panelLayers[0].post.assets[0].x,.7);
  const reopened=await call('comic_after_effects',{projectFile:edited.data.projectPath,name:'reopened'});assert.equal(reopened.image.data,edited.image.data);
  const removed=await call('comic_after_effects',{projectFile:edited.data.projectPath,name:'removed',edits:[{panel:1,dialogue:[{actor,text:''}],assets:[]}]});assert.equal(removed.data.panels[0].actors.find(a=>a.id===actor).speech,'');assert.equal(removed.data.panels[0].assets.length,0);
  const pictured=await call('comic_after_effects',{projectFile:edited.data.projectPath,name:'image-asset',edits:[{panel:1,assets:[{kind:'image',image:project.panelLayers[0].plate,x:.8,y:.7,size:.2}]}]});assert.equal(pictured.data.panels[0].assets[0].hasImage,true);assert.equal(pictured.data.shareUrl,null);assert.match(pictured.data.shareWarning,/too large/);
  const withImage=JSON.parse(await readFile(join(root,pictured.data.projectPath),'utf8'));assert.ok(withImage.panelLayers[0].post.assets[0].image.startsWith('data:image/'));
  const overwrite=await client.callTool({name:'comic_after_effects',arguments:{projectFile:edited.data.projectPath,name:'edited'}});assert.equal(overwrite.isError,true);
  const traversal=await client.callTool({name:'comic_after_effects',arguments:{projectFile:'../outside.json'}});assert.equal(traversal.isError,true);
  const sv=await call('comic_after_effects',{name:'swedish',language:'sv'});assert.match(sv.data.panels[0].actors.find(a=>a.speech).speech,/Lär dig/);
  const rejected=await client.callTool({name:'comic_after_effects',arguments:{projectFile:edited.data.projectPath,name:'refused',language:'sv'}});assert.equal(rejected.isError,true);
 }finally{await client.close();await rm(root,{recursive:true,force:true});}
});
