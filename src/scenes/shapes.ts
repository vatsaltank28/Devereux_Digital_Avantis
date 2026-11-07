/**
 * Procedural morph targets for the single bead system.
 * Every function returns a Float32Array(count * 3). All are ORIGINAL procedural
 * approximations — the source models are original approximations.
 *
 * Target order (see ../animations/scrollTimeline.ts):
 *   0 X · 1 violet ribbons · 2 hand · 3 rippling curtain · 4 tree
 */
import * as THREE from 'three';

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: Rng): number {
  const u = Math.max(rng(), 1e-6);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

/* ------------------------------------------------------------------ X */
export function generateX(count: number, rng: Rng): Float32Array {
  const out = new Float32Array(count * 3);
  // centre-line half extents measured from the reference still (x 475 : y 555)
  const hx = 1.64;
  const hy = 2.08;
  const dirA = new THREE.Vector2(hx, -hy).normalize(); // top-left -> bottom-right
  const dirB = new THREE.Vector2(hx, hy).normalize(); // bottom-left -> top-right
  const lenHalf = Math.hypot(hx, hy);
  for (let i = 0; i < count; i++) {
    const useA = rng() < 0.5;
    const d = useA ? dirA : dirB;
    const nx = -d.y;
    const ny = d.x;
    const u = (rng() * 2 - 1) * 1.04; // slightly past the end for rounded caps
    const taper = useA ? 0.5 - u * 0.07 : 0.46 + u * 0.08;
    const cap = Math.abs(u) > 1 ? 1 - (Math.abs(u) - 1) / 0.04 : 1;
    // gaussian cross-section: dense core, soft organic edge (reference X has no hard outline)
    const v = Math.max(-1.7, Math.min(1.7, gauss(rng) * 0.62)) * taper * Math.max(0.25, cap);
    let x = d.x * u * lenHalf + nx * v;
    let y = d.y * u * lenHalf + ny * v;
    let z = gauss(rng) * 0.34;
    if (rng() < 0.07) {
      // loose beads scattered around the silhouette
      const r = -Math.log(Math.max(rng(), 1e-4)) * 0.45;
      const a = rng() * Math.PI * 2;
      x += Math.cos(a) * r;
      y += Math.sin(a) * r;
      z += gauss(rng) * 0.5;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

/* ------------------------------------------------------------- Ribbons */
export function generateRibbons(count: number, rng: Rng): Float32Array {
  const out = new Float32Array(count * 3);
  const RIBBONS = 5;
  const params = Array.from({ length: RIBBONS }, (_, i) => ({
    phase: (i / RIBBONS) * Math.PI * 2 + rng() * 0.6,
    radius: 1.8 + rng() * 1.6,
    turns: 1.15 + rng() * 0.7,
    yOff: (rng() - 0.5) * 2.2,
    width: 0.55 + rng() * 0.5,
    twist: 0.9 + rng() * 1.2,
    zOff: (rng() - 0.5) * 2,
  }));

  const centre = (p: (typeof params)[number], t: number, target: THREE.Vector3) => {
    const a = t * Math.PI * 2 * p.turns + p.phase;
    target.set(
      (t - 0.5) * 17 + Math.sin(a * 0.7 + p.phase) * 0.9,
      Math.sin(a) * p.radius * 0.62 + p.yOff,
      Math.cos(a * 0.85 + p.phase) * p.radius * 0.8 + p.zOff,
    );
    return target;
  };

  const c0 = new THREE.Vector3();
  const c1 = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const p = params[i % RIBBONS];
    const t = 0.02 + rng() * 0.96;
    centre(p, t, c0);
    centre(p, t + 0.004, c1);
    tangent.copy(c1).sub(c0).normalize();
    side.crossVectors(tangent, up).normalize();
    side.applyAxisAngle(tangent, t * Math.PI * 2 * p.twist + p.phase);
    const taper = Math.pow(Math.sin(Math.PI * t), 0.55);
    const v = (rng() * 2 - 1) * p.width * taper;
    const thick = gauss(rng) * 0.035;
    out[i * 3] = c0.x + side.x * v + thick;
    out[i * 3 + 1] = c0.y + side.y * v + thick;
    out[i * 3 + 2] = c0.z + side.z * v + thick;
  }
  return out;
}

/* ---------------------------------------------------------------- Hand */
function drawHand(ctx: CanvasRenderingContext2D, S: number) {
  ctx.clearRect(0, 0, S, S);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.save();
  ctx.translate(S / 2, S / 2);
  ctx.rotate((-9 * Math.PI) / 180);
  ctx.translate(-S / 2, -S / 2);

  // palm
  const px = S * 0.36;
  const py = S * 0.56;
  const pw = S * 0.3;
  const ph = S * 0.25;
  const r = S * 0.06;
  ctx.beginPath();
  ctx.moveTo(px + r, py);
  ctx.arcTo(px + pw, py, px + pw, py + ph, r);
  ctx.arcTo(px + pw, py + ph, px, py + ph, r * 1.4);
  ctx.arcTo(px, py + ph, px, py, r * 1.4);
  ctx.arcTo(px, py, px + pw, py, r);
  ctx.closePath();
  ctx.fill();

  // wrist
  ctx.fillRect(S * 0.41, py + ph - 8, S * 0.18, S * 0.2);

  // fingers [baseX, widthPx, length, angle(deg)] — long and slim, slightly fanned
  const base = py + 8;
  const fingers: Array<[number, number, number, number]> = [
    [S * 0.395, S * 0.052, S * 0.4, -9],
    [S * 0.455, S * 0.056, S * 0.45, -3],
    [S * 0.52, S * 0.052, S * 0.41, 3],
    [S * 0.58, S * 0.044, S * 0.32, 10],
  ];
  for (const [bx, w, len, deg] of fingers) {
    const a = (deg * Math.PI) / 180;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(bx, base);
    ctx.lineTo(bx + Math.sin(a) * len, base - Math.cos(a) * len);
    ctx.stroke();
  }
  // thumb
  ctx.lineWidth = S * 0.062;
  ctx.beginPath();
  ctx.moveTo(S * 0.38, py + ph * 0.75);
  ctx.lineTo(S * 0.24, py + ph * 0.3);
  ctx.lineTo(S * 0.17, py - S * 0.04);
  ctx.stroke();
  ctx.restore();
}

export function generateHand(count: number, rng: Rng): Float32Array {
  const out = new Float32Array(count * 3);
  const S = 384;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  drawHand(ctx, S);
  const data = ctx.getImageData(0, 0, S, S).data;
  const pts: number[] = [];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (data[(y * S + x) * 4 + 3] > 128) pts.push(x, y);
    }
  }
  const total = pts.length / 2;
  const scale = 7.4;
  for (let i = 0; i < count; i++) {
    const k = Math.floor(rng() * total) * 2;
    const px = pts[k] + rng() - 0.5;
    const py = pts[k + 1] + rng() - 0.5;
    const nx = px / S - 0.5;
    const ny = 0.5 - py / S;
    // gentle volume: thicker over the palm, thin at the fingertips
    const palm = Math.max(0, 1 - Math.hypot(nx - 0.0, ny + 0.03) * 3.2);
    out[i * 3] = nx * scale;
    out[i * 3 + 1] = ny * scale + 0.15;
    out[i * 3 + 2] = gauss(rng) * (0.1 + palm * 0.22);
  }
  return out;
}

/* ------------------------------------------------------------- Curtain */
export function generateCurtain(count: number, rng: Rng): Float32Array {
  const out = new Float32Array(count * 3);
  const STRANDS = 54;
  const W = 17;
  const H = 11;
  for (let i = 0; i < count; i++) {
    const s = Math.floor(rng() * STRANDS) / (STRANDS - 1);
    const x = (s - 0.5) * W + gauss(rng) * 0.018;
    const y = (rng() - 0.5) * H;
    // each strand sways on its own phase so the sheet reads as a folded, rippling curtain
    const z = Math.sin(x * 0.55 + 0.6) * 1.5 + Math.sin(y * 0.7 + s * 24) * 0.28 + gauss(rng) * 0.03;
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

/* ---------------------------------------------------------------- Tree */
interface Segment {
  a: THREE.Vector3;
  b: THREE.Vector3;
  r: number;
  depth: number;
}

export function generateTree(count: number, rng: Rng): Float32Array {
  const out = new Float32Array(count * 3);
  const segments: Segment[] = [];
  const tips: THREE.Vector3[] = [];
  const MAX_DEPTH = 7;

  const grow = (start: THREE.Vector3, dir: THREE.Vector3, length: number, radius: number, depth: number) => {
    const end = start.clone().addScaledVector(dir, length);
    // clone: parent/child segments share endpoints, and normalisation below mutates in place
    segments.push({ a: start.clone(), b: end.clone(), r: radius, depth });
    if (depth >= MAX_DEPTH) {
      tips.push(end.clone());
      return;
    }
    const kids = depth < 2 ? 3 : rng() < 0.55 ? 2 : 3;
    const yaw0 = rng() * Math.PI * 2;
    for (let k = 0; k < kids; k++) {
      const yaw = yaw0 + (k / kids) * Math.PI * 2 + (rng() - 0.5) * 0.7;
      const pitch = 0.5 + rng() * 0.55;
      const axisA = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0.3, 1, 0.2)).normalize();
      const nd = dir.clone().applyAxisAngle(axisA, pitch).applyAxisAngle(dir, yaw).normalize();
      nd.y += 0.1; // phototropism
      nd.normalize();
      grow(end, nd, length * (0.7 + rng() * 0.08), radius * 0.66, depth + 1);
    }
  };
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 2.3, 0.26, 0);

  // normalise to 9.4 units tall, base at y = -4.7
  const box = new THREE.Box3();
  for (const s of segments) {
    box.expandByPoint(s.a);
    box.expandByPoint(s.b);
  }
  for (const t of tips) box.expandByPoint(t.clone().addScalar(0.4));
  const k = 9.4 / (box.max.y - box.min.y);
  const cx = (box.max.x + box.min.x) / 2;
  const cz = (box.max.z + box.min.z) / 2;
  const map = (v: THREE.Vector3) => v.set((v.x - cx) * k, (v.y - box.min.y) * k - 4.7, (v.z - cz) * k);
  for (const s of segments) {
    map(s.a);
    map(s.b);
    s.r *= k;
  }
  for (const t of tips) map(t);

  const weights = segments.map((s) => s.a.distanceTo(s.b) * (0.3 + s.r * 3));
  const cum: number[] = [];
  weights.reduce((acc, w, i) => (cum[i] = acc + w), 0);
  const sum = cum[cum.length - 1];
  const pickSegment = () => {
    const r = rng() * sum;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    return segments[lo];
  };

  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const roll = rng();
    if (roll < 0.66) {
      const s = pickSegment();
      const t = rng();
      p.lerpVectors(s.a, s.b, t);
      const rr = s.r * (0.6 + rng() * 0.6);
      const ang = rng() * Math.PI * 2;
      out[i * 3] = p.x + Math.cos(ang) * rr;
      out[i * 3 + 1] = p.y;
      out[i * 3 + 2] = p.z + Math.sin(ang) * rr;
    } else if (roll < 0.94) {
      const tip = tips[Math.floor(rng() * tips.length)];
      const sig = 0.26;
      out[i * 3] = tip.x + gauss(rng) * sig;
      out[i * 3 + 1] = tip.y + gauss(rng) * sig * 0.8;
      out[i * 3 + 2] = tip.z + gauss(rng) * sig;
    } else {
      // exposed root flare / ground mist hugging beads
      const ang = rng() * Math.PI * 2;
      const rr = Math.abs(gauss(rng)) * 1.3;
      out[i * 3] = Math.cos(ang) * rr;
      out[i * 3 + 1] = -4.7 + Math.abs(gauss(rng)) * 0.18;
      out[i * 3 + 2] = Math.sin(ang) * rr;
    }
  }
  return out;
}
