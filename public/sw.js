// Service Worker for Investment Portfolio Tracker PWA
// Version management for cache invalidation
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `invest-app-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/portfolio',
  '/analytics',
  '/manifest.json',
  '/favicon.ico',
];

// API routes that should use network-first strategy
const API_ROUTES = [
  '/api/tinkoff/',
  '/api/market/',
  '/api/news/',
  '/api/goals/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API routes: Network-first strategy (fresh data priority)
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets: Cache-first strategy (performance priority)
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Network-first strategy for API calls
 * Try network first, fallback to cache if offline
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Try to fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('[SW] Network request failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available, return offline response
    return new Response(JSON.stringify({
      error: 'Нет подключения к интернету',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Cache-first strategy for static assets
 * Serve from cache, update in background
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Serve from cache, update in background
    fetchAndUpdateCache(request, cache);
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed and no cache, show offline page
    console.log('[SW] Failed to fetch:', request.url);

    // For navigation requests, show offline page
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match(OFFLINE_PAGE);
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Fetch and update cache in background
 */
async function fetchAndUpdateCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silent fail - cache update is not critical
    console.log('[SW] Background cache update failed:', request.url);
  }
}

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Уведомление портфеля';
  const options = {
    body: data.body || 'Новое уведомление',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || 'portfolio-notification',
    data: data.url || '/',
    vibrate: [200, 100, 200],
    actions: data.actions || [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus existing window if available
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-portfolio') {
    event.waitUntil(syncPortfolioData());
  }
});

/**
 * Sync portfolio data when connection restored
 */
async function syncPortfolioData() {
  try {
    // Fetch fresh portfolio data
    const response = await fetch('/api/tinkoff/portfolio');

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put('/api/tinkoff/portfolio', response);
      console.log('[SW] Portfolio data synced');
    }
  } catch (error) {
    console.log('[SW] Failed to sync portfolio data:', error);
  }
}

// Message event handler (for communication with app)
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
