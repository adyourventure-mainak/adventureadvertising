/* ============================================================
   Adventure Advertising — behaviour
   ============================================================ */
(function () {
  'use strict';

  /* ── library scope ────────────────────────────────────────
     true  → only campaigns whose brand upload still exists on YouTube, so every
             number on the page is an exact live count.
     false → all 14, including the seven whose originals the brands deleted and
             which therefore carry editorial estimates instead.
     The dropped entries stay in data.js — this is a filter, not a deletion. */
  const VERIFIED_ONLY = true;

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── poster art ───────────────────────────────────────────
     No stock imagery: each entry gets a generated abstract
     plate keyed to its motif, so the grid still has rhythm. */
  function poster(ad, ratio) {
    /* Plates are a fallback now that real thumbnails load; retinted for
       the light theme rather than left as dark rectangles. */
    const { c1, motif } = ad.poster;
    const c2 = '#F4F3F1';
    const w = 640, h = ratio === 'wide' ? 260 : 360;
    const id = ad.id;
    let art = '';

    if (motif === 'split') {
      art = `<g stroke="${c1}" fill="none" stroke-width="2" opacity=".85">
        ${Array.from({ length: 9 }, (_, i) =>
          `<path d="M${-40 + i * 30},${h} L${w * .5 - 60 + i * 26},${h * .5} L${w + 40 - i * 12},${h * .06 + i * 8}" opacity="${0.75 - i * .06}"/>`).join('')}
      </g><circle cx="${w * .5}" cy="${h * .5}" r="46" fill="none" stroke="${c1}" stroke-width="1.2" opacity=".55"/>`;
    } else if (motif === 'orbit') {
      art = `<g fill="none" stroke="${c1}">
        ${Array.from({ length: 6 }, (_, i) =>
          `<ellipse cx="${w * .5}" cy="${h * .55}" rx="${70 + i * 46}" ry="${28 + i * 20}" transform="rotate(${-18 - i * 7} ${w * .5} ${h * .55})" opacity="${.7 - i * .09}" stroke-width="1.4"/>`).join('')}
      </g><circle cx="${w * .5}" cy="${h * .55}" r="16" fill="${c1}" opacity=".9"/>`;
    } else if (motif === 'burst') {
      art = `<g stroke="${c1}" stroke-width="2" stroke-linecap="round">
        ${Array.from({ length: 26 }, (_, i) => {
          const a = (i / 26) * Math.PI * 2, r1 = 34, r2 = 60 + (i % 5) * 34;
          const cx = w * .5, cy = h * .52;
          return `<line x1="${(cx + Math.cos(a) * r1).toFixed(1)}" y1="${(cy + Math.sin(a) * r1).toFixed(1)}" x2="${(cx + Math.cos(a) * r2).toFixed(1)}" y2="${(cy + Math.sin(a) * r2).toFixed(1)}" opacity="${.25 + (i % 5) * .14}"/>`;
        }).join('')}
      </g>`;
    } else if (motif === 'wave') {
      art = `<g fill="none" stroke="${c1}" stroke-width="1.8">
        ${Array.from({ length: 11 }, (_, i) => {
          const y = h * .18 + i * (h * .06);
          return `<path d="M-20,${y} C${w * .22},${y - 40 - i * 3} ${w * .48},${y + 46 + i * 2} ${w * .72},${y - 12} S${w + 20},${y - 30} ${w + 20},${y - 30}" opacity="${.62 - i * .045}"/>`;
        }).join('')}
      </g>`;
    } else if (motif === 'grid') {
      art = `<g fill="${c1}">
        ${Array.from({ length: 88 }, (_, i) => {
          const col = i % 11, row = Math.floor(i / 11);
          const s = 6 + ((col * 3 + row * 5) % 5) * 3.4;
          return `<rect x="${28 + col * 54}" y="${20 + row * 42}" width="${s}" height="${s}" rx="1" opacity="${.18 + ((col + row) % 6) * .11}"/>`;
        }).join('')}
      </g>`;
    } else { /* drop */
      art = `<g>
        ${Array.from({ length: 7 }, (_, i) =>
          `<rect x="${w * .5 - 150 + i * 6}" y="${28 + i * 26}" width="${300 - i * 12}" height="12" rx="6" fill="${c1}" opacity="${.68 - i * .08}"/>`).join('')}
        <g fill="none" stroke="${c1}" stroke-width="1.6" opacity=".7">
          ${Array.from({ length: 4 }, (_, i) => `<ellipse cx="${w * .5 - 96 + i * 64}" cy="${h - 46}" rx="26" ry="34"/>`).join('')}
        </g>
      </g>`;
    }

    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Abstract plate for ${esc(ad.brand)} ${esc(ad.title)}">
      <defs>
        <linearGradient id="bg-${id}-${ratio}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}" stop-opacity=".30"/>
          <stop offset="55%" stop-color="${c2}" stop-opacity="1"/>
          <stop offset="100%" stop-color="${c2}" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="${c2}"/>
      <rect width="${w}" height="${h}" fill="url(#bg-${id}-${ratio})"/>
      ${art}
      <rect width="${w}" height="${h}" fill="none" stroke="rgba(255,255,255,.06)"/>
    </svg>`;
  }

  /* Trim in place so every consumer — grid, sheet, live.js — sees one library. */
  if (VERIFIED_ONLY) {
    for (let i = ADS.length - 1; i >= 0; i--) if (!ADS[i].verified) ADS.splice(i, 1);
  }

  /* ── gallery ──────────────────────────────────────────── */
  const state = { format: 'all', budget: 'any' };
  const grid = $('#grid');
  const results = $('#results');
  const hasGallery = !!grid;

  function chips(host, items, key) {
    host.innerHTML = items.map(i =>
      `<button class="chip" type="button" data-key="${key}" data-val="${i.id}" aria-pressed="${state[key] === i.id}">${esc(i.label)}</button>`
    ).join('');
  }

  function visible() {
    return ADS
      .filter(a => state.format === 'all' || a.category === state.format)
      .filter(a => state.budget === 'any' || a.budget === state.budget)
      .sort((a, b) => b.viewsNum - a.viewsNum);
  }

  function renderGrid() {
    if (!hasGallery) return;
    const list = visible();
    const live = list.some(a => a.live);
    results.textContent = list.length
      ? `${list.length} campaign${list.length === 1 ? '' : 's'} · sorted by ${live ? 'live view count' : 'estimated reach'}`
      : 'Nothing matches that combination yet.';

    grid.innerHTML = list.map((ad, i) => {
      const wide = i === 0 && list.length > 2;
      const cat = CATEGORIES.find(c => c.id === ad.category);
      const bud = BUDGETS.find(b => b.id === ad.budget);
      return `<button class="card${wide ? ' card--wide' : ''}" type="button" data-id="${ad.id}" aria-haspopup="dialog">
        <span class="card__poster">
          ${ad.thumb
            ? `<img class="card__thumb" src="${esc(ad.thumb)}" alt="" loading="lazy" decoding="async">`
            : poster(ad, wide ? 'wide' : 'std')}
          ${ad.videoId ? '<span class="card__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span>' : ''}
          <span class="card__views${ad.live ? ' card__views--live' : ''}">${ad.live ? '<i class="dot" aria-hidden="true"></i>' : ''}${esc(ad.views)} views</span>
          <span class="card__rank">${String(i + 1).padStart(2, '0')}</span>
        </span>
        <span class="card__body">
          <span class="card__meta">${esc(ad.brand)} · ${ad.year} · ${esc(ad.runtime)}</span>
          <span class="card__title">${esc(ad.title)}</span>
          <span class="card__hook">${esc(ad.hook)}</span>
          <span class="card__foot">
            <span class="pill">${esc(cat ? cat.label : ad.category)}</span>
            <span class="pill">${esc(bud ? bud.label : ad.budget)}</span>
            <span class="card__cue">Break it down
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </span>
        </span>
      </button>`;
    }).join('');
  }

  /* Only offer filters that can actually return something. */
  const present = (list, field) => list.filter((i, idx) =>
    idx === 0 || ADS.some(a => a[field] === i.id));

  if ($('#filterFormat')) chips($('#filterFormat'), present(CATEGORIES, 'category'), 'format');
  if ($('#filterBudget')) chips($('#filterBudget'), present(BUDGETS, 'budget'), 'budget');
  renderGrid();

  /* Only the library's own chips. Other sections use .chip too, and a
     document-wide selector was setting every one of them pressed. */
  const ownChips = () => $$('#filterFormat .chip, #filterBudget .chip');

  document.addEventListener('click', e => {
    const chip = e.target.closest('#filterFormat .chip, #filterBudget .chip');
    if (chip) {
      state[chip.dataset.key] = chip.dataset.val;
      ownChips().forEach(c => c.setAttribute('aria-pressed', String(state[c.dataset.key] === c.dataset.val)));
      renderGrid();
      return;
    }
    const card = e.target.closest('.card');
    if (card) openSheet(card.dataset.id, card);
  });

  /* footer quick-jumps into the filtered library */
  $$('[data-jump]').forEach(a => a.addEventListener('click', () => {
    state.format = a.dataset.jump; state.budget = 'any';
    ownChips().forEach(c => c.setAttribute('aria-pressed', String(state[c.dataset.key] === c.dataset.val)));
    renderGrid();
  }));

  /* ── detail sheet ─────────────────────────────────────── */
  const sheet = $('#sheet'), sheetBody = $('#sheetBody'), sheetPanel = $('#sheetPanel');
  const hasSheet = !!sheet;
  let lastFocus = null;

  function openSheet(id, trigger) {
    if (!hasSheet) return;
    const ad = ADS.find(a => a.id === id);
    if (!ad) return;
    lastFocus = trigger || document.activeElement;
    const cat = CATEGORIES.find(c => c.id === ad.category);
    const bud = BUDGETS.find(b => b.id === ad.budget);
    const formula = FORMULAS.find(f => f.id === ad.formula);

    /* Click-to-load: nothing from YouTube is requested until the user asks
       for it, so opening a breakdown stays fast and sets no cookies. */
    const player = ad.videoId
      ? `<div class="player" data-video="${esc(ad.videoId)}">
           ${ad.thumb ? `<img src="${esc(ad.thumb)}" alt="Title frame from ${esc(ad.title)}">` : poster(ad, 'wide')}
           <button class="player__btn" type="button" data-play aria-label="Play ${esc(ad.title)} by ${esc(ad.brand)}">
             <svg viewBox="0 0 68 48" aria-hidden="true">
               <path class="player__bg" d="M66.5 7.7a8.6 8.6 0 0 0-6-6C55.2 0 34 0 34 0S12.8 0 7.5 1.6a8.6 8.6 0 0 0-6 6.1A90 90 0 0 0 0 24a90 90 0 0 0 1.5 16.3 8.6 8.6 0 0 0 6 6C12.8 48 34 48 34 48s21.2 0 26.5-1.7a8.6 8.6 0 0 0 6-6A90 90 0 0 0 68 24a90 90 0 0 0-1.5-16.3z"/>
               <path d="M45 24 27 14v20z" fill="#fff"/>
             </svg>
           </button>
           <span class="player__note">Plays here · ${esc(ad.runtime)}</span>
         </div>`
      : `<div class="sheet__poster">${poster(ad, 'wide')}</div>`;

    sheetBody.innerHTML = `
      ${player}
      <div class="sheet__meta">
        <span class="tag tag--live">${ad.live ? '<i class="dot" aria-hidden="true"></i>' : ''}${esc(ad.views)} views</span>
        <span class="tag">${esc(cat ? cat.label : '')}</span>
        <span class="tag">${esc(bud ? bud.label : '')}</span>
        <span class="tag">${esc(ad.runtime)}</span>
      </div>
      <h2 id="sheetTitle">${esc(ad.title)}</h2>
      <p class="sheet__brand">${esc(ad.brand)} · ${ad.year}</p>
      <p class="prose" style="max-width:none">${ad.why}</p>

      <div class="sheet__block">
        <h3>How it is built</h3>
        <ol class="beats">${ad.beats.map(b => `
          <li class="beat"><span class="beat__t">${esc(b.t)}</span>
          <span class="beat__d"><b>${esc(b.label)}</b> ${esc(b.desc)}</span></li>`).join('')}
        </ol>
      </div>

      <div class="sheet__block">
        <h3>Replicate it</h3>
        <ol class="steps">${ad.playbook.map(s => `<li><span><b>${esc(s.h)}.</b> ${esc(s.d)}</span></li>`).join('')}</ol>
      </div>

      <div class="sheet__block">
        <h3>What you need</h3>
        <div class="kit">${ad.kit.map(k => `<span class="pill">${esc(k)}</span>`).join('')}</div>
        <p class="prose">${esc(ad.cost)}</p>
      </div>

      <div class="sheet__block">
        <div class="warn"><b>Where this goes wrong</b>${esc(ad.trap)}</div>
        ${ad.live ? `<div class="livebox">
          <b>Live from the YouTube Data API</b>
          <span>${Number(ad.viewsExact).toLocaleString()} views${ad.likes ? ' · ' + Number(ad.likes).toLocaleString() + ' likes' : ''}
          · ${esc(ad.channel || '')}${ad.publishedAt ? ' · published ' + new Date(ad.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
          · checked ${esc(ad.fetchedAt || '')}</span>
        </div>` : ''}
        ${formula ? `<button class="btn btn--primary" type="button" data-formula="${formula.id}" style="margin-top:var(--s-6)">Build a brief with this structure</button>` : ''}
        <a class="sheet__link" href="${ad.liveUrl || 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ad.query)}" target="_blank" rel="noopener noreferrer">
          ${ad.liveUrl ? 'Watch it on YouTube' : 'Find it on YouTube'}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>`;

    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    sheetPanel.scrollTop = 0;
    sheetPanel.focus();

  }

  function closeSheet() {
    if (!hasSheet) return;
    sheet.hidden = true;
    document.body.style.overflow = '';
    /* Hiding the panel does not stop an embed — tear the iframe out or the
       audio keeps playing behind a closed sheet. */
    const frame = sheetBody.querySelector('iframe');
    if (frame) frame.remove();
    if (lastFocus) lastFocus.focus();
  }

  sheet.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return closeSheet();

    const play = e.target.closest('[data-play]');
    if (play) {
      const box = play.closest('.player');
      const id = box.dataset.video;
      box.classList.add('is-playing');
      box.innerHTML = `<iframe
        src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1"
        title="Video player" frameborder="0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
      return;
    }

    const f = e.target.closest('[data-formula]');
    if (f) {
      closeSheet();
      $('#bFormula').value = f.dataset.formula;
      syncFormulaHint();
      generate();
      $('#builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && hasSheet && !sheet.hidden) closeSheet();
  });

  /* ── principles ───────────────────────────────────────── */
  /* Sections come and go between pages now (the archive lives on its
     own page, principles were removed) so every block below checks
     for its host element rather than assuming one page shape. */
  if ($('#principles-list')) $('#principles-list').innerHTML = PRINCIPLES.map(p => `
    <li class="principle reveal">
      <span class="principle__n">${p.n}</span>
      <div><h3>${esc(p.h)}</h3><p>${esc(p.p)}</p></div>
      <p class="principle__ev"><b>${esc(p.ev.b)}</b>${esc(p.ev.t)}</p>
    </li>`).join('');

  /* ── brief builder ────────────────────────────────────── */
  const fSel = $('#bFormula');
  if (!fSel) return;                       /* page without the builder */
  fSel.innerHTML = FORMULAS.map(f => `<option value="${f.id}">${esc(f.name)} — ${esc(f.lineage)}</option>`).join('');

  let length = 60;
  $('#bLength').innerHTML = LENGTHS.map(l =>
    `<button type="button" role="radio" data-len="${l.id}" aria-checked="${l.id === length}">${esc(l.label)}</button>`).join('');

  $('#bLength').addEventListener('click', e => {
    const b = e.target.closest('[data-len]');
    if (!b) return;
    length = Number(b.dataset.len);
    $$('#bLength button').forEach(x => x.setAttribute('aria-checked', String(Number(x.dataset.len) === length)));
    generate();
  });

  function syncFormulaHint() {
    const f = FORMULAS.find(x => x.id === fSel.value);
    $('#formulaHint').textContent = f ? f.need : '';
  }
  fSel.addEventListener('change', () => { syncFormulaHint(); generate(); });
  syncFormulaHint();

  const tc = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  /* user input is lowercase by habit; hooks are sentences */
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  function params() {
    const val = (id, fb) => ($(id).value || '').trim() || fb;
    return {
      product:  val('#bProduct', 'your product'),
      brand:    val('#bBrand', 'your brand'),
      audience: val('#bAudience', 'your customers'),
      promise:  val('#bPromise', 'it does what you say it does')
    };
  }

  function buildBrief() {
    const f = FORMULAS.find(x => x.id === fSel.value);
    const p = params();
    const total = f.beats.reduce((s, b) => s + b.w, 0);
    let cursor = 0;
    const beats = f.beats.map(b => {
      const start = cursor;
      cursor += (b.w / total) * length;
      return { start, end: cursor, h: b.h, d: b.d(p) };
    });
    return { f, p, beats };
  }

  function render(brief) {
    const { f, p, beats } = brief;
    $('#briefOut').innerHTML = `
      <article class="brief">
        <div class="brief__head">
          <div>
            <h3>${esc(f.name)} · ${length >= 60 ? tc(length) : length + 's'} · ${esc(p.brand)}</h3>
            <p class="brief__sub">A ${esc(f.name.toLowerCase())} built around one claim: <em>${esc(p.promise)}</em>, aimed at ${esc(p.audience)}.</p>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" id="bCopy">Copy as text</button>
        </div>

        <div class="brief__block">
          <p class="brief__label">Three openings to test</p>
          <ul class="hooks">${f.hooks.map((fn, i) =>
            `<li><span>Hook ${i + 1}</span>${esc(cap(fn(p)))}</li>`).join('')}</ul>
        </div>

        <div class="brief__block">
          <p class="brief__label">Beat sheet</p>
          <ul class="sheetlist">${beats.map(b =>
            `<li><span class="t">${tc(b.start)}–${tc(b.end)}</span>
             <span class="d"><b>${esc(b.h)}</b><span>${esc(b.d)}</span></span></li>`).join('')}</ul>
        </div>

        <div class="brief__block">
          <p class="brief__label">Shot list</p>
          <ul class="checks">${f.shots.map(s =>
            `<li><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 11l6-3v8l-6-3z" fill="currentColor"/></svg><span>${esc(s(p))}</span></li>`).join('')}</ul>
        </div>

        <div class="brief__block">
          <p class="brief__label">Before you spend anything</p>
          <ul class="checks">${f.checks.map(c =>
            `<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${esc(c(p))}</span></li>`).join('')}</ul>
        </div>

        <div class="brief__block">
          <div class="warn"><b>How this format fails</b>${esc(f.trap)}</div>
        </div>
      </article>`;

    wireCopy(() => plain(brief));
  }

  /* Both the template brief and the AI brief need this, and the
     clipboard fallback is fiddly enough that having two copies of it
     would guarantee they drift. Takes a getter so it does not care
     which brief it is copying. */
  function wireCopy(getText) {
    const btn = $('#bCopy');
    if (!btn) return;
    btn.addEventListener('click', async e => {
      const text = getText();
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (err) {
        /* file:// and older browsers have no async clipboard — fall back */
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
        ta.remove();
      }
      e.target.textContent = ok ? 'Copied' : 'Copy failed — select and copy';
      setTimeout(() => { e.target.textContent = 'Copy as text'; }, 2000);
    });
  }

  function plain(brief) {
    const { f, p, beats } = brief;
    return [
      `${p.brand.toUpperCase()} — ${f.name} — ${length}s`,
      `Product: ${p.product}`,
      `Audience: ${p.audience}`,
      `Claim: ${p.promise}`,
      `Lineage: ${f.lineage}`,
      '',
      'HOOKS TO TEST',
      ...f.hooks.map((fn, i) => `  ${i + 1}. ${cap(fn(p))}`),
      '',
      'BEAT SHEET',
      ...beats.map(b => `  ${tc(b.start)}–${tc(b.end)}  ${b.h}: ${b.d}`),
      '',
      'SHOT LIST',
      ...f.shots.map(s => `  - ${s(p)}`),
      '',
      'BEFORE YOU SPEND ANYTHING',
      ...f.checks.map(c => `  - ${c(p)}`),
      '',
      `HOW THIS FAILS: ${f.trap}`,
      '',
      'Structure studied from public campaigns. Copy the structure, never the film.'
    ].join('\n');
  }

  function generate() { render(buildBrief()); }

  /* ── AI pass ──────────────────────────────────────────────
     The deterministic brief renders first and stays on screen while
     the model writes, so the button never leaves an empty panel and
     a failed call costs nothing — the reader keeps a usable brief
     either way. Structure and timecodes are sent as fact; the model
     only fills them in. */
  const btn = $('#bGenerate');

  async function generateAI() {
    const brief = buildBrief();
    render(brief);                       /* baseline first, instantly */

    const { f, p, beats } = brief;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Writing…';

    let d;
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          product: p.product, brand: p.brand, audience: p.audience, promise: p.promise,
          formula: f.name, lengthSeconds: length,
          beats: beats.map((b, i) => ({
            id: 'b' + (i + 1), time: `${tc(b.start)}–${tc(b.end)}`, heading: b.h
          }))
        })
      });
      d = await res.json();
    } catch {
      d = { ok: false, reason: 'Could not reach the server.' };
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }

    if (!d || !d.ok) {
      note(d && d.reason ? d.reason : 'The writer is unavailable.');
      return;
    }
    renderAI(brief, d);
  }

  /* A quiet line under the brief, not an alert: the template brief is
     still there and still usable, so a failure is a downgrade rather
     than an error. */
  function note(reason) {
    const out = $('#briefOut .brief');
    if (!out) return;
    const p = document.createElement('p');
    p.className = 'brief__ainote';
    p.textContent = `Written from the formula. AI pass unavailable — ${reason}`;
    out.appendChild(p);
  }

  function renderAI(brief, d) {
    const { f, p } = brief;
    $('#briefOut').innerHTML = `
      <article class="brief">
        <div class="brief__head">
          <div>
            <h3>${esc(f.name)} · ${length >= 60 ? tc(length) : length + 's'} · ${esc(p.brand)}</h3>
            <p class="brief__sub">Written to the <em>${esc(f.name.toLowerCase())}</em> structure for ${esc(p.audience)}, around one claim: <em>${esc(p.promise)}</em>.</p>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" id="bCopy">Copy as text</button>
        </div>

        <div class="brief__block">
          <p class="brief__label">Three openings to test</p>
          <ul class="hooks">${d.hooks.map((h, i) =>
            `<li><span>Hook ${i + 1}</span>${esc(h)}</li>`).join('')}</ul>
        </div>

        <div class="brief__block">
          <p class="brief__label">Beat sheet</p>
          <ul class="sheetlist">${d.beats.map(b =>
            `<li><span class="t">${esc(b.time)}</span>
             <span class="d"><b>${esc(b.heading)}</b><span>${esc(b.direction)}</span></span></li>`).join('')}</ul>
        </div>

        ${d.vo ? `<div class="brief__block">
          <p class="brief__label">Voiceover / on-screen text</p>
          <p class="brief__vo">${esc(d.vo)}</p>
        </div>` : ''}

        <div class="brief__block">
          <p class="brief__label">Shot list</p>
          <ul class="steps">${d.shots.map(sh => `<li><span>${esc(sh)}</span></li>`).join('')}</ul>
        </div>

        <div class="brief__block">
          <div class="warn"><b>Where this goes wrong</b>${esc(d.trap)}</div>
        </div>

        <p class="brief__ainote">Beats and timecodes come from the ${esc(f.name.toLowerCase())} structure; the words were written by ${esc(d.model)}. Read it before you shoot it.</p>
      </article>`;
    wireCopy(() => aiText(brief, d));
  }

  function aiText(brief, d) {
    const { f, p } = brief;
    return [
      `${f.name} · ${length}s · ${p.brand}`,
      `Claim: ${p.promise}`,
      `Audience: ${p.audience}`,
      '',
      'HOOKS', ...d.hooks.map((h, i) => `${i + 1}. ${h}`),
      '', 'BEATS', ...d.beats.map(b => `${b.time}  ${b.heading} — ${b.direction}`),
      ...(d.vo ? ['', 'VOICEOVER', d.vo] : []),
      '', 'SHOTS', ...d.shots.map(s => `- ${s}`),
      '', 'WHERE IT GOES WRONG', d.trap,
      '', `Structure from the ${f.name.toLowerCase()} formula; words by ${d.model}.`,
      'Copy the structure, never the film.'
    ].join('\n');
  }

  btn.addEventListener('click', generateAI);
  $$('#bProduct, #bBrand, #bAudience, #bPromise').forEach(i =>
    i.addEventListener('keydown', e => { if (e.key === 'Enter') generateAI(); }));

  $('#briefOut').innerHTML = `<div class="empty">Fill the fields and generate — you'll get hooks, a timed beat sheet, a shot list, and the specific way this structure fails.</div>`;
  generate();

  /* ── nav + reveal ─────────────────────────────────────── */
  const nav = $('#nav'), toggle = $('#navToggle'), links = $('#navLinks');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    links.classList.toggle('is-open', !open);
  });
  links.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
    });
  }, { threshold: .15 });
  $$('.reveal').forEach((el, i) => {
    if (el.closest('.hero')) el.style.setProperty('--d', (i * 60) + 'ms');
    io.observe(el);
  });

  /* Content must never depend on an animation firing. The gate hides the
     page behind display:none, so the observer sees nothing until it opens —
     revealAll() is the escape hatch the gate calls on the way out. */
  function revealAll() {
    $$('.reveal').forEach(el => el.classList.add('in'));
  }

  /* live.js hydrates ADS from the API, then asks for a repaint */
  window.AdVault = { renderGrid: renderGrid, esc: esc, revealAll: revealAll };
})();
