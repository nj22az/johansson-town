/**
 * The pocket cameras of the town's world: two fictional hand-held models (the creator, 2026-10-12: "The Gameboy
 * camera should be a fictional Pocket gentleman camera", "And for girls the Gameboy is a Pocket Lady that is pink").
 * They stand in for the 1998 camera whose method the film reimplements (src/photo/pocket-camera.js), so the game names
 * no real product:
 *   Pocket Gentleman  a cream body, a round lens like a monocle, the screen's four shades green
 *   Pocket Lady       a pink body, the same lens, the screen's four shades rose
 * A photo keeps the shades and the palette it was taken with, so it shows which camera took it.
 * Which one the player carries follows the look they chose: a feminine silhouette carries the Pocket Lady, any other
 * the Pocket Gentleman (a choice of its own in Studio is open: briefs/retro-study.md).
 */
export const POCKET_MODELS=Object.freeze({
 gentleman:Object.freeze({id:'gentleman',name:'Pocket Gentleman',palette:'green'}),
 lady:Object.freeze({id:'lady',name:'Pocket Lady',palette:'rose'}),
});

/** The model a player carries, from their avatar recipe (src/avatars/recipe.js body.silhouette). */
export const pocketModelFor=recipe=>recipe?.body?.silhouette==='feminine'?POCKET_MODELS.lady:POCKET_MODELS.gentleman;

/** The model that took a photo: its palette says (green and grey are the Gentleman's, rose the Lady's). */
export const pocketModelOfPhoto=photo=>photo?.palette==='rose'?POCKET_MODELS.lady:POCKET_MODELS.gentleman;
