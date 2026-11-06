/** Metres and millilitres. The physical interior determines capacity, not a UI label. */
export const VESSEL_SEGMENTS=48;
const polygonAreaFactor=VESSEL_SEGMENTS*Math.sin(2*Math.PI/VESSEL_SEGMENTS)/2;

export function outerRadiusAtY(profile,y){
 const t=Math.max(0,Math.min(1,(y-.003)/(profile.height-.003)));
 return profile.outerRadiusBottom+(profile.outerRadiusTop-profile.outerRadiusBottom)*t;
}
export function innerRadiusAtY(profile,y){
 const t=Math.max(0,Math.min(1,(y-profile.interiorBottom)/(profile.interiorTop-profile.interiorBottom)));
 return profile.innerRadiusBottom+(profile.innerRadiusTop-profile.innerRadiusBottom)*t;
}
function profile(spec){
 const p={...spec,segments:VESSEL_SEGMENTS};
 // A 0.25 mm air gap separates the liquid and optical glass shells.
 p.interiorBottom=p.baseThickness+.00025;
 p.interiorTop=p.height-.0008;
 p.innerRadiusBottom=outerRadiusAtY(p,p.interiorBottom)-p.wallThickness-.00025;
 p.innerRadiusTop=p.outerRadiusTop-p.wallThickness-.00025;
 const a=p.innerRadiusBottom,b=p.innerRadiusTop;
 p.capacityMl=polygonAreaFactor*(p.interiorTop-p.interiorBottom)*(a*a+a*b+b*b)/3*1e6;
 p.rimContact=Object.freeze([-(p.outerRadiusTop-p.wallThickness/2),p.height,0]);
 p.liquidRimContact=Object.freeze([-p.innerRadiusTop,p.interiorTop,0]);
 p.gripHeightOffset=p.gripHeight;
 const azimuth=1.05,gx=-.060,gz=outerRadiusAtY(p,p.gripHeight)+.014,c=Math.cos(azimuth),s=Math.sin(azimuth);
 p.grip=Object.freeze({
  position:Object.freeze([gx*c+gz*s,p.gripHeight,-gx*s+gz*c]),
  quaternion:Object.freeze([0,Math.sin(azimuth/2),0,Math.cos(azimuth/2)]),
  azimuth,handFramePosition:Object.freeze([gx,p.gripHeight,gz]),
  fingerLengths:Object.freeze([[.034,.025,.018],[.037,.027,.019],[.034,.025,.018],[.028,.021,.016]]),
  thumbLengths:Object.freeze([.035,.030]),
  fingerPose:'external tangent wrap',fingerClearance:.0006,
 });
 p.foamHeight=p.hasFoam?.006:0;
 p.garnish=null;
 return Object.freeze(p);
}

/** All profiles use the same sober timeline. Only vessel geometry, grip and flow differ. */
export const DRINK_PROFILES=Object.freeze({
 beer:profile({id:'beer',name:'Beer',vesselType:'beer glass',height:.155,outerRadiusBottom:.032,outerRadiusTop:.040,wallThickness:.0022,baseThickness:.010,
  startingVolumeMl:400,sipAmountMl:42,gripHeight:.074,liquidColor:0xa45d08,liquidOpacity:.87,hasFoam:true,hasIce:false,barColor:'#c68c35'}),
 whiskey:profile({id:'whiskey',name:'Whiskey',vesselType:'tumbler',height:.092,outerRadiusBottom:.040,outerRadiusTop:.043,wallThickness:.0032,baseThickness:.016,
  startingVolumeMl:60,sipAmountMl:12,gripHeight:.046,liquidColor:0x8a3707,liquidOpacity:.84,hasFoam:false,hasIce:false,barColor:'#ab662e'}),
 gintonic:profile({id:'gintonic',name:'Gin and tonic',vesselType:'highball',height:.165,outerRadiusBottom:.0305,outerRadiusTop:.0315,wallThickness:.0022,baseThickness:.011,
  startingVolumeMl:260,sipAmountMl:35,gripHeight:.078,liquidColor:0xc5e5df,liquidOpacity:.42,hasFoam:false,hasIce:true,barColor:'#77a49b'}),
});

export const DRINK_IDS=Object.freeze(Object.keys(DRINK_PROFILES));
