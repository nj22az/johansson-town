# Harbour visitor and shared polo outfit

The five supplied photographs were inspected locally. Photographs are not committed.
The original game recipe represents a blonde adult with an original swept low ponytail, arched eyebrows,
lash eyes and berry lips. `Harbour visitor` is an editable placeholder name.

Open `creator/?preset=harbour-visitor`, or choose **Harbour visitor** on the creator's
first step. This is an editable/playable character preset, not a new scheduled NPC.
The wardrobe's **Harbour polo and cream pleats** outfit set is available to residents
independently of their face, hair, age or body. Individual parts remain editable.

The new **Contrast-collar polo** uses a collar authored with Blender 4.5.3 LTS.
`tools/blender/build-contrast-polo.py` produces `art/avatars/contrast-polo-collar.blend`
and `src/avatars/contrast-polo-mesh.js`. The shared body fitter maps that topology onto
each chest and binds it into the existing skinned body. Ivory collar/placket/cuffs use
the editable accent colour. The existing pleated skirt and shoes are reused. The hairstyle is now an original
Blender asset, not the original cap-and-ball ponytail.
No additional runtime model request is needed.

All characters now use the same wardrobe catalogue. Name-based outfit restrictions
are removed; existing and new saved recipes retain the selected clothing.

Validation:
- 58 avatar, wardrobe, animation, bath outfit and visitor tests passed.
- Runtime build completed and source hash regenerated.
- Real Chromium WebGL checks passed at 1280×800 and 390×844 with touch enabled.
- Standalone creator save and reload kept the complete outfit.
- Thuan received the shared outfit while retaining her original face and hair.
- The new hairstyle was selected through desktop and phone creator controls, saved
  for Thuan, and kept her head and outfit unchanged.
- Idle, walking, seated, wave and rear previews were captured; zero page errors.

`results.json` and the accompanying PNGs record the browser checks. The existing
pleated skirt's seated folding remains the shared avatar system's stylised drape.


Follow-up: sleeve coverage and hairstyle
---------------------------------------
The raised-arm skin patch under the polo sleeve is covered by continuous upper-arm
cloth and an underarm bridge. The neckline also has a continuous knit band.
The **Swept low ponytail** is independently selectable for anyone in the creator.
`tools/blender/build-swept-ponytail.py` authors the scalp, swept fringe, visible side
part and tapered ponytail in Blender. Its exported mesh parts are fitted to head
forms, recoloured from the hair palette and mirrored by the existing parting control.
The tail uses the shared hair spring bones. Clothing and hair are independent.
All ages, head forms and both part directions are covered by fitting tests; the
existing hair/hat combination tests include this style.

See `tomodachi-resource-analysis.md` for the bounded Ghidra/ROM study. The supplied
ROM, extracted resources, decompiled game code and Ghidra database are not included
in this repository. The new Blender hairstyle is original to Johansson World.

Creator improvements
--------------------
Thuan now uses the shared swept low ponytail in her existing black hair colour. Her
face, accessories and clothes are unchanged. Saved custom resident recipes remain
editable and continue to take precedence over cast defaults.
The Hair style picker offers front and rear views of each real game hairstyle, so
buns, ponytails and braids can be compared independently of their colour.
`thuan-creator-*.png`, `thuan-front-*.png` and `thuan-rear-*.png` show Thuan herself.

The creator's Make them step now uses a feature icon rail on the left, a large
live preview in the centre, and a part grid with a persistent colour palette on
the right. Phone screens stack the preview above the part tray while retaining
the icon rail and independent Style, Colour and Adjust pages. The supplied interface
reference and Tomodachi Life usability target informed this original layout.

Character standardisation
-------------------------
All identities use the same wardrobe catalogue, fitted body builder, skeleton and
animation player. Character names no longer remove clothing choices or rewrite
saved skirts/dresses. Personality and gait remain individual recipe settings.
This update standardises avatar capabilities; it does not change story schedules
or assign every town role to every resident.

The creator pose menu includes the complete shared move catalogue for every
character. The cross-cast test exercises 24 named moves plus walking, running and
sitting for all 33 authored cast/neighbour recipes with the new hair and outfit.

The refined Blender hairline has a visible narrow scalp part that follows the
character's skin colour, a softer curved fringe and tapered temple strands. These
parts remain shared, recolourable and mirrored with the hairstyle; no face settings
were changed to achieve the softer look.

The branch incorporates current main’s bathhouse electrical/layout updates and
journal content. Generated runtime conflicts were resolved by rebuilding the
combined sources, retaining main’s previous runtime chunks for cached pages.
Onsen and runtime-package integration checks passed after the merge.

The Blender crown now has three closed, curved locks with a lifted sweep and small
curl, tapered tips and shallow strand ridges. They add actual silhouette volume
above the scalp and subtle hair-colour shading. The part and temple strands remain
independent fitted head pieces, using the same mirroring and hat-tucking controls.

Raised-crown validation: 71 focused avatar/bathhouse checks and three runtime
package checks passed after integrating current main a482cf3. Chromium checks at
1280×800 and 390×844 exercise the creator and the actual Umi-no-yu room preview,
including the town’s ink/colour-grade settings and room lights. Front and three-
quarter room screenshots are in `thuan-room-*.png` and `thuan-room-side-*.png`.
`tools/avatar-room-preview.html` can preview any recipe with `?who=Name`.

## Distinct visitor hairstyle

The blonde Harbour visitor now defaults to the shared shoulder-length hairstyle,
leaving Thuan’s raised swept ponytail unchanged. This uses an existing reusable
creator part; hair colour, face and outfit stay as authored. Six focused avatar
checks and three runtime checks passed after rebuilding. Desktop and phone
creator captures are `visitor-hair-1280.png` and `visitor-hair-390.png`.
