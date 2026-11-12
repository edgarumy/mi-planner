/* Service worker: permite abrir Mi Planner sin internet.
   Estrategia: primero la red (para recibir actualizaciones) y, si no hay conexión, la copia guardada.
   Solo guarda los archivos de la app; tus datos siguen en tu carpeta. */
const CACHE = 'mi-planner-v3';
const ARCHIVOS = ['./', './index.html', './css/app.css', './manifest.webmanifest', './img/icono-192.png', './img/icono-512.png',
  './js/util.js', './js/storage.js', './js/model.js', './js/xlsx.js', './js/export.js', './js/views.js', './js/modals.js', './js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
