/* ============================================================
   Most watched, per platform

   The whole job of this file is to render three platforms without
   implying they measure the same thing. YouTube publishes exact view
   counts for any public video. Meta publishes EU reach on ads and
   nothing at all on organic posts. So:

     YouTube    → real view counts, labelled "views"
     Facebook   → ads only, labelled "reached in the EU"
     Instagram  → same

   Where a platform genuinely cannot answer, the server sends the
   reason and it is printed. An empty list with no explanation would
   read as "nothing is happening on Instagram", which is false — the
   truth is "Instagram does not publish this".
   ============================================================ */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (window.AdVault && window.AdVault.esc) || (s => String(s));

  const section = $('#watched');
  const body = $('#watchedBody');
  const status = $('#watchedStatus');
  if (!section || !body) return;

  const ago = iso => {
    if (!iso) return '';
    const days = Math.round((Date.now() - Date.parse(iso)) / 86400000);
    if (!Number.isFinite(days)) return '';
    return days <= 0 ? 'today' : days === 1 ? 'yesterday'
      : days < 30 ? `${days} days ago`
        : days < 365 ? `${Math.round(days / 30)} months ago`
          : `${Math.round(days / 365)} years ago`;
  };

  function videoRow(v, i) {
    const e = v.engagement || {};
    return `<li class="wrow">
      <span class="wrow__rank">${i + 1}</span>
      ${v.thumb ? `<img class="wrow__thumb" src="${esc(v.thumb)}" alt="" loading="lazy" decoding="async">` : '<span class="wrow__thumb wrow__thumb--none"></span>'}
      <span class="wrow__main">
        <span class="wrow__title">${esc(v.title)}</span>
        <span class="wrow__by">${esc(v.by)}${v.region ? ' · trending ' + esc(v.region) : ''} · ${esc(ago(v.publishedAt))}</span>
      </span>
      <span class="wrow__num">
        <b>${esc(v.viewsLabel)}</b><em>views</em>
        ${e.likelyPaid ? '<span class="flag" title="Very low likes per view — this count may be promoted rather than earned">promoted?</span>' : ''}
      </span>
      <a class="wrow__go" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(v.title)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
    </li>`;
  }

  function adRow(a, i) {
    return `<li class="wrow">
      <span class="wrow__rank">${i + 1}</span>
      <span class="wrow__thumb wrow__thumb--none"></span>
      <span class="wrow__main">
        <span class="wrow__title">${esc(a.title)}</span>
        <span class="wrow__by">${esc(a.by)} · started ${esc(ago(a.publishedAt))}${a.running ? '' : ' · stopped'}</span>
      </span>
      <span class="wrow__num">
        <b>${esc(a.reachLabel)}</b><em>reached in the EU</em>
        ${a.running ? '<span class="pill pill--on">Running</span>' : ''}
      </span>
      ${a.url ? `<a class="wrow__go" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open creative in the Ad Library">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>` : '<span></span>'}
    </li>`;
  }

  let inFlight = 0;

  async function load(platform) {
    const mine = ++inFlight;
    status.textContent = 'Loading…';
    body.innerHTML = '';

    let d;
    try {
      d = await (await fetch('/api/watched?platform=' + encodeURIComponent(platform) + '&limit=12')).json();
    } catch {
      section.remove();                       /* static host — say nothing */
      return;
    }
    if (mine !== inFlight) return;
    if (!d || !d.ok) { section.remove(); return; }

    const parts = [];

    /* Videos — real only on YouTube. */
    if (d.videos && d.videos.rows && d.videos.rows.length) {
      parts.push(`<div class="wgroup">
        <h3 class="wgroup__h">Most-watched videos</h3>
        <p class="wgroup__basis">${esc(d.videos.basis || '')}</p>
        <ol class="wlist">${d.videos.rows.map(videoRow).join('')}</ol>
      </div>`);
    } else if (d.videos && d.videos.unavailable) {
      parts.push(`<div class="wgroup">
        <h3 class="wgroup__h">Most-watched videos</h3>
        <p class="wgroup__none">${esc(d.videos.unavailable)}</p>
      </div>`);
    }

    /* Ads. */
    if (d.ads && d.ads.rows && d.ads.rows.length) {
      parts.push(`<div class="wgroup">
        <h3 class="wgroup__h">Ads running now</h3>
        <p class="wgroup__basis">${esc(d.ads.basis || '')}</p>
        <ol class="wlist">${d.ads.rows.map(adRow).join('')}</ol>
      </div>`);
    } else if (d.ads && d.ads.note) {
      parts.push(`<div class="wgroup"><p class="wgroup__none">${esc(d.ads.note)}</p></div>`);
    } else if (platform === 'youtube') {
      parts.push(`<div class="wgroup">
        <h3 class="wgroup__h">Ads</h3>
        <p class="wgroup__none">YouTube ad uploads are ranked in <a href="#viral">Spreading fastest</a> and the library above — both read the same live view counts.</p>
      </div>`);
    }

    body.innerHTML = parts.join('');
    status.textContent = platform === 'youtube'
      ? `${(d.videos.rows || []).length} videos, exact view counts from the YouTube Data API`
      : `${(d.ads.rows || []).length} ads on ${platform} · organic posts are not published by Meta`;
  }

  const tabs = [...document.querySelectorAll('#watchedTabs .chip')];
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    load(btn.dataset.platform);
  }));

  const first = tabs.find(b => b.getAttribute('aria-pressed') === 'true');
  load(first ? first.dataset.platform : 'youtube');
})();
