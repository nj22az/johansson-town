import {dailyEdition} from './storyteller.js';
import {feedPlace} from './places.js';
import {renderComic,releaseComicRenderer} from './comic.js';

/**
 * The town feed on the title page's guide: each day's edition from the storyteller, newest
 * first, as LINE-style posts. Comics are drawn only when they scroll into view, one at a time.
 */
const DAY=86400000;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDay=time=>{const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const when=days=>days===0?'Today':days===1?'Yesterday':days+' days ago';
const KIND={comic:'Comic',recipe:'Recipe',course:'Short course',overheard:'Overheard'};

export function mountTownFeed({list,more,catalogue=window.JOHANSSON_RESIDENT_GUIDE||[],base='./',now=Date.now()}={}){
 if(!list||!catalogue.length)return null;
 const photo=name=>catalogue.find(r=>r.name===name)?.article?.photos?.[0]?.file||catalogue.find(r=>r.name===name)?.portrait;
 const queue=[];let drawing=false,shown=0;
 const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){observer.unobserve(e.target);queue.push(e.target);}draw();},{rootMargin:'300px'});

 async function draw(){
  if(drawing)return;drawing=true;
  try{while(queue.length){
   const figure=queue.shift(),post=figure.__post;
   try{
    const url=await renderComic({panels:post.panels||[{say:post.by,line:post.line,actors:post.actors,fx:post.fx,bg:post.bg,sfx:post.sfx,focus:post.by,shot:'medium'}],place:post.place,props:post.props,sitting:post.sitting},{base});
    const img=figure.querySelector('img');img.src=url;figure.classList.add('drawn');
   }catch(error){console.warn('Town feed comic:',error.message);figure.classList.add('failed');}
   await new Promise(r=>setTimeout(r,0));
  }}finally{drawing=false;if(!queue.length)releaseComicRenderer();}
 }

 function card(post,days){
  const article=document.createElement('article');article.className='feed-post post-'+post.type;
  const by=post.by||post.cast[0],avatar=photo(by);
  const head=`<header class="feed-head">${avatar?`<img class="feed-avatar" src="${base}${escape(avatar)}" alt="" width="40" height="40" loading="lazy">`:''}<div><b>${escape(by)}</b><span>${escape(feedPlace(post.place)?.name||post.placeName)} · ${when(days)}</span></div><span class="feed-kind">${KIND[post.type]}</span></header>`;
  let body='';
  if(post.type==='comic'||post.type==='overheard'){
   const lines=(post.panels||[{say:post.by,line:post.line}]).map(p=>(p.say?p.say+': ':'')+p.line);
   body=`<h3>${escape(post.title)}</h3><figure class="feed-comic"><img alt="${escape(lines.join(' / '))}"><figcaption class="sr-only">${lines.map(escape).join('<br>')}</figcaption></figure>`;
  }else if(post.type==='recipe'){
   body=`<h3>${escape(post.title)}</h3><p class="feed-meta">Serves ${post.serves} · ${post.minutes} minutes</p><div class="feed-recipe"><section><h4>You need</h4><ul>${post.ingredients.map(i=>`<li>${escape(i)}</li>`).join('')}</ul></section><section><h4>Method</h4><ol>${post.steps.map(s=>`<li>${escape(s)}</li>`).join('')}</ol></section></div><p class="feed-tip">${escape(post.tip)}</p>`;
  }else if(post.type==='course'){
   body=`<h3>${escape(post.title)}</h3><ol class="feed-lessons">${post.lessons.map((l,i)=>`<li><span>Lesson ${i+1}</span>${escape(l)}</li>`).join('')}</ol><p class="feed-tip">${escape(post.exam)}</p>`;
  }
  article.innerHTML=head+body;
  const figure=article.querySelector('.feed-comic');if(figure){figure.__post=post;observer.observe(figure);}
  return article;
 }

 function showDays(count){
  for(let i=0;i<count;i++,shown++){
   const date=localDay(now-shown*DAY),edition=dailyEdition(date,catalogue);
   const day=document.createElement('section');day.className='feed-day';day.setAttribute('aria-label',when(shown));
   day.innerHTML=`<p class="feed-date">${when(shown)}</p>`;
   edition.forEach(post=>day.append(card(post,shown)));
   list.append(day);
  }
 }
 showDays(1);
 more?.addEventListener('click',()=>showDays(2));
 return {showDays};
}
