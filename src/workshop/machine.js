import * as THREE from '../../vendor/three.module.js';
import {workshopModel} from './catalogue.js';
import {loadWorkshopModel,makeWorkshopModel} from './models.js';

// Fits the existing rear workbench: no new obstruction in the narrow customer aisle.
export function buildWorkshopMachine({room,x,z}){
 const machine=new THREE.Group();machine.name='Form 3D printing machine';machine.position.set(x,.91,z);room.add(machine);
 const palette=new Map(),material=colour=>{if(!palette.has(colour))palette.set(colour,new THREE.MeshStandardMaterial({color:colour,roughness:.58}));return palette.get(colour);};
 function part(name,size,position,colour){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material(colour));mesh.name=name;mesh.position.set(...position);machine.add(mesh);return mesh;}
 part('Printer base',[1.02,.09,.49],[0,.045,0],0x51686b);
 part('Print bed',[.76,.025,.37],[0,.105,0],0xb1b8b0);
 for(const side of [-.47,.47])part('Gantry upright',[.055,.78,.055],[side,.44,-.13],0x758d8c);
 part('Gantry top',[1.0,.06,.08],[0,.85,-.13],0x51686b);
 const carriage=part('Moving print rail',[.94,.045,.045],[0,.25,-.10],0xadb6ac);
 const head=part('Print head',[.14,.12,.12],[0,.24,0],0xc98559);
 const nozzle=part('Brass nozzle',[.026,.065,.026],[0,.155,0],0xd5b47b);
 const lamp=new THREE.MeshBasicMaterial({color:0x86ad91});const status=new THREE.Mesh(new THREE.BoxGeometry(.14,.025,.02),lamp);status.name='Printer status lamp';status.position.set(.31,.06,.25);machine.add(status);
 const spool=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.10,20),material(0xc7dbcf));spool.rotation.z=Math.PI/2;spool.position.set(.60,.63,-.10);machine.add(spool);
 const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=96;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#263a3d';ctx.fillRect(0,0,512,96);ctx.fillStyle='#e3e8d8';ctx.font='bold 38px monospace';ctx.textAlign='center';ctx.fillText('FORM 3D',256,63);
 const texture=new THREE.CanvasTexture(labelCanvas);texture.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Mesh(new THREE.PlaneGeometry(.60,.11),new THREE.MeshBasicMaterial({map:texture}));label.position.set(-.09,.04,.251);machine.add(label);
 const sampleRoot=new THREE.Group();sampleRoot.position.set(0,.30,.02);machine.add(sampleRoot);
 let disposed=false,loaded=null,requested=null,revision=0,time=0,sampleHeight=.20;
 const clearSample=()=>{while(sampleRoot.children.length){const child=sampleRoot.children[0];child.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});sampleRoot.remove(child);}};
 function update(state,dt=0){
  if(disposed)return;time+=dt;
  const job=state.workshop.job,recipe=workshopModel(job?.id||state.workshop.selected);
  if(recipe&&requested!==recipe.id){
   requested=recipe.id;const request=++revision;
   loadWorkshopModel(recipe.id).then(data=>{if(disposed||request!==revision)return;clearSample();loaded=recipe.id;const sample=makeWorkshopModel(data,recipe.colour);sample.scale.setScalar(.32);sampleHeight=new THREE.Box3().setFromObject(sample).getSize(new THREE.Vector3()).y;sampleRoot.add(sample);}).catch(()=>{/* Retry on selection or the next visit, never every frame. */});
  }
  const printing=job&&job.remaining>0,progress=job?1-job.remaining/recipe.seconds:1;
  carriage.position.y=.25+progress*sampleHeight;
  head.position.set(printing?Math.sin(time*6)*.32:.37,carriage.position.y-.005,printing?Math.sin(time*3)*.11:0);
  nozzle.position.set(head.position.x,head.position.y-.09,head.position.z);
  spool.rotation.x=printing?time*1.5:spool.rotation.x;
  sampleRoot.visible=loaded===recipe?.id;sampleRoot.scale.y=printing?Math.max(.03,progress):1;
  sampleRoot.position.y=.12+sampleHeight*sampleRoot.scale.y/2;
  lamp.color.setHex(printing?0xe7b462:job?0x9ee6a9:0x739b8b);
 }
 return {group:machine,update,dispose(){disposed=true;revision++;}};
}
