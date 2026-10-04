// ════════════════════════════════════════════════════════════
// js/data/weight-cases.js
// [B23] Weight Cases — helper logic (non-UI)
// Fitur: getNEff() — hitung N efektif (ΣW) dari variabel bobot
// aktif tanpa mengubah data fisik; getWeightedRows() — hasilkan
// array VIRTUAL berbobot (setiap baris digandakan sebanyak bobot
// bulatnya) untuk dipakai perhitungan statistik yang butuh
// weighting, tanpa pernah mengexpand `data` yang sesungguhnya.
// Depends on: `aState.wcActive`/`aState.wcVar` (state global) dan
// `data` (dataset aktif, global) — dibaca di dalam function body
// saat dipanggil (runtime), aman dimuat SEBELUM app.js karena
// `aState`/`data` baru benar-benar terisi saat app.js jalan, bukan
// saat file ini di-parse.
// TIDAK termasuk di sini (tetap di app.js, UI wiring): runWeightCases,
// clearWeightCases (depends `document.getElementById`, `updateBadges`,
// `showToast`, `renderASub`).
//
// ✅ DIPERBAIKI (2026-10-05): getWeightedRows() sekarang benar-benar
// dipakai. runSafe() (js/core/app-helpers.js) menukar `data` global
// dengan getWeightedRows() selama satu analisis berjalan, lalu
// mengembalikannya (try/finally). Akibatnya SEMUA run* yang lewat
// runSafe (t-test, ANOVA, regresi, korelasi, dst) otomatis memakai
// baris tereplikasi (frequency weight): N, df, SE, p ikut berubah,
// sama seperti SPSS "Weight Cases". Selama penukaran, data asli
// disimpan di `_wcRawData` supaya getNEff()/getWeightedRows() tetap
// membaca data ASLI (bukan yang sudah diexpand) — mencegah bobot
// terhitung dua kali (mis. saat addOutput → updateBadges → getNEff).
// ════════════════════════════════════════════════════════════

// WEIGHT HELPERS (defined early so all code can use them) 
// Data mentah (belum diexpand). `_wcRawData` hanya terisi selama runSafe
// menjalankan analisis berbobot; selain itu = `data` biasa.
var _wcRawData=null;
function _wcBase(){ return _wcRawData||data; }
// Batas aman jumlah baris virtual hasil replikasi (mencegah browser hang).
var WC_MAX_ROWS=1000000;

function getNEff(){
  var base=_wcBase();
  if(!aState.wcActive||!aState.wcVar) return base.length;
  var wv=aState.wcVar;
  return base.reduce(function(s,r){
    var w=Number(r[wv]);
    return s+(isFinite(w)&&w>0?Math.round(w):0);
  },0);
}
function getWeightedRows(){
  var base=_wcBase();
  if(!aState.wcActive||!aState.wcVar) return base;
  var wv=aState.wcVar,result=[];
  base.forEach(function(row){
    var w=Number(row[wv]);
    if(!isFinite(w)||w<=0) return;
    var wInt=Math.max(1,Math.round(w));
    for(var i=0;i<wInt;i++) result.push(row);
  });
  return result.length?result:base;
}

// runWithWeights — jalankan fn() dengan `data` global ditukar sementara oleh
// baris virtual berbobot jika Weight Cases AKTIF; SELALU dikembalikan (finally).
// opts.noWeight=true untuk aksi yang MENGUBAH data (mis. Multiple Imputation),
// supaya jalan di data asli. Dipanggil dari runSafe (app-helpers.js) DAN dari
// pembungkus runSafe di activity-loading-popup.js (yang menimpa window.runSafe).
function runWithWeights(fn,opts){
  if((opts&&opts.noWeight)||!aState.wcActive||!aState.wcVar) return fn();
  var nEff=getNEff();
  if(nEff>WC_MAX_ROWS) throw new Error('Weight Cases: N efektif (ΣW='+nEff+') melebihi batas '+WC_MAX_ROWS+' baris. Skala bobot lebih kecil.');
  var orig=data;
  _wcRawData=orig;
  data=getWeightedRows();
  try{ return fn(); }
  finally{ data=orig; _wcRawData=null; }
}
