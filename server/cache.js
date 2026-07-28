'use strict';
/* Tiny disk cache. Both upstream APIs are quota-limited, so nothing is
   fetched twice inside its TTL. Files land in server/.cache/. */

const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '.cache');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const file = key => path.join(DIR, key.replace(/[^a-z0-9_-]/gi, '_') + '.json');

function read(key, ttlMs) {
  try {
    const raw = JSON.parse(fs.readFileSync(file(key), 'utf8'));
    const age = Date.now() - raw.savedAt;
    if (ttlMs != null && age > ttlMs) return { value: raw.value, stale: true, savedAt: raw.savedAt };
    return { value: raw.value, stale: false, savedAt: raw.savedAt };
  } catch {
    return null;
  }
}

function write(key, value) {
  fs.writeFileSync(file(key), JSON.stringify({ savedAt: Date.now(), value }, null, 2));
  return value;
}

/* Serve fresh from cache; otherwise fetch. If the fetch fails but we hold a
   stale copy, return the stale copy rather than an error — a rate-limited
   upstream should never blank the page. */
async function through(key, ttlMs, producer) {
  const hit = read(key, ttlMs);
  if (hit && !hit.stale) return { data: hit.value, cached: true, savedAt: hit.savedAt };
  try {
    const value = await producer();
    write(key, value);
    return { data: value, cached: false, savedAt: Date.now() };
  } catch (err) {
    if (hit) return { data: hit.value, cached: true, stale: true, savedAt: hit.savedAt, error: err.message };
    throw err;
  }
}

module.exports = { read, write, through, DIR };
