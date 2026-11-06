/**
 * The scene keeps the whole screen while you are talking.
 *
 * This used to cut the 3D view to about half the height on a phone so that dialogue
 * could never overlap a character. It meant that speaking to someone shrank the town
 * away and put a card where she had been standing — you stopped being in the street
 * and started reading a menu. The line is now a bubble over the speaker's shoulder
 * and the replies are a strip along the bottom, so the town stays where it is and
 * she stays in it.
 */
export function conversationViewport(width,height){
 return {width,height};
}
