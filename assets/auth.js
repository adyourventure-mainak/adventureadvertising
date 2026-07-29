/* ============================================================
   Sign-in gate

   Holds the site behind an auth screen. There is no guest path:
   every reader signs in with Google or an email address, so the
   presence count and any per-user state always have a real uid.
   ============================================================ */

import {
  watchUser, signOutUser, signInGoogle,
  signInEmail, signUpEmail, readableError, track
} from './firebase.js';
import { mountGlobe, loadOrigins, byCountry, compact, FALLBACK } from './globe.js';
import { join as joinPresence, leave as leavePresence, watch as watchPresence } from './presence.js';
import { record as recordUser } from './users.js';

const $ = s => document.querySelector(s);
const gate = $('#gate');
const errorBox = $('#gateError');

let mode = 'signin';            /* signin | signup */
let globe = null;

/* ── open / close ─────────────────────────────────────────── */

function showApp(user) {
  document.body.classList.remove('is-gated');
  gate.hidden = true;
  if (globe) { globe.destroy(); globe = null; }
  /* The page was display:none while gated, so the scroll observer never
     saw anything. Reveal now rather than leaving blank sections. */
  window.AdVault?.revealAll?.();

  recordUser();        /* log the sign-in and, first time, the consent */
  joinPresence();      /* announce myself */
  startPresence();     /* and watch everyone else, live */

  $('#accountWho').textContent =
    user.displayName || (user.email || '').split('@')[0] || 'Signed in';
  $('#account').hidden = false;
}

function showGate() {
  document.body.classList.add('is-gated');
  gate.hidden = false;
  $('#account').hidden = true;
  if (!globe) startGlobe();
  startPresence();     /* the count is visible on the gate too */
  requestAnimationFrame(() => $('#gGoogle')?.focus());
}

function fail(err) {
  errorBox.textContent = readableError(err);
  errorBox.hidden = false;
}
const clearError = () => { errorBox.hidden = true; };

function busy(btn, on, label) {
  btn.disabled = on;
  if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || 'One moment…'; }
  else if (btn.dataset.label) { btn.textContent = btn.dataset.label; }
}

/* ── the globe panel ──────────────────────────────────────── */

function paintLegend(rows) {
  $('#globeLegend').innerHTML = byCountry(rows)
    .map(c => `<li>
        <span>${c.country}<em>${c.count} campaign${c.count === 1 ? '' : 's'}</em></span>
        <b>${compact(c.views)}</b>
      </li>`)
    .join('');
}

async function startGlobe() {
  paintLegend(FALLBACK);                       /* paint immediately */
  const rows = await loadOrigins();            /* then swap in live counts */
  paintLegend(rows);
  globe = await mountGlobe($('#globeCanvas'), { rows });
}

/* ── live presence ────────────────────────────────────────
   One subscription for the whole session; it renders into the
   gate panel and the nav chip, whichever is on screen. */
let unwatch = null;

function paintPresence(state) {
  const gateBox = $('#liveNow'), navBox = $('#navLive');

  /* null = Firestore is off or the rules reject reads. Say nothing
     rather than showing a fake zero. */
  if (!state || !state.total) {
    gateBox.hidden = true;
    navBox.hidden = true;
    return;
  }

  $('#liveCount').textContent = state.total;
  $('#liveWord').textContent = state.total === 1 ? 'person reading now' : 'reading now';
  $('#liveWhere').textContent = state.countries.length
    ? state.countries.slice(0, 3).map(c => `${c.country} ${c.count}`).join(' · ')
    : '';
  $('#navLiveCount').textContent = state.total;
  gateBox.hidden = false;
  navBox.hidden = false;
}

function startPresence() {
  if (unwatch) return;
  unwatch = watchPresence(paintPresence);
}

/* ── providers ────────────────────────────────────────────── */

$('#gGoogle').addEventListener('click', async e => {
  clearError();
  busy(e.currentTarget, true, 'Opening Google…');
  try {
    await signInGoogle();
    track('login', { method: 'google' });
  } catch (err) {
    fail(err);
  } finally {
    busy(e.currentTarget, false);
  }
});

/* ── email form ───────────────────────────────────────────── */

function setMode(next) {
  mode = next;
  const signup = mode === 'signup';
  $('#fName').hidden = !signup;
  $('#gSubmit').textContent = signup ? 'Create account' : 'Sign in';
  $('#gToggle').textContent = signup
    ? 'Already have an account? Sign in'
    : 'New here? Create an account';
  $('#gPass').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
  clearError();
}

$('#gEmailStart').addEventListener('click', () => {
  $('#gateChoose').hidden = true;
  $('#gateForm').hidden = false;
  setMode('signin');
  $('#gEmail').focus();
});

$('#gBack').addEventListener('click', () => {
  $('#gateForm').hidden = true;
  $('#gateChoose').hidden = false;
  clearError();
});

$('#gToggle').addEventListener('click', () => setMode(mode === 'signin' ? 'signup' : 'signin'));

async function submit(e) {
  clearError();
  const email = $('#gEmail').value.trim();
  const pass = $('#gPass').value;
  const name = $('#gName').value.trim();

  if (!email) return fail({ code: 'auth/invalid-email' });
  if (!pass) return fail({ code: 'auth/missing-password' });

  const btn = $('#gSubmit');
  busy(btn, true);
  try {
    if (mode === 'signup') {
      await signUpEmail(email, pass, name);
      track('sign_up', { method: 'password' });
    } else {
      await signInEmail(email, pass);
      track('login', { method: 'password' });
    }
  } catch (err) {
    fail(err);
  } finally {
    busy(btn, false);
  }
}

$('#gSubmit').addEventListener('click', submit);
['#gEmail', '#gPass', '#gName'].forEach(sel =>
  $(sel).addEventListener('keydown', e => { if (e.key === 'Enter') submit(e); }));

/* ── sign out ─────────────────────────────────────────────── */

$('#signOut').addEventListener('click', async () => {
  leavePresence();
  try { await signOutUser(); } catch {}
  showGate();
});

/* ── boot ─────────────────────────────────────────────────── */

document.body.classList.add('is-gated');

let settled = false;
watchUser(user => {
  settled = true;
  user ? showApp(user) : showGate();
});

/* If Firebase never answers — offline, blocked, misconfigured — do not
   leave a blank page. Show the gate so the reader can retry sign-in. */
setTimeout(() => { if (!settled) showGate(); }, 2500);
