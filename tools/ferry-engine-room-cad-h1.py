"""A2 / 1:25 measured implementation amendment. Run after exporting shared H1 data."""
import json, math, zipfile, io
from pathlib import Path
import ezdxf
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'art/ferry-engine-room/cad';OUT.mkdir(parents=True,exist_ok=True)
D=json.loads((OUT/'design-h1.json').read_text());B=D['basis']
G=json.loads((ROOT/'art/ferry-engine-room/geometry-h1.json').read_text())
pdf=canvas.Canvas(str(OUT/'JS127-ER-H1-03.pdf'),pagesize=(594*mm,420*mm));pdf.setTitle('Minato Maru H1-03 - service access, lighting and locked cameras')
doc=ezdxf.new('R2010');doc.units=4;ms=doc.modelspace()
for name,col in [('RETAINED',8),('ACCESS',3),('LIGHTS',2),('DIMENSIONS',7),('CAMERAS',4)]:doc.layers.new(name,dxfattribs={'color':col})
def line(a,b,col='#284a4b',width=.3):
 pdf.setStrokeColor(col);pdf.setLineWidth(width*mm);pdf.line(a[0]*mm,a[1]*mm,b[0]*mm,b[1]*mm)
def text(x,y,s,size=3,bold=False,col='#173638'):
 pdf.setFillColor(col);pdf.setFont('Helvetica-Bold' if bold else 'Helvetica',size*mm);pdf.drawString(x*mm,y*mm,s)
def rect(x,y,w,h,col='#284a4b',fill=None):
 pdf.setStrokeColor(col);pdf.setLineWidth(.25*mm)
 if fill:pdf.setFillColor(fill)
 pdf.rect(x*mm,y*mm,w*mm,h*mm,stroke=1,fill=bool(fill))
def dim(a,b,y,label):
 line(a,(a[0],y),'#668079',.15);line(b,(b[0],y),'#668079',.15);line((a[0],y),(b[0],y),'#284a4b',.2)
 for x in [a[0],b[0]]:line((x-1.1,y-1.1),(x+1.1,y+1.1))
 text((a[0]+b[0])/2-len(label)*.6,y+2,label,2.7)
def native_dim(a,b,base,label):
 dm=ms.add_linear_dim(base=base,p1=a,p2=b,angle=0,text=label,dxfattribs={'layer':'DIMENSIONS'},override={'dimtxt':65,'dimasz':65});dm.render()
rect(12,12,570,396)
text(24,392,'MINATO MARU / ENGINE ROOM H1',6,True)
text(24,382,'JS127-ER-H1-03  |  CAD implementation amendment  |  31 October 2026',3.5,True)
text(24,373,'Development geometry study. Source positions retained; dimensions in millimetres. Plan 1:25 at A2.',3)
# Main-engine room plan: X forward to the right, Y port up.
def P(X,Y):return (35+(X-8500)/25,49+(Y+3980)/25)
for b in G['boxes']:
 a,c=b['a'],b['b'];lo=[min(a[i],c[i])for i in range(3)];hi=[max(a[i],c[i])for i in range(3)]
 x0,x1=(lo[2]+17.25)*1000,(hi[2]+17.25)*1000;y0,y1=lo[0]*1000,hi[0]*1000
 if x1<8500 or x0>14000 or not lo[1]+1.9<=1.45<=hi[1]+1.9:continue
 x0=max(8500,x0);x1=min(14000,x1)
 if min(x1-x0,y1-y0)<.1:continue
 x,y=P(x0,y0);rect(x,y,(x1-x0)/25,(y1-y0)/25,'#9aa7a1','#e2e7df')
 ms.add_lwpolyline([(x0,y0),(x1,y0),(x1,y1),(x0,y1)],close=True,dxfattribs={'layer':'RETAINED'})
rect(*P(8500,-3980),5500/25,7960/25)
for s in [-1,1]:
 Y=s*650
 for x0,x1 in [(9300,10380),(11220,12400)]:
  line(P(x0,Y),P(x1,Y),'#ac8c22',.8);ms.add_line((x0,Y),(x1,Y),dxfattribs={'layer':'ACCESS'})
 for X in [10380,11220]:
  px,py=P(X,Y);pdf.setFillColor('#ac8c22');pdf.circle(px*mm,py*mm,.8*mm,fill=1,stroke=0);ms.add_circle((X,Y),20,dxfattribs={'layer':'ACCESS'})
 dim(P(10400,Y),P(11200,Y),P(0,Y)[1]+s*11,'800 CLEAR')
 native_dim((10400,Y),(11200,Y),(10400,Y+s*275),'800 CLEAR')
# Grating opening and the 50 mm bearing-bar pitch.
x,y=P(9300,-630);rect(x,y,3100/25,1260/25,'#376d70')
for X in range(9300,12400,50):
 line(P(X,-630),P(X,630),'#7c9694',.12);ms.add_line((X,-630),(X,630),dxfattribs={'layer':'ACCESS'})
dim(P(9300,3980),P(12400,3980),363,'3,100 GRATING')
native_dim((9300,630),(12400,630),(9300,1250),'3100 GRATING')
text(40,39,'PLAN / machinery floor +900  |  port up  |  X from transom',2.8,True)
text(40,31,'Grating 3,100 x 1,260; 6 mm bars at 50 mm pitch; top +900.',2.8)
text(40,23,'Shafts, engines, gearboxes and tank-top levels retained.',2.8)
for X,Y in B['luminaires']:
 X*=1000;Y*=1000
 dx,dy=(120,600) if X==24400 else (150,150) if X in [9500,12500] else (300,100)
 ms.add_lwpolyline([(X-dx,Y-dy),(X+dx,Y-dy),(X+dx,Y+dy),(X-dx,Y+dy)],close=True,dxfattribs={'layer':'LIGHTS'})
 if 8500<=X<=14000:
  px,py=P(X,Y);rect(px-12,py-4,24,8,'#c29724');line((px-10,py),(px+10,py),'#c29724',.3)
for s in D['cameras']:
 X,Y,Z=[v*1000 for v in s['pos']];ms.add_circle((X,Y),120,dxfattribs={'layer':'CAMERAS'})
 if 8500<=X<=14000:
  px,py=P(X,Y);pdf.setStrokeColor('#217f99');pdf.circle(px*mm,py*mm,2*mm);text(px+3,py,s['id'],2.4,col='#217f99')
# Vertical access envelope: independent of the plan scale.
text(282,355,'HEIGHT AND SERVICE ACCESS / 1:20',4,True)
def S(x,z):return(320+x/20,145+z/20)
rect(*S(0,900),2200/20,2400/20,'#538e83','#e6f0e8')
rect(*S(0,3300),2200/20,300/20,'#c2a44e','#f4edcf')
rect(*S(0,3600),2200/20,400/20,'#658078','#cdd8d2')
for Z,label in [(900,'FLOOR +900'),(3300,'LOWEST SERVICES +3,300'),(3600,'STRUCTURE UNDERSIDE +3,600'),(4000,'CAR DECK +4,000')]:
 line(S(0,Z),(450,S(0,Z)[1]));text(454,S(0,Z)[1]-1,label,2.5)
line((308,S(0,900)[1]),(308,S(0,3300)[1]));text(280,280,'2,400 clear',3.5,True)
# Full-size CAD section offset to avoid the plan.
for Z in [900,3300,3600,4000]:ms.add_line((30000,Z),(32200,Z),dxfattribs={'layer':'ACCESS'})
for Z in [900,3300]:ms.add_line((30000,Z),(30000,Z+25),dxfattribs={'layer':'ACCESS'})
dm=ms.add_linear_dim(base=(29300,900),p1=(30000,900),p2=(30000,3300),angle=90,text='2400 CLEAR',dxfattribs={'layer':'DIMENSIONS'},override={'dimtxt':65,'dimasz':65});dm.render()
text(282,183,'CHECKED IMPLEMENTATION DETAILS',4,True)
notes=[
'Rail posts: X10,380 and X11,220; diameter 40. Inner faces leave 800 clear.',
'Both inboard engine rails have the service opening. Outside rails remain.',
'Doors X10,900 / 14,000 / 19,000 / 22,500: 2,100 high; widths 700/800/750/700.',
'Five new luminaire reservations: 600 x 200 x 50; underside +3,400.',
'Four retained fittings: two 300-square main-room; two 1,200 x 240 electrical.',
'Fixture centres and all eight fixed cameras are in design-h1.json and DXF.',
'All fixed lens centres: finite and clear by radius 120 against source boxes.',
'Working corridor: 1,260 between 40 mm inboard rails; floor top +900.',
'Clear headroom describes the working routes, not the occupied engine volume.',
'Illustrative pipe previews are omitted; complete service routing remains open.',
'400 mm deck zone is a reservation, not calculated structural scantlings.',
'Structure, stability, berth, fire volume, emergency escape and OEM lifts: OPEN.',
'Blender and World use shared geometry. Meshy pass pending human verification.'
]
for k,n in enumerate(notes):text(282,172-k*10,n,2.7)
text(282,26,'CAD audit: mm units; native dimensions; editable layers; model comparison.',2.6,True)
text(282,19,'H1 is an opt-in development study. No main promotion or fabrication approval.',2.6)
pdf.showPage()
rect(12,12,570,396);text(24,392,'MINATO MARU / H1 LADDER AND TOP LANDING',6,True)
text(24,382,'JS127-ER-H1-04  |  Corrected access detail  |  1:20 at A2  |  mm',3.5,True)
text(24,370,'The longer ladder requires a landing behind its head. Relocate the casing P side door; do not enter mid-flight.',3.3)
def L(X,Z):return(55+(X-5250)/20,110+Z/20)
# Section, with a continuous open hatch and full-height upper casing.
line(L(5250,4000),L(6400,4000),'#217f99',1)
line(L(6400,4000),L(8600,900),'#217f99',.8)
line(L(8600,900),L(9300,900),'#217f99',1)
line(L(9000,3600),L(9600,3600),'#668079',.8)
for i in range(1,14):
 X=6400+2200*i/14;Z=4000-3100*i/14
 line(L(X-70,Z),L(X+70,Z),'#284a4b',.5)
 ms.add_line((X-70,20000+Z),(X+70,20000+Z),dxfattribs={'layer':'ACCESS'})
line(L(6400,4900),L(8600,1800),'#ac8c22',.5)
for a,b in [((5250,24000),(6400,24000)),((6400,24000),(8600,20900)),((8600,20900),(9300,20900)),((6400,24900),(8600,21800))]:ms.add_line(a,b,dxfattribs={'layer':'ACCESS'})
dim(L(5250,4000),L(6400,4000),340,'1,150 LANDING')
dim(L(6400,900),L(8600,900),137,'2,200 RUN')
native_dim((5250,24000),(6400,24000),(5250,24500),'1150 LANDING')
native_dim((6400,20900),(8600,20900),(6400,20500),'2200 RUN')
text(300,340,'ACCESS AUDIT / CLOSED FOR THE PROTOTYPE',4,True)
access=[
'New side-door opening X5,300-6,400; clear longitudinal opening 1,100.',
'Top landing X5,250-6,400: 1,150 long, above the same +4,000 car deck.',
'Ladder head X6,400; foot X8,600; rise 3,100; nominal angle 54.64 degrees.',
'14 risers at 221.43; nominal going 157.14. Flight is an inclined ladder.',
'Rail centres Y3,130 and Y3,970; diameter 40: 800 between inner faces.',
'Tread span Y3,140-3,960: 820 nominal. Hatch Y3,150-4,130: 980.',
'Open car-deck hatch X6,400-9,000. Ladder landing is not a second ER floor.',
'Walk down and back up using the new door and landing, not old X6,900.',
'Keep existing machinery, floor +900, tank top +700 and shaft axes.',
'Whole-vessel and protected emergency escape design remain open.'
]
for k,n in enumerate(access):text(300,326-k*12,n,2.9)
text(300,195,'PORT LOBBY / DOOR AND BENCHES / 1:30',3.5,True)
def Q(X,Y):return(300+(X-3200)/30,112+(Y-2250)/30)
for X0,X1 in B['portLobbyBenches']:
 X0*=1000;X1*=1000;x,y=Q(X0,2250);rect(x,y,(X1-X0)/30,440/30,'#7d6947','#e3dac6')
 ms.add_lwpolyline([(X0,2250),(X1,2250),(X1,2690),(X0,2690)],close=True,dxfattribs={'layer':'ACCESS'})
line(Q(5300,2750),Q(6400,2750),'#217f99',.8)
ms.add_line((5300,2750),(6400,2750),dxfattribs={'layer':'ACCESS'})
ms.add_lwpolyline([(6400,3110),(8600,3110),(8600,3990),(6400,3990)],close=True,dxfattribs={'layer':'ACCESS'})
rect(*Q(6400,3110),2200/30,880/30,'#217f99')
text(300,103,'Door X5,300-6,400. Benches X3,200-5,000 / X6,700-11,000.',2.8)
text(300,94,'Retain total bench length 6,100; redistribute 1,000 forward.',2.8)
text(55,100,'LONGITUDINAL SECTION / X forward from transom; Z above keel',3,True)
text(55,86,'Main access only. No protected escape or lifting-route acceptance is implied.',3)
text(55,65,'Development geometry study; not fabrication or regulatory approval.',3.4,True)
pdf.showPage()
rect(12,12,570,396);text(24,392,'MINATO MARU / H1 BOARDING COORDINATION',6,True)
text(24,382,'JS127-ER-H1-05  |  Gangway and crew station  |  1:20 at A2  |  mm',3.5,True)
text(24,370,'Raised vehicle deck: extend the boarding gangway rather than leave an unsupported step from the pier.',3.3)
length=B['gangwayLength']*1000;rise=4000-(1900+98);reach=math.sqrt(length**2-rise**2)
def R(x,z):return(65+x/20,110+z/20)
line(R(0,4000),R(reach,1998),'#217f99',1)
line(R(0,4900),R(reach,2898),'#ac8c22',.5)
line(R(-700,4000),R(0,4000),'#668079',1)
line(R(1800,1998),R(5000,1998),'#668079',1)
dim(R(0,1998),R(reach,1998),190,f'{reach:,.0f} nominal reach')
text(65,342,f'4,000 sloping length / {math.degrees(math.asin(rise/length)):.2f} deg at zero motion',3.4,True)
text(65,92,'SECTION / waterline datum uses draft 1,900; existing Minato pier top +98.',3)
text(65,80,'Runtime solves the actual top-surface contact under ship pitch and roll.',3)
text(65,68,'This is nominal game-geometry coordination; tidal and hoist design remain open.',3)
text(335,340,'COORDINATED GEOMETRY / LIMITS',4,True)
notes=[
'Gangway: 4,000 long x 1,400 gross width; retained side handrails.',
'Fold upright under passenger deck; 4,200 clear zone reserves 200 margin.',
'New length maintains about 30-degree nominal boarding inclination.',
'Pier landing, clear pedestrian route, toe contact: verify in the walk tests.',
'Forward mooring station follows actual forecastle floor +6,460 above keel.',
'Crew post height derives from the bow-house top +60, not old 3.56 local.',
'Bow ramp geometry retained; both nominal berth routes require walk checks.',
'Hoist capacity, stow restraints, structure, tides and real access: OPEN.',
'No production release is authorised by this drawing.'
]
for k,n in enumerate(notes):text(335,324-k*14,n,2.9)
ms.add_line((40000,4000),(40000+reach,1998),dxfattribs={'layer':'ACCESS'})
for a,b in [((39300,4000),(40000,4000)),((41800,1998),(45000,1998)),((40000,4900),(40000+reach,2898))]:ms.add_line(a,b,dxfattribs={'layer':'ACCESS'})
sloped=ms.add_aligned_dim(p1=(40000,4000),p2=(40000+reach,1998),distance=300,text='4000 GANGWAY',dxfattribs={'layer':'DIMENSIONS'},override={'dimtxt':65,'dimasz':65});sloped.render()
native_dim((40000,1998),(40000+reach,1998),(40000,1400),f'{reach:.0f} REACH')
pdf.showPage()
# Surface finish is specified before Blender construction; it changes no envelope.
F=json.loads((OUT/'finish-h1-f1.json').read_text())
rect(12,12,570,396);text(24,392,'MINATO MARU / BLENDER ASSET FINISH',6,True)
text(24,382,'JS127-ER-H1-06  |  H1-F1 surface detail  |  31 October 2026  |  mm',3.5,True)
text(24,371,'Retain the H1 equipment, machinery axes, access openings and 2,400 clear working envelope.',3.2)
text(35,348,'TYPICAL EQUIPMENT EDGE / 1:2',4,True)
text(35,336,'Illustrative 600 x 400 envelope; actual part dimensions remain source-derived.',3)
# Rounded outline strictly inside the original box. Six millimetres is a maximum.
x,y,w,h,r=35,112,300,200,3
rect(x,y,w,h,'#b9c8c1')
path=pdf.beginPath();path.moveTo((x+r)*mm,y*mm);path.lineTo((x+w-r)*mm,y*mm)
path.arcTo((x+w-2*r)*mm,y*mm,(x+w)*mm,(y+2*r)*mm,startAng=270,extent=90)
path.lineTo((x+w)*mm,(y+h-r)*mm);path.arcTo((x+w-2*r)*mm,(y+h-2*r)*mm,(x+w)*mm,(y+h)*mm,startAng=0,extent=90)
path.lineTo((x+r)*mm,(y+h)*mm);path.arcTo(x*mm,(y+h-2*r)*mm,(x+2*r)*mm,(y+h)*mm,startAng=90,extent=90)
path.lineTo(x*mm,(y+r)*mm);path.arcTo(x*mm,y*mm,(x+2*r)*mm,(y+2*r)*mm,startAng=180,extent=90);path.close()
pdf.setStrokeColor('#217f99');pdf.setLineWidth(.6*mm);pdf.drawPath(path)
dim((x,y),(x+w,y),96,'600 source envelope / no growth')
text(35,77,'R6 MAX / inward cut; two bevel segments. Limit further to 10% of smallest part dimension.',3)
text(35,65,'Exclude floors, bulkheads, deckhead, partitions, sides, trunks and casings.',3)
text(360,348,'DIAL FACE / 2:1',4,True)
pdf.setStrokeColor('#284a4b');pdf.circle(445*mm,240*mm,100*mm)
pdf.circle(445*mm,240*mm,90*mm)
for j in range(11):
 a=math.radians(225-270*j/10)
 line((445+74*math.cos(a),240+74*math.sin(a)),(445+83*math.cos(a),240+83*math.sin(a)))
a=math.radians(225-270*.55);line((445,240),(445+72*math.cos(a),240+72*math.sin(a)),'#b33f37',.8)
text(421,209,'LO PRESS / bar',3)
text(360,129,'100 source dial; static source reading in Blender.',3)
text(360,117,'World retains its live gauges and labels.',3)
for k,n in enumerate(['Source colours retained; paint and bare-metal materials.',
'Short-range contact shade: 220 radius / 22% maximum.',
'Round cylinders: 24 sides; bars: 12 sides; outward faces.',
'No new machinery, pipe routes, fake logos or dirt decals.',
'Blender only. Owner supersedes the former Meshy step.']):text(360,97-k*12,n,2.9)
doc.layers.new('FINISH',dxfattribs={'color':4})
for a,b in [((50006,0),(50594,0)),((50600,6),(50600,394)),((50594,400),(50006,400)),((50000,394),(50000,6))]:ms.add_line(a,b,dxfattribs={'layer':'FINISH'})
for center,start in [((50594,6),270),((50594,394),0),((50006,394),90),((50006,6),180)]:ms.add_arc(center,6,start,start+90,dxfattribs={'layer':'FINISH'})
native_dim((50000,0),(50600,0),(50000,-80),'600 SOURCE ENVELOPE')
ms.add_circle((51000,200),50,dxfattribs={'layer':'FINISH'})
ms.add_circle((51000,200),45,dxfattribs={'layer':'FINISH'})
ms.add_text('R6 MAX INWARD / H1-F1 / BLENDER ONLY',dxfattribs={'height':20,'insert':(50000,500),'layer':'FINISH'})
pdf.showPage();pdf.save()
with zipfile.ZipFile(OUT/'Minato_Maru_RevC_H1_Checkpoint.zip')as archive:
 checkpoint=PdfReader(io.BytesIO(archive.read('Minato_Maru_Engine_Room_RevC_H1/Minato_Maru_Engine_Room_RevC_H1.pdf')))
amendment=PdfReader(OUT/'JS127-ER-H1-03.pdf');combined=PdfWriter()
for page in [*checkpoint.pages[:2],*amendment.pages,*checkpoint.pages[2:]]:combined.add_page(page)
with(OUT/'Minato_Maru_Engine_Room_H1_Implementation.pdf').open('wb')as file:combined.write(file)
layout=doc.layouts.new('A2_PLAN_1_25');layout.page_setup(size=(594,420),margins=(12,12,12,12),units='mm')
layout.add_viewport(center=(150,198),size=(250,350),view_center_point=(11250,0),view_height=8750)
layout.add_viewport(center=(435,290),size=(250,180),view_center_point=(31100,2450),view_height=3600)
for name,views in [
 ('A2_H1_04_ACCESS',[((170,230),(250,260),(7400,22600),5200),((440,220),(270,160),(7000,3100),4800)]),
 ('A2_H1_05_BOARDING',[((220,230),(350,260),(42200,3400),5200)]),
 ('A2_H1_06_FINISH',[((280,230),(500,300),(50550,220),750)])]:
 lay=doc.layouts.new(name);lay.page_setup(size=(594,420),margins=(12,12,12,12),units='mm')
 lay.add_text('MINATO MARU / '+name+' / mm',dxfattribs={'height':4,'insert':(20,385)})
 for center,size,view,height in views:lay.add_viewport(center=center,size=size,view_center_point=view,view_height=height)
issues=doc.audit();assert not issues.errors and not issues.fixes
out=OUT/'JS127-ER-H1-03.dxf';doc.saveas(out);reopened=ezdxf.readfile(out);assert reopened.units==4 and not reopened.audit().errors
(OUT/'audit-h1-03.json').write_text(json.dumps({'revision':'H1-03/04/05/06','sheets':['H1-03','H1-04','H1-05','H1-06'],'camera_count':len(D['cameras']),'units':'mm','pdf_mm':[594,420],'plan_scale':25,'dxf_errors':len(issues.errors),'dxf_fixes':len(issues.fixes),'rail_gap_mm':800,'door_height_mm':2100,'working_clear_mm':2400,'maximum_inward_bevel_mm':F['edge_detail']['equipment_box_bevel_max']*1000,'luminaire_centres':B['luminaires'],'holds':['structure','stability','berth','complete pipe routing','fire volume','emergency escape','OEM removal procedure']},indent=2))
print('H1-03/04/05/06 CAD written; measured access and inward finish details; DXF clean')
