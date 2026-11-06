/**
 * What the public game shows. The live site (GitHub Pages) updates with the town as it is built. The ?build town
 * builder, which the Town Studio desktop app drives (jojo/town-studio), is not finished: it stays off online and on
 * everywhere else (localhost, the studio's captures, tests). It has no button in World. Decorating and dressing are
 * Johansson Studio's (src/studio-handoff.js), not World's.
 */
export const LIVE_HOSTS=Object.freeze(['nj22az.github.io','www.nj22az.github.io']);

/** True where the decorator may run: anywhere but the live site. */
export function decoratorEnabled(where=globalThis.location){
 const host=String(where?.hostname||'').toLowerCase();
 return !LIVE_HOSTS.includes(host);
}
