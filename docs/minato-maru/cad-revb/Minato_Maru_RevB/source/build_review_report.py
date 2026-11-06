from pathlib import Path
import re,json,html,argparse
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Table,TableStyle,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm

parser=argparse.ArgumentParser()
parser.add_argument('--input-dir',type=Path,required=True)
parser.add_argument('--out-dir',type=Path,required=True)
args=parser.parse_args()
SRC=args.input_dir; OUT=args.out_dir
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyTextReview',fontName='Helvetica',fontSize=9,leading=12,spaceAfter=6,wordWrap='CJK'))
styles.add(ParagraphStyle(name='CellReview',fontName='Helvetica',fontSize=8,leading=10,wordWrap='CJK'))
styles['Heading1'].fontSize=17;styles['Heading1'].leading=21;styles['Heading1'].textColor=colors.HexColor('#245c63')
styles['Heading2'].fontSize=12;styles['Heading2'].leading=15;styles['Heading2'].spaceBefore=10
styles['Heading3'].fontSize=10;styles['Heading3'].leading=13
story=[]
def clean(s):
    s=s.replace('\u2013','-').replace('\u2014','-').replace('\u2011','-').replace('→','->').replace('×',' x ').replace('≤','<= ').replace('≥','>= ').replace('±','+/-').replace('≈','approx.').replace('−','-')
    return re.sub('[\u3040-\u30ff\u4e00-\u9fff]','',s)
def fmt(s):
    s=html.escape(clean(s));s=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',s);s=re.sub(r'`([^`]+)`',r'<font color="#355d65">\1</font>',s)
    return s
def para(s,sty='BodyTextReview'):story.append(Paragraph(fmt(s),styles[sty]))
def md(text):
    lines=text.splitlines();i=0;code=False
    while i<len(lines):
        line=lines[i].strip()
        if line.startswith('```'):code=not code;i+=1;continue
        if not line:i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                cells=lines[i].strip().strip('|').split('|');i+=1
                if all(re.fullmatch(r'\s*:?[- ]+:?\s*',x) for x in cells):continue
                rows.append(cells)
            n=max(map(len,rows));rows=[r+['']*(n-len(r)) for r in rows]
            table=Table([[Paragraph(fmt(c.strip()),styles['CellReview']) for c in r] for r in rows],colWidths=[174*mm/n]*n,repeatRows=1,hAlign='LEFT')
            table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8eff0')),('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.25,colors.HexColor('#bcc8ca')),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
            story.extend([table,Spacer(1,6)]);continue
        m=re.match(r'^(#{1,3})\s+(.*)',line)
        if m:para(m.group(2),'Heading'+str(len(m.group(1))))
        elif line.startswith('- ') or line.startswith('* '):para('- '+line[2:])
        elif line.startswith('>'):para(line.lstrip('> '))
        elif line.startswith('---'):story.append(Spacer(1,8))
        else:para(line)
        i+=1

para('JOHANSSON SHIPYARD','Heading1')
para('Minato Maru - Engineering correction and independent review','Heading1')
para('JS-127-ER-900 | Revision B | 13 October 2026')
para('**Issue: FOR DESIGN REVIEW. Construction release withheld.**')
para('This report records implemented corrections to the Johansson World ferry and the accompanying dimensioned CAD reference. It separates verified numerical and game-geometry checks from unverified supplier interfaces and real-vessel construction requirements. The review is an AI-assisted computational review; it is not a survey, statutory certificate or signed professional construction approval.')
para('Correction scope','Heading2')
for s in [
 'The hull loft at 1.900 m immersion displaces 375.41053 t in seawater, replacing the inconsistent 283 t claim. The retained 210 t lightship, 283 t operating target and 1.6 m motion GM remain explicit assumptions, not approved loading particulars.',
 'The former aft tank outside the hull is replaced by disjoint conformal double-bottom reservations under the auxiliary space. Tank envelopes, competing liquid inventories and a stated provisional structural deduction are coordinated numerically.',
 'Both generators move forward into the auxiliary room, clearing the main-engine fore-end service band. Labels, system terminals, local control points and cable route estimates follow the relocated equipment; walking checks use the actual clear aisles.',
 'Transformer and shore supply records distinguish primary and secondary voltage sides. Cable calculations include hot copper, DC return paths, grouped loads, protective conductors and star-delta tails. Emergency-generator motor-start capability remains a hold.',
 'Engineering route acceptance checks finite pipe radius, equipment, bounds and independent circuit interference. Decorative preview routes remain visibly separate from the engineering acceptance registry. Unresolved routes are scheduled individually.',
 'CAD model space uses millimetres and a controlled longitudinal/port/baseline datum. The PDF supplies physical A2/A3 sheets with measured scales; schematics and legacy SVG previews are marked NTS. Creator approval stamps are removed.'
]:para('- '+s)
para('Source control','Heading2')
para('Audited repository snapshot: nj22az/nj22az.github.io, commit e87c06b16734d882626be7fe6cdd2ab153d649c4. Subsequent main commit 0aa7b46ac00cbf4aba6ba5d8bc049a820d5a154a retained identical hashes for the modified ferry source files. Corrections are identified separately in the source-change record. CAD generators reproduce the drawing issue from the saved JSON snapshot; drawing scales apply at 100% print only.')
para('Review disposition','Heading2')
para('The package is a reviewed correction and design-reference issue. It does not establish that a real ship can be built from it. The independent review and outstanding-work register below govern the limits of acceptance; no programme of automatic checks replaces verification of hull structure, weights, stability, machinery supplier data, piping fabrication or classification requirements.')
for name,title in [('independent-review.md','Independent completion review'),('hull-review.md','Hull, tank packing and conditional stability'),('machinery-review.md','Machinery particulars and service calculations'),('electrical-review.md','Electrical correction and verification'),('geometry-review.md','Arrangement, routes and game access')]:
    p=SRC/name
    if not p.exists():raise SystemExit('Required final review missing: '+name)
    story.append(PageBreak());para(title,'Heading1');md(p.read_text())
story.append(PageBreak());para('Validation evidence and file use','Heading1')
v=json.loads((OUT/'data/source_test_results.json').read_text())
para('Scoped source checks: '+str(v['passed'])+' passed; '+str(v['failed'])+' failed. These checks cover the retained ferry behaviour and new numerical, electrical and geometric regressions. They do not constitute full town/browser or live deployment certification.')
para('Read the CAD drawing book alongside this report. Exact identifiers, circuits, node connectivity, accepted physical paths and unresolved path records are supplied in the CSV/JSON schedules. Proposed lift and supplier envelopes are reservations; they are not bolt patterns, certified crane ratings, pipe spools or approved foundation drawings.')
para('Construction release requirements','Heading2')
for s in ['Confirm actual flag, service area, passenger/vehicle programme and applicable rule editions.','Reconcile measured or calculated lightship weights, longitudinal and vertical centres, trimmed load cases, full righting-arm curves, damage stability, downflooding and propeller immersion.','Complete scantlings, weld procedures, engine foundations, shaft alignment, bearing loads, thrust and torsional analyses.','Obtain controlled manufacturer installation drawings, machinery duty approval, connection coordinates, pump curves, cooling and ventilation performance.','Resolve every physical pipe route and define pipe classes, pressure/temperature limits, joints, supports, isolation, fire/watertight penetrations and test procedures.','Validate fire boundaries, actual protected volumes, escape routes, extinguishing distribution and release/interlock functions.','Complete generator transients, short-circuit levels, protection selectivity, installed cable grouping and certified lifting/removal paths.','Obtain required design approval and construction surveys before an approved-for-construction issue.']:
    para('- '+s)
def footer(c,doc):
    c.saveState();c.setStrokeColor(colors.HexColor('#245c63'));c.line(18*mm,17*mm,192*mm,17*mm)
    c.setFont('Helvetica',7);c.setFillColor(colors.HexColor('#4b6167'));c.drawString(18*mm,12*mm,'JS-127-ER-900 | REV B | DESIGN REVIEW - NO CONSTRUCTION APPROVAL');c.drawRightString(192*mm,12*mm,str(doc.page));c.restoreState()
out=OUT/'Minato_Maru_Engineering_Review_RevB.pdf'
SimpleDocTemplate(str(out),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=17*mm,bottomMargin=23*mm,title='Minato Maru Engineering Review Rev B',author='Johansson Shipyard - AI-assisted design review').build(story,onFirstPage=footer,onLaterPages=footer)
print(out)
