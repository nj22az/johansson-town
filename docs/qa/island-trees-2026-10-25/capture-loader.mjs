export async function load(url,context,next){
 const r=await next(url,context);
 if(url.endsWith('/src/world/okinawa/trees.js')){
  let s=r.source.toString();const token="const r=rng(seed),pal=greens||TREE_GREENS[form]||TREE_GREENS.round,parts=broadleafParts(seed,{lite});";
  s=s.replace(token,"globalThis.__TREE_AUDIT__?.push({family:form,h,spread,seed,lite,name,point:kit.point(x,0,z),stack:new Error().stack.split('\\n').slice(2,5)});\n "+token);r.source=s;
 }
 return r;
}
