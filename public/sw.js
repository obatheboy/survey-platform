const CACHE_VERSION = 'v2';
const STATIC_CACHE = `survey-platform-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `survey-platform-runtime-${CACHE_VERSION}`;
const urlsToCache = ['/', '/index.html', '/manifest.json', '/vite.svg'];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((error) => {
        console.log('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, RUNTIME_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // SPA navigation: network first, fallback to cached shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put('/index.html', responseClone);
          });
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Same-origin static assets: cache first
  if (requestUrl.origin === self.location.origin) {
    const destination = event.request.destination;
    const isStatic =
      destination === 'style' ||
      destination === 'script' ||
      destination === 'image' ||
      destination === 'font';

    if (isStatic) {
      event.respondWith(
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
      );
      return;
    }
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Survey Platform', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
