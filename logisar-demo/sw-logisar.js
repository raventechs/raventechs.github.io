/* LogisAR — service worker v0.3. Guarda la app para usarla sin conexión. */
const CACHE = 'logisar-v0.3';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('logisar-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0) { /* SDK de Firebase: cache primero, para abrir sin conexión */
    e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); } return res; })));
    return;
  }
  if (u.origin !== location.origin) return; /* fuentes y datos de Firestore van directo a la red */
  e.respondWith(
    fetch(r).then(res => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
      return res;
    }).catch(() => caches.match(r).then(x => x || caches.match('./index.html')))
  );
});
