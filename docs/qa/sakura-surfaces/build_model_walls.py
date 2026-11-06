"""SK-ST-004 rev B: two selected office prints and three stockroom prints.

Run from anywhere. The JSON records source measurements, not a redesigned room.
Writes a self-contained SVG and numeric separation checks beside this script.
Runtime geometry/support, sight lines and navigation are checked by the JS tests.
"""
import html
import json
from pathlib import Path

here = Path(__file__).resolve().parent
data = json.loads((here / 'sakura-model-walls.json').read_text())
w, h = data['paper']['width'], data['paper']['height']
checks, svg = [], ['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="940" viewBox="0 0 1000 940">',
    '<rect width="1000" height="940" fill="#faf7ec"/><g font-family="sans-serif" fill="#292c28">',
    f'<text x="35" y="35" font-size="20">SK-ST-004 rev {data["revision"]} · Sakura supplier wall prints · {data["date"]}</text>',
    '<text x="35" y="58" font-size="13">Measured elevations in metres · B2 515 × 728 mm · 1 mm paper offset; doors and furniture retained</text>']

for row, wall in enumerate(data['walls']):
    x0, x1 = wall['along']
    sc, ox, oy = 115, 80, 125 + row * 270
    svg.append(f'<text x="35" y="{oy - 25}" font-size="16">{wall["id"]} · {wall["face"]} · plane {wall["plane"]:.2f}</text>')
    # Uniform horizontal/vertical metre scale. Baseline at the bottom of the elevation.
    base = oy + 210
    scale = min(sc, 210 / wall['height'])
    def rect(box, fill, label):
        a, b, c, d = box
        svg.append(f'<rect x="{ox + (a-x0)*scale:.2f}" y="{base-d*scale:.2f}" width="{(c-a)*scale:.2f}" height="{(d-b)*scale:.2f}" fill="{fill}" stroke="#666"/>')
        svg.append(f'<text x="{ox+(a-x0)*scale+3:.2f}" y="{base-d*scale+12:.2f}" font-size="9">{html.escape(label)}</text>')
    rect([x0, 0, x1, wall['height']], '#fffdf7', '')
    for feature in wall['features']:
        a, b, c, d = feature['rect']
        # Show only the portion inside this wall elevation.
        if c > x0 and a < x1:
            rect([max(x0,a), b, min(x1,c), d], '#d7ddd4', feature['id'])
    for poster in wall['posters']:
        x, y, z = poster['at']
        box = [x-w/2, y-h/2, x+w/2, y+h/2]
        rect(box, '#edb9b0', poster['id'])
        inside = box[0] >= x0 and box[2] <= x1 and box[1] >= 0 and box[3] <= wall['height'] and z == wall['plane']
        checks.append({'check': f'{wall["id"]}/{poster["id"]}: supported inside wall', 'ok': inside})
        for feature in wall['features']:
            a, b, c, d = feature['rect']
            # Separation along either elevation axis; rectangles may be adjacent vertically or horizontally.
            gap = max(a-box[2], box[0]-c, b-box[3], box[1]-d)
            checks.append({'check': f'{poster["id"]} clear of {feature["id"]}', 'ok': gap >= .08, 'gap_mm': round(gap*1000, 2)})
    svg.append(f'<text x="{ox}" y="{base+20}" font-size="12">along x {x0:.2f}…{x1:.2f} · ceiling {wall["height"]:.2f} m · anchors in JSON</text>')
svg.append('</g></svg>')
(here / f'Sakura-Model-Walls-Rev-{data["revision"]}.svg').write_text('\n'.join(svg)+'\n')
(here / 'checks-model-walls.json').write_text(json.dumps(checks, indent=2)+'\n')
print(f'{sum(c["ok"] for c in checks)}/{len(checks)} measured checks pass')
if not all(c['ok'] for c in checks):
    raise SystemExit('FAILED: '+str([c for c in checks if not c['ok']]))
