# Deploying to adventureadvertising.in

Upload the contents of **`dist/`** — nothing else. 156 KB, 8 files.

```
dist/
  index.html
  assets/  (app.js, auth.js, data.js, firebase.js, globe.js, live.js, styles.css)
```

Rebuild it any time with:

```bash
rm -rf dist && mkdir dist && cp index.html dist/ && cp -r assets dist/
```

---

## Never upload these

| Path | Why |
| --- | --- |
| `.env` | Holds your live YouTube key and Meta token. Apache/nginx/cPanel will serve `yoursite.com/.env` to anyone who asks. The Node server blocks dotfiles; a static host does not. |
| `server/` | Backend code, useless on static hosting, and `seeds.json` exposes internals for no benefit. |
| `.claude/`, `package.json`, `README.md`, `DEPLOY.md` | Not needed by the browser. |

The one key that *is* in `dist` is the Firebase `apiKey` in `assets/firebase.js`. That
one is public by design — it identifies the project, it does not authorise anything.

---

## Steps

### 1. Point the domain at hosting

As of the last check the domain has nameservers at `managedns1/2.wonderwebhub.com`
but **no A record**, so nothing is served yet. In the WonderWebHub panel, either
provision the hosting account for this domain or add an A record pointing at your
server's IP. Give it up to a few hours to propagate. Check with:

```bash
dig +short A adventureadvertising.in
```

### 2. Upload

cPanel → File Manager (or SFTP) → put the **contents** of `dist/` into `public_html/`,
so that `public_html/index.html` and `public_html/assets/` exist. Do not upload the
`dist` folder itself, or the site will land at `/dist/`.

### 3. Turn on HTTPS — required, not optional

cPanel → SSL/TLS Status → run AutoSSL (free Let's Encrypt), then force HTTPS
redirects. Firebase sign-in popups **will not work over plain HTTP**, and browsers
block the mixed content anyway.

### 4. Authorise the domain in Firebase — the step everyone forgets

Firebase console → **Authentication → Settings → Authorized domains → Add domain**.

Add both:

```
adventureadvertising.in
www.adventureadvertising.in
```

Miss this and Google sign-in fails with `auth/unauthorized-domain` the moment the
site is live, even though it works perfectly on localhost.

### 5. Enable the sign-in methods

Firebase console → **Authentication → Sign-in method** → enable:

- **Google** — the Continue with Google button
- **Email/Password** — the email form
- **Anonymous** — the "Browse without an account" button

Until these are on, the guest button still works (it falls back to a local session),
but Google and email sign-in will error. **Anonymous** also powers the live "reading
now" counter — without it, visitors see the count but never appear in it.

### 6. Lock down Firestore rules

The presence feature reads and writes a `presence` collection. Test-mode rules let
anyone write anything, so before the site is public set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /presence/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /{document=**} { allow read, write: if false; }
  }
}
```

Anyone may see the count; only a signed-in user may write their own row.

---

## What works on static hosting, and what does not

Video IDs and thumbnails are baked into `assets/data.js`, so the site does not need
the API to be useful.

| Feature | Static upload |
| --- | --- |
| Sign-in gate (Firebase) | works |
| Globe + views by country | works, from bundled figures |
| Library, filters, breakdowns | works |
| **Video playback** | works |
| Brief builder | works |
| Live view counts | falls back to baked numbers, no live dot |
| Meta Ad Library lookup | shows a connection error |

The last two need the Node server. To get them back later, deploy `server/` to a
Node host (Render, Railway, Fly, a VPS) and set `YOUTUBE_API_KEY` and
`META_ACCESS_TOKEN` as **environment variables in that host's dashboard** — never as
an uploaded `.env` file. Then point `fetch('/api/...')` in `assets/live.js` at that
host's URL, and allow the domain in its CORS settings.

To refresh the baked numbers before a deploy, run the local server once and re-bake:

```bash
npm start
curl -s localhost:8123/api/library?refresh=1 > /dev/null
```

---

## After it is live, check

1. Open `https://adventureadvertising.in` — sign-in screen with the globe.
2. Click **Browse without an account** — library opens, 7 cards with thumbnails.
3. Open any card, press play — the ad plays inline.
4. Try **Continue with Google** — proves steps 4 and 5 above are done.
5. Open on a phone — the layout collapses to one column with a working menu.
