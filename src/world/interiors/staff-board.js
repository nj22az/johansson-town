const FONT='"Yu Gothic","Hiragino Kaku Gothic ProN",sans-serif';
/** Fit and clip each label to its paper cell, even if fallback fonts are wider. */
export function boardText(c,text,x,y,size,colour,width,align='left',weight='normal'){
 c.save();c.fillStyle=colour;c.textAlign=align;c.textBaseline='middle';
 do{c.font=`${weight} ${size}px ${FONT}`;if(c.measureText(text).width<=width||size<=11)break;size--;}while(true);
 let fitted=text;if(c.measureText(fitted).width>width){while(fitted.length&&c.measureText(fitted+'…').width>width)fitted=fitted.slice(0,-1);fitted+='…';}
 c.beginPath();c.rect(align==='right'?x-width:align==='center'?x-width/2:x,y-size*.8,width,size*1.6);c.clip();c.fillText(fitted,x,y);c.restore();
}
export function paintStaffBoard(c,w=768,h=512){
 c.fillStyle='#b98a55';c.fillRect(0,0,w,h);for(let i=0;i<1700;i++){c.fillStyle=i%2?'#b58b59':'#c49360';c.fillRect((i*53.41)%w,(i*17.79)%h,2,2);}
 c.strokeStyle='#7a5530';c.lineWidth=18;c.strokeRect(0,0,w,h);
 const text=(s,x,y,n,colour,width,align='left',weight='normal')=>boardText(c,s,x,y,n,colour,width,align,weight);
 const pin=(x,y,colour)=>{c.fillStyle=colour;c.beginPath();c.arc(x,y,7,0,Math.PI*2);c.fill();};
 c.save();c.translate(40,36);c.rotate(-.015);c.fillStyle='#fffdf6';c.fillRect(0,0,330,430);
 text('9月 · SHIFT',165,28,27,'#293b41',298,'center','bold');text('曜日',34,60,15,'#74786e',48,'center');text('担当',78,60,15,'#74786e',134);text('時間',308,60,15,'#74786e',86,'right');
 const days=['M 月','T 火','W 水','T 木','F 金','S 土','S 日'];
 // The rota as commerce/sakura-rota.js has it: Thuan, the owner, on weekdays, Nhung on Sunday, shut on Saturday, and nobody at
 // night (the shop shuts at 20:30; Chin is the ferry's motorman, Grandmother Sakurai has retired).
 const rows=[[['Thuan','9–20:30'],['closed','20:30–9']],[['Thuan','9–20:30'],['closed','20:30–9']],[['Thuan','9–20:30'],['closed','20:30–9']],[['Thuan','9–20:30'],['closed','20:30–9']],[['Thuan','9–20:30'],['closed','20:30–9']],[['closed','all day']],[['Nhung','9–20:30'],['closed','20:30–9']]];
 days.forEach((d,i)=>{const y=92+i*42;c.fillStyle=i>4?'#eef0e6':'#f3eee1';c.fillRect(12,y-17,44,34);text(d,34,y,17,i===6?'#a33b35':'#3b6064',42,'center','bold');
  rows[i].forEach(([name,time],j)=>{const lineY=y+(rows[i].length===2?(j?9:-9):0);text(name,78,lineY,18,'#2d383b',138);text(time,308,lineY,18,'#2d383b',82,'right');});
  c.strokeStyle='#d9d3c4';c.lineWidth=1;c.beginPath();c.moveTo(70,y+21);c.lineTo(316,y+21);c.stroke();});
 text('鉢植え係：窓辺、毎日',165,400,17,'#477553',298,'center');c.restore();pin(205,40,'#d7263d');
 c.save();c.translate(400,40);c.rotate(.02);c.fillStyle='#ffe28a';c.fillRect(0,0,320,200);text('納品 · DELIVERY',160,27,25,'#704a28',288,'center','bold');
 [['米飯','6 / 11 / 16'],['飲料','5:00'],['新聞・雑誌','4:30'],['常温便','火・金 14:00']].forEach(([a,b],i)=>{const y=70+i*33;text(a,16,y,18,'#38423b',104,'left','bold');text(b,304,y,20,'#38423b',175,'right');});c.restore();pin(560,44,'#2a8fcc');
 c.save();c.translate(410,262);c.rotate(-.025);c.fillStyle='#fffdf6';c.fillRect(0,0,310,210);c.fillStyle='#b74439';c.fillRect(0,0,310,40);text('バックヤード · 5S',155,21,24,'#ffffff',278,'center','bold');
 ['① 整理：通路を空ける','② 整頓：先入れ、先出し','③ 清掃：水曜は冷蔵庫','④ 清潔：手洗い・消毒','⑤ 習慣：返却箱は黄色枠'].forEach((s,i)=>text(s,16,66+i*30,18,'#35443d',278));c.restore();pin(565,266,'#d7263d');
}
