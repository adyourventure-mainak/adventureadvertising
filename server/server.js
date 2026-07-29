'use strict';
/* ────────────────────────────────────────────────────────────────
   Adventure Advertising server — static site + two live data routes.
   No dependencies: Node 18+ (fetch, node:*). Start with `npm start`.
   ──────────────────────────────────────────────────────────────── */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch { /* no .env — routes report unconfigured */ }

const cache = require('./cache');
const youtube = require('./youtube');
const meta = require('./meta');

const PORT = Number(process.env.PORT) || 8123;
const SEEDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'seeds.json'), 'utf8')).ads;

const TTL = {
  /* Short enough that the front end's polling actually sees movement;
     still ~96 upstream calls a day against a 10,000-unit quota. */
  library: Number(process.env.LIBRARY_TTL_MINUTES || 15) * 60_000,
  meta: Number(process.env.META_TTL_MINUTES || 60) * 60_000
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon'
};

const json = (res, code, payload) => {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store'
  });
  res.end(body);
};

/* ── routes ──────────────────────────────────────────────────── */

async function health(_req, res) {
  json(res, 200, {
    ok: true,
    providers: {
      youtube: {
        configured: youtube.configured(),
        gives: 'exact live view counts for the seeded ad uploads',
        env: 'YOUTUBE_API_KEY'
      },
      meta: {
        configured: meta.configured(),
        gives: 'currently-running ad creatives, platforms and delivery dates — no view counts',
        coverage: `ad_type=ALL is EU/UK only; elsewhere political and issue ads only. Default markets: ${meta.DEFAULT_COUNTRIES.join(', ')}`,
        env: 'META_ACCESS_TOKEN'
      },
      googleAdsTransparency: {
        configured: false,
        gives: 'nothing programmatically — no public API exists, and scraping it breaks Google\'s terms',
        env: null
      }
    },
    seeds: SEEDS.length,
    cacheDir: cache.DIR
  });
}

async function library(req, res, url) {
  if (!youtube.configured()) {
    return json(res, 200, {
      live: false,
      reason: 'YOUTUBE_API_KEY is not set — the page falls back to the bundled editorial estimates.',
      stats: {}
    });
  }
  const ttl = url.searchParams.get('refresh') ? 0 : TTL.library;
  try {
    const r = await cache.through('library', ttl, () => youtube.library(SEEDS));
    json(res, 200, {
      live: true,
      cached: r.cached,
      stale: !!r.stale,
      fetchedAt: new Date(r.savedAt).toISOString(),
      ttlMinutes: TTL.library / 60000,
      error: r.error || null,
      stats: r.data
    });
  } catch (err) {
    json(res, 502, { live: false, reason: err.message, stats: {} });
  }
}

async function metaSearch(req, res, url) {
  const term = (url.searchParams.get('term') || '').trim();
  if (!term) return json(res, 400, { error: 'Pass ?term=<brand or phrase>' });
  if (!meta.configured()) {
    return json(res, 200, {
      configured: false,
      reason: 'META_ACCESS_TOKEN is not set. See README for the 5-minute setup.',
      ads: []
    });
  }
  const countries = (url.searchParams.get('countries') || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const adType = url.searchParams.get('adType') === 'POLITICAL_AND_ISSUE_ADS' ? 'POLITICAL_AND_ISSUE_ADS' : 'ALL';
  const limit = url.searchParams.get('limit') || '12';
  const key = `meta_${term}_${(countries.length ? countries : meta.DEFAULT_COUNTRIES).join('-')}_${adType}_${limit}`;

  try {
    const r = await cache.through(key, TTL.meta, () =>
      meta.search({ term, countries: countries.length ? countries : undefined, adType, limit }));
    json(res, 200, { configured: true, cached: r.cached, fetchedAt: new Date(r.savedAt).toISOString(), ...r.data });
  } catch (err) {
    json(res, 502, { configured: true, error: err.message, ads: [] });
  }
}

/* ── static ──────────────────────────────────────────────────── */

/* The document root is the repo itself, so a denylist would have to grow
   every time a file is added. Allowlist instead: the page, its assets, and
   the handful of files a browser asks for by convention. Anything else —
   package.json, README, scripts/, the git checkout — is not web content. */
const PUBLIC_FILES = new Set(['/index.html', '/favicon.ico', '/robots.txt', '/sitemap.xml']);
const servable = rel => PUBLIC_FILES.has(rel) || rel.startsWith('/assets/');

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);

  /* Path traversal and dotfiles first: .env sits in the project root, and
     `..` could otherwise climb out of it entirely. */
  const hidden = rel.split('/').some(seg => seg.startsWith('.'));
  if (!file.startsWith(ROOT) || hidden || !servable(rel)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

/* ── wiring ──────────────────────────────────────────────────── */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname === '/api/health') return await health(req, res);
    if (url.pathname === '/api/library') return await library(req, res, url);
    if (url.pathname === '/api/meta') return await metaSearch(req, res, url);
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'No such route' });
    return serveStatic(req, res, url);
  } catch (err) {
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  const flag = (on, name) => `${on ? '●' : '○'} ${name}${on ? '' : ' (not configured)'}`;
  console.log(`Adventure Advertising  →  http://localhost:${PORT}`);
  console.log(`  ${flag(youtube.configured(), 'YouTube Data API v3 — live view counts')}`);
  console.log(`  ${flag(meta.configured(), 'Meta Ad Library — live running creatives')}`);
  if (!youtube.configured() || !meta.configured()) {
    console.log('  Copy .env.example to .env and add keys; the site works either way.');
  }
});
