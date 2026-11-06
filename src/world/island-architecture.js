import * as THREE from '../../vendor/three.module.js';
import {part,merge,sweep,seeded} from './vegetation-kit.js';

/**
 * Building pieces for the islands' small timber structures (kiosks, the beach bar, the lounge,
 * the honesty stand), modelled from what they are made of rather than as plain boxes: thatch
 * laid in courses with a ragged hem, bamboo with its nodes, corrugated iron that catches the
 * light in stripes, planked tops, striped canvas, and shelves that actually hold things.
 * Each returns one vertex-coloured geometry for the shared `islandBuildMaterial`.
 */
export const islandBuildMaterial=()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,side:THREE.DoubleSide});
const V=(x,y,z)=>new THREE.Vector3(x,y,z);

/** A hipped thatch roof: the body and two overlapping courses, each with a ragged hem. */
export function thatchRoof({w=6,d=5,height=2.2,overhang=.5,seed=1,straw=0xd2b06a,dark=0x9c7c44}={}){
 const rand=seeded(seed),parts=[],S=new THREE.Color(straw),D=new THREE.Color(dark);
 const body=new THREE.ConeGeometry(Math.SQRT1_2*(1),height,4,1,true).rotateY(Math.PI/4).scale(w+overhang*2,1,d+overhang*2).translate(0,height/2,0);
 parts.push(part(body,(p,n)=>D.clone().lerp(S,THREE.MathUtils.clamp(n.y*1.4,0,1))));
 // Two courses round the eaves: short sloped skirts, the lower edge cut ragged.
 for(const [k,drop] of [[0,.0],[1,.45]]){
  const pts=[],ww=(w+overhang*2)*(1-k*.18)/2+.08,dd=(d+overhang*2)*(1-k*.18)/2+.08,y0=drop+.55,y1=drop,steps=26;
  const edge=(t)=>{const per=2*(ww+dd)*2,s=t*per;const L=[[ww*2,[-ww,-dd],[1,0]],[dd*2,[ww,-dd],[0,1]],[ww*2,[ww,dd],[-1,0]],[dd*2,[-ww,dd],[0,-1]]];let a=s;for(const [len,[x,z],[dx,dz]] of L){if(a<=len)return [x+dx*a,z+dz*a];a-=len;}return [-ww,-dd];};
  for(let i=0;i<steps*4;i++){const t0=i/(steps*4),t1=(i+1)/(steps*4),[x0,z0]=edge(t0),[x1,z1]=edge(t1),h0=y1-rand()*.18,h1=y1-rand()*.18,ix0=x0*.86,iz0=z0*.86,ix1=x1*.86,iz1=z1*.86;
   pts.push([ix0,y0,iz0],[x0,h0,z0],[ix1,y0,iz1],[ix1,y0,iz1],[x0,h0,z0],[x1,h1,z1]);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts.flat(),3));
  parts.push(part(g,(p)=>S.clone().lerp(D,THREE.MathUtils.clamp((y0-p.y)/.7,0,1)*.8)));
 }
 return merge(parts);
}

/** A bamboo pole with its nodes, `h` tall. */
export function bambooPost(h=3,r=.07,{color=0xb59a5a,node=0x8a7440}={}){
 const n=Math.max(3,Math.round(h/.45));return sweep(new THREE.LineCurve3(V(0,0,0),V(0,h,0)),{segments:n*2,sides:7,radius:(t,k)=>r*(k%2?1:1.12),ring:k=>k%2?color:node});
}

/** A sheet of corrugated iron, `w` along the ridges' run, `d` down the slope, pitched by `pitch`. */
export function corrugatedRoof({w=6,d=3,pitch=.18,color=0x7f9fa0,rust=0x9b6b4a,seed=1}={}){
 const rand=seeded(seed),g=new THREE.PlaneGeometry(w,d,Math.round(w*7),2).rotateX(-Math.PI/2),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,.035*Math.sin(x*Math.PI*7/1)+(-z/d)*Math.tan(pitch)*d);}
 const C=new THREE.Color(color),R=new THREE.Color(rust);
 const geo=part(g,(q,n)=>C.clone().lerp(R,Math.max(0,Math.sin(q.x*.9+q.z*2.1+rand()*.1))*.25).multiplyScalar(.85+.2*Math.abs(n.x)));
 return geo;
}

/** A striped canvas awning sloping out from a wall, its front cut in scallops. */
export function stripedAwning({w=5.4,depth=1.3,drop=.5,stripes=[0xf4ecd8,0x2f8f9a],count=10}={}){
 const pts=[],cols=[];
 for(let i=0;i<count;i++){const x0=-w/2+i*w/count,x1=x0+w/count,c=stripes[i%stripes.length];
  pts.push([x0,0,0],[x0,-drop*.55,depth],[x1,0,0],[x1,0,0],[x0,-drop*.55,depth],[x1,-drop*.55,depth]);
  // The valance: a scallop hanging off the front edge.
  const xm=(x0+x1)/2;pts.push([x0,-drop*.55,depth],[xm,-drop,depth+.01],[x1,-drop*.55,depth]);for(let k=0;k<9;k++)cols.push(c);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts.flat(),3));
 return part(g,(p,n,i)=>new THREE.Color(cols[i]));
}

/** A planked top: `n` boards across `w`, each a shade different, with gaps between. */
export function planks({w=2.4,d=1,n=6,thick=.05,color=0xa98458,seed=1}={}){
 const rand=seeded(seed),parts=[],C=new THREE.Color(color);
 for(let i=0;i<n;i++){const bw=w/n-.012,x=-w/2+(i+.5)*w/n,c=C.clone().multiplyScalar(.88+rand()*.22);parts.push(part(new THREE.BoxGeometry(bw,thick,d).translate(x,0,0),c));}
 return merge(parts);
}

/** A shelf of goods: bottles, cans and jars in rows, in the colours of what they hold. */
export function shelfGoods({w=4,rows=2,rowGap=.42,palette=[0x3a7d3a,0x8a4a2a,0xe7e2d2,0x2f6fa0,0xd8a03a],seed=1,kind='bottles'}={}){
 const rand=seeded(seed),parts=[];
 for(let r=0;r<rows;r++){let x=-w/2+.08;while(x<w/2-.08){const c=palette[Math.floor(rand()*palette.length)],y=r*rowGap;
  if(kind==='bottles'&&rand()<.7){parts.push(part(new THREE.CylinderGeometry(.04,.045,.24,6).translate(x,y+.12,0),c));parts.push(part(new THREE.CylinderGeometry(.014,.03,.08,6).translate(x,y+.28,0),c));x+=.1;}
  else if(kind==='crafts'){const h=.14+rand()*.18;parts.push(part(new THREE.CylinderGeometry(.06+rand()*.05,.05,h,7).translate(x,y+h/2,0),c));x+=.18;}
  else{parts.push(part(new THREE.CylinderGeometry(.035,.035,.12,6).translate(x,y+.06,0),c));x+=.085;}}
  parts.push(part(new THREE.BoxGeometry(w,.03,.3).translate(0,r*rowGap-.015,0),0x8a6a46));}
 return merge(parts);
}
