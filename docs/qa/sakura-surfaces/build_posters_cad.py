"""Sakura's staff walls, drawing SK-ST-003 revision A (27 October 2026). The owner: "Put more advertisement posters on the
walls in the hallway and stair case ... like a fake beer brand and make up ads and liquor ads etc and I want liquor and
beer boxes in the hallway outside the office". From src/world/interiors/sakura-trade-posters.js: the stair walls unfolded
with the handrail and every poster, and the office hall's plan with its posters and cases.
Writes beside this file: Sakura-Staff-Walls-Rev-A.pdf (one A3 sheet), checks-posters.json.

    python3 docs/qa/sakura-surfaces/build_posters_cad.py     (from johansson-town/; needs node, reportlab)
"""
import json
import math
import os
import subprocess

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
D = json.loads(subprocess.run(['node', '--input-type=module', '-e',
    "import {installDOM} from './tests/fixtures.mjs';installDOM();const p=await import('./src/world/interiors/sakura-trade-posters.js');"
    "const s=await import('./src/world/interiors/sakura-stairs.js');const o=await import('./src/world/interiors/sakura-office-room.js');"
    "console.log(JSON.stringify({d:p.SAKURA_TRADE_POSTERS,p:p.SAKURA_POSTER_WALLS,size:p.POSTER_SIZE,k:p.SAKURA_HALL_STOCK,t:s.SAKURA_STAIR_TRIM,w:s.SAKURA_STAIRWELL,hall:o.SAKURA_UPSTAIRS.hall}))"],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1])
P, S, K, T, W, HALL = D['p'], D['size'], D['k'], D['t'], D['w'], D['hall']
CHECKS = []


def check(name, ok, detail=''):
    CHECKS.append(dict(check=name, ok=bool(ok), detail=detail))


def to_rail(q):
    best, path = 9, T['rail']['path']
    for a, b in zip(path, path[1:]):
        ab = [b[k] - a[k] for k in range(3)]
        t = max(0, min(1, sum((q[k] - a[k]) * ab[k] for k in range(3)) / sum(v * v for v in ab)))
        best = min(best, math.dist(q, [a[k] + t * ab[k] for k in range(3)]))
    return best


def corners(p):
    x, y, z = p['at']; h, w = S['h'] / 2, S['w'] / 2
    return [(x, y + dy, z + dz) for dy in (-h, h) for dz in (-w, w)] if p['face'][1] == 'x' else [(x + dx, y + dy, z) for dy in (-h, h) for dx in (-w, w)]


stair = [p for p in P if p['room'] == 'stair']
hall = [p for p in P if p['room'] == 'hall']
check('nine designs, each hung at least once', len(D['d']) == 9 and all(any(p['id'] == d['id'] for p in P) for d in D['d']))
check('every design says who sent it and why it is here', all(d['why'] for d in D['d']))
for p in stair:
    d = min(to_rail(c) for c in corners(p))
    check(f"{p['id']} ({p['wall']}) clear of the handrail", d >= .1, f'{d * 1000:.0f} mm')
doors = [(-2.0, -1.6, -.7, 'store'), (.7, -2.3, -1.4, 'archive'), (.7, .65, 1.55, 'office')]
for p in hall:
    x, _, z = p['at']
    ok = all(abs(dx - x) > .1 or z + S['w'] / 2 <= z0 or z - S['w'] / 2 >= z1 for dx, z0, z1, _ in doors)
    check(f"{p['id']} ({p['wall']}) clear of the doors", ok)
for k in K:
    x, z = k['at']; w = k['size'][2] / 2
    check(f"{k['print']} stack clear of the doors", all(abs(dx - x) > .1 or z + w <= z0 or z - w >= z1 for dx, z0, z1, _ in doors))
west = max(k['at'][0] + k['size'][0] + .03 for k in K if k['face'] == '+x')
check('a 1.2 m way through the hall past the stacks', .2 - west >= 1.2, f'{.2 - west:.2f} m')
for k in K:
    under = [p for p in hall if abs(p['at'][0] - k['at'][0]) < .1 and abs(p['at'][2] - k['at'][1]) < S['w'] / 2 + k['size'][2] / 2]
    top = len(range(k['stack'])) * (k['size'][1] + .002)
    check(f"{k['print']} stack under the posters' paper", all(top < p['at'][1] - S['h'] / 2 - .1 for p in under), f'{top:.2f} m high')

PW, PH = landscape(A3)
pdf = canvas.Canvas(os.path.join(HERE, 'Sakura-Staff-Walls-Rev-A.pdf'), pagesize=(PW, PH))
pdf.setTitle('SK-ST-003 rev A, Sakura staff walls')
pdf.setFont('Helvetica-Bold', 13)
pdf.drawString(40, PH - 40, 'SK-ST-003  Sakura staff walls: trade posters on the stair and in the hall, the drink stock outside the office   rev A  27 October 2026')
sc = 72 / 25.4 * 1000 / 60  # 1:60, metres to points
COL = {'beer': '#d9a63a', 'gift': '#a51c24', 'whisky': '#5a3a1e', 'awamori': '#2b3f6c', 'sake': '#c8202a', 'chuhai': '#f2d22c', 'cosmetics': '#e07a6c'}
kind = {d['id']: d['kind'] for d in D['d']}
wl = W['walls']
path = T['rail']['path']
# Stair walls unfolded, each seen from inside the stairwell: north (x to the right), west (z, north to the right), south.
ox, oy = 40, 400
walls = [('north wall: lower flight and landing', 0, lambda q: q[0] - wl['west'], wl['east'] - wl['west'], lambda p: p['face'] == '-z', lambda q: abs(q[2] - path[0][2]) < 1e-6),
         ('west wall: landing', 1, lambda q: q[2] - wl['south'], wl['north'] - wl['south'], lambda p: p['face'] == '+x', lambda q: abs(q[0] - path[2][0]) < 1e-6),
         ('south wall: landing and upper flight', 2, lambda q: wl['east'] - q[0], wl['east'] - wl['west'], lambda p: p['face'] == '+z', lambda q: abs(q[2] - path[3][2]) < 1e-6)]
base = ox
for name, i, along, width, pick, on in walls:
    pdf.setStrokeColor(HexColor('#999999')); pdf.setLineWidth(.6); pdf.rect(base, oy, width * sc, wl['ceiling'] * sc)
    pdf.setFillColor(HexColor('#000000')); pdf.setFont('Helvetica', 8); pdf.drawString(base, oy - 12, name)
    for p in [p for p in stair if pick(p)]:
        u = along(p['at']); x, y = base + (u - S['w'] / 2) * sc, oy + (p['at'][1] - S['h'] / 2) * sc
        pdf.setFillColor(HexColor(COL[kind[p['id']]])); pdf.rect(x, y, S['w'] * sc, S['h'] * sc, fill=1, stroke=0)
        pdf.setFillColor(HexColor('#000000')); pdf.setFont('Helvetica', 6); pdf.drawString(x, y + S['h'] * sc + 3, p['id'])
    pts = sorted([(base + along(q) * sc, oy + q[1] * sc) for q in path if on(q)])
    pdf.setStrokeColor(HexColor('#c0392b')); pdf.setLineWidth(1.4)
    for a2, b2 in zip(pts, pts[1:]):
        pdf.line(*a2, *b2)
    base += width * sc + 24
pdf.setFillColor(HexColor('#000000')); pdf.setFont('Helvetica', 9)
pdf.drawString(ox, oy - 26, 'Stair walls unfolded 1:60, seen from inside (shop frame heights). Red: the handrail; each poster 120 mm or more over it at its higher edge.')
# Hall plan, z to the right (stair head on the left, rest room on the right), x up (east at the top).
hx, hy, hs = 40, 110, 72 / 25.4 * 1000 / 50
def H(x, z):
    return hx + (z - HALL['minZ']) * hs, hy + (x - HALL['minX']) * hs
pdf.setStrokeColor(HexColor('#999999')); pdf.setLineWidth(.8)
a2, b2 = H(HALL['minX'], HALL['minZ']), H(HALL['maxX'], HALL['maxZ']); pdf.rect(a2[0], a2[1], b2[0] - a2[0], b2[1] - a2[1])
for dx, z0, z1, name in doors:
    p0, p1 = H(dx, z0), H(dx, z1); pdf.setStrokeColor(HexColor('#2f6b5e')); pdf.setLineWidth(3); pdf.line(*p0, *p1)
    pdf.setFont('Helvetica', 7); pdf.setFillColor(HexColor('#2f6b5e')); pdf.drawString(p0[0], p0[1] + (6 if dx > 0 else -10), name + ' door')
for k in K:
    d, _, w = k['size']; x0 = k['at'][0] if k['face'] == '+x' else k['at'][0] - d; p0, p1 = H(x0, k['at'][1] - w / 2), H(x0 + d, k['at'][1] + w / 2)
    pdf.setFillColor(HexColor('#c49a6c')); pdf.rect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1], fill=1, stroke=0)
    pdf.setFillColor(HexColor('#000000')); pdf.setFont('Helvetica', 5.5); pdf.drawString(p0[0], p1[1] + 2 if k['face'] == '+x' else p0[1] - 8, f"{k['print']} x{k['stack']}")
for p in hall:
    z = p['at'][2]; p0, p1 = H(p['at'][0], z - S['w'] / 2), H(p['at'][0], z + S['w'] / 2)
    pdf.setStrokeColor(HexColor(COL[kind[p['id']]])); pdf.setLineWidth(5); pdf.line(*p0, *p1)
pdf.setFillColor(HexColor('#000000')); pdf.setFont('Helvetica', 9)
pdf.drawString(hx, hy - 24, 'Office hall plan 1:50 (office frame; the stair head left, the rest room right). Thick lines: posters; tan: case stacks; green: doors.')
y = PH - 70
pdf.setFont('Helvetica', 8.5)
for txt in ['Why they are here (sakura-trade-posters.js):',
            '- Since Higa Liquor closed Sakura sells and supplies all the island\'s drink.',
            '  The brewers\' and distillers\' reps send campaign posters with each',
            '  season\'s order; the spares go up on the staff walls. Asagao\'s rep left two,',
            '  hoping Thuan will take their lipsticks. Every drink poster carries the',
            '  drinking-from-twenty line.',
            '- The cases: the year-end gift orders (o-seibo) and the Coral Bay Bar\'s',
            '  December spirits wait dry upstairs by the office and its safe until',
            '  Koji\'s round. Hand-stacked: a few mm off, a degree turned.',
            '', 'Checks (checks-posters.json):'] + [('PASS  ' if c['ok'] else 'FAIL  ') + c['check'] + (f"  ({c['detail']})" if c['detail'] else '') for c in CHECKS]:
    pdf.drawString(PW - 400, y, txt); y -= 10.5
pdf.save()
json.dump(CHECKS, open(os.path.join(HERE, 'checks-posters.json'), 'w'), indent=1)
print(f"{sum(c['ok'] for c in CHECKS)}/{len(CHECKS)} checks pass")
for c in CHECKS:
    if not c['ok']:
        print('FAIL', c)
