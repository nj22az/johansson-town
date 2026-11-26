"""Thuan's head, sculpted in Blender (tools/blender/head_sculpt.py), and her review sheet.

  python tools/blender/build-thuan-head.py --root . [--sheet] [--only-sheet]     (bpy 5.x from pip; or blender -b --python ... --)

The owner, 26 November 2026: "When happy redraw Thuan in Blender too"; "The blender thuan is the inspiration"; then, of the
first attempt (her old kite-shaped head kept, with round doll eyes): "She looks grotesque can you use Disney art design
this is real life Thuan it should look like her but a cute cartoon", with her photograph.

So her head is designed here from the photograph on Disney's terms (appeal: soft, clear shapes; a big round cranium
over a small face; nothing angular): a heart. A full round skull, a little wide at the cheekbones; the face narrowing
in one soft curve to a small rounded chin; full cheeks low on the face; a small nose with a soft bridge and a round
tip; the mound of the lips; the faintest brow so that large painted eyes lie on a nearly flat ground.
Her painted face and her small ear are the game's (cast.js THUAN_REDRAWN, build.js).
Writes src/avatars/sculpts/gentle-head.js (the game's head form 'gentle') and art/characters/thuan/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, plateau, smooth                              # noqa: E402

WHO = {'name': 'Thuan', 'slug': 'thuan', 'form': 'gentle', 'const': 'GENTLE_HEAD'}
# The head's half-axes as multiples of its radius (the game keeps its depth at 0.98): round, a little taller than wide.
WIDTH, HEIGHT = .94, 1.07


def radius(x, y, z, F):
    """The head's radius along each unit direction (game frame), before the half-axes are applied."""
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    tb, te, tn, tm = F['brow'], F['eye'], F['nose'], F['mouth']
    side = np.abs(np.sin(np.radians(A)))                                   # 0 on the face's middle line, 1 at the ears
    r = np.ones_like(x)
    # The cranium: full and round, a touch wider at the cheekbones than at the temples.
    r += .03 * bell(a - 80, 34) * bell(t - 96, 20)
    # The face narrows from the cheekbones to the chin in one soft curve: a heart, never a kite's straight lines.
    r -= .115 * smooth(t, 84, 160) * side ** 2
    # The chin: small, round and a little forward; the jaw's underside tucked up so the face is short and young.
    r -= .035 * smooth(t, 146, 180)
    r += .028 * bell(a, 24) * bell(t - 143, 10)
    r += .03 * bell(a - 34, 20) * bell(t - 150, 13)                       # the chin's sides filled: a round end, not a point
    # A face's plane is a little flat, so large eyes read on it.
    r -= .035 * bell(a, 44) * bell(t - (te + 4), 26)
    # Full cheeks, low on the face.
    r += .04 * bell(a - 40, 15) * bell(t - (tn + 6), 12)
    # The nose: a soft bridge from between the eyes, a small round tip a little turned up, the hint of a wing each side.
    # (It is low and soft-edged on purpose: a sharp little step is caught by the game's ink line in broken dashes. Its
    # line is drawn on the face instead, clean: cast.js, the nose's 'curve'.)
    r += .012 * bell(A, 5.2) * smooth(t, te - 4, te + 3) * (1 - smooth(t, tn - 2.5, tn + 1.5))
    r += .052 * bell(a, 8.5) * bell(t - (tn - 1.6), 6.0)
    # The lips.
    r += .018 * bell(a, 11) * bell(t - (tm + .5), 5)
    # The faintest brow, and the eyes a breath back under it.
    r += .008 * bell(t - tb, 5) * smooth(-a, -50, -28)
    for s in (-1, 1):
        r -= .01 * bell(A - s * F['eyeA'], 11) * bell(t - (te + 1), 7)
    return r


def points(x, y, z, F):
    r = radius(x, y, z, F)
    return x * r, y * r, z * r


H.run({**WHO, 'width': WIDTH, 'height': HEIGHT, 'points': points, 'melt': 8})
