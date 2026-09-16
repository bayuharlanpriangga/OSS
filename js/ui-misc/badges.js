// ════════════════════════════════════════════════════════════
// js/ui-misc/badges.js
// Fitur: updateBadges() — badge N=cases, missing, output, weight cases, dll
// Catatan: sebelumnya ada 2 versi updateBadges() di app.js (dead code lama
//   ~baris 3315 dgn target #badge-vars/#badge-out/#wc-badge, dan versi aktif
//   ini). User sudah konfirmasi (2026-09-13): pakai versi ini, versi lama dihapus.
// Depends on: missCount(), aState.wcActive, getNEff(), data[], outputs[],
//   renderDsSidebar() (js/data/dataset-manager.js — belum dipisah)
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// UPDATE BADGES
// ════════════════════════════════════════════════════════════
function updateBadges(){
  var mc=missCount().reduce(function(s,v){return s+v.count;},0);
  var nDisp=aState.wcActive?getNEff():data.length;
  // Side nav badges
  var bc=document.getElementById('badge-cases');
  if(bc)bc.textContent='● N='+nDisp+(aState.wcActive?' (ΣW)':'')+' cases';
  var bm=document.getElementById('badge-miss');
  if(bm){bm.textContent=' '+mc+' missing';bm.style.display=mc>0?'flex':'none';}
  // Top bar badges (mobile)
  var tbc=document.getElementById('tb-cases');
  if(tbc)tbc.textContent='N='+nDisp+(aState.wcActive?'(ΣW)':'');
  var tbm=document.getElementById('tb-miss');
  if(tbm){tbm.style.display=mc>0?'inline-flex':'none';}
  // Output badge
  var ob=document.getElementById('out-badge');
  if(ob){ob.textContent=outputs.length;ob.style.display=outputs.length>0?'inline':'none';}
  // Refresh dataset sidebar
  renderDsSidebar();
}
