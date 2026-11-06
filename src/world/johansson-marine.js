import {FERRY_MACHINERY,FERRY_ELECTRICS,FERRY_LOADS} from './ferry-ship.js';
/**
 * Johansson Marine (ヨハンソン舶用機械): the brand on every engineering part aboard the Minato Maru (the creator,
 * 2026-10-12: "I want them to look like real machines similar to Volvo but brand every engineering part as a Johansson
 * brand"). The machines are built like the marine diesels of their day, a block in the house green with black rocker
 * covers, silver lagging and an aluminium maker's plate, and every one carries a model in this catalogue, whose numbers
 * are the ship's own (ferry-ship.js FERRY_MACHINERY, FERRY_ELECTRICS): the catalogue never contradicts the data.
 */
const M=FERRY_MACHINERY,E=FERRY_ELECTRICS;
export const JOHANSSON_MARINE=Object.freeze({
 name:'Johansson Marine',jp:'ヨハンソン舶用機械',works:'Johansson Marine Works, Naha',founded:1961,
 /** The livery: the green of the block, the black of the covers, the silver of the lagging, the plate and its lettering. */
 livery:Object.freeze({green:0x2e7a4e,greenDark:0x235c3b,cover:0x1f2224,lagging:0xc9ccc8,cast:0x8d9492,plate:0xdcd8c8,plateText:'#1d2326',wordmark:'#24585c',alternator:0x2a3f6b,red:0xc2412f}),
 catalogue:Object.freeze({
  main:Object.freeze({model:'JM6-160',kind:'Main engine',spec:`${M.mains.cylinders} cyl · ${M.mains.bore}×${M.mains.stroke} mm · ${M.mains.kW} kW at ${M.mains.rpm} rpm`,count:M.mains.count,
   why:'The same medium-speed six as the island cargo boats, turbocharged and intercooled, air start; parts from Naha on the Tuesday boat'}),
  gear:Object.freeze({model:'JR-30',kind:'Reverse-reduction gear',spec:`${M.gears.ratio}:1 · hydraulic multi-disc ahead and astern clutches`,count:M.gears.count}),
  genset:Object.freeze({model:'JG-125',kind:'Generator set',spec:`${E.generators.kVA} kVA · ${E.generators.volts} V ${E.generators.hz} Hz · ${E.generators.rpm} rpm · 4 cyl`,count:E.generators.count}),
  emergency:Object.freeze({model:'JG-40E',kind:'Emergency generator',spec:`${E.emergency.kVA} kVA · on load within ${E.emergency.onLoadWithin} s`,count:1}),
  thruster:Object.freeze({model:'JT-75',kind:'Bow thruster',spec:`${M.bowThruster.kW} kW · ${M.bowThruster.tunnel} m tunnel · ${M.bowThruster.thrust} kN`,count:1}),
  steering:Object.freeze({model:'JS-22',kind:'Steering gear',spec:`2 × ${M.steering.kW} kW power units · ${M.steering.hardOver}`,count:1}),
  switchboard:Object.freeze({model:'JE-440',kind:'Main switchboard',spec:`${E.volts} V ${E.hz} Hz IT · 2 generator panels · shore ${E.shore.kVA} kVA`,count:1}),
  compressor:Object.freeze({model:'JC-30',kind:'Starting-air compressor',spec:'30 kgf/cm² · two 150 L bottles',count:2}),
  purifier:Object.freeze({model:'JF-1',kind:'Fuel purifier',spec:'A-heavy oil · 250 L/h',count:1}),
  firePump:Object.freeze({model:'JP-40',kind:'Fire and general-service pump',spec:`${M.fireMain.pumpM3h} m³/h at ${M.fireMain.pressure} MPa · ${M.fireMain.pumpKW} kW`,count:M.fireMain.pumps}),
  bilgePump:Object.freeze({model:'JP-25',kind:'Bilge pump',spec:`${M.bilge.pumpM3h} m³/h · ${M.bilge.pumpKW} kW`,count:1}),
  separator:Object.freeze({model:'JO-15',kind:'Oily-water separator',spec:`${M.bilge.separatorM3h} m³/h · 15 ppm`,count:1}),
  windlass:Object.freeze({model:'JW-75',kind:'Windlass',spec:`${M.anchors.windlassKW} kW · ${M.anchors.chain.diameter} mm chain`,count:2}),
  capstan:Object.freeze({model:'JW-55',kind:'Mooring capstan',spec:`${M.anchors.capstanKW} kW`,count:1}),
  rampPack:Object.freeze({model:'JH-55',kind:'Ramp hydraulic power pack',spec:`2 × ${M.ramp.pumpKW} kW · ${M.ramp.pressure} MPa`,count:1}),
  radar:Object.freeze({model:'JN-1800',kind:'Radar',spec:'X-band · 4 ft scanner · 24 nm',count:1}),
  vhf:Object.freeze({model:'JN-25',kind:'VHF radiotelephone',spec:'25 W · DSC (1998 refit)',count:1}),
  autopilot:Object.freeze({model:'JN-AP2',kind:'Autopilot',spec:'with the non-follow-up lever',count:1}),
  gsPump:Object.freeze({model:'JP-32',kind:'General-service pump',spec:`${M.fireMain.pumpM3h} m³/h · ${M.fireMain.pumpKW} kW · sea water`,count:1}),
  sanitaryPump:Object.freeze({model:'JP-15',kind:'Sanitary pump',spec:`${FERRY_LOADS.find(l=>l.id==='sanitary').kW} kW · sea-water flushing`,count:2}),
  transferPump:Object.freeze({model:'JP-5',kind:'Fuel transfer pump',spec:`${FERRY_LOADS.find(l=>l.id==='fuel-transfer').kW} kW · 2 m³/h · gear pump`,count:2}),
  sewagePump:Object.freeze({model:'JP-15D',kind:'Sewage discharge pump',spec:`${FERRY_LOADS.find(l=>l.id==='sewage').kW} kW · vortex impeller`,count:2}),
  hydrophore:Object.freeze({model:'JQ-2',kind:'Hydrophore set',spec:`${M.freshWater.hydrophoreKW} kW · ${M.freshWater.pressureTank} L tank · ${M.freshWater.cutIn}–${M.freshWater.cutOut} MPa`,count:1}),
 }),
});
/** The lines on a maker's plate for a catalogue entry (the model's text on an aluminium plate). */
export function makerPlate(key,serial=1){
 const c=JOHANSSON_MARINE.catalogue[key];if(!c)throw new RangeError('Unknown Johansson Marine machine '+key);
 return [JOHANSSON_MARINE.name.toUpperCase(),c.model,c.spec,'No. '+String(1994*100+(Object.keys(JOHANSSON_MARINE.catalogue).indexOf(key)+1)*10+serial)+' · '+JOHANSSON_MARINE.works];
}
/** The brand's wordmark as it is cast on a cover or painted on a casing. */
export const WORDMARK='JOHANSSON';
