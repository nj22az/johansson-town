import * as THREE from '../../vendor/three.module.js';

/**
 * The studio's sets, film and wardrobe: what turns "a screenshot of the town" into a
 * photo shoot. A backdrop is a sweep -- a dome and a floor in one colour scheme -- in a
 * little scene of its own with soft studio light, so nothing of the town leaks in. Film
 * is a colour matrix (the same one CSS filters are defined by), shown live on the
 * preview and baked into the captured pixels, so every browser saves what it showed.
 */
export const BACKDROPS=Object.freeze({
 town:{label:'Right here'},
 cream:{label:'Cream studio',top:'#fff8e7',bottom:'#efe2c4',floor:'#e9dcbd'},
 sky:{label:'Blue sky',top:'#7cc4f0',bottom:'#e4f4ff',floor:'#d8ecf6'},
 mint:{label:'Mint',top:'#9fe0c8',bottom:'#e8fbf3',floor:'#cdeedd'},
 peach:{label:'Peach',top:'#ffb8a0',bottom:'#fff0e4',floor:'#f6dccc'},
 sunset:{label:'Sunset',top:'#4a3a78',middle:'#f07a5a',bottom:'#ffd27a',floor:'#e8b07a'},
 night:{label:'Starry night',top:'#0f1838',bottom:'#2c3c78',floor:'#22284a',stars:true},
 hearts:{label:'Hearts',top:'#ffd0e0',bottom:'#fff3f7',floor:'#f8dbe6',print:'heart'},
 polka:{label:'Polka dots',top:'#ffe46e',bottom:'#fff6c4',floor:'#f6e7a8',print:'dot'},
});

export const FILMS=Object.freeze({
 none:{label:'Natural',ops:[]},
 warm:{label:'Warm',ops:[['sepia',.22],['saturate',1.15],['brightness',1.04]]},
 vivid:{label:'Vivid',ops:[['saturate',1.45],['contrast',1.08]]},
 film:{label:'Old film',ops:[['sepia',.18],['saturate',.82],['contrast',.9],['brightness',1.06]]},
 mono:{label:'Black & white',ops:[['grayscale',1],['contrast',1.12]]},
 sepia:{label:'Sepia',ops:[['sepia',.9],['contrast',.95]]},
 // Not a colour matrix: chunky pixels and an ordered dither in four shades (pocket-camera.js), shown live and baked the same.
 // The town's fictional hand-helds (pocket-models.js): the Pocket Gentleman's green and grey, the Pocket Lady's rose.
 pocket:{label:'Pocket Gentleman',ops:[],pocket:'green'},
 pocketGrey:{label:'Pocket Gentleman, grey',ops:[],pocket:'grey'},
 pocketLady:{label:'Pocket Lady',ops:[],pocket:'rose'},
});

/** A friendly palette for clothes, like the maker's colour board. */
export const WARDROBE_COLOURS=Object.freeze(['#f4f1ea','#2b2b2b','#d8342c','#e8734a','#f4c83c','#7fbf5a','#3f8f8a','#7fb0d8','#2f5fa8','#1f2a48','#9a6ac8','#f2a0bc','#8a5a3a','#c8b48a']);

export const filmCSS=name=>{const ops=FILMS[name]?.ops||[];return ops.length?ops.map(([op,v])=>`${op}(${v})`).join(' '):'none';};

// The Filter Effects spec's matrices, as 4x5 rows over r,g,b,a,1.
function matrixFor([op,v]){
 if(op==='grayscale'||op==='sepia'||op==='saturate'){
  if(op==='saturate'){const s=v;return [[.213+.787*s,.715-.715*s,.072-.072*s],[.213-.213*s,.715+.285*s,.072-.072*s],[.213-.213*s,.715-.715*s,.072+.928*s]].map(r=>[...r,0,0]);}
  const a=1-v;
  if(op==='grayscale')return [[.2126+.7874*a,.7152-.7152*a,.0722-.0722*a],[.2126-.2126*a,.7152+.2848*a,.0722-.0722*a],[.2126-.2126*a,.7152-.7152*a,.0722+.9278*a]].map(r=>[...r,0,0]);
  return [[.393+.607*a,.769-.769*a,.189-.189*a],[.349-.349*a,.686+.314*a,.168-.168*a],[.272-.272*a,.534-.534*a,.131+.869*a]].map(r=>[...r,0,0]);
 }
 if(op==='brightness')return [[v,0,0,0,0],[0,v,0,0,0],[0,0,v,0,0]];
 if(op==='contrast'){const o=.5-.5*v;return [[v,0,0,0,o],[0,v,0,0,o],[0,0,v,0,o]];}
 return [[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0]];
}
/** Bakes a film into an RGBA pixel array in place, applying each step in order as CSS does. */
export function applyFilm(data,name){
 const ops=FILMS[name]?.ops||[];if(!ops.length)return data;
 const steps=ops.map(matrixFor),c=[0,0,0];
 for(let i=0;i<data.length;i+=4){
  let r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
  for(const m of steps){for(let k=0;k<3;k++)c[k]=Math.min(1,Math.max(0,m[k][0]*r+m[k][1]*g+m[k][2]*b+m[k][4]));[r,g,b]=c;}
  data[i]=r*255+.5;data[i+1]=g*255+.5;data[i+2]=b*255+.5;
 }
 return data;
}

function backdropTexture(spec){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');
 const grad=ctx.createLinearGradient(0,0,0,512);grad.addColorStop(0,spec.top);if(spec.middle)grad.addColorStop(.55,spec.middle);grad.addColorStop(.92,spec.bottom);grad.addColorStop(1,spec.bottom);
 ctx.fillStyle=grad;ctx.fillRect(0,0,512,512);
 if(spec.stars){ctx.fillStyle='#fff8d8';for(let i=0;i<180;i++){const x=(i*97.3)%512,y=(i*53.7)%300,r=.6+(i%5===0?1.2:0);ctx.globalAlpha=.5+(i%3)*.2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
 if(spec.print){
  ctx.fillStyle='#ffffff';ctx.globalAlpha=.55;
  for(let row=0;row<9;row++)for(let col=0;col<12;col++){
   const x=(col+(row%2)*.5)*512/12,y=60+row*44;
   ctx.save();ctx.translate(x,y);
   if(spec.print==='heart'){ctx.scale(.9,.9);ctx.beginPath();ctx.moveTo(0,6);ctx.bezierCurveTo(-14,-4,-6,-14,0,-6);ctx.bezierCurveTo(6,-14,14,-4,0,6);ctx.fill();}
   else{ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();}
   ctx.restore();
  }
  ctx.globalAlpha=1;
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

/** A sweep set for the studio: its own scene, lit softly, with the cast group added in. */
export function createStudioSet(){
 const scene=new THREE.Scene();scene.name='Photo studio set';
 scene.add(new THREE.HemisphereLight(0xffffff,0xb8ac98,1.9));
 const key=new THREE.DirectionalLight(0xfff4e0,1.5);key.position.set(2.5,5,4);scene.add(key);
 const fill=new THREE.DirectionalLight(0xe0ecff,.55);fill.position.set(-4,3,2);scene.add(fill);
 const dome=new THREE.Mesh(new THREE.SphereGeometry(15,48,24,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshBasicMaterial({side:THREE.BackSide,fog:false}));
 const floor=new THREE.Mesh(new THREE.CircleGeometry(15,64),new THREE.MeshStandardMaterial({roughness:1,metalness:0}));floor.rotation.x=-Math.PI/2;floor.position.y=-.002;
 // The floor curves up into the dome as a cyclorama does: a soft band hides the join.
 dome.position.y=-.5;scene.add(dome,floor);
 let current='town';
 return {
  scene,key,
  get backdrop(){return current;},
  /** Shows a backdrop; 'town' means the studio draws the town instead and this set is unused. */
  set(name){
   const spec=BACKDROPS[name];if(!spec||name==='town'){current='town';return false;}
   current=name;dome.material.map?.dispose();dome.material.map=backdropTexture(spec);dome.material.needsUpdate=true;
   floor.material.color.set(spec.floor);scene.background=new THREE.Color(spec.top);return true;
  },
  /** Moves the set to stand where the cast does. */
  place(group){dome.position.x=floor.position.x=group.position.x;dome.position.z=floor.position.z=group.position.z;floor.position.y=group.position.y-.002;dome.position.y=group.position.y-.5;},
  dispose(){dome.material.map?.dispose();dome.geometry.dispose();dome.material.dispose();floor.geometry.dispose();floor.material.dispose();},
 };
}

/** Where a cast of n stands for each arrangement, in the stage's own frame: [x,z,turn°]. */
export function arrange(kind,n){
 if(kind==='huddle'){const spread=Math.min(140,30*n);return Array.from({length:n},(_,i)=>{const a=n<2?0:(-spread/2+spread*i/(n-1))*Math.PI/180;return [Math.sin(a)*1.1,-Math.cos(a)*1.1+1.1-.2,-a*180/Math.PI*.6];});}
 if(kind==='rows'){const front=Math.ceil(n/2);return Array.from({length:n},(_,i)=>{const row=i<front?0:1,k=row?i-front:i,count=row?n-front:front;return [(k-(count-1)/2)*.85,row?-.75:0,0];});}
 return Array.from({length:n},(_,i)=>[(i-(n-1)/2)*.8,0,0]);
}
