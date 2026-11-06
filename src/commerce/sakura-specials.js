/**
 * Thuan's specials: what is chalked up on the board behind the counter at Sakura.
 * The board (interiors/sakura-specials-board.js) is drawn from this list, the counter
 * sells from it, and the bag knows which of these you eat and which you drink.
 *
 * `bite` is the morsel the hands lift (hands.js MORSEL); `cup` drinks leave nothing to
 * recycle, they go in the shop's own bin.
 */
export const SAKURA_SPECIALS=Object.freeze([
 {id:'karaage',name:'Karaage',jp:'からあげ',note:'Fried chicken, hot from the case',price:180,kind:'food',bite:'karaage'},
 {id:'pork-tamago',name:'Pork tamago onigiri',jp:'ポーク玉子',note:'Spam and egg rice ball',price:200,kind:'food',bite:'rice'},
 {id:'andagi',name:'Sata andagi',jp:'サーターアンダギー',note:'Island doughnuts, two',price:100,kind:'food',bite:'dashimaki'},
 {id:'iced-coffee',name:'Iced coffee',jp:'アイスコーヒー',note:'Brewed this morning, on ice',price:150,kind:'drink',cup:true},
 {id:'iced-sanpin',name:'Iced sanpin tea',jp:'さんぴん茶',note:'Jasmine tea, on ice',price:120,kind:'drink',cup:true},
].map(Object.freeze));
export const SPECIAL_BY_NAME=Object.freeze(Object.fromEntries(SAKURA_SPECIALS.map(s=>[s.name,s])));
/** Sakura's till hours for the hot case and the board: 09:00 to 20:00. */
export const specialsOpen=minutes=>{const m=((minutes%1440)+1440)%1440;return m>=540&&m<1200;};
