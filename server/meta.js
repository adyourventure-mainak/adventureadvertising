'use strict';
/* ────────────────────────────────────────────────────────────────
   Meta Ad Library API  (graph.facebook.com/<v>/ads_archive)

   Two things to know before trusting this data:

   1. Coverage is not global. In the EU/UK, the DSA obliges Meta to
      publish *every* ad, so ad_type=ALL returns commercial ads. In the
      US and most other markets the archive only holds ads about social
      issues, elections and politics — a search for a shampoo brand
      will legitimately come back empty.
   2. There are no view counts. The archive exposes reach and spend as
      ranges (and only for political ads, plus eu_total_reach in the
      EU). Nothing here can rank ads by views — that is what the
      YouTube side of this server is for.

   What it is genuinely good for: what a brand is running right now,
   in which countries, on which platforms, and with what copy.
   ──────────────────────────────────────────────────────────────── */

const GRAPH = 'https://graph.facebook.com';
const VERSION = process.env.META_API_VERSION || 'v23.0';
const TOKEN = () => process.env.META_ACCESS_TOKEN || '';

const DEFAULT_COUNTRIES = (process.env.META_COUNTRIES || 'IE,DE,FR,ES,IT,NL,SE,PL')
  .split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

const BASE_FIELDS = [
  'id', 'page_id', 'page_name',
  'ad_creation_time', 'ad_delivery_start_time', 'ad_delivery_stop_time',
  'ad_creative_bodies', 'ad_creative_link_titles', 'ad_creative_link_captions',
  'ad_snapshot_url', 'publisher_platforms', 'languages'
];
const EU_FIELDS = ['eu_total_reach', 'target_ages', 'target_gender'];
const POLITICAL_FIELDS = ['impressions', 'spend', 'currency'];

async function call(fields, params) {
  if (!TOKEN()) throw new Error('META_ACCESS_TOKEN is not set');
  const url = new URL(`${GRAPH}/${VERSION}/ads_archive`);
  url.searchParams.set('access_token', TOKEN());
  url.searchParams.set('fields', fields.join(','));
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = body?.error || {};
    /* Meta's wording for the commonest failures is unhelpfully generic —
       "Application does not have permission" covers everything from a dead
       token to an unfinished ID check. Say which one it actually is. */
    let text = `Meta ${e.code || res.status}: ${e.message || res.statusText}`;
    if (e.error_subcode === 2332002) {
      text = 'Waiting on Meta: the token is valid, but this account is not cleared for Ad Library access yet. ' +
             'Finish identity confirmation at facebook.com/ID — it takes 1–3 business days.';
    } else if (e.code === 190) {
      text = 'The Meta token has expired. Generate a new one in the Graph API Explorer and extend it to 60 days.';
    }
    const err = new Error(text);
    err.meta = e;
    throw err;
  }
  return body;
}

function normalise(row) {
  const first = a => (Array.isArray(a) && a.length ? a[0] : null);
  return {
    id: row.id,
    page: row.page_name || null,
    pageId: row.page_id || null,
    body: first(row.ad_creative_bodies),
    headline: first(row.ad_creative_link_titles),
    caption: first(row.ad_creative_link_captions),
    started: row.ad_delivery_start_time || row.ad_creation_time || null,
    stopped: row.ad_delivery_stop_time || null,
    running: !row.ad_delivery_stop_time,
    platforms: row.publisher_platforms || [],
    languages: row.languages || [],
    /* Ranges, never exact numbers — the archive does not publish exact figures. */
    euReach: row.eu_total_reach ?? null,
    impressions: row.impressions ? `${row.impressions.lower_bound}–${row.impressions.upper_bound ?? '∞'}` : null,
    spend: row.spend ? `${row.spend.lower_bound}–${row.spend.upper_bound ?? '∞'} ${row.currency || ''}`.trim() : null,
    snapshot: row.ad_snapshot_url || null
  };
}

/* One search. adType 'ALL' only returns commercial ads in EU/UK markets. */
async function search({ term, countries = DEFAULT_COUNTRIES, adType = 'ALL', limit = 12 }) {
  if (!term) throw new Error('A search term is required');

  const params = {
    search_terms: term,
    ad_reached_countries: JSON.stringify(countries),
    ad_type: adType,
    ad_active_status: 'ALL',
    limit: String(Math.min(Number(limit) || 12, 50))
  };

  const attempts = [
    [...BASE_FIELDS, ...EU_FIELDS, ...(adType === 'POLITICAL_AND_ISSUE_ADS' ? POLITICAL_FIELDS : [])],
    [...BASE_FIELDS, ...EU_FIELDS],
    BASE_FIELDS
  ];

  let lastErr;
  for (const fields of attempts) {
    try {
      const body = await call(fields, params);
      const ads = (body.data || []).map(normalise);
      return {
        term, countries, adType,
        count: ads.length,
        ads,
        note: ads.length
          ? null
          : 'No ads returned. Outside the EU/UK the archive only holds political and issue ads, so commercial brands come back empty by design.',
        source: `meta-ad-library-${VERSION}`
      };
    } catch (err) {
      /* Field permissions vary by ad_type and market — retry with fewer. */
      lastErr = err;
      if (!/field|permission|(#100)/i.test(err.message)) break;
    }
  }
  throw lastErr;
}

module.exports = { search, configured: () => !!TOKEN(), DEFAULT_COUNTRIES, VERSION };
