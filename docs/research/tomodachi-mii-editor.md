# Tomodachi Collection: Mii editor findings

Source: `Tomodachi Collection (english patched).nds` (game code CCUJ).
Tools: `ndsfs.py` reads the ROM's file table and decompresses LZ10 files with no extra libraries.
Usage: `python3 ndsfs.py <rom> <path...>` writes the files to `out/`, which is reference material and must never go into the town repo.

## Where the editor lives

| ROM path | What it is |
|---|---|
| `/Cmn/Nfl/NFL_Res_LZ.bin` | NARC holding `NFL_Res.dat`, Nintendo's Mii part library (NFL, the DS version of the Wii's RFL) |
| `/Mdl/Misc/headManikin_3D_LZ.bin` | Base head model |
| `/Mdl/Ica/ica_mii_*_LZ.bin` | Head and face animations per context (edit, room, song, mii_touch per personality…) |
| `/Mdl/Body/*` | 266 body and outfit models |

## NFL_Res.dat layout

The header is a 4-byte tag, then 20 u32 section offsets.
Each section starts with u16 count, u16 max entry size, then a u32 offset table.

| # | count | entry size | likely content |
|---|---|---|---|
| 0 | 4 | var | beard shapes |
| 2 | 50 | 512 | eye textures (48 + extra) |
| 3 | 24 | 512 | eyebrow textures |
| 4 | 8 | var | face-shape (faceline) meshes |
| 5, 17 | 12 | 1024 | face features / makeup and wrinkle textures |
| 6, 9, 18 | 72 | var | hair meshes (normal / hat / forehead variants) |
| 8, 10 | 9 | 1024 / 512 | glasses (8 styles + none) |
| 13 | 25 | 512 | mouth textures (24 + open) |
| 14 | 4 | 512 | moustache textures |
| 15, 16 | 12 | var | nose meshes / nose-line textures |
| 1, 11, 12, 19 | 1–2 | small | mole, mask, misc |

The part counts match the public Mii data format, so the parameter model below applies.
The ranges come from the public Wii/DS Mii format. They have not yet been checked against the ARM9 code, which is the job Ghidra would do.

## Mii parameter model compared with Shimanchu recipe (`src/avatars/recipe.js`)

| Part | Mii | Shimanchu today | Gap |
|---|---|---|---|
| Face shape | 8 shapes, 6 skin, 12 features | `head.form`, size/shape/jaw/cheeks, 8 skin, blush/freckles/wrinkles | features: only wrinkles/freckles |
| Hair | 72 styles, 8 colours, flip | 13 styles, 10 colours, flip | style count |
| Eyebrows | 24 types, 8 colours, scale 0–8, rot 0–11, x 0–12, y 3–18 | 7 styles, size/spacing/height/tilt | style count |
| Eyes | 48 types, 6 colours, scale 0–7, rot 0–7, x 0–12, y 0–18 | 8 styles, size/width/spacing/height/tilt | style count |
| Nose | 12 types, scale 0–8, y 0–18 | 6 styles, size/height/x | — |
| Mouth | 24 types, 3 colours, scale 0–8, y 0–18 | 7 styles, size/width/height/x | style count |
| Glasses | 9 types, 6 colours, scale 0–7, y 0–20 | 5 styles, colour | **no size / height** |
| Facial hair | moustache 4 + beard 4 independent, colour 8, moustache scale/y | one `facial.style`, colour | **can't combine moustache + beard; no size / height** |
| Mole | on/off, scale 0–8, x 0–16, y 0–30 | on/off, fixed spot | **no size / position** |
| Body | height 0–127, weight 0–127 | height, build | — |

## Ghidra verification (ARM9)

Method: Ghidra 12.1.4 headless (`brew install ghidra`, JDK 21), processor `ARM:LE:32:v5t`.
`re/extract_bin.py` pulls ARM9 out of the ROM and BLZ-decompresses it (0xB4EC4 → 0x115818 bytes, load 0x02000000; module params at 0xB9C).
It also extracts the 111 overlays, which all load at 0x02149A40 and are not compressed.
The Ghidra project is `re/ghidra/tomo.gpr` (programs `arm9_02000000.bin` and `ov76_02149a40.bin`); the helper scripts are in `re/ghidra/scripts/`.
The full decompiler dumps `re/ghidra/arm9.c` and `ov76.c` are local reference only, like `out/`.

Where the code lives:

- **The NFL library is in ARM9.** It covers bitfield access, part ranges, face placement, palettes and resource loading.
- **The face editor UI is overlay 76.** It loads `Scn/Scene/SceneMiiEdit2_LZ.bin`, `E00:/Hair.ncg`, `Eye.ncg` and so on.
- **Character record:** the core is the Wii RFL layout, but each u16 is little-endian and the record is 0x4A bytes.
  - The proof is `FUN_02079ed4`/`FUN_02079ea4`, which copy `index*0x4A`, and `FUN_0207361c`, which holds 6 built-in templates × 0x4A at 0x020B70C8.
  - The game embeds this record at `charObj+0x710` inside a larger struct.
  - The larger struct holds an extra birthday copy at +0x54 and a year at +0x50 (both read by `FUN_02098dac`).
  - This means the "0x5C/0x60" size belongs to the game's wrapper, not to NFL data.

### Parameter API (evidence)

| Function | Role |
|---|---|
| `FUN_020986c4(char, id, &min, &max)` | Range per parameter id. This is the single source of the editor limits. |
| `FUN_02098dac(char, id)` | Getter, dispatched through the pointer table at 0x020FBC2C |
| `FUN_02098c40(char, id, v)` | Setter, dispatched through the pointer table at 0x020FBB7C |
| `FUN_0208fed8(char, id, v, rebuild)` | Setter that can also rebuild the head model |
| ov76 `FUN_0214f930(ui, id, ±1, wrap)` | Arrow or slider step: clamps to the range, or wraps when `wrap`=1 (only hair flip uses wrap) |

### Corrected parameter table (ids, bit layout, ranges)

Offsets are into the 0x4A record and each u16 is little-endian. All ranges come from `FUN_020986c4`.

| id | Parameter | Field (offset: bits) | Range | Note |
|---|---|---|---|---|
| 0 | eye type | 0x28: 15–10 (6) | 0–47 | |
| 1 | eye colour | 0x2A: 15–13 (3) | 0–5 | |
| 2 | eye scale | 0x2A: 12–9 (4) | 0–7 | |
| 3 | eye rotation | 0x28: 9–5 (5) | 0–7 | stored relative to a per-type offset, see below |
| 4 | eye x (spacing) | 0x2A: 8–5 (4) | 0–12 | |
| 5 | eye y | 0x28: 4–0 (5) | 0–18 | |
| 6 | brow type | 0x24: 15–11 (5) | 0–23 | |
| 7 | brow colour | 0x26: 15–13 (3) | 0–7 | uses the hair colour table |
| 8 | brow scale | 0x26: 12–9 (4) | 0–8 | |
| 9 | brow rotation | 0x24: 10–6 (5) | 0–11 | per-type offset |
| 10 | brow x | 0x26: 3–0 (4) | 0–12 | |
| 11 | brow y | 0x26: 8–4 (5) | **3–18** | only parameter with a non-zero minimum |
| 12 | mouth type | 0x2E: 15–11 (5) | 0–23 | |
| 13 | mouth colour | 0x2E: 10–9 (2) | 0–2 | |
| 14 | mouth scale | 0x2E: 8–5 (4) | 0–8 | |
| 15 | mouth y | 0x2E: 4–0 (5) | 0–18 | |
| 16 | beard type | 0x32: 13–12 (2) | 0–3 | |
| 17 | facial hair colour | 0x32: 11–9 (3) | 0–7 | hair colour table |
| 18 | moustache type | 0x32: 15–14 (2) | 0–3 | |
| 19 | moustache scale | 0x32: 8–5 (4) | 0–8 | |
| 20 | moustache y | 0x32: 4–0 (5) | 0–16 | |
| 21 | mole on | 0x34: 15 | 0–1 | |
| 22 | mole scale | 0x34: 14–11 (4) | 0–8 | |
| 23 | mole x | 0x34: 5–1 (5) | 0–16 | |
| 24 | mole y | 0x34: 10–6 (5) | 0–30 | |
| 25 | hair type | 0x22: 15–9 (7) | 0–71 | |
| 26 | hair colour | 0x22: 8–6 (3) | 0–7 | |
| 27 | hair flip | 0x22: 5 | 0–1 | wraps |
| 28 | nose type | 0x2C: 15–12 (4) | 0–11 | |
| 29 | nose scale | 0x2C: 11–8 (4) | 0–8 | |
| 30 | nose y | 0x2C: 7–3 (5) | 0–18 | |
| 31 | glasses type | 0x30: 15–12 (4) | 0–8 | 0 = none |
| 32 | glasses colour | 0x30: 11–9 (3) | 0–5 | |
| 33 | glasses scale | 0x30: 8–5 (4) | 0–7 | |
| 34 | glasses y | 0x30: 4–0 (5) | 0–20 | |
| 35 | face shape | 0x20: 15–13 (3) | 0–7 | |
| 36 | skin colour | 0x20: 12–10 (3) | 0–5 | |
| 37 | face features (makeup/wrinkles) | 0x20: 9–6 (4) | 0–11 | 0 = none; one combined list, not split into makeup and wrinkles |
| 38 | birth month | 0x00: 13–10 (4) | 0–12 | 0 = unset |
| 39 | birth day | 0x00: 9–5 (5) | 0–28/29/30/31 | max depends on month and leap year; 0 when month = 0 |
| 40 | favourite colour | 0x00: 4–1 (4) | 0–11 | |
| 41 | height | byte 0x16 | 0–127 | getter clamps to 127 |
| 42 | weight | byte 0x17 | 0–127 | |

Fields outside the id list:

- **Header 0x00:** bit 14 = gender (`FUN_0207a710`/`FUN_0207a720`), bit 0 = favourite flag, bit 15 = invalid.
- **Bytes 0x02–0x15:** name, 10 UTF-16 characters.
- **Bytes 0x18–0x1F:** Mii and system ID; bit 31 of 0x18 is checked in `FUN_020733a4`.
- **0x20 bit 2:** a flag, likely "mingle" (setter `FUN_0207a6f0`).
- **0x36 onward:** creator name.

**Result:** every range in the earlier table matches the code exactly, including brow y starting at 3.
One mapping is corrected: the 2-bit field at bits 15–14 of 0x32 is the **moustache** and bits 13–12 are the **beard**.
The beard is the 3D chin mesh (NFL section 0).
The moustache is the texture (section 14) that has the scale and y sliders.

### Placement formulas (`FUN_0206e724`, constants at 0x0206EB7C–0x0206EBAC)

Values are fx32 (4096 = 1.0) in the face-texture coordinate space; larger y is higher on the face.

- **Eye** (two quads, mirrored)
  - x = 0.9114·eyeX − 0.156
  - y = 33.08 − 1.1018·eyeY
  - size = 4.75·(1 + 0.4375·scale), uniform
- **Brow**
  - x = 0.9114·browX − 0.180
  - y = 34.29 − 1.0549·browY
  - size = 4.766·(1 + 0.40625·scale)
- **Mouth**
  - x = 0
  - y = 22.11 − 1.0393·mouthY
  - size = (5.094 wide, 2.547 tall)·(1 + 0.4297·scale)
- **Moustache**
  - x = 0
  - y = 19.86 − 1.0549·y
  - size = 7.281·(1 + 0.4531·scale)
- **Mole**
  - x = 1.7368·(moleX − 8)
  - y = 32.81 − 1.0393·moleY
  - size = 1.023·(1 + 0.328·scale)
- **Rotation** (eye and brow)
  - angle = (rot + offset[type] − 32) × 11.25°, i.e. 32 steps per turn (sine-table lookup in `FUN_02071a78`).
  - When the type changes, the editor (ov76 `FUN_0214f2e0` region at 0x0214F380) keeps the absolute angle: rot += offset[old] − offset[new], clamped to the range.
  - Eye offsets (0x020B689C / ov76 0x02158E60, types 0–47): `29 28 28 28 29 28 28 28 29 28 28 28 28 29 29 28 28 28 29 29 28 29 28 29 29 28 29 28 28 29 28 28 28 29 29 29 28 28 29 29 29 28 28 29 29 29 29 29`
  - Brow offsets (0x020B6884, types 0–23): `26 26 27 25 26 25 26 25 28 25 26 24 27 27 26 26 25 25 26 26 27 26 25 27`
- **Extra per-part constants:** eye 13.06, brow 12.51, mouth 13.85/−6.92, moustache 20.48, mole 2.37.
  These are probably a pivot or quad half-extent. Their exact role is **unconfirmed**.
- **3D parts** (model units; one y step = 114/4096)
  - Glasses quad (section 7): y = base + (11 − glassesY)·114 + 387, z + 163; scale = 0.973 + 0.1545·(scale − 4) (`FUN_0206c2f8`).
  - Nose (sections 16 and 15): y = base + (8 − noseY)·114 + 32; scale = 1.069 + 0.167·(scale − 4) (`FUN_0206c65c`, `FUN_0206c964`).
- **Body** (`FUN_0208fbb4(h, w)`)
  - height scale = 0.5 + h·3153/2¹⁹ (0.50–1.26)
  - width = 0.4 + h·942/2¹⁹ + (w/128)·(0.4 + h·1926/2¹⁹)
  - Two more height-only factors exist: `FUN_020910ec` = 1 + h·22/4096 and `FUN_02091130` = 1.1 + h·3/4096. Their purpose is unconfirmed.
- **Order of the 2D face parts** in the placement array: eye L, eye R, brow L, brow R, mouth, moustache, mole.
  The texture-slot upload order (table 0x021121B4) is: palette, eye(2), brow(3), mouth(13), moustache(14), eye-extra(2), glasses(8), beard texture(1), features(5), hair accessory(10), section 17.
  The actual draw (layer) order has **not been confirmed**.

### Colour palettes (8-bit RGB tables in ARM9, then converted to RGB555 at runtime)

| Palette | Table | Values |
|---|---|---|
| Hair, brow and facial hair (8) | 0x020B6678 | `1E1A18 402010 581810 703820 787880 483818 885818 D0A850` |
| Eye (6) | 0x020B65E8 | `000000 6C7070 604030 605E30 4858A8 387058` |
| Mouth (3, dark and light pair each) | 0x020B6630 | `783018/C85010`, `781810/E81810`, `802028/E84848` |
| Skin (6) | 0x020B65A0 | `FFD8B8 FFBC80 D88850 FFB090 985030 602E1C` |
| Glasses (6) | 0x020B6558 | `181818 603810 A81008 203068 A86000 787068` |
| Favourite colour (12) | 0x020B66D8 | `B84030 F07828 F8D820 80C828 007428 204898 40A0D8 E86078 702CA8 483818 E0E0E0 181814` |

How the palettes are built:

- **Hair** (`FUN_02069de4`): a 16-entry palette of the base colour, then 95, 90, … 60 % of it.
- **Eye** (`FUN_0206a014`): base, 70 %, 30 %, 30 % toward white, 70 % toward white, plus fixed greys and white (0x2108, 0x6318, 0x7FFF…).
- **Mouth** (`FUN_0206a1b4`): dark, mid, light, plus fixed teeth greys (0x2529, 0x5AD6, 0x7FFF).
- **Skin** (`FUN_0206a2e4`): blended toward fixed tints that are used for the features texture.

### NFL_Res.dat sections, corrected

The loader is `FUN_0206cf6c(section, index)`.
The section-to-part mapping below comes from the callers `FUN_0206b0d8` to `FUN_0206c964` and `FUN_02075528`.

| Section | Content |
|---|---|
| 0 | Beard 3D meshes, indexed by beard type; type 0 is empty |
| 1 | Beard textures, used only for beard types 2 and 3 (mapped to index 0 and 1) |
| 2 | Eye textures: 0–47 by type, plus index 49 loaded into an extra eye slot when face flag 0x10 is set. Index 48 has no observed use. Likely blink or expression, **unconfirmed** |
| 3 | Brow textures |
| 4 | Faceline mesh, indexed by face shape; textured only when features ≠ 0 |
| 5 | Face-feature textures (12, index 0 blank) |
| 17 | 12 × 1024, a second features-sized layer (2-bit-like data); role **unconfirmed** |
| 6, 9, 18 | Hair meshes. All three honour flip and all three are indexed by hair type. 9 is the main mesh (about 1.2 KB each); 6 is a small secondary mesh (empty for hair 13, 33, 34 and 37); 18 exists only for hair 9, 26, 34, 46, 57 and 61. The "hat/forehead" labels are **not** confirmed |
| 7 | Single glasses quad mesh |
| 8 | Glasses textures, indexed by glasses type |
| 10 | Hair accessory textures for hair 5, 7, 24, 29, 42, 53, 58, 69 and 71 (index 0–8), tinted with the **hair** colour. This replaces the earlier "glasses" guess |
| 19 | Accessory textures for hair 34 and 57, tinted with the **favourite colour** |
| 12 | 31-byte fallback palette (used in render mode 7) |
| 11 | 2 × 128 bytes, unused or unknown |
| 13 | Mouth textures (24 + 1 extra; use of the extra **unconfirmed**) |
| 14 | Moustache textures |
| 15, 16 | Nose meshes, both indexed by nose type. Section 15 is empty for types 0 and 2 |

### Editor (overlay 76)

**Pages:** body (height/weight sliders 0–127; height also moves the camera), face (shape grid of 8, features grid of 12), hair, brow, eye, nose, mouth, and extras.
Extras holds glasses (9), moustache (4) with scale/y, beard (4), and mole (on/off) with scale/x/y.

Part grids:

- 12 cells per page: hair 6 pages, eyes 4, brows 2, mouths 2, nose 1.
- 8 colour swatches (button ids 0x1C–0x23).
- Grids show parts in a **non-numeric order** (tables used by `FUN_0214f014` and `FUN_0214f094`):

| Part | Grid cell → part id |
|---|---|
| Hair (0x02159870) | 33 40 51 44 39 70 45 49 59 56 68 31 / 32 47 37 48 66 52 58 50 55 64 60 62 / 43 38 42 23 67 54 36 41 65 30 57 34 / 12 13 69 26 4 25 1 19 5 8 27 7 / 14 3 22 10 6 20 11 63 17 35 21 0 / 61 16 46 9 18 2 28 53 71 24 15 29 |
| Brow (0x0215913C) | 6 0 12 1 9 19 7 21 8 17 5 4 / 11 10 2 3 14 20 15 13 22 18 16 23 |
| Eye (0x021595E0) | 2 4 0 8 39 17 1 26 16 15 27 20 / 33 11 19 32 9 12 23 34 21 25 40 35 / 5 41 13 36 37 6 24 30 31 18 28 46 / 7 44 38 42 45 29 3 43 22 10 14 47 |
| Nose (0x02158D04) | 1 10 2 3 6 0 5 4 8 9 7 11 |
| Mouth (0x0215919C) | 23 1 19 21 22 5 0 8 10 16 6 13 / 7 9 2 17 3 4 15 11 20 18 14 12 |

**Arrow and slider controls:**

- Eye: y, scale, rotation, x.
- Brow: y, scale, rotation, x.
- Nose: y, scale.
- Mouth: y, scale.
- Glasses: y, scale.
- Moustache: y, scale.
- Mole: y, scale, x.
- In the up/down buttons, −1 is "up".

**New Mii:**

- The editor loads built-in template 2 for a male or template 5 for a female (`FUN_0208ff44`).
- It then sets favourite colour = 0 and skin = 0.
- It writes 6 gender-specific u16 values to `char+0xEE…` (male `100 100 100 5075 104 0`, female `100 100 106 5643 118 0`, from 0x020FBAAC).
  These are probably the voice settings; **unconfirmed**.
- Template defaults:
  - centred placement: eye y 12, x 2, scale 4; brow y 10, x 2, rot 6; nose y 9; mouth type 23, y 13; glasses y 10; moustache y 10; mole x 2, y 20; height and weight 64.
  - male template: hair 33, eye type 2, brow type 6.
  - female template: hair 12, eye type 4, brow type 0.

### Missed before

- **Favourite colour (0–11)** is a real parameter, and it tints a part of hair styles 34 and 57.
- **Birthday** month and day, with a leap-year-aware day maximum. The record also has gender, name and creator name.
- **Hair accessory textures** for 9 hairstyles take the hair colour (section 10).
- **Beard and moustache use different techniques.** The beard is a 3D mesh, and beards 2 and 3 add a texture. The moustache is a 2D texture with scale and y.
- **Rotation is relative to a per-type offset.** Changing the type keeps the absolute angle. A clone needs the two offset tables to reproduce this.
- **The editor grids use a curated, non-numeric order.**
- **Face features is one 12-entry list**, not separate makeup and wrinkle lists. Section 17 is a second features-sized layer whose role is still open.
- **Extra eye textures 48 and 49 and the extra mouth texture 24** exist. 49 goes into a separate eye slot (probably blink); the other two are unconfirmed.
- **No randomise or look-alike generator** was found in overlay 76 or near the NFL code in the time available.
- **No gender-restricted part lists** were found; gender only selects the starting template.
