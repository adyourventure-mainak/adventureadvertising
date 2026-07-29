'use strict';
/* ────────────────────────────────────────────────────────────────
   Auto-discovery — find the most-viewed ads on YouTube, continuously,
   without anyone hand-writing a list.

   Three problems have to be solved for the results to be genuine
   rather than merely impressive:

   1. RE-UPLOADS. The most-viewed copy of a famous ad is often a fan
      channel, and its count is a fraction of the campaign's real
      reach. Anything whose channel reads like an archive is rejected.

   2. NOT-ADS. Searching "commercial" returns trailers, reaction
      videos, compilations and how-I-made-an-ad vlogs. Duration and
      title shape filter most of it; the rest is flagged, not hidden.

   3. BOUGHT VIEWS. YouTube counts paid placements in the public view
      count, so a brand with budget outranks a brand with an idea.
      Temu's Big Game ad shows 4.7 BILLION views against 109k likes —
      an engagement rate of 0.002%, roughly a thousandth of what an
      organically-watched ad earns. We compute that ratio and label
      it. A number that measures media spend is still a fact; letting
      the reader mistake it for resonance is not.

   Quota: search.list is 100 units per term against 10,000/day, so the
   whole sweep is cached hard and runs on a slow cycle.
   ──────────────────────────────────────────────────────────────── */

const API = 'https://www.googleapis.com/youtube/v3';
const KEY = () => process.env.YOUTUBE_API_KEY || '';

/* Ad-intent queries. Broad enough to surface work from any market,
   narrow enough that most results are actually advertising. */
const QUERIES = (process.env.DISCOVER_QUERIES || [
  'official commercial ad',
  'big game commercial official',
  'brand campaign film official',
  'official tv advert',
  'commercial official brand india'
].join('|')).split('|').map(s => s.trim()).filter(Boolean);

/* Channel names that mean "someone else's ad, re-hosted". */
const REUPLOAD = /\b(fan|archive|classic|vintage|best of|compilation|collection|adverts?|tv ?ads?|commercials? ?(world|tv|channel)?|retro|nostalgia|throwback)\b/i;

/* Titles that mean "about an ad" rather than "is an ad". */
const NOT_AD = /\b(reaction|review|breakdown|explained|behind the scenes|making of|how i|tutorial|compilation|top \d+|vs\.?|trailer)\b/i;

const MIN_VIEWS = Number(process.env.DISCOVER_MIN_VIEWS || 1_000_000);
const MIN_SECS = 5;
const MAX_SECS = 300;

async function call(endpoint, params) {
  if (!KEY()) throw new Error('YOUTUBE_API_KEY is not set');
  const url = new URL(API + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('key', KEY());
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`YouTube ${body?.error?.errors?.[0]?.reason || res.status}: ${body?.error?.message || res.statusText}`);
  }
  return body;
}

const seconds = iso => {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  if (!m) return 0;
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
};

const compact = n =>
  n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B' :
    n >= 1e6 ? Math.round(n / 1e6) + 'M' :
      n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n);

/* Likes per thousand views. Organically-watched ads land roughly 1–10;
   heavily-promoted ones fall an order of magnitude below that. This is
   a signal, not a verdict, and it is reported as one. */
function engagement(views, likes) {
  if (!views || likes == null) return null;
  const per1k = (likes / views) * 1000;
  return {
    per1k: Number(per1k.toFixed(2)),
    /* Below 0.2 likes per 1k, a view count is far more likely to have
       been bought than earned. */
    likelyPaid: per1k < 0.2
  };
}

async function sweep() {
  const seen = new Set();
  const ids = [];

  for (const q of QUERIES) {
    let r;
    try {
      r = await call('/search', {
        part: 'snippet', q, type: 'video', maxResults: '50',
        order: 'viewCount', videoEmbeddable: 'true'
      });
    } catch {
      continue;                     /* one bad query must not empty the sweep */
    }
    for (const item of r.items || []) {
      const id = item.id?.videoId;
      if (id && !seen.has(id)) { seen.add(id); ids.push(id); }
    }
  }

  /* videos.list takes 50 ids for 1 unit, so this is nearly free. */
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    let r;
    try {
      r = await call('/videos', { part: 'snippet,statistics,contentDetails', id: ids.slice(i, i + 50).join(',') });
    } catch { continue; }

    for (const v of r.items || []) {
      const views = Number(v.statistics?.viewCount || 0);
      const likes = v.statistics?.likeCount == null ? null : Number(v.statistics.likeCount);
      const secs = seconds(v.contentDetails?.duration);
      const channel = v.snippet?.channelTitle || '';
      const title = v.snippet?.title || '';

      if (views < MIN_VIEWS) continue;
      if (secs < MIN_SECS || secs > MAX_SECS) continue;
      if (REUPLOAD.test(channel)) continue;          /* not the brand's own upload */
      if (NOT_AD.test(title)) continue;              /* about an ad, not an ad */

      out.push({
        id: v.id,
        title,
        brand: channel,
        channelId: v.snippet.channelId,
        publishedAt: v.snippet.publishedAt,
        seconds: secs,
        views,
        viewsLabel: compact(views),
        likes,
        comments: Number(v.statistics?.commentCount || 0),
        engagement: engagement(views, likes),
        thumb: v.snippet?.thumbnails?.maxres?.url
          || v.snippet?.thumbnails?.high?.url
          || v.snippet?.thumbnails?.medium?.url || null,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        source: 'youtube-data-api-v3'
      });
    }
  }

  out.sort((a, b) => b.views - a.views);
  return {
    ads: out,
    queries: QUERIES,
    filters: {
      minViews: MIN_VIEWS,
      durationSeconds: [MIN_SECS, MAX_SECS],
      rejected: 'archive/fan channels, and titles that discuss an ad rather than being one'
    }
  };
}

module.exports = { sweep, compact, engagement, configured: () => !!KEY() };
