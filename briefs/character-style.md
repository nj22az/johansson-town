# The Johansson look: a character style guide (2026-10-11)

> The creator, 2026-10-11: "How about her collar, it's not right. Audit the characters our Johansson Studio avatar
> creator makes, see how we can standardise a better look for them. It can't look like Miis, we don't want to get sued,
> but I think it can look similar to them and still be cute." And: "add more poses and funny expressions".

One look for everybody in Johansson World and everything Johansson Studio makes: **simple, friendly, a chunky inked
toy, dressed for a 1990s Okinawan island**. Cute in the same spirit as a Mii, built so it is plainly our own.
The engine is `src/avatars/` (build.js, head-profile.js, face.js, garment.js, recipe.js); Studio's Edit character is
World's `creator.js`, so one rule set covers both.

Pictures (renders, not in the repo): `/tmp/claude-0/char-style/` — `audit-residents.jpg`, `audit-studio.jpg`,
`audit-faces.jpg` (the cast and the creator as they are), `collar-before-after.jpg`, `before-after.jpg` (the
prototype of this guide on Thuan, Mr Fujita, Nhung, Mrs Higa, Tetsuo and Johansson), `proportion-option.jpg`,
`expressions.jpg`.

## 1. Not a Mii

What makes a Mii a Mii (its trade dress), from Nintendo's own history and the public Mii format:
- **A kokeshi body**: Miyamoto has said the design comes from kokeshi dolls (GDC 2007). A big, smooth, egg-round head
  set straight on a small, plain body: the head is wider than the shoulders and there is almost no neck.
- **A face of flat parts** from a fixed library (Wii: about 48 eyes, 24 brows, 12 noses, 24 mouths; 3DS/Wii U: 60, 25,
  18, 36; 12 face shapes; 132 hairstyles), each with size, height, spacing and rotation sliders. The eyes are mostly a
  white with a coloured iris. **No ink line**, on the face or the body; soft, smooth shading.
- **Helmet hair**: one solid 3D shape per style, clean straight-cut edges, mirrored with a flip.
- **Plain clothes in one "favourite colour"** (one of twelve) with grey trousers; ball hands (Wii Sports: no arms at
  all, floating balls), height and weight sliders.
- Around it, Tomodachi Life's system: four personality sliders giving sixteen types, birthday, catchphrase, voice
  pitch and speed. And the name **Mii**, a Nintendo trademark.

A general style (big heads, simple drawn faces, a parts-based maker, personality dials) belongs to nobody. The risk is
copying Nintendo's actual drawings, models or textures, using its names, or stacking enough of its look that people
take ours for a Mii. (Design guidance, not legal advice: ask an IP lawyer before anything is sold.)

**Our rules, so it is ours:**
1. **Our head**: a soft *mochi* head, full at the cheeks and round at the jaw, never a point at the chin; ears showing
   with short hair; and a **real neck** the collar sits round. The head never sits straight on the shoulders.
2. **Ink**: every person carries the ink outline, coloured from what is under it (a yellow shirt gets an ochre line).
   Miis are never inked; this is our strongest signature. Keep it on everything new.
3. **Mittens**: hands are mittens with a thumb (fingers open when they hold or point), never balls.
4. **Hair in locks**: masses with their edges cut into locks and carrying ink, not helmets with ruler-straight fringes.
5. **Our face parts**: our own ink drawings. Bead eyes with one or two catchlights are the house eye; symbol eyes for
   gags; ink-line mouths; a small sculpted button nose; blush as standard. Never trace, match or recreate a Mii part,
   and add no more white-and-iris eye types (they are the most Mii-like parts we have).
6. **Clothes that are made**: island clothes with collars, plackets, prints, hems and layers (section 4), never a
   plain one-colour shirt and grey trousers as the default.
7. **The island palette** (section 6), not twelve favourite colours.
8. **Our words**: never "Mii", "Mii Maker", "Tomodachi" or "Miitopia" in the game, Studio, shipped docs or code
   comments; describe our own rules instead. No Nintendo asset ever, not even as a placeholder.

**The cast against the rules today**: ink ✓ everyone; mittens ✓ (small); constructed clothes ✓ for the drawn cast,
✗ for generated residents (one-colour blouse or polo) and the dice (plain tee/polo); head ✗ (an inverted egg with a
pointed chin on most forms); neck ✗ (2.8 cm, the head sits on the shoulders); hair ✗ (helmet fringes; the horseshoe
reads as earmuffs); eyes ~ (the white-and-iris styles almond, doe, cat, sparkle, droopy, heavy are Mii-like); palette ~
(the 16 cloth colours overlap Mii's twelve; `profile.favourite` is Tomodachi's idea); words ✗ (`tomodachi-ui.css`,
garment.js "A Tomodachi Life Mii wears…", head-profile.js "console-avatar silhouettes",
`docs/research/tomodachi-mii-editor.md` maps our recipe onto the Mii format; the in-game credits still list the
Tomodachi office model removed on 1 October).

## 2. Proportions (numbers)

Measured with `measure()` at height 0.5, build 0.5. **Now** is the engine today; **standard** is the Johansson look.

| | now | standard | where |
|---|---|---|---|
| Adult height | 1.36–1.80 m | same | `STAGES` |
| Heads tall: child / teen / adult / elder | 2.4 / 2.9 / 3.0 / 3.0 | same (option: adult 3.2, `proportion-option.jpg`) | `STAGES.head` |
| "Rounded" bodies | 1.9–2.3 heads | keep as the chibi option | `proportion` |
| Head width : shoulders | 1 : 0.82 | 1 : ≥ 0.82 (option 0.95) | `measure` width |
| Neck radius | 0.23 × head radius | **0.30 × head radius** | `measure`, neck tube |
| Neck showing | 2.8 cm | **≈ 5 cm** (neck bone 0.08 k, was 0.055 k) | `measure` neck |
| Mitten radius | 0.056 k (0.23 × head radius) | **0.07 k**, thumb 0.5 of it | addBody hands |
| Legs | 0.30 of height | same | `measure` leg |
| Chin taper (after the jaw slider) | up to 0.37 | **≤ 0.12** | head-profile.js |
| Cheek fullness | −0.07 to 0.11, at y −0.16 | **≥ 0.10, lower, at y −0.30** | head-profile.js |
| Sculpted nose radius | (0.065 + 0.055 size) × head radius | × 0.72 | addNose |

(k is the body's scale, height ÷ 1.6.) Every size in the engine is written for a body of 1.6 m and multiplied by k:
nothing in metres without k (the old pendant's 0.035 and 0.12 were not, so on a child it hung off the body).

## 3. Head and face

- **Head**: every form keeps its width and height (round, square, narrow…), but the jaw is soft: taper capped at 0.12,
  cheeks full and low. Nobody's face is a heart or a teardrop with a point.
- **Ears**: showing whenever the hair is short (crop, buzz, bald, horseshoe, sidepart, spiky, slick, topknot,
  ponytail, bun, braids); under bob, long, shoulder, afro, perm, mullet and centre-part hair.
- **Face layout** (the painter's 256 square): brows 62–78; eyes centred at 110 (now 104), spread 41 (now 38); nose
  135; mouth 155 (now 160). Eye size never below 0.5 (beady eyes made half the cast look like another game).
- **Parts**: our drawings only (rule 5). House eye: a dark bead with a catchlight. Brows short and thick enough to read
  at 56 px. Mouth an ink line; lipstick is a colour, not an outline. One sculpted button nose; a drawn nose style may
  add nostrils or a line, never a second blob.
- **Expressions**: World's one list (`face.js` MOOD, `EXPRESSION_INFO`, `EXPRESSION_GLYPHS`); the creator, the photo
  studio and Studio's scenes all read it. Each must read at 56 px and work with every eye style (the expression test
  checks it). Gags use symbol eyes and the cartoon marks (tears, sweat drop, gloom lines, anger vein, drool, puffed
  cheeks, a red face) laid out from the face's own layout.
- **Hair**: a mass with lock-cut edges (the prototype cuts the fringe into rounded locks); a horseshoe starts behind the
  ears (its band opened from 0.95 to 1.45 rad), never over them.

## 4. Clothes (construction)

- **Necklines**: every top has one, at the base of the neck: a crew rib (tee, hoodie), a Peter Pan collar (blouse,
  smock, apron), a polo collar, a camp collar with its modelled stand (kariyushi), lapels (jacket), a sailor collar, a
  scoop (house dress), straps (tank, sundress). A collar is one clean shape: nothing is drawn through it.
- **Plackets and buttons** start under the collar, on the centre line; prints stop under collars and plackets.
- **Sleeves**: a short sleeve ends at about 0.55 of the upper arm with a hem band; long sleeves end at the wrist with a
  cuff. Puffed sleeves on blouses and dresses only; tees and polos get a straight sleeve.
- **Hems**: a shirt ends at the waist or is worn out with its own hem (the kariyushi); a jacket's front is the shirt
  under it in a clean V, not a band of triangles.
- **Trousers and skirts**: shorts to mid-thigh (0.55 thigh), trousers to the shoe. Skirts are A-line with a soft fall
  (the prototype's lathe), not cones: knee length 0.9 thigh, long 1 thigh + 0.85 shin; pleats for uniforms.
- **Layering**, inside out: skin, base layer (tank, underwear), top, collar, necklace (under a collar), scarf, jacket,
  apron, hat.

## 5. Accessories

- **Necklaces never over a collar** (done, `NECKLACE` in build.js): on an open neck the chain lies on the body round
  the neck and dips to the pendant; under a collar only the last drop and the pendant show; under a tie, a sailor scarf
  or a happi coat nothing shows. The chain is fine (about 5 mm across) with a hair of ink.
- **Earrings** at the lobe; hair may cover them. **Pins** on the wearer's left chest. **Glasses** are 3D frames over
  the eyes in a palette colour.
- **Scarves** wrap the neck and their ends lie on the chest (the current flat plank does not).
- **Hats sit on the head**, hair tucked under: no gap, no floating. A beret is soft and tilts (prototype: tilted 0.3 rad,
  seated lower); caps and helmets fit the crown.
- Accessories stay on in every outfit a person changes into (today Thuan's earrings and pendant vanish in her sailor
  and shopping outfits, which are built without `addAccessories`).

## 6. Palette

- **Skin**: the nine tones (`PALETTE.skin`), pale to deep. **Hair**: the ten, greys and white for age.
- **Cloth, the island palette**: sun-washed 1990s Okinawa, mid-tones, no pure primaries. Paper white `#f4f1ea`, night
  navy `#27304d`, indigo `#2f4f7f`, bingata red `#c8473a`, turmeric yellow `#e8b83e`, hibiscus `#d9668a`, coral
  `#e8836a`, sea glass `#8cc4b4`, lagoon `#3a9cb8`, sky `#8fbfe0`, fukugi green `#4f7a4f`, sugarcane `#9cb85a`, sand
  `#e3d4b0`, bashō beige `#c9b68c`, roof-tile terracotta `#b4583c`, black-sugar brown `#6e4a33`, typhoon grey `#6d7478`,
  charcoal `#2b2b2b`.
- An outfit: two or three cloth colours and one accent; whites are warm (never `#ffffff`); a print is white or the
  accent on the cloth. The cast's signature colours stay (Thuan's yellow, Johansson's sky kariyushi).
- Ink is the colour beneath × (0.32, 0.27, 0.27); the face's lines are `#2b2623`.

## 7. Free and fixed

**Free** (the creator, Studio's Edit character, the dice): every face part and its colour, size and place within the
layout bands; hair style and colour; skin; height, build, life stage, rounded or classic; outfits and their colours
from the palettes; prints; earrings, necklace, scarf, pin, glasses, hats; expressions; personality and voice.

**Fixed** (the house look, held by the engine and its tests): the head's construction (soft jaw, ears, neck);
proportions per life stage; mittens; the ink outline and its colour rule; the cel ramp; the face layout bands and
minimum eye size; hair edges in locks; garment construction (collars at the neck, plackets under them, sleeve and hem
lengths, skirt shapes); layering (a necklace under a collar); the palette's limits; our own words and drawings.

## 8. Audit findings (2026-10-11)

Severity: **A** wrong on screen now; **B** off-model or inconsistent; **C** polish or hygiene.

| | Finding | Code |
|---|---|---|
| A | ~~Pendant ring tilted front-up, standing off the neck over the collar; pendant floating 12 cm lower~~ fixed cda3c337 | build.js addAccessories |
| A | ~~Blouse placket drawn through the Peter Pan collar~~ fixed cda3c337 | garment.js blouse |
| A | Nhung's beret floats over the head like a saucer | build.js addHat beret |
| A | The horseshoe reads as earmuffs (Johansson, Tetsuo, harbour master, Mr Nakasone) | build.js hairRing `open` |
| A | Reiko's scarf: a ring and a flat plank standing off the chest | build.js addAccessories scarf |
| B | Inverted-egg heads with pointed chins: the most Mii/kokeshi-like trait, and faces look alike | head-profile.js FORMS taper |
| B | Almost no neck (2.8 cm, 0.23 head radius): collars have nowhere to sit | build.js measure, neck tube |
| B | Helmet hair with ruler-straight fringes | build.js hairCap `front` |
| B | Skirts are straight cones: lampshades on Mrs Higa, Nhung, Mrs Kinjō | build.js addBody skirt |
| B | Every short sleeve is the same puff, with a lip at the hem | build.js addBody sleeves |
| B | Ears hidden on everyone but braids | build.js ears() |
| B | Eye sizes 0.42–0.8 across the cast: beady and big eyes side by side | cast.js, face.js layout |
| B | A sculpted nose on every face plus a drawn one (button: two noses) | build.js addNose, face.js drawNose |
| B | Jacket and cardigan fronts: the shirt under them is painted per triangle, a jagged band below the lapels | build.js torsoColour |
| B | Accessories vanish in alternative outfits (sailor, shopping lane, swim, towel) | build.js wear() |
| B | Generated residents and the dice wear one-colour blouses, polos and tees | cast.js recipeFor, recipe.js randomRecipe |
| C | ~~Happi coat: the crossed bands read as a big X~~ fixed in wardrobe batch 2 (2026-10-11): the collar bands run straight down both fronts, the opening a clean line, three-quarter sleeves | garment.js festival |
| A | The apron tears in every move: walking shears its lower panel into a jagged flap between the legs, in profile it stands off the trousers as a plank with a gap (the bib about 1 cm off the chest), on a chair it curls out of the lap with its grey underside showing, on the floor it folds through the lap. Seen on every body and on everyone who wears it (Mrs Sato, Mr Toguchi, Mina, Mrs Nakamura, Mrs Yonamine, Hiroshi); the bib cuts through a scarf. Its colour is the top's × 1.12 in linear light, so paper white turns `#fffdf6`. The wardrobe's Ramen kitchen set wears the smock until it is rebuilt (batch 5). | build.js addBody apron |
| A | Big hair (afro, perm) under a full hat is cut flat at one height, a slab sticking out below the hat (Mrs Kamiya's perm under her straw hat; every afro or perm in a set with a hat) | build.js addHair, the hat tuck |
| B | The headband over a perm breaks into white pieces (the curls sit outside the radius it follows); over an afro its front floats before the forehead; white on white hair hardly reads | build.js headband() |
| C | The bucket hat sits high, its brim at the hairline instead of over the brow | build.js addHat bucket |
| B | In a floor sit (feet up) a dark spot shows in the middle of a pale sole: on broad bodies the shoe's upper reaches below its sole (−0.17 cm on a broad adult, −0.13 cm on a broad child; slim bodies are clear), and a boot's shaft is bound to the shin, so its end cap swings out through the sole when the ankle bends. Hidden when the shoe and its sole are alike (white sneakers and boots, dark shoes); seen on Harbour day shift's dark boots and on any dark sneaker. Not the trousers: it shows with shorts too. (Wide trousers' cuffs and the setta's sole were fixed in the wardrobe's engine batch, 2026-10-11.) | build.js addShoe |
| C | Small mittens for a chunky toy | build.js hands |
| C | The outline is a fixed 1.1 cm: relatively heavier on children; thin parts need their own ink | build.js OUTLINE_WIDTH, ink |
| C | Cloth palette of saturated primaries, close to Mii's favourite colours; garish dice outfits | recipe.js PALETTE |
| C | Nintendo names in code, CSS and docs; stale Tomodachi credit | garment.js, head-profile.js, recipe.js, tomodachi-ui.css, activities.js credits, docs/ |

## 9. Batches (after the creator's yes)

Small batches, each checked in renders and in the game, portraits regenerated, the film shots that photographed the
people listed first (`remotion/tools/impact.py`), never with ground or lighting changes:
1. ~~Necklace and placket~~ (cda3c337). ~~Thirteen funny faces~~ (042ed50a).
2. Neck, ears, nose (affects hat fit, the collars' stand radius, tenugui and necklace rings, seats, head-top heights in
   tests and the noren, every film close-up).
3. Head jaw and face layout (affects glasses and whiskers, the creator's drag targets and thumbnails, portraits).
4. Hair locks, horseshoe, beret, scarf (affects hat tuck, headband, turban, hair states). With them: hair eased in under a
   hat instead of cut flat (render-checked in the wardrobe batch-1 review: big hair tapers into the hat, ponytails,
   braids and long hair unchanged; it changes every resident in a hat), and the headband fitted over perm curls and kept
   off the face.
5. Skirts, sleeves, jacket fronts, apron, accessories in every outfit (affects springs, towel fit, seating). The apron
   rebuilt below the waist as the front of the knee skirt's own cloth, with its drape, and the bib as its own panel (a
   scratch prototype fixed the tear in the stride, but still curls when seated); its colour capped at a warm white. And the shoe's
   upper kept above its sole, the boot's shaft kept inside the boot when the ankle bends.
6. The island palette for the dice and the generated residents.
7. Words: comments, `tomodachi-ui.css` renamed, the stale credit, the Mii-format research doc retired.

The prototype of batches 2–5 (a scratch copy of the engine, not committed) is `before-after.jpg`.
