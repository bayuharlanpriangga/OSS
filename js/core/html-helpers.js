// HTML HELPERS
function parsePValue(v){
  if(v===undefined||v===null)return NaN;
  if(typeof v==='number')return v;
  var s=String(v).trim().replace(/^[<>≤≥=]\s*/,'');
  return parseFloat(s);
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
