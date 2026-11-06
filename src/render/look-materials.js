import {gradientMap} from './cel.js';
function pencilMaterial(m){
 if(m.userData.illustrationPencil)return m.userData.illustrationPencil;
 const enabled={value:0},compile=m.onBeforeCompile,key=m.customProgramCacheKey.bind(m);Object.defineProperty(m.userData,'illustrationPencil',{value:enabled,enumerable:false,configurable:true});
 m.onBeforeCompile=function(shader,renderer){compile.call(this,shader,renderer);shader.uniforms.uIllustrationPencil=enabled;
  shader.vertexShader='varying vec3 inkRest;varying vec3 inkRestNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ninkRest=position;inkRestNormal=normal;');
  shader.fragmentShader=`uniform float uIllustrationPencil;varying vec3 inkRest;varying vec3 inkRestNormal;
float pencilHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float pencilNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(pencilHash(i),pencilHash(i+vec2(1,0)),f.x),mix(pencilHash(i+vec2(0,1)),pencilHash(i+vec2(1)),f.x),f.y);}
float pencilCell(vec2 p){vec2 i=floor(p),f=fract(p);float d=2.0;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 seed=vec2(pencilHash(i+o),pencilHash(i+o+19.0));d=min(d,length(o+seed-f));}return d;}
float restStroke(vec2 p,vec2 direction){
 p+=(vec2(pencilNoise(p*5.0),pencilNoise(p*5.0+17.0))-.5)*.022;
 float across=dot(p,direction)*28.0,lane=floor(across),along=dot(p,vec2(-direction.y,direction.x))*5.0+pencilHash(vec2(lane,7));
 float phase=fract(along),run=smoothstep(.03,.15,phase)*(1.0-smoothstep(.64,.93,phase));
 float line=1.0-smoothstep(.055,.15,abs(fract(across)-.5));
 return line*run*(.65+.35*pencilHash(vec2(lane,floor(along))));
}
float pencilPlane(vec2 p,float light){if(light>.75)return 0.0;float wax=mix(.18,1.0,smoothstep(.08,.48,pencilCell(p*650.0)));return wax*max(restStroke(p,vec2(.7071,.7071))*(1.0-smoothstep(.69,.75,light)),restStroke(p,vec2(.5,-.866))*(1.0-smoothstep(.37,.45,light)));}
`+shader.fragmentShader.replace('#include <opaque_fragment>',`if(uIllustrationPencil>.5){vec3 weights=pow(abs(normalize(inkRestNormal)),vec3(4.0));weights/=max(.0001,weights.x+weights.y+weights.z);float light=dot(outgoingLight,vec3(.2126,.7152,.0722));float stroke=dot(weights,vec3(pencilPlane(inkRest.yz,light),pencilPlane(inkRest.xz,light),pencilPlane(inkRest.xy,light)));outgoingLight*=1.0-.32*stroke;}
#include <opaque_fragment>`);
 };
 m.customProgramCacheKey=()=>key()+':stable-pencil-v2';m.needsUpdate=true;return enabled;
}
/** Look material treatment BEFORE filtering. Rest coordinates stay attached to moving/skinned geometry. */
export function withLookMaterials(scene,name,draw){
 if(!['flat','crayon','sketchbook'].includes(name)||typeof scene?.traverse!=='function')return draw();
 const materials=new Set(),restore=[];
 scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.isMeshToonMaterial)materials.add(m);});
 for(const m of materials){if(name==='flat'){const before=m.gradientMap;m.gradientMap=gradientMap(2);restore.push(()=>m.gradientMap=before);const f=m.userData.flatten;if(f){const value=f.value;f.value=0;restore.push(()=>f.value=value);}}else{const u=pencilMaterial(m),before=u.value;u.value=1;restore.push(()=>u.value=before);}}
 try{return draw();}finally{for(const f of restore)f();}
}
export function drawWithLookMaterials(renderer,name,draw){if(!['flat','crayon','sketchbook'].includes(name))return draw(renderer);const render=renderer.render;
 renderer.render=function(scene,camera){return withLookMaterials(scene,name,()=>render.call(renderer,scene,camera));};
 try{return draw(renderer);}finally{renderer.render=render;}
}
