/**
 * Camera flight + scroll → morph-stage mapping.
 * All keyframes are [I] reconstruction choices (the original path is not accessible).
 */
import * as THREE from 'three';

interface Key {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
  roll: number;
  morph: number;
}

/** progress (0..1 across the journey) → camera + stage. */
export const KEYS: Key[] = [
  { p: 0.0, pos: [0, 0, 16], look: [0, 0, 0], roll: 0, morph: 0 }, // X (hero)
  { p: 0.12, pos: [0.5, 0.1, 15.2], look: [0, 0, 0], roll: 0.0, morph: 0 }, // X hold
  { p: 0.3, pos: [3.6, 1.3, 18.5], look: [0, 0, 0], roll: 0.05, morph: 1 }, // ribbons burst
  { p: 0.42, pos: [-3.4, 1.7, 16.5], look: [0.4, 0, 0], roll: -0.07, morph: 1 }, // ribbons hold
  { p: 0.56, pos: [0, 0.4, 15.4], look: [0, 0.2, 0], roll: 0, morph: 2 }, // hand
  { p: 0.64, pos: [0, 0.3, 14.2], look: [0, 0.2, 0], roll: 0, morph: 2 }, // hand hold
  { p: 0.78, pos: [3.4, 0.4, 21], look: [0, 0, 0], roll: 0.05, morph: 3 }, // curtain
  { p: 0.84, pos: [-3, 0, 20], look: [0, 0, 0], roll: -0.04, morph: 3 }, // curtain hold
  { p: 0.96, pos: [0, -1.2, 19.5], look: [0, 0.3, 0], roll: 0, morph: 4 }, // tree
  { p: 1.0, pos: [0, -0.7, 18.2], look: [0, 0.2, 0], roll: 0, morph: 4 }, // tree hold
];

const posCurve = new THREE.CatmullRomCurve3(
  KEYS.map((k) => new THREE.Vector3(...k.pos)),
  false,
  'centripetal',
);
const lookCurve = new THREE.CatmullRomCurve3(
  KEYS.map((k) => new THREE.Vector3(...k.look)),
  false,
  'centripetal',
);

const smooth = (t: number) => t * t * (3 - 2 * t);

function locate(p: number): { i: number; t: number } {
  const c = Math.min(Math.max(p, 0), 1);
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (c <= KEYS[i + 1].p) {
      const span = KEYS[i + 1].p - KEYS[i].p || 1;
      return { i, t: (c - KEYS[i].p) / span };
    }
  }
  return { i: KEYS.length - 2, t: 1 };
}

/** Continuous morph stage 0..4 for a journey progress value. */
export function morphAt(p: number): number {
  const { i, t } = locate(p);
  return KEYS[i].morph + (KEYS[i + 1].morph - KEYS[i].morph) * smooth(t);
}

const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

/** Sample the camera. `distScale` widens framing for narrow/portrait viewports. */
export function sampleCamera(
  p: number,
  distScale: number,
  flight: boolean,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
): number {
  const { i, t } = locate(p);
  const u = (i + smooth(t)) / (KEYS.length - 1);
  posCurve.getPoint(u, tmpPos);
  lookCurve.getPoint(u, tmpLook);
  if (!flight) {
    // reduced motion: keep the hero framing, only scale distance with the stage
    tmpPos.set(0, 0, tmpPos.z);
    tmpLook.set(0, 0, 0);
  }
  outLook.copy(tmpLook);
  outPos.copy(tmpLook).add(tmpPos.sub(tmpLook).multiplyScalar(distScale));
  const roll = KEYS[i].roll + (KEYS[i + 1].roll - KEYS[i].roll) * smooth(t);
  return flight ? roll : 0;
}

/** Transition burst strength for the shader: 1 in the middle of a morph. */
export function chapterOf(p: number): number {
  const m = morphAt(p);
  return Math.min(4, Math.round(m));
}
