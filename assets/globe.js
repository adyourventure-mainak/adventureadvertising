/* ============================================================
   Interactive globe — cobe, no framework

   cobe is a plain canvas library: createGlobe(canvas, opts). The
   React wrapper in the brief adds nothing the library needs, so
   this is the same component expressed without it.

   Two deliberate changes from the supplied version:

   1. The floating per-marker labels used CSS Anchor Positioning
      (`position-anchor`, `anchor()`), which is Chromium-only and
      still experimental — everywhere else the labels stack in a
      corner. The figures render as a legend beside the globe.

   2. The numbers are not invented. Each marker sits on the city a
      campaign was made in, carrying that video's real live view
      count from the YouTube Data API, and the legend groups those
      totals by country. Note the limit this works around: per-country
      view breakdowns for videos you do not own are not available from
      any public API — that is YouTube Analytics, and it is owner-only.
      So this is real view data grouped by origin, not a real
      geographic distribution of viewers.
   ============================================================ */

/* Used until /api/library answers, and if it never does. */
export const FALLBACK = [
  { id: 'dumb-ways',     city: 'Melbourne',  country: 'Australia',     lat: -37.81, lon: 144.96, views: 356609449 },
  { id: 'purple-egg',    city: 'Lehi',       country: 'United States', lat: 40.39,  lon: -111.85, views: 206172502 },
  { id: 'volvo-split',   city: 'Gothenburg', country: 'Sweden',        lat: 57.71,  lon: 11.97,  views: 127938048 },
  { id: 'old-spice',     city: 'Cincinnati', country: 'United States', lat: 39.10,  lon: -84.51,  views: 63353707 },
  { id: 'squatty-potty', city: 'St. George', country: 'United States', lat: 37.10,  lon: -113.58, views: 42720340 },
  { id: 'dollar-shave',  city: 'Los Angeles',country: 'United States', lat: 34.05,  lon: -118.24, views: 28993690 },
  { id: 'blendtec',      city: 'Orem',       country: 'United States', lat: 40.30,  lon: -111.69, views: 13124989 }
];

/* Pull live counts + origins from the server; fall back if it is down. */
export async function loadOrigins() {
  try {
    const r = await fetch('/api/library');
    const p = await r.json();
    if (!p.live || !p.stats) return FALLBACK;

    const rows = Object.entries(p.stats)
      .filter(([, s]) => s.verified && s.origin)
      .map(([id, s]) => ({
        id, city: s.origin.city, country: s.origin.country,
        lat: s.origin.lat, lon: s.origin.lon, views: s.views
      }));
    return rows.length ? rows : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

/* Legend rows: one per country, totals summed, biggest first. */
export function byCountry(rows) {
  const totals = new Map();
  rows.forEach(r => {
    const t = totals.get(r.country) || { country: r.country, views: 0, count: 0 };
    t.views += r.views; t.count++;
    totals.set(r.country, t);
  });
  return [...totals.values()].sort((a, b) => b.views - a.views);
}

export const compact = n =>
  n >= 1e9 ? (n / 1e9).toFixed(2) + 'B'
  : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M'
  : n >= 1e3 ? Math.round(n / 1e3) + 'K'
  : String(n);

export async function mountGlobe(canvas, { rows = FALLBACK, speed = 0.004 } = {}) {
  let createGlobe;
  try {
    ({ default: createGlobe } = await import('https://esm.sh/cobe@0.6.3'));
  } catch {
    canvas.closest('.globe')?.classList.add('globe--failed');
    return null;                       /* offline: the CSS fallback shows */
  }

  const state = { phi: 0, theta: 0.22, dragPhi: 0, dragTheta: 0, paused: false };
  let pointer = null;
  let globe = null;

  const onDown = e => {
    pointer = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
    state.paused = true;
  };
  const onMove = e => {
    if (!pointer) return;
    state.dragPhi = (e.clientX - pointer.x) / 260;
    state.dragTheta = (e.clientY - pointer.y) / 900;
  };
  const onUp = () => {
    if (pointer) {
      state.phi += state.dragPhi;
      state.theta += state.dragTheta;
      state.dragPhi = state.dragTheta = 0;
    }
    pointer = null;
    canvas.style.cursor = 'grab';
    state.paused = false;
  };

  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = Math.max(...rows.map(r => r.views), 1);

  function build() {
    const size = canvas.offsetWidth;
    if (!size || globe) return;

    globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: size * 2,
      height: size * 2,
      phi: 0,
      theta: 0.22,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 8,
      baseColor: [1, 1, 1],
      markerColor: [0.09, 0.63, 0.29],
      glowColor: [0.96, 0.96, 0.95],
      markerElevation: 0,
      opacity: 0.92,
      /* marker size scales with real views, floored so the small ones show */
      markers: rows.map(r => ({
        location: [r.lat, r.lon],
        size: 0.022 + (r.views / top) * 0.05
      })),
      onRender: s => {
        if (!state.paused && !reduced) state.phi += speed;
        s.phi = state.phi + state.dragPhi;
        s.theta = state.theta + state.dragTheta;
      }
    });

    /* Not inside requestAnimationFrame: rAF is paused in background tabs,
       which would leave the globe permanently invisible if the page was
       opened in one. The CSS transition still handles the fade. */
    canvas.style.opacity = '1';
  }

  if (canvas.offsetWidth > 0) build();
  else {
    const ro = new ResizeObserver(entries => {
      if (entries[0]?.contentRect.width > 0) { ro.disconnect(); build(); }
    });
    ro.observe(canvas);
  }

  return {
    destroy() {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (globe) globe.destroy();
    }
  };
}
