// ════════════════════════════════════════════════════════════════════════
// js/ui-misc/pwa-install.js — I6 (2026-10-04)
// PWA: registrasi Service Worker, install prompt (beforeinstallprompt),
// tombol "Install App" di sidebar + banner install.
// Dipindah byte-exact dari app.js (134 baris): _pwaInstallEvent,
// _pwaSetInstalled, _pwaCheckInstalled, 1 IIFE (listener display-mode,
// register ./sw.js, beforeinstallprompt, appinstalled), installPWA,
// dismissPWABanner.
// Dependency: hanya DOM (#sidebar-install-btn, #sidebar-install-label,
// #oss-pwa-banner — sudah ada di index.html sebelum <script>) dan
// showToast() yang dibaca runtime di dalam handler (tidak dipanggil saat
// parse), jadi aman dimuat sebelum app.js. installPWA/dismissPWABanner
// dipanggil lewat onclick inline di index.html → harus tetap global.
// ════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// PWA — Service Worker Registration + Install Prompt
// State: "installable" | "installed" | "unavailable"
// ════════════════════════════════════════════════════════════
var _pwaInstallEvent = null;

// ── Update tampilan tombol sesuai state ──────────────────
function _pwaSetInstalled(isInstalled){
  var btn   = document.getElementById('sidebar-install-btn');
  var label = document.getElementById('sidebar-install-label');
  if(!btn || !label) return;
  var svgEl = btn.querySelector('svg');

  if(isInstalled){
    btn.classList.add('installed');
    btn.disabled = true;
    if(svgEl){
      svgEl.setAttribute('viewBox','0 0 24 24');
      svgEl.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
    }
    label.textContent = 'Sudah Terinstal \u2713';
  } else {
    btn.classList.remove('installed');
    btn.disabled = false;
    if(svgEl){
      svgEl.setAttribute('viewBox','0 0 24 24');
      svgEl.innerHTML = '<rect x="3" y="3" width="18" height="18" rx="3"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>';
    }
    label.textContent = 'Install App';
  }
}

// ── Cek apakah sudah terinstal saat load ────────────────
function _pwaCheckInstalled(){
  // Mode standalone = dibuka sebagai app (sudah install)
  if(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true){
    _pwaSetInstalled(true);
    return;
  }
  // getInstalledRelatedApps — Chrome Android/Desktop
  if(navigator.getInstalledRelatedApps){
    navigator.getInstalledRelatedApps().then(function(apps){
      if(apps && apps.length > 0) _pwaSetInstalled(true);
    }).catch(function(){});
  }
}

(function(){
  // Cek status awal
  _pwaCheckInstalled();

  // Listen perubahan display-mode: kalau user uninstall lalu buka di browser lagi
  var mq = window.matchMedia('(display-mode: standalone)');
  var mqFn = function(e){
    if(!e.matches && !_pwaInstallEvent){
      // Kembali ke browser mode, kemungkinan di-uninstall
      _pwaSetInstalled(false);
    }
  };
  if(mq.addEventListener) mq.addEventListener('change', mqFn);
  else if(mq.addListener) mq.addListener(mqFn); // Safari lama

  // Register Service Worker
  if('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('./sw.js').then(function(reg){
        // Check for update immediately on load
        reg.update();

        reg.addEventListener('updatefound', function(){
          var newWorker = reg.installing;
          newWorker.addEventListener('statechange', function(){
            if(newWorker.state === 'installed' && navigator.serviceWorker.controller){
              // Force activate new SW immediately — skip waiting
              newWorker.postMessage({type:'SKIP_WAITING'});
              showToast('Update tersedia — memuat ulang…');
            }
          });
        });
      }).catch(function(err){
        console.warn('OSS SW registration failed:', err);
      });

      // When SW has taken control, reload once to use new cache
      navigator.serviceWorker.addEventListener('controllerchange', function(){
        if(!window._swReloading){
          window._swReloading = true;
          window.location.reload();
        }
      });
    });
  }

  // Browser siap menawarkan install (belum diinstall)
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    _pwaInstallEvent = e;
    _pwaSetInstalled(false); // pastikan tombol aktif
    if(!localStorage.getItem('oss_pwa_dismissed')){
      setTimeout(function(){
        var banner = document.getElementById('oss-pwa-banner');
        if(banner) banner.classList.add('show');
      }, 3000);
    }
  });

  // Berhasil diinstall
  window.addEventListener('appinstalled', function(){
    _pwaInstallEvent = null;
    var banner = document.getElementById('oss-pwa-banner');
    if(banner) banner.classList.remove('show');
    _pwaSetInstalled(true);
    showToast('OSS berhasil diinstall');
  });
})();

function installPWA(){
  if(!_pwaInstallEvent){ return; }
  _pwaInstallEvent.prompt();
  _pwaInstallEvent.userChoice.then(function(choice){
    if(choice.outcome === 'accepted'){
      _pwaInstallEvent = null;
      var banner = document.getElementById('oss-pwa-banner');
      if(banner) banner.classList.remove('show');
      // appinstalled event akan handle _pwaSetInstalled(true)
    }
  });
}

function dismissPWABanner(){
  var banner = document.getElementById('oss-pwa-banner');
  if(banner) banner.classList.remove('show');
  localStorage.setItem('oss_pwa_dismissed', '1');
}
