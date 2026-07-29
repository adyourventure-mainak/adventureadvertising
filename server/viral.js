'use strict';
/* ────────────────────────────────────────────────────────────────
   Viral = reach gained per day, not reach in total.

   A 2012 film with 357M views is not "viral now"; a creative that
   put 400k EU accounts in front of a product in nine days is. So
   every row is normalised to a daily rate and ranked on that.

   The two sources measure different things and this file does not
   pretend otherwise:

     YouTube  views ÷ days since publish — global, and a LIFETIME
              AVERAGE. A film that exploded in week one and flatlined
              since reads lower than its launch actually was.
     Meta     EU reach ÷ days in flight — EU/UK only, people not
              plays, and covers just the current run.

   They share a unit, not a definition. The page says so, and the
   payload carries `basis` per row so the UI can keep saying so.
   ──────────────────────────────────────────────────────────────── */

const meta = require('./meta');

const DAY = 86_400_000;

/* Brands whose creatives actually run in the EU, where Meta's archive
   holds all ad types. Each result is labelled with the Page that ran
   it, never the term searched — "Nike" surfaces an Italian pharmacy
   running a BioNike promo, and calling that Nike would be a lie. */
const TERMS = (process.env.VIRAL_TERMS ||
  'Nike,Adidas,Samsung,IKEA,Spotify,Zalando,Booking.com,Coca-Cola')
  .split(',').map(s => s.trim()).filter(Boolean);

/* Worldwide, not just the EU. Be clear about what this buys, though:
   a commercial ad is in the public archive because it ran in the EU or
   UK, and euReach counts EU accounts only. Widening the country list
   pulls in campaigns that ALSO run in India, the US, Brazil and so on —
   it does not conjure India-only campaigns, which Meta simply does not
   publish. The rate is therefore honest and EU-measured, on ads that
   are running globally. YouTube carries the genuinely worldwide half. */
const COUNTRIES = (process.env.VIRAL_COUNTRIES ||
  'IN,US,GB,DE,FR,IT,ES,NL,SE,PL,IE,BR,JP,AU,CA,AE,SG,ZA,MX,ID')
  .split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

const days = (fromISO, toISO) => {
  const from = Date.parse(fromISO);
  if (!Number.isFinite(from)) return null;
  const to = toISO ? Date.parse(toISO) : Date.now();
  /* Same-day flights would divide by zero and report infinite reach. */
  return Math.max(1, Math.round((to - from) / DAY));
};

/* ── YouTube: the seeded campaigns, by lifetime daily average ──── */
function fromYouTube(stats) {
  const out = [];
  for (const [id, s] of Object.entries(stats || {})) {
    if (!s || s.verified === false || !s.views || !s.publishedAt) continue;
    const d = days(s.publishedAt);
    if (!d) continue;
    out.push({
      id: `yt_${id}`,
      source: 'youtube',
      basis: 'views per day since publish, lifetime average, worldwide',
      title: s.title,
      by: s.channel,
      perDay: Math.round(s.views / d),
      total: s.views,
      totalLabel: s.viewsLabel,
      days: d,
      since: s.publishedAt,
      running: false,
      url: s.url,
      thumb: s.thumbnail
    });
  }
  return out;
}

/* ── Meta: currently archived creatives, by EU reach per day ───── */
/* Below this, a one-day flight produces a huge rate from a handful of
   people and crowds out real campaigns. */
const MIN_REACH = 1000;

const REMOVED = /this content was removed|content isn't available|no longer available/i;

async function fromMeta(limitPerTerm = 25) {
  if (!meta.configured()) return { rows: [], note: 'META_ACCESS_TOKEN is not set.' };

  const seen = new Set();
  const rows = [];
  let failed = 0;

  for (const term of TERMS) {
    let r;
    try {
      r = await meta.search({ term, countries: COUNTRIES, adType: 'ALL', limit: limitPerTerm });
    } catch {
      failed++;
      continue;             /* one bad term must not empty the board */
    }
    for (const ad of r.ads || []) {
      if (!ad.euReach || ad.euReach < MIN_REACH || !ad.started || seen.has(ad.id)) continue;
      /* Takedowns stay in the archive as a placeholder where the creative
         used to be. It reached people, but there is nothing to study. */
      if (REMOVED.test(ad.headline || '') || REMOVED.test(ad.body || '')) continue;
      seen.add(ad.id);
      const d = days(ad.started, ad.stopped);
      if (!d) continue;
      rows.push({
        id: `fb_${ad.id}`,
        source: 'meta',
        basis: 'EU accounts reached per day in flight (Meta publishes no other reach figure)',
        title: ad.headline || ad.caption || (ad.body || '').slice(0, 80) || 'Untitled creative',
        by: ad.page || 'Unknown page',
        perDay: Math.round(ad.euReach / d),
        total: ad.euReach,
        totalLabel: ad.euReach.toLocaleString(),
        days: d,
        since: ad.started,
        running: !!ad.running,
        platforms: ad.platforms || [],
        url: ad.snapshot,
        thumb: null
      });
    }
  }
  return {
    rows,
    note: failed === TERMS.length ? 'Every Meta query failed — token or permissions.' : null
  };
}

/* ── both, ranked ──────────────────────────────────────────────── */
/* Advertisers run the same creative under many ad IDs — one Zalando
   headline came back three times with three rates. Collapse to one row
   per page+headline, keeping the fastest, so the board shows twelve
   campaigns rather than twelve copies of four. */
function dedupe(rows) {
  const best = new Map();
  for (const r of rows) {
    const key = `${r.source}|${r.by}|${r.title}`.toLowerCase();
    const held = best.get(key);
    if (!held || r.perDay > held.perDay) best.set(key, r);
  }
  return [...best.values()];
}

/* A window is what separates "went viral" from "is going viral". With
   one set, the seeded YouTube films drop out — every one of them is
   years old — and the board becomes Meta-only. That is the honest
   answer, not a bug, so the payload reports it and the UI explains it
   rather than quietly showing half of what was promised. */
async function board(stats, limit = 12, { windowDays = 0, runningOnly = false } = {}) {
  const yt = fromYouTube(stats);
  const { rows: fb, note } = await fromMeta();

  const cutoff = windowDays ? Date.now() - windowDays * DAY : null;
  const withinWindow = r => {
    if (runningOnly && !r.running) return false;
    if (!cutoff) return true;
    /* Still running counts as current however long ago it launched — a
       campaign in its ninth week is live, not historic. */
    return r.running || Date.parse(r.since) >= cutoff;
  };

  const ytKept = yt.filter(withinWindow);
  const fbKept = fb.filter(withinWindow);
  const all = dedupe([...ytKept, ...fbKept]).sort((a, b) => b.perDay - a.perDay);

  return {
    rows: all.slice(0, limit),
    counts: { youtube: ytKept.length, meta: fbKept.length },
    available: { youtube: yt.length, meta: fb.length },
    window: { days: windowDays || null, runningOnly },
    note,
    terms: TERMS,
    countries: COUNTRIES
  };
}

module.exports = { board, fromYouTube, fromMeta, TERMS, COUNTRIES };
