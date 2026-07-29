# Adventure Advertising

The internet's most-watched ads, broken into the beats that made them work, plus a
builder that rebuilds those structures around your own product.

```bash
npm start          # → http://localhost:8123
```

No dependencies. Node 18+ (uses built-in `fetch`). The site works with zero
configuration — the live data below is an enhancement layer, not a requirement.

---

## What "backend data" can and cannot mean here

This matters more than the code, so it is worth being blunt about it.

| Source | Public API? | Gives view counts? | What this app uses it for |
| --- | --- | --- | --- |
| **YouTube Data API v3** | Yes, free | **Yes — exact, live** | Ranking the library by real view counts |
| **Meta Ad Library API** | Yes, free (ID check required) | **No** | What a brand is running right now: creative, dates, platforms |
| **Google Ads Transparency Center** | **No** | No | Nothing — see below |

Three things people expect that do not exist:

1. **There is no "YouTube Ads Library" API.** Google's equivalent is the
   [Ads Transparency Center](https://adstransparency.google.com), which is a web UI
   with no public endpoint and no view counts. Scraping it breaks Google's terms, so
   this project does not. What it does instead: a curated seed list of the ad uploads
   themselves (`server/seeds.json`) hydrated with **live statistics from the YouTube
   Data API**, which is public and exact. An ad on a brand channel is just a video.
2. **The Meta Ad Library publishes no view counts.** By design. You get reach and
   spend as *ranges*, and only for political/issue ads (plus `eu_total_reach` in the
   EU). Nothing in it can rank ads by views.
3. **Meta's coverage is regional.** Under the DSA, every ad served in the **EU/UK** is
   in the archive, so `ad_type=ALL` returns commercial ads there. In the US and most
   other markets the archive holds **only** ads about social issues, elections and
   politics — searching for a shampoo brand in the US correctly returns nothing.

So: YouTube answers *"what did people actually watch"*, Meta answers *"what is being
pushed right now"*. Neither answers both, and the UI says so on the page.

---

## Setup

```bash
cp .env.example .env      # then fill in whichever keys you want
npm start
curl localhost:8123/api/health   # shows which providers are live
```

**YouTube key** (5 minutes): Google Cloud console → new project → enable *YouTube Data
API v3* → Credentials → API key. Free tier is 10,000 units/day; a full library refresh
costs ~1 unit, so the daily budget is effectively unlimited here.

**Meta token** (longer — ID confirmation can take a day): confirm your identity at
`facebook.com/ID`, create an app at developers.facebook.com, then generate a user token
with the `ads_read` scope in the Graph API Explorer and extend it to 60 days with the
[Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken).

---

## Routes

| Route | Notes |
| --- | --- |
| `GET /api/health` | Which providers are configured and what each one can give you |
| `GET /api/library` | Slug-keyed live YouTube stats for every seed. `?refresh=1` bypasses the cache |
| `GET /api/meta?term=Nike` | Meta Ad Library search. `&countries=IE,DE` `&adType=POLITICAL_AND_ISSUE_ADS` `&limit=12` |

Responses are cached to `server/.cache/` (15 min for the library, 1h for Meta searches). If
an upstream call fails and a stale copy exists, the stale copy is served rather than an
error — a rate limit should never blank the page.

## Video IDs and the verification gate

All 14 slugs were resolved and checked by hand on 2026-07-28. The result is worth
knowing before you touch `server/seeds.json`:

**7 have a surviving brand upload** and are pinned by id — Dumb Ways to Die, Purple,
Volvo Trucks, Old Spice, Squatty Potty, Dollar Shave Club, Blendtec. These carry exact
live counts and a live dot in the UI. Cost: 1 quota unit per refresh, total.

**7 do not.** Turkish Airlines, Always, Dove (English original), Nike, John Lewis,
Android and GEICO have all pruned these campaigns from their own channels — searching
inside each brand's channel returns nothing. Only third-party re-uploads survive, and
their counts are off by up to three orders of magnitude: the surviving #LikeAGirl
re-upload shows 114k against a campaign that genuinely did tens of millions.

So the server verifies rather than trusts. `officialChannel` on each seed must appear in
the resolved video's channel title, or the entry comes back `verified: false` and the
front end **keeps the editorial estimate** instead of publishing a wrong number. Those
seven also carry `"skipResolve": true`, which stops the resolver spending 100 units a
day hunting for a video that is not there.

**The site currently shows only the seven verifiable ads.** The switch is one line at the
top of `assets/app.js`:

```js
const VERIFIED_ONLY = true;   // false → all 14, seven of them on estimates
```

Nothing is deleted — all fourteen breakdowns stay in `assets/data.js`, and the filter
chips rebuild themselves from whatever is showing, so no empty categories appear.

If a brand re-uploads, set `videoId` and drop `skipResolve`:

```json
{ "id": "nike-dream-crazy", "videoId": "<from the URL>", "officialChannel": "Nike" }
```

Then `npm run refresh`. To re-resolve everything from scratch, delete
`server/.cache/`.

## Layout

```
index.html            page structure
assets/styles.css     tokens + layout
assets/data.js        the editorial layer: breakdowns, principles, formulas
assets/app.js         gallery, filters, detail panel, brief builder
assets/live.js        hydrates the page from /api/* — degrades silently if absent
server/server.js      static + API, no dependencies
server/youtube.js     YouTube Data API v3
server/meta.js        Meta Ad Library
server/seeds.json     one row per campaign; pin video IDs here
```

## Caveats worth keeping

- The bundled view counts in `assets/data.js` are rounded public estimates used as a
  fallback. Once a YouTube key is present they are replaced with exact live numbers and
  the card shows a live dot.
- Breakdowns describe structure, not assets. Copy the structure; never the film.
- `.env` and `server/.cache/` should stay out of version control.

## Sign-in (Firebase)

The site opens on an auth screen (`#gate` in `index.html`, logic in `assets/auth.js`).
Three ways in: Google popup, email + password, or **Browse without an account**.

Firebase config lives in `assets/firebase.js`. The `apiKey` there is *meant* to be
public — a web config identifies the project, it does not grant access. Real security
comes from Authentication settings, database rules and App Check.

**Before sign-in works, in the Firebase console:**

1. Authentication → Sign-in method → enable **Google** and **Email/Password**.
   Anonymous is deliberately not used — there is no guest path.
2. Authentication → Settings → Authorized domains → add every host you serve from.
   `localhost` is there by default.

Every reader signs in; there is no browse-without-an-account path. If auth never
answers within 2.5s the gate is shown anyway rather than a blank page, so a slow or
blocked Firebase leaves the sign-in screen usable rather than trapping the visitor. Firebase error codes are translated to plain English in
`readableError()`.

## The globe

`assets/globe.js` — cobe, loaded from `esm.sh` at runtime, no build step and no React.
It is the same component as the supplied React version with two deliberate changes:

- No framework wrapper. `cobe` is a canvas library; the React shell added nothing it needs.
- The per-marker floating labels used CSS Anchor Positioning (`position-anchor`,
  `anchor()`), which is Chromium-only and experimental — in every other browser those
  labels pile up in a corner. The live figures render as a legend beside the globe instead.

If the CDN is unreachable the canvas gets `.globe--failed` and a dashed placeholder; the
sign-in panel is unaffected.

## Realtime

Two independent live channels. Neither needs a page refresh.

**Presence — who is actually on the site** (`assets/presence.js`). Firestore, chosen over
the Realtime Database because the config has no `databaseURL` and Firestore needs only
`projectId`. Firestore has no `onDisconnect()`, so presence is a heartbeat: each client
refreshes its own `presence/{uid}` doc every 20s and readers ignore rows older than 60s,
so a closed tab ages out within a minute even when `pagehide` never fires — which it
often does not on mobile. Country comes from the browser's own locale, never an IP
lookup: no third-party geolocation call and nothing to disclose. It is coarse by design.

Every signed-in reader has a uid, so everyone on the site appears in the count. The
count is also visible on the sign-in screen itself, where the reader has no uid yet
and so is not counted.

**Consent log — who signed in and when** (`assets/users.js`). One document per user at
`users/{uid}`, written on every sign-in. `lastSeenAt` and `signIns` move each time;
`consentAt` is set once, on the first sign-in, and records when that person accepted the
notice on the gate. It is the only timestamp worth anything if you are ever asked what
someone agreed to, so the rules below refuse any write that changes it — a client cannot
backdate or refresh its own consent. Reads are restricted to the owner: nobody can
enumerate your users from the browser. Read the log in the Firebase console.

The gate tells readers exactly this — name, email, sign-in times. Keep that copy honest
if you ever store more.

Lock the rules down before going public — the default test mode lets anyone write:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /presence/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read:   if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null && request.auth.uid == uid
                    && request.resource.data.uid == uid
                    && request.resource.data.consentAt == request.time;
      allow update: if request.auth != null && request.auth.uid == uid
                    && request.resource.data.consentAt == resource.data.consentAt;
      allow delete: if false;
    }
  }
}
```

**View counts** (`assets/live.js`). Polls `/api/library` every 60s and updates counts,
the combined total and card order in place. Polling stops while the tab is hidden and
catches up on return, so a forgotten tab does not hammer the server. Server cache is
15 minutes — roughly 96 upstream calls a day against a 10,000-unit quota.

Presence works on static hosting (it is pure Firebase). The count polling does not —
that needs the Node server, so a static upload keeps the baked numbers.
