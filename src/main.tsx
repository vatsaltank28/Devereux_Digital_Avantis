import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import './styles/typography.css';
import './styles/components.css';
import './styles/responsive.css';
import { Home } from './pages/Home';
import { prefersReducedMotion } from './hooks/useReducedMotion';

// elements start hidden only when the intro animation will actually run
if (!prefersReducedMotion()) document.documentElement.classList.add('js-motion');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
