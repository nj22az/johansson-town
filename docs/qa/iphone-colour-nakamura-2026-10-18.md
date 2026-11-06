# iPhone colour and Nakamura shop correction

The user confirmed that PR #205 loads on iPhone Safari, but reported washed-out colour and a bare Nakamura frontage. This correction retains the 650,000-pixel native canvas limit, single-pass rendering, disabled background detail downloads and quiet opening.

The ordinary material draw now uses the ink renderer's hue-preserving highlight shoulder with restrained warm light, violet shadows and saturation. No extra render target, texture, MSAA, shadow map or postprocessing pass is allocated. Desktop ink rendering is unchanged.

Nakamura's counter has syrup bottles, bowls, a hand-cranked shaver, warm andagi and a small Blue Coral display. One hours-aware menu replaces five overlapping purchase points. The 30 cm plinth no longer covers the shop floor. A separate labelled family door, partitioned stairwell and upstairs landing fit inside the existing building footprint. Mrs Nakamura walks the measured route upstairs at 19:00 and returns at 10:00; her family entrance is registered for the home directory. The dessert bench moves clear of the threshold and supports seating.

Validation: 63 focused rendering, collision, schedule, street and business checks; 14 existing quarter/home/model checks; 3 runtime packaging checks. Full-town CPU scene inspection checks every route waypoint and all three public interaction approaches against actual colliders. The shader preserves the vendored tone-mapping chunk except for its designated CustomToneMapping function. A physical iPhone and GPU visual inspection remain unavailable; cloud browser WebGL was unavailable in the preceding investigation. Do not describe these CPU checks as rendered visual acceptance.

The requested akhaliq/Qwen-Image-2.1-Multiple-Angles-LoRA was inspected. It is a camera-control adapter, with no managed inference provider listed, and does not establish seamless or PBR texture generation. It was not used to generate this release's assets. Road and clothing texture work should use deliberate tiling/UV checks and small shared maps; sign lettering remains typeset for legibility.
