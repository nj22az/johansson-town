import test from 'node:test';
import assert from 'node:assert/strict';
import {FERRY_HULL_SOURCE as H,hullKeelHeight,hullHalfBreadthAtHeight,hydrostatics,equilibriumDraft,
 rectangularFreeSurfaceMoment,evaluateLoading,compartmentHullIntersection,conformalDoubleBottomTank} from '../src/world/ferry-engineering-hydrostatics.js';

const close=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} ≠ ${b} (tolerance ${tolerance})`);

test('analytic inverse reproduces independent original parametric section points in baseline coordinates',()=>{
 // Direct theta equations copied from original model, independently of the inverse.
 for(const zy of [0,3.2,8.5,10.5,17.25,25.5,29,34.5]){
  const z=zy-17.25,n=zy>24?7-4.2*(zy-24)/10.5:zy<9?7-2.5*(9-zy)/9:7;
  const top=2.94+(z>0?.3:.1)*(z/17.25)**2;
  const hb=zy>28.5?4.2-.32*((zy-28.5)/6)**2:zy<1.5?4.2-.12*((1.5-zy)/1.5)**2:4.2;
  let k=0;if(zy>25.5)k=1.75*((zy-25.5)/9)**2;
  if(zy<10.5){const t=Math.min(1,(10.5-zy)/6.5);k=1.85*t*t*(3-2*t)+(zy<4?.1*(4-zy)/4:0);}
  const narrowing=zy>26?.12*((zy-26)/8.5)**2:0;
  close(hullKeelHeight(zy),k);
  for(const theta of [.005,.15,.55,1.1,1.4]){
   const y=k+(top-k)*(1-Math.cos(theta)**(2/n));
   const x=hb*Math.sin(theta)**(2/n)*(1-narrowing*(top-y)/(top-k));
   close(hullHalfBreadthAtHeight(y,zy),x,1e-9);
  }
 }
});

test('original hull buoyancy is incompatible with the previously declared 283 t at 1.9 m',()=>{
 const h=hydrostatics({order:64});
 close(h.volumeM3,366.254176112,1e-6);close(h.displacementTonnes,375.410530515,1e-6);
 assert.ok(h.displacementTonnes-H.originalDisplacement>92);
 assert.ok(h.blockCoefficientLBP>.74&&h.blockCoefficientLBP<.741);
 assert.equal(h.status.includes('not approved'),true);
 close(h.kmtM,h.kbM+h.transverseWaterplaneInertiaM4/h.volumeM3);
 close(h.mctGeometric1CmTonnesM,h.densityTPerM3*h.longitudinalWaterplaneInertiaM4/(100*H.length));
});

test('independent polygon-section trapezoid integration checks the quadrature displacement',()=>{
 // The independent calculation works directly in theta and integrates polygon
 // strips, rather than the transformed vertical Gauss quadrature in production.
 const L=34.5,N=690,M=240,draft=1.9;let volume=0;
 for(let j=0;j<=N;j++){
  const zy=j*L/N,z=zy-L/2,top=2.94+(z>0?.3:.1)*(z/(L/2))**2;
  const n=zy>24?7-4.2*(zy-24)/10.5:zy<9?7-2.5*(9-zy)/9:7;
  let k=0;if(zy>25.5)k=1.75*((zy-25.5)/9)**2;
  if(zy<10.5){const t=Math.min(1,(10.5-zy)/6.5);k=1.85*t*t*(3-2*t)+(zy<4?.1*(4-zy)/4:0);}
  if(draft<=k)continue;
  const hb=zy>28.5?4.2-.32*((zy-28.5)/6)**2:zy<1.5?4.2-.12*((1.5-zy)/1.5)**2:4.2;
  const narrowing=zy>26?.12*((zy-26)/8.5)**2:0;
  const maxTheta=Math.acos((1-(draft-k)/(top-k))**(n/2));
  let area=0,prevX=0,prevY=k;
  for(let i=1;i<=M;i++){
   const theta=maxTheta*i/M,y=k+(top-k)*(1-Math.cos(theta)**(2/n));
   const x=hb*Math.sin(theta)**(2/n)*(1-narrowing*(top-y)/(top-k));
   area+=(x+prevX)*(y-prevY);prevX=x;prevY=y;
  }
  volume+=area*(j===0||j===N?.5:1)*L/N;
 }
 close(volume,hydrostatics({order:64}).volumeM3,.04);
});

test('quadrature convergence, tonnes/metres and the TPC derivative are consistent',()=>{
 const a=hydrostatics({order:32}),b=hydrostatics({order:64}),c=hydrostatics({order:128});
 close(a.volumeM3,b.volumeM3,1e-7);close(b.volumeM3,c.volumeM3,1e-7);
 close(a.waterplaneAreaM2,b.waterplaneAreaM2,.001);close(b.kmtM,c.kmtM,1e-6);
 const up=hydrostatics({draftM:1.901,order:64}),down=hydrostatics({draftM:1.899,order:64});
 close((up.displacementTonnes-down.displacementTonnes)/.002/100,b.tpcTonnesPerCm,.0001);
 const fresh=hydrostatics({densityTPerM3:1,order:64});
 close(fresh.volumeM3,b.volumeM3);close(b.displacementTonnes,fresh.displacementTonnes*1.025);
 close(b.kmtM,fresh.kmtM);
});

test('conditional immersion solves supplied 283 and 210 t without verifying the supplied mass',()=>{
 const full=equilibriumDraft(283),light=equilibriumDraft(210);
 close(full.displacementTonnes,283);close(light.displacementTonnes,210);
 close(full.draftM,1.52167999248,1e-9);close(light.draftM,1.19820201406,1e-9);
 close(full.mouldedFreeboardM,H.carDeck-full.draftM);
 // Preserve the original physical shaft axis, 0.9 m above baseline:
 // the design cannot silently move the shaft when the waterline changes.
 assert.ok(full.draftM-(.9+1.45/2)<0);
 assert.ok(light.draftM-(.9+1.45/2)<0);
});

test('free surface is density × L × b³ / 12, only added to CG correction, not to displacement',()=>{
 const tank={lengthM:4,breadthM:2,densityTPerM3:.85,slack:true};
 close(rectangularFreeSurfaceMoment(tank),.85*4*8/12);
 close(rectangularFreeSurfaceMoment({...tank,slack:false}),0);
 const weights=[{id:'assumed-lightship',massTonnes:210,vcgM:4.4,lcgM:19,tcgM:0},{id:'people',massTonnes:10,vcgM:8.4,lcgM:19,tcgM:1}];
 const r=evaluateLoading({weights,tanks:[tank]});
 close(r.weightTonnes,220);close(r.kgM,(210*4.4+10*8.4)/220);
 close(r.freeSurfaceCorrectionM,rectangularFreeSurfaceMoment(tank)/220);
 close(r.gmSolidM-r.gmCorrectedM,r.freeSurfaceCorrectionM);
 assert.ok(r.flags.includes('ASSUMED_WEIGHT_AND_CG'));
 assert.ok(r.flags.includes('FULL_GZ_AND_DAMAGE_CASES_REQUIRED'));
});

test('unsafe conditional loading is flagged and never represented as approved',()=>{
 const unstable=evaluateLoading({weights:[{massTonnes:283,vcgM:8,lcgM:20}]});
 assert.ok(unstable.gmCorrectedM<0);assert.ok(unstable.flags.includes('NONPOSITIVE_INITIAL_GM'));
 assert.equal(unstable.indicativeHeelDeg,null);
 const largeHeel=evaluateLoading({weights:[{massTonnes:283,vcgM:5,lcgM:25,tcgM:1}]});
 assert.ok(largeHeel.flags.includes('HEEL_EXCEEDS_SMALL_ANGLE_RANGE'));
 assert.ok(largeHeel.flags.includes('REQUIRES_TRIMMED_HYDROSTATICS'));
 assert.ok(largeHeel.status.includes('approval withheld'));
});

test('the old aft-peak tank is wholly outside the actual game hull',()=>{
 const old=compartmentHullIntersection({x:[-3.5,3.5],y:[0,1],z:[0,2.6]});
 close(old.envelopeVolumeM3,18.2);close(old.insideHullVolumeM3,0);close(old.insideFraction,0);
 const internal=compartmentHullIntersection({x:[-.5,.5],y:[.5,.7],z:[14,19]});
 close(internal.insideHullVolumeM3,1,1e-12);
});

test('conformal aft tank capacity deducts the explicitly stated structural reserve',()=>{
 const config={z:[14.1,15.4],y:[.1,.68],centrelineGapM:.2,shellReserveM:.1,structuralReserveFraction:.1};
 const tank=conformalDoubleBottomTank(config);
 assert.ok(tank.grossEnvelopeTotalM3>4.45);assert.ok(tank.planningCapacityTotalM3>4);
 close(tank.planningCapacityTotalM3,tank.grossEnvelopeTotalM3*.9);
 const less=conformalDoubleBottomTank({...config,shellReserveM:.2});assert.ok(less.grossEnvelopeTotalM3<tank.grossEnvelopeTotalM3);
 assert.ok(tank.status.includes('unverified'));
 const main=conformalDoubleBottomTank({...config,z:[15.6,20]});assert.ok(main.planningCapacityTotalM3>=16);
 const er=conformalDoubleBottomTank({...config,z:[8.5,14]});assert.ok(er.planningCapacityTotalM3>=16.9);
 assert.ok(er.planningCapacityTotalM3<20.9,'rejected ER-only packing cannot fit fuel, other fluids and the new4m³ ballast');
});

test('invalid units and nonfinite schedules cannot produce apparently valid results',()=>{
 assert.throws(()=>hydrostatics({draftM:NaN}),/finite/);
 assert.throws(()=>hydrostatics({densityTPerM3:0}),/positive/);
 assert.throws(()=>hydrostatics({draftM:3}),/deck edge/);
 assert.throws(()=>equilibriumDraft(1000),/outside/);
 assert.throws(()=>evaluateLoading({weights:[{massTonnes:-1,vcgM:1,lcgM:1}]}),/negative/);
 assert.throws(()=>rectangularFreeSurfaceMoment({lengthM:1,breadthM:0,densityTPerM3:1}),/positive/);
});
