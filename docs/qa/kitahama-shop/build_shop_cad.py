"""Johansson Mart, Kitahama: drawing KS-001 revision A (27 October 2026), the corner shop Grandmother Higa keeps.
Drawn from the data in src/world/okinawa/kitahama-shop.js (the shop) and src/world/kitahama-layout.js (the lanes).
Four A3 sheets in one PDF: 1 the site, 2 the floor plan with the fittings, 3 the four elevations, 4 the section and the
interior elevations. Also a DXF of the plan (1:1 mm, a layer per kind) and checks.json (what the drawing was checked for).

    python3 docs/qa/kitahama-shop/build_shop_cad.py     (from johansson-town/; needs node, reportlab, ezdxf)
"""
import json
import os
import subprocess

import ezdxf
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont('Sans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('Sans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('JP', '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'))  # IPA Gothic, embedded
JP = 'JP'

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
D = json.loads(subprocess.run(['node', '--input-type=module', '-e',
    "const s=await import('./src/world/okinawa/kitahama-shop.js');const k=await import('./src/world/kitahama-layout.js');"
    "const pick=o=>JSON.parse(JSON.stringify(o));"
    "console.log(JSON.stringify({...pick(s),K:pick({approach:k.KITAHAMA.approach,lane:k.KITAHAMA.lane,spine:k.KITAHAMA.spine,"
    "plots:k.KITAHAMA.plots.map(p=>({id:p.id,minX:p.minX,maxX:p.maxX,minZ:p.minZ,maxZ:p.maxZ}))})}))"],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1])

B, LIV, DRAW = D['BUILDING'], D['LIVERY'], D['KS_DRAWING']
OU, OV = B['outside']
WALL = B['wall']
WX, WZ = D['WORLD']
INS = D['INSIDE']
FIX = {f['id']: f for f in D['FIXTURES']}
OUT = {f['id']: f for f in D['OUTSIDE']}
OPN = {o['id']: o for o in D['OPENINGS']}
CHECKS = []


def check(name, ok, detail):
    CHECKS.append({'check': name, 'ok': bool(ok), 'detail': detail})


INK, GREY, LIGHT, FILL = HexColor('#1d2326'), HexColor('#8a8f8c'), HexColor('#d9d6cc'), HexColor('#f3f0e7')
GREEN, CREAM = HexColor(LIV['green']), HexColor(LIV['cream'])
PAGE_W, PAGE_H = landscape(A3)
MM = 72 / 25.4                 # points per millimetre on paper


class Sheet:
    """One A3 sheet: a border, a title block, and views placed in millimetres of paper."""

    def __init__(self, c, number, title):
        self.c = c
        c.setStrokeColor(INK)
        c.setLineWidth(.8)
        c.rect(10 * MM, 10 * MM, PAGE_W - 20 * MM, PAGE_H - 20 * MM)
        # title block, bottom right
        x0, y0, w, h = PAGE_W - 190 * MM, 10 * MM, 180 * MM, 34 * MM
        c.rect(x0, y0, w, h)
        c.line(x0, y0 + 12 * MM, x0 + w, y0 + 12 * MM)
        c.setFillColor(GREEN)
        c.rect(x0, y0 + h - 9 * MM, w, 9 * MM, stroke=0, fill=1)
        c.setFillColor(HexColor('#ffffff'))
        c.setFont('Sans-Bold', 11)
        c.drawString(x0 + 3 * MM, y0 + h - 6.3 * MM, 'JOHANSSON MART  ·  KITAHAMA')
        c.setFillColor(INK)
        c.setFont('Sans-Bold', 10)
        c.drawString(x0 + 3 * MM, y0 + 17 * MM, title)
        c.setFont('Sans', 7.5)
        c.drawString(x0 + 3 * MM, y0 + 13.5 * MM, f"Drawn from src/world/okinawa/kitahama-shop.js. Dimensions in {DRAW['units']}.")
        c.drawString(x0 + 3 * MM, y0 + 7 * MM, f"Drawing {DRAW['number']}-{number}   Rev {DRAW['revision']}   {DRAW['date']}")
        c.drawString(x0 + 3 * MM, y0 + 3 * MM, f"Scale {DRAW['scale']} at A3.   Johansson World, Minato Machi.")
        c.drawRightString(x0 + w - 3 * MM, y0 + 3 * MM, f"Sheet {number} of 4")

    def view(self, ox, oy, scale, title=None, title_at=None):
        """A view whose model metres map to paper: (ox, oy) paper mm of the model origin; scale 50 means 1:50."""
        return View(self.c, ox, oy, scale, title, title_at)


class View:
    def __init__(self, c, ox, oy, scale, title, title_at=None):
        self.c, self.ox, self.oy, self.k = c, ox * MM, oy * MM, 1000 / scale * MM
        if title:
            c.setFont('Sans-Bold', 9)
            c.setFillColor(INK)
            c.drawString(self.ox, self.oy + title_at * self.k if title_at is not None else self.oy - 12 * MM, title)

    def P(self, x, y):
        return self.ox + x * self.k, self.oy + y * self.k

    def rect(self, x0, y0, x1, y1, stroke=INK, fill=None, lw=.5, dash=None):
        c = self.c
        c.setLineWidth(lw)
        if stroke:
            c.setStrokeColor(stroke)
        c.setDash(list(dash)) if dash else c.setDash()
        if fill is not None:
            c.setFillColor(fill)
        a, b = self.P(min(x0, x1), min(y0, y1))
        c.rect(a, b, abs(x1 - x0) * self.k, abs(y1 - y0) * self.k, stroke=1 if stroke else 0, fill=1 if fill is not None else 0)
        c.setDash()

    def line(self, x0, y0, x1, y1, lw=.5, stroke=INK, dash=None):
        c = self.c
        c.setLineWidth(lw)
        c.setStrokeColor(stroke)
        c.setDash(list(dash)) if dash else c.setDash()
        c.line(*self.P(x0, y0), *self.P(x1, y1))
        c.setDash()

    def text(self, x, y, s, size=6.5, bold=False, anchor='middle', color=INK, angle=0, font=None):
        c = self.c
        c.saveState()
        c.setFillColor(color)
        c.setFont(font or ('Sans-Bold' if bold else 'Sans'), size)
        a, b = self.P(x, y)
        c.translate(a, b)
        c.rotate(angle)
        {'middle': c.drawCentredString, 'start': c.drawString, 'end': c.drawRightString}[anchor](0, -size / 3, s)
        c.restoreState()

    def dim(self, x0, y0, x1, y1, off, label=None, size=6):
        """A dimension line from (x0,y0) to (x1,y1), offset `off` metres to its left, with ticks and the length in mm."""
        import math
        L = math.hypot(x1 - x0, y1 - y0)
        nx, ny = -(y1 - y0) / L, (x1 - x0) / L
        a0, b0, a1, b1 = x0 + nx * off, y0 + ny * off, x1 + nx * off, y1 + ny * off
        self.line(x0, y0, a0 + nx * .08, b0 + ny * .08, lw=.25, stroke=GREY)
        self.line(x1, y1, a1 + nx * .08, b1 + ny * .08, lw=.25, stroke=GREY)
        self.line(a0, b0, a1, b1, lw=.35)
        for a, b in ((a0, b0), (a1, b1)):
            self.line(a - .06, b - .06, a + .06, b + .06, lw=.6)
        ang = math.degrees(math.atan2(y1 - y0, x1 - x0))
        if ang > 90 or ang <= -90:
            ang += 180
        self.text((a0 + a1) / 2 + nx * .12, (b0 + b1) / 2 + ny * .12, label or f'{round(L * 1000):,}'.replace(',', ' '),
                  size=size, angle=ang)


def mm_(m):
    return f'{round(m * 1000):,}'.replace(',', ' ')


# ------------------------------------------------------------------ the plan of the shop, shared by sheets 1 and 2
def wall_runs():
    """The outside walls as rectangles, with the openings cut out: (u0, v0, u1, v1)."""
    runs = []

    def wall(name, a, b):
        cuts = sorted((o['from'], o['to']) for o in D['OPENINGS'] if o['wall'] == name)
        s = a
        for f, t in cuts:
            if f > s:
                runs.append((name, s, f))
            s = t
        if s < b:
            runs.append((name, s, b))

    wall('south', 0, OU)
    wall('north', 0, OU)
    wall('east', 0, OV)
    wall('west', 0, OV)
    out = []
    for name, a, b in runs:
        if name == 'south':
            out.append((a, 0, b, WALL))
        elif name == 'north':
            out.append((a, OV - WALL, b, OV))
        elif name == 'east':
            out.append((OU - WALL, a, OU, b))
        else:
            out.append((0, a, WALL, b))
    return out


def draw_shop_plan(v, detail=True):
    for r in wall_runs():
        v.rect(*r, stroke=INK, fill=INK, lw=.3)
    for o in D['OPENINGS']:
        a, b = o['from'], o['to']
        if o['wall'] == 'south':
            v.rect(a, 0, b, WALL, stroke=INK, fill=HexColor('#ffffff'), lw=.3)
            v.line(a, WALL / 2, b, WALL / 2, lw=.3)
        elif o['wall'] == 'east':
            v.rect(OU - WALL, a, OU, b, stroke=INK, fill=HexColor('#ffffff'), lw=.3)
            v.line(OU - WALL / 2, a, OU - WALL / 2, b, lw=.3)
    # the two leaves of the sliding door, drawn open past each other on the inside
    d1 = OPN['D1']
    mid = (d1['from'] + d1['to']) / 2
    v.line(d1['from'], WALL + .04, mid + .05, WALL + .04, lw=.9)
    v.line(mid - .05, WALL + .09, d1['to'], WALL + .09, lw=.9)
    # the delivery door swings out onto the approach
    d2 = OPN['D2']
    v.line(OU, d2['from'], OU + (d2['to'] - d2['from']), d2['from'], lw=.4)
    arc_pts = 10
    import math
    r = d2['to'] - d2['from']
    for i in range(arc_pts):
        t0, t1 = i / arc_pts * math.pi / 2, (i + 1) / arc_pts * math.pi / 2
        v.line(OU + r * math.cos(t0), d2['from'] + r * math.sin(t0), OU + r * math.cos(t1), d2['from'] + r * math.sin(t1),
               lw=.25, stroke=GREY, dash=(1, 1))
    for p in D['PARTITIONS']:
        v.rect(p['min'][0], p['min'][1], p['max'][0], p['max'][1], stroke=INK, fill=GREY, lw=.3)
    # the staff door D3 in P2, swinging into the stockroom
    d3 = D['INNER_DOORS'][0]
    p2 = [p for p in D['PARTITIONS'] if p['id'] == 'P2'][0]
    v.rect(d3['from'], p2['min'][1], d3['to'], p2['max'][1], stroke=INK, fill=HexColor('#ffffff'), lw=.3)
    r = d3['to'] - d3['from']
    v.line(d3['from'], p2['max'][1], d3['from'], p2['max'][1] + r, lw=.4)
    for i in range(arc_pts):
        t0, t1 = i / arc_pts * math.pi / 2, (i + 1) / arc_pts * math.pi / 2
        v.line(d3['from'] + r * math.sin(t0), p2['max'][1] + r * math.cos(t0),
               d3['from'] + r * math.sin(t1), p2['max'][1] + r * math.cos(t1), lw=.25, stroke=GREY, dash=(1, 1))
    if not detail:
        return
    for f in D['FIXTURES']:
        (u0, v0, _), (u1, v1, _) = f['min'], f['max']
        v.rect(u0, v0, u1, v1, stroke=INK, fill=FILL, lw=.4)
        v.text((u0 + u1) / 2, (v0 + v1) / 2, f['id'], size=6.5, bold=True)
    for f in D['OUTSIDE']:
        if f['id'] in ('X4', 'X6', 'X8'):
            continue
        (u0, v0, _), (u1, v1, _) = f['min'], f['max']
        dash = (2, 1.5) if f['id'] == 'X5' else None
        v.rect(u0, v0, u1, v1, stroke=GREEN if f['id'] == 'X5' else INK, fill=None if f['id'] == 'X5' else HexColor('#ffffff'),
               lw=.4, dash=dash)
        v.text((u0 + u1) / 2, (v0 + v1) / 2 if f['id'] != 'X5' else -.88, f['id'], size=6, bold=True,
               color=GREEN if f['id'] == 'X5' else INK)


# ------------------------------------------------------------------ sheet 1: the site
def sheet_site(c):
    s = Sheet(c, 1, 'Site plan: the corner of the cross lane and the approach')
    K = D['K']
    # model = world metres; show x 14..48, z 54..78 at 1:200
    v = s.view(30, 95, 200, None)
    X0, Z0 = 12, 52

    def W(x, z):
        return x - X0, z - Z0

    def wrect(x0, z0, x1, z1, **k):
        v.rect(*W(x0, z0), *W(x1, z1), **k)

    for key, label in (('lane', 'CROSS LANE'), ('spine', 'SPINE'), ('approach', 'APPROACH')):
        r = K[key]
        x0, x1 = max(r['minX'], X0), min(r['maxX'], 50)
        z0, z1 = max(r['minZ'], Z0), min(r['maxZ'], 80)
        wrect(x0, z0, x1, z1, stroke=GREY, fill=HexColor('#e9e6dc'), lw=.3)
        if key == 'approach':
            v.text(*W((x0 + x1) / 2, 50 - 0 + 15), label, size=7, bold=True, color=GREY, angle=90)
        else:
            v.text(*W(20, (z0 + z1) / 2), label, size=7, bold=True, color=GREY)
    for p in K['plots']:
        if p['maxX'] < X0 or p['minZ'] > 80 or p['maxZ'] < Z0:
            continue
        wrect(max(p['minX'], X0), max(p['minZ'], Z0), p['maxX'], min(p['maxZ'], 80), stroke=GREY, lw=.3)
        v.text(*W((max(p['minX'], X0) + p['maxX']) / 2, (max(p['minZ'], Z0) + min(p['maxZ'], 80)) / 2), p['id'], size=6, color=GREY)
    # the north block and its lane garden (kept)
    wrect(16, 62, 42, 72, stroke=INK, lw=.4, dash=(3, 2))
    v.text(*W(22.5, 71.3), 'north block (lots.js)', size=6, color=GREY)
    for x0, x1, z0, z1, lab in ((18.4, 23.4, 62.8, 64.0, 'herbs'), (24.6, 27.8, 62.8, 64.0, 'negi (shortened)'),
                                 (18.4, 23.4, 65.4, 66.6, 'greens'), (24.6, 29.6, 65.4, 66.6, 'sunflowers'),
                                 (27.4, 29.6, 69.7, 71.0, 'shed')):
        wrect(x0, z0, x1, z1, stroke=GREY, fill=HexColor('#e2ead9'), lw=.3)
        v.text(*W((x0 + x1) / 2, (z0 + z1) / 2), lab, size=5, color=GREY)
    # the parking re-laid: three bays, Mac's to the west
    wrect(28.0, 62.2, 35.4, 67.55, stroke=GREY, fill=HexColor('#efede6'), lw=.3)
    for i, (who) in enumerate(('Mac', 'Kōji', 'Nhung')):
        x0 = 28.0 + i * (7.4 / 3)
        wrect(x0 + .1, 62.4, x0 + 7.4 / 3 - .1, 67.3, stroke=GREY, lw=.25, dash=(2, 1))
        v.text(*W(x0 + 7.4 / 6, 64.8), f'bay {i + 1}: {who}', size=5.5, color=GREY)
    wrect(28.0, 67.7, 35.4, 68.3, stroke=GREY, fill=HexColor('#cfdcc4'), lw=.3)
    wrect(29.8, 69.55, 35.4, 70.55, stroke=GREY, fill=HexColor('#cfdcc4'), lw=.3)
    v.text(*W(32.6, 70.05), 'gōyā curtain', size=5, color=GREY)
    check('the shortened gōyā curtain clears the garden shed', 29.8 >= 29.6, 'curtain from x 29.8, shed to x 29.6')
    # the shop
    shop = s.view(30 + (WX - X0) * 5, 95 + (WZ - Z0) * 5, 200)
    draw_shop_plan(shop, detail=False)
    shop.rect(0, 0, OU, OV, stroke=INK, lw=.9)
    shop.text(OU / 2, OV / 2, 'JOHANSSON MART', size=6.5, bold=True, color=GREEN)
    shop.dim(0, OV, OU, OV, .9)
    shop.dim(OU, 0, OU, OV, -.0 + .9)
    v.dim(*W(WX + OU, WZ), *W(42, WZ), -1.4, size=5)
    v.dim(*W(WX, 61.5), *W(WX, WZ), 1.6, size=5)
    # north arrow
    nx, ny = 380, 230
    c.setStrokeColor(INK)
    c.setFillColor(INK)
    p = c.beginPath()
    p.moveTo(nx * MM, ny * MM)
    p.lineTo((nx - 4) * MM, (ny - 12) * MM)
    p.lineTo(nx * MM, (ny - 9) * MM)
    p.close()
    c.drawPath(p, fill=1)
    c.setFont('Sans-Bold', 10)
    c.drawCentredString(nx * MM, (ny + 3) * MM, 'N')
    # notes
    y = 230
    c.setFont('Sans-Bold', 9)
    c.drawString(250 * MM, y * MM, 'What changes on the site')
    c.setFont(JP, 7)
    y -= 6
    for ch in D['SITE_CHANGES']:
        for line in wrap('• ' + ch['what'], 95):
            c.drawString(250 * MM, y * MM, line)
            y -= 4
        c.setFillColor(GREY)
        c.setFont(JP, 6.5)
        for line in wrap('   touches: ' + ch['touches'], 100):
            c.drawString(250 * MM, y * MM, line)
            y -= 4
        c.setFillColor(INK)
        c.setFont(JP, 7)
        y -= 2
    c.setFont('Sans', 7)
    c.drawString(30 * MM, 30 * MM, f"Shop's south-west corner at island x {WX}, z {WZ} (lots.js coordinates). Site 1:200.")
    check('the shop stands inside the north block', 16 <= WX and WX + OU <= 42 and 62 <= WZ and WZ + OV <= 72,
          f'shop x {WX}–{WX + OU}, z {WZ}–{WZ + OV}; block x 16–42, z 62–72')
    check('a clear strip between the shop and the approach', 42 - (WX + OU) >= .3, f'{mm_(42 - (WX + OU))} mm to the road edge')
    check('the forecourt to the cross lane takes the vending machines and a way past', WZ - K['lane']['maxZ'] - .8 >= .8,
          f"{mm_(WZ - K['lane']['maxZ'])} mm apron; machines 750 mm deep leave {mm_(WZ - K['lane']['maxZ'] - .75)} mm")
    check('the re-laid bays are at least 2.4 m wide', 7.4 / 3 >= 2.4, f'{mm_(7.4 / 3)} mm a bay')
    check('the re-laid parking clears the shop', 35.4 < WX, f'parking ends at x 35.4, the shop starts at x {WX}')
    c.showPage()


def wrap(s, n):
    words, out, line = s.split(), [], ''
    for w in words:
        if len(line) + len(w) + 1 > n:
            out.append(line)
            line = w
        else:
            line = (line + ' ' + w).strip()
    if line:
        out.append(line)
    return out


# ------------------------------------------------------------------ sheet 2: the floor plan
def sheet_plan(c):
    s = Sheet(c, 2, 'Floor plan with the fittings')
    v = s.view(45, 80, 50, 'GROUND FLOOR  1:50', title_at=OV + 1.5)
    draw_shop_plan(v)
    # overall and opening dimensions
    v.dim(0, 0, OU, 0, -2.0)
    v.dim(0, 0, 0, OV, 1.2)
    for o in D['OPENINGS']:
        if o['wall'] == 'south':
            v.dim(o['from'], 0, o['to'], 0, -1.45, size=5.5)
        if o['wall'] == 'east':
            v.dim(OU, o['from'], OU, o['to'], -1.15, size=5.5)
    v.dim(0, 0, OPN['W1']['from'], 0, -1.45, size=5.5)
    # aisles
    A = []
    f = FIX

    def aisle(name, a, b, along, x0, y0, x1, y1, need=.9):
        w = b - a
        A.append((name, w, need))
        if along == 'u':
            v.dim(a, y0, b, y0, 0, size=5)
        else:
            v.dim(x0, a, x0, b, 0, size=5)

    aisle('west aisle (chiller to island)', f['F5']['max'][0], f['F6']['min'][0], 'u', 0, 3.1, 0, 0)
    aisle('the counter’s front (island to counter)', f['F6']['max'][0], f['F1']['min'][0], 'u', 0, 2.2, 0, 0, need=1.2)
    aisle('the back aisle (island to cooler)', f['F6']['max'][1], f['F3']['min'][1], 'v', 2.35, 0, 0, 0)
    aisle('the keeper’s aisle (counter to back shelf)', f['F1']['max'][0], f['F2']['min'][0], 'u', 0, 3.4, 0, 0, need=.7)
    aisle('the window aisle (magazines to island)', f['F7']['max'][1], f['F6']['min'][1], 'v', 2.6, 0, 0, 0)
    for name, w, need in A:
        check(f'aisle: {name} at least {mm_(need)}', w >= need - 1e-6, f'{mm_(w)} mm')
    v.text(1.4, 5.05, 'SHOP FLOOR', size=8, bold=True, color=GREY)
    v.text(5.25, 5.25, 'STOCKROOM', size=6, bold=True, color=GREY)
    v.text(OU + .9, (OPN['D2']['from'] + OPN['D2']['to']) / 2, 'van', size=6, color=GREY, angle=90)
    v.text(3.0, -2.75, 'CROSS LANE (south)', size=7, color=GREY)
    v.text(OU + 1.9, 3.0, 'APPROACH (east)', size=7, color=GREY, angle=90)
    # the section line A-A, looking north, through the island and the counter
    v.line(-.6, 2.7, OU + .6, 2.7, lw=.6, dash=(6, 2, 1, 2))
    for xx in (-.6, OU + .6):
        v.text(xx, 2.95, 'A', size=8, bold=True)
    # schedule
    y = 270
    c.setFont('Sans-Bold', 9)
    c.drawString(250 * MM, y * MM, 'Fittings (inside) and outside')
    y -= 6
    c.setFont('Sans', 6.6)
    for f in D['FIXTURES'] + [o for o in D['OUTSIDE']]:
        (u0, v0, h0), (u1, v1, h1) = f['min'], f['max']
        head = f"{f['id']}  {f['what']}"
        size = f"{mm_(u1 - u0)} × {mm_(v1 - v0)} × {mm_(h1 - h0)} h"
        c.setFillColor(INK)
        c.drawString(250 * MM, y * MM, head[:88])
        c.drawRightString(410 * MM, y * MM, size)
        y -= 3.6
        c.setFillColor(GREY)
        for line in wrap(f['why'], 108)[:2]:
            c.drawString(254 * MM, y * MM, line)
            y -= 3.3
        y -= .8
    c.setFillColor(INK)
    rooms = {r['id']: r for r in D['ROOMS']}
    sales = (rooms['sales']['zone'][2] - rooms['sales']['zone'][0]) * (rooms['sales']['zone'][3] - rooms['sales']['zone'][1]) + \
            (rooms['sales']['zoneB'][2] - rooms['sales']['zoneB'][0]) * (rooms['sales']['zoneB'][3] - rooms['sales']['zoneB'][1])
    st = rooms['stock']['zone']
    stock = (st[2] - st[0]) * (st[3] - st[1])
    c.setFont('Sans', 7)
    c.drawString(45 * MM, 32 * MM, f"Gross {OU * OV:.1f} m²; inside the walls {(INS['u1'] - INS['u0']) * (INS['v1'] - INS['v0']):.1f} m²; "
                                   f"shop floor {sales:.1f} m², stockroom {stock:.1f} m² (both before the partitions).")
    # every fitting stands inside the walls and clear of the others
    ov = lambda p, q: p['min'][0] < q['max'][0] - 1e-6 and q['min'][0] < p['max'][0] - 1e-6 and p['min'][1] < q['max'][1] - 1e-6 and q['min'][1] < p['max'][1] - 1e-6
    fx = D['FIXTURES']
    inside = all(INS['u0'] - 1e-6 <= f['min'][0] and f['max'][0] <= INS['u1'] + 1e-6 and INS['v0'] - 1e-6 <= f['min'][1] and f['max'][1] <= INS['v1'] + 1e-6 for f in fx)
    check('every fitting stands inside the walls', inside, f'{len(fx)} fittings')
    clashes = [f"{a['id']}/{b['id']}" for i, a in enumerate(fx) for b in fx[i + 1:] if ov(a, b)]
    clashes += [f"{a['id']}/{p['id']}" for a in fx for p in D['PARTITIONS'] if ov(a, p)]
    check('no fitting overlaps another or a partition', not clashes, ', '.join(clashes) or 'none')
    d1 = OPN['D1']
    check('the door’s clear width takes a wheelchair (at least 900 mm)', d1['to'] - d1['from'] - .1 >= .9,
          f"{mm_(d1['to'] - d1['from'])} mm opening, two leaves")
    check('nothing stands in the door’s way inside', all(not (f['min'][1] < WALL + .9 and f['max'][0] > d1['from'] and f['min'][0] < d1['to']) for f in fx),
          '900 mm clear inside the door')
    # the doors' ways: a clear floor inside each door, and the staff door's swing clear of the fittings
    d2 = OPN['D2']
    inside_d2 = {'min': [OU - WALL - .9, d2['from'], 0], 'max': [OU - WALL, d2['to'], 0]}
    check('the delivery door has 900 mm clear inside it', not [f['id'] for f in fx if ov(f, inside_d2)],
          ', '.join(f['id'] for f in fx if ov(f, inside_d2)) or 'clear')
    d3 = D['INNER_DOORS'][0]
    p2 = [p for p in D['PARTITIONS'] if p['id'] == 'P2'][0]
    swing = {'min': [d3['from'], p2['max'][1], 0], 'max': [d3['to'], p2['max'][1] + (d3['to'] - d3['from']), 0]}
    check('the staff door swings clear of the stockroom fittings', not [f['id'] for f in fx if ov(f, swing)],
          ', '.join(f['id'] for f in fx if ov(f, swing)) or 'clear')
    c.showPage()


# ------------------------------------------------------------------ sheet 3: the elevations
def elevation(v, face):
    """An outside elevation: 'south' (front), 'east' (approach), 'north', 'west'. x along the face as seen."""
    length = OU if face in ('south', 'north') else OV
    # Drawn as the player sees each face in World. The game's frame (x east, z north, y up) is mirrored against a printed
    # map, so from the lane the door is on the left, and from the approach the lane end is on the right
    # (checked in renders of the Blender models, tools/blender/build-kitahama-shop.py).
    flip = face in ('south', 'east')
    X = (lambda a: length - a) if flip else (lambda a: a)
    fl, ce, rt, pt = B['floor'], B['ceiling'], B['roofTop'], B['parapetTop']
    # ground
    v.line(-1.2, 0, length + 1.2, 0, lw=1.2)
    # walls and parapet
    v.rect(0, 0, length, pt, stroke=INK, fill=CREAM, lw=.7)
    v.rect(0, 0, length, B['plinth'], stroke=INK, fill=HexColor(LIV['plinth']), lw=.4)
    v.rect(-.03, pt - B['parapetCap'], length + .03, pt, stroke=INK, fill=HexColor('#b7b8b2'), lw=.4)
    v.line(0, rt, length, rt, lw=.25, stroke=GREY, dash=(2, 2))
    v.text(length + .15, rt, 'roof', size=5, anchor='start', color=GREY)
    # the signboard on the south and east faces
    if face in ('south', 'east'):
        sb = OUT['X6']
        h0, h1 = sb['min'][2], sb['max'][2]
        lo, hi = (-.15, length + .02) if face == 'south' else (-.02, length)
        v.rect(lo, h0, hi, h1, stroke=INK, fill=GREEN, lw=.5)
        v.rect(lo, h0, hi, h0 + .05, stroke=None, fill=HexColor('#ffffff'))
        v.text(length / 2, h0 + .44, 'JOHANSSON MART', size=11, bold=True, color=HexColor('#ffffff'))
        v.text(length / 2, h0 + .17, 'ヨハンソンマート　北浜店', size=7, color=HexColor('#ffffff'), font=JP)
    for o in D['OPENINGS']:
        if o['wall'] != face:
            continue
        a, b = sorted((X(o['from']), X(o['to'])))
        door = o['id'].startswith('D')
        v.rect(a, o['sill'], b, o['head'], stroke=INK, fill=HexColor('#dfe7ea') if not o['id'] == 'D2' else HexColor('#9aa0a6'), lw=.6)
        if o['id'] == 'D1':
            v.line((a + b) / 2, o['sill'], (a + b) / 2, o['head'], lw=.5)
            v.rect(a, o['head'], b, o['head'] + .12, stroke=INK, fill=HexColor(LIV['frames']), lw=.4)
        if o['id'] == 'W1':
            for k in range(1, 3):
                xx = a + (b - a) * k / 3
                v.line(xx, o['sill'], xx, o['head'], lw=.4)
        v.text((a + b) / 2, o['sill'] - .12 if o['sill'] > .3 else o['head'] + .2, o['id'], size=6, bold=True)
        v.dim(a, 0, a, o['head'], .35 if not door else -.0 + .35, size=5) if o['id'] in ('D1', 'W2') else None
    if face == 'south':
        # the outside items flip with the face, as the openings do
        span = lambda it: sorted((X(it['min'][0]), X(it['max'][0])))
        a0, a1 = span(OUT['X5'])
        v.rect(a0, OUT['X5']['min'][2], a1, OUT['X5']['max'][2], stroke=INK, fill=GREEN, lw=.4)
        a0, a1 = span(OUT['X1'])
        v.rect(a0, 0, a1, OUT['X1']['max'][2], stroke=INK, fill=HexColor('#ffffff'), lw=.5)
        v.line((a0 + a1) / 2, 0, (a0 + a1) / 2, OUT['X1']['max'][2], lw=.4)
        v.text((a0 + a1) / 2, OUT['X1']['max'][2] - .25, 'X1 drinks machines', size=5.5)
        a0, a1 = span(OUT['X2'])
        v.rect(a0, 0, a1, OUT['X2']['max'][2], stroke=INK, fill=HexColor('#c9ccc8'), lw=.4)
        a0, a1 = span(OUT['X7'])
        v.line(a0, 0, (a0 + a1) / 2, OUT['X7']['max'][2], lw=.6)
        v.line(a1, 0, (a0 + a1) / 2, OUT['X7']['max'][2], lw=.6)
    if face in ('north', 'east'):
        tk = OUT['X4']
        a, b = sorted((X(tk['min'][0] if face == 'north' else tk['min'][1]), X(tk['max'][0] if face == 'north' else tk['max'][1])))
        # its stand is behind the parapet; the tank shows over it
        v.rect(a, pt, b, tk['max'][2], stroke=INK, fill=HexColor('#d6d9d6'), lw=.5)
        v.text((a + b) / 2, (pt + tk['max'][2]) / 2, 'X4 water tank', size=5.5)
    if face == 'north':
        cu = OUT['X3']
        a, b = sorted((X(cu['min'][0]), X(cu['max'][0])))
        v.rect(a, 0, b, cu['max'][2], stroke=INK, fill=HexColor('#c9ccc8'), lw=.5)
        for k in range(1, 6):
            v.line(a, cu['max'][2] * k / 6, b, cu['max'][2] * k / 6, lw=.25)
        v.text((a + b) / 2, cu['max'][2] + .15, 'X3 condensers behind a louvred screen', size=5.5)
    if face in ('north', 'east'):
        dp = OUT['X8']
        xx = X(OU - .05) if face == 'north' else X(OV - .05)
        v.rect(xx - .04, 0, xx + .04, pt, stroke=INK, fill=HexColor('#9aa0a6'), lw=.3)
    # heights
    v.dim(length, 0, length, pt, -.0 - .55, size=5)
    v.dim(0, 0, length, 0, -.55, size=5)
    v.text(length / 2, -1.05, f'{face.upper()} ELEVATION', size=7.5, bold=True)


def sheet_elevations(c):
    s = Sheet(c, 3, 'The four elevations')
    pos = {'south': (40, 185), 'east': (225, 185), 'north': (40, 70), 'west': (225, 70)}
    for face, (x, y) in pos.items():
        v = s.view(x, y, 50)
        elevation(v, face)
    c.setFont(JP, 7)
    c.drawString(40 * MM, 36 * MM, 'Each face is drawn as the player sees it in World: the game’s frame mirrors a printed map, so from the lane the door is on the left.')
    yy = 30
    for line in wrap(f"Walls: {LIV['walls']}. Fascia: {LIV['fascia']}. Frames: anodised aluminium.", 110):
        c.drawString(40 * MM, yy * MM, line)
        yy -= 4
    sb = OUT['X6']
    check('the signboard clears the door and the canopy', sb['min'][2] >= OPN['D1']['head'] + .12 and sb['min'][2] > OUT['X5']['max'][2],
          f"sign from {mm_(sb['min'][2])}; door head {mm_(OPN['D1']['head'])}, canopy top {mm_(OUT['X5']['max'][2])}")
    check('the signboard stands under the parapet', sb['max'][2] <= B['parapetTop'] - .05,
          f"sign to {mm_(sb['max'][2])}, parapet {mm_(B['parapetTop'])}")
    check('the canopy’s underside clears a head (2.1 m)', OUT['X5']['min'][2] >= 2.1, f"{mm_(OUT['X5']['min'][2])} mm")
    c.showPage()


# ------------------------------------------------------------------ sheet 4: the section and the interior elevations
def sheet_section(c):
    s = Sheet(c, 4, 'Section A–A looking north, and the inside walls')
    v = s.view(40, 175, 50, 'SECTION A–A (at v 2.70), LOOKING NORTH  1:50', title_at=B['parapetTop'] + .5)
    fl, ce, rt, pt = B['floor'], B['ceiling'], B['roofTop'], B['parapetTop']
    v.line(-1, 0, OU + 1, 0, lw=1.2)
    v.rect(0, 0, WALL, pt, stroke=INK, fill=INK)
    v.rect(OU - WALL, 0, OU, pt, stroke=INK, fill=INK)
    v.rect(0, ce, OU, rt, stroke=INK, fill=HexColor('#9aa0a6'), lw=.4)
    v.rect(WALL, 0, OU - WALL, fl, stroke=INK, fill=HexColor('#c9ccc8'), lw=.3)
    # the side window W2 in the east wall, cut
    v.rect(OU - WALL, OPN['W2']['sill'], OU, OPN['W2']['head'], stroke=INK, fill=HexColor('#ffffff'), lw=.3)
    # behind the cut: what faces us on the north side of the line
    # beyond the cut, seen: the stockroom wall, the cooler and the freezer
    for p in D['PARTITIONS']:
        if p['id'] == 'P1':
            v.rect(p['min'][0], fl, p['max'][0], ce, stroke=GREY, fill=HexColor('#d9d6cc'), lw=.3)
    for fid in ('F3', 'F4'):
        f = FIX[fid]
        v.rect(f['min'][0], f['min'][2], f['max'][0], f['max'][2], stroke=GREY, fill=HexColor('#ece9df'), lw=.3)
        v.text((f['min'][0] + f['max'][0]) / 2, f['max'][2] + .12, fid + ' (beyond)', size=5.5, color=GREY)
    f = FIX['F3']
    for k in (1, 2):
        xx = f['min'][0] + (f['max'][0] - f['min'][0]) * k / 3
        v.line(xx, f['min'][2], xx, f['max'][2], lw=.25, stroke=GREY)
    # cut by the line: the chiller, the island, the counter and the shelf behind it
    for fid in ('F5', 'F6', 'F1', 'F2'):
        f = FIX[fid]
        v.rect(f['min'][0], f['min'][2], f['max'][0], f['max'][2], stroke=INK, fill=FILL, lw=.9)
        v.text((f['min'][0] + f['max'][0]) / 2, f['max'][2] + .12, fid, size=6, bold=True)
    for k in range(4):
        xx = .75 + k * 1.45
        v.rect(xx - .3, ce - .06, xx + .3, ce, stroke=INK, fill=HexColor('#ffffff'), lw=.3)
    v.dim(0, fl, 0, ce, .6, size=5.5)
    v.dim(OU, 0, OU, pt, -.6, size=5.5)
    v.text(WALL + .1, -.3, 'shop floor +100 over the apron', size=5, anchor='start', color=GREY)
    v.text(OU / 2, ce - .25, 'fluorescent troffers, four rows', size=5.5, color=GREY)
    check('clear height over the floor at least 2.6 m', ce - fl >= 2.6, f'{mm_(ce - fl)} mm')
    check('the cooler and the stock shelving fit under the ceiling', all(FIX[i]['max'][2] <= ce - .1 for i in ('F3', 'F9', 'F5')),
          'cooler, chiller and shelving 100 mm or more under the ceiling')
    check('the island is low enough for the keeper to see over (under 1.40 m)', FIX['F6']['max'][2] - fl <= 1.40,
          f"{mm_(FIX['F6']['max'][2] - fl)} mm")

    # interior elevations: the west wall (chiller), the north wall (cooler and freezer), the east wall (behind the counter)
    def wall_view(x, y, title, items, length, run):
        w = s.view(x, y, 50, title)
        w.rect(0, 0, length, ce, stroke=INK, lw=.6)
        w.rect(0, 0, length, fl, stroke=None, fill=HexColor('#c9ccc8'))
        for fid in items:
            f = FIX[fid] if fid in FIX else None
            a, b = run(f)
            w.rect(a, f['min'][2], b, f['max'][2], stroke=INK, fill=FILL, lw=.45)
            w.text((a + b) / 2, (f['min'][2] + f['max'][2]) / 2, fid, size=6.5, bold=True)
            w.dim(a, f['max'][2], b, f['max'][2], -.25, size=5)
        return w

    wall_view(215, 175, 'WEST WALL, INSIDE (south on the right)  1:50', ['F5', 'F8'], OV - 2 * WALL, lambda f: (OV - WALL - f['max'][1], OV - WALL - f['min'][1]))
    nw = wall_view(40, 70, 'NORTH WALL, INSIDE (the stockroom on the right)  1:50', ['F3', 'F4', 'F10'], OU - 2 * WALL, lambda f: (f['min'][0] - WALL, f['max'][0] - WALL))
    f = FIX['F3']
    for k in (1, 2):
        xx = f['min'][0] - WALL + (f['max'][0] - f['min'][0]) * k / 3
        nw.line(xx, f['min'][2], xx, f['max'][2], lw=.35)
    p1 = [p for p in D['PARTITIONS'] if p['id'] == 'P1'][0]
    nw.rect(p1['min'][0] - WALL, fl, p1['max'][0] - WALL, ce, stroke=INK, fill=GREY, lw=.3)
    ew = wall_view(160, 70, 'EAST WALL, INSIDE (the stockroom on the right)  1:50', ['F2', 'F9'], OV - 2 * WALL, lambda f: (f['min'][1] - WALL, f['max'][1] - WALL))
    for oid in ('W2', 'D2'):
        o = OPN[oid]
        ew.rect(o['from'] - WALL, o['sill'], o['to'] - WALL, o['head'], stroke=INK, fill=HexColor('#dfe7ea') if oid == 'W2' else HexColor('#9aa0a6'), lw=.4)
        ew.text((o['from'] + o['to']) / 2 - WALL, o['head'] - .2, oid, size=6, bold=True)
    p2 = [p for p in D['PARTITIONS'] if p['id'] == 'P2'][0]
    ew.rect(p2['min'][1] - WALL, fl, p2['max'][1] - WALL, ce, stroke=INK, fill=GREY, lw=.3)
    c.showPage()


# ------------------------------------------------------------------ the DXF of the plan (1:1 mm, world-aligned local)
def dxf():
    doc = ezdxf.new('R2010', setup=True)
    doc.units = ezdxf.units.MM
    msp = doc.modelspace()
    for name, colour in (('KS-WALL', 7), ('KS-OPENING', 4), ('KS-PARTITION', 8), ('KS-FIXTURE', 3), ('KS-OUTSIDE', 1), ('KS-TEXT', 7)):
        doc.layers.add(name, color=colour)

    def poly(x0, y0, x1, y1, layer):
        msp.add_lwpolyline([(x0 * 1000, y0 * 1000), (x1 * 1000, y0 * 1000), (x1 * 1000, y1 * 1000), (x0 * 1000, y1 * 1000)],
                           close=True, dxfattribs={'layer': layer})

    for r in wall_runs():
        poly(*r, 'KS-WALL')
    for o in D['OPENINGS']:
        a, b = o['from'], o['to']
        if o['wall'] == 'south':
            poly(a, 0, b, WALL, 'KS-OPENING')
        elif o['wall'] == 'east':
            poly(OU - WALL, a, OU, b, 'KS-OPENING')
    for p in D['PARTITIONS']:
        poly(p['min'][0], p['min'][1], p['max'][0], p['max'][1], 'KS-PARTITION')
    for f in D['FIXTURES']:
        poly(f['min'][0], f['min'][1], f['max'][0], f['max'][1], 'KS-FIXTURE')
        msp.add_text(f['id'], height=80, dxfattribs={'layer': 'KS-TEXT'}).set_placement(
            ((f['min'][0] + f['max'][0]) / 2 * 1000, (f['min'][1] + f['max'][1]) / 2 * 1000))
    for f in D['OUTSIDE']:
        poly(f['min'][0], f['min'][1], f['max'][0], f['max'][1], 'KS-OUTSIDE')
    doc.saveas(os.path.join(HERE, f"Kitahama-Shop-{DRAW['number']}-Rev-{DRAW['revision']}.dxf"))


def main():
    pdf = os.path.join(HERE, f"Kitahama-Shop-{DRAW['number']}-Rev-{DRAW['revision']}.pdf")
    c = canvas.Canvas(pdf, pagesize=landscape(A3))
    c.setTitle(f"{DRAW['title']} ({DRAW['number']} rev {DRAW['revision']})")
    c.setAuthor('Johansson World')
    sheet_site(c)
    sheet_plan(c)
    sheet_elevations(c)
    sheet_section(c)
    c.save()
    dxf()
    with open(os.path.join(HERE, 'checks.json'), 'w', encoding='utf-8') as fh:
        json.dump({'drawing': DRAW, 'checks': CHECKS, 'passed': sum(c['ok'] for c in CHECKS), 'of': len(CHECKS)}, fh, ensure_ascii=False, indent=1)
    bad = [c for c in CHECKS if not c['ok']]
    print(f"{len(CHECKS) - len(bad)}/{len(CHECKS)} checks passed")
    for b in bad:
        print('FAILED', b['check'], '-', b['detail'])
    raise SystemExit(1 if bad else 0)


if __name__ == '__main__':
    main()
