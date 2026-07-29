/* ============================================================
   Adventure Advertising — live data layer

   Everything here is additive. If the API is unreachable or no keys
   are configured, the page keeps the bundled editorial estimates and
   nothing visibly breaks.

   /api/library  → YouTube Data API v3, exact live view counts
   /api/meta     → Meta Ad Library, currently-running creatives
   ============================================================ */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (window.AdVault && window.AdVault.esc) || (s => String(s));
  const fmt = n => Number(n).toLocaleString();

  /* ── 1. hydrate the library with live view counts ──────── */
  async function hydrate() {
    let payload;
    try {
      const res = await fetch('/api/library');
      payload = await res.json();
    } catch {
      return; /* opened from the filesystem, or server down — keep estimates */
    }
    if (!payload || !payload.live || !payload.stats) return;

    const checked = payload.fetchedAt
      ? new Date(payload.fetchedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';

    let hydrated = 0, total = 0;
    ADS.forEach(ad => {
      const s = payload.stats[ad.id];
      if (!s) return;
      /* Unverified = the only surviving copy is a third-party re-upload, whose
         count is a fraction of the ad's real reach. Keep the estimate. */
      if (s.verified === false) return;
      hydrated++;
      ad.live = true;
      ad.views = s.viewsLabel;
      ad.viewsNum = s.views / 1e6;   /* keeps the existing sort key in millions */
      ad.viewsExact = s.views;
      ad.likes = s.likes;
      ad.channel = s.channel;
      ad.publishedAt = s.publishedAt;
      ad.liveUrl = s.url;
      ad.videoId = s.videoId;
      ad.thumb = s.thumbnail;
      ad.fetchedAt = checked;
    });
    if (!hydrated) return;

    /* "combined" means all 14 — exact where verified, estimate where not */
    total = ADS.reduce((sum, ad) => sum + (ad.live ? ad.viewsExact : ad.viewsNum * 1e6), 0);

    window.AdVault.renderGrid();

    const n = $('#statViews'), l = $('#statViewsLabel');
    if (n && total) {
      n.textContent = total >= 1e9
        ? (total / 1e9).toFixed(2).replace(/0$/, '') + 'B'
        : Math.round(total / 1e6) + 'M';
      const estimated = ADS.length - hydrated;
      l.textContent = estimated
        ? `combined views · ${hydrated} live from YouTube, ${estimated} estimated`
        : 'combined views, live from YouTube';
    }

    const note = $('#results');
    if (note) {
      note.textContent += hydrated === ADS.length
        ? ` · checked ${checked}`
        : ` · ${hydrated} live counts checked ${checked}, the rest are estimates`;
    }
  }

  /* ── 2. Meta Ad Library lookup ──────────────────────────── */
  const status = $('#mStatus'), out = $('#mResults');

  function card(ad) {
    const date = d => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
    const metrics = [
      ad.euReach != null ? `EU reach ${fmt(ad.euReach)}` : null,
      ad.impressions ? `impressions ${ad.impressions}` : null,
      ad.spend ? `spend ${ad.spend}` : null
    ].filter(Boolean);

    return `<article class="mad">
      <header class="mad__head">
        <span class="mad__page">${esc(ad.page || 'Unknown page')}</span>
        <span class="pill ${ad.running ? 'pill--on' : ''}">${ad.running ? 'Running' : 'Stopped'}</span>
      </header>
      ${ad.headline ? `<p class="mad__headline">${esc(ad.headline)}</p>` : ''}
      ${ad.body ? `<p class="mad__body">${esc(ad.body.length > 320 ? ad.body.slice(0, 317) + '…' : ad.body)}</p>` : '<p class="mad__body mad__body--none">No text on this creative.</p>'}
      <dl class="mad__meta">
        <div><dt>Started</dt><dd>${date(ad.started)}</dd></div>
        <div><dt>Ended</dt><dd>${ad.stopped ? date(ad.stopped) : 'still live'}</dd></div>
        <div><dt>Platforms</dt><dd>${esc((ad.platforms || []).join(', ').toLowerCase() || '—')}</dd></div>
      </dl>
      ${metrics.length ? `<p class="mad__metrics">${esc(metrics.join(' · '))}</p>` : ''}
      ${ad.snapshot ? `<a class="sheet__link" href="${esc(ad.snapshot)}" target="_blank" rel="noopener noreferrer">Open the creative in the Ad Library
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>` : ''}
    </article>`;
  }

  async function searchMeta() {
    const term = ($('#mTerm').value || '').trim();
    if (!term) return;
    const countries = $('#mCountries').value;
    const adType = countries === 'US' ? 'POLITICAL_AND_ISSUE_ADS' : 'ALL';

    status.textContent = `Querying the Meta Ad Library for “${term}”…`;
    out.innerHTML = '';

    let r;
    try {
      const q = new URLSearchParams({ term, adType, limit: '12' });
      if (countries) q.set('countries', countries);
      r = await (await fetch('/api/meta?' + q)).json();
    } catch {
      status.textContent = 'Could not reach the server. Start it with `npm start` — this section needs the backend.';
      return;
    }

    if (r.configured === false) {
      status.innerHTML = 'Not connected yet. Add <code>META_ACCESS_TOKEN</code> to <code>.env</code> and restart — see the README for the five-minute setup.';
      return;
    }
    if (r.error) { status.textContent = r.error; return; }

    if (!r.ads || !r.ads.length) {
      status.textContent = r.note || `Nothing in the archive for “${term}” in ${(r.countries || []).join(', ')}.`;
      return;
    }

    status.textContent = `${r.count} ad${r.count === 1 ? '' : 's'} for “${term}” in ${(r.countries || []).join(', ')}`
      + (r.cached ? ' · cached' : '') + ' · the archive publishes no view counts, only reach and spend ranges';
    out.innerHTML = `<div class="madgrid">${r.ads.map(card).join('')}</div>`;
  }

  if ($('#mGo')) {
    $('#mGo').addEventListener('click', searchMeta);
    $('#mTerm').addEventListener('keydown', e => { if (e.key === 'Enter') searchMeta(); });
  }

  /* ── 3. keep the counts moving ───────────────────────────
     Without this the numbers are only as fresh as the page load. Poll
     while the tab is visible; stop while it is hidden so a forgotten
     tab is not hammering the server all day. */
  const POLL_MS = 60_000;
  let timer = null;

  function startPolling() {
    stopPolling();
    timer = setInterval(() => { if (!document.hidden) hydrate(); }, POLL_MS);
  }
  const stopPolling = () => { clearInterval(timer); timer = null; };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPolling();
    else { hydrate(); startPolling(); }   /* catch up immediately on return */
  });

  hydrate().then(startPolling);
})();
