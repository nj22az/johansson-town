# Neighbour conversations

Visible residents within 3.2 m of each other can pause for a twelve-second,
three-line exchange. Friends receive priority and have authored conversations;
other neighbours discuss the harbour, Tama, supper, rain or the late hour.
One encounter runs at a time, within 12 m of the player, followed by a 45-second
cooldown for both participants. No services or additional assets are required.

Outdoor residents smoothly face each other and exchange a small greeting wave.
Speakers have bounded mouth movement and a warmer expression; listeners nod.
Seated guests retain their furniture alignment and turn only their heads.
Thuan retains her existing supplied rig, without inventing facial morph targets.
The exchanges are text with animation; no new recorded or synthesised voices
are included.

A single small, non-interactive bubble follows the current speaker above the
head. It is hidden off-screen, behind colliders, while distant, or while any
player menu/conversation is open. The encounter cancels if an actor disappears,
changes schedule, changes room, or starts interacting with the player. Kenji's
active escort is excluded. Movement resumes afterwards; no actor teleporting or
player camera movement is introduced. Thuan's street visibility is now controlled
by her schedule rather than the legacy shop-only interaction rule.

Candidate checks run every two seconds against the existing visible cast.
The eight-character outdoor rendering cap remains. Added animation work is
limited to the two participants, and the bubble uses one DOM element rather
than another texture or 3D draw.

Validation covers turn-taking, facing without relocation, cooldowns, walls,
hidden parents, range, closing time, player intervention, escort exclusion,
seated orientation, projected bubble visibility and actual VRoid mouth morphs.
The real town's overnight simulation includes conversations and verifies that
residents still get home and Mori continues his patrol. Browser/device visual
and frame-time verification remains outstanding; the provided browser could
not initialise WebGL in the prior review.
