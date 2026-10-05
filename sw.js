// Service worker de ObraTudela — hace la web instalable (PWA) y permite
// abrir las páginas ya visitadas sin conexión.
//
// Estrategia (pensada para que un despliegue nuevo se vea siempre al momento):
// - Páginas, CSS, JS e imágenes propias: primero red, y si no hay conexión,
//   la copia guardada en caché.
// - Fuentes (/fonts/) y librerías de CDN con versión fija (pako, xlsx, fuse):
//   primero caché, porque no cambian nunca.
// - /data/ (base de precios, ~20 MB) NO pasa por aquí: js/precios-loader.js
//   ya tiene su propia caché con CACHE_VERSION.
//
// Si cambias la estrategia, sube CACHE_NAME para que se borre la caché vieja.

const CACHE_NAME = 'obratudela-v1';

const PRECACHE = [
  './',
  './index.html',
  './css/global.css',
  './img/logo.jpg',
  './img/icon-192x192.png',
  './manifest.json'
];

const CDN_HOSTS = ['cdnjs.cloudflare.com', 'unpkg.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Librerías de CDN con versión en la URL: caché primero
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Cualquier otro dominio (Google Tag Manager, mapas...): no tocar
  if (url.origin !== self.location.origin) return;

  // Base de precios: la gestiona precios-loader.js
  if (url.pathname.startsWith('/data/')) return;

  if (url.pathname.startsWith('/fonts/')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  event.respondWith(networkFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') {
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, res.clone());
  }
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (cached) return cached;
    // Sin conexión y página no visitada antes: mostrar la portada guardada
    if (req.mode === 'navigate') {
      const home = await caches.match('./');
      if (home) return home;
    }
    throw err;
  }
}
