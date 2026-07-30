/* ============================================================
   Admin dashboard — who has signed up, what they watch

   Client-side on purpose. The server-side alternative needs a
   service-account key and the firebase-admin package; this project
   has zero dependencies and no secret store beyond env vars, and
   adding a private key to a shared host to render a table of names
   is a poor trade.

   Security is therefore the Firestore rules, not this file. Hiding
   the page would be theatre — anyone can read the JavaScript. What
   actually protects the data is that the database refuses to answer
   unless request.auth.uid is on the admin list, so a curious visitor
   loading /admin.html gets an empty screen and a permission error.
   ============================================================ */

import { app, auth } from './firebase.js';
import { getFirestore, collection, getDocs, query, orderBy, limit }
  from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let db = null;
try { db = getFirestore(app); } catch {}

const fmtDate = ts => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return isNaN(d) ? '—' : d.toLocaleString(undefined,
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function table(el, headers, rows) {
  el.innerHTML =
    `<thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>` +
    `<tbody>${rows.length
      ? rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${headers.length}">Nothing yet.</td></tr>`}</tbody>`;
}

async function load() {
  const users = [];
  const watch = [];

  const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('consentAt', 'desc'), limit(500)));
  usersSnap.forEach(d => users.push({ id: d.id, ...d.data() }));

  try {
    const wSnap = await getDocs(query(collection(db, 'watchlists'), limit(500)));
    wSnap.forEach(d => watch.push({ id: d.id, ...d.data() }));
  } catch { /* rules may allow users but not watchlists — show what we can */ }

  /* Headline numbers. "Subscribers" is deliberately not claimed here:
     nobody is paying yet, so every account is a free beta user, and a
     dashboard that called them subscribers would be flattering itself. */
  const now = Date.now();
  const active7 = users.filter(u => u.lastSeenAt?.toDate && (now - u.lastSeenAt.toDate()) < 7 * 864e5).length;
  const google = users.filter(u => u.provider === 'google.com').length;
  const returning = users.filter(u => (u.signIns || 0) > 1).length;

  $('#adminStats').innerHTML = [
    ['Accounts', users.length, 'free beta — no paid plans yet'],
    ['Active this week', active7, 'signed in within 7 days'],
    ['Returning', returning, 'more than one sign-in'],
    ['Watchlists', watch.length, 'people monitoring competitors']
  ].map(([label, n, sub]) => `<div class="stat">
      <b>${n}</b><span>${esc(label)}</span><em>${esc(sub)}</em>
    </div>`).join('');

  $('#usersNote').textContent =
    `${google} signed in with Google, ${users.length - google} with email. `
    + 'Sorted by when they first accepted the notice.';

  table($('#usersTable'),
    ['Name', 'Email', 'Method', 'Consented', 'Last seen', 'Sign-ins'],
    users.map(u => [
      esc(u.name || '—'),
      esc(u.email || '—'),
      u.provider === 'google.com' ? 'Google' : 'Email',
      esc(fmtDate(u.consentAt)),
      esc(fmtDate(u.lastSeenAt)),
      String(u.signIns ?? 1)
    ]));

  /* Aggregate: which brands are watched most, across everyone. */
  const tally = new Map();
  watch.forEach(w => (w.brands || []).forEach(b => tally.set(b, (tally.get(b) || 0) + 1)));
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);

  table($('#watchTable'),
    ['Brand', 'Watched by'],
    ranked.map(([brand, n]) => [esc(brand), `${n} ${n === 1 ? 'person' : 'people'}`]));
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    $('#adminWho').textContent = 'Not signed in.';
    $('#adminGateMsg').textContent = 'Sign in on the main site first, then come back here.';
    $('#adminGate').hidden = false;
    return;
  }

  $('#adminWho').innerHTML = `Signed in as <b>${esc(user.email || user.displayName || user.uid)}</b>`
    + ` · your UID is <code>${esc(user.uid)}</code>`;

  try {
    await load();
    $('#adminBody').hidden = false;
  } catch (err) {
    /* The expected failure: rules deny a non-admin. Say what to do
       about it, including the UID they need to paste. */
    $('#adminGateMsg').innerHTML = /permission/i.test(err.message)
      ? `Firestore refused the read, which means this account is not on the admin list. `
        + `Add your UID above to the rules — see README, "Admin dashboard".`
      : esc(err.message);
    $('#adminGate').hidden = false;
  }
});
