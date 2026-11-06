/**
 * The storyteller's database. A story genre is a premise plus four beats in the 4-koma
 * shape (ki: set-up, shō: development, ten: twist, ketsu: pay-off). Every beat offers several
 * interchangeable options; the storyteller picks one per beat, so the same premise plays out
 * many ways. The variables a story binds once (`bind`) are shared by all four beats, which is
 * what keeps a random combination coherent even when it is not funny.
 *
 * Text grammar (src/feed/storyteller.js expands it):
 *  {A} {B}            the two residents (B may be absent in a solo genre)
 *  {A.job} {A.trait} {A.habit} {A.ambition}   facts from the resident catalogue
 *  {place} {place.short} {thing} {doing}      the real place, one of its objects, an activity there
 *  {food} {drink} {snack} {weather} {hour}    from the lists below
 *  {$name}            a story variable bound once from `bind`; a genre with belonging:true also
 *                     binds one of A's own things: {$lost}, {$tale}, {$keeps} (src/people/belongings.js)
 *  [one|two|three]    pick one inline
 * Beat: {say:'A'|'B'|null, line, a:[pose,expression], b:[pose,expression]}, optionally
 * tag (a name for this option), after (only follows an option with one of these tags) and kinds
 * (only at places of these kinds). {A.ajob} is the job with a or an. sfx and bg force a sound
 * effect or panel background (see manga-fx.js); otherwise the storyteller picks them from the
 * expressions and poses. shot picks the camera (wide, medium, close, eyes, low, high, dutch,
 * close-thing) and focus whose face a close shot is on; cast:'C' gives the panel to a third resident.
 * A genre with `places` only happens there (a fish story needs water). Poses and expressions are
 * the photo studio's (src/photo/layout.js). A pose list picks one.
 */
export const FOODS=Object.freeze(['yakitori','edamame','oden','shoyu ramen','tuna onigiri','tamago sando','custard pudding','gōya champurū','sāta andāgī','soki soba','fried gurukun','karaage']);
export const DRINKS=Object.freeze(['barley tea','a draft beer','canned coffee','awamori on the rocks','a bottle of milk','jasmine tea','a can of melon soda']);
export const SNACKS=Object.freeze(['pink guava ice cream','a bag of rice crackers','chocolate biscuits','a stick of dried squid','brown-sugar candy','a melon pan']);
export const WEATHER=Object.freeze(['the rain','the sea breeze','a typhoon warning','the afternoon heat','the evening clouds','the morning sun']);
export const HOURS=Object.freeze(['seven in the morning','half past eleven','three in the afternoon','closing time','last orders','a quarter to six']);

export const GENRES=Object.freeze([
 // Harbour stories (places: only where they can happen).
 {id:'catch',places:['harbour','pier'],title:['The one that got away','{A}’s fish','A fish story'],cast:2,
  // What the pier gives (src/world/okinawa/fish.js, fishAt('pier'); written out so the comics' chunk does not pull in
  // the world's: tests/okinawa-fish.test.mjs keeps the two the same). The mijun is the punchline, so not bragged about.
  bind:{fish:['mībai','taman','kuchinaji','ēgwā','gāra','tachinuiyu']},
  beats:[
   [{say:'A',line:'I caught {a $fish} last night. This big.',shot:'wide',a:['HandsOnHips','happy'],b:['Idle','neutral']},
    {say:null,line:'At {place.short}, {A} was describing {a $fish}.',shot:'wide',a:['Point','happy'],b:['Idle','neutral']}],
   [{say:'B',line:'That big?',tag:'doubt',a:['Tada','happy'],b:['Think','surprised']},
    {say:'B',line:'Last week it was smaller.',tag:'doubt',a:['HandsOnHips','content'],b:['Shrug','thinking']}],
   [{say:'A',line:'Bigger. The ferry had to wait for it to pass.',after:['doubt'],shot:'low',sfx:'SPLASH!',a:['Tada','laugh'],b:['Shrug','surprised']},
    {say:null,line:'By lunchtime the {$fish} was the size of the ferry.',shot:'wide',sfx:'SPLASH!',a:['Cheer','laugh'],b:['Think','grumpy']}],
   [{say:null,line:'{C} walked past with {a $fish} the size of a thumb.',cast:'C',shot:'medium',sfx:'…',a:['Peace','happy']},
    {say:'B',line:'I was there. It was a mijun. A sardine.',shot:'close',a:['Shrug','shy'],b:['HandsOnHips','content']},
    {say:null,line:'The fish has since grown to the size of the island.',shot:'high',a:['Laugh','laugh'],b:['Laugh','laugh']}],
  ]},
 {id:'ferry',places:['harbour','pier','ferry'],title:['The last ferry','{A} and the timetable','Running for the boat'],cast:2,
  beats:[
   [{say:null,line:'{hour}. The ferry leaves in one minute.',shot:'wide',a:['Idle','neutral'],b:['Idle','neutral']},
    {say:'A',line:'Is that the ferry horn?',shot:'medium',a:['Think','surprised'],b:['Idle','neutral']}],
   [{say:'B',line:'Run!',shot:'close',sfx:'BWOOOO',a:['Idle','surprised'],b:['Point','surprised']},
    {say:'A',line:'My bag! My ticket! My other bag!',shot:'dutch',sfx:'BWOOOO',a:['Shrug','worried'],b:['Point','surprised']}],
   [{say:null,line:'{A} ran the whole length of the quay.',shot:'low',sfx:'DASH DASH',a:['HeelKick','surprised'],b:['Cheer','happy']},
    {say:null,line:'Nobody had ever seen {A} move that fast.',shot:'high',sfx:'DASH DASH',a:['HeelKick','worried'],b:['Clap','laugh']}],
   [{say:'B',line:'That was the cargo boat. It does not take passengers.',shot:'medium',a:['Shrug','sad'],b:['Shrug','smile']},
    {say:null,line:'It was tomorrow’s timetable.',shot:'wide',sfx:'…',a:['Shrug','surprised'],b:['Laugh','laugh']},
    {say:'A',line:'I meant to do that. I like running.',shot:'close',a:['HandsOnHips','shy'],b:['Laugh','laugh']}],
  ]},
 // The Minato Maru keeps her timetable and does not wait (world/ferry-timetable.js; the owner, 21 October 2026): the last
 // boat home at a quarter past ten, the boat missed by a minute, and seeing somebody off from the quay. `lead` is who the
 // story is usually about: Thuan shuts Sakura and takes the 22:15 home to Kitano-jima.
 {id:'last-boat',lead:'Thuan',places:['pier','harbour','ferry'],title:['The last boat home','A quarter past ten','{A} and the 22:15'],cast:2,
  beats:[
   [{say:null,line:'Thirteen minutes past ten. The last boat home goes at a quarter past.',shot:'wide',a:['Idle','neutral'],b:['Idle','neutral']},
    {say:'A',line:'Two minutes. That is the horn.',shot:'medium',sfx:'BWOOOO',a:['Think','surprised'],b:['Idle','neutral']}],
   [{say:'B',line:'Go! She does not wait!',shot:'close',a:['Idle','surprised'],b:['Point','surprised']},
    {say:'A',line:'The till roll! The shutter! My other shoe!',shot:'dutch',sfx:'DASH DASH',a:['Shrug','worried'],b:['Point','surprised']}],
   [{say:null,line:'{A} reached the gangway as the deck hand went to stow it.',shot:'low',sfx:'DASH DASH',a:['HeelKick','surprised'],b:['Cheer','happy']},
    {say:null,line:'The gangway came in behind {A}, on the right side of it.',shot:'high',sfx:'CLANK',a:['HandsOnHips','happy'],b:['Clap','laugh']}],
   [{say:'A',line:'Same time tomorrow.',shot:'medium',a:['Wave','smile'],b:['Wave','smile']},
    {say:null,line:'From the rail, {A} waved at {B} on the quay until the breakwater.',shot:'wide',a:['Wave','happy'],b:['Wave','smile']},
    {say:null,line:'The shoe stayed on the quay. It took the first boat over in the morning.',shot:'close-thing',sfx:'…',a:['Shrug','surprised'],b:['Laugh','laugh']}],
  ]},
 {id:'missed-boat',places:['pier','harbour'],title:['Missed it','{A} and the gangway','The boat that did not wait'],cast:2,
  beats:[
   [{say:null,line:'{A} reached the pier as her gangway went in.',shot:'wide',sfx:'BWOOOO',a:['HeelKick','surprised'],b:['Idle','neutral']},
    {say:'A',line:'Wait! WAIT!',shot:'close',sfx:'BWOOOO',a:['Point','worried'],b:['Idle','neutral']}],
   [{say:'B',line:'She does not wait. Not for the chief engineer, not for the fish.',shot:'medium',a:['Shrug','sad'],b:['Shrug','smile']},
    {say:'B',line:'Next one is on the board.',shot:'medium',a:['Think','worried'],b:['Point','smile']}],
   [{say:null,line:'The Minato Maru got smaller and smaller.',shot:'wide',a:['Idle','sad'],b:['Idle','neutral']},
    {say:'A',line:'Five hours. What do people do for five hours?',shot:'close',a:['Think','worried'],b:['Idle','smile']}],
   [{say:null,line:'{A} spent five hours on the bench and made three friends and one enemy, a gull.',shot:'high',a:['Laugh','laugh'],b:['Laugh','laugh']},
    {say:'B',line:'At least you will be first on.',shot:'medium',a:['Shrug','content'],b:['Peace','happy']},
    {say:null,line:'This time {A} was on the pier an hour early.',shot:'wide',a:['HandsOnHips','content'],b:['Clap','laugh']}],
  ]},
 {id:'seeing-off',places:['pier','harbour','ferry'],title:['Waving from the quay','Seeing {A} off','Until the breakwater'],cast:2,
  beats:[
   [{say:null,line:'The horn. Two minutes before she sails. {B} came down to see {A} off.',shot:'wide',sfx:'BWOOOO',a:['Idle','smile'],b:['Idle','smile']}],
   [{say:'B',line:'Wave when you pass the breakwater!',shot:'medium',a:['Idle','happy'],b:['Wave','happy']},
    {say:'A',line:'I am only going for the afternoon.',shot:'medium',a:['Shrug','smile'],b:['Wave','happy']}],
   [{say:null,line:'{A} waved from the rail. {B} waved from the quay. A gull waved back, or nearly.',shot:'wide',a:['Wave','happy'],b:['Wave','happy']},
    {say:null,line:'{A} waved. So did a man on the pier {A} had never met.',shot:'high',a:['Wave','surprised'],b:['Wave','laugh']}],
   [{say:null,line:'{B} was still on the quay when she came back at half past two.',shot:'wide',sfx:'…',a:['Wave','surprised'],b:['Wave','happy']},
    {say:'A',line:'You waited?',shot:'close',a:['Think','surprised'],b:['Peace','shy']}],
  ]},
 {id:'showdown',title:['Showdown at {place.short}','The last {$prize}','High noon at {place.short}'],cast:2,
  bind:{prize:['{food}','{snack}','seat by the window','copy of the evening paper','umbrella']},
  beats:[
   [{say:null,line:'{place.short}. {hour}. One {$prize} left.',shot:'wide',a:['HandsOnHips','angry'],b:['HandsOnHips','angry']}],
   [{say:null,line:'{A}.',shot:'eyes',focus:'A',sfx:'…',a:['Idle','angry'],b:['Idle','angry']}],
   [{say:null,line:'{B}.',shot:'eyes',focus:'B',a:['Idle','angry'],b:['Idle','angry']}],
   [{say:null,line:'{C} took the last {$prize} without looking up.',cast:'C',shot:'medium',a:['Idle','content']},
    {say:'C',line:'Sorry. Were you two using this?',cast:'C',shot:'low',a:['Peace','happy']},
    {say:null,line:'A gull took the {$prize}. Nobody saw it coming.',shot:'wide',sfx:'SWOOP!',a:['Shrug','surprised'],b:['Shrug','surprised']}],
  ]},
 {id:'rule',title:['A new rule at {place.short}','{A} makes a rule','By order of {A}'],cast:2,
  bind:{rule:['{snack} before work','no whistling near {thing}','two bows for {thing}','{food} on Thursdays','one quiet hour a day'],
   because:['{thing} prefers it','it worked once in 1994','the tide tables say so','nobody objected in time','{weather} is coming']},
  beats:[
   [{say:'A',line:'From today there is a new rule at {place.short}: {$rule}.',a:['Point','happy'],b:['Idle','surprised']},
    {say:'A',line:'Attention! A new rule: {$rule}.',a:['HandsOnHips','content'],b:['Idle','neutral']}],
   [{say:'B',line:'Who decided that?',tag:'who',a:['HandsOnHips','content'],b:['Shrug','thinking']},
    {say:'B',line:'Is that an official rule, {A}?',tag:'official',a:['Point','content'],b:['Think','worried']}],
   [{say:'A',line:'I did. Because {$because}.',after:['who'],a:['Tada','happy'],b:['Think','thinking']},
    {say:'A',line:'Very official. Because {$because}.',after:['official'],a:['Bow','content'],b:['Shrug','surprised']},
    {say:null,line:'{A} explained, at length, that {$because}.',a:['Point','content'],b:['Think','sleep']}],
   [{say:'B',line:'…Then I suppose I had better follow it.',a:['Cheer','laugh'],b:['Bow','content']},
    {say:'B',line:'Fine. But I am adding a rule about your rules.',a:['Shrug','worried'],b:['Point','grumpy']},
    {say:null,line:'The rule lasted until {hour}.',a:['Laugh','laugh'],b:['Laugh','laugh']}],
  ]},
 {id:'employee',title:['Employee of the month','A promotion at {place.short}','The new hire'],cast:2,
  bind:{post:['assistant manager','head of security','employee of the month','chief taster','deputy mayor of {place.short}']},
  beats:[
   [{say:'A',line:'Congratulations to {thing}, our new {$post}.',a:['Clap','happy'],b:['Idle','surprised']},
    {say:null,line:'{A} has an announcement about {thing}.',a:['Point','happy'],b:['Idle','neutral']}],
   [{say:'B',line:'{thing}? It has not moved all year.',a:['Clap','happy'],b:['Point','surprised']},
    {say:'B',line:'Can {thing} even be {a $post}?',a:['HandsOnHips','content'],b:['Think','thinking']}],
   [{say:'A',line:'Exactly. Never late, never rude, never eats the stock.',a:['Tada','content'],b:['Think','thinking']},
    {say:'A',line:'It listens. Unlike certain people.',a:['HandsOnHips','grumpy'],b:['Shrug','worried']}],
   [{say:'B',line:'…I would like to apply for second place.',a:['Laugh','laugh'],b:['CheekRest','shy']},
    {say:null,line:'{thing} accepted the position without comment.',a:['Bow','content'],b:['Bow','content']},
    {say:'B',line:'Then I want a raise as well.',a:['Shrug','surprised'],b:['Point','grumpy']}],
  ]},
 {id:'forecast',title:['{A}’s weather service','Forecast: {$weather}','The {thing.bare} forecast'],cast:2,
  bind:{weather:['rain by {hour}','a typhoon, a small one','sunshine and gossip','fog with a chance of karaoke']},
  beats:[
   [{say:'A',line:'Look at {thing}. That means {$weather}.',a:['Point','thinking'],b:['Idle','neutral']},
    {say:'A',line:'{thing} is never wrong. {$weather}.',a:['Think','thinking'],b:['Idle','surprised']}],
   [{say:'B',line:'The radio says it will be clear all day.',a:['Think','thinking'],b:['Shrug','neutral']},
    {say:'B',line:'You cannot read the weather from {thing}.',a:['Point','content'],b:['HandsOnHips','grumpy']}],
   [{say:'A',line:'The radio has never once been right at {place.short}.',a:['HandsOnHips','content'],b:['Think','thinking']},
    {say:null,line:'Somewhere over the sea, {weather} was making up its mind.',a:['Think','thinking'],b:['Think','worried']}],
   [{say:'B',line:'…Can I borrow an umbrella, just in case?',a:['Tada','happy'],b:['Bow','shy']},
    {say:null,line:'It was {$weather}. Nobody mentioned it again.',a:['Cheer','laugh'],b:['Shrug','surprised']},
    {say:'A',line:'Wrong today. Right tomorrow. Probably.',a:['Shrug','smile'],b:['Laugh','laugh']}],
  ]},
 {id:'lost',title:['The case of the missing {$lost}','{A} loses something','Lost at {place.short}'],cast:2,
  // The thing lost is one of A's own (src/people/belongings.js): {$lost}, {$tale}, {$keeps}.
  belonging:true,
  bind:{found:['{thing}','a bowl of {food}','{B}’s pocket','the fridge, for some reason','the lost-property box, labelled “not mine”']},
  beats:[
   [{say:'A',line:'Has anybody seen my {$lost}?',a:['Think','worried'],b:['Idle','neutral']},
    {say:null,line:'{A} had lost the {$lost} while {doing}.',a:['Shrug','worried'],b:['Idle','neutral']}],
   [{say:'B',line:'When did you last have it?',a:['Think','worried'],b:['Think','thinking']},
    {say:'B',line:'Retrace your steps. Calmly.',a:['Shrug','sad'],b:['Point','content']},
    {say:null,line:'{$tale}',shot:'medium',focus:'A',a:['Think','sad'],b:['Think','thinking']}],
   [{say:'A',line:'I was {doing}, and then {weather} happened.',a:['Point','thinking'],b:['Think','thinking']},
    {say:null,line:'The search covered all of {place}.',a:['Crouch','worried'],b:['Crouch','thinking']}],
   [{say:'B',line:'Found it. In {$found}.',a:['Cheer','happy'],b:['Tada','content']},
    {say:'A',line:'Never mind. I will just buy {snack} instead.',a:['Shrug','content'],b:['Laugh','laugh']},
    {say:null,line:'It was in {$found}. It always is.',a:['Laugh','laugh'],b:['Shrug','smile']},
    {say:null,line:'It was {$keeps}, where it always is.',a:['Shrug','shy'],b:['Laugh','laugh']}],
  ]},
 {id:'contest',title:['The great {$contest}','{A} versus {B}','Rematch at {place.short}'],cast:2,
  bind:{contest:['staring contest','jan-ken-pon final','quiet contest','{food}-eating contest','longest-bow contest'],
   prize:['{snack}','the good stool','bragging rights until {hour}','a bottle in the keep']},
  beats:[
   [{say:'A',line:'I challenge you to {a $contest}. For {$prize}.',a:['Point','angry'],b:['Idle','surprised']},
    {say:null,line:'At {place}, {a $contest} was declared.',a:['HandsOnHips','angry'],b:['HandsOnHips','angry']}],
   [{say:'B',line:'Accepted. Prepare yourself.',a:['HandsOnHips','angry'],b:['HandsOnHips','angry']},
    {say:'B',line:'Again? Fine. Best of five.',a:['Point','content'],b:['Shrug','grumpy']}],
   [{say:null,line:'It went on far longer than anybody expected.',sfx:'STARE',bg:'focus',a:['Think','grumpy'],b:['Think','grumpy']},
    {say:'A',line:'You blinked! … Did you blink?',bg:'focus',a:['Point','surprised'],b:['Shrug','neutral']}],
   [{say:'B',line:'Let’s call it a draw and share {$prize}.',a:['Laugh','laugh'],b:['Laugh','laugh']},
    {say:null,line:'{thing} was declared the winner.',a:['Shrug','surprised'],b:['Shrug','surprised']},
    {say:'A',line:'Victory! Tomorrow, the rematch.',a:['Cheer','laugh'],b:['Bow','sad']}],
  ]},
 {id:'secret',title:['{A}’s big secret','Can you keep a secret?','Classified: {place.short}'],cast:2,
  bind:{secret:['I talk to {thing}','I have never once liked {food}','I practise bowing in the mirror','I count {thing} every night','I still do not know how {thing} works']},
  beats:[
   [{say:'A',line:'Can you keep a secret? A big one.',a:['Coy','shy'],b:['Idle','surprised']},
    {say:null,line:'{A} lowered their voice, halfway through {doing}.',a:['Coy','worried'],b:['Idle','thinking']}],
   [{say:'B',line:'Of course. Who would I even tell?',a:['Coy','shy'],b:['CheekRest','smile']},
    {say:'B',line:'My lips are sealed. Mostly.',a:['Think','worried'],b:['Peace','happy']}],
   [{say:'A',line:'…{$secret}.',a:['Coy','shy'],b:['Think','surprised']},
    {say:'A',line:'Here it is: {$secret}.',a:['Bow','worried'],b:['Idle','surprised']}],
   [{say:null,line:'By {hour}, all of {place.short} knew.',a:['Shrug','sad'],b:['Laugh','laugh']},
    {say:'B',line:'That’s it? Me too.',a:['Laugh','laugh'],b:['Shrug','smile']},
    {say:'B',line:'I will take it to my grave. Or to Minato.',a:['Shrug','worried'],b:['Wave','happy']}],
  ]},
 {id:'ceremony',title:['A ceremony for {thing}','Grand opening','{A} cuts the ribbon'],cast:2,
  bind:{occasion:['its first birthday','being cleaned for once','surviving {weather}','its retirement','a fresh coat of paint']},
  beats:[
   [{say:'A',line:'We are gathered here to honour {thing}, on {$occasion}.',a:['Bow','content'],b:['Idle','neutral']},
    {say:null,line:'{A} had organised a formal ceremony for {thing}.',a:['Clap','happy'],b:['Idle','surprised']}],
   [{say:'B',line:'Is this really necessary?',a:['Bow','content'],b:['Shrug','thinking']},
    {say:'B',line:'Should I have dressed up?',a:['Clap','happy'],b:['Think','worried']}],
   [{say:'A',line:'Silence, please. {thing} will now say a few words.',a:['Point','content'],b:['Idle','surprised']},
    {say:null,line:'There was a long, respectful pause.',sfx:'…',a:['Bow','content'],b:['Bow','content']}],
   [{say:'B',line:'…That was beautiful, actually.',a:['Cheer','happy'],b:['DoubleCheek','happy']},
    {say:null,line:'Refreshments were {food}.',a:['Wave','happy'],b:['Kachashi','laugh']},
    {say:'A',line:'Same time next year.',a:['Bow','smile'],b:['Clap','smile']}],
  ]},
 {id:'advice',title:['Ask {A}','{A}’s advice corner','Expert opinion'],cast:2,
  bind:{problem:['my tomatoes are sulking','I cannot stop buying {snack}','my radio only plays enka','I keep waving at the wrong person','I am always early'],
   cure:['treat it like {thing}','{doing} for ten minutes','drink {drink} and wait','ask {thing} instead']},
  beats:[
   [{say:'B',line:'{A}, I need advice. {$problem}.',a:['Idle','neutral'],b:['Think','worried']},
    {say:null,line:'{B} came to {A}, the island’s {A.job}, with a problem.',a:['HandsOnHips','content'],b:['Think','sad']}],
   [{say:'A',line:'As {A.ajob}, I have seen this before.',a:['Think','thinking'],b:['Idle','worried']},
    {say:'A',line:'Hmm. Very serious. Very common.',a:['Think','thinking'],b:['Shrug','worried']}],
   [{say:'A',line:'My professional advice: {$cure}.',a:['Point','content'],b:['Think','surprised']},
    {say:'A',line:'Simple. {$cure}. Every day.',a:['Tada','happy'],b:['Idle','thinking']}],
   [{say:'B',line:'…That makes no sense, but I feel better.',a:['Bow','content'],b:['Bow','happy']},
    {say:null,line:'It worked, for reasons nobody understood.',a:['Peace','happy'],b:['Cheer','laugh']},
    {say:'B',line:'And your fee?',a:['Point','smile'],b:['Shrug','worried']}],
  ]},
 {id:'early',title:['Too early at {place.short}','{A} and the clock','On time, technically'],cast:1,
  bind:{wait:['opening time','the ferry','the evening paper','the first bowl of the day','the karaoke machine to warm up']},
  beats:[
   [{say:null,line:'{A} arrived at {place.short} at {hour}, ready for {$wait}.',a:['Wave','happy']},
    {say:'A',line:'First in line for {$wait}. As usual.',a:['HandsOnHips','content']}],
   [{say:null,line:'{A} waited.',a:['Idle','neutral']},
    {say:'A',line:'Any minute now.',a:['Think','neutral']}],
   [{say:null,line:'{A} waited some more. Then tried {doing}.',a:['Crouch','sleep']},
    {say:'A',line:'Perhaps {thing} knows what time it is.',a:['Think','thinking']}],
   [{say:null,line:'It was Wednesday. {place.short} was closed.',kinds:['shop','food','bar','bath','civic','work'],a:['Shrug','surprised']},
    {say:null,line:'Everybody else had come yesterday.',kinds:['outdoor'],a:['Shrug','surprised']},
    {say:'A',line:'Tomorrow I will come even earlier.',a:['Cheer','happy']},
    {say:null,line:'{A} had {snack} instead and called it a success.',a:['Peace','happy']}],
  ]},
 {id:'invention',title:['{A}’s invention','Patent pending','The {$gadget}'],cast:2,
  bind:{gadget:['automatic {food} turner','umbrella for {thing.bare}','pocket tide clock','self-sweeping broom','snack detector']},
  beats:[
   [{say:'A',line:'Behold: the {$gadget}!',a:['Tada','happy'],b:['Idle','surprised']},
    {say:null,line:'{A} had been building something instead of {doing}.',a:['Think','thinking'],b:['Idle','neutral']}],
   [{say:'B',line:'What does it do?',a:['Tada','happy'],b:['Think','thinking']},
    {say:'B',line:'Is it safe?',a:['HandsOnHips','content'],b:['Think','worried']}],
   [{say:null,line:'There was a small bang and a smell of {food}.',sfx:'BANG!',bg:'focus',a:['Shrug','surprised'],b:['Shrug','surprised']},
    {say:'A',line:'Watch closely. Three, two, one…',a:['Point','happy'],b:['Crouch','worried']}],
   [{say:'A',line:'Version two will be better.',a:['Shrug','smile'],b:['Laugh','laugh']},
    {say:'B',line:'…I will take two.',a:['Cheer','laugh'],b:['Clap','happy']},
    {say:null,line:'{thing} has asked not to be involved in version two.',a:['Think','thinking'],b:['Shrug','smile']}],
  ]},
]);

/**
 * Twist endings: any genre's last panel may be swapped for one of these. They follow from the
 * place and the people already in the strip, but not from the story, which is the joke. C is a
 * third resident who walks in for the last panel.
 */
export const ENDINGS=Object.freeze([
 {say:null,line:'Meanwhile, {thing} had been listening the whole time.',shot:'close-thing',sfx:'…',a:['Idle','neutral'],b:['Idle','neutral']},
 {say:null,line:'Then a gull stole {snack} and the matter was closed.',shot:'wide',sfx:'SWOOP!',a:['Shrug','surprised'],b:['Point','surprised']},
 {say:'C',line:'Has anybody seen my left sandal?',cast:'C',shot:'low',a:['Think','worried']},
 {say:null,line:'{C} walked past carrying {food} for forty people.',cast:'C',shot:'wide',sfx:'STOMP STOMP',a:['Cheer','happy']},
 {say:null,line:'Nobody noticed the ferry leave without them.',shot:'high',sfx:'BWOOOO',a:['Laugh','laugh'],b:['Laugh','laugh']},
 {say:'A',line:'Anyway. Has anybody tried the new {food}?',shot:'close',a:['Wave','happy'],b:['Shrug','surprised']},
 {say:null,line:'Somewhere, {C} sneezed.',cast:'C',shot:'close',sfx:'ACHOO!',a:['Bow','surprised']},
]);

/** Opening panels: a wide establishing shot before the story starts (longer strips, Sundays). */
export const OPENINGS=Object.freeze(['{place}. {hour}.','Meanwhile, at {place.short}…','{place}, on a [quiet|busy|perfectly ordinary] day.','{hour} at {place.short}.']);
/** Reaction panels: a beat of silence before the pay-off. Lines may be empty. */
export const REACTIONS=Object.freeze(['','…','!','Wait.','Hm.']);

/** Recipes: a dish a resident claims as their own, with one step that has no business being there. */
export const RECIPE=Object.freeze({
 title:['{A}’s famous {$dish}','{$dish}, the {place.bare} way','{$dish} for people in a hurry'],
 // Each dish names the one ingredient it cannot be without.
 dish:[['island fried rice','two bowls of rice'],['harbour club sandwich','one tin of luncheon meat'],['harbour omurice','one egg, at room temperature'],['emergency champurū','tofu'],['typhoon curry','a box of curry roux'],['three-minute miso soup','a spoon of miso']],
 main:['luncheon meat','spring onions','tofu','pork belly'],
 ingredients:['two bowls of rice','one egg, at room temperature','a spoon of miso','{snack}, crushed','a pinch of salt','a squeeze of shikuwasa','soy sauce, to taste','{drink}, for the cook'],
 steps:['Wash the rice until the water runs nearly clear.','Heat the pan until a drop of water dances.','Fry the {$main} until golden.','Stir in the miso and turn the heat down.','Add the egg and do not touch it for one minute.','Season with soy sauce and taste it.','Fold everything together gently.','Serve in the biggest bowl you own.'],
 odd:['Hum quietly while it simmers; the pan can tell.','Ask {thing} for its opinion.','Wait for {weather} to pass.','Do this step facing the sea.','If {B} is watching, pretend you meant to do that.'],
 tip:['From {A}’s notebook: “{A.habit}.”','Never cook for {B} before {hour}.','It tastes better after {doing}.','Best eaten at {place.short}.'],
});

/** Courses: something a resident is good at, taught in three lessons. */
export const COURSE=Object.freeze({
 title:['{$topic}: a short course by {A}','Learn {$topic} with {A}','{A} teaches {$topic}'],
 topic:['bowing properly','haggling politely','reading the tide','choosing a good {food}','keeping a shop tidy','singing karaoke with confidence','being on time','talking to cats','folding a furoshiki','{doing}'],
 lesson:['Start small. Even {thing} was not built in a day.','Watch how it is done at {place.short} first.','Practise every morning before {hour}.','Mistakes are fine. {B} makes them daily.','Breathe in. Think of {food}. Breathe out.','Ask a regular. Ask twice if it is {B}.','Keep {drink} nearby for courage.','Do it once properly instead of three times quickly.'],
 exam:['The exam is held at {place.short}. Bring {snack}.','There is no exam. {A} will simply know.','Pass, and {A} will let you hold {thing}.'],
});

/** Overheard: one line, one panel. */
export const OVERHEARD=Object.freeze([
 '“{thing} is the most reliable thing on this island.”',
 '“I am not saying it was {B}. I am just saying {B} was nearby.”',
 '“Nobody leaves {place.short} until the {food} is finished.”',
 '“{weather} again? I am taking it personally.”',
 '“If anybody asks, I was {doing}.”',
 '“My ambition? {A.ambition}”',
]);
