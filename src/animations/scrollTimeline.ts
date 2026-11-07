/**
 * Scroll-scrubbed overlay choreography. Progress p (0..1) is the same value that drives the
 * camera/morph in the scene. Timeline duration is 1, so tween positions are progress values.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters } from '../content/siteContent';

gsap.registerPlugin(ScrollTrigger);

export function buildScrollTimeline(root: HTMLElement, reducedMotion: boolean) {
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: reducedMotion ? true : 0.5,
    },
  });
  tl.set({}, {}, 1); // fix duration to 1

  const left = root.querySelector('.hero__word--left');
  const right = root.querySelector('.hero__word--right');
  const bottom = root.querySelector('[data-hero-fade]');

  // the hero composition clears the stage over the first 10% of the journey
  if (left) tl.to(left, { xPercent: -12, autoAlpha: 0, duration: 0.09, ease: 'power2.in' }, 0.015);
  if (right) tl.to(right, { xPercent: 12, autoAlpha: 0, duration: 0.09, ease: 'power2.in' }, 0.015);
  if (bottom) tl.to(bottom, { y: 24, autoAlpha: 0, duration: 0.08, ease: 'power2.in' }, 0.01);

  // chapter captions (verbatim fragments of the listing description)
  for (const c of chapters) {
    if (!c.caption) continue;
    const el = root.querySelector(`[data-chapter="${c.id}"]`);
    if (!el) continue;
    const [a, b] = c.range;
    const fade = Math.min(0.04, (b - a) / 3);
    tl.fromTo(el, { autoAlpha: 0, y: 14, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: fade }, a);
    if (c.id !== 'tree') tl.to(el, { autoAlpha: 0, y: -10, filter: 'blur(6px)', duration: fade }, b - fade);
  }

  const rail = root.querySelector('.rail');
  if (rail) tl.to(rail, { opacity: 1, duration: 0.05 }, 0.08);
  const fill = root.querySelector('.rail__fill');
  if (fill) tl.fromTo(fill, { scaleY: 0 }, { scaleY: 1, duration: 1, transformOrigin: 'top' }, 0);

  return tl;
}
