# Retro study: Mario Artist Talent Studio (64DD, 2000) and the Game Boy Camera (1998)

The creator asked (2026-10-11) for these disks and cartridges to be taken apart with Ghidra, to see what Johansson
Studio and Johansson World can learn from them, and to remake what is good as our own. This is the record of what
was found, what was built from it, and what is proposed next.

**The line we keep:** nothing of Nintendo's or Sanrio's is copied into this repository: no pictures, models, motions,
sounds, text or code. What we take is how things work and ideas for features; everything shipped is our own design,
our own art and our own code. The dumps and decompiled listings stay out of the repo.

## How it was done

- **Ghidra:** the decompiler and SLEIGH compiler were built from Ghidra's source (`Ghidra/Features/Decompiler`), with
  the MIPS64 spec (Nintendo 64, 32-bit addresses) and the SM83 spec from GhidraBoy (Game Boy). The headless decompiler
  was given raw images: the 64DD boot code at `0x80100000`, and the Game Boy bank 0 plus the bank being studied.
- **64DD disk (`.ndd`):** stored in logical block order, with block sizes that change by zone (tables from the ares
  emulator). System area: disk type 0, boot code loaded to `0x80100000`, ROM area LBA 0–0x587, save area 0x58A–0x7AD.
- **Compression:** 198 blobs marked `Yay1`. Ghidra on the decoder (`0x8017D3B0`) shows that it is Nintendo's Yay0
  algorithm unchanged: a bit mask, then 16-bit back-references (length `(v>>12)+2`, or a long form with `+0x12`;
  distance `(v & 0xFFF)+1`) and literal bytes. All 198 decode (19 MB).
- **Graphics:** textures are RGBA5551; models are F3DPEX display lists (the microcode strings name F3DPEX/L3DPEX 2.06F
  and 2.08G). Text uses a font table where the first letter of each word is shifted down by 0x20 and `0xBD` is a space.

## Mario Artist Talent Studio: what it is made of

**A talent** goes through: face photo (Capture Pak or Game Boy Camera) → face edit, face morph and makeup → body
(Mr. Body / Ms. Body units) → clothes → voice → profile. Overlay names on the disk follow the same steps
(`ssfaceedit`, `ssfacemorph`, `ssmakeup`, `ssbodyedit`, `ssclothesedit`, `prvoiceset`, `prprofile`).

**The wardrobe has 16 slots**, each with its own list and separate male and female sets: hat, full costume
(robot, knight, mummy…), nose, ears, facial hair, glasses and masks, forehead mark (moon, heart, star, jewel), head
ornament (flowers, ribbons, horns, antennae…), face item (mole, beak, pacifier…), inner shirt, tights, socks,
trousers or skirt, top, back item (wings, school bag, plush doll, turtle shell…), shoes, gloves. Our recipe
(`src/avatars/recipe.js`) has hair, top, bottom, footwear, hat, glasses and facial hair. Missing: back item, gloves,
socks, ears, nose shapes, face items and forehead marks. Each is a cheap way to tell a lot about who a character is.

**Movie Studio's scene model** (from its debug strings): each scene has an actor track and the tracks EFFECT, FILTER,
WIPE, SCRIBBLE (drawing on the picture), SE and SE2 (sounds), BGM_EF, SE_EF, EXPRESSION and TELOP (captions). The four
"auto sound" tracks (effect, filter, expression and caption) are the clever part: choosing an effect also brings its
sound, so a beginner's film is never silent. Menus: Select actor, Select background, Repeat action, Item, Item size,
Select action, Select camera work, Make action, Make camera work, Make lighting, Make graffiti, Make caption,
Record sound. Expressions: normal, laugh, angry, sad, free, sleep. Sound groups: motion, animals, voices, instruments,
loops, environments, the talent's own voice, recorded.

**The action album** groups about 130 canned actions as Movement, Item, Feelings, Weight, Rhythm and Battle. Examples:
quiet walk, angry walk, dizzy walk, crawl, sneak, panic, skip, look around, doze off, faint, step back, yawn, sneeze,
surprised, shocked, hurray, crying, wiping tears, "I'm sorry", freezing, eight dances (including a Bon festival
dance), swim strokes, instruments, broom, umbrella, camera, juice, fries. There are also cartoon "weight" actions:
flatten, inflate, shrink, wobbly, crash into a wall.

**Shuffle** makes a whole movie at random from the cast on stage.

**56 stage backdrops** (128x128 each), listed below as a set reference for World.

## Game Boy Camera, Pocket Camera and Hello Kitty Pocket Camera

- **The photo look is computed, not stored.** Ghidra on the camera driver (bank 0x0A, `0x4427`) shows the cartridge
  building the sensor's 4x4 dither matrix at runtime. There are four tone levels in RAM (`0xD583–0xD586`), and three
  threshold planes, each a linear ramp in sixteen 8.8 fixed-point steps from one level to the next. The steps are
  written into the cells in the order of a transposed Bayer matrix (0 12 3 15 / 8 4 11 7 / 2 14 1 13 / 10 6 9 5).
  The sensor sharpens edges before thresholding, and the camera sets exposure for each photo. All of this is standard
  technique, now reimplemented as our own "Pocket camera" film.
- **Stamps** (face parts: moustaches, eyes, noses, hats), **frames** around the 128x112 photo, a trick lens
  (mirror, montage), animation, and minigames. The Hello Kitty prototype uses the same engine with cute frames and
  stamps.
- **InfoGenius productivity cartridges** (organizer and phone book, travel guide, Japanese phrasebook, spell checker
  and calculator) store their text compressed. There is no graphics technique to take, but the idea fits World: a
  pocket notebook of the people met, places found and phrases learned.

## Built in this batch

1. **Studio, Build scene → Shuffle a moment** (`avatar-creator/scene-moments.mjs`). This is Talent Studio's Shuffle,
   but nothing is random on its own: twelve written situations (good news, bad news, caught out, first hello, which
   way?, dance-off, karaoke, rematch, …) in the action album's groups. Each gives the lead and the others poses, faces,
   two lines and a caption. The group is staged across the picture, shifted as a whole onto open floor the camera can
   see, and turned three-quarter to the lens. Undo brings back the scene from before.
2. **World, photo studio → Pocket camera film** (`johansson-town/src/photo/pocket-camera.js`), in green and grey: the
   Game Boy Camera method above, live on the preview and baked into the saved PNG (only the four shades).
3. **Caption wrapping** (`src/photo/layout.js`): bubbles and captions broke English words in the middle ("ram / en").
   They now break at spaces, and only a word too long for the line, or Japanese, breaks by character.

## The town's pocket cameras: Pocket Gentleman and Pocket Lady (the creator, 2026-10-12)

> "The Gameboy camera should be a fictional Pocket gentleman camera" · "And for girls the Gameboy is a Pocket Lady
> that is pink"

The game names no real product (the 1998 camera was sold in Japan as "Pocket Camera"). In the town there are two
fictional hand-helds (`src/photo/pocket-models.js`): the **Pocket Gentleman** (a cream body, a round lens set in the
top corner like a monocle, a green screen) and the **Pocket Lady** (pink, the same lens, a rose screen). The player
carries the one that fits the look they chose (a feminine silhouette: the Pocket Lady). The photo studio's films are
named after them. Built 2026-10-12 with the carried camera (the first proposal below). Open: a choice of model of
its own in Studio; residents who own one (a story prop).

## Proposed next, ranked by stories

1. **Pocket camera as a thing you carry in World.** In first person (World already has the view), raise a viewfinder
   that shows the Pocket film live. Photos go to an album, and a photo of a resident or a place counts as a discovery
   the storyteller can use ("the photo Thuận took at the pier").
2. **A photo-sticker booth** (purikura, a fixture of Japanese arcades and shops from the mid-1990s) on Rainflower Lane
   or in a shop that would host one. Pick our own frames themed on Minato Machi (the ferry, sakura, onsen steam, a konbini stamp
   card), add our own stamps, take a four-shot sheet with a countdown, and print a sheet the album keeps.
3. **Movie mode in Studio** on Talent Studio's track model: actor moves, expressions, effects with their own sounds,
   captions and wipes, per scene. Shuffle a moment becomes the first scene of a shuffled film.
4. **More wardrobe slots:** back item, gloves, socks, ears, nose, face item.
5. **Face from a photo:** the face is already painted on a canvas (`src/avatars/face.js`), so a photo layer with a
   fitting guide (eyes, mouth) and makeup stamps can sit on it.
6. **A pocket notebook in World:** a phone book of the residents met, a guide to places found, and Japanese phrases
   heard.
7. **Emotion backgrounds for comic panels:** hearts for love, question marks for confusion, a burst for shock, a
   spiral for dizziness. We draw them as our own panel effects; World's `manga-fx.js` has speed lines already.

## Set reference for remodelling World (from the 56 backdrops)

Each set shows what reads at a glance: one strong subject, a low or eye-level camera, and a few period props. We
build our own versions as real 3D places, true to Minato Machi.

| Backdrop | What it teaches | Where in World |
|---|---|---|
| Tatami living room: low table, CRT TV, window, ceiling lamp | A lived-in home in one frame: TV in the corner, cushions round the table | A resident's home interior (none yet) |
| Bare tatami room with cushions | Calm and empty; the room is the story | Umi-no-yu's rest room, or a ryokan room |
| Engawa (veranda) onto a garden | Framing the garden through an open shōji | Japanese garden: an engawa viewpoint |
| Classroom: blackboard, clock, teacher's desk | Instantly "school"; a clock that tells the time of day | A school (missing) |
| School gate and building with clock | The meeting place before and after class | School exterior (missing) |
| Locker room with benches | Changing, gossip and nerves | Onsen changing room; ferry crew room |
| Stairwell | Chance meetings and chases | Apartments, the school |
| Shopfronts with awning and barber pole | A street told by its signs | Rainflower Lane: a barber is missing |
| Stage with curtain and "Show Time" | Performances, contests, the festival | Community hall or festival stage |
| Car interior | Conversations on the move | Bus or taxi interior |
| Bamboo grove, cedar path, autumn path, snowy wood, sakura | One tree type per path; seasons | Mount Aoba trails; seasonal looks |
| Thatched farmhouse with water wheel | The countryside in one image | Kitano-jima's inland farms |
| Cove with a rock arch | A postcard beach with one landmark | Kitano-jima, Coral Bay |
| Town from above, river and bridge | Map-like establishing shots | The island builder's overview (NEXT.md §6) |
| Effect backgrounds (burst, rays, hearts, question marks, spiral) | Emotion as background | Comic panel effects (item 7 above) |

The space, desert, castle and boxing sets are off our theme and are left out.
