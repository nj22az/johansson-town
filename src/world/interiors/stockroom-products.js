import * as THREE from '../../../vendor/three.module.js';
const FONT='"Yu Gothic","Hiragino Kaku Gothic ProN",sans-serif';
const texture=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;};
// Labels and stickers are decals (polygon offset) on their bottle and rice; the nori band stands 3.5 mm clear of the
// rice's bevel (the Sakura surface audit, SK-ZF rev A).
let beer,rice;
export function stockroomBeerBottle(){
 if(!beer){
  const profile=[[0,0],[.026,0],[.031,.006],[.032,.02],[.032,.17],[.028,.192],[.016,.216],[.014,.262],[.016,.267]];
  const body=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),20);
  const label=texture(256,256,(c,w,h)=>{c.fillStyle='#f5e6b9';c.fillRect(0,0,w,h);c.fillStyle='#942f24';c.fillRect(0,18,w,14);c.fillRect(0,h-32,w,14);c.textAlign='center';c.textBaseline='middle';c.font='bold 28px '+FONT;c.fillText('海 猫',w/2,85);c.font='bold 22px '+FONT;c.fillText('UMINEKO',w/2,125);c.font='18px '+FONT;c.fillText('LAGER · 633 ml',w/2,166);c.fillStyle='#b18c34';c.beginPath();c.arc(w/2,44,9,0,Math.PI*2);c.fill();});
  beer={body,glass:new THREE.MeshStandardMaterial({color:0x684018,roughness:.23,metalness:.15}),label:new THREE.CylinderGeometry(.0324,.0324,.105,20,1,true),paper:new THREE.MeshStandardMaterial({map:label,roughness:.65,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}),cap:new THREE.CylinderGeometry(.017,.017,.009,20),metal:new THREE.MeshStandardMaterial({color:0xbbac6c,metalness:.65,roughness:.38})};
 }
 const g=new THREE.Group();g.name='Umineko amber lager bottle';g.userData.sharedAsset=true;
 g.add(new THREE.Mesh(beer.body,beer.glass));const l=new THREE.Mesh(beer.label,beer.paper);l.position.y=.106;g.add(l);const cap=new THREE.Mesh(beer.cap,beer.metal);cap.position.y=.272;g.add(cap);return g;
}
export function deliveryOnigiri(){
 if(!rice){
  const triangle=new THREE.Shape();triangle.moveTo(-.049,.009);triangle.quadraticCurveTo(-.066,.012,-.05,.037);triangle.lineTo(-.009,.103);triangle.quadraticCurveTo(0,.117,.009,.103);triangle.lineTo(.05,.037);triangle.quadraticCurveTo(.066,.012,.049,.009);triangle.closePath();
  const body=new THREE.ExtrudeGeometry(triangle,{depth:.043,bevelEnabled:true,bevelThickness:.006,bevelSize:.005,bevelSegments:2,steps:1,curveSegments:7});body.translate(0,-.002,-.0215);
  const grain=texture(256,256,(c,w,h)=>{c.fillStyle='#f7f1dd';c.fillRect(0,0,w,h);for(let i=0;i<380;i++){const x=(i*73.41)%w,y=(i*39.73)%h;c.fillStyle=i%3?'#fffbed':'#ded7bf';c.beginPath();c.ellipse(x,y,2.4,5.2,(i%8)*.4,0,Math.PI*2);c.fill();}});
  const nori=texture(128,128,(c,w,h)=>{c.fillStyle='#243126';c.fillRect(0,0,w,h);for(let i=0;i<300;i++){c.fillStyle=i%2?'#354033':'#172419';c.fillRect((i*31.3)%w,(i*47.7)%h,2,4);}});
  rice={body,white:new THREE.MeshStandardMaterial({map:grain,roughness:.88}),nori:new THREE.MeshStandardMaterial({map:nori,roughness:.9}),wrap:new THREE.BoxGeometry(.042,.049,.062),sticker:new THREE.MeshStandardMaterial({map:texture(128,128,c=>{c.fillStyle='#fffdf2';c.fillRect(0,0,128,128);c.fillStyle='#aa3536';c.fillRect(0,0,128,25);c.textAlign='center';c.font='bold 25px '+FONT;c.fillText('鮭',64,62);c.font='18px '+FONT;c.fillText('¥110',64,95);}),roughness:.6,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}),label:new THREE.PlaneGeometry(.026,.026)};
 }
 const g=new THREE.Group();g.name='Fresh salmon onigiri · rice and nori';g.userData.sharedAsset=true;g.add(new THREE.Mesh(rice.body,rice.white));const strip=new THREE.Mesh(rice.wrap,rice.nori);strip.position.y=.024;g.add(strip);
 const sticker=new THREE.Mesh(rice.label,rice.sticker);sticker.position.set(.026,.066,.0285);g.add(sticker);return g;
}

export function stockroomBeerBatch(positions){
 const source=stockroomBeerBottle(),group=new THREE.Group(),dummy=new THREE.Object3D();group.name='Returnable amber beer bottles';group.userData.sharedAsset=true;
 for(const part of source.children){const m=new THREE.InstancedMesh(part.geometry,part.material,positions.length);m.name=part===source.children[0]?'Amber bottle bodies':part===source.children[1]?'Beer bottle labels':'Crown caps';
  positions.forEach(([x,y,z],i)=>{dummy.position.set(x,y+part.position.y,z);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});m.computeBoundingSphere();group.add(m);
 }return group;
}
