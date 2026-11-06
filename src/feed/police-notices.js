import {seeded} from './storyteller.js';
import {belongingsOf} from '../people/belongings.js';
import {feedPlace} from './places.js';
/** The board draws from the storyteller's people, belongings and places, not invented anonymous clutter.
 * A fixed edition stays put while a visitor reads; the references also supply story seeds to Studio. */
export function stationNotices(edition='minato-1997'){
 const rng=seeded('station-notices:'+edition),owner=rng.pick(['Nhung','Chin','Thao']),belonging=rng.pick(belongingsOf(owner));
 const books=feedPlace('books');
 return [
  {id:'lost-property',who:owner,why:belonging.tale,source:'belongings',belonging,place:'police-station',jp:'落とし物',jpDetail:'心当たりは窓口へ',text:`Lost property: ${owner}’s ${belonging.what}. ${belonging.tale} Ask at the counter.`,story:{genre:'lost',owner,thing:belonging.what,place:'police-station'}},
  {id:'missing-cat',who:'Nhung',why:'Tama belongs in the bookshop story catalogue; Nhung is looking by the fish crates.',source:'places',place:books.id,jp:'猫を探しています',jpDetail:'タマ・茶トラ',text:'Missing: Tama, the ginger cat from Front-Row Books. Nhung suggests checking the fish crates at the quay.',story:{owner:'Nhung',thing:'Tama the cat',place:books.id}},
 ];
}
export const stationNoticeText=()=>['Yesterday’s traffic accidents: 0.','Maritime-accident prevention month: wear a lifejacket.','Fasten seat belts in every seat.',...stationNotices().map(n=>n.text),'In an emergency, dial 110. For directions, ask at the window.'].join('\n');
