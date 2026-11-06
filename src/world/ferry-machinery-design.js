/**
 * Machinery design basis for Minato Maru. SI units unless a field says otherwise.
 * This is a preliminary coordination model. The fictional 1994 engine is not a
 * Yanmar engine; the published Yanmar package is an explicitly separate reference.
 * Reservations are NOT manufacturer installation dimensions or approval evidence.
 */
import {FERRY_MACHINERY, FERRY_HEIGHTS} from './ferry-ship.js';

function freeze(value){
 if(value && typeof value==='object' && !Object.isFrozen(value)){
  Object.values(value).forEach(freeze); Object.freeze(value);
 }
 return value;
}
function positive(value,label){
 if(!Number.isFinite(value)||value<=0)throw new RangeError(label+' must be finite and positive');
 return value;
}
function fraction(value,label){
 if(!Number.isFinite(value)||value<0||value>1)throw new RangeError(label+' must be between zero and one');
 return value;
}

export const MACHINERY_SOURCES=freeze([
 {id:'YAN-2020-6AY',kind:'manufacturer-brochure',publisher:'YANMAR POWER TECHNOLOGY',
  url:'https://www.yanmar.com/media/news/2020/05/22051608/6aym-wstwet.pdf',
  location:'Engine specifications and marine gear specifications; two-page brochure',accessed:'2026-10-13',
  scope:'C-rating 485 kW at 1900 rpm; bore/stroke, displacement, gear alternatives, mechanical control, fluids and optional air start',
  limitation:'Later product reference. Not evidence of manufacture or installation in 1994. Air-start consumption and installation interfaces are not supplied.'},
 {id:'YAN-LEGACY-WST',kind:'manufacturer-channel-datasheet',publisher:'YANMAR Norway',
  url:'https://www.yanmar.no/theme/yanmarportal/uploadedFiles/Marine/productDownloads/Commercial-datasheet/6148-Datasheet-6AYM-WST.pdf',
  location:'One-page datasheet, specification table and right-side outline with YX181',accessed:'2026-10-13',
  scope:'Legacy H-rating physical reference: engine-only outline, mass; YX181 combined length, mass and ratios',
  limitation:'Legacy H designation and 7 kW electric starter differ from the later C-rating/8 kW brochure. Not an installation or foundation drawing.'},
 {id:'MHI-S6A3',kind:'manufacturer-product-page',publisher:'Mitsubishi Turbocharger and Engine Europe',
  url:'https://engine-genset.mhi.com/marine-engine/s6a3-mptaw',accessed:'2026-10-13',
  scope:'Alternative propulsion engine physical reference',
  limitation:'No matched gear or period-specific installation drawing was obtained.'},
]);

export const FERRY_MACHINERY_DESIGN=freeze({
 revision:'M1',status:'PRELIMINARY DESIGN / GAME COORDINATION',constructionRelease:false,
 coordinateConvention:'[x port positive, y above keel, z forward of transom], metres',
 installedFiction:{brand:'Johansson Marine',model:'JM6-160',year:1994,
  classification:'Fictional medium-speed mechanical diesel; numerical design basis only',
  engines:FERRY_MACHINERY.mains.count,ratedKW:FERRY_MACHINERY.mains.kW,
  ratedRPM:FERRY_MACHINERY.mains.rpm,cylinders:FERRY_MACHINERY.mains.cylinders,
  boreMM:FERRY_MACHINERY.mains.bore,strokeMM:FERRY_MACHINERY.mains.stroke,
  statedEngineDryMassKG:FERRY_MACHINERY.mains.tonnes*1000,
  fuelSpecificGPerKWh:210,fuelSpecificStatus:'design-assumption',
  fuel:'A-heavy oil remains a fictional period service assumption; exact delivered fuel properties and OEM acceptance remain open',
  starting:'Air-start arrangement retained for gameplay; vessel start-capacity proof remains open',
  verifiedManufacturerIdentity:false,verified1994Availability:false},
 referencePackage:{manufacturer:'YANMAR',engineModel:'6AYM-WST',use:'Comparison and space reservation only; not the installed fictional engine',
  operatingReference:{rating:'C',ratedKW:485,ratedRPM:1900,cylinders:6,boreMM:155,strokeMM:180,
   publishedLitres:20.379,fuelSpecificGPerKWh:207,source:'YAN-2020-6AY',
   fluids:{jacketWaterL:60,lubeOilL:91},starter:{volts:24,electricKW:8,airOptional:true}},
  physicalReference:{rating:'Legacy H',engineOnly:{lengthMM:2000,widthMM:1305,heightMM:1431,dryMassKG:2365},
   gear:{model:'YX-181',dryMassKG:560,availableRatios:[2.08,2.55,3.03],comparisonRatio:3.03,
    type:'Hydraulic multi-disc clutch; output rotation either direction'},
   engineAndGear:{overallLengthMM:2364,combinedDryMassKG:2925},
   interface:{flywheelHousing:'SAE #0',flywheelInches:18,mountingBoltPattern:null,outputFlangeDrawing:null,gearOffsetMM:null},
   source:'YAN-LEGACY-WST',
   note:'Length 2364 mm is the published combined outline with YX181, not engine length plus an invented gear length. Engine width/height are engine-only; accessory extremes must be verified.'},
  eraCaution:'2020 and legacy IMO Tier II literature are modern references. No 1994 build history is inferred.'},
 alternatives:[{manufacturer:'Mitsubishi',model:'S6A3-MPTAW',cylinders:6,boreMM:150,strokeMM:175,
  publishedLitres:18.56,lengthMM:1636,widthMM:1036,heightMM:1421,dryMassKG:1900,source:'MHI-S6A3',
  decision:'Not selected: different engine class/displacement and no confirmed gearbox package; do not import the S6A3-MPTA generator rating as propulsion approval.'}],
 reservations:{status:'YARD RESERVATION / SUPPLIER CONFIRMATION REQUIRED',
  units:[{id:'mainP',tag:'11XJA10',centre:[1.55,1.725,10.7]},{id:'mainS',tag:'12XJA10',centre:[-1.55,1.725,10.7]}],
  physicalEnvelope:{lengthM:2.7,widthM:1.5,heightM:1.65,lowerEdgeAboveKeelM:.9,
   massKG:3600,massBasis:'3000 kg fictional engine + 600 kg gear allowance; excludes foundations, shafts and rigging',
   centreOfMass:'Geometric reservation centre only; actual equipment CoG not supplied',
   boundingBoxOffsets:{x:[-.75,.75],y:[-.825,.825],z:[-1.35,1.35]}},
  access:{operatingSideM:1,otherSideM:.8,endM:.6,mainRouteTargetHeightM:2,
   status:'Design targets, not OEM minima or demonstrated class compliance'},
  removal:{hatchClearLengthM:2.9,hatchClearWidthM:1.8,sideClearanceM:.15,endClearanceM:.1,
   location:'Centred above each machinery reservation; continuity through decks and lifting path NOT modelled or verified',
   method:'Dry dock or alongside shore crane, with vessel stable and unloaded as lift study requires',
   nominalAssemblyMassKG:3600,riggingAllowanceKG:400,preliminaryLiftLoadKG:4000,
   liftingApplianceWLLKG:null,liftingPointDrawing:null,
   hold:'Hatch framing, weather/watertight closure, deck loading, rigging, crane radius, stability during lift and engine lifting points require design'},
  inRoomOverhaul:{pistonWithdrawalHeightM:null,chainBlockClearanceM:null,
   hold:'No manufacturer piston/liner extraction envelope; nominal current overhead cannot be declared sufficient'},
  operatingCentresDoNotAuthorizeRelocation:true},
 serviceAssumptions:{
  fuelDensityKGPerL:.86,fuelLoadFraction:.8,crossingMinutes:22,crossingsPerDay:20,
  storageGrossM3:15,unusableFraction:.1,dayTankGrossM3:1.5,dayTankUnusableFraction:.1,
  generatorTotalElectricalKW:65,generatorSpecificGPerElectricalKWh:260,
  fuelBasis:'Illustrative duty budget; generators use a separate assumed g/kWhe value. No fuel economy guarantee.',
  ventilation:{roomSensibleHeatKW:100,airDensityKGPerM3:1.18,airSpecificHeatKJPerKGK:1.005,
   permittedTemperatureRiseK:10,combustionAirFuelMassRatio:32,
   reservationSupplyM3PerHour:40000,fanCount:2,fanPressurePa:750,fanTotalEfficiency:.65,
   status:'Preliminary heat and combustion air assumptions. Obtain OEM heat release/air consumption and fan/duct curves before sizing.'},
  cooling:{estimatedHeatToWaterFraction:.3,fuelLHVKJPerKG:42700,seawaterDensityKGPerM3:1025,
   seawaterSpecificHeatKJPerKGK:3.99,seawaterRiseK:10,
   status:'Screening heat balance only; OEM pump curve, charge-air/jacket/gear cooler split, seawater limit and fouling allowance not supplied'},
  shaft:{gearEfficiency:.97,steelAllowableShearScreeningMPa:40,
   status:'Pure torsion screen only. No fatigue, bending, keyway, class diameter, bearing, alignment or torsional vibration approval.'},
  startAir:{receiverCount:2,receiverVolumeL:150,upperPressureBarGauge:30,lowerPressureBarGauge:18,
   manufacturerAirPerStartNM3:null,requiredConsecutiveStarts:null,
   status:'Isothermal usable free-air estimate only; simultaneous start requirements and compressor recovery not proven'}},
 procurementHolds:[
  'OEM installation drawings, mount coordinates, bolt sizes/grades and certified mass/CoG',
  'Engine and gear rating compatibility, thrust capacity, rotation and shaft-line alignment',
  'Torsional vibration calculation, critical speed/whirling and bearing reactions',
  'Fuel quality acceptance, delivery/return pressures, filtration and spill drainage',
  'Heat rejection, raw-water flows, strainer pressure losses and sea-chest submerged geometry',
  'Air-start consumption, receiver certified pressure/volume, compressor delivery and independent emergency starting',
  'Exhaust flow, temperatures, allowable backpressure, silencer, insulation and expansion/support drawings',
  'Measured duct pressure, fan curves and shutdown arrangements; ventilation must not compromise fire boundaries',
  'Piston/liner withdrawal, complete engine removal path and certified lifting point/load data',
  'All fuel shutoffs, remote stops, insulated hot surfaces, leak shielding and fire suppression volume review',
 ],
});

/** Exact swept volume from the fictional bore/stroke, not rounded catalogue litres. */
export function engineDisplacementLitres({cylinders,boreMM,strokeMM}){
 return positive(cylinders,'cylinders')*Math.PI/4*(positive(boreMM,'boreMM')/1000)**2*
  (positive(strokeMM,'strokeMM')/1000)*1000;
}
export function engineTorqueNm(kW,rpm){
 return positive(kW,'kW')*1000/(2*Math.PI*positive(rpm,'rpm')/60);
}
export function fourStrokeBMEPBar(kW,rpm,litres){
 return positive(kW,'kW')*1200/(positive(rpm,'rpm')*positive(litres,'litres'));
}
export function meanPistonSpeedMS(strokeMM,rpm){
 return 2*(positive(strokeMM,'strokeMM')/1000)*positive(rpm,'rpm')/60;
}

export function machineryFuelBudget(overrides={}){
 const d=FERRY_MACHINERY_DESIGN,s={...d.serviceAssumptions,...overrides},e=d.installedFiction;
 const load=fraction(s.fuelLoadFraction,'fuelLoadFraction');
 const density=positive(s.fuelDensityKGPerL,'fuelDensityKGPerL');
 const minutes=positive(s.crossingMinutes,'crossingMinutes');
 const engineKGPerHour=e.engines*e.ratedKW*load*e.fuelSpecificGPerKWh/1000;
 const genKW=s.generatorTotalElectricalKW;
 if(!Number.isFinite(genKW)||genKW<0)throw new RangeError('generatorTotalElectricalKW must not be negative');
 const generatorKGPerHour=genKW*positive(s.generatorSpecificGPerElectricalKWh,'generator specific consumption')/1000;
 const propulsionLPerCrossing=engineKGPerHour/density*minutes/60;
 const totalLPerCrossing=(engineKGPerHour+generatorKGPerHour)/density*minutes/60;
 const dailyL=totalLPerCrossing*positive(s.crossingsPerDay,'crossingsPerDay');
 const usableStorageL=positive(s.storageGrossM3,'storageGrossM3')*1000*(1-fraction(s.unusableFraction,'unusableFraction'));
 const usableDayTankL=positive(s.dayTankGrossM3,'dayTankGrossM3')*1000*(1-fraction(s.dayTankUnusableFraction,'dayTankUnusableFraction'));
 return {engineKGPerHour,generatorKGPerHour,propulsionLPerCrossing,totalLPerCrossing,dailyL,
  usableStorageL,enduranceDays:usableStorageL/dailyL,
  dayTankHours:usableDayTankL/((engineKGPerHour+generatorKGPerHour)/density),
  excludes:'Idle/alongside generator consumption, start/warm-up, reserve policy, diversions and adverse weather; no fixed 16-day endurance claim'};
}

export function machineryVentilationScreen(overrides={}){
 const d=FERRY_MACHINERY_DESIGN,v={...d.serviceAssumptions.ventilation,...overrides},e=d.installedFiction;
 const density=positive(v.airDensityKGPerM3,'air density'),cp=positive(v.airSpecificHeatKJPerKGK,'air specific heat');
 const temperatureRise=positive(v.permittedTemperatureRiseK,'temperature rise');
 const heat=positive(v.roomSensibleHeatKW,'room heat');
 const combustionFuelKGPerHour=e.engines*e.ratedKW*e.fuelSpecificGPerKWh/1000;
 const heatRemovalM3PerHour=heat/(density*cp*temperatureRise)*3600;
 const combustionM3PerHour=combustionFuelKGPerHour*positive(v.combustionAirFuelMassRatio,'air/fuel mass ratio')/density;
 const totalM3PerHour=heatRemovalM3PerHour+combustionM3PerHour;
 const reservedM3PerHour=positive(v.reservationSupplyM3PerHour,'supply reservation');
 const fanElectricalKW=reservedM3PerHour/3600*positive(v.fanPressurePa,'fan pressure')/
  positive(v.fanTotalEfficiency,'fan efficiency')/1000;
 return {heatRemovalM3PerHour,combustionM3PerHour,totalM3PerHour,reservedM3PerHour,
  reservationMarginFraction:reservedM3PerHour/totalM3PerHour-1,
  totalFanElectricalKW:fanElectricalKW,perFanElectricalKW:fanElectricalKW/positive(v.fanCount,'fan count'),
  existingMotorKWProvesFlow:false,sourceStatus:'assumed screening inputs; not supplier validation'};
}

export function machineryCoolingScreen(overrides={}){
 const d=FERRY_MACHINERY_DESIGN,c={...d.serviceAssumptions.cooling,...overrides},e=d.installedFiction;
 const fractionToWater=fraction(c.estimatedHeatToWaterFraction,'water heat fraction');
 const fullFuelKGPerHour=e.ratedKW*e.fuelSpecificGPerKWh/1000;
 const fuelInputKW=fullFuelKGPerHour*positive(c.fuelLHVKJPerKG,'fuel LHV')/3600;
 const heatToWaterKW=fuelInputKW*fractionToWater;
 const rawWaterM3PerHour=heatToWaterKW/(positive(c.seawaterDensityKGPerM3,'seawater density')*
  positive(c.seawaterSpecificHeatKJPerKGK,'seawater specific heat')*positive(c.seawaterRiseK,'seawater rise'))*3600;
 return {perEngineFuelInputKW:fuelInputKW,perEngineHeatToWaterKW:heatToWaterKW,perEngineRawWaterM3PerHour:rawWaterM3PerHour,
  status:'Order-of-magnitude only; includes assumed heat split, no pump/pipe sizing release'};
}

export function machineryShaftScreen(){
 const d=FERRY_MACHINERY_DESIGN,e=d.installedFiction,s=d.serviceAssumptions.shaft;
 const ratio=positive(FERRY_MACHINERY.gears.ratio,'gear ratio');
 const engineNm=engineTorqueNm(e.ratedKW,e.ratedRPM);
 const propellerRPM=e.ratedRPM/ratio;
 const shaftNm=engineNm*ratio*fraction(s.gearEfficiency,'gear efficiency');
 const shaftDiameterM=positive(FERRY_MACHINERY.shafts.diameter,'shaft diameter');
 const pureTorsionStressMPa=16*shaftNm/(Math.PI*shaftDiameterM**3)/1e6;
 const torsionOnlyMinDiameterM=(16*shaftNm/(Math.PI*positive(s.steelAllowableShearScreeningMPa,'allowable shear')*1e6))**(1/3);
 return {engineTorqueNm:engineNm,propellerRPM,shaftTorqueNm:shaftNm,shaftDiameterM,pureTorsionStressMPa,torsionOnlyMinDiameterM,
  approved:false,status:s.status};
}

export function machineryStartingAirScreen(){
 const a=FERRY_MACHINERY_DESIGN.serviceAssumptions.startAir;
 const usableReferenceAirM3=a.receiverCount*a.receiverVolumeL/1000*(a.upperPressureBarGauge-a.lowerPressureBarGauge);
 return {usableReferenceAirM3,referenceAbsolutePressureBar:1,temperatureBasis:'Same assumed constant receiver/reference temperature; not normal cubic metres',
  startCount:null,capacityProven:false,
  note:'Isothermal approximation at 1 bar reference. No manufacturer air-per-start, minimum receiver pressure, temperature or consecutive-start requirement has been verified.'};
}

export function machineryDesignReport(){
 const d=FERRY_MACHINERY_DESIGN,e=d.installedFiction,r=d.reservations;
 const litres=engineDisplacementLitres(e);
 const deckheadAboveKeelM=FERRY_HEIGHTS.carDeck-.2;
 const machineryTopAboveKeelM=r.physicalEnvelope.lowerEdgeAboveKeelM+r.physicalEnvelope.heightM;
 const nominalClearHeightM=deckheadAboveKeelM-FERRY_HEIGHTS.floorPlates;
 return {revision:d.revision,status:d.status,constructionRelease:false,installedFiction:e,
  calculated:{displacementLitres:litres,bmepBar:fourStrokeBMEPBar(e.ratedKW,e.ratedRPM,litres),
   meanPistonSpeedMS:meanPistonSpeedMS(e.strokeMM,e.ratedRPM)},
  referencePackage:d.referencePackage,alternatives:d.alternatives,reservations:r,serviceAssumptions:d.serviceAssumptions,
  access:{deckheadAboveKeelM,machineryTopAboveKeelM,overheadReserveM:deckheadAboveKeelM-machineryTopAboveKeelM,
   nominalClearHeightM,routeTargetHeightM:r.access.mainRouteTargetHeightM,
   routeHeightTargetMet:nominalClearHeightM>=r.access.mainRouteTargetHeightM,
   supplierOverhaulEnvelopeVerified:false,removalPathVerified:false},
  fuel:machineryFuelBudget(),ventilation:machineryVentilationScreen(),cooling:machineryCoolingScreen(),
  shafts:machineryShaftScreen(),startingAir:machineryStartingAirScreen(),sources:MACHINERY_SOURCES,holds:d.procurementHolds};
}
