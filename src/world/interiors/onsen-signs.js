/**
 * Umi-no-yu's printed Japanese: every sign, curtain and caption that is part of the
 * scenery, with what it says in English, where it hangs and why it reads the way it does.
 *
 * The words live here, in one place, so a reader of Japanese can check them at a glance
 * (and the tests can), and so the game, the storyteller and the film letter them the same
 * way. This file is scenery for scripts/english-inventory.mjs: the controls and the
 * narration stay English, the bathhouse speaks Japanese, as a 1990s Okinawan bath would.
 *
 * Period: everything here could have been painted, printed or broadcast between 1985 and
 * 1999. Nothing is a real company's name or mark.
 */
const plain=o=>Object.freeze(o);

export const ONSEN_SIGNS=Object.freeze({
 kanban:plain({jp:'海の湯',mark:'♨',sub:'UMI-NO-YU · PUBLIC BATH',en:'Umi-no-yu, "the sea bath": a town bath (公衆浴場) that heats sea water',
  where:'The name board on the front face of the porch beam, over the street door (park-onsen.js, "Umi-no-yu sign"): it reads whole from the street.',
  why:'A bathhouse names itself in brushed kanji on a dark board; the romaji line under it is for the visitors off the ferry. It says public bath, not hot spring: Okinawa had no natural hot springs in the 1990s, and under the Hot Spring Law (温泉法) a bath that heats sea water may not call itself 温泉. ♨ is every bath’s mark, so it stays.'}),
 notice:plain({jp:'海の湯',en:'Umi-no-yu',
  where:'The heading of the notice board by the path ("Umi-no-yu notice"); the hours and prices under it are in English for the ferry visitors.',
  why:'The same name as the board over the door, so you know the notice belongs to this bath.'}),
 noren:plain({jp:'ゆ',mark:'♨',en:'"Hot water": what every bathhouse curtain says',
  where:'The indigo noren over the street door.',
  why:'ゆ in big hiragana is the sign of a public bath all over Japan; when the noren is hung out, the bath is open.'}),
 /** The two noren between the lobby and the changing rooms (onsen-lobby.js): the women's side west, the men's east. */
 norenWomen:plain({jp:'女',mark:'ゆ',bath:'女湯',colour:'#9c2f2c',side:'women',en:'"Women": the women’s side (女湯)',
  where:'The crimson noren over the west doorway from the lobby, beside the bandai.',
  why:'Every town bath of the period was two baths: 男湯 and 女湯, each with its own curtain, changing room and lockers. The women’s noren is red or crimson, with 女 in big white kanji, so nobody walks through the wrong one.'}),
 norenMen:plain({jp:'男',mark:'ゆ',bath:'男湯',colour:'#1f3558',side:'men',en:'"Men": the men’s side (男湯)',
  where:'The indigo noren over the east doorway from the lobby, on the massage chair’s side.',
  why:'The men’s noren is indigo, with 男 in big white kanji: the same cloth as the street noren.'}),
 /** The printed card on the breaker board's door (onsen-electrics.js). */
 staffOnly:plain({lines:Object.freeze(['関係者以外','さわらないでください']),en:'Staff only: please do not touch',
  where:'A printed white card on the shut door of the breaker board behind the bandai.',
  why:'A bath keeps its board where only the keeper reaches it and says so: children and wet hands stay off it. Printed, red on white, the way a board was labelled at its 1987 inspection.'}),
 /** The sign over the door from the bath hall to the rock bath (onsen.js). */
 swimZone:plain({lines:Object.freeze(['水着ゾーン','混浴 (水着着用)']),en:'Swimwear zone · mixed bathing (in swimwear)',sub:'SWIMWEAR ZONE · MIXED, IN SWIMWEAR',
  where:'On the header over the glass doorway from the bath hall to the rock bath, facing the bath hall, so you read it before you step out.',
  why:'The rock bath is shared by both sides, the way a 1980s–90s health land (健康ランド) or resort bath kept a swimwear zone (水着ゾーン): men and women in swimsuits and bath trunks, families together, nobody bare.'}),
 doorGlass:plain({jp:'ゆ',en:'"Hot water", left clear in the frosted lower glass of the street doors',
  where:'The lower pane of each of the two wooden sliding doors at the street: inside (onsen-front.js) and on the model outside (park-onsen.js).',
  why:'A bathhouse door of the eighties and nineties had its lower glass frosted, so nobody on the street sees into the genkan, with ゆ left clear in it to read from the street. From the genkan it reads backwards, as it does in every bathhouse.'}),
 lostProperty:plain({jp:'忘れ物',en:'Lost property',
  where:'A paper tag on a string round the crook of the umbrella in the stand by the street door.',
  why:'Higa-san tags whatever is left behind and keeps it where its owner will walk past it.'}),
 fee:plain({lines:Object.freeze(['大人 ¥300','中人 ¥150・小人 ¥80','タオル ¥100・牛乳 ¥100']),en:'Adults ¥300 · children ¥150, under-sixes ¥80 · towel ¥100, milk ¥100',
  where:'On the front of the bandai counter, below the top and facing the genkan ("Fee sign"), where it never stands between Miss Higa and the people she is talking to.',
  why:'What the bandai sells, readable from the shoe lockers while you count your coins. A bath price board always lists 大人・中人・小人 (adults, school children, under-sixes); the ¥150 matches the notice outside.'}),
 milk:plain({jp:'牛乳',price:'各 ¥100',en:'Milk, ¥100 each',
  where:'The header over the red cooler’s glass, in the lobby’s east corner.',
  why:'Bath coolers said 牛乳 over the white, coffee and fruit milk alike; one price for all three, so the coins are easy.'}),
 bathBoard:plain({jp:'本日の湯',en:'Today’s bath',
  where:'The wooden board on the lobby side of the changing-room wall.',
  why:'The day’s additive in the indoor bath, written top to bottom, changed every morning.'}),
 /** The day's bath in Japanese, by weekday (0 = Sunday), as written on the board. */
 dailyBath:Object.freeze(['月桃湯','ゆず湯','フーチバー湯','ヒノキ湯','塩湯','しょうが湯','シークヮーサー湯']),
 poster:plain({title:'南の島 湯めぐり',line:'港の湯・海の湯・森の湯',en:'Southern-island bath tour: Minato-no-yu, Umi-no-yu, Mori-no-yu',
  where:'The travel poster on the lobby side of the changing-room wall.',
  why:'The ferry line’s 1997 poster for the island’s three baths.'}),
 /** The faces of the lobby's summer fans (onsen-props.js, "Uchiwa rack"): four hand fans and the giant one. */
 uchiwa:Object.freeze([
  plain({id:'goldfish',jp:'金魚',en:'Goldfish',why:'The commonest summer print of all: cool water to look at while you fan yourself.'}),
  plain({id:'asagao',jp:'朝顔',en:'Morning glories',why:'The summer flower every child grows in a pot over the school holidays.'}),
  plain({id:'hanabi',jp:'花火',en:'Fireworks',why:'Printed for the harbour’s August fireworks night, and kept.'}),
  plain({id:'sakura-ad',jp:'さくら商店',sub:'日用品・食料品',en:'Sakura Shōten: daily goods and groceries',
   why:'A shop’s summer giveaway fan (広告うちわ), handed out at the till in July. Umi-no-yu buys its soap and shampoo from Sakura Shōten, so Miss Higa gets a bundle every year.'}),
  plain({id:'harii',jp:'ハーリー',sub:'協賛 海の湯',en:'Hārī (the harbour dragon-boat race); sponsor: Umi-no-yu',giant:true,
   why:'The sponsors’ giant fan from the harbour Hārī every May: Umi-no-yu is a sponsor, and the fan is too big to use politely, so it hangs by the tatami.'}),
 ]),
 /** Page 5's paper war (onsen-lobby.js, onsen-props.js): taped to the crimson noren from both sides, and one on her book. */
 paperWar:plain({
  reserved:plain({jp:'予約席',line:'一週間ためた男のために',en:'RESERVED FOR THE MAN WHO SAVED ALL WEEK',by:'Mr Fujita',
   where:'Taped across the slit of the crimson noren on the lobby side, at his eye level: he seals their gate.',
   why:'Written in black marker on the back of a page torn off the lobby’s calendar, the way anyone in the eighties made a sign in a hurry.'}),
  hairRights:plain({jp:'髪の権利宣言',line:'ドライヤーは三台同時に!',en:'HAIR RIGHTS',by:'Thao, Thuan and Nhung',
   where:'Taped on the changing-room side of the crimson noren, over the slit: their manifesto, answering his.',
   why:'Drawing paper and Nhung’s glitter pens (she sold them both the pens): pink and gold letters, three dryers drawn like flowers.'}),
  flyer:plain({en:'A copy of HAIR RIGHTS, slid onto the bandai',where:'On Miss Higa’s account book, across the right-hand page; she writes round it.',
   why:'Page 5: one of the signs lands on her book and she does not look up.'}),
 }),
 ledger:plain({jp:'金銭出納帳',en:'Cash book',columns:Object.freeze(['月日','摘要','入金','出金','残高']),
  // Today's page in pencil: 38 adult baths, 6 towels and 21 milks in at the prices on the board; the soap from Sakura Shōten out.
  rows:Object.freeze([['8/14','入浴 大人 38','11,400','','11,400'],['','タオル 6','600','','12,000'],['','牛乳 21','2,100','','14,100'],['','石鹸 さくら商店','','1,850','12,250']].map(r=>Object.freeze(r))),
  where:'Open on the bandai top in front of Miss Higa ("Account book"), the top of the page away from her.',
  why:'Every bathhouse keeper does the day’s takings in a cash book: baths, towels and milk in, soap and the boiler’s oil out. She writes in pencil so she can rub out.'}),
 tv:plain({
  nightGame:plain({inning:'7回裏',away:'鹿',home:'沖',score:Object.freeze({away:2,home:3}),count:Object.freeze({balls:2,strikes:1,outs:1}),en:'Bottom of the seventh, Okinawa 3, Kagoshima 2',
   why:'A 1990s baseball broadcast keeps a small score box in the corner: the two teams by one kanji each, the inning, and the ball, strike and out lamps.'}),
  // The story's held score cards (onsen-lobby.js LOBBY_TV_STATES): the visitors on top, as the broadcast lists them.
  score07:plain({inning:'6回表',away:'鹿児島',home:'沖縄',score:Object.freeze({away:7,home:0}),en:'Top of the sixth: Kagoshima 7, Okinawa 0',
   why:'The full-screen score card a 1990s night-game broadcast put up between batters: the inning, each side’s prefecture, the runs.'}),
  score011:plain({inning:'8回表',away:'鹿児島',home:'沖縄',score:Object.freeze({away:11,home:0}),en:'Top of the eighth: Kagoshima 11, Okinawa 0',
   why:'The same card two innings later. Fujita’s team is Okinawa.'}),
  weather:plain({title:'沖縄地方 あすの天気',forecast:'晴れ 31℃',en:'Okinawa region, tomorrow’s weather: sunny, 31 °C',
   why:'The evening forecast card, the way the regional news drew it.'}),
 }),
});
