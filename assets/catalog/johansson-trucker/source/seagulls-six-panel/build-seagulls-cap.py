"""The Minato Seagulls cap: a 1990s six-panel snapback, built in Blender for Johansson World and Johansson Studio.

    python3 johansson-town/assets/catalog/seagulls-cap/source/build-seagulls-cap.py
    (Blender as a Python module, `pip install bpy`; or: blender --background --python <this file>)

Writes next to this file:
    seagulls-cap.blend   the Blender source (every part a named object, made by this script and nothing else)
    model.glb            the model Johansson Studio checks, exports and publishes into World's catalogue
                         (town-studio/assets/seagulls-cap/model.glb is a copy of it)
    build-report.json    the measurements, the parts and their triangles

What it is. A cap Sakura Shoten sells: Johansson Headwear's JH-605, a six-panel snapback in the Minato Seagulls' night
navy, the team's gull embroidered on the front. It is built as a real 1990s cap is made, part for part:
    - six panels sewn into a crown, a seam down the front and the back, each seam topstitched a row either side, a row of
      stitching round the band, one embroidered eyelet in each panel, the cloth-covered button on top;
    - the sweatband inside the band, the inside of the panels above it;
    - the bill (visor): a stiff board in cloth, curved across, with a real thickness, five rows of stitching on top, the
      cloth rolled round its edge, and the green undervisor of the period underneath;
    - the snapback: the arched opening at the back, bound, and the two plastic straps across it, the studs through the
      holes;
    - the embroidery: the team's gull on the front panels, raised as embroidery is, white on a navy edge, black wing tips,
      a yellow bill. Its wings make the M of Minato.

Its size. Every measurement is a real cap's (the reference below: a 1990s one-size snapback, 57.5 cm round the band),
scaled to the head it is worn on. Johansson World's people have the big round heads of the town's toy look, so the cap is
built on the town's own adult head (src/avatars/build.js measure() of the default recipe: Rh 0.2406 m, width 0.94,
height 1.08): it is the size a resident wears and the size Sakura sells it in. The wear code (src/avatars/hat-assets.js)
fits it to every other head from the head this file records in the model's extras (`wear`).

Its frame (World's catalogue): metres, y up, the front +z, the wearer's left +x, its lowest point at y = 0.

Colours. The cloth is one material, `cloth`, whose vertex colour is only a shade (1 the cloth, darker for the stitching,
the eyelets' holes and the inside): World paints it in the wearer's `hatColour`, so one model is a navy cap, a white one
and a green one. `trim` (undervisor, sweatband, button, straps) and `embroidery` carry their own colours. No textures.

Coordinates while building: the head as a unit sphere (`u`), x left, y up, z front, its centre at 0; `metres()` carries a
point onto the town's head. Every number is here; nothing is placed by hand.
"""
import bpy, bmesh, json, math
from pathlib import Path

HERE = Path(__file__).resolve().parent
NAME = 'Seagulls cap'

# ---- The real cap the measurements come from (a 1990s six-panel snapback, one size) ------------------------------
REAL = {
    'band': '57.5 cm round the band (sizes 55-60 by the strap), the sweatband 3 cm deep',
    'crown': 'six panels; the front pair stiffened, about 11 cm from band to button at the front, 12 cm at the back',
    'bill': '7 cm from the forehead, 19 cm round its root, 3-4 mm thick, curved across, five rows of stitching, green underneath',
    'button': '1.6 cm across, cloth covered',
    'eyelets': 'one per panel, two thirds of the way up, 9 mm across with a 4 mm hole',
    'opening': '6.5 cm wide and 4 cm high at the back, bound with tape',
    'strap': 'two plastic straps 1.8 cm high: seven studs on one, holes on the other',
    'embroidery': 'about 9 cm across the front panels, raised 1.5-2 mm',
}

# ---- The head it is built on: the town's adult (src/avatars/build.js measure(DEFAULT_RECIPE)) ---------------------
RH, HEAD_W, HEAD_H = 0.240555, 0.94, 1.08
SX, SY, SZ = RH * HEAD_W, RH * HEAD_H, RH * 0.98   # the head's radii in metres: across, up, front to back

# ---- The cap on that head, in head units ---------------------------------------------------------------------------
Y_FRONT, Y_SIDE, Y_BACK = 0.40, 0.27, 0.03   # the band's bottom edge: on the forehead, over the ears (clear of the
                                             # largest, Thuan's braids: 0.195), on the nape. The forehead shows
                                             # below the band: the brows are the face's voice (face.js browLift).
PHI_R = math.radians(73)                     # the bill's root runs round the band from temple to temple
OPEN_W, OPEN_H = 0.36, 0.27                  # the snapback opening: its half-width (radians round the back), its height
R_OUT, R_TOP = 1.09, 0.02                    # the crown's outside at the band (over the hair: a crop is 1.07), and
                                             # how much fuller it is at the top
FRONT_BULGE = 0.03                           # the stiffened front panels stand out a little
CLOTH = 0.02                                 # the cloth's thickness
R_BAND_FRONT = 1.012                         # the sweatband on the bare forehead (elsewhere it lies on the hair)
SEAM_DIP = 0.008                             # a seam sinks between its two rows of stitching
BILL_L, BILL_T, PITCH = 0.70, 0.05, math.radians(6)
ARCH = Y_FRONT - Y_SIDE                      # the bill's curve across: its corners meet the band at the temples
ALPHA_M = math.radians(75)                   # the bill's outline: half an oval, met at the corners
STRAP_LOW, STRAP_H = 0.03, 0.16              # the strap across the opening: from the band edge, 1.8 cm high
TUCK = 1.065                                 # hair under the crown is pressed to this radius (build.js addHair)

# ---- Colours (sRGB, from World's palettes) ---------------------------------------------------------------------------
COLOURS = {
    'cloth': '#27304d',        # Night navy (ISLAND_PALETTE): the Seagulls' navy, the jersey's piping
    'undervisor': '#2f5a3e',   # the green undervisor caps had until the late 2000s, against glare off the water
    'sweatband': '#cfc8b8',    # unbleached cotton
    'button': '#f4f1ea',       # Paper white
    'strap': '#2b2b2b',        # black plastic
    'gull': '#f8f6ef',         # white thread
    'gull-edge': '#27304d',    # the team's navy edge, so the gull reads on a white cap too
    'wingtips': '#2b2623',
    'bill': '#e8b83e',         # Turmeric yellow
}
# The cloth's shades: the vertex colour World multiplies the wearer's hatColour by.
SHADE = {'cloth': 1.0, 'stitch': 0.8, 'seam': 0.9, 'eyelet': 0.82, 'hole': 0.16, 'inside': 0.6, 'edge': 0.7}


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


# ---- The band line and the crown -------------------------------------------------------------------------------------
def wrap(phi):
    return math.atan2(math.sin(phi), math.cos(phi))


def band_y(phi):
    """The bottom edge of the crown (the band) at azimuth phi (0 the front, +pi/2 the wearer's left). In front it
    follows the bill's curve down to the temples; behind the temples it settles over the ears to the nape."""
    a = abs(wrap(phi))
    if a <= PHI_R:
        return Y_FRONT - ARCH * (math.sin(a) / math.sin(PHI_R)) ** 2
    f = (a - PHI_R) / (math.pi - PHI_R)
    m0 = -ARCH * 2 * math.sin(PHI_R) * math.cos(PHI_R) / math.sin(PHI_R) ** 2 * (math.pi - PHI_R) / (Y_SIDE - Y_BACK)
    g = (2 * f ** 3 - 3 * f ** 2 + 1) + (f ** 3 - 2 * f ** 2 + f) * m0     # Hermite: no kink at the temples
    return Y_BACK + (Y_SIDE - Y_BACK) * g


def opening(phi):
    """How far round the snapback opening a point is: 0 at its middle, 1 at its sides, above 1 outside it."""
    return abs(wrap(phi - math.pi)) / OPEN_W


def edge_y(phi):
    """The crown's bottom edge: the band, raised into the arch of the opening at the back."""
    d = opening(phi)
    return band_y(phi) + (OPEN_H * math.sqrt(max(0.0, 1 - d * d)) if d < 1 else 0.0)


def r_outer(phi, t, seam=0.0):
    front = max(0.0, math.cos(phi)) ** 2
    return R_OUT + R_TOP * t + FRONT_BULGE * front * math.sin(math.pi * min(1.0, t * 1.1)) - SEAM_DIP * seam * (1 - smoothstep(0.85, 1.0, t))


def thickness(phi, t):
    """The cloth, and at the front the sweatband standing in to the bare forehead."""
    front = smoothstep(0.5, 0.9, math.cos(phi))
    return CLOTH + (R_OUT - CLOTH - R_BAND_FRONT) * front * (1 - smoothstep(0.12, 0.3, t))


def theta_edge(phi):
    return math.acos(max(-1.0, min(1.0, edge_y(phi) / R_OUT)))


def crown_point(phi, t, r):
    th = theta_edge(phi) * (1 - t)
    return (r * math.sin(th) * math.sin(phi), r * math.cos(th), r * math.sin(th) * math.cos(phi))


def crown_outer(phi, t, seam=0.0):
    return crown_point(phi, t, r_outer(phi, t, seam))


def crown_normal(phi, t):
    e = 1e-4
    a = sub(crown_outer(phi + e, t), crown_outer(phi - e, t))
    b = sub(crown_outer(phi, min(1, t + e)), crown_outer(phi, max(0, t - e)))
    n = norm(cross(b, a))
    p = crown_outer(phi, t)
    return n if dot(n, p) > 0 else mul(n, -1)


# The six panels: the front pair either side of the front seam (phi 0), the back pair either side of the back seam
# (phi pi, through the opening). Columns: a narrow strip of topstitching along each seam, finer columns where the back
# panels are cut for the opening.
PANELS = [(-math.pi + i * math.pi / 3, -math.pi + (i + 1) * math.pi / 3) for i in range(6)]
NORMAL_COLS = [0, 0.04, 0.25, 0.5, 0.75, 0.96, 1]
o0 = 1 - OPEN_W / (math.pi / 3)            # where the opening starts, as a fraction of a back panel from its front edge
BACK_COLS = [0, 0.04, 0.3, 0.5, o0, o0 + (1 - o0) * 0.2, o0 + (1 - o0) * 0.45, o0 + (1 - o0) * 0.7, 0.96, 1]
ROWS = [0, 0.05, 0.075, 0.2, 0.34, 0.48, 0.6, 0.72, 0.84, 0.93]     # then the apex; 0.05-0.075: the band's stitching
LINING_ROWS = [0, 0.1, 0.22, 0.45, 0.7, 0.9]


def panel_columns(i):
    lo, hi = PANELS[i]
    if i == 0:      # -pi .. -2pi/3: the opening is at its -pi end
        return [lo + (hi - lo) * (1 - f) for f in reversed(BACK_COLS)]
    if i == 5:      # 2pi/3 .. pi
        return [lo + (hi - lo) * f for f in BACK_COLS]
    return [lo + (hi - lo) * f for f in NORMAL_COLS]


def build_crown():
    crown = part('Cap crown', 'cloth', 'body', note='six panels, seams, topstitching, the band stitching')
    lining = part('Cap lining', 'cloth', 'body', ink=0, note='the inside of the panels')
    sweat = part('Cap sweatband', 'trim', 'body', ink=0, note='cotton sweatband inside the band')
    rim = part('Cap band edge', 'cloth', 'body', note='the bottom edge of the crown, and the tape binding the opening')
    stitch, cloth, inside, edge = grey(SHADE['stitch']), grey(SHADE['cloth']), grey(SHADE['inside']), grey(SHADE['edge'])
    sweat_c = lin(COLOURS['sweatband'])
    for i in range(6):
        cols = panel_columns(i)
        n = len(cols)
        # outside
        grid = [[crown.v(crown_outer(phi, t, seam=1.0 if j in (0, n - 1) else 0.0)) for j, phi in enumerate(cols)] for t in ROWS]
        apex = crown.v(crown_outer(0, 1.0))
        for r in range(len(ROWS) - 1):
            band_stitch = ROWS[r] >= 0.05 and ROWS[r + 1] <= 0.075
            for j in range(n - 1):
                seam_strip = j == 0 or j == n - 2
                mid = (cols[j] + cols[j + 1]) / 2
                in_opening = opening(mid) < 1
                colour = stitch if (seam_strip or (band_stitch and True)) else cloth
                crown.quad(grid[r][j], grid[r][j + 1], grid[r + 1][j + 1], grid[r + 1][j], colour)
        for j in range(n - 1):
            colour = stitch if (j == 0 or j == n - 2) else cloth
            crown.f((grid[-1][j], grid[-1][j + 1], apex), colour)
        # inside: sweatband below, the panels' inside above
        def inner(phi, t):
            return crown_point(phi, t, r_outer(phi, t) - thickness(phi, t))
        lgrid = [[None] * n for _ in LINING_ROWS]
        for r, t in enumerate(LINING_ROWS):
            for j, phi in enumerate(cols):
                lgrid[r][j] = inner(phi, t)
        # the sweatband's two rows; round the opening the binding's inside is cloth, so those rows are the lining's
        cache = {}
        def vid(owner, r, j):
            key = (owner.name, r, j)
            if key not in cache:
                cache[key] = owner.v(lgrid[r][j])
            return cache[key]
        li = [[vid(lining, r, j) for j in range(n)] for r in range(2, len(LINING_ROWS))]
        lapex = lining.v(inner(0, 1.0))
        for j in range(n - 1):
            in_opening = opening((cols[j] + cols[j + 1]) / 2) < 1
            owner, c = (lining, inside) if in_opening else (sweat, sweat_c)
            for r in range(2):     # seen from inside: reverse winding
                owner.quad(vid(owner, r, j), vid(owner, r + 1, j), vid(owner, r + 1, j + 1), vid(owner, r, j + 1), c)
            for r in range(len(li) - 1):
                lining.quad(li[r][j], li[r + 1][j], li[r + 1][j + 1], li[r][j + 1], inside)
            lining.f((li[-1][j], lapex, li[-1][j + 1]), inside)
        # the bottom edge, outside to inside (bound with tape round the opening)
        for j in range(n - 1):
            a, b = crown_outer(cols[j], 0, 1.0 if j == 0 else 0.0), crown_outer(cols[j + 1], 0, 1.0 if j + 1 == n - 1 else 0.0)
            c, d = lgrid[0][j + 1], lgrid[0][j]
            ids = [rim.v(p) for p in (a, d, c, b)]
            rim.quad(*ids, edge, smooth=False)
    return crown


# ---- The button, the eyelets ---------------------------------------------------------------------------------------
def frame_at(p, n):
    up = (0, 1, 0) if abs(n[1]) < 0.9 else (0, 0, 1)
    u = norm(cross(up, n))
    v = cross(n, u)
    return u, v


def build_button():
    b = part('Cap button', 'trim', 'decoration', note='the cloth-covered button where the six panels meet')
    top = crown_outer(0, 1.0)
    c = lin(COLOURS['button'])
    rad, h, seg = 0.085, 0.05, 10
    prof = [(rad * 0.92, -0.012), (rad, 0.006), (rad * 0.93, h * 0.55), (rad * 0.62, h * 0.9), (rad * 0.25, h)]
    rings = [[b.v((r * math.cos(2 * math.pi * k / seg), top[1] + y, r * math.sin(2 * math.pi * k / seg))) for k in range(seg)] for r, y in prof]
    cap = b.v((0, top[1] + h * 1.02, 0))
    for r in range(len(rings) - 1):
        for k in range(seg):
            k2 = (k + 1) % seg
            b.quad(rings[r][k], rings[r + 1][k], rings[r + 1][k2], rings[r][k2], c)
    for k in range(seg):
        b.f((rings[-1][k], cap, rings[-1][(k + 1) % seg]), c)


def build_eyelets():
    e = part('Cap eyelets', 'cloth', 'decoration', ink=0, note='an embroidered eyelet in each panel, to let the heat out')
    ring, hole = grey(SHADE['eyelet']), grey(SHADE['hole'])
    for i in range(6):
        lo, hi = PANELS[i]
        phi = (lo + hi) / 2
        t = 0.6
        p, n = crown_outer(phi, t), crown_normal(phi, t)
        u, v = frame_at(p, n)
        seg, ro, ri = 8, 0.05, 0.022
        def at(r, a, lift):
            return add(add(p, mul(n, lift)), add(mul(u, r * math.cos(a)), mul(v, r * math.sin(a))))
        base = [e.v(at(ro, 2 * math.pi * k / seg, -0.004)) for k in range(seg)]
        outer = [e.v(at(ro * 0.9, 2 * math.pi * k / seg, 0.004)) for k in range(seg)]
        inner = [e.v(at(ri, 2 * math.pi * k / seg, 0.004)) for k in range(seg)]
        centre = e.v(add(p, mul(n, 0.0005)))
        hole_ring = [e.v(at(ri * 0.98, 2 * math.pi * k / seg, 0.0035)) for k in range(seg)]
        for k in range(seg):
            k2 = (k + 1) % seg
            e.quad(base[k], base[k2], outer[k2], outer[k], ring)
            e.quad(outer[k], outer[k2], inner[k2], inner[k], ring)
            e.f((hole_ring[k], hole_ring[k2], centre), hole)      # the hole: a dark cup in the ring


# ---- The bill --------------------------------------------------------------------------------------------------------
BILL_S = 14
BILL_V = [0, 0.16, 0.23, 0.27, 0.38, 0.42, 0.53, 0.57, 0.68, 0.72, 0.83, 0.87, 1]   # five rows of stitching
STITCH_ROWS = {(0.23, 0.27), (0.38, 0.42), (0.53, 0.57), (0.68, 0.72), (0.83, 0.87)}


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
    if abs(s) >= 0.999:     # the corner: a hair ahead of the root, so the bill closes with a face, not a sliver
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
    top = part('Cap bill', 'cloth', 'body', note='the visor: a curved board in cloth, five rows of stitching, the rolled edge')
    under = part('Cap undervisor', 'trim', 'body', note='the green undervisor')
    cloth, stitch, green = grey(SHADE['cloth']), grey(SHADE['stitch']), lin(COLOURS['undervisor'])
    ss = [-1 + 2 * k / BILL_S for k in range(BILL_S + 1)]
    T = [[top.v(bill_top(s, v)) for s in ss] for v in BILL_V]
    for r in range(len(BILL_V) - 1):
        c = stitch if (BILL_V[r], BILL_V[r + 1]) in STITCH_ROWS else cloth
        for k in range(BILL_S):
            top.quad(T[r][k], T[r + 1][k], T[r + 1][k + 1], T[r][k + 1], c)
    # the edge, rolled round from the top to the underside
    steps = 4
    roll = []
    for s in ss:
        p, n = bill_top(s, 1.0), bill_outward(s)
        centre = (p[0], p[1] - BILL_T / 2, p[2])
        ring = []
        for q in range(steps + 1):
            b = math.pi / 2 - math.pi * q / steps
            ring.append(add(centre, add(mul(n, BILL_T / 2 * math.cos(b) * 0.9), (0, BILL_T / 2 * math.sin(b), 0))))
        roll.append(ring)
    R = [[top.v(roll[k][q]) for k in range(BILL_S + 1)] for q in range(steps + 1)]
    for q in range(steps):
        for k in range(BILL_S):
            top.quad(R[q][k], R[q + 1][k], R[q + 1][k + 1], R[q][k + 1], cloth)
    # the underside, green, its edge where the roll ends
    UV = [0, 0.35, 0.7, 1]
    U = [[under.v(sub(bill_top(s, v), (0, BILL_T, 0)) if v < 1 else roll[k][steps]) for k, s in enumerate(ss)] for v in UV]
    for r in range(len(UV) - 1):
        for k in range(BILL_S):
            under.quad(U[r][k], U[r][k + 1], U[r + 1][k + 1], U[r + 1][k], green)
    # the root, closed inside the crown, and the two corners
    for k in range(BILL_S):
        a, b = bill_top(ss[k], 0), bill_top(ss[k + 1], 0)
        ids = [under.v(p) for p in (a, b, sub(b, (0, BILL_T, 0)), sub(a, (0, BILL_T, 0)))]
        under.quad(*ids, green)
    for k, sgn in ((0, 1), (BILL_S, -1)):      # the corners: the cloth turned round the end of the board
        col_top = [bill_top(ss[k], v) for v in UV]
        col_bot = [sub(p, (0, BILL_T, 0)) for p in col_top[:-1]] + [roll[k][steps]]
        for r in range(len(UV) - 1):
            ids = [top.v(p) for p in (col_top[r], col_top[r + 1], col_bot[r + 1], col_bot[r])]
            if sgn < 0:
                top.quad(*ids, cloth)
            else:
                top.quad(ids[0], ids[3], ids[2], ids[1], cloth)


# ---- The snapback ----------------------------------------------------------------------------------------------------
def build_strap():
    st = part('Cap snapback strap', 'trim', 'decoration', note='two plastic straps across the opening, studs through holes')
    c = lin(COLOURS['strap'])
    lo, hi = math.pi - OPEN_W - 0.12, math.pi + OPEN_W + 0.12
    seg = 12
    r_in, r_out = R_OUT - CLOTH + 0.004, R_OUT - 0.006
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
        # outside faces backwards (-z): wind so the normal points away from the head
        st.quad(O0[k], O0[k + 1], O1[k + 1], O1[k], c, smooth=True)
        st.quad(I0[k + 1], I0[k], I1[k], I1[k + 1], c, smooth=True)
        st.quad(O1[k], O1[k + 1], I1[k + 1], I1[k], c, smooth=False)
        st.quad(I0[k], I0[k + 1], O0[k + 1], O0[k], c, smooth=False)
    # the studs that show through the outer strap's holes: six across the middle
    for i in range(6):
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


# ---- The embroidery --------------------------------------------------------------------------------------------------
# The team's gull, seen head on in flight: its wings make the M of Minato. Half the outline (x >= 0), from the top of the
# head round to the bottom of the body, in the design's own units (2 across); the other half is its mirror.
GULL_HALF = [(0.0, 0.34), (0.08, 0.32), (0.125, 0.25), (0.16, 0.2), (0.3, 0.33), (0.45, 0.45), (0.6, 0.51), (0.72, 0.49),
             (0.84, 0.37), (0.94, 0.2), (1.0, 0.0), (0.88, 0.04), (0.76, 0.12), (0.65, 0.17), (0.53, 0.12), (0.4, 0.03),
             (0.27, -0.06), (0.17, -0.15), (0.09, -0.23), (0.0, -0.26)]
WINGTIP_FROM = 0.82         # the black tips: the part of each wing beyond this
BEAK = [(-0.05, 0.22), (0.05, 0.22), (0.0, 0.1)]
GULL_SCALE = 0.46           # design units to head units (arc length on the crown): about 0.86 across
GULL_LIFT = (0.009, 0.017, 0.022)     # the navy edge, the white, the tips and bill: raised as embroidery is
GULL_EDGE = 0.055           # the navy edge's width, in design units
GULL_ABOVE_BAND = 0.32      # the gull's centre, up the front seam from the band


def outline():
    right = GULL_HALF
    left = [(-x, y) for x, y in reversed(right[1:-1])]
    return right + left


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


def triangulate(poly):
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


# the front meridian: arc length from the band up, to find how high on the crown a point of the design is
_MER = []
_acc = 0.0
_prev = crown_outer(0, 0)
for _k in range(1, 401):
    _t = _k / 400
    _p = crown_outer(0, _t)
    _acc += math.dist(_p, _prev)
    _MER.append((_acc, _t))
    _prev = _p


def t_at(arc):
    lo = (0.0, 0.0)
    for a, t in _MER:
        if a >= arc:
            f = (arc - lo[0]) / ((a - lo[0]) or 1)
            return lo[1] + (t - lo[1]) * f
        lo = (a, t)
    return 1.0


def on_crown(x, y, lift):
    """A point of the design (x across, y up, head units of arc) on the front of the crown, lifted off it."""
    t = t_at(GULL_ABOVE_BAND + y)
    p0 = crown_outer(0, t)
    rho = math.hypot(p0[0], p0[2]) or 1
    phi = x / rho
    p, n = crown_outer(phi, t), crown_normal(phi, t)
    return add(p, mul(n, lift))


def raised(part_, poly, lift, colour, wall_to):
    """A piece of embroidery: its top following the crown at `lift`, its edge standing down to `wall_to`."""
    pts, tris = triangulate(poly)
    ids = [part_.v(on_crown(x * GULL_SCALE, y * GULL_SCALE, lift)) for x, y in pts]
    for a, b, c in tris:
        part_.f((ids[a], ids[b], ids[c]), colour, smooth=True)
    n = len(poly)
    area = sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n))
    for i in range(n):
        j = (i + 1) % n
        a, b = poly[i], poly[j]
        top_a, top_b = on_crown(a[0] * GULL_SCALE, a[1] * GULL_SCALE, lift), on_crown(b[0] * GULL_SCALE, b[1] * GULL_SCALE, lift)
        bot_a, bot_b = on_crown(a[0] * GULL_SCALE, a[1] * GULL_SCALE, wall_to), on_crown(b[0] * GULL_SCALE, b[1] * GULL_SCALE, wall_to)
        q = [part_.v(p) for p in (bot_a, bot_b, top_b, top_a)]
        if area > 0:
            part_.quad(q[0], q[1], q[2], q[3], colour, smooth=False)
        else:
            part_.quad(q[0], q[3], q[2], q[1], colour, smooth=False)


def build_embroidery():
    em = part('Cap embroidery', 'embroidery', 'sign', ink=0,
              note='the Minato Seagulls gull: white on a navy edge, black wing tips, a yellow bill; its wings make the M of Minato')
    gull = outline()
    raised(em, offset(gull, GULL_EDGE), GULL_LIFT[0], lin(COLOURS['gull-edge']), -0.012)
    raised(em, gull, GULL_LIFT[1], lin(COLOURS['gull']), GULL_LIFT[0] - 0.002)
    for sgn in (1, -1):
        tip = [(x, y) for x, y in GULL_HALF if x >= WINGTIP_FROM - 1e-9]
        # close the tip along the line x = WINGTIP_FROM: where the outline crosses it above and below
        def cross_at(points):
            for (x0, y0), (x1, y1) in zip(points, points[1:]):
                if (x0 - WINGTIP_FROM) * (x1 - WINGTIP_FROM) <= 0 and x0 != x1:
                    f = (WINGTIP_FROM - x0) / (x1 - x0)
                    return (WINGTIP_FROM, y0 + (y1 - y0) * f)
            return None
        upper = cross_at(GULL_HALF[:11])
        lower = cross_at(GULL_HALF[10:])
        poly = [upper] + [(x, y) for x, y in GULL_HALF if x > WINGTIP_FROM] + [lower]
        poly = offset(poly, -0.012)
        poly = [(sgn * x, y) for x, y in poly]
        if sgn < 0:
            poly = list(reversed(poly))
        raised(em, poly, GULL_LIFT[2], lin(COLOURS['wingtips']), GULL_LIFT[1] - 0.002)
    raised(em, BEAK, GULL_LIFT[2], lin(COLOURS['bill']), GULL_LIFT[1] - 0.002)


# ---- Build -----------------------------------------------------------------------------------------------------------
build_crown()
build_button()
build_eyelets()
build_bill()
build_strap()
build_embroidery()

# head units to metres on the town's head; the lowest point at y = 0
low = min(v[1] * SY for p in PARTS for v in p.verts)
Y0 = -low


def metres(v):
    return (v[0] * SX, v[1] * SY + Y0, v[2] * SZ)


def blender(v):
    x, y, z = metres(v)
    return (x, -z, y)          # glTF's y up and +z front are Blender's z up and -y


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0      # no .blend1 beside the source
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'

MATERIALS = {}
for name, base in (('cloth', COLOURS['cloth']), ('trim', '#ffffff'), ('embroidery', '#ffffff')):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    c = lin(base)
    bsdf.inputs['Base Color'].default_value = (*c, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.85 if name != 'trim' else 0.6
    bsdf.inputs['Metallic'].default_value = 0.0
    MATERIALS[name] = m

root = bpy.data.objects.new(NAME, None)
scene.collection.objects.link(root)
WEAR = {
    'about': "How World fits this cap to a head (src/avatars/hat-assets.js): a point's place on the head it was built on "
             "(head: its centre and radii, metres) is carried to the same place on the wearer's head; the hair under the "
             "crown is pressed in to `tuck` (head radii) above the band, except in the opening above the strap.",
    'head': {'centre': [0.0, round(Y0, 6), 0.0], 'radii': [round(SX, 6), round(SY, 6), round(SZ, 6)],
             'recipe': 'the default adult (src/avatars/recipe.js DEFAULT_RECIPE): Rh 0.240555, width 0.94, height 1.08, oval'},
    'band': {'front': Y_FRONT, 'side': Y_SIDE, 'back': Y_BACK, 'billRoot': round(PHI_R, 6), 'arch': ARCH},
    'opening': {'halfWidth': OPEN_W, 'height': OPEN_H, 'strapHeight': STRAP_H},
    'tuck': {'radius': TUCK, 'front': R_BAND_FRONT - 0.005, 'frontFrom': 0.5, 'frontTo': 0.9},
}
root['asset'] = NAME
root['maker'] = 'Johansson Headwear, model JH-605 (six-panel snapback)'
root['wear'] = json.dumps(WEAR)
root['colours'] = json.dumps(COLOURS)
root['shades'] = json.dumps(SHADE)

report = {'parts': [], 'real': REAL, 'wear': WEAR}
for p in PARTS:
    mesh = bpy.data.meshes.new(p.name)
    mesh.from_pydata([blender(v) for v in p.verts], [], p.faces)
    mesh.update()
    attr = mesh.color_attributes.new('Color', 'FLOAT_COLOR', 'CORNER')
    for poly in mesh.polygons:
        col = p.colours[poly.index]
        poly.use_smooth = p.smooth[poly.index]
        for li in poly.loop_indices:
            attr.data[li].color = (*col, 1.0)
    mesh.color_attributes.active_color = attr
    mesh.materials.append(MATERIALS[p.material])
    obj = bpy.data.objects.new(p.name, mesh)
    obj['role'] = p.role
    obj['ink'] = p.ink
    obj['note'] = p.note
    obj.parent = root
    scene.collection.objects.link(obj)
    report['parts'].append({'name': p.name, 'material': p.material, 'role': p.role, 'ink': p.ink, 'triangles': p.triangles, 'note': p.note})

# Merge the vertices each part shares (the panels keep their seams: their own vertices on each side).
for obj in root.children:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    if obj.name not in ('Cap crown',):
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bm.to_mesh(obj.data)
    bm.free()

allv = [metres(v) for p in PARTS for v in p.verts]
lo = [min(v[i] for v in allv) for i in range(3)]
hi = [max(v[i] for v in allv) for i in range(3)]
report['size'] = [round(hi[i] - lo[i], 4) for i in range(3)]
report['min'] = [round(v, 4) for v in lo]
report['max'] = [round(v, 4) for v in hi]
report['triangles'] = sum(p.triangles for p in PARTS)
# Named points (metres, the asset's frame) a place uses: the head it is built on (its centre, and the top, the wearer's left
# and the front of it: a cap form on a stand is that head), the peg through the top of the opening a cap hangs from on a
# hook, the top of the button, the tip of the bill, the middle of the band at the front.
_peg_y = Y_BACK + OPEN_H - 0.03
_peg_rho = math.sqrt((R_OUT - CLOTH / 2) ** 2 - _peg_y ** 2)
report['anchors'] = {k: [round(c, 4) for c in metres(v)] for k, v in {
    'head-centre': (0.0, 0.0, 0.0), 'head-top': (0.0, 1.0, 0.0), 'head-left': (1.0, 0.0, 0.0), 'head-front': (0.0, 0.0, 1.0),
    'peg': (0.0, _peg_y, -_peg_rho),
    'crown-top': (0.0, crown_outer(0, 1.0)[1] + 0.05, 0.0),
    'bill-tip': bill_top(0.0, 1.0),
    'band-front': crown_outer(0.0, 0.0),
}.items()}
report['materials'] = len(MATERIALS)

bpy.ops.wm.save_as_mainfile(filepath=str(HERE / 'seagulls-cap.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=str(HERE / 'model.glb'), export_format='GLB', export_yup=True, export_apply=True,
                          export_extras=True, export_vertex_color='ACTIVE', export_texcoords=False, export_normals=True,
                          export_animations=False, export_materials='EXPORT')
(HERE / 'build-report.json').write_text(json.dumps(report, indent=1, ensure_ascii=False) + '\n')
print('triangles', report['triangles'], 'size', report['size'])
