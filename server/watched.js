'use strict';
/* ────────────────────────────────────────────────────────────────
   Most watched, per platform — and an honest account of what each
   platform will actually tell you.

   YouTube is the only one of the three that publishes view counts
   for content you do not own. That is not a gap in this code, it is
   the shape of the platforms:

     YouTube    videos.list gives exact lifetime views for any public
                video. Both organic videos and ad uploads.
     Facebook   Graph API returns data only for Pages you administer.
     Instagram  same — the Graph API is for accounts you manage, and
                the Basic Display API was retired in December 2024.

   The tool that DID give public Facebook/Instagram post performance
   was CrowdTangle, which Meta shut down in August 2024. Its
   replacement, the Meta Content Library, requires an approved
   research application; a normal ads_read token gets a flat 400 (we
   check, rather than assume).

   So for Facebook and Instagram this module returns ADS only, from
   the Ad Library, ranked by EU reach — because EU reach is the only
   audience number Meta publishes anywhere on earth. It is not a view
   count and is never labelled as one.
   ──────────────────────────────────────────────────────────────── */

const meta = require('./meta');

const API = 'https://www.googleapis.com/youtube/v3';
const KEY = () => process.env.YOUTUBE_API_KEY || '';

/* Regions sampled for "most watched right now". India first — it is
   the home market — then the largest English-language markets. */
const REGIONS = (process.env.WATCHED_REGIONS || 'IN,US,GB').split(',').map(s => s.trim()).filter(Boolean);

const compact = n =>
  n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B' :
    n >= 1e6 ? Math.round(n / 1e6) + 'M' :
      n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n);

const seconds = iso => {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  return m ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
};

async function call(endpoint, params) {
  if (!KEY()) throw new Error('YOUTUBE_API_KEY is not set');
  const url = new URL(API + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('key', KEY());
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`YouTube ${body?.error?.errors?.[0]?.reason || res.status}: ${body?.error?.message || res.statusText}`);
  return body;
}

/* Likes per thousand views. Organic content lands roughly 1–10; a
   number far below that usually means the views were bought. */
function engagement(views, likes) {
  if (!views || likes == null) return null;
  const per1k = (likes / views) * 1000;
  return { per1k: Number(per1k.toFixed(2)), likelyPaid: per1k < 0.2 };
}

const row = v => {
  const views = Number(v.statistics?.viewCount || 0);
  const likes = v.statistics?.likeCount == null ? null : Number(v.statistics.likeCount);
  return {
    id: v.id,
    title: v.snippet.title,
    by: v.snippet.channelTitle,
    publishedAt: v.snippet.publishedAt,
    seconds: seconds(v.contentDetails?.duration),
    views,
    viewsLabel: compact(views),
    likes,
    engagement: engagement(views, likes),
    thumb: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || null,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    metric: 'views',
    platform: 'youtube'
  };
};

/* ── YouTube: most-watched videos trending now ─────────────────── */
async function youtubeVideos(limit = 12) {
  const seen = new Set();
  const out = [];
  for (const regionCode of REGIONS) {
    let r;
    try {
      r = await call('/videos', {
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular', regionCode, maxResults: '30'
      });
    } catch { continue; }
    for (const v of r.items || []) {
      if (seen.has(v.id)) continue;
      seen.add(v.id);
      out.push({ ...row(v), region: regionCode });
    }
  }
  out.sort((a, b) => b.views - a.views);
  return out.slice(0, limit);
}

/* ── Facebook / Instagram: ads only, ranked by EU reach ────────── */
const AD_TERMS = (process.env.WATCHED_AD_TERMS ||
  'Nike,Adidas,Samsung,IKEA,Spotify,Coca-Cola,Amazon,Zomato')
  .split(',').map(s => s.trim()).filter(Boolean);

const COUNTRIES = (process.env.WATCHED_COUNTRIES ||
  'IN,US,GB,DE,FR,IT,ES,NL,SE,PL,IE,BR,AE,SG').split(',').map(s => s.trim()).filter(Boolean);

async function metaAds(platform, limit = 12) {
  if (!meta.configured()) return { rows: [], note: 'META_ACCESS_TOKEN is not set.' };

  const seen = new Set();
  const rows = [];

  for (const term of AD_TERMS) {
    let r;
    try {
      r = await meta.search({ term, countries: COUNTRIES, adType: 'ALL', limit: 25 });
    } catch { continue; }

    for (const ad of r.ads || []) {
      if (!ad.euReach || ad.euReach < 1000) continue;
      if (!(ad.platforms || []).includes(platform)) continue;
      const key = `${ad.page}|${ad.headline || ad.body || ''}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        id: ad.id,
        title: ad.headline || ad.caption || (ad.body || '').slice(0, 90) || 'Untitled creative',
        by: ad.page || 'Unknown page',
        publishedAt: ad.started,
        running: !!ad.running,
        reach: ad.euReach,
        reachLabel: compact(ad.euReach),
        platforms: ad.platforms || [],
        url: ad.snapshot,
        thumb: null,
        /* Named precisely so the UI cannot accidentally call it "views". */
        metric: 'eu-reach',
        platform
      });
    }
  }

  rows.sort((a, b) => b.reach - a.reach);
  return { rows: rows.slice(0, limit), note: null };
}

/* ── one board per platform ────────────────────────────────────── */
const NO_ORGANIC = {
  facebook: 'Facebook publishes no public view counts. The Graph API returns data only for Pages you administer, and CrowdTangle — which did expose public post performance — was shut down by Meta in August 2024. Its replacement needs an approved research application.',
  instagram: 'Instagram publishes no public view counts. The Graph API covers only accounts you manage, and the Basic Display API was retired in December 2024.'
};

async function board(platform, limit = 12) {
  if (platform === 'youtube') {
    const videos = await youtubeVideos(limit);
    return {
      platform,
      videos: { rows: videos, metric: 'views', basis: 'Exact lifetime view counts from the YouTube Data API, trending across ' + REGIONS.join(', ') + '.' },
      ads: null   /* the ads board is served by /api/discover */
    };
  }

  if (platform === 'facebook' || platform === 'instagram') {
    const { rows, note } = await metaAds(platform, limit);
    return {
      platform,
      videos: { rows: [], unavailable: NO_ORGANIC[platform] },
      ads: {
        rows,
        note,
        metric: 'eu-reach',
        basis: 'Ranked by EU accounts reached — the only audience figure Meta publishes, for any country. Not a view count, and not comparable to YouTube views.'
      }
    };
  }

  throw new Error('Unknown platform. Use youtube, facebook or instagram.');
}

module.exports = { board, youtubeVideos, metaAds, compact, NO_ORGANIC, REGIONS };
