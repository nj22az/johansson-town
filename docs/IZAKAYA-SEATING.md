# Izakaya seating correction

The screenshot showed stools cutting through the guests' waists. The authored
stool tops are 0.71 m high and the benches 0.565 m, but the replacement VRoid
clips were grounded at the feet without aligning their seated bodies to furniture.

The character renderer now measures each rig's seated support surface, centres
it on the assigned seat, and follows 16 support vertices during eating/drinking.
This prevents the stool from intersecting the pelvis without scaling the person
or furniture. Entering and leaving a seat resets the incompatible standing pose;
leaving restores the original model offset for outdoor grounding. The ramen
counter uses the same correction with its 0.59 m stools. Nao and Thuan remain
standing. The front bench guests face the table and the rear bench faces inward.

The first-person izakaya now closes the original cutaway walls and ceiling, and
the counter stools have collision boxes. The supplied exterior and opening hours
remain as previously configured.

Validation checks actual skinned vertices for all 21 VRoid residents in Sit, Eat
and Drink at both izakaya seat heights, then checks restoration of standing height.
Raycasts against the shipped furniture confirm its seat dimensions. The existing
full-game interior, closing and schedule checks also run. Browser/GPU visual
confirmation remains unavailable because the provided browser cannot use WebGL.
