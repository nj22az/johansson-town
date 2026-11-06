import test from 'node:test';
import assert from 'node:assert/strict';
import {FERRY_MACHINERY} from '../src/world/ferry-ship.js';
import {FERRY_MACHINERY_DESIGN as D,engineDisplacementLitres,engineTorqueNm,fourStrokeBMEPBar,
 meanPistonSpeedMS,machineryFuelBudget,machineryVentilationScreen,machineryCoolingScreen,
 machineryShaftScreen,machineryStartingAirScreen,machineryDesignReport} from '../src/world/ferry-machinery-design.js';
const near=(value,want,tol=1e-5)=>assert.ok(Math.abs(value-want)<tol,`${value} != ${want}`);

test('fictional medium-speed engine is numerically consistent, without misidentifying the OEM surrogate',()=>{
 const r=machineryDesignReport();
 near(r.calculated.displacementLitres,24.12743157957,1e-8);
 near(r.calculated.bmepBar,16.9469,.001);
 near(r.calculated.meanPistonSpeedMS,9);
 assert.equal(r.installedFiction.verifiedManufacturerIdentity,false);
 assert.equal(r.installedFiction.ratedRPM,1350);
 assert.equal(D.referencePackage.operatingReference.ratedRPM,1900);
 assert.equal(D.referencePackage.eraCaution.includes('No 1994'),true);
 assert.equal(r.constructionRelease,false);
});
test('published combined package length is not fabricated by adding a guessed gearbox length',()=>{
 const p=D.referencePackage.physicalReference;
 assert.equal(p.engineOnly.lengthMM,2000);
 assert.equal(p.engineAndGear.overallLengthMM,2364);
 assert.equal(p.engineAndGear.combinedDryMassKG,p.engineOnly.dryMassKG+p.gear.dryMassKG);
 assert.equal(p.interface.mountingBoltPattern,null);
 assert.equal(p.interface.outputFlangeDrawing,null);
 assert.equal(p.interface.gearOffsetMM,null);
});
test('torque, displacement and BMEP obey the four-stroke work balance independently',()=>{
 const volume=engineDisplacementLitres({cylinders:6,boreMM:160,strokeMM:200});
 const torque=engineTorqueNm(460,1350),p=fourStrokeBMEPBar(460,1350,volume)*1e5;
 near(p*volume/1000,torque*4*Math.PI,1e-6);
 near(meanPistonSpeedMS(200,1350),9);
});
test('fuel is dimensioned as a duty budget and disproves the old fixed crossing/endurance claim',()=>{
 const f=machineryFuelBudget();
 near(f.engineKGPerHour,154.56);
 near(f.generatorKGPerHour,16.9);
 near(f.propulsionLPerCrossing,65.8976744186,1e-7);
 near(f.totalLPerCrossing,73.1031007752,1e-7);
 near(f.dailyL,1462.062015504,1e-6);
 near(f.enduranceDays,9.2335344581,1e-7);
 assert.ok(f.propulsionLPerCrossing>46);
 assert.ok(f.enduranceDays<16);
 const zeroLoad=machineryFuelBudget({fuelLoadFraction:0,generatorTotalElectricalKW:0});
 assert.equal(zeroLoad.totalLPerCrossing,0);
 assert.equal(zeroLoad.enduranceDays,Infinity);
 assert.equal(f.excludes.includes('alongside'),true);
});
test('overhaul and route clearance remain unproven when the actual room height is too low',()=>{
 const r=machineryDesignReport();
 near(r.access.nominalClearHeightM,1.9);
 near(r.access.overheadReserveM,.25);
 assert.equal(r.access.routeHeightTargetMet,false);
 assert.equal(r.access.supplierOverhaulEnvelopeVerified,false);
 assert.equal(r.access.removalPathVerified,false);
 assert.equal(D.reservations.removal.liftingApplianceWLLKG,null);
});
test('ventilation heat balance changes with temperature rise and never equates fan kW to delivered flow',()=>{
 const a=machineryVentilationScreen(),b=machineryVentilationScreen({permittedTemperatureRiseK:20});
 near(a.heatRemovalM3PerHour,b.heatRemovalM3PerHour*2,1e-7);
 near(a.combustionM3PerHour,b.combustionM3PerHour,1e-7);
 assert.ok(a.totalM3PerHour>35000 && a.totalM3PerHour<36000);
 assert.ok(a.perFanElectricalKW>6);
 assert.equal(a.existingMotorKWProvesFlow,false);
 assert.equal(a.sourceStatus.includes('not supplier validation'),true);
});
test('cooling and shaft screens do not masquerade as approved component sizing',()=>{
 const c=machineryCoolingScreen(),s=machineryShaftScreen();
 assert.ok(c.perEngineHeatToWaterKW>300 && c.perEngineHeatToWaterKW<400);
 assert.ok(c.perEngineRawWaterM3PerHour>25 && c.perEngineRawWaterM3PerHour<35);
 near(s.propellerRPM,FERRY_MACHINERY.mains.rpm/FERRY_MACHINERY.gears.ratio);
 near(s.shaftTorqueNm,s.engineTorqueNm*FERRY_MACHINERY.gears.ratio*.97);
 assert.equal(s.approved,false);
 assert.equal(s.status.includes('fatigue'),true);
 assert.ok(s.pureTorsionStressMPa>0);
});
test('air receivers expose usable volume rather than an invented number of engine starts',()=>{
 const a=machineryStartingAirScreen();
 near(a.usableReferenceAirM3,3.6);
 assert.equal(a.referenceAbsolutePressureBar,1);
 assert.equal(a.temperatureBasis.includes('not normal cubic metres'),true);
 assert.equal(a.capacityProven,false);
 assert.equal(a.startCount,null);
});
test('engineering calculations reject non-physical units and duty assumptions',()=>{
 assert.throws(()=>engineDisplacementLitres({cylinders:6,boreMM:0,strokeMM:200}),RangeError);
 assert.throws(()=>engineTorqueNm(460,0),RangeError);
 assert.throws(()=>fourStrokeBMEPBar(460,1350,NaN),RangeError);
 assert.throws(()=>machineryFuelBudget({fuelLoadFraction:1.1}),RangeError);
 assert.throws(()=>machineryFuelBudget({fuelDensityKGPerL:0}),RangeError);
 assert.throws(()=>machineryFuelBudget({generatorTotalElectricalKW:-1}),RangeError);
 assert.throws(()=>machineryVentilationScreen({permittedTemperatureRiseK:0}),RangeError);
 assert.throws(()=>machineryCoolingScreen({estimatedHeatToWaterFraction:1.1}),RangeError);
});
