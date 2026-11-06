import {FERRY_EXPLORE_ROOMS,ferryLadderRoute} from '../render/ferry-exploration.js';
import {FERRY_H1_SHOTS} from '../world/ferry-engine-room-plan.js';

const labels={'engine-room':'Main engines','control-booth':'Control booth','aux-room':'Auxiliaries',workshop:'Workshop','electrical-workshop':'Electrical workshop','er-ladder':'Engine-room ladder','er-ladder-foot':'Ladder landing'};
const css=`
#ferryExplore{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:84px;z-index:24;max-width:calc(100vw - 24px);font:14px/1.4 system-ui;color:#1f2a25}
#ferryExplore[hidden]{display:none!important}#ferryExplore summary{list-style:none;padding:10px 14px;border:1px solid #fff9;border-radius:22px;background:#fffaf0e8;cursor:pointer;min-height:44px}
#ferryExplore[open]{width:min(420px,calc(100vw - 24px));border-radius:16px;background:#fffaf0f5;box-shadow:0 6px 24px #15292c33}
#ferryExplore .ferry-panel{padding:0 12px 12px;max-height:65dvh;overflow:auto}#ferryExplore p{margin:8px 0}#ferryExplore button,#ferryExplore select{font:inherit;min-height:44px;border:1px solid #889b8d;border-radius:9px;padding:8px;background:#fff;color:#1f2a25;touch-action:manipulation}
#ferryExplore button[aria-pressed=true]{background:#d9ead9;border-color:#3a7153}#ferryExplore .ferry-row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}#ferryExplore label{display:block;margin-top:8px}#ferryExplore select{width:100%}#ferryExplore svg{display:block;width:100%;height:auto;background:#eee8da;border-radius:8px}#ferryExplore svg text{font:10px system-ui;fill:#193735}#ferryExplore .ferry-guide{font-weight:600}
html.ferry-viewing #mobile #stick,html.ferry-viewing #mobile #movementActions{visibility:hidden!important;pointer-events:none!important}
html.ferry-exploring #ferryOperations,html.ferry-exploring #jump{display:none!important}html.hud-photo #ferryExplore{visibility:hidden!important}
@media(max-height:520px){#ferryExplore{bottom:64px}#ferryExplore .ferry-panel{max-height:55dvh}}
`;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const px=p=>[+(p.z+17.25-8)*22,+(4-p.x)*22];

/** Small, collapsible controls; a measured plan and directions, never a teleport. */
export function createFerryExplorationUI({explorer,onChange=()=>{},doc=document}={}){
 const style=doc.createElement('style');style.textContent=css;doc.head.append(style);
 const root=doc.createElement('details');root.id='ferryExplore';root.hidden=true;
 root.innerHTML=`<summary aria-label="Engine room exploration controls">Engine room · Explore</summary><div class="ferry-panel">
 <p data-place></p><div class="ferry-row"><button type="button" data-walk>Explore</button><button type="button" data-precision aria-pressed="false">Precision speed</button><button type="button" data-views>Saved views</button></div>
 <p>Left thumb moves · drag the view to look. WASD moves · right-drag or IJKL looks. V selects a saved view; Escape returns.</p>
 <label>Inspect nearby machinery<select aria-label="Nearby engine-room machinery" data-machinery><option value="">Choose machinery…</option></select></label>
 <div class="ferry-row"><button type="button" data-inspect>Inspect machinery</button><button type="button" data-in aria-label="Zoom in on machinery">Zoom in</button><button type="button" data-out aria-label="Zoom out from machinery">Zoom out</button></div>
 <label>Optional camera angle<select aria-label="Saved engine-room camera angle" data-angle><option value="">Choose a view…</option>${FERRY_H1_SHOTS.map((s,i)=>`<option value="${i}">${escape(s.label)}</option>`).join('')}</select></label>
 <div class="ferry-row"><button type="button" data-guide aria-pressed="false">Guide to ladder</button></div><p class="ferry-guide" data-guidance></p><div data-map></div></div>`;
 doc.body.append(root);
 root.addEventListener('keydown',e=>{if(['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName)&&e.code!=='Escape')e.stopPropagation();});
 const setSummary=text=>{const el=root.querySelector('summary');if(el.textContent!==text)el.textContent=text;};
 const find=s=>root.querySelector(s);let lastItems='',items=[],guide=false,route=[],routeStart=null,lastTick=-Infinity;
 const changed=()=>{onChange();lastTick=-Infinity;};
 find('summary').onclick=e=>{e.preventDefault();root.open=!root.open;changed();};
 find('[data-walk]').onclick=()=>{explorer.walk();changed();};
 find('[data-precision]').onclick=()=>{explorer.precision=!explorer.precision;changed();};
 find('[data-views]').onclick=()=>{explorer.overview();changed();};
 find('[data-angle]').onchange=e=>{if(e.target.value!==''){explorer.overview(Number(e.target.value));changed();}};
 find('[data-inspect]').onclick=()=>{const selected=find('[data-machinery]').value;explorer.inspect(items.find(t=>t.id===selected)||items[0]);changed();};
 find('[data-machinery]').onchange=()=>{const t=items.find(t=>t.id===find('[data-machinery]').value);if(t){explorer.inspect(t);changed();}};
 find('[data-in]').onclick=()=>{explorer.zoom(.8);changed();};find('[data-out]').onclick=()=>{explorer.zoom(1.25);changed();};
 find('[data-guide]').onclick=()=>{guide=!guide;route=[];routeStart=null;changed();};
 return {
  update(now){
   const active=explorer.active;root.hidden=!active;doc.documentElement.classList.toggle('ferry-exploring',active);doc.documentElement.classList.toggle('ferry-viewing',active&&explorer.mode!=='walk');
   if(!active){guide=false;route=[];routeStart=null;return;}
   if(now-lastTick<150)return;lastTick=now;
   const local=explorer.local,place=labels[explorer.floor]||'Engine room',mode=explorer.mode;
   let summary=place+' · '+(mode==='walk'?'Explore':mode==='inspect'?'Inspect':'Saved view');
   find('[data-place]').textContent=mode==='inspect'?explorer.focus.title:place+' · '+(explorer.precision?'0.35 m/s precision':'1 m/s walking');
   find('[data-walk]').setAttribute('aria-pressed',String(mode==='walk'));find('[data-precision]').setAttribute('aria-pressed',String(explorer.precision));
   find('[data-views]').setAttribute('aria-pressed',String(mode==='overview'));find('[data-guide]').setAttribute('aria-pressed',String(guide));
   for(const s of ['[data-in]','[data-out]'])find(s).disabled=mode!=='inspect';
   if(!root.open&&!guide){setSummary(summary);return;}
   items=explorer.nearby();const key=items.map(t=>t.id).join(',');
   if(key!==lastItems){lastItems=key;find('[data-machinery]').innerHTML='<option value="">Choose machinery…</option>'+items.map(t=>`<option value="${escape(t.id)}">${escape(t.label)}</option>`).join('');}
   find('[data-inspect]').disabled=!items.length;
   let next=null;
   if(guide){
    if(explorer.floor==='er-ladder'){setSummary(summary);find('[data-guidance]').textContent='You are on the ladder · follow it up to the car deck.';return;}
    if(!route.length||!routeStart||routeStart.distanceTo(local)>.8){route=ferryLadderRoute(local);routeStart=local.clone();}
    let near=0,best=Infinity;for(let i=0;i<route.length;i++){const d=Math.hypot(route[i].x-local.x,route[i].z-local.z);if(d<best){near=i;best=d;}}
    next=route[Math.min(route.length-1,near+2)];
    const end=route.at(-1),distance=end?Math.hypot(end.x-local.x,end.z-local.z):Infinity;
    find('[data-guidance]').textContent=!next?'The standing path is blocked here. Use inspection to look around the obstruction.':distance<.6?'Ladder reached · use “Up to the car deck”.':'Follow the blue route to the ladder. You remain in control.';
   }else find('[data-guidance]').textContent='Plan viewed from above · blue arrow: you · yellow square: ladder.';
   if(guide&&next){const a=Math.atan2(-(next.x-local.x),-(next.z-local.z))-explorer.heading,i=((Math.round(a/(Math.PI/4))%8)+8)%8;summary=place+' · Ladder '+['↑','↖','←','↙','↓','↘','→','↗'][i];}
   setSummary(summary);
   if(!root.open)return;
   const [x,z]=px(local),goal=px({x:3.575,z:9.1-17.25});
   const rectangles=FERRY_EXPLORE_ROOMS.slice().sort((a,b)=>(b.x[1]-b.x[0])*(b.z[1]-b.z[0])-(a.x[1]-a.x[0])*(a.z[1]-a.z[0])).map(f=>{const a=px({x:f.x[1],z:f.z[0]}),b=px({x:f.x[0],z:f.z[1]});return `<rect x="${a[0]}" y="${a[1]}" width="${b[0]-a[0]}" height="${b[1]-a[1]}" fill="#d8e4d2" stroke="#526b60"/><text x="${a[0]+3}" y="${a[1]+12}">${escape(labels[f.id])}</text>`;}).join('');
   find('[data-map]').innerHTML=`<svg viewBox="0 0 410 176" role="img" aria-label="Measured engine-room plan showing your position and the ladder">${rectangles}${guide&&route.length?`<polyline points="${route.map(p=>px(p).join(',')).join(' ')}" fill="none" stroke="#2170a5" stroke-width="3"/>`:''}<rect x="${goal[0]-4}" y="${goal[1]-4}" width="8" height="8" fill="#d1a322"/><path d="M 7 0 L -4 -4 L -4 4 Z" transform="translate(${x} ${z}) rotate(${(Math.PI-explorer.heading)*180/Math.PI})" fill="#155c94" stroke="white" stroke-width="1.5"/></svg>`;
  },
 };
}
