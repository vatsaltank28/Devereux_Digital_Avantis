import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Hero } from './Hero';
import { chapters } from '../content/siteContent';
import { buildScrollTimeline } from '../animations/scrollTimeline';

gsap.registerPlugin(ScrollTrigger);

/**
 * The tall scroll range that drives the camera flight. The stage is CSS-sticky (no pin spacers,
 * no scroll hijacking); a scrubbed GSAP timeline animates the overlay text against the same progress.
 */
export function Journey({ reducedMotion }: { reducedMotion: boolean }) {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => buildScrollTimeline(root, reducedMotion), root);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="journey" ref={rootRef} className="journey" aria-label="Devereux Digitals — scroll journey">
      <div className="journey__stage">
        <Hero />
        {chapters
          .filter((c) => c.caption)
          .map((c) => (
            <p key={c.id} className="chapter" data-chapter={c.id}>
              {c.caption}
            </p>
          ))}
        <div className="rail" aria-hidden="true">
          <span className="rail__fill" />
        </div>
      </div>
    </section>
  );
}
