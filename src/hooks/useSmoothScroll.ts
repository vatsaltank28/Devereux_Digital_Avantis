import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

/** Scroll to a hash target through Lenis when active, natively otherwise. */
export function scrollToHash(hash: string) {
  const target = hash === '#' || hash === '#top' ? 0 : (document.querySelector(hash) as HTMLElement | null);
  if (target === null) return;
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
  if (lenisInstance) {
    lenisInstance.scrollTo(target as HTMLElement | number, { offset: target === 0 ? 0 : -header, duration: 1.6 });
  } else if (target === 0) {
    window.scrollTo({ top: 0 });
  } else {
    (target as HTMLElement).scrollIntoView();
  }
  if (hash !== '#') history.replaceState(null, '', hash);
}

export function stopScroll(stop: boolean) {
  if (!lenisInstance) {
    document.documentElement.style.overflow = stop ? 'hidden' : '';
    return;
  }
  if (stop) lenisInstance.stop();
  else lenisInstance.start();
}

/**
 * Lenis smooth scroll synced with GSAP ScrollTrigger via the shared ticker.
 * Disabled for reduced-motion users. Gentle settings: no scroll hijacking.
 */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      ScrollTrigger.refresh();
      return;
    }
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenisInstance = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, [enabled]);
}
