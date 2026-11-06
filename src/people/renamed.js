import {identityOf,namesOf} from './roster.js';
/**
 * Residents who have been renamed: the old name, and who they are now. Yui was the
 * original Sakura clerk and Yuri the later one; both read as Thuan. Aya, Nao and Kenji
 * became Nhung and Thao (Thuan’s elder sisters) and Chin. Mrs Higa at the bandai became Miss Higa, the teacher
 * (docs/CAST-PLAN.md). Saves (save.js) and saved
 * looks (avatars/wardrobe.js) written under an old name are read as the new one.
 *
 * These are save-era names: the consolidation (docs/CAST-CONSOLIDATION.md, roster.js) gives Yui, Aya and Nao to the
 * teacher, the purser and the bosun, so save.js applies this table only to saves written before the roster
 * (castRevision 1), and the roster's own historical names are resolved by it from then on.
 */
export const RENAMED_RESIDENTS=Object.freeze({Yuri:'Thuan',Yui:'Thuan',Aya:'Nhung',Nao:'Thao',Kenji:'Chin','Mrs Higa':'Miss Higa'});
const pattern=new RegExp('\\b(?:'+Object.keys(RENAMED_RESIDENTS).join('|')+')\\b','g');
export const renameResidents=text=>typeof text==='string'?text.replace(pattern,old=>RENAMED_RESIDENTS[old]):text;
/**
 * The names someone was known by before: this table's, then the roster's other names for the same person (Fuji's
 * look saved under Mr Fujita, and the other way round), never a save-era name that this table gives somebody else.
 */
export const formerNames=name=>{
 const legacy=Object.keys(RENAMED_RESIDENTS).filter(old=>RENAMED_RESIDENTS[old]===name);
 const roster=namesOf(name).filter(n=>n!==name&&!legacy.includes(n)&&!(Object.hasOwn(RENAMED_RESIDENTS,n)&&identityOf(RENAMED_RESIDENTS[n])!==identityOf(name)));
 return [...legacy,...roster];
};
