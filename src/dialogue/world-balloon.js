import * as THREE from '../../vendor/three.module.js';
import {layoutBalloon,balloonTail} from './balloon-layout.js';

/** A projected head and body capsule: cheap enough to follow animated actors every frame. */
export function projectBalloonPerson(camera,rect,head,feet,radius=.34){
 const project=p=>{const q=p.clone().project(camera);return {x:rect.left+(q.x+1)*rect.width/2,y:rect.top+(1-q.y)*rect.height/2,z:q.z};};
 const anchor=project(head);if(anchor.z< -1||anchor.z>1||!Number.isFinite(anchor.x+anchor.y))return null;
 const across=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
 const edge=project(head.clone().addScaledVector(across,radius)),cap=project(head.clone().addScaledVector(up,radius));
 const rx=Math.max(12,Math.abs(edge.x-anchor.x)+8),ry=Math.max(12,Math.abs(cap.y-anchor.y)+8);
 const foot=project(feet||head.clone().add(new THREE.Vector3(0,-1.2,0)));
 const face={left:anchor.x-rx,top:anchor.y-ry,width:rx*2,height:ry*2,weight:80};
 const body={left:Math.min(face.left,foot.x-rx*.65),top:face.top,width:Math.max(face.left+face.width,foot.x+rx*.65)-Math.min(face.left,foot.x-rx*.65),height:Math.max(face.height,foot.y-face.top),weight:2};
 return {anchor,face,body};
}

export function balloonViewport(canvasRect,{bottom=Infinity,top=-Infinity,element}={}){
 const view=globalThis.visualViewport,style=globalThis.getComputedStyle?.(element||document.documentElement);
 const safe=side=>Math.max(12,Number.parseFloat(style?.getPropertyValue?.('--balloon-safe-'+side))||0);
 const left=Math.max(canvasRect.left,view?.offsetLeft||0)+safe('left'),upper=Math.max(canvasRect.top,view?.offsetTop||0,top)+safe('top');
 const right=Math.min(canvasRect.left+canvasRect.width,(view?.offsetLeft||0)+(view?.width||globalThis.innerWidth||canvasRect.width))-safe('right');
 const lower=Math.min(canvasRect.top+canvasRect.height,(view?.offsetTop||0)+(view?.height||globalThis.innerHeight||canvasRect.height),bottom)-safe('bottom');
 return {left,top:upper,width:Math.max(80,right-left),height:Math.max(60,lower-upper)};
}

/** Shared DOM adapter; sizes are cached for a line, while placement follows its speaker. */
export function createBalloonPresenter(element,{ambient=false}={}){
 let identity='',sizes=[],previous=null;
 const set=(key,value)=>element.style?.setProperty?.('--balloon-'+key,typeof value==='number'?value.toFixed(1)+'px':value);
 return {
  reset(){identity='';previous=null;delete element.dataset.balloonSide;},
  place({person,obstacles=[],viewport,key='',text='',line=element,dt=0,reduced=false}){
   if(!person||!element.getBoundingClientRect)return null;
   const style=globalThis.getComputedStyle?.(line),token=[key,text,Math.round(viewport.width),Math.round(viewport.height),style?.font,document.fonts?.status].join('|');
   if(identity!==token){
    identity=token;previous=null;
    const phone=viewport.width<520,max=Math.min(viewport.width,ambient?280:phone?248:360),min=Math.min(max,ambient?148:phone?164:216);
    const widths=[max,Math.max(min,max-56),min].map(Math.round).filter((w,i,a)=>a.indexOf(w)===i);
    // A long phone line may use the clear space above the pair if no side column fits.
    if(phone&&!ambient&&viewport.width>max+24)widths.push(Math.floor(viewport.width));
    sizes=widths.map(width=>{set('width',width);set('height','auto');return {width,height:Math.ceil(element.offsetHeight||line.offsetHeight||80),fallback:width>max};});
   }
   const result=layoutBalloon({viewport,anchor:person.anchor,face:person.face,obstacles:[person.face,person.body,...obstacles],sizes,previous});
   if(previous&&previous.side===result.side&&previous.width===result.width&&!reduced&&dt>0){
    const k=1-Math.exp(-Math.min(.1,dt)*16),next={...result,left:previous.left+(result.left-previous.left)*k,top:previous.top+(result.top-previous.top)*k};
    // Ease within a clear region, never slide across a character to reach another side.
    const safe=[person.face,...obstacles.filter(o=>(o.weight||0)>10)].every(o=>next.left+next.width<=o.left||next.left>=o.left+o.width||next.top+next.height<=o.top||next.top>=o.top+o.height);
    if(safe){result.left=next.left;result.top=next.top;}
   }
   set('width',result.width);set('height',result.overflow?result.height:'auto');set('x',result.left);set('y',result.top);
   const tail=balloonTail(result,person.anchor);set('tail-x',tail.x);set('tail-y',tail.y);
   element.dataset.balloonSide=result.side;element.dataset.balloonTail=tail.edge;element.dataset.balloonOverflow=String(!!result.overflow);
   previous=result;return result;
  }
 };
}
