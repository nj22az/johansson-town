import {householdAtHome,householdTitle} from './island-households.js';

// The walking residents' playable rooms. Historical street-entry keys survive only for archived layouts.
const ROOMS=[
 {home:'kitahama-1',entry:'one',number:'1'},
 // Nhung's, with Kōji and Riku (phase 3 of docs/CAST-CONSOLIDATION.md); the archived street entry is her old one.
 {home:'kitahama-3',entry:'two',number:'3'},
 {home:'resident-home-kenji',entry:'three',number:'2'},
 {home:'kitahama-2',entry:'four',number:'2'},
 {home:'koban',entry:'four'},
 {home:'office',entry:'five'},
];
export const HOUSEHOLDS=Object.freeze(ROOMS.map(room=>{
 const h=householdAtHome(room.home);
 return Object.freeze({...room,id:h.entranceSiteId,homeId:h.home,residents:h.residents,address:h.address,title:householdTitle(h)});
}));
/** Existing saves and old room links resolve to the same surviving entrance. */
export const HOME_ALIASES=Object.freeze({
 'home-market':'home-kitahama-flat-2','home-ferry':'home-kitahama-flat-3',
 // Removed homes land at the retained public place their records go to (roster.js RETIRED_HOMES): the housing project's
 // nine (18 October 2026) and phase 4's (the three Kitahama houses, the two Nishi houses, 1 Front-Row Yard, the Chinen
 // house on Kitano-jima; the flat over the former post office at the terminal, where its post went; Barfly's room at the bar).
 ...Object.fromEntries(['kitahama-4','kitahama-5','kitahama-6','kitahama-7','kitahama-9','kitahama-10','kitahama-11','kitahama-12','nakasone','miyagi','arakaki','yonamine','kinjo','oshiro','kitano-3'].flatMap(id=>[[id,'community-kitchen'],['home-'+id,'community-kitchen']])),
 'resident-home-aya':'community-kitchen','resident-home-reiko':'community-kitchen','resident-home-bus-driver':'community-kitchen',
 // The mayor's office went on 21 October 2026 (briefs/town-hall-zone.md, phase M): a save inside it, a visit to it or a
 // target at its door lands at the Community Hall's, the community kitchen, where the town's register is.
 'mayor-office':'community-kitchen',
 shimabukuro:'ferry-terminal','home-shimabukuro':'ferry-terminal','home-izakaya':'izakaya','home-nakamura':'nakamura',
 'yuri-home':'resident-home-thuan','resident-home-nao':'resident-home-thuan',
 'resident-home-thao':'resident-home-thuan','resident-home-chin':'resident-home-thuan',
 'resident-home-tetsuo':'resident-home-kenji',
 'resident-home-officer-mori':'koban','resident-home-harbour-master':'office',
});
export const canonicalHomeId=id=>HOME_ALIASES[id]||id;
export const householdFor=name=>HOUSEHOLDS.find(h=>h.residents.includes(name));
export const householdAt=site=>HOUSEHOLDS.find(h=>h.id===canonicalHomeId(site?.id)||h.homeId===site?.plot)||householdFor(site?.homeOwner);
export const householdNames=site=>site?.homeOwners||site?.residents||householdAt(site)?.residents||(site?.homeOwner?[site.homeOwner]:[]);
