/* ============================================================
   Live presence — who is actually on the site right now

   Firestore, not the Realtime Database: your Firebase config has no
   databaseURL, and Firestore needs nothing beyond projectId.

   Firestore has no onDisconnect(), so presence is a heartbeat: each
   client refreshes its own doc every 20s, and readers ignore anything
   older than 60s. A closed tab therefore ages out within a minute even
   if the beforeunload delete never fires (it often does not on mobile).

   Country comes from the browser's own locale, never an IP lookup —
   no third-party geolocation call, nothing to disclose, and it costs
   nothing. It is coarse by design: a rough region, not a location.
   ============================================================ */

import { app, auth } from './firebase.js';
import {
  getFirestore, doc, setDoc, deleteDoc, collection,
  onSnapshot, query, where, Timestamp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const STALE_MS = 60_000;
const BEAT_MS = 20_000;

let db = null;
try { db = getFirestore(app); } catch { /* Firestore not enabled on the project */ }

/* ── where the reader is, roughly ────────────────────────── */
function region() {
  try {
    const tag = navigator.languages?.[0] || navigator.language || '';
    let code = new Intl.Locale(tag).region;

    if (!code) {
      /* Locales like plain "en" carry no region; fall back to the time
         zone, which at least separates continents. */
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const guess = { 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Europe/London': 'GB', 'America/New_York': 'US', 'America/Los_Angeles': 'US', 'Australia/Sydney': 'AU', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Asia/Tokyo': 'JP' };
      code = guess[tz] || '';
    }
    if (!code) return { code: 'ZZ', name: 'Unknown' };

    const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
    return { code, name };
  } catch {
    return { code: 'ZZ', name: 'Unknown' };
  }
}

/* ── publish: keep my own row warm ───────────────────────── */
let beat = null;
let myRef = null;

export async function join() {
  if (!db) return false;
  const uid = auth.currentUser?.uid;
  if (!uid) return false;              /* not signed in yet — read-only */

  const { code, name } = region();
  myRef = doc(db, 'presence', uid);

  const write = () => setDoc(myRef, {
    country: name, countryCode: code, at: Timestamp.now()
  }).catch(() => {});

  await write();
  clearInterval(beat);
  beat = setInterval(write, BEAT_MS);

  /* Best effort — mobile browsers frequently skip this, which is why
     the staleness window exists. */
  addEventListener('pagehide', () => { if (myRef) deleteDoc(myRef).catch(() => {}); });
  return true;
}

export function leave() {
  clearInterval(beat);
  beat = null;
  if (myRef) { deleteDoc(myRef).catch(() => {}); myRef = null; }
}

/* ── subscribe: everyone currently here ──────────────────── */
export function watch(cb) {
  if (!db) { cb(null); return () => {}; }

  const cutoff = () => Timestamp.fromMillis(Date.now() - STALE_MS);
  let stop = () => {};

  try {
    stop = onSnapshot(
      query(collection(db, 'presence'), where('at', '>', cutoff())),
      snap => {
        const byCountry = new Map();
        snap.forEach(d => {
          const v = d.data();
          if (!v.at || Date.now() - v.at.toMillis() > STALE_MS) return;
          byCountry.set(v.country, (byCountry.get(v.country) || 0) + 1);
        });
        cb({
          total: [...byCountry.values()].reduce((a, b) => a + b, 0),
          countries: [...byCountry.entries()]
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
        });
      },
      () => cb(null)                  /* rules not set, or offline */
    );
  } catch { cb(null); }

  return () => { try { stop(); } catch {} };
}

export const available = () => !!db;
