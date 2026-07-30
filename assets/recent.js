/* ============================================================
   Live ads — what is running this year

   The archive below answers "what worked ever". This answers "what
   is running now", which is the only one you can pitch against. Ads
   are discovered automatically, filtered to the last twelve months
   and ranked by real view count.

   On the engagement number: for recent high-view ads the median is
   0.01 likes per 1,000 views. Bought reach is the NORM here, not the
   exception — which is what a media budget buys, and why flagging
   the majority as "promoted" told the reader nothing at all.

   So the signal is inverted. Every row shows its ratio, and the badge
   goes on the rare ad that earned its audience: at 0.3+ per 1,000 an
   ad is being watched because people want to, not because it was
   placed in front of them. Those are the ones worth studying.
   ============================================================ */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (window.AdVault && window.AdVault.esc) || (s => String(s));

  const section = $('#recent');
  const list = $('#recentList');
  const status = $('#recentStatus');
  if (!section || !list) return;

  /* Above this, likes-per-1000-views is high enough that the audience
     plausibly chose the ad rather than being served it. Set from the
     observed distribution: median 0.01, top of the range about 1.2. */
  const EARNED = 0.3;

  const ago = iso => {
    const d = Math.round((Date.now() - Date.parse(iso)) / 86400000);
    if (!Number.isFinite(d)) return '';
    return d < 30 ? `${d}d ago` : d < 365 ? `${Math.round(d / 30)} months ago` : 'over a year ago';
  };

  function row(a, i) {
    const e = a.engagement || {};
    return `<li class="wrow">
      <span class="wrow__rank">${i + 1}</span>
      ${a.thumb ? `<img class="wrow__thumb" src="${esc(a.thumb)}" alt="" loading="lazy" decoding="async">`
        : '<span class="wrow__thumb wrow__thumb--none"></span>'}
      <span class="wrow__main">
        <span class="wrow__title">${esc(a.title)}</span>
        <span class="wrow__by">${esc(a.brand)} · ${esc(ago(a.publishedAt))} · ${a.seconds}s</span>
      </span>
      <span class="wrow__num">
        <b>${esc(a.viewsLabel)}</b>
        <em>views · ${e.per1k != null ? e.per1k.toFixed(2) + ' likes/1k' : 'n/a'}</em>
        ${e.per1k >= EARNED ? '<span class="flag flag--earned" title="Unusually high likes per view for a campaign this size — this audience chose to watch">earned</span>' : ''}
      </span>
      <a class="wrow__go" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${esc(a.title)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
    </li>`;
  }

  let inFlight = 0;
  let cache = { days: null, ads: [], total: 0 };

  function paint(days, sort) {
    /* Ranking by views ranks by media budget — the ads people actually
       chose sit far below the ones people were served. So the sort is
       the reader's to make, and both orders are honest. */
    const ads = [...cache.ads];
    if (sort === 'earned') {
      ads.sort((a, b) => ((b.engagement || {}).per1k || 0) - ((a.engagement || {}).per1k || 0));
    }
    const top = ads.slice(0, 18);
    list.innerHTML = top.map(row).join('');

    const earned = cache.ads.filter(a => (a.engagement || {}).per1k >= EARNED).length;
    const window = days >= 365 ? '12 months' : `${Math.round(days / 30)} months`;
    status.textContent = sort === 'earned'
      ? `Ranked by likes per 1,000 views · ${earned} of ${cache.total} ads in the last ${window} cleared ${EARNED}`
      : `Top 18 by view count of ${cache.total} ads in the last ${window} · ranking by views ranks by media spend`;
  }

  async function load(days, sort) {
    const mine = ++inFlight;
    status.textContent = 'Finding ads…';
    list.innerHTML = '';

    if (cache.days !== days) {
      let d;
      try {
        d = await (await fetch('/api/discover?limit=60&days=' + encodeURIComponent(days))).json();
      } catch {
        section.remove();
        return;
      }
      if (mine !== inFlight) return;
      if (!d || !d.ok || !d.ads.length) { section.remove(); return; }
      cache = { days, ads: d.ads, total: d.total };
    }
    if (mine !== inFlight) return;
    paint(days, sort);
  }

  const dayChips = [...document.querySelectorAll('#recentWindow .chip')];
  const sortChips = [...document.querySelectorAll('#recentSort .chip')];

  const currentDays = () =>
    Number((dayChips.find(b => b.getAttribute('aria-pressed') === 'true') || {}).dataset?.days || 365);
  const currentSort = () =>
    (sortChips.find(b => b.getAttribute('aria-pressed') === 'true') || {}).dataset?.sort || 'views';

  dayChips.forEach(b => b.addEventListener('click', () => {
    dayChips.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    load(Number(b.dataset.days), currentSort());
  }));
  sortChips.forEach(b => b.addEventListener('click', () => {
    sortChips.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    load(currentDays(), b.dataset.sort);
  }));

  load(currentDays(), currentSort());
})();
