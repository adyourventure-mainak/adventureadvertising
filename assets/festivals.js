/* ============================================================
   Festival campaign planner

   Region defaults from the browser's own locale — the same coarse,
   no-IP-lookup approach presence.js uses. Locale gives a country, not
   a state, so an Indian reader is asked once which state they work in
   and the answer is remembered locally. Guessing "West Bengal" for
   everyone in India would be worse than asking.

   The number in bold is the LOCK date, not the festival date. When
   creative has to be signed off is the decision a planner actually
   makes; the festival date is just the deadline behind it.
   ============================================================ */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (window.AdVault && window.AdVault.esc) || (s => String(s));

  const section = $('#festivals');
  const select = $('#festRegion');
  const listEl = $('#festList');
  const status = $('#festStatus');
  const note = $('#festNote');
  if (!section || !select) return;

  const KEY = 'aa:region';

  /* Country from the browser, never from an IP lookup. */
  function guessCountry() {
    try {
      const tag = navigator.languages?.[0] || navigator.language || '';
      return new Intl.Locale(tag).region || '';
    } catch { return ''; }
  }

  function initialRegion() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) return saved;
    } catch {}
    /* Outside India the state list is meaningless, so show everything. */
    return guessCountry() === 'IN' ? 'WB' : 'ALL';
  }

  const badge = s => ({
    'late': ['Behind', 'fest__flag--late'],
    'act-now': ['Book now', 'fest__flag--now'],
    'ahead': ['On track', 'fest__flag--ok'],
    'passed': ['Passed', 'fest__flag--ok']
  }[s] || ['', '']);

  function row(f) {
    const [label, cls] = badge(f.status);
    const lock = f.daysToLock < 0
      ? `Lock date passed ${Math.abs(f.daysToLock)}d ago`
      : `Lock creative in ${f.daysToLock}d`;

    return `<li class="fest__row">
      <span class="fest__when">
        <b>${f.daysAway}</b><em>days away</em>
      </span>
      <span class="fest__main">
        <span class="fest__name">${esc(f.name)}
          ${f.spend === 'peak' ? '<span class="pill pill--peak">peak spend</span>' : ''}
        </span>
        <span class="fest__meta">${esc(f.when)}${f.exactDate ? '' : ' · approximate'} · ${esc(lock)} · ${f.leadWeeks}-week lead</span>
        <span class="fest__note">${esc(f.note)}</span>
      </span>
      <span class="fest__flag ${cls}">${esc(label)}</span>
    </li>`;
  }

  async function load(region) {
    status.textContent = 'Loading…';
    listEl.innerHTML = '';
    let d;
    try {
      d = await (await fetch('/api/festivals?region=' + encodeURIComponent(region) + '&months=12')).json();
    } catch {
      section.remove();                    /* static host — say nothing */
      return;
    }
    if (!d || !d.ok) { section.remove(); return; }

    /* Populate the picker once, from the server's own list. */
    if (!select.options.length) {
      select.innerHTML = Object.entries(d.regions)
        .map(([code, name]) => `<option value="${esc(code)}">${esc(name)}</option>`).join('');
      select.value = region;
    }

    listEl.innerHTML = d.festivals.map(row).join('');
    const urgent = d.festivals.filter(f => f.status === 'act-now' || f.status === 'late').length;
    status.textContent = `${d.festivals.length} in the next 12 months for ${d.regionName}`
      + (urgent ? ` · ${urgent} need a decision now` : '');

    note.textContent = d.dateNote;
    note.hidden = false;
  }

  select.addEventListener('change', () => {
    try { localStorage.setItem(KEY, select.value); } catch {}
    load(select.value);
  });

  load(initialRegion());
})();
