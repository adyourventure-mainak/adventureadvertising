'use strict';
/* Tiny cache. Both upstream APIs are quota-limited, so nothing is fetched
   twice inside its TTL.

   Disk by default (server/.cache/, or CACHE_DIR). Some hosts give you a
   read-only filesystem, so a failed write must never take the site down:
   we fall back to an in-process Map, which is lost on restart but costs
   only one extra upstream call to rebuild. */

const fs = require('node:fs');
const path = require('node:path');

const DIR = process.env.CACHE_DIR || path.join(__dirname, '.cache');

let onDisk = true;
try {
  fs.mkdirSync(DIR, { recursive: true });
  fs.accessSync(DIR, fs.constants.W_OK);
} catch {
  onDisk = false;
  console.warn(`  cache: ${DIR} is not writable — using memory instead.`);
}

const mem = new Map();
const file = key => path.join(DIR, key.replace(/[^a-z0-9_-]/gi, '_') + '.json');

function read(key, ttlMs) {
  let raw;
  try {
    raw = onDisk ? JSON.parse(fs.readFileSync(file(key), 'utf8')) : mem.get(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  const stale = ttlMs != null && Date.now() - raw.savedAt > ttlMs;
  return { value: raw.value, stale, savedAt: raw.savedAt };
}

function write(key, value) {
  const raw = { savedAt: Date.now(), value };
  if (onDisk) {
    try {
      fs.writeFileSync(file(key), JSON.stringify(raw, null, 2));
      return value;
    } catch {
      onDisk = false;   /* went read-only under us — carry on in memory */
    }
  }
  mem.set(key, raw);
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
