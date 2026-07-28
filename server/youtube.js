'use strict';
/* ────────────────────────────────────────────────────────────────
   YouTube Data API v3.

   There is no "YouTube Ads Library" API — Google's Ads Transparency
   Center is a web UI with no public endpoint, and it carries no view
   counts anyway. What *is* public is the statistics of any public
   video, which is exactly what an ad upload on a brand channel is.
   So: a curated seed list of ad uploads, hydrated with live counts.

   Quota (10,000 units/day, free): videos.list = 1 unit per call for up
   to 50 ids. search.list = 100 units, so resolved ids are cached to
   disk and only looked up once.
   ──────────────────────────────────────────────────────────────── */

const cache = require('./cache');

const API = 'https://www.googleapis.com/youtube/v3';
const KEY = () => process.env.YOUTUBE_API_KEY || '';

async function call(endpoint, params) {
  if (!KEY()) throw new Error('YOUTUBE_API_KEY is not set');
  const url = new URL(API + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('key', KEY());

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = body?.error?.errors?.[0]?.reason || res.status;
    const msg = body?.error?.message || res.statusText;
    throw new Error(`YouTube ${reason}: ${msg}`);
  }
  return body;
}

/* Resolve seeds that have no pinned videoId. One search each, cached forever
   (delete server/.cache/resolved.json to redo). */
async function resolveIds(seeds) {
  const store = cache.read('resolved')?.value || {};
  let dirty = false;

  for (const seed of seeds) {
    if (seed.videoId || seed.skipResolve || store[seed.id]) continue;
    try {
      const r = await call('/search', {
        part: 'snippet', type: 'video', maxResults: '5',
        q: seed.query, order: 'relevance'
      });
      const items = r.items || [];
      const hint = (seed.channelHint || '').toLowerCase();
      const best =
        items.find(i => (i.snippet.channelTitle || '').toLowerCase().includes(hint)) ||
        items[0];
      if (best) {
        store[seed.id] = { videoId: best.id.videoId, channelTitle: best.snippet.channelTitle, matchedHint: best === items.find(i => (i.snippet.channelTitle || '').toLowerCase().includes(hint)) };
        dirty = true;
      }
    } catch (err) {
      /* One failed lookup must not sink the batch. */
      store[seed.id] = { error: err.message };
      dirty = true;
    }
  }
  if (dirty) cache.write('resolved', store);
  return store;
}

const compact = n => {
  n = Number(n) || 0;
  if (n >= 1e9) return '~' + (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return '~' + Math.round(n / 1e6) + 'M';
  if (n >= 1e3) return '~' + Math.round(n / 1e3) + 'K';
  return String(n);
};

/* Live stats for every seed. Returns a slug-keyed map the front end
   merges over the bundled editorial data. */
async function library(seeds) {
  const resolved = await resolveIds(seeds);

  const wanted = seeds.map(s => ({
    id: s.id,
    officialChannel: s.officialChannel || null,
    origin: s.origin || null,
    videoId: s.videoId || resolved[s.id]?.videoId || null
  })).filter(s => s.videoId);

  const out = {};
  for (let i = 0; i < wanted.length; i += 50) {
    const batch = wanted.slice(i, i + 50);
    const r = await call('/videos', {
      part: 'snippet,statistics,contentDetails',
      id: batch.map(b => b.videoId).join(',')
    });
    const byVideo = Object.fromEntries((r.items || []).map(it => [it.id, it]));

    for (const b of batch) {
      const it = byVideo[b.videoId];
      if (!it) continue;
      const views = Number(it.statistics.viewCount || 0);
      /* A re-upload's view count is not the ad's reach — often off by three
         orders of magnitude. Only a video on the brand's own channel is
         allowed to replace the editorial estimate. */
      const channel = it.snippet.channelTitle || '';
      const verified = !b.officialChannel ||
        channel.toLowerCase().includes(b.officialChannel.toLowerCase());

      out[b.id] = {
        verified,
        expectedChannel: b.officialChannel,
        origin: b.origin,
        videoId: b.videoId,
        url: 'https://www.youtube.com/watch?v=' + b.videoId,
        title: it.snippet.title,
        channel: it.snippet.channelTitle,
        publishedAt: it.snippet.publishedAt,
        /* maxres is true 16:9 at 1280x720 but is missing on most pre-2013
           uploads; the rest are 4:3 and get cropped by object-fit: cover. */
        thumbnail: it.snippet.thumbnails?.maxres?.url
          || it.snippet.thumbnails?.standard?.url
          || it.snippet.thumbnails?.high?.url
          || null,
        duration: it.contentDetails?.duration || null,
        views,
        viewsLabel: compact(views),
        likes: Number(it.statistics.likeCount || 0) || null,
        comments: Number(it.statistics.commentCount || 0) || null,
        source: 'youtube-data-api-v3'
      };
    }
  }
  return out;
}

module.exports = { library, resolveIds, compact, configured: () => !!KEY() };
