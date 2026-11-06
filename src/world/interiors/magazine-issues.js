/**
 * Which issue of each magazine is on the rack at Sakura on a given town date.
 *
 * Weeklies change on their own on-sale weekday, monthlies on the 1st (and, as Japanese
 * monthlies do, carry next month's date on the cover), the papers every morning. The
 * issue is worked out from the date alone, so every visit on the same day shows the
 * same covers and the rack turns over by itself as the calendar moves on.
 *
 * Plain data and arithmetic: no DOM, no three.js. Drawing is in magazine-art.js.
 */

/** The titles, original to the town. `onSale` is the weekday a weekly changes (0 = Sunday). */
export const MAGAZINE_TITLES=Object.freeze([
 {id:'hayabusa',name:"Weekly Shonen Hayabusa",en:'Weekly Shōnen Hayabusa',kind:'shonen',cadence:'weekly',onSale:1,price:200,thick:.024,
  heads:["Fuunji To the final battle!","New series South Sea Swordsman","Fuunji Time of Awakening","One-shot Island youth baseball"],
  subs:["First page color40P!!","Center color2Book stand","All pres Telephone card application ticket","Popularity vote Interim presentation"]},
 {id:'playwave',name:'PLAY★WAVE',en:'Play★Wave games weekly',kind:'games',cadence:'weekly',onSale:5,price:380,thick:.01,
  heads:["32Bit machine Summit Battle!!","RPGNew work Release date decided","Encyclopedia of hidden commands","New arrivals for autumn 30items Played"],
  subs:["Bag binding Trick map","Reader submission High score","Developer interview","New calendar"]},
 {id:'shimaaruki',name:"Walking around the island",en:'Shima Aruki — Okinawa guide',kind:'guide',cadence:'monthly',price:350,thick:.012,
  heads:["Kokusai Street Thorough guide","Autumn remote island tour","Yanbaru Forest Walk","Naha Gourmet Winter"],
  subs:["Old Bon EisaMAP","With boat timetable","Souvenirs100Selection","Route bus Riding"]},
 {id:'galisland',name:'GAL ISLAND',en:'Gal Island fashion',kind:'fashion',cadence:'monthly',price:420,thick:.008,
  heads:["Loose socks declaration!!","Platform sandals100Barrage","Purikura notebook Public!","Autumn brown hair catalog"],
  subs:["Large collection of reader models","Pager code Latest version","Sunscreen Summer camp","Mix and match30Day"]},
 {id:'kakuto',name:"Weekly Fight",en:'Weekly Kakutō Fight',kind:'sport',cadence:'weekly',onSale:3,price:360,thick:.008,
  heads:["Okinawa Tournament Fierce battle!","Fall of the Champion Shocking night","Tag Team Championship New era","The true identity behind the mask Finally"],
  subs:["Unlimited time One match","Tour schedule Complete version","Young people 7Human challenge","Color photo 32P"]},
 {id:'celanime',name:"Monthly Cell Anime",en:'Monthly Cel Anime',kind:'anime',cadence:'monthly',price:580,thick:.012,
  heads:["Giant robot Special feature","New autumn program Total roll","Cell drawing site Infiltration","Voice work Special feature"],
  subs:["Appendix: B2Double-sided poster","Setting materials First public release","Director interview","Reader illustration"]},
 {id:'tvshima',name:"Weekly TV Shima",en:'Weekly TV Shima',kind:'tv',cadence:'weekly',onSale:2,price:150,thick:.006,
  heads:["New autumn drama Total roll","Month9 Just before the final episode!","Professional baseball Broadcast list","Special number Advance guide"],
  subs:["Program list 7days","Horoscope 12Constellation","Crossword","Viewer gift"]},
 {id:'umikaze',name:"Monthly Sea breeze",en:'Monthly Umikaze',kind:'umikaze',cadence:'monthly',price:450,thick:.008,
  heads:["Summer at the port, lighthouse tour","Typhoon Night Port","Autumn fishing port food","Winter ferry"],
  subs:["Cruise Essay","Letter with the fragrance of the tide","Port town sketch","Reader's photo gallery"]},
 {id:'hoshizora',name:"Weekly Starry sky",en:'Weekly Hoshizora',kind:'hoshizora',cadence:'weekly',onSale:4,price:280,thick:.008,
  heads:["Autumn constellations With quick reference table","The other side of the moon Special feature","Night of shooting stars","Milky Way Introduction to photography"],
  subs:["This week's horoscope","Telescope How to choose","Space News","Reader's starry sky photo"]},
 {id:'katsuo',name:"Fishing and the sea",en:'Tsuri to Umi — angling',kind:'katsuo',cadence:'monthly',price:450,thick:.01,
  heads:["Bonito pole and line fishing Accompanying note","Rock fishing First step","Autumn bigfin squid","Aiming for winter Taman"],
  subs:["With tide chart","Mechanism illustration","Fishing spotMAP","Proud of your fishing results"]},
 {id:'minato',name:"Minato Shimbun",en:'Minato Shimbun (evening)',kind:'paper',cadence:'daily',price:80,paper:true,colour:'#8d3f31',edition:"Evening edition",
  heads:["Typhoon Prospects for Kitakami","New ship in port Arrival","Shopping Street Autumn festival preparations","Increased ferry service Decided","Breakwater To repair work","Fisheries cooperative First auction boom","New bus route Trial run"],
  subs:["Weekend Will it affect shipping?","Made by an island carpenter","Lantern 200pieces","From the end of the month 1Day4Flight","Completed by next spring","Bonito High prices continue","From the port to the airport"]},
 {id:'shimaspo',name:"Island Sports",en:'Shima Sports',kind:'paper',cadence:'daily',price:110,paper:true,colour:'#1b5fb4',edition:"Sports",
  heads:["Okinawa Fisheries Dramatic victory!","Autumn Tournament 4Strong lineup","Karate To the world championship","New champion Birth!","Marathon New tournament record","Harbour Boat Race The winner is Minato group"],
  subs:["Extension12times Goodbye","Semi-finals are on Sunday","Prefectural force 3Person representative","Judgment 2-1Fierce battle","2Time14min","last100meters"]},
 {id:'nippo',name:"Okinawa Nippo",en:'Okinawa Nippō (morning)',kind:'paper',cadence:'daily',price:100,paper:true,colour:'#2b2b2b',edition:"Morning edition",
  heads:["Old Obon Homecoming rush","Sugarcane To the harvest season","Naha Airport New terminal plan","Remote island route Fares review","Prepare for typhoon Inspection continues","Prefectural mango Shipping begins"],
  subs:["Naha Airport Congestion peak","Sugar factory Operation","2000Plan for the era","Resident briefing session Next week","Telephone pole/signboard General inspection","Best prospect ever"]},
]);
export const MANGA_CHAPTERS=4,MANGA_PAGES=4,ANIME_POSTERS=4;

const DAY=86400000;
const dayNumber=date=>Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/DAY);
const WEEKDAYS=Object.freeze(['Sun','Mon','Tue','Wed','Thu','Fri','Sat']);
const fmt=date=>date.toLocaleDateString('en-GB',{day:'numeric',month:'short'});

/** The issue of `title` on sale on `date`: its number, cover date, headline and so on. */
export function issueFor(title,date){
 const year=date.getFullYear(),heisei=year-1988;
 if(title.cadence==='daily'){
  // Shifted one each time round, so the same weekday a week later has different news.
  const n=dayNumber(date),len=title.heads.length,i=(((n+Math.floor(n/len))%len)+len)%len;
  return {key:title.id+':'+n,number:n-dayNumber(new Date(year,0,1))+1,
   dateLine:`${fmt(date)} ${year} (${WEEKDAYS[date.getDay()]})`,head:title.heads[i],sub:title.subs[i],variant:i,saleDate:date};
 }
 if(title.cadence==='monthly'){
  // Monthlies are dated a month ahead: what goes on sale in September says 10月号.
  const cover=new Date(year,date.getMonth()+1,1),m=year*12+date.getMonth(),i=m%title.heads.length;
  return {key:title.id+':'+m,number:cover.getMonth()+1,dateLine:cover.toLocaleDateString('en-GB',{month:'long',year:'numeric'}),head:title.heads[i],sub:title.subs[i],variant:i,
   saleDate:new Date(year,date.getMonth(),1)};
 }
 // A weekly: the issue that went on sale on the most recent on-sale weekday.
 const back=(date.getDay()-title.onSale+7)%7,sale=new Date(year,date.getMonth(),date.getDate()-back);
 const week=Math.floor((dayNumber(sale)+4)/7),i=((week%title.heads.length)+title.heads.length)%title.heads.length;
 const first=new Date(sale.getFullYear(),0,1),number=Math.floor((dayNumber(sale)-dayNumber(first))/7)+1;
 return {key:title.id+':'+week,number,dateLine:`${sale.getFullYear()} · Issue ${number}`,head:title.heads[i],sub:title.subs[i],variant:i,saleDate:sale,
  until:fmt(new Date(sale.getFullYear(),sale.getMonth(),sale.getDate()+6)),chapter:i%MANGA_CHAPTERS};
}

/** Every title's current issue, plus one key that changes whenever any cover would. */
export function rackIssues(date){
 const issues=MAGAZINE_TITLES.map(title=>({title,issue:issueFor(title,date)}));
 return {issues,key:issues.map(({issue})=>issue.key).join('|')};
}
export {fmt as shortDate,WEEKDAYS};
