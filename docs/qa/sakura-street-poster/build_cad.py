"""Sakura's street poster on Nakamura / Blue Coral's south wall, drawing SP-NK-001 revision D, from the placement's data
(src/world/sakura-street-poster.js) and the town as the game builds it (audit.json, tools/street-poster-audit.mjs).
Writes beside this file:

    Sakura-Street-Poster-Rev-D.pdf   one A3 sheet: the south wall seen from the street 1:30, a section 1:10, the checks
    Sakura-Street-Poster-Rev-D.dxf   1:1 millimetres, R2010
    checks.json

    python3 docs/qa/sakura-street-poster/build_cad.py   (from johansson-town/; needs node, Pillow, reportlab, ezdxf)
"""
import glob
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
P = json.loads(subprocess.run(['node', '-e', "import('./src/world/sakura-street-poster.js').then(m=>console.log("
                                              "JSON.stringify(m.SAKURA_STREET_POSTER)))"], cwd=ROOT,
                              capture_output=True, text=True, check=True).stdout)
subprocess.run(['node', 'tools/street-poster-audit.mjs', os.path.join(HERE, 'audit.json')], cwd=ROOT, check=True,
               capture_output=True)
AUD = json.load(open(os.path.join(HERE, 'audit.json')))
W = P['wall']
mm = lambda v: round(v * 1000)  # noqa: E731
CHECKS = []


def check(name, ok, detail=''):
    CHECKS.append(dict(check=name, ok=bool(ok), detail=detail))


bw, bh = P['board']['w'], P['board']['h']
cx, cy = mm(P['centre']['x']), P['centre']['y']
b0, b1 = cx - bw / 2, cx + bw / 2
y0, y1 = cy - bh / 2, cy + bh / 2
wf, wt, win0, win1 = mm(W['from']), mm(W['to']), mm(W['window'][0]), mm(W['window'][1])
check('B1 paper inside its board with a margin', P['paper'][0] < bw and P['paper'][1] < bh, f"{P['paper']} on {bw} x {bh}")
check('B-series proportions (1 : 1.414)', abs(P['paper'][1] / P['paper'][0] - 2 ** .5) < .005, f"{P['paper']}")
check('board 300 clear of the window', b0 - win1 >= 300, f'{b0 - win1:.0f} mm')
check('board 300 clear of the back corner', wt - b1 >= 300, f'{wt - b1:.0f} mm')
check('board under the first floor with 300 to spare', y1 <= W['firstFloor'] - 300, f'top {y1:.0f}')
check('poster bottom above the planter and passers-by (600)', y0 >= 600, f'bottom {y0:.0f}')
check('nothing of the built town 3..400 out from the wall within 300 of the board', not AUD['intruders'],
      ', '.join(AUD['intruders']))
check("on the shop's side wall, away from its front, door and flag (open Nakamura audit)", b0 - wf >= 3000,
      f'{b0 - wf:.0f} mm from the front')

import ezdxf  # noqa: E402
doc = ezdxf.new('R2010', setup=True)
doc.units = ezdxf.units.MM
msp = doc.modelspace()
for name, col in (('WALL', 8), ('POSTER', 1), ('FIXTURE', 9), ('TEXT', 7)):
    doc.layers.add(name, color=col)


def rect(a, b, c_, d, layer):
    msp.add_lwpolyline([(a, b), (c_, b), (c_, d), (a, d)], close=True, dxfattribs={'layer': layer})


H = lambda x: -x  # noqa: E731  seen from the street below, looking north: left is east (the back corner)
rect(H(wt), 0, H(wf), W['firstFloor'] + 2800, 'WALL')
msp.add_line((H(wt), W['firstFloor']), (H(wf), W['firstFloor']), dxfattribs={'layer': 'WALL'})
rect(H(win1), 900, H(win0), 2100, 'FIXTURE')
rect(H(b1), y0, H(b0), y1, 'POSTER')
rect(H(cx + P['paper'][0] / 2), cy - P['paper'][1] / 2, H(cx - P['paper'][0] / 2), cy + P['paper'][1] / 2, 'POSTER')
msp.add_text('SP-NK-001 rev D: Sakura street poster, Nakamura / Blue Coral south wall (seen from the street)', height=80,
             dxfattribs={'layer': 'TEXT'}).set_placement((H(wt), W['firstFloor'] + 3000))
for old in glob.glob(os.path.join(HERE, 'Sakura-Street-Poster-Rev-[ABC].*')):
    os.remove(old)
path = os.path.join(HERE, 'Sakura-Street-Poster-Rev-D.dxf')
doc.saveas(path)
from ezdxf import recover  # noqa: E402
_, aud = recover.readfile(path)
check('DXF reopens with no audit errors', not aud.has_errors)

from reportlab.lib.pagesizes import A3, landscape  # noqa: E402
from reportlab.pdfgen import canvas  # noqa: E402
from reportlab.lib.utils import ImageReader  # noqa: E402
from PIL import Image  # noqa: E402
PW, PH = landscape(A3)
k = 72 / 25.4 / 30
c = canvas.Canvas(os.path.join(HERE, 'Sakura-Street-Poster-Rev-D.pdf'), pagesize=landscape(A3))
c.setLineWidth(.8)
c.rect(20, 20, PW - 40, PH - 40)
c.setFont('Helvetica-Bold', 13)
c.drawString(40, PH - 50, 'Sakura street poster on Nakamura / Blue Coral, south wall seen from the street, 1:30 (rev D)')
ox, oy = 90, 170
X = lambda x: ox + (wt - x) * k  # noqa: E731
Y = lambda y: oy + y * k  # noqa: E731
c.setStrokeColorRGB(.4, .4, .4)
c.setFillColorRGB(.95, .92, .85)
c.rect(X(wt), Y(0), (wt - wf) * k, (W['firstFloor'] + 2800) * k, fill=1)
c.line(X(wt), Y(W['firstFloor']), X(wf), Y(W['firstFloor']))
c.setFillColorRGB(.75, .85, .88)
c.rect(X(win1), Y(900), (win1 - win0) * k, 1200 * k, fill=1)
c.setFillColorRGB(.18, .29, .24)
c.rect(X(b1), Y(y0), bw * k, bh * k, fill=1)
img = os.path.join(HERE, 'poster-preview.png')
Image.open(os.path.join(ROOT, 'assets', P['asset'])).convert('RGB').save(img)
c.drawImage(ImageReader(img), X(cx + P['paper'][0] / 2), Y(cy - P['paper'][1] / 2), P['paper'][0] * k, P['paper'][1] * k)
c.setFillColorRGB(0, 0, .6)
c.setStrokeColorRGB(0, 0, .6)
c.setFont('Helvetica', 7)
for v in (0, y0, cy, y1, W['firstFloor']):
    c.line(X(wt) - 30, Y(v), X(wt) - 8, Y(v))
    c.drawRightString(X(wt) - 32, Y(v) - 2, f'{v:.0f}')
c.line(X(b0), Y(y0) - 18, X(win1), Y(y0) - 18)
c.drawCentredString((X(b0) + X(win1)) / 2, Y(y0) - 28, f'{b0 - win1:.0f} to the window')
c.line(X(wt), Y(y0) - 18, X(b1), Y(y0) - 18)
c.drawCentredString((X(wt) + X(b1)) / 2, Y(y0) - 28, f'{wt - b1:.0f}')
c.drawCentredString(X(cx), Y(y1) + 10, f'board {bw} x {bh} x 18, paper 1400 x 1980')
c.drawCentredString((X(win0) + X(win1)) / 2, Y(2100) + 8, 'window')
c.drawString(X(wt), Y(0) - 14, 'east: back corner')
c.drawRightString(X(wf), Y(0) - 14, 'west: shop front on Main Street (door, counter, flag on that face)')
sx, sy, s10 = 690, 420, 72 / 25.4 / 10
c.setFillColorRGB(.95, .92, .85)
c.rect(sx - 200 * s10, sy, 200 * s10, 1300 * s10, fill=1)
c.setFillColorRGB(.18, .29, .24)
c.rect(sx, sy + 120 * s10, 12 * s10, 1062 * s10 * .9, fill=1)
c.setFillColorRGB(0, 0, 0)
c.setFont('Helvetica', 8)
c.drawString(sx - 200 * s10, sy - 14, 'SECTION 1:10: plaster wall | 18 mm painted board | paper 3 mm proud')
c.setFont('Helvetica', 7.5)
yy = 360
c.drawString(sx - 40, yy, f'Checks: {sum(x["ok"] for x in CHECKS)} of {len(CHECKS)} pass')
for i, ck in enumerate(CHECKS):
    c.setFillColorRGB(0, .45, 0) if ck['ok'] else c.setFillColorRGB(.75, 0, 0)
    c.drawString(sx - 40, yy - 11 * (i + 1), ('PASS ' if ck['ok'] else 'FAIL ') + ck['check'] + (f" ({ck['detail']})" if ck['detail'] else ''))
c.setFillColorRGB(0, 0, 0)
c.rect(PW - 300, 20, 280, 60)
c.setFont('Helvetica-Bold', 11)
c.drawString(PW - 292, 58, 'SP-NK-001  rev D  24 Oct 2026')
c.setFont('Helvetica', 8)
c.drawString(PW - 292, 44, 'Johansson World · Minato · Nakamura / Blue Coral')
c.drawString(PW - 292, 30, 'millimetres; virtual-environment drawing')
c.save()
json.dump(CHECKS, open(os.path.join(HERE, 'checks.json'), 'w'), indent=1)
bad = [x for x in CHECKS if not x['ok']]
print(f'{len(CHECKS)} checks, {len(bad)} failed')
for x in bad:
    print(' FAIL', x)
sys.exit(1 if bad else 0)
