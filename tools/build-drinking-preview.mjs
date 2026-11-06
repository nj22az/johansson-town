// Produce a genuinely offline preview from the same source used by the game lab.
// No CDN, duplicate animation implementation, runtime network calls or placeholder assets.
import {readFile,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
const root=new URL('../',import.meta.url),path=name=>new URL(name,root);
const model=(await readFile(path('assets/models/drinking/drinking-mannequin.glb'))).toString('base64');
const blend=(await readFile(path('assets/models/drinking/drinking-mannequin.blend'))).toString('base64');
const bundle=await build({entryPoints:[path('drinking-simulator/main.js').pathname],bundle:true,write:false,
  format:'esm',target:'es2022',minify:true,legalComments:'inline',plugins:[{
    name:'inline-editable-mannequin',setup(b){b.onLoad({filter:/src\/drinking\/mannequin\.js$/},async args=>({
      contents:(await readFile(args.path,'utf8')).replace("new URL('../../assets/models/drinking/drinking-mannequin.glb',import.meta.url)",JSON.stringify('data:model/gltf-binary;base64,'+model)),loader:'js',
    }));},
  }]});
const css=await readFile(path('drinking-simulator/style.css'),'utf8');
const licence=await readFile(path('vendor/LICENSE-THREE.txt'),'utf8');
const docs=Buffer.from(await readFile(path('docs/DRINKING-SIMULATOR.md'))).toString('base64');
let html=await readFile(path('drinking-simulator/index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="./style.css">',`<style>${css}</style>`)
  .replace('<script type="module" src="./main.js"></script>',`<script type="module">/*! Three.js dependency licence:\n${licence.replace(/\*\//g,'* /')}\n*/\n${bundle.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script>`)
  .replace('href="../assets/models/drinking/drinking-mannequin.blend"',`href="data:application/octet-stream;base64,${blend}"`)
  .replace('download>Blender source','download="drinking-mannequin.blend">Blender source')
  .replace('href="../docs/DRINKING-SIMULATOR.md"',`href="data:text/markdown;base64,${docs}" download="DRINKING-SIMULATOR.md"`)
  .replace('href="../"','href="https://nj22az.github.io/johansson-town/"');
const output=path('drinking-simulator/standalone.html');await writeFile(output,html);
console.log(`Built ${output.pathname} (${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB, model and Blender source embedded).`);
