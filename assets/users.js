/* ============================================================
   Consent log — who signed in, and when they accepted the notice

   One document per user at users/{uid}. Written on every sign-in,
   but consentAt is set once and never moves: it records the first
   time this person accepted the data notice on the gate, which is
   the only timestamp with any meaning if you are ever asked what
   someone agreed to. lastSeenAt moves; consentAt does not, and the
   security rules refuse any write that tries to change it.

   Deliberately not an approval gate. Nobody waits on a review —
   this records, it does not admit.
   ============================================================ */

import { app, auth } from './firebase.js';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  serverTimestamp, increment
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

let db = null;
try { db = getFirestore(app); } catch { /* Firestore not enabled on the project */ }

/* 'google.com' | 'password' — how they got in, not which account. */
function provider(user) {
  return user.providerData?.[0]?.providerId || 'unknown';
}

/* Sign-in must never fail because the log did. Every path resolves. */
export async function record() {
  if (!db) return false;
  const user = auth.currentUser;
  if (!user) return false;

  const ref = doc(db, 'users', user.uid);
  const profile = {
    uid: user.uid,
    name: user.displayName || null,
    email: user.email || null,
    provider: provider(user)
  };

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      /* Name or email can change upstream; consentAt cannot. */
      await updateDoc(ref, { ...profile, lastSeenAt: serverTimestamp(), signIns: increment(1) });
    } else {
      await setDoc(ref, {
        ...profile,
        consentAt: serverTimestamp(),   /* the moment that matters */
        lastSeenAt: serverTimestamp(),
        signIns: 1
      });
    }
    return true;
  } catch {
    return false;                       /* rules not published yet, or offline */
  }
}

export const available = () => !!db;
