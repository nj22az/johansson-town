/** A temporary reader entry. Shared by flat prints and the 3D woodland viewer. */
let pending=null,serial=0;
export function createReaderHistory(onBack,{key='johanssonPrint',token='reader-'+Date.now()+'-'+(++serial)}={}){
 if(!onBack||!globalThis.window?.history?.pushState||!window.addEventListener)return ()=>{};
 let active=true,pushed=false;
 const pop=e=>{if(active&&pushed&&e.state?.[key]!==token){pushed=false;onBack();}};
 const push=()=>{if(!active)return;try{window.history.pushState({...window.history.state,[key]:token},'',location.href);pushed=true;window.addEventListener('popstate',pop);}catch{}};
 // Traversal is asynchronous in browsers. A quick replacement may only push after
 // the retired reader's Back has completed, even when the two readers are different kinds.
 if(pending)pending.then(push);else push();
 return ()=>{
  active=false;window.removeEventListener('popstate',pop);
  if(pushed&&window.history.state?.[key]===token){
   pushed=false;let finish;const wait=new Promise(resolve=>{finish=resolve;});pending=wait;
   const done=()=>{window.removeEventListener('popstate',done);if(pending===wait)pending=null;finish();};
   window.addEventListener('popstate',done);try{window.history.back();}catch{done();}
  }
 };
}
