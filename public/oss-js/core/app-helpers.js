// ════════════════════════════════════════════════════════════════════════
// APP HELPERS (AHP) — helper lintas-fitur yang dulu tersisa di app.js
// Dipindah byte-exact dari app.js (2026-10-04, split roadmap OSS 2.0):
//   showToast, runSafe, addOutput, tryStats
// Dimuat SEBELUM app.js (kategori 1, setelah html-helpers.js). Semua dependency
// (escHtml, outputs, updateBadges, _genSyntaxFromOutput, _syntaxHistory,
// currentTab, renderOutput) dibaca di dalam body fungsi saat runtime, bukan saat
// parse — pola sama file-file pre-app.js lain. _syntaxHistory dideklarasikan di
// js/ui-misc/syntax-view.js.
// ════════════════════════════════════════════════════════════════════════

function showToast(msg,type='success'){
  const t=document.getElementById('toast');
  var icon=type==='error'
    ?'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    :'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  t.innerHTML=icon+' '+escHtml(msg);
  t.className=type;t.style.display='flex';
  clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(()=>t.style.display='none',2600);
}
// runSafe — jalankan 1 analisis. Weight Cases diterapkan lewat runWithWeights()
// (js/data/weight-cases.js). opts.noWeight=true untuk aksi yang mengubah data.
function runSafe(fn,label,opts){
  try{runWithWeights(fn,opts);showToast(label+' berhasil');}catch(e){showToast(e.message,'error');}
}

function addOutput(item){
  var entry=Object.assign({id:Date.now()},item);
  // Tandai output yang dihitung dengan Weight Cases aktif (data sedang diexpand oleh runSafe)
  if(_wcRawData&&aState.wcActive){
    entry.wcInfo={wvar:aState.wcVar,nRaw:_wcRawData.length,nEff:data.length};
    if(entry.title) entry.title+=' [⚖ '+aState.wcVar+', N='+data.length+']';
  }
  outputs.unshift(entry);
  updateBadges();
  var syn=_genSyntaxFromOutput(item);
  if(syn){
    _syntaxHistory.unshift({ts:Date.now(),title:item.title||item.type,syntax:syn});
    if(_syntaxHistory.length>30)_syntaxHistory.length=30;
  }
  // Show a toast notification instead of auto-switching to Output tab
  showToast('Analisis berhasil');
  // If user is already on output tab, refresh it live
  if(typeof currentTab!=='undefined' && currentTab==='output'){
    var _ocel=document.getElementById('app-content');
    if(_ocel) renderOutput(_ocel);
  }
}
function tryStats(fn){try{return fn();}catch(e){return{_err:true,msg:e.message};}}
