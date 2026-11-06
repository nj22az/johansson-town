"""Sakura's stairwell trim, drawing SK-ST-002 revision B (27 October 2026; rev A had an under-stair cupboard door), after the owner's review of the climb frames
(the walls were blank planes, the step ends showed as a sawtooth, the under-stair cupboard door read as a loose board).
Drawn from the data in src/world/interiors/sakura-stairs.js (SAKURA_STAIRWELL, SAKURA_STAIR_TRIM): the plan and the
section looking north with the strings, the handrail and its brackets, the skirting, the nosing and the fittings.
Writes beside this file: Sakura-Stair-Trim-Rev-B.pdf (one A3 sheet), Sakura-Stair-Trim-Rev-B.dxf (1:1 mm), checks-trim.json.

    python3 docs/qa/sakura-surfaces/build_trim_cad.py     (from johansson-town/; needs node, reportlab, ezdxf)
"""
import json
import math
import os
import subprocess

import ezdxf
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
D = json.loads(subprocess.run(['node', '--input-type=module', '-e',
    "import {installDOM} from './tests/fixtures.mjs';installDOM();const m=await import('./src/world/interiors/sakura-stairs.js');"
    "const a=await import('./tools/sakura-surface-audit.mjs');const r=await a.auditSakuraSurfaces();"
    "const n=x=>x.surfaces.length+x.floors.length;"
    "console.log(JSON.stringify({w:m.SAKURA_STAIRWELL,t:m.SAKURA_STAIR_TRIM,h:m.SAKURA_STAIR.height,"
    "pairs:{shop:n(r.shop),office:n(r.office),zones:Object.values(r.zones).reduce((s,z)=>s+Object.values(z).reduce((q,l)=>q+l.length,0),0)}}))"],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1])
W, T, H = D['w'], D['t'], D['h']
R, G, K = W['rise'], W['going'], T['lineSlope']
CHECKS = []


def check(name, ok, detail=''):
    CHECKS.append(dict(check=name, ok=bool(ok), detail=detail))


def lower_line(x):
    return R + (-1.8 + .02 - x) * K


def upper_line(x):
    return 13 * R + (x - (-1.8 - 11 * G - .02)) * K


rail = T['rail']
path = rail['path']
# The rail over each flight's nosing line (Japanese building standard practice: 750..900 mm; World's 850).
on_flights = [(p, lower_line(p[0])) for p in path[:2]] + [(p, upper_line(p[0])) for p in path[4:6]]
hs = [p[1] - line for p, line in on_flights]
check('handrail 800..900 mm over the nosing line on both flights', all(.8 <= h <= .9 for h in hs), ', '.join(f'{h * 1000:.0f}' for h in hs))
check('handrail 32..45 mm across', .032 <= 2 * rail['radius'] <= .045, f"{2 * rail['radius'] * 1000:.0f} mm")
check('a hand fits between rail and wall (40 mm clear or more)', rail['off'] - rail['radius'] >= .04, f"{(rail['off'] - rail['radius']) * 1000:.0f} mm")
seg = [math.dist(a, b) for a, b in zip(path, path[1:])]
check('a bracket at least every metre', all(s / max(1, math.ceil(s / rail['bracketsEvery'])) <= 1.0 for s in seg))
check('one continuous rail, foot to top landing', path[0][0] == -1.8 and abs(path[-2][1] - path[-1][1]) < 1e-9)
# Strings: above the nosing line, and the treads stop at their faces.
for i, s in enumerate(T['strings']):
    line = lower_line if i < 2 else upper_line
    check(f'string {i + 1} stands {60}..80 mm over the nosing line', all(.06 <= s['top'][k] - line(s['x'][k]) <= .08 for k in (0, 1)))
tz = T['treadZ']
check('lower treads housed between their strings', abs(tz['lower'][0] - T['strings'][1]['z'][1]) < 1e-9 and abs(tz['lower'][1] - T['strings'][0]['z'][0]) < 1e-9)
check('upper treads housed between their strings', abs(tz['upper'][0] - T['strings'][2]['z'][1]) < 1e-9 and T['strings'][3]['z'][0] <= tz['upper'][1] + 1e-9)
check('non-slip nosing 4 mm proud (clear of the 2 mm rule)', T['nosing']['height'] > .002)
# Fittings: clear of the rail's reach (100 mm round it) so a hand on the rail meets nothing.
def near_rail(p, r=.1):
    best = 9
    for a, b in zip(path, path[1:]):
        ab = [b[k] - a[k] for k in range(3)]
        t = max(0, min(1, sum((p[k] - a[k]) * ab[k] for k in range(3)) / sum(v * v for v in ab)))
        best = min(best, math.dist(p, [a[k] + t * ab[k] for k in range(3)]))
    return best
for name, at in [('1F plate', T['plates'][0]['at']), ('2F plate', T['plates'][1]['at']), ('fire alarm', T['alarm']['at']),
                 ('stair light', T['light']['at'])] + [(f'switch {i + 1}', s['at']) for i, s in enumerate(T['switches'])]:
    d = near_rail(at)
    check(f'{name} clear of the handrail', d >= .12, f'{d * 1000:.0f} mm')
Q = T['poster']
for i, p in enumerate(T['posters']):
    x, y, z = p['at']
    edge = [(x, y - Q['h'] / 2, z)] + ([(x, y - Q['h'] / 2, z - Q['w'] / 2), (x, y - Q['h'] / 2, z + Q['w'] / 2)] if p['face'] == '+x' else [(x - Q['w'] / 2, y - Q['h'] / 2, z), (x + Q['w'] / 2, y - Q['h'] / 2, z)])
    d = min(near_rail(e) for e in edge)
    check(f'poster {i + 1} clear of the handrail', d >= .1, f'{d * 1000:.0f} mm')
    if p['face'] == '+z':
        under = upper_line(x - Q['w'] / 2) - .03
        check(f'poster {i + 1} wholly on the wall between the flights, under the upper flight', y + Q['h'] / 2 < under - .2, f"top {y + Q['h'] / 2:.2f} m, flight above {under:.2f} m")
    else:
        check(f'poster {i + 1} on the landing wall, clear of the alarm', abs(z - T['alarm']['at'][2]) > Q['w'] / 2 + .11 + .05)
Gd = T['guard']
run = Gd['z'][1] - Gd['z'][0] - 2 * Gd['post']
nb = math.ceil((run + Gd['gap']) / (Gd['baluster'] + Gd['gap'])) - 1
check('stair-head balustrade at least 900 mm high', Gd['height'] >= .9, f"{Gd['height'] * 1000:.0f} mm")
check('balustrade gaps under 110 mm (a child\'s head does not pass)', run / (nb + 1) - Gd['baluster'] < .11, f"{(run / (nb + 1) - Gd['baluster']) * 1000:.0f} mm, {nb} balusters")
check('no two faces in one plane: shop, office and the strict zones', all(v == 0 for v in D['pairs'].values()), json.dumps(D['pairs']))

# Drawings: plan (x, z) and section looking north (x, y), 1:40, in mm on the sheet.
PW, PH = landscape(A3)
S = 1000 / 40 * 72 / 25.4 / 1000  # metres to points at 1:40


def P(ox, oy):
    return lambda x, y: (ox + (x + 6.0) * S * 1000, oy + y * S * 1000)


pdf = canvas.Canvas(os.path.join(HERE, 'Sakura-Stair-Trim-Rev-B.pdf'), pagesize=(PW, PH))
pdf.setTitle('SK-ST-002 rev B, Sakura stairwell trim')
pdf.setFont('Helvetica-Bold', 13)
pdf.drawString(40, PH - 40, 'SK-ST-002  Sakura stairwell trim: strings, handrail, skirting, nosing, fittings   rev B  27 October 2026')
TP, TS = P(70, 120), P(70, 400)


def rect(f, x0, x1, a0, a1, col, fill=False):
    pdf.setStrokeColor(HexColor(col)); pdf.setFillColor(HexColor(col))
    (ax, ay), (bx, by) = f(x0, a0), f(x1, a1)
    pdf.rect(min(ax, bx), min(ay, by), abs(bx - ax), abs(by - ay), stroke=1, fill=1 if fill else 0)


def line(f, pts, col, w=.8):
    pdf.setStrokeColor(HexColor(col)); pdf.setLineWidth(w)
    q = [f(*p) for p in pts]
    for a, b in zip(q, q[1:]):
        pdf.line(*a, *b)


wl = W['walls']
# Plan: walls, flights, landing, strings, rail, fittings (z drawn upward from the south wall).
pz = lambda z: z + 6.9
rect(TP, wl['west'] - wl['thick'], wl['east'], pz(wl['south'] - wl['thick']), pz(wl['north'] + .04), '#999999')
for k in ('lower', 'upper', 'landing', 'top'):
    f = W[k]; rect(TP, f['x0'], f['x1'], pz(f['z0']), pz(f['z1']), '#8d7458')
for s in T['strings']:
    rect(TP, s['x'][0], s['x'][1], pz(s['z'][0]), pz(s['z'][1]), '#5b4636', True)
line(TP, [(p[0], pz(p[2])) for p in path], '#c0392b', 1.6)
for name, at, col in [(f'poster {i + 1}', p['at'], '#e67e22') for i, p in enumerate(T['posters'])] + [('1F', T['plates'][0]['at'], '#2f6b5e'), ('2F', T['plates'][1]['at'], '#2f6b5e'), ('alarm', T['alarm']['at'], '#c23a2e'),
                      ('light', T['light']['at'], '#d4a017')] + [('sw', s['at'], '#555555') for s in T['switches']]:
    x, y = TP(at[0], pz(at[2])); pdf.setFillColor(HexColor(col)); pdf.circle(x, y, 3, fill=1, stroke=0); pdf.setFont('Helvetica', 7); pdf.drawString(x + 4, y + 2, name)
pdf.setFillColor(HexColor('#000000')); pdf.setFont('Helvetica', 9)
pdf.drawString(70, 100, 'Plan 1:40. Dark: strings. Red: the handrail centre line. Dots: plates, fire alarm, stair light, switches.')
# Section looking north: the nosing lines, strings, the rail, skirting and the fittings' heights.
lx = [(-1.8 + .02 - i * G, R + i * R) for i in range(11)]
line(TS, [(-1.8, 0)] + [(x, y) for x, y in lx], '#8d7458')
ux = [(-1.8 - 11 * G - .02 + i * G, 13 * R + i * R) for i in range(11)]
line(TS, [(x, y) for x, y in ux], '#b08a5e')
for s in T['strings']:
    line(TS, [(s['x'][0], s['bottom'][0]), (s['x'][0], s['top'][0]), (s['x'][1], s['top'][1]), (s['x'][1], s['bottom'][1]), (s['x'][0], s['bottom'][0])], '#5b4636')
line(TS, [(p[0], p[1]) for p in path], '#c0392b', 1.6)
for x0, x1, y0, y1, *_ in T['skirting']:
    rect(TS, x0, x1, y0, y1, '#5b4636', True)
pdf.setFont('Helvetica', 7)
for name, at in [('1F', T['plates'][0]['at']), ('2F', T['plates'][1]['at']), ('alarm', T['alarm']['at']), ('light', T['light']['at'])]:
    x, y = TS(at[0], at[1]); pdf.setFillColor(HexColor('#2f6b5e')); pdf.circle(x, y, 2.5, fill=1, stroke=0); pdf.drawString(x + 4, y, name)
pdf.setFillColor(HexColor('#000000')); pdf.setFont('Helvetica', 9)
pdf.drawString(70, 380, 'Section looking north 1:40 (both flights overlaid). Brown: nosing lines; dark: strings and skirting; red: the handrail, 850 mm over the nosing line.')
y = PH - 80
pdf.setFont('Helvetica', 9)
for txt in ['Why each piece is there:',
            '- Strings: a closed string each side of each flight, the treads housed in it; no step end shows.',
            '- Handrail: one continuous wall rail (a stair must have one; staff carry stock up it), 40 mm, 65 mm off the wall,',
            '  on brackets about every metre, round the landing on its three walls, over the top landing to the hall.',
            '- Skirting where the landings meet the walls; non-slip nosing on all 22 treads.',
            '- Rev B: no door in the stair (rev A\'s cupboard door opened onto the 450 mm well). Instead the shop\'s campaign',
            '  poster with Pixar Thuan (SP-NK-001\'s print, B2) is pinned up twice: between the flights and on the landing.',
            '- The stair head in the office hall: a balustrade (newel posts, handrail, balusters) for the solid board.',
            '- 1F and 2F plates where each floor starts; the stair light on the landing wall and a switch at each end;',
            '  the fire alarm (lamp, bell, button) on the landing: the office\'s way out is down this stair.',
            '- Office storey: the stairwell\'s west wall now runs to the ceiling (the office floor west of it showed',
            '  as a slab floating on the landing wall).',
            '', 'Checks (checks-trim.json):'] + [('PASS  ' if c['ok'] else 'FAIL  ') + c['check'] + (f"  ({c['detail']})" if c['detail'] else '') for c in CHECKS]:
    pdf.drawString(PW - 520, y, txt); y -= 12
pdf.save()

doc = ezdxf.new('R2010'); doc.units = ezdxf.units.MM; msp = doc.modelspace()
mm = lambda v: v * 1000
for name in ('WALL', 'FLIGHT', 'STRING', 'RAIL', 'FITTING'):
    doc.layers.add(name)
for k in ('lower', 'upper', 'landing', 'top'):
    f = W[k]; msp.add_lwpolyline([(mm(f['x0']), mm(f['z0'])), (mm(f['x1']), mm(f['z0'])), (mm(f['x1']), mm(f['z1'])), (mm(f['x0']), mm(f['z1']))], close=True, dxfattribs={'layer': 'FLIGHT'})
for s in T['strings']:
    msp.add_lwpolyline([(mm(s['x'][0]), mm(s['z'][0])), (mm(s['x'][1]), mm(s['z'][0])), (mm(s['x'][1]), mm(s['z'][1])), (mm(s['x'][0]), mm(s['z'][1]))], close=True, dxfattribs={'layer': 'STRING'})
msp.add_lwpolyline([(mm(p[0]), mm(p[2])) for p in path], dxfattribs={'layer': 'RAIL'})
for at in [T['plates'][0]['at'], T['plates'][1]['at'], T['alarm']['at'], T['light']['at']] + [s['at'] for s in T['switches']]:
    msp.add_circle((mm(at[0]), mm(at[2])), 40, dxfattribs={'layer': 'FITTING'})
DXF = os.path.join(HERE, 'Sakura-Stair-Trim-Rev-B.dxf')
doc.saveas(DXF)
check('DXF reopens with no audit errors', not ezdxf.readfile(DXF).audit().has_errors)
json.dump(CHECKS, open(os.path.join(HERE, 'checks-trim.json'), 'w'), indent=1)
print(f"{sum(c['ok'] for c in CHECKS)}/{len(CHECKS)} checks pass")
for c in CHECKS:
    if not c['ok']:
        print('FAIL', c)
