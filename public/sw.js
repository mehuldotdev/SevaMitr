/**
 * SevaMitr Offline-First High Performance Service Worker
 * Designed for Low-Connectivity Environments (NER / 2G / 3G / Complete Offline)
 */

const CACHE_NAME = 'sevamitr-pwa-v2';

// Core Application Shell & Essential Assets to Pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/patient',
  '/caregiver',
  '/caregiver/patients',
  '/patient/games/double-decision',
  '/patient/games/sound-sweeps',
  '/patient/games/target-tracker',
  '/patient/games/speed-maze',
  '/patient/games/bijuli-tap',
  '/patient/games/bikhama-khoj',
  '/manifest.json',
  '/logo.png',
  '/icon.png',
];

// 1. Install Event: Cache Core Application Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Use allSettled so single dev-mode route misses don't abort SW installation
        return Promise.allSettled(
          PRECACHE_ASSETS.map(async (url) => {
            try {
              const res = await fetch(url, { cache: 'no-cache' });
              if (res.ok) {
                await cache.put(url, res);
              }
            } catch {
              // Pre-cache fetch failure in low-connectivity/dev mode is non-fatal
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Purge Outdated Caches & Claim Clients Immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SevaMitr SW] Removing deprecated cache:', name);
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Dual-Tier Caching Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Ignore chrome-extension / non-http schemes
  if (!url.protocol.startsWith('http')) return;

  // Do not intercept authentication or telemetry API endpoints
  if (url.pathname.startsWith('/api/auth') || url.pathname.startsWith('/api/sync')) {
    return;
  }

  // STRATEGY A: Static Assets (JS, CSS, Fonts, Images, Audio, Next static chunks) -> CACHE-FIRST
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2|woff|ttf|mp3|wav|ico)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return immediately from local cache (0ms latency, zero network cost on 2G)
          return cachedResponse;
        }

        // Otherwise fetch from network and store in cache
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback for images/assets if needed
            return new Response('', { status: 408, headers: { 'Content-Type': 'text/plain' } });
          });
      })
    );
    return;
  }

  // STRATEGY B: HTML Page Navigations (/patient, /caregiver, /games/*) -> STALE-WHILE-REVALIDATE
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Fetch fresh copy from network in background / parallel
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(async () => {
            // If network fails completely (offline or slow timeout), fallback to cached patient view
            if (cachedResponse) return cachedResponse;
            const fallbackPatient = await caches.match('/patient');
            if (fallbackPatient) return fallbackPatient;
            const fallbackRoot = await caches.match('/');
            if (fallbackRoot) return fallbackRoot;
            return new Response('SevaMitr is running in offline mode. Please connect to sync.', {
              status: 200,
              headers: { 'Content-Type': 'text/plain' },
            });
          });

        // If cached page is available, return immediately (0ms instant render on 2G!)
        // Otherwise wait for network fetch
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // STRATEGY C: API Data Endpoints -> NETWORK-FIRST with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
