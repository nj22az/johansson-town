> **This repository is Johansson Town**, served at <https://nj22az.github.io/johansson-town/>. It moved here on 7 November 2026 from [`nj22az/nj22az.github.io`](https://github.com/nj22az/nj22az.github.io) (folder `johansson-town/`, `main` at `709ec8e`), so the World has its own storage; the Town's history before that is in that repository. Clone it as `johansson-town/` inside a checkout of the Office site: the Studio, the Camera and the local audit tools serve the Office site's root and expect the Town at `/johansson-town/`. Pushing to `main` publishes the Town (`docs/`, `tests/` and `output/` stay out of the site).

# Johansson World instructions

Read the repository's [AGENTS.md](../AGENTS.md) and [CLAUDE.md](../CLAUDE.md). Their working discipline applies here.

## Owner's decision — 27 November 2026: fictional brands only

The owner, asked whether the izakaya's real-brand beer should get a made-up name: "Yes, no real brand only fictional
brands that fit into the Jansson world and if you can't make up a good one just use the Johansson name as a brand".

- **No real brand anywhere in the World:** not on products, cans, bottles, signs, menus, posters, vehicles, clothes,
  machines, in dialogue, the storyteller's text or the comics. Real places (Nago, Naha) are not brands and stay.
- **Fictional brands that belong to the island:** its animals, places, people and 1990s Okinawan small-town life. Kame
  island lager, Jugon big draft and Tako black lager (the drinks machines, `commerce/vending-catalogue.js`), Sakura's
  Umineko lager, Ryukyu Cola and Blue Coral are the pattern. Where no good name comes, use the Johansson name
  (Johansson Brewery, Johansson Foods …): Johansson is this world's Acme.
- **New content is checked for real brands before it is committed;** a test keeps a list of the real brands found once
  and refuses them: `tests/no-real-brands.test.mjs` (in the CI guard) reads every string the player or the storyteller
  can meet against `data/studio/brand-rules.json`. A word that is also a street, a place, a god or a surname here is
  let through only by a written sense or an allowance with its reason, in the test.
- **The town's beer is one company's:** Johansson Brewery of Nago brews Umineko (Sakura's shelf, Minato's tap, bottle
  and can, Sato Ramen, the Coral Bay Bar, Mr Fujita's shed) and the machines' Kame, Jugon and Tako
  (`people/izakaya-beer.js MINATO_BEER`). The island's awamori is Shimakaze; its TV is Shima TV, Southwest Broadcasting,
  MinatoTV and JHK Okinawa (the public broadcaster); its paper the Minato Shimbun. The handover of this date lists every
  name replaced and why.

## Owner's decision — 27 November 2026: the animation guideline, strictly

The owner: "https://github.com/dylantarre/animation-principles use this as the guidelines for animating Johansson world
make strict adherence to it".

- **Everything that moves follows it:**
  - residents and the player, with their faces and hands;
  - props, animals, vehicles, doors and machines;
  - the camera, the comics' poses and the game's screens.
- **The guideline is kept in the repository** at the commit the owner gave: `docs/animation-principles/` (MIT, unchanged;
  see `VENDORED.md`). Do not edit it.
- **How it applies here is [docs/ANIMATION-STANDARD.md](docs/ANIMATION-STANDARD.md).** Read it, and the skills its
  section 1 names for the work, before you key, pose or code any motion. It covers:
  - which skills govern which work;
  - the town's two registers (everyday is calm and friendly, comedy is playful), with the guideline's numbers for each;
  - the twelve principles as rules, at 60 fps in the game and 30 fps in Blender;
  - how a move is made and reviewed;
  - the checks.
- **Performances are keyed pose to pose in Blender and exported** (`tools/blender/drink-can.py`, `src/avatars/motion.js`).
  Procedural moves are eased curves, never linear in time on anything alive.
- **No new move, and no change to one, may add a failure to the principles audit.** The moves that do not comply yet are
  fixed, the most-seen first. They are listed in the audit's baseline (`tests/animation-principles.baseline.json`, written
  by `node tools/animation-audit.mjs --write-baseline`; `tests/animation-principles.test.mjs` holds it): a move on it does
  not comply until it comes off it.

## Owner's decision — 27 November 2026: beer in the drinks machines, drawn in Python

The owner: "replace the generic teas and coffe we need the vending machine to sell beer and you need to use Disney art
style and draw them in Python".

- **The line-up** (`src/commerce/vending-catalogue.js VENDING_PRODUCTS`, each with `for`, `who`, `why` and `placed`): Kame
  island lager (350 ml, ¥220, Sakura's own counter price), Jugon big draft (the 500 ml long can, ¥280, for the crew off
  the last boat) and Tako black (350 ml, ¥240) took the places of Harbour Tea, Dockside and Sanpin, which stay drinkable
  from a saved bag (`RETIRED_VENDING`). J-Coffee, the shikuwasa soda, Ryukyu cola and hot corn soup stay. The beer is the
  top row; the children's sodas are the bottom row, at their height.
- **The beer is Sakura's** (it sells and supplies all the alcohol): Japan licenses nobody to sell alcohol from machines
  alone, so the machines' beer is under Sakura's licence, loaded on Minato Drinks' van at Sakura Trading's depot
  (`VENDING_BEER_STOCK`).
- **No beer from 23:00 to 05:00** (the National Tax Agency's rule since 1977, sources in `VENDING_BEER_HOURS`): the beer
  buttons read 販売中止 and the soft drinks still sell, outdoors and in the Port Terminal. Nobody under twenty buys beer
  (`vendingRefusal`, `residentVendingChoice`); a machine beer counts on the drunkenness scale as a bar's does.
- **The cans are drawn in Python** (`tools/draw-vending-cans.py`, pycairo): an original mascot each (Kame the turtle, Jugon
  the dugong, Tako the octopus), classic hand-drawn animation's appeal in the town's own designs, hand-lettered logos; no
  real brand and nobody else's characters. Change a can there and redraw; never edit the WebP by hand.

## Owner's decision — 26 November 2026: Johansson is drawn from the owner, in Blender

The owner, with his photographs: "he is supposed to look more like me"; "shift the character from cute chibi to rugged,
sturdy, manly cartoon caricature"; "Make him in blender"; "Fully rigged"; "He is not supposed to be Brown, he is a Swedish
man", "With dark features"; and of the method: "Do NOT edit blindly. After every geometry or texture pass ... render a
3-angle contact sheet (front, 3/4, side profile) with the toon shader and outlines active, inspect the PNG yourself ...
critique what still looks too soft/chibi, and iterate"; then "When happy redraw Thuan in Blender too".

- **His head is sculpted in Blender** (`tools/blender/build-johansson-head.py`), measured through every degree and a half
  into `src/avatars/sculpts/rugged-head.js`, and worn by the generator as the head form `rugged` (`head-profile.js`): the
  hair, the stubble's shell, hats and the painted face are all shaped by it, so he keeps the cartoon's full rig, every
  move and every expression. The script's `--sheet` exports him from the generator and renders the mandated sheet in
  Blender (Toon BSDF and Freestyle); `art/characters/johansson/` holds the sculpt, the rigged `.blend` and the sheets.
- **The rule stands for every character redrawn this way:** a sheet after every pass, looked at, criticised, then the next
  pass; and `node tools/avatar-turnaround.mjs` for the same in the game's own shader, which is the final judge.
- **His shirt** (the owner, 27 November 2026: "the collar is way too big going under his arms when drinking"; "He should be
  wearing a 'wife beater' tank top under his shirt"): the kariyushi's camp collar is a camp collar's size
  (`garment.js CAMP_COLLAR`; a test keeps it out of his sleeves when his arms come up or across), and under the open shirt
  he wears a white ribbed tank top (`outfit.under: 'tank'`, `garment.js UNDER`): its scoop neck and straps in the V, his
  chest hair above it.
- Fair skin, dark brows, dark eyes, a five-o'clock shadow in grey; warm, dry and deadpan, never angry. Stylised and
  heavy, not realistic: no pores, no photographic shading, no high-poly sculpt.
- **Not fat** (the owner, of the first result: "Johansson isn't fat he should have a neck and a maybe smaller face", "Make the
  head even smaller"): a small head, a neck that shows, a trim strong build.
- **Thuan** is drawn from her photograph on Disney's terms (the owner: "use Disney art design this is real life Thuan it
  should look like her but a cute cartoon"; "more feminine ... but still a cartoon don't be restricted by the avatar
  creator"; "the eyes need to fit her"; "mouth ... very expressive like Miis and eyes too"). `cast.js THUAN_REDRAWN` is
  every value that differs from her Studio design; a kite-shaped head with round doll eyes was rejected as grotesque.
- **Bodies are modular** (the owner: "these bodies needs to ve modular so we can reuse them for all characters"; "The shoes
  shouldn't be fused on their feet they should be rigged so you can wear different shoes"): one body kit sculpted in Blender
  (`tools/blender/build-body-kit.py`, `src/avatars/sculpts/body-kit.js`) gives every resident their limbs, torso line and
  feet; shoes are kit shapes worn on the foot (`avatar.wearShoes`). New shapes go in the kit, never into one character.
  What a body sits on (the back of the thigh, the hip end) keeps the old thickness: poses are made to it.
- **Thuan's figure** must read cute and feminine without a shelf or a straight in it (the owner, of a wide straight band at
  the hips: "she still has a barrel for hips ... use Disney audit"): one soft line, hips to neck.
- **Vy** is drawn from her photograph as "a gorgeous young lady with a lovable appearance", "cute like the real Vy", how
  "Disney ... or Tomodachi life" would draw her, and "shouldn't be a clone of Thuan". For her the owner said: "Disregard
  the avatar creator it's only for prototype", "Have full artistic freedom creating her": make the part she needs
  (`dewy` eyes, `bud` lips, the `softbob` hair sculpted in Blender) rather than choose from the creator's list.
- **The aim for everyone** (the owner): "remodelled in blender so they are fully rigged and look like 2d characters from a
  cartoon in 3d", "The clothes need to be rigged too", "And all hairstyles", "in a sweep but keep their personalities".
  `tools/blender/rig-cast.py` makes every resident a rigged Blender character from the generator; what is hand-made in
  Blender is listed in the handover of this date, and what is not (19 heads, 23 hairstyles, the clothes) is the work left.
- **Thao** (the owner, with her photograph: "This is Thao but cartoon Thao should wear short pants"): a long serene oval
  head and her hair tied back to a low bun, both sculpted in Blender (`build-thao-head.py`: head form `serene`, hair
  `tiedback`), the photograph's yellow tee, and **short pants**. She is her sisters' sister and nobody's copy.
- **Three people renamed, each drawn from a photograph** (the owner): "This is Mrs Higa who should be renamed to Christina
  and she should not have a wheelchair", "This is Mac who should be renamed Erik", "This is the harbour master Sverker".
  **Christina** was Gran Higa / Grandmother Higa, **Erik** was Mac, **Sverker** was Jack / the Harbour master: one name
  each now, everywhere the game shows or uses one (`src/people/roster.js`, whose ids `gran-higa`, `mac`, `jack` stay as
  machine keys and whose `was` keeps every old name resolving for saves and saved looks). Christina stands and walks:
  there is no wheelchair. Only the names and the drawings changed: their posts, homes, families, surnames, recorded
  nationalities and written biographies are as they were until the owner says otherwise. Kissa Higa keeps its name.
  Dated notes below this one keep the names they were written with.
- **A saved copy of a look does not outlive a redrawing.** A device keeps the player's look, and any resident's edited in
  the wardrobe; when a character is redrawn, raise its number in `avatars/wardrobe.js APPEARANCE_REVISIONS` so the new
  drawing is adopted once (the owner's phone went on showing the Johansson it had saved: "Johansson's face??").
- **Look at every character from the game's own camera** (`avatar-turnaround.mjs` views `game`, `game front`) as well as at
  eye level, and in the looks that draw from the normals (`--look vy`): the owner sees them from above, on a phone
  ("Why does Vy have lines on her legs no one should have it in any shader").
- **A character is drawn in Blender, all of it** (the owner, repeatedly; of the first Christina, Erik and Sverker, which had
  plain round heads and eyes chosen from the avatar creator's list: "Christina needs to look like an adorable elderly woman
  not like a man, redraw all their heads they need to be drawn in Blender", "Then after their bodies and feet", "Their eyes
  too no need avatar creator eyes draw the characters in blender I have said it many times", "Omg they have mitten hands").
  For anybody redrawn that means, with nothing taken from the creator's lists where a part of their own is wanted:
  the **head** with its features in the mesh (cheeks, nose, brow, jaw, a beard's mass); the **hair**; the **eyes** (`EYE`
  in the character's `build-<name>-head.py`: drawn on the sculpt as curves, kept in the `.blend`, written with the head and
  drawn by the game's rigged eyes and by the painter: recipe `eyes.style:'drawn'`); the **body** (a frame of the kit's:
  `standard`, `sturdy`, `graceful`, `stout`, `soft`); the **feet and shoes** (kit shapes; `court` and `broad` are fitted by
  frame); and the **hands**: "make them Disney quality" (two modelled hands were rejected: a balloon with sausages, then a
  stiff anatomical one). The body kit's hand (`tools/blender/hand_model.py`: box-modelled, smoothed by subdivision, with a
  closed grip of the same points) is worn by everybody in place of the mitten, on the branch `hands/kit`, not yet seen worn
  by the owner. Every pose that lays a hand on something reads its contact shape, measured from the kit (`build.js HAND`:
  the reach solver's envelope, how far a laid hand lies off what it rests on, the palm's way), and turns the palm to it;
  fists, a grab and what is held close it (`avatar.grip`). Never retune a pose to a hand by eye: change the kit and the
  numbers follow.
  Drinking a can is animated in Blender and played in the game (the owner, 27 November 2026: "You need to animate the beer
  drinking in blender and bring it to the game after"; branch `drink/can`): `tools/blender/drink-can.py` rigs the game's
  skeleton, keys the performance, bakes and writes `src/avatars/motions/drink-can.js` (johansson-motion v2); the game plays
  it (`src/avatars/drink-can.js`) and only puts the contacts right on other bodies. Change the drink there, re-export, never
  hand-edit the motion; `tests/drink-can.test.mjs` holds it (contacts, wrists, no pops).
  A woman must read as a woman at a glance: lashes, lips, hair that is hers, shoulders and a neck that are not a man's.
- The owner's photographs are not kept in the repository (it is public).

## Owner's decision — 25 November 2026: the cast are dolls wearing clothes

The owner, in order: "the feet are ugly elbows and shoulders I see only the faces are so so Thuận looks best"; "Esthetically
we should aim for something that would work in a Nintendo game"; "they should be dolls wearing clothes, not dolls wearing
paint"; "Follow Disney animation principles"; "Make them feel beautiful, low cortisol, I am thinking you need to use
blender to fine tune them"; "Give them personality and still look like flat 2d cartoons but really 3d".

- **Clothes are garments on a body, never colour on the body:** each has its own edge (hem, cuff, neckline), its
  thickness and its inside, standing clear of the doll. Started in `src/avatars/build.js` (`sleeveTube`, the T-shirt and
  polo hem and the T-shirt's neck rib); every other top, the trousers, shorts and skirts' waists are still to follow.
- **The bar:** clean, round, friendly and calm ("low cortisol"): soft shapes, quiet colour, nothing jagged or noisy;
  original characters that would not look out of place in a Nintendo game, never copies of anybody's.
- **Flat 2D cartoon that is really 3D:** flat cel bands and an even ink line (Kikkou), no photographic shading on people.
- **Motion and design follow Disney's twelve principles** (appeal and solid drawing for the design; squash and stretch,
  anticipation, follow-through, arcs and the rest for every move). The site's ANIMATION_DIRECTION.md stands beside this.
- **Personality:** each resident's face, posture and habits should say who they are (their recipe's profile dials exist).
- **Blender** is the owner's suggested tool for fine tuning (`bpy` 5.3 runs in a cloud session from pip: see the
  handover of this date). The creator must still be what makes a character.

## Owner's decision — 25 November 2026: the web game stands alone

The owner: "I want the web game to be standalone it's new rules, it should be just as fun or even more fun than the Linux
game"; before it, "make npc interactions more interesting, I want it to feel like they live in this cartoon island" and
"more lived in like a gta, shenmue, yakuza small island".

- **This supersedes the 19 October ruling that the web is "a gorgeous demo for the Linux game"** with "simple behaviour"
  and "not too much dialogue" (the section of that date below is history where it says the web simulates less by design).
  The web edition's budgets (`src/edition.js`) are raised stage by stage, each tested in the web edition before the next.
- **Stage 1, done:** `conversations` and `pouring` are on for the web: the full conversations (topics, favours, gifts, the
  day's happenings) and Thao's pour.
- **Still to come:** `trade`, `machinery`, `countedMoney`, `liveDocuments` (web saves carry the 999,999 yen purse: decide
  what a counted wallet starts with), and residents' life beyond `residentRadius` if phones keep their frame rate.
- Performance is the limit, not a design choice: measure before widening what far-away residents do.

## Owner's decision — 25 November 2026: cartoon cast online, Kikkou ink for the World

The owner: "I just know I want the kikkou style for Johansson World and I want to simplify the characters there again the
blender avatars are better for Godot and Sakura world, the online game should use these cartoony characters even
Johansson and Thuan".

- **The online World draws every resident as the cartoon (the Shimanchu built by `src/avatars/build.js`), Johansson and
  Thuan included.** `src/boot.js` no longer loads the Blender (Pixar) bodies; `?pixar=1`, or `?pixar=thuan,johansson`,
  still loads them on a page to compare. The bodies, their files and `src/avatars/pixar.js` stay: they belong to the
  Godot and Sakura world (and Studio, which loads its own). Do not make them the web default again without the owner.
- **The World's look is to be the Kikkou style** (studied from kuraneko1.github.io/blahaj-kikkou-3d): an even ink line
  wherever one object meets another, found from an object-ID buffer rather than an inverted hull or depth alone, over
  the cel bands. To be built in `src/render/ink-pipeline.js` and measured on a phone before it becomes the default.
  The test pages that settled it are recorded in [the handover](briefs/HANDOFF-CARTOON-CAST-KIKKOU-2026-11-25.md).

## Owner's decision — 31 October 2026: facilities before population

The owner: “remove the ice cream family now there are too much unimportant people on the island we need to build facilities before we populate them”.

- Retire exactly Emi Nakamura (`emi`, live name Mrs Nakamura) and Mai Nakamura (`mai`, live name Mai) from active island life, schedules, households and resident-facing choices. Preserve their historical recipes/assets for existing creative work and migrate old saves through the retired-identity registry.
- Keep the Nakamura dessert counter and Blue Coral facilities. They are vacant and closed until staffed by a later owner decision; do not assign another resident merely to fill the vacancy or serve purchases through an absent keeper. The former home is no longer a resident address.
- Pause Emi's community-kitchen programme while retaining the town hall, register and clinic. Remove present-day claims that Emi or Mai works, studies or lives on the island; do not invent replacement friendships or staff.
- Build and validate facilities before adding residents. This decision supersedes older active cast/household totals and the Nakamura family's staffing in the 19 October consolidation.

See [the room-crash and family-retirement handover](briefs/HANDOFF-ROOM-CRASH-FAMILY-2026-10-31.md) for implementation, migration and verification.

## Owner's decision — 26 October 2026: the device calendar

The owner: "they use normal date device date, they only live like it’s the 90’s".
The gameplay calendar follows the device's actual local date, year and weekday. Do not project dates into 1997 or
discard leap days. The 1990s remain the setting, culture, technology and visual direction. Shop rotas, school,
clinic hours, residents and weekly happenings share `src/town-clock.js`; the title board prints the same real date.
Retain saved civil-minute values and the existing optional set/faster clock. Thuan's weekend plan must govern her
actual absence from Minato and Monday ferry return, as well as the timetable text.
See [the device-calendar handover](briefs/HANDOFF-DEVICE-CALENDAR-2026-10-26.md).

## Owner's current decisions — 18 October 2026

- Keep Minato a compact urban port town. Do not restore rural districts or expand its shoreline for housing.
- Every ordinary Minato villager needs an actual occupied home, with a reachable entrance, usable interior, sleeping place and credible work/home routine. A registry label alone is insufficient.
- Do not retain surplus empty houses or speculative residential units. Assign existing suitable homes first, then remove genuinely redundant residential buildings and their obsolete geometry/navigation references.
- Preserve working shops, port access, ferry operations, Harbour Park and Umi-no-yu. Do not remove an active workplace merely because an upper floor is vacant.
- Johansson is the ship's chief engineer. His main home is with Thuan on the separate tropical island; he also has a cabin aboard the ship. Older mayor descriptions are stale canon.
- ~~Thuan shares that tropical primary home and keeps a room in Thao and Chin's Minato house.~~ Superseded on 19 October 2026 (the consolidation's ruling 4, below): her weekday room is dropped; she lives with Nils on Kitano-jima. Do not create a separate empty house for her.
- Sakura's upper floor is to become the main office with a kitchenette and views over the port and town, not a home. The tiny existing ground-floor office remains complementary. ~~Grandmother Sakurai therefore needs a suitable home elsewhere on Minato.~~ Superseded on 19 October 2026: Grandmother Sakurai retires and Thuan owns Sakura outright (the consolidation, below).
- Keep the tropical island's terrain and facilities intact. Housing work on Minato must not rebuild that separate island.
- ~~Retain iPhone Safari resource safeguards.~~ Superseded on 19 October 2026, below.

## Owner's decisions — 19 October 2026

- Graphics: every device draws the standard of before 18 October 2026 (the owner: "pre October 18 standard graphics is what we are looking for"; "I don't need iPhone safeguards I need the code to be optimised so it still looks good"). Desktop, tablet and phone differ only in drawing resolution and shadow detail (`src/render/startup-recovery.js` `graphicsProfile`). Do not reintroduce device classes that drop shadows, multisampling, HDR, detail streaming or varied openings; keep memory down by optimising what is drawn and kept instead (for example `src/render/canvas-release.js`, the ferry's engine-room plates drawn only aboard).
- Reduced graphics is a recovery mode only after two interrupted launches in a row, and the game says so and offers the full look back.
- Where empty houses were removed, the street plan closes up around them: no vacant lawn or paving lots left where buildings stood.
- New Yokosuka (<https://github.com/brynnb/new-yokosuka>) is a permanent inspiration for the World: "here you can see home interiors and convenience stores and everything we need"; its 1986 setting does not matter, "small town Japan still has much old parts in the 90s and even today". Plan homes, shops, streets and the harbour from its real rooms, measured and recorded as data; never copy its assets ([docs/research/new-yokosuka.md](docs/research/new-yokosuka.md)).
- **Sakura keeps its upper floor** (the owner, 24 October 2026: "I'm starting to like the top floor office on Sakura, abort removing it"). Do not remove the upstairs office/rest room; the single-storey Sakura on `development` (#378/#384/#385) is not to reach `main` as a removal.
- Sakura's upstairs is replanned (the owner: "The Sakura office is way too big and empty. I want maybe two windows you can look out from; now the whole island looks broken from the Sakura office. It should have like a bedroom or rest room upstairs too. Can you use anything from New Yokosuka?"). Read with the ruling above that the upper floor is the main office, not a home: the office shrinks to a small shop's office with its kitchenette and exactly two outlooks (Main Street from the front, the ferry berth from the desk's side window), and the rest room is a staff 休憩室/仮眠室, a 4½-mat tatami room with a futon in its cupboard for a rest between the shop and the late boat, or a night if the ferry ever cannot run; nobody lives there, and no canonical day sleeps there while the town does not stop for weather (`world/typhoons.js`). The plan, sizes and the New Yokosuka numbers it uses are data in `src/world/interiors/sakura-office-room.js` (`SAKURA_UPSTAIRS`); the island seen through the windows is drawn by every portal in view at once (`render/shop-street-view.js`).
- Sakura's stair and the office's doors, 20 October 2026 (the owner, on his iPhone: "I don't want the stairs to be traversable it's too much errors when running up the stairs, I want the stairs to lead up to a black hole and we disappear into there and when it loads we come up on the upper floor. And more the entry to the upper office is only from inside not from outside now I have a button to enter the office when I'm outside Sakura, that's wrong. I guess it should be possible to evacuate through the fire ladder but that door only open from the inside"). The inside stair is a passage into darkness, never walked: from the stockroom its first treads rise into black, stepping onto them (or "Go upstairs") walks him into the dark while the picture fades, and the office storey opens as a room of its own at the stair head; coming down is the same and he arrives at the stair's foot in the stockroom (`src/world/interiors/sakura-stairs.js` `SAKURA_STAIR_PASSAGE`, game.js `takeSakuraStair`). Two rooms, the shop and the office; no flight, landing, landing lens or storey switching. The office is entered only from inside, up that stair: its site is `insideOnly` (`thuan-flat.js`) and has no door, button, pin, directory card or route outside. The fire door opens from inside only: "Evacuate by the fire escape" takes him out onto the landing and down the caged ladder to the yard; from the yard the fire escape is to look at, nothing more (`okinawa/old-town.js` `SAKURA_BACK`). Rooms are scanned for flashing faces at a phone's size (`tests/no-z-fighting.test.mjs`).

~~The implementation plan is [docs/MINATO-HOMES-PLAN.md](docs/MINATO-HOMES-PLAN.md).~~ Superseded on 19 October 2026 by the cast, household and crew consolidation below; the homes plan remains as dependency evidence only. Preserve save compatibility when implementing it.

## Owner's rulings — 19 October 2026: the cast, household and crew consolidation

The plan of record is [docs/CAST-CONSOLIDATION.md](docs/CAST-CONSOLIDATION.md), the owner's brief with its addendum; where the two differ, the addendum wins, and both win over every older character, ownership and housing description here and in `docs/`. Its data is `src/people/roster.js` (mirrored in `docs/cast-roster.json`): 21 core and 5 supporting identities with stable ids, short display names and historical aliases, the ten retired identities and where their purpose goes, the 14 core households, the eight ship posts and the shore roles. It is run as five PRs (the brief, "How it is run"); phase 1 (roster data, aliases and the save migration, `src/save.js migrateCast`) changes nothing visible, and each later phase switches one part of the game over to the roster.

In brief: Thuan owns and runs Sakura outright; Chin is the motorman aboard and Tetsu's repairman ashore, never Sakura staff; Fujita becomes the ferry master, shown as Fuji, sober on watch, the shed and the beer only after he signs off; Nils is chief engineer, not mayor, at home with Thuan on Kitano-jima with a duty cabin aboard; Jack Reed (harbour agent) and Mac Turner (relief engineer) replace the Harbour master and Mr Nakandakari as American long-term residents; ten identities retire (the Bus driver, Mr Higa Jr, Grandmother Sakurai, Grandmother Chinen, Postman Tōma, Mr Shimabukuro, Mr Ōshiro, Mrs Kinjō, Barfly, Reiko) and six more Minato houses go.

The owner's rulings of later that day (the brief's addendum), which win:

1. **Police station.** Mori does not stay in the kōban. A real police station (交番/警察署 on the signs, English in speech) is built on the empty lot next to it, enterable like the shops (front desk, waiting bench, lost-and-found, notice board, holding room, bicycle rack, patrol-car bay); Mori's accommodation moves inside it. The household count stays 14 and the home id `koban` is retained as his logical identity. The station is a separate job after the consolidation, which must not build on that lot.
2. **Kitahama lots.** The street-dressing pass skips the Kitahama lots; the compaction decides the plan, and the dressing (gardens, 月極 parking, bike sheds, hedges) follows on the final layout.
3. **Trade rules.** Retiring Mrs Kinjō moves flowers to Sakura: change the "Rainflower Florist supplies decorations" line in the repo CLAUDE.md and `src/commerce/merchandising.js` with it, and remove the florist pavilion. Remove the former post-office shop-house once Mika's counter has the parcels (if inspection finds a shared or non-residential dependency, name it and make the smallest complete service-preserving change).
4. **Thuan's weekday room at 1 Kitahama is dropped.** She and Nils live on Kitano-jima and the ferry runs 06:25–22:15. kitahama-1 is purely Thao, Chin and Vy.
5. **kitano-3** (the dead Chinen house) is removed in this job, not reported as a candidate.
6. **Kitahama Heights** becomes two attached ground-floor houses with their own doors and gardens (no corridor, no stair), keeping the `kitahama-flat-3` / `kitahama-flat-4` ids for migration.

Reconciled with the source on 19 October 2026 (`src/people/roster.js` records each): Yui, Aya and Nao, three of the brief's display names, are the sisters' names in the oldest saves (`src/people/renamed.js`), so those renames apply only to saves from before the roster (castRevision 1) and the names now belong to the teacher, the purser and the bosun; the manning plan's post key stays `oiler` with the title Motorman and a `motorman` alias; Jack takes both the Harbour master's shore keys and Mr Fujita's Minato linesman duty.

Phase 2 (the ship posts and shore roles) is in: `src/people/ferry-crew.js` reads every post and shore role from the roster; the five supporting crew are people of `cast.js` (`supporting`) with recipes of their own, the cabins aboard and Kai's rented Shiroma house registered as quarters, never households (`island-households.js` CORE_HOUSEHOLDS / SUPPORTING_QUARTERS); the crew's day is the ship's, 06:05–22:20 (`FERRY_WORKING_DAY`); Mr Fujita is the master, the shed's own body walked to and from the gangway (`master-commute.js`), the shed and the beer only after he signs off (`fujita-day.js`); the harbour agent's street body takes the Minato lines (`ferry-shore-crew.js`, `shore-duty.js`); Chin is the motorman with no Sakura shift; Mac is renamed in the live cast with his biography. The short display names Fuji, Jack, Nao and Koji (and the rest) are phase 5's sweep: `castMember` resolves both names meanwhile. The crew cabin is drawn with one two-tier bunk (the bosun's week-on berth and the relief engineer's), so the purser's and the cook's berths are the docks-and-boats job's.

Phase 3 (the households) is in: Nhung lives at 3 Kitahama with Kōji and Riku (`kitahama-layout.js` KITAHAMA_RESIDENT_HOMES, her room `households.js`, the family house `interiors/family-home.js` with three futons); Thuan's weekday room is gone and she lives on Kitano-jima only, over on the 08:30 boat and home on the 22:00 one (`kitano-residents.js`, `commuter-schedule.js`), Nhung keeping Sakura at the weekend; Kitahama Heights is two attached ground-floor houses, A (Mac, id `kitahama-flat-3`) and B (Ms Ganaha, id `kitahama-flat-4`), each with its own gate, door and garden on Fukugi Lane and no stair (`kitahama-layout.js` KITAHAMA_HEIGHTS, `okinawa/kitahama-quarter.js`), the logical units `kitahama-flat-1`/`-2` retired in the registry with Mr Higa Jr and Grandmother Sakurai resolving to the roster's fallback (`home-directory.js`) until phase 4 takes their bodies; Thuan owns and runs Sakura outright and the shop keeps honest hours, 9:00–20:30 every day with nobody at night (`commerce/sakura-rota.js`, superseding the 24-hour opening of 12 October that the retired night keeper made possible); Sakura supplies the town's flowers and decorations and sells the bouquets at its door (`merchandising.js`, `okinawa/old-town.js`), the Rainflower pavilion selling nothing until phase 4 removes it; the post and parcel counter is Ms Ganaha's window at the Port Terminal (`ganaha.js`, `interiors/port-hall.js`), the old post office counter shut until phase 4 removes the shop-house, Tōma's round running from the terminal meanwhile.

Phase 4 (the retirements and removals) is in: the ten retired identities (roster.js RETIRED: the Bus driver, Mr Higa Jr,
Grandmother Sakurai, Grandmother Chinen, Postman Tōma, Mr Shimabukuro, Mr Ōshiro, Mrs Kinjō, Barfly and Reiko) are out of
`people/cast.js`, so they have no body in the street, the shops, the izakaya or aboard, no household, shift, nameplate,
home pin, place or relationship pair, and the save migration (`save.js`, castRevision 2) drops their records and lands a
save made inside a removed building at the retained place (`roster.js RETIRED_HOMES`, `households.js HOME_ALIASES`).
What they did went where the roster says: Kōji fishes his own sabani and Chin mends the boats, Tetsuo keeps the power
house's switchboard, Nhung prints the town's small paper at the bookshop's back bench, the izakaya's regulars are the
residents (nobody lives in the bar; Thao cleans after last orders), the post round is the terminal's mailbag, the
harbour master's favour is Mrs Sato's delivery box (both ends must walk the town), and the stories' catalogue leaves the
retired out (`feed/storyteller.js living`). Removed, with their foundations, walls, gates, nameplates, drops, lights,
prompts, interiors and directory and map entries: 4, 5 and 6 Kitahama, the Kinjō and Ōshiro houses on the seawall walk,
1 Front-Row Yard, the post-office shop-house on the East Row, the Rainflower pavilion (the bouquets are at Sakura's door,
`okinawa/old-town.js SAKURA_FLOWER_STAND`; a saved photo or destination at the old id lands there) and the Chinen house on
Kitano-jima (the island's ground and plantings take the plot back). The registry keeps each as a record of a removal
(`island-households.js`, `retired`), distinct from the housing project's nine of 18 October. The streets closed up where
they could without touching the Kitahama lots (ruling 2) or the police lot (ruling 1): the two Kitahama side lanes north
of the cross lane that served only 4 and 5 end at the cross lane (`kitahama-layout.js`), the East Row's apron is paved
per standing shop so the park's lawn meets Main Street where the shop-house stood, the Nishi lanes stay (the Higa house's
side, the way to 2 Front-Row Yard, the utaki's approach), and every cleared lot is recorded with its ground and the reason
it is clear in `okinawa/lots.js CLEARED_LOTS` for the deferred dressing pass. Two walkers who meet face to face now step
round one at a time (`schedules.js`): the changed timing had Thuan and Tetsuo mirroring each other's detour on the kerb.

Phase 5 (the stories, directories, maps and docs; the last) is in, and the consolidation is complete: the report is
[docs/CAST-CONSOLIDATION-REPORT.md](docs/CAST-CONSOLIDATION-REPORT.md) (the 26, the old-name map, the 14 households and
the quarters, the removals, the watches and the hours, the save notes, the test results and what is unresolved). The
resident guide (`guide/residents.json`, from `guide/articles.mjs`) is exactly the 26 live residents, each with a feature,
a photo shoot and a portrait rendered from the live avatars (the eleven who had none: Dr Kakazu, Mai, Mac, Ms Uezu,
Ms Ganaha, Mr Fujita, Ryo, Ren, Aya, Jun, Kai), the retired eight's features kept as history (`RETIRED_ARTICLES`); the
storyteller's catalogue is that guide, so every story role fits the roster's posts (Fuji on the bridge, Chin in the
engine room, Nhung at the paper's bench, Ms Ganaha's window, Mac the relief, Thuan owning Sakura), and every one of the
26 is a regular somewhere (`feed/places.js`). The police station (`koban`) and the terminal counter are storyteller
places, wired with `captured:false` until their backdrops are photographed (`node tools/render-feed-backdrops.mjs
police-station port-hall`; it runs in a cloud session since 21 October 2026, see Verification), and the storyteller
sets no story in a place without its pictures. The ten retired keep their drawings, walks and costumes for Studio and
history only (`avatars/cast.js RETIRED_RECIPES`, `gait.js RETIRED_GAITS`, `dungeon/costumes.js RETIRED_COSTUMES`,
`tests/retired-recipes.test.mjs`); Studio's lists name the 26 by the names World uses, the crew as a group (Mac,
Ms Ganaha). The brief's short display names (Fuji, Jack, Nao, Koji, Mika, Yui, Tetsu, Aki, Dr Ken, Emi, Nils) are the
roster's and resolve everywhere through `castMember`; the names the world, its saves, drawings and prompts use stay
`cast.js`'s (Mr Fujita, Harbour master, Ms Uezu, Kōji, Ms Ganaha, Miss Higa, Tetsuo, Mrs Sato, Dr Kakazu, Mrs Nakamura,
Johansson), a rename being a sweep of its own (the portraits, the wardrobe keys and some three hundred tests key on
them). Sakura's products are for the living (`data/studio/products.json`), the wardrobe's and outfits' "who wears it"
lines too, and the docs that describe the cast of before the consolidation carry a history banner.

## Owner's decision — 19 October 2026: the web is a gorgeous demo for the Linux game

The owner: "It looks really pretty but slow to load and stalling while I play. Can some parts be offloaded on web while
still looking pretty as now? I'm thinking expensive NPC behaviour maybe belongs in the Linux version; the web should be a
gorgeous demo for the Linux game." The rule lives in one place, `src/edition.js`: the Linux edition (`steam-deck/`, the
Electron shell, `window.johanssonDesktop` set) runs everything; the web edition draws exactly what Linux draws (the
graphics ruling above stands: shadows, multisampling, HDR, detail streaming, the Ink grade on every device) and simulates
less, by the named budgets there. Nothing else asks which edition it is. Later rulings the same day, all part of it:

- **Residents** (the owner: "I think you can program some simple behaviour for the NPCs on web while still, and not too
  much dialogue"). On the web a resident near the player (within `residentRadius`) or in view walks and behaves as on
  Linux; out of sight and out of reach they keep their timetable without walking it (`people/attention.js`,
  `schedules.js` settle, `neighbours.js`): no route searched, no step taken, so nobody is ever seen to jump. No chats
  between residents (superseded for nearby ambient exchanges on 25 October below), no happenings chains, no multi-line player conversations. Stand points (`full-life.js setStandFilter`) are
  kept for residents in view, near or in the player's room; a seen resident whose detour finds no way round waits half a
  town minute before searching again (`detourRetryMinutes`): talking to a resident is one short line for the
  moment (`greetings.js shortGreeting`, at most 35 characters) and whatever they sell or serve. The full conversations,
  favours, chats and happenings are Linux's.
- **Trade and machinery** (the owner: "the convoluted business backend doesn't need to work on the web either … even if
  we model the houses and engine room and workshop realistically, they will be like a display piece on the web"). Rooms
  and machines are built and drawn as on Linux; on the web their operation prompts read what the thing is instead of
  working it (the ferry's plant stations, the town's machines, the workshop printer), and no orders, deliveries,
  closing restocks or stock counts run.
- **Unlimited money on the web**: the wallet never runs out (`WEB_PURSE`, shown as "plenty of yen"); prices stay on the
  labels and are paid at the till.
- **The shop's magical supply** (the owner: "it can be back next day: if you buy all the coffee in one day, they will
  have more tomorrow"): what the player takes stays gone for the rest of that trading day, in the save, and every shelf
  is full again at the next opening, 9:00 (`shop-stock.js webShelves`). Other customers do not empty facings.
- **Realistic paperwork** (the owner: "I'd like the documents and spreadsheets to be realistic"): on the web Sakura's
  office folder is a deterministic snapshot made from the data, as a 1997 Okinawan shop wrote it: the Z report, the stock
  book, the rota, the depot's delivery note, Higa Liquor's and Front-Row's invoices, every total the sum of its lines
  (`commerce/paperwork.js`, `tests/paperwork.test.mjs`). On Linux the ledger is the live shop's.
- Outside a page (node's suites) the edition is Linux unless `JOHANSSON_EDITION=web`; `tests/edition.test.mjs` holds
  the web budgets and the Linux path.
- **Playing as any resident and making faces come to the web** (the owner, 24 October 2026, asked whether "play any
  character", posing and emotions could be brought to the web: "Both"). Town book → People has *Play as* on every
  playable resident's card (`desktop/life.js`, the same possession Linux uses); the web runs it only while you play
  someone other than Johansson (`playingResident()` in `game.js`), so Johansson's web opening, house and view are
  unchanged. Moves → *Make a face* offers every face the painter knows, held for ten seconds. Conversations stay the web's
  short lines; the insult and apology choices stay Linux's.

## Owner's decision — 25 October 2026: restore residents' social behaviour on the web

The owner: "can you bring back npc behaviours? That they talk and interact with each other in a realistic way".
This supersedes the browser ban on chats between residents: `BUDGETS.web.neighbourChats` is on. The existing
personality/relationship exchanges run one pair at a time within 14 m of the observer, at ordinary conversational
distance, with alternating speakers, facing and gestures, a reading pause, a cooldown and release back to the day's
routine. Written dialogue works without a language model. Vehicles, ship duties, service, shopping, sleeping,
authored activities and the player-controlled resident take priority. No social simulation during time catch-up.
Far-away timetable limits, player conversation limits, trade and machinery budgets stay as before.

## Owner's decision — 21 October 2026: no way in without a working interior

The owner, on his iPhone outside Nakamura Zenzai: "There is a bug when I go outside the ice cream shop it says enter their
home and then I get stuck in the staircase, any place without a fully functional interior shouldn't have a button to
enter"; and the same day: "Also the railing by the ships at the dock you can get stuck when spawning there".

- An enter, visit or go-in prompt (and the Enter button at a door) exists only where it leads to a fully functional
  interior: the room builds; he arrives on walkable floor clear of solids (in first person, and after the step inside
  the third-person camera takes, `src/world/room-arrival.js`); he can move, over every storey of a room of more than one;
  and the Exit button puts him on walkable street ground with room to move. A place without one gets no enter prompt;
  its look and read prompts stay.
- The same holds for every place the game starts him or puts him outdoors: the openings (`world/openings.js`), the ferry
  landings (`world/airport-ferry.js`), the quick crossing and Kitano-jima's arrivals stand him on level, walkable ground,
  clear of solids, the ferry's gangway and rails and her hull while she is alongside, with room to move a metre two ways
  and a way on foot to the street.
- `tests/enterable-sites.test.mjs` walks every prompt that enters somewhere, every door of the Enter button and every
  room entered only from inside, and every arrival point, and lists each failure with its way in and its reason. A new
  door or spawn must pass it.

## Owner's decision — 21 October 2026: one ground system

The owner, on his phone: "the roads seems to have reversed to chaos again… Can you make a plan to finally fix the roads
to a unified system? Pavement? Walk paths, grass and sandy beach?" (the plan approved: "Go ahead").

- Ground: every surface comes from `src/world/ground-standard.js`. No module draws its own ground slab, colour or
  height. The rulebook gives each class its top, colour, finish, the districts it belongs in and the edge it needs
  against every neighbour: a 15 cm kerb, an edge line and U-gutter, stone or coral edging, or a graded join.
- The ground-standard test (`tests/ground-standard.test.mjs`, measured by `tools/ground-audit.mjs`) guards all of
  Minato. Since step 4 its baseline (`tests/fixtures/ground-baseline.json`) is empty: any violation fails. Fix the ground;
  never list a finding. If a finding is a false positive, change the audit's rule with its reason written beside it.
- A district on the standard is laid by the generator (`src/world/ground-build.js`) from its plan (`ground-plan.js`,
  `ground-plan-harbour.js`): add or move ground by changing the plan, never with a slab of a module's own. Step 2 put Main
  Street and the harbour on it. Main Street's carriageway lies a kerb under the town's datum and is graded back at its
  ends; what stands on the road or at its ends takes its height from the plan (`streetDrop`, `groundTopAt`). Step 3 put
  Kitahama, Nishi-machi, the west yard and the town hall on it (`ground-plan-quarters.js`). In a lane district a house
  meets the lane by its own gate and the U-gutter (`lane-edges.js` draws the plan's gutter runs), never by a paved
  ring. In the west yard the buildings stand on concrete aprons edged against the lawn. Step 4 put the rest on it:
  the walks across the lawns (Harbour Park's, the east lawn's, Kitahama's coastal walk, Kitano Road's footway) are laid
  from `ground-plan-coast.js` by `ground-paths.js`, flush and edged in setts; the lane builder (`lane-surfaces.js`) lays
  nothing. No building has a ring of paving: it stands in its lawn or sand, with an apron or forecourt only where it is
  used (Umi-no-yu's forecourt, the fuel depot's court, the drinks corner's pad). The east beach (`beach-layout.js`,
  drawn by `east-lawn.js`) is coral-white sand with a wet band at the water, graded up to every firm edge
  (`BEACH_GRADES`) and down into the sea; north of the oil jetty the east quay ends at x 42.3 and the beach runs to the
  water (owner-approved).
- The plan, the rulebook tables and today's counts are in [docs/GROUND-STANDARD.md](docs/GROUND-STANDARD.md). The work
  ran in steps, each merged after the owner saw photos: (2) Main Street and the harbour; (3) Kitahama, Nishi, the
  neighbourhood and the school; (4) the beach, the coast, the park and the lawns, which emptied the baseline.

## Owner's decision — 21 October 2026: Higa Liquor and the coin laundry, kept by the cast

The owner, on his phone: "I see the liquor store looks abhorrent too, and the laundromat how can we bring them more life
and interactivity and who should work in the liquor store do we have enough people" (the plan approved: "Yes go on").
No new people; everything below is data first (`src/commerce/higa-liquor.js`, `src/commerce/coin-laundry.js`,
`src/people/shop-days.js`), the buildings dressed from it (`src/world/okinawa/higa-liquor-dressing.js`,
`coin-laundry-dressing.js`).

- **Higa Liquor's staff.** Grandmother Higa keeps the counter 09:00–12:00 and 17:00–20:00, round the Umi-no-yu bandai
  (13:00–17:00); between the openings the doors are shut and a hand-written 留守 · 5時に戻ります card hangs on the door
  ("Out. Back at five."); the shutter is down from 20:00 to 09:00. Yui (Miss Higa) minds the counter on Saturdays; that
  day her grandmother keeps the morning for the garden and stays on at the bandai until 20:00, and Yui takes the bandai
  from 20:00.
- **Higa Liquor's deliveries.** Kōji drives the shop's round in his white kei truck on his weeks ashore, paid by the round
  (¥1,500): Tuesdays and Fridays Minato, Sato Ramen and the Coral Bay Bar's ice boxes up the ferry's ramp; Saturdays
  Sakura; from 10:30, between the ice plant and his sleep. His weeks aboard as the bosun's relief are unchanged: then
  the customers collect (Thao in Minato's truck, Thuan with Sakura's trolley). Mr Fujita's six o'clock crate at the pier
  root stays a standing order of its own.
- **The yuntaku bench.** A bench and two beer-crate stools in front of the shop, sat on in the evening opening by the
  men whose days allow it: Tetsuo (18:30–20:00, between the bath boiler's checks) and Mac (19:30–20:00, before his one
  beer at Minato). Mr Fujita's crate stays empty: he is sober on the bridge until 22:20 (the consolidation's ruling).
- **The coin laundry's keeper** is Ms Ganaha, who lives nearest with a free morning (Kitahama Heights B): her round
  08:00–09:30, before the mailbag, sweeping, clearing the filters, emptying the coin boxes and pinning the notices.
  Officer Mori, as near, may not keep a business and sleeps after the night patrol; Tetsuo, as near, has no free hour,
  and mends the machines when asked. The laundry is open 24 hours; Thao washes the family's futon covers on Sundays
  14:15–15:45, Ms Uezu brings the crew cabin's linen ashore on the first day of her week off, Nhung (the doctor since 22 October)
  washes the clinic's towels and coats on Wednesday nights; its noticeboard carries the street's story hooks (the missing cat, the found sandal, the lessons)
  and the town calendar's week.

## Owner's decision — 22 October 2026: Nhung is the island doctor

The owner, after the audit of the two Dr Kakazus: "use the best looking one", then "Can they be consolidated into other
characters? Have this female doctor replace Nhung". Their answers to the follow-up questions settle the rest:

- **Nhung is the island doctor.** She keeps her name, age, family (Kōji, Riku, her sisters) and home at 3 Kitahama, and
  takes the clinic doctor's look (`avatars/cast.js` Nhung: white coat over a sage shirt, half-rim glasses, hair tied
  back, white shoes; her bookseller's look is `FORMER_NHUNG_RECIPE`, history only). The clinic room draws her at her desk
  (`interiors/town-hall.js`, `DOCTOR`/`DOCTOR_TITLE` "Dr Nhung"); her walking body stays indoors there in surgery hours
  (`workplaces.js` OWN_STAFF_ROOMS), so there is never a second one.
- **Dr Ken Kakazu is retired** into her (`roster.js` RETIRED `dr-ken`, name `Dr Kakazu`): his patients, pairs, laundry
  evening, parking bay and the doctor's bag are Nhung's; his flat behind the clinic is retired (no door). RETIRED_HOMES lands
  `clinic` on itself, because the id also names the clinic, which stays. His drawing and article are history
  (`RETIRED_RECIPES`, `guide/articles.mjs` RETIRED_ARTICLES).
- **Her week** (`people/clinic-hours.js`): surgery Monday to Friday 9–12 and 14–17, Saturday 9–12; the town's paper in
  the evenings at the back bench of the old Front-Row shop (place `paper`, indoors); Saturday afternoon is her own;
  Sunday she keeps Sakura.
- **Front-Row's trade is Sakura's**: the books and the stationery and office supplies (`merchandising.js` SUPPLIERS.sakura
  `stationery`, the accounts' `stationery` lines); the shop floor is unstaffed, the reading copies stay, the last
  second-hand books and the paper go by the honesty tin, and nobody browses there (`bookshop-visits.js`).
- **Sakura shuts on Saturdays** (土曜定休; `sakura-rota.js` sakuraClosedDay): Thuan's weekend on Kitano-jima is unchanged,
  Nhung keeps Sunday, and Higa Liquor's delivery to Sakura is on Fridays (Kōji's round Tuesday and Friday).

## Owner's decision — 22 October 2026: Higa Liquor closes into Sakura

The owner, during the Nhung change: "The sisters basically run commerce and healthcare on the island … maybe we don't
need a liquor store, Sakura can sell liquor too", then their answers and the finishing brief: "close Higa Liquor. Sakura
sells and supplies all alcohol, Kōji's round becomes Sakura Trading's, and the building stands shut with a notice on it."
This supersedes the liquor-shop parts of the 21 October decision above (its bench and coin laundry stand). The task folder
is `briefs/higa-liquor-closes/`.

- **Higa Liquor is shut for good** (superseded for the building by Kissa Higa, 30 October 2026, below) (`commerce/higa-liquor.js`): the shutter down at every hour, the doors shut, the lights
  off, a hand-written 閉店のお知らせ taped to the shutter (`HIGA_NOTICE`: thanks, and お酒は さくら商店へ), read from the
  street; no new geometry. The fittings and the family kusu stay inside behind the shutter. The 留守 card, the hours and
  the counter's menu are gone; its sign stays up.
- **Sakura sells all the alcohol**: the cans of lager in the cold cabinet as before, and the bottles the Higas sold
  (awamori miniature, the large Umineko, one-cup sake) from the stock room at the till (`commerce/konbini.js`
  `SAKURA_BOTTLES`), at the Higas' prices; on Saturdays, when Sakura is shut, there is no bottle to take away (the bench's regulars buy
  Saturday's on Friday; the bars still pour).
- **Sakura Trading supplies it** (`merchandising.js` SUPPLIERS.sakura `alcohol`, and `alcohol` lines on the accounts of
  Minato, Sato Ramen, the Coral Bay Bar and Mr Fujita's shed); the economy's Higa business is gone, the bars pay
  Sakura's trade price for drink (`economy/town-economy.js` `barTrade`), and a product with alcohol must be supplied by
  `sakura` (`studio/rules.js`).
- **Kōji's round is Sakura Trading's** (`commerce/trade-round.js` `TRADE_ROUND`): Tuesdays and Fridays from 10:30 on his
  weeks ashore, loading at the depot in the Quay Warehouse, then Minato, Sato Ramen, the Port Terminal's freight counter
  (the Coral Bay Bar's ice boxes, for the 14:45 boat: the ferry is at Kitano-jima in the late morning) and Mr Fujita's
  shed (whose six o'clock van is gone: the round swaps his crate, full for empties, and at six he stands the night's
  empties back in it), the empties to the crate yard across Main Street, which Sakura Trading rents from Grandmother
  Higa. The Coral Bay Bar's juice goes on the morning boat, as before. ¥1,500 a round from Sakura's till; the round's book is
  read at Sakura's back office. In his weeks aboard the customers collect, as before.
- **Grandmother Higa keeps only the bathhouse**: the bandai 10:00–12:00 and 13:00–17:00, the garden and the verandah;
  Yui no longer minds a counter on Saturdays.
- **The yuntaku bench stays**: Tetsuo and Mac still sit out front of an evening with a bottle from Sakura; the bench no
  longer depends on the shop's hours.

## Owner's decision — 30 October 2026: Kissa Higa in the shut Higa Liquor

The owner, 30 October 2026: "Since the liquor store is closed maybe it can be replaced by one of the buildings maybe the
cafe"; Grandmother Higa to keep it in the mornings; then "work accordingly to your own recommendations" (the plan and the
self-audit: `briefs/higa-kissaten/progress.md`). This supersedes the shut-front parts of the 22 October decision above
(the shutter down at every hour, no new geometry, Grandmother Higa keeping only the bathhouse); its drink parts stand.

- **Kissa Higa (喫茶ひが)** (`commerce/kissa-higa.js`): Monday to Friday, open 07:00–09:30; Grandmother Higa at the front
  from 06:45, the shutter up at 06:50 over nine seconds, behind the counter until 09:40, out on the pavement while the shutter comes down
  (09:44, over nine seconds), and up Kitano Road to the bath at 09:50. If anyone is still inside or crossing the threshold, she waits
  outside with the shutter and doors open; after the last body clears she takes nine seconds to lower it, then leaves.
  Saturdays she opens Johansson Mart at 08:45; Sunday is her morning off. She is up at half past five, her garden round before opening (`canonical-rest.js`, `cast.js`).
- **The menu**: the morning set (blend, thick toast, boiled egg), blend coffee and iced coffee, ¥300 each. **No alcohol.**
  Bread and milk on Sakura's account, taken at its till at five the afternoon before (Sakura is shut before nine); beans,
  eggs and butter with Sakura Trading's Monday order (`merchandising.js` ACCOUNTS.sakura `kissa-higa`).
- **The regulars come from their own days**: Yui's breakfast at the counter before school (it replaces her breakfast at
  home), Ms Ganaha before the laundry, Tetsuo three mornings a week, Officer Mori before he sleeps, Ms Uezu on her weeks
  off watch (`KISSA_REGULARS`; `people/shop-days.js` seats them). The live street controller reads these breakfasts before
  home preparation: Tetsuo sleeps 23:00–07:00 and opens his radio bench at 09:00 (his `cast.js` day); Mori sleeps
  09:00–15:00, after the morning set and before his desk duty.
- **The room** (`world/okinawa/higa-liquor-dressing.js`): the counter is the coffee counter; a ledge at 0.74 m with three
  0.46 m stools (the izakaya's pairing; no bar stools). Cartoon shoes still hang 0.21–0.25 m above the floor on
  chair-height seats across town; seat heights stay unchanged pending the owner's decision. Two siphons, a kettle, the cup
  shelf and the family kusu stay; a table for two by the police-station wall; the record player and her husband's 45s; a green
  awning and an A-board. The record player, the bentwood chairs and the hand grinder are Meshy models
  (`kissa-higa-props.js`, `assets/models/kissaten/`), chosen by the audit in `docs/qa/kissaten-meshy/`; everything else is
  drawn in code. The shutter, doors, tubes and board follow the clock, and the neighbours re-plan their routes when the
  way in opens or shuts.
- **The bench out front stays** for the evening.

## Owner's decision — 22 October 2026 (night): the money model is closed for now

The owner: "close the money model for now, we need to simplify background processes." `src/economy/town-economy.js`
(the year-by-day simulation of households, shops, the ferry's orders and the bars) is not extended or wired into the
game; its open issues (it does not know Sakura's Saturday closing) are closed with it. It never ran in the game: only
`tests/town-economy.test.mjs` runs it. `economy/goods.js` stays in use. The next step the owner named is to simplify the
background processes (`src/edition.js` lists them per edition); ask before switching any of them off.

## Verification

Use focused geometry, collision, navigation and schedule checks. The whole game boots in a cloud session's software
Chromium (swiftshader): `node tools/cloud-boot-smoke.mjs` loads it with the `?audit&visual-audit` harness, presses
START and photographs a street and a room (about 35 s to "Island ready" on a 4-core machine; run it alone, since
browsers or test suites beside it starve it). The `?visual-audit` tools, `render-feed-backdrops.mjs` among them, work
the same way. Until 21 October 2026 they waited at 97% for ever, because the frozen frame loop never drew the title
(`tests/audit-boot.test.mjs`). For runtime changes run `npm run build:runtime` and `node --test tests/runtime-package.test.mjs`. Check real pedestrian and overhead views, including mobile, wherever a GPU browser is available; state when physical-device or visual checks are unavailable. Do not claim screenshots or tests that were not performed.

World changes must keep the CI guard green (`.github/workflows/johansson-world.yml`, on every pull request and push to
main that touches `johansson-town/`; locally `node tools/ci-guard.mjs`). The guard runs the tests listed in
`tests/ci-guard.txt`, all of which pass on main. When a known-failing test is fixed, add it to the guard (one line).

## Owner's decision — 21 October 2026: the ferry keeps her timetable and never waits for Nils

The owner: "How to simplify so that the ferry doesn't have to wait for Nils", and, on the recommendation below, "Yes
proceed". The Minato Maru sails to a fixed timetable, the one on the departures board in Sakura's office
(`HARBOUR_LINE`), whether the player is aboard, ashore or on the gangway. Two minutes before she sails, the horn sounds
and the gangway sign reads 出港 · Departing; on deck a prompt offers "Go ashore" or "Stay aboard". If he is aboard when
she sails, he crosses with her and can walk her decks or go below. If he misses her, the next sailing is on the board, or
he takes the small quick crossing to Kitano-jima, which stays on request. The chief's watch is Nils's only while he is
aboard in his working hours; otherwise Mac has it. Nothing in the ship's day depends on the player. The brief is
`briefs/ferry-timetable.md`.

## Owner's request — 21 October 2026: Thao gets every drink from where it is kept

The owner: "it's better if the bottles in the izakaya bar desk is where Thao gets the drink for the person who orders…
beer and drinking works nice, now she just brings by magic". Every drink at Minato, yours or a resident's, is made from
where it is kept (`src/world/interiors/minato-bar.js`, its places and their reasons as data; the round in
`src/people/izakaya-bar.js`): a clean glass off the rack on the worktop, the Orion tap beside it, the house awamori (the
back bar's own Sango Quay, the bottle in use standing at the front of the back counter, its place on the middle shelf
empty), the cold store's upper compartment (the big bottles with a chilled glass, the cans, the oolong jug; the door
opens to 60° with her hand on its pull), the sake set by the range. The glass set down in front of you is the one she
took. Thao's arm is short (her shoulder is 0.93 m up) and the counter and worktop together are 1.2 m deep, so nothing is
handed across them: she comes round the end of the counter and sets the drink down beside your stool, or at the booth
table's nearer end. Her hands meet what they take and nothing passes through the furniture (`src/avatars/work-hands.js`,
`tests/izakaya-bar.test.mjs`); on Linux the bottle tips over the glass with its stream and the tap's lever is pulled
(`BUDGET.pouring`), on the web the glass fills as she holds the bottle over it. Dishes are cooked as before; a resident's
food still appears with their drink.


## Owner's decision — 22 October 2026: withdraw current fighting

The ordinary browser and Linux game are peaceful. Festival bouts, tournaments,
spectating, insult-triggered fights, attack controls, damage/rewards and the
combat-dependent cave descent are withdrawn. Preserve normal conversations,
apologies, peaceful festivals, relationships, dining, ferry operations and saves.
Old active combat/cave/arena saves recover at the safe harbour opening without
losing property, identity or travel progress.

Do not restore dormant combat launchers or payloads. Shared Studio/story poses
and costumes remain artistic assets. A future dedicated Virtua Fighter/Tekken
inspired mode requires separately approved work; it is not part of this build.
Implementation, release and verification are recorded in
[the combat-withdrawal handover](briefs/HANDOFF-COMBAT-WITHDRAWAL-2026-10-22.md).
