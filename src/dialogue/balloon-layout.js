/** Screen-space speech placement. Faces matter most; a line prefers the speaker's side. */
const clamp=(n,a,b)=>Math.max(a,Math.min(Math.max(a,b),n));
const right=r=>r.left+r.width,bottom=r=>r.top+r.height;
export const overlapArea=(a,b)=>Math.max(0,Math.min(right(a),right(b))-Math.max(a.left,b.left))*Math.max(0,Math.min(bottom(a),bottom(b))-Math.max(a.top,b.top));
const collision=(box,obstacles)=>obstacles.reduce((sum,o)=>sum+overlapArea(box,o)*(o.weight??1),0);

/** sizes are measured with the complete text, so typing never changes the chosen footprint. */
export function layoutBalloon({viewport,anchor,face,obstacles=[],sizes,previous=null,gap=14}){
 const area=viewport,focus=face||{left:anchor.x-18,top:anchor.y-18,width:36,height:36};
 const candidates=[];
 for(const size of sizes){
  if(size.width>area.width||size.height>area.height)continue;
  const xs=[focus.left-gap-size.width,right(focus)+gap,area.left,right(area)-size.width];
  const ys=[anchor.y-size.height*.35,focus.top,bottom(focus)+gap,focus.top-gap-size.height,area.top,bottom(area)-size.height];
  // A second face can make a useful gap within the scene, rather than only at its edges.
  for(const o of obstacles){xs.push(o.left-gap-size.width,right(o)+gap);ys.push(o.top-gap-size.height,bottom(o)+gap);}
  for(const x of xs)for(const y of ys){
   const box={left:clamp(x,area.left,right(area)-size.width),top:clamp(y,area.top,bottom(area)-size.height),...size};
   const side=right(box)<=focus.left+1?'left':box.left>=right(focus)-1?'right':bottom(box)<=focus.top+1?'above':'below';
   const distance=Math.hypot(anchor.x-clamp(anchor.x,box.left,right(box)),anchor.y-clamp(anchor.y,box.top,bottom(box)));
   const hits=collision(box,obstacles),sideCost=['left','right'].includes(side)?0:34;
   const score=hits*8+distance*.35+sideCost+Math.max(0,sizes[0].width-size.width)*.12+(size.fallback?100:0)+(previous&&previous.side!==side?24:0);
   candidates.push({...box,side,score,hits});
  }
 }
 candidates.sort((a,b)=>a.score-b.score);
 let best=candidates[0];
 // When an unusually long line fills every gap, keep a clear reading area and let
 // the complete text scroll there. Never trade a person's face for a few more lines.
 if(!best||best.hits>0){
  const clear=[];
  for(const size of sizes){
   if(size.width>area.width)continue;
   const xs=[area.left,right(area)-size.width,...obstacles.flatMap(o=>[o.left-gap-size.width,right(o)+gap])];
   const ys=[area.top,...obstacles.map(o=>bottom(o)+gap)];
   for(const x of xs)for(const y of ys){
    const left=clamp(x,area.left,right(area)-size.width);let height=Math.min(size.height,bottom(area)-y);
    for(const o of obstacles)if(left<right(o)&&left+size.width>o.left&&bottom(o)>y)height=Math.min(height,o.top-gap-y);
    height=Math.floor(height/8)*8;if(height<Math.min(120,size.height)||y<area.top)continue;
    const box={left,top:y,width:size.width,height},hits=collision(box,obstacles);if(hits)continue;
    const side=right(box)<=focus.left+1?'left':box.left>=right(focus)-1?'right':bottom(box)<=focus.top+1?'above':'below';
    const distance=Math.hypot(anchor.x-clamp(anchor.x,left,right(box)),anchor.y-clamp(anchor.y,y,bottom(box)));
    clear.push({...box,side,hits,score:(1-height/size.height)*1000+distance*.35,overflow:height<size.height});
   }
  }
  clear.sort((a,b)=>a.score-b.score);if(clear.length)best=clear[0];
 }
 if(!best){const size=sizes.at(-1)||{width:area.width,height:area.height};return {left:area.left,top:area.top,width:Math.min(area.width,size.width),height:area.height,side:'above',overflow:true};}
 // Keep subpixel animation from making text shimmer. Never retain a position that newly covers a face.
 if(previous&&previous.side===best.side&&previous.width===best.width&&previous.height===best.height&&Math.abs(previous.left-best.left)<3&&Math.abs(previous.top-best.top)<3&&collision(previous,obstacles)<=best.hits+1&&previous.left>=area.left&&right(previous)<=right(area)&&previous.top>=area.top&&bottom(previous)<=bottom(area))return {...best,left:previous.left,top:previous.top};
 return best;
}

/** The tail attaches to the nearest edge, independently of which placement candidate won. */
export function balloonTail(box,anchor){
 const inset=Math.min(24,box.width/4,box.height/4),x=clamp(anchor.x-box.left,inset,box.width-inset),y=clamp(anchor.y-box.top,inset,box.height-inset);
 const sides=[['left',Math.abs(anchor.x-box.left)],['right',Math.abs(anchor.x-right(box))],['top',Math.abs(anchor.y-box.top)],['bottom',Math.abs(anchor.y-bottom(box))]];
 if(anchor.x<box.left)return {edge:'left',x:0,y};if(anchor.x>right(box))return {edge:'right',x:box.width,y};
 if(anchor.y<box.top)return {edge:'top',x,y:0};if(anchor.y>bottom(box))return {edge:'bottom',x,y:box.height};
 return {edge:sides.sort((a,b)=>a[1]-b[1])[0][0],x,y};
}
