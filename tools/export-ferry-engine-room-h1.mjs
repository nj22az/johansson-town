import fs from 'node:fs';
globalThis.location=new URL('https://example.test/?engine-room-h1');
const {FERRY_INTERIOR:i}=await import('../src/world/ferry-interior.js');
const {pipePreviewSegments}=await import('../src/world/ferry-pipe-routes.js');
const {FERRY_H1,FERRY_H1_SHOTS}=await import('../src/world/ferry-engine-room-plan.js');
const inside=p=>p[2]+17.25>=6.35&&p[2]+17.25<=26.06&&p[1]+1.9>=.65&&p[1]+1.9<=3.62;
const preview=pipePreviewSegments(i.pipes),bars=i.bars.slice(0,-preview.length);
const data={revision:'C-H1',basis:FERRY_H1,shots:FERRY_H1_SHOTS,
 boxes:i.boxes.filter(b=>b.draw!==false&&(inside(b.a)||inside(b.b))),
 bars:bars.filter(b=>(inside(b.a)||inside(b.b))),
 cyls:i.cyls.filter(c=>inside(c.pos)&&!['pipe bend','penetration'].includes(c.name)),
 plates:i.plates.filter(p=>inside(p.pos)),
 glass:i.glass.filter(p=>inside(p.pos)),
 caveat:'Source-derived Blender study. Preview-only pipes excluded. No selected OEM or fabrication approval.'};
fs.mkdirSync('art/ferry-engine-room',{recursive:true});
fs.writeFileSync('art/ferry-engine-room/geometry-h1.json',JSON.stringify(data));
fs.mkdirSync('art/ferry-engine-room/cad',{recursive:true});
fs.writeFileSync('art/ferry-engine-room/cad/design-h1.json',JSON.stringify({revision:'C-H1-04',units:'metres',basis:FERRY_H1,cameras:FERRY_H1_SHOTS},null,2));
console.log(JSON.stringify({boxes:data.boxes.length,bars:data.bars.length,cyls:data.cyls.length,plates:data.plates.length}));
