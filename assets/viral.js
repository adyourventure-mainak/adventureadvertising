/* ============================================================
   Spreading fastest — the viral board

   Ranks YouTube campaigns and live Meta creatives together by one
   number: audience gained per day. The two are not the same
   measurement and the UI never implies they are — every row states
   its own basis, and the footnote spells out the difference.

   Silent by design: if /api/viral is unreachable (static hosting,
   server down, opened from the filesystem) the section removes
   itself rather than showing a broken shell.
   ============================================================ */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (window.AdVault && window.AdVault.esc) || (s => String(s));

  const section = $('#viral');
  const list = $('#viralList');
  const status = $('#viralStatus');
  const basis = $('#viralBasis');
  if (!section || !list) return;

  const compact = n =>
    n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M'
      : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'k'
        : String(n);

  const ago = d =>
    d === 1 ? 'in 1 day' : d < 90 ? `in ${d} days` :
      d < 730 ? `over ${Math.round(d / 30)} months` : `over ${Math.round(d / 365)} years`;

  function row(r, i) {
    const yt = r.source === 'youtube';
    return `<li class="vrow">
      <span class="vrow__rank">${i + 1}</span>

      <span class="vrow__rate">
        <b>${compact(r.perDay)}</b>
        <em>${yt ? 'views / day' : 'reached / day'}</em>
      </span>

      <span class="vrow__main">
        <span class="vrow__title">${esc(r.title)}</span>
        <span class="vrow__by">${esc(r.by)}</span>
      </span>

      <span class="vrow__facts">
        <span class="src src--${yt ? 'yt' : 'fb'}">${yt ? 'YouTube' : 'Meta'}</span>
        <span>${compact(r.total)} ${ago(r.days)}</span>
        ${r.running ? '<span class="pill pill--on">Running</span>' : ''}
      </span>

      ${r.url ? `<a class="vrow__go" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"
         aria-label="Open ${esc(r.title)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>` : ''}
    </li>`;
  }

  /* Explain an empty or lopsided board rather than letting the reader
     wonder where YouTube went. Every seeded campaign is years old, so a
     30-day window legitimately leaves only Meta. */
  function summarise(d) {
    const c = d.counts || {}, a = d.available || {};
    const w = d.window || {};
    const scope = w.runningOnly ? 'still running' : w.days ? `started in the last ${w.days} days` : 'all time';

    let s = `${d.rows.length} campaigns ${scope}, ranked by audience gained per day`
      + ` · ${c.youtube || 0} YouTube, ${c.meta || 0} Meta`;

    if (!c.youtube && a.youtube) {
      s += ` · the ${a.youtube} YouTube campaigns are historic, so they appear under All time`;
    }
    return s;
  }

  let inFlight = 0;

  async function load(query) {
    const mine = ++inFlight;
    status.textContent = 'Loading the board…';
    list.innerHTML = '';

    let d;
    try {
      d = await (await fetch('/api/viral' + (query ? '?' + query : ''))).json();
    } catch {
      section.remove();            /* no server — say nothing at all */
      return;
    }
    if (mine !== inFlight) return;             /* a later click won */
    if (!d || !d.ok) { section.remove(); return; }

    if (!d.rows.length) {
      status.textContent = 'Nothing in this window yet. Try All time.';
      basis.hidden = true;
      return;
    }

    list.innerHTML = d.rows.map(row).join('');
    status.textContent = summarise(d);

    /* The single most important sentence on this section. */
    basis.textContent =
      'YouTube figures are views per day averaged across a film\'s whole life, worldwide — a campaign '
      + 'that exploded in week one reads lower here than it truly was. Meta figures are EU accounts '
      + 'reached per day during an ad\'s current flight; Meta publishes no other reach number, even for '
      + 'ads running in India or the US. Same unit, different measurements — compare with that in mind.';
    basis.hidden = false;
  }

  /* ── window chips ────────────────────────────────────────── */
  const chips = [...document.querySelectorAll('#viralWindow .chip')];
  chips.forEach(btn => btn.addEventListener('click', () => {
    chips.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    load(btn.dataset.q);
  }));

  const initial = chips.find(b => b.getAttribute('aria-pressed') === 'true');
  load(initial ? initial.dataset.q : 'days=30');
})();
