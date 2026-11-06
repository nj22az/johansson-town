// Both existing entry import paths (plain and ?snappy=1) share one readiness/cache
// boundary. A second module instance must not load or fall back to another room.
export const minatoAssets=new Map();
export const minatoLoading=new Map();
