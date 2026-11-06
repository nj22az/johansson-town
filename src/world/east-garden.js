import * as THREE from '../../vendor/three.module.js';

/**
 * A compact Japanese garden cluster on the east lawn.
 *
 * Not the Chicago garden GLB — that scene is a self-contained bake and would
 * swallow the harbour park. What is taken from orlandocarnate/japanese_garden
 * is the water and firefly shader idea (Journey-course Perlin waves + soft
 * points), rebuilt as primitives at lawn scale: a stone basin, two lanterns,
 * a low pond you walk around, fireflies after eighteen-thirty.
 *
 * Credit: Orlando Carnate, https://github.com/orlandocarnate/japanese_garden
 */
export const EAST_GARDEN=Object.freeze({
 id:'east-garden-pond',
 x:28.15,z:-6.4,radius:1.35,
 lanterns:Object.freeze([[27.05,-5.15],[29.45,-8.05]]),
});

const WATER_VERT=`
uniform float uWavesAmplitude;
uniform vec2 uWavesFrequency;
uniform float uTime;
uniform float uBigWavesSpeed;
uniform float uSmallWavesElev;
uniform float uSmallWavesFreq;
uniform float uSmallWavesSpeed;
uniform float uSmallWavesIterations;
uniform float uMaxDepth;
varying float vElevation;
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec3 P){
 vec3 Pi0=floor(P),Pi1=Pi0+vec3(1.0);
 Pi0=mod(Pi0,289.0);Pi1=mod(Pi1,289.0);
 vec3 Pf0=fract(P),Pf1=Pf0-vec3(1.0);
 vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);
 vec4 iy=vec4(Pi0.yy,Pi1.yy);
 vec4 iz0=Pi0.zzzz,iz1=Pi1.zzzz;
 vec4 ixy=permute(permute(ix)+iy);
 vec4 ixy0=permute(ixy+iz0);
 vec4 ixy1=permute(ixy+iz1);
 vec4 gx0=ixy0/7.0;vec4 gy0=fract(floor(gx0)/7.0)-0.5;gx0=fract(gx0);
 vec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0);vec4 sz0=step(gz0,vec4(0.0));
 gx0-=sz0*(step(0.0,gx0)-0.5);gy0-=sz0*(step(0.0,gy0)-0.5);
 vec4 gx1=ixy1/7.0;vec4 gy1=fract(floor(gx1)/7.0)-0.5;gx1=fract(gx1);
 vec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1);vec4 sz1=step(gz1,vec4(0.0));
 gx1-=sz1*(step(0.0,gx1)-0.5);gy1-=sz1*(step(0.0,gy1)-0.5);
 vec3 g000=vec3(gx0.x,gy0.x,gz0.x),g100=vec3(gx0.y,gy0.y,gz0.y);
 vec3 g010=vec3(gx0.z,gy0.z,gz0.z),g110=vec3(gx0.w,gy0.w,gz0.w);
 vec3 g001=vec3(gx1.x,gy1.x,gz1.x),g101=vec3(gx1.y,gy1.y,gz1.y);
 vec3 g011=vec3(gx1.z,gy1.z,gz1.z),g111=vec3(gx1.w,gy1.w,gz1.w);
 vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
 g000*=norm0.x;g010*=norm0.y;g100*=norm0.z;g110*=norm0.w;
 vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
 g001*=norm1.x;g011*=norm1.y;g101*=norm1.z;g111*=norm1.w;
 float n000=dot(g000,Pf0);
 float n100=dot(g100,vec3(Pf1.x,Pf0.yz));
 float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));
 float n110=dot(g110,vec3(Pf1.xy,Pf0.z));
 float n001=dot(g001,vec3(Pf0.xy,Pf1.z));
 float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
 float n011=dot(g011,vec3(Pf0.x,Pf1.yz));
 float n111=dot(g111,Pf1);
 vec3 fade_xyz=fade(Pf0);
 vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
 vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
 return 2.2*mix(n_yz.x,n_yz.y,fade_xyz.x);
}
void main(){
 vec4 modelPosition=modelMatrix*vec4(position,1.0);
 float elevation=sin(modelPosition.x*uWavesFrequency.x-uTime*uBigWavesSpeed)
  *sin(modelPosition.z*uWavesFrequency.y+uTime*uBigWavesSpeed)*uWavesAmplitude;
 for(float i=1.0;i<=uSmallWavesIterations;i++){
  elevation-=abs(cnoise(vec3(modelPosition.xz*uSmallWavesFreq*i,uTime*uSmallWavesSpeed))*uSmallWavesElev/i);
 }
 // The pond sits on the lawn. Troughs must stay above its grass surface.
 elevation=max(elevation,-uMaxDepth);
 modelPosition.y+=elevation;
 gl_Position=projectionMatrix*viewMatrix*modelPosition;
 vElevation=elevation;
}`;

const WATER_FRAG=`
uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;
varying float vElevation;
void main(){
 float mixStrength=(vElevation+uColorOffset)*uColorMultiplier;
 vec3 color=mix(uDepthColor,uSurfaceColor,mixStrength);
 gl_FragColor=vec4(color,0.92);
}`;

const FLY_VERT=`
uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;
attribute float aScale;
void main(){
 vec4 modelPosition=modelMatrix*vec4(position,1.0);
 modelPosition.y+=sin(uTime+modelPosition.x*100.0)*aScale*0.2;
 modelPosition.x+=sin(0.5*uTime+modelPosition.x*100.0)*aScale*0.2;
 modelPosition.z+=cos(0.5*uTime+modelPosition.z*100.0)*aScale*0.2;
 vec4 viewPosition=viewMatrix*modelPosition;
 gl_Position=projectionMatrix*viewPosition;
 gl_PointSize=uSize*aScale*uPixelRatio*(1.0/-viewPosition.z);
}`;

const FLY_FRAG=`
void main(){
 float distanceToCenter=distance(gl_PointCoord,vec2(0.5));
 float strength=0.05/distanceToCenter-0.1;
 gl_FragColor=vec4(1.0,0.95,0.72,strength);
}`;

function lantern(group,x,z,y0,shadows){
 const stone=new THREE.MeshStandardMaterial({color:0x8a8376,roughness:.92});
 const paper=new THREE.MeshStandardMaterial({color:0xe8c27a,roughness:.55,emissive:0x6a4a18,emissiveIntensity:.12});
 const cap=new THREE.MeshStandardMaterial({color:0x5c5348,roughness:.88});
 const base=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.16,8),stone);
 base.position.set(x,y0+.08,z);base.castShadow=!!shadows;group.add(base);
 const post=new THREE.Mesh(new THREE.BoxGeometry(.1,.55,.1),stone);
 post.position.set(x,y0+.4,z);post.castShadow=!!shadows;group.add(post);
 const house=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.28,8),paper);
 house.position.set(x,y0+.78,z);house.castShadow=!!shadows;group.add(house);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(.26,.14,8),cap);
 roof.position.set(x,y0+.98,z);group.add(roof);
}

export function buildEastGarden({parent,colliders=[],shadows=false,heightAt=null,register=()=>{},onAction=()=>{}}={}){
 const group=new THREE.Group();group.name='East lawn Japanese garden';parent.add(group);
 const {x,z,radius}=EAST_GARDEN;
 const y0=heightAt?heightAt(x,z):0;
 const rim=new THREE.Mesh(new THREE.TorusGeometry(radius,.11,8,24),new THREE.MeshStandardMaterial({color:0x7a7468,roughness:.9}));
 rim.rotation.x=Math.PI/2;rim.position.set(x,y0+.10,z);rim.castShadow=!!shadows;group.add(rim);
 const waterMat=new THREE.ShaderMaterial({
  vertexShader:WATER_VERT,fragmentShader:WATER_FRAG,transparent:true,
  uniforms:{
   uWavesAmplitude:{value:.035},
   uWavesFrequency:{value:new THREE.Vector2(3.2,2.4)},
   uTime:{value:0},
   uBigWavesSpeed:{value:.35},
   uSmallWavesElev:{value:.04},
   uSmallWavesFreq:{value:1.8},
   uSmallWavesSpeed:{value:.22},
   uSmallWavesIterations:{value:3},
   uMaxDepth:{value:.10},
   uDepthColor:{value:new THREE.Color(0x1a3a3c)},
   uSurfaceColor:{value:new THREE.Color(0x4a7a72)},
   uColorOffset:{value:.08},
   uColorMultiplier:{value:4.2},
  },
 });
 // Concentric rings give the wave shader interior vertices, rather than stretching
 // every ripple across a single triangle from the bank to the centre.
 const pond=new THREE.Mesh(new THREE.RingGeometry(0,radius-.08,28,8),waterMat);
 pond.name='east-garden-pond';pond.rotation.x=-Math.PI/2;pond.position.set(x,y0+.16,z);group.add(pond);
 colliders.push({id:EAST_GARDEN.id,x,z,w:radius*2+.15,d:radius*2+.15,height:.35});

 for(const [lx,lz] of EAST_GARDEN.lanterns){
  const ly=heightAt?heightAt(lx,lz):y0;
  lantern(group,lx,lz,ly,shadows);
  colliders.push({id:'east-garden-lantern',x:lx,z:lz,w:.42,d:.42,height:1.2});
 }

 const basinX=x-.95,basinZ=z+1.15,by=heightAt?heightAt(basinX,basinZ):y0;
 const basin=new THREE.Mesh(new THREE.CylinderGeometry(.28,.32,.22,10),new THREE.MeshStandardMaterial({color:0x6e6860,roughness:.94}));
 basin.position.set(basinX,by+.12,basinZ);basin.castShadow=!!shadows;group.add(basin);
 const waterDisk=new THREE.Mesh(new THREE.CircleGeometry(.2,12),new THREE.MeshStandardMaterial({color:0x3d5c58,roughness:.35,metalness:.08}));
 waterDisk.rotation.x=-Math.PI/2;waterDisk.position.set(basinX,by+.235,basinZ);group.add(waterDisk);
 colliders.push({id:'east-garden-basin',x:basinX,z:basinZ,w:.7,d:.7,height:.4});

 const flyCount=24,positions=new Float32Array(flyCount*3),scales=new Float32Array(flyCount);
 let seed=19880913;const rnd=()=>(seed=seed*1103515245+12345&0x7fffffff)/0x7fffffff;
 for(let i=0;i<flyCount;i++){
  positions[i*3]=x+(rnd()-.5)*5.2;
  positions[i*3+1]=y0+.35+rnd()*1.4;
  positions[i*3+2]=z+(rnd()-.5)*5.2;
  scales[i]=.4+rnd()*.9;
 }
 const flyGeo=new THREE.BufferGeometry();
 flyGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
 flyGeo.setAttribute('aScale',new THREE.BufferAttribute(scales,1));
 const flyMat=new THREE.ShaderMaterial({
  vertexShader:FLY_VERT,fragmentShader:FLY_FRAG,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{
   uPixelRatio:{value:typeof window==='undefined'?1:Math.min(window.devicePixelRatio||1,2)},
   uSize:{value:80},
   uTime:{value:0},
  },
 });
 const fireflies=new THREE.Points(flyGeo,flyMat);
 fireflies.name='east-garden-fireflies';fireflies.visible=false;group.add(fireflies);

 const look=new THREE.Object3D();look.name='east-garden-view';look.position.set(x-1.8,y0+1.2,z+.4);group.add(look);
 register(look,'Look into the garden pond',()=>onAction('inspect','Garden pond','A stone-rimmed basin on the east lawn. The water is still except where the wind catches it. Two stone lanterns keep the evening.'));

 const tick=(time,minutes=1002)=>{
  waterMat.uniforms.uTime.value=time;
  flyMat.uniforms.uTime.value=time;
  const h=((minutes%1440)+1440)%1440;
  fireflies.visible=h>=1110||h<360;
 };
 return {group,pond,fireflies,tick,EAST_GARDEN};
}
