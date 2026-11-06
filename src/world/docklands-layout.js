/** Cargo yard extends the western quay, with the workshop entrance kept clear. */
export const DOCKLANDS=Object.freeze({id:'docklands-yard',surface:'stone',minX:-39,maxX:-18,minZ:-49.7,maxZ:-38.3,y:0});
export const docklandsAt=(x,z,r=0)=>x>=DOCKLANDS.minX+r&&x<=DOCKLANDS.maxX-r&&z>=DOCKLANDS.minZ+r&&z<=DOCKLANDS.maxZ-r;
export const DOCK_CREW_ROUTE=Object.freeze([[-35.8,-38.3],[-29.8,-38.3],[-29.8,-39.1],[-35.8,-39.1]]);
export const cargoShift=minutes=>{const h=((minutes%1440)+1440)%1440;return h>=420&&h<1320;};
