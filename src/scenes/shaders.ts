/** GLSL for the bead system, dust and fog. Colours/sizes tuned against reference/hero-still-1280x912.png. */

export const beadVertex = /* glsl */ `
  attribute vec3 aT1;
  attribute vec3 aT2;
  attribute vec3 aT3;
  attribute vec3 aT4;
  attribute vec4 aSeed;   // x: random, y: bead size, z: colour mix, w: phase
  attribute vec3 aRand;

  uniform float uMorph;    // 0..4 continuous stage
  uniform float uTime;
  uniform float uIntro;    // 0..1 assemble from scatter
  uniform float uDrift;    // idle motion amount
  uniform float uBurst;    // transition burst amount
  uniform float uViewH;    // drawing buffer height
  uniform float uSize;
  uniform float uAspect;
  uniform vec2  uPointer;  // ndc
  uniform float uPointerOn;
  uniform float uOpacity;
  uniform float uGlow;     // 1 = soft additive glow pass (big, faint sprites)

  varying vec3  vColor;
  varying float vAlpha;
  varying float vSpec;

  vec3 pickT(int i) {
    if (i == 0) return position;
    if (i == 1) return aT1;
    if (i == 2) return aT2;
    if (i == 3) return aT3;
    return aT4;
  }

  float violetFor(int i) {
    if (i == 0) return 0.62;
    if (i == 1) return 1.0;
    if (i == 2) return 0.14;
    if (i == 3) return 0.32;
    return 0.06;
  }

  vec3 flow(vec3 p, float t) {
    return vec3(
      sin(p.y * 1.3 + t) + sin(p.z * 0.9 - t * 0.7),
      sin(p.z * 1.1 + t * 0.8) + sin(p.x * 1.2 + t * 0.6),
      sin(p.x * 1.0 + t * 0.9) + sin(p.y * 0.8 - t * 0.5)
    );
  }

  void main() {
    float m = clamp(uMorph, 0.0, 3.9999);
    int seg = int(floor(m));
    float f = m - float(seg);
    vec3 a = pickT(seg);
    vec3 b = pickT(seg + 1);

    // per-bead stagger: hand crumbles from the fingertips, tree grows upward
    float delay = aSeed.x * 0.5;
    if (seg == 2) delay = aSeed.x * 0.3 + (1.0 - clamp((a.y + 3.6) / 7.2, 0.0, 1.0)) * 0.45;
    if (seg == 3) delay = aSeed.x * 0.25 + clamp((b.y + 4.7) / 9.4, 0.0, 1.0) * 0.5;
    float t = clamp((f - delay * 0.6) / 0.4, 0.0, 1.0);
    float st = t * t * (3.0 - 2.0 * t);

    vec3 pos = mix(a, b, st);

    // burst while changing mind
    float bl = sin(st * 3.14159265) * uBurst;
    vec3 dir = normalize(aRand * 2.0 - 1.0 + vec3(0.0, 0.15, 0.0));
    pos += dir * bl * (1.2 + aSeed.x * 2.2);

    // scene-specific life
    float wRib = exp(-pow(uMorph - 1.0, 2.0) * 4.0);
    float wCur = exp(-pow(uMorph - 3.0, 2.0) * 3.5);
    float wHand = exp(-pow(uMorph - 2.0, 2.0) * 5.0);
    pos += flow(pos * 0.45 + aRand * 5.0, uTime * 0.55) * 0.22 * wRib * uDrift;
    pos.z += sin(pos.x * 0.9 + uTime * 1.25 + pos.y * 0.35) * 0.55 * wCur * uDrift;
    pos.y += sin(pos.x * 0.6 + uTime * 0.8) * 0.14 * wCur * uDrift;
    pos.y -= wHand * f * 0.0; // reserved
    pos += flow(pos * 0.6 + aRand * 6.0, uTime * 0.35) * 0.055 * uDrift;

    // intro: beads converge from scatter
    vec3 scatter = (aRand - 0.5) * vec3(32.0, 20.0, 26.0);
    float ti = clamp((uIntro - aSeed.x * 0.45) / 0.55, 0.0, 1.0);
    ti = 1.0 - pow(1.0 - ti, 3.0);
    pos = mix(scatter, pos, ti);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // pointer repel in screen space
    vec2 ndc = gl_Position.xy / gl_Position.w;
    vec2 d = ndc - uPointer;
    d.x *= uAspect;
    float dist = length(d);
    float fall = exp(-dist * dist * 22.0) * uPointerOn;
    vec2 push = normalize(d + vec2(1e-4)) * fall * 0.075;
    push.x /= uAspect;
    gl_Position.xy += push * gl_Position.w;

    float sz = aSeed.y * uSize * (1.0 + bl * 0.25) * mix(1.0, 3.6, uGlow);
    gl_PointSize = clamp(sz * uViewH * 0.5 * projectionMatrix[1][1] / (-mv.z), 1.5, 220.0);

    // colour: lavender interior, white highlights
    float vv = mix(violetFor(seg), violetFor(seg + 1), smoothstep(0.0, 1.0, f));
    vec3 white = vec3(0.96, 0.96, 1.0);
    vec3 lav = vec3(0.70, 0.60, 0.88);   // between #baadc5 (sampled) and the saturated cores in the still
    vec3 deep = vec3(0.5, 0.36, 0.98);   // saturated violet for the ribbons
    float k = clamp(aSeed.z * 0.95 + (vv - 0.4) * 0.95, 0.0, 1.0);
    vec3 base = mix(white, mix(lav, deep, smoothstep(0.7, 1.0, vv)), k);
    // wide brightness spread: many dim lavender beads, some blown-out white sparkles
    float br = 0.72 + pow(aRand.y, 2.2) * 0.75;
    vColor = mix(base * br, white * 1.15, smoothstep(0.95, 1.35, br));
    vSpec = 0.3 + aRand.x * 1.1;
    vAlpha = uOpacity * smoothstep(0.0, 0.12, ti) * mix(1.0, 0.04 + 0.06 * br, uGlow);
  }
`;

export const beadFragment = /* glsl */ `
  uniform float uGlow;
  varying vec3  vColor;
  varying float vAlpha;
  varying float vSpec;

  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    if (uGlow > 0.5) {
      gl_FragColor = vec4(vColor, exp(-r2 * 3.2) * vAlpha);
      return;
    }
    float rr = sqrt(r2);
    const float bead = 0.58;
    vec3 col;
    float a;
    if (rr < bead) {
      vec2 q = c / bead;
      float z = sqrt(max(1.0 - dot(q, q), 0.0));
      vec3 n = vec3(q, z);
      vec3 l = normalize(vec3(-0.45, 0.55, 0.7));
      float diff = max(dot(n, l), 0.0);
      float spec = pow(max(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0), 20.0) * vSpec;
      col = vColor * (0.55 + 0.8 * diff) + spec * 1.15;
      a = smoothstep(bead, bead - 0.08, rr);
    } else {
      col = vColor * 1.2;
      a = exp(-r2 * 3.6) * 0.55 * smoothstep(1.0, bead, rr);
    }
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

export const dustVertex = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uViewH;
  uniform float uOpacity;
  varying float vA;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.07 + aSeed.w * 6.28) * 0.35;
    p.y += cos(uTime * 0.05 + aSeed.w * 9.0) * 0.3;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSeed.y * uViewH * 0.5 * projectionMatrix[1][1] / (-mv.z), 1.0, 9.0);
    vA = uOpacity * (0.35 + 0.65 * aSeed.z) * (0.75 + 0.25 * sin(uTime * (0.4 + aSeed.x) + aSeed.w * 20.0));
  }
`;

export const dustFragment = /* glsl */ `
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    gl_FragColor = vec4(vec3(0.9, 0.93, 1.0), exp(-r2 * 3.2) * vA);
  }
`;

export const fogVertex = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uViewH;
  uniform float uFog;
  varying float vA;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.09 + aSeed.w * 6.28) * 1.6;
    p.z += cos(uTime * 0.07 + aSeed.w * 4.0) * 1.2;
    p.y += sin(uTime * 0.11 + aSeed.w * 9.0) * 0.25;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSeed.y * uViewH * 0.5 * projectionMatrix[1][1] / (-mv.z), 8.0, 700.0);
    vA = uFog * (0.55 + 0.45 * aSeed.z);
  }
`;

export const fogFragment = /* glsl */ `
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    gl_FragColor = vec4(vec3(0.5, 0.58, 0.68), exp(-r2 * 2.6) * 0.075 * vA);
  }
`;
