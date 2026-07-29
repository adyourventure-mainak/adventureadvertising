/* ============================================================
   Firebase — init + auth surface

   The apiKey below is meant to be public: a Firebase web config
   identifies the project, it does not authorise anything. Actual
   security comes from Authentication settings, Firestore/Storage
   rules and App Check. What DOES matter:
     · Authentication → Settings → Authorized domains must list
       every host you serve from (localhost is there by default).
     · Enable the providers you use under Authentication → Sign-in
       method, or every call below fails with auth/operation-not-allowed.
   ============================================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signOut,
  GoogleAuthProvider, signInWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getAnalytics, isSupported, logEvent }
  from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBeXPc1QwNESOLboIwT8MBtCV9qQ11orK8',
  authDomain: 'adventureadvertising-2011.firebaseapp.com',
  projectId: 'adventureadvertising-2011',
  storageBucket: 'adventureadvertising-2011.firebasestorage.app',
  messagingSenderId: '336060719548',
  appId: '1:336060719548:web:e4a8a1c0aa3c4545430bb9',
  measurementId: 'G-EQYDZ22HB9'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/* Analytics throws in unsupported contexts (file://, some privacy modes),
   so it is opt-in rather than assumed. */
let analytics = null;
isSupported().then(ok => { if (ok) analytics = getAnalytics(app); }).catch(() => {});
export const track = (name, params) => { try { if (analytics) logEvent(analytics, name, params); } catch {} };

/* Firebase error codes are not user-facing English. */
export function readableError(err) {
  const code = (err && err.code) || '';
  const map = {
    'auth/invalid-email': 'That email address is not valid.',
    'auth/missing-password': 'Enter a password.',
    'auth/weak-password': 'Passwords need at least six characters.',
    'auth/email-already-in-use': 'That email already has an account — try signing in instead.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email — create one below.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
    'auth/popup-closed-by-user': 'Sign-in window closed before finishing.',
    'auth/popup-blocked': 'Your browser blocked the popup. Allow popups and try again.',
    'auth/unauthorized-domain': 'This domain is not authorised in Firebase → Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed': 'That sign-in method is switched off in Firebase → Authentication → Sign-in method.',
    'auth/network-request-failed': 'No connection to Firebase. Check your network.'
  };
  return map[code] || (err && err.message) || 'Something went wrong. Try again.';
}

export const watchUser = cb => onAuthStateChanged(auth, cb);
export const signOutUser = () => signOut(auth);
export const signInGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const signInEmail = (email, pass) => signInWithEmailAndPassword(auth, email, pass);

export async function signUpEmail(email, pass, name) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name) await updateProfile(cred.user, { displayName: name });
  return cred;
}
