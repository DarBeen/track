// KYC Track School 賽道分析器 — offline support.
// Change VERSION when you want every installed copy to drop its old cache.
const VERSION = 'kyc-track-v4';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './privacy.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // The page itself: try the network first so updates on GitHub show up, fall back to the cached copy offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); if (r.ok) caches.open(VERSION).then(c => c.put(req, copy)); return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')).then(r => r || caches.match('./'))));
    return;
  }
  // Icons, manifest and web fonts: serve from cache, refresh in the background.
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
