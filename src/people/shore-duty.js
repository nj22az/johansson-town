/**
 * Who the ferry has called to the quay for her lines (ferry-shore-crew.js): a shore line hand is a street resident
 * (the harbour agent), so the day's plan (social.js residentPlan) must let him go when the ship needs him, wherever
 * his day had him, and the room he is in (a lunch counter, his own office) must let him walk out. The call is a
 * live fact of the running ship, not a saved one; nothing here is written to a save.
 */
const called=new Set();
export const callToQuay=(name,on)=>{if(on)called.add(name);else called.delete(name);};
export const calledToQuay=name=>called.has(name);
