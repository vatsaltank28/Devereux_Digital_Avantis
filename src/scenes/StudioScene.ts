/**
 * StudioScene — one WebGL context, one bead system that morphs between five
 * procedural targets (X · ribbons · hand · curtain · tree) along a scroll-driven camera flight.
 * Rendering is driven externally (gsap.ticker) so it stays in sync with Lenis/ScrollTrigger.
 */
import * as THREE from 'three';
import { morphAt, sampleCamera } from '../animations/cameraTimeline';
import { getQuality, type Quality } from './quality';
import { beadFragment, beadVertex, dustFragment, dustVertex, fogFragment, fogVertex } from './shaders';
import { generateCurtain, generateHand, generateRibbons, generateTree, generateX, mulberry32 } from './shapes';

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  reducedMotion: boolean;
  onContextLost?: () => void;
}

const FOV = 32;

export class StudioScene {
  readonly quality: Quality;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);
  private beads: THREE.Points;
  private beadMat: THREE.ShaderMaterial;
  private dust: THREE.Points;
  private dustMat: THREE.ShaderMaterial;
  private fog: THREE.Points;
  private fogMat: THREE.ShaderMaterial;
  private cylinder: THREE.LineSegments;
  private cylMat: THREE.LineBasicMaterial;
  private disposables: Array<{ dispose(): void }> = [];

  private reduced: boolean;
  private width = 1;
  private height = 1;
  private aspect = 1;
  private target = 0;
  private progress = 0;
  private pointerTarget = new THREE.Vector2(0, 0);
  private pointer = new THREE.Vector2(0, 0);
  private pointerOn = 0;
  private lastP = 0;
  private burstEnv = 0;
  private lookAt = new THREE.Vector3();
  private camPos = new THREE.Vector3();
  private time = 0;
  private lost = false;
  /** 0..1 assemble-from-scatter; animated by the hero timeline. */
  intro = { value: 0 };
  /** Global opacity of the whole canvas content. */
  opacity = 1;

  constructor(private opts: SceneOptions) {
    this.reduced = opts.reducedMotion;
    this.quality = getQuality(window.innerWidth, this.reduced);
    const { canvas } = opts;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(this.quality.dpr);

    canvas.addEventListener('webglcontextlost', this.handleLost as EventListener);

    const n = this.quality.count;
    const rng = mulberry32(0xa11ce);
    const targets = [
      generateX(n, rng),
      generateRibbons(n, rng),
      generateHand(n, rng),
      generateCurtain(n, rng),
      generateTree(n, rng),
    ];

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(targets[0], 3));
    geo.setAttribute('aT1', new THREE.BufferAttribute(targets[1], 3));
    geo.setAttribute('aT2', new THREE.BufferAttribute(targets[2], 3));
    geo.setAttribute('aT3', new THREE.BufferAttribute(targets[3], 3));
    geo.setAttribute('aT4', new THREE.BufferAttribute(targets[4], 3));
    const seed = new Float32Array(n * 4);
    const rand = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = rng();
      seed[i * 4] = rng();
      // heavy-tailed bead size: many small, a few large bokeh beads
      seed[i * 4 + 1] = 0.05 + Math.pow(r, 3.2) * 0.13;
      seed[i * 4 + 2] = rng();
      seed[i * 4 + 3] = rng();
      rand[i * 3] = rng();
      rand[i * 3 + 1] = rng();
      rand[i * 3 + 2] = rng();
    }
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 3));
    // the shader displaces points far from `position`; skip CPU frustum culling
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

    // uniforms are shared (same {value} objects) between the bead pass and the glow pass
    const shared = {
      uMorph: { value: 0 },
      uTime: { value: 0 },
      uIntro: { value: 0 },
      uDrift: { value: this.reduced ? 0 : 1 },
      uBurst: { value: 0 },
      uViewH: { value: 900 },
      uSize: { value: 1 },
      uAspect: { value: 1 },
      uPointer: { value: this.pointer },
      uPointerOn: { value: 0 },
      uOpacity: { value: 1 },
    };
    this.beadMat = new THREE.ShaderMaterial({
      vertexShader: beadVertex,
      fragmentShader: beadFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: { ...shared, uGlow: { value: 0 } },
    });
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: beadVertex,
      fragmentShader: beadFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: { ...shared, uGlow: { value: 1 } },
    });
    // hero composition offset measured from the still
    const glow = new THREE.Points(geo, glowMat);
    glow.frustumCulled = false;
    glow.position.set(-0.18, 0.05, 0);
    glow.renderOrder = 0;
    this.beads = new THREE.Points(geo, this.beadMat);
    this.beads.frustumCulled = false;
    this.beads.position.set(-0.18, 0.05, 0);
    this.beads.renderOrder = 1;
    this.scene.add(glow, this.beads);
    this.disposables.push(geo, this.beadMat, glowMat);

    // --- dust (stars)
    const dn = this.quality.dust;
    const dpos = new Float32Array(dn * 3);
    const dseed = new Float32Array(dn * 4);
    for (let i = 0; i < dn; i++) {
      dpos[i * 3] = (rng() - 0.5) * 46;
      dpos[i * 3 + 1] = (rng() - 0.5) * 28;
      dpos[i * 3 + 2] = -14 + rng() * 26;
      dseed[i * 4] = rng();
      dseed[i * 4 + 1] = 0.012 + Math.pow(rng(), 4) * 0.05;
      dseed[i * 4 + 2] = rng();
      dseed[i * 4 + 3] = rng();
    }
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    dgeo.setAttribute('aSeed', new THREE.BufferAttribute(dseed, 4));
    dgeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
    this.dustMat = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uViewH: { value: 900 }, uOpacity: { value: 1 } },
    });
    this.dust = new THREE.Points(dgeo, this.dustMat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
    this.disposables.push(dgeo, this.dustMat);

    // --- fog sprites for the tree finale
    const fn = this.quality.fog;
    const fpos = new Float32Array(fn * 3);
    const fseed = new Float32Array(fn * 4);
    for (let i = 0; i < fn; i++) {
      fpos[i * 3] = (rng() - 0.5) * 22;
      fpos[i * 3 + 1] = -5.4 + rng() * 2.6;
      fpos[i * 3 + 2] = -7 + rng() * 11;
      fseed[i * 4] = rng();
      fseed[i * 4 + 1] = 2.2 + rng() * 3.6;
      fseed[i * 4 + 2] = rng();
      fseed[i * 4 + 3] = rng();
    }
    const fgeo = new THREE.BufferGeometry();
    fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
    fgeo.setAttribute('aSeed', new THREE.BufferAttribute(fseed, 4));
    fgeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
    this.fogMat = new THREE.ShaderMaterial({
      vertexShader: fogVertex,
      fragmentShader: fogFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uViewH: { value: 900 }, uFog: { value: 0 } },
    });
    this.fog = new THREE.Points(fgeo, this.fogMat);
    this.fog.frustumCulled = false;
    this.scene.add(this.fog);
    this.disposables.push(fgeo, this.fogMat);

    // --- faint wireframe cylinder behind the X (visible in the reference hero)
    const cg = new THREE.CylinderGeometry(3.1, 3.1, 6.1, this.quality.cylinderSegments, 7, true);
    const posAttr = cg.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
      posAttr.setX(i, posAttr.getX(i) + (rng() - 0.5) * 0.09);
      posAttr.setY(i, posAttr.getY(i) + (rng() - 0.5) * 0.09);
      posAttr.setZ(i, posAttr.getZ(i) + (rng() - 0.5) * 0.09);
    }
    const wire = new THREE.WireframeGeometry(cg);
    this.cylMat = new THREE.LineBasicMaterial({
      color: 0xb8aedd,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      depthTest: false,
    });
    this.cylinder = new THREE.LineSegments(wire, this.cylMat);
    this.cylinder.position.set(-0.02, 0.45, -1.4);
    this.cylinder.renderOrder = -1;
    this.scene.add(this.cylinder);
    this.disposables.push(cg, wire, this.cylMat);

    this.setProgress(0, true);
  }

  private handleLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
    this.opts.onContextLost?.();
  };

  /** Journey progress 0..1 from ScrollTrigger. */
  setProgress(p: number, immediate = false) {
    this.target = p;
    if (immediate || this.reduced) this.progress = p;
  }

  setPointer(nx: number, ny: number, active: boolean) {
    this.pointerTarget.set(nx, ny);
    this.pointerOn = active && !this.reduced ? 1 : 0;
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    this.aspect = this.width / this.height;
    this.renderer.setPixelRatio(this.quality.dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    const bufH = this.height * this.quality.dpr;
    this.beadMat.uniforms.uViewH.value = bufH;
    this.beadMat.uniforms.uAspect.value = this.aspect;
    this.dustMat.uniforms.uViewH.value = bufH;
    this.fogMat.uniforms.uViewH.value = bufH;
  }

  /** Per-frame update. `dt` seconds. */
  update(dt: number) {
    if (this.lost) return;
    dt = Math.min(dt, 0.05);
    this.time += this.reduced ? 0 : dt;

    // smoothed progress → stable in both directions
    const k = 1 - Math.exp(-dt * 7);
    this.progress += (this.target - this.progress) * k;
    const p = this.progress;

    // velocity-driven burst (bigger when scrolling fast through a transition)
    const vel = Math.abs(p - this.lastP) / Math.max(dt, 1e-3);
    this.lastP = p;
    const burstTarget = this.reduced ? 0 : Math.min(1, 0.55 + vel * 3.5);
    this.burstEnv += (burstTarget - this.burstEnv) * 0.1;

    const morph = morphAt(p);
    const u = this.beadMat.uniforms;
    u.uMorph.value = morph;
    u.uTime.value = this.time;
    u.uIntro.value = this.reduced ? 1 : this.intro.value;
    u.uBurst.value = this.burstEnv;
    u.uOpacity.value = this.opacity;
    // pointer
    this.pointer.lerp(this.pointerTarget, 0.12);
    u.uPointerOn.value += (this.pointerOn - u.uPointerOn.value) * 0.08;
    // size is scaled for portrait so beads stay legible
    u.uSize.value = this.aspect < 0.8 ? 1.0 : 0.9;

    this.dustMat.uniforms.uTime.value = this.time;
    this.dustMat.uniforms.uOpacity.value = this.opacity * (0.9 - Math.min(morph, 4) * 0.12);
    this.fogMat.uniforms.uFog.value = this.opacity * THREE.MathUtils.smoothstep(morph, 2.9, 3.9);
    this.fogMat.uniforms.uTime.value = this.time;

    // cylinder only lives around the hero
    this.cylMat.opacity = 0.11 *(1 - THREE.MathUtils.smoothstep(morph, 0.05, 0.7)) * this.opacity * this.intro.value;
    this.cylinder.rotation.y = this.time * 0.05 + p * 2.2;

    // camera flight
    // portrait/narrow viewports: pull the camera back so the X (≈5.6 units wide) keeps ~70% of the width
    // (tall viewports also need the X ≤ ~40% of the visible height so the hero words don't collide with it)
    const distScale = this.aspect < 1 ? Math.max(0.97 / this.aspect, 1.5) : 1;
    const roll = sampleCamera(p, distScale, !this.reduced, this.camPos, this.lookAt);
    // pointer parallax on the camera
    this.camPos.x += this.pointer.x * 0.35 * (this.reduced ? 0 : 1);
    this.camPos.y += this.pointer.y * 0.22 * (this.reduced ? 0 : 1);
    this.camera.position.copy(this.camPos);
    this.camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    this.camera.lookAt(this.lookAt);

    this.renderer.render(this.scene, this.camera);
  }

  /** Re-render without advancing time (used after resize). */
  renderOnce() {
    if (!this.lost) this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.opts.canvas.removeEventListener('webglcontextlost', this.handleLost as EventListener);
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    // NOTE: no forceContextLoss() — the same <canvas> is reused when React re-runs the effect
    // (StrictMode / reduced-motion toggle); a force-lost context would break the next scene.
    this.renderer.dispose();
  }
}
