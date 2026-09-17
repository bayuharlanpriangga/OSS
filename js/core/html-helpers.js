// ════════════════════════════════════════════════════════════════════════
// HTML HELPERS
// ════════════════════════════════════════════════════════════════════════
// DIPINDAH dari app.js (C4, split roadmap OSS 2.0) — dipindah apa adanya
// jadi fungsi global biasa, pola sama C1/C2. `stCard`/`mkTable` memanggil
// `escHtml` (masih di app.js, function declaration di-hoist di scope
// app.js sendiri) — aman karena hanya dipanggil saat render (runtime,
// setelah app.js selesai dimuat), bukan saat parse file ini. Dimuat
// SEBELUM app.js (kategori "1. Core & state" di index.html).
function sigBadge(p){
  const pf=parseFloat(p);
  if(!isFinite(pf))return '';
  if(pf<.001)return '<span class="tag tag-pink">p &lt; .001 ***</span>';
  if(pf<.01) return '<span class="tag tag-orange">p = '+p+' **</span>';
  if(pf<.05) return '<span class="tag tag-yellow">p = '+p+' *</span>';
  return '<span class="tag tag-gray">p = '+p+' ns</span>';
}
function stCard(label,value,note=''){
  return '<div class="sb"><div class="sb-label">'+escHtml(label)+'</div><div class="sb-value">'+(value??'N/A')+'</div>'+(note?'<div class="sb-note">'+note+'</div>':'')+'</div>';
}
function mkTable(headers,rows,cls){
  let h='<div class="tbl-wrap"><table'+(cls?' class="'+cls+'"':'')+'><thead><tr>';
  headers.forEach(hh=>h+='<th>'+escHtml(hh)+'</th>');
  h+='</tr></thead><tbody>';
  rows.forEach((row,ri)=>{h+='<tr class="'+(ri%2?'':'alt')+'">';row.forEach((cell,ci)=>h+='<td class="'+(ci===0?'td-label':'')+'">'+(cell??'—')+'</td>');h+='</tr>';});
  return h+'</tbody></table></div>';
}
function selOpts(fields,current){return fields.map(f=>'<option value="'+f+'"'+(f===current?' selected':'')+'>'+f+'</option>').join('');}
