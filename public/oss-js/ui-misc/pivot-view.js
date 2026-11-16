// PIVOT VIEW
var pvState={row:'group',col:'gender',val:'score',fn:'mean'};
function renderPivot(el){
  const rv=[...new Set(data.map(r=>String(r[pvState.row])))].sort();
  const cv=[...new Set(data.map(r=>String(r[pvState.col])))].sort();
  const cell=(r,c)=>{const sub=SE.validNums(data.filter(x=>String(x[pvState.row])===r&&String(x[pvState.col])===c).map(x=>x[pvState.val]));if(!sub.length)return '—';
    try{switch(pvState.fn){case'mean':return SE.mean(sub).toFixed(2);case'sum':return sub.reduce((a,b)=>a+b,0).toFixed(0);case'count':return sub.length;case'min':return Math.min(...sub).toFixed(2);case'max':return Math.max(...sub).toFixed(2);case'std':return sub.length>=2?SE.std(sub).toFixed(2):'N/A';default:return SE.mean(sub).toFixed(2);}}catch{return 'Err';}};
  let html='<div class="card"><div class="sec-hd">Pivot Table</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:16px">';
  html+='<div>'+mkSelect('pv-row',allFields(),pvState.row,'pvState.row=val;renderPivot(document.getElementById(\'app-content\'))','Baris (Row)')+'</div>';
  html+='<div>'+mkSelect('pv-col',allFields(),pvState.col,'pvState.col=val;renderPivot(document.getElementById(\'app-content\'))','Kolom (Column)')+'</div>';
  html+='<div>'+mkSelect('pv-val',numFields(),pvState.val,'pvState.val=val;renderPivot(document.getElementById(\'app-content\'))','Nilai (Value)')+'</div>';
  html+='<div>'+mkCsel('pv-fn',['mean','sum','count','min','max','std'],pvState.fn,'pvState.fn=val;renderPivot(document.getElementById(\'app-content\'))','Fungsi')+'</div>';
  html+='</div>';
  if(!data.length||!vars.length){
    html+='<div class="chart-empty">Belum ada data. Muat atau impor data terlebih dahulu untuk menyusun tabel pivot.</div>';
  } else {
    html+='<div class="tbl-wrap"><table><thead><tr>';
    html+='<th>'+escHtml(pvState.row)+' \\ '+escHtml(pvState.col)+'</th>';
    cv.forEach(c=>html+='<th style="text-align:right">'+escHtml(c)+'</th>');
    html+='</tr></thead><tbody>';
    rv.forEach((r,ri)=>{
      html+='<tr class="'+(ri%2?'':'alt')+'"><td class="td-label">'+escHtml(r)+'</td>';
      cv.forEach(c=>{
        const v=cell(r,c);
        html+='<td class="td-num" style="color:'+(v==='—'?'var(--ink-subtle)':'var(--ink)')+'">'+v+'</td>';
      });
      html+='</tr>';
    });
    html+='</tbody></table></div>';
  }
  html+='</div>';
  el.innerHTML=html;
}
