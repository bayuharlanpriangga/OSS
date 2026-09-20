/* ════════════════════════════════════════════════════════════
   OSS Service Worker — Offline Cache + PWA Install
   Strategy: Network-first for app files, cache-first for fonts
════════════════════════════════════════════════════════════ */

// ⚠ Bump this version string setiap kali deploy biar cache lama otomatis dihapus
const CACHE_NAME = 'oss-v5'; // v5 (2026-09-21): fix — semua *.js kini network-first, bukan cuma app.js

// ✅ DIPERBAIKI: base path DIHITUNG DINAMIS dari scope registrasi service
// worker (bukan di-hardcode '/OSS/'). `self.registration.scope` selalu
// berupa URL folder tempat sw.js didaftarkan (lihat `register('./sw.js')`
// di app.js — scope default = folder sw.js itu sendiri), jadi otomatis
// menyesuaikan di manapun repo ini di-deploy: '/OSS/' kalau tetap di sini,
// '/' kalau suatu saat pindah jadi user/org page, atau '/nama-lain/' kalau
// repo di-rename/di-fork — tanpa perlu ubah kode ini sama sekali.
const BASE = new URL(self.registration.scope).pathname; // contoh: '/OSS/'
const APP_SHELL = [BASE, BASE + 'index.html', BASE + 'manifest.json'];

// File-file utama yang harus selalu network-first (langsung ambil dari server).
// ✅ DIPERBAIKI (2026-09-21): dulu cuma app.js yang network-first, sedangkan
// ~40+ file hasil pemisahan di js/** (js/analyze/*, js/charts/*,
// js/stats-engine/*, dst) ikut kena cabang "cache-first" di bawah
// (disamakan dengan gambar/ikon/manifest yang jarang berubah) — akibatnya
// browser bisa terus menyajikan versi LAMA file-file itu dari cache
// walau sudah ada deploy baru, sampai CACHE_NAME di-bump. Karena proyek
// ini masih aktif memecah app.js jadi banyak file js/**/*.js baru tiap
// sesi, SEMUA file .js sekarang network-first (dicek lewat suffix '.js'
// di isAppFile di bawah, bukan cuma disamakan literal ke NETWORK_FIRST
// ini) — cache-first hanya tersisa untuk aset non-JS (gambar/ikon/manifest)
// dan Google Fonts (blok terpisah di atas).
const NETWORK_FIRST = [BASE + 'app.js', BASE + 'style.css', BASE + 'index.html', BASE];

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

  // App files (semua *.js, style.css, index.html): NETWORK-FIRST
  // Selalu ambil dari server dulu, fallback ke cache jika offline
  if (url.origin === self.location.origin) {
    var pathname = url.pathname;
    var isAppFile = pathname.endsWith('.js') ||
      NETWORK_FIRST.some(function(p) { return pathname === p || pathname.endsWith(p); });

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
            if (e.request.mode === 'navigate') return caches.match(BASE);
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
          if (e.request.mode === 'navigate') return caches.match(BASE);
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
