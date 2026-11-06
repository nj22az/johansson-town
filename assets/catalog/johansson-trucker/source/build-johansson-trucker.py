"""The Johansson trucker cap: a premium 1990s six-panel trucker, built in Blender for Johansson World and Johansson Studio.

    python3 johansson-town/assets/catalog/johansson-trucker/source/build-johansson-trucker.py
    (Blender as a Python module, `pip install bpy`; or: blender --background --python <this file>)

Writes next to this file:
    johansson-trucker.blend   the Blender source (every part a named object, made by this script and nothing else)
    weave.png                 the mesh's weave, one tile (64 x 64, packed into the .blend and the GLB)
    model.glb                 the model Johansson Studio checks, exports and publishes into World's catalogue
                              (town-studio/assets/johansson-trucker/model.glb is a copy of it)
    build-report.json         the measurements, the parts and their triangles, the anchors

    python3 .../build-johansson-trucker.py --display
writes the same cap as a shop display (`display/`: model.glb, build-report.json, johansson-trucker-display.blend), the
second level of detail World's catalogue holds it in (assets/catalog/johansson-trucker-display): what a cap sitting on a
stand's form shows from the shop floor, at under half the triangles. The same shape, colours and frame; fewer
segments round the bill and the crown; no lining, sweatband rows or strap studs (the form fills it, nobody
looks up into it); the topstitching and the bill's rows left to the worn cap. Six of these stand in Sakura within the
shop's triangle budget (tests/owned-display-lod.test.mjs); the worn cap is unchanged.

The creator, 2026-10-14: "I want the hat look like a premium product, for now make it a trucker Cap with the J logo on it".
It replaces the Seagulls six-panel (whose script and .blend are kept in seagulls-six-panel/ for later).

What it is. Johansson Headwear's JH-712, a six-panel trucker cap of the late 1990s made as a good one is:
    - a tall, structured front of two foam panels with a seam down the middle, topstitched either side, standing up off
      the forehead and rounding over into the crown;
    - four mesh panels behind it (the sides and the back), an open knit you can see the head through, a contrast piping
      along the seams where the mesh meets the front;
    - the cloth button on top, the cotton sweatband all round inside, the band stitched;
    - the bill: a pre-curved board in cloth, five rows of tight stitching, the cloth rolled round its edge, a contrast
      undervisor; a braided rope across the front at the root of the bill;
    - the snapback: the arched opening at the back, bound in tape, the plastic straps with their studs across it;
    - the J: Johansson's J raised in 3D embroidery on the front panels, bold, round-ended and centred, with a fine
      satin-stitch outline in gold thread, inside the double ring of the house seal (the site's rubber-stamp seal,
      config.js CONFIG.logo: two rings, the rounded heavy lettering), so the cap's mark is the same family as the seal on
      the Office of Nils Johansson, the JOHANSSON wordmark Johansson Marine casts on its machines and the plate Johansson
      Vending screws on its drinks machines;
    - a woven label over the back seam, above the opening: cream, the seal's J in navy.

Its size. Every measurement is a real trucker cap's (a 1990s one-size snapback: 58 cm round the band, a 12 cm foam front,
a 7 cm bill), scaled to the head it is worn on: the town's default adult (src/avatars/build.js measure() of the default
recipe), so it is the size a resident wears and the size Sakura sells. World fits it to every other head from the head
recorded in the model's extras (`wear`).

Its frame (World's catalogue): metres, y up, the front +z, the wearer's left +x, its lowest point at y = 0.

Colours. Four materials, no texture but the weave tile:
    front    the foam front, the bill, the button, the tape: the wearer's hatColour (its vertex colour is a shade of it)
    mesh     the mesh panels, see-through (the weave's alpha): the wearer's accent colour
    accent   the undervisor, the piping, the rope, the J and its rings: the accent colour too, solid
    trim     the sweatband, the straps, the gold outline, the woven label: their own colours
World reads which material takes which colour from the model (`wear.tint`) and draws `wear.seeThrough` as a separate
layer of the hat (src/avatars/hat-assets.js), so one model is a navy cap with a white mesh, a black one with grey, a
white one with navy.

Coordinates while building: the head as a unit sphere (`u`), x left, y up, z front, its centre at 0; `metres()` carries a
point onto the town's head. Every number is here; nothing is placed by hand.
"""
import bpy, bmesh, json, math, sys
from pathlib import Path

DISPLAY = '--display' in sys.argv          # the shop display's level of detail (see above)
HERE = Path(__file__).resolve().parent
OUT = HERE / 'display' if DISPLAY else HERE
OUT.mkdir(exist_ok=True)
NAME = 'Johansson trucker cap (shop display)' if DISPLAY else 'Johansson trucker cap'

REAL = {
    'band': '58 cm round the band (55-60 by the strap), a 3 cm cotton sweatband',
    'front': 'two foam panels 12 cm high from band to the top seam, stiff, standing about 1.5 cm off the forehead',
    'mesh': 'polyester knit, 3.5 mm holes at 4.5 mm, four panels',
    'bill': '7 cm from the forehead, pre-curved, 3-4 mm board, five rows of stitching 5 mm apart, rolled edge',
    'rope': '4 mm braided cord across the front, its ends sewn under the crown at the corners of the bill',
    'button': '1.6 cm, covered in the front cloth',
    'opening': '6.5 cm wide, 4 cm high, bound in tape',
    'strap': 'two plastic straps 1.8 cm high, seven studs',
    'embroidery': 'the J 5 cm high in raised (3D, foam-backed) embroidery, a 1 mm satin outline, the seal ring 9 cm across',
    'label': 'a woven label 3.5 x 2 cm over the back seam',
}

# ---- The head it is built on: the town's adult (src/avatars/build.js measure(DEFAULT_RECIPE)) ---------------------
RH, HEAD_W, HEAD_H = 0.240555, 0.94, 1.08
SX, SY, SZ = RH * HEAD_W, RH * HEAD_H, RH * 0.98

# ---- The cap on that head, in head units ---------------------------------------------------------------------------
Y_FRONT, Y_SIDE, Y_BACK = 0.40, 0.27, 0.03   # the band's bottom edge: on the forehead (the brows show), over the ears
                                             # (clear of the braids' larger ears, 0.195), on the nape
PHI_R = math.radians(73)                     # the bill's root runs round the band from temple to temple
ARCH = Y_FRONT - Y_SIDE                      # the bill's curve across: its corners meet the band at the temples
OPEN_W, OPEN_H = 0.36, 0.27                  # the snapback opening: half-width (radians round the back), height
R_OUT, R_TOP = 1.09, 0.02                    # the crown at the band (over the hair: a crop is 1.07)
Y_APEX = 1.2                                 # the button's seat: a trucker's crown stands well above the head (1.0)
FRONT_TOP, FRONT_TILT, FRONT_ROUND = 1.27, math.radians(12), 0.3   # the foam front: its top, its lean back, its rounding
CLOTH = 0.02                                 # the cloth's thickness (the foam front's: 0.03)
FOAM = 0.03
R_BAND_FRONT = 1.012                         # the sweatband on the bare forehead (elsewhere it lies on the hair)
SEAM_DIP = 0.008
BILL_L, BILL_T, PITCH = 0.70, 0.05, math.radians(6)
ALPHA_M = math.radians(75)
STRAP_H = 0.16
TUCK = 1.065
WEAVE_TILE = 0.034                           # metres of mesh one weave tile spans (two holes across it): the knit at
                                             # the town's scale, chunky enough to read and not to shimmer

COLOURS = {
    'front': '#27304d',       # Night navy (ISLAND_PALETTE): the default front
    'mesh': '#f4f1ea',        # Paper white: the default mesh and accent
    'accent': '#f4f1ea',
    'sweatband': '#cfc8b8',   # unbleached cotton
    'strap': '#1f1f22',       # black plastic
    'gold': '#c9a54a',        # gold satin thread: the J's outline
    'label': '#efe9d8',       # the woven label's cream
    'label-ink': '#27304d',
}
SHADE = {'cloth': 1.0, 'stitch': 0.8, 'seam': 0.9, 'inside': 0.62, 'edge': 0.7, 'braid': 0.78}


def lin(hexa):
    """sRGB hex to linear RGB (glTF vertex colours are linear)."""
    c = [int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


def grey(v):
    return (v, v, v)


def smoothstep(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


# ---- Vectors (plain tuples) ------------------------------------------------------------------------------------------
def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def mul(a, k): return (a[0] * k, a[1] * k, a[2] * k)
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def norm(a):
    n = math.sqrt(dot(a, a)) or 1.0
    return (a[0] / n, a[1] / n, a[2] / n)
def lerp(a, b, t): return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


# ---- The parts -------------------------------------------------------------------------------------------------------
class Part:
    """One named object: vertices in head units, faces, a colour per face, its material, and whether World inks it."""

    def __init__(self, name, material, role, ink=1, note=''):
        self.name, self.material, self.role, self.ink, self.note = name, material, role, ink, note
        self.verts, self.faces, self.colours, self.smooth = [], [], [], []

    def v(self, p):
        self.verts.append(tuple(p))
        return len(self.verts) - 1

    def f(self, idx, colour, smooth=True):
        self.faces.append(tuple(idx))
        self.colours.append(colour)
        self.smooth.append(smooth)

    def quad(self, a, b, c, d, colour, smooth=True):
        """a b c d counter-clockwise seen from outside."""
        self.f((a, b, c), colour, smooth)
        self.f((a, c, d), colour, smooth)

    @property
    def triangles(self):
        return sum(len(f) - 2 for f in self.faces)


PARTS = []


def part(*a, **k):
    p = Part(*a, **k)
    PARTS.append(p)
    return p


# A part's vertices may carry a texture coordinate (the mesh's weave).
def _v(self, p, uv=None):
    self.verts.append(tuple(p))
    if not hasattr(self, 'uvs'):
        self.uvs = []
    self.uvs.append(uv)
    return len(self.verts) - 1


Part.v = _v


# ---- The band line ---------------------------------------------------------------------------------------------------
def wrap(phi):
    return math.atan2(math.sin(phi), math.cos(phi))


def band_y(phi):
    """The bottom edge of the crown at azimuth phi (0 the front, +pi/2 the wearer's left): in front it follows the bill's
    curve down to the temples; behind them it settles over the ears to the nape (World: hat-assets.js bandHeight)."""
    a = abs(wrap(phi))
    if a <= PHI_R:
        return Y_FRONT - ARCH * (math.sin(a) / math.sin(PHI_R)) ** 2
    f = (a - PHI_R) / (math.pi - PHI_R)
    m0 = -ARCH * 2 * math.cos(PHI_R) / math.sin(PHI_R) * (math.pi - PHI_R) / (Y_SIDE - Y_BACK)
    return Y_BACK + (Y_SIDE - Y_BACK) * ((2 * f ** 3 - 3 * f ** 2 + 1) + (f ** 3 - 2 * f ** 2 + f) * m0)


def opening(phi):
    return abs(wrap(phi - math.pi)) / OPEN_W


def edge_y(phi):
    d = opening(phi)
    return band_y(phi) + (OPEN_H * math.sqrt(max(0.0, 1 - d * d)) if d < 1 else 0.0)


# ---- The crown: a meridian profile at each azimuth -------------------------------------------------------------------
# Behind, a dome stretched up to the button's seat; in front, the foam front: up from the band leaning back a little,
# rounded over at its top, and across to the button. The two are blended round the head, so the front's shape runs
# smoothly into the mesh panels.
def _sphere(phi, s):
    yb = edge_y(phi)
    th_e = math.acos(yb / R_OUT)
    r = R_OUT + R_TOP * s
    th = th_e * (1 - s)
    rho, y = r * math.sin(th), r * math.cos(th)
    return rho, yb + (y - yb) * (Y_APEX - yb) / (R_OUT + R_TOP - yb)


def _front(phi, s):
    yb = edge_y(phi)
    rb = math.sqrt(R_OUT * R_OUT - yb * yb)
    rc, tilt = FRONT_ROUND, FRONT_TILT
    y1 = FRONT_TOP - rc * (1 - math.sin(tilt))
    p1 = (rb - (y1 - yb) * math.tan(tilt), y1)
    c = (p1[0] - rc * math.cos(tilt), p1[1] - rc * math.sin(tilt))
    end = (c[0], c[1] + rc)
    l1 = math.hypot(p1[0] - rb, p1[1] - yb)
    l2 = rc * (math.pi / 2 - tilt)
    l3 = math.hypot(end[0], end[1] - Y_APEX)
    d = s * (l1 + l2 + l3)
    if d <= l1:
        f = d / l1
        return rb + (p1[0] - rb) * f, yb + (p1[1] - yb) * f
    d -= l1
    if d <= l2:
        a = tilt + d / rc
        return c[0] + rc * math.cos(a), c[1] + rc * math.sin(a)
    f = (d - l2) / l3
    return end[0] * (1 - f), end[1] + (Y_APEX - end[1]) * f


def front_weight(phi):
    return smoothstep(0.3, 0.9, math.cos(phi))


def profile(phi, s):
    w = front_weight(phi)
    a, b = _sphere(phi, s), _front(phi, s)
    return a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w


def crown_outer(phi, s, seam=0.0):
    rho, y = profile(phi, s)
    p = (rho * math.sin(phi), y, rho * math.cos(phi))
    if seam:
        p = sub(p, mul(crown_normal(phi, s), SEAM_DIP * seam * (1 - smoothstep(0.85, 1.0, s))))
    return p


def crown_normal(phi, s):
    e = 1e-4
    a = sub(crown_outer(phi + e, s), crown_outer(phi - e, s))
    b = sub(crown_outer(phi, min(1, s + e)), crown_outer(phi, max(0, s - e)))
    n = norm(cross(b, a))
    p = crown_outer(phi, s)
    return n if dot(n, (p[0], p[1] - 0.3, p[2])) > 0 else mul(n, -1)


def thickness(phi, s, foam=False):
    front = smoothstep(0.5, 0.9, math.cos(phi))
    base = FOAM if foam else CLOTH
    return base + (R_OUT - base - R_BAND_FRONT) * front * (1 - smoothstep(0.12, 0.3, s))


def crown_inner(phi, s, foam=False):
    return sub(crown_outer(phi, s), mul(crown_normal(phi, s), thickness(phi, s, foam)))


# The six panels, (lo, hi) in azimuth, from the back round the wearer's right: two mesh behind, two mesh at the sides,
# the two foam panels in front either side of the front seam.
PANELS = [(-math.pi + i * math.pi / 3, -math.pi + (i + 1) * math.pi / 3) for i in range(6)]
FOAM_PANELS = (2, 3)
FRONT_COLS = [0, 0.03, 0.06, 0.25, 0.5, 0.75, 0.94, 0.97, 1]             # a row of topstitching beside each seam
MESH_COLS = [0, 0.25, 0.5, 0.75, 1]
o0 = 1 - OPEN_W / (math.pi / 3)
BACK_COLS = [0, 0.3, 0.55, o0, o0 + (1 - o0) * 0.25, o0 + (1 - o0) * 0.5, o0 + (1 - o0) * 0.75, 1]
FRONT_ROWS = [0, 0.04, 0.06, 0.16, 0.28, 0.4, 0.52, 0.62, 0.72, 0.82, 0.91]  # 0.04-0.06: the band's stitching
MESH_ROWS = [0, 0.1, 0.24, 0.38, 0.52, 0.66, 0.8, 0.91]
SWEAT_ROWS = [0, 0.1, 0.22]
LINING_ROWS = [0.22, 0.45, 0.7, 0.91]
# The level of detail: the worn cap's, then the shop display's (DISPLAY).
DETAIL = {'lining': True, 'roll': 4, 'under': [0, 0.35, 0.7, 1], 'rope': (6, 20), 'strap': 12, 'studs': 6, 'pipe': 18,
          'button': 10, 'rings': (28, 24), 'label_j': True, 'quarter_j': True}
if DISPLAY:
    FRONT_COLS = [0, 0.25, 0.5, 0.75, 1]
    FRONT_ROWS = [0, 0.16, 0.34, 0.52, 0.7, 0.86]
    MESH_COLS = [0, 0.33, 0.67, 1]
    BACK_COLS = [0, 0.5, o0, o0 + (1 - o0) * 0.5, 1]
    MESH_ROWS = [0, 0.22, 0.46, 0.7, 0.88]
    SWEAT_ROWS = [0, 0.22]
    DETAIL = {'lining': False, 'roll': 2, 'under': [0, 1], 'rope': (4, 10), 'strap': 6, 'studs': 0, 'pipe': 8,
              'button': 6, 'rings': (24, 20), 'label_j': False, 'quarter_j': True}


def panel_columns(i):
    lo, hi = PANELS[i]
    if i == 0:
        return [lo + (hi - lo) * (1 - f) for f in reversed(BACK_COLS)]
    if i == 5:
        return [lo + (hi - lo) * f for f in BACK_COLS]
    cols = FRONT_COLS if i in FOAM_PANELS else MESH_COLS
    return [lo + (hi - lo) * f for f in cols]


def weave_uv(phi, s, mid):
    """The weave's coordinate at a point of a mesh panel, as the panel was cut from flat knit: metres across from the
    panel's middle (`mid`, its azimuth) and up its meridian, in weave tiles, so the knit is the same size all over and
    runs straight up each panel rather than fanning to the button."""
    rho, y = profile(phi, s)
    up, prev, k = 0.0, profile(phi, 0), 24
    for j in range(1, k + 1):
        q = profile(phi, s * j / k)
        up += math.hypot((q[0] - prev[0]) * SX, (q[1] - prev[1]) * SY)
        prev = q
    return ((phi - mid) * rho * SX / WEAVE_TILE, up / WEAVE_TILE)


def build_crown():
    foam = part('Cap front', 'front', 'body', note='two foam panels, the front seam, topstitching, the band stitching')
    foam.noink = set()
    lining = part('Cap front lining', 'front', 'body', ink=0, note='the inside of the foam front')
    mesh = part('Cap mesh', 'mesh', 'body', ink=0, note='four mesh panels: the sides and the back, see-through')
    sweat = part('Cap sweatband', 'trim', 'body', ink=0, note='cotton sweatband inside the band, all round')
    rim = part('Cap band edge', 'trim', 'body', note='the bottom edge of the band; round the opening, the binding tape')
    tape = part('Cap binding', 'front', 'body', note='the tape binding the snapback opening')
    stitch, cloth, inside, edge = grey(SHADE['stitch']), grey(SHADE['cloth']), grey(SHADE['inside']), grey(SHADE['edge'])
    sweat_c = lin(COLOURS['sweatband'])
    for i in range(6):
        cols, is_foam = panel_columns(i), i in FOAM_PANELS
        mid = (PANELS[i][0] + PANELS[i][1]) / 2
        n = len(cols)
        rows = FRONT_ROWS if is_foam else MESH_ROWS
        owner = foam if is_foam else mesh
        seams = (0, n - 1)
        grid = [[(owner.v(crown_outer(phi, s, seam=1.0 if is_foam and j in seams else 0.0),
                          None if is_foam else weave_uv(phi, s, mid)))
                 for j, phi in enumerate(cols)] for s in rows]
        apex = owner.v(crown_outer(0, 1.0), None if is_foam else (0.0, weave_uv(mid, 1.0, mid)[1]))
        if is_foam:
            # No ink along the foam's edges against the mesh (the mesh has none: World's outline there would stand as a
            # dark rim beside the piping): the vertex colour's alpha says how much ink a vertex carries.
            edge_col = 0 if i == 2 else n - 1
            owner.noink.update(grid[r][edge_col] for r in range(len(rows)))
            owner.noink.add(apex)
        for r in range(len(rows) - 1):
            band_stitch = rows[r] >= 0.04 and rows[r + 1] <= 0.06
            for j in range(n - 1):
                strip = is_foam and not DISPLAY and (j in (1, n - 3) or band_stitch)
                owner.quad(grid[r][j], grid[r][j + 1], grid[r + 1][j + 1], grid[r + 1][j], stitch if strip else cloth)
        for j in range(n - 1):
            strip = is_foam and not DISPLAY and j in (1, n - 3)
            owner.f((grid[-1][j], grid[-1][j + 1], apex), stitch if strip else cloth)
        # the sweatband all round, and the foam front's lining above it
        cache = {}
        def vid(who, s, j, foam_=is_foam):
            key = (who.name, s, j)
            if key not in cache:
                cache[key] = who.v(crown_inner(cols[j], s, foam_))
            return cache[key]
        for j in range(n - 1):
            in_opening = opening((cols[j] + cols[j + 1]) / 2) < 1
            who, c = (tape, edge) if in_opening else (sweat, sweat_c)
            for r in range(len(SWEAT_ROWS) - 1):
                a, b = SWEAT_ROWS[r], SWEAT_ROWS[r + 1]
                who.quad(vid(who, a, j), vid(who, b, j), vid(who, b, j + 1), vid(who, a, j + 1), c)
            if is_foam and DETAIL['lining']:
                for r in range(len(LINING_ROWS) - 1):
                    a, b = LINING_ROWS[r], LINING_ROWS[r + 1]
                    lining.quad(vid(lining, a, j), vid(lining, b, j), vid(lining, b, j + 1), vid(lining, a, j + 1), inside)
                lining.f((vid(lining, LINING_ROWS[-1], j), lining.v(crown_inner(0, 1.0, True)), vid(lining, LINING_ROWS[-1], j + 1)), inside)
            # the bottom edge, outside to inside
            o1, o2 = crown_outer(cols[j], 0), crown_outer(cols[j + 1], 0)
            i1, i2 = crown_inner(cols[j], 0, is_foam), crown_inner(cols[j + 1], 0, is_foam)
            who = tape if in_opening else rim
            ids = [who.v(p) for p in (o1, i1, i2, o2)]
            who.quad(*ids, edge if in_opening else sweat_c, smooth=False)


def build_piping():
    """Contrast piping along the two seams where the mesh meets the foam front: a cord in the accent colour."""
    pipe = part('Cap piping', 'accent', 'decoration', ink=0, note='contrast piping on the front seams')
    c = lin('#ffffff')
    for phi in (PANELS[2][0], PANELS[3][1]):
        prev = None
        steps = DETAIL['pipe']
        ring_ids = []
        for k in range(steps + 1):
            s = 0.02 + 0.93 * k / steps
            p, n = crown_outer(phi, s), crown_normal(phi, s)
            t = norm(sub(crown_outer(phi, min(1, s + 1e-3)), crown_outer(phi, max(0, s - 1e-3))))
            side = norm(cross(t, n))
            w, h = 0.018, 0.012
            ring_ids.append([pipe.v(add(p, mul(side, -w))), pipe.v(add(p, mul(n, h))), pipe.v(add(p, mul(side, w)))])
        for k in range(steps):
            a, b = ring_ids[k], ring_ids[k + 1]
            pipe.quad(a[0], a[1], b[1], b[0], c)
            pipe.quad(a[1], a[2], b[2], b[1], c)


def build_button():
    b = part('Cap button', 'front', 'decoration', note='the cloth-covered button where the six panels meet')
    top = crown_outer(0, 1.0)
    c = grey(1.0)
    rad, h, seg = 0.08, 0.05, DETAIL['button']
    prof = [(rad * 0.92, -0.012), (rad, 0.006), (rad * 0.93, h * 0.55), (rad * 0.62, h * 0.9), (rad * 0.25, h)]
    rings = [[b.v((r * math.cos(2 * math.pi * k / seg), top[1] + y, r * math.sin(2 * math.pi * k / seg))) for k in range(seg)] for r, y in prof]
    cap = b.v((0, top[1] + h * 1.02, 0))
    for r in range(len(rings) - 1):
        for k in range(seg):
            k2 = (k + 1) % seg
            b.quad(rings[r][k], rings[r + 1][k], rings[r + 1][k2], rings[r][k2], c)
    for k in range(seg):
        b.f((rings[-1][k], cap, rings[-1][(k + 1) % seg]), c)


# ---- The bill --------------------------------------------------------------------------------------------------------
BILL_S = 14
BILL_V = [0, 0.3, 0.33, 0.47, 0.5, 0.64, 0.67, 0.81, 0.84, 1]   # four rows of tight stitching
STITCH_ROWS = {(0.3, 0.33), (0.47, 0.5), (0.64, 0.67), (0.81, 0.84)}
if DISPLAY:
    BILL_S, BILL_V, STITCH_ROWS = 8, [0, 0.5, 1], set()


def bill_root(s):
    phi = s * PHI_R
    y = band_y(phi)
    r = R_OUT - 0.005
    rho = math.sqrt(r * r - y * y)
    return (rho * math.sin(phi), y, rho * math.cos(phi))


ROOT_C = bill_root(1.0)
ROOT_0 = bill_root(0.0)
BILL_A = ROOT_C[0] / math.sin(ALPHA_M)
BILL_B = (ROOT_0[2] + BILL_L - ROOT_C[2]) / (1 - math.cos(ALPHA_M))
BILL_ZC = ROOT_0[2] + BILL_L - BILL_B


def bill_tip(s):
    a = s * ALPHA_M
    x, z = BILL_A * math.sin(a), BILL_ZC + BILL_B * math.cos(a)
    if abs(s) >= 0.999:
        x, z = ROOT_C[0] * math.copysign(1, s) * 0.995, ROOT_C[2] + 0.012
    return x, z


def bill_top(s, v):
    rx, ry, rz = bill_root(s)
    tx, tz = bill_tip(s)
    x, z = rx + (tx - rx) * v, rz + (tz - rz) * v
    y = ry - ARCH * ((x / ROOT_C[0]) ** 2 - (rx / ROOT_C[0]) ** 2) - math.tan(PITCH) * (z - rz)
    return (x, y, z)


def bill_outward(s):
    e = 1e-3
    a, b = bill_tip(max(-1, s - e)), bill_tip(min(1, s + e))
    tx, tz = b[0] - a[0], b[1] - a[1]
    n = (tz, -tx)
    x, z = bill_tip(s)
    if n[0] * x + n[1] * (z - BILL_ZC) < 0:
        n = (-n[0], -n[1])
    l = math.hypot(*n) or 1
    return (n[0] / l, 0.0, n[1] / l)


def build_bill():
    top = part('Cap bill', 'front', 'body', note='the visor: a pre-curved board in cloth, five rows of stitching, the rolled edge')
    under = part('Cap undervisor', 'accent', 'body', note='the contrast undervisor')
    cloth, stitch, under_c = grey(SHADE['cloth']), grey(SHADE['stitch']), grey(SHADE['cloth'])
    ss = [-1 + 2 * k / BILL_S for k in range(BILL_S + 1)]
    T = [[top.v(bill_top(s, v)) for s in ss] for v in BILL_V]
    for r in range(len(BILL_V) - 1):
        c = stitch if (BILL_V[r], BILL_V[r + 1]) in STITCH_ROWS else cloth
        for k in range(BILL_S):
            top.quad(T[r][k], T[r + 1][k], T[r + 1][k + 1], T[r][k + 1], c)
    steps = DETAIL['roll']
    roll = []
    for s in ss:
        p, n = bill_top(s, 1.0), bill_outward(s)
        centre = (p[0], p[1] - BILL_T / 2, p[2])
        roll.append([add(centre, add(mul(n, BILL_T / 2 * math.cos(math.pi / 2 - math.pi * q / steps) * 0.9),
                                     (0, BILL_T / 2 * math.sin(math.pi / 2 - math.pi * q / steps), 0))) for q in range(steps + 1)])
    R = [[top.v(roll[k][q]) for k in range(BILL_S + 1)] for q in range(steps + 1)]
    for q in range(steps):
        for k in range(BILL_S):
            top.quad(R[q][k], R[q + 1][k], R[q + 1][k + 1], R[q][k + 1], cloth)
    UV = DETAIL['under']
    U = [[under.v(sub(bill_top(s, v), (0, BILL_T, 0)) if v < 1 else roll[k][steps]) for k, s in enumerate(ss)] for v in UV]
    for r in range(len(UV) - 1):
        for k in range(BILL_S):
            under.quad(U[r][k], U[r][k + 1], U[r + 1][k + 1], U[r + 1][k], under_c)
    for k in range(BILL_S):
        a, b = bill_top(ss[k], 0), bill_top(ss[k + 1], 0)
        ids = [under.v(p) for p in (a, b, sub(b, (0, BILL_T, 0)), sub(a, (0, BILL_T, 0)))]
        under.quad(*ids, under_c)
    for k, sgn in ((0, 1), (BILL_S, -1)):
        col_top = [bill_top(ss[k], v) for v in UV]
        col_bot = [sub(p, (0, BILL_T, 0)) for p in col_top[:-1]] + [roll[k][steps]]
        for r in range(len(UV) - 1):
            ids = [top.v(p) for p in (col_top[r], col_top[r + 1], col_bot[r + 1], col_bot[r])]
            if sgn < 0:
                top.quad(*ids, cloth)
            else:
                top.quad(ids[0], ids[3], ids[2], ids[1], cloth)


def build_rope():
    """A braided cord across the front at the root of the bill, its ends sewn under the crown at the bill's corners."""
    rope = part('Cap rope', 'accent', 'decoration', note='braided rope across the front')
    r, (sides, segs) = 0.022, DETAIL['rope']
    pts = []
    for k in range(segs + 1):
        s = -0.86 + 1.72 * k / segs
        p = bill_top(s, 0.13)
        pts.append((p[0], p[1] + r * 0.9, p[2]))
    rings = []
    for k, p in enumerate(pts):
        t = norm(sub(pts[min(segs, k + 1)], pts[max(0, k - 1)]))
        up = (0, 1, 0)
        u = norm(cross(t, up))
        v = cross(u, t)
        rings.append([rope.v(add(p, add(mul(u, r * math.cos(2 * math.pi * j / sides)), mul(v, r * math.sin(2 * math.pi * j / sides)))))
                      for j in range(sides)])
    for k in range(segs):
        for j in range(sides):
            j2 = (j + 1) % sides
            c = grey(1.0) if (k + j) % 2 == 0 else grey(SHADE['braid'])    # the strands' diagonal: a braid
            rope.quad(rings[k][j], rings[k + 1][j], rings[k + 1][j2], rings[k][j2], c)
    for k, flip in ((0, False), (segs, True)):
        centre = rope.v(pts[k])
        for j in range(sides):
            j2 = (j + 1) % sides
            rope.f((rings[k][j], centre, rings[k][j2]) if flip else (rings[k][j2], centre, rings[k][j]), grey(SHADE['braid']))


def build_strap():
    st = part('Cap snapback strap', 'trim', 'decoration', note='two plastic straps across the opening, studs through holes')
    c = lin(COLOURS['strap'])
    lo, hi = math.pi - OPEN_W - 0.12, math.pi + OPEN_W + 0.12
    seg = DETAIL['strap']
    r_in, r_out = R_OUT - 0.022, R_OUT - 0.008
    def p(phi, y, r):
        rho = math.sqrt(max(0.0, r * r - y * y))
        return (rho * math.sin(phi), y, rho * math.cos(phi))
    y0 = lambda phi: band_y(phi) + 0.004
    y1 = lambda phi: band_y(phi) + STRAP_H
    phis = [lo + (hi - lo) * k / seg for k in range(seg + 1)]
    O0 = [st.v(p(f, y0(f), r_out)) for f in phis]
    O1 = [st.v(p(f, y1(f), r_out)) for f in phis]
    I0 = [st.v(p(f, y0(f), r_in)) for f in phis]
    I1 = [st.v(p(f, y1(f), r_in)) for f in phis]
    for k in range(seg):
        st.quad(O0[k], O0[k + 1], O1[k + 1], O1[k], c)
        st.quad(I0[k + 1], I0[k], I1[k], I1[k + 1], c)
        st.quad(O1[k], O1[k + 1], I1[k + 1], I1[k], c, smooth=False)
        st.quad(I0[k], I0[k + 1], O0[k + 1], O0[k], c, smooth=False)
    for i in range(DETAIL['studs']):
        phi = math.pi + (i - 2.5) * 0.085
        y = (y0(phi) + y1(phi)) / 2
        centre = p(phi, y, r_out)
        n = norm((centre[0], 0, centre[2]))
        u = (n[2], 0, -n[0])
        v = (0, 1, 0)
        sseg, rad, h = 6, 0.028, 0.012
        base = [st.v(add(centre, add(mul(u, rad * math.cos(2 * math.pi * k / sseg)), mul(v, rad * math.sin(2 * math.pi * k / sseg))))) for k in range(sseg)]
        topr = [st.v(add(add(centre, mul(n, h)), add(mul(u, rad * 0.8 * math.cos(2 * math.pi * k / sseg)), mul(v, rad * 0.8 * math.sin(2 * math.pi * k / sseg))))) for k in range(sseg)]
        cap = st.v(add(centre, mul(n, h * 1.3)))
        for k in range(sseg):
            k2 = (k + 1) % sseg
            st.quad(base[k], base[k2], topr[k2], topr[k], c)
            st.f((topr[k], topr[k2], cap), c)



# ---- Outlines (from the six-panel's script) ---------------------------------------------------------------------
def offset(poly, d):
    """The outline moved out by d (a mitre at each corner, limited at sharp tips)."""
    out, n = [], len(poly)
    area = sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n))
    sgn = 1 if area < 0 else -1          # clockwise: the outward normal is to the left of travel
    for i in range(n):
        a, b, c = poly[i - 1], poly[i], poly[(i + 1) % n]
        def nrm(p, q):
            dx, dy = q[0] - p[0], q[1] - p[1]
            l = math.hypot(dx, dy) or 1
            return (-dy / l * sgn, dx / l * sgn)
        n1, n2 = nrm(a, b), nrm(b, c)
        m = (n1[0] + n2[0], n1[1] + n2[1])
        l = math.hypot(*m) or 1
        m = (m[0] / l, m[1] / l)
        k = d / max(0.45, m[0] * n1[0] + m[1] * n1[1])
        out.append((b[0] + m[0] * k, b[1] + m[1] * k))
    return out


def triangulate(poly, quarter=True):
    """Ear clipping (the outline is simple), then each triangle cut in four, so the flat pieces follow the crown."""
    pts = list(poly)
    idx = list(range(len(pts)))
    area = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))
    ccw = area > 0
    def convex(a, b, c):
        cr = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        return cr > 1e-12 if ccw else cr < -1e-12
    def inside(p, a, b, c):
        def s(p1, p2, p3):
            return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
        d1, d2, d3 = s(p, a, b), s(p, b, c), s(p, c, a)
        return not ((d1 < 0 or d2 < 0 or d3 < 0) and (d1 > 0 or d2 > 0 or d3 > 0))
    tris = []
    guard = 0
    while len(idx) > 3 and guard < 10000:
        guard += 1
        best = None
        for k in range(len(idx)):
            i0, i1, i2 = idx[k - 1], idx[k], idx[(k + 1) % len(idx)]
            a, b, c = pts[i0], pts[i1], pts[i2]
            if not convex(a, b, c):
                continue
            if any(inside(pts[j], a, b, c) for j in idx if j not in (i0, i1, i2)):
                continue
            # the fattest ear first: fewer slivers
            q = min(math.dist(a, b), math.dist(b, c), math.dist(c, a)) / (max(math.dist(a, b), math.dist(b, c), math.dist(c, a)) or 1)
            if best is None or q > best[0]:
                best = (q, k, (i0, i1, i2))
        if best is None:
            raise RuntimeError('the outline could not be triangulated')
        tris.append(best[2])
        idx.pop(best[1])
    tris.append(tuple(idx))
    if not ccw:
        tris = [(a, c, b) for a, b, c in tris]
    if not quarter:
        return [tuple(p) for p in pts], tris
    # one level of quartering
    pts = [tuple(p) for p in pts]
    mids = {}
    def mid(i, j):
        key = (min(i, j), max(i, j))
        if key not in mids:
            pts.append(((pts[i][0] + pts[j][0]) / 2, (pts[i][1] + pts[j][1]) / 2))
            mids[key] = len(pts) - 1
        return mids[key]
    out = []
    for a, b, c in tris:
        ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
        out += [(a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca)]
    return pts, out


# ---- The J ----------------------------------------------------------------------------------------------------------
# Johansson's J, in the family of the house seal (config.js CONFIG.logo: a double ring round heavy rounded capitals,
# Nunito 800): a heavy stroke with round ends, a straight stem and a hook to the left, drawn as a stroke along its centre
# line. Design units: the J about 1.0 high, its centre at the origin; x to the wearer's left as seen from the front.
J_WIDTH = 0.23
J_STEM_X, J_TOP, J_TURN = 0.1, 0.42, -0.08
J_HOOK_R = 0.22


def j_centre_line():
    pts = [(J_STEM_X, J_TOP), (J_STEM_X, (J_TOP + J_TURN) / 2), (J_STEM_X, J_TURN)]
    cx = J_STEM_X - J_HOOK_R
    for k in range(1, 9):
        a = -math.pi * 0.9 * k / 8                       # down and round to the left
        pts.append((cx + J_HOOK_R * math.cos(a), J_TURN + J_HOOK_R * math.sin(a)))
    return pts


def stroke_outline(line, w):
    """A heavy stroke with round ends round a centre line: its outline, as a polygon."""
    left, right = [], []
    for i, p in enumerate(line):
        a, b = line[max(0, i - 1)], line[min(len(line) - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        l = math.hypot(dx, dy) or 1
        nx, ny = -dy / l, dx / l
        left.append((p[0] + nx * w / 2, p[1] + ny * w / 2))
        right.append((p[0] - nx * w / 2, p[1] - ny * w / 2))
    end = line[-1]
    start = line[0]
    # the round ends bulge along the line: the cap at the end goes the long way round from left to right, outward
    e_out = norm2(sub2(line[-1], line[-2]))
    s_out = norm2(sub2(line[0], line[1]))
    end_cap = arc_round(left[-1], right[-1], end, e_out, w / 2)
    start_cap = arc_round(right[0], left[0], start, s_out, w / 2)
    return left + end_cap + list(reversed(right)) + start_cap


def sub2(a, b): return (a[0] - b[0], a[1] - b[1])
def norm2(a):
    l = math.hypot(*a) or 1
    return (a[0] / l, a[1] / l)


def arc_round(p, q, centre, out, r, steps=6):
    """Points on the half circle from p to q round `centre` that passes through centre + out·r."""
    a0 = math.atan2(p[1] - centre[1], p[0] - centre[0])
    am = math.atan2(out[1], out[0])
    a1 = math.atan2(q[1] - centre[1], q[0] - centre[0])
    def between(a, b, m):
        d1 = (m - a) % (2 * math.pi)
        d2 = (b - a) % (2 * math.pi)
        return d1 < d2
    span = (a1 - a0) % (2 * math.pi)
    if not between(a0, a1, am):
        span = span - 2 * math.pi
    return [(centre[0] + r * math.cos(a0 + span * k / steps), centre[1] + r * math.sin(a0 + span * k / steps)) for k in range(1, steps)]


J_SCALE = 0.44                 # design units to head units of arc: the J about 0.44 high on the front
J_ABOVE_BAND = 0.42            # its centre, up the front from the band
J_OUTLINE = 0.035              # the satin outline's width, design units
RING_R, RING_W = 0.66, 0.05    # the seal's outer ring round it (CONFIG.logo: r 96 of 100, the inner 84)
RING2_R, RING2_W = 0.58, 0.025
J_LIFT = (0.012, 0.022)        # the gold outline, the J: raised as 3D embroidery is (foam under the stitches)
RING_LIFT = 0.012


def meridian(phi0):
    out, acc, prev = [], 0.0, crown_outer(phi0, 0)
    for k in range(1, 401):
        s = k / 400
        p = crown_outer(phi0, s)
        acc += math.dist(p, prev)
        out.append((acc, s))
        prev = p
    return out


MERIDIANS = {}


def s_at(phi0, arc):
    table = MERIDIANS.setdefault(phi0, meridian(phi0))
    lo = (0.0, 0.0)
    for a, s in table:
        if a >= arc:
            f = (arc - lo[0]) / ((a - lo[0]) or 1)
            return lo[1] + (s - lo[1]) * f
        lo = (a, s)
    return 1.0


def on_crown(phi0, above, x, y, lift):
    """A point of a design (x across, y up, head units of arc; centred `above` the band at azimuth phi0) on the crown,
    lifted off it along its normal."""
    s = s_at(phi0, above + y)
    phi = phi0 + x / max(0.2, profile(phi0, s)[0])
    return add(crown_outer(phi, s), mul(crown_normal(phi, s), lift))


def raised(part_, poly, place, lift, colour, wall_to, quarter=True):
    pts, tris = triangulate(poly, quarter)
    ids = [part_.v(place(x, y, lift)) for x, y in pts]
    for a, b, c in tris:
        part_.f((ids[a], ids[b], ids[c]), colour, smooth=True)
    n = len(poly)
    area = sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n))
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        q = [part_.v(p) for p in (place(a[0], a[1], wall_to), place(b[0], b[1], wall_to), place(b[0], b[1], lift), place(a[0], a[1], lift))]
        if area > 0:
            part_.quad(q[0], q[1], q[2], q[3], colour, smooth=False)
        else:
            part_.quad(q[0], q[3], q[2], q[1], colour, smooth=False)


def ring(part_, place, r, w, lift, colour, seg=36, wall_to=-0.01):
    """A raised ring of satin stitch: its top and its two walls."""
    def at(a, rr, h):
        return place(rr * math.cos(a), rr * math.sin(a), h)
    for k in range(seg):
        a, b = 2 * math.pi * k / seg, 2 * math.pi * (k + 1) / seg
        o0, o1, i0, i1 = at(a, r + w / 2, lift), at(b, r + w / 2, lift), at(a, r - w / 2, lift), at(b, r - w / 2, lift)
        ids = [part_.v(p) for p in (i0, o0, o1, i1)]
        part_.quad(*ids, colour)
        ids = [part_.v(p) for p in (at(a, r + w / 2, wall_to), at(b, r + w / 2, wall_to), o1, o0)]
        part_.quad(*ids, colour, smooth=False)
        ids = [part_.v(p) for p in (at(b, r - w / 2, wall_to), at(a, r - w / 2, wall_to), i0, i1)]
        part_.quad(*ids, colour, smooth=False)


def j_outline():
    return stroke_outline(j_centre_line(), J_WIDTH)


def build_embroidery():
    em = part('Cap J', 'accent', 'sign', ink=0,
              note="Johansson's J in raised embroidery, inside the seal's two rings: the house mark (config.js CONFIG.logo)")
    gold = part('Cap J outline', 'trim', 'sign', ink=0, note='the satin-stitch outline in gold thread')
    front = lambda x, y, h: on_crown(0.0, J_ABOVE_BAND, x * J_SCALE, y * J_SCALE, h)
    j = j_outline()
    raised(gold, offset(j, J_OUTLINE), front, J_LIFT[0], lin(COLOURS['gold']), -0.012, quarter=DETAIL['quarter_j'])
    raised(em, j, front, J_LIFT[1], grey(1.0), J_LIFT[0] - 0.002, quarter=DETAIL['quarter_j'])
    ring(em, front, RING_R, RING_W, RING_LIFT, grey(1.0), seg=DETAIL['rings'][0])
    ring(em, front, RING2_R, RING2_W, RING_LIFT * 0.8, grey(1.0), seg=DETAIL['rings'][1])


def build_label():
    """The woven label over the back seam above the opening: cream, the seal's J in navy."""
    lab = part('Cap woven label', 'trim', 'sign', ink=0, note='woven label: the seal J on cream')
    back = lambda x, y, h: on_crown(math.pi, edge_y(math.pi) - Y_BACK + 0.14, -x, y, h)
    w, hh = 0.15, 0.085
    raised(lab, [(-w / 2, -hh / 2), (w / 2, -hh / 2), (w / 2, hh / 2), (-w / 2, hh / 2)], back, 0.007, lin(COLOURS['label']), -0.01, quarter=False)
    if not DETAIL['label_j']:
        return
    small = [(x * 0.075, y * 0.075) for x, y in j_outline()]
    raised(lab, small, back, 0.0095, lin(COLOURS['label-ink']), 0.005, quarter=False)


# ---- The weave ------------------------------------------------------------------------------------------------------
def weave_pixels(size=64):
    """One tile of the knit: two round holes on the diagonal (a diamond mesh), soft-edged, white threads."""
    px = []
    holes = [(0.25, 0.25), (0.75, 0.75)]
    r = 0.17
    for yy in range(size):
        for xx in range(size):
            u, v = (xx + 0.5) / size, (yy + 0.5) / size
            d = min(math.hypot(((u - hu + 0.5) % 1) - 0.5, ((v - hv + 0.5) % 1) - 0.5) for hu, hv in holes)
            a = min(1.0, max(0.0, (d - r) * size / 1.5 + 0.5))
            px += [1.0, 1.0, 1.0, a]
    return px


# ---- Build -----------------------------------------------------------------------------------------------------------
build_crown()
build_piping()
build_button()
build_bill()
build_rope()
build_strap()
build_embroidery()
build_label()

low = min(v[1] * SY for p in PARTS for v in p.verts)
Y0 = -low


def metres(v):
    return (v[0] * SX, v[1] * SY + Y0, v[2] * SZ)


def blender(v):
    x, y, z = metres(v)
    return (x, -z, y)


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'

weave = bpy.data.images.new('weave', 64, 64, alpha=True)
weave.pixels = weave_pixels(64)
weave.filepath_raw = str(HERE / 'weave.png')
weave.file_format = 'PNG'
weave.save()
weave.pack()

MATERIALS = {}
for name, base, rough in (('front', COLOURS['front'], 0.95), ('mesh', COLOURS['mesh'], 0.35), ('accent', COLOURS['accent'], 0.6),
                          ('trim', '#ffffff', 0.6)):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*lin(base), 1.0)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = 0.0
    if name == 'mesh':
        tex = nodes.new('ShaderNodeTexImage')
        tex.image = weave
        m.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
        m.node_tree.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
        if hasattr(m, 'surface_render_method'):
            m.surface_render_method = 'BLENDED'
        if hasattr(m, 'blend_method'):
            m.blend_method = 'BLEND'
        m.use_backface_culling = False       # a single layer of knit: both faces
    else:
        m.use_backface_culling = True
    MATERIALS[name] = m

root = bpy.data.objects.new(NAME, None)
scene.collection.objects.link(root)
WEAR = {
    'about': "How World fits this cap to a head (src/avatars/hat-assets.js): a point's place on the head it was built on "
             "(head: its centre and radii, metres) is carried to the same place on the wearer's head; the hair under the "
             "crown is pressed in to `tuck` (head radii) above the band, except in the opening above the strap. `tint`: "
             "which recipe colour each material takes (its vertex colour a shade of it); `seeThrough`: the materials drawn "
             "as the hat's see-through layer, with `weave`.",
    'head': {'centre': [0.0, round(Y0, 6), 0.0], 'radii': [round(SX, 6), round(SY, 6), round(SZ, 6)],
             'recipe': 'the default adult (src/avatars/recipe.js DEFAULT_RECIPE): Rh 0.240555, width 0.94, height 1.08, oval'},
    'band': {'front': Y_FRONT, 'side': Y_SIDE, 'back': Y_BACK, 'billRoot': round(PHI_R, 6), 'arch': round(ARCH, 6)},
    'opening': {'halfWidth': OPEN_W, 'height': OPEN_H, 'strapHeight': STRAP_H},
    'tuck': {'radius': TUCK, 'front': R_BAND_FRONT - 0.005, 'frontFrom': 0.5, 'frontTo': 0.9},
    'tint': {'front': 'hatColour', 'mesh': 'accent', 'accent': 'accent'},
    'seeThrough': ['mesh'],
    'weave': {'tile': WEAVE_TILE, 'holes': [[0.25, 0.25], [0.75, 0.75]], 'radius': 0.17, 'size': 64},
}
root['asset'] = NAME
root['maker'] = 'Johansson Headwear, model JH-712 (six-panel trucker, foam front, mesh back)'
root['wear'] = json.dumps(WEAR)
root['colours'] = json.dumps(COLOURS)
root['shades'] = json.dumps(SHADE)

report = {'parts': [], 'real': REAL, 'wear': WEAR}
for p in PARTS:
    mesh = bpy.data.meshes.new(p.name)
    mesh.from_pydata([blender(v) for v in p.verts], [], p.faces)
    mesh.update()
    attr = mesh.color_attributes.new('Color', 'FLOAT_COLOR', 'CORNER')
    uvs = getattr(p, 'uvs', [])
    layer = mesh.uv_layers.new(name='UVMap') if any(u is not None for u in uvs) else None
    for poly in mesh.polygons:
        col = p.colours[poly.index]
        poly.use_smooth = p.smooth[poly.index]
        for li in poly.loop_indices:
            attr.data[li].color = (*col, 0.0 if mesh.loops[li].vertex_index in getattr(p, 'noink', ()) else 1.0)
            if layer:
                layer.data[li].uv = uvs[mesh.loops[li].vertex_index]
    mesh.color_attributes.active_color = attr
    mesh.materials.append(MATERIALS[p.material])
    obj = bpy.data.objects.new(p.name, mesh)
    obj['role'] = p.role
    obj['ink'] = p.ink
    obj['note'] = p.note
    obj.parent = root
    scene.collection.objects.link(obj)
    report['parts'].append({'name': p.name, 'material': p.material, 'role': p.role, 'ink': p.ink, 'triangles': p.triangles, 'note': p.note})

for obj in root.children:
    if obj.name in ('Cap front', 'Cap mesh'):
        continue                                  # the panels keep their seams: their own vertices either side
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bm.to_mesh(obj.data)
    bm.free()

# One object per material and ink (World draws the parts the same way, and a shop shelf of caps costs seven draw calls a
# cap, not one a part); the parts and what they are stay listed in the report.
groups = {}
for obj in list(root.children):
    groups.setdefault((obj.data.materials[0].name, obj['ink']), []).append(obj)
LABELS = {'front': 'Cap front, bill and button', 'mesh': 'Cap mesh', 'accent': 'Cap undervisor, piping, rope and J', 'trim': 'Cap trim'}
for (mat, ink), objs in groups.items():
    names = ', '.join(sorted(o.name for o in objs))
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = LABELS[mat] + ('' if ink else ' (no ink)')
    joined['ink'] = ink
    joined['parts'] = names
report['objects'] = {o.name: o.get('parts', '') for o in root.children}

allv = [metres(v) for p in PARTS for v in p.verts]
lo = [min(v[i] for v in allv) for i in range(3)]
hi = [max(v[i] for v in allv) for i in range(3)]
report['size'] = [round(hi[i] - lo[i], 4) for i in range(3)]
report['triangles'] = sum(p.triangles for p in PARTS)
report['materials'] = len(MATERIALS)
_peg_y = Y_BACK + OPEN_H - 0.03
_peg_rho = math.sqrt((R_OUT - CLOTH / 2) ** 2 - _peg_y ** 2)
report['anchors'] = {k: [round(c, 4) for c in metres(v)] for k, v in {
    'head-centre': (0.0, 0.0, 0.0), 'head-top': (0.0, 1.0, 0.0), 'head-left': (1.0, 0.0, 0.0), 'head-front': (0.0, 0.0, 1.0),
    'peg': (0.0, _peg_y, -_peg_rho),
    'crown-top': (0.0, crown_outer(0, 1.0)[1] + 0.05, 0.0),
    'bill-tip': bill_top(0.0, 1.0),
    'band-front': crown_outer(0.0, 0.0),
    'logo': on_crown(0.0, J_ABOVE_BAND, 0, 0, J_LIFT[1]),
}.items()}

bpy.ops.wm.save_as_mainfile(filepath=str(OUT / ('johansson-trucker-display.blend' if DISPLAY else 'johansson-trucker.blend')), compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT / 'model.glb'), export_format='GLB', export_yup=True, export_apply=True,
                          export_extras=True, export_vertex_color='ACTIVE', export_normals=True,
                          export_animations=False, export_materials='EXPORT', export_image_format='AUTO')
(OUT / 'build-report.json').write_text(json.dumps(report, indent=1, ensure_ascii=False) + '\n')
print('triangles', report['triangles'], 'size', report['size'])
