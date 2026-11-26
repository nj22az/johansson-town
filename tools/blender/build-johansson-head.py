"""Johansson's head, sculpted in Blender (tools/blender/head_sculpt.py), and his review sheet.

  python tools/blender/build-johansson-head.py --root . [--sheet] [--only-sheet]     (bpy 5.x from pip; or blender -b --python ... --)

The owner, 26 November 2026, with his photograph: "shift the character from cute chibi to rugged, sturdy, manly cartoon
caricature". What is sculpted: a taller, blockier skull with flat temples, a jaw that is the widest part of the head
with a corner under each ear and a squared chin, a brow ridge that overhangs recessed eye sockets, cheekbones, and a
nose with a bridge from the brow, a blunt round tip that stands forward in profile and nostril wings.
Writes src/avatars/sculpts/rugged-head.js (the game's head form 'rugged') and art/characters/johansson/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, plateau, smooth                              # noqa: E402

# The head's half-axes as multiples of its radius (the game keeps its depth at 0.98): height about 1.24 x width.
WIDTH, HEIGHT = .9, 1.12


def radius(x, y, z, F):
    """The head's radius along each unit direction (game frame), before the half-axes are applied."""
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    front = smooth(z, -.25, .45)
    low = smooth(-y, -.15, .55)
    # The skull: a rounded block. Squarer low and to the front (jaw corners, a flat face, flat temples), rounder over
    # the crown and at the back of the head.
    p = 2.3 + 1.5 * low * (.5 + .5 * front) + .5 * front * (1 - low)
    r = (np.abs(x) ** p + np.abs(y) ** p + np.abs(z) ** p) ** (-1 / p)
    # The crown comes in a little at the sides, so the head is widest at the jaw, not at the temples.
    r -= .06 * smooth(y, .05, .75) * bell(a - 90, 55)
    # Flat temples: the sides between the brow and the cheekbone drawn in.
    r -= .055 * bell(a - 84, 26) * bell(t - 80, 17)
    # The jaw: wide, with a corner under each ear, and a chin that is a squared base, not a point.
    r += .06 * bell(a - 60, 15) * bell(t - 131, 10)
    r += .045 * bell(a - 88, 28) * bell(t - 124, 13)                     # the jaw carried out at the sides, a little: strong, not heavy
    r += .07 * bell(a, 26) * bell(t - 140, 8)
    r += .03 * bell(a - 22, 9) * bell(t - 143, 7)                        # the chin's two corners
    # Cheekbones.
    r += .03 * bell(a - 37, 11) * bell(t - (F['eye'] + 10), 6)
    # The brow ridge: a bar over the eyes, heaviest toward the middle, hanging forward of the sockets under it.
    tb = F['brow']
    r += (.085 + .02 * bell(a, 12)) * bell(t - (tb + .5), 4.8) * smooth(-a, -52, -30)
    r += .022 * bell(t - (tb - 10), 10) * smooth(-a, -48, -20)             # the forehead leaning forward into it
    # The sockets: the eyes sit back under the ridge.
    for s in (-1, 1):
        r -= .058 * bell(A - s * F['eyeA'], 10.5) * bell(t - (F['eye'] + 1.5), 6.6)
    # The nose: a bridge that starts at the brow, widens and stands further forward toward the tip, a rounded tip
    # with a drop under it, and a nostril wing either side.
    t0, tt = tb + 2.5, F['nose']
    tc = tt - 2.0                                                           # where the nose stands furthest forward
    u = np.clip((t - t0) / (tc - t0), 0, 1)
    rise = (.055 + .15 * u ** 1.4) * smooth(t, t0 - 3.5, t0 + 2)
    end = np.where(t > tc, plateau(t - tc, 5.6), 1)                         # a round end, not a cut
    r += rise * end * bell(A, 4.4 + 4.2 * u)
    r += .125 * plateau(a, 9.2) * plateau(t - (tc + .4), 5.4)                  # the ball of the tip: broad and blunt
    r += .085 * bell(a - 11.2, 4.4) * bell(t - (tc + 1.6), 3.8)              # the nostril wings
    # The mouth's ground and the upper lip, a little forward of the cheeks.
    r += .022 * bell(a, 19) * bell(t - (F['mouth'] - 2), 7.5)
    return r




def points(x, y, z, F):
    r = radius(x, y, z, F)
    return x * r, y * r, z * r


H.run({'name': 'Johansson', 'slug': 'johansson', 'form': 'rugged', 'const': 'RUGGED_HEAD', 'width': WIDTH, 'height': HEIGHT, 'points': points})
