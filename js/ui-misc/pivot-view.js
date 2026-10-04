// ════════════════════════════════════════════════════════════
// js/ui-misc/pivot-view.js
// Fitur (I2): tab Pivot — tabel pivot (row x column x value) dengan
//   fungsi agregasi mean/sum/count/min/max/std.
// Depends on (dibaca runtime, di dalam function body — aman dimuat
//   sebelum app.js): SE (validNums, mean, std), data, allFields(),
//   numFields(), mkSelect()/mkCsel() (html-helpers.js / custom-select.js),
//   escHtml().
// Dipanggil oleh: js/core/router.js (renderPivot).
// Catatan: dipindah byte-exact dari app.js (I2, 2026-10-04); tidak ada
//   perubahan logic. TEMUAN (belum diperbaiki): handler onchange keempat
//   dropdown memanggil renderPivot(document.getElementById('view-pivot')),
//   elemen itu tidak ada -> lihat Temuan I2 di ARCHITECTURE.md.
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════
// PIVOT VIEW
// ════════════════════════════════════════════════════════════════════════
var pvState={row:'group',col:'gender',val:'score',fn:'mean'};
function renderPivot(el){
  const rv=[...new Set(data.map(r=>String(r[pvState.row])))].sort();
  const cv=[...new Set(data.map(r=>String(r[pvState.col])))].sort();
  const cell=(r,c)=>{const sub=SE.validNums(data.filter(x=>String(x[pvState.row])===r&&String(x[pvState.col])===c).map(x=>x[pvState.val]));if(!sub.length)return '—';
    try{switch(pvState.fn){case'mean':return SE.mean(sub).toFixed(2);case'sum':return sub.reduce((a,b)=>a+b,0).toFixed(0);case'count':return sub.length;case'min':return Math.min(...sub).toFixed(2);case'max':return Math.max(...sub).toFixed(2);case'std':return sub.length>=2?SE.std(sub).toFixed(2):'N/A';default:return SE.mean(sub).toFixed(2);}}catch{return 'Err';}};
  let html='<div class="card" style="margin-bottom:12px"><div class="row" style="flex-wrap:wrap;gap:8px">';
  html+=mkSelect('pv-row',allFields(),pvState.row,'pvState.row=val;renderPivot(document.getElementById(\'view-pivot\'))','Row');
  html+=mkSelect('pv-col',allFields(),pvState.col,'pvState.col=val;renderPivot(document.getElementById(\'view-pivot\'))','Column');
  html+=mkSelect('pv-val',numFields(),pvState.val,'pvState.val=val;renderPivot(document.getElementById(\'view-pivot\'))','Value');
  html+=mkCsel('pv-fn',['mean','sum','count','min','max','std'],pvState.fn,'pvState.fn=val;renderPivot(document.getElementById(\'view-pivot\'))','Function');
  html+='</div></div>';
  html+='<div class="card"><div class="tbl-wrap"><table><thead><tr>';
  html+='<th style="color:#818cf8">'+escHtml(pvState.row)+' \\ '+escHtml(pvState.col)+'</th>';
  cv.forEach(c=>html+='<th style="color:#60a5fa">'+escHtml(c)+'</th>');
  html+='</tr></thead><tbody>';
  rv.forEach((r,ri)=>{html+='<tr class="'+(ri%2?'':'alt')+'"><td style="font-weight:700;color:#a78bfa">'+escHtml(r)+'</td>';
    cv.forEach(c=>{const v=cell(r,c);html+='<td style="text-align:right;color:'+(v==='—'?'#334155':'#e2e8f0')+'">'+v+'</td>';});
    html+='</tr>';});
  html+='</tbody></table></div></div>';
  el.innerHTML=html;
}
