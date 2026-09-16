/* ════════════════════════════════════════════════════════════
   OSS Service Worker — Offline Cache + PWA Install
   Strategy: Network-first for app files, cache-first for fonts
════════════════════════════════════════════════════════════ */

// ⚠ Bump this version string setiap kali deploy biar cache lama otomatis dihapus
const CACHE_NAME = 'oss-v4';
const APP_SHELL = ['/OSS/', '/OSS/index.html', '/OSS/manifest.json'];

// File-file utama yang harus selalu network-first (langsung ambil dari server)
const NETWORK_FIRST = ['/OSS/app.js', '/OSS/style.css', '/OSS/index.html', '/OSS/'];

// ── Install: cache the app shell ──────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    }).then(function() {
      return self.skipWaiting(); // langsung aktif tanpa tunggu tab ditutup
    })
  );
});

// ── Activate: clean old caches ─────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME && k !== CACHE_NAME + '-fonts'; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim(); // langsung kontrol semua tab yang terbuka
    })
  );
});

// ── Fetch ──────────────────────────────────────────────────
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // Google Fonts: cache-first (jarang berubah)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE_NAME + '-fonts').then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          if (cached) return cached;
          return fetch(e.request).then(function(res) {
            cache.put(e.request, res.clone());
            return res;
          }).catch(function() { return new Response('', {status: 503}); });
        });
      })
    );
    return;
  }

  // App files (app.js, style.css, index.html): NETWORK-FIRST
  // Selalu ambil dari server dulu, fallback ke cache jika offline
  if (url.origin === self.location.origin) {
    var pathname = url.pathname;
    var isAppFile = NETWORK_FIRST.some(function(p) { return pathname === p || pathname.endsWith(p); });

    if (isAppFile) {
      e.respondWith(
        fetch(e.request).then(function(res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
          }
          return res;
        }).catch(function() {
          // Offline: gunakan cache sebagai fallback
          return caches.match(e.request).then(function(cached) {
            if (cached) return cached;
            if (e.request.mode === 'navigate') return caches.match('/OSS/');
            return new Response('Offline', { status: 503 });
          });
        })
      );
      return;
    }

    // File lain (gambar, icon, manifest): cache-first
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
          if (e.request.mode === 'navigate') return caches.match('/OSS/');
          return new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // External resources: network with cache fallback
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});

// ── Message: force update dari app.js ─────────────────────
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
