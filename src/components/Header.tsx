import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { brand, navLeft, navRight, type NavLink } from '../content/siteContent';
import { scrollToHash, stopScroll } from '../hooks/useSmoothScroll';

export function Header() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const go = (href: string) => (e: MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    // let the menu release the scroll lock before scrolling
    requestAnimationFrame(() => scrollToHash(href));
  };

  useEffect(() => {
    stopScroll(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === 'Tab' && menuRef.current) {
        const f = [...menuRef.current.querySelectorAll<HTMLElement>('a,button')];
        const all = [toggleRef.current!, ...f];
        const idx = all.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && idx <= 0) {
          e.preventDefault();
          all[all.length - 1].focus();
        } else if (!e.shiftKey && idx === all.length - 1) {
          e.preventDefault();
          all[0].focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // close the menu when the viewport grows past the mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 821px)');
    const on = () => mq.matches && setOpen(false);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const renderLink = (l: NavLink) => (
    <li key={l.label}>
      <a
        href={l.href}
        onClick={go(l.href)}
        className={`header__link${l.label === 'Say Hello' ? ' header__link--cta' : ''}`}
      >
        {l.label}
      </a>
    </li>
  );

  return (
    <>
    <header className="header" data-reveal-header>
      <nav className="header__nav" aria-label="Primary">
        <ul className="header__list header__list--left">{navLeft.map(renderLink)}</ul>
        <a href="#top" className="header__brand" onClick={go('#top')} aria-label={`${brand.name} — back to top`}>
          <span className="header__rule" aria-hidden="true" />
          <span>{brand.name}</span>
          <span className="header__rule header__rule--r" aria-hidden="true" />
        </a>
        <ul className="header__list header__list--right">{navRight.map(renderLink)}</ul>
        <button
          ref={toggleRef}
          type="button"
          className="header__toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="header__toggle-label">{open ? 'Close' : 'Menu'}</span>
        </button>
      </nav>
    </header>
    {/* sibling of <header>: the header's backdrop-filter would otherwise become this fixed panel's containing block */}
    <div id="mobile-menu" ref={menuRef} className={`menu${open ? ' menu--open' : ''}`} hidden={!open}>
      <ul className="menu__list">
        {[...navLeft, ...navRight].map((l, i) => (
          <li key={l.label} style={{ ['--i' as string]: i }}>
            <a href={l.href} onClick={go(l.href)}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
    </>
  );
}
