#!/usr/bin/env python3
"""Verify the catalog against public GitHub assets without downloading binaries.

Run before publishing: python3 scripts/verify-downloads.py
Optional catalog:      python3 scripts/verify-downloads.py /path/release-data.json

Checks GitHub's uploaded SHA-256 and size, then requests one byte from every
direct download URL. Requires HTTP 206 and an exact Content-Range total.
Uses no API token. This checks published metadata, not a fresh full-file hash.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen
import json
import re
import sys

REPO = "jordvander/mattelab-releases"
HEADERS = {"User-Agent": "MATTE-LAB-download-verifier", "Accept-Encoding": "identity"}


def request(url, **headers):
    return urlopen(Request(url, headers={**HEADERS, **headers}), timeout=30)


def validate_entry(key, asset):
    url = urlsplit(asset["url"])
    prefix = f"/{REPO}/releases/download/"
    if url.scheme != "https" or url.netloc != "github.com" or url.query or url.fragment or not url.path.startswith(prefix):
        raise ValueError(f"{key}: expected a pinned download URL from {REPO}")
    parts = url.path[len(prefix):].split("/")
    if len(parts) != 2:
        raise ValueError(f"{key}: download URL must contain one release tag and filename")
    tag, filename = map(unquote, parts)
    if not re.fullmatch(r"v?\d+\.\d+\.\d+", tag) or tag.removeprefix("v") != asset["version"]:
        raise ValueError(f"{key}: URL tag does not match catalog version")
    if filename != asset["name"] or Path(filename).suffix.lower() not in {".zip", ".sh", ".ps1"}:
        raise ValueError(f"{key}: expected the catalog's ZIP or installer script filename")
    if type(asset["bytes"]) is not int or asset["bytes"] <= 0 or not re.fullmatch(r"[a-f0-9]{64}", asset["sha256"]):
        raise ValueError(f"{key}: positive byte size and lowercase SHA-256 are required")
    return tag


def load_release(tag):
    url = f"https://api.github.com/repos/{REPO}/releases/tags/{quote(tag, safe='')}"
    with request(url, Accept="application/vnd.github+json") as response:
        raw = response.read(2 * 1024 * 1024 + 1)
        if len(raw) > 2 * 1024 * 1024:
            raise ValueError(f"{tag}: GitHub release response is unexpectedly large")
        release = json.loads(raw)
    if release.get("tag_name") != tag or release.get("draft") or release.get("prerelease"):
        raise ValueError(f"{tag}: expected a published stable release")
    return release


def verify_asset(key, asset, release):
    matches = [item for item in release.get("assets", []) if item.get("name") == asset["name"]]
    if len(matches) != 1:
        raise ValueError(f"{key}: GitHub release has {len(matches)} assets named {asset['name']}")
    uploaded = matches[0]
    expected = {"browser_download_url": asset["url"], "size": asset["bytes"], "digest": "sha256:" + asset["sha256"], "state": "uploaded"}
    for field, value in expected.items():
        if uploaded.get(field) != value:
            raise ValueError(f"{key}: GitHub {field} mismatch: expected {value!r}, got {uploaded.get(field)!r}")
    with request(asset["url"], Range="bytes=0-0", Accept="application/octet-stream") as response:
        expected_range = f"bytes 0-0/{asset['bytes']}"
        if response.status != 206 or response.headers.get("Content-Range") != expected_range:
            raise ValueError(f"{key}: expected HTTP 206 with Content-Range {expected_range!r}; got {response.status}, {response.headers.get('Content-Range')!r}. Body not downloaded.")
        if response.headers.get("Content-Length") not in {None, "1"}:
            raise ValueError(f"{key}: server returned more than the requested byte")
        if response.headers.get_content_type() in {"text/html", "application/xhtml+xml", "application/json"}:
            raise ValueError(f"{key}: download resolves to a web/API page instead of an asset")
        filename = response.headers.get_filename()
        if filename is not None and filename != asset["name"]:
            raise ValueError(f"{key}: response filename is {filename!r}, expected {asset['name']!r}")
        first_byte = response.read(2)
        if len(first_byte) != 1 or (asset["name"].endswith(".zip") and first_byte != b"P"):
            raise ValueError(f"{key}: unexpected asset content in one-byte response")
    return f"PASS {key}: {asset['name']} ({asset['bytes']:,} bytes), uploaded SHA-256 and direct URL verified"


def main():
    if len(sys.argv) > 2:
        raise ValueError("Usage: python3 scripts/verify-downloads.py [release-data.json]")
    catalog = Path(sys.argv[1]) if len(sys.argv) == 2 else Path(__file__).resolve().parent.parent / "release-data.json"
    assets = json.loads(catalog.read_text())["assets"]
    if not isinstance(assets, dict) or not assets:
        raise ValueError("Catalog must contain at least one asset")
    tags = {key: validate_entry(key, asset) for key, asset in assets.items()}
    releases = {tag: load_release(tag) for tag in sorted(set(tags.values()))}
    failures = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = {key: pool.submit(verify_asset, key, asset, releases[tags[key]]) for key, asset in assets.items()}
        for key, job in jobs.items():
            try:
                print(job.result())
            except Exception as error:
                failures.append(f"FAIL {key}: {error}")
    if failures:
        raise ValueError("\n".join(failures))
    print(f"Verified all {len(assets)} catalog downloads; one asset byte requested per URL.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Download verification failed: {error}", file=sys.stderr)
        sys.exit(1)
