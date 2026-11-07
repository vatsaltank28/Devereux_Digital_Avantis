import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { contact, placeholderNote, sections, type Section } from '../content/siteContent';

gsap.registerPlugin(ScrollTrigger);

function SectionBlock({ s }: { s: Section }) {
  return (
    <section id={s.id} className="section" aria-labelledby={`${s.id}-title`} data-section>
      <div className="section__head">
        <span className="section__index">{s.index}</span>
        <h2 id={`${s.id}-title`} className="section__title">
          {s.title}
        </h2>
        {s.provenance === 'placeholder' && (
          <span className="badge" title={placeholderNote}>
            Placeholder
          </span>
        )}
      </div>
      <div className="section__body">
        <p className="section__lead">{s.lead}</p>
        {s.items && (
          <ul className="rows">
            {s.items.map((it, i) => (
              <li key={`${it.title}-${i}`} className="row">
                <span className="row__no">{String(i + 1).padStart(2, '0')}</span>
                <span className="row__title">{it.title}</span>
                <span className="row__meta">{it.meta}</span>
              </li>
            ))}
          </ul>
        )}
        {s.id === 'say-hello' &&
          (contact.email ? (
            <a className="cta cta--solid cta--lg" href={`mailto:${contact.email}`}>
              Begin a Project
            </a>
          ) : (
            <p className="section__note">No contact address is published in the accessible reference. Set one in src/content/siteContent.ts.</p>
          ))}
        {s.provenance === 'placeholder' && <p className="section__note">{placeholderNote}</p>}
      </div>
    </section>
  );
}

export function ContentSections({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reducedMotion || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-section]').forEach((el) => {
        gsap.from(el.querySelectorAll('.section__head > *, .section__lead, .row, .section__note'), {
          autoAlpha: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.07,
          scrollTrigger: { trigger: el, start: 'top 78%', once: true },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <div id="sections" ref={ref} className="sections">
      {sections.map((s) => (
        <SectionBlock key={s.id} s={s} />
      ))}
    </div>
  );
}
