# Builds the installable web app (PWA) for GitHub Pages from dist/index.html.
#   python3 build.py && python3 build_web.py [outdir]     (default: ../site)
# Output: index.html (+ manifest/SW tags), manifest.webmanifest, sw.js, icons/, audio/, .nojekyll
import hashlib, json, os, shutil, sys
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, "..", "site"))
html = open(os.path.join(here, "dist", "index.html"), encoding="utf-8").read()
h = hashlib.sha1(html.encode())
for root, _, fs in sorted(os.walk(os.path.join(here, "audio"))):
    for f in sorted(fs): h.update(f.encode()); h.update(open(os.path.join(root, f), "rb").read())
ver = h.hexdigest()[:10]
head = """<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#05030a">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Soul Breakers">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<script>
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
</script>
"""
html = html.replace('<meta name="viewport" content="width=device-width, initial-scale=1">\n', '')
html = html.replace("</head>", head + "</head>", 1)
html = html.replace("<title>SOUL BREAKERS — 魂砕き · Anime Fighting Game</title>", "<title>Soul Breakers</title>")
os.makedirs(os.path.join(out, "icons"), exist_ok=True)
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)
manifest = {
  "name": "SOUL BREAKERS — Anime Fighting", "short_name": "Soul Breakers", "id": "./", "start_url": "./", "scope": "./",
  "display": "fullscreen", "display_override": ["fullscreen", "standalone"], "orientation": "landscape",
  "background_color": "#05030a", "theme_color": "#05030a",
  "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}],
}
json.dump(manifest, open(os.path.join(out, "manifest.webmanifest"), "w"), indent=1)
sw = """// Soul Breakers service worker: the game works offline after the first visit (singleplayer,
// local versus, training). The page is network-first so new versions arrive right away.
const CACHE = 'soulbreakers-%s';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.includes('/audio/music/')) return;   // streamed (range requests): straight to network / HTTP cache
  if (u.pathname.includes('/audio/')) {   // sound effects + announcer: cache on first use, then offline
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(r, c)); } return res; })));
    return;
  }
  if (r.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html')) {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(ca => ca.put('index.html', c)); return res; })
      .catch(() => caches.match('index.html', { ignoreSearch: true }).then(m => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => m || fetch(r)));
});
""" % ver
open(os.path.join(out, "sw.js"), "w").write(sw)
open(os.path.join(out, ".nojekyll"), "w").write("")
audio = os.path.join(here, "audio")
if os.path.isdir(audio):
    shutil.rmtree(os.path.join(out, "audio"), ignore_errors=True)
    shutil.copytree(audio, os.path.join(out, "audio"))
icons = os.path.join(here, "web_icons")
for f in os.listdir(icons): shutil.copy(os.path.join(icons, f), os.path.join(out, "icons", f))
print("web build", ver, "->", out)
