/** Measured exterior steel stairs: ordinary risers, deep treads and two handrails. */
export function stairFlight(kit,solid,{id,x,z,width=1.4,length,height,base=0,axis='z',direction=1}){
 const count=Math.ceil(height/.18),rise=height/count,tread=length/count;
 if(tread<.26-1e-9)throw new Error(id+': stair treads are too shallow');
 const bounds=(a,b,lo=-width/2,hi=width/2)=>axis==='z'?[x+lo,x+hi,z+direction*a,z+direction*b]:[x+direction*a,x+direction*b,z+lo,z+hi];
 const rect=(a,b,lo,hi,y)=>{let [x0,x1,z0,z1]=bounds(a,b,lo,hi);return [Math.min(x0,x1),Math.max(x0,x1),Math.min(z0,z1),Math.max(z0,z1),y];};
 for(let i=0;i<count;i++){
  const [x0,x1,z0,z1,y]=rect(i*tread,(i+1)*tread,-width/2,width/2,base+(i+1)*rise);
  kit.block(x0,x1,y-.1,y,z0,z1,0xcdc7ba,'metal');kit.level(x0,x1,z0,z1,y,id);
 }
 for(const side of [-1,1]){
  const a=bounds(0,length,side*(width/2+.025),side*(width/2+.025));
  const start=[a[0],base+1,a[2]],end=[a[1],base+height+1,a[3]];
  kit.rod([a[0],base-.06,a[2]],[a[1],base+height-.06,a[3]],.065,0x788386,{finish:'metal'});
  kit.rod(start,end,.03,0x788386,{finish:'metal'});
  for(let i=0;i<=count;i+=2){const b=bounds(i*tread,i*tread,side*(width/2+.025),side*(width/2+.025));const y=base+i*rise;kit.rod([b[0],y-.1,b[2]],[b[0],y+1,b[2]],.025,0x788386);}
  // Side barriers are physical at every height; the central walking lane stays clear.
  const [x0,x1,z0,z1]=rect(0,length,side*(width/2+.025)-.025,side*(width/2+.025)+.025);
  solid({...kit.rect(x0,x1,z0,z1,height+1,id+'-rail'),minY:kit.point(0,base,0).y});
 }
 return {count,rise,tread};
}
export function stairLanding(kit,{id,x0,x1,z0,z1,y},solid=()=>{}){
 kit.block(x0,x1,y-.12,y,z0,z1,0xcdc7ba,'metal');kit.level(x0,x1,z0,z1,y,id);
 // Slender steel legs carry the landing; their feet stay outside the walking centre.
 for(const x of [x0+.04,x1-.04]){kit.box(.08,y-.12,.08,x,(y-.12)/2,z0+.04,0x788386,{finish:'metal'});solid(kit.rect(x-.04,x+.04,z0,z0+.08,y-.12,id+'-support'));}
}
