'use strict';
/* ────────────────────────────────────────────────────────────────
   Candidate finder — high-view ad uploads that still live on the
   brand's own channel.

   Nothing here writes to seeds.json. It proposes; you approve. Each
   candidate is printed with its exact live view count, the channel it
   actually sits on, and whether that channel looks like the brand
   rather than a fan re-upload — which is the whole problem this
   project keeps running into.

   Cost: search.list is 100 units per query against a 10,000/day
   budget, then one videos.list (1 unit) per 50 results. Roughly 100
   units per term, so ~90 terms a day would be the ceiling.

       node scripts/find-ads.js "nike ad" "super bowl commercial 2026"
   ──────────────────────────────────────────────────────────────── */

const path = require('node:path');
const ROOT = path.join(__dirname, '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch { /* keyless run fails loudly below */ }

const API = 'https://www.googleapis.com/youtube/v3';
const KEY = process.env.YOUTUBE_API_KEY || '';

/* Channels that re-upload other people's ads. A count from one of these
   is a fraction of the campaign's real reach, which is exactly the trap
   that made seven of the original fourteen unusable. */
const RE_UPLOADER = /fan|archive|classic|best of|compilation|collection|tv ?ads?|commercials?( ?world| ?tv)?|adverts?|vintage/i;

async function call(endpoint, params) {
  if (!KEY) throw new Error('YOUTUBE_API_KEY is not set — add it to .env');
  const url = new URL(API + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('key', KEY);
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`YouTube ${body?.error?.errors?.[0]?.reason || res.status}: ${body?.error?.message || res.statusText}`);
  return body;
}

const compact = n =>
  n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' :
    n >= 1e6 ? Math.round(n / 1e6) + 'M' :
      n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n);

async function search(term, max = 50) {
  const r = await call('/search', {
    part: 'snippet', q: term, type: 'video', maxResults: String(max),
    order: 'viewCount', videoEmbeddable: 'true'
  });
  return (r.items || []).map(i => i.id.videoId).filter(Boolean);
}

async function hydrate(ids) {
  if (!ids.length) return [];
  const r = await call('/videos', { part: 'snippet,statistics,contentDetails', id: ids.join(',') });
  return (r.items || []).map(v => ({
    id: v.id,
    title: v.snippet.title,
    channel: v.snippet.channelTitle,
    published: v.snippet.publishedAt.slice(0, 10),
    views: Number(v.statistics.viewCount || 0),
    likes: Number(v.statistics.likeCount || 0),
    duration: v.contentDetails.duration
  }));
}

/* An ad is short. Anything past ~5 minutes is a compilation or a
   making-of, not the spot itself. */
const seconds = iso => {
  const m = /PT(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '') || [];
  return (Number(m[1] || 0) * 60) + Number(m[2] || 0);
};

(async () => {
  const terms = process.argv.slice(2);
  if (!terms.length) {
    console.log('Usage: node scripts/find-ads.js "<term>" ["<term>" …]');
    process.exit(1);
  }

  const seen = new Set();
  const rows = [];

  for (const term of terms) {
    process.stderr.write(`searching "${term}"…\n`);
    let ids;
    try { ids = await search(term); } catch (e) { console.error('  ' + e.message); continue; }
    const vids = await hydrate(ids.filter(id => !seen.has(id) && seen.add(id)));
    for (const v of vids) {
      const secs = seconds(v.duration);
      if (v.views < 1e6) continue;                 /* "maximum viewed" means millions */
      if (secs && (secs < 5 || secs > 300)) continue;
      rows.push({ ...v, secs, term, suspect: RE_UPLOADER.test(v.channel) });
    }
  }

  rows.sort((a, b) => b.views - a.views);

  console.log('\n' + '='.repeat(112));
  console.log('CANDIDATES — sorted by live view count. "?" = channel name looks like a re-uploader, verify before pinning.');
  console.log('='.repeat(112));
  console.log('     views    likes   len  published   channel                    title');
  for (const r of rows.slice(0, 40)) {
    console.log(
      `${r.suspect ? ' ? ' : '   '}` +
      `${compact(r.views).padStart(6)} ${compact(r.likes).padStart(7)}  ${String(r.secs).padStart(3)}s  ` +
      `${r.published}  ${r.channel.slice(0, 24).padEnd(24)}  ${r.title.slice(0, 44)}`
    );
    console.log(`        https://www.youtube.com/watch?v=${r.id}`);
  }
  console.log(`\n${rows.length} candidates over 1M views. Quota spent: ~${terms.length * 100} units of 10,000/day.`);
})();
