/** Original console-avatar silhouettes, shared by the face, hair and accessories. */
export const HEAD_FORMS=Object.freeze(['oval','round','square','narrow','heart','soft-square','oblong','diamond','pear','wide','soft-round','teardrop','egg','acorn','bell','pentagon','box','block','sculpted']);
const FORMS={sculpted:[1,1.055,.08,.06,.015,0],oval:[.94,1.08,.22],round:[1.03,1.01,.1],square:[1.03,1.02,-.16],narrow:[.84,1.16,.25],heart:[1.01,1.07,.37], 'soft-square':[1.01,1.04,-.07,.02],oblong:[.90,1.17,.08,-.02],diamond:[.95,1.10,.36,.11],pear:[.97,1.04,-.18,.07],wide:[1.13,.96,.10,.01],'soft-round':[1.06,1.03,.20,.08],teardrop:[.92,1.10,.35,-.03],
 // The creator (2026-10-14: "I want different head shapes too"): the crown and the corners as well as the jaw.
 // [width, height, taper, cheek, crown (+ pointed, - flat), corners (0 round … 1 boxy)]
 egg:[.95,1.1,.04,0,.24,0],acorn:[1,1.06,-.1,.05,.28,0],bell:[1.03,1,-.22,.12,-.16,0],
 pentagon:[1,1.06,.32,0,-.05,.5],box:[.92,1.15,0,0,-.1,.6],block:[1.06,1,-.12,0,-.15,.55]};
export function headProfile(head){
 const [width,height,taper,cheek=0,crown=0,corners=0]=FORMS[head.form]||FORMS.oval;
 const profile={width:width+(head.shape-.5)*.12,height:height-(head.shape-.5)*.1,
  taper:taper+(head.jaw-.5)*-.22,cheek:cheek+(head.cheeks-.5)*.13,crown,corners};
 const t=Math.min(1,Math.max(0,head.roundness||0));
 for(const [key,value] of Object.entries({width:1.06,height:1.01,taper:.10,cheek:.08,crown:0,corners:0}))profile[key]+=(value-profile[key])*t;
 return profile;
}
/** Deform a unit head without moving its poles or changing its texture coordinates. */
export function shapeHeadPoint(point,profile){
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
