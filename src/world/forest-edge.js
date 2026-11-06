import * as THREE from '../../vendor/three.module.js';
import {signPlate} from './sign-plate.js';
import {MAIN_ROAD} from './main-road.js';
import {GROUND_LAYER} from './ground-layers.js';
import {broadleafGeometry,TREE_GREENS} from './okinawa/trees.js';

// The public road ends at a dense tree line. The final segment is deliberately
// visual-only: the Harbour Line continues beyond the trees, while the player
// remains on the station side of the blocked forest edge.
export const FOREST_EDGE=Object.freeze({
 id:'forest-edge',
 roadX:MAIN_ROAD.x,
 wallZ:33.8,
 /**
  * Where the bus road begins, which is where the terminus apron stops paving the
  * ground -- BUS_STATION.maxZ is defined from this. The road used to start back at
  * the shopping street and run the length of the apron underneath it, two slabs a
  * centimetre apart over the whole platform.
  */
 roadStartZ:29.3,
 roadEndZ:36.6,
 minX:-15.5,
 maxX:8.5,
 busOnly:true,
});

function signTexture(title,sub){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#e2d8b7';ctx.fillRect(0,0,768,192);ctx.strokeStyle='#3d5149';ctx.lineWidth=8;ctx.strokeRect(10,10,748,172);ctx.fillStyle='#304b43';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 70px "Yu Gothic",system-ui';ctx.fillText(title,384,70,700);ctx.font='600 27px system-ui';ctx.fillText(sub,384,139,700);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

/**
 * @param {object} options
 * @param {boolean} [options.trees] false builds the bus road on its own, for layouts
 *   that close it with something other than a tree line — see coyote-tunnel.js.
 */
export function buildForestEdge({parent,colliders,register=()=>{},onAction=()=>{},shadows=false,trees=true}={}){
 const group=new THREE.Group();group.name='Forest wall and bus-only road';parent.add(group);
 const roadLength=FOREST_EDGE.roadEndZ-FOREST_EDGE.roadStartZ,roadMiddle=(FOREST_EDGE.roadEndZ+FOREST_EDGE.roadStartZ)/2;
 // Without the tree line this is the island's layout, where no bus runs: the old road up
 // to the headland is a gravel footpath to the sea cave, between wide grass verges.
 const footpath=!trees;
 const road=new THREE.Mesh(new THREE.BoxGeometry(footpath?2.4:MAIN_ROAD.width,.09,roadLength),new THREE.MeshStandardMaterial({color:footpath?0x9c927c:0x60645d,roughness:footpath?1:.94}));
 road.name=footpath?'sea cave footpath':'bus-only forest road';road.position.set(FOREST_EDGE.roadX,GROUND_LAYER.apron-.045,roadMiddle);road.receiveShadow=!!shadows;group.add(road);
 const vergeMat=new THREE.MeshStandardMaterial({color:0x798062,roughness:1});
 const vergeWidth=footpath?(MAIN_ROAD.width-2.4)/2+2.1:2.1,vergeFrom=footpath?1.2:MAIN_ROAD.width/2;
 for(const side of [-1,1]){
  const verge=new THREE.Mesh(new THREE.BoxGeometry(vergeWidth,.055,roadLength+.4),vergeMat);verge.position.set(FOREST_EDGE.roadX+side*(vergeFrom+vergeWidth/2),GROUND_LAYER.grass-.0275,roadMiddle);verge.receiveShadow=!!shadows;group.add(verge);
 }
 const leafMats=[0x42634b,0x4f7650,0x5b7f53].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
 if(!trees)return {group,road,wall:null,marker:null,busRoute:{id:'cave-path',width:MAIN_ROAD.width,surface:'gravel',points:[[MAIN_ROAD.x,MAIN_ROAD.maxZ],[MAIN_ROAD.x,FOREST_EDGE.roadEndZ]]}};
 const treeXs=[];
 for(let i=0;i<15;i++)treeXs.push(FOREST_EDGE.minX+.65+i*(FOREST_EDGE.maxX-FOREST_EDGE.minX-1.3)/14);
 const treeMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});
 const shapes=[0,1,2].map(variant=>broadleafGeometry({variant,form:'round',greens:TREE_GREENS.hill}));
 for(const [row,zOffset] of [[0,-.18],[1,.72]])for(const [i,x] of treeXs.entries()){
  const z=FOREST_EDGE.wallZ+zOffset+(i%3-.9)*.18,height=3.4+(i%4)*.4;
  const tree=new THREE.Mesh(shapes[(i+row)%3],treeMat);tree.name='Forest edge tree';
  tree.position.set(x,0,z);tree.scale.setScalar(height);tree.rotation.y=i*2.1+row;tree.castShadow=!!shadows;group.add(tree);
 }
 // Low shrubs soften both ends of the wall and make the obstruction read as
 // natural under the canopy rather than as an invisible gameplay boundary.
 for(let i=0;i<18;i++){
  const x=FOREST_EDGE.minX+.5+(i%9)*(FOREST_EDGE.maxX-FOREST_EDGE.minX-1)/8,z=FOREST_EDGE.wallZ-1.05+(i%2)*.55;
  const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.55+(i%3)*.12,0),leafMats[i%leafMats.length]);shrub.position.set(x,.43,z);shrub.scale.y=.75;shrub.castShadow=!!shadows;group.add(shrub);
 }
 const wall=new THREE.Mesh(new THREE.BoxGeometry(FOREST_EDGE.maxX-FOREST_EDGE.minX+.8,.9,.72),new THREE.MeshStandardMaterial({color:0x39483a,roughness:1,transparent:true,opacity:.0}));
 wall.position.set((FOREST_EDGE.minX+FOREST_EDGE.maxX)/2,.55,FOREST_EDGE.wallZ+.08);group.add(wall);
 colliders.push({id:'forest-wall',x:(FOREST_EDGE.minX+FOREST_EDGE.maxX)/2,z:FOREST_EDGE.wallZ,w:FOREST_EDGE.maxX-FOREST_EDGE.minX+.8,d:.9,height:5.8});
 const sign=signPlate(new THREE.MeshBasicMaterial({map:signTexture("Forest road",'FOREST ROAD · BUS ONLY')}),3.7,.82,{back:0x594938,edge:0x594938,depth:.04,name:'Forest road notice'});sign.position.set(FOREST_EDGE.roadX,2.15,FOREST_EDGE.wallZ-.5);group.add(sign);
 const postMat=new THREE.MeshStandardMaterial({color:0x594938,roughness:1});
 for(const x of [FOREST_EDGE.roadX-1.8,FOREST_EDGE.roadX+1.8]){const post=new THREE.Mesh(new THREE.BoxGeometry(.1,2.1,.1),postMat);post.position.set(x,1.05,FOREST_EDGE.wallZ-.48);post.castShadow=!!shadows;group.add(post);}
 const marker=new THREE.Object3D();marker.name='forest-road-waypoint';marker.position.set(FOREST_EDGE.roadX,1,FOREST_EDGE.wallZ-.9);group.add(marker);register(marker,'Read the forest road notice',()=>onAction('read','Forest road notice','The road disappears into the trees. The Harbour Line has permission to continue beyond the wall; pedestrians must turn back at the bus terminal.'));
 return {group,road,wall,marker,busRoute:{id:'cave-path',width:MAIN_ROAD.width,surface:'gravel',points:[[MAIN_ROAD.x,MAIN_ROAD.maxZ],[MAIN_ROAD.x,FOREST_EDGE.roadEndZ]]}};
}
