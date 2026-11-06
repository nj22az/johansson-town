"""Publish the measured restaurant plan as A3 PDF, millimetre DXF and SVG.

python3 tools/build-izakaya-cad.py
Requires reportlab, ezdxf and Pillow. Geometry comes from the same plan as Blender.
"""
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import ezdxf
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/izakaya/compact'
OUT = SOURCE / 'cad'
P = json.loads((SOURCE / 'plan.json').read_text())
PAGE = landscape(A3)
INK, TEAL, GREY = '#253b3d', '#326d67', '#eef1ed'
FONT = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
if FONT.exists():
    pdfmetrics.registerFont(TTFont('CAD', str(FONT)))
    pdfmetrics.registerFont(TTFont('CAD-Bold', str(FONT.with_name('DejaVuSans-Bold.ttf'))))
else:
    raise RuntimeError('DejaVu Sans is required for consistent PDF dimensions')


def shapes():
    out = []
    def rect(x, z, w, d, label='', kind='fixture'):
        out.append({'kind':kind, 'points':[(x-w/2,z-d/2),(x+w/2,z-d/2),(x+w/2,z+d/2),(x-w/2,z+d/2)], 'label':label})
    out.append({'kind':'floor', 'points':P['floorPolygon'], 'label':''})
    t=P['wallThickness'];m=P['main'];r=P['ramen'];wc=P['wc'];j=P['joinery']
    rect((m['minX']+m['maxX'])/2,m['minZ']-t/2,m['maxX']-m['minX']+2*t,t,kind='wall')
    rect(m['minX']-t/2,(m['minZ']+m['maxZ'])/2,t,m['maxZ']-m['minZ'],kind='wall')
    rect(m['maxX']+t/2,(m['minZ']+r['minZ'])/2,t,r['minZ']-m['minZ'],kind='wall')
    rect((m['maxX']+t+r['maxX']+t)/2,r['minZ']-t/2,r['maxX']-m['maxX'],t,kind='wall')
    rect(r['maxX']+t/2,(r['minZ']+r['maxZ'])/2,t,r['maxZ']-r['minZ'],kind='wall')
    openings=[]
    for d in (P['entrance'],P['ramenEntrance']):
        x=d['position'][0];a=x-d['width']/2;b=x+d['width']/2
        openings.append((a-j['doorJamb'],b+j['doorJamb']))
        for edge in (a-j['doorJamb']/2,b+j['doorJamb']/2):rect(edge,m['maxZ']-.028,j['doorJamb'],.095,kind='joinery')
    w=P['window'];x=w['position'][0];a=x-w['width']/2;b=x+w['width']/2
    openings.append((a-j['windowFrame'],b+j['windowFrame']))
    for edge in (a-j['windowFrame']/2,b+j['windowFrame']/2):rect(edge,w['position'][2]+.04,j['windowFrame'],.15,kind='joinery')
    x=m['minX']-t
    for a,b in sorted(openings):
        if a>x:rect((a+x)/2,m['maxZ']+t/2,a-x,t,kind='wall')
        x=b
    rect((x+r['maxX']+t)/2,m['maxZ']+t/2,r['maxX']+t-x,t,kind='wall')
    c=P['connection']
    for a,b in ((r['minZ'],c['minZ']-j['serviceJamb']),(c['maxZ']+j['serviceJamb'],m['maxZ'])):
        rect(c['x'],(a+b)/2,c['width'],b-a,kind='wall')
    for z in (c['minZ']-j['serviceJamb']/2,c['maxZ']+j['serviceJamb']/2):rect(c['x'],z,.32,j['serviceJamb'],kind='joinery')
    rect((wc['minX']-t/2+wc['maxX'])/2,wc['minZ'],wc['maxX']-wc['minX']+t/2,t,kind='wall')
    for a,b in ((wc['minZ']+t/2,wc['doorZ']-wc['doorWidth']/2-j['wcJamb']),(wc['doorZ']+wc['doorWidth']/2+j['wcJamb'],wc['maxZ'])):
        rect(wc['minX'],(a+b)/2,t,b-a,kind='wall')
    for key,tag in [('backbar','F01'),('counter','F02'),('worktop','F03'),('storage','F04'),('sink','F05'),('ramenCounter','F07'),('ramenPrep','F08'),('ramenLedge','F09')]:
        f=P[key];rect(f['position'][0],f['position'][2]+f.get('collisionOffsetZ',0),f['width'],f['depth'],tag)
    b=P['booth'];rect(b['position'][0],b['position'][2],b['tableWidth'],b['tableDepth'],'F06')
    for z in b['benchZ']:rect(b['position'][0],z,b['benchWidth'],b['benchDepth'],'','seat')
    for x in P['counterStools']:out.append({'kind':'stool','centre':(x,P['counterSeatZ']),'radius':.195})
    for x in P['ramenStools']:out.append({'kind':'stool','centre':(x,P['ramenSeatZ']),'radius':.195})
    for z in P['ramenLedge']['seatZ']:out.append({'kind':'stool','centre':(P['ramenLedge']['seatX'],z),'radius':.195})
    rect(wc['toilet'][0],wc['toilet'][2],.44,.68,'WC')
    rect(wc['sink'][0],wc['sink'][2],.48,.36,'B')
    rect(P['details']['karaoke'][0],P['details']['karaoke'][2],.62,.48,'K')
    rect(P['details']['ticketMachine'][0],P['details']['ticketMachine'][2],.50,.40,'T')
    return out


def text(c,x,y,s,size=10,bold=False,color=INK):
    c.setFillColor(HexColor(color));c.setFont('CAD-Bold' if bold else 'CAD',size);c.drawString(x,y,s)


def lines(c,x,y,items,size=10,leading=17):
    for s in items:text(c,x,y,s,size);y-=leading
    return y


def heading(c,n,title,subtitle):
    c.setFillColor(HexColor('#ffffff'));c.rect(0,0,*PAGE,fill=1,stroke=0)
    text(c,48,PAGE[1]-55,'MINATO IZAKAYA / SATO RAMEN',11,True,TEAL)
    text(c,48,PAGE[1]-91,title,25,True)
    text(c,48,PAGE[1]-114,subtitle,10)
    c.setStrokeColor(HexColor(TEAL));c.line(48,48,PAGE[0]-48,48)
    text(c,48,31,'IZ-09  |  Revision 9  |  30 October 2026  |  Game geometry, not a construction approval',8)
    text(c,PAGE[0]-100,31,f'{n} / 3',8)


def dimension(c,a,b,offset,label,vertical=False):
    c.setStrokeColor(HexColor(TEAL));c.setLineWidth(.55)
    if vertical:
        x=offset;c.line(x,a[1],x,b[1]);c.line(a[0],a[1],x-5,a[1]);c.line(b[0],b[1],x-5,b[1])
        for y in (a[1],b[1]):c.line(x-3,y-3,x+3,y+3)
        c.saveState();c.translate(x-7,(a[1]+b[1])/2);c.rotate(90);text(c,0,0,label,8);c.restoreState()
    else:
        y=offset;c.line(a[0],y,b[0],y);c.line(a[0],a[1],a[0],y+5);c.line(b[0],b[1],b[0],y+5)
        for x in (a[0],b[0]):c.line(x-3,y-3,x+3,y+3)
        width=pdfmetrics.stringWidth(label,'CAD',8);text(c,(a[0]+b[0]-width)/2,y+7,label,8)


def make_pdf(items):
    path=OUT/'Minato_Izakaya_CAD_Rev9.pdf';c=canvas.Canvas(str(path),pagesize=PAGE)
    c.setTitle('Minato Izakaya - measured CAD and geometry repair - Revision 9')
    heading(c,1,'General arrangement','Clear dimensions in millimetres. Plan at 1:50 on A3; do not scale a resized print.')
    scale=1000/50*72/25.4
    xy=lambda x,z:(100+(x+4.08)*scale,250+(3.45-z)*scale)
    fills={'floor':'#faf8f0','wall':'#c0c6c1','joinery':'#987d58','fixture':'#e0e9e3','seat':'#bd9b8c'}
    for s in items:
        c.setStrokeColor(HexColor(INK));c.setLineWidth(.6)
        if s['kind']=='stool':
            x,y=xy(*s['centre']);c.setFillColor(HexColor('#bd9b8c'));c.circle(x,y,s['radius']*scale,fill=1,stroke=1);continue
        pts=[xy(*p) for p in s['points']];p=c.beginPath();p.moveTo(*pts[0])
        for point in pts[1:]:p.lineTo(*point)
        p.close();c.setFillColor(HexColor(fills[s['kind']]));c.drawPath(p,fill=1,stroke=1)
        if s['label']:
            x=sum(v[0] for v in pts)/4;y=sum(v[1] for v in pts)/4;text(c,x-9,y-3,s['label'],7,True)
    text(c,*xy(-3.7,.85),'MINATO',12,True);text(c,*xy(3.2,1.9),'SATO',11,True)
    text(c,*xy(-3.5,-2.38),'STAFF AISLE',8);text(c,*xy(.96,2.3),'GUEST WC',7)
    for key,title in [('entrance','1500 clear'),('ramenEntrance','1200 clear')]:
        d=P[key];x,y=xy(d['position'][0],3.45);c.setStrokeColor(HexColor(TEAL));c.line(x,y+15,x,y-21);c.line(x,y-21,x-4,y-15);c.line(x,y-21,x+4,y-15);text(c,x-26,y-37,title,8)
    dimension(c,xy(-4.08,-3.75),xy(2.32,-3.75),xy(0,-4.45)[1],'6400')
    dimension(c,xy(-4.08,3.45),xy(5.86,3.45),xy(0,4.5)[1],'9940 overall clear extent')
    dimension(c,xy(-4.08,-3.75),xy(-4.08,3.45),58,'7200',True)
    x=820;y=665;text(c,x,y,'Drawing keys',13,True);y-=29
    entries=['F01  Original walnut cabinet, 3390 x 640','F02  Guest counter, 4350 x 700','F03  Service worktop, 4350 x 500','F04  Cold store, 700 x 600','F05  Wash / cooking unit, 1250 x 600','F06  Four-place table, 1500 x 750','F07  Sato counter, 2400 x 700','F08  Sato prep bench, 3150 x 600','F09  Side ledge, 400 x 1450','K  Karaoke   T  Meal tickets   B  Basin']
    y=lines(c,x,y,entries,9,22)-23;text(c,x,y,'Clear circulation',13,True);y-=27
    y=lines(c,x,y,['Minato staff aisle: 1250','Sato working aisle: 1120','Shared passage: 1500 clear','Guest WC door: 860 clear','5 Minato stools + 4 booth places','3 Sato stools + 2 ledge places'],9,21)
    lines(c,100,165,['The two street doors enter one connected restaurant. Existing seats, serving points and circulation are retained.',
                     'Rough openings include their timber frames. Walls stop at the outside of the joinery; window corners use butt joints.',
                     'Furniture footprints are measured envelopes. Game collision margins are checked separately by the regression suite.'],10,20)
    c.showPage()
    heading(c,2,'Service section and joinery','Service section at 1:30 on A3. Heights use the game Y datum; the finished floor is Y = 40 mm.')
    sc=1000/30*72/25.4;xy=lambda z,y:(90+(z+3.75)*sc,300+y*sc)
    def block(z0,z1,y0,y1,fill):
        x,y=xy(z0,y0);c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(INK));c.rect(x,y,(z1-z0)*sc,(y1-y0)*sc,fill=1,stroke=1)
    block(-3.9,3.6,.01,.04,'#9b825f');block(-3.90,-3.75,.04,2.94,'#c0c6c1');block(-3.75,3.45,2.94,3.01,'#c0c6c1')
    block(-3.69,-3.05,.04,2.681,'#987d58');block(-1.80,-1.30,.04,.9175,'#d1d8d2');block(-1.30,-.60,.04,.78,'#987d58')
    block(-.375,.015,.435,.46,'#a57260');block(-.21,-.15,.04,.435,'#987d58')
    text(c,*xy(-3.66,2.35),'F01',10,True);text(c,*xy(-1.78,.65),'F03',8,True);text(c,*xy(-1.26,.55),'F02',8,True)
    dimension(c,xy(-3.05,.04),xy(-1.80,.04),260,'1250 staff aisle')
    dimension(c,xy(-3.75,.04),xy(-3.75,2.94),60,'2900 clear floor to ceiling',True)
    text(c,820,665,'Height schedule / Y datum',13,True)
    lines(c,820,633,['Ceiling underside  2940','Cabinet top  2681 (export rounded)','Kitchen worktop  917.5','Guest / Sato counter  780','Booth table  720','Stool / bench seat  460','Finished floor  40'],10,25)
    text(c,90,205,'Joinery dimensions',13,True)
    lines(c,90,179,['Minato door: 1500 clear + 2 x 55 jambs = 1610 rough width; head allowance 75.',
                    'Street window: 2250 x 1050 clear; 55 frame gives a 2360 x 1160 rough aperture.',
                    'Kitchen link: 1500 clear + 2 x 50 jambs = 1600 rough opening; head allowance 70.',
                    'Guest WC: 860 clear + 2 x 50 jambs = 960 rough opening; folding leaves remain parked clear.'],10,21)
    text(c,820,396,'Repair details',13,True)
    lines(c,820,369,['Printed book and recipe faces are','part of their solid surfaces.','Food sits inside open topping pans.','Can artwork is the metal sidewall.','Appliance radii fit the panel height.','Washroom lettering faces the room.'],9,21)
    lines(c,90,75,['Stool projected from the nearest counter place. Existing seat heights are preserved; this is a geometric game drawing.'],8,12)
    c.showPage()
    heading(c,3,'Architectural review','Blender 4.5.3 LTS render of the rebuilt source. This is not a running-game or physical-device screenshot.')
    image=SOURCE/'entry.png'
    c.drawImage(ImageReader(str(image)),48,190,width=756,height=504,preserveAspectRatio=True,anchor='c')
    c.drawImage(ImageReader(str(ROOT/'assets/graphics/izakaya/sango-quay-artlist.webp')),866,385,width=216,height=288)
    text(c,840,355,'Sango Quay / Artlist',12,True)
    lines(c,840,330,['Original fictional house-brand print.','Seedream 4.5, 30 October 2026.','Mounted once by the game; the','Blender copy is review-only.'],9,19)
    audit=ROOT/'docs/qa/izakaya-rebuild-2026-10-30/geometry.json'
    if audit.exists():
        data=json.loads(audit.read_text());lines(c,48,145,[f"Measured check: {len(data['findings'])} closed-door and {len(data['openDoorFindings'])} open-door surface conflicts at 2 mm / 0.0005 m2.",
            'The full fitted interior, runtime dressing and material geometry are scanned. A planted wall overlay must still fail.',
            'The reported device crash is not reproduced here. Entry failure now returns outside and records the original error.'],10,20)
    c.showPage();c.save();return path


def make_dxf(items):
    doc=ezdxf.new('R2010');doc.units=4;m=doc.modelspace()
    for name,color in [('WALL',8),('JOINERY',30),('FURNITURE',3),('TEXT',7),('DIM',4)]:doc.layers.new(name,dxfattribs={'color':color})
    for s in items:
        if s['kind']=='stool':m.add_circle((s['centre'][0]*1000,-s['centre'][1]*1000),s['radius']*1000,dxfattribs={'layer':'FURNITURE'});continue
        layer='WALL' if s['kind'] in ('wall','floor') else 'JOINERY' if s['kind']=='joinery' else 'FURNITURE'
        pts=[(x*1000,-z*1000) for x,z in s['points']];m.add_lwpolyline(pts,close=True,dxfattribs={'layer':layer})
        if s['label']:m.add_text(s['label'],dxfattribs={'height':110,'insert':(sum(x for x,y in pts)/4-90,sum(y for x,y in pts)/4-35),'layer':'TEXT'})
    doc.dimstyles.new('IZ50',dxfattribs={'dimtxt':110,'dimasz':85,'dimexo':50,'dimexe':70,'dimdec':0,'dimtad':1})
    for a,b,y in [((-4080,3750),(2320,3750),4350),((-4080,-3450),(5860,-3450),-4400)]:m.add_linear_dim(base=(0,y),p1=a,p2=b,dimstyle='IZ50',dxfattribs={'layer':'DIM'}).render()
    m.add_linear_dim(base=(-4700,0),p1=(-4080,-3450),p2=(-4080,3750),angle=90,dimstyle='IZ50',dxfattribs={'layer':'DIM'}).render()
    m.add_text('IZ-09 REV 9 / ALL UNITS MILLIMETRES / GAME GEOMETRY',dxfattribs={'height':120,'insert':(-4080,-4900),'layer':'TEXT'})
    result=doc.audit()
    if result.errors:raise RuntimeError('DXF audit failed: '+str(result.errors))
    path=OUT/'Minato_Izakaya_Plan_Rev9.dxf';doc.saveas(path);return path


def make_svg(items):
    root=ET.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox='0 0 11500 9200',width='1150',height='920')
    ET.SubElement(root,'rect',width='11500',height='9200',fill='white')
    group=ET.SubElement(root,'g',transform='translate(5000 4700) scale(1000)',stroke=INK,**{'stroke-width':'.018'})
    for s in items:
        if s['kind']=='stool':ET.SubElement(group,'circle',cx=str(s['centre'][0]),cy=str(s['centre'][1]),r=str(s['radius']),fill='#bd9b8c');continue
        ET.SubElement(group,'polygon',points=' '.join(f'{x},{z}' for x,z in s['points']),fill={'wall':'#c0c6c1','joinery':'#987d58','floor':'#faf8f0'}.get(s['kind'],'#e0e9e3'))
        if s['label']:
            x=sum(p[0] for p in s['points'])/4;z=sum(p[1] for p in s['points'])/4
            ET.SubElement(group,'text',x=str(x),y=str(z+.04),fill=INK,stroke='none',**{'font-size':'.13','font-family':'sans-serif','text-anchor':'middle'}).text=s['label']
    ET.SubElement(root,'text',x='500',y='420',fill=INK,**{'font-size':'210','font-family':'sans-serif'}).text='MINATO / SATO - MEASURED ARRANGEMENT - REVISION 9'
    ET.SubElement(root,'text',x='500',y='8800',fill=INK,**{'font-size':'150','font-family':'sans-serif'}).text='Clear extents 9940 x 7200 mm; main 6400 x 7200; annex 3240 x 5200. Use the dimensioned PDF or DXF.'
    path=OUT/'Minato_Izakaya_Plan_Rev9.svg';ET.ElementTree(root).write(path,encoding='utf-8',xml_declaration=True);return path


if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True);items=shapes()
    files=[make_pdf(items),make_dxf(items),make_svg(items)]
    print(json.dumps({'revision':P['revision'],'files':[str(f.relative_to(ROOT)) for f in files],'dxfAuditErrors':0},indent=2))
