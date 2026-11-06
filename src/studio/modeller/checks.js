/**
 * The checks an asset must pass before it can go to World, the ones that need the built model (the card's own checks,
 * purpose, brand names and the id, are Python's: townstudio/assets.py). Each check is {id, ok, detail}, in the words
 * the Models page shows. The rules (tolerances, the kinds' limits, the resident) are modeller/rules.json.
 *
 * Asset frame: metres, y up, floor at y = 0, front +z. Colliders are World's: {x, z, w, d, yaw, minY, height}, a box
 * standing on its footprint (src/build/placements.js, physics.js).
 */
const cm = v => Math.abs(v) < .01 ? `${Math.round(v * 1000)} mm` : `${Math.round(v * 100)} cm`;
const m2 = v => (Math.round(v * 100) / 100).toFixed(2);

/** The bounding box of pieces (all of them, or only the solid body: not loose parts such as a cord on the floor). */
export function boxOf(THREE, pieces, {body = false} = {}) {
  const b = new THREE.Box3();
  for (const p of pieces) if (!(body && p.loose)) b.union(p.box);
  return b;
}

/** The colliders World gets: the card's boxes, or one box round the solid body ("auto"). */
export function resolveColliders(THREE, card, pieces) {
  if (Array.isArray(card.colliders)) return card.colliders.map((c, i) => ({name: c.name || `box ${i + 1}`, x: c.x, z: c.z, w: c.w, d: c.d, yaw: c.yaw || 0, minY: c.minY || 0, height: c.height}));
  const b = boxOf(THREE, pieces, {body: true}), r = v => +v.toFixed(3);
  return [{name: 'body', x: r((b.min.x + b.max.x) / 2), z: r((b.min.z + b.max.z) / 2), w: r(b.max.x - b.min.x), d: r(b.max.z - b.min.z), yaw: 0,
    minY: r(Math.max(0, b.min.y)), height: r(b.max.y - Math.max(0, b.min.y)), auto: true}];
}

/** A point in a collider's own frame (u across, v along, y up). */
function local(c, x, z) {
  const dx = x - c.x, dz = z - c.z, co = Math.cos(c.yaw || 0), si = Math.sin(c.yaw || 0);
  return [dx * co - dz * si, dx * si + dz * co];
}
export function insideCollider(c, x, y, z, tol = 0) {
  const [u, v] = local(c, x, z);
  return Math.abs(u) <= c.w / 2 + tol && Math.abs(v) <= c.d / 2 + tol && y >= (c.minY || 0) - tol && y <= (c.minY || 0) + c.height + tol;
}
/** How far a point on the floor is from a collider's footprint (0 inside it). */
export function distanceToCollider(c, x, z) {
  const [u, v] = local(c, x, z);
  return Math.hypot(Math.max(0, Math.abs(u) - c.w / 2), Math.max(0, Math.abs(v) - c.d / 2));
}

/** Does a triangle (three Vector3) touch an axis-aligned box (centre, half sizes)? Akenine-Möller's separating axes. */
export function triangleTouchesBox(a, b, c, centre, half) {
  const v0 = [a.x - centre[0], a.y - centre[1], a.z - centre[2]], v1 = [b.x - centre[0], b.y - centre[1], b.z - centre[2]], v2 = [c.x - centre[0], c.y - centre[1], c.z - centre[2]];
  for (let i = 0; i < 3; i++) if (Math.min(v0[i], v1[i], v2[i]) > half[i] || Math.max(v0[i], v1[i], v2[i]) < -half[i]) return false;
  const e = [[v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]], [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]], [v0[0] - v2[0], v0[1] - v2[1], v0[2] - v2[2]]];
  const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const n = cross(e[0], e[1]);
  const r = half[0] * Math.abs(n[0]) + half[1] * Math.abs(n[1]) + half[2] * Math.abs(n[2]);
  if (Math.abs(dot(n, v0)) > r) return false;
  const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (const u of axes) for (const ed of e) {
    const ax = cross(u, ed);
    if (Math.abs(ax[0]) + Math.abs(ax[1]) + Math.abs(ax[2]) < 1e-12) continue;
    const p0 = dot(v0, ax), p1 = dot(v1, ax), p2 = dot(v2, ax);
    const rr = half[0] * Math.abs(ax[0]) + half[1] * Math.abs(ax[1]) + half[2] * Math.abs(ax[2]);
    if (Math.min(p0, p1, p2) > rr || Math.max(p0, p1, p2) < -rr) return false;
  }
  return true;
}

/** Pieces that neither stand on the floor nor touch a piece that does (each piece's box, a few millimetres apart). */
export function floatingPieces(pieces, tol) {
  const supported = pieces.map(p => p.box.min.y <= tol.floor);
  const near = (a, b) => a.min.x <= b.max.x + tol.touch && b.min.x <= a.max.x + tol.touch && a.min.y <= b.max.y + tol.touch &&
    b.min.y <= a.max.y + tol.touch && a.min.z <= b.max.z + tol.touch && b.min.z <= a.max.z + tol.touch;
  for (let changed = true; changed;) {
    changed = false;
    pieces.forEach((p, i) => {
      if (supported[i]) return;
      if (pieces.some((q, j) => supported[j] && near(p.box, q.box))) { supported[i] = true; changed = true; }
    });
  }
  return pieces.filter((p, i) => !supported[i]);
}

/** A few points of a piece's surface: its vertices, at most `limit`. */
function* samples(THREE, piece, limit = 240) {
  const pos = piece.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / limit)), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += step) yield v.fromBufferAttribute(pos, i);
}

function residentWords(h) {
  return h < .5 ? 'below the knee of' : h < .9 ? 'up to the hip of' : h < 1.25 ? 'up to the chest of' : h < 1.55 ? 'up to the shoulders of' : h < 1.75 ? 'about as tall as' : 'taller than';
}

/**
 * Runs the checks on a built model.
 * @param THREE  World's three.js
 * @param made   kit.finish() (or the GLB build): {group, pieces, stats}
 * @param card   asset.json as it is in the form
 * @param rules  modeller/rules.json
 */
export function runChecks(THREE, made, card, rules) {
  const T = rules.tolerance, R = rules.resident, out = [], kind = rules.kinds[card.kind] || null;
  const pieces = made.pieces, body = boxOf(THREE, pieces, {body: true}), all = boxOf(THREE, pieces);
  out.push({id: 'build', ok: true, detail: `${pieces.length} pieces in ${made.parts?.length || 1} part(s).`});

  // Every part says what it is for (rules.roles): World and the storyteller read the role, so a part with none, or one
  // World does not know, is refused; and a card you sit in needs a part that is the seat.
  {
    const roles = rules.roles || {}, parts = made.parts || [], problems = [];
    for (const p of parts) {
      if (!p.role) problems.push(`Part "${p.name}" has no role: give it one, e.g. kit.part('${p.name}', …, {role: 'body'}).`);
      else if (!roles[p.role]) problems.push(`Part "${p.name}" has the role "${p.role}", which World does not know (${Object.keys(roles).join(', ')}).`);
    }
    if ((card.seats || []).length && !parts.some(p => p.role === 'seat'))
      problems.push('The card has seats, but no part has the role "seat": say which part people sit on.');
    const counts = {};
    for (const p of parts) if (p.role) counts[p.role] = (counts[p.role] || 0) + 1;
    const later = Object.keys(counts).filter(r => roles[r] && !roles[r].now);
    out.push({id: 'roles', ok: !problems.length, detail: problems.join(' ') ||
      `${parts.length} part(s): ${Object.entries(counts).map(([r, n]) => n > 1 ? `${r} ×${n}` : r).join(', ')}.` +
      (later.length ? ` World does not act on ${later.join(', ')} yet: they are recorded for later and for the storyteller.` : '')});
  }

  // Stands on the floor: the lowest point at y = 0, and nothing in the air.
  {
    const low = all.min.y, floating = floatingPieces(pieces, T);
    const problems = [];
    if (low < -T.floor) problems.push(`It sinks ${cm(-low)} into the floor: its lowest point must be at y = 0.`);
    else if (low > T.floor) problems.push(`It floats ${cm(low)} above the floor: its lowest point must be at y = 0.`);
    if (floating.length) problems.push('Floating, touching nothing: ' + [...new Set(floating.map(p => `${p.name} (y ${m2(p.box.min.y)}–${m2(p.box.max.y)})`))].slice(0, 4).join(', ') + '.');
    out.push({id: 'floor', ok: !problems.length, detail: problems.join(' ') || `Lowest point at y = ${Math.abs(low).toFixed(3)} m; all ${pieces.length} pieces rest on the floor or on each other.`});
  }

  // Real size: the body measures what the card says, within what the kind can be, sane next to a 1.6 m resident.
  {
    const size = [body.max.x - body.min.x, body.max.y - body.min.y, body.max.z - body.min.z], problems = [];
    const said = Array.isArray(card.size) ? card.size : null;
    if (!said) problems.push('The card has no size.');
    else if (size.some((v, i) => Math.abs(v - said[i]) > T.size)) problems.push(`It measures ${size.map(m2).join(' × ')} m (width × height × depth) but the card says ${said.map(m2).join(' × ')} m: change one of them.`);
    if (kind && Math.max(...size) > kind.max) problems.push(`At ${m2(Math.max(...size))} m it is bigger than a ${card.kind} can be (${kind.max} m).`);
    if (Math.min(...size) < .01) problems.push('Thinner than a centimetre in one direction.');
    for (const s of card.seats || []) if (!(s.surfaceY >= .2 && s.surfaceY <= .75)) problems.push(`The seat ${s.id} is ${m2(s.surfaceY)} m high: a 1.6 m resident sits at 0.25–0.75 m.`);
    out.push({id: 'size', ok: !problems.length, detail: problems.join(' ') ||
      `${size.map(m2).join(' × ')} m (w × h × d). Its top is ${residentWords(size[1])} a ${R.height} m resident.`});
  }

  // The phone budget: what the card allows, and never more than the kind can afford.
  {
    const b = card.budget || {}, s = made.stats, problems = [];
    if (kind && (b.triangles > kind.triangles || b.materials > kind.materials)) problems.push(`The card allows more than a phone can afford for a ${card.kind} (${kind.triangles} triangles, ${kind.materials} materials).`);
    if (!(s.triangles <= b.triangles)) problems.push(`${s.triangles} triangles: over the budget of ${b.triangles}. Use fewer segments on small rounded pieces.`);
    if (!(s.materials <= b.materials)) problems.push(`${s.materials} materials: over the budget of ${b.materials}.`);
    out.push({id: 'budget', ok: !problems.length, detail: problems.join(' ') || `${s.triangles} of ${b.triangles} triangles, ${s.materials} of ${b.materials} materials, ${s.meshes} draw calls.`});
  }

  // A collider that fits: it covers every solid piece and does not reach far past the model.
  const colliders = resolveColliders(THREE, card, pieces);
  {
    const problems = [], outside = new Set();
    if (!colliders.length) problems.push('No collider: people and the camera would walk through it.');
    for (const p of pieces) {
      if (p.loose) continue;
      for (const v of samples(THREE, p)) if (!colliders.some(c => insideCollider(c, v.x, v.y, v.z, T.collider))) { outside.add(p.name); break; }
    }
    if (outside.size) problems.push('Not inside any collider: ' + [...outside].slice(0, 5).join(', ') + '.');
    for (const c of colliders) {
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
        const co = Math.cos(c.yaw || 0), si = Math.sin(c.yaw || 0), u = a * c.w / 2, v = b * c.d / 2;
        return [c.x + u * co + v * si, c.z - u * si + v * co];
      });
      const xs = corners.map(p => p[0]), zs = corners.map(p => p[1]);
      const over = [['the right', body.min.x - Math.min(...xs)], ['the left', Math.max(...xs) - body.max.x], ['the back', body.min.z - Math.min(...zs)],
        ['the front', Math.max(...zs) - body.max.z], ['the top', (c.minY || 0) + c.height - body.max.y]].filter(([, d]) => d > T.collider);
      if (over.length) problems.push(`The collider ${c.name} reaches ${over.map(([w, d]) => `${cm(d)} past ${w}`).join(', ')} of the model.`);
    }
    const fx = colliders.length ? [Math.min(...colliders.map(c => c.x - c.w / 2)), Math.max(...colliders.map(c => c.x + c.w / 2))] : [0, 0];
    const fz = colliders.length ? [Math.min(...colliders.map(c => c.z - c.d / 2)), Math.max(...colliders.map(c => c.z + c.d / 2))] : [0, 0];
    out.push({id: 'collider', ok: !problems.length, detail: problems.join(' ') ||
      `${colliders.length} box${colliders.length > 1 ? 'es' : ''}${colliders[0]?.auto ? ' (made from the model)' : ''} cover every solid piece: footprint ${m2(fx[1] - fx[0])} × ${m2(fz[1] - fz[0])} m.`});
  }

  // Seats and standing spots: you stand clear of it, and a seat is really there, at its height, with nothing above it.
  {
    const problems = [], notes = [];
    const solid = [];
    made.group.updateMatrixWorld(true);
    made.group.traverse(o => { if (o.isMesh && !o.parent?.userData?.loose && !o.userData?.loose) solid.push(o); });
    const ray = new THREE.Raycaster();
    const clearOf = (pos, what) => {
      const d = Math.min(...colliders.map(c => distanceToCollider(c, pos[0], pos[2])));
      if (d < R.radius - 1e-6) problems.push(`${what} is ${cm(d)} from the collider; a resident needs ${cm(R.radius)}.`);
      return d;
    };
    for (const s of card.seats || []) {
      const d = clearOf(s.stand, `The stand spot of the seat "${s.id}"`);
      ray.set(new THREE.Vector3(s.position[0], all.max.y + 1, s.position[2]), new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObjects(solid, false)[0];
      if (!hit) problems.push(`Nothing under the seat "${s.id}": the model has no surface there.`);
      else if (Math.abs(hit.point.y - s.surfaceY) > T.seat) problems.push(`At the seat "${s.id}" the top of the model is at ${hit.point.y.toFixed(3)} m, not ${s.surfaceY} m (the card): ${hit.point.y > s.surfaceY ? 'something is above the seat, or it is too high' : 'the seat is lower'}.`);
      if (!colliders.some(c => insideCollider(c, s.position[0], s.surfaceY - .01, s.position[2]))) problems.push(`The seat "${s.id}" is not over the collider.`);
      notes.push(`"${s.id}": surface ${hit ? hit.point.y.toFixed(3) : '?'} m, stand spot ${cm(d)} clear`);
    }
    for (const s of card.spots || []) notes.push(`"${s.id}" ${s.kind} spot ${cm(clearOf(s.position, `The ${s.kind} spot "${s.id}"`))} clear`);
    out.push({id: 'seats', ok: !problems.length, detail: problems.join(' ') || (notes.length ? notes.join('; ') + '.' : 'No seats or standing spots.')});
  }

  // Room for the people who use it: nothing of the model inside the spaces their bodies take (keepClear).
  {
    const boxes = card.keepClear || [], hits = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (const k of boxes) {
      const centre = [0, 1, 2].map(i => (k.min[i] + k.max[i]) / 2), half = [0, 1, 2].map(i => Math.max(0, (k.max[i] - k.min[i]) / 2 - T.clear));
      const kb = new THREE.Box3(new THREE.Vector3(...k.min), new THREE.Vector3(...k.max));
      for (const p of pieces) {
        if (!p.box.intersectsBox(kb)) continue;
        const pos = p.geometry.attributes.position, idx = p.geometry.index;
        const n = idx ? idx.count : pos.count;
        let depth = 0, touched = false;
        for (let i = 0; i < n; i += 3) {
          const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
          a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
          if (triangleTouchesBox(a, b, c, centre, half)) {
            touched = true;
            for (const v of [a, b, c]) {
              const inside = Math.min(v.x - k.min[0], k.max[0] - v.x, v.y - k.min[1], k.max[1] - v.y, v.z - k.min[2], k.max[2] - v.z);
              depth = Math.max(depth, inside);
            }
          }
        }
        if (touched) hits.push({space: k.name || 'a keep-clear space', piece: p.name, depth});
      }
    }
    const worst = [...new Map(hits.sort((x, y) => y.depth - x.depth).map(h => [h.piece + h.space, h])).values()].slice(0, 3);
    out.push({id: 'room', ok: !hits.length, detail: hits.length ?
      worst.map(h => `${h.piece} is in "${h.space}"${h.depth > .001 ? ` by up to ${cm(h.depth)}` : ''}`).join('; ') + '.' :
      boxes.length ? `Nothing of it in the ${boxes.length} spaces the residents' bodies use (keepClear).` : 'No keep-clear spaces on the card.'});
  }
  return {checks: out, colliders, body, all};
}

/** The card as World gets it: real colliders, the anchors, what was measured and the checks it passed. */
export function resolveCard(card, made, result, checks) {
  const r = v => +v.toFixed(4), {body, all} = result;
  return {
    ...card,
    colliders: result.colliders.map(({auto, ...c}) => c),
    anchors: {...(card.anchors || {}), ...(made.anchors || {})},
    parts: made.parts,
    measured: {
      size: [r(body.max.x - body.min.x), r(body.max.y - body.min.y), r(body.max.z - body.min.z)],
      body: {min: body.min.toArray().map(r), max: body.max.toArray().map(r)},
      all: {min: all.min.toArray().map(r), max: all.max.toArray().map(r)},
      triangles: made.stats.triangles, materials: made.stats.materials, meshes: made.stats.meshes,
    },
    checks: checks.map(({id, ok, detail}) => ({id, ok, detail})),
    checked: new Date().toISOString(),
  };
}
