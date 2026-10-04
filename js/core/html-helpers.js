// HTML HELPERS
// parsePValue — SATU-SATUNYA definisi (2026-10-04, duplikat 3 baris di apa-copy.js dihapus).
// Menerima angka mentah ATAU string terformat dari pFmt() mesin statistik ('0.032', '< .001',
// '<0.001', '= 0.032'). Awalan '<' dianggap "tepat di bawah" nilainya, jadi '< .001' -> <.001
// (bukan sama dengan .001) dan tetap dapat bintang '***'. Awalan '>' sebaliknya. Non-numerik
// ('N/A', '—', null, '') -> NaN, dan pemanggil sudah menangani lewat !isFinite().
function parsePValue(v){
  if(v===undefined||v===null)return NaN;
  if(typeof v==='number')return v;
  var m=String(v).trim().match(/^([<>≤≥=]?)\s*(.*)$/);
  var n=parseFloat(m[2]);
  if(!isFinite(n))return NaN;
  if(m[1]==='<')return n*(1-1e-9);
  if(m[1]==='>')return n*(1+1e-9);
  return n;
}
function sigBadge(p){
  const pf=parsePValue(p);
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

// escHtml — dipindah dari app.js (AHP, 2026-10-04), byte-exact. Helper global dipakai banyak file.
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
