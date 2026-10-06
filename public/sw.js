/* Service worker de Vamo (web).
   1) Reemplaza al de NORTE (que guardaba la app vieja en caché): al activarse borra todas las
      cachés y recarga las pestañas abiertas, así el teléfono pasa solo a Vamo.
   2) Mantiene las notificaciones push del servidor de NORTE/NEXO (la misma suscripción sigue
      andando porque el registro del service worker es el mismo). */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.clients.claim();
    const wins = await self.clients.matchAll({ type: 'window' });
    for (const w of wins) { try { w.navigate(w.url); } catch (e) { /* ignorar */ } }
  })());
});

// Sin handler de fetch: todo va a la red (Vamo se actualiza solo en cada deploy).

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(data.title === 'NORTE' ? 'Vamo' : (data.title || 'Vamo'), {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag,
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) =>
    wins.length ? wins[0].focus() : self.clients.openWindow('/')));
});
