/* ============================================================
   Sign-in gate

   Holds the site behind an auth screen, but never traps anyone:
   if Firebase is unreachable or a provider is switched off, the
   guest path still opens the library. A study tool that will not
   load because a popup was blocked is a broken study tool.
   ============================================================ */

import {
  watchUser, signOutUser, signInGoogle, signInGuest,
  signInEmail, signUpEmail, readableError, track
} from './firebase.js';
import { mountGlobe, loadOrigins, byCountry, compact, FALLBACK } from './globe.js';

const $ = s => document.querySelector(s);
const gate = $('#gate');
const errorBox = $('#gateError');
const GUEST_KEY = 'aa:guest';

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

  const acct = $('#account');
  const who = $('#accountWho');
  if (user) {
    const label = user.isAnonymous
      ? 'Guest'
      : (user.displayName || (user.email || '').split('@')[0] || 'Signed in');
    who.textContent = label;
    acct.hidden = false;
  } else {
    who.textContent = 'Guest';
    acct.hidden = false;
  }
}

function showGate() {
  document.body.classList.add('is-gated');
  gate.hidden = false;
  $('#account').hidden = true;
  if (!globe) startGlobe();
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

$('#gGuest').addEventListener('click', async e => {
  clearError();
  busy(e.currentTarget, true, 'Opening the library…');
  try {
    await signInGuest();
    track('login', { method: 'anonymous' });
  } catch (err) {
    /* Anonymous auth is off in the console, or Firebase is unreachable.
       Guest access is not worth blocking on either. */
    try { sessionStorage.setItem(GUEST_KEY, '1'); } catch {}
    showApp(null);
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
  try { sessionStorage.removeItem(GUEST_KEY); } catch {}
  try { await signOutUser(); } catch {}
  showGate();
});

/* ── boot ─────────────────────────────────────────────────── */

document.body.classList.add('is-gated');

let settled = false;
watchUser(user => {
  settled = true;
  if (user) showApp(user);
  else {
    let guest = false;
    try { guest = sessionStorage.getItem(GUEST_KEY) === '1'; } catch {}
    guest ? showApp(null) : showGate();
  }
});

/* If Firebase never answers — offline, blocked, misconfigured — do not
   leave a blank page. Show the gate; the guest button still works. */
setTimeout(() => { if (!settled) showGate(); }, 2500);
