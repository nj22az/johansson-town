/** The Town Book keeps a home's address separate from a person's current whereabouts. */
const mounted=new WeakMap();
const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const compare=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
const textOfHome=home=>[home?.address,...home?.residents||[]].join(' ');
const initials=name=>name.split(/\s+/).filter(Boolean).filter(w=>!['Mr','Mrs','Ms','Miss','Grandmother','Officer'].includes(w)).slice(0,2).map(w=>w[0]).join('');
const placeIsHome=p=>p.isResidence||p.homeId||p.familyHome||p.id==='mayor-home'||/^(home-|resident-home-)/.test(p.id);

/**
 * Callbacks receive the actual route target: onShowHome(target,card,home), onFindPerson(target,card),
 * onPlace(place), onShortcut(place), onStudio(), onTravelProgress(). No callback moves somebody here.
 * Resident records are optional: canRecord(name) enables onRecord(name,card) for supported residents.
 * Playing as a resident is optional too: canPlayAs(name) enables onPlayAs(name,card); playing(name) marks who you are.
 * refresh(cards) preserves the search, filter and controls while updating residents' whereabouts.
 */
export function renderTownDirectory(container,{cards=[],places=[],progress={},onShowHome,onFindPerson,onPlace,onShortcut,onStudio,onTravelProgress,onRecord,canRecord,onPlayAs,canPlayAs,playing}={}){
 mounted.get(container)?.destroy();
 const doc=container.ownerDocument||document;
 const el=(tag,className,value)=>{const n=doc.createElement(tag);if(className)n.className=className;if(value!==undefined)n.textContent=value;return n;};
 const button=(label,className,action)=>{const b=el('button',className,label);b.type='button';b.onclick=action;return b;};
 const action=(label,handler,target,className='town-action')=>{
  const b=button(label,className,()=>target&&handler?.());b.disabled=!target;return b;
 };
 const distinctPlaces=[...new Map(places.filter(p=>p?.id&&!placeIsHome(p)).map(p=>[p.id,p])).values()]
  .sort((a,b)=>compare(a.title||a.id,b.title||b.id));
 let currentCards=cards,disposed=false;
 let filter=['places','homes','people'].includes(container.dataset.townFilter)?container.dataset.townFilter:'places';
 let query=container.dataset.townSearch||'';
 const root=el('section','town-book'),searchLabel=el('label','town-search-label','Find a place, home or resident');
 const search=el('input','town-search');search.type='search';search.value=query;search.placeholder='Name, address or place';
 search.autocomplete='off';search.spellcheck=false;search.setAttribute('aria-label','Find a place, home or resident');
 searchLabel.append(search);
 const filters=el('div','town-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Town Book sections');
 const tabs=new Map();
 for(const [id,label] of [['places','Places'],['homes','Homes'],['people','People']]){
  const b=button(label,'town-filter',()=>{filter=id;render();});b.dataset.townFilter=id;b.dataset.label=label;tabs.set(id,b);filters.append(b);
 }
 const status=el('p','town-results');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const list=el('div','town-cards'),footer=el('div','town-book-tools');
 if(onTravelProgress){
  const label=progress.unlocked?'Town shortcuts unlocked':`Town shortcuts · ${progress.completed??0}/${progress.total??0} favours complete`;
  footer.append(button(label,'town-tool',()=>onTravelProgress()));
 }
 if(onStudio)footer.append(button('Open Studio','town-tool',()=>onStudio()));
 root.append(searchLabel,filters,status,list,footer);container.classList.add('town-directory');container.replaceChildren(root);
 const detail=(dl,label,value)=>{dl.append(el('dt','',label),el('dd','',value||'Location unavailable'));};
 const makeCard=(category,title,eyebrow)=>{
  const article=el('article','town-card town-card-'+category),head=el('div','town-card-head');
  const heading=el('div','town-heading');if(eyebrow)heading.append(el('p','town-eyebrow',eyebrow));heading.append(el('h3','',title));
  head.append(heading);article.append(head);return {article,head};
 };
 function personCard(card){
  const {article,head}=makeCard('person',card.name,card.role),avatar=el('span','town-initials',initials(card.name));
  avatar.setAttribute('aria-hidden','true');head.prepend(avatar);article.dataset.personId=card.id;
  const dl=el('dl','town-details');detail(dl,'Home',card.home?.address);
  for(const home of card.secondaryHomes||[])detail(dl,'Weekday room',home.address);
  detail(dl,'Current location',(card.current?.source==='schedule'?'Expected: ':'')+(card.current?.locationLabel||'Location unavailable'));
  article.append(dl);
  if(card.current?.activity)article.append(el('p','town-activity',card.current.activity+(card.current.source==='schedule'?' · usual schedule':'')));
  const actions=el('div','town-actions');
  const show=action('Show home',()=>onShowHome?.(card.homeTarget,card,card.home),card.homeTarget);
  show.dataset.showHome=card.home?.id||'';show.setAttribute('aria-label','Show '+card.name+'’s home');
  const find=action('Find person',()=>onFindPerson?.(card.personTarget,card),card.personTarget,'town-action town-primary');
  find.dataset.findPerson=card.id;find.setAttribute('aria-label','Find '+card.name);
  actions.append(show,find);
  if(onRecord&&canRecord?.(card.name)){
   const record=button('Resident record','town-action',()=>onRecord(card.name,card));
   record.dataset.residentRecord=card.name;record.setAttribute('aria-label','Open '+card.name+'’s resident record');actions.append(record);
  }
  if(onPlayAs&&canPlayAs?.(card.name)){
   const now=!!playing?.(card.name),play=button(now?'Playing now':'Play as '+card.name,'town-action',()=>onPlayAs(card.name,card));
   play.disabled=now;play.dataset.playAs=card.name;play.setAttribute('aria-label',now?'You are playing as '+card.name:'Play as '+card.name);actions.append(play);
  }
  article.append(actions);return article;
 }
 function homeCard({home,card}){
  const title=home.residents.length?home.residents.join(' · '):'Vacant home';
  const {article}=makeCard('home',title,home.island==='kitano'?'Kitano-jima':'Minato Island');article.dataset.homeId=home.id;
  article.append(el('p','town-address',home.address));
  if(home.unit)article.append(el('p','town-activity','Ground floor · its own gate and front door on Fukugi Lane'));
  if(card.secondaryHomes?.some(h=>h.id===home.id))article.append(el('p','town-activity',card.name+'’s duty berth aboard'));
  const actions=el('div','town-actions'),show=action('',()=>onShowHome?.(home.target,card,home),home.target,'town-action town-primary');
  show.dataset.showHome=home.id;show.dataset.id=home.target.id;show.dataset.travel='locked';show.setAttribute('aria-label','Show home at '+home.address);
  show.append(el('b','town-sr-only',home.target.title||home.address),el('span','','Show home'));actions.append(show);
  if(progress.unlocked&&onShortcut){const shortcut=button('Shortcut','town-action',()=>onShortcut(home.target));shortcut.dataset.shortcut=home.target.id;shortcut.dataset.travel='ready';shortcut.setAttribute('aria-label','Shortcut to '+home.address);actions.append(shortcut);}
  article.append(actions);return article;
 }
 function placeCard(place){
  // A name, one line and Directions; what it is and how to find it open with a tap on the card.
  const {article}=makeCard('place',place.title||place.id);article.dataset.placeId=place.id;
  if(place.line)article.append(el('p','town-address',place.line));
  const more=el('div','town-more');more.hidden=true;
  more.append(el('p','town-eyebrow',place.sub||place.category||'Place'));
  if(place.directions)more.append(el('p','town-activity',place.directions));
  article.append(more);article.classList.add('town-expandable');
  article.addEventListener('click',e=>{if(!e.target.closest?.('button'))more.hidden=!more.hidden;});
  const actions=el('div','town-actions'),directions=action('',()=>onPlace?.(place),place,'town-action town-primary');
  directions.dataset.id=place.id;directions.dataset.travel='locked';directions.setAttribute('aria-label','Directions to '+(place.title||place.id));
  // Existing travel tools read the destination's b text. The visible action stays explicit.
  directions.append(el('b','town-sr-only',place.title||place.id),el('span','','Directions'));actions.append(directions);
  if(progress.unlocked&&onShortcut){const shortcut=button('Shortcut','town-action',()=>onShortcut(place));shortcut.dataset.shortcut=place.id;shortcut.dataset.travel='ready';shortcut.setAttribute('aria-label','Shortcut to '+(place.title||place.id));actions.append(shortcut);}
  article.append(actions);return article;
 }
 function render(){
  if(disposed)return;
  container.dataset.townFilter=filter;container.dataset.townSearch=query;
  const q=fold(query.trim()),matches=text=>!q||fold(text).includes(q),homes=new Map();
  for(const card of currentCards)for(const home of [card.home,...card.secondaryHomes||[]])if(home?.target&&!homes.has(home.id))homes.set(home.id,{home,card});
  const allHomes=[...homes.values()].sort((a,b)=>compare(a.home.district||'',b.home.district||'')||compare(a.home.address,b.home.address));
  const allPeople=[...currentCards].sort((a,b)=>compare(a.name,b.name));
  const entries={
   places:distinctPlaces.filter(p=>matches([p.title,p.line,p.sub,p.category,p.directions].join(' '))),
   homes:allHomes.filter(({home})=>matches(textOfHome(home))),
   people:allPeople.filter(c=>matches([c.name,c.role,textOfHome(c.home),...(c.secondaryHomes||[]).map(textOfHome),c.current?.locationLabel,c.current?.activity].join(' '))),
  };
  for(const [id,b] of tabs){b.textContent=b.dataset.label+' ('+entries[id].length+')';b.setAttribute('aria-pressed',String(filter===id));}
  const shown=entries[filter],label=filter==='people'?'people':filter;
  const resultLabel=shown.length===1?{places:'place',homes:'home',people:'person'}[filter]:label;
  status.textContent=shown.length+' '+resultLabel+(q?' matching “'+query.trim()+'”':'');
  list.replaceChildren(...shown.map(filter==='places'?placeCard:filter==='homes'?homeCard:personCard));
  if(!shown.length){const empty=el('div','town-empty');empty.append(el('h3','','No '+label+' found'),el('p','','Try another name or address, or choose another section.'));if(q)empty.append(button('Clear search','town-action',()=>{search.value=query='';render();search.focus();}));list.append(empty);}
 }
 search.oninput=()=>{query=search.value;render();};
 const api={refresh(nextCards){currentCards=nextCards||[];render();},destroy(){if(disposed)return;disposed=true;search.oninput=null;container.replaceChildren();container.classList.remove('town-directory');if(mounted.get(container)===api)mounted.delete(container);}};
 mounted.set(container,api);render();return api;
}
