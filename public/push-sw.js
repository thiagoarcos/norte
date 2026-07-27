/* Handlers de Web Push — importado por el service worker generado (vite-plugin-pwa).
   Recibe los push del worker de Cloudflare y muestra la notificación nativa. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "NEXO FIT", {
      body: data.body || "",
      icon: "/nexofit/icon-192.png",
      badge: "/nexofit/icon-192.png",
      tag: data.tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) =>
      wins.length ? wins[0].focus() : self.clients.openWindow("/nexofit/"),
    ),
  );
});
