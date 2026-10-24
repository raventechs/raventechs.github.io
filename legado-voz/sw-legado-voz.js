// Legado de Voz — Service Worker (v0.2.0, 2026-10-24)
// Cachea solo la cáscara de la app. Nunca intercepta pedidos a otros dominios (Anthropic / ElevenLabs).
const CACHE = 'legado-voz-v0.2.0';
const RAIZ = self.registration.scope;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(RAIZ)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // Red primero; sin conexión, usa la copia guardada.
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok && e.request.mode === 'navigate') {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(RAIZ, copia));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match(RAIZ)))
  );
});
