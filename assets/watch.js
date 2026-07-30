/* ============================================================
   Competitor watch — the brands you pitch against

   The watchlist is per-user and lives in Firestore, so it follows
   you between devices. The SNAPSHOTS are server-side and shared:
   two agencies both watching Zomato hit one cached snapshot rather
   than two, which keeps quota sane and makes the diff consistent
   between them.

   Falls back to localStorage when Firestore is unreachable — losing
   your watchlist because a database hiccuped would be a poor trade
   for a list of six brand names.
   ============================================================ */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (window.AdVault && window.AdVault.esc) || (s => String(s));

  const section = $('#watch');
  const input = $('#watchBrand');
  const addBtn = $('#watchAdd');
  const chips = $('#watchChips');
  const bodyEl = $('#watchBody');
  const status = $('#watchStatus');
  if (!section || !input) return;

  const LOCAL_KEY = 'aa:watchlist';
  let list = [];

  /* ── storage ─────────────────────────────────────────────── */
  const readLocal = () => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
  };
  const writeLocal = v => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(v)); } catch {}
  };

  async function loadList() {
    list = readLocal();
    const store = window.AAWatchStore;          /* set by watchstore.js when signed in */
    if (store) {
      try {
        const remote = await store.read();
        if (Array.isArray(remote)) { list = remote; writeLocal(list); }
      } catch { /* offline or rules — the local copy still works */ }
    }
    paintChips();
  }

  async function saveList() {
    writeLocal(list);
    try { await window.AAWatchStore?.write(list); } catch {}
  }

  /* ── chips ───────────────────────────────────────────────── */
  function paintChips() {
    chips.innerHTML = list.map(b => `
      <li class="wchip">
        <button class="wchip__name" type="button" data-open="${esc(b)}">${esc(b)}</button>
        <button class="wchip__x" type="button" data-remove="${esc(b)}" aria-label="Stop watching ${esc(b)}">×</button>
      </li>`).join('');

    if (!list.length) {
      status.textContent = 'No brands yet. Add the two or three you lose pitches to.';
      bodyEl.innerHTML = '';
    }
  }

  /* ── rendering one brand's changes ───────────────────────── */
  const when = iso => {
    if (!iso) return '';
    const d = Math.round((Date.now() - Date.parse(iso)) / 86400000);
    return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d}d ago`;
  };

  function itemRow(i, kind) {
    const badge = i.source === 'youtube' ? 'YouTube' : 'Meta';
    return `<li class="wr wr--${kind}">
      <span class="wr__tag src src--${i.source === 'youtube' ? 'yt' : 'fb'}">${badge}</span>
      <span class="wr__main">
        <span class="wr__title">${esc(i.title || 'Untitled')}</span>
        <span class="wr__by">${esc(i.by || '')}${i.publishedAt ? ' · ' + esc(when(i.publishedAt)) : ''}${
          i.ranForDays ? ` · ran ${i.ranForDays} days` : ''}</span>
      </span>
      ${i.views ? `<span class="wr__num">${Number(i.views).toLocaleString()}<em>views</em></span>` : ''}
      ${i.reach ? `<span class="wr__num">${Number(i.reach).toLocaleString()}<em>EU reach</em></span>` : ''}
      ${i.url ? `<a class="wr__go" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>` : ''}
    </li>`;
  }

  function render(d) {
    if (!d.ok) {
      bodyEl.innerHTML = `<p class="wgroup__none">${esc(d.reason || 'Could not check that brand.')}</p>`;
      return;
    }

    const ch = d.channel;
    /* Show which channel is being monitored. Brand-name resolution is a
       heuristic — "Dabur" lands on the Arabia channel because it has the
       most subscribers — and the only honest fix is letting the reader
       see it and tell us we got it wrong. */
    const head = `<p class="wsource">Watching
      ${ch ? `<b>${esc(ch.title)}</b> on YouTube${ch.subscribers ? ` (${Number(ch.subscribers).toLocaleString()} subscribers)` : ''}` : 'no YouTube channel found'}
      · Meta creatives run by a page named “${esc(d.brand)}”.</p>`;

    if (d.first) {
      bodyEl.innerHTML = head + `
        <p class="wgroup__none">${esc(d.note)} We recorded ${d.current.length} live items just now — come back tomorrow and this shows what moved.</p>
        <ol class="wrlist">${d.current.slice(0, 8).map(i => itemRow(i, 'base')).join('')}</ol>`;
      status.textContent = `${d.brand}: baseline recorded, ${d.current.length} items`;
      return;
    }

    const blocks = [];
    if (d.added.length) {
      blocks.push(`<div class="wgroup"><h3 class="wgroup__h">New since ${esc(when(d.since))} (${d.added.length})</h3>
        <ol class="wrlist">${d.added.map(i => itemRow(i, 'new')).join('')}</ol></div>`);
    }
    if (d.stopped && d.stopped.length) {
      blocks.push(`<div class="wgroup"><h3 class="wgroup__h">Stopped running (${d.stopped.length})</h3>
        <ol class="wrlist">${d.stopped.map(i => itemRow(i, 'stopped')).join('')}</ol></div>`);
    }
    if (d.removed.length) {
      blocks.push(`<div class="wgroup"><h3 class="wgroup__h">Gone from the archive (${d.removed.length})</h3>
        <ol class="wrlist">${d.removed.map(i => itemRow(i, 'gone')).join('')}</ol></div>`);
    }
    if (!blocks.length) {
      blocks.push(`<p class="wgroup__none">Nothing changed since ${esc(when(d.since))}. ${d.counts.current} items still live — ${d.counts.youtube} on YouTube, ${d.counts.meta} on Meta.</p>`);
    }

    bodyEl.innerHTML = head + blocks.join('');
    status.textContent = `${d.brand}: ${d.counts.added} new, ${d.counts.stopped} stopped, ${d.counts.current} live · compared against ${d.baselineAgeHours}h ago`;
  }

  let inFlight = 0;
  async function open(brand) {
    const mine = ++inFlight;
    status.textContent = `Checking ${brand}…`;
    bodyEl.innerHTML = '';
    let d;
    try {
      d = await (await fetch('/api/watch?brand=' + encodeURIComponent(brand))).json();
    } catch {
      status.textContent = 'Could not reach the server.';
      return;
    }
    if (mine !== inFlight) return;
    render(d);
  }

  /* ── events ──────────────────────────────────────────────── */
  async function add() {
    const brand = (input.value || '').trim();
    if (!brand) return;
    if (!list.some(b => b.toLowerCase() === brand.toLowerCase())) {
      list.push(brand);
      await saveList();
      paintChips();
    }
    input.value = '';
    open(brand);
  }

  addBtn.addEventListener('click', add);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });

  chips.addEventListener('click', async e => {
    const open_ = e.target.closest('[data-open]');
    if (open_) return open(open_.dataset.open);

    const rm = e.target.closest('[data-remove]');
    if (rm) {
      list = list.filter(b => b !== rm.dataset.remove);
      await saveList();
      paintChips();
    }
  });

  loadList();
  window.AAWatch = { reload: loadList };
})();
