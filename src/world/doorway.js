/**
 * Carrying a heading through a door.
 *
 * An interior is authored in its own frame: the room's door faces `layout.yaw`, and
 * the same door faces `site.entryFacing` out on the street. So the two frames differ
 * by exactly one angle, and a heading crosses the threshold by adding it one way and
 * subtracting it the other.
 *
 * Without this, walking into a building threw your heading away and replaced it with
 * the room's, which is the single thing that most made an interior read as somewhere
 * else rather than as the inside of the thing you were just looking at.
 */
export const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));

/** The angle between a building's street frame and its room frame. */
export const doorTwist=(site,layout)=>(layout?.yaw??0)-(site?.entryFacing??0);

/** A heading on the pavement, as it reads once you are inside. */
export const streetToRoom=(yaw,site,layout)=>wrapAngle(yaw+doorTwist(site,layout));

/** and the same heading on the way back out. */
export const roomToStreet=(yaw,site,layout)=>wrapAngle(yaw-doorTwist(site,layout));
