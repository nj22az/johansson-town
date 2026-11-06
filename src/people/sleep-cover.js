import * as THREE from '../../vendor/three.module.js';

// A small, room-local cloth surface replaces the rigid block that previously
// left sleeping residents exposed. It is created only for the occupied home.
export function createSleepCover(parent,layout,colour){
 const spec=layout.cover;if(!spec)return null;
 const columns=8,rows=12,positions=[],indices=[],base=[],breath=[];
 for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
  const u=column/columns,v=row/rows,x=(u-.5)*spec.width,z=(v-.5)*spec.length;
  const centre=Math.sin(Math.PI*u),ends=Math.sin(Math.PI*(.08+.84*v));
  const y=.015+.18*Math.pow(Math.max(0,centre),.72)*(.72+.28*ends);
  positions.push(x,y,z);base.push(y);
  breath.push(Math.exp(-(((v-.27)/.22)**2))*Math.sin(Math.PI*u)**2);
 }
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
  const a=row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1;
  indices.push(a,c,b,b,c,d);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
 const tint=new THREE.Color(colour||0x8f6d78).lerp(new THREE.Color(0xf1e4d2),.28);
 const material=new THREE.MeshStandardMaterial({color:tint,roughness:1,side:THREE.DoubleSide,transparent:true,opacity:0});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='animated sleep cover';mesh.userData.animatedCover=true;mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.position.fromArray(spec.position);if(spec.axis==='x')mesh.rotation.y=Math.PI/2;parent.add(mesh);
 let elapsed=0,normalClock=0;
 function update(dt,amount){
  elapsed+=dt;normalClock+=dt;amount=THREE.MathUtils.clamp(Number(amount)||0,0,1);mesh.visible=amount>.015;if(!mesh.visible)return;
  material.opacity=THREE.MathUtils.smoothstep(amount,0,.38);mesh.position.y=spec.position[1]-(1-amount)*.10;
  const attribute=geometry.attributes.position,pulse=Math.sin(elapsed*1.55)*.018*amount;
  for(let i=0;i<attribute.count;i++)attribute.setY(i,base[i]+breath[i]*pulse+Math.sin(elapsed*.72+i*.37)*.0025*amount);
  attribute.needsUpdate=true;
  if(normalClock>.12){geometry.computeVertexNormals();normalClock=0;}
 }
 update(0,0);
 return {mesh,update,dispose(){mesh.removeFromParent();geometry.dispose();material.dispose();}};
}
