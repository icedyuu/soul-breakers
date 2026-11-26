// Soul Breakers service worker: the game works offline after the first visit (singleplayer,
// local versus, training). The page is network-first so new versions arrive right away.
const CACHE = 'soulbreakers-e5d90adfee';
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
