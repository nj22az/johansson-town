/** Original console-avatar silhouettes, shared by the face, hair and accessories. */
import {RUGGED_HEAD} from './sculpts/rugged-head.js';
import {GENTLE_HEAD} from './sculpts/gentle-head.js';
export const HEAD_FORMS=Object.freeze(['oval','round','square','narrow','heart','soft-square','oblong','diamond','pear','wide','soft-round','teardrop','egg','acorn','bell','pentagon','box','block','sculpted',
 // Appended (no saved id moves): a strong head, broad and square-jawed with rounded corners, between 'square' (a ball
 // with a jaw) and 'block' (a box). First worn by Johansson (26 November 2026).
 'strong',
 // A head sculpted in Blender (tools/blender/build-johansson-head.py) and measured through every degree: taller and
 // blockier, flat temples, a wide jaw and a squared chin, a brow ridge over recessed sockets, a nose with a bridge.
 // Its shape is the sculpt's alone: the shape, jaw and cheek sliders do not move it.
 'rugged',
 // Thuan's (tools/blender/build-thuan-head.py): her own approved silhouette (the 'diamond' with her sliders) with a small
 // sculpted nose, cheeks, lips and a chin.
 'gentle']);
/** A sculpted head's radius table, decoded once. */
const SCULPTS={rugged:RUGGED_HEAD,gentle:GENTLE_HEAD},decoded=new Map();
function sculptOf(form){
 const S=SCULPTS[form];if(!S)return null;
 if(!decoded.has(form)){const raw=atob(S.data),n=raw.length/2,r=new Float32Array(n),k=(S.max-S.min)/65535;
  for(let i=0;i<n;i++)r[i]=S.min+k*(raw.charCodeAt(i*2)|raw.charCodeAt(i*2+1)<<8);decoded.set(form,Object.freeze({na:S.na,nt:S.nt,r,width:S.width,height:S.height}));}
 return decoded.get(form);
}
/** The sculpt's radius along a unit direction: between the four measured directions round it. */
function sculptRadius(S,x,y,z){
 const a=(Math.atan2(x,z)/Math.PI+1)*.5*(S.na-1),t=Math.acos(Math.max(-1,Math.min(1,y)))/Math.PI*(S.nt-1);
 const ia=Math.min(S.na-2,Math.floor(a)),it=Math.min(S.nt-2,Math.floor(t)),fa=a-ia,ft=t-it,R=S.r,o=it*S.na+ia;
 return (R[o]*(1-fa)+R[o+1]*fa)*(1-ft)+(R[o+S.na]*(1-fa)+R[o+S.na+1]*fa)*ft;
}
const FORMS={sculpted:[1,1.055,.08,.06,.015,0],oval:[.94,1.08,.22],round:[1.03,1.01,.1],square:[1.03,1.02,-.16],narrow:[.84,1.16,.25],heart:[1.01,1.07,.37], 'soft-square':[1.01,1.04,-.07,.02],oblong:[.90,1.17,.08,-.02],diamond:[.95,1.10,.36,.11],pear:[.97,1.04,-.18,.07],wide:[1.13,.96,.10,.01],'soft-round':[1.06,1.03,.20,.08],teardrop:[.92,1.10,.35,-.03],
 // The creator (2026-10-14: "I want different head shapes too"): the crown and the corners as well as the jaw.
 // [width, height, taper, cheek, crown (+ pointed, - flat), corners (0 round … 1 boxy)]
 egg:[.95,1.1,.04,0,.24,0],acorn:[1,1.06,-.1,.05,.28,0],bell:[1.03,1,-.22,.12,-.16,0],
 pentagon:[1,1.06,.32,0,-.05,.5],box:[.92,1.15,0,0,-.1,.6],block:[1.06,1,-.12,0,-.15,.55],strong:[1.03,1.03,-.12,0,-.06,.28]};
export function headProfile(head){
 const sculpt=sculptOf(head.form);
 if(sculpt)return {width:sculpt.width,height:sculpt.height,taper:0,cheek:0,crown:0,corners:0,sculpt};
 const [width,height,taper,cheek=0,crown=0,corners=0]=FORMS[head.form]||FORMS.oval;
 const profile={width:width+(head.shape-.5)*.12,height:height-(head.shape-.5)*.1,
  taper:taper+(head.jaw-.5)*-.22,cheek:cheek+(head.cheeks-.5)*.13,crown,corners};
 const t=Math.min(1,Math.max(0,head.roundness||0));
 for(const [key,value] of Object.entries({width:1.06,height:1.01,taper:.10,cheek:.08,crown:0,corners:0}))profile[key]+=(value-profile[key])*t;
 return profile;
}
/** Deform a unit head without moving its poles or changing its texture coordinates. */
export function shapeHeadPoint(point,profile){
 if(profile.sculpt){const l=Math.hypot(point.x,point.y,point.z)||1,s=sculptRadius(profile.sculpt,point.x/l,point.y/l,point.z/l);point.x*=s;point.y*=s;point.z*=s;return point;}
 // Corners: the front silhouette pulled toward a rounded square (a superellipse), the poles where they were.
 if(profile.corners){const p=2+profile.corners*6,ax=Math.abs(point.x),ay=Math.abs(point.y),l=Math.hypot(ax,ay);
  if(l>1e-6){const f=1+(l/Math.pow(ax**p+ay**p,1/p)-1)*profile.corners;point.x*=f;point.y*=f;}}
 // Crown: the top narrowed to a point (an egg, an acorn) or let out flat (a bell, a box).
 if(profile.crown){const up=Math.max(0,Math.min(1,(point.y-.05)/.9)),k=1-profile.crown*up*up;point.x*=k;point.z*=1-(1-k)*.6;}
 const y=point.y,lower=Math.max(0,Math.min(1,(-y-.12)/.78));
 const cheek=Math.exp(-(((y+.16)/.32)**2))*profile.cheek;
 point.x*=1-profile.taper*lower+cheek;
 // A slightly flatter facial plane gives eyes and mouths a readable surface.
 if(point.z>0)point.z*=1-.08*Math.max(0,1-Math.abs(y)*1.4);
 return point;
}
