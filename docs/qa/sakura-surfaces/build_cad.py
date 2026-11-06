"""Sakura surfaces, drawing set SK-ZF-001..003 revision A (26 October 2026): Sakura Shōten, both storeys, as the game
builds it, drawn for its surfaces: which faces lie in which plane, how the floors are laid, and the audit before and
after the rebuild. From the game's own data and tools/sakura-surface-audit.mjs. Writes, beside this file:

    Sakura-Surfaces-Rev-A.pdf   three A3 sheets: floor finishes plan; layer rules and joint details; the audit
    Sakura-Surfaces-Rev-A.dxf   1:1 millimetres, R2010: both floor plans, the floor finishes, the audit marks
    audit.json                  the shop and the upstairs office as built now (tools/sakura-surface-audit.mjs)
    audit-before.json           the same audit of main at a098bbe5, before this revision (kept, not regenerated)
    checks.json                 every check below, passed or failed

    python3 docs/qa/sakura-surfaces/build_cad.py        (from johansson-town/; needs node, reportlab, ezdxf)

Checks: no two faces within 2 mm of one plane on either storey (decals with each other included); no floor layer within
10 mm of another; the insets flush and the terrazzo cut round them; the DXF reopens with no audit errors.
"""
import json
import os
import subprocess

import ezdxf
from ezdxf.enums import TextEntityAlignment
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
REV, DATE = 'A', '26 October 2026'


def node(js):
    return json.loads(subprocess.run(['node', '--input-type=module', '-e', js], cwd=ROOT, capture_output=True, text=True,
                                     check=True).stdout)


DATA = node("import {installDOM} from './tests/fixtures.mjs';installDOM();"
            "const s=await import('./src/world/interiors/sakura-shell.js');const l=await import('./src/world/interiors/sakura-layout.js');"
            "const r=await import('./src/world/interiors/sakura-restroom.js');const o=await import('./src/world/interiors/sakura-office-room.js');"
            "const so=await import('./src/world/interiors/sakura-small-office.js');"
            "console.log(JSON.stringify({shell:s.SAKURA_SHELL,insets:s.SAKURA_FLOOR_INSETS,tubes:s.TUBE_RUNS,colliders:l.SAKURA_LAYOUT.colliders,"
            "restroom:r.RESTROOM,office:so.SMALL_OFFICE?.room??null,up:o.SAKURA_UPSTAIRS}))")
subprocess.run(['node', 'tools/sakura-surface-audit.mjs', os.path.join(HERE, 'audit.json')], cwd=ROOT, check=True,
               capture_output=True)
AFTER = json.load(open(os.path.join(HERE, 'audit.json')))
BEFORE = json.load(open(os.path.join(HERE, 'audit-before.json')))
S, UP = DATA['shell'], DATA['up']
CHECKS = []


def check(name, ok, detail=''):
    CHECKS.append(dict(check=name, ok=bool(ok), detail=detail))
    return ok


def category(p):
    t = p['a'] + ' ' + p['b']
    if any(k in t for k in ('floor', 'sheen', 'mat', 'rug', 'sticker', 'mosaic')):
        return 'Floors'
    if any(k in t for k in ('goods', 'packaging', 'wrapper', 'bottle', 'Amber')):
        return 'Products'
    if any(k in t for k in ('sakura-shelf', 'front-frame', 'sakura-building', 'backbar', 'refrigerated', 'counter',
                            'fittings', 'light')):
        return 'Joinery'
    return 'Prints and props'


CATS = ['Floors', 'Products', 'Joinery', 'Prints and props']
COLOURS = {'Floors': '#c0392b', 'Products': '#d68910', 'Joinery': '#2471a3', 'Prints and props': '#7d3c98'}


def tally(report):
    out = {c: [0, 0.0] for c in CATS}
    for room in ('shop', 'office'):
        seen = set()
        for p in report[room]['surfaces'] + report[room]['floors']:
            key = (p['a'], p['b'], tuple(p['at']), tuple(p['normal']))
            if key in seen:
                continue
            seen.add(key)
            c = category(p)
            out[c][0] += 1
            out[c][1] += p['area']
    return out


TB, TA = tally(BEFORE), tally(AFTER)
for room in ('shop', 'office'):
    check(f'{room}: no two faces within 2 mm of one plane', not AFTER[room]['surfaces'],
          f"{len(AFTER[room]['surfaces'])} pairs (before: {len(BEFORE[room]['surfaces'])})")
    check(f'{room}: no floor layer within 10 mm of another', not AFTER[room]['floors'],
          f"{len(AFTER[room]['floors'])} pairs (before: {len(BEFORE[room]['floors'])})")
fin = {f['name']: f for f in AFTER['shop']['finishes']}
for name in ('sakura-floor', 'Sakura till floor', 'Restroom mosaic floor'):
    check(f'{name} at floor level', name in fin and fin[name]['level'] == 0, json.dumps(fin.get(name)))
check('the sheen is a glaze (writes no depth)', fin.get('Sakura floor sheen', {}).get('drawn') == 'glaze (no depth)')
for name in ('Sakura welcome mat', 'Sakura till sticker'):
    check(f'{name} is a decal', fin.get(name, {}).get('drawn', '').startswith('decal'))

# ---------------------------------------------------------------- plan geometry (room metres -> drawing millimetres)
# Plan: x east, the street at the bottom; drawing y = -z.
def P(x, z):
    return (x * 1000, -z * 1000)


GROUND = dict(
    shop=(S['westX'], S['eastX'], S['partitionZ'], S['floorFront']),
    back=(S['backWestX'], S['backEastX'], S['backZ'], S['partitionZ']),
)
FINISH_STYLE = {
    'sakura-floor': ('#efebe2', 'TERRAZZO', 'Terrazzo ±0 (cut round the insets)'),
    'sakura-floor back room': ('#c9c6bd', 'FLOOR-BACK', 'Back-room screed +1'),
    'Sakura till floor': ('#2f5d4f', 'INSET-TILE', 'Till tiles ±0, flush in the terrazzo'),
    'Restroom mosaic floor': ('#7b8582', 'INSET-MOSAIC', 'Restroom mosaic ±0, flush'),
    'Sakura floor sheen': (None, 'SHEEN', 'Sheen glaze +4, no depth write, cut round the insets'),
    'Sakura welcome mat': ('#2a8fcc', 'DECAL', 'Welcome mat +10, decal'),
    'Sakura till sticker': ('#ffc93c', 'DECAL', 'Till sticker +7, decal'),
    'Sakura floor sticker': ('#f06ba8', 'DECAL', 'Paw stickers +7, glaze'),
}

# ---------------------------------------------------------------- DXF
doc = ezdxf.new('R2010', setup=True)
doc.units = ezdxf.units.MM
msp = doc.modelspace()
for name, colour in [('SHELL', 7), ('FIXTURES', 8), ('TERRAZZO', 9), ('FLOOR-BACK', 8), ('INSET-TILE', 3),
                     ('INSET-MOSAIC', 5), ('SHEEN', 4), ('DECAL', 6), ('TUBES', 2), ('AUDIT-BEFORE', 1), ('TEXT', 7),
                     ('UPPER', 7)]:
    doc.layers.add(name, color=colour)


def rect_dxf(x0, x1, z0, z1, layer, dx=0, dy=0):
    a, b = P(x0, z0), P(x1, z1)
    msp.add_lwpolyline([(a[0] + dx, a[1] + dy), (b[0] + dx, a[1] + dy), (b[0] + dx, b[1] + dy), (a[0] + dx, b[1] + dy)],
                       close=True, dxfattribs={'layer': layer})


def text_dxf(s, x, y, h=120, layer='TEXT'):
    msp.add_text(s, height=h, dxfattribs={'layer': layer}).set_placement((x, y), align=TextEntityAlignment.LEFT)


for k, (x0, x1, z0, z1) in GROUND.items():
    rect_dxf(x0, x1, z0, z1, 'SHELL')
for c in DATA['colliders']:
    rect_dxf(c['x'] - c['w'] / 2, c['x'] + c['w'] / 2, c['z'] - c['d'] / 2, c['z'] + c['d'] / 2, 'FIXTURES')
for f in AFTER['shop']['finishes']:
    style = FINISH_STYLE.get(f['name'])
    if style:
        rect_dxf(f['x'][0], f['x'][1], f['z'][0], f['z'][1], style[1])
for h in DATA['insets']:
    rect_dxf(h['x0'], h['x1'], h['z0'], h['z1'], 'TERRAZZO')
for x, z0, z1 in DATA['tubes']:
    rect_dxf(x - .03, x + .03, z0, z1, 'TUBES')
for p in BEFORE['shop']['surfaces'] + BEFORE['shop']['floors']:
    cx, cy = P(p['at'][0], p['at'][2])
    msp.add_circle((cx, cy), radius=max(40, (p['area'] ** .5) * 300), dxfattribs={'layer': 'AUDIT-BEFORE'})
text_dxf('SAKURA SHOTEN GROUND FLOOR - FLOOR FINISHES AND SURFACE AUDIT (SK-ZF rev A)', S['westX'] * 1000,
         -S['floorFront'] * 1000 - 600, 160)
UPX = 16000  # the upper floor drawn 16 m to the east of the ground floor
for key in ('shell', 'office', 'restRoom', 'hall'):
    r = UP[key]
    rect_dxf(r['minX'], r['maxX'], r['minZ'], r['maxZ'], 'UPPER', dx=UPX)
    text_dxf(key, r['minX'] * 1000 + UPX + 100, -r['maxZ'] * 1000 + 150, 140, 'UPPER')
for st in UP['stores']:
    rect_dxf(st['minX'], st['maxX'], st['minZ'], st['maxZ'], 'UPPER', dx=UPX)
text_dxf('UPPER FLOOR (KEPT): OFFICE, KITCHENETTE, REST ROOM, STORES - OWN FRAME', UPX - 6400, -UP['shell']['maxZ'] * 1000 - 600, 160)
DXF = os.path.join(HERE, f'Sakura-Surfaces-Rev-{REV}.dxf')
doc.saveas(DXF)
auditor = ezdxf.readfile(DXF).audit()
check('DXF reopens with no audit errors', not auditor.has_errors, f'{len(auditor.errors)} errors, {len(auditor.fixes)} fixes')

# ---------------------------------------------------------------- PDF
W, H = landscape(A3)
pdf = canvas.Canvas(os.path.join(HERE, f'Sakura-Surfaces-Rev-{REV}.pdf'), pagesize=landscape(A3))
pdf.setTitle('Sakura surfaces SK-ZF rev A')
INK = HexColor('#26302c')


def frame(number, title):
    pdf.setStrokeColor(INK)
    pdf.setLineWidth(1.2)
    pdf.rect(20, 20, W - 40, H - 40)
    pdf.rect(W - 380, 20, 360, 70)
    pdf.setFont('Helvetica-Bold', 11)
    pdf.drawString(W - 370, 70, f'SK-ZF-00{number}  rev {REV}  {DATE}')
    pdf.setFont('Helvetica', 9)
    pdf.drawString(W - 370, 54, 'Sakura Shoten, Minato - surfaces as built in Johansson World')
    pdf.drawString(W - 370, 40, title)
    pdf.drawString(W - 370, 28, 'Virtual-environment drawing, not a construction approval.')


def plan_transform(ox, oy, scale):
    return lambda x, z: (ox + x * scale, oy - z * scale)


def rect(T, x0, x1, z0, z1, fill=None, stroke=INK, width=.6, dash=None):
    (ax, ay), (bx, by) = T(x0, z0), T(x1, z1)
    pdf.setLineWidth(width)
    pdf.setStrokeColor(stroke)
    pdf.setDash(*(dash or []))
    if fill:
        pdf.setFillColor(HexColor(fill))
    pdf.rect(min(ax, bx), min(ay, by), abs(bx - ax), abs(by - ay), fill=1 if fill else 0, stroke=1 if stroke else 0)
    pdf.setDash()


def ground_plan(T, fixtures=True):
    rect(T, *GROUND['back'], fill='#c9c6bd')
    # The terrazzo first, then what is laid in and on it.
    for f in sorted(AFTER['shop']['finishes'], key=lambda f: (f['name'] != 'sakura-floor', f['level'])):
        style = FINISH_STYLE.get(f['name'])
        if style and style[0] and f['name'] not in ('Sakura floor sticker',):
            rect(T, f['x'][0], f['x'][1], f['z'][0], f['z'][1], fill=style[0], width=.3)
    for h in DATA['insets']:
        rect(T, h['x0'], h['x1'], h['z0'], h['z1'], width=1)
    if fixtures:
        for c in DATA['colliders']:
            rect(T, c['x'] - c['w'] / 2, c['x'] + c['w'] / 2, c['z'] - c['d'] / 2, c['z'] + c['d'] / 2, stroke=HexColor('#8d948f'), width=.4)
    rect(T, *GROUND['shop'], width=1.8)
    rect(T, *GROUND['back'], width=1.8)


# Sheet 1: the floor finishes plan, 1:60 on A3
frame(1, 'Floor finishes, ground floor 1:60; upper floor key plan 1:150')
sc = 1000 / 25.4 * 72 / 60
T = plan_transform(60 - S['westX'] * sc, 120 + S['floorFront'] * sc, sc)
ground_plan(T)
rect(T, S['westX'], S['eastX'], S['partitionZ'], S['floorFront'], stroke=HexColor('#3aa0c8'), dash=[4, 3], width=.8)
pdf.setFillColor(INK)
pdf.setFont('Helvetica-Bold', 13)
pdf.drawString(40, H - 50, 'SK-ZF-001  Floor finishes - every floor laid flush or at least 10 mm clear of the next')
y = H - 90
pdf.setFont('Helvetica', 9)
for name, (fill, layer, label) in FINISH_STYLE.items():
    f = next((r for r in AFTER['shop']['finishes'] if r['name'] == name), None)
    if not f:
        continue
    if fill:
        pdf.setFillColor(HexColor(fill))
        pdf.rect(W - 380, y - 2, 16, 10, fill=1, stroke=1)
    else:
        pdf.setStrokeColor(HexColor('#3aa0c8'))
        pdf.setDash(4, 3)
        pdf.rect(W - 380, y - 2, 16, 10, fill=0)
        pdf.setDash()
    pdf.setFillColor(INK)
    pdf.drawString(W - 355, y, f"{label}   [{f['drawn']}]")
    y -= 16
y -= 10
for line in ['Rules for what lies on the floor (SK-ZF-002):',
             '- an inset (till tiles, restroom mosaic) is laid in the floor: the terrazzo and its',
             '  sheen are cut round it, the two meet edge to edge at the same level;',
             '- a covering on the floor is a decal (polygon offset) at least 7 mm up,',
             '  or a glaze that writes no depth (the sheen, the paw stickers);',
             '- nothing solid lies within 10 mm of another floor over more than 0.01 m2.',
             'Was: the till tiles laid 6 mm over the terrazzo, over 11 m2 (SK-ZF-003);',
             'the restroom mosaic a decal 3 mm over it; the mat and rug inside the sheen.']:
    pdf.drawString(W - 380, y, line)
    y -= 13
# The upper floor, kept (the owner, 24 October 2026), in its own frame, 1:150
su = sc * 60 / 150
TU = plan_transform(W - 380 - UP['shell']['minX'] * su, 130 + UP['shell']['maxZ'] * su, su)
for key, fill in (('shell', '#f3ead6'), ('hall', '#e9e2cf'), ('office', '#efe6cf'), ('restRoom', '#d9cf98')):
    r = UP[key]
    rect(TU, r['minX'], r['maxX'], r['minZ'], r['maxZ'], fill=fill, width=1 if key == 'shell' else .6)
for st in UP['stores']:
    rect(TU, st['minX'], st['maxX'], st['minZ'], st['maxZ'], fill='#ddd6c4', width=.6)
pdf.setFillColor(INK)
pdf.setFont('Helvetica-Bold', 9)
pdf.drawString(W - 380, 118, 'Upper floor (kept): office 5.65 x 4.05 m, rest room 4.5 mats, hall, stores')
for key in ('office', 'restRoom', 'hall'):
    r = UP[key]
    x, yy = TU((r['minX'] + r['maxX']) / 2, (r['minZ'] + r['maxZ']) / 2)
    pdf.drawCentredString(x, yy, {'office': 'Office', 'restRoom': 'Rest room', 'hall': 'Hall'}[key])
pdf.showPage()

# Sheet 2: the rules and the typical joints (sections, 2:1 or 1:2)
frame(2, 'Surface rules and typical joints, as rebuilt')
pdf.setFillColor(INK)
pdf.setFont('Helvetica-Bold', 13)
pdf.drawString(40, H - 50, 'SK-ZF-002  Every course starts where the last ends; a print is a decal on what it is printed on')
pdf.setFont('Helvetica', 10)
rules = [
    '1. Two faces that look the same way never lie within 2 mm of one plane where they overlap (tests/sakura-surfaces.test.mjs).',
    '2. Joinery is built in courses that butt: a board ends at the panel it meets, a rail stands at least 3 mm proud of the board',
    '   edge it fronts, a post 5 mm proud of the panel behind it. No box runs through another with its faces in the other\'s plane.',
    '3. Printed paper, labels, screens and stickers are decals: drawn with polygon offset (factor -1, units -4) on what they are',
    '   printed on. Two decals with the same offset never share a plane (the scanner compares them too: offsetPairs).',
    '4. Floors: an inset is cut into the floor it sits in; a covering is a decal or a glaze; solid layers keep 10 mm apart.',
    '5. Packs on the shelves are built the same way: a can\'s body runs between its beads, a lid sits inside its rim flange,',
    '   a crust is a ring round its crumb, clear film has no underside on the shelf.',
    '6. Nothing passes through a wall: each ceiling tube ends within its run (two hung through the partition and the office wall).',
]
y = H - 80
for r in rules:
    pdf.drawString(40, y, r)
    y -= 15


def detail(x, y, title, parts, scale, note, box=(210, 120)):
    """A small section in a 210 x 120 pt box: parts are (x0, x1, y0, y1, fill, label) in millimetres, drawn to fit (the
    nominal scale in the title is the drawing's); each part's label is listed under the drawing with its swatch."""
    x0s, x1s = min(p[0] for p in parts), max(p[1] for p in parts)
    y0s, y1s = min(p[2] for p in parts), max(p[3] for p in parts)
    k = min(box[0] / (x1s - x0s), box[1] / (y1s - y0s))
    pdf.setFont('Helvetica-Bold', 10)
    pdf.setFillColor(INK)
    pdf.drawString(x, y + box[1] + 14, title)
    for px0, px1, py0, py1, fill, label in parts:
        pdf.setFillColor(HexColor(fill))
        pdf.setStrokeColor(INK)
        pdf.setLineWidth(.6)
        pdf.rect(x + (px0 - x0s) * k, y + (py0 - y0s) * k, (px1 - px0) * k, (py1 - py0) * k, fill=1)
    ly = y - 12
    pdf.setFont('Helvetica', 7.5)
    for px0, px1, py0, py1, fill, label in parts:
        pdf.setFillColor(HexColor(fill))
        pdf.rect(x, ly - 1, 8, 7, fill=1)
        pdf.setFillColor(INK)
        pdf.drawString(x + 12, ly, label)
        ly -= 10
    y = ly + 12 - 10
    pdf.setFont('Helvetica', 8)
    pdf.setFillColor(INK)
    for i, line in enumerate(note):
        pdf.drawString(x, y - 14 - i * 11, line)


COLW = (W - 80) / 5


row = H - 380
# Can, 1:1 (half section, radius 33 mm, height 135 mm) - shop-product.js 'can'
detail(40, row, 'A  Can (beer, coffee, tuna, peaches)  1:1', [
    (0, 33, 6, 133, '#e9d9b0', 'body 6..133'), (0, 34.5, 0, 6, '#a8b3ad', 'base bead 0..6'), (0, 34.5, 133, 137, '#cad0c8', 'lid bead 133..137')],
    .9, ['Was: body 0..135 with both beads round it,', '1.5 mm off its faces. Now the body runs between them.'])
# Noodle cup lid, 4:1 (r 67..70, y 124..134) - sakura-food-products.js 'noodles'
detail(40 + COLW, row, 'B  Ramen cup lid  4:1', [
    (0, 40, 0, 8, '#f3d8a8', 'cup to 128'), (0, 37.5, 12, 14, '#f2dfb5', 'foil, flush with flange at 131'),
    (37.5, 42, 8, 14, '#c0392b', 'rim flange 128..131'), (20, 26, 14, 26, '#3a2414', 'tab, 3 mm up')],
    2.2, ['Was: foil 0.25 mm under the rim top, overlapping it.', 'Now the foil sits inside the flange ring.'])
# Gondola board and price rail, 2:1 - sakura-shell.js buildIsland
detail(40 + 2 * COLW, row, 'C  Gondola board and price rail  2:1', [
    (0, 60, 28, 50, '#b08a5e', 'board, level-22..level'), (-3, 15, 0, 62, '#f5ecd6', 'price rail, 3 mm proud')],
    2, ['Was: rail flush with the board\'s edge.', 'Now 3 mm proud, the edge inside it.'])
# Wainscot courses, 1:5 - sakura-shell.js wallX/wallZ
detail(40 + 3 * COLW, row, 'D  Wainscot  1:5', [
    (0, 25, 0, 80, '#6e4c30', 'skirting 0..80'), (0, 18, 80, 880, '#9c7148', 'wood 80..880'),
    (0, 30, 880, 940, '#6e4c30', 'rail 880..940'), (-80, 0, 0, 1000, '#f3ead6', 'plaster')],
    .14, ['Was: wood to 900, under the rail from 880.', 'Now each course starts where the last ends.'])
# Front frame, plan 1:5 - sakura-shell.js buildFrontFrame
detail(40 + 4 * COLW, row, 'E  Shopfront posts, plan  1:5', [
    (0, 300, 0, 100, '#6e4c30', 'kick panel F-40..F+60'), (100, 200, -5, 105, '#7f5a38', 'post, 5 mm proud both faces')],
    .35, ['Was: posts and panels in one plane.', 'Now posts stand 5 mm proud; door posts 5 mm', 'proud of the transom.'])
row2 = 130
detail(40, row2, 'F  Till tiles in the terrazzo, section  1:2', [
    (0, 120, 0, 6, '#efebe2', 'terrazzo ±0'), (120, 260, 0, 6, '#2f5d4f', 'till tiles ±0, the terrazzo cut round them'),
    (0, 120, 6, 8, '#bfe3f0', 'sheen glaze +4 (cut round the tiles)')],
    1, ['Was: tiles laid 6 mm over the terrazzo and its sheen.'])
detail(40 + 2 * COLW, row2, 'G  Cooler carcass, plan  1:10', [
    (0, 539, 0, 6.5, '#e4eee6', 'back panel'), (0, 5, 6.5, 75, '#e4eee6', 'side, in front of the back'),
    (5, 534, 6.5, 75, '#263b36', 'plinth / head between the sides')],
    .4, ['Was: plinth, head and sides overlapping the back,', 'their ends in its plane.'])
pdf.showPage()

# Sheet 3: the audit, before and after
frame(3, 'Surface audit: main a098bbe5 against revision A')
pdf.setFillColor(INK)
pdf.setFont('Helvetica-Bold', 13)
pdf.drawString(40, H - 50, 'SK-ZF-003  Faces in one plane, before (circles, sized by area) and after (none)')
sc3 = sc * .82
T3 = plan_transform(60 - S['westX'] * sc3, 90 + S['floorFront'] * sc3, sc3)
ground_plan(T3)
for p in BEFORE['shop']['surfaces'] + BEFORE['shop']['floors']:
    x, yy = T3(p['at'][0], p['at'][2])
    pdf.setStrokeColor(HexColor(COLOURS[category(p)]))
    pdf.setLineWidth(.8)
    pdf.circle(x, yy, max(2.5, (p['area'] ** .5) * 14), fill=0)
x0, y = W - 400, H - 100
pdf.setFont('Helvetica-Bold', 10)
pdf.setFillColor(INK)
pdf.drawString(x0, y, 'Both storeys')
pdf.drawString(x0 + 150, y, 'before: pairs / m2')
pdf.drawString(x0 + 280, y, 'after')
y -= 16
pdf.setFont('Helvetica', 10)
for c in CATS:
    pdf.setFillColor(HexColor(COLOURS[c]))
    pdf.circle(x0 + 4, y + 3, 4, fill=1)
    pdf.setFillColor(INK)
    pdf.drawString(x0 + 14, y, c)
    pdf.drawString(x0 + 150, y, f'{TB[c][0]} / {TB[c][1]:.2f}')
    pdf.drawString(x0 + 280, y, f'{TA[c][0]} / {TA[c][1]:.2f}')
    y -= 15
pdf.setFont('Helvetica-Bold', 10)
pdf.drawString(x0 + 14, y, 'Total')
pdf.drawString(x0 + 150, y, f"{sum(v[0] for v in TB.values())} / {sum(v[1] for v in TB.values()):.2f}")
pdf.drawString(x0 + 280, y, f"{sum(v[0] for v in TA.values())} / {sum(v[1] for v in TA.values()):.2f}")
y -= 30
pdf.setFont('Helvetica', 9)
for line in ['Scanner: tools/z-fighting.mjs, 2 mm and 4 cm2 (floors: 10 mm and 0.01 m2),',
             'decals compared with each other, faces hidden inside a closed solid left out.',
             'Before: tools/sakura-surface-audit.mjs on main a098bbe5 (audit-before.json).',
             'After: the same tool on this revision (audit.json).', '', 'Checks:']:
    pdf.drawString(x0, y, line)
    y -= 13
for c in CHECKS:
    pdf.setFillColor(HexColor('#1e8449') if c['ok'] else HexColor('#c0392b'))
    pdf.drawString(x0, y, ('pass  ' if c['ok'] else 'FAIL  ') + c['check'])
    y -= 12
pdf.showPage()
pdf.save()

json.dump(CHECKS, open(os.path.join(HERE, 'checks.json'), 'w'), indent=1)
print(f"{sum(c['ok'] for c in CHECKS)}/{len(CHECKS)} checks pass")
for c in CHECKS:
    if not c['ok']:
        print('FAIL', c['check'], c['detail'])
