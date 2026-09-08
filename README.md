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

Download links are ordinary anchors to exact release assets. No GitHub API, JavaScript, browser storage or mailing-list service is needed to reveal or use them. A later release cannot silently redirect a platform to a missing asset; updating the catalog is an explicit publishing step.

## Front end

- `styles.css`: responsive layout and existing tape colour/typography identity.
- `hero.js`: original animated shader, with reduced-motion, pause and off-screen handling.
- `site.js`: optional reel/background controls, Mac-help expansion and newsletter enhancement.
- `assets/`: original logo, screenshots, posters and four user reels.

The newsletter retains the existing MailerLite form endpoint and the existing no-spam/unsubscribe wording. It is optional, does not store the email locally, and has a native form fallback. Its opaque cross-origin response cannot confirm subscription, so the status asks the visitor to check their inbox rather than claiming they are subscribed.

The Mac distribution is Apple Silicon only and is not Developer ID signed or Apple-notarized. Do not describe it as Apple-approved or as a universal Mac build. The installation help distinguishes a normal unnotarized-app warning from a damaged-file warning and links Apple’s official guidance.
