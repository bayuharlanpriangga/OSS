// ════════════════════════════════════════════════════════════
// js/ui-misc/activity-loading-popup.js
// Fitur (I5): popup "sedang memproses..." (window.OSSLoader: show/hide/
//   update) + interceptor aktivitas yang membungkus fungsi global
//   (runSafe, handleCSV, exportToWord/exportToExcel, runHierarchicalReg,
//   execSyntax, runImpute, imputeAllVars, saveSession) dan klik navigasi
//   sidebar / sub-tab supaya menampilkan popup.
//
// ⚠️ URUTAN MUAT: WAJIB dimuat SESUDAH app.js (dan semua file lain yang
//   mendefinisikan fungsi yang dibungkus). Blok ini membaca window.runSafe /
//   window.handleCSV / window.showToast SAAT PARSE lalu menimpanya dengan
//   wrapper; kalau dimuat sebelum app.js, deklarasi `function runSafe`
//   di app.js akan menimpa wrapper-nya dan popup analisis hilang diam-diam.
//   Wrapper lain (export, hierarki, syntax, impute, saveSession) dipasang
//   lewat setTimeout 300–600 ms setelah parse.
// Depends on: showToast, runSafe, handleCSV (app.js), exportToWord
//   (export-word.js), exportToExcel/runHierarchicalReg (app.js),
//   execSyntax (syntax-view.js), runImpute/imputeAllVars, saveSession
//   (session-save-restore.js); CSS #oss-loader (style.css).
// Catatan: dipindah byte-exact dari app.js (I5, 2026-10-04); tidak ada
//   perubahan logic.
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// ACTIVITY LOADING POPUP SYSTEM
// ════════════════════════════════════════════════════════════
(function(){
  // Inject HTML
  var loaderHtml=
    '<div id="oss-loader">'+
      '<div id="oss-loader-box">'+
        '<div class="oss-spin-wrap">'+
          '<div class="oss-arc"></div>'+
          '<div class="oss-arc2"></div>'+
          '<div class="oss-glow-dot"></div>'+
        '</div>'+
        '<div class="oss-ldr-title" id="oss-ldr-title">Memproses...</div>'+
        '<div class="oss-ldr-sub" id="oss-ldr-sub">Mohon tunggu sebentar</div>'+
        '<div class="oss-ldr-bar-wrap"><div class="oss-ldr-bar" id="oss-ldr-bar"></div></div>'+
        '<div class="oss-dots"><div class="oss-dot"></div><div class="oss-dot"></div><div class="oss-dot"></div></div>'+
      '</div>'+
    '</div>';
  document.body.insertAdjacentHTML('beforeend', loaderHtml);

  var loader    = null; // lazy ref
  var barEl     = null;
  var titleEl   = null;
  var subEl     = null;
  var _barPct   = 0;
  var _barTarget = 0;
  var _barAF    = null;
  var _hideTimer = null;

  function getEls(){
    if(!loader){
      loader  = document.getElementById('oss-loader');
      barEl   = document.getElementById('oss-ldr-bar');
      titleEl = document.getElementById('oss-ldr-title');
      subEl   = document.getElementById('oss-ldr-sub');
    }
  }

  // Animate progress bar smoothly
  function animBar(){
    if(_barPct < _barTarget){
      var step = Math.max(1, Math.ceil((_barTarget - _barPct) * 0.12));
      _barPct = Math.min(_barTarget, _barPct + step);
      if(barEl) barEl.style.width = _barPct + '%';
    }
    if(_barPct < 100){
      _barAF = requestAnimationFrame(animBar);
    }
  }

  function setBar(v){
    _barTarget = Math.min(100, Math.max(_barPct, v));
    if(!_barAF) _barAF = requestAnimationFrame(animBar);
  }

  // Public: show loader
  window.OSSLoader = {
    show: function(title, sub){
      getEls();
      clearTimeout(_hideTimer);
      _barPct = 0; _barTarget = 0;
      cancelAnimationFrame(_barAF); _barAF = null;
      if(barEl) barEl.style.width = '0%';
      if(titleEl) titleEl.textContent = title || 'Memproses...';
      if(subEl)   subEl.textContent   = sub   || 'Mohon tunggu sebentar';
      loader.classList.add('show');
      // Simulate smart progress based on perceived network
      setTimeout(function(){ setBar(25); }, 0);
      setTimeout(function(){ setBar(55); }, 120);
      setTimeout(function(){ setBar(78); }, 280);
    },
    hide: function(delay){
      getEls();
      setBar(100);
      _hideTimer = setTimeout(function(){
        if(loader) loader.classList.remove('show');
        _barPct = 0; _barTarget = 0;
        cancelAnimationFrame(_barAF); _barAF = null;
      }, delay != null ? delay : 260);
    },
    update: function(sub){ if(subEl) subEl.textContent = sub || ''; }
  };

  // ─── INTERCEPT USER ACTIVITIES ───────────────────────────────

  // 1. Analysis runs — wrap runSafe
  var _origRunSafe = window.runSafe;
  window.runSafe = function(fn, label){
    var messages = {
      'Descriptives'     : ['Menghitung statistik deskriptif','Menganalisis distribusi data...'],
      'Correlation'      : ['Menghitung korelasi','Menghitung matriks korelasi...'],
      'Regression'       : ['Menjalankan regresi','Membangun model regresi...'],
      'T-Test'           : ['Menjalankan uji t','Membandingkan kelompok...'],
      'ANOVA'            : ['Menjalankan ANOVA','Menganalisis varians...'],
      'Chi-Square'       : ['Menghitung Chi-Square','Menganalisis frekuensi...'],
      'Factor Analysis'  : ['Analisis faktor','Mengekstrak faktor...'],
      'Reliability'      : ['Uji reliabilitas','Menghitung Cronbach Alpha...'],
      'Mann-Whitney'     : ['Uji Mann-Whitney','Membandingkan distribusi...'],
      'Wilcoxon'         : ['Uji Wilcoxon','Menganalisis perbedaan...'],
      'Kruskal-Wallis'   : ['Uji Kruskal-Wallis','Analisis nonparametrik...'],
      'Logistic'         : ['Regresi logistik','Membangun model logistik...'],
      'Hierarchical'     : ['Regresi hierarki','Membangun model bertahap...'],
    };
    var lbl = label || '';
    var key = Object.keys(messages).find(function(k){ return lbl.indexOf(k) !== -1; });
    var title = key ? messages[key][0] : 'Menjalankan analisis';
    var sub   = key ? messages[key][1] : ('Memproses: ' + lbl + '...');
    OSSLoader.show(title, sub);
    setTimeout(function(){
      try{
        fn();
        OSSLoader.update('Analisis selesai ✓');
        OSSLoader.hide(340);
        showToast(label+' berhasil');
      }catch(e){
        OSSLoader.hide(0);
        showToast(e.message, 'error');
      }
    }, 60);
  };

  // 2. CSV import
  var _origHandleCSV = window.handleCSV;
  if(typeof _origHandleCSV === 'function'){
    window.handleCSV = function(e){
      var file = e.target.files[0];
      var name = file ? file.name : 'file';
      OSSLoader.show('Mengimpor data', 'Membaca: ' + name + '...');
      var origOnLoad = null;
      var origReader = window.FileReader;
      // Wrap with a short delay so loader renders first
      setTimeout(function(){
        _origHandleCSV(e);
        // Since handleCSV is async via FileReader, we patch the toast
      }, 80);
      // Hide loader after a realistic delay
      var t0 = Date.now();
      var checkDone = setInterval(function(){
        if(Date.now() - t0 > 2000){
          clearInterval(checkDone);
          OSSLoader.hide(200);
        }
      }, 100);
      // Also hook showToast to detect import finish
      var _origToast = window.showToast;
      window.showToast = function(msg, type){
        if(typeof msg === 'string' && msg.indexOf('Imported') === 0){
          clearInterval(checkDone);
          OSSLoader.update('Import berhasil ✓');
          OSSLoader.hide(350);
        }
        _origToast.apply(this, arguments);
        window.showToast = _origToast;
      };
    };
  }

  // 3. Export functions — patch download triggers
  function wrapExport(fnName, title, sub){
    var orig = window[fnName];
    if(typeof orig !== 'function') return;
    window[fnName] = function(){
      OSSLoader.show(title, sub);
      setTimeout(function(){
        try{ orig.apply(this, arguments); }catch(e){}
        OSSLoader.update('File siap diunduh ✓');
        OSSLoader.hide(600);
      }, 120);
    };
  }
  // Will run after page init so functions are defined
  setTimeout(function(){
    wrapExport('exportToWord',  'Mengekspor laporan', 'Membangun dokumen Word...');
    wrapExport('exportToExcel', 'Mengekspor ke Excel', 'Menulis data ke spreadsheet...');
    // detect CSV/APA export buttons via click delegation instead (handled below)
  }, 500);

  // 4. Hierarchical regression (async)
  setTimeout(function(){
    var _origHier = window.runHierarchicalReg;
    if(typeof _origHier === 'function'){
      window.runHierarchicalReg = function(){
        OSSLoader.show('Regresi hierarki', 'Membangun model bertahap...');
        setTimeout(function(){
          try{
            _origHier();
            OSSLoader.update('Analisis selesai ✓');
            OSSLoader.hide(320);
          }catch(e){
            OSSLoader.hide(0);
            showToast(e.message,'error');
          }
        }, 60);
      };
    }
  }, 300);

  // 5. execSyntax (async run all)
  setTimeout(function(){
    var _origExec = window.execSyntax;
    if(typeof _origExec === 'function'){
      window.execSyntax = async function(){
        OSSLoader.show('Menjalankan syntax', 'Mengeksekusi semua perintah...');
        try{
          await _origExec();
          OSSLoader.update('Eksekusi selesai ✓');
          OSSLoader.hide(320);
        }catch(e){
          OSSLoader.hide(0);
        }
      };
    }
  }, 400);

  // 6. Navigation between main pages (Home ↔ App)
  // Intercept via click delegation on nav items
  document.addEventListener('click', function(e){
    var item = e.target.closest('.s-item, .hero-cta, .s-logo');
    if(!item) return;
    // Only show brief loader for sidebar navigation switches
    if(item.classList.contains('s-item')){
      var text = item.textContent.trim().substring(0, 30);
      OSSLoader.show('Membuka halaman', 'Navigasi ke: ' + text + '...');
      OSSLoader.hide(420);
    }
  }, true);

  // 7. Tab switching inside pages (sub-tabs)
  document.addEventListener('click', function(e){
    var btn = e.target.closest('.sub-btn');
    if(!btn || !btn.dataset.tab) return;
    var tabName = btn.textContent.trim().substring(0, 24);
    OSSLoader.show('Memuat tampilan', 'Membuka: ' + tabName + '...');
    OSSLoader.hide(350);
  }, true);

  // 8. Impute / data processing
  setTimeout(function(){
    var _origImpute = window.runImpute;
    if(typeof _origImpute === 'function'){
      window.runImpute = function(){
        OSSLoader.show('Mengimputasi data', 'Mengisi nilai yang hilang...');
        try{ _origImpute(); OSSLoader.update('Imputasi selesai ✓'); OSSLoader.hide(300); }
        catch(e){ OSSLoader.hide(0); }
      };
    }
    var _origImputeAll = window.imputeAllVars;
    if(typeof _origImputeAll === 'function'){
      window.imputeAllVars = function(){
        OSSLoader.show('Mengimputasi semua variabel', 'Memproses semua kolom...');
        try{ _origImputeAll(); OSSLoader.update('Imputasi selesai ✓'); OSSLoader.hide(350); }
        catch(e){ OSSLoader.hide(0); }
      };
    }
  }, 500);

  // 9. Session save/restore indicator
  var _toastRef = window.showToast;
  setTimeout(function(){
    var _origSave;
    ['saveSession'].forEach(function(fn){
      if(typeof window[fn]==='function'){
        var orig = window[fn];
        window[fn] = function(){
          OSSLoader.show('Menyimpan sesi', 'Menulis data ke storage...');
          try{ orig.apply(this,arguments); OSSLoader.update('Tersimpan ✓'); OSSLoader.hide(280); }
          catch(e){ OSSLoader.hide(0); }
        };
      }
    });
  }, 600);

})();
