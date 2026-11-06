export class Element {
  constructor(){this.children=[];this.style={};this.listeners={};this.dataset={};this.hidden=false;this.value='';const classes=new Set(['hidden']);this.classList={add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)};}
  append(...items){this.children.push(...items);}appendChild(e){this.append(e);}replaceChildren(...items){this.children=[...items];}focus(){document.activeElement=this;}setAttribute(){}removeAttribute(){}querySelectorAll(){return this.children;}
  querySelector(selector){this.selectors??=new Map();if(!this.selectors.has(selector))this.selectors.set(selector,new Element());return this.selectors.get(selector);}
  getBoundingClientRect(){return {left:0,top:0,width:112,height:112};}
  setPointerCapture(id){this.capture=id;}hasPointerCapture(id){return this.capture===id;}releasePointerCapture(){this.capture=null;}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}removeEventListener(){}
  get firstChild(){return this.children[0];}get lastChild(){return this.children.at(-1);}
  getContext(){
    // Gradients have to hand back an object with addColorStop: the catch-all below
    // returns undefined, and drawing code chains straight off the result.
    const gradient=()=>({addColorStop(){}});
    return new Proxy({fillRect(){},strokeRect(){},fillText(){},measureText:s=>({width:s.length*17}),
      createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),
      createLinearGradient:gradient,createRadialGradient:gradient,createConicGradient:gradient,
      createPattern:()=>({setTransform(){}})},{get:(o,k)=>o[k]||(()=>{})});
  }
}
export function installDOM(saved={}){
 // Three.js file loading uses the browser progress event, which Node does not provide.
 globalThis.ProgressEvent??=class ProgressEvent extends Event{constructor(type,init={}){super(type);Object.assign(this,{lengthComputable:false,loaded:0,total:0},init);}};
 const elements=new Map(),storage=new Map(Object.entries(saved));
 globalThis.document={createElement:()=>new Element(),createElementNS:()=>new Element(),querySelector:s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s);},addEventListener(){},exitPointerLock(){},activeElement:new Element(),documentElement:new Element(),body:new Element()};
 globalThis.window={};globalThis.location={href:'https://nj22az.github.io/johansson-town/'};
 globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 globalThis.innerWidth=1024;(globalThis.navigator??={}).vibrate=()=>{};
 const actions=()=>document.querySelector('#activityActions').children;
 return {elements,storage,
  /** Every button label currently offered by the modal. */
  labels(){return actions().map(x=>x.textContent);},
  has(label){return actions().some(x=>x.textContent===label);},
  button(label){const b=actions().find(x=>x.textContent===label);if(!b)throw Error('Missing action: '+label+' in '+JSON.stringify(actions().map(x=>x.textContent)));b.onclick();}};
}

// Mixamo-style joint names the older tests use, and the same joints on MakeHuman (MPFB) rigs.
const MAKEHUMAN={Hips:'root',Head:'head',Neck:'neck01',LeftHand:'wristL',RightHand:'wristR',LeftFoot:'footL',RightFoot:'footR',LeftToeBase:'toe1-1L',RightToeBase:'toe1-1R',LeftArm:'upperarm01L',RightArm:'upperarm01R',LeftForeArm:'lowerarm01L',RightForeArm:'lowerarm01R',LeftUpLeg:'upperleg01L',RightUpLeg:'upperleg01R',LeftLeg:'lowerleg01L',RightLeg:'lowerleg01R'};
export function rigBone(model,name){return model.getObjectByName(name)||(MAKEHUMAN[name]?model.getObjectByName(MAKEHUMAN[name]):undefined);}
