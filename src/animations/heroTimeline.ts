/** Load-in choreography for the hero overlay (runs once; durations/easing are [I] reconstruction choices). */
import { gsap } from 'gsap';

export function playHeroIntro(root: ParentNode): gsap.core.Timeline {
  const q = (s: string) => [...root.querySelectorAll<HTMLElement>(s)];
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.5 });

  tl.to('[data-reveal-header]', { autoAlpha: 1, duration: 1.1 }, 0)
    .fromTo(
      q('[data-reveal="word"]'),
      { autoAlpha: 0, filter: 'blur(16px)', y: 18 },
      { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 1.5, stagger: 0.18 },
      0.2,
    )
    .fromTo(q('[data-reveal="chip"]'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 }, 1.0)
    .fromTo(q('[data-reveal="rule"]'), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'power2.inOut', transformOrigin: 'left' }, 1.0)
    // tagline: word-by-word blur-to-sharp (the reference still captures this mid-reveal)
    .fromTo(
      q('[data-reveal="tagline"] .word'),
      { autoAlpha: 0, filter: 'blur(9px)' },
      { autoAlpha: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.07 },
      1.3,
    )
    .set(q('[data-reveal="tagline"]'), { autoAlpha: 1 }, 1.3)
    .fromTo(q('[data-reveal="cta"]'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 }, 1.9);

  return tl;
}

/** Make everything visible immediately (reduced motion / no-JS-animation path). */
export function showHeroImmediately(root: ParentNode) {
  gsap.set([...root.querySelectorAll('[data-reveal],[data-reveal] .word,[data-reveal-header]')], {
    autoAlpha: 1,
    clearProps: 'filter,transform',
  });
}
