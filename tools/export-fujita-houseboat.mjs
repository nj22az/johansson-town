import {readFile,writeFile} from 'node:fs/promises';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {GLTFExporter} from './vendor/GLTFExporter.js';
import {createHouseboatModel} from '../src/world/fujita-houseboat.js';
globalThis.ProgressEvent??=class extends Event{};
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(data=>{this.result=data;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(data=>{this.result='data:'+blob.type+';base64,'+Buffer.from(data).toString('base64');this.onloadend?.();});}};
const b=await readFile(new URL('../assets/models/harbour/fujita-houseboat-hull.glb',import.meta.url)),gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const model=createHouseboatModel(gltf.scene);model.userData={title:'Shiosai — Mr Fujita’s houseboat',attribution:'Hull adapted from Animal Crossing: New Horizons Crazy Redd Boat by damien_max59, CC BY 4.0. Original cabin, fittings and signs replaced for Johansson Town.',source:'https://sketchfab.com/3d-models/animal-crossing-new-horizons-crazy-redd-boat-f8cb034fa89e497588fb041f3e0c6704',license:'https://creativecommons.org/licenses/by/4.0/'};
const data=await new GLTFExporter().parseAsync(model,{binary:true});await writeFile(new URL('../assets/models/harbour/fujita-houseboat.glb',import.meta.url),Buffer.from(data));console.log('Complete houseboat exported:',data.byteLength,'bytes');
