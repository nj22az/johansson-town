#!/usr/bin/env python3
"""Draws the printed pages for the magazines on Sakura's rack.

Covers and most inside pages are drawn live in the browser (src/world/interiors/
magazine-art.js). These are the pages that are drawn once and shipped as images:

  hayabusa-ch{1-4}-p{1-4}.png   週刊少年ハヤブサ: the serial 風雲児ハヤテ, a chapter a week
  hayabusa-gag-{1-4}.png        サクラ商店4コマ: two gag strips a week, starring the shop
  celanime-poster-{1-4}.png     月刊セルアニメ: the month's pull-out poster

The reader picks the chapter, gag page and poster from the issue on sale
(magazine-issues.js), so they turn over with the town calendar.

Pure Pillow, no other dependencies. English lettering uses Arial or DejaVu Sans;
pass --font to choose another installed font.

    pip install pillow
    python3 tools/magazines/draw_pages.py            # writes assets/magazines/
"""
import argparse, math, os, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 600, 840
INK, PAPER = 20, 250
ROOT = Path(__file__).resolve().parents[2]
FONT_CANDIDATES = [
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
    '/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc',
    '/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc',
    '/Library/Fonts/Arial Unicode.ttf',
]
FONT_PATH = None


def font(size):
    return ImageFont.truetype(FONT_PATH, size)


# ------------------------------------------------------------------ drawing kit
VERTICAL = {'-': '｜', '－': '｜', '〜': '≀', '「': '﹁', '」': '﹂', '（': '︵', '）': '︶', '、': '︑', '。': '︒'}


def english_lines(text):
    import textwrap
    return "\n".join(textwrap.fill(line, width=14) for line in text.split("\n"))


def vtext(d, x, y, text, size, fill=INK, columns_gap=1.15):
    """English speech runs horizontally; retain the art's anchor contract."""
    tw, _ = vsize(text, size)
    d.multiline_text((x - tw / 2 + size / 2, y), english_lines(text), font=font(size), fill=fill, anchor='ma', align='center', spacing=2)


def vsize(text, size, columns_gap=1.15):
    lines = english_lines(text).split("\n")
    f = font(size)
    return max(f.getlength(line) for line in lines), len(lines) * (size + 2)


def bubble(d, cx, cy, text, size=22, shout=False):
    """A speech balloon sized to its vertical text, centred on (cx, cy)."""
    tw, th = vsize(text, size)
    rx, ry = tw / 2 + 16, th / 2 + 16
    if shout:
        pts = []
        for i in range(28):
            a = i / 28 * math.tau
            r = 1.0 if i % 2 else 1.28
            pts.append((cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r))
        d.polygon(pts, fill=PAPER, outline=INK, width=3)
    else:
        d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=PAPER, outline=INK, width=3)
    vtext(d, cx + tw / 2 - size / 2, cy - th / 2, text, size)


def tone(img, box, spacing=6, radius=1.3, value=INK):
    """Screentone: a field of dots clipped to `box`."""
    x0, y0, x1, y1 = map(int, box)
    d = ImageDraw.Draw(img)
    for y in range(y0, y1, spacing):
        off = (y // spacing) % 2 * spacing / 2
        for x in range(int(x0 + off), x1, spacing):
            d.ellipse([x - radius, y - radius, x + radius, y + radius], fill=value)


def speed_lines(d, box, cx, cy, n=70, seed=0, gap=0.25):
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box
    R = math.hypot(x1 - x0, y1 - y0)
    for i in range(n):
        a = rnd.random() * math.tau
        r0 = R * (gap + rnd.random() * .15)
        d.line([(cx + math.cos(a) * r0, cy + math.sin(a) * r0), (cx + math.cos(a) * R, cy + math.sin(a) * R)], fill=INK, width=rnd.choice([1, 2, 2, 3]))


def sfx(d, x, y, text, size=48, angle=0, img=None):
    """Big hand-lettered sound effect, outlined white so it reads over anything."""
    f = font(size)
    layer = Image.new('L', (size * (len(text) + 1), size * 2), 0)
    ld = ImageDraw.Draw(layer)
    ld.text((size // 2, size // 2), text, font=f, fill=255, stroke_width=6, stroke_fill=128)
    layer = layer.rotate(angle, expand=True, resample=Image.BICUBIC)
    img.paste(PAPER, (int(x), int(y)), layer.point(lambda v: 255 if v > 100 else 0))
    ink = layer.point(lambda v: 255 if v > 200 else 0)
    img.paste(INK, (int(x), int(y)), ink)


class Panel:
    def __init__(self, img, box):
        self.img, self.box = img, [int(v) for v in box]
        self.d = ImageDraw.Draw(img)
        x0, y0, x1, y1 = self.box
        self.w, self.h, self.cx, self.cy = x1 - x0, y1 - y0, (x0 + x1) / 2, (y0 + y1) / 2

    def clip(self):
        """Draw into an off-screen panel so nothing spills over the gutters."""
        layer = Image.new('L', (self.w, self.h), PAPER)
        return layer, ImageDraw.Draw(layer)

    def paste(self, layer):
        self.img.paste(layer, self.box[:2])
        self.d.rectangle(self.box, outline=INK, width=4)


# ------------------------------------------------------------------ characters
def hero(d, cx, cy, s=1.0, mood='fierce', flip=False):
    """ハヤテ: the serial's hero. Spiky hair, headband, a scar over one brow."""
    k = -1 if flip else 1
    spikes = [(0, -95), (-30, -150), (-18, -95), (-75, -125), (-45, -70), (-95, -60), (-48, -35), (48, -35), (95, -60), (45, -70), (75, -125), (18, -95), (30, -150)]
    d.polygon([(cx + k * x * s, cy + y * s) for x, y in spikes], fill=INK)
    d.ellipse([cx - 52 * s, cy - 70 * s, cx + 52 * s, cy + 50 * s], fill=PAPER, outline=INK, width=3)
    d.rectangle([cx - 54 * s, cy - 50 * s, cx + 54 * s, cy - 36 * s], fill=INK)  # headband
    d.line([(cx + k * 40 * s, cy - 42 * s), (cx + k * 70 * s, cy - 30 * s)], fill=INK, width=int(6 * s))
    for side in (-1, 1):
        ex = cx + side * 22 * s
        if mood == 'fierce':
            d.polygon([(ex - 16 * s * side, cy - 14 * s), (ex + 12 * s * side, cy - 4 * s), (ex - 14 * s * side, cy + 2 * s)], fill=INK)
        elif mood == 'shock':
            d.ellipse([ex - 11 * s, cy - 16 * s, ex + 11 * s, cy + 6 * s], fill=PAPER, outline=INK, width=3)
            d.ellipse([ex - 3 * s, cy - 8 * s, ex + 3 * s, cy - 2 * s], fill=INK)
        else:
            d.arc([ex - 12 * s, cy - 14 * s, ex + 12 * s, cy + 4 * s], 200, 340, fill=INK, width=4)
    if mood == 'shock':
        d.ellipse([cx - 10 * s, cy + 18 * s, cx + 10 * s, cy + 36 * s], fill=INK)
    else:
        d.line([(cx - 16 * s, cy + 26 * s), (cx + 14 * s, cy + 22 * s)], fill=INK, width=4)
    d.line([(cx - k * 30 * s, cy - 30 * s), (cx - k * 14 * s, cy - 20 * s)], fill=INK, width=3)  # scar


def rival(d, cx, cy, s=1.0):
    """黒潮: the masked rival. Half mask, long hair."""
    d.polygon([(cx - 70 * s, cy - 60 * s), (cx + 70 * s, cy - 60 * s), (cx + 90 * s, cy + 120 * s), (cx - 90 * s, cy + 120 * s)], fill=INK)
    d.ellipse([cx - 50 * s, cy - 75 * s, cx + 50 * s, cy + 45 * s], fill=PAPER, outline=INK, width=3)
    d.chord([cx - 50 * s, cy - 75 * s, cx + 50 * s, cy + 45 * s], 180, 360, fill=(90))
    for side in (-1, 1):
        d.polygon([(cx + side * 34 * s, cy - 22 * s), (cx + side * 8 * s, cy - 14 * s), (cx + side * 30 * s, cy - 10 * s)], fill=PAPER)
    d.line([(cx - 12 * s, cy + 22 * s), (cx + 14 * s, cy + 18 * s)], fill=INK, width=3)


def thuan(d, cx, cy, s=1.0, face='smile'):
    """Thuan in chibi: a black bob, sakura pin, pink apron."""
    d.rounded_rectangle([cx - 34 * s, cy + 30 * s, cx + 34 * s, cy + 110 * s], radius=int(14 * s), fill=200, outline=INK, width=3)
    d.rectangle([cx - 20 * s, cy + 40 * s, cx + 20 * s, cy + 100 * s], fill=235, outline=INK, width=2)
    d.chord([cx - 46 * s, cy - 52 * s, cx + 46 * s, cy + 46 * s], 160, 380, fill=INK)
    d.ellipse([cx - 38 * s, cy - 36 * s, cx + 38 * s, cy + 40 * s], fill=PAPER, outline=INK, width=3)
    d.rectangle([cx - 40 * s, cy - 40 * s, cx + 40 * s, cy - 12 * s], fill=INK)
    d.ellipse([cx + 22 * s, cy - 30 * s, cx + 36 * s, cy - 16 * s], fill=PAPER, outline=INK, width=2)
    for side in (-1, 1):
        ex = cx + side * 15 * s
        if face == 'smile':
            d.arc([ex - 8 * s, cy - 4 * s, ex + 8 * s, cy + 8 * s], 200, 340, fill=INK, width=3)
        elif face == 'flat':
            d.line([(ex - 7 * s, cy + 2 * s), (ex + 7 * s, cy + 2 * s)], fill=INK, width=3)
        else:
            d.ellipse([ex - 4 * s, cy - 2 * s, ex + 4 * s, cy + 8 * s], fill=INK)
    if face == 'smile':
        d.arc([cx - 9 * s, cy + 12 * s, cx + 9 * s, cy + 26 * s], 20, 160, fill=INK, width=3)
    elif face == 'tired':
        for i in range(3):
            d.line([(cx + 28 * s + i * 7 * s, cy - 50 * s), (cx + 22 * s + i * 7 * s, cy - 34 * s)], fill=INK, width=2)
        d.line([(cx - 6 * s, cy + 20 * s), (cx + 6 * s, cy + 20 * s)], fill=INK, width=3)
    else:
        d.line([(cx - 6 * s, cy + 20 * s), (cx + 6 * s, cy + 20 * s)], fill=INK, width=3)


def jagabo(d, cx, cy, s=1.0, eyes=((-1, -1), (1, 1))):
    """Jaga-bō, the crisps mascot: a lumpy potato with mismatched googly eyes."""
    pts = []
    for i in range(36):
        a = i / 36 * math.tau
        r = 1 + .07 * math.sin(a * 5)
        pts.append((cx + math.cos(a) * 46 * s * r, cy + math.sin(a) * 58 * s * r))
    d.polygon(pts, fill=215, outline=INK, width=3)
    for (ox, oy, r), (px, py) in zip(((-16, -14, 15), (16, -10, 10)), eyes):
        x, y = cx + ox * s, cy + oy * s
        d.ellipse([x - r * s, y - r * s, x + r * s, y + r * s], fill=PAPER, outline=INK, width=3)
        d.ellipse([x + px * r * .4 * s - 4 * s, y + py * r * .4 * s - 4 * s, x + px * r * .4 * s + 4 * s, y + py * r * .4 * s + 4 * s], fill=INK)
    d.arc([cx - 22 * s, cy + 2 * s, cx + 22 * s, cy + 34 * s], 20, 160, fill=INK, width=3)
    d.rectangle([cx - 2 * s, cy + 30 * s, cx + 6 * s, cy + 38 * s], fill=PAPER, outline=INK, width=2)


def plant(d, cx, cy, s=1.0, tall=1.0, tag=True):
    """副店長, the assistant manager: Thuan's rubber plant, with its name tag."""
    d.polygon([(cx - 26 * s, cy), (cx + 26 * s, cy), (cx + 18 * s, cy + 44 * s), (cx - 18 * s, cy + 44 * s)], fill=150, outline=INK, width=3)
    top = cy - 90 * s * tall
    d.line([(cx, cy), (cx, top)], fill=INK, width=int(4 * s))
    for i in range(6):
        y = cy - (15 + i * 14) * s * tall
        side = -1 if i % 2 else 1
        d.ellipse([cx + side * 4 * s - (0 if side > 0 else 30 * s), y - 9 * s, cx + side * 4 * s + (30 * s if side > 0 else 0), y + 9 * s], fill=110, outline=INK, width=2)
    if tag:
        d.rectangle([cx - 20 * s, cy + 12 * s, cx + 20 * s, cy + 26 * s], fill=PAPER, outline=INK, width=2)
        d.text((cx, cy + 19 * s), 'Assistant Manager', font=font(max(9, int(10 * s))), fill=INK, anchor='mm')


def kid(d, cx, cy, s=1.0, face='open'):
    """A local kid in a baseball cap."""
    d.rounded_rectangle([cx - 28 * s, cy + 30 * s, cx + 28 * s, cy + 96 * s], radius=int(10 * s), fill=PAPER, outline=INK, width=3)
    d.ellipse([cx - 32 * s, cy - 30 * s, cx + 32 * s, cy + 36 * s], fill=PAPER, outline=INK, width=3)
    d.chord([cx - 34 * s, cy - 40 * s, cx + 34 * s, cy + 10 * s], 180, 360, fill=INK)
    d.rectangle([cx, cy - 18 * s, cx + 46 * s, cy - 10 * s], fill=INK)
    for side in (-1, 1):
        d.ellipse([cx + side * 13 * s - 4 * s, cy - 2 * s, cx + side * 13 * s + 4 * s, cy + 8 * s], fill=INK)
    if face == 'open':
        d.ellipse([cx - 7 * s, cy + 14 * s, cx + 7 * s, cy + 26 * s], fill=INK)
    else:
        d.arc([cx - 9 * s, cy + 10 * s, cx + 9 * s, cy + 24 * s], 20, 160, fill=INK, width=3)


def cat(d, cx, cy, s=1.0):
    """Tama, the ginger cat (grey on the page)."""
    d.ellipse([cx - 34 * s, cy - 10 * s, cx + 34 * s, cy + 40 * s], fill=170, outline=INK, width=3)
    d.ellipse([cx - 24 * s, cy - 44 * s, cx + 24 * s, cy], fill=170, outline=INK, width=3)
    for side in (-1, 1):
        d.polygon([(cx + side * 22 * s, cy - 30 * s), (cx + side * 20 * s, cy - 56 * s), (cx + side * 6 * s, cy - 40 * s)], fill=170, outline=INK)
        d.arc([cx + side * 9 * s - 6 * s, cy - 28 * s, cx + side * 9 * s + 6 * s, cy - 18 * s], 200, 340, fill=INK, width=3)
    d.line([(cx + 34 * s, cy + 20 * s), (cx + 58 * s, cy - 8 * s)], fill=INK, width=int(5 * s))


def counter(d, box, y):
    x0, _, x1, _ = box
    d.rectangle([x0, y, x1, y + 14], fill=180, outline=INK, width=2)


# ------------------------------------------------------------- 風雲児ハヤテ
# Each chapter: four pages, each a list of panels (fractions of the page) with what is in
# them. Pages read right to left, top to bottom, as manga do.
CHAPTERS = [
    ('Episode 1 The man from the southern sea', [
        [((0, 0, 1, .42), 'sea', 'On the island…\nArrived', None), ((.5, .42, 1, 1), 'hero', 'Here\nMinato town?', 'calm'), ((0, .42, .5, 1), 'kid', 'Brother\nWho?', None)],
        [((0, 0, 1, .5), 'rival', 'Hayate…\nDid you come?', None), ((.45, .5, 1, 1), 'hero', 'Kuroshio!', 'shock'), ((0, .5, .45, 1), 'sfx', 'That', None)],
        [((0, 0, 1, .55), 'clash', 'Dododo', None), ((0, .55, 1, 1), 'hero', 'It\'s a game!', 'fierce')],
        [((0, 0, .5, .5), 'kid', 'Good luck\nBrother!', None), ((.5, 0, 1, .5), 'hero', 'Leave it to me', 'calm'), ((0, .5, 1, 1), 'next', 'Next issue\nStorm Duel', None)],
    ]),
    ('Episode 2 Storm Duel', [
        [((0, 0, 1, .4), 'storm', 'Gooooooo', None), ((.5, .4, 1, 1), 'rival', 'In this storm\nThere is no escape', None), ((0, .4, .5, 1), 'hero', 'Hmph', 'calm')],
        [((0, 0, 1, .6), 'clash', 'Bucky', None), ((0, .6, .55, 1), 'hero', 'Damn it…', 'shock'), ((.55, .6, 1, 1), 'sfx', 'Zuzaza', None)],
        [((0, 0, .5, 1), 'hero', 'Wind…\nPower!', 'fierce'), ((.5, 0, 1, .5), 'sea', '', None), ((.5, .5, 1, 1), 'sfx', 'Huoooh', None)],
        [((0, 0, 1, .6), 'clash', 'Gale slash!', None), ((0, .6, 1, 1), 'next', 'Next issue\nTime of Awakening', None)],
    ]),
    ('Episode 3 Time of Awakening', [
        [((0, 0, .5, .5), 'hero', 'This power is…', 'shock'), ((.5, 0, 1, .5), 'kid', 'Brother\'s\nMy hair shines!', None), ((0, .5, 1, 1), 'aura', 'Kiin', None)],
        [((0, 0, 1, .45), 'rival', 'Idiot…！', None), ((0, .45, 1, 1), 'clash', 'Doon', None)],
        [((.5, 0, 1, 1), 'hero', 'Everyone on the island\nProtect it', 'fierce'), ((0, 0, .5, .5), 'sea', '', None), ((0, .5, .5, 1), 'kid', 'Yeah!', None)],
        [((0, 0, 1, .55), 'aura', 'Gogogogo', None), ((0, .55, 1, 1), 'next', 'Next issue\nFinal battle', None)],
    ]),
    ('Episode 4 Final battle', [
        [((0, 0, 1, .4), 'storm', '', None), ((0, .4, .5, 1), 'rival', 'It\'s over\nHayate', None), ((.5, .4, 1, 1), 'hero', 'Not yet!', 'fierce')],
        [((0, 0, 1, .7), 'clash', 'Wind cloud\nGale slash', None), ((0, .7, 1, 1), 'sfx', 'Zudwon', None)],
        [((0, 0, 1, .5), 'sea', 'It\'s morning…', None), ((.5, .5, 1, 1), 'rival', 'Stunning…', None), ((0, .5, .5, 1), 'hero', 'Again\nLet\'s meet', 'calm')],
        [((0, 0, 1, .55), 'kid', 'Brother\nCool!', None), ((0, .55, 1, 1), 'next', 'Part 1\nComplete', None)],
    ]),
]


def draw_chapter_page(chapter, page_no):
    title, pages = CHAPTERS[chapter]
    img = Image.new('L', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    m, g = 26, 12
    top = 26
    if page_no == 0:  # chapter title strip down the right edge
        d.rectangle([W - 74, 26, W - 26, H - 60], fill=INK)
        d.text((W - 50, (H - 34) / 2), 'HAYATE', font=font(13), fill=PAPER, anchor='mm')
        right = W - 86
    else:
        right = W - m
    for (fx0, fy0, fx1, fy1), kind, text, mood in pages[page_no]:
        x0 = m + fx0 * (right - m) + (g / 2 if fx0 > 0 else 0)
        x1 = m + fx1 * (right - m) - (g / 2 if fx1 < 1 else 0)
        y0 = top + fy0 * (H - top - 60) + (g / 2 if fy0 > 0 else 0)
        y1 = top + fy1 * (H - top - 60) - (g / 2 if fy1 < 1 else 0)
        p = Panel(img, (x0, y0, x1, y1))
        layer, ld = p.clip()
        cx, cy = p.w / 2, p.h / 2
        seed = chapter * 100 + page_no * 10 + int(fx0 * 10 + fy0 * 3)
        if kind == 'sea':
            tone(layer, (0, int(p.h * .55), p.w, p.h), 5, 1.2)
            ld.line([(0, p.h * .55), (p.w, p.h * .55)], fill=INK, width=3)
            ld.rectangle([p.w * .7, p.h * .2, p.w * .74, p.h * .55], fill=PAPER, outline=INK, width=3)
            ld.ellipse([p.w * .1, p.h * .12, p.w * .1 + 50, p.h * .12 + 50], outline=INK, width=3)
            for i in range(5):
                ld.arc([p.w * .1 + i * 70, p.h * .62 + (i % 2) * 20, p.w * .1 + i * 70 + 40, p.h * .62 + (i % 2) * 20 + 14], 180, 360, fill=INK, width=2)
        elif kind == 'storm':
            tone(layer, (0, 0, p.w, p.h), 4, 1.6)
            rnd = random.Random(seed)
            for i in range(60):
                x = rnd.random() * p.w
                y = rnd.random() * p.h
                ld.line([(x, y), (x - 30, y + 60)], fill=PAPER, width=2)
        elif kind in ('hero', 'rival', 'kid'):
            speed_lines(ld, (0, 0, p.w, p.h), cx, cy + 20, 50 if kind != 'kid' else 0, seed)
            s = min(p.w, p.h) / 300
            if kind == 'hero':
                hero(ld, cx, cy + 30 * s, s * 1.1, mood or 'fierce', flip=bool(seed % 2))
            elif kind == 'rival':
                tone(layer, (0, 0, p.w, p.h), 7, 1.2)
                rival(ld, cx, cy, s * 1.1)
            else:
                kid(ld, cx, cy, s * 1.2)
        elif kind == 'clash':
            speed_lines(ld, (0, 0, p.w, p.h), cx, cy, 120, seed, .08)
            ld.ellipse([cx - 60, cy - 60, cx + 60, cy + 60], fill=PAPER)
            hero(ld, cx - p.w * .22, cy + 20, .8, 'fierce')
            rival(ld, cx + p.w * .25, cy - 10, .75)
        elif kind == 'aura':
            for i in range(10):
                r = 30 + i * 28
                ld.ellipse([cx - r, cy - r * 1.2, cx + r, cy + r * 1.2], outline=INK, width=2 if i % 2 else 4)
            hero(ld, cx, cy + 20, .9, 'fierce')
        elif kind == 'sfx':
            speed_lines(ld, (0, 0, p.w, p.h), cx, cy, 90, seed, .05)
        elif kind == 'next':
            ld.rectangle([0, 0, p.w, p.h], fill=INK)
        p.paste(layer)
        if kind in ('clash', 'aura', 'sfx', 'storm') and text:
            sfx(d, x0 + 18, y0 + 18, text.replace('\n', ''), 54 if kind != 'storm' else 44, -8 if seed % 2 else 8, img)
        elif kind == 'next':
            vtext(d, (x0 + x1) / 2 + 20, y0 + 30, text, 40, fill=PAPER)
        elif text:
            bubble(d, x0 + (x1 - x0) * (.78 if seed % 2 else .24), y0 + 26 + vsize(text, 22)[1] / 2 + 10, text, 22, shout='！' in text)
    d.text((W / 2, H - 30), f'Hayate: Island Adventures — {page_no + 1}', font=font(16), fill=INK, anchor='mm')
    return img


# --------------------------------------------------------- サクラ商店4コマ
# Gag strips: four panels each, top to bottom. Each panel: (scene, [(who, line), ...]).
GAGS = [
    ('Assistant Manager', [
        ('shop', [('thuan', 'Assistant Manager\nGood morning')]),
        ('plant', []),
        ('shop', [('kid', 'For plants\nGreetings?')]),
        ('shop', [('thuan', 'Don\'t be late\nHe\'s the only one')]),
    ]),
    ('Jagabo', [
        ('jagabo', [('kid', 'Stroke')]),
        ('jagabo_rattle', []),
        ('jagabo_cross', [('kid', 'Which?\nI\'m watching you! ?')]),
        ('jagabo_cross', [('sign', 'Both')]),
    ]),
    ('Oden', [
        ('shop', [('thuan', 'Oden\nStarted')]),
        ('shop', [('kid', 'Radish\nPlease')]),
        ('shop', [('thuan', 'Not yet\nNot cooked')]),
        ('sign', [('sign', 'Oden\nAbout to start\nYes.')]),
    ]),
    ('Browse', [
        ('rack', [('kid', '…')]),
        ('rack_evening', [('kid', '…')]),
        ('shop', [('thuan', 'Welcome to browse…\nAlthough I wrote that')]),
        ('rack_evening', [('kid', 'Next issue\nWhen?')]),
    ]),
    ('Mirror', [
        ('mirror', [('kid', 'To the mirror\nThe cat…')]),
        ('street', [('kid', 'Not there')]),
        ('mirror', [('kid', 'As expected\nThere is')]),
        ('cat_top', [('cat', 'Nya')]),
    ]),
    ('Typhoon', [
        ('shop', [('kid', 'Even in a typhoon\nIs it open?')]),
        ('shop', [('thuan', 'Convenience store\n24It\'s time')]),
        ('storm', []),
        ('shop_cards', [('thuan', '…Said\nIt was planned.')]),
    ]),
    ('Stamp card', [
        ('shop', [('kid', 'Stamp\n10Pieces!')]),
        ('shop', [('thuan', 'Tea1items\nPlease')]),
        ('shop', [('kid', 'Card\nAlready1pieces')]),
        ('shop_tired', [('thuan', '…Yes')]),
    ]),
    ('Promotion', [
        ('plant', [('thuan', 'Assistant Manager\nPromotion')]),
        ('plant_tall', []),
        ('shop', [('kid', 'What is your salary?')]),
        ('plant_tall', [('thuan', 'Water')]),
    ]),
]


def draw_gag_panel(img, box, scene, lines, seed):
    p = Panel(img, box)
    layer, ld = p.clip()
    w, h = p.w, p.h
    s = h / 200
    floor = h * .86
    if scene in ('shop', 'shop_tired', 'shop_cards', 'sign'):
        tone(layer, (0, 0, w, h * .3), 8, 1)
        counter(ld, (0, 0, w, 0), floor - 40 * s)
        if scene == 'sign':
            thuan(ld, w * .28, h * .4, s * .75, 'flat')
        elif scene == 'shop_cards':
            thuan(ld, w * .3, h * .35, s * .8, 'flat')
            kid(ld, w * .72, h * .4, s * .8, 'smile')
            for i in range(4):
                ld.rectangle([w * .4 + i * 18, floor - 30 * s, w * .4 + i * 18 + 14, floor - 10 * s], fill=PAPER, outline=INK, width=2)
        else:
            who = [n for n, _ in lines]
            if 'kid' in who:
                kid(ld, w * .8, h * .5, s * .7)
                thuan(ld, w * .2, h * .44, s * .7, 'flat')
            else:
                thuan(ld, w * .5, h * .32, s * .9, 'tired' if scene == 'shop_tired' else 'smile')
    elif scene in ('plant', 'plant_tall'):
        plant(ld, w * .5, h * .55, s * 1.1, tall=1.8 if scene == 'plant_tall' else 1.0)
        if scene == 'plant_tall':
            for i in range(6):
                a = i / 6 * math.tau
                ld.line([(w * .5 + math.cos(a) * 60 * s, h * .3 + math.sin(a) * 60 * s), (w * .5 + math.cos(a) * 75 * s, h * .3 + math.sin(a) * 75 * s)], fill=INK, width=3)
        if lines:
            thuan(ld, w * .2, h * .35, s * .7, 'smile')
    elif scene.startswith('jagabo'):
        eyes = {'jagabo': ((-1, 1), (1, 1)), 'jagabo_rattle': ((1, -1), (-1, 1)), 'jagabo_cross': ((-1, 0), (1, 0))}[scene]
        jagabo(ld, w * .55, h * .48, s * 1.1, eyes)
        if scene == 'jagabo_rattle':
            for i in range(5):
                ld.arc([w * .2 + i * 8, h * .2, w * .9 - i * 8, h * .8], 300, 340, fill=INK, width=2)
        if lines and lines[0][0] == 'kid':
            kid(ld, w * .18, h * .45, s * .7)
    elif scene in ('rack', 'rack_evening'):
        if scene == 'rack_evening':
            tone(layer, (0, 0, w, h), 5, 1.6)
        for i in range(3):
            ld.rectangle([w * .5 + i * 26, h * .2, w * .5 + i * 26 + 22, h * .5], fill=PAPER, outline=INK, width=2)
        kid(ld, w * .3, h * .4, s * .85)
    elif scene in ('mirror', 'street', 'cat_top'):
        ld.line([(w * .62, h * .5), (w * .62, floor)], fill=INK, width=4)
        ld.ellipse([w * .5, h * .14, w * .74, h * .5], fill=PAPER, outline=INK, width=4)
        if scene == 'mirror':
            cat(ld, w * .62, h * .36, s * .4)
        if scene == 'cat_top':
            cat(ld, w * .62, h * .1, s * .5)
        kid(ld, w * .24, h * .45, s * .8, 'open')
    elif scene == 'storm':
        tone(layer, (0, 0, w, h), 4, 1.6)
        rnd = random.Random(seed)
        for i in range(40):
            x, y = rnd.random() * w, rnd.random() * h
            ld.line([(x, y), (x - 26, y + 40)], fill=PAPER, width=2)
        ld.rectangle([w * .25, h * .35, w * .75, floor], fill=PAPER, outline=INK, width=3)
        for i in range(8):
            ld.line([(w * .25, h * .35 + i * 12), (w * .75, h * .35 + i * 12)], fill=INK, width=1)
    ld.line([(0, floor), (w, floor)], fill=INK, width=2)
    p.paste(layer)
    x0, y0, x1, y1 = p.box
    for i, (who, line) in enumerate(lines):
        d = img_draw(img)
        if who == 'sign':
            # A hand-lettered card on a stick, at the side of the panel.
            tw, th = vsize(line, 22)
            bx = x1 - 26 - tw
            d.line([(bx + tw / 2, y0 + th + 40), (bx + tw / 2, y1 - 8)], fill=INK, width=4)
            d.rectangle([bx - 10, y0 + 14, bx + tw + 10, y0 + th + 40], fill=PAPER, outline=INK, width=3)
            vtext(d, bx + tw - 11, y0 + 26, line, 22)
            continue
        # Over the speaker: the kid stands right, Thuan left (centre when she is alone).
        alone = len({n for n, _ in lines}) == 1 and scene in ('shop', 'shop_tired')
        side = {'kid': .84 if scene.startswith('jagabo') else .62, 'cat': .3}.get(who, .5 if alone else .42)
        if alone and who == 'thuan':
            side = .2
        bubble(d, x0 + (x1 - x0) * side, y0 + 12 + vsize(line, 17)[1] / 2 + 6, line, 17, shout='！' in line)


def img_draw(img):
    return ImageDraw.Draw(img)


def draw_gag_page(index):
    """Two strips side by side, the right one first, as a 4-koma page is read."""
    img = Image.new('L', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 64], fill=INK)
    d.text((W / 2, 32), 'Sakura Shop Comics', font=font(30), fill=PAPER, anchor='mm')
    col_w = (W - 26 * 3) / 2
    for strip in range(2):
        title, panels = GAGS[(index * 2 + strip) % len(GAGS)]
        x1 = W - 26 - strip * (col_w + 26)
        x0 = x1 - col_w
        d.text(((x0 + x1) / 2, 88), f'"{title}"', font=font(22), fill=INK, anchor='mm')
        ph = (H - 110 - 50 - 3 * 10) / 4
        for i, (scene, lines) in enumerate(panels):
            y0 = 110 + i * (ph + 10)
            draw_gag_panel(img, (x0, y0, x1, y0 + ph), scene, lines, index * 10 + strip * 4 + i)
    d.text((W / 2, H - 26), 'Writing/Illustration Minato Shopping District Manga Study Group', font=font(15), fill=INK, anchor='mm')
    return img


# ------------------------------------------------------- セルアニメ posters
POSTERS = [
    ('Mobile Sea God Minato', ((240, 120, 60), (40, 30, 90)), (155, 93, 229)),
    ('Spaceship Shisa', ((10, 20, 60), (60, 20, 90)), (239, 71, 111)),
    ('Stardust Academy', ((255, 190, 120), (240, 100, 140)), (58, 196, 242)),
    ('Magical Girl Goya', ((170, 230, 170), (40, 140, 90)), (255, 183, 3)),
]


def draw_poster(index):
    name, (top, bottom), acc = POSTERS[index]
    img = Image.new('RGB', (W, H), top)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    rnd = random.Random(index)
    for i in range(80):
        x, y = rnd.random() * W, rnd.random() * H * .6
        r = rnd.random() * 2 + .5
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 250, 220))
    cx, cy = W / 2, H * .52
    if index in (0, 1):  # a giant robot, front on
        d.polygon([(cx, cy - 260), (cx + 120, cy - 120), (cx + 90, cy + 120), (cx - 90, cy + 120), (cx - 120, cy - 120)], fill=acc, outline=(20, 20, 30), width=8)
        d.rectangle([cx - 20, cy - 150, cx + 20, cy - 60], fill=(94, 240, 138), outline=(20, 20, 30), width=4)
        d.polygon([(cx, cy - 260), (cx - 18, cy - 320), (cx + 18, cy - 320)], fill=(255, 224, 102), outline=(20, 20, 30))
        for side in (-1, 1):
            d.polygon([(cx + side * 120, cy - 120), (cx + side * 220, cy - 60), (cx + side * 200, cy + 40), (cx + side * 100, cy - 20)], fill=acc, outline=(20, 20, 30), width=6)
    else:  # a heroine with a big wave of hair
        d.ellipse([cx - 170, cy - 260, cx + 170, cy + 120], fill=acc, outline=(20, 20, 30), width=6)
        d.ellipse([cx - 100, cy - 200, cx + 100, cy + 30], fill=(255, 226, 200), outline=(20, 20, 30), width=6)
        # Bangs: a cap of hair over the forehead, cut into points.
        d.chord([cx - 104, cy - 204, cx + 104, cy + 34], 180, 360, fill=acc)
        d.polygon([(cx - 104, cy - 86), (cx - 75, cy - 118), (cx - 50, cy - 86), (cx - 20, cy - 122), (cx + 5, cy - 86), (cx + 35, cy - 120), (cx + 60, cy - 86), (cx + 86, cy - 116), (cx + 104, cy - 86)], fill=acc)
        for side in (-1, 1):
            ex = cx + side * 42
            d.ellipse([ex - 26, cy - 110, ex + 26, cy - 40], fill=(255, 255, 255), outline=(20, 20, 30), width=4)
            d.ellipse([ex - 16, cy - 96, ex + 16, cy - 46], fill=acc)
            d.ellipse([ex - 6, cy - 90, ex + 6, cy - 78], fill=(255, 255, 255))
        d.arc([cx - 24, cy - 20, cx + 24, cy + 10], 20, 160, fill=(20, 20, 30), width=5)
    d.rectangle([0, H - 170, W, H], fill=(20, 20, 30))
    d.text((W / 2, H - 112), name, font=font(min(52, int(540 / max(1, font(1).getlength(name))))), fill=(255, 255, 255), anchor='mm', stroke_width=3, stroke_fill=tuple(acc))
    d.text((W / 2, H - 50), 'Monthly Cell Anime Special poster', font=font(22), fill=(255, 224, 102), anchor='mm')
    return img


def save(img, path, colours):
    img = img.convert('RGB') if img.mode != 'RGB' else img
    img.quantize(colors=colours, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)


def main():
    global FONT_PATH
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--font', help='a TrueType/OpenType font with English glyphs')
    ap.add_argument('--out', default=str(ROOT / 'assets' / 'magazines'))
    args = ap.parse_args()
    FONT_PATH = args.font or next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)
    if not FONT_PATH:
        raise SystemExit('No suitable font found; pass --font /path/to/font.ttc')
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for c in range(len(CHAPTERS)):
        for n in range(4):
            save(draw_chapter_page(c, n), out / f'hayabusa-ch{c + 1}-p{n + 1}.png', 8)
    for g in range(4):
        save(draw_gag_page(g), out / f'hayabusa-gag-{g + 1}.png', 8)
    for i in range(len(POSTERS)):
        save(draw_poster(i), out / f'celanime-poster-{i + 1}.png', 64)
    print('Wrote', len(list(out.glob('*.png'))), 'pages to', out)


if __name__ == '__main__':
    main()
