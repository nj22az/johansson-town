"""Sakura wall band, drawing set SK-WB-001..003 revision A, from the band's own data (src/world/interiors/sakura-band.js)
and the shop as the game builds it (tools/sakura-band-audit.mjs). Writes, beside this file:

    Sakura-Wall-Band-Rev-A.pdf   three A3 sheets: key plan and section; back wall; west and east walls
    Sakura-Wall-Band-Rev-A.dxf   1:1 millimetres, R2010: the three elevations and the section
    band-<run>.png               each wall's signwritten face at 1 px per mm (also the game's layout check)
    checks.json                  every check below, passed or failed

    python3 docs/qa/sakura-wall-band/build_cad.py        (from johansson-town/; needs node, Pillow, reportlab, ezdxf)

Checks: every word and crest inside its board with a margin and clear of the next; nothing repeated or cut; the cap
under the beams; nothing else on the walls above the clear line (from the audit of the built shop); boards no longer
than stock; the DXF reopens with no audit errors.
"""
import json
import math
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
FONT = os.path.join(HERE, 'fonts', 'MPLUSRounded1c-Bold-latin.ttf')


def node(js):
    return json.loads(subprocess.run(['node', '-e', js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)


D = node("import('./src/world/interiors/sakura-band.js').then(m=>console.log(JSON.stringify({d:m.SAKURA_BAND_DESIGN,"
         "boards:Object.fromEntries(m.SAKURA_BAND_DESIGN.runs.map(r=>[r.id,m.boards(r)])),"
         "len:Object.fromEntries(m.SAKURA_BAND_DESIGN.runs.map(r=>[r.id,m.runLength(r)]))})))")
SHELL = node("import('./src/world/interiors/sakura-shell.js').then(m=>console.log(JSON.stringify(m.SAKURA_SHELL)))")
subprocess.run(['node', 'tools/sakura-band-audit.mjs', os.path.join(HERE, 'audit.json')], cwd=ROOT, check=True,
               capture_output=True)
AUDIT = json.load(open(os.path.join(HERE, 'audit.json')))
B, CAP, BEAD, STRIPE = D['d']['board'], D['d']['cap'], D['d']['bead'], D['d']['stripe']
COL = D['d']['colours']
CEIL = round(SHELL['ceiling'] * 1000)
BEAM_BOTTOM = D['d']['beamBottom']
BEAMS_X = [round(x * 1000) for x in [-6.2 + 1.55 * k for k in range(9)]]  # sakura-shell.js: every 1.55 m from -6.2
RUNS = {r['id']: r for r in D['d']['runs']}
CHECKS = []


def check(name, ok, detail=''):
    CHECKS.append(dict(check=name, ok=bool(ok), detail=detail))
    return ok


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


# ------------------------------------------------------------------ the signwritten faces

def item_extent(it, draw):
    """The width an item takes along the board, in mm."""
    if it['kind'] in ('text', 'title'):
        return it['w']
    if it['kind'] == 'crest':
        return it['size']
    if it['kind'] == 'leaf':
        return 150
    return 0


def crest(d, cx, cy, size):
    r = size / 2
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=hexrgb(COL['red']))
    d.ellipse([cx - r * .86, cy - r * .86, cx + r * .86, cy + r * .86], fill=hexrgb(COL['cream']))
    for k in range(5):
        a = k * 2 * math.pi / 5 - math.pi / 2
        px, py = cx + math.cos(a) * r * .3, cy - r * .12 + math.sin(a) * r * .3
        d.ellipse([px - r * .17, py - r * .17, px + r * .17, py + r * .17], fill=(242, 166, 184))
    d.ellipse([cx - r * .1, cy - r * .22, cx + r * .1, cy - r * .02], fill=(242, 194, 26))
    d.text((cx, cy + r * .5), 'Sakura', font=ImageFont.truetype(FONT, int(r * .36)), fill=hexrgb(COL['red']),
           anchor='mm')


def leaf(d, cx, cy):
    for sx in (-1, 1):
        pts = [(cx + sx * (6 + 60 * t), cy - 34 * math.sin(math.pi * t) * 0.9 + 10 * t) for t in [i / 20 for i in range(21)]]
        pts += [(cx + sx * (6 + 60 * t), cy + 22 * math.sin(math.pi * t) * 0.6 + 10 * t) for t in [i / 20 for i in range(20, -1, -1)]]
        d.polygon(pts, fill=(92, 128, 70))


def face(run_id):
    """The board face of one run at 1 px per mm: planed boards with their joints, the lettering painted on."""
    L, H = D['len'][run_id], B['y1'] - B['y0']
    im = Image.new('RGB', (L, H), hexrgb(COL['board']))
    d = ImageDraw.Draw(im)
    for i in range(0, H, 9):  # the grain
        d.line([(0, i + 4), (L, i + 2 + (i * 7) % 5)], fill=hexrgb(COL['grain']) + (), width=1)
    for (a, b) in D['boards'][run_id][1:]:
        d.line([(a, 0), (a, H)], fill=(110, 76, 44), width=B['joint'])
    placed = []
    for it in RUNS[run_id]['items']:
        w = item_extent(it, d)
        u0, u1 = it['u'] - w / 2, it['u'] + w / 2
        placed.append((u0, u1, it))
        if it['kind'] in ('text', 'title'):
            d.text((it['u'], H / 2 + 4), it['text'], font=ImageFont.truetype(FONT, it['size']), fill=hexrgb(COL['ink']),
                   anchor='mm')
        elif it['kind'] == 'crest':
            crest(d, it['u'], H / 2, it['size'])
        elif it['kind'] == 'leaf':
            leaf(d, it['u'], H / 2)
    im.save(os.path.join(HERE, f'band-{run_id}.png'))
    # every item on its board, 120 mm from either end, and 80 mm clear of the next
    placed.sort(key=lambda p: p[0])
    for u0, u1, it in placed:
        name = it.get('text', it['kind'])
        check(f'{run_id}: "{name}" inside the board, 120 mm from its ends', u0 >= 120 and u1 <= L - 120,
              f'{u0:.0f}..{u1:.0f} of {L}')
        if it['kind'] in ('text', 'title'):
            check(f'{run_id}: "{name}" letters fit the board height', it['size'] <= H * 0.75, f'{it["size"]} of {H}')
            m = d.textlength(it['text'], font=ImageFont.truetype(FONT, it['size']))
            check(f'{run_id}: "{name}" lettering inside its allotted width', m <= it['w'], f'{m:.0f} of {it["w"]}')
    for (a0, a1, a), (b0, b1, b) in zip(placed, placed[1:]):
        check(f'{run_id}: {a.get("text", a["kind"])} and {b.get("text", b["kind"])} 80 mm apart', b0 - a1 >= 80,
              f'{b0 - a1:.0f} mm')
    for a, _ in D['boards'][run_id][1:]:
        hit = [it.get('text', it['kind']) for u0, u1, it in placed if u0 - 40 < a < u1 + 40]
        check(f'{run_id}: joint at {a} clear of the lettering', not hit, ', '.join(hit))
    texts = [it['text'] for it in RUNS[run_id]['items'] if 'text' in it]
    check(f'{run_id}: no wording repeated on the wall', len(texts) == len(set(texts)))
    return im, placed


FACES = {k: face(k) for k in RUNS}

# ------------------------------------------------------------------ fit in the room

check('cap top under the ceiling beams with 10 mm', BEAM_BOTTOM - CAP['y1'] >= 10, f'{BEAM_BOTTOM - CAP["y1"]} mm')
check('beam bottom as built', BEAM_BOTTOM == CEIL - 160, f'ceiling {CEIL} - 160')
for rid, rb in D['boards'].items():
    longest = max(b - a for a, b in rb)
    check(f'{rid}: boards no longer than stock ({B["stock"]})', longest <= B['stock'], f'longest {longest}')
for rid, a in AUDIT['runs'].items():
    check(f'{rid}: board face {B["face"]} mm off the wall, as the band always stood', a['boardFace'] == B['face'],
          f'{a["boardFace"]} mm')
    intr = {k: v for k, v in a['inside'].items() if not k.startswith('Sakura wall')}
    check(f'{rid}: nothing else in the band volume', not intr, ', '.join(f'{k} up to {v["y1"]}' for k, v in intr.items()))
    tops = {k: v['y1'] for k, v in a['front'].items() if v['d0'] < 140 and not k.startswith('Sakura wall')
            and not any(s in k.lower() for s in ('shell', 'ceiling', 'beam', 'light', 'front frame', 'floor', 'wainscot'))}
    high = {k: t for k, t in tops.items() if t > D['d']['wallClear']}
    check(f'{rid}: wall fittings stay under {D["d"]["wallClear"]}', not high, ', '.join(f'{k} {t}' for k, t in high.items()))

# ------------------------------------------------------------------ the DXF

import ezdxf  # noqa: E402

doc = ezdxf.new('R2010', setup=True)
doc.units = ezdxf.units.MM
msp = doc.modelspace()
for name, colour in (('WALL', 8), ('BAND', 30), ('CAP', 32), ('STRIPE', 1), ('BEAM', 34), ('TEXT', 7), ('FIXTURE', 9),
                     ('DIM', 5)):
    doc.layers.add(name, color=colour)


def rect(x0, y0, x1, y1, layer):
    msp.add_lwpolyline([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], close=True, dxfattribs={'layer': layer})


ORIGINS = {'back': (0, 0), 'west': (0, -4000), 'east': (7000, -4000)}
for rid, (ox, oy) in ORIGINS.items():
    L = D['len'][rid]
    msp.add_text(f'SK-WB {rid.upper()} WALL ELEVATION, seen from inside, rev A', height=80,
                 dxfattribs={'layer': 'TEXT'}).set_placement((ox, oy + CEIL + 200))
    rect(ox, oy, ox + L, oy + CEIL, 'WALL')
    rect(ox, oy + STRIPE['y0'], ox + L, oy + STRIPE['y1'], 'STRIPE')
    rect(ox, oy + BEAD['y0'], ox + L, oy + BEAD['y1'], 'CAP')
    rect(ox, oy + B['y0'], ox + L, oy + B['y1'], 'BAND')
    rect(ox, oy + CAP['y0'], ox + L, oy + CAP['y1'], 'CAP')
    for a, b in D['boards'][rid][1:]:
        msp.add_line((ox + a, oy + B['y0']), (ox + a, oy + B['y1']), dxfattribs={'layer': 'BAND'})
    for u0, u1, it in FACES[rid][1]:
        if 'text' in it:
            t = msp.add_text(it['text'], height=it['size'] * 0.72, dxfattribs={'layer': 'TEXT'})
            t.set_placement((ox + it['u'], oy + (B['y0'] + B['y1']) / 2), align=ezdxf.enums.TextEntityAlignment.MIDDLE_CENTER)
        elif it['kind'] == 'crest':
            msp.add_circle((ox + it['u'], oy + (B['y0'] + B['y1']) / 2), it['size'] / 2, dxfattribs={'layer': 'TEXT'})
    if rid == 'back':
        for x in BEAMS_X:
            u = x - round(RUNS['back']['from'] * 1000)
            if 0 < u < L:
                rect(ox + u - 70, oy + BEAM_BOTTOM, ox + u + 70, oy + CEIL, 'BEAM')
    for k, v in AUDIT['runs'][rid]['front'].items():
        if v['u1'] - v['u0'] < 0.9 * L and v['y1'] > 1200 and v['d0'] < 900 and not k.startswith('Sakura wall'):
            rect(ox + max(0, v['u0']), oy + max(0, v['y0']), ox + min(L, v['u1']), oy + v['y1'], 'FIXTURE')
# the section, 1:1 at its own origin
sx, sy = 16000, 2000
rect(sx - 100, sy + 2300, sx, sy + CEIL, 'WALL')
rect(sx, sy + STRIPE['y0'], sx + B['face'], sy + STRIPE['y1'], 'STRIPE')
rect(sx, sy + BEAD['y0'], sx + B['face'] + BEAD['project'], sy + BEAD['y1'], 'CAP')
rect(sx, sy + B['y0'], sx + B['batten'], sy + B['y1'], 'BAND')
rect(sx + B['batten'], sy + B['y0'], sx + B['face'], sy + B['y1'], 'BAND')
rect(sx, sy + CAP['y0'], sx + B['face'] + CAP['project'], sy + CAP['y1'], 'CAP')
rect(sx, sy + BEAM_BOTTOM, sx + 600, sy + CEIL, 'BEAM')
msp.add_text('SECTION THROUGH THE BAND 1:1 (batten 45, board 15, cap 30 x 78, bead 10 x 68, stripe rail 66)', height=25,
             dxfattribs={'layer': 'TEXT'}).set_placement((sx - 100, sy + CEIL + 60))
dxf_path = os.path.join(HERE, 'Sakura-Wall-Band-Rev-A.dxf')
doc.saveas(dxf_path)
from ezdxf import recover  # noqa: E402
d2, auditor = recover.readfile(dxf_path)
check('DXF reopens with no audit errors', not auditor.has_errors, f'{len(auditor.errors)} errors')

# ------------------------------------------------------------------ the PDF

from reportlab.lib.pagesizes import A3, landscape  # noqa: E402
from reportlab.pdfgen import canvas  # noqa: E402
from reportlab.lib.utils import ImageReader  # noqa: E402
from reportlab.pdfbase import pdfmetrics  # noqa: E402
from reportlab.pdfbase.ttfonts import TTFont  # noqa: E402

pdfmetrics.registerFont(TTFont('Maru', FONT))
PW, PH = landscape(A3)
MMPT = 72 / 25.4
pdf_path = os.path.join(HERE, 'Sakura-Wall-Band-Rev-A.pdf')
c = canvas.Canvas(pdf_path, pagesize=landscape(A3))


def title_block(sheet, title):
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(0.8)
    c.rect(20, 20, PW - 40, PH - 40)
    c.rect(PW - 300, 20, 280, 70)
    c.setFont('Maru', 9)
    c.drawString(PW - 292, 74, 'Johansson World · Minato · Sakura Shōten'.replace('ō', 'o'))
    c.setFont('Maru', 12)
    c.drawString(PW - 292, 56, title)
    c.setFont('Maru', 9)
    c.drawString(PW - 292, 40, f'{sheet}  rev A  24 Oct 2026  millimetres')
    c.drawString(PW - 292, 28, 'Virtual-environment drawing, not a construction approval')


def elevation(rid, x0, y0, scale, show_top=2300):
    """Elevation of one run at `scale` (mm per point), from `show_top` mm up to the ceiling, with the band art."""
    L = D['len'][rid]
    s = 1 / scale
    Y = lambda v: y0 + (v - show_top) * s  # noqa: E731
    X = lambda u: x0 + u * s  # noqa: E731
    c.setLineWidth(0.5)
    c.setStrokeColorRGB(.4, .4, .4)
    c.rect(X(0), Y(show_top), L * s, (CEIL - show_top) * s)
    # fixtures reaching up toward the band (from the built shop)
    c.setFillColorRGB(.88, .88, .88)
    for k, v in AUDIT['runs'][rid]['front'].items():
        if v['u1'] - v['u0'] < 0.9 * L and v['y1'] > show_top and v['d0'] < 600 and not k.startswith('Sakura wall') \
                and not any(t in k.lower() for t in ('shell', 'ceiling', 'beam', 'light', 'floor', 'wainscot')):
            c.rect(X(max(0, v['u0'])), Y(max(show_top, v['y0'])), (min(L, v['u1']) - max(0, v['u0'])) * s,
                   (v['y1'] - max(show_top, v['y0'])) * s, fill=1, stroke=1)
            c.setFillColorRGB(.3, .3, .3)
            c.setFont('Maru', 6)
            c.drawString(X(max(0, v['u0'])) + 2, Y(min(v['y1'], 2460)) - 8, f'{k} (top {v["y1"]})')
            c.setFillColorRGB(.88, .88, .88)
    # stripe, bead, boards (the painted face), cap
    for i, col in enumerate(((215, 38, 61), (240, 138, 36), (255, 207, 63))):
        c.setFillColorRGB(*[x / 255 for x in col])
        h = (STRIPE['y1'] - STRIPE['y0']) / 3
        c.rect(X(0), Y(STRIPE['y1'] - (i + 1) * h), L * s, h * s, fill=1, stroke=0)
    c.setFillColorRGB(*[x / 255 for x in hexrgb(COL['cap'])])
    c.rect(X(0), Y(BEAD['y0']), L * s, (BEAD['y1'] - BEAD['y0']) * s, fill=1, stroke=0)
    c.rect(X(0), Y(CAP['y0']), L * s, (CAP['y1'] - CAP['y0']) * s, fill=1, stroke=0)
    c.drawImage(ImageReader(os.path.join(HERE, f'band-{rid}.png')), X(0), Y(B['y0']), L * s, (B['y1'] - B['y0']) * s)
    if rid == 'back':
        c.setFillColorRGB(.54, .35, .21)
        for x in BEAMS_X:
            u = x - round(RUNS['back']['from'] * 1000)
            if 0 < u < L:
                c.rect(X(u - 70), Y(BEAM_BOTTOM), 140 * s, (CEIL - BEAM_BOTTOM) * s, fill=1, stroke=0)
    # dimensions: heights at the right, board joints below
    c.setStrokeColorRGB(0, 0, .6)
    c.setFillColorRGB(0, 0, .6)
    c.setFont('Maru', 6.5)
    for v in (STRIPE['y0'], BEAD['y0'], B['y0'], B['y1'], CAP['y1'], BEAM_BOTTOM, CEIL):
        c.line(X(L) + 4, Y(v), X(L) + 20, Y(v))
        c.drawString(X(L) + 22, Y(v) - 2, str(v))
    yj = Y(show_top) - 14
    c.line(X(0), yj, X(L), yj)
    for a, b in D['boards'][rid]:
        c.line(X(a), yj - 3, X(a), yj + 3)
        c.drawCentredString(X((a + b) / 2), yj - 10, str(b - a))
    c.line(X(L), yj - 3, X(L), yj + 3)
    c.drawCentredString(X(L / 2), yj - 22, f'run {L} mm, {len(D["boards"][rid])} boards, butt joints on battens')
    c.setFillColorRGB(0, 0, 0)


# sheet 1: key plan, section, schedule
title_block('SK-WB-001', 'Wall band: key plan, section, checks')
c.setFont('Maru', 13)
c.drawString(40, PH - 50, 'Sakura wall band, revision A: key plan (shop floor), section through the band, checks')
s = 1 / 30  # 1:30 plan, roughly (mm to points: *MMPT/30)
k = MMPT / 30
px0, py0 = 60, 480
W0, E0, F0, P0 = [round(SHELL[n] * 1000) for n in ('westX', 'eastX', 'floorFront', 'partitionZ')]
PX = lambda x: px0 + (x - W0) * k * 0.36  # noqa: E731
PY = lambda z: py0 + (F0 - z) * k * 0.36  # noqa: E731
c.setLineWidth(1)
c.rect(PX(W0), PY(F0), (E0 - W0) * k * 0.36, (F0 - P0) * k * 0.36)
c.setStrokeColorRGB(.54, .35, .21)
c.setLineWidth(0.6)
for x in BEAMS_X:
    c.line(PX(x), PY(P0), PX(x), PY(F0))
c.setStrokeColorRGB(.85, .55, .2)
c.setLineWidth(4)
for r in D['d']['runs']:
    a, b = round(r['from'] * 1000), round(r['to'] * 1000)
    at = round(r['at'] * 1000)
    if r['wall'] == 'x':
        c.line(PX(at), PY(a), PX(at), PY(b))
    else:
        c.line(PX(a), PY(at), PX(b), PY(at))
c.setFillColorRGB(0, 0, 0)
c.setFont('Maru', 8)
c.drawString(PX(W0), PY(F0) - 14, 'window (Main Street)')
c.drawString(PX(-600), PY(P0) + 6, 'back wall: name and crests over the cold cabinet')
c.drawString(PX(W0) + 4, PY(400), 'west: over the chiller')
c.drawRightString(PX(E0) - 4, PY(1200), 'east: behind the till')
c.drawString(PX(W0), PY(F0) - 26, 'orange: the three runs; brown: ceiling beams every 1550 (bottom 2820)')
# section
sx0, sy0, sk = 760, 470, MMPT / 5  # 1:5
SX = lambda d_: sx0 + d_ * sk  # noqa: E731
SY = lambda v: sy0 + (v - 2440) * sk  # noqa: E731
c.setStrokeColorRGB(0, 0, 0)
c.setLineWidth(0.8)
c.setFillColorRGB(.92, .9, .86)
c.rect(SX(-60), SY(2440), 60 * sk, (CEIL - 2440) * sk, fill=1)
c.setFillColorRGB(.85, .75, .58)
c.rect(SX(0), SY(STRIPE['y0']), B['batten'] * sk, (B['y1'] - STRIPE['y0']) * sk, fill=1)
c.setFillColorRGB(*[x / 255 for x in hexrgb(COL['board'])])
c.rect(SX(B['batten']), SY(B['y0']), B['thick'] * sk, (B['y1'] - B['y0']) * sk, fill=1)
c.rect(SX(B['batten']), SY(STRIPE['y0']), B['thick'] * sk, (STRIPE['y1'] - STRIPE['y0']) * sk, fill=1)
c.setFillColorRGB(*[x / 255 for x in hexrgb(COL['cap'])])
c.rect(SX(0), SY(BEAD['y0']), (B['face'] + BEAD['project']) * sk, (BEAD['y1'] - BEAD['y0']) * sk, fill=1)
c.rect(SX(0), SY(CAP['y0']), (B['face'] + CAP['project']) * sk, (CAP['y1'] - CAP['y0']) * sk, fill=1)
c.setFillColorRGB(.54, .35, .21)
c.rect(SX(0), SY(BEAM_BOTTOM), 200 * sk, (CEIL - BEAM_BOTTOM) * sk, fill=1)
c.setFillColorRGB(0, 0, 0)
c.setFont('Maru', 7)
for v, lab in ((CEIL, 'ceiling 2980'), (BEAM_BOTTOM, 'beam bottom 2820'), (CAP['y1'], 'cap top 2810 (10 clear)'),
               (B['y1'], 'board top 2780'), (B['y0'], 'board bottom 2560'), (BEAD['y0'], 'bead 2550..2560'),
               (STRIPE['y0'], 'stripe rail 2482..2548'), (D['d']['wallClear'], 'nothing else on the wall above 2470')):
    c.line(SX(B['face'] + CAP['project']) + 6, SY(v), SX(B['face'] + CAP['project']) + 30, SY(v))
    c.drawString(SX(B['face'] + CAP['project']) + 32, SY(v) - 2, lab)
c.drawString(SX(-60), SY(2440) - 14, 'wall | batten 45 | board 15 (face 60, the band\'s plane) | cap 30 x 78 | bead 10 x 68')
c.drawString(SX(-60), SY(2440) - 26, 'SECTION through the band 1:5 (stripe painted on its own rail board, on the same battens)')
# checks
c.setFont('Maru', 8)
yy = 400
c.drawString(40, yy, f'Checks ({sum(ck["ok"] for ck in CHECKS)} of {len(CHECKS)} pass; build_cad.py, from the data and the shop as the game builds it):')
c.setFont('Maru', 5.6)
per = 30
for i, ck in enumerate(CHECKS):
    c.setFillColorRGB(0, .45, 0) if ck['ok'] else c.setFillColorRGB(.75, 0, 0)
    col, row = divmod(i, per)
    c.drawString(40 + col * 385, yy - 10 - 9.5 * row, ('PASS  ' if ck['ok'] else 'FAIL  ') + ck['check'][:70] + (f'  ({ck["detail"][:28]})' if ck['detail'] else ''))
c.setFillColorRGB(0, 0, 0)
c.showPage()

# sheet 2: back wall
title_block('SK-WB-002', 'Back wall elevation')
c.setFont('Maru', 13)
c.drawString(40, PH - 50, 'Back wall, seen from inside: the name and its crests over the cold cabinet, clear of every beam (1:25)')
elevation('back', 40, 380, 25 / MMPT, show_top=1600)
c.drawImage(ImageReader(os.path.join(HERE, 'band-back.png')), 40, 150, PW - 80, (PW - 80) * 220 / D['len']['back'])
c.setFont('Maru', 9)
c.drawString(40, 140, 'The signwritten face, full width (1 px per mm source: band-back.png)')
c.showPage()

# sheet 3: west and east
title_block('SK-WB-003', 'West and east wall elevations')
c.setFont('Maru', 13)
c.drawString(40, PH - 50, 'West wall over the chiller, east wall behind the till, seen from inside (1:20)')
elevation('west', 40, 470, 20 / MMPT, show_top=1600)
elevation('east', 40, 160, 20 / MMPT, show_top=1600)
c.showPage()
c.save()

with open(os.path.join(HERE, 'checks.json'), 'w') as f:
    json.dump(CHECKS, f, indent=1, ensure_ascii=False)
bad = [ck for ck in CHECKS if not ck['ok']]
print(f'{len(CHECKS)} checks, {len(bad)} failed')
for ck in bad:
    print(' FAIL', ck['check'], ck['detail'])
sys.exit(1 if bad else 0)
