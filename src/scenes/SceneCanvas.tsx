import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StudioScene } from './StudioScene';
import { sceneDescription } from '../content/siteContent';
import { WebGLFallback } from '../components/WebGLFallback';

gsap.registerPlugin(ScrollTrigger);

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    /** Dev/QA hook: set journey progress directly (used by the screenshot comparison scripts). */
    __studio?: { scene: StudioScene; setProgress: (p: number) => void };
  }
}

interface Props {
  reducedMotion: boolean;
}

/** Fixed full-viewport canvas that follows the #journey scroll range. */
export function SceneCanvas({ reducedMotion }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(() => !webglAvailable());

  useEffect(() => {
    if (fallback) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let scene: StudioScene;
    try {
      scene = new StudioScene({ canvas, reducedMotion, onContextLost: () => setFallback(true) });
    } catch (err) {
      console.warn('[Devereux] WebGL scene failed to initialise, using fallback.', err);
      // external-system failure → switch to the CSS fallback (async so we don't set state inside the effect body)
      queueMicrotask(() => setFallback(true));
      return;
    }

    let active = true;
    const size = () => {
      scene.resize(window.innerWidth, window.innerHeight);
      scene.renderOnce();
    };
    size();
    window.addEventListener('resize', size);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1), true);
    };
    const onLeave = () => scene.setPointer(0, 0, false);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    // journey progress
    const st = ScrollTrigger.create({
      trigger: '#journey',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => scene.setProgress(self.progress),
      onRefresh: (self) => scene.setProgress(self.progress, true),
    });

    // fade the stage out as the content sections take over, pause rendering once covered
    const fade = ScrollTrigger.create({
      trigger: '#sections',
      start: 'top bottom',
      end: 'top 20%',
      scrub: true,
      onUpdate: (self) => {
        wrap.style.opacity = String(1 - self.progress * 0.78);
      },
    });
    const covered = ScrollTrigger.create({
      trigger: '#sections',
      start: 'top top',
      end: 'bottom bottom',
      onToggle: (self) => {
        active = !self.isActive;
      },
    });

    const tick = (time: number, deltaMs: number) => {
      if (!active || document.hidden) return;
      void time;
      scene.update(deltaMs / 1000);
    };
    gsap.ticker.add(tick);

    // hero intro: beads converge from scatter into the X
    const intro = reducedMotion
      ? (scene.intro.value = 1)
      : gsap.to(scene.intro, { value: 1, duration: 3.4, delay: 0.15, ease: 'power3.out' });

    window.__studio = { scene, setProgress: (p) => scene.setProgress(p, true) };

    return () => {
      gsap.ticker.remove(tick);
      if (typeof intro !== 'number') intro.kill();
      st.kill();
      fade.kill();
      covered.kill();
      window.removeEventListener('resize', size);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      delete window.__studio;
      scene.dispose();
    };
  }, [fallback, reducedMotion]);

  return (
    <div ref={wrapRef} className="stage">
      <div className="stage__atmosphere" aria-hidden="true">
        <div className="stage__shaft stage__shaft--a" />
        <div className="stage__shaft stage__shaft--b" />
        <div className="stage__vignette" />
      </div>
      {fallback ? (
        <WebGLFallback />
      ) : (
        <canvas ref={canvasRef} className="stage__canvas" role="img" aria-label={sceneDescription} />
      )}
    </div>
  );
}
