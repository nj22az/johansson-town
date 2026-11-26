"""Thuan's head, sculpted in Blender (tools/blender/head_sculpt.py), and her review sheet.

  python tools/blender/build-thuan-head.py --root . [--sheet] [--only-sheet]     (bpy 5.x from pip; or blender -b --python ... --)

The owner, 26 November 2026, once Johansson's head was sculpted: "When happy redraw Thuan in Blender too".
Her face is the one the creator approved in Johansson Studio (src/avatars/thuan-studio-design.js) and of which the owner
said "Thuận looks best": her painted eyes, brows and lips are not touched, and the sculpt starts from her own head's
silhouette, exactly (the game's 'diamond' form with her sliders, shape_as_game). What Blender adds to it is what a ball
with a dot on it could not have: a small nose with a soft bridge and a round tip in place of the ball that read as a
ring, a little fullness in the cheeks, the mound of the lips, a chin that is round and small where two straight lines met
in a point, and the faintest hollow under the brow.
Writes src/avatars/sculpts/gentle-head.js (the game's head form 'gentle') and art/characters/thuan/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, plateau, smooth                              # noqa: E402

WHO = {'name': 'Thuan', 'slug': 'thuan', 'form': 'gentle', 'const': 'GENTLE_HEAD'}
H.ensure({**WHO, 'width': 1, 'height': 1})
# Her head as the game shapes it today: the approved design's own profile.
P = H.game_profile("const d=await import('./src/avatars/thuan-studio-design.js');const head=d.THUAN_STUDIO_DESIGN.head")


def relief(x, y, z, F):
    """What is raised from, or pressed into, her head's surface along each direction (in head radii)."""
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    tb, te, tn, tm = F['brow'], F['eye'], F['nose'], F['mouth']
    # The nose: a soft bridge from between the eyes, a small round tip a little turned up, the hint of a wing each side.
    f = .018 * bell(A, 4.8) * smooth(t, te - 5, te + 3) * (1 - smooth(t, tn - 2.5, tn + 1.5))
    f += .105 * plateau(a, 6.4) * plateau(t - (tn - 1.4), 4.5)
    f += .022 * bell(a - 7.8, 3.4) * bell(t - (tn + .3), 3.0)
    # Cheeks with a little fullness under the eyes; the lips; a small chin.
    f += .024 * bell(a - 36, 13) * bell(t - (tn + 4), 10)
    f += .017 * bell(a, 12) * bell(t - (tm + .5), 5.5)
    f += .024 * bell(a, 15) * bell(t - 141, 8)
    # The lower face a soft curve to a small round chin, not two straight lines to a point: a heart, not a kite.
    f += .04 * bell(a - 90, 42) * bell(t - 148, 15)
    f += .022 * bell(a - 52, 20) * bell(t - 132, 12)
    # The faintest brow, and the eyes a breath back under it: her painted eyes must stay on a nearly flat ground.
    f += .008 * bell(t - tb, 5) * smooth(-a, -50, -28)
    for s in (-1, 1):
        f -= .012 * bell(A - s * F['eyeA'], 10) * bell(t - (te + 1), 6.5)
    return f


def points(x, y, z, F):
    px, py, pz = H.shape_as_game(x, y, z, P)
    length = np.sqrt(px * px + py * py + pz * pz)
    k = (length + relief(x, y, z, F)) / length
    return px * k, py * k, pz * k


H.run({**WHO, 'width': round(P['width'], 6), 'height': round(P['height'], 6), 'points': points, 'melt': 8})
