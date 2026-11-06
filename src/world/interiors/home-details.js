// Everyday objects come from the household registry, so each home tells the same
// story as the people encountered outside. Small props stay on existing furniture.
const DETAILS=Object.freeze([
 {match:/weav|bashōfu|cloth/i,kind:'weaving',label:'Weaving basket',text:'Bashōfu thread, a half-finished cloth and a carefully wound bobbin wait for the next quiet afternoon.',colour:0xba9977},
 {match:/sanshin/i,kind:'music',label:'Sanshin and music book',text:'The three-string sanshin rests beside a marked practice book. Its cloth cover has been folded for the Saturday lesson.',colour:0x81593c},
 {match:/hair|barber/i,kind:'hair',label:'Hairdressing case',text:'A comb, scissors and a clean folded towel are ready for the next neighbour’s haircut.',colour:0x8d729b},
 {match:/post|letter|collection/i,kind:'post',label:'Postal round bag',text:'The canvas round bag holds sorted envelopes. A pencilled collection sheet lists 10:30 and 16:30.',colour:0x566e59},
 {match:/nurse|doctor|clinic/i,kind:'clinic',label:'Clinic pouch',text:'A clean cloth pouch holds the clinic notebook and spare dressings, with tomorrow’s shift written on the cover.',colour:0xc48a86},
 {match:/electric|power|repair|radio|workshop|generator/i,kind:'tools',label:'Repair case',text:'A screwdriver, spare fuse and labelled parts tin lie beside a repair notebook. The tools have their own places.',colour:0x5e7c83},
 {match:/water lorry|driv|bus/i,kind:'driver',label:'Driver’s logbook',text:'A route sheet, vehicle keys and a pencilled inspection log are ready to pick up at the start of the shift.',colour:0xa68959},
 {match:/ferry|deckhand|ticket|harbour|mooring/i,kind:'ferry',label:'Seafarer’s bag',text:'A canvas duffel, folded ferry timetable and a little radio are packed for the next crossing.',colour:0x5f839a},
 {match:/fish|catch|boat|sabani|auction|ice plant/i,kind:'fishing',label:'Net-mending tray',text:'A coil of line, a wooden net needle and the morning catch notebook are drying indoors after work at the quay.',colour:0x729487},
 {match:/farmer|grow|goya|papaya|cane/i,kind:'garden',label:'Seed tray',text:'Saved goya seeds, a plant label and a little watering can share a tray. The harvest dates are pencilled in the notebook.',colour:0x719657},
 {match:/book|paper|edit|teacher|pupil/i,kind:'books',label:'Reading and writing corner',text:'A dog-eared book, a pencil and a half-filled notebook mark the place where the day’s reading stopped.',colour:0x9d704f},
 {match:/cook|ramen|izakaya|shaved|confection|andagi|shop|sakura|house|retired|utaki|gateball/i,kind:'recipe',label:'Household notebook',text:'Shopping notes, a favourite recipe and the household accounts are kept together, with a pencil tucked into the page.',colour:0xb88d61},
]);
export function householdDetails(members=[]){
 const details=[],kinds=new Set();
 for(const member of members){
  const found=DETAILS.find(d=>d.match.test(member.purpose||member.role||''))||DETAILS[DETAILS.length-1];
  if(!kinds.has(found.kind)){kinds.add(found.kind);details.push({...found,owner:member.name});}
 }
 return details;
}

/** Compact silhouettes in the town's warm, readable toy-like palette. */
export function addPersonalObject(box,{x,y,z,detail,scale=1}){
 const p=(size,at,c,name)=>box(size.map(n=>n*scale),[x+at[0]*scale,y+at[1]*scale,z+at[2]*scale],c,name||detail.label);
 const paper=()=>{p([.24,.018,.19],[.04,.009,0],0xf4ecd5);p([.018,.02,.2],[.13,.027,.01],0x6d5238,'Pencil');};
 const bag=()=>{p([.26,.2,.18],[-.04,.1,0],detail.colour);p([.16,.035,.025],[-.04,.21,0],0x604b39,'Bag handle');};
 if(['post','clinic','ferry','hair','tools'].includes(detail.kind)){bag();p([.08,.026,.13],[.2,.013,.015],0xdfd9c3,detail.kind==='post'?'Sorted letters':'Parts and notes');}
 else if(detail.kind==='fishing'){p([.22,.055,.16],[-.06,.028,0],detail.colour);p([.1,.02,.09],[-.06,.06,0],0xddc899,'Coiled mending line');p([.025,.025,.2],[.13,.014,.01],0x8a6a46,'Net needle');}
 else if(detail.kind==='garden'){p([.24,.035,.19],[0,.018,0],0xc58b60);for(const dx of [-.075,0,.075])p([.04,.06,.035],[dx,.064,0],detail.colour,'Seed packets');}
 else if(detail.kind==='weaving'){p([.25,.12,.18],[0,.06,0],detail.colour);p([.2,.035,.14],[0,.136,0],0xecd9b0,'Folded bashōfu cloth');p([.04,.07,.04],[.17,.035,0],0x8f7874,'Thread bobbin');}
 else if(detail.kind==='music'){p([.14,.05,.13],[-.06,.026,0],0x5b4230);p([.027,.026,.31],[-.06,.05,-.18],detail.colour,'Sanshin neck');p([.2,.02,.17],[.15,.01,0],0xeee2bf,'Music book');}
 else if(detail.kind==='driver'){paper();p([.06,.016,.04],[-.12,.008,.01],0x8f9a96,'Vehicle keys');}
 else {paper();p([.16,.032,.2],[-.1,.016,-.02],detail.colour,detail.kind==='books'?'Favourite book':'Recipe book');}
}

/** A geometric family portrait avoids external textures and coplanar image layers. */
export function addFamilyPhoto(box,{x,z,members,westWall=false}){
 const count=Math.min(members.length,4),width=Math.max(.28,count*.12+.12);
 const p=(w,h,d,px,py,pz,c,name)=>box(westWall?[d,h,w]:[w,h,d],[px,py,pz],c,name);
 p(width,.35,.045,x,1.72,z,0x765940,'Framed household photograph');
 // Both supported walls face inward along their positive axis. Negative z put
 // the back-wall artwork behind its opaque frame and made it look blank.
 const out=.028;
 p(width-.06,.29,.008,x+(westWall?out:0),1.72,z+(westWall?0:out),0xd5d8af,'Photograph background');
 members.slice(0,4).forEach((member,i)=>{
  const across=(i-(count-1)/2)*.12,depth=.035;
  const px=x+(westWall?depth:across),pz=z+(westWall?across:depth);
  p(.085,.11,.006,px,1.68,pz,[0x75958a,0xb58c73,0x8193b0,0xb69b68][i%4],'Photograph of '+member.name);
  p(.066,.068,.006,px,1.769,pz,0xe5b89b,'Portrait face');
 });
}

export function addTeaSetting(box,{x,y,z,people=1}){
 box([.17,.08,.16],[x,y+.04,z],0x739385,'Tea pot');
 box([.055,.04,.055],[x,y+.1,z],0x739385,'Tea pot lid');
 for(let i=0;i<Math.min(people,3);i++)box([.075,.075,.075],[x+.22,y+.038,z+(i-1)*.11],0xe2d8bd,'Used tea cup');
}
