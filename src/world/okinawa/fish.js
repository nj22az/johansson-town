/**
 * The fish of Minato Machi: what the boats land, what the pier gives, what the fishmonger lays on ice and the
 * izakaya cooks. One list, so the auction board, the old Yonamine counter, the menus, the anglers' talk and the storyteller
 * all say the same fish the same way (the creator, 2026-10-12: "Yes start with the fish").
 *
 * Every name but maguro's is the one Okinawans use, checked against the Okinawa dictionary project's fish list (o-dic `sakana.dic`,
 * public domain, bundled with github.com/okinawarb/faker-okinawa), with the standard Japanese name it gives. Nothing
 * here is picked at random: each fish says where it lives, how it is caught, how it is eaten, and who in the town
 * deals in it, and the game uses it there.
 *
 *   id        the word the code uses
 *   name      as a resident says it in English text (Okinawan, long vowels marked)
 *   kana      the Okinawan name in katakana
 *   standard  the standard Japanese name (標準和名), in katakana
 *   english   an English name a reader knows
 *   lives     reef, inshore (the harbour and the pier), offshore (open sea), deep (a deep-drop line)
 *   caught    how
 *   eaten     how it reaches a plate here
 *   by        who in the town lands it, sells it or cooks it
 *   colour    its colour on ice (for the 3D fish on the old Yonamine counter and the auction floor)
 *   bites     (pier fish) how often it takes a bait by daylight, at dawn and dusk, and at night, as weights: what the
 *             anglers know (taman and tachinuiyu feed after dark, mijun shoal by day, gāra hunt at the change of light)
 *   pierPrice (pier fish) what the harbour master pays for one, in yen: a taman is the prize, a mijun is bait
 */
export const FISH=Object.freeze([
 {id:'gurukun',name:'gurukun',kana:'グルクン',standard:'タカサゴ',english:'double-lined fusilier',lives:'reef',
  caught:'a drive-in net worked by divers over the reef (agiyā)',eaten:'fried whole, bones and all (karaage)',
  by:['auction','yonamine','izakaya'],colour:0xd86a72,note:'Blue in the sea, red on ice: it changes colour when landed. Okinawa\'s own fish.'},
 {id:'irabucha',name:'irabuchā',kana:'イラブチャー',standard:'ナンヨウブダイ',english:'blue parrotfish',lives:'reef',
  caught:'by spear and net on the reef',eaten:'sashimi (blue skin, white flesh)',by:['auction','yonamine'],colour:0x3f9aa6,
  note:'Irabuchā is the Okinawan name for the reef\'s blue parrotfish (ナンヨウブダイ and its kin), not the mainland アオブダイ, which is not eaten raw.'},
 {id:'mibai',name:'mībai',kana:'ミーバイ',standard:'ハタ',english:'grouper',lives:'reef',
  caught:'hand line and spear; small ones from the pier',eaten:'mībai-jiru (clear soup), or simmered in salt water (māsu-ni)',
  by:['auction','yonamine','pier'],colour:0x9a6a4e,bites:{day:2,twilight:2,night:2},pierPrice:220},
 {id:'akajin',name:'akajin',kana:'アカジンミーバイ',standard:'スジアラ',english:'leopard coral grouper',lives:'reef',
  caught:'hand line over deep reef',eaten:'sashimi and soup: a festive fish',by:['auction'],colour:0xc8463c,
  note:'One of the three prized fish of Okinawa, with akamachi and makubu.'},
 {id:'akamachi',name:'akamachi',kana:'アカマチ',standard:'ハマダイ',english:'ruby snapper',lives:'deep',
  caught:'a deep-drop line, two hundred metres and more',eaten:'sashimi',by:['auction'],colour:0xd0423a,
  note:'One of the three prized fish of Okinawa.'},
 {id:'makubu',name:'makubu',kana:'マクブ',standard:'シロクラベラ',english:'blackspot tuskfish',lives:'reef',
  caught:'hand line and spear',eaten:'sashimi, and soup from the bones',by:['auction'],colour:0x8fa0a8,
  note:'One of the three prized fish of Okinawa.'},
 {id:'shichumachi',name:'shichūmachi',kana:'シチューマチ',standard:'アオダイ',english:'blue-grey snapper',lives:'deep',
  caught:'a deep-drop line',eaten:'sashimi, or fried',by:['auction','yonamine'],colour:0x7e9cb8},
 {id:'taman',name:'taman',kana:'タマン',standard:'ハマフエフキ',english:'spangled emperor',lives:'inshore',
  caught:'rod and line from the pier and the breakwater, best at night',eaten:'sashimi, or pan-fried in butter',
  by:['pier','yonamine','izakaya'],colour:0xa8a28e,bites:{day:1,twilight:3,night:4},pierPrice:320,note:'The fish the pier anglers wait all night for.'},
 {id:'kuchinaji',name:'kuchinaji',kana:'クチナジ',standard:'イソフエフキ',english:'yellowtail emperor',lives:'inshore',
  caught:'rod and line from the pier',eaten:'simmered, or fried',by:['pier'],colour:0xa89a80,bites:{day:3,twilight:2,night:2},pierPrice:160},
 {id:'egwa',name:'ēgwā',kana:'エーグヮー',standard:'ブチアイゴ',english:'rabbitfish',lives:'inshore',
  caught:'rod and line, and nets along the shore',eaten:'simmered in salt water (māsu-ni)',by:['pier','yonamine'],colour:0x8c8a60,bites:{day:3,twilight:2,night:1},pierPrice:160,
  note:'Mind the spines: they sting.'},
 {id:'suku',name:'suku',kana:'スク',standard:'アミアイゴ (稚魚)',english:'rabbitfish fry',lives:'inshore',
  caught:'scooped in nets when the shoals come to the reef in early summer',eaten:'salted in jars (sukugarasu), laid on cold tofu',
  by:['yonamine','izakaya'],colour:0xb8b8a0,note:'A few days a year: the whole shore turns out with nets.'},
 {id:'abasa',name:'abasā',kana:'アバサー',standard:'ハリセンボン',english:'porcupinefish',lives:'reef',
  caught:'by spear and net',eaten:'abasā-jiru, a miso soup',by:['yonamine'],colour:0xb0a070},
 {id:'gara',name:'gāra',kana:'ガーラ',standard:'ギンガメアジ',english:'trevally',lives:'inshore',
  caught:'rod and line, live bait from the breakwater; it fights hard',eaten:'sashimi when small, simmered when large',
  by:['pier','yonamine'],colour:0xb4bcc4,bites:{day:1,twilight:3,night:1},pierPrice:200},
 {id:'mijun',name:'mijun',kana:'ミジュン',standard:'ヤマトミズン',english:'sardine',lives:'inshore',
  caught:'small hooks on a string (sabiki) from the pier; nets at sea',eaten:'fried, and as bait',by:['pier','yonamine'],colour:0x98aab8,bites:{day:4,twilight:3,night:1},pierPrice:60},
 {id:'tachinuiyu',name:'tachinuiyu',kana:'タチヌイユ',standard:'タチウオ',english:'cutlassfish',lives:'inshore',
  caught:'rod and line at night',eaten:'grilled with salt',by:['pier','yonamine'],colour:0xd8dee4,bites:{day:0,twilight:2,night:3},pierPrice:180},
 {id:'kachu',name:'kachū',kana:'カチュー',standard:'カツオ',english:'skipjack tuna',lives:'offshore',
  caught:'pole and line from bonito boats',eaten:'sashimi, and dried into katsuobushi',by:['auction','yonamine'],colour:0x55657a},
 {id:'maguro',name:'maguro',kana:'マグロ',standard:'メバチ・キハダ',english:'bigeye and yellowfin tuna',lives:'offshore',
  caught:'long lines from the deep-sea boats',eaten:'sashimi',by:['auction'],colour:0x3c4a5e,
  note:'The one fish here under its standard name: the auction board writes maguro, though the old men still say shibi for yellowfin.'},
 {id:'seika',name:'sēika',kana:'セーイカ',standard:'ソデイカ',english:'diamond squid',lives:'offshore',
  caught:'drifting lines under flags in winter',eaten:'sashimi',by:['auction','yonamine'],colour:0xd8a8a0,
  note:'A squid as big as a cat.'},
]);

export const fishById=id=>FISH.find(f=>f.id===id)||null;
/** The fish a place deals in: 'auction' (the harbour auction), 'yonamine' (Yonamine Fresh Fish, closed now:
 * cast.js PLACES; its counter still shows the fish it sold), 'pier', 'izakaya'. */
export const fishAt=where=>FISH.filter(f=>f.by.includes(where));
/** "a gurukun", "an irabuchā". */
export const aFish=f=>(/^[aeiouāēīōū]/i.test(f.name)?'an ':'a ')+f.name;

/** A caught fish as it is carried in the bag: "Taman", "Ēgwā". */
export const fishItem=f=>f.name[0].toUpperCase()+f.name.slice(1);
/** The pier fish a bag item is, or null. */
const PIER_BY_ITEM=new Map(fishAt('pier').map(f=>[fishItem(f),f]));   // asked every frame (schedules.js): built once
export const pierFishOfItem=item=>PIER_BY_ITEM.get(item)||null;
/**
 * The pier's catch in old saves, before the town had its fish list: "Mackerel", then "Sea bream". Both become a taman,
 * the pier's prize, which Okinawans call the island's tai (sea bream), so nothing a player kept is lost or cheapened.
 */
export const LEGACY_CATCH=Object.freeze({'Sea bream':'Taman','Mackerel':'Taman'});

/** The light at a minute of the day: dawn and dusk (5-7 and 17-19 o'clock) are the change of light. */
export function lightAt(minutes){
 const h=((minutes%1440)+1440)%1440/60;
 return h<5||h>=19?'night':h<7||h>=17?'twilight':'day';
}
/** What takes the bait at a minute of the day, for a roll in [0,1): the pier fish weighted by what bites in that light. */
export function pierCatch(minutes,roll){
 const light=lightAt(minutes),fish=fishAt('pier').filter(f=>f.bites[light]>0);
 const total=fish.reduce((t,f)=>t+f.bites[light],0);let at=Math.min(.999999,Math.max(0,roll))*total;
 for(const f of fish){at-=f.bites[light];if(at<0)return f;}
 return fish.at(-1);
}
