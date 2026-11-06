import * as THREE from '../../vendor/three.module.js';
import {COASTLINE} from './island-coast.js';
import {airportShoreDistance} from './airport-island.js';
import {polygonTest,edgesNear} from './plan-index.js';

// Cel-shaded Gerstner water for the island. Shared by the surrounding sea and
// the harbour basin so the whole shore reads as one body of water.
//
// Looking out from the beach it should read like a holiday postcard: a lace of foam
// where the water meets the sand, clear turquoise shallows with sunlight netting on the
// bottom, then azure, then a deep cobalt that holds right out to a pale haze on the
// horizon, with white glints winking on it. How far a point is from land decides which
// of those it is (shoreDistanceTexture below), so every shore gets its own shallows.

export const SEA_LEVEL = -.56;

const WAVES = [
  {dx: .91, dz: .41, wavelength: 22, amplitude: .11, steepness: .18, speed: .82},
  {dx: -.58, dz: .81, wavelength: 12, amplitude: .055, steepness: .2, speed: 1.05},
  {dx: .2, dz: -.98, wavelength: 6.5, amplitude: .028, steepness: .18, speed: 1.35},
  {dx: -.86, dz: -.5, wavelength: 3.4, amplitude: .012, steepness: .14, speed: 1.7},
];

const VERTEX = /* glsl */ `
#include <common>
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vHeight;
varying float vCrest;
struct Wave { vec2 dir; float wavelength; float amplitude; float steepness; float speed; };
uniform float uTime;
uniform vec2 uWaveDir[4];
uniform float uWaveLen[4];
uniform float uWaveAmp[4];
uniform float uWaveSteep[4];
uniform float uWaveSpeed[4];
void applyWave(vec2 xz, inout vec3 pos, inout vec3 tangent, inout vec3 binormal, Wave w, float t) {
  vec2 d = normalize(w.dir);
  float k = 6.28318530718 / max(w.wavelength, 0.001);
  float f = k * (dot(d, xz) - w.speed * t);
  float s = sin(f);
  float c = cos(f);
  float a = w.amplitude;
  float qak = w.steepness * a * k;
  float wa = k * a;
  pos.x += w.steepness * a * d.x * c;
  pos.y += a * s;
  pos.z += w.steepness * a * d.y * c;
  tangent += vec3(-d.x * d.x * qak * s, d.x * wa * c, -d.x * d.y * qak * s);
  binormal += vec3(-d.x * d.y * qak * s, d.y * wa * c, -d.y * d.y * qak * s);
}
void main() {
  Wave waves[4];
  for (int i = 0; i < 4; i++) {
    waves[i] = Wave(uWaveDir[i], uWaveLen[i], uWaveAmp[i], uWaveSteep[i], uWaveSpeed[i]);
  }
  vec4 world = modelMatrix * vec4(position, 1.0);
  vec3 pos = world.xyz;
  vec2 xz = pos.xz;
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);
  // The grid is coarse (fifteen metres a cell), so far off the swell is folded into
  // long creases the ink pass draws as lines. It calms with distance instead.
  float calm = 1.0 - smoothstep(14.0, 42.0, length(pos.xz - cameraPosition.xz));
  for (int i = 0; i < 4; i++) waves[i].amplitude *= calm;
  applyWave(xz, pos, tangent, binormal, waves[0], uTime);
  applyWave(xz, pos, tangent, binormal, waves[1], uTime);
  applyWave(xz, pos, tangent, binormal, waves[2], uTime);
  applyWave(xz, pos, tangent, binormal, waves[3], uTime);
  vec3 n = normalize(cross(binormal, tangent));
  vWorldPos = pos;
  vWorldNormal = n;
  vHeight = pos.y - world.y;
  vCrest = saturate((1.0 - n.y) * 1.8 + vHeight * 0.35);
  gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
#include <common>
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vHeight;
varying float vCrest;
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uLagoon;
uniform vec3 uShallow;
uniform vec3 uFoam;
uniform vec3 uHorizon;
uniform float uFogNear;
uniform float uFogFar;
uniform sampler2D uShore;
uniform vec4 uShoreRect;
uniform float uShoreRange;
uniform float uGlint;
// A ship's hold, where the sea is outside her plating, not inside it (ferry.js setOceanHole): her centre and heading
// (cos, sin), and the half-breadth and half-length of her parallel body at the waterline. Zero size: no hole.
uniform vec4 uHole;
uniform vec2 uHoleSize;
// Dry pits on land below the sea's level (Johansson's court and lightwell: setOceanPits): the sea is not drawn in them.
uniform vec4 uPits[4];
uniform vec2 uPitSizes[4];
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
}
float quantize(float v, float bands) {
  return floor(v * bands + 1e-4) / bands;
}
// Metres to the nearest land, from the baked field; open water past its edge.
float shoreDistance(vec2 xz) {
  vec2 uv = (xz - uShoreRect.xy) / uShoreRect.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return uShoreRange;
  // Stored as the square root of the share of the range (shoreDistanceTexture): centimetres near the shore, metres out.
  float v = texture2D(uShore, uv).r;
  return v * v * uShoreRange;
}
float quayside(vec2 xz) {
  vec2 uv = (xz - uShoreRect.xy) / uShoreRect.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  return texture2D(uShore, uv).g;
}
// Sunlight focused by the ripples into a moving net on the sandy bottom.
float caustic(vec2 p, float t) {
  vec2 q = mod(p * 6.28318, 6.28318) - 250.0;
  vec2 i = q;
  float c = 1.0;
  for (int n = 0; n < 3; n++) {
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = q + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(q.x / (sin(i.x + tt) / 0.005), q.y / (cos(i.y + tt) / 0.005)));
  }
  c /= 3.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}
void main() {
  if (uHoleSize.x > 0.0) {
    vec2 d = vWorldPos.xz - uHole.xy;
    vec2 l = vec2(uHole.z * d.x - uHole.w * d.y, uHole.w * d.x + uHole.z * d.y);
    if (abs(l.x) < uHoleSize.x && abs(l.y) < uHoleSize.y) discard;
  }
  for (int i = 0; i < 4; i++) {
    if (uPitSizes[i].x <= 0.0) continue;
    vec2 d = vWorldPos.xz - uPits[i].xy;
    vec2 l = vec2(uPits[i].z * d.x - uPits[i].w * d.y, uPits[i].w * d.x + uPits[i].z * d.y);
    if (abs(l.x) < uPitSizes[i].x && abs(l.y) < uPitSizes[i].y) discard;
  }
  vec3 n = normalize(vWorldNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 lightDir = normalize(uSunDir);
  float dist = length(vWorldPos.xz - cameraPosition.xz);
  // Far off the swell is a texture, not a shape: let it flatten out so the distance
  // reads as calm blue rather than shimmering bands.
  n = normalize(mix(n, vec3(0.0, 1.0, 0.0), smoothstep(40.0, 140.0, dist)));

  // Depth by distance from land, the edge of each band roughened a little.
  float shore = shoreDistance(vWorldPos.xz);
  float wobble = (noise2(vWorldPos.xz * 0.07) - 0.5) * 7.0 + (noise2(vWorldPos.xz * 0.23 + 9.0) - 0.5) * 2.0;
  float d = shore + wobble * smoothstep(1.5, 8.0, shore);
  vec3 col = mix(uShallow, uLagoon, smoothstep(0.6, 4.0, d));
  col = mix(col, uMid, smoothstep(5.0, 13.0, d));
  col = mix(col, uDeep, smoothstep(12.0, 32.0, d));

  // Soft toon light: two steps of sun on the swell, never black.
  float ndl = clamp(dot(n, lightDir) * 0.5 + 0.5, 0.0, 1.0);
  col *= mix(1.0, 0.9 + 0.14 * quantize(ndl, 3.0), 1.0 - smoothstep(35.0, 90.0, dist));
  // Troughs a touch deeper, crests a touch lighter. The sea's grid is coarse, so far
  // off its swell aliases into long false bands: there it is left flat.
  float near = 1.0 - smoothstep(35.0, 90.0, dist);
  col = mix(col, uDeep, saturate(-vHeight * 0.9) * 0.35 * near);
  col = mix(col, uLagoon, saturate(vHeight * 1.4) * 0.25 * (1.0 - smoothstep(30.0, 60.0, d)) * near);
  // The sky in the water at a low angle, pale toward the horizon.
  float fresnel = pow(1.0 - saturate(dot(n, viewDir)), 4.0);
  col = mix(col, uHorizon, quantize(fresnel, 3.0) * 0.3);

  // Light on the bottom of the shallows.
  float shallows = 1.0 - smoothstep(3.0, 13.0, d);
  float net = smoothstep(0.18, 0.45, caustic(vWorldPos.xz / 5.0, uTime * 0.45));
  col = mix(col, mix(uFoam, uShallow, 0.25), net * shallows * 0.6 * (1.0 - smoothstep(25.0, 60.0, dist)));

  // Foam: a lace edge that runs up and slips back, and a broken line further out.
  float along = vWorldPos.x * 0.21 + vWorldPos.z * 0.17;
  float surge = 0.5 + 0.5 * sin(uTime * 0.9 + along);
  float lace = noise2(vWorldPos.xz * 1.6 + vec2(uTime * 0.25, 0.0)) * 0.6 + noise2(vWorldPos.xz * 4.0) * 0.4;
  float edge = 0.55 + surge * 0.6;
  // Crisp toon edges, but drawn over a few centimetres (or a pixel, far off) rather than stepped: stepped, the baked
  // field's texels showed as white blocks and stripes along the straight east shore (the owner's phone, 21 October 2026).
  float aa = max(fwidth(shore) * 0.75, 0.06);
  float foam = 1.0 - smoothstep(edge - aa, edge + aa, shore + (lace - 0.5) * 0.9);
  float lineAt = edge + 1.1 + surge * 0.6;
  float line = (1.0 - smoothstep(0.18 - aa, 0.18 + aa, abs(shore - lineAt))) * smoothstep(0.38, 0.52, lace);
  foam = max(foam, line) * (1.0 - step(0.5, quayside(vWorldPos.xz)));
  // Whitecaps on the steepest crests, sparing, and only near enough to resolve.
  float cap = step(0.82, vCrest + lace * 0.25) * (1.0 - smoothstep(30.0, 70.0, dist));
  foam = max(foam, cap * 0.85);

  // Glints: little white dashes across the line of sight, winking in and out.
  vec2 fwd = normalize(vWorldPos.xz - cameraPosition.xz + 1e-4);
  vec2 side = vec2(-fwd.y, fwd.x);
  float cell = 2.2;
  vec2 g = vWorldPos.xz / cell;
  vec2 gi = floor(g);
  float seed = hash12(gi);
  vec2 centre = (gi + 0.2 + 0.6 * vec2(seed, hash12(gi + 4.1))) * cell;
  vec2 rel = vWorldPos.xz - centre;
  float glintShape = length(vec2(dot(rel, side) * 0.55, dot(rel, fwd) * 0.9 / max(0.15, 1.0 - fresnel)));
  float twinkle = step(0.55, sin(uTime * (1.3 + seed * 1.7) + seed * 40.0));
  float glint = step(glintShape, 0.32) * step(seed, 0.16) * twinkle * smoothstep(5.0, 14.0, d) * (1.0 - smoothstep(60.0, 150.0, dist));

  col = mix(col, uFoam, foam);
  col = mix(col, uFoam, glint * uGlint * (1.0 - foam));
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = step(0.5, pow(saturate(dot(n, halfDir)), 120.0));
  col += spec * 0.6 * uGlint * vec3(1.0, 0.98, 0.92) * (1.0 - foam);

  // Holds its colour out to a thin haze where the sea meets the sky. The land has no haze,
  // so the sea must not either until well past Kitano-jima: otherwise the island stood on a
  // pale band of its own. From higher up (the lookouts, the hill) the horizon is further away.
  float reach = 1.0 + max(0.0, cameraPosition.y - 2.0) / 30.0;
  float fog = smoothstep(uFogNear * reach, uFogFar * reach, dist);
  col = mix(col, uHorizon, fog * fog);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * How far each patch of sea is from land, baked once into a small texture: the coast
 * of the island (island-coast.js) and the tropical airport island offshore. Zero on land, rising
 * to `range` metres out, which counts as open water (stored as the square root of the share of the range).
 */
export const SHORE_FIELD=Object.freeze({minX:-150,maxX:430,minZ:-460,maxZ:410,size:448,range:80});

function segmentDistance(px,pz,ax,az,bx,bz){
  const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(px-ax-dx*t,pz-az-dz*t);
}

/** The coast's inside and its edges within the field's range, through their grids (plan-index.js). */
let coastInside=null,coastEdges=null;
/** Metres from (x,z) to the nearest land, capped at SHORE_FIELD.range. */
export function shoreDistance(x,z){
  let best=SHORE_FIELD.range;
  coastInside??=polygonTest(COASTLINE);coastEdges??=edgesNear(COASTLINE,SHORE_FIELD.range);
  if(coastInside(x,z))return 0;
  // Only the edges that can be within the range: any other is farther, and the distance is capped there anyway.
  const e=coastEdges(x,z);for(let i=0;i<e.length;i+=4)best=Math.min(best,segmentDistance(x,z,e[i],e[i+1],e[i+2],e[i+3]));
  // The airport island measures its own (long, curving) shore; past 36 m it is open sea.
  return Math.min(best,airportShoreDistance(x,z));
}
let shoreTexture=null;
/**
 * The port's quay: the coastline's straight south edge from the harbour office's corner (20, -50) to the west seawall
 * (-40, -50). The water there is a dredged basin against a concrete wall, so the shore's lace of foam (meant for a
 * sloping beach) is left out; it drew a straight white stripe through the water under Fujita's boardwalk.
 */
export const QUAYSIDE=Object.freeze({minX:-40,maxX:20,z:-50,reach:6});
export function quaysideAt(x,z){const Q=QUAYSIDE;return z<Q.z&&z>Q.z-Q.reach&&x>Q.minX-.5&&x<Q.maxX+.5;}
export function shoreDistanceTexture(){
  if(shoreTexture)return shoreTexture;
  const F=SHORE_FIELD,n=F.size,data=new Uint8Array(n*n*4);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const x=F.minX+(i+.5)/n*(F.maxX-F.minX),z=F.minZ+(j+.5)/n*(F.maxZ-F.minZ);
    // The square root of the share of the range, so the metre at the shore where the foam is drawn has about 7 cm a step
    // rather than 31 (the shader squares it back).
    const v=Math.round(Math.sqrt(shoreDistance(x,z)/F.range)*255),k=(j*n+i)*4;
    // Green marks water against the port's quay wall (the coast's straight south edge): deep at the wall, no surf.
    data[k]=data[k+2]=v;data[k+1]=quaysideAt(x,z)?255:0;data[k+3]=255;
  }
  shoreTexture=new THREE.DataTexture(data,n,n,THREE.RGBAFormat);
  shoreTexture.magFilter=shoreTexture.minFilter=THREE.LinearFilter;shoreTexture.wrapS=shoreTexture.wrapT=THREE.ClampToEdgeWrapping;
  shoreTexture.needsUpdate=true;
  return shoreTexture;
}

let material = null;

export function oceanMaterial() {
  if (material) return material;
  material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: {value: 0},
      uShore: {value: shoreDistanceTexture()},
      uShoreRect: {value: new THREE.Vector4(SHORE_FIELD.minX, SHORE_FIELD.minZ, SHORE_FIELD.maxX - SHORE_FIELD.minX, SHORE_FIELD.maxZ - SHORE_FIELD.minZ)},
      uShoreRange: {value: SHORE_FIELD.range},
      uGlint: {value: 1},
      uHole: {value: new THREE.Vector4(0, 0, 1, 0)},
      uHoleSize: {value: new THREE.Vector2(0, 0)},
      uPits: {value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 1, 0))},
      uPitSizes: {value: [0, 1, 2, 3].map(() => new THREE.Vector2(0, 0))},
      uSunDir: {value: new THREE.Vector3(.42, .74, .53).normalize()},
      uDeep: {value: new THREE.Color(SEA.day.deep)},
      uMid: {value: new THREE.Color(SEA.day.mid)},
      uLagoon: {value: new THREE.Color(SEA.day.lagoon)},
      uShallow: {value: new THREE.Color(SEA.day.shallow)},
      uFoam: {value: new THREE.Color(SEA.day.foam)},
      uHorizon: {value: new THREE.Color(SEA.day.horizon)},
      // The camera sees 640 m. The water keeps its colour out to Kitano-jima (about 250 m to
      // its near shore from the quay) and closes into the horizon haze over the last stretch.
      uFogNear: {value: 300},
      uFogFar: {value: 620},
      uWaveDir: {value: WAVES.map(w => new THREE.Vector2(w.dx, w.dz))},
      uWaveLen: {value: WAVES.map(w => w.wavelength)},
      uWaveAmp: {value: WAVES.map(w => w.amplitude)},
      uWaveSteep: {value: WAVES.map(w => w.steepness)},
      uWaveSpeed: {value: WAVES.map(w => w.speed)},
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    side: THREE.FrontSide,
  });
  return material;
}

export function createSurroundingOcean() {
  // Out to the distant ridge in the south (horizon.js, from z 500) as well as the open sea
  // north: when it stopped at z 400, the hilltops looked across a gap of bare sky to the ridge.
  const geo = new THREE.PlaneGeometry(1600, 1700, 104, 112);
  geo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(geo, oceanMaterial());
  sea.name = 'Island surrounding sea';
  sea.position.set(0, SEA_LEVEL, -150);
  // Drawn whole from anywhere. The town's section streamer cuts big meshes into 24 m cells
  // and draws only those near the player: the sea used to end in a square round you, with
  // bare sky beyond it from every hill, lookout and boat.
  sea.userData.horizon = true;
  sea.frustumCulled = false;
  sea.receiveShadow = false;
  sea.castShadow = false;
  return sea;
}

export function createHarbourBasin() {
  const geo = new THREE.PlaneGeometry(160, 86, 48, 32);
  geo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(geo, oceanMaterial());
  sea.name = 'Harbour basin';
  sea.position.set(0, -.5, -92.5);
  sea.receiveShadow = false;
  sea.castShadow = false;
  return sea;
}

/**
 * The height of the water surface at a point, for things that float on it or break
 * it: the same four waves the shader lifts the sea with, less their small sideways
 * drift, which at a splash's size does not show.
 */
/** How far above sea level the highest crest reaches. */
export const WAVE_REACH = WAVES.reduce((sum, w) => sum + w.amplitude, 0);

export function waveHeight(x, z, time) {
  let y = SEA_LEVEL;
  for (const w of WAVES) {
    const l = Math.hypot(w.dx, w.dz) || 1, k = Math.PI * 2 / w.wavelength;
    y += w.amplitude * Math.sin(k * ((w.dx * x + w.dz * z) / l - w.speed * time));
  }
  return y;
}

/**
 * Where a ship floats, the sea is not drawn inside her: her engine room is below the waterline, and the water's
 * surface would otherwise cut through it at waist height. `x, z, yaw` her place and heading; `halfX, halfZ` a
 * rectangle inside her waterline about her centre (`offsetZ` along her). Size 0 clears it.
 */
export function setOceanHole(x, z, yaw, halfX = 0, halfZ = 0, offsetZ = 0) {
  const u = oceanMaterial().uniforms, c = Math.cos(yaw), s = Math.sin(yaw);
  // Her centre of the rectangle, moved along her by offsetZ (her +z is world (sin yaw, cos yaw)).
  u.uHole.value.set(x + s * offsetZ, z + c * offsetZ, c, s);
  u.uHoleSize.value.set(halfX, halfZ);
}

/**
 * Dry pits dug into land below the sea's level, where the sea's plane would otherwise show as water inside them: up to
 * four rectangles, each {x, z, yaw, halfX, halfZ} (centre, turn, half-sizes along its own x and z). An empty list clears.
 */
export const OCEAN_PITS = 4;
export function setOceanPits(pits) {
  const u = oceanMaterial().uniforms;
  if (pits.length > OCEAN_PITS) throw new Error(`setOceanPits: ${pits.length} pits, the sea keeps ${OCEAN_PITS}`);
  for (let i = 0; i < OCEAN_PITS; i++) {
    const p = pits[i];
    if (!p) {u.uPitSizes.value[i].set(0, 0);continue;}
    u.uPits.value[i].set(p.x, p.z, Math.cos(p.yaw), Math.sin(p.yaw));
    u.uPitSizes.value[i].set(p.halfX, p.halfZ);
  }
}

export function tickOcean(time) {
  oceanMaterial().uniforms.uTime.value = time;
}

let oceanWet = false, oceanLight = {day: 1, dusk: 0};
const lightListeners = new Set();
/** Things on the horizon that should take the same light as the sea. */
export function onOceanLight(listener) {
  lightListeners.add(listener);listener(oceanLight, oceanWet);
  return () => lightListeners.delete(listener);
}

/**
 * The sea's colours for the hour, from the same clock as the sky and the sun.
 *
 * It used to stay tropical cyan through dusk and all night, the brightest thing on the
 * screen after dark (docs/AMPLIFY-AUDIT.md, A6). Day is reef turquoise over cobalt;
 * dusk warms the shallows toward gold and the horizon toward apricot; night drops to
 * navy with a moonlit horizon. Rain greys it all a little.
 */
const SEA = {
  day:   {deep: '#1876d6', mid: '#15aae4', lagoon: '#2fd0d6', shallow: '#8deedd', horizon: '#cfeaf8', foam: '#ffffff'},
  dusk:  {deep: '#24346a', mid: '#3a6c9a', lagoon: '#6f9fa8', shallow: '#d9c39a', horizon: '#f2b88f', foam: '#ffe9d4'},
  night: {deep: '#030c1c', mid: '#0a2340', lagoon: '#123a52', shallow: '#1d4b63', horizon: '#2c3a52', foam: '#9fb3c8'},
  rain:  {deep: '#1b4f7a', mid: '#2a7393', lagoon: '#4f9ea6', shallow: '#86bdb6', horizon: '#a7bcc6', foam: '#e3eef1'},
};
const tmpA = new THREE.Color(), tmpB = new THREE.Color();
function applySea() {
  const u = oceanMaterial().uniforms, {day, dusk} = oceanLight;
  for (const [key, uniform] of [['deep', u.uDeep], ['mid', u.uMid], ['lagoon', u.uLagoon], ['shallow', u.uShallow], ['horizon', u.uHorizon], ['foam', u.uFoam]]) {
    tmpA.set(SEA.night[key]).lerp(tmpB.set(SEA.day[key]), day);
    if (dusk > 0) tmpA.lerp(tmpB.set(SEA.dusk[key]), dusk * .85);
    if (oceanWet) tmpA.lerp(tmpB.set(SEA.rain[key]), .55 * Math.max(day, .3));
    uniform.value.copy(tmpA);
  }
  // Glints are sunlight: none after dark, few in the rain.
  u.uGlint.value = Math.max(0, day - dusk * .4) * (oceanWet ? .35 : 1);
  for (const listener of lightListeners) listener(oceanLight, oceanWet);
}

export function setOceanWeather(wet) {
  oceanWet = !!wet;applySea();
}

/** @param {{day:number,dusk:number}} light 0..1 daylight and dusk, from duskClock. */
export function setOceanLight({day = 1, dusk = 0} = {}) {
  oceanLight = {day, dusk};applySea();
}

export function isOceanMaterial(mat) {
  return !!mat?.uniforms?.uTime;
}
