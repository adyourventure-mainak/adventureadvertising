/* ============================================================
   Watchlist persistence — Firestore, per user

   Kept separate from watch.js so the watchlist UI works with no
   Firebase at all: watch.js falls back to localStorage and never
   knows the difference. This module only upgrades that to
   cross-device when someone is signed in.

   Rules needed (add alongside the users/ and presence/ blocks):

     match /watchlists/{uid} {
       allow read, write: if request.auth != null && request.auth.uid == uid;
     }
   ============================================================ */

import { app, auth } from './firebase.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

let db = null;
try { db = getFirestore(app); } catch { /* Firestore not enabled */ }

const ref = () => {
  const uid = auth.currentUser?.uid;
  return (db && uid) ? doc(db, 'watchlists', uid) : null;
};

window.AAWatchStore = {
  async read() {
    const r = ref();
    if (!r) return null;
    const snap = await getDoc(r);
    return snap.exists() ? (snap.data().brands || []) : null;
  },

  async write(brands) {
    const r = ref();
    if (!r) return false;
    /* Capped: a watchlist is a shortlist. Someone pasting three hundred
       brand names would quietly turn every daily check into a quota
       incident for everyone else. */
    await setDoc(r, {
      brands: (brands || []).slice(0, 25).map(String),
      updatedAt: serverTimestamp()
    });
    return true;
  }
};

/* The list is read before sign-in resolves, so re-read once we have a
   user — otherwise a signed-in reader sees their local copy only. */
auth.onAuthStateChanged?.(() => { window.AAWatch?.reload?.(); });
