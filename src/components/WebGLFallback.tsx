/** Shown when WebGL is unavailable or the context is lost. Pure CSS: a soft lavender "X" of crossed light bars. */
export function WebGLFallback() {
  return (
    <div className="fallback" role="img" aria-label="Decorative particle X (WebGL unavailable)">
      <span className="fallback__bar fallback__bar--a" />
      <span className="fallback__bar fallback__bar--b" />
      <span className="fallback__glow" />
    </div>
  );
}
