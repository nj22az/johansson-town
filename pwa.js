const install=document.getElementById('installTown'),help=document.getElementById('iosFullscreen');
let prompt;
const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=/iPhone|iPad|iPod/.test(navigator.userAgent);
if(install)install.hidden=installed()||!ios;
addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;if(install&&!installed())install.hidden=false;});
install?.addEventListener('click',async()=>{if(prompt){await prompt.prompt();prompt=null;install.hidden=true;}else help?.classList.remove('hidden');});
if('serviceWorker' in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname))){
 const hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
  const check=()=>{if(navigator.onLine)reg.update().catch(()=>{});};check();addEventListener('focus',check);addEventListener('online',check);
  reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='activated'&&hadController){const old=document.getElementById('townUpdate');if(old)return;const button=document.createElement('button');button.id='townUpdate';button.textContent='Town updated · save & reopen';button.style.cssText='position:fixed;bottom:max(12px,env(safe-area-inset-bottom));left:12px;z-index:10000;padding:12px 16px;background:#fff2d3;color:#294b60;border:2px solid #294b60;border-radius:14px;font:700 14px sans-serif';button.onclick=()=>{dispatchEvent(new Event('johansson-save'));location.reload();};document.body.append(button);}});});
 }).catch(()=>{/* Installation help and online play still work without a worker. */});
}
