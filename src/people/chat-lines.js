import {personalityOf,PERSONALITIES} from '../avatars/personality.js';

/**
 * What the neighbours say to each other when the town's language model is not running
 * (town-mind.js): small talk written to their temperaments.
 *
 * A temperament is two of the four personality dials (personality.js): lively or calm
 * feelings, easygoing or serious outlook.
 *
 *   sunny     lively and easygoing: exclamation marks, delighted by everything
 *   dramatic  lively and serious: every small thing is an epic
 *   easy      calm and easygoing: unbothered, warm, a little lazy
 *   dry       calm and serious: deadpan, exact, quietly funny
 *
 * Each topic says one thing four ways (`open`), answers it four ways (`reply`) and has
 * the first speaker come back four ways (`close`). Every reply must work after any of
 * that topic's openers, and every comeback after any reply, so any two people make a
 * conversation that sounds like the two of them. `{b}` is the other person's name.
 * October 1997, an Okinawan harbour town.
 */
export const TEMPERAMENTS=Object.freeze(['sunny','dramatic','easy','dry']);

export function temperamentOf(profile={}){
 const type=personalityOf(profile),i=Math.max(0,PERSONALITY_INDEX.get(type.name)??0);
 const lively=(i>>1)&1,easy=i&1;
 return lively?(easy?'sunny':'dramatic'):(easy?'easy':'dry');
}
const PERSONALITY_INDEX=new Map(PERSONALITIES.map((p,i)=>[p.name,i]));

const T=(sunny,dramatic,easy,dry)=>Object.freeze({sunny,dramatic,easy,dry});

export const TOPICS=Object.freeze([
 {id:'tama',open:T(
   'Tama walked into the market and came out with a whole squid!',
   'That cat Tama stole a squid from the market and looked me right in the eye.',
   'Tama got himself a squid from the market again.',
   'Tama has taken another squid from the market. Third this week.'),
  reply:T(
   'Ha! He works harder than anybody on this street!',
   'A criminal mastermind. And we feed him!',
   'Good for him. Somebody should eat well round here.',
   'He has a better income than I do.'),
  close:T('I am going to make him a little name badge.','One day he will run this town, {b}. Mark my words.','Leave him be. He is a cat with a plan.','I shall inform the fish man. Again.')},
 {id:'typhoon',open:T(
   'The radio says a typhoon might come Thursday! Time for candles and card games!',
   'A typhoon is coming Thursday. I can feel it in my knees.',
   'Typhoon might swing by Thursday, they say.',
   'Typhoon number twenty-three. Thursday, if it keeps its course.'),
  reply:T(
   'Typhoon party at mine! I have three kinds of crisps!',
   'Last time my washing went to Kume Island and never came back.',
   'Then Friday is a day off. I like typhoons.',
   'I have already taped the windows. And labelled the tape.'),
  close:T('Bring your torch, {b}. We will tell ghost stories!','Tie everything down, {b}. Everything.','I will sleep through it, like last year.','Check your shutters, {b}. I will not check them for you.')},
 {id:'ferry',open:T(
   'The ferry was late again! I waved at it the whole way in!',
   'The ferry was forty minutes late. Forty! I nearly wept on the pier.',
   'Ferry was a bit late today.',
   'The ferry was forty minutes late. The timetable is a work of fiction.'),
  reply:T(
   'More time to look at the sea! I call that a bonus!',
   'They do it on purpose. To test us.',
   'Island time. It gets here when it gets here.',
   'I hear the captain stops to fish.'),
  close:T('I am bringing a flag next time.','I shall write a letter. A long one.','Sit down, have a tea. It always comes.','I would stop to fish too.')},
 {id:'fish',open:T(
   'I caught a fish this morning! Well, it was mostly a fish!',
   'I fought a fish for an hour this morning. The fish won.',
   'Went fishing at dawn. Caught nothing. Lovely morning.',
   'I went fishing at dawn. The fish declined.'),
  reply:T(
   'Every fish is a good fish!',
   'The sea gives and the sea takes, {b}.',
   'That is the best kind of fishing. No cleaning.',
   'The fish here are very well informed.'),
  close:T('Tomorrow I will bring a bigger bucket!','I will have my revenge on Sunday.','Same time tomorrow, then.','I shall change bait. And hat.')},
 {id:'tamagotchi',open:T(
   'My niece gave me her Tamagotchi to mind and it is beeping at me!',
   'I was minding my niece’s Tamagotchi and it died. I feel terrible.',
   'My niece left me her Tamagotchi. It keeps wanting dinner.',
   'I am minding a Tamagotchi. It is more demanding than my landlord.'),
  reply:T(
   'Feed it! Play with it! Give it a little hat!',
   'Those things know when you are not looking.',
   'Give it a snack and put it in a drawer.',
   'Tell it the shop is shut.'),
  close:T('I named it Mochi. We are best friends now.','I will not sleep tonight, {b}.','That is my plan for most things.','It is learning nothing from me.')},
 {id:'icecream',open:T(
   'Blue Coral is closed. I still remember the purple sweet potato flavour.',
   'No beni-imo scoop today. Blue Coral needs a keeper.',
   'Thinking about an ice cream for the day Blue Coral opens again.',
   'I have checked the closed Blue Coral shutter three times this week. For research.'),
  reply:T(
   'When it opens again, two each. One for each hand!',
   'Some days only ice cream understands.',
   'Every afternoon is that kind of afternoon.',
   'Chocolate. It is the only honest flavour.'),
  close:T('We can wait, {b}.','You understand me, {b}.','I will walk through the park instead.','I will report when the shutter opens.')},
 {id:'karaoke',open:T(
   'Karaoke at the izakaya tonight! I have been practising in the shower!',
   'I am singing at the izakaya tonight. I have chosen a ballad. A very sad one.',
   'Karaoke at the izakaya tonight, if you fancy it.',
   'I have been asked to sing at the izakaya tonight. I have not agreed.'),
  reply:T(
   'I will do the duet! I know all the high bits!',
   'Then I will bring tissues. For everyone.',
   'I will come for the snacks and clap at the end.',
   'I will sit near the door.'),
  close:T('Wear something sparkly, {b}!','Prepare yourself, {b}. Emotionally.','See you there, then.','That is very wise.')},
 {id:'radio',open:T(
   'Did you hear Amuro Namie on the radio? I danced so hard I knocked the kettle over!',
   'They played my song on the radio this morning, {b}. My song! I had to sit down.',
   'Radio has been playing good stuff today.',
   'Somebody on this street plays the same radio song every morning at six.'),
  reply:T(
   'Turn it up! The whole street can dance!',
   'Music like that should come with a warning.',
   'I hum along. I do not know the words.',
   'It is Tetsuo. Do not encourage him.'),
  close:T('Tomorrow, dance party on the pier!','I will never recover.','Humming is the best way.','I shall buy earplugs. Two pairs.')},
 {id:'plants',open:T(
   'Thuan has named all her plants and I think the fern likes me!',
   'Thuan says the fern by her door is sulking. I believe her.',
   'Thuan’s plants are looking well.',
   'Thuan has promoted the fern by her door to assistant manager.'),
  reply:T(
   'I am going to bring it a little present!',
   'Plants feel things, {b}. More than people do.',
   'She talks to them. Seems to work.',
   'It is more organised than our council.'),
  close:T('Maybe a tiny watering can!','Be kind to it, {b}. Be very kind.','Maybe I should talk to my cactus.','I would vote for it.')},
 {id:'pager',open:T(
   'I got a pager! It beeps and I feel so important!',
   'My pager went off at three in the morning. It was a wrong number. I have not slept since.',
   'Got myself a pager. Nobody pages me.',
   'I have a pager now. It is mostly my mother.'),
  reply:T(
   'Page me! Page me now! 0840 means good morning!',
   'Modern life, {b}. It will never let us rest.',
   'That is the dream. Peace and a beeper.',
   'Mothers were the reason pagers were invented.'),
  close:T('I will page you every morning!','I am throwing mine into the sea.','Quiet is underrated.','She paged me 4649. I think it was a threat.')},
 {id:'eisa',open:T(
   'The eisa drummers were practising by the school! I could not stop jumping!',
   'The eisa drums last night shook my whole house. It was magnificent.',
   'Heard the eisa drummers practising last night.',
   'The eisa drummers practise at eight. Precisely eight. I respect that.'),
  reply:T(
   'Let us join next year! I will learn the big drum!',
   'It goes right into your chest. Like a heartbeat.',
   'Good sound to fall asleep to.',
   'Their spinning is very accurate.'),
  close:T('Kachāshī! Hands up, {b}!','I will be at every practice. Every one.','Next time I will bring a chair.','I counted. Forty-two spins.')},
 {id:'goya',open:T(
   'I made goya champuru and it was only a little bit too bitter!',
   'I tried to make goya champuru. The goya fought back.',
   'Made goya champuru for supper. Not bad.',
   'My goya champuru was bitter. I believe this was the goya’s choice.'),
  reply:T(
   'Bitter is good for you! That is what my grandma says!',
   'Goya is a test of character, {b}.',
   'More egg. Always more egg.',
   'Goya does not want to be eaten. One must respect that.'),
  close:T('Next time I will add a whole tin of Spam!','I will try again. I must.','Good advice. Egg fixes things.','I will negotiate with it tomorrow.')},
 {id:'habu',open:T(
   'Somebody saw a habu near the cane field! A real one! Ooh!',
   'There is a habu near the cane field. Huge. Maybe two metres.',
   'They say there is a habu by the cane field.',
   'There is a habu by the cane field. Or a long stick. Reports vary.'),
  reply:T(
   'I will look from very, very far away!',
   'Then I am never walking there again. Never.',
   'I will take the long way round, then.',
   'I have seen that stick. It is a stick.'),
  close:T('Bring binoculars, {b}!','Stay safe, {b}. I mean it.','Long way round has better views anyway.','Then I shall call it Mr Stick.')},
 {id:'rootbeer',open:T(
   'A&W root beer in the frosted mug! I had two! My brain froze!',
   'I had an A&W root beer and remembered being nine years old. I nearly cried.',
   'Had a root beer at A&W yesterday. Nice and cold.',
   'Root beer tastes like toothpaste and I cannot stop drinking it.'),
  reply:T(
   'And the curly fries! Do not forget the curly fries!',
   'Some flavours are memories, {b}.',
   'Frosted mug makes everything better.',
   'Nobody from outside Okinawa understands it.'),
  close:T('Let us go Saturday!','We should all go. For the memories.','Saturday, then. No rush.','And they never will.')},
 {id:'sunset',when:'evening',open:T(
   'Look at that sunset! It is all orange and pink like a sweet!',
   'Look at the sky, {b}. I have never seen it so red.',
   'Nice evening.',
   'The sun is setting at five fifty-two today. Right on time.'),
  reply:T(
   'Let us stay and watch until it is completely gone!',
   'It makes me want to write a poem.',
   'Best part of the day.',
   'It has never once been late.'),
  close:T('Beer and a sunset! Perfect!','Maybe I will write one too.','Can’t argue with that.','Unlike the ferry.')},
 {id:'night',when:'night',open:T(
   'You are up late too! Want to count stars?',
   'I cannot sleep, {b}. The night is too big.',
   'Can’t sleep either?',
   'It is past ten. Neither of us should be here.'),
  reply:T(
   'I counted to three hundred and then I saw a shooting star!',
   'The sea is very loud when everyone else is quiet.',
   'Warm night. Good for walking.',
   'I came out for a vending machine coffee. I regret nothing.'),
  close:T('Make a wish, {b}! Quick!','Let us listen a while.','Five more minutes, then bed.','Good night, {b}. Officially.')},
 {id:'rain',when:'rain',open:T(
   'It is raining! I love the smell of rain on the road!',
   'This rain will never stop, {b}. Never.',
   'Bit of rain.',
   'It is raining. My umbrella is at home, keeping dry.'),
  reply:T(
   'Puddle jumping! Who is with me?',
   'My socks have given up.',
   'Good for the garden.',
   'That umbrella has the right idea.'),
  close:T('I bet I can make the biggest splash!','I will never be dry again.','Tea will fix it.','I shall get it a raincoat.')},
].map(Object.freeze));

/** A neighbour's own gossip (profiles.js), and how the other might take it. */
const GOSSIP_REPLY=T('No! Tell me everything!','I knew something was going on!','Ha. That sounds about right.','That is the most predictable thing I have heard today.');
const GOSSIP_CLOSE=T('This town is the best, {b}!','You did not hear it from me, {b}.','Anyway. Small town.','I will be watching.');

const hour=minutes=>(((minutes%1440)+1440)%1440)/60;
function topicFits(t,minutes,rain){
 const h=hour(minutes);
 if(t.when==='rain')return rain;
 if(t.when==='night')return h>=21||h<5;
 if(t.when==='evening')return h>=17&&h<19.5;
 return !rain||Math.random()<.6;
}

/**
 * A short conversation between two neighbours, in their own temperaments.
 * @param {{name:string,profile?:object,gossip?:string}} a who speaks first
 * @param {{name:string,profile?:object}} b
 * @returns {{speakers:number[],lines:string[],topic:string}} speakers: 0 for a, 1 for b
 */
export function writtenChat(a,b,{minutes=720,rain=false,random=Math.random,avoid=[]}={}){
 const ta=temperamentOf(a.profile),tb=temperamentOf(b.profile);
 const fill=s=>s.replace(/\{b\}/g,b.name).replace(/\{a\}/g,a.name);
 if(a.gossip&&random()<.25&&!avoid.includes('gossip:'+a.name))
  return {topic:'gossip:'+a.name,speakers:[0,1,0],lines:[a.gossip,fill(GOSSIP_REPLY[tb]),fill(GOSSIP_CLOSE[ta])]};
 const timed=TOPICS.filter(t=>t.when&&topicFits(t,minutes,rain)&&!avoid.includes(t.id));
 const any=TOPICS.filter(t=>!t.when&&!avoid.includes(t.id));
 const pool=timed.length&&random()<.5?timed:(any.length?any:TOPICS.filter(t=>!t.when));
 const t=pool[Math.floor(random()*pool.length)];
 return {topic:t.id,speakers:[0,1,0],lines:[fill(t.open[ta]),fill(t.reply[tb]),fill(t.close[ta])]};
}
