import {bagEntries,BAG_CATEGORIES} from './src/commerce/bag-catalogue.js';
import {personalityOf,DIALS,dialStep,hasVoiceRefinement} from './src/avatars/personality.js';
import {personalityReference} from './src/avatars/personality-questions.js';
import {restoreRelationships,rememberEncounter,connectionsFor,connectionSummary,relationshipBetween} from './src/people/relationships.js';
import {openYear,realYear} from './src/progression/year-loop.js';
import {MINATO_MEMORY_STORY,MINATO_RECIPE_CARD} from './src/world/interiors/izakaya-exploration.js';
import {foodArtForItem} from './src/commerce/food-art.js';
import {FLYER_ITEM,FLYER_PATH,FLYER_PAPER,collectSakuraFlyer} from './src/commerce/sakura-flyer.js';
import {WOODLAND_POSTER} from './src/world/woodland-poster.js';
import {restoreIsland} from './src/island/services.js';
import {HOUSE_SAVE,restoreHouseState} from './src/world/johansson-house.js';
import {MOTOR_LINKS} from './src/workshop/motor-bench.js';
import {playerRecipe} from './src/avatars/actors.js';
import {BUDGET,WEB_PURSE} from './src/edition.js';
import {encodeRecipe} from './src/avatars/recipe.js';
import {restoreArchive,seedArchive,fileDocument,retainArchive} from './src/office/archive.js';
import {createArchiveView} from './src/office/archive-ui.js';
import {isWorkshopSite} from './src/world/businesses.js';
import {ferryTimetableText} from './src/world/ferry-timetable.js';
import {sakuraClerkAt} from './src/commerce/sakura-rota.js';
import {createRamenTicketMachine} from './src/people/ramen-ticket.js';
import {cleanConcert} from './src/music/songs.js';
import {createIzakayaPlay} from './src/people/izakaya-play.js';
import {pendingTownAbsence} from './src/people/town-absence.js';
import {createShopLedgerView} from './src/commerce/shop-ledger.js';
import {createPaperworkView} from './src/commerce/paperwork.js';
import {createMagazineReader} from './src/ui/magazine-reader.js';
import {createPrintViewer} from './src/ui/print-viewer.js';
import {createReaderHistory} from './src/ui/reader-history.js';
import {tradePosterPages,SAKURA_TRADE_POSTERS} from './src/world/interiors/sakura-trade-posters.js';
import {townCalendarAt} from './src/town-clock.js';
import {happeningLine,happeningOutcome} from './src/people/happenings.js';
import {impressionLine,restoreImpressions} from './src/people/impressions.js';
import {birthdayOn,birthdaysOn} from './src/people/birthdays.js';
import {recordMoment,diaryPage,diaryDays,restoreDiary} from './src/progression/diary.js';
import {restoreAlbum,addPhoto,removePhoto,photoMoment,photoCaption,nextPhotoId,restoreSeen} from './src/photo/pocket-album.js';
import {albumView,albumLead} from './src/photo/pocket-album-view.js';
import {wantsAnother} from './src/people/drunk.js';
import {restoreTownCleanup,collectTownFind} from './src/commerce/town-cleanup.js';
import {restoreSakura,recordSakuraSale} from './src/commerce/sakura-economy.js';
import {GANAHA,ganahaGreeting,nextBoatLine} from './src/people/ganaha.js';
import {islandPlaces,placeSays} from './src/world/island-guide.js';
import {fishAt,fishItem,pierFishOfItem,pierCatch,LEGACY_CATCH,aFish} from './src/world/okinawa/fish.js';
import {printedModels} from './src/workshop/catalogue.js';
import {restoreWorkshop,advancePrint} from './src/workshop/production.js';
import {createWorkshopUI} from './src/workshop/interface.js';
import {loadWorkshopModel,printedItem} from './src/workshop/models.js';
import {loadOfficeWorkbooks,createOfficeWorkbookView} from './src/office/workbooks.js';
import {STORE_MENU} from './src/commerce/store-menu.js';
import {restoreResidentLife,residentPersonality} from './src/people/resident-personalities.js';
import {travelProgress,travelStatusText} from './src/progression/travel.js';
import {restoreHomeDecor} from './src/progression/home-decor.js';
import {readStudioChoices,applyStudioChoices} from './src/studio-handoff.js';
import {ensureDailyQuests,markDailyDone,hasDailyQuest,isDailyDone,NOTICE_NUDGE,RADIO_821} from './src/progression/soft-quests.js';
import {PROFILES} from './src/people/profiles.js';
import {RESIDENTS,residentHomeDescription} from './src/people/residents.js';
import {gossipAt,izakayaOpen,onsenInvitationDay} from './src/people/social.js';
import {DRINKS,DISHES,menuItem} from './src/people/izakaya-beer.js';
import {VENDING_PRODUCTS,DRINKABLE,EMPTY_CAN,CAN_REFUND} from './src/commerce/vending-catalogue.js';
import {SAKURA_SPECIALS,SPECIAL_BY_NAME,specialsOpen} from './src/commerce/sakura-specials.js';
import {MEDICINES,STAMINA_DRINK} from './src/world/interiors/sakura-dressing.js';
import {STORE_ITEMS} from './src/commerce/catalogue.js';
import {roundDeliveryBook} from './src/commerce/trade-round.js';
import {LAUNDRY_MACHINES,LAUNDRY_POWDER,playerWashStage,freeMachine} from './src/commerce/coin-laundry.js';
import {SHOPIFY_CONFIG} from './src/commerce/shopify-config.js';
import {createShopify} from './src/commerce/shopify.js';
import {townAudio} from './src/audio/town-audio.js?snappy=1';
import {DIALOGUE} from './src/people/schedules.js?snappy=1';
import {JOURNAL} from './content-data.js';
import {CITY_RESTAURANT,DINNER_MENU} from './src/world/interiors/city-dinner.js';
import {readSave,readPlayers,activePlayer,addPlayer,switchPlayer,renamePlayer,touchPlayer,writeSave,rescueSave,activeSlot,PREV_SUFFIX} from './src/save.js';
import {createTownDialogue,restoreStory,countTalk,dialogueVariables} from './src/dialogue/town-dialogue.js';
import {createDialogueBox} from './src/dialogue/dialogue-box.js';
import {giftableItems,takeGift,giftReaction} from './src/people/thuan-gifts.js';
import {restoreFriendship,talked,gave,giftLine,wantLine,openWant,heartLine,levelName,wantPool,withArticle,favouriteOf,helped} from './src/people/friendship.js';
import {NEIGHBOUR_TALK} from './src/people/neighbours.js';
import {svg,itemIcon} from './src/ui/icons.js';
import {TOWN_FINDS} from './src/commerce/sakura-economy.js';
import {SAKURA_SCRIPT,sakuraEntry} from './src/dialogue/sakura-script.js';
import {sharedMind} from './src/people/thuan-mind.js';
import {createThuanVoice} from './src/people/thuan-voice.js';
import {createThuanChat} from './src/people/thuan-chat.js';
import {restoreNews} from './src/feed/evening-news.js';
import {restorePost,ensurePost,postRound,sendLetter,lettersForReturn,ROUND} from './src/mail/post.js';
import {letterText,letterLabel,openLetter,unreadCount,STATIONERY,stationerySvg} from './src/mail/letters.js';
import {temperamentOf} from './src/people/chat-lines.js';
import {greetingFor,shortGreeting,daysBetween} from './src/people/greetings.js';
import {happeningsOn} from './src/people/happenings.js';
import {typhoonAt,typhoonPostDay,clockWords} from './src/world/typhoons.js';
import {townDate as townDateOf} from './src/town-clock.js';
import {planFavours,favourWaiting,clueFor,favourLine,askFavour,replyFavour,favourExpire,favourVisit,restoreFavours,restoreFavourErrand,favourById} from './src/people/favours.js';
import {recipeFor} from './src/avatars/cast.js';
import {GROCERY_ITEMS} from './src/commerce/catalogue.js';
import {restoreKonbini,addToBasket,removeFromBasket,basketLines,basketTotal,warmableInBasket,
 checkoutQuote,checkout,receiptText,CARD_STAMPS,SAKURA_AWAY_MESSAGE,sakuraHoursOpen,HOT_SNACKS,buyHotSnack,thuanRecommends,SAKURA_BOTTLES} from './src/commerce/konbini.js';

export function createActivities({say,onLaundry=()=>{},onKaraoke=null,getResidentLocations=()=>null,onOpen=()=>{},onConversation=()=>{},onDialoguePhase=()=>{},onWeather,onTime,getMinutes=()=>1002,getSocialContext=()=>({}),onPhone=()=>false,onEscort=()=>{},onPurchase=()=>false,onSeat=()=>false,onEat=()=>false,onTreat=()=>{},onDrink=()=>false,onSnack=()=>false,onMap=()=>null,getTableService=()=>null,onStand=()=>{},onInspectModel=()=>{},onInspectShopGood=null,onMove=()=>{},getBeerTable=()=>null,onOrderDrink=()=>false,getTipsy=()=>0,onSip=()=>false,onOutfit=()=>{},getOutfit=()=>false,getMassageChair=()=>null}) {
  const $=s=>document.querySelector(s);
  const defaults={yen:1200,inventory:[],visited:[],quest:0,fish:0,best:0,weather:false,sound:true,operated:[],inspectedIds:[],notes:['14 September 1997. Harbour Line: check the terminal timetable for day and night services.'],shrineIntent:null,kenjiEscort:false,quickTravelNotified:false,townMode:'peninsula',homeDecor:restoreHomeDecor(),pocketAlbum:[]};
  const realShop=createShopify(SHOPIFY_CONFIG);let modalRevision=0;
  let awaySince=0,returnDay=null;
  let pendingAbsence=0,ledgerView=null,magazineView=null,yearTurned=false;let state={...defaults},timer=null,modalOpen=false,previousFocus=null,radioStation=0;
  let woodlandView=null;

  try {
    // A new real year starts the island's 1997 over, keeping friendships, the bag, money and decorating (year-loop.js).
    const read=readSave(localStorage);
    // The save did not read and the previous copy was loaded: keep the unreadable one as it is, and say so.
    if(read?.readFrom?.endsWith(PREV_SUFFIX))try{rescueSave(localStorage,activeSlot(localStorage));setTimeout(()=>say('Your last save could not be read, so the one before it is loaded. The unreadable one is kept on this device.',9),4000);}catch{}
    const {saved,turned}=openYear(read);yearTurned=turned;
    if(saved&&typeof saved==='object'){state.loopYear=saved.loopYear;state.loops=saved.loops|0;pendingAbsence=pendingTownAbsence(saved);state.pendingTownMinutes=pendingAbsence;
      state.homeDecor=restoreHomeDecor(saved.homeDecor);state.pocketAlbum=restoreAlbum(saved.pocketAlbum);state.pocketTaken=Number.isInteger(saved.pocketTaken)&&saved.pocketTaken>0?Math.min(saved.pocketTaken,999999):0;state.pocketSeen=restoreSeen(saved.pocketSeen,state.pocketAlbum);state.diary=restoreDiary(saved.diary);state.news=restoreNews(saved.news);state.post=restorePost(saved.post);awaySince=Number.isFinite(saved.savedAt)?saved.savedAt:0;state.impressions=restoreImpressions(saved.impressions);state.favours=restoreFavours(saved.favours);state.errand=restoreFavourErrand(saved.errand);state.greeted=saved.greeted&&typeof saved.greeted==='object'?Object.fromEntries(Object.entries(saved.greeted).filter(([k,v])=>typeof k==='string'&&Number.isSafeInteger(v)).slice(-60)):{};
      state.combatRecovery=saved.combatRecovery;state.desktopCheckpoint=saved.desktopCheckpoint;state.desktopLife=saved.desktopLife;state.concert=cleanConcert(saved.concert);state.relationships=restoreRelationships(saved.relationships);
      state.heardHappenings=Array.isArray(saved.heardHappenings)?saved.heardHappenings.filter(x=>typeof x==='string').slice(-40):[];
      state.thuanOutfit=['nozomi','sailor'].includes(saved.thuanOutfit)?saved.thuanOutfit:'clothes';{const house=restoreHouseState(saved[HOUSE_SAVE]);if(house)state[HOUSE_SAVE]=house;}state.island=restoreIsland(saved.island);state.documentArchive=restoreArchive(saved.documentArchive);state.sakura=saved.sakura;state.bookshop=saved.bookshop;state.townCleanup=saved.townCleanup;state.workshop=saved.workshop;state.story=saved.story;state.konbini=saved.konbini;state.residentLife=restoreResidentLife(saved.residentLife);state.friendship=restoreFriendship(saved.friendship);state.residentLocations=saved.residentLocations;state.housingRevision=saved.housingRevision;
      for(const k of ['yen','quest','fish','best'])if(Number.isFinite(saved[k])&&saved[k]>=0)state[k]=saved[k];
      state.yen=Math.min(state.yen,999999);state.quest=Math.min(state.quest,3);
      for(const k of ['inventory','visited','operated','inspectedIds','notes'])if(Array.isArray(saved[k]))state[k]=saved[k].filter(x=>typeof x==='string').slice(0,100);
      state.inventory=state.inventory.map(x=>LEGACY_CATCH[x]||x);   // the old "Sea bream" is a taman now (fish.js)
      state.notes=state.notes.filter(n=>!n.includes('Website is the town')&&!/https?:/.test(n));state.clockAhead=Number.isFinite(saved.clockAhead)?Math.max(0,Math.min(10080,saved.clockAhead)):0;state.minutes=Number.isFinite(saved.minutes)?saved.minutes:1002;state.sound=saved.sound!==false;state.bookRescue=saved.bookRescue||0;state.radioStation=Number.isInteger(saved.radioStation)?Math.max(0,Math.min(2,saved.radioStation)):0;state.weather=saved.weather===true;state.shrineIntent=['Book','Work','Home'].includes(saved.shrineIntent)?saved.shrineIntent:null;state.kenjiEscort=[true,'walking','done'].includes(saved.kenjiEscort)?saved.kenjiEscort:false;if(Number.isInteger(saved.onsenDate)&&saved.onsenDate>=0)state.onsenDate=saved.onsenDate;state.quickTravelNotified=saved.quickTravelNotified===true;
      if(typeof saved.lastDayKey==='string')state.lastDayKey=saved.lastDayKey;if(Array.isArray(saved.dailyQuests))state.dailyQuests=saved.dailyQuests;if(saved.dailyDone&&(typeof saved.dailyDone==='object'))state.dailyDone=saved.dailyDone;
    }
  } catch(error){
    // Part of the save could not be read. Keep it as it was, once, before the next auto-save writes over it, and say so.
    console.warn('Save not fully read:',error);
    try{if(rescueSave(localStorage,activeSlot(localStorage)))setTimeout(()=>say('Part of your save could not be read. A copy of it is kept on this device, so nothing is lost.',9),4000);}catch{}
  }

  if(!Number.isInteger(state.loopYear)){state.loopYear=realYear();state.loops=0;}
  if(yearTurned)setTimeout(()=>say('1 January 1997, again. The year has started over; your friends still know you.',8),6000);
  state.relationships=restoreRelationships(state.relationships);
  state.story=restoreStory(state.story);
  ensureDailyQuests(state);
  // Back after a week or more: the closest friends write to say so, with today's post (src/mail/post.js).
  for(const letter of lettersForReturn({friendship:state.friendship,daysAway:daysBetween(awaySince),day:Math.floor(getMinutes()/1440)}))sendLetter(state,letter);
  state.konbini=restoreKonbini(state.konbini);
  state.sakura=restoreSakura(state.sakura);
  // The web edition's wallet never runs out (edition.js countedMoney; the owner, 19 October 2026: "Unlimited money on the
  // web"): every price is still on its label and paid at the till, and nothing is refused for want of yen. Linux counts.
  if(!BUDGET.countedMoney)Object.defineProperty(state,'yen',{get:()=>WEB_PURSE,set(){},enumerable:true,configurable:true});
  state.townCleanup=restoreTownCleanup(state.townCleanup);
  state.workshop=restoreWorkshop(state.workshop,state.inventory);
  state.homeDecor=restoreHomeDecor(state.homeDecor);
  // The home and Thuan's outfit are chosen in Johansson Studio (src/studio-handoff.js); the save carries a copy.
  applyStudioChoices(state,readStudioChoices(localStorage));
  // Retain the old save field while all live directions describe the island.
  state.townMode='peninsula';
  seedArchive(state,getMinutes());

  const commuterDescription=name=>name==='Harbour master'?'The harbour office is staffed around the clock. I stay on the quay.':name==='Bus driver'?'I work the Harbour Line and stay at the northern terminal.':'I commute into the shopping district on the Harbour Line and leave by bus after my shift.';

  const characterControl=()=>window.__JOHANSSON_CHARACTER_CONTROL__;
  const modal=$('#activity'),heading=$('#activityTitle'),body=$('#activityBody'),actions=$('#activityActions');
  const dialogueBox=createDialogueBox({modal,heading,body,actions,isOpen:()=>modalOpen,leave:()=>close(),onPhase:phase=>onDialoguePhase(phase),voiceProfile:name=>{const p=recipeFor(name).profile;return hasVoiceRefinement(p)?p:null;},voice:(freq,type,volume,options)=>{if(state.sound!==false)townAudio.blip(freq,type,volume,options);}});

  const workshopUI=createWorkshopUI({state,show,close,save,say,note,getContext:getSocialContext,getMinutes,preview:previewPrint,body,modal});

  async function previewPrint(model){
    show('Form 3D · '+model.name,'Preparing the model…',[['Close',close]]);const revision=modalRevision;
    try{const data=await loadWorkshopModel(model.id);if(!modalOpen||revision!==modalRevision)return;close();onInspectModel(printedItem(model,data));}
    catch{if(!modalOpen||revision!==modalRevision)return;show('Form 3D','The model could not be loaded. Your inventory is unchanged.',[['Try again',()=>previewPrint(model)],['Close',close]]);}
  }

  /** What the wallet says: the count on Linux, plenty on the web (edition.js). */
  function purse(){return BUDGET.countedMoney?'¥'+state.yen.toLocaleString():'plenty of yen';}
  function save(){
    if(globalThis.__JOHANSSON_TITLE_PREVIEW__)return false;
    let saved=false;
    if(travelProgress(state).unlocked&&!state.quickTravelNotified){state.quickTravelNotified=true;state.notes.push('Earned the town shortcuts: Tama is home and Chin’s workshop route is complete.');say('Town shortcuts unlocked! Quick travel is now in your Town Book.',7);}
    try {state.avatarRecipe=encodeRecipe(playerRecipe());retainArchive(state.documentArchive,getMinutes());const locations=getResidentLocations();if(locations)state.residentLocations=locations;state.minutes=getMinutes();const savedAt=Date.now();saved=writeSave(localStorage,activeSlot(localStorage),JSON.stringify({...state,savedAt}));if(!saved)throw Error('storage full');state.savedAt=savedAt;touchPlayer(localStorage,savedAt);$('#saveState').textContent='PROGRESS SAVED';}
    catch {$('#saveState').textContent='SAVING UNAVAILABLE';}
    $('#wallet').textContent=purse();
    return saved;
  }
  // Navigation must not discard the live session after a rejected storage write.
  // Export remains available even when this device cannot save locally.
  function saveBeforeLeaving(proceed){
    if(!save()){
      show('Progress not saved','Your progress is still open, but this device could not save it. Try again or export a save file before leaving.',[
        ['Try again',()=>saveBeforeLeaving(proceed)],['Export save file',exportSave],['Keep playing',close]]);
      return false;
    }
    proceed();return true;
  }
  function close(){disposeWoodlandViewer();dialogueBox.close();modal.classList.remove('bag-view','flyer-view','letter-view','pocket-album-view','resident-record');ledgerView=null;magazineView?.dispose();magazineView=null;modal.classList.remove('magazine-view','print-view');modal.classList.remove('sakura-records');workshopUI.dispose();modalRevision++;townAudio.stopSpeech();clearInterval(timer);timer=null;modalOpen=false;modal.classList.add('hidden');modal.classList.remove('conversation');modal.classList.remove('office-records');document.body.classList.remove('conversation-open');onConversation(null);window.__JOHANSSON_CHARACTER_CONTROL__?.setExpression?.('Thuan',null);previousFocus?.focus?.();}
  // options.mood: how Thuan's face looks for this line (her lines only; others release it).
  function show(title,text,buttons=[],options={}){
    disposeWoodlandViewer();
    if(window.johanssonDesktop&&window.johanssonLinuxWorld)buttons=window.johanssonLinuxWorld.conversationActions(title,buttons,options);
    modal.classList.remove('bag-view','flyer-view','letter-view','pocket-album-view','resident-record');ledgerView=null;modal.classList.remove('sakura-records');workshopUI.dispose();modal.classList.remove('office-records');
    magazineView?.dispose();magazineView=null;modal.classList.remove('magazine-view','print-view');
    modalRevision++;const revision=modalRevision;
    townAudio.stopSpeech();clearInterval(timer);timer=null;if(!modalOpen){onOpen();previousFocus=document.activeElement;}modalOpen=true;document.exitPointerLock?.();
    heading.textContent=title;delete heading.dataset.hearts;delete heading.dataset.level;body.classList.remove('signal');body.replaceChildren();
    const p=document.createElement('p');p.textContent=text;body.append(p);actions.replaceChildren();
    buttons.forEach(([label,fn,disabled=false,say])=>{const b=document.createElement('button');b.textContent=label;b.disabled=disabled;if(say!==undefined)b.dataset.say=say||'';b.onclick=()=>{if(modalOpen&&modalRevision===revision&&!b.disabled)fn();};actions.append(b);});
    const speaker=title.split('·')[0].trim();
    const conversation=speaker==='Thuan'||!!DIALOGUE[speaker]||!!NEIGHBOUR_TALK[speaker];
    modal.classList.toggle('conversation',conversation);document.body.classList.toggle('conversation-open',conversation);
    modal.classList.remove('hidden');onConversation(conversation?speaker:null,text);
    if(speaker==='Thuan')characterControl()?.setExpression?.('Thuan',options.mood||null);
    // A marked-up line's beats hold the typing; its first face shows on the speaker (dialogue/markup.js).
    if(options.face&&speaker!=='Thuan')characterControl()?.feel?.(speaker,options.face,6);
    dialogueBox.present({title,text,conversation,pauses:options.pauses||null});
    if(!conversation)$('#closeActivity').focus();
  }
  /**
   * The post (src/mail/post.js): who the mayor is, as a letter-writer sees him, and who
   * each sender is. The roster's default "Visitor" is still the mayor, Johansson.
   */
  const playerName=()=>{const life=window.johanssonLinuxWorld;if(life&&(window.johanssonDesktop||life.active!=='Johansson'))return life.active;const n=activePlayer(localStorage)?.name;return n&&n!=='Visitor'?n:'Johansson';};
  function senderOf(name){
    const profile=RESIDENTS.find(p=>p.name===name)||PROFILES.find(p=>p.name===name),recipe=recipeFor(name);
    if(!profile&&!recipe)return null;
    return {name,temper:temperamentOf(recipe?.profile||{}),favourite:favouriteOf(name),clue:profile?.clue?clueFor(name,profile.clue,state):null};
  }
  function deliverPost(){
    const m=getMinutes();
    noteTheDay(m);
    endLateFavour(m);
    // A favour offered again replaces the letter that was never acted on, if it is still in the post.
    for(const {replaces,...letter} of planFavours(state,m)){const post=ensurePost(state);post.pending=post.pending.filter(p=>!p.id.startsWith(replaces));sendLetter(state,letter);}
    const delivered=postRound(state,m,{senderOf,playerName:playerName()});if(delivered.length)save();return delivered;
  }
  /**
   * What happens in town is recorded as moments (progression/diary.js), so the diary and the
   * evening news retell it: a festival from the calendar as it went (people/happenings.js
   * happeningOutcome: held, or called off when the rain kept its cast in), and a typhoon when its warning
   * starts and when it comes closest (world/typhoons.js, only while the weather follows the
   * town: game.js sets state.typhoon). A friend writes on the first day of a warning.
   */
  // Whether each of today's outdoor happenings had a dry moment in its hours, as this session saw it (not saved: a
  // happening nobody watched is not reported).
  const happeningSeenDry=new Map();
  function noteTheDay(m){
    const day=Math.floor(m/1440),minute=((m%1440)+1440)%1440;
    for(const h of happeningsOn(m)){
      if(!(h.on.date||h.on.dates)||h.hours[1]<=h.hours[0])continue;
      const key=`${h.id}:${day}`;
      if(minute>=h.hours[0]&&minute<h.hours[1])happeningSeenDry.set(key,!!happeningSeenDry.get(key)||state.weather!==true);
      const typhoonAllHours=!!state.typhoon&&!!typhoonAt(day*1440+h.hours[0])&&!!typhoonAt(day*1440+h.hours[1]-1);
      const outcome=happeningOutcome(h,minute,{seen:happeningSeenDry.get(key),typhoonAllHours}),said=outcome&&h.news?.[outcome];if(!said)continue;
      recordMoment(state,m,{id:`happening:${h.id}:${day}`,kind:'happening',who:outcome==='held'?Object.keys(h.cast||{}).slice(0,4):[],text:said,news:said});
    }
    // A resident's birthday (people/birthdays.js: only the real ones the creator has set).
    for(const who of birthdaysOn(m))recordMoment(state,m,who==='Johansson'?{id:`birthday:${who}:${day}`,kind:'happening',text:'My birthday. Half the island wished me many happy returns.',news:'Happy birthday to the mayor, Johansson, from everyone in Minato.'}
      :{id:`birthday:${who}:${day}`,kind:'happening',who:[who],text:`It was ${who}’s birthday.`,news:`Happy birthday to ${who}, from everyone in Minato.`});
    const t=state.typhoon&&typhoonAt(m);
    if(t){
      recordMoment(state,m,{id:`typhoon:${t.number}:warning`,kind:'happening',text:`A typhoon warning: No. ${t.number}.`,
        news:`A storm warning for Typhoon No. ${t.number} was in force in Okinawa today.`});
      const closest=t.closest.at,today=closest.slice(0,5)===typhoonDayKey(m),past=minute>=Number(closest.slice(6,8))*60;
      if(today&&past)recordMoment(state,m,{id:`typhoon:${t.number}:closest`,kind:'happening',weight:6,text:`Typhoon No. ${t.number} came closest today, about ${t.closest.km} kilometres from Naha.`,
        news:`Typhoon No. ${t.number} came closest to Okinawa at ${clockWords(closest)}, about ${t.closest.km} kilometres from Naha, with a central pressure of ${t.closest.hPa} hectopascals.`});
      const friend=Object.entries(state.friendship||{}).filter(([,r])=>r?.points>=10).sort((a,b)=>b[1].points-a[1].points||a[0].localeCompare(b[0]))[0]?.[0];
      // Written for the first morning round the warning covers, so it comes with the post, not in the afternoon.
      if(friend&&typhoonPostDay(t,ROUND)===typhoonDayKey(m))sendLetter(state,{id:`typhoon:${t.number}:${friend}`,day,occasion:'typhoon',from:friend});
    }
  }
  const typhoonDayKey=m=>{const {key}=townDateOf(m);return key;};
  /**
   * Favours (src/people/favours.js). A day that runs out ends the favour kindly: the thing
   * goes back to whoever asked, and that is a moment too.
   */
  const temperOf=name=>temperamentOf(recipeFor(name)?.profile||{});
  const talkTitle=name=>{const p=PROFILES.find(p=>p.name===name);return p?name+' · '+p.personality:name;};
  const cue=line=>({pauses:line.pauses,face:line.faces[0]?.face});
  function takeOne(item){const i=state.inventory.indexOf(item);if(i>=0)state.inventory.splice(i,1);}
  function endLateFavour(m){const late=favourExpire(state,m);if(late){recordMoment(state,m,late.moment);save();}}
  /** Joins rendered lines into one, keeping each one's beats where they were written. */
  function joinLines(parts){
    let text='';const pauses={};let face=null;
    for(const part of parts.filter(Boolean)){
      const r=typeof part==='string'?{text:part,pauses:{},faces:[]}:part;
      if(text)text+='\n\n';
      for(const [i,n] of Object.entries(r.pauses||{}))pauses[text.length+Number(i)]=(pauses[text.length+Number(i)]||0)+n;
      face??=r.faces?.[0]?.face||null;text+=r.text;
    }
    return {text,pauses,face};
  }
  /**
   * What a favour adds to talking with `name`: the ask takes the conversation over (it
   * returns {handled:true}); otherwise a line to say first (the asker's check-in, thanks,
   * or the late line) and the hand-over button while the thing is in the bag.
   */
  function favourTalk(name){
    const m=getMinutes();endLateFavour(m);
    let e=state.errand;const waiting=favourWaiting(state,name,m);
    if(waiting||(e?.status==='offered'&&e.from===name)){
      // A favour that ended late and was never given back: its thing goes back with it now.
      if(waiting&&e?.status==='late'&&!e.lateSaid)takeOne(e.item);
      if(waiting)e=askFavour(state,waiting,{minutes:m,temper:temperOf(name)});save();
      const f=favourById(e.favour),ask=joinLines([openingGreeting(name),favourLine(f,e,'ask',{speaker:name,playerName:playerName()})]);
      const reply=yes=>{const r=replyFavour(state,yes);if(!r)return;if(yes&&f.kind==='deliver')addItem(f.item);recordMoment(state,getMinutes(),r.moment);save();
        const l=favourLine(f,e,r.step,{speaker:name,temper:temperOf(name),playerName:playerName()});show(talkTitle(name),l.text,[['See you soon',close]],cue(l));showHearts(name);};
      show(talkTitle(name),ask.text,[['Of course',()=>reply(true),false,'Of course. Leave it to me.'],['Not today',()=>reply(false),false,'Sorry, not today.']],{pauses:ask.pauses,face:ask.face});showHearts(name);
      return {handled:true};
    }
    if(!e)return {};
    const f=favourById(e.favour);let line=null;const buttons=[];
    const speak=(r,speaker)=>{const l=favourLine(f,e,r.step,{speaker,temper:temperOf(speaker),playerName:playerName()});show(talkTitle(speaker),l.text,[['See you soon',close]],cue(l));showHearts(speaker);};
    // The favour is done (a delivery handed over, or a return brought back): the town remembers it, the friendships
    // grow, and the asker writes the next morning.
    const finish=r=>{if(['done','handOver'].includes(r.step))rememberEncounter(state,f.from,f.to,{kind:'help',minutes:getMinutes(),place:'favour'});takeOne(f.item);recordMoment(state,getMinutes(),r.moment);for(const [who,points] of Object.entries(f.friendship))helped(state,who,points);
      sendLetter(state,{id:'helped:'+f.id,day:Math.floor(getMinutes()/1440)+1,occasion:'helped',from:f.from,body:f.thanks||null});};
    if(name===e.from){const r=favourVisit(state,name,{minutes:m});if(r){if(r.step==='late')takeOne(r.item);if(r.moment)finish(r);line=favourLine(f,e,r.step,{speaker:name,temper:temperOf(name),playerName:playerName(),minutes:m});save();}}
    const thing=f.item[0].toLowerCase()+f.item.slice(1);
    if(e.status==='accepted'&&e.kind==='deliver'&&e.carrying&&name!==e.from)buttons.push([`Hand over the ${thing}`,()=>{
      const r=favourVisit(state,name,{minutes:getMinutes()});if(!r)return;
      if(r.step==='handOver')finish(r);
      save();speak(r,name);
    },false,'I have something for you.']);
    if(e.status==='accepted'&&e.kind==='return'&&!e.carrying&&name===e.to)buttons.push([`Ask for the ${thing}`,()=>{
      const r=favourVisit(state,name,{minutes:getMinutes(),bagFull:state.inventory.length>=100});if(!r)return;
      if(r.step==='handBack')addItem(f.item);
      save();speak(r,name);
    },false,`${f.from} sent me for the ${thing}.`]);
    return {line,buttons};
  }
  /** What can be given as a present: never the thing a favour has him carrying. */
  function giftsNow(){const e=state.errand,f=e?.carrying&&favourById(e.favour);return giftableItems(state.inventory).filter(i=>!f||i!==f.item);}
  /** Whether someone has a favour to ask: the "!" card's other reason. */
  const favourCard=name=>!!favourWaiting(state,name,getMinutes())||(state.errand?.status==='offered'&&state.errand.from===name);
  /** The box inside the mayor's door: the letters, newest first. */
  function post(){
    const box=ensurePost(state).box,unread=unreadCount(box);
    if(!box.length){show('The post','The box inside the door is empty. Postman Tōma comes round at half past ten.',[['Close',close]]);return;}
    show('The post',unread?`${unread} new letter${unread===1?'':'s'} in the box inside the door.`:'Nothing new. The letters you have read are kept here.',[
      ...[...box].reverse().map(l=>[letterLabel(l),()=>readLetter(l.id)]),['Close',close]]);
  }
  /** One letter, on the paper its sender chose. A present inside goes into the bag, once. */
  function readLetter(id){
    const opened=openLetter(ensurePost(state).box,id);if(!opened){post();return;}
    const {letter,present}=opened;
    if(present){addItem(present);note(`A letter from ${letter.from}, with ${withArticle(present.toLowerCase())} inside.`);}
    save();
    show('Letter from '+letter.from,letterText(letter)+(letter.gift?`\n\nEnclosed: ${letter.gift}.${present?' It is in your bag now.':''}`:''),[['Back to the post',post],['Close',close]]);
    const paper=STATIONERY[letter.stationery];
    modal.classList.add('letter-view');
    modal.style.setProperty('--letter-paper',`url("data:image/svg+xml,${encodeURIComponent(stationerySvg(letter.stationery,360,480))}")`);
    modal.style.setProperty('--letter-ink',paper.ink);
  }
  // The bag: what you are carrying, as a tray of icons. Tap one to use it or look at it.
  const bagBrowse={category:'all',query:'',scroll:0,item:null};
  function bag(){
    const models=new Set(printedModels(state.inventory).map(m=>m.name));
    show('Bag',`${state.inventory.length} thing${state.inventory.length===1?'':'s'} · ${purse()}`,[['Field book',inventory],['Close',close]]);
    modal.classList.add('bag-view');
    const controls=document.createElement('div');controls.className='bag-controls';
    const filter=document.createElement('select');filter.setAttribute('aria-label','Bag category');
    const all=bagEntries(state.inventory),available=new Set(all.map(e=>e.category));
    for(const category of BAG_CATEGORIES.filter(c=>c.id==='all'||available.has(c.id)||c.id===bagBrowse.category)){
      const option=document.createElement('option');option.value=category.id;const n=all.filter(e=>category.id==='all'||e.category===category.id).reduce((n,e)=>n+e.count,0);option.textContent=category.label+' · '+n;filter.append(option);
    }
    filter.value=bagBrowse.category;
    const search=document.createElement('input');search.type='search';search.placeholder='Find something in your bag';search.setAttribute('aria-label','Search your bag');search.value=bagBrowse.query;
    const status=document.createElement('p');status.className='bag-status';status.setAttribute('role','status');
    const grid=document.createElement('div');grid.className='bag-grid';
    function fill(){
      grid.replaceChildren();const entries=bagEntries(state.inventory,bagBrowse);
      status.textContent=!state.inventory.length?'Your bag is empty.':entries.length?`${entries.length} different item${entries.length===1?'':'s'}`:'No items match. Choose All or clear the search.';
      for(const {item,count:n} of entries){
        const tile=document.createElement('button');tile.type='button';tile.className='bag-tile';tile.dataset.item=item;
        const art=foodArtForItem(item);if(art){const image=document.createElement('img');image.src=art;image.alt='';image.width=70;image.height=70;image.style.objectFit='contain';tile.append(image);}else tile.innerHTML=svg(itemIcon(item,{printed:models.has(item)}),{size:34});
        const label=document.createElement('span');label.className='bag-name';label.textContent=item;tile.append(label);
        if(n>1){const count=document.createElement('b');count.className='bag-n';count.textContent='×'+n;tile.append(count);}
        tile.setAttribute('aria-label',n>1?`${item}, ${n}`:item);
        tile.onclick=()=>{bagBrowse.scroll=body.scrollTop||0;bagBrowse.item=item;bagItem(item);};grid.append(tile);
      }
    }
    filter.onchange=()=>{bagBrowse.category=filter.value;bagBrowse.scroll=0;bagBrowse.item=null;fill();};
    search.oninput=()=>{bagBrowse.query=search.value;bagBrowse.scroll=0;bagBrowse.item=null;fill();};
    controls.append(filter,search);body.append(controls,status,grid);fill();
    body.scrollTop=bagBrowse.scroll;
    if(bagBrowse.item){const selected=[...grid.children].find(b=>b.dataset.item===bagBrowse.item);selected?.focus?.({preventScroll:true});}
  }
  // The home directory has more people than the established personality records.
  // Use the same capability check for its buttons, this list and the record itself.
  const recordProfile=name=>RESIDENTS.find(p=>p.name===name)||PROFILES.find(p=>p.name===name);
  const canResidentRecord=name=>!!recordProfile(name);
  let recordNames=RESIDENTS.map(p=>p.name);
  function residentRecords(names=recordNames){
    recordNames=[...new Set(names)].filter(canResidentRecord);
    show('Residents','Read their personalities, interests and connections in this save.',[['Back to the Town Book',()=>{close();document.querySelector('#directoryButton')?.click();}],['Close',close]]);
    const list=document.createElement('div');list.className='resident-list';
    for(const name of recordNames){const button=document.createElement('button');button.type='button';button.textContent=name;button.onclick=()=>residentRecord(name);list.append(button);}body.append(list);
  }
  function residentRecord(name,compareName=''){
    const profile=recordProfile(name);if(!profile)return;
    const recipe=recipeFor(name),type=personalityOf(recipe.profile),taste=residentPersonality(name);
    show('Resident record · '+name,type.name+' · '+type.line,[['Back to residents',()=>residentRecords()],['Close',close]]);
    modal.classList.add('resident-record');
    const section=(title,text)=>{const h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=text;body.append(h,p);};
    section('About '+name,profile.role.charAt(0).toUpperCase()+profile.role.slice(1)+'. '+type.strength);
    section('Personality dials',DIALS.map(d=>d.label+': '+dialStep(recipe.profile[d.key])+'/8 ('+(dialStep(recipe.profile[d.key])>4?d.high:d.low)+')').join(' · '));
    section('Interests',taste.interests.map(interestWord).join(', '));
    section('Established connection',profile.friend?'Their story names '+profile.friend+' as a friend.':'Their established story remains unchanged.');
    const connections=connectionsFor(state,name);
    section('Encounters in this save',connections.length?connections.map(c=>c.name+': '+connectionSummary(c.record)).join('\n'):'No completed encounters recorded yet.');
    const label=document.createElement('label'),select=document.createElement('select');label.className='resident-compare';label.textContent='Compare with ';select.setAttribute('aria-label','Compare resident');
    const blank=document.createElement('option');blank.value='';blank.textContent='Choose a resident';select.append(blank);
    for(const other of PROFILES.filter(p=>p.name!==name)){const option=document.createElement('option');option.value=other.name;option.textContent=other.name;select.append(option);}
    select.value=compareName;select.onchange=()=>residentRecord(name,select.value);label.append(select);body.append(label);
    if(compareName&&PROFILES.some(p=>p.name===compareName)&&compareName!==name){
      const other=residentPersonality(compareName),shared=taste.interests.filter(i=>other.interests.includes(i)),r=relationshipBetween(state,name,compareName);
      section('Temperaments',name+': '+type.name+'. '+compareName+': '+personalityOf(recipeFor(compareName).profile).name+'.');
      section('Common ground',shared.length?shared.map(interestWord).join(', '):'Different interests can still make a good friendship.');
      section('Shared history',r?connectionSummary(r):'No completed encounters recorded for this pair.');
    }
    body.append(personalityReference());
  }
  const interestWord=i=>({read:'Reading',inspect:'Exploring',seat:'Taking a quiet break',shop:'Shopping',arcade:'Arcade games',machine:'Machines',radio:'Radio',office:'Harbour work',fish:'Fishing',phone:'Keeping in touch',post:'Letters',drink:'A drink with friends'}[i]||i);
  function harbourNoticeBoard(){
    show('Harbour notice board','Johansson woodland · a three-dimensional portrait of the island.',[
      ['Look',woodlandViewer],['Read Thuan’s flyer',()=>sakuraFlyer('Harbour notice board')],['Close',close]
    ]);
    modal.classList.add('flyer-view');
    const image=document.createElement('img');image.src=WOODLAND_POSTER.image;image.alt=WOODLAND_POSTER.description;
    image.width=2048;image.height=1365;image.style.cssText='display:block;width:100%;height:auto;max-width:720px;margin:8px auto';body.append(image);
  }
  function disposeWoodlandViewer(){
    const view=woodlandView;if(!view)return;woodlandView=null;
    window.removeEventListener('message',view.message);view.disposeHistory?.();
    view.frame.remove();modal.classList.remove('woodland-view');
  }
  function woodlandViewer(){
    show(WOODLAND_POSTER.title,'',[]);
    const token=globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
    const url=new URL(WOODLAND_POSTER.viewer,document.baseURI||location.href),origin=location.origin??new URL(location.href).origin;
    url.searchParams.set('embedded','1');url.searchParams.set('token',token);
    const frame=document.createElement('iframe');frame.title='Johansson woodland · interactive diorama';frame.src=url.href;
    frame.setAttribute('aria-busy','true');frame.setAttribute('allow','fullscreen');frame.className='woodland-viewer';
    const view={frame,token,disposeHistory:null,message:null};
    view.message=event=>{
      if(woodlandView!==view||event.source!==frame.contentWindow||event.origin!==origin||event.data?.token!==token)return;
      if(event.data.type==='johansson-diorama-close')close();
      else if(event.data.type==='johansson-diorama-ready')frame.setAttribute('aria-busy','false');
    };
    woodlandView=view;window.addEventListener('message',view.message);
    view.disposeHistory=createReaderHistory(()=>{if(woodlandView===view)close();},{key:'johanssonDiorama',token});
    modal.classList.add('woodland-view');body.replaceChildren(frame);
  }
  function sakuraFlyer(location='Bag'){
    fileDocument(state,FLYER_PAPER,getMinutes());save();
    const owned=state.inventory.includes(FLYER_ITEM);
    show('Sakura Shop · neighbourhood flyer',owned?'Your copy, picked up in town.':'A bright paper flyer from Thuan’s shop. You can take a free copy.',[
      ...(!owned?[['Take a free copy',()=>{if(collectSakuraFlyer(state)){note('Picked up Thuan’s Sakura shop flyer. A copy is filed at Community Hall.');sakuraFlyer(location);}else say('Your bag is full. Make some room for a flyer.');}]]:[]),
      ...(location==='Harbour notice board'?[['About the board',()=>read('Harbour notice board','Minato’s noticeboard: a green aluminium case under a small rain hood, its two acrylic doors kept locked. Behind them, Thuan’s Sakura flyer and the woodland print. The rest of the cork is waiting for the next notice.')]]:[]),
      ...(location==='Bag'?[['Back to the bag',bag]]:[]),['Put it away',close]
    ]);
    modal.classList.add('flyer-view');
    const image=document.createElement('img');image.src=FLYER_PATH;image.alt=FLYER_PAPER.text;image.width=900;image.height=1280;image.style.cssText='display:block;width:100%;height:auto;max-width:620px;margin:12px auto;box-shadow:0 4px 18px #0003';body.append(image);
    const look=document.createElement('button');look.type='button';look.textContent='Look closer · zoom and download';look.onclick=()=>printView('Sakura shop flyer',[{image:FLYER_PATH,title:'Sakura shop flyer',filename:'sakura-shop-flyer'}],0,()=>sakuraFlyer(location));body.append(look);
  }
  function bagItem(item){
    if(item===MINATO_RECIPE_CARD){show(MINATO_RECIPE_CARD,MINATO_MEMORY_STORY,[['Back to the bag',bag],['Close',close]]);return;}
    if(item===FLYER_ITEM){sakuraFlyer();return;}
    const model=printedModels(state.inventory).find(m=>m.name===item);
    const special=SPECIAL_BY_NAME[item],hotSnack=HOT_SNACKS.find(snack=>snack.name===item);
    const drinkable=(DRINKABLE.has(item)||special?.kind==='drink')&&state.inventory.includes(item);
    const edible=(special?.kind==='food'||!!hotSnack)&&state.inventory.includes(item);
    const spec=GROCERY_ITEMS.find(g=>g.name===item),find=TOWN_FINDS.find(f=>f.name===item);
    const text=model?'A model you printed on the Form 3. Thuan would put it by the till.'
      :item===EMPTY_CAN?`Empty. The recycling box by Sakura’s door takes cans: Thuan gives ¥${CAN_REFUND} a can.`
      :special?`${special.note}. From the board at Sakura.`
      :hotSnack?hotSnack.line
      :spec?spec.text:find?`Worth ¥${find.price} back at Sakura’s till.`
      :pierFishOfItem(item)?pierFishLine(pierFishOfItem(item))
      :'Something you picked up in town.';
    show(item,text,[...(drinkable?[['Drink it',()=>{close();onDrink(item);}]]:[]),...(edible?[['Eat it',()=>{close();onSnack(item);}]]:[]),...(model?[['Look at it',()=>previewPrint(model)]]:[]),['Back to the bag',bag],['Close',close]]);
    modal.classList.add('bag-view');
    const hero=document.createElement('div');hero.className='bag-hero';hero.innerHTML=svg(itemIcon(item,{printed:!!model}),{size:56});if(foodArtForItem(item)){hero.innerHTML='';const image=document.createElement('img');image.src=foodArtForItem(item);image.alt=item;image.width=160;image.height=160;image.style.objectFit='contain';hero.append(image);}body.prepend(hero);
  }
  const withEnglish=f=>(/^[aeiou]/i.test(f.english)?'an ':'a ')+f.english;
  const pierFishLine=f=>`${withEnglish(f).replace(/^a/,'A')}, fresh from the pier. Eaten here: ${f.eaten}. The harbour master pays ¥${f.pierPrice}; Tama would take it for nothing.`;
  function addItem(item){if(STORE_ITEMS.some(p=>p.name===item)||DRINKABLE.has(item)||SPECIAL_BY_NAME[item]||['Ice',EMPTY_CAN].includes(item)||pierFishOfItem(item)||!state.inventory.includes(item))state.inventory.push(item);save();}
  /**
   * The recycling box by Sakura's door. Every empty can in your pockets goes in, and
   * whoever is at the till (sakura-rota.js) pays a small refund out of the shop's own till (the aluminium is sold on).
   */
  function recycleCans(){
    const n=state.inventory.filter(i=>i===EMPTY_CAN).length,clerk=sakuraClerkAt(getMinutes());
    if(!n){receipt('Recycling box','A blue box with a round hole in the lid, for empty cans. '+clerk+' gives ¥'+CAN_REFUND+' a can, from the till.');return;}
    state.inventory=state.inventory.filter(i=>i!==EMPTY_CAN);
    // From the till when it has it; a few coins from her own purse when it does not.
    const shop=state.sakura,pay=n*CAN_REFUND;if(shop)shop.cash=Math.max(0,shop.cash-pay);state.yen+=pay;
    onTime(1);onMove('Give');townAudio.play('clunk',.5);save();
    receipt('Recycling box',`${n} empty can${n>1?'s':''} rattle${n>1?'':'s'} into the box.`+` ${clerk} counts ¥${pay} into your hand.`);
  }
  /** The specials board behind the counter: order from Thuan while the hot case is on. */
  function specialsMenu(){
    if(!specialsOpen(getMinutes())){receipt('Specials board','The hot case is off. The specials are served from 09:00 to 20:00.');return;}
    show('Today’s specials','Chalked up behind the counter. Thuan wraps it or pours it while you wait.',[
      ...SAKURA_SPECIALS.map(sp=>[`${sp.name} · ¥${sp.price}`,()=>{if(!spend(sp.price))return;addItem(sp.name);recordSakuraSale(state,sp.price,null,{minute:getMinutes(),item:sp.name,buyer:'Johansson'});onTime(2);save();townAudio.play('click',.35);
        receipt('Thuan',sp.kind==='food'?`One ${sp.name.toLowerCase()}, wrapped in paper. It is in your bag. Eat it while it is warm.`:`One ${sp.name.toLowerCase()}, with a straw. It is in your bag.`);}]),
      ['Maybe later',close]]);
  }
  function spend(n,label=null){if(state.yen<n){say('You do not have enough yen.');return false;}state.yen-=n;const now=getMinutes(),place=getSocialContext().inside||'Town Services',transaction='PLAYER-'+state.documentArchive.sequence+'-'+now;const receipt=fileDocument(state,{type:'Receipt',title:label||heading.textContent||'Town service payment',organisation:({'market':'Sakura Shop','frontrow':'Front-Row Books','ramen':'Sato Ramen','izakaya':'Minato Izakaya','onsen':'Minato Onsen'})[place]||place,transaction,amount:n,text:'CASH RECEIPT\nService: '+(label||heading.textContent||'Town service')+'\nPaid: ¥'+n+'\nPayer: visitor\nWallet balance: ¥'+state.yen},now);if(receipt)fileDocument(state,{type:'Ledger entry',title:'Visitor payment posting',organisation:receipt.organisation,transaction,amount:n,links:[receipt.id],text:receipt.text},now);save();return true;}
  /**
   * Dinner with Thuan in Naha (interiors/city-restaurant.js): the scene is fixed and this
   * menu is how the evening goes. `dinner` is the scene's handle: serve, eat, toast, talk,
   * and `leave`, which game.js sets to take the last boat home.
   */
  function cityDinner(title,dinner,lead=''){
    if(!dinner)return;
    const again=text=>cityDinner(title,dinner,text),buttons=[];
    for(const item of DINNER_MENU){
      if(item.dish?dinner.state.dish:dinner.state.drink)continue;
      buttons.push([item.label+' · ¥'+item.price.toLocaleString('en'),()=>{
        const paid=state.yen>=item.price;if(paid){state.yen-=item.price;save();}
        dinner.serve(item);onTime(item.dish?20:5);note('Dinner with Thuan at Hoshizora, Naha.');
        again(item.text+(paid?'':' Thuan has the bill before you can reach for it. “The shop had a good week. You get the next one.”'));}]);
    }
    if(dinner.state.dish)buttons.push(['Eat',()=>{dinner.eat();onTime(10);again(dinner.state.dish?'You eat, and talk with your mouth full, and Thuan pretends not to notice.':'Clean plates. The waiter takes them away with a small bow and asks if there will be coffee.');}]);
    if(dinner.state.drink)buttons.push(["Raise a glass · Cheers",()=>{dinner.toast();onTime(2);again(["“Cheers!” The glasses ring. “To the island,” you say. “To the shop,” she says, “and its rent.”",'“Kanpai.” She clinks a little too hard and looks pleased about it.','A third toast, to the ferry for waiting. It has not promised to wait. Thuan says it will if the mayor is on it.'][(dinner.state.toasts-1)%3]);}]);
    buttons.push(['Talk with Thuan',()=>{const line=dinner.talk();onTime(10);again(line);}]);
    buttons.push(['Take the last boat home',()=>{close();onTime(CITY_RESTAURANT.crossing);dinner.leave?.();}]);
    buttons.push(['Sit a while',close]);
    show(title,lead||'A table for two by the window on the top floor, Naha laid out below: the hotel towers, the neon of Kokusai-dōri, the ferry lights at Tomari. Thuan has her good cardigan on. The waiter brings the menus.',buttons);
  }
  function receipt(title,text){show(title,text,[['Back',close]]);}
  function inventory(){
    const quest=['Speak to Nhung beside the bookshop.','Find Tama, Nhung’s cat, near the ramen stall. A fish might help.','Return to Nhung with news of Tama.','Tama is safely home. Nhung has paid you ¥500.'][state.quest];
    show('Field book',`${state.notes.join('\n')}\n\n${quest}\n\n${travelStatusText(state)}\n\nCash: ${purse()} · Fish caught: ${state.fish}\nBag: ${state.inventory.length?state.inventory.join(', '):'Empty'}\nPlaces visited: ${state.visited.length}\nMachines tried: ${state.operated.length}\nStar Port best: ${state.best}`,[...['Canned coffee','Green tea'].filter(i=>state.inventory.includes(i)).map(i=>['Drink '+i,()=>{close();onDrink(i);}]),...printedModels(state.inventory).map(model=>['Inspect '+model.name,()=>previewPrint(model)]),['Diary',()=>diary()],['Pocket album',pocketAlbum],['Konbini passport',konbiniPassport],['Back to town',close]]);
    const map=onMap();if(map)body.append(map);
  }


  // What the shop remembers of you: the card under the till, what you have tried, and
  // the last thing she rang through.
  function konbiniPassport(){
    const {visits,cards,stamps,tried,lastReceipt}=state.konbini;
    const stock=GROCERY_ITEMS.filter(item=>state.sakura.stock[item.id]);
    const names=tried.map(id=>GROCERY_ITEMS.find(item=>item.id===id)?.name).filter(Boolean).sort();
    const card="Stamp card  "+'●'.repeat(stamps)+'○'.repeat(Math.max(0,CARD_STAMPS-stamps))+`  ${stamps}/${CARD_STAMPS}`;
    const body=[
      `Visits: ${visits}`,
      `Cards filled: ${cards}`,
      card,
      '',
      `Tried ${names.length} of ${stock.length} things she stocks.`,
      names.length?names.join(', '):'Nothing yet. The cooler is at the back.'
    ].join('\n');
    show("Convenience store notebook · Konbini passport",body,
      [...(lastReceipt?[['Last receipt',()=>show("Receipt · Receipt",receiptText(lastReceipt),[['Back',konbiniPassport]])]]:[]),
       ['Back to the field book',inventory]]);
  }

  /**
   * The pocket camera's album (src/photo/pocket-album.js): a photo kept goes into the save as its shades, and into the
   * town's memory as a moment (the diary's words, and the Evening News's for a first photo of someone).
   */
  function keepPhoto(photo){
    const before=state.pocketAlbum||[],seen=state.pocketSeen||[],r=addPhoto(before,{...photo,id:nextPhotoId(before,state.pocketTaken|0)});
    if(!r.ok)return {ok:false,text:r.problems[0]};
    state.pocketAlbum=r.album;state.pocketTaken=+r.photo.id.slice(2);
    recordMoment(state,getMinutes(),photoMoment(r.photo,{seen}));
    state.pocketSeen=[...seen,...r.photo.people.filter(n=>!seen.includes(n))].slice(-300);
    // Said as it is: a save that could not be written keeps the photo only until the game is closed.
    return save()?{ok:true,photo:r.photo,text:'Kept: '+photoCaption(r.photo)+'.'}:{ok:true,photo:r.photo,text:'In the album, but the save could not be written: this photo is lost when the game closes.'};
  }
  function letGoPhoto(id){const before=state.pocketAlbum||[];state.pocketAlbum=removePhoto(before,id);if(state.pocketAlbum.length!==before.length)save();return state.pocketAlbum.length!==before.length;}
  function pocketAlbum(){
    const album=state.pocketAlbum||[];
    show('Pocket album',albumLead(album),[['Field book',inventory],['Back to town',close]]);
    modal.classList.add('pocket-album-view');
    body.append(albumView(album,{onLetGo:id=>{letGoPhoto(id);pocketAlbum();}}));
  }
  function note(text,{who}={}){
    // Everything noted is offered to today's diary page too, weighed by what it was, with whom it was.
    recordMoment(state,getMinutes(),{text,kind:/^Gave /.test(text)?'gift':/^Bought .+ a drink/.test(text)?'friend':'note',...(who?{who:[who]}:{})});
    if(!state.notes.includes(text)){state.notes.push(text);state.notes=state.notes.slice(-100);save();}
  }
  // The diary (progression/diary.js): today's page first, then back through the days.
  function diary(index=0){
    const days=diaryDays(state,getMinutes()),day=days[Math.min(index,days.length-1)];
    const page=diaryPage(state,day*1440+720);save();
    show('Diary',page,[...(index+1<days.length?[['An earlier page',()=>diary(index+1)]]:[]),...(index>0?[['A later page',()=>diary(index-1)]]:[]),['Back to the field book',inventory]]);
  }
  const ramenTickets=createRamenTicketMachine({state,show,close,spend,save,receipt,getMinutes});
  const izakayaPlay=createIzakayaPlay({state,show,close,spend,save,receipt,getMinutes,say,note,onKaraoke});
  function inspectItem(item){if(!state.inspectedIds.includes(item.id)){state.inspectedIds.push(item.id);note(item.note);save();}}
  function openURL(){say('The ledger is kept here in town.');}

  function quietRead(){if(!state.inspectedIds.includes('book')){receipt('Window chair','Lift The Venture from the display first. Nhung has kept your place.');return;}let left=20;show('Quiet reading','Rain on the shutters. The street can wait.',[['Put down the book',close]]);timer=setInterval(()=>{left--;body.firstChild.textContent='A page, a breath, the harbour. '+left+' seconds.';if(left<=0){onTime(10);note('Read by the window. Ten town minutes passed.');receipt('Window chair','The bookmark is a ferry ticket. Returned it to the same page.');}},1000);}
  const histories=new Map();
  // Runs a ported gd_dialog script through the existing conversation modal: one speaker
  // line, its choices as buttons, and the node's own actions writing the story flags.
  function runDialogue(script,startId,title){
    const dialogue=createTownDialogue({script,state,note,getMinutes,
      getPlace:()=>getSocialContext().inside||'street',getRain:()=>state.weather===true});
    const render=frame=>{
      if(frame.done){save();close();return;}
      const buttons=frame.choices.length
        ? frame.choices.map(choice=>[choice.text,()=>render(dialogue.choose(choice.index))])
        : [[frame.endsHere?'See you soon, Thuan':'Go on',()=>render(dialogue.advance())]];
      // Each of her lines carries a mood (happy, sad, angry, shy...), and her face follows.
      // Her beats (`|`, {p}) hold the typing where they are written; a {face:…} cue in the line
      // sets her face when the node gives no mood of its own.
      show(title||frame.speaker||'',frame.text,buttons,{mood:frame.speaker==='Thuan'?(frame.mood||frame.faces?.[0]?.face||null):null,pauses:frame.pauses});
    };
    render(dialogue.start(startId));
    return dialogue;
  }

  // Thuan's story thread. The shop counter menu below stays as it is; this is the part
  // that remembers, so it is the part the flags and conditions drive.
  // Her unscripted side. Built on first use and never before: see thuan-chat.js for why
  // the download is opt-in. The written conversation below stays the default.
  let thuanChat=null;
  function askThuan(){
    if(!thuanChat){
      const mind=sharedMind();
      const voice=createThuanVoice({face:{setSpeaking(value){
        window.__JOHANSSON_CHARACTER_CONTROL__?.setSpeaking?.('Thuan',value);
      }}});
      thuanChat=createThuanChat({show,close,body,mind,voice,
        onReply:reply=>window.__JOHANSSON_CHARACTER_CONTROL__?.setExpression?.('Thuan',reply.expression,reply.gesture),
        getContext:()=>{
          const m=((getMinutes()%1440)+1440)%1440;
          return 'It is '+String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')+
            (m>=540&&m<1200?' and the shop is open.':' and the shop is shut.');
        }});
    }
    thuanChat.open();
  }

  function thuanStory(){
    if(!modalOpen)window.__JOHANSSON_CHARACTER_CONTROL__?.gesture('Thuan');
    countTalk(state.story,getMinutes());
    const variables=dialogueVariables({story:state.story,minutes:getMinutes(),
      place:getSocialContext().inside||'street',rain:state.weather===true});
    return runDialogue(SAKURA_SCRIPT,sakuraEntry(variables),'Thuan · Sakura Shōten');
  }

  function thuanConversation(topic=null){
    if(!modalOpen)window.__JOHANSSON_CHARACTER_CONTROL__?.gesture('Thuan');
    const ramenVisit=getSocialContext().inside==='ramen',offDuty=getSocialContext().inside==='izakaya',onsenBath=getSocialContext().inside==='onsen';
    if(ramenVisit)note('Shared a ramen-shop break with Thuan after closing.');
    if(offDuty)note('Caught up with Thuan after closing at Minato Izakaya.');
    const met=state.notes.includes('Met Thuan, the heart of Sakura Konbini.');
    if(!met)note('Met Thuan, the heart of Sakura Konbini.');
    const replies={
      snack:"Recommended? Leave it to me!\nMy recommendation? Tea and a biscuit. The tea makes it a sensible decision. The biscuit makes it a good one.",
      ribbon:"Hair? Thank you!\nMy hair? Thank you! I let it grow long and tie it back when I restock. On a hot day I braid it — my big sister Nhung says my plaits are crooked.",
      town:"I like the harbour at dusk.\nSakura closes at eight. Some evenings I stop by Minato after twenty past, until half past nine; other evenings I walk home by the harbour. Thao’s izakaya is beside Main Street — follow the red lanterns. She always keeps a chair for a good story.",
      home:residentHomeDescription('Thuan')||commuterDescription('Thuan'),
      compliment:"You’re making me blush.\nOh, now you have made me shy. I was trying to look very professional behind this counter. Thank you. That was lovely.",
      challenge:"Let's compete!\nA challenge! Find the strangest postcard on the rack. I will defend the seagull one. He looks as though he owns the harbour.",
      radio:"It's a secret.\nIf the radio plays my favourite song, this becomes a very small concert hall. The assistant manager is a plant, so the reviews are generous.",
      secret:"It's just a story here.\nA little shop secret: I name the plants. The stubborn one by the door is the assistant manager. Terrible at counting change.",
    };
    if(offDuty){
      replies.snack='Thao saved me some edamame and barley tea. Choosing a snack is much easier when I am not the person stocking the shelves.';
      replies.compliment='Thank you. It is lovely being here with everyone, just as Thuan. No till to count tonight.';
      replies.challenge='A little challenge: ask Thao which neighbour tells the tallest stories. I have my suspicions.';
      replies.radio='When this song comes on at Sakura I sing along. Here I let Thao join in. She knows all the wrong words with enormous confidence.';
    }
    if(ramenVisit){
      replies.snack='Tonight, a hot bowl of shoyu ramen. I have spent all day recommending snacks to everyone else.';
      replies.compliment='Thank you. It is nice to be a customer for a change. Someone else can count the till.';
      replies.challenge='Try naming every topping before the steam fogs your glasses. I always forget one.';
      replies.radio='I leave the singing to the shop radio tonight. Here I am listening to the kitchen.';
    }
    const greeting=onsenBath?"Haa… It feels good.\nYou came! Sit, sit — the water is perfect tonight. Listen: you can hear the sea on the other side of the fence. This is the best part of my whole day.":ramenVisit?"Good work today!\nSakura is locked up for the evening. I stopped for a bowl of ramen before heading on. There is a stool at the counter if you would like to join me.":offDuty?"Good to see you!\nYou found me! Sakura is all locked up. Thao saved me some supper. Come keep me company — I want to hear about your day.":met?"Welcome back!\nYou are back! Welcome to Sakura. Looking for a snack, or shall we make the afternoon a little less ordinary?":"Welcome! I’m Thuan.\nWelcome! I am Thuan. I keep Sakura stocked, the plants alive, and the radio just loud enough to sing along. What brings you in?";
    // Her birthday, and his: she says it first (people/birthdays.js).
    const birthday=birthdayOn('Thuan',getMinutes())?"It’s my birthday!\nYou remembered! Or one of my sisters told you. Either way, you came, and that is the best present."
      :birthdayOn('Johansson',getMinutes())?"Happy birthday, Johansson!\nDid you think I would forget? The whole island knows by now. I may have told them.":null;
    const title=onsenBath?'Thuan · Umi-no-yu':ramenVisit?'Thuan · Ramen break':offDuty?'Thuan · After hours':'Thuan · Heart of Sakura';
    const openHotCase=topic==='hot-case';if(openHotCase)topic=null;
    if(topic){show(title,replies[topic],[['Tell me something else',()=>thuanConversation()],['See you soon, Thuan',close]]);return;}
    // A conversation, not a menu. Two pieces of small talk at a time, rotated so the
    // next time you stop by she has something else to say, and the shop's paperwork
    // folded away behind one button. Fourteen choices at once made her a directory.
    const smallTalk=[
      ['What is your favourite snack?','snack'],
      ['I like your hair','ribbon'],
      ['Where do you go after work?','town'],
      ['Where do you live?','home'],
      ['You make this place lovely','compliment'],
      ['Give me a little challenge','challenge'],
      ['Do you sing along to the radio?','radio'],
      ['Tell me a shop secret','secret'],
    ];
    const asked=histories.get('Thuan/small-talk')||[];
    const fresh=smallTalk.filter(([,id])=>!asked.includes(id));
    const offered=(fresh.length>=2?fresh:smallTalk).slice(0,2);
    histories.set('Thuan/small-talk',[...asked,...offered.map(([,id])=>id)].slice(-5));
    // The counter: everything a konbini clerk does for you besides ringing up the basket.
    // Hot snacks from the case by the till, her pick of the shelves, the stamp card, and
    // the paperwork, which she fetches from the back office rather than keeping it out.
    const back=['Back to Thuan',()=>thuanConversation()];
    const onDutyHere=getSocialContext().inside==='market'&&!offDuty&&!ramenVisit&&!onsenBath;
    const hotCase=()=>show(title,"Would you like some hot snack?\nFresh from the hot case — what would you like?",[
      ...HOT_SNACKS.map(snack=>[`${snack.jp} ${snack.name} · ¥${snack.cost}`,()=>{
        const result=buyHotSnack(state,snack.id,getMinutes(),getSocialContext().thuanAvailable!==false);
        if(!result.ok){show(title,result.message,[back]);return;}
        save();note('Bought '+snack.name.toLowerCase()+' from Sakura’s hot case.');
        characterControl()?.feel?.('Thuan','happy',6);tone(880,.08);
        show(title,"Here you are!\n"+result.message+'\n\n'+snack.name+' is in your bag.',[['Another one',hotCase],back],{mood:'happy'});
      },state.yen<snack.cost,'Could I have '+snack.name.toLowerCase()+', please?']),
      back]);
    const recommend=()=>{
      const pick=thuanRecommends(state,Math.floor(getMinutes()/1440));
      if(!pick){show(title,'The shelves are nearly bare today. Come back after the delivery!',[back]);return;}
      show(title,`This is recommended!\nTry the ${pick.name.toLowerCase()} — ${pick.brand||'Sakura'}, ¥${pick.cost}. `+(EXAMINE_LINES[pick.id]||'I would buy it myself if I were not standing on this side of the counter.'),[
        [`Into the basket · ¥${pick.cost}`,()=>{
          const result=addToBasket(state,pick);save();
          show(title,result.ok?"Like!\n"+result.message:result.message,[back],{mood:result.ok?'happy':undefined});
        }],
        ['Maybe next time',()=>thuanConversation()]]);
    };
    const stampCard=()=>{
      const n=state.konbini.stamps,marks='●'.repeat(n)+'○'.repeat(Math.max(0,CARD_STAMPS-n));
      show(title,`Stamp card\n${marks}\n\n${n} of ${CARD_STAMPS} stamps. One for every ¥300 at the till — fill it and the next green tea is on the house.`+(state.konbini.cards?`\nCards filled so far: ${state.konbini.cards}.`:''),[back]);
    };
    const paperwork=()=>show(title,"Wait a minute.\nThe shop books live in the back office — I can fetch them.",[
      ['Sell items from my bag',workshopUI.selling],
      ['Read the shop ledger',shopLedger],
      ['Read the drink round’s book',()=>read('Sakura Trading · drink round',roundDeliveryBook(getMinutes()))],
      back,
    ]);
    const counter=()=>show(title,"Welcome!\nWhat can I do for you?",[
      ...(onDutyHere?[['Hot snacks from the case',hotCase],['What do you recommend?',recommend]]:[]),
      ['My stamp card',stampCard],
      ['The shop side of things',paperwork],
      back,
    ]);
    if(openHotCase){
      if(onDutyHere&&getSocialContext().thuanAvailable!==false)hotCase();
      else show('Sakura Shōten · Hot case',sakuraHoursOpen(getMinutes())?SAKURA_AWAY_MESSAGE:'The hot case is dark. Thuan switches it on at nine.',[['Close',close]]);
      return;
    }
    // Umi-no-yu: ask her along after work. She goes straight from locking up.
    const today=Math.floor(getMinutes()/1440),thuanProfile=PROFILES.find(p=>p.name==='Thuan');
    const onsenAsked=Number.isFinite(state.onsenDate)&&state.onsenDate>=today;
    const inviteOnsen=()=>{
     const day=onsenInvitationDay(thuanProfile,getMinutes(),false,state),tonight=day===today;
     state.onsenDate=day;save();
     show(title,(tonight?"A bath? Like!\nYes — tonight, straight after I lock up. ":"It's already late tonight… See you tomorrow!\nTonight it is too late for me, but tomorrow, straight after I lock up. ")+'I will be in the rock bath by the sea wall. Bring your swimsuit — they are strict about that at Umi-no-yu. Pay Higa-san at the bandai.',[['See you at the bath',close]]);
    };
    // A present from your bag. She is delighted; a second the same day makes her shy.
    const gifts=giftsNow();
    const giveGift=(page=0)=>show(title,"What, can you give me something?\nFor me? What have you brought?",[
      ...gifts.slice(page*8,(page+1)*8).map(item=>[item,()=>{
        if(!takeGift(state.inventory,item)){thuanConversation();return;}
        const story=state.story,day=Math.floor(getMinutes()/1440);
        if(story.gift_day!==day){story.gift_day=day;story.gifts_today=0;}
        const reaction=giftReaction(item,{giftsToday:story.gifts_today});
        story.gifts_today=Math.min(999,story.gifts_today+1);story.gifts_given=Math.min(999,story.gifts_given+1);
        note('Gave Thuan a present: '+item+'.',{who:'Thuan'});save();
        characterControl()?.feel?.('Thuan',reaction.mood,10);
        show(title,reaction.text,[['Back to Thuan',()=>thuanConversation()],['See you soon, Thuan',close]],{mood:reaction.mood});
      },false,'I brought you this — '+item.toLowerCase()+'.']),
      ...(page>0?[['Previous presents',()=>giveGift(page-1)]]:[]),
      ...((page+1)*8<gifts.length?[['More presents',()=>giveGift(page+1)]]:[]),
      ['Never mind',()=>thuanConversation()]]);
    show(title,birthday||greeting,[
      ...(basketTotal(state)?[[`Pay for ${basketLines(state).reduce((n,l)=>n+l.count,0)} item(s) · ¥${basketTotal(state)}`,konbiniCounter]]:[]),
      ['Talk with Thuan',thuanStory],
      ...(gifts.length?[['Give her a present',giveGift]]:[]),
      ...(onsenBath?[]:[[onsenAsked?'Umi-no-yu after work — still on':'Come to Umi-no-yu after work',onsenAsked?()=>show(title,state.onsenDate===today?'Of course! After I lock up. The rock bath, by the sea wall.':'Tomorrow, after I lock up. I have not forgotten.',[['Back to Thuan',()=>thuanConversation()]]):inviteOnsen]]),
      ...offered.map(([label,id])=>[label,()=>thuanConversation(id)]),
      ['Ask her something',askThuan],
      ['At the counter',counter],
      ['See you soon, Thuan',close],
    ]);
  }
  // The people of the new streets: a few things each to say, in turn, and the odd thing
  // to sell. See src/people/neighbours.js.
  const neighbourTurns=new Map();
  const NEIGHBOUR_SALES=Object.freeze({
   // The auction sells the morning's mozuku by the tray now that Yonamine Fresh Fish has closed (cast.js PLACES).
   'Kōji':[['I’ll take the tuna head',0,'Tuna head','He wraps it in two newspapers and a plastic bag, and it is still looking at you. “Soup,” he says. “Trust me.”'],
    ['A tray of mozuku · ¥200',200,'Mozuku','A tray of this morning’s mozuku from the auction, in vinegar, wrapped in newspaper. “Good for everything,” he says.']],
   'Mrs Kinjō':null,
  });
  /**
   * The first talk of the day with anyone opens with a greeting that notices the moment
   * (src/people/greetings.js): rain, the hour, or how long the mayor was away. Being away
   * counts on the day he came back, not for the rest of the session. Later talks that day
   * go straight to what they have to say. Returns the rendered greeting, or null.
   */
  function openingGreeting(name){
    const nowM=getMinutes(),dayNow=Math.floor(nowM/1440);returnDay??=dayNow;
    if((state.greeted||={})[name]===dayNow)return null;
    state.greeted[name]=dayNow;
    const names=Object.keys(state.greeted);if(names.length>60)delete state.greeted[names[0]];
    const recipe=recipeFor(name);
    return greetingFor({speaker:name,temper:temperamentOf(recipe?.profile||{}),playerName:playerName(),catchphrase:recipe?.profile?.catchphrase||'',day:dayNow,
     situation:{theirBirthday:birthdayOn(name,nowM),hisBirthday:birthdayOn('Johansson',nowM),daysAway:dayNow===returnDay?daysBetween(awaySince):0,weather:state.typhoon?'typhoon':state.weather?'rain':'sunny',hour:Math.floor(((nowM%1440)+1440)%1440/60)}});
  }
  /**
   * The web edition's talk (edition.js `conversations` off; the owner, 19 October 2026: "simple behaviour for the NPCs
   * on web … and not too much dialogue"): one short line for the moment, and whatever they sell or serve. The full
   * conversations, favours and the day's happenings are the Linux edition's.
   */
  function shortTalk(name,title,buttons=[]){
    const recipe=recipeFor(name),nowM=getMinutes();
    const line=shortGreeting({speaker:name,temper:temperamentOf(recipe?.profile||{}),playerName:playerName(),day:Math.floor(nowM/1440),
     situation:{weather:state.typhoon?'typhoon':state.weather?'rain':'sunny',hour:Math.floor(((nowM%1440)+1440)%1440/60)}});
    talked(state,name,nowM);save();
    show(title||name,line.text,[...buttons,['See you',close]],{face:line.face});
  }
  function neighbour(name){
    const spec=NEIGHBOUR_TALK[name];if(!spec){close();return;}
    if(!BUDGET.conversations){
      const sales=NEIGHBOUR_SALES[name],list=!sales?[]:Array.isArray(sales[0])?sales:[sales];
      shortTalk(name,name+' · '+spec.role,list.map(sale=>[sale[0],()=>{if(sale[1]&&!spend(sale[1]))return;onTime(2);addItem(sale[2]);tone(700,.12);show(name+' · '+spec.role,sale[3],[['Thank you',close]]);}]));return;
    }
    const turn=neighbourTurns.get(name)||0;neighbourTurns.set(name,turn+1);
    const favour=favourTalk(name);if(favour.handled)return;
    const greeting=openingGreeting(name);
    const said=joinLines([greeting,favour.line,spec.lines[turn%spec.lines.length]]),line=said.text,buttons=[...(favour.buttons||[])];
    const sales=NEIGHBOUR_SALES[name],list=!sales?[]:Array.isArray(sales[0])?sales:[sales];
    for(const sale of list)buttons.push([sale[0],()=>{if(sale[1]&&!spend(sale[1]))return;onTime(2);addItem(sale[2]);tone(700,.12);show(name+' · '+spec.role,sale[3],[['Thank you',close]]);}]);
    if(spec.lines.length>1)buttons.push(['Tell me more',()=>neighbour(name)]);
    buttons.push(['See you later',close]);
    show(name+' · '+spec.role,line,buttons,{pauses:said.pauses,face:said.face});
  }
  function resident(name){
    if(name==='Thuan'){
      // In the shop, only if she is actually there: before nine and on her breaks the
      // bell is answered by nobody, or by Grandmother Sakurai from upstairs.
      const social=getSocialContext();
      if(social.inside==='market'&&social.thuanAvailable===false){
        const m=((getMinutes()%1440)+1440)%1440,early=m<540;
        receipt('Sakura Shōten',early?'The bell rings on in the empty shop. From upstairs, Grandmother Sakurai: “Thuan opens at nine, dear. Come back with the ferry.”':'The bell rings on. Thuan is away from the counter for a minute; the radio keeps the shop company.');
        return;
      }
      if(!BUDGET.conversations){shortTalk('Thuan','Thuan');return;}
      thuanConversation();return;
    }
    if(!BUDGET.conversations){
      const buttons=[];
      if(name==='Thao'&&getSocialContext().inside!=='ramen')buttons.push(['What is cooking?',()=>izakayaMenu()]);
      if(name==='Mrs Sato')buttons.push(['Umeboshi rice ball · ¥80',()=>{if(spend(80)){state.sprintUntil=performance.now()+20000;note('Umeboshi rice ball. Ready to move.');close();}}]);
      if(name==='Cold-storage kid')buttons.push(['Ice · ¥20',()=>{if(spend(20)){addItem('Ice');receipt(name,'Keep it out of the sun.');}}]);
      shortTalk(name,name,buttons);return;
    }

    // A favour comes first (people/favours.js): the ask takes the conversation; the asker's
    // check-in or thanks takes the place of today's topic, which keeps for the next talk.
    const favour=favourTalk(name);if(favour.handled)return;
    const greeting=openingGreeting(name);
    // What today is (happenings.js) is what they say first, once a day; everything else
    // they offer (a drink at Minato, the Tama errand) stays on the buttons.
    let today=favour.line?null:happeningLine(name,getMinutes(),{rain:state.weather===true});
    if(today&&!(state.heardHappenings||=[]).includes(today.key)){
     state.heardHappenings=[...state.heardHappenings,today.key].slice(-40);
     recordMoment(state,getMinutes(),{kind:'happening',text:today.title+'. '+name+' said: “'+today.text+'”'});
    }else today=null;
    // What they make of him (people/impressions.js), said once when it changes, when nothing else comes first.
    const impression=favour.line||today?null:impressionLine(state,name,getMinutes(),{temper:temperOf(name),playerName:playerName()});
    const all=DIALOGUE[name];if(!all){legacyResident(name);return;}
    if(impression){state.impressions={...(state.impressions||{}),[name]:impression.id};save();}
    const history=histories.get(name)||[];
    // The home topic keeps its place in the rotation while commuting. Dropping it
    // left the thinner residents three usable lines against a three-deep history,
    // so their opening line came round again every fourth time they were asked.
    const available=all.filter(([id,line,requires])=>(!requires||state.inspectedIds.includes(requires))&&!history.includes(id));
    // Newly discovered callbacks take precedence, then cycle through authored topics.
    const row=available.find(r=>r[2])||available[0]||all[0];if(!favour.line&&!impression){history.push(row[0]);histories.set(name,history.slice(-3));}
    let text=row[0]==='home'?(residentHomeDescription(name)||commuterDescription(name)):row[1];
    if(today)text=today.text;
    if(favour.line||impression)text='';
    const profile=RESIDENTS.find(p=>p.name===name)||PROFILES.find(p=>p.name===name);
    const buttons=[['Tell me more',()=>resident(name)],...(profile?[['How is '+profile.friend+'?',()=>show(name+' · '+profile.personality,profile.gossip,[['And around town?',()=>resident(name)],['See you soon',close]])],['Somewhere worth exploring?',()=>{const clue=clueFor(name,profile.clue,state);note(clue);show(name,clue,[['I will have a look',close]]);}]]:[])];
    const home=residentHomeDescription(name);
    buttons.push([home?'Where do you live?':'How do you travel?',()=>show(name+' · '+(home?'Home':'Harbour Line'),home||commuterDescription(name),[['Tell me more',()=>resident(name)],['See you soon',close]])]);
    if(name==='Thao'&&getSocialContext().inside!=='ramen')buttons.push(['What is cooking?',()=>izakayaMenu()],['What have I missed?',()=>izakayaGossip()]);
    // Mingling at Minato: stand somebody a drink. They remember it.
    if(getSocialContext().inside==='izakaya'&&name!=='Thao'&&name!=='Barfly'&&izakayaOpen(getMinutes()))buttons.push(['Buy '+name+' a drink · ¥'+DRINKS.draft.price,()=>treat(name)]);
    if(name==='Nhung')buttons.push(['About Tama',()=>legacyResident(name)]);
    if(name==='Chin')buttons.push(['How does the 3D printer work?',()=>show('Chin · Form 3D','Yo bro, pick a pattern on the Form 3D machine. StepWise checks the material cost and what Thuan will pay. Start the print, let the machine run, then collect it. One of each in your bag. Thuan buys them at Sakura from nine till eight, using the money her shop earns.',[['Got it, bro',close]])]);
    if(name==='Chin'&&state.kenjiEscort&&state.kenjiEscort!=='done')buttons.push(['Show me the workshop',()=>{onEscort();close();say('Chin: Come on, bro. I’ll show you the way.',4);}]);
    if(name==='Mrs Sato')buttons.push(['Umeboshi rice ball · ¥80',()=>{if(spend(80)){state.sprintUntil=performance.now()+20000;note('Umeboshi rice ball. Ready to move.');close();}}]);
    if(name==='Cold-storage kid')buttons.push(['Ice · ¥20',()=>{if(spend(20)){addItem('Ice');receipt(name,'Keep it out of the sun. That is the entire manual.');}}]);
    if(name==='Harbour master')buttons.push(['Sell a catch',()=>legacyResident(name)]);
    // Friendship: a little for talking each day, more for presents, most for what they
    // wanted today (src/people/friendship.js).
    const minutesNow=getMinutes(),pool=wantPool();
    talked(state,name,minutesNow);save();
    const want=openWant(state,minutesNow,pool,name);
    if(want)text=text?text+'\n\n'+wantLine(want):wantLine(want);
    const gifts=giftsNow();
    if(gifts.length)buttons.splice(buttons.length,0,['Give a present…',()=>residentGift(name)]);
    const voiced=text===row[1]&&row[3];const said=joinLines([greeting,favour.line,impression,text]);
    buttons.push(...(favour.buttons||[]));buttons.push(['See you soon',close]);show(profile?name+' · '+profile.personality:name,said.text,buttons,{pauses:said.pauses,face:said.face});showHearts(name);if(voiced)townAudio.speak(row[3]);
  }

  /**
   * At your seat in Minato -- a counter stool among the regulars, a table or the window:
   * order anything on the wall you can pay for, drink it and eat it, or get up.
   */
  /** The hearts on the name tab, for whoever is talking. */
  function showHearts(name){const h=heading;if(!h)return;const r=state.friendship?.[name];h.dataset.hearts=heartLine(r?.points||0);h.dataset.level=levelName(r?.points||0);}
  /** Giving a resident something from the bag. */
  function residentGift(name,page=0){
    const gifts=giftsNow();
    if(!gifts.length){receipt(name,'Your bag has nothing to give just now.');return;}
    const pool=wantPool(),want=openWant(state,getMinutes(),pool,name);
    show(name+' · A present','What will you give '+name+'?'+(want?'\n(They mentioned '+withArticle(want.item.toLowerCase())+'.)':''),[
      ...gifts.slice(page*8,(page+1)*8).map(item=>[item,()=>{
        if(!takeGift(state.inventory,item))return;
        const result=gave(state,name,item,getMinutes(),pool);
        // The next morning they write to say thank you (src/mail/post.js), once a day at most.
        {const day=Math.floor(getMinutes()/1440);sendLetter(state,{id:`thanks:${name}:${day}`,day:day+1,occasion:'thanks',from:name});}
        if(result.yen)state.yen+=result.yen;
        note('Gave '+name+' '+item.toLowerCase()+'.',{who:name});save();
        const extra=(result.yen?`\n\n+¥${result.yen}`:'')+(result.up?`\n\n${name} and you are closer now: ${levelName(state.friendship[name].points)}.`:'');
        show(name,giftLine(name,item,result)+extra,[['Thank you',close]]);showHearts(name);
        onTreat(name);
      }]),
      ...(page>0?[['Previous presents',()=>residentGift(name,page-1)]]:[]),
      ...((page+1)*8<gifts.length?[['More presents',()=>residentGift(name,page+1)]]:[]),
      ['Not now',()=>resident(name)]]);
    showHearts(name);
  }
  function izakayaTable(){
    const table=getBeerTable()||{},drink=table.drink,dish=table.dish,order=table.order,buttons=[],open=izakayaOpen(getMinutes());
    let text=open?'Lanterns, the radio low, the smell of the grill. Thao is behind the counter.':'Minato is closing. Thao is stacking the stools.';
    if(order){const item=menuItem(order.kind);text='Thao is '+(order.phase==='cooking'?'at the '+DISHES[order.kind].station+' with your '+item.en.replace(/^(a|an|the) /,'').replace(/^(plate|bowl|flask) of /,''):order.phase==='pouring'?'pouring your '+item.en.toLowerCase():'on her way over with it')+'.';}
    const onTable=[drink&&drink.left>0?'your '+DRINKS[drink.kind].en.toLowerCase().replace(/^(a|an) /,'')+(drink.left<drink.sips?' ('+drink.left+' sips left)':''):null,dish&&dish.left>0?DISHES[dish.kind].en+(dish.left<dish.bites?' ('+dish.left+' left)':''):null].filter(Boolean);
    if(!order&&onTable.length)text+='\n\nIn front of you: '+onTable.join(' and ')+'.';
    if(drink&&drink.left>0)buttons.push([drink.left===drink.sips?"Cheers · Kanpai, and drink":'Drink',()=>{close();onSip();}]);
    if(dish&&dish.left>0)buttons.push([dish.left===dish.bites?"Enjoy your meal · Eat":'Eat some more',()=>{close();onEat();}]);
    if(!order&&open){
      if(!table.naoHere)text+='\n\nThao is not at the counter just now.';
      else{
        if(!drink||drink.left<=1)buttons.push(['Order a drink…',()=>izakayaOrder('drinks')]);
        if(!dish||dish.left<=0)buttons.push(['Order something to eat…',()=>izakayaOrder('food')]);
      }
    }
    buttons.push(['Stand up',()=>{close();onStand();}],['Stay seated',close]);
    show("Izakaya Minato · your seat",text,buttons);
  }
  /** Minato's wall, one list for drink and one for food. What you cannot pay for is marked, not hidden. */
  function izakayaOrder(kind){
    const items=Object.values(kind==='drinks'?DRINKS:DISHES);
    show(kind==='drinks'?'Minato · to drink':'Minato · from the kitchen','You have '+purse()+'. Thao waits with her pad.',[
      ...items.map(item=>[item.jp+' · ¥'+item.price+(state.yen<item.price?' (not enough yen)':item.alcohol>0&&!wantsAnother(getTipsy(),item.alcohol)?' (Thao says enough)':''),()=>{
        if(state.yen<item.price){receipt('Minato',"Thao smiles: Next time. Next time, then. You have ¥"+state.yen+'.');return;}
        if(item.alcohol>0&&!wantsAnother(getTipsy(),item.alcohol)){receipt('Minato',"Thao puts a glass of water in front of you: You’ve had enough. Enough for tonight -- drink this, and then home.");return;}
        if(!spend(item.price))return;
        if(!onOrderDrink(item.id)){state.yen+=item.price;save();receipt('Minato','Thao is busy -- try again in a moment.');return;}
        onTime(2);note('Ordered '+item.en.toLowerCase()+' at Minato.');close();
        say("「Sorry,"+item.jp+"Please!」 "+(DISHES[item.id]?'Thao calls it back and goes to the '+DISHES[item.id].station+'.':'Thao nods and reaches for '+(item.id==='draft'?'a mug.':item.id==='bottle'?'a big bottle.':item.id==='can'?'the fridge.':item.id==='sake'?'the kettle for the tokkuri.':item.id==='awamori'?'the kame of awamori.':'the tea jug.')),4);
      }]),
      ['Back',izakayaTable]
    ]);
  }
  /** A round for somebody at Minato: Thao pours it, they raise it, and the town remembers who bought it. */
  function treat(name){
    if(state.yen<DRINKS.draft.price){receipt(name,'You check your pockets: ¥'+state.yen+'. '+name+' laughs -- next time, then.');return;}
    if(!spend(DRINKS.draft.price))return;
    state.treats??={};const times=state.treats[name]=(state.treats[name]||0)+1;save();
    onTime(2);onTreat(name);note('Bought '+name+' a drink at Minato.',{who:name});
    const lines=times===1?["Cheers! That is very kind. The next one is mine -- I will remember.",'Kanpai! Thao, did you see that? A gentleman.']:times<4?["Again? Then I owe you two. Cheers!",'You keep doing this. Sit down, then, and tell me about your day.']:['At this point you are a regular. Thao is going to put your name on a bottle.',"Cheers, my friend. To the harbour."];
    receipt(name,lines[(times+name.length)%lines.length]);
  }
  function izakayaMenu(){
    if(!izakayaOpen(getMinutes())){close();say('Minato closes at 03:00. Thao is locking up.');return;}
    show('Minato · Tonight’s wall','Thao: Take a seat -- the counter, a table, wherever there is room -- and I will bring you anything on the wall. The stories are on the house.',[
      ['Read the drinks',()=>show('Minato · to drink',Object.values(DRINKS).map(d=>d.jp+' · '+d.en+' · ¥'+d.price).join('\n'),[['Back',izakayaMenu]])],
      ['Read the food',()=>show('Minato · from the kitchen',Object.values(DISHES).map(d=>d.jp+' · '+d.en+' · ¥'+d.price).join('\n'),[['Back',izakayaMenu]])],
      ['Sing karaoke · solo or with friends',()=>izakayaPlay.karaoke()],
      ['Just looking, thank you',close]
    ]);
  }
  // Minato school. Lunch is kyūshoku: eaten in the classroom, the same meal for everyone,
  // the teacher included, and a visitor who turns up at the right time gets a tray too.
  function kyushoku(phase,menu){
    if(phase!=='serving'&&phase!=='lunch'){
      show('Kyūshoku trolley','The stainless trolley parked by the pantry, its cauldrons scrubbed and upside down. Lunch is at 12:20: the lunch squad fetches it from the prep kitchen and serves at the front.',[['Back',close]]);return;
    }
    const dishes=menu?.jp?.join('、')||'';
    show("School lunch · Kyūshoku",'Higa-sensei waves you over: "There is always a spare tray. Sit with han three." The lunch squad, in white smocks and caps and gauze masks, ladles it out: '+(menu?.en||'')+'.',[
      ["Take a tray · Enjoy your meal",()=>{onTime(phase==='serving'?30:18);note("Ate kyūshoku with the Years 5–6 class: "+dishes+'.');
        show("Enjoy your meal!",'The class and their teacher, all at once. '+(menu?.en?menu.en[0].toUpperCase()+menu.en.slice(1):'')+". The bottle of milk is cold, and finishing it before you leave the table is not optional. Across the han, Kenta is trying to trade his goya to anyone who will take it. At the end: Thank you for the meal, trays stacked, milk bottles rinsed at the corridor taps, and everybody is already rolling up their sleeves for sōji.",[['Help with sōji',()=>{onTime(15);receipt('Sōji','Desks to the back, brooms down the rows, wet rags pushed along the floorboards at a run. The class finishes in fifteen minutes flat and the floor shines.');}],['Thank the class',close]]);}],
      ['Just watch',close]]);
  }
  // The class pantry. Anyone can use it after school, if they leave it as they found it and
  // put something in the ingredients jar.
  const PANTRY_DISHES=[
    ['Sata andagi',100,25,'Balls of dough dropped into the oil, turning themselves over as they puff and crack open. Crisp outside, cake inside.'],
    ['Onigiri',50,10,'Rice from the class cooker, salt on your palms, a strip of nori. Three triangles, slightly lopsided, wrapped in a sheet of the class\'s newspaper.'],
    ['Barley tea',20,8,'A kettle of mugicha, poured into the big plastic jug and set in a bowl of tap water to cool. It tastes of every summer afternoon.'],
    ['Goya champuru',150,20,'Bitter melon, tofu, egg and a few slices of luncheon meat, stir-fried in the big pan on the gas ring. The bitterness is the point, says Sensei.'],
  ];
  function schoolPantry(phase){
    const club=phase==='club';
    const intro=club?'The home-economics club is at the pantry: three pupils in aprons and Higa-sensei with the andagi pot. "Wash your hands first. Then you can help."':
      phase==='lesson'||phase==='lesson-pm'?'A lesson is on. The pantry can wait until after school -- the jar says ¥ on it, for ingredients.':
      'The class pantry: a sink, two gas rings, the rice cooker, a shelf of trays and bowls, and a jar for ingredient money. Clean up after yourself.';
    if(phase==='lesson'||phase==='lesson-pm'){show('Class pantry',intro,[['Back',close]]);return;}
    show('Class pantry',intro,[...PANTRY_DISHES.map(([dish,cost,minutes,text])=>[`Make ${dish.toLowerCase()} · ¥${cost} in the jar`,()=>{
      if(!spend(cost))return;onTime(minutes);addItem(dish);note('Made '+dish.toLowerCase()+" in the Years 5–6 pantry.");receipt(dish,text+' It is in your bag.');}]),['Leave it for now',close]]);
  }
  function schoolTeacher(phase){
    const lines={
      morning:'"Good morning! You are early. The children will be in soon -- they walk along the seawall, which they are not supposed to."',
      lesson:'"We are dividing fractions. The sixth-graders help the fifth-graders; in a small class, everyone teaches someone."',
      'lesson-pm':'"Social studies: the fishing co-op. Half their parents are in it, so the children correct me."',
      serving:'"The lunch squad is serving. Wait your turn -- and if you are staying, there is a spare tray."',
      lunch:'"We eat together. It is a lesson too: gratitude, manners, and nothing left on the plate."',
      cleaning:'"Sōji! Everybody cleans, teachers too. The floor will not wipe itself."',
      club:'"Home-ec club. Sata andagi today -- the oil has to be just right, one hundred and seventy degrees."',
      after:'"The children have gone home. I am marking notebooks. Would you like some barley tea from the pantry?"',
      weekend:'"No school today. I came in to water the morning glories on the windowsill."',
      closed:'Nobody here. The notebooks are stacked on the teacher\'s desk, the chairs are up on the desks.'};
    const text=lines[phase]||lines.closed;
    show(phase==='closed'?'Empty classroom':"Miss Higa · Higa-sensei",text,[['Thank you',close]]);
  }
  // The medicine shelf behind Sakura's till. Nothing on it is self-service: you ask, and
  // Thuan reaches it down and tells you how many to take.
  // Everything Thuan sells from behind the counter goes through one till: the hours, her
  // being there, the yen, the bag, and a line in the shop ledger like any shelf sale.
  function sakuraTillClosed(){
    const m=((getMinutes()%1440)+1440)%1440;
    if(m<540||m>=1200)return 'The till is closed. Thuan returns at 09:00.';
    if(getSocialContext().thuanAvailable===false)return 'Thuan is away from the counter for a bit.';
    return null;
  }
  function sellAtTill(name,price,unitCost=Math.round(price*.65)){
    const closed=sakuraTillClosed();if(closed)return {ok:false,message:closed};
    if(state.yen<price)return {ok:false,message:'You do not have enough yen.'};
    if(state.inventory.length>=100)return {ok:false,message:'Your bag is full.'};
    state.yen-=price;state.inventory.push(name);
    recordSakuraSale(state,price,null,{minute:getMinutes(),item:name,buyer:'Johansson',unitCost});save();townAudio.play('click',.35);
    return {ok:true};
  }
  function sakuraMedicine(){
    const closed=sakuraTillClosed();
    if(closed){show('Medicine shelf',closed,[['Back',close]]);return;}
    // Every box on the shelf, not a selection of them.
    const items=[...MEDICINES,STAMINA_DRINK];
    show("Medicine · Medicine shelf",'Thuan: "What do you need? If it is more than a cold, my sister is at the clinic: nine to twelve and two to five."',[
      ...items.map(item=>[`${item.jp}${item.sub?' '+item.sub:''} · ¥${item.price.toLocaleString('en-GB')}`,()=>{const result=sellAtTill(item.en,item.price);if(!result.ok){receipt(item.jp,result.message);return;}onTime(2);
        receipt(item.jp,item.en+' is in your bag. Thuan writes the dose on the box in marker, the way she does for everyone.');}]),
      ['Nothing, thank you',close]]);
  }
  // The small things on the till cabinet: phone cards, stamps, ferry tickets, gum, matches.
  const COUNTER_GOODS=Object.freeze([
    {jp:"Telephone card (50 units)",en:'Telephone card (50 units)',price:500},
    {jp:"Telephone card (105 units)",en:'Telephone card (105 units)',price:1000},
    {jp:"Stamp (80 yen)",en:'80-yen stamp',price:80,unitCost:80},
    {jp:"Postcard stamp (50 yen)",en:'Postcard stamp (50 yen)',price:50,unitCost:50},
    {jp:"Ferry ticket",en:'Ferry punch card (11 rides)',price:3000,unitCost:2900},
    {jp:"Gum",en:'Chewing gum',price:100},
    {jp:"Match",en:'Box of matches',price:20},
    {jp:"Disposable lighter",en:'Disposable lighter',price:100},
  ]);
  function sakuraCounterGoods(){
    const closed=sakuraTillClosed();
    if(closed){show('Till counter',closed,[['Back',close]]);return;}
    // The bottles are here since Higa Liquor closed (the owner, 22 October 2026; konbini.js SAKURA_BOTTLES).
    show("In front of the cash register · At the till",'Thuan: "Cards, stamps, ferry tickets, and the bottles from the back since the Higas closed. The gum is the only thing here anyone buys on impulse."',[
      ...COUNTER_GOODS.map(item=>[`${item.jp} · ¥${item.price.toLocaleString('en-GB')}`,()=>{const result=sellAtTill(item.en,item.price,item.unitCost);
        receipt(item.jp,result.ok?item.en+' is in your bag.':result.message);}]),
      ...SAKURA_BOTTLES.map(p=>[`${p.name} · ¥${p.cost}`,()=>{const result=sellAtTill(p.item,p.cost,p.unitCost);if(!result.ok){receipt(p.name,result.message);return;}onTime(2);receipt('Sakura Shōten',p.text);}]),
      ['Nothing, thank you',close]]);
  }
  // Local players: several people can keep their own progress on one device. Switching
  // reloads the town from that player's save, which is the only way to be sure nothing
  // from the last player is still in memory.
  function players(){
    let roster=readPlayers(localStorage);const me=roster.players.find(p=>p.id===roster.active);
    const when=t=>t?new Date(t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'never';
    const others=roster.players.filter(p=>p.id!==roster.active);
    show('Player · '+(me?.name||'Visitor'),'Progress saves on this device, automatically every few seconds and whenever you leave. Last saved: '+when(state.savedAt)+'.',[
      ['Save now',()=>saveBeforeLeaving(()=>receipt('Saved','Saved for '+(me?.name||'Visitor')+' at '+when(state.savedAt)+'.'))],
      ['Rename player',()=>{const name=globalThis.prompt?.('Name for this player',me?.name||'');if(name&&renamePlayer(localStorage,name)){players();}}],
      ...others.map(p=>['Switch to '+p.name+' · '+when(p.lastPlayed),()=>saveBeforeLeaving(()=>{if(!switchPlayer(localStorage,p.id)){receipt('Player not changed','Your progress was saved, but this device could not switch players.');return;}globalThis.location?.reload?.();})]),
      ['New player',()=>{const name=globalThis.prompt?.('Name for the new player','');if(!name)return;saveBeforeLeaving(()=>{if(!addPlayer(localStorage,name)){receipt('Player not created','Your progress was saved, but this device could not create another player.');return;}globalThis.location?.reload?.();});}],
      ['Export save file',exportSave],
      ['Import save file',importSave],
      ['Close',close]]);
  }
  function exportSave(){
    save();const me=activePlayer(localStorage);
    try{const blob=new Blob([JSON.stringify({game:'johansson-town',version:1,player:me?.name,savedAt:state.savedAt,state},null,1)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='johansson-town-'+(me?.name||'player').replace(/\W+/g,'-').toLowerCase()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
    catch{receipt('Export','This browser would not save the file.');}
  }
  function importSave(){
    const input=document.createElement('input');input.type='file';input.accept='application/json,.json';
    input.onchange=async()=>{
      const file=input.files?.[0];if(!file)return;
      try{const data=JSON.parse(await file.text());if(!['johansson-town','johansson-world'].includes(data?.game)||!data.state||typeof data.state!=='object'||Array.isArray(data.state))throw Error('not a save');
        saveBeforeLeaving(()=>{if(!addPlayer(localStorage,data.player||file.name.replace(/\.json$/,''),Date.now(),data.state)){receipt('Import not saved','This device could not save the imported player. Your current player is unchanged.');return;}globalThis.location?.reload?.();});}
      catch{receipt('Import','That file is not a Johansson World save.');}
    };
    input.click();
  }
  // Umi-no-yu. The bath keeps municipal hours, and the footbath outside keeps the bath's.
  // Inside Umi-no-yu (src/world/interiors/onsen.js): pay at the bandai, change, bathe.
  const townDay=()=>Math.floor(getMinutes()/1440);
  const onsenPaid=()=>state.onsenPaidDay===townDay();
  function onsenPay(){
    const m=((getMinutes()%1440)+1440)%1440;
    if(m<600||m>=1320){show("Sea Bath · Umi-no-yu",'Higa-san is counting the day’s coins. "The bath is closed -- ten o’clock tomorrow. The footbath opens with it."',[['Back',close]]);return;}
    if(onsenPaid()){receipt("Sea Bath · Umi-no-yu",'You have paid for today. Higa-san waves you through without looking up.');return;}
    show("Sea Bath · Umi-no-yu",'Higa-san looks up from her account book. Adults ¥300. Gentlemen through the indigo noren, ladies the crimson; past the bath doors it is swimwear -- the washing room and the rock bath are for everybody.',[
      ['Pay ¥300',()=>{if(!spend(300))return;state.onsenPaidDay=townDay();save();note('Bathed at Umi-no-yu.');receipt("Sea Bath · Umi-no-yu",'Three coins in the tray. "The men’s baskets are through the indigo curtain. Wash before you get in."');}],
      ['Not today',close]]);
  }
  function onsenMilk(){
    show('Coffee milk','Cold coffee milk in a glass bottle, ¥100. It is drunk standing up, hand on hip, all in one go.',[
      ['Buy one · ¥100',()=>{if(!spend(100))return;onTime(1);addItem('Coffee milk');onMove('Drink');receipt('Umi-no-yu','The cap pops off with your thumbnail. It is gone in five swallows. The bottle goes back in the crate.');}],
      ['Back',close]]);
  }
  // Seated in Umi-no-yu's coin massage chair (onsen.js ONSEN_MASSAGE): a ¥100 coin buys ten minutes on its timer. With no
  // power the coin comes back and nothing is charged; while it runs there is no second coin, and standing up leaves it
  // running to 0:00 (the coin is spent).
  function massageChair(){
    const chair=getMassageChair();if(!chair){close();return;}
    const keep=['Keep sitting',close],stand=['Stand up',()=>{close();onStand();}],t=chair.state();
    if(t.running){show('Massage chair',chair.texts.running+' The LED reads '+t.reads+'.',[keep,stand]);return;}
    show('Massage chair',chair.texts.about,[
      ['Put in a ¥'+chair.coin+' coin',()=>{
        const no=chair.refusal();if(no){show('Massage chair',no,[keep,stand]);return;}
        if(!spend(chair.coin))return;
        chair.start();note('Ten minutes in the massage chair at Umi-no-yu.');show('Massage chair',chair.texts.started,[keep,stand]);}],
      keep,stand]);
  }
  function onsenChange(){
    const swimming=getOutfit();
    show('Baskets',swimming?'Your clothes are folded in a rattan basket on the men’s shelf; your wallet is with Higa-san at the bandai.':'A rattan basket on the men’s shelf for your clothes, and your wallet to Higa-san at the bandai. The notice says: a bath wrap in here (children wear swimwear), swimwear past the bath doors, where everybody bathes together, and something decent in the lobby.',[
      [swimming?'Get dressed':'Change for the bath',()=>{close();onOutfit(!swimming);}],['Back',close]]);
  }
  function onsen(){
    const m=((getMinutes()%1440)+1440)%1440;
    if(m<600||m>=1320){show("Sea Bath · Umi-no-yu",'The glass doors are locked and the lamps inside are out. A card in the window: 10:00–22:00. The footbath outside is still warm.',[['Back',close]]);return;}
    show("Sea Bath · Umi-no-yu",'The attendant at the desk looks up from a crossword. Adults ¥300; a towel is ¥100 more, or bring your own.',[
      ['Bathe · ¥300',()=>{if(!spend(300))return;onTime(40);note('Bathed at Umi-no-yu.');
        show('The rock bath','You wash at the low taps, then lower yourself into the outdoor bath a little at a time. Over the bamboo on the sea side the harbour lights come and go in the steam. Forty minutes pass without asking.',[
          ['Coffee milk from the fridge · ¥100',()=>{if(!spend(100))return;addItem('Coffee milk');receipt('Umi-no-yu','Cold coffee milk in a glass bottle, drunk standing up, hand on hip. The bottle goes back in the crate.');}],
          ['Step back outside',close]]);}],
      ['Not today',close]]);
  }
  function izakayaGossip(){
    if(!izakayaOpen(getMinutes())){izakayaMenu();return;}
    const social=getSocialContext(),gossip=gossipAt(getMinutes(),social.names||[]);note(gossip.clue);
    show('Overheard at Minato',gossip.line+'\n\n'+gossip.clue,[['Stay a little longer',()=>{onTime(7);izakayaGossip();}],['Back to the evening',close]]);
  }
  function vending(){show("MINATO DRINKS · Vending machine",'Cold drinks behind the blue buttons, hot behind the red. ¥120 each. Drink it now or keep it in your bag; the empty can goes to the recycling box by Sakura’s door.',[...VENDING_PRODUCTS.map(product=>[product.label,()=>buyDrink(product)]),['Leave',close]]);}
  function buyDrink(product){if(!spend(product.price))return;onTime(1);onMove('Give');const name=product.inventoryName;addItem(name);townAudio.play('clunk',.7);close();if(!onPurchase(name))receipt('Thank you',`${product.brand} — ${name} is in your bag.`);}

  function legacyResident(name){
    if(name==='Nhung'){
      if(state.quest===0){show('Nhung · Bookshop assistant','My ginger cat Tama has wandered off again. He likes the warm corner by the ramen stall. Would you find him?',[['I will look for Tama',()=>{state.quest=1;save();receipt('A note in your notebook','Look near the ramen stall. If Tama is hungry, try the fishing pier.');}],['Later',close]]);}
      else if(state.quest===2){state.quest=3;state.yen+=500;save();receipt('Nhung','Tama followed you back to the shopping street! Thank you. Please take ¥500 for your trouble. That is one town favour complete — your Field book tracks the shortcuts you can earn.');}
      else receipt('Nhung',state.quest===3?'Tama is sleeping upstairs. The harbour is lovely at sunset.':'Try the ramen stall further down the street. Tama cannot resist fresh fish.');
      return;
    }
    const lines={
      Chin:'The Star Port cabinet is outside the workshop. Stop the signal in the illuminated zone three times to win. It costs ¥100; a perfect round pays ¥250.',
      'Mrs Sato':'Ramen is ¥300 today. The payphone near the bookshop still works, and the Harbour Line timetable is at the northern terminal.',
      'Harbour master':'Mībai bite at any hour; ēgwā by day, and mijun when the shoals come in. Taman and tachinuiyu after dark: that is when the old men come out. Cast a line, wait for the float to dip, and reel in while the signal reads BITE. I buy what you land.'
    };
    show(name,lines[name]||'The resident nods politely.',[
      ...(name==='Harbour master'?[...(pierFishInBag().sort((a,b)=>b.pierPrice-a.pierPrice).map(f=>[`Sell your ${f.name} · +¥${f.pierPrice}`,()=>{if(!state.inventory.includes(fishItem(f))){say('That fish is no longer in your bag.');return;}takeOne(fishItem(f));state.yen+=f.pierPrice;save();receipt('Harbour master',`${aFish(f).replace(/^a/,'A')}. ${f.pierPrice>=300?'Now that is a fish.':f.pierPrice<100?'Bait, mostly, but I will take it.':'A fair fish.'} Here is ¥${f.pierPrice}.`);}])),...(pierFishInBag().length?[]:[['Sell a fish',()=>say('Catch a fish at the pier first.'),true]])]:[]),
      ['Goodbye',close]
    ]);
  }

  function cat(){
    note('Tama approved this route');
    if(state.quest===1){
      if(cheapestPierFish())show('Tama','The ginger cat watches the fish in your bag.',[['Give Tama a fish',()=>{const fish=cheapestPierFish();if(!fish){close();return;}takeOne(fishItem(fish));state.quest=2;save();receipt('Tama','Tama eats the fish and trots towards Nhung’s shop. Tell Nhung where he is.');}],['Leave',close]]);
      else receipt('Tama','The ginger cat chirps, but keeps his distance. He seems hungry. Try fishing at the harbour.');
    } else receipt('Ginger cat',state.quest===3?'A neighbourhood cat stretches in the afternoon warmth.':'A ginger cat is warming himself beside the ramen stall.');
  }

  // The pier's fish in the bag (src/world/okinawa/fish.js). The harbour master is offered each kind (the player
  // chooses, so a taman a friend asked for is never sold by mistake); Tama is given the least (a cat is happy with a mijun, and the player keeps the taman).
  const pierFishInBag=()=>fishAt('pier').filter(f=>state.inventory.includes(fishItem(f)));
  const cheapestPierFish=()=>pierFishInBag().sort((a,b)=>a.pierPrice-b.pierPrice)[0]||null;
  // Ms Ganaha at the Port Terminal's ticket window (src/people/ganaha.js), the island's guide: what she says is read
  // from the town's own timetable and fares. More questions come with the guide's later batches.
  function ganaha(detail){
   const ask=text=>show(GANAHA.name,text,[
    ['When is the next boat?',()=>ask(nextBoatLine(getMinutes()))],
    ['What is there on Kitano-jima?',()=>places('kitano','Over the strait? Plenty, for a little island. What do you fancy?')],
    ['What is there on this island?',()=>places('johansson','Past the main street, you mean? Where shall I start?')],
    ...(typeof detail?.buy==='function'?[['A return to Kitano-jima, please',()=>{close();detail.buy();}]]:[]),
    ['Goodbye',close]]);
   // Her places (src/world/island-guide.js): one button each, then back to the window.
   const places=(island,lead)=>show(GANAHA.name,lead,[
    ...islandPlaces(island).map(p=>[p.name,()=>show(GANAHA.name,placeSays(p,state),[['Somewhere else?',()=>places(island,'Where else, love?')],['Thank you',()=>ask('Anything else?')]])]),
    ['That is all, thank you',()=>ask('Anything else?')]]);
   ask(ganahaGreeting(getMinutes()));
  }
  function fishing(){
    show('Harbour fishing','Cast a line. Wait for BITE, then reel in before the fish gets away.',[
      // Waiting for a bite is the time the town gets on without you.
      ['Cast line',()=>{onTime(8);onMove('Cast');let elapsed=0,biteAt=2+Math.random()*2.5,caught=false;show('Harbour fishing','Waiting for a bite…',[
        ['Reel in',()=>{if(caught)return;caught=true;onMove('Reel');if(elapsed>=biteAt&&elapsed<biteAt+1.35){state.fish++;if(state.fish===2){addItem('Waterlogged page · Kings of Ben…');note('Recovered a Book Three fragment: Kings of Ben…');receipt('A waterlogged page','Only “Kings of Ben…” survives. Nhung will want this dried away from the stove.');return;}const fish=pierCatch(getMinutes(),Math.random()),name=fishItem(fish);addItem(name);tone(880,.2);receipt(`${aFish(fish).replace(/^a/,'A')}!`,`${aFish(fish).replace(/^a/,'A')}, ${withEnglish(fish)}, is in your bag.${fish.note?' '+fish.note:''} Keep it, give it to Tama, or sell it to the harbour master for ¥${fish.pierPrice}.`);}else receipt('The line is empty','You reeled in too soon. Watch for BITE.');}],
        ['Put away the rod',close]
      ]);timer=setInterval(()=>{elapsed+=.05;if(elapsed>=biteAt&&elapsed<biteAt+1.35){body.firstChild.textContent='BITE — REEL IN NOW';body.classList.add('signal');}if(elapsed>=biteAt+1.35){body.classList.remove('signal');receipt('The fish got away','Try again and reel in when BITE appears.');}},50);}],
      ['Leave',close]
    ]);
  }

  function arcade(){
    show('STAR PORT','A 1988 cabinet, nine years on and still taking hundred-yen coins. Stop the moving signal inside the green zone. Three rounds. Entry ¥100; three hits pays ¥250.',[
      ['Insert ¥100',()=>{if(!spend(100))return;onTime(4);let round=0,hits=0,start=performance.now(),position=0;function next(){show(`STAR PORT · Round ${round+1}/3`,`Successful docks: ${hits}`,[['DOCK',()=>{if(position>=.36&&position<=.64){hits++;tone(700,.1);}else tone(170,.12);round++;if(round===3){state.best=Math.max(state.best,hits);if(hits===3){state.yen+=250;if(state.kenjiEscort!=='done')state.kenjiEscort=true;note('Perfect Star Port run. Chin offered a workshop escort.');}save();receipt('STAR PORT · Results',`${hits}/3 successful docks.${hits===3?' Perfect run — ¥250 paid.':' Try another flight at the cabinet.'}`);}else{start=performance.now();next();}}],['Leave cabinet',close]]);const track=document.createElement('div');track.className='arcade-track';track.innerHTML='<span class="target-zone"></span><span class="arcade-marker"></span>';body.append(track);timer=setInterval(()=>{position=(Math.sin((performance.now()-start)/380)+1)/2;track.lastChild.style.left=`${position*100}%`;},25);}next();}],
      ['Leave',close]
    ]);
  }

  function tone(){townAudio.play('click',.35);}
  function toggleSound(){state.sound=!state.sound;townAudio.setEnabled(state.sound);$('#soundButton').textContent=state.sound?'On':'Off';save();}

  function inspect(name,detail){if(name==='Convex traffic mirror'){note('Traffic mirror: Tama was behind me. No cat when I turned.');say('A ginger shape in the mirror. Behind you: only the street.',5);}show(name,detail||'A thumb-sized clean patch marks the part everybody touches.',[['Close',close]]);}
  function read(name,detail){if(/harbour notice/i.test(String(name))&&hasDailyQuest(state,'notice')&&!isDailyDone(state,'notice')){markDailyDone(state,'notice');save();say(NOTICE_NUDGE,6);}show(name,detail||'One corner is pinned with a bent brass tack. Read the complete dispatch at the Field Notes rack.',[['Put it back',close]]);}
  // Links out to the full motor model and Erik's routine in a new tab, so the town keeps its place.
  function motorBench(name,detail){
    const open=href=>()=>window.open(href,'_blank','noopener');
    show(name,detail,[['See the full strip-down',open(MOTOR_LINKS.stripDown)],['Watch Erik’s routine',open(MOTOR_LINKS.routine)],['Close',close]]);
  }
  function operate(name,detail){
    // On the web the machines are display pieces (edition.js `machinery`): what they are, nothing to work.
    if(!BUDGET.machinery){show(name,detail||'A working machine from the late 1980s.',[['Leave',close]]);return;}
    const already=state.operated.includes(name);
    show(name,detail||'A working machine from the late 1980s.',[
      ['Operate',()=>{if(!state.operated.includes(name))state.operated.push(name);tone(520,.18);onTime(5);save();receipt(name,already?'The controls respond with a familiar mechanical click.':'The machine completes a short test cycle. Five minutes pass.');}],
      ['Leave',close]
    ]);
  }
  function tableService(){
    const service=getTableService();if(!service)return;
    const order=service.order;
    const server=service.server||'Thuan',started=order?.delivered&&order.total&&order.left<order.total;
    const left=!started?'':order.left<=0?' It is all gone.':order.left/order.total>.6?' Most of it is still there.':order.left/order.total>.3?' About half is left.':' Nearly finished.';
    const text=order?.delivered?'Your '+order.item.name.toLowerCase()+' is on the counter.'+left:order?server+' is preparing your '+order.item.name.toLowerCase()+'.':'Take your time. '+server+' will prepare your order. Pay when it arrives.';
    const drinkable=item=>['tea','beer','mugicha','coffee'].includes(item.prop||item.id);
    const buttons=order?.delivered&&!(order.left<=0)?[[drinkable(order.item)?(started?'Another sip':'Drink the '+order.item.name.replace(/, .*$/,'').toLowerCase()):(started?'Eat some more':'Eat the '+order.item.name.toLowerCase()),()=>{close();service.eat();}]]:order?.delivered?[]:order?[]:(service.menu||STORE_MENU).map(item=>[(item.jp?item.jp+' · ':'')+item.name+' · ¥'+item.cost,()=>{if(service.request(item.id))close();}]);
    show(service.title||'Sakura · At the table',text,[...buttons,['Keep sitting',close],['Stand up',()=>{close();onStand();}]]);
  }
  function sit(name,detail){if(onSeat(name))return;show(name,detail||'A quiet place to sit.',[['Sit for ten minutes',()=>{onTime(10);receipt(name,'You sit for a while and listen to the town around you. Ten minutes pass.');}],['Leave',close]]);}
  async function realProduct(item){
    show('Mail-order catalogue','Looking up the current price…',[['Close',close]]);const revision=modalRevision;
    try{const product=await realShop.product(item.id);if(revision!==modalRevision)return;
      if(!product||!product.availableForSale){receipt('Mail-order catalogue','This item is not available to order.');return;}
      const price=new Intl.NumberFormat(undefined,{style:'currency',currency:product.price.currencyCode}).format(Number(product.price.amount));
      show(product.title,`Real-world order · ${price}\nThis uses real money through Shopify. Town yen cannot pay for it. Delivery and taxes are shown at checkout.`,[['Prepare Shopify checkout',async()=>{
        show('Preparing checkout','Please wait…',[['Cancel',close]]);const checkoutRevision=modalRevision;
        try{const url=await realShop.checkout(product.id);if(checkoutRevision!==modalRevision)return;show('Shopify checkout',`Real-world purchase · ${price}. Review the total and delivery details on Shopify.`,[['Return to town',close]]);const link=document.createElement('a');link.textContent='Continue to Shopify checkout';link.href=url;link.target='_blank';link.rel='noopener noreferrer';body.append(link);}catch(error){if(checkoutRevision===modalRevision)receipt('Mail-order catalogue',error.message);}
      }],['Back',close]]);
    }catch(error){if(revision===modalRevision)receipt('Mail-order catalogue',error.message);}
  }
  // 立ち読み at the magazine rack: today's issues, then page by page (src/ui/magazine-reader.js).
  function magazineRack(){
    show("Sakura · Magazines/Newspapers",'',[['Put it back',close]]);modal.classList.add('magazine-view','print-view');
    magazineView=createMagazineReader({date:townCalendarAt(getMinutes()).date,buy:(title,issue)=>sellAtTill(`${title.name} ${issue.dateLine}`,title.price,Math.round(title.price*.75))});body.replaceChildren(magazineView.element);
  }
  function printView(title,pages,index=0,back=null){
    show(title,'',[]);modal.classList.add('print-view');
    magazineView=createPrintViewer({title,pages,index,onClose:back||close});body.replaceChildren(magazineView.element);
    magazineView.element.querySelector('.pv-stage')?.focus();
  }
  function tradePoster(id){
    const index=SAKURA_TRADE_POSTERS.findIndex(p=>p.id===id);if(index<0)return;
    printView('Sakura · Supplier posters',tradePosterPages(),index);
  }
  function shopLedger(){
    if(getSocialContext().inside!=='market'){receipt('Sakura sales ledger','The stock and sales books are in the back office at Sakura.');return;}
    // On the web the books are the folder on the desk, as printed (src/commerce/paperwork.js); on Linux, the live shop's.
    if(!BUDGET.liveDocuments){show('Sakura Shōten · Office folder','The till roll, the stock book, the rota and this month’s delivery notes and invoices.',[['Close the folder',close]]);modal.classList.add('sakura-records');ledgerView=createPaperworkView();body.replaceChildren(ledgerView.element);return;}
    show('Sakura Shōten · Shop ledger','Thuan’s sales, purchases and stock records.',[['Close ledger',close]]);modal.classList.add('sakura-records');
    ledgerView=createShopLedgerView(state,getMinutes);body.replaceChildren(ledgerView.element);
  }
  // A konbini is not a vending machine: things go in the basket and are paid for at the
  // counter, where Thuan rings them through.
  // TalkFun one-liners on lift — Thuan's voice, never Yuri's.
  const EXAMINE_LINES=Object.freeze({
    tea:'Back of the cooler is colder. Front ones cooked.',
    coffee:'Harbour walk fuel. Don\'t shake it.',
    rice:'Wrapped this afternoon. Plum\'s in the middle.',
    biscuit:'Corner folded so they don\'t rattle.',
    soap:'Smells like the pink paper, not the flower.',
    notebook:'For tide times. Or excuses.',
    postcard:'Old breakwater. Photographer still owes me change.',
    battery:'For the radio. Ask before you open the hatch.',
  });
  function storeItem(item){
    // Prefer the Field-book orbit when the game wired an inspector; tests keep the dialogue path.
    if(typeof onInspectShopGood==='function'){
      const brand=item.brand||'',jp=item.jp||'',name=item.name||item.id;
      const caption=[brand,jp,name].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' · ')+' · ¥'+item.cost;
      onInspectShopGood({
        kind:'shop-good',id:'shop-'+item.id,productId:item.id,title:name+' · ¥'+item.cost,caption,
        liftLine:EXAMINE_LINES[item.id]||'Shelf price is the price.',
        canTalk:()=>getSocialContext().inside==='market'&&getSocialContext().thuanAvailable!==false,
        onBuy:()=>{
          const result=addToBasket(state,item);save();
          receipt(result.ok?'Basket':'Sakura Shōten',result.ok
            ?result.message+' '+basketLines(state).reduce((n,l)=>n+l.count,0)+' item(s), ¥'+basketTotal(state)+'. Pay at the counter.'
            :result.message);
        },
        onTalk:()=>{action('resident','Thuan');},
      });
      return;
    }
    const available=state.sakura.stock[item.id]?.shelf||0;
    const held=state.konbini.basket.filter(id=>id===item.id).length;
    const carrying=state.konbini.basket.length;
    const note=available?'On shelf: '+available+(held?' · in your basket: '+held:''):'Thuan: Sorry, we’ve sold out. Please come back tomorrow.';
    show(item.jp+' · '+item.name,item.text+'\n\n'+note,[
      [`Into the basket · ¥${item.cost}`,()=>{
        const result=addToBasket(state,item);save();
        receipt(result.ok?'Basket':'Sakura Shōten',result.ok
          ?result.message+' '+basketLines(state).reduce((n,l)=>n+l.count,0)+' item(s), ¥'+basketTotal(state)+'. Pay at the counter.'
          :result.message);
      },!available],
      ...(carrying?[[`Take ¥${basketTotal(state)} to the counter`,konbiniCounter]]:[]),
      ...(realShop.enabled&&SHOPIFY_CONFIG.products[item.id]?[['View real-world product',()=>realProduct(item)]]:[]),
      ['Put it back',close]]);
  }

  // --- the counter -------------------------------------------------------------
  // Thuan's half of the exchange, in the order a 1997 konbini would run it: warm it,
  // a bag, the stamp card, then cash and change.
  let counterWarm=null,counterBag=null;
  function konbiniCounter(){
    const lines=basketLines(state);
    if(!lines.length){receipt('Sakura Shōten','Your basket is empty.');return;}
    // Same presence gate as Form 3 sell: posted hours alone must not ring an empty till.
    if(getSocialContext().thuanAvailable===false&&sakuraHoursOpen(getMinutes())){
      receipt('Sakura Shōten',SAKURA_AWAY_MESSAGE);return;
    }
    const listing=lines.map(l=>`${l.jp} ${l.name}${l.count>1?' ×'+l.count:''} · ¥${l.cost*l.count}`).join('\n');
    const warmable=warmableInBasket(state);
    if(warmable.length&&counterWarm===null){
      show('Thuan · Counter',listing+"\n\nWould you like that warmed?\nShall I warm the "+warmable.map(l=>l.name.toLowerCase()).join(' and ')+'?',
        [['Yes, please',()=>{counterWarm=true;konbiniCounter();}],['No, thank you',()=>{counterWarm=false;konbiniCounter();}],
         ['Put something back',konbiniBasket]]);
      return;
    }
    if(counterBag===null){
      show('Thuan · Counter',listing+"\n\nWould you like a bag?\nDo you need a bag?",
        [['Yes, please',()=>{counterBag=true;konbiniCounter();}],
         ['I have my own',()=>{counterBag=false;konbiniCounter();}],
         ['Put something back',konbiniBasket]]);
      return;
    }
    const quote=checkoutQuote(state,{warm:counterWarm===true,bag:counterBag!==false});
    const card=quote.cardFull?"\n\nCard expired · that fills your stamp card."
      :`\n\nStamp card · ${state.konbini.stamps}/${CARD_STAMPS}${quote.stampsEarned?', +'+quote.stampsEarned+' with this':''}`;
    show('Thuan · Counter',listing+`\n\nTotal ¥${quote.total}\nShe waits with her hand on the till.`+card,
      [[`Pay ¥${quote.total} in cash`,payAtCounter],['Put something back',konbiniBasket],['Not yet',close]]);
  }

  function payAtCounter(){
    const result=checkout(state,{warm:counterWarm===true,bag:counterBag!==false},getMinutes(),getSocialContext().thuanAvailable!==false);
    counterWarm=null;counterBag=null;
    if(!result.ok){receipt('Sakura Shōten',result.message);return;}
    onTime(3);   // the counter ritual takes a few minutes
    save();
    const bought=result.receipt.lines.map(l=>l.name);
    if(bought.some(name=>['Green tea','Canned coffee'].includes(name)))onPurchase(bought.find(name=>['Green tea','Canned coffee'].includes(name)));
    note('Shopped at Sakura Shōten · ¥'+result.receipt.total+'.');
    if(result.receipt.gift)note('Filled a Sakura stamp card. Thuan put a green tea on the counter.');
    // A sale makes her day a little: she beams, and is still smiling as you leave.
    characterControl()?.feel?.('Thuan','happy',8);
    const thanks=result.receipt.gift
      ?"Thank you very much!\nThank you! And that fills your card — the green tea is on the house. Do not tell the assistant manager."
      :["Thank you very much!\nThank you! Come back soon — the cooler gets lonely.",
        "Thank you very much!\nThank you! I put the receipt in the bag so it does not blow away on the quay.",
        "Maido!\nThank you! You are my favourite customer today. Do not tell the others."][state.konbini.visits%3];
    show('Thuan · Counter',thanks,[
      ['Look at the receipt',()=>show("Receipt · Receipt",receiptText(result.receipt),[['Into your pocket',close]])],
      ['Thank you, Thuan',close]],{mood:'happy'});
  }

  function konbiniBasket(){
    const lines=basketLines(state);
    if(!lines.length){counterWarm=null;counterBag=null;receipt('Basket','Your basket is empty.');return;}
    show("Basket · Basket",`${lines.reduce((n,l)=>n+l.count,0)} item(s) · ¥${basketTotal(state)}`,
      [...lines.map(line=>[`Put back ${line.name}${line.count>1?' (×'+line.count+')':''}`,()=>{
        removeFromBasket(state,line.id);counterWarm=null;save();konbiniBasket();
      }]),['Back to the counter',konbiniCounter],['Close',close]]);
  }
  function buy(name,detail){
    const spec=detail&&typeof detail==='object'?detail:{};const cost=Number.isFinite(spec.cost)?Math.max(0,Math.round(spec.cost)):100,item=typeof spec.item==='string'?spec.item:name,text=typeof spec.text==='string'?spec.text:`${name} is ready to purchase.`;
    show(name,text,[[`Buy · ¥${cost}`,()=>{if(!spend(cost))return;onTime(2);addItem(item);tone(700,.12);receipt(name,`${item} has been added to your bag.`);}],['Leave',close]]);
  }
  function radio(name,detail){
    radioStation=Number.isInteger(state.radioStation)?Math.max(0,Math.min(2,state.radioStation)):0;
    const stations=[
      RADIO_821,
      '89.4 JOJO — tonight’s request: '+JOURNAL[Math.floor(getMinutes())%JOURNAL.length][1]+'. A title from the journal, for the late shift.',
      '95.7 Sports — fictional prefectural score: Harbour '+Math.floor(getMinutes()/30)%8+', Mountain '+Math.floor(getMinutes()/47)%6+'.'
    ];
    if(state.weather)radioStation=0;
    const render=()=>{note(stations[radioStation]);show(name,`${detail||'A compact transistor radio.'}\n\n${stations[radioStation]}`,[['Tune +',()=>{radioStation=(radioStation+1)%stations.length;state.radioStation=radioStation;save();tone(440+radioStation*110,.08);render();}],['Tune −',()=>{radioStation=(radioStation+stations.length-1)%stations.length;state.radioStation=radioStation;save();tone(440+radioStation*110,.08);render();}],['Leave',close]]);};
    render();
  }

  function documentArchive(){
    seedArchive(state,getMinutes());
    show('Community Hall · Document Register','',[['Close archive',close]]);modal.classList.add('office-records');
    body.replaceChildren(createArchiveView(state.documentArchive,{save(){const now=getMinutes();for(const f of state.documentArchive.findings)fileDocument(state,{type:'Audit report',title:f.title,organisation:'Community Hall',source:'audit:'+f.id,links:f.references,text:'AUDIT REPORT\nStatus: '+f.status+'\nFinding: '+f.detail+'\nReferences: '+f.references.join(', ')+'\nEvidence and resolution: '+(f.notes||'Awaiting investigation.')},now);save();}}));save();
  }
  async function officeRecords(id){
    show('Harbour office records','Opening the workbook…',[['Close records',close]]);modal.classList.add('office-records');const revision=modalRevision;
    try{const catalogue=await loadOfficeWorkbooks();if(!modalOpen||revision!==modalRevision)return;body.replaceChildren(createOfficeWorkbookView(catalogue,id,officeRecords));}
    catch{if(!modalOpen||revision!==modalRevision)return;show('Harbour office records','The records could not be loaded. Please try again.',[['Try again',()=>officeRecords(id)],['Close records',close]]);}
  }
  /**
   * A wash at the coin laundry (commerce/coin-laundry.js): load a free washer, it runs on the town clock, then a dryer,
   * then fold. The save keeps it (state.coinLaundry), and the machine turns in the world while it runs.
   */
  function coinLaundry(){
    const now=getMinutes(),wash=state.coinLaundry||null,run=playerWashStage(wash,now),spec=id=>LAUNDRY_MACHINES.find(m=>m.id===id);
    const label=id=>spec(id).kind==='washer'?'washer '+id.slice(1):'dryer '+id.slice(1),Label=id=>label(id)[0].toUpperCase()+label(id).slice(1);
    const keep=next=>{if(next)state.coinLaundry=next;else delete state.coinLaundry;save();onLaundry(state.coinLaundry||null);};
    const wait=left=>['Wait on the bench with a manga',()=>{onTime(Math.max(1,Math.ceil(left)));coinLaundry();}];
    if(run.stage==='none'){
      const id=freeMachine('washer',now);
      if(!id){show('Coin laundry','Every washer is going round or has somebody’s basket on it. Try again in a while.',[['Leave',close]]);return;}
      const m=spec(id),cost=m.cost+LAUNDRY_POWDER.cost;
      show('Coin laundry',`${Label(id)} is free (${m.load}): ¥${m.cost} for ${m.minutes} minutes, and ${LAUNDRY_POWDER.what} for ¥${LAUNDRY_POWDER.cost}.`,
        [[`Load ${label(id)} · ¥${cost}`,()=>{if(!spend(cost,'Coin laundry · wash'))return;keep({machine:id,start:getMinutes()});tone(480,.15);receipt('Coin laundry',`The coins drop, the door clunks shut and ${label(id)} starts to fill. ${m.minutes} minutes on the town clock.`);}],['Leave',close]]);
      return;
    }
    if(run.stage==='washing'||run.stage==='drying'){const id=run.stage==='washing'?wash.machine:wash.dryer;show('Coin laundry',`Your washing is going round in ${label(id)}: ${Math.ceil(run.left)} minutes to go.`,[wait(run.left),['Leave it going',close]]);return;}
    if(run.stage==='washed'){
      const id=freeMachine('dryer',now,wash);
      if(!id){show('Coin laundry','Your washing is done, wet in the drum. Both dryers are busy.',[['Leave',close]]);return;}
      const m=spec(id);
      show('Coin laundry',`Your washing is done, wet in ${label(wash.machine)}. ${Label(id)} is free: ${m.per}.`,
        [[`Move it to ${label(id)} · ¥${m.cost*3} for 30 minutes`,()=>{if(!spend(m.cost*3,'Coin laundry · dryer'))return;keep({...wash,dryer:id,dryStart:getMinutes()});tone(520,.15);receipt('Coin laundry',`Three coins, and ${label(id)} starts to turn: warm air and the smell of gas.`);}],['Leave',close]]);
      return;
    }
    show('Coin laundry',`Your washing is dry and warm in ${label(wash.dryer)}.`,[['Fold it at the window counter',()=>{onTime(5);keep(null);tone(700,.12);receipt('Coin laundry','You fold it on the counter by the window while it is still warm, shirts on top, and carry it out under your arm.');}],['Leave',close]]);
  }
  function action(kind,name,detail){
    body.classList.remove('signal');
    switch(kind){
      case 'workshop':if(BUDGET.machinery)workshopUI.printer();else show('Form 3D printer','Chin and Tetsuo’s Form 3D printer on the workshop bench.',[['Leave',close]]);break;
      case 'town-cleanup':{const result=collectTownFind(state,name);if(!result.ok){receipt('Town clean-up',result.message);break;}save();receipt('Street tidied',result.name+' is in your bag. Thuan offers ¥'+result.price+' when the shop has enough takings.');break;}
      case 'stepwise':if(isWorkshopSite(getSocialContext().inside))inspectItem({id:'stepwise',note:'Checked the workshop calculator.'});workshopUI.stepwise();break;
      case 'document-archive':documentArchive();break;
      case 'office-records':officeRecords(detail);break;
      case 'store-item':storeItem(detail);break;
      case 'shop-ledger':shopLedger();break;
      case 'magazine-rack':magazineRack();break;
      case 'trade-poster':tradePoster(name);break;
      case 'sakura-hot-snacks':thuanConversation('hot-case');break;
      case 'store-catalogue':show('Thuan’s mail-order book',realShop.enabled?'Real-world products. Current prices and Shopify checkout are shown separately from town yen.':'A pink ribbon marks the next page. Thuan is still preparing the mail-order selection.',[...STORE_ITEMS.filter(i=>realShop.enabled&&SHOPIFY_CONFIG.products[i.id]).map(i=>[i.name,()=>realProduct(i)]),['Close',close]]);break;
      case 'travel-progress':show('Earn your town shortcuts',travelStatusText(state),[['Back to exploring',close]]);break;
      case 'vending':vending();break;
      case 'coin-laundry':coinLaundry();break;
      case 'recycle-cans':recycleCans();break;
      case 'sakura-specials':specialsMenu();break;
      case 'resident':resident(name);break;
      case 'neighbour':neighbour(name);break;
      case 'visit-home':show(name,'Choose an apartment to visit.',[...detail.map(home=>[home.name,()=>{close();home.enter();}]),['Back',close]]);break;
      case 'izakaya-menu':izakayaMenu();break;
      case 'izakaya-table':izakayaTable();break;
      case 'onsen':onsen();break;
      case 'onsen-pay':onsenPay();break;
      case 'onsen-milk':onsenMilk();break;
      case 'onsen-change':onsenChange();break;
      case 'massage-chair':massageChair();break;
      case 'sakura-medicine':sakuraMedicine();break;
      case 'sakura-counter-goods':sakuraCounterGoods();break;
      case 'kyushoku':kyushoku(name,detail);break;
      case 'school-pantry':schoolPantry(name);break;
      case 'school-teacher':schoolTeacher(name);break;
      case 'school-taps':show('Wash station','Brass push taps over a concrete trough. You press one and it runs cold for exactly as long as you hold it. There is an orange net of soap hanging from the pipe, and somebody\'s blue sandal.',[['Rinse the sand off your feet',()=>{onTime(2);receipt('Wash station','Cold, clean, and the sand runs off down the trough. Your feet dry on the corridor concrete in a minute.');}],['Leave',close]]);break;
      case 'izakaya-gossip':izakayaGossip();break;
      case 'izakaya-phone':izakayaPlay.phone();break;
      case 'bottle-keep':izakayaPlay.bottleKeep();break;
      case 'karaoke':izakayaPlay.karaoke();break;
      case 'ramen-ticket':ramenTickets.machine();break;
      case 'city-dinner':cityDinner(name,detail);break;
      case 'city-trip':show('Evening boat to Naha','Thuan is at the terminal in a cardigan over the yellow blouse, with a cloth bag and the ferry tickets already bought. Fifty minutes across to Tomari, a taxi up to Kokusai-dōri, and a table by the window at Hoshizora, on the top floor of the Hotel Ryūsei. The last boat back leaves at half past eleven.',[['Board with Thuan',()=>{close();onTime(CITY_RESTAURANT.crossing);detail?.go?.();}],['Not tonight',close]]);break;
      case 'cat':cat();break;
      case 'fishing':fishing();break;
      case 'ganaha':ganaha(detail);break;
      case 'arcade':arcade();break;
      case 'sakura-flyer':sakuraFlyer(name);break;
      case 'harbour-notice-board':harbourNoticeBoard();break;
      case 'inspect':inspect(name,detail);break;
      // A broadcast is watched, not filed: the set is switched off, nothing goes in the archive.
      case 'watch':show(name,String(detail||''),[['Switch it off',close]]);break;
      case 'motor-bench':motorBench(name,detail);break;
      case 'read':if(typeof detail==='string')fileDocument(state,{type:'Notice',title:name,text:detail,source:'notice:'+name,organisation:'Community Hall'},getMinutes());save();read(name,detail);break;
      case 'machine':operate(name,detail);break;
      case 'store-table':tableService();break;
      case 'seat':sit(name,detail);break;
      case 'buy':buy(name,detail);break;
      case 'radio':radio(name,detail);break;
      case 'ramen':if(getTableService())tableService();else show('Sato Ramen','Take a counter seat to order ramen, onigiri, steamed buns or tea. The cook prepares your meal and serves it at your place.',[['Take a seat',close]]);break;
       case 'phone':show('Public telephone','A handwritten card lists the harbour office.',[['Call harbour office · ¥10',()=>{if(spend(10)&&!onPhone())receipt('Harbour office','“The Harbour Line runs to the northern terminal. Port operations continue through the night. Speak to the harbour master if you want to sell a catch.”');}],['Hang up',close]]);break;
       case 'bus':receipt('Harbour Line timetable',ferryTimetableText(getMinutes()));break;
      case 'shrine':show(typeof name==='string'&&name?name:'Neighbourhood shrine',typeof detail==='string'&&detail?detail:'The street sounds soften behind the torii gate.',[['Make an offering · ¥5',()=>{if(spend(5)){tone(420,.7);show('Set an intention','A bell note hangs above the roofs. Choose one thing to carry back into the street.',['Book','Work','Home'].map(intent=>[intent,()=>{state.shrineIntent=intent;note('Shrine intention: '+intent+'.');receipt('A quiet moment',intent+'. Noted.');}]));}}],['Leave',close]]);break;
    }
  }

  $('#closeActivity').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  document.addEventListener('keydown',e=>{if(!modalOpen)return;if(e.code==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const focusable=[...modal.querySelectorAll('button:not(:disabled),a[href],iframe,input:not(:disabled),[tabindex="0"]')];const index=focusable.indexOf(document.activeElement);e.preventDefault();focusable[(index+(e.shiftKey?-1:1)+focusable.length)%focusable.length]?.focus();}});
  $('#notebookButton').onclick=inventory;
  $('#soundButton').onclick=toggleSound;
  // Random → Sunny → Cloudy → Rain; the town owns the weather.
  $('#weatherButton').onclick=()=>{const label=onWeather?.('cycle');if(typeof label==='string')$('#weatherButton').textContent=label;save();};
  $('#timeButton').onclick=()=>onTime('cycle');
  $('#playerButton').onclick=players;
  $('#creditsButton').onclick=()=>show('Credits','Everyone in town: Shimanchu islanders, original characters built in code by Johansson World (src/avatars).\nThree.js r170 · MIT.\nBranching dialogue system: Godot Open Dialogue System by Tina Qin (QueenChristina) · MIT. Reimplemented in JavaScript from the GDScript; the dialogue data format and its rules are kept. Town dialogue is original writing.\nTouch joystick: Virtual Joystick for Godot by Marco Fazio (MarcoFazioRandom) \u00b7 MIT. Reimplemented in JavaScript; the joystick and visibility modes and the dead-zone output curve are kept, so the stick is drawn only where and when a thumb is down.\nCel shading, screen-space ink and the anime colour grade: Sakura Crossing by Kenton Wang (Kenton-GMI) \u00b7 MIT. The gradient ramps, the violet shadow-band patch, the depth second-difference line work and the split-tone grade are ported; the materials here are converted at runtime rather than authored, and photographic textures are only partly flattened.\nKonbini counter ritual, stamp card and receipt: inspired by Yorimichi by emaxsaun · MIT. Design only, no code; adapted to 1997, which had neither IC cards nor bag charges.\nEntry board design language: AsagaoUI by Hiroshi ISOBE · MIT, following the Japan Digital Agency design system. Colour ramps, type scale, spacing, rounding and focus ring ported as CSS; no framework code, icons or illustrations included.\nVending Machine: Don Carson / Poly Pizza · CC BY 3.0. Adapted materials, glass removed, original fictional branding added. Source and licence links: assets/ATTRIBUTION.md.\nPoly Haven / Texture Haven: asphalt, plaster, timber and roof albedo, normal and packed ARM maps · CC0.\nIndustrial Sunset 02 environment lighting: Sergej Majboroda / Poly Haven · CC0.\nTomonoura centreline data: © OpenStreetMap contributors · ODbL 1.0. The local extract and adapted layout are included with the source.\nOpenGameArt: concrete and bamboo by YCbCr; stone paving by para · CC0.\nPotted plant: Polygonal Mind, discovered through ToxSam OS3A · CC0.\nMinato Izakaya exterior: BenMaher, Izakaya - Low Poly Building · CC BY 4.0 per supplied source metadata. Texture and entrance adaptations by Johansson World.\nOffice interior: user-supplied Tomodachi Life model, source upload by Unknown Person.\nSato Ramen exterior and interior: Japanese Restaurant Inakaya by Jellepostma, CC BY 4.0. Adapted customer aisle, seating and interactions by Johansson World. Source and licence links: assets/ATTRIBUTION.md.\nLACK side table and IVAR pine cabinet: IKEA / Inter IKEA Systems. Adapted in Blender for the town palette. Model sources: assets/models/furniture/SOURCES.json.\nTown geometry, procedural fallback and original rendered Foley/instrumental loops: Johansson Town.\nQwen3-TTS CustomVoice: four generated Japanese dialogue clips, model licence Apache 2.0; provenance in assets/audio/voices/.\nambientCG remains a proposed source; its assets are not included in this revision.\nSee assets/ATTRIBUTION.md for the licence ledger.',[['Close',close]]);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});

  if(Number.isFinite(state.minutes))onTime({restore:state.minutes});townAudio.setEnabled(state.sound);
  $('#soundButton').textContent=state.sound?'On':'Off';radioStation=state.radioStation||0;save();{const label=onWeather?.('start');if(typeof label==='string')$('#weatherButton').textContent=label;}
  return {action,documentArchive,inventory,bag,residentRecord,residentRecords,canResidentRecord,close,save,saveBeforeLeaving,keepPhoto,letGoPhoto,pocketAlbum,get album(){return state.pocketAlbum||[];},post,deliverPost,favourCard,get unreadPost(){return unreadCount(ensurePost(state).box);},spend,players,menu:show,dialogue:dialogueBox,onsenPaid:()=>state.onsenPaidDay===Math.floor(getMinutes()/1440),thuanStory,konbiniCounter,konbiniBasket,takeAbsence(){const elapsed=pendingAbsence;pendingAbsence=0;return elapsed;},note,inspectItem,openURL,quietRead,footstep(material){townAudio.step(material);},get paused(){return modalOpen;},get viewerActive(){return !!(woodlandView||magazineView);},get state(){return state;},visit(id){if(!state.visited.includes(id)){state.visited.push(id);save();}},tick(dt){ledgerView?.update();if(advancePrint(state,dt)){save();say('Your Form 3D model is ready. Collect it at the workshop.',5);}}};
}
