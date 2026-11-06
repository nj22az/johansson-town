"""Prints the Minato noticeboard's header plate (drawing JW-NB-003 rev A: みなと掲示板 / MINATO NOTICEBOARD) for
src/world/harbour-noticeboard.js. The plate is the case's 1480 x 80 mm header band, here at 2 px per mm.

    python3 scripts/build-noticeboard-header.py

Font: Noto Sans CJK JP Bold (SIL Open Font License), as installed with the fonts-noto-cjk package."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'graphics', 'noticeboard', 'header.webp')
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
W, H = 2960, 160
GREEN, CREAM = (78, 104, 88), (244, 236, 214)
im = Image.new('RGB', (W, H), GREEN)
d = ImageDraw.Draw(im)
jp = ImageFont.truetype(FONT, 104, index=0)  # index 0: Japanese
en = ImageFont.truetype(FONT, 76, index=0)
a, b = 'みなと掲示板', 'MINATO NOTICEBOARD'
gap = 90
wa, wb = d.textlength(a, font=jp), d.textlength(b, font=en)
x = (W - wa - gap - wb) / 2
d.text((x, H / 2 + 4), a, font=jp, fill=CREAM, anchor='lm')
d.line([(x + wa + gap / 2, 34), (x + wa + gap / 2, H - 34)], fill=CREAM, width=5)
d.text((x + wa + gap, H / 2 + 6), b, font=en, fill=CREAM, anchor='lm')
im.save(OUT, quality=90, method=6)
print('header', OUT, im.size)
