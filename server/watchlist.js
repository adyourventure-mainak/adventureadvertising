'use strict';
/* ────────────────────────────────────────────────────────────────
   Competitor ad monitoring — what changed since yesterday.

   Search is a one-off; monitoring is a reason to come back. So the
   unit of value here is the DIFF, not the list: three creatives
   launched, one stopped after twelve days, the rest unchanged.

   Two sources, two honest scopes:

     Meta      live creatives from the Ad Library, filtered to ads
               actually run by a page whose NAME matches the brand.
               Meta's search_terms matches ad copy, not advertiser —
               searching "Tata" returns a drama app — so an unfiltered
               result set would be mostly noise attributed to a brand
               that never ran it.

     YouTube   the brand's own channel uploads. Resolved once (100
               quota units) then cached forever; refreshes cost ~2
               units via the uploads playlist rather than 100 via
               search.

   The baseline rotates once every 24h, not on every request. If it
   rotated per call, two users looking an hour apart would both be
   told "nothing changed" — which is true and useless. Comparing
   against yesterday is what makes the answer worth reading.
   ──────────────────────────────────────────────────────────────── */

const cache = require('./cache');
const meta = require('./meta');

const API = 'https://www.googleapis.com/youtube/v3';
const KEY = () => process.env.YOUTUBE_API_KEY || '';

const BASELINE_MS = Number(process.env.WATCH_BASELINE_HOURS || 24) * 3600_000;

const COUNTRIES = (process.env.WATCH_COUNTRIES ||
  'IN,US,GB,DE,FR,IT,ES,NL,SE,PL,IE,AE,SG,BR').split(',').map(s => s.trim()).filter(Boolean);

async function yt(endpoint, params) {
  if (!KEY()) throw new Error('YOUTUBE_API_KEY is not set');
  const url = new URL(API + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('key', KEY());
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`YouTube ${body?.error?.errors?.[0]?.reason || res.status}: ${body?.error?.message || res.statusText}`);
  return body;
}

/* Resolve brand → channel once. A search costs 100 units; the uploads
   playlist that follows costs 1, so this is cached indefinitely. */
async function resolveChannel(brand) {
  const store = cache.read('watch_channels')?.value || {};
  const key = brand.toLowerCase();
  if (store[key] !== undefined) return store[key];

  let found = null;
  try {
    const r = await yt('/search', { part: 'snippet', q: brand, type: 'channel', maxResults: '10' });

    /* Name match alone is not enough. Searching "Amul" returns a
       private individual's channel titled exactly "Amul" ahead of the
       dairy brand's "Amul TV" — and monitoring a stranger's uploads as
       a competitor's advertising would be worse than reporting nothing.
       Subscriber count separates a brand channel from a namesake. */
    const candidates = (r.items || [])
      .map(i => ({
        channelId: i.snippet?.channelId || i.id?.channelId,
        title: i.snippet?.channelTitle || i.snippet?.title || ''
      }))
      .filter(c => c.channelId && c.title.toLowerCase().includes(key));

    if (candidates.length) {
      /* channels.list takes 50 ids for a single quota unit. */
      const stats = await yt('/channels', {
        part: 'statistics,snippet', id: candidates.map(c => c.channelId).join(',')
      });
      const ranked = (stats.items || [])
        .map(c => ({
          channelId: c.id,
          title: c.snippet.title,
          subscribers: Number(c.statistics?.subscriberCount || 0),
          videos: Number(c.statistics?.videoCount || 0)
        }))
        .sort((a, b) => b.subscribers - a.subscribers);

      found = ranked[0] || candidates[0];
    }
  } catch { /* quota or transient — do not poison the cache with a hard null */
    return null;
  }

  store[key] = found;                       /* null is a real answer: no channel */
  cache.write('watch_channels', store);
  return found;
}

async function youtubeUploads(brand, max = 15) {
  const ch = await resolveChannel(brand);
  if (!ch || !ch.channelId) return { channel: null, videos: [] };

  /* uploads playlist id is the channel id with the second char swapped
     — documented behaviour, and it saves a channels.list call. */
  const uploads = 'UU' + ch.channelId.slice(2);

  let items;
  try {
    const r = await yt('/playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: String(max) });
    items = (r.items || []).map(i => i.contentDetails.videoId).filter(Boolean);
  } catch {
    return { channel: ch, videos: [] };
  }
  if (!items.length) return { channel: ch, videos: [] };

  const v = await yt('/videos', { part: 'snippet,statistics,contentDetails', id: items.join(',') });
  return {
    channel: ch,
    videos: (v.items || []).map(x => ({
      key: 'yt:' + x.id,
      source: 'youtube',
      title: x.snippet.title,
      by: x.snippet.channelTitle,
      publishedAt: x.snippet.publishedAt,
      views: Number(x.statistics?.viewCount || 0),
      url: `https://www.youtube.com/watch?v=${x.id}`,
      thumb: x.snippet.thumbnails?.medium?.url || null
    }))
  };
}

async function metaCreatives(brand, max = 30) {
  if (!meta.configured()) return [];
  let r;
  try {
    r = await meta.search({ term: brand, countries: COUNTRIES, adType: 'ALL', limit: max });
  } catch {
    return [];
  }
  const key = brand.toLowerCase();
  return (r.ads || [])
    /* The critical filter: the PAGE must be the brand. Meta matches ad
       copy, so without this a competitor report would be full of ads
       the competitor never ran. */
    .filter(a => (a.page || '').toLowerCase().includes(key))
    .map(a => ({
      key: 'fb:' + a.id,
      source: 'meta',
      title: a.headline || a.caption || (a.body || '').slice(0, 90) || 'Untitled creative',
      by: a.page,
      publishedAt: a.started,
      stoppedAt: a.stopped || null,
      running: !!a.running,
      reach: a.euReach || null,
      platforms: a.platforms || [],
      url: a.snapshot
    }));
}

async function snapshot(brand) {
  const [ytPart, fb] = await Promise.all([youtubeUploads(brand), metaCreatives(brand)]);
  return {
    brand,
    at: Date.now(),
    channel: ytPart.channel,
    items: [...ytPart.videos, ...fb]
  };
}

/* ── the product: what changed ─────────────────────────────────── */
async function changes(brand) {
  const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const stored = cache.read(`watch_${slug}`)?.value || null;
  const now = await snapshot(brand);

  /* First ever look: nothing to compare against. Say so rather than
     reporting everything as "new", which would be false. */
  if (!stored || !Array.isArray(stored.items)) {
    cache.write(`watch_${slug}`, { items: now.items, at: now.at });
    return {
      brand, channel: now.channel, first: true,
      since: null, added: [], removed: [], current: now.items,
      note: 'Baseline recorded. Changes appear from the next check onward.'
    };
  }

  const before = new Map(stored.items.map(i => [i.key, i]));
  const after = new Map(now.items.map(i => [i.key, i]));

  const added = now.items.filter(i => !before.has(i.key));
  const removed = stored.items.filter(i => !after.has(i.key));

  /* Ads that were running at the last check and have since stopped —
     more interesting than disappearing entirely, because the flight
     length tells you what they were willing to pay for. */
  const stopped = now.items.filter(i => {
    const was = before.get(i.key);
    return was && was.running && !i.running;
  }).map(i => ({
    ...i,
    ranForDays: i.publishedAt
      ? Math.max(1, Math.round((Date.now() - Date.parse(i.publishedAt)) / 86400000))
      : null
  }));

  /* Rotate the baseline only once a day, so "what changed" means
     "since yesterday" rather than "since you last clicked". */
  const age = Date.now() - (stored.at || 0);
  if (age >= BASELINE_MS) cache.write(`watch_${slug}`, { items: now.items, at: now.at });

  return {
    brand,
    channel: now.channel,
    first: false,
    since: new Date(stored.at).toISOString(),
    baselineAgeHours: Math.round(age / 3600000),
    added, removed, stopped,
    current: now.items,
    counts: {
      current: now.items.length,
      added: added.length,
      removed: removed.length,
      stopped: stopped.length,
      youtube: now.items.filter(i => i.source === 'youtube').length,
      meta: now.items.filter(i => i.source === 'meta').length
    }
  };
}

module.exports = { changes, snapshot, resolveChannel };
