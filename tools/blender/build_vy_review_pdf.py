"""Build the owner's image-led review booklet from actual Blender exports."""
import argparse
import io
import json
from pathlib import Path

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

p=argparse.ArgumentParser();p.add_argument('directory');p.add_argument('output')
args=p.parse_args();root=Path(args.directory);target=Path(args.output)
target.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(target),pagesize=A4,pageCompression=1)
c.setTitle('Vy - Blender skirt review and self-audit')
c.setAuthor('Johansson Studio')
W,H=A4;page=0
ink=colors.HexColor('#202b35');muted=colors.HexColor('#56636c')
style=ParagraphStyle('body',fontName='Helvetica',fontSize=10.5,leading=15,textColor=ink)

def para(text,x,y,w,size=10.5):
    st=ParagraphStyle('p',parent=style,fontSize=size,leading=size*1.43)
    p=Paragraph(text,st);_,height=p.wrap(w,900);p.drawOn(c,x,y-height);return y-height-12

def start(title,subtitle):
    global page
    page+=1;c.setFillColor(colors.HexColor('#f7f5f1'));c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(muted);c.setFont('Helvetica',9);c.drawString(30,H-30,'JOHANSSON STUDIO  /  BLENDER AUTHORING REVIEW  /  24 OCTOBER 2026')
    c.setFillColor(ink);c.setFont('Helvetica-Bold',22);c.drawString(30,H-66,title)
    para(subtitle,30,H-82,W-60,10)
    c.setStrokeColor(colors.HexColor('#c9cecf'));c.line(30,36,W-30,36)
    c.setFont('Helvetica',8);c.setFillColor(muted)
    c.drawString(30,23,'Static skirt study. Creator integration and full-character acceptance remain open.')
    c.drawRightString(W-30,23,f'{page} / 10')

def picture(name,x,y,w,h,label):
    path=root/name
    image=Image.open(path).convert('RGB');image.thumbnail((1400,1400))
    stream=io.BytesIO();image.save(stream,format='JPEG',quality=90,optimize=True)
    iw,ih=image.size;scale=min(w/iw,h/ih);dw,dh=iw*scale,ih*scale
    c.drawImage(ImageReader(stream),x+(w-dw)/2,y+(h-dh)/2,dw,dh)
    c.setFillColor(ink);c.setFont('Helvetica-Bold',10);c.drawString(x,y-16,label)

def grid(items,note):
    for i,(name,label) in enumerate(items):
        picture(name,30+(i%2)*274,440-(i//2)*290,260,260,label)
    para(note,30,104,W-60,10)

start('Vy: Blender skirt revision 2','Refined waist, restrained fabric shaping and a separate 1,472-triangle runtime candidate.')
picture('supplied-character-context.png',30,372,260,325,'SUPPLIED CHARACTER - visual reference only')
picture('authored-cloth-quarter.png',304,372,260,325,'NEW WORK - isolated authored skirt')
y=para('<b>What is delivered:</b> a Blender skirt cage with separate front/back contour control, a distinct waistband, lining, turned lower edge, UVs and six fitting shape keys. The full character on the left is the supplied GLB; it is not a rebuilt Vy.',30,324,W-60,12)
y=para('<b>Audit verdict:</b> the waist shelf is reduced, the horizon has a slight front dip, and the surface has restrained release lines and side-seam pinches. These are useful changes, but dressed-body fit and motion remain unverified. Pixar is the quality ambition, not an achieved standard.',30,y,W-60,12)
para('<b>Booklet:</b> matched front/quarter/side/back geometry; twelve orbit angles; high, underside and edge details; quad cage; findings and the Creator adoption route.',30,y,W-60,11)
c.showPage()

for title,views in [('Matched geometry: front and quarter',['front','quarter']),('Matched geometry: side and rear',['side','back'])]:
    start(title,'Same clay material, orthographic scale, cameras and lights for each supplied/authored pair.')
    grid([(f'{prefix}-{view}.png',f'{label} / {view.upper()}') for view in views for prefix,label in [('reference-clay','SUPPLIED CROP'),('authored-clay','AUTHORED CAGE')]],'Source crop has jagged cut edges and selection holes/fragments. These are QA artefacts, not features to copy. The new mesh is a continuous controlled surface with named panel regions; no sewing simulation was performed.')
    c.showPage()

for angles in [(0,30,60,90),(120,150,180,210),(240,270,300,330)]:
    start(f'Cloth orbit: {angles[0]} to {angles[-1]} degrees','New Blender garment only. Zero degrees faces the front; 180 degrees faces the back.')
    grid([(f'orbit-{a:03d}.png',f'AUTHORED / {a} DEGREES') for a in angles],'Fixed neutral studio lights, 30-degree camera increments and equal framing. Broad asymmetric release lines, small side pinches and a low-strength weave/sheen preview are deliberately restrained. No cloth simulation or dressed-body acceptance is implied.')
    c.showPage()

start('High, low and construction details','New Blender garment only. These deliberately expose openings, lining and edge treatment.')
grid([('detail-high.png','HIGH FRONT / WAIST OPENING'),('detail-underside.png','LOW QUARTER / NATIVE LINING'),('detail-waist.png','TAPERED WAISTBAND / CLOSE VIEW'),('detail-hem.png','TURNED LOWER EDGE / CLOSE VIEW')],'Native authoring model shown here retains its lining for offline review. The separate runtime candidate removes that lining, retaining only short top and hem returns. Band lower offset is 0.00015 source units; front dip 0.0016, hip rise 0.001. Lower seam normals blend into the skirt. Shirt clearance in motion is not verified.')
c.showPage()

start('Editable construction and checks','The native Blender project retains the cage, modifiers, UVs and fitting controls.')
picture('detail-cage.png',70,385,455,340,'AUTHORED QUAD CAGE / WIREFRAME OVERLAY')
y=para('<b>Six fitting controls:</b> waist width, hip width, seat depth, front ease, length and hem flare. The waistband follows these controls. Their operation is checked; safe fitting to every body is not.',30,337,W-60,11)
y=para('<b>Two distinct exports:</b> native beauty rest GLB: 6,912 triangles, no morphs. Reduced runtime candidate: 1,472 triangles, six morphs per part, no full lining. Both contain only authored garment parts. Neither is rigged or animated; no full character has been rebuilt.',30,y,W-60,11)
y=para('<b>17/17 checks passed:</b> native reopening, finite coordinates, quad/UV data, six waistband links, garment-only reimport, bounded triangle count and closed exported shells. Tight bevel clamping initially produced degenerate export strips; the bake now cleans them and the shell check passes.',30,y,W-60,11)
para('<b>Independent surface sample:</b> revised native surface, 1,024 angular samples: mean error 0.00152 source units, 95th percentile 0.00433, maximum 0.01329. Excludes band and hem; crop artefacts affect this result. These figures are not visual or motion acceptance.',30,y,W-60,10)
c.showPage()

start('Actual Three.js runtime candidate','Project GLTFLoader and Three.js, Chromium software WebGL. Isolated rest mesh; not Creator integration.')
grid([('webgl-0.png','RUNTIME / FRONT'),('webgl-60.png','RUNTIME / 60 DEGREES'),('webgl-120.png','RUNTIME / 120 DEGREES'),('webgl-180.png','RUNTIME / REAR')],'1,472 triangles, two draw calls in this isolated test, six morph targets on each part. MeshPhysicalMaterial, exported sheen colour 0.06 and normal-map scale 0.08 verified after loading. Lighting differs from Blender. Faceting, seam response and darker shading still need refinement; no device performance claim.')
c.showPage()

start('Self-audit and Creator adoption','Current verdict: partial Blender authoring progress; reference sophistication remains unaccepted.')
y=H-124
for heading,body in [
('1. Improved, but not finished','Waist, length and front/back volume are closer to the supplied skirt. The isolated renders do not establish how it sits on Vy or how the shirt transitions into the waist.'),
('2. Remaining visual defects','The exaggerated shelf is reduced, but the band/hem still need a shirt and wearer to establish believable tailoring. Runtime shading is darker and more faceted than the Blender preview. Shallow release lines and micro-weave do not prove real drape.'),
('3. Character-level gap','No original body, hair, face, hands, top or footwear was rebuilt in this Blender pass. The earlier Creator approximation remains rejected. No new Creator runtime integration has been made.'),
('4. Fitting and animation gap','No skin binding, walk/turn/sit sequence, all-body clearance or physical iPad performance test. Runtime geometry now meets 1,200-1,600 triangles, but total-avatar and scene budgets still need measurement.'),
('5. Concrete adoption route','Fit the garment on a wearer and establish the actual shirt tuck landmark. A local pre-skin torso/pelvis shape is preferable to inherited pelvis-bone scaling, but leg-root placement and clearance must be solved together. Bind the existing rig and helpers; drive a tested sitting/splay correction from hip flexion.'),
('6. Body proportions matter','At equal nominal character height, the source study waist is about 40% narrower than the current Creator skirt waist. This is a garment-section comparison, not identical anatomical landmarks. Independent body proportions are needed for this look; other residents must retain their own body shapes.'),
('7. Acceptance before replacement','Review the garment on equivalent proportions, then child/teen/adult/elder and slim/broad bodies in continuous motion. Preserve recipe compatibility, run contact/budget checks and resolve the existing Vy paired-pose regression. Nothing is published or deployed.')]:
    y=para(f'<b>{heading}</b><br/>{body}',30,y,W-60,10.5)
c.showPage();c.save()
print(target)
