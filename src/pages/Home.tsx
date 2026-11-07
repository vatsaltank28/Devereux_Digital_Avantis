import { useLayoutEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Header } from '../components/Header';
import { Journey } from '../components/Journey';
import { ContentSections } from '../components/ContentSections';
import { Footer } from '../components/Footer';
import { SceneCanvas } from '../scenes/SceneCanvas';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import { playHeroIntro, showHeroImmediately } from '../animations/heroTimeline';

export function Home() {
  const reduced = useReducedMotion();
  useSmoothScroll(!reduced);

  useLayoutEffect(() => {
    const root = document.getElementById('root')!;
    if (reduced) {
      showHeroImmediately(root);
      return;
    }
    const tl = playHeroIntro(root);
    return () => {
      tl.kill();
    };
  }, [reduced]);

  // layout is complete after fonts load; recompute trigger positions
  useLayoutEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => window.removeEventListener('load', refresh);
  }, []);

  return (
    <>
      <a className="skip-link" href="#sections">
        Skip to content
      </a>
      <SceneCanvas reducedMotion={reduced} />
      <Header />
      <main id="top">
        <Journey reducedMotion={reduced} />
        <ContentSections reducedMotion={reduced} />
      </main>
      <Footer />
    </>
  );
}
