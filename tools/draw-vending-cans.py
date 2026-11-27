#!/usr/bin/env python3
"""
Draws the beer cans the town's drinks machines sell, in Python (the owner, 27 November 2026: "replace the generic teas
and coffe we need the vending machine to sell beer and you need to use Disney art style and draw them in Python").

Classic hand-drawn animation's appeal, in the town's own designs: each beer has an original mascot with a readable
silhouette, round friendly shapes, a clear line of action, an expressive face and a squash or stretch pose that says
what the beer is for; clean ink lines, flat cel bands (a light, a base and one shadow), a few colours per can and
hand-lettered logos (the letters are drawn here as brush strokes, not set in a font). No copied characters, logos or
lettering. The line-up, who each can is for and why, is in src/commerce/vending-catalogue.js (VENDING_PRODUCTS); the
ids, sizes and pixel sizes below must match its `art` (tests/vending-beer.test.mjs reads the files back).

Each can's print is its body's wrap-around once round the can (the front at the middle of the wrap, the seam at the
back), at the proportions of the printed band the machine's dummy can shows (vending.js sampleCan: 0.86 of the can's
height, pi x its diameter round): 1024 x 518 for a 350 ml can, 1024 x 714 for the 500 ml long can. The can in his hand
(commerce/bought-can.js) maps the middle of the same print, so the mascots are never stretched.

  python3 tools/draw-vending-cans.py            # every can, then the review sheet
  python3 tools/draw-vending-cans.py --only kame-lager

Writes assets/graphics/vending/<id>.webp (what the game loads) and art/vending-cans/review/cans-sheet.jpg (flat and as
cylinders, front, three-quarter and back, and at the size the machine's window shows them). Needs pycairo
(pip install pycairo) and Pillow.
"""
import argparse
import io
import math
import os

import cairo
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'assets', 'graphics', 'vending')
REVIEW = os.path.join(ROOT, 'art', 'vending-cans', 'review')
W = 1024
CANS = {350: dict(diameter=66, height=122), 500: dict(diameter=66, height=168)}
BAND = 0.86   # the printed share of the can's height (vending.js sampleCan)


def wrap_height(ml):
    c = CANS[ml]
    return round(W * BAND * c['height'] / (math.pi * c['diameter']))


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


INK = hexc('#2a1c16')
WHITE = hexc('#fffaf0')


def rgba(ctx, c, a=1.0):
    ctx.set_source_rgba(c[0], c[1], c[2], a)


# ----------------------------------------------------------------------------------------------------------------- #
# Paths
# ----------------------------------------------------------------------------------------------------------------- #

def smooth(ctx, pts, closed=True, t=1.0):
    """A smooth curve through the points (Catmull-Rom as Beziers)."""
    n = len(pts)
    ctx.move_to(*pts[0])
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = pts[(i - 1) % n] if closed or i > 0 else pts[0]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if closed or i + 2 < n else pts[-1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6 * t, p1[1] + (p2[1] - p0[1]) / 6 * t)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6 * t, p2[1] - (p3[1] - p1[1]) / 6 * t)
        ctx.curve_to(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    if closed:
        ctx.close_path()


def ellipse(ctx, cx, cy, rx, ry, rot=0.0):
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.scale(rx, ry)
    ctx.new_sub_path()
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()


def blob(pts, t=1.0):
    return lambda ctx: smooth(ctx, pts, True, t)


def oval(cx, cy, rx, ry, rot=0.0):
    return lambda ctx: ellipse(ctx, cx, cy, rx, ry, rot)


def rot_pts(pts, cx, cy, a):
    c, s = math.cos(a), math.sin(a)
    return [(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for x, y in pts]


# ----------------------------------------------------------------------------------------------------------------- #
# Painting: flat cel bands and an ink line
# ----------------------------------------------------------------------------------------------------------------- #

def part(ctx, shape, fill, shade=None, lw=5.0, light=(-0.7, -0.75), off=14, hi=None, hi_off=None, ink=INK, line=True):
    """A shape filled flat, its shadow band on the side away from the light (the shape less itself moved toward the
    light), an optional light band on the lit side, and its ink line."""
    ctx.save()
    ctx.new_path()
    shape(ctx)
    rgba(ctx, fill)
    ctx.fill()
    if shade is not None or hi is not None:
        ctx.new_path()
        shape(ctx)
        ctx.clip()
        if shade is not None:
            ctx.new_path()
            ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
            ctx.rectangle(-4000, -4000, 9000, 9000)
            ctx.save()
            ctx.translate(light[0] * off, light[1] * off)
            shape(ctx)
            ctx.restore()
            rgba(ctx, shade)
            ctx.fill()
            ctx.set_fill_rule(cairo.FILL_RULE_WINDING)
        if hi is not None:
            d = hi_off or off * 0.8
            ctx.new_path()
            ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
            ctx.rectangle(-4000, -4000, 9000, 9000)
            ctx.save()
            ctx.translate(-light[0] * d, -light[1] * d)
            shape(ctx)
            ctx.restore()
            rgba(ctx, hi)
            ctx.fill()
            ctx.set_fill_rule(cairo.FILL_RULE_WINDING)
    ctx.restore()
    if line:
        ctx.save()
        ctx.new_path()
        shape(ctx)
        rgba(ctx, ink)
        ctx.set_line_width(lw)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.stroke()
        ctx.restore()


def stroke(ctx, pts, lw=4.0, colour=INK, closed=False, t=1.0, a=1.0):
    ctx.save()
    ctx.new_path()
    if len(pts) == 2:
        ctx.move_to(*pts[0])
        ctx.line_to(*pts[1])
    else:
        smooth(ctx, pts, closed, t)
    rgba(ctx, colour, a)
    ctx.set_line_width(lw)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()
    ctx.restore()


def soft(ctx, cx, cy, rx, ry, colour, a=0.5):
    """A soft spot of colour (cheeks), falling off to nothing."""
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(rx, ry)
    g = cairo.RadialGradient(0, 0, 0, 0, 0, 1)
    g.add_color_stop_rgba(0, colour[0], colour[1], colour[2], a)
    g.add_color_stop_rgba(0.6, colour[0], colour[1], colour[2], a * 0.7)
    g.add_color_stop_rgba(1, colour[0], colour[1], colour[2], 0)
    ctx.set_source(g)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()


def eye_open(ctx, cx, cy, rx, ry, look=(0.0, 0.0), rot=0.0, lw=4.0, lid=None, iris=None):
    """An open cartoon eye: the white, a big dark pupil (an iris ring if given), two catch lights; `lid` draws the
    upper lid down to that fraction (a sly or sleepy look)."""
    part(ctx, oval(cx, cy, rx, ry, rot), WHITE, lw=lw)
    px, py = cx + look[0] * rx * 0.35, cy + look[1] * ry * 0.3
    ctx.save()
    ctx.new_path()
    ellipse(ctx, cx, cy, rx, ry, rot)
    ctx.clip()
    if iris:
        part(ctx, oval(px, py, rx * 0.66, ry * 0.7), iris, line=False)
    part(ctx, oval(px, py, rx * 0.5, ry * 0.56), INK, line=False)
    part(ctx, oval(px - rx * 0.2, py - ry * 0.26, rx * 0.2, ry * 0.18), WHITE, line=False)
    part(ctx, oval(px + rx * 0.2, py + ry * 0.2, rx * 0.08, ry * 0.07), WHITE, line=False)
    if lid:
        ctx.new_path()
        ctx.rectangle(cx - rx * 2, cy - ry * 2, rx * 4, ry * (1.2 + lid * 1.8) - ry * 0.4)
        rgba(ctx, lid_colour(ctx))
        ctx.fill()
    ctx.restore()
    if lid:
        y = cy - ry + ry * 2 * lid - ry * 0.2
        stroke(ctx, [(cx - rx * 1.05, y + ry * 0.12), (cx, y - ry * 0.06), (cx + rx * 1.05, y + ry * 0.12)], lw=lw + 1)
    else:
        ctx.save()
        ctx.new_path()
        ellipse(ctx, cx, cy, rx, ry, rot)
        rgba(ctx, INK)
        ctx.set_line_width(lw)
        ctx.stroke()
        ctx.restore()


_LID = [INK]


def lid_colour(ctx):
    return _LID[0]


def eye_happy(ctx, cx, cy, w, h, lw=5.0, lash=False):
    """A closed, smiling eye (an arc bowed up: the bliss of a long day done)."""
    stroke(ctx, [(cx - w, cy + h * 0.35), (cx - w * 0.5, cy - h * 0.55), (cx + w * 0.5, cy - h * 0.55), (cx + w, cy + h * 0.35)], lw=lw)
    if lash:
        stroke(ctx, [(cx + w * 0.92, cy + h * 0.2), (cx + w * 1.25, cy - h * 0.05)], lw=lw * 0.7)


# ----------------------------------------------------------------------------------------------------------------- #
# Hand lettering: each letter is a few brush strokes (cap height 1, y down, the baseline at 1), outlined in ink and
# merged with its neighbours, as a sign writer's cartoon title is
# ----------------------------------------------------------------------------------------------------------------- #

def _K(c):
    c.move_to(0.14, 0.0); c.line_to(0.14, 1.0)
    c.move_to(0.8, 0.02); c.curve_to(0.6, 0.2, 0.36, 0.46, 0.18, 0.58)
    c.move_to(0.38, 0.42); c.curve_to(0.56, 0.62, 0.7, 0.82, 0.84, 1.0)


def _A(c):
    c.move_to(0.06, 1.0); c.curve_to(0.18, 0.62, 0.3, 0.22, 0.4, 0.06)
    c.curve_to(0.45, -0.02, 0.55, -0.02, 0.6, 0.06)
    c.curve_to(0.7, 0.22, 0.82, 0.62, 0.92, 1.0)
    c.move_to(0.24, 0.66); c.line_to(0.74, 0.66)


def _M(c):
    c.move_to(0.08, 1.0); c.curve_to(0.08, 0.6, 0.1, 0.3, 0.14, 0.04)
    c.line_to(0.52, 0.62); c.line_to(0.9, 0.04)
    c.curve_to(0.94, 0.3, 0.96, 0.6, 0.96, 1.0)


def _E(c):
    c.move_to(0.8, 0.02); c.line_to(0.14, 0.0); c.line_to(0.14, 1.0); c.line_to(0.82, 0.98)
    c.move_to(0.14, 0.5); c.line_to(0.66, 0.48)


def _J(c):
    c.move_to(0.36, 0.02); c.line_to(0.86, 0.02)
    c.move_to(0.74, 0.02); c.line_to(0.74, 0.62)
    c.curve_to(0.74, 1.06, 0.2, 1.1, 0.08, 0.72)


def _U(c):
    c.move_to(0.12, 0.0); c.line_to(0.12, 0.58)
    c.curve_to(0.12, 1.1, 0.88, 1.1, 0.88, 0.58); c.line_to(0.88, 0.0)


def _G(c):
    c.save(); c.translate(0.5, 0.5); c.scale(0.44, 0.5)
    c.new_sub_path(); c.arc_negative(0, 0, 1, -0.55, 0.42)
    c.restore()
    c.line_to(0.94, 0.56); c.line_to(0.58, 0.56)


def _O(c):
    c.save(); c.translate(0.5, 0.5); c.scale(0.44, 0.5)
    c.new_sub_path(); c.arc(0, 0, 1, 0, 2 * math.pi)
    c.restore()


def _N(c):
    c.move_to(0.12, 1.0); c.line_to(0.12, 0.0); c.line_to(0.86, 1.0); c.line_to(0.86, 0.0)


def _T(c):
    c.move_to(0.02, 0.03); c.curve_to(0.3, -0.02, 0.6, -0.02, 0.88, 0.03)
    c.move_to(0.45, 0.02); c.line_to(0.45, 1.0)


GLYPHS = {'K': (_K, 0.9), 'A': (_A, 0.98), 'M': (_M, 1.04), 'E': (_E, 0.88), 'J': (_J, 0.92), 'U': (_U, 1.0),
          'G': (_G, 1.02), 'O': (_O, 1.0), 'N': (_N, 0.98), 'T': (_T, 0.9)}


def word_layout(word, cx, base, size, arc=0.0, bounce=None, scales=None, track=0.1, tilt=None):
    """Where each letter goes: centred on cx, its baseline on an arc through (cx, base) bowed up by `arc` px over the
    word; each letter its own size (scales), a hop (bounce, px) and a tilt (radians) on top of the arc's own turn."""
    n = len(word)
    scales = scales or [1.0] * n
    bounce = bounce or [0.0] * n
    tilt = tilt or [0.0] * n
    adv = [GLYPHS[ch][1] * size * s for ch, s in zip(word, scales)]
    total = sum(adv) + track * size * (n - 1)
    x = cx - total / 2
    out = []
    for i, ch in enumerate(word):
        mid = x + adv[i] / 2
        u = (mid - cx) / (total / 2) if total else 0
        y = base - arc * (1 - u * u)
        turn = -math.atan(2 * arc * u / (total / 2)) * 0.0 + u * arc / max(total, 1) * 1.6
        out.append((ch, x, y + bounce[i], size * scales[i], turn + tilt[i]))
        x += adv[i] + track * size
    return out


def letters_path(ctx, layout):
    for ch, x, y, s, a in layout:
        fn, adv = GLYPHS[ch]
        ctx.save()
        ctx.translate(x + adv * s / 2, y)
        ctx.rotate(a)
        ctx.translate(-adv * s / 2, -s)
        ctx.scale(s, s)
        fn(ctx)
        ctx.restore()


def lettering(ctx, layout, size, fill, ink=INK, shadow=None, hi=None, weight=0.25, outline=0.075, depth=(5, 7), rim=None):
    """A hand-lettered word: the brush strokes `weight` of the cap height thick, an ink outline round them all, a drop
    of the shadow colour under and right (its depth), and a light stroke along the top-left of each stroke."""
    w = weight * size
    o = outline * size
    ctx.save()
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    if rim is not None:
        for k in (depth[0] * 1.0, 0):
            ctx.save(); ctx.translate(k, depth[1] * k / max(depth[0], 1))
            ctx.new_path(); letters_path(ctx, layout)
            ctx.restore()
            rgba(ctx, rim)
            ctx.set_line_width(w + 2 * o + 0.09 * size)
            ctx.stroke()
    if shadow is not None:
        steps = max(1, int(max(abs(depth[0]), abs(depth[1]))))
        for k in range(steps, 0, -1):
            ctx.save()
            ctx.translate(depth[0] * k / steps, depth[1] * k / steps)
            ctx.new_path(); letters_path(ctx, layout)
            ctx.restore()
            rgba(ctx, ink)
            ctx.set_line_width(w + 2 * o)
            ctx.stroke()
        ctx.save()
        ctx.translate(depth[0] * 0.5, depth[1] * 0.5)
        ctx.new_path(); letters_path(ctx, layout)
        ctx.restore()
        rgba(ctx, shadow)
        ctx.set_line_width(w + o * 0.2)
        ctx.stroke()
    ctx.new_path(); letters_path(ctx, layout)
    rgba(ctx, ink)
    ctx.set_line_width(w + 2 * o)
    ctx.stroke()
    ctx.new_path(); letters_path(ctx, layout)
    rgba(ctx, fill)
    ctx.set_line_width(w)
    ctx.stroke()
    if hi is not None:
        ctx.push_group()
        ctx.save()
        ctx.translate(-w * 0.2, -w * 0.22)
        ctx.new_path(); letters_path(ctx, layout)
        ctx.restore()
        rgba(ctx, hi)
        ctx.set_line_width(w * 0.3)
        ctx.stroke()
        light = ctx.pop_group()
        ctx.push_group()
        ctx.new_path(); letters_path(ctx, layout)
        ctx.set_source_rgba(1, 1, 1, 1)
        ctx.set_line_width(w * 0.86)
        ctx.stroke()
        mask = ctx.pop_group()
        ctx.set_source(light)
        ctx.mask(mask)
    ctx.restore()


def text(ctx, s, x, y, size, colour, face='Inter', bold=True, align='center', a=1.0, outline=None, ow=0.0, maxw=None, spacing=0.0):
    ctx.save()
    ctx.select_font_face(face, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(size)
    widths = [ctx.text_extents(ch).x_advance for ch in s] if spacing else None
    total = (sum(widths) + spacing * size * (len(s) - 1)) if spacing else ctx.text_extents(s).x_advance
    if maxw and total > maxw:
        k = maxw / total
        ctx.set_font_size(size * k)
        size *= k
        widths = [ctx.text_extents(ch).x_advance for ch in s] if spacing else None
        total = (sum(widths) + spacing * size * (len(s) - 1)) if spacing else ctx.text_extents(s).x_advance
    x0 = x - total / 2 if align == 'center' else (x - total if align == 'right' else x)
    ctx.new_path()
    if spacing:
        xx = x0
        for ch, wch in zip(s, widths):
            ctx.move_to(xx, y)
            ctx.text_path(ch)
            xx += wch + spacing * size
    else:
        ctx.move_to(x0, y)
        ctx.text_path(s)
    if outline is not None:
        rgba(ctx, outline)
        ctx.set_line_width(ow)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.stroke_preserve()
    rgba(ctx, colour, a)
    ctx.fill()
    ctx.restore()


JP = 'IPAGothic'


def vgrad(ctx, y0, y1, stops, x0=0, x1=W):
    g = cairo.LinearGradient(0, y0, 0, y1)
    for t, c in stops:
        g.add_color_stop_rgb(t, *c)
    ctx.set_source(g)
    ctx.rectangle(x0, min(y0, y1), x1 - x0, abs(y1 - y0))
    ctx.fill()


def wrap_x(ctx, draw, xs):
    """Draws a motif at each x, and again a wrap's width either side where it crosses the seam (so it tiles)."""
    for x in xs:
        for dx in (-W, 0, W):
            draw(ctx, x + dx)


def back_panel(ctx, H, p, cx, top, colour, rule):
    """The back of the can, round the seam: what a can of beer in Japan carries (its kind, strength and contents, the
    warning required on every can since 1989, the brewer, the recycling mark)."""
    lines = [
        (p['jp_kind'], 30, True),
        ('アルコール分 %s%%' % p['abv'], 24, True),
        ('内容量 %dml' % p['ml'], 24, True),
        ('原材料 麦芽・ホップ' + p.get('extra', ''), 20, False),
        ('', 10, False),
        ('未成年者の飲酒は', 21, True),
        ('法律で禁止されています', 21, True),
        ('', 10, False),
        ('ヨハンソン麦酒株式会社', 19, False),
        ('沖縄県名護市', 19, False),
    ]
    y = top
    for s, size, bold in lines:
        if s:
            text(ctx, s, cx, y, size, colour, face=JP, bold=bold, maxw=250)
        y += size * 1.32
    # the aluminium can's recycling mark: two arrows chasing round a ring, アルミ in it
    ry = y + 28
    ctx.save()
    rgba(ctx, colour)
    ctx.set_line_width(5)
    ctx.new_path(); ctx.arc(cx, ry, 30, math.radians(200), math.radians(340)); ctx.stroke()
    ctx.new_path(); ctx.arc(cx, ry, 30, math.radians(20), math.radians(160)); ctx.stroke()
    for a in (340, 160):
        r = math.radians(a)
        px, py = cx + 30 * math.cos(r), ry + 30 * math.sin(r)
        tx, ty = -math.sin(r), math.cos(r)
        ctx.new_path(); ctx.move_to(px + tx * 10, py + ty * 10)
        ctx.line_to(px - ty * 8, py + tx * 8); ctx.line_to(px + ty * 8, py - tx * 8); ctx.close_path(); ctx.fill()
    ctx.restore()
    text(ctx, 'アルミ', cx, ry + 7, 18, colour, face=JP, bold=True)
    rgba(ctx, rule)
    ctx.rectangle(cx - 120, top - 46, 240, 4)
    ctx.fill()


def bands(ctx, H, colour, rule, h=26):
    """The rolled shoulder bands top and bottom, with a fine rule inside each."""
    rgba(ctx, colour)
    ctx.rectangle(0, 0, W, h); ctx.fill()
    ctx.rectangle(0, H - h, W, h); ctx.fill()
    rgba(ctx, rule)
    ctx.rectangle(0, h, W, 4); ctx.fill()
    ctx.rectangle(0, H - h - 4, W, 4); ctx.fill()


# ----------------------------------------------------------------------------------------------------------------- #
# KAME island lager (350 ml): Kame the sea turtle, sat back on the tide line at sunset, one flipper up, eyes shut in a
# long contented stretch. The everyday can: "otsukare", the day done.
# ----------------------------------------------------------------------------------------------------------------- #

KAME = dict(teal=hexc('#1f8a86'), teal_d=hexc('#146066'), teal_l=hexc('#3fb0a3'), cream=hexc('#f8e6bf'), cream_d=hexc('#e3c28c'),
            gold=hexc('#f3b33d'), gold_l=hexc('#fde09a'), coral=hexc('#e8684a'), sky=hexc('#f7c76a'), sky_low=hexc('#f29a5c'),
            shell=hexc('#3b8f5c'), shell_d=hexc('#2a6a45'), shell_l=hexc('#68b277'), skin=hexc('#9fcf8a'), skin_d=hexc('#74a96a'),
            blush=hexc('#f08a74'), mouth=hexc('#8a2f2a'), tongue=hexc('#f0836f'))


def kame_figure(ctx, C):
    """Kame in his own frame: the origin where his shell meets the water, y up the page negative. Line of action: a long
    C from his tail, up his back to his head tipped back to the left; the raised flipper is the C's far tip."""
    ox, oy = 0.0, 0.0
    # his back flippers in the water in front, toes up
    part(ctx, blob([(ox - 96, oy + 30), (ox - 60, oy + 8), (ox - 36, oy + 28), (ox - 62, oy + 48)]), C['skin'], C['skin_d'], lw=6, off=8)
    part(ctx, blob([(ox + 102, oy + 34), (ox + 66, oy + 10), (ox + 42, oy + 30), (ox + 70, oy + 50)]), C['skin'], C['skin_d'], lw=6, off=8)
    # the shell from the front and a little below: its rim a wide dome behind his belly
    shell = blob([(ox - 112, oy + 6), (ox - 108, oy - 56), (ox - 68, oy - 106), (ox, oy - 120), (ox + 70, oy - 104), (ox + 110, oy - 54),
                  (ox + 114, oy + 8), (ox + 58, oy + 26), (ox - 58, oy + 26)])
    part(ctx, shell, C['shell'], C['shell_d'], hi=C['shell_l'], lw=8, off=16)
    for a in range(-152, -27, 25):
        r = math.radians(a)
        stroke(ctx, [(ox + 106 * math.cos(r), oy - 8 + 108 * math.sin(r)), (ox + 86 * math.cos(r), oy - 8 + 88 * math.sin(r))], lw=4, colour=C['shell_d'])
    # his belly plate, cream, squashed a little where he sits
    belly = blob([(ox - 74, oy + 14), (ox - 80, oy - 40), (ox - 46, oy - 84), (ox + 4, oy - 94), (ox + 52, oy - 82), (ox + 80, oy - 38),
                  (ox + 76, oy + 16), (ox, oy + 24)])
    part(ctx, belly, C['cream'], C['cream_d'], lw=6, off=12)
    for y, w in ((oy - 58, 50), (oy - 26, 68), (oy + 4, 64)):
        stroke(ctx, [(ox - w, y + 4), (ox, y - 4), (ox + w, y + 4)], lw=4, colour=C['cream_d'])
    stroke(ctx, [(ox, oy - 86), (ox + 2, oy + 18)], lw=4, colour=C['cream_d'])
    # the left flipper resting on his belly; the right one up: "otsukare!", the end of the day
    part(ctx, blob([(ox - 80, oy - 34), (ox - 38, oy - 26), (ox - 2, oy - 4), (ox - 28, oy + 8), (ox - 80, oy - 2)]), C['skin'], C['skin_d'], lw=6, off=8)
    up = blob([(ox + 64, oy - 62), (ox + 96, oy - 96), (ox + 118, oy - 136), (ox + 136, oy - 170), (ox + 160, oy - 184), (ox + 176, oy - 172),
               (ox + 166, oy - 142), (ox + 144, oy - 100), (ox + 102, oy - 38)])
    part(ctx, up, C['skin'], C['skin_d'], lw=7, off=10)
    stroke(ctx, [(ox + 140, oy - 150), (ox + 152, oy - 140)], lw=3.5, colour=C['skin_d'])
    # the wave: two swing lines behind the flipper's tip
    stroke(ctx, [(ox + 196, oy - 196), (ox + 212, oy - 168), (ox + 208, oy - 138)], lw=5)
    stroke(ctx, [(ox + 214, oy - 214), (ox + 236, oy - 176), (ox + 230, oy - 136)], lw=5)
    # his neck and head, tipped back to the left, chin up: the head big against the body, for appeal
    part(ctx, blob([(ox - 46, oy - 82), (ox - 34, oy - 122), (ox + 16, oy - 126), (ox + 30, oy - 90)]), C['skin'], C['skin_d'], lw=6, off=8)
    hx, hy = ox - 22, oy - 164
    head = blob(rot_pts([(hx - 76, hy + 6), (hx - 60, hy - 46), (hx, hy - 64), (hx + 62, hy - 46), (hx + 80, hy + 4), (hx + 58, hy + 50), (hx, hy + 60), (hx - 56, hy + 48)], hx, hy, -0.2))
    part(ctx, head, C['skin'], C['skin_d'], hi=hexc('#c2e3a6'), lw=8, off=13)
    # the tenugui round his neck, under his chin: a day's work done (white, a teal stripe), one end down his front
    end = blob([(ox - 46, oy - 96), (ox - 22, oy - 94), (ox - 30, oy - 54), (ox - 40, oy - 40), (ox - 62, oy - 48), (ox - 58, oy - 70)])
    part(ctx, end, WHITE, hexc('#d6d0c2'), lw=6, off=8)
    stroke(ctx, [(ox - 56, oy - 60), (ox - 30, oy - 62)], lw=5, colour=C['teal'])
    for x in (-58, -50, -42):
        stroke(ctx, [(ox + x, oy - 46 + (x + 50) * 0.1), (ox + x - 2, oy - 36 + (x + 50) * 0.1)], lw=3)
    band = blob(rot_pts([(ox - 70, oy - 102), (ox - 20, oy - 112), (ox + 34, oy - 118), (ox + 62, oy - 110), (ox + 40, oy - 92), (ox - 14, oy - 86), (ox - 60, oy - 86)], ox, oy - 100, -0.12))
    part(ctx, band, WHITE, hexc('#d6d0c2'), lw=6, off=7)
    # eyes shut in bliss, brows up, cheeks warm, a wide open grin
    soft(ctx, hx - 50, hy + 20, 22, 14, C['blush'], 0.65)
    soft(ctx, hx + 50, hy + 6, 22, 14, C['blush'], 0.65)
    eye_happy(ctx, hx - 30, hy - 6, 17, 16, lw=6.5)
    eye_happy(ctx, hx + 28, hy - 18, 17, 16, lw=6.5)
    stroke(ctx, [(hx - 48, hy - 34), (hx - 32, hy - 44), (hx - 16, hy - 40)], lw=5)
    stroke(ctx, [(hx + 12, hy - 48), (hx + 28, hy - 56), (hx + 44, hy - 50)], lw=5)
    mouth = blob(rot_pts([(hx - 34, hy + 16), (hx, hy + 20), (hx + 36, hy + 6), (hx + 30, hy + 34), (hx, hy + 46), (hx - 26, hy + 38)], hx, hy + 24, -0.2), t=0.9)
    part(ctx, mouth, C['mouth'], lw=5.5)
    ctx.save(); ctx.new_path(); mouth(ctx); ctx.clip()
    part(ctx, oval(hx + 2, hy + 46, 20, 12, -0.2), C['tongue'], line=False)
    ctx.restore()
    stroke(ctx, [(hx - 34, hy + 16), (hx, hy + 20), (hx + 36, hy + 6)], lw=5.5)
    part(ctx, oval(hx - 4, hy + 3, 3.4, 2.6), INK, line=False)
    part(ctx, oval(hx + 10, hy + 1, 3.4, 2.6), INK, line=False)
    # the little splash where he sits
    for dx, dy, r in ((-124, 14, 9), (-140, -2, 5), (126, 16, 8), (142, 2, 4.5)):
        part(ctx, oval(ox + dx, oy + dy, r, r * 0.8), WHITE, lw=3)


def draw_kame(ctx, H, p):
    C = KAME
    sea_top = round(H * 0.71)
    cx = W / 2
    # the sky going down into the sea, all the way round
    vgrad(ctx, 0, sea_top, [(0, C['sky']), (1, C['sky_low'])])
    vgrad(ctx, sea_top, H, [(0, C['teal_l']), (0.35, C['teal']), (1, C['teal_d'])])
    # the sun setting behind him (a light disc behind his silhouette), and its road on the water
    ctx.save(); ctx.new_path(); ctx.rectangle(0, 0, W, sea_top); ctx.clip()
    part(ctx, oval(cx, sea_top, 150, 150), C['gold_l'], line=False)
    ctx.restore()
    for w, y in ((150, 10), (118, 26), (86, 44), (54, 64), (30, 86)):
        part(ctx, oval(cx, sea_top + y, w, 4.5), C['gold_l'], line=False)
    # the swell, every 128 px so the wrap tiles
    for row, (y, a) in enumerate([(sea_top + 30, 0.55), (sea_top + 66, 0.45), (sea_top + 102, 0.35)]):
        for x0 in range(-64 + row * 40, W + 128, 128):
            if abs(x0 + 22 - cx) < 170 and row < 2:
                continue
            stroke(ctx, [(x0, y), (x0 + 22, y - 7), (x0 + 44, y)], lw=4, colour=WHITE, a=a)
    # the back, round the seam: what the can says, and a little shell over it
    for bx in (0, W):
        ctx.save(); ctx.translate(bx, 0)
        part(ctx, oval(0, 64, 26, 17), C['shell'], C['shell_d'], lw=3.5, off=6)
        stroke(ctx, [(-12, 62), (0, 54), (12, 62)], lw=3, colour=C['shell_d'])
        back_panel(ctx, H, p, 0, 138, INK, C['coral'])
        ctx.restore()
    # the sides: a gull each way on the sky
    for x, s in ((W * 0.27, 1), (W * 0.73, -1)):
        stroke(ctx, [(x - 26 * s, 118), (x - 12 * s, 106), (x, 118)], lw=5)
        stroke(ctx, [(x, 118), (x + 12 * s, 106), (x + 26 * s, 118)], lw=5)
    # Kame on the tide line, leaning back
    ctx.save()
    ctx.translate(cx + 4, sea_top + 6)
    ctx.rotate(-0.06)
    ctx.scale(0.8, 0.8)
    kame_figure(ctx, C)
    ctx.restore()
    # the logo across the sky above him: KAME in cream on a teal drop, a wave under it
    lay = word_layout('KAME', cx, 146, 80, arc=14, bounce=[2, -6, 0, -4], scales=[1.1, 1, 1, 0.98], tilt=[-0.1, 0.02, -0.03, 0.08], track=0.06)
    lettering(ctx, lay, 80, C['cream'], shadow=C['teal_d'], hi=WHITE, weight=0.27, depth=(4, 8))
    sw = [(cx - 132, 172), (cx - 66, 164), (cx, 172), (cx + 66, 164), (cx + 132, 172)]
    stroke(ctx, sw, lw=12, colour=INK)
    stroke(ctx, sw, lw=5, colour=C['coral'])
    text(ctx, 'ISLAND LAGER', cx - 76, H - 40, 22, WHITE, outline=INK, ow=5, spacing=0.12)
    text(ctx, '島のラガー', cx + 96, H - 40, 23, WHITE, face=JP, outline=INK, ow=5)
    bands(ctx, H, C['teal_d'], C['gold'])


def tentacle(ctx, pts, w0, w1, fill, shade, sucker=None, side=1, lw=6.0, n=48, off=8):
    """A tapering arm along a smooth centre line, w0 thick at its root to w1 at its rounded tip; its suckers along one
    side (side +1 the left of its way, -1 the right), smaller toward the tip."""
    # sample the Catmull-Rom centre line
    P = []
    m = len(pts)
    for i in range(m - 1):
        p0 = pts[max(i - 1, 0)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[min(i + 2, m - 1)]
        for k in range(n // (m - 1)):
            t = k / (n // (m - 1))
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            P.append((x, y))
    P.append(pts[-1])
    L, R, N = [], [], []
    for i, (x, y) in enumerate(P):
        a = P[max(i - 1, 0)]; b = P[min(i + 1, len(P) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        f = i / (len(P) - 1)
        w = (w0 + (w1 - w0) * f ** 0.85) / 2
        L.append((x + nx * w, y + ny * w)); R.append((x - nx * w, y - ny * w)); N.append((nx, ny, w))

    def shape(c):
        c.move_to(*L[0])
        for q in L[1:]:
            c.line_to(*q)
        tip = P[-1]
        nx, ny, w = N[-1]
        ang = math.atan2(ny, nx)
        c.arc_negative(tip[0], tip[1], w, ang, ang - math.pi)
        for q in reversed(R):
            c.line_to(*q)
        c.close_path()
    part(ctx, shape, fill, shade, lw=lw, off=off)
    if sucker:
        for i in range(4, len(P) - 4, 6):
            x, y = P[i]
            nx, ny, w = N[i]
            r = max(3.0, w * 0.5)
            sx, sy = x + side * nx * w * 0.62, y + side * ny * w * 0.62
            part(ctx, oval(sx, sy, r, r * 0.86), sucker, lw=2.2)
            part(ctx, oval(sx, sy, r * 0.4, r * 0.36), shade, line=False)
    return P


# ----------------------------------------------------------------------------------------------------------------- #
# JUGON big draft (500 ml long can): Jugon the dugong, leaping clean out of the evening sea, laughing, stretched long
# from tail to snout. The big one, for the end of a long day.
# ----------------------------------------------------------------------------------------------------------------- #

JUGON = dict(night=hexc('#1c2b55'), night_l=hexc('#30508a'), sea=hexc('#1f5e7a'), sea_d=hexc('#143f56'), foam=hexc('#bfe8e6'),
             gold=hexc('#f5c443'), gold_d=hexc('#c98a1f'), moon=hexc('#fbe7a6'), body=hexc('#c9a79b'), body_d=hexc('#9c7a72'),
             body_l=hexc('#e6c8bb'), belly=hexc('#f4ddcd'), belly_d=hexc('#dcbcaa'), snout=hexc('#b48f85'), blush=hexc('#f08f86'),
             mouth=hexc('#7d2a2c'), tongue=hexc('#f08378'))


def jugon_figure(ctx, C):
    """Jugon along her own axis: x from tail (-) to snout (+), y down; the whole figure is turned to leap up and right.
    A dugong's build, pushed: a round barrel of a body, no neck, a big head ending in the broad, downturned whiskery
    snout, paddle flippers and a whale's crescent fluke."""
    # far flipper, up behind her back, flung by the leap
    part(ctx, blob([(40, -84), (52, -136), (78, -168), (98, -160), (92, -120), (70, -80)]), C['body'], C['body_d'], lw=6, off=8)
    # the tail fluke, two soft lobes
    part(ctx, blob([(-128, -10), (-160, -44), (-204, -84), (-226, -80), (-214, -40), (-196, -2), (-222, 48), (-206, 70), (-166, 36), (-128, 12)]), C['body'], C['body_d'], lw=7, off=9)
    # the body: a round barrel stretched long by the leap
    body = blob([(-150, -6), (-104, -64), (-24, -112), (66, -122), (140, -98), (186, -50), (204, 8), (186, 62), (120, 108), (20, 120), (-80, 84), (-146, 16)])
    part(ctx, body, C['body'], C['body_d'], hi=C['body_l'], lw=8, off=18, light=(-0.35, -0.95))
    # her pale belly along the underside
    ctx.save(); ctx.new_path(); body(ctx); ctx.clip()
    part(ctx, blob([(-150, 10), (-80, 40), (20, 66), (120, 60), (200, 40), (200, 140), (60, 160), (-80, 120), (-160, 40)]), C['belly'], C['belly_d'], lw=5, off=9, light=(-0.2, -1))
    ctx.restore()
    ctx.save(); ctx.new_path(); body(ctx); rgba(ctx, INK); ctx.set_line_width(8); ctx.stroke(); ctx.restore()
    # the near flipper, a paddle thrown back down along her side (it follows the leap)
    part(ctx, blob([(76, 44), (44, 84), (2, 116), (-40, 128), (-50, 112), (-12, 82), (36, 42)]), C['body'], C['body_d'], lw=6.5, off=8)
    # eyes squeezed shut with laughing, high on the head; brows up; cheeks
    soft(ctx, 120, -6, 24, 15, C['blush'], 0.7)
    eye_happy(ctx, 94, -50, 21, 18, lw=7.5)
    eye_happy(ctx, 140, -64, 18, 16, lw=7.5)
    stroke(ctx, [(74, -80), (92, -90), (110, -84)], lw=5.5)
    stroke(ctx, [(124, -94), (140, -100), (156, -92)], lw=5.5)
    # the laugh, wide open under the snout
    mouth = blob([(148, 56), (196, 62), (226, 54), (216, 92), (184, 110), (152, 96)])
    part(ctx, mouth, C['mouth'], lw=6)
    ctx.save(); ctx.new_path(); mouth(ctx); ctx.clip()
    part(ctx, oval(186, 110, 26, 15), C['tongue'], line=False)
    ctx.restore()
    # the big round downturned snout with its whisker pad: the dugong's own face
    snout = blob([(150, -16), (196, -30), (234, -10), (246, 28), (230, 60), (190, 70), (154, 54), (138, 20)])
    part(ctx, snout, C['snout'], C['body_d'], hi=C['body_l'], lw=7, off=10)
    stroke(ctx, [(192, 22), (194, 58)], lw=4, colour=C['body_d'])
    for x, y in ((176, 22), (172, 38), (182, 50), (206, 50), (216, 38), (212, 22)):
        part(ctx, oval(x, y, 3.2, 3.2), INK, line=False)


def draw_jugon(ctx, H, p):
    C = JUGON
    cx = W / 2
    sea_top = round(H * 0.79)
    vgrad(ctx, 0, sea_top, [(0, C['night']), (1, C['night_l'])])
    vgrad(ctx, sea_top, H, [(0, C['sea']), (1, C['sea_d'])])
    # the stars, the same all the way round (every 256 px)
    def star(ctx, x, y, r, a=1.0):
        ctx.new_path(); ctx.move_to(x, y - r)
        for k in range(1, 8):
            ang = -math.pi / 2 + k * math.pi / 4
            rr = r if k % 2 == 0 else r * 0.32
            ctx.line_to(x + rr * math.cos(ang), y + rr * math.sin(ang))
        ctx.close_path(); rgba(ctx, C['moon'], a); ctx.fill()
    for base in range(0, W, 256):
        for dx, y, r in ((30, 86, 9), (120, 260, 6), (200, 140, 7), (70, 400, 5), (180, 470, 8), (230, 330, 5)):
            star(ctx, base + dx, y, r, 0.9)
    # the moon behind her head: a light disc behind the silhouette
    part(ctx, oval(cx + 116, 310, 96, 96), C['moon'], hexc('#f0cf7e'), line=False, off=10, light=(0.7, -0.7))
    # the swell
    for row, (y, a) in enumerate([(sea_top + 30, 0.5), (sea_top + 70, 0.4), (sea_top + 108, 0.3)]):
        for x0 in range(-64 + row * 40, W + 128, 128):
            stroke(ctx, [(x0, y), (x0 + 22, y - 7), (x0 + 44, y)], lw=4, colour=C['foam'], a=a)
    # the back, round the seam
    for bx in (0, W):
        ctx.save(); ctx.translate(bx, 0)
        back_panel(ctx, H, p, 0, 190, hexc('#f6e9c8'), C['gold'])
        ctx.restore()
    # Jugon, leaping up and right; the splash she left below her tail, drops strung along her arc
    fx, fy, turn = cx - 6, H * 0.53, -0.58
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(turn); ctx.scale(0.86, 0.86)
    jugon_figure(ctx, C)
    ctx.restore()
    tx, ty = fx + (-200 * math.cos(turn)) * 0.86, fy + (-200 * math.sin(turn)) * 0.86
    splash_x = tx - 36
    for dx, dy, r in ((-18, 30, 9), (-34, 58, 7), (-10, 70, 6), (-44, 96, 5), (-26, 118, 6)):
        part(ctx, oval(tx + dx, ty + dy, r * 0.8, r), C['foam'], lw=3)
    crown = blob([(splash_x - 96, sea_top + 8), (splash_x - 70, sea_top - 34), (splash_x - 50, sea_top - 8), (splash_x - 26, sea_top - 60),
                  (splash_x, sea_top - 14), (splash_x + 24, sea_top - 54), (splash_x + 46, sea_top - 6), (splash_x + 72, sea_top - 30),
                  (splash_x + 96, sea_top + 8), (splash_x, sea_top + 22)], t=0.8)
    part(ctx, crown, C['foam'], hexc('#8fc9c9'), lw=6, off=8)
    for dx, dy, r in ((-86, -58, 7), (-40, -84, 6), (34, -80, 7), (84, -52, 5), (6, -100, 5)):
        part(ctx, oval(splash_x + dx, sea_top + dy, r, r * 1.15), C['foam'], lw=3)
    # the logo: JUGON in gold on an indigo drop, BIG DRAFT under it
    lay = word_layout('JUGON', cx, 140, 72, arc=14, bounce=[4, -5, 1, -6, 2], scales=[1.08, 1, 1.02, 1, 1.02], tilt=[-0.08, 0.03, -0.04, 0.03, 0.07], track=0.04)
    lettering(ctx, lay, 72, C['gold'], shadow=C['gold_d'], hi=C['moon'], weight=0.28, depth=(4, 8))
    text(ctx, 'BIG DRAFT', cx - 40, 190, 26, hexc('#f6e9c8'), spacing=0.16)
    text(ctx, '500', cx + 104, 192, 34, C['gold'], outline=INK, ow=6)
    text(ctx, 'ロング缶 · たっぷり500ml', cx, H - 42, 24, hexc('#f6e9c8'), face=JP, outline=INK, ow=5)
    bands(ctx, H, C['night'], C['gold'])


# ----------------------------------------------------------------------------------------------------------------- #
# TAKO black (350 ml): Tako the octopus, the harbour's old storyteller in a skipper's cap, squashed down wide on the sea
# floor, one eye shut in a wink and one arm curled up in the air: "did I ever tell you about...". The slow dark one.
# ----------------------------------------------------------------------------------------------------------------- #

TAKO = dict(bg=hexc('#1f1714'), bg2=hexc('#2c201b'), coral=hexc('#e2553c'), coral_d=hexc('#ad3829'), coral_l=hexc('#f4876a'),
            cream=hexc('#f5e3c0'), gold=hexc('#dba642'), gold_d=hexc('#9c6d22'), navy=hexc('#27406a'), navy_d=hexc('#172a48'),
            sand=hexc('#5a4130'), blush=hexc('#ff9a86'), mouth=hexc('#5e1d1d'), tongue=hexc('#f08378'))


def tako_figure(ctx, C):
    """Tako in his own frame: the origin on the sea floor under his middle, y up the page negative."""
    arm = lambda pts, w0=34, w1=12, side=1: tentacle(ctx, pts, w0, w1, C['coral'], C['coral_d'], sucker=C['cream'], side=side, lw=6)
    # the back arms, out to each side
    arm([(-70, -96), (-130, -78), (-178, -48), (-196, -10), (-176, 10), (-160, -6)], side=-1)
    arm([(80, -96), (140, -82), (182, -56), (198, -20), (180, 2), (166, -14)], side=1)
    # the arm raised to tell the tale, its tip curled like a beckoning finger
    arm([(66, -120), (116, -150), (150, -196), (162, -246), (148, -280), (124, -282), (118, -262), (132, -250)], w0=36, w1=11, side=1)
    # the front arms, curling on the sand
    arm([(-40, -92), (-74, -50), (-110, -14), (-96, 16), (-72, 12), (-78, -6)], side=-1)
    arm([(-6, -88), (-18, -40), (-34, 6), (-14, 26), (6, 14)], side=-1)
    arm([(30, -88), (50, -40), (60, 4), (88, 20), (104, 2)], side=1)
    arm([(56, -94), (100, -56), (132, -18), (126, 14), (106, 10)], side=1)
    # the head (the mantle), round and squashed wide where he has settled
    head = blob([(-116, -128), (-108, -188), (-56, -228), (10, -236), (78, -222), (118, -178), (122, -124), (84, -94), (0, -84), (-82, -94)])
    part(ctx, head, C['coral'], C['coral_d'], hi=C['coral_l'], lw=8, off=18)
    # spots on the crown
    for x, y, r in ((-56, -206, 8), (-30, -224, 5), (40, -220, 7), (66, -198, 5)):
        part(ctx, oval(x, y, r, r * 0.8), C['coral_l'], line=False)
    # the skipper's cap, cocked on the right
    ctx.save(); ctx.translate(30, -236); ctx.rotate(0.22)
    part(ctx, blob([(-58, 4), (-52, -36), (-10, -54), (44, -48), (62, -14), (56, 6)]), C['navy'], C['navy_d'], lw=6, off=8)
    part(ctx, blob([(-64, 2), (0, -6), (66, 2), (60, 16), (0, 12), (-58, 16)]), C['cream'], hexc('#d8c39a'), lw=6, off=5)
    part(ctx, blob([(-48, 14), (6, 12), (52, 16), (36, 30), (-30, 30)]), INK, line=False)
    # the badge: a gold anchor
    part(ctx, oval(2, -24, 13, 13), C['gold'], C['gold_d'], lw=3.5, off=3)
    stroke(ctx, [(2, -32), (2, -16)], lw=3)
    stroke(ctx, [(-6, -20), (2, -14), (10, -20)], lw=3)
    ctx.restore()
    # the face: a wink on the left, a sly look on the right under a raised brow, a crooked grin
    soft(ctx, -60, -126, 20, 12, C['blush'], 0.6)
    soft(ctx, 62, -128, 20, 12, C['blush'], 0.6)
    eye_happy(ctx, -36, -152, 18, 15, lw=6.5, lash=False)
    stroke(ctx, [(-58, -176), (-40, -186), (-20, -180)], lw=5)
    _LID[0] = C['coral']
    eye_open(ctx, 34, -152, 19, 24, look=(-0.6, 0.15), lw=5.5, lid=0.4)
    stroke(ctx, [(16, -192), (36, -202), (56, -194)], lw=5)
    mouth = blob([(-38, -122), (0, -116), (44, -132), (46, -116), (14, -98), (-24, -104)], t=0.9)
    part(ctx, mouth, C['mouth'], lw=5.5)
    ctx.save(); ctx.new_path(); mouth(ctx); ctx.clip()
    part(ctx, oval(8, -98, 18, 10), C['tongue'], line=False)
    ctx.restore()
    stroke(ctx, [(-40, -122), (0, -116), (48, -134)], lw=5.5)
    stroke(ctx, [(44, -140), (52, -128)], lw=4)


def draw_tako(ctx, H, p):
    C = TAKO
    cx = W / 2
    floor = round(H * 0.84)
    vgrad(ctx, 0, floor, [(0, C['bg']), (1, C['bg2'])])
    # the sand, a soft ridge, all the way round
    ctx.new_path(); ctx.move_to(0, floor)
    for x in range(0, W + 1, 16):
        ctx.line_to(x, floor + 6 * math.sin(x / W * 2 * math.pi * 8))
    ctx.line_to(W, H); ctx.line_to(0, H); ctx.close_path(); rgba(ctx, C['sand']); ctx.fill()
    # the bubbles rising, gold rings in the dark (every 256 px)
    for base in range(0, W, 256):
        for dx, y, r in ((24, 120, 10), (60, 210, 6), (200, 90, 7), (150, 300, 12), (230, 230, 5), (100, 380, 8)):
            ctx.new_path(); ctx.arc(base + dx, y, r, 0, 2 * math.pi); rgba(ctx, C['gold'], 0.75); ctx.set_line_width(3.5); ctx.stroke()
            ctx.new_path(); ctx.arc(base + dx - r * 0.35, y - r * 0.35, r * 0.22, 0, 2 * math.pi); rgba(ctx, C['cream'], 0.8); ctx.fill()
    # a warm glow behind him (the lamp of the tale), so his silhouette reads on the dark
    g = cairo.RadialGradient(cx, H * 0.6, 20, cx, H * 0.6, 230)
    g.add_color_stop_rgba(0, 0.95, 0.62, 0.32, 0.55)
    g.add_color_stop_rgba(1, 0.95, 0.62, 0.32, 0.0)
    ctx.set_source(g); ctx.rectangle(cx - 260, 0, 520, H); ctx.fill()
    for bx in (0, W):
        ctx.save(); ctx.translate(bx, 0)
        back_panel(ctx, H, p, 0, 140, C['cream'], C['gold'])
        ctx.restore()
    ctx.save(); ctx.translate(cx - 4, floor - 2); ctx.scale(0.8, 0.8)
    tako_figure(ctx, C)
    ctx.restore()
    lay = word_layout('TAKO', cx, 146, 76, arc=12, bounce=[-2, 3, -5, 1], scales=[1.06, 1, 1, 1.06], tilt=[0.06, -0.04, 0.05, -0.06], track=0.07)
    lettering(ctx, lay, 76, C['cream'], shadow=C['coral'], hi=WHITE, weight=0.27, depth=(4, 8), rim=C['gold'])
    text(ctx, 'BLACK LAGER', cx - 64, H - 36, 22, C['cream'], spacing=0.14)
    text(ctx, '黒ビール', cx + 100, H - 36, 24, C['gold'], face=JP)
    bands(ctx, H, C['coral_d'], C['gold'])


# ----------------------------------------------------------------------------------------------------------------- #

DRAW = {'kame-lager': draw_kame, 'jugon-draft': draw_jugon, 'tako-black': draw_tako}

BEERS = [
    dict(id='kame-lager', ml=350, abv='5', jp_kind='ビール', draw='kame-lager'),
    dict(id='jugon-draft', ml=500, abv='5', jp_kind='ビール（生）', draw='jugon-draft'),
    dict(id='tako-black', ml=350, abv='5.5', jp_kind='黒ビール', draw='tako-black', extra='・カラメル麦芽'),
]


def draw_poster(ctx, PW, PH):
    """The beer's poster for the machine's side (vending.js PRINT.sideA), the three together at the shore at dusk: Jugon
    leaping behind, Kame on the tide line, Tako on his rock; the hours the beer is sold, and the warning."""
    K, J, T = KAME, JUGON, TAKO
    sea = 520
    vgrad(ctx, 0, sea, [(0, J['night']), (0.45, hexc('#7a5a8c')), (0.8, K['sky_low']), (1, K['sky'])], x0=0, x1=PW)
    vgrad(ctx, sea, 640, [(0, K['teal_l']), (1, K['teal_d'])], x0=0, x1=PW)
    part(ctx, oval(PW / 2, sea, 120, 120), K['gold_l'], line=False)
    ctx.save(); ctx.new_path(); ctx.rectangle(0, sea, PW, 200); ctx.clip()
    vgrad(ctx, sea, 640, [(0, K['teal_l']), (1, K['teal_d'])], x0=0, x1=PW)
    for w, y in ((120, 10), (90, 26), (60, 44)):
        part(ctx, oval(PW / 2, sea + y, w, 4), K['gold_l'], line=False)
    ctx.restore()
    for x, y, r in ((60, 200, 7), (420, 180, 8), (300, 90, 5), (120, 330, 5), (470, 330, 6)):
        part(ctx, oval(x, y, r, r), J['moon'], line=False)
    # the title
    text(ctx, 'ビール', PW / 2, 120, 104, K['cream'], face=JP, outline=INK, ow=16)
    text(ctx, 'ビール', PW / 2, 120, 104, K['cream'], face=JP)
    # Jugon leaping across the dusk
    ctx.save(); ctx.translate(PW / 2 + 10, 300); ctx.rotate(-0.42); ctx.scale(0.5, 0.5); jugon_figure(ctx, J); ctx.restore()
    # Tako on his rock at the right
    part(ctx, blob([(300, 640), (318, 586), (380, 566), (470, 572), (512, 600), (512, 640)]), hexc('#5d4a42'), hexc('#3e302b'), lw=6, off=8)
    ctx.save(); ctx.translate(404, 586); ctx.scale(0.5, 0.5); tako_figure(ctx, T); ctx.restore()
    # Kame on the tide line at the left
    ctx.save(); ctx.translate(140, sea + 22); ctx.scale(0.56, 0.56); kame_figure(ctx, K); ctx.restore()
    # the words
    rgba(ctx, hexc('#f6ecd2')); ctx.rectangle(0, 640, PW, 112); ctx.fill()
    text(ctx, 'KAME · JUGON · TAKO', PW / 2, 678, 34, INK, spacing=0.04)
    text(ctx, '販売時間 午前5時〜午後11時', PW / 2, 712, 24, hexc('#a2302a'), face=JP)
    text(ctx, '未成年者の飲酒は法律で禁止されています', PW / 2, 740, 19, INK, face=JP)
    rgba(ctx, hexc('#2a63c4')); ctx.rectangle(0, 752, PW, PH - 752); ctx.fill()
    text(ctx, 'つめた〜い ¥220から', PW / 2, 806, 40, WHITE, face=JP)


def render_poster():
    PW, PH = 512, 832
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, PW, PH)
    ctx = cairo.Context(surf)
    ctx.set_antialias(cairo.ANTIALIAS_BEST)
    draw_poster(ctx, PW, PH)
    buf = io.BytesIO()
    surf.write_to_png(buf)
    buf.seek(0)
    return Image.open(buf).convert('RGB')


def render(p):
    H = wrap_height(p['ml'])
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
    ctx = cairo.Context(surf)
    ctx.set_antialias(cairo.ANTIALIAS_BEST)
    DRAW[p['draw']](ctx, H, p)
    buf = io.BytesIO()
    surf.write_to_png(buf)
    buf.seek(0)
    return Image.open(buf).convert('RGB')


def cylinder(img, height_px, turn=0.0, light=(-0.45, 0.2)):
    """The print on a can, seen square on from in front: each column of the picture is the print at the angle that
    column looks at, lit from the front left, with the aluminium shoulders above and below."""
    a = np.asarray(img).astype(np.float32) / 255
    h, w = a.shape[:2]
    can_w = int(round(height_px * w / h * (BAND) / math.pi / BAND * 1.0))
    # the can's width to its printed band's height: diameter / (0.86 x height); w/h = pi d / (0.86 H)
    can_w = int(round(height_px * (w / h) / math.pi))
    xs = (np.arange(can_w) + 0.5) / can_w * 2 - 1
    theta = np.arcsin(np.clip(xs, -1, 1))
    u = (0.5 + (theta + turn) / (2 * math.pi)) % 1.0
    cols = np.clip((u * w).astype(int), 0, w - 1)
    rows = np.clip(((np.arange(height_px) + 0.5) / height_px * h).astype(int), 0, h - 1)
    band = a[rows][:, cols]
    nx = np.sin(theta)
    nz = np.cos(theta)
    lam = 0.55 + 0.45 * np.clip(nx * light[0] + nz * (1 - abs(light[0])), 0, 1)
    spec = np.exp(-((theta + 0.45) ** 2) / 0.012) * 0.35
    band = np.clip(band * lam[None, :, None] + spec[None, :, None], 0, 1)
    return Image.fromarray((band * 255).astype(np.uint8))


def mockup(img, ml, height_band=360, turn=0.0):
    c = CANS[ml]
    band = cylinder(img, height_band, turn)
    bw = band.width
    total_h = int(round(height_band / BAND))
    shoulder = (total_h - height_band) // 2
    pad = max(3, round(bw * 0.12))
    out = Image.new('RGB', (bw + pad * 2, total_h + pad * 2 + pad), (236, 232, 222))
    d = ImageDraw.Draw(out)
    x0, y0 = pad, pad + pad // 2
    # aluminium shoulders and the lid's ellipse
    alu = (196, 200, 204)
    d.rectangle([x0, y0, x0 + bw - 1, y0 + shoulder + 1], fill=alu)
    d.rectangle([x0, y0 + shoulder + height_band - 1, x0 + bw - 1, y0 + total_h], fill=alu)
    e = max(1, round(bw * 0.09))
    d.ellipse([x0 + 4, y0 - e, x0 + bw - 4, y0 + e], fill=(222, 225, 228), outline=(150, 154, 158))
    d.ellipse([x0 + 4, y0 + total_h - e, x0 + bw - 4, y0 + total_h + e], fill=(170, 174, 178))
    out.paste(band, (x0, y0 + shoulder))
    return out


def sheet(beers):
    font = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 22)
    small = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Regular.otf', 16)
    rows = []
    for p in beers:
        img = Image.open(os.path.join(OUT, p['id'] + '.webp')).convert('RGB')
        flat = img.resize((768, int(768 * img.height / img.width)), Image.LANCZOS)
        band_h = 300 if p['ml'] == 350 else 413
        mocks = [mockup(img, p['ml'], band_h, t) for t in (0.0, math.radians(50), math.pi)]
        # at the machine: the dummy can in the window as the game's camera sees it from the pavement, about 3 m off
        # (its printed band about 26 px high on a 720 px view), then the same pixels four times over
        tiny_h = 26 if p['ml'] == 350 else 36
        tiny = mockup(img, p['ml'], tiny_h, 0.0)
        tiny_big = tiny.resize((tiny.width * 4, tiny.height * 4), Image.NEAREST)
        h = max(flat.height + 40, max(m.height for m in mocks), tiny_big.height) + 60
        wid = flat.width + sum(m.width for m in mocks) + tiny.width + tiny_big.width + 120
        row = Image.new('RGB', (wid, h), (246, 242, 232))
        d = ImageDraw.Draw(row)
        d.text((16, 12), '%s  ·  %d ml  ·  %d x %d px' % (p['id'], p['ml'], img.width, img.height), font=font, fill=(40, 30, 24))
        row.paste(flat, (16, 46))
        x = flat.width + 40
        for m, label in zip(mocks, ('front', 'three-quarter', 'back')):
            row.paste(m, (x, 40))
            d.text((x + 8, 40 + m.height - 4), label, font=small, fill=(90, 80, 70))
            x += m.width + 12
        row.paste(tiny, (x, 60))
        row.paste(tiny_big, (x + tiny.width + 12, 60))
        d.text((x, 60 + tiny_big.height + 6), 'at the machine (x1, x4)', font=small, fill=(90, 80, 70))
        rows.append(row)
    pp = os.path.join(OUT, 'beer-poster.webp')
    if os.path.exists(pp):
        poster = Image.open(pp).convert('RGB')
        row = Image.new('RGB', (poster.width + 32 + 256 + 40, poster.height + 60), (246, 242, 232))
        d = ImageDraw.Draw(row)
        d.text((16, 12), 'beer-poster  ·  the machine’s side  ·  512 x 832 px (and at the cell’s 256 x 416)', font=font, fill=(40, 30, 24))
        row.paste(poster, (16, 46))
        row.paste(poster.resize((256, 416), Image.LANCZOS), (poster.width + 40, 46))
        rows.append(row)
    wid = max(r.width for r in rows)
    out = Image.new('RGB', (wid, sum(r.height for r in rows)), (246, 242, 232))
    y = 0
    for r in rows:
        out.paste(r, (0, y))
        y += r.height
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only')
    ap.add_argument('--sheet', default=os.path.join(REVIEW, 'cans-sheet.jpg'))
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(REVIEW, exist_ok=True)
    todo = [p for p in BEERS if not args.only or p['id'] == args.only]
    for p in todo:
        img = render(p)
        path = os.path.join(OUT, p['id'] + '.webp')
        img.save(path, 'WEBP', quality=90, method=6)
        print('wrote', os.path.relpath(path, ROOT), img.size)
    if not args.only or args.only == 'beer-poster':
        poster = render_poster()
        path = os.path.join(OUT, 'beer-poster.webp')
        poster.save(path, 'WEBP', quality=90, method=6)
        print('wrote', os.path.relpath(path, ROOT), poster.size)
    out = sheet(BEERS)
    out.save(args.sheet, quality=88) if args.sheet.endswith('.jpg') else out.save(args.sheet)
    print('wrote', os.path.relpath(args.sheet, ROOT), out.size)


if __name__ == '__main__':
    main()
