import * as THREE from '../../../vendor/three.module.js';
import {pinLobbyChannel,lobbyChannelPin,LOBBY_CHANNELS,ONSEN_DOORWAYS} from './onsen-lobby.js';
import {ONSEN_SIGNS} from './onsen-signs.js';
import {createLightPools} from '../light-pools.js';
import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import {ONSEN_CHAIR,CHAIR as CHAIR_AT,MASSAGE_CHAIR} from './onsen-chair.js';

/** The massage chair's seat front (room x, metres; onsen-chair.js, from the chair's card), for everything that read it here. */
export {MASSAGE_CHAIR};

/**
 * The chair's coin timer (コインタイマー) on the front of its right arm: ¥100 buys ten minutes, counted down on a red LED
 * readout, minutes and seconds, over the 運転中 lamp and the coin slot. The readout is the chair's own state (chairTimer):
 * a coin starts it at 10:00, it counts down only while the chair has power and runs, and at 0:00 the chair stops. Like any
 * coin timer of the period it keeps the paid time in a relay, so a power cut forgets it: the relay drops out, the readout
 * goes dark and the coin is gone; when the power comes back the chair stays still until somebody pays again.
 */
export const CHAIR_TIMER=Object.freeze({coin:100,seconds:600,name:'Massage chair timer display',
 for:'Whoever sits in the chair, to see how much of their hundred yen is left; and Miss Higa, who can read it from the bandai when somebody says the chair cheated them.',
 why:'On the coin box at the front of the right arm, at the sitter’s right hand and facing the lobby, so the sitter and the people waiting both see it.',
 period:'A 1994 coin-operated chair: a grey steel coin box with a coin slot, a red 運転中 lamp and a four-digit red seven-segment LED, the cheap readout of every coin-op machine of the late eighties (coin TVs in inns, game machines). A dial cannot show seconds; the LED can, which is why the story can say 9:58.'});

/** A hair dryer's cord (all three, ~1.7 m from the handle to the plug): how far a bather can take it from its socket. */
export const DRYER_CORD=Object.freeze({length:1.7,
 why:'A household dryer’s cord of the period is about 1.7 m: enough to dry your hair standing at the mirror, not enough to reach the noren 3 m away, so the women dry their hair at their mirrors, the cords taut to the sockets.'});

/**
 * Umi-no-yu's electrics: the bath's supply breaker (契約ブレーカー) and the 分電盤 (distribution board) beside it on the
 * wall behind Miss Higa's stool at the bandai, the circuits the board feeds, and the things on them.
 *
 * Okinawa is 100 V. Every branch is a 20 A breaker on 1.6 mm cable, so a branch carries at most 2 000 W, and since the
 * rewiring (ONSEN_REWIRING) each of the women's three mirrors has a branch of its own: the left mirror and the massage
 * chair's 1994 spur on circuit 1 (14 A at most), the middle and right mirrors on circuits 7 and 8 (12 A each). No branch
 * can be overloaded by what is plugged into it. What the house cannot do is run everything at once: the whole bath is
 * contracted at 40 A (ONSEN_CONTRACT), and the supply breaker sees every branch added up.
 *
 * The busy evening ("Fujita's Back"): the house idles at 9.46 A (the lamps, the andon, the television, the fan, the comb
 * sterilizer, the milk cooler and the pump: 946 W). Three women dry their hair (3 x 1 200 W, 36 A) while Miss Higa's pot
 * boils at the bandai (1 300 W, 13 A): 58.46 A, 1.46 times the contract. The breaker is thermal, so it does not open at once:
 * it warms. Fujita crab-walks the length of the lobby and feeds the chair a coin (200 W, 2 A): 60.46 A, 1.51 times the
 * contract, and four or five minutes after the dryers and the pot came on (BREAKER_CURVE) it lets go: the whole house goes
 * dark, every lamp, the television, the pump. The board's 60 A main never sees more than 60.46 A (under 105 % of it), so it
 * holds: the supply breaker is the one that trips (ブレーカーが落ちた). Miss Higa first puts it straight back up with
 * everything still on, and the breaker, still hot, lets go again in about a second (the 'retrip' moment, BREAKER_COOL);
 * then the dryers, the chair and her pot go off and she puts it up again, and it holds (ONSEN_RESET): that order is the lesson.
 *
 * History, kept because the room still shows it: when the board was rewired in 1987 it had six circuits and two spare
 * ways (予備), and all three mirrors' sockets were on circuit 1. In 1994 the new massage chair's socket was run as a spur
 * off the left mirror's socket in white raceway (ONSEN_RACEWAY) instead of from the board, so three dryers and the chair
 * could put 38 A on circuit 1's 20 A breaker, and on busy evenings it tripped. Tetsuo, the island's electrician, fitted two
 * new breakers in the spare ways and gave the middle and right mirrors a circuit each, labelling them on masking tape
 * (ONSEN_REWIRING); the tape is still there. That single-branch overload is history: the board now holds whatever the
 * mirrors do, and the house's limit is the contract.
 *
 * Everything here is data first (ONSEN_CIRCUITS, ONSEN_CONTRACT, ONSEN_SCENARIOS): what each circuit feeds, how much it
 * draws, which lamps and screens go dark without it, and why it is wired the way it is, so stories, the film and the tests
 * ask the same questions the room answers.
 *
 * Loads are switched on and off (switchOn / switchOff): `atRest` is how each one stands when nobody touches it (the lamps,
 * the fridge and the pump run; the dryers, the chair and the pot wait for somebody). A breaker is a thermal switch, so an
 * overload does not open it at once: it warms for as long as its trip curve says (BREAKER_CURVE) and then lets go, which is
 * why everything roars for a while before the CLICK. The film stages the moments it needs by name (stageScenario).
 *
 * Room frame as in onsen.js: street door at +z, sea at -z, metres, floor at y = 0.
 */
export const ONSEN_VOLTS=100;

/**
 * The board: in the keeper's corner behind the bandai, on the lobby's west wall just behind Miss Higa's stool, on her left.
 * `wallX` is the wall face it hangs on, `z` and `y` its centre; it faces into the room (+x). Its top is at 1.82 m, where a
 * Japanese board hangs, and its door is shut (`door.shut`); it opens (`door.open`, degrees, hinged on its right, the
 * bandai-wall side, so it swings away from her and stops short of that wall) only while someone works inside it.
 * `keeper` is where Miss Higa sits (onsen.js, the attendant's stool): every branch lever and the supply breaker are in her
 * reach from there (tests/onsen-electrics.test.mjs); the main and the earth-leakage breaker, at the top, she reaches
 * standing up on the bandai floor beside her stool (`stand`), which is a job for the electrician anyway. The board stops
 * short of her head: her bun, at the back, clears its front edge.
 */
export const ONSEN_BOARD=Object.freeze({
 wallX:-4.94,z:2.15,y:1.51,w:.52,h:.62,d:.175,
 facing:'+x',door:Object.freeze({shut:0,open:100,hinge:'right'}),
 // Seated, she reaches with her arm and a lean of the body (30 degrees from the hip), the way anyone reaches round from a stool.
 keeper:Object.freeze({who:'Miss Higa',seat:Object.freeze([-4.5,.75,2.6]),stand:Object.freeze([-4.55,.35,2.15]),facing:'+x',lean:30}),
 where:'Behind the bandai, on the wall at Miss Higa’s back, just to her left: the keeper’s corner, where only she reaches it. She turns on her stool and flicks a lever up without looking up from her account book, and nobody else can get to it without climbing over the counter. It hangs where a Japanese board hangs, its top at 1.82 m, with its door shut and the printed card on it: 関係者以外さわらないでください, staff only.',
 main:Object.freeze({id:'main',jp:'主幹',en:'Main breaker',amps:60,
  why:'Protects the service cable from the pole: 60 A at 100 V, 6 000 W. It is bigger than the bath’s 40 A supply, so on a busy evening the supply breaker beside the board lets go first and the main never has to.'}),
 elcb:Object.freeze({id:'elcb',jp:'漏電遮断器',en:'Earth-leakage breaker',amps:60,milliamps:30,
  why:'Opens the whole board if 30 mA leaks to earth: through wet tiles, a cracked dryer, a person. In a building full of water this is the most important switch on the board.'}),
});

/**
 * The supply breaker (契約ブレーカー): the breaker the bath's supply is contracted at, 40 A, in a small cream box of its
 * own on the wall beside the board, on the stool side, ahead of the board's main. Everything the house draws goes through
 * it, so it trips when the whole house runs at once, before the 60 A main. It hangs a hand lower than the board's top
 * row, so Miss Higa reaches back over her left shoulder from her stool and puts it up without getting down (the story's
 * reset, ONSEN_RESET). `wallX`, `z` and `y` are its back on the wall face and its centre; it faces into the room (+x).
 */
export const ONSEN_CONTRACT=Object.freeze({
 id:'contract',jp:'契約ブレーカー',en:'Supply breaker',amps:40,volts:ONSEN_VOLTS,
 wallX:-4.94,z:2.53,y:1.56,w:.11,h:.19,d:.075,facing:'+x',
 label:Object.freeze({jp:'契約',amps:'40A',en:'CONTRACT'}),
 where:'On the lobby’s west wall between the board and Miss Higa’s stool, its lever a hand below the board’s top row: the one switch she reaches back over her left shoulder for, from her stool, in the dark.',
 why:'The whole bath is contracted at 40 A: the house idles at 9.5 A, so two dryers, the chair and the lamps (35.5 A) are fine, and so is the pot with one dryer (34.5 A). Three dryers and the boiling pot together are 58.5 A, and with the chair 60.5 A, one and a half times the contract: it warms for a few minutes and lets go, and the whole house goes dark at once, not one room. It trips before the board’s 60 A main, so the main never has to.',
 region:'Okinawa Electric bills by a minimum charge (最低料金制), not by contracted amperes, so it never fitted the colour-coded ampere breakers of Tokyo or Kyushu (red 10 A, yellow 20 A, green 30 A, grey 40 A…). Here the contract is the bath’s own breaker by the board, its rating printed on its face; the colour is the plain cream of any breaker box.',
 period:'A cream moulded box the size of a paperback, its lever behind a small window and a printed label, 契約 40A: the switch every Japanese family knows from ブレーカーが落ちた, the click that leaves the whole house dark when the dryer, the kettle and the rice cooker run at once.'});

/**
 * The reset after the supply breaker lets go ("Fujita's Back", pages 6 and 7). The breaker that has just let go is still
 * hot (BREAKER_COOL), so putting it straight back up with everything still switched on, as Miss Higa does first without
 * looking, brings the lights on for about a second before it lets go again (the 'retrip' moment). The reset that holds
 * switches the big things off first, by torchlight at Tetsuo's word: the dryers, the chair, Miss Higa's pot; then she puts
 * the supply breaker up. The steps are done in order by higaReset().
 */
export const ONSEN_RESET=Object.freeze({by:'Miss Higa',breaker:'contract',
 steps:Object.freeze([
  Object.freeze({do:'switchOff',loads:Object.freeze(['dryer-1','dryer-2','dryer-3']),by:'the women at the mirrors, at Tetsuo’s word',en:'The dryers off, one by one.',
   why:'Three dryers are 36 A: switched on when the lever goes up, they come back on at once, on a breaker still hot from letting go.'}),
  Object.freeze({do:'switchOff',loads:Object.freeze(['massage-chair']),by:'Fujita',en:'The chair off at its switch.',
   why:'It forgot its coin when the power went, but its switch goes off too, so nothing starts by itself.'}),
  Object.freeze({do:'switchOff',loads:Object.freeze(['kettle']),by:'Miss Higa',en:'She pulls the pot’s magnet plug.',
   why:'The pot is the biggest single load in the house (13 A), and the one in her hand.'}),
  Object.freeze({do:'reset',breaker:'contract',by:'Miss Higa',en:'Then she reaches back over her left shoulder and puts the supply breaker up.',
   why:'Down until it clicks, then up: a tripped breaker has to be pushed right down to latch before it will go back on. With only the house’s own 9.5 A on it, it holds.'}),
 ]),
 why:'Switch off before you put the breaker back up: everything that was on comes back on at once the moment the lever goes up, and a breaker that has just let go is still warm.'});

const plain=(o)=>Object.freeze(o);
/** The bandai counter's top (onsen.js): where the pot stands. */
const BANDAI_TOP=FURNITURE_HEIGHTS.serviceCounter;
/**
 * Every branch circuit, in board order. `loads` are the things actually on it: their watts, the purpose that put them
 * there, and what in the room depends on them (`meshes` glow, `lights` are the point lights, `screens` and `hides` are
 * switched off). `normal` is the load on a quiet evening; the busy evening is every load at once, and no branch is over
 * its 20 A even then. `fitted` and `tape` mark the two ways Tetsuo wired in the rewiring (ONSEN_REWIRING): the plate under
 * them is still printed 予備 (spare), and their names are on his masking tape.
 */
export const ONSEN_CIRCUITS=Object.freeze([
 plain({id:'changing-sockets',no:1,jp:'脱衣所コンセント',en:'Changing-room sockets',amps:20,volts:ONSEN_VOLTS,
  why:'The left mirror’s socket under the women’s vanity, and the massage chair’s 1994 spur off it (ONSEN_RACEWAY). Since the rewiring the middle and right mirrors have circuits of their own, so this one carries one dryer and the chair: 14 A at most on 20.',
  tape:plain({jp:'左鏡 ドライヤー・椅子',en:'left mirror dryer + chair',
   why:'The printed label still says changing-room sockets, but since the rewiring circuit 1 feeds only the left mirror and the massage chair: the label must say what the breaker feeds, so Tetsuo wrote it on tape like the new ones.'}),
  normal:['dryer-1','massage-chair'],
  loads:Object.freeze([
   plain({id:'dryer-1',en:'Hair dryer 1, cream, at the left mirror',watts:1200,atRest:'off',by:'a bather at the left mirror',meshes:['Hair dryer 1','Hair dryer 1 pilot'],socket:'Vanity socket 1',
    shows:plain({lamp:'Hair dryer 1 pilot',air:'Hair dryer 1 air',hum:'Hair dryer 1'}),
    purpose:'The oldest dryer, kept at the end mirror by the lockers for regulars who dry their hair before they dress.'}),
   plain({id:'massage-chair',en:'Massage chair',watts:200,atRest:'off',by:'a ¥100 coin: ten minutes',meshes:['Massage chair lamp'],socket:'Massage chair socket',raceway:'Massage chair raceway',
    shows:plain({lamp:'Massage chair lamp',motion:'Massage chair rollers'}),
    purpose:'Ten minutes for ¥100 in the lobby after the bath; the coins pay for itself and the coffee-milk habit.'}),
  ])}),
 plain({id:'changing-lights',no:2,jp:'脱衣所照明',en:'Changing-room lights',amps:20,volts:ONSEN_VOLTS,
  why:'The changing rooms’ lamps on a circuit of their own, so a tripped socket never leaves people undressing in the dark: the women’s tube over their mirrors and the men’s ring pendant, both fluorescent since the 1987 rewiring.',
  normal:['changing-pendant','women-tube'],
  loads:Object.freeze([
   plain({id:'changing-pendant',en:'Men’s changing-room ring pendant',watts:30,atRest:'on',by:'Miss Higa at opening time',meshes:['Changing-room pendant lamp'],lights:['Changing-room light'],
    fixture:plain({kind:'ring',at:[2.1,2.7,.2],room:'men'}),
    light:plain({at:[2.1,2.46,.2],colour:0xd0deff,kelvin:5000,intensity:8,range:3.2,
     floor:plain({rect:[.06,4.94,-1.14,1.6],centre:[2.1,.2],radius:4.2,strength:.1,wedge:plain({x0:.05,x1:.9,depth:.85,spread:.3,strength:.1})}),
     why:'Neutral white (昼白色) from a ring tube: cooler than the lobby’s bulb, a shade warmer than the women’s daylight tube. Its reach stops short of the partition’s far side, so it lights the men’s room and not the women’s through the wall.'}),
    period:'A 30 W ring fluorescent (丸形蛍光灯 FCL30) under a shallow milk-white shade with a pull cord: the pendant of every Shōwa home and shop from the seventies, fitted here in 1987 in place of the old bulb.',
    purpose:'Hangs from the middle beam straight over the bench, the brightest place on the men’s side to find your locker key, and the middle of their room, so its light stays on their side of the partition.'}),
   plain({id:'women-tube',en:'Women’s changing-room fluorescent lamp',watts:40,atRest:'on',by:'Miss Higa at opening time',meshes:['Women’s changing-room lamp'],lights:['Women’s changing-room light'],
    fixture:plain({kind:'trough',at:[-2.6,2.8,-.32],length:1.25,room:'women'}),
    light:plain({at:[-2.6,2.82,-.32],colour:0xb8ceff,kelvin:6500,intensity:10,range:3,
     floor:plain({rect:[-4.94,-.06,-1.14,1.6],centre:[-2.6,-.32],radius:4.4,strength:.16,wedge:plain({x0:-.9,x1:-.05,depth:.95,spread:.3,strength:.15})}),
     why:'Daylight white (昼光色), the bluish white of a 1980s Japanese tube and the cool camp of the story: hard and even on the faces at the three mirrors. Its walls stop it (render/cel.js lampsStopAtWalls) and its reach stops short of the floors beyond them: the men’s, the lobby’s, the bath hall’s.'}),
    period:'One 40 W straight tube (FL40) in a white steel 逆富士 (inverted-Fuji) fitting screwed to the ceiling: the plain fitting of every Japanese changing room, office and classroom from the seventies on, its glow starter in the end cap.',
    purpose:'Over the women’s vanity, between the beam and the mirrors: the women do their hair and faces here, so the light is even and white, falls on the face from above the glass and leaves no corner for a dropped hairpin.'}),
  ])}),
 plain({id:'bath-lights',no:3,jp:'浴室照明',en:'Bath lights',amps:20,volts:ONSEN_VOLTS,
  why:'Sealed damp-proof lamps over the washing places and the indoor bath, and the stone lantern by the rock bath, on their own breaker so a fault in the wet room is found on its own.',
  normal:['bath-lamp-west','bath-lamp-east','garden-lantern'],
  loads:Object.freeze([
   plain({id:'bath-lamp-west',en:'Bath-hall lamp over the washing places',watts:60,atRest:'on',by:'Miss Higa at opening time',meshes:['Bath hall lamp west'],lights:['Bath hall light west'],
    fixture:plain({kind:'sealed',at:[-1.5,2.8,-2.8],room:'bath'}),
    light:plain({at:[-1.5,2.82,-2.8],colour:0xffd9a8,kelvin:2800,intensity:6,range:4.2}),
    purpose:'Lights the taps and mirrors where people wash before they get in.'}),
   plain({id:'bath-lamp-east',en:'Bath-hall lamp over the indoor bath',watts:60,atRest:'on',by:'Miss Higa at opening time',meshes:['Bath hall lamp east'],lights:['Bath hall light east'],
    fixture:plain({kind:'sealed',at:[2.8,2.8,-2.9],room:'bath'}),
    light:plain({at:[2.8,2.82,-2.9],colour:0xffd9a8,kelvin:2800,intensity:6,range:4.2}),
    purpose:'Lights the indoor bath so you can see the step down into the water.'}),
   plain({id:'garden-lantern',en:'Stone lantern by the rock bath',watts:5,atRest:'on',by:'its photocell, at dusk',meshes:['Lantern light'],lights:['Stone lantern light'],
    dusk:plain({why:'A photocell (自動点滅器) in the lantern’s roof lights it as the daylight goes and puts it out at dawn: one click, no flicker.'}),
    light:plain({at:[-4.05,.74,-8.05],colour:0xffc27a,kelvin:2400,intensity:2.4,range:4.6}),
    period:'A granite garden lantern (石灯籠) with a 5 W night-light bulb (ナツメ球) in its fire box, wired with the bath lamps: the mainland garden lantern every 1980s health land and ryokan put by its rock pool, Okinawa’s included.',
    purpose:'Marks the corner of the rock bath after dark, so nobody steps off the paving into the fukugi’s roots, and puts a little warm light on the bathers from the left.'}),
  ])}),
 plain({id:'lobby',no:4,jp:'玄関・番台',en:'Lobby and bandai',amps:20,volts:ONSEN_VOLTS,
  why:'The front of the house: the porch lamp, the lobby lamp, the andon and Miss Higa’s pot on the bandai, the television, and on the men’s side the fan and the comb sterilizer, whose sockets are spurs off the television’s through the same wall. Everything on it at once, the pot boiling, is 15 A on 20.',
  normal:['porch-lamp','lobby-lamp','andon','television','fan','comb-sterilizer'],
  loads:Object.freeze([
   plain({id:'porch-lamp',en:'Porch lamp under the eave',watts:20,atRest:'on',by:'Miss Higa at opening time, with the noren',meshes:['Porch lamp'],lights:['Porch light'],
    fixture:plain({kind:'porch',at:[0,2.31,6.2],room:'porch'}),
    dusk:plain({why:'On a photocell (自動点滅器), like every porch lamp of the period: it comes on as the street goes dark and goes out at dawn, one click and steady.'}),
    // The porch outside is drawn in the sky's flat colours (onsen-front.js), so the lamp shows on it as pools of light
    // (light-pools.js, the town's way for lamps outdoors): one on the step's top, one on the stones and grass below.
    pools:plain({strength:.34,discs:Object.freeze([plain({x:0,y:-.35,z:6.25,radius:1.35})]),steps:Object.freeze([plain({x:0,y:-.15,z:5.52,w:1.96,d:.56})])}),
    light:plain({at:[0,2.18,6.2],colour:0xdfe8ff,kelvin:5000,intensity:3,range:1.3,
     why:'A cool white over the step, from above and behind whoever stands on it coming in: their rim from the street. It reaches the step and no further, so it never lights the lobby’s ceiling through the street wall.'}),
    period:'A damp-proof milk-glass globe (防雨形 軒下灯) under the porch roof with a 20 W ring tube: the porch light of shops and baths of the eighties, cooler than the bulbs inside.',
    purpose:'Lights the step and the stepping stones after dark, so nobody misses the step in geta, and tells the street the bath is open.'}),
   plain({id:'lobby-lamp',en:'Lobby ceiling lamp',watts:40,atRest:'on',by:'Miss Higa at opening time',meshes:['Lobby ceiling lamp'],lights:['Lobby light'],
    fixture:plain({kind:'flush',at:[-2,2.8,3],room:'lobby'}),
    light:plain({at:[-2,2.82,3],colour:0xffc488,kelvin:2700,intensity:7,range:3.5,
     floor:plain({rect:[-4.94,4.94,1.6,4.94],centre:[-2,3],radius:5.4,strength:.1}),
     why:'A 40 W bulb behind milk glass: the warm camp, the colour of the lobby, the genkan and the bandai. Its reach is held to the lobby so it does not warm the changing rooms through the noren wall.'}),
    purpose:'Over the genkan and the bandai, so Miss Higa can see the coins and you can see your shoes.'}),
   plain({id:'andon',en:'Andon on the bandai',watts:25,atRest:'on',by:'Miss Higa at opening time',meshes:['Andon'],lights:['Andon light'],
    light:plain({at:[-3.92,1.06,1.92],colour:0xffcf98,kelvin:2400,intensity:3.5,range:1.25,
     why:'A 25 W bulb in paper on the counter: warm light up the wall behind her, so the board at her back is lit from below at the bandai. Its reach is the keeper’s corner: the board, her face, her book.'}),
    purpose:'The paper lamp Grandmother Higa put on the bandai in the seventies; it says the bath is open from the street.'}),
   plain({id:'television',en:'Lobby television',watts:80,atRest:'on',by:'Miss Higa, for the night game',screens:['Lobby CRT'],
    purpose:'The night game for people cooling down on the tatami.'}),
   plain({id:'fan',en:'Changing-room fan',watts:30,atRest:'on',by:'Miss Higa at opening time',socket:'Fan socket',
    purpose:'Cools people coming out of the bath at 42 degrees; it turns its head so everyone on the bench gets some.'}),
   plain({id:'comb-sterilizer',en:'Comb sterilizer on the men’s vanity',watts:6,atRest:'on',by:'Miss Higa at opening time',meshes:['Comb sterilizer lamp'],socket:'Men’s vanity socket',
    purpose:'A small ultraviolet lamp in a box that keeps the men’s side’s house combs clean between customers: the blue glow of every Shōwa barber’s and bath’s mirror.'}),
   plain({id:'kettle',jp:'電気ポット',en:'Miss Higa’s electric pot on the bandai',watts:1300,atRest:'off',by:'Miss Higa, for her tea',meshes:['Electric pot boil lamp'],socket:'Bandai socket',
    shows:plain({lamp:'Electric pot boil lamp',plug:'Electric pot magnet plug'}),
    // `at` is the middle of its foot on the bandai top; `face` the way its spout and lamp panel look (radians about y, from
    // +x): to the lobby, the magnet plug at the back by the counter's inner edge. She turns it on its foot to pour.
    prop:plain({at:Object.freeze([-4.06,BANDAI_TOP,2.22]),on:'Bandai top',r:.1,h:.325,face:0,litres:3,boilMinutes:12,
     for:'Miss Higa: her tea at the bandai through the evening, and the hot water for the free genmaicha in the kyūsu on the tatami.',
     why:'On the counter top at her left hand, between the andon and her account book: she turns it on its foot and pours without getting up, and between pours its spout and its red lamp face the lobby, so the room (and the reader) can see when it boils. The cord drops straight over the counter’s back edge to the socket on its inside face (Bandai socket), on her side, where no customer can catch it and it never crosses the coins or the book.',
     period:'A 3-litre electric pot (沸騰ジャーポット) of the late eighties: a cream body with a band of small orange flowers, a brown lid with a big air-pump button (エアー式) and a red 沸騰 lamp on its panel, on a turning foot, and a magnet plug (マグネットプラグ) that lets go if the cord is caught. A big quick-boil pot: 1 300 W while it boils, about twelve minutes from the tap; a home pot boiled at 700 to 900 W. Miss Higa pulls the magnet plug once it has boiled, as careful keepers did, and boils it again when she wants tea.'}),
    purpose:'Miss Higa’s tea, boiled fresh at the start of the evening rush; the biggest single thing in the house while it boils, and the 13 A that tips the busy evening over the contract.'}),
  ])}),
 plain({id:'fridge',no:5,jp:'冷蔵庫',en:'Milk fridge',amps:20,volts:ONSEN_VOLTS,
  why:'A dedicated circuit so nobody’s hair dryer can ever switch the milk off overnight.',
  normal:['milk-cooler'],
  loads:Object.freeze([
   plain({id:'milk-cooler',en:'Coffee-milk cooler',watts:150,atRest:'on',by:'its own thermostat, day and night',meshes:['Milk cooler light'],
    purpose:'Keeps the white, coffee and fruit milk at 5 degrees for drinking standing up, hand on hip.'}),
  ])}),
 plain({id:'pump',no:6,jp:'ポンプ',en:'Bath pump',amps:20,volts:ONSEN_VOLTS,
  why:'A motor on its own breaker: it never trips with anything else, so the bath water keeps turning over through the filter.',
  normal:['circulation-pump'],
  loads:Object.freeze([
   plain({id:'circulation-pump',en:'Bath circulation pump',watts:400,atRest:'on',by:'the time switch in the boiler room',hides:['Spout water'],
    purpose:'Pushes the indoor bath through the filter and the heater and back out of the stone spout at 42 degrees.'}),
  ])}),
 plain({id:'vanity-2',no:7,way:7,jp:'中鏡ドライヤー',en:'Middle mirror dryer',amps:20,volts:ONSEN_VOLTS,fitted:'rewiring',
  tape:plain({jp:'中鏡 ドライヤー',en:'middle mirror dryer'}),
  why:'The middle mirror’s socket on a cable of its own, in what was a spare way: one 1 200 W dryer is 12 A on a 20 A breaker, whatever the others do.',
  normal:['dryer-2'],
  loads:Object.freeze([
   plain({id:'dryer-2',en:'Hair dryer 2, blue, at the middle mirror',watts:1200,atRest:'off',by:'a bather at the middle mirror',meshes:['Hair dryer 2','Hair dryer 2 pilot'],socket:'Vanity socket 2',
    shows:plain({lamp:'Hair dryer 2 pilot',air:'Hair dryer 2 air',hum:'Hair dryer 2'}),
    purpose:'The one most people use: the middle mirror has the best light from the tube over the vanity.'}),
  ])}),
 plain({id:'vanity-3',no:8,way:8,jp:'右鏡ドライヤー',en:'Right mirror dryer',amps:20,volts:ONSEN_VOLTS,fitted:'rewiring',
  tape:plain({jp:'右鏡 ドライヤー',en:'right mirror dryer'}),
  why:'The right mirror’s socket on a cable of its own, in the other spare way, for the evening rush after the ferry.',
  normal:['dryer-3'],
  loads:Object.freeze([
   plain({id:'dryer-3',en:'Hair dryer 3, coral, at the right mirror',watts:1200,atRest:'off',by:'a bather at the right mirror',meshes:['Hair dryer 3','Hair dryer 3 pilot'],socket:'Vanity socket 3',
    shows:plain({lamp:'Hair dryer 3 pilot',air:'Hair dryer 3 air',hum:'Hair dryer 3'}),
    purpose:'Added for the evening rush, when families come in after the ferry and three people want the mirror at once.'}),
  ])}),
]);

/**
 * The rewiring that gave each mirror its own circuit (history: the board as it is now). The two new breakers went into
 * the spare ways the 1987 board left behind white blanking covers; the new cables go up into the ceiling void and down
 * inside the vanity wall, so nothing new shows but the breakers, whiter than the ones that have hung there since 1987, and
 * their names on masking tape over the printed 予備 (each circuit's `tape`), on the board and on the circuit list.
 */
export const ONSEN_REWIRING=Object.freeze({
 by:'Tetsuo, the island’s electrician',ways:Object.freeze(['vanity-2','vanity-3']),relabelled:Object.freeze(['changing-sockets']),
 en:'Each mirror got a circuit of its own.',
 route:'New 1.6 mm cable from each new breaker up into the ceiling void and down inside the vanity wall to its mirror’s socket: nothing on the walls, nothing to snag a towel.',
 tape:plain({en:'Cream masking tape, written on in black marker',
  why:'Every way on a board is labelled, or the next person to open it guesses. A printed label is for the next inspection; on the night it was done it was tape and a marker, which is what an electrician carries, and it is still there.'}),
});

/**
 * The upgrade: a later step of the same history, after the rewiring ("Fujita's Back", page 9: while everyone soaks in the
 * dark, Tetsuo splits the consumers and fits another breaker). It is not how the bath is wired when you walk in: the town
 * plays the board as it is now (ONSEN_CIRCUITS, 40 A), because the story's busy evening, its blackout and its retrip only
 * happen on the 40 A supply. A film or a story sets it by name (ONSEN_SCENARIOS 'locked-out', 'upgraded-locked-out',
 * 'upgraded'; boardUpgrade()).
 *
 * Two changes. The left mirror's dryer, the only one still sharing a branch (circuit 1, with the massage chair's 1994
 * spur), gets a circuit of its own: the board's eight ways are full since the rewiring, so the ninth breaker goes in a small
 * add-on box (増設ボックス) under the board, fed from the board's load side, behind the main and the earth-leakage breaker;
 * circuit 1 keeps only the chair. And the 40 A supply breaker is swapped for a 60 A one. Neither changes what the house
 * draws: splitting branches moves loads between breakers, it never takes a watt away, and the supply breaker still sees
 * every branch added up. Everything on at once is still 60.46 A.
 */
export const ONSEN_UPGRADE=Object.freeze({
 by:'Tetsuo, the island’s electrician',after:'rewiring',when:'The night of “Fujita’s Back” (page 9), with the main locked off while the bathers soak in the dark.',
 en:'The left mirror’s dryer on a circuit of its own, and a 60 A supply breaker.',
 circuit:plain({id:'vanity-1',no:9,way:9,jp:'左鏡ドライヤー',en:'Left mirror dryer',amps:20,volts:ONSEN_VOLTS,fitted:'upgrade',box:'Add-on breaker box',
  tape:plain({jp:'左鏡 ドライヤー',en:'left mirror dryer'}),
  why:'The left mirror’s socket on a cable of its own, like the middle and right mirrors since the rewiring: one 1 200 W dryer is 12 A on a 20 A breaker, and the chair no longer shares its branch with a dryer. It moves load from one breaker to another; the house draws the same.',
  normal:Object.freeze(['dryer-1'])}),
 moves:Object.freeze(['dryer-1']),from:'changing-sockets',
 relabel:plain({id:'changing-sockets',tape:plain({jp:'マッサージ椅子',en:'massage chair'}),
  why:'Circuit 1 now feeds only the chair’s spur, 2 A on 20, and a label must say what the breaker feeds: new tape over the old.'}),
 route:'New 1.6 mm cable from the ninth breaker up into the ceiling void and down inside the vanity wall to the left mirror’s socket box, the way the rewiring ran ways 7 and 8. In that box the old circuit 1 cable is taken off the socket and joined straight through to the chair’s raceway, so the socket is on the new branch and the spur stays on circuit 1: nothing new shows in the changing room.',
 box:plain({jp:'増設ボックス',en:'Add-on breaker box',wallX:-4.94,z:2.27,y:1.12,w:.19,h:.12,d:.085,conduit:.011,breakerX:-.05,tapeX:.047,
  why:'The board has no spare way left (its two spares became circuits 7 and 8), so the ninth breaker hangs in a small steel box of its own just under the board, on the supply breaker’s side and above Miss Higa’s noren pole (whose hooks it leaves room to lift it off), fed through a short grey conduit from the board’s load side: the main and the earth-leakage breaker switch it with everything else, and the earth-leakage breaker guards the wet room’s new socket feed too. It is in Miss Higa’s reach from her stool, like every other lever.',
  period:'A one-way branch box in the board’s grey: how an electrician of the early Heisei years added a circuit to a full board without changing the board.'}),
 contract:plain({amps:60,label:plain({jp:'契約',amps:'60A',en:'CONTRACT'}),
  why:'A bigger contract for the same house. Everything at once (three dryers, the pot, the chair and the idle house) is still 60.46 A: a hair over the 60 A on its face, inside the margin a breaker carries without opening (it never trips at or under 105 %), so it holds, with nothing to spare: anything more on the same evening would warm it until it let go. 60 A is as far as the contract goes: the board’s main is 60 A, sized for the service cable from the pole, so the contract and the main are now the same size.',
  isolation:'The supply breaker sits ahead of the board’s main, on the supply side: locking the main off does not make it dead. It is changed with the supply cut upstream of it, by arrangement with the power company, never under the main’s lock alone.',
  period:'The same cream moulded box as the 40 A one, newer and whiter, its rating printed on its face: 契約 60A.'}),
});

/**
 * The lock-out on the main while someone works inside the board (ONSEN_SCENARIOS 'locked-out', lockOut()): the main
 * switched off, a red clamp over its lever with a padlock through it, and the red-and-white tag hanging from the padlock's
 * shackle. A locked main cannot be put back up, by hand, by resetAll or by the room's reset anchors, until the lock comes
 * off; and the board's door cannot be shut over it (the clamp stands out past the door's inside face).
 */
export const ONSEN_LOCKOUT=Object.freeze({breaker:'main',by:'Tetsuo',doorMin:15,
 tag:plain({jp:'投入禁止',head:'作業中',en:'DO NOT SWITCH ON',name:'テツオ',w:.06,h:.11,
  why:'A tag says that the switch must stay off and who is working: the 作業中 / 投入禁止 tag of Japanese sites and plant rooms, red and white so it is seen in the dark by a torch, his name on it in marker so anyone can find him.'}),
 padlock:plain({why:'A tag alone can be missed in the dark; a padlock cannot be ignored. The key is in his pocket, so nobody puts the main up while his hands are in the board.'}),
 clamp:plain({why:'A breaker lever has no hole for a padlock: a small red clamp closes over the lever in the off position and takes the padlock through its tab.'}),
 door:'The clamp, the padlock and the tag stand out past the inside face of the board’s door, so it will not shut over them: it stays at least doorMin degrees open until the lock comes off.',
 why:'Isolate, lock and tag before proving dead: the main off, locked and tagged, then the tester shows dead (live, dead, live) before anything inside is touched. The lock holds the board’s branches dead; the supply breaker beside the board is still live, ahead of the main.'});

/**
 * The massage chair's spur: white PVC surface raceway (モール), added in 1994. It leaves the
 * left mirror's socket on the women's vanity, climbs the vanity wall beside the lockers' end,
 * runs round the women's changing room at picture-rail height (west wall, then the bandai
 * wall over the women's noren), goes straight through the partition into the men's side,
 * on over the men's noren and the men's mirror, through the wall at the east end and down the
 * lobby's east wall to a surface socket box beside the chair. `path` is its centre line,
 * room metres; `face` is the wall each run is screwed to (the direction the raceway's back
 * faces); `end`/`start` 'wall' is an end cap where it goes into a wall.
 */
export const ONSEN_RACEWAY=Object.freeze({
 id:'chair-spur',name:'Massage chair raceway',jp:'モール',en:'White PVC surface raceway',year:1994,
 from:'Vanity socket 1',to:'Massage chair socket',circuit:'changing-sockets',
 w:.035,d:.016,height:2.45,colour:0xfbfbf7,
 why:'The old chair died and the new one came in 1994 (平成6年), the week there was no electrician on the island, so a handyman ran its socket off the nearest outlet on the dryers’ cable instead of opening the board: raceway screwed to the walls at picture-rail height, all the way round the women’s changing room, straight through the partition (he drilled it), across the men’s side and through the wall to the chair. While all three mirrors were on circuit 1 a busy evening tripped it; since the rewiring it shares circuit 1 with the left mirror only, 14 A on 20, and it stayed where it was.',
 period:'Surface raceway is how Japanese houses and shops were extended without opening the walls from the 1980s on: white PVC, 25 mm, snap-on covers, moulded corner pieces and an end cap where it goes through a wall.',
 runs:Object.freeze([
  // Points on the wall face it is screwed to; `face` is that wall's outward normal.
  plain({side:'changing',wall:'vanity wall',face:'+z',path:Object.freeze([[-4.185,.88,-1.14],[-4.49,.88,-1.14],[-4.49,2.45,-1.14],[-4.94,2.45,-1.14]])}),
  plain({side:'changing',wall:'west wall, over the lockers',face:'+x',path:Object.freeze([[-4.94,2.45,-1.14],[-4.94,2.45,1.54]])}),
  plain({side:'women',wall:'bandai wall, over the women’s noren',face:'-z',path:Object.freeze([[-4.94,2.45,1.54],[-.05,2.45,1.54]]),end:'wall'}),
  plain({side:'men',wall:'bandai wall, through the partition and over the men’s noren',face:'-z',path:Object.freeze([[.05,2.45,1.54],[4.82,2.45,1.54]]),start:'wall',end:'wall'}),
  plain({side:'lobby',wall:'lobby side of the bandai wall',face:'+z',path:Object.freeze([[4.82,2.45,1.66],[4.94,2.45,1.66]]),start:'wall'}),
  plain({side:'lobby',wall:'east lobby wall, over the milk cooler',face:'-x',path:Object.freeze([[4.94,2.45,1.66],[4.94,2.45,2.9],[4.94,1.16,2.9]])}),
 ]),
 box:plain({at:[4.94,1.1,2.9],w:.075,h:.12,d:.035,why:'A surface socket box at the raceway’s end, above the wainscot rail so the raceway never has to cross it.'}),
});
/**
 * Light that one room's lamps throw into another, by name: a point light that follows the share of its lamps still lit.
 * The bath hall's glass is the only one: after dark the hall's two lamps glow out through it onto the rock bath, the
 * warm key on the faces in the water from the building side (12a–d), with the cold night behind them. By day the sky
 * outside is brighter than the hall, so the glow only shows as the daylight goes (`night`).
 */
export const ONSEN_SPILLS=Object.freeze([
 plain({name:'Bath hall glow',from:Object.freeze(['bath-lamp-west','bath-lamp-east']),at:Object.freeze([0,1.55,-4.75]),colour:0xffcf98,intensity:7,range:5.6,night:true,
  why:'The lit bath hall seen from the rock bath: its two lamps through the glass and the open door, the warm light on the bathers’ faces as they look back at the building.'}),
]);

/**
 * The house's bounce light (the room's hemisphere, and its share of the town's indoor fill), set low enough that each
 * room's own lamp is what you see it by: the lobby warm under its bulb and the andon, the changing rooms cool under their
 * tubes, the bath hall warm, wherever the camera stands (a cross-camp shot keeps both colours). `lit` is the bounce's
 * colour with the lamps on, `bounce` its lower half (the lit floors' light thrown back up onto the ceilings), `dark` the
 * dusk through the glass when they are dead; `house` scales the room's hemisphere,
 * `townLit` is how much of the town's sky fill reaches a lamp-lit house at night (all of it at noon); `outside` how much of
 * the house's bounce is lost out on the rock bath at night. Each lamp's `light.floor` (ONSEN_CIRCUITS) is its light on
 * its own room's floor (a pool clipped to the room, so the colour changes exactly under the noren), with the cool wedge
 * each changing room throws out into the lobby under its noren.
 */
export const ONSEN_FILL=Object.freeze({lit:0xf4efe8,bounce:0xbdb3a6,dark:0xa9b4cc,house:.55,townLit:.2,outside:.7,
 why:'Two camps of light: the 1980s women’s changing room under a daylight tube, the lobby under a bulb and the andon. Shot from the women’s side a panel is cool, from the lobby warm, so the reader knows which camp it is in before reading it; the border is a line of colour on the floor under the hem.'});


const ALL_LOADS=ONSEN_CIRCUITS.flatMap(c=>c.loads);
const LOAD_BY_ID=new Map(ALL_LOADS.map(l=>[l.id,l]));
const knownLoad=id=>{if(!LOAD_BY_ID.has(id))throw new Error('No such load at Umi-no-yu: '+id);return id;};
let doorAngle=ONSEN_BOARD.door.shut;
/**
 * The circuits after the upgrade (ONSEN_UPGRADE): circuit 1 with only the chair, re-taped, and the ninth branch in the
 * add-on box with the left mirror's dryer. The same load objects as ONSEN_CIRCUITS: nothing is added or taken away.
 */
const U=ONSEN_UPGRADE;
export const ONSEN_UPGRADED_CIRCUITS=Object.freeze([
 ...ONSEN_CIRCUITS.map(c=>c.id!==U.from?c:plain({...c,loads:Object.freeze(c.loads.filter(l=>!U.moves.includes(l.id))),normal:Object.freeze(c.normal.filter(id=>!U.moves.includes(id))),
  tape:U.relabel.tape,why:U.relabel.why})),
 plain({...U.circuit,loads:Object.freeze(U.moves.map(id=>LOAD_BY_ID.get(id)))}),
]);
// Whether the upgrade is in (a later step the film and stories set; the town plays the board as it is now) and whether the
// main is locked off (ONSEN_LOCKOUT).
let upgraded=false,locked=false;
/** The circuits as the board is wired now: as it is (ONSEN_CIRCUITS) or after the upgrade (ONSEN_UPGRADED_CIRCUITS). */
export const circuitsNow=()=>upgraded?ONSEN_UPGRADED_CIRCUITS:ONSEN_CIRCUITS;
/** The supply breaker's rating and label now: 40 A as it is, 60 A after the upgrade. */
export const contractNow=()=>upgraded?{...ONSEN_CONTRACT,amps:U.contract.amps,label:U.contract.label,why:U.contract.why,period:U.contract.period}:ONSEN_CONTRACT;
const byId=id=>circuitsNow().find(c=>c.id===id);
/** The board's own switches (the main, the earth-leakage breaker, the eight branches and the add-on box's ninth), and with them the supply breaker. */
const BOARD_SWITCHES=['main','elcb',...ONSEN_CIRCUITS.map(c=>c.id),U.circuit.id];
const ALL_SWITCHES=[ONSEN_CONTRACT.id,...BOARD_SWITCHES];
const known=id=>{if(!ALL_SWITCHES.includes(id))throw new Error('No such breaker at Umi-no-yu: '+id);if(id===U.circuit.id&&!upgraded)throw new Error('The '+id+' breaker is fitted in the upgrade (ONSEN_UPGRADE), not before');return id;};

/** Watts on a circuit: every load, or only the ones named in `running`. */
export function wattsOf(circuitId,running=null){
 const c=byId(circuitId);if(!c)throw new Error('No such circuit: '+circuitId);
 return c.loads.filter(l=>!running||running.includes(l.id)).reduce((s,l)=>s+l.watts,0);
}
/** Amps on a circuit at 100 V (every load at once unless `running` says otherwise). */
export const loadOf=(circuitId,running=null)=>wattsOf(circuitId,running)/ONSEN_VOLTS;
/** Would that load trip the circuit's breaker? */
export const overloaded=(circuitId,running=null)=>loadOf(circuitId,running)>byId(circuitId).amps;
/** The circuit a load is on. */
export const circuitOf=loadId=>circuitsNow().find(c=>c.loads.some(l=>l.id===loadId))?.id;
/** Amps the whole house draws (what the supply breaker and the main see) with those loads running, or every load. */
export const houseAmps=(running=null)=>ALL_LOADS.filter(l=>!running||running.includes(l.id)).reduce((s,l)=>s+l.watts,0)/ONSEN_VOLTS;

/**
 * How long a breaker carries an overload before its thermal element opens it, in seconds,
 * by multiple of its rating. An illustrative curve for a 1990s Japanese breaker, inside the
 * JIS limits (it must open within 60 minutes at 125 %, and at 200 % within 2 minutes up to
 * 30 A and 4 minutes up to 50 A); from ten times its rating the magnetic trip opens it at once.
 * Between the points the time is read on a log-log line. At or under 105 % it never trips.
 * The supply breaker is the same kind of breaker: at 1.5 times its 40 A it takes about four minutes.
 */
export const BREAKER_COOL=600;
/**
 * BREAKER_COOL: seconds a breaker's thermal element takes to cool from the point of letting go to cold, off or within its
 * rating. A breaker that has let go on heat is hot: put back up at once under the same overload it lets go again in a
 * fraction of its trip time (after two seconds in the dark, 2/600 of it: about a second at the busy evening's 58.5 A).
 */
export const BREAKER_CURVE=Object.freeze([[1.05,7200],[1.25,1200],[1.5,240],[2,30],[3,8],[5,3],[10,0]].map(p=>Object.freeze(p)));
/** Seconds a breaker carries `amps` before it trips (Infinity: never). */
export function tripSeconds(amps,rating){
 const r=amps/rating,C=BREAKER_CURVE;if(!(r>C[0][0]))return Infinity;if(r>=C.at(-1)[0])return 0;
 const i=C.findIndex(p=>p[0]>=r),[r0,t0]=C[i-1],[r1,t1]=C[i],k=Math.log(r/r0)/Math.log(r1/r0);
 return t1===0?t0*(1-k):Math.exp(Math.log(t0)+k*(Math.log(t1)-Math.log(t0)));
}
/** The loads that run when nobody touches anything. */
export const AT_REST=Object.freeze(ALL_LOADS.filter(l=>l.atRest==='on').map(l=>l.id));

// The breakers' state lives as long as the page: leave and come back and the lever is still down.
const on=new Map(ALL_SWITCHES.map(id=>[id,true]));
// Which loads are switched on (whether or not their breaker lets the power through), and
// how far each breaker's thermal element has got towards opening (0 cold, 1 open).
const running=new Set(AT_REST);
const heat=new Map(ALL_SWITCHES.map(id=>[id,0]));
let held=false;
// The coin timer: seconds of the coin left, and whether a film holds it at a reading (chairTimer).
let chairLeft=0,timerPinned=false;
const listeners=new Set();
const changed=()=>{for(const fn of listeners)fn();};
/** Is that breaker itself on (its own lever up)? */
export const isOn=id=>on.get(known(id));
/**
 * Is there power on that circuit: the supply breaker, the main, the earth-leakage breaker and its own lever all on
 * (each sits behind the one before it, in that order, from the pole to the socket).
 */
export function isLive(id){known(id);if(!on.get('contract'))return false;if(id==='contract')return true;if(!on.get('main'))return false;if(id==='main')return true;if(!on.get('elcb'))return false;return on.get(id);}
export const isPowered=loadId=>isLive(circuitOf(knownLoad(loadId)));
/** Is that load switched on (its own switch, whatever the breaker is doing)? */
export const isRunning=loadId=>running.has(knownLoad(loadId));
/** Switched on and powered: the lamp is lit, the dryer blows, the chair kneads. */
export const isWorking=loadId=>isRunning(loadId)&&isPowered(loadId);
/** Every load switched on, in board order. */
export const runningLoads=()=>ALL_LOADS.filter(l=>running.has(l.id)).map(l=>l.id);
/** The ids of the loads switched on on that circuit. */
export const runningOn=circuitId=>{const c=byId(circuitId);if(!c)throw new Error('No such circuit: '+circuitId);return c.loads.filter(l=>running.has(l.id)).map(l=>l.id);};
const CHAIR='massage-chair';
// The chair's coin relay drops out when its power goes: the coin is forgotten and it stays still when the power comes back.
const relay=()=>{if(running.has(CHAIR)&&!isPowered(CHAIR)){running.delete(CHAIR);chairLeft=0;timerPinned=false;}};

/**
 * What the breakers carry right now: each branch's current from the loads switched on (drawn only while the branch is
 * live), whether it is over its rating and how many seconds it has left; and the supply breaker and the main, which
 * both see every live branch added up.
 */
export function assess(){
 const circuits=circuitsNow().map(c=>{const on=runningOn(c.id),demand=loadOf(c.id,on),live=isLive(c.id),amps=live?demand:0,limit=tripSeconds(amps,c.amps);
  return {id:c.id,running:on,demand,amps,rating:c.amps,live,over:amps>c.amps,tripIn:Number.isFinite(limit)?Math.max(0,limit*(1-heat.get(c.id))):Infinity};});
 const amps=circuits.reduce((s,c)=>s+c.amps,0);
 const whole=(id,rating)=>{const limit=tripSeconds(amps,rating);return {amps,rating,live:isLive(id),over:amps>rating,tripIn:Number.isFinite(limit)?Math.max(0,limit*(1-heat.get(id))):Infinity};};
 return {volts:ONSEN_VOLTS,circuits,contract:whole('contract',contractNow().amps),main:whole('main',ONSEN_BOARD.main.amps),upgraded,locked};
}
/**
 * Let `seconds` pass: an overloaded live breaker warms towards its trip time and opens when it gets there, hot; one that
 * is off or back within its rating cools (BREAKER_COOL). Returns the ids of the breakers that tripped.
 */
export function advance(seconds){
 if(held||!(seconds>0))return [];
 const tripped=[],a=assess();
 for(const x of [...a.circuits,{...a.main,id:'main'},{...a.contract,id:'contract'}]){
  const limit=tripSeconds(x.amps,x.rating);
  if(!x.live||!Number.isFinite(limit)){heat.set(x.id,Math.max(0,heat.get(x.id)-seconds/BREAKER_COOL));continue;}
  const h=limit===0?1:heat.get(x.id)+seconds/limit;heat.set(x.id,Math.min(1,h));
  if(h>=1)tripped.push(x.id);
 }
 if(tripped.length){for(const id of tripped)on.set(id,false);relay();changed();}// it lets go hot (BREAKER_COOL)
 return tripped;
}
/** Run the clock until nothing more will trip: what the room settles into if left alone. */
export function settle(){const all=[];for(let i=0;i<ALL_SWITCHES.length;i++){const a=assess(),next=Math.min(...a.circuits.map(c=>c.tripIn),a.main.tripIn,a.contract.tripIn);if(!Number.isFinite(next))break;all.push(...advance(next+1e-6));}return all;}
/** Switch a load on. It draws at once; an overload trips its breaker in the curve's time (advance). */
export function switchOn(loadId){knownLoad(loadId);held=false;if(running.has(loadId))return false;running.add(loadId);if(loadId===CHAIR){chairLeft=CHAIR_TIMER.seconds;timerPinned=false;relay();}changed();return true;}
export function switchOff(loadId){knownLoad(loadId);held=false;if(!running.delete(loadId))return false;if(loadId===CHAIR){chairLeft=0;timerPinned=false;}changed();return true;}
/** A reading as the LED shows it: whole seconds, rounded up, M:SS. */
export const timerReads=seconds=>{const t=Math.max(0,Math.ceil(seconds-1e-9));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};
const readSeconds=v=>{if(typeof v==='number'&&v>=0&&v<=CHAIR_TIMER.seconds)return v;const m=/^(\d{1,2}):([0-5]\d)$/.exec(String(v));const t=m?+m[1]*60+ +m[2]:NaN;
 if(!(t>=0&&t<=CHAIR_TIMER.seconds))throw new Error('The chair’s timer reads 0:00 to 10:00: '+v);return t;};
/**
 * The chair's coin timer: with no argument, what it shows ({left seconds, reads 'M:SS', lit, running, pinned}). With a
 * reading ('9:58' or seconds) a film holds it there (the chair keeps kneading; any coin, switch or click lets it go);
 * null lets it run again.
 */
export function chairTimer(value){
 if(value===null){timerPinned=false;changed();}
 else if(value!==undefined){chairLeft=readSeconds(value);timerPinned=true;changed();}
 return {left:chairLeft,reads:timerReads(chairLeft),lit:isPowered(CHAIR),running:running.has(CHAIR),pinned:timerPinned};
}
export function trip(id){known(id);held=false;timerPinned=false;if(!on.get(id))return false;on.set(id,false);heat.set(id,0);relay();changed();return true;}
/** Puts a breaker back up. A locked main (ONSEN_LOCKOUT) stays down: false, as for a lever already up. */
export function reset(id){known(id);held=false;if(on.get(id)||(locked&&id===ONSEN_LOCKOUT.breaker))return false;on.set(id,true);changed();return true;}
/** Every lever back up, except a main that is locked off. */
export function resetAll(){let any=false;for(const id of ALL_SWITCHES)if(!on.get(id)&&!(locked&&id===ONSEN_LOCKOUT.breaker)){on.set(id,true);any=true;}if(any)changed();}
/** The reset that holds (ONSEN_RESET), in its order: the dryers, the chair and the pot off, then the supply breaker up. Returns what the house then carries. */
export function higaReset(){for(const s of ONSEN_RESET.steps){if(s.do==='switchOff')for(const id of s.loads)switchOff(id);else reset(s.breaker);}return assess();}

/**
 * The moments the film and the stories stage, by name. `on` are the loads switched on besides the ones at rest, `down`
 * the levers pulled down by hand, `settle` lets the breakers do what they would, `hold` keeps the moment (no breaker
 * warms until something is switched), `wait` lets that many seconds pass after it settles (a breaker that let go cools),
 * `up` puts those levers back up by hand after that, `chair` is how many seconds of the coin are gone, `timer` holds the chair's
 * readout, and `tv` is the channel the lobby set is pinned to. `board` is the board's door: shut, as it hangs at rest,
 * unless the moment is someone working inside it. `pages` are the pages of "Fujita's Back" each one is for.
 */
const EVENING=Object.freeze(['dryer-1','dryer-2','dryer-3','kettle']);
export const ONSEN_SCENARIOS=Object.freeze({
 rest:Object.freeze({on:[],down:[],tv:null,
  en:'Nobody at the mirrors, the chair free and the pot unplugged: the lamps, the andon, the television, the fan, the milk cooler and the pump. The house idles at 9.46 A of its 40 A supply.'}),
 quiet:Object.freeze({on:['dryer-2','massage-chair'],down:[],tv:'night-game',
  en:'A quiet evening: one dryer and the chair, 23.46 A on the 40 A supply (the dryer 12 A on its own circuit 7, the chair 2 A on circuit 1). It holds all night.'}),
 evening:Object.freeze({on:EVENING,down:[],hold:true,tv:'night-game',pages:Object.freeze([3,4]),
  en:'The evening rush, before the chair: three dryers at the mirrors (36 A, each on its own branch) and Miss Higa’s pot boiling at the bandai (13 A) on the idle house (9.46 A): 58.46 A, 1.46 times the 40 A supply. The supply breaker is warming, its lever still up: left alone it lets go in about five minutes. Every branch is within its 20 A, and the 60 A main holds.'}),
 'last-straw':Object.freeze({on:[...EVENING,'massage-chair'],down:[],hold:true,chair:2,tv:'night-game',pages:Object.freeze([4]),
  en:'Fujita’s coin goes in and the rollers find the spot (the timer at 9:58): the chair’s 2 A on top of the rush, 60.46 A, 1.51 times the contract. The lever is still up; it is the moment before the click.'}),
 blackout:Object.freeze({on:[...EVENING,'massage-chair'],down:[],settle:true,tv:'night-game',pages:Object.freeze([5,6]),
  en:'The supply breaker has let go: the whole house is dark. Every lamp, the andon, the television, the milk cooler, the pump, the dryers in the women’s hands and the chair under Fujita; only the outside lights the windows. The dryers and the pot are still switched on; the chair has forgotten its coin. Every branch lever and the main are still up. The same dark follows the retrip.'}),
 retrip:Object.freeze({on:[...EVENING,'massage-chair'],down:[],settle:true,wait:2,up:Object.freeze(['contract']),hold:true,tv:'night-game',pages:Object.freeze([6]),
  en:'Miss Higa puts the supply breaker straight back up without looking, two seconds into the dark, with everything still switched on: the lights blink on (the dryers roar, the pot boils; the chair has forgotten its coin), 58.46 A on a breaker still hot from letting go. It lets go again in about a second (CLACK): blackout, retrip, blackout, then restored.'}),
 restored:Object.freeze({on:[],down:[],tv:'night-game',pages:Object.freeze([7,8,9]),
  en:'The lights come back and stay on: by Tetsuo’s torch the dryers, the chair and Miss Higa’s pot were switched off, and she put the supply breaker up (ONSEN_RESET). The house is back at rest, 9.46 A on the 40 A supply, and it holds.'}),
 isolated:Object.freeze({on:[],down:['main'],board:'open',tv:'night-game',
  en:'Isolate first: the board’s main off and its door open before anybody works inside it (Tetsuo). The whole house is dark and the television black.'}),
 // The ending of "Fujita's Back" (page 9, ONSEN_UPGRADE and ONSEN_LOCKOUT): the board as it is, locked off; the same with the
 // upgrade in; and the house back on after it.
 'locked-out':Object.freeze({on:[],down:['main'],lock:true,board:'open',tv:'night-game',pages:Object.freeze([9]),
  en:'Isolated, locked and tagged while everyone soaks in the dark: the main off, Tetsuo’s red clamp and padlock on its lever and the 作業中 / 投入禁止 tag hanging from it, the door open. The board as it is (eight ways, the 40 A supply). Every branch is dead; the supply breaker beside the board, ahead of the main, is still live.'}),
 'upgraded-locked-out':Object.freeze({on:[],down:['main'],lock:true,upgrade:true,board:'open',tv:'night-game',pages:Object.freeze([9]),
  en:'The work done, still locked off: the ninth breaker in the add-on box under the board, taped 左鏡 ドライヤー, its lever up; circuit 1 re-taped for the chair alone; the 60 A supply breaker (契約 60A) beside the board. The house still dark, the main still locked and tagged.'}),
 upgraded:Object.freeze({on:[],down:[],upgrade:true,tv:'night-game',pages:Object.freeze([9]),
  en:'Lock and tag off, the main up, the door shut: the lights come back. Each mirror on a branch of its own, the chair alone on circuit 1, the house at rest, 9.46 A on the 60 A supply. Everything at once would still be 60.46 A: it holds, with nothing to spare.'}),
});
/**
 * The board's door: 'shut', 'open' or an angle in degrees (0 shut … ONSEN_BOARD.door.open). A film can open it in any
 * shot without changing the moment. Returns the angle now.
 */
export function boardDoor(state){
 if(state!==undefined){const a=typeof state==='number'?state:ONSEN_BOARD.door[state];
  if(!Number.isFinite(a)||a<0||a>ONSEN_BOARD.door.open)throw new Error('The board door opens from 0 to '+ONSEN_BOARD.door.open+' degrees: '+state);
  if(locked&&a<ONSEN_LOCKOUT.doorMin)throw new Error('The board door will not shut over the lock-out on the main (it stops at '+ONSEN_LOCKOUT.doorMin+' degrees): take the lock off first');
  if(a!==doorAngle){doorAngle=a;changed();}}
 return doorAngle;
}
/**
 * The upgrade (ONSEN_UPGRADE): with no argument, whether it is in; true or false puts it in or takes it out (a film's or a
 * story's later step; the dryer goes with its socket to the ninth branch, the supply breaker becomes 60 A). Returns it.
 */
export function boardUpgrade(v){if(v!==undefined&&!!v!==upgraded){upgraded=!!v;if(!upgraded)on.set(U.circuit.id,true);changed();}return upgraded;}
/**
 * The lock-out on the main (ONSEN_LOCKOUT): with no argument, whether it is on. true puts it on a main that is off (a lock
 * goes on an isolated switch, never a live one) and opens the door at least to doorMin; false takes it off (the main stays
 * off until someone puts it up). Returns it.
 */
export function lockOut(v){
 if(v===undefined||!!v===locked)return locked;
 if(v&&on.get(ONSEN_LOCKOUT.breaker))throw new Error('Switch the main off before it is locked: a lock goes on an isolated switch');
 locked=!!v;if(locked&&doorAngle<ONSEN_LOCKOUT.doorMin)doorAngle=ONSEN_BOARD.door.open;changed();return locked;
}
/** Set the room to a named moment (ONSEN_SCENARIOS). Returns what the breakers then carry. */
export function stageScenario(name){
 const s=ONSEN_SCENARIOS[name];if(!s)throw new Error('No such Umi-no-yu scenario: '+name);
 // The upgrade and the lock are the moment's own: a moment that does not name them has the board as it is, unlocked.
 upgraded=!!s.upgrade;locked=!!s.lock;if(locked&&!s.down.includes(ONSEN_LOCKOUT.breaker))throw new Error(name+': a lock goes on a main that is off');
 doorAngle=ONSEN_BOARD.door[s.board||'shut'];
 running.clear();for(const id of [...AT_REST,...s.on])running.add(knownLoad(id));
 for(const id of s.down)known(id);
 for(const id of ALL_SWITCHES){on.set(id,!s.down.includes(id));heat.set(id,0);}
 chairLeft=running.has(CHAIR)?CHAIR_TIMER.seconds-(s.chair||0):0;timerPinned=false;
 held=false;if(s.settle)settle();if(s.wait)advance(s.wait);for(const id of s.up||[])on.set(known(id),true);relay();held=!!s.hold;
 if(s.timer!==undefined){chairLeft=readSeconds(s.timer);timerPinned=true;}
 pinLobbyChannel(s.tv);changed();return assess();
}


/** A canvas texture, or null where there is no page to draw it on (the room tests). */
function paint(w,h,draw){
 if(typeof document==='undefined'||!document.createElement)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext?.('2d');if(!ctx||!ctx.fillRect)return null;
 draw(ctx,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
/** A room's light on its floor: bright under the lamp, easing off towards the walls, nothing past its radius. */
let roomPool=null,wedge=null;
function roomPoolTexture(){
 if(roomPool)return roomPool;
 const n=64,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const d=Math.min(1,Math.hypot(x-n/2+.5,y-n/2+.5)/(n/2)),e=Math.max(0,Math.min(1,(d-.8)/.2)),i=(y*n+x)*4;
  data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*Math.max(0,1-.55*d*d)*(1-e*e*(3-2*e)));}
 roomPool=new THREE.DataTexture(data,n,n);roomPool.needsUpdate=true;roomPool.magFilter=roomPool.minFilter=THREE.LinearFilter;return roomPool;
}
/** The wedge of a room's light on the lobby floor under its noren: full at the doorway, gone a metre out, soft at the sides. */
function wedgeTexture(){
 if(wedge)return wedge;
 const w=16,h=32,data=new Uint8Array(w*h*4),soft=t=>t*t*(3-2*t);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=y/(h-1),u=(x+.5)/w,side=soft(Math.min(1,Math.min(u,1-u)/.22)),i=(y*w+x)*4;
  data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*Math.pow(1-v,1.7)*side);}
 wedge=new THREE.DataTexture(data,w,h);wedge.needsUpdate=true;wedge.magFilter=wedge.minFilter=THREE.LinearFilter;return wedge;
}
const GOTHIC='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
/** Write a line no wider than `max`, shrinking the type until it fits. */
function line(ctx,text,x,y,max,size,weight='bold'){
 let s=size;do{ctx.font=`${weight} ${s}px ${GOTHIC}`;}while(ctx.measureText(text).width>max&&--s>8);
 ctx.fillText(text,x,y);
}
const printed=(tex,color,extra={})=>new THREE.MeshStandardMaterial(tex?{map:tex,roughness:.6,polygonOffset:true,polygonOffsetFactor:-1,...extra}:{color,roughness:.6,...extra});

// Where each breaker sits on the board's front plate (board-local metres, origin at the
// middle of the plate, +x to your right as you face it). Eight ways, four to a row; the
// last two of the lower row were the 1987 board's spares, wired in the rewiring (ONSEN_REWIRING).
const PLATE={w:.496,h:.596};
const COL=[-.18,-.06,.06,.18],ROW=[.01,-.162];
const LAYOUT=Object.freeze({
 main:{x:-.115,y:.19,w:.1,h:.11,lever:.05},
 elcb:{x:.115,y:.19,w:.1,h:.11,lever:.05},
 'changing-sockets':{x:COL[0],y:ROW[0]},'changing-lights':{x:COL[1],y:ROW[0]},'bath-lights':{x:COL[2],y:ROW[0]},lobby:{x:COL[3],y:ROW[0]},
 fridge:{x:COL[0],y:ROW[1]},pump:{x:COL[1],y:ROW[1]},'vanity-2':{x:COL[2],y:ROW[1]},'vanity-3':{x:COL[3],y:ROW[1]},
});
// Each label sits just under its breaker: half the breaker's height and half the label's below it.
const LABEL_H=.062,LABEL_W=.112,labelY=L=>L.y-(L.h||.09)/2-LABEL_H/2-.01;
/** A small integer hash in [0, 1): the same hand every time, never a dice roll. */
const hash=(i,s=0)=>{let h=(i*374761393+s*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;};

function plateTexture(){
 return paint(1024,1230,(ctx,W,H)=>{
  const px=x=>(x+PLATE.w/2)/PLATE.w*W,py=y=>(PLATE.h/2-y)/PLATE.h*H,m=W/PLATE.w;
  ctx.fillStyle='#d6d8d2';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#9da19a';ctx.lineWidth=6;ctx.strokeRect(10,10,W-20,H-20);
  ctx.fillStyle='#3a3f3c';ctx.textAlign='center';ctx.textBaseline='middle';
  line(ctx,'分電盤  DISTRIBUTION BOARD  ·  100 V',W/2,py(.272),W-80,34);
  const cell=(id,jp,en,rating)=>{const L=LAYOUT[id],cx=px(L.x),cy=py(labelY(L)),cw=LABEL_W*m,ch=LABEL_H*m;
   ctx.fillStyle='#f7f3e6';ctx.fillRect(cx-cw/2,cy-ch/2,cw,ch);ctx.strokeStyle='#7d817a';ctx.lineWidth=3;ctx.strokeRect(cx-cw/2,cy-ch/2,cw,ch);
   ctx.fillStyle='#1d2422';line(ctx,jp,cx,cy-ch*.29,cw-12,34);
   ctx.fillStyle='#38403d';line(ctx,en,cx,cy+ch*.06,cw-12,24,'600');
   ctx.fillStyle='#8a2f22';line(ctx,rating,cx,cy+ch*.33,cw-12,24);};
  const B=ONSEN_BOARD;
  cell('main',B.main.jp,B.main.en,`${B.main.amps}A`);
  cell('elcb',B.elcb.jp,'Earth leakage',`${B.elcb.milliamps}mA · ${B.elcb.amps}A`);
  // The plate was printed in 1987: the two ways wired since still read 予備 under their tape.
  for(const c of ONSEN_CIRCUITS)if(c.fitted)cell(c.id,SPARE.jp,SPARE.en,String(c.way));else cell(c.id,c.jp,c.en,`${c.no} · ${c.amps}A  ${c.volts}V`);
 });
}
function directoryTexture(){
 return paint(512,640,(ctx,W,H)=>{
  ctx.fillStyle='#f4efdf';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#5c5a50';ctx.lineWidth=6;ctx.strokeRect(8,8,W-16,H-16);
  ctx.fillStyle='#1d2422';ctx.textAlign='center';ctx.textBaseline='middle';
  line(ctx,'回路表',W/2,54,W-60,46);line(ctx,'CIRCUIT LIST · UMI-NO-YU',W/2,96,W-60,24,'600');
  ctx.textAlign='left';
  const rows=ONSEN_CIRCUITS.map(c=>c.fitted?[c.way,SPARE.jp,SPARE.en,'—']:[c.no,c.jp,c.en,`${c.amps}A`]);
  rows.forEach(([no,jp,en,amps],i)=>{const y=DIRECTORY.y0+i*DIRECTORY.step;ctx.fillStyle='#1d2422';line(ctx,`${no}  ${jp}`,40,y,W-150,28);ctx.fillStyle='#4a504c';line(ctx,en,76,y+23,W-150,18,'600');
   ctx.textAlign='right';ctx.fillStyle='#8a2f22';line(ctx,amps,W-40,y,90,26);ctx.textAlign='left';});
  ctx.textAlign='center';ctx.fillStyle='#5c5a50';line(ctx,'点検 1997.4  ·  Inspected April 1997',W/2,H-40,W-60,22,'600');
 });
}
// The circuit list's rows (canvas pixels on a 512 x 640 card): the tape for ways 7 and 8 goes over the last two.
/** What the 1987 plate and circuit list print in the two ways that were spare. */
const SPARE=Object.freeze({jp:'予備',en:'Spare'});
const DIRECTORY={y0:150,step:54,w:512,h:640};
/**
 * A strip of cream masking tape with a line written on it in black marker: each character
 * a little off the line and turned, by a fixed hash, so it reads as a hand and never changes.
 */
function tapeTexture(lines,seed,{w=512,h=176}={}){
 return paint(w,h,(ctx,W,H)=>{
  ctx.clearRect?.(0,0,W,H);
  // Torn ends: a zigzag down each short edge.
  ctx.beginPath();ctx.moveTo(14,6);for(let y=6,i=0;y<=H-6;y+=H/9,i++)ctx.lineTo(4+hash(i,seed)*16,y);ctx.lineTo(14,H-6);
  ctx.lineTo(W-14,H-6);for(let y=H-6,i=0;y>=6;y-=H/9,i++)ctx.lineTo(W-4-hash(i,seed+7)*16,y);ctx.lineTo(W-14,6);ctx.closePath();
  ctx.fillStyle='#ead9a4';ctx.fill();ctx.save();ctx.clip?.();
  ctx.fillStyle='rgba(150,120,60,.08)';for(let i=0;i<220;i++)ctx.fillRect(hash(i,seed+3)*W,hash(i,seed+4)*H,2+hash(i,seed+5)*10,1);
  ctx.restore();
  ctx.fillStyle='#1b1a18';ctx.textBaseline='middle';
  lines.forEach(([text,size,y],li)=>{
   ctx.font=`bold ${size}px "Hiragino Maru Gothic ProN","M PLUS Rounded 1c","Yu Gothic","Noto Sans CJK JP",sans-serif`;
   const chars=[...text],widths=chars.map(c=>ctx.measureText(c).width*1.04),total=widths.reduce((a,b)=>a+b,0),scale=Math.min(1,(W-60)/total);
   let x=W/2-total*scale/2;
   chars.forEach((c,i)=>{const k=hash(i+li*40,seed+11);ctx.save();ctx.translate(x+widths[i]*scale/2,H*y+(k-.5)*size*.12);ctx.rotate((hash(i+li*40,seed+13)-.5)*.14);ctx.scale(scale,scale);ctx.textAlign='center';ctx.fillText(c,0,0);ctx.restore();x+=widths[i]*scale;});
  });
 });
}
function sticker(text,sub,{w=256,h=96,bg='#f6f4ee',fg='#1d2422'}={}){
 return paint(w,h,(ctx,W,H)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);ctx.strokeStyle='#8a8f88';ctx.lineWidth=4;ctx.strokeRect(3,3,W-6,H-6);
  ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';line(ctx,text,W/2,sub?H*.38:H/2,W-20,sub?46:56);if(sub){ctx.fillStyle='#5a605c';line(ctx,sub,W/2,H*.76,W-20,22,'600');}});
}

/**
 * Builds the board, the lamp fixtures and their lights, the dryers and their sockets, and
 * wires the room to the circuit state. `sun` is onsen.js's daylight, which the board shares
 * out the way it shares the lamps' bounce (fill).
 */
export function buildOnsenElectrics({room,rect,anchor,action,sun=null,sunAtNoon=1.6,hall={front:1.6,changing:-1.2}}){
 const group=new THREE.Group();group.name='Umi-no-yu electrics';room.add(group);
 const steel=new THREE.MeshStandardMaterial({color:0x9aa09c,roughness:.45,metalness:.55});
 const darkPlastic=new THREE.MeshStandardMaterial({color:0x2f3331,roughness:.55});
 const whitePlastic=new THREE.MeshStandardMaterial({color:0xeeece4,roughness:.45});
 const greyPlastic=new THREE.MeshStandardMaterial({color:0xc9cbc4,roughness:.5});
 const cordMat=new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:.7});
 const add=(geometry,material,x,y,z,name,parent=group)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=name;m.castShadow=m.receiveShadow=true;m.userData.staticProp=true;parent.add(m);return m;};

 // ---- The board: a grey steel box on the wall behind the bandai, its door shut.
 const B=ONSEN_BOARD,board=new THREE.Group();board.name='Breaker board';board.position.set(B.wallX,B.y,B.z);board.rotation.y=Math.PI/2;group.add(board);
 add(new THREE.BoxGeometry(B.w,B.h,.01),steel,0,0,.005,'Breaker board back',board);
 // The sides stop just behind the door, so its edge and theirs never share a face.
 const side=B.d-.014;for(const s of [-1,1]){add(new THREE.BoxGeometry(.012,B.h,side),steel,s*(B.w/2-.006),0,side/2,'Breaker board side',board);add(new THREE.BoxGeometry(B.w,.012,side),steel,0,s*(B.h/2-.006),side/2,'Breaker board side',board);}
 const plateTex=plateTexture(),plateMat=printed(plateTex,0xd6d8d2,{polygonOffset:false});
 const plate=add(new THREE.BoxGeometry(PLATE.w,PLATE.h,.006),[steel,steel,steel,steel,plateMat,steel],0,0,.09,'Breaker board plate',board);
 const face=.093,levers=new Map();
 const newWhite=new THREE.MeshStandardMaterial({color:0xf8f8f3,roughness:.4});// a newer breaker is whiter than ones that have hung there since 1987
 for(const id of BOARD_SWITCHES){
  if(id===U.circuit.id)continue;// the ninth is in the add-on box under the board (below)
  const L=LAYOUT[id],big=id==='main'||id==='elcb',w=L.w||.05,h=L.h||.09,depth=big?.03:.025,isNew=!!ONSEN_CIRCUITS.find(c=>c.id===id)?.fitted;
  const holder=isNew?new THREE.Group():board;if(isNew){holder.name='New breaker '+id;board.add(holder);}
  add(new THREE.BoxGeometry(w,h,depth),isNew?newWhite:big&&id==='elcb'?greyPlastic:whitePlastic,L.x,L.y,face+depth/2,'Breaker '+id,holder);
  const pivot=new THREE.Group();pivot.position.set(L.x,L.y,face+depth+.007);pivot.name='Breaker lever '+id;pivot.userData.breaker=id;holder.add(pivot);
  const lever=new THREE.Mesh(new THREE.BoxGeometry(L.lever||.016,.034,.014).translate(0,.017,0),id==='main'?darkPlastic:new THREE.MeshStandardMaterial({color:id==='elcb'?0x2f3331:0x3a3f3c,roughness:.5}));
  lever.name='Breaker lever';lever.castShadow=true;pivot.add(lever);levers.set(id,pivot);
  if(id==='elcb')add(new THREE.CylinderGeometry(.009,.009,.008,12).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:0xe2b93b,roughness:.5}),L.x+.034,L.y-.03,face+depth+.004,'Earth-leakage test button',board);
 }
 // The rewiring's labels: the two new ways and circuit 1's new name, by hand on masking tape over the printed ones.
 const tapeMat=(lines,seed,size)=>new THREE.MeshStandardMaterial(Object.assign({roughness:.85,alphaTest:.5},(()=>{const tex=tapeTexture(lines,seed,size);return tex?{map:tex}:{color:0xead9a4};})()));
 for(const c of ONSEN_CIRCUITS.filter(c=>c.tape)){const L=LAYOUT[c.id],long=c.tape.jp.length>8;
  const t=add(new THREE.PlaneGeometry(LABEL_W*.98,LABEL_H*.92),tapeMat([[`${c.no}  ${c.tape.jp}`,long?52:58,.4],[`${c.tape.en} · ${c.amps}A`,long?32:34,.76]],c.no*31),
   L.x,labelY(L)+.001,face+.0012,'Tape label '+c.id,board);
  t.rotation.z=(hash(c.no,5)-.5)*.06;t.castShadow=false;t.userData.tape=c.id;}
 // ---- The upgrade (ONSEN_UPGRADE), shown only once it is in: circuit 1's new tape over its old one, the add-on box with the
 // ninth breaker under the board, the circuit list's new lines, the 60 A supply breaker. `upgradeShows` are its parts.
 const upgradeShows=[];
 {const R=ONSEN_UPGRADED_CIRCUITS.find(c=>c.id===U.relabel.id),L=LAYOUT[R.id];
  const t=add(new THREE.PlaneGeometry(LABEL_W*.98,LABEL_H*.92),tapeMat([[`${R.no}  ${R.tape.jp}`,54,.4],[`${R.tape.en} · ${R.amps}A`,34,.76]],R.no*31+7),
   L.x+.002,labelY(L)+.0025,face+.0024,'Tape label '+R.id+' (upgrade)',board);
  t.rotation.z=(hash(R.no,9)-.5)*.07;t.castShadow=false;t.userData.tape=R.id;upgradeShows.push(t);}
 // The add-on box: a one-way grey steel box under the board on the supply breaker's side, a short grey conduit up into the
 // board's bottom (its feed from the board's load side), the ninth breaker through a window in its cover, its tape under it.
 const X=U.box,addon=new THREE.Group();addon.name=X.en;addon.position.set(X.wallX,X.y,X.z);addon.rotation.y=Math.PI/2;group.add(addon);upgradeShows.push(addon);
 {const boxSteel=steel,cover=new THREE.MeshStandardMaterial({color:0xa9aeaa,roughness:.45,metalness:.45});
  add(new THREE.BoxGeometry(X.w,X.h,X.d-.006),boxSteel,0,0,(X.d-.006)/2,'Add-on breaker box body',addon);
  add(new THREE.BoxGeometry(X.w-.008,X.h-.008,.006),cover,0,0,X.d-.003,'Add-on breaker box cover',addon);
  for(const [sx,sy] of [[-1,1],[1,1],[-1,-1],[1,-1]])add(new THREE.CylinderGeometry(.0042,.0042,.003,10).rotateX(Math.PI/2),darkPlastic,sx*(X.w/2-.013),sy*(X.h/2-.013),X.d+.0012,'Add-on breaker box screw',addon).castShadow=false;
  const top=X.h/2,gap=(B.y-B.h/2)-(X.y+top);// up to the board's bottom face
  const pipe=add(new THREE.CylinderGeometry(X.conduit,X.conduit,gap,14),new THREE.MeshStandardMaterial({color:0x9c9f9a,roughness:.55}),0,top+gap/2,X.d*.45,'Add-on breaker box conduit',addon);pipe.castShadow=false;
  add(new THREE.CylinderGeometry(X.conduit*1.45,X.conduit*1.45,.005,14),boxSteel,0,top+.0025,X.d*.45,'Add-on breaker box conduit nut',addon).castShadow=false;
  // The ninth breaker, as new and white as ways 7 and 8, through a dark window in the cover; lever up is on, like the board's.
  const id=U.circuit.id,bx=X.breakerX,depth=.022,front=X.d;
  add(new THREE.BoxGeometry(.058,.098,.002),darkPlastic,bx,0,front+.001,'Add-on breaker box window',addon).castShadow=false;
  const holder=new THREE.Group();holder.name='New breaker '+id;addon.add(holder);
  add(new THREE.BoxGeometry(.05,.09,depth),newWhite,bx,0,front+depth/2-.008,'Breaker '+id,holder);
  const pivot=new THREE.Group();pivot.position.set(bx,0,front+depth-.008+.007);pivot.name='Breaker lever '+id;pivot.userData.breaker=id;holder.add(pivot);
  const lever=new THREE.Mesh(new THREE.BoxGeometry(.016,.034,.014).translate(0,.017,0),new THREE.MeshStandardMaterial({color:0x3a3f3c,roughness:.5}));lever.name='Breaker lever';lever.castShadow=true;pivot.add(lever);levers.set(id,pivot);
  // Its tape beside it, on the cover: the way number and the mirror, and under them what it is and its rating.
  const c=U.circuit,t=add(new THREE.PlaneGeometry(.088,.07),tapeMat([[`${c.no}  ${c.tape.jp.split(' ')[0]}`,64,.24],[c.tape.jp.split(' ')[1],58,.54],[`${c.amps}A  100V`,40,.82]],c.no*31,{w:384,h:304}),X.tapeX,0,front+.0012,'Tape label '+id,addon);
  t.rotation.z=(hash(c.no,5)-.5)*.06;t.castShadow=false;t.userData.tape=id;}
 // ---- The lock-out on the main (ONSEN_LOCKOUT), shown only while it is on (the main is then off): a red clamp over the
 // lever's end in the off position, a fin under it with the padlock's shackle through its hole, the brass padlock hanging
 // from it, and behind the padlock the tag on its shackle, hanging in the gap between branch breakers 1 and 2.
 const LK=ONSEN_LOCKOUT,lock=new THREE.Group();lock.name='Main lock-out';board.add(lock);
 {const M=LAYOUT.main,red=new THREE.MeshStandardMaterial({color:0xc8302a,roughness:.45}),brass=new THREE.MeshStandardMaterial({color:0xc9a24a,roughness:.35,metalness:.55}),shackleSteel=new THREE.MeshStandardMaterial({color:0xc4c8ca,roughness:.3,metalness:.75});
  const px=M.x,pz=face+.03+.007,off=Math.PI-.6;// the main's pivot (its breaker is .03 deep) and its lever's off angle (apply's LEVER.off)
  const arm=new THREE.Group();arm.position.set(px,M.y,pz);arm.rotation.x=off;arm.name='Main lock-out clamp';lock.add(arm);
  add(new THREE.BoxGeometry(.06,.024,.024),red,0,.024,0,'Lock-out clamp',arm);
  const dir=new THREE.Vector3(0,Math.cos(off),Math.sin(off)),tip=new THREE.Vector3(px,M.y,pz).addScaledVector(dir,.036);
  // The fin hangs from the clamp's underside, its hole across (along x), so the padlock hangs face out.
  const hole=new THREE.Vector3(px,tip.y-.018,tip.z+.002);
  add(new THREE.BoxGeometry(.004,.03,.022),red,px,hole.y+.004,hole.z,'Lock-out clamp fin',lock);
  const shackle=add(new THREE.TorusGeometry(.0095,.0023,8,16,Math.PI),shackleSteel,px,hole.y-.008,hole.z,'Lock-out padlock shackle',lock);shackle.castShadow=false;
  for(const sx of [-1,1])add(new THREE.CylinderGeometry(.0023,.0023,.008,8),shackleSteel,px+sx*.0095,hole.y-.012,hole.z,'Lock-out padlock shackle',lock).castShadow=false;
  const bodyTop=hole.y-.016,bh=.036;
  add(new THREE.BoxGeometry(.032,bh,.015),brass,px,bodyTop-bh/2,hole.z,'Lock-out padlock',lock);
  add(new THREE.CylinderGeometry(.0045,.0045,.002,12).rotateX(Math.PI/2),darkPlastic,px,bodyTop-bh*.62,hole.z+.0076,'Lock-out padlock keyhole',lock).castShadow=false;
  // The tag: its eyelet on the shackle, hanging behind the padlock, its words below it.
  const T=LK.tag,tex=paint(256,512,(ctx,W,H)=>{ctx.fillStyle='#fbfaf4';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#c8302a';ctx.lineWidth=10;ctx.strokeRect(5,5,W-10,H-10);
   ctx.fillStyle='#c8302a';ctx.fillRect(0,H*.12,W,H*.36);// the red band, mostly behind the padlock
   ctx.fillStyle='#fbfaf4';ctx.beginPath();ctx.arc(W/2,H*.05,13,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8a8f88';ctx.lineWidth=4;ctx.stroke();// the eyelet
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillStyle='#1b1a18';line(ctx,T.name,W/2,H*.095,W-40,36,'bold');
   // Below the padlock: 作業中, then 投入 / 禁止 large on two lines (a line apart, never touching), then the English.
   ctx.fillStyle='#c8302a';line(ctx,T.head,W/2,H*.525,W-40,44);
   line(ctx,T.jp.slice(0,2),W/2,H*.655,W-30,84);line(ctx,T.jp.slice(2),W/2,H*.82,W-30,84);
   ctx.fillStyle='#1d2422';line(ctx,T.en,W/2,H*.94,W-30,24,'bold');});
  const tag=add(new THREE.PlaneGeometry(T.w,T.h),printed(tex,0xfbfaf4,{side:THREE.DoubleSide}),px,hole.y-.004-T.h/2,hole.z-.0105,'Lock-out tag',lock);tag.castShadow=false;
 }
 // The door, hinged on its right (the bandai-wall side, so it opens away from Miss Higa and clear of the wall), the
 // circuit list inside it; on its face a printed staff-only card and a small latch.
 const hinge=new THREE.Group();hinge.position.set(B.w/2,0,B.d);hinge.name='Breaker board door';board.add(hinge);
 add(new THREE.BoxGeometry(B.w,B.h,.012),steel,-B.w/2,0,-.006,'Breaker board door panel',hinge);
 const card=add(new THREE.PlaneGeometry(.36,.45),printed(directoryTexture(),0xf4efdf),-B.w/2,.02,-.0125,'Circuit list',hinge);card.rotation.y=Math.PI;card.castShadow=false;
 {const S=ONSEN_SIGNS.staffOnly,tex=paint(384,128,(ctx,W,H)=>{ctx.fillStyle='#fbfaf4';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#b8342e';ctx.lineWidth=6;ctx.strokeRect(5,5,W-10,H-10);
   ctx.fillStyle='#b8342e';ctx.textAlign='center';ctx.textBaseline='middle';line(ctx,S.lines[0],W/2,H*.34,W-30,44);line(ctx,S.lines[1],W/2,H*.72,W-30,34);});
  const label=add(new THREE.PlaneGeometry(.24,.08),printed(tex,0xfbfaf4),-B.w/2,.17,.0006,'Staff only card',hinge);label.castShadow=false;
  add(new THREE.BoxGeometry(.018,.06,.012),darkPlastic,-B.w+.035,0,.006,'Breaker board latch',hinge);}
 // ...and the same two ways written in on the circuit list, on one strip over its last two rows.
 {const D=DIRECTORY,rowY=py=>.45*(.5-py/D.h),y=(rowY(D.y0+6*D.step)+rowY(D.y0+7*D.step+23))/2,h=Math.abs(rowY(D.y0+6*D.step-24)-rowY(D.y0+7*D.step+40));
  const t=add(new THREE.PlaneGeometry(.33,h),tapeMat(ONSEN_CIRCUITS.filter(c=>c.fitted).map((f,i)=>[`${f.no}  ${f.tape.jp}  ${f.amps}A`,44,.3+i*.42]),97,{w:512,h:220}),
   0,y,.0009,'Tape label circuit list',card);t.rotation.z=.012;t.castShadow=false;
  // The upgrade's two lines: circuit 1 re-taped over its row, and the ninth on a strip at the foot of the card.
  const R=ONSEN_UPGRADED_CIRCUITS.find(c=>c.id===U.relabel.id),c=U.circuit;
  const r1=add(new THREE.PlaneGeometry(.33,Math.abs(rowY(D.y0-26)-rowY(D.y0+44))),tapeMat([[`${R.no}  ${R.tape.jp}  ${R.amps}A`,44,.5]],R.no*31+11,{w:512,h:110}),
   0,(rowY(D.y0-26)+rowY(D.y0+44))/2,.0012,'Tape label circuit list 1 (upgrade)',card);r1.rotation.z=-.01;r1.castShadow=false;
  const r9=add(new THREE.PlaneGeometry(.33,Math.abs(rowY(D.y0+8*D.step-26)-rowY(D.y0+8*D.step+30))),tapeMat([[`${c.no}  ${c.tape.jp}  ${c.amps}A  (増設)`,44,.5]],c.no*31+11,{w:512,h:100}),
   0,(rowY(D.y0+8*D.step-26)+rowY(D.y0+8*D.step+30))/2,.0012,'Tape label circuit list 9 (upgrade)',card);r9.rotation.z=.014;r9.castShadow=false;
  upgradeShows.push(r1,r9);}
 // It hangs over the bandai's raised floor, behind the counter: nobody walks there but Miss Higa.
 rect(B.wallX+B.d/2,B.z,B.d,B.w,B.y+B.h/2);
 const toWorld=(x,y,z)=>{board.updateMatrix();return new THREE.Vector3(x,y,z).applyMatrix4(board.matrix);};

 // ---- The supply breaker (ONSEN_CONTRACT): a cream box beside the board on the stool side, its printed label (契約 40A)
 // over a small window with its lever, lever up on like the board's. It faces into the room, as the board does.
 let contractLooks=null;
 const C=ONSEN_CONTRACT,contract=new THREE.Group();contract.name=C.en;contract.position.set(C.wallX,C.y,C.z);contract.rotation.y=Math.PI/2;group.add(contract);
 {const cream=new THREE.MeshStandardMaterial({color:0xebe6d6,roughness:.5});
  add(new THREE.BoxGeometry(C.w,C.h,C.d-.006),cream,0,0,(C.d-.006)/2,'Supply breaker box',contract);
  // The front cover a little smaller than the box, so its edge reads as a soft step and not a sharp corner.
  add(new THREE.BoxGeometry(C.w-.008,C.h-.008,.006),cream,0,0,C.d-.003,'Supply breaker cover',contract);
  const tex=paint(256,200,(ctx,W,H)=>{ctx.fillStyle='#f7f3e6';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#5c5a50';ctx.lineWidth=6;ctx.strokeRect(4,4,W-8,H-8);
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#1d2422';line(ctx,C.label.jp,W/2,H*.2,W-30,40);
   ctx.fillStyle='#a3291d';line(ctx,C.label.amps,W/2,H*.53,W-30,92);ctx.fillStyle='#4a504c';line(ctx,C.label.en,W/2,H*.84,W-30,24,'600');});
  const label=add(new THREE.PlaneGeometry(.084,.066),printed(tex,0xf7f3e6),0,.044,C.d+.0006,'Supply breaker label',contract);label.castShadow=false;
  // After the upgrade it is the 60 A breaker (ONSEN_UPGRADE.contract): the same box, newer and whiter, 契約 60A on its face.
  const L6=U.contract.label,tex60=paint(256,200,(ctx,W,H)=>{ctx.fillStyle='#fbf9f1';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#5c5a50';ctx.lineWidth=6;ctx.strokeRect(4,4,W-8,H-8);
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#1d2422';line(ctx,L6.jp,W/2,H*.2,W-30,40);
   ctx.fillStyle='#a3291d';line(ctx,L6.amps,W/2,H*.53,W-30,92);ctx.fillStyle='#4a504c';line(ctx,L6.en,W/2,H*.84,W-30,24,'600');});
  const label60=add(new THREE.PlaneGeometry(.084,.066),printed(tex60,0xfbf9f1),0,.044,C.d+.0006,'Supply breaker label (60A)',contract);label60.castShadow=false;
  contractLooks={cream,label,label60,old:cream.color.getHex(),fresh:0xf4f1e6};
  // A pale grey window, so the black lever reads up or down from across the lobby.
  add(new THREE.BoxGeometry(.05,.066,.004),new THREE.MeshStandardMaterial({color:0xb4b7b0,roughness:.6}),0,-.042,C.d+.002,'Supply breaker window',contract).castShadow=false;
  const pivot=new THREE.Group();pivot.position.set(0,-.042,C.d+.007);pivot.name='Breaker lever '+C.id;pivot.userData.breaker=C.id;contract.add(pivot);
  const lever=new THREE.Mesh(new THREE.BoxGeometry(.022,.032,.014).translate(0,.016,0),new THREE.MeshStandardMaterial({color:0x1f2321,roughness:.5}));lever.name='Breaker lever';lever.castShadow=true;pivot.add(lever);levers.set(C.id,pivot);}

 // ---- Lamp fixtures, each with its own light (the load's `light`): the housing, the glowing tube, bulb or glass, and the
 // point light where the light comes from. Fluorescent tubes glow cool white, bulbs warm (ONSEN_CIRCUITS `kelvin`).
 // A fitting screwed flat to the ceiling throws its light down and leaves the ceiling round it to the bounce, so its
 // point light sits just above the ceiling's face: the ceiling, facing away from it, takes none (the room's lamps stop
 // at its walls and ceilings, render/cel.js), and neither does the next room's ceiling across the wall. The pendant
 // lights its ceiling from below, as a pendant does.
 const glow=new Map();// mesh name -> [{material,on}]
 const lightByName=new Map();
 const pointLight=(spec,name)=>{const p=new THREE.PointLight(spec.colour,spec.intensity,spec.range,2);p.position.set(...spec.at);p.name=name;group.add(p);return p;};
 const warmGlass=()=>new THREE.MeshStandardMaterial({color:0xf3eee2,emissive:0xfff0d2,emissiveIntensity:1.1,roughness:.6});
 const tubeGlass=()=>new THREE.MeshStandardMaterial({color:0xf4f7fb,emissive:0xeef4ff,emissiveIntensity:1.3,roughness:.4});
 const fittingWhite=new THREE.MeshStandardMaterial({color:0xf1f0ea,roughness:.5});
 for(const c of ONSEN_CIRCUITS)for(const l of c.loads){
  if(l.light)lightByName.set(l.lights[0],{light:pointLight(l.light,l.lights[0]),on:l.light.intensity});
  if(!l.fixture)continue;const f=l.fixture,[x,y,z]=f.at,name=l.meshes[0];
  if(f.kind==='ring'){
   // A ring tube under a shallow milk-white shade on a short cord from the beam, and its pull cord with a little knob.
   add(new THREE.CylinderGeometry(.004,.004,.15,6),cordMat,x,y-.075,z,'Pendant cord');
   add(new THREE.CylinderGeometry(.05,.21,.07,28,1,true),new THREE.MeshStandardMaterial({color:0xf4f1e8,roughness:.6,side:THREE.DoubleSide}),x,y-.185,z,'Pendant shade');
   add(new THREE.CylinderGeometry(.05,.05,.012,20),fittingWhite,x,y-.15,z,'Pendant shade cap');
   const ring=add(new THREE.TorusGeometry(.14,.015,8,40),tubeGlass(),x,y-.225,z,name);ring.rotation.x=Math.PI/2;ring.castShadow=false;
   add(new THREE.CylinderGeometry(.0018,.0018,.3,4),cordMat,x+.03,y-.37,z,'Pendant pull cord').castShadow=false;
   add(new THREE.SphereGeometry(.009,10,8),fittingWhite,x+.03,y-.525,z,'Pendant pull knob');
  }else if(f.kind==='trough'){
   // 逆富士: a white steel body, wide on the ceiling and narrow below, the bare tube held under it by two end caps.
   const body=new THREE.BoxGeometry(f.length,.075,.15),p=body.attributes.position;
   for(let i=0;i<p.count;i++)if(p.getY(i)<0)p.setZ(i,p.getZ(i)*.36);
   body.computeVertexNormals();
   add(body,fittingWhite,x,y-.0385,z,name+' fitting');
   for(const s of [-1,1])add(new THREE.BoxGeometry(.035,.045,.04),fittingWhite,x+s*(f.length/2-.035),y-.095,z,name+' end cap');
   const tube=add(new THREE.CylinderGeometry(.0165,.0165,f.length-.1,12),tubeGlass(),x,y-.11,z,name);tube.rotation.z=Math.PI/2;tube.castShadow=false;
  }else if(f.kind==='porch'){
   // A milk-glass globe in a white damp-proof base, screwed to the underside of the porch roof (which falls towards the street).
   const base=add(new THREE.CylinderGeometry(.08,.08,.025,24),fittingWhite,x,y-.012,z,name+' base');base.rotation.x=.24;
   const globe=add(new THREE.SphereGeometry(.085,20,14),tubeGlass(),x,y-.1,z,name);globe.scale.y=.85;globe.castShadow=false;
  }else{
   const r=f.kind==='sealed'?.16:.2;
   add(new THREE.CylinderGeometry(r,r,.03,28),f.kind==='sealed'?steel:whitePlastic,x,y-.015,z,name+' base');
   add(new THREE.CylinderGeometry(r-.03,r-.02,.045,28),warmGlass(),x,y-.0525,z,name);
  }
 }
 // A lamp's pools of light on the flat-coloured ground outside (`pools`): shown with the lamp, never faded or flickered.
 const pools=new Map();
 for(const l of ALL_LOADS){if(!l.pools)continue;
  const P=createLightPools(group,l.pools.discs.map(d=>({...d})),{color:l.light.colour,strength:l.pools.strength});P.group.name=l.en+' light pools';
  for(const st of l.pools.steps){const m=new THREE.Mesh(new THREE.PlaneGeometry(st.w,st.d),P.material);m.rotation.x=-Math.PI/2;m.position.set(st.x,st.y+.004,st.z);m.renderOrder=3;m.name='Lamp light pool';m.raycast=()=>{};m.castShadow=m.receiveShadow=false;P.group.add(m);}
  pools.set(l.id,P);}
 // Each room's lamp on its own floor (`light.floor`): a soft pool clipped to the room, so the colour changes exactly at
 // the walls and under the noren, and the wedge a changing room's light throws out into the lobby under its noren.
 for(const l of ALL_LOADS){const F=l.light?.floor;if(!F)continue;
  const mat=(map,strength)=>{const m=new THREE.MeshBasicMaterial({map,color:l.light.colour,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,
   polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:false,side:THREE.DoubleSide});m.userData.strength=strength;return m;};
  const list=[];pools.set(l.id+' floor',{update:g=>{for(const m of list){m.material.opacity=g*m.material.userData.strength;m.visible=g>0;}}});
  const [x0,x1,z0,z1]=F.rect,g=new THREE.PlaneGeometry(x1-x0,z1-z0,1,1),pos=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<pos.count;i++){const wx=(x0+x1)/2+pos.getX(i),wz=(z0+z1)/2-pos.getY(i);uv.setXY(i,.5+(wx-F.centre[0])/(2*F.radius),.5+(wz-F.centre[1])/(2*F.radius));}
  const floor=new THREE.Mesh(g,mat(roomPoolTexture(),F.strength));floor.rotation.x=-Math.PI/2;floor.position.set((x0+x1)/2,.006,(z0+z1)/2);list.push(floor);
  if(F.wedge){const W=F.wedge,zf=hall.front+.002,zd=zf+W.depth,w=new THREE.BufferGeometry();
   w.setAttribute('position',new THREE.Float32BufferAttribute([W.x0,.006,zf,W.x1,.006,zf,W.x0-W.spread,.006,zd,W.x1+W.spread,.006,zd],3));
   w.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1,1,1],2));w.setIndex([0,2,1,1,2,3]);w.computeVertexNormals();
   list.push(new THREE.Mesh(w,mat(wedgeTexture(),W.strength)));}
  for(const m of list){m.name=l.en+' on the floor';m.renderOrder=3;m.raycast=()=>{};m.castShadow=m.receiveShadow=false;m.userData.lightPool=true;m.visible=false;group.add(m);}}
 // Light thrown from one room into another (ONSEN_SPILLS): its share follows its lamps; `night` ones also the dark outside.
 const spills=ONSEN_SPILLS.map(s=>({spec:s,light:pointLight(s,s.name)}));
 // ---- The dryers: three different makes at the three mirrors, each on its own socket.
 const vanity={top:.81,wall:-1.14,mirrors:[-3.9,-2.95,-2]};
 const socket=(x,y,z,ry,name)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;g.name=name;group.add(g);
  add(new THREE.BoxGeometry(.07,.11,.012),whitePlastic,0,0,.006,name+' plate',g);
  add(new THREE.BoxGeometry(.035,.04,.022),greyPlastic,0,0,.023,name+' plug',g);return g;};
 // A cord through its points with the corners rounded by quadratic curves, which never
 // leave the hull of their points: it cannot dip through the floor or the counter.
 const cordGeometry=points=>{const v=points.map(p=>new THREE.Vector3(...p)),mid=(a,b)=>a.clone().add(b).multiplyScalar(.5),path=new THREE.CurvePath();
  path.add(new THREE.LineCurve3(v[0],mid(v[0],v[1])));
  for(let i=1;i<v.length-1;i++)path.add(new THREE.QuadraticBezierCurve3(mid(v[i-1],v[i]),v[i],mid(v[i],v[i+1])));
  path.add(new THREE.LineCurve3(mid(v.at(-2),v.at(-1)),v.at(-1)));
  const g=new THREE.TubeGeometry(path,48,.004,6);g.userData.length=path.getLength();return g;};
 const cord=(points,name)=>{const tube=new THREE.Mesh(cordGeometry(points),cordMat);tube.name=name;tube.castShadow=true;tube.userData.points=points;group.add(tube);return tube;};
 const DRYERS=[{color:0xe9e3d3,len:.17,nozzle:.055},{color:0x8fbcd4,len:.18,nozzle:.075},{color:0xe39a8c,len:.16,nozzle:.05}];
 const rating=sticker('1200W  100V','HAIR DRYER');
 // What a running dryer shows: its pilot lamp lit, a faint hum on the counter, and air
 // out of the nozzle (three soft streaks that slide out and fade, the way a comic draws a
 // draught). Off, the lamp is dark red glass and nothing moves.
 const airMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false});
 const dryers=[];
 DRYERS.forEach((d,i)=>{
  const id='dryer-'+(i+1),mx=vanity.mirrors[i],x=mx+.12,z=-.86,sx=mx-.25,body=new THREE.MeshStandardMaterial({color:d.color,roughness:.35});
  const g=new THREE.Group();g.position.set(x,vanity.top,z);g.name='Hair dryer '+(i+1);group.add(g);
  const m=add(new THREE.CylinderGeometry(.045,.045,d.len,20).rotateZ(Math.PI/2),body,0,.045,0,'Hair dryer '+(i+1),g);
  add(new THREE.CylinderGeometry(.04,.04,.004,20).rotateZ(Math.PI/2),darkPlastic,-d.len/2-.002,.045,0,'Hair dryer grille',g);
  add(new THREE.CylinderGeometry(.026,.036,d.nozzle,16).rotateZ(Math.PI/2),body,d.len/2+d.nozzle/2,.045,0,'Hair dryer nozzle',g);
  add(new THREE.BoxGeometry(.034,.03,.13),body,-.01,.015,-.09,'Hair dryer handle',g);
  const s=add(new THREE.PlaneGeometry(.075,.028),printed(rating,0xf6f4ee),-.005,.045,.0462,'Hair dryer rating sticker',g);s.castShadow=false;
  // The pilot lamp: a small lens set into the housing on the side you face, by the grille end.
  const lens=add(new THREE.SphereGeometry(.0075,12,8),new THREE.MeshStandardMaterial({color:0x6a2018,emissive:0xff5a2a,emissiveIntensity:1.8,roughness:.3}),-d.len/2+.022,.063,.039,'Hair dryer '+(i+1)+' pilot',g);lens.castShadow=false;
  const air=new THREE.Group();air.name='Hair dryer '+(i+1)+' air';air.position.set(d.len/2+d.nozzle,.045,0);air.visible=false;g.add(air);
  const streaks=[[0,.012,0],[1,-.01,.012],[2,-.004,-.014]].map(([k,y,zz])=>{const st=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.05,6).rotateZ(Math.PI/2),airMat.clone());st.name='Hair dryer air streak';st.position.set(.03,y,zz);st.userData.k=k;st.castShadow=false;air.add(st);return st;});
  m.userData.load=id;
  dryers.push({id,group:g,air,streaks,spin:0,phase:hash(i+1,17)*Math.PI*2,hz:8+hash(i+1,19)*3});
  socket(sx,.88,vanity.wall,0,'Vanity socket '+(i+1));
  const hx=x-.01;
  // Each cord is named for its dryer, so a film can hide one dryer and its cord and keep the others.
  const rest=[[hx,.825,-1.016],[hx,.815,-1.04],[(hx+sx)/2,.814,-1.07],[sx,.815,-1.095],[sx,.83,-1.112],[sx,.862,-1.117]];
  const c=cord(rest,'Hair dryer '+(i+1)+' cord');
  Object.assign(dryers.at(-1),{cord:c,rest,plug:new THREE.Vector3(sx,.862,-1.117),home:{position:g.position.clone(),quaternion:g.quaternion.clone()}});
 });
 /**
  * A dryer taken off the counter (the film puts it in a hand): `at` is where the dryer's body sits (its group origin),
  * `aim` the point the nozzle looks at, the handle hanging below. Its cord runs taut from the foot of the handle to its
  * socket, with the little sag a pulled cord keeps, and must reach (DRYER_CORD). null puts it back on the counter.
  * Returns the cord's length and how much of the cord is left.
  */
 const handleFoot=new THREE.Vector3(-.01,.015,-.155),UP=new THREE.Vector3(0,1,0);
 function holdDryer(n,pose=null){
  const D=dryers[n-1];if(!D)throw new Error('No hair dryer '+n+' at the mirrors');
  if(pose==null){D.group.position.copy(D.home.position);D.group.quaternion.copy(D.home.quaternion);D.held=null;D.cord.geometry.dispose();D.cord.geometry=cordGeometry(D.rest);D.cord.userData.points=D.rest;return {dryer:n,held:false,length:D.cord.geometry.userData.length};}
  const at=new THREE.Vector3(...pose.at),X=new THREE.Vector3(...pose.aim).sub(at).normalize(),Z=UP.clone().addScaledVector(X,-X.dot(UP));
  if(!(Z.lengthSq()>1e-6))throw new Error('Aim a dryer at something, not straight up or down');Z.normalize();const Y=Z.clone().cross(X);
  // Worked out first and applied only if the cord reaches: a refused pose leaves the dryer where it was.
  const g=D.group,q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Z)),m=new THREE.Matrix4().compose(at,q,g.scale);
  const foot=handleFoot.clone().applyMatrix4(m),plug=D.plug,drop=foot.clone().add(new THREE.Vector3(0,-.03,0));
  const midPoint=drop.clone().lerp(plug,.5);midPoint.y-=.012*drop.distanceTo(plug);
  const points=[foot,drop,midPoint,plug.clone().add(new THREE.Vector3(0,0,.03)),plug].map(v=>v.toArray());
  const geometry=cordGeometry(points),length=geometry.userData.length;
  if(length>DRYER_CORD.length){geometry.dispose();throw new Error(`Hair dryer ${n}'s cord is ${DRYER_CORD.length} m; that needs ${length.toFixed(2)} m`);}
  g.position.copy(at);g.quaternion.copy(q);D.cord.geometry.dispose();D.cord.geometry=geometry;D.cord.userData.points=points;D.held={at:pose.at,aim:pose.aim};
  return {dryer:n,held:true,length,spare:DRYER_CORD.length-length};
 }
 // ---- The massage chair's 1994 spur (ONSEN_RACEWAY): white raceway round the women's changing
 // room, through the partition, over both noren, through the wall, down to a surface socket box by the chair.
 const RW=ONSEN_RACEWAY,rwMat=new THREE.MeshStandardMaterial({color:RW.colour,roughness:.32});
 const raceway=new THREE.Group();raceway.name=RW.name;raceway.userData.raceway=RW.id;group.add(raceway);
 const AX={x:0,y:1,z:2},axisOf=f=>f[1],signOf=f=>f[0]==='+'?1:-1;
 const boxFrom=(min,max,name)=>{const size=[0,1,2].map(i=>max[i]-min[i]),c=[0,1,2].map(i=>(min[i]+max[i])/2);const b=add(new THREE.BoxGeometry(...size),rwMat,...c,name,raceway);b.castShadow=false;return b;};
 // One straight run between two centre-line points, its back on the wall face.
 const extent=(p,q,face)=>{const n=AX[axisOf(face)],sg=signOf(face),min=[0,0,0],max=[0,0,0];
  for(let i=0;i<3;i++){const lo=Math.min(p[i],q[i]),hi=Math.max(p[i],q[i]);
   if(i===n){min[i]=Math.min(p[i],p[i]+sg*RW.d);max[i]=Math.max(p[i],p[i]+sg*RW.d);}else if(hi-lo>1e-6){min[i]=lo;max[i]=hi;}else{min[i]=p[i]-RW.w/2;max[i]=p[i]+RW.w/2;}}
  return {min,max,face,wall:p[n],n};};
 const runs=[];
 for(const r of RW.runs){const segs=[];for(let i=0;i<r.path.length-1;i++){const e=extent(r.path[i],r.path[i+1],r.face);segs.push(e);boxFrom(e.min,e.max,'Raceway run');}runs.push({...r,segs});}
 // Moulded fittings over every joint: a little bigger than the duct, never behind a wall.
 const fitting=(parts,walls,name)=>{const P=.0025,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const e of parts)for(let i=0;i<3;i++){min[i]=Math.min(min[i],e.min[i]);max[i]=Math.max(max[i],e.max[i]);}
  for(let i=0;i<3;i++){min[i]-=P;max[i]+=P;}
  for(const w of walls){if(w.sign>0)min[w.n]=Math.max(min[w.n],w.at);else max[w.n]=Math.min(max[w.n],w.at);}
  return boxFrom(min,max,name);};
 const endOf=(e,atEnd,len=.02)=>{const min=[...e.min],max=[...e.max];for(let i=0;i<3;i++){if(i===e.n||max[i]-min[i]<=RW.w+1e-6)continue;if(atEnd===(e.dir[i]>0))min[i]=max[i]-len;else max[i]=min[i]+len;}return {min,max};};
 const wallOf=e=>({n:e.n,at:e.wall,sign:signOf(e.face)});
 runs.forEach(r=>r.segs.forEach((e,i)=>{const p=r.path[i],q=r.path[i+1];e.dir=[0,1,2].map(k=>Math.sign(q[k]-p[k]));}));
 runs.forEach((r,ri)=>{
  r.segs.forEach((e,i)=>{if(i>0)fitting([endOf(r.segs[i-1],true),endOf(e,false)],[wallOf(e)],'Raceway elbow');});
  const next=runs[ri+1];
  if(next&&!r.end){const a=r.segs.at(-1),b=next.segs[0];fitting([endOf(a,true),endOf(b,false)],[wallOf(a),wallOf(b)],'Raceway corner');}
  if(r.end==='wall')fitting([endOf(r.segs.at(-1),true)],[wallOf(r.segs.at(-1))],'Raceway end cap');
  if(r.start==='wall')fitting([endOf(r.segs[0],false)],[wallOf(r.segs[0])],'Raceway end cap');
 });
 // The surface socket box at the raceway's end, above the wainscot rail, facing the chair.
 {const X=RW.box,g=new THREE.Group();g.position.set(...X.at);g.rotation.y=-Math.PI/2;g.name='Massage chair socket';group.add(g);
  add(new THREE.BoxGeometry(X.w,X.h,X.d),rwMat,0,0,X.d/2,'Massage chair socket box',g);
  add(new THREE.BoxGeometry(.05,.07,.004),whitePlastic,0,-.01,X.d+.002,'Massage chair socket plate',g);
  add(new THREE.BoxGeometry(.035,.04,.022),greyPlastic,0,-.01,X.d+.004+.011,'Massage chair socket plug',g);}
 // The 1994 socket's cord (ONSEN_CHAIR.cord): from the chair's cord anchor, straight out of the back of its plinth, along
 // the floor behind its right corner to the wall by the milk cooler, and up the wall in front of the wainscot rail into the plug.
 cord(ONSEN_CHAIR.cord,'Massage chair cord');
 // Its rating plate, on the right arm unit's outer face, low and near the back where the cord leaves it (ONSEN_CHAIR.plate).
 {const P=ONSEN_CHAIR.plate,plate=add(new THREE.PlaneGeometry(P.w,P.h),printed(sticker('200W  100V','MASSAGE CHAIR'),0xf6f4ee),...P.at,'Massage chair rating plate');plate.rotation.y=P.yaw;plate.castShadow=false;}
 // The coin timer (CHAIR_TIMER) on the coin box at the front of the chair's right arm: ¥100 for ten minutes. The box, its
 // coin slot, its start and stop buttons and its price label are the chair's own (Studio's model); the room keeps the two
 // parts that light and count: the red LED readout of the time left in the box's window (the timer-display anchor, 0.5 mm
 // proud of the face plate, as the model's own printed window was) and the 運転中 lamp over it, a red lens on the face plate
 // whose front is the running-lamp anchor. Both face the lobby, as the chair does.
 const timer=new THREE.Group();timer.name='Massage chair coin timer';group.add(timer);
 // The readout: a smoked window with four red seven-segment digits; dark glass when the chair has no power.
 const ledCanvas=typeof document!=='undefined'&&document.createElement?document.createElement('canvas'):null;let ledCtx=null,ledTex=null;
 if(ledCanvas){ledCanvas.width=128;ledCanvas.height=56;ledCtx=ledCanvas.getContext?.('2d')||null;if(ledCtx?.fillRect){ledTex=new THREE.CanvasTexture(ledCanvas);ledTex.colorSpace=THREE.SRGBColorSpace;}else ledCtx=null;}
 // A polygon offset as well as the half millimetre, so no depth buffer ever lets the face plate flicker through it.
 const onFace={polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1};
 const led=add(new THREE.PlaneGeometry(ONSEN_CHAIR.led.w,ONSEN_CHAIR.led.h),new THREE.MeshBasicMaterial(ledTex?{map:ledTex,toneMapped:false,...onFace}:{color:0x1a0c0a,...onFace}),...CHAIR_AT.anchor('timer-display'),CHAIR_TIMER.name,timer);
 led.rotation.y=CHAIR_AT.yaw;led.castShadow=false;
 {const L=ONSEN_CHAIR.lamp,[lx,ly,lz]=CHAIR_AT.anchor('running-lamp'),[fx,,fz]=CHAIR_AT.facing;
  const chairLamp=add(new THREE.SphereGeometry(L.r,12,8),new THREE.MeshStandardMaterial({color:0x6a2018,emissive:0xff4a2a,emissiveIntensity:2,roughness:.3}),lx-fx*L.depth,ly,lz-fz*L.depth,'Massage chair lamp',timer);
  chairLamp.rotation.y=CHAIR_AT.yaw;chairLamp.scale.z=L.depth/L.r;chairLamp.castShadow=false;}
 // Seven segments a digit (a b c d e f g), drawn lit or as the faint unlit bars an LED shows behind its smoked glass.
 const SEG={0:'abcdef',1:'bc',2:'abged',3:'abgcd',4:'fgbc',5:'afgcd',6:'afgedc',7:'abc',8:'abcdefg',9:'abcdfg'};
 let ledShown=null;
 const drawLed=(text,lit)=>{if(!ledCtx||ledShown===text+lit)return;ledShown=text+lit;const c=ledCtx;c.fillStyle='#160806';c.fillRect(0,0,128,56);
  const digits=text.padStart(5,' ').split(''),on=lit?'#ff3b1f':'#2a0d09',off=lit?'#3a120c':'#22100c',W=18,H=40,T=4;
  const seg=(x,y,k,col)=>{c.fillStyle=col;const S={a:[x+T,y,W-2*T,T],b:[x+W-T,y+T,T,H/2-T],c:[x+W-T,y+H/2,T,H/2-T],d:[x+T,y+H-T,W-2*T,T],e:[x,y+H/2,T,H/2-T],f:[x,y+T,T,H/2-T],g:[x+T,y+H/2-T/2,W-2*T,T]}[k];c.fillRect(...S);};
  let x=10;for(const ch of digits){if(ch===':'){c.fillStyle=lit?on:off;c.fillRect(x+1,20,4,4);c.fillRect(x+1,32,4,4);x+=10;continue;}
   for(const k of 'abcdefg')seg(x,8,k,ch!==' '&&SEG[ch]?.includes(k)?on:off);x+=W+6;}
  ledTex.needsUpdate=true;};
 // The kneading rollers behind the backrest's cover, on its roller track (ONSEN_CHAIR.rollers): two soft lumps that knead and
 // travel up and down the back while it runs, and stop where they are when the power goes. They are the chair's vinyl:
 // white under its vertex colour (the card's upholstery), as the model's own vinyl is, so the cel ramp bands them alike.
 const RL=ONSEN_CHAIR.rollers,track=CHAIR_AT.anchor('roller-track'),[fx,,fz]=CHAIR_AT.facing,across=[fz,0,-fx];// the chair’s own x (from the sitter’s right to left), in the room
 const rollerGeometry=new THREE.SphereGeometry(RL.r,16,10),vinyl=new THREE.Color(CHAIR_AT.card.colours.upholstery);
 rollerGeometry.setAttribute('color',new THREE.Float32BufferAttribute(Array.from({length:rollerGeometry.attributes.position.count},()=>[vinyl.r,vinyl.g,vinyl.b]).flat(),3));
 const rollerVinyl=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.9,metalness:0});
 const rollers=new THREE.Group();rollers.name='Massage chair rollers';group.add(rollers);
 const lumps=[-1,1].map(sd=>{const l=add(rollerGeometry,rollerVinyl,...track,'Massage chair roller',rollers);l.rotation.y=CHAIR_AT.yaw;l.scale.set(.8,1,.28);l.userData.side=sd;l.castShadow=false;return l;});
 const chair={time:0,id:'massage-chair'};
 const placeRollers=()=>{const t=chair.time,y=RL.mid+RL.travel*Math.sin(t*2*Math.PI/RL.period);
  for(const l of lumps){const k=Math.sin(t*2*Math.PI*.7+(l.userData.side>0?Math.PI:0)),off=l.userData.side*(RL.spread+RL.wobble*k);
   l.position.set(track[0]+across[0]*off,y+RL.knead*k,track[2]+across[2]*off);l.scale.z=.24+.06*(k+1)/2;}};
 placeRollers();
 // The fan's socket, back to back with the television's on the lobby side of the wall.
 socket(3.62,.3,hall.front-.06,Math.PI,'Fan socket');
 cord([[3.85,.004,1.222],[3.8,.004,1.33],[3.66,.004,1.47],[3.625,.03,1.505],[3.62,.15,1.515],[3.62,.28,1.517]],'Fan cord');

 // ---- Miss Higa's electric pot (the lobby circuit's `kettle`): on its turning foot on the bandai top, its spout and lamp
 // panel to the lobby (she turns it on its foot to pour), its magnet plug at the back, and the cord over the counter's
 // back edge to the socket on the counter's inside face. Switched off, the magnet plug lies on the counter beside it.
 const KP=LOAD_BY_ID.get('kettle').prop,[kx,ky,kz]=KP.at,pot=new THREE.Group();pot.name='Electric pot';pot.position.set(kx,ky,kz);pot.rotation.y=KP.face;pot.userData.prop='kettle';group.add(pot);
 const potCream=new THREE.MeshStandardMaterial({color:0xf2e8d2,roughness:.4}),potBrown=new THREE.MeshStandardMaterial({color:0x7a5640,roughness:.45});
 {const r=KP.r;
  add(new THREE.CylinderGeometry(r-.002,r+.002,.025,28),potBrown,0,.0125,0,'Electric pot foot',pot);
  const body=add(new THREE.LatheGeometry([[0,.025],[r-.006,.025],[r-.002,.035],[r,.06],[r,.22],[r-.003,.235],[r-.01,.245],[0,.245]].map(([x,y])=>new THREE.Vector2(x,y)),28),potCream,0,0,0,'Electric pot body',pot);body.userData.restsOn='Electric pot foot';
  // The band of small orange flowers round the middle of the body.
  const flowers=paint(512,96,(ctx,W,H)=>{ctx.fillStyle='#f2e8d2';ctx.fillRect(0,0,W,H);
   for(let i=0;i<12;i++){const cx=(i+.5)*W/12,cy=H/2+(i%2?-12:12);
    ctx.fillStyle='#8aa266';for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(cx+s*16,cy+s*-6,9,4,s*.5,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#e48a3a';for(let k=0;k<5;k++){const a=k*Math.PI*2/5;ctx.beginPath();ctx.arc(cx+Math.cos(a)*7,cy+Math.sin(a)*7,6,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#7a4a2a';ctx.beginPath();ctx.arc(cx,cy,3.5,0,Math.PI*2);ctx.fill();}});
  add(new THREE.CylinderGeometry(r+.0008,r+.0008,.085,28,1,true),printed(flowers,0xf0c49a),0,.125,0,'Electric pot flowers',pot).castShadow=false;
  add(new THREE.CylinderGeometry(r-.012,r-.004,.04,28),potBrown,0,.265,0,'Electric pot shoulder',pot);
  add(new THREE.CylinderGeometry(r-.03,r-.012,.022,28),potBrown,0,.296,0,'Electric pot lid',pot);
  add(new THREE.CylinderGeometry(.036,.038,.018,24),potCream,-.012,.316,0,'Electric pot pump button',pot);
  // The spout at the front of the shoulder, and the carrying handle folded down over the back of the lid.
  add(new THREE.BoxGeometry(.04,.03,.034),potBrown,r-.005,.262,0,'Electric pot spout',pot);
  add(new THREE.CylinderGeometry(.008,.011,.022,12),potBrown,r+.01,.24,0,'Electric pot spout nozzle',pot);
  const handle=add(new THREE.TorusGeometry(.082,.0065,6,18,Math.PI).rotateX(-Math.PI/2).rotateY(Math.PI/2),potBrown,0,.2985,0,'Electric pot handle',pot);handle.castShadow=false;
  for(const s of [-1,1])add(new THREE.BoxGeometry(.012,.014,.012),potBrown,0,.297,s*.084,'Electric pot handle hinge',pot);
  // The lamp panel on the lid's front: the red 沸騰 lamp, lit while it boils, and the 再沸騰 button beside it.
  add(new THREE.BoxGeometry(.034,.006,.052),new THREE.MeshStandardMaterial({color:0xe9dcc0,roughness:.5}),.058,.309,0,'Electric pot panel',pot);
  add(new THREE.SphereGeometry(.0075,12,8),new THREE.MeshStandardMaterial({color:0x3a1410,emissive:0xff4a1a,emissiveIntensity:3,roughness:.3}),.06,.313,.013,'Electric pot boil lamp',pot).castShadow=false;// dark glass when off
  add(new THREE.BoxGeometry(.014,.006,.014),potCream,.06,.314,-.013,'Electric pot reboil button',pot);}
 // Its socket on the counter's inside face, under the top, on her side: a cord over the back edge and nobody else's reach.
 socket(-4.16,.6,2.2,-Math.PI/2,'Bandai socket');
 // The magnet plug: on the pot's back while it is switched on, lying on the counter top beside it when it is off.
 const magnet=new THREE.Group();magnet.name='Electric pot magnet plug';magnet.userData.dynamicProp=true;group.add(magnet);
 add(new THREE.BoxGeometry(.028,.022,.03),new THREE.MeshStandardMaterial({color:0xd9d3c4,roughness:.5}),0,0,0,'Electric pot magnet plug body',magnet);
 const POT_PLUG={on:{at:[kx-KP.r-.013,ky+.05,kz],yaw:0},off:{at:[-4.15,ky+.011,2.36],yaw:.35}};
 // The top's surface is at ky and its back edge at x -4.2: plugged, the cord leaves the plug 5 cm up the pot and drops
 // past the edge; unplugged, it comes up past the edge and lies on the top (its radius above the surface) to the plug.
 const POT_CORD={on:[[-4.195,.6,2.2],[-4.207,.605,2.2],[-4.214,.64,2.205],[-4.213,.7,2.215],[-4.21,.79,2.222],[-4.198,ky+.05,kz],[-4.187,ky+.05,kz]],
  off:[[-4.195,.6,2.2],[-4.207,.605,2.2],[-4.214,.64,2.205],[-4.213,.7,2.24],[-4.208,ky+.016,2.3],[-4.18,ky+.0045,2.345],[-4.163,ky+.0045,2.365]]};
 const potCord=cord(POT_CORD.on,'Electric pot cord');potCord.userData.dynamicProp=true;let potPlugged=null;
 const plugPot=plugged=>{if(plugged===potPlugged)return;potPlugged=plugged;const P=plugged?POT_PLUG.on:POT_PLUG.off;magnet.position.set(...P.at);magnet.rotation.y=P.yaw;
  magnet.userData.restsOn=plugged?null:'Bandai top';const pts=plugged?POT_CORD.on:POT_CORD.off;potCord.geometry.dispose();potCord.geometry=cordGeometry(pts);potCord.userData.points=pts;};

 // ---- What each circuit switches. Found once, by name, among what the room built.
 for(const c of ONSEN_CIRCUITS)for(const l of c.loads)for(const name of l.meshes||[]){
  if(glow.has(name))continue;const list=[];
  room.traverse(o=>{if(o.isMesh&&o.name===name&&o.material?.emissive)list.push({material:o.material,on:o.material.emissiveIntensity});});
  if(list.some(e=>e.on>0))glow.set(name,list.filter(e=>e.on>0));
 }
 const screens=new Map(),hidden=new Map();
 for(const c of ONSEN_CIRCUITS)for(const l of c.loads){
  for(const name of l.screens||[]){const tv=room.getObjectByName(name);const glass=tv?.children.find(o=>o.isMesh&&o.geometry?.type==='PlaneGeometry');if(glass)screens.set(name,glass);}
  for(const name of l.hides||[]){const o=room.getObjectByName(name);if(o)hidden.set(name,o);}
 }
 // The hemisphere is the light the lamps bounce round the house (and, by day, what comes
 // in through the shoji and the glass). A room is lit mostly by its own lamps, so the fill
 // follows the share of lamp watts still lit, counted mostly in the room you are looking
 // from: a dark changing room looks dark from inside it, while the lobby stays bright.
 // The weight eases over SPILL metres either side of a doorway, so walking through it
 // never pops. It is kept low after dark (ONSEN_FILL) so each room is seen by its own lamp; out on
 // the rock bath at night the house's bounce is only what comes through the glass.
 let hemi=null;room.traverse(o=>{if(o.isHemisphereLight&&!hemi)hemi=o;});
 const zones={lobby:[-Infinity,Infinity,hall.front,Infinity],women:[-Infinity,0,hall.changing,hall.front],men:[0,Infinity,hall.changing,hall.front],bath:[-Infinity,Infinity,hall.bath??-4.4,hall.changing]};
 // A room's light reaches you through its doorways, not through its walls: the two noren, the two bath doors.
 const W=ONSEN_DOORWAYS.women,M=ONSEN_DOORWAYS.men,bathDoor=s=>[s*.84,s*1.66].sort((a,b)=>a-b);
 const doors={lobby:[[W.x0,W.x1,hall.front],[M.x0,M.x1,hall.front]],women:[[W.x0,W.x1,hall.front],[...bathDoor(-1),hall.changing]],men:[[M.x0,M.x1,hall.front],[...bathDoor(1),hall.changing]],
  bath:[[...bathDoor(-1),hall.changing],[...bathDoor(1),hall.changing],[-5,5,hall.bath??-4.4]]};// and its glass, out to the rock bath
 const SPILL=.6,AWAY=.15;
 const hemiOn=hemi?.intensity??0,skyOn=hemi?hemi.color.clone():new THREE.Color(),groundOn=hemi?hemi.groundColor.clone():new THREE.Color();
 // The house's own lamps (the porch lamp lights the street, not the bounce inside; the andon is too small to count).
 const lampLoads=ONSEN_CIRCUITS.flatMap(c=>c.loads.filter(l=>l.fixture&&zones[l.fixture.room]).map(l=>({id:l.id,c:c.id,w:l.watts,room:l.fixture.room})));
 const inside=(r,x,z)=>x>=r[0]&&x<r[1]&&z>=r[2]&&z<r[3];
 /** How much of a room's light reaches the camera: all of it inside the room, easing out over SPILL metres from its doorways. */
 const reachOf=(room,x,z,away)=>{if(x===null||inside(zones[room],x,z))return 1;
  let d=Infinity;for(const [x0,x1,dz] of doors[room])d=Math.min(d,Math.hypot(Math.max(x0-x,x-x1,0),z-dz));
  return away+(1-away)*Math.max(0,1-d/SPILL);};
 // A lamp switched off at its own switch leaves the house its usual floor of fill (the
 // other rooms' lamps through the doorways, the street through the glass). A lamp whose
 // breaker is off, or the main, takes that with it: with the whole house isolated, only the
 // daylight (or the dusk) through the shoji and the door glass is left, dark enough that a
 // torch would read. Set from the breaker listeners, so it changes in the same frame as the
 // levers, and comes back exactly when the power does.
 const FLOOR={off:.3,dead:.03,day:.5};
 const dusk=new THREE.Color(ONSEN_FILL.dark),litFill=new THREE.Color(ONSEN_FILL.lit),bounce=new THREE.Color(ONSEN_FILL.bounce),c1=new THREE.Color();
 let day=0,viewX=null,viewZ=null,townFill=1;
 const fill=()=>{if(!hemi)return;let lit=0,dead=0,all=0;
  for(const l of lampLoads){const w=l.w*reachOf(l.room,viewX,viewZ,AWAY);all+=w;if(!isLive(l.c))dead+=w;else if(running.has(l.id))lit+=w;}
  const off=all-lit-dead,dark=FLOOR.dead+FLOOR.day*day;
  // Out past the glass at night, the house's bounce falls to what the lit glass gives.
  const out=viewZ===null?0:Math.max(0,Math.min(1,((hall.bath??-4.4)-viewZ)/SPILL));
  hemi.intensity=hemiOn*((ONSEN_FILL.house+(1-ONSEN_FILL.house)*day)*((lit+off*(FLOOR.off+FLOOR.day*day))/all)+dead*dark/all)*(1-out*(1-day)*ONSEN_FILL.outside);
  // Its colour: the lamps' bounce, the dusk where they are dead, and by day the daylight's.
  const share=lit+off+dead*.25;c1.copy(litFill).multiplyScalar((lit+off)/share).add(dusk.clone().multiplyScalar(dead*.25/share));
  // Its lower half is the light thrown back up off the lit floors: what the ceilings round a flush fitting are seen by.
  hemi.color.copy(c1).lerp(skyOn,day*.6);hemi.groundColor.copy(groundOn).lerp(bounce,lit/all).multiply(c1.lerp(skyOn,.5));
  // The town's own indoor fill (sky, bounce, sun: game.js) stands for the same house light, so a
  // dead house lets in only the daylight's share of it too; with the lamps on it is untouched.
  // After dark a lamp-lit house takes only a little of the town's sky fill (ONSEN_FILL.townLit): its lamps light it.
  const house=(lit+off+dead*dark)/all;townFill=(lit*(ONSEN_FILL.townLit+(1-ONSEN_FILL.townLit)*day)+off+dead*dark)/all;
  // The room's own sun (onsen.js) is the daylight in the house as well as on the rock bath: the same share of it.
  if(sun)sun.intensity=sunAtNoon*day*house;
  // The lit glass: its lamps' share, and only once the outside is darker than the hall.
  for(const s of spills){const n=s.spec.from.filter(id=>running.has(id)&&isPowered(id)).length;s.light.intensity=s.spec.intensity*n/s.spec.from.length*(s.spec.night?1-day:1);}};
 // Where the picture is taken from: the plate is always drawn, so it hears every frame's camera.
 plate.frustumCulled=false;
 plate.onBeforeRender=(renderer,scene,camera)=>{if(!camera.isPerspectiveCamera)return;const p=room.worldToLocal(new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld));if(viewZ===null||Math.abs(p.z-viewZ)>.005||Math.abs(p.x-viewX)>.005){viewX=p.x;viewZ=p.z;fill();}};
 // What each lamp shows: lit while it is switched on and powered; a lamp on a photocell (`dusk`) only once it is dark
 // outside (the daylight under half), switched in one step, never faded or flickered.
 const DUSK=.5;
 const shine=()=>{for(const l of ALL_LOADS){const live=running.has(l.id)&&isPowered(l.id)&&(!l.dusk||day<DUSK);
  for(const name of l.meshes||[])for(const e of glow.get(name)||[])e.material.emissiveIntensity=live?e.on:0;
  for(const name of l.lights||[]){const e=lightByName.get(name);if(e)e.light.intensity=live?e.on:0;}
  pools.get(l.id)?.update(live?1:0);}
  floors();};
 // A lamp's light on its own floor shows against the dark; by day the daylight through the windows drowns most of it.
 const floorLoads=ALL_LOADS.filter(l=>l.light?.floor);
 const floors=()=>{for(const l of floorLoads)pools.get(l.id+' floor')?.update(running.has(l.id)&&isPowered(l.id)?1-.6*day:0);};
 const LEVER={on:.6,off:Math.PI-.6};
 const resetAnchors=new Map();
 function apply(){
  for(const [id,pivot] of levers)pivot.rotation.x=on.get(id)?LEVER.on:LEVER.off;
  hinge.rotation.y=doorAngle*Math.PI/180;
  plugPot(running.has('kettle'));
  for(const l of ALL_LOADS){const live=running.has(l.id)&&isPowered(l.id);
   for(const name of l.screens||[]){const s=screens.get(name);if(s)s.visible=live;}
   for(const name of l.hides||[]){const o=hidden.get(name);if(o)o.visible=live;}
  }
  shine();
  for(const [id,o] of resetAnchors)o.visible=!on.get(id)&&(id!==U.circuit.id||upgraded);
  // The upgrade's parts and the 60 A supply breaker; the lock-out, while it is on.
  for(const o of upgradeShows)o.visible=upgraded;
  if(contractLooks){contractLooks.label.visible=!upgraded;contractLooks.label60.visible=upgraded;contractLooks.cream.color.setHex(upgraded?contractLooks.fresh:contractLooks.old);}
  lock.visible=locked;
  drawLed(timerReads(chairLeft),isPowered(CHAIR));
  fill();
 }

 // ---- Interactions.
 const lower=s=>s.charAt(0).toLowerCase()+s.slice(1);
 const circuitDef=id=>id===U.circuit.id?U.circuit:ONSEN_CIRCUITS.find(c=>c.id===id);
 const nameOf=id=>id==='main'?'main breaker':id==='elcb'?'earth-leakage breaker':id==='contract'?'supply breaker':lower(circuitDef(id).en);
 const front=toWorld(0,0,B.d+.25);
 anchor([front.x,front.y,front.z],'Look at the breaker board',()=>{
  const down=ALL_SWITCHES.filter(id=>!on.get(id)).map(id=>'the '+nameOf(id));
  const list=ONSEN_CIRCUITS.map(c=>`${c.no}, ${lower(c.en)}`).join('; '),K=contractNow(),R=ONSEN_UPGRADED_CIRCUITS.find(c=>c.id===U.relabel.id);
  action('inspect','Breaker board · Distribution board',
   'Grandmother Higa’s breaker board, grey steel, on the wall behind the bandai at Higa-san’s back. Its door is shut, with a printed card on it: 関係者以外さわらないでください, staff only. She can open it and reach every lever from her stool without getting up, and nobody else can reach it at all. Inside, lever up is on. '+
   `At the top, the ${B.main.amps} A main breaker, which protects the cable from the pole, and the earth-leakage breaker, which switches everything off in a blink if ${B.elcb.milliamps} thousandths of an amp leak away to earth, through wet tiles or through a person. In a building full of water it is the most important switch here. `+
   `Below, eight ${ONSEN_CIRCUITS[0].amps} A breakers, one for each circuit: ${list}. The last two are whiter than the rest, in the ways that were spare, and labelled by hand on masking tape: each mirror has a circuit of its own. `+
   (upgraded?`Circuit 1 has new tape over its old: ${R.tape.jp}, the chair alone. Under the board hangs a small grey box with a ninth breaker, the newest and whitest, taped ${U.circuit.no} ${U.circuit.tape.jp}: the left mirror’s dryer, moved off the chair’s circuit onto one of its own. `:'')+
   `Beside the board, a hand lower, a small cream box: the supply breaker, ${K.label.jp} ${K.label.amps}. Everything in the house goes through it, and the bath is contracted at ${K.amps} A, ${K.amps*ONSEN_VOLTS} watts. `+
   (upgraded?`Splitting the circuits did not change what the house draws: everything at once is still ${Math.round(houseAmps()*100)/100} A, a hair over the ${K.amps} A on its face. It holds, with nothing to spare. `
    :'Three dryers and the pot boiling at once are more than that; it warms for a few minutes and lets go, and the whole house goes dark. ')+
   (locked?`The main is locked off: a red clamp on its lever, a padlock through it and a red-and-white tag, ${ONSEN_LOCKOUT.tag.head} ${ONSEN_LOCKOUT.tag.jp}, with ${ONSEN_LOCKOUT.by}’s name on it. Nobody puts it up but the one whose lock it is. `:'')+
   `A breaker protects the cable, not the hair dryer. The cable in the wall is good for ${ONSEN_CIRCUITS[0].amps} A, so the breaker opens at ${ONSEN_CIRCUITS[0].amps} A. Fit a bigger one and the cable becomes the fuse, warming up inside the wall where nobody can see it. So when the sockets trip you never fit a bigger breaker: you spread the load out. And when the whole house goes dark, switch the big things off before the supply breaker goes back up.`+
   (down.length?` Right now ${down.join(' and ')} ${down.length>1?'are':'is'} down.`:''));
 });
 for(const id of BOARD_SWITCHES){
  let p;if(id===U.circuit.id){addon.updateMatrix();p=new THREE.Vector3(U.box.breakerX,0,U.box.d+.05).applyMatrix4(addon.matrix);}else{const L=LAYOUT[id];p=toWorld(L.x,L.y,face+.05);}
  const name=nameOf(id);
  const o=anchor([p.x,p.y,p.z],'Reset the '+name,()=>{
   if(locked&&id===ONSEN_LOCKOUT.breaker){action('inspect','Main breaker · Locked off',`Locked off: a red clamp over the lever, ${ONSEN_LOCKOUT.by}’s padlock through it and his tag, ${ONSEN_LOCKOUT.tag.head} ${ONSEN_LOCKOUT.tag.jp}. Someone is working on the wiring. Only the one whose lock it is takes it off.`);return;}
   if(!reset(id))return;
   const c=byId(id),again=c&&overloaded(id,runningOn(id));
   // The keeper's board: you ask, and Miss Higa does it from her stool.
   action('inspect','Breaker · Reset',c
    ?`Higa-san turns on her stool without looking up from her account book, opens the board with one finger, pushes the ${name} lever all the way down until it clicks, then up to on, and shuts the door. `+(again?`What is switched on on it draws ${wattsOf(id,runningOn(id))} watts: ${loadOf(id,runningOn(id))} amps on a ${c.amps} amp breaker. Switch something off, or it will go again.`:'The power comes back.')
    :`Higa-san reaches round, pushes the ${name} lever down until it clicks, then up to on, and shuts the door. The whole board comes back.`);
  });
  o.visible=!on.get(id)&&(id!==U.circuit.id||upgraded);resetAnchors.set(id,o);
 }
 // The supply breaker: the reset that holds (ONSEN_RESET): the dryers, the chair and the pot off first, then the lever up.
 {const p=new THREE.Vector3(C.wallX+C.d+.05,C.y-.04,C.z);
  const o=anchor([p.x,p.y,p.z],'Reset the supply breaker',()=>{
   if(on.get('contract'))return;const big=runningLoads().filter(id=>LOAD_BY_ID.get(id).atRest==='off').length;const a=higaReset();
   action('inspect','Supply breaker · Reset',(big?'“Switch off what’s in your hand,” Higa-san calls into the dark: the dryers click off, the chair, and she pulls her pot’s plug. Then, without looking up from her account book, she reaches':'Higa-san reaches')+
    ' back over her left shoulder, pushes the supply breaker’s lever all the way down until it clicks, then up. '+
    (a.contract.over?`Everything still switched on draws ${Math.round(a.contract.amps*10)/10} amps on the bath’s ${contractNow().amps}: switch something off, or it will go again.`:'The whole house comes back, and stays.'));});
  o.visible=!on.get('contract');resetAnchors.set('contract',o);}
 anchor([vanity.mirrors[1]+.12,1.05,-.8],'Use a hair dryer',()=>action('inspect','Hair dryer · 1200 W',isPowered('dryer-2')
  ?'Warm air and a noise like a small aeroplane. 1200 W, 100 V: twelve amps, on a 20 A circuit of its own, number 7 on the tape. Whatever the other mirrors do, this one holds; '+(upgraded?`and the whole bath is on a ${contractNow().amps} A contract now, but with everything at once it is still ${Math.round(houseAmps()*100)/100} A, right at its limit.`:'but three dryers and Higa-san’s pot at once are more than the whole bath’s '+contractNow().amps+' A contract.')
  :!isLive('main')?'Nothing, and nothing anywhere: the whole house is dark. Ask Higa-san.'
  :`Nothing. The socket under the mirror is dead: the ${nameOf(circuitOf('dryer-2'))} breaker has tripped. The board is behind the bandai: ask Higa-san.`));

 listeners.add(apply);apply();
 // ---- What the running loads show, frame by frame. Dryers spin up and down over a
 // fraction of a second (so the air fades rather than vanishing); the chair's rollers
 // move only while it has power and stop where they are. Phases come from a hash of the
 // load, never a dice roll, so the same moment always looks the same.
 let clock=0,chairMoving=false;
 const animate=dt=>{
  clock+=dt;
  for(const D of dryers){const target=isWorking(D.id)?1:0,rate=target>D.spin?1/.35:1/.8;
   D.spin=target>D.spin?Math.min(target,D.spin+dt*rate):Math.max(target,D.spin-dt*rate);
   if(!D.held)D.group.rotation.y=D.spin*.008*Math.sin(clock*2*Math.PI*D.hz+D.phase);// on the counter it hums; in a hand the hand holds it
   D.air.visible=D.spin>.01;
   if(D.air.visible)for(const st of D.streaks){const u=(clock*1.8+st.userData.k/3+D.phase)%1;st.position.x=.02+u*.11;st.material.opacity=.7*D.spin*Math.sin(Math.PI*u);}
  }
  chairMoving=isWorking(chair.id)&&dt>0;if(chairMoving){chair.time+=dt;placeRollers();}
  // The coin timer: a power cut forgets the coin; with power it counts down while the chair runs, and stops it at 0:00.
  if(running.has(CHAIR)){
   if(!isPowered(CHAIR)){if(chairLeft>0)chairLeft=0;}
   else if(!timerPinned&&!held&&dt>0){chairLeft=Math.max(0,chairLeft-dt);if(chairLeft<=0)switchOff(CHAIR);}}
  drawLed(timerReads(chairLeft),isPowered(CHAIR));
 };
 const appearance=loadId=>{const l=LOAD_BY_ID.get(knownLoad(loadId)),sh=l.shows||{},out={id:loadId,working:isWorking(loadId)};
  if(sh.lamp){const m=room.getObjectByName(sh.lamp);out.lamp=!!m&&m.material.emissiveIntensity>0;}
  if(sh.air){const a=room.getObjectByName(sh.air);out.air=!!a&&a.visible;}
  if(sh.motion)out.moving=chairMoving;
  if(sh.plug)out.plugged=potPlugged;
  return out;};
 const api={trip,reset,isLive,isOn,loadOf,wattsOf,overloaded,houseAmps,resetAll,higaReset,circuits:ONSEN_CIRCUITS,board:ONSEN_BOARD,contract:ONSEN_CONTRACT,resetOrder:ONSEN_RESET,
  switchOn,switchOff,isRunning,isWorking,runningLoads,assess,advance,settle,stage:stageScenario,scenarios:ONSEN_SCENARIOS,chairTimer,holdDryer,
  circuitOf,rewiring:ONSEN_REWIRING,raceway:ONSEN_RACEWAY,appearance,boardDoor,
  /** The ending's states (ONSEN_UPGRADE, ONSEN_LOCKOUT): the upgrade in or out, the main locked off or not, and the board as it is wired now. */
  boardUpgrade,lockOut,circuitsNow,contractNow,upgrade:ONSEN_UPGRADE,lockout:ONSEN_LOCKOUT,
  tv:{pin:pinLobbyChannel,get pinned(){return lobbyChannelPin();},channels:LOBBY_CHANNELS},
  /** The share of the town's indoor fill that reaches the house now (1 with its lamps on; the daylight's share when they are dead). */
  townFill:()=>townFill};
 const audit=typeof window!=='undefined'?window.__JOHANSSON_AUDIT__:null;
 if(audit)audit.onsenPower=api;
 /** Daylight (0 night, 1 noon) from onsen.js's tick: by day the windows light a dark house. `dt` warms an overloaded breaker and moves what is running. */
 const tick=(d,dt=0)=>{advance(dt);animate(dt);if(d!==day){const dusk=(day<DUSK)!==(d<DUSK);day=d;if(dusk)shine();else floors();fill();}};
 /** What the room shows of its state without time passing (a frozen photograph): the timer's readout. */
 const refresh=()=>drawLed(timerReads(chairLeft),isPowered(CHAIR));
 return {...api,group,levers,tick,refresh,dispose(){listeners.delete(apply);if(audit&&audit.onsenPower===api)delete audit.onsenPower;}};
}
