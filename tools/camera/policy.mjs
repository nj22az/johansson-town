import {open,realpath,stat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,relative,isAbsolute,basename} from 'node:path';

export const MAX_IMAGE_BYTES=20*1024*1024;
export const MAX_IMAGE_PIXELS=48000000;
export function imageType(bytes){
 if(bytes.length>MAX_IMAGE_BYTES||bytes.length<12)throw Error('Image must contain 12 bytes to 20 MiB.');
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'image/webp';
 throw Error('Use a PNG, JPEG or WebP image; SVG and other formats are not accepted.');
}
/** Read dimensions before the app decodes/downscales, so oversized files never replace an open edit. */
export function imageInfo(bytes){
 const mimeType=imageType(bytes);let width,height;
 if(mimeType==='image/png'){
  if(bytes.length<33||bytes.readUInt32BE(8)!==13||bytes.toString('ascii',12,16)!=='IHDR')throw Error('Invalid PNG header.');
  width=bytes.readUInt32BE(16);height=bytes.readUInt32BE(20);
 }else if(mimeType==='image/jpeg'){
  let offset=2;
  while(offset<bytes.length){
   if(bytes[offset++]!==255)break;
   while(bytes[offset]===255)offset++;
   const marker=bytes[offset++];if(marker===0xda||marker===0xd9)break;
   if(marker===0x01||marker>=0xd0&&marker<=0xd8)continue;
   if(offset+2>bytes.length)break;
   const size=bytes.readUInt16BE(offset);if(size<2||offset+size>bytes.length)break;
   if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
    if(size<8)break;height=bytes.readUInt16BE(offset+3);width=bytes.readUInt16BE(offset+5);break;
   }
   offset+=size;
  }
 }else{
  let offset=12;
  while(offset+8<=bytes.length){
   const kind=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),data=offset+8;
   if(data+size>bytes.length)break;
   if(kind==='VP8X'&&size>=10){width=1+bytes.readUIntLE(data+4,3);height=1+bytes.readUIntLE(data+7,3);break;}
   if(kind==='VP8 '&&size>=10&&bytes.toString('hex',data+3,data+6)==='9d012a'){width=bytes.readUInt16LE(data+6)&0x3fff;height=bytes.readUInt16LE(data+8)&0x3fff;break;}
   if(kind==='VP8L'&&size>=5&&bytes[data]===0x2f){const bits=bytes.readUInt32LE(data+1);width=1+(bits&0x3fff);height=1+((bits>>>14)&0x3fff);break;}
   offset=data+size+(size%2);
  }
 }
 if(!width||!height)throw Error('Image has no valid dimensions.');
 if(width*height>MAX_IMAGE_PIXELS)throw Error('Use an image no larger than 48 megapixels.');
 return {mimeType,width,height};
}
export function decodeImage(data){
 if(typeof data!=='string'||data.length>Math.ceil(MAX_IMAGE_BYTES/3)*4||!data.length||data.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(data))throw Error('Expected bounded, padded base64 image bytes, not a URL.');
 const bytes=Buffer.from(data,'base64');
 if(bytes.toString('base64')!==data)throw Error('Invalid base64 image bytes.');
 return {bytes,...imageInfo(bytes)};
}
export async function readImage(inputRoot,path){
 if(!inputRoot)throw Error('Set CAMERA_MCP_INPUT_DIR to a folder of approved images, or supply base64 image bytes.');
 const root=await realpath(inputRoot),file=await realpath(resolve(root,path)),rel=relative(root,file);
 if(!rel||rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||isAbsolute(rel))throw Error('Image is outside CAMERA_MCP_INPUT_DIR.');
 const info=await stat(file);if(!info.isFile()||info.size>MAX_IMAGE_BYTES)throw Error('Image must be a regular file no larger than 20 MiB.');
 const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const actual=await handle.stat();if(!actual.isFile()||actual.size>MAX_IMAGE_BYTES)throw Error('Image changed while opening.');
  const current=await realpath(file),currentRel=relative(root,current),now=await stat(current);
  if(currentRel==='..'||currentRel.startsWith('../')||currentRel.startsWith('..\\')||isAbsolute(currentRel)||now.dev!==actual.dev||now.ino!==actual.ino)throw Error('Image changed or moved outside CAMERA_MCP_INPUT_DIR while opening.');
  const bytes=Buffer.alloc(actual.size);let offset=0;
  while(offset<bytes.length){const {bytesRead}=await handle.read(bytes,offset,bytes.length-offset,offset);if(!bytesRead)throw Error('Image changed while reading.');offset+=bytesRead;}
  return {bytes,...imageInfo(bytes),name:basename(file)};
 }finally{await handle.close();}
}
export function validateEdit(edit,catalog){
 if(!edit||typeof edit!=='object'||Array.isArray(edit))throw Error('Pass an edit object.');
 const known=['layers','adjust','enhance','paper','frame','crop'];
 for(const key of Object.keys(edit))if(!known.includes(key))throw Error(`Unsupported edit field: ${key}`);
 if(!Object.keys(edit).length)throw Error('Supply at least one edit.');
 const range=(n,min,max,label)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error(`${label} must be between ${min} and ${max}.`);};
 if(edit.layers!==undefined){
  if(!Array.isArray(edit.layers)||!edit.layers.length||edit.layers.length>3)throw Error('Use one to three Look layers.');
  for(const layer of edit.layers){
   if(!layer||Object.keys(layer).some(k=>!['look','amount'].includes(k))||!catalog.looks.some(l=>l.id===layer.look))throw Error('Unknown Look; call camera_catalog first.');
   range(layer.amount,0,1,'Look intensity');
  }
 }
 if(edit.adjust!==undefined){
  if(!edit.adjust||typeof edit.adjust!=='object'||Array.isArray(edit.adjust))throw Error('Adjust must be an object.');
  for(const [key,value] of Object.entries(edit.adjust)){if(!['light','contrast','colour','warmth','pattern','detail'].includes(key))throw Error(`Unknown adjustment: ${key}`);range(value,-1,1,key);}
 }
 if(edit.enhance!==undefined)range(edit.enhance,0,1,'Enhance');
 for(const field of ['frame','paper'])if(edit[field]!==undefined&&!catalog[field+'s'].some(v=>v.id===edit[field]))throw Error(`Unknown ${field}; call camera_catalog first.`);
 if(edit.crop!==undefined){
  const c=edit.crop;if(!c||Object.keys(c).length!==4||Object.keys(c).some(k=>!['x','y','w','h'].includes(k)))throw Error('Crop needs exactly x, y, w and h.');
  for(const key of ['x','y','w','h'])range(c[key],0,1,`Crop ${key}`);
  if(c.w<.01||c.h<.01||c.x+c.w>1+1e-9||c.y+c.h>1+1e-9)throw Error('Crop must stay inside the original image and be at least 1% wide and high.');
 }
 return edit;
}
