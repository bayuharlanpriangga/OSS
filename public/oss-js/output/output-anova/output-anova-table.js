// ANOVA Source Table renderer
function renderAnovaTable(effects, error, total){
  var h='<div class="tbl-wrap"><table><thead><tr>';
  ['Source','SS','df','MS','F','p','η²','ηₚ²'].forEach(function(c,ci){
    h+='<th'+(ci>0?' style="text-align:right"':'')+'>'+c+'</th>';
  });
  h+='</tr></thead><tbody>';
  effects.forEach(function(e,i){
    var sc=e.sig?'var(--ok)':'var(--ink-muted)';
    h+='<tr class="'+(i%2?'':'alt')+'">';
    h+='<td class="td-label" style="font-weight:700;color:'+(e.source.indexOf('×')>=0?'var(--warn)':'var(--ink)')+'">'+e.source+'</td>';
    ['SS','df','MS','F'].forEach(function(k){h+='<td class="td-num" style="font-family:var(--font-mono-stack)">'+e[k]+'</td>';});
    h+='<td class="td-num"><span style="font-weight:700;color:'+sc+'">'+e.p_fmt+'</span>'+(e.sig?' <span style="font-size:10px;color:var(--ok)">*</span>':'')+'</td>';
    h+='<td class="td-num" style="font-family:var(--font-mono-stack)">'+e.eta2+'</td>';
    h+='<td class="td-num" style="font-family:var(--font-mono-stack)">'+e.pEta2+'</td>';
    h+='</tr>';
  });
  // Error row
  h+='<tr style="background:var(--surface-alt)"><td class="td-label" style="color:var(--ink-muted)">Error</td>';
  h+='<td class="td-num" style="font-family:var(--font-mono-stack)">'+error.SS+'</td><td class="td-num">'+error.df+'</td><td class="td-num" style="font-family:var(--font-mono-stack)">'+error.MS+'</td><td colspan="4" style="text-align:right;color:var(--ink-subtle)">—</td></tr>';
  // Total row
  if(total){
    h+='<tr style="background:var(--surface-alt)"><td class="td-label" style="color:var(--ink-muted);font-weight:700">Total</td>';
    h+='<td class="td-num" style="font-family:var(--font-mono-stack)">'+total.SS+'</td><td class="td-num">'+total.df+'</td><td colspan="5" style="text-align:right;color:var(--ink-subtle)">—</td></tr>';
  }
  h+='</tbody></table></div>';
  return h;
}
