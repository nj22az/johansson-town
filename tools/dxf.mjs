/**
 * A small reader for the ASCII DXF the creator's CAD sends (AutoCAD 2010, written by ezdxf): the ENTITIES section's
 * LINE, LWPOLYLINE, ARC, CIRCLE and TEXT, each with its layer, in drawing units (a LINE's ends with their z where the
 * file gives one, as the 3D route drawings do). Nothing else in the file is read.
 */
export function readDxf(text){
 const lines=text.split(/\r?\n/),pairs=[];
 for(let i=0;i+1<lines.length;i+=2)pairs.push([Number(lines[i].trim()),lines[i+1].trim()]);
 const start=pairs.findIndex((p,i)=>p[0]===2&&p[1]==='ENTITIES'&&pairs[i-1]?.[1]==='SECTION');
 if(start<0)throw new Error('DXF: no ENTITIES section');
 const out=[];let e=null;
 const close=()=>{if(e&&['LINE','LWPOLYLINE','ARC','CIRCLE','TEXT'].includes(e.type))out.push(Object.freeze(e));e=null;};
 for(let i=start+1;i<pairs.length;i++){
  const [code,value]=pairs[i];
  if(code===0){close();if(value==='ENDSEC')break;e={type:value,layer:'0',points:[]};continue;}
  if(!e)continue;
  const n=Number(value);
  switch(code){
   case 8:e.layer=value;break;
   case 1:e.text=value;break;
   case 10:if(e.type==='LWPOLYLINE')e.points.push([n,0]);else e.a=[n,0];break;
   case 20:if(e.type==='LWPOLYLINE')e.points[e.points.length-1][1]=n;else e.a[1]=n;break;
   case 30:if(e.a&&e.type!=='LWPOLYLINE')e.a[2]=n;break;
   case 11:e.b=[n,0];break;
   case 21:e.b[1]=n;break;
   case 31:if(e.b)e.b[2]=n;break;
   case 40:if(e.type==='TEXT')e.height=n;else e.radius=n;break;
   case 50:e.start=n;break;
   case 51:e.end=n;break;
   case 70:e.closed=(n&1)===1;break;
  }
 }
 close();
 return out;
}
