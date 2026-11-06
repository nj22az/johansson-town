/** Add captured facial movement after the animator has posed the body. Never modifies the saved design. */
const bounded=(v,lo,hi,f=0)=>Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):f;
export function applyActorFrame(avatar,frame){
 if(!frame)return;const head=avatar.bones.head;if(head){head.rotation.x+=bounded(frame.head?.[0],-.6,.6);head.rotation.y+=bounded(frame.head?.[1],-.6,.6);head.rotation.z+=bounded(frame.head?.[2],-.6,.6);}
 avatar.paintFace({...avatar.faceState,expression:frame.expression||avatar.faceState.expression,expressionStrength:bounded(frame.strength,0,1,1),expressionBlend:1,talk:bounded(frame.talk,0,1),look:[bounded(frame.look?.[0],-1,1),bounded(frame.look?.[1],-1,1)],blinkLeft:bounded(frame.blinkL,0,1),blinkRight:bounded(frame.blinkR,0,1),actingBrow:bounded(frame.brow,-1,1),actingSmile:bounded(frame.smile,-1,1)});avatar.root.updateMatrixWorld(true);
}
