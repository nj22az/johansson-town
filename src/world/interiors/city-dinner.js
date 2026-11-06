/**
 * The evening out in Naha as data: when the boat runs, what is on the menu and what
 * Johansson and Thuan talk about. Kept free of three.js so the dinner menu
 * (activities.js) can read it without the scene (city-restaurant.js).
 */
export const CITY_RESTAURANT=Object.freeze({
 id:'city-restaurant',title:'Restaurant Hoshizora',jp:"Restaurant Starry sky · Naha",sub:'WITH THUAN',
 /** When the evening boat to Naha runs, and the last one back. */
 sailFrom:17*60,sailUntil:21*60+30,crossing:50,
});

export const DINNER_MENU=Object.freeze([
 {id:'course',label:'The Ryūkyū course for two',price:2400,dish:'course',
  text:'Mimigā in vinegar, sea grapes that pop on the tongue, rafutē cubes glazed dark with awamori and brown sugar, a bowl of Okinawa soba each, and beni-imo tart to finish. Thuan photographs every plate with the disposable camera from her bag.'},
 {id:'steak',label:'Steak and garlic rice for two',price:2800,dish:'steak',
  text:'Sizzling iron plates with Ishigaki beef, garlic rice, corn and a slice of pineapple, the way Naha has done steak since the American years. The waiter pours the sauce from a height and the plates hiss.'},
 {id:'awamori',label:'Two glasses of kūsu (aged awamori)',price:600,drink:'awamori',
  text:'Ten-year kūsu from Shuri, on the rocks, in heavy glasses. It smells of vanilla and smoke. Thuan takes a sip and a cough, and then a smaller sip.'},
 {id:'wine',label:'A bottle of the house red',price:1200,drink:'wine',
  text:'A Chilean red, which the waiter says with some ceremony is “from the other side of the world, like the mayor.” Thuan laughs into her napkin.'},
]);

/** What they talk about. Thuan's half first, then yours, then whatever comes next. */
export const DINNER_TALK=Object.freeze([
 'Thuan points out the ferry terminal far down at Tomari, lit up like a cake. “Ours is the small one,” she says. “It always looks smaller from up here.”',
 'She tells you about her grandmother’s stall in Nam Phước, by the market on the river, in four sentences; the last one is that Sakura Shōten smells like it after rain. You tell her about the boathouse in Sweden and the winters with no sun at all. “No,” she says. “Nobody lives like that.”',
 '“If you were not the mayor, what would you be?” You say a ferry captain. She says she would be the one selling the tickets, so she could tell you when you were late.',
 'You talk about the town: the power house’s second engine, Kōji’s tuna, whether the gateball team will beat Kitano-jima this year. She has an opinion about every one of them and most of them are right.',
 'She asks why you stayed in 1979. You start to say it was the job, and then you tell her the truth: you got off the ferry, somebody gave you a cold barley tea, and you did not want to get back on.',
 'The pianist plays “Hana” and half the restaurant goes quiet. Thuan hums the second verse. When it finishes she looks out of the window for a while and does not say anything, and that is fine too.',
]);
