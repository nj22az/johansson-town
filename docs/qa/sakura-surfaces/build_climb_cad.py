"""Sakura's stair climb, drawing SK-ST-001 revision B (27 October 2026; rev A cut between two cameras at the landing). The owner: "The black part should not be shown
it should be like a loading screen when you up the stairs the loading starts for the top Floor" and "No the loading
screen is walking up the stairs". The whole stairwell drawn from its data (SAKURA_STAIRWELL, SAKURA_STAIR_CLIMB in
src/world/interiors/sakura-stairs.js): plan, section looking north, the walk and where each storey's camera stands.
Writes beside this file: Sakura-Stair-Climb-Rev-B.pdf (one A3 sheet), Sakura-Stair-Climb-Rev-B.dxf (1:1 mm), checks-climb.json.

    python3 docs/qa/sakura-surfaces/build_climb_cad.py     (from johansson-town/; needs node, reportlab, ezdxf)
"""
import json
import math
import os
import subprocess

import ezdxf
from ezdxf.enums import TextEntityAlignment
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
D = json.loads(subprocess.run(['node', '--input-type=module', '-e',
    "import {installDOM} from './tests/fixtures.mjs';installDOM();const m=await import('./src/world/interiors/sakura-stairs.js');"
    "const s=await import('./src/world/interiors/sakura-shell.js');"
    "console.log(JSON.stringify({w:m.SAKURA_STAIRWELL,c:m.SAKURA_STAIR_CLIMB,h:m.SAKURA_STAIR.height,ceil:s.SAKURA_SHELL.ceiling}))"],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout)
W_, C, H, CEIL = D['w'], D['c'], D['h'], D['ceil']
R, T = W_['rise'], W_['going']
CHECKS = []


def check(name, ok, detail=''):
    CHECKS.append(dict(check=name, ok=bool(ok), detail=detail))


# The arithmetic: 24 rises to the office floor, the going and rise a comfortable pair (2R + G within 550..700 mm).
check('24 rises reach the office floor', abs(24 * R - H) < 1e-6, f'{24 * R:.3f} m')
check('2 rises + going within 550..700 mm', 550 <= (2 * R + T) * 1000 <= 700, f'{(2 * R + T) * 1000:.0f} mm')
check('the landing is the twelfth rise', abs(W_['landing']['y'] - 12 * R) < 1e-6)
# The walk: continuous from one half to the other, and each point on a tread, a landing or a floor.
for d in ('up', 'down'):
    check(f'{d}: round the turning landing', any(abs(p[1] - W_['landing']['y']) < 1e-9 for p in C[d]))
# The cameras inside the stairwell, under its ceiling, and below what their storey does not draw.
cs, co = C['camera']['shop']['at'], C['camera']['office']['at']
wl = W_['walls']
inside = lambda p: wl['west'] < p[0] < wl['east'] and wl['south'] < p[2] < wl['north'] and p[1] < wl['ceiling']
check('shop camera locked below, at the stair foot ("Camera should lock from below")', -1.8 < cs[0] < wl['east'] and wl['south'] < cs[2] < wl['north'] and cs[1] < W_['landing']['y'], str(cs))
check('office camera inside the stairwell, over the top landing', inside(co) and co[1] > H and
      W_['top']['x0'] <= co[0] <= W_['top']['x1'] and W_['top']['z0'] <= co[2] <= W_['top']['z1'], str(co))

# ---------------------------------------------------------------- DXF
doc = ezdxf.new('R2010', setup=True)
doc.units = ezdxf.units.MM
msp = doc.modelspace()
for n, c in [('WALLS', 7), ('TREADS', 3), ('LANDINGS', 2), ('WALK', 1), ('CAMERA', 5), ('TEXT', 7)]:
    doc.layers.add(n, color=c)
mm = lambda v: v * 1000


def rect(x0, x1, a0, a1, layer, flip=True, dy=0):
    f = (lambda a: -a) if flip else (lambda a: a)
    msp.add_lwpolyline([(mm(x0), mm(f(a0)) + dy), (mm(x1), mm(f(a0)) + dy), (mm(x1), mm(f(a1)) + dy), (mm(x0), mm(f(a1)) + dy)],
                       close=True, dxfattribs={'layer': layer})


lo, la, up, top = W_['lower'], W_['landing'], W_['upper'], W_['top']
treads = [(i, lo['x0'] - i * T, lo['x0'] - (i - 1) * T, lo['z0'], lo['z1'], i * R) for i in range(1, 12)]
treads += [(24 - i, up['x1'] - i * T, up['x1'] - (i - 1) * T, up['z0'], up['z1'], (24 - i) * R) for i in range(1, 12)]
for k, x0, x1, z0, z1, y in treads:
    rect(x0, x1, z0, z1, 'TREADS')
rect(la['x0'], la['x1'], la['z0'], la['z1'], 'LANDINGS')
rect(top['x0'], top['x1'], top['z0'], top['z1'], 'LANDINGS')
rect(wl['west'] - wl['thick'], wl['east'], wl['south'] - wl['thick'], wl['north'] + .04, 'WALLS')
for d in ('up', 'down'):
    pts = C[d]
    msp.add_lwpolyline([(mm(p[0]), mm(-p[2])) for p in pts], dxfattribs={'layer': 'WALK'})
for p in (cs, co):
    msp.add_circle((mm(p[0]), mm(-p[2])), 60, dxfattribs={'layer': 'CAMERA'})
DY = -6000  # the section, looking north, below the plan
for k, x0, x1, z0, z1, y in treads:
    rect(x0, x1, y - .04, y, 'TREADS', flip=False, dy=DY)
for a0, a1, y0, y1 in [(la['x0'], la['x1'], la['y'] - .15, la['y']), (top['x0'], top['x1'], H - .12, H), (wl['west'], wl['east'], -.12, 0)]:
    rect(a0, a1, y0, y1, 'LANDINGS', flip=False, dy=DY)
msp.add_lwpolyline([(mm(p[0]), mm(p[1] + 1.0) + DY) for p in C['up']], dxfattribs={'layer': 'WALK'})
for p in (cs, co):
    msp.add_circle((mm(p[0]), mm(p[1]) + DY), 60, dxfattribs={'layer': 'CAMERA'})
msp.add_text('SAKURA STAIR CLIMB SK-ST-001 rev A', height=150, dxfattribs={'layer': 'TEXT'}).set_placement((-5650, 3600), align=TextEntityAlignment.LEFT)
DXF = os.path.join(HERE, 'Sakura-Stair-Climb-Rev-B.dxf')
doc.saveas(DXF)
check('DXF reopens with no audit errors', not ezdxf.readfile(DXF).audit().has_errors)

# ---------------------------------------------------------------- PDF
PW, PH = landscape(A3)
pdf = canvas.Canvas(os.path.join(HERE, 'Sakura-Stair-Climb-Rev-B.pdf'), pagesize=landscape(A3))
pdf.setTitle('Sakura stair climb SK-ST-001 rev A')
INK = HexColor('#26302c')
pdf.setStrokeColor(INK)
pdf.setLineWidth(1.2)
pdf.rect(20, 20, PW - 40, PH - 40)
pdf.rect(PW - 380, 20, 360, 70)
pdf.setFillColor(INK)
pdf.setFont('Helvetica-Bold', 11)
pdf.drawString(PW - 370, 70, 'SK-ST-001  rev B  27 October 2026')
pdf.setFont('Helvetica', 9)
pdf.drawString(PW - 370, 54, 'Sakura Shoten, Minato - the stair climb between the storeys')
pdf.drawString(PW - 370, 40, 'Plan and section looking north, 1:40')
pdf.drawString(PW - 370, 28, 'Virtual-environment drawing, not a construction approval.')
pdf.setFont('Helvetica-Bold', 13)
pdf.drawString(40, PH - 50, 'SK-ST-001  The climb is the loading screen: a locked camera, the flight walked, no black')
s = 1000 * 72 / 25.4 / 40


def box(tf, x0, x1, a0, a1, fill=None, w=.6):
    (p, q), (r, t) = tf(x0, a0), tf(x1, a1)
    pdf.setLineWidth(w)
    pdf.setStrokeColor(INK)
    if fill:
        pdf.setFillColor(HexColor(fill))
    pdf.rect(min(p, r), min(q, t), abs(r - p), abs(t - q), fill=1 if fill else 0, stroke=1)


def path(tf, pts, colour, dash=None):
    pdf.setStrokeColor(HexColor(colour))
    pdf.setLineWidth(1.6)
    pdf.setDash(*(dash or []))
    p = pdf.beginPath()
    p.moveTo(*tf(*pts[0]))
    for q in pts[1:]:
        p.lineTo(*tf(*q))
    pdf.drawPath(p)
    pdf.setDash()


def camera(tf, at, look, label):
    x, y = tf(*at)
    pdf.setFillColor(HexColor('#2471a3'))
    pdf.circle(x, y, 4, fill=1)
    lx, ly = tf(*look)
    a = math.atan2(ly - y, lx - x)
    for d in (-.55, .55):
        pdf.setStrokeColor(HexColor('#2471a3'))
        pdf.line(x, y, x + 60 * math.cos(a + d), y + 60 * math.sin(a + d))
    pdf.setFillColor(INK)
    pdf.setFont('Helvetica', 8)
    pdf.drawString(x + 6, y + 6, label)


# Plan (z up the page = north), the shop's frame
TP = lambda x, z: (90 + (x - wl['west'] + .2) * s, PH - 360 + (z - wl['south'] + .2) * s)
box(TP, wl['west'] - wl['thick'], wl['east'], wl['south'] - wl['thick'], wl['north'] + .04, fill='#f3ead6', w=1.4)
box(TP, wl['west'], wl['east'], wl['south'], wl['north'], fill='#ffffff')
box(TP, la['x0'], la['x1'], la['z0'], la['z1'], fill='#b08a5e')
box(TP, top['x0'], top['x1'], top['z0'], top['z1'], fill='#947354')
for k, x0, x1, z0, z1, y in treads:
    box(TP, x0, x1, z0, z1, fill='#c9a77c')
    cx, cz = TP((x0 + x1) / 2, (z0 + z1) / 2)
    pdf.setFillColor(INK)
    pdf.setFont('Helvetica', 6)
    pdf.drawCentredString(cx, cz - 2, str(k))
path(TP, [(p[0], p[2]) for p in C['up']], '#c0392b')
camera(TP, (cs[0], cs[2]), (-4.0, -5.4), 'shop camera (locked)')
camera(TP, (co[0], co[2]), (-4.9, -6.15), 'office camera')
pdf.setFillColor(INK)
pdf.setFont('Helvetica', 8)
for label, x, z in (('stockroom (east)', -1.0, -4.4), ('turning landing +2005', -5.4, -6.55), ('top landing +4010', -1.75, -6.62),
                    ('hall (upstairs) beyond', -1.7, -5.95), ('lower flight, 11 treads', -3.6, -4.25), ('upper flight, 11 treads', -3.6, -6.9)):
    pdf.drawString(*TP(x, z), label)
pdf.drawString(90, PH - 380, 'Plan 1:40 (the shop\'s frame). Numbers: rises above the shop floor. Red: the walk up.')
# Section looking north: x along, y up
TS = lambda x, y: (90 + (x - wl['west'] + .2) * s, 120 + y * s * .62)
box(TS, wl['west'], wl['east'], -.12, 0, fill='#efebe2')
box(TS, wl['east'], wl['east'] + 1.2, CEIL, CEIL + .04, fill='#f3ead6')
box(TS, top['x0'], top['x1'] + 1.2, H - .12, H, fill='#947354')
box(TS, la['x0'], la['x1'], la['y'] - .15, la['y'], fill='#b08a5e')
box(TS, wl['west'], wl['east'], wl['ceiling'], wl['ceiling'] + .12, fill='#f1eadb')
for k, x0, x1, z0, z1, y in treads:
    box(TS, x0, x1, y - .04, y, fill='#c9a77c' if k < 12 else '#a8875f')
path(TS, [(p[0], p[1] + 1.0) for p in C['up']], '#c0392b')
camera(TS, (cs[0], cs[1]), (-3.5, 3.0), 'shop camera (locked, below)')
camera(TS, (co[0], co[1]), (-4.9, 3.0), 'office camera')
pdf.setFillColor(INK)
pdf.setFont('Helvetica', 8)
for label, x, y in (('shop floor ±0', -.3, .05), ('shop ceiling +2980', -.3, CEIL + .1), ('office floor +4010', .2, H + .05),
                    ('stairwell ceiling +6810', -2.0, wl['ceiling'] + .2), ('the cut, on the landing', -5.6, W_['landing']['y'] + 1.9)):
    pdf.drawString(*TS(x, y), label)
pdf.drawString(90, 100, 'Section looking north 1:40 (heights at 0.62 for the sheet). The walk drawn at chest height, 1 m over the treads.')
# Notes and checks
y = PH - 100
pdf.setFont('Helvetica', 9)
for line in ['How it plays (game.js takeSakuraStair):',
             '1. He steps onto the first tread (or Go upstairs): no black, no fade.',
             '2. One camera, locked low in the corner at the stair\'s foot ("Camera should lock from',
             '   below we just see him go up"), aimed up the lower flight, turning only a little.',
             '   He walks up the lower flight away from it and turns on the landing.',
             '3. The office storey loads while he climbs. As he turns out of sight (the walls between',
             '   the flights hide the upper one from any camera below) the picture cuts (0.18 s) and he',
             '   is at the stair head upstairs. If it is not ready he waits on the landing, in view.',
             '4. Coming down: a camera locked high over the top landing watches him go down the upper',
             '   flight to the landing; the cut; he is at the stair\'s foot in the stockroom.',
             '',
             'Built (sakura-stairs.js, buildSakuraStairwell), the same in both storeys:',
             '- 11 + 11 treads on closed carriages to the floor (no open space under a flight);',
             '- the turning landing on a closed block; the top landing on the office floor;',
             '- the well walls carried full height: west, south, north; the stairwell ceiling;',
             '- what each storey cannot otherwise show is closed: in the shop, the hall\'s floor',
             '  and walls over the stockroom; in the office, the stockroom floor at the foot.',
             '- The black volumes stay as colliders only (nobody walks the flights).',
             '', 'Checks:']:
    pdf.setFillColor(INK)
    pdf.drawString(PW - 420, y, line)
    y -= 13
for c in CHECKS:
    pdf.setFillColor(HexColor('#1e8449') if c['ok'] else HexColor('#c0392b'))
    pdf.drawString(PW - 420, y, ('pass  ' if c['ok'] else 'FAIL  ') + c['check'])
    y -= 12
pdf.showPage()
pdf.save()
json.dump(CHECKS, open(os.path.join(HERE, 'checks-climb.json'), 'w'), indent=1)
print(f"{sum(c['ok'] for c in CHECKS)}/{len(CHECKS)} checks pass")
for c in CHECKS:
    if not c['ok']:
        print('FAIL', c['check'], c['detail'])
