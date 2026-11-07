import type { MouseEvent } from 'react';
import { hero } from '../content/siteContent';
import { scrollToHash } from '../hooks/useSmoothScroll';

/** Splits text into word spans for the blur-in reveal seen mid-animation in the reference still. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span className="word" key={i}>
          {w}
          {' '}
        </span>
      ))}
    </>
  );
}

export function Hero() {
  const go = (href: string) => (e: MouseEvent) => {
    e.preventDefault();
    scrollToHash(href);
  };
  return (
    <div className="hero">
      <h1 className="hero__title">
        <span className="sr-only">Devereux Digitals — </span>
        <span className="hero__word hero__word--left" data-reveal="word">
          {hero.left}
        </span>
        <span className="hero__word hero__word--right" data-reveal="word">
          {hero.right}
        </span>
      </h1>

      <div className="hero__bottom" data-hero-fade>
        <ul className="hero__chips" aria-label="Services">
          {hero.services.map((s) => (
            <li key={s} className="chip" data-reveal="chip">
              {s}
            </li>
          ))}
        </ul>
        <div className="hero__rule" data-reveal="rule" />
        <div className="hero__bar">
          <p className="hero__tagline" aria-label={hero.tagline} data-reveal="tagline">
            <span aria-hidden="true">
              <Words text={hero.tagline} />
            </span>
          </p>
          <div className="hero__ctas">
            <a
              className="cta cta--solid"
              href={hero.primaryCta.href}
              onClick={go(hero.primaryCta.href)}
              data-reveal="cta"
            >
              {hero.primaryCta.label}
            </a>
            <a
              className="cta cta--ghost"
              href={hero.secondaryCta.href}
              onClick={go(hero.secondaryCta.href)}
              data-reveal="cta"
            >
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
