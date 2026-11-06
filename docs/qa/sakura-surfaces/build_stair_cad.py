"""Sakura's stockroom and staircase, drawings SK-ZF-004..005 revision A (27 October 2026), to the stricter surface rules
of tools/sakura-surface-audit.mjs (STRICT_RULES): no two faces within 2 mm of one plane over 0.1 cm², even where they
look alike; nothing within 10 mm of another face over 0.05 m² unless it is a decal or clear glazing. Drawn from the
game's own data, with the findings on main (audit-stair-before.json) and the corrections made. Writes, beside this file:

    Sakura-Stockroom-Stair-Rev-A.pdf   SK-ZF-004 stockroom plan 1:30 and its joints; SK-ZF-005 the stair, section and plans
    Sakura-Stockroom-Stair-Rev-A.dxf   1:1 mm, R2010: stockroom plan, stair section, stair-head plan, findings
    checks-stair.json                  the checks below

    python3 docs/qa/sakura-surfaces/build_stair_cad.py     (from johansson-town/; needs node, reportlab, ezdxf)
"""
import json
import os
import subprocess

import ezdxf
from ezdxf.enums import TextEntityAlignment
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
REV, DATE = 'A', '27 October 2026'


def node(js):
    return json.loads(subprocess.run(['node', '--input-type=module', '-e', js], cwd=ROOT, capture_output=True, text=True,
                                     check=True).stdout)


D = node("import {installDOM} from './tests/fixtures.mjs';installDOM();"
         "const b=await import('./src/world/interiors/sakura-backroom.js');const s=await import('./src/world/interiors/sakura-shell.js');"
         "const t=await import('./src/world/interiors/sakura-stairs.js');const o=await import('./src/world/interiors/sakura-office-room.js');"
         "console.log(JSON.stringify({back:b.BACKROOM,shell:s.SAKURA_SHELL,stair:t.SAKURA_STAIR,passage:t.SAKURA_STAIR_PASSAGE,"
         "north:t.STAIR_NORTH,up:o.SAKURA_UPSTAIRS}))")
subprocess.run(['node', 'tools/sakura-surface-audit.mjs', os.path.join(HERE, 'audit.json')], cwd=ROOT, check=True,
               capture_output=True)
AFTER = json.load(open(os.path.join(HERE, 'audit.json')))['zones']
BEFORE = json.load(open(os.path.join(HERE, 'audit-stair-before.json')))['zones']
S, B, ST, PA = D['shell'], D['back'], D['stair'], D['passage']
TREAD, RISE = 2.7 / 12, ST['height'] / 24
CHECKS = []


def check(name, ok, detail=''):
    CHECKS.append(dict(check=name, ok=bool(ok), detail=detail))


for zone in BEFORE:
    a = AFTER[zone]
    check(f'{zone}: no two faces within 2 mm of one plane (0.1 cm2, alike or not)', not a['close'],
          f"{len(a['close'])} (before {len(BEFORE[zone]['close'])})")
    check(f'{zone}: nothing within 10 mm of another face over 0.05 m2', not a['wide'],
          f"{len(a['wide'])} (before {len(BEFORE[zone]['wide'])})")

# The findings on main and what was done about each (the corrections in the source, by part).
CORRECTIONS = [
    ('Beer crates', 'long walls ran past the end walls, rims overhung into the next crate, end walls rose into the rims',
     'long walls between the end walls; rims exactly one crate wide; end walls stop under the rims'),
    ('Beer crate label', 'paper 2.5 mm off the crate wall, 0.27 m2', 'a decal (polygon offset) on the wall'),
    ('Exit sign', 'face 2 mm off its housing, 0.14 m2', 'a decal on the housing'),
    ('Shrink film on the trays', 'film 2.5-5 mm over the tray, writing depth', 'clear film: glazing that writes no depth'),
    ('Stockroom door frame', 'jambs ran up into the head', 'jambs stop under the head'),
    ('Step ladder', 'steps flush with the rails\' outer faces', 'steps between the rails'),
    ('Parcel twine', 'the two cross loops in one plane', 'the cross loop 3 mm wider'),
    ('Daisha handle', 'bar and uprights\' facets in one plane', 'bar turned half a facet'),
    ('Stairwell walls (stair head)', 'end walls and ceiling ran into the back wall, 0.45 m2 at 0 mm',
     'end walls and ceiling start at the back wall\'s face'),
    ('Futon cupboard (upper stores)', 'frame members overlapping; shelf 3 mm off its battens, 0.08 m2',
     'frame members butt; shelf on the battens'),
    ('Store walls (upper)', 'the long wall ran into its end wall, their faces in one plane', 'the long wall starts at the end wall\'s face'),
    ('Cans on the stock trays', 'base bead closed above, a face inside the can 6 mm over the tray', 'base bead open above, the bottom a disc'),
]

# ---------------------------------------------------------------- DXF
doc = ezdxf.new('R2010', setup=True)
doc.units = ezdxf.units.MM
msp = doc.modelspace()
for name, colour in [('WALLS', 7), ('FIXTURES', 8), ('STAIR', 3), ('DARK', 250), ('FINDINGS', 1), ('TEXT', 7)]:
    doc.layers.add(name, color=colour)


def poly(pts, layer):
    msp.add_lwpolyline(pts, close=True, dxfattribs={'layer': layer})


def rect_plan(x0, x1, z0, z1, layer, dy=0):
    poly([(x0 * 1000, -z0 * 1000 + dy), (x1 * 1000, -z0 * 1000 + dy), (x1 * 1000, -z1 * 1000 + dy), (x0 * 1000, -z1 * 1000 + dy)], layer)


def rect_sec(x0, x1, y0, y1, layer, dy):
    poly([(x0 * 1000, y0 * 1000 + dy), (x1 * 1000, y0 * 1000 + dy), (x1 * 1000, y1 * 1000 + dy), (x0 * 1000, y1 * 1000 + dy)], layer)


def text(s, x, y, h=120):
    msp.add_text(s, height=h, dxfattribs={'layer': 'TEXT'}).set_placement((x, y), align=TextEntityAlignment.LEFT)


# Stockroom plan (shop frame: x east, the street towards drawing -y)
STOCK = dict(x0=S['backWestX'], x1=S['backEastX'], z0=S['backZ'], z1=S['partitionZ'])
rect_plan(STOCK['x0'], STOCK['x1'], STOCK['z0'], STOCK['z1'], 'WALLS')
R = B['rack']
for a, b in R['units']:
    rect_plan(a, b, R['front'], R['back'], 'FIXTURES')
C = B['crates']
rect_plan(C['x'] - C['w'] / 2, C['x'] + C['w'] / 2, C['z'] - C['d'] / 2, C['z'] + C['d'] / 2, 'FIXTURES')
for k in ('daisha', 'bundle'):
    q = B[k]
    rect_plan(q['x'] - q['w'] / 2, q['x'] + q['w'] / 2, q['z'] - q['d'] / 2, q['z'] + q['d'] / 2, 'FIXTURES')
L = PA['foot']
for i in range(L['treads']):
    rect_plan(-1.8 - (i + 1) * TREAD, -1.8 - i * TREAD, -5.15, -4.05, 'STAIR')
for x0, x1, z0, z1, y0, y1 in L['dark']:
    rect_plan(x0, x1, z0, z1, 'DARK')
for p in [p for z in BEFORE.values() for p in z['close'] + z['wide']]:
    if p['at']:
        msp.add_circle((p['at'][0] * 1000, -p['at'][2] * 1000), radius=max(40, (p['area'] ** .5) * 400), dxfattribs={'layer': 'FINDINGS'})
text('SAKURA STOCKROOM PLAN (SK-ZF-004 rev A)', STOCK['x0'] * 1000, -STOCK['z1'] * 1000 + 400)
# Stair section, looking north, drawn 5 m below the plan
DY = -14000
rect_sec(-5.76, 5.76, -.12, 0, 'WALLS', DY)
rect_sec(-5.76, -.6, ST['height'] - .12, ST['height'], 'WALLS', DY)
for i in range(L['treads']):
    rect_sec(-1.8 - (i + 1) * TREAD, -1.8 - i * TREAD, (i + 1) * RISE - .1, (i + 1) * RISE, 'STAIR', DY)
H = PA['head']
for i in range(H['treads']):
    y = ST['height'] - (i + 1) * RISE
    rect_sec(H['flight']['x0'] - (i + 1) * TREAD, H['flight']['x0'] - i * TREAD, y - .1, y, 'STAIR', DY)
for x0, x1, z0, z1, y0, y1 in L['dark']:
    rect_sec(x0, x1, y0, min(y1, ST['height'] + 2.8), 'DARK', DY)
text('SAKURA STAIR, SECTION LOOKING NORTH (SK-ZF-005 rev A)', -5760, DY + 7300)
DXF = os.path.join(HERE, f'Sakura-Stockroom-Stair-Rev-{REV}.dxf')
doc.saveas(DXF)
aud = ezdxf.readfile(DXF).audit()
check('DXF reopens with no audit errors', not aud.has_errors, f'{len(aud.errors)} errors')

# ---------------------------------------------------------------- PDF
W, Hp = landscape(A3)
pdf = canvas.Canvas(os.path.join(HERE, f'Sakura-Stockroom-Stair-Rev-{REV}.pdf'), pagesize=landscape(A3))
pdf.setTitle('Sakura stockroom and stair SK-ZF-004..005 rev A')
INK = HexColor('#26302c')
MM = 72 / 25.4


def frame(n, title):
    pdf.setStrokeColor(INK)
    pdf.setLineWidth(1.2)
    pdf.rect(20, 20, W - 40, Hp - 40)
    pdf.rect(W - 380, 20, 360, 70)
    pdf.setFillColor(INK)
    pdf.setFont('Helvetica-Bold', 11)
    pdf.drawString(W - 370, 70, f'SK-ZF-00{n}  rev {REV}  {DATE}')
    pdf.setFont('Helvetica', 9)
    pdf.drawString(W - 370, 54, 'Sakura Shoten, Minato - stockroom and staircase surfaces')
    pdf.drawString(W - 370, 40, title)
    pdf.drawString(W - 370, 28, 'Virtual-environment drawing, not a construction approval.')


def box(T, x0, x1, a0, a1, fill=None, stroke=INK, width=.6):
    (p, q), (r, s) = T(x0, a0), T(x1, a1)
    pdf.setLineWidth(width)
    if stroke:
        pdf.setStrokeColor(stroke)
    if fill:
        pdf.setFillColor(HexColor(fill))
    pdf.rect(min(p, r), min(q, s), abs(r - p), abs(s - q), fill=1 if fill else 0, stroke=1 if stroke else 0)


def findings_table(x, y, zones):
    pdf.setFillColor(INK)
    pdf.setFont('Helvetica-Bold', 10)
    pdf.drawString(x, y, 'Zone')
    pdf.drawString(x + 120, y, 'before: close / wide')
    pdf.drawString(x + 250, y, 'after')
    pdf.setFont('Helvetica', 10)
    for z in zones:
        y -= 15
        pdf.drawString(x, y, z)
        pdf.drawString(x + 120, y, f"{len(BEFORE[z]['close'])} / {len(BEFORE[z]['wide'])}")
        pdf.drawString(x + 250, y, f"{len(AFTER[z]['close'])} / {len(AFTER[z]['wide'])}")
    return y


def corrections(x, y, rows, width=95):
    pdf.setFont('Helvetica-Bold', 10)
    pdf.drawString(x, y, 'Found on main, and the correction')
    pdf.setFont('Helvetica', 8.5)
    for part, was, now in rows:
        y -= 14
        pdf.setFont('Helvetica-Bold', 8.5)
        pdf.drawString(x, y, part)
        pdf.setFont('Helvetica', 8.5)
        y -= 11
        pdf.drawString(x + 8, y, 'was: ' + was[:width])
        y -= 11
        pdf.drawString(x + 8, y, 'now: ' + now[:width])
    return y


# Sheet 4: the stockroom, plan 1:30
frame(4, 'Stockroom plan 1:30, findings and corrections')
pdf.setFont('Helvetica-Bold', 13)
pdf.drawString(40, Hp - 50, 'SK-ZF-004  Stockroom: every piece starts where the next ends; every print a decal')
sc = 1000 * MM / 30
T = lambda x, z: (60 + (x - STOCK['x0']) * sc, Hp - 120 - (STOCK['z1'] - z) * sc)
box(T, STOCK['x0'], STOCK['x1'], STOCK['z0'], STOCK['z1'], fill='#c9c6bd', width=1.8)
for a, b in R['units']:
    box(T, a, b, R['front'], R['back'], fill='#b7bcbd')
box(T, C['x'] - C['w'] / 2, C['x'] + C['w'] / 2, C['z'] - C['d'] / 2, C['z'] + C['d'] / 2, fill='#dcb22c')
for k, fill in (('daisha', '#2d5fae'), ('bundle', '#bf9563')):
    q = B[k]
    box(T, q['x'] - q['w'] / 2, q['x'] + q['w'] / 2, q['z'] - q['d'] / 2, q['z'] + q['d'] / 2, fill=fill)
for i in range(L['treads']):
    box(T, -1.8 - (i + 1) * TREAD, -1.8 - i * TREAD, -5.15, -4.05, fill='#8d7458')
for x0, x1, z0, z1, y0, y1 in L['dark']:
    if y0 == 0:
        box(T, x0, x1, z0, z1, fill='#1b1b1b')
box(T, 3.42, 3.78, -5.66, -5.34, fill='#c9ced2')  # the step ladder
box(T, 3.25, 4.39, -4.07, -3.91, fill='#f3ead6')  # the passage to the shop
pdf.setFillColor(INK)
pdf.setFont('Helvetica', 8)
for label, x, z in (('rack', -0.1, -4.5), ('rack', .76, -4.5), ('crates', C['x'], C['z']), ('daisha', B['daisha']['x'], B['daisha']['z']),
                    ('stair foot: 5 treads into the dark', -2.35, -5.4), ('ladder', 3.6, -5.5), ('passage to shop', 3.82, -4.0),
                    ('parcel bundle', B['bundle']['x'], B['bundle']['z']), ('exit sign', B['exitSign']['x'], B['exitSign']['z'] + .1)):
    p, q = T(x, z)
    pdf.drawCentredString(p, q, label)
for p in [p for z in ('stockroom', 'stair foot') for p in BEFORE[z]['close'] + BEFORE[z]['wide']]:
    if p['at']:
        u, v = T(p['at'][0], p['at'][2])
        pdf.setStrokeColor(HexColor('#c0392b'))
        pdf.circle(u, v, max(3, (p['area'] ** .5) * 20), fill=0)
y = findings_table(60, 300, ['stockroom', 'stair foot'])
for col, rows in enumerate((CORRECTIONS[:3], CORRECTIONS[3:6], CORRECTIONS[6:8])):
    corrections(60 + col * 330, y - 20, rows, 70)
y = 430
pdf.setFont('Helvetica', 9)
for line in ['Rules (tools/sakura-surface-audit.mjs STRICT_RULES; tests/sakura-surfaces.test.mjs):',
             '- no two faces within 2 mm of one plane over 0.1 cm2,',
             '  even of one colour: two pieces overlapping are still two faces;',
             '- nothing within 10 mm of another face over 0.05 m2,',
             '  unless it is a decal (polygon offset) or clear glazing (no depth write).',
             'Red circles: what the audit found on main, sized by area.']:
    pdf.drawString(W - 420, y, line)
    y -= 13
pdf.showPage()

# Sheet 5: the stair, section looking north 1:40, and the stair head plan 1:40
frame(5, 'Staircase: section looking north and the stair head, 1:40')
pdf.setFillColor(INK)
pdf.setFont('Helvetica-Bold', 13)
pdf.drawString(40, Hp - 50, 'SK-ZF-005  Staircase: a passage into the dark, both ends built without a shared plane')
s5 = 1000 * MM / 40
TS = lambda x, y: (60 + (x + 5.8) * s5, 160 + y * s5)
for x0, x1, z0, z1, y0, y1 in H['dark']:
    box(TS, x0, x1, y0 + ST['height'], y1 + ST['height'], fill='#3a3a3a', stroke=HexColor('#777777'), width=.4)
for x0, x1, z0, z1, y0, y1 in L['dark']:
    box(TS, x0, x1, y0, min(y1, ST['height'] + 2.8), fill='#1b1b1b', stroke=HexColor('#777777'), width=.4)
box(TS, -5.76, 5.76, -.12, 0, fill='#efebe2')
box(TS, -5.76, -.6, ST['height'] - .12, ST['height'], fill='#947354')
box(TS, -5.65, -.6, ST['height'] + 2.8, ST['height'] + 2.92, fill='#f1eadb')  # the stairwell ceiling
for i in range(L['treads']):
    box(TS, -1.8 - (i + 1) * TREAD, -1.8 - i * TREAD, (i + 1) * RISE - .1, (i + 1) * RISE, fill='#c9a77c', width=.8)
for i in range(H['treads']):
    y = ST['height'] - (i + 1) * RISE
    box(TS, H['flight']['x0'] - (i + 1) * TREAD, H['flight']['x0'] - i * TREAD, y - .1, y, fill='#c9a77c', width=.8)
pdf.setFillColor(INK)
pdf.setFont('Helvetica', 8)
lab = lambda text, y, x=-.3: (pdf.drawString(*TS(x, y), text))
lab('shop floor ±0 (stockroom)', .05)
lab(f'shop end: 5 treads up into the dark, rise {RISE * 1000:.0f}, going {TREAD * 1000:.0f}', 5 * RISE - .05)
lab('office floor +4010 (hall)', ST['height'] + .05)
lab('office end: 4 treads down into the dark', ST['height'] - 4 * RISE)
lab('stairwell ceiling over the stair head', ST['height'] + 2.82)
lab('black: the passage (never walked; the picture fades)', 2.2)
y = findings_table(W - 400, Hp - 100, ['stair foot', 'stair head', 'upper stores'])
y = corrections(W - 400, y - 20, CORRECTIONS[8:], 60)
# The stair head in plan (office frame), 1:60
s6 = 1000 * MM / 60
TP = lambda x, z: (W - 400 + (x + 6.45) * s6, y - 40 - (-3.3 - z) * s6)
UPH = D['up']['hall']
box(TP, UPH['minX'], UPH['maxX'], max(UPH['minZ'], -6.1), -3.3, fill='#e9e2cf')
for x0, x1, z0, z1, y0, y1 in H['dark']:
    box(TP, x0, x1, z0, z1, fill='#3a3a3a')
f = H['flight']
for i in range(H['treads']):
    box(TP, f['x0'] - (i + 1) * TREAD, f['x0'] - i * TREAD, f['z0'], f['z1'], fill='#c9a77c')
box(TP, -1.8, -.6, -6.06, -5.5, fill='#947354')  # the top landing's south end
box(TP, -5.65, -.6, -6.14, -6.06, fill='#f3ead6')  # the stairwell's back wall
for x in (-5.65, -.68):
    box(TP, x, x + .08, -6.06, -5.5, fill='#f3ead6')  # its end walls, between it and the hall
box(TP, -2.08, -2.02, -4.91, -3.41, fill='#8a6a48')  # the rail
pdf.setFillColor(INK)
pdf.setFont('Helvetica', 8)
pdf.drawString(W - 400, y - 30, 'Stair head, plan 1:60 (office frame): end walls between the back wall and the hall')
pdf.showPage()
pdf.save()
json.dump(CHECKS, open(os.path.join(HERE, 'checks-stair.json'), 'w'), indent=1)
print(f"{sum(c['ok'] for c in CHECKS)}/{len(CHECKS)} checks pass")
for c in CHECKS:
    if not c['ok']:
        print('FAIL', c['check'], c['detail'])
