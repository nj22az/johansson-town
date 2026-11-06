/**
 * The two editions of Johansson World, decided in one place (the owner, 19 October 2026: "the web is a gorgeous demo
 * for the Linux game"; AGENTS.md).
 *
 * Linux (steam-deck/, the Electron shell, which sets `window.johanssonDesktop` before the game loads) runs the whole
 * town: every resident's day walked on the navigation grid, their chats and the day's happenings, Sakura's trade and
 * stock, the ship's and the bath's machinery, the live ledgers.
 *
 * The web edition draws exactly what Linux draws (shadows, multisampling, HDR, detail streaming, the Ink grade: the
 * graphics ruling of 19 October stands) and simulates less: what is not seen, or barely seen, is not run. Its numbers
 * are the budgets below; nothing else in the game asks which edition it is.
 *
 * Outside a page (node's tests and tools, even with a stand-in window) there is no web page to be a demo of, so the
 * edition is Linux unless JOHANSSON_EDITION says otherwise: the suites keep exercising the full simulation, and tests/edition.test.mjs
 * checks the web budgets explicitly.
 */
export function editionOf({desktop=globalThis.window?.johanssonDesktop,page=typeof globalThis.window!=='undefined'&&typeof globalThis.document!=='undefined'&&!globalThis.process?.versions?.node,env=globalThis.process?.env?.JOHANSSON_EDITION}={}){
 if(env==='web'||env==='linux')return env;
 if(desktop)return 'linux';
 return page?'web':'linux';
}

export const BUDGETS=Object.freeze({
 linux:Object.freeze({
  edition:'linux',
  /** Residents walk their whole day on the navigation grid wherever they are (people/schedules.js). */
  residentsEverywhere:true,
  /** Residents meet and talk among themselves (people/neighbour-chats.js), and the day's happenings run. */
  neighbourChats:true,
  /** Talking to a resident is the full conversation: topics, favours, gifts, the day's happenings (activities.js). */
  conversations:true,
  /** Sakura's trade: stock counted per facing, orders, deliveries, the till and the day's settlement. */
  trade:true,
  /** The machinery runs: the ship's plant, switchboards, the bath's electrics, the workshop's jobs. */
  machinery:true,
  /** The wallet counts every yen. */
  countedMoney:true,
  /** Ledgers, order sheets and the till roll are the live shop's. */
  liveDocuments:true,
  /** Thao's pour as it is done: the bottle tipped over the glass with its stream, the tap's lever pulled
   *  (people/izakaya-bar.js). The web makes the same round, the glass filling as she holds the bottle over it. */
  pouring:true,
 }),
 web:Object.freeze({
  edition:'web',
  residentsEverywhere:false,
  /** Residents farther than this from the player (or the door of the room he is in) keep their timetable without
   *  walking it: no route searches, no steps, placed where their day has them. Nearer, they live as on Linux. */
  residentRadius:45,
  /** A seen resident whose detour search found no way round tries again after this many town minutes, not every 3 s. */
  detourRetryMinutes:.5,
  /** One nearby, turn-taking exchange at a time; distant residents still use the reduced timetable. */
  neighbourChats:true,
  /** One short line for the moment (people/greetings.js shortGreeting) and whatever they sell or serve. */
  conversations:false,
  trade:false,
  machinery:false,
  countedMoney:false,
  liveDocuments:false,
  pouring:false,
 }),
});

export const EDITION=editionOf();
export const BUDGET=BUDGETS[EDITION];
export const isLinuxEdition=()=>EDITION==='linux';

/** The web edition's purse (`countedMoney` off): the save's own ceiling, so every price is always within reach. */
export const WEB_PURSE=999999;
