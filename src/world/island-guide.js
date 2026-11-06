import {flightTimes,islandState,stamp} from '../island/services.js';

/**
 * The island guide's records (the studio's town-studio/island-guide/plan.md, batch 2): one entry for each place a
 * visitor can go on Kitano-jima and on Johansson Island beyond Minato's main street, as Ms Ganaha tells it at the Port
 * Terminal window (people/ganaha.js).
 *
 * She only says what the world holds. Each record's `says` is her answer, and `checks` names the lines in the game's
 * own files that make it true: tests/island-guide.test.mjs fails if any of them changes, so she can never describe a
 * place the town no longer has. Places that are planned but not built (live turtles, the coastal bus, the Hoshizaki
 * guesthouse, the summer flight, a lighthouse keeper) are never promised: where she mentions them, she says they are
 * not there yet.
 *
 *   id, name   the place
 *   island     'kitano' (Kitano-jima) or 'johansson' (Johansson Island)
 *   kind       what it is for: 'beach', 'view', 'shrine', 'shop', 'village', 'travel', 'bath', 'walk'
 *   says       her answer: a sentence, or a function of what the town has funded (placeSays: the flights and the
 *              coastal bus change when their projects are done, island/services.js)
 *   checks     [file, text] pairs: the text must be in that file
 */
const listed=times=>times.slice(0,-1).join(', ')+' and '+times.at(-1);

export const ISLAND_PLACES=Object.freeze([
 // Kitano-jima: the airport island, across the strait.
 {id:'coral-bay',name:'Coral Bay',island:'kitano',kind:'beach',
  says:'Five minutes down through the palms from the airport, love. White sand and two benches. Plenty of people take the morning boat just for that. Swimming only between the palms, the notice says, and mind the last ferry: it goes after the evening flight.',
  checks:[['src/world/airport-district.js','Swimming between the palms only'],['src/world/airport-district.js','Last ferry to Minato leaves after the evening flight'],['src/world/airport-district.js','Coral Bay, five minutes down through the palms'],['src/world/airport-district.js','Plenty of people come over on the morning ferry just for this']]},
 {id:'coral-bay-bar',name:'Coral Bay Bar',island:'kitano',kind:'shop',
  says:'The little bar on the sand at Coral Bay: a cold bottle of Umineko lager for ¥300, or shikuwasa juice for ¥150. Sakura Trading sends the beer over on our boat.',
  checks:[['src/world/airport-district.js','Umineko lager, cold bottle'],['src/world/airport-district.js','shikuwasa']]},
 {id:'turtle-cove',name:'Turtle Cove',island:'kitano',kind:'beach',
  says:'Over the hill past Hinata, round the east side. Green turtles come in on the rising tide to graze, they say. I have never had the patience to wait for one; you bring a book.',
  checks:[['src/world/airport-district.js','Green turtles come in on the rising tide to graze']]},
 {id:'hinata-lookout',name:'Hinata lookout',island:'kitano',kind:'view',
  says:'Up the trail from the airport to the top of Hinata. You can count the town from there: the harbour office, the red roofs, the park and the residential streets. Go at the end of the afternoon.',
  checks:[['src/world/airport-district.js','you can count the town'],['src/world/airport-district.js','Hinata lookout']]},
 {id:'airport',name:'Kitano-jima airport',island:'kitano',kind:'travel',
  says:({flights})=>`The commuter plane to Naha goes at ${listed(flights)}. A same-day return is ¥800, at the counter by the departures board; check-in closes ten minutes before. If it rains hard they stop the planes, and your ticket keeps.`,
  checks:[['src/island/services.js','Flights are suspended in heavy rain'],['src/world/island-landscape.js','Airport tickets and check-in'],['src/island/services.js','state.yen<800'],['src/island/services.js','closes ten minutes before departure.']]},
 {id:'kiosks',name:'The airport kiosks',island:'kitano',kind:'shop',
  says:'Three kiosks on the plaza: Departure Coffee for a ¥100 coffee, the Noodle Kitchen for a ¥280 lunch, and Island Crafts, with woven souvenirs at ¥400.',
  checks:[['src/world/airport-district-plan.js',"Departure Coffee',item:'Departure coffee',price:100"],['src/world/airport-district-plan.js',"Noodle Kitchen',item:'Airport noodle lunch',price:280"],['src/world/airport-district-plan.js',"Island Crafts',item:'Woven island souvenir',price:400"]]},
 {id:'kitano-hamlet',name:'Kitano hamlet',island:'kitano',kind:'village',
  says:'Your own lane, Chief, up from the landing: you know your house better than I do. Across from it the Shiroma house is Kai’s, the line hand’s; he rents it from the Shiromas in Naha and is on the pier for every call.',
  checks:[['src/world/kitano-hamlet.js','Go home'],['src/world/kitano-hamlet.js','let it to Kai, the line hand'],['src/people/cast.js','rents the Shiroma house across the lane from the pier']]},

 // Johansson Island, beyond Main Street.
 {id:'umi-no-yu',name:'Umi-no-yu',island:'johansson',kind:'bath',
  says:'The sea-water bath in Harbour Park, opposite Sakura. Follow the park path straight on from the gate to its door. Ten in the morning till ten at night, ¥300 for adults and ¥150 for children. The footbath keeps the bath’s hours and is free for residents. Grandmother Higa owns it and keeps the counter by day; her granddaughter, Miss Higa, has it in the evenings.',
  checks:[['src/world/island-plan.js','The park opposite Sakura: Umi-no-yu'],['src/world/park.js','Straight on from the gate is Umi-no-yu'],['src/world/park-onsen.js','Bath 10:00–22:00, adults ¥300, children ¥150'],['src/world/park-onsen.js','The footbath keeps the bath’s hours and is free for residents'],['src/people/cast.js','owns Umi-no-yu and keeps its bandai by day'],['src/people/cast.js','keeps the bandai at Umi-no-yu in the evenings']]},

]);

export const islandPlaces=island=>ISLAND_PLACES.filter(p=>p.island===island);
/** Her answer for a place, with what the town has funded (state: the player's saved state, or {} for none). */
export function placeSays(place,state={}){
 if(typeof place.says!=='function')return place.says;
 return place.says({flights:flightTimes(state).map(stamp),bus:islandState(state).projects.includes('bus')});
}
export const islandPlace=id=>ISLAND_PLACES.find(p=>p.id===id)||null;
