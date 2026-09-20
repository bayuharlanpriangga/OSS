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
// ⚠️ Temuan (belum diperbaiki, cuma dicatat): `getWeightedRows()`
// dicek dengan grep di seluruh app.js — fungsi ini TIDAK DIPANGGIL
// di mana pun selain disebut di komentar dokumentasi di atas
// `runWeightCases()`. Semua fitur Weight Cases yang aktif sekarang
// (badge "N efektif") hanya memakai `getNEff()`; tidak ada satupun
// fungsi analisis statistik (t-test, ANOVA, regresi, dll) yang
// benar-benar memanggil `getWeightedRows()` untuk menerapkan
// weighting ke perhitungannya. Kemungkinan besar fitur "Weight Cases"
// baru menghitung N efektif secara kosmetik, belum benar-benar
// mempengaruhi hasil analisis manapun — sepertinya fitur belum
// selesai diwire ke stats engine. Belum disentuh, tunggu konfirmasi
// user (mirip kasus `holmBonferroni` dead code di B7).
// ════════════════════════════════════════════════════════════

// WEIGHT HELPERS (defined early so all code can use them) 
function getNEff(){
  if(!aState.wcActive||!aState.wcVar) return data.length;
  var wv=aState.wcVar;
  return data.reduce(function(s,r){
    var w=Number(r[wv]);
    return s+(isFinite(w)&&w>0?Math.round(w):0);
  },0);
}
function getWeightedRows(){
  if(!aState.wcActive||!aState.wcVar) return data;
  var wv=aState.wcVar,result=[];
  data.forEach(function(row){
    var w=Number(row[wv]);
    if(!isFinite(w)||w<=0) return;
    var wInt=Math.max(1,Math.round(w));
    for(var i=0;i<wInt;i++) result.push(row);
  });
  return result.length?result:data;
}