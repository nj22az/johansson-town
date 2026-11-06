#!/usr/bin/env node
/**
 * Every johansson-studio tool on the command line, for when the MCP connection is not there:
 *   node johansson-town/tools/studio/cli.mjs                          list the tools
 *   node johansson-town/tools/studio/cli.mjs <tool> '<json>'          run one, e.g.
 *   node johansson-town/tools/studio/cli.mjs character_get '{"name":"Mr Fujita"}'
 *   node johansson-town/tools/studio/cli.mjs render_portrait '{"name":"Mr Fujita","view":"quarter"}'
 * The arguments are checked against the same schema the MCP server uses. A render prints the path of its PNG.
 */
import * as z from 'zod';
import {TOOLS,TOOL_BY_NAME,context,callTool} from './tools.mjs';

const [name,json='{}']=process.argv.slice(2);
if(!name||name==='help'||name==='--help'){
 console.log('Johansson Studio tools (node johansson-town/tools/studio/cli.mjs <tool> \'<json>\'):\n'+TOOLS.map(t=>`  ${t.name.padEnd(17)} ${t.description}`).join('\n'));
 process.exit(0);
}
const tool=Object.hasOwn(TOOL_BY_NAME,name)?TOOL_BY_NAME[name]:null;
if(!tool){console.error(`There is no tool called ${name}. Run with no arguments to list them.`);process.exit(2);}
let args;
try{args=JSON.parse(json);}catch{console.error('The arguments must be JSON, e.g. \'{"name":"Mr Fujita"}\'.');process.exit(2);}
const parsed=z.fromJSONSchema(tool.input).safeParse(args);
if(!parsed.success){console.error(JSON.stringify({error:'These arguments do not fit the tool.',issues:parsed.error.issues.map(i=>`${i.path.join('.')||'arguments'}: ${i.message}`)},null,1));process.exit(2);}
const ctx=await context();
try{
 const result=await callTool(name,parsed.data,ctx);
 const shown=result?.image&&result?.mimeType?result.data:result;
 console.log(JSON.stringify(shown,null,1));
 if(result.error||result.ok===false)process.exitCode=1;
}finally{await ctx.close();}
