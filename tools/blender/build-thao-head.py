"""Thao's head and her hair, sculpted in Blender (tools/blender/head_sculpt.py), and her review sheets.

  python tools/blender/build-thao-head.py --root . [--sheet] [--only-sheet]     (bpy 5.x from pip; or blender -b --python ... --)

The owner, 26 November 2026, with her photograph: "This is Thao but cartoon Thao should wear short pants".
Thao runs Minato Izakaya; she is the middle sister (Nhung, Thao, Thuan) and Vy's mother. From the photograph, as a cartoon:
- THE HEAD  a long, serene oval, longer and narrower than her sister Thuan's: a high clear forehead, soft cheekbones, the
            face narrowing in one curve to a small chin. Her nose is the body kit's (a small straight one).
- THE HAIR  tied back off the forehead, close to the head, with the faintest centre parting; cut round the ears, which
            show; and a low round bun at the nape.
Writes src/avatars/sculpts/serene-head.js (head form 'serene') and tiedback-hair.js (hair style 'tiedback'), and
art/characters/thao/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, plateau, smooth                              # noqa: E402

# The head's half-axes as multiples of its radius (the game keeps its depth at 0.98): a long oval.
WIDTH, HEIGHT = .9, 1.12


def radius(x, y, z, F):
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    te, tn, tm = F['eye'], F['nose'], F['mouth']
    side = np.abs(np.sin(np.radians(A)))
    r = np.ones_like(x)
    r += .018 * bell(a - 78, 30) * bell(t - 96, 18)                          # soft cheekbones
    r -= .062 * smooth(t, 100, 160) * side ** 2                              # one curve down to the chin: an oval, never a kite
    r -= .055 * smooth(t, 150, 180)                                          # the underside tucked up: a round end
    r += .03 * bell(a - 50, 22) * bell(t - 132, 14)                          # the jaw's line kept full
    r += .034 * bell(a - 36, 20) * bell(t - 151, 12)                         # and the chin's sides: round, not a point
    r -= .028 * bell(a, 44) * bell(t - (te + 4), 26)                         # the face a little flat
    r += .02 * bell(a - 40, 15) * bell(t - (tn + 7), 12)                     # cheeks
    r += .016 * bell(a, 11) * bell(t - (tm + .5), 5)                         # the lips
    r += .008 * bell(t - F['brow'], 5) * smooth(-a, -50, -28)                # the faintest brow
    for s in (-1, 1):
        r -= .01 * bell(A - s * F['eyeA'], 11) * bell(t - (te + 1), 7)
    return r


def points(x, y, z, F):
    r = radius(x, y, z, F)
    return x * r, y * r, z * r


# ---------------------------------------------------------------------------- her hair, tied back
EDGE = ([0, 7, 16, 30, 45, 62, 72, 84, 100, 130, 180], [47, 50.5, 52, 54, 61, 71, 85, 87, 106, 116, 119])   # the hairline: a from the front, t down to it


def hair_parts(A, t):
    a = np.abs(A)
    main = np.interp(a, *EDGE) - t
    ear = (np.hypot((a - 89) / 12.5, (t - 94) / 14.5) - 1) * 12.5            # cut round the ear
    # (No loose wisps: drawn, they were two hard strips down her cheeks. The temple's own hairline comes down in front of
    # the ear instead, as hair tied back does.)
    wisp = np.full_like(main, -1.0)
    return main, ear, wisp


def hair_field(A, t):
    main, ear, wisp = hair_parts(A, t)
    return np.maximum(np.minimum(main, ear), wisp)


def hair_height(A, t):
    a = np.abs(A)
    main, ear, wisp = hair_parts(A, t)
    close = .05 + .014 * smooth(t, 20, 60) - .012 * bell(A, 3.5) * smooth(-t, -64, -34)    # close to the head; a faint parting
    back = (180 - a) * np.sin(np.radians(t))
    bun = .3 * np.exp(-((back / 11.5) ** 2 + ((t - 108) / 10) ** 2) ** 1.5)    # a low round bun at the nape
    return np.where(np.minimum(main, ear) > 0, close + bun, .02)


# Her eye: long and narrow, coming to a point at each end, its outer corner a little lifted; a clean dark lash line
# with a flick; a dark iris.
EYE = dict(rx=12.6, ry=8.4, topAmp=7.0, botAmp=5.0, pTop=1, pBot=1, corner=1.7, off=.5, cut=.05, slant=0, irx=7.0, iry=7.0, iy=-.2,
           pupil=.5, lash=3.4, flick=4.6, lower=0, highlight=1, lidShadow=1, warmIris=1)

CONFIG = {'eye': EYE, 'name': 'Thao', 'slug': 'thao', 'form': 'serene', 'const': 'SERENE_HEAD', 'width': WIDTH, 'height': HEIGHT, 'points': points, 'melt': 8}


def with_hair(F):
    def ride(x, y, z):
        px, py, pz = points(x, y, z, F)
        return np.sqrt(px * px + py * py + pz * pz)
    return [H.hair_shell('ThaoHairSculpt', 'TIEDBACK_HAIR', 'tiedback', hair_field, hair_height, ride)]


CONFIG['extra'] = with_hair
H.run(CONFIG)
