/* ════════════════════════════════════════════════════════════
   OSS Service Worker — Offline Cache + PWA Install
   Strategy: Cache-first for app shell, network-first for fonts
════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'oss-v2';
const APP_SHELL = ['/OSS/', '/OSS/index.html', '/OSS/manifest.json', '/OSS/sw.js'];

// ── Install: cache the app shell ──────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activate: clean old caches ─────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch: cache-first for same-origin, network for CDN fonts ──
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // Let Google Fonts go to network (they cache themselves)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE_NAME + '-fonts').then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          if (cached) return cached;
          return fetch(e.request).then(function(res) {
            cache.put(e.request, res.clone());
            return res;
          }).catch(function() { return cached || new Response('', {status: 503}); });
        });
      })
    );
    return;
  }

  // App shell: cache-first
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
          }
          return res;
        }).catch(function() {
          // Offline fallback: return cached index.html for navigation
          if (e.request.mode === 'navigate') return caches.match('/OSS/');
          return new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Everything else: network with cache fallback
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});

// ── Message: force update ──────────────────────────────────
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
