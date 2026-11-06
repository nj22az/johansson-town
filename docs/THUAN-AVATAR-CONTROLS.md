# Thuận: editable reference preset

For the earlier look, choose **Thuận · original** in “Choose a face”, or **Original Thuận braids** under Hair → Style. The original preset restores her heart-shaped face, lashes, rose glasses, lipstick and compact braids with yellow ties, while keeping the shared navy/cream outfit. It has no earrings or necklace. Both braid styles can change tie colors independently of their clothing.

The shared cast preset now uses a softer oval-to-round face, fuller cheeks, warm skin (`#e8bd9e`), restrained blush, round highlighted eyes, fuller rose lips and arched brows. It wears the navy contrast-collar polo, cream pleated skirt, gold pendant/studs and white shoes. Glasses are off by default; their rose frames are preserved for turning them back on.

| Recipe parameter | Creator location | Range / options |
| --- | --- | --- |
| `head.roundness` | Face → Adjust | 0–1: original form → soft round |
| `head.shape`, `head.jaw`, `head.cheeks` | Face → Adjust | Existing width, jaw and cheek adjustments |
| `body.skin` | Body or Face → Colour | Skin swatches, including the new warm tone; recipe accepts hex colors |
| `blush` | Face → Adjust | 0–1 intensity |
| `hair.length` | Hair → Adjust, Twin braids | 0–1: upper chest → below waist; Thuận: 0.92 |
| `hair.volume` | Hair → Adjust, Twin braids | 0–1: fine → full; Thuận: 0.70 |
| `hair.tieColour` | Hair → Colour, Twin braids | Independent tie color |
| `hair.colour`, `hair.flip` | Hair → Colour / Style | Color and side part |
| `glasses.enabled` | Glasses & beard → Style | Wear glasses toggle |
| `glasses.style`, `glasses.colour` | Glasses & beard → Style / Colour | None, round, square, shades, half-rim; frame color |
| `outfit.topColour` | Top → Colour | Polo color |
| `outfit.bottomColour` | Bottom → Colour | Skirt color |
| `accessories.necklaceColour` | Accessories → Colour | Independent pendant/chain color |
| `accessories.earrings`, `accessories.colour` | Accessories → Style / Colour | None, studs, hoops; earring/pin color |

All fields normalize and survive recipe codes and saved avatars. Older braid recipes without length/volume retain the compact silhouette. Older accessories without a necklace color inherit their shared accessory color.

The **Preview expression** menu also exposes happy, shy, thinking, excited and the rest of the existing face library alongside the pose preview.

## Geometry and materials

The face remains its own low-poly mesh and canvas texture. Roundness interpolates the same head profile used by the face, scalp and hair. The runtime retains its existing painted eye/mouth expression system and body draw-call count. Bright eyes gain a softer catchlight and subtle eyelid line. Hair retains the raised side-part crown, with three small loose wisps.

Each braid has three tapered woven strands, white/palette-colored ties and a small tail. Length changes both mesh and spring anchors; volume changes strand thickness with a constant vertex budget. Two bones per braid keep the existing spring animation and pose library. The cream skirt keeps its four spring sectors and existing cloth clearance shader.

Short skirts use a continuous surface deformation after skinning: the average thigh angle bends the cloth, and a gentle shear follows the leading leg without separating neighbouring panels. When seated, the cloth transitions from the fixed waistband to a hem over the knees in front and on the seat behind. Surface normals turn with the cloth. The existing body clearance pass still runs for the body, outline and shadow; bath wraps and long skirts retain their previous fitting. The GLB retains the skeleton/skin weights; this procedural deformation remains a game-renderer feature.

## Export

Use **Export T-pose (.glb)** below the body preview. The export includes:

- Neutral T-pose with open hands, existing skeleton and skin weights.
- Separate `Braid L` and `Braid R` skinned meshes.
- Relative face position morph targets: `smile`, `shy`, `surprised`, `blink`.
- Normalized recipe and PNG expression textures in the root node's extras: neutral, smile, happy, shy, thinking, excited, surprised and blink.

Morph targets add small localized cheek, jaw and eyelid deformations. The matching painted textures are still needed for the exact eye/mouth expressions; a generic GLB viewer does not automatically switch the PNGs stored in extras. Game-specific cel outlines and procedural cloth clearance remain in the game renderer, while the GLB uses standard materials and vertex colors.

The checked export and game-rendered pose sheet are in `docs/qa/braids-skirt/`.

The original braid cap now leaves curved openings around the ears. Ears sit slightly higher and forward, with a small inner-ear inset; the original face, fringe and braid lengths are retained. This adds small low-poly inner-ear pieces to the shared body mesh for the original braid style, with no new material or draw call.

## Sleeve coverage

All sleeved tops share a closed underarm gusset between the chest and upper-arm bones. Short sleeves also colour the underlying upper-arm surface as cloth, so raising an arm does not expose a skin patch behind the sleeve cap. The gusset samples the existing sleeve texture and stays in the same skinned body mesh/material. Sleeveless tops and swimwear retain bare shoulders. Raised-arm checks for Johansson and Thuận are in `docs/qa/braids-skirt/underarms-after.jpg`.
