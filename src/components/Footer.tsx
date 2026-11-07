import type { MouseEvent } from 'react';
import { footer, navLeft, navRight } from '../content/siteContent';
import { scrollToHash } from '../hooks/useSmoothScroll';

export function Footer() {
  const go = (href: string) => (e: MouseEvent) => {
    e.preventDefault();
    scrollToHash(href);
  };
  return (
    <footer className="footer">
      <div className="footer__top">
        <p className="footer__brand">{footer.line}</p>
        <nav aria-label="Footer">
          <ul className="footer__list">
            {[...navLeft, ...navRight].map((l) => (
              <li key={l.label}>
                <a href={l.href} onClick={go(l.href)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#top" className="footer__top-link" onClick={go('#top')}>
          Back to top ↑
        </a>
      </div>
      <p className="footer__note">{footer.note}</p>
    </footer>
  );
}
