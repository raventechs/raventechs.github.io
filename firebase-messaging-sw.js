// ═══════════════════════════════════════════════════════
//  RavenTechs — Service Worker para notificaciones push
//  Sonidos: notification-agenda.mp3 / notification-timbre.mp3
// ═══════════════════════════════════════════════════════

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyCvD2dC6Fw976Bi_O2OZmhKFQ7mm1uVp40",
  authDomain:        "timbrear-cdc41.firebaseapp.com",
  projectId:         "timbrear-cdc41",
  storageBucket:     "timbrear-cdc41.firebasestorage.app",
  messagingSenderId: "707107985985",
  appId:             "1:707107985985:web:39126f161b9bb719f904c0"
});

const messaging = firebase.messaging();

// ── Notificación push en BACKGROUND o cerrada ──
messaging.onBackgroundMessage(async (payload) => {
  console.log("RavenTechs SW: push recibido", payload);

  const titulo = payload.notification?.title || "🔔 Notificación";
  const cuerpo = payload.notification?.body  || "Tenés una notificación";
  const datos  = payload.data || {};
  const app    = datos.app || 'timbrear';
  const esTimbre = app === 'timbrear';

  // Opciones de notificación
  const notifOpts = {
    body:               cuerpo,
    icon:               '/icon-192.png',
    badge:              '/icon-192.png',
    tag:                'raventechs-' + app,
    renotify:           true,
    requireInteraction: true,
    silent:             false,
    vibrate:            esTimbre
      ? [500, 200, 500, 200, 500, 200, 500, 200, 500]
      : [300, 100, 300, 100, 300],
    data: datos,
    actions: esTimbre
      ? [{ action: "atender", title: "📞 Atender" }, { action: "rechazar", title: "📵 Rechazar" }]
      : [{ action: "ver", title: "📅 Ver agenda" }]
  };

  await self.registration.showNotification(titulo, notifOpts);

  // Para timbrear: re-notificar cada 8 segundos (máx 3 veces) para forzar sonido en Xiaomi
  if (esTimbre) {
    let intentos = 0;
    const intervalo = setInterval(async () => {
      intentos++;
      if (intentos >= 3) { clearInterval(intervalo); return; }
      await self.registration.showNotification(titulo, {
        ...notifOpts,
        tag: 'timbrear-llamada-' + intentos,
        body: cuerpo + " · " + (intentos + 1) + "° llamada"
      });
    }, 8000);
  }

  // Reproducir sonido via postMessage a los clientes abiertos
  const sonidoUrl = esTimbre ? '/notification-timbre.mp3' : '/notification-agenda.mp3';
  const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  allClients.forEach(client => client.postMessage({ type: 'PLAY_SOUND', url: sonidoUrl }));
});

// ── Click en la notificación ──
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const datos = event.notification.data || {};
  const app   = datos.app || 'timbrear';
  const sesionId = datos.sesionId || "";

  let url;
  if (app === 'timbrear') {
    url = sesionId ? `/timbrear/timbrear-residente.html?sesion=${sesionId}` : '/timbrear/timbrear-residente.html';
  } else if (app === 'miagenda') {
    url = '/miagenda/';
  } else if (app === 'saludar') {
    url = '/saludar/';
  } else {
    url = '/';
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if (cliente.url.includes(app) && "focus" in cliente) return cliente.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
