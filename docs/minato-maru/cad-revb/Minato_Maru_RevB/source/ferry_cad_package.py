#!/usr/bin/env python3
"""Deterministic design-review drawing book and editable CAD from current ferry data.

Geometry uses CAD mm X forward from transom, Y port, Z above baseline.
Review drawings are deliberately distinct from construction drawings.
"""
import argparse, csv, hashlib, json, math, os, re, shutil, subprocess
from pathlib import Path
import ezdxf
from ezdxf import bbox as dxf_bbox
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, black, white
from reportlab.pdfbase.pdfmetrics import stringWidth

MM=72/25.4
INK='#24343c'; TEAL='#28666c'; RED='#9d3d35'; GRAY='#859399'; PALE='#edf1f2'
DATE='2026-10-13'; REV='B'; STATUS='FOR DESIGN REVIEW - CONSTRUCTION NOT APPROVED'
PAPERS={'A2':(594,420),'A3':(420,297)}

def safe(s):
    t=str(s).replace('\u2011','-').replace('\u2013','-').replace('\u2014','-').replace('\u2212','-').replace('\u2019',"'").replace('\u00b2','2').replace('\u00b3','3').replace('\u00d7',' x ').replace('\u2192',' -> ').replace('\u03c6','phi').replace('\u03a9','ohm').replace('\u00b0',' deg ').replace('\u00b5','u')
    # Human-readable unit spacing, with KKS tags and model identifiers preserved.
    t=re.sub(r'(?<=\d)(mm|cm|m3|m2|m|kg|kVA|kWh|kW|rpm|bar|Hz|V|A|L|t|g|min)\b',r' \1',t)
    t=re.sub(r'\b(at|within|nominal|dry|after|load|main|pair|reserve|maximum|each)(?=\d)',r'\1 ',t)
    t=re.sub(r'(?<![A-Za-z0-9])([XYZ])(?=\d)',r'\1 ',t)
    t=re.sub(r'(?<=\d)x(?=\d)',' x ',t)
    t=re.sub(r'\bx(?=\d)','x ',t)
    t=re.sub(r'(?<=\d)(crossings?|generators?)\b',r' \1',t)
    t=re.sub(r'([;,])(?=[A-Za-z0-9])',r'\1 ',t)
    t=re.sub(r'(?<=[A-Za-z])\:(?=\d)',': ',t)
    return t

def short(s,n=36):
    s=safe(s)
    return s if len(s)<=n else s[:n-3]+'...'

class Book:
    def __init__(self,out,data,commit):
        self.out=out; self.data=data; self.commit=commit
        self.c=canvas.Canvas(str(out/'Minato_Maru_Engine_Room_CAD_RevB.pdf'),pageCompression=1)
        self.c.setTitle('Minato Maru - machinery-space CAD design review - Revision B')
        self.c.setAuthor('Johansson Shipyard - engineering design review')
        self.sheets=[]; self.doc=None
    def text(self,x,y,s,size=2.5,bold=False,col=INK,align='left'):
        c=self.c;c.setFillColor(HexColor(col));c.setFont('Helvetica-Bold' if bold else 'Helvetica',size*MM)
        getattr(c,{'left':'drawString','right':'drawRightString','center':'drawCentredString'}[align])(x*MM,y*MM,safe(s))
    def line(self,a,b,col=INK,width=.25,dash=None):
        c=self.c;c.setStrokeColor(HexColor(col));c.setLineWidth(width*MM);c.setDash(dash or []);c.line(a[0]*MM,a[1]*MM,b[0]*MM,b[1]*MM);c.setDash([])
    def poly(self,p,col=INK,width=.25,dash=None,close=False):
        if not p:return
        c=self.c;c.setStrokeColor(HexColor(col));c.setLineWidth(width*MM);c.setDash(dash or []);q=c.beginPath();q.moveTo(p[0][0]*MM,p[0][1]*MM)
        for v in p[1:]:q.lineTo(v[0]*MM,v[1]*MM)
        if close:q.close()
        c.drawPath(q);c.setDash([])
    def rect(self,x,y,w,h,col=INK,fill=None,width=.25,dash=None):
        c=self.c;c.setStrokeColor(HexColor(col));c.setLineWidth(width*MM);c.setDash(dash or []);c.setFillColor(HexColor(fill) if fill else white);c.rect(x*MM,y*MM,w*MM,h*MM,stroke=1,fill=1 if fill else 0);c.setDash([])
    def circle(self,x,y,r,col=INK,fill=None):
        c=self.c;c.setStrokeColor(HexColor(col));c.setFillColor(HexColor(fill) if fill else white);c.circle(x*MM,y*MM,r*MM,stroke=1,fill=1 if fill else 0)
    def wrapped(self,x,y,s,w,size=2.5,leading=4,col=INK,bold=False):
        words=safe(s).split(); lines=[];line=''
        for word in words:
            t=(line+' '+word).strip()
            if stringWidth(t,'Helvetica-Bold' if bold else 'Helvetica',size*MM)>w*MM and line:lines.append(line);line=word
            else:line=t
        if line:lines.append(line)
        for i,l in enumerate(lines):self.text(x,y-i*leading,l,size,bold,col)
        return y-len(lines)*leading
    def notes(self,x,y,w,title,lines,size=2.4):
        self.text(x,y,title,3,True,TEAL);y-=6
        for i,l in enumerate(lines):y=self.wrapped(x,y,f'{i+1}. {l}',w,size,4)-2
        return y
    def sheet(self,no,title,paper='A3',scale='NTS',subtitle=''):
        if self.sheets:self.c.showPage()
        W,H=PAPERS[paper];self.W=W;self.H=H;self.c.setPageSize((W*MM,H*MM));self.doc=ezdxf.new('R2010');self.doc.units=4;self.doc.header['$INSUNITS']=4;self.doc.header['$MEASUREMENT']=1
        for name,color in [('GEOMETRY',7),('EQUIPMENT',3),('REFERENCE',5),('RESERVATION',1),('DIMENSIONS',7),('ANNOTATION',7),('PIPING',4),('CENTERLINE',8)]:self.doc.layers.new(name,dxfattribs={'color':color})
        self.msp=self.doc.modelspace();self.number=no;self.sheets.append({'number':no,'title':title,'paper':paper,'scale':scale,'pdfPage':len(self.sheets)+1,'dxf':no+'.dxf','status':STATUS})
        self.rect(10,10,W-20,H-20,width=.5);self.rect(5,5,W-10,H-10,width=.15)
        for i in range(6):self.text(10+(W-20)*(i+.5)/6,H-8,chr(65+i),2.2,align='center')
        for i in range(4):self.text(7,H-12-(H-24)*(i+.5)/4,str(i+1),2.2,align='center')
        self.text(18,H-23,title,5,True);self.text(18,H-30,subtitle or STATUS,2.7,col=RED)
        # ISO-style title information; no invented approver or professional registration.
        bx=W-270;by=10;self.rect(bx,by,260,35,fill='#f7f9f9')
        self.line((bx,by+21),(W-10,by+21));self.line((bx,by+9),(W-10,by+9))
        self.text(bx+4,by+28,'JOHANSSON SHIPYARD | HULL 127 | MINATO MARU',3,True)
        self.text(bx+4,by+24,STATUS,2.1,True,RED)
        self.text(bx+4,by+16,no+' | '+short(title,58),2.6,True)
        self.text(bx+4,by+11,'DRAWN: generated design | CHECK: independent computational review | APPROVAL: NONE',1.95)
        self.text(bx+4,by+3,f'REV {REV}  |  {DATE}  |  {paper} landscape  |  SCALE {scale}  |  SHEET {len(self.sheets)}',2.2)
        self.text(16,15,'Source '+self.commit[:12]+' | CAD units mm | dimensions govern',2.2)
        self.text(16,11,'Print at 100%; verify calibration bar before measuring.',2.2)
        ht,base,step=(3,-12,6) if scale=='NTS' else (150,-1500,250)
        self.msp.add_text(no+' | '+title,dxfattribs={'height':ht,'insert':(0,base),'layer':'ANNOTATION'})
        self.msp.add_text(STATUS,dxfattribs={'height':ht*.7,'insert':(0,base-step),'layer':'ANNOTATION'})
        self.msp.add_text('CAD units mm. X forward from transom; Y port; Z above baseline.',dxfattribs={'height':ht*.6,'insert':(0,base-step*2),'layer':'ANNOTATION'})
    def save_sheet(self):
        # Native paper layout accompanies1:1 model-space geometry. The PDF controls
        # the multi-view composition; this viewport preserves the exact stated scale.
        layout=self.doc.layouts.get('Layout1')
        layout.page_setup(size=(self.W,self.H),margins=(0,0,0,0),units='mm',scale=(1,1),name=self.sheets[-1]['paper'])
        layout.set_plot_type(5)
        layout.add_lwpolyline([(10,10),(self.W-10,10),(self.W-10,self.H-10),(10,self.H-10)],close=True)
        layout.add_lwpolyline([(self.W-270,10),(self.W-10,10),(self.W-10,45),(self.W-270,45)],close=True)
        layout.add_text('JOHANSSON SHIPYARD | MINATO MARU | HULL127',dxfattribs={'height':3,'insert':(self.W-266,37)})
        layout.add_text(STATUS,dxfattribs={'height':2.3,'insert':(self.W-266,31)})
        layout.add_text(self.number+f' | REV{REV} | {DATE} | SCALE '+self.sheets[-1]['scale'],dxfattribs={'height':2.5,'insert':(self.W-266,24)})
        layout.add_text('APPROVAL:NONE | PDF controls multi-view composition',dxfattribs={'height':2.2,'insert':(self.W-266,17)})
        layout.add_text(self.sheets[-1]['title'],dxfattribs={'height':4,'insert':(18,self.H-24)})
        geom=[e for e in self.msp if e.dxf.layer!='ANNOTATION']
        ext=dxf_bbox.extents(geom,fast=True)
        if ext.has_data:
            center=((ext.extmin.x+ext.extmax.x)/2,(ext.extmin.y+ext.extmax.y)/2)
            den=1 if self.sheets[-1]['scale']=='NTS' else int(self.sheets[-1]['scale'].split(':')[1])
            vp=layout.add_viewport(center=(self.W/2,(self.H+20)/2),size=(self.W-36,self.H-100),view_center_point=center,view_height=(self.H-100)*den,status=2)
            vp.dxf.flags=16384  # locked viewport
        self.doc.saveas(self.out/'dxf'/self.sheets[-1]['dxf'])
    def close(self):
        self.c.save();(self.out/'drawing_register.json').write_text(json.dumps(self.sheets,indent=2))
        csvwrite(self.out/'drawing_register.csv',self.sheets)
    def dim(self,a,b,off,label):
        dx=b[0]-a[0];dy=b[1]-a[1];l=math.hypot(dx,dy);nx=-dy/l*off;ny=dx/l*off;aa=(a[0]+nx,a[1]+ny);bb=(b[0]+nx,b[1]+ny)
        self.line(a,(aa[0]+nx*.2,aa[1]+ny*.2),width=.12);self.line(b,(bb[0]+nx*.2,bb[1]+ny*.2),width=.12);self.line(aa,bb,width=.12)
        for p in [aa,bb]:self.line((p[0]-1,p[1]-1),(p[0]+1,p[1]+1),width=.2)
        mx=(aa[0]+bb[0])/2;my=(aa[1]+bb[1])/2
        if abs(dy)>abs(dx):
            self.c.saveState();self.c.translate((mx-1.2)*MM,my*MM);self.c.rotate(90);self.text(0,0,label,2.4,align='center');self.c.restoreState()
        else:self.text(mx,my+1.7,label,2.4,align='center')
    def table(self,x,y,width,headers,rows,widths=None,size=2.3,rowh=6,maxrows=None):
        widths=widths or [1]*len(headers);ws=[width*v/sum(widths) for v in widths]
        # NTS schedules are also editable CAD text/lines at paper-mm diagram coordinates.
        is_diagram=self.sheets[-1]['scale']=='NTS'
        def cad_row(yrow,values,bold=False):
            if not is_diagram:return
            cur=x
            self.msp.add_line((x,yrow),(x+width,yrow),dxfattribs={'layer':'GEOMETRY'})
            for v,w in zip(values,ws):
                s=safe(v);sz=size
                if stringWidth(s,'Helvetica',sz*MM)>(w-3.5)*MM:sz=max(1.65,sz*(w-3.5)*MM/stringWidth(s,'Helvetica',sz*MM))
                self.msp.add_text(s,dxfattribs={'height':sz,'insert':(cur+1.7,yrow-rowh+1.8),'layer':'ANNOTATION'});cur+=w
        self.rect(x,y-rowh,width,rowh,fill=TEAL,col=TEAL)
        cad_row(y,headers,True)
        cur=x
        for h,w in zip(headers,ws):self.text(cur+1.7,y-rowh+1.8,h,size,True,'#ffffff');cur+=w
        y-=rowh
        for i,row in enumerate(rows[:maxrows] if maxrows else rows):
            cad_row(y,row)
            if i%2==0:self.rect(x,y-rowh,width,rowh,col='#dbe2e4',fill='#f1f5f5',width=.08)
            else:self.line((x,y-rowh),(x+width,y-rowh),col='#dbe2e4',width=.08)
            cur=x
            for v,w in zip(row,ws):
                s=safe(v);sz=size
                if stringWidth(s,'Helvetica',sz*MM)>(w-3.5)*MM:sz=max(1.65,sz*(w-3.5)*MM/stringWidth(s,'Helvetica',sz*MM))
                self.text(cur+1.7,y-rowh+1.8,s,sz);cur+=w
            y-=rowh
        return y

def csvwrite(path,rows):
    if not rows:path.write_text('');return
    fields=list(dict.fromkeys(k for r in rows for k in r))
    with path.open('w',newline='') as f:
        wr=csv.DictWriter(f,fieldnames=fields);wr.writeheader()
        for r in rows:wr.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(list,dict)) else v for k,v in r.items()})

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--data',required=True);ap.add_argument('--out',required=True);ap.add_argument('--commit',default='unrecorded');a=ap.parse_args();d=json.loads(Path(a.data).read_text());out=Path(a.out);out.mkdir(parents=True,exist_ok=True);(out/'dxf').mkdir(exist_ok=True);(out/'data').mkdir(exist_ok=True);(out/'models').mkdir(exist_ok=True)
    shutil.copyfile(a.data,out/'data'/'ferry_source_snapshot.json')
    specs_path=Path(a.data).parent/'machinery-specs.json'
    if not specs_path.exists():specs_path=Path(a.data).parent/'machinery_specifications.json'
    machinery_specs=json.loads(specs_path.read_text()) if specs_path.exists() else {}
    if machinery_specs:(out/'data'/'machinery_specifications.json').write_text(json.dumps(machinery_specs,indent=2))
    hull_path=Path(a.data).parent/'hull-results.json'
    if not hull_path.exists():hull_path=Path(a.data).parent/'hull_results.json'
    hull_results=json.loads(hull_path.read_text()) if hull_path.exists() else {}
    if hull_results:(out/'data'/'hull_results.json').write_text(json.dumps(hull_results,indent=2))
    L=d['ship']['length']*1000;T=d['ship']['draft']*1000
    conv=lambda p:[round((p[2]+L/2000)*1000,3),round(p[0]*1000,3),round((p[1]+T/1000)*1000,3)]
    er=d['engineRoom'];X0=conv([0,0,er['aft']])[0];X1=conv([0,0,er['fore']])[0];XA=conv([0,0,d['machinerySpaces']['auxFore']])[0];XF=conv([0,0,d['machinerySpaces']['storeFore']])[0];W=er['side']*1000;FP=conv([0,er['floor'],0])[2];DH=conv([0,er['deckhead'],0])[2]
    boxes=[]
    for i,b in enumerate(d['interior']['boxes']):
        lo=conv(b['a']);hi=conv(b['b']);mn=[min(v,w) for v,w in zip(lo,hi)];mx=[max(v,w) for v,w in zip(lo,hi)]
        if b.get('name') and mx[0]>=X0 and mn[0]<=XF and mn[2]<DH+.01 and mx[2]>=FP-.03:
            boxes.append({'id':f'B{i:04}', 'name':b['name'],'min':mn,'max':mx,'solid':b.get('solid'), 'draw':b.get('draw'), 'hex':b.get('hex'),'sourceIndex':i})
    major=[b for b in boxes if not re.search(r'bulkhead|plates|deckhead|side|trunk|partition|casing|penetration|chequer|floor|stairs|ladder|tread|rail|stanchion|hatch|handrail',b['name'],re.I) and (b['max'][0]-b['min'][0])*(b['max'][1]-b['min'][1])>40000]
    for i,b in enumerate(major):b['item']=i+1
    csvwrite(out/'data'/'equipment_geometry.csv',[{'item':b.get('item',''),'id':b['id'],'name':b['name'],'Xmin_mm':b['min'][0],'Xmax_mm':b['max'][0],'Ymin_mm':b['min'][1],'Ymax_mm':b['max'][1],'Zmin_mm':b['min'][2],'Zmax_mm':b['max'][2],'length_mm':b['max'][0]-b['min'][0],'width_mm':b['max'][1]-b['min'][1],'height_mm':b['max'][2]-b['min'][2],'geometryStatus':'Game model envelope; supplier dimensions unverified'} for b in boxes])
    # Explicit proposed reservations, separate from the current game source.
    proposed=[]
    for side in [1,-1]:
        cy=side*1550;proposed.append({'id':'ME-P' if side==1 else 'ME-S','name':'Proposed engine + gear reservation','min':[9350,cy-750,FP],'max':[12050,cy+750,FP+1650],'status':'PROPOSED - fictional machinery physical reservation, no maker approval','mass_t':3.6})
    csvwrite(out/'data'/'proposed_reservations.csv',proposed)
    pipes=[];nodes=[];lines=[]
    source_pipes=d['interior'].get('engineeringPipes',d['interior']['pipes'])
    for s in d['piping']:
        for n in s['nodes']:
            p=d['interior']['anchors'].get(s['id']+'/'+n['id']);xyz=conv(p['pos']) if p else [None,None,None]
            nodes.append({'system':s['id'],'id':n['id'],'kind':n['kind'],'label':n['label'],'tag':n['tag'],'space':n['where'],'X_mm':xyz[0],'Y_mm':xyz[1],'Z_mm':xyz[2],'anchorStatus':'Model port coordinate' if p else 'No physical model port'})
        for i,li in enumerate(s['lines']):
            rr=next((r for r in source_pipes if r['system']==s['id'] and r['from']==li['from'] and r['to']==li['to']),None)
            lines.append({'system':s['id'],'line':s['id'].upper()+f'-{i+1:03}','from':li['from'],'to':li['to'],'DN_mm':li['dn'],'note':li.get('note',''),'physicalRouteStatus':'Model route' if rr else 'Not physically routed','routeLength_mm':round(sum(math.dist(rr['points'][j-1],rr['points'][j])*1000 for j in range(1,len(rr['points']))),1) if rr else None,'designStatus':'Design-review topology; class/material/support/pressure test unverified'})
    for i,p in enumerate(source_pipes):pipes.append({**p,'id':f'R{i+1:03}','points':list(map(conv,p['points']))})
    csvwrite(out/'data'/'pipe_route_issues.csv',d['interior'].get('pipeRouteIssues',[]))
    csvwrite(out/'data'/'piping_nodes.csv',nodes);csvwrite(out/'data'/'piping_line_schedule.csv',lines);(out/'data'/'pipe_routes_mm.json').write_text(json.dumps(pipes,indent=2));csvwrite(out/'data'/'electrical_feeders.csv',d['feeders']);csvwrite(out/'data'/'electrical_sources.csv',d['sources']);csvwrite(out/'data'/'electrical_loads.csv',d['loads']);csvwrite(out/'data'/'space_register.csv',d['ga'])
    book=Book(out,d,a.commit)
    # Physical drawing helpers: millimetre geometry is mapped with an exact denominator.
    def transform(origin,denom,view='plan'):
        axes={'plan':(0,1),'profile':(0,2),'section':(1,2)}[view]
        f=lambda p:(origin[0]+p[axes[0]]/denom,origin[1]+p[axes[1]]/denom)
        f.axes=axes
        return f
    def cadline(a,b,layer='GEOMETRY',color=INK,tr=None,width=.25,dash=None):
        axes=tr.axes if tr else (0,1)
        book.msp.add_line(tuple(a[i] for i in axes),tuple(b[i] for i in axes),dxfattribs={'layer':layer})
        if tr:book.line(tr(a),tr(b),color,width,dash)
    def cadbox(b,tr,view='plan',layer='EQUIPMENT',color=INK,fill=None,label=False):
        axes={'plan':(0,1),'profile':(0,2),'section':(1,2)}[view];lo=b['min'];hi=b['max'];corners=[lo.copy(),lo.copy(),hi.copy(),hi.copy()];corners[1][axes[0]]=hi[axes[0]];corners[3][axes[0]]=lo[axes[0]]
        p=[tr(q) for q in corners];book.poly(p,color,.2,[3,2] if layer=='RESERVATION' else None,True)
        book.msp.add_lwpolyline([(q[axes[0]],q[axes[1]]) for q in corners],close=True,dxfattribs={'layer':layer})
        if label:
            mid=[(v+w)/2 for v,w in zip(lo,hi)];pt=tr(mid);book.text(*pt,b.get('item',b.get('id','')),2.1,True,align='center');book.msp.add_text(str(b.get('item',b.get('id',''))),dxfattribs={'height':110,'insert':(mid[axes[0]],mid[axes[1]]),'layer':'ANNOTATION'})
    def boundary(tr,view='plan',full=True):
        if view=='plan':
            for x0,x1 in [(X0,X1),(X1,XA),(XA,XF)]:
                cadline((x0,-W,FP),(x1,-W,FP),tr=tr);cadline((x0,W,FP),(x1,W,FP),tr=tr)
            for xx in [X0,X1,XA,XF]:cadline((xx,-W,FP),(xx,W,FP),tr=tr)
            cadline((X0,0,FP),(XF,0,FP),'CENTERLINE',GRAY,tr,dash=[4,2])
        elif view=='profile':
            for zz in [FP,DH]:cadline((X0,0,zz),(XF,0,zz),tr=tr)
            for xx in [X0,X1,XA,XF]:cadline((xx,0,FP),(xx,0,DH),tr=tr)
        else:
            for zz in [FP,DH]:cadline((0,-W,zz),(0,W,zz),tr=tr)
            for yy in [-W,W]:cadline((0,yy,FP),(0,yy,DH),tr=tr)
            cadline((0,0,0),(0,0,DH+300),'CENTERLINE',GRAY,tr,dash=[4,2])
    def scale_bar(x,y,denom,length=5000):
        book.line((x,y),(x+length/denom,y),width=.6)
        for i in range(6):book.line((x+i*length/5/denom,y-1.5),(x+i*length/5/denom,y+1.5));book.text(x+i*length/5/denom,y-5,f'{i*length/5000:g}',2,align='center')
        book.text(x,y+4,f'Scale bar: {length/1000:g} m at 1:{denom} (100% print)',2.2)
    def pointdim(a,b,tr,off,label):
        book.dim(tr(a),tr(b),off,label)
        axes=(0,1);book.msp.add_aligned_dim(p1=(a[0],a[1]),p2=(b[0],b[1]),distance=off*50,text=label,dimstyle='Standard',override={'dimtxt':100,'dimasz':100}).render()

    # Cover, control and reference particulars.
    book.sheet('JS127-ER-000','Drawing register and engineering basis','A3','NTS','Controlled source snapshot; all physical dimensions are millimetres unless marked otherwise.')
    book.notes(18,245,175,'DESIGN STATUS',[
        'This book coordinates the current Johansson World ferry with explicitly identified reference machinery and proposed reservations. It is a review issue, not an approved real-vessel construction package.',
        'Existing source geometry is an audit baseline. Proposed reservations are shown separately; they are not automatically substituted into the game hull.',
        'Drawing layout uses fixed ISO A paper sizes, borders, revision identification, drawing numbers, datums, units and a title block. It does not assert full compliance with any classification standard.',
        'No signature, class stamp, flag approval, manufacturer certification or professional registration is implied.',
        'Construction release holds include scantlings, foundations, stability and damage stability, fire boundaries, machinery vendor installation data, hydraulic sizing and electrical fault/selectivity calculations.'
    ])
    book.table(212,245,189,['Particular','Source / basis'],[
        ['LOA / LBP / moulded breadth',f"{d['ship']['length']:.1f} / {d['ship']['lengthBP']:.1f} / {d['ship']['beam']:.1f} m"],['Moulded depth / design draft',f"{d['ship']['depth']:.1f} / {d['ship']['draft']:.1f} m"],['Machinery floor / deck underside',f'{FP:.0f} / {DH:.0f} mm above BL'],['Nominal clear room height',f'{DH-FP:.0f} mm before pipes and trays'],['Engine-room longitudinal limits',f'{X0:.0f} - {X1:.0f} mm from transom'],['Auxiliary / workshop limits',f'{X1:.0f} - {XA:.0f} / {XA:.0f} - {XF:.0f} mm'],['Internal side reservation',f'Y = +/- {W:.0f} mm'],['Main-engine game power',f"2 x {d['machinery']['mains']['kW']} kW at {d['machinery']['mains']['rpm']} rpm"],['Nominal AC main system','440 V, 3 phase, 60 Hz, IT'],['CAD revision / issue date',f'{REV} /{DATE}']],[1.25,1],size=2.3,rowh=8)
    book.notes(212,142,189,'READING THE DRAWINGS',[
        'X increases forward from the transom. Y increases to port from the centreline. Z increases upward from the baseline.',
        'Game [x,y,z] metres -> CAD [1000(z + LOA/2), 1000x, 1000(y + draft)] millimetres.',
        'Geometry DXFs are model space at 1:1 in mm. PDF view scale is stated individually. Schematic DXFs are diagram coordinates and are NTS.',
        'Source snapshot, node/line schedules, equipment bounds and cable schedules are supplied in data/. See README for reproduction and plotting.'
    ])
    book.save_sheet()

    book.sheet('JS127-ER-100','Machinery spaces in vessel context','A2','1:100','Profile and deck datums from the current game loft; weight and stability remain unreconciled.')
    tp=transform((35,190),100,'profile')
    hs=d.get('hullStations',[])
    if hs:
        for key in ['keel','deck']:
            pts=[[r['X']*1000,0,r[key]*1000] for r in hs]
            for p,q in zip(pts[:-1],pts[1:]):cadline(p,q,tr=tp)
    for z,n in [(0,'BL'),(d['ship']['draft']*1000,'Laden WL'),(d['heights']['carDeck']*1000,'Car deck'),(d['heights']['passengerDeck']*1000,'Passenger deck'),(d['heights']['bridgeDeck']*1000,'Bridge deck'),(d['heights']['compassDeck']*1000,'Compass deck')]:
        cadline((0,0,z),(L,0,z),'CENTERLINE',TEAL if n=='Laden WL' else GRAY,tp,dash=[3,2]);book.text(384,190+z/100,n+f' Z{z:.0f}',2.4)
    for x0,x1,z0,z1,n in [(X0,X1,FP,DH,'ER'),(X1,XA,FP,DH,'AUX'),(XA,XF,FP,DH,'SHOP'),(6000,23000,7400,10000,'Passenger house'),(6000,23000,10000,12400,'Crew / bridge')]:
        bb={'id':n,'min':[x0,0,z0],'max':[x1,0,z1]};cadbox(bb,tp,'profile',color=TEAL,label=True)
    for x in [0,X0,X1,XA,XF,L]:book.text(tp([x,0,0])[0],175,f'X{x:.0f}',2.2,align='center')
    book.dim(tp([0,0,0]),tp([L,0,0]),-28,f'{L:.0f} LOA')
    book.notes(35,133,325,'CONTEXT AND HYDROSTATIC QUALIFICATIONS',[
        f"The hull loft at Z{d['ship']['draft']*1000:.0f} draft yields approximately {d['ship']['displacement']:.1f} t geometric displacement. This is not verified lightship or certified payload capacity.",
        'Legacy operating weight target283t and lightship210t remain unverified. An arithmetic difference between hull displacement and assumed lightship is not an approved allowable deadweight.',
        'The existing shallow machinery depth is retained; a deeper hull or raised deck/casing would alter hydrostatics, stability, car-deck interfaces and structural design.',
        'Profile shows compartment/datums only. No plate thickness, deck-beam section, longitudinal stiffness or approved subdivision is established.'
    ])
    book.notes(425,344,146,'CONNECTION TO THE GAME',[
        'Length34500, breadth8400, depth3000mm. These are source design dimensions.',
        'Each equipment envelope and pipe centre-line converts through a single documented axis transform.',
        'Corrections to source allocations appear in the following arrangement sheets; overhaul, escape and regulatory holds remain explicit.'
    ])
    scale_bar(35,55,100);book.save_sheet()

    book.sheet('JS127-ME-001','Main machinery and propulsion particulars','A3','NTS','Johansson equipment particulars are fictional design assumptions. Sourced modern reference is a separate comparison.')
    m=d['machinery'];mm=m['mains'];litres=math.pi/4*mm['bore']**2*mm['stroke']*mm['cylinders']/1e6;shaft_rpm=mm['rpm']/m['gears']['ratio'];torque=9550*mm['kW']/shaft_rpm
    book.table(18,249,384,['Particular','Current game / derived value','Status'],[
        ['Main engine / manufacturer','2 x Johansson JM6-160','Fictional'],['Engine type',short(mm['kind'],72),'Design assumption'],['Rated brake output',f"{mm['kW']} kW each at{mm['rpm']} rpm",'Unverified maker data'],['Cylinders / bore / stroke',f"{mm['cylinders']} in line /{mm['bore']} /{mm['stroke']} mm",'Unverified maker data'],['Displacement / piston speed',f"{litres:.3f} L /{2*mm['stroke']/1000*mm['rpm']/60:.2f} m/s",'Derived from assumptions'],['Gear type / ratio',f"Reverse reduction /{m['gears']['ratio']:.2f}:1",'Vendor selection unresolved'],['Shaft diameter / rated shaft speed',f"{m['shafts']['diameter']*1000:.0f} mm /{shaft_rpm:.0f} rpm",'Sizing and torsion unverified'],['Ideal torque after gearbox',f"{torque/1000:.3f} kNm per shaft (no losses)",'Not shaft approval'],['Propeller / diameter / pitch ratio',f"{m['propellers']['count']} x{m['propellers']['blades']} blades /{m['propellers']['diameter']*1000:.0f} mm /{m['propellers']['pitchRatio']}",'Resistance/cavitation unverified'],['Main service pumps','Engine-driven LO, JW and sea-water','Maker capacity unresolved'],['Starting system','Air start;2 x150L bottles;nominal30bar','Starting energy/maker verification open'],['Specific fuel consumption / density','210 g/kWh /0.86kg/L','Assumed duty calculation inputs'],['Crossing fuel /20crossing day',f"{m['fuelPerCrossing']:.2f} L /{m['fuelPerDay']:.1f} L",'80%main load22min + assumed generator'],['Fuel storage /service tank',f"{m['tanks']['fuel']:.1f} m3 /{m['tanks']['fuelService']:.1f} m3",'Usable capacity/structure open'],['Yanmar comparison rating','6AYM-WST485kW/1900rpm/20.379L','Published reference; separate duty'],['Published reference engine outline','2000 x1305 x1431mm;2365kg dry','Legacy family catalogue outline'],['Matched gear /overall length','YX181;3.03:1;560kg;combinedL2364mm','Reference family; exact install open'],['Yard proposed combined allowance','2700 x1500 x1650mm;3.6t each','Reservation, not certified assembly']],[1.3,2.3,1.4],size=2.4,rowh=8)
    book.notes(20,89,377,'INSTALLATION RELEASE DATA STILL REQUIRED',[
        'Selected engine and gearbox installation sheets: mounting holes, resilient mounts or chocks, bedplate loads, nozzle coordinates, start/control interfaces and cooling duties.',
        'Shaft alignment, bearing spans/reactions, propeller thrust, fatigue and torsional vibration; exhaust backpressure and ventilation; certified lifting points and service/removal procedures.',
        'Reference dimensions and rating may be from different published family duties. They must not be combined into an approved selected-machine specification without vendor confirmation.'
    ],size=2.25);book.save_sheet()

    book.sheet('JS127-ER-101','Machinery spaces - corrected source arrangement','A2','1:50','Plan at floor plates Z = '+str(int(FP))+' mm; includes source corrections and retained unresolved engineering holds.')
    tr=transform((-X0/50+36,259),50);boundary(tr)
    for b in major:cadbox(b,tr,label=True)
    for xx,name in [(X0,'ER aft'),(X1,'ER / aux'),(XA,'Aux / shop'),(XF,'Shop / void')]:book.text(tr([xx,0,0])[0],352,f'X {xx:.0f} | {name}',2.3,align='center')
    for x0,x1 in [(X0,X1),(X1,XA),(XA,XF)]:pointdim([x0,-W,FP],[x1,-W,FP],tr,-10,f'{x1-x0:.0f}')
    pointdim([X0,-W,FP],[XF,-W,FP],tr,-21,f'{XF-X0:.0f} overall machinery-space length')
    pointdim([X0,-W,FP],[X0,W,FP],tr,14,f'{2*W:.0f} internal breadth')
    book.text(32,355,'PORT (+Y)',2.7,True);book.text(32,166,'STARBOARD (-Y)',2.7,True)
    # compact key against geometry, no long labels inside machinery silhouettes.
    keyrows=[[b['item'],short(b['name'],31),f"{b['min'][0]:.0f}-{b['max'][0]:.0f}",f"{b['min'][1]:.0f}-{b['max'][1]:.0f}"] for b in major]
    book.table(348,348,228,['Item','Model equipment / object','X limits','Y limits'],keyrows[:34],[.35,2.2,1,1],size=2.2,rowh=7)
    if len(keyrows)>34:book.text(348,99,f'{len(keyrows)-34} further objects in equipment_geometry.csv.',2.3)
    book.notes(28,123,297,'REVIEW FINDINGS',[
        'Current engine symbols, gears, generators and switchboard are game geometry. No vendor bolt pattern, vibration allowance or lifting attachment is established.',
        'Room height is only '+str(int(DH-FP))+' mm. Pipes/trays further reduce clearance; piston extraction cannot be approved from this arrangement.',
        'Numbered silhouettes are source objects, including collision reservations. Complete bounds and original source indices are in equipment_geometry.csv.'
    ])
    scale_bar(35,55,50);book.save_sheet()

    book.sheet('JS127-ER-102','Machinery spaces - longitudinal and transverse sections','A2','1:50','Sections use current floor and deck levels; transverse machinery shown as combined envelope projection.')
    trp=transform((35-X0/50,270),50,'profile');boundary(trp,'profile')
    for b in major:
        if abs((b['min'][1]+b['max'][1])/2)<2500:cadbox(b,trp,'profile',color=GRAY)
    for p in proposed:cadbox(p,trp,'profile',layer='RESERVATION',color=RED)
    book.text(35,346,'A-A LONGITUDINAL SECTION / PROJECTED MACHINERY ENVELOPES',3,True)
    for z,label in [(FP,'Floor plates'),(DH,'Car-deck underside'),(3000,'Car-deck nominal surface')]:book.text(330,270+z/50,f'{label}: Z {z:.0f}',2.5)
    book.dim(trp([X0,0,FP]),trp([X0,0,DH]),-12,f'{DH-FP:.0f} clear before services')
    trt=transform((129,165),50,'section');boundary(trt,'section')
    for p in proposed:cadbox(p,trt,'section',layer='RESERVATION',color=RED,label=True)
    book.text(35,238,'B-B TRANSVERSE SECTION AT X = 10700',3,True)
    book.dim(trt([10700,-W,FP]),trt([10700,W,FP]),-12,f'{2*W:.0f}')
    book.dim(trt([10700,0,FP]),trt([10700,0,DH]),-14,f'{DH-FP:.0f}')
    book.dim(trt([10700,2300,FP+1650]),trt([10700,2300,DH]),-5,f'{DH-FP-1650:.0f} overhead')
    book.notes(345,340,227,'SECTION QUALIFICATIONS',[
        'Red dashed rectangles: proposed 2700 x 1500 x 1650 mm combined machinery reservation, not the external outline of an approved engine.',
        'Existing 1900 mm floor-to-deckhead is retained. Proposed machine top Z2550 leaves only 250 mm nominal overhead space. A shoreside removal strategy is necessary unless a deeper hull or raised casing is engineered.',
        'No deck beam, bracket, lagging, cable tray or structural scantling is dimensioned for fabrication. These remain release holds.',
        'Both main engine centres are Y +/-1550 mm. Supplier 6AYM-WST reference width 1305 mm is wider than the current game block of 900 mm.',
        'Envelope projection does not prove local collision freedom. A signed installation drawing and checked access model are required.'
    ])
    book.notes(345,192,227,'DATUMS AND PRINT CHECK',[
        'BL is Z0; centreline is Y0. Nominal laden waterline Z1900; main deck Z3000.',
        'DXF profiles are XY drawing projections of X/Z physical values, and transverse sections are Y/Z projections. Three-dimensional source is separately supplied.',
        'At 100% printing 1000 mm real distance occupies 20 mm on 1:50 sheets.'
    ])
    scale_bar(35,65,50);book.save_sheet()

    book.sheet('JS127-ER-103','Corrected machinery reservation and maintenance strategy','A2','1:50','PROPOSED layout reservations; retain present hull pending naval architecture and supplier review.')
    tr=transform((35-X0/50,262),50);boundary(tr)
    for p in proposed:cadbox(p,tr,layer='RESERVATION',color=RED,label=True)
    # True reference dimensional envelope inside reserved footprint, neither a chosen rating nor a certified install.
    refs=[]
    for p in proposed:
        cy=(p['min'][1]+p['max'][1])/2;refs.append({'id':'REF-P' if cy>0 else 'REF-S','min':[9518,cy-652.5,FP],'max':[11882,cy+652.5,FP+1431]})
    for r in refs:cadbox(r,tr,layer='REFERENCE',color=TEAL)
    # Desired servicing zones: explicitly collide with some source allocations and hence not approved.
    for p in proposed:
        m=p['min'];mx=p['max'];cy=(m[1]+mx[1])/2
        # Inboard operating face1000mm; outboard non-operating face800mm.
        low_extra,high_extra=(1000,800) if cy>0 else (800,1000)
        en={'min':[m[0]-600,m[1]-low_extra,m[2]],'max':[mx[0]+600,mx[1]+high_extra,mx[2]]};cadbox(en,tr,layer='RESERVATION',color=GRAY)
        hatch={'min':[m[0]-100,m[1]-150,3000],'max':[mx[0]+100,mx[1]+150,3000]};cadbox(hatch,tr,layer='RESERVATION',color=RED)
    book.text(35,359,'Red: yard reservation / removal cut-out. Teal: actual reference dimensions. Grey: desired service zones.',2.4)
    for p in proposed:
        pointdim([p['min'][0],p['min'][1],FP],[p['max'][0],p['min'][1],FP],tr,-5,'2700 reservation')
    pointdim([X0,0,FP],[X1,0,FP],tr,-110,'5500 engine room')
    book.notes(347,348,228,'REFERENCE MACHINERY',[
        'Yanmar 6AYM-WST C operating reference (2020):485 kW at1900 rpm,6 cylinders,20.379 L. Separate legacy H physical reference:engine2000 x1305 x1431 mm; dry2365 kg.',
        'Legacy YX181 gear reference:ratio3.03,dry560kg; published combined length2364mm. Teal box uses combined length with engine-only width/height; full accessory extremes are unverified.',
        'Fictional Johansson main remains 460 kW at 1350 rpm, 6 cylinders 160 x 200 mm, derived displacement 24.127 L. Its detailed installation drawing is unavailable.',
        'Proposed combined reserve each: 2700 x1500 x1650 mm, 3.6 t estimated mass. Verification against an actual selected vendor assembly is a release hold.'
    ])
    book.notes(347,220,228,'MAINTENANCE AND REMOVAL HOLDS',[
        'Desired operational side access 1000 mm; non-operational side 800 mm; ends 600 mm. These are design targets, not OEM minima.',
        'Each removable deck cut-out reserve 2900 x1800 mm. Covers, coamings, fire integrity, deck strength, crane reach, rigging and lifting points require design and approval.',
        'Only 250 mm nominal overhead clearance above the proposed envelope prevents approval of internal piston or head lifting.',
        'Both gensets are relocated in the corrected source to auxiliary room X15200 to16050. Control booth is retained. Model centre aisle1000mm and side gap1035mm are not maker clearances.',
        'Grey targets overlap present allocations. This drawing records needed changes; it does not claim that the proposed arrangement is collision-free.'
    ])
    book.notes(30,126,298,'WHOLE-ASSEMBLY OVERHAUL CONCEPT',[
        'Vessel alongside, de-energised, fluids drained, shaft/cable/pipe interfaces disconnected under a planned procedure. Remove cover, lift to shore using engineered rigging, replace and align.',
        'A crane WLL cannot be selected from mass alone. Account for rigging weight, radius, centre of gravity, dynamic allowance and verified lifting eyes.',
        'References: Yanmar Norway legacy H physical datasheet and Yanmar C operating brochure (2020). Source identities differ; URLs and exact scopes are in reference_sources.csv.'
    ])
    scale_bar(35,55,50);book.save_sheet()

    book.sheet('JS127-ER-104','Access, escape and compartment interfaces','A2','1:50','Physical model-linked entrance, watertight doors and escape reservations; no evacuation certification.')
    tr=transform((55-7000/50,260),50)
    boundary(tr)
    for x0,x1,n in [(X0,X1,'MAIN ENGINE ROOM'),(X1,XA,'AUXILIARY MACHINERY'),(XA,XF,'WORKSHOP / ENGINE STORE')]:book.text(tr([(x0+x1)/2,0,0])[0],tr([0,1000,0])[1],n,2.8,True,align='center')
    la=er['ladder'];p0=conv([la['x'][0],er['floor'],la['foot']]);p1=conv([la['x'][1],er['floor'],la['head']]);ld={'min':[min(p0[0],p1[0]),min(p0[1],p1[1]),FP],'max':[max(p0[0],p1[0]),max(p0[1],p1[1]),DH]};cadbox(ld,tr,layer='RESERVATION',color=TEAL)
    for xx,width in [(X1,d['machinerySpaces']['wtDoor']['w']*1000),(XA,d['machinerySpaces']['door38']['w']*1000)]:
        book.line(tr([xx,-width/2,FP]),tr([xx,width/2,FP]),'#ffffff',1.5);book.line(tr([xx-200,-width/2,FP]),tr([xx-200,width/2,FP]),TEAL,.7);book.text(tr([xx,0,FP])[0]+3,tr([xx,0,FP])[1]+5,f'{width:.0f} clear',2.3)
    # Show expected escape area as red reservation; source completeness is explicitly tracked below.
    esc={'min':[8500,-3950,FP],'max':[9500,-3150,3000]};cadbox(esc,tr,layer='RESERVATION',color=RED)
    auxesc={'min':[17800,-3950,FP],'max':[19000,-3150,3000]};cadbox(auxesc,tr,layer='RESERVATION',color=RED)
    for pts in [[[9700,0,FP],[8650,0,FP],[8650,3450,FP]],[[10700,0,FP],[9100,0,FP],[9100,-3550,FP]],[[16000,0,FP],[18400,0,FP],[18400,-3550,FP]]]:book.poly([tr(p) for p in pts],TEAL,.7,[3,2])
    book.text(52,355,'Main ladder and two escape-trunk reservations (red); dotted paths are intended access connectivity.',2.6)
    book.dim(tr([7000,0,FP]),tr([8600,0,FP]),-13,'1600 main-ladder run')
    book.notes(365,345,209,'ACCESS REVIEW',[
        'Main ladder source: X7000 at upper end, X8600 at foot; Y3200 to3950. Source hatch X7000 to9000, Y3150 to4130.',
        'ER / aux door at X14000: 800 mm nominal width,1900 mm height. Aux / workshop door at X19000:750 mm nominal width,1850 mm height.',
        'Current aft-starboard escape ladder alone does not establish a continuous protected escape to the car deck. The red box is a proposed reservation; its complete trunk and hatch are not yet verified.',
        'Auxiliary escape reserve at X17800 to19000 on starboard. Direct route to casing must be kept clear from stored equipment.',
        'No passenger escape-width, travel-distance, stair-angle or fire-boundary compliance is asserted. Applicable flag/class review remains open.'
    ])
    book.notes(32,136,308,'COMPARTMENT COORDINATION',[
        'Preserve two independent exits from attended machinery spaces. Keep watertight boundaries, quick-closing controls, fire isolation and escape continuity consistent across drawings and game geometry.',
        'Red reservations must be coordinated with the existing control booth, passenger stair casing and pipe/cable penetrations. Never interpret a dotted intended path as an approved escape.',
        'Minimum passage widths and doors are design dimensions. Regulatory adequacy requires the vessel-specific service basis and review.'
    ])
    scale_bar(50,55,50);book.save_sheet()

    # Adopted conformal double-bottom reservations: dimensions from exact source loft helper.
    packing=hull_results.get('acceptedTankPacking',{})
    if packing and d.get('tankCoordinateSamples'):
        book.sheet('JS127-ER-108','Double-bottom tank allocation and conformal boundaries','A2','1:50','Accepted planning reservations;100mm geometric clearance and10% volume deduction are not structural approval.')
        tt=transform((34-X0/50,268),50)
        colors={'erFluidEnvelope':TEAL,'aftTrimBallast':RED,'mainBallast':'#5b7f4b'}
        names={'erFluidEnvelope':'ER FLUID RESERVE','aftTrimBallast':'PAIRED TRIM BALLAST','mainBallast':'MAIN BALLAST P/S'}
        for key in colors:
            zz=d['tankCoordinateSamples'][key]['longitudinal'];col=colors[key]
            for side in [1,-1]:
                outer=[[v['X']*1000,side*v['topWidth']*1000,v['upper']*1000] for v in zz]
                inner=[[zz[-1]['X']*1000,side*200,680],[zz[0]['X']*1000,side*200,680]]
                pts=outer+inner;book.poly([tt(p) for p in pts],col,.35,close=True);book.msp.add_lwpolyline([(p[0],p[1]) for p in pts],close=True,dxfattribs={'layer':'RESERVATION'})
            xc=(zz[0]['X']+zz[-1]['X'])*500;book.text(tt([xc,0,0])[0],354,names[key],2.4,True,col,align='center')
            book.dim(tt([zz[0]['X']*1000,-4100,0]),tt([zz[-1]['X']*1000,-4100,0]),-8,f"{(zz[-1]['X']-zz[0]['X'])*1000:.0f}")
        book.text(35,368,'PLAN AT TANK UPPER LIMIT Z680; gap400 along centreline',2.8,True)
        # Separate section uses a true1:50 view, with its own signed transverse/baseline datum.
        st=transform((122,124),50,'section');key='aftTrimBallast';ss=d['tankCoordinateSamples'][key]['transverse'];col=RED
        for side in [1,-1]:
            op=[[v['X']*1000,side*v['outer']*1000,v['Z']*1000] for v in ss]
            pts=op+[[ss[-1]['X']*1000,side*200,680],[ss[0]['X']*1000,side*200,100]]
            book.poly([st(p) for p in pts],col,.35,close=True);book.msp.add_lwpolyline([(p[1],p[2]) for p in pts],close=True,dxfattribs={'layer':'RESERVATION'})
        book.text(35,154,'TYPICAL TRIM TANK SECTION AT X14750',2.8,True)
        book.dim(st([14750,200,100]),st([14750,200,680]),-8,'580 maximum vertical band')
        book.dim(st([14750,-200,100]),st([14750,200,100]),-7,'400 centre gap')
        rows=[]
        for key in colors:
            z=packing[key];nom=z.get('requiredNominalM3',z.get('nominalTotalM3',''))
            rows.append([short(names[key],24),f"{z['z'][0]*1000:.0f}-{z['z'][1]*1000:.0f}",f"{z['grossEnvelopeTotalM3']:.4f}",f"{z['planningCapacityTotalM3']:.4f}",nom])
        book.table(287,346,288,['Allocation','X limits mm','Gross m3','Plan m3','Nominal m3'],rows,[1.5,1.1,.7,.7,.7],size=2.4,rowh=8)
        book.notes(288,295,285,'ALLOCATION AND CONSTRUCTION HOLDS',[
            'ER reserve accommodates16.9m3 nominal fluids:15m3 fuel,1m3 bilge,0.3m3 sludge,0.6m3 lube oil. Individual partitions are not designed.',
            'Trim reserve X14100-15400: nominal2m3 each side. Main ballast X15600-20000: nominal8m3 each side. Longitudinal zones are disjoint.',
            'Outboard boundaries follow the loft minus100mm horizontal reserve. Lower boundary is max(Z100,hull keel+100). Upper limit Z680.',
            '100mm is geometric clearance, not plating thickness.10% volume deduction is a planning allowance, not calculated framing displacement or calibrated net capacity.',
            'Partitions, scantlings, supports, welds, pressure tests, air/sounding pipes and free-surface calculations require engineering and approval.',
            'Source ID aft-peak is retained for game compatibility; this adopted tank pair is under the auxiliary machinery room, not outside the stern hull.'
        ])
        ordinates=packing['aftTrimBallast'].get('ordinateTable',[])
        book.table(287,124,288,['X mm','Lower Z','Inner Y','OuterY Zlow','OuterY Z390','OuterY Z680'],[[f"{r['zM']*1000:.0f}",f"{r['lowerYM']*1000:.1f}",f"{r['innerXM']*1000:.1f}",f"{r['outboardXAtLowerYM']*1000:.1f}",f"{r['outboardXAtMidYM']*1000:.1f}",f"{r['outboardXAtUpperYM']*1000:.1f}"] for r in ordinates],[.8,.8,.8,1,1,1],size=2.3,rowh=7)
        scale_bar(35,58,50);book.save_sheet()

    # Current routed systems: one scaled physical sheet per grouping, complete raw coordinates supplied.
    for no,name,systems in [('105','Physical pipe routes - fuel and lubricating oil',['fuel','lube']),('106','Physical pipe routes - cooling and water',['seawater','jacket','freshwater']),('107','Physical pipe routes - bilge, fire, air and sanitary',['bilge','fire','air','sewage'])]:
        book.sheet('JS127-ER-'+no,name,'A2','1:50','Plan projection of model pipe centre-lines; no pipe-class, support or clash approval.')
        tr=transform((35-X0/50,259),50);boundary(tr)
        for b in major:cadbox(b,tr,color='#b5bec2')
        for r in pipes:
            if r['system'] not in systems:continue
            for p,q in zip(r['points'][:-1],r['points'][1:]):
                book.msp.add_line(p[:2],q[:2],dxfattribs={'layer':'PIPING'});book.line(tr(p),tr(q),r['colour'],.28)
        rr=[r for r in pipes if r['system'] in systems]
        legend=[]
        for sid in systems:
            ss=next(s for s in d['piping'] if s['id']==sid);book.line((350,343-len(legend)*8),(364,343-len(legend)*8),ss['colour'],1);book.text(368,341-len(legend)*8,ss['name'],2.8,True);legend.append(sid)
        book.notes(350,290,224,'PHYSICAL ROUTING QUALIFICATIONS',[
            f'{len(rr)} routed connections shown. Pipe coordinates and nominal diameters are exported in pipe_routes_mm.json; line/node schedule identifies missing physical connections.',
            'Plan projection hides height crossings. Refer to route Z values and three-dimensional DXF/OBJ; equal plan locations do not prove pipe interference.',
            'DN is nominal bore. Pipe wall, outside diameter, bends, flange patterns, valve face-to-face dimensions and insulation thickness remain unverified.',
            'Penetrations require approved sleeves, seals, collars and watertight/fire integrity. A visible game flange is not a fabrication detail.',
            'Routing currently excludes exhaust and hydraulics from the automatic physical lanes. Their connection schematics and release holds are supplied separately.',
            'Only routes accepted by the current geometric screen are drawn here. Omitted connections remain unresolved; material, lagging, real fittings and support checks are additional release holds.'
        ])
        book.table(350,131,224,['System','Model routes','Topology lines'],[[s,len([r for r in rr if r['system']==s]),len([l for l in lines if l['system']==s])] for s in systems],[1.5,1,1],rowh=7)
        scale_bar(35,55,50);book.save_sheet()

    # Each system is a readable diagram plus exact node key: graphs are concept schematics.
    for si,s in enumerate(d['piping']):
        no='JS127-PID-'+str(si+1).zfill(2)
        book.sheet(no,s['name']+' - system connection schematic','A3','NTS','Topology from ferry-piping.js; equipment nodes retain original tags. DN values require hydraulic verification.')
        ns=s['nodes'];maxc=max(n['c'] for n in ns);minr=min(n['r'] for n in ns);maxr=max(n['r'] for n in ns);dy=(147/(maxr-minr)) if maxr>minr else 0;dx=250/(maxc or 1)
        pos={n['id']:(34+n['c']*dx,247-(n['r']-minr)*dy) for n in ns};index={n['id']:i+1 for i,n in enumerate(ns)}
        # Network edges first, then symbols. Multiple edges deliberately offset to avoid stacked strokes.
        for j,li in enumerate(s['lines']):
            p=pos[li['from']];q=pos[li['to']];offset=(j%5-2)*1.6
            pts=[p,(p[0]+(q[0]-p[0])*.45,p[1]+offset),(p[0]+(q[0]-p[0])*.45,q[1]+offset),q]
            if abs(p[0]-q[0])<.1:pts=[p,(p[0]+11+offset,p[1]),(q[0]+11+offset,q[1]),q]
            book.poly(pts,s['colour'],.32)
            book.msp.add_lwpolyline(pts,dxfattribs={'layer':'PIPING'})
        for n in ns:
            x,y=pos[n['id']];kind=n['kind'];num=index[n['id']]
            if kind in ['pump','compressor']:
                book.circle(x,y,3.1,s['colour'],'#ffffff');book.poly([(x-1.8,y-1.6),(x+2,y),(x-1.8,y+1.6)],s['colour'],.3,close=True)
                book.msp.add_circle((x,y),3.1,dxfattribs={'layer':'EQUIPMENT'});book.msp.add_lwpolyline([(x-1.8,y-1.6),(x+2,y),(x-1.8,y+1.6)],close=True,dxfattribs={'layer':'EQUIPMENT'})
            elif kind in ['valve','relief']:
                book.poly([(x-3,y-2),(x+3,y+2),(x+3,y-2),(x-3,y+2)],s['colour'],.3,close=True)
                book.msp.add_lwpolyline([(x-3,y-2),(x+3,y+2),(x+3,y-2),(x-3,y+2)],close=True,dxfattribs={'layer':'EQUIPMENT'})
            elif kind=='sensor':
                book.circle(x,y,3.1,s['colour'],'#ffffff');book.text(x,y-.7,'I',2.2,True,align='center');book.msp.add_circle((x,y),3.1,dxfattribs={'layer':'EQUIPMENT'});book.msp.add_text('I',dxfattribs={'height':2.2,'insert':(x-.5,y-.7),'layer':'ANNOTATION'})
            else:
                book.rect(x-3.4,y-2.7,6.8,5.4,s['colour'],'#ffffff');book.msp.add_lwpolyline([(x-3.4,y-2.7),(x+3.4,y-2.7),(x+3.4,y+2.7),(x-3.4,y+2.7)],close=True,dxfattribs={'layer':'EQUIPMENT'})
            book.text(x,y+4.2,f'{num}',2.3,True,align='center');book.msp.add_text(str(num)+' '+n['id'],dxfattribs={'height':2.5,'insert':(x-3,y+4.5),'layer':'ANNOTATION'})
        book.text(19,82,'Symbols: circle/triangle pump; bow-tie valve; I instrument; rectangle equipment. Indicative symbols only.',2.2)
        book.text(19,77,'Line direction and valve fail position are not implied. Complete IDs, DN and notes in piping_line_schedule.csv.',2.2)
        key=[[index[n['id']],n['id'],short(n['tag'],26)] for n in ns]
        # right-side node key fits up to 28 nodes per sheet
        book.table(309,250,94,['No.','Node ID','Equipment tag'],key,[.3,1.15,1.6],size=1.9,rowh=min(6.5,175/(len(ns)+1)))
        book.text(309,69,'Medium: '+short(s['medium'],46),2.1)
        book.wrapped(19,65,'Release hold: hydraulic capacity / pipe class / isolation / instrumentation / fail-safe logic / material / approved maker interfaces.',280,2.2,3.4,RED)
        book.save_sheet()
        # detailed P&ID connection schedules carry readable exact equipment labels and each line bore.
        nodechunks=[ns[i:i+20] for i in range(0,len(ns),20)]
        for ci,chunk in enumerate(nodechunks):
            book.sheet(no+'-N'+str(ci+1),s['name']+' - equipment and node schedule','A3','NTS','Node tag and compartment authority: source module; maker approval and process calculations are open.')
            nr=[]
            for n in chunk:
                p=next((nn for nn in nodes if nn['system']==s['id'] and nn['id']==n['id']),{})
                nr.append([index[n['id']],n['id'],n['tag'],short(n['label'],67),n['where'],'MODEL' if p.get('X_mm') is not None else 'MISSING'])
            book.table(18,249,384,['No.','Node','Tag','Equipment / function','Space','Port'],nr,[.25,.7,1.2,3.1,.95,.5],size=2.25,rowh=7)
            yy=book.notes(20,249-7*(len(nr)+1)-13,378,'SYSTEM NOTES',s['notes'],size=2.4)
            if yy>75:book.notes(20,yy-7,378,'CONSTRUCTION RELEASE HOLD',['Equipment labels and ratings are fictional unless explicitly listed in the reference particulars. Line sizing is an assumption pending flow, pressure drop and pump curve verification.','See full line schedule CSV for each branch and missing physical route. No approved bill of material or fabrication isometric is supplied.'],size=2.35)
            book.save_sheet()
        lis=[li for li in lines if li['system']==s['id']]
        for ci in range(math.ceil(len(lis)/24)):
            chunk=lis[ci*24:(ci+1)*24];book.sheet(no+'-L'+str(ci+1),s['name']+' - line connection schedule','A3','NTS','Each DN is a source nominal design value. Material, pressure class, valve counts and testing remain unverified.')
            book.table(18,249,384,['Line ID','From node','To node','DN','Route','Note'],[[li['line'],li['from'],li['to'],str(li['DN_mm']) if li['DN_mm'] else 'signal', 'MODEL' if li['physicalRouteStatus']=='Model route' else 'MISSING',short(li['note'],90)] for li in chunk],[.9,1,1,.3,.5,3],size=2.2,rowh=7)
            book.notes(20,66,377,'CONNECTION SCHEDULE QUALIFICATION',['Signal links (DN0) are not pipe lines. Model routes terminate at game connection anchors; their coordinates are not vendor nozzle locations.'],size=2.3);book.save_sheet()

    # Electrical graph intentionally separates power conversion and selector boundaries.
    sources={s['id']:s for s in d['sources']};dg1=sources['DG1'];dg2=sources['DG2'];eg=sources['EG'];lt=sources['T1'];shore=sources['shore'];etr=sources['ETR']
    side_label=lambda ss,key:f"{ss[key]['amps']:.1f} A | {ss[key]['breaker']} frame / {ss[key]['breakerSetting']} setting"
    book.sheet('JS127-EL-001','Electrical distribution - corrected one-line','A3','NTS','Primary and secondary sides shown separately; breaker frames and provisional settings in A. No fault/selectivity approval.')
    def elbox(x,y,w,h,label,detail=''):
        book.rect(x,y,w,h,TEAL,'#f5f8f8',.4);book.text(x+w/2,y+h-4.5,label,2.8,True,align='center')
        if detail:book.wrapped(x+2,y+h-9,detail,w-4,2.1,3)
        book.msp.add_lwpolyline([(x,y),(x+w,y),(x+w,y+h),(x,y+h)],close=True,dxfattribs={'layer':'GEOMETRY'});book.msp.add_text(label,dxfattribs={'height':3,'insert':(x+2,y+h-5),'layer':'ANNOTATION'})
    def elline(p,q):book.line(p,q,INK,.4);book.msp.add_line(p,q,dxfattribs={'layer':'GEOMETRY'})
    elbox(22,219,65,25,'DG1',f"{d['electrics']['generators']['kVA']} kVA | {dg1['volts']} V nameplate | {d['electrics']['generators']['hz']} Hz")
    elbox(105,219,65,25,'DG2',f"{d['electrics']['generators']['kVA']} kVA | {dg2['volts']} V nameplate | {d['electrics']['generators']['hz']} Hz")
    elbox(22,161,148,29,'MSB - 440 V nominal','IT system | synchronisation and generator protection required')
    elline((54,219),(54,190));elline((137,219),(137,190));book.text(61,206,f"{dg1['breaker']} frame / {dg1['breakerSetting']} setting",2.05);book.text(144,206,f"{dg2['breaker']} frame / {dg2['breakerSetting']} setting",2.05)
    elbox(198,219,85,25,'SHORE TRANSFORMER',f"{shore['primary']['volts']} -> {shore['secondary']['volts']} V | {shore['kVA']} kVA | 60 Hz required")
    elline((241,219),(241,176));elline((241,176),(170,176));book.text(185,210,'P: '+side_label(shore,'primary'),1.95);book.text(185,204,'S: '+side_label(shore,'secondary'),1.95);book.text(198,198,'No generator parallel',2.1)
    elbox(22,106,70,30,f"T1 / T2 - {lt['kVA']} kVA",f"{lt['primary']['volts']} ->{lt['secondary']['volts']} V | 3 phase | one duty, one standby")
    elline((55,161),(55,136));book.text(62,148,'P: '+side_label(lt,'primary'),2.0)
    elbox(109,106,61,30,f"LB - {lt['secondary']['volts']} V",'S: '+side_label(lt,'secondary'))
    elline((92,121),(109,121));book.text(107,99,'Interlocked selector; no parallel',2.1)
    elbox(311,219,87,25,f"EG - {d['electrics']['emergency']['kVA']} kVA",f"{eg['volts']} V nameplate | 440 V nominal | {d['electrics']['emergency']['kW']} kW")
    elbox(311,161,87,29,'ESB - 440 V','Independent emergency source; MSB tie interlocked')
    elline((353,219),(353,190));elline((170,170),(311,170));book.text(216,163,'MSB / EG changeover interlock',2.1);book.text(358,203,f"{eg['breaker']} frame / {eg['breakerSetting']} setting",2.05)
    elbox(311,106,87,30,f"ETR - {etr['kVA']} kVA",f"{etr['primary']['volts']} ->{etr['secondary']['volts']} V | emergency lighting | I {etr['primary']['amps']} /{etr['secondary']['amps']} A")
    elline((353,161),(353,136));book.text(310,98,'P: '+side_label(etr,'primary'),1.9);book.text(310,94,'S: '+side_label(etr,'secondary'),1.9)
    book.notes(21,83,270,'DESIGN HOLDS',['Generator bus voltage regulation, feeder source impedance, transformer connection groups, frequency compatibility, starting transient, short-circuit duty, selectivity and emergency endurance need verification.','PE is separate from loaded conductors. Star-delta motors require six motor conductors plus PE from starter to motor.'],size=2.3)
    book.save_sheet()

    source_rows=[]
    for s in d['sources']:
        if s.get('primary'):
            for key in ['primary','secondary']:
                v=s[key];source_rows.append([s['id'],key,f"{v.get('volts','')} V",f"{v.get('amps',0):.1f}",v.get('breaker',''),v.get('breakerSetting',''),v.get('cable','')])
        else:source_rows.append([s['id'],'output',str(s.get('volts',''))+' V',s.get('amps',''),s.get('breaker',''),s.get('breakerSetting',''),s.get('cable','')])
    book.sheet('JS127-EL-002','Sources and transformer side schedule','A3','NTS','Source current and protection are side-specific; loaded conductor count excludes PE.')
    book.table(18,249,384,['Source','Side','Voltage','Rated A','Frame A','Setting A','Cable'],source_rows,[.6,.75,.6,.6,.6,.6,2.7],rowh=8)
    book.notes(20,249-8*(len(source_rows)+1)-15,378,'CALCULATION BASIS',[
        'Three-phase I=S/(sqrt(3)U). Lighting transformer30kVA:39.36A at440V;164.96A at105V. Shore50kVA:144.34A at200V;65.61A at440V.',
        'Primary and secondary conductors must be independently protected and sized. A 50A primary breaker does not establish adequate 105V secondary cable protection.',
        'Current game cable ampacity assumptions are not verified vendor tables. Apply actual cable construction, ambient, grouping, thermal and short-circuit withstand factors before release.',
        'Full cable and feeder metadata, including PE and motor-tail conductors where available, are exported in electrical_feeders.csv.'
    ]);book.save_sheet()
    for ci in range(math.ceil(len(d['feeders'])/20)):
        chunk=d['feeders'][ci*20:(ci+1)*20];book.sheet('JS127-EL-F'+str(ci+1).zfill(2),'Feeder and cable schedule - '+str(ci+1),'A3','NTS','Preliminary cable selection; voltage-drop correction includes copper conductor operating temperature.')
        book.table(18,249,384,['ID','Board','Load / consumer','A','CB A','Cable + PE','L m','Drop %'],[[f['id'],f['board'],short(f['name'],48),f['amps'],f['breaker'],f['cable'],f['length'],f['drop']] for f in chunk],[1,.45,2.3,.35,.4,1.1,.35,.45],size=2.1,rowh=7)
        book.notes(20,66,375,'VERIFICATION LIMIT',['Numeric checks cover stated ampacity and steady voltage drop only. Motor-start terminal voltage also depends on source transient response; breaker settings, discrimination, short-circuit ratings and final routes are not approved.'],size=2.3);book.save_sheet()

    book.sheet('JS127-ER-900','Drawing production and validation record','A3','NTS','Validation scope is explicitly bounded; no claim of shipbuilding approval or construction completeness.')
    book.table(18,249,384,['Check','Evidence','Disposition'],[
        ['Geometry scale','Fixed mm geometry ->1:50 PDF transform','Exact transform; print calibration required'],['Paper size','A2 594x420 /A3 420x297 mm','All pages set explicitly'],['CAD editable units','DXF R2010; INSUNITS4','mm geometry in model space'],['Coordinate datums','Game-to-CAD transform in source snapshot','Transom /CL /BL'],['Node connectivity','Every source P&ID node and edge exported','Model topology; incomplete physical routing'],['Electrical side values','Transformer primary /secondary fields','Corrected preliminary calculations'],['Machinery source','Fictional game source +Yanmar reference','No approved vendor installation'],['Maintenance','Proposed machine/removal envelope drawing','Not supplier-verified; overhead limited'],['Construction release','Class/flag/maker/lift/foundation hold items','NOT RELEASED'],['Drawn/checked/approved','Generated; independent computational review','No real professional approval claimed']],[1.1,1.4,1.5],rowh=8)
    book.notes(20,141,379,'FINAL REVIEW INSTRUCTIONS',[
        'Compare source snapshot hashes with the repository engineering modifications and rerun the generator after any dimensional or system change.',
        'Reopen every DXF and validate units and drawing register. Check PDF page bounds, title blocks, scale bars and rendered legibility.',
        'Review source piping corrections, the bilge/ballast separation, actual emergency suction connection and overboard controls before any operational use.',
        'Do not call this package construction-ready. Procurement and yard release require selected makers, signed calculations, approved drawings and applicable surveys.'
    ]);book.save_sheet();book.close()

    # 3D engineering reference: exact source envelope solids, not a certified hull CAD model.
    doc=ezdxf.new('R2010');doc.units=4;doc.header['$INSUNITS']=4;doc.layers.new('EQUIPMENT');doc.layers.new('PIPE_ROUTES');msp=doc.modelspace();verts=[];faces=[];objlines=['# Minato Maru source machinery-space envelopes; design review only. Units millimetres.','mtllib Minato_Maru_ER_Reference.mtl'];mtl=[];offset=0
    def emitbox(b):
        nonlocal offset
        lo=b['min'];hi=b['max'];vv=[[x,y,z] for z in [lo[2],hi[2]] for y in [lo[1],hi[1]] for x in [lo[0],hi[0]]];ff=[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]]
        objlines.append('o '+b['id']+'_'+re.sub('[^A-Za-z0-9_]','_',b['name']));objlines.append('usemtl equipment');objlines.extend('v '+' '.join(f'{a:.3f}' for a in v) for v in vv)
        for f in ff:objlines.append('f '+' '.join(str(offset+i+1) for i in f));msp.add_3dface([vv[i] for i in f],dxfattribs={'layer':'EQUIPMENT'})
        offset+=8
    for b in boxes:emitbox(b)
    for r in pipes:msp.add_polyline3d(r['points'],dxfattribs={'layer':'PIPE_ROUTES'});objlines.append('o '+r['id']+'_'+r['system']);objlines.append('usemtl '+r['system']);objlines.extend('v '+' '.join(f'{a:.3f}' for a in v) for v in r['points']);objlines.append('l '+' '.join(str(offset+i+1) for i in range(len(r['points']))));offset+=len(r['points'])
    mtl=['newmtl equipment','Kd 0.45 0.55 0.55','d 0.6']
    for s in d['piping']:
        h=s['colour'].lstrip('#');rgb=[int(h[i:i+2],16)/255 for i in [0,2,4]];mtl+=['newmtl '+s['id'],'Kd '+' '.join(map(str,rgb))]
    (out/'models'/'Minato_Maru_ER_Reference.obj').write_text('\n'.join(objlines)+'\n');(out/'models'/'Minato_Maru_ER_Reference.mtl').write_text('\n'.join(mtl)+'\n');doc.saveas(out/'models'/'Minato_Maru_ER_Reference_3D.dxf')
    # Data traceability and generation contract.
    refs=machinery_specs.get('sources',[])
    csvwrite(out/'data'/'reference_sources.csv',refs)
    readme=f'''# Minato Maru engine-room CAD - Revision B\n\nStatus: **{STATUS}**. This package records the Johansson World vessel, corrected engineering metadata and explicitly proposed machinery reservations. It is not an approved real-ship building package.\n\n## File use\n\n- `Minato_Maru_Engine_Room_CAD_RevB.pdf`: fixed A2/A3 landscape drawing book. Physical views are1:50 or1:100 as stated at100% print; all system and electrical diagrams are NTS. A5m scale bar measures100mm at1:50 or50mm at1:100.\n- `dxf/`: editable R2010 DXF sheets, units millimetres (INSUNITS4). Physical geometry is1:1 model space; plot at stated PDF scale. Geometry plan X/Y, profile X/Z and transverse Y/Z. Diagram coordinates are NTS.\n- `models/`: source equipment envelope OBJ/MTL and 3D DXF with pipe centre-lines. This is a spatial reference, not an approved complete hull or fabrication solid. OBJ units are millimetres.\n- `data/`: immutable source snapshot and complete schedules. Empty physical coordinates mean missing model anchors; `MISSING` does not imply a disconnected source graph.\n- `drawing_register.csv/json`: all drawing identifiers, sizes, scales and PDF page numbers.\n\n## Datums\n\nCAD X forward from transom, Y to port from centreline, Z up from baseline. Game coordinates are metres with x port, y up from laden waterline, z forward of amidships. Transform: X=1000*(game.z+LOA/2), Y=1000*game.x, Z=1000*(game.y+draft). Dimension values govern; no scaling of browser screenshots is valid.\n\nSource base commit: `{a.commit}`. Snapshot export: `{d['exportedAt']}`. Generation issue date:{DATE}.\n\n## Existing versus proposed\n\nCurrent floor Z{FP:.0f}, deck underside Z{DH:.0f}, nominal clear height{DH-FP:.0f}mm; existing engine-room X{X0:.0f}..{X1:.0f}. Existing model equipment is not supplier geometry. Proposed2700x1500x1650mm,3.6t engine+gear reservations and2900x1800mm removable-cover reservations are design targets only; service envelope overlaps are explicitly unresolved. Engine rating remains the fictional Johansson source rating, not an attributed Yanmar rating.\n\nSeparate references: legacy H outline2000x1305x1431mm, dry engine2365kg, YX181gear560kg/3.03ratio and combined length2364mm; later2020 C operating rating485kW1900rpm. The teal reserve uses combinedLwith engine-onlyW/H; gear/accessory extremes are unverified. These are not a selected Minato Maru installation. References:\n\n- https://www.yanmar.no/theme/yanmarportal/uploadedFiles/Marine/productDownloads/Commercial-datasheet/6148-Datasheet-6AYM-WST.pdf\n- https://www.yanmar.com/media/news/2020/05/22051608/6aym-wstwet.pdf\n\n## Construction release holds\n\nFlag/class design basis, tonnage, hull scantlings, stability and damage stability, fire boundaries and evacuation, engine installation and nozzle/bolt geometry, shaft alignment/thrust/torsional checks, foundations, cooling/ventilation sizing, pipe classes/supports/penetrations, hydraulic capacity, electrical fault/selectivity/starting studies, certified lifting/removal route, signed drawings and survey acceptance. None of these are automatically satisfied by a game-model test pass.\n\n## Reproduction\n\nRun `node export_ferry_data.mjs REPO SNAPSHOT.json`, then `python3 ferry_cad_package.py --data SNAPSHOT.json --out OUTPUT --commit BASE_COMMIT`. Dependencies: Node, Python3, reportlab, ezdxf. The generator does not modify the game repository. For final validation render the PDF at100dpi or better and inspect all pages; reopen every DXF with ezdxf, verify millimetre units, inspect schedules against live corrected source.\n'''
    (out/'README.md').write_text(safe(readme))
    validation={'status':STATUS,'sourceBaseCommit':a.commit,'dimensions':{'paperSizes_mm':PAPERS,'internalLength_mm':XF-X0,'ERlength_mm':X1-X0,'roomClearHeight_mm':DH-FP},'counts':{'pdfPages':len(book.sheets),'dxfSheets':len(book.sheets),'equipmentBounds':len(boxes),'pipingNodes':len(nodes),'pipingLines':len(lines),'modelPipeRoutes':len(pipes),'unresolvedPositiveBoreConnections':len(d['interior'].get('pipeRouteIssues',[])),'feeders':len(d['feeders'])},'electricalNumericDefects':d['electricalNumericDefects'],'unroutedTopologyLines':len([li for li in lines if li['physicalRouteStatus']!='Model route']),'notes':['No construction approval','Reference dimensions distinct from fictional model','Proposed maintenance zones not clash-approved']}
    (out/'production_validation.json').write_text(json.dumps(validation,indent=2));print(json.dumps(validation,indent=2))

if __name__=='__main__':main()
