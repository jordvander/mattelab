# MATTE·LAB website

Public site: https://jordvander.github.io/mattelab/

GitHub Pages serves `main` from this repository’s root. The app source and binary releases live separately; this repository contains only the public website.

## Preview

Run `python3 -m http.server 8937 --bind 127.0.0.1`, then open `http://localhost:8937/`.

## Publish a new app release on the site

1. Upload and verify the binary release in `jordvander/mattelab-releases` first.
2. Update each available platform and toolkit entry in `release-data.json` with its **verified** version, pinned download URL, exact size and SHA-256. Preserve the platform requirements and signing note unless the build evidence changes.
3. Run `python3 scripts/verify-downloads.py`. This requires each named GitHub asset to exist with the catalog's size and uploaded SHA-256, then checks every direct URL with a one-byte range request. It uses no API token and exits with an error on any mismatch; it does not download the full binaries.
4. Run `python3 scripts/sync-release.py`. This writes the download cards, toolkit links and checksums into `index.html`. Commit both the catalog and rendered HTML.
5. Check the actual public links and HTML after Pages deployment.

**Product requirement:** visitors provide their email before the website unlocks downloads. Preserve this requirement during redesigns and release updates.

The catalog keeps exact verified release assets. Generated links initially point to the signup panel; `download-gate.js` enables them only after MailerLite returns a successful response. App/toolkit links, release pages and the catalog link all use this gate, including the generated HTML. JavaScript is required to unlock downloads. Failed/blocked requests stay locked and allow retry.

## Front end

- `styles.css`: responsive layout and existing tape colour/typography identity.
- `hero.js`: original animated shader, with reduced-motion, pause and off-screen handling.
- `site.js`: reel/background controls and Mac-help expansion.
- `download-gate.js`: accepted email signup unlocks downloads; remembers a boolean, never an email address.
- `assets/`: original logo, screenshots, posters and four user reels.

The gate uses the existing MailerLite account/form and no-spam/unsubscribe wording. A normal CORS POST lets it check both HTTP success and `success === true`; HTTP200 alone does not unlock. Accepted submissions are remembered with `ml.gate.unlocked.v2`. The old `ml.gate.email` value is ignored because the previous gate stored it even after failed submissions. Accepted submission is distinct from ownership verification or double opt-in email confirmation.

The website and release assets remain public on GitHub. This is an email gate for the website experience; it cannot prevent someone using a copied GitHub URL or inspecting the source. Private delivery would require a server and a separate distribution design.

The Mac distribution is Apple Silicon only and is not Developer ID signed or Apple-notarized. Do not describe it as Apple-approved or as a universal Mac build. The installation help distinguishes a normal unnotarized-app warning from a damaged-file warning and links Apple’s official guidance.
