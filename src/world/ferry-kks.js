/**
 * KKS tags for the Minato Maru (the creator, 2026-10-13: "Use correct KKS codes for the drawings"): the VGB
 * Kraftwerk-Kennzeichensystem, the identification system of power plants, applied to the ship as a plant, so every
 * system, machine, valve, tank, instrument and cable on her drawings carries one tag that the yard, the crew and the
 * game read the same way. Structure and numbering rules follow VGB-B 105 as restated in Eskom's KKS Coding Standard
 * 240-93576498 (2016), the one open text of the rules:
 *
 *   process-related code  =  G  F0 F1F2F3 FN   A1A2 AN A3   B1B2 BN
 *   breakdown level          0  1 system        2 equipment   3 component
 *   example                  1  1 XJA   10      AP   001      -M  01     → ship 1, port main engine, its pump No.1, its motor
 *
 * - G (total plant): 1 = the Minato Maru; 0 = the shore, which is plant-common (the quay kiosk's shore supply).
 * - F0 subdivides identical systems that are coded separately: 0 common, 1 port main engine, 2 starboard main engine,
 *   3 generator No.1, 4 generator No.2, 5 the emergency generator.
 * - F1F2F3 is the function key from the VGB key part (KKS_FUNCTION_KEYS below says which keys were read in the
 *   published key tables and which are the yard's reading of the key part's lettering, to be confirmed against it).
 * - FN numbers subsystems in decades in the direction of flow (10, 20, 30; parallel streams 21, 22).
 * - A1A2 AN: the equipment unit (AP pump, AA valve, BB tank, AN compressor or fan, AT filter or separator, AC heat
 *   exchanger, BR pipe, C* measuring circuits) and its number, counted by the key part's rules: valves 101–199 with an
 *   electric actuator, 201–299 pneumatic, hydraulic or solenoid, 401–499 drain and vent, 501–599 hand-operated,
 *   901–999 safety; measuring circuits 001–099 remote analogue, 301–399 remote binary, 501–599 local.
 * - B1B2 BN: the component: -M01 the motor, MK01 the coupling, KP01 the pump, KA01 the valve body, KC01 the heat
 *   exchanger, KD01 the vessel, MG01 the gear.
 * - Cables: the code of the first destination in alphabetical order, then a four-digit number: 1001–1999 AC ≤ 1 kV,
 *   2001–2499 110/220 V DC power, 4501–5999 control ≤ 60 V DC, 7001–7999 measuring, 8001–8999 communication.
 */
const fn=(code,name,source,note='')=>[code,Object.freeze({code,name,source,note})];
/**
 * The function keys the ship uses. `source` 'VGB' = read in the published key tables (VGB-B 105 as quoted by the
 * Eskom standard, the Siemens abridged key, the Voith Siemens handbook); 'yard' = the yard's allocation by the key
 * part's own lettering (the X group letters its subsystems as the M group does: A machine, B turbocharger, G liquid
 * cooling, H charge-air cooling, J starting, K gear, L air intake, N fuel, R exhaust, V lubricant, X hydraulics,
 * Y control; MBJ, MBL, MBN, MBR, MBV, MKV are published, XJA, XJB, XJG, XJH, XJK, XJN are published), to be
 * confirmed against the full key part before a real yard cuts steel.
 */
export const KKS_FUNCTION_KEYS=Object.freeze(new Map([
 // X: heavy machinery (not main machine sets): XJ the diesel engine plant.
 fn('XJA','Diesel engine','VGB'),fn('XJB','Turbocharger, blower','VGB'),fn('XJG','Liquid cooling system (jacket water)','VGB'),
 fn('XJH','Charge-air cooling system','VGB'),fn('XJJ','Starting system (compressed air)','yard','MBJ is the gas turbine’s starting equipment'),
 fn('XJK','Transmission gear between prime mover and driven machine (the reverse-reduction gear)','VGB'),fn('XJL','Air intake system','yard','MBL is the gas turbine’s air intake'),
 fn('XJN','Fuel system (at the engine)','VGB'),fn('XJR','Exhaust gas system','yard','MBR is the gas turbine’s exhaust'),fn('XJV','Lubricating oil system (at the engine)','yard','MBV and MKV are the lubricant supply systems of the M group'),
 fn('XJY','Control and protection equipment (the engine’s own)','yard','the Y letter is the key part’s for control equipment'),
 // M: main machine sets: MK the generator.
 fn('MKA','Generator (stator, rotor, integral cooling)','VGB'),fn('MKC','Generator excitation','VGB'),fn('MKY','Generator control and protection','yard'),
 // E: conventional fuel supply: EG liquid fuels (light fuel oil: A-heavy oil is a marine distillate).
 fn('EGA','Fuel oil receiving (bunkering)','yard','EG is the key part’s light-fuel-oil supply'),fn('EGB','Fuel oil storage','yard'),fn('EGC','Fuel oil transfer','yard'),fn('EGD','Fuel oil treatment (purifier) and service tank','yard'),
 // P: cooling water: PA main (sea water), PC auxiliary (closed, fresh).
 fn('PAB','Main cooling water (sea water): sea chests, strainers and distribution','VGB','PA is the key part’s main cooling water system'),
 fn('PCB','Auxiliary cooling water (fresh): the central cooler circuit','VGB','PC is the key part’s auxiliary cooling water'),
 // G: water supply and disposal.
 fn('GAA','Raw water (sea water) supply: the general-service suction','VGB'),fn('GHA','Sea-water distribution not for drinking: ballast','VGB','GH is the key part’s distribution not for drinking water'),
 fn('GHB','Sea-water distribution not for drinking: sanitary flushing','VGB'),fn('GKA','Drinking water receiving (the water lorry’s connection) and storage','VGB'),fn('GKB','Drinking water distribution (the hydrophore)','VGB'),
 fn('GMA','Process drainage: the bilge system','VGB','GM is the key part’s process drainage'),fn('GNA','Process drains treatment: the oily-water separator','VGB'),
 fn('GQA','Domestic waste water collection: the sewage holding tank','VGB'),fn('GRA','Domestic waste water disposal: the discharge to shore','VGB'),
 // S: ancillary systems.
 fn('SGA','Fire water system: the fire main','VGB'),fn('SGJ','CO₂ fire extinguishing system','VGB'),fn('SGP','Portable fire extinguishers','yard'),
 fn('SCA','Compressed air generation (the starting-air compressors and bottles)','VGB'),fn('SCB','Compressed air distribution','VGB'),
 fn('SAA','Heating, ventilation and air conditioning: the engine room','VGB'),fn('SAB','Heating, ventilation and air conditioning: the car deck','VGB'),fn('SAC','Heating, ventilation and air conditioning: the accommodation','VGB'),
 fn('SMA','Cranes and hoists: the chain block, the davit','VGB'),
 // X: ship systems outside the power-plant key part, allocated by the yard under X (heavy machinery, not main machine sets).
 fn('XSA','Steering gear (hydraulic)','yard','no key-part entry for a ship’s steering gear'),fn('XSB','Bow ramp hydraulics','yard'),fn('XSC','Bow thruster','yard'),fn('XSD','Windlasses and the mooring capstan','yard'),
 // B: power transmission and auxiliary power supply.
 fn('BAA','Generator leads','VGB'),fn('BRA','Low-voltage distribution: the main switchboard, 440 V','VGB'),fn('BRB','Low-voltage distribution: the 105 V lighting board','VGB'),
 fn('BRV','Emergency power generating equipment: the emergency switchboard','VGB'),fn('BRU','Converters: the battery chargers','VGB'),fn('BRT','Low-voltage transformers (440/105 V)','yard','BBT is the key part’s medium-voltage auxiliary transformer; BRT by the same lettering'),
 fn('BTA','Direct-current supply: the 24 V batteries','yard','BT is the key part’s DC group'),fn('BQA','Shore supply (plant-common)','yard'),
 // C: instrumentation and control.
 fn('CMA','Engine control and alarm system (the control console)','yard'),fn('CSA','Fire detection and alarm','yard'),fn('CTA','Navigation and radio equipment','yard'),
 // U: structures (the location code): the ship’s own spaces.
 fn('UMA','Machinery spaces: the engine room','VGB','UM is the key part’s structures for main machine sets'),fn('UMB','Machinery spaces: the auxiliary machinery room, workshop and store','VGB'),
 fn('UMC','Machinery spaces: the steering-gear room and the shaft space','VGB'),fn('UZA','The car deck and the casings','VGB','UZ is the key part’s structures for transport and traffic'),fn('UYA','The accommodation','VGB','UY is the key part’s general service structures'),
]));
/** The equipment unit keys used (A1A2), from the key part. */
export const KKS_EQUIPMENT_KEYS=Object.freeze({AA:'Valve or damper, with its drive',AC:'Heat exchanger',AE:'Turning, travelling, lifting and slewing gear (winches, hoists)',AG:'Generator unit',AH:'Heating, cooling and air-conditioning unit',AN:'Compressor or fan unit',AP:'Pump unit',AT:'Cleaning, filtering or separating equipment',
 BB:'Storage equipment: vessel or tank',BN:'Jet pump, ejector',BQ:'Hanger, support, rack',BR:'Piping, ductwork',CE:'Electrical measurement',CF:'Flow measurement',CL:'Level measurement',CP:'Pressure measurement',CS:'Speed measurement',CT:'Temperature measurement',
 BS:'Silencer',CQ:'Analysis, quality measurement',GS:'Switchgear panel, distribution board section',GT:'Transformer',GU:'Converter, charger',GB:'Battery',CH:'Manual input (a call point, a push button)'});
/** The component keys used (B1B2). */
export const KKS_COMPONENT_KEYS=Object.freeze({'-M':'Electric motor','-G':'Generator, power source','-Q':'Power circuit breaker, contactor','-F':'Protective device (fuse, relay)','-P':'Measuring instrument (meter)','-H':'Indicating device (lamp)',KP:'Pump',KA:'Valve body',KC:'Heat exchanger',KD:'Vessel',KF:'Filter element',MG:'Gear',MK:'Coupling',MT:'Turbine (the turbocharger’s)',MM:'Motor, not electric (the diesel engine as a drive)'});
/** The F0 subdivisions of identical systems aboard. */
export const KKS_F0=Object.freeze({common:0,mainP:1,mainS:2,gen1:3,gen2:4,emergency:5});
/** The AN counting rules of the key part (valves and measuring circuits). */
export const KKS_AN=Object.freeze({valve:Object.freeze({control:[1,99],electric:[101,199],pneumatic:[201,299],tapping:[301,399],drain:[401,499],hand:[501,599],mechanical:[601,699],safety:[901,999]}),
 measure:Object.freeze({remote:[1,99],binary:[301,399],test:[401,499],local:[501,599]}),cable:Object.freeze({ac:[1001,1999],dc:[2001,2499],controlHigh:[2501,3999],fire:[4001,4499],control:[4501,5999],ct:[6001,6499],vt:[6501,6999],measuring:[7001,7999],comms:[8001,8999]})});
const pad=(n,w)=>String(n).padStart(w,'0');
/**
 * A tag: `kks({f0, fn:'XJA', n:10, eq:'AP', no:1, cmp:'-M', cno:1})` → '11XJA10 AP001 -M01'. `g` is the plant (1 the ship).
 * Throws on a function or equipment key the ship does not use, or a number outside its rule.
 */
export function kks({g=1,f0=0,fn,n=10,eq=null,no=null,a3='',cmp=null,cno=null,rule=null}){
 if(!KKS_FUNCTION_KEYS.has(fn))throw new RangeError('KKS: unknown function key '+fn);
 if(!(n>=0&&n<=99))throw new RangeError('KKS: FN '+n);
 let s=`${g}${f0}${fn}${pad(n,2)}`;
 if(eq){if(!(eq in KKS_EQUIPMENT_KEYS))throw new RangeError('KKS: unknown equipment key '+eq);
  if(rule){const r=(eq==='AA'?KKS_AN.valve:KKS_AN.measure)[rule];if(!r||no<r[0]||no>r[1])throw new RangeError(`KKS: ${eq}${no} is not a ${rule} number`);}
  s+=` ${eq}${pad(no,3)}${a3}`;}
 if(cmp){if(!(cmp in KKS_COMPONENT_KEYS))throw new RangeError('KKS: unknown component key '+cmp);s+=` ${cmp}${pad(cno??1,2)}`;}
 return s;
}
/** The parts of a tag, or null: {g, f0, fn, n, eq, no, a3, cmp, cno}. */
export function kksParse(tag){
 const m=/^(\d)(\d)([A-Z]{3})(\d{2})(?: ([A-Z]{2})(\d{3})([A-Z]?))?(?: (-?[A-Z]{1,2})(\d{2}))?$/.exec(String(tag).trim());
 if(!m)return null;
 return {g:+m[1],f0:+m[2],fn:m[3],n:+m[4],eq:m[5]||null,no:m[6]?+m[6]:null,a3:m[7]||'',cmp:m[8]||null,cno:m[9]?+m[9]:null};
}
const F0_NAMES=['common','port main engine','starboard main engine','generator No.1','generator No.2','emergency generator'];
/** A tag read out as the crew reads it: '11XJA10 AP001 -M01' → 'ship · port main engine · Diesel engine 10 · pump unit 001 · its electric motor 01'. */
export function kksExplain(tag){
 const p=kksParse(tag);if(!p)return null;const f=KKS_FUNCTION_KEYS.get(p.fn);
 const parts=[p.g===1?'Minato Maru':'shore',F0_NAMES[p.f0]||'system '+p.f0,(f?f.name:p.fn)+' '+pad(p.n,2)];
 if(p.eq)parts.push((KKS_EQUIPMENT_KEYS[p.eq]||p.eq).toLowerCase()+' '+pad(p.no,3)+p.a3);
 if(p.cmp)parts.push((KKS_COMPONENT_KEYS[p.cmp]||p.cmp).toLowerCase()+' '+pad(p.cno,2));
 return parts.join(' · ');
}
/** A cable number: the destination's tag (the first in alphabetical order of the two ends) and a counting number in the class's range. */
export function kksCable(a,b,cls,i){
 const r=KKS_AN.cable[cls];if(!r)throw new RangeError('KKS: cable class '+cls);const n=r[0]+i;if(n>r[1])throw new RangeError('KKS: cable number '+n+' outside '+cls);
 const dest=[a,b].sort()[0];const p=kksParse(dest);return `${p.g}${p.f0}${p.fn}${pad(p.n,2)} ${n}`;
}
