// The classroom's shared noticeboard artwork. Each paper owns a bounded text area;
// fitting is measured in the font actually used, rather than assuming translated words fit.
const SANS='"Noto Sans CJK JP","Yu Gothic",sans-serif';
const BRUSH='"Noto Serif CJK JP","Yu Mincho",serif';
export function drawClassNoticeboard(ctx,w,h,names=[]){
 ctx.save();ctx.scale(w/1400,h/520);ctx.textBaseline='middle';
 const labels=[];
 const text=(value,x,y,width,size=22,{colour='#34382f',font=SANS,align='left'}={})=>{
  ctx.font=`${size>=28?'700':'400'} ${size}px ${font}`;
  while(ctx.measureText(value).width>width&&size>10){size--;ctx.font=`${size>=28?'700':'400'} ${size}px ${font}`;}
  ctx.save();ctx.beginPath();ctx.rect(x,y-size*.7,width,size*1.5);ctx.clip();ctx.fillStyle=colour;ctx.textAlign=align;
  ctx.fillText(value,align==='center'?x+width/2:x,y,width);ctx.restore();
  labels.push({text:value,x,y,width,size,measured:ctx.measureText(value).width});
 };
 const paper=(x,y,pw,ph,colour='#fffaf0')=>{
  ctx.fillStyle='rgba(73,53,29,.15)';ctx.fillRect(x+3,y+4,pw,ph);
  ctx.fillStyle=colour;ctx.fillRect(x,y,pw,ph);
  ctx.fillStyle='#a85842';ctx.beginPath();ctx.arc(x+pw/2,y+8,4,0,Math.PI*2);ctx.fill();
 };
 ctx.fillStyle='#b79461';ctx.fillRect(0,0,1400,520);ctx.fillStyle='#d6bb8c';ctx.fillRect(12,12,1376,496);
 paper(32,26,1336,62,'#f4efdc');text('OUR CLASS  ·  MINATO SCHOOL',52,58,1296,36,{align:'center',colour:'#345c4c'});
 // One calligraphy character on each sheet, as on a Japanese classroom wall.
 const work=['海','夢','友','空','風','心','光','波'];
 work.forEach((character,i)=>{const x=32+i*108;paper(x,112,94,174);text(character,x+9,188,76,74,{font:BRUSH,align:'center',colour:'#24231f'});text(names[i]?.split(' ').at(-1)||'',x+6,266,82,15,{align:'center'});});
 paper(916,112,452,174,'#f4f0da');text('HARBOUR DAY',938,145,408,27,{colour:'#345c4c'});
 ['A ferry ride with our families.','Draw one thing you remember.','Bring your picture on Friday.'].forEach((line,i)=>text(line,938,185+i*32,408,21));
 const cards=[
  {x:32,w:420,title:'CLEANING DUTY',colour:'#eef1de',lines:['Group 1  ·  Desks and floor','Group 2  ·  Windows and shelves','Group 3  ·  Blackboard and chalk']},
  {x:472,w:420,title:'ISLAND NATURE',colour:'#e5eef0',lines:['Collect a fallen leaf.','Draw a fish from the harbour.','Record the weather each day.']},
  {x:912,w:456,title:'LUNCH HELPERS',colour:'#f3e7d0',lines:['Yui and Kenta','Wash your hands before serving.','Aprons and caps on the hooks.']},
 ];
 for(const card of cards){paper(card.x,314,card.w,174,card.colour);text(card.title,card.x+20,348,card.w-40,26,{colour:'#345c4c'});card.lines.forEach((line,i)=>text(line,card.x+20,386+i*31,card.w-40,21));}
 ctx.restore();return labels;
}
