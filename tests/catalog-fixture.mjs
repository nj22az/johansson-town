// A catalogue asset's model for the tests: read from assets/catalog on disk, parsed with World's own GLTFLoader, and handed
// to the catalogue (provideAsset), as the game's loadAsset does in a page. Node cannot decode the PNG labels, so their
// textures are stand-ins; the geometry, the names, the materials and the hierarchy are the file's own.
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {catalogCard,provideAsset,assetLoaded} from '../src/catalog/catalog.js';

/** The scene GLTFLoader makes of an asset's model.glb. */
export async function parseCatalogModel(id){
 const card=catalogCard(id),bytes=await readFile(new URL('../assets/catalog/'+card.model,import.meta.url));
 const loader=new GLTFLoader();
 loader.register(()=>({name:'node-texture-stand-in',loadTexture(index){const t=new THREE.Texture();t.userData.gltfTexture=index;return Promise.resolve(t);}}));
 return (await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
}

/** Puts the models in hand (the massage chair by default), so a room built after this has them. */
export async function provideCatalog(...ids){
 for(const id of ids.length?ids:['massage-chair'])if(!assetLoaded(id))provideAsset(id,await parseCatalogModel(id));
}
