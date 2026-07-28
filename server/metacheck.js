'use strict';
/* One-command diagnosis of a Meta Ad Library token.
   Meta's errors are terse and all look alike; this maps them to the actual fix.
   Run: npm run meta:check                                                     */

const path = require('node:path');
const ROOT = path.join(__dirname, '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch { /* no .env */ }

const TOKEN = process.env.META_ACCESS_TOKEN || '';
const VERSION = process.env.META_API_VERSION || 'v23.0';

const say = (icon, msg) => console.log(`${icon}  ${msg}`);

/* Meta reuses a handful of codes for very different problems. */
function diagnose(err) {
  const code = err.code;
  const msg = (err.message || '').toLowerCase();

  /* The signature Ad Library rejection: token and scopes are fine, but the
     account has not been cleared for archive access. */
  if (err.error_subcode === 2332002)
    return ['Your token is fine — the account is not cleared for Ad Library access yet.',
            'This is the identity-confirmation gate, not an app or scope problem. Complete it at facebook.com/ID (the flow linked from facebook.com/ads/library/api) and wait 1-3 business days. Nothing in the app settings will change this.'];

  if (/confirm your identity|identity confirmation|not been confirmed/.test(msg))
    return ['Identity confirmation is incomplete or still pending.',
            'Go to facebook.com/ID, upload a government ID and confirm your location. Takes 1-3 business days. Nothing else will work until this clears.'];

  if (code === 190)
    return ['The token is invalid or has expired.',
            'Tokens from the Graph API Explorer last about an hour. Generate a new one, then extend it to 60 days at developers.facebook.com/tools/debug/accesstoken.'];

  if (code === 10 || code === 200 || code === 3)
    return ['The token is valid but lacks permission for the ad archive.',
            'Two usual causes: (1) the token was generated without the ads_read scope — regenerate it in the Graph API Explorer with ads_read ticked; (2) identity confirmation has not cleared yet.'];

  if (code === 100)
    return ['A parameter was rejected.',
            'Usually ad_reached_countries or a field that is not available for this ad_type. Commercial ads (ad_type=ALL) only return results for EU/UK markets.'];

  if (code === 4 || code === 17 || code === 613)
    return ['Rate limited.', 'Wait a few minutes and try again. The server caches results for an hour to avoid this.'];

  return [`Meta error ${code}: ${err.message}`, 'Check the token and the app use case, then retry.'];
}

(async () => {
  console.log(`\nMeta Ad Library check  (${VERSION})\n${'-'.repeat(52)}`);

  if (!TOKEN) {
    say('✗', 'META_ACCESS_TOKEN is not set in .env');
    say(' ', 'Add it, then run this again. See README for how to get one.');
    process.exit(1);
  }
  say('•', `Token present (${TOKEN.length} chars)`);

  /* 1. is the token itself alive, and what scopes does it carry? */
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSION}/me/permissions?access_token=${TOKEN}`);
    const j = await r.json();
    if (j.error) throw j.error;
    const granted = (j.data || []).filter(p => p.status === 'granted').map(p => p.permission);
    say('✓', 'Token is live');
    say(granted.includes('ads_read') ? '✓' : '✗',
      `Scopes: ${granted.join(', ') || '(none)'}`);
    if (!granted.includes('ads_read')) {
      say(' ', 'ads_read is missing — regenerate the token in the Graph API Explorer with ads_read ticked.');
    }
  } catch (e) {
    const [what, fix] = diagnose(e);
    say('✗', what); say(' ', fix);
    process.exit(1);
  }

  /* 2. the call the site actually makes */
  const url = new URL(`https://graph.facebook.com/${VERSION}/ads_archive`);
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('search_terms', 'nike');
  url.searchParams.set('ad_reached_countries', JSON.stringify(['IE']));
  url.searchParams.set('ad_type', 'ALL');
  url.searchParams.set('fields', 'id,page_name,ad_delivery_start_time');
  url.searchParams.set('limit', '3');

  try {
    const r = await fetch(url);
    const j = await r.json();
    if (j.error) throw j.error;
    const n = (j.data || []).length;
    say('✓', `ads_archive responded — ${n} ad${n === 1 ? '' : 's'} for "nike" in Ireland`);
    if (n) say(' ', `e.g. ${j.data[0].page_name} — started ${j.data[0].ad_delivery_start_time || 'unknown'}`);
    else say(' ', 'Empty is not a failure: try another brand, or a different EU market.');
    console.log('\nReady. Restart the server and the lookup section goes live.\n');
  } catch (e) {
    const [what, fix] = diagnose(e);
    say('✗', what); say(' ', fix);
    process.exit(1);
  }
})();
