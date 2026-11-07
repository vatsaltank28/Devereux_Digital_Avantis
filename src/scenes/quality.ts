/** Device-aware quality tiers. Bead counts are the main cost lever. */
export interface Quality {
  tier: 'low' | 'medium' | 'high';
  count: number;
  dpr: number;
  dust: number;
  fog: number;
  cylinderSegments: number;
}

export function getQuality(viewportWidth: number, reducedMotion: boolean): Quality {
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  let tier: Quality['tier'] = 'high';
  if (viewportWidth < 768 || coarse) tier = 'low';
  else if (viewportWidth < 1200 || cores <= 4) tier = 'medium';

  const table = {
    low: { count: 7000, dpr: 1.5, dust: 160, fog: 40, cylinderSegments: 20 },
    medium: { count: 12000, dpr: 1.75, dust: 300, fog: 70, cylinderSegments: 28 },
    high: { count: 16000, dpr: 2, dust: 480, fog: 110, cylinderSegments: 36 },
  }[tier];

  return {
    tier,
    ...table,
    count: reducedMotion ? Math.round(table.count * 0.75) : table.count,
    dpr: Math.min(rawDpr, table.dpr),
  };
}
