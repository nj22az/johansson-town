/**
 * Conditional engineering screening of Minato Maru's actual game hull.
 * All lengths are metres; masses/densities are tonnes and tonnes/m³.
 * Shipyard axes: x to port, y above baseline, z forward from the transom.
 * This is NOT approved stability information, a scantling calculation or
 * evidence that a stated lightship mass/centre of gravity is correct.
 *
 * Geometry provenance: ferry-model.js at
 * e87c06b16734d882626be7fe6cdd2ab153d649c4, functions sheer, deckEdge,
 * halfBreadth, keelY, fullness, narrowing, sectionPoint (lines 126–145).
 * Dimensions come from ferry-ship.js at that commit. The analytic inverse
 * below is algebraically equivalent to sectionPoint, without a Three import.
 * Positions/shape offsets scale with LOA/depth if a different hull is supplied;
 * such scaling represents a new conceptual form, not a surveyed hull.
 */
export const FERRY_HULL_SOURCE=Object.freeze({
 length:34.5,lengthBP:31,beam:8.4,depth:3,carDeck:3,
 originalDraft:1.9,originalDisplacement:283,assumedLightship:210,
 originalBlockCoefficient:.56,originalGM:1.6,
 sourceCommit:'e87c06b16734d882626be7fe6cdd2ab153d649c4',
 evidence:'Exact analytic game hull; mass, KG, watertight subdivision and structure unverified',
});

const finite=(v,label)=>{if(!Number.isFinite(v))throw new TypeError(`${label} must be finite`);return v;};
const positive=(v,label)=>{finite(v,label);if(v<=0)throw new RangeError(`${label} must be positive`);return v;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function checkHull(h){for(const k of ['length','lengthBP','beam','depth','carDeck'])positive(h[k],`hull.${k}`);if(h.lengthBP>h.length)throw new RangeError('LBP cannot exceed LOA');return h;}
function local(z,h){finite(z,'z');checkHull(h);return z*34.5/h.length;}

/** Existing hull's lowest ordinate; the stern counter is above baseline. */
export function hullKeelHeight(z,h=FERRY_HULL_SOURCE){
 const q=local(z,h),s=h.depth/3;
 if(q>25.5)return s*1.75*((q-25.5)/9)**2;
 if(q<10.5){const t=Math.min(1,(10.5-q)/6.5);let k=1.85*t*t*(3-2*t);if(q<4)k+=.1*(4-q)/4;return s*k;}
 return 0;
}
export function hullDeckEdgeHeight(z,h=FERRY_HULL_SOURCE){const q=local(z,h)-17.25;return h.carDeck-h.depth*.02+h.depth/3*(q>0?.3:.1)*(q/17.25)**2;}
export function hullDeckHalfBreadth(z,h=FERRY_HULL_SOURCE){const q=local(z,h);return h.beam/8.4*(4.2-(q>28.5?.32*((q-28.5)/6)**2:q<1.5?.12*((1.5-q)/1.5)**2:0));}
const sectionExponent=(z,h)=>{const q=local(z,h);return q>24?7-4.2*(q-24)/10.5:q<9?7-2.5*(9-q)/9:7;};
const sectionNarrowing=(z,h)=>{const q=local(z,h);return q>26?.12*((q-26)/8.5)**2:0;};

/** Half breadth inside the plated hull. Above the deck edge is not buoyancy. */
export function hullHalfBreadthAtHeight(y,z,h=FERRY_HULL_SOURCE){
 finite(y,'y');if(z<0||z>h.length)return 0;
 const k=hullKeelHeight(z,h),top=hullDeckEdgeHeight(z,h);if(y<=k||y>top)return 0;
 const t=clamp((y-k)/(top-k),0,1),n=sectionExponent(z,h);
 // expm1 avoids cancellation close to the keel.
 const shape=t===1?1:-Math.expm1(n*Math.log1p(-t));
 return hullDeckHalfBreadth(z,h)*shape**(1/n)*(1-sectionNarrowing(z,h)*(1-t));
}

const quadratures=new Map();
/** Gauss-Legendre integration: independently generated roots/weights. */
function gaussRule(order){
 if(!Number.isInteger(order)||order<8||order>128)throw new RangeError('quadrature order must be an integer from 8 to 128');
 if(quadratures.has(order))return quadratures.get(order);
 const rows=[];
 for(let i=0;i<Math.ceil(order/2);i++){
  let x=Math.cos(Math.PI*(i+.75)/(order+.5)),dp;
  for(let k=0;k<30;k++){
   let p0=1,p1=x;for(let j=2;j<=order;j++){const p=((2*j-1)*x*p1-(j-1)*p0)/j;p0=p1;p1=p;}
   dp=order*(x*p1-p0)/(x*x-1);const change=p1/dp;x-=change;if(Math.abs(change)<1e-15)break;
  }
  let p0=1,p1=x;for(let j=2;j<=order;j++){const p=((2*j-1)*x*p1-(j-1)*p0)/j;p0=p1;p1=p;}
  dp=order*(x*p1-p0)/(x*x-1);const w=2/((1-x*x)*dp*dp);
  if(Math.abs(x)<1e-14)rows.push([0,w]);else rows.push([-x,w],[x,w]);
 }
 rows.sort((a,b)=>a[0]-b[0]);quadratures.set(order,rows);return rows;
}
const quadrature=(fn,a,b,order)=>{if(b<=a)return 0;const c=(a+b)/2,r=(b-a)/2;let v=0;for(const [x,w] of gaussRule(order))v+=w*fn(c+r*x);return r*v;};
function root(fn,a,b){let fa=fn(a);for(let i=0;i<60;i++){const m=(a+b)/2,fm=fn(m);if(fa*fm<=0)b=m;else{a=m;fa=fm;}}return(a+b)/2;}
function breaks(h,draft,a=0,b=h.length){
 const ps=[0,1.5,4,9,10.5,17.25,24,25.5,26,28.5,34.5].map(z=>z*h.length/34.5).filter(z=>z>=a&&z<=b);
 ps.push(a,b);ps.sort((x,y)=>x-y);const extra=[];
 for(let i=1;i<ps.length;i++)for(const ordinate of [hullKeelHeight,hullDeckEdgeHeight]){
  const p=ps[i-1],q=ps[i],fn=z=>ordinate(z,h)-draft;if(fn(p)*fn(q)<0)extra.push(root(fn,p,q));
 }
 return [...new Set([...ps,...extra])].sort((x,y)=>x-y);
}
function sectionMoments(z,draft,h,order){
 const k=hullKeelHeight(z,h),top=hullDeckEdgeHeight(z,h),n=sectionExponent(z,h),upper=Math.min(draft,top);
 if(upper<=k)return[0,0];
 // y-k=(top-k)*u^n removes the vertical breadth's keel singularity.
 const umax=((upper-k)/(top-k))**(1/n);
 const area=quadrature(u=>{const y=k+(top-k)*u**n;return 2*hullHalfBreadthAtHeight(y,z,h)*(top-k)*n*u**(n-1);},0,umax,order);
 const first=quadrature(u=>{const y=k+(top-k)*u**n;return 2*hullHalfBreadthAtHeight(y,z,h)*(top-k)*n*u**(n-1)*y;},0,umax,order);
 return[area,first];
}

/** Even-keel, upright hydrostatics of the model's closed hull envelope. */
export function hydrostatics({draftM=1.9,densityTPerM3=1.025,hull=FERRY_HULL_SOURCE,order=32}={}){
 checkHull(hull);positive(draftM,'draftM');positive(densityTPerM3,'densityTPerM3');
 // No assumed deckhouses or bulwarks are added to the watertight envelope.
 if(draftM>=Math.min(hullDeckEdgeHeight(hull.length/2,hull),hullDeckEdgeHeight(0,hull)))throw new RangeError('draft reaches the hull deck edge; closed-envelope screening no longer applies');
 const xs=breaks(hull,draftM),s=[0,0,0,0,0,0,0,0];
 for(let j=1;j<xs.length;j++){
  const a=xs[j-1],b=xs[j];
  for(const [g,w] of gaussRule(order)){
   const z=(a+b)/2+(b-a)/2*g,weight=(b-a)/2*w;
   const [area,first]=sectionMoments(z,draftM,hull,order),breadth=2*hullHalfBreadthAtHeight(draftM,z,hull);
   const vals=[area,first,area*z,breadth,breadth*z,breadth*z*z,breadth**3/12,breadth*z*z];
   vals.forEach((v,i)=>s[i]+=v*weight);
  }
 }
 const [volume,kMoment,lMoment,aw,wpZ,wpZZ,it]=s;
 if(volume<=0||aw<=0)throw new RangeError('no immersed hull at this draft');
 const kb=kMoment/volume,lcf=wpZ/aw,il=wpZZ-wpZ*wpZ/aw,bmt=it/volume,bml=il/volume;
 return Object.freeze({draftM,densityTPerM3,volumeM3:volume,displacementTonnes:densityTPerM3*volume,
  waterplaneAreaM2:aw,lcbM:lMoment/volume,kbM:kb,lcfM:lcf,
  transverseWaterplaneInertiaM4:it,longitudinalWaterplaneInertiaM4:il,
  bmtM:bmt,bmlM:bml,kmtM:kb+bmt,kmlM:kb+bml,
  tpcTonnesPerCm:densityTPerM3*aw/100,mctGeometric1CmTonnesM:densityTPerM3*il/(100*hull.length),
  blockCoefficientLOA:volume/(hull.length*hull.beam*draftM),blockCoefficientLBP:volume/(hull.lengthBP*hull.beam*draftM),
  mouldedFreeboardM:hull.carDeck-draftM,
  status:'CALCULATED MODEL GEOMETRY; conditional immersion; not approved stability',order});
}

/** Solves buoyancy = a supplied weight; does not validate that supplied weight. */
export function equilibriumDraft(displacementTonnes,{hull=FERRY_HULL_SOURCE,densityTPerM3=1.025,order=32}={}){
 positive(displacementTonnes,'displacementTonnes');const a=.01,b=hull.carDeck-hull.depth*.02-.001;
 const fa=hydrostatics({draftM:a,hull,densityTPerM3,order}).displacementTonnes-displacementTonnes;
 const fb=hydrostatics({draftM:b,hull,densityTPerM3,order}).displacementTonnes-displacementTonnes;
 if(fa>0||fb<0)throw new RangeError('weight lies outside the closed hull immersion range');
 const draftM=root(d=>hydrostatics({draftM:d,hull,densityTPerM3,order}).displacementTonnes-displacementTonnes,a,b);
 return hydrostatics({draftM,hull,densityTPerM3,order});
}

/** Rectangular, independent slack-tank approximation. Actual tank geometry is required. */
export function rectangularFreeSurfaceMoment({lengthM,breadthM,densityTPerM3,slack=true}){
 positive(lengthM,'tank.lengthM');positive(breadthM,'tank.breadthM');positive(densityTPerM3,'tank.densityTPerM3');
 return slack?densityTPerM3*lengthM*breadthM**3/12:0;
}

/**
 * Initial-stability and trim sensitivity only. Every weight is explicit;
 * a tank's mass must already be included in weights, so it is not double counted.
 * Positive GM does not establish GZ, weather, passenger crowding, turning,
 * damage stability, downflooding or compliance. Large trim invalidates this
 * even-keel first-order calculation and is returned as a reserve flag.
 */
export function evaluateLoading({id='conditional',weights,tanks=[],hull=FERRY_HULL_SOURCE,densityTPerM3=1.025,
 designDraftM=1.9,screeningMinimumGMM=.5,order=32}){
 if(!Array.isArray(weights)||!weights.length)throw new TypeError('explicit weight schedule required');
 let mass=0,v=0,l=0,t=0;
 for(const w of weights){finite(w.massTonnes,'massTonnes');if(w.massTonnes<0)throw new RangeError('negative weight');finite(w.vcgM,'vcgM');finite(w.lcgM,'lcgM');finite(w.tcgM??0,'tcgM');mass+=w.massTonnes;v+=w.massTonnes*w.vcgM;l+=w.massTonnes*w.lcgM;t+=w.massTonnes*(w.tcgM??0);}
 positive(mass,'total weight');const kg=v/mass,lcg=l/mass,tcg=t/mass;
 const hs=equilibriumDraft(mass,{hull,densityTPerM3,order}),fsm=tanks.reduce((a,k)=>a+rectangularFreeSurfaceMoment(k),0),fsc=fsm/mass;
 const gmSolid=hs.kmtM-kg,gm=gmSolid-fsc,gmLong=hs.kmlM-kg;
 const trimM=gmLong>0?hull.length*(lcg-hs.lcbM)/gmLong:null;
 const heelDeg=gm>0?Math.atan(tcg/gm)*180/Math.PI:null;
 const flags=['ASSUMED_WEIGHT_AND_CG','INITIAL_STABILITY_ONLY','WATERTIGHT_ENVELOPE_UNVERIFIED','FULL_GZ_AND_DAMAGE_CASES_REQUIRED'];
 if(hs.draftM>designDraftM)flags.push('EXCEEDS_CONDITIONAL_DESIGN_DRAFT');
 if(gm<=0)flags.push('NONPOSITIVE_INITIAL_GM');else if(gm<screeningMinimumGMM)flags.push('BELOW_PROJECT_GM_SCREEN');
 if(heelDeg!==null&&Math.abs(heelDeg)>10)flags.push('HEEL_EXCEEDS_SMALL_ANGLE_RANGE');
 if(trimM!==null&&Math.abs(trimM)>.2)flags.push('REQUIRES_TRIMMED_HYDROSTATICS');
 return{id,status:'CONDITIONAL SCREENING; construction and stability approval withheld',weightTonnes:mass,kgM:kg,lcgM:lcg,tcgM:tcg,
  freeSurfaceMomentTonnesM:fsm,freeSurfaceCorrectionM:fsc,gmSolidM:gmSolid,gmCorrectedM:gm,
  indicativeHeelDeg:heelDeg,indicativeTrimBowDownM:trimM,hydrostatics:hs,screeningMinimumGMM,flags};
}

/** Actual shell intersection of a rectangular GA volume, not a certified tank capacity. */
export function compartmentHullIntersection(box,{hull=FERRY_HULL_SOURCE,order=64}={}){
 for(const axis of ['x','y','z'])if(!Array.isArray(box[axis])||box[axis].length!==2||box[axis][1]<=box[axis][0]||box[axis].some(v=>!Number.isFinite(v)))throw new TypeError(`invalid ${axis} interval`);
 const envelopeVolumeM3=(box.x[1]-box.x[0])*(box.y[1]-box.y[0])*(box.z[1]-box.z[0]);
 const a=Math.max(0,box.z[0]),b=Math.min(hull.length,box.z[1]);if(b<=a)return{envelopeVolumeM3,insideHullVolumeM3:0,insideFraction:0};
 const zs=breaks(hull,box.y[0],a,b),zp=breaks(hull,box.y[1],a,b),xs=[...new Set([...zs,...zp])].sort((x,y)=>x-y);let volume=0;
 for(let i=1;i<xs.length;i++)volume+=quadrature(z=>{
  const k=hullKeelHeight(z,hull),top=hullDeckEdgeHeight(z,hull),n=sectionExponent(z,hull),lo=Math.max(k,box.y[0]),hi=Math.min(top,box.y[1]);if(hi<=lo)return 0;
  const u0=((lo-k)/(top-k))**(1/n),u1=((hi-k)/(top-k))**(1/n);
  return quadrature(u=>{const y=k+(top-k)*u**n,hb=hullHalfBreadthAtHeight(y,z,hull),breadth=Math.max(0,Math.min(hb,box.x[1])-Math.max(-hb,box.x[0]));return breadth*(top-k)*n*u**(n-1);},u0,u1,order);
 },xs[i-1],xs[i],order);
 return{envelopeVolumeM3,insideHullVolumeM3:volume,insideFraction:volume/envelopeVolumeM3,
  status:'Hull-envelope intersection only; structure, pipes, clearances and permeability excluded'};
}

/**
 * Paired hull-conforming conceptual tanks, separated at the centreline.
 * The stated shell reserve is geometric clearance, not a plating thickness.
 * The structural reserve is an explicit planning deduction, not a measured
 * capacity. The true net capacity requires floors, longitudinals, brackets,
 * wells, stiffeners and calibration/sounding tables.
 */
export function conformalDoubleBottomTank({z,y,centrelineGapM=.2,shellReserveM=.1,structuralReserveFraction=.1},
 {hull=FERRY_HULL_SOURCE,order=64}={}){
 for(const [axis,interval] of Object.entries({z,y}))if(!Array.isArray(interval)||interval.length!==2||interval[1]<=interval[0]||interval.some(v=>!Number.isFinite(v)))throw new TypeError(`invalid ${axis} interval`);
 finite(centrelineGapM,'centrelineGapM');finite(shellReserveM,'shellReserveM');finite(structuralReserveFraction,'structuralReserveFraction');
 if(centrelineGapM<0||shellReserveM<0||structuralReserveFraction<0||structuralReserveFraction>=1)throw new RangeError('invalid tank reserve');
 const a=Math.max(0,z[0]),b=Math.min(hull.length,z[1]);const xs=breaks(hull,y[0]-shellReserveM,a,b);let perSide=0;
 for(let i=1;i<xs.length;i++)perSide+=quadrature(zy=>{
  const lo=Math.max(y[0],hullKeelHeight(zy,hull)+shellReserveM),hi=Math.min(y[1],hullDeckEdgeHeight(zy,hull)-shellReserveM);
  return quadrature(yk=>Math.max(0,hullHalfBreadthAtHeight(yk,zy,hull)-shellReserveM-centrelineGapM),lo,hi,order);
 },xs[i-1],xs[i],order);
 const total=2*perSide;
 return{z:[...z],y:[...y],centrelineGapM,shellReserveM,structuralReserveFraction,
  grossEnvelopePerSideM3:perSide,grossEnvelopeTotalM3:total,
  planningCapacityPerSideM3:perSide*(1-structuralReserveFraction),planningCapacityTotalM3:total*(1-structuralReserveFraction),
  status:'CONCEPT GEOMETRY AND EXPLICIT RESERVE; tank partition and calibrated net capacity unverified'};
}
