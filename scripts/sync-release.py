#!/usr/bin/env python3
"""Render the checked release catalog into static HTML. No browser API dependency.

Edit release-data.json after upload verification, then run:
    python3 scripts/sync-release.py
The HTML remains functional if JavaScript, MailerLite or the GitHub API is down.
"""
from pathlib import Path
from urllib.parse import urlparse
from html import escape
import json
import re

ROOT = Path(__file__).resolve().parent.parent
catalog = json.loads((ROOT / 'release-data.json').read_text())
assets = catalog['assets']
for name, asset in assets.items():
    url = urlparse(asset['url'])
    if url.scheme != 'https' or url.netloc != 'github.com' or not url.path.startswith('/jordvander/mattelab-releases/releases/download/'):
        raise ValueError(f'{name}: expected a pinned asset URL from the MATTE·LAB release repository')
    if not re.fullmatch(r'[a-f0-9]{64}', asset['sha256']):
        raise ValueError(f'{name}: a verified SHA-256 is required')
    if not isinstance(asset['bytes'], int) or asset['bytes'] <= 0:
        raise ValueError(f'{name}: a verified size is required')

def e(value):
    return escape(str(value), quote=True)

def size(asset):
    return f"{asset['bytes'] / 1000000:.0f} MB"

cards = []
for key, title, label in [('mac', 'macOS', 'Mac'), ('windows', 'Windows', 'Windows')]:
    a = assets[key]
    secondary = ' secondary' if key == 'windows' else ''
    cards.append(f'''<article class="download-card">
      <div class="platform-line"><h3>{title}</h3><span class="platform-symbol" aria-hidden="true">{'⌘' if key == 'mac' else '⊞'}</span></div>
      <p class="download-meta">{e(a['platform'])}<br>Version {e(a['version'])} · ZIP · {size(a)}</p>
      <a class="button{secondary}" data-asset="{key}" href="{e(a['url'])}">Download for {label} <span aria-hidden="true">↓</span></a>
      <p class="download-note">{e(a['note'])} <a href="{'#mac-help' if key == 'mac' else e(a['release_url'])}">{'Mac installation notes' if key == 'mac' else 'Release notes'} ↗</a></p>
    </article>''')
rendered = '<div class="downloads">' + '\n'.join(cards) + '</div>'
links = []
for key, label in [('roto-mac', 'ROTO toolkit for Mac'), ('roto-windows', 'ROTO toolkit for Windows')]:
    a = assets[key]
    links.append(f'<a data-asset="{key}" href="{e(a["url"])}">{label} ↗</a>')
toolkits = '<div class="toolkit-links">' + '\n'.join(links) + '</div>'
hashes = '<dl class="hashes">' + ''.join(f'<dt>{e(a["name"])} · {e(a["version"])}</dt><dd>{e(a["sha256"])}</dd>' for a in assets.values()) + '</dl>'
html_path = ROOT / 'index.html'
html = html_path.read_text()
for marker, content in [('DOWNLOAD_CATALOG', rendered), ('TOOLKIT_LINKS', toolkits), ('CHECKSUMS', hashes)]:
    pattern = rf'(<!-- {marker}_START -->).*?(<!-- {marker}_END -->)'
    html, count = re.subn(pattern, lambda m: m[1] + '\n' + content + '\n' + m[2], html, flags=re.S)
    if count != 1:
        raise ValueError(f'Expected one {marker} region; found {count}')
html_path.write_text(html)
print(f'Rendered {len(assets)} verified assets into index.html')
