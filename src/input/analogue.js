const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:0));

// Radial dead zone preserves diagonals and slow walking without stick drift.
export function stickAxes(x=0,y=0,deadzone=.16){
 x=clamp(x,-1,1);y=clamp(y,-1,1);
 const length=Math.hypot(x,y),d=clamp(deadzone,0,.5);
 if(length<=d)return {x:0,y:0};
 const scale=(Math.min(length,1)-d)/(1-d)/length;
 return {x:x*scale,y:y*scale};
}

export function lookStep(yaw,pitch,x,y,dt,{sensitivity=1,invertY=false}={}){
 const step=clamp(dt,0,.1)*clamp(sensitivity,.3,2.5);
 return {yaw:yaw-x*2.1*step,pitch:clamp(pitch-y*1.55*step*(invertY?-1:1),-1.25,1.15)};
}

export function createGamepadInput(){
 let identity=null,previous=[],armed=false;
 const empty=()=>({connected:false,move:{x:0,y:0},look:{x:0,y:0},held:[],pressed:[],zoom:0});
 return {
  suspend(){armed=false;previous=[];},
  sample(pads=[],deadzone=.16){
   const available=Array.from(pads||[]).filter(p=>p?.connected&&p.mapping==='standard');
   const pad=available.find(p=>p.index+':'+p.id===identity)||available[0];
   if(!pad){identity=null;armed=false;previous=[];return empty();}
   const key=pad.index+':'+pad.id;
   if(key!==identity){identity=key;armed=false;previous=[];}
   const held=Array.from(pad.buttons||[],b=>!!b?.pressed||b?.value>.55);
   const move=stickAxes(pad.axes?.[0],pad.axes?.[1],deadzone),look=stickAxes(pad.axes?.[2],pad.axes?.[3],deadzone);
   // Connecting or returning to the tab with a held control cannot fire it.
   if(!armed){
    armed=!held.some(Boolean)&&!move.x&&!move.y&&!look.x&&!look.y;
    previous=held;return {...empty(),connected:true};
   }
   const pressed=held.map((value,i)=>value&&!previous[i]);previous=held;
   return {connected:true,move,look,held,pressed,zoom:clamp(pad.buttons?.[7]?.value||0,0,1)};
  }
 };
}

// Menus repeat directional movement, but confirmation remains edge-triggered.
export function createMenuRepeat(){
 let previous='',remaining=0;
 return (frame,dt)=>{
  const navigation=frame.navigation||frame.held;
  const direction=navigation[12]||frame.move.y<-.55?'up':navigation[13]||frame.move.y>.55?'down':navigation[14]||frame.move.x<-.55?'left':navigation[15]||frame.move.x>.55?'right':'';
  remaining-=dt;
  if(direction!==previous){previous=direction;remaining=.38;return direction;}
  if(direction&&remaining<=0){remaining=.13;return direction;}
  return '';
 };
}
