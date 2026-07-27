// Service Worker per supporto offline
const CACHE_VERSION = 'gamebar-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/api.js',
  '/js/auth.js',
  '/js/config.js'
];

// Install - cache gli asset statici
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate - ripulisci cache vecchie
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_VERSION)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Gestisci API calls
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Gestisci asset statici
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Network First: prova online, fallback a cache
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Salva in cache se è una GET API call
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, returning cached response');
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Fallback generico per richieste non disponibili
    return new Response(
      JSON.stringify({ error: 'Offline - dati non disponibili' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache First: usa cache se disponibile
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.log('[SW] Offline - risorsa non disponibile:', request.url);
    return new Response('Offline - risorsa non disponibile', { status: 503 });
  }
}
