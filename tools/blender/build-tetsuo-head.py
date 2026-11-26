"""Tetsuo's head, sculpted in Blender (tools/blender/head_sculpt.py), and his review sheet.

  python tools/blender/build-tetsuo-head.py --root . [--sheet] [--only-sheet]     (bpy 5.x from pip; or blender -b --python ... --)

The owner, 26 November 2026: "rework Vy, and Tetsuo give them expressions and fully rigged in blender".
Tetsuo Chinen is the island's electrician: lean, dry, a pessimist who is usually right. His old head was an egg with a
ball for a nose. This one is a lean man's: a long narrow skull with flat temples, cheekbones over hollow cheeks, a long
jaw to a narrow squared chin, a brow over deep-set eyes, and a long nose with a high bridge and a slight hook, for his
half-glasses to sit on.
Writes src/avatars/sculpts/lean-head.js (the game's head form 'lean') and art/characters/tetsuo/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, plateau, smooth                              # noqa: E402

# The head's half-axes as multiples of its radius (the game keeps its depth at 0.98): long and narrow.
WIDTH, HEIGHT = .85, 1.15


def radius(x, y, z, F):
    """The head's radius along each unit direction (game frame), before the half-axes are applied."""
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    tb, te, tn, tm = F['brow'], F['eye'], F['nose'], F['mouth']
    front = smooth(z, -.25, .45)
    low = smooth(-y, -.15, .55)
    # A long skull, a little squared low and to the front.
    p = 2.1 + .45 * low * (.5 + .5 * front)
    r = (np.abs(x) ** p + np.abs(y) ** p + np.abs(z) ** p) ** (-1 / p)
    r -= .04 * smooth(y, .1, .8) * bell(a - 90, 55)                           # a narrow crown
    r -= .13 * smooth(t, 96, 158) * np.abs(np.sin(np.radians(A))) ** 2         # the face lean, narrowing to the chin
    r -= .04 * bell(a - 82, 24) * bell(t - 82, 16)                            # flat temples
    r += .04 * bell(a - 46, 11) * bell(t - (te + 9), 6)                       # cheekbones
    r -= .04 * bell(a - 50, 14) * bell(t - (tn + 12), 11)                     # hollow cheeks under them
    r += .035 * bell(a - 60, 13) * bell(t - 132, 9)                           # the jaw's corner
    r += .065 * bell(a, 17) * bell(t - 146, 9)                                # a long chin, narrow and squared
    r += .02 * bell(a - 15, 7) * bell(t - 148, 7)
    r += (.05 + .012 * bell(a, 12)) * bell(t - (tb + .5), 4.6) * smooth(-a, -48, -28)   # the brow
    for s in (-1, 1):
        r -= .045 * bell(A - s * F['eyeA'], 10) * bell(t - (te + 1.5), 6.4)    # deep-set eyes
    # The nose: long, with a high bridge from the brow, a slight hook half way down it, a narrow tip that points down.
    t0, tc = tb + 2.5, tn - 1.0
    u = np.clip((t - t0) / (tc - t0), 0, 1)
    rise = (.055 + .19 * u ** 1.2) * smooth(t, t0 - 3.5, t0 + 2)
    end = np.where(t > tc, plateau(t - tc, 5.0), 1)
    r += rise * end * bell(A, 3.8 + 3.0 * u)
    r += .03 * bell(A, 4.6) * bell(t - (t0 + (tc - t0) * .45), 5)              # the hook
    r += .08 * plateau(a, 6.6) * plateau(t - (tc + .8), 4.6)                   # the tip
    r += .05 * bell(a - 8.6, 3.6) * bell(t - (tc + 1.6), 3.2)                  # the wings
    r += .016 * bell(a, 17) * bell(t - (tm - 2), 7)                           # the mouth's ground
    return r


def points(x, y, z, F):
    r = radius(x, y, z, F)
    return x * r, y * r, z * r


H.run({'name': 'Tetsuo', 'slug': 'tetsuo', 'form': 'lean', 'const': 'LEAN_HEAD', 'width': WIDTH, 'height': HEIGHT, 'points': points})
