# Devereux Digitals

**An immersive, scroll-driven website for Devereux Digitals — an independent creative studio.**

Thousands of glowing particles take the visitor on one continuous camera flight: a spark bursts into violet ribbons,
becomes a hand that dissolves into a rippling curtain, and finally grows into a tree rising out of the fog — the journey
of an idea, told in real-time 3D.

Built with **React 19 + TypeScript + Vite**, **Three.js**, **GSAP ScrollTrigger** and **Lenis** smooth scrolling.

---

## ✨ Highlights

- **Real-time WebGL scene** — ~16k shader-driven particles morphing between five procedural shapes, with staggered
  transitions, burst effects, pointer interaction, dust and fog.
- **Scroll-scrubbed camera flight** — a `CatmullRomCurve3` camera path tied to scroll progress through a sticky stage
  (no scroll-hijacking).
- **Silky smooth scrolling** — Lenis and ScrollTrigger share a single GSAP ticker.
- **Adaptive quality** — particle counts and pixel ratio scale with device capability.
- **Accessible by default** — semantic landmarks, skip link, keyboard nav, focus-trapped mobile menu,
  `prefers-reduced-motion` support and a CSS fallback when WebGL is unavailable.
- **Fully responsive** — desktop, tablet and mobile layouts.

## 🚀 Getting started

Requires **Node.js 20+**.

```bash
git clone https://github.com/vatsaltank28/Devereux_Digital_Avantis.git
cd Devereux_Digital_Avantis
npm install
npm run dev          # → http://127.0.0.1:5173
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build at http://127.0.0.1:4173 |
| `npm run typecheck` | Run the TypeScript compiler without emitting |
| `npm run lint` | Lint the project with ESLint |

## 🗂 Project structure

```
src/
├── animations/      # Camera path, scroll timeline, hero intro timeline
├── components/      # Header, Hero, Journey, ContentSections, Footer, WebGL fallback
├── content/         # siteContent.ts — ALL site copy lives here
├── hooks/           # Smooth scroll + reduced-motion hooks
├── pages/           # Home page composition
├── scenes/          # Three.js scene, particle shapes, shaders, quality tiers
├── styles/          # Design tokens, typography, components, responsive rules
└── main.tsx         # App entry
```

## ✏️ Customising

| What | Where |
|---|---|
| Brand name, nav, hero text, sections, projects, journal, footer | `src/content/siteContent.ts` |
| Contact email (enables the "Start Your Project" mailto) | `contact.email` in `src/content/siteContent.ts` |
| Colours, spacing, fonts | `src/styles/tokens.css` |
| Particle counts / device tiers | `src/scenes/quality.ts` |
| Camera keyframes & stage timing | `KEYS` in `src/animations/cameraTimeline.ts` |
| Length of the scroll journey | `.journey { height }` in `src/styles/components.css` |

## 🌐 Deployment

`npm run build` outputs a static site in `dist/` that can be hosted anywhere —
Vercel, Netlify, GitHub Pages or Cloudflare Pages. For Vercel/Netlify, use build command `npm run build`
and output directory `dist`.

## 🛠 Tech stack

| | |
|---|---|
| Framework | React 19, TypeScript |
| Bundler | Vite |
| 3D | Three.js (custom `ShaderMaterial`) |
| Motion | GSAP + ScrollTrigger, Lenis |
| Fonts | Outfit, Figtree (via Fontsource) |

---

© Devereux Digitals. All rights reserved.
