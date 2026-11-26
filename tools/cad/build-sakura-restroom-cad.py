"""Sakura's restroom sanitary ware, drawn as CAD solids in millimetres.

  python tools/cad/build-sakura-restroom-cad.py          (needs build123d 0.13)

Reads art/sakura-restroom/spec.json. Writes, under art/sakura-restroom/cad/:
  toilet.step, washbasin.step      the solids, one labelled part each
  parts/<fixture>-<part>.stl       tessellated parts for Blender (tools/blender/build-sakura-restroom.py)
  parts.json                       each part's finish, pivot, size, volume, and the interference check
  SK-401-sanitary-ware.svg / .dxf  the dimensioned three-view sheet

Frame of each fixture: wall plane Y=0, the fixture stands out to +Y, X across, Z up from the floor.
The build stops if two parts of a fixture occupy the same space.
"""
import json
from pathlib import Path
from build123d import *

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art/sakura-restroom'
OUT = SRC / 'cad'
S = json.loads((SRC / 'spec.json').read_text())
T, B = S['toilet'], S['washbasin']


def ell(rx, ry, cy, z):
    return Pos(0, cy, z) * Ellipse(rx, ry)


def tube(points, radius, tangents=None):
    path = Spline(*points, tangents=tangents) if tangents else Spline(*points)
    return sweep(Plane(origin=path @ 0, z_dir=path % 0) * Circle(radius), path)


def pipe(points, radius, bend):
    path = FilletPolyline(*points, radius=bend)
    return sweep(Plane(origin=path @ 0, z_dir=path % 0) * Circle(radius), path)


def xcyl(r, length, x, y, z):
    """A cylinder along X starting at x."""
    return Pos(x, y, z) * Rot(0, 90, 0) * Cylinder(r, length, align=(Align.CENTER, Align.CENTER, Align.MIN))


def ycyl(r, length, x, y, z):
    """A cylinder along +Y starting at y."""
    return Pos(x, y, z) * Rot(-90, 0, 0) * Cylinder(r, length, align=(Align.CENTER, Align.CENTER, Align.MIN))


def zcyl(r, h, x, y, z):
    return Pos(x, y, z) * Cylinder(r, h, align=(Align.CENTER, Align.CENTER, Align.MIN))


# ============================================================================ toilet
def toilet():
    P = T['projection']; rimZ = T['seatHeight'] - 24
    tk, tl = T['tank'], T['tankLid']
    rim_rx, rim_ry = T['bowlWidth'] / 2, 285
    rim_cy = P - rim_ry
    # The bowl: a foot, a waist, the swelling under the rim, the rim.
    body = loft([ell(128, 215, 395, 0), ell(112, 198, 395, 60), ell(118, 215, 415, 170),
                 ell(168, 268, rim_cy - 6, 300), ell(rim_rx, rim_ry, rim_cy, rimZ - 18)])
    rim = extrude(ell(rim_rx, rim_ry, rim_cy, rimZ - 18), 18)
    rim = fillet(rim.edges().group_by(Axis.Z)[-1], 7)
    # The rear: one column from the floor to the deck the cistern stands on, holding the trapway. One solid, so the
    # bowl grows out of a plain face and no ledge or sliver is left where pieces meet.
    column = Pos(0, tk['standoff'] + 140, tk['base'] / 2) * Box(T['deckWidth'], 280, tk['base'])
    column = fillet(column.edges().filter_by(Axis.Z), 55)
    column = fillet(column.edges().group_by(Axis.Z)[-1], 8)
    bowl = body + column
    # Glazed ware has no crease where the bowl leaves the column: the seam the two solids make is rounded off.
    known = [e.center() for e in body.edges()] + [e.center() for e in column.edges()]
    seam = [e for e in bowl.edges() if 30 < e.center().Z < rimZ - 30 and all((e.center() - c).length > 1 for c in known)]
    bowl = fillet(seam, 9)
    bowl = bowl + rim
    # The well: wide under the rim, drawn down and back to the trap.
    well = loft([ell(rim_rx - 38, rim_ry - 62, rim_cy + 18, rimZ + 1), ell(rim_rx - 50, rim_ry - 80, rim_cy + 12, rimZ - 40),
                 ell(98, 140, rim_cy - 6, 250), ell(58, 74, rim_cy - 40, 170)])
    bowl = bowl - well
    water = well & (Pos(0, rim_cy, 197) * Box(400, 600, 6))
    sump = well & (Pos(0, rim_cy, 150) * Box(400, 600, 88))   # dark under the water: the trap's throat

    # Seat and lid share the outline; the seat is a ring, the lid a plate stood up against the cistern.
    seat_rx, seat_ry, seat_cy = rim_rx + 4, 246, P + 4 - 246
    seatZ = rimZ + 3
    ring = extrude(ell(seat_rx, seat_ry, seat_cy, seatZ), 21) - extrude(ell(seat_rx - 72, seat_ry - 86, seat_cy + 6, seatZ - 1), 23)
    ring = fillet(ring.edges().group_by(Axis.Z)[-1], 7)
    ring = fillet(ring.edges().group_by(Axis.Z)[0], 2)
    # The hinge stands on the deck behind the seat: two knuckles on posts. The lid turns about their axis.
    hingeY, hingeZ = seat_cy - seat_ry - 14, seatZ + 21 + 9
    buffers = [Pos(sx, seat_cy + sy, seatZ - 1.5) * Cylinder(9, 3) for sx, sy in ((-130, 60), (130, 60), (-70, 215), (70, 215))]
    seat = ring
    lid = extrude(ell(seat_rx, seat_ry, seat_cy, hingeZ - 9), 17)
    lid = fillet(lid.edges().group_by(Axis.Z)[-1], 8)
    lid = fillet(lid.edges().group_by(Axis.Z)[0], 2)
    lid = lid.rotate(Axis((0, hingeY, hingeZ), (1, 0, 0)), T['lidAngle'])
    hinge = None
    for sx in (-95, 95):
        k = xcyl(10, 46, sx - 23, hingeY, hingeZ) + Pos(sx, hingeY, (rimZ + hingeZ) / 2) * Box(30, 16, hingeZ - rimZ)
        hinge = k if hinge is None else hinge + k

    # The cistern and its lid with the hand-wash dish.
    y0 = tk['standoff']; tz = tk['base']
    tank = Pos(0, y0 + tk['depth'] / 2, tz + tk['height'] / 2) * Box(tk['width'], tk['depth'], tk['height'])
    tank = fillet(tank.edges().filter_by(Axis.Z), 38)
    tank = fillet(tank.edges().group_by(Axis.Z)[0], 10)
    o = tl['overhang']; lz = tz + tk['height']
    cap = Pos(0, y0 + tk['depth'] / 2, lz + tl['thickness'] / 2) * Box(tk['width'] + 2 * o, tk['depth'] + 2 * o, tl['thickness'])
    cap = fillet(cap.edges().filter_by(Axis.Z), 44)
    cap = fillet(cap.edges().group_by(Axis.Z)[-1], 9)
    cap = fillet(cap.edges().group_by(Axis.Z)[0], 4)
    capTop = lz + tl['thickness']
    dishC = (0, y0 + tk['depth'] / 2 + 14, capTop + 4)
    dish = Pos(*dishC) * scale(Sphere(1), by=(150, 62, 26))
    cap = cap - dish - zcyl(8, 30, 0, dishC[1] + 6, capTop - 40)
    drain = zcyl(11, 2, 0, dishC[1] + 6, capTop - 20.8) - zcyl(5, 4, 0, dishC[1] + 6, capTop - 22)

    # The swan-neck spout over the dish, on its backnut.
    sy = y0 + 26
    spout = tube([(0, sy, capTop), (0, sy, capTop + 62), (0, sy + 30, T['spoutHeight']), (0, sy + 68, capTop + 78), (0, sy + 72, capTop + 52)], 7.5,
                 tangents=[(0, 0, 1), (0, 0, -1)])
    spout = spout + zcyl(13, 8, 0, sy, capTop) + zcyl(10.5, 6, 0, sy, capTop + 8) + zcyl(9.5, 14, 0, sy + 72, capTop + 40)

    # The flush lever: a boss through the tank side and a cranked arm with a paddle.
    lx, ly, lzv = T['lever']['pivot']; L = T['lever']['length']; out = 1 if lx > 0 else -1
    side = lambda r, length, at: xcyl(r, length, lx + out * at if out > 0 else lx - at - length, ly, lzv)
    boss = side(17, 14, 0) + side(12, 6, 14)
    arm = Pos(lx + out * 24, ly + L / 2 - 4, lzv) * Box(8, L, 15)
    arm = fillet(arm.edges().filter_by(Axis.X), 5)
    paddle = Pos(lx + out * 24, ly + L - 6, lzv) * Box(9, 26, 26)
    paddle = fillet(paddle.edges().filter_by(Axis.X), 9)
    lever = side(9, 10, 20) + arm + paddle

    # The stop valve on the wall and the supply up into the tank's base.
    vx, _, vz = T['stopValve']['centre']
    valve = ycyl(24, 6, vx, 0, vz) + ycyl(13, 52, vx, 0, vz) + zcyl(11, 26, vx, 40, vz + 6) + ycyl(8, 12, vx, 50, vz)
    slot = Pos(vx, 62, vz) * Box(2.4, 6, 14)
    valve = valve - slot
    supply = pipe([(vx, 40, vz + 30), (vx, 40, tz - 120), (vx, y0 + 80, tz - 60), (vx, y0 + 80, tz)], 6.5, 28) + zcyl(12, 14, vx, y0 + 80, tz - 14)

    return [('Bowl', bowl, 'Porcelain'), ('Water', water, 'Water'), ('Sump', sump, 'Shadow'), ('Seat', seat, 'SeatPlastic'),
            ('SeatBuffers', buffers[0] + buffers[1] + buffers[2] + buffers[3], 'Rubber'), ('Lid', lid, 'SeatPlastic'), ('Hinge', hinge, 'SeatPlastic'),
            ('Tank', tank, 'Porcelain'), ('TankLid', cap, 'Porcelain'), ('DishDrain', drain, 'Chrome'),
            ('Spout', spout, 'Chrome'), ('LeverBoss', boss, 'Chrome'), ('FlushLever', lever, 'Chrome'),
            ('StopValve', valve + supply, 'Chrome')], {
        'FlushLever': {'pivot': [lx, ly, lzv], 'axis': [1, 0, 0]}}


# ========================================================================= washbasin
def washbasin():
    W, D, H = B['width'], B['projection'], B['rimHeight']
    def dee(w, d, front, z, back=0):
        """The basin's outline at a height: square to the wall, round to the room."""
        r = Pos(0, back + (d - back) / 2) * Rectangle(w, d - back)
        r = fillet(r.vertices().group_by(Axis.Y)[-1], front)
        r = fillet(r.vertices().group_by(Axis.Y)[0], 18)
        return Pos(0, 0, z) * r
    slab = extrude(dee(W, D, 175, H - 44), 44)
    slab = fillet(slab.edges().group_by(Axis.Z)[-1], 11)
    under = loft([dee(W - 16, D - 8, 168, H - 44), dee(W - 130, D - 70, 125, H - 112, 8), dee(250, 268, 95, H - 168, 16)])
    basin = slab + under
    cy = 238
    bowl = Pos(0, cy, H + 5) * scale(Sphere(1), by=(W / 2 - 52, 150, B['bowlDepth'] + 5))
    basin = basin - bowl
    bz = H - B['bowlDepth']
    basin = basin - zcyl(19, 80, 0, cy, bz - 60) - ycyl(8, 40, 0, cy - 150 - 22, H - 34)       # waste, and the overflow in the back of the bowl
    waste = zcyl(25, 2.4, 0, cy, bz + 1.9) - zcyl(15, 6, 0, cy, bz)
    grid = Pos(0, cy, bz + 2.9) * Box(31, 3, 2) + Pos(0, cy, bz + 2.9) * Box(3, 31, 2)
    waste = waste + grid

    ped = loft([Pos(0, 150, 0) * RectangleRounded(230, 210, 60), Pos(0, 140, 380) * RectangleRounded(176, 176, 55),
                Pos(0, 128, H - 168) * RectangleRounded(190, 180, 58)])
    plinth = extrude(Pos(0, 150, 0) * RectangleRounded(238, 218, 62), 22)
    plinth = fillet(plinth.edges().group_by(Axis.Z)[-1], 6)
    ped = ped + plinth

    # The pillar tap: flange, body, the spout swept out and down to its outlet, the headwork and a cross head.
    tx, ty = B['tap']['centre']; oz = B['tap']['outletHeight']
    body = zcyl(25, 5, tx, ty, H) + zcyl(21, 4, tx, ty, H + 5)
    body = body + loft([Pos(tx, ty, H + 9) * Circle(18.5), Pos(tx, ty, H + 34) * Circle(15.5), Pos(tx, ty, H + 62) * Circle(17)])
    reach = B['tap']['reach']
    spout = tube([(tx, ty + 4, H + 46), (tx, ty + reach * .55, H + 70), (tx, ty + reach, H + 60), (tx, ty + reach + 5, oz - 18)], 10.5,
                 tangents=[(0, 1, .55), (0, 0, -1)])
    nozzle = zcyl(12.5, 16, tx, ty + reach + 5, oz - 32)
    head = zcyl(15.5, 9, tx, ty, H + 62) + zcyl(11.5, 13, tx, ty, H + 71) + zcyl(6, 10, tx, ty, H + 84)
    tap = body + spout + nozzle + head
    hz = H + 100
    hub = zcyl(12.5, 13, 0, 0, -6.5)
    hub = fillet(hub.edges().group_by(Axis.Z)[-1], 3)
    arms = None
    for a in (45, 135, 225, 315):
        arm = Rot(0, 0, a) * (xcyl(5.2, 27, 6, 0, 0) + Pos(34, 0, 0) * Sphere(7.6))
        arms = arm if arms is None else arms + arm
    handle = Pos(tx, ty, hz) * (hub + arms)
    index = zcyl(7.5, 2, tx, ty, hz + 6.2)
    return [('Basin', basin, 'Porcelain'), ('Pedestal', ped, 'Porcelain'), ('Waste', waste, 'Chrome'),
            ('Tap', tap, 'Chrome'), ('TapHandle', handle, 'Chrome'), ('TapIndex', index, 'IndexBlue')], {
        'TapHandle': {'pivot': [tx, ty, hz], 'axis': [0, 0, 1]}}


# ================================================================== checks and files
def interference(parts, allow=()):
    worst = []
    for i, (a, sa, _) in enumerate(parts):
        for b, sb, _ in parts[i + 1:]:
            if {a, b} in [set(p) for p in allow]:
                continue
            ba, bb = sa.bounding_box(), sb.bounding_box()
            if ba.max.X < bb.min.X or bb.max.X < ba.min.X or ba.max.Y < bb.min.Y or bb.max.Y < ba.min.Y or ba.max.Z < bb.min.Z or bb.max.Z < ba.min.Z:
                continue
            common = sa & sb
            v = common.volume if common else 0
            if v > 1:
                worst.append((a, b, round(v, 1)))
    return worst


def export(name, parts, pivots, allow):
    (OUT / 'parts').mkdir(parents=True, exist_ok=True)
    for label, shape, _ in parts:
        assert shape.is_valid, f'{name} {label} is not a valid solid'
    clash = interference(parts, allow)
    if clash:
        raise SystemExit(f'{name}: parts occupy the same space (mm³): {clash}')
    kids = []
    record = []
    for label, shape, finish in parts:
        solid = Compound(shape.solids()) if len(shape.solids()) != 1 else shape.solids()[0]
        solid.label = label
        kids.append(solid)
        export_stl(solid, str(OUT / 'parts' / f'{name}-{label}.stl'), tolerance=.2 if finish in ('Chrome', 'IndexBlue') else .5,
                   angular_tolerance=.34 if finish in ('Chrome', 'IndexBlue') else .3)
        bb = solid.bounding_box()
        record.append({'part': label, 'finish': finish, 'stl': f'parts/{name}-{label}.stl', 'volume_mm3': round(solid.volume),
                       'min': [round(v, 1) for v in (bb.min.X, bb.min.Y, bb.min.Z)], 'max': [round(v, 1) for v in (bb.max.X, bb.max.Y, bb.max.Z)],
                       **({'pivot': pivots[label]['pivot'], 'axis': pivots[label]['axis']} if label in pivots else {})})
    assembly = Compound(label=name, children=kids)
    export_step(assembly, str(OUT / f'{name}.step'))
    return assembly, record


def view(shape, direction, up, at, sheet):
    """Projects a fixture and drops the visible and hidden lines on the sheet at `at` (sheet mm, 1:10)."""
    bb = shape.bounding_box(); c = bb.center()
    origin = (c.X + direction[0] * 3000, c.Y + direction[1] * 3000, c.Z + direction[2] * 3000)
    visible, hidden = shape.project_to_viewport(origin, viewport_up=up, look_at=(c.X, c.Y, c.Z))
    k = .1
    place = lambda edges: [Pos(at[0], at[1]) * e.scale(k) for e in edges]
    sheet['visible'] += place(visible); sheet['hidden'] += place(hidden)
    return c


def dim(sheet, a, b, text, off=(0, 0), size=3.2):
    """A dimension line between two sheet points with ticks and its figure."""
    (ax, ay), (bx, by) = a, b
    sheet['dims'].append(Line((ax, ay), (bx, by)))
    horizontal = abs(by - ay) < abs(bx - ax)
    t = (0, 1.6) if horizontal else (1.6, 0)
    for x, y in (a, b):
        sheet['dims'].append(Line((x - t[0], y - t[1]), (x + t[0], y + t[1])))
    label = Text(text, size, font='DejaVu Sans')
    mx, my = (ax + bx) / 2 + off[0], (ay + by) / 2 + off[1]
    sheet['text'].append(Pos(mx, my + 2.6) * label if horizontal else Pos(mx - 2.6, my) * Rot(0, 0, 90) * label)


def note(sheet, x, y, text, size=3.2, align=Align.MIN):
    sheet['text'].append(Pos(x, y) * Text(text, size, font='DejaVu Sans', align=(align, Align.CENTER)))


def drawing(toilet_asm, basin_asm):
    sheet = {'visible': [], 'hidden': [], 'dims': [], 'text': []}
    k = .1
    P, tk, tl = T['projection'], T['tank'], T['tankLid']
    capTop = (tk['base'] + tk['height'] + tl['thickness'])
    # Toilet: front (looking at the wall), side, plan.  Sheet origin bottom-left, A3 landscape 420 x 297.
    tb = toilet_asm.bounding_box(); tc = tb.center()
    fx, fy = 62, 190
    view(toilet_asm, (0, 1, 0), (0, 0, 1), (fx, fy), sheet)
    floorF = fy - tc.Z * k * 0 - (tc.Z - 0) * k
    wide = (tb.max.X - tb.min.X) * k
    dim(sheet, (fx - tk['width'] * k / 2, floorF + capTop * k + 22), (fx + tk['width'] * k / 2, floorF + capTop * k + 22), f"{tk['width']}")
    dim(sheet, (fx - T['bowlWidth'] * k / 2, floorF - 7), (fx + T['bowlWidth'] * k / 2, floorF - 7), f"{T['bowlWidth']}", off=(0, -6.5))
    dim(sheet, (fx - wide / 2 - 9, floorF), (fx - wide / 2 - 9, floorF + capTop * k), f'{capTop}')
    note(sheet, fx, floorF - 22, 'TOILET · FRONT', 3.6, Align.CENTER)
    sx, sy = 160, 190
    view(toilet_asm, (1, 0, 0), (0, 0, 1), (sx, sy), sheet)
    left = sx - (tb.max.Y - tb.min.Y) * k / 2 - (tb.min.Y) * k * 0
    wallS = sx - (tc.Y - 0) * k
    dim(sheet, (wallS, floorF - 7), (wallS + P * k, floorF - 7), f'{P}', off=(0, -6.5))
    dim(sheet, (wallS + P * k + 8, floorF), (wallS + P * k + 8, floorF + T['seatHeight'] * k), f"{T['seatHeight']}")
    dim(sheet, (wallS - 8, floorF), (wallS - 8, floorF + T['spoutHeight'] * k), f"{T['spoutHeight']}")
    sheet['dims'].append(Line((wallS, floorF - 3), (wallS, floorF + 108)))
    note(sheet, wallS + P * k / 2, floorF - 22, 'TOILET · SIDE', 3.6, Align.CENTER)
    px, py = 62, 62
    view(toilet_asm, (0, 0, 1), (0, -1, 0), (px, py), sheet)
    note(sheet, px, py - 50, 'TOILET · PLAN (wall at top)', 3.6, Align.CENTER)
    # Washbasin.
    bb = basin_asm.bounding_box(); bc = bb.center()
    W, D, H = B['width'], B['projection'], B['rimHeight']
    bfx = 262
    view(basin_asm, (0, 1, 0), (0, 0, 1), (bfx, floorF + bc.Z * k), sheet)
    dim(sheet, (bfx - W * k / 2, floorF - 7), (bfx + W * k / 2, floorF - 7), f'{W}', off=(0, -6.5))
    dim(sheet, (bfx - W * k / 2 - 8, floorF), (bfx - W * k / 2 - 8, floorF + H * k), f'{H}')
    note(sheet, bfx, floorF - 22, 'WASHBASIN · FRONT', 3.6, Align.CENTER)
    bsx = 350
    view(basin_asm, (1, 0, 0), (0, 0, 1), (bsx, floorF + bc.Z * k), sheet)
    wallB = bsx - bc.Y * k
    dim(sheet, (wallB, floorF - 7), (wallB + D * k, floorF - 7), f'{D}', off=(0, -6.5))
    oz = B['tap']['outletHeight']
    dim(sheet, (wallB + D * k + 8, floorF), (wallB + D * k + 8, floorF + oz * k), f'{oz} outlet')
    sheet['dims'].append(Line((wallB, floorF - 3), (wallB, floorF + 108)))
    note(sheet, wallB + D * k / 2, floorF - 22, 'WASHBASIN · SIDE', 3.6, Align.CENTER)
    view(basin_asm, (0, 0, 1), (0, -1, 0), (bfx, 62), sheet)
    note(sheet, bfx, 62 - 50, 'WASHBASIN · PLAN (wall at top)', 3.6, Align.CENTER)
    # Border and title block.
    for a, b in (((8, 8), (412, 8)), ((412, 8), (412, 289)), ((412, 289), (8, 289)), ((8, 289), (8, 8)), ((300, 8), (300, 40)), ((300, 40), (412, 40))):
        sheet['dims'].append(Line(a, b))
    note(sheet, 304, 33, f"{S['drawing']}  SANITARY WARE", 4.2)
    note(sheet, 304, 25, 'Sakura Shōten · customer restroom', 3.2)
    note(sheet, 304, 18, 'Scale 1:10 · millimetres', 3.2)
    note(sheet, 304, 12, 'Johansson Town · original design', 3.2)
    note(sheet, 322, 62, 'Close-coupled toilet, hand-wash cistern lid,', 2.9)
    note(sheet, 322, 57, 'side lever; pedestal basin, one cold pillar tap.', 2.9)
    svg = ExportSVG(unit=Unit.MM, line_weight=.35)
    svg.add_layer('visible', line_weight=.4)
    svg.add_layer('hidden', line_color=(.59, .59, .59), line_type=LineType.ISO_DOT, line_weight=.18)
    svg.add_layer('dims', line_color=(.16, .39, .38), line_weight=.2)
    svg.add_layer('text', fill_color=(.15, .23, .24), line_weight=0)
    dxf = ExportDXF(unit=Unit.MM)
    for layer in ('visible', 'hidden', 'dims', 'text'):
        if layer != 'visible':
            dxf.add_layer(layer)
        svg.add_shape(sheet[layer], layer=layer)
        dxf.add_shape(sheet[layer], **({} if layer == 'visible' else {'layer': layer}))
    svg.write(str(OUT / f"{S['drawing']}-sanitary-ware.svg"))
    dxf.write(str(OUT / f"{S['drawing']}-sanitary-ware.dxf"))


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    tp, tpiv = toilet()
    bp, bpiv = washbasin()
    # The water and the sump fill the well's own volume; the lever's spindle passes through its boss.
    t_asm, t_rec = export('toilet', tp, tpiv, allow=[('Water', 'Sump'), ('LeverBoss', 'FlushLever')])
    b_asm, b_rec = export('washbasin', bp, bpiv, allow=[('Tap', 'TapHandle'), ('TapHandle', 'TapIndex')])
    drawing(t_asm, b_asm)
    (OUT / 'parts.json').write_text(json.dumps({'source': 'tools/cad/build-sakura-restroom-cad.py', 'units': 'millimetres',
                                                'frame': S['frame'], 'interference': 'none over 1 mm³',
                                                'toilet': t_rec, 'washbasin': b_rec}, indent=1) + '\n')
    print('toilet parts', len(t_rec), 'washbasin parts', len(b_rec))
