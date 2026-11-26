"""Christina's head and her hair, sculpted in Blender (tools/blender/head_sculpt.py), and her review sheets.

  python tools/blender/build-christina-head.py --root . [--sheet] [--only-sheet]

The owner, 26 November 2026, with her photograph: "This is Mrs Higa who should be renamed to Christina and she should not
have a wheelchair"; then, of the first drawing (a plain ball under a white cap): "Christina needs to look like an adorable
elderly woman not like a man, redraw all their heads they need to be drawn in Blender". She owns Umi-no-yu and keeps
Kissa Higa. From the photograph, as a cartoon of a grandmother everybody would want:
- THE HEAD  small and soft, wider at the cheeks than at the brow: round apple cheeks lifted by her smile, standing out of
            the face; a soft fold from the nose round each; a small round nose; a little chin under a full lower lip, and
            the soft line of an old jaw either side of it. Everything is in the mesh; the face is then painted on it.
- THE HAIR  white, in soft set curls: full round the face and over the ears to the jaw, curled on to the forehead, each
            curl a round lobe with a valley between it and the next, close at the nape.
Writes src/avatars/sculpts/kindly-head.js (head form 'kindly') and softwave-hair.js (hair style 'softwave'), and
art/characters/christina/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, plateau, smooth                              # noqa: E402

WIDTH, HEIGHT = .97, 1.0


def radius(x, y, z, F):
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    tb, te, tn, tm = F['brow'], F['eye'], F['nose'], F['mouth']
    side = np.abs(np.sin(np.radians(A)))
    r = np.ones_like(x)
    # The skull: a little narrow at the temples, so the cheeks are the widest of her.
    r -= .03 * bell(a - 82, 26) * bell(t - 72, 18)
    r += .035 * bell(a - 74, 30) * bell(t - 106, 18)
    # The face narrows from the cheeks to a little chin in one soft curve; the underside tucked up.
    r -= .1 * smooth(t, 108, 160) * side ** 2
    r -= .05 * smooth(t, 150, 180)
    # An old jaw's soft line either side of the chin, low: gentle, not heavy.
    r += .03 * bell(a - 42, 16) * bell(t - 136, 9)
    # The chin: small and round, a little forward.
    r += .04 * bell(a, 17) * bell(t - 146, 8)
    r += .02 * bell(a - 26, 14) * bell(t - 150, 10)
    # The face's plane a little flat, and the eyes a breath back under a soft brow.
    r -= .03 * bell(a, 44) * bell(t - (te + 4), 24)
    r += .012 * bell(t - tb, 5) * smooth(-a, -50, -28)
    for s in (-1, 1):
        r -= .02 * bell(A - s * F['eyeA'], 11) * bell(t - (te + 1), 7)
    # Apple cheeks: round, high, lifted by her smile, the roundest thing in the face.
    r += .075 * bell(a - 37, 13.5) * bell(t - (tn + 1.5), 10.5)
    # The fold from the nose round each cheek to the mouth's corner: where the cheek ends.
    for s in (-1, 1):
        fold = s * (15 + 9 * smooth(t, tn - 4, tm + 4))
        r -= .02 * bell(A - fold, 3.2) * plateau(t - (tn + tm) / 2 - 1, 9)
    # The nose: a soft bridge and a small round tip, a little turned up (its line is drawn on the face: a sharp step
    # would be caught by the ink in dashes).
    r += .012 * bell(A, 5.2) * smooth(t, te - 4, te + 3) * (1 - smooth(t, tn - 2.5, tn + 1.5))
    r += .06 * bell(a, 8.2) * bell(t - (tn - 1.4), 5.6)
    # The mouth's ground, and a full lower lip.
    r += .02 * bell(a, 15) * bell(t - (tm - 1), 6.5)
    r += .014 * bell(a, 10) * bell(t - (tm + 3.5), 3.5)
    return r


def points(x, y, z, F):
    r = radius(x, y, z, F)
    return x * r, y * r, z * r


# ---------------------------------------------------------------------------- her hair: soft set curls
EDGE = ([0, 22, 42, 58, 72, 92, 120, 150, 180], [53, 54, 60, 76, 100, 124, 127, 124, 121])   # the hairline: a from the front, t down to it


def hair_field(A, t):
    a = np.abs(A)
    curls = 4.6 * np.cos(np.radians(A * 9.0 + 20)) * (1 - smooth(a, 100, 130))   # the hairline is the curls' own edge
    return np.interp(a, *EDGE) + curls - t


def hair_height(A, t):
    a = np.abs(A)
    f = hair_field(A, t)
    h = .125 + .035 * smooth(t, 10, 45)
    h += .06 * np.exp(-((a - 90) / 32) ** 2 - ((t - 92) / 28) ** 2)          # full round the face, over the ears
    h += .03 * np.exp(-(a / 40) ** 2 - ((t - 42) / 14) ** 2)                 # and over the forehead
    h -= .05 * smooth(t, 104, 126) * bell(a - 180, 70)                       # close at the nape
    # The curls: round lobes with a valley between each and the next, in rows round the head, each row set half a curl
    # round from the one above it; smaller over the crown.
    row = (t - 18) / 30.0
    turn = A + 22.5 * np.floor(row)
    lobe = (np.abs(np.cos(np.radians(turn * 4.0))) ** .55) * (np.abs(np.sin(np.pi * row)) ** .55)
    h += .095 * (lobe - .55) * smooth(t, 22, 46)
    h = .03 + (h - .03) * smooth(f, 0, 9)                                    # thin at the hairline: an edge, not a step
    return np.where(f > 0, h, .02)


# Her eye: round and kind, wider than tall; the upper lid lowered a little and sloping down at the outer corner, the
# lower lid lifted flat by her cheek as she smiles; a big soft iris; lashes.
EYE = dict(rx=11.6, ry=11.0, topAmp=11.4, botAmp=7.2, pTop=.55, pBot=.7, cut=.1, slant=-.14, irx=7.7, iry=7.7, iy=-.4,
           pupil=.45, lash=3.2, flick=4.2, lower=0, lashes=1, highlight=1.15, lidShadow=1)

CONFIG = {'eye': EYE, 'name': 'Christina', 'slug': 'christina', 'form': 'kindly', 'const': 'KINDLY_HEAD', 'width': WIDTH, 'height': HEIGHT, 'points': points, 'melt': 8}


def with_hair(F):
    def ride(x, y, z):
        px, py, pz = points(x, y, z, F)
        return np.sqrt(px * px + py * py + pz * pz)
    return [H.hair_shell('ChristinaHairSculpt', 'SOFTWAVE_HAIR', 'softwave', hair_field, hair_height, ride)]


CONFIG['extra'] = with_hair
H.run(CONFIG)
