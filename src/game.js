import {preloadTradePosters,tradePostersReady} from './world/interiors/sakura-trade-posters.js';
import {BLUE_CORAL} from './world/blue-coral-shop.js';
import {FERRY_H1_ENABLED} from './world/ferry-engine-room-plan.js';
import {createFerryExploration,withFerryInteriorView} from './render/ferry-exploration.js';
import {createFerryExplorationUI} from './ui/ferry-exploration.js';
import {canonicalResidentName} from './desktop/life-state.js';
import {createLinuxLife} from './desktop/life.js';
import {buildLinuxBedroom} from './desktop/bedroom.js';
import {workshopPropsReady,preloadWorkshopProps} from './world/interiors/workshop-props.js';
import {createLaunchReport} from './render/launch-report.js';
import {BUDGET} from './edition.js';
import {createAttention} from './people/attention.js';
import {setStandFilter} from './people/full-life.js';
import {createStartupRecovery,graphicsProfile,drawingDpr} from './render/startup-recovery.js';
import {withVisibleMaterials} from './render/compile-visible.js';
import {createResolutionGovernor} from './render/resolution-governor.js';
import {redrawReleasedCanvases,paintBack,releasedCanvasCount} from './render/canvas-release.js';
import {CAST_RECIPES,recipeFor} from './avatars/cast.js';
import {createLensOcclusion} from './render/lens-occlusion.js';
import {houseboatCabinAt} from './world/fujita-houseboat.js';
import {FERRY_LADDER} from './world/ferry-inspect.js';
import {PLANT_STATIONS,stationMenu} from './world/ferry-plant-controls.js';
import {BELOW_DECK_FLOORS} from './world/ferry-interior.js';
import {WEATHERS,WEATHER_CHANGE_MINUTES,weatherLine,nextWeather,readWeather,writeWeather} from './world/weather.js';
import {izakayaOpen} from './people/social.js';
import {closedGreeting} from './people/izakaya-hours.js';
import {createPointWalk,ROOM_STEP} from './input/point-walk.js';
import {createColliderGrid} from './world/collider-grid.js';
import {createLightBudget} from './render/light-budget.js';
import {japaneseSign,signText} from './world/okinawa/signs.js';
import {WARDROBE_KEY} from './avatars/wardrobe.js';
import {createIslandPlay,NAHA_ARRIVALS} from './island/play.js';
import {createFerryWalk} from './world/ferry-walk.js';
import {buildAirportArrivals} from './world/interiors/airport-arrivals.js';
import {createBookshopCustomers} from './people/bookshop-customers.js';
import {createPhotoStudio} from './photo/studio.js';
import {createGamepadInput,createMenuRepeat,lookStep} from './input/analogue.js';
import {createTouchSticks} from './input/touch-sticks.js';
import {createCameraControls,navigateControls,focusableControls} from './input/camera-controls.js';
import {createTownCatchup,MAX_ABSENCE_MINUTES} from './people/town-absence.js';
import {createTownCleanup} from './world/town-cleanup.js';
import {streetToRoom,roomToStreet} from './world/doorway.js';
import {buildClassroom} from './world/interiors/classroom.js';
import {buildOnsenInterior,ONSEN_ROOM,ONSEN_ASSETS} from './world/interiors/onsen.js';
import {loadAsset,assetLoaded} from './catalog/catalog.js';
import {realTownMinutes,clockCatchUp,townClockLineAt,readClockSetting,writeClockSetting,startingMinutes,createClock} from './town-clock.js';
import {createRamenPlayerService} from './people/ramen-player-service.js';
import {hasRamenTicket,useRamenTicket} from './people/ramen-ticket.js';
import {createRamenKitchen} from './people/ramen-kitchen.js';
import {SAKURA_LAYOUT} from './world/interiors/sakura-layout.js';
import {createSakuraShop} from './people/sakura-shop.js';
import {createIslandBusinesses,businessId} from './world/businesses.js';
import {buildCompactShop} from './world/interiors/compact-shops.js';
import {buildBusinessContent,BUSINESS_CONTENT_CATALOGUE} from './world/interiors/business-content.js';
import {WAREHOUSE} from './world/warehouse.js';
import {assignWorkplaces} from './people/workplaces.js';
import {createHomeResidents} from './people/home-residents.js';
import {buildPoliceStationInterior} from './world/interiors/police-station.js';
import {buildKitahamaShopRoom,kitahamaShopRoomReady} from './world/interiors/kitahama-shop-room.js';
import {buildPortHall} from './world/interiors/port-hall.js';
import {PORT_BUILDING} from './world/port-building.js';
import {chooseOpening,OPENINGS,recoverSakuraBenchCheckpoint} from './world/openings.js';
import {createMotion,createAutoRun,swipeLook,steerYaw} from './input/touch-feel.js';
import {createRecorder,createPlayer} from './input/replay.js';
import {createPocketViewfinder} from './photo/pocket-viewfinder.js';
import {packShades,PHOTO_W,PHOTO_H} from './photo/pocket-album.js';
import {peopleInPhoto,placeOfPhoto,explainPerson} from './photo/pocket-subjects.js';
import {pocketModelFor} from './photo/pocket-models.js';
import {decodeRecipe} from './avatars/recipe.js';
import {buildSatoRamenRoom} from './world/interiors/sato-ramen.js';
import {SATO_ROOM,SATO_COLLIDERS,SATO_MENU,SATO_RAMEN,SATO_GUEST_SEATS,SATO_LUNCH_DRINK,satoRamenOpen} from './world/sato-ramen-layout.js';
import {transitStop} from './world/transit.js';
import {homeOwner} from './people/home-life.js';
import {buildResidentHome} from './world/interiors/resident-home.js';
import {createWorkplaceResidents} from './people/workplace-residents.js';
import {createResidentLedger} from './people/resident-personalities.js';
import {createTownActivities} from './people/town-activities.js';
import {createVenueService,MEALS} from './people/venue-service.js';
import {buildWarehouseInterior} from './world/interiors/warehouse.js';
import {createDetailStream} from './world/detail-stream.js';
import {createTownSections} from './render/town-sections.js';
import {createShopStreetView} from './render/shop-street-view.js?konbini-1';
import {createNeighbourChats,createChatBubble,clearChatLine} from './people/neighbour-chats.js?konbini-1';
import {createFacing} from './people/facing.js';
import {createIndoorResidents,IZAKAYA_GUEST_SEATS} from './people/indoor-residents.js?konbini-1';
import {buildSuppliedRoom,suppliedRoomBoundsBlocked} from './world/supplied-rooms.js?snappy=1';
import {travelProgress} from './progression/travel.js';
import {openWant,wantPool,heartLine,withArticle} from './people/friendship.js';
import {ensureDailyQuests,form3NudgeAllowed,hasDailyQuest,isDailyDone,markDailyDone,FORM3_NUDGE,QUAY_NUDGE,RADIO_821} from './progression/soft-quests.js';
import {buildIzakayaRoom,preloadIzakaya,izakayaReady} from './world/izakaya.js?snappy=1';
import {createIzakayaGuests} from './people/izakaya-guests.js';
import {controlVisibility,roomExitVisible} from './interact/control-visibility.js';
import {createContextRail} from './interact/context-actions.js';
import {createTownSky} from './render/sky.js';
import {createIndoorCeilings} from './render/indoor-camera.js';
import {freeSlot} from './world/seat-slots.js';
import {createSpawnScene} from './render/spawn-scene.js';
import {conversationViewport} from './conversation-layout.js';
import {createBalloonPresenter,projectBalloonPerson,balloonViewport} from './dialogue/world-balloon.js';
import {portraitConversationShot} from './dialogue/conversation-framing.js';
import {shelfAimScore} from './interact/aim.js';
import {atmosphere} from './render/atmosphere.js?dusk-1';
import {clock as duskClock, daylight} from './render/dusk.js';
import {setRoadPaintLight} from './world/road-standards.js';
import {setOceanLight} from './world/ocean.js';
import {eveningNews,newsOn} from './feed/evening-news.js';
import {typhoonAt,typhoonBulletin} from './world/typhoons.js';
import {buildMayorHome,buildCommunityKitchen,buildClinic,MAYOR_HOME_FLOOR} from './world/interiors/town-hall.js';
import {HOUSE_SAVE} from './world/johansson-house.js';
import {createHomeCustomization} from './world/interiors/home-customization.js';
import {buildCityRestaurant,CITY_RESTAURANT} from './world/interiors/city-restaurant.js';
import {buildUpperHome} from './world/interiors/upper-home.js';
import {stepInside} from './world/room-arrival.js';
import {SAKURA_STAIR_PASSAGE,SAKURA_STAIR_CLIMB,toOffice,onSakuraStairFoot,onSakuraStairHead} from './world/interiors/sakura-stairs.js';
import {buildSakuraOfficeRoom} from './world/interiors/sakura-office-room.js';
import {SAKURA_BACK} from './world/okinawa/old-town.js';
import {buildFamilyHome} from './world/interiors/family-home.js';
import {loadTownEnvironment} from './render/environment.js';
import {createHands} from './interact/hands.js?ui=compact-3';
import {lineFeeling} from './avatars/body-language.js';
import {sharedMind,startMindIfChosen} from './people/thuan-mind.js';
import {createNeighbourWriter} from './people/town-mind.js';
import {MOVES} from './avatars/moves.js';
import {EXPRESSION_NAMES,EXPRESSION_GLYPHS} from './avatars/face.js';
import {createAvatarJohansson,playerRecipe,playerRecipeKey} from './avatars/actors.js';
import {TABLE_DRINK_KINDS} from './avatars/table-drink.js';
import {setSwingFocus} from './avatars/springs.js';
import {createBeerService,createDrinkProp,createBiteProp,setPropPortion,DRINKS} from './people/izakaya-beer.js';
import {DRUNK,LAGER_ALCOHOL,soberUp,wantsAnother,drink as drinkUp} from './people/drunk.js';
import {createShopCarry} from './interact/shop-carry.js';
import {townAudio} from './audio/town-audio.js?snappy=1';
import {emptyFor,canColour} from './commerce/vending-catalogue.js';
import {SPECIAL_BY_NAME} from './commerce/sakura-specials.js';
import {HOT_SNACKS} from './commerce/konbini.js';
import {routeAt,groundHeight,planHeight,setWalkSurface} from './world/layout.js?snappy=1';
import {createWalkSurface} from './world/walk-surface.js';
import {COAST_BOUNDS} from './world/island-coast.js';
import {createNeighbours} from './people/neighbours.js';
import {sakuraClerkAt} from './commerce/sakura-rota.js';
import {createFerryCrewAboard} from './people/ferry-crew-aboard.js';
import {drawTownMap} from './world/map.js?snappy=1';
import {residentCards,canonicalHomeSites} from './people/home-directory.js';
import {renderTownDirectory} from './ui/town-directory.js';
import {createFerryOperationsView} from './ui/ferry-operations-view.js';
import {crewOnDuty} from './people/ferry-crew.js';
import {createWalkingRoute} from './navigation/walking-route.js';
import {HARBOUR_PARK_ALIASES,HARBOUR_PARK_SEATS} from './world/harbour-park-plan.js';
import {SAKURA_FLOWER_STAND} from './world/okinawa/old-town.js';
import {MAIN_ROAD,SHOP_CROSSING_Z} from './world/main-road.js';
import {AIRPORT_LANDING,AIRPORT_LANDING_HEIGHT} from './world/airport-ground.js';
import * as THREE from '../vendor/three.module.js';
import { createTown } from './world/town.js?snappy=1';
import { createActivities } from '../activities.js?snappy=1';
import { createInspector } from '../inspect-3d.js';
import {createItemViewer} from './world/interiors/item-viewer.js';
import { createCastAI } from './people/schedules.js?snappy=1';
import { createCharacters } from './people/characters.js?snappy=1';
import { circleHitsRect,circleHitsCircle,standingHitsRect,canStepBetween,roomBoundsBlocked,townBoundsBlocked } from '../physics.js?snappy=1';
import {useTownColour} from './render/single-pass-colour.js';
import { createCelPass } from './render/cel.js?snappy=1';
import { createInkPipeline, GRADE_DEFAULTS } from './render/ink-pipeline.js?snappy=1';
import {LOOKS,isLook,clearSavedLook,lookCSS,lookNeedsPipeline,lookFlatten} from './render/looks.js';
import {createFreeCamera} from './input/free-camera.js';
import {createLookPicker,lookSwatch} from './ui/look-picker.js';
import {createLookPreviews} from './render/look-previews.js';
import {setupTownBookHome} from './ui/town-book-home.js';
import {svg as uiIcon} from './ui/icons.js';
import { createInkRecovery } from './render/ink-recovery.js';
import {createGraphicsLifecycle} from './render/graphics-lifecycle.js';
import {BUILD_CATALOGUE} from './build/catalogue.js';
import {DOOR_KEEP_CLEAR} from './world/street-lamps.js';
import {SERVICE_BAYS} from './world/town-traffic.js';
import {AIRPORT_VEHICLE_YARD,airportVehicleBay} from './world/airport-vehicle-yard.js';
import {createPlacements,readPlacementsFile,PLACEMENTS_FILE,PASSAGE} from './build/placements.js';
import {createBuildMode} from './build/build-mode.js';
import {showHomeFurniture} from './build/home-decorate.js';
import {cleanStudioChoices,applyStudioChoices,studioKey} from './studio-handoff.js';
import {createGraphicsInspector} from './render/graphics-inspector.js';
import {dressHud,runButtonFace} from './ui/hud-icons.js';
import {createQuietHud} from './ui/quiet-hud.js';
import {decoratorEnabled} from './features.js';
import {loadHatModels} from './catalog/hat-models.js';
// The hats people wear from World's catalogue (Johansson's trucker cap) are in hand before the town's people are built, so
// nobody starts in the stand-in. Loaded here, not in boot.js, so the boot chunk stays small and three.js stays in this chunk
// (tests/runtime-package.test.mjs). A failure leaves the stand-in (src/catalog/hat-models.js).
const loadingProgress=window.__JOHANSSON_LOADING__;
// Yield before large synchronous jobs so their real stage/count can be painted.
const paintLoading=()=>new Promise(resolve=>{requestAnimationFrame(()=>setTimeout(resolve,0));setTimeout(resolve,120);});
loadingProgress?.complete('code');loadingProgress?.watch(THREE.DefaultLoadingManager);
const launchReport=createLaunchReport({storage:(()=>{try{return globalThis.localStorage;}catch{return null;}})(),events:globalThis});
let firstPlayFrame=false,firstFrameReported=false,reportNextAt=0;
const startupRecovery=window.__JOHANSSON_STARTUP_RECOVERY__||createStartupRecovery({storage:(()=>{try{return globalThis.sessionStorage;}catch{return null;}})(),search:location.search,events:globalThis});
window.__JOHANSSON_SAFE_GRAPHICS__=startupRecovery.safe;
// A full-effects retry is one attempt, never a permanent override of recovery.
if(new URLSearchParams(location.search).get('graphics')==='full'){const url=new URL(location.href);url.searchParams.delete('graphics');history.replaceState(history.state,'',url);}
loadingProgress?.start('accessories');
await loadHatModels(undefined,{timeout:8000,onProgress:(done,total,failed)=>loadingProgress?.fileProgress('accessories',done,total,failed)}).catch(error=>{console.warn('Hat models unavailable:',error);return false;});

loadingProgress?.complete('accessories');

// Change the emitted game chunk URL when repairing a cached live runtime.
window.__JOHANSSON_RUNTIME_VERSION__='ios-colour-2';

const $=s=>document.querySelector(s);
/** The Town book's home screen of icon tiles (ui/town-book-home.js); set up once the book's buttons are wired. */
let townBook=null;
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
// The offline Linux edition (steam-deck/) draws as a desktop whatever its input.
const mobile=!window.johanssonDesktop&&(isIOS||touch);
// Drawing detail follows the screen, not the input: a touchscreen laptop whose main pointer is a mouse or
// trackpad draws like a desktop.
const handheld=!window.johanssonDesktop&&(isIOS||matchMedia('(pointer:coarse)').matches);
const graphics=graphicsProfile({mobile:handheld,tablet:handheld&&Math.min(innerWidth,innerHeight)>=700,safe:startupRecovery.safe,reduced:startupRecovery.reduced});
const highTier=graphics.shadows,shadows=graphics.shadows,canvas=$('#game');
const dprGovernor=createResolutionGovernor();
const renderDpr=()=>drawingDpr({width:innerWidth,height:innerHeight,deviceDpr:window.johanssonDesktop?1:window.devicePixelRatio||1,profile:graphics,scale:dprGovernor.scale});
/**
 * Keeps the frame rate up on slower devices: if frames average slower than about 24 a
 * second for a few seconds, the drawing buffer steps down a notch. Sustained
 * headroom restores detail slowly, with a settling interval between changes.
 */
/**
 * A "!" card over anyone who wants something today (people/friendship.js), the way a
 * life sim shows who has something to ask. Checked every couple of seconds, not every frame.
 */
let wantCardTexture=null,wantCardTimer=0;
function wantCard(){
 if(wantCardTexture)return wantCardTexture;
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
 ctx.fillStyle='#ffffff';ctx.strokeStyle='#2e2a33';ctx.lineWidth=8;ctx.beginPath();ctx.roundRect?.(14,10,100,92,26);if(!ctx.roundRect)ctx.rect(14,10,100,92);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(52,100);ctx.lineTo(64,122);ctx.lineTo(76,100);ctx.fill();ctx.stroke();ctx.fillStyle='#ffffff';ctx.fillRect(50,94,28,10);
 ctx.fillStyle='#e2563f';ctx.font='900 72px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',64,58);
 wantCardTexture=new THREE.CanvasTexture(c);wantCardTexture.colorSpace=THREE.SRGBColorSpace;return wantCardTexture;
}
/**
 * The post round (src/mail/post.js: the mailbag up from Ms Ganaha's counter at half past ten), checked every couple
 * of town seconds as part of the simulation: what came is said once, and the box inside the mayor's door shows it.
 */
let postTimer=0,postNotice=null;
function updatePost(dt){
 if((postTimer-=dt)>0||!activities?.state)return;postTimer=2;
 const delivered=activities.deliverPost?.()||[];
 if(delivered.length)postNotice=delivered.length===1?`The post has come: a letter from ${delivered[0].from}.`:`The post has come: ${delivered.length} letters.`;
 activeRoomLayout?.refreshPost?.();
 // Said once, and only where it can be acted on soon: out of doors, on your feet and ashore. In a shop, at a table or
 // aboard the ferry it waits (the creator, 2026-10-13: the notice need not show all the time); the box inside the
 // mayor's door keeps the count meanwhile.
 if(postNotice&&!current&&!seated&&!deckUnder()){nudge(postNotice,4);postNotice=null;}
}
function updateWantCards(dt){
 if((wantCardTimer-=dt)>0||!activities?.state)return;wantCardTimer=2;
 const names=wantPool();
 for(const p of world.people){
  // Today's want shows in town; a favour to ask shows wherever they are (people/favours.js).
  const g=p.g,name=g.userData.name,want=activities.favourCard?.(name)||(!current&&openWant(activities.state,minutes,names,name));
  let card=g.userData.wantCard;
  if(!want){if(card)card.visible=false;continue;}
  if(!card){card=new THREE.Sprite(new THREE.SpriteMaterial({map:wantCard(),depthTest:true,transparent:true}));card.scale.set(.42,.42,1);card.name='Want card';card.raycast=()=>{};card.userData.dynamicProp=true;g.add(card);g.userData.wantCard=card;}
  const head=characters?.conversationTarget?.(g);card.position.set(0,head?Math.max(1.6,head.y-g.position.y+.62):2.2,0);card.visible=true;
 }
}
function governResolution(dt){
 if(!mobile)return;
 if(dprGovernor.sample(dt,{active:started&&!document.hidden&&!roomLoading&&!activities?.paused}))resizeRenderer();
}
loadingProgress?.start('graphics');
await paintLoading();
launchReport.stage('Creating graphics context');
const renderer=new THREE.WebGLRenderer({canvas,antialias:graphics.antialias,powerPreference:'high-performance',alpha:false,stencil:false,preserveDrawingBuffer:false});
// Counted per frame, across every pass, so renderInfo (audit) reads a whole frame's draw calls.
renderer.info.autoReset=false;
renderer.setPixelRatio(renderDpr());renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=shadows;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xb8dce9);scene.fog=null;// The near plane sets how much of the depth buffer the first metre eats, and at 7cm
// One count of point lights for every frame, so no lamp switching on or off recompiles the town's shaders (light-budget.js).
const lightBudget=createLightBudget(scene);
// it was eating most of it: a phone could not tell two centimetres apart at the far
// end of the street, and the harbour came back from one as flashing texture. Nothing
// gets within 15cm of the eye -- collision keeps the camera a third of a metre off
// any wall -- so the tighter plane bought nothing and cost better than twice the
// precision everywhere else.
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.15,640);
const bands=new Uint8Array([48,48,48,255,115,115,115,255,184,184,184,255,255,255,255,255]),gradient=new THREE.DataTexture(bands,4,1,THREE.RGBAFormat);gradient.needsUpdate=true;gradient.magFilter=THREE.NearestFilter;gradient.minFilter=THREE.NearestFilter;
const outlineMat=new THREE.MeshBasicMaterial({color:0x252821,side:THREE.BackSide}),boxCache=new Map();
const toon=(c,map=null)=>new THREE.MeshStandardMaterial({color:c,map,roughness:.82});
const boxGeo=s=>{const k=s.join(',');if(!boxCache.has(k))boxCache.set(k,new THREE.BoxGeometry(...s));return boxCache.get(k)};
function box(size,pos,color,parent,outline=true){const g=boxGeo(size),m=new THREE.Mesh(g,toon(color));m.position.set(...pos);m.castShadow=shadows;m.receiveShadow=shadows;parent.add(m);return m}
function signTex(a,b,accent='#9b4035'){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='#efe3c7';x.fillRect(0,0,512,128);x.fillStyle=accent;x.fillRect(0,0,14,128);x.strokeStyle='#252821';x.lineWidth=5;x.strokeRect(5,5,502,118);x.fillStyle='#252821';x.textAlign='center';x.textBaseline='middle';x.font='700 43px Yu Gothic,system-ui';signText(x,japaneseSign(a),256,50,465,43);x.font='800 15px system-ui';signText(x,b.toUpperCase(),256,99,465,15);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}

const townSections=createTownSections({mobile});window.__JOHANSSON_SECTIONS__=townSections.stats;
const shopStreetView=createShopStreetView();window.__JOHANSSON_SHOP_VIEW__=shopStreetView.stats;
/** Rooms that look out on the real street through their front: Sakura's glass, Minato's door and window. */
function streetFrontageOf(site){if(site?.officePortals)return {portals:site.officePortals};if(!site?.streetFrontage)return null;if(site.id==='market')return {...site.streetFrontage,interiorZ:sakuraShop.layout.frontZ};return site.id==='izakaya'||site.id==='ramen'?site.streetFrontage:null;}
const town=new THREE.Group(),room=new THREE.Group();scene.add(town,room);room.visible=false;

// The drawn look, after Sakura Crossing (Kenton-GMI, MIT): quantised light with
// violet shadows, screen-space ink from the depth buffer, and an anime colour grade.
// Both halves fail soft — if the pipeline cannot be built the town renders exactly as
// it did before, which matters more than the look does.
const celPass=createCelPass();
/**
 * How the town is drawn, and what happens when the driver says no.
 *
 * The ink and the grade are the look. They used to be given up for the whole session
 * on the strength of one bad frame: a single throw disposed the pipeline, set it to
 * null and left the town rendering plain until reload. On a phone that is the wrong
 * trade. iOS drops and restores WebGL contexts under memory pressure and when a tab
 * is backgrounded, so the frame that fails is usually a moment rather than a verdict,
 * and what the player sees is the cel shading vanishing mid-walk and never returning.
 *
 * So a failure now costs a few seconds instead of the session. The pipeline is rebuilt
 * after a cooling-off that lengthens each time, a few times over, and a restored
 * context resets that immediately. A driver that truly cannot do it settles into the
 * plain path after the retries, which is where it used to start.
 */
const INK_OPTIONS={
 // One multisampled HDR scene target within the device's pixel budget, then one byte
 // colour target; the canvas itself only receives the FXAA pass and stays single-sample.
 superScale:window.johanssonDesktop?1:graphics.superScale,samples:graphics.samples,preferHalfFloat:graphics.preferHalfFloat,
 pixelBudget:graphics.pixelBudget,
 // Phones and tablets draw the lighter version of a look where it has one (the oil painting's 16 samples, not 64).
 lightLooks:handheld,
 // FXAA is a single pass and it is the one that resolves the line work, so it is
 // worth having on the devices whose buffers need it most.
 fxaa:true,
 // Sakura Crossing grades flat painted colour. This town is built on photographed
 // concrete and timber, which starts darker and busier, so the darks are tinted
 // less heavily and lifted further than the reference does — otherwise the street
 // goes to mud rather than to violet.
 inkOptions:{thickness:1.05,strength:.68,concaveAmount:.25},
 // Bright, soft and saturated, the way a life-sim island is: pale lilac shadows, a
 // gentle lift in the darks and almost no vignette.
 gradeOptions:{shadowTint:0xe0dcf0,lift:.045,saturation:1.08,warmth:.02,vignette:.05}
};
const inkRecovery=createInkRecovery({retries:4,cooldown:3500});
let pipeline=null;
/**
 * Compiles the town's shaders ahead of its first frame, for the target it is drawn into: with the ink pipeline that is
 * its offscreen target (linear output), not the screen (sRGB). Compiled for the screen, every material was compiled
 * twice, once here and again on its first draw: 56 of the 190 programs at startup (docs/LOADING.md batch 5).
 */
function compileTown(object,{async=false}={}){
 const previous=renderer.getRenderTarget();
 try{
  if(pipeline)renderer.setRenderTarget(pipeline.sceneTarget);
  withVisibleMaterials(object,()=>{
   if(async)renderer.compileAsync?.(object,camera,scene)?.catch?.(()=>{});else renderer.compile(object,camera);
  });
 }catch{}finally{renderer.setRenderTarget(previous);}
}
/**
 * The chosen look (render/looks.js; Town tools › Look, or the free camera), for this visit only. With the ink pipeline it is the pipeline's last
 * pass; without it only the colour looks show, as a CSS filter on the canvas. A filter someone else put on the canvas
 * (the photo studio's film) is left alone.
 */
// Every start is Natural, whichever look was used last time (the owner, 22 October 2026).
let look='none',lookFilter='';
clearSavedLook(globalThis.localStorage);
function applyLook(){
 pipeline?.setLook(look);
 // The Cartoon look takes the photographic surface maps away at the material, so its colour is flat before the pass.
 // Without the pipeline nothing would ink it, so the maps stay.
 celPass.scaleFlatten(pipeline?lookFlatten(look):1);
 const css=pipeline?'none':lookCSS(look),want=css==='none'?'':css,el=renderer.domElement;
 if(el.style.filter===lookFilter)el.style.filter=want;
 lookFilter=want;
}
function setLook(name){look=isLook(name)?name:'none';applyLook();}
/** The looks this device can draw, in menu order: the free camera's L and Look button step through them. */
const drawableLooks=()=>Object.keys(LOOKS).filter(id=>graphics.postprocess||!lookNeedsPipeline(id));
function nextLook(){const ids=drawableLooks();setLook(ids[(ids.indexOf(look)+1)%ids.length]);}
/** The Look picker (ui/look-picker.js): a strip of the town in each look (render/look-previews.js), chosen live over it. */
const lookPreviews=createLookPreviews(renderer,()=>pipeline);
const lookPicker=createLookPicker({looks:LOOKS,available:drawableLooks,current:()=>look,choose:setLook,previews:lookPreviews,onOpen:()=>resetInput(),onClose:()=>resetInput()});
function lookMenu(){lookPicker.show();}
/** Plain output, for while the ink is away. */
function renderPlain(){useTownColour(renderer);applyLook();}
function buildInk(){
 if(!graphics.postprocess){renderPlain();return true;}
 try{pipeline=createInkPipeline(renderer,INK_OPTIONS);renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;applyLook();return true;}
 catch(error){pipeline=null;console.warn('Ink pipeline unavailable, rendering plain:',error.message);renderPlain();return false;}
}
buildInk();
loadingProgress?.complete('graphics');
// One lifecycle below owns both context events and pauses every render path.
let graphicsReady=false,graphicsLifecycle=null;
// Listen before the first loading yield: a lost context during town construction
// needs preventDefault too. Gameplay callbacks wait until their state exists.
graphicsLifecycle=createGraphicsLifecycle({canvas,getRunning:()=>graphicsReady&&started,
 setRunning:value=>{if(graphicsReady)started=value;window.__JOHANSSON_RUNNING__=value;},
 save:()=>{if(graphicsReady)activities.save();},resetInput:()=>{if(graphicsReady)resetInput();},suspendInput:()=>{if(graphicsReady)gamepadInput.suspend();},
 dropPipeline:()=>{const old=pipeline;pipeline=null;try{old?.dispose();}finally{renderPlain();}},
 restoreGraphics:()=>{redrawReleasedCanvases();if(graphicsReady){const below=world.ferry?.ferry?.userData.belowDeck;if(below){below.uploaded=false;for(const p of below.plates.children)if(p.material.map)p.material.map.userData.uploaded=false;}}renderer.setRenderTarget?.(null);if(graphicsReady)resizeRenderer();inkRecovery.restored();if(!buildInk())inkRecovery.failed();if(graphicsReady)setTime();},
 resetClock:()=>{if(graphicsReady)clock.getDelta();},followClock:()=>{if(graphicsReady)followClock();},
 onLost:()=>{launchReport.stage('Graphics context lost');const d=$('#fatal');if(d){d.classList.remove('hidden');d.querySelector('p').textContent='Graphics paused safely. Your town will resume when the display recovers.';d.querySelector('button').hidden=true;}},
 onRestored:()=>{launchReport.stage('Graphics context restored');const d=$('#fatal');if(d){d.classList.add('hidden');d.querySelector('button').hidden=false;}},
 onError:(error,phase)=>{console.warn('Graphics '+phase+':',error.message);if(phase==='restore'){const d=$('#fatal');if(d){d.querySelector('p').textContent='Graphics are still paused. Retry when the display is available.';d.querySelector('button').hidden=false;}}}
});
window.__JOHANSSON_LOOK__={get ink(){return !!pipeline;},get inkFailures(){return inkRecovery.failures;},get inkRetrying(){return !pipeline&&inkRecovery.retrying;},cel:celPass.stats,
 get scale(){return pipeline?pipeline.width/Math.max(1,renderer.getDrawingBufferSize(new THREE.Vector2()).x):1;},
 // What the east lawn's planting is actually wearing. The shrubs take the park's own
 // leaf once the model streams in, and when that hand-over goes wrong they render as
 // white blobs on the grass with nothing in the console to say so.
 get planting(){
  let found=null;
  scene.traverse(o=>{if(found||o.name!=='East lawn planting')return;
   found={count:o.count,uv:!!o.geometry.attributes.uv,map:!!o.material.map,
    image:!!o.material.map?.image,tint:'#'+o.material.color.getHexString(),
    instance:o.instanceColor?[...o.instanceColor.array.slice(0,3)].map(v=>+v.toFixed(2)):null};});
  return found;
 },
 // Live knobs, so the look can be judged against the town instead of against numbers.
 tune:v=>pipeline?.tune(v),
 // The chosen look (Town tools › Look), readable and settable for audits.
 get style(){return look;},setStyle:name=>setLook(name),
 flatten:v=>celPass.setFlatten(v),
 focus:v=>pipeline?.setLookFocus(v),
 get lights(){return {ambient,bounce,uplight,sun};},
 get state(){return pipeline?.state||null;}};
let celTick=0;
/** Cel-shades whatever has arrived since the last sweep. Districts stream in for the
 * whole session, so this cannot be a one-off at startup. */
function sweepCel(dt){
 if((celTick-=dt)>0)return;
 celTick=.4;
 celPass.apply(scene);
}
sweepCel(0);
/**
 * Runs one frame's drawing through the ink and grade, or straight out without them.
 *
 * A driver that cannot give us a depth texture or a half-float target throws on the
 * first frame rather than at construction, so the fallback lives here: the look is
 * dropped once, tone mapping comes back, and the town keeps running. Being playable
 * beats being drawn.
 */
/** The island has been drawn once: the title may offer START (or play has begun without a title). */
function islandDrawn(){
 loadingProgress?.complete('preview');
 const title=$('#title'),status=$('#bootStatus');
 if(title)title.dataset.scene='ready';
 if(status)status.textContent=startupRecovery.safe?'Island ready · reduced graphics':'Island ready';
}
function firstFrameReady(){
 if(!started||firstPlayFrame||roomLoading||catchingUp)return;
 firstPlayFrame=true;startupRecovery.running();islandDrawn();loadingProgress?.complete('frame');
}
/**
 * The ferry's engine-room plates (ferry-model.js belowDeck) are drawn only with the lens inside her hull, no higher
 * than the car deck's headroom. From the pier their pictures go up a few a frame, so boarding never waits on them.
 */
const lensInShip=new THREE.Vector3();
function updateBelowDeck(view){
 const ferry=world.ferry?.ferry,below=ferry?.userData.belowDeck;if(!below)return;
 const h1=ferry.userData.engineRoomH1;if(h1){lensInShip.copy(view.position);ferry.worldToLocal(lensInShip);const visible=ferry.visible&&!current&&Math.abs(lensInShip.x)<4.5&&lensInShip.z>-13&&lensInShip.z<9.3&&lensInShip.y<below.carDeck+3;h1.group.visible=visible;if(visible){h1.ensure();h1.illuminate(lensInShip);}}
 let inside=false,near=false;
 if(ferry.visible&&!current){
  lensInShip.copy(view.position);ferry.worldToLocal(lensInShip);
  const dx=Math.abs(lensInShip.x)-below.halfBeam,dz=Math.abs(lensInShip.z)-below.halfLength;
  inside=dx<.3&&dz<.3&&lensInShip.y<below.carDeck+3;near=dx<12&&dz<12;
 }
 below.plates.visible=inside;
 if((near||inside)&&!below.uploaded){
  let sent=0;below.uploaded=true;
  // Inside already (a start below deck, a film's lens): all at once, before the first frame that shows them.
  for(const plate of below.plates.children){const map=plate.material.map;if(!map||map.userData.uploaded)continue;if(!inside&&sent++>=6){below.uploaded=false;break;}paintBack(map);renderer.initTexture?.(map);map.userData.uploaded=true;}
 }
}
function present(draw,view=camera){
 if(graphicsLifecycle?.lost)return;
 updateBelowDeck(view);
 if(!pipeline){
  if(graphics.postprocess&&inkRecovery.ready())buildInk();
  if(!pipeline){draw(renderer);firstFrameReady();return;}
 }
 pipeline.setCamera(view);
 try{pipeline.render(draw);firstFrameReady();}
 catch(error){
  const again=inkRecovery.failed();
  console.warn('Ink pipeline failed, rendering plain'+(again?', retrying shortly':' for good')+':',error.message);
  try{pipeline.dispose();}catch{}
  pipeline=null;
  // Whatever threw may well be the call that unbinds the target, so this one is
  // allowed to fail too rather than take the frame down with it.
  try{renderer.setRenderTarget?.(null);}catch{}
  renderPlain();
  draw(renderer);firstFrameReady();
 }
}
loadTownEnvironment(scene,renderer);
const townSky=createTownSky(scene);
// Two-light anime setup. One warm key that the ramp quantises into flat bands, one
// strong cool bounce from the opposite quarter, and a weak up-light — because an
// anime background has *coloured* shadows rather than dark ones, and the fill has to
// be strong enough to carry them. The hemisphere's ground colour is violet for the
// same reason. MeshToonMaterial ignores scene.environment entirely, so the HDR that
// used to do this work no longer reaches the town and these lights replace it.
// A toon ramp shapes direct light only, and MeshToonMaterial has no image-based
// lighting at all, so the sky fill has to make up what scene.environment used to add.
const CEL_FILL=1.35;
// With tone mapping off, the grade carries the overall level; flat bands need more
// headroom than the rolled-off highlights AgX used to give.
const CEL_EXPOSURE=1.04;
const NIGHT_TINT=Object.freeze({light:GRADE_DEFAULTS.lightTint??0xffffff,shadow:0xe0dcf0});
/** How much of the night is in the grade outdoors (0 by day and indoors, 1 at full night): the shadow lift eases off with it. */
let nightLift=0;
const ambient=new THREE.HemisphereLight(0xdbe7f2,0x6b5f8c,1.15);scene.add(ambient);
const bounce=new THREE.DirectionalLight(0x9db6e8,1.25);bounce.position.set(26,16,-22);scene.add(bounce);
const UPLIGHT=.35,uplight=new THREE.DirectionalLight(0xc9b9e0,UPLIGHT);uplight.position.set(4,-18,6);scene.add(uplight);
/** How far the sun (and the moon) stand from the shadow camera's target, at every hour. */
const SUN_REACH=46;
const sun=new THREE.DirectionalLight(0xffdca8,highTier?2.6:2.3);sun.position.set(-28,38,18);sun.castShadow=shadows;
if(shadows){sun.shadow.mapSize.set(graphics.shadowSize,graphics.shadowSize);sun.shadow.camera.left=-graphics.shadowRadius;sun.shadow.camera.right=graphics.shadowRadius;sun.shadow.camera.top=graphics.shadowRadius;sun.shadow.camera.bottom=-graphics.shadowRadius;sun.shadow.camera.near=.5;sun.shadow.camera.far=120;sun.shadow.bias=-.00035;sun.shadow.normalBias=.045}scene.add(sun);

// Separate bookshop, dock workshop and harbour office keep their own addresses.
const SITES=createIslandBusinesses();

const interactables=[],roomColliders=[],doors=new Map();
let catchingUp=false,hiddenAt=0;
// Declared before the activities are created: they restore a saved clock time through
// onTime() at creation, which reads this. Declared further down, a saved game could not start.
let followRealClock=true;
// Goods off Sakura's shelves, held up to read (item-viewer.js). Made the first time
// something is picked up.
let itemViewer=null;
let inspector=null,content=null,castAI=null,hands=null,storeService=null,ramenPlayerService=null,venueService=null,izakayaTV=null,seated=false,parkSeat=null,touchRunning=false;
// PURPOSE BRIEF soft-guides: calendar dayKey soft quests (stand Form 3 / quay / notice).
// Contextual touch-control state. Declared with the rest of the player state because
// starting play stamps the touch clock, and that can happen while this module runs.
let controlsMovingUntil=0,controlsTargetUntil=0,controlsTouchedAt=0;
let stickHintUntil=0;
// A control under a finger must not be hidden out from under it. Any pointer release
// ends every press, so a control can never stay pinned on by a touch we lost track of.
const pressedControls=new Set();
let neighbours=null,ferryCrew=null,islandPlay=null,ferryOperations=null;let photoOrigin=null,photoReturning=false;
let conversationName=null,conversationCamera=null,navigationTarget=null,beerService=null,tipsy=0,tipsyClock=null;
let navigationPlan=null,navigationPath=[],navigationLeg=null,navigationIndex=1,navigationGeneration=0,navigationRecheck=0,navigationCorridorCheck=0,navigationStarted=0,directoryView=null,directoryResidents=[],mapMode='local';
let activeRoomLayout=null;
let photoStudio=null,photoLoading=false,spawnScene=null;
let concert=null,concertLoading=false;
let ferryWalk=null;
let linuxLife=null,linuxOwnHomeSite=null;const linuxBorrowed=new Map();
// Playing as a resident (desktop/life.js). Linux always plays through it; the web does only while you play someone other
// than Johansson (the owner, 24 October 2026), so Johansson's web opening, house and view stay as they were.
const playingResident=()=>!!linuxLife&&(!!window.johanssonDesktop||linuxLife.active!=='Johansson');
let current=null,active=null,started=false,yaw=0,pitch=-.05,minutes=realTownMinutes(),subtitleTimer=0,weather=false,activities=null,timePreset=0,characters=null;
const keys={},clock=new THREE.Clock();
const gamepadInput=createGamepadInput(),menuRepeat=createMenuRepeat();
let controllerFrame=gamepadInput.sample([]),controllerConnected=false;
const cameraControls=createCameraControls({onChange:()=>syncView(),onCentre:centreCamera,onOpen:()=>resetInput(),onClose:()=>resetInput()});
camera.fov=cameraControls.settings.fov;camera.updateProjectionMatrix();
document.documentElement.classList.toggle('touch-controls',touch);
function centreCamera(){spawnScene?.cancel();pitch=0;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}
function controlsAllowed(){return document.documentElement.dataset.desktopMenu!=='open'&&!concert?.active&&!concertLoading&&!islandPlay?.cinematic&&!spawnScene?.holding&&!photoStudio?.active&&!photoLoading&&!photoReturning&&started&&!document.hidden&&!roomLoading&&!activities?.paused&&!inspector?.active&&!itemViewer?.active&&!cameraControls.active&&$('#directory').classList.contains('hidden')&&$('#qte').classList.contains('hidden');}
// Swipes scale to the screen and barely tip the view when they are mostly sideways (input/touch-feel.js).
function dragLook(dx,dy){if(ferryExploreActive()&&ferryExplorer.mode==='inspect'){const turn=swipeLook(dx,dy,innerWidth,cameraControls.settings);ferryExplorer.orbit(-turn.yaw,-turn.pitch);return;}if(ferryCameraLocked())return;spawnScene?.cancel();const turn=swipeLook(dx,dy,innerWidth,cameraControls.settings);yaw+=turn.yaw;pitch=THREE.MathUtils.clamp(pitch+turn.pitch,-1.25,1.15);}
const walkMotion=createMotion(),touchAutoRun=createAutoRun();
const touchSticks=createTouchSticks({canvas,movePad:$('#stick'),stickBase:$('#stickBase'),stickKnob:$('#knob'),enabled:controlsAllowed,onDrag:dragLook});
async function openPhotoStudio(){if(concert?.active||concertLoading)return;spawnScene?.cancel('photo');
 if(photoLoading||photoStudio?.active||!started||roomLoading||catchingUp||inspector?.active||activities?.paused)return;
 toggleDir(false);cameraControls.close();resetInput();photoLoading=true;photoOrigin={site:current,position:player.position.clone(),yaw,pitch,seated,parkSeat};
 try{
  if(!photoStudio){
   photoStudio=createPhotoStudio({scene,renderer,gameCamera:camera,cameraBlocked,
    getLocations:()=>[...new Map([...SITES.map(s=>({id:s.id,title:s.title,icon:s.homeOwner?'home':'door',site:s})),...(world.landmarks||[]).map(s=>s.id==='warehouse'?{id:s.id,title:s.title,icon:'door',site:s}:{id:s.id,title:s.title,icon:'map',x:s.exitPosition?.[0]??s.x,z:s.exitPosition?.[2]??s.z,y:s.exitPosition?.[1]}),{id:NAHA_ARRIVALS.id,title:NAHA_ARRIVALS.title,icon:'door',site:NAHA_ARRIVALS},{id:NAHA_TRIP.id,title:NAHA_TRIP.title,icon:'bowl',site:NAHA_TRIP},
     ...photoSpots().map(p=>({...p,icon:'map'}))].map(p=>[p.id,p])).values()],
    onLocation:async place=>{if(current)leaveRoom();if(place.site){await enterRoom(place.site);if(!current)throw Error('Room unavailable');}
     else{let x=place.x,z=place.z;if(environmentBlocked(x,z,.32)){[x,z]=findClear(x,z);if(environmentBlocked(x,z,.32))throw Error('Choose a clear place');}player.position.set(x,place.y??groundHeight(x,z),z);yaw=0;pitch=0;}},
    getContext:()=>({position:player.position.clone(),yaw,
     cast:(characters?.actors||[]).map(a=>({name:a.entity.userData.name||a.avatar?.recipe?.name||'Resident',recipe:a.avatar?.recipe,outfit:a.outfit})),
     hide:[camera,johansson?.root,...(characters?.actors||[]).map(a=>a.entity)]}),
    draw:(view,position)=>{if(!current)townSections.render({renderer,scene,camera:view,town,position});else if(streetFrontageOf(current))shopStreetView.render({renderer,scene,camera:view,town,room,frontage:streetFrontageOf(current)});else renderer.render(scene,view);},
    onOpen:()=>{resetInput();neighbourChats.cancel();chatBubble.hide();$('#prompt').classList.remove('on');izakayaTV?.update({camera,active:false,paused:true});townAudio.update({player:player.position,yaw,minutes,rain:weather,inside:!!current,station:activities.state.radioStation||0,paused:true});},
    onClose:()=>{const origin=photoOrigin;photoOrigin=null;photoReturning=true;const restore=async()=>{if(!origin)return;if(current?.id!==origin.site?.id){if(current)leaveRoom();if(origin.site)await enterRoom(origin.site);}player.position.copy(origin.position);yaw=origin.yaw;pitch=origin.pitch;seated=origin.seated;parkSeat=origin.parkSeat;johansson?.seat?.(seated?(parkSeat?.soak?'Soak':'Sit'):null);syncView();};restore().finally(()=>{photoReturning=false;}).catch(e=>console.warn('Photo return failed',e));resetInput();clock.getDelta();if(townClock.mode==='set')townClock.set(minutes,townClock.speed);resizeRenderer();},
   });
  }
  photoStudio.open();
 }catch(error){console.warn('Photo studio could not open',error);say('Photo studio could not open. Please try again.',4);}
 finally{photoLoading=false;}
}
async function openKaraoke(){
 if(concert?.active||concertLoading||photoStudio?.active||photoLoading||!started||roomLoading||catchingUp)return;
 concertLoading=true;spawnScene?.cancel('karaoke');resetInput();
 try{
  const {createConcert}=await import('./music/concert.js');
  concert??=createConcert({renderer,
   getDraft:()=>activities.state.concert,
   saveDraft:draft=>{activities.state.concert=draft;return activities.save();},
   getCast:()=>Object.keys(CAST_RECIPES).map(name=>{const a=characters?.actors?.find(a=>a.entity.userData.name===name);return {name,recipe:name==='Johansson'?playerRecipe():a?.avatar?.recipe||recipeFor(name),outfit:a?.outfit};}),
   soundEnabled:()=>activities.state.sound!==false,
   pay:price=>activities.spend(price,'Minato karaoke session'),
   onFinish:(title,cast)=>{activities.note('Sang '+title+' at Minato with '+cast.join(', ')+'.');activities.save();},
   onOpen:()=>{activities.close();toggleDir(false);cameraControls.close();resetInput();neighbourChats.cancel();chatBubble.hide();$('#prompt').classList.remove('on');izakayaTV?.update({camera,active:false,paused:true});lowerPocket();townAudio.stopSpeech();townAudio.update({player:player.position,yaw,minutes,rain:weather,inside:true,station:activities.state.radioStation||0,paused:true});},
   onClose:()=>{resetInput();clock.getDelta();if(townClock.mode==='set')townClock.set(minutes,townClock.speed);resizeRenderer();},
  });
  concert.open();
 }catch(error){console.warn('Karaoke could not open',error);say('The karaoke machine could not start. Please try again.',5);}
 finally{concertLoading=false;}
}
$('#photoButton').onclick=openPhotoStudio;
/**
 * Free camera (Town book, or O): the town stops where it stands and the lens flies loose round it (input/free-camera.js).
 * The loop draws the frozen world through renderStill; leaving puts the view straight back, as play recomputes it.
 */
const freeCamera=createFreeCamera({canvas:renderer.domElement,settings:()=>cameraControls.settings,look:{id:()=>look,label:()=>LOOKS[look].label,next:nextLook},icon:name=>uiIcon(name),swatch:id=>lookSwatch(id,'free'),onChange:()=>resetInput()});
function openFreeCamera(){
 if(!started||freeCamera.active||photoLoading||photoStudio?.active||inspector?.active||itemViewer?.active||concert?.active||roomLoading||catchingUp||activities?.paused)return;
 if(inspectFerryMachinery())return;
 toggleDir(false);cameraControls.close();if(pocket?.raised)lowerPocket();spawnScene?.cancel('free camera');
 const view=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ'),feet=player.position.y;
 // Seen from outside he has to be there, in the first-person view too; the hands at the lens are not.
 ensureJohansson();
 freeCamera.enter({position:camera.position,yaw:view.y,pitch:view.x},current?{floor:()=>feet,radius:14,ceiling:feet+6}:{floor:(x,z)=>groundHeight(x,z),radius:80});
}
function openCamera(){if(!started||inspector?.active||activities?.paused)return;if(window.johanssonDesktopUI){window.johanssonDesktopUI.open('controls');return;}cameraControls.open();}
/** Named places that are not a building: the photo studio's locations, and where the pocket camera says a photo was taken. */
function photoSpots(){
 const pond=HARBOUR_PARK_SEATS[1].stand,florist=SAKURA_FLOWER_STAND;
 // Keep the saved photo IDs while following the park's current public approach and the flowers, which are at Sakura's
 // door since the Rainflower pavilion came down (phase 4 of docs/CAST-CONSOLIDATION.md).
 return [
  {id:'photo-harbour',title:'Working harbour',at:'at the working harbour',x:-22,z:-39},
  {id:'photo-main',title:'Main shopping street',at:'on the main shopping street',x:-3,z:-20},
  {id:'photo-beach',title:'East beach',at:'on the east beach',x:38,z:-12},
  {id:'photo-garden',title:'Harbour Park pond',at:'beside the pond in Harbour Park',x:pond[0],z:pond[1]},
  {id:'photo-rainflower',title:'Sakura’s flower buckets',at:'at the flower buckets by Sakura’s door',x:florist[0],z:florist[1]},
  {id:'photo-village',title:'Hoshizaki fishing village',at:'in Hoshizaki fishing village',x:132,z:190},
  {id:'photo-lighthouse',title:'West Cape lighthouse',at:'at the West Cape lighthouse',x:-54,z:204},
 ];
}
// The pocket camera the player carries, a Pocket Gentleman or a Pocket Lady by the look they chose (pocket-models.js;
// src/photo/pocket-viewfinder.js): raised to the eye, it shows the view in its four
// shades; the shutter keeps that frame in the album (activities.keepPhoto) with who and where it shows.
let pocket=null,pocketWasThird=null;
// This game's own player (the key fixed when the town started, as the Studio hand-off uses), never another tab's.
const pocketModel=()=>{let r=null;try{r=decodeRecipe(localStorage.getItem(studioKeys.player));}catch{}return pocketModelFor(r||decodeRecipe(activities?.state?.avatarRecipe));};
const pocketSight=new THREE.Vector3(),pocketBox=new THREE.Box3(),pocketUp=new THREE.Vector3(0,.1,0);
function pocketCanRaise(){return !activeRoomLayout?.fixedCamera&&started&&!catchingUp&&!roomLoading&&!photoLoading&&!photoStudio?.active&&!inspector?.active&&!itemViewer?.active&&!activities?.paused&&!cameraControls.active&&!islandPlay?.cinematic&&$('#directory').classList.contains('hidden');}
function raisePocket(){
 if(pocket?.raised)return true;
 if(!pocketCanRaise()){if(activeRoomLayout?.fixedCamera)say('The camera stays in the pocket at the dinner table.',2);return false;}
 spawnScene?.cancel('camera');resetInput();
 pocket??=createPocketViewfinder({source:canvas,count:()=>activities.album.length,model:pocketModel,onShoot:keepPocketPhoto,onLower:()=>{
  // Back to the view he had: behind him again if that is where he was.
  if(pocketWasThird){thirdPerson=true;ensureJohansson();hands.firstPersonVisible=false;}pocketWasThird=null;
 }});
 // The camera is at his eye: in third person the view moves into his eyes while it is up (the setting is not changed).
 pocketWasThird=thirdPerson;if(thirdPerson){thirdPerson=false;hands.firstPersonVisible=true;}
 pocket.raise();return true;
}
function lowerPocket(){pocket?.lower();}
function pocketPeople(){
 // The head where the body is posed (a seated resident's sits lower than a standing height says), from the rig's own
 // head bone when the resident has one; otherwise from their size.
 const heads=new Map((characters?.actors||[]).map(a=>[a.entity,a.avatar?.bones?.head]));
 return residentEntities().filter(g=>residentInView(g)&&!g.userData.playerControlled).map(g=>{
  const name=g.userData.name||g.userData.profile?.name||null,bone=heads.get(g);
  if(bone)return {name,visible:true,position:g.getWorldPosition(new THREE.Vector3()),head:bone.getWorldPosition(new THREE.Vector3()).add(pocketUp)};
  pocketBox.setFromObject(g);
  return {name,visible:true,position:g.getWorldPosition(new THREE.Vector3()),height:Number.isFinite(pocketBox.max.y-pocketBox.min.y)?Math.min(2.2,Math.max(.6,pocketBox.max.y-pocketBox.min.y)):1.6};
 });
}
// Something solid between the lens and a face: the game's own camera test, every 20 cm, short of the face itself.
function pocketBlocked(from,to){
 const d=from.distanceTo(to);
 for(let s=.3;s<d-.45;s+=.2){pocketSight.lerpVectors(from,to,s/d);if(cameraBlocked(pocketSight.x,pocketSight.z,pocketSight.y,.04))return true;}
 return false;
}
function pocketPlaces(){
 return [...SITES.map(s=>{const d=doors.get(s.id);return d?{id:s.id,title:s.title,x:d.x,z:d.z}:null;}),...(world.landmarks||[]).map(s=>({id:s.id,title:s.title,x:s.exitPosition?.[0]??s.x,z:s.exitPosition?.[2]??s.z})),...photoSpots()].filter(Boolean);
}
function keepPocketPhoto(shades,palette=pocketModel().palette){
 camera.updateMatrixWorld();
 const screenAspect=camera.aspect;
 const people=peopleInPhoto({camera,screenAspect,people:pocketPeople(),blocked:pocketBlocked});
 const place=placeOfPhoto({room:current?{id:current.id,title:current.title,at:current.at}:null,places:current?[]:pocketPlaces(),camera});
 const r=activities.keepPhoto({w:PHOTO_W,h:PHOTO_H,shades:packShades(shades),palette,day:Math.floor(minutes/1440),minutes:Math.floor(((minutes%1440)+1440)%1440),place,people,note:''});
 // The shutter: two short beeps, as a digital pocket camera of the time made (town-audio.js blip, our own sound).
 if(r.ok){townAudio.blip(1760,'square',.05);setTimeout(()=>townAudio.blip(1320,'square',.05),70);}
 return r;
}
$('#pocketButton')?.addEventListener('click',()=>{toggleDir(false);raisePocket();});
$('#lookButton')?.addEventListener('click',()=>{toggleDir(false);lookMenu();});
$('#cameraButton').onclick=()=>{toggleDir(false);openCamera();};$('#viewButton')&&($('#viewButton').onclick=()=>{if(started){toggleDir(false);changeView();}});$('#movesButton')&&($('#movesButton').onclick=()=>{toggleDir(false);movesMenu();});
const PLAYER_RADIUS=.28,NPC_RADIUS=.35,MAX_FRAME_DT=.1,SIM_STEP=1/60;
const move2=new THREE.Vector2(),fwVec=new THREE.Vector3(),rtVec=new THREE.Vector3(),moveVec=new THREE.Vector3(),turnQ=new THREE.Quaternion(),yAxis=new THREE.Vector3(0,1,0);

const player=new THREE.Group();scene.add(player);player.position.set(0,0,46);
player.visible=false;

const reg=(o,label,fn,inside=false)=>{o.userData.hit={label,fn,inside};if(!interactables.includes(o))interactables.push(o)};
/**
 * The status line (the creator, 2026-10-13: "The status messages are interfering"): one short line at a time, never
 * the same line twice within a minute and a half, and gone as soon as the player walks on (after it has been readable
 * for 1.2 s) rather than sitting over the view for its whole time.
 */
let lastSaid='',lastSaidAt=-1e9,saidFor=0;
function say(t,sec=3){const now=performance.now();if(t===lastSaid&&now-lastSaidAt<90000&&subtitleTimer<=0)return;lastSaid=t;lastSaidAt=now;saidFor=0;const e=$('#subtitle');e.textContent=t;e.classList.add('on');subtitleTimer=sec}
function hushSubtitle(){if(subtitleTimer>0&&saidFor>=1.2){subtitleTimer=0;$('#subtitle').classList.remove('on');}}
function tickSubtitle(dt){if(subtitleTimer>0){saidFor+=dt;if((subtitleTimer-=dt)<=0)$('#subtitle').classList.remove('on');}
 else if(nudges.length&&performance.now()-lastSaidAt>=20000){const n=nudges.shift();say(n.t,n.sec);}}
/** A tip, a notice or the weather: it waits its turn (nothing on screen, 20 s since the last line) instead of landing on top of what the player is doing. */
const nudges=[];function nudge(t,sec=5){if(nudges.some(n=>n.t===t))return;nudges.push({t,sec});}
// The weather: sunny, cloudy or rain, shared with the title card (world/weather.js). `weather`
// stays the rain flag everything else reads; cloudy only changes the light and the sky.
let weatherKind='sunny',weatherMode='random',nextWeatherAt=0;
const OVERCAST_SKY=new THREE.Color(0xa7bcc6); // dusk.js PALETTE.skyRain
const WEATHER_NAMES={sunny:'Sunny',cloudy:'Cloudy',rain:'Rain'};
const weatherLabel=()=>weatherMode==='random'?'Random · '+WEATHER_NAMES[weatherKind]:WEATHER_NAMES[weatherKind];
function applyWeather(kind,{announce=false}={}){
 weatherKind=kind;weather=kind==='rain';world.setRain(weather);if(activities?.state)activities.state.weather=weather;
 writeWeather({mode:weatherMode,weather:kind});const button=$('#weatherButton');if(button)button.textContent=weatherLabel();
 if(announce&&!current)nudge(weatherLine(kind,minutes),4);
}
function startWeather(){const saved=readWeather();weatherMode=saved.mode;nextWeatherAt=minutes+WEATHER_CHANGE_MINUTES;applyWeather(saved.weather);return weatherLabel();}
function cycleWeather(){
 const order=['random',...WEATHERS],at=weatherMode==='random'?'random':weatherKind,next=order[(order.indexOf(at)+1)%order.length];
 if(next==='random'){weatherMode='random';nextWeatherAt=minutes+WEATHER_CHANGE_MINUTES;applyWeather(weatherKind);}else{weatherMode='fixed';applyWeather(next);}
 return weatherLabel();
}
/** In random mode the weather turns every two town hours. */
function advanceWeather(){
 if(weatherMode!=='random'){if(activities?.state?.typhoon)activities.state.typhoon=null;return;}
 // 1997's real typhoons (world/typhoons.js): while a warning is in force it rains, and the
 // warning is said once when it starts and once when it is lifted. A weather the player
 // fixed is left alone: then there is no typhoon in town.
 const typhoon=typhoonAt(minutes),state=activities?.state;
 if(typhoon){
  if(weatherKind!=='rain')applyWeather('rain');
  if(state&&state.typhoon!==typhoon.number){state.typhoon=typhoon.number;say(`Typhoon No. ${typhoon.number} is coming close to Okinawa. A storm warning is in force.`,6);}
  nextWeatherAt=minutes+WEATHER_CHANGE_MINUTES;return;
 }
 if(state?.typhoon){state.typhoon=null;say('The typhoon warning is lifted.',5);}
 if(nextWeatherAt-minutes>WEATHER_CHANGE_MINUTES)nextWeatherAt=minutes+WEATHER_CHANGE_MINUTES;
 if(minutes<nextWeatherAt)return;nextWeatherAt=minutes+WEATHER_CHANGE_MINUTES;
 const next=nextWeather(weatherKind);if(next!==weatherKind)applyWeather(next,{announce:true});
}

 loadingProgress?.start('town');
 await paintLoading();
 launchReport.stage('Building town');
 const world=createTown({scene:town,desktop:!!window.johanssonDesktop,sites:SITES,mobile,shadows,kitano:'distant',maxAnisotropy:renderer.capabilities.getMaxAnisotropy(),register:reg,enter:s=>crossThreshold(()=>enterRoom(s)),getPlayerPosition:()=>current?null:player.position,onAction:(...args)=>{if(islandPlay?.action(...args))return;if(args[0]==='dessert-menu'){const closed=()=>activities.action('read','Nakamura is closed',BLUE_CORAL.closedNotice),open=()=>BLUE_CORAL.staffed&&world.blueCoral?.isOpen();if(!open()){closed();return;}activities.menu(args[1],'The dessert counter is open.',[...args[2].map(p=>[p.title+' · ¥'+p.cost,()=>open()?activities.action('buy',p.title,p):closed()]),['Keep walking',activities.close]]);return;}if(args[0]==='ferry-ladder'){ferryLadder(args[1]);return;}if(args[0]==='plant'){plantStation(args[1]);return;}if(args[0]==='resident'){const person=world.people.find(p=>p.g.userData.name===args[1]);if(person?.g.userData.sleeping){say(args[1]+' is sleeping. You can stay and watch the morning routine.',4);return;}if(person?.g.userData.waking||person?.g.userData.roomTransition){say(args[1]+' is '+person.g.userData.activity+'.',3);return;}if(person){person.g.userData.facePlayerUntil=performance.now()+1600;characters?.gesture(person.g);}}if(args[1]==='Convex traffic mirror')world.beats?.mirror();activities.action(...args);}});
 // Colliders by where they are, for the camera, walking and residents (collider-grid.js).
 const colliderGrid=createColliderGrid(world.colliders);
 loadingProgress?.complete('town');
 // Kitano-jima is built when he heads there (world/kitano-on-demand.js): shaded, lit and compiled as it arrives.
 world.kitano.onLoaded.push(island=>{celPass.apply(scene);lightBudget.update();townSections.invalidate();shopStreetView.invalidate();if(island)compileTown(island,{async:true});neighbours?.replan?.();});
 /** Before he is put anywhere on or by Kitano-jima, the island is whole (at once: he arrives behind a veil or a cut). */
 const ensureKitanoAt=(x,z)=>{if(world.kitano.near(x,z))world.kitano.ensure();};
 // What the creator placed with the builder (src/build), published with the town in data/world-placements.json.
 const placements=createPlacements({group:world.group,colliders:world.colliders,factory:world.propFactory,walkable:(x,z)=>{const r=routeAt(x,z,0);return !!r&&r.surface!=='asphalt';},heightAt:groundHeight,
  // Kept clear: every door (shops, homes, the warehouse and the bus station), the bays where cars park, and the spots
  // where a game can start standing (openings.js): nobody arrives inside a bench.
  passage:PASSAGE,
  doors:[...DOOR_KEEP_CLEAR.map(d=>[d.x,d.z]),...OPENINGS.filter(o=>o.stand).map(o=>[o.stand[0],o.stand[1]]),...[...SITES,...(world.landmarks||[])].filter(s=>s.exitPosition).map(s=>[s.exitPosition[0],s.exitPosition[2]]),
   ...SERVICE_BAYS.map(([x,z])=>[x,z,4.8]),...AIRPORT_VEHICLE_YARD.bays.map((_,i)=>{const b=airportVehicleBay(i);return [b.x,b.z,4.8];})]});
 // The builder must know whether the file was read: saving after a failed read would overwrite it with nothing.
 const placementsLoad={done:false,error:null};
 Promise.resolve().then(()=>fetch(new URL(PLACEMENTS_FILE,document.baseURI||location.href),{cache:'no-cache'})).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.text();}).then(t=>{
  const skipped=placements.load(readPlacementsFile(t));if(skipped.length)console.warn('Builder placements left out:',skipped);placementsLoad.done=true;
 }).catch(e=>{placementsLoad.error=e.message;console.warn('Builder placements not loaded:',e.message);});
 if(decoratorEnabled()&&new URLSearchParams(location.search).has('build'))window.__JOHANSSON_BUILDER__={catalogue:BUILD_CATALOGUE,...placements,loaded:()=>({...placementsLoad}),
  ...createBuildMode({canvas:renderer.domElement,camera,group:world.group,placements,factory:world.propFactory,heightAt:groundHeight,
   getAudit:()=>window.__JOHANSSON_AUDIT__,getStart:()=>player&&{x:player.position.x,z:player.position.z}})};
// A site entered only from inside another (Sakura's office storey, up the shop's stair: the owner, 20 October 2026, "the
// entry to the upper office is only from inside") leaves the SITES, so no door, pin, directory entry or route outside
// leads to it.
const INSIDE_SITES=new Map();for(let i=SITES.length-1;i>=0;i--)if(SITES[i].insideOnly)INSIDE_SITES.set(SITES[i].id,SITES.splice(i,1)[0]);
const SAKURA_OFFICE_SITE=INSIDE_SITES.get('sakura-office')||null;
assignWorkplaces(world,SITES);
// The evening boat to Naha leaves from the ferry terminal: dinner with Thuan in the city
// (interiors/city-restaurant.js). It is an outing, not a door in town, so it is not one of
// the SITES: no map pin, no directory entry.
const NAHA_TRIP=Object.freeze({...CITY_RESTAURANT,arrival:true,x:PORT_BUILDING.platform[0],z:PORT_BUILDING.platform[1],door:[PORT_BUILDING.platform[0],0,PORT_BUILDING.platform[1]],exitPosition:[PORT_BUILDING.platform[0],0,PORT_BUILDING.platform[1]],entryFacing:0,color:0x2b2d5a,accent:'#2b2d5a',
 line:'Evening boat to Naha · back on the last sailing'});
// The evening boat is sold at the Port Terminal's third window (interiors/port-hall.js).
function takeNahaBoat(){
 const m=((minutes%1440)+1440)%1440;
 if(m<CITY_RESTAURANT.sailFrom||m>CITY_RESTAURANT.sailUntil){say('The evening boat to Naha sails from 17:00 until half past nine. Thuan said she would meet you here.',5);return;}
 activities.action('city-trip',null,{go:()=>crossThreshold(async()=>{if(current)leaveRoom();await enterRoom(NAHA_TRIP);})});
}
SITES.forEach(s=>doors.set(s.id,new THREE.Vector3(...(s.door||[s.side*4,0,s.z+2.5]))));
for(const place of world.landmarks||[])if(place.exitPosition)doors.set(place.id,new THREE.Vector3(...place.exitPosition));
// A clear standing point while the title or audit awaits its chosen opening. The viewing
// bench across from Sakura was removed on 24 October 2026; no hidden seat remains here.
const harbourOpening=OPENINGS.find(o=>o.id==='fish-auction');
const [harbourStartX,harbourStartZ]=harbourOpening.stand;
player.position.set(harbourStartX,groundHeight(harbourStartX,harbourStartZ),harbourStartZ);
yaw=harbourOpening.facing;world.spawn=player.position.toArray();
activities=createActivities({say,onLaundry:wash=>{world.laundryWash=wash||null;},onKaraoke:openKaraoke,onOpen:()=>toggleDir(false),onOutfit:on=>wearSwim(on),getOutfit:()=>swimwear,getMassageChair:()=>massageChair(),onMove:name=>{johansson?.play(name);},getBeerTable:()=>beerService?{drink:beerService.drink,dish:beerService.dish,order:beerService.pending,naoHere:!!world.people.find(p=>p.profile.name==='Thao'&&p.g.userData.inIzakaya&&p.g.visible)}:null,onOrderDrink:kind=>!!beerService?.order(kind,parkSeat?.izakaya),getTipsy:()=>tipsy,onSip:()=>sipDrink(),onEat:()=>eatDish(),onSnack:item=>{const inv=activities.state.inventory,i=inv.indexOf(item);if(i<0)return false;inv.splice(i,1);activities.save();activities.close();hands.bite(SPECIAL_BY_NAME[item]?.bite||(HOT_SNACKS.some(snack=>snack.id==='nikuman'&&snack.name===item)?'bun':'rice'));johansson?.play(seated?'SitEat':'Eat');say(item+'. Still warm.',3);return true;},onTreat:name=>{const g=world.people.find(p=>p.profile.name===name)?.g;if(g){g.userData.residentSpeech={text:"Cheers!",until:minutes+4};characters?.gesture?.(g);}},onInspectModel:item=>inspector.open(item),onInspectShopGood:item=>{resetInput();document.exitPointerLock?.();(itemViewer??=createItemViewer()).open(item);},getResidentLocations:()=>({...castAI?.snapshot?.(),...neighbours?.snapshot?.()}),getTableService:()=>Number.isInteger(parkSeat?.ramenSeatId)?ramenPlayerService:null,onStand:standUp,onConversation:setConversation,onDialoguePhase,getMinutes:()=>minutes,getSocialContext:()=>({inside:activityPlace(),thuanAvailable:world.people.some(p=>p.profile.name===sakuraClerkAt(minutes)&&p.g.userData.inMarket&&p.g.visible&&!p.g.userData.sleeping),names:sharedDining(current)?[...new Set([...izakayaGuests.sync(minutes),...ramenGuests.sync(minutes)])]:[]}),onMap:()=>{const c=document.createElement("canvas");c.width=680;c.height=640;c.style.width="100%";c.style.height="auto";c.style.position="static";c.setAttribute("aria-label","Folded visitor map, Minato Machi, 1997");drawTownMap(c.getContext("2d"),c.width,c.height,{sites:SITES,landmarks:world.landmarks,homes:canonicalHomeSites(directoryCards()),people:world.people,player:mapPlayer(),yaw,visited:activities.state.visited,target:navigationTarget,route:navigationPath});return c;},onPhone:()=>{const p=world.people.find(p=>p.g.userData.name==='Harbour master');if(p&&(p.g.position.z<-37)){characters.gesture(p.g);activities.close();say('The harbour master answers from the quay.',4);return true;}return false;},onPurchase:name=>{const p=new THREE.Vector3();active?.object?.getWorldPosition(p);hands.offer(name,p);return true;},onSeat:name=>{const bench=active?.object?.userData.seat;
 // A bench has a place for each sitter (seat-slots.js): the free one nearest him, beside whoever is on it already.
 const selected=bench?.slots?freeSlot(bench,player.position.x,player.position.z,s=>active.object.userData.slotsTaken?.[s.slot]||occupiedByPerson(s.position[0],s.position[2])):bench;
 if(bench?.slots&&!selected){say('There is no room on the bench.',3);return true;}
 if(!bench?.slots&&active?.object?.userData.reservedBy){say('That seat is occupied.',3);return true;}if(selected?.position&&occupiedByPerson(selected.position[0],selected.position[2])){say('That seat is occupied.',3);return true;}if((selected?.soak||selected?.wash)&&!activities.onsenPaid()){say('Pay ¥300 at the bandai by the door first.',4);return true;}if(selected?.soak||selected?.wash)wearSwim(true);{const inside=selected?.izakaya?'inIzakaya':Number.isInteger(selected?.ramenSeatId)?'inRamen':null;if(inside&&world.people.some(p=>p.g.userData[inside]&&p.g.visible&&Math.hypot(p.g.position.x-selected.position[0],p.g.position.z-selected.position[2])<.4)){say('Someone is already sitting there.',3);return true;}}if(selected?.storeSeatId&&(storeService?.occupied(selected.storeSeatId)||world.people.some(p=>p.g.userData.inMarket&&p.g.userData.storeSeatId===selected.storeSeatId))){say('That chair is occupied.',3);return true;}activities.close();const ax=player.position.x,az=player.position.z,ay=player.position.y,seat=selected&&selected!==bench?{...bench,...selected}:bench,approachClear=!environmentBlocked(ax,az)&&!occupiedByPerson(ax,az);const sit=seat?.position||[ax,ay,az];const stand=approachClear?[ax,ay,az]:seat?.stand||(()=>{const p=findClear(ax,az);return [p[0],ay,p[1]];})();parkSeat={seatId:seat?.id,ramenSeatId:seat?.ramenSeatId,storeSeatId:seat?.storeSeatId,izakaya:seat?.izakaya||null,surfaceY:seat?.surfaceY,table:seat?.table?[...seat.table]:null,soak:!!seat?.soak,wash:!!seat?.wash,beachCorner:!!seat?.beachCorner,front:seat?.front,position:sit,stand,eyeY:seat?.eyeY??1.15,yaw:Number.isFinite(seat?.yaw)?seat.yaw:yaw,pitch:Number.isFinite(seat?.pitch)?seat.pitch:pitch,aboard:seat?.aboard?{...seat.aboard}:null};
 // A seat aboard the ferry (ferry.js FERRY_PASSENGER_SEATS) keeps where he stands up in her frame too: pinAboardSeat.
 if(parkSeat.aboard&&world.ferry?.ferry){const f=world.ferry.ferry;f.updateMatrixWorld(true);parkSeat.aboard.stand=f.worldToLocal(new THREE.Vector3(...stand)).toArray();}player.position.set(...parkSeat.position);if(Number.isFinite(parkSeat.yaw))yaw=parkSeat.yaw;if(Number.isFinite(parkSeat.pitch))pitch=parkSeat.pitch;seated=true;johansson?.seat(parkSeat.soak?'Soak':'Sit');resetInput();say(Number.isInteger(parkSeat.ramenSeatId)?'Ramen counter · Make yourself comfortable.':name+' · Make yourself comfortable.',5);return true;},onDrink:name=>{activities.close();if(hands.held===name)hands.drink();else hands.offer(name,player.position,true);return true;},onEscort:()=>{activities.state.kenjiEscort='walking';activities.save();},onWeather:command=>command==='cycle'?cycleWeather():startWeather(),onTime:value=>{
  // time passes in the telling. The TIME button says what time and day it is in town.
  if(value&&typeof value==='object'){if(!followRealClock)minutes=value.restore;return;}
  if(value==='cycle'){if(followRealClock){clockMenu();return;}timePreset=(timePreset+1)%4;minutes=[1002,1110,1230,540][timePreset];}
  // Time spent on something moves the town on, whichever clock it keeps. In real time
  // the town then runs that far ahead of your own clock until you bring it back.
  else if(!followRealClock)minutes+=value;
  else if(Number.isFinite(value)&&value>0){minutes+=value;townClock.pass(value);activities.state.clockAhead=townClock.ahead;}
  evictIfClosed();}});
// The player's wash at the coin laundry turns its machine on the town clock (coin-laundry-dressing.js).
world.laundryWash=activities.state.coinLaundry||null;
islandPlay=createIslandPlay({world,player,camera,activities,register:reg,aboard:()=>!current&&!!deckUnder(),getMinutes:()=>minutes,getRain:()=>weather,passTime:value=>{minutes+=value;townClock.pass(value);activities.state.clockAhead=townClock.ahead;activities.save();},place:(x,z,_y,facing=0)=>{if(current)leaveRoom();standUpAt(x,z,facing);resetInput();},veil:run=>crossThreshold(run,{chime:false}),enterNaha:()=>crossThreshold(()=>enterRoom(NAHA_ARRIVALS)),leaveNaha:()=>leaveRoom()});
syncView();
hands=createHands({scene,camera,say,consume:name=>{const i=activities.state.inventory.indexOf(name);if(i<0)return false;const lager=name==='Umineko lager';if(lager&&!wantsAnother(tipsy,LAGER_ALCOHOL)){say('Enough for tonight. The can goes back in your bag for tomorrow.',3);return false;}if(lager)tipsy=drinkUp(tipsy,LAGER_ALCOHOL);activities.state.inventory.splice(i,1);const left=SPECIAL_BY_NAME[name]?.cup?null:emptyFor(name);if(left)activities.state.inventory.push(left);activities.save();return true;},canColour,onDrink:()=>johansson?.play(seated?'SitDrink':'Drink')});
// Johansson himself, for the third-person view. The model loads the first time the view is used.
const VIEW_KEY='johansson-town-view';
let thirdPerson=false,johansson=null,playerSpeed=0,playerRunning=false,thirdDistance=3.1,crampedEase=0,pivotSide=.34;
const shopCarry=createShopCarry({holder:()=>johansson});
// Third person unless you have asked for your own eyes: a life-sim is about seeing your
// islander in the town (docs/AMPLIFY-AUDIT.md, decision 5). V switches.
try{thirdPerson=globalThis.localStorage?.getItem(VIEW_KEY)!=='first';}catch{}
// A shared link (?avatar=code) is forwarded to Johansson Studio by index.html: looks are made there (src/studio-handoff.js).

// Johansson Studio saved a look, a wardrobe, Thuan's outfit or the home (src/studio-handoff.js): it shows here at once.
// The keys are this saved game's, fixed when the town starts, so another tab switching player cannot dress this one.
// A storage event reaches an open page; coming back to a page the browser kept (pageshow) or a hidden tab (iOS can
// freeze one) gets no event, so then the values are compared with what was last applied.
const studioKeys=Object.freeze({player:playerRecipeKey(),studio:studioKey(),wardrobe:WARDROBE_KEY});
const readKey=key=>{try{return globalThis.localStorage?.getItem(key)??null;}catch{return null;}};
const applied={player:readKey(studioKeys.player),wardrobe:readKey(studioKeys.wardrobe),studio:readKey(studioKeys.studio)};
function syncFromStudio(){
 if(!activities?.state)return;
 const now={player:readKey(studioKeys.player),wardrobe:readKey(studioKeys.wardrobe),studio:readKey(studioKeys.studio)};
 if(now.player!==applied.player){applied.player=now.player;if(johansson){johansson.setRecipe?.(playerRecipe());say('Your look has changed.',3);}}
 if(now.wardrobe!==applied.wardrobe){
  const read=v=>{try{const o=JSON.parse(v||'{}');return o&&typeof o==='object'?o:{};}catch{return {};}},before=read(applied.wardrobe),after=read(now.wardrobe);applied.wardrobe=now.wardrobe;
  for(const name of new Set([...Object.keys(before),...Object.keys(after)]))if(before[name]!==after[name])characters?.refresh(name);
 }
 if(now.studio!==applied.studio){
  applied.studio=now.studio;
  let choices={};try{choices=cleanStudioChoices(JSON.parse(now.studio));}catch{}
  const state=activities.state,changed=applyStudioChoices(state,choices);
  if(changed.thuan){const thuan=world.people.find(p=>p.profile?.name==='Thuan'||p.g.userData.name==='Thuan')?.g;if(thuan){thuan.userData.alternativeOutfit=state.thuanOutfit;characters?.wear(thuan,state.thuanOutfit);}}
  // New furniture may stand where he does: step him to the nearest clear floor.
  if(changed.home&&current?.id==='mayor-home'){activeRoomLayout?.redress?.();const [x,z]=findClear(player.position.x,player.position.z);player.position.x=x;player.position.z=z;}
  if(changed.home||changed.thuan)activities.save();
 }
}
addEventListener('storage',e=>{if(e.storageArea===globalThis.localStorage&&Object.values(studioKeys).includes(e.key))syncFromStudio();});
addEventListener('pageshow',e=>{if(e.persisted)syncFromStudio();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncFromStudio();});
function ensureJohansson(){if(!johansson){johansson=createAvatarJohansson({scene});window.__JOHANSSON_MODEL__=johansson;}return johansson;}
/** The view you chose goes through the door with you, both ways: V or the Town book switches it anywhere. */
function setThirdPerson(value,announce=true){spawnScene?.cancel('view');thirdPerson=!!value;try{localStorage.setItem(VIEW_KEY,thirdPerson?'third':'first');}catch{}if(thirdPerson)ensureJohansson();hands.firstPersonVisible=!thirdPerson;const b=$('#viewButton');if(b){b.textContent=thirdPerson?'Behind him':'His own eyes';b.setAttribute('aria-pressed',String(thirdPerson));}if(announce)say(thirdPerson?'Third-person view · V to look through his eyes again':'First-person view · V to step back',3);}
function playMove(name){if(!thirdPerson)setThirdPerson(true,false);ensureJohansson().play(name);}
function movesMenu(){if(!started||activities.paused)return;
 const who=playingResident()?linuxLife.current():null,text=who?who.name+': '+who.role.split(';')[0]+'. What now?':'Johansson, sixty-odd, bald and sunburnt, in his kariyushi shirt. What will he do?';
 activities.menu('Moves',text,[['Make a face…',()=>{activities.close();facesMenu();}],...MOVES.map(([name,label])=>[label,()=>{activities.close();playMove(name);}]),['Back',activities.close]]);}
/** Any of the faces the face painter knows (avatars/face.js), held for ten seconds; Neutral lets it go. */
const FACE_SECONDS=10;
function makeFace(name){if(!thirdPerson)setThirdPerson(true,false);ensureJohansson().express(name,name==='neutral'?0:FACE_SECONDS);}
function facesMenu(){if(!started||activities.paused)return;activities.menu('Make a face','A face holds for ten seconds. Neutral lets it go.',[...EXPRESSION_NAMES.map(name=>[(EXPRESSION_GLYPHS[name]?EXPRESSION_GLYPHS[name]+'  ':'')+name[0].toUpperCase()+name.slice(1),()=>{activities.close();makeFace(name);}]),['Back to Moves',()=>{activities.close();movesMenu();}]]);}
const tpPivot=new THREE.Vector3(),tpDir=new THREE.Vector3(),tpRight=new THREE.Vector3(),lookPoint=new THREE.Vector3();
/** Over the right shoulder, pulled in before anything solid comes between him and the lens. */
/** Whether the camera itself would be inside something: walls and anything taller than the lens. */
let indoorCeilings=null;
function cameraBlocked(x,z,y,r,ignore=null){
 if(current&&indoorCeilings&&y>indoorCeilings.limit(x,z,player.position.y,Math.max(.22,r)))return true;
 // Aboard, the lens may hang out over the water beside her, but not inside her houses and casings (ferry-walk.js).
 const aboard=!current&&!!deckUnder();if(aboard&&ferryWalk.cameraBlocked(x,z,y,r))return true;
 const bounds=current?(activeRoomLayout?suppliedRoomBoundsBlocked(activeRoomLayout,x,z,r):roomBoundsBlocked(x,z,r)):!aboard&&townBoundsBlocked(x,z,r);if(bounds)return true;
 const hit=c=>!c.only&&!(ignore&&ignore(c))&&!(aboard&&(c.id==='ferry'||!c.moving))&&(c.minY||0)<y+.12&&(!Number.isFinite(c.height)||(c.minY||0)+c.height>y-.12)&&circleHitsRect(x,z,r,c);
 return current?roomColliders.some(hit):colliderGrid.some(x,z,r,hit);
}
const arrivalPerson=new THREE.Vector3();
function arrivalLensBlocked(x,z,y,r){
 if(cameraBlocked(x,z,y,r))return true;
 for(const g of [...world.people.map(p=>p.g),...(world.neighbours||[])]){
  if(!g.visible||g.userData.visualReady===false)continue;
  g.getWorldPosition(arrivalPerson);
  if(y>arrivalPerson.y+.1&&y<arrivalPerson.y+2&&Math.hypot(x-arrivalPerson.x,z-arrivalPerson.z)<r+.4)return true;
 }
 return false;
}
const lensOcclusion=createLensOcclusion({root:scene,skip:o=>o===room||o===player||o.name==='Johansson (third person)'}),lensFrom=new THREE.Vector3(),lensDir=new THREE.Vector3(),lensUp=new THREE.Vector3(0,1,0);
/** Outdoors, when a wall or awning has pulled the lens right up to him, it would sit inside his own head: look over it instead of through it. */
const headPoint=new THREE.Vector3();
function lensInsideHead(){headPoint.set(player.position.x,player.position.y+1.45,player.position.z);return camera.position.distanceTo(headPoint)<.62;}
function houseboatCabin(){return !current&&houseboatCabinAt(player.position.x,player.position.z);}
/**
 * How far the third-person lens can stand back behind him at a heading, inside the room he has
 * just entered (the same boom and ceiling test the lens uses each frame).
 */
function boomRoom(x,z,heading,tilt=-.08){
 const y=player.position.y+1.6,cx=Math.sin(heading)*Math.cos(tilt),cy=-Math.sin(tilt),cz=Math.cos(heading)*Math.cos(tilt);
 // From his right shoulder, as placeThirdPerson hangs the lens (or his middle if the shoulder is in a wall).
 const side=johansson?.lens?.side??.34;let px=x+Math.cos(heading)*side,pz=z-Math.sin(heading)*side;if(cameraBlocked(px,pz,y,.16)){px=x;pz=z;}
 for(let d=.1;d<=2.2;d+=.1)if(cameraBlocked(px+cx*d,pz+cz*d,y+cy*d,.16))return Math.max(0,d-.22);
 return 2.2;
}
/**
 * Coming in through a door you keep looking the way you walked, unless that leaves the lens no
 * room: in a family home's genkan he faced a partition a step away with the door wall behind him,
 * the boom shrank to 0.38 m, his body was hidden and the screen was wall. Then he turns to the
 * nearest heading the lens has room for (into the dining-kitchen, there).
 */
function roomyHeading(heading){
 if(!thirdPerson)return heading;
 const x=player.position.x,z=player.position.z;
 if(boomRoom(x,z,heading)>=1)return heading;
 const turns=[1,-1,2,-2,3,-3,4].map(k=>({h:heading+k*Math.PI/4,r:boomRoom(x,z,heading+k*Math.PI/4)}));
 // The nearest turn with room to stand back comfortably, else the nearest with room at all, else the most room.
 return (turns.find(t=>t.r>=1.6)||turns.find(t=>t.r>=1)||turns.reduce((a,b)=>b.r>a.r?b:a)).h;
}
function placeThirdPerson(dt){
 // Seated, the lens rises a little so his head does not fill the view of the table. In a
 // bath he is down at the water, so it looks over his shoulder from standing height.
 const lens=johansson?.lens,tall=lens?lens.eye-1.6:0;
 // In the ferry's rooms (a 2 m deckhead, walls a metre or two off) the lens pivots at his chest, stands closer and
 // rises sooner to look down over him: the room, not the back of his head.
 const room=!current&&shipRoom(),cabin=houseboatCabin();
 const eye=(seated&&parkSeat?(parkSeat.soak?1.25:Math.min(1.45,parkSeat.eyeY-player.position.y)+.3):room?1.3:1.6)+tall;
 // Shiosai's open roof gives a raised view over the shoulder. Keep the player's yaw/pitch
 // intact so V and walking back onto the deck restore their usual controls immediately.
 const viewPitch=cabin?Math.min(pitch,-.64):pitch;if(cabin)camera.rotation.x=viewPitch;
 tpDir.set(-Math.sin(yaw)*Math.cos(viewPitch),Math.sin(viewPitch),-Math.cos(yaw)*Math.cos(viewPitch));tpRight.set(Math.cos(yaw),0,-Math.sin(yaw));
 tpPivot.set(player.position.x,player.position.y+eye+(camera.aspect<1?.18:0),player.position.z);
 if(current)tpPivot.y=Math.min(tpPivot.y,indoorCeilings?.limit(tpPivot.x,tpPivot.z,player.position.y)??Infinity);
 // Seated outdoors, the bench or chair under him is not a wall to stand the lens in front of.
 // (It used to skip everything within 0.85 m of him instead, so with his back to a building the
 // first test was already inside it and the lens stopped in the building: a dark screen.)
 const own=!current&&seated?c=>circleHitsRect(player.position.x,player.position.z,.3,c):null;
 // On a portrait screen (an iPad held upright) the frame is narrow and his big Shimanchu
 // head filled a third of it: the lens stands further back and a little higher there.
 const portrait=camera.aspect<1,want=(current?2.2:cabin?2.15:room?2.0:3.2)*(portrait?1.32:1);
 // The whole boom, from a pivot `side` metres to his right; indoors the ceiling too. -1: the pivot is in a wall.
 // Outdoors the boom also stops at what is drawn rather than walked into (an awning, a canopy,
 // a shop's glass): otherwise the lens slid under the valance or behind a window and looked out through it.
 const drawn=(px,pz)=>{if(current)return want;lensFrom.set(px,tpPivot.y,pz);lensDir.copy(tpDir).negate();return Math.max(0,lensOcclusion.clear(lensFrom,lensDir,want+.3)-.3);};
 const shoulderClear=side=>{if(current||!side)return true;lensFrom.set(tpPivot.x,tpPivot.y,tpPivot.z);lensDir.copy(tpRight).multiplyScalar(Math.sign(side));return lensOcclusion.clear(lensFrom,lensDir,Math.abs(side)+.2)>=Math.abs(side)+.2;};
 const boom=side=>{const px=tpPivot.x+tpRight.x*side,pz=tpPivot.z+tpRight.z*side;if(side&&(cameraBlocked(px,pz,tpPivot.y,.16,own)||!shoulderClear(side)))return -1;
  const limit=drawn(px,pz);for(let d=.1;d<=limit+.001;d+=.1)if(cameraBlocked(px-tpDir.x*d,pz-tpDir.z*d,tpPivot.y-tpDir.y*d,.16,own))return Math.max(0,d-.22);return limit;};
 // Over his right shoulder, drawn in towards his middle as the boom shortens (a short boom from the
 // shoulder sees past him, with him out of the side of the frame), and his middle whenever the
 // shoulder has the worse boom: walking out past the end of a wall used to flip the pivot 0.5 m
 // sideways into a boom that ran straight into the wall, and the lens popped from 3.2 m to nothing.
 const shoulder=(lens?.side??.34)*(1-.8*crampedEase),fromShoulder=boom(shoulder),fromMiddle=boom(0);
 pivotSide=THREE.MathUtils.damp(pivotSide,fromShoulder>=fromMiddle-.3?shoulder:0,6,dt);
 let reach=boom(pivotSide);if(reach<0){pivotSide=0;reach=fromMiddle;}
 tpPivot.addScaledVector(tpRight,pivotSide);
 // And the line from the lens to his head: a trunk or a post beside the boom still stood
 // between them (Harbour Park's bench). Come in front of it.
 const headY=player.position.y+eye-.2;
 const sightBlocked=d=>{const cx=tpPivot.x-tpDir.x*d,cy=tpPivot.y-tpDir.y*d,cz=tpPivot.z-tpDir.z*d,dx=player.position.x-cx,dy=headY-cy,dz=player.position.z-cz,len=Math.hypot(dx,dy,dz);
  for(let t=0;t<len-.45;t+=.15){const k=t/len;if(cameraBlocked(cx+dx*k,cz+dz*k,cy+dy*k,.12,own))return true;}return false;};
 let sight=reach;for(let i=0;i<16&&sight>.3&&sightBlocked(sight);i++)sight=Math.max(.3,sight-.2);
 // A wall in the boom: in at once, never through it. Something only in the line of sight: in
 // quickly but smoothly (a lamp post passing behind him used to pop the lens 2.6 m in a frame).
 // Clear again: out slowly.
 if(reach<thirdDistance)thirdDistance=reach;
 if(sight<thirdDistance)thirdDistance=THREE.MathUtils.damp(thirdDistance,sight,14,dt);
 else thirdDistance=THREE.MathUtils.damp(thirdDistance,sight,4,dt);
 camera.position.copy(tpPivot).addScaledVector(tpDir,-thirdDistance);
 // The head camera in her rooms (ferry batch 6f): with less than HEAD_CAM behind him the lens does not stand pressed
 // against the wall at his back, where the near plane cut the wall in half across the frame (the gangway passage, the
 // foyer, the stairs); it moves to his eyes, a hand's breadth back, and he is hidden.
 const headCam=(room||cabin)&&thirdDistance<HEAD_CAM;
 if(headCam)camera.position.set(player.position.x,player.position.y+1.6+tall,player.position.z).addScaledVector(tpDir,-.12);
 // Close in, the lens rises over his shoulder and looks down at him, so a narrow alley or a
 // small room still shows him rather than the back of his head or nothing at all. Eased, so a
 // post passing behind him does not jerk the view; it rises only where there is room.
 const cramped=Math.min(1,Math.max(0,(room?2.1:1.4)-thirdDistance)/1.1);
 crampedEase=THREE.MathUtils.damp(crampedEase,cramped,8,dt);
 if(crampedEase>.001&&!headCam){
  let lift=crampedEase*(room?.5:.3);if(!current)lift=Math.min(lift,lensOcclusion.clear(camera.position,lensUp,lift+.3)-.3);while(lift>.05&&cameraBlocked(camera.position.x,camera.position.z,camera.position.y+lift,.16,own))lift-=.1;
  camera.position.y+=Math.max(0,lift);
 }
 camera.position.y=Math.max(camera.position.y,player.position.y+.3);
 // On a hillside the boom can swing into the slope behind: keep the lens above the ground.
 // (Aboard the ferry her decks are the ground, and below her waterline the town's is far above: her engine room.)
 if(!current&&!deckUnder())camera.position.y=Math.max(camera.position.y,groundHeight(camera.position.x,camera.position.z)+.35);
 if(current)camera.position.y=Math.min(camera.position.y,indoorCeilings?.limit(camera.position.x,camera.position.z,player.position.y)??Infinity);
 if(crampedEase>.001&&!headCam){
  // His head low in the frame, not in the middle of it: the view still looks ahead, past him. (As a head camera in
  // her rooms he is hidden, and the view keeps his own pitch.)
  const flat=Math.max(.25,Math.hypot(camera.position.x-player.position.x,camera.position.z-player.position.z)),down=Math.max(-.6,Math.atan2(player.position.y+eye-.1-camera.position.y,flat)+.35);
  camera.rotation.x=THREE.MathUtils.lerp(camera.rotation.x,Math.min(camera.rotation.x,down),crampedEase);
 }
}
/** R, the drink button, or Drink at the table: a can from the bag, or a sip of what Thao brought. */
function drinkNow(){if(parkSeat?.izakaya&&beerService?.drink)return sipDrink();return hands.drink();}
function sipDrink(){
 if(johansson?.drinking||beerService?.sipping)return false;
 if(Math.max(sipDrink.busyUntil||0,eatDish.busyUntil||0)>performance.now())return false;
 const table=beerService?.drink;if(!table||table.left<=0)return false;
 if(TABLE_DRINK_KINDS.includes(table.kind)&&seated&&parkSeat?.izakaya){
  const actor=ensureJohansson(),lease=beerService.beginSip();if(!lease)return false;
  // Place his seated body before capturing the resting hand. The vessel itself is
  // the one Thao delivered, retained in the room and returned to this table.
  updateJohansson(0);
  const account=result=>{if(result?.consumedPortion>0){tipsy=drinkUp(tipsy,result.alcohol);minutes+=2*result.consumedPortion;townClock.pass(2*result.consumedPortion);activities.state.clockAhead=townClock.ahead;}};
  const started=actor.drinkFromTable(lease,{
   onComplete:result=>{account(result);say(result.left?'A measured sip. '+result.left+(result.left===1?' mouthful left.':' mouthfuls left.'):'The glass is empty. Thao glances over: Another drink?',3);
    window.dispatchEvent(new CustomEvent('sipCompleted',{detail:{drinkId:table.kind==='draft'?'beer':table.kind,volumeConsumedMl:result.volumeConsumedMl,source:'izakaya'}}));},
   onCancel:account,
  });
  if(!started){lease.cancel();return false;}
  return true;
 }
 const first=table.left===table.sips,r=beerService.sip();if(!r)return false;
 tipsy=drinkUp(tipsy,r.alcohol);minutes+=2;townClock.pass(2);activities.state.clockAhead=townClock.ahead;
 sipDrink.busyUntil=performance.now()+2500;
 if(thirdPerson&&johansson?.ready){johansson.play(first?'SitToast':'SitDrink');const prop=createDrinkProp(r.kind,{held:true});prop.userData.startPortion=table.left/table.sips;prop.userData.finishPortion=r.left/table.sips;setPropPortion(prop,prop.userData.startPortion,{immediate:true});johansson.hold(prop);clearTimeout(sipDrink.timer);sipDrink.timer=setTimeout(()=>johansson?.hold(null),2500);}
 else hands.sip(r.kind,table.left/table.sips,r.left/table.sips);
 say(first?"Cheers! The first mouthful is the coldest thing in Okinawa.":r.left?'Another mouthful. '+r.left+' left.':"The last of it. Thao glances over: Another drink?",3);
 return true;
}
/** A mouthful of ramen, or a sip of what came with it, at a ramen counter (ramen-player-service.js). */
function ramenMouthful(item,{drink,kind,start,finish}){
 minutes+=1;townClock.pass(1);activities.state.clockAhead=townClock.ahead;
 if(drink&&kind==='bottle')tipsy=drinkUp(tipsy,DRINKS.bottle.alcohol/6);
 if(thirdPerson&&johansson?.ready){
  johansson.play(drink?'SitDrink':'SitEat');
  const prop=drink?createDrinkProp(kind,{held:true}):createBiteProp(kind);
  if(drink){prop.userData.startPortion=start;prop.userData.finishPortion=finish;setPropPortion(prop,start,{immediate:true});}else{prop.userData.startPortion=1;prop.userData.finishPortion=0;}
  johansson.hold(prop);clearTimeout(sipDrink.timer);sipDrink.timer=setTimeout(()=>johansson?.hold(null),2500);
 }else if(drink)hands.sip(kind,start,finish);else hands.bite(kind);
}
/** E at the table with a dish in front of you: one mouthful of it. */
function eatDish(){
 if(johansson?.drinking||beerService?.sipping)return false;
 if(Math.max(sipDrink.busyUntil||0,eatDish.busyUntil||0)>performance.now())return false;
 const r=beerService?.bite();if(!r)return false;
 minutes+=2;townClock.pass(2);activities.state.clockAhead=townClock.ahead;
 eatDish.busyUntil=performance.now()+2500;
 if(thirdPerson&&johansson?.ready){johansson.play('SitEat');const prop=createBiteProp(r.kind);prop.userData.startPortion=1;prop.userData.finishPortion=0;johansson.hold(prop);clearTimeout(sipDrink.timer);sipDrink.timer=setTimeout(()=>johansson?.hold(null),2500);}else hands.bite(r.kind);
 say(r.left?"Enjoy your meal. "+(r.left===1?'One mouthful left.':r.left+' mouthfuls left.'):"Thank you for the meal. The plate is clean.",3);
 return true;
}
/** Changed for the bath or not: the model changes, and the game remembers for the camera-less view. */
let swimwear=false,bathWear='clothes';
// The player dresses for Umi-no-yu as the residents do (indoor-residents.js), by where they are once changed: behind the
// noren, in the changing room, 'bath' (a yuamigi, the bath wrap, and a towel on the head for a grown-up; swimwear for a
// child or anyone who chose it in the maker); past the bath doors, where the washing room and the rock bath are shared,
// swimwear; out in the lobby, the after-bath clothes (avatars/outfits.js AFTERBATH).
function onsenWear(){if(!swimwear||current?.id!=='onsen')return null;const z=player.position.z,H=ONSEN_ROOM.hall;return z<H.changing?'swim':z<H.front?'bath':'afterbath';}
function wearSwim(on){if(swimwear===!!on)return;swimwear=!!on;if(on&&!johansson)ensureJohansson();bathWear=on?onsenWear()||'bath':'clothes';const worn=johansson?.wear(bathWear);if(on)say(worn==='towel'?'You change at the lockers into one of the bath\'s wraps, a folded towel on your head.':'You change into your swimwear at the lockers.',3);}
function followOnsenWear(){const w=onsenWear();if(w&&w!==bathWear){bathWear=w;johansson?.wear(w);}}
function updateJohansson(dt){
 for(const entity of linuxBorrowed.keys())entity.visible=false;
 const ferryView=islandPlay?.phase==='ferry'&&islandPlay.cinematic;
 hands.firstPersonVisible=!ferryCameraLocked()&&!freeCamera.active&&(!thirdPerson||ferryExplorer?.active&&ferryExplorer.mode==='walk')&&!johansson?.drinking&&!spawnScene?.active&&!islandPlay?.cinematic&&current?.id!==CITY_RESTAURANT.id;
 if((ferryView||ferryCameraLocked())&&!johansson)ensureJohansson();
 if(!johansson)return;
 followOnsenWear();
 const r=johansson.root;r.position.copy(player.position);
 if(seated&&parkSeat){
  // Hips on the seat, facing the way the seat faces.
  if(Number.isFinite(parkSeat.yaw))r.rotation.set(0,parkSeat.yaw,0);
  r.position.set(...parkSeat.position);
 }else r.quaternion.copy(player.quaternion);
 if(linuxLife?.inBed){r.position.set(...linuxLife.bed.position);r.quaternion.setFromEuler(new THREE.Euler(-Math.PI/2,Math.PI,0));}
 const partner=conversationName?(conversationName==='Thuan'?storeClerk:world.people.find(p=>p.g.userData.name===conversationName)?.g):null;
 if(partner){partner.getWorldPosition(lookPoint);lookPoint.y+=1.5;johansson.lookAt(lookPoint);}else johansson.lookAt(spawnScene?.gaze||null);
 setSwingFocus(camera.position);
 johansson.update(dt,{sleeping:!!linuxLife?.inBed,speed:ferryView?0:playerSpeed,running:!ferryView&&playerRunning,seated,seatHeight:seated&&parkSeat?parkSeat.surfaceY-r.position.y:undefined,seatFront:seated?parkSeat?.front:undefined,tipsy,airborne:!ferryView&&!!characters?.jumping,firstPersonDrinking:!ferryCameraLocked()&&(!thirdPerson||ferryExplorer?.active&&ferryExplorer.mode==='walk')&&started&&!inspector?.active&&!spawnScene?.active,visible:!(ferryExplorer?.active&&ferryExplorer.mode!=='overview')&&(ferryCameraLocked()||freeCamera.active||!!linuxLife?.inBed||islandPlay?.phase!=='flight'&&((thirdPerson&&(current?thirdDistance>=.5:shipRoom()||houseboatCabin()?thirdDistance>=HEAD_CAM:!lensInsideHead()))||spawnScene?.active||ferryView)&&started&&!inspector?.active)});
 // Sakura: one thing in his hand, more in a basket, until he pays (shop-carry.js).
 shopCarry.sync(activities?.state?.konbini?.basket,current?.id==='market'&&johansson.ready);
}
if(thirdPerson)setThirdPerson(true,false);
loadingProgress?.start('residents');
await paintLoading();
characters=createCharacters({mobile,shadows,onJump:()=>johansson?.jump(),canJump:()=>!ferryExplorer?.active&&!seated&&!pocket?.raised&&controlsAllowed(),isBlocked:(x,z,r)=>townBoundsBlocked(x,z,r)||colliderGrid.some(x,z,r,c=>circleHitsRect(x,z,r,c)),onError:(name,error)=>console.warn('Character construction failed:',name,error)});characters.attach(player,'player',1.82);world.people.forEach(p=>characters.attach(p.g,p.g.userData.name,p.profile?.height));
// The people of the new streets: shopkeepers at their counters, the old men at gateball,
// Grandmother Higa on her verandah, a postman on his round. See people/neighbours.js.
// Who is simulated in full this frame: everybody on Linux; on the web, whoever is near or in view (edition.js).
const observerAt={x:0,z:0,inside:false},attention=createAttention({camera,getObserver:()=>{const at=current?doors.get(current.id):player.position;if(!at)return null;observerAt.x=at.x;observerAt.z=at.z;observerAt.inside=!!current;return observerAt;}});
neighbours=createNeighbours({parent:town,register:reg,characters,getKissaClosing:()=>!!world.quarters?.higa?.closingHeld,attends:g=>attention.attends(g),getRain:()=>weather,getState:()=>activities.state,blocked:(x,z,r)=>townBoundsBlocked(x,z,r)||colliderGrid.some(x,z,r,c=>(!c.only||c.only==='resident')&&standingHitsRect(x,z,r,groundHeight(x,z),c)),onAction:(kind,name)=>{
 const who=neighbours.talkTo(name,player.position);if(who)characters.gesture(who);activities.action(kind,name);
}});
world.neighbours=neighbours.entities;world.homeNeighbours=neighbours.people;
loadingProgress?.complete('residents');
// The Minato Maru's crew at their posts, riding with her (people/ferry-crew-aboard.js).
if(world.ferry){
 ferryCrew=createFerryCrewAboard({run:world.ferry,characters,register:reg,playerIdentity:()=>playerRecipe().name||'Johansson',playerAboard:()=>!current&&!!deckUnder(),onAction:(kind,title,text)=>activities.action(kind,title,text),townBody:name=>world.people.find(p=>p.profile.name===name)?.g||world.neighbours?.find(g=>g.userData.name===name)||null,portShed:world.portShed,shoreParent:world.group,shoreColliders:world.colliders});
 ferryOperations=createFerryOperationsView({parent:$('#hud'),run:world.ferry,getMinutes:()=>minutes,getCrew:crewOnDuty,getProcedure:()=>world.ferry.procedure||{}});
}
// Thuan is the heaviest single asset in the town and she is kept at full detail, so
// fetching her before the first frame put nine megabytes in front of the chunks the
// game needs to start: on a 1.6 Mbps link that was most of the wait. She is still the
// first thing requested once the opening frame has painted, so she is in the window by
// the time the player crosses the road, and the procedural stand-in covers the gap.

inspector=createInspector({scene,camera,renderer,canvas,resetInput,onReturn:item=>{const o=content?.objects.get(item.id);if(o)o.visible=true;},onInspect:item=>{const o=content?.objects.get(item.id);if(o)o.visible=false;activities.inspectItem(item);if(item.id==='model')say(item.note,4);},onLink:()=>{},onContact:()=>{}});
content={items:BUSINESS_CONTENT_CATALOGUE,objects:new Map()};
const residentLedger=createResidentLedger(()=>activities.state);
const townCleanup=createTownCleanup({parent:town,register:reg,action:activities.action,getState:()=>activities.state,blocked:(x,z,r)=>townBoundsBlocked(x,z,r)||colliderGrid.some(x,z,r,c=>circleHitsRect(x,z,r,c))});
const npcActivities=createTownActivities({getTargets:()=>interactables,collides:(x,z,r)=>townBoundsBlocked(x,z,r)||colliderGrid.some(x,z,r,c=>circleHitsRect(x,z,r,c)),getPlayerPosition:()=>current?null:player.position,ledger:residentLedger,getState:()=>activities.state});
castAI=createCastAI({activities:npcActivities,world,player,attends:g=>attention.attends(g),detourRetryMinutes:BUDGET.detourRetryMinutes||0,getObserverPosition:()=>current?doors.get(current.id):player.position,state:()=>activities.state,paused:()=>false,collides:(x,z,r)=>townBoundsBlocked(x,z,r)||colliderGrid.some(x,z,r,c=>(!c.only||c.only==='resident')&&standingHitsRect(x,z,r,groundHeight(x,z),c))});
// Stand points (people/stand-points.js): on Linux for everybody; on the web for the residents in view, near, or in the
// room the player is in, and the rest keep one target a phase (edition.js, full-life.js).
if(!BUDGET.residentsEverywhere){
 const bodies=new Map();const bodyOf=name=>{if(!bodies.has(name))bodies.set(name,world.people.find(p=>p.profile?.name===name)?.g||world.neighbours?.find(g=>g.userData.name===name)||null);return bodies.get(name);};
 setStandFilter(name=>{const g=bodyOf(name);if(!g)return true;for(let p=g.parent;p;p=p.parent)if(p===room)return true;return attention.attends(g);});
}
const workplaceResidents=createWorkplaceResidents({world,parent:scene,getEntrance:()=>activeRoomLayout?.spawn||[0,0,5.2],getLayout:()=>activeRoomLayout,getTargets:()=>interactables,collides:environmentBlocked,getPlayerPosition:()=>player.position,getState:()=>activities.state,ledger:residentLedger,onBorrow:npcActivities.release});
const bookshopCustomers=createBookshopCustomers({world,parent:scene,getLayout:()=>activeRoomLayout,getPlayerPosition:()=>player.position,collides:environmentBlocked,getState:()=>activities.state,ledger:residentLedger,onBorrow:npcActivities.release,save:()=>activities.save()});
const chatBlocked=(a,b)=>!clearChatLine(a,b,current?roomColliders:world.colliders);
// The neighbours' small talk: written lines, or the town's language model when the
// player has turned it on (it then starts by itself on later visits). See town-mind.js.
const neighbourWriter=createNeighbourWriter({mind:sharedMind()});startMindIfChosen();
const neighbourChats=createNeighbourChats({world,observer:()=>player.position,blocked:chatBlocked,state:()=>activities.state,onMemory:()=>activities.save(),writer:neighbourWriter});
const chatBubble=createChatBubble({camera,canvas,target:g=>characters.conversationTarget(g),blocked:chatBlocked,project:g=>projectSpeechActor(g)});
// Whoever you are talking to turns to face you, unless they are mid-something, in
// which case they answer over their shoulder. See people/facing.js.
const facing=createFacing({world,getPlayerPosition:()=>player.position});
let conversationLine=null;
/**
 * Conversations are staged like Shenmue: the camera sits over Johansson's shoulder on
 * whoever is talking to him, and cuts to the reverse angle, over their shoulder onto
 * him, while he says his line. Both shots stay on the same side of the pair, so a cut
 * never flips them round. If a wall or a shelf is where a shot would be, the two of
 * them share one side-on shot instead. The picture also eases up a little so faces sit
 * above the subtitles, and the ordinary camera (paused while a window is open) is left
 * where it was for when you walk away.
 */
let conversationShot='speaker',conversationSide=0,shotCut=true,conversationLift=0,portraitShot=null;
const speakerHead=new THREE.Vector3(),playerHead=new THREE.Vector3(),shotPos=new THREE.Vector3(),shotLook=new THREE.Vector3(),shotStep=new THREE.Vector3(),facingSpeaker=new THREE.Quaternion(),shotAim=new THREE.Matrix4(),shotQ=new THREE.Quaternion();
function onDialoguePhase({phase,seconds}){
 if(phase==='player'){
  conversationShot='player';shotCut=true;
  if(conversationLine?.speaker)conversationLine.speaker.userData.speakingUntil=0;
  johansson?.speak(seconds||2);
 }else if(conversationShot!=='speaker'){conversationShot='speaker';shotCut=true;}
}
/** Nothing solid between `from` and a lens at `to`. */
function shotClear(from,to){
 for(let t=.2;t<=1.001;t+=.1){shotStep.lerpVectors(from,to,t);if(cameraBlocked(shotStep.x,shotStep.z,shotStep.y,.14))return false;}
 return true;
}
/** An over-the-shoulder lens: behind `near`, off to `side`, looking at `far`. */
// Shimanchu heads are big, so the lens stands further back and wider to see past one.
const SHOULDER={back:1.05,side:.8,up:.16};
function overShoulder(near,far,ux,uz,side,out){
 return out.set(near.x-ux*SHOULDER.back+uz*side*SHOULDER.side,near.y+SHOULDER.up,near.z-uz*SHOULDER.back-ux*side*SHOULDER.side);
}
function frameConversation(dt){
 const speaker=conversationLine?.speaker;
 if(!speaker?.visible)return;
 speakerHead.copy(characters.conversationTarget(speaker));
 playerHead.set(player.position.x,player.position.y+(johansson?.lens?.head??1.58),player.position.z);
 const dx=speakerHead.x-playerHead.x,dz=speakerHead.z-playerHead.z,dist=Math.hypot(dx,dz);
 if(dist<.2||dist>8)return;
 const k=1-Math.exp(-dt*4),want=Math.atan2(-dx,-dz);
 // Sitting down, you turn your head rather than your body: the view swings round to
 // whoever is talking, and the bench stays where it is.
 if(!seated){facingSpeaker.setFromAxisAngle(yAxis,want);player.quaternion.slerp(facingSpeaker,k);}
 yaw+=Math.atan2(Math.sin(want-yaw),Math.cos(want-yaw))*k;
 if(!thirdPerson||seated){
  const wantPitch=THREE.MathUtils.clamp(Math.atan2(speakerHead.y-(player.position.y+1.6),dist)-.06,-.3,.12);
  pitch+=(wantPitch-pitch)*k;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);return;
 }
 const ux=dx/dist,uz=dz/dist;
 const aspect=canvas.clientWidth/canvas.clientHeight||camera.aspect;
 if(aspect<.85){
  if(!portraitShot||!conversationSide||Math.abs(portraitShot.aspect-aspect)>.02){
   portraitShot=portraitConversationShot({speaker:speakerHead,player:playerHead,aspect,fov:camera.fov,clear:shotClear,blocked:p=>cameraBlocked(p.x,p.z,p.y,.16)});
   if(portraitShot){portraitShot.aspect=aspect;conversationSide=2;shotCut=true;}
  }
 }else if(portraitShot){portraitShot=null;conversationSide=0;shotCut=true;}
 const shotZoom=portraitShot?.zoom||1;if(camera.zoom!==shotZoom){camera.zoom=shotZoom;camera.updateProjectionMatrix();}
 // Pick the side once per conversation: the one where both shoulders give a clear view.
 if(!portraitShot&&!conversationSide){
  conversationSide=2;
  for(const side of [1,-1]){
   if(shotClear(speakerHead,overShoulder(playerHead,speakerHead,ux,uz,side,shotPos))&&shotClear(playerHead,overShoulder(speakerHead,playerHead,-ux,-uz,-side,shotPos))){conversationSide=side;break;}
  }
 }
 if(portraitShot){
  shotLook.copy(playerHead).lerp(speakerHead,.5);shotPos.copy(shotLook).add(portraitShot.positionOffset);shotLook.add(portraitShot.lookOffset);
 }else if(conversationSide===2){
  // No clear shoulder: both of them, side on, from whichever side is open.
  const midX=playerHead.x+dx*.5,midZ=playerHead.z+dz*.5;let best=null;
  for(const side of [1,-1]){let sx=uz*side-ux*.45,sz=-ux*side-uz*.45;const n=Math.hypot(sx,sz);sx/=n;sz/=n;
   let reach=Math.max(1.8,dist*1.35);for(let d=.3;d<=reach;d+=.1)if(cameraBlocked(midX+sx*d,midZ+sz*d,playerHead.y,.16)){reach=Math.max(.9,d-.25);break;}
   if(!best||reach>best.reach+.05)best={sx,sz,reach};}
  shotPos.set(midX+best.sx*best.reach,playerHead.y+.12,midZ+best.sz*best.reach);shotLook.set(midX+dx*.15,playerHead.y-.08,midZ+dz*.15);
 }else if(conversationShot==='player'){
  overShoulder(speakerHead,playerHead,-ux,-uz,-conversationSide,shotPos);shotLook.copy(playerHead);shotLook.y-=.04;
 }else{
  overShoulder(playerHead,speakerHead,ux,uz,conversationSide,shotPos);shotLook.copy(speakerHead);shotLook.y-=.06;
 }
 shotAim.lookAt(shotPos,shotLook,yAxis);shotQ.setFromRotationMatrix(shotAim);
 // A cut is a cut; within a shot the lens only drifts.
 if(shotCut){camera.position.copy(shotPos);camera.quaternion.copy(shotQ);shotCut=false;}
 else{camera.position.lerp(shotPos,k*.6);camera.quaternion.slerp(shotQ,k);}
}
/** Speech uses the final camera and protects both heads and bodies, not only a head anchor. */
const conversationBalloon=createBalloonPresenter($('#activityBody'));
function projectSpeechActor(g){
 if(!g)return null;for(let p=g;p;p=p.parent)if(!p.visible)return null;
 const own=g===johansson?.root,measure=own?johansson.measure:characters?.actors.find(a=>a.entity===g)?.avatar.measure;
 const feet=g.getWorldPosition(new THREE.Vector3()),head=own?feet.clone().add(new THREE.Vector3(0,measure?.headCentre||1.58,0)):characters.conversationTarget(g);
 return projectBalloonPerson(camera,canvas.getBoundingClientRect(),head,feet,(measure?.Rh||.3)*Math.max(measure?.headSX||1,measure?.headSY||1)*1.18);
}
function placeConversationBalloon(dt=0){
 const modal=$('#activity'),body=$('#activityBody'),card=modal?.querySelector('.activity-card');
 if(!globalThis.getComputedStyle||!card?.getBoundingClientRect||!canvas.getBoundingClientRect)return;
 const speaker=conversationLine?.speaker;
 if(!speaker||modal.classList.contains('hidden')||body.querySelector('.chat-log,.chat-input')){conversationBalloon.reset();body.balloonActors=[];return;}
 camera.updateMatrixWorld();
 const npc=projectSpeechActor(speaker),own=thirdPerson?projectSpeechActor(johansson?.root):null;
 const person=conversationShot==='player'&&own?own:npc;if(!person)return;
 const others=[npc,own].filter(p=>p&&p!==person),line=body.querySelector(conversationShot==='player'?'.rpg-own':'.rpg-line');
 if(!line)return;
 const viewport=balloonViewport(canvas.getBoundingClientRect(),{bottom:card.getBoundingClientRect().top-12,element:body});
 body.balloonActors=[{name:conversationName,...npc},...(own?[{name:'Johansson',...own}]:[])].filter(p=>p.face);
 conversationBalloon.place({person,obstacles:others.flatMap(p=>[p.face,p.body]),viewport,key:conversationName+'|'+conversationShot,text:line.dataset.fullLine||line.textContent,line,dt,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});
}
function placeWorldBalloons(dt=0){
 camera.updateMatrixWorld();placeConversationBalloon(dt);
 if(activities.paused&&!conversationLine||!$('#directory').classList.contains('hidden')){chatBubble.hide();return;}
 chatBubble.render(conversationLine?null:(neighbourChats.current||residentSpeech()),dt);
}
function updateConversationLift(dt){
 if(conversationLine)frameConversation(dt);
 else if(portraitShot||camera.zoom!==1){portraitShot=null;camera.zoom=1;camera.updateProjectionMatrix();}
 const target=conversationLine?.1:0;
 if(Math.abs(target-conversationLift)<.001&&conversationLift===target)return;
 conversationLift+=(target-conversationLift)*Math.min(1,dt*7);
 if(Math.abs(target-conversationLift)<.002)conversationLift=target;
 const w=canvas.width,h=canvas.height;
 if(conversationLift>0)camera.setViewOffset(w,h,0,Math.round(h*conversationLift),w,h);else camera.clearViewOffset();
}
function residentSpeech(){const person=world.people.filter(p=>!p.g.userData.playerControlled&&p.g.userData.residentSpeech?.until>minutes&&p.g.visible&&p.g.userData.hit.inside===!!current&&(!p.g.userData.inMarket||current?.id==='market')).sort((a,b)=>a.g.position.distanceToSquared(player.position)-b.g.position.distanceToSquared(player.position))[0];return person?{speaker:person,text:person.g.userData.residentSpeech.text}:null;}
// Both shopfronts lead to one connected room. Seats and the part of the room you
// are using identify the host; the street door used to enter does not change it.
function sharedDining(site){return site?.id==='izakaya'||site?.id==='ramen';}
function activityPlace(){
 if(!sharedDining(current))return current?.id;
 if(parkSeat?.izakaya)return 'izakaya';
 if(Number.isInteger(parkSeat?.ramenSeatId))return 'ramen';
 return activeRoomLayout?.exitSiteAt?.(player.position.x,player.position.z)||current.id;
}
function roomCollider(x,z,w,d,height=2.8,minY=0){const c={x,z,w,d,height,minY};roomColliders.push(c);return c;}

// Umi-no-yu has one regular guest: Thuan, on the evenings she has been asked along.
const onsenGuests=createIndoorResidents({world,parent:scene,collides:(x,z,r)=>environmentBlocked(x,z,r,'resident'),getRain:()=>weather,place:'onsen',layout:{entrance:ONSEN_ROOM.spawn},getPlayerSeat:()=>parkSeat?.seatId,onBorrow:npcActivities.release,getState:()=>activities.state});
const izakayaGuests=createIzakayaGuests({world,parent:scene,collides:environmentBlocked,getPlayerSeat:()=>parkSeat?.izakaya?.position||null,getRain:()=>weather,getState:()=>activities.state,onBorrow:npcActivities.release,getThuan:()=>{const g=ensureThuan();if(!interactables.includes(g))reg(g,'Catch up with Thuan',()=>activities.action('resident','Thuan'),true);return g;}});
const ramenLife=new THREE.Group();ramenLife.name='Inakaya continuous dining';ramenLife.userData.sharedAsset=true;ramenLife.visible=false;scene.add(ramenLife);
// On the island the ramen counter is Sato Ramen, inside Minato's building (world/sato-ramen-layout.js).
const ramenBlocked=(x,z,r=.3)=>(suppliedRoomBoundsBlocked(SATO_ROOM,x,z,r)||SATO_COLLIDERS.some(c=>circleHitsRect(x,z,r,c)));
function hideRamen(){scene.add(ramenLife);ramenLife.visible=false;}
const ramenGuests=createIndoorResidents({world,parent:ramenLife,collides:ramenBlocked,getRain:()=>weather,place:'ramen',onBorrow:npcActivities.release,getState:()=>activities.state}),homeGuests=createHomeResidents({world,parent:scene,getPlayerSeat:()=>seated?parkSeat?.position:null,getState:()=>activities.state,collides:(x,z,r,y)=>environmentBlocked(x,z,r,'player',y),onBorrow:npcActivities.release,getRain:()=>weather});
// Mrs Sato's kitchen: she cooks and carries every bowl, the regulars' and yours (people/ramen-kitchen.js).
const satoKitchen=createRamenKitchen({getMinutes:()=>minutes,isAfterLunch:()=>{const m=((minutes%1440)+1440)%1440;return m>=SATO_RAMEN.close&&m<SATO_RAMEN.close+60;},getCook:()=>{const g=world.people.find(p=>p.profile.name==='Mrs Sato')?.g;return g&&g.visible&&g.userData.inRamen&&!g.userData.roomTransition?g:null;}});
const ramenMeals=createVenueService({room:ramenLife,place:'ramen',getMinutes:()=>minutes,ledger:residentLedger,getCustomers:()=>world.people.filter(p=>p.g.userData.inRamen),
 ...(({staffName:'Mrs Sato',venueName:'Sato Ramen',getStaff:()=>world.people.find(p=>p.profile.name==='Mrs Sato')?.g||null,
  kitchen:satoKitchen,meal:MEALS.lunch,drinkFor:name=>SATO_LUNCH_DRINK[name]||'mugicha',tableFor:p=>SATO_GUEST_SEATS[p.g.userData.ramenSeat]?.table}))});
let storeClerk=world.people.find(p=>p.profile.name==='Thuan').g,storeWelcomed=false;
const sakuraShop=createSakuraShop({stair:dir=>takeSakuraStair(dir),world,scene,state:activities.state,ledger:residentLedger,register:reg,action:activities.action,exit:leaveRoom,getMinutes:()=>minutes,getPlayerSeat:()=>parkSeat?.storeSeatId,getPlayerPosition:()=>player.position,isInside:()=>current?.id==='market',pay:activities.spend,say,onBorrow:npcActivities.release,getRain:()=>weather,save:()=>{if(!catchingUp)activities.save();}});
storeService=sakuraShop.service;
/**
 * Puts the real shop behind the real glazing, and retires the stand-in shelves that
 * stood there while it was only a facade. The interior arrives with the rest of the
 * street detail, so this is called again when it lands; until then the stand-in keeps
 * the window from being empty.
 */
function showShopThroughWindow(){
 const site=SITES.find(s=>s.id==='market');
 if(!site?.streetFrontage||!sakuraShop.street(town,site.streetFrontage)){sakuraShop.hide();return false;}
 shopStreetView.invalidate();townSections.invalidate();
 return true;
}
function ensureThuan(){return storeClerk;}
function startVenueService(place){venueService=createVenueService({room,place,bar:()=>beerService,drinkFor:name=>place==='izakaya'&&name==='Thuan'?'beer':null,tableFor:p=>place==='izakaya'?IZAKAYA_GUEST_SEATS[p.g.userData.izakayaSeat]?.table:SATO_GUEST_SEATS[p.g.userData.ramenSeat]?.table,getMinutes:()=>minutes,ledger:residentLedger,getCustomers:()=>world.people.filter(p=>place==='izakaya'?p.g.userData.inIzakaya:p.g.userData.inRamen),getStaff:()=>place==='izakaya'?world.people.find(p=>p.profile.name==='Thao')?.g:null});}
function startSharedDiningServices(){
 izakayaTV=activeRoomLayout.television;izakayaGuests.sync(minutes);startVenueService('izakaya');
 beerService=createBeerService({room,say,blocked:environmentBlocked,bar:activeRoomLayout.bar,getNao:()=>{const n=world.people.find(p=>p.profile.name==='Thao')?.g;return izakayaOpen(minutes)&&n&&n.userData.inIzakaya&&n.visible&&!n.userData.roomTransition?n:null;}});
 // Sato's ongoing kitchen and regulars keep their lifetime across room visits.
 room.add(ramenLife);ramenLife.visible=true;ramenGuests.sync(minutes);
 ramenPlayerService=createRamenPlayerService({room,getSeat:()=>Number.isInteger(parkSeat?.ramenSeatId)?parkSeat:null,getMinutes:()=>minutes,getBalance:()=>activities.state.yen,pay:activities.spend,say,ticket:{has:item=>hasRamenTicket(activities.state,item),use:item=>{const used=useRamenTicket(activities.state,item);if(used)activities.save?.();return used;}},
  onMouthful:ramenMouthful,canOrder:item=>item.prop==='beer'&&!wantsAnother(tipsy,DRINKS.bottle.alcohol)?"Mrs Sato shakes her head: You’ve had enough. Have a cold barley tea instead.":true,
  ...({menu:SATO_MENU,isOpen:satoRamenOpen,title:SATO_RAMEN.title,server:'Mrs Sato',kitchen:satoKitchen,closedLine:'Sato Ramen serves lunch, 11:00 to 14:00. Mrs Sato has put the stools up.'})});
}
function addRoomProps(s){
  if(s.id==='market'){shopStreetView.invalidate();storeWelcomed=false;sakuraShop.enter(room,{quiet:sakuraStairArrival});roomColliders.push(...sakuraShop.colliders);sakuraShop.update(0);return;}
  if(s.id==='warehouse')return;
  if(s.id==='school'){roomColliders.push(...activeRoomLayout.colliders);activeRoomLayout.tick(0,minutes,elapsed);return;}
  if(s.id==='onsen'){roomColliders.push(...activeRoomLayout.colliders);activeRoomLayout.tick(0,minutes);onsenGuests.sync(minutes);return;}
  // Ms Ganaha is at her window, or not, from the moment you come in (port-hall.js).
  if(s.id==='ferry-terminal')activeRoomLayout?.tick?.(0,minutes);
  if(s.id==='izakaya'){
    activeRoomLayout=buildIzakayaRoom({room,box,reg,collider:roomCollider,action:activities.action,exit:leaveRoom,signTexture:signTex,getMinutes:()=>minutes,exploration:{state:activities.state,show:activities.menu,save:activities.save,close:activities.close}});
    if(!izakayaOpen(minutes))say(closedGreeting(minutes),6);
    room.add(new THREE.HemisphereLight(0xffdfaa,0x886d5f,1.6));
  }
  if(sharedDining(s)){shopStreetView.invalidate();startSharedDiningServices();return;}
  if(activeRoomLayout){
    if(homeOwner(s)){activeRoomLayout.tick?.(0,minutes,elapsed);homeGuests.enter(activeRoomLayout.prepareBedding?{...s,homeLayouts:{[homeOwner(s)]:activeRoomLayout}}:activeRoomLayout.homeLayouts?{...s,entranceRoute:activeRoomLayout.entranceRoute,homeLayouts:{...s.homeLayouts,...activeRoomLayout.homeLayouts}}:s,minutes);}
    return;
  }
}


function clearRoom({enteringMarket=false}={}){johansson?.cancelTableDrink();townSections.invalidate();shopStreetView.dispose();indoorCeilings=null;room.name='Room';activeRoomLayout?.dispose?.();if(enteringMarket)sakuraShop.hide();else showShopThroughWindow();izakayaTV?.dispose();izakayaTV=null;activeRoomLayout?.workshop?.dispose();storeService?.cancel();ramenPlayerService?.dispose();ramenPlayerService=null;venueService?.dispose();venueService=null;beerService?.clear();beerService=null;workplaceResidents.restore();bookshopCustomers.restore();neighbourChats.cancel();chatBubble.hide();activeRoomLayout=null;izakayaGuests.restore();onsenGuests.restore();hideRamen();homeGuests.restore();roomColliders.length=0;const materials=new Set(),geos=new Set();room.traverse(o=>{for(let p=o;p&&p!==room;p=p.parent)if(p.userData.sharedAsset)return;if(o.isMesh){const list=Array.isArray(o.material)?o.material:[o.material];if(!o.userData.preserveMaterial)list.forEach(m=>m&&materials.add(m));if(![...boxCache.values()].includes(o.geometry))geos.add(o.geometry);}});materials.forEach(m=>{if(!m.map?.userData?.sharedAsset)m.map?.dispose?.();m.dispose?.();});geos.forEach(g=>g.dispose?.());while(room.children.length)room.remove(room.children[0]);for(let i=interactables.length-1;i>=0;i--)if(interactables[i].userData?.hit?.inside&&!interactables[i].userData.persistentShop&&!interactables[i].userData.name)interactables.splice(i,1);}
function roomShell(s){
 if(s.id===NAHA_ARRIVALS.id){clearRoom();town.visible=false;room.visible=true;activeRoomLayout=buildAirportArrivals({room,reg,action:activities.action,onReturn:()=>islandPlay.returnFlight()});return;}
 clearRoom({enteringMarket:s.id==='market'});town.visible=false;room.visible=true;
 const shared={site:s,room,reg,collider:roomCollider,action:(...args)=>{if(!islandPlay?.action(...args))activities.action(...args);},exit:leaveRoom};
 if(s.id==='market'){activeRoomLayout={...sakuraShop.layout,blocked:(x,z,r)=>suppliedRoomBoundsBlocked(SAKURA_LAYOUT,x,z,r)};return;}
 if(s.linuxResidence){activeRoomLayout=buildLinuxBedroom({...shared,box,owner:s.owner,exit:leaveRoom,onRest:()=>{if(linuxLife?.active===s.owner)linuxLife.goHome({sleep:true}).catch(error=>say(error.message));}});return;}
 // Sakura's office storey: a room of its own, reached only up the shop's stair (sakura-stairs.js); its fire door the only
 // other way out, from inside.
 if(s.id==='sakura-office'){const g=new THREE.Group();g.name='Sakura office storey';room.add(g);activeRoomLayout=buildSakuraOfficeRoom({...shared,room:g,downstairs:()=>takeSakuraStair('down'),evacuate:evacuateSakuraOffice});return;}
 if(s.id==='school'){activeRoomLayout=buildClassroom(shared);return;}
 if(s.id==='community-kitchen'){activeRoomLayout=buildCommunityKitchen(shared);return;}
 // The doctor is at her desk when Nhung's own day has her at work in the clinic (people/clinic-hours.js), read at the door.
 if(s.id==='clinic'){activeRoomLayout=buildClinic({...shared,doctorIn:()=>world.people.find(p=>p.profile.name==='Nhung')?.g.userData.indoors==='work'});return;}
 if(s.id==='ferry-terminal'){activeRoomLayout=buildPortHall({...shared,naha:takeNahaBoat,upstairs:()=>crossThreshold(async()=>{leaveRoom();const office=SITES.find(site=>site.id==='office');if(office)await enterRoom(office);})});return;}
 if(s.id===CITY_RESTAURANT.id){
  // A fixed scene: no hands in front of the camera, and the dinner menu opens as you sit down.
  activeRoomLayout=buildCityRestaurant({...shared,johansson:playerRecipe()});hands.firstPersonVisible=false;
  const dinner=activeRoomLayout.dinner;
  dinner.leave=()=>{if(current?.id!==CITY_RESTAURANT.id)return;leaveRoom();say('The last boat home: Thuan asleep on your shoulder by Kitano-jima, the island’s lights coming up out of the dark.',6);};
  say('Naha, the top floor of the Hotel Ryūsei. E for the dinner menu.',4);
  setTimeout(()=>{if(!photoStudio?.active&&current?.id===CITY_RESTAURANT.id&&activeRoomLayout?.dinner===dinner)activities.action('city-dinner',CITY_RESTAURANT.title,dinner);},1400);
  return;}
 if(s.familyHome){activeRoomLayout=(s.upperHome?buildUpperHome:buildFamilyHome)({...shared,household:s.familyHome,residents:s.residents,title:s.title,kind:s.houseKind});return;}
 if(s.id==='mayor-home'){activeRoomLayout=buildMayorHome({...shared,sleep:sleepUntilMorning,player:()=>player.position.toArray(),
  // The sliding doors keep their state by id, under the house's own name (johansson-house.js RF6).
  doors:{get:id=>activities.state[HOUSE_SAVE]?.doors?.[id],set:(id,open)=>{const h=activities.state[HOUSE_SAVE]??={schema:2,doors:{}};(h.doors??={})[id]=!!open;activities.save();}},post:{unread:()=>activities.unreadPost,open:()=>activities.post()},television:()=>{const typhoon=weatherMode==='random'&&typhoonAt(minutes);if(!newsOn(minutes))return typhoon?typhoonBulletin(typhoon,minutes):null;const news=eveningNews(activities.state,minutes,{weather:weatherMode==='random'});activities.save();return news;}});
  // His home as it was decorated and furnished in Johansson Studio (src/studio-handoff.js): World shows it, Studio changes it.
  const furniture=showHomeFurniture({group:room.getObjectByName('Mayor’s home'),colliders:roomColliders,state:activities.state,floor:MAYOR_HOME_FLOOR.walkable,keepClear:MAYOR_HOME_FLOOR.keepClear});
  const decor=createHomeCustomization({room,state:activities.state});
  activeRoomLayout.redress=()=>{decor.snapshot();furniture.reload();};
  activeRoomLayout.snapshot=()=>({decor:decor.snapshot(),furniture:furniture.placements.list()});return;}
 // Who is at the street door and who is past the step (their shoes are there): the player, unnamed, and the bathers.
 if(s.id==='onsen'){activeRoomLayout=buildOnsenInterior({...shared,people:()=>[{name:null,x:player.position.x,z:player.position.z},...world.people.filter(p=>p.g.userData.inOnsen&&p.g.visible).map(p=>({name:p.profile.name,x:p.g.position.x,z:p.g.position.z}))]});return;}
 if(s.id==='koban'){activeRoomLayout=buildPoliceStationInterior(shared);return;}
 // Johansson Mart, Kitahama (world/interiors/kitahama-shop-room.js): its own models, in the shop's own frame.
 if(s.id==='kitahama-shop'){activeRoomLayout=buildKitahamaShopRoom({...shared,getMinutes:()=>minutes});return;}
 if(s.id==='ramen'){activeRoomLayout=buildSatoRamenRoom({...shared,getMinutes:()=>minutes,exploration:{state:activities.state,show:activities.menu,save:activities.save,close:activities.close}});return;}
 // A home with a room of its own (the office, the police box) keeps it; everyone else gets a flat.
 activeRoomLayout=homeOwner(s)&&!s.ownRoom?buildResidentHome({...shared,profile:world.people.find(p=>p.profile.name===homeOwner(s)).profile,box}):s.id==='warehouse'?buildWarehouseInterior(shared):buildCompactShop(shared)||buildSuppliedRoom(shared);
 if(activeRoomLayout||s.id==='izakaya')return;
 if(s.id==='market')return;
 throw Error('No interior defined for '+s.id);
}


/**
 * Doorways.
 *
 * You go in and out with a button, never by walking: brushing past the workshop door
 * used to put you inside it. Near a door the Enter button names the building; inside,
 * Exit to street is always there. The heading still survives the door, and the
 * crossing is a short veil rather than a cut.
 */
const DOOR_REACH=2.4;
/** The nearest building whose door you are standing at, or null. */
function doorNearby(){
 if(current)return null;
 const p=player.position;let best=null,bestD=DOOR_REACH;
 // Sites, and the landmarks you can walk into (the warehouse, the port terminal).
 for(const s of [...SITES,...(world.landmarks||[]).filter(l=>Number.isFinite(l.entryFacing))]){
  const d=s.approachPosition||s.door;if(!d)continue;
  const dist=Math.hypot(p.x-d[0],p.z-(d[2]??d[1]));
  if(dist<bestD){best=s;bestD=dist;}
 }
 return best;
}
let doorSite=null;

/**
 * The crossing itself: chime, a short veil over the swap, and the heading carried
 * across. The veil also covers a room that has to stream its model in.
 */
async function crossThreshold(run,{chime=true}={}){
 const veil=$('#threshold');
 if(chime)townAudio.play('door-chime',.42);
 veil.classList.add('on');
 await new Promise(r=>setTimeout(r,150));
 try{await run();}finally{
  await new Promise(r=>setTimeout(r,60));
  veil.classList.remove('on');
 }
}

let roomLoading=false;
/**
 * Sakura's stair is a climb you watch (the owner, 27 October 2026: "The black part should not be shown it should be like a
 * loading screen when you up the stairs the loading starts for the top Floor"; "No the loading screen is walking up the
 * stairs"; "Camera should lock from below we just see him go up"; drawing SK-ST-001). Stepping onto it, or "Go upstairs"
 * / "Go downstairs", walks him the whole stair at a walking pace in this storey (it draws the whole stairwell), seen from
 * its locked stairwell camera, while the other storey loads; then the picture cuts and he arrives at the other end.
 * Nobody walks the flights by hand (the owner, 20 October 2026: "I don't want the stairs to be traversable").
 */
let stairPassage=null,stairArmed=true,sakuraStairArrival=false;
function takeSakuraStair(direction){
 const up=direction==='up';
 if(stairPassage||roomLoading||(up?current?.id!=='market':current?.id!=='sakura-office'))return false;
 replayInterrupted();resetInput();pointWalk.cancel();seated=false;parkSeat=null;
 const v=p=>new THREE.Vector3(...p),path=[player.position.clone(),...(up?SAKURA_STAIR_CLIMB.up.map(v):SAKURA_STAIR_CLIMB.down.map(p=>v(toOffice(p))))];
 const lengths=path.slice(1).map((p,i)=>p.distanceTo(path[i]));
 // The other storey starts loading now, while he climbs: the walk is the loading screen.
 const target=up?SAKURA_OFFICE_SITE:SITES.find(s=>s.id==='market');
 stairPassage={up,target,path,lengths,total:lengths.reduce((a,b)=>a+b,0),t:0,switching:false,cutting:false,look:null,
  camera:up?SAKURA_STAIR_CLIMB.camera.shop:{...SAKURA_STAIR_CLIMB.camera.office,at:toOffice(SAKURA_STAIR_CLIMB.camera.office.at),aim:toOffice(SAKURA_STAIR_CLIMB.camera.office.aim)},ready:(up?loadRoomAssets(target):sakuraShop.ready()).catch(error=>{console.error('Could not load '+target.id,error);return false;})};
 return true;
}
/** One step of the climb: along the path at a walking pace, facing the way he goes. */
function stepStairPassage(dt){
 // While the other storey opens he stands where the walk ended: it must not move him.
 if(stairPassage.switching){playerSpeed=0;placePassageView(dt);return;}
 const S=stairPassage,seconds=S.total/SAKURA_STAIR_CLIMB.speed;S.t=Math.min(seconds,S.t+dt);
 let d=S.total*(seconds?S.t/seconds:1),i=0;while(i<S.lengths.length-1&&d>S.lengths[i]){d-=S.lengths[i];i++;}
 const a=S.path[i],b=S.path[i+1],k=S.lengths[i]?Math.min(1,d/S.lengths[i]):1;
 player.position.lerpVectors(a,b,k);
 const dx=b.x-a.x,dz=b.z-a.z;if(Math.hypot(dx,dz)>.01){yaw=Math.atan2(-dx,-dz);player.quaternion.setFromAxisAngle(yAxis,yaw);}
 playerSpeed=SAKURA_STAIR_CLIMB.speed;
 placePassageView(dt);
 if(S.t>=seconds&&!S.switching){S.switching=true;finishStairPassage();}
}
/** The view while he climbs: the storey's locked stairwell camera in third person, his own eyes in the first. */
function placePassageView(dt){
 if(stairPassage.cutting)return;
 if(thirdPerson){player.visible=false;placeStairCamera(dt);return;}
 camera.position.set(player.position.x,player.position.y+1.6,player.position.z);camera.rotation.order='YXZ';camera.rotation.set(stairPassage.up?.18:-.28,yaw,0);
}
/** At the end of the walk: if the other storey is still loading he waits there, in view; then the cut and his arrival. */
async function finishStairPassage(){
 const S=stairPassage,up=S.up,veil=$('#threshold'),end=SAKURA_STAIR_PASSAGE[up?'head':'foot'].arrive;
 const retreat=()=>{
  if(current?.id!==(up?'market':'sakura-office'))return;
  const back=SAKURA_STAIR_PASSAGE[up?'foot':'head'].arrive;
  player.position.set(...back.at);yaw=back.yaw;pitch=0;player.quaternion.setFromAxisAngle(yAxis,yaw);syncView();
 };
 try{
  if(!await S.ready){retreat();say('Could not open '+S.target.title+'. Please try the stairs again.',5);return false;}
  S.cutting=true;
  veil.style.transition=`opacity ${SAKURA_STAIR_CLIMB.cut/2}s linear`;veil.classList.add('on');
  await new Promise(r=>setTimeout(r,SAKURA_STAIR_CLIMB.cut*500));
  // Keep the current storey until the other room's prerequisites have succeeded.
  // roomShell retires it once; a failed preload leaves a usable room to return to.
  sakuraStairArrival=!up;
  if(await enterRoom(S.target,{at:[...end.at],yaw:end.yaw})===false){retreat();return false;}
  // His own camera behind him at once, level: the stair camera's aim must not carry into the first frame upstairs.
  pitch=0;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);if(thirdPerson){thirdDistance=2.2;placeThirdPerson(1);}
  say(up?'Sakura · the office upstairs.':'Sakura · the stockroom.',2);
  return true;
 }catch(error){
  console.error('Could not use Sakura stairs',error);retreat();say('Could not open '+S.target.title+'. Please try the stairs again.',5);return false;
 }finally{
  sakuraStairArrival=false;stairPassage=null;stairArmed=false;playerSpeed=0;resetInput();
  veil.style.transition=`opacity ${SAKURA_STAIR_CLIMB.cut/2}s linear`;veil.classList.remove('on');setTimeout(()=>{veil.style.transition='';},400);
 }
}
/** The locked stairwell camera: it stands still, aimed up (or down) its flight, and turns only a little after him (SK-ST-001). */
function placeStairCamera(dt){
 const S=stairPassage,C=S.camera,aim=new THREE.Vector3(...C.aim),target=aim.lerp(new THREE.Vector3(player.position.x,player.position.y+1.1,player.position.z),C.follow);
 S.look=S.look?S.look.lerp(target,1-Math.exp(-4*dt)):target.clone();
 camera.position.set(...C.at);camera.lookAt(S.look);
}
/** Stepping onto the stair at either end starts the passage, once he has stepped off it since he arrived. */
function checkSakuraStair(){
 if(stairPassage||!current)return;
 const p=player.position,end=current.id==='market'?onSakuraStairFoot(p):current.id==='sakura-office'?onSakuraStairHead(p):false;
 if(!end){stairArmed=true;return;}
 if(stairArmed)takeSakuraStair(current.id==='market'?'up':'down');
}
/**
 * The office's fire door opens from inside only (the owner: "it should be possible to evacuate through the fire ladder but
 * that door only open from the inside"): out onto the escape's landing, down the caged ladder (okinawa/old-town.js
 * SAKURA_BACK.fireEscape), and he is in the yard by its foot, looking back up it. From the yard it is look-only.
 */
async function evacuateSakuraOffice(){
 if(current?.id!=='sakura-office'||stairPassage||roomLoading)return;
 const veil=$('#threshold');veil.style.transition='opacity .6s ease-in';veil.classList.add('on');
 townAudio.bells([[1760,0],[1760,.18],[1760,.36]],.12);
 await new Promise(r=>setTimeout(r,650));
 try{
  leaveRoom();
  // A few steps out from the ladder's foot, turned to look back up it, so the lens behind him has the yard, not the wall.
  const L=SAKURA_BACK.fireEscape.ladder,x=L.cageX-1.6,z=L.z;
  player.position.set(x,groundHeight(x,z),z);yaw=-Math.PI/2;pitch=0;player.quaternion.setFromAxisAngle(yAxis,yaw);unstuckPlayer();
  say('Out through the fire door, the bell ringing in the shop below, along the landing and down the caged ladder to the yard.',5);
 }finally{
  await new Promise(r=>setTimeout(r,150));veil.style.transition='opacity .5s ease-out';veil.classList.remove('on');setTimeout(()=>{veil.style.transition='';},600);
 }
}
/** Seated in Umi-no-yu's coin massage chair: the room's coin and timer (onsen.js ONSEN_MASSAGE), or null anywhere else. */
const massageChair=()=>seated&&current?.id==='onsen'&&parkSeat?.seatId==='massage'?activeRoomLayout?.massage||null:null;
/**
 * What a room is built of from World's catalogue (src/catalog: Johansson Studio's assets), by the room's site. Fetched once
 * the room's door comes within reach (updateContextControls), and waited for at the door if it has not come yet, so a room
 * never opens with a seat over nothing.
 */
const ROOM_ASSETS={onsen:ONSEN_ASSETS};
const roomAssetsReady=s=>(s.id!=='sakura-office'||tradePostersReady())&&(!s.industrialWorkshop||workshopPropsReady())&&(ROOM_ASSETS[s.id]||[]).every(assetLoaded);
async function loadRoomAssets(s){
 try{
  const all=await Promise.all([...(ROOM_ASSETS[s.id]||[]).map(id=>loadAsset(id)),...(s.industrialWorkshop?[preloadWorkshopProps()]:[]),...(s.id==='sakura-office'?[preloadTradePosters()]:[])]);
  return all.every(Boolean);
 }catch(error){console.error('Could not load room assets for '+s.id,error);return false;}
}
let roomAssetsTry=0;
/** `arrival`: where he comes in and which way he faces, when it is not the room's door (Sakura's stair, sakura-stairs.js). */
async function enterRoom(s,arrival=null){
 if(roomLoading)return false;
 roomLoading=true;
 try{
 replayInterrupted();lowerPocket();spawnScene?.cancel('room');
 s=SITES.find(site=>site.id===businessId(s.id))||s;
 if(playingResident()&&s.id===linuxLife.current().home.siteId&&(s.isResidence||s.homeOwner||s.familyHome||s.id==='mayor-home'))s=linuxOwnHomeSite(linuxLife.current());
 try{
 resetInput();
 if(s.id==='market'&&!await sakuraShop.ready()){say('Could not open Sakura. Please try the door again.',5);return false;}
 // Buildings remain accessible; business hours govern staff and service only.
 if((s.id==='izakaya'||(s.id==='ramen'))&&!izakayaReady('interior')){
  say('Opening '+s.title+'…',20);
  await preloadIzakaya(['interior']);
  if(!izakayaReady('interior')){say('Could not open '+s.title+'. Please try the door again.',5);return false;}
 }
 // Johansson Mart's models are shared with the street; wait for them at the door so the room never opens empty.
 if(s.id==='kitahama-shop'){
  if(!await kitahamaShopRoomReady()){say('Could not open '+s.title+'. Please try the door again.',5);return false;}
 }
 if(!roomAssetsReady(s)){
  say('Opening '+s.title+'…',20);
  if(!await loadRoomAssets(s)){say('Could not open '+s.title+'. Please try the door again.',5);return false;}
 }
 }catch(error){
  console.error('Could not load '+s.id,error);say('Could not open '+s.title+'. Please try the door again.',5);return false;
 }
 parkSeat=null;seated=false;activities.close();if(!photoStudio?.active&&!photoReturning)activities.visit(s.id);
 const streetYaw=yaw,streetPitch=pitch;
 try{
 current=s;roomShell(s);addRoomProps(s);content=buildBusinessContent({site:s,room,register:reg,onAction:activities.action,onInspect:item=>inspector.open(item)});if(!activeRoomLayout?.storeys)room.traverse(o=>{if(!o.isMesh||o.userData.sharedAsset)return;const b=o.geometry?.parameters;if(b?.height<.25&&o.position.y>3.8||o.position.z>6&&o.position.y>1||o.position.x>6&&o.position.y>1){o.userData.cutaway=true;o.layers.set(0);}});indoorCeilings=createIndoorCeilings(room,{from:activeRoomLayout?.ceilingsFrom});const spawn=arrival?.at||activeRoomLayout?.spawn||[0,0,4.3];
 // The storeys drawn for where he arrives (a room of more than one storey shows the floor he stands on), before the first frame.
 activeRoomLayout?.follow?.({x:spawn[0],y:spawn[1]??0,z:spawn[2]});
 player.position.set(...spawn);
 // With the camera behind him, start a step inside so it is not up against the door.
 // Each step of it is one his feet could take (world/room-arrival.js): up a stair he climbs it, never stands under it.
 if(thirdPerson&&!arrival)player.position.set(...stepInside(player.position.toArray(),activeRoomLayout?.yaw??0,{step:roomStep,lens:(x,y,z)=>cameraBlocked(x,z,y+.9,.35)}));
 unstuckPlayer();workplaceResidents.enter(s,minutes);bookshopCustomers.enter(s,minutes);

 // The heading goes through the door with you. Snapping to the room's own yaw and a
 // level pitch is the single thing that most makes an interior read as a different
 // place: you walk in looking where you were looking, not where the room says.
 yaw=Number.isFinite(arrival?.yaw)?arrival.yaw:roomyHeading(streetToRoom(streetYaw,s,activeRoomLayout));player.quaternion.setFromAxisAngle(yAxis,yaw);
 pitch=THREE.MathUtils.clamp(streetPitch,-.55,.55);$('#exitRoomButton').classList.remove('hidden');syncView();active=null;$('#place').textContent=s.title;$('#placeSub').textContent=`${s.jp} · ${s.sub}`;$('#timeText').textContent=s.line;if(!s.arrival)say(s.id==='crystal-room'&&activeRoomLayout?'The timber door closes. Something here does not belong to the street.':`${s.title} · Explore the room. Tap objects nearby to examine them.`,s.id==='crystal-room'?5:3);camera.position.copy(player.position);camera.position.y+=1.7;
 }catch(error){
  // A rejected room build must not leave the frame loop inside a half-built
  // venue. Restore the normal street lifetime and keep the door usable.
  console.error('Could not enter '+s.id,error);
  leaveRoom();yaw=streetYaw;pitch=streetPitch;player.quaternion.setFromAxisAngle(yAxis,yaw);
  resetInput();say('Could not open '+s.title+'. You are safely outside. Please try the door again.',6);
  return false;
 }
 return true;
 }finally{roomLoading=false;}
}
function leaveRoom(destination=null){if(!current)return;if(current.linuxResidence)linuxLife?.leaveHome();replayInterrupted();lowerPocket();spawnScene?.cancel('room');if(!photoStudio?.active&&!photoReturning&&current.id===NAHA_ARRIVALS.id&&activities.state.island?.journey.location==='naha'){islandPlay.returnFlight();return;}wearSwim(false);inspector?.close();activities.close();resetInput();$('#directory').classList.add('hidden');document.body.classList.remove('town-menu-open');$('#exitRoomButton').classList.add('hidden');seated=false;parkSeat=null;active=null;const s=sharedDining(current)&&['izakaya','ramen'].includes(destination)?SITES.find(site=>site.id===destination)||current:current;
 const roomYaw=yaw,roomPitch=pitch,roomLayout=activeRoomLayout;
 // A closed room has no renderer or interaction lifetime. Restore its borrowed
 // residents before disposing room-owned resources; Sakura remains the one live
 // shop behind its street windows. Re-entering constructs only the active venue.
 clearRoom();current=null;if(s?.id===CITY_RESTAURANT.id)hands.firstPersonVisible=!thirdPerson;syncView();room.visible=false;town.visible=true;if(s)placeAtEntrance(s,true);
 // and back out again the same way, by the same rotation: you leave facing where you
 // were facing inside, which for somebody who walked at the door is the street.
 if(s){yaw=roomToStreet(roomYaw,s,roomLayout);pitch=THREE.MathUtils.clamp(roomPitch,-.55,.55);player.quaternion.setFromAxisAngle(yAxis,yaw);}
 say(syncExteriorPlace(),1.5);}

function leaveNearbyDoor(){leaveRoom(activeRoomLayout?.exitSiteAt?.(player.position.x,player.position.z));}

function syncExteriorPlace(){
 const phase=islandPlay?.phase,airport=islandPlay?.snapshot().location==='airport',aboard=!current&&!!deckUnder(),run=world.ferry;
 // Aboard she is the place: her name, and where she is (alongside at which pier, or at sea and bound where).
 const where=aboard?(run.phase==='crossing'?'AT SEA · BOUND FOR '+(run.destination==='airport'?'KITANO-JIMA':'MINATO'):run.berth==='airport'?'ALONGSIDE · KITANO-JIMA PIER':'ALONGSIDE · MINATO OUTER PIER'):null;
 const title=aboard?'Minato Maru':phase==='ferry'?'Minato–Kitano-jima Ferry':phase==='flight'?'Island Commuter Flight':airport?'Kitano-jima Airport':'Minato Machi';
 const detail=aboard?'The Minato Maru · '+where:phase==='ferry'?'Minato–Kitano-jima · PASSENGER DECK':phase==='flight'?'Island commuter service · IN FLIGHT':airport?'Kitano-jima · PASSENGER TERMINAL':'Minato Machi · HARBOUR DISTRICT';
 const line=airport?'The passenger counter and promenade are open.':'Shops are open.';
 if($('#place').textContent!==title)$('#place').textContent=title;
 if($('#placeSub').textContent!==detail)$('#placeSub').textContent=detail;
 if($('#timeText').textContent!==line)$('#timeText').textContent=line;
 return airport?'Kitano-jima Airport':'Johansson Street';
}

function welcomeAtCounter(forward){
  if(storeWelcomed||!storeClerk?.visible||storeClerk.userData.visualReady===false||current?.id!=='market')return;
  const towards=storeClerk.position.clone().sub(player.position);towards.y=0;
  // Let the player see the greeting before the dialogue card covers the view.
  // Once per visit, only when approaching and looking towards the counter.
  if(towards.length()>3||forward.dot(towards.normalize())<.65)return;
  storeWelcomed=true;characters.gesture(storeClerk);
}
function interaction(){if(pocket?.raised){active=null;$('#prompt').classList.remove('on');return;}if(seated){active=null;const chair=massageChair(),timer=chair?.state();$('#prompt').textContent=chair?'Massage '+(timer.running?timer.reads:'¥'+chair.coin)+' · Stand':Number.isInteger(parkSeat?.ramenSeatId)?(ramenPlayerService?.order?.delivered?'Eat / drink · Stand':ramenPlayerService?.order?'Order on its way · Stand':'Order food · Stand'):'Stand';$('#prompt').classList.add('on');return;}active=null;let best=null,dmax=3.1,bestScore=Infinity;const p=player.position.clone();p.y+=1;const fw=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));welcomeAtCounter(fw);for(const o of interactables){const h=o.userData.hit;const inside=h.inside||!!(o.userData.inMarket&&current?.id==='market');if(o.userData.visualReady===false||o.userData.inVehicle||!o.visible||current&&!inside||!current&&inside)continue;let visible=true;for(let a=o.parent;a;a=a.parent)if(!a.visible)visible=false;if(!visible)continue;const q=new THREE.Vector3();o.getWorldPosition(q);if(o.userData.sameLevel&&Math.abs(q.y-p.y)>1.2)continue;const target=q.clone(),v=q.sub(p),d=v.length();if(d>dmax)continue;v.y=0;
  // What you are facing, not merely what is nearest: things behind you or well off to the
  // side are out (unless you are all but touching them), and people come before things.
  const facingDot=v.lengthSq()?fw.dot(v.normalize()):1;if(facingDot<.3&&d>.9)continue;
  // A prompt may ask for less: its own reach, and a facing it wants before it is offered at all (the engine room's
  // machines stand a step apart, and a thing you are not looking at must not take the button).
  if(o.userData.reach&&d>o.userData.reach)continue;if(o.userData.facing&&facingDot<o.userData.facing&&d>.9)continue;
  const score=o.userData.storeItem?shelfAimScore(camera.position,camera.getWorldDirection(new THREE.Vector3()),target):d*(1+(1-facingDot)*1.4)+(o.userData.promptPenalty||0)-(/^Talk to /.test(h.label)?.6:0);if(score>=bestScore)continue;bestScore=score;best={...h,object:o}}const e=$('#prompt');if(best){active=best;e.textContent=(touch?'':'E · ')+best.label;e.classList.add('on')}else e.classList.remove('on')}
function standUp(){if(!seated)return;johansson?.cancelTableDrink();ramenPlayerService?.cancel();if(parkSeat?.stand)player.position.set(...parkSeat.stand);parkSeat=null;seated=false;unstuckPlayer();ensureDailyQuests(activities.state);if(form3NudgeAllowed(activities.state,minutes)){markDailyDone(activities.state,'form3_sell');activities.save();nudge(FORM3_NUDGE,6);}}
function doInteract(){if(linuxLife?.wake())return;if(concert?.active||concertLoading)return;if(replayPlayer||pocket?.raised)return;spawnScene?.cancel();if(islandPlay?.cinematic)return;if(catchingUp||roomLoading||activities.paused)return;if(seated){if(massageChair())activities.action('massage-chair');else if(Number.isInteger(parkSeat?.ramenSeatId))activities.action('store-table');else if(parkSeat?.izakaya)activities.action('izakaya-table');else standUp();return;}if(inspector?.active)return;if($('#directory').classList.contains('hidden')){interaction();if(active)active.fn?.();}}
// `who`: a room collider with `only` set stops only that walker.
// `deckY`: standing on the ferry's deck at that height (ferry-walk.js): her own solids are tested there, not the town's
// bounds (she lies over the water), its fixed colliders (the pier's bitts and fenders beside her) nor the collider that
// keeps people on the pier off her hull; only what moves with her (the cars on her deck).
function environmentBlocked(x,z,r=PLAYER_RADIUS,who='player',deckY=null){const aboard=Number.isFinite(deckY)&&!current;
 const bounds=current?(activeRoomLayout?suppliedRoomBoundsBlocked(activeRoomLayout,x,z,r):roomBoundsBlocked(x,z,r)):!aboard&&townBoundsBlocked(x,z,r);if(bounds)return true;
 const y=current?(Number.isFinite(deckY)?deckY:roomWalk()?player.position.y:0):aboard?deckY:groundHeight(x,z),hit=c=>(!c.only||c.only===who)&&!(aboard&&(c.id==='ferry'||!c.moving))&&standingHitsRect(x,z,r,y,c);
 return current?roomColliders.some(hit):colliderGrid.some(x,z,r,hit);}
/**
 * Walking aboard the Minato Maru while she lies alongside (ferry-walk.js): her decks are floors that move with her.
 * `deckUnder` is the floor under the player's feet, or null on the town's ground.
 */
function shipWalk(){if(!ferryWalk&&world.ferry?.ferry)ferryWalk=createFerryWalk(world.ferry);return ferryWalk;}
/**
 * A room of more than one storey (Johansson's house, interiors/johansson-house-interior.js): its floors stack, and the
 * one under his feet is the one nearest them within a step (house-walk.js), as aboard the ferry.
 */
function roomWalk(){return current?activeRoomLayout?.walk??null:null;}
/** The floor of a room with storeys under (x, z) for feet at y, or y itself where there is none. */
function roomFloorAt(x,z,y=player.position.y){return roomWalk()?.floorAt(x,z,y)?.y??y;}
function deckUnder(x=player.position.x,z=player.position.z,y=player.position.y){return current?null:shipWalk()?.floorBelow(x,z,y)??null;}
/** The engine-room ladder (ferry-inspect.js FERRY_LADDER): the prompt takes him down to the floor plates, or back up. */
function ferryLadder(way){
 const l=FERRY_LADDER[way],f=world.ferry?.ferry;if(!l||!f)return;
 crossThreshold(()=>{const v=new THREE.Vector3(...l.to);f.localToWorld(v);if(seated){seated=false;parkSeat=null;johansson?.seat?.(null);}player.position.copy(v);yaw=f.rotation.y+l.yaw;say(l.note,3.5);});
}
/**
 * A station of the Minato Maru's plant (ferry-plant-controls.js, 6r-2): a menu of what the machine can do now; each
 * choice works the plant and the menu reopens with the result in the chief's words, the dials and prompts following.
 */
function plantStation(id,line=null){
 const run=world.ferry,st=PLANT_STATIONS.find(s=>s.id===id);if(!run||!st)return;
 const menu=stationMenu(run.plant,st);
 // On the web the engine room is a display piece (edition.js `machinery`): the station reads as it stands, nothing to work.
 if(!BUDGET.machinery){activities.menu(menu.title,menu.line,[['Close',activities.close]]);return;}
 activities.menu(menu.title,(line?line+'\n\n':'')+menu.line,[...menu.items.map(it=>[it.label,()=>{const r=it.act();run.refreshPlant();plantStation(id,r.ok?r.what:r.why);}]),['Close',activities.close]]);
}
/** Below the car deck (BELOW_DECK_FLOORS: the ladder, the floor plates, the booth) everybody wears ear defenders. */
let earDefendersOn=false;
function updateEarDefenders(){
 const id=current?null:deckUnder()?.floor?.id,below=!!id&&BELOW_DECK_FLOORS.includes(id);
 if(below===earDefendersOn)return;earDefendersOn=below;ensureJohansson().earDefenders(below);
}
/**
 * In the ferry's rooms the lens comes in to 2 m; nearer than HEAD_CAM (a wall at his back, a passage) it becomes a
 * head camera: he is hidden and the view keeps the way he looks, instead of a screen full of the back of his head.
 */
const HEAD_CAM=.85;
/** In one of her rooms: aboard, with a deckhead over him within about 2–2.7 m (the lens keeps under it, and comes in closer). */
let ferryExplorer=null,ferryExplorerUI=null,ferryViewMode=null,ferryRenderAt=null;
function ferryExploreActive(){
 if(!FERRY_H1_ENABLED)return false;
 ferryExplorer??=createFerryExploration(camera);
 const active=ferryExplorer.sync({ship:current?null:world.ferry?.ferry,position:player.position,deck:current?null:deckUnder(),
  override:!!(freeCamera.active||inspector?.active||photoStudio?.active||pocket?.raised||conversationName||islandPlay?.cinematic||window.__JOHANSSON_AUDIT__?.camera)});
 if(active&&!ferryExplorerUI)ferryExplorerUI=createFerryExplorationUI({explorer:ferryExplorer,onChange:()=>resetFerryInput()});
 ferryExplorerUI?.update(performance.now(),yaw);
 return active;
}
function ferryCameraLocked(){
 const active=ferryExploreActive(),mode=active?ferryExplorer.mode:'outside',locked=active&&mode!=='walk';
 if(mode!==ferryViewMode){const b=$('#viewButton');if(b){b.textContent=active?(locked?'Next saved angle':'Saved engine-room views'):thirdPerson?'Behind him':'His own eyes';if(active)b.removeAttribute('aria-pressed');else b.setAttribute('aria-pressed',String(thirdPerson));}ferryViewMode=mode;}
 return locked;
}
function applyFerryCamera(){
 // Refresh floor transforms after her final motion, before the one rendered lens update.
 if(!current&&ferryWalk&&ferryExplorer?.active)ferryWalk.update();
 if(!ferryExploreActive()){ferryRenderAt=null;return false;}
 const now=performance.now(),dt=ferryRenderAt===null?1/60:Math.min(.1,Math.max(0,(now-ferryRenderAt)/1000));ferryRenderAt=now;
 return ferryExplorer.apply({yaw,pitch,dt,fov:cameraControls.settings.fov});
}
function resetFerryInput(){walkMotion.reset();touchAutoRun.reset();resetInput();}
function changeView(){if(ferryExploreActive()){say(ferryExplorer.overview(),2);resetFerryInput();return;}setThirdPerson(!thirdPerson);}
function inspectFerryMachinery(){
 if(!ferryExploreActive())return false;
 if(ferryExplorer.mode==='inspect')ferryExplorer.walk();
 else if(!ferryExplorer.inspect(ferryExplorer.nearby()[0]))say('Move closer to machinery, or tap its visible surface.',3);
 resetFerryInput();return true;
}
function shipRoom(){const d=current?null:deckUnder();return !!d&&[1.95,2.2,2.45,2.65].some(h=>ferryWalk.cameraBlocked(player.position.x,player.position.z,d.y+h,.05));}
/** The ground under the player's feet: her deck aboard, the town's otherwise. */
function playerGround(){if(current)return roomWalk()?roomWalk().floorBelow(player.position.x,player.position.z,player.position.y)?.y??player.position.y:0;const d=deckUnder();return d?d.y:groundHeight(player.position.x,player.position.z);}
function entrancePoints(){return SITES.filter(s=>s.door).map(s=>[s.door[0],s.door[2]??s.door[1]]);}
function inEntrance(x,z,r=1.2){return entrancePoints().some(([dx,dz])=>Math.hypot(x-dx,z-dz)<r);}
function indoorNpc(g){return g.userData.inBookshop||g.userData.inWorkplace||g.userData.inIzakaya||g.userData.inOnsen||g.userData.inRamen||g.userData.inHome||g.userData.inMarket;}
function residentInView(g){if(g.userData.visualReady===false||g.userData.inVehicle)return false;for(let node=g;node;node=node.parent)if(!node.visible)return false;return current?!!indoorNpc(g):!indoorNpc(g);}
const residentPoint=new THREE.Vector3();
function residentEntities(){return [...world.people.map(p=>p.g),...(world.neighbours||[])];}
function residentsAt(x,z,radius=PLAYER_RADIUS){return residentEntities().filter(g=>{if(g.userData.playerControlled||!residentInView(g))return false;g.getWorldPosition(residentPoint);return (!roomWalk()||Math.abs(residentPoint.y-player.position.y)<1.5)&&circleHitsCircle(x,z,radius,residentPoint.x,residentPoint.z,NPC_RADIUS);});}
function overlapsResident(x,z){return residentsAt(x,z).length>0;}
function residentBlocked(x,z){if(!current&&inEntrance(x,z))return false;return overlapsResident(x,z);}
/** A step indoors from (x, y, z) to (nx, nz) by the room's own rules, as his feet take it in collides(): {ok, y}. */
function roomStep(x,y,z,nx,nz){
 const w=roomWalk();if(!w)return {ok:!environmentBlocked(nx,nz),y};
 const m=w.move(x,y,z,nx,nz,PLAYER_RADIUS,(bx,by,bz)=>environmentBlocked(bx,bz,.05,'player',by));
 return {ok:m.ok&&!environmentBlocked(nx,nz,PLAYER_RADIUS,'player',m.y),y:m.y};
}
function collides(x,z){
 if(roomWalk()){
  // Up and down the stair, and never off the edge of a floor: the step is onto a floor within a step of his feet.
  const y=player.position.y,step=roomWalk().move(player.position.x,y,player.position.z,x,z,PLAYER_RADIUS,(bx,by,bz)=>environmentBlocked(bx,bz,.05,'player',by));
  return !step.ok||environmentBlocked(x,z,PLAYER_RADIUS,'player',step.y)||residentBlocked(x,z);
 }
 if(!current&&shipWalk()){
  // On her decks, or stepping onto them (the gangway's foot, the ramp's flap) or off them onto the shore.
  const deck=deckUnder(),base=deck?deck.y:groundHeight(player.position.x,player.position.z);
  const step=ferryWalk.move(player.position.x,base,player.position.z,x,z,PLAYER_RADIUS);
  if(step)return !step.ok||environmentBlocked(x,z,PLAYER_RADIUS,'player',step.y)||residentBlocked(x,z);
  if(deck)return !canStepBetween(base,groundHeight(x,z))||environmentBlocked(x,z,PLAYER_RADIUS)||residentBlocked(x,z);
 }
 // Enter raised surfaces through their steps, rather than snapping up from the side.
 return (!current&&!canStepBetween(groundHeight(player.position.x,player.position.z),groundHeight(x,z)))||environmentBlocked(x,z,PLAYER_RADIUS)||residentBlocked(x,z);
}
function occupiedByPerson(x,z){return overlapsResident(x,z);}
function findClear(x0,z0,maxR=6){
 const ok=(x,z)=>!environmentBlocked(x,z)&&!occupiedByPerson(x,z)&&(!roomWalk()||!!roomWalk().floorAt(x,z,player.position.y));
 if(ok(x0,z0))return [x0,z0];
 for(let r=.25;r<=maxR;r+=.25){const n=Math.max(8,Math.round(r*14));for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=x0+Math.cos(a)*r,z=z0+Math.sin(a)*r;if(ok(x,z))return [x,z];}}
 if(!current){const s=world.spawn;if(s){const x=s[0],z=s[2]??s[1];if(ok(x,z))return [x,z];}}
 else if(activeRoomLayout?.spawn&&ok(activeRoomLayout.spawn[0],activeRoomLayout.spawn[2]))return [activeRoomLayout.spawn[0],activeRoomLayout.spawn[2]];
 else if(ok(0,4.3))return [0,4.3];
 return [x0,z0];
}
function unstuckPlayer(forceStreet=false){
 if(seated&&!forceStreet)return;
 const x=player.position.x,z=player.position.z;
 // Aboard: free unless something on her deck (a car rolling into its place) is on him; then the nearest clear spot on
 // the same deck, never a jump ashore.
 {const deck=forceStreet?null:deckUnder();if(deck){
  const clear=(px,pz)=>{const m=ferryWalk.move(x,deck.y,z,px,pz,PLAYER_RADIUS);return m?.ok&&Math.abs(m.y-deck.y)<.3&&!environmentBlocked(px,pz,PLAYER_RADIUS,'player',m.y)&&!occupiedByPerson(px,pz);};
  if(clear(x,z))return;
  // A passing crew member must not make the viewpoint teleport to another cell.
  if(ferryExplorer?.active&&ferryWalk.move(x,deck.y,z,x,z,PLAYER_RADIUS)?.ok&&!environmentBlocked(x,z,PLAYER_RADIUS,'player',deck.y))return;
  for(let r=.25;r<=4;r+=.25)for(let i=0,n=Math.max(8,Math.round(r*14));i<n;i++){const a=i/n*Math.PI*2,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(clear(px,pz)){player.position.set(px,ferryWalk.floorAt(px,pz,deck.y).y,pz);return;}}
  return;}}
 if(!environmentBlocked(x,z)&&!occupiedByPerson(x,z)&&(!roomWalk()||roomWalk().floorAt(x,z,player.position.y)))return;
 const [nx,nz]=findClear(x,z);
 player.position.set(nx,current?(roomWalk()?roomFloorAt(nx,nz):0):groundHeight(nx,nz),nz);
}
function evictIfClosed(){return false;}

function placeAtEntrance(s,leave=false){
 storeService?.cancel();parkSeat=null;seated=false;
 const mapped=doors.get(s.id);
 let x0,z0;
 if(!leave&&s.approachPosition){x0=s.approachPosition[0];z0=s.approachPosition[2];}
 else if(s.exitPosition){x0=s.exitPosition[0];z0=s.exitPosition[2];}
 else if(!leave&&s.isResidence&&Array.isArray(s.door)){x0=s.door[0];z0=s.door.length>2?s.door[2]:s.door[1];}
 else if(mapped){x0=mapped.x;z0=mapped.z+(leave?.6:s.id==='izakaya'?-1.2:.7);}
 else if(Array.isArray(s.door)){x0=s.door[0];z0=s.door.length>2?s.door[2]:s.door[1];}
 else return;
 ensureKitanoAt(x0,z0);
 yaw=leave?(s.entryFacing!=null?s.entryFacing+Math.PI:0):(s.entryFacing??(s.id==='izakaya'?Math.PI:s.side?-s.side*Math.PI/2:0));
 const fwX=-Math.sin(yaw),fwZ=-Math.cos(yaw);
 const [x,z]=findClear(x0+fwX*(leave?.6:0),z0+fwZ*(leave?.6:0));
 player.position.set(x,groundHeight(x,z),z);
}
let tunnelSignAt=-99;
function reachTheTunnelMouth(x,z){
 if(!world.tunnel?.splat?.(x,z)||elapsed-tunnelSignAt<6)return;
 tunnelSignAt=elapsed;
 say("Old sea cave · The descent is closed. You can read the sign beside the mouth.",3.5);
}
// Indoors the route is planned on a finer grid (a doorway is narrower than the town's 0.35 m), and in a room of more than
// one storey only over the floor he stands on: a tap is a walk on this floor, never across the stairwell.
const pointWalk=createPointWalk({blocked:(x,z,r)=>environmentBlocked(x,z,r)||!!roomWalk()&&!roomWalk().floorAt(x,z,player.position.y),heightAt:(x,z)=>current?0:groundHeight(x,z),radius:PLAYER_RADIUS,step:space=>space?ROOM_STEP:.35});
const walkMarker=new THREE.Mesh(new THREE.RingGeometry(.19,.25,24),new THREE.MeshBasicMaterial({color:0xfff4c9,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide}));
walkMarker.rotation.x=-Math.PI/2;walkMarker.visible=false;scene.add(walkMarker);
// A walk recorded step by step, or played back (src/input/replay.js; the audit's replay controls).
let replayRecorder=null,replayPlayer=null,replayNote='';
let replayLast=null;
function stopReplay(why=''){const report=replayPlayer?.report();if(report){replayLast=report;pointWalk.cancel();walkMarker.visible=false;}replayPlayer=null;if(why)replayNote=why;return report;}
/** A door changes the room and its coordinates: recordings stay in one place for now, so both stop, and say why. */
function replayInterrupted(){
 if(replayPlayer)stopReplay('stopped: the room changed (a recording stays in one place)');
 if(replayRecorder?.open){replayRecorder.cancel();replayNote='recording stopped: the room changed (a recording stays in one place)';}
}
function updatePlayer(dt){
 if(linuxLife?.inBed){
  const moving=Math.hypot(controllerFrame.move.x,controllerFrame.move.y)>.15||keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD||keys.ArrowUp||keys.ArrowDown||keys.ArrowLeft||keys.ArrowRight;
  if(moving)linuxLife.wake();
  else {const b=linuxLife.bed.position;({yaw,pitch}=lookStep(yaw,pitch,controllerFrame.look.x,controllerFrame.look.y,dt,cameraControls.settings));camera.position.set(b[0]+Math.sin(yaw+.65)*3.5,b[1]+2.5+Math.sin(pitch),b[2]+Math.cos(yaw+.65)*3.5);camera.lookAt(b[0],b[1]+.3,b[2]);return;}
 }

 if(islandPlay?.cinematic)return;
 // The docks opening holds on the harbour while the town finishes loading (render/spawn-scene.js): he waits for it.
 if(spawnScene?.holding)return;
 // Drink wears off with town time, an hour a drink; sleep clears it.
 tipsy=soberUp(tipsy,minutes-(tipsyClock??minutes));tipsyClock=minutes;
 if(!seated)unstuckPlayer();
 if(replayPlayer){const frame=replayPlayer.next();if(frame)return replayStep(frame);stopReplay('played to the end');}
 const fromX=player.position.x,fromZ=player.position.z;
 const lockedFerry=ferryCameraLocked(),exploring=ferryExplorer?.active;
 const lookX=controllerFrame.look.x+touchSticks.look.x+(keys.KeyL?1:0)-(keys.KeyJ?1:0),lookY=controllerFrame.look.y+touchSticks.look.y+(keys.KeyK?1:0)-(keys.KeyI?1:0);
 if(lockedFerry){if(ferryExplorer.mode==='inspect')ferryExplorer.orbit(lookX*dt*1.6,lookY*dt*1.6*(cameraControls.settings.invertY?-1:1));walkMotion.reset();playerSpeed=0;finishPlayerStep(dt,fromX,fromZ);return;}
 if(!lockedFerry)({yaw,pitch}=lookStep(yaw,pitch,THREE.MathUtils.clamp(lookX,-1,1),THREE.MathUtils.clamp(lookY,-1,1),dt,cameraControls.settings));
 let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-touchSticks.move.y-controllerFrame.move.y;
 let s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+touchSticks.move.x+controllerFrame.move.x;
 if(Math.hypot(f,s)>.05){spawnScene?.cancel();if(seated)standUp();pointWalk.cancel();hushSubtitle();}
 if(Math.hypot(lookX,lookY)>.05)spawnScene?.cancel();
 const walking=pointWalk.direction(player.position,dt,current);
 const movementYaw=yaw;
 walkMarker.visible=pointWalk.active;
 if(pointWalk.destination)walkMarker.position.set(pointWalk.destination.x,(current?0:groundHeight(pointWalk.destination.x,pointWalk.destination.z))+.05,pointWalk.destination.z);
 if(walking){
  f=(-Math.sin(movementYaw)*walking.x-Math.cos(movementYaw)*walking.z)*walking.strength;
  s=(Math.cos(movementYaw)*walking.x-Math.sin(movementYaw)*walking.z)*walking.strength;
 }
 if(seated){s=0;f=0;}
 // On touch: the stick steers as well as walks, and pushed to its rim it runs.
 const thumb=touchSticks.moving&&!seated,thumbPush=Math.hypot(touchSticks.move.x,touchSticks.move.y);
 if(thumb&&!lockedFerry&&!exploring)yaw+=steerYaw(touchSticks.move,dt,{looking:touchSticks.looking});
 const thumbRun=thumb?touchAutoRun.update(thumbPush,dt):(touchAutoRun.reset(),false);
 // Eased, so walking starts and stops like a person rather than a switch.
 if(move2.set(s,f).lengthSq()>1)move2.normalize();
 const eased=walking?(walkMotion.reset(),{x:move2.x,y:move2.y}):walkMotion.update(move2.x,move2.y,dt);if(seated)walkMotion.reset();move2.set(eased.x,eased.y);
 let wander=0,running=false;
 fwVec.set(-Math.sin(lockedFerry?movementYaw:yaw),0,-Math.cos(lockedFerry?movementYaw:yaw));rtVec.set(Math.cos(lockedFerry?movementYaw:yaw),0,-Math.sin(lockedFerry?movementYaw:yaw));moveVec.copy(fwVec).multiplyScalar(move2.y).addScaledVector(rtVec,move2.x);
 if(moveVec.lengthSq()>.0001){
  // Drunk, the feet do not quite go where they are pointed: the way home wanders.
  const drunk=Math.min(1,tipsy/DRUNK);wander=drunk>0?(Math.sin(elapsed*1.3)*.32+Math.sin(elapsed*.47+1)*.22)*drunk:0;
  running=!exploring&&!!(keys.ShiftLeft||keys.ShiftRight||touchRunning||thumbRun||controllerFrame.held[4]||activities.state.sprintUntil>performance.now());
  stepFeet(dt,wander,running);
 }
 if(replayRecorder?.open)replayRecorder.add({f:move2.y,s:move2.x,yaw,pitch,running,walking:!!walking,x:player.position.x,z:player.position.z,dt,wander});
 finishPlayerStep(dt,fromX,fromZ);
}
/** Moves the feet along moveVec for one step (wander: a drink's turn off the line), stopped by walls. */
function stepFeet(dt,wander,running){
 if(wander)moveVec.applyAxisAngle(yAxis,wander);
 const exploring=ferryExplorer?.active,precision=!!(keys.AltLeft||keys.AltRight);
 const speed=(exploring?(precision ? .35 : ferryExplorer.speed):(running?5.2:3))*dt,nx=player.position.x+moveVec.x*speed,nz=player.position.z+moveVec.z*speed;
 const stoppedX=collides(nx,player.position.z),streetStoppedZ=exploring?false:collides(player.position.x,nz);if(!stoppedX)player.position.x=nx;
 const stoppedZ=exploring?collides(player.position.x,nz):streetStoppedZ;if(!stoppedZ)player.position.z=nz;
 if(stoppedX||stoppedZ)reachTheTunnelMouth(nx,nz);
 turnQ.setFromAxisAngle(yAxis,Math.atan2(-moveVec.x,-moveVec.z));player.quaternion.slerp(turnQ,1-Math.pow(.001,dt));playerRunning=running;
}
/** One step of a recording played back: its view and its move, with no live input; in poses mode, its place too. */
function replayStep(frame){
 const dt=frame.dt,fromX=player.position.x,fromZ=player.position.z;
 yaw=frame.yaw;pitch=frame.pitch;walkMotion.reset();touchAutoRun.reset();
 move2.set(frame.s,frame.f);
 fwVec.set(-Math.sin(yaw),0,-Math.cos(yaw));rtVec.set(Math.cos(yaw),0,-Math.sin(yaw));moveVec.copy(fwVec).multiplyScalar(move2.y).addScaledVector(rtVec,move2.x);
 if(moveVec.lengthSq()>.0001)stepFeet(dt,frame.wander,frame.running);
 if(replayPlayer.mode==='poses'){
  player.position.x=frame.x;player.position.z=frame.z;
 }
 replayPlayer.check(player.position.x,player.position.z);
 finishPlayerStep(dt,fromX,fromZ);
}
function finishPlayerStep(dt,fromX,fromZ){
 if(ferryExploreActive()){playerSpeed=THREE.MathUtils.damp(playerSpeed,Math.hypot(player.position.x-fromX,player.position.z-fromZ)/Math.max(dt,1e-3),12,dt);player.visible=false;return;}
 playerSpeed=THREE.MathUtils.damp(playerSpeed,Math.hypot(player.position.x-fromX,player.position.z-fromZ)/Math.max(dt,1e-3),12,dt);

 player.visible=false;camera.position.copy(player.position).add(fwVec.set(0,seated?(parkSeat?parkSeat.eyeY-player.position.y:1.15):(playingResident()?ensureJohansson().avatar.height*.92:1.7)+(cameraControls.settings.bob&&move2.lengthSq()>.02?Math.sin(elapsed*11)*.018:0),0));camera.rotation.order='YXZ';const sway=Math.min(1,tipsy/DRUNK);camera.rotation.set(pitch+Math.sin(elapsed*.9)*.012*sway,yaw+Math.sin(elapsed*.55)*.02*sway,Math.sin(elapsed*.7)*.025*sway);if(thirdPerson)placeThirdPerson(dt);else if(current)camera.position.y=Math.min(camera.position.y,indoorCeilings?.limit(camera.position.x,camera.position.z,player.position.y)??Infinity);
 const fov=cameraControls.settings.fov-controllerFrame.zoom*18;if(Math.abs(camera.fov-fov)>.01){camera.fov=THREE.MathUtils.damp(camera.fov,fov,12,dt);camera.updateProjectionMatrix();}
}

const fmt=m=>`${String(Math.floor((m%1440)/60)).padStart(2,'0')}:${String(Math.floor(m%60)).padStart(2,'0')}`;
function setTime({updateHours=true}={}){
 if(updateHours)world.updateHours?.(minutes);
 // A way in opened or shut (Kissa Higa's doors on its clock, okinawa/quarters.js): the neighbours search their routes again.
 if(world.passagesChanged){world.passagesChanged=false;
  const door=world.quarters?.higa?.shutterSolid,region=door?{at:[door.x,door.z],radius:12}:{};
  neighbours?.replan?.(region);castAI?.replan?.(region);
 }
 const c=duskClock(minutes,{rain:weather,inside:!!current});
 const day=c.day;
 const overcast=weatherKind==='cloudy'&&!current;
 sun.intensity=c.sunIntensity*(overcast?.75:1);
 sun.color.set(c.sun);
 ambient.color.set(c.skyFill);
 ambient.groundColor.set(c.groundFill);
 scene.environmentIntensity=(.12+day*.22)*(current?.4:weather?.65:overcast?.85:1);
 const cell=graphics.shadowRadius*2/Math.max(1,graphics.shadowSize),sx=Math.round(player.position.x/cell)*cell,sz=Math.round(player.position.z/cell)*cell;
 // The sun stands where the clock puts it (dusk.js sunPath): east and low in the morning, high over the south at
 // noon, low over the western sea through the evening, the moon's place at night. Its reach is fixed, so the shadow
 // camera's depth range holds at every hour. The cool bounce keeps to the quarter opposite it, so the shadow side
 // stays coloured whichever way the light comes from.
 {const d=c.sunDirection;sun.position.set(sx+d.x*SUN_REACH,d.y*SUN_REACH,sz+d.z*SUN_REACH);sun.target.position.set(sx,0,sz);sun.target.updateMatrixWorld();
  bounce.position.set(-d.x*30,16,-d.z*30);}
 townSky.update(camera,day,weather,!!current,c.sky,overcast);
 setOceanLight({day,dusk:c.dusk});
 const air=atmosphere(day,weather,!!current,minutes);
 scene.background.set(air.sky);if(overcast)scene.background.lerp(OVERCAST_SKY,.5);scene.fog=air.fog;
 ambient.intensity=air.ambient*CEL_FILL;
 bounce.intensity=c.bounce;
 renderer.toneMappingExposure=air.exposure;
 pipeline?.setExposure(air.exposure*CEL_EXPOSURE);
 // Night is moonlight: the grade's light and shadow tints go blue as the day goes, so the
 // street reads as night and the lit windows and lamps stand out warm against it.
 // The morning is the other way about: gold in the light, a cool blue in the shade, which is what makes seven o'clock
 // look like seven o'clock and not six in the evening (the dusk is apricot through and through).
 {const night=Math.max(0,1-day-c.dusk*.6)*(current?0:1),morning=c.morning*(current?0:1),mix=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t).getHex();
  pipeline?.tune({uLightTint:mix(mix(NIGHT_TINT.light,0xfff1d6,morning*.6),0xb4c2f4,night*.6),uShadowTint:mix(mix(NIGHT_TINT.shadow,0xc8d4f4,morning*.55),0x6470b4,night*.85)});
  // and the shadow lift that keeps the day's shade from going black is mostly taken off at night: lifted, a night street
  // sat behind a milky grey veil (the lamps and windows could not stand out against it). Dusk and dawn keep their lift.
  nightLift=night;}
 // Underground the sun and the sky do not reach: the lantern, the torches and a little
 // cold fill are all the light there is, and the dark closes in a few tiles off.
 // A room whose own lights are dead (Umi-no-yu with its main breaker down) lets in only its
 // share of the town's indoor fill: the daylight through its windows, not the lamps' bounce.
 {const k=current?activeRoomLayout?.townFill?.():1,share=Number.isFinite(k)?Math.min(1,Math.max(0,k)):1;
  if(share<1){sun.intensity*=share;bounce.intensity*=share;ambient.intensity*=share;scene.environmentIntensity*=share;}
  uplight.intensity=UPLIGHT*share;}
 // and the grade's shadow lift, which keeps the town's shade from ever going black, is
 // taken nearly off down there, or the whole cave sits behind a grey veil.
 pipeline?.tune({uLift:(INK_OPTIONS.gradeOptions.lift??GRADE_DEFAULTS.lift)*(1-.7*nightLift)});
 // Warmth only. Ink, shadow tint and flatten stay on their cel defaults.
 pipeline?.tune({uWarmth:c.gradeWarmth});
 // Road paint takes no light of its own: dimmed with the town's fill, or it glows white on a night street.
 setRoadPaintLight(c.decal);
 $('.timecard small').textContent=c.period;
 return day;
}
$('#exitRoomButton').onclick=()=>{if(current?.id==='sakura-office'){takeSakuraStair('down');return;}crossThreshold(async()=>leaveNearbyDoor());};
$('#enterBuildingButton').onclick=()=>{const s=doorSite;if(s&&!current&&!roomLoading)void crossThreshold(()=>enterRoom(s));};
function syncView(){
 document.body.classList.remove('diorama');camera.fov=cameraControls.settings.fov;camera.updateProjectionMatrix();
 room.traverse(o=>{if(o.userData.cutaway)o.layers.set(0);});
 player.visible=false;window.__JOHANSSON_CAMERA_MODE__='first';
}
 const placeDirections=s=>s.directions||((s.id==='izakaya'?'Take the eastern lane from the main street and follow the dining-lane sign.':'Follow the main street to '+s.title+'.'));
function mapPlayer(){return current?doors.get(current.id)||player.position:player.position;}
function directoryCards(){world.group.updateMatrixWorld(true);return residentCards({sites:SITES,landmarks:world.landmarks,people:world.people,neighbours:world.neighbours,minutes});}
function targetPoint(s){
 const p=s?.approachPosition||s?.exitPosition||s?.door;
 if(Array.isArray(p))return {x:p[0],y:p.length>2?p[1]:groundHeight(p[0],p[1]),z:p.length>2?p[2]:p[1]};
 return Number.isFinite(s?.x)&&Number.isFinite(s?.z)?{x:s.x,y:s.y??groundHeight(s.x,s.z),z:s.z}:null;
}
function clearNavigation(){navigationGeneration++;navigationTarget=null;navigationPlan=null;navigationLeg=null;navigationPath=[];navigationIndex=1;}
function walkingSample(start){
 const inRoad=p=>p.x>MAIN_ROAD.west&&p.x<MAIN_ROAD.east&&p.z>MAIN_ROAD.minZ&&p.z<MAIN_ROAD.maxZ;
 return (x,z)=>{
  const y=groundHeight(x,z),crossing=Math.min(Math.abs(z+18),Math.abs(z-SHOP_CROSSING_Z))<1.25;
  // Directions use the marked crossings. A player already in the carriageway may
  // finish crossing before joining the pavement route.
  const road=inRoad({x,z})&&!crossing&&!(inRoad(start)&&Math.hypot(x-start.x,z-start.z)<5.5);
  const blocked=road||townBoundsBlocked(x,z,PLAYER_RADIUS)||colliderGrid.some(x,z,PLAYER_RADIUS,c=>
   !c.moving&&(!c.only||c.only==='player')&&standingHitsRect(x,z,PLAYER_RADIUS,y,c));
  return {blocked,y};
 };
}
function walkingSegmentClear(a,b,maxLength=Infinity){
 const distance=Math.hypot(b.x-a.x,b.z-a.z),length=Math.min(distance,maxLength),steps=Math.max(1,Math.ceil(length/.14)),sample=walkingSample(a);
 let previous=sample(a.x,a.z),previousZ=a.z;if(previous.blocked)return false;
 for(let i=1;i<=steps;i++){const t=distance?length/distance*i/steps:1,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,next=sample(x,z),component=sample(x,previousZ);if(next.blocked||component.blocked||Math.abs(component.y-previous.y)>.24||Math.abs(next.y-component.y)>.24)return false;previous=next;previousZ=z;}return true;
}
function startWalkingDirections(){
 const generation=++navigationGeneration,stand=!current&&seated?parkSeat?.stand:null,
  start=stand?{x:stand[0],z:stand[2]??stand[1]}:{x:mapPlayer().x,z:mapPlayer().z},destination=targetPoint(navigationTarget);
 navigationStarted=performance.now();navigationPath=[];navigationIndex=1;navigationLeg=null;
 if(!destination){navigationPlan={status:'unreachable',reason:'missing-entrance'};return;}
 const hereKitano=world.kitano.near(start.x,start.z),thereKitano=navigationTarget.island==='kitano'||world.kitano.near(destination.x,destination.z);
 if(!current&&(islandPlay?.active||deckUnder())){
  navigationLeg={transfer:true,waitingForLanding:true,from:hereKitano?'kitano':'minato',title:'Ferry',
   instructions:navigationTarget.aboard?'You’re aboard the Minato Maru. This home is aboard the ferry.':'Continue by ferry. Walking directions resume when you are ashore.'};
  navigationPlan={status:'transfer',reason:'ferry-in-progress'};return;
 }
 if(hereKitano===thereKitano)ensureKitanoAt(destination.x,destination.z);
 let goal=destination;
 if(navigationTarget.aboard||hereKitano!==thereKitano){
  const stop=hereKitano?{id:'kitano-ferry-landing',title:'Kitano ferry landing',door:[AIRPORT_LANDING[0],AIRPORT_LANDING_HEIGHT,AIRPORT_LANDING[1]]}:[...SITES,...(world.landmarks||[])].find(s=>s.id==='ferry-terminal');
  const entrance=targetPoint(stop);
  if(entrance){goal=entrance;navigationLeg={transfer:true,from:hereKitano?'kitano':'minato',title:hereKitano?'Kitano ferry landing':'Port Terminal',goal,
   instructions:navigationTarget.aboard?'Check the Minato Maru’s berth at the terminal. The home is aboard the ferry.':'Take the ferry to '+(thereKitano?'Kitano-jima':'Minato')+'. Directions continue after you arrive.'};}
 }
 navigationPlan=createWalkingRoute({start,goal,sample:walkingSample(start),cell:.5,maxVisited:40000,margin:18});
 const advance=()=>{
  if(generation!==navigationGeneration||!navigationTarget)return;
  // Sampling is incremental: finding a route does not freeze the controls on phones.
  navigationPlan.step(mobile?300:600);
  if(navigationPlan.status==='searching'){requestAnimationFrame(advance);return;}
  if(navigationPlan.status==='found'){navigationPath=navigationPlan.path.map(p=>({...p}));navigationIndex=Math.min(1,navigationPath.length-1);}
  updateWaypoint();if(!$('#directory').classList.contains('hidden'))drawMap();
 };
 requestAnimationFrame(advance);
}
function markPlace(s){
 if(!s)return false;
 const alias=HARBOUR_PARK_ALIASES[s.id];if(alias)s=[...SITES,...(world.landmarks||[])].find(p=>p.id===alias)||s;
 const point=targetPoint(s);navigationTarget={...s,...point};toggleDir(false);startWalkingDirections();drawMap();
 say(placeDirections(s)+(current?' Use Exit to street to start walking.':''),7);return false;
}
function visitPlace(s){
 if(islandPlay?.active)return false;
 if(s?.id==='airport-island')return markPlace({...s,directions:'Take the Minato Maru from the outer pier: board her at the gangway, or cross quickly from the landing sign beside it.'});
 if(!s)return false;
 // The gate lives at the action itself, so stale buttons and WebMCP share it.
 if(!travelProgress(activities.state).unlocked)return markPlace(s);
 if(current)leaveRoom();placeAtEntrance(s);resetInput();toggleDir(false);clearNavigation();drawMap();say(s.title+' · You took a familiar shortcut.',5);return true;
}
function toggleDir(open){if(inspector?.active)return;if(open){townBook?.home();updateDirectory();document.exitPointerLock?.();resetInput();}$('#directory').classList.toggle('hidden',!open);document.body.classList.toggle('town-menu-open',!!open);$('#directoryButton').setAttribute('aria-expanded',String(open));if(open)$('#closeDirectory').focus();else $('#directoryButton').focus();}
$('#directoryButton').onclick=()=>toggleDir(true);$('#closeDirectory').onclick=()=>toggleDir(false);
$('#ferryOperationsButton').onclick=()=>{toggleDir(false);document.exitPointerLock?.();resetInput();ferryOperations?.open();};
function updateDirectory(){
 {const m=pocketModel(),tile=$('#pocketButton');if(tile){tile.textContent=m.name;tile.setAttribute('aria-label',`Raise the ${m.name} camera (F)`);}}
 directoryResidents=directoryCards();
 const seen=new Set();
 const places=[...SITES,...(world.landmarks||[])].filter(s=>{
  if(s.toLet||s.isResidence||s.home||s.homeEntry||s.familyHome||/^(home-|resident-home-)/.test(s.id)||s.id==='mayor-home')return false;
  const id=HARBOUR_PARK_ALIASES[s.id]||s.id;if(id!==s.id||seen.has(id))return false;seen.add(id);return !!targetPoint(s);
 });
 directoryView?.destroy();
 directoryView=renderTownDirectory($('#directoryGrid'),{cards:directoryResidents,places,progress:travelProgress(activities.state),
  onShowHome:target=>markPlace(target),
  onFindPerson:(target,card)=>{const live=directoryCards().find(c=>c.name===card.name)||card,position=live.personTarget||target;return markPlace({...position,trackPerson:card.name,directions:(live.current.source==='schedule'?'Scheduled location: ':'Current location: ')+live.current.locationLabel+'. '+(position.directions||'Follow the walking route.')});},
  onPlace:markPlace,onShortcut:visitPlace,
  canRecord:activities.canResidentRecord,onRecord:name=>{toggleDir(false);activities.residentRecord(name);},
  canPlayAs:name=>!!linuxLife?.roster.some(p=>p.name===name),playing:name=>linuxLife?.active===name,
  onPlayAs:name=>{if(!linuxLife||linuxLife.busy)return;toggleDir(false);linuxLife.select(name,{started}).then(()=>say('Playing as '+name+'.',4)).catch(error=>say(error.message,5));},
  onStudio:()=>activities.saveBeforeLeaving(()=>{location.href=new URL('../avatar-creator/',location.href).href;}),
  onTravelProgress:()=>{toggleDir(false);activities.action('travel-progress');}});
 const extras=document.createElement('details');extras.className='town-records';const title=document.createElement('summary');title.textContent='Reading and radio';extras.append(title);
 for(const item of content.items){const button=document.createElement('button');button.textContent=item.title+' · '+item.place;button.onclick=()=>{const site=SITES.find(s=>s.id===item.siteId);if(site)markPlace(site);};extras.append(button);}
 const radio=document.createElement('p');radio.textContent='82.1 Harbour Service · '+RADIO_821+' · 89.4 JOJO · 95.7 Sports';extras.append(radio);$('#directoryGrid').append(extras);
 drawMap();
}
/**
 * Where the game starts (world/openings.js): a dock sight picked for the hour. The audit
 * harness keeps the safe harbour standing point unless it names an opening with ?spawn=.
 */
function beginAtOpening(){
 if(activities.state.combatRecovery){delete activities.state.combatRecovery;standUpAt(19.8,-40,-1.03);return {caption:"Welcome back. You are safely ashore by the fish auction."};}
 const params=new URLSearchParams(location.search),force=params.get('spawn')||(graphics.quietOpening?harbourOpening.id:null);
 if(params.has('audit')&&!force)return null;
 if(activities.state.island?.journey.location!=='town'&&activities.state.island){islandPlay.recover();return null;}
 const opening=chooseOpening({minutes,rain:weather,force,context:{ferryAlongside:world.ferry?.berth==='town'&&world.ferry?.phase==='waiting'}});
 if(opening.room){const door=doors.get(opening.room);if(door){standUpAt(door.x,door.z,Math.PI);}preloadIzakaya(['interior']);return opening;}
 if(opening.stand){const [x,z]=opening.stand==='bus-platform'?transitStop().platform:opening.stand;standUpAt(x,z,opening.facing);return opening;}
 if(opening.seat&&sitOnSeat(opening.seat))return opening;
 return null;
}
/** A seat aboard the ferry moves with her: his place on it, where he will stand up, its height and the way it faces are
 * put back from her frame each time she moves under him (advanceTown's carry; ferry.js FERRY_PASSENGER_SEATS). */
function pinAboardSeat(){
 const a=parkSeat?.aboard,f=world.ferry?.ferry;if(!a||!f)return;f.updateMatrixWorld(true);
 parkSeat.position=f.localToWorld(new THREE.Vector3(...a.position)).toArray();parkSeat.stand=f.localToWorld(new THREE.Vector3(...a.stand)).toArray();
 parkSeat.surfaceY=parkSeat.position[1]+a.surface;parkSeat.yaw=f.rotation.y+a.yaw;player.position.set(...parkSeat.position);
}
function standUpAt(x0,z0,facing=yaw){
 seated=false;parkSeat=null;ensureKitanoAt(x0,z0);
 const [x,z]=findClear(x0,z0);player.position.set(x,groundHeight(x,z),z);yaw=facing;pitch=-.05;player.quaternion.setFromAxisAngle(yAxis,yaw);playerSpeed=0;playerRunning=false;world.spawn=player.position.toArray();
}
/** Sit on a seat by its label, through the same path as tapping it: the first one of them that is free. */
function sitOnSeat(label){
 for(const o of interactables.filter(o=>o.userData.hit?.label===label&&o.userData.seat)){
  const stand=o.userData.seat.stand;if(stand)standUpAt(stand[0],stand[2]??stand[1]);
  active={...o.userData.hit,object:o};o.userData.hit.fn();active=null;activities.close();
  if(seated)return true;
 }
 return false;
}
async function openInside(opening){
 const site=SITES.find(s=>s.id===opening.room);if(!site)return;
 // Minato and Sato Ramen share one interior model, which can miss its load window while
 // the town itself is still being built; give it a few tries, else leave you at the door.
 for(let tries=0;tries<4&&!izakayaReady('interior');tries++){await preloadIzakaya(['interior']);if(!izakayaReady('interior'))await new Promise(r=>setTimeout(r,1500));}
 if(!izakayaReady('interior')){say(site.title+' is just here. Step inside.',5);return;}
 await enterRoom(site);
 if(current?.id!==opening.room)return;
 if(opening.seat&&sitOnSeat(opening.seat)){
  if(opening.drink)beerService?.serveNow(opening.drink,parkSeat?.izakaya);
  if(opening.meal)ramenPlayerService?.serveNow(opening.meal);
 }
 say(opening.caption,6);
 startArrivalScene(opening);
}
// The six remaining street activities are required after retiring the bicycle ride.
function runStabilityChecks(){const failures=[];if(!townBoundsBlocked(400,0,PLAYER_RADIUS))failures.push('town edge');if(!roomBoundsBlocked(5.5,0,PLAYER_RADIUS))failures.push('room edge');if(world.colliders.length<20)failures.push('world collider coverage');if((world.quality?.streetInteractions||0)<6)failures.push('street interaction coverage');for(const [id,p] of doors){const site=SITES.find(s=>s.id===id)||(world.landmarks||[]).find(s=>s.id===id);const facing=site?.exitPosition||id==='warehouse'||homeOwner(site)?site?.entryFacing:null,exitStep=site?.exitPosition ? .6 : .7;const ex=Number.isFinite(facing)?p.x+Math.sin(facing)*exitStep:p.x,ez=Number.isFinite(facing)?p.z+Math.cos(facing)*exitStep:p.z+(id==='izakaya'?-.7:.7);if(environmentBlocked(p.x,p.z,PLAYER_RADIUS)||(environmentBlocked(ex,ez,PLAYER_RADIUS)))failures.push(`door spawn ${id}`);}window.__JOHANSSON_STABILITY__={ok:failures.length===0,failures,colliders:world.colliders.length,characterCount:world.people.length+1,streetInteractions:world.quality?.streetInteractions||0,renderDpr:renderer.getPixelRatio(),toneMapping:pipeline?'Ink grade':'Town single-pass',shadows};if(failures.length)console.error('Johansson Town stability checks failed',failures);else console.info('Johansson Town stability checks passed',window.__JOHANSSON_STABILITY__)}

spawnScene=createSpawnScene({scene,camera,getActor:ensureJohansson,blocked:arrivalLensBlocked,ground:(x,z)=>current?0:groundHeight(x,z),onActive:active=>{hands.firstPersonVisible=!active&&!thirdPerson;}});
/** What the docks opening waits for: the details near him still streaming in, once the stream has started. */
function openingLoads(){return detailsStarted&&detailStream.pendingNear(player.position);}
function startArrivalScene(opening){
 if(!graphics.cinematic)return;
 const params=new URLSearchParams(location.search);
 if(params.has('visual-audit')||params.has('audit')&&!params.has('spawn')||params.get('cinematic')==='off')return;
 spawnScene.start({id:opening?.id||harbourOpening.id,inside:!!current,yaw:parkSeat?.yaw??yaw,establish:!!opening?.docks,hold:openingLoads});
}
// Queue shared shaders once. This renderer's async poll can outlive materials replaced
// by the detail stream; compile queues GPU work without retaining disposed materials.
loadingProgress?.start('shaders');await paintLoading();
lightBudget.update();if(graphics.precompile)compileTown(scene);
loadingProgress?.complete('shaders');
function enterWorld(){
 if(started)return;
 startupRecovery.entering();launchReport.stage('Entering town');
 window.__JOHANSSON_TITLE_PREVIEW__=false;
 townSky.mesh.rotation.y=0;
 startWeather();
let opening=beginAtOpening();
if(window.johanssonDesktop){const cp=recoverSakuraBenchCheckpoint(activities.state.desktopCheckpoint);if(cp!==activities.state.desktopCheckpoint)activities.state.desktopCheckpoint=cp;if(cp&&!cp.ship&&[cp.x,cp.z,cp.yaw].every(Number.isFinite)&&Math.abs(cp.x)<1000&&Math.abs(cp.z)<1000&&!environmentBlocked(cp.x,cp.z,PLAYER_RADIUS)){
 seated=false;parkSeat=null;player.position.set(cp.x,groundHeight(cp.x,cp.z),cp.z);yaw=cp.yaw;pitch=Number.isFinite(cp.pitch)?Math.max(-1.25,Math.min(1.15,cp.pitch)):0;opening={caption:'Welcome back. Your island progress is restored.'};
}}
started=true;controlsTouchedAt=performance.now();if(mobile){touchSticks.hint(true);stickHintUntil=performance.now()+4500;}if(!window.__JOHANSSON_BOOTING__)$('#start').classList.add('hidden');$('#hud').classList.remove('hidden');window.__JOHANSSON_RUNNING__=true;camera.position.copy(player.position);camera.position.y+=seated?(parkSeat?.eyeY??1.16):1.7;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);say(opening?.caption||'Welcome to Minato.',5);runStabilityChecks();
if(playingResident()){linuxLife.start().then(placed=>{if(!placed){if(opening?.room)openInside(opening);else startArrivalScene(opening);}}).catch(error=>say(error.message,6));}else if(opening?.room)openInside(opening);else startArrivalScene(opening);
}

function desktopCheckpoint(){
 linuxLife?.checkpoint();
 if(!started||!window.johanssonDesktop)return;
 const at=current?doors.get(current.id):player.position;if(!at)return;
 activities.state.desktopCheckpoint={x:at.x,z:at.z,y:current?groundHeight(at.x,at.z):player.position.y,yaw,pitch,ship:!!deckUnder()};
 activities.save();
}
addEventListener('johansson-desktop-save',desktopCheckpoint);
addEventListener('johansson-desktop-pause',resetInput);
addEventListener('johansson-desktop-resume',()=>{gamepadInput.suspend();clock.getDelta();resetInput();});
if(window.johanssonDesktop)setInterval(desktopCheckpoint,30000);
{
 const allEntities=()=>[...world.people.map(p=>p.g),...(world.neighbours||[]),...(characters?.actors||[]).map(a=>a.entity)].filter(Boolean);
 const canonicalEntity=name=>allEntities().find(g=>g!==player&&canonicalResidentName(g.userData.name)===name);
 const homeSite=person=>{
  const canonical=[...SITES,...(world.landmarks||[])].find(s=>s.id===person.home.siteId),card=residentCards({sites:SITES,landmarks:world.landmarks,people:world.people,neighbours:world.neighbours,minutes}).find(p=>p.name===person.name),point=card?.home?.target?.door||canonical?.exitPosition||canonical?.door||SITES.find(s=>s.id==='ferry-terminal')?.door||[0,0,-40];
  const door=point.length===3?[...point]:[point[0],groundHeight(point[0],point[1]),point[1]];
  const id='linux-residence-'+encodeURIComponent(person.name);
  const site={id,title:person.name+'’s home',jp:'HOME',sub:person.home.address,line:person.home.address,owner:person.name,linuxResidence:true,door,exitPosition:door,entryFacing:canonical?.entryFacing??0};
  doors.set(id,new THREE.Vector3(...door));return site;
 };
 linuxLife=createLinuxLife({state:activities.state,names:allEntities().map(g=>g.userData.name).filter(Boolean),getMinutes:()=>minutes,
  getPose:()=>({x:(current?doors.get(current.id):player.position)?.x??0,z:(current?doors.get(current.id):player.position)?.z??0,yaw,atHome:!!current?.linuxResidence}),
  getEntityPose:name=>{const g=canonicalEntity(name);if(!g||g.userData.hit?.inside||g.userData.indoors||g.userData.inVehicle)return null;const p=g.getWorldPosition(new THREE.Vector3());return {x:p.x,z:p.z,yaw:g.rotation.y};},
  applyIdentity:name=>{
   for(const [g,was] of linuxBorrowed){g.userData.playerControlled=was.controlled;g.visible=was.visible;}linuxBorrowed.clear();
   const actor=ensureJohansson();actor.setRecipe(name==='Johansson'?playerRecipe():recipeFor(name));actor.express('neutral',0);actor.root.name=name+' (controlled)';
   for(const g of allEntities())if(g!==player&&canonicalResidentName(g.userData.name)===name){linuxBorrowed.set(g,{visible:g.visible,controlled:g.userData.playerControlled});g.userData.playerControlled=true;g.visible=false;}
  },
  spawnHome:async(person,sleep)=>{if(current)leaveRoom();activities.close();toggleDir(false);spawnScene?.cancel();const site=homeSite(person);await enterRoom(site);if(current?.id!==site.id)throw Error('The home could not open.');const layout=activeRoomLayout;player.position.set(...layout.bedside);yaw=0;pitch=-.1;setThirdPerson(true,false);const bedPosition=[...layout.bed];bedPosition[2]=-2.23+ensureJohansson().avatar.measure.headCentre;return {position:bedPosition,stand:[...layout.bedside],axis:layout.bedAxis};},
  spawnOutside:point=>{if(point.homeBedside){player.position.set(...point.homeBedside);yaw=point.yaw||0;pitch=-.1;player.quaternion.setFromAxisAngle(yAxis,yaw);return;}if(current)leaveRoom();activities.close();toggleDir(false);standUpAt(point.x,point.z,point.yaw);},
  menu:activities.menu,close:activities.close,save:activities.save,say,
 });
 linuxOwnHomeSite=homeSite;
 window.johanssonLinuxWorld=linuxLife;
}

window.__JOHANSSON_ENTER_WORLD__=enterWorld;
if(!window.__JOHANSSON_TITLE_PREVIEW__)enterWorld();
else {
 startWeather();
}
// After two interrupted launches in a row this one runs reduced (render/startup-recovery.js). Say so, and give
// the full look back with one press: the player's own request wins for the next launch.
if(startupRecovery.recovering){
 const restore=document.createElement('button');restore.id='fullGraphics';restore.textContent='Reduced graphics after a restart · Restore full graphics';
 restore.style.cssText='position:fixed;top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:10000;padding:12px 16px;background:#fff2d3;color:#294b60;border:2px solid #294b60;border-radius:14px;font:700 15px sans-serif';
 restore.onclick=()=>activities.saveBeforeLeaving(()=>{const url=new URL(location.href);url.searchParams.set('graphics','full');location.href=url.href;});
 document.body.append(restore);
}
addEventListener('johansson-title-weather',()=>{if(!started)startWeather();});
// Inspection owns canvas gestures while active. It never feeds the walking thumb or click-to-walk.
const ferryInspectPointers=new Map();
const inspectingFerry=()=>ferryExplorer?.active&&ferryExplorer.mode==='inspect';
canvas.addEventListener('pointerdown',e=>{
 if(!inspectingFerry()||!controlsAllowed())return;
 e.stopImmediatePropagation();e.preventDefault();canvas.setPointerCapture?.(e.pointerId);
 ferryInspectPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
},{capture:true});
canvas.addEventListener('pointermove',e=>{
 if(!ferryInspectPointers.has(e.pointerId))return;
 if(!inspectingFerry()||!controlsAllowed()){ferryInspectPointers.clear();return;}
 e.stopImmediatePropagation();e.preventDefault();
 const old=ferryInspectPointers.get(e.pointerId),before=[...ferryInspectPointers.values()];
 const gap=before.length===2?Math.hypot(before[0].x-before[1].x,before[0].y-before[1].y):0;
 ferryInspectPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(ferryInspectPointers.size===1){const turn=swipeLook(e.clientX-old.x,e.clientY-old.y,innerWidth,cameraControls.settings);ferryExplorer.orbit(-turn.yaw,-turn.pitch);}
 else if(gap){const [a,b]=[...ferryInspectPointers.values()],next=Math.hypot(a.x-b.x,a.y-b.y);if(next>8)ferryExplorer.zoom(THREE.MathUtils.clamp(gap/next,.85,1.18));}
},{capture:true});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{
 if(ferryInspectPointers.delete(e.pointerId)){e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();}
},{capture:true});
canvas.addEventListener('wheel',e=>{if(inspectingFerry()&&controlsAllowed()){e.preventDefault();e.stopImmediatePropagation();ferryExplorer.zoom(Math.exp(THREE.MathUtils.clamp(e.deltaY,-80,80)*.0015));}},{capture:true,passive:false});
addEventListener('blur',()=>ferryInspectPointers.clear());
let mouseLooking=false,mouseLast=null;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'&&e.button===2&&controlsAllowed()&&!ferryCameraLocked()){
  e.preventDefault();spawnScene?.cancel();mouseLooking=true;mouseLast=[e.clientX,e.clientY];pointWalk.cancel();canvas.setPointerCapture?.(e.pointerId);
 }
});
canvas.addEventListener('pointermove',e=>{
 if(!mouseLooking||!controlsAllowed()||ferryCameraLocked())return;
 const c=cameraControls.settings,dx=e.clientX-mouseLast[0],dy=e.clientY-mouseLast[1];mouseLast=[e.clientX,e.clientY];
 yaw-=dx*.0023*c.sensitivity;pitch=THREE.MathUtils.clamp(pitch-dy*.0018*c.sensitivity*(c.invertY?-1:1),-1.25,1.15);
});
const releaseMouse=()=>{mouseLooking=false;mouseLast=null;};
canvas.addEventListener('pointerup',releaseMouse);canvas.addEventListener('pointercancel',releaseMouse);addEventListener('blur',releaseMouse);
canvas.addEventListener('click',event=>{
 if(event.button!==0||!controlsAllowed()||touchSticks.suppressClick()||pocket?.raised)return;
 spawnScene?.cancel();
 if(seated){standUp();}
 const rect=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();
 ray.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),camera);
 const hits=ray.intersectObjects(scene.children,true).filter(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible||o===player)return false;return h.distance<60;});
 const hit=hits[0];if(!hit)return;
 let object=hit.object;while(object&&!object.userData.hit)object=object.parent;
 if(object?.userData.inVehicle)return;
 if(ferryExploreActive()){
  if(ferryExplorer.mode!=='walk')return;
  const p=world.ferry.ferry.worldToLocal(hit.point.clone()),target=ferryExplorer.targetAt(p);
  if(!object?.userData.hit?.label?.startsWith('Talk to ')&&target&&p.y>-.65&&p.y<1.4&&ferryExplorer.inspect(target,p)){resetFerryInput();return;}
 }

 // Batched street props keep their action on a separate anchor. Resolve that anchor
 // only close to the visible surface, so hidden actions cannot be clicked through walls.
 if(!object){let best=36;for(const candidate of interactables){
  const h=candidate.userData.hit;if(!h||candidate.userData.visualReady===false||candidate.userData.inVehicle)continue;
  let visible=true;for(let o=candidate;o;o=o.parent)if(!o.visible)visible=false;
  const inside=h.inside||candidate.userData.inMarket&&current?.id==='market';
  if(!visible||!!current!==!!inside)continue;
  const q=candidate.getWorldPosition(new THREE.Vector3());
  if(q.distanceTo(hit.point)>1.5||q.distanceTo(camera.position)>hit.distance+1.5)continue;
  q.project(camera);if(q.z<-1||q.z>1)continue;
  const d=Math.hypot((q.x+1)*rect.width/2-(event.clientX-rect.left),(1-q.y)*rect.height/2-(event.clientY-rect.top));
  if(d<best){best=d;object=candidate;}
 }}
 if(object){
  const target=object.getWorldPosition(new THREE.Vector3()),space=current,fn=object.userData.hit.fn;
  const interact=()=>{if(current===space&&object.visible&&!object.userData.inVehicle&&target.distanceTo(player.position)<3.4){yaw=Math.atan2(player.position.x-target.x,player.position.z-target.z);active={...object.userData.hit,object};fn?.();}};
  if(target.distanceTo(player.position)<3.4){pointWalk.cancel();interact();return;}
  if(!pointWalk.walk(player.position,target,{space,onArrival:interact}))say('There is no clear path from here.',2);
  return;
 }
 const normal=hit.face?.normal.clone().transformDirection(hit.object.matrixWorld);
 if(!normal||normal.y<.55)return;
 if(!pointWalk.walk(player.position,hit.point,{space:current}))say('There is no clear path from here.',2);
});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||!controlsAllowed())return;spawnScene?.cancel();const c=cameraControls.settings;yaw-=e.movementX*.0023*c.sensitivity;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0018*c.sensitivity*(c.invertY?-1:1),-1.25,1.15);});
document.addEventListener('keydown',e=>{
 if(!started)return;
 if(photoLoading||photoStudio?.active||cameraControls.active||inspector?.active||itemViewer?.active||activities.paused)return;
 spawnScene?.cancel();
 // With the pocket camera up only walking and looking go through: Space or Enter takes the photo, F or Esc lowers it.
 if(pocket?.raised){
  if(['Space','Enter','NumpadEnter'].includes(e.code)){e.preventDefault();if(!e.repeat)pocket.shoot();return;}
  if(e.code==='KeyF'||e.code==='Escape'){e.preventDefault();if(!e.repeat)lowerPocket();return;}
  if(!['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyI','KeyJ','KeyK','KeyL','ShiftLeft','ShiftRight'].includes(e.code))return;
 }
 if(e.code==='Escape'){if(ferryExploreActive()&&ferryExplorer.mode!=='walk'){ferryExplorer.walk();resetFerryInput();return;}toggleDir(false);return;}
 if(e.code==='KeyC'&&!e.repeat){openCamera();return;}
 if(e.code==='KeyP'&&!e.repeat){openPhotoStudio();return;}
 if(e.code==='KeyO'&&!e.repeat){openFreeCamera();return;}
 if(!$('#directory').classList.contains('hidden')){if(e.code==='KeyQ')toggleDir(false);return;}
 if(e.code==='KeyF'&&!e.repeat&&!pocket?.raised){raisePocket();return;}
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Home'].includes(e.code))e.preventDefault();keys[e.code]=true;
 if(!started)return;
 if(e.code==='Home'&&!e.repeat)centreCamera();
 if(e.code==='KeyE'&&!e.repeat){interaction();updateContextControls();if(!contextRail.activatePrimary())doInteract();}if(e.code==='Enter'&&!e.repeat&&!e.target.closest?.('button')){if(contextRail.activatePrimary())e.preventDefault();}if(e.code==='KeyR'&&!e.repeat){const drink=$('#drink');if(!drink.hidden)drink.click();}if(e.code==='KeyQ'&&!e.repeat)toggleDir(true);if(e.code==='KeyB'&&!e.repeat)activities.bag();if(e.code==='KeyN'&&!e.repeat)$('#timeButton').click();if(e.code==='KeyV'&&!e.repeat)changeView();if(e.code==='KeyG'&&!e.repeat)movesMenu();if(e.code==='KeyH'&&!e.repeat){if(quietHud.photoMode)quietHud.photo(false);else cleanView();}
});document.addEventListener('keyup',e=>keys[e.code]=false);
function setRunning(value){touchRunning=value;$('#run').setAttribute('aria-pressed',String(value));$('#run').innerHTML=runButtonFace(value);}
// Icons on the buttons, and the bag, which only appears when there is something in it.
const hudIcons=dressHud({onBag:()=>{if(started&&!activities.paused){toggleDir(false);activities.bag();}}});$('#run').innerHTML=runButtonFace(false);
// The HUD fades when nothing is touched and hides for a clean picture (src/ui/quiet-hud.js, quiet-hud.css).
const quietHud=createQuietHud();
function cleanView(){if(!started)return;toggleDir(false);quietHud.photo(true);}
$('#cleanViewButton').onclick=cleanView;
townBook=setupTownBookHome({onClose:()=>toggleDir(false)});
$('#freeCameraButton').onclick=openFreeCamera;
function toggleRunning(){if(!started||activities.paused||inspector?.active||seated)return;setRunning(!touchRunning);}
// Touch-down works while another finger holds the movement stick; a synthetic click may be suppressed.
$('#run').onpointerdown=e=>{if(e.button!==undefined&&e.button!==0)return;e.preventDefault();e.stopPropagation();pressedControls.add('run');toggleRunning();};
$('#run').onclick=e=>{if(e.detail===0)toggleRunning();};
let contextTarget=null;
const contextRail=createContextRail({onAction:(id,event)=>{
 if(!controlsAllowed()||catchingUp||roomLoading||activities.paused||pocket?.raised)return;
 if(event.type==='pointerdown')pressedControls.add(id);
 let completion;
 if(id==='standButton')standUp();
 else if(id==='goAshoreButton')islandPlay?.goAshore();
 else if(id==='stayAboardButton')islandPlay?.stayAboard();
 else if(id==='enterBuildingButton'){const site=doorSite;if(site&&!current)completion=crossThreshold(()=>enterRoom(site));}
 else if(id==='exitRoomButton'){if(current)completion=crossThreshold(async()=>leaveNearbyDoor());}
 else if(id==='orderButton')activities.action(Number.isInteger(parkSeat?.ramenSeatId)?'store-table':'izakaya-table');
 else if(id==='eatButton'){
  if(Number.isInteger(parkSeat?.ramenSeatId)){if(performance.now()>Math.max(sipDrink.busyUntil||0,eatDish.busyUntil||0)&&ramenPlayerService?.eat())eatDish.busyUntil=performance.now()+2400;}
  else eatDish();
 }else if(id==='drink'){
  if(Number.isInteger(parkSeat?.ramenSeatId)&&ramenPlayerService?.order?.delivered){if(performance.now()>Math.max(sipDrink.busyUntil||0,eatDish.busyUntil||0)&&ramenPlayerService.eat())sipDrink.busyUntil=performance.now()+2400;}
  else drinkNow();
 }else if(id==='act'){
  if(contextTarget){active=contextTarget;contextTarget.fn?.();}
  else doInteract();
 }
 updateContextControls();
 return completion;
}});

graphicsReady=true;
function resizeRenderer(){if(concert?.active){concert.render();return;}const view=conversationViewport(innerWidth,innerHeight);renderer.setPixelRatio(renderDpr());renderer.setSize(view.width,view.height,false);canvas.style.width=view.width+'px';canvas.style.height=view.height+'px';camera.aspect=view.width/view.height;camera.updateProjectionMatrix()}
function setConversation(name,text=''){for(const g of [...world.people.map(p=>p.g),...(world.neighbours||[])])if(g.userData.playerConversation){delete g.userData.playerConversation;delete g.userData.chatHold;delete g.userData.speakingUntil;}if(name){neighbourChats.cancel();chatBubble.hide();}
 if(name&&!conversationName){conversationSide=0;shotCut=true;conversationShot='speaker';conversationCamera={rotation:camera.quaternion.clone(),playerVisible:player.visible};johansson?.play('Nod');}
 // Johansson's mouth moves on his own lines (onDialoguePhase), not on the other person's.
 conversationName=name;resizeRenderer();
 if(name){
  const speaker=name==='Thuan'?storeClerk:world.people.find(p=>p.g.userData.name===name)?.g||world.neighbours?.find(g=>g.userData.name===name);
  if(speaker){speaker.userData.playerConversation=true;speaker.userData.chatHold=true;speaker.userData.speakingUntil=performance.now()+Math.min(6500,Math.max(1400,text.length*43));
   // What the line feels like shows on the face, and the body follows (body-language.js).
   const feeling=lineFeeling(text);speaker.userData.lineFeeling=feeling?{expression:feeling,until:performance.now()+3200}:null;
   // The camera is not taken off you any more: she turns to face you instead, and the
   // line appears over her shoulder. See people/facing.js.
   conversationLine={speaker,name,text};}
  player.visible=false;
 }else{conversationLine=null;if(conversationCamera){player.visible=conversationCamera.playerVisible;conversationCamera=null;}}
}addEventListener('resize',resizeRenderer);window.visualViewport?.addEventListener('resize',resizeRenderer);function resetInput(){pointWalk.cancel();setRunning(false);Object.keys(keys).forEach(k=>keys[k]=false);touchSticks.reset();}addEventListener('blur',()=>{resetInput();gamepadInput.suspend();});document.addEventListener('visibilitychange',()=>{resetInput();gamepadInput.suspend();if(document.hidden){activities.save();hiddenAt=Date.now();}else{hiddenAt=0;followClock();clock.getDelta();}});addEventListener('pagehide',()=>activities.save());addEventListener('johansson-save',()=>activities.save());

const mapCanvas=$('#minimap'),mapCtx=mapCanvas.getContext('2d');
function drawMap(){
 updateWaypoint();
 if($('#directory').classList.contains('hidden'))return;
 const homes=canonicalHomeSites(directoryResidents.length?directoryResidents:directoryCards());
 // Map lettering is measured in screen pixels. Shrinking a fixed 720px canvas
 // to a phone made the address labels only six pixels high.
 const width=Math.max(280,Math.round(mapCanvas.getBoundingClientRect?.().width||720)),height=Math.round(width*620/720),dpr=Math.min(2,globalThis.devicePixelRatio||1);
 if(mapCanvas.width!==Math.round(width*dpr)||mapCanvas.height!==Math.round(height*dpr)){mapCanvas.width=Math.round(width*dpr);mapCanvas.height=Math.round(height*dpr);}
 mapCtx.setTransform?.(dpr,0,0,dpr,0,0);
 drawTownMap(mapCtx,width,height,{sites:SITES,landmarks:world.landmarks,homes,people:world.people,player:mapPlayer(),yaw,visited:activities.state.visited,target:navigationTarget,route:navigationPath,mode:mapMode});
 const caption=$('#mapDescription');if(caption)caption.textContent=navigationTarget?
  (navigationTarget.address||navigationTarget.title)+(navigationTarget.residents?.length?' · '+navigationTarget.residents.join(', '):'')+' · '+(navigationLeg?.instructions||(navigationPlan?.status==='unreachable'?'A walking route could not be found from here.':navigationPlan?.status==='searching'?'Finding a walking route…':'The coloured line follows the walking route.')):
  'Find a resident in the Town Book and choose Show home to mark their entrance.';
}
function updateWaypoint(){
 const button=$('#waypoint');button.classList.toggle('hidden',!navigationTarget);if(!navigationTarget)return;
 const p=mapPlayer(),now=performance.now();
 const aboard=!current&&!!(islandPlay?.active||deckUnder());
 if(aboard){
  button.textContent=navigationTarget.title+' · '+(navigationTarget.aboard?'You’re aboard the Minato Maru. This home is aboard the ferry.':'Continue by ferry · walking directions resume ashore')+' ×';
  button.setAttribute('aria-label','Clear directions to '+navigationTarget.title);return;
 }
 if(navigationLeg?.transfer&&(navigationLeg.waitingForLanding||!navigationTarget.aboard&&navigationLeg.from!==(world.kitano.near(p.x,p.z)?'kitano':'minato'))&&!walkingSample(p)(p.x,p.z).blocked)startWalkingDirections();
 if(navigationTarget.trackPerson&&now-navigationRecheck>5000){
  navigationRecheck=now;const card=directoryCards().find(c=>c.name===navigationTarget.trackPerson),next=card?.personTarget;
  if(!next){navigationGeneration++;navigationPath=[];navigationPlan={status:'unreachable',reason:'person-unavailable'};navigationTarget.trackingUnavailable=true;}
  else if(navigationTarget.trackingUnavailable||next.id!==navigationTarget.id||Math.hypot(next.x-navigationTarget.x,next.z-navigationTarget.z)>2.5){
   navigationTarget={...next,trackPerson:card.name,directions:(card.current.source==='schedule'?'Scheduled location: ':'Current location: ')+card.current.locationLabel+'.'};startWalkingDirections();
  }
 }
 let detail='Finding a walking route…';
 if(navigationPlan?.status==='unreachable')detail=navigationPlan.reason==='person-unavailable'?'Current location unavailable · check People in the Town Book':'Walking route unavailable · check the map';
 if(navigationPath.length){
  while(navigationIndex<navigationPath.length-1&&Math.hypot(navigationPath[navigationIndex].x-p.x,navigationPath[navigationIndex].z-p.z)<.45&&walkingSegmentClear(p,navigationPath[navigationIndex+1]))navigationIndex++;
  const next=navigationPath[Math.min(navigationIndex,navigationPath.length-1)],end=navigationPath.at(-1);
  const lastDistance=Math.hypot(end.x-p.x,end.z-p.z);
  let distance=Math.hypot(next.x-p.x,next.z-p.z);for(let i=navigationIndex+1;i<navigationPath.length;i++)distance+=Math.hypot(navigationPath[i].x-navigationPath[i-1].x,navigationPath[i].z-navigationPath[i-1].z);
  const angle=Math.atan2(-(next.x-p.x),-(next.z-p.z))-yaw,index=((Math.round(angle/(Math.PI/4))%8)+8)%8,arrow=['↑','↖','←','↙','↓','↘','→','↗'][index];
  const arrived=navigationIndex===navigationPath.length-1&&distance<1.1&&walkingSegmentClear(p,end);
  detail=arrived?(navigationLeg?.instructions|| (navigationPlan.reason==='goal-approach'?'Entrance nearby':'You’re here')):arrow+' '+Math.round(distance)+' m on foot';
  // If the player leaves the marked path, calculate a fresh route from where they
  // actually stand. A straight arrow to the original door would point through walls.
  if(!current&&!seated&&now-navigationStarted>2500&&!arrived&&now-navigationCorridorCheck>700){
   navigationCorridorCheck=now;
   let nearest=navigationPath.length===1?lastDistance:Infinity;
   for(let i=Math.max(1,navigationIndex-1);i<navigationPath.length;i++){
    const a=navigationPath[i-1],b=navigationPath[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));
    nearest=Math.min(nearest,Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t));
   }
   if(nearest>1.2||!walkingSegmentClear(p,next,6))startWalkingDirections();
  }
 }
 button.textContent=(current?'Exit to street · ':seated?'Stand to follow the route · ':'')+(navigationLeg?.title?navigationLeg.title+' → ':'')+navigationTarget.title+' · '+detail+' ×';button.setAttribute('aria-label','Clear directions to '+navigationTarget.title);
}
$('#waypoint').onclick=()=>{clearNavigation();drawMap();};
$('#mapScope').onclick=()=>{mapMode=mapMode==='local'?'world':'local';$('#mapScope').textContent=mapMode==='local'?'Show whole world':'Show local map';$('#mapScope').setAttribute('aria-pressed',String(mapMode==='world'));drawMap();};
let elapsed=0,mapTick=0,stepTick=0,accumulator=0,saveTick=0;
// The clock runs at real time: a minute a minute. While the town is catching up on time
// you were away it runs at the old fast-forward rate, a town minute a simulated second.
// It can also be set: a start time chosen on the board before you enter, or from the TIME
// menu, running at one, ten or sixty times real speed (see town-clock.js).
const townClock=createClock(readClockSetting(globalThis.localStorage),minutes);
function advanceTown(dt,playerPaused,fastForward=false){
    // Aboard, her pose moves under him in this step (the crossing in islandPlay.tick, the swell in world.update): his
    // place in her frame is taken before each and put back after it, and his heading turns with her, so he stands
    // where he stood on her deck, not where she was.
    // Twice a step, round the two moves and never round his own walk (which would undo it): see hold() and carry().
    const hold=()=>!current&&!catchingUp&&deckUnder()?{at:world.ferry.ferry.worldToLocal(player.position.clone()),yaw:world.ferry.ferry.rotation.y}:null;
    const carry=held=>{if(!held)return;const f=world.ferry.ferry;f.updateMatrixWorld(true);player.position.copy(f.localToWorld(held.at));const turn=f.rotation.y-held.yaw;if(turn){yaw+=turn;player.rotation.y+=turn;}if(seated&&parkSeat?.aboard)pinAboardSeat();};
    const crossing=hold();
    minutes+=fastForward?dt:dt*townClock.speed/60;elapsed+=dt;if(!fastForward)islandPlay?.tick(dt);carry(crossing);activities.tick(dt);
    if(!catchingUp&&(saveTick+=dt)>=15){activities.save();saveTick=0;}if(!playerPaused&&!islandPlay?.cinematic){shipWalk()?.update();characters?.physics?.(dt,playerGround());if(islandPlay?.walking)stepFerryWalk(dt);else if(stairPassage)stepStairPassage(dt);else{updatePlayer(dt);checkSakuraStair();}}
    evictIfClosed();
    if(sharedDining(current))izakayaGuests.sync(minutes,dt);
    if(current?.id==='onsen')onsenGuests.sync(minutes,dt);
    if(current&&!catchingUp)activeRoomLayout?.tick?.(dt,minutes,elapsed);
    if(current)activeRoomLayout?.follow?.(player.position);
    if(homeOwner(current))homeGuests.update(dt,minutes);
    // The ramen counter: an order is cooked for five seconds, then set down in front of you.
    venueService?.update(dt);beerService?.update(dt);ramenPlayerService?.update(dt);
    workplaceResidents.update(dt,minutes,weather);bookshopCustomers.update(dt,minutes);
    castAI?.update(dt,minutes,weather);sakuraShop.update(dt);ramenGuests.sync(minutes,dt);ramenMeals.update(dt);satoKitchen?.update(dt);if(BUDGET.neighbourChats&&!catchingUp&&!playerPaused)neighbourChats.update(dt,minutes,weather);else neighbourChats.cancel();
    if(current&&!catchingUp)world.updateLife(dt,elapsed,daylight(minutes),minutes);
    if(!catchingUp){ferryCrew?.update(dt,minutes);neighbours?.update(dt,minutes,current?null:player.position);}
    if(!current&&!catchingUp){const swell=hold();world.update(dt,elapsed,daylight(minutes),minutes);carry(swell);if(!activities.state.quickTravelNotified&&travelProgress(activities.state).unlocked)activities.save();world.beats?.update(dt,elapsed,minutes);}
}
/** Keeps the town on the device clock; a gap of more than a minute is caught up, not jumped. */
function followClock(){
 if(concert?.active||concertLoading||photoStudio?.active||!followRealClock||catchingUp)return;
 const real=townClock.target(),gap=real-minutes;
 // A slow device drops frames and the simulation falls a little behind: close that
 // quietly. A real gap -- the tab was asleep -- is fast-forwarded so people move on.
 if(gap>5)advanceAbsentTown(gap);
 else if(gap>.05||gap<-.05)minutes=real;
}
function simulate(frameDt,playerPaused=false){advanceWeather();updatePost(frameDt);attention.update();
 followClock();
 accumulator+=Math.min(frameDt,MAX_FRAME_DT);
 while(accumulator>=SIM_STEP){advanceTown(SIM_STEP,playerPaused);accumulator-=SIM_STEP;}
}
const absence=createTownCatchup({advance:(dt,pending)=>{
 activities.state.pendingTownMinutes=pending;advanceTown(dt,true,true);
}});
/** Fast-forwards the town through town minutes it missed, up to a day; beyond that it jumps. */
/** The TIME menu: real time, or a set clock at a chosen hour and speed. */
function clockMenu(){
 const setting=readClockSetting(localStorage),today=Math.floor(minutes/1440)*1440;
 const apply=(start,speed)=>{const s=writeClockSetting(localStorage,{start,speed});
  if(s.start==='real'){townClock.real();townClock.ahead=0;activities.state.clockAhead=0;minutes=realTownMinutes();}
  else{if(start!=='saved'){const [h,m]=start.split(':').map(Number);let t=today+h*60+m;if(t<minutes-1)t+=1440;minutes=t;}townClock.set(minutes,s.speed);}
  evictIfClosed();activities.close();say(clockDescription(),4);};
 const speedLabel=townClock.mode==='real'?'real time':townClock.speed===1?'set time, normal speed':'set time, '+townClock.speed+'× speed';
 const ahead=townClock.mode==='real'&&townClock.ahead>=1?' Time spent in town has put it '+formatAhead(townClock.ahead)+' ahead of your own clock.':'';
 activities.menu('Town clock','It is '+townClockLineAt(minutes)+' in town, running on '+speedLabel+'.'+ahead+'\n\nReal time follows your own clock and date. A set clock can start when you like and run a little faster: at 4× an hour in town takes fifteen minutes.',[
  [townClock.mode==='real'&&townClock.ahead>=1?'Back in step with my clock':'Real time',()=>apply('real',1)],
  ...[1,2,4].filter(v=>!(townClock.mode==='set'&&townClock.speed===v)).map(v=>[v===1?'Keep this time, normal speed':'Speed up · '+v+'×',()=>apply('saved',v)]),
  ...['06:00','12:00','18:00','22:00'].map(t=>['Set to '+t,()=>apply(t,townClock.mode==='set'?townClock.speed:1)]),
  ['Close',()=>activities.close()]]);
}
const formatAhead=m=>m<60?Math.round(m)+' min':Math.floor(m/60)+' h '+Math.round(m%60)+' min';
const clockDescription=()=>(townClock.mode==='real'?'Real time':'Town clock '+townClock.speed+'×')+' · '+townClockLineAt(minutes);
/**
 * The futon at home: sleep through to half past six. The night passes the way an absence
 * does (the residents go home, sleep and get up), and in real time the town then runs
 * that far ahead of your own clock until you bring it back from the clock menu.
 */
function sleepUntilMorning(){
 const day=Math.floor(minutes/1440)*1440;let wake=day+390;if(wake<=minutes+20)wake+=1440;
 const gap=wake-minutes;
 if(townClock.mode==='real'){townClock.pass(gap);activities.state.clockAhead=townClock.ahead;}
 activities.close();advanceAbsentTown(gap);say('You sleep. Half past six, and the generator\'s thud from across the field.',5);
}
const leaveRoomIfModal=()=>activities.close();
function advanceAbsentTown(townMinutes){
 if(!(townMinutes>0))return;
 world.traffic?.reconcileAbsent?.(minutes+townMinutes);
 if(townMinutes>MAX_ABSENCE_MINUTES){minutes+=townMinutes-MAX_ABSENCE_MINUTES;townMinutes=MAX_ABSENCE_MINUTES;}
 absence.add(townMinutes);activities.state.pendingTownMinutes=absence.pending;catchingUp=absence.pending>0;
}
function catchUpFrame(){
 // Before the first playable frame there is no live input to protect. Give the
 // exact same .2-minute steps more of this loading frame, rather than spending
 // minutes drawing the island between tiny 4 ms batches after a long absence.
 absence.tick(firstPlayFrame?undefined:{budgetMs:32,maxSteps:320});catchingUp=absence.pending>0;
 if(!catchingUp){activities.save();clock.getDelta();}
}

function updateController(dt){
 if(document.documentElement.dataset.desktopMenu==='open'){gamepadInput.suspend();return;}
 let pads=[];try{if(!document.hidden)pads=navigator.getGamepads?.()||[];}catch{}
 controllerFrame=(window.johanssonDesktopInput||gamepadInput).sample(pads,cameraControls.settings.deadzone);const f=controllerFrame;
 if(window.johanssonDesktop&&f.pressed[9])return; // The Deck Menu button belongs to the pause layer, even over a dialogue.
 if(controllerConnected!==f.connected){controllerConnected=f.connected;cameraControls.status(f.connected);if(f.connected)say(window.johanssonDesktop?'Controller connected · Left stick move · Right stick look · ☰ Menu pauses the island':'Controller connected · Left stick move · Right stick look · Menu opens town book',5);}
 if(!started||document.hidden||catchingUp)return;
 if(quietHud.photoMode&&f.pressed.some(Boolean)){quietHud.button();return;}
 if(f.held.some(Boolean)||Math.hypot(f.move.x,f.move.y)>.2||Math.hypot(f.look.x,f.look.y)>.2)quietHud.wake();
 if(!$('#qte').classList.contains('hidden')){if(f.pressed[1]||f.pressed[9])activities.close();else window.__JOHANSSON_TOUCH_UI__?.controller?.(f);return;}
 const direction=menuRepeat(f,dt);
 if(inspector?.active){
  if(f.pressed[1]||f.pressed[9]){inspector.close();return;}
  inspector.control?.({x:f.look.x,y:f.look.y,zoom:(f.held[6]?1:0)-f.zoom,reset:f.pressed[11]},dt);
  const root=$('#inspect-caption');navigateControls(root,direction);
  if(f.pressed[0]){const items=focusableControls(root);if(items.includes(document.activeElement))document.activeElement.click();else items[0]?.focus();}return;
 }
 if(f.pressed.some(Boolean))spawnScene?.cancel();
 const root=concert?.active?concert.panel:cameraControls.active?cameraControls.panel:activities.paused?$('#activity'):!$('#directory').classList.contains('hidden')?$('#directory'):null;
 if(root){
  if(f.pressed[1]||f.pressed[9]){if(concert?.active){concert.close();return;}if(cameraControls.active)cameraControls.close();else if(activities.paused)activities.close();else toggleDir(false);return;}
  // In a conversation, A finishes the line being typed, then takes the highlighted reply.
  if(root.id==='activity'&&activities.dialogue?.active&&f.pressed[0]){activities.dialogue.confirm();return;}
  if(window.johanssonDesktopUI)window.johanssonDesktopUI.navigate(root.id==='activity'&&activities.dialogue?.active?$('#activityActions'):root,direction);else navigateControls(root,direction);
  if(f.pressed[0]){const items=focusableControls(root);if(items.includes(document.activeElement))document.activeElement.click();else items[0]?.focus();}return;
 }
 if(!controlsAllowed())return;
 // The pocket camera: up on the D-pad raises it; A takes the photo, B or up again lowers it.
 if(pocket?.raised){if(f.pressed[0])pocket.shoot();if(f.pressed[1]||f.pressed[12])lowerPocket();if(f.pressed[9]||f.pressed[8]){lowerPocket();toggleDir(true);}return;}
 if(window.johanssonDesktop){
  if(f.pressed[10]){dispatchEvent(new Event('johansson-desktop-toggle-hud'));return;}
  if(f.pressed[14]||f.pressed[15]){contextRail.cycle(f.pressed[14]?-1:1);return;}
  if(f.pressed[1]){if(seated){standUp();return;}const exit=$('#exitRoomButton');if(!exit.hidden&&!exit.disabled){exit.click();return;}}
 }
 if(f.pressed[12]){raisePocket();return;}
 if(f.pressed[8]||f.pressed[9]&&!window.johanssonDesktop){toggleDir(true);return;}
 if(f.pressed[3]){if(window.johanssonDesktop)activities.bag();else activities.inventory();return;}
 if(f.pressed[11])centreCamera();
 if(f.pressed[0]){if(linuxLife?.wake())return;interaction();updateContextControls();if(!contextRail.activatePrimary())doInteract();return;}
 if(f.pressed[2])drinkNow();
 if(f.pressed[5])characters.jump();
}

const releasePressedControls=()=>pressedControls.clear();
addEventListener('pointerup',releasePressedControls);
addEventListener('pointercancel',releasePressedControls);
addEventListener('pointerdown',()=>{controlsTouchedAt=performance.now();});
// Jump is bound inside the character rig, so mark its press here to keep the same
// rule: a button being held stays on screen until the finger leaves it.
$('#jump').addEventListener?.('pointerdown',()=>pressedControls.add('jump'));
function updateContextControls(){
 if(!current)syncExteriorPlace();
 const ship=world.ferry,aboardFerry=!current&&!!deckUnder(),nearShip=!current&&ship&&Math.hypot(player.position.x-ship.ferry.position.x,player.position.z-ship.ferry.position.z)<45;
 ferryOperations?.update({visible:started&&(aboardFerry||nearShip&&!!ship.operation)});
 document.body.classList.toggle('hud-seated',!!seated);
 const blocked=!controlsAllowed()||catchingUp||!!pocket?.raised;
 const door=roomExitVisible({playing:started,inside:!current,paused:blocked,seated})?doorNearby():null;
 doorSite=door;
 const now=performance.now();
 // A room's catalogue assets start loading as its door comes within reach, so walking in seldom waits (at most a try
 // every ten seconds while a door is near: a failed fetch is not hammered).
 if(door&&!roomAssetsReady(door)&&now>roomAssetsTry){roomAssetsTry=now+10000;void loadRoomAssets(door);}
 if(!blocked&&(move2.lengthSq()>.02||Math.hypot(touchSticks.move.x,touchSticks.move.y)>.05)){controlsMovingUntil=now+1400;controlsTouchedAt=now;}
 // Hold the action button for a moment after its target is lost. Walking past scenery
 // otherwise blinks it in and out, and a tap can land where the button just was.
 if(!blocked&&active)controlsTargetUntil=now+450;
 const items=activities.state.inventory?.length||0;hudIcons.count(items);
 // While you walk, the top buttons fade back so the street has the screen.
 document.body.classList.toggle('hud-moving',!blocked&&now<controlsMovingUntil);
 const state=controlVisibility({playing:started,paused:blocked,seated,inside:!!current,moving:now<controlsMovingUntil,running:touchRunning,canDrink:!!hands?.canDrink,hasTarget:now<controlsTargetUntil,hasItems:items>0,pressed:[...pressedControls]});
 for(const [id,visible] of Object.entries(state)){
  const element=$('#'+id);
  if(id==='mobile'){element.classList.toggle('hidden',!visible);continue;}
  // The bag lives in the menu, where exploration is deliberately paused.
  const show=id==='bagButton'?started&&items>0:visible;
  element.classList.toggle('control-off',!show);
  if(id==='bagButton')element.hidden=!show;
 }
 const ramenOrder=Number.isInteger(parkSeat?.ramenSeatId)?ramenPlayerService?.order:null;
 const ramenDrink=ramenOrder&&['tea','beer','mugicha','coffee'].includes(ramenOrder.item.prop||ramenOrder.item.id);
 const table=Number.isInteger(parkSeat?.ramenSeatId)||!!parkSeat?.izakaya;
 const pending=ramenOrder?!ramenOrder.delivered:!!beerService?.pending;
 const exitPoint=activeRoomLayout?.exitAt?.(player.position.x,player.position.z)||activeRoomLayout?.exit;
 // A boolean: a room without an exit point (Sakura's office: its way out is the stair) offered "Exit to street" anywhere.
 const exitNearby=!!current&&!!(!!active&&/^(?:exit|leave|step outside|go out)\b/i.test(active.label)||exitPoint&&Math.hypot(player.position.x-exitPoint[0],player.position.z-exitPoint[2])<1.45&&(!roomWalk()||Math.abs(player.position.y-(activeRoomLayout.exitFloor??0))<1));
 contextTarget=!seated&&!blocked?(linuxLife?.inBed?{label:'Get out of bed',fn:()=>linuxLife.wake()}:active):null;
 const serviceOpen=Number.isInteger(parkSeat?.ramenSeatId)?satoRamenOpen(minutes):!!parkSeat?.izakaya&&izakayaOpen(minutes);
 contextRail.update({playing:started,paused:blocked,seated,table,canOrder:table&&serviceOpen&&!pending&&!ramenOrder,
  orderPending:table&&pending,canEat:johansson?.drinking?false:ramenOrder?.delivered?ramenOrder.left>0&&!ramenDrink:!!(parkSeat?.izakaya&&beerService?.dish?.left>0),
  canDrink:johansson?.drinking?false:ramenOrder?.delivered?ramenOrder.left>0&&!!ramenDrink:!!(parkSeat?.izakaya&&beerService?.drink?.left>0),
  heldDrink:!!hands?.canDrink,inside:!!current,canExit:exitNearby&&!linuxLife?.inBed,targetLabel:contextTarget?.label||'',departure:current?null:islandPlay?.departurePrompt??null,
  enterLabel:door?'Enter '+door.title:'',pressed:[...pressedControls]});
 if(stickHintUntil&&(now>stickHintUntil||touchSticks.moving)){touchSticks.hint(false);stickHintUntil=0;}
 // Soft quest: quay before evening press (~18:30), once per calendar dayKey if picked.
 // Time of day, not minutes since the save began: it used to fire on load from day two.
 const dayMinute=((minutes%1440)+1440)%1440;
 if(started&&activities?.state&&dayMinute>=1080&&dayMinute<1170){
  ensureDailyQuests(activities.state);
  if(hasDailyQuest(activities.state,'quay_before_press')&&!isDailyDone(activities.state,'quay_before_press')){
   const visited=activities.state.visited||[];
   const sawQuay=visited.some(id=>['office','warehouse','pier','harbour','quay'].includes(id));
   markDailyDone(activities.state,'quay_before_press');activities.save();
   if(!sawQuay)nudge(QUAY_NUDGE,6);
  }
 }
}
const invalidateDetails=()=>{townSections.invalidate();shopStreetView.invalidate();};
// Feet on whatever is drawn: lanes, aprons, decks (walk-surface.js). Laid once now and
// again whenever a streamed detail arrives.
loadingProgress?.start('walking');
await paintLoading();
launchReport.stage('Preparing walking surface');
const walkSurface=createWalkSurface({minX:COAST_BOUNDS.minX-2,maxX:COAST_BOUNDS.maxX+2,minZ:COAST_BOUNDS.minZ-2,maxZ:COAST_BOUNDS.maxZ+2,base:planHeight});
{const t0=performance.now();walkSurface.add(town);setWalkSurface(walkSurface);window.__JOHANSSON_WALK__={ms:Math.round(performance.now()-t0),get triangles(){return walkSurface.triangles;}};}
loadingProgress?.complete('walking');loadingProgress?.start('preview');
const detailStream=createDetailStream({enabled:graphics.streamDetails,...(window.johanssonDesktop?{lookAhead:32,radiusScale:1.8,maxConcurrent:2,maxPending:4,timeoutMs:30000}:{}),onStart:id=>launchReport.stage('Loading detail: '+id),onChange:()=>{invalidateDetails();walkSurface.add(town);}});window.__JOHANSSON_STREAMING__=detailStream.stats;
// With ?audit in the address, a harness can put the player anywhere and look down on
// the town from a fixed camera. Nothing reads it otherwise.
/**
 * Paints the normal world path without advancing animation, input or the clock: the audit's stills and the free camera.
 * `view` ({pos,at}) places the camera; without it the camera stays where it was put. `sweep` (seconds) cel-shades new
 * arrivals on the live game's cadence instead of sweeping the whole scene every draw.
 */
function renderStill(view,{sweep=null}={}){
 activeRoomLayout?.realUpdate?.();
 if(graphicsLifecycle?.lost)return false;
 if(concert?.active){concert.render();return true;}
 if(photoStudio?.active){photoStudio.render();return true;}
 if(conversationLine)updateConversationLift(0);
 if(view){camera.position.set(...view.pos);camera.lookAt(...view.at);camera.updateMatrixWorld();}else if(!freeCamera.active)applyFerryCamera();
 // The hourly callbacks include shutter interpolation. Frozen draws only
 // refresh view-dependent lighting; fixture time synchronises hours once.
 setTime({updateHours:false});lightBudget.update();colliderGrid.refresh();if(sweep===null)celPass.apply(scene);else sweepCel(sweep);
 placeWorldBalloons();
 if(!current)renderOutdoor();
 else if(streetFrontageOf(current))present(()=>shopStreetView.render({renderer,scene,camera,town,room,frontage:streetFrontageOf(current)}));
 else present(()=>renderer.render(scene,camera));
 return true;
}
if(new URLSearchParams(location.search).has('audit'))window.__JOHANSSON_AUDIT__={
 frozen:new URLSearchParams(location.search).has('visual-audit'),
 /** Paint the normal world path without advancing animation, input or the clock. */
 render(){return renderStill(this.camera||(!spawnScene?.active&&activeRoomLayout?.fixedCamera));},
 setTime(value,{rain=false}={}){
  if(!Number.isFinite(value))throw new Error('Audit time must be finite town minutes');
  minutes=value;followRealClock=false;townClock.set(minutes,1);weatherMode='fixed';weatherKind=rain?'rain':'sunny';weather=!!rain;world.setRain(weather);
  advanceTown(0,true);setTime();world.quarters?.shutter?.update(minutes,0,{snap:true});$('#clock').textContent=fmt(minutes);
  // The shop mascot and hanging decorations normally use wall-clock animation.
  // Sample them once at a fixed phase after fixture sync, without changing live play.
  if(this.frozen)sakuraShop.display.tick(0);
 },
 /** Turn where he stands (aboard the ferry too, where teleport's ground would be the sea). */
 face(facing,tilt){if(Number.isFinite(facing))yaw=facing;if(Number.isFinite(tilt))pitch=tilt;},
 /** Where he stands and which way he faces (a room's own frame indoors). */
 get player(){return {position:player.position.toArray(),yaw,room:current?.id??null};},
 /** Stand him at a point with its height (on a deck aboard the ferry, where the town's ground is the sea). */
 stand(x,y,z,facing){spawnScene?.cancel('placement');ensureKitanoAt(x,z);if(seated){seated=false;parkSeat=null;johansson?.seat?.(null);}player.position.set(x,y,z);if(Number.isFinite(facing))yaw=facing;},
 /** For the audit of his drinking (the owner, 27 October 2026: "test that he can drink beer in the izakaya"): a drink
  *  served at once at his izakaya seat (the opening's serveNow), a sip of it by the game's own performance, and where
  *  that performance stands (table-drink.js diagnostics: the phase, the rim's and the wrist's errors). */
 serve(kind='draft'){if(!seated)return 'not seated';if(!parkSeat?.izakaya)return 'not an izakaya seat';if(!beerService)return 'no beer service in this room';if(!parkSeat.izakaya.table)return 'the seat has no table';return beerService.serveNow(kind,parkSeat.izakaya)?true:'serveNow refused '+kind;},
 sip(){return drinkNow();},
 get drinking(){return johansson?.drinkingState||null;},
 teleport(x,z,facing,tilt){spawnScene?.cancel('placement');ensureKitanoAt(x,z);if(seated){seated=false;parkSeat=null;johansson?.seat?.(null);}player.position.set(x,groundHeight(x,z),z);if(Number.isFinite(facing))yaw=facing;if(Number.isFinite(tilt))pitch=tilt;},
 get lensOcclusion(){return lensOcclusion;},
 /** For the audit: the lens's own tests at a point (what stops the boom), and whether he is in one of the ferry's rooms. */
 probe(x,y,z,r=.16){return {blocked:cameraBlocked(x,z,y,r),room:shipRoom(),deck:deckUnder()?.floor?.id??null,aboardSolid:!!deckUnder()&&ferryWalk.cameraBlocked(x,z,y,r)};},
 get lens(){return {position:camera.position.toArray(),rotation:camera.rotation.toArray().slice(0,3),quaternion:camera.quaternion.toArray(),distance:thirdDistance,ceiling:current?indoorCeilings?.limit(camera.position.x,camera.position.z,player.position.y):null,blocked:cameraBlocked(camera.position.x,camera.position.z,camera.position.y,.16)};},
 get ferryCamera(){return {active:!!ferryExplorer?.active,mode:ferryExplorer?.mode??null,id:ferryExplorer?.id??null,local:ferryExplorer?.local.toArray()??null,precision:ferryExplorer?.precision??false,fov:camera.fov,zoom:camera.zoom};},
 get ferryInspectPoints(){return ferryExplorer?.nearby().map(t=>{const p=world.ferry.ferry.localToWorld(new THREE.Vector3(...t.pos)).project(camera);return {id:t.id,label:t.label,x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,inView:Math.abs(p.x)<.9&&Math.abs(p.y)<.9&&p.z> -1&&p.z<1};})||[];},
 get mouse(){return {walking:pointWalk.active,destination:pointWalk.destination,yaw,pitch,thirdPerson};},
 camera:null,
 step(milliseconds){
  if(photoStudio?.active)return this.render();
  const seconds=Math.min(300000,Math.max(0,Number(milliseconds)||0))/1000,following=followRealClock;followRealClock=false;
  try{for(let elapsed=0;elapsed<seconds;elapsed+=SIM_STEP){
   const dt=Math.min(SIM_STEP,seconds-elapsed),paused=document.documentElement.dataset.desktopMenu==='open'||activities.paused||roomLoading||cameraControls.active||inspector?.active||itemViewer?.active||!$('#directory').classList.contains('hidden');
   simulate(dt,!!paused);tickSubtitle(dt);hands?.update(paused?0:dt);updateJohansson(paused?0:dt);characters?.update(dt);castAI?.pose(dt);facing.update(dt);updateConversationLift(dt);
   spawnScene?.update(dt,{paused:!!paused,unavailable:!!(islandPlay?.active||this.camera)});
  }}finally{followRealClock=following;}
  const view=this.camera;if(view){camera.position.set(...view.pos);camera.lookAt(...view.at);camera.updateMatrixWorld();}else if(!freeCamera.active)applyFerryCamera();
  setTime();updateContextControls();if(!activities.paused&&!roomLoading&&!cameraControls.active&&!inspector?.active&&!itemViewer?.active&&$('#directory').classList.contains('hidden'))interaction();else $('#prompt').classList.remove('on');$('#clock').textContent=fmt(minutes);drawMap();this.render();pocket?.frame();
 },
 /** What the renderer is carrying: shader programs, draw calls, triangles, geometries, textures. */
 get programKeys(){return (renderer.info.programs||[]).map(p=>p.name+' | '+p.cacheKey.slice(0,600));},
 get lightBudget(){return lightBudget.most;},
 get renderInfo(){const i=renderer.info;return {programs:i.programs?.length??0,calls:i.render.calls,triangles:i.render.triangles,geometries:i.memory.geometries,textures:i.memory.textures,releasedCanvases:releasedCanvasCount()};},
 concert:()=>openKaraoke(),
 get concertState(){return concert?.snapshot()||{active:false};},
 photo:()=>openPhotoStudio(),
 /** The quiet HUD: wake() it, fade it now (idle()), or hide every control for a clean picture (photo(true)). */
 hud:{wake:()=>quietHud.wake(),hold:on=>quietHud.hold(on),idle:()=>quietHud.rest(),photo:on=>quietHud.photo(on),get state(){return {idle:quietHud.idle,photo:quietHud.photoMode};}},
 get photoActive(){return !!photoStudio?.active;},
 /**
  * The distance along the view to the first opaque surface, for every pixel of the audit camera's view (w × h), as
  * millimetres in 24 bits (R high, G, B low; 0 = nothing there), top row first, base64. The films photograph a set
  * with it, so the people they draw in 3D pass behind what stands in front of them (an umbrella stand, a shelf)
  * instead of over it. Glass and other see-through surfaces are left out; inside a room, so is the town outside.
  */
 depth(w,h){
  const view=this.camera;if(view){camera.position.set(...view.pos);camera.lookAt(...view.at);camera.updateMatrixWorld();}else if(!freeCamera.active)applyFerryCamera();
  const target=new THREE.WebGLRenderTarget(w,h),cache=new Map(),undo=[],aspect=camera.aspect;
  const depthOf=m=>{if(!m.alphaTest&&!m.alphaMap)return null;if(!cache.has(m))cache.set(m,new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:m.map,alphaMap:m.alphaMap,alphaTest:m.alphaTest||.5,side:m.side}));return cache.get(m);};
  const plain=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}),plainDouble=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide});
  scene.traverse(o=>{
   if(o.isLine||o.isPoints||o.isSprite){const v=o.visible;undo.push(()=>{o.visible=v;});o.visible=false;return;}
   if(!o.isMesh)return;const m=o.material,list=Array.isArray(m)?m:[m];
   // People, traffic and moving props come and go between one photograph and the next: only the set itself.
   let passing=o.isSkinnedMesh;for(let p=o;p&&!passing;p=p.parent)passing=!!(p.userData.character||p.userData.name||p.userData.vehicle||p.userData.dynamicProp);
   const clear=passing||o.userData.clearWindow||list.every(x=>!x||(x.transparent&&(x.opacity??1)<.9)||x.colorWrite===false);
   const v=o.visible;undo.push(()=>{o.visible=v;o.material=m;});
   if(clear){o.visible=false;return;}
   o.material=Array.isArray(m)?m.map(x=>depthOf(x)||(x.side===THREE.DoubleSide?plainDouble:plain)):depthOf(m)||(m.side===THREE.DoubleSide?plainDouble:plain);
  });
  const outside=town.visible;if(current)town.visible=false;
  const bg=scene.background,fog=scene.fog;scene.background=null;scene.fog=null;
  camera.aspect=w/h;camera.updateProjectionMatrix();
  const px=new Uint8Array(w*h*4),clearColour=renderer.getClearColor(new THREE.Color()),clearAlpha=renderer.getClearAlpha();
  try{renderer.setRenderTarget(target);renderer.setClearColor(0xffffff,1);renderer.clear();renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,w,h,px);}
  finally{renderer.setRenderTarget(null);renderer.setClearColor(clearColour,clearAlpha);scene.background=bg;scene.fog=fog;town.visible=outside;camera.aspect=aspect;camera.updateProjectionMatrix();for(const u of undo)u();target.dispose();plain.dispose();plainDouble.dispose();for(const d of cache.values())d.dispose();}
  // RGBADepthPacking (three r170 packing.glsl: R the high byte … A the low): the window depth in [0,1], then the distance along the view.
  const n=camera.near,f=camera.far,out=new Uint8Array(w*h*3);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=((h-1-y)*w+x)*4,d=px[i]/256+px[i+1]/65536+px[i+2]/16777216+px[i+3]/255/16777216;
   if(d>=.99999)continue;
   const mm=Math.min(16777215,Math.round(n*f/(f-d*(f-n))*1000)),o=(y*w+x)*3;out[o]=mm>>16;out[o+1]=(mm>>8)&255;out[o+2]=mm&255;
  }
  let bin='';for(let i=0;i<out.length;i+=32768)bin+=String.fromCharCode(...out.subarray(i,i+32768));
  return {w,h,near:n,far:f,fov:camera.fov,data:btoa(bin)};
 },
 get world(){return world;},
 get sites(){return SITES.map(s=>({id:s.id,title:s.title,x:s.x,z:s.z,door:s.door,entryFacing:s.entryFacing,exitPosition:s.exitPosition,approachPosition:s.approachPosition}));},
 /** Read-only coordinates of visible interactions in the current coordinate frame. */
 get targets(){return interactables.flatMap(o=>{const hit=o.userData.hit;if(!hit||!!hit.inside!==!!current)return [];for(let p=o;p;p=p.parent)if(!p.visible)return [];const pos=o.getWorldPosition(new THREE.Vector3()),distance=pos.distanceTo(player.position);return current||distance<35?[{label:hit.label,position:pos.toArray(),distance,inside:!!hit.inside}]:[];});},
 get homeDirectory(){return directoryCards();},
 get walkingDirections(){return navigationTarget?{target:navigationTarget,status:navigationPlan?.status||'searching',reason:navigationPlan?.reason,path:navigationPath.map(p=>({...p})),leg:navigationLeg}:null;},
 get roomNavigation(){return current?{id:current.id,title:current.title,bounds:activeRoomLayout?.bounds||{minX:-5,maxX:5,minZ:-5,maxZ:5},spawn:activeRoomLayout?.spawn||[0,0,4.3],exit:activeRoomLayout?.exit||activeRoomLayout?.spawn||[0,0,4.3],yaw:activeRoomLayout?.yaw||0}:null;},
 /** The ground and the surface under a point, as the simulation reads them (clipping audits). */
 ground(x,z){return groundHeight(x,z);},route(x,z){const r=routeAt(x,z);return r?{id:r.id,surface:r.surface}:null;},
 /** Read the same standing collision rules used by actual player movement. */
 navigation(x,z,radius=PLAYER_RADIUS){
  if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(radius)||radius<.1||radius>.6)throw Error('Invalid navigation probe');
  const y=current?player.position.y:groundHeight(x,z),bounds=current?(activeRoomLayout?suppliedRoomBoundsBlocked(activeRoomLayout,x,z,radius):roomBoundsBlocked(x,z,radius)):townBoundsBlocked(x,z,radius);
  const solids=(current?roomColliders:world.colliders).filter(c=>standingHitsRect(x,z,radius,y,c)).map(c=>({id:c.id||'solid',x:c.x,z:c.z,w:c.w,d:c.d,yaw:c.yaw||0}));
  const residents=residentsAt(x,z,radius).map(g=>g.userData.name||g.name);
  return {x,z,y,radius,room:current?.id||null,bounds,staticBlocked:bounds||solids.length>0,residentBlocked:residents.length>0&&!(!current&&inEntrance(x,z)),solids,residents,route:this.route(x,z)};
 },
 enter(id){const s=id===CITY_RESTAURANT.id?NAHA_TRIP:id===NAHA_ARRIVALS.id?NAHA_ARRIVALS:SITES.find(site=>site.id===id)||world.landmarks?.find(site=>site.id===id);return s?enterRoom(s):null;},
 /** Sakura's stair and fire escape, as the prompts take them (the audit photographs them); `passage` while one runs. */
 stair(direction){return takeSakuraStair(direction);},evacuate(){return evacuateSakuraOffice();},get passage(){return !!stairPassage;},
 /** A room entered only from inside another (Sakura's office), for the audit's photographs. */
 enterInside(id,arrival){const s=INSIDE_SITES.get(id);return s?enterRoom(s,arrival):null;},
 leave(){leaveRoom();},
 /**
  * Recording a walk and playing it back (src/input/replay.js). record(note) starts from here and now; stop() gives the
  * recording (plain JSON); play(recording, {mode:'inputs'|'poses'}) puts the player back where it started (room,
  * place, view, time, weather) and plays it, step by step, while step() or the game runs; status() says where it is.
  */
 /** The pocket camera: raise() and lower() it, shoot() keeps what its screen shows; status() is what it holds. */
 pocket:{
  raise:()=>raisePocket(),lower:()=>lowerPocket(),shoot:()=>pocket?.shoot()??{ok:false,text:'The camera is put away.'},
  status:()=>({raised:!!pocket?.raised,model:pocketModel().name,album:activities.album.map(p=>({id:p.id,people:[...p.people],place:p.place,palette:p.palette,day:p.day,minutes:p.minutes}))}),
  /** Who the lens sees now, and why each one would or would not be in a photo. */
  look:()=>{camera.updateMatrixWorld();return pocketPeople().map(person=>explainPerson({camera,person,screenAspect:camera.aspect,blocked:pocketBlocked})).filter(e=>e.distance!=null&&e.distance<25);},
 },
 replay:{
  record(note=''){
   stopReplay();spawnScene?.cancel('placement');pointWalk.cancel();walkMotion.reset();touchAutoRun.reset();
   replayRecorder=createRecorder({room:current?.id||null,x:player.position.x,y:player.position.y,z:player.position.z,yaw,pitch,minutes,weather:weatherKind},{note});replayNote='recording';
   return this.status();
  },
  stop(){
   const report=stopReplay();
   if(!replayRecorder)return report?{played:report}:null;
   const open=replayRecorder.open,rec=replayRecorder.finish();replayRecorder=null;
   if(!open)return null;replayNote='recorded '+rec.frames.length+' steps';return rec;
  },
  async play(rec,{mode='inputs'}={}){
   const next=createPlayer(rec,{mode});
   if(replayRecorder?.open)throw Error('A recording is running: stop() it first.');
   if(islandPlay?.active||activities.state.island?.journey?.location==='naha')throw Error('Not during the island journey.');
   replayRecorder=null;stopReplay();
   const st=rec.start,room=st.room||null;
   // The time first: a place may be shut at another hour.
   if(Number.isFinite(st.minutes))this.root.setTime(st.minutes,{rain:st.weather==='rain'});
   if(st.weather==='cloudy')weatherKind='cloudy';
   if((current?.id||null)!==room){if(current)leaveRoom();if(room)await this.root.enter(room);}
   if((current?.id||null)!==room)throw Error(`Could not go back to where the recording starts (${room||'the town'}).`);
   this.root.teleport(st.x,st.z,st.yaw,st.pitch);if(Number.isFinite(st.y))player.position.y=st.y;
   pointWalk.cancel();walkMotion.reset();touchAutoRun.reset();resetInput();
   replayPlayer=next;replayNote='playing';return this.status();
  },
  status(){
   return {recording:!!replayRecorder?.open,steps:replayRecorder?.length??0,playing:replayPlayer?replayPlayer.report():null,last:replayLast,note:replayNote};
  },
  root:null,
 },
 // Film photographs (remotion/tools/capture-room.mjs): a shop door held open by an amount ("onsen", inside Umi-no-yu: its street door), a fridge door held open,
 // and how many of a product are on Sakura's shelves (each one is drawn, so a gap is a real gap).
 shopDoor(id,amount){if(id==='onsen'&&current?.id==='onsen'&&activeRoomLayout?.streetDoor){activeRoomLayout.streetDoor.set(amount);return activeRoomLayout.streetDoor.amount;}const s=SITES.find(site=>site.id===id);if(!s?.shopDoor)throw Error(`No shop door for ${id}`);s.shopDoor.set(amount);if(id==='market')sakuraShop.display.frontDoor?.set(amount);return s.shopDoor.amount;},
 fridgeDoor(column,amount){return sakuraShop.display.refrigerator.hold(column,amount);},
 /** Halloween on Sakura Street (world/halloween.js): stage a moment of the children's walk. */
 get halloween(){return world.halloween;},
 stock(id,shelf){const st=activities.state.sakura?.stock;if(!st?.[id])throw Error(`No Sakura stock line ${id}`);if(Number.isFinite(shelf)){st[id].shelf=Math.max(0,shelf|0);sakuraShop.display.updateStock(st);}return {shelf:st[id].shelf,capacity:id==='bun'?12:24};},
 interact(){doInteract();},
 get conversation(){const sp=conversationLine?.speaker;if(!sp)return {name:conversationName,speaker:null};const w=sp.getWorldPosition(new THREE.Vector3()),t=characters.conversationTarget(sp);return {name:conversationName,visible:sp.visible,seated,third:thirdPerson,speaker:w.toArray().map(v=>+v.toFixed(2)),target:t?.toArray?.().map(v=>+v.toFixed(2)),player:player.position.toArray().map(v=>+v.toFixed(2)),yaw:+yaw.toFixed(2)};},
 use(label){const o=interactables.find(o=>o.userData.hit?.label===label);if(!o)return false;active={...o.userData.hit,object:o};o.userData.hit.fn();return true;},
 get active(){return active?.label||null;},
 near(r=3.2){const q=new THREE.Vector3();return interactables.map(o=>{o.getWorldPosition(q);return [o.userData.hit?.label,+q.distanceTo(player.position).toFixed(2),o.visible,!!o.userData.hit?.inside];}).filter(x=>x[1]<r);},
 get seated(){return seated;},
 get seat(){return seated&&parkSeat?{position:[...parkSeat.position],stand:[...parkSeat.stand],surfaceY:parkSeat.surfaceY,yaw:parkSeat.yaw}:null;},
 get arrival(){return spawnScene?.snapshot();},
 get beer(){return beerService?{pending:beerService.pending,drink:beerService.drink}:null;},
 /** Minato's service itself (izakaya-beer.js): photographs and tests order through it, as the menu does. */
 get beerService(){return beerService;},
 get paused(){return !!(activities?.paused||concert?.active||concertLoading||photoStudio?.active||itemViewer?.active);},
 get blocked(){return {catchingUp,roomLoading,camera:!!cameraControls.active,inspector:!!inspector?.active,viewer:!!itemViewer?.active,photo:!!(photoStudio?.active||photoLoading||photoReturning),directory:!$('#directory').classList.contains('hidden'),started,hidden:document.hidden};},
 get johansson(){return johansson;},get hands(){return hands;},
 get room(){return room;},get scene(){return scene;},get renderer(){return renderer;},get layout(){return activeRoomLayout;},
 get island(){return islandPlay;},
 get ferryCrew(){return ferryCrew?.snapshot()||[];},
 get activities(){return activities;},get bookshopCustomers(){return bookshopCustomers.snapshot();},
 get shop(){return {customers:[...sakuraShop.retail.customers].map(([p,r])=>({name:p.profile.name,item:r.item,phase:r.phase,position:r.position,picked:r.picked,paid:r.paid,finished:r.finished,atCounter:r.atCounter})),stock:Object.fromEntries(Object.entries(activities.state.sakura.stock).map(([id,s])=>[id,{shelf:s.shelf,reserve:s.reserve}]))};},
 /** The neighbours' small talk: how many chats so far, the one running, and how many the model has written. */
 get chats(){const c=neighbourChats.current;return {count:neighbourChats.count,written:neighbourWriter.written,model:neighbourWriter.ready,current:c?{pair:c.pair.map(p=>p.profile.name),topic:c.topic,text:c.text}:null};},
};
window.__JOHANSSON_AGENT_CONTEXT__=()=>({destinations:Object.fromEntries([...SITES,...(world.landmarks||[])].map(s=>[s.id,s.title])),controlsAllowed:controlsAllowed()&&!catchingUp,concert:concert?.snapshot()||{active:false}});
if(window.__JOHANSSON_AUDIT__){
 window.__JOHANSSON_AUDIT__.replay.root=window.__JOHANSSON_AUDIT__;
 window.__JOHANSSON_GRAPHICS__=createGraphicsInspector({canvas,renderer,canCapture:()=>!graphicsLifecycle?.lost&&started&&!document.hidden});
 window.advanceTime=ms=>window.__JOHANSSON_AUDIT__.step(ms);
 window.render_game_to_text=()=>JSON.stringify({coordinates:'x/z in metres; y is height; interiors use local coordinates',room:current?.id||null,...(window.johanssonDesktopUI?{desktop:window.johanssonDesktopUI.snapshot()}:{}),home:activeRoomLayout?.snapshot?.()||null,calendar:activeRoomLayout?.calendar?.()||null,discoveries:activeRoomLayout?.discoveries?.()||null,minutes,cargoBerth:world.oilJetty?.snapshot?.()||null,player:player.position.toArray(),seat:seated&&parkSeat?{surfaceY:parkSeat.surfaceY,position:parkSeat.position,stand:parkSeat.stand}:null,customers:bookshopCustomers.snapshot(),island:islandPlay?.snapshot(),arrival:spawnScene?.snapshot()});
}
// Where the player is standing and what they are standing on. Read-only, and the same
// answer the simulation uses, so a screenshot can be tied to a place on the ground.
window.__JOHANSSON_POSE__={
 get x(){return player.position.x;},get y(){return player.position.y;},get z(){return player.position.z;},
 get yaw(){return yaw;},get pitch(){return pitch;},get inside(){return current?.id||null;},
 get ground(){return routeAt(player.position.x,player.position.z)?.id||null;},
 get bus(){const run=world.ferry||world.bus;return run?{phase:run.phase,service:run.service??null,z:+run.bus.position.z.toFixed(1),scale:+run.bus.scale.x.toFixed(3),visible:run.bus.visible}:null;},
 get doors(){return (world.shopDoors||[]).map(d=>+d.amount.toFixed(3));},
 /** The town clock, in minutes past midnight, so a routine can be watched against it. */
 get minutes(){return Math.round(minutes);},
 // Who is at the terminus and who has gone, so the boarding can be watched rather
 // than inferred from where somebody was standing a moment ago.
 get transit(){return world.people.filter(p=>['bus','away','station'].includes(p.g.userData.place))
  .map(p=>p.profile.name+':'+p.g.userData.place+(p.g.visible?'':' (gone)'));},
 get surface(){return routeAt(player.position.x,player.position.z)?.surface||null;},
};
// What each of the cast is actually playing. Which animation a body has chosen is
// invisible from a screenshot -- a weight shift and a loop look identical in a still --
// so there is otherwise no way to check from outside that anyone is using more than
// the first take of an idle.
/** Minato's beer service, for watching an order go from the tap to the table. */
window.__JOHANSSON_BEER__=()=>beerService?{pending:beerService.pending,drink:beerService.drink,served:beerService.served}:null;
window.__JOHANSSON_CAST__={
 get takes(){return (characters?.actors||[]).map(a=>({
  name:a.entity?.userData?.name||'?',clip:a.current||null,gesture:a.animator?.gesture||null,
  moving:!!a.moving,speed:+(a.speed||0).toFixed(2),activity:a.entity?.userData?.activity||null,indoors:a.entity?.userData?.indoors||null,visible:!!a.entity?.visible,flags:Object.keys(a.entity?.userData||{}).filter(k=>/^in[A-Z]/.test(k)&&a.entity.userData[k]===true),at:a.entity?[+a.entity.position.x.toFixed(2),+a.entity.position.z.toFixed(2),+a.entity.rotation.y.toFixed(2)]:null}));},
};
// Sakura's books, live rather than as last saved. The shop's day is settled on the
// town clock whether or not anybody is standing in it, and the saved copy lags, so
// there was no way to see from outside whether the meter had actually run.
window.__JOHANSSON_SHOP__={
 get books(){const shop=activities?.state?.sakura;return shop?{
  cash:shop.cash,sales:shop.sales,result:shop.profit,overheads:shop.overheads,
  drawings:shop.drawings,stockSpent:shop.stockSpent,settledDay:shop.settledDay,
  entries:shop.journal.length,kinds:[...new Set(shop.journal.map(r=>r.kind))]}:null;},
};
for(const detail of world.details||[])detailStream.add(detail);

detailStream.add({id:'warehouse',priority:1,x:WAREHOUSE.x,z:WAREHOUSE.z,radius:38,load:()=>world.warehouse?.load()});
// The real shop behind the real window. It streams with the rest of the street rather
// than blocking the entry gate. All visible furnishings come from this same room.
{
 const market=SITES.find(s=>s.id==='market'),front=market?.streetFrontage?.position;
 if(front)detailStream.add({id:'sakura-interior',priority:1,x:front[0],z:front[2],radius:graphics.streamDetails?40:18,requiredNearby:true,
  // Not while you are in the shop: the loader can finish after you walk in, and parking the
  // shop behind its glass then took the interior out from round you. Leaving parks it.
  load:async()=>{const ready=await sakuraShop.ready();return ready?(current?.id==='market'?true:showShopThroughWindow()):false;}});
}
let detailsStarted=false;

let titleElapsed=0,titleFrame=0,titleReported=false;
const titleReduced=matchMedia('(prefers-reduced-motion: reduce)');
let desktopFrameAt=performance.now(),desktopSampleAt=desktopFrameAt,desktopFrames=0,desktopWorst=0;
function desktopFrameStats(){if(!window.johanssonDesktop)return;const at=performance.now();desktopFrames++;desktopWorst=Math.max(desktopWorst,at-desktopFrameAt);desktopFrameAt=at;if(at-desktopSampleAt<2000)return;const d=document.documentElement.dataset;d.renderFps=String(Math.round(desktopFrames*1000/(at-desktopSampleAt)));d.frameWorst=desktopWorst.toFixed(1);d.drawCalls=String(renderer.info.render.calls);d.textures=String(renderer.info.memory.textures);desktopSampleAt=at;desktopFrames=0;desktopWorst=0;}
function loop(){requestAnimationFrame(loop);if(graphicsLifecycle?.lost){clock.getDelta();return;}
// The diorama covers the World with its own WebGL view. Hold the hidden scene and
// its clock while it is open; keep controller Back and paused audio responsive.
if(activities?.viewerActive){const dt=Math.min(clock.getDelta(),MAX_FRAME_DT);resetInput();updateController(dt);townAudio.update({player:player.position,yaw,minutes,rain:weather,inside:!!current,station:activities.state.radioStation||0,paused:true});return;}
desktopFrameStats();if(document.documentElement.dataset.desktopMenu==='open'){clock.getDelta();return;}activeRoomLayout?.realUpdate?.();if(concert?.active){const dt=Math.min(clock.getDelta(),MAX_FRAME_DT);updateController(dt);concert.render();return;}if(concertLoading){clock.getDelta();return;}if(freeCamera.active){const dt=Math.min(clock.getDelta(),MAX_FRAME_DT);if(detailsStarted&&!document.hidden)detailStream.update(current?doors.get(current.id)||player.position:player.position,current?null:{x:-Math.sin(yaw),z:-Math.cos(yaw)});freeCamera.update(dt,camera);updateJohansson(0);renderStill(null,{sweep:dt});return;}if(window.__JOHANSSON_AUDIT__?.frozen){const frozenDt=clock.getDelta();
 // Before START the title still draws: its first frame is what marks the island drawn and opens START (islandDrawn).
 // Frozen, it never drew, and every ?visual-audit harness waited at 97% for ever ("Drawing the island").
 if(!started){renderTitle(frozenDt);return;}
 if(detailsStarted&&!document.hidden)detailStream.update(current?doors.get(current.id)||player.position:player.position,current?null:{x:-Math.sin(yaw),z:-Math.cos(yaw)});if(window.__JOHANSSON_AUDIT__.renderFrozen!==false)window.__JOHANSSON_AUDIT__.render();return;}renderer.info.reset?.();lightBudget.update();colliderGrid.refresh();if(pocket?.raised&&!pocketCanRaise())lowerPocket();if(photoStudio?.active){clock.getDelta();photoStudio.render();return;}izakayaTV?.update({camera,active:sharedDining(current)&&(izakayaOpen(minutes)||satoRamenOpen(minutes)),paused:!started||document.hidden||roomLoading||!!inspector?.active||!!activities?.paused});if(detailsStarted&&!document.hidden&&!catchingUp)detailStream.update(current?doors.get(current.id)||player.position:player.position,current?null:{x:-Math.sin(yaw),z:-Math.cos(yaw)});updateContextControls();const frameDt=Math.min(clock.getDelta(),MAX_FRAME_DT);governResolution(frameDt);updateWantCards(frameDt);sweepCel(frameDt);updateController(frameDt);activeRoomLayout?.workshop?.update(activities.state,activities.paused?0:frameDt);if(started&&!document.hidden&&!activities.paused)activeRoomLayout?.ownedUpdate?.(frameDt);activeRoomLayout?.keep?.setPlayerBottle(!!activities.state.izakayaBottle);if(started&&!document.hidden){const paused=catchingUp||cameraControls.active||roomLoading||inspector?.active||itemViewer?.active||activities.paused||!$('#directory').classList.contains('hidden');const before=player.position.clone();if(catchingUp)catchUpFrame();else simulate(frameDt,!!paused);if(!paused){if(player.position.distanceTo(before)>.01&&(stepTick+=frameDt)>.42){activities.footstep(current?'wood':routeAt(player.position.x,player.position.z)?.surface||'stone');stepTick=0;}interaction();}else{neighbourChats.cancel();chatBubble.hide();resetInput();$('#prompt').classList.remove('on');}townAudio.update({player:player.position,yaw,minutes,rain:weather,inside:!!current,station:activities.state.radioStation||0,paused,relax:!!(seated&&!current),ferry:world.ferry?.audio??null});$('#clock').textContent=fmt(minutes);setTime();hands?.update(paused?0:frameDt);updateJohansson(paused?0:frameDt);updateEarDefenders();if(!inspector?.active){characters?.update(frameDt);castAI?.pose(frameDt);if(!paused||conversationLine)facing.update(frameDt);}if(!paused||conversationLine)updateConversationLift(frameDt);if((mapTick+=frameDt)>.15){drawMap();mapTick=0;}tickSubtitle(frameDt);applyFerryCamera();if(current&&activeRoomLayout?.fixedCamera&&!window.__JOHANSSON_AUDIT__?.camera){const f=activeRoomLayout.fixedCamera;camera.position.set(...f.pos);camera.lookAt(...f.at);camera.updateMatrixWorld();}if(current&&window.__JOHANSSON_AUDIT__?.camera){const a=window.__JOHANSSON_AUDIT__.camera;camera.position.set(...a.pos);camera.lookAt(...a.at);camera.updateMatrixWorld();}spawnScene?.update(frameDt,{paused,unavailable:!!(islandPlay?.active||window.__JOHANSSON_AUDIT__?.camera)});placeWorldBalloons(frameDt);if(inspector?.active)present(()=>inspector.render(frameDt),inspector.camera);else if(streetFrontageOf(current))present(()=>shopStreetView.render({renderer,scene,camera,town,room,frontage:streetFrontageOf(current)}));else if(!current)renderOutdoor();else present(()=>renderer.render(scene,camera));pocket?.frame();}else{neighbourChats.cancel();chatBubble.hide();renderTitle(frameDt);}}renderOutdoor();loop();

// The title shares the live world, assets, camera and render budget with play.
// Never advance activities, player input, catch-up or saves while previewing.
function renderTitle(dt){
 if(document.hidden||document.documentElement.dataset.desktopMenu==='open')return;
 titleFrame+=dt;if(titleFrame<1/24)return;const titleDt=titleFrame;titleFrame=0;
 if(!titleReduced.matches)titleElapsed+=titleDt;
 const shop=SITES.find(s=>s.id==='market');
 const x=shop?.door?.[0]??-5.5,z=shop?.door?.[2]??-26.8;
 const portrait=camera.aspect<1;
 const drift=Math.sin(titleElapsed*.08)*.45;
 camera.position.set(x+(portrait?18:24)+drift,portrait?17:20,z+24);
 camera.lookAt(x-3,2.5,z-7);
 camera.updateMatrixWorld();
 // Existing scenery animation without simulation or storage side effects.
 world.update(titleReduced.matches?0:titleDt,titleElapsed,daylight(minutes),minutes);
 characters?.update(titleReduced.matches?0:titleDt);
 const actor=ensureJohansson();
 actor.root.position.set(x+2,groundHeight(x+2,z-1),z-1);
 actor.root.rotation.set(0,Math.atan2(camera.position.x-actor.root.position.x,camera.position.z-actor.root.position.z),0);
 actor.update(titleReduced.matches?0:titleDt,{speed:0,visible:true,seated:false});
 townSky.mesh.rotation.y=titleElapsed*.002;
 setTime();
 if(!titleReported)launchReport.stage('Rendering title preview');
 present(()=>townSections.render({renderer,scene,camera,town,position:{x:x+3,z:z-7}}));
 // Ready means ready: built, walkable, compiled and drawn once, so START opens play at once.
 if(!titleReported){titleReported=true;launchReport.stage('Ready to enter town');islandDrawn();}
}

function renderOutdoor(){
  if(started&&!firstFrameReported){firstFrameReported=true;launchReport.stage('Rendering first gameplay frame');}
  const audit=window.__JOHANSSON_AUDIT__?.camera;
  if(audit){camera.position.set(...audit.pos);camera.lookAt(...audit.at);camera.updateMatrixWorld();}
  present(()=>{const draw=()=>townSections.render({renderer,scene,camera,town,position:player.position});
   if(ferryExplorer?.active&&!ferryExplorer.floor?.startsWith('er-'))return withFerryInteriorView(town,world.ferry.ferry,[...world.people.map(p=>p.g),...(world.neighbours||[])],draw);
   return draw();
  });
  if(started&&firstPlayFrame&&performance.now()>=reportNextAt){reportNextAt=performance.now()+5000;const buffer=renderer.getDrawingBufferSize(new THREE.Vector2());launchReport.stage(graphics.postprocess?'Playing':'Playing · single pass',{textures:renderer.info.memory?.textures,geometries:renderer.info.memory?.geometries,programs:renderer.info.programs?.length,drawCalls:renderer.info.render?.calls,triangles:renderer.info.render?.triangles,bufferWidth:buffer.x,bufferHeight:buffer.y});}
  if(window.__JOHANSSON_STARTUP__&&!window.__JOHANSSON_STARTUP__.firstFrameMs){window.__JOHANSSON_STARTUP__.firstFrameMs=performance.now()-window.__JOHANSSON_STARTUP__.startedAt;window.__JOHANSSON_STARTUP__.stage='playing';}
}
// Open on the device's clock: a save from earlier today is fast-forwarded to now so the
// town is where it would be; anything older, or from the old fast clock, opens at now.
activities.takeAbsence();
{const setting=readClockSetting(globalThis.localStorage);
 if(setting.start==='real'){townClock.ahead=activities.state.clockAhead||0;const plan=clockCatchUp(activities.state.minutes-townClock.ahead);minutes=plan.start+townClock.ahead;advanceAbsentTown(plan.fastForward);}
 else{minutes=startingMinutes(setting,activities.state.minutes);townClock.set(minutes,setting.speed);}}
// Allow the opening frame to paint before starting any district downloads.
requestAnimationFrame(()=>requestAnimationFrame(()=>{detailsStarted=true;}));
